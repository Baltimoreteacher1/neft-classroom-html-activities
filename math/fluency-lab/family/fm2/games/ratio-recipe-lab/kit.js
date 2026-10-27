// Shared pieces for building and judging a workbench round: quantity wording, columns, the batch a constraint forces,
// and the filters every generated round must pass (size per grade, plausible kitchen amounts, no hint number that
// doubles as an answer). Everything is exact rationals. @fm2 FM-050 FM-056 FM-059 FM-060
import { cmp, div, eq, frac, mul, toDecimalString, toMixedString } from "../../rational.js";
import { UNITS } from "./recipes.js";

export const R = (n, d = 1) => frac(n, d);
export const asR = (v) =>
  Array.isArray(v) ? frac(v[0], v[1]) : typeof v === "number" ? frac(v) : v;
export const num = (r) => r.n / r.d;
export const both = (make) => ({ en: make("en"), es: make("es") });
export const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export function fmtVal(r, style = "mixed") {
  return style === "dec" ? (toDecimalString(r) ?? toMixedString(r)) : toMixedString(r);
}
// Text a learner would type for a value ("3/2" or "1.5"); parse() reads both.
export const typed = (r, style = "mixed") =>
  style === "dec"
    ? (toDecimalString(r) ?? `${r.n}/${r.d}`)
    : r.d === 1
      ? String(r.n)
      : `${r.n}/${r.d}`;

const isOne = (r) => cmp(r, frac(1)) <= 0 && r.n > 0;

// "2 cups of flour", "3 eggs", "$6", "12 miles".
export function qty(row, value, lang, style = "mixed") {
  const text = fmtVal(value, style);
  const idx = isOne(value) ? 0 : 1;
  if (row.noun) return `${text} ${row.noun[lang][idx]}`;
  const unit = UNITS[row.unit];
  if (unit.prefix) return `${unit.prefix}${text}`;
  if (row.unit === "plain") return text;
  const word = unit[lang][idx];
  return unit.bare
    ? `${text} ${word}`
    : `${text} ${word} ${lang === "en" ? "of" : "de"} ${row.name[lang]}`;
}

export function rowLabel(row, lang) {
  if (row.noun) return cap(row.noun[lang][1]);
  if (row.unit === "plain") return cap(row.name[lang]);
  const unit = UNITS[row.unit];
  return `${cap(row.name[lang])} (${unit.prefix ? unit.prefix.trim() : unit[lang][1]})`;
}

export function list(items, lang) {
  if (items.length < 2) return items.join("");
  const tail = items[items.length - 1];
  const head = items.slice(0, -1).join(", ");
  return lang === "en" ? `${head}${items.length > 2 ? "," : ""} and ${tail}` : `${head} y ${tail}`;
}

// ---- columns --------------------------------------------------------------------------------------------------------------
// A column is one scaling job. per: amounts in ONE batch; pin: { key, value } fixes one row; limit: { have: {key: value} }
// asks for the biggest batch; ask: the rows the learner must type.
export function batchFor(col) {
  if (col.pin) return div(col.pin.value, col.per[col.pin.key]);
  let tight = null;
  for (const [key, have] of Object.entries(col.limit.have)) {
    const room = div(have, col.per[key]);
    if (!tight || cmp(room, tight) < 0) tight = room;
  }
  const steps = div(tight, col.step);
  return mul(col.step, frac(Math.floor(steps.n / steps.d)));
}

export function finishCol(col) {
  const out = { step: R(1), showBase: true, ask: [], rep: "recipe", ...col };
  out.batch = batchFor(out);
  if (div(out.batch, out.step).d !== 1) out.step = R(1, out.batch.d);
  out.start = eq(out.batch, R(1)) ? R(0) : R(1);
  out.max = col.max ?? R(Math.max(6, Math.ceil(num(out.batch) * 1.6) + 2));
  return out;
}

export const valueOf = (col, key) => mul(col.per[key], col.batch);

export function makeBench(base) {
  return {
    v: 1,
    kind: "bench",
    view: "bowls",
    line: false,
    hide: false,
    style: "mixed",
    extra: [],
    pick: null,
    mult: [],
    ...base,
    cols: base.cols.map(finishCol),
  };
}

// ---- filters -------------------------------------------------------------------------------------------------------------
export const SIZE_CAP = [20, 20, 20, 60, 100, 100, 1000, 1000, 1000];
const PLAUSIBLE = {
  cook: { cup: 12, tbsp: 24, scoop: 20, gallon: 30, count: 12 },
  crowd: { cup: 48, tbsp: 48, scoop: 20, gallon: 30, count: 24 },
  craft: { cup: 60, tbsp: 24, scoop: 30, gallon: 30, count: 100 },
};

const unitKey = (row) => (row.noun ? "count" : row.unit);

export function everyValue(round) {
  const out = [];
  for (const col of round.cols) {
    out.push(...Object.values(col.per), col.batch);
    if (col.pin) out.push(col.pin.value);
    if (col.limit) out.push(...Object.values(col.limit.have));
    for (const key of col.ask) out.push(valueOf(col, key));
  }
  for (const e of round.extra) if (e.kind === "num") out.push(e.answer);
  return out;
}

// The numbers a hint of tiers 0-2 may print for this round (the givens its strategy talks about).
export function hintNumbers(round) {
  const out = [];
  if (["read", "equation", "count", "compare-count", "compare"].includes(round.hintKind)) return out;
  const wide = round.hintKind === "unit";
  for (const col of round.cols) {
    if (col.pin) out.push(col.pin.value, col.per[col.pin.key]);
    if (wide) out.push(...Object.values(col.per));
    if (col.limit) {
      for (const [key, have] of Object.entries(col.limit.have)) out.push(have, col.per[key]);
      out.push(col.step);
    }
  }
  return out;
}

// The numbers the learner must work out (typed values, extras, and a batch that the prompt does not already state).
export function answerValues(round) {
  const out = [];
  for (const col of round.cols) {
    const trivial = col.pin && eq(col.per[col.pin.key], R(1)) && eq(col.pin.value, col.batch);
    if (!trivial) out.push(col.batch);
    for (const key of col.ask) out.push(valueOf(col, key));
  }
  for (const e of round.extra) if (e.kind === "num") out.push(e.answer);
  return out;
}

export function fits(round) {
  const limit = SIZE_CAP[round.grade];
  const values = everyValue(round);
  if (values.some((v) => num(v) > limit || v.n < 0)) return false;
  if (round.style === "dec") {
    if (
      values.some(
        (v) => (toDecimalString(v) ?? "").split(".")[1]?.length > 3 || toDecimalString(v) === null,
      )
    )
      return false;
  } else if (values.some((v) => v.d > 12)) return false;
  const caps = PLAUSIBLE[round.recipe?.family];
  if (caps) {
    for (const col of round.cols) {
      for (const row of round.rows) {
        const key = unitKey(row);
        if (caps[key] && col.per[row.key] && num(mul(col.per[row.key], col.batch)) > caps[key])
          return false;
      }
    }
  }
  const answers = answerValues(round);
  const given = hintNumbers(round);
  if (answers.some((a) => given.some((g) => eq(a, g)))) return false;
  return round.cols.every((col) => cmp(col.batch, col.max) <= 0 && col.batch.n > 0);
}

// Draws a round until it passes the filters; the final try is returned if none does (the suites assert that never happens).
export function attempt(build, tries = 600) {
  let last = null;
  for (let i = 0; i < tries; i += 1) {
    const round = build(i);
    if (!round) continue;
    last = round;
    if (fits(round)) return round;
  }
  return last;
}

// The singular and plural words for what one step of a row's amount counts ("notebook" / "notebooks", "mile" / "miles").
export function wordOf(row) {
  if (row.noun) return { one: { en: row.noun.en[0], es: row.noun.es[0] }, many: { en: row.noun.en[1], es: row.noun.es[1] } };
  const unit = UNITS[row.unit];
  return { one: { en: unit.en[0], es: unit.es[0] }, many: { en: unit.en[1], es: unit.es[1] } };
}

// The smallest tidy axis maximum that holds a value.
export const niceMax = (v) => [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100, 150, 200, 250, 300, 400, 500, 1000].find((m) => m >= v) ?? Math.ceil(v);
