import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

const generator = readFileSync(
  new URL("./generate-small-group-lessons.mjs", import.meta.url),
  "utf8",
);
assert.match(generator, /MINIMUM_PRACTICE = 10/);

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
  env: {
    ASSETS: {
      fetch: async () => Response.json(publicConfig),
    },
  },
  params: { path: ["1-1-group1", "data"] },
});
const teacherPayload = await teacherResponse.json();
assert.deepEqual(teacherPayload.facilitation.moves, ["private move"]);
assert.deepEqual(teacherPayload.facilitation.listenFor, ["private checkpoint"]);

console.log("small-group mode, structure, and practice contracts passed");
