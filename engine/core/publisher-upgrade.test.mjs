import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { deriveHintLadder } from "./content-enrichment.js";
import { learningEvent, readLearningEvents, recordLearningEvent } from "./learning-events.js";
import { standardPlan } from "../../curriculum/map/panel.js";
import {
  DEMO_ROUTES,
  FAMILY_OPTIONAL_LINE,
  applyBothSides,
  connectedRatio,
  equationSolution,
  exponentProductBug,
  familyCopyRequiresWork,
  freshPowerItem,
  lessonTargetMismatches,
  powerValue,
  ratioScaleInvariant,
  repairExponent,
} from "./publisher-models.js";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("3^2 is 9, and 6 is the multiply-by-exponent bug", () => {
  const power = powerValue(3, 2);
  assert.equal(power.expansion, "3×3");
  assert.equal(power.value, 9);
  assert.equal(exponentProductBug(3, 2), 6);
  assert.notEqual(power.value, 6);
  const repair = repairExponent({ base: 3, exponent: 2, answer: 6 });
  assert.equal(repair.bug, true);
  assert.match(repair.message, /may indicate/i);
  assert.match(repair.message, /does not (show|prove)/i);
  assert.equal(repair.fresh.value, powerValue(repair.fresh.base, repair.fresh.exponent).value);
  assert.ok(repair.fresh.base !== 3 || repair.fresh.exponent !== 2);
  const fresh = freshPowerItem(3, 2);
  assert.equal(repairExponent({ base: 3, exponent: 2, answer: 9 }).correct, true);
  assert.equal(fresh.value, powerValue(fresh.base, fresh.exponent).value);
});

test("equivalent ratios stay equivalent when the scale factor changes", () => {
  for (const factor of [1, 2, 3, 4, 0.5]) {
    const model = connectedRatio(2, 3, factor);
    assert.equal(ratioScaleInvariant(model), true, `factor ${factor}`);
  }
  const four = connectedRatio(2, 3, 4);
  assert.deepEqual(four.quantity.totals, [8, 12]);
  assert.deepEqual(four.tape.totals, [8, 12]);
  assert.deepEqual(four.table.row, [8, 12]);
  assert.deepEqual([four.doubleNumberLine.x, four.doubleNumberLine.y], [8, 12]);
  assert.equal(four.symbolic, "2:3 = 8:12");
  assert.equal(four.unitRate, 1.5);
});

test("the same operation on both sides keeps the equation's solution", () => {
  const start = { p: 2, q: 3, r: 11 };
  const solution = equationSolution(start.p, start.q, start.r);
  assert.equal(solution, 4);
  const subtracted = applyBothSides(start, { type: "sub", k: 3 });
  assert.equal(equationSolution(subtracted.p, subtracted.q, subtracted.r), solution);
  const divided = applyBothSides(subtracted, { type: "div", k: 2 });
  assert.equal(equationSolution(divided.p, divided.q, divided.r), solution);
  const added = applyBothSides(divided, { type: "add", k: 5 });
  assert.equal(equationSolution(added.p, added.q, added.r), solution);
});

test("optional family practice copy does not require the work or award bonus points", () => {
  assert.equal(familyCopyRequiresWork(FAMILY_OPTIONAL_LINE.en), false);
  assert.equal(familyCopyRequiresWork(FAMILY_OPTIONAL_LINE.es), false);
  assert.equal(familyCopyRequiresWork("Finish this required homework."), true);
  assert.equal(familyCopyRequiresWork("Earn bonus points for this page."), true);
  assert.equal(familyCopyRequiresWork("0.15 × 60 = 9 bonus points."), false);
  const mission = read("scripts/lib/homework-mission.mjs");
  assert.match(mission, /optional and ungraded/i);
  assert.equal(familyCopyRequiresWork(mission.slice(mission.indexOf("hw-family-path"), mission.indexOf("hw-family-path") + 500)), false);
  const root = new URL("../../lessons/", import.meta.url);
  let pages = 0;
  for (const dir of readdirSync(root)) {
    const file = new URL(`${dir}/homework.html`, root);
    if (!existsSync(file)) continue;
    pages += 1;
    const html = readFileSync(file, "utf8");
    assert.equal(familyCopyRequiresWork(html), false, `${dir}/homework.html`);
  }
  assert.ok(pages >= 80, `expected family homework pages, found ${pages}`);
});

test("lesson 6-4 title, learning target, and standard name the same work", () => {
  const cfg = JSON.parse(read("lessons/6-4/config.json"));
  const standards = JSON.parse(read("data/ccss-standards.json"));
  assert.equal(cfg.lessonId, "6-4");
  assert.equal(cfg.standard, "6.AT.6c");
  assert.deepEqual(lessonTargetMismatches(cfg, standards[cfg.standard]), []);
  const part2 = JSON.parse(read("lessons/6-4-part2/config.json"));
  assert.notEqual(part2.lessonId, cfg.lessonId);
  assert.equal(existsSync(new URL("../../lessons/6-4-part2/index.html", import.meta.url)), true);
});

test("key curriculum routes exist as files", () => {
  const files = [
    ...DEMO_ROUTES.map((route) => route.file),
    ...DEMO_ROUTES.map((route) => route.also).filter(Boolean),
    "curriculum/map/index.html",
    "curriculum/forge/index.html",
    "curriculum/class-boss/index.html",
    "curriculum/planning/index.html",
    "curriculum/runtime/index.html",
    "curriculum/teach-the-machine/index.html",
    "curriculum/learning-labs/index.html",
    "curriculum/family-connections/index.html",
    "math/student-board/index.html",
    "teacher-tools/canvas-command-center/index.html",
    "teacher-tools/canvas-scorm/index.html",
    "graphic-novels/index.html",
    "lessons/6-4/index.html",
    "lessons/3-3-group1/index.html",
  ];
  for (const file of files) {
    assert.equal(existsSync(new URL(`../../${file}`, import.meta.url)), true, file);
  }
});

test("language toggle source does not clear in-progress answers", () => {
  const homework = read("scripts/homework-guided-notes.mjs");
  const start = homework.indexOf("function setLanguageMode");
  const end = homework.indexOf("function openConceptZoom");
  const body = homework.slice(start, end);
  assert.match(body, /Language only/);
  assert.doesNotMatch(body, /\.value\s*=/);
  assert.doesNotMatch(body, /localStorage\.clear/);
  const i18n = read("engine/core/i18n.js");
  const lang = i18n.slice(i18n.indexOf("export function setPreferredLang"), i18n.indexOf("export function t("));
  assert.match(lang, /does not clear in-progress answers/);
  assert.doesNotMatch(lang, /\.value\s*=/);
});

test("hint ladder roles are strategic, representation, then a parallel example", () => {
  const ladder = deriveHintLadder({ type: "multiple-choice" });
  assert.deepEqual(
    ladder.map((rung) => rung.role),
    ["strategic", "representation", "parallel"],
  );
});

test("a selected standard only lists prerequisites stored on the map", () => {
  const ratio = { id: "6.AT.3a", label: "Ratios", fullText: "Understand ratio concepts.", prereqs: [], unlocks: ["6.AT.3"], coverage: { l1: 2, l2: 1 }, assets: [] };
  const equivalent = {
    id: "6.AT.3",
    label: "Equivalent ratios",
    fullText: "Use equivalent ratios.",
    prereqs: ["6.AT.3a"],
    unlocks: [],
    coverage: { l1: 4, l2: 2 },
    assets: [
      { category: "Lesson", path: "/lessons/3-3/", title: "Equivalent ratios" },
      { category: "Practice", path: "/math/practice-studio/3-3/", title: "Practice studio" },
    ],
  };
  const byId = new Map([
    ["6.AT.3a", ratio],
    ["6.AT.3", equivalent],
  ]);
  const model = {
    byId,
    edge: (from, to) => (from === "6.AT.3a" && to === "6.AT.3" ? { why: "Equivalent ratios use a ratio.", strength: "essential" } : null),
  };
  const plan = standardPlan(model, equivalent);
  assert.deepEqual(plan.prerequisites.map((item) => item.id), ["6.AT.3a"]);
  assert.equal(plan.lessons.length, 1);
  assert.equal(plan.practice.length, 1);
  assert.equal(plan.support, 4);
  assert.equal(plan.challenge, 2);
  const bare = standardPlan(model, ratio);
  assert.deepEqual(bare.prerequisites, []);
});

test("learning events stay local and unnamed", () => {
  const saved = new Map();
  const storage = {
    getItem: (key) => saved.get(key) || null,
    setItem: (key, value) => saved.set(key, value),
  };
  const event = recordLearningEvent(
    {
      lesson_id: "6-4",
      skill: "6.AT.6c",
      attempt: 2,
      result: "incorrect",
      support_used: true,
      studentName: "Ada",
      initials: "AL",
    },
    storage,
  );
  assert.equal(event.schema_version, 1);
  assert.equal(event.lesson_id, "6-4");
  assert.equal(event.studentName, undefined);
  assert.equal(JSON.stringify(readLearningEvents(storage)).includes("Ada"), false);
  assert.equal(learningEvent({ lesson_id: "", result: "correct" }).lesson_id, "");
});
