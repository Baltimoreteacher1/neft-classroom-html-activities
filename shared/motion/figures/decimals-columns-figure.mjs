// Motion figure: add and subtract decimals in place-value columns (lab model decimal:columns, lesson 2-11).
// Step 1 lines the decimal points up and annexes zeros; step 2 works one column at a time from the right, showing each regroup.
import { columnNotes, columnsWork, drawColumns, intColumns, misalign } from "./decimals-columns.mjs";
import { base, fixed, notBox, okBox, panel, panelHead, panelScene, para, pick, placesOf, PAD } from "./decimals-draw.mjs";
import { COLOR } from "../tokens.mjs";

const FIRST = { min: 10, max: 200, step: 0.05 };
const SECOND = { min: 0.05, max: 9.95, step: 0.05 };

/** @param {number} v @param {{ min: number, max: number }} c @param {string} name */
function hundredths(v, c, name) {
  const h = Math.round(v * 100);
  if (!Number.isFinite(v) || Math.abs(v * 100 - h) > 1e-6 || h < Math.round(c.min * 100) || h > Math.round(c.max * 100)) throw new RangeError(`${name} must be from ${c.min} to ${c.max}, in steps of 0.05.`);
  return h;
}

/** @param {number[]} values */
export function columnsModel(values) {
  if (!Array.isArray(values) || values.length !== 3) throw new RangeError("needs a first number, a second number and an operation");
  const ca = hundredths(values[0], FIRST, "First number");
  const cb = hundredths(values[1], SECOND, "Second number");
  if (values[2] !== 1 && values[2] !== 2) throw new RangeError("Operation must be 1 (add) or 2 (subtract).");
  const op = values[2] === 1 ? "+" : "−";
  const cr = op === "+" ? ca + cb : ca - cb;
  const dp = Math.max(placesOf(ca), placesOf(cb));
  const nInt = intColumns([ca, cb, cr]);
  const work = columnsWork(ca, cb, op, nInt);
  if (work.out.join("") !== String(cr).padStart(work.out.length, "0")) throw new Error("the column method disagrees with the answer");
  // the check runs the other way: the sum minus the second, or the difference plus the second
  const checkText = op === "+" ? `${fixed(cr, dp)} − ${fixed(cb, dp)} = ${fixed(ca, dp)}` : `${fixed(cr, dp)} + ${fixed(cb, dp)} = ${fixed(ca, dp)}`;
  return {
    ca, cb, cr, op, dp, nInt, work,
    topPlaces: placesOf(ca), botPlaces: placesOf(cb),
    value: cr / 100,
    equation: `${fixed(ca, dp)} ${op} ${fixed(cb, dp)} = ${fixed(cr, dp)}`,
    checkText,
    mistake: misalign(ca, cb, op),
  };
}

/** @typedef {ReturnType<typeof columnsModel>} ColumnsModel */

/** @param {ColumnsModel} m @param {"en" | "es"} lang */
function describe(m, lang) {
  const es = lang === "es";
  const a = fixed(m.ca, placesOf(m.ca));
  const b = fixed(m.cb, placesOf(m.cb));
  const verb = m.op === "+" ? pick(lang, "add", "sumar") : pick(lang, "subtract", "restar");
  const s = [];
  s.push(es ? `Queremos ${verb} ${a} ${m.op} ${b} en columnas de valor posicional.` : `We ${verb} ${a} ${m.op} ${b} in place-value columns.`);
  s.push(m.dp === 0
    ? es ? "Los dos son números enteros, así que no hay lugares decimales que igualar." : "Both are whole numbers, so there are no decimal places to match."
    : es ? `Alineamos los puntos decimales y agregamos ceros para que los dos tengan ${m.dp} ${m.dp === 1 ? "lugar decimal" : "lugares decimales"}: ${fixed(m.ca, m.dp)} y ${fixed(m.cb, m.dp)}.` : `We line up the decimal points and annex zeros so both have ${m.dp} decimal ${m.dp === 1 ? "place" : "places"}: ${fixed(m.ca, m.dp)} and ${fixed(m.cb, m.dp)}.`);
  for (const n of columnNotes(m.work, m.nInt, lang)) s.push(n);
  if (!m.work.regroups) s.push(es ? "No hace falta reagrupar." : "No regrouping is needed.");
  s.push(es ? `Resultado: ${m.equation}. Comprobación: ${m.checkText}.` : `Answer: ${m.equation}. Check: ${m.checkText}.`);
  if (m.mistake) s.push(es ? `No así: si alineas los últimos dígitos, ${m.mistake.from} se corre a ${m.mistake.to} y sale ${m.mistake.sum}.` : `Not this: lining up the last digits slides ${m.mistake.from} to ${m.mistake.to}, giving ${m.mistake.sum}.`);
  return s.join(" ");
}

/** @param {ColumnsModel} m @param {{ lang: "en" | "es", width: number }} o */
function render(m, { lang, width }) {
  const W = Math.max(300, Math.min(900, Math.round(width)));
  const common = { W, lang, ca: m.ca, cb: m.cb, cr: m.cr, op: /** @type {"+" | "−"} */ (m.op), dp: m.dp, nInt: m.nInt, topPlaces: m.topPlaces, botPlaces: m.botPlaces, work: m.work };
  const inner = W - 2 * PAD;
  let y = PAD;
  let out = "";

  // 1 line up the points, annex zeros
  const h1 = panelHead(y, 1, pick(lang, "Line up the decimal points", "Alinea los puntos decimales"), W);
  y += h1.height;
  const g1 = drawColumns({ ...common, y, withResult: false });
  y += g1.height + 4;
  const annexTop = m.dp - m.topPlaces;
  const annexBot = m.dp - m.botPlaces;
  /** @param {string} n @param {number} places @param {number} k */
  const annexLine = (n, places, k) => pick(lang, `${n} has ${places} decimal ${places === 1 ? "place" : "places"}: annex ${k} ${k === 1 ? "zero" : "zeros"}.`, `${n} tiene ${places} ${places === 1 ? "lugar decimal" : "lugares decimales"}: agrega ${k} ${k === 1 ? "cero" : "ceros"}.`);
  let say = m.dp === 0 ? pick(lang, "Both are whole numbers: no zeros to annex.", "Los dos son enteros: no hay ceros que agregar.") : "";
  if (annexTop > 0) say = annexLine(fixed(m.ca, m.topPlaces), m.topPlaces, annexTop);
  else if (annexBot > 0) say = annexLine(fixed(m.cb, m.botPlaces), m.botPlaces, annexBot);
  else if (m.dp > 0) say = pick(lang, `Both have ${m.dp} decimal ${m.dp === 1 ? "place" : "places"}: no zeros to annex.`, `Los dos tienen ${m.dp} ${m.dp === 1 ? "lugar decimal" : "lugares decimales"}: no hay ceros que agregar.`);
  const p1 = para(PAD, y + 14, say + (annexTop > 0 || annexBot > 0 ? pick(lang, " Dashed zeros are annexed.", " Los ceros con borde discontinuo se agregan.") : ""), { maxPx: inner, fill: COLOR.muted });
  y += p1.height + 8;
  out += panel(1, base(h1.svg + p1.svg) + g1.svg);

  // 2 one column at a time
  const verb = m.op === "+" ? pick(lang, "Add", "Suma") : pick(lang, "Subtract", "Resta");
  const h2 = panelHead(y, 2, pick(lang, `${verb} one column at a time, from the right`, `${verb} una columna a la vez, desde la derecha`), W);
  y += h2.height;
  const g2 = drawColumns({ ...common, y, withResult: true });
  y += g2.height + 4;
  const notes = columnNotes(m.work, m.nInt, lang);
  const text2 = m.work.regroups
    ? [...notes, pick(lang, "Dashed boxes show the regrouped digit.", "Los recuadros discontinuos muestran el dígito reagrupado.")]
    : [pick(lang, "No regrouping is needed.", "No hace falta reagrupar."), pick(lang, "Bring the point straight down.", "Baja el punto en línea recta.")];
  let p2svg = "";
  for (const line of text2) {
    const p = para(PAD, y + 14, line, { maxPx: inner, fill: COLOR.muted });
    p2svg += p.svg;
    y += p.height;
  }
  y += 8;
  out += panel(2, base(h2.svg + p2svg) + g2.svg);

  // answer, check, and the mistake that differs
  const ok = okBox(y, W, [m.equation, `${pick(lang, "Check", "Comprobación")}: ${m.checkText}`]);
  y += ok.height;
  let tail = ok.svg;
  if (m.mistake) {
    const nb = notBox(y, W, [pick(lang, "Not this: last digits lined up, not the points.", "No así: alinear los últimos dígitos, no los puntos."), pick(lang, `${m.mistake.from} slides to ${m.mistake.to}, so ${m.mistake.sum}.`, `${m.mistake.from} se corre a ${m.mistake.to}, y sale ${m.mistake.sum}.`)]);
    y += nb.height;
    tail += nb.svg;
  }
  out += panel(3, base(tail));
  return { body: out, width: W, height: Math.ceil(y + 6) };
}

const figure = {
  id: "decimal-columns",
  keys: ["decimal:columns"],
  title: { en: "Add and subtract decimals in place-value columns", es: "Suma y resta decimales en columnas de valor posicional" },
  controls: () => [
    { label: "First number", labelEs: "Primer número", ...FIRST },
    { label: "Second number", labelEs: "Segundo número", ...SECOND },
    { label: "Operation (1 = add, 2 = subtract)", labelEs: "Operación (1 = sumar, 2 = restar)", min: 1, max: 2, step: 1 },
  ],
  build: (_key, values) => columnsModel(values),
  render,
  scene: (/** @type {ParentNode} */ root) => panelScene(root),
  describe,
  /** The number the lesson asks for. @param {ColumnsModel} m @param {"en" | "es"} lang */
  headline: (m, lang) => ({ label: pick(lang, "Answer", "Respuesta"), value: fixed(m.cr, m.dp) }),
  /** The dashed card: last digits lined up instead of the points. Null when nothing slides. @param {ColumnsModel} m @param {"en" | "es"} lang */
  wrong: (m, lang) => (m.mistake ? { value: m.mistake.value, say: pick(lang, "Lined up the last digits instead of the decimal points.", "Alineaste los últimos dígitos en vez de los puntos decimales.") } : null),
};

export default /** @type {import("./mount.mjs").Figure} */ (figure);
