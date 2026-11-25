/**
 * Transparent mastery estimation. Everything here is a pure function of (state, now); nothing reads a clock.
 *
 * Per node: Beta(a0 + s, b0 + f) where (a0, b0) is the cold-start prior and (s, f) are exponentially decayed
 * success and failure weights (half-life DEFAULTS.halfLifeDays, tunable). Because only the evidence decays,
 * an idle node drifts back to its prior: a student who stops practicing slides toward "getting there".
 *
 * Students see only a coarse status (building / getting there / strong). The interval and every decimal are
 * teacher-side. Nothing derived from here is an official score; views always carry the practice-estimate label.
 *
 * Test hook: every function that decays takes `hooks.decay(elapsedDays, halfLifeDays)`; the negative-control
 * tests pass a broken decay and must see the acceptance checks fail.
 */
import {
  BANDS,
  DAY_MS,
  DEFAULTS,
  ESTIMATE_LABEL,
  STATUS,
  TEACHER_DISCLAIMER,
} from "./constants.js";
import { parseNodeId } from "./graph.js";

export function decayFactor(elapsedDays, halfLifeDays = DEFAULTS.halfLifeDays) {
  return elapsedDays <= 0 ? 1 : 2 ** (-elapsedDays / halfLifeDays);
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const bandCenter = { "1_2": 1.5, "3_4": 3.5, "5_6": 5.5 };
const gradeBandStart = { K: 2, 1: 2, 2: 2.5, 3: 3, 4: 3.5, 5: 4, 6: 4, 7: 4.5, 8: 5 };

/** Cold-start level (1-6) from the teacher-entered diagnostic seed, else from the grade. */
export function startLevel({ grade, diagnosticLevel } = {}) {
  if (Number.isFinite(diagnosticLevel)) return clamp(diagnosticLevel, 1, 6);
  const key = String(grade).toUpperCase();
  if (!(key in gradeBandStart)) throw new Error(`unknown grade "${grade}"`);
  return gradeBandStart[key];
}

/** Prior Beta parameters for a node at `band` for a learner starting at `level`. */
export function priorFor({ level, band, strength = DEFAULTS.priorStrength }) {
  if (!BANDS.includes(band)) throw new Error(`unknown band "${band}"`);
  const p = 1 / (1 + Math.exp(-0.9 * (level - bandCenter[band])));
  return { a: p * strength, b: (1 - p) * strength };
}

export const priorForNode = (nodeId, level) => {
  const parsed = parseNodeId(nodeId);
  return priorFor({ level, band: parsed.type === "language" ? parsed.band : "3_4" });
};

export const emptyNode = (prior) => ({ s: 0, f: 0, ts: null, prior: { ...prior } });

/** Weight of one attempt: a hinted success counts as a partial success. */
function attemptWeights({ correct, hintsUsed = 0 }) {
  if (!correct) return { s: 0, f: 1 };
  return hintsUsed > 0 ? { s: DEFAULTS.hintedCorrectWeight, f: 0 } : { s: 1, f: 0 };
}

const elapsedDays = (from, to) => (to - from) / DAY_MS;

/** Returns a new node state with the attempt folded in (state is never mutated). */
export function observe(node, attempt, hooks = {}) {
  const decay = hooks.decay || decayFactor;
  const ts = attempt.ts;
  if (!Number.isFinite(ts)) throw new Error("attempt.ts must be a millisecond timestamp");
  if (node.ts !== null && ts < node.ts) throw new Error("attempts must be observed in time order");
  const k = node.ts === null ? 1 : decay(elapsedDays(node.ts, ts), hooks.halfLifeDays);
  const w = attemptWeights(attempt);
  return { s: node.s * k + w.s, f: node.f * k + w.f, ts, prior: node.prior };
}

export function statusOf(mean, evidence) {
  if (evidence < DEFAULTS.minEvidence) return STATUS.gettingThere;
  if (mean >= DEFAULTS.strongMean) return STATUS.strong;
  if (mean < DEFAULTS.buildingMean) return STATUS.building;
  return STATUS.gettingThere;
}

/** Full estimate at `now`. Teacher-side object: mean, interval, evidence weight, coarse status. */
export function estimate(node, now, hooks = {}) {
  const decay = hooks.decay || decayFactor;
  const k = node.ts === null ? 0 : decay(elapsedDays(node.ts, now), hooks.halfLifeDays);
  const s = node.s * k;
  const f = node.f * k;
  const a = node.prior.a + s;
  const b = node.prior.b + f;
  const n = a + b;
  const mean = a / n;
  const sd = Math.sqrt((a * b) / (n * n * (n + 1)));
  const evidence = s + f;
  return {
    mean,
    lower: clamp(mean - DEFAULTS.intervalZ * sd, 0, 1),
    upper: clamp(mean + DEFAULTS.intervalZ * sd, 0, 1),
    evidence,
    status: statusOf(mean, evidence),
  };
}

/** What a student may see: the coarse status and the label. No numbers, no interval, no level. */
export const studentView = (est) => ({ status: est.status, note: ESTIMATE_LABEL });

/** What a teacher sees: the same status plus the interval, always with the disclaimer. */
export const teacherView = (est) => ({
  status: est.status,
  mean: Math.round(est.mean * 100) / 100,
  interval: [Math.round(est.lower * 100) / 100, Math.round(est.upper * 100) / 100],
  evidence: Math.round(est.evidence * 10) / 10,
  note: ESTIMATE_LABEL,
  disclaimer: TEACHER_DISCLAIMER,
});

/**
 * Item difficulty prior (0 easy .. 1 hard) from the lesson's language_demand_score (0.43-0.80 today) and the
 * band the item is pitched at. Demand is rescaled over its observed span so the prior spreads over 0.2-0.9.
 */
export function difficultyPrior({ languageDemand, band }) {
  if (!BANDS.includes(band)) throw new Error(`unknown band "${band}"`);
  const demand = clamp((languageDemand - 0.4) / 0.45, 0, 1);
  return Math.round((0.2 + 0.45 * demand + 0.25 * (BANDS.indexOf(band) / 2)) * 1000) / 1000;
}

/**
 * Posterior item difficulty from an ANONYMOUS aggregate ({attempts, correct} for the item across learners).
 * Never takes a learner id. Cells below the minimum cell size leave the prior untouched.
 */
export function updateDifficulty(
  prior,
  aggregate,
  { shrink = 20, minCell = DEFAULTS.minCell } = {},
) {
  if (!aggregate || !(aggregate.attempts >= minCell)) return prior;
  const observed = 1 - aggregate.correct / aggregate.attempts;
  const w = aggregate.attempts / (aggregate.attempts + shrink);
  return Math.round(((1 - w) * prior + w * observed) * 1000) / 1000;
}

/** Probability a learner at `mastery` (0-1) succeeds on an item of `difficulty` (0-1). */
export const successProbability = (mastery, difficulty) =>
  1 / (1 + Math.exp(-5 * (mastery - difficulty)));
