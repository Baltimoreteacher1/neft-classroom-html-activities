/**
 * Node-side spiral-review sampler.
 *
 * Mirrors the spiral weighting used by the browser runtime
 * (spiral-review/app.js): every candidate question gets
 *   weight = 1 + (maxUnit - unit) * SPIRAL_STRENGTH
 * so older units are reviewed more often. Adds an optional deterministic seed
 * so a given morning ("2026-09-08") reproduces the same warm-up on every device.
 *
 * Pure data helper — no network, no DOM. Shared by the Do-Now CLI and tests.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BANK_PATH = join(ROOT, "spiral-review", "bank.json");
const SPIRAL_STRENGTH = 0.6;

export function loadBank(path = BANK_PATH) {
  const bank = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(bank.questions)) throw new Error(`Malformed spiral bank at ${path}`);
  return bank;
}

/** Deterministic PRNG (mulberry32) from a string seed; Math.random when no seed. */
function makeRng(seed) {
  if (seed == null || seed === "") return Math.random;
  let h = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i++) {
    h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Units in scope for `{ mode: 'all'|'upto'|'range', upto, from, to }`. */
export function unitsInScope(allUnits, scope = {}) {
  const all = [...allUnits].sort((x, y) => x - y);
  if (scope.mode === "upto" && scope.upto != null) return all.filter((u) => u <= scope.upto);
  if (scope.mode === "range" && scope.from != null && scope.to != null) {
    const lo = Math.min(scope.from, scope.to);
    const hi = Math.max(scope.from, scope.to);
    return all.filter((u) => u >= lo && u <= hi);
  }
  return all;
}

function weightedSampleNoReplace(pool, n, rng) {
  const items = pool.map((q) => ({ q, w: q._weight }));
  const picked = [];
  while (picked.length < n && items.length > 0) {
    let total = 0;
    for (const it of items) total += it.w;
    let r = rng() * total;
    let idx = 0;
    for (let i = 0; i < items.length; i++) {
      r -= items[i].w;
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    picked.push(items[idx].q);
    items.splice(idx, 1);
  }
  return picked;
}

function shuffleChoices(q, rng) {
  const order = q.choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...q,
    choices: order.map((i) => q.choices[i]),
    correctIndex: order.indexOf(q.correctIndex),
  };
}

/**
 * Pick `count` spiral questions.
 * @param {object} bank    parsed bank.json
 * @param {object} opts    { count=3, scope={mode:'all'}, seed=null }
 * @returns {Array} picked questions with shuffled choices
 */
export function pickSpiral(bank, { count = 3, scope = { mode: "all" }, seed = null } = {}) {
  const rng = makeRng(seed);
  const units = unitsInScope(
    bank.meta?.units || [...new Set(bank.questions.map((q) => q.unit))],
    scope,
  );
  const inScope = new Set(units);
  const maxUnit = Math.max(...units);
  const candidates = bank.questions
    .filter((q) => inScope.has(q.unit))
    .map((q) => ({ ...q, _weight: 1 + (maxUnit - q.unit) * SPIRAL_STRENGTH }));
  if (!candidates.length) return [];
  return weightedSampleNoReplace(candidates, count, rng).map((q) => shuffleChoices(q, rng));
}

export { BANK_PATH, SPIRAL_STRENGTH };
