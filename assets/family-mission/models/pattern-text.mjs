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
  twoMoves: {
    en: "This rule has a starting amount, so two moves leave the letter alone. Choose the first move for both sides.",
    es: "Esta regla tiene una cantidad inicial, así que dos pasos dejan la letra sola. Elige el primer paso para ambos lados.",
  },
  reverse: {
    en: "Undo the adding first, then the multiplying: reverse order, one move at a time.",
    es: "Deshaz primero la suma y luego la multiplicación: en orden inverso, un paso a la vez.",
  },
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
/** The rule as the student sees it: y = m × x, or y = b + m × x when there is a starting amount. */
const rhs = (d) => (d.start ? `${num(d.b)} + ${mm(d)} × ${d.letters.x}` : `${mm(d)} × ${d.letters.x}`);

export function equationLine(d, lang) {
  const { x, y } = d.letters;
  const rate = mm(d);
  if (d.start) return startEquation(d, lang);
  if (d.known === "y") {
    if (d.stage === 0) return `${y} = ${rate} × ${x}`;
    if (d.stage === 1) return `${rate} × ${x} = ${plain(d, "y", d.value)}`;
    return `${x} = ${withUnit(d, "x", d.answer, lang)}`;
  }
  if (d.stage === 0) return `${y} = ${rate} × ${x}`;
  if (d.stage === 1) return `${y} = ${rate} × ${num(d.value)}`;
  return `${y} = ${withUnit(d, "y", d.answer, lang)}`;
}
/** y = b + m × x: the goal side goes where y is and the two undo steps peel b, then m. */
function startEquation(d, lang) {
  const { x, y } = d.letters;
  if (d.stage === 0) return `${y} = ${rhs(d)}`;
  if (d.known === "y") {
    if (d.stage === 1) return `${rhs(d)} = ${plain(d, "y", d.value)}`;
    if (d.stage === 2) return `${mm(d)} × ${x} = ${plain(d, "y", d.rest)}`;
    return `${x} = ${withUnit(d, "x", d.answer, lang)}`;
  }
  if (d.stage === 1) return `${y} = ${num(d.b)} + ${mm(d)} × ${num(d.value)}`;
  if (d.stage === 2) return `${y} = ${num(d.b)} + ${num(d.rest)}`;
  return `${y} = ${withUnit(d, "y", d.answer, lang)}`;
}

/** "What we did to both sides": the lines for every undo move made so far (none when x is known). */
export function logLines(d, lang) {
  if (d.known !== "y" || d.stage < 2) return [];
  const { x } = d.letters;
  const rate = mm(d);
  const side = (left, right) => [`${pick(STR.left, lang)}: ${left}`, `${pick(STR.right, lang)}: ${right}`];
  if (!d.start) return side(`${rate} × ${x} ÷ ${rate} = ${x}`, `${plain(d, "y", d.value)} ÷ ${rate} = ${num(d.answer)}`);
  const b = num(d.b);
  const first = side(`${rhs(d)} − ${b} = ${rate} × ${x}`, `${plain(d, "y", d.value)} − ${plain(d, "y", d.b)} = ${plain(d, "y", d.rest)}`);
  const second = side(`${rate} × ${x} ÷ ${rate} = ${x}`, `${plain(d, "y", d.rest)} ÷ ${rate} = ${num(d.answer)}`);
  const both = d.stage >= 3 ? [...first, ...second] : first;
  return both.map((line, i) => `${Math.floor(i / 2) + 1}. ${line}`);
}
export function checkLine(d, lang) {
  const rate = mm(d);
  let sum;
  if (d.start) {
    sum =
      d.known === "y"
        ? `${num(d.b)} + ${rate} × ${num(d.answer)} = ${plain(d, "y", d.back)}`
        : `(${plain(d, "y", d.answer)} − ${plain(d, "y", d.b)}) ÷ ${rate} = ${num(d.back)}`;
  } else {
    sum = d.known === "y" ? `${rate} × ${num(d.answer)} = ${plain(d, "y", d.back)}` : `${plain(d, "y", d.answer)} ÷ ${rate} = ${num(d.back)}`;
  }
  const tail = d.checkOk ? say2(lang, "It matches.", "Coincide.") : say2(lang, "It does not match.", "No coincide.");
  return `${say2(lang, "Check", "Comprobación")}: ${sum}. ${tail}`;
}
export function opLabel(d, op, lang) {
  const rate = mm(d);
  const start = d.start ? num(d.b) : rate; // adding and subtracting use the starting amount when there is one
  const L = {
    div: { en: `Divide both sides by ${rate}`, es: `Dividir ambos lados entre ${rate}` },
    mul: { en: `Multiply both sides by ${rate}`, es: `Multiplicar ambos lados por ${rate}` },
    add: { en: `Add ${start} to both sides`, es: `Sumar ${start} a ambos lados` },
    sub: { en: `Subtract ${start} from both sides`, es: `Restar ${start} de ambos lados` },
  };
  return pick(L[op], lang);
}
export function stepLabel(d, lang) {
  if (d.stage === 0) {
    const who = d.known;
    return say2(lang, `Substitute ${plain(d, who, d.value)} for ${d.letters[who]}`, `Sustituir ${d.letters[who]} por ${plain(d, who, d.value)}`);
  }
  if (d.stage === 1) return say2(lang, `Work out ${mm(d)} × ${num(d.value)}`, `Calcular ${mm(d)} × ${num(d.value)}`);
  if (d.start && d.stage === 2) return say2(lang, `Add ${num(d.b)} + ${num(d.rest)}`, `Sumar ${num(d.b)} + ${num(d.rest)}`);
  if (d.stage === (d.start ? 3 : 2)) return pick(STR.checkIt, lang);
  return "";
}
export function stageHint(d, lang) {
  if (d.stage === 0) return say2(lang, "Put the number you know where its letter goes.", "Pon el número que conoces donde va su letra.");
  if (d.start) return startHint(d, lang);
  if (d.stage === 1 && d.known === "y") return say2(lang, `What undoes × ${mm(d)}? Choose one move for both sides.`, `¿Qué deshace × ${mm(d)}? Elige un paso para ambos lados.`);
  if (d.stage === 1) return say2(lang, "Work out the multiplication.", "Calcula la multiplicación.");
  if (d.stage === 2) return say2(lang, "Now check: put the answer back in the equation.", "Ahora comprueba: pon la respuesta de nuevo en la ecuación.");
  return pick(STR.doneSolve, lang);
}
/** Hints for y = b + m × x. They name the principle (reverse order), never the answer. */
function startHint(d, lang) {
  if (d.known === "y") {
    if (d.stage === 1 && d.tried) return pick(STR.reverse, lang);
    if (d.stage === 1) return pick(STR.twoMoves, lang);
    if (d.stage === 2) return say2(lang, `One move is done. What undoes × ${mm(d)}? Choose the next move.`, `Ya hay un paso. ¿Qué deshace × ${mm(d)}? Elige el siguiente paso.`);
  } else {
    if (d.stage === 1) return say2(lang, "Work out the multiplication first.", "Primero calcula la multiplicación.");
    if (d.stage === 2) return say2(lang, "Now add the starting amount.", "Ahora suma la cantidad inicial.");
  }
  if (d.stage === 3) return say2(lang, "Now check: put the answer back in the equation.", "Ahora comprueba: pon la respuesta de nuevo en la ecuación.");
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
  const kind = d.start ? say2(lang, "Two-step equation model", "Modelo de ecuación de dos pasos") : say2(lang, "Equation model", "Modelo de ecuación");
  return `${kind}. ${equationLine(d, lang)}. ${stageHint(d, lang)}`;
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
  if (d.start) return `${base} ${startSteps(d, lang)} ${checkLine(d, lang)}`;
  const mid = d.known === "y" ? `${equationLine({ ...d, stage: 1 }, lang)}. ${logLines(d, lang).join(". ")}.` : `${equationLine({ ...d, stage: 1 }, lang)}.`;
  return `${base} ${mid} ${equationLine(d, lang)}. ${checkLine(d, lang)}`;
}

/** The worked steps of a finished y = b + m × x problem, one sentence per move. */
function startSteps(d, lang) {
  const at = (stage) => `${equationLine({ ...d, stage }, lang)}.`;
  if (d.known === "x") return `${at(1)} ${at(2)} ${at(3)}`;
  const [l1, r1, l2, r2] = logLines(d, lang);
  const undo = (op) => `${opLabel(d, op, lang)}.`;
  return `${at(1)} ${undo("sub")} ${l1}. ${r1}. ${at(2)} ${undo("div")} ${l2}. ${r2}. ${at(3)}`;
}

export function sayText(d, lang) {
  if (d.mode === "rule") return d.result ? resultText(d, lang) : `${d.rows.length} ${say2(lang, "rows", "filas")}.`;
  if (d.tried) return d.start && d.stage === 1 ? `${pick(STR.tried, lang)} ${pick(STR.reverse, lang)}` : pick(STR.tried, lang);
  return `${equationLine(d, lang)}. ${stageHint(d, lang)}`;
}
