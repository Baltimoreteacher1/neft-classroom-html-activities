// The duel engine: card and seat state, legality of every move, exact values, who wins, and Orbit, the computer
// opponent. Pure and DOM-free. Everything is exact rational arithmetic.
//
// ORBIT'S STRATEGY (deterministic; the same seed always plays the same duel).
//   Open table: on each of its turns Orbit looks at every legal (card, slot) move. For each move it asks "if I made this
//   move, and then filled my remaining slots with the best cards still on the table, what is the best expression I could
//   still reach?" It ignores what you might take (so it never blocks you on purpose) and plays the move whose best
//   reachable expression is closest to the goal; ties go to the lowest card number, then the lowest slot. On a "lax"
//   turn (set per hand by the level) it plays the best move whose reachable result is strictly worse, if one exists.
//   Private hands: Orbit tries every way to arrange its hand into its slots, ranks them by the goal, ties by card
//   numbers in slot order, and plays the best (or the first strictly worse, on a lax hand).
//   Orbit announces its value honestly unless the hand carries a slip, then it is off by the stated amount. @fm2 FM-016
import { add, cmp, eq, frac, neg, sub, toDecimalString, toString } from "../../rational.js";
import { slotCount, slotKinds, TEMPLATES } from "./templates.js";

const MINUS = "−";
const absQ = (q) => frac(Math.abs(q.n), q.d);

export const emptySeat = (round) => Array(slotCount(round.tpl)).fill(null);
export const isFull = (slots) => slots.every((c) => c !== null);
export const allowed = (round, seat) =>
  round.variant === "private" ? round.deal[seat] : round.pool;

export function seatValue(round, slots) {
  const vals = slots.map((id) =>
    round.cards[id].kind === "op" ? round.cards[id].op : round.cards[id].v,
  );
  return TEMPLATES[round.tpl].fn(vals);
}

// Lower is better. max: -value, min: value, closest: distance to the target.
export function distOf(goal, v) {
  if (goal.type === "max") return neg(v);
  if (goal.type === "min") return v;
  return absQ(sub(v, goal.target));
}

// 0 = seat 0 wins, 1 = seat 1 wins, 2 = tie.
export function winnerOf(goal, v0, v1) {
  const c = cmp(distOf(goal, v0), distOf(goal, v1));
  return c < 0 ? 0 : c > 0 ? 1 : 2;
}

// Display text for an exact value: "56", "-3" with a real minus sign, "3/4" or a decimal when the skill speaks decimals.
export function fmtValue(q, style = "int") {
  const text = style === "dec" ? (toDecimalString(q) ?? toString(q)) : toString(q);
  return text.replace("-", MINUS);
}

// ---- replaying a list of moves -------------------------------------------------------------------------------------
// A move is [seat, cardId, slot]. With `fair`, the caregiver's weakest card starts locked in its slot (seat 1).
export function replay(round, moves = [], fair = false) {
  const seats = [emptySeat(round), emptySeat(round)];
  const kinds = slotKinds(round.tpl);
  const usedBy = [new Set(), new Set()];
  if (fair && round.fair) {
    seats[1][round.fair.slot] = round.fair.card;
    usedBy[1].add(round.fair.card);
  }
  const taken = (seat, card) =>
    round.variant === "private"
      ? usedBy[seat].has(card)
      : usedBy[0].has(card) || usedBy[1].has(card);
  const turnNow = (t) => (isFull(seats[t]) ? 1 - t : t);
  let turn = round.first;
  if (!Array.isArray(moves)) return { ok: false, problem: { mistake: "bad-move", at: 0 } };
  for (const [at, move] of moves.entries()) {
    const [seat, card, slot] = Array.isArray(move) ? move : [];
    const fail = (mistake) => ({ ok: false, problem: { mistake, at, seat, card, slot } });
    if (
      (seat !== 0 && seat !== 1) ||
      !Number.isInteger(card) ||
      !round.cards[card] ||
      !Number.isInteger(slot) ||
      slot < 0 ||
      slot >= kinds.length
    )
      return fail("bad-move");
    const expected = round.variant === "private" ? turnNow(round.first) : turnNow(turn);
    if (seat !== expected) return fail("turn");
    if (round.cards[card].kind !== kinds[slot]) return fail("kind");
    if (seats[seat][slot] !== null) return fail("slot-taken");
    if (!allowed(round, seat).includes(card)) return fail("foreign");
    if (taken(seat, card)) return fail("reuse");
    seats[seat][slot] = card;
    usedBy[seat].add(card);
    turn = 1 - seat;
  }
  const next = round.variant === "private" ? turnNow(round.first) : turnNow(turn);
  const complete = isFull(seats[0]) && isFull(seats[1]);
  return { ok: true, seats, complete, turn: complete ? null : next, taken, usedBy };
}

// Cards a seat may still take.
export function available(round, state, seat) {
  return allowed(round, seat).filter((id) => !state.taken(seat, id));
}

// ---- Orbit's search -----------------------------------------------------------------------------------------------
export function* fills(round, slots, avail) {
  const kinds = slotKinds(round.tpl);
  const empties = slots.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
  const work = slots.slice();
  const used = new Set();
  function* go(k) {
    if (k === empties.length) {
      yield work.slice();
      return;
    }
    const slot = empties[k];
    for (const id of avail) {
      if (used.has(id) || round.cards[id].kind !== kinds[slot]) continue;
      used.add(id);
      work[slot] = id;
      yield* go(k + 1);
      work[slot] = null;
      used.delete(id);
    }
  }
  yield* go(0);
}

function bestDist(round, slots, avail) {
  let best = null;
  for (const full of fills(round, slots, avail)) {
    const d = distOf(round.goal, seatValue(round, full));
    if (best === null || cmp(d, best) < 0) best = d;
  }
  return best;
}

const firstWorse = (list) => list.find((c) => cmp(c.dist, list[0].dist) > 0) || list[0];

// The move a player making the "best reachable" choice takes on an open table. `lax` plays the next-worse level.
export function pickMove(round, state, seat, lax = false) {
  const slots = state.seats[seat];
  const kinds = slotKinds(round.tpl);
  const free = TEMPLATES[round.tpl].free;
  const avail = available(round, state, seat).sort((a, b) => a - b);
  const list = [];
  for (const card of avail) {
    const rest = avail.filter((id) => id !== card);
    for (let slot = 0; slot < slots.length; slot += 1) {
      if (slots[slot] !== null || kinds[slot] !== round.cards[card].kind) continue;
      const next = slots.slice();
      next[slot] = card;
      list.push({ card, slot, dist: bestDist(round, next, rest) });
      if (free) break;
    }
  }
  list.sort((a, b) => cmp(a.dist, b.dist) || a.card - b.card || a.slot - b.slot);
  if (!list.length) return null;
  const pick = lax ? firstWorse(list) : list[0];
  return [seat, pick.card, pick.slot];
}

// The arrangement a player takes with a private hand: moves in slot order.
export function pickArrangement(round, state, seat, lax = false) {
  const list = [];
  for (const full of fills(
    round,
    state.seats[seat],
    available(round, state, seat).sort((a, b) => a - b),
  )) {
    list.push({ full, dist: distOf(round.goal, seatValue(round, full)) });
  }
  const lex = (a, b) => {
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
  };
  list.sort((a, b) => cmp(a.dist, b.dist) || lex(a.full, b.full));
  const pick = lax ? firstWorse(list) : list[0];
  return pick.full
    .map((card, slot) => [seat, card, slot])
    .filter(([s, c, slot]) => state.seats[s][slot] !== c);
}

// Orbit's announced value: honest unless the hand carries a slip.
export function orbitClaim(round, v1) {
  const slip = round.orbit.slip;
  if (!slip) return v1;
  const amount = frac(slip.n, slip.d);
  const up = add(v1, amount);
  const down = sub(v1, amount);
  if (!round.negatives && cmp(down, frac(0)) < 0) return up;
  if (!round.negatives && cmp(up, frac(0)) < 0) return down;
  return slip.plus ? up : down;
}

// A full duel hand played by a reference learner (best reachable choice every time) against Orbit.
export function referenceDuel(round) {
  const moves = [];
  let orbitPicks = 0;
  let state = replay(round, moves, false);
  while (!state.complete) {
    const seat = state.turn;
    const lax = seat === 1 && Boolean(round.orbit.lax[orbitPicks]);
    if (round.variant === "private") {
      const placed = pickArrangement(round, state, seat, lax);
      moves.push(...placed);
      if (seat === 1) orbitPicks += 1;
    } else {
      moves.push(pickMove(round, state, seat, lax));
      if (seat === 1) orbitPicks += 1;
    }
    state = replay(round, moves, false);
  }
  return { moves, state };
}

export function referenceRecord(round) {
  const { moves, state } = referenceDuel(round);
  const v0 = seatValue(round, state.seats[0]);
  const v1 = seatValue(round, state.seats[1]);
  const c1 = orbitClaim(round, v1);
  const style = round.style;
  const wrong = !eq(c1, v1);
  return {
    moves,
    fair: false,
    claims: [fmtValue(v0, style), fmtValue(c1, style)],
    call: round.rights.challenge
      ? wrong
        ? { challenge: true, counter: fmtValue(v1, style) }
        : { challenge: false }
      : null,
    verdict: winnerOf(round.goal, v0, v1),
    theirs: null,
  };
}

