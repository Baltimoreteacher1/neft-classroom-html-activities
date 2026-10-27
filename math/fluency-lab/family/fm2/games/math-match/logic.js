// Pure logic for Math Match: deterministic boards, the exact-value equivalence that defines a match, the scoring of a
// finished board, mismatch classification (so feedback can name the mix-up) and hints. @fm2 FM-008 FM-019 FM-032 FM-033 FM-065
import { eq, neg, toString } from "../../rational.js";
import { makeRng, seedFrom, shuffle } from "../../rng.js";
import { fmt } from "../../lang.js";
import * as copy from "./copy.js";
import { repLabel, repValue, valueKey } from "./reps.js";
import { wordsEn, wordsEs } from "./words.js";
import { LOWER } from "./skills-lower.js";
import { UPPER } from "./skills-upper.js";

export const SKILL_SPECS = [...LOWER, ...UPPER];
export const specOf = (skillId) => {
  const spec = SKILL_SPECS.find((s) => s.id === skillId);
  if (!spec) throw new RangeError(`Unknown Math Match skill ${skillId}`);
  return spec;
};

// Boards by level: 3 pairs (6 cards), 4 pairs (8 cards), then 12 cards as triples when the skill has three kinds.
export const setsFor = (level, setSize) => (level === 1 ? 3 : level === 2 ? 4 : 12 / setSize);

// ---- how two values relate: the mix-up a learner most likely made ------------------------------------------------
// Cross-multiplication on BigInt, so values of any size compare exactly and nothing can overflow.
const bigAbs = (n) => (n < 0n ? -n : n);
const digitsOf = (value) => String(value.n).split("").sort().join("");
function singleRelation(a, b) {
  const [xn, xd, yn, yd] = [BigInt(a.n), BigInt(a.d), BigInt(b.n), BigInt(b.d)];
  if (xn * yd === yn * xd) return "same";
  if (xn !== 0n && xn * yd === -yn * xd) return "opposite";
  if (xn * yn === xd * yd) return "reciprocal";
  const nonzero = xn !== 0n && yn !== 0n;
  const ratioIs = (p, q) => xn * yd * q === xd * yn * p;
  if (nonzero && (ratioIs(10n, 1n) || ratioIs(100n, 1n) || ratioIs(1n, 10n) || ratioIs(1n, 100n))) return "tenfold";
  if (a.d > 1 && b.d > 1) {
    if (a.n === b.n) return "same-numerator";
    if (a.d === b.d) return "same-denominator";
  }
  if (nonzero) {
    if (a.d === 1 && b.d === 1 && a.n > 0 && b.n > 0 && digitsOf(a) === digitsOf(b)) return "digits";
    if (ratioIs(2n, 1n) || ratioIs(1n, 2n)) return "scale";
  }
  const gap = 4n * bigAbs(xn * yd - yn * xd);
  return gap * xd <= bigAbs(xn) * xd * yd || gap * yd <= bigAbs(yn) * xd * yd ? "close" : "different";
}
function pairRelation(x, y) {
  const [p, q] = x;
  const [r, s] = y;
  if (eq(p, r) && eq(q, s)) return "same";
  if (p.n !== 0 && eq(p, neg(r)) && eq(q, s)) return "sign-first";
  if (eq(p, r)) return "same-first";
  if (eq(q, s)) return "same-second";
  if (eq(p, s) && eq(q, r)) return "swapped";
  return "different";
}
export const relation = (a, b) => (a.length === 1 ? singleRelation(a[0], b[0]) : pairRelation(a, b));

// ---- boards ------------------------------------------------------------------------------------------------------------
function chooseIdeas(spec, level, rng, grade, count, meta, firstKind) {
  const seen = new Set();
  const entries = shuffle(rng, spec.pool(level, grade, rng))
    .map((idea) => ({ idea, value: repValue(spec.make[firstKind](idea, meta)) }))
    .filter((e) => {
      const key = valueKey(e.value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  if (entries.length < count)
    throw new RangeError(`${spec.id} level ${level} has too few distinct ideas`);
  const confusable = (a, b) =>
    (a.idea.fam !== undefined && a.idea.fam === b.idea.fam) ||
    relation(a.value, b.value) !== "different";
  if (level === 2) return entries.slice(0, count).map((e) => e.idea);
  const chosen = [entries[0]];
  const rest = entries.slice(1);
  while (chosen.length < count) {
    const near = rest.filter((c) => chosen.some((x) => confusable(x, c)));
    const apart = rest.filter((c) => chosen.every((x) => !confusable(x, c)));
    const wantNear = level === 3 && near.length && rng() < 0.75;
    const pool = wantNear ? near : level === 1 && apart.length ? apart : rest;
    const next = pool[0];
    chosen.push(next);
    rest.splice(rest.indexOf(next), 1);
  }
  return chosen.map((e) => e.idea);
}

export function makeRound(skillId, level, rng, grade) {
  const spec = specOf(skillId);
  const kinds = shuffle(rng, spec.kinds[level])[0];
  const setSize = kinds.length;
  const sets = setsFor(level, setSize);
  const meta = spec.meta ? spec.meta(rng) : {};
  const ideas = chooseIdeas(spec, level, rng, grade, sets, meta, kinds[0]);
  const cards = shuffle(
    rng,
    ideas.flatMap((idea, set) =>
      kinds.map((kind) => ({ set, kind, rep: spec.make[kind](idea, meta) })),
    ),
  ).map((card, id) => ({ id, ...card }));
  const keys = ideas.map((idea) =>
    spec.keyText
      ? spec.keyText(idea, meta)
      : toString(repValue(spec.make[kinds[0]](idea, meta))[0]),
  );
  return {
    v: 1,
    skillId,
    level,
    grade,
    setSize,
    kinds,
    meta,
    keys,
    cards,
    prompt: copy.prompt(sets, setSize),
  };
}

export const cardValue = (card) => repValue(card.rep);
export const cardKey = (card) => valueKey(cardValue(card));
export const cardLabel = (card, lang) => repLabel(card.rep, lang);
export const answerText = (round) => round.keys.join("; ");

// The ids of every set, in set order. The learner's own answer is matched against equal values, never against `set`.
export function solve(round) {
  return {
    groups: round.keys.map((_, set) => round.cards.filter((c) => c.set === set).map((c) => c.id)),
  };
}

function mistakeFor(round, ids) {
  const cards = ids.map((id) => round.cards[id]);
  for (let i = 0; i < cards.length; i += 1)
    for (let j = i + 1; j < cards.length; j += 1) {
      const kind = relation(cardValue(cards[i]), cardValue(cards[j]));
      if (kind !== "same") return kind;
    }
  return null;
}
const wrong = (mistake) => ({ correct: false, mistake, feedback: copy.FEEDBACK[mistake] });
const validIds = (round, ids) =>
  Array.isArray(ids) &&
  ids.every((id) => Number.isInteger(id) && id >= 0 && id < round.cards.length) &&
  new Set(ids).size === ids.length;

// response: { groups: [[ids], ...], turns?, tried?: [ids] }.
// `tried` is the set of cards that was just turned over and did not match; without it the whole board is scored.
export function check(round, response) {
  if (response?.tried !== undefined) {
    if (!validIds(round, response.tried) || response.tried.length < 2) return wrong("malformed");
    return wrong(mistakeFor(round, response.tried) || "incomplete");
  }
  const groups = response?.groups;
  if (!Array.isArray(groups) || !groups.every((g) => validIds(round, g))) return wrong("malformed");
  const flat = groups.flat();
  if (new Set(flat).size !== flat.length) return wrong("malformed");
  for (const group of groups) {
    const mix = mistakeFor(round, group);
    if (mix) return wrong(mix);
  }
  if (flat.length !== round.cards.length || groups.some((g) => g.length !== round.setSize))
    return wrong("incomplete");
  const text = Number.isInteger(response.turns)
    ? fmt(copy.FEEDBACK_CORRECT.en, { turns: response.turns })
    : copy.FEEDBACK_CORRECT_PLAIN.en;
  const textEs = Number.isInteger(response.turns)
    ? fmt(copy.FEEDBACK_CORRECT.es, { turns: response.turns })
    : copy.FEEDBACK_CORRECT_PLAIN.es;
  return { correct: true, feedback: { en: text, es: textEs } };
}

// ---- hints -----------------------------------------------------------------------------------------------------------------
const numbersIn = (text) => text.match(/\d+(?:\.\d+)?/g) || [];

// A practice set from the same skill whose values and numbers are nowhere on this board.
function practiceSet(round) {
  const spec = specOf(round.skillId);
  const used = new Set(round.keys.flatMap(numbersIn));
  const boardKeys = new Set(round.cards.map(cardKey));
  const rng = makeRng(seedFrom("hint", round.skillId, round.level, round.keys.join("|")));
  const candidates = shuffle(rng, [1, 2, 3].flatMap((level) => spec.pool(level, round.grade, rng)));
  for (const idea of candidates) {
    const reps = round.kinds.map((kind) => spec.make[kind](idea, round.meta));
    if (boardKeys.has(valueKey(repValue(reps[0])))) continue;
    const labels = {
      en: reps.map((r) => repLabel(r, "en")),
      es: reps.map((r) => repLabel(r, "es")),
    };
    const spoken = [...used].filter((n) => /^\d+$/.test(n) && Number(n) < 1000000).flatMap((n) => [wordsEn(Number(n)), wordsEs(Number(n))]);
    const texts = labels.en.concat(labels.es);
    if (texts.some((text) => numbersIn(text).some((n) => used.has(n)) || spoken.some((word) => text.toLowerCase().includes(word))))
      continue;
    return {
      en: labels.en.map((t) => `"${t}"`).join(" = "),
      es: labels.es.map((t) => `"${t}"`).join(" = "),
    };
  }
  return null;
}

export function hint(round, tier) {
  if (tier <= 0) return copy.HINT_NUDGE;
  if (tier === 1) return copy.STRATEGY[round.skillId];
  if (tier === 2) {
    const example = practiceSet(round);
    return example ? copy.hintExample(example) : copy.HINT_NO_EXAMPLE;
  }
  const sets = (lang) =>
    solve(round)
      .groups.map((ids) => ids.map((id) => `"${cardLabel(round.cards[id], lang)}"`).join(" = "))
      .join("; ");
  return copy.hintAnswer({ en: sets("en"), es: sets("es") }, answerText(round));
}
