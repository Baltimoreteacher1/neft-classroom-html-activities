// living/percent-fdp-model.js — the mathematics and every sentence of the
// percent-fdp play (4-2 "Relate Fractions, Decimals, and Percentages"). Pure
// functions only: every number the play shows a student is computed here and
// checked in node by percent-fdp.test.mjs.
//
// The idea: ONE shaded region has three names. Cut every part of a fraction
// strip into the same number of smaller pieces until there are 100; the shaded
// pieces are the numerator over 100 (a fraction), that many hundredths (a
// decimal) and that many per hundred (a percent). Denominators are 2, 4, 5,
// 10, 20, 25 or 50, so every conversion is exact.

import { fmtHundredths } from "./percent-whole.js";
import { okInt, placeNotFirst } from "./unit-convert-model.js";

export { okInt, placeNotFirst };

export const DENOMS = [2, 4, 5, 10, 20, 25, 50];

/** The fractions the "try another" scene steps through (the lesson's own are included). */
export const EXPLORE = [
  [1, 2],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
  [3, 5],
  [1, 10],
  [7, 10],
  [1, 20],
  [1, 25],
  [1, 50],
];

const pair = (v, max = 400) => {
  const en = typeof v === "string" ? v.trim() : typeof v?.en === "string" ? v.en.trim() : "";
  const es = typeof v?.es === "string" && v.es.trim() ? v.es.trim() : en;
  return en && en.length <= max && es.length <= max ? { en, es } : null;
};
const P = (en, es) => ({ en, es });

function fraction(c) {
  const n = Number(c?.n);
  const d = Number(c?.d);
  if (!DENOMS.includes(d) || !okInt(n, 1, d - 1)) return null;
  const k = 100 / d;
  return { n, d, k, p: n * k, dec: fmtHundredths(n * k), story: pair(c.story) };
}

export function validatePercentFdp(cfg) {
  const main = fraction(cfg);
  const transfer = fraction(cfg?.transfer);
  if (!main || !transfer || main.p === transfer.p) return null;
  if (!choicesFor(main) || !choicesFor(transfer)) return null;
  return { ...main, transfer };
}

/** Percent choices for n/d: exact, plus the unshaded part, side-by-side digits, adding to reach 100. */
export function choicesFor(f) {
  /** @type {{ kind: string, p: number, correct?: boolean }[]} */
  const out = [{ kind: "correct", p: f.p, correct: true }];
  const concat = Number(`${f.n}${f.d}`);
  for (const c of [
    { kind: "complement", p: 100 - f.p },
    { kind: "concat", p: concat <= 100 ? concat : null },
    { kind: "add", p: f.n + (100 - f.d) },
  ])
    if (c.p != null && c.p >= 1 && c.p <= 100 && !out.some((o) => o.p === c.p) && out.length < 4)
      out.push(c);
  return out.length >= 3 ? out : null;
}

export const cut = (f, j) => ({ parts: f.d * j, shaded: f.n * j });

export function fdpCopy(v) {
  const { n, d, k, p, dec, transfer: t } = v;
  const frac = `${n}/${d}`;
  const tfrac = `${t.n}/${t.d}`;
  const chain = (f) => `${f.n}/${f.d} = ${f.p}/100 = ${f.dec} = ${f.p}%`;
  const cueOf = (f) => (kind, x) =>
    ({
      complement: P(
        `${x}% is the part that is NOT shaded. The strip has ${f.n} of ${f.d} parts shaded. Is the shaded part more or less than the unshaded part?`,
        `${x}% es la parte que NO está sombreada. La barra tiene ${f.n} de ${f.d} partes sombreadas. ¿La parte sombreada es mayor o menor que la que no está sombreada?`,
      ),
      concat: P(
        `${x} puts the two numbers side by side, but ${f.n}/${f.d} means ${f.n} parts out of ${f.d} equal parts. If the strip were cut into 100 equal pieces, how many would be shaded?`,
        `${x} junta los dos números, pero ${f.n}/${f.d} quiere decir ${f.n} partes de ${f.d} partes iguales. Si la barra se cortara en 100 piezas iguales, ¿cuántas estarían sombreadas?`,
      ),
      add: P(
        `${x} comes from adding ${100 - f.d} to the bottom to reach 100 and to the top too. Adding does not keep the same amount. What do you multiply ${f.d} by to reach 100?`,
        `${x} sale de sumar ${100 - f.d} abajo para llegar a 100 y también arriba. Sumar no conserva la misma cantidad. ¿Por cuánto multiplicas ${f.d} para llegar a 100?`,
      ),
    })[kind];
  return {
    kicker: P("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: P("Fraction, decimal, percent", "Fracción, decimal, porcentaje"),
    ariaLabel: P(
      `A strip cut into ${d} equal parts with ${n} shaded. Each part is cut into ${k} smaller pieces until there are 100, with ${p} shaded. A decimal ruler from 0 to 1 and a percent ruler from 0% to 100% mark the same spot: ${frac} = ${p}/100 = ${dec} = ${p}%.`,
      `Una barra cortada en ${d} partes iguales con ${n} sombreadas. Cada parte se corta en ${k} piezas más pequeñas hasta tener 100, con ${p} sombreadas. Una recta decimal de 0 a 1 y una recta de porcentaje de 0% a 100% marcan el mismo lugar: ${frac} = ${p}/100 = ${dec} = ${p}%.`,
    ),
    printSummary: P(
      `${chain(v)}. A strip with ${n} of ${d} equal parts shaded, cut so that every part becomes ${k} pieces, has ${n} × ${k} = ${p} of ${d} × ${k} = 100 pieces shaded: ${p} hundredths, which is the decimal ${dec} and ${p}%. Three names, one amount.`,
      `${chain(v)}. Una barra con ${n} de ${d} partes iguales sombreadas, cortada para que cada parte sea ${k} piezas, tiene ${n} × ${k} = ${p} de ${d} × ${k} = 100 piezas sombreadas: ${p} centésimas, que es el decimal ${dec} y ${p}%. Tres nombres, una misma cantidad.`,
    ),
    scene: {
      situate: P("The strip", "La barra"),
      predict: P("Predict", "Predice"),
      cut: P("Cut into 100", "Corta en 100"),
      names: P("Three names", "Tres nombres"),
      explore: P("Try more", "Prueba más"),
      transfer: P("On your own", "Por tu cuenta"),
    },
    parts: (f, j = 1) =>
      P(`${f.n * j} out of ${f.d * j} parts shaded`, `${f.n * j} de ${f.d * j} partes sombreadas`),
    situate: {
      say:
        v.story ||
        P(
          `A strip stands for the whole. It is cut into ${d} equal parts and ${n} are shaded: ${frac} of the whole.`,
          `Una barra representa el total. Está cortada en ${d} partes iguales y ${n} están sombreadas: ${frac} del total.`,
        ),
      note: P(
        `The strip has ${d} equal parts. ${n} are shaded, so the fraction is ${frac}. Percent means out of 100: what could we do to the strip to see 100 parts?`,
        `La barra tiene ${d} partes iguales. ${n} están sombreadas, así que la fracción es ${frac}. Porcentaje quiere decir de cada 100: ¿qué podemos hacer con la barra para ver 100 partes?`,
      ),
    },
    predict: {
      say: P(
        `Percent means out of 100. As a percent, how much of the strip is shaded?`,
        `Porcentaje quiere decir de cada 100. Como porcentaje, ¿cuánto de la barra está sombreado?`,
      ),
      question: P(`${frac} as a percent is…`, `${frac} como porcentaje es…`),
      ok: P(
        `Yes: ${frac} = ${p}%. Next, cut the strip yourself and watch why.`,
        `Sí: ${frac} = ${p}%. Ahora corta tú la barra y mira por qué.`,
      ),
      cue: cueOf(v),
    },
    cut: {
      say: P(
        `Cut every part into the same number of smaller pieces. Watch the shaded amount: does it get bigger, smaller or stay the same size?`,
        `Corta cada parte en el mismo número de piezas más pequeñas. Mira la cantidad sombreada: ¿se hace mayor, menor o queda del mismo tamaño?`,
      ),
      label: P("Pieces in each part", "Piezas en cada parte"),
      more: P(
        `Keep cutting until the strip has 100 equal pieces.`,
        `Sigue cortando hasta que la barra tenga 100 piezas iguales.`,
      ),
      done: P(
        `Each part became ${k} pieces. ${n} × ${k} = ${p} shaded pieces out of ${d} × ${k} = 100. The shaded part never changed size, so ${frac} = ${p}/100.`,
        `Cada parte se volvió ${k} piezas. ${n} × ${k} = ${p} piezas sombreadas de ${d} × ${k} = 100. La parte sombreada nunca cambió de tamaño, así que ${frac} = ${p}/100.`,
      ),
      expr: (j) => `${n * j}/${d * j}`,
    },
    names: {
      say: P(
        `${p} of the 100 pieces are shaded. As a fraction that is ${p}/100. As a decimal it is ${dec}, because hundredths sit two places after the point. As a percent it is ${p}%. Three names, one amount: the same spot on both rulers.`,
        `${p} de las 100 piezas están sombreadas. Como fracción es ${p}/100. Como decimal es ${dec}, porque las centésimas están dos lugares después del punto. Como porcentaje es ${p}%. Tres nombres, una misma cantidad: el mismo lugar en las dos rectas.`,
      ),
      big: `${frac} = ${p}/100`,
      small: `= ${dec} = ${p}%`,
      rulerDec: P("decimal", "decimal"),
      rulerPct: P("percent", "porcentaje"),
    },
    explore: {
      say: P(
        `Does it always work? Step through other fractions. Watch the shaded part: each one has the same three names.`,
        `¿Siempre funciona? Pasa por otras fracciones. Mira la parte sombreada: cada una tiene los mismos tres nombres.`,
      ),
      label: P("Fraction", "Fracción"),
      tryMore: P(
        "Look at at least three different fractions.",
        "Mira al menos tres fracciones diferentes.",
      ),
      done: P(
        "Every time, the shaded pieces out of 100 give the fraction over 100, the decimal in hundredths and the percent. A fraction with 2, 4, 5, 10, 20, 25 or 50 on the bottom scales to 100 exactly.",
        "Cada vez, las piezas sombreadas de 100 dan la fracción sobre 100, el decimal en centésimas y el porcentaje. Una fracción con 2, 4, 5, 10, 20, 25 o 50 abajo se escala a 100 de forma exacta.",
      ),
      chain,
    },
    transfer: {
      say: P(
        `A new fraction: ${tfrac} of the strip is shaded. Write it as a percent.`,
        `Una fracción nueva: ${tfrac} de la barra está sombreado. Escríbela como porcentaje.`,
      ),
      question: P(`${tfrac} as a percent is…`, `${tfrac} como porcentaje es…`),
      ok: P(
        `Right: ${t.d} × ${t.k} = 100 and ${t.n} × ${t.k} = ${t.p}, so ${chain(t)}.`,
        `Correcto: ${t.d} × ${t.k} = 100 y ${t.n} × ${t.k} = ${t.p}, así que ${chain(t)}.`,
      ),
      cue: cueOf(t),
      explain: P(
        "Explain: how do you change a fraction into a percent when the bottom number is not 100?",
        "Explica: ¿cómo cambias una fracción en porcentaje cuando el número de abajo no es 100?",
      ),
      frame: P(
        "I multiply the bottom by ___ to get 100, so I multiply the top by ___ too. The top is the ___.",
        "Multiplico el número de abajo por ___ para llegar a 100, así que también multiplico el de arriba por ___. El de arriba es el ___.",
      ),
    },
  };
}
