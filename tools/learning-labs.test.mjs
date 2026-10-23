import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { grab, move } from "../curriculum/learning-labs/shared/direct.mjs";
import {
  controls,
  evaluate,
  numericAnswer,
  puzzle,
  statistics,
} from "../curriculum/learning-labs/shared/math.mjs";
import { guidance, visual } from "../curriculum/learning-labs/shared/model.mjs";
import { renderTier2DiagramStrip } from "../curriculum/learning-labs/shared/nextgen.mjs";
import { numberFeedback } from "../curriculum/learning-labs/shared/number-feedback.mjs";
import {
  activityStatus,
  overview,
  parseKeyIdea,
} from "../curriculum/learning-labs/shared/progress.mjs";
import { blueprints } from "./learning-labs/blueprints.mjs";
import { isLessonName } from "./learning-labs/vocabulary.mjs";
import {
  CORE_ID_RE,
  listLessonDirs,
  loadLessonConfig,
  REPO_ROOT,
} from "./lib/curriculum-source.mjs";

const catalogue = JSON.parse(readFileSync(join(REPO_ROOT, "data/learning-labs.json")));
const core = listLessonDirs({ filter: CORE_ID_RE }).sort();
const currentReveal = JSON.parse(
  readFileSync(join(REPO_ROOT, "tools/learning-labs/reveal-concept-source.json")),
);
const freshCheckLessons = new Set();
const covered = catalogue.labs.flatMap((l) => l.lessons).sort();
assert.deepEqual(covered, core, "Every core lesson must be covered exactly once");
assert.equal(catalogue.labCount, blueprints.length);
assert.equal(new Set(catalogue.labs.map((l) => l.id)).size, catalogue.labCount);
assert.equal(new Set(catalogue.labs.map((l) => l.title)).size, catalogue.labCount);
const unitsDOM = new JSDOM(readFileSync(join(REPO_ROOT, "curriculum/units/index.html"), "utf8"))
  .window.document;
const allTitles = new Set(core.map((id) => loadLessonConfig(id).title.trim().toLowerCase()));
const GENERIC_HINTS = new Set([
  "Name the given quantities and the quantity you need.",
  "Draw a model or write the relationship first. Check your answer in the original situation.",
  "Identify which quantities the requested measure uses.",
  "Use the relationship you explored in Investigate. Check with a second method.",
]);
let questions = 0,
  gameGoals = 0;
for (const item of catalogue.labs) {
  assert.ok(item.lessons.length >= 1 && item.lessons.length <= 2);
  if (item.lessons.length === 2)
    assert.equal(Number(item.lessons[1].split("-")[1]), Number(item.lessons[0].split("-")[1]) + 1);
  const path = join(REPO_ROOT, "curriculum/learning-labs", item.id);
  assert.ok(existsSync(join(path, "index.html")));
  const lab = JSON.parse(readFileSync(join(path, "content.json")));
  assert.equal(lab.investigate.length, 3);
  assert.ok(lab.create.length > 60);
  assert.ok(lab.vocabulary.length >= 4);
  // 2026-10-14 audit: lesson names ("Understand Percent") sat in 16 word banks and the
  // matching game dealt them as terms.
  for (const v of lab.vocabulary)
    assert.ok(
      !isLessonName(v.term, allTitles),
      `${item.id} lists the lesson name "${v.term}" as vocabulary`,
    );
  for (const lesson of lab.lessons) {
    const source = loadLessonConfig(lesson.id);
    assert.equal(lesson.title, source.title);
    assert.equal(lesson.objective, source.contentObjective);
    assert.deepEqual(lesson.concept.worked.lines, source.launch.conceptIntro.iDo.lines);
    const lessonNode = [...unitsDOM.querySelectorAll(".lesson")].find((el) =>
      el.getAttribute("data-search")?.startsWith(`${lesson.id} `),
    );
    assert.ok(
      lessonNode?.querySelector(`a[href="${item.href}"]`),
      `Missing lesson connection ${lesson.id}`,
    );
  }
  for (const [level, bank] of Object.entries(lab.practice)) {
    assert.ok(bank.length >= 5, `${item.id} ${level} needs substantive practice`);
    assert.equal(new Set(bank.map((q) => q.id)).size, bank.length);
    for (const q of bank) {
      assert.ok(q.prompt && q.explanation, `${q.id} needs a prompt and feedback`);
      if (q.type === "choice") {
        assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length);
        assert.equal(new Set(q.choices).size, q.choices.length, `${q.id} has duplicate choices`);
      }
      if (q.type === "repair") assert.ok(q.answer >= 0 && q.answer < q.steps.length);
      if (q.type === "number") {
        assert.ok(Number.isFinite(q.answer) && q.tolerance > 0);
        // 2026-10-14 audit: all 414 number items shared two generic hints and had no
        // wrong-answer feedback.
        assert.ok(q.hints?.length >= 2, `${item.id} ${q.id} needs two hints`);
        for (const hint of q.hints) {
          assert.ok(!GENERIC_HINTS.has(hint), `${item.id} ${q.id} uses a generic hint: ${hint}`);
          assert.ok(
            !new RegExp(`=\\s*${String(q.answer).replace(/[.-]/g, "\\$&")}(?![\\d.])`).test(hint),
            `${item.id} ${q.id} hint states the answer`,
          );
        }
        for (const m of q.mistakes || []) {
          assert.ok(m.feedback?.length > 15, `${item.id} ${q.id} mistake needs feedback`);
          assert.ok(
            Math.abs(m.answer - q.answer) > q.tolerance,
            `${item.id} ${q.id} lists the answer as a mistake`,
          );
          assert.equal(numberFeedback(q, m.answer), m.feedback);
        }
        assert.ok(
          !/^Predict the /.test(q.prompt),
          `${item.id} ${q.id} uses the old generated prompt`,
        );
      }
      if (q.source) {
        const lesson = q.lesson.replace("-", ".");
        assert.notEqual(
          q.lesson,
          "2-6",
          "district median material must not enter the site's long-division lesson",
        );
        assert.equal(q.source.lesson, lesson);
        assert.equal(q.source.session, 1, "core labs retain the first-session boundary");
        assert.equal(q.source.sha256, currentReveal.sha256);
        assert.equal(q.prompt, currentReveal.lessons[lesson][0].check);
        assert.equal(q.explanation, currentReveal.lessons[lesson][0].check_key);
        assert.equal(q.evidenceMode, "fresh-check");
        freshCheckLessons.add(q.lesson);
      }
      questions++;
    }
  }
  const fields = controls(lab.model);
  const result = evaluate(lab.model);
  assert.ok(Number.isFinite(result.value));
  const diagram = new JSDOM(visual(lab.model, lab.model.values, result)).window.document;
  assert.ok(diagram.querySelector('svg[role="img"][aria-label]'));
  // 2026-10-19: every model without its own branch showed the distributive-property strip.
  const strip = renderTier2DiagramStrip(lab.model, { type: "number" });
  assert.ok(strip.includes("<svg"), `${item.id} needs a formula strip`);
  if (lab.model.kind !== "expression")
    assert.ok(!strip.includes("a·x + a·b"), `${item.id} shows the distributive property strip`);
  const tips = guidance(lab.model);
  assert.ok(tips.show.length > 30 && tips.tip.length > 20, `${item.id} needs model guidance`);
  for (const lesson of lab.lessons) {
    const key = parseKeyIdea(lesson.concept.keyIdea);
    assert.ok(key.points.length >= 2, `${lesson.id} key idea must split into points`);
    assert.ok(
      lesson.concept.worked.linesEs?.length === lesson.concept.worked.lines.length,
      `${lesson.id} Spanish worked example`,
    );
  }
  const blank = {
    level: "core",
    practice: {},
    notes: {},
    steps: {},
    games: {},
    models: {},
    created: "",
    checklist: [],
    investigated: [],
  };
  const fresh = overview(lab, blank);
  assert.equal(fresh.done, 0);
  assert.equal(fresh.next, "brief");
  assert.ok(fresh.items.every((i) => i.status === "new"));
  const concise = { ...blank, created: "3/5 = 60/100 = 0.6 = 60%.", checklist: [0, 1, 2] };
  assert.equal(
    activityStatus(lab, concise, "create").status,
    "done",
    "a concise mathematical explanation is not rejected for its word count",
  );
  assert.match(activityStatus(lab, concise, "create").summary, /human review needed/);
  assert.notEqual(
    activityStatus(lab, { ...concise, checklist: [] }, "create").status,
    "done",
    "text quantity does not replace a mathematical self-review",
  );
  const practiced = structuredClone(blank);
  for (const q of lab.practice.core)
    practiced.practice[q.id] =
      q.type === "explain"
        ? { reviewed: true, input: "x" }
        : { correct: true, attempts: 1, input: "1" };
  assert.equal(activityStatus(lab, practiced, "practice").status, "done");
  practiced.notes.prediction = "I know";
  assert.equal(overview(lab, practiced).next, "learn");
  for (let tier = 0; tier < 3; tier++)
    for (let round = 0; round < 3; round++) {
      const p = puzzle(lab.model, round, tier);
      const f = fields[p.free],
        n = p.goal[p.free];
      assert.ok(n >= f.min && n <= f.max, `${item.id} game target must be reachable`);
      assert.ok(
        Math.abs((n - f.min) / f.step - Math.round((n - f.min) / f.step)) < 1e-7,
        `${item.id} valid input step`,
      );
      assert.ok(Math.abs(evaluate(lab.model, p.goal).value - p.target) <= p.tolerance);
      assert.ok(Number.isFinite(evaluate(lab.model, p.start).value));
      gameGoals++;
    }
}
assert.equal(
  freshCheckLessons.size,
  53,
  "all matching current desktop source lessons have a fresh check",
);
const wide = new JSDOM(
  visual(
    { kind: "data", mode: "histogram" },
    [1, 2, 48, 50, 3, 4, 5, 6],
    evaluate({ kind: "data", mode: "histogram", values: [1, 2, 48, 50, 3, 4, 5, 6] }),
  ),
).window.document;
assert.equal(
  wide.querySelectorAll("rect").length,
  11,
  "histogram bins extend to the last occupied interval",
);
const narrow = new JSDOM(
  visual(
    { kind: "data", mode: "histogram" },
    [1, 2, 3, 4, 5, 6, 7, 8],
    evaluate({ kind: "data", mode: "histogram", values: [1, 2, 3, 4, 5, 6, 7, 8] }),
  ),
).window.document;
assert.equal(
  narrow.querySelectorAll("rect").length,
  4,
  "histogram never shows fewer than four intervals",
);
assert.deepEqual(parseKeyIdea("Title. 1. First 2. Second 3. Third"), {
  title: "Title",
  points: ["First", "Second", "Third"],
});
assert.deepEqual(parseKeyIdea("Plain text"), { title: "", points: ["Plain text"] });
const close = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const check = (kind, mode, values, expected) =>
  close(evaluate({ kind, mode, values }).value, expected);
check("ratio", "mixer", [3, 2], 1.5);
check("rate", "shopping", [12, 8], 1.5);
check("division", "shipments", [14.4, 1.2], 12);
check("decimal", "receipt", [2.75, 6], 16.5);
check("percent", "whole", [30, 18], 60);
check("percent", "discount", [25, 80], 20);
assert.equal(controls({ kind: "percent", mode: "grid", values: [35, 100] })[0].max, 200);
assert.equal(controls({ kind: "percent", mode: "discount", values: [25, 80] })[0].max, 100);
const percentGrid = { kind: "percent", mode: "grid", values: [35, 100] };
assert.equal(
  move(
    percentGrid,
    percentGrid.values,
    { x: 381, y: 101 },
    grab(percentGrid, percentGrid.values, { x: 381, y: 101 }),
    controls(percentGrid),
  )[0],
  150,
);
assert.equal(
  move(
    percentGrid,
    percentGrid.values,
    { x: 205, y: 101 },
    grab(percentGrid, percentGrid.values, { x: 205, y: 101 }),
    controls(percentGrid),
  ),
  null,
  "the gap between wholes is not a mathematical square",
);
for (const [percent, grids, shaded] of [
  [0, 2, 0],
  [100, 2, 100],
  [150, 2, 150],
  [200, 2, 200],
]) {
  const model = { kind: "percent", mode: "grid", values: [percent, 100] };
  const picture = new JSDOM(visual(model, model.values, evaluate(model))).window.document;
  assert.equal(picture.querySelectorAll("rect").length, grids * 100);
  assert.equal(picture.querySelectorAll("rect.shape").length, shaded);
  assert.match(picture.querySelector("svg").getAttribute("aria-label"), new RegExp(`${percent}%`));
}
assert.throws(() => evaluate({ kind: "percent", mode: "whole", values: [0, 18] }), /0%/);
check("area", "triangle", [8, 5, 4], 20);
check("area", "parallelogram", [8, 5, 12], 40);
const para = evaluate({ kind: "area", mode: "parallelogram", values: [8, 5, 12] });
assert.equal(para.slantedSide, 13);
assert.deepEqual(
  controls({ kind: "area", mode: "parallelogram", values: [8, 5, 12] }).map((f) => f.label),
  ["Base", "Perpendicular height", "Horizontal shift"],
);
const paraSvg = new JSDOM(
  visual({ kind: "area", mode: "parallelogram", values: [8, 5, 12] }, [8, 5, 12], para),
).window.document;
assert.equal(paraSvg.querySelector("polygon").getAttribute("points").split(" ").length, 4);
check("area", "trapezoid", [10, 6, 4], 32);
check("area", "polygon", [4, 6, 3], 36);
check("solid", "net", [4, 3, 2], 24);
check("solid", "surface", [4, 3, 2], 52);
check("fraction", "ribbon", [5.5, 3, 4], 22 / 3);
const pyramid = evaluate({ kind: "solid", mode: "surface" }, [6, 3, 5], { shape: "pyramid" });
assert.equal(pyramid.value, 96);
assert.equal(pyramid.validShape, true);
assert.equal(
  evaluate({ kind: "solid", mode: "surface" }, [6, 3, 3], { shape: "pyramid" }).validShape,
  false,
);
check("power", "order", [3, 4, 2], 83);
check("expression", "distribute", [3, 4, 2], 18);
check("factors", "gcf", [18, 24], 6);
check("factors", "lcm", [12, 18], 36);
check("coordinates", "rectangle", [-4, -2, 3, 4], 42);
check("coordinates", "distance", [-3, 4, 2, 4], 5);
check("balance", "multiply", [4, 36, 9], 0);
check("balance", "add", [7, 19, 12], 0);
const s = statistics([2, 4, 6, 8]);
assert.deepEqual([s.mean, s.median, s.q1, s.q3, s.range, s.iqr, s.mad], [5, 5, 3, 7, 6, 4, 2]);
for (let i = 0; i < 500; i++) {
  const a = 2 + (i % 35),
    b = 2 + ((i * 7) % 35);
  const f = evaluate({ kind: "factors", mode: "gcf", values: [a, b] });
  assert.equal(a % f.gcf, 0);
  assert.equal(b % f.gcf, 0);
  assert.equal(f.lcm % a, 0);
  assert.equal(f.lcm % b, 0);
  const values = [i % 7, 2 + (i % 9), 4 + (i % 11), 6 + (i % 13)];
  const original = statistics(values),
    shifted = statistics(values.map((n) => n + 5));
  close(shifted.mean, original.mean + 5);
  close(shifted.median, original.median + 5);
  close(shifted.mad, original.mad);
}
for (const [input, expected] of [
  ["0", 0],
  [".5", 0.5],
  ["-.25", -0.25],
  ["3/4", 0.75],
  ["1 1/2", 1.5],
  ["-1 1/2", -1.5],
  ["−3", -3],
  ["1,200", 1200],
])
  close(numericAnswer(input), expected);
// Wrong-answer diagnostics: authored mistakes win; shapes of common slips otherwise.
{
  const q = { answer: 2.5, tolerance: 0.000051, mistakes: [{ answer: 3.7, feedback: "added" }] };
  assert.equal(numberFeedback(q, 3.7), "added");
  assert.match(numberFeedback(q, -2.5), /sign/);
  assert.match(numberFeedback(q, 25), /place value/);
  assert.match(numberFeedback(q, 0.25), /place value/);
  assert.match(numberFeedback(q, 0.4), /flipped/);
  assert.match(numberFeedback(q, 2.52), /close/);
  assert.equal(numberFeedback(q, 9), null);
  assert.equal(numberFeedback({ answer: 0, tolerance: 0.000051 }, 0.5), null);
}
for (const input of ["", " ", "1/0", "Infinity", "2+2", "cat"])
  assert.ok(Number.isNaN(numericAnswer(input)));
console.log(
  `PASS learning labs: ${catalogue.labCount} labs / ${core.length} lessons / ${questions} practice items / ${gameGoals} game goals; 20 independent math fixtures, 500 arithmetic/statistics property checks, source fidelity, SVG and curriculum links.`,
);
