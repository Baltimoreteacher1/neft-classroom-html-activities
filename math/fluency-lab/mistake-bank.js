// "A student solved this. Find the step that went wrong." items for every skill family in the Lab.
// Each item is a short worked solution (3-4 steps) in which one step carries a real misconception pattern
// (mistake-templates.js), so the wrong step is plausible and the cause can be named from three slips
// (mistake-notes.js). Items are deterministic from (skill, seed). tools/fluency-mistakes.test.mjs recomputes
// every claim with exact arithmetic instead of trusting this file.
import { ALL_SKILLS, getGrade, getSkill, seededRandom } from "./problem-bank.js";
import { t } from "./i18n.js";
import { TEMPLATES } from "./mistake-templates.js";

export const FAMILIES = [
  "whole",
  "fractions",
  "decimals",
  "percent",
  "integers",
  "algebra",
  "geometry",
];

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
function shuffled(rng, list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Which templates fit a skill. Fact skills keep their own number ranges; other whole-number skills (place value,
// rounding, counting) borrow a template sized for the grade.
const opOf = (skill, rng) =>
  ({ addsub: rng() < 0.5 ? "add" : "sub", muldiv: rng() < 0.5 ? "mul" : "div" })[skill.config.op] ||
  skill.config.op;
const WHOLE_BY_GRADE = [
  ["shiftAdd", "makeTen", "subTen", "shiftSub"],
  ["addRegroup", "subBorrow", "makeTen"],
  ["addRegroup", "mulPartial", "subBorrow"],
  ["mulPartial", "divChunk", "addRegroup"],
];
const wholeFor = (grade) => WHOLE_BY_GRADE[grade <= 1 ? 0 : Math.min(grade - 1, 3)];
const SHAPES = {
  rectangleArea: ["area"],
  perimeter: ["perimeter"],
  volume: ["volume"],
  circle: ["circleArea"],
};

function factTemplate(skill, rng) {
  const { config } = skill;
  const op = opOf(skill, rng);
  const cap = config.maxResult ?? (config.max ?? 10) * 2;
  if (op === "add") return cap <= 10 ? "shiftAdd" : cap <= 20 ? "makeTen" : "addRegroup";
  if (op === "sub") return cap <= 10 ? "shiftSub" : cap <= 20 ? "subTen" : "subBorrow";
  return op === "mul" ? "mulPartial" : "divChunk";
}

const BY_GENERATOR = {
  fact: (skill, rng) => [factTemplate(skill, rng)],
  fractionEquivalent: () => ["fracEquiv", "fracSimplify"],
  fractionCompare: () => ["fracEquiv", "fracSimplify"],
  gcfLcm: () => ["fracSimplify"],
  fractionOp: (skill) =>
    ({ mul: ["fracMul"], div: ["fracDiv"], rational: ["fracAdd", "fracMul", "fracDiv"] })[
      skill.config.op
    ] || ["fracAdd"],
  fractionOf: () => ["fracOf"],
  dataChance: () => ["probability"],
  decimalPlace: () => ["decMul"],
  decimalOp: (skill) => (["add", "sub"].includes(skill.config.op) ? ["decAdd"] : ["decMul"]),
  ratio: () => ["ratioEq"],
  proportion: () => ["ratioEq"],
  unitRate: () => ["unitRate"],
  rateConversion: () => ["unitRate", "convert"],
  percent: () => ["percentOf"],
  percentChange: () => ["percentChange"],
  integerOp: (skill) => [skill.config.op === "muldiv" ? "intMul" : "intAddSub"],
  numberPlane: () => ["intAddSub"],
  transform: () => ["intAddSub"],
  expression: () => ["orderOps"],
  functionRule: () => ["functionRule"],
  solve: (skill) =>
    skill.grade >= 7 && !skill.config.oneStep
      ? ["solveLinear", "solveDistribute"]
      : ["solveLinear"],
  system: () => ["solveLinear"],
  inequality: () => ["inequality"],
  exponent: () => ["power"],
  squareRoot: () => ["power"],
  powerTen: () => ["powerTen"],
  pythagorean: () => ["pythagoras"],
  slope: () => ["slope"],
  association: () => ["slope"],
  geometry: (skill) => SHAPES[skill.config.shape] || ["perimeter"],
};

export function templatesFor(skill, rng = () => 0) {
  return (BY_GENERATOR[skill.generator] || ((s) => wholeFor(s.grade)))(skill, rng);
}
export const skillFamily = (skill) => TEMPLATES[templatesFor(skill)[0]].family;

const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const holds = (text, form) =>
  new RegExp(`(?<![\\w./−-])${escapeRe(form)}(?![\\w/]|\\.\\d)`).test(text);

// A step may not show the right result (one digit is too common to count): nothing is given away before the
// learner has found the error.
const leaks = (result) =>
  [result.answer, result.answerAlt].some(
    (form) =>
      form &&
      form.length > 1 &&
      !holds(result.start, form) &&
      result.steps.some((step) => holds(step, form)),
  );

// Computed negatives print as a minus sign, the lab's own symbol.
const minus = (text) => (text === undefined ? text : String(text).replaceAll("-", "−"));
const signs = (r) => ({ ...r, start: minus(r.start), steps: r.steps.map(minus), fix: minus(r.fix), near: r.near.map(minus), answer: minus(r.answer), answerAlt: minus(r.answerAlt) });

export function buildWorkItem(skill, seed) {
  const rng = seededRandom(seed);
  const config = skill.generator === "fact" || BY_GENERATOR[skill.generator] ? skill.config : {};
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const id = pick(rng, templatesFor(skill, rng));
    const template = TEMPLATES[id];
    let result;
    try {
      result = signs(template.run(rng, { grade: skill.grade, config }));
    } catch {
      continue;
    }
    if (leaks(result)) continue;
    const slips = shuffled(rng, [result.slip, ...result.decoys.slice(0, 2)]);
    const { steps } = result;
    return {
      skill: `${skill.grade}:${skill.id}`,
      seed,
      template: id,
      family: template.family,
      mode: result.mode,
      start: result.start,
      meta: result.meta,
      steps,
      bad: result.bad,
      answerLine: steps.length > 1 && steps.at(-1) === steps.at(-2),
      answer: result.answer,
      answerAlt: result.answerAlt,
      slip: result.slip,
      slips,
      fix: result.fix,
      fixes: shuffled(rng, [result.fix, ...result.near]),
      another: seed % 2 === 1,
    };
  }
  throw new Error(`Could not build a work-check item for ${skill.grade}:${skill.id} seed ${seed}`);
}

// The sentence that sets the problem. Items without a sentence show their math as written.
export function describeAsk(item) {
  const m = item.meta;
  if (!m) return item.start;
  const by = {
    area: () => t("Find the area of a rectangle that is {a} by {b}.", { a: m.k, b: m.n }),
    equalFrac: () =>
      t("Write a fraction equal to {a}/{b} whose bottom number is {c}.", {
        a: m.n,
        b: m.d,
        c: m.d * m.f,
      }),
    simplify: () => t("Write {a}/{b} in lowest terms.", { a: m.A, b: m.B }),
    fracOf: () => t("Find {a}/{b} of {c}.", { a: m.n, b: m.d, c: m.m }),
    percent: () => t("Find {a}% of {b}.", { a: m.p, b: m.n }),
    pctChange: () =>
      m.up
        ? t("Increase {b} by {a}%.", { a: m.p, b: m.n })
        : t("Decrease {b} by {a}%.", { a: m.p, b: m.n }),
    ratio: () =>
      t("Write a ratio equal to {a} : {b} whose second number is {c}.", {
        a: m.a,
        b: m.b,
        c: m.b * m.f,
      }),
    rate: () => t("{a} items cost ${b}. Find the cost of 1 item.", { a: m.q, b: m.c }),
    convert: () => t("Change {a} {from} to {to}.", { a: m.q, from: m.from, to: m.to }),
    function: () =>
      t("f(x) = {a} − {b}(x + {d}). Find f({c}).", { a: m.a, b: m.b, c: m.c, d: m.d }),
    pyth: () =>
      t("A right triangle has legs {a} and {b}. Find the square of the longest side.", {
        a: m.a,
        b: m.b,
      }),
    slope: () =>
      t("Find the slope between ({a}, {b}) and ({c}, {d}).", {
        a: m.x1,
        b: m.y1,
        c: m.x2,
        d: m.y2,
      }),
    chance: () =>
      t("Chances are {a}/{c} and {b}/{c}. Find the chance of either one.", { a: m.n1, b: m.n2, c: m.d }),
    perimeter: () =>
      t("Find the perimeter of a rectangle that is {a} long and {b} wide.", { a: m.l, b: m.w }),
    volume: () =>
      t("Find the volume of a box that is {a} long, {b} wide and {c} tall.", {
        a: m.l,
        b: m.w,
        c: m.h,
      }),
    circle: () =>
      t("Find the area of a circle with radius {a}. Leave π in your answer.", { a: m.r }),
  };
  return by[m.kind]();
}

// Rounds for the Game Room: one skill chosen for the stop, or a spread across the grade's families.
export function workRounds(grade, stop, count, rng = Math.random) {
  const chosen = String(stop).startsWith("skill:") ? getSkill(grade, stop.slice(6)) : null;
  const skills = chosen ? [chosen] : shuffled(rng, getGrade(grade).skills);
  const used = new Set();
  const rounds = [];
  for (let i = 0; i < count; i += 1) {
    const fresh = skills.find(
      (skill) =>
        !used.has(skillFamily(skill)) &&
        !rounds.some((r) => r.skill === `${skill.grade}:${skill.id}`),
    );
    const skill = chosen || fresh || skills[i % skills.length];
    used.add(skillFamily(skill));
    if (used.size >= FAMILIES.length) used.clear();
    rounds.push(buildWorkItem(skill, Math.floor(rng() * 2 ** 31)));
  }
  return rounds;
}

export const allWorkSkills = () => ALL_SKILLS.filter((skill) => skill.grade >= 1);
