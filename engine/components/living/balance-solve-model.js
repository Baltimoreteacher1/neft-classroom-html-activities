// living/balance-solve-model.js — the mathematics and words of the balance-solve
// play (lessons 8-1, 8-2, 8-3, 8-7), with no DOM.
//
// Every equation here is ONE step: x + a = b, x − a = b, a·x = b or x ÷ a = b
// with a whole-number solution. `stages(eq)` says what each pan holds before,
// during and after the inverse operation; the balance invariant (both pans
// always hold the same total) is checked by balance-solve.test.mjs.
//
// Modes: "test" (8-1: is a value a solution?), "inverse" (8-2, 8-3: do the same
// inverse operation to both sides), "model" (8-7: write the model from a story,
// solve it, then tell an equation from an inequality).

import { okInt, placeCorrect } from "./mean-balance-model.js";

export { okInt, placeCorrect };

export const MAX_PARTS = 6; // pieces a pan can hold (a in a·x and x ÷ a)
export const POOL = MAX_PARTS;
export const MIN_PIECE_PX = 30; // narrowest drawn piece, in stage units
export const PAN_PX = 176; // drawable width of one pan

const FORMS = ["add", "sub", "mul", "div"];
const SYMS = ["<", ">", "≤", "≥"];

export const pair = (en, es) => ({ en, es });
export const clean = (p, max = 300) =>
  p && typeof p.en === "string" && p.en.trim()
    ? {
        en: p.en.trim().slice(0, max),
        es: String(p.es || p.en)
          .trim()
          .slice(0, max),
      }
    : null;

/** @returns {{form:string,a:number,b:number,x:number,L:string}|null} */
export function makeEq(spec) {
  const { form, a, b } = spec || {};
  if (!FORMS.includes(form) || !okInt(a, 1, 99) || !okInt(b, 1, 999)) return null;
  const L = typeof spec.letter === "string" && /^[a-z]$/i.test(spec.letter) ? spec.letter : "x";
  const multi = form === "mul" || form === "div";
  if (multi && !okInt(a, 2, MAX_PARTS)) return null;
  const x = { add: b - a, sub: b + a, mul: b / a, div: b * a }[form];
  if (!okInt(x, 1, 999)) return null;
  return { form, a, b, x, L };
}

/** Left side as text: "n + 23", "x − 4", "3x", "x ÷ 4". */
export const lhsText = (e) =>
  ({
    add: `${e.L} + ${e.a}`,
    sub: `${e.L} − ${e.a}`,
    mul: `${e.a}${e.L}`,
    div: `${e.L} ÷ ${e.a}`,
  })[e.form];
export const eqText = (e) => `${lhsText(e)} = ${e.b}`;
export const solText = (e) => `${e.L} = ${e.x}`;
/** The line after the inverse op: "n + 23 − 23 = 58 − 23". */
const opSym = { add: "−", sub: "+", mul: "÷", div: "×" }; // inverse of each form
export const stepText = (e) =>
  `${lhsText(e)} ${opSym[e.form]} ${e.a} = ${e.b} ${opSym[e.form]} ${e.a}`;
/** Substituting v for the letter: left value and the line "35 + 23 = 58". */
export const lhsValue = (e, v) =>
  ({ add: v + e.a, sub: v - e.a, mul: e.a * v, div: v / e.a })[e.form];
export const subText = (e, v) =>
  ({
    add: `${v} + ${e.a}`,
    sub: `${v} − ${e.a}`,
    mul: `${e.a} × ${v}`,
    div: `${v} ÷ ${e.a}`,
  })[e.form];
export const checkText = (e, v = e.x) => `${subText(e, v)} = ${lhsValue(e, v)}`;

const inverseKind = { add: "sub", sub: "add", mul: "div", div: "mul" };
const sameKind = { add: "add", sub: "sub", mul: "mul", div: "div" };
/** "Subtract 23 from both sides". */
export function opWord(kind, a) {
  return {
    sub: pair(`Subtract ${a} from both sides`, `Resta ${a} en los dos lados`),
    add: pair(`Add ${a} to both sides`, `Suma ${a} en los dos lados`),
    div: pair(`Divide both sides by ${a}`, `Divide los dos lados entre ${a}`),
    mul: pair(`Multiply both sides by ${a}`, `Multiplica los dos lados por ${a}`),
  }[kind];
}
const oneSideWord = (kind, a) =>
  ({
    sub: pair(`Subtract ${a} from the left side only`, `Resta ${a} solo en el lado izquierdo`),
    add: pair(`Add ${a} to the left side only`, `Suma ${a} solo en el lado izquierdo`),
    div: pair(`Divide the left side only by ${a}`, `Divide solo el lado izquierdo entre ${a}`),
    mul: pair(`Multiply the left side only by ${a}`, `Multiplica solo el lado izquierdo por ${a}`),
  })[kind];
export const readEq = (e) => {
  const [L, a, b] = [e.L, e.a, e.b];
  return {
    add: pair(`${L} plus ${a} equals ${b}`, `${L} más ${a} es igual a ${b}`),
    sub: pair(`${L} minus ${a} equals ${b}`, `${L} menos ${a} es igual a ${b}`),
    mul: pair(`${a} times ${L} equals ${b}`, `${a} por ${L} es igual a ${b}`),
    div: pair(`${L} divided by ${a} equals ${b}`, `${L} dividido entre ${a} es igual a ${b}`),
  }[e.form];
};

// ---- the pans -------------------------------------------------------------

/**
 * A piece: v = width in value units, kind = x (the unknown) | k (a known
 * amount) | ghost (the part "taken away" / "the rest of x"), o = shown, lift =
 * px above its resting place (pieces rise as they leave).
 * @typedef {{v:number,label:string,kind:string,o:number,lift:number}} Piece
 */
export const P = (v, label, kind = "k", o = 1, lift = 0) => ({ v, label, kind, o, lift });
const GONE = (v = 1) => P(v, "", "k", 0, 0);
const padPan = (a) =>
  [...a, ...Array.from({ length: POOL - a.length }, () => GONE())].slice(0, POOL);
export const pan = (a) => padPan(a);
export const shown = (side) => side.filter((p) => p.o && p.kind !== "ghost");
export const total = (side) => shown(side).reduce((s, p) => s + p.v, 0);

/**
 * Start, middle and end of "do the inverse operation to both sides".
 * Each stage: { L: Piece[POOL], R: Piece[POOL], top: {L, R} }.
 */
export function stages(e) {
  const { a, b, x, L } = e;
  const t0 = lhsText(e);
  const mid = `${t0} ${opSym[e.form]} ${a}`;
  const midR = `${b} ${opSym[e.form]} ${a}`;
  const lifted = (p) => ({ ...p, o: 0, lift: 26 });
  if (e.form === "add") {
    const start = { L: [P(x, L, "x"), P(a, String(a))], R: [P(b, String(b))] };
    const split = { L: start.L, R: [P(x, String(x)), P(a, String(a))] };
    const end = { L: [start.L[0], lifted(start.L[1])], R: [split.R[0], lifted(split.R[1])] };
    return mk(e, start, split, end, [t0, String(b)], [mid, midR], [L, String(x)]);
  }
  if (e.form === "sub") {
    const start = { L: [P(b, t0, "x"), P(a, `−${a}`, "ghost")], R: [P(b, String(b))] };
    const solid = {
      L: [P(b, t0, "x"), P(a, String(a), "k")],
      R: [P(b, String(b)), P(a, String(a))],
    };
    const end = { L: [P(x, L, "x")], R: [P(x, String(x))] };
    const from = { ...start, R: [start.R[0], { ...solid.R[1], o: 0, lift: 26 }] };
    return mk(e, from, solid, end, [t0, String(b)], [mid, midR], [L, String(x)]);
  }
  const parts = (v, label, kind = "x") => Array.from({ length: a }, () => P(v, label, kind));
  if (e.form === "mul") {
    const start = { L: parts(x, L), R: [P(b, String(b))] };
    const split = { L: start.L, R: parts(x, `${b} ÷ ${a}`, "k") };
    const keepL = start.L.map((p, i) => (i ? lifted(p) : p));
    const keepR = split.R.map((p, i) => (i ? lifted(p) : { ...p, label: String(x) }));
    return mk(
      e,
      start,
      split,
      { L: keepL, R: keepR },
      [t0, String(b)],
      [mid, midR],
      [L, String(x)],
    );
  }
  // div: x ÷ a = b — one share is solid, the rest of x is the dashed ghost.
  const start = {
    L: [P(b, t0, "x"), ...Array.from({ length: a - 1 }, () => P(b, "", "ghost"))],
    R: [P(b, String(b))],
  };
  const grown = {
    L: start.L.map((_p, i) => P(b, i ? "" : t0, "x")),
    R: Array.from({ length: a }, () => P(b, String(b))),
  };
  const gone = (n) => Array.from({ length: n }, () => ({ ...GONE(b) }));
  const end = {
    L: [P(x, L, "x"), ...gone(a - 1)],
    R: [P(x, String(x)), ...gone(a - 1)],
  };
  const from = {
    ...start,
    R: [start.R[0], ...Array.from({ length: a - 1 }, () => ({ ...GONE(b), lift: 26 }))],
  };
  return mk(e, from, grown, end, [t0, String(b)], [mid, midR], [L, String(x)]);
}

function mk(_e, start, mid, end, topA, topB, topC) {
  const wrap = (s, top) => ({ L: pan(s.L), R: pan(s.R), top: { L: top[0], R: top[1] } });
  return { start: wrap(start, topA), mid: wrap(mid, topB), end: wrap(end, topC) };
}

/** Stage scale (px per unit) so the largest pan content fills one pan. */
export function scaleFor(e) {
  return PAN_PX / Math.max(e.b, e.x);
}
/** True when every drawn piece is wide enough to read. */
export function drawable(e) {
  const s = scaleFor(e);
  const widths = { add: [e.x, e.a], sub: [e.b, e.a], mul: [e.x], div: [e.b] }[e.form];
  return widths.every((w) => w * s >= MIN_PIECE_PX);
}

// ---- test mode: substitute a value and watch the scale ---------------------

/** Beam tilt in px for the left end (positive = left side lower = heavier). */
export const tiltFor = (diff) =>
  diff === 0 ? 0 : Math.sign(diff) * Math.min(22, 8 + 2 * Math.abs(diff));

// ---- choices ----------------------------------------------------------------

/**
 * "Which move gets the letter alone and keeps the scale balanced?" Four moves;
 * exactly one is the inverse operation on BOTH sides. Each wrong move carries a
 * cue: a tilt on the picture, or a check by substituting. Never the answer.
 */
export function opChoices(e) {
  const { a, b, x, L, form } = e;
  const inv = inverseKind[form];
  const same = sameKind[form];
  const cueOne = pair(
    "Look at the scale: it tips. Changing only one side breaks the balance. What has to happen to the other side?",
    "Mira la balanza: se inclina. Cambiar solo un lado rompe el equilibrio. ¿Qué tiene que pasar en el otro lado?",
  );
  const fourth = {
    add: {
      label: pair(
        `Move ${a} to the right side unchanged`,
        `Pasa el ${a} al lado derecho sin cambiarlo`,
      ),
      cue: pair(
        `That gives ${L} = ${b + a}. Check by substituting: ${b + a} + ${a} = ${b + 2 * a}, not ${b}. Which operation really undoes + ${a}?`,
        `Eso da ${L} = ${b + a}. Comprueba sustituyendo: ${b + a} + ${a} = ${b + 2 * a}, no ${b}. ¿Qué operación deshace de verdad + ${a}?`,
      ),
    },
    sub: {
      label: pair(`Subtract ${a} from the ${b}`, `Resta ${a} de ${b}`),
      cue: pair(
        `That gives ${L} = ${b - a}. Check by substituting: ${b - a} − ${a} = ${b - 2 * a}, not ${b}. The − ${a} took ${a} away from ${L}. How do you put it back?`,
        `Eso da ${L} = ${b - a}. Comprueba sustituyendo: ${b - a} − ${a} = ${b - 2 * a}, no ${b}. El − ${a} le quitó ${a} a ${L}. ¿Cómo se lo devuelves?`,
      ),
    },
    mul: {
      label: opWord("sub", a),
      cue: pair(
        `That leaves ${a}${L} − ${a} = ${b - a}. Is ${L} alone? ${a}${L} is ${a} groups of ${L}. What turns ${a} groups back into 1 group?`,
        `Eso deja ${a}${L} − ${a} = ${b - a}. ¿Quedó ${L} sola? ${a}${L} son ${a} grupos de ${L}. ¿Qué convierte ${a} grupos otra vez en 1 grupo?`,
      ),
    },
    div: {
      label: opWord("sub", a),
      cue: pair(
        `That leaves ${L} ÷ ${a} − ${a} = ${b - a}, and ${L} is still divided by ${a}. What undoes ÷ ${a}?`,
        `Eso deja ${L} ÷ ${a} − ${a} = ${b - a}, y ${L} sigue dividida entre ${a}. ¿Qué deshace ÷ ${a}?`,
      ),
    },
  }[form];
  const sameCue = {
    add: pair(
      `Both sides stay equal: ${L} + ${2 * a} = ${b + a}. But is ${L} alone? What undoes + ${a}?`,
      `Los dos lados siguen iguales: ${L} + ${2 * a} = ${b + a}. Pero ¿quedó ${L} sola? ¿Qué deshace + ${a}?`,
    ),
    sub: pair(
      `Both sides stay equal, but ${L} − ${2 * a} takes even more away from ${L}. What puts the ${a} back?`,
      `Los dos lados siguen iguales, pero ${L} − ${2 * a} le quita todavía más a ${L}. ¿Qué devuelve el ${a}?`,
    ),
    mul: pair(
      `Both sides stay equal: ${a * a}${L} = ${a * b}. But ${L} is multiplied by even more. What undoes multiplying by ${a}?`,
      `Los dos lados siguen iguales: ${a * a}${L} = ${a * b}. Pero ${L} queda multiplicada por todavía más. ¿Qué deshace multiplicar por ${a}?`,
    ),
    div: pair(
      `Both sides stay equal, but ${L} ÷ ${a} ÷ ${a} divides ${L} even more. What undoes dividing by ${a}?`,
      `Los dos lados siguen iguales, pero ${L} ÷ ${a} ÷ ${a} divide ${L} todavía más. ¿Qué deshace dividir entre ${a}?`,
    ),
  }[form];
  const options = [
    { id: "inverse", label: opWord(inv, a), correct: true },
    { id: "one", label: oneSideWord(inv, a), cue: cueOne, tilt: true },
    { id: "same", label: opWord(same, a), cue: sameCue },
    { id: "move", label: fourth.label, cue: fourth.cue },
  ];
  return placeCorrect(options, b + x + a);
}

/** The pans after the inverse op on the LEFT only: the scale tips. */
export function oneSidePans(e) {
  const st = stages(e);
  return { L: st.end.L, R: st.start.R, diff: e.x - e.b };
}

/** "Which model matches the story?" for the model mode: one equation + three traps. */
export function modelChoices(e, sym) {
  const { a, b, L, form } = e;
  const swap = { add: "sub", sub: "add", mul: "div", div: "mul" }[form];
  const other = form === "add" || form === "sub" ? "mul" : "sub";
  const eqOf = (f) => makeEq({ form: f, a, b, letter: L }) || { form: f, a, b, L, x: 1 };
  const t = (f) => `${lhsText(eqOf(f))} = ${b}`;
  const readBack = (f) => readEq(eqOf(f));
  const same = (f) => {
    const r = readBack(f);
    return pair(
      `Read it aloud: “${r.en}”. Now check it against the story: is that what happens?`,
      `Léela en voz alta: «${r.es}». Ahora compárala con la historia: ¿eso es lo que pasa?`,
    );
  };
  const ineq = `${lhsText(e)} ${sym} ${b}`;
  return placeCorrect(
    [
      { id: "eq", text: eqText(e), correct: true },
      { id: "swap", text: t(swap), cue: same(swap) },
      { id: "other", text: t(other), cue: same(other) },
      {
        id: "ineq",
        text: ineq,
        cue: pair(
          `The story gives one exact amount, ${b}. A limit like “${sym}” allows many amounts. Is the story one exact amount, or a range?`,
          `La historia da una cantidad exacta, ${b}. Un límite como «${sym}» permite muchas cantidades. ¿La historia da una cantidad exacta o un rango?`,
        ),
      },
    ],
    a + b + e.x,
  );
}

const symWords = {
  "<": pair("less than", "menos de"),
  ">": pair("more than", "más de"),
  "≤": pair("at most", "como máximo"),
  "≥": pair("at least", "al menos"),
};
export const symWord = (s) => symWords[s];

/** Equation-or-inequality choices for the transfer story of the model mode. */
export function contrastChoices(c) {
  const { L, sym, limit } = c;
  const opp = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" }[sym];
  const incl = { "<": "≤", ">": "≥", "≤": "<", "≥": ">" }[sym];
  const far = sym === "<" || sym === "≤" ? limit + 10 : Math.max(0, limit - 10);
  const w = symWords[sym];
  const options = [
    {
      id: "eq",
      text: `${L} = ${limit}`,
      cue: pair(
        `Could ${L} be a different amount and still fit the story? If many amounts fit, one equals sign says too little.`,
        `¿Podría ${L} ser otra cantidad y aun así cumplir la historia? Si caben muchas cantidades, un solo signo igual dice muy poco.`,
      ),
    },
    { id: "ok", text: `${L} ${sym} ${limit}`, correct: true },
    {
      id: "opp",
      text: `${L} ${opp} ${limit}`,
      cue: pair(
        `Test a value: is ${far} ${w.en} ${limit}? Does it fit the story?`,
        `Prueba un valor: ¿${far} es ${w.es} ${limit}? ¿Cumple la historia?`,
      ),
    },
    {
      id: "incl",
      text: `${L} ${incl} ${limit}`,
      cue: pair(
        `Does “${w.en} ${limit}” include ${limit} itself? Compare it with the other words: at most, at least, less than, more than.`,
        `¿«${w.es} ${limit}» incluye el ${limit}? Compárala con las otras palabras: como máximo, al menos, menos de, más de.`,
      ),
    },
  ];
  return placeCorrect(options, limit + sym.length + 3);
}

// ---- validation -------------------------------------------------------------

export function validateBalanceSolve(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const mode = cfg.mode;
  if (!["inverse", "model"].includes(mode)) return null;
  const eq = makeEq(cfg);
  if (!eq) return null;
  const story = clean(cfg.story);
  const base = {
    mode,
    eq,
    story,
    prefix: typeof cfg.prefix === "string" ? cfg.prefix.slice(0, 2) : "",
  };
  const tr = cfg.transfer;
  if (!drawable(eq)) return null;
  const t2 = makeEq(tr || {});
  if (mode === "inverse") {
    if (!t2 || !drawable(t2) || t2.form === eq.form) return null;
    if ((eq.form === "add" || eq.form === "sub") !== (t2.form === "add" || t2.form === "sub"))
      return null; // both equations from the lesson's one family
    return { ...base, transfer: { eq: t2 } };
  }
  // model: a story with an exact total, and a second story with a limit.
  const reason = clean(cfg.reason);
  const ts = clean(tr?.story);
  const sym = tr?.sym;
  const limit = Number(tr?.limit);
  const ex = Number(tr?.example);
  const L2 = typeof tr?.letter === "string" && /^[a-z]$/i.test(tr.letter) ? tr.letter : "x";
  if (!story || !reason || !ts || !SYMS.includes(sym) || !okInt(limit, 2, 999)) return null;
  const lower = sym === "<" || sym === "≤";
  if (!okInt(ex, 1, 999) || (lower ? ex >= limit : ex <= limit)) return null;
  if (Math.min(ex, limit) * (PAN_PX / Math.max(ex, limit)) < MIN_PIECE_PX) return null;
  return { ...base, reason, transfer: { story: ts, sym, limit, example: ex, L: L2 } };
}

// ---- words ------------------------------------------------------------------

const fmtN = (v) => String(Math.round(v * 100) / 100);

/** Three wrong values for "what does the letter equal?", each a real slip. */
export function wrongValues(e) {
  const out = [];
  for (const w of [e.b + e.a, e.b - e.a, e.b, e.a, e.b * e.a]) {
    if (w >= 1 && w !== e.x && !out.includes(w) && out.length < 3) out.push(w);
  }
  return out;
}

/** Predict-the-solution choices for the inverse and model modes. */
export function resultChoices(e) {
  const miss = (w) => ({
    id: `v${w}`,
    text: String(w),
    cue: pair(
      `Substitute ${w} for ${e.L}: ${subText(e, w)} = ${fmtN(lhsValue(e, w))}. The other side is ${e.b}. Do they match?`,
      `Sustituye ${w} en lugar de ${e.L}: ${subText(e, w)} = ${fmtN(lhsValue(e, w))}. El otro lado es ${e.b}. ¿Coinciden?`,
    ),
  });
  const opts = [{ id: "ok", text: String(e.x), correct: true }, ...wrongValues(e).map(miss)];
  return placeCorrect(opts, e.b + e.a + 1);
}

/**
 * Every sentence the play says, as {en, es} pairs, from a validated config.
 * @returns {any}
 */
export function balanceCopy(v) {
  const { mode, eq: e } = v;
  const { a, b, x, L } = e;
  const inv = inverseKind[e.form];
  const story = v.story;
  const kicker = pair("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo");
  const sc = (...xs) => xs.map(([en, es]) => pair(en, es));
  const opQ = (q) =>
    pair(
      `Which move gets ${q.L} alone and keeps the scale balanced?`,
      `¿Qué movimiento deja sola a ${q.L} y mantiene la balanza equilibrada?`,
    );
  const opOk = (q = e) =>
    pair(
      `${stepText(q)}, so ${solText(q)}. The same move on both sides keeps the scale balanced. Check: ${checkText(q)} is true.`,
      `${stepText(q)}, así que ${solText(q)}. El mismo movimiento en los dos lados mantiene la balanza equilibrada. Comprueba: ${checkText(q)} es verdadero.`,
    );
  const ladder = (q = e) => [eqText(q), stepText(q), solText(q), `✓ ${checkText(q)}`];
  const t = mode === "inverse" ? v.transfer.eq : null;
  const lhs = lhsText(e);
  const common = {
    kicker,
    opQ,
    opOk,
    ladder,
    inverseWord: opWord(inv, a),
    explainLabel: pair(
      "Explain: why must you do the same thing to both sides?",
      "Explica: ¿por qué hay que hacer lo mismo en los dos lados?",
    ),
    explainFrame: pair(
      "If I change only one side, the scale ___. So I ___ on both sides.",
      "Si cambio solo un lado, la balanza ___. Por eso ___ en los dos lados.",
    ),
    predictResultQ: pair(`${L} equals…`, `${L} es igual a…`),
    predictResultOk: pair(
      `Right: ${L} = ${x}. Now watch how to get there while the scale stays balanced.`,
      `Correcto: ${L} = ${x}. Ahora mira cómo llegar ahí sin perder el equilibrio de la balanza.`,
    ),
  };
  if (mode === "inverse") {
    return {
      ...common,
      title: pair("Solve by balancing", "Resuelve con equilibrio"),
      ariaLabel: pair(
        `A balance scale holding ${lhs} on the left and ${b} on the right. The same inverse operation on both sides leaves ${L} alone.`,
        `Una balanza con ${lhs} a la izquierda y ${b} a la derecha. La misma operación inversa en los dos lados deja sola a ${L}.`,
      ),
      printSummary: pair(
        `${eqText(e)}: the scale balances. Do the inverse operation to both sides: ${stepText(e)}, so ${solText(e)}. Check: ${checkText(e)}. Then ${eqText(t)} works the same way: ${stepText(t)}, so ${solText(t)}.`,
        `${eqText(e)}: la balanza está equilibrada. Haz la operación inversa en los dos lados: ${stepText(e)}, así que ${solText(e)}. Comprueba: ${checkText(e)}. Luego ${eqText(t)} funciona igual: ${stepText(t)}, así que ${solText(t)}.`,
      ),
      labels: sc(
        ["The balance", "La balanza"],
        ["Predict", "Predice"],
        ["Keep it balanced", "Mantén el equilibrio"],
        ["Symbols", "Símbolos"],
        ["On your own", "Por tu cuenta"],
      ),
      situateSay: pair(
        `${story ? `${story.en} ` : ""}The scale is balanced: ${lhs} weighs the same as ${b}. The goal is to get ${L} alone on one side.`,
        `${story ? `${story.es} ` : ""}La balanza está equilibrada: ${lhs} pesa lo mismo que ${b}. La meta es dejar sola a ${L} en un lado.`,
      ),
      predictSay: pair(
        `Before we move anything: what do you think ${L} equals?`,
        `Antes de mover nada: ¿a qué crees que es igual ${L}?`,
      ),
      opSay: pair(
        "Now make it happen on the scale. Choose a move.",
        "Ahora hazlo en la balanza. Elige un movimiento.",
      ),
      connectSay: pair(
        `The same steps in symbols. The balance fades, but the equal sign keeps meaning “both sides match.”`,
        `Los mismos pasos en símbolos. La balanza se desvanece, pero el signo igual sigue significando «los dos lados coinciden».`,
      ),
      transferSay: pair(
        `A new equation, ${eqText(t)}. Which move gets ${L} alone?`,
        `Una ecuación nueva, ${eqText(t)}. ¿Qué movimiento deja sola a ${L}?`,
      ),
    };
  }
  const c = v.transfer;
  const w = symWords[c.sym];
  return {
    ...common,
    title: pair("Write it, solve it, check it", "Escríbelo, resuélvelo, compruébalo"),
    ariaLabel: pair(
      `A balance scale: ${lhs} on the left, ${b} on the right. Then a second scale tips because a story gives a limit, not one exact amount.`,
      `Una balanza: ${lhs} a la izquierda, ${b} a la derecha. Luego una segunda balanza se inclina porque la historia da un límite, no una cantidad exacta.`,
    ),
    printSummary: pair(
      `${story.en} One exact amount gives an equation: ${eqText(e)}, so ${solText(e)}. ${v.reason.en} A limit such as “${w.en} ${c.limit}” gives an inequality, ${c.L} ${c.sym} ${c.limit}.`,
      `${story.es} Una cantidad exacta da una ecuación: ${eqText(e)}, así que ${solText(e)}. ${v.reason.es} Un límite como «${w.es} ${c.limit}» da una desigualdad, ${c.L} ${c.sym} ${c.limit}.`,
    ),
    labels: sc(
      ["The story", "La historia"],
      ["Write it", "Escríbelo"],
      ["Solve it", "Resuélvelo"],
      ["Check it", "Compruébalo"],
      ["Equation or inequality?", "¿Ecuación o desigualdad?"],
    ),
    situateSay: pair(
      `${story.en} Read it as a balance: ${lhs} must weigh the same as ${b}.`,
      `${story.es} Léela como una balanza: ${lhs} debe pesar lo mismo que ${b}.`,
    ),
    predictSay: pair(
      "Decide how to model the story. Is there one exact amount, or a limit? Then pick the model.",
      "Decide cómo modelar la historia. ¿Hay una cantidad exacta o un límite? Luego elige el modelo.",
    ),
    predictQ: pair("Which model matches the story?", "¿Qué modelo corresponde a la historia?"),
    predictOk: pair(
      `Yes: the story gives one exact amount, so it is the equation ${eqText(e)}.`,
      `Sí: la historia da una cantidad exacta, así que es la ecuación ${eqText(e)}.`,
    ),
    opSay: pair(
      "Now solve it on the scale. Choose a move.",
      "Ahora resuélvela en la balanza. Elige un movimiento.",
    ),
    connectSay: pair(
      `Check that the answer makes sense in the story. ${v.reason.en}`,
      `Comprueba que la respuesta tenga sentido en la historia. ${v.reason.es}`,
    ),
    transferSay: pair(
      `${c.story.en} Is this an equation or an inequality? Pick the model.`,
      `${c.story.es} ¿Es una ecuación o una desigualdad? Elige el modelo.`,
    ),
    transferQ: pair("Which model matches this story?", "¿Qué modelo corresponde a esta historia?"),
    transferOk: pair(
      `Yes: “${w.en} ${c.limit}” is a limit, so many amounts fit. ${c.L} = ${c.example} fits: ${c.example} ${c.sym} ${c.limit}. The scale tips instead of staying level, and that is an inequality.`,
      `Sí: «${w.es} ${c.limit}» es un límite, así que caben muchas cantidades. ${c.L} = ${c.example} cumple: ${c.example} ${c.sym} ${c.limit}. La balanza se inclina en lugar de quedar nivelada, y eso es una desigualdad.`,
    ),
    explainLabel: pair(
      "Explain: how can you tell if a story needs an equation or an inequality?",
      "Explica: ¿cómo sabes si una historia necesita una ecuación o una desigualdad?",
    ),
    explainFrame: pair(
      "I use an equation when ___. I use an inequality when ___.",
      "Uso una ecuación cuando ___. Uso una desigualdad cuando ___.",
    ),
  };
}
