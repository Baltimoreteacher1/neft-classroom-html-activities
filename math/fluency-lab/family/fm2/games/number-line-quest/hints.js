// Hints for Number Line Quest. Tiers 0 to 2 are written to help without naming the answer, and a guard replaces any hint
// that would still print it (as a standalone number or word) with an answer-free one; tier 3 states the solution.
// @fm2 FM-062 FM-012
import { cmp, div, frac, sub } from "../../rational.js";
import { fmt, L } from "../../lang.js";
import { HINTS, SAFE } from "./copy-hints.js";
import { WORD } from "./copy.js";
import { answerText, planText, zoomPath } from "./answer.js";
import { placesOf, showNum } from "./format.js";
import { absF, floorOf, targetOf } from "./geometry.js";

const S = (en, es) => ({ en, es });
const pair = (value) => (typeof value === "object" ? value : S(String(value), String(value)));

function wholeNote(round) {
  const t = targetOf(round);
  const below = round.line.labels.filter((v) => cmp(v, t) <= 0).at(-1) ?? round.line.min;
  const gap = sub(t, below);
  const base = showNum(below, "int");
  return gap.n === 0
    ? S("It sits right on the labelled mark.", "Está justo en una marca con número.")
    : S(
        `It is ${showNum(gap, "int")} past the labelled mark ${base}.`,
        `Está ${showNum(gap, "int")} después de la marca ${base}.`,
      );
}

function decimalNote(round) {
  const t = targetOf(round);
  const w = floorOf(t);
  const rest = sub(t, frac(w));
  const tenths = floorOf(div(rest, frac(1, 10)));
  const hundredths = floorOf(div(sub(rest, frac(tenths, 10)), frac(1, 100)));
  const lead = w > 0 ? S(`Start at ${w}. `, `Empieza en ${w}. `) : S("", "");
  const more =
    hundredths > 0
      ? S(`, then ${hundredths} more hundredths`, ` y luego ${hundredths} centésimas más`)
      : S("", "");
  return S(
    `${lead.en}Count ${tenths} tenths${more.en}.`,
    `${lead.es}Cuenta ${tenths} décimas${more.es}.`,
  );
}

function rootBetween(round) {
  const { index, lo, hi, perfect, loPow, hiPow } = round.detail;
  const p = index === 3 ? "³" : "²";
  return perfect
    ? S(`is exactly ${lo}`, `es exactamente ${lo}`)
    : S(
        `is between ${lo} and ${hi}, because ${lo}${p} is ${loPow} and ${hi}${p} is ${hiPow}`,
        `está entre ${lo} y ${hi}, porque ${lo}${p} es ${loPow} y ${hi}${p} es ${hiPow}`,
      );
}

function zoomChain(round) {
  const windows = zoomPath(round).map((low, i) => [showNum(low, "dec", i + 1), showNum(sub(low, frac(-1, 10 ** (i + 1))), "dec", i + 1)]);
  return S(windows.map(([a, b]) => `${a} to ${b}`).join(", then "), windows.map(([a, b]) => `${a} a ${b}`).join(" y luego "));
}

const dirWord = (right) => (right ? S("right", "derecha") : S("left", "izquierda"));
const sideWord = (right) => (right ? WORD.rightSide : WORD.leftSide);

function vars(round) {
  const d = round.detail;
  const ans = answerText(round);
  const base = {
    ans,
    v: round.valueText || ans,
    plan: round.kind === "hop" ? planText(round) : "",
  };
  switch (round.family) {
    case "next":
      return {
        ...base,
        s: d.s,
        hops: d.d === 1 ? S("1 hop", "1 salto") : S(`${d.d} hops`, `${d.d} saltos`),
        dir: d.up ? S("to the right", "a la derecha") : S("to the left", "a la izquierda"),
      };
    case "whole":
    case "count":
      return { ...base, note: wholeNote(round) };
    case "parity":
      return { ...base, s: d.s, kind: WORD[d.kind], where: d.after ? WORD.after : WORD.before };
    case "fraction":
      return { ...base, a: d.a };
    case "equiv":
      return { ...base, per: d.per, parts: d.a * d.per };
    case "mixed":
      return { ...base, w: d.w, a: d.a };
    case "decimal":
      return { ...base, note: decimalNote(round) };
    case "signed":
      return {
        ...base,
        dist: showNum(absF(targetOf(round)), round.mode, placesOf(round.line.step)),
        side: d.negative ? WORD.leftSide : WORD.rightSide,
      };
    case "opposite":
      return { ...base, dist: round.valueText.replace(/^−/, "") };
    case "absolute":
      return { ...base, d: round.valueText, side: sideWord(!d.negative) };
    case "hopplace":
      return { ...base, s: d.s, size: d.size, dir: dirWord(d.right) };
    case "distance":
      return { ...base, b: d.b, d: d.d, side: sideWord(d.right) };
    case "root":
      return { ...base, between: rootBetween(round) };
    case "hop-skip":
      return { ...base, k: d.k, m: d.m };
    case "round": {
      const before = cmp(sub(round.value, round.lo), sub(round.hi, round.value)) < 0;
      return {
        ...base,
        v: showNum(round.value, round.mode, placesOf(round.line.step)),
        half: before ? S("before", "antes") : S("past", "después"),
      };
    }
    case "zoom":
      return { ...base, chain: zoomChain(round) };
    default:
      return base;
  }
}

const esc = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// The answer standing alone: not inside a longer number, fraction or decimal.
export const leaks = (text, answer) =>
  new RegExp(`(?<![\\d.,/])${esc(answer)}(?![\\d/]|[.,]\\d)`).test(text);

export function hint(round, tier) {
  const t = Math.min(3, Math.max(0, Math.trunc(Number(tier)) || 0));
  const family =
    round.family === "order"
      ? round.detail.decimals
        ? "order-dec"
        : "order-signed"
      : round.family;
  const copy = HINTS[family][t];
  const filled = vars(round);
  const out = {};
  for (const lang of ["en", "es"])
    out[lang] = fmt(
      copy[lang],
      Object.fromEntries(Object.entries(filled).map(([k, v]) => [k, L(pair(v), lang)])),
    );
  const answer = answerText(round);
  if (t < 3 && (leaks(out.en, answer) || leaks(out.es, answer))) return SAFE[t];
  return out;
}

