import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { isRight } from "../engine/core/answer-match.js";
import { resolveVocabImage } from "../engine/core/vocab-images.js";
import { onRequest as middleware } from "../functions/_middleware.js";
import { onRequest as teacherRouteHandler } from "../functions/teacher-small-group/[[path]].js";
import { authoredBank } from "./lib/small-group-authored-banks.mjs";

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
// Locked apply steps stay visible as a dimmed roadmap instead of vanishing.
assert.match(smallGroupUi, /\.sg-apply-step\.locked\{opacity:\.35/);
// Whole-lesson print must expose paginated problems and later fill-in steps.
assert.match(smallGroupUi, /\.prob\[hidden\]\{display:block!important\}/);

const generator = readFileSync(
  new URL("./generate-small-group-lessons.mjs", import.meta.url),
  "utf8",
);
assert.match(generator, /MINIMUM_PRACTICE = 10/);

// Answer checker: tolerant of real grade-6 input, strict about wrong answers.
assert.equal(isRight("$2.25", "2.25"), true, "dollar signs must not fail a correct answer");
assert.equal(isRight("1/2", "0.5"), true, "fraction vs decimal equivalence");
assert.equal(isRight("1 7/8", "15/8"), true, "mixed number vs improper fraction");
assert.equal(isRight("2x3x7", "2 × 3 × 7"), true, "keyboard × equivalence");
assert.equal(isRight("1,2,3,6", "1, 2, 3, 6"), true, "list spacing equivalence");
assert.equal(isRight("3.50", "3.5"), true, "trailing zero equivalence");
assert.equal(isRight(".5", "0.5"), true, "leading-dot decimal equivalence");
assert.equal(isRight("$.50", "0.5"), true, "dollar + leading-dot equivalence");
assert.equal(isRight(".50 per", "0.5"), true, "trailing 'per' must not fail a correct rate");
assert.equal(isRight("$0.50 per token", "0.5"), true, "full rate phrasing equivalence");
assert.equal(isRight("2", "2 × 3 × 7"), false, "first digit must not pass a product answer");
assert.equal(isRight("2", "x + 2 = 4"), false, "a digit must not pass an equation answer");
assert.equal(isRight("4", "3.5"), false, "close is not correct");

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
  // A lesson whose practice was authored against its own objective carries no
  // generated guided-fill bank — its tasks are reasoning items in the practice
  // tiers. Assert the absence there rather than dropping the count, so a
  // truncated generator run is still caught for every other lesson.
  const parent2 = lessonId.replace(/-group[12]$/, "");
  if (authoredBank(parent2, lessonId.endsWith("group2") ? 2 : 1)) {
    assert.equal(
      config.parallelPractice,
      undefined,
      `${lessonId} has an authored practice set and should carry no parallel bank`,
    );
  } else {
    assert.equal(config.parallelPractice?.length, 12, `${lessonId} needs 12 parallel problems`);
  }
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
  for (const word of config.vocabulary || []) {
    const imagePath = resolveVocabImage(word.term, word.image);
    assert.ok(
      existsSync(new URL(`..${imagePath}`, import.meta.url)),
      `${lessonId}/${word.term} is missing ${imagePath}`,
    );
  }
  // Surface Area Using Nets — 10-3 under the old numbering.
  if (parentId === "5-6") {
    assert.ok(
      config.parallelPractice.every((item) => /net.*length.*width.*height/i.test(item.stem)),
      `${lessonId} net practice needs explicit dimensions`,
    );
  }
  // Surface Area of Prisms — 10-4 under the old numbering.
  if (parentId === "5-7") {
    assert.ok(
      config.parallelPractice.some((item) => /triangular prism/i.test(item.stem)),
      `${lessonId} needs triangular-prism surface-area practice`,
    );
  }
  // Surface Area of Pyramids — 10-5 under the old numbering.
  if (parentId === "5-8") {
    assert.ok(
      config.parallelPractice.every((item) => /base edge.*slant height/i.test(item.stem)),
      `${lessonId} pyramid practice needs explicit base and slant height`,
    );
  }
}

const publicConfig = {
  lessonId: "1-1-group1",
  smallGroup: { moves: ["private move"] },
  connect: { talk: { prompt: "Student prompt", listenFor: "private checkpoint" } },
};
const publicResponse = await middleware({
  request: new Request("https://example.test/lessons/6-13-group1/config.json"),
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

const answerKeyClosed = await middleware({
  request: new Request("https://example.test/math/unit-1/projects/answer-key/"),
  env: {},
  next: async () => new Response("unexpected"),
});
assert.equal(answerKeyClosed.status, 503, "project answer keys must fail closed when unconfigured");

const teacherResponse = await teacherRouteHandler({
  request: new Request("https://example.test/teacher-small-group/1-1-group1/data"),
  params: { path: ["1-1-group1", "data"] },
});
const teacherPayload = await teacherResponse.json();
assert.equal(teacherPayload.facilitation.label, "Extra Support");
assert.ok(teacherPayload.facilitation.listenFor.length >= 1);

/*
 * Teacher moves are ASK / LOOK FOR / IF STUCK, not the old prose `moves` list.
 * That list was replaced because 756 of its 840 lines across the fleet repeated
 * in 50+ lessons; asserting only that three bullets existed is what let that
 * happen unnoticed, so this pins the STRUCTURE and the specificity instead.
 */
const tm = teacherPayload.facilitation.teacherMoves;
assert.ok(tm, "support facilitation must carry teacherMoves");
for (const key of ["ask", "lookFor", "ifStuck"]) {
  assert.equal(typeof tm[key], "string", `teacherMoves.${key} must be a string`);
  assert.ok(tm[key].trim().length > 12, `teacherMoves.${key} must say something`);
}
assert.ok(!tm.extend, "a support group gets no EXTEND — the re-teach has to finish");

const challengeResponse = await teacherRouteHandler({
  request: new Request("https://example.test/teacher-small-group/1-1-group2/data"),
  params: { path: ["1-1-group2", "data"] },
});
const challengePayload = await challengeResponse.json();
const ctm = challengePayload.facilitation.teacherMoves;
assert.ok(ctm, "challenge facilitation must carry teacherMoves");
assert.ok(ctm.extend && ctm.extend.trim().length > 12, "challenge must carry an EXTEND move");
// The two pathways must not be the same guidance with different numbers.
assert.notEqual(ctm.ask, tm.ask, "challenge ASK must differ from support ASK");
assert.notEqual(ctm.ifStuck, tm.ifStuck, "challenge IF STUCK must differ from support");

const dom = new JSDOM(
  '<!doctype html><html><head></head><body><div id="app"></div></body></html>',
  {
    url: "https://example.test/lessons/6-13-group1/",
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
  readFileSync(new URL("../lessons/6-13-group1/config.json", import.meta.url), "utf8"),
);
const { bootSmallGroup } = await import("../engine/core/small-group-renderer.js");
bootSmallGroup(runtimeConfig);
const firstGuided = document.querySelector("#sg-guided-practice .prob");
assert.ok(
  firstGuided?.querySelector(".sg-problem-visual, .sg-problem-model, .colmath"),
  "guided problems need a model students can see or type into",
);
assert.ok(firstGuided?.querySelector(".sg-guided-steps"), "guided problems need fill-in steps");
// 1-1 is a factor-tree lesson: its model must be typed-in, and a correct
// model entry must auto-complete the matching guided step.
const modelCells = firstGuided?.querySelectorAll(".sg-problem-model .sg-model-cell") || [];
assert.ok(modelCells.length >= 2, "typed models need student input cells");
const firstStepAnswer = runtimeConfig.parallelPractice[0].steps[0].answer;
modelCells[0].value = String(firstStepAnswer);
modelCells[0].dispatchEvent(new dom.window.Event("blur"));
assert.ok(modelCells[0].classList.contains("ok"), "a correct model entry locks in");
assert.ok(
  firstGuided.querySelector(".sg-fill-step").classList.contains("complete"),
  "a correct model entry completes the matching guided step",
);
// Layout contracts: mission caps More Practice; partner talk lives in Practice.
assert.ok(
  document.querySelector("#sg-tab-more #sg-launch"),
  "the mission briefing belongs at the end, in More Practice",
);
assert.ok(
  document.querySelector("#sg-tab-practice #sg-talk"),
  "partner talk belongs inside the Practice tab",
);
assert.equal(
  document.querySelector(".sg-design-lab"),
  null,
  "the Create-a-Challenge lab is removed",
);
// Passport bridge installs without a passport layer present and never throws.
const { installSmallGroupPassport } = await import("../engine/core/small-group-passport.js");
const passportStore = (() => {
  const data = {};
  return {
    get: (name, fallback) => (data[name] === undefined ? fallback : data[name]),
    set: (name, value) => {
      data[name] = value;
    },
    addTo: (name, value) => {
      data[name] = [...(data[name] || []), value];
    },
    has: (name, value) => Array.isArray(data[name]) && data[name].includes(value),
  };
})();
assert.equal(
  installSmallGroupPassport({ lessonId: "1-1-group1", store: passportStore, events: {} }),
  true,
  "passport bridge arms without throwing even when the passport layer is absent",
);
// Vocabulary keeps its illustrations (word + definition + image); everywhere
// else, only problem-related SVG models may render — no photos or decor.
const vocabCardImages = [...document.querySelectorAll("#sg-vocab .sg-vcard img")];
// Assert the invariant (one illustration per card), not a fixed term count —
// the generator's vocabulary cap moved from 4 to 8 once the render cap did.
const vocabCards = [...document.querySelectorAll("#sg-vocab .sg-vcard")];
assert.ok(vocabCards.length >= 4, "vocabulary section renders its cards");
assert.equal(
  vocabCardImages.length,
  vocabCards.length,
  "every vocabulary card needs an illustration",
);
for (const image of vocabCardImages) {
  assert.match(image.getAttribute("src"), /^\/assets\/vocab-images\/[a-z0-9-]+\.svg$/);
  assert.ok(image.getAttribute("alt"), "vocabulary images need useful alternative text");
}
assert.equal(
  [...document.querySelectorAll("#app img")].filter((image) => !image.closest(".sg-vcard")).length,
  0,
  "no images outside vocabulary cards (mission photos stay removed)",
);
assert.ok(
  document.querySelector(".sg-meter-fill"),
  "the sticky rail needs the always-visible progress meter",
);

// --- the teacher door is not in a student SCORM package ---------------------
// mountSmallGroupTeacherAccess() mounts a "Student Mode / Teacher access" bar
// whose link points at /teacher-small-group/<id>/. Harmless on the open web.
// Inside a SCORM package it sits in the iframe the LMS is grading, so a student
// who taps it navigates the tracked frame off the lesson — and it is teacher
// UI in a student assignment either way. Core lessons never showed one; this
// only became reachable when the 168 group1/group2 variants were added to the
// SCORM catalog. Guarded by isScormLaunch(), the single reader of that question.
{
  const src = readFileSync(
    new URL("../engine/core/small-group-teacher-access.js", import.meta.url),
    "utf8",
  );
  assert.match(
    src,
    /import \{ isScormLaunch \} from "\.\/scorm-bridge\.js"/,
    "small-group teacher access must ask scorm-bridge, not re-derive the SCORM test",
  );
  assert.match(
    src,
    /if \(isScormLaunch\(\)\) return false;/,
    "a SCORM launch must mount no teacher-access bar at all",
  );
  // The guard has to come BEFORE the student-mode bar is mounted, or the bar
  // still renders and the check is decorative.
  const guardAt = src.indexOf("if (isScormLaunch()) return false;");
  const barAt = src.indexOf('mountBar(app, modeBar("student"');
  assert.ok(
    guardAt > 0 && barAt > guardAt,
    "the SCORM guard must precede mounting the student bar",
  );
}

console.log("small-group mode, structure, and practice contracts passed");
