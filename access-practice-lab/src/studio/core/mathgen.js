// Verified math problem generators for Activity Studio. Pure and deterministic: the same seed always gives the same
// questions, nothing reads the clock, the network or Math.random.
//
// Every question is built from the same variables as its answer key, then re-checked before it leaves the kit
// (mathgen/kit.js): a number key must equal exact evaluation of its `expr`, a choice must have exactly one option
// with the answer's value, an error item's right fix must reach the true value. The tests recompute all of it
// again with a second evaluator (tools/studio-mathgen.test.mjs).
//
// Raw blocks are shaped like core/schema.js question blocks. A few blocks carry extra fields the schema drops on
// normalize (`expr` on choice/error/order/numberline, `exprs` on fillTable, `rel` on inequality items): they are
// there so the tests and any server-side re-check can verify the key. normalizeActivity ignores them.

import { hashSeed, makeRng } from "./mathgen/kit.js";
import { COORDINATE_TEMPLATES } from "./mathgen/coordinates.js";
import { DATA_TEMPLATES } from "./mathgen/data.js";
import { DECIMAL_TEMPLATES } from "./mathgen/decimals.js";
import { EQUATION_TEMPLATES } from "./mathgen/equations.js";
import { FRACTION_TEMPLATES } from "./mathgen/fractions.js";
import { INEQUALITY_TEMPLATES } from "./mathgen/inequalities.js";
import { MEASURE_TEMPLATES } from "./mathgen/measure.js";
import { NUMBER_TEMPLATES } from "./mathgen/numbers.js";
import { RATIO_TEMPLATES } from "./mathgen/ratio.js";
import { topicForUnit } from "./mathgen/units.js";
import { MATH_TOPICS } from "./mathgen/topics.js";

export { MATH_TOPICS, topicForUnit };

const TEMPLATES = {
  ...RATIO_TEMPLATES,
  ...FRACTION_TEMPLATES,
  ...DECIMAL_TEMPLATES,
  ...NUMBER_TEMPLATES,
  ...EQUATION_TEMPLATES,
  ...INEQUALITY_TEMPLATES,
  ...MEASURE_TEMPLATES,
  ...COORDINATE_TEMPLATES,
  ...DATA_TEMPLATES,
};

const TOPIC = Object.fromEntries(MATH_TOPICS.map((t) => [t.id, t]));
const ATTEMPTS = 48;
/** Easier formats come first when a set is ordered. */
const FORMAT_RANK = {
  number: 0,
  choice: 0,
  numberline: 0,
  plot: 0,
  multi: 1,
  fillTable: 1,
  order: 1,
  error: 2,
};

/** The grade a topic really supports: the asked grade, or the nearest grade it covers (default: 6, else the top). */
function gradeFor(topic, grade) {
  const g = Number(grade);
  if (!Number.isFinite(g))
    return topic.grades.includes(6) ? 6 : topic.grades[topic.grades.length - 1];
  return topic.grades.reduce((best, x) => (Math.abs(x - g) < Math.abs(best - g) ? x : best));
}

const clampLevel = (level) => Math.min(3, Math.max(1, Math.round(Number(level) || 1)));
const promptKey = (b) =>
  `${b.prompt}|${(b.steps || []).map((s) => s.text).join("/")}|${(b.rows || []).map((r) => r.map((c) => c.answer ?? c).join(",")).join("/")}`;

/**
 * One question for a slot. Templates are tried in a seeded order; a template that cannot make a valid item for these
 * numbers (or repeats an earlier prompt) is retried with new numbers, then the next template is tried.
 */
function makeItem({ topic, grade, level, seed, index, order, seen, strict }) {
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const def = order[(index + Math.floor(attempt / 8)) % order.length];
    const rng = makeRng(hashSeed(seed, topic.id, grade, level, index, attempt));
    let block = null;
    try {
      block = def.make({ rng, grade, level });
    } catch (error) {
      if (strict) throw error;
    }
    if (!block || seen.has(promptKey(block))) continue;
    seen.add(promptKey(block));
    const id = `m${hashSeed(seed, topic.id, level, index).toString(36)}${index}`.slice(0, 32);
    return { id, type: "question", skill: topic.id, ...block };
  }
  return null;
}

const templatesFor = (topicId, grade, level) =>
  (TEMPLATES[topicId] || []).filter(
    (t) => (!t.grades || t.grades.includes(grade)) && (!t.levels || t.levels.includes(level)),
  );

/**
 * Raw question blocks for one topic.
 * @param {{topic: string, grade?: number, count?: number, seed?: number, level?: 1|2|3, strict?: boolean}} opts
 * `grade` is clamped to the grades the topic covers. `strict` makes a failing template throw (tests use it);
 * otherwise a bad draw is skipped and retried. An unknown topic gives [].
 */
export function generateMath({
  topic,
  grade,
  count = 10,
  seed = 1,
  level = 1,
  strict = false,
} = {}) {
  const meta = TOPIC[topic];
  if (!meta) return [];
  const g = gradeFor(meta, grade);
  const lv = clampLevel(level);
  const defs = templatesFor(topic, g, lv);
  if (!defs.length) return [];
  const order = makeRng(hashSeed(seed, topic, g, lv, "order")).shuffle(defs);
  const seen = new Set();
  const out = [];
  for (let i = 0; i < count; i++) {
    const item = makeItem({
      topic: meta,
      grade: g,
      level: lv,
      seed,
      index: i,
      order,
      seen,
      strict,
    });
    if (item) out.push(item);
  }
  return out;
}

/**
 * A practice set that mixes topics and gets harder: the first third is level 1, the next level 2, the last level 3;
 * topics rotate; inside a level the plain questions come before tables, orderings and error analysis.
 */
export function mathSet({ topics, grade, count = 12, seed = 1 } = {}) {
  const ids = (topics || []).filter((t) => TOPIC[t]);
  if (!ids.length) return [];
  const seen = new Set();
  const items = [];
  const orders = new Map();
  for (let i = 0; i < count; i++) {
    const meta = TOPIC[ids[i % ids.length]];
    const g = gradeFor(meta, grade);
    const level = clampLevel(1 + Math.floor((3 * i) / count));
    const key = `${meta.id}|${g}|${level}`;
    if (!orders.has(key)) {
      const defs = templatesFor(meta.id, g, level);
      orders.set(key, makeRng(hashSeed(seed, key, "order")).shuffle(defs));
    }
    const order = orders.get(key);
    if (!order.length) continue;
    const item = makeItem({
      topic: meta,
      grade: g,
      level,
      seed: hashSeed(seed, "set"),
      index: i,
      order,
      seen,
    });
    if (item) items.push({ item, level });
  }
  return items
    .sort((a, b) => a.level - b.level || FORMAT_RANK[a.item.format] - FORMAT_RANK[b.item.format])
    .map((x) => x.item);
}
