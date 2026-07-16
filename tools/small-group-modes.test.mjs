import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

import { bootSmallGroup } from "../engine/core/small-group-renderer.js";
import { onRequest as siteMiddleware } from "../functions/_middleware.js";
import { onRequest as teacherRoute } from "../functions/teacher-small-group/[[path]].js";

const apiPath = new URL("../functions/teacher-small-group/[[path]].js", import.meta.url);
assert.equal(existsSync(apiPath), true, "teacher access must have a server-side API");

const middleware = readFileSync(new URL("../functions/_middleware.js", import.meta.url), "utf8");
assert.match(middleware, /smallGroup/, "public small-group configs must be sanitized");

const renderer = readFileSync(
  new URL("../engine/core/small-group-renderer.js", import.meta.url),
  "utf8",
);
assert.match(renderer, /mountSmallGroupTeacherAccess/, "pages must mount secure mode controls");
assert.match(renderer, /sg-tabs/, "student lessons must use a tabbed instructional sequence");
assert.match(renderer, /Vocabulary/, "the sequence must begin with a simple vocabulary review");
assert.match(renderer, /Learn it/, "student flow must use short, action-led section labels");
assert.match(
  renderer,
  /Guided practice/,
  "students must practice with guidance before working alone",
);
assert.match(renderer, /Show what you know/, "student quick check must have a clear purpose");
assert.match(renderer, /More practice/, "students need an additional practice set at the end");
assert.doesNotMatch(
  renderer,
  /return out\.slice\(0, 6\)/,
  "the renderer must not truncate practice at six items",
);
assert.doesNotMatch(
  renderer,
  /localStorage\.getItem\("nt-teacher-mode"\)/,
  "teacher mode must not trust a browser flag",
);

const generator = readFileSync(
  new URL("./generate-small-group-lessons.mjs", import.meta.url),
  "utf8",
);
assert.match(
  generator,
  /MINIMUM_PRACTICE = 10/,
  "generated small groups need at least ten practice items",
);

const rawConfig = {
  lessonId: "1-1-group1",
  title: "1.1 Small Group · Group 1",
  smallGroup: { who: "Teacher-only grouping note", moves: ["Model first."], frames: [] },
};
const publicResponse = await siteMiddleware({
  request: new Request("https://example.test/lessons/1-1-group1/config.json"),
  env: {},
  next: async () =>
    new Response(JSON.stringify(rawConfig), {
      headers: { "content-type": "application/json" },
    }),
});
assert.equal(
  (await publicResponse.json()).smallGroup,
  undefined,
  "student responses must remove facilitation",
);
const unconfiguredTeacher = await siteMiddleware({
  request: new Request("https://example.test/teacher-small-group/1-1-group1/data"),
  env: {},
  next: async () => new Response("must not be reached"),
});
assert.equal(
  unconfiguredTeacher.status,
  503,
  "facilitation must fail closed without server protection",
);

const teacherResponse = await teacherRoute({
  request: new Request("https://example.test/teacher-small-group/1-1-group1/data"),
  env: {
    ASSETS: {
      fetch: async () =>
        new Response(JSON.stringify(rawConfig), {
          headers: { "content-type": "application/json" },
        }),
    },
  },
  params: { path: ["1-1-group1", "data"] },
});
assert.deepEqual((await teacherResponse.json()).smallGroup, rawConfig.smallGroup);

const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
  url: "https://example.test/lessons/1-1-group1/",
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Element: dom.window.Element,
});
const items = Array.from({ length: 12 }, (_, index) => ({
  type: "multiple-choice",
  stem: `Practice problem ${index + 1}`,
  choices: ["A", "B", "C", "D"],
  correctIndex: index % 4,
  explanation: "Use the lesson concept.",
  hints: ["Look back at the example."],
}));
bootSmallGroup({
  lessonId: "1-1-group1",
  variant: "group1",
  title: "1.1 Small Group · Group 1",
  standard: "6.TEST.1",
  contentObjective: "I can test the concept.",
  languageObjective: "I can explain my steps.",
  vocabulary: [
    { term: "factor", definition: "A number multiplied by another number." },
    { term: "product", definition: "The answer to multiplication." },
  ],
  launch: { conceptIntro: { keyIdea: "Use the concept one step at a time." } },
  practice: { approaching: items.slice(0, 6), onLevel: items.slice(6) },
  smallGroupPractice: { guidedCount: 4 },
  reflect: { exitTicket: items[0] },
});
assert.equal(
  document.querySelectorAll('[role="tab"]').length,
  6,
  "students must get six focused tabs",
);
assert.equal(
  document.querySelectorAll("section.sg-sec:not([hidden])").length,
  1,
  "only one lesson step may show at a time",
);
assert.equal(
  document.querySelectorAll(".sg-teacher").length,
  0,
  "student mode must not render teacher notes",
);
assert.equal(
  document.querySelectorAll("#sg-guided .prob").length,
  4,
  "guided practice must contain four problems",
);
assert.equal(
  document.querySelectorAll("#sg-practice .prob").length,
  4,
  "independent practice must have its own set",
);
assert.equal(
  document.querySelectorAll("#sg-more-practice .prob").length,
  4,
  "final practice must have its own set",
);

console.log("small-group teacher/student mode security and UX tests passed");
