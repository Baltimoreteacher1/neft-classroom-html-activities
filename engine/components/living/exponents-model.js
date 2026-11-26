// living/exponents-model.js — pure math & bilingual copy for the exponents play.
// Repeated multiplication (b^e) vs repeated addition (b × e). No DOM.

export const W = 680;
export const H = 340;
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export function maxExpFor(base) {
  if (base <= 2) return 5;
  if (base === 3) return 4;
  return 3;
}

export function powerValue(base, exp) {
  return base ** exp;
}

export function factorChain(base, exp) {
  return Array.from({ length: exp }, () => String(base)).join(" × ");
}

export function addChain(base, exp) {
  return Array.from({ length: exp }, () => String(base)).join(" + ");
}

export function exponentSteps(base, exp) {
  const out = [];
  let acc = 1;
  for (let i = 1; i <= exp; i++) {
    acc *= base;
    out.push({ step: i, value: acc, factors: factorChain(base, i) });
  }
  return out;
}

/** Choices for b^e: exact power, base*exp (the main trap), base+exp, and swapped e^b. */
export function exponentChoices(base, exp) {
  const exact = powerValue(base, exp);
  const cands = [
    { kind: "power", value: exact, correct: true },
    { kind: "times", value: base * exp, correct: false },
    { kind: "add", value: base + exp, correct: false },
    { kind: "swap", value: exp ** base, correct: false },
  ];
  const seen = new Set();
  const out = [];
  for (const c of cands) {
    if (seen.has(c.value)) continue;
    seen.add(c.value);
    out.push(c);
  }
  return out.length >= 3 ? out : null;
}

export function placeCorrect(options, seed) {
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(seed % options.length, 0, correct);
  return rest;
}

function cleanPair(p) {
  const base = Number(p?.base);
  const exponent = Number(p?.exponent);
  if (!okInt(base, 2, 10) || !okInt(exponent, 2, maxExpFor(base))) return null;
  // Reject 2^2 where 2^2 === 2*2 === 2+2 (misconceptions collide with exact answer)
  if (base === 2 && exponent === 2) return null;
  if (!exponentChoices(base, exponent)) return null;
  return { base, exponent };
}

export function validateExponents(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const core = cleanPair(cfg);
  if (!core) return null;
  const rawT = Array.isArray(cfg.transfer) ? cfg.transfer : cfg.transfer ? [cfg.transfer] : [];
  const transfer = rawT
    .map(cleanPair)
    .filter((t) => t && !(t.base === core.base && t.exponent === core.exponent));
  const defaults = [
    { base: 3, exponent: 3 },
    { base: 5, exponent: 2 },
    { base: 4, exponent: 3 },
    { base: 2, exponent: 5 },
  ];
  for (const d of defaults) {
    if (transfer.length >= 3) break;
    if (
      !(d.base === core.base && d.exponent === core.exponent) &&
      !transfer.some((t) => t.base === d.base && t.exponent === d.exponent)
    ) {
      transfer.push(d);
    }
  }
  return { ...core, transfer };
}

export function exponentsCopy(v) {
  const { base: b, exponent: e } = v;
  const val = powerValue(b, e);
  const prod = b * e;
  const chain = factorChain(b, e);
  const sumStr = addChain(b, e);
  return {
    val,
    prod,
    chain,
    title: {
      en: `Repeated factors: ${b}^${e}`,
      es: `Factores repetidos: ${b}^${e}`,
    },
    ariaLabel: {
      en: `Bars growing by multiplying by ${b} each step from ${b}^1 to ${b}^${e} = ${val}, compared with adding ${b} ${e} times to get ${prod}.`,
      es: `Barras que crecen multiplicando por ${b} en cada paso desde ${b}^1 hasta ${b}^${e} = ${val}, comparadas con sumar ${b} ${e} veces para obtener ${prod}.`,
    },
    printSummary: {
      en: `${b}^${e} means ${chain} = ${val}. The base (${b}) is the repeated factor; the exponent (${e}) counts how many factors. It is NOT ${b} × ${e} = ${prod}.`,
      es: `${b}^${e} significa ${chain} = ${val}. La base (${b}) es el factor que se repite; el exponente (${e}) cuenta cuántos factores hay. NO es ${b} × ${e} = ${prod}.`,
    },
    askChild: {
      situate: {
        en: `In ${b}^${e}, which number is being multiplied, and how many times does it appear?`,
        es: `En ${b}^${e}, ¿qué número se multiplica y cuántas veces aparece?`,
      },
      trap: {
        en: `Why is ${b}^${e} (${val}) so much bigger than ${b} × ${e} (${prod})?`,
        es: `¿Por qué ${b}^${e} (${val}) es mucho mayor que ${b} × ${e} (${prod})?`,
      },
      build: {
        en: `When you increase the exponent by 1, what happens to the total?`,
        es: `Cuando aumentas el exponente en 1, ¿qué le pasa al total?`,
      },
      transfer: {
        en: `How can you check a power by writing out the repeated factors first?`,
        es: `¿Cómo puedes comprobar una potencia escribiendo primero los factores repetidos?`,
      },
    },
    situate: {
      en: `Start with 1 factor of ${b}. Each step multiplies by ${b} again: ${chain} = ${val}. We write that as ${b}^${e}.`,
      es: `Empieza con 1 factor de ${b}. Cada paso vuelve a multiplicar por ${b}: ${chain} = ${val}. Eso se escribe ${b}^${e}.`,
    },
    trap: {
      say: {
        en: `Compare repeated multiplication (${chain}) with repeated addition (${sumStr} = ${b} × ${e}). Predict the value of ${b}^${e}.`,
        es: `Compara la multiplicación repetida (${chain}) con la suma repetida (${sumStr} = ${b} × ${e}). Predice el valor de ${b}^${e}.`,
      },
      question: {
        en: `What is ${b}^${e}?`,
        es: `¿Cuánto es ${b}^${e}?`,
      },
      cues: {
        times: {
          en: `${prod} is ${b} × ${e} (adding ${b}, ${e} times). Look at the tall bar: ${b}^${e} multiplies by ${b} each time.`,
          es: `${prod} es ${b} × ${e} (sumar ${b}, ${e} veces). Mira la barra alta: ${b}^${e} multiplica por ${b} cada vez.`,
        },
        add: {
          en: `Adding ${b} + ${e} combines the base and exponent instead of multiplying ${e} factors of ${b}.`,
          es: `Sumar ${b} + ${e} junta la base y el exponente en vez de multiplicar ${e} factores de ${b}.`,
        },
        swap: {
          en: `Check which number is the base (${b}) and which is the exponent (${e}). Which factor repeats?`,
          es: `Revisa cuál número es la base (${b}) y cuál es el exponente (${e}). ¿Qué factor se repite?`,
        },
      },
      ok: {
        en: `Yes: ${b}^${e} = ${chain} = ${val}, while ${b} × ${e} is only ${prod}.`,
        es: `Sí: ${b}^${e} = ${chain} = ${val}, mientras que ${b} × ${e} es solo ${prod}.`,
      },
    },
    build: {
      say: {
        en: `Slide the exponent to add one more factor of ${b} at a time. Notice how el total multiplies by ${b} on every step.`,
        es: `Desliza el exponente para agregar un factor más de ${b} cada vez. Observa cómo el total se multiplica por ${b} en cada paso.`,
      },
      sayEn: `Slide the exponent to add one more factor of ${b} at a time. Notice how the total multiplies by ${b} on every step.`,
      progress: (n) => ({
        en: `Try at least 3 different exponents (${n}/3 tried).`,
        es: `Prueba al menos 3 exponentes distintos (${n}/3 probados).`,
      }),
      done: {
        en: `Every +1 on the exponent multiplies the total by ${b}.`,
        es: `Cada +1 en el exponente multiplica el total por ${b}.`,
      },
    },
    transferExplain: {
      en: `Explain: why is ${b}^${e} NOT the same as ${b} × ${e}?`,
      es: `Explica: ¿por qué ${b}^${e} NO es lo mismo que ${b} × ${e}?`,
    },
    transferFrame: {
      en: "An exponent tells how many times to multiply ___, so ___.",
      es: "Un exponente indica cuántas veces multiplicar ___, así que ___.",
    },
  };
}
