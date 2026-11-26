// living/fraction-groups-model.js — the mathematics of the fraction-groups play
// (6-1, 6-2, 6-9, 6-10, 6-11). Pure functions only (no DOM): every quotient,
// piece count, choice set and written step the play shows is computed here with
// exact integer fractions, so fraction-groups.test.mjs can recompute each one.
//
// The idea: dividend ÷ divisor asks how many groups of the divisor fit in the
// dividend. Cut the tape into pieces of one common size (1/q); then the
// dividend is P pieces, a group is g pieces, and the number of groups is
// P ÷ g — which is exactly what multiplying by the reciprocal computes.
// Nothing here is a float: a fraction is { n, d } in lowest terms.

import { placeCorrect } from "./ratio-scale-model.js";

export { placeCorrect };

export const W = 480;
export const H = 290;
export const MAX_PIECES = 30; // pieces on the tape (keeps each 14+ units wide)
export const MAX_WHOLES = 6;
export const MAX_GROUPS = 24;
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

/** @typedef {{ n: number, d: number }} Frac */
/** @typedef {{ en: string, es: string }} Pair */
/** @typedef {NonNullable<ReturnType<typeof tapeSpec>>} Spec */

export const gcd = (x, y) => (y ? gcd(y, x % y) : x);
export const lcm = (x, y) => (x / gcd(x, y)) * y;

/** A fraction in lowest terms. @returns {Frac} */
export function frac(n, d = 1) {
  const g = gcd(Math.abs(n), Math.abs(d)) || 1;
  return { n: n / g, d: d / g };
}
export const mulF = (/** @type {Frac} */ a, /** @type {Frac} */ b) => frac(a.n * b.n, a.d * b.d);
export const divF = (/** @type {Frac} */ a, /** @type {Frac} */ b) => frac(a.n * b.d, a.d * b.n);
export const eqF = (/** @type {Frac} */ a, /** @type {Frac} */ b) => a.n * b.d === b.n * a.d;
export const gtF = (/** @type {Frac} */ a, /** @type {Frac} */ b) => a.n * b.d > b.n * a.d;
export const isWhole = (/** @type {Frac} */ f) => f.d === 1;
export const recip = (/** @type {Frac} */ f) => frac(f.d, f.n);

/** "3", "3/4", "9/2" (improper stays improper). */
export const fmt = (/** @type {Frac} */ f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
/** "3 1/2" for 7/2; otherwise as fmt. */
export function mixed(/** @type {Frac} */ f) {
  if (f.d === 1 || f.n < f.d) return fmt(f);
  const w = Math.floor(f.n / f.d);
  return `${w} ${f.n - w * f.d}/${f.d}`;
}

/** [singular EN, plural EN, singular ES, plural ES] for pieces of size 1/c. */
const NAMES = {
  2: ["half", "halves", "medio", "medios"],
  3: ["third", "thirds", "tercio", "tercios"],
  4: ["fourth", "fourths", "cuarto", "cuartos"],
  5: ["fifth", "fifths", "quinto", "quintos"],
  6: ["sixth", "sixths", "sexto", "sextos"],
  8: ["eighth", "eighths", "octavo", "octavos"],
  10: ["tenth", "tenths", "décimo", "décimos"],
  12: ["twelfth", "twelfths", "doceavo", "doceavos"],
};
const nameOk = (/** @type {number} */ c) => Object.hasOwn(NAMES, c);
/** "4 fourths" / "1 fourth" as a pair. */
export function pieces(/** @type {number} */ c, /** @type {number} */ n) {
  const nm = NAMES[/** @type {keyof typeof NAMES} */ (c)];
  return { en: `${n} ${nm[n === 1 ? 0 : 1]}`, es: `${n} ${nm[n === 1 ? 2 : 3]}` };
}
/** "fourths" / "cuartos" (plural, no number). */
export const pluralName = (/** @type {number} */ c) => {
  const nm = NAMES[/** @type {keyof typeof NAMES} */ (c)];
  return { en: nm[1], es: nm[3] };
};

const P = (en, es) => ({ en, es });
const cleanPair = (v, max = 220) => {
  const en = typeof v === "string" ? v.trim() : typeof v?.en === "string" ? v.en.trim() : "";
  const es = typeof v?.es === "string" && v.es.trim() ? v.es.trim() : en;
  return en && en.length <= max && es.length <= max ? { en, es } : null;
};
const cleanFrac = (v) => {
  if (!v || !okInt(v.n, 1, 99) || !okInt(v.d, 1, 99)) return null;
  return frac(v.n, v.d);
};

/**
 * The tape for D ÷ B: cut into pieces of size 1/q, D is P pieces, a group is g
 * pieces, and Q groups fit exactly. null when the tape cannot be drawn
 * correctly (an inexact quotient, too many pieces, a divisor bigger than D).
 * @param {Frac} D @param {Frac} B
 */
export function tapeSpec(D, B) {
  if (!D || !B || !gtF(D, B)) return null;
  const q = lcm(D.d, B.d);
  const P0 = D.n * (q / D.d);
  const g = B.n * (q / B.d);
  const whole = Math.ceil(D.n / D.d);
  if (!nameOk(q) || P0 % g !== 0 || whole > MAX_WHOLES || whole * q > MAX_PIECES) return null;
  const Q = P0 / g;
  if (!okInt(Q, 2, MAX_GROUPS)) return null;
  return { D, B, q, P: P0, g, Q, whole, key: `${fmt(D)}|${fmt(B)}` };
}

/**
 * One problem: the tape plus its words.
 * @param {any} c
 */
function problem(c) {
  const D = cleanFrac(c?.dividend);
  const B = cleanFrac(c?.divisor);
  const spec = D && B ? tapeSpec(D, B) : null;
  const noun = cleanPair(c?.noun, 24);
  const story = cleanPair(c?.story);
  const question = c?.question == null ? null : cleanPair(c.question);
  if (!spec || !noun || !story || (c?.question != null && !question)) return null;
  return { spec, noun, story, question };
}

/** The "shared equally" companion: D' ÷ shares = B', drawn as `shares` groups. */
function shareOf(c, main) {
  if (!c || typeof c !== "object") return null;
  const D = c.dividend == null ? main.spec.D : cleanFrac(c.dividend);
  const shares = Number(c.shares);
  const story = cleanPair(c.story);
  if (!D || !okInt(shares, 2, 12) || !story) return null;
  const B = divF(D, frac(shares, 1));
  const spec = tapeSpec(D, B);
  if (!spec || spec.Q !== shares) return null;
  const question = c.question == null ? null : cleanPair(c.question);
  return { spec, shares, story, question };
}

export const MODES = ["unit", "whole", "fraction", "mixed", "story"];

/**
 * @param {any} cfg
 */
export function validateFractionGroups(cfg) {
  if (!cfg || typeof cfg !== "object" || !MODES.includes(cfg.mode)) return null;
  const mode = /** @type {"unit"|"whole"|"fraction"|"mixed"|"story"} */ (cfg.mode);
  const main = problem(cfg);
  const transfer = problem(cfg.transfer);
  if (!main || !transfer) return null;
  if (main.spec.key === transfer.spec.key) return null;
  // Each lesson's numbers must be the kind of division it teaches.
  const ok = (/** @type {ReturnType<typeof tapeSpec>} */ s) => {
    if (!s) return false;
    const { D, B } = s;
    if (mode === "unit") return isWhole(D) && B.n === 1 && B.d > 1;
    if (mode === "whole") return isWhole(D) && B.d > 1;
    if (mode === "fraction") return D.d > 1 && D.n < D.d;
    if (mode === "mixed") return D.d > 1 && D.n > D.d;
    return true;
  };
  if (!ok(main.spec) || !ok(transfer.spec)) return null;
  // The convert scene needs three distinct numerators to choose from.
  if (mode === "mixed" && convertChoices(main.spec.D).length < 3) return null;
  /** @type {{ kind: "share"|"bigger", spec: NonNullable<ReturnType<typeof tapeSpec>>, shares?: number, story: Pair, question: Pair | null } | null} */
  let extra = null;
  if (mode === "unit" || mode === "story") {
    const sh = shareOf(cfg.share, main);
    if (!sh) return null;
    extra = {
      kind: "share",
      spec: sh.spec,
      shares: sh.shares,
      story: sh.story,
      question: sh.question,
    };
  } else if (mode === "whole") {
    const big = problem(cfg.bigger);
    // The bigger group is the point: a group of more than one piece.
    if (!big || big.spec.g < 2 || !isWhole(big.spec.D)) return null;
    extra = { kind: "bigger", spec: big.spec, story: big.story, question: big.question };
  }
  if (extra && extra.spec.key === main.spec.key && extra.kind === "bigger") return null;
  const allSpecs = [main.spec, transfer.spec, ...(extra ? [extra.spec] : [])];
  return { mode, main, transfer, extra, specs: allSpecs, noun: main.noun };
}

/**
 * Choices for "how many groups fit": the quotient and the real mistakes —
 * multiply instead, divide the other way round, only the wholes (or only the
 * tops), and counting the pieces without grouping them.
 * @param {NonNullable<ReturnType<typeof tapeSpec>>} s
 */
export function quotientChoices(s) {
  const { D, B, Q, P: pieceCount, g } = s;
  /** @type {{ value: Frac, kind: string, correct: boolean }[]} */
  const raw = [
    { value: frac(Q, 1), kind: "quotient", correct: true },
    { value: mulF(D, B), kind: "times", correct: false },
    { value: divF(B, D), kind: "swap", correct: false },
    {
      value: divF(frac(D.n, 1), frac(B.n, 1)),
      kind: isWhole(D) && B.n === 1 ? "wholes" : "tops",
      correct: false,
    },
  ];
  if (g > 1) raw.push({ value: frac(pieceCount, 1), kind: "pieces", correct: false });
  const seen = [];
  const out = raw.filter((o) => {
    if (seen.some((x) => eqF(x, o.value))) return false;
    seen.push(o.value);
    return true;
  });
  return out.slice(0, 5);
}

/**
 * Choices for "which equation answers the question": D ÷ B, the divisor the
 * other way round, a product, a subtraction.
 * @param {Frac} D @param {Frac} B
 */
export function equationChoices(D, B) {
  const d = fmt(D);
  const b = fmt(B);
  return [
    { text: `${d} ÷ ${b}`, kind: "right", correct: true },
    { text: `${b} ÷ ${d}`, kind: "swap", correct: false },
    { text: `${d} × ${b}`, kind: "times", correct: false },
    { text: `${d} − ${b}`, kind: "minus", correct: false },
  ];
}

/**
 * "Shared equally among `shares`": D' ÷ shares, the other way round, dividing
 * by 1/shares (a "how many fit" question), and multiplying.
 * @param {Frac} D @param {number} shares
 */
export function shareChoices(D, shares) {
  const d = fmt(D);
  return [
    { text: `${d} ÷ ${shares}`, kind: "right", correct: true },
    { text: `${shares} ÷ ${d}`, kind: "swap", correct: false },
    { text: `${d} ÷ 1/${shares}`, kind: "flip", correct: false },
    { text: `${d} × ${shares}`, kind: "times", correct: false },
  ];
}

/**
 * "3 1/2 = ?/2": the numerator, and two ways to get it wrong — forget
 * the leftover part, or add the whole number to the denominator.
 * @param {Frac} D (improper, d > 1)
 */
export function convertChoices(D) {
  const w = Math.floor(D.n / D.d);
  const raw = [
    { n: D.n, kind: "right", correct: true },
    { n: w * D.d, kind: "noAdd", correct: false },
    { n: w + D.d, kind: "addWhole", correct: false },
  ];
  const seen = new Set();
  return raw
    .filter((o) => !seen.has(o.n) && seen.add(o.n))
    .map((o) => ({ ...o, text: `${o.n}/${D.d}` }));
}

/**
 * The written steps that say what the picture already did. Each step names the
 * view it needs (cut, groups) and carries bilingual lines; «x» marks the part
 * of an expression to emphasise.
 * @param {NonNullable<ReturnType<typeof tapeSpec>>} s
 * @param {{ roles?: boolean }} [opt]
 */
export function connectSteps(s, opt = {}) {
  const { D, B, q, P: pc, g, Q } = s;
  const qn = pluralName(q);
  const pcs = pieces(q, pc);
  const gp = pieces(q, g);
  const r = recip(B);
  const r1 = `${r.n}/${r.d}`;
  const unreducedN = D.n * r.n;
  const unreducedD = D.d * r.d;
  const rawProd = unreducedD === 1 ? String(unreducedN) : `${unreducedN}/${unreducedD}`;
  const back = `${Q} × ${fmt(B)} = ${Q * B.n}/${B.d}`;
  const checkExpr = mixed(D) === `${Q * B.n}/${B.d}` ? back : `${back} = «${mixed(D)}»`;
  const steps = [];
  if (opt.roles) {
    steps.push({
      cut: 1,
      groups: Q,
      expr: P(`«${fmt(D)} ÷ ${fmt(B)}»`, `«${fmt(D)} ÷ ${fmt(B)}»`),
      say: P(
        `The total, ${fmt(D)}, is the dividend. The size of each group, ${fmt(B)}, is the divisor. The equation is ${fmt(D)} ÷ ${fmt(B)}.`,
        `El total, ${fmt(D)}, es el dividendo. El tamaño de cada grupo, ${fmt(B)}, es el divisor. La ecuación es ${fmt(D)} ÷ ${fmt(B)}.`,
      ),
    });
  }
  if (isWhole(D)) {
    steps.push({
      cut: q,
      groups: 0,
      expr: P(`1 whole = ${pieces(q, q).en}`, `1 entero = ${pieces(q, q).es}`),
      say: P(
        `Cut every whole into ${qn.en}: each whole holds ${pieces(q, q).en}.`,
        `Corta cada entero en ${qn.es}: cada entero tiene ${pieces(q, q).es}.`,
      ),
    });
    steps.push({
      cut: q,
      groups: 0,
      expr: P(`${D.n} × ${q} = «${pc}» ${qn.en}`, `${D.n} × ${q} = «${pc}» ${qn.es}`),
      say: P(
        `${D.n} wholes hold ${D.n} × ${q} = ${pcs.en}.`,
        `${D.n} enteros tienen ${D.n} × ${q} = ${pcs.es}.`,
      ),
    });
    steps.push({
      cut: q,
      groups: Q,
      expr: P(`${pcs.en} ÷ ${gp.en} = «${Q}»`, `${pcs.es} ÷ ${gp.es} = «${Q}»`),
      say: P(
        `One group is ${gp.en}, so ${pc} ÷ ${g} = ${Q} groups.`,
        `Un grupo es ${gp.es}, así que ${pc} ÷ ${g} = ${Q} grupos.`,
      ),
    });
    steps.push({
      cut: q,
      groups: Q,
      expr: P(
        `${D.n} ÷ ${fmt(B)} = ${D.n} × ${r1} = «${Q}»`,
        `${D.n} ÷ ${fmt(B)} = ${D.n} × ${r1} = «${Q}»`,
      ),
      say: P(
        `The same steps as one move: the reciprocal of ${fmt(B)} is ${r1}. Multiplying by ${r1} cuts the wholes${g > 1 ? ` and then makes groups of ${g}` : ""}: ${D.n} ÷ ${fmt(B)} = ${D.n} × ${r1} = ${Q}.`,
        `Los mismos pasos en un solo movimiento: el recíproco de ${fmt(B)} es ${r1}. Multiplicar por ${r1} corta los enteros${g > 1 ? ` y luego forma grupos de ${g}` : ""}: ${D.n} ÷ ${fmt(B)} = ${D.n} × ${r1} = ${Q}.`,
      ),
    });
  } else {
    steps.push({
      cut: q,
      groups: 0,
      expr: P(
        D.d === q ? `${fmt(D)} = «${pcs.en}»` : `${fmt(D)} = «${pc}/${q}»`,
        D.d === q ? `${fmt(D)} = «${pcs.es}»` : `${fmt(D)} = «${pc}/${q}»`,
      ),
      say:
        D.d === q
          ? P(
              `${fmt(D)} is already in ${qn.en}: ${pcs.en}.`,
              `${fmt(D)} ya está en ${qn.es}: ${pcs.es}.`,
            )
          : P(
              `Rename ${fmt(D)} in ${qn.en}: the same length, cut into smaller pieces. ${fmt(D)} = ${pc}/${q}.`,
              `Escribe ${fmt(D)} en ${qn.es}: la misma longitud, cortada en piezas más pequeñas. ${fmt(D)} = ${pc}/${q}.`,
            ),
    });
    steps.push({
      cut: q,
      groups: Q,
      expr: P(`${pcs.en} ÷ ${gp.en} = «${Q}»`, `${pcs.es} ÷ ${gp.es} = «${Q}»`),
      say: P(
        `Now the pieces are the same size, so just count: ${pcs.en} ÷ ${gp.en} = ${Q}.`,
        `Ahora las piezas son del mismo tamaño, así que solo cuenta: ${pcs.es} ÷ ${gp.es} = ${Q}.`,
      ),
    });
    const sameExpr = `${fmt(D)} × ${r1} = ${rawProd}${rawProd === String(Q) ? "" : ` = ${Q}`}`;
    steps.push({
      cut: q,
      groups: Q,
      expr: P(
        `${fmt(D)} ÷ ${fmt(B)} = ${sameExpr.replace(/ = (\d+)$/, " = «$1»")}`,
        `${fmt(D)} ÷ ${fmt(B)} = ${sameExpr.replace(/ = (\d+)$/, " = «$1»")}`,
      ),
      say: P(
        `The reciprocal shortcut gives the same answer: ${fmt(D)} ÷ ${fmt(B)} = ${fmt(D)} × ${r1} = ${Q}.`,
        `El atajo del recíproco da la misma respuesta: ${fmt(D)} ÷ ${fmt(B)} = ${fmt(D)} × ${r1} = ${Q}.`,
      ),
    });
  }
  steps.push({
    cut: q,
    groups: Q,
    expr: P(checkExpr, checkExpr),
    say: P(
      `Check by multiplying: ${Q} × ${fmt(B)} = ${mixed(D)}. It matches the total, so ${fmt(D)} ÷ ${fmt(B)} = ${Q}.`,
      `Comprueba multiplicando: ${Q} × ${fmt(B)} = ${mixed(D)}. Coincide con el total, así que ${fmt(D)} ÷ ${fmt(B)} = ${Q}.`,
    ),
  });
  return steps;
}

/** The mixed-number lines (6-10): only built when the dividend is a mixed number. @param {Frac} D */
function mixedCopy(D) {
  const Dt = mixed(D);
  return {
    convertSay: P(
      `${Dt} is a mixed number: wholes and a part. Write it as one fraction of ${pluralName(D.d).en}.`,
      `${Dt} es un número mixto: enteros y una parte. Escríbelo como una sola fracción de ${pluralName(D.d).es}.`,
    ),
    convertQ: P(`${Dt} = ?/${D.d}`, `${Dt} = ?/${D.d}`),
    convertCue: {
      noAdd: P(
        `Count the ${pluralName(D.d).en} in the picture: ${Math.floor(D.n / D.d)} wholes make ${Math.floor(D.n / D.d) * D.d}. What about the part that is left over?`,
        `Cuenta los ${pluralName(D.d).es} en el dibujo: ${Math.floor(D.n / D.d)} enteros dan ${Math.floor(D.n / D.d) * D.d}. ¿Y la parte que sobra?`,
      ),
      addWhole: P(
        `Each whole is cut into ${D.d} pieces. Add the whole number to the ${D.d}? Count the pieces in ONE whole, then in all the wholes.`,
        `Cada entero se corta en ${D.d} piezas. ¿Sumar el número entero a ${D.d}? Cuenta las piezas de UN entero y luego de todos los enteros.`,
      ),
    },
    convertOk: P(
      `Yes: ${Math.floor(D.n / D.d)} × ${D.d} = ${Math.floor(D.n / D.d) * D.d}, plus ${D.n - Math.floor(D.n / D.d) * D.d} is ${D.n}. So ${Dt} = ${fmt(D)}.`,
      `Sí: ${Math.floor(D.n / D.d)} × ${D.d} = ${Math.floor(D.n / D.d) * D.d}, más ${D.n - Math.floor(D.n / D.d) * D.d} es ${D.n}. Así que ${Dt} = ${fmt(D)}.`,
    ),
  };
}

/**
 * Every bilingual line the play speaks, from the validated config.
 * @param {NonNullable<ReturnType<typeof validateFractionGroups>>} v
 */
export function fractionGroupsCopy(v) {
  const { mode, main, transfer, extra } = v;
  const { D, B, Q, q } = main.spec;
  const Dt = mode === "mixed" ? mixed(D) : fmt(D);
  const Bt = fmt(B);
  const noun = main.noun;
  const t = transfer.spec;
  const Tt = mode === "mixed" ? mixed(t.D) : fmt(t.D);
  const txt = (/** @type {Frac} */ f) => (mode === "mixed" ? mixed(f) : fmt(f));
  const titleTail = `${Dt} ÷ ${Bt}`;
  return {
    kicker: P("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: P(`How many groups fit? ${titleTail}`, `¿Cuántos grupos caben? ${titleTail}`),
    ariaLabel: P(
      `A tape ${Dt} long. A group is ${Bt} long. The tape is cut into pieces of one size and groups of ${Bt} are laid along it: ${Q} groups fit exactly, so ${Dt} ÷ ${Bt} = ${Q}.`,
      `Una cinta de ${Dt} de largo. Un grupo mide ${Bt}. La cinta se corta en piezas de un mismo tamaño y los grupos de ${Bt} se colocan a lo largo: caben ${Q} grupos exactos, así que ${Dt} ÷ ${Bt} = ${Q}.`,
    ),
    printSummary: P(
      `${Dt} ÷ ${Bt} asks how many groups of ${Bt} fit in ${Dt}. Cut into ${pluralName(q).en}: ${pieces(q, main.spec.P).en} ÷ ${pieces(q, main.spec.g).en} = ${Q}. Check: ${Q} × ${Bt} = ${Dt}. Then ${Tt} ÷ ${fmt(t.B)} = ${t.Q}.`,
      `${Dt} ÷ ${Bt} pregunta cuántos grupos de ${Bt} caben en ${Dt}. Cortado en ${pluralName(q).es}: ${pieces(q, main.spec.P).es} ÷ ${pieces(q, main.spec.g).es} = ${Q}. Comprueba: ${Q} × ${Bt} = ${Dt}. Luego ${Tt} ÷ ${fmt(t.B)} = ${t.Q}.`,
    ),
    scene: {
      situate: P("The question", "La pregunta"),
      predict: P("Predict", "Predice"),
      place: P("Place the groups", "Coloca los grupos"),
      convert: P("Rename it", "Renómbralo"),
      connect: P("The numbers", "Los números"),
      share: P("Shared equally", "Repartido en partes iguales"),
      bigger: P("A bigger group", "Un grupo más grande"),
      transfer: P("On your own", "Por tu cuenta"),
    },
    word: {
      groups: (/** @type {number} */ k) =>
        k === 1 ? P("1 group", "1 grupo") : P(`${k} groups`, `${k} grupos`),
      shares: (/** @type {number} */ k) =>
        k === 1 ? P("1 share", "1 parte") : P(`${k} shares`, `${k} partes`),
      oneGroup: (/** @type {Frac} */ b) => P(`one group = ${fmt(b)}`, `un grupo = ${fmt(b)}`),
      oneShare: (/** @type {Frac} */ b) => P(`one share = ${fmt(b)}`, `una parte = ${fmt(b)}`),
    },
    situateSay: P(
      `${main.story.en} ${main.question?.en ?? ""} The tape shows ${Dt}. One group is ${Bt}.`.replace(
        /\s+/g,
        " ",
      ),
      `${main.story.es} ${main.question?.es ?? ""} La cinta muestra ${Dt}. Un grupo es ${Bt}.`.replace(
        /\s+/g,
        " ",
      ),
    ),
    predictSay:
      mode === "story"
        ? P(
            "A division equation names the total and the size of each group. Choose the one that matches the question, before you build.",
            "Una ecuación de división nombra el total y el tamaño de cada grupo. Elige la que coincide con la pregunta, antes de construir.",
          )
        : P(
            `Division asks how many groups fit. Predict before you build: how many groups of ${Bt} fit in ${Dt}?`,
            `La división pregunta cuántos grupos caben. Predice antes de construir: ¿cuántos grupos de ${Bt} caben en ${Dt}?`,
          ),
    predictQ:
      mode === "story"
        ? P("Which equation matches the question?", "¿Qué ecuación coincide con la pregunta?")
        : P(`How many groups of ${Bt} fit in ${Dt}?`, `¿Cuántos grupos de ${Bt} caben en ${Dt}?`),
    quotientLabel: (/** @type {Frac} */ x) => P(fmt(x), fmt(x)),
    quotientCue: {
      times: (/** @type {Frac} */ x, /** @type {Spec} */ s) => {
        const [d, b] = [txt(s.D), fmt(s.B)];
        return P(
          `${fmt(x)} is ${d} × ${b}. The question is how many groups of ${b} FIT in ${d}. Look at the tape: how many groups fit?`,
          `${fmt(x)} es ${d} × ${b}. La pregunta es cuántos grupos de ${b} CABEN en ${d}. Mira la cinta: ¿cuántos grupos caben?`,
        );
      },
      swap: (/** @type {Frac} */ x, /** @type {Spec} */ s) => {
        const [d, b] = [txt(s.D), fmt(s.B)];
        return P(
          `${fmt(x)} is ${b} ÷ ${d}: how many ${d}s fit in ${b}. Which is longer on the tape?`,
          `${fmt(x)} es ${b} ÷ ${d}: cuántos ${d} caben en ${b}. ¿Cuál es más largo en la cinta?`,
        );
      },
      wholes: (/** @type {Frac} */ x, /** @type {Spec} */ s) =>
        P(
          `${fmt(x)} is only the number of wholes. Compare ONE group of ${fmt(s.B)} with ONE whole on the tape. How do they differ?`,
          `${fmt(x)} es solo el número de enteros. Compara UN grupo de ${fmt(s.B)} con UN entero en la cinta. ¿En qué se diferencian?`,
        ),
      tops: (/** @type {Frac} */ x) =>
        P(
          `${fmt(x)} divides the tops and ignores the sizes of the pieces. Cut the tape into pieces of one size: how many pieces are in the whole amount? How many in one group?`,
          `${fmt(x)} divide los numeradores e ignora el tamaño de las piezas. Corta la cinta en piezas de un mismo tamaño: ¿cuántas piezas hay en toda la cantidad? ¿Cuántas en un grupo?`,
        ),
      pieces: (/** @type {Frac} */ x) =>
        P(
          `${fmt(x)} counts single pieces. But one group is more than one piece. How many groups can you make from those pieces?`,
          `${fmt(x)} cuenta piezas sueltas. Pero un grupo es más de una pieza. ¿Cuántos grupos puedes formar con esas piezas?`,
        ),
    },
    predictOk: P(
      `Yes: ${Q} ${noun.en} fit. Now build it to see why.`,
      `Sí: caben ${Q} ${noun.es}. Ahora constrúyelo para ver por qué.`,
    ),
    equationCue: {
      swap: P(
        `That puts the size of one group first. Which amount is the TOTAL that gets split into groups: ${Dt} or ${Bt}?`,
        `Eso pone primero el tamaño de un grupo. ¿Qué cantidad es el TOTAL que se divide en grupos: ${Dt} o ${Bt}?`,
      ),
      times: P(
        `Multiplying finds a part of a part. The question asks how many groups of ${Bt} fit in ${Dt}. Which operation asks "how many fit"?`,
        `Multiplicar halla una parte de una parte. La pregunta es cuántos grupos de ${Bt} caben en ${Dt}. ¿Qué operación pregunta "cuántos caben"?`,
      ),
      minus: P(
        `Subtracting takes away ONE group of ${Bt}. The question asks how many groups there are in all. Look at the tape: how many groups?`,
        `Restar quita UN grupo de ${Bt}. La pregunta es cuántos grupos hay en total. Mira la cinta: ¿cuántos grupos?`,
      ),
    },
    equationOk: P(
      `Yes: ${Dt} ÷ ${Bt}. The total is the dividend and the size of each group is the divisor.`,
      `Sí: ${Dt} ÷ ${Bt}. El total es el dividendo y el tamaño de cada grupo es el divisor.`,
    ),
    placeSay: P(
      `Place groups of ${Bt} along the tape, one at a time. Stop when the tape is full.`,
      `Coloca grupos de ${Bt} a lo largo de la cinta, de uno en uno. Detente cuando la cinta esté llena.`,
    ),
    placeLabel: P(`Groups of ${Bt}`, `Grupos de ${Bt}`),
    placeLeft: (/** @type {number} */ k) =>
      P(
        k
          ? `${k} × ${Bt} covers part of the tape. Is there room for another group?`
          : `No groups yet. Move the slider.`,
        k
          ? `${k} × ${Bt} cubre una parte de la cinta. ¿Cabe otro grupo?`
          : `Todavía no hay grupos. Mueve el control.`,
      ),
    placeOk: P(
      `${Q} groups of ${Bt} fill the tape exactly: ${Dt} ÷ ${Bt} = ${Q}.`,
      `${Q} grupos de ${Bt} llenan la cinta exactamente: ${Dt} ÷ ${Bt} = ${Q}.`,
    ),
    ...(mode === "mixed" ? mixedCopy(D) : {}),
    nextStep: P("Next step", "Siguiente paso"),
    extra: extra
      ? extra.kind === "share"
        ? {
            say: P(
              `${extra.story.en} ${extra.question?.en ?? "How much does each share hold?"}`.trim(),
              `${extra.story.es} ${extra.question?.es ?? "¿Cuánto tiene cada parte?"}`.trim(),
            ),
            q: P(
              `Which expression asks how much is in each of the ${extra.shares} equal shares?`,
              `¿Qué expresión pregunta cuánto hay en cada una de las ${extra.shares} partes iguales?`,
            ),
            cue: {
              swap: P(
                `Which amount is being shared equally in the story, and which number tells how many shares? The one that is shared goes first.`,
                `¿Qué cantidad se reparte en partes iguales en la historia y qué número dice cuántas partes? La que se reparte va primero.`,
              ),
              flip: P(
                `${fmt(extra.spec.D)} ÷ 1/${extra.shares} asks how many groups of 1/${extra.shares} fit. Here the ${fmt(extra.spec.D)} is split into ${extra.shares} equal shares. Look at the tape: how many shares?`,
                `${fmt(extra.spec.D)} ÷ 1/${extra.shares} pregunta cuántos grupos de 1/${extra.shares} caben. Aquí ${fmt(extra.spec.D)} se divide en ${extra.shares} partes iguales. Mira la cinta: ¿cuántas partes?`,
              ),
              times: P(
                `Multiplying by ${extra.shares} makes ${fmt(extra.spec.D)} bigger. Is one share bigger or smaller than the whole ${fmt(extra.spec.D)}?`,
                `Multiplicar por ${extra.shares} hace más grande ${fmt(extra.spec.D)}. ¿Una parte es más grande o más pequeña que todo ${fmt(extra.spec.D)}?`,
              ),
            },
            ok: P(
              `Yes: ${fmt(extra.spec.D)} ÷ ${extra.shares} = ${fmt(extra.spec.B)}. The tape shows ${extra.shares} equal shares of ${fmt(extra.spec.B)}. Check: ${extra.shares} × ${fmt(extra.spec.B)} = ${fmt(extra.spec.D)}.`,
              `Sí: ${fmt(extra.spec.D)} ÷ ${extra.shares} = ${fmt(extra.spec.B)}. La cinta muestra ${extra.shares} partes iguales de ${fmt(extra.spec.B)}. Comprueba: ${extra.shares} × ${fmt(extra.spec.B)} = ${fmt(extra.spec.D)}.`,
            ),
          }
        : {
            say: P(
              `${extra.story.en} ${extra.question?.en ?? ""}`.trim(),
              `${extra.story.es} ${extra.question?.es ?? ""}`.trim(),
            ),
            q: P(
              `How many groups of ${fmt(extra.spec.B)} fit in ${fmt(extra.spec.D)}?`,
              `¿Cuántos grupos de ${fmt(extra.spec.B)} caben en ${fmt(extra.spec.D)}?`,
            ),
            ok: P(
              `Yes: ${extra.spec.Q} groups. One group is ${extra.spec.g} ${pluralName(extra.spec.q).en}, and ${fmt(extra.spec.D)} is ${extra.spec.P} ${pluralName(extra.spec.q).en}: ${extra.spec.P} ÷ ${extra.spec.g} = ${extra.spec.Q}. Check: ${extra.spec.Q} × ${fmt(extra.spec.B)} = ${fmt(extra.spec.D)}.`,
              `Sí: ${extra.spec.Q} grupos. Un grupo son ${extra.spec.g} ${pluralName(extra.spec.q).es} y ${fmt(extra.spec.D)} son ${extra.spec.P} ${pluralName(extra.spec.q).es}: ${extra.spec.P} ÷ ${extra.spec.g} = ${extra.spec.Q}. Comprueba: ${extra.spec.Q} × ${fmt(extra.spec.B)} = ${fmt(extra.spec.D)}.`,
            ),
          }
      : null,
    transferSay: P(
      `${transfer.story.en} ${transfer.question?.en ?? ""} The tape shows ${Tt}; one group is ${fmt(t.B)}.`.replace(
        /\s+/g,
        " ",
      ),
      `${transfer.story.es} ${transfer.question?.es ?? ""} La cinta muestra ${Tt}; un grupo es ${fmt(t.B)}.`.replace(
        /\s+/g,
        " ",
      ),
    ),
    transferQ: P(
      `How many groups of ${fmt(t.B)} fit in ${Tt}?`,
      `¿Cuántos grupos de ${fmt(t.B)} caben en ${Tt}?`,
    ),
    transferOk: P(
      `Yes: ${t.Q} ${transfer.noun.en}. ${Tt} ÷ ${fmt(t.B)} = ${t.Q}. Check: ${t.Q} × ${fmt(t.B)} = ${Tt}.`,
      `Sí: ${t.Q} ${transfer.noun.es}. ${Tt} ÷ ${fmt(t.B)} = ${t.Q}. Comprueba: ${t.Q} × ${fmt(t.B)} = ${Tt}.`,
    ),
    explainLabel: P(
      "Explain: how does the picture show the answer?",
      "Explica: ¿cómo muestra el dibujo la respuesta?",
    ),
    explainFrame:
      mode === "story"
        ? P(
            `The total is ___ and the size of each group is ___, so the equation is ___.`,
            `El total es ___ y el tamaño de cada grupo es ___, así que la ecuación es ___.`,
          )
        : isWhole(D)
          ? P(
              `Each whole holds ___ pieces, so ${t.D.n} wholes hold ___ pieces.`,
              `Cada entero tiene ___ piezas, así que ${t.D.n} enteros tienen ___ piezas.`,
            )
          : P(
              `I renamed ${Tt} as ___, then ___ pieces ÷ ___ piece = ___.`,
              `Renombré ${Tt} como ___, luego ___ piezas ÷ ___ pieza = ___.`,
            ),
  };
}
