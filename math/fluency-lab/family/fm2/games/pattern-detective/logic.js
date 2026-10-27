// Pattern Detective logic (pure): building rounds, judging a rule by evaluating it on test inputs with exact
// arithmetic, comparing it with the clues the learner collected, and judging the faraway prediction.
// A response is { rule, far, evidence: [{m, x}], cls? }; `rule` is expression text (or a list of texts, or a list of
// shape ids for a repeating core). @fm2 FM-013 FM-058 FM-059 FM-060
import { add, eq, frac, mul, parse, toString } from "../../rational.js";
import { promptFor } from "./copy-prompts.js";
import {
  GOOD,
  clue,
  cycleClue,
  emptyCore,
  farSlip,
  fewClues,
  missingClass,
  missingFar,
  unreadable,
  unseen,
  wrongClass,
} from "./feedback.js";
import {
  g1CountPattern,
  g1GrowShape,
  g2EvenOdd,
  g2HundredChart,
  g2Skip,
  g3ArithRule,
  g3TimesTable,
  g4RulePattern,
  g4ShapeNth,
  kCore,
  kCountOn,
} from "./gen-low.js";
import {
  g5Numerical,
  g5TwoRules,
  g6IoTable,
  g6Variables,
  g7ConstantK,
  g7LinearEq,
  g7Proportional,
  g8Exponential,
  g8LinearNonlinear,
  g8Slope,
} from "./gen-high.js";
import { domainValues } from "./gen-kit.js";
import { lineForm, sequence, twoStep, wrap } from "./expr.js";
import {
  answerString,
  cycAt,
  equivalent,
  evalSpec,
  F,
  farAnswer,
  firstContradiction,
  numText,
  readRule,
  sameCore,
} from "./rules.js";
import { SKILL_SPECS } from "./skills.js";

export { SKILL_SPECS };
export { hint } from "./hints.js";

const BUILDERS = {
  "k-core": kCore,
  "k-count-on": kCountOn,
  "g1-count-pattern": g1CountPattern,
  "g1-grow-shape": g1GrowShape,
  "g2-skip": g2Skip,
  "g2-hundred-chart": g2HundredChart,
  "g2-even-odd": g2EvenOdd,
  "g3-times-table": g3TimesTable,
  "g3-arith-rule": g3ArithRule,
  "g4-rule-pattern": g4RulePattern,
  "g4-shape-nth": g4ShapeNth,
  "g5-two-rules": g5TwoRules,
  "g5-numerical-pattern": g5Numerical,
  "g6-io-table": g6IoTable,
  "g6-variables": g6Variables,
  "g7-proportional": g7Proportional,
  "g7-constant-k": g7ConstantK,
  "g7-linear-eq": g7LinearEq,
  "g8-linear-nonlinear": g8LinearNonlinear,
  "g8-slope": g8Slope,
  "g8-exponential": g8Exponential,
};

export function makeRound(skillId, level, rng, grade) {
  const build = BUILDERS[skillId];
  if (!build) throw new RangeError(`Unknown Pattern Detective skill: ${skillId}`);
  const round = build(Math.min(3, Math.max(1, level)), rng, grade);
  round.prompt = promptFor(round);
  return round;
}

// ---- Evidence --------------------------------------------------------------------------------------------------

export const inDomain = (round, x) =>
  Number.isInteger(x) && x >= round.dom.lo && x <= round.dom.hi && x % round.dom.mult === 0;

// The machine's true answer for a probe. Cells of a repeating pattern answer with a shape id.
export function probeValue(round, m, x) {
  const spec = round.machines[m]?.spec;
  if (!spec || !inDomain(round, x)) return null;
  return spec.t === "cyc" ? cycAt(spec.core, x) : evalSpec(spec, x);
}

export const valueText = (value) => (typeof value === "string" ? value : toString(value));

// Free clues plus the learner's probes. The answers are recomputed from the true rule, so a tampered row cannot
// change what the machine said.
export function evidenceRows(round, learnerRows) {
  const rows = [];
  const seen = new Set();
  const take = (m, x) => {
    const key = `${m}:${x}`;
    const y = probeValue(round, m, x);
    if (y === null || seen.has(key)) return;
    seen.add(key);
    rows.push({ m, x, y, yText: valueText(y) });
  };
  for (const row of round.seed) take(row.m, row.x);
  for (const row of Array.isArray(learnerRows) ? learnerRows : [])
    take(Number(row?.m) || 0, Number(row?.x));
  return rows;
}

// ---- Statement forms ---------------------------------------------------------------------------------------------

const textOf = (frac_) => numText([frac_.n, frac_.d]);

export function seqFields(round, spec) {
  if (spec.t === "geo") return { op: "mul", start: numText(spec.c), step: numText(spec.r) };
  return { op: "add", start: textOf(evalSpec(spec, round.x0)), step: numText(spec.a) };
}

export function exprFields(round, spec) {
  const a = F(spec.a);
  const b = F(spec.b);
  const first = round.ops.first;
  const sign = (value) => (value.n < 0 ? "−" : "+");
  const abs = (value) => textOf(frac(Math.abs(value.n), value.d));
  if (a.n === 1 && a.d === 1 && first.includes(sign(b)))
    return { op1: sign(b), a: abs(b), op2: "none", b: "" };
  if (a.d !== 1 && b.n === 0) {
    return a.n === 1
      ? { op1: "÷", a: String(a.d), op2: "none", b: "" }
      : { op1: "×", a: String(a.n), op2: "÷", b: String(a.d) };
  }
  return b.n === 0
    ? { op1: "×", a: textOf(a), op2: "none", b: "" }
    : { op1: "×", a: textOf(a), op2: sign(b), b: abs(b) };
}

const typedText = (spec) => {
  if (spec.t === "sq") return `${wrap(numText(spec.a))}*x^2+${wrap(numText(spec.b))}`;
  if (spec.t === "geo") return `${wrap(numText(spec.c))}*${wrap(numText(spec.r))}^x`;
  return `${wrap(numText(spec.a))}*x+${wrap(numText(spec.b))}`;
};

// The fields a learner would fill in to state the true rule; the same shape the form's controls produce.
export function canonicalFields(round) {
  const spec = round.machines[0].spec;
  if (round.form === "cycle") return { core: [...spec.core] };
  if (round.form === "seq") return seqFields(round, spec);
  if (round.form === "expr") return exprFields(round, spec);
  if (round.form === "line") return { m: numText(spec.a), b: numText(spec.b) };
  if (round.form === "typed") return { text: typedText(spec) };
  return {
    A: seqFields(round, round.machines[0].spec),
    B: seqFields(round, round.machines[1].spec),
  };
}

export function expressionFromFields(round, fields) {
  if (round.form === "cycle") return [...(fields.core || [])];
  if (round.form === "seq") return sequence({ ...fields, x0: round.x0 });
  if (round.form === "expr") return twoStep(fields);
  if (round.form === "line") return lineForm(fields);
  if (round.form === "typed") return fields.text || "";
  return [sequence({ ...fields.A, x0: round.x0 }), sequence({ ...fields.B, x0: round.x0 })];
}

// ---- Checking ----------------------------------------------------------------------------------------------------

const ok = (round) => ({ correct: true, feedback: round.form === "cycle" ? GOOD.core : GOOD.rule });

function checkCycle(round, response) {
  const core = response.rule;
  const spec = round.machines[0].spec;
  const rows = evidenceRows(round, response.evidence);
  if (!Array.isArray(core) || !core.length || core.some((id) => !round.alpha.includes(id)))
    return emptyCore();
  for (const row of [...rows].sort((p, q) => p.x - q.x)) {
    const got = cycAt(core, row.x);
    if (got !== row.y) return cycleClue(round, row.x, row.y, got);
  }
  if (!sameCore(spec.core, core)) {
    const needed = 2 * (round.say.maxCore || 3) - 1;
    return rows.length < needed ? fewClues(round, rows.length, "cycle") : unseen(round, "cycle");
  }
  const far = response.far;
  if (!round.alpha.includes(far)) return missingFar(round);
  const want = cycAt(spec.core, round.far);
  if (far === want) return ok(round);
  if (far === cycAt(spec.core, round.far - 1))
    return farSlip(round, "far-cycle-off-by-one", { other: round.far - 1 });
  if (far === cycAt(spec.core, round.far + 1))
    return farSlip(round, "far-cycle-off-by-one", { other: round.far + 1 });
  const last = [...rows].sort((p, q) => q.x - p.x)[0];
  if (last && far === last.y) return farSlip(round, "far-last-seen");
  return farSlip(round, "far-cycle-count");
}

function farMistake(round, spec, got, rows) {
  const at = (x) => {
    try {
      return evalSpec(spec, x);
    } catch {
      return null;
    }
  };
  for (const other of [round.far - 1, round.far + 1]) {
    const value = at(other);
    if (value && eq(got, value)) return farSlip(round, "far-off-by-one", { other });
  }
  if (spec.t === "lin") {
    const a = F(spec.a);
    const b = F(spec.b);
    const x = frac(round.far);
    if (b.n !== 0 && eq(got, mul(a, x))) return farSlip(round, "far-dropped-constant");
    if ((a.n !== 1 || a.d !== 1) && eq(got, add(x, b)))
      return farSlip(round, "far-dropped-multiplier");
    const last = [...rows].sort((p, q) => q.x - p.x)[0];
    if (last && eq(got, add(last.y, a))) return farSlip(round, "far-one-step");
  }
  if (spec.t === "geo" && eq(got, mul(F(spec.c), mul(F(spec.r), frac(round.far - spec.x0)))))
    return farSlip(round, "far-repeated-multiplying");
  if (spec.t === "sq" && eq(got, add(mul(F(spec.a), frac(2 * round.far)), F(spec.b))))
    return farSlip(round, "far-doubled-not-squared");
  return farSlip(round, "far-arithmetic");
}

function checkNumeric(round, response) {
  const texts = round.machines.length > 1 ? response.rule : [response.rule];
  const rows = evidenceRows(round, response.evidence);
  const trees = [];
  for (let i = 0; i < round.machines.length; i += 1) {
    const read = readRule(Array.isArray(texts) ? (texts[i] ?? "") : "");
    if (read.error)
      return unreadable(
        round,
        read.error === "empty"
          ? "empty"
          : ["paren", "shape", "symbol", "constant"].includes(read.error)
            ? read.error
            : "other",
      );
    trees.push(read.tree);
  }
  for (let i = 0; i < trees.length; i += 1) {
    const bad = firstContradiction(
      trees[i],
      rows.filter((row) => row.m === i),
    );
    if (bad) return clue(round, bad.row, bad.got ? toString(bad.got) : "");
  }
  const need = round.say.op === "both" || round.cls?.id === "linear" ? 3 : 2;
  for (let i = 0; i < trees.length; i += 1) {
    if (equivalent(round.machines[i].spec, trees[i])) continue;
    const distinct = new Set(rows.filter((row) => row.m === i).map((row) => row.x)).size;
    return distinct < need ? fewClues(round, distinct, "number") : unseen(round, "number");
  }
  if (round.cls) {
    if (!response.cls) return missingClass();
    if (response.cls !== round.cls.answer) return wrongClass(round.cls.id);
  }
  const got = parse(String(response.far ?? ""));
  if (!got) return missingFar(round);
  if (eq(got, farAnswer(round))) return ok(round);
  return farMistake(
    round,
    round.machines[round.farM || 0].spec,
    got,
    rows.filter((row) => row.m === (round.farM || 0)),
  );
}

export function check(round, response) {
  const r = response && typeof response === "object" ? response : {};
  return round.form === "cycle" ? checkCycle(round, r) : checkNumeric(round, r);
}

// ---- Solving -----------------------------------------------------------------------------------------------------

export function solve(round) {
  const fields = canonicalFields(round);
  const plan = round.plan.map((p) => ({ m: p.m, x: p.x }));
  const rows = evidenceRows(round, plan).map((row) => ({ m: row.m, x: row.x, y: row.yText }));
  return {
    rule: expressionFromFields(round, fields),
    fields,
    far: answerString(round),
    cls: round.cls ? round.cls.answer : undefined,
    evidence: rows,
    probe: plan,
  };
}

export const answerText = (round) => answerString(round);
export const domainOf = (round) => domainValues(round.dom);
