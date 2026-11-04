// Reality Lab: exact-math invariants, the skill matrix, and the eight flagship journeys played headlessly through the
// same reducer and model stores the page uses (no browser, no mocks).
import assert from "node:assert/strict";
import { ALL_SKILLS } from "../../problem-bank.js";
import { experienceById } from "./catalog.js";
import { decimalAddition, fractionAddition } from "./misconceptions.js";
import { currentStep, evidenceOf, newSession, reduce, sanitizeSession, stepDone, transferProblem } from "./journey.js";
import { R, createStore, seeded } from "./kernel.js";
import { MODELS } from "./models/index.js";
import { parseEquation, parseExpression } from "./models/algebra.js";
import { cleanLab } from "./store.js";
import { SKILL_MATRIX } from "./skills.js";
import { STUDIO_TEMPLATES } from "./studios.js";

let count = 0;
const test = (name, fn) => {
  try {
    fn();
    count++;
  } catch (error) {
    console.error(`FAIL ${name}\n`, error);
    process.exitCode = 1;
  }
};

// ---- exact mathematics -------------------------------------------------------------------------------------------------------
test("fraction cuts never change the value", () => {
  const s = createStore(MODELS.fraction, { den: 1 });
  s.dispatch({ type: "partition", n: 4 });
  for (const i of [0, 1, 2]) s.dispatch({ type: "toggle", i });
  const before = s.derive().value;
  for (const n of [2, 3]) {
    s.dispatch({ type: "split", n });
    assert.ok(s.derive().value.eq(before));
  }
  assert.equal(s.state.den, 24);
  assert.equal(s.dispatch({ type: "split", n: 2 }).ok, false, "too many parts is refused");
  s.dispatch({ type: "merge", n: 3 });
  assert.ok(s.derive().value.eq(before));
  s.dispatch({ type: "toggle", i: 0 });
  assert.equal(s.dispatch({ type: "merge", n: 2 }).ok, false, "joining half-shaded groups would change the amount");
});

test("balance: one-sided change breaks equality, equal change restores it", () => {
  const s = createStore(MODELS.balance, { x: 5, left: { x: 1, u: 3 }, right: { x: 0, u: 8 } });
  assert.equal(s.derive().balanced, true);
  s.dispatch({ type: "remove", side: "left", what: "u", n: 3 });
  assert.equal(s.derive().balanced, false);
  assert.equal(s.derive().tilt, -1);
  s.dispatch({ type: "remove", side: "right", what: "u", n: 3 });
  assert.equal(s.derive().solved, true);
  assert.equal(s.dispatch({ type: "remove", side: "left", what: "u", n: 1 }).ok, false);
});

test("place value trades are exact in both directions", () => {
  const s = createStore(MODELS.place, { set: "decimal", rows: ["A", "B"] });
  s.dispatch({ type: "add", row: "A", place: "tenths", n: 4 });
  s.dispatch({ type: "add", row: "B", place: "hundredths", n: 35 });
  s.dispatch({ type: "combine" });
  for (let i = 0; i < 3; i++) s.dispatch({ type: "trade", place: "hundredths" });
  const d = s.derive();
  assert.equal(d.totalText, "0.75");
  assert.equal(d.regrouped, true);
  assert.equal(s.dispatch({ type: "trade", place: "hundredths" }).ok, false);
  s.dispatch({ type: "unpack", place: "tenths" });
  assert.equal(s.derive().totalText, "0.75");
});

test("recipe: one factor on every ingredient, bidirectional edits agree", () => {
  const s = createStore(MODELS.recipe, {});
  s.dispatch({ type: "servings", value: "6" });
  const d = s.derive();
  assert.equal(d.kText, "3");
  assert.ok(d.sameFactor);
  assert.deepEqual(d.items.map((i) => i.scaledText), ["3", "9/4", "6"]);
  s.dispatch({ type: "item", id: "milk", value: "3/2" });
  assert.equal(s.derive().servingsText, "4");
  assert.equal(s.dispatch({ type: "servings", value: "0" }).ok, false);
  assert.equal(s.dispatch({ type: "servings", value: "100" }).ok, false);
});

test("expressions and equations parse exactly", () => {
  assert.equal(String(parseExpression("(4 + 5) × 4").value), "36");
  assert.equal(parseExpression("(4 + 5) × 4").ops, 2);
  assert.equal(String(parseExpression("1/3 + 1/3 + 1/3").value), "1");
  assert.equal(parseExpression("1 ÷ 0").ok, false);
  assert.equal(parseExpression("2 +").ok, false);
  assert.equal(String(parseEquation("3(x + 1) = 24").solution), "7");
  assert.equal(parseEquation("x + 1 = x + 2").kind, "none");
  assert.equal(parseEquation("2x + 2 = 2(x + 1)").kind, "all");
});

test("area, graph, chips and number line obey their constraints", () => {
  const a = createStore(MODELS.area, { w: 3, h: 4, maxW: 24, maxH: 24 });
  a.dispatch({ type: "size", w: 6 });
  assert.equal(a.derive().area, 24);
  assert.equal(a.derive().perimeter, 20);
  assert.equal(a.dispatch({ type: "bump", dw: 99 }).ok, false);
  const g = createStore(MODELS.graph, { p1: [0, 1], p2: [2, 5] });
  assert.equal(g.derive().equation, "y = 2x + 1");
  assert.equal(g.dispatch({ type: "move", pt: "p2", x: 0, y: 1 }).ok, false, "points must differ");
  const c = createStore(MODELS.chips, {});
  c.dispatch({ type: "add", sign: "pos", n: 5 });
  c.dispatch({ type: "add", sign: "neg", n: 3 });
  assert.equal(c.derive().value, 2);
  c.dispatch({ type: "cancel", n: 3 });
  assert.equal(c.derive().pairs, 0);
  const n = createStore(MODELS.numline, { min: 0, max: 10, start: 0, step: "2" });
  n.dispatch({ type: "hop", by: "2" });
  n.dispatch({ type: "hop", by: "1/2" });
  assert.equal(n.derive().equation, "0 + 2 + 1/2 = 5/2");
  assert.equal(n.dispatch({ type: "hop", by: "100" }).ok, false);
});

test("undo, redo, reset and replay frames", () => {
  const s = createStore(MODELS.area, {});
  s.dispatch({ type: "bump", dw: 1 });
  s.dispatch({ type: "bump", dh: 1 });
  assert.equal(s.frames().length, 3);
  s.undo();
  assert.equal(s.state.h, 3);
  s.redo();
  assert.equal(s.state.h, 4);
  s.reset();
  assert.equal(s.state.w, 4);
  assert.equal(s.canUndo, false);
});

test("Mistake Lab separates confirmed facts from hypotheses", () => {
  const r = decimalAddition("0.4", "0.35", "0.39");
  assert.equal(r.correct, false);
  assert.deepEqual(r.confirmed.map((c) => c.id), ["smaller-than-addend"]);
  assert.deepEqual(r.hypotheses.map((h) => h.id), ["digits-as-whole", "aligned-from-right"]);
  assert.equal(r.probes.length, 1, "two hypotheses are told apart by a probe, not assumed");
  assert.equal(decimalAddition("0.4", "0.35", "0.75").correct, true);
  assert.equal(decimalAddition("0.4", "0.35", "abc").unreadable, true);
  assert.deepEqual(fractionAddition([1, 2], [1, 3], "2/5").hypotheses.map((h) => h.id), ["add-denominators"]);
});

// ---- the matrix ---------------------------------------------------------------------------------------------------------------------
test("every Fluency Lab skill has a journey, a studio, or a written exception", () => {
  const keys = ALL_SKILLS.map((s) => `${s.grade}:${s.id}`);
  assert.deepEqual(keys.filter((k) => !SKILL_MATRIX[k]), []);
  assert.deepEqual(Object.keys(SKILL_MATRIX).filter((k) => !keys.includes(k)), []);
  for (const k of keys) {
    const row = SKILL_MATRIX[k];
    if (row.kind === "exception") assert.ok(row.why.en && row.why.es, `${k} needs both languages`);
    else assert.ok(experienceById(row.kind === "journey" ? row.id : `studio:${k}`), `${k} must resolve`);
  }
});

test("every studio skill starts unsolved on every seed, and every template is used", () => {
  const used = new Set();
  for (const [key, row] of Object.entries(SKILL_MATRIX)) {
    if (row.kind !== "studio") continue;
    used.add(row.template);
    const exp = experienceById(`studio:${key}`);
    for (let seed = 1; seed <= 80; seed++) {
      const session = newSession(exp, { seed });
      const build = exp.steps[0];
      const store = createStore(MODELS[exp.model], build.params(session));
      assert.equal(build.check(store.state, store.derive(), session).done, false, `${key} seed ${seed} is solved before the learner acts`);
      const tp = transferProblem(exp.steps[2], session, row.grade ?? 4);
      if (tp.kind === "build") {
        const t = createStore(MODELS[exp.model], tp.params);
        assert.equal(Boolean(tp.check(t.state, t.derive())), false, `${key} transfer seed ${seed} is solved at the start`);
      } else assert.ok(tp.expect !== undefined && tp.prompt.en);
    }
  }
  assert.deepEqual([...used].sort(), [...STUDIO_TEMPLATES].sort());
});

// ---- journeys played through the real reducer ---------------------------------------------------------------------------------
function play(exp, script, grade = 4) {
  let session = newSession(exp, { seed: 12345, input: exp.defaultInput ? { ...exp.defaultInput } : null });
  if (exp.detect) session = reduce(exp, session, { type: "input", ...exp.defaultInput });
  let store = null;
  let key = "";
  const ensure = () => {
    const step = currentStep(exp, session);
    const params = step.kind === "task" && step.params ? (typeof step.params === "function" ? step.params(session, grade) : step.params) : step.kind === "transfer" ? (transferProblem(step, session, grade).params ?? null) : undefined;
    const k = params === undefined ? key || "base" : params === null ? key : `${step.id}:${session.transfer[step.id]?.round ?? 0}`;
    if (store && k === key) return;
    key = k;
    store = createStore(MODELS[exp.model], params === undefined || params === null ? exp.params : params);
  };
  const env = () => ({ state: store.state, derived: store.derive(), grade });
  for (let guard = 0; guard < 60 && !session.done; guard++) {
    ensure();
    const step = currentStep(exp, session);
    const move = script[step.id] ?? script[step.kind];
    assert.ok(move, `${exp.id}: no script for step ${step.id}`);
    move({ step, store, session: () => session, send: (a) => { session = reduce(exp, session, a, env()); }, act: (a) => { const r = store.dispatch(a); assert.ok(r.ok, `${exp.id}/${step.id}: refused ${JSON.stringify(a)}`); }, grade });
    if (step.kind === "task") session = reduce(exp, session, { type: "task", id: step.id }, env());
    assert.ok(stepDone(exp, session), `${exp.id}: step ${step.id} did not complete`);
    session = reduce(exp, session, { type: "next" });
  }
  assert.ok(session.done, `${exp.id} should finish`);
  return session;
}
const askRight = (id) => ({ send, step }) => send({ type: "ask", id: step.id, option: id ?? step.options.find((o) => o.ok)?.id ?? step.options[0].id });
const answerOf = (exp, grade = 4) => ({ send, session, step }) => {
  const p = transferProblem(step, session(), grade);
  send({ type: "transferTry", id: step.id, response: String(p.expect) });
};
const explainFrames = ({ send, step }) => send({ type: "explain", id: step.id, text: "x", picks: step.frames.map((f) => f.ok[0]) });

test("flagship 1: 3/4 becomes 6/8 by student partitioning", () => {
  const exp = experienceById("fraction-transform");
  const session = play(exp, {
    build: ({ act }) => { act({ type: "partition", n: 4 }); for (const i of [0, 1, 2]) act({ type: "toggle", i }); },
    predict: askRight("same"), split: ({ act }) => act({ type: "split", n: 2 }), see: askRight(), line: askRight(),
    another: ({ act }) => act({ type: "split", n: 3 }), why: explainFrames,
    new: ({ send, session, step, act }) => {
      const p = transferProblem(step, session(), 4);
      const k = Number(p.answerText.split("/")[1]) / p.params.den;
      act({ type: "split", n: k });
      send({ type: "transferTry", id: step.id });
    },
  });
  assert.equal(evidenceOf(exp, session).label, "demonstrated");
});

test("flagship 2: restore equality on the balance", () => {
  const exp = experienceById("balance-equation");
  const session = play(exp, {
    predict: askRight(), break: ({ act }) => act({ type: "remove", side: "left", what: "u", n: 3 }), restore: ({ act }) => act({ type: "remove", side: "right", what: "u", n: 3 }),
    discover: askRight(), solve: ({ act }) => { act({ type: "remove", side: "both", what: "u", n: 3 }); act({ type: "divide", k: 2 }); }, why: explainFrames,
    new: ({ send, session, step, act }) => {
      const p = transferProblem(step, session(), 7);
      const { x, left } = p.params;
      act({ type: "remove", side: "both", what: "u", n: left.u });
      if (left.x > 1) act({ type: "divide", k: left.x });
      assert.equal(createStore(MODELS.balance, p.params).derive().xValue.n, BigInt(x));
      send({ type: "transferTry", id: step.id });
    },
  }, 7);
  assert.equal(evidenceOf(exp, session).demonstrated, true);
});

test("flagship 3: doubling the width doubles the area, found by testing cases", () => {
  const exp = experienceById("discover-area");
  const session = play(exp, {
    predict: askRight(),
    double: ({ act }) => { act({ type: "size", w: 3, h: 4 }); act({ type: "save" }); act({ type: "size", w: 6, h: 4 }); act({ type: "save" }); },
    compare: askRight(),
    test: ({ act }) => { for (const [w, h] of [[2, 5], [1, 7]]) { act({ type: "size", w, h }); act({ type: "save" }); act({ type: "size", w: 2 * w, h }); act({ type: "save" }); } },
    discover: askRight(), why: explainFrames, new: answerOf(exp, 3),
  }, 3);
  assert.equal(evidenceOf(exp, session).transfer, "independent");
});

test("flagship 4: X-Ray shows why 3/4 ÷ 1/8 = 6", () => {
  const exp = experienceById("xray-division");
  const session = play(exp, {
    predict: askRight(), xray: ({ act }) => { act({ type: "xray", on: true }); act({ type: "split" }); },
    count: ({ act, store }) => { for (let i = 0; i < 6; i++) act({ type: "markNext" }); assert.equal(store.derive().quotientText, "6"); },
    see: askRight(), why: explainFrames, new: answerOf(exp, 6),
  }, 6);
  assert.ok(evidenceOf(exp, session).demonstrated);
});

test("flagship 5: Mistake Lab repairs 0.4 + 0.35 = 0.39 with the decimal model", () => {
  const exp = experienceById("mistake-decimal");
  const session = play(exp, {
    diagnose: ({ send, step }) => send({ type: "probe", id: step.id, option: "a" }),
    buildA: ({ act }) => act({ type: "add", row: "A", place: "tenths", n: 4 }),
    buildB: ({ act }) => act({ type: "add", row: "B", place: "hundredths", n: 35 }),
    regroup: ({ act }) => { act({ type: "combine" }); for (let i = 0; i < 3; i++) act({ type: "trade", place: "hundredths" }); },
    check: askRight(), why: explainFrames, new: answerOf(exp, 5),
  }, 5);
  assert.deepEqual(session.errors, ["digits-as-whole"]);
  const ev = evidenceOf(exp, session);
  assert.equal(ev.repairedViaModel, true);
  assert.equal(ev.demonstrated, true);
});

test("flagship 6: build and compare rectangles with area 24", () => {
  const exp = experienceById("build-area-24");
  const session = play(exp, {
    three: ({ act }) => { for (const [w, h] of [[4, 6], [3, 8], [2, 12]]) { act({ type: "size", w, h }); act({ type: "save" }); } },
    compare: askRight(),
    all: ({ act }) => { act({ type: "size", w: 1, h: 24 }); act({ type: "save" }); },
    smallest: askRight(), why: explainFrames,
    new: ({ send, session, step, act }) => {
      const A = transferProblem(step, session(), 4).params.maxW;
      let best = [1, A];
      for (let w = 1; w <= A; w++) if (A % w === 0 && w + A / w < best[0] + best[1]) best = [w, A / w];
      act({ type: "size", w: best[0], h: best[1] });
      act({ type: "save" });
      send({ type: "transferTry", id: step.id });
    },
  });
  assert.ok(evidenceOf(exp, session).demonstrated);
});

test("flagship 7: recipe scaling through three representations", () => {
  const exp = experienceById("recipe-scaling");
  const session = play(exp, {
    predict: askRight(), six: ({ act }) => act({ type: "servings", value: "6", via: "servings" }), factor: askRight(),
    other: ({ act }) => act({ type: "item", id: "flour", value: "4", via: "table" }), why: askRight(), why2: explainFrames, new: answerOf(exp, 6),
  }, 6);
  assert.ok(evidenceOf(exp, session).demonstrated);
});

test("flagship 8: Reverse Math accepts many valid expressions equal to 36", () => {
  const exp = experienceById("reverse-36");
  const session = play(exp, {
    one: ({ act }) => { act({ type: "text", text: "(4 + 5) × 4 + 0" }); act({ type: "submit" }); },
    three: ({ act }) => { for (const t of ["6 × 6 + 5 − 5", "72 ÷ 2 + 1 − 1", "4 × 9 × 1 × 1"]) { act({ type: "text", text: t }); act({ type: "submit" }); } },
    strategy: askRight(), why: explainFrames,
    new: ({ send, session, step, act }) => {
      const m = transferProblem(step, session(), 6).prompt.en.match(/equals (\d+) using exactly (\d+)/);
      const N = Number(m[1]);
      const k = Number(m[2]);
      act({ type: "text", text: `${N}${" + 0".repeat(k)}` });
      act({ type: "submit" });
      send({ type: "transferTry", id: step.id });
    },
  }, 6);
  assert.ok(evidenceOf(exp, session).transfer === "independent");
  const bad = createStore(MODELS.builder, { kind: "expr" });
  bad.dispatch({ type: "text", text: "6 × 6" });
  bad.dispatch({ type: "submit" });
  assert.equal(String(bad.state.entries[0].value), "36");
  assert.equal(bad.state.entries[0].ops, 1, "exactly-three-operations is judged from the parse, not from a stored answer");
});

test("a miss then a hint is scaffolded, and a first-try transfer is independent", () => {
  const exp = experienceById("discover-area");
  const step = exp.steps.find((s) => s.kind === "transfer");
  let session = newSession(exp, { seed: 99 });
  session = reduce(exp, session, { type: "transferHint", id: step.id }, { grade: 3 });
  session = reduce(exp, session, { type: "transferTry", id: step.id, response: String(transferProblem(step, session, 3).expect) }, { grade: 3 });
  assert.equal(session.transfer[step.id].independent, false);
  assert.equal(evidenceOf(exp, session).transfer, "scaffolded");
});

test("saved sessions are repaired on read", () => {
  const exp = experienceById("discover-area");
  const s = sanitizeSession(exp, { exp: exp.id, seed: -5, step: 999, answers: { predict: { option: "x".repeat(500), ok: true }, bogus: 1 }, explain: { why: { text: "y".repeat(5000), picks: [], ideas: [], ok: true } } });
  assert.equal(s.step, 0);
  assert.ok(s.answers.predict.option.length <= 40);
  assert.equal(s.answers.bogus, undefined);
  assert.ok(s.explain.why.text.length <= 500);
  const lab = cleanLab({ sessions: { "discover-area": { exp: "discover-area" }, nope: {} }, trails: { "discover-area": { step: 0, actions: [{ type: "size", w: 2 }, 5, { type: 7 }] } }, support: "evil" });
  assert.deepEqual(Object.keys(lab.sessions), ["discover-area"]);
  assert.equal(lab.trails["discover-area"].actions.length, 1);
  assert.equal(lab.support, "frames");
});

test("seeded generators are deterministic", () => {
  const a = seeded(7);
  const b = seeded(7);
  assert.deepEqual([a.int(1, 100), a.int(1, 100)], [b.int(1, 100), b.int(1, 100)]);
  assert.ok(R(3, 4).eq(R(6, 8)));
});


// ---- the learning journey -------------------------------------------------------------------------------------------------
const { directPrerequisites } = await import("../../e8/knowledge-graph.js");
const { gradeOrder, journeyFor } = await import("./journey-map.js");
test("every grade's journey respects its own prerequisites and places every skill once", () => {
  for (let grade = 0; grade <= 8; grade++) {
    const order = gradeOrder(grade);
    const keys = order.map((s) => s.key);
    assert.equal(new Set(keys).size, keys.length, `grade ${grade} lists a skill twice`);
    const sameGrade = new Set(order.map((s) => s.key));
    order.forEach((s, i) => {
      for (const need of directPrerequisites(s.key)) {
        if (!need.startsWith(`${grade}:`) || need === s.key) continue;
        assert.ok(keys.indexOf(need) < i, `${s.key} comes before its prerequisite ${need} in grade ${grade}`);
      }
    });
    assert.equal(sameGrade.size, order.length);
  }
});
test("the journey recommends the first open skill, then advances after a finished experience", () => {
  const empty = journeyFor(4, cleanLab({}));
  assert.ok(empty.next, "a fresh grade has a next step");
  assert.equal(empty.next.state, "ready");
  assert.ok(empty.rows.some((r) => r.state === "exception"), "exceptions are shown, not hidden");
  assert.equal(empty.complete, false);
  // finish the first grade-4 experience with a real finished session, then the next step moves on
  const first = empty.next;
  const expId = first.expId;
  const exp = experienceById(expId);
  const finished = { ...newSession(exp, { seed: 3 }), done: true, step: exp.steps.length - 1 };
  const after = journeyFor(4, cleanLab({ sessions: { [expId]: finished } }));
  assert.equal(after.rows.find((r) => r.key === first.key).state, "done");
  assert.notEqual(after.next?.key, first.key, "a finished skill is not recommended again");
});
test("a started experience is resumed before a new one is opened", () => {
  const empty = journeyFor(6, cleanLab({}));
  const first = empty.next;
  const exp = experienceById(first.expId);
  const started = { ...newSession(exp, { seed: 4 }), step: 1 };
  const j = journeyFor(6, cleanLab({ sessions: { [first.expId]: started } }));
  assert.equal(j.next.key, first.key, "the unfinished work comes back first");
  assert.equal(j.next.state, "started");
});


// ---- family companions -----------------------------------------------------------------------------------------------------
const { COMPANIONS } = await import("./companions.js");
test("every flagship has a bilingual family companion that points at real experiences", () => {
  for (const id of ["fraction-transform", "balance-equation", "discover-area", "xray-division", "mistake-decimal", "build-area-24", "recipe-scaling", "reverse-36"]) {
    const c = COMPANIONS[id];
    assert.ok(c, `${id} needs a companion`);
    const texts = [c.goal, c.why, c.practice, c.watch, c.independent, ...c.talk];
    assert.ok(c.talk.length >= 2 && c.talk.length <= 3, `${id}: two or three questions`);
    for (const t of texts) {
      assert.ok(t.en && t.es, `${id}: both languages`);
      assert.notEqual(t.en, t.es, `${id}: Spanish is not a copy`);
    }
    assert.ok(experienceById(c.next), `${id}: next "${c.next}" must be an experience`);
    assert.ok(experienceById(id), `${id} is an experience`);
  }
});


// ---- teacher view and spiral review -----------------------------------------------------------------------------------------------
test("the teacher view's source data: every skill of every grade has a standard code", async () => {
  const { gradeOrder } = await import("./journey-map.js");
  const { skillNode } = await import("../../e8/knowledge-graph.js");
  for (let grade = 0; grade <= 8; grade++) {
    const order = gradeOrder(grade);
    assert.ok(order.length > 0, `grade ${grade} has skills`);
    for (const s of order) assert.ok(skillNode(s.key)?.standard, `${s.key} has a standard code`);
  }
});
test("spiral review offers earlier prerequisites with experiences, finished ones first, never more than asked", async () => {
  const { reviewFor, gradeOrder } = await import("./journey-map.js");
  const { directPrerequisites: prereqs } = await import("../../e8/knowledge-graph.js");
  let withReview = 0;
  for (let grade = 1; grade <= 8; grade++)
    for (const s of gradeOrder(grade)) {
      const r = reviewFor(cleanLab({}), s.key, 2);
      assert.ok(r.length <= 2);
      for (const item of r) {
        assert.ok(prereqs(s.key).includes(item.key), `${item.key} must be a prerequisite of ${s.key}`);
        assert.ok(experienceById(item.expId), "a review always has something to open");
      }
      if (r.length) withReview++;
    }
  assert.ok(withReview >= 5, "review appears for a meaningful number of skills");
  const key = "6:ratios";
  const base = reviewFor(cleanLab({}), key, 5);
  if (base.length > 1) {
    const last = base.at(-1);
    const exp = experienceById(last.expId);
    const done = { ...newSession(exp, { seed: 2 }), done: true, step: exp.steps.length - 1 };
    const after = reviewFor(cleanLab({ sessions: { [last.expId]: done } }), key, 5);
    assert.equal(after[0].key, last.key, "the finished prerequisite moves to the front");
  }
});

if (!process.exitCode) console.log(`reality lab: ${count} checks passed`);
