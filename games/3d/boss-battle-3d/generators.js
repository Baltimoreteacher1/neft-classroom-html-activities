/**
 * Boss Battle 3D — procedural round generators, one list per Reveal unit.
 * Each returns a round (shape documented in mechanics.js). Numbers are fresh
 * every call; answers are computed, never hard-coded.
 */
import { fracStr, gcd } from "./mechanics.js";

const ri = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const sign = (rng) => (rng() < 0.5 ? -1 : 1);
const lcm = (a, b) => (a * b) / gcd(a, b);
const sup = (e) => ({ 2: "²", 3: "³", 4: "⁴" })[e] || `^${e}`;

const BEAM_LOW = {
  en: "Not enough power — the beam fizzles short of the boss.",
  es: "No hay suficiente poder — el rayo se apaga antes de llegar al jefe.",
};
const BEAM_HIGH = {
  en: "Too much power — the shield reflects the overcharged beam.",
  es: "Demasiado poder — el escudo refleja el rayo sobrecargado.",
};
const FILL_LOW = {
  en: "The beam fills only part of the shield shape — not enough.",
  es: "El rayo llena solo parte de la figura del escudo — no es suficiente.",
};
const FILL_HIGH = {
  en: "The beam spills over the edges of the shield shape — too much.",
  es: "El rayo se derrama por los bordes de la figura del escudo — es demasiado.",
};

const beam = (o) => ({ mechanic: "beam", low: BEAM_LOW, high: BEAM_HIGH, ...o });
const one = (labelEn, labelEs, answer) => [{ labelEn, labelEs, answer }];
const POWER = ["Beam power", "Poder del rayo"];

// ---------------------------------------------------------------- Unit 1
function ratioMix(rng) {
  const a = ri(rng, 1, 5);
  let b = ri(rng, 2, 6);
  if (b === a) b += 1;
  const k = ri(rng, 2, 6);
  const sparks = b * k;
  return {
    skill: "Ratios",
    mechanic: "beam",
    en: `Charge recipe: ${a} crystals for every ${b} sparks. You loaded ${sparks} sparks. Load the crystals that balance the charge.`,
    es: `Receta de carga: ${a} cristales por cada ${b} chispas. Cargaste ${sparks} chispas. Carga los cristales que equilibran la carga.`,
    fields: one("Crystals", "Cristales", a * k),
    hints: [
      {
        en: `Find how many groups of ${b} sparks you loaded. Each group needs ${a} crystals.`,
        es: `Encuentra cuántos grupos de ${b} chispas cargaste. Cada grupo necesita ${a} cristales.`,
      },
      {
        en: `${sparks} ÷ ${b} gives the number of groups. Multiply that by ${a}.`,
        es: `${sparks} ÷ ${b} da el número de grupos. Multiplica eso por ${a}.`,
      },
    ],
    low: {
      en: "Too few crystals — the charge sputters and fizzles short.",
      es: "Muy pocos cristales — la carga chisporrotea y se apaga.",
    },
    high: {
      en: "Too many crystals — the unstable charge bounces off the shield.",
      es: "Demasiados cristales — la carga inestable rebota en el escudo.",
    },
  };
}
function unitRate(rng) {
  const n = ri(rng, 2, 8);
  const r = ri(rng, 3, 15);
  const total = n * r;
  return beam({
    skill: "Unit Rate",
    en: `The cannon used ${total} energy for ${n} equal shots. Set the power for ONE shot.`,
    es: `El cañón usó ${total} de energía para ${n} disparos iguales. Fija el poder de UN disparo.`,
    fields: one("Power per shot", "Poder por disparo", r),
    hints: [
      {
        en: "A unit rate is the amount for 1. Share the energy equally among the shots.",
        es: "Una tasa unitaria es la cantidad para 1. Reparte la energía en partes iguales entre los disparos.",
      },
      { en: `Divide ${total} by ${n}.`, es: `Divide ${total} entre ${n}.` },
    ],
  });
}

// ---------------------------------------------------------------- Unit 2
function pulses(rng) {
  const q = pick(rng, [2, 3, 4, 5, 6, 8]);
  const coprime = [];
  for (let p = 1; p < q; p++) if (gcd(p, q) === 1) coprime.push(p);
  const p = pick(rng, coprime);
  const n = ri(rng, 2, 9);
  const shield = fracStr(n * p, q);
  return {
    skill: "Fraction Division",
    mechanic: "pulses",
    visual: { shield: (n * p) / q, pulse: p / q },
    en: `The shield holds ${shield} of a power cell. Each pulse drains ${p}/${q} of a cell. Set how many pulses empty the shield exactly.`,
    es: `El escudo guarda ${shield} de una celda de energía. Cada pulso drena ${p}/${q} de celda. Fija cuántos pulsos vacían el escudo exactamente.`,
    fields: one("Pulses", "Pulsos", n),
    hints: [
      {
        en: "How many pulse-sized pieces fit in the shield? That is division: shield ÷ pulse.",
        es: "¿Cuántas partes del tamaño de un pulso caben en el escudo? Eso es división: escudo ÷ pulso.",
      },
      {
        en: `Multiply by the reciprocal: ${shield} × ${q}/${p}.`,
        es: `Multiplica por el recíproco: ${shield} × ${q}/${p}.`,
      },
    ],
    low: {
      en: "Your pulses stop early — part of the shield is still glowing.",
      es: "Tus pulsos paran antes — parte del escudo sigue brillando.",
    },
    high: {
      en: "Extra pulses hit an empty shield and bounce away — too many.",
      es: "Los pulsos de más chocan con un escudo vacío y rebotan — son demasiados.",
    },
  };
}
function shareCell(rng) {
  const b = pick(rng, [2, 3, 4, 5, 8]);
  const a = ri(rng, 1, b - 1);
  const n = ri(rng, 2, 4);
  return beam({
    skill: "Fraction Division",
    en: `${fracStr(a, b)} of a power cell is shared equally by ${n} cannons. Set the power for each cannon, as a fraction of a cell.`,
    es: `${fracStr(a, b)} de una celda de energía se reparte en partes iguales entre ${n} cañones. Fija el poder de cada cañón, como fracción de una celda.`,
    fields: one("Cell per cannon", "Celda por cañón", a / (b * n)),
    hints: [
      {
        en: "Sharing equally among cannons is dividing by the number of cannons — the same as multiplying by its reciprocal.",
        es: "Repartir entre cañones es dividir entre el número de cañones — lo mismo que multiplicar por su recíproco.",
      },
      {
        en: `Compute ${fracStr(a, b)} × 1/${n}. You may type a fraction such as 2/7.`,
        es: `Calcula ${fracStr(a, b)} × 1/${n}. Puedes escribir una fracción como 2/7.`,
      },
    ],
  });
}

// ---------------------------------------------------------------- Unit 3
function percentOf(rng) {
  let B;
  let p;
  do {
    B = pick(rng, [20, 40, 50, 60, 80, 120, 150, 200, 250, 300]);
    p = pick(rng, [20, 25, 30, 40, 50, 60, 75, 80, 90]);
  } while ((p * B) % 100 !== 0 || p * B === 10000);
  return beam({
    skill: "Percent",
    en: `The shield is ${p}% of a ${B}-point barrier. Set your beam power to match the shield exactly.`,
    es: `El escudo es el ${p}% de una barrera de ${B} puntos. Fija el poder del rayo para igualar el escudo exactamente.`,
    fields: one(...POWER, (p * B) / 100),
    hints: [
      {
        en: "Percent means per 100. Find 10% (or 1%) of the barrier first, then build up.",
        es: "Por ciento significa por cada 100. Primero encuentra el 10% (o el 1%) de la barrera y luego construye.",
      },
      {
        en: `10% of ${B} is ${B / 10}. Combine 10% pieces (and halves of them) to make ${p}%.`,
        es: `El 10% de ${B} es ${B / 10}. Combina partes de 10% (y mitades) para formar el ${p}%.`,
      },
    ],
  });
}
function percentWhole(rng) {
  let W;
  let p;
  do {
    W = pick(rng, [40, 60, 80, 120, 160, 200, 240, 300]);
    p = pick(rng, [10, 20, 25, 40, 50, 75]);
  } while ((p * W) % 100 !== 0 || p === W);
  const part = (p * W) / 100;
  return beam({
    skill: "Percent",
    en: `Your charged core holds ${part} energy. That is ${p}% of a full core. Set the power of a FULL core.`,
    es: `Tu núcleo cargado tiene ${part} de energía. Eso es el ${p}% de un núcleo lleno. Fija el poder de un núcleo LLENO.`,
    fields: one("Full core", "Núcleo lleno", W),
    hints: [
      {
        en: "The part is a percent of the whole. Find what 1% is worth, then scale up to 100%.",
        es: "La parte es un porcentaje del total. Encuentra cuánto vale el 1% y luego llega al 100%.",
      },
      {
        en: `If ${p}% is ${part}, divide by ${p} to find 1%, then multiply by 100.`,
        es: `Si el ${p}% es ${part}, divide entre ${p} para hallar el 1% y luego multiplica por 100.`,
      },
    ],
  });
}

// ---------------------------------------------------------------- Unit 4
function gcfBundles(rng) {
  const g = ri(rng, 2, 9);
  let m;
  let n;
  do {
    m = ri(rng, 2, 7);
    n = ri(rng, 2, 7);
  } while (m === n || gcd(m, n) !== 1);
  return beam({
    skill: "GCF/LCM",
    en: `Pack ${g * m} red crystals and ${g * n} blue crystals into identical bundles with nothing left over. Set the GREATEST number of bundles.`,
    es: `Empaca ${g * m} cristales rojos y ${g * n} cristales azules en paquetes idénticos sin que sobre nada. Fija el MAYOR número de paquetes.`,
    fields: one("Bundles", "Paquetes", g),
    hints: [
      {
        en: "The number of bundles must divide BOTH amounts. List the factors of each number.",
        es: "El número de paquetes debe dividir AMBAS cantidades. Haz la lista de factores de cada número.",
      },
      {
        en: `Find the factors that ${g * m} and ${g * n} share, then choose the largest one.`,
        es: `Encuentra los factores que comparten ${g * m} y ${g * n}, y escoge el mayor.`,
      },
    ],
  });
}
function lcmSync(rng) {
  let a;
  let b;
  do {
    a = ri(rng, 2, 10);
    b = ri(rng, 2, 10);
  } while (a === b || lcm(a, b) > 60 || a % b === 0 || b % a === 0);
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return beam({
    skill: "GCF/LCM",
    en: `Cannon A charges every ${a} beats. Cannon B charges every ${b} beats. Both start at beat 0. Set the first beat when they charge together again.`,
    es: `El cañón A se carga cada ${a} pulsaciones. El cañón B cada ${b}. Ambos empiezan en la pulsación 0. Fija la primera pulsación en que se cargan juntos otra vez.`,
    fields: one("Beat", "Pulsación", lcm(a, b)),
    hints: [
      {
        en: "Write the multiples of each number and look for the first one they share.",
        es: "Escribe los múltiplos de cada número y busca el primero que compartan.",
      },
      {
        en: `List multiples of ${hi} and test each one: is it also a multiple of ${lo}?`,
        es: `Haz la lista de múltiplos de ${hi} y prueba cada uno: ¿también es múltiplo de ${lo}?`,
      },
    ],
  });
}
function decimalPower(rng) {
  const tenths = ri(rng, 11, 59);
  const k = ri(rng, 2, 9);
  const a = tenths / 10;
  return beam({
    skill: "Decimals",
    en: `Each crystal adds ${a} power. You load ${k} crystals. Set the total beam power.`,
    es: `Cada cristal suma ${a} de poder. Cargas ${k} cristales. Fija el poder total del rayo.`,
    fields: one(...POWER, (tenths * k) / 10),
    hints: [
      {
        en: "Multiply as if the numbers were whole, then place the decimal point.",
        es: "Multiplica como si fueran números enteros y luego coloca el punto decimal.",
      },
      {
        en: `Think ${tenths} × ${k}, then divide by 10 (one decimal place).`,
        es: `Piensa ${tenths} × ${k} y luego divide entre 10 (un lugar decimal).`,
      },
    ],
  });
}

// ---------------------------------------------------------------- Unit 5
const area = (o) => ({ mechanic: "beam", low: FILL_LOW, high: FILL_HIGH, skill: "Area", ...o });
const AREA = ["Area (sq units)", "Área (unidades²)"];
function triangleArea(rng) {
  let b;
  let h;
  do {
    b = ri(rng, 3, 14);
    h = ri(rng, 2, 12);
  } while ((b * h) % 2 !== 0);
  return area({
    en: `The shield is a triangle with base ${b} units and height ${h} units. Set the area the beam must fill.`,
    es: `El escudo es un triángulo con base de ${b} unidades y altura de ${h} unidades. Fija el área que el rayo debe llenar.`,
    fields: one(...AREA, (b * h) / 2),
    hints: [
      {
        en: "A triangle is half of a parallelogram with the same base and height.",
        es: "Un triángulo es la mitad de un paralelogramo con la misma base y altura.",
      },
      { en: `Find ${b} × ${h}, then take half.`, es: `Calcula ${b} × ${h} y luego toma la mitad.` },
    ],
  });
}
function parallelogramArea(rng) {
  const b = ri(rng, 3, 12);
  const h = ri(rng, 2, 9);
  const s = h + ri(rng, 1, 3);
  return area({
    en: `The shield is a parallelogram: base ${b} units, slanted side ${s} units, height ${h} units. Set the area the beam must fill.`,
    es: `El escudo es un paralelogramo: base de ${b} unidades, lado inclinado de ${s} unidades, altura de ${h} unidades. Fija el área que el rayo debe llenar.`,
    fields: one(...AREA, b * h),
    hints: [
      {
        en: "Cut the slanted end off and slide it to the other side — it becomes a rectangle. The slanted side is not the height.",
        es: "Corta el extremo inclinado y muévelo al otro lado — se vuelve un rectángulo. El lado inclinado no es la altura.",
      },
      {
        en: `Use base × height with base ${b} and the height that makes a right angle with it.`,
        es: `Usa base × altura con base ${b} y la altura que forma un ángulo recto con ella.`,
      },
    ],
  });
}
function trapezoidArea(rng) {
  let b1;
  let b2;
  let h;
  do {
    b1 = ri(rng, 2, 9);
    b2 = b1 + ri(rng, 1, 6);
    h = ri(rng, 2, 8);
  } while (((b1 + b2) * h) % 2 !== 0);
  return area({
    en: `The shield is a trapezoid with bases ${b1} and ${b2} units and height ${h} units. Set the area the beam must fill.`,
    es: `El escudo es un trapecio con bases de ${b1} y ${b2} unidades y altura de ${h} unidades. Fija el área que el rayo debe llenar.`,
    fields: one(...AREA, ((b1 + b2) * h) / 2),
    hints: [
      {
        en: "Two copies of a trapezoid make a parallelogram whose base is the two bases added together.",
        es: "Dos copias de un trapecio forman un paralelogramo cuya base es la suma de las dos bases.",
      },
      {
        en: `Add ${b1} + ${b2}, multiply by ${h}, then take half.`,
        es: `Suma ${b1} + ${b2}, multiplica por ${h} y luego toma la mitad.`,
      },
    ],
  });
}

// ---------------------------------------------------------------- Unit 6
function linearExpr(rng) {
  const a = ri(rng, 2, 9);
  const c = ri(rng, 1, 12);
  const x = ri(rng, 2, 9);
  return beam({
    skill: "Expressions",
    en: `Beam power = ${a}x + ${c}. The dial shows x = ${x}. Set the beam power.`,
    es: `Poder del rayo = ${a}x + ${c}. El indicador muestra x = ${x}. Fija el poder del rayo.`,
    fields: one(...POWER, a * x + c),
    hints: [
      {
        en: "Substitute: replace x with its value. Multiply before you add.",
        es: "Sustituye: cambia x por su valor. Multiplica antes de sumar.",
      },
      {
        en: `First find ${a} × ${x}, then add ${c}.`,
        es: `Primero calcula ${a} × ${x} y luego suma ${c}.`,
      },
    ],
  });
}
function groupedExpr(rng) {
  const a = ri(rng, 2, 6);
  const c = ri(rng, 1, 9);
  const x = ri(rng, 2, 9);
  return beam({
    skill: "Expressions",
    en: `Beam power = ${a}(x + ${c}). The dial shows x = ${x}. Set the beam power.`,
    es: `Poder del rayo = ${a}(x + ${c}). El indicador muestra x = ${x}. Fija el poder del rayo.`,
    fields: one(...POWER, a * (x + c)),
    hints: [
      {
        en: "Parentheses come first: find the value inside, then multiply.",
        es: "Primero los paréntesis: halla el valor de adentro y luego multiplica.",
      },
      {
        en: `Find ${x} + ${c} first, then multiply by ${a}.`,
        es: `Primero calcula ${x} + ${c} y luego multiplica por ${a}.`,
      },
    ],
  });
}
function exponentPower(rng) {
  let b;
  let e;
  do {
    b = ri(rng, 2, 6);
    e = ri(rng, 2, 4);
  } while (b ** e > 300);
  const c = ri(rng, 1, 9);
  return beam({
    skill: "Exponents",
    en: `Beam power = ${b}${sup(e)} + ${c}. Set the beam power.`,
    es: `Poder del rayo = ${b}${sup(e)} + ${c}. Fija el poder del rayo.`,
    fields: one(...POWER, b ** e + c),
    hints: [
      {
        en: "An exponent tells how many times the base is used as a factor. Exponents come before adding.",
        es: "Un exponente dice cuántas veces se usa la base como factor. Los exponentes van antes de sumar.",
      },
      {
        en: `Write ${e} factors of ${b} and multiply them, then add ${c}.`,
        es: `Escribe ${e} factores de ${b}, multiplícalos y luego suma ${c}.`,
      },
    ],
  });
}

// ---------------------------------------------------------------- Unit 7
const xAim = (labelEn, labelEs, answer) => [{ labelEn, labelEs, answer, axis: "x" }];
function lineMove(rng) {
  let dir;
  let m;
  let s;
  do {
    dir = sign(rng);
    m = ri(rng, 3, 9);
    s = dir > 0 ? ri(rng, -9, 9 - m) : ri(rng, -9 + m, 9);
  } while (s + dir * m === 0);
  const right = dir > 0;
  return {
    skill: "Integers",
    mechanic: "aim",
    en: `The weak point starts at ${s} on the number line, then slides ${m} units to the ${right ? "right" : "left"}. Aim at its new position.`,
    es: `El punto débil empieza en ${s} en la recta numérica y se desliza ${m} unidades a la ${right ? "derecha" : "izquierda"}. Apunta a su nueva posición.`,
    fields: xAim("Position", "Posición", s + dir * m),
    hints: [
      {
        en: "Moving right makes the number greater; moving left makes it less — even past 0.",
        es: "Mover a la derecha hace el número mayor; a la izquierda lo hace menor — aun después del 0.",
      },
      {
        en: `Start at ${s} and count ${m} single steps to the ${right ? "right" : "left"}.`,
        es: `Empieza en ${s} y cuenta ${m} pasos a la ${right ? "derecha" : "izquierda"}.`,
      },
    ],
  };
}
function opposite(rng) {
  const n = sign(rng) * ri(rng, 2, 9);
  return {
    skill: "Absolute Value",
    mechanic: "aim",
    en: `The boss hides its weak point at the OPPOSITE of ${n} on the number line. Aim there.`,
    es: `El jefe esconde su punto débil en el OPUESTO de ${n} en la recta numérica. Apunta ahí.`,
    fields: xAim("Position", "Posición", -n),
    hints: [
      {
        en: "Opposites are the same distance from 0, on different sides of 0.",
        es: "Los opuestos están a la misma distancia del 0, en lados distintos del 0.",
      },
      {
        en: `Find how far ${n} is from 0, then go that far on the other side of 0.`,
        es: `Encuentra qué tan lejos está ${n} del 0 y luego ve esa distancia al otro lado del 0.`,
      },
    ],
  };
}
function lineDistance(rng) {
  const a = -ri(rng, 1, 9);
  const b = ri(rng, 1, 9);
  return beam({
    skill: "Distance",
    en: `Two shield posts stand at ${a} and ${b} on the number line. Set the beam length that reaches from one post to the other.`,
    es: `Dos postes del escudo están en ${a} y ${b} en la recta numérica. Fija la longitud del rayo que va de un poste al otro.`,
    fields: one("Beam length", "Longitud del rayo", b - a),
    hints: [
      {
        en: "Distance is never negative. When the points are on opposite sides of 0, add their distances from 0.",
        es: "La distancia nunca es negativa. Si los puntos están en lados opuestos del 0, suma sus distancias al 0.",
      },
      {
        en: `Find |${a}| and |${b}|, then add them.`,
        es: `Calcula |${a}| y |${b}| y luego súmalos.`,
      },
    ],
  });
}

// ---------------------------------------------------------------- Unit 8
function meanLock(rng) {
  const n = pick(rng, [3, 4, 5]);
  let M;
  let known;
  let last;
  do {
    M = ri(rng, 6, 15);
    known = Array.from({ length: n - 1 }, () => M + ri(rng, -5, 5));
    last = n * M - known.reduce((s, v) => s + v, 0);
  } while (last < 1 || last > 30 || last === M || known.includes(last));
  const list = known.join(", ");
  return {
    skill: "Statistics",
    mechanic: "beam",
    en: `The lock opens when the MEAN of ${n} crystal readings is ${M}. The readings so far: ${list}. Set the last reading.`,
    es: `El candado se abre cuando la MEDIA de ${n} lecturas de cristal es ${M}. Las lecturas hasta ahora: ${list}. Fija la última lectura.`,
    fields: one("Last reading", "Última lectura", last),
    hints: [
      {
        en: "Mean × number of readings = the total. All the readings together must add to that total.",
        es: "Media × número de lecturas = el total. Todas las lecturas juntas deben sumar ese total.",
      },
      {
        en: `The total must be ${M} × ${n}. Subtract the sum of ${list} from it.`,
        es: `El total debe ser ${M} × ${n}. Réstale la suma de ${list}.`,
      },
    ],
    low: {
      en: "The lock reads a mean that is too LOW — it stays shut.",
      es: "El candado marca una media muy BAJA — sigue cerrado.",
    },
    high: {
      en: "The lock reads a mean that is too HIGH — it stays shut.",
      es: "El candado marca una media muy ALTA — sigue cerrado.",
    },
  };
}
function rangeLock(rng) {
  const vals = Array.from({ length: 4 }, () => ri(rng, 3, 20));
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const R = hi - lo + ri(rng, 2, 9);
  const list = vals.join(", ");
  return {
    skill: "Statistics",
    mechanic: "beam",
    en: `Crystal readings: ${list}. Add ONE new reading, greater than all of these, so the RANGE becomes ${R}. Set the new reading.`,
    es: `Lecturas de cristal: ${list}. Agrega UNA lectura nueva, mayor que todas estas, para que el RANGO sea ${R}. Fija la lectura nueva.`,
    fields: one("New reading", "Lectura nueva", lo + R),
    hints: [
      {
        en: "Range = greatest value − least value. The new reading will be the greatest value.",
        es: "Rango = valor mayor − valor menor. La lectura nueva será el valor mayor.",
      },
      {
        en: `Find the least reading. What number minus it equals ${R}?`,
        es: `Encuentra la lectura menor. ¿Qué número menos ella es igual a ${R}?`,
      },
    ],
    low: {
      en: "The range comes out too SMALL — the lock stays shut.",
      es: "El rango sale muy PEQUEÑO — el candado sigue cerrado.",
    },
    high: {
      en: "The range comes out too BIG — the lock stays shut.",
      es: "El rango sale muy GRANDE — el candado sigue cerrado.",
    },
  };
}

// ---------------------------------------------------------------- Unit 9
const xyAim = (x, y) => [
  { labelEn: "x", labelEs: "x", answer: x, axis: "x" },
  { labelEn: "y", labelEs: "y", answer: y, axis: "y" },
];
function reflectAim(rng) {
  const a = sign(rng) * ri(rng, 1, 8);
  const b = sign(rng) * ri(rng, 1, 8);
  const acrossX = rng() < 0.5;
  return {
    skill: "Reflections",
    mechanic: "aim",
    shadow: [a, b],
    en: `The boss's shadow is at (${a}, ${b}). Its weak point is the shadow's reflection across the ${acrossX ? "x-axis" : "y-axis"}. Aim at the weak point.`,
    es: `La sombra del jefe está en (${a}, ${b}). Su punto débil es el reflejo de la sombra sobre el ${acrossX ? "eje x" : "eje y"}. Apunta al punto débil.`,
    fields: acrossX ? xyAim(a, -b) : xyAim(-a, b),
    hints: [
      {
        en: `A reflection across the ${acrossX ? "x-axis" : "y-axis"} keeps one coordinate and flips the sign of the other.`,
        es: `Un reflejo sobre el ${acrossX ? "eje x" : "eje y"} mantiene una coordenada y cambia el signo de la otra.`,
      },
      {
        en: `Keep the ${acrossX ? "x" : "y"}-coordinate. The ${acrossX ? "y" : "x"}-coordinate becomes the opposite of ${acrossX ? b : a}.`,
        es: `Mantén la coordenada ${acrossX ? "x" : "y"}. La coordenada ${acrossX ? "y" : "x"} se vuelve el opuesto de ${acrossX ? b : a}.`,
      },
    ],
  };
}
function moveAim(rng) {
  const a = ri(rng, -6, 6);
  const b = ri(rng, -6, 6);
  const dx = sign(rng) * ri(rng, 1, 4);
  const dy = sign(rng) * ri(rng, 1, 4);
  const xw = dx > 0 ? ["right", "derecha"] : ["left", "izquierda"];
  const yw = dy > 0 ? ["up", "arriba"] : ["down", "abajo"];
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  return {
    skill: "Coordinates",
    mechanic: "aim",
    shadow: [a, b],
    en: `The boss's shadow is at (${a}, ${b}). The weak point is ${ax} units ${xw[0]} and ${ay} units ${yw[0]} from it. Aim at the weak point.`,
    es: `La sombra del jefe está en (${a}, ${b}). El punto débil está ${ax} unidades a la ${xw[1]} y ${ay} unidades hacia ${yw[1]} de ella. Apunta al punto débil.`,
    fields: xyAim(a + dx, b + dy),
    hints: [
      {
        en: "Left and right change x. Up and down change y.",
        es: "Izquierda y derecha cambian x. Arriba y abajo cambian y.",
      },
      {
        en: `x: start at ${a} and count ${ax} ${xw[0]}. y: start at ${b} and count ${ay} ${yw[0]}.`,
        es: `x: empieza en ${a} y cuenta ${ax} a la ${xw[1]}. y: empieza en ${b} y cuenta ${ay} hacia ${yw[1]}.`,
      },
    ],
  };
}
function gridDistance(rng) {
  const x = sign(rng) * ri(rng, 1, 7);
  const y1 = ri(rng, 1, 8);
  const y2 = -ri(rng, 1, 8);
  return beam({
    skill: "Distance",
    en: `Two shield posts stand at (${x}, ${y1}) and (${x}, ${y2}). Set the beam length that connects them.`,
    es: `Dos postes del escudo están en (${x}, ${y1}) y (${x}, ${y2}). Fija la longitud del rayo que los une.`,
    fields: one("Beam length", "Longitud del rayo", y1 - y2),
    hints: [
      {
        en: "The x-coordinates match, so the posts are on one vertical line. Use the y-coordinates.",
        es: "Las coordenadas x son iguales, así que los postes están en una recta vertical. Usa las coordenadas y.",
      },
      {
        en: `The posts are on opposite sides of the x-axis: add |${y1}| and |${y2}|.`,
        es: `Los postes están en lados opuestos del eje x: suma |${y1}| y |${y2}|.`,
      },
    ],
  });
}

// ---------------------------------------------------------------- Unit 10
const FILL_CUBES = {
  low: {
    en: "The prism is not full yet — cubes are missing.",
    es: "El prisma aún no está lleno — faltan cubos.",
  },
  high: {
    en: "Cubes overflow out of the prism — too many.",
    es: "Los cubos se desbordan del prisma — son demasiados.",
  },
};
function prismTotal(rng) {
  const l = ri(rng, 2, 6);
  const w = ri(rng, 2, 6);
  const h = ri(rng, 2, 6);
  return {
    skill: "Volume",
    mechanic: "beam",
    ...FILL_CUBES,
    en: `Fill a prism ${l} by ${w} by ${h} units with unit cubes. Set how many cubes to load.`,
    es: `Llena un prisma de ${l} por ${w} por ${h} unidades con cubos unitarios. Fija cuántos cubos cargar.`,
    fields: one("Cubes", "Cubos", l * w * h),
    hints: [
      {
        en: "Volume = (cubes in one layer) × (number of layers).",
        es: "Volumen = (cubos en una capa) × (número de capas).",
      },
      {
        en: `One layer holds ${l} × ${w} cubes. There are ${h} layers.`,
        es: `Una capa tiene ${l} × ${w} cubos. Hay ${h} capas.`,
      },
    ],
  };
}
function prismLayers(rng) {
  const l = ri(rng, 2, 6);
  const w = ri(rng, 2, 6);
  let h = ri(rng, 2, 7);
  if (h === l || h === w) h = 8;
  return {
    skill: "Volume",
    mechanic: "beam",
    ...FILL_CUBES,
    en: `A prism has a ${l} by ${w} base and holds ${l * w * h} unit cubes. Set its number of layers (its height).`,
    es: `Un prisma tiene una base de ${l} por ${w} y contiene ${l * w * h} cubos unitarios. Fija su número de capas (su altura).`,
    fields: one("Layers", "Capas", h),
    hints: [
      {
        en: "Volume ÷ (cubes in one layer) = number of layers.",
        es: "Volumen ÷ (cubos en una capa) = número de capas.",
      },
      {
        en: `One layer holds ${l} × ${w} cubes. Divide ${l * w * h} by that.`,
        es: `Una capa tiene ${l} × ${w} cubos. Divide ${l * w * h} entre eso.`,
      },
    ],
  };
}
function halfEdge(rng) {
  const l = ri(rng, 2, 9);
  const w = ri(rng, 2, 9);
  return {
    skill: "Volume",
    mechanic: "beam",
    ...FILL_CUBES,
    en: `A prism is ${l} by ${w} by 1/2 unit. Set its volume in cubic units (a fraction or decimal is fine).`,
    es: `Un prisma mide ${l} por ${w} por 1/2 unidad. Fija su volumen en unidades cúbicas (puedes usar fracción o decimal).`,
    fields: one("Volume", "Volumen", (l * w) / 2),
    hints: [
      {
        en: "V = length × width × height works with fractions too. A height of 1/2 is half of one layer.",
        es: "V = largo × ancho × altura también funciona con fracciones. Una altura de 1/2 es media capa.",
      },
      {
        en: `Find ${l} × ${w}, then take half of it.`,
        es: `Calcula ${l} × ${w} y luego toma la mitad.`,
      },
    ],
  };
}

/** Generators per Reveal unit (matches UNITS in problems.js). */
export const GENERATORS = {
  1: [ratioMix, unitRate],
  2: [pulses, shareCell],
  3: [percentOf, percentWhole],
  4: [gcfBundles, lcmSync, decimalPower],
  5: [triangleArea, parallelogramArea, trapezoidArea],
  6: [linearExpr, groupedExpr, exponentPower],
  7: [lineMove, opposite, lineDistance],
  8: [meanLock, rangeLock],
  9: [reflectAim, moveAim, gridDistance],
  10: [prismTotal, prismLayers, halfEdge],
};

/** Fresh round for a unit. `turn` rotates through that unit's skills. */
export function makeRound(unit, rng, turn = 0) {
  const gens = GENERATORS[unit] || GENERATORS[1];
  const round = gens[turn % gens.length](rng);
  return { unit, ...round };
}
