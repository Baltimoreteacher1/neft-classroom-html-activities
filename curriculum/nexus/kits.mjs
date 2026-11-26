// nexus/kits.mjs — one kit per living play. A kit turns a VALIDATED model config
// into everything a resource needs: questions with computed answers, the
// misconception answers each question is known to attract, a fresh transfer
// problem, the twin's live consequences and the editable fields a teacher may
// change. Every number here comes from the engine's own model validators
// (engine/components/living/*-model.js), so a resource cannot carry a model the
// living play would refuse to draw, and an answer key cannot drift from its
// numbers. Pure; no DOM.

import { validateIntegers } from "../../engine/components/living/integers-opposites-model.js";
import { stats, validateMeanBalance } from "../../engine/components/living/mean-balance-model.js";
import { validateParallelogram } from "../../engine/components/living/parallelogram-area-model.js";
import { validatePercentWhole } from "../../engine/components/living/percent-whole.js";
import { unitRate, validateRatioScale } from "../../engine/components/living/ratio-scale-model.js";

const P = (en, es) => ({ en, es });
const round = (x) => Math.round(x * 1e6) / 1e6;
const fmt = (x) => String(round(x));

/** A deterministic 0..n-1 pick from a seed string (fresh problems differ per seed, replay is stable). */
export function pick(seed, n) {
  let h = 2166136261;
  for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Math.abs(h) % n;
}

/**
 * @typedef {{ en: string, es: string }} Pair
 * @typedef {{ answer: number, why: Pair, support: "model"|"vocab"|"prerequisite" }} Miscon
 * @typedef {{ id: string, stem: Pair, answer: number, unit: Pair, hint: Pair, miscon: Miscon[], skill: string }} Question
 */

const ratio = {
  id: "ratio-scale",
  validate: validateRatioScale,
  skill: P("Equivalent ratios", "Razones equivalentes"),
  fields: [
    { key: "a", label: P("First amount in one batch", "Primera cantidad por tanda"), min: 1, max: 6 },
    { key: "b", label: P("Second amount in one batch", "Segunda cantidad por tanda"), min: 1, max: 6 },
    { key: "k", label: P("Batches in the order", "Tandas del pedido"), min: 2, max: 5 },
  ],
  story: (v) =>
    P(
      `One batch uses ${v.a} ${v.labelA.en} and ${v.b} ${v.labelB.en}. A customer orders ${v.k} batches that must taste exactly the same.`,
      `Una tanda usa ${v.a} ${v.labelA.es} y ${v.b} ${v.labelB.es}. Un cliente pide ${v.k} tandas que deben saber exactamente igual.`,
    ),
  questions(v) {
    const { a, b, k, labelA: A, labelB: B } = v;
    const rate = unitRate(a, b);
    return [
      {
        id: "q1",
        skill: "scale",
        stem: P(`How many ${A.en} do ${k} batches need?`, `¿Cuántas ${A.es} necesitan ${k} tandas?`),
        answer: a * k,
        unit: A,
        hint: P(`Each batch adds another ${a}.`, `Cada tanda agrega otras ${a}.`),
        miscon: [
          {
            answer: a + (k - 1),
            why: P("This adds 1 for each extra batch instead of a whole batch.", "Esto suma 1 por tanda extra en lugar de una tanda completa."),
            support: "model",
          },
        ],
      },
      {
        id: "q2",
        skill: "equivalent",
        stem: P(`You used ${a * k} ${A.en}. How many ${B.en} keep the same mix?`, `Usaste ${a * k} ${A.es}. ¿Cuántas ${B.es} mantienen la misma mezcla?`),
        answer: b * k,
        unit: B,
        hint: P(`Multiply both amounts by the same number of batches.`, `Multiplica ambas cantidades por el mismo número de tandas.`),
        miscon: [
          {
            answer: b + (a * k - a),
            why: P("This adds the same amount to both parts. Adding changes the mix; multiplying keeps it.", "Esto suma lo mismo a ambas partes. Sumar cambia la mezcla; multiplicar la mantiene."),
            support: "model",
          },
        ],
      },
      {
        id: "q3",
        skill: "unit-rate",
        stem: P(`How many ${B.en} go with 1 ${A.en.replace(/s\b/, "")}?`, `¿Cuántas ${B.es} van con 1 de ${A.es}?`),
        answer: rate.value,
        unit: B,
        hint: P(`Divide the ${B.en} in one batch by the ${A.en}.`, `Divide las ${B.es} de una tanda entre las ${A.es}.`),
        miscon: [
          { answer: round(a / b), why: P("This divides the other way around.", "Esto divide al revés."), support: "vocab" },
        ],
      },
    ];
  },
  transfer(v, seed) {
    const t = v.transfer;
    const n = t.k + pick(seed, 3);
    return {
      id: "t1",
      skill: "transfer",
      stem: P(
        `New recipe: ${t.a} ${t.labelA.en} for every ${t.b} ${t.labelB.en}. With ${t.a * n} ${t.labelA.en}, how many ${t.labelB.en}?`,
        `Receta nueva: ${t.a} ${t.labelA.es} por cada ${t.b} ${t.labelB.es}. Con ${t.a * n} ${t.labelA.es}, ¿cuántas ${t.labelB.es}?`,
      ),
      answer: t.b * n,
      unit: t.labelB,
      hint: P("How many batches is that?", "¿Cuántas tandas son?"),
      miscon: [{ answer: t.b + t.a * n - t.a, why: P("Adding the same amount changes the mix.", "Sumar lo mismo cambia la mezcla."), support: "model" }],
    };
  },
  consequences: (v) => [
    { label: P(`Total ${v.labelA.en}`, `Total de ${v.labelA.es}`), value: v.a * v.k },
    { label: P(`Total ${v.labelB.en}`, `Total de ${v.labelB.es}`), value: v.b * v.k },
    { label: P("Total amount in the order", "Cantidad total del pedido"), value: (v.a + v.b) * v.k },
    { label: P(`${v.labelB.en} per 1 ${v.labelA.en.replace(/s\b/, "")}`, `${v.labelB.es} por 1 de ${v.labelA.es}`), value: unitRate(v.a, v.b).text },
  ],
};

const percent = {
  id: "percent-whole",
  validate: validatePercentWhole,
  skill: P("Percent of a whole", "Porcentaje de un total"),
  fields: [
    { key: "percent", label: P("Percent off", "Porcentaje de descuento"), min: 1, max: 99 },
    { key: "whole", label: P("Usual price", "Precio normal"), min: 2, max: 1000 },
  ],
  story: (v) =>
    v.story ||
    P(
      `${v.item.en} usually costs ${v.w} ${v.unit.en}. Today it is ${v.p}% off.`,
      `${v.item.es} normalmente cuesta ${v.w} ${v.unit.es}. Hoy tiene ${v.p}% de descuento.`,
    ),
  questions(v) {
    const { p, w, unit } = v;
    return [
      {
        id: "q1",
        skill: "benchmark",
        stem: P(`What is 10% of ${w} ${unit.en}?`, `¿Cuánto es el 10% de ${w} ${unit.es}?`),
        answer: round(w / 10),
        unit,
        hint: P("10% is one tenth of the whole.", "El 10% es un décimo del total."),
        miscon: [{ answer: 10, why: P("10 is the percent, not the part of the price.", "10 es el porcentaje, no la parte del precio."), support: "vocab" }],
      },
      {
        id: "q2",
        skill: "part",
        stem: P(`How many ${unit.en} do you save at ${p}% off?`, `¿Cuántos ${unit.es} ahorras con ${p}% de descuento?`),
        answer: round((p * w) / 100),
        unit,
        hint: P(`${p}% means ${p} out of every 100.`, `${p}% significa ${p} de cada 100.`),
        miscon: [
          { answer: p, why: P("This uses the percent as if it were the number of tickets saved.", "Esto usa el porcentaje como si fuera la cantidad ahorrada."), support: "model" },
          { answer: w - p, why: P("This subtracts the percent from the price.", "Esto resta el porcentaje del precio."), support: "model" },
        ],
      },
      {
        id: "q3",
        skill: "remaining",
        stem: P(`What is the sale price?`, `¿Cuál es el precio de oferta?`),
        answer: round(w - (p * w) / 100),
        unit,
        hint: P("Take the savings away from the usual price.", "Resta el ahorro del precio normal."),
        miscon: [{ answer: round((p * w) / 100), why: P("That is the savings, not what you pay.", "Eso es el ahorro, no lo que pagas."), support: "vocab" }],
      },
    ];
  },
  transfer(v, seed) {
    const { p, w } = v.transfer;
    const ww = w + 10 * pick(seed, 3);
    return {
      id: "t1",
      skill: "transfer",
      stem: P(`A jacket costs $${ww}. It is ${p}% off. How many dollars do you save?`, `Una chaqueta cuesta $${ww}. Tiene ${p}% de descuento. ¿Cuántos dólares ahorras?`),
      answer: round((p * ww) / 100),
      unit: P("dollars", "dólares"),
      hint: P("Find 1% or 10% first.", "Primero halla el 1% o el 10%."),
      miscon: [{ answer: p, why: P("The percent is not the dollar amount.", "El porcentaje no es la cantidad en dólares."), support: "model" }],
    };
  },
  consequences: (v) => [
    { label: P("Savings", "Ahorro"), value: fmt((v.p * v.w) / 100) },
    { label: P("Sale price", "Precio de oferta"), value: fmt(v.w - (v.p * v.w) / 100) },
    { label: P("Sale price as a percent", "Precio de oferta en porcentaje"), value: `${100 - v.p}%` },
  ],
};

const mean = {
  id: "mean-balance",
  validate: validateMeanBalance,
  skill: P("The mean as a fair share", "La media como reparto justo"),
  fields: [],
  story: (v) =>
    v.story ||
    P(`The data: ${v.values.map((x) => v.prefix + x).join(", ")}.`, `Los datos: ${v.values.map((x) => v.prefix + x).join(", ")}.`),
  questions(v) {
    const s = stats(v.values);
    const u = P(v.prefix === "$" ? "dollars" : "", v.prefix === "$" ? "dólares" : "");
    const qs = [
      { id: "q1", skill: "total", stem: P("What is the total of all the values?", "¿Cuál es el total de todos los valores?"), answer: s.total, unit: u, hint: P("Add every value.", "Suma todos los valores."), miscon: [] },
      {
        id: "q2",
        skill: "mean",
        stem: P("If the total were shared out evenly, how much would each get? (the mean)", "Si el total se repartiera por igual, ¿cuánto recibiría cada uno? (la media)"),
        answer: s.mean,
        unit: u,
        hint: P(`Share the total among ${s.n} values.`, `Reparte el total entre ${s.n} valores.`),
        miscon: [],
      },
      {
        id: "q3",
        skill: "add-mean",
        stem: P(`A new value of ${v.prefix}${fmt(s.mean)} is added. What is the new mean?`, `Se agrega un valor nuevo de ${v.prefix}${fmt(s.mean)}. ¿Cuál es la nueva media?`),
        answer: s.mean,
        unit: u,
        hint: P("Does the new value need to give or take any to be level?", "¿El valor nuevo necesita dar o quitar algo para quedar nivelado?"),
        miscon: [{ answer: round((s.total + s.mean) / s.n), why: P("This adds the value but forgets there is one more value to share with.", "Esto suma el valor pero olvida que hay un valor más para repartir."), support: "model" }],
      },
    ];
    // A distractor is only diagnostic if it differs from the right answer.
    const m = qs[1].miscon;
    if (s.median !== s.mean) m.push({ answer: s.median, why: P("That is the middle value (the median), not the fair share.", "Ese es el valor del medio (la mediana), no el reparto justo."), support: "vocab" });
    if (s.midrange !== s.mean && s.midrange !== s.median) m.push({ answer: s.midrange, why: P("That is halfway between the smallest and largest, not the fair share.", "Eso está a mitad entre el menor y el mayor, no es el reparto justo."), support: "model" });
    return qs;
  },
  transfer(v, seed) {
    const base = v.transfer.values;
    const shift = pick(seed, 3);
    const vals = base.map((x) => x + shift * v.unit);
    const s = stats(vals);
    return {
      id: "t1",
      skill: "transfer",
      stem: P(`Four friends scored ${vals.join(", ")} points. What is the mean score?`, `Cuatro amigos sacaron ${vals.join(", ")} puntos. ¿Cuál es el puntaje medio?`),
      answer: s.mean,
      unit: P("points", "puntos"),
      hint: P("Total, then share evenly.", "Total y luego reparte por igual."),
      miscon: s.median !== s.mean ? [{ answer: s.median, why: P("That is the median.", "Esa es la mediana."), support: "vocab" }] : [],
    };
  },
  consequences: (v) => {
    const s = stats(v.values);
    return [
      { label: P("Total", "Total"), value: v.prefix + fmt(s.total) },
      { label: P("Number of values", "Cantidad de valores"), value: s.n },
      { label: P("Mean (fair share)", "Media (reparto justo)"), value: v.prefix + fmt(s.mean) },
      { label: P("Median", "Mediana"), value: v.prefix + fmt(s.median) },
    ];
  },
};

const para = {
  id: "parallelogram-area",
  validate: validateParallelogram,
  skill: P("Area of a parallelogram", "Área de un paralelogramo"),
  fields: [
    { key: "base", label: P("Base", "Base"), min: 3, max: 30 },
    { key: "height", label: P("Height", "Altura"), min: 2, max: 20 },
    { key: "slant", label: P("Slanted side", "Lado inclinado"), min: 3, max: 35 },
    { key: "price", label: P("Price per square unit ($)", "Precio por unidad cuadrada ($)"), min: 1, max: 20, env: true },
  ],
  envDefaults: { price: 4 },
  story: (v) =>
    P(
      `A patio is a parallelogram: base ${v.base} ${v.unit.en}, height ${v.height} ${v.unit.en}, slanted side ${v.slant} ${v.unit.en}. Pavers cost $${v.price} per square ${v.unit.en}.`,
      `Un patio es un paralelogramo: base ${v.base} ${v.unit.es}, altura ${v.height} ${v.unit.es}, lado inclinado ${v.slant} ${v.unit.es}. Los adoquines cuestan $${v.price} por ${v.unit.es} cuadrado.`,
    ),
  questions(v) {
    const { base, height, slant, unit, price } = v;
    const sq = P(`square ${unit.en}`, `${unit.es} cuadrados`);
    return [
      {
        id: "q1",
        skill: "area",
        stem: P("What is the area of the patio?", "¿Cuál es el área del patio?"),
        answer: base * height,
        unit: sq,
        hint: P("Cut the triangle off one end and slide it to the other. What rectangle do you get?", "Corta el triángulo de un extremo y deslízalo al otro. ¿Qué rectángulo obtienes?"),
        miscon: [
          { answer: base * slant, why: P("This uses the slanted side. Area needs the height, which meets the base at a right angle.", "Esto usa el lado inclinado. El área necesita la altura, que forma un ángulo recto con la base."), support: "model" },
          { answer: 2 * (base + slant), why: P("That is the perimeter: the distance around, not the space inside.", "Ese es el perímetro: la distancia alrededor, no el espacio interior."), support: "vocab" },
        ],
      },
      {
        id: "q2",
        skill: "cost",
        stem: P(`Pavers cost $${price} per square ${unit.en}. What do they cost for the whole patio?`, `Los adoquines cuestan $${price} por ${unit.es} cuadrado. ¿Cuánto cuestan para todo el patio?`),
        answer: base * height * price,
        unit: P("dollars", "dólares"),
        hint: P("Every square unit costs the same amount.", "Cada unidad cuadrada cuesta lo mismo."),
        miscon: [{ answer: base * slant * price, why: P("This prices the slanted side times the base, which is more than the patio's area.", "Esto usa el lado inclinado por la base, que es más que el área del patio."), support: "model" }],
      },
      {
        id: "q3",
        skill: "scale",
        stem: P("If the base doubles and the height stays the same, what is the new area?", "Si la base se duplica y la altura sigue igual, ¿cuál es la nueva área?"),
        answer: 2 * base * height,
        unit: sq,
        hint: P("Two copies of the same patio, side by side.", "Dos copias del mismo patio, una al lado de la otra."),
        miscon: [{ answer: 4 * base * height, why: P("Only one dimension doubled, so the area doubles, not quadruples.", "Solo se duplicó una dimensión, así que el área se duplica, no se cuadruplica."), support: "model" }],
      },
    ];
  },
  transfer(v, seed) {
    const t = v.transfer[pick(seed, v.transfer.length)];
    return {
      id: "t1",
      skill: "transfer",
      stem: P(
        `A garden bed is a parallelogram with base ${t.base} ${t.unit.en}, slanted side ${t.slant} ${t.unit.en} and height ${t.height} ${t.unit.en}. What is its area?`,
        `Un cantero es un paralelogramo con base ${t.base} ${t.unit.es}, lado inclinado ${t.slant} ${t.unit.es} y altura ${t.height} ${t.unit.es}. ¿Cuál es su área?`,
      ),
      answer: t.base * t.height,
      unit: P(`square ${t.unit.en}`, `${t.unit.es} cuadrados`),
      hint: P("Which measurement meets the base at a right angle?", "¿Qué medida forma un ángulo recto con la base?"),
      miscon: [{ answer: t.base * t.slant, why: P("The slanted side is not the height.", "El lado inclinado no es la altura."), support: "model" }],
    };
  },
  consequences: (v) => [
    { label: P("Area", "Área"), value: `${v.base * v.height} ${v.unit.en}²` },
    { label: P("Perimeter (for edging)", "Perímetro (para el borde)"), value: `${2 * (v.base + v.slant)} ${v.unit.en}` },
    { label: P("Paver cost", "Costo de adoquines"), value: `$${v.base * v.height * v.price}` },
  ],
};

const integers = {
  id: "integers-opposites",
  validate: validateIntegers,
  skill: P("Integers and opposites", "Enteros y opuestos"),
  fields: [{ key: "value", label: P("Starting value", "Valor inicial"), min: -99, max: 99 }],
  story: (v) =>
    P(
      `${v.place.en} is at ${v.value} ${v.unit.en}, measured from ${v.zeroLabel.en}.`,
      `${v.place.es} está a ${v.value} ${v.unit.es}, medido desde ${v.zeroLabel.es}.`,
    ),
  questions(v) {
    const n = v.value;
    const t = v.transfer[0];
    return [
      { id: "q1", skill: "opposite", stem: P(`What is the opposite of ${n}?`, `¿Cuál es el opuesto de ${n}?`), answer: -n, unit: v.unit, hint: P("Same distance from zero, other side.", "Misma distancia del cero, del otro lado."), miscon: [{ answer: n, why: P("That is the same number. Its opposite is on the other side of zero.", "Ese es el mismo número. Su opuesto está del otro lado del cero."), support: "model" }] },
      { id: "q2", skill: "distance", stem: P(`How far is ${n} from zero?`, `¿Qué tan lejos está ${n} del cero?`), answer: Math.abs(n), unit: v.unit, hint: P("Distance is never negative.", "La distancia nunca es negativa."), miscon: n < 0 ? [{ answer: n, why: P("A distance counts steps, so it cannot be negative.", "Una distancia cuenta pasos, así que no puede ser negativa."), support: "vocab" }] : [] },
      {
        id: "q3",
        skill: "compare",
        stem: P(`Which is farther from zero: ${n} or ${t.value}? Type the number.`, `¿Cuál está más lejos del cero: ${n} o ${t.value}? Escribe el número.`),
        answer: Math.abs(n) >= Math.abs(t.value) ? n : t.value,
        unit: P("", ""),
        hint: P("Compare distances, not signs.", "Compara distancias, no signos."),
        miscon: [{ answer: Math.abs(n) >= Math.abs(t.value) ? t.value : n, why: P("Farther from zero means the larger distance, whatever the sign.", "Más lejos del cero significa mayor distancia, sin importar el signo."), support: "model" }],
      },
    ];
  },
  transfer(v, seed) {
    const t = v.transfer[pick(seed, v.transfer.length)];
    return {
      id: "t1",
      skill: "transfer",
      stem: P(`${t.place.en} is at ${t.value} ${t.unit.en} from ${t.zeroLabel.en}. What value is the same distance on the other side?`, `${t.place.es} está a ${t.value} ${t.unit.es} de ${t.zeroLabel.es}. ¿Qué valor está a la misma distancia del otro lado?`),
      answer: -t.value,
      unit: t.unit,
      hint: P("The opposite.", "El opuesto."),
      miscon: [{ answer: t.value, why: P("That is the same side of zero.", "Ese es el mismo lado del cero."), support: "model" }],
    };
  },
  consequences: (v) => [
    { label: P("Value", "Valor"), value: v.value },
    { label: P("Opposite", "Opuesto"), value: -v.value },
    { label: P("Distance from zero", "Distancia del cero"), value: Math.abs(v.value) },
  ],
};

export const KITS = { "ratio-scale": ratio, "percent-whole": percent, "mean-balance": mean, "parallelogram-area": para, "integers-opposites": integers };

/** The validated model (play validator + twin env), or null. Env values never reach the play. */
export function validModel(kitId, model, env = {}) {
  const kit = KITS[kitId];
  if (!kit) return null;
  const v = kit.validate(model);
  if (!v) return null;
  const out = { ...v };
  for (const f of kit.fields.filter((x) => x.env)) {
    const n = Number(env?.[f.key] ?? kit.envDefaults?.[f.key]);
    if (!Number.isInteger(n) || n < f.min || n > f.max) return null;
    out[f.key] = n;
  }
  return out;
}
