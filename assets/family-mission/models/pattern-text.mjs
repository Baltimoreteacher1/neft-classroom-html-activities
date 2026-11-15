// Words and number text for the "pattern" family. Every string has English and Spanish; numbers
// print as exact decimals with a decimal POINT in both languages (the site's convention).
import { frac, fracToString, t, toDecimalString } from "./core.mjs";

export const STR = {
  problem: { en: "Pick a problem", es: "Elige un problema" },
  undo: { en: "Undo", es: "Deshacer" },
  reset: { en: "Start over", es: "Empezar de nuevo" },
  table: { en: "Table of values", es: "Tabla de valores" },
  addRow: { en: "Add row", es: "Agregar fila" },
  noRows: { en: "Add a row to see what comes out.", es: "Agrega una fila para ver qué sale." },
  moreRows: {
    en: "Add more rows. Look at how the output changes when the input goes up.",
    es: "Agrega más filas. Mira cómo cambia el resultado cuando la entrada sube.",
  },
  full: { en: "The table is full. Use Undo to take a row away.", es: "La tabla está llena. Usa Deshacer para quitar una fila." },
  tryRule: { en: "Try a rule", es: "Prueba una regla" },
  kindAdd: { en: "Start, then add each step", es: "Empezar y sumar en cada paso" },
  kindTimes: { en: "Multiply the input", es: "Multiplicar la entrada" },
  start: { en: "Start at", es: "Empieza en" },
  stepAdd: { en: "Each step adds", es: "Cada paso suma" },
  stepTimes: { en: "Multiply by", es: "Multiplica por" },
  badNum: { en: "Type a number like 0.5 or 12.", es: "Escribe un número como 0.5 o 12." },
  check: { en: "Check my rule", es: "Revisar mi regla" },
  gives: { en: "Your rule gives", es: "Tu regla da" },
  status: { en: "Row check", es: "Revisión de la fila" },
  matches: { en: "matches", es: "coincide" },
  differs: { en: "differs", es: "es diferente" },
  units: { en: "Use the same units as the table.", es: "Usa las mismas unidades que la tabla." },
  incomplete: { en: "Fill in the rule first.", es: "Primero completa la regla." },
  some: {
    en: "At least one row differs. Try another look at how the numbers change from row to row.",
    es: "Al menos una fila es diferente. Mira otra vez cómo cambian los números de una fila a otra.",
  },
  all: { en: "Your rule matches every row.", es: "Tu regla coincide con todas las filas." },
  testMore: { en: "Add a row with a big input to test it again.", es: "Agrega una fila con una entrada grande para probarla otra vez." },
  graph: { en: "Graph of the table", es: "Gráfica de la tabla" },
  tablePoint: { en: "table value", es: "valor de la tabla" },
  rulePoint: { en: "your rule", es: "tu regla" },
  noPoints: { en: "Add a row to see its point.", es: "Agrega una fila para ver su punto." },
  which: { en: "Which number do we know?", es: "¿Cuál número conocemos?" },
  knownNumber: { en: "Known number", es: "Número conocido" },
  badKnown: { en: "Type a number above 0, like 1,000 or 2.5.", es: "Escribe un número mayor que 0, como 1,000 o 2.5." },
  logTitle: { en: "What we did to both sides", es: "Lo que hicimos a ambos lados" },
  left: { en: "Left side", es: "Lado izquierdo" },
  right: { en: "Right side", es: "Lado derecho" },
  checkIt: { en: "Check by putting it back", es: "Comprobar poniéndolo de nuevo" },
  tried: { en: "Try another look: that does not leave the letter alone.", es: "Mira de otra manera: eso no deja la letra sola." },
  doneSolve: { en: "Solved and checked.", es: "Resuelto y comprobado." },
};

// ── Numbers ──────────────────────────────────────────────────────────────────

export function num(v, min = 0) {
  const s = toDecimalString(v, { commas: true });
  if (s === null) return fracToString(v);
  const [whole, part = ""] = s.split(".");
  return part.length >= min ? s : `${whole}.${part.padEnd(min, "0")}`;
}
/** A value as the table prints it: money gets its symbol and cents. */
export const plain = (d, who, v) => (who === "y" ? `${d.units.yPrefix}${num(v, d.units.yDecimals)}` : num(v));
export const withUnit = (d, who, v, lang) => {
  const u = d.units[who];
  return `${plain(d, who, v)}${u ? ` ${t(lang, u)}` : ""}`;
};
export function header(d, who, lang) {
  const name = t(lang, d.quantities[who]);
  const unit = d.units[who] && t(lang, d.units[who]);
  return unit && unit !== name ? `${name} (${unit})` : name;
}
const int = (n) => num(frac(n));
const pick = (o, lang) => t(lang, o);
const say2 = (lang, en, es) => t(lang, { en, es });

// ── Rule mode ────────────────────────────────────────────────────────────────

export const inputLabel = (d, lang) =>
  say2(lang, `Input ${d.letters.x}: a whole number from 1 to ${int(d.maxX)}`, `Entrada ${d.letters.x}: un número entero de 1 a ${int(d.maxX)}`);
export const badX = (d, lang) =>
  say2(
    lang,
    `Pick a whole number from 1 to ${int(d.maxX)} that is not in the table yet.`,
    `Elige un número entero de 1 a ${int(d.maxX)} que todavía no esté en la tabla.`,
  );

/** The rule the student has typed, as an equation, or "" while it is unfinished. */
export function guessLine(d) {
  const { kind, start, step, complete } = d.guess;
  const { x, y } = d.letters;
  if (!complete) return "";
  return kind === "add" ? `${y} = ${num(start)} + ${num(step)} × ${x}` : `${y} = ${num(step)} × ${x}`;
}

export function resultText(d, lang) {
  if (d.result === "all") return `${pick(STR.all, lang)}${d.rows.length < 3 ? ` ${pick(STR.testMore, lang)}` : ""}`;
  return d.result ? pick(STR[d.result], lang) : "";
}

/** The real rule, only ever shown once the student's rule has matched (or in the explanation). */
export function ruleLine(d) {
  const { x, y } = d.letters;
  return d.b.n === 0 ? `${y} = ${num(d.m)} × ${x}` : `${y} = ${num(d.b)} + ${num(d.m)} × ${x}`;
}

// ── Solve mode ───────────────────────────────────────────────────────────────

const mm = (d) => num(d.m);
export function equationLine(d, lang) {
  const { x, y } = d.letters;
  const rate = mm(d);
  if (d.known === "y") {
    if (d.stage === 0) return `${y} = ${rate} × ${x}`;
    if (d.stage === 1) return `${rate} × ${x} = ${plain(d, "y", d.value)}`;
    return `${x} = ${withUnit(d, "x", d.answer, lang)}`;
  }
  if (d.stage === 0) return `${y} = ${rate} × ${x}`;
  if (d.stage === 1) return `${y} = ${rate} × ${num(d.value)}`;
  return `${y} = ${withUnit(d, "y", d.answer, lang)}`;
}
export function logLines(d, lang) {
  const { x } = d.letters;
  const rate = mm(d);
  return [
    `${pick(STR.left, lang)}: ${rate} × ${x} ÷ ${rate} = ${x}`,
    `${pick(STR.right, lang)}: ${plain(d, "y", d.value)} ÷ ${rate} = ${num(d.answer)}`,
  ];
}
export function checkLine(d, lang) {
  const rate = mm(d);
  const sum = d.known === "y" ? `${rate} × ${num(d.answer)} = ${plain(d, "y", d.back)}` : `${plain(d, "y", d.answer)} ÷ ${rate} = ${num(d.back)}`;
  const tail = d.checkOk ? say2(lang, "It matches.", "Coincide.") : say2(lang, "It does not match.", "No coincide.");
  return `${say2(lang, "Check", "Comprobación")}: ${sum}. ${tail}`;
}
export function opLabel(d, op, lang) {
  const rate = mm(d);
  const L = {
    div: { en: `Divide both sides by ${rate}`, es: `Dividir ambos lados entre ${rate}` },
    mul: { en: `Multiply both sides by ${rate}`, es: `Multiplicar ambos lados por ${rate}` },
    add: { en: `Add ${rate} to both sides`, es: `Sumar ${rate} a ambos lados` },
    sub: { en: `Subtract ${rate} from both sides`, es: `Restar ${rate} de ambos lados` },
  };
  return pick(L[op], lang);
}
export function stepLabel(d, lang) {
  if (d.stage === 0) {
    const who = d.known;
    return say2(lang, `Substitute ${plain(d, who, d.value)} for ${d.letters[who]}`, `Sustituir ${d.letters[who]} por ${plain(d, who, d.value)}`);
  }
  if (d.stage === 1) return say2(lang, `Work out ${mm(d)} × ${num(d.value)}`, `Calcular ${mm(d)} × ${num(d.value)}`);
  if (d.stage === 2) return pick(STR.checkIt, lang);
  return "";
}
export function stageHint(d, lang) {
  if (d.stage === 0) return say2(lang, "Put the number you know where its letter goes.", "Pon el número que conoces donde va su letra.");
  if (d.stage === 1 && d.known === "y") return say2(lang, `What undoes × ${mm(d)}? Choose one move for both sides.`, `¿Qué deshace × ${mm(d)}? Elige un paso para ambos lados.`);
  if (d.stage === 1) return say2(lang, "Work out the multiplication.", "Calcula la multiplicación.");
  if (d.stage === 2) return say2(lang, "Now check: put the answer back in the equation.", "Ahora comprueba: pon la respuesta de nuevo en la ecuación.");
  return pick(STR.doneSolve, lang);
}

// ── Descriptions and announcements ───────────────────────────────────────────

const tableText = (d, lang) =>
  d.rows.map((r) => `${d.letters.x} = ${int(r.x)}, ${d.letters.y} = ${plain(d, "y", r.y)}`).join("; ") || pick(STR.noRows, lang);

export function accessibleText(d, lang) {
  if (d.mode === "rule") {
    const rule = guessLine(d);
    const tail = d.result ? resultText(d, lang) : say2(lang, "Look at how the output changes each time the input goes up by 1.", "Mira cómo cambia el resultado cada vez que la entrada sube 1.");
    return say2(
      lang,
      `Pattern table model. ${d.rows.length} rows: ${tableText(d, lang)}. ${rule ? `Your rule: ${rule}. ` : ""}${tail}`,
      `Modelo de tabla de patrón. ${d.rows.length} filas: ${tableText(d, lang)}. ${rule ? `Tu regla: ${rule}. ` : ""}${tail}`,
    );
  }
  return say2(
    lang,
    `Equation model. ${equationLine(d, lang)}. ${stageHint(d, lang)}`,
    `Modelo de ecuación. ${equationLine(d, lang)}. ${stageHint(d, lang)}`,
  );
}

export function explanationText(d, lang) {
  if (d.mode === "rule") {
    const r = d.rows[0];
    const intro = say2(lang, "A pattern rule tells what to do to any input.", "La regla de un patrón dice qué hacer con cualquier entrada.");
    if (d.result !== "all" || !r) return `${intro} ${say2(lang, "Compare each row with your rule.", "Compara cada fila con tu regla.")}`;
    const bit = d.b.n === 0 ? "" : ` + ${num(d.b)}`;
    return `${intro} ${ruleLine(d)}. ${say2(lang, "Row", "Fila")} ${d.letters.x} = ${int(r.x)}: ${num(d.m)} × ${int(r.x)}${bit} = ${plain(d, "y", r.y)}.`;
  }
  const base = say2(lang, `The equation is ${equationLine({ ...d, stage: 0 }, lang)}.`, `La ecuación es ${equationLine({ ...d, stage: 0 }, lang)}.`);
  if (!d.finished) return `${base} ${stageHint(d, lang)}`;
  const mid = d.known === "y" ? `${equationLine({ ...d, stage: 1 }, lang)}. ${logLines(d, lang).join(". ")}.` : `${equationLine({ ...d, stage: 1 }, lang)}.`;
  return `${base} ${mid} ${equationLine(d, lang)}. ${checkLine(d, lang)}`;
}

export function sayText(d, lang) {
  if (d.mode === "rule") return d.result ? resultText(d, lang) : `${d.rows.length} ${say2(lang, "rows", "filas")}.`;
  return d.tried ? pick(STR.tried, lang) : `${equationLine(d, lang)}. ${stageHint(d, lang)}`;
}
