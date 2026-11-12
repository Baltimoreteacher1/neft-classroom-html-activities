// Power Up! bonus rounds — pure content builders, no DOM.
// Power Crystals: exponent-meaning cards aimed at the "3⁴ = 3 × 4" mistake.
// Glitch Hunter: a worked solution with one broken step (out of order, or a power multiplied).

import {
  allowedOps,
  apply,
  GLYPH,
  operandsAt,
  RANK,
  reduceAt,
  solve,
} from "./expr.js";
import { makeExpression, rng } from "./gen.js";

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
export const sup = (n) => [...String(n)].map((d) => SUP[d]).join("");
const fmt = (n) => n.toLocaleString("en-US");
const power = (b, e) => `${b}${sup(e)}`;
const times = (b, e) => Array(e).fill(b).join(" × ");

function shuffle(r, items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** A card: {prompt, choices, answer (index), why}. The correct choice is always choices[0] before shuffling. */
function card(r, prompt, right, wrongs, why) {
  const choices = shuffle(r, [right, ...wrongs]);
  return { prompt, choices, answer: choices.indexOf(right), why };
}

const TEMPLATES = {
  expand(r, big) {
    const b = 2 + Math.floor(r() * (big ? 8 : 4));
    const e = 3 + Math.floor(r() * 2);
    const third = b <= 6 && b !== e ? times(e, b) : Array(e).fill(b).join(" + ");
    return card(
      r,
      `Which means ${power(b, e)}?`,
      times(b, e),
      [`${b} × ${e}`, third],
      `The exponent ${e} says: use ${b} as a factor ${e} times.`,
    );
  },
  value(r, big) {
    const pairs = big
      ? [
          [2, 5],
          [3, 4],
          [4, 3],
          [10, 3],
          [6, 3],
          [9, 2],
        ]
      : [
          [2, 3],
          [3, 3],
          [4, 2],
          [5, 2],
          [2, 4],
          [6, 2],
        ];
    const [b, e] = pairs[Math.floor(r() * pairs.length)];
    const right = b ** e;
    const wrongs = [b * e, e ** b === right ? right + b : e ** b];
    if (wrongs[0] === right) wrongs[0] = right + 1;
    return card(
      r,
      `What is ${power(b, e)}?`,
      fmt(right),
      wrongs.map(fmt),
      `${power(b, e)} = ${times(b, e)} = ${fmt(right)}.`,
    );
  },
  compare(r) {
    const pairs = [
      [2, 5],
      [3, 4],
      [2, 3],
      [3, 5],
    ];
    const [a, b] = pairs[Math.floor(r() * pairs.length)];
    const bigger = a ** b > b ** a ? power(a, b) : power(b, a);
    const smaller = bigger === power(a, b) ? power(b, a) : power(a, b);
    return card(
      r,
      `Which is greater: ${power(a, b)} or ${power(b, a)}?`,
      bigger,
      [smaller],
      `${power(a, b)} = ${fmt(a ** b)} and ${power(b, a)} = ${fmt(b ** a)}. Swapping base and exponent changes the value.`,
    );
  },
  first(r, big, level, seed) {
    const e = makeExpression(level, big ? { ops: 4, pow: [1, 2], paren: [1, 1] } : { ops: 3, pow: [1, 1], paren: [0, 1] }, seed);
    const t = e.tokens;
    const ok = allowedOps(t)[0];
    const label = (i) => {
      const { a, o, b } = operandsAt(t, i);
      return o === "^" ? power(a, b) : `${fmt(a)} ${GLYPH[o]} ${fmt(b)}`;
    };
    const others = t
      .map((x, i) => i)
      .filter((i) => t[i].k === "o" && i !== ok && t[i - 1].k === "n" && t[i + 1].k === "n")
      .map(label);
    const wrongs = [...new Set(others)].filter((w) => w !== label(ok)).slice(0, 2);
    if (!wrongs.length) return null;
    const rank = RULE_FIRST[ruleKey(t, ok)];
    return card(r, `In ${pretty(t)}, which step do you do first?`, label(ok), wrongs, rank);
  },
};

const RULE_FIRST = {
  paren: "Parentheses come first.",
  3: "Exponents come before multiplying, dividing, adding and subtracting.",
  2: "Multiply and divide come before add and subtract, left to right.",
  1: "Only adding and subtracting left, so go left to right.",
};
const RULE_SKIPPED = {
  paren: "The work inside the parentheses had to come first.",
  3: "The exponent had to come first.",
  2: "Multiplying and dividing had to come first, left to right.",
  1: "Adding and subtracting go left to right.",
};
/** Which rule decides the next step of t. */
const ruleKey = (t, ok) => (t.some((x) => x.k === "(") ? "paren" : RANK[t[ok].v]);

/** Expression text with real superscripts, for prompts. */
export function pretty(t) {
  let out = "";
  for (let i = 0; i < t.length; i++) {
    const x = t[i];
    if (x.k === "o" && x.v === "^") {
      out += sup(t[++i].v);
    } else out += x.k === "n" ? fmt(x.v) : x.k === "o" ? ` ${GLYPH[x.v]} ` : x.k;
  }
  return out;
}

/** Three Power Crystal cards, each from a different template. */
export function crystalCards(level, seed) {
  const r = rng(seed * 31 + 7);
  const big = level === "challenging";
  const order = shuffle(r, ["expand", "value", "compare", "first"]);
  const cards = [];
  for (const name of order) {
    const c = TEMPLATES[name](r, big, level, seed);
    if (c) cards.push(c);
    if (cards.length === 3) break;
  }
  return cards;
}

/** Solve to the end from a state; returns the list of states after each step, or null. */
function finish(t) {
  const states = [];
  let cur = t;
  while (cur.some((x) => x.k === "o")) {
    const i = allowedOps(cur)[0];
    const { a, o, b } = operandsAt(cur, i);
    const v = apply(o, a, b);
    if (v === null || v > 99999) return null;
    cur = reduceAt(cur, i, v);
    states.push(cur);
  }
  return states;
}

/**
 * A worked solution with one glitched line.
 * Returns {lines (expression text per line, line 0 = the problem), wrong (index of the first bad line), kind, why}.
 */
export function glitchPuzzle(level, seed) {
  const r = rng(seed * 131 + 17);
  for (let attempt = 0; attempt < 400; attempt++) {
    const e = makeExpression(level, level === "regular" ? { ops: 4, pow: [1, 2], paren: [0, 1] } : { ops: 5, pow: [1, 2], paren: [1, 2] }, seed + attempt * 977);
    const truth = solve(e.tokens);
    const j = Math.floor(r() * Math.max(1, e.steps.length - 1));
    let state = e.tokens;
    for (let k = 0; k < j; k++) state = reduceAt(state, allowedOps(state)[0], e.steps[k].v);
    const ok = allowedOps(state);
    const kinds = shuffle(r, ["order", "power"]);
    for (const kind of kinds) {
      let bad = null;
      let why = "";
      if (kind === "power") {
        const i = ok.find((x) => state[x].v === "^");
        if (i === undefined) continue;
        const { a, b } = operandsAt(state, i);
        if (a * b === a ** b) continue;
        bad = reduceAt(state, i, a * b);
        why = `${power(a, b)} was worked out as ${a} × ${b} = ${fmt(a * b)}. It means ${times(a, b)} = ${fmt(a ** b)}.`;
      } else {
        const wrongOps = state
          .map((x, i) => i)
          .filter(
            (i) =>
            state[i].k === "o" &&
            !ok.includes(i) &&
            state[i - 1].k === "n" &&
            state[i + 1].k === "n" &&
            state[i + 2]?.v !== "^" &&
            state[i - 2]?.v !== "^",
          );
        if (!wrongOps.length) continue;
        const i = wrongOps[Math.floor(r() * wrongOps.length)];
        const { a, o, b } = operandsAt(state, i);
        const v = apply(o, a, b);
        if (v === null) continue;
        bad = reduceAt(state, i, v);
        why = `That line did ${fmt(a)} ${GLYPH[o]} ${fmt(b)} too early. ${RULE_SKIPPED[ruleKey(state, ok[0])]}`;
      }
      const rest = finish(bad);
      if (!rest) continue;
      const final = rest.length ? rest[rest.length - 1] : bad;
      if (final.length !== 1 || final[0].v === truth.final) continue;
      const before = [e.tokens];
      let s = e.tokens;
      for (let k = 0; k < j; k++) {
        s = reduceAt(s, allowedOps(s)[0], e.steps[k].v);
        before.push(s);
      }
      const lines = [...before, bad, ...rest].map(pretty);
      return { lines, wrong: j + 1, kind, why, answer: truth.final };
    }
  }
  throw new Error("no glitch puzzle");
}

