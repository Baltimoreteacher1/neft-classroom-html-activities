// living/percent-per-hundred-model.js — the mathematics and every sentence of
// the percent-per-hundred play (4-1 "Understand Percent"). Pure functions only:
// every number the play shows a student is computed here and checked in node by
// percent-per-hundred.test.mjs.
//
// The idea: "a out of every b" is a ratio; multiply BOTH terms by the same k
// until the second term is 100, and the first term is the percent. A percent
// can also pass 100% when the amount is more than the whole.

import { fmtHundredths } from "./percent-whole.js";
import { okInt, placeNotFirst } from "./unit-convert-model.js";

export { okInt, placeNotFirst };

/** Group sizes whose copies tile a 10 x 10 grid as clean rectangles. */
export const GROUP_SIZES = [2, 5, 10, 20, 50];

const pair = (v, max = 400) => {
  const en = typeof v === "string" ? v.trim() : typeof v?.en === "string" ? v.en.trim() : "";
  const es = typeof v?.es === "string" && v.es.trim() ? v.es.trim() : en;
  return en && en.length <= max && es.length <= max ? { en, es } : null;
};
const P = (en, es) => ({ en, es });

/** Who/what is counted: "voters" + "chose the tiger". */
function subject(c, fallbackNoun) {
  const noun = pair(c?.noun, 30) || fallbackNoun;
  const did = pair(c?.did, 50);
  return noun && did ? { noun, did } : null;
}

export function validatePercentPerHundred(cfg) {
  const a = Number(cfg?.a);
  const b = Number(cfg?.b);
  if (!GROUP_SIZES.includes(b) || !okInt(a, 1, b - 1)) return null;
  const subj = subject(cfg, null);
  if (!subj) return null;
  const k = 100 / b;
  const t = cfg?.transfer || {};
  const ta = Number(t.a);
  const tb = Number(t.b);
  if (![...GROUP_SIZES, 100].includes(tb) || !okInt(ta, 1, tb - 1)) return null;
  if (ta * (100 / tb) === a * k) return null;
  const tSubj = subject(t, subj.noun) || null;
  const o = cfg?.over || {};
  const whole = Number(o.whole);
  const amount = Number(o.amount);
  const unit = pair(o.unit, 30);
  const base = pair(o.base, 40);
  const other = pair(o.other, 40);
  const story = pair(o.story);
  const pct = (amount * 100) / whole;
  if (
    !okInt(whole, 2, 1000) ||
    !okInt(amount, whole + 1, 2 * whole) ||
    !Number.isInteger(pct) ||
    !unit ||
    !base ||
    !other ||
    !story ||
    ![String(whole), String(amount)].every((n) => story.en.includes(n) && story.es.includes(n))
  )
    return null;
  const x = overChoices(whole, amount);
  if (!x || !fdChoices(ta * (100 / tb)) || !scaleChoices(a, b)) return null;
  return {
    a,
    b,
    k,
    p: a * k,
    ...subj,
    story: pair(cfg.story),
    over: { whole, amount, pct, unit, base, other, story },
    transfer: { a: ta, b: tb, k: 100 / tb, p: ta * (100 / tb), ...(tSubj || subj) },
  };
}

/** a out of b → ? out of 100: exact answer plus real misconceptions. */
export function scaleChoices(a, b) {
  const k = 100 / b;
  /** @type {{ kind: string, n: number, correct?: boolean }[]} */
  const out = [{ kind: "correct", n: a * k, correct: true }];
  for (const c of [
    { kind: "add", n: a + (100 - b) },
    { kind: "same", n: a },
    { kind: "factor", n: k },
  ])
    if (out.length < 4 && !out.some((o) => o.n === c.n) && c.n >= 1 && c.n <= 150) out.push(c);
  return out.length >= 3 ? out : null;
}

/** "What percent is p out of 100?" (hundredths of a percent for the slips). */
export function fdChoices(p) {
  /** @type {{ kind: string, h: number, correct?: boolean }[]} */
  const out = [{ kind: "correct", h: p * 100, correct: true }];
  for (const c of [
    { kind: "complement", h: (100 - p) * 100 },
    { kind: "decimal", h: p },
    { kind: "tenth", h: p * 10 },
  ])
    if (!out.some((o) => o.h === c.h) && c.h > 0) out.push(c);
  return out.length >= 3 ? out : null;
}

/** The weight/amount as a percent of the whole when it is more than the whole. */
export function overChoices(whole, amount) {
  const pct = (amount * 100) / whole;
  /** @type {{ kind: string, n: number, correct?: boolean }[]} */
  const out = [{ kind: "correct", n: pct, correct: true }];
  for (const c of [
    { kind: "extra", n: pct - 100 },
    { kind: "whole", n: 100 },
    { kind: "amount", n: amount },
  ])
    if (!out.some((o) => o.n === c.n) && c.n > 0 && out.length < 4) out.push(c);
  return out.length >= 3 ? out : null;
}

/** Cell i's group, and whether it is shaded when the groups are shown. */
export const shadedInGroups = (i, a, b) => i % b < a;

/** Where cell i goes when shaded cells move to the front (identity kept). */
export function sortedSlot(i, a, b, p) {
  const g = Math.floor(i / b);
  const pos = i % b;
  return pos < a ? g * a + pos : p + g * (b - a) + (pos - a);
}

export function percentCopy(v) {
  const { a, b, k, p, noun, did, over: o, transfer: t } = v;
  const sent = (x, y, n = noun, d = did) =>
    P(`${x} out of every ${y} ${n.en} ${d.en}`, `${x} de cada ${y} ${n.es} ${d.es}`);
  const s0 = sent(a, b);
  const tSent = sent(t.a, t.b, t.noun, t.did);
  const dec = fmtHundredths(p);
  const colour = P(
    `${p} out of 100 is ${p}%: percent means per hundred.`,
    `${p} de cada 100 es ${p}%: porcentaje quiere decir por cada cien.`,
  );
  return {
    kicker: P("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: P("What percent means", "Qué significa porcentaje"),
    ariaLabel: P(
      `A group of ${b} ${noun.en} with ${a} shaded is copied ${k} times to make 100, with ${p} shaded. The 100 squares form a grid where each square is 1%, so ${p} out of 100 is ${p}%. A bar that reaches past 100% shows a percent greater than 100%.`,
      `Un grupo de ${b} ${noun.es} con ${a} sombreados se copia ${k} veces hasta llegar a 100, con ${p} sombreados. Los 100 cuadros forman una cuadrícula donde cada cuadro es 1%, así que ${p} de cada 100 es ${p}%. Una barra que pasa del 100% muestra un porcentaje mayor que 100%.`,
    ),
    printSummary: P(
      `${s0.en}. Multiply both numbers by ${k}: ${a} × ${k} = ${p} and ${b} × ${k} = 100, so ${p} out of 100. On a 100-square grid each square is 1% = 0.01 = 1/100, so ${p} shaded squares are ${p}% = ${dec}. A percent can be more than 100%: ${o.amount} is ${o.pct}% of ${o.whole}.`,
      `${s0.es}. Multiplica los dos números por ${k}: ${a} × ${k} = ${p} y ${b} × ${k} = 100, así que ${p} de cada 100. En una cuadrícula de 100 cuadros cada cuadro es 1% = 0.01 = 1/100, así que ${p} cuadros sombreados son ${p}% = ${dec}. Un porcentaje puede ser mayor que 100%: ${o.amount} es ${o.pct}% de ${o.whole}.`,
    ),
    scene: {
      situate: P("The ratio", "La razón"),
      predict: P("Predict", "Predice"),
      build: P("Make 100", "Llega a 100"),
      percent: P("Per hundred", "Por cada cien"),
      over: P("More than 100%", "Más del 100%"),
      transfer: P("On your own", "Por tu cuenta"),
    },
    side: {
      group: (n) => P(`${a * n} out of ${b * n}`, `${a * n} de cada ${b * n}`),
      pct: P(`${p} out of 100`, `${p} de cada 100`),
      eachCell: P("each square = 1%", "cada cuadro = 1%"),
    },
    situate: {
      say:
        v.story ||
        P(
          `${s0.en}. That is a ratio: ${a} out of ${b}. We want to know how many that is out of 100.`,
          `${s0.es}. Eso es una razón: ${a} de cada ${b}. Queremos saber cuántos son de cada 100.`,
        ),
      note: P(
        `Here is one group of ${b}: ${a} shaded, ${b - a} not.`,
        `Aquí hay un grupo de ${b}: ${a} sombreados y ${b - a} sin sombrear.`,
      ),
      expr: `${a} : ${b}`,
    },
    predict: {
      say: P(
        `Suppose there are 100 ${noun.en} and the same ratio holds. How many of the 100 would be shaded?`,
        `Imagina que hay 100 ${noun.es} y la razón es la misma. ¿Cuántos de los 100 estarían sombreados?`,
      ),
      question: P(
        `${a} out of every ${b} is the same as … out of 100`,
        `${a} de cada ${b} es lo mismo que … de cada 100`,
      ),
      ok: P(
        `Yes: ${a} out of ${b} = ${p} out of 100, because ${a} × ${k} = ${p} and ${b} × ${k} = 100. Next, build it up yourself.`,
        `Sí: ${a} de cada ${b} = ${p} de cada 100, porque ${a} × ${k} = ${p} y ${b} × ${k} = 100. Ahora constrúyelo tú.`,
      ),
      cue: (kind, n) =>
        ({
          add: P(
            `${n} comes from adding ${100 - b} to both numbers. Adding does not keep the ratio the same. What do you multiply ${b} by to reach 100?`,
            `${n} sale de sumar ${100 - b} a los dos números. Sumar no mantiene la razón igual. ¿Por cuánto multiplicas ${b} para llegar a 100?`,
          ),
          same: P(
            `${n} is the count out of ${b}. We need the count out of 100. Look at the grid: if every group of ${b} has ${a} shaded, how many shaded in all 100?`,
            `${n} es la cantidad de cada ${b}. Necesitamos la cantidad de cada 100. Mira la cuadrícula: si cada grupo de ${b} tiene ${a} sombreados, ¿cuántos hay en los 100?`,
          ),
          factor: P(
            `${n} is how many groups of ${b} fit in 100. Each of those groups has ${a} shaded. How many shaded squares in all?`,
            `${n} es cuántos grupos de ${b} caben en 100. Cada uno de esos grupos tiene ${a} sombreados. ¿Cuántos cuadros sombreados hay en total?`,
          ),
        })[kind],
    },
    build: {
      say: P(
        `Copy the group of ${b} until there are 100. Every copy keeps ${a} shaded. Slide to add copies.`,
        `Copia el grupo de ${b} hasta tener 100. Cada copia conserva ${a} sombreados. Desliza para agregar copias.`,
      ),
      label: P(`Groups of ${b}`, `Grupos de ${b}`),
      more: P(
        `Keep adding copies until the whole grid of 100 is full.`,
        `Sigue agregando copias hasta llenar toda la cuadrícula de 100.`,
      ),
      done: P(
        `${k} copies: ${a} × ${k} = ${p} shaded and ${b} × ${k} = 100 in all. Both numbers were multiplied by ${k}, so it is still the same ratio.`,
        `${k} copias: ${a} × ${k} = ${p} sombreados y ${b} × ${k} = 100 en total. Los dos números se multiplicaron por ${k}, así que sigue siendo la misma razón.`,
      ),
    },
    percent: {
      say: P(
        `Slide the shaded squares together. ${p} out of 100 squares are shaded. Percent means per hundred, so each square is 1% = 1/100 = 0.01, and ${p} squares are ${p}%.`,
        `Junta los cuadros sombreados. ${p} de 100 cuadros están sombreados. Porcentaje quiere decir por cada cien, así que cada cuadro es 1% = 1/100 = 0.01, y ${p} cuadros son ${p}%.`,
      ),
      chain: `${p}/100 = ${dec} = ${p}%`,
      note: colour,
    },
    over: {
      say: P(`${o.story.en} The whole is 100%.`, `${o.story.es} El total es el 100%.`),
      question: P(
        `${cap(o.other.en)} is … of ${o.base.en}'s weight`,
        `${cap(o.other.es)} es … del peso de ${o.base.es}`,
      ),
      ok: P(
        `Yes: ${o.amount} ${o.unit.en} is ${o.pct}% of ${o.whole} ${o.unit.en}. It is one whole (100%) plus ${o.pct - 100}% more, so a percent can be greater than 100%.`,
        `Sí: ${o.amount} ${o.unit.es} es ${o.pct}% de ${o.whole} ${o.unit.es}. Es un total completo (100%) más ${o.pct - 100}% extra, así que un porcentaje puede ser mayor que 100%.`,
      ),
      cue: (kind, n) =>
        ({
          extra: P(
            `${n}% is only the part that sticks out past the whole. The bar already counts the whole 100% for ${o.base.en}. How much is that in all?`,
            `${n}% es solo la parte que sobresale del total. La barra ya cuenta el 100% completo de ${o.base.es}. ¿Cuánto es en total?`,
          ),
          whole: P(
            `${n}% would mean ${o.other.en} weighs the same as ${o.base.en}. Is ${o.amount} the same as ${o.whole}? Look at where the bar ends.`,
            `${n}% querría decir que ${o.other.es} pesa lo mismo que ${o.base.es}. ¿${o.amount} es igual a ${o.whole}? Mira dónde termina la barra.`,
          ),
          amount: P(
            `${n} is the weight in ${o.unit.en}, not a percent. If ${o.whole} ${o.unit.en} is 100%, where does ${o.amount} ${o.unit.en} land on the bar?`,
            `${n} es el peso en ${o.unit.es}, no un porcentaje. Si ${o.whole} ${o.unit.es} es el 100%, ¿dónde queda ${o.amount} ${o.unit.es} en la barra?`,
          ),
        })[kind],
      barBase: P(
        `${cap(o.base.en)}: ${o.whole} ${o.unit.en} = 100%`,
        `${cap(o.base.es)}: ${o.whole} ${o.unit.es} = 100%`,
      ),
      barOther: P(
        `${cap(o.other.en)}: ${o.amount} ${o.unit.en} = ${o.pct}%`,
        `${cap(o.other.es)}: ${o.amount} ${o.unit.es} = ${o.pct}%`,
      ),
    },
    transfer: {
      say: P(
        `${cap(tSent.en)}. Shade it on the grid and write it as a percent.`,
        `${cap(tSent.es)}. Sombréalo en la cuadrícula y escríbelo como porcentaje.`,
      ),
      question: P(`${t.a} out of ${t.b} is…`, `${t.a} de cada ${t.b} es…`),
      ok: P(
        `Right: ${t.b === 100 ? `${t.a} out of 100` : `${t.a} out of ${t.b} = ${t.p} out of 100`} = ${t.p}% = ${fmtHundredths(t.p)}.`,
        `Correcto: ${t.b === 100 ? `${t.a} de cada 100` : `${t.a} de cada ${t.b} = ${t.p} de cada 100`} = ${t.p}% = ${fmtHundredths(t.p)}.`,
      ),
      cue: (kind, h) => {
        const x = `${fmtHundredths(h)}%`;
        return {
          complement: P(
            `${x} counts the squares that are NOT shaded. The percent is the shaded part out of 100. Count the shaded squares.`,
            `${x} cuenta los cuadros que NO están sombreados. El porcentaje es la parte sombreada de cada 100. Cuenta los cuadros sombreados.`,
          ),
          decimal: P(
            `${x} is less than one whole square of the 100. Count the shaded squares: how many out of 100?`,
            `${x} es menos que un cuadro completo de los 100. Cuenta los cuadros sombreados: ¿cuántos de cada 100?`,
          ),
          tenth: P(
            `${x} is only a little more than ${Math.floor(h / 100)} squares. Count the shaded squares again.`,
            `${x} es solo un poco más de ${Math.floor(h / 100)} cuadros. Cuenta otra vez los cuadros sombreados.`,
          ),
        }[kind];
      },
      explain: P(
        `Explain: a player scores twice the weekly goal. Is that percent more or less than 100%? How do you know?`,
        `Explica: una jugadora anota el doble de la meta semanal. ¿Ese porcentaje es mayor o menor que 100%? ¿Cómo lo sabes?`,
      ),
      frame: P(
        "The goal is the whole, which is ___%. Twice the goal is ___ wholes, so it is ___ than 100%.",
        "La meta es el total, que es ___%. El doble de la meta es ___ totales, así que es ___ que 100%.",
      ),
    },
  };
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
