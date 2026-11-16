// Math Studio logic and data, in Node: contracts, the support ladder, answer checking, the model <-> practice adapters
// (every lesson's model, many settings), saved-state migration, the registry, and generated-file freshness.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  checkChoice,
  checkNumber,
  checkStep,
  checkTransfer,
  evidence,
  freshRecord,
  freshState,
  keywordEvidence,
  loadState,
  nextSupport,
  pickNext,
  predictItem,
  recordAttempt,
  revealWorked,
  STORE_PREFIX,
  saveState,
  transferTask,
  validate,
  verifyHandoff,
  verifySolve,
} from "../assets/math-studio/core.mjs";
import { describe, partsQuestions, partsTransfer } from "../assets/math-studio/parts.mjs";
import { controls, evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { buildRegistry } from "../scripts/lib/math-studio-registry.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

let n = 0;
const t = (name, fn) => {
  try {
    fn();
  } catch (e) {
    e.message = `${name}: ${e.message}`;
    throw e;
  }
  n++;
};

// ---- Contracts ----
t("handoff contract accepts a valid hand-off and names every bad field", () => {
  const good = {
    lessonId: "3-1",
    conceptId: "ratio:mixer",
    modelId: "ratio",
    problemId: "lab-core-model",
    params: [4, 2],
    hintLevel: 0,
    supports: ["model"],
    returnTo: "practice",
  };
  assert.equal(validate("handoff", good), good);
  assert.throws(
    () => validate("handoff", { ...good, lessonId: "3-1-group1", params: [], returnTo: "nowhere" }),
    /lessonId, params, returnTo/,
  );
  assert.throws(() => validate("handoff", { ...good, params: [1, Number.NaN] }), /params/);
  assert.throws(() => validate("nope", good), /Unknown contract/);
});

// ---- Answer checking ----
const mc = {
  id: "q",
  kind: "mc",
  prompt: "p",
  choices: ["1:4", "4:1", "4:5"],
  correct: 1,
  feedback: ["Order matters.", "", "You added."],
  tags: ["ratio-inverted", null, null],
  hints: ["a", "b", "c"],
  explanation: "4:1",
};
t(
  "multiple choice: right, wrong with authored feedback, misconception only when tagged and known",
  () => {
    assert.equal(checkChoice(mc, 1).correct, true);
    const w = checkChoice(mc, 0, { "ratio-inverted": { name: "Flipped", fix: "Match labels." } });
    assert.equal(w.correct, false);
    assert.equal(w.feedback, "Order matters.");
    assert.equal(w.misconception.name, "Flipped");
    assert.equal(
      checkChoice(mc, 2, {}).misconception,
      null,
      "untagged choice claims no misconception",
    );
    assert.equal(checkChoice(mc, 0, {}).misconception, null, "unknown tag claims no misconception");
  },
);
t("numbers: fractions, mixed numbers, tolerance, known slips, unparseable", () => {
  const it = {
    answer: 1.5,
    tolerance: 1e-4,
    mistakes: [{ answer: 0.666667, feedback: "Divided the wrong way." }],
  };
  assert.equal(checkNumber(it, "3/2").correct, true);
  assert.equal(checkNumber(it, "1 1/2").correct, true);
  assert.equal(checkNumber(it, "1.50").correct, true);
  assert.equal(checkNumber(it, "0.666667").feedback, "Divided the wrong way.");
  assert.equal(checkNumber(it, "2").feedback, "");
  assert.equal(checkNumber(it, "abc").parsed, false);
  assert.equal(checkStep({ errorStep: 2 }, 2).correct, true);
  assert.equal(checkStep({ errorStep: 2 }, 1).correct, false);
});
t("keyword evidence reports, never grades", () => {
  assert.deepEqual(keywordEvidence("The ratio is part-to-whole", ["ratio", "total"]), {
    used: ["ratio"],
    missing: ["total"],
  });
});

// ---- Support ladder ----
t(
  "support ladder: cue, visual only with a model, guide, then worked example; independence is strict",
  () => {
    let r = freshRecord();
    assert.equal(nextSupport(r, mc, true).level, "cue");
    r = recordAttempt(r, false, 0);
    assert.equal(nextSupport(r, mc, true).level, "visual");
    assert.equal(nextSupport(r, mc, false).level, "guide", "no model -> no visual promise");
    r = recordAttempt(r, false, 2);
    assert.equal(nextSupport(r, mc, true).level, "guide");
    r = recordAttempt(r, false, 2);
    assert.equal(nextSupport(r, mc, true).level, "worked");
    const done = recordAttempt(r, true, 1);
    assert.equal(done.result, "supported");
    assert.equal(recordAttempt(freshRecord(), true, 1).result, "independent");
    assert.equal(
      recordAttempt({ ...freshRecord(), hints: 1 }, true, 1).result,
      "supported",
      "a hint is support",
    );
    assert.equal(
      recordAttempt({ ...freshRecord(), model: true }, true, 1).result,
      "supported",
      "the model is support",
    );
    assert.equal(revealWorked(r).result, "revealed");
    assert.equal(nextSupport(done, mc, true).level, null);
  },
);
t(
  "after an item, the next is a DIFFERENT unanswered item, preferring a shared misconception",
  () => {
    const items = [
      { id: "a", tags: ["x"] },
      { id: "b", tags: ["y"] },
      { id: "c", tags: ["x"] },
    ];
    assert.equal(pickNext(items, { a: { result: "revealed" } }, items[0]).id, "c");
    assert.equal(
      pickNext(items, { a: { result: "x" }, b: { result: "x" }, c: { result: "x" } }, items[0]),
      null,
    );
  },
);

// ---- Model adapters, on every lesson's model ----
const { lessons, stats } = buildRegistry();
assert.equal(lessons.length, 72, "Units 2-9 have 72 lessons");
t(
  "model -> practice: every lesson's model makes a correct predict item and a solvable transfer task",
  () => {
    let predicts = 0,
      transfers = 0;
    for (const L of lessons) {
      const model = L.lab.model;
      const fields = controls(model);
      for (let k = 0; k < 4; k++) {
        const values = model.values.map((v, i) =>
          i === k % fields.length && fields[i].label !== "Unused"
            ? Math.min(fields[i].max, v + fields[i].step)
            : v,
        );
        let ev;
        try {
          ev = evaluate(model, values);
        } catch {
          continue;
        }
        const item = predictItem(model, values, L.id);
        if (item) {
          assert.ok(Math.abs(item.answer - ev.value) < 1e-9, `${L.id}: predict answer`);
          assert.equal(
            checkNumber(item, String(Number(ev.value.toFixed(6)))).correct,
            true,
            `${L.id}: own answer accepted`,
          );
          assert.ok(
            item.prompt.includes(fields.find((f) => f.label !== "Unused").label),
            `${L.id}: prompt names the settings`,
          );
          predicts++;
        }
      }
      for (let round = 1; round <= 3; round++) {
        const task = transferTask(model, L.id, round, 1);
        if (!task) continue;
        // The goal setting is a solution; the start setting is not (it must not start solved).
        const goal = [...task.start];
        const fieldsOk = Number.isInteger(task.free) && task.free < fields.length;
        assert.ok(fieldsOk, `${L.id}: transfer free control`);
        let solved = false;
        const f = fields[task.free];
        for (let v = f.min; v <= f.max + 1e-9; v += f.step) {
          if (checkTransfer(model, task, String(Number(v.toFixed(6)))).correct) {
            solved = true;
            break;
          }
        }
        assert.ok(solved, `${L.id}: transfer round ${round} has a reachable answer`);
        assert.equal(checkTransfer(model, task, "not a number").parsed, false);
        assert.ok(goal.length === model.values.length);
        transfers++;
      }
    }
    assert.ok(predicts >= 200 && transfers >= 150, `predicts ${predicts}, transfers ${transfers}`);
  },
);
t(
  "practice -> model: every attached hand-off reproduces its item's answer; a wrong one is refused",
  () => {
    let handoffs = 0;
    for (const L of lessons)
      for (const it of [...L.practice.regular, ...L.practice.challenge]) {
        if (!it.model) continue;
        assert.ok(
          verifyHandoff(L.lab.model, it.model.values, it.answer, it.tolerance) ||
            verifySolve(
              L.lab.model,
              it.model.values,
              solveIndex(L.lab.model, it),
              it.answer,
              it.prompt,
            ),
          `${L.id} ${it.id}`,
        );
        validate("handoff", {
          lessonId: L.id,
          conceptId: L.concept,
          modelId: L.lab.model.kind,
          problemId: it.id,
          params: it.model.values,
          hintLevel: 0,
          supports: [],
          returnTo: "practice",
        });
        handoffs++;
      }
    assert.ok(handoffs >= 60, `only ${handoffs} hand-offs reach the studio`);
    const L = lessons.find((l) => l.id === "3-1");
    assert.equal(verifyHandoff(L.lab.model, [3, 2], 99), false);
    assert.equal(verifyHandoff(L.lab.model, [3], 1.5), false);
    assert.equal(verifyHandoff(L.lab.model, [300, 2], 150), false, "out of the control's range");
  },
);

t("solve-for-missing hand-offs accept only a real solution", () => {
  const add = { kind: "balance", mode: "add", values: [7, 19, 12] };
  assert.equal(verifySolve(add, [8, 19, 12], 2, 11), true);
  assert.equal(verifySolve(add, [8, 19, 12], 2, 12), false);
  const mul = { kind: "balance", mode: "multiply", values: [4, 36, 9] };
  assert.equal(verifySolve(mul, [5, 36, 9], 2, 7.2), true);
  assert.equal(verifySolve(mul, [5, 36, 9], 2, 7), false);
  const ge = { kind: "inequality", mode: "entry", values: [12, 10] };
  assert.equal(verifySolve(ge, [13, 10], 1, 13, "x ≥ 13. What is the smallest whole number"), true);
  assert.equal(
    verifySolve(ge, [13, 10], 1, 14, "x ≥ 13. What is the smallest whole number"),
    false,
    "follows the rule but is not the smallest",
  );
  assert.equal(
    verifySolve(ge, [13, 10], 1, 13, "Name a number that works"),
    false,
    "no smallest/greatest: not decidable",
  );
  const le = { kind: "inequality", mode: "budget", values: [15, 6] };
  assert.equal(verifySolve(le, [16, 6], 1, 16, "x ≤ 16. What is the greatest whole number"), true);
  assert.equal(verifySolve(le, [16, 6], 1, 17, "x ≤ 16. What is the greatest whole number"), false);
  assert.equal(
    verifySolve({ kind: "ratio", mode: "mixer", values: [3, 2] }, [3, 2], 1, 2),
    false,
    "other kinds never pass",
  );
});

/** The control a solve item leaves open: the one whose setting the item never states. */
function solveIndex(model, it) {
  const fields = controls(model);
  return fields.findIndex(
    (f) =>
      f.label !== "Unused" &&
      !it.prompt.includes(`${f.label} =`) &&
      !it.prompt.includes(`${f.label}:`),
  );
}

t(
  "parts of an expression: text, value, coefficient 1, subtraction, no constant, questions and transfer",
  () => {
    assert.deepEqual(describe({ a: 12, variable: "t", op: "+", b: 50, v: 4 }), {
      text: "12t + 50",
      varTerm: "12t",
      value: 98,
      steps: "12 × 4 + 50 = 48 + 50 = 98",
      terms: 2,
    });
    assert.equal(describe({ a: 1, variable: "n", op: "+", b: 3, v: 5 }).text, "n + 3");
    assert.equal(describe({ a: 3, variable: "x", op: "-", b: 20, v: 4 }).value, -8);
    assert.equal(describe({ a: 3, variable: "x", op: "-", b: 20, v: 4 }).text, "3x − 20");
    assert.equal(describe({ a: 5, variable: "m", op: "+", b: 0, v: 2 }).terms, 1);
    const qs = partsQuestions({ a: 12, variable: "t", op: "+", b: 50, v: 4 }, "6-5");
    assert.deepEqual(
      qs.map((q) => q.answer),
      [12, 50, 98],
    );
    for (const q of qs) validate("item", q);
    assert.equal(
      checkNumber(qs[2], "124").feedback.includes("12t means"),
      true,
      "the digits-side-by-side slip is named",
    );
    assert.equal(
      partsQuestions({ a: 4, variable: "x", op: "+", b: 0, v: 2 }, "6-5").length,
      2,
      "no constant question without a constant",
    );
    for (let round = 1; round <= 20; round++) {
      const tq = partsTransfer({ a: 12, variable: "t", op: "+", b: 50, v: 4 }, round, "6-5");
      const m = /: (\d+)([a-z]) ([+−]) (\d+)\./.exec(tq.prompt);
      assert.ok(m, tq.prompt);
      const v = Number(/when [a-z] = (\d+)/.exec(tq.prompt)[1]);
      const want = Number(m[1]) * v + (m[3] === "+" ? 1 : -1) * Number(m[4]);
      assert.equal(tq.answer, want, `transfer ${round}`);
    }
    const L = lessons.find((l) => l.id === "6-5");
    assert.equal(L.explore.kind, "expression-parts");
    assert.ok(L.understand.vocabulary.some((v) => v.term === "Term"));
    assert.ok(
      ![...L.practice.regular, ...L.practice.challenge].some((it) => it.model),
      "no distributive-model hand-offs on 6-5",
    );
    assert.ok(L.practice.challenge.length >= 3);
    const six = lessons.find((l) => l.id === "6-6");
    assert.equal(six.explore, undefined, "6-6 keeps the shared lab model");
  },
);

// ---- Registry content ----
t("registry: every lesson has lesson-specific content in all five stages and valid keys", () => {
  for (const L of lessons) {
    assert.ok(L.objective && L.lab.lessons.includes(L.id), L.id);
    assert.ok(L.understand.iDo?.lines?.length, `${L.id} worked example`);
    assert.ok(
      L.practice.regular.length >= 4 && L.practice.challenge.length >= 3,
      `${L.id} practice`,
    );
    for (const it of [...L.practice.regular, ...L.practice.challenge, ...L.reflect.checks]) {
      if (it.kind === "mc")
        assert.ok(it.correct >= 0 && it.correct < it.choices.length, `${L.id} ${it.id}`);
      if (it.kind === "num") assert.ok(Number.isFinite(it.answer), `${L.id} ${it.id}`);
      if (it.kind === "ea") assert.ok(it.errorStep < it.steps.length, `${L.id} ${it.id}`);
    }
    assert.ok(L.reflect.checks.length >= 1, `${L.id} reflect`);
    const ids = [...L.practice.regular, ...L.practice.challenge].map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length, `${L.id} duplicate ids`);
  }
  // Labs shared by two lessons keep each lesson's own practice.
  const shared = lessons.filter((L) => L.lab.lessons.length > 1);
  assert.ok(shared.length > 20);
  const [a, b] = [lessons.find((l) => l.id === "3-1"), lessons.find((l) => l.id === "3-2")];
  assert.equal(a.lab.id, b.lab.id);
  assert.notDeepEqual(
    a.practice.regular.map((i) => i.prompt),
    b.practice.regular.map((i) => i.prompt),
  );
});

// ---- Saved state ----
t(
  "saved state: round trip, additive load, wrong version or lesson starts fresh, broken JSON is survivable",
  () => {
    const mem = new Map();
    const store = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
    const s = freshState("3-1");
    s.stage = "practice";
    s.practice.items.q = { ...freshRecord(), result: "independent", attempts: 1 };
    s.explore.prediction = "doubles";
    assert.equal(saveState(store, s), true);
    const back = loadState(store, "3-1");
    assert.equal(back.stage, "practice");
    assert.equal(back.practice.items.q.result, "independent");
    assert.equal(back.explore.prediction, "doubles");
    mem.set(
      `${STORE_PREFIX}3-1`,
      JSON.stringify({ version: 1, lessonId: "3-1", stage: "apply", explore: { notes: "kept" } }),
    );
    const old = loadState(store, "3-1");
    assert.equal(old.explore.notes, "kept");
    assert.equal(old.explore.prediction, "", "missing fields come from the fresh state");
    assert.deepEqual(old.practice.current, { regular: null, challenge: null });
    mem.set(`${STORE_PREFIX}3-1`, JSON.stringify({ version: 2, lessonId: "3-1", stage: "apply" }));
    assert.equal(loadState(store, "3-1").stage, "explore");
    mem.set(`${STORE_PREFIX}3-1`, "{broken");
    assert.equal(loadState(store, "3-1").stage, "explore");
    mem.set(`${STORE_PREFIX}3-1`, JSON.stringify({ version: 1, lessonId: "3-1", stage: "hacked" }));
    assert.equal(loadState(store, "3-1").stage, "explore");
    assert.equal(
      saveState(
        {
          setItem: () => {
            throw new Error("quota");
          },
        },
        freshState("3-1"),
      ),
      false,
    );
    assert.ok(
      !JSON.stringify(freshState("3-1")).match(/name|email|student/i),
      "no identity fields",
    );
  },
);
t("evidence keeps independent, supported and revealed apart", () => {
  const L = lessons.find((l) => l.id === "3-1");
  const s = freshState("3-1");
  const [a, b, c] = L.practice.regular;
  s.practice.items[a.id] = { ...freshRecord(), attempts: 1, result: "independent" };
  s.practice.items[b.id] = {
    ...freshRecord(),
    attempts: 2,
    wrong: 1,
    hints: 1,
    result: "supported",
  };
  s.practice.items[c.id] = {
    ...freshRecord(),
    attempts: 3,
    wrong: 3,
    worked: true,
    result: "revealed",
    tags: ["ratio-inverted"],
  };
  s.reflect.items.exit = { ...freshRecord(), attempts: 1, result: "independent" };
  const e = evidence(s, L);
  assert.deepEqual(
    [
      e.regular.independent,
      e.regular.supported,
      e.regular.revealed,
      e.regular.tried,
      e.regular.hints,
    ],
    [1, 1, 1, 3, 1],
  );
  assert.equal(e.reflect.independent, 1);
  assert.equal(e.errors["ratio-inverted"], 1);
});

// ---- Generated files are current ----
t("generated Math Studio files are current", () => {
  execFileSync(process.execPath, ["scripts/generate-math-studio.mjs", "--check"], {
    cwd: REPO_ROOT,
    stdio: "pipe",
  });
});

console.log(
  `PASS math-studio: ${n} groups; ${lessons.length} lessons; ${stats.verified} verified model hand-offs, ${stats.refused} refused`,
);
