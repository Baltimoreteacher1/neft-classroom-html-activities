/**
 * Lock studio model for the equations missions (Escape Room Architect, Fundraiser Goal Tracker,
 * Master Codebreaker). Pure; no DOM. Exact rational arithmetic only (exact.mjs).
 *
 * The student authors a puzzle, stored under `workbench.locks`:
 *   secret  their intended code (or, in the tracker, their proposed value of the unknown)
 *   locks   one-step equations: kind "add" is x + p = q, kind "mul" is p·x = q. `auto` marks a q the
 *           Studio computed from the secret ("rebuild"); a typed q is the student's own number.
 *   clues   inequality clues n ≥ k, n > k, n ≤ k, n < k about the code
 *   steps   per lock, the solving steps the student applied on the balance (the "time machine")
 *   tries   amounts tested against the tracker's goal inequality; goalOp is "≥" or ">"
 * The model validates that every lock has exactly the intended solution, that the clues agree with
 * the secret and with each other, and replays solving steps, flagging a step done to one side only.
 */
import { add, cmp, eq, frac, isInt, mul, neg, parse, show, sub } from "./exact.mjs";

export const MAX_LOCKS = 6;
export const MAX_CLUES = 4;
export const MAX_STEPS = 12;
export const MAX_TRIES = 8;
export const CLUE_OPS = [">=", ">", "<=", "<"];
export const STEP_OPS = ["+", "-", "*", "/"];
export const SIDES = ["both", "left", "right"];
const ZERO = frac(0n);
const ONE = frac(1n);

/** Number text a student may type for p, q, k, the secret or a code: nonnegative, exact. */
export function numText(raw) {
  const s = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!/^(\d{1,6}(\.\d{1,3})?|\d{1,3}\/\d{1,3}|\d{1,3} \d{1,3}\/\d{1,3})$/.test(s)) return null;
  return parse(s) ? s : null;
}
const val = (s) => (s === "" || s == null ? null : parse(s));
const text = (x) => show(x);

/** Validate stored data. Never throws; garbage becomes the empty puzzle. */
export function cleanLocks(raw) {
  const out = { secret: numText(raw?.secret) || "", locks: [], clues: [], steps: {}, tries: [], goalOp: raw?.goalOp === ">" ? ">" : ">=" };
  const ids = new Set();
  for (const l of Array.isArray(raw?.locks) ? raw.locks.slice(0, MAX_LOCKS) : []) {
    if (!l || !/^L\d{1,2}$/.test(l.id) || ids.has(l.id) || !["add", "mul"].includes(l.kind)) continue;
    const p = numText(l.p), q = numText(l.q);
    if (!p || !q) continue;
    ids.add(l.id);
    out.locks.push({ id: l.id, kind: l.kind, p, q, auto: l.auto === true });
  }
  const cids = new Set();
  for (const c of Array.isArray(raw?.clues) ? raw.clues.slice(0, MAX_CLUES) : []) {
    if (!c || !/^C\d{1,2}$/.test(c.id) || cids.has(c.id) || !CLUE_OPS.includes(c.op) || !numText(c.k)) continue;
    cids.add(c.id);
    out.clues.push({ id: c.id, op: c.op, k: numText(c.k) });
  }
  for (const l of out.locks) {
    const list = raw?.steps?.[l.id];
    if (!Array.isArray(list)) continue;
    const steps = list
      .slice(0, MAX_STEPS)
      .filter((st) => st && STEP_OPS.includes(st.op) && SIDES.includes(st.side) && numText(st.k))
      .map((st) => ({ op: st.op, k: numText(st.k), side: st.side }));
    if (steps.length) out.steps[l.id] = steps;
  }
  out.tries = (Array.isArray(raw?.tries) ? raw.tries : []).map(numText).filter(Boolean).slice(0, MAX_TRIES);
  return out;
}

export const nextId = (list, prefix) => `${prefix}${list.reduce((top, it) => Math.max(top, Number(it.id.slice(1))), 0) + 1}`;

/* ------------------------------------------------------------------ locks */
/** Exact solution of one lock, or { error: "zero" } for 0·x = q (no single solution). */
export function solveLock(lock) {
  const p = val(lock.p), q = val(lock.q);
  if (!p || !q) return { error: "number" };
  if (lock.kind === "add") return { x: sub(q, p) };
  if (eq(p, ZERO)) return { error: "zero" };
  return { x: mul(q, frac(p.d, p.n)) };
}
/** The right side that makes `secret` the solution: x + p = secret + p, or p·x = p·secret. */
export const buildQ = (kind, p, secret) => (kind === "add" ? add(secret, p) : mul(p, secret));

/** Substitute a code into a lock. `side` compares the left side with q: "high", "low" or "equal". */
export function tryCode(lock, code) {
  const p = val(lock.p), q = val(lock.q), x = val(code);
  if (!p || !q || !x) return { open: false, error: "number" };
  const left = lock.kind === "add" ? add(x, p) : mul(p, x);
  const c = cmp(left, q);
  return { open: c === 0, side: c > 0 ? "high" : c < 0 ? "low" : "equal" };
}

/* ------------------------------------------------------------------ clues */
export function holds(op, k, v) {
  const c = cmp(v, k);
  return op === ">=" ? c >= 0 : op === ">" ? c > 0 : op === "<=" ? c <= 0 : c < 0;
}
const floorF = (x) => {
  const q = x.n / x.d;
  return x.n < 0n && q * x.d !== x.n ? q - 1n : q;
};
const ceilF = (x) => -floorF(neg(x));
/** Smallest whole number (0, 1, 2, …) a clue allows, or null when it allows none. */
export function smallestWhole(op, k) {
  if (op === ">=") return frac(ceilF(k) < 0n ? 0n : ceilF(k));
  if (op === ">") return frac(floorF(k) + 1n < 0n ? 0n : floorF(k) + 1n);
  return holds(op, k, ZERO) ? ZERO : null;
}
/** Largest whole number an upper-bound clue allows (null = no upper bound). */
const largestWhole = (op, k) => (op === "<=" ? floorF(k) : op === "<" ? ceilF(k) - 1n : null);
/** What a tester who confuses "at least" and "greater than" (or at most / less than) reads instead. */
export const misread = (op) => ({ ">=": ">", ">": ">=", "<=": "<", "<": "<=" })[op];

/** The whole numbers every clue allows: { lo, hi } (hi null = unbounded), empty when none. */
export function wholeOutcomes(clues) {
  let lo = 0n;
  let hi = null;
  for (const c of clues) {
    const k = val(c.k);
    if (c.op === ">=" || c.op === ">") lo = lo > smallestWhole(c.op, k).n ? lo : smallestWhole(c.op, k).n;
    else {
      const top = largestWhole(c.op, k);
      hi = hi === null || top < hi ? top : hi;
    }
  }
  const empty = hi !== null && hi < lo;
  return { lo: frac(lo), hi: hi === null ? null : frac(hi), empty, count: hi === null ? null : empty ? 0 : Number(hi - lo + 1n) };
}

/** Does a number pass every clue (the inequality gate)? Lists the clues it fails, with why. */
export function gate(clues, raw) {
  const v = val(raw);
  if (!v) return { pass: false, error: "number" };
  const failed = clues
    .filter((c) => !holds(c.op, val(c.k), v))
    .map((c) => ({ id: c.id, why: eq(v, val(c.k)) ? "boundary" : c.op[0] === ">" ? "below" : "above" }));
  return { pass: !failed.length, failed };
}

/** Validate the whole puzzle against the student's own secret. */
export function validatePuzzle(data) {
  const secret = val(data.secret);
  const locks = data.locks.map((l) => {
    const s = solveLock(l);
    return { id: l.id, ...s, matches: !!(secret && s.x && eq(s.x, secret)) };
  });
  const clues = data.clues.map((c) => {
    const k = val(c.k);
    const ok = secret ? holds(c.op, k, secret) : null;
    const misreadOk = secret ? holds(misread(c.op), k, secret) : null;
    return { id: c.id, holds: ok, smallest: smallestWhole(c.op, k), fragile: !!(ok && !misreadOk), widened: !!(ok && misreadOk && !c.op.endsWith("=")) };
  });
  const outcomes = wholeOutcomes(data.clues);
  const ready = !!secret && locks.length > 0 && locks.every((l) => l.matches) && clues.every((c) => c.holds);
  return { secret, locks, clues, outcomes, consistent: !outcomes.empty && clues.every((c) => c.holds !== false), ready };
}

/* ------------------------------------------------------------- balance / time machine */
const side = (x, c) => ({ x, c });
export function startState(lock) {
  const p = val(lock.p), q = val(lock.q);
  return lock.kind === "add" ? { left: side(ONE, p), right: side(ZERO, q) } : { left: side(p, ZERO), right: side(ZERO, q) };
}
function applyTo(s, op, k) {
  if (op === "+") return side(s.x, add(s.c, k));
  if (op === "-") return side(s.x, sub(s.c, k));
  if (op === "*") return side(mul(s.x, k), mul(s.c, k));
  const inv = frac(k.d, k.n);
  return side(mul(s.x, inv), mul(s.c, inv));
}
/** Solution set of left = right: { x } unique, "all", or "none". */
export function solutionOf(st) {
  const a = sub(st.left.x, st.right.x), b = sub(st.right.c, st.left.c);
  if (eq(a, ZERO)) return eq(b, ZERO) ? "all" : "none";
  return { x: mul(b, frac(a.d, a.n)) };
}
/**
 * Replay a lock's steps. Each frame: { state, step, valid, error, equivalent, tilt, solved }.
 * A step on one side only is recorded but invalid; from then on the equation is no longer equivalent
 * to the lock (a different solution), and the beam tilts toward the heavier side at the lock's true
 * solution. Multiplying or dividing by 0 is refused (error "zero") and leaves the state unchanged.
 */
export function timeline(lock, steps = []) {
  const truth = solveLock(lock);
  const frames = [{ state: startState(lock), step: null, valid: true, equivalent: true, tilt: 0, solved: false }];
  for (const step of steps) {
    const prev = frames[frames.length - 1].state;
    const k = val(step.k);
    if ((step.op === "*" || step.op === "/") && eq(k, ZERO)) {
      frames.push({ ...frames[frames.length - 1], step, valid: false, error: "zero" });
      continue;
    }
    const state = {
      left: step.side === "right" ? prev.left : applyTo(prev.left, step.op, k),
      right: step.side === "left" ? prev.right : applyTo(prev.right, step.op, k),
    };
    const sol = solutionOf(state);
    const equivalent = !!(truth.x && sol.x && eq(sol.x, truth.x));
    let tilt = 0;
    if (!equivalent && truth.x) {
      const at = (sd) => add(mul(sd.x, truth.x), sd.c);
      tilt = cmp(at(state.left), at(state.right));
    }
    const solved = equivalent && ((eq(state.left.x, ONE) && eq(state.left.c, ZERO) && eq(state.right.x, ZERO)) || (eq(state.right.x, ONE) && eq(state.right.c, ZERO) && eq(state.left.x, ZERO)));
    frames.push({ state, step, valid: step.side === "both", equivalent, tilt, solved });
  }
  return frames;
}
/** One side as text; `fmt` prints each exact number (the view masks hidden answers there). */
export function sideText(sd, fmt = text) {
  const parts = [];
  if (!eq(sd.x, ZERO)) parts.push(eq(sd.x, ONE) ? "x" : `${fmt(sd.x)}x`);
  if (!eq(sd.c, ZERO) || !parts.length) {
    const negC = sd.c.n < 0n;
    const mag = fmt(negC ? neg(sd.c) : sd.c);
    parts.push(parts.length ? `${negC ? "−" : "+"} ${mag}` : `${negC ? "−" : ""}${mag}`);
  }
  return parts.join(" ");
}

/* ------------------------------------------------------------------ tracker */
/** Total raised for a progress equation and a proposed value: p + v (add) or p·v (mul). */
export function trackerTotal(lock, raw) {
  const p = val(lock.p), v = val(raw);
  if (!p || !v) return null;
  return lock.kind === "add" ? add(p, v) : mul(p, v);
}
export const meetsGoal = (goalOp, total, goal) => holds(goalOp, goal, total);

/* ------------------------------------------------------------------ report */
const OP_TEXT = { ">=": "≥", ">": ">", "<=": "≤", "<": "<" };
export const opText = (op) => OP_TEXT[op];
export const lockText = (l, q = l.q) => (l.kind === "add" ? `x + ${l.p} = ${q}` : `${l.p}x = ${q}`);

/**
 * Report lines. The report cannot see which Test answers are checked, so any number the Studio
 * computed (a rebuilt q) that equals one of this design's Test answers prints as "?". Solutions are
 * reported as verdicts against the student's own secret, never as computed numbers.
 */
export function locksReport(data, values) {
  if (!data.locks.length && !data.clues.length && !data.tries.length) return [];
  const protect = values ? [values.a, values.a + values.b, values.a + 1, values.c].map((n) => frac(BigInt(n))) : [];
  const safe = (s) => {
    const v = val(s);
    return v && isInt(v) && protect.some((h) => eq(h, v)) ? "?" : s;
  };
  const check = validatePuzzle(data);
  const lines = ["EQUATION LOCKS"];
  lines.push(`My secret / proposed value: ${data.secret || "[not set]"}`);
  data.locks.forEach((l, i) => {
    const v = check.locks[i];
    const verdict = v.error === "zero" ? "has no single solution (0·x)" : v.matches ? "has exactly my intended solution" : "does NOT solve to my secret";
    const steps = data.steps[l.id] || [];
    const bad = timeline(l, steps).filter((f) => f.step && !f.valid).length;
    lines.push(`- Lock ${i + 1}: ${lockText(l, l.auto ? safe(l.q) : l.q)} ${verdict}${steps.length ? `; ${steps.length} solving step(s)${bad ? `, ${bad} flagged as invalid` : ""}` : ""}`);
  });
  data.clues.forEach((c, i) => {
    const v = check.clues[i];
    lines.push(`- Clue ${i + 1}: n ${opText(c.op)} ${c.k}${v.holds === false ? " (rules out my secret)" : ""}${v.fragile ? ` (breaks if read as n ${opText(misread(c.op))} ${c.k}: boundary test)` : ""}`);
  });
  if (data.clues.length) lines.push(`Clues consistent with each other and my secret: ${check.consistent ? "yes" : "NO"}`);
  if (data.tries.length && data.locks[0]) lines.push(`Goal tests (total ${opText(data.goalOp)} ${data.locks[0].q}): ${data.tries.map((s) => `${s} ${holds(data.goalOp, val(data.locks[0].q), val(s)) ? "meets" : "does not meet"}`).join("; ")}`);
  lines.push("");
  return lines;
}
