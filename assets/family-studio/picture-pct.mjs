// "Picture it" recognizers for percent stems the bare percent bar (picture-arith.mjs) cannot read: a part of a whole
// written as a percent ("Write 3/5 as a percent", "8 of the 25 students walk"), and percent stories that hide the
// part or the whole inside a sentence. The percent, part or whole the problem asks for is never drawn.

import { percent } from "./picture-arith.mjs";
import { NUM, PAD, S, W, bracket, clampX, count, line, num, qPill, rect, show, text, textW, tr } from "./picture-kit.mjs";

const PCT_NO = /which|compare|sort|match|estimate|round|explain|student (?:says|claims|thinks|writes|solves)|says|both|team [A-Z]\b|score [A-Z]\b|class [A-Z]\b|higher|greater|benchmark|decimal|fraction and|then|and what/i;

/** Every number token in the stem (fractions count as one). */
const nums = (s) => [...s.matchAll(new RegExp(String.raw`(?<![\w.,/])(?:\d+/\d+|${NUM})(?![\w/]|[.,]\d)`, "g"))].map((m) => m[0]);

// ---------------------------------------------------------------- what percent is the part of the whole?

function readPart(s) {
  let m = s.match(/^(?:write|convert|change|rename) (\d+)\/(\d+) (?:as|to|into) a percent\.?$/i);
  if (m) return { part: m[1], whole: m[2], fraction: true };
  m = s.match(/^(?:a |an |the )?[a-z ]*?(\d+)\/(\d+) (?:of (?:a|an|the) [a-z]+|complete)[^.?]*[.?] ?what percent[^.?]*\?$/i);
  if (m && nums(s).length === 1) return { part: m[1], whole: m[2], fraction: true };
  if (!/what percent|as a percent|to a percent/i.test(s) || nums(s).length !== 2) return null;
  m = s.match(/(\d+) out of (?:every )?(\d+)\b/i);
  if (m) return { part: m[1], whole: m[2] };
  m = s.match(/\bhas (\d+) ([a-z]+) and (\d+) of them\b/i);
  if (m) return { part: m[3], whole: m[1] };
  m = s.match(/\bgoal is (\d+) ([a-z]+)\. [A-Z][a-z]+ (?:collects?|reads?|earns?|scores?|makes?|sells?) (\d+) \2\b/);
  if (m) return { part: m[3], whole: m[1] };
  m = s.match(/(\d+) (GB|pages|minutes|students) (?:phone )?with (\d+) \2 used/i) || s.match(/\ba (\d+) (GB) phone with (\d+) \2 used/i);
  if (m) return { part: m[3], whole: m[1] };
  return null;
}

const percentOf = {
  kind: "percent-of",
  match(s) {
    if (PCT_NO.test(s) || /%|\d\.\d/.test(s)) return null;
    const r = readPart(s);
    if (!r) return null;
    const a = num(r.part);
    const b = num(r.whole);
    if (!(a > 0 && b > 1) || b === 100 || b > 1000) return null;
    const p = (100 * a) / b;
    if (p > 300 || (r.fraction && a > b)) return null;
    return { ...r, p };
  },
  draw({ part, whole, fraction, p }, lang) {
    const top = Math.max(100, Math.ceil(p / 50) * 50);
    const x0 = PAD + 12;
    const bw = W - 2 * PAD - 24;
    const X = (v) => x0 + (bw * v) / top;
    const y = 82;
    const bh = 34;
    const out = [rect(x0, y, X(100) - x0, bh, "fp-g", 2)];
    const d = num(whole);
    if (fraction && d <= 20) for (let i = 1; i < d; i++) out.push(line(X((100 * i) / d), y, X((100 * i) / d), y + bh, "fp-gr"));
    out.push(S(2, rect(x0, y, X(p) - x0, bh, "fp-p", 2)));
    // Top labels: the whole at 100%, the part at its tick; bottom: 0%, 100% and the unknown percent.
    const near = Math.abs(X(p) - X(100)) < 56;
    out.push(line(x0, y - 8, x0, y + bh + 8, "fp-ln"), line(X(100), y - 8, X(100), y + bh + 8, "fp-ln"));
    out.push(text(x0, y + bh + 26, "0%", { cls: "fp-t fp-ta fp-n" }), text(clampX(X(100), 40), y + bh + 26, "100%", { cls: "fp-t fp-ta fp-n" }));
    if (fraction) out.push(S(2, bracket(x0, X(p), y - 8, -1), text(clampX((x0 + X(p)) / 2, 50), y - 20, `${part}/${whole}`, { cls: "fp-t fp-n" })));
    else {
      out.push(text(x0, y - 16, "0", { cls: "fp-t fp-n" }), S(2, text(clampX(X(100), textW(whole, 15)), y - 16 - (near ? 22 : 0), show(whole), { cls: "fp-t fp-n" })));
      if (Math.abs(p - 100) > 1e-9) out.push(S(2, line(X(p), y - 8, X(p), y + bh + 8, "fp-ln"), text(clampX(X(p), textW(part, 15)), y - 16, show(part), { cls: "fp-t fp-n" })));
    }
    out.push(S(3, line(X(p), y + bh, X(p), y + bh + 10, "fp-ln"), qPill(clampX(X(p), 40), y + bh + (near ? 56 : 30))));
    const cap = fraction
      ? { en: `${part}/${whole} of a bar that stands for 100%; the percent is unknown`, es: `${part}/${whole} de una barra que representa el 100%; el porcentaje es la incógnita` }
      : { en: `${show(part)} out of ${show(whole)}, with ${show(whole)} as 100%; the percent for ${show(part)} is unknown`, es: `${show(part)} de ${show(whole)}, con ${show(whole)} como el 100%; el porcentaje de ${show(part)} es la incógnita` };
    return {
      title: { en: "Percent bar", es: "Barra de porcentaje" },
      caption: cap,
      desc: { en: `${cap.en}. The whole bar is 100%.`, es: `${cap.es}. Toda la barra es el 100%.` },
      h: y + bh + (near ? 56 : 30) + 24,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- percent stories (part or whole hidden in a sentence)

const STORY_NO = /\bwhich\b(?! (?:is|was) \d)|compare|sort|match|estimate|about|round|explain|student (?:says|claims|thinks)|says|off\b|discount|sale price|increase|decrease|more\b|less\b|left|rest|total cost|after|then|both|new price|final/i;
const PC = String.raw`\d+(?:\.\d+)?`;
const OWNER = String.raw`(?:the|her|his|its|their|my|your|a|an) [a-z-]+(?: [a-z-]+)?`;

const percentStory = {
  kind: "percent",
  match(s) {
    if (STORY_NO.test(s) || count(s, /%/g) !== 1 || nums(s).length !== 2) return null;
    const v = nums(s).find((t) => !s.includes(`${t}%`));
    if (!v || v.includes("/")) return null;
    const money = s.includes(`$${v}`);
    // Whole unknown: "<part> ... is 35% of her team's points" / "which is 45% of its first price".
    let m = s.match(new RegExp(String.raw`(?:,? (?:which|that) (?:is|was)|\. (?:That|This|It) (?:is|was)|\b(?:is|was|are|were)) (${PC})% of (?:${OWNER}|[a-z]+'s [a-z]+(?: [a-z]+)?)`));
    if (m && /\bwhat (?:was|is|were) the\b|\bhow many [a-z]+ (?:are|were|is|did) (?:in )?(?:the )?(?:whole|team|group|class|total|bill)|\bfind the\b/i.test(s) && s.indexOf(v) < m.index) {
      return { p: +m[1], part: v, whole: null, money };
    }
    // Part unknown: "A game has 120 points. A player earns 35% of the points. How many points is that?"
    m = s.match(new RegExp(String.raw`\b(?:earns?|gets?|got|scores?|scored|answers?|answered|wins?|won|uses?|used|reads?|read) (${PC})% of (?:the|them|those|its|her|his) ?([a-z]*)`));
    if (m && /\bhow (?:many|much)\b/i.test(s.slice(m.index)) && s.indexOf(v) < m.index) {
      const noun = m[2];
      if (noun && !new RegExp(String.raw`${v.replace(/[.$]/g, "\\$&")} ${noun.slice(0, 4)}`).test(s)) return null;
      return { p: +m[1], part: null, whole: v, money };
    }
    return null;
  },
  draw: percent.draw,
};

// ---------------------------------------------------------------- the discount, tax, savings or bonus itself

const PART_ASK = /how much is the discount\?|how many dollars is the tax\?|how many [a-z]+ do you save\?|how many bonus points is that\?/i;

const percentPart = {
  kind: "percent",
  match(s) {
    if (!PART_ASK.test(s) || /price|total|after|final|new|which|estimate|about|round/i.test(s.replace(PART_ASK, "")) || count(s, /%/g) !== 1) return null;
    const ns = nums(s).filter((t) => !s.includes(`${t}%`));
    const pm = s.match(/(\d+(?:\.\d+)?)% (?:off|more)\b|tax is (\d+(?:\.\d+)?)%/);
    if (ns.length !== 1 || !pm || nums(s).length !== 2) return null;
    return { p: +(pm[1] ?? pm[2]), part: null, whole: ns[0], money: s.includes(`$${ns[0]}`) };
  },
  draw: percent.draw,
};

export const PCT = [percentOf, percentStory, percentPart];
