#!/usr/bin/env node
// Independent verification of the PFA "similar problem" generators
// (functions/_lib/pfa/generators.js). For every generator and mode in use, 300 seeds: the
// answer is RECOMPUTED here from `params` with separate arithmetic and must equal the key;
// no distractor may equal the key (by value); every distractor tag must exist in
// data/misconception-taxonomy.json; English and Spanish stems and steps must both be present and
// differ; the checker must accept the key and reject every distractor. A corrupted key must be
// caught (negative control) before the sweep is trusted.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const { generate, matches, parseNumber, sameExpr, gcd, tableTask, lineTask, lineAccepts } =
  await import(pathToFileURL(join(ROOT, "functions/_lib/pfa/generators.js")).href);
const { renderVisual } = await import(
  pathToFileURL(join(ROOT, "functions/_lib/pfa/math-visuals.js")).href
);
const TAXONOMY = new Set(
  Object.keys(
    JSON.parse(readFileSync(join(ROOT, "data/misconception-taxonomy.json"), "utf8")).taxonomy,
  ),
);

const med = (s) =>
  s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
const lcm = (a, b) => (a * b) / gcd(a, b);
const frac = (n, d) => n / d;

// Independent expected value for each generator, from params only.
export const EXPECT = {
  estimateProduct: (p) => Math.round(p.a / 10) * 10 * p.b,
  fracTimesWhole: (p) => (p.w / p.d) * p.n,
  decimalMultiply: (p) => p.a * p.b,
  decimalDivide: (p) => p.a / p.b,
  decimalAddSub: (p) => p.a + p.b,
  longDivision: (p) => p.a / p.b,
  patternRule: (p) => p.start + p.step * (p.n - 1),
  dataCount: (p) =>
    p.lo != null
      ? p.vals.filter((v) => v === p.lo || v === p.lo + 1).length
      : p.vals.filter((v) => v > p.t).length,
  median: (p) => med([...p.raw].sort((a, b) => a - b)),
  mean: (p) => p.raw.reduce((a, b) => a + b, 0) / p.raw.length,
  iqr: (p, mode) => {
    const s = p.sorted;
    if (mode === "range") return s[s.length - 1] - s[0];
    return med(s.slice(4)) - med(s.slice(0, 4));
  },
  mad: (p) => {
    const m = p.raw.reduce((a, b) => a + b, 0) / p.raw.length;
    return p.raw.reduce((a, v) => a + Math.abs(v - m), 0) / p.raw.length;
  },
  ratioTable: (p) => (p.a * p.k * p.b) / p.a,
  unitRate: (p) => p.total / p.n,
  convertUnits: (p) => p.q * p.f,
  percentOf: (p) => (p.base * p.p) / 100,
  fracToPercent: (p) => (100 * p.n) / p.d,
  percentWhole: (p) => (p.part * 100) / p.p,
  areaShape: (p) =>
    p.mode === "triangle"
      ? 0.5 * p.b * p.h
      : p.mode === "trapezoid"
        ? 0.5 * (p.b + p.b2) * p.h
        : p.b * p.h,
  areaComposite: (p) => p.w * p.h + 0.5 * p.w * p.th,
  volumePrism: (p) => p.l * p.w * p.h,
  surfaceArea: (p) =>
    p.mode === "pyramid"
      ? p.s ** 2 + 2 * p.s * p.sl
      : 2 * p.l * p.w + 2 * p.l * p.h + 2 * p.w * p.h,
  areaRegularPolygon: (p) => 0.5 * p.n * p.s * p.a,
  wholeDivUnitFrac: (p) => p.w / frac(p.n, p.d),
  fracDivide: (p) => frac(p.n1, p.d1) / frac(p.n2, p.d2),
  evalNumeric: (p) => (p.mode === "power" ? p.b ** p.e : p.a + p.b * p.b * p.c),
  evalExpression: (p) => p.a * p.x + p.b,
  expr: (p) => `${p.coef}x + ${p.cons}`,
  gcf: (p) => gcd(p.a, p.b),
  lcm: (p) => lcm(p.a, p.b),
  primeFactor: (p) => p.n,
  signedValue: (p) => (p.mode === "abs" ? Math.abs(p.v) : -p.v),
  compareRational: (p) => Math.max(p.a, p.b),
  point: (p) =>
    p.mode === "reflect" ? [p.axis === "y" ? -p.x : p.x, p.axis === "x" ? -p.y : p.y] : [p.x, p.y],
  coordDistance: (p) => Math.abs(p.y1 - p.y2),
  oneStep: (p) => p.x,
  inequality: (p) => (p.mode === "test" ? p.n + 3 : `x ${p.op} ${p.n}`),
  twoVar: (p) => (p.mode === "equation" ? p.k : p.k * p.x),
};

function agrees(prob, expected) {
  const { answerType, answer } = prob;
  if (prob.gen === "primeFactor") {
    const factors = answer.split("×").map((s) => Number(s.trim()));
    const isPrime = (n) =>
      n > 1 && [...Array(Math.floor(Math.sqrt(n)))].every((_, i) => i < 1 || n % (i + 1) !== 0);
    return (
      factors.reduce((a, b) => a * b, 1) === expected &&
      factors.every(isPrime) &&
      factors.every((f, i) => i === 0 || f >= factors[i - 1])
    );
  }
  if (answerType === "number") return Math.abs(parseNumber(answer) - expected) < 1e-9;
  if (answerType === "expr") return sameExpr(answer, expected);
  if (answerType === "pair") return answer === `(${expected[0]}, ${expected[1]})`;
  return answer === expected;
}

export function checkProblem(prob) {
  const errs = [];
  const exp = EXPECT[prob.gen];
  if (!exp) errs.push(`no independent check for ${prob.gen}`);
  else if (!agrees(prob, exp(prob.params, prob.mode)))
    errs.push(`key ${prob.answer} != recomputed ${JSON.stringify(exp(prob.params, prob.mode))}`);
  for (const lang of ["en", "es"]) {
    if (!prob.stem?.[lang]?.trim()) errs.push(`missing stem.${lang}`);
    if (!prob.steps?.[lang]?.length) errs.push(`missing steps.${lang}`);
  }
  if (prob.stem?.en === prob.stem?.es) errs.push("Spanish stem copies English");
  if (!matches(prob.answerType, prob.answer, prob.answer)) errs.push("checker rejects its own key");
  for (const d of prob.distractors || []) {
    if (!TAXONOMY.has(d.tag)) errs.push(`orphan misconception tag ${d.tag}`);
    if (matches(prob.answerType, prob.answer, d.value))
      errs.push(`distractor ${d.value} equals the key`);
    if (!d.why?.en || !d.why?.es) errs.push(`distractor ${d.value} lacks bilingual feedback`);
  }
  // The picture must not print the answer (unless the stem already states that number).
  if (prob.visual && prob.answerType !== "text") {
    const svg = renderVisual(prob.visual);
    if (!svg) errs.push("visual did not render");
    // Axis/scale labels (class mv-scale) are scale, not claims about the problem.
    const labels = [...svg.matchAll(/<text([^>]*)>(?:<tspan[^>]*>)?([^<]+)</g)]
      .filter((m) => !/mv-scale/.test(m[1]))
      .map((m) => m[2].trim().replace(/−/g, "-"));
    const stemNums = new Set((prob.stem.en.match(/-?\d+(?:\.\d+)?/g) || []).map(Number));
    const ans = prob.answerType === "number" ? parseNumber(prob.answer) : null;
    const pctAnswer = prob.unit?.en === "%";
    const leaks = labels.filter((l) =>
      ans != null
        ? (!l.includes("%") || pctAnswer) && parseNumber(l) === ans && !stemNums.has(ans)
        : l.replace(/\s/g, "") === String(prob.answer).replace(/\s/g, ""),
    );
    if (leaks.length) errs.push(`visual prints the answer (${leaks[0]})`);
  }
  if (prob.kind === "mc") {
    if (!prob.choices?.includes(prob.answer)) errs.push("mc choices omit the key");
    if (new Set(prob.choices).size !== prob.choices.length) errs.push("duplicate choices");
  }
  return errs;
}

// Generator specs in use = every `similar` in data/practice/*.json (plus all known modes).
export const SPECS = [
  "estimateProduct",
  "fracTimesWhole",
  "decimalMultiply",
  "decimalDivide",
  "decimalAddSub",
  "longDivision",
  "patternRule",
  "dataCount:dots",
  "dataCount:hist",
  "median",
  "mean",
  "iqr:iqr",
  "iqr:range",
  "mad",
  "ratioTable:table",
  "ratioTable:graph",
  "unitRate",
  "convertUnits",
  "percentOf",
  "fracToPercent",
  "percentWhole",
  "areaShape:parallelogram",
  "areaShape:triangle",
  "areaShape:trapezoid",
  "areaComposite",
  "volumePrism:whole",
  "volumePrism:half",
  "surfaceArea:prism",
  "surfaceArea:pyramid",
  "areaRegularPolygon",
  "wholeDivUnitFrac",
  "fracDivide:frac",
  "fracDivide:mixed",
  "evalNumeric:power",
  "evalNumeric:order",
  "evalExpression",
  "expr:combine",
  "expr:distribute",
  "gcf",
  "lcm",
  "primeFactor",
  "signedValue:opposite",
  "signedValue:abs",
  "compareRational",
  "point:plot",
  "point:reflect",
  "coordDistance",
  "oneStep:add",
  "oneStep:mult",
  "oneStep:check",
  "inequality:write",
  "inequality:test",
  "twoVar:table",
  "twoVar:equation",
];

export function sweep(specs = SPECS, seeds = 300) {
  const failures = [];
  let n = 0;
  for (const spec of specs) {
    for (let seed = 1; seed <= seeds; seed++) {
      const prob = generate(spec, seed);
      n++;
      const errs = checkProblem(prob);
      if (errs.length) failures.push(`${spec} seed ${seed}: ${errs.join("; ")}`);
    }
  }
  return { n, failures };
}

// Table and number-line tasks: every blank and every accepted value recomputed from params.
export const TABLE_EXPECT = {
  ratioTable: (p) => [2 * p.b, p.b * p.k],
  twoVar: (p) => [2 * p.k, p.k * p.x],
  patternRule: (p) => [p.start + 2 * p.step, p.start + (p.n - 1) * p.step],
  convertUnits: (p) => [2 * p.f, p.q * p.f],
  unitRate: (p) => [p.total / p.n, (3 * p.total) / p.n],
};
export function checkTask(t) {
  const errs = [];
  if (!t.stem?.en || !t.stem?.es || t.stem.en === t.stem.es) errs.push("task stem EN/ES");
  for (const d of t.distractors || []) if (!TAXONOMY.has(d.tag)) errs.push(`orphan tag ${d.tag}`);
  if (t.kind === "table") {
    const want = TABLE_EXPECT[t.gen](t.params);
    if (t.blanks.length !== want.length) errs.push("blank count");
    t.blanks.forEach((b, i) => {
      if (Math.abs(parseNumber(b.answer) - want[i]) > 0.005)
        errs.push(`blank ${i} ${b.answer} != ${want[i]}`);
      if (t.rows[b.r][b.c] !== "?") errs.push(`blank ${i} is not a ? cell`);
    });
    if (t.rows.flat().filter((c) => c === "?").length !== t.blanks.length)
      errs.push("a ? cell has no blank");
    if (t.headers.some((h) => !h.en || !h.es)) errs.push("header EN/ES");
  } else {
    const inRange = (v) => v >= t.min && v <= t.max;
    if (t.gen === "signedValue") {
      const want = t.mode === "abs" ? -Math.abs(t.params.v) : -t.params.v;
      if (t.accept.eq !== want) errs.push(`accept ${t.accept.eq} != ${want}`);
      if (!inRange(want)) errs.push("answer off the line");
      if (lineAccepts(t, -want) && want !== 0) errs.push("the opposite side is accepted");
    } else {
      const hi = Math.max(t.params.a, t.params.b);
      for (let v = t.min; v <= t.max; v++)
        if (lineAccepts(t, v) !== (v > hi && v < 0)) errs.push(`value ${v} judged wrongly`);
      if (![...Array(t.max - t.min + 1)].some((_, i) => lineAccepts(t, t.min + i)))
        errs.push("no point on the line is accepted");
    }
    if (lineAccepts(t, 0) && !(t.accept.eq === 0)) errs.push("the start position 0 is accepted");
  }
  return errs;
}
export const TASK_SPECS = [
  ["table", "ratioTable:table"],
  ["table", "ratioTable:graph"],
  ["table", "twoVar:table"],
  ["table", "patternRule"],
  ["table", "convertUnits"],
  ["table", "unitRate"],
  ["line", "signedValue:opposite"],
  ["line", "signedValue:abs"],
  ["line", "compareRational"],
];

const isMain = import.meta.url === pathToFileURL(process.argv[1] || "").href;
if (isMain) {
  // Negative controls: a corrupted key, a distractor equal to the key, an orphan tag.
  const bad = generate("percentOf", 7);
  bad.answer = String(Number(bad.answer) + 1);
  assert.ok(
    checkProblem(bad).some((e) => e.startsWith("key")),
    "corrupted key must be caught",
  );
  const bad2 = generate("mean", 3);
  bad2.distractors.push({
    value: bad2.answer,
    tag: "stat-mean-vs-median",
    why: { en: "x", es: "y" },
  });
  assert.ok(
    checkProblem(bad2).some((e) => e.includes("equals the key")),
    "distractor = key must be caught",
  );
  const bad3 = generate("gcf", 4);
  bad3.distractors[0].tag = "not-a-real-tag";
  assert.ok(
    checkProblem(bad3).some((e) => e.includes("orphan")),
    "orphan tag must be caught",
  );
  const bad4 = generate("expr:combine", 9);
  bad4.answer = `${bad4.params.coef}x + ${bad4.params.cons + 1}`;
  assert.ok(checkProblem(bad4).length > 0, "wrong expression key must be caught");

  const bad5 = generate("unitRate", 11);
  bad5.visual = {
    type: "dnl",
    top: { label: "Cost", values: ["0", bad5.answer] },
    bottom: { label: "Bottles", values: ["0", "1"] },
  };
  assert.ok(
    checkProblem(bad5).some((e) => e.includes("visual prints the answer")),
    "a visual that prints the answer must be caught",
  );

  const badT = tableTask("ratioTable:table", 5);
  badT.blanks[0].answer = String(Number(badT.blanks[0].answer) + 1);
  assert.ok(
    checkTask(badT).some((e) => e.startsWith("blank")),
    "a wrong table blank must be caught",
  );
  const badL = lineTask("signedValue:opposite", 6);
  badL.accept = { eq: badL.params.v };
  assert.ok(checkTask(badL).length > 0, "a number line that accepts the wrong side must be caught");

  const { n, failures } = sweep();
  let tasks = 0;
  for (const [kind, spec] of TASK_SPECS) {
    for (let seed = 1; seed <= 300; seed++) {
      const t = kind === "table" ? tableTask(spec, seed) : lineTask(spec, seed);
      tasks++;
      const errs = t ? checkTask(t) : ["task not built"];
      if (errs.length) failures.push(`${kind}:${spec} seed ${seed}: ${errs.join("; ")}`);
    }
  }
  if (n === 0) {
    console.error("FAIL pfa-generators: swept zero problems");
    process.exit(1);
  }
  if (failures.length) {
    console.error(`FAIL pfa-generators: ${failures.length} of ${n}`);
    for (const f of failures.slice(0, 25)) console.error(`  ${f}`);
    process.exit(1);
  }
  console.log(
    `PASS pfa-generators: ${SPECS.length} generator modes × 300 seeds = ${n} problems recomputed independently; ${tasks} table/number-line tasks recomputed; 7 negative controls caught`,
  );
}
