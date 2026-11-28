/**
 * build.mjs — turns the authored plan (content.mjs) into concrete, computed unit data.
 *
 * Same plan + same seed = same worksheet. The validator recomputes every key independently of this file.
 */
import { GRADES, LIT_STRATEGY } from "./content.mjs";
import { draw, FACT, make, rng, SKILL, WP } from "./gen.mjs";

export const FACT_N = 8;
export const SKILL_N = 8;

const tableFor = (kind) => (SKILL[kind] ? SKILL : FACT[kind] ? FACT : null);

function hash(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

const EXTRAS = [
  (n) => `The bell rings at ${n}:00.`,
  (n) => `There are ${n} students in the next room.`,
  (n) => `The school has been open for ${n} years.`,
  (n) => `A sign on the wall says room ${n}.`,
];

export function withExtra(p, r) {
  const used = new Set(String(p.expr).match(/\d+/g) || []);
  let n;
  do n = 3 + Math.floor(r() * 9) + 20 * (r() < 0.4 ? 1 : 0);
  while (used.has(String(n)) || p.text.includes(String(n)));
  const sentence = EXTRAS[Math.floor(r() * EXTRAS.length)](n);
  const q = p.question;
  const text = p.text.endsWith(q)
    ? `${p.text.slice(0, -q.length)}${sentence} ${q}`
    : `${sentence} ${p.text}`;
  return { ...p, text, extra: n, extraSentence: sentence };
}

export function drawSet(kind, params, seed, n) {
  const table = tableFor(kind);
  if (!table) throw new Error(`math-literacy: no generator "${kind}"`);
  return draw(table, kind, params, rng(seed), n);
}

export function newWordProblems(kind, params, seed, n, { extraOn = -1 } = {}) {
  const r = rng(seed);
  const out = draw(WP, kind, params, r, n);
  return out.map((p, i) => (i === extraOn ? withExtra(p, r) : p));
}

/** Pick vocabulary-check distractors from the same grade's other terms. */
function vocabCheck(grade, ui, r) {
  const unit = grade.units[ui];
  const target = unit.v[Math.floor(r() * unit.v.length)];
  const pool = grade.units
    .flatMap((u) => u.v)
    .filter((v) => v.term !== target.term && v.def !== target.def);
  const wrong = [];
  while (wrong.length < 2) {
    const c = pool[Math.floor(r() * pool.length)];
    if (!wrong.includes(c.def)) wrong.push(c.def);
  }
  const choices = [target.def, ...wrong];
  // deterministic shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  const letters = ["A", "B", "C"];
  return {
    q: `Which choice tells what "${target.term}" means?`,
    choices: choices.map((c, i) => `${letters[i]}. ${c}`),
    a: letters[choices.indexOf(target.def)],
    term: target.term,
  };
}

export function buildUnit(grade, ui) {
  const u = grade.units[ui];
  const base = hash(`${grade.id}:${ui}`);
  const gradeNum = grade.id === "k" ? 0 : Number(grade.id);
  const strategy = LIT_STRATEGY[ui];
  const wps = newWordProblems(u.wp[0], u.wp[1], base ^ 0x1111, 3, {
    extraOn: gradeNum >= 2 ? 2 : -1,
  });
  const check = newWordProblems(u.wp[0], u.wp[1], base ^ 0x4444, 1)[0];
  const skillCheck = drawSet(u.skill[0], u.skill[1], base ^ 0x5555, 1)[0];
  return {
    index: ui + 1,
    title: u.t,
    domain: u.dom,
    strategy,
    vocab: u.v,
    wp: wps.map((p, i) => ({
      ...p,
      role: i === 0 ? "retell" : i === 1 ? "numbers" : gradeNum >= 2 ? "extra" : "draw",
    })),
    talk: { prompt: u.talk[0], frame: u.talk[1] },
    fact: drawSet(u.fact[0], u.fact[1], base ^ 0x2222, FACT_N),
    skill: drawSet(u.skill[0], u.skill[1], base ^ 0x3333, SKILL_N),
    factSpec: u.fact,
    skillSpec: u.skill,
    wpSpec: u.wp,
    quick: { vocab: vocabCheck(grade, ui, rng(base ^ 0x6666)), skill: skillCheck, wp: check },
  };
}

export function buildGrade(grade) {
  return {
    ...grade,
    units: grade.units.map((_, i) => buildUnit(grade, i)),
    strategies: LIT_STRATEGY,
  };
}

export const ALL = GRADES.map(buildGrade);
export { make };
