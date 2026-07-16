import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { isImageSource } from "../engine/core/small-group-engagement.js";
import { resolveVocabImage } from "../engine/core/vocab-images.js";
import { onRequest as middleware } from "../functions/_middleware.js";
import { onRequest as teacherRouteHandler } from "../functions/teacher-small-group/[[path]].js";

const teacherRoute = new URL("../functions/teacher-small-group/[[path]].js", import.meta.url);
assert.equal(existsSync(teacherRoute), true, "teacher facilitation needs a protected server route");

const renderer = readFileSync(
  new URL("../engine/core/small-group-renderer.js", import.meta.url),
  "utf8",
);
assert.match(renderer, /mountSmallGroupTabs/, "student lessons must use a focused tab sequence");
assert.match(
  renderer,
  /mountSmallGroupTeacherAccess/,
  "teacher mode must use server authentication",
);
assert.doesNotMatch(renderer, /localStorage\.getItem\("nt-teacher-mode"\)/);

const practice = readFileSync(
  new URL("../engine/core/small-group-practice.js", import.meta.url),
  "utf8",
);
assert.match(practice, /paginateProblems/, "practice sets must show one problem at a time");
assert.doesNotMatch(practice, /return items\.slice\(0, 6\)/);
const smallGroupUi = readFileSync(
  new URL("../engine/core/small-group-ui.js", import.meta.url),
  "utf8",
);
assert.match(smallGroupUi, /\.sg-fill-step\[hidden\]\{display:none/);
assert.match(smallGroupUi, /\.sg-apply-step\.locked\{display:none/);

const generator = readFileSync(
  new URL("./generate-small-group-lessons.mjs", import.meta.url),
  "utf8",
);
assert.match(generator, /MINIMUM_PRACTICE = 10/);
assert.equal(isImageSource("Space station cargo bay with robots"), false);
assert.equal(isImageSource("/assets/mission.png"), true);

for (const lessonId of readdirSync(new URL("../lessons", import.meta.url)).filter((name) =>
  /^\d+-\d+-group[12]$/.test(name),
)) {
  const configText = readFileSync(
    new URL(`../lessons/${lessonId}/config.json`, import.meta.url),
    "utf8",
  );
  const config = JSON.parse(configText);
  assert.equal(config.smallGroup, undefined, `${lessonId} public config leaked teacher moves`);
  assert.equal(configText.includes('"listenFor"'), false, `${lessonId} leaked listen-for notes`);
  const parentId = lessonId.replace(/-group[12]$/, "");
  const parent = JSON.parse(
    readFileSync(new URL(`../lessons/${parentId}/config.json`, import.meta.url), "utf8"),
  );
  const parentStems = new Set(
    ["approaching", "onLevel", "extending", "optional"].flatMap((tier) =>
      (parent.practice?.[tier] || []).map(
        (item) => item.stem || item.title || item.instructions || item.prompt,
      ),
    ),
  );
  assert.equal(config.parallelPractice?.length, 12, `${lessonId} needs 12 parallel problems`);
  const ids = new Set();
  const parallelStems = new Set();
  for (const item of config.parallelPractice || []) {
    assert.ok(item.id && !ids.has(item.id), `${lessonId} needs unique problem IDs`);
    ids.add(item.id);
    assert.ok(!parallelStems.has(item.stem), `${lessonId} repeated a parallel-problem stem`);
    parallelStems.add(item.stem);
    assert.equal(parentStems.has(item.stem), false, `${lessonId} repeated a parent problem`);
    assert.ok(item.answer != null, `${lessonId}/${item.id} needs a checkable answer`);
    assert.doesNotMatch(String(item.answer), /NaN|undefined|Infinity/);
    assert.ok(item.visual?.kind, `${lessonId}/${item.id} needs a visual model`);
    assert.ok(item.steps?.length >= 2, `${lessonId}/${item.id} needs guided steps`);
  }
  if (parentId === "10-3") {
    assert.ok(
      config.parallelPractice.every((item) => /net.*length.*width.*height/i.test(item.stem)),
      `${lessonId} net practice needs explicit dimensions`,
    );
  }
  if (parentId === "10-4") {
    assert.ok(
      config.parallelPractice.some((item) => /triangular prism/i.test(item.stem)),
      `${lessonId} needs triangular-prism surface-area practice`,
    );
  }
  if (parentId === "10-5") {
    assert.ok(
      config.parallelPractice.every((item) => /base edge.*slant height/i.test(item.stem)),
      `${lessonId} pyramid practice needs explicit base and slant height`,
    );
  }
  for (const word of config.vocabulary || []) {
    const imagePath = resolveVocabImage(word.term, word.image);
    assert.ok(
      existsSync(new URL(`..${imagePath}`, import.meta.url)),
      `${lessonId}/${word.term} is missing ${imagePath}`,
    );
  }
}

const publicConfig = {
  lessonId: "1-1-group1",
  smallGroup: { moves: ["private move"] },
  connect: { talk: { prompt: "Student prompt", listenFor: "private checkpoint" } },
};
const publicResponse = await middleware({
  request: new Request("https://example.test/lessons/1-1-group1/config.json"),
  env: {},
  next: async () => Response.json(publicConfig),
});
const studentPayload = await publicResponse.json();
assert.equal(studentPayload.smallGroup, undefined, "student config must omit teacher moves");
assert.equal(
  studentPayload.connect.talk.listenFor,
  undefined,
  "student config must omit facilitation checkpoints",
);
assert.equal(studentPayload.connect.talk.prompt, "Student prompt");

const closedResponse = await middleware({
  request: new Request("https://example.test/teacher-small-group/1-1-group1/"),
  env: {},
  next: async () => new Response("unexpected"),
});
assert.equal(closedResponse.status, 503, "teacher access must fail closed when unconfigured");

const teacherResponse = await teacherRouteHandler({
  request: new Request("https://example.test/teacher-small-group/1-1-group1/data"),
  params: { path: ["1-1-group1", "data"] },
});
const teacherPayload = await teacherResponse.json();
assert.equal(teacherPayload.facilitation.label, "Extra Support");
assert.ok(teacherPayload.facilitation.moves.length >= 3);
assert.ok(teacherPayload.facilitation.listenFor.length >= 1);

const dom = new JSDOM(
  '<!doctype html><html><head></head><body><div id="app"></div></body></html>',
  {
    url: "https://example.test/lessons/1-1-group1/",
  },
);
for (const key of [
  "window",
  "document",
  "Node",
  "NodeFilter",
  "HTMLElement",
  "HTMLDialogElement",
  "localStorage",
  "navigator",
]) {
  Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};
dom.window.HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute("open", "");
};
const runtimeConfig = JSON.parse(
  readFileSync(new URL("../lessons/1-1-group1/config.json", import.meta.url), "utf8"),
);
const { bootSmallGroup } = await import("../engine/core/small-group-renderer.js");
bootSmallGroup(runtimeConfig);
const firstGuided = document.querySelector("#sg-guided-practice .prob");
assert.ok(firstGuided?.querySelector(".sg-problem-visual"), "guided problems need a large visual");
assert.ok(firstGuided?.querySelector(".sg-guided-steps"), "guided problems need fill-in steps");
assert.ok(firstGuided?.querySelector(".sg-math-tool"), "guided problems need an interactive tool");
assert.ok(
  firstGuided?.querySelectorAll(".sg-operator-chip").length >= 4,
  "the math tool needs operation tiles for building a model",
);
assert.ok(
  firstGuided?.querySelector(".sg-clear-model"),
  "the math tool needs a clear/retry control",
);
const vocabCardImages = [...document.querySelectorAll("#sg-vocab .sg-vcard img")];
assert.equal(vocabCardImages.length, 4, "every vocabulary card needs an illustration");
for (const image of vocabCardImages) {
  assert.match(image.getAttribute("src"), /^\/assets\/vocab-images\/[a-z0-9-]+\.svg$/);
  assert.ok(image.getAttribute("alt"), "vocabulary images need useful alternative text");
}

console.log("small-group mode, structure, and practice contracts passed");
