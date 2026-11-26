// living/expression-evaluate-model.js — the mathematics of the expression-evaluate
// play (6-5): a situation becomes an expression with a variable, and the
// student picks values to substitute.
//
// The Spanish assumes the authored nouns: a masculine `unit` (boleto) and a feminine
// `fee` (cuota). Money is held in whole cents so 4.25 × 30 + 23.50 never meets a float. Pure
// functions only (no DOM): every number the play shows is computed here, so
// expression-evaluate.test.mjs can check each one in node.

import { okInt, placeCorrect } from "./mean-balance-model.js";

export { placeCorrect };

export const MAX_TICKS = 8; // the most unit blocks the stage draws, and the slider's top
export const MAX_BLOCKS = 10; // a quantity larger than this is drawn as one block

const toCents = (x) => {
  const n = Number(x);
  const c = Math.round(n * 100);
  return Number.isFinite(n) && Math.abs(n * 100 - c) < 1e-6 ? c : null;
};

/** 5000 -> "50"; 2350 -> "23.50"; 425 -> "4.25". */
export const fmtNum = (cents) =>
  cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);

/** The cost for k units: { part: coef × k, total: part + constant } in cents. */
export const evalAt = (q, k) => ({ part: q.coefC * k, total: q.coefC * k + q.constC });

/** "12t + 50", "4.25s + 23.50". */
export const exprText = (q) => `${fmtNum(q.coefC)}${q.v} + ${fmtNum(q.constC)}`;

/** The three lines of a substitution: 12 × 3 + 50  →  36 + 50  →  86. */
export function substitution(q, k) {
  const e = evalAt(q, k);
  return [
    `${fmtNum(q.coefC)} × ${k} + ${fmtNum(q.constC)}`,
    `${fmtNum(e.part)} + ${fmtNum(q.constC)}`,
    fmtNum(e.total),
  ];
}

const cleanPair = (p, max) =>
  p && typeof p.en === "string" && p.en.trim()
    ? { en: p.en.slice(0, max), es: String(p.es || p.en).slice(0, max) }
    : null;

function validQuantity(c, { maxTotal }) {
  const coefC = toCents(c?.coef);
  const constC = toCents(c?.constant);
  const v = typeof c?.variable === "string" && /^[a-z]$/.test(c.variable) ? c.variable : null;
  const unit = cleanPair(c?.unit, 20);
  const fee = cleanPair(c?.fee, 28);
  if (coefC == null || constC == null || !v || !unit || !fee) return null;
  if (coefC < 200 || coefC > 2500 || constC < 100 || constC > 9900 || coefC === constC) return null;
  if (maxTotal(coefC, constC) > 99900) return null;
  return { coefC, constC, v, unit, fee };
}

/** Wrong expressions for "which expression?": each one a real way to translate it. */
export function expressionChoices(q) {
  const c = fmtNum(q.coefC);
  const k = fmtNum(q.constC);
  const merged = fmtNum(q.coefC + q.constC);
  return [
    { kind: "right", text: `${c}${q.v} + ${k}`, correct: true },
    { kind: "swap", text: `${k}${q.v} + ${c}`, correct: false },
    { kind: "merged", text: `${merged}${q.v}`, correct: false },
    { kind: "listed", text: `${c} + ${q.v} + ${k}`, correct: false },
  ];
}

/** Doubling the quantity: the right total and three real slips. All distinct, in cents. */
export function doubleChoices(q, a) {
  const t1 = evalAt(q, a).total;
  const right = evalAt(q, 2 * a).total;
  const out = [
    { kind: "right", value: right, correct: true },
    { kind: "double", value: 2 * t1, correct: false }, // doubled the fee too
    { kind: "nofee", value: q.coefC * 2 * a, correct: false }, // forgot the fee
    { kind: "feeTwice", value: t1 + q.constC, correct: false }, // added the fee again
  ];
  return new Set(out.map((o) => o.value)).size === 4 ? out : null;
}

/** Evaluate at a value: the right total and three slips (ignore v, fee per unit, fee dropped). */
export function valueChoices(q, k) {
  const right = evalAt(q, k).total;
  const out = [
    { kind: "right", value: right, correct: true },
    { kind: "novar", value: q.coefC + q.constC, correct: false }, // forgot to multiply by k
    { kind: "feeEach", value: (q.coefC + q.constC) * k, correct: false }, // fee for every one
    { kind: "nofee", value: q.coefC * k, correct: false }, // fee dropped
  ];
  return new Set(out.map((o) => o.value)).size === 4 ? out : null;
}

export function validateExpressionEvaluate(cfg) {
  const main = validQuantity(cfg, { maxTotal: (a, b) => (a * MAX_TICKS + b) / 100 });
  if (!main) return null;
  const start = cfg.start == null ? 3 : Number(cfg.start);
  if (!okInt(start, 1, MAX_TICKS / 2)) return null;
  if (!doubleChoices(main, start) || !valueChoices(main, start)) return null;
  const tq = validQuantity(cfg.transfer, { maxTotal: (a, b) => (a * 99 + b) / 100 });
  const value = Number(cfg.transfer?.value);
  if (!tq || !okInt(value, 2, 99) || !valueChoices(tq, value)) return null;
  if (evalAt(tq, value).total > 999900) return null;
  const what = cleanPair(cfg.what, 24) ?? { en: "total cost", es: "costo total" };
  const prefix = typeof cfg.prefix === "string" && cfg.prefix.length <= 2 ? cfg.prefix : "";
  return {
    main,
    start,
    transfer: { ...tq, value, story: cleanPair(cfg.transfer?.story, 400) },
    what,
    prefix,
    story: cleanPair(cfg.story, 400),
  };
}

const pair = (en, es) => ({ en, es });
export const plural = (u) => pair(`${u.en}s`, `${u.es}s`);

/** Every sentence the play says. `v` is the validated config. */
export function evaluateCopy(v) {
  const { main: q, start, transfer: t, what, prefix, story } = v;
  const m = (cents) => `${prefix}${fmtNum(cents)}`;
  const c = fmtNum(q.coefC);
  const k = fmtNum(q.constC);
  const e0 = evalAt(q, start);
  const e2 = evalAt(q, 2 * start);
  const pl = plural(q.unit);
  const tpl = plural(t.unit);
  const tev = evalAt(t, t.value);
  const tc = fmtNum(t.coefC);
  const tk = fmtNum(t.constC);
  const expr = exprText(q);
  const tExpr = exprText(t);
  const subLine = (qq, n) => {
    const [a, b, r] = substitution(qq, n);
    return `${a} = ${b} = ${prefix}${r}`;
  };
  return {
    kicker: pair("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: pair("A variable stands for any value", "Una variable representa cualquier valor"),
    ariaLabel: pair(
      `A bar for the ${what.en}: ${q.v} blocks of ${m(q.coefC)} (${c}${q.v}) plus one ${m(q.constC)} ${q.fee.en}. With ${start} ${pl.en}, ${subLine(q, start)}.`,
      `Una barra para el ${what.es}: ${q.v} bloques de ${m(q.coefC)} (${c}${q.v}) más una ${q.fee.es} de ${m(q.constC)}. Con ${start} ${pl.es}, ${subLine(q, start)}.`,
    ),
    printSummary: pair(
      `${story ? `${story.en} ` : ""}The ${what.en} is ${expr}: ${c}${q.v} is ${m(q.coefC)} for each ${q.unit.en}, and ${k} is the ${q.fee.en}, paid once. With ${start} ${pl.en}: ${subLine(q, start)}.`,
      `${story ? `${story.es} ` : ""}El ${what.es} es ${expr}: ${c}${q.v} es ${m(q.coefC)} por cada ${q.unit.es}, y ${k} es la ${q.fee.es}, que se paga una vez. Con ${start} ${pl.es}: ${subLine(q, start)}.`,
    ),
    scene: {
      situate: pair("The situation", "La situación"),
      predict: pair("Write it", "Escríbela"),
      evaluate: pair("Try values", "Prueba valores"),
      connect: pair("What each part means", "Qué significa cada parte"),
      double: pair("Does doubling double it?", "¿Duplicar duplica?"),
      transfer: pair("On your own", "Por tu cuenta"),
    },
    situateSay: pair(
      `${story ? `${story.en} ` : ""}We do not know how many ${pl.en}, so a letter stands for it: ${q.v} = the number of ${pl.en}. Each ${q.unit.en} costs ${m(q.coefC)}; the ${q.fee.en} of ${m(q.constC)} is paid once.`,
      `${story ? `${story.es} ` : ""}No sabemos cuántos ${pl.es} hay, así que una letra los representa: ${q.v} = el número de ${pl.es}. Cada ${q.unit.es} cuesta ${m(q.coefC)}; la ${q.fee.es} de ${m(q.constC)} se paga una vez.`,
    ),
    varDef: pair(`${q.v} = number of ${pl.en}`, `${q.v} = número de ${pl.es}`),
    predictSay: pair(
      `The dashed block is ${q.v} ${pl.en}, ${m(q.coefC)} each. The amber block is the ${q.fee.en}. Which expression gives the ${what.en}?`,
      `El bloque con línea punteada son ${q.v} ${pl.es}, ${m(q.coefC)} cada uno. El bloque ámbar es la ${q.fee.es}. ¿Qué expresión da el ${what.es}?`,
    ),
    predictQ: pair(`Which expression gives the ${what.en}?`, `¿Qué expresión da el ${what.es}?`),
    predictOk: pair(
      `Yes: ${expr}. ${c}${q.v} means ${c} × ${q.v}, and the ${k} is added once. Now give ${q.v} a value.`,
      `Sí: ${expr}. ${c}${q.v} significa ${c} × ${q.v} y el ${k} se suma una vez. Ahora dale un valor a ${q.v}.`,
    ),
    /** A wrong expression: names what it says and asks about the picture. */
    cue(opt) {
      return {
        swap: pair(
          `${opt.text} charges ${m(q.constC)} for every ${q.unit.en} and ${m(q.coefC)} once. Look at the blocks: which amount is paid for each ${q.unit.en}, and which only once?`,
          `${opt.text} cobra ${m(q.constC)} por cada ${q.unit.es} y ${m(q.coefC)} una vez. Mira los bloques: ¿qué cantidad se paga por cada ${q.unit.es} y cuál solo una vez?`,
        ),
        merged: pair(
          `${opt.text} charges ${m(q.coefC + q.constC)} for every ${q.unit.en}, as if the ${q.fee.en} were inside each price. How many times does the amber block appear?`,
          `${opt.text} cobra ${m(q.coefC + q.constC)} por cada ${q.unit.es}, como si la ${q.fee.es} estuviera dentro de cada precio. ¿Cuántas veces aparece el bloque ámbar?`,
        ),
        listed: pair(
          `${opt.text} adds the number of ${pl.en} as if it were dollars. Each ${q.unit.en} costs ${m(q.coefC)}: how do you write ${q.v} of them?`,
          `${opt.text} suma el número de ${pl.es} como si fueran dólares. Cada ${q.unit.es} cuesta ${m(q.coefC)}: ¿cómo escribes ${q.v} de ellos?`,
        ),
      }[opt.kind];
    },
    evalSay: pair(
      `Choose how many ${pl.en}. The same expression, ${expr}, works for every value: substitute, then evaluate in order.`,
      `Elige cuántos ${pl.es}. La misma expresión, ${expr}, sirve para cualquier valor: sustituye y luego evalúa en orden.`,
    ),
    valueLabel: pair(`Number of ${pl.en}`, `Número de ${pl.es}`),
    tryMore: (left) =>
      pair(
        left === 1 ? "Try one more value." : "Try two more values.",
        left === 1 ? "Prueba un valor más." : "Prueba dos valores más.",
      ),
    tryThree: pair(
      "Try at least three different values.",
      "Prueba al menos tres valores diferentes.",
    ),
    evalDone: pair(
      `One expression, many values: only ${q.v} changes. The ${q.fee.en} stays ${m(q.constC)} every time.`,
      `Una expresión, muchos valores: solo cambia ${q.v}. La ${q.fee.es} siempre es ${m(q.constC)}.`,
    ),
    evalRow: (n) => {
      const e = evalAt(q, n);
      return pair(
        `${q.v} = ${n}: ${subLine(q, n)}. The ${what.en} is ${m(e.total)}.`,
        `${q.v} = ${n}: ${subLine(q, n)}. El ${what.es} es ${m(e.total)}.`,
      );
    },
    connectSay: (n) =>
      pair(
        `Same bar, with its parts named. The coefficient ${c} is the price of one ${q.unit.en}. The variable ${q.v} is how many (${n} here). The constant ${k} is the ${q.fee.en}, paid once.`,
        `La misma barra, con sus partes nombradas. El coeficiente ${c} es el precio de un ${q.unit.es}. La variable ${q.v} es cuántos (aquí ${n}). La constante ${k} es la ${q.fee.es}, que se paga una vez.`,
      ),
    annVar: (n) =>
      pair(`${c} × ${n} = ${m(evalAt(q, n).part)}`, `${c} × ${n} = ${m(evalAt(q, n).part)}`),
    annFee: pair(`${q.fee.en}: ${m(q.constC)}`, `${q.fee.es}: ${m(q.constC)}`),
    connectDone: pair(
      `${expr} = ${m(e0.part)} + ${m(q.constC)} = ${m(e0.total)} when ${q.v} = ${start}: the ${what.en} of ${start} ${pl.en}.`,
      `${expr} = ${m(e0.part)} + ${m(q.constC)} = ${m(e0.total)} cuando ${q.v} = ${start}: el ${what.es} de ${start} ${pl.es}.`,
    ),
    doubleSay: pair(
      `Now ${start} ${pl.en} become ${2 * start}. Two bars: the top one has ${start} ${pl.en}, the lower one has ${2 * start}. What is the ${what.en} for ${2 * start}?`,
      `Ahora ${start} ${pl.es} se vuelven ${2 * start}. Dos barras: la de arriba tiene ${start} ${pl.es}, la de abajo tiene ${2 * start}. ¿Cuál es el ${what.es} con ${2 * start}?`,
    ),
    doubleQ: pair(
      `With ${2 * start} ${pl.en}, the ${what.en} is…`,
      `Con ${2 * start} ${pl.es}, el ${what.es} es…`,
    ),
    doubleCue(opt) {
      const x = m(opt.value);
      return {
        double: pair(
          `${x} doubles the whole ${what.en}, ${q.fee.en} too. Count the amber blocks in the lower bar: how many are there?`,
          `${x} duplica todo el ${what.es}, incluso la ${q.fee.es}. Cuenta los bloques ámbar de la barra de abajo: ¿cuántos hay?`,
        ),
        nofee: pair(
          `${x} only counts the ${pl.en}. Is there anything in the lower bar besides the ${2 * start} ${pl.en}?`,
          `${x} solo cuenta los ${pl.es}. ¿Hay algo más en la barra de abajo además de los ${2 * start} ${pl.es}?`,
        ),
        feeTwice: pair(
          `${x} adds the ${q.fee.en} a second time. How many times is it paid in the lower bar?`,
          `${x} suma la ${q.fee.es} por segunda vez. ¿Cuántas veces se paga en la barra de abajo?`,
        ),
      }[opt.kind];
    },
    doubleOk: pair(
      `Right: ${subLine(q, 2 * start)}. Doubling the ${pl.en} doubled ${m(e0.part)} to ${m(e2.part)}, but the ${q.fee.en} stayed ${m(q.constC)}, so ${m(e0.total)} did not double.`,
      `Correcto: ${subLine(q, 2 * start)}. Al duplicar los ${pl.es}, ${m(e0.part)} se duplicó a ${m(e2.part)}, pero la ${q.fee.es} siguió en ${m(q.constC)}, así que ${m(e0.total)} no se duplicó.`,
    ),
    transferSay: pair(
      `${t.story ? `${t.story.en} ` : ""}The expression is ${tExpr}. Now ${t.v} = ${t.value} ${tpl.en}: substitute ${t.value} for ${t.v}.`,
      `${t.story ? `${t.story.es} ` : ""}La expresión es ${tExpr}. Ahora ${t.v} = ${t.value} ${tpl.es}: sustituye ${t.v} por ${t.value}.`,
    ),
    transferQ: pair(
      `What is ${tExpr} when ${t.v} = ${t.value}?`,
      `¿Cuánto es ${tExpr} cuando ${t.v} = ${t.value}?`,
    ),
    transferCue(opt) {
      const x = m(opt.value);
      return {
        novar: pair(
          `${x} is ${tc} + ${tk}, which never uses ${t.value}. What does ${tc}${t.v} mean when ${t.v} = ${t.value}?`,
          `${x} es ${tc} + ${tk}, y nunca usa el ${t.value}. ¿Qué significa ${tc}${t.v} cuando ${t.v} = ${t.value}?`,
        ),
        feeEach: pair(
          `${x} charges the ${t.fee.en} for every ${t.unit.en}. How many times is the ${t.fee.en} paid?`,
          `${x} cobra la ${t.fee.es} por cada ${t.unit.es}. ¿Cuántas veces se paga la ${t.fee.es}?`,
        ),
        nofee: pair(
          `${x} leaves out the ${t.fee.en}. Is there a constant in ${tExpr} that still has to be added?`,
          `${x} deja fuera la ${t.fee.es}. ¿Hay una constante en ${tExpr} que todavía hay que sumar?`,
        ),
      }[opt.kind];
    },
    transferOk: pair(
      `Right: ${subLine(t, t.value)}, so the ${what.en} is ${m(tev.total)}. Multiply first, then add the ${t.fee.en}.`,
      `Correcto: ${subLine(t, t.value)}, así que el ${what.es} es ${m(tev.total)}. Primero multiplica y luego suma la ${t.fee.es}.`,
    ),
    explainLabel: pair(
      `Explain: what does ${tc}${t.v} mean here, and what does ${tk} mean?`,
      `Explica: ¿qué significa ${tc}${t.v} aquí y qué significa ${tk}?`,
    ),
    explainFrame: pair(
      "The letter stands for ___, so I replace it with ___ and ___ first, then ___.",
      "La letra representa ___, así que la reemplazo por ___ y primero ___, luego ___.",
    ),
    tExpr,
    expr,
  };
}
