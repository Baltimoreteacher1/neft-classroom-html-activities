// living/rational-line-model.js — the mathematics and the words of the
// rational-line play (Lesson 7-2: place rational numbers, and their opposites,
// at an exact spot on a number line).
//
// Pure functions only (no DOM): every number the play shows a student is
// computed here so rational-line.test.mjs can check each one in node.

import {
  betweenInts,
  count,
  fracText,
  near,
  num,
  okInt,
  pairOf,
  placeCorrect,
} from "./numline-model.js";

export { placeCorrect };

const onGrid = (v, den) => Number.isFinite(v) && near(v * den, Math.round(v * den));

/** The clue the predict scene asks about: an odd multiple of 1/2, away from 0. */
function validTarget(t, min, max) {
  const value = Number(t?.value);
  const name = pairOf(t?.name, 24);
  if (!name || !onGrid(value, 2) || Number.isInteger(value) || Math.abs(value) < 1.5) return null;
  const all = predictChoices(value).map((o) => o.value);
  const distinct = new Set(all.map((x) => Math.round(x * 2))).size === all.length;
  if (!distinct || all.some((x) => x < min || x > max)) return null;
  return { value, name };
}

function validPlace(p, min, max) {
  const value = Number(p?.value);
  const den = Number(p?.den);
  const name = pairOf(p?.name, 24);
  if (!name || !okInt(den, 2, 10) || !onGrid(value, den) || Number.isInteger(value)) return null;
  if (value < min || value > max) return null;
  return { value, den, name };
}

/** A unit fraction on the line: |value| = 1/d, d ≥ 2, so "−1/2" is a real thing to place. */
function validTransfer(t, min, max) {
  const value = Number(t?.value);
  const name = pairOf(t?.name, 24);
  if (!name || !Number.isFinite(value) || value === 0 || Math.abs(value) >= 1) return null;
  const d = Math.round(1 / Math.abs(value));
  if (!okInt(d, 2, 4) || !near(Math.abs(value), 1 / d)) return null;
  const choices = transferChoices(value, d);
  const xs = choices.map((c) => c.value).sort((p, q) => p - q);
  if (xs.some((x) => x < min || x > max) || xs.some((_x, i) => i && xs[i] - xs[i - 1] < 0.5 - 1e-9))
    return null;
  return { value, den: d, name, choices };
}

export function validateRationalLine(cfg) {
  if (!cfg || typeof cfg !== "object") return null;
  const min = Number(cfg.min);
  const max = Number(cfg.max);
  if (!okInt(min, -12, -2) || !okInt(max, 2, 12) || max - min > 12) return null;
  const target = validTarget(cfg.target, min, max);
  const place = validPlace(cfg.place, min, max);
  const transfer = validTransfer(cfg.transfer, min, max);
  if (!target || !place || !transfer) return null;
  if (near(place.value, target.value) || near(transfer.value, target.value)) return null;
  return { min, max, target, place, transfer };
}

/** Predict choices for a clue v: the exact spot and three real mistakes. */
export function predictChoices(v) {
  return [
    { kind: "exact", value: v, correct: true },
    { kind: Math.abs(v + 1) < Math.abs(v) ? "closer" : "farther", value: v + 1 },
    { kind: "mirror", value: -v },
    { kind: Math.abs(v - 1) < Math.abs(v) ? "closer" : "farther", value: v - 1 },
  ];
}

/** Transfer letters A, B, C… from left to right: v and the mistakes that misread it. */
export function transferChoices(v, d) {
  const raw = [
    { kind: "exact", value: v, correct: true },
    { kind: "sign", value: -v },
    { kind: "whole", value: v + Math.sign(v) },
    { kind: "denominator", value: Math.sign(v) * d },
  ];
  return raw
    .sort((p, q) => p.value - q.value)
    .map((c, i) => ({ ...c, letter: String.fromCharCode(65 + i) }));
}

/** Where a value sits among the whole numbers: lo, hi, and r of den equal parts from lo. */
export function partsOf(v, den) {
  const b = betweenInts(v);
  if (!b) return { whole: true, at: v };
  return { whole: false, lo: b[0], hi: b[1], r: Math.round((v - b[0]) * den), den };
}

export function rationalCopy(v) {
  const { min, max, target: tg, place: pl, transfer: tr } = v;
  const tv = tg.value;
  const [tlo, thi] = betweenInts(tv);
  const pf = fracText(pl.value, pl.den);
  const trFrac = fracText(tr.value, tr.den);
  const both = (en, es) => ({ en, es });
  const side = (x) => (x > 0 ? both("right", "derecha") : both("left", "izquierda"));
  const word = (x) => (x > 0 ? both("positive", "positivo") : both("negative", "negativo"));
  const halfway = (c) => {
    const lo = Math.floor(c);
    return both(
      `Halfway between ${num(lo)} and ${num(lo + 1)}`,
      `A mitad de camino entre ${num(lo)} y ${num(lo + 1)}`,
    );
  };
  const units = (x) => count(x, both("units", "unidades"));
  return {
    kicker: both("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: both("Placing rational numbers exactly", "Ubicar números racionales con exactitud"),
    ariaLabel: both(
      `A horizontal number line from ${num(min)} to ${max}. ${tg.name.en} at ${num(tv)} sits halfway between ${num(tlo)} and ${num(thi)}. Its opposite, ${num(-tv)}, is the same distance from 0 on the other side. ${pl.name.en} at ${num(pl.value)}, which is ${pf}, takes ${pl.den} equal parts between ${num(Math.floor(pl.value))} and ${num(Math.floor(pl.value) + 1)}.`,
      `Una recta numérica horizontal de ${num(min)} a ${max}. ${tg.name.es} en ${num(tv)} está a mitad de camino entre ${num(tlo)} y ${num(thi)}. Su opuesto, ${num(-tv)}, está a la misma distancia del 0 del otro lado. ${pl.name.es} en ${num(pl.value)}, que es ${pf}, usa ${pl.den} partes iguales entre ${num(Math.floor(pl.value))} y ${num(Math.floor(pl.value) + 1)}.`,
    ),
    printSummary: both(
      `${num(tv)} is between ${num(tlo)} and ${num(thi)}: split that space into 2 equal parts and use the middle mark. Its opposite is ${num(-tv)}. ${num(pl.value)} = ${pf}: split 0 to 1 into ${pl.den} equal parts and count ${Math.round(pl.value * pl.den)}. ${trFrac} = ${num(tr.value)}.`,
      `${num(tv)} está entre ${num(tlo)} y ${num(thi)}: parte ese espacio en 2 partes iguales y usa la marca del medio. Su opuesto es ${num(-tv)}. ${num(pl.value)} = ${pf}: parte de 0 a 1 en ${pl.den} partes iguales y cuenta ${Math.round(pl.value * pl.den)}. ${trFrac} = ${num(tr.value)}.`,
    ),
    scene: {
      situate: both("The clue", "La pista"),
      predict: both("Predict", "Predice"),
      place: both("Place it exactly", "Ubícalo con exactitud"),
      mirror: both("Its opposite", "Su opuesto"),
      transfer: both("On your own", "Por tu cuenta"),
    },
    names: {
      tg: tg.name,
      pl: pl.name,
      opp: both("Opposite", "Opuesto"),
      tr: tr.name,
    },
    unitsOf: units,
    situateSay: both(
      `Treasure clue: ${tg.name.en} is at ${num(tv)}. Every step of 1 on this line is the same length.`,
      `Pista del tesoro: ${tg.name.es} está en ${num(tv)}. Cada paso de 1 en esta recta mide lo mismo.`,
    ),
    predictSay: both(
      `Where does ${num(tv)} go? Think about which whole numbers it is between.`,
      `¿Dónde va ${num(tv)}? Piensa entre qué números enteros está.`,
    ),
    predictQ: both(`${num(tv)} is…`, `${num(tv)} está…`),
    predictLabel: (c) => halfway(c),
    predictCue(kind, c) {
      const cc = num(c);
      const d = units(c);
      const cues = {
        closer: both(
          `${cc} is ${d.en} from 0. Is ${num(tv)} more or less than ${d.en} from 0?`,
          `${cc} está a ${d.es} del 0. ¿${num(tv)} está a más o a menos de ${d.es} del 0?`,
        ),
        farther: both(
          `Count from 0: ${cc} is ${d.en} out. Does ${num(tv)} reach that far?`,
          `Cuenta desde el 0: ${cc} está a ${d.es}. ¿${num(tv)} llega tan lejos?`,
        ),
        mirror: both(
          `${cc} is on the ${side(c).en} of 0, but ${num(tv)} is ${word(tv).en}. Which side of 0 do ${word(tv).en} numbers go on?`,
          `${cc} está a la ${side(c).es} del 0, pero ${num(tv)} es ${word(tv).es}. ¿De qué lado del 0 van los números ${word(tv).es}s?`,
        ),
      };
      return cues[kind];
    },
    predictOk: both(
      `Yes: ${num(tv)} is halfway between ${num(tlo)} and ${num(thi)}. The .5 means half of one step, so split that space into 2 equal parts and use the middle mark. ${num(tv)} = ${fracText(tv, 2)}.`,
      `Sí: ${num(tv)} está a mitad de camino entre ${num(tlo)} y ${num(thi)}. El .5 es la mitad de un paso: parte ese espacio en 2 partes iguales y usa la marca del medio. ${num(tv)} = ${fracText(tv, 2)}.`,
    ),
    placeSay: both(
      `Next clue: ${pl.name.en} is at ${num(pl.value)}, which equals ${pf}. Slide the dot to its exact spot.`,
      `Otra pista: ${pl.name.es} está en ${num(pl.value)}, que es igual a ${pf}. Desliza el punto hasta su lugar exacto.`,
    ),
    placeLabel: both("Move the dot", "Mueve el punto"),
    placeRow(x) {
      const p = partsOf(x, pl.den);
      if (p.whole)
        return both(
          `${num(x)} is a whole number: it sits right on a mark.`,
          `${num(x)} es un número entero: queda justo sobre una marca.`,
        );
      return both(
        `${num(x)} = ${fracText(x, pl.den)}: between ${num(p.lo)} and ${num(p.hi)}, ${p.r} of ${p.den} equal parts from ${num(p.lo)}.`,
        `${num(x)} = ${fracText(x, pl.den)}: entre ${num(p.lo)} y ${num(p.hi)}, ${p.r} de ${p.den} partes iguales desde ${num(p.lo)}.`,
      );
    },
    placeCue: (x) => {
      const p = partsOf(x, pl.den);
      return both(
        `The dot is at ${num(x)}${p.whole ? "" : `, ${p.r} of ${p.den} equal parts from ${num(p.lo)}`}. Which two whole numbers is ${num(pl.value)} between, and what does the denominator ${pl.den} of ${pf} tell you?`,
        `El punto está en ${num(x)}${p.whole ? "" : `, ${p.r} de ${p.den} partes iguales desde ${num(p.lo)}`}. ¿Entre qué dos números enteros está ${num(pl.value)} y qué te dice el denominador ${pl.den} de ${pf}?`,
      );
    },
    placeOk: both(
      `Yes: ${num(pl.value)} = ${pf}. The denominator ${pl.den} splits the space from 0 to 1 into ${pl.den} equal parts, and the numerator ${Math.round(pl.value * pl.den)} counts ${Math.round(pl.value * pl.den)} of them.`,
      `Sí: ${num(pl.value)} = ${pf}. El denominador ${pl.den} parte el espacio de 0 a 1 en ${pl.den} partes iguales y el numerador ${Math.round(pl.value * pl.den)} cuenta ${Math.round(pl.value * pl.den)} de ellas.`,
    ),
    mirrorSay: both(
      `Back to ${tg.name.en} at ${num(tv)} (${fracText(tv, 2)}). Its opposite is the same distance from 0, on the other side.`,
      `Volvemos a ${tg.name.es} en ${num(tv)} (${fracText(tv, 2)}). Su opuesto está a la misma distancia del 0, del otro lado.`,
    ),
    mirrorFb: both(
      `The opposite of ${num(tv)} is ${num(-tv)}: both are ${units(tv).en} from 0. Rational numbers have opposites just like integers: ${fracText(tv, 2)} and ${fracText(-tv, 2)}.`,
      `El opuesto de ${num(tv)} es ${num(-tv)}: los dos están a ${units(tv).es} del 0. Los números racionales tienen opuestos igual que los enteros: ${fracText(tv, 2)} y ${fracText(-tv, 2)}.`,
    ),
    mirrorExpr: `−(${num(tv)}) = ${num(-tv)}`,
    transferSay: both(
      `Last clue: ${tr.name.en} is at ${trFrac}. One of the letters marks it.`,
      `Última pista: ${tr.name.es} está en ${trFrac}. Una de las letras lo marca.`,
    ),
    transferQ: both(`Which letter marks ${trFrac}?`, `¿Qué letra marca ${trFrac}?`),
    transferCue(kind, c) {
      const cc = num(c);
      const cues = {
        sign: both(
          `That spot is ${cc}, on the ${side(c).en} of 0. ${trFrac} is ${word(tr.value).en}. Which side of 0 do ${word(tr.value).en} numbers go on?`,
          `Ese lugar es ${cc}, a la ${side(c).es} del 0. ${trFrac} es ${word(tr.value).es}. ¿De qué lado del 0 van los números ${word(tr.value).es}s?`,
        ),
        whole: both(
          `That spot is ${cc}, ${units(c).en} from 0. Is ${trFrac} more or less than 1 whole unit from 0?`,
          `Ese lugar es ${cc}, a ${units(c).es} del 0. ¿${trFrac} está a más o a menos de 1 unidad entera del 0?`,
        ),
        denominator: both(
          `That spot is ${cc}. The ${tr.den} in ${trFrac} says how many equal parts one unit is split into, not how many units from 0. How far from 0 is ${trFrac}?`,
          `Ese lugar es ${cc}. El ${tr.den} de ${trFrac} dice en cuántas partes iguales se parte una unidad, no a cuántas unidades del 0 está. ¿A qué distancia del 0 está ${trFrac}?`,
        ),
      };
      return cues[kind];
    },
    transferOk: both(
      `Yes: ${trFrac} = ${num(tr.value)}, half a step to the ${tr.value < 0 ? "left" : "right"} of 0. A fraction and its decimal mark the same spot.`,
      `Sí: ${trFrac} = ${num(tr.value)}, medio paso a la ${tr.value < 0 ? "izquierda" : "derecha"} del 0. Una fracción y su decimal marcan el mismo lugar.`,
    ),
    explainLabel: both(
      "Explain: how do you place a rational number that is not a whole number?",
      "Explica: ¿cómo ubicas un número racional que no es entero?",
    ),
    explainFrame: both(
      "First I find the two whole numbers it is between. Then I split ___ into ___ equal parts and ___.",
      "Primero hallo los dos números enteros entre los que está. Luego parto ___ en ___ partes iguales y ___.",
    ),
  };
}
