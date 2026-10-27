// Hints for a duel hand. Tier 0 nudges, tier 1 names the strategy for this kind of hand, tier 2 works a DIFFERENT hand
// (a parallel example chosen so it never contains this hand's answer), tier 3 is the full play. @fm2 FM-016 FM-062
import { fmt, L } from "../../lang.js";
import { cmp, parse } from "../../rational.js";
import { goalSentence } from "./copy.js";
import * as H from "./copy-hints.js";
import {
  distOf,
  emptySeat,
  fills,
  fmtValue,
  referenceDuel,
  seatValue,
  winnerOf,
} from "./engine.js";
import { answerText } from "./logic.js";
import { fillLayout, KINDS } from "./templates.js";

const both = (build) => ({ en: build("en"), es: build("es") });
const SIGNED = new Set(["sum2", "sum3", "sum4", "prod2"]);

// Practice hands, three per template. Each lists the cards one seat could use and a target for "closest" goals.
const e = (num, target, extra = {}) => ({ num, target, ...extra });
const EX = {
  single: [e(["4", "9", "6"], "7"), e(["5", "8", "3"], "6"), e(["2", "7", "12"], "8")],
  sum2: [
    e(["3", "5", "8", "9"], "12"),
    e(["2", "6", "7", "9"], "14"),
    e(["4", "5", "7", "11"], "15"),
  ],
  sum3: [
    e(["2", "4", "7", "8"], "15"),
    e(["3", "5", "6", "9"], "16"),
    e(["1", "5", "8", "9"], "17"),
  ],
  sum4: [
    e(["1", "3", "6", "8", "9"], "20"),
    e(["2", "4", "5", "7", "9"], "18"),
    e(["3", "4", "6", "8", "10"], "25"),
  ],
  "sum3-neg": [
    e(["−4", "3", "−2", "5"], "0"),
    e(["−6", "2", "−1", "4"], "0"),
    e(["−3", "5", "−5", "1"], "0"),
  ],
  "sum4-neg": [
    e(["−5", "4", "−2", "3", "−3"], "0"),
    e(["−6", "2", "−4", "5", "1"], "0"),
    e(["−2", "6", "−3", "1", "−5"], "0"),
  ],
  num2: [
    e(["3", "7", "5", "9"], "60"),
    e(["2", "8", "4", "6"], "50"),
    e(["1", "5", "7", "9"], "70"),
  ],
  num3: [
    e(["2", "6", "4", "8"], "500"),
    e(["3", "5", "7", "9"], "400"),
    e(["1", "4", "6", "9"], "600"),
  ],
  num4: [
    e(["3", "8", "1", "6", "2"], "5000"),
    e(["2", "5", "7", "9", "4"], "6000"),
    e(["4", "6", "1", "8", "3"], "4000"),
  ],
  dsum2: [
    e(["2", "4", "6", "8", "7"], "100"),
    e(["1", "3", "5", "9", "6"], "90"),
    e(["3", "4", "7", "8", "2"], "110"),
  ],
  ddiff2: [
    e(["1", "3", "7", "9", "5"], "30"),
    e(["2", "4", "6", "8", "3"], "40"),
    e(["1", "2", "8", "9", "4"], "50"),
  ],
  prod2: [
    e(["3", "6", "7", "9"], "40"),
    e(["2", "5", "8", "9"], "30"),
    e(["4", "5", "6", "7"], "35"),
  ],
  "prod2-neg": [
    e(["−3", "4", "−5", "2"], "0"),
    e(["−2", "6", "−4", "3"], "0"),
    e(["−6", "2", "−3", "5"], "0"),
  ],
  prodsum: [
    e(["2", "5", "6", "8"], "30"),
    e(["3", "4", "7", "9"], "40"),
    e(["2", "4", "6", "9"], "35"),
  ],
  paren: [
    e(["2", "3", "5", "6"], "25"),
    e(["1", "4", "5", "7"], "30"),
    e(["2", "4", "6", "8"], "35"),
  ],
  ops3: [
    e(["2", "3", "5", "6"], "20", { op: ["+", "×", "+"] }),
    e(["1", "4", "5", "6"], "24", { op: ["×", "+", "+"] }),
    e(["3", "4", "5", "7"], "30", { op: ["+", "+", "×"] }),
  ],
  frac2: [
    e(["2", "3", "7", "9"], "1/2"),
    e(["1", "4", "6", "8"], "1/3"),
    e(["2", "5", "8", "9"], "2/3"),
  ],
  fracdiv: [
    e(["1", "2", "3", "4", "5", "6"], "1"),
    e(["2", "3", "4", "5", "7", "8"], "1"),
    e(["1", "3", "4", "6", "7", "9"], "1"),
  ],
  pct: [
    e(["10", "25", "40", "80"], "20"),
    e(["20", "50", "60", "90"], "25"),
    e(["15", "30", "40", "70"], "18"),
  ],
  pow: [
    e(["2", "3", "5"], "20", { exp: ["2", "3", "4"] }),
    e(["2", "4", "6"], "30", { exp: ["1", "2", "3"] }),
    e(["3", "4", "5"], "40", { exp: ["1", "2", "3"] }),
  ],
  powsum: [
    e(["2", "3", "4"], "20", { exp: ["1", "2", "3"] }),
    e(["2", "3", "5"], "30", { exp: ["1", "2", "3"] }),
    e(["3", "4", "5"], "40", { exp: ["1", "2", "3"] }),
  ],
  sci: [
    e(["2", "5", "8"], "4000", { exp: ["2", "3", "5"] }),
    e(["3", "4", "6"], "5000", { exp: ["2", "4", "6"] }),
    e(["1", "7", "9"], "300", { exp: ["1", "3", "4"] }),
  ],
  root2: [
    e(["9", "16", "36", "49"], "10"),
    e(["4", "25", "64", "81"], "10"),
    e(["16", "25", "49", "100"], "10"),
  ],
  root3: [
    e(["4", "9", "16", "25"], "12"),
    e(["9", "16", "36", "64"], "12"),
    e(["4", "25", "49", "81"], "12"),
  ],
};

export const leaks = (text, answer) =>
  new RegExp(
    `(?<![\\d./])${String(answer).replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}(?![\\d./])`,
  ).test(text);

// Solve a practice hand for one seat with the same engine, and describe it.
function workExample(round, ex, lang) {
  const cards = [];
  for (const kind of KINDS) {
    for (const text of ex[kind] || []) {
      cards.push(
        kind === "op"
          ? { id: cards.length, kind, op: text, text }
          : { id: cards.length, kind, text, v: parse(text) },
      );
    }
  }
  const target = parse(ex.target);
  const mini = {
    tpl: round.tpl,
    noun: round.noun,
    cards,
    goal: { type: round.goal.type, target },
    targetText: ex.target.replace("-", "−"),
  };
  let best = null;
  for (const full of fills(
    mini,
    emptySeat(mini),
    cards.map((c) => c.id),
  )) {
    const d = distOf(mini.goal, seatValue(mini, full));
    if (!best || cmp(d, best.d) < 0) best = { full, d };
  }
  return {
    cards: cards.map((c) => c.text).join(", "),
    goal: goalSentence(mini, lang),
    expr: fillLayout(
      round.tpl,
      best.full.map((id) => cards[id].text),
      lang,
    ),
    value: fmtValue(seatValue(mini, best.full), "int"),
  };
}

function tier2(round, answer) {
  const signed = round.cards.some((c) => c.v && c.v.n < 0);
  const key = signed && EX[`${round.tpl}-neg`] ? `${round.tpl}-neg` : round.tpl;
  for (const ex of EX[key] || []) {
    const en = fmt(L(H.T2, "en"), workExample(round, ex, "en"));
    if (!leaks(en, answer)) return both((lang) => fmt(L(H.T2, lang), workExample(round, ex, lang)));
  }
  return H.T2_PLAIN;
}

export function strategyKey(round) {
  const signed = round.cards.some((c) => c.v && c.v.n < 0);
  return `${round.tpl}-${round.goal.type}${signed && SIGNED.has(round.tpl) ? "-neg" : ""}`;
}

function tier3(round) {
  const { state } = referenceDuel(round);
  const texts = (seat) =>
    fillLayout(
      round.tpl,
      state.seats[seat].map((id) => round.cards[id].text),
      "en",
    );
  const textsEs = (seat) =>
    fillLayout(
      round.tpl,
      state.seats[seat].map((id) => round.cards[id].text),
      "es",
    );
  const [v0, v1] = [seatValue(round, state.seats[0]), seatValue(round, state.seats[1])];
  const outcome = H.OUTCOME[winnerOf(round.goal, v0, v1)];
  const vars = (lang) => ({
    e0: lang === "en" ? texts(0) : textsEs(0),
    e1: lang === "en" ? texts(1) : textsEs(1),
    v0: fmtValue(v0, round.style),
    v1: fmtValue(v1, round.style),
    outcome: L(outcome, lang),
  });
  return both((lang) => fmt(L(H.T3, lang), vars(lang)));
}

export function hint(round, tier) {
  if (tier <= 0)
    return both(
      (lang) =>
        `${L(H.T0[round.goal.type], lang)} ${L(round.variant === "private" ? H.T0_PRIVATE : H.T0_OPEN, lang)}`,
    );
  if (tier === 1) return H.T1[strategyKey(round)] || H.T1_GENERIC[round.goal.type];
  if (tier === 2) return tier2(round, answerText(round));
  return tier3(round);
}
