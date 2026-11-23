// Economy.js — Lexicon Shards: the shared, purely virtual in-run currency of the game suite.
//
// Shards cannot be bought, have no monetary value and are never random. They are separate from learning
// evidence: a high Shard count is never read as proficiency (Evidence.js never imports this file).
// Everything here is a pure function over a plain, serializable state, so a run can be saved, resumed,
// replayed and balance-tested. Prices and rates live in ECONOMY_CONFIG only.

export const ECONOMY_CONFIG = Object.freeze({
  baseReward: Object.freeze([0, 10, 14, 18, 24, 30]), // by prompt difficulty 1..5
  streakTiers: Object.freeze([
    { min: 12, mult: 5, name: "overdrive" },
    { min: 8, mult: 3, name: "blazing" },
    { min: 5, mult: 2, name: "hot" },
    { min: 3, mult: 1.5, name: "warm" },
    { min: 0, mult: 1, name: "steady" },
  ]),
  matrix: Object.freeze({ costs: [60, 120, 200, 320, 480], mult: [1, 1.15, 1.3, 1.5, 1.75, 2] }),
  // price = shards, max = most a run may hold at once
  items: Object.freeze({
    shield: { price: 80, max: 2, kind: "stock" },
    decoder: { price: 50, max: 5, kind: "stock" },
    freeze: { price: 70, max: 3, kind: "stock" },
    recovery: { price: 60, max: 3, kind: "stock" },
    grapple: { price: 60, max: 3, kind: "stock", game: "syntax-odyssey" },
  }),
  independenceBonus: 3, // first try, no scaffold: counts in every mode, including untimed
  paceBonusMax: 0.2, // fraction of base, timed modes only, never more
  recoveryPayout: Object.freeze({ revise: 0.5, pulse: 0.75 }), // revise: the free second try; pulse: the purchased fresh attempt
  questionCap: 150, // one answer can never pay more than this
  runSoftCap: 5000, // after this a run earns a quarter rate, so a run cannot inflate without bound
  softCapRate: 0.25,
  txKeep: 200,
});

const cfg = ECONOMY_CONFIG;
const int = (n) => Math.max(0, Math.round(Number(n) || 0));

export const emptyEconomy = () => ({
  v: 1,
  shards: 0,
  earned: 0,
  spent: 0,
  matrix: 0,
  stock: {},
  tx: [],
});

export function cleanEconomy(raw) {
  const out = emptyEconomy();
  if (!raw || typeof raw !== "object") return out;
  out.shards = int(raw.shards);
  out.earned = int(raw.earned);
  out.spent = int(raw.spent);
  out.matrix = Math.min(cfg.matrix.costs.length, int(raw.matrix));
  for (const [id, def] of Object.entries(cfg.items))
    out.stock[id] = Math.min(def.max, int(raw.stock?.[id]));
  out.tx = Array.isArray(raw.tx)
    ? raw.tx.filter((x) => typeof x === "string").slice(-cfg.txKeep)
    : [];
  return out;
}

export const streakTier = (streak) => cfg.streakTiers.find((t) => streak >= t.min);
export const streakMultiplier = (streak) => streakTier(streak).mult;
export const isOverdrive = (streak) => streakTier(streak).name === "overdrive";
export const matrixMultiplier = (state) =>
  cfg.matrix.mult[Math.min(state.matrix, cfg.matrix.mult.length - 1)];
export const baseReward = (difficulty) =>
  cfg.baseReward[Math.min(5, Math.max(1, Math.round(difficulty) || 1))];

/**
 * Shards for one correct answer.
 * `streak` is the streak AFTER this answer. `paced` is 0..1 (how much of the time limit was left) and is only
 * read when `timed` is true. `independent` is true when the answer was a first try with no scaffold.
 */
export function rewardFor(
  state,
  { difficulty = 2, streak = 1, independent = false, timed = false, paced = 0 } = {},
) {
  const base = baseReward(difficulty);
  const raw = base * streakMultiplier(streak) * matrixMultiplier(state);
  const bonus =
    (independent ? cfg.independenceBonus : 0) +
    (timed && independent
      ? Math.round(base * cfg.paceBonusMax * Math.min(1, Math.max(0, paced)))
      : 0);
  let pay = Math.min(cfg.questionCap, Math.round(raw + bonus));
  if (state.earned >= cfg.runSoftCap) pay = Math.max(1, Math.round(pay * cfg.softCapRate));
  return pay;
}

/** Award a correct answer. Returns { state, pay }. A replayed `txId` pays nothing (idempotent). */
export function award(state, args, txId) {
  if (txId && state.tx.includes(txId)) return { state, pay: 0, duplicate: true };
  const pay = rewardFor(state, args);
  return {
    state: spend0(state, { shards: state.shards + pay, earned: state.earned + pay }, txId),
    pay,
  };
}

/** Recovery payout: 75% of what the original answer would have paid, as an independent bonus never applies. */
export function awardRecovery(state, { difficulty = 2, streak = 1, pulse = false } = {}, txId) {
  if (txId && state.tx.includes(txId)) return { state, pay: 0, duplicate: true };
  const full = rewardFor(state, { difficulty, streak, independent: false });
  const pay = Math.max(1, Math.round(full * (pulse ? cfg.recoveryPayout.pulse : cfg.recoveryPayout.revise)));
  return {
    state: spend0(state, { shards: state.shards + pay, earned: state.earned + pay }, txId),
    pay,
  };
}

function spend0(state, patch, txId) {
  const tx = txId ? [...state.tx, txId].slice(-cfg.txKeep) : state.tx;
  return { ...state, ...patch, tx };
}

export const matrixNext = (state) =>
  state.matrix >= cfg.matrix.costs.length
    ? null
    : {
        tier: state.matrix + 1,
        cost: cfg.matrix.costs[state.matrix],
        mult: cfg.matrix.mult[state.matrix + 1],
      };

/** What the shop shows for each upgrade: price, owned, max, and why it cannot be bought right now. */
export function shopCatalog(state, { gameId = "" } = {}) {
  const next = matrixNext(state);
  const rows = [
    {
      id: "matrix",
      kind: "tiered",
      owned: state.matrix,
      max: cfg.matrix.costs.length,
      price: next ? next.cost : 0,
      detail: { now: matrixMultiplier(state), next: next ? next.mult : null },
      reason: !next ? "max" : state.shards < next.cost ? "short" : "",
    },
  ];
  for (const [id, def] of Object.entries(cfg.items)) {
    if (def.game && def.game !== gameId) continue;
    const owned = state.stock[id] || 0;
    rows.push({
      id,
      kind: "stock",
      owned,
      max: def.max,
      price: def.price,
      reason: owned >= def.max ? "max" : state.shards < def.price ? "short" : "",
    });
  }
  return rows;
}

/**
 * Buy one upgrade. Pure and validated: unknown item, over the max tier, not enough Shards and a repeated
 * transaction id all leave the state unchanged. Balance can never go negative.
 */
export function purchase(state, itemId, txId, { gameId = "" } = {}) {
  if (txId && state.tx.includes(txId)) return { ok: true, state, duplicate: true };
  if (itemId === "matrix") {
    const next = matrixNext(state);
    if (!next) return { ok: false, state, reason: "max" };
    if (state.shards < next.cost) return { ok: false, state, reason: "short" };
    return {
      ok: true,
      state: spend0(
        state,
        { shards: state.shards - next.cost, spent: state.spent + next.cost, matrix: next.tier },
        txId,
      ),
      cost: next.cost,
    };
  }
  const def = cfg.items[itemId];
  if (!def || (def.game && def.game !== gameId)) return { ok: false, state, reason: "unknown" };
  const owned = state.stock[itemId] || 0;
  if (owned >= def.max) return { ok: false, state, reason: "max" };
  if (state.shards < def.price) return { ok: false, state, reason: "short" };
  return {
    ok: true,
    state: spend0(
      state,
      {
        shards: state.shards - def.price,
        spent: state.spent + def.price,
        stock: { ...state.stock, [itemId]: owned + 1 },
      },
      txId,
    ),
    cost: def.price,
  };
}

/**
 * Spend Shards on something a game defines (a tower, a repair). Validated and idempotent by txId; the
 * balance never goes negative and `spent` is tracked. Upgrades from the shop use purchase() instead.
 */
export function spend(state, cost, txId) {
  if (txId && state.tx.includes(txId)) return { ok: true, state, duplicate: true };
  const c = int(cost);
  if (c < 1) return { ok: false, state, reason: "range" };
  if (state.shards < c) return { ok: false, state, reason: "short" };
  return { ok: true, state: spend0(state, { shards: state.shards - c, spent: state.spent + c }, txId) };
}
/** Give Shards back (selling a tower). Never more than was spent. */
export function refund(state, amount, txId) {
  if (txId && state.tx.includes(txId)) return { ok: true, state, duplicate: true };
  const a = Math.min(int(amount), state.spent);
  return { ok: true, state: spend0(state, { shards: state.shards + a, spent: state.spent - a }, txId), amount: a };
}

/** Use one stocked item (a shield absorbing a miss, a freeze, a decoder). */
export function consume(state, itemId, txId) {
  if (txId && state.tx.includes(txId)) return { ok: true, state, duplicate: true };
  if ((state.stock[itemId] || 0) < 1) return { ok: false, state, reason: "none" };
  return {
    ok: true,
    state: spend0(state, { stock: { ...state.stock, [itemId]: state.stock[itemId] - 1 } }, txId),
  };
}

/** Risk/Reward stake (Arena Blitz): at most half the Shards held, never negative, and only earned in-run Shards. */
export const maxStake = (state) => Math.floor(state.shards / 2);
export function stake(state, amount, txId) {
  const a = int(amount);
  if (a < 1 || a > maxStake(state)) return { ok: false, state, reason: "range" };
  return { ok: true, state: spend0(state, { shards: state.shards - a }, txId), staked: a };
}
export function settleStake(state, staked, won, { difficulty = 3 } = {}, txId) {
  if (!won) return { state: spend0(state, {}, txId), pay: 0 };
  const pay = Math.min(cfg.questionCap * 2, Math.round(staked * 2 + baseReward(difficulty)));
  return {
    state: spend0(
      state,
      { shards: state.shards + pay, earned: state.earned + Math.max(0, pay - staked) },
      txId,
    ),
    pay,
  };
}

// ── streak ──────────────────────────────────────────────────────────────────────────────────
export const emptyStreak = () => ({ streak: 0, best: 0, shielded: 0 });

/**
 * Record one first-attempt result. A shield absorbs one miss without breaking the GAMEPLAY streak; the miss is
 * still recorded as a miss by Evidence.js (the shield never touches academic accuracy).
 */
export function streakAfter(streakState, correct, { shield = false } = {}) {
  if (correct) {
    const streak = streakState.streak + 1;
    return {
      streak: { ...streakState, streak, best: Math.max(streakState.best, streak) },
      shieldUsed: false,
    };
  }
  if (shield)
    return { streak: { ...streakState, shielded: streakState.shielded + 1 }, shieldUsed: true };
  return { streak: { ...streakState, streak: 0 }, shieldUsed: false };
}

/** A deterministic balance probe used by the tests: shards earned by `n` answers at a given accuracy. */
export function simulateEarnings(n, accuracy, { difficulty = 3, buyMatrix = true } = {}) {
  let state = emptyEconomy();
  let streak = emptyStreak();
  for (let i = 0; i < n; i += 1) {
    const correct = ((i * 7919) % 100) / 100 < accuracy;
    const r = streakAfter(streak, correct);
    streak = r.streak;
    if (correct)
      state = award(state, { difficulty, streak: streak.streak, independent: true }, `s${i}`).state;
    if (buyMatrix) {
      const p = purchase(state, "matrix", `m${i}`);
      if (p.ok) state = p.state;
    }
  }
  return state;
}
