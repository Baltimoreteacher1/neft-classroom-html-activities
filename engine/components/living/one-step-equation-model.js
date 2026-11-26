// living/one-step-equation-model.js — pure math & bilingual copy for one-step
// addition/subtraction equations (balance → symbols, fade the model). No DOM.

export const W = 680;
export const H = 340;
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export function solveEq({ op, k, rhs }) {
  const solution = op === "+" ? rhs - k : rhs + k;
  const wrongSameOp = op === "+" ? rhs + k : Math.abs(rhs - k);
  const invOp = op === "+" ? "−" : "+";
  const eqOp = op === "+" ? "+" : "−";
  return { solution, wrongSameOp, invOp, eqOp };
}

function cleanEq(c) {
  if (!c || typeof c !== "object") return null;
  const op = c.op === "-" ? "-" : c.op === "+" ? "+" : null;
  const k = Number(c.k);
  const rhs = Number(c.rhs);
  const varName = /^[a-z]$/.test(String(c.varName || "x")) ? String(c.varName || "x") : null;
  if (!op || !varName || !okInt(k, 1, 50) || !okInt(rhs, 1, 100)) return null;
  const { solution, wrongSameOp } = solveEq({ op, k, rhs });
  if (solution <= 0 || solution === k || solution === rhs || solution === wrongSameOp) return null;
  return { varName, op, k, rhs };
}

export function validateOneStepEq(cfg) {
  const core = cleanEq(cfg);
  if (!core) return null;
  const rawT = Array.isArray(cfg.transfer) ? cfg.transfer : cfg.transfer ? [cfg.transfer] : [];
  const transfer = rawT
    .map(cleanEq)
    .filter((t) => t && !(t.op === core.op && t.k === core.k && t.rhs === core.rhs));
  const defaults = [
    { varName: "n", op: "+", k: 19, rhs: 46 },
    { varName: "m", op: "-", k: 9, rhs: 4 },
    { varName: "y", op: "+", k: 6, rhs: 14 },
  ];
  for (const d of defaults) {
    if (transfer.length >= 3) break;
    if (!transfer.some((t) => t.op === d.op && t.k === d.k && t.rhs === d.rhs)) transfer.push(d);
  }
  return { ...core, transfer };
}

export function eqChoices(e) {
  const { solution, wrongSameOp } = solveEq(e);
  const cands = [
    { kind: "solution", value: solution, correct: true },
    { kind: "wrongOp", value: wrongSameOp, correct: false },
    { kind: "rhs", value: e.rhs, correct: false },
    { kind: "k", value: e.k, correct: false },
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

export function oneStepEqCopy(v) {
  const s = solveEq(v);
  const eq = `${v.varName} ${s.eqOp} ${v.k} = ${v.rhs}`;
  const check = `${s.solution} ${s.eqOp} ${v.k} = ${v.rhs}`;
  return {
    s,
    eq,
    check,
    title: {
      en: `Keep it balanced: ${eq}`,
      es: `Mantenlo en equilibrio: ${eq}`,
    },
    ariaLabel: {
      en: `A balance scale showing ${eq}. Doing ${s.invOp} ${v.k} on both sides keeps it level and gives ${v.varName} = ${s.solution}.`,
      es: `Una balanza que muestra ${eq}. Hacer ${s.invOp} ${v.k} en ambos lados mantiene el equilibrio y da ${v.varName} = ${s.solution}.`,
    },
    printSummary: {
      en: `To solve ${eq}, apply the inverse (${s.invOp} ${v.k}) to BOTH sides so the equation stays balanced: ${v.varName} = ${s.solution}. Check: ${check}.`,
      es: `Para resolver ${eq}, aplica la operación inversa (${s.invOp} ${v.k}) en LOS DOS lados para mantener el equilibrio: ${v.varName} = ${s.solution}. Comprobación: ${check}.`,
    },
    askChild: {
      situate: {
        en: `In ${eq}, what does the equal sign (=) tell you about the two pans?`,
        es: `En ${eq}, ¿qué te dice el signo igual (=) sobre los dos platillos?`,
      },
      tilt: {
        en: `What happens to the scale if you change only the left side?`,
        es: `¿Qué le pasa a la balanza si cambias solo el lado izquierdo?`,
      },
      solve: {
        en: `How can you check that ${v.varName} = ${s.solution} really makes ${eq} true?`,
        es: `¿Cómo puedes comprobar que ${v.varName} = ${s.solution} hace verdadera a ${eq}?`,
      },
      symbols: {
        en: `Even after the picture fades, how do the written steps still show a balanced scale?`,
        es: `Aunque el dibujo se desvanezca, ¿cómo siguen mostrando equilibrio los pasos escritos?`,
      },
      transfer: {
        en: `Which inverse operation isolates the variable on both sides?`,
        es: `¿Qué operación inversa despeja la variable en los dos lados?`,
      },
    },
    situate: {
      en: `The equal sign means both sides have the same total value: ${eq}. We want ${v.varName} alone on one side.`,
      es: `El signo igual significa que ambos lados tienen el mismo total: ${eq}. Queremos dejar ${v.varName} sola en un lado.`,
    },
    tilt: {
      say: {
        en: `If you do ${s.invOp} ${v.k} to ONLY the left side, the balance tips! What keeps both sides equal?`,
        es: `Si haces ${s.invOp} ${v.k} SOLO en el lado izquierdo, la balanza se inclina. ¿Qué mantiene iguales los dos lados?`,
      },
      question: {
        en: `How do you isolate ${v.varName} while keeping the scale level?`,
        es: `¿Cómo despejas ${v.varName} manteniendo la balanza nivelada?`,
      },
      ok: {
        en: `Yes: doing ${s.invOp} ${v.k} on BOTH sides keeps the balance level and gives ${v.varName} = ${s.solution}.`,
        es: `Sí: hacer ${s.invOp} ${v.k} en LOS DOS lados mantiene el equilibrio y da ${v.varName} = ${s.solution}.`,
      },
    },
    solve: {
      say: {
        en: `Apply ${s.invOp} ${v.k} to both sides, then check by putting ${s.solution} back into ${eq}.`,
        es: `Aplica ${s.invOp} ${v.k} en ambos lados y luego comprueba poniendo ${s.solution} de nuevo en ${eq}.`,
      },
      done: {
        en: `Balanced and checked: ${check}.`,
        es: `Equilibrado y comprobado: ${check}.`,
      },
    },
    symbols: {
      say: {
        en: `Now fade the scale away. The written algebra lines do the exact same move on both sides of =.`,
        es: `Ahora desvanece la balanza. Las líneas escritas hacen exactamente el mismo movimiento a ambos lados de =.`,
      },
    },
    transferExplain: {
      en: `Explain: why must every step happen to BOTH sides of an equation?`,
      es: `Explica: ¿por qué cada paso debe hacerse en LOS DOS lados de una ecuación?`,
    },
    transferFrame: {
      en: "I used ___ on both sides because ___, and I checked by ___.",
      es: "Usé ___ en ambos lados porque ___, y lo comprobé al ___.",
    },
  };
}
