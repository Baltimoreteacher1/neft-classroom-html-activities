/**
 * One puzzle being played: the rules of a turn, with no DOM so they can be tested
 * and saved. A turn is: pick a move for both sides (chooseMove), then write what each
 * side becomes (submitEntry). The model checks the student's typed values; it never
 * fills one in. Every outcome names the misconception tag it found, if any.
 */
import { entryHint, graphHint, MAX_RUNGS, moveHint } from "./hints.js";
import * as M from "./balance-model.js";
import { toEquation, VARIABLES, validatePuzzle } from "./puzzles.js";
import * as R from "./rational.js";

const NOT_INVERSE = "equation-not-inverse-operation";

export function startSession(spec) {
  const verdict = validatePuzzle(spec);
  if (!verdict.ok) throw new RangeError("puzzle is not valid");
  const start = toEquation(spec);
  return {
    spec,
    v: VARIABLES[spec.v],
    answer: R.rat(verdict.answer),
    rating: verdict.rating,
    start,
    eq: start,
    steps: [],
    pending: null,
    earned: false,
    rungs: 0,
    wrongSide: "left",
    status: "playing",
    graphMisses: 0,
  };
}

const isTilt = (s) => s.spec.rel !== "=";

function settle(s) {
  const done = M.isolated(s.eq);
  if (!done) s.status = "playing";
  else s.status = isTilt(s) ? "isolated" : "solved";
  return done;
}

/** Picks a move (not yet written on the sides). */
export function chooseMove(s, op, amountText) {
  const parsed = M.parseMove(op, amountText, s.v);
  if (!parsed.ok) return { kind: "error", code: parsed.reason };
  if (!M.applyMove(s.eq, parsed.move).ok) return { kind: "error", code: "tooBig" };
  const classify = M.classifyMove(s.eq, parsed.move);
  s.pending = { move: parsed.move, text: M.moveText(parsed.move, s.v), classify };
  s.rungs = 0;
  if (classify === "ok") return { kind: "started", classify };
  s.earned = true;
  return { kind: "started", classify, tag: NOT_INVERSE };
}

export function cancelMove(s) {
  s.pending = null;
  s.rungs = 0;
}

/** Checks what the student wrote for the two sides (and the symbol, for inequalities). */
export function submitEntry(s, typed) {
  if (!s.pending) return { kind: "error", code: "noMove" };
  const out = M.checkEntry(s.eq, s.pending.move, typed, s.v, s.answer);
  if (out.ok) {
    s.steps.push({ op: s.pending.move.op, text: s.pending.text, eq: out.eq });
    s.eq = out.eq;
    s.pending = null;
    s.rungs = 0;
    s.wrongSide = "left";
    const done = settle(s);
    return { kind: "correct", solved: s.status === "solved", isolated: done };
  }
  if (out.reason !== "wrong") return { kind: "format", reason: out.reason, side: out.side };
  s.earned = true;
  s.wrongSide = out.sides.right !== "ok" && out.sides.left === "ok" ? "right" : "left";
  return { kind: "wrong", result: out, tag: out.tag };
}

export function undo(s) {
  if (s.pending) {
    cancelMove(s);
    return true;
  }
  const last = s.steps.pop();
  if (!last) return false;
  s.eq = s.steps.length ? s.steps[s.steps.length - 1].eq : s.start;
  s.rungs = 0;
  s.status = "playing";
  return true;
}

export function reset(s) {
  s.eq = s.start;
  s.steps = [];
  s.pending = null;
  s.rungs = 0;
  s.status = "playing";
  s.graphMisses = 0;
}

/** The next hint rung, or `locked` until the student has tried something. */
export function nextHint(s) {
  if (!s.earned) return { locked: true };
  const rung = Math.min(s.rungs, MAX_RUNGS - 1);
  s.rungs = Math.min(s.rungs + 1, MAX_RUNGS);
  if (s.status === "isolated") return { rung, ...graphHint(rung) };
  if (s.pending) return { rung, ...entryHint(s.eq, s.pending.move, rung, s.v, s.wrongSide) };
  return { rung, ...moveHint(s.eq, rung, s.v) };
}

/** Graph of an inequality's solution: open or closed circle, shaded toward smaller or bigger. */
export function submitGraph(s, choice) {
  const rel = s.spec.rel;
  const wantOpen = rel === "<" || rel === ">";
  const wantDir = rel === ">" || rel === "≥" ? "right" : "left";
  const dirOk = choice.dir === wantDir;
  const circleOk = choice.open === wantOpen;
  if (dirOk && circleOk) {
    s.status = "solved";
    return { kind: "correct", solved: true };
  }
  s.earned = true;
  s.graphMisses += 1;
  const coach = dirOk ? "coach.graphCircle" : circleOk ? "coach.graphDirection" : "coach.graphBoth";
  const tag = dirOk ? "inequality-boundary-inclusion" : "inequality-graph-direction";
  return { kind: "wrong", tag, coach };
}

/** "Prove it": put the found value back into the first equation. */
export function proveIt(s, left, right) {
  const value = M.isolated(s.eq)?.value;
  if (!value) return { kind: "error" };
  const read = [left, right].map((text) => M.parseSide(text, s.v));
  const plain = read.every((r) => r.ok && r.xTerms === 0 && r.numTerms === 1);
  if (!plain) return { kind: "format" };
  const want = [M.evalSide(s.start.l, value), M.evalSide(s.start.r, value)];
  const ok = read.every((r, i) => R.eq(r.side.b, want[i]));
  return { kind: ok ? "correct" : "wrong" };
}

/** Try a number for the variable on the starting inequality and see which pan is lower. */
export function testValue(s, text) {
  const read = M.parseSide(text, s.v);
  if (!read.ok || read.xTerms !== 0 || read.numTerms !== 1) return { kind: "error" };
  const x = read.side.b;
  return {
    kind: "tested",
    n: R.fmt(x),
    tilt: M.tilt(s.start, x),
    truth: M.holds(M.evalSide(s.start.l, x), s.spec.rel, M.evalSide(s.start.r, x)),
  };
}

/** What the shared save/resume runtime stores for this puzzle. */
export const serialize = (s) => ({
  moves: s.steps.map((st) => [st.op, st.text.replace(/^\S+\s/, "")]),
  earned: s.earned,
});

/** Replays saved moves (already checked when they were played) onto a fresh session. */
export function restore(spec, saved) {
  const s = startSession(spec);
  if (!saved || !Array.isArray(saved.moves)) return s;
  for (const [op, amount] of saved.moves.slice(0, 12)) {
    const parsed = M.parseMove(String(op), String(amount), s.v);
    const next = parsed.ok && M.applyMove(s.eq, parsed.move);
    if (!next?.ok) break;
    s.steps.push({ op: parsed.move.op, text: M.moveText(parsed.move, s.v), eq: next.eq });
    s.eq = next.eq;
  }
  s.earned = saved.earned === true;
  settle(s);
  return s;
}
