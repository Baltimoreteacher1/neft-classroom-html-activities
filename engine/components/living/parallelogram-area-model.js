// living/parallelogram-area-model.js — pure math & bilingual copy for Unit 5
// parallelogram → rectangle cut-and-slide area derivation. No DOM.

export const W = 680;
export const H = 340;
export const okInt = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;

export function paraArea({ base, height }) {
  return base * height;
}

export function cleanUnit(u) {
  if (!u) return { en: "ft", es: "ft" };
  if (typeof u === "string" && u.trim())
    return { en: u.trim().slice(0, 12), es: u.trim().slice(0, 12) };
  if (typeof u === "object" && typeof u.en === "string" && u.en.trim()) {
    return {
      en: u.en.trim().slice(0, 12),
      es:
        typeof u.es === "string" && u.es.trim()
          ? u.es.trim().slice(0, 12)
          : u.en.trim().slice(0, 12),
    };
  }
  return null;
}

function cleanPara(c) {
  const base = Number(c?.base);
  const height = Number(c?.height);
  const slant = Number(c?.slant ?? height + 1);
  if (!okInt(base, 3, 30) || !okInt(height, 2, 20) || !okInt(slant, height + 1, 35)) return null;
  const unit = cleanUnit(c?.unit);
  if (!unit) return null;
  // Ensure base * height, base * slant, and 2*(base + slant) are all distinct
  const a = base * height;
  if (a === base * slant || a === 2 * (base + slant) || a === base + height) return null;
  return { base, height, slant, unit };
}

export function validateParallelogram(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const core = cleanPara(cfg);
  if (!core) return null;
  const rawT = Array.isArray(cfg.transfer) ? cfg.transfer : cfg.transfer ? [cfg.transfer] : [];
  const transfer = rawT
    .map(cleanPara)
    .filter((t) => t && !(t.base === core.base && t.height === core.height));
  const defaults = [
    { base: 10, height: 7, slant: 8, unit: { en: "cm", es: "cm" } },
    { base: 12, height: 5, slant: 6, unit: { en: "m", es: "m" } },
    { base: 8, height: 6, slant: 7, unit: { en: "in", es: "pulg" } },
  ];
  for (const d of defaults) {
    if (transfer.length >= 3) break;
    if (!transfer.some((t) => t.base === d.base && t.height === d.height)) transfer.push(d);
  }
  return { ...core, transfer };
}

export function paraChoices(p) {
  const area = paraArea(p);
  const cands = [
    { kind: "exact", value: area, correct: true },
    { kind: "slant", value: p.base * p.slant, correct: false },
    { kind: "half", value: Math.round(area / 2), correct: false },
    { kind: "perim", value: 2 * (p.base + p.slant), correct: false },
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

export function paraCopy(v) {
  const area = paraArea(v);
  const wrongSlant = v.base * v.slant;
  const u = v.unit;
  return {
    area,
    wrongSlant,
    title: {
      en: `Cut & slide: parallelogram (${v.base} × ${v.height})`,
      es: `Corta y desliza: paralelogramo (${v.base} × ${v.height})`,
    },
    ariaLabel: {
      en: `A parallelogram with base ${v.base} ${u.en} and perpendicular height ${v.height} ${u.en}. Cutting the left right-triangle and sliding it to the right forms a ${v.base} by ${v.height} rectangle with area ${area}.`,
      es: `Un paralelogramo de base ${v.base} ${u.es} y altura perpendicular ${v.height} ${u.es}. Al cortar el triángulo rectángulo de la izquierda y deslizarlo a la derecha se forma un rectángulo de ${v.base} por ${v.height} con área ${area}.`,
    },
    printSummary: {
      en: `Cut the slanted right triangle off the parallelogram and slide it to the other side: it becomes a rectangle with base ${v.base} ${u.en} and height ${v.height} ${u.en}. Area = ${v.base} × ${v.height} = ${area} sq ${u.en} (never use the slanted side ${v.slant}).`,
      es: `Corta el triángulo rectángulo del paralelogramo y deslízalo al otro lado: se convierte en un rectángulo de base ${v.base} ${u.es} y altura ${v.height} ${u.es}. Área = ${v.base} × ${v.height} = ${area} ${u.es}² (nunca uses el lado inclinado ${v.slant}).`,
    },
    askChild: {
      situate: {
        en: `Which line shows the straight-up perpendicular height (${v.height}) and which is the slanted side (${v.slant})?`,
        es: `¿Qué línea muestra la altura perpendicular (${v.height}) y cuál es el lado inclinado (${v.slant})?`,
      },
      slant: {
        en: `Why is multiplying base × slanted side (${v.base} × ${v.slant} = ${wrongSlant}) too large?`,
        es: `¿Por qué multiplicar base × lado inclinado (${v.base} × ${v.slant} = ${wrongSlant}) da demasiado?`,
      },
      morph: {
        en: `When the triangle slides to the other side, did the total area change or stay the same?`,
        es: `Cuando el triángulo se desliza al otro lado, ¿cambió el total del área o quedó igual?`,
      },
      transfer: {
        en: `Before multiplying, how do you spot which number is the true height?`,
        es: `Antes de multiplicar, ¿cómo identificas cuál número es la altura verdadera?`,
      },
    },
    situate: {
      en: `This parallelogram has base ${v.base} ${u.en}, perpendicular height ${v.height} ${u.en} (at a 90° corner), and slanted side ${v.slant} ${u.en}.`,
      es: `Este paralelogramo tiene base ${v.base} ${u.es}, altura perpendicular ${v.height} ${u.es} (ángulo de 90°) y lado inclinado ${v.slant} ${u.es}.`,
    },
    slant: {
      say: {
        en: `Predict the area before we rearrange it. Watch out for the slanted side (${v.slant} ${u.en})!`,
        es: `Predice el área antes de reordenarlo. ¡Cuidado con el lado inclinado (${v.slant} ${u.es})!`,
      },
      question: {
        en: `What is the area of this parallelogram (sq ${u.en})?`,
        es: `¿Cuál es el área de este paralelogramo (${u.es}²)?`,
      },
      ok: {
        en: `Yes: A = base × height = ${v.base} × ${v.height} = ${area} sq ${u.en}.`,
        es: `Sí: A = base × altura = ${v.base} × ${v.height} = ${area} ${u.es}².`,
      },
    },
    morph: {
      say: {
        en: `Slide the cut triangle from left to right. Nothing is added or removed, so el total del área stays identical!`,
        es: `Desliza el triángulo cortado de izquierda a derecha. No se agrega ni se quita nada, así que el total del área sigue igual.`,
      },
      sayEn: `Slide the cut triangle from left to right. Nothing is added or removed, so the total area stays identical — forming a ${v.base} × ${v.height} rectangle!`,
      done: {
        en: `Same pieces, exact ${v.base} × ${v.height} rectangle → A = ${area} sq ${u.en}.`,
        es: `Las mismas piezas forman un rectángulo exacto de ${v.base} × ${v.height} → A = ${area} ${u.es}².`,
      },
    },
    transferExplain: {
      en: `Explain: why is the area of a parallelogram base × height and NOT base × slanted side?`,
      es: `Explica: ¿por qué el área de un paralelogramo es base × altura y NO base × lado inclinado?`,
    },
    transferFrame: {
      en: "When you cut and slide the triangle, it forms a rectangle whose height is ___.",
      es: "Cuando cortas y deslizas el triángulo, se forma un rectángulo cuya altura es ___.",
    },
  };
}
