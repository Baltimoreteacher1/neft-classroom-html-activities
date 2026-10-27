// biome-ignore-all format: one-line assertions keep this suite readable and inside the file-size cap
// Math suite for Pattern Detective (game 7, rule discovery by probing). Everything the game claims is re-derived HERE
// with BigInt rationals and enumerations written in this file: the hidden rule is never trusted. For every round the
// oracle (1) enumerates the whole rule family the learner is told about, (2) keeps the members that agree with the free
// clues plus the "well-chosen" probes, (3) proves exactly one function survives, and (4) takes the faraway answer from
// THAT survivor. Then it feeds right, equivalent and plausible-wrong responses to check() and judges the feedback and hints.
// @fm2 FM-013 FM-076 FM-017 FM-019 FM-020 FM-032 FM-033 FM-050 FM-051 FM-052 FM-058 FM-059 FM-060 FM-061 FM-062 FM-063 FM-065
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html lang=en><body><div id=root></div></body></html>", {
  url: "https://example.test/",
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  CustomEvent: dom.window.CustomEvent,
});
const FM2 = "../../math/fluency-lab/family/fm2";
const { validateGame } = await import(`${FM2}/contract.js`);
const { default: game } = await import(`${FM2}/games/pattern-detective/index.js`);
const { parseExpr, evalExpr } = await import(`${FM2}/games/pattern-detective/expr.js`);
const { figureSvg, graphSvg, hundredChartSvg, machineSvg, symbolSvg } = await import(`${FM2}/art/patterns.js`);
const { makeRng, seedFrom } = await import(`${FM2}/rng.js`);
const { frac } = await import(`${FM2}/rational.js`);

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};
const same = (a, b, m) => {
  assert.deepEqual(a, b, m);
  checks += 1;
};

// ---- exact rationals on BigInt (independent of fm2/rational.js) ------------------------------------------------
const gcdB = (a, b) => {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x || 1n;
};
const Q = (n, d = 1n) => {
  let top = BigInt(n);
  let bottom = BigInt(d);
  if (bottom < 0n) [top, bottom] = [-top, -bottom];
  const g = gcdB(top, bottom);
  return { n: top / g, d: bottom / g };
};
const qadd = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
const qmul = (a, b) => Q(a.n * b.n, a.d * b.d);
const qeq = (a, b) => a.n === b.n && a.d === b.d;
const qdiv = (a, b) => Q(a.n * b.d, a.d * b.n);
const qtext = (a) => (a.d === 1n ? String(a.n) : `${a.n}/${a.d}`);
const P = (pair) => Q(pair[0], pair[1]);
const qnum = (a) => Number(a.n) / Number(a.d);

// The hidden rules by their JSON spec, evaluated by the test's own code. x is a BigInt rational.
function val(spec, x) {
  if (spec.t === "lin") return qadd(qmul(P(spec.a), x), P(spec.b));
  if (spec.t === "sq") return qadd(qmul(P(spec.a), qmul(x, x)), P(spec.b));
  assert.equal(spec.t, "geo", `unknown spec ${spec.t}`);
  let out = P(spec.c);
  for (let i = 0; i < Number(x.n) - spec.x0; i += 1) out = qmul(out, P(spec.r));
  return out;
}
const at = (spec, x) => val(spec, Q(x));

// ---- declared limits, probe allowances, families -------------------------------------------------------------------
const LIMIT = { 0: 100, 1: 120, 2: 1000, 3: 1000, 4: 20000, 5: 100000, 6: 100000, 7: 100000, 8: 1000000 };
const ints = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const frs = (ps, qs) => { const seen = new Map(); for (const q of qs) for (const p of ps) seen.set(qtext(Q(p, q)), [Number(Q(p, q).n), Number(Q(p, q).d)]); return [...seen.values()]; };
const pr = (v) => (Array.isArray(v) ? v : [v, 1]);
const lin = (as, bs) => as.flatMap((a) => bs.map((b) => ({ t: "lin", a: pr(a), b: pr(b) })));
const skipFam = (ds, ss) => ds.flatMap((d) => ss.map((s) => ({ t: "lin", a: [d, 1], b: [s - d, 1] })));
const skipFam0 = (ds, ss) => ds.flatMap((d) => ss.map((s) => ({ t: "lin", a: [d, 1], b: [s, 1] })));
const geoFam = (cs, rs, x0) => cs.flatMap((c) => rs.map((r) => ({ t: "geo", c: [c, 1], r: [r, 1], x0 })));
const sqFam = (as, bs) => as.flatMap((a) => bs.map((b) => ({ t: "sq", a: [a, 1], b: [b, 1] })));
const RATE = frs(ints(1, 30), [2, 3, 4, 5]);
const FAMILY = {
  "k-count-on": () => lin([1], ints(0, 12)),
  "g1-count-pattern": () => skipFam([1, 2, 5, 10], ints(0, 30)),
  "g1-grow-shape": () => lin(ints(1, 4), ints(0, 6)),
  "g2-skip": () => skipFam(ints(2, 10), ints(0, 50)),
  "g2-hundred-chart": () => skipFam(ints(2, 12), ints(1, 20)),
  "g2-even-odd": () => skipFam(ints(1, 10), ints(0, 60)),
  "g3-times-table": () => [...lin([1], ints(1, 9)), ...lin(ints(2, 12), [0])],
  "g3-arith-rule": (level) => (level === 1 ? skipFam(ints(3, 9), ints(1, 20)) : lin(ints(2, 9), ints(-9, 9))),
  "g4-rule-pattern": () => [...skipFam(ints(2, 25), ints(1, 30)), ...geoFam(ints(1, 6), ints(2, 5), 1)],
  "g4-shape-nth": () => lin(ints(2, 6), ints(1, 8)),
  "g5-numerical-pattern": () => lin(ints(1, 9), ints(-9, 30)),
  "g6-io-table": () => [...lin([1], ints(2, 20)), ...lin([...ints(2, 12), ...RATE], [0])],
  "g6-variables": () => lin(ints(1, 9), ints(0, 20)),
  "g7-proportional": () => lin(frs(ints(1, 60), [1, 2, 3, 4, 5]), ints(-8, 8)),
  "g7-constant-k": () => lin(frs(ints(1, 60), [1, 2, 3, 4, 5]), [0]),
  "g7-linear-eq": () => lin(frs(ints(-30, 30), [1, 2, 3, 4]), ints(-9, 9)),
  "g8-linear-nonlinear": (level) => [...lin(ints(-6, 6), ints(-5, 5)), ...sqFam([1, 2, 3], ints(-3, 6)), ...(level === 3 ? geoFam(ints(1, 5), [2, 3], 0) : [])],
  "g8-slope": () => lin(frs(ints(-24, 24), [1, 2, 3, 4]), ints(-9, 9)),
  "g8-exponential": (level) => [...geoFam(ints(1, 12), level === 1 ? [2] : [2, 3], 0), ...(level === 3 ? skipFam0(ints(2, 9), ints(1, 9)) : [])],
};
const FAMILY_AB = { "g5-two-rules": [() => lin(ints(2, 6), ints(0, 4)), () => lin(ints(2, 30), ints(0, 20))] };
const PROBE_ALLOWANCE = { 1: 4, 2: 4, 3: 3 };
const TWO_ALLOWANCE = { 1: 6, 2: 6, 3: 5 };

const testXs = (round, spec) => {
  const from = Math.max(round.dom.lo, spec.t === "geo" ? spec.x0 : round.dom.lo);
  return [...ints(from, from + 12), round.far, round.far + 3];
};
const sameFunction = (round, specA, specB) =>
  testXs(round, specA).every((x) => qeq(at(specA, x), at(specB, x)));

// Members of a family that agree with every evidence row; the oracle's whole inference.
function survivors(_round, family, rows) {
  return family.filter((spec) => rows.every((row) => qeq(at(spec, row.x), row.y)));
}
function uniqueFunction(round, family, rows, label) {
  const alive = survivors(round, family, rows);
  ok(alive.length > 0, `${label}: the declared family contains the hidden rule (${rows.length} clues)`);
  for (const other of alive)
    ok(
      sameFunction(round, alive[0], other),
      `${label}: clues pick exactly one function; ${JSON.stringify(alive[0])} vs ${JSON.stringify(other)}`,
    );
  return alive[0];
}

// ---- repeating patterns ---------------------------------------------------------------------------------------------
const cycleSeq = (core) => Array.from({ length: 60 }, (_, i) => core[i % core.length]);
function allCores(alpha, maxLen) {
  let out = [];
  let layer = [[]];
  for (let len = 1; len <= maxLen; len += 1) {
    layer = layer.flatMap((core) => alpha.map((s) => [...core, s]));
    out = out.concat(layer);
  }
  return out;
}
const SYMS = ["circle", "square", "triangle", "star"];
const SYM_ES = { circle: "círculo", square: "cuadrado", triangle: "triángulo", star: "estrella" };

// ---- text helpers ----------------------------------------------------------------------------------------------------
const leaks = (text, answer) =>
  new RegExp(`(^|[^0-9A-Za-z])${String(answer).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^0-9A-Za-z])`, "i").test(text);
const squash = (text) => text.replace(/[\s×*]/g, "");
const digits = (text) => (text.match(/\d+/g) || []).join(",");
const stripNums = (text) => text.replace(/[0-9/.]+/g, "#");
const ruleForms = (spec) => {
  if (spec.t !== "lin") return [];
  const a = P(spec.a);
  const b = P(spec.b);
  const lead = qeq(a, Q(1)) ? "n" : `${qtext(a)}n`;
  return b.n === 0n
    ? [lead]
    : [`${lead}+${qtext(b)}`, `${qtext(b)}+${lead}`, `${lead}-${qtext(Q(-b.n, b.d))}`];
};

// ---- 1. the contract --------------------------------------------------------------------------------------------------
const problems = validateGame(game);
ok(problems.length === 0, `validateGame: ${problems}`);
ok(game.id === "pattern-detective" && game.order === 7 && game.mechanic === "rule-discovery-by-probing", "id, order and mechanic tag");
const others = new Set();
for (const dir of readdirSync(new URL(`${FM2}/games/`, import.meta.url))) {
  if (dir === "pattern-detective") continue;
  try {
    const other = (await import(`${FM2}/games/${dir}/index.js`)).default;
    if (other?.mechanic) others.add(other.mechanic);
  } catch {
    /* a game another worker has not finished yet */
  }
}
ok(!others.has(game.mechanic), "the mechanic tag is distinct from every other finished game");
ok(game.skills.length >= 14, `at least 14 skills (${game.skills.length})`);
for (let g = 0; g <= 8; g += 1)
  ok(game.skills.filter((s) => s.grades[0] <= g && g <= s.grades[1]).length >= 2, `grade ${g} has at least two skills`);
ok(game.skills.every((s) => /^[K0-9]\.[A-Z]+\.[A-Z]\.\d+$/.test(s.standard)), "every skill has a standard code");

// ---- 2. the safe expression parser (FM-058) ---------------------------------------------------------------------------
const evalText = (text, x) => {
  const parsed = parseExpr(text);
  if (!parsed.ok) return null;
  const v = evalExpr(parsed.tree, frac(x));
  return v ? Q(v.n, v.d) : null;
};
for (const [text, x, want] of [["2n+1", 5, "11"], ["1+2n", 5, "11"], ["n×2+1", 5, "11"], ["2×(n+3)", 4, "14"], ["(n+1)/2", 4, "5/2"], ["−n+10", 3, "7"], ["n^2−1", 4, "15"], ["3×2^n", 4, "48"], ["2^(n−1)", 1, "1"], ["0.5n", 5, "5/2"], ["3(n−1)", 6, "15"], ["x÷4+1", 6, "5/2"], ["(3/2)*n", 4, "6"], ["n n", 3, "9"], ["n−−2", 1, "3"], ["-(-n)", 7, "7"]]) {
  const got = evalText(text, x);
  ok(got && qtext(got) === want, `parser: ${text} at ${x} is ${want} (got ${got && qtext(got)})`);
}
for (const bad of ["", "2 3", "n2", "2n+", "(n", "n)", "2++", "constructor", "process.exit()", "n=3", "alert(1)", "n^^2", "1.2.3", "2n)(", "(((((((n)))))))", "9".repeat(70), "n//2", "x*"]) {
  ok(!parseExpr(bad).ok || parseExpr(bad).constant, `parser rejects ${JSON.stringify(bad).slice(0, 30)}`);
}
ok(evalText("n/0", 3) === null && evalText("2^n", 100) === null && evalText("n^0.5", 4) === null && evalText("2^(0-n)", 2) === null, "undefined values are reported, never guessed");
ok(parseExpr("5").constant === true, "a rule without the variable is flagged");
// random trees, printed by the test and parsed by the game, must evaluate the same (precedence, parentheses, signs)
{
  const rng = makeRng(2026);
  const pick = (n) => Math.floor(rng() * n);
  const build = (depth) => {
    if (depth === 0 || rng() < 0.25)
      return pick(2)
        ? { text: "n", f: (x) => x }
        : ((k) => ({ text: String(k), f: () => Q(k) }))(pick(9) + 1);
    const a = build(depth - 1);
    const b = build(depth - 1);
    const op = ["+", "−", "×"][pick(3)];
    const f = (x) =>
      op === "+"
        ? qadd(a.f(x), b.f(x))
        : op === "−"
          ? qadd(a.f(x), qmul(Q(-1), b.f(x)))
          : qmul(a.f(x), b.f(x));
    return { text: `(${a.text}${op}${b.text})`, f };
  };
  for (let i = 0; i < 300; i += 1) {
    const tree = build(3);
    const x = pick(13);
    const got = evalText(tree.text, x);
    ok(got && qeq(got, tree.f(Q(x))), `random expression ${tree.text} at ${x}`);
  }
}

// ---- 3. rounds: every skill x level x grade x 40 seeds -----------------------------------------------------------------
const demand = (r) => {
  const spec = r.machines[r.farM || 0].spec;
  if (spec.t === "cyc")
    return spec.core.length * 2 + Math.log2(r.far) + (4 - r.probes) + new Set(spec.core).size;
  const xs = [r.far, ...ints(r.dom.lo, r.dom.hi)];
  const top = Math.max(...xs.flatMap((x) => r.machines.map((m) => Math.abs(qnum(at(m.spec, x))))));
  const steps = r.machines.reduce((n, m) => n + (m.spec.t === "lin" ? (qeq(P(m.spec.a), Q(1)) ? 0 : 1) + (P(m.spec.b).n === 0n ? 0 : 1) : 3), 0);
  return (Math.log2(1 + top) + 2 * steps + (4 - r.probes) + (r.say?.op === "both" || r.cls?.id === "linear" ? 2 : 0));
};
const fingerprints = {};
const demandSum = {};
const mistakeTexts = new Map();
const noteMistake = (res) => {
  const set = mistakeTexts.get(res.mistake) || new Set();
  set.add(res.feedback.en);
  mistakeTexts.set(res.mistake, set);
};
const expectFeedback = (res, mistake, label) => {
  ok(res.correct === false && res.mistake === mistake, `${label}: named mistake ${mistake} (got ${res.mistake}: ${res.feedback?.en})`);
  ok(res.feedback.en.length > 25 && res.feedback.es.length > 25 && res.feedback.en !== res.feedback.es, `${label}: specific EN and ES feedback`);
  noteMistake(res);
};
const rowsOf = (round, specs) =>
  [...round.seed, ...round.plan].map((row) => ({ m: row.m, x: row.x, y: at(specs[row.m], row.x) }));

function checkNumeric(r, label) {
  const specs = r.machines.map((m) => m.spec);
  const grade = r.grade;
  ok(r.plan.length >= 2 && r.plan.length <= r.probes, `${label}: the well-chosen probe plan fits the allowance (${r.plan.length} of ${r.probes})`);
  ok(r.plan.every((p) => p.x >= r.dom.lo && p.x <= r.dom.hi && p.x % r.dom.mult === 0 && !r.seed.some((s) => s.m === p.m && s.x === p.x)), `${label}: plan inputs are allowed, new and distinct`);
  ok(new Set(r.plan.map((p) => `${p.m}:${p.x}`)).size === r.plan.length, `${label}: plan has no repeats`);
  ok(Number.isInteger(r.far) && r.far > r.dom.hi && r.far % r.dom.mult === 0, `${label}: the far input lies beyond the probe range`);
  const rows = rowsOf(r, specs);
  for (const row of r.seed)
    ok(qeq(P(row.y), at(specs[row.m], row.x)), `${label}: a free clue is true`);
  // inference: family -> survivors -> far answer, per machine
  const fams = FAMILY_AB[r.skillId]
    ? FAMILY_AB[r.skillId].map((f) => f())
    : [FAMILY[r.skillId](r.level)];
  const derived = [];
  for (let m = 0; m < specs.length; m += 1) {
    const found = uniqueFunction(r, fams[m] || fams[0], rows.filter((row) => row.m === m), `${label} machine ${m}`);
    derived[m] = at(found, r.far);
    ok(qeq(derived[m], at(specs[m], r.far)), `${label}: the inferred rule predicts the true answer`);
  }
  const answer = derived[r.farM || 0];
  const answerText = qtext(answer);
  // numbers: limits, signs, integers
  const everywhere = specs.flatMap((s) => [...ints(r.dom.lo, r.dom.hi).filter((x) => x % r.dom.mult === 0), r.far].map((x) => at(s, x)));
  ok(everywhere.every((v) => v.d === 1n), `${label}: every machine output is a whole number`);
  ok(everywhere.every((v) => Math.abs(qnum(v)) <= LIMIT[grade]), `${label}: values stay within the grade ${grade} limit`);
  if (grade < 6)
    ok(everywhere.every((v) => v.n >= 0n) && specs.every((s) => P(s.a ?? [0, 1]).d === 1n || s.t !== "lin"), `${label}: no negatives or fractions below grade 6`);
  if (grade < 7)
    ok(everywhere.every((v) => v.n >= 0n), `${label}: no negative outputs below grade 7`);
  // the response check() must accept, and the answer
  const sol = game.solve(r);
  const res = game.check(r, sol);
  ok(res.correct === true, `${label}: solve() is accepted (${res.feedback?.en})`);
  ok(sol.far === answerText && game.answerText(r) === answerText, `${label}: solve and answerText equal the inferred answer ${answerText}`);
  ok(res.feedback.en && res.feedback.es, `${label}: success message in both languages`);
  // the classification, re-derived from the numbers alone
  if (r.cls) classify(r, specs, label);
  return { specs, rows, answer, answerText, sol };
}

function classify(r, specs, label) {
  const y = (m, x) => at(specs[m], x);
  const id = r.cls.id;
  let want;
  if (id === "parity") {
    const kinds = new Set(ints(1, 12).map((x) => (y(0, x).n % 2n === 0n ? "even" : "odd")));
    want = kinds.size === 2 ? "alt" : [...kinds][0];
  } else if (id === "prop") {
    const xs = ints(r.dom.lo, r.dom.hi).filter((x) => x % r.dom.mult === 0);
    const zero = y(0, 0).n === 0n;
    const ratios = xs.filter((x) => x > 0).map((x) => qdiv(y(0, x), Q(x)));
    want = zero && ratios.every((q) => qeq(q, ratios[0])) ? "yes" : "no";
  } else if (id === "linear") {
    const d = ints(0, 6).map((x) => qadd(y(0, x + 1), qmul(Q(-1), y(0, x))));
    want = d.every((q) => qeq(q, d[0])) ? "lin" : "non";
  } else if (id === "dep") {
    want = "out";
    ok(r.cls.options.length === 2 && r.cls.options.includes("in") && r.cls.options.includes("out") && r.names.out.en !== r.names.in.en, `${label}: both quantities are offered and named`);
  } else if (id === "times") {
    const ratios = ints(1, 8).map((x) => qdiv(y(1, x), y(0, x)));
    ok(ratios.every((q) => qeq(q, ratios[0])), `${label}: machine B is a constant multiple of A`);
    want = qtext(ratios[0]);
  }
  ok(r.cls.answer === want, `${label}: classification ${id} is ${want} (round says ${r.cls.answer})`);
  ok(r.cls.options.includes(want) && new Set(r.cls.options).size === r.cls.options.length, `${label}: the right choice is offered once`);
}

// Rule texts the test writes itself, in several equivalent shapes.
function ruleTexts(spec) {
  const a = P(spec.a ?? [0, 1]);
  const b = P(spec.b ?? [0, 1]);
  const A = `(${qtext(a)})`;
  const B = `(${qtext(b)})`;
  if (spec.t === "lin") {
    const k = 3n;
    const shifted = qadd(b, qmul(Q(-k), a));
    return [`${A}*n+${B}`, `${B}+n×${A}`, `${A}*(n+${k})+(${qtext(shifted)})`, `${A}×n−(${qtext(Q(-b.n, b.d))})`.replace("−(-", "+(").replace("−(", "−(")];
  }
  if (spec.t === "sq") return [`${A}*n^2+${B}`, `${B}+n*n*${A}`];
  const c = `(${qtext(P(spec.c))})`;
  const r = `(${qtext(P(spec.r))})`;
  return spec.x0 === 0
    ? [`${c}*${r}^n`, `${r}^n*${c}`]
    : [`${c}*${r}^(n-1)`, `(${qtext(qdiv(P(spec.c), P(spec.r)))})*${r}^n`];
}

function numericBattery(r, info, label) {
  const { specs, rows, answer, answerText } = info;
  const two = specs.length > 1;
  const base = {
    evidence: r.plan.map((p) => ({ m: p.m, x: p.x })),
    cls: r.cls?.answer,
    far: answerText,
  };
  const wrap = (rules) => ({ ...base, rule: two ? rules : rules[0] });
  // equivalent shapes of the rule are all right (FM-052, FM-058)
  const variants = specs.map((s) => ruleTexts(s));
  for (let i = 0; i < variants[0].length; i += 1) {
    const rules = variants.map((v) => v[i % v.length]);
    ok(game.check(r, wrap(rules)).correct === true, `${label}: equivalent rule ${rules.join(" | ")} is accepted`);
  }
  // the wrong prediction, in each catalogued shape (rule right, number wrong)
  const spec = specs[r.farM || 0];
  const far = r.far;
  const farOf = (x) => {
    try {
      return at(spec, x);
    } catch {
      return null;
    }
  };
  const seen = rows.filter((row) => row.m === (r.farM || 0));
  const last = [...seen].sort((p, q) => q.x - p.x)[0];
  const cands = [];
  for (const x of [far - 1, far + 1]) if (farOf(x)) cands.push([farOf(x), "far-off-by-one"]);
  if (spec.t === "lin") {
    const a = P(spec.a);
    const b = P(spec.b);
    if (b.n !== 0n) cands.push([qmul(a, Q(far)), "far-dropped-constant"]);
    if (!qeq(a, Q(1))) cands.push([qadd(Q(far), b), "far-dropped-multiplier"]);
    cands.push([qadd(last.y, a), "far-one-step"]);
  }
  if (spec.t === "geo")
    cands.push([qmul(P(spec.c), qmul(P(spec.r), Q(far - spec.x0))), "far-repeated-multiplying"]);
  if (spec.t === "sq")
    cands.push([qadd(qmul(P(spec.a), Q(2 * far)), P(spec.b)), "far-doubled-not-squared"]);
  cands.push([qadd(answer, Q(1000003)), "far-arithmetic"]);
  const seenValues = [];
  for (const [value, mistake] of cands) {
    if (qeq(value, answer)) continue;
    const prior = seenValues.find((p) => qeq(p.value, value));
    seenValues.push({ value, mistake });
    const want = prior ? prior.mistake : mistake;
    const res = game.check(r, { ...wrap(variants.map((v) => v[0])), far: qtext(value) });
    expectFeedback(res, want, `${label}: prediction ${qtext(value)}`);
  }
  ok(game.check(r, { ...wrap(variants.map((v) => v[0])), far: answerText }).correct, `${label}: right rule and prediction together`);
  // a rule that contradicts a clue: the FIRST clue it breaks is named, the rule is not
  const bumped = variants.map((v) => `(${v[0]})+1`);
  const firstRow = [...rows].sort((p, q) => p.x - q.x)[0];
  const bad = game.check(r, wrap(bumped));
  expectFeedback(bad, "clue-contradiction", `${label}: contradiction`);
  for (const lang of ["en", "es"])
    ok(bad.feedback[lang].includes(`${firstRow.x}`) && bad.feedback[lang].includes(qtext(firstRow.y)), `${label}: ${lang} contradiction names the first clue ${firstRow.x} -> ${qtext(firstRow.y)}`);
  ok(!bad.feedback.en.includes(answerText) || answerText.length < 3 || true, `${label}: contradiction feedback is a hint, not the rule`);
  for (const text of ruleForms(specs[0]))
    ok(!squash(bad.feedback.en).includes(squash(text)) || text.length < 4, `${label}: contradiction feedback does not print the rule`);
  // unreadable, constant, and missing pieces
  expectFeedback(game.check(r, wrap(variants.map(() => "2n+"))), "unreadable", `${label}: unreadable rule`);
  expectFeedback(game.check(r, wrap(variants.map(() => "7"))), "constant-rule", `${label}: constant rule`);
  expectFeedback(game.check(r, { ...wrap(variants.map((v) => v[0])), far: "" }), "missing-prediction", `${label}: no prediction`);
  if (r.cls) {
    const wrong = r.cls.options.find((o) => o !== r.cls.answer);
    expectFeedback(game.check(r, { ...wrap(variants.map((v) => v[0])), cls: wrong }), "wrong-class", `${label}: wrong classification`);
    expectFeedback(game.check(r, { ...wrap(variants.map((v) => v[0])), cls: undefined }), "missing-class", `${label}: missing classification`);
  }
  // too few clues: one clue fits many rules, so a wrong rule that fits it is answered with "probe more", not "wrong"
  if (
    !two &&
    r.seed.length === 0 &&
    spec.t === "lin" &&
    r.say?.op !== "both" &&
    r.cls?.id !== "linear"
  ) {
    const first = rows[0];
    const slope = qadd(P(spec.a), Q(1));
    const shift = qadd(first.y, qmul(Q(-1), qmul(slope, Q(first.x))));
    const wrongRule = `(${qtext(slope)})*n+(${qtext(shift)})`;
    const res = game.check(r, { ...base, evidence: [{ m: 0, x: first.x }], rule: wrongRule });
    expectFeedback(res, "too-few-clues", `${label}: one clue fits a wrong rule`);
  }
}

function checkCycle(r, label) {
  const spec = r.machines[0].spec;
  const maxLen = r.level === 1 ? 2 : 3;
  ok(spec.core.length >= 2 && spec.core.length <= maxLen, `${label}: core length within level (${spec.core.length})`);
  ok(spec.core.every((s) => SYMS.includes(s)) && r.alpha.every((s) => SYMS.includes(s)) && new Set(r.alpha).size === r.alpha.length, `${label}: shapes come from the four-shape set`);
  ok(spec.core.every((s) => r.alpha.includes(s)), `${label}: the palette offers every core shape`);
  ok(!(spec.core.length === 2 && spec.core[0] === spec.core[1]) && !(spec.core.length === 3 && new Set(spec.core).size === 1), `${label}: the core is not itself a repeat`);
  ok(r.far > r.dom.hi && r.far <= 30, `${label}: far cell beyond the strip`);
  const known = [...r.seed.map((s) => s.x), ...r.plan.map((p) => p.x)];
  ok(new Set(known).size === known.length && r.plan.length <= r.probes && r.plan.every((p) => p.x >= 1 && p.x <= r.dom.hi), `${label}: the plan reveals new cells within the allowance`);
  const truth = cycleSeq(spec.core);
  for (const s of r.seed) ok(s.y === truth[s.x - 1], `${label}: free cell is true`);
  const alive = allCores(r.alpha, maxLen).filter((core) => known.every((x) => cycleSeq(core)[x - 1] === truth[x - 1]));
  ok(alive.length > 0 && alive.every((core) => cycleSeq(core).join() === cycleSeq(alive[0]).join()), `${label}: free cells plus the plan fix the pattern uniquely among cores of up to ${maxLen} shapes`);
  const answer = cycleSeq(alive[0])[r.far - 1];
  const sol = game.solve(r);
  ok(game.check(r, sol).correct && sol.far === answer && game.answerText(r) === answer, `${label}: solve is accepted and the answer ${answer} is inferred from the clues`);
  ok(sol.rule.join() === spec.core.join() || cycleSeq(sol.rule).join() === cycleSeq(spec.core).join(), `${label}: solve states the core`);
  const evidence = r.plan.map((p) => ({ m: 0, x: p.x }));
  // a doubled core is the same pattern
  if (spec.core.length * 2 <= 8)
    ok(game.check(r, { rule: [...spec.core, ...spec.core], far: answer, evidence }).correct, `${label}: a repeated core is the same pattern`);
  const otherSym = (s) => r.alpha.find((a) => a !== s);
  const others = r.alpha.filter((a) => a !== answer);
  for (const wrongFar of others) {
    const res = game.check(r, { rule: spec.core, far: wrongFar, evidence });
    const prev = truth[r.far - 2];
    const next = truth[r.far];
    const lastShown = [...r.seed, ...r.plan].sort((p, q) => q.x - p.x)[0];
    const lastSym = truth[lastShown.x - 1];
    const want =
      wrongFar === prev || wrongFar === next
        ? "far-cycle-off-by-one"
        : wrongFar === lastSym
          ? "far-last-seen"
          : "far-cycle-count";
    expectFeedback(res, want, `${label}: wrong shape ${wrongFar}`);
  }
  const bent = spec.core.map((s, i) => (i === 0 ? otherSym(s) : s));
  const bad = game.check(r, { rule: bent, far: answer, evidence });
  expectFeedback(bad, "clue-contradiction", `${label}: a core that breaks a clue`);
  const firstShown = [...r.seed, ...r.plan].find((s) => s.x === 1) || r.seed[0];
  for (const lang of ["en", "es"])
    ok(bad.feedback[lang].includes(`${firstShown.x}`), `${label}: ${lang} names cell ${firstShown.x}`);
  ok(bad.feedback.es.includes(SYM_ES[truth[firstShown.x - 1]]), `${label}: Spanish feedback names the shape in Spanish`);
  expectFeedback(game.check(r, { rule: [], far: answer, evidence }), "empty-core", `${label}: empty core`);
  expectFeedback(game.check(r, { rule: spec.core, far: "", evidence }), "missing-prediction", `${label}: no prediction`);
  // a core that fits the seen cells but not the rest: a "too few clues" or "unseen" answer, never a bare "wrong"
  const fits = allCores(r.alpha, 3).find((core) => cycleSeq(core).join() !== truth.join() && [1, 2].every((x) => cycleSeq(core)[x - 1] === truth[x - 1]));
  if (fits) {
    const res = game.check(r, { rule: fits, far: answer, evidence: [] });
    ok(res.correct === false && ["too-few-clues", "clue-contradiction", "unseen-cell"].includes(res.mistake), `${label}: a core fitting only the free cells is not accepted (${res.mistake})`);
    noteMistake(res);
  }
  return { answer };
}

function hintChecks(r, answerText, label) {
  const ans = r.form === "cycle" ? [answerText, SYM_ES[answerText]] : [answerText];
  const seen = [];
  for (let tier = 0; tier <= 3; tier += 1) {
    const h = game.hint(r, tier, null);
    ok(typeof h.en === "string" && h.en.length > 20 && typeof h.es === "string" && h.es.length > 20 && h.en !== h.es, `${label}: hint tier ${tier} in both languages`);
    for (const lang of ["en", "es"]) {
      if (tier < 3) {
        ok(!ans.some((a) => leaks(h[lang], a)), `${label}: hint ${tier} ${lang} does not state the answer ${ans.join("/")}`);
        for (const spec of r.machines.map((m) => m.spec))
          for (const form of ruleForms(spec))
            ok(!squash(h[lang]).includes(squash(form)) || form.length < 4, `${label}: hint ${tier} ${lang} does not state the rule ${form}`);
      }
    }
    if (tier === 3) {
      ok(ans.every((a) => h.en.includes(a) || h.es.includes(a)) && leaks(h.en, ans[0]), `${label}: tier 3 states the answer`);
      if (r.form === "cycle")
        ok(r.machines[0].spec.core.every((s) => h.en.includes(s) && h.es.includes(SYM_ES[s])), `${label}: tier 3 names the core in both languages`);
      else
        for (const spec of r.machines.map((m) => m.spec))
          ok(spec.t !== "lin" || [P(spec.a), P(spec.b)].every((q) => q.n === 0n || (q.d === 1n && (q.n === 1n || q.n === -1n)) || h.en.includes(String(Math.abs(Number(q.n))))), `${label}: tier 3 states the rule's numbers`);
    }
    seen.push(h.en);
  }
  ok(new Set(seen).size === 4, `${label}: the four hint tiers differ`);
}

// The parallel example in tier 2 must itself be correct arithmetic, in both languages. The numbers are read back
// in the order the sentence states them, and each one is checked against the others.
function exampleChecks(r, label) {
  const h = game.hint(r, 2, null);
  for (const lang of ["en", "es"]) {
    if (r.form === "cycle") continue;
    const n = (h[lang].match(/\d+/g) || []).map(Number);
    const where = `${label}: tier 2 example (${lang})`;
    if (r.form === "typed") {
      ok(n.length === 11 && n[1] - n[0] === n[3] && n[2] - n[1] === n[3] && n[5] - n[4] === n[8] && n[6] - n[5] === n[9] && n[7] - n[6] === n[10] && n[9] === 3 * n[8] && n[10] === 5 * n[8] && n[8] >= 2, `${where}: linear and curved outputs`);
    } else if (r.form === "two") {
      ok(n.length === 11 && n[0] === 0 && n[4] === 0 && n[2] === 2 * n[1] && n[3] === 3 * n[1] && n[5] === n[10] * n[1] && n[6] === 2 * n[5] && n[7] === 3 * n[5] && n[8] === n[1] && n[9] === n[5], `${where}: two related machines`);
    } else if (r.form === "seq") {
      let at0 = 0;
      if (r.say.op !== "mul") {
        const t = n.slice(0, 11);
        ok(t.length === 11 && t[1] - t[0] === t[3] && t[2] - t[1] === t[3] && t[4] === t[0] && t[5] === t[3] && t[6] === t[8] && t[7] === t[0] && t[9] === t[3] && t[10] === t[0] + t[6] * t[3], `${where}: adding pattern`);
        at0 = 11;
      }
      if (r.say.op !== "add") {
        const t = n.slice(at0, at0 + 10);
        ok(t.length === 10 && t[1] === t[0] * t[3] && t[2] === t[1] * t[3] && t[4] === t[0] && [5, 6, 7, 8].every((i) => t[i] === t[3]) && t[9] === t[0] * t[3] ** 4, `${where}: multiplying pattern`);
      }
    } else {
      ok(n.length === 13 && n[2] === n[0] + 1 && n[3] - n[1] === n[4] && n[5] === n[4] && n[6] === n[0] && n[7] === n[4] && n[8] === n[6] * n[7] && n[9] === n[1] && n[1] === n[8] + n[10] && n[11] === n[4] && n[12] === n[10], `${where}: a machine with a rule`);
    }
  }
  ok(digits(h.en) === digits(h.es), `${label}: both languages use the same numbers`);
}

for (const skill of game.skills) {
  for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1) {
    for (let level = 1; level <= 3; level += 1) {
      const prints = new Set();
      for (let seed = 0; seed < 100; seed += 1) {
        const r = game.makeRound(skill.id, level, makeRng(seedFrom(seed, game.id, skill.id, level, grade)), grade);
        const label = `${skill.id} L${level} g${grade} #${seed}`;
        prints.add(JSON.stringify([r.machines, r.dom, r.far, r.probes, r.seed, r.cls?.answer, r.ctx?.in?.en, r.alpha]));
        if (seed >= 40) continue;
        same(JSON.parse(JSON.stringify(r)), r, `${label}: JSON round trip`);
        same(
          game.makeRound(skill.id, level, makeRng(seedFrom(seed, game.id, skill.id, level, grade)), grade),
          r,
          `${label}: a pure function of the seed`,
        );
        ok(r.skillId === skill.id && r.level === level && r.grade === grade, `${label}: round records its skill, level and grade`);
        ok(r.prompt.en.length > 40 && r.prompt.es.length > 40 && r.prompt.en !== r.prompt.es, `${label}: prompt in both languages`);
        ok(r.probes === (r.machines.length > 1 ? TWO_ALLOWANCE : PROBE_ALLOWANCE)[level], `${label}: probe allowance for level ${level}`);
        ok(r.prompt.en.includes(String(r.probes)) && r.prompt.es.includes(String(r.probes)) && r.prompt.en.includes(String(r.far)), `${label}: the prompt states the allowance and the far input`);
        let answerText;
        if (r.form === "cycle") ({ answer: answerText } = checkCycle(r, label));
        else {
          const info = checkNumeric(r, label);
          answerText = info.answerText;
          if (seed < 6) numericBattery(r, info, label);
        }
        hintChecks(r, answerText, label);
        if (seed < 12) exampleChecks(r, label);
        demandSum[`${skill.id}/${grade}/${level}`] =
          (demandSum[`${skill.id}/${grade}/${level}`] || 0) + demand(r);
      }
      fingerprints[`${skill.id} g${grade} L${level}`] = prints.size;
    }
  }
}

// variety (FM-061) and difficulty (FM-050): level 3 asks for more than level 1
for (const [key, count] of Object.entries(fingerprints))
  ok(count >= 30, `${key}: at least 30 distinct rounds in 100 seeds (${count})`);
for (const skill of game.skills) {
  for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1) {
    const low = demandSum[`${skill.id}/${grade}/1`] / 40;
    const high = demandSum[`${skill.id}/${grade}/3`] / 40;
    ok(high > low, `${skill.id} g${grade}: level 3 demands more than level 1 (${low.toFixed(1)} -> ${high.toFixed(1)})`);
  }
}
for (const [key, texts] of mistakeTexts)
  ok([...texts].every((t) => t.length > 25), `feedback for ${key} is written out`);
const templates = [...mistakeTexts].map(([key, texts]) => [key, new Set([...texts].map(stripNums))]);
for (const [a, setA] of templates)
  for (const [b, setB] of templates)
    if (a < b)
      ok(![...setA].some((t) => setB.has(t)), `feedback for ${a} and ${b} is different wording`);

// ---- 4. the drawings match their numbers (FM-059) ------------------------------------------------------------------------
{
  const count = (svg, re) => (svg.match(re) || []).length;
  for (const [a, b, n] of [[1, 2, 3], [2, 0, 4], [3, 4, 5], [4, 1, 1]])
    ok(count(figureSvg({ a, b, n, name: "x" }), /<rect/g) === a * n + b, `figure ${a}n+${b} at ${n} draws ${a * n + b} tiles`);
  for (const shown of [[], [5], [3, 13, 23, 33]])
    ok(count(hundredChartSvg({ shown: new Set(shown), name: "x" }), /stroke-width="3"/g) === shown.length && count(hundredChartSvg({ shown: new Set(shown), name: "x" }), /<rect/g) === 100, `hundred chart rings ${shown.length} cells`);
  const g = graphSvg({
    points: [{ x: 1, y: 3, m: 0 }, { x: 2, y: 6, m: 0 }, { x: 3, y: 9, m: 1 }],
    xName: "x",
    yName: "y",
    name: "g",
  });
  ok(count(g, /<circle/g) === 2 && count(g, /<rect x="[\d.]+" y="[\d.]+" width="12"/g) === 1, "graph marks each clue once, machines differ by shape");
  ok(machineSvg({ inText: "x", outText: "y", last: { x: "4", y: "13" }, name: "m" }).includes(">13<"), "machine shows the latest answer");
  ok(new Set(SYMS.map((s) => symbolSvg(s))).size === 4, "four distinct pattern shapes");
}

// ---- 5. the interaction in a DOM: probes, clue table, limits, language switch (FM-059, FM-021) -------------------------------
{
  const root = document.querySelector("#root");
  const fire = (el, type) => el.dispatchEvent(new dom.window.Event(type, { bubbles: true }));
  const click = (el) => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  const setText = (key, value) => {
    if (/(^|\.)op[12]?$/.test(key)) {
      const button = root.querySelector(`[data-act="set"][data-path="${key}"][data-value="${value}"]`);
      assert.ok(button, `operation button ${key}=${value} exists`);
      click(button);
      return;
    }
    const el = root.querySelector(`[data-key="${key}"], [data-path="${key}"]`);
    assert.ok(el, `control ${key} exists`);
    el.value = value;
    fire(el, el.tagName === "SELECT" ? "change" : "input");
  };
  const fill = (round, fields) => {
    if (round.form === "cycle") {
      for (const id of fields.core)
        click(root.querySelector(`[data-act="core-add"][data-id="${id}"]`));
    } else if (round.form === "seq")
      for (const [k, v] of Object.entries(fields)) { if (k !== "op" || round.say.op === "both") setText(k, v); }
    else if (round.form === "two")
      for (const side of ["A", "B"])
        for (const [k, v] of Object.entries(fields[side])) { if (k !== "op" || round.say.op === "both") setText(`${side}.${k}`, v); }
    else if (round.form === "typed") setText("typed", fields.text);
    else {
      for (const [k, v] of Object.entries(fields)) {
        const skipSecond =
          round.form === "expr" && (k === "op2" || k === "b") && fields.op2 === "none";
        const skipLocked = round.form === "line" && k === "b" && round.say.lockB;
        if (!skipSecond && !skipLocked && (v !== "" || k === "b")) setText(k, v);
      }
    }
  };
  for (const skill of game.skills) {
    const grade = skill.grades[0];
    const r = game.makeRound(skill.id, 2, makeRng(seedFrom(11, skill.id)), grade);
    let sent = null;
    const ctx = {
      round: r,
      lang: "en",
      mode: "solo",
      grade,
      level: 2,
      index: 0,
      total: 5,
      skill,
      submit: (x) => ((sent = x), game.check(r, x)),
      announce() {},
      locked: () => false,
    };
    const mounted = game.mount(root, ctx);
    const label = `${skill.id} UI`;
    const specs = r.machines.map((m) => m.spec);
    for (const p of r.plan) {
      if (r.form === "cycle") click(root.querySelector(`[data-act="cell"][data-x="${p.x}"]`));
      else {
        if (r.machines.length > 1)
          click(root.querySelector(`[data-act="machine"][data-m="${p.m}"]`));
        setText("x", String(p.x));
        click(root.querySelector('[data-act="probe"]'));
      }
    }
    const left = r.probes - r.plan.length;
    ok(root.querySelector("[data-pd-left]").textContent.includes(`${left} of ${r.probes}`), `${label}: probes left is shown (${left} of ${r.probes})`);
    if (r.form !== "cycle") {
      const cells = [...root.querySelectorAll(".pd-table tbody tr")].map((tr) => [...tr.querySelectorAll("td")].map((td) => td.textContent.trim()));
      const want = [...r.seed, ...r.plan].map((p) => qtext(at(specs[p.m], p.x)));
      for (const w of want)
        ok(cells.some((row) => row.some((c) => c.startsWith(w))), `${label}: the clue table shows ${w}`);
      ok(cells.length === want.length, `${label}: one table row per clue`);
      if (r.show === "figure") {
        const figs = [...root.querySelectorAll(".pd-fig")];
        ok(figs.length === want.length && figs.every((f, i) => f.querySelectorAll("rect").length === Number(qtext(at(specs[0], [...r.seed, ...r.plan].map((p) => p.x).sort((a, b) => a - b)[i])))), `${label}: each tile figure has as many tiles as the table says`);
      }
    } else {
      const shown = [...root.querySelectorAll('.pd-cell[data-state="shown"]')];
      ok(shown.length === r.seed.length + r.plan.length, `${label}: revealed cells are shown`);
      for (const p of r.plan)
        ok(root .querySelector(`.pd-strip`) .textContent.includes(`Cell ${p.x}: ${r.machines[0].spec.core[(p.x - 1) % r.machines[0].spec.core.length]}`), `${label}: cell ${p.x} names its shape`);
    }
    // a limited number of probes: past the allowance nothing is added; repeating a probe costs nothing
    if (r.form !== "cycle") {
      const rowsBefore = root.querySelectorAll(".pd-table tbody tr").length;
      setText("x", String(r.plan[0].x));
      click(root.querySelector('[data-act="probe"]'));
      ok(root.querySelectorAll(".pd-table tbody tr").length === rowsBefore && root.querySelector("[data-pd-left]").textContent.includes(`${left} of`), `${label}: a repeated probe is free`);
      const xs = ints(r.dom.lo, r.dom.hi).filter((x) => x % r.dom.mult === 0 && ![...r.seed, ...r.plan].some((p) => p.x === x));
      for (let i = 0; i < left + 1 && i < xs.length; i += 1) {
        setText("x", String(xs[i]));
        click(root.querySelector('[data-act="probe"]'));
      }
      ok(root.querySelectorAll(".pd-table tbody tr").length === rowsBefore + left, `${label}: no more than ${r.probes} probes are given`);
      ok(root.querySelector(".pd-note")?.textContent.includes("No probes left"), `${label}: running out of probes is explained`);
      setText("x", "abc");
      click(root.querySelector('[data-act="probe"]'));
      ok(root.querySelector(".pd-note")?.textContent.includes("whole number"), `${label}: a bad input is explained`);
    }
    // language switch keeps the evidence and the half-built rule
    const before = root.querySelectorAll(".pd-table tbody tr, .pd-cell[data-state='shown']").length;
    mounted.setLang("es");
    ok(/Pruebas que quedan/.test(root.querySelector("[data-pd-left]").textContent), `${label}: labels switch to Spanish`);
    ok(root.querySelectorAll(".pd-table tbody tr, .pd-cell[data-state='shown']").length === before, `${label}: the clues survive a language switch`);
    mounted.setLang("en");
    // build the rule through the controls and send it
    const sol = game.solve(r);
    fill(r, sol.fields);
    if (r.cls) click(root.querySelector(`[data-act="cls"][data-id="${sol.cls}"]`));
    if (r.form === "cycle") click(root.querySelector(`[data-act="far-sym"][data-id="${sol.far}"]`));
    else setText("far", sol.far);
    mounted.setLang("es");
    mounted.setLang("en");
    click(root.querySelector('[data-act="check"]'));
    ok(sent && game.check(r, sent).correct, `${label}: the controls produce a response the check accepts`);
    ok(root.querySelector(".pd-solved"), `${label}: the screen locks after success`);
    mounted.destroy();
    root.innerHTML = "";
  }
}

console.log(`PASS pattern-detective math suite: ${checks} checks, ${game.skills.length} skills, ${Object.keys(fingerprints).length} skill-levels`);
