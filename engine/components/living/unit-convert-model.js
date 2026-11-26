// living/unit-convert-model.js — the mathematics and every sentence of the
// unit-convert play (3-6, 3-7, 3-10). Pure functions only (no DOM): every number
// the play shows a student is computed here, so unit-convert.test.mjs can check
// each one in node.
//
// The idea: ONE length (or amount) measured in two units. On a double number
// line the bar does not change when the unit changes; the number that names it
// does, by the conversion factor. Everything is held in exact hundredths so no
// float ever reaches the stage.

import { fmtHundredths, placeCorrect } from "./percent-whole.js";

export { placeCorrect };

/** Correct choice at a stable position that is never the first. */
export const placeNotFirst = (options, seed) =>
  placeCorrect(options, (seed % (options.length - 1)) + 1);

export const MAXN = 10; // most intervals a number line may carry
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

/** Hundredths as text with thousands commas: 400000 → "4,000", 60 → "0.6". */
export function fmt(h) {
  const s = fmtHundredths(h);
  if (!s) return "";
  const [int, frac] = s.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `${withCommas}.${frac}` : withCommas;
}

const pair = (v, max = 400) => {
  const en = typeof v === "string" ? v.trim() : typeof v?.en === "string" ? v.en.trim() : "";
  const es = typeof v?.es === "string" && v.es.trim() ? v.es.trim() : en;
  return en && en.length <= max && es.length <= max ? { en, es } : null;
};

/** A unit: { one:{en,es}, many:{en,es} } ("foot"/"feet"). */
function unitOf(u) {
  const one = pair(u?.one, 24);
  const many = pair(u?.many, 24);
  return one && many ? { one, many } : null;
}

/** The unit's name for hundredths `h`: exactly 1, or less than 1, takes the singular. */
export const un = (u, h) => (h <= 100 ? u.one : u.many);

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const P = (en, es) => ({ en, es });

/**
 * One measuring situation: `amount` of `from`, factor = how many `to` in 1 `from`.
 * amount = N × step with 2 ≤ N ≤ 10, so the number line has N equal steps.
 */
function setting(c) {
  const from = unitOf(c?.from);
  const to = unitOf(c?.to);
  const factor = Number(c?.factor);
  const f100 = Math.round(factor * 100);
  if (!from || !to || !(factor > 0) || Math.abs(factor * 100 - f100) > 1e-9) return null;
  if (f100 === 100 || f100 > 1_000_000) return null;
  const amount = Number(c?.amount);
  const step = c?.step == null ? 1 : Number(c.step);
  if (!okInt(amount, 2, 1000) || !okInt(step, 1, 1000) || amount % step) return null;
  const N = amount / step;
  if (!okInt(N, 2, MAXN)) return null;
  const story = pair(c.story);
  const verdict = pair(c.verdict);
  return {
    from,
    to,
    f100,
    amount,
    step,
    N,
    approx: c.approx === true,
    story,
    verdict,
    mH: amount * f100, // the converted amount, hundredths
    toSmaller: f100 > 100, // the new unit is the smaller one: the number gets bigger
  };
}

export function validateUnitConvert(cfg) {
  const main = setting(cfg);
  const transfer = setting(cfg?.transfer);
  if (!main || !transfer) return null;
  if (main.mH === transfer.mH && main.amount === transfer.amount) return null;
  return { ...main, transfer };
}

/** Value in the new unit for k steps. */
export const convH = (s, k) => k * s.step * s.f100;

/**
 * Forward predict choices (amount → new unit), hundredths: the exact product
 * plus up to three real misconceptions — divided instead, the number unchanged,
 * one unit's worth only, the factor added. Non-exact or repeated values are
 * dropped.
 */
export function forwardChoices(s) {
  const a100 = s.amount * 100;
  const rev = (a100 * 100) % s.f100 === 0 ? (a100 * 100) / s.f100 : null;
  const cands = [
    { kind: "reverse", h: rev },
    { kind: "same", h: a100 },
    { kind: "unit", h: s.f100 },
    { kind: "add", h: a100 + s.f100 },
  ];
  /** @type {{ kind: string, h: number, correct?: boolean }[]} */
  const out = [{ kind: "correct", h: s.mH, correct: true }];
  for (const c of cands)
    if (c.h != null && out.length < 4 && !out.some((o) => o.h === c.h)) out.push(c);
  return out.length >= 3 ? out : null;
}

/**
 * Reverse choices (new-unit amount → original unit), hundredths: divide is
 * right; multiplying again, keeping the number, or the factor alone are not.
 */
export function reverseChoices(s) {
  const times = (s.mH * s.f100) % 100 === 0 ? (s.mH * s.f100) / 100 : null;
  const cands = [
    { kind: "times", h: times },
    { kind: "same", h: s.mH },
    { kind: "unit", h: s.f100 },
  ];
  /** @type {{ kind: string, h: number, correct?: boolean }[]} */
  const out = [{ kind: "correct", h: s.amount * 100, correct: true }];
  for (const c of cands)
    if (c.h != null && out.length < 4 && !out.some((o) => o.h === c.h)) out.push(c);
  return out.length >= 3 ? out : null;
}

/**
 * Every sentence for one setting `s`, as { en, es } pairs. `L` = pair→text for
 * the labels the stage draws is NOT needed: plays pick the language.
 */
export function settingCopy(s) {
  const { from, to } = s;
  const A = fmt(s.amount * 100);
  const F = fmt(s.f100);
  const M = fmt(s.mH);
  const eq = s.approx ? "≈" : "=";
  const fromA = un(from, s.amount * 100);
  const toM = un(to, s.mH);
  const toF = un(to, s.f100);
  const size = P(
    `1 ${to.one.en} is ${s.toSmaller ? "smaller" : "larger"} than 1 ${from.one.en}`,
    `1 ${to.one.es} es ${s.toSmaller ? "menor" : "mayor"} que 1 ${from.one.es}`,
  );
  const biggerNum = P(
    s.toSmaller ? "a bigger number" : "a smaller number",
    s.toSmaller ? "un número mayor" : "un número menor",
  );
  const roundNote = s.approx
    ? P(
        "The factor is rounded, so the answer is approximate: that is why the sign is ≈.",
        "El factor está redondeado, así que la respuesta es aproximada: por eso el signo es ≈.",
      )
    : null;
  const factorLine = P(
    `1 ${from.one.en} ${eq} ${F} ${toF.en}`,
    `1 ${from.one.es} ${eq} ${F} ${toF.es}`,
  );
  const chain = (a, b) => `${a} ${eq} ${b}`;
  return {
    A,
    F,
    M,
    eq,
    size,
    factorLine,
    roundNote,
    barTop: P(`${A} ${fromA.en}`, `${A} ${fromA.es}`),
    barBot: P(`${eq === "≈" ? "≈ " : ""}${M} ${toM.en}`, `${eq === "≈" ? "≈ " : ""}${M} ${toM.es}`),
    opLabel: `× ${F}`,
    axisTop: P(cap(from.many.en), cap(from.many.es)),
    axisBot: P(cap(to.many.en), cap(to.many.es)),
    sentence: P(
      `${chain(`${A} ${fromA.en}`, `${M} ${toM.en}`)}`,
      `${chain(`${A} ${fromA.es}`, `${M} ${toM.es}`)}`,
    ),
    situate:
      s.story ||
      P(
        `A measurement of ${A} ${fromA.en}. We want the same amount in ${to.many.en}. The top line counts ${from.many.en}; the bottom line counts ${to.many.en}. They are linked: ${factorLine.en}.`,
        `Una medida de ${A} ${fromA.es}. Queremos la misma cantidad en ${to.many.es}. La recta de arriba cuenta ${from.many.es}; la de abajo cuenta ${to.many.es}. Están unidas: ${factorLine.es}.`,
      ),
    situateLink: P(
      `The top line counts ${from.many.en}; the bottom line counts ${to.many.en}. One ${from.one.en} on top matches ${F} ${toF.en} below: ${factorLine.en}.`,
      `La recta de arriba cuenta ${from.many.es}; la de abajo cuenta ${to.many.es}. 1 ${from.one.es} arriba coincide con ${F} ${toF.es} abajo: ${factorLine.es}.`,
    ),
    predict: {
      say: P(
        `The bar is ${A} ${fromA.en} long. Before the bottom line fills in: how many ${to.many.en} is the same bar?`,
        `La barra mide ${A} ${fromA.es}. Antes de que se llene la recta de abajo: ¿cuánto mide la misma barra en ${to.many.es}?`,
      ),
      question: P(
        `In ${to.many.en}, the same bar measures…`,
        `En ${to.many.es}, la misma barra mide…`,
      ),
      ok: P(
        `Yes: ${A} × ${F} ${eq} ${M}. The bar is ${A} ${fromA.en} on top and ${M} ${toM.en} below — the same bar with a different number.${roundNote ? ` ${roundNote.en}` : ""}`,
        `Sí: ${A} × ${F} ${eq} ${M}. La barra mide ${A} ${fromA.es} arriba y ${M} ${toM.es} abajo: la misma barra con otro número.${roundNote ? ` ${roundNote.es}` : ""}`,
      ),
      cue: (kind, h) => {
        const v = fmt(h);
        const vu = un(to, h);
        return {
          reverse: P(
            `${v} comes from dividing ${A} by ${F}. ${size.en}. Is the bar made of more ${to.many.en} than ${from.many.en}, or fewer? Look at the bottom line.`,
            `${v} sale de dividir ${A} entre ${F}. ${size.es}. ¿La barra tiene más ${to.many.es} que ${from.many.es}, o menos? Mira la recta de abajo.`,
          ),
          same: P(
            `${A} is the number in ${from.many.en}. ${size.en}, so the same bar needs a different number of ${to.many.en}. Does the bar's end sit at ${A} on the bottom line?`,
            `${A} es el número en ${from.many.es}. ${size.es}, así que la misma barra necesita otro número de ${to.many.es}. ¿El final de la barra queda en ${A} en la recta de abajo?`,
          ),
          unit: P(
            `${v} ${vu.en} is the length of just ONE ${from.one.en}. How many ${from.many.en} long is the bar?`,
            `${v} ${vu.es} es lo que mide apenas 1 ${from.one.es}. ¿Cuánto mide la barra en ${from.many.es}?`,
          ),
          add: P(
            `Adding ${F} treats the factor like extra length. Each ${from.one.en} on top matches ${F} ${toF.en} below. How many ${from.many.en} is the bar?`,
            `Sumar ${F} trata el factor como longitud extra. Cada ${from.one.es} de arriba coincide con ${F} ${toF.es} abajo. ¿Cuánto mide la barra en ${from.many.es}?`,
          ),
        }[kind];
      },
    },
    slide: {
      say: P(
        `Slide the bar along. At every stop read the ${from.many.en} on top and the ${to.many.en} below. Does a stop ever change the ratio between them?`,
        `Desliza la barra. En cada parada lee arriba el número de ${from.many.es} y abajo el de ${to.many.es}. ¿Alguna parada cambia la razón entre ellos?`,
      ),
      label:
        s.step === 1
          ? P(cap(from.many.en), cap(from.many.es))
          : P(`Steps of ${s.step} ${from.many.en}`, `Pasos de ${s.step} ${from.many.es}`),
      tryMore: P("Try at least three different stops.", "Prueba al menos tres paradas diferentes."),
      row: (k) => {
        const top = fmt(k * s.step * 100);
        const bot = fmt(convH(s, k));
        return P(
          `${top} ${un(from, k * s.step * 100).en} ${eq} ${bot} ${un(to, convH(s, k)).en}`,
          `${top} ${un(from, k * s.step * 100).es} ${eq} ${bot} ${un(to, convH(s, k)).es}`,
        );
      },
      done: P(
        `Every ${s.step === 1 ? "" : `${s.step} `}${s.step === 1 ? from.one.en : from.many.en} on top matches ${fmt(s.step * s.f100)} ${un(to, s.step * s.f100).en} below, every time. The bar never got longer or shorter. Only the number that names it changed.`,
        `Cada ${s.step === 1 ? "" : `${s.step} `}${s.step === 1 ? from.one.es : from.many.es} de arriba coincide con ${fmt(s.step * s.f100)} ${un(to, s.step * s.f100).es} abajo, siempre. La barra nunca se hizo más larga ni más corta. Solo cambió el número que la nombra.`,
      ),
    },
    connect: {
      say: P(
        `${A} × ${F} ${eq} ${M}. ${size.en}, so the number of ${to.many.en} is ${biggerNum.en} than the number of ${from.many.en}, and multiplying by ${F} gives ${s.toSmaller ? "more" : "less"}. `.trim(),
        `${A} × ${F} ${eq} ${M}. ${size.es}, así que el número de ${to.many.es} es ${biggerNum.es} que el número de ${from.many.es}, y multiplicar por ${F} da ${s.toSmaller ? "más" : "menos"}. `.trim(),
      ),
      top: P(
        `Reading the top line: the bar is ${A} ${fromA.en}.`,
        `Leyendo la recta de arriba: la barra mide ${A} ${fromA.es}.`,
      ),
      bot: P(
        `Reading the bottom line: the same bar is ${M} ${toM.en}.`,
        `Leyendo la recta de abajo: la misma barra mide ${M} ${toM.es}.`,
      ),
      note: P(
        [roundNote?.en, s.verdict?.en].filter(Boolean).join(" "),
        [roundNote?.es, s.verdict?.es].filter(Boolean).join(" "),
      ),
      topBtn: P("Read the top line", "Lee la recta de arriba"),
      botBtn: P("Read the bottom line", "Lee la recta de abajo"),
    },
    reverse: {
      say: P(
        `Now go the other way. A bar is ${M} ${toM.en}. How many ${from.many.en} is it?`,
        `Ahora al revés. Una barra mide ${M} ${toM.es}. ¿Cuánto mide en ${from.many.es}?`,
      ),
      question: P(`In ${from.many.en}, the bar measures…`, `En ${from.many.es}, la barra mide…`),
      ok: P(
        `Yes: ${M} ÷ ${F} ${eq} ${A}. Going from ${s.toSmaller ? "the smaller unit to the larger" : "the larger unit to the smaller"} gives ${s.toSmaller ? "a smaller number" : "a bigger number"}, so you divide by the factor.`,
        `Sí: ${M} ÷ ${F} ${eq} ${A}. Pasar de ${s.toSmaller ? "la unidad menor a la mayor" : "la unidad mayor a la menor"} da ${s.toSmaller ? "un número menor" : "un número mayor"}, así que divides entre el factor.`,
      ),
      cue: (kind, h) => {
        const v = fmt(h);
        return {
          times: P(
            `${v} comes from multiplying again. ${size.en}. Should the number of ${from.many.en} be more or less than the number of ${to.many.en}? Look at the top line.`,
            `${v} sale de multiplicar otra vez. ${size.es}. ¿El número de ${from.many.es} debe ser mayor o menor que el de ${to.many.es}? Mira la recta de arriba.`,
          ),
          same: P(
            `${v} is the number in ${to.many.en}. The same bar needs a different number of ${from.many.en}. Does the bar's end sit at ${v} on the top line?`,
            `${v} es el número en ${to.many.es}. La misma barra necesita otro número de ${from.many.es}. ¿El final de la barra queda en ${v} en la recta de arriba?`,
          ),
          unit: P(
            `${v} is how many ${to.many.en} fit in ONE ${from.one.en}. How many ${from.many.en} make this whole bar?`,
            `${v} es cuánto cabe de ${to.many.es} en 1 ${from.one.es}. ¿Cuánto mide toda esta barra en ${from.many.es}?`,
          ),
        }[kind];
      },
    },
  };
}

/** The whole play's copy: title, aria label, print summary, transfer and explain frame. */
export function convertCopy(v) {
  const m = settingCopy(v);
  const t = settingCopy(v.transfer);
  const tv = v.transfer;
  return {
    m,
    t,
    kicker: P("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: P("One amount, two units", "Una cantidad, dos unidades"),
    ariaLabel: P(
      `Two number lines lined up. The top line counts ${v.from.many.en} from 0 to ${m.A}; the bottom line counts ${v.to.many.en} from 0 to ${m.M}. One bar reaches ${m.A} ${un(v.from, v.amount * 100).en} on top and ${m.M} ${un(v.to, v.mH).en} below.`,
      `Dos rectas numéricas alineadas. La de arriba cuenta ${v.from.many.es} de 0 a ${m.A}; la de abajo cuenta ${v.to.many.es} de 0 a ${m.M}. Una barra llega a ${m.A} ${un(v.from, v.amount * 100).es} arriba y a ${m.M} ${un(v.to, v.mH).es} abajo.`,
    ),
    printSummary: P(
      `${m.factorLine.en}. A length of ${m.A} ${un(v.from, v.amount * 100).en} is ${m.A} × ${m.F} ${m.eq} ${m.M} ${un(v.to, v.mH).en}: the same length, a different number, because ${m.size.en}. Going back, ${m.M} ÷ ${m.F} ${m.eq} ${m.A}.`,
      `${m.factorLine.es}. Una longitud de ${m.A} ${un(v.from, v.amount * 100).es} es ${m.A} × ${m.F} ${m.eq} ${m.M} ${un(v.to, v.mH).es}: la misma longitud con otro número, porque ${m.size.es}. Al volver, ${m.M} ÷ ${m.F} ${m.eq} ${m.A}.`,
    ),
    transferSay: P(
      `${tv.story ? `${tv.story.en} ` : ""}A new bar: ${t.A} ${un(tv.from, tv.amount * 100).en}. Find it in ${tv.to.many.en}.`,
      `${tv.story ? `${tv.story.es} ` : ""}Una barra nueva: ${t.A} ${un(tv.from, tv.amount * 100).es}. Hállala en ${tv.to.many.es}.`,
    ),
    transferQ: P(
      `In ${tv.to.many.en}, ${t.A} ${un(tv.from, tv.amount * 100).en} is…`,
      `En ${tv.to.many.es}, ${t.A} ${un(tv.from, tv.amount * 100).es} es…`,
    ),
    transferOk: P(
      `Right: ${t.A} × ${t.F} ${t.eq} ${t.M}. ${t.size.en}, so the number of ${tv.to.many.en} is ${tv.toSmaller ? "bigger" : "smaller"}.${t.roundNote ? ` ${t.roundNote.en}` : ""}`,
      `Correcto: ${t.A} × ${t.F} ${t.eq} ${t.M}. ${t.size.es}, así que el número de ${tv.to.many.es} es ${tv.toSmaller ? "mayor" : "menor"}.${t.roundNote ? ` ${t.roundNote.es}` : ""}`,
    ),
    explain: P(
      "Explain: how do you decide whether the new number should be bigger or smaller than the one you started with?",
      "Explica: ¿cómo decides si el número nuevo debe ser mayor o menor que el número con que empezaste?",
    ),
    frame: P(
      "The new unit is ___ than the old unit, so the number is ___ and I ___ by the factor.",
      "La unidad nueva es ___ que la anterior, así que el número es ___ y yo ___ por el factor.",
    ),
    scene: {
      situate: P("The two lines", "Las dos rectas"),
      predict: P("Predict", "Predice"),
      slide: P("Slide the bar", "Desliza la barra"),
      connect: P("The number sentence", "La oración numérica"),
      reverse: P("The other way", "Al revés"),
      transfer: P("On your own", "Por tu cuenta"),
    },
  };
}
