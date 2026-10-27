// The equation balance scale: boxes that each hold the same hidden weight x, plus loose weights, on two pans.
// A move changes the pans (take weights off, take x-boxes off, split into equal groups); legal moves done to BOTH
// pans keep it balanced, and a move on one pan only tips it. The scale always shows the exact difference of the two
// pans using the hidden weight, so what the learner sees is true. Pure and DOM-free. @fm2 FM-058 FM-059 FM-060
import { add, cmp, div, frac, mul, sub, toNumber } from "../../rational.js";

export const MAX_TILT = 14;
const FULL_TILT_SHARE = 0.4;

// Degrees of beam tilt for a weight difference (positive = left pan heavier). Proportional up to a clamp:
// a difference of 40% of the reference weight tips the beam all the way.
export function tiltFor(diff, ref) {
  const share = toNumber(diff) / Math.max(ref, 1e-9) / FULL_TILT_SHARE;
  return MAX_TILT * Math.max(-1, Math.min(1, share));
}

export const startState = (round) => ({
  l: { x: round.eq.l.x, k: frac(round.eq.l.k) },
  r: { x: round.eq.r.x, k: frac(round.eq.r.k) },
});

export const panWeight = (pan, xv) => add(mul(frac(pan.x), xv), pan.k);
export const difference = (round, state) =>
  sub(panWeight(state.l, round.xv), panWeight(state.r, round.xv));

const SIDES = { both: ["l", "r"], l: ["l"], r: ["r"] };
const isWhole = (q) => q.d === 1;

// Apply one move. Returns { ok: true, state } or { ok: false, mistake, side? } without changing the state.
export function applyMove(state, move) {
  const sides = SIDES[move.side];
  if (!sides || !Number.isInteger(move.n) || move.n < 1) return { ok: false, mistake: "bad-move" };
  const next = { l: { ...state.l }, r: { ...state.r } };
  if (move.op === "take" && move.what === "k") {
    for (const s of sides) {
      if (cmp(state[s].k, frac(move.n)) < 0)
        return { ok: false, mistake: "too-few-weights", side: s };
      next[s].k = sub(state[s].k, frac(move.n));
    }
    return { ok: true, state: next };
  }
  if (move.op === "take" && move.what === "x") {
    if (move.side !== "both") return { ok: false, mistake: "x-one-pan" };
    for (const s of sides) {
      if (state[s].x < move.n) return { ok: false, mistake: "too-few-boxes", side: s };
      next[s].x = state[s].x - move.n;
    }
    return { ok: true, state: next };
  }
  if (move.op === "split") {
    if (move.side !== "both") return { ok: false, mistake: "split-one-pan" };
    if (move.n < 2) return { ok: false, mistake: "bad-move" };
    for (const s of sides) {
      if (state[s].x % move.n !== 0) return { ok: false, mistake: "split-uneven", side: s };
      next[s].x = state[s].x / move.n;
      next[s].k = div(state[s].k, frac(move.n));
      if (next[s].x > 0 && !isWhole(next[s].k))
        return { ok: false, mistake: "split-loose", side: s };
    }
    return { ok: true, state: next };
  }
  return { ok: false, mistake: "bad-move" };
}

export function replay(round, moves) {
  let state = startState(round);
  for (const move of moves) {
    const step = applyMove(state, move);
    if (!step.ok) return { ok: false, mistake: step.mistake, state };
    state = step.state;
  }
  return { ok: true, state };
}

// "x alone": one pan is exactly one x-box with nothing else, the other pan has no x-boxes.
export function alone(state) {
  for (const [a, b] of [
    ["l", "r"],
    ["r", "l"],
  ]) {
    if (state[a].x === 1 && state[a].k.n === 0 && state[b].x === 0)
      return { side: a, value: state[b].k };
  }
  return null;
}

// Why the learner's last state is not finished, as a mistake key.
export function unfinished(state) {
  if (state.l.x > 0 && state.r.x > 0) return "x-both-pans";
  const holder = state.l.x > 0 ? state.l : state.r;
  if (holder.k.n !== 0) return "loose-weights";
  return "needs-split";
}

export function judge(round, moves) {
  const played = replay(round, Array.isArray(moves) ? moves : []);
  if (!played.ok) return { correct: false, mistake: "bad-move" };
  const diff = difference(round, played.state);
  if (diff.n !== 0) return { correct: false, mistake: "tipped", state: played.state };
  const done = alone(played.state);
  if (!done) return { correct: false, mistake: unfinished(played.state), state: played.state };
  return { correct: true, state: played.state, value: done.value };
}

// A model solution: take shared x-boxes, then the loose weights from the x pan's side, then split.
export function solutionMoves(round) {
  const moves = [];
  let state = startState(round);
  const push = (move) => {
    const step = applyMove(state, move);
    if (!step.ok) throw new RangeError(`solution move failed: ${step.mistake}`);
    state = step.state;
    moves.push(move);
  };
  const common = Math.min(state.l.x, state.r.x);
  if (common > 0) push({ op: "take", what: "x", side: "both", n: common });
  const holder = state.l.x > 0 ? "l" : "r";
  if (state[holder].k.n > 0) push({ op: "take", what: "k", side: "both", n: state[holder].k.n });
  if (state[holder].x > 1) push({ op: "split", side: "both", n: state[holder].x });
  return moves;
}
