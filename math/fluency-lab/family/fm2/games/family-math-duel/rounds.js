// Dealing a duel hand: a pure function of (skill, level, seeded rng, grade). The round is plain JSON; Orbit's choices and
// slips are fixed here so the same seed replays the same duel. @fm2 FM-016 FM-061 FM-065
import { chance, int, pick, sample, shuffle } from "../../rng.js";
import { add, cmp, div, frac, neg, parse, sub } from "../../rational.js";
import { promptText } from "./copy.js";
import { emptySeat, fills, fmtValue, seatValue } from "./engine.js";
import { levelSpec } from "./specs.js";
import { KINDS, kindCount, slotCount, TEMPLATES } from "./templates.js";

const MINUS = "−";
const RIGHTS = [
  { challenge: false, theirs: false },
  { challenge: true, theirs: false },
  { challenge: true, theirs: true },
];
const SLIPS = { int: ["1", "2", "10"], dec: ["0.1", "0.5", "1"], frac: ["1/4", "1/2", "1"] };
const dedupe = (list) => [...new Set(list)];

// n card texts from a spec list; `groups` splits the deal evenly across several lists.
function dealTexts(rng, list, n, isOp) {
  if (!Array.isArray(list) && list?.groups) {
    const parts = list.groups.map(
      (_, i) => Math.floor(n / list.groups.length) + (i < n % list.groups.length ? 1 : 0),
    );
    return list.groups.flatMap((group, i) => sample(rng, dedupe(group), parts[i]));
  }
  const unique = isOp ? list : dedupe(list);
  if (!isOp && unique.length >= n) return sample(rng, unique, n);
  const bag = [];
  while (bag.length < n) bag.push(...shuffle(rng, unique));
  return bag.slice(0, n);
}

function makeCard(id, kind, text) {
  if (kind === "op") return { id, kind, op: text, text };
  const shown = text.replaceAll("-", MINUS);
  const v = parse(shown);
  return { id, kind, text: shown, v: { n: v.n, d: v.d } };
}

// Smallest and largest value one seat could build from every card on the table.
function reachable(round) {
  let lo = null;
  let hi = null;
  const all = round.cards.map((c) => c.id);
  for (const full of fills(round, emptySeat(round), all)) {
    const v = seatValue(round, full);
    if (lo === null || cmp(v, lo) < 0) lo = v;
    if (hi === null || cmp(v, hi) > 0) hi = v;
  }
  return { lo, hi };
}

const absQ = (q) => frac(Math.abs(q.n), q.d);

// A target inside the range of values the cards can make; null when none is (the caller deals again).
function pickTarget(rng, round, targets, lastTry) {
  const { lo, hi } = reachable(round);
  const list = targets.map((t) => parse(t));
  const inside = list.filter((t) => cmp(t, lo) >= 0 && cmp(t, hi) <= 0);
  if (inside.length) return pick(rng, inside);
  if (!lastTry) return null;
  const mid = div(add(lo, hi), frac(2));
  return list.reduce((best, t) => (cmp(absQ(sub(t, mid)), absQ(sub(best, mid))) < 0 ? t : best), list[0]);
}

// The card Fair play locks into the caregiver's expression: the least helpful number card for the goal.
function weakCard(round, ids) {
  const nums = ids.filter((id) => round.cards[id].kind === "num");
  const val = (id) => frac(round.cards[id].v.n, round.cards[id].v.d);
  const mean = div(nums.map(val).reduce(add), frac(nums.length));
  // Lower is weaker: the least value for "max", the greatest for "min", the farthest from the middle for "closest".
  const merit = (id) => (round.goal.type === "max" ? val(id) : round.goal.type === "min" ? neg(val(id)) : neg(absQ(sub(val(id), mean))));
  return nums.reduce((best, id) => (cmp(merit(id), merit(best)) < 0 ? id : best), nums[0]);
}

export function makeRound(skillId, level, rng, grade) {
  const spec = levelSpec(skillId, level, grade);
  const tpl = TEMPLATES[spec.tpl];
  const lvl = Math.min(Math.max(level, 1), 3);
  let cards;
  let round;
  for (let attempt = 0; attempt < 40; attempt += 1) {
  cards = [];
  for (const kind of KINDS) {
    const perSeat = kindCount(spec.tpl, kind) + (kind === "num" ? spec.extra : 0);
    if (!perSeat) continue;
    const texts = dealTexts(rng, spec[kind], perSeat * 2, kind === "op");
    for (const text of shuffle(rng, texts)) cards.push(makeCard(cards.length, kind, text));
  }
  round = {
    skillId,
    level: lvl,
    grade,
    tpl: spec.tpl,
    noun: tpl.noun,
    style: spec.style,
    pips: Boolean(spec.pips),
    goal: { type: spec.goal, target: null },
    targetText: "",
    cards,
    variant: chance(rng, 0.4) ? "private" : "open",
    pool: cards.map((c) => c.id),
    deal: null,
    first: chance(rng, 0.5) ? 0 : 1,
    fair: null,
    rights: RIGHTS[lvl - 1],
    negatives: grade >= 6 || cards.some((c) => c.v && c.v.n < 0),
    orbit: { lax: Array(slotCount(spec.tpl)).fill(false), slip: null },
  };
  if (spec.goal !== "closest") break;
  const target = pickTarget(rng, round, spec.targets, attempt === 39);
  if (target) {
    round.goal.target = { n: target.n, d: target.d };
    round.targetText = fmtValue(target, spec.style);
    break;
  }
  }
  if (round.variant === "private") {
    const hands = [[], []];
    for (const kind of KINDS) {
      const ids = shuffle(
        rng,
        cards.filter((c) => c.kind === kind).map((c) => c.id),
      );
      const half = ids.length / 2;
      hands[0].push(...ids.slice(0, half));
      hands[1].push(...ids.slice(half));
    }
    round.deal = hands.map((h) => h.sort((a, b) => a - b));
    round.pool = [];
  }
  const lockFrom = round.variant === "private" ? round.deal[1] : round.pool;
  const lockCard = weakCard(round, lockFrom);
  const kinds = tpl.slots;
  round.fair = {
    card: lockCard,
    slot: kinds
      .map((k, i) => (k === round.cards[lockCard].kind ? i : -1))
      .filter((i) => i >= 0)
      .at(-1),
  };
  if (lvl === 1) round.orbit.lax[0] = true;
  else if (lvl === 2 && chance(rng, 0.5))
    round.orbit.lax[int(rng, 0, round.orbit.lax.length - 1)] = true;
  const slipRate = [0, 0.35, 0.5][lvl - 1];
  if (slipRate && chance(rng, slipRate)) {
    const amount = parse(pick(rng, SLIPS[spec.style]));
    round.orbit.slip = { n: amount.n, d: amount.d, plus: chance(rng, 0.5) };
  }
  round.prompt = promptText(round);
  return round;
}

