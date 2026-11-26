// living/order-of-operations-model.js — pure math & bilingual copy for the
// order-of-operations play: a + b × base^exp − d (with d >= 0).
// Keeps the whole expression visible at every step so terms never disappear.

export const W = 680;
export const H = 340;
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export function evalOrderOps({ a, b, base, exp, d }) {
  const pow = base ** exp;
  const prod = b * pow;
  const sub = a + prod;
  const total = sub - d;
  const leftToRight = (a + b) * pow - d;
  const mulBeforePow = a + (b * base) ** exp - d;
  const addSub = d > 0 ? `${a} + ${b} × ${base}^${exp} − ${d}` : `${a} + ${b} × ${base}^${exp}`;
  const rows = [
    addSub,
    d > 0 ? `${a} + ${b} × ${pow} − ${d}` : `${a} + ${b} × ${pow}`,
    d > 0 ? `${a} + ${prod} − ${d}` : `${a} + ${prod}`,
    ...(d > 0 ? [`${sub} − ${d}`, String(total)] : [String(total)]),
  ];
  return { pow, prod, sub, total, leftToRight, mulBeforePow, rows };
}

function cleanExpr(c) {
  if (!c || typeof c !== "object") return null;
  const a = Number(c.a);
  const b = Number(c.b);
  const base = Number(c.base);
  const exp = Number(c.exp ?? 2);
  const d = Number(c.d ?? 0);
  if (
    !okInt(a, 1, 20) ||
    !okInt(b, 2, 10) ||
    !okInt(base, 2, 6) ||
    !okInt(exp, 2, 3) ||
    !okInt(d, 0, 20)
  )
    return null;
  const res = evalOrderOps({ a, b, base, exp, d });
  if (res.total <= 0) return null;
  // Require the left-to-right trap to give a DIFFERENT answer so the contrast is real.
  if (res.leftToRight === res.total || res.mulBeforePow === res.total) return null;
  return { a, b, base, exp, d };
}

export function validateOrderOps(cfg) {
  const core = cleanExpr(cfg);
  if (!core) return null;
  const rawT = Array.isArray(cfg.transfer) ? cfg.transfer : cfg.transfer ? [cfg.transfer] : [];
  const transfer = rawT
    .map(cleanExpr)
    .filter(
      (t) =>
        t &&
        !(
          t.a === core.a &&
          t.b === core.b &&
          t.base === core.base &&
          t.exp === core.exp &&
          t.d === core.d
        ),
    );
  const defaults = [
    { a: 4, b: 5, base: 3, exp: 2, d: 0 },
    { a: 5, b: 3, base: 2, exp: 3, d: 4 },
    { a: 6, b: 2, base: 3, exp: 2, d: 5 },
  ];
  for (const x of defaults) {
    if (transfer.length >= 3) break;
    if (!transfer.some((t) => t.a === x.a && t.b === x.b && t.base === x.base && t.d === x.d))
      transfer.push(x);
  }
  return { ...core, transfer };
}

export function orderOpsChoices(e) {
  const r = evalOrderOps(e);
  const cands = [
    { kind: "exact", value: r.total, correct: true },
    { kind: "ltr", value: r.leftToRight, correct: false },
    { kind: "mulpow", value: r.mulBeforePow, correct: false },
    { kind: "addall", value: e.a + e.b + r.pow - e.d, correct: false },
  ];
  const seen = new Set();
  return cands.filter((c) => c.value > 0 && !seen.has(c.value) && seen.add(c.value));
}

export function placeCorrect(options, seed) {
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(seed % options.length, 0, correct);
  return rest;
}

export function orderOpsCopy(v) {
  const r = evalOrderOps(v);
  const expr = r.rows[0];
  return {
    r,
    expr,
    title: {
      en: `Structure first: ${expr}`,
      es: `Estructura primero: ${expr}`,
    },
    ariaLabel: {
      en: `Expression ${expr} evaluated row by row while keeping untouched terms visible, ending at ${r.total}.`,
      es: `Expresión ${expr} evaluada fila por fila manteniendo visibles los términos sin cambios, terminando en ${r.total}.`,
    },
    printSummary: {
      en: `Evaluate ${expr} in order: powers first (${v.base}^${v.exp} = ${r.pow}), then multiply (${v.b} × ${r.pow} = ${r.prod}), then add and subtract left to right → ${r.total}. Going blindly left to right gives ${r.leftToRight}.`,
      es: `Evalúa ${expr} en orden: potencias primero (${v.base}^${v.exp} = ${r.pow}), luego multiplica (${v.b} × ${r.pow} = ${r.prod}), luego suma y resta de izquierda a derecha → ${r.total}. Ir de izquierda a derecha sin orden da ${r.leftToRight}.`,
    },
    askChild: {
      situate: {
        en: `Which parts of ${expr} stay waiting while you evaluate the power first?`,
        es: `¿Qué partes de ${expr} esperan mientras evalúas primero la potencia?`,
      },
      trap: {
        en: `Why does adding ${v.a} + ${v.b} first change the whole value?`,
        es: `¿Por qué sumar ${v.a} + ${v.b} primero cambia el total?`,
      },
      structure: {
        en: `Point to each row: where did the untouched numbers go?`,
        es: `Señala cada fila: ¿a dónde bajaron los números que todavía no usaste?`,
      },
      transfer: {
        en: `Before calculating, which operation binds tightest in this expression?`,
        es: `Antes de calcular, ¿qué operación se hace primero en esta expresión?`,
      },
    },
    situate: {
      en: `Read the whole expression as a structure: ${expr}. The power ${v.base}^${v.exp} binds tightest, then ${v.b} × ${r.pow}, while ${v.a} and ${v.d ? `− ${v.d}` : "the rest"} stay visible until their turn.`,
      es: `Lee toda la expresión como una estructura: ${expr}. La potencia ${v.base}^${v.exp} se une primero, luego ${v.b} × ${r.pow}, mientras ${v.a} y ${v.d ? `− ${v.d}` : "lo demás"} siguen visibles hasta su turno.`,
    },
    trap: {
      say: {
        en: `Look at ${expr}. Which part must be evaluated FIRST so the structure stays intact?`,
        es: `Mira ${expr}. ¿Qué parte debes evaluar PRIMERO para mantener intacta la estructura?`,
      },
      question: { en: "Which step comes first?", es: "¿Qué paso va primero?" },
      ok: {
        en: `Yes: ${v.base}^${v.exp} = ${r.pow} comes first. Everything else drops straight down: ${r.rows[1]}.`,
        es: `Sí: ${v.base}^${v.exp} = ${r.pow} va primero. Todo lo demás baja igual: ${r.rows[1]}.`,
      },
    },
    structure: {
      say: {
        en: `Step through each row. Notice the whole expression stays visible while one bracket collapses into a single number.`,
        es: `Avanza fila por fila. Observa que toda la expresión sigue visible mientras un corchete se reduce a un solo número.`,
      },
      done: {
        en: `Every row equals ${r.total}. Keeping the whole expression visible stops dropped terms and left-to-right errors.`,
        es: `Cada fila equivale a ${r.total}. Mantener toda la expresión visible evita perder términos y errores de izquierda a derecha.`,
      },
    },
    transferExplain: {
      en: `Explain: why must you evaluate ${v.base}^${v.exp} and multiply before adding ${v.a}?`,
      es: `Explica: ¿por qué debes evaluar ${v.base}^${v.exp} y multiplicar antes de sumar ${v.a}?`,
    },
    transferFrame: {
      en: "I evaluate ___ first because ___, and the other terms ___.",
      es: "Evalúo ___ primero porque ___, y los demás términos ___.",
    },
  };
}
