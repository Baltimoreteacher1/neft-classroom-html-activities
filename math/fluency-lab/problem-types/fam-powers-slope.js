import { bi, int, fmt } from "./kit.js";
import { add, Q, qs, sub } from "./rational.js";

const skills = { "8:exponents": {}, "8:powers-ten": {}, "8:square-roots": {}, "8:slope": {} };
const intQ = (n) => Q(n);
function data(ctx) {
  const { rng, level, skill } = ctx;
  if (skill.id === "exponents") {
    const base = int(rng, 2, 7 + Math.min(3, level));
    const power = int(rng, 2, Math.min(4, level + 1));
    const answer = base ** power;
    return { answer: intQ(answer), form: "int", expr: `${base}^${power}`, shown: `${base}^${power}`, en: `Evaluate ${base} to the power of ${power}.`, es: `Evalúa ${base} elevado a la potencia ${power}.`, steps: [`A power shows repeated multiplication.`, `Multiply ${base} by itself ${power} times.`, `${base}^${power} = ${answer}.`], contextEn: `A square game board has ${base} rows and columns, and each row is copied ${power} times in a pattern. How many copies are shown?`, contextEs: `Un tablero cuadrado tiene ${base} filas y columnas, y cada fila se repite ${power} veces en un patrón. ¿Cuántas copias se muestran?` };
  }
  if (skill.id === "powers-ten") {
    const power = int(rng, skill.config?.minPower ?? -3, Math.min(skill.config?.maxPower ?? 6, 2 + level));
    const answer = power >= 0 ? Q(10 ** power) : Q(1, 10 ** -power);
    return { answer, form: power < 0 ? "decimal" : "int", expr: `10^${power}`, shown: `10^${power}`, en: `Evaluate 10 to the power of ${power}.`, es: `Evalúa 10 elevado a la potencia ${power}.`, steps: [`A positive exponent counts factors of 10.`, `A negative exponent gives the reciprocal of the corresponding positive power.`, `10^${power} = ${power < 0 ? `0.${"0".repeat(-power - 1)}1` : 10 ** power}.`], contextEn: `A scale drawing uses a scale factor of 10 to the power of ${power}. What is the scale factor?`, contextEs: `Un dibujo a escala usa un factor de escala de 10 elevado a la potencia ${power}. ¿Cuál es el factor de escala?` };
  }
  if (skill.id === "square-roots") {
    const root = int(rng, 2, Math.min(skill.config?.maxRoot ?? 25, 12 + level * 2));
    return { answer: intQ(root), form: "int", expr: `sqrt(${root * root})`, shown: `√${root * root}`, en: `Find the square root of ${root * root}.`, es: `Encuentra la raíz cuadrada de ${root * root}.`, steps: [`A square root asks for the side length of a square.`, `Find the number that multiplied by itself equals ${root * root}.`, `√${root * root} = ${root}.`], contextEn: `A square has an area of ${root * root} square units. What is its side length?`, contextEs: `Un cuadrado tiene un área de ${root * root} unidades cuadradas. ¿Cuánto mide cada lado?` };
  }
  const x1 = int(rng, -10, 5);
  const dx = int(rng, 1, 8 + level);
  const y1 = int(rng, -12, 8);
  const rise = int(rng, -8, 8) || 1;
  const x2 = x1 + dx;
  const y2 = y1 + rise;
  const answer = Q(rise, dx);
  const slope = qs(answer);
  const expr = `(${y2}-${y1})/(${x2}-${x1})`;
  const form = answer.d === 1 ? "int" : "fraction";
  const text = `(${x1}, ${y1}) and (${x2}, ${y2})`;
  const textEs = `(${x1}, ${y1}) y (${x2}, ${y2})`;
  return { answer, form, expr, shown: text, shownEs: textEs, en: `Find the slope through the points ${text}.`, es: `Encuentra la pendiente de la recta que pasa por los puntos ${textEs}.`, steps: [`Subtract the y-coordinates to find the change in y.`, `Subtract the x-coordinates in the same order to find the change in x.`, `The slope is ${rise}/${dx}, which simplifies to ${slope}.`], contextEn: `A trail passes through ${text}, where x is horizontal distance and y is elevation. What is the change in elevation for each unit of horizontal distance?`, contextEs: `Un sendero pasa por ${textEs}, donde x es la distancia horizontal y y es la elevación. ¿Cuál es el cambio de elevación por cada unidad de distancia horizontal?` };
}
const wrongValues = (answer) => [add(answer, Q(1)), sub(answer, Q(1)), answer.n < 0 ? Q(-answer.n, answer.d) : Q(-answer.n, answer.d)];
function typed(ctx, world = false) {
  const n = data(ctx);
  const q = world ? [n.contextEn, n.contextEs] : [n.en, n.es];
  return {
    q: bi(q[0], q[1]), form: n.form, answer: n.answer, bare: n.expr,
    check: [{ kind: "expr", expr: n.expr, role: "answer" }],
    wrong: wrongValues(n.answer).map((v, i) => ({ v, why: ["added one instead of applying the rule", "subtracted one from the result", "used the opposite sign or reciprocal"][i] })),
    steps: world ? [n.steps[0], n.steps[1], n.steps.at(-1)] : n.steps,
  };
}
const compute = (ctx) => typed(ctx);
const realWorld = (ctx) => typed(ctx, true);
function explain(ctx) {
  const n = data(ctx);
  const key = n.answer;
  const values = [...new Set(wrongValues(key).map((v) => qs(v)).filter((v) => v !== qs(key)))].slice(0, 2);
  while (values.length < 2) values.push(String(Number(qs(key)) + 10 + values.length));
  return {
    q: bi(`Which value matches ${n.shown}?`, `¿Qué valor corresponde a ${n.shownEs || n.shown}?`),
    form: "choice", answer: qs(key), options: values.map((v, i) => ({ text: v, why: i ? "used the reciprocal or opposite sign" : "made a one-unit error" })),
    check: [{ kind: "expr", expr: n.expr, role: "answer" }],
    steps: [`Identify the operation represented by the notation.`, `Apply the rule and check the result.`, `The value is ${qs(key)}.`],
  };
}
export const family = { id: "powers-slope", skills, types: { compute, "real-world": realWorld, explain }, range: { "real-world": [1, 5], explain: [1, 5] } };
