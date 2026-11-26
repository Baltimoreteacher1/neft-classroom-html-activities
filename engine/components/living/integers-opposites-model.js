// living/integers-opposites-model.js — pure math & bilingual copy for Unit 7
// integers and opposites (0 as reference, mirror across 0). No DOM.

export const W = 680;
export const H = 320;
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export function oppositeOf(n) {
  return n === 0 ? 0 : -n;
}

export function fmtSigned(n) {
  if (n === 0) return "0";
  return n < 0 ? `−${Math.abs(n)}` : `+${n}`;
}

export function cleanPair(p, fallback) {
  if (!p) return fallback;
  if (typeof p === "string" && p.trim())
    return { en: p.trim().slice(0, 40), es: p.trim().slice(0, 40) };
  if (typeof p === "object" && typeof p.en === "string" && p.en.trim()) {
    return {
      en: p.en.trim().slice(0, 40),
      es:
        typeof p.es === "string" && p.es.trim()
          ? p.es.trim().slice(0, 40)
          : p.en.trim().slice(0, 40),
    };
  }
  return null;
}

function cleanItem(c) {
  const value = Number(c?.value);
  if (!okInt(value, -200, 200) || value === 0) return null;
  const unit = cleanPair(c?.unit, { en: "m", es: "m" });
  const zeroLabel = cleanPair(c?.zeroLabel, { en: "sea level", es: "el nivel del mar" });
  const place = cleanPair(c?.place, { en: "the marker", es: "la marca" });
  if (!unit || !zeroLabel || !place) return null;
  return { value, unit, zeroLabel, place };
}

export function validateIntegers(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const core = cleanItem(cfg);
  if (!core) return null;
  const rawT = Array.isArray(cfg.transfer) ? cfg.transfer : cfg.transfer ? [cfg.transfer] : [];
  const transfer = rawT.map(cleanItem).filter((t) => t && t.value !== core.value);
  const defaults = [
    {
      value: -12,
      unit: { en: "°C", es: "°C" },
      zeroLabel: { en: "0°C freezing", es: "0 °C congelación" },
      place: { en: "winter air", es: "aire de invierno" },
    },
    {
      value: -25,
      unit: { en: "dollars", es: "dólares" },
      zeroLabel: { en: "$0 balance", es: "saldo $0" },
      place: { en: "the debt", es: "la deuda" },
    },
    {
      value: 18,
      unit: { en: "ft", es: "ft" },
      zeroLabel: { en: "ground floor", es: "planta baja" },
      place: { en: "the balcony", es: "el balcón" },
    },
  ];
  for (const d of defaults) {
    if (transfer.length >= 3) break;
    if (!transfer.some((t) => t.value === d.value)) transfer.push(d);
  }
  return { ...core, transfer };
}

export function oppositeChoices(n) {
  const opp = oppositeOf(n);
  const mag = Math.abs(n);
  const cands = [
    { kind: "opp", value: opp, label: fmtSigned(opp), correct: true },
    { kind: "same", value: n, label: fmtSigned(n), correct: false },
    { kind: "zero", value: 0, label: "0", correct: false },
    { kind: "double", value: opp * 2, label: fmtSigned(opp * 2), correct: false },
  ];
  const seen = new Set();
  return cands.filter((c) => !seen.has(c.value) && seen.add(c.value) && mag > 0);
}

export function placeCorrect(options, seed) {
  const correct = options.find((o) => o.correct);
  const rest = options.filter((o) => !o.correct);
  rest.splice(Math.abs(seed) % options.length, 0, correct);
  return rest;
}

export function integersCopy(v) {
  const n = v.value;
  const opp = oppositeOf(n);
  const dist = Math.abs(n);
  const dirEn = n < 0 ? "below" : "above";
  const dirEs = n < 0 ? "por debajo de" : "por encima de";
  return {
    opp,
    dist,
    title: {
      en: `Integers & opposites: ${fmtSigned(n)} and ${fmtSigned(opp)}`,
      es: `Enteros y opuestos: ${fmtSigned(n)} y ${fmtSigned(opp)}`,
    },
    ariaLabel: {
      en: `A number line centered at 0 (${v.zeroLabel.en}), showing ${fmtSigned(n)} and its opposite ${fmtSigned(opp)} at the same distance of ${dist} units from 0.`,
      es: `Una recta numérica centrada en 0 (${v.zeroLabel.es}), mostrando ${fmtSigned(n)} y su opuesto ${fmtSigned(opp)} a la misma distancia de ${dist} unidades del 0.`,
    },
    printSummary: {
      en: `${v.place.en} is ${dist} ${v.unit.en} ${dirEn} ${v.zeroLabel.en} (0), written ${fmtSigned(n)}. Its opposite is ${fmtSigned(opp)}: the same distance (${dist}) on the other side of 0, so ${fmtSigned(n)} + ${fmtSigned(opp)} = 0.`,
      es: `${v.place.es} está a ${dist} ${v.unit.es} ${dirEs} ${v.zeroLabel.es} (0), escrito ${fmtSigned(n)}. Su opuesto es ${fmtSigned(opp)}: la misma distancia (${dist}) al otro lado del 0, así que ${fmtSigned(n)} + ${fmtSigned(opp)} = 0.`,
    },
    askChild: {
      situate: {
        en: `Why do we need the sign on ${fmtSigned(n)} instead of writing plain ${dist}?`,
        es: `¿Por qué necesitamos el signo en ${fmtSigned(n)} en lugar de escribir solo ${dist}?`,
      },
      zero: {
        en: `In this situation, what does 0 stand for?`,
        es: `En esta situación, ¿qué representa el 0?`,
      },
      mirror: {
        en: `How far are ${fmtSigned(n)} and ${fmtSigned(opp)} from 0, and what happens when you add them?`,
        es: `¿A qué distancia están ${fmtSigned(n)} y ${fmtSigned(opp)} del 0, y qué pasa cuando los sumas?`,
      },
      transfer: {
        en: `What is the opposite of a negative integer, and how do you know?`,
        es: `¿Cuál es el opuesto de un entero negativo y cómo lo sabes?`,
      },
    },
    situate: {
      en: `${v.place.en} is ${dist} ${v.unit.en} ${dirEn} ${v.zeroLabel.en}. Zero marks ${v.zeroLabel.en}, so we write ${fmtSigned(n)}.`,
      es: `${v.place.es} está a ${dist} ${v.unit.es} ${dirEs} ${v.zeroLabel.es}. El cero marca ${v.zeroLabel.es}, así que escribimos ${fmtSigned(n)}.`,
    },
    zero: {
      say: {
        en: `Before placing an integer, name what 0 means. Here 0 is ${v.zeroLabel.en}.`,
        es: `Antes de ubicar un entero, nombra qué significa el 0. Aquí el 0 es ${v.zeroLabel.es}.`,
      },
      question: {
        en: `Which integer represents ${dist} ${v.unit.en} ${dirEn} ${v.zeroLabel.en}?`,
        es: `¿Qué entero representa ${dist} ${v.unit.es} ${dirEs} ${v.zeroLabel.es}?`,
      },
      ok: {
        en: `Yes: ${dirEn} 0 is ${n < 0 ? "negative" : "positive"}, so it is ${fmtSigned(n)}.`,
        es: `Sí: ${dirEs} 0 es ${n < 0 ? "negativo" : "positivo"}, así que es ${fmtSigned(n)}.`,
      },
    },
    mirror: {
      say: {
        en: `Opposites mirror across 0: slide the point and watch both dots stay the exact same distance from 0.`,
        es: `Los opuestos son espejo respecto al 0: desliza el punto y observa cómo ambos puntos quedan a la misma distancia del 0.`,
      },
      done: {
        en: `Every integer and its opposite sit on opposite sides of 0 at the exact same distance, and their total is 0.`,
        es: `Cada entero y su opuesto están en lados opuestos del 0 a la misma distancia, y el total es 0.`,
      },
    },
    transferExplain: {
      en: `Explain: how are ${fmtSigned(n)} and ${fmtSigned(opp)} alike, and how are they different?`,
      es: `Explica: ¿en qué se parecen ${fmtSigned(n)} y ${fmtSigned(opp)}, y en qué se diferencian?`,
    },
    transferFrame: {
      en: "They are the same distance from 0 (___), but they are on ___.",
      es: "Están a la misma distancia del 0 (___), pero están en ___.",
    },
  };
}
