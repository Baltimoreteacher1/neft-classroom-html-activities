// living/median-iqr-model.js — pure math & bilingual copy for the median/IQR
// fold play (statistics: fold sorted strip at median → fold halves at Q1/Q3 →
// IQR vs Range + outlier resistance). No DOM.

export const W = 680;
export const H = 340;
export const okNum = (v) => Number.isFinite(v) && v >= 0 && v <= 500;

export function medianOf(sorted) {
  const n = sorted.length;
  return n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

export function fiveNum(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  const lower = sorted.slice(0, mid);
  const upper = n % 2 ? sorted.slice(mid + 1) : sorted.slice(mid);
  const min = sorted[0];
  const max = sorted[n - 1];
  const med = medianOf(sorted);
  const q1 = medianOf(lower);
  const q3 = medianOf(upper);
  const range = max - min;
  const iqr = q3 - q1;
  return { sorted, lower, upper, n, min, q1, med, q3, max, range, iqr };
}

function cleanSet(c) {
  const vals = Array.isArray(c?.values) ? c.values.map(Number) : [];
  if (vals.length < 6 || vals.length > 14 || !vals.every(okNum)) return null;
  const s = fiveNum(vals);
  if (s.iqr <= 0 || s.range <= s.iqr) return null;
  const u = c?.unit;
  const unit =
    typeof u === "string" && u.trim()
      ? { en: u.trim().slice(0, 16), es: u.trim().slice(0, 16) }
      : u && typeof u.en === "string" && u.en.trim()
        ? {
            en: u.en.trim().slice(0, 16),
            es: String(u.es || u.en)
              .trim()
              .slice(0, 16),
          }
        : { en: "points", es: "puntos" };
  return { values: s.sorted, unit };
}

export function validateMedianIqr(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const core = cleanSet(cfg);
  if (!core) return null;
  const rawT = Array.isArray(cfg.transfer) ? cfg.transfer : cfg.transfer ? [cfg.transfer] : [];
  const transfer = rawT.map(cleanSet).filter(Boolean);
  const defaults = [
    {
      values: [70, 74, 76, 77, 79, 81, 82, 83, 84, 86, 88, 90],
      unit: { en: "points", es: "puntos" },
    },
    { values: [12, 15, 18, 20, 22, 24, 28, 30], unit: { en: "min", es: "min" } },
    { values: [4, 6, 8, 9, 10, 12, 14, 18], unit: { en: "books", es: "libros" } },
  ];
  for (const d of defaults) {
    if (transfer.length >= 3) break;
    transfer.push(d);
  }
  return { ...core, transfer };
}

export function iqrChoices(values) {
  const s = fiveNum(values);
  const cands = [
    { kind: "iqr", value: s.iqr, correct: true },
    { kind: "range", value: s.range, correct: false },
    { kind: "med", value: s.med, correct: false },
    { kind: "halfRange", value: Math.round(s.range / 2), correct: false },
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

export function medianIqrCopy(v) {
  const s = fiveNum(v.values);
  return {
    s,
    title: {
      en: `Fold the data: median (${s.med}) & IQR (${s.iqr})`,
      es: `Dobla los datos: mediana (${s.med}) y RIC (${s.iqr})`,
    },
    ariaLabel: {
      en: `Sorted data strip folded at the median ${s.med}, then each half folded at Q1 = ${s.q1} and Q3 = ${s.q3}, giving IQR = ${s.iqr} and Range = ${s.range}.`,
      es: `Tira de datos ordenados doblada en la mediana ${s.med}, luego cada mitad doblada en Q1 = ${s.q1} y Q3 = ${s.q3}, dando RIC = ${s.iqr} y Rango = ${s.range}.`,
    },
    printSummary: {
      en: `Sort the ${s.n} values from ${s.min} to ${s.max}. Fold in half for the median (${s.med}). Fold the lower half for Q1 (${s.q1}) and upper half for Q3 (${s.q3}). IQR = Q3 − Q1 = ${s.q3} − ${s.q1} = ${s.iqr}; Range = ${s.max} − ${s.min} = ${s.range}.`,
      es: `Ordena los ${s.n} valores de ${s.min} a ${s.max}. Dobla a la mitad para la mediana (${s.med}). Dobla la mitad inferior para Q1 (${s.q1}) y la superior para Q3 (${s.q3}). RIC = Q3 − Q1 = ${s.q3} − ${s.q1} = ${s.iqr}; Rango = ${s.max} − ${s.min} = ${s.range}.`,
    },
    askChild: {
      situate: {
        en: `Why must we sort the data from least to greatest before folding?`,
        es: `¿Por qué debemos ordenar los datos de menor a mayor antes de doblar?`,
      },
      fold: {
        en: `What are the two halves created when you fold at the median (${s.med})?`,
        es: `¿Cuáles son las dos mitades que se forman al doblar en la mediana (${s.med})?`,
      },
      iqr: {
        en: `What is the difference between the IQR (${s.iqr}) and the full Range (${s.range})?`,
        es: `¿Cuál es la diferencia entre el RIC (${s.iqr}) y el Rango completo (${s.range})?`,
      },
      outlier: {
        en: `When the highest score jumps way up, why does the IQR not budge?`,
        es: `Cuando el puntaje más alto sube mucho, ¿por qué el RIC no cambia?`,
      },
      transfer: {
        en: `How do Q1 and Q3 show the spread of the middle half of the data?`,
        es: `¿Cómo muestran Q1 y Q3 la dispersión de la mitad central de los datos?`,
      },
    },
    situate: {
      en: `Line up all ${s.n} values in order from ${s.min} to ${s.max}. Four equal quarters will come from two simple folds.`,
      es: `Alinea los ${s.n} valores en orden desde ${s.min} hasta ${s.max}. Cuatro cuartos iguales saldrán de dos dobleces simples.`,
    },
    fold: {
      say: {
        en: `Fold once at the middle for the median (${s.med}). Fold each half again for Q1 (${s.q1}) and Q3 (${s.q3}).`,
        es: `Dobla una vez en el centro para la mediana (${s.med}). Dobla cada mitad otra vez para Q1 (${s.q1}) y Q3 (${s.q3}).`,
      },
      done: {
        en: `Now you have the five-number summary: min ${s.min}, Q1 ${s.q1}, median ${s.med}, Q3 ${s.q3}, max ${s.max}.`,
        es: `Ahora tienes el resumen de cinco números: mín ${s.min}, Q1 ${s.q1}, mediana ${s.med}, Q3 ${s.q3}, máx ${s.max}.`,
      },
    },
    iqr: {
      say: {
        en: `The box covers the middle 50% from Q1 (${s.q1}) to Q3 (${s.q3}). Find the interquartile range (IQR).`,
        es: `La caja cubre el 50% central desde Q1 (${s.q1}) hasta Q3 (${s.q3}). Encuentra el rango intercuartílico (RIC).`,
      },
      question: {
        en: `What is the IQR (Q3 − Q1)?`,
        es: `¿Cuál es el RIC (Q3 − Q1)?`,
      },
      ok: {
        en: `Yes: IQR = Q3 − Q1 = ${s.q3} − ${s.q1} = ${s.iqr}, while the full range is ${s.max} − ${s.min} = ${s.range}.`,
        es: `Sí: RIC = Q3 − Q1 = ${s.q3} − ${s.q1} = ${s.iqr}, mientras que el rango completo es ${s.max} − ${s.min} = ${s.range}.`,
      },
    },
    outlier: {
      say: {
        en: `Pull the highest value upward. Watch the full Range stretch while el total de la caja (IQR = ${s.iqr}) stays rock steady!`,
        es: `Sube el valor más alto. Observa cómo se estira el Rango mientras el total de la caja (RIC = ${s.iqr}) se mantiene firme.`,
      },
      sayEn: `Pull the highest value upward. Watch the full Range stretch while the middle-half box (IQR = ${s.iqr}) stays rock steady!`,
      done: {
        en: `The IQR ignores extremes because it only measures the middle 50% (Q1 to Q3).`,
        es: `El RIC ignora los extremos porque solo mide el 50% central (de Q1 a Q3).`,
      },
    },
    transferExplain: {
      en: `Explain: why is the IQR better than the Range when a data set has an outlier?`,
      es: `Explica: ¿por qué el RIC es mejor que el Rango cuando un conjunto de datos tiene un valor atípico?`,
    },
    transferFrame: {
      en: "An outlier stretches the ___, but the IQR stays steady because ___.",
      es: "Un valor atípico estira el ___, pero el RIC se mantiene estable porque ___.",
    },
  };
}
