// Expressions and data: order of operations (one legal step at a time), two equations added to remove a variable,
// an inequality tested on a number line, a percent change, mean and median and probability, a bar chart, and a
// scatter plot. Every frame of an expression keeps the same value, and every number is recomputed by the tests.
import { COLORS, L, choiceBuild, clean, frameOf, gcd, keyed, num, predictOf, svgWrap, txt } from "./core.js";
import percentFindWhole from "../../../curriculum/learning-labs/shared/models/percent-find-whole.mjs";
import { fiveNumber } from "../response-check.js";

const sg = (n) => (n < 0 ? `−${-n}` : String(n));
const fmtN = (n) => String(Math.round(n * 1e6) / 1e6).replace("-", "−");
const A = (en, es) => L(en, es);

// ----- order of operations: a tiny tokenizer and a one-step reducer -----
function tokenize(text) {
  const out = [];
  const re = /\s*(\d+(?:\.\d+)?|[+\-×÷()])/g;
  let m;
  let prev = null;
  while ((m = re.exec(text))) {
    const tok = m[1];
    if (tok === "-" && (prev === null || prev === "(" || ["+", "-", "×", "÷"].includes(prev)) && /\d/.test(text.slice(re.lastIndex).trim()[0] || "")) {
      const d = /\s*(\d+(?:\.\d+)?)/y;
      d.lastIndex = re.lastIndex;
      const n = d.exec(text);
      out.push(-Number(n[1]));
      re.lastIndex = d.lastIndex;
      prev = "n";
      continue;
    }
    out.push(/\d/.test(tok) ? Number(tok) : tok);
    prev = /\d/.test(tok) ? "n" : tok;
  }
  return out;
}
const isOp = (t) => typeof t === "string" && "+-×÷".includes(t);
const apply = (a, op, b) => (op === "+" ? a + b : op === "-" ? a - b : op === "×" ? a * b : a / b);
// The index of the operator that the order of operations says to do next.
function nextOp(tokens) {
  const open = tokens.lastIndexOf("(");
  const lo = open >= 0 ? open + 1 : 0;
  const hi = open >= 0 ? tokens.indexOf(")", open) : tokens.length;
  const seg = tokens.slice(lo, hi);
  let k = seg.findIndex((t) => t === "×" || t === "÷");
  if (k < 0) k = seg.findIndex((t) => t === "+" || t === "-");
  return k < 0 ? -1 : lo + k;
}
function step(tokens) {
  const i = nextOp(tokens);
  if (i < 0) return null;
  const value = apply(tokens[i - 1], tokens[i], tokens[i + 1]);
  const next = [...tokens.slice(0, i - 1), value, ...tokens.slice(i + 2)];
  // Drop parentheses that now hold a single number.
  for (let j = 0; j < next.length - 2; j += 1) if (next[j] === "(" && typeof next[j + 1] === "number" && next[j + 2] === ")") next.splice(j, 3, next[j + 1]);
  return { tokens: next, at: i, a: tokens[i - 1], op: tokens[i], b: tokens[i + 1], value };
}
const show = (tokens) => tokens.map((t) => (typeof t === "number" ? (t < 0 ? `(${sg(t)})` : fmtN(t)) : t === "-" ? "−" : t)).join(" ").replace("( ", "(").replace(" )", ")");
const leftToRight = (tokens) => {
  const flat = tokens.filter((t) => t !== "(" && t !== ")");
  let acc = flat[0];
  for (let i = 1; i < flat.length; i += 2) acc = apply(acc, flat[i], flat[i + 1]);
  return acc;
};

export function parse(question, item) {
  const raw = String(question).replaceAll("−", "-").trim();
  const q = clean(question);
  let m = raw.match(/^Evaluate (-?\d*)x ([+-]) (\d+) when x = (-?\d+)\.$/);
  if (m) {
    const k = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
    const text = `${k} × (${m[4]}) ${m[2]} ${m[3]}`;
    return exprSpec(text, { source: "sub", k, c: m[2] === "+" ? Number(m[3]) : -Number(m[3]), x: Number(m[4]) });
  }
  m = q.match(/^(\(?-?\d+ [+\-−×÷] -?\d+\)?(?: [+\-−×÷] \(?-?\d+\)?)*) = \?$/);
  if (m && /[()]/.test(m[1]) || (m && (m[1].match(/[+\-−×÷]/g) || []).length >= 2)) return exprSpec(m[1].replaceAll("−", "-"), { source: "expr" });
  m = raw.match(/^x \+ y = (-?\d+) and x - y = (-?\d+)\. Find x\.$/);
  if (m) {
    const [s, d] = [Number(m[1]), Number(m[2])];
    return (s + d) % 2 === 0 ? { engine: "expr", mode: "system", s, d, x: (s + d) / 2, y: (s - d) / 2, result: (s + d) / 2 } : null;
  }
  m = raw.match(/^Is (-?\d+) a solution to x (<|>|≤|≥) (-?\d+)\?$/);
  if (m) {
    const [v, op, n] = [Number(m[1]), m[2], Number(m[3])];
    const ok = op === "<" ? v < n : op === ">" ? v > n : op === "≤" ? v <= n : v >= n;
    return { engine: "expr", mode: "ineq", v, op, n, result: ok ? "yes" : "no" };
  }
  m = q.match(/^(\d+) with a (\d+)% (increase|decrease) equals what\?$/);
  if (m) {
    const [n, p, up] = [Number(m[1]), Number(m[2]), m[3] === "increase"];
    const change = (n * p) / 100;
    return { engine: "expr", mode: "pct", n, p, up, change, result: up ? n + change : n - change };
  }
  m = raw.match(/^(\d+(?:\.\d+)?) is (\d+(?:\.\d+)?)% of what number\?$/);
  if (m) {
    const [part, p] = [Number(m[1]), Number(m[2])];
    try {
      const result = percentFindWhole.evaluate(null, [p, part]);
      return { engine: "expr", mode: "percentWhole", p, part, whole: result.value, result: result.value };
    } catch {
      return null;
    }
  }
  m = raw.match(/^A histogram groups the data (.+) in intervals of (\d+)\. How many values are in the interval (\d+)[–-](\d+)\?$/);
  if (m) {
    const values = m[1].split(/,\s*/).map(Number);
    const width = Number(m[2]);
    const [lo, hi] = [Number(m[3]), Number(m[4])];
    if (values.length < 4 || values.length > 30 || values.some((v) => !Number.isInteger(v) || v < 0) || !Number.isInteger(width) || width < 1 || lo % width !== 0 || hi !== lo + width - 1) return null;
    const max = Math.max(...values);
    const bins = Array.from({ length: Math.floor(max / width) + 1 }, (_, i) => {
      const start = i * width;
      return { lo: start, hi: start + width - 1, count: values.filter((v) => v >= start && v <= start + width - 1).length };
    });
    const target = bins.findIndex((bin) => bin.lo === lo);
    if (target < 0) return null;
    return { engine: "expr", mode: "hist", values, width, bins, target, result: bins[target].count };
  }
  m = raw.match(/^A frequency table shows how many (pets|books) students have\. (.+)\. How many students were asked\?$/);
  if (m) {
    const rows = m[2].split(/;\s*/).map((row) => row.match(/^(\d+ (?:pet|pets|book|books)):\s*(\d+)$/));
    if (rows.length < 2 || rows.length > 8 || rows.some((row) => !row)) return null;
    const values = rows.map((row) => [row[1], Number(row[2])]);
    return { engine: "expr", mode: "freq", rows: values, result: values.reduce((sum, row) => sum + row[1], 0) };
  }
  m = raw.match(/^Find the (mean|median|mean absolute deviation \(MAD\)|interquartile range \(IQR\))(?: of the data)?: (.+)\.$/i);
  if (m) {
    const listText = m[2].trim();
    if (!/^-?\d+(?:\.\d+)?(?:,\s*-?\d+(?:\.\d+)?)*$/.test(listText)) return null;
    const list = listText.split(/,\s*/).map(Number);
    if (list.length < 4 || list.length > 12 || list.some((value) => !Number.isFinite(value))) return null;
    const sorted = [...list].sort((a, b) => a - b);
    const mid = sorted.length / 2;
    const median = sorted.length % 2 ? sorted[Math.floor(mid)] : (sorted[mid - 1] + sorted[mid]) / 2;
    const mean = list.reduce((a, b) => a + b, 0) / list.length;
    const title = m[1].toLowerCase();
    const mode = title.startsWith("mean absolute") ? "mad" : title.startsWith("interquartile") ? "iqr" : title;
    const [min, q1, , q3, max] = fiveNumber(list);
    const distances = list.map((value) => Math.abs(value - mean));
    const mad = distances.reduce((a, b) => a + b, 0) / list.length;
    const result = mode === "median" ? median : mode === "mean" ? mean : mode === "mad" ? mad : q3 - q1;
    return { engine: "expr", mode, list, sorted, median, mean, distances, mad, min, q1, q3, max, result };
  }
  m = q.match(/^(\d+) of (\d+) equal sections are winning sections\. What is P\(win\)\?$/);
  if (m) {
    const [n, t] = [Number(m[1]), Number(m[2])];
    const g = gcd(n, t) || 1;
    return n <= t && t <= 24 ? { engine: "expr", mode: "prob", n, t, result: t / g === 1 ? String(n / g) : `${n / g}/${t / g}` } : null;
  }
  m = raw.match(/^A class vote shows ((?:[A-Za-z]+: \d+, )*[A-Za-z]+: \d+)\. Which fruit got the most votes\?$/);
  if (m) {
    const rows = m[1].split(", ").map((r) => r.split(": ")).map(([name, c]) => [name, Number(c)]);
    const top = Math.max(...rows.map((r) => r[1]));
    return rows.filter((r) => r[1] === top).length === 1 ? { engine: "expr", mode: "bars", rows, result: rows.find((r) => r[1] === top)[0] } : null;
  }
  m = raw.match(/^A data table has x-values ((?:\d+, )*\d+) and y-values ((?:-?\d+, )*-?\d+)\. Which association best describes the data\?$/);
  if (m) {
    const xs = m[1].split(", ").map(Number);
    const ys = m[2].split(", ").map(Number);
    if (xs.length !== ys.length || xs.length < 3) return null;
    const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const my = ys.reduce((a, b) => a + b, 0) / ys.length;
    const r = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / Math.sqrt(xs.reduce((a, x) => a + (x - mx) ** 2, 0) * ys.reduce((a, y) => a + (y - my) ** 2, 0) || 1);
    return { engine: "expr", mode: "scatter", xs, ys, r, result: Math.abs(r) >= 0.8 ? (r > 0 ? "positive" : "negative") : "none" };
  }
  void item;
  return null;
}
const dropParens = (tokens) => {
  const out = [...tokens];
  for (let j = 0; j < out.length - 2; j += 1) if (out[j] === "(" && typeof out[j + 1] === "number" && out[j + 2] === ")") out.splice(j, 3, out[j + 1]);
  return out;
};
function exprSpec(text, extra) {
  const tokens = dropParens(tokenize(text));
  if (tokens.length < 3 || tokens.length > 13) return null;
  const chain = [{ tokens, at: -1 }];
  let cur = tokens;
  for (let n = 0; n < 12; n += 1) {
    const s = step(cur);
    if (!s) break;
    chain.push(s);
    cur = s.tokens;
  }
  if (cur.length !== 1 || chain.length < 2) return null;
  const result = cur[0];
  if (!Number.isFinite(result)) return null;
  return { engine: "expr", mode: "expr", text, tokens, chain, result, ltr: leftToRight(tokens), ...extra };
}

// ----- pictures -----
const exprBody = (tokens, at = -1, note = "") => {
  const s = show(tokens);
  const w = Math.min(34, 520 / Math.max(s.length, 6));
  let out = txt(280, 90, s, { size: Math.min(44, w * 1.5) });
  if (at >= 0) out += txt(280, 140, note, { size: 20, fill: COLORS.warn });
  return out;
};
const numberLine = (lo, hi, marks = []) => {
  const X = (v) => 40 + ((v - lo) / (hi - lo)) * 480;
  let out = `<line x1="30" x2="530" y1="110" y2="110" stroke="${COLORS.ink}" stroke-width="3"/>`;
  const stepN = [1, 2, 5, 10, 20].find((n) => (n * 480) / (hi - lo) >= 40) ?? 50;
  for (let v = Math.ceil(lo / stepN) * stepN; v <= hi; v += stepN) out += `<line x1="${X(v)}" x2="${X(v)}" y1="102" y2="118" stroke="${COLORS.ink}" stroke-width="2"/>${txt(X(v), 142, sg(v), { size: 15, weight: 600, fill: COLORS.mute })}`;
  for (const mk of marks) out += mk(X);
  return out;
};
const barBody = (rows, hi = null) => {
  const top = Math.max(...rows.map((r) => r[1]));
  const w = 480 / rows.length;
  let out = "";
  rows.forEach(([name, c], i) => {
    const h = (c / top) * 130;
    const lit = hi === name;
    out += `<rect x="${50 + i * w + 8}" y="${170 - h}" width="${w - 16}" height="${h}" rx="6" fill="${lit ? COLORS.part : COLORS.whole}" fill-opacity=".9"/>` + txt(50 + i * w + w / 2, 164 - h, String(c), { size: 16, fill: COLORS.ink }) + txt(50 + i * w + w / 2, 194, name, { size: w < 90 ? 12 : 15, weight: 600 });
  });
  return out;
};

export function frames(s) {
  if (s.mode === "expr") {
    const out = s.chain.map((c, i) => {
      const cap = i === 0 ? A(`Order of operations: parentheses first, then × and ÷ left to right, then + and − left to right.`, `Orden de operaciones: primero paréntesis, luego × y ÷ de izquierda a derecha, luego + y − de izquierda a derecha.`) : A(`${fmtN(c.a)} ${c.op === "-" ? "−" : c.op} ${fmtN(c.b)} = ${fmtN(c.value)}.`, `${fmtN(c.a)} ${c.op === "-" ? "−" : c.op} ${fmtN(c.b)} = ${fmtN(c.value)}.`);
      return frameOf({ id: i === 0 ? "start" : `step${i}`, cap, easy: i === 0 ? A("Do the steps in order.", "Haz los pasos en orden.") : A(`${fmtN(c.value)}.`, `${fmtN(c.value)}.`), eq: show(c.tokens), body: exprBody(c.tokens, i === 0 ? -1 : 0), alt: A(`The expression ${show(c.tokens)}.`, `La expresión ${show(c.tokens)}.`), meta: { value: evalAll(c.tokens) }, h: 140 });
    });
    return out;
  }
  if (s.mode === "percentWhole") {
    const model = percentFindWhole.evaluate(null, [s.p, s.part]);
    const stepPercent = s.p % 10 === 0 ? 10 : 1;
    const stepCount = s.p / stepPercent;
    const stepAmount = s.part / stepCount;
    const known = A(`${s.p}% is ${fmtN(s.part)}. The whole is still unknown.`, `${s.p}% es ${fmtN(s.part)}. El entero aún es desconocido.`);
    const step = A(`Scale the known part to ${stepPercent}%: ${fmtN(s.part)} ÷ ${fmtN(stepCount)} = ${fmtN(stepAmount)}. Then count equal steps to 100%.`, `Escala la parte conocida al ${stepPercent}%: ${fmtN(s.part)} ÷ ${fmtN(stepCount)} = ${fmtN(stepAmount)}. Luego cuenta los pasos iguales hasta 100%.`);
    const alt = A(`Double number line and hundred grid matching ${s.p}% with ${fmtN(s.part)} and leaving 100% as the unknown whole.`, `Recta numérica doble y cuadrícula de cien que emparejan ${s.p}% con ${fmtN(s.part)} y dejan el 100% como el entero desconocido.`);
    const line = (showStep) => {
      const left = 70, width = 450, percentX = (v) => left + width * v / 100;
      let body = `<line x1="${left}" y1="82" x2="${left + width}" y2="82" stroke="${COLORS.ink}" stroke-width="3"/><line x1="${left}" y1="168" x2="${left + width}" y2="168" stroke="${COLORS.ink}" stroke-width="3"/>`;
      body += txt(left, 55, "Percent", { anchor: "start", size: 14, fill: COLORS.whole }) + txt(left, 142, "Amount", { anchor: "start", size: 14, fill: COLORS.hundreds });
      const tickValues = [...new Set([...Array.from({ length: 11 }, (_, i) => i * 10), s.p, ...(showStep ? [stepPercent] : [])])].sort((a, b) => a - b);
      for (const pct of tickValues) {
        const x = percentX(pct);
        body += `<line x1="${x}" y1="75" x2="${x}" y2="89" stroke="${COLORS.ink}"/><line x1="${x}" y1="161" x2="${x}" y2="175" stroke="${COLORS.ink}"/>`;
        if (pct === 0 || pct === s.p || pct === 100 || (showStep && pct === stepPercent)) body += txt(x, 108, `${pct}%`, { size: 13, fill: pct === s.p ? COLORS.part : COLORS.whole }) + txt(x, 195, pct === 0 ? "0" : pct === s.p ? fmtN(s.part) : pct === stepPercent ? fmtN(stepAmount) : "?", { size: 14, fill: pct === s.p ? COLORS.part : COLORS.hundreds });
      }
      body += `<line x1="${percentX(s.p)}" y1="82" x2="${percentX(s.p)}" y2="168" stroke="${COLORS.part}" stroke-width="4"/>`;
      if (showStep && s.p !== stepPercent) body += `<line x1="${percentX(stepPercent)}" y1="82" x2="${percentX(stepPercent)}" y2="168" stroke="${COLORS.warn}" stroke-width="3" stroke-dasharray="6 5"/>`;
      body += txt(295, 236, showStep ? `${stepPercent}% = ${fmtN(stepAmount)}; 100% = ?` : `${s.p}% = ${fmtN(s.part)}; 100% = ?`, { size: 19, fill: COLORS.ink });
      return body;
    };
    const finalBody = percentFindWhole.visual([s.p, s.part], model);
    return [
      frameOf({ id: "known", cap: known, easy: A("Match the known part to its percent.", "Empareja la parte conocida con su porcentaje."), eq: `${s.p}% = ${fmtN(s.part)}; 100% = ?`, body: line(false), alt, meta: { p: s.p, part: s.part }, h: 280 }),
      frameOf({ id: "unit", cap: step, easy: A(`Find ${stepPercent}% first.`, `Halla primero el ${stepPercent}%.`), eq: `${stepPercent}% = ${fmtN(stepAmount)}; 100% = ?`, body: line(true), alt: A(`${s.p}% is ${fmtN(s.part)}; ${stepPercent}% is ${fmtN(stepAmount)}; 100% is still the unknown.`, `${s.p}% es ${fmtN(s.part)}; ${stepPercent}% es ${fmtN(stepAmount)}; 100% sigue siendo desconocido.`), meta: { stepPercent, stepAmount, stepCount }, h: 280 }),
      frameOf({ id: "whole", cap: A(`Scale ${stepPercent}% up to 100%: ${fmtN(stepAmount)} × ${fmtN(100 / stepPercent)} = ${fmtN(s.whole)}. The whole is ${fmtN(s.whole)}.`, `Escala del ${stepPercent}% al 100%: ${fmtN(stepAmount)} × ${fmtN(100 / stepPercent)} = ${fmtN(s.whole)}. El entero es ${fmtN(s.whole)}.`), easy: A(`The whole is ${fmtN(s.whole)}.`, `El entero es ${fmtN(s.whole)}.`), eq: `${fmtN(s.part)} ÷ ${fmtN(s.p / 100)} = ${fmtN(s.whole)}`, body: finalBody, alt: A(`Percent tape, double number line, and hundred grid show that ${fmtN(s.part)} is ${s.p}% of ${fmtN(s.whole)}.`, `Cinta de porcentaje, recta numérica doble y cuadrícula de cien muestran que ${fmtN(s.part)} es el ${s.p}% de ${fmtN(s.whole)}.`), meta: { p: s.p, part: s.part, whole: s.whole }, w: 600, h: 370 }),
    ];
  }
  if (s.mode === "system") {
    const lines = (n) => txt(280, 50, `x + y = ${sg(s.s)}`, { size: 26 }) + txt(280, 90, `x − y = ${sg(s.d)}`, { size: 26 }) + (n >= 1 ? `<line x1="150" x2="410" y1="104" y2="104" stroke="${COLORS.ink}" stroke-width="3"/>` + txt(280, 140, `2x = ${sg(s.s + s.d)}`, { size: 26, fill: COLORS.whole }) : "") + (n >= 2 ? txt(280, 186, `x = ${sg(s.x)}`, { size: 30, fill: COLORS.part }) : "");
    const alt = A("Two equations added together.", "Dos ecuaciones sumadas.");
    return [
      frameOf({ id: "two", cap: A("Two equations share x and y. We want x.", "Dos ecuaciones comparten x e y. Queremos x."), easy: A("Find x.", "Halla x."), eq: `x + y = ${sg(s.s)},  x − y = ${sg(s.d)}`, body: lines(0), alt, meta: { s: s.s, d: s.d }, h: 220 }),
      frameOf({ id: "add", cap: A(`Add the equations. +y and −y cancel, leaving 2x = ${sg(s.s)} + ${sg(s.d)} = ${sg(s.s + s.d)}.`, `Suma las ecuaciones. +y y −y se cancelan: 2x = ${sg(s.s)} + ${sg(s.d)} = ${sg(s.s + s.d)}.`), easy: A(`2x = ${sg(s.s + s.d)}.`, `2x = ${sg(s.s + s.d)}.`), eq: `2x = ${sg(s.s + s.d)}`, body: lines(1), alt, meta: { sum: s.s + s.d }, h: 220 }),
      frameOf({ id: "half", cap: A(`Divide both sides by 2: x = ${sg(s.s + s.d)} ÷ 2 = ${sg(s.x)}.`, `Divide ambos lados entre 2: x = ${sg(s.s + s.d)} ÷ 2 = ${sg(s.x)}.`), easy: A(`x = ${sg(s.x)}.`, `x = ${sg(s.x)}.`), eq: `x = ${sg(s.x)}`, body: lines(2), alt, meta: { sum: s.s + s.d, x: s.x, y: s.y, s: s.s, d: s.d }, h: 220 }),
    ];
  }
  if (s.mode === "ineq") {
    const lo = Math.min(s.v, s.n) - 6;
    const hi = Math.max(s.v, s.n) + 6;
    const right = s.op === ">" || s.op === "≥";
    const closed = s.op === "≤" || s.op === "≥";
    const draw = (testing) => numberLine(lo, hi, [(X) => `<rect x="${right ? X(s.n) : X(lo)}" y="100" width="${right ? X(hi) - X(s.n) : X(s.n) - X(lo)}" height="20" fill="${COLORS.part}" fill-opacity=".35"/><circle cx="${X(s.n)}" cy="110" r="9" fill="${closed ? COLORS.part : "#fff"}" stroke="${COLORS.ink}" stroke-width="3"/>`, (X) => (testing ? `<circle cx="${X(s.v)}" cy="110" r="8" fill="${COLORS.warn}" stroke="#fff" stroke-width="2"/>${txt(X(s.v), 84, String(sg(s.v)), { size: 18, fill: COLORS.warn })}` : "")]);
    const alt = A(`Number line for x ${s.op} ${s.n}.`, `Recta numérica para x ${s.op} ${s.n}.`);
    const inside = s.result === "yes";
    return [
      frameOf({ id: "graph", cap: A(`x ${s.op} ${sg(s.n)} means every number ${right ? "greater" : "less"} than ${sg(s.n)}${closed ? ", and " + sg(s.n) + " itself" : ""}. The circle is ${closed ? "filled: included" : "open: not included"}.`, `x ${s.op} ${sg(s.n)} significa todos los números ${right ? "mayores" : "menores"} que ${sg(s.n)}${closed ? ", y también " + sg(s.n) : ""}. El círculo está ${closed ? "lleno: se incluye" : "vacío: no se incluye"}.`), easy: A("The shaded part is solutions.", "La parte sombreada son soluciones."), eq: `x ${s.op} ${sg(s.n)}`, body: draw(false), alt, meta: { n: s.n }, h: 190 }),
      frameOf({ id: "test", cap: A(`Place ${sg(s.v)} on the line. It is ${inside ? "in" : "not in"} the shaded part, so ${sg(s.v)} ${s.op} ${sg(s.n)} is ${inside ? "true" : "false"}.`, `Ubica ${sg(s.v)} en la recta. ${inside ? "Está" : "No está"} en la parte sombreada, así que ${sg(s.v)} ${s.op} ${sg(s.n)} es ${inside ? "verdadero" : "falso"}.`), easy: A(inside ? "Yes, it is a solution." : "No, it is not.", inside ? "Sí, es solución." : "No, no es solución."), eq: `${sg(s.v)} ${s.op} ${sg(s.n)}  →  ${s.result}`, body: draw(true), alt, meta: { v: s.v, n: s.n, op: s.op, result: s.result }, h: 190 }),
    ];
  }
  if (s.mode === "pct") {
    const alt = A(`A bar for ${s.n} with ${s.p}% marked.`, `Una barra para ${s.n} con ${s.p}% marcado.`);
    const body = (stage) => {
      const w = 440;
      const cw = Math.min(w, (w * s.p) / 100);
      let out = `<rect x="60" y="60" width="${w}" height="52" rx="6" fill="${COLORS.whole}" fill-opacity=".85"/>` + txt(280, 92, `${s.n} = 100%`, { size: 20, fill: "#fff" });
      if (stage >= 1) out += `<rect x="${s.up ? 60 + w : 60 + w - cw}" y="${s.up ? 60 : 120}" width="${cw}" height="40" rx="6" fill="${s.up ? COLORS.part : COLORS.warn}" fill-opacity=".9"/>` + txt(s.up ? 60 + w + cw / 2 : 60 + w - cw / 2, s.up ? 86 : 146, fmtN(s.change), { size: 18, fill: "#fff" });
      if (stage >= 2) out += txt(280, 196, `${s.n} ${s.up ? "+" : "−"} ${fmtN(s.change)} = ${fmtN(s.result)}`, { size: 26 });
      return out;
    };
    return [
      frameOf({ id: "whole", cap: A(`${s.n} is the whole, 100%.`, `${s.n} es el entero, 100%.`), easy: A(`${s.n} is 100%.`, `${s.n} es 100%.`), eq: `${s.n} ${s.up ? "+" : "−"} ${s.p}%`, body: body(0), alt, meta: { n: s.n }, h: 220 }),
      frameOf({ id: "change", cap: A(`${s.p}% of ${s.n} is ${s.n} × ${s.p}/100 = ${fmtN(s.change)}. That is the amount of the ${s.up ? "increase" : "decrease"}.`, `${s.p}% de ${s.n} es ${s.n} × ${s.p}/100 = ${fmtN(s.change)}. Esa es la cantidad del ${s.up ? "aumento" : "descuento"}.`), easy: A(`${s.p}% is ${fmtN(s.change)}.`, `${s.p}% es ${fmtN(s.change)}.`), eq: `${s.p}% of ${s.n} = ${fmtN(s.change)}`, body: body(1), alt, meta: { n: s.n, p: s.p, change: s.change }, h: 220 }),
      frameOf({ id: "result", cap: A(`${s.up ? "Add" : "Take away"} the change: ${s.n} ${s.up ? "+" : "−"} ${fmtN(s.change)} = ${fmtN(s.result)}.`, `${s.up ? "Suma" : "Resta"} el cambio: ${s.n} ${s.up ? "+" : "−"} ${fmtN(s.change)} = ${fmtN(s.result)}.`), easy: A(`${fmtN(s.result)}.`, `${fmtN(s.result)}.`), eq: `${s.n} ${s.up ? "+" : "−"} ${fmtN(s.change)} = ${fmtN(s.result)}`, body: body(2), alt, meta: { n: s.n, p: s.p, change: s.change, up: s.up, result: s.result }, h: 220 }),
    ];
  }
  if (["median", "mean", "mad", "iqr"].includes(s.mode)) {
    const tiles = (list, hi = -1) => {
      const w = Math.min(60, 520 / list.length);
      let out = "";
      list.forEach((v, i) => (out += `<rect x="${280 - (w * list.length) / 2 + i * w + 3}" y="${60}" width="${w - 6}" height="48" rx="8" fill="${i === hi ? COLORS.part : "#f8fafc"}" stroke="${i === hi ? COLORS.part : COLORS.rule}" stroke-width="2"/>` + txt(280 - (w * list.length) / 2 + i * w + w / 2, 92, fmtN(v), { size: 20, fill: i === hi ? "#fff" : COLORS.ink })));
      return out;
    };
    const alt = A(`The numbers ${s.list.join(", ")}.`, `Los números ${s.list.join(", ")}.`);
    if (s.mode === "mad") {
      const min = Math.min(...s.list);
      const max = Math.max(...s.list);
      const span = max - min || 1;
      const x = (value) => 72 + ((value - min) / span) * 416;
      const plot = (showMean = false, showDistances = false) => {
        let body = '<line x1="68" y1="82" x2="492" y2="82" stroke="' + COLORS.ink + '" stroke-width="2"/>';
        const counts = new Map();
        for (const value of [...s.list].sort((a, b) => a - b)) {
          const stack = counts.get(value) || 0;
          counts.set(value, stack + 1);
          body += '<circle cx="' + x(value) + '" cy="' + (72 - stack * 22) + '" r="8" fill="' + COLORS.part + '" stroke="white" stroke-width="2"/>';
        }
        for (const [value] of counts) {
          body += '<line x1="' + x(value) + '" y1="78" x2="' + x(value) + '" y2="87" stroke="' + COLORS.ink + '"/>';
          body += txt(x(value), 105, fmtN(value), { size: 13 });
        }
        if (showMean) {
          body += '<line x1="' + x(s.mean) + '" y1="26" x2="' + x(s.mean) + '" y2="92" stroke="' + COLORS.warn + '" stroke-width="3" stroke-dasharray="5 4"/>';
          body += txt(x(s.mean), 20, "mean " + fmtN(s.mean), { size: 14, fill: COLORS.warn });
        }
        if (showDistances) {
          s.list.forEach((value, i) => {
            const y = 130 + i * 19;
            body += '<line x1="' + x(s.mean) + '" y1="' + y + '" x2="' + x(value) + '" y2="' + y + '" stroke="' + COLORS.part + '" stroke-width="3"/>';
            body += '<circle cx="' + x(s.mean) + '" cy="' + y + '" r="3" fill="' + COLORS.warn + '"/><circle cx="' + x(value) + '" cy="' + y + '" r="3" fill="' + COLORS.part + '"/>';
            body += txt(28, y + 5, "d" + (i + 1), { anchor: "start", size: 11, fill: COLORS.mute });
            body += txt(520, y + 5, fmtN(s.distances[i]), { anchor: "end", size: 13 });
          });
        }
        return body;
      };
      const madAlt = A("A dot plot with the mean marked and each absolute distance shown.", "Una gráfica de puntos con la media marcada y cada distancia absoluta visible.");
      const distanceTotal = s.distances.reduce((a, b) => a + b, 0);
      return [
        frameOf({ id: "data", cap: A("Each dot is one value. The mean is the balance point.", "Cada punto representa un valor. La media es el punto de equilibrio."), easy: A("Each dot is one value.", "Cada punto es un valor."), eq: s.list.join(", "), body: plot(), alt: madAlt, meta: { values: s.list }, h: 140 }),
        frameOf({ id: "center", cap: A("Find the mean first. MAD measures each value's distance from this center.", "Halla primero la media. La DMA mide la distancia de cada valor desde este centro."), easy: A("Mark the mean.", "Marca la media."), eq: "mean = " + fmtN(s.mean), body: plot(true), alt: madAlt, meta: { mean: s.mean }, h: 140 }),
        frameOf({ id: "distances", cap: A("Use absolute distances. Values on either side of the mean count as positive distances.", "Usa distancias absolutas. Los valores a cada lado de la media cuentan como distancias positivas."), easy: A("Count each distance.", "Cuenta cada distancia."), eq: s.distances.map(fmtN).join(", "), body: plot(true, true), alt: madAlt, meta: { distances: s.distances }, h: 340 }),
        frameOf({ id: "mad", cap: A("Average the distances: " + fmtN(distanceTotal) + " ÷ " + s.list.length + " = " + fmtN(s.mad) + ".", "Promedia las distancias: " + fmtN(distanceTotal) + " ÷ " + s.list.length + " = " + fmtN(s.mad) + "."), easy: A("MAD = " + fmtN(s.mad) + ".", "DMA = " + fmtN(s.mad) + "."), eq: "MAD = " + fmtN(distanceTotal) + " ÷ " + s.list.length + " = " + fmtN(s.mad), body: plot(true, true), alt: madAlt, meta: { totalDistance: distanceTotal, n: s.list.length, mad: s.mad }, h: 340 }),
      ];
    }
    if (s.mode === "iqr") {
      const n = s.sorted.length;
      const half = Math.floor(n / 2);
      const lower = s.sorted.slice(0, half);
      const upper = s.sorted.slice(n - half);
      const grouped = s.sorted.map((value, i) => {
        const fill = i < half ? COLORS.part : i >= n - half ? COLORS.whole : COLORS.warn;
        const w = Math.min(48, 500 / n);
        const cx = 280 - (w * n) / 2 + i * w + w / 2;
        return '<rect x="' + (cx - w / 2 + 2) + '" y="68" width="' + (w - 4) + '" height="44" rx="6" fill="' + fill + '" opacity=".88"/>' + txt(cx, 96, fmtN(value), { size: 16, fill: "#fff" });
      }).join("");
      const min = s.min;
      const max = s.max;
      const span = max - min || 1;
      const x = (value) => 72 + ((value - min) / span) * 416;
      let box = '<line x1="' + x(min) + '" y1="90" x2="' + x(max) + '" y2="90" stroke="' + COLORS.ink + '" stroke-width="3"/>';
      box += '<line x1="' + x(min) + '" y1="78" x2="' + x(min) + '" y2="102" stroke="' + COLORS.ink + '" stroke-width="3"/>';
      box += '<line x1="' + x(max) + '" y1="78" x2="' + x(max) + '" y2="102" stroke="' + COLORS.ink + '" stroke-width="3"/>';
      box += '<rect x="' + x(s.q1) + '" y="68" width="' + Math.max(1, x(s.q3) - x(s.q1)) + '" height="44" fill="' + COLORS.part + '" fill-opacity=".25" stroke="' + COLORS.part + '" stroke-width="3"/>';
      box += '<line x1="' + x(s.median) + '" y1="68" x2="' + x(s.median) + '" y2="112" stroke="' + COLORS.warn + '" stroke-width="3"/>';
      for (const [value, label] of [[min, "min"], [s.q1, "Q1"], [s.median, "median"], [s.q3, "Q3"], [max, "max"]]) {
        box += txt(x(value), 140, label + " " + fmtN(value), { size: 12, fill: label === "Q1" || label === "Q3" ? COLORS.part : COLORS.ink });
      }
      const iqrAlt = A("Ordered values split into lower and upper halves, then shown on a five-number box plot.", "Valores ordenados en mitades inferior y superior, luego representados en un diagrama de caja de cinco números.");
      return [
        frameOf({ id: "ordered", cap: A("Order the values. With an odd count, leave the overall median out of both halves.", "Ordena los valores. Si la cantidad es impar, deja la mediana general fuera de ambas mitades."), easy: A("Order, then split the halves.", "Ordena y separa las mitades."), eq: s.sorted.join(", "), body: grouped, alt: iqrAlt, meta: { sorted: s.sorted, lower, upper }, h: 160 }),
        frameOf({ id: "quartiles", cap: A("Q1 is the median of the lower half (" + lower.join(", ") + "); Q3 is the median of the upper half (" + upper.join(", ") + ").", "Q1 es la mediana de la mitad inferior (" + lower.join(", ") + "); Q3 es la mediana de la mitad superior (" + upper.join(", ") + ")."), easy: A("Q1 = " + fmtN(s.q1) + "; Q3 = " + fmtN(s.q3) + ".", "Q1 = " + fmtN(s.q1) + "; Q3 = " + fmtN(s.q3) + "."), eq: "Q1 = " + fmtN(s.q1) + ", Q3 = " + fmtN(s.q3), body: grouped, alt: iqrAlt, meta: { q1: s.q1, q3: s.q3, median: s.median }, h: 160 }),
        frameOf({ id: "iqr", cap: A("The box spans the middle half. Q3 − Q1 = " + fmtN(s.q3) + " − " + fmtN(s.q1) + " = " + fmtN(s.result) + ".", "La caja muestra la mitad central. Q3 − Q1 = " + fmtN(s.q3) + " − " + fmtN(s.q1) + " = " + fmtN(s.result) + "."), easy: A("IQR = " + fmtN(s.result) + ".", "RIC = " + fmtN(s.result) + "."), eq: "IQR = Q3 − Q1 = " + fmtN(s.result), body: box, alt: iqrAlt, meta: { min, q1: s.q1, median: s.median, q3: s.q3, max, iqr: s.result }, h: 170 }),
      ];
    }
    if (s.mode === "median") {
      const n = s.sorted.length;
      const mid = n % 2 ? Math.floor(n / 2) : -1;
      return [
        frameOf({ id: "list", cap: A(`The median is the middle number once the numbers are in order.`, `La mediana es el número del medio cuando los números están en orden.`), easy: A("Put them in order.", "Ponlos en orden."), eq: s.list.join(", "), body: tiles(s.list), alt, meta: { n }, h: 150 }),
        frameOf({ id: "sorted", cap: A(`In order: ${s.sorted.join(", ")}.`, `En orden: ${s.sorted.join(", ")}.`), easy: A("Now in order.", "Ahora en orden."), eq: s.sorted.join(", "), body: tiles(s.sorted), alt, meta: { sorted: s.sorted }, h: 150 }),
        frameOf({ id: "median", cap: n % 2 ? A(`The middle number is ${fmtN(s.median)}.`, `El número del medio es ${fmtN(s.median)}.`) : A(`Two numbers share the middle, so the median is halfway between them: ${fmtN(s.median)}.`, `Dos números comparten el medio, así que la mediana está a mitad de camino entre ellos: ${fmtN(s.median)}.`), easy: A(`Median: ${fmtN(s.median)}.`, `Mediana: ${fmtN(s.median)}.`), eq: `median = ${fmtN(s.median)}`, body: tiles(s.sorted, mid), alt, meta: { sorted: s.sorted, median: s.median }, h: 150 }),
      ];
    }
    const sum = s.list.reduce((a, b) => a + b, 0);
    return [
      frameOf({ id: "list", cap: A(`The mean is the fair share: add the numbers, then split the total evenly.`, `La media es el reparto justo: suma los números y reparte el total en partes iguales.`), easy: A("Add, then share.", "Suma y reparte."), eq: s.list.join(", "), body: tiles(s.list), alt, meta: { n: s.list.length }, h: 150 }),
      frameOf({ id: "sum", cap: A(`Add them: ${s.list.join(" + ")} = ${fmtN(sum)}.`, `Súmalos: ${s.list.join(" + ")} = ${fmtN(sum)}.`), easy: A(`Total ${fmtN(sum)}.`, `Total ${fmtN(sum)}.`), eq: `${s.list.join(" + ")} = ${fmtN(sum)}`, body: tiles(s.list), alt, meta: { sum }, h: 150 }),
      frameOf({ id: "share", cap: A(`Share ${fmtN(sum)} among ${s.list.length} numbers: ${fmtN(sum)} ÷ ${s.list.length} = ${fmtN(s.mean)}.`, `Reparte ${fmtN(sum)} entre ${s.list.length} números: ${fmtN(sum)} ÷ ${s.list.length} = ${fmtN(s.mean)}.`), easy: A(`Mean: ${fmtN(s.mean)}.`, `Media: ${fmtN(s.mean)}.`), eq: `${fmtN(sum)} ÷ ${s.list.length} = ${fmtN(s.mean)}`, body: tiles(s.list), alt, meta: { sum, n: s.list.length, mean: s.mean }, h: 150 }),
    ];
  }
  if (s.mode === "prob") {
    const w = 460 / s.t;
    const body = (stage) => {
      let out = "";
      for (let i = 0; i < s.t; i += 1) out += `<rect x="${50 + i * w}" y="70" width="${w - 3}" height="56" rx="4" fill="${stage >= 1 && i < s.n ? COLORS.part : "#fff"}" fill-opacity=".9" stroke="${COLORS.ink}" stroke-width="2"/>`;
      if (stage >= 1) out += txt(280, 170, `${s.n} winning of ${s.t}`, { size: 20 });
      if (stage >= 2) out += txt(280, 210, `P(win) = ${s.n}/${s.t}`, { size: 28, fill: COLORS.whole });
      return out;
    };
    const alt = A(`${s.t} equal sections, ${s.n} winning.`, `${s.t} secciones iguales, ${s.n} ganadoras.`);
    return [
      frameOf({ id: "all", cap: A(`The spinner has ${s.t} equal sections. Each is equally likely.`, `La ruleta tiene ${s.t} secciones iguales. Cada una es igual de probable.`), easy: A(`${s.t} equal sections.`, `${s.t} secciones iguales.`), eq: "P(win) = ?", body: body(0), alt, meta: { t: s.t }, h: 240 }),
      frameOf({ id: "win", cap: A(`${s.n} of them are winning sections.`, `${s.n} de ellas son ganadoras.`), easy: A(`${s.n} win.`, `${s.n} ganan.`), eq: "P(win) = ?", body: body(1), alt, meta: { t: s.t, n: s.n }, h: 240 }),
      frameOf({ id: "prob", cap: A(`Probability is winning sections over all sections: ${s.n}/${s.t}${s.result !== `${s.n}/${s.t}` ? ` = ${s.result}` : ""}.`, `La probabilidad es secciones ganadoras entre todas las secciones: ${s.n}/${s.t}${s.result !== `${s.n}/${s.t}` ? ` = ${s.result}` : ""}.`), easy: A(`${s.result}.`, `${s.result}.`), eq: `P(win) = ${s.n}/${s.t}`, body: body(2), alt, meta: { t: s.t, n: s.n, result: s.result }, h: 240 }),
    ];
  }
  if (s.mode === "hist") {
    const maxCount = Math.max(1, ...s.bins.map((bin) => bin.count));
    const barW = Math.min(62, 400 / s.bins.length);
    const body = s.bins.map((bin, i) => {
      const x = 80 + i * barW;
      const height = (bin.count / maxCount) * 108;
      const fill = i === s.target ? COLORS.part : COLORS.whole;
      return '<rect x="' + x + '" y="' + (170 - height) + '" width="' + (barW - 4) + '" height="' + height + '" fill="' + fill + '" fill-opacity=".85"/>' + txt(x + (barW - 4) / 2, 162 - height, String(bin.count), { size: 15 }) + txt(x + (barW - 4) / 2, 194, bin.lo + "–" + bin.hi, { size: 11 });
    }).join("");
    const axes = '<line x1="72" y1="170" x2="500" y2="170" stroke="' + COLORS.ink + '" stroke-width="2"/>' + txt(42, 48, "Count", { size: 12, fill: COLORS.mute });
    const target = s.bins[s.target];
    const alt = A("A histogram groups individual data values into equal-width intervals; the highlighted bar counts values in the target interval.", "Un histograma agrupa valores individuales en intervalos de igual anchura; la barra resaltada cuenta los valores del intervalo indicado.");
    return [
      frameOf({ id: "histogram", cap: A("Each bar counts values in one interval. The interval width is " + s.width + ".", "Cada barra cuenta valores en un intervalo. La anchura del intervalo es " + s.width + "."), easy: A("Read the interval labels.", "Lee las etiquetas de los intervalos."), eq: "interval width = " + s.width, body: axes + body, alt, meta: { bins: s.bins }, h: 220 }),
      frameOf({ id: "target-bin", cap: A("The interval " + target.lo + "–" + target.hi + " contains " + target.count + " values.", "El intervalo " + target.lo + "–" + target.hi + " contiene " + target.count + " valores."), easy: A("Count values in this bin.", "Cuenta los valores en esta barra."), eq: target.lo + "–" + target.hi + " → " + target.count, body: axes + body, alt, meta: { target: target.lo + "–" + target.hi, count: target.count }, h: 220 }),
    ];
  }
  if (s.mode === "freq") {
    const rows = s.rows.map(([label, count], i) => {
      const y = 72 + i * 32;
      return '<rect x="84" y="' + (y - 22) + '" width="392" height="28" rx="4" fill="' + (i % 2 ? "#f8fafc" : "#fff") + '" stroke="' + COLORS.rule + '"/>' + txt(100, y, label, { anchor: "start", size: 16 }) + txt(454, y, String(count), { anchor: "end", size: 16, fill: COLORS.part });
    }).join("");
    const total = s.rows.reduce((sum, row) => sum + row[1], 0);
    const alt = A("Each table row is a frequency. Add the row counts to find the number of students asked.", "Cada fila de la tabla es una frecuencia. Suma los conteos para hallar cuántos estudiantes respondieron.");
    return [
      frameOf({ id: "table", cap: A("A frequency is the number of students in one category.", "Una frecuencia es el número de estudiantes en una categoría."), easy: A("Each row is one group.", "Cada fila es un grupo."), eq: s.rows.map((row) => row.join(": ")).join("; "), body: txt(100, 38, "Category", { anchor: "start", size: 14, fill: COLORS.mute }) + txt(454, 38, "Students", { anchor: "end", size: 14, fill: COLORS.mute }) + rows, alt, meta: { rows: s.rows }, h: 72 + s.rows.length * 32 }),
      frameOf({ id: "total", cap: A("Add every category: " + s.rows.map((row) => row[1]).join(" + ") + " = " + total + " students.", "Suma todas las categorías: " + s.rows.map((row) => row[1]).join(" + ") + " = " + total + " estudiantes."), easy: A("Add the frequencies.", "Suma las frecuencias."), eq: "total = " + total, body: txt(280, 84, s.rows.map((row) => row[1]).join(" + "), { size: 22 }) + txt(280, 132, "= " + total + " students", { size: 28, fill: COLORS.part }), alt, meta: { counts: s.rows.map((row) => row[1]), total }, h: 180 }),
    ];
  }
  if (s.mode === "bars") {
    const alt = A("A bar chart.", "Una gráfica de barras.");
    return [
      frameOf({ id: "chart", cap: A("Each bar shows how many votes one fruit got.", "Cada barra muestra cuántos votos tuvo una fruta."), easy: A("A bar for each fruit.", "Una barra por fruta."), eq: s.rows.map((r) => `${r[0]}: ${r[1]}`).join(", "), body: barBody(s.rows), alt, meta: { rows: s.rows }, h: 220 }),
      frameOf({ id: "tallest", cap: A(`The tallest bar is ${s.result}, with the most votes.`, `La barra más alta es ${s.result}, con más votos.`), easy: A(`Most: ${s.result}.`, `Más: ${s.result}.`), eq: `most votes: ${s.result}`, body: barBody(s.rows, s.result), alt, meta: { rows: s.rows, top: s.result }, h: 220 }),
    ];
  }
  if (s.mode === "scatter") {
    const [mx, my] = [Math.max(...s.xs), Math.max(...s.ys)];
    const X = (x) => 80 + (x / (mx + 1)) * 400;
    const Y = (y) => 190 - (y / (my + 1)) * 150;
    const axes = `<line x1="60" y1="190" x2="500" y2="190" stroke="${COLORS.ink}" stroke-width="2"/><line x1="60" y1="190" x2="60" y2="30" stroke="${COLORS.ink}" stroke-width="2"/>`;
    const dots = s.xs.map((x, i) => `<circle cx="${X(x)}" cy="${Y(s.ys[i])}" r="8" fill="${COLORS.whole}"/>`).join("");
    const alt = A("A scatter plot of the pairs.", "Un diagrama de dispersión de los pares.");
    const trend = s.result === "none" ? "" : `<line x1="${X(s.xs[0])}" y1="${Y(s.ys[0])}" x2="${X(s.xs.at(-1))}" y2="${Y(s.ys.at(-1))}" stroke="${COLORS.warn}" stroke-width="3" stroke-dasharray="7 5"/>`;
    return [
      frameOf({ id: "points", cap: A("Plot each pair as a point: x across, y up.", "Marca cada par como un punto: x a lo ancho, y hacia arriba."), easy: A("Plot the pairs.", "Marca los pares."), eq: "(x, y)", body: axes + dots, alt, meta: { n: s.xs.length }, h: 230 }),
      frameOf({ id: "trend", cap: s.result === "none" ? A("The points jump around with no clear direction: no association.", "Los puntos saltan sin dirección clara: sin asociación.") : A(`As x goes up, y goes ${s.result === "positive" ? "up" : "down"}: a ${s.result} association.`, `Al subir x, y ${s.result === "positive" ? "sube" : "baja"}: una asociación ${s.result === "positive" ? "positiva" : "negativa"}.`), easy: A(`Association: ${s.result}.`, `Asociación: ${s.result}.`), eq: s.result, body: axes + trend + dots, alt, meta: { r: s.r, result: s.result }, h: 230 }),
    ];
  }
  return [];
}
function evalAll(tokens) {
  let cur = tokens;
  for (let n = 0; n < 14; n += 1) {
    const s = step(cur);
    if (!s) break;
    cur = s.tokens;
  }
  return cur[0];
}

export const answer = (s) => s.result;

// ----- predictions, hints, slips -----
export function predicts(s) {
  const P = (at, q, r, w, why, er, ew) => [predictOf(at, q, r, w, { right: why[0], wrong: why[1] }, er, ew)];
  if (s.mode === "expr") {
    const lead = s.chain[1];
    if (!lead || s.ltr === s.result) return [];
    return P(1, A("Which step comes first here?", "¿Qué paso va primero aquí?"), A(`${fmtN(lead.a)} ${lead.op === "-" ? "−" : lead.op} ${fmtN(lead.b)}, by the order of operations.`, `${fmtN(lead.a)} ${lead.op === "-" ? "−" : lead.op} ${fmtN(lead.b)}, por el orden de operaciones.`), A("The first two numbers, left to right.", "Los dos primeros números, de izquierda a derecha."), [A("Parentheses first, then × and ÷, then + and −. Reading left to right would give a different value.", "Primero paréntesis, luego × y ÷, luego + y −. Leer de izquierda a derecha daría otro valor."), A("Only equal-ranked operations go left to right. Multiplying and dividing come before adding and subtracting.", "Solo las operaciones del mismo nivel van de izquierda a derecha. Multiplicar y dividir van antes de sumar y restar.")], A("Because the order of operations decides what is done first.", "Porque el orden de operaciones decide qué se hace primero."), A("Because we always start at the left.", "Porque siempre empezamos por la izquierda."));
  }
  if (s.mode === "system") return P(1, A("To find x, which equation move removes y?", "Para hallar x, ¿qué movimiento elimina y?"), A("Add the equations.", "Sumar las ecuaciones."), A("Subtract the equations.", "Restar las ecuaciones."), [A("+y and −y cancel when added, leaving only x.", "+y y −y se cancelan al sumar, y queda solo x."), A("Subtracting cancels x instead and leaves y.", "Restar cancela x y deja y.")], A("Because y has opposite signs in the two equations.", "Porque y tiene signos opuestos en las dos ecuaciones."), A("Because subtracting always removes a letter.", "Porque restar siempre quita una letra."));
  if (s.mode === "percentWhole") return P(1, A(`If ${s.p}% is ${fmtN(s.part)}, what does the whole represent?`, `Si el ${s.p}% es ${fmtN(s.part)}, ¿qué representa el entero?`), A("100% of the amount.", "El 100% de la cantidad."), A("The known part again.", "Otra vez la parte conocida."), [A("The known amount matches only part of the whole; the whole is 100%.", "La cantidad conocida es solo una parte del entero; el entero es el 100%."), A("The known part is not the whole unless it represents 100%.", "La parte conocida no es el entero, a menos que represente el 100%.")], A("Because percent compares a part with a whole.", "Porque el porcentaje compara una parte con un entero."), A("Because the known part is always the whole.", "Porque la parte conocida siempre es el entero."));
  if (s.mode === "ineq") return P(1, A(`Is ${sg(s.n)} itself a solution of x ${s.op} ${sg(s.n)}?`, `¿${sg(s.n)} mismo es solución de x ${s.op} ${sg(s.n)}?`), A(s.op === "≤" || s.op === "≥" ? "Yes: the circle is filled." : "No: the circle is open.", s.op === "≤" || s.op === "≥" ? "Sí: el círculo está lleno." : "No: el círculo está vacío."), A(s.op === "≤" || s.op === "≥" ? "No." : "Yes.", s.op === "≤" || s.op === "≥" ? "No." : "Sí."), [A("The symbol decides: ≤ and ≥ include the boundary, < and > do not.", "El símbolo decide: ≤ y ≥ incluyen el límite; < y > no."), A("Check the symbol: with a line under it the boundary counts, without a line it does not.", "Revisa el símbolo: con una raya debajo el límite cuenta, sin raya no.")], A("Because a filled circle means the boundary number is included.", "Porque un círculo lleno significa que el número del límite se incluye."), A("Because the boundary is never a solution.", "Porque el límite nunca es solución."));
  if (s.mode === "pct") return P(1, A(`What is ${s.p}% of ${s.n}: the number ${s.p}, or ${s.p} out of every 100 of ${s.n}?`, `¿Qué es ${s.p}% de ${s.n}: el número ${s.p}, o ${s.p} de cada 100 de ${s.n}?`), A(`${s.p} out of every 100.`, `${s.p} de cada 100.`), A(`Just ${s.p}.`, `Solo ${s.p}.`), [A("Percent means per hundred, so it is a share of the whole.", "Porcentaje significa por cada cien, así que es una parte del entero."), A(`${s.p}% of a different whole is a different amount, so it is not always ${s.p}.`, `${s.p}% de otro entero es otra cantidad, así que no siempre es ${s.p}.`)], A("Because a percent is a fraction of the whole.", "Porque un porcentaje es una fracción del entero."), A("Because a percent is the number itself.", "Porque un porcentaje es el número mismo."));
  if (s.mode === "median") return P(1, A("Should the numbers be in order before we look for the middle?", "¿Deben estar en orden los números antes de buscar el medio?"), A("Yes: put them in order first.", "Sí: ponlos primero en orden."), A("No: use the middle of the list as given.", "No: usa el medio de la lista como está."), [A("The middle only means something once the numbers are ordered.", "El medio solo significa algo cuando los números están ordenados."), A("The middle of an unordered list can be any number, so sort first.", "El medio de una lista desordenada puede ser cualquier número, así que ordena primero.")], A("Because the median is the middle value of the ordered list.", "Porque la mediana es el valor del medio de la lista ordenada."), A("Because the list is already in the right order.", "Porque la lista ya está en el orden correcto."));
  if (s.mode === "mean") return P(1, A("What do we do with the numbers to find the mean?", "¿Qué hacemos con los números para hallar la media?"), A("Add them, then divide by how many there are.", "Sumarlos y dividir entre cuántos hay."), A("Pick the one in the middle.", "Elegir el del medio."), [A("The mean is the equal share: the total split evenly.", "La media es el reparto igual: el total dividido en partes iguales."), A("That is the median. The mean uses every number.", "Eso es la mediana. La media usa todos los números.")], A("Because the mean spreads the total evenly.", "Porque la media reparte el total por igual."), A("Because the mean is the middle number.", "Porque la media es el número del medio."));
  if (s.mode === "mad") return P(1, A("What values are averaged to find the mean absolute deviation?", "¿Qué valores se promedian para hallar la desviación media absoluta?"), A("The absolute distances from each value to the mean.", "Las distancias absolutas de cada valor a la media."), A("The original data values.", "Los datos originales."), [A("MAD averages how far each value is from the mean.", "La DMA promedia cuánto se aleja cada valor de la media."), A("Averaging the data values gives the mean, not the MAD.", "Promediar los datos da la media, no la DMA.")], A("Because spread measures distances from the center.", "Porque la dispersión mide distancias desde el centro."), A("Because MAD is another name for the mean.", "Porque DMA es otro nombre para la media."));
  if (s.mode === "iqr") return P(1, A("Which two quartiles bound the middle half of the data?", "¿Qué dos cuartiles delimitan la mitad central de los datos?"), A("Q1 and Q3.", "Q1 y Q3."), A("The minimum and maximum.", "El mínimo y el máximo."), [A("The middle half runs from the first quartile to the third quartile.", "La mitad central va del primer cuartil al tercer cuartil."), A("The minimum-to-maximum distance is the range.", "La distancia del mínimo al máximo es el rango.")], A("Because IQR = Q3 − Q1.", "Porque RIC = Q3 − Q1."), A("Because IQR uses every value at the endpoints.", "Porque el RIC usa todos los valores de los extremos."));
  if (s.mode === "hist") return P(1, A("What does the highlighted histogram bar count?", "¿Qué cuenta la barra resaltada del histograma?"), A("Values in the labeled interval.", "Valores dentro del intervalo indicado."), A("Every value in the full data set.", "Todos los valores del conjunto de datos."), [A("A histogram bar counts the values whose numbers fall inside its interval.", "Una barra de histograma cuenta los valores que caen dentro de su intervalo."), A("The entire data set is the sum of all bars, not one bar.", "El conjunto completo es la suma de todas las barras, no una sola.")], A("Because the interval labels tell which values belong to the bar.", "Porque las etiquetas del intervalo indican qué valores pertenecen a la barra."), A("Because one bar includes every interval.", "Porque una barra incluye todos los intervalos."));
  if (s.mode === "freq") return P(1, A("How do we find the total number of students?", "¿Cómo hallamos el total de estudiantes?"), A("Add the frequency in every row.", "Sumar la frecuencia de cada fila."), A("Count the rows in the table.", "Contar las filas de la tabla."), [A("Each row counts one category; add the categories to count everyone.", "Cada fila cuenta una categoría; suma las categorías para contar a todos."), A("Rows name the categories, not the number of students.", "Las filas nombran las categorías, no el número de estudiantes.")], A("Because the categories together include all students asked.", "Porque las categorías juntas incluyen a todos los estudiantes encuestados."), A("Because every category has one student.", "Porque cada categoría tiene un estudiante."));
  if (s.mode === "prob") return P(2, A("Which goes on the bottom of a probability?", "¿Qué va abajo en una probabilidad?"), A("All the possible outcomes.", "Todos los resultados posibles."), A("The sections that lose.", "Las secciones que pierden."), [A("Probability compares the outcomes we want with all the outcomes.", "La probabilidad compara los resultados que queremos con todos los resultados."), A("The bottom counts every section, winners and losers together.", "El denominador cuenta todas las secciones, ganadoras y perdedoras juntas.")], A("Because every section is a possible outcome.", "Porque cada sección es un resultado posible."), A("Because only losing sections count.", "Porque solo cuentan las secciones perdedoras."));
  if (s.mode === "bars") return P(1, A("Which bar tells us the most votes?", "¿Qué barra nos dice cuál tiene más votos?"), A("The tallest bar.", "La barra más alta."), A("The first bar.", "La primera barra."), [A("A taller bar is a bigger count.", "Una barra más alta es un conteo mayor."), A("Order does not matter; height does.", "El orden no importa; la altura sí.")], A("Because bar height shows the count.", "Porque la altura de la barra muestra el conteo."), A("Because the first bar is always biggest.", "Porque la primera barra siempre es la mayor."));
  if (s.mode === "scatter") return P(1, A("As x goes up, what do we look at in the points?", "Al subir x, ¿qué miramos en los puntos?"), A("Whether y goes up, down, or jumps around.", "Si y sube, baja o salta."), A("Only the first point.", "Solo el primer punto."), [A("An association is the overall direction of all the points.", "Una asociación es la dirección general de todos los puntos."), A("One point cannot show a direction.", "Un solo punto no muestra una dirección.")], A("Because the pattern across all the points is the association.", "Porque el patrón de todos los puntos es la asociación."), A("Because one point decides.", "Porque un punto decide."));
  return [];
}
export function hints(s) {
  const list = frames(s);
  const first = list[0];
  const T = {
    expr: [A("Follow the order of operations: parentheses, then × and ÷, then + and −.", "Sigue el orden de operaciones: paréntesis, luego × y ÷, luego + y −."), A("The picture shows the expression before any step.", "El dibujo muestra la expresión antes de cualquier paso."), A("Do one operation at a time, and rewrite the expression after each one.", "Haz una operación a la vez y reescribe la expresión después de cada una.")],
    system: [A("Look at y in the two equations. Can you make it disappear?", "Mira la y en las dos ecuaciones. ¿Puedes hacerla desaparecer?"), A("The two equations are shown together.", "Las dos ecuaciones se muestran juntas."), A("Add or subtract the equations so one letter cancels, then solve for the other.", "Suma o resta las ecuaciones para que una letra se cancele y luego despeja la otra.")],
    ineq: [A("Draw the boundary, and decide whether it is included.", "Dibuja el límite y decide si se incluye."), A("The line shows the solutions.", "La recta muestra las soluciones."), A("Is the number you are testing in the solution part?", "¿El número que pruebas está en la parte de las soluciones?")],
    pct: [A("Find the amount of the change first, then add it or take it away.", "Halla primero la cantidad del cambio y luego súmala o réstala."), A("The bar is the whole, 100%.", "La barra es el entero, 100%."), A("Find that percent of the whole. Then change the whole by that much.", "Halla ese porcentaje del entero. Luego cambia el entero en esa cantidad.")],
    percentWhole: [A("The known amount is a part. Mark its percent and leave 100% unknown.", "La cantidad conocida es una parte. Marca su porcentaje y deja desconocido el 100%."), A("Find an easier percent such as 10% or 1% by splitting the known part equally.", "Halla un porcentaje más sencillo, como 10% o 1%, al dividir la parte conocida en partes iguales."), A("Scale that equal step up to 100%. The amount at 100% is the whole.", "Escala ese paso igual hasta el 100%. La cantidad en el 100% es el entero.")],
    median: [A("Order the numbers first.", "Ordena primero los números."), A("The numbers are shown as given.", "Los números se muestran como están."), A("Cross off one from each end until you reach the middle.", "Tacha uno de cada extremo hasta llegar al medio.")],
    mean: [A("The mean needs the total and how many numbers there are.", "La media necesita el total y cuántos números hay."), A("The numbers are shown.", "Los números se muestran."), A("Add them all, then divide the total by how many there are.", "Súmalos todos y divide el total entre cuántos hay.")],
    mad: [A("Find the mean first.", "Halla primero la media."), A("Measure each value's distance from the mean.", "Mide la distancia de cada valor desde la media."), A("Average the absolute distances, not the original data.", "Promedia las distancias absolutas, no los datos originales.")],
    iqr: [A("Order the data and split it into lower and upper halves.", "Ordena los datos y sepáralos en mitades inferior y superior."), A("Find the median of each half: Q1 and Q3.", "Halla la mediana de cada mitad: Q1 y Q3."), A("Subtract Q1 from Q3.", "Resta Q1 de Q3.")],
    hist: [A("Read the interval on the horizontal axis.", "Lee el intervalo en el eje horizontal."), A("Each bar counts only values in its interval.", "Cada barra cuenta solo los valores de su intervalo."), A("Count the values between both interval endpoints.", "Cuenta los valores entre los dos extremos del intervalo.")],
    freq: [A("Read the frequency at the end of each row.", "Lee la frecuencia al final de cada fila."), A("Every row represents a group of students.", "Cada fila representa un grupo de estudiantes."), A("Add the row counts to find the full total.", "Suma los conteos de las filas para hallar el total.")],
    prob: [A("Probability is outcomes you want over all outcomes.", "La probabilidad es los resultados que quieres entre todos los resultados."), A("The spinner is shown with all its sections.", "La ruleta se muestra con todas sus secciones."), A("Count the winning sections, then count all the sections.", "Cuenta las secciones ganadoras y luego todas las secciones.")],
    bars: [A("Compare the heights of the bars.", "Compara las alturas de las barras."), A("The chart shows a bar for each fruit.", "La gráfica muestra una barra por fruta."), A("Find the tallest bar and read its name.", "Halla la barra más alta y lee su nombre.")],
    scatter: [A("Look at the points from left to right.", "Mira los puntos de izquierda a derecha."), A("The points are plotted for you.", "Los puntos están marcados."), A("As x goes up, does y go up, go down, or jump around?", "Al subir x, ¿y sube, baja o salta?")],
  }[s.mode];
  const safe = s.mode === "bars" || s.mode === "scatter" ? first : first;
  return [{ text: T[0] }, { text: T[1], frame: safe }, { text: T[2], frame: safe }];
}
export function diagnose(s, raw) {
  const v = num(raw);
  const w = String(raw).trim().toLowerCase();
  if (s.mode === "expr" && v !== null && v !== s.result && v === s.ltr) return "leftToRight";
  if (s.mode === "system" && v !== null && v !== s.result) return v === s.y ? "foundY" : v === s.s + s.d ? "forgotHalve" : null;
  if (s.mode === "pct" && v !== null && v !== s.result) return v === (s.up ? s.n + s.p : s.n - s.p) ? "percentAsNumber" : v === s.change ? "gaveChange" : null;
  if (s.mode === "median" && v !== null && v !== s.result) return v === s.list[Math.floor(s.list.length / 2)] ? "didNotSort" : null;
  if (s.mode === "mad" && v !== null && v !== s.result) return v === s.mean ? "meanNotMad" : null;
  if (s.mode === "iqr" && v !== null && v !== s.result) return v === s.max - s.min ? "rangeNotIqr" : null;
  if (s.mode === "hist" && v !== null && v !== s.result) return v === s.values.length ? "countedAllBins" : null;
  if (s.mode === "freq" && v !== null && v !== s.result) return v === Math.max(...s.rows.map((row) => row[1])) ? "usedLargestFrequency" : null;
  if (s.mode === "ineq" && (w === "yes" || w === "no") && w !== s.result) return s.v === s.n ? "boundaryRule" : null;
  if (s.mode === "prob" && s.t > s.n) {
    // The learner may type 6/5 or 1.2; compare by value so either spelling is recognised.
    const text = String(raw).replace(/\s/g, "");
    const [a, b] = text.includes("/") ? text.split("/").map(Number) : [num(text), 1];
    const typed = b ? a / b : null;
    if (typed !== null && Number.isFinite(typed) && Math.abs(typed - s.n / s.t) > 1e-9 && Math.abs(typed - s.n / (s.t - s.n)) < 1e-9) return "oddsNotProbability";
  }
  return null;
}
export const tags = {
  leftToRight: { label: L("Worked left to right instead of by the order of operations", "Trabajó de izquierda a derecha en lugar de por el orden de operaciones"), tip: L("Do parentheses first, then × and ÷, then + and −.", "Haz primero los paréntesis, luego × y ÷, luego + y −.") },
  foundY: { label: L("Found y, not x", "Halló y, no x"), tip: L("The question asks for x. Add the equations so y cancels and x is left.", "La pregunta pide x. Suma las ecuaciones para que y se cancele y quede x.") },
  forgotHalve: { label: L("Stopped at 2x", "Se detuvo en 2x"), tip: L("After adding you have 2x. Divide by 2 to get x.", "Después de sumar tienes 2x. Divide entre 2 para obtener x.") },
  percentAsNumber: { label: L("Added or subtracted the percent as a plain number", "Sumó o restó el porcentaje como número simple"), tip: L("Find the percent of the whole first. 10% of 140 is 14, not 10.", "Halla primero el porcentaje del entero. El 10% de 140 es 14, no 10.") },
  gaveChange: { label: L("Gave only the amount of change", "Dio solo la cantidad del cambio"), tip: L("The question asks for the new amount: add or take away the change.", "La pregunta pide la cantidad nueva: suma o resta el cambio.") },
  didNotSort: { label: L("Took the middle without putting the numbers in order", "Tomó el del medio sin ordenar los números"), tip: L("Put the numbers in order first; then the middle is the median.", "Ordena primero los números; luego el del medio es la mediana.") },
  meanNotMad: { label: L("Reported the mean instead of the mean absolute deviation", "Dio la media en lugar de la desviación media absoluta"), tip: L("MAD is the average of the absolute distances from the mean.", "La DMA es el promedio de las distancias absolutas desde la media.") },
  rangeNotIqr: { label: L("Found the range instead of the interquartile range", "Halló el rango en lugar del rango intercuartil"), tip: L("The range is max − min. The IQR is Q3 − Q1, the middle half.", "El rango es máximo − mínimo. El RIC es Q3 − Q1, la mitad central.") },
  countedAllBins: { label: L("Counted the whole data set instead of one interval", "Contó todo el conjunto en lugar de un intervalo"), tip: L("Use the interval endpoints and count only values that fall in that bin.", "Usa los extremos del intervalo y cuenta solo los valores que caen en esa barra.") },
  usedLargestFrequency: { label: L("Used only the largest frequency", "Usó solo la frecuencia más alta"), tip: L("The table asks for everyone. Add the counts from all rows.", "La tabla pregunta por todos. Suma los conteos de todas las filas.") },
  boundaryRule: { label: L("Misjudged whether the boundary number counts", "Juzgó mal si cuenta el número del límite"), tip: L("≤ and ≥ include the boundary number; < and > do not.", "≤ y ≥ incluyen el número del límite; < y > no.") },
  oddsNotProbability: { label: L("Compared winners to losers instead of to all sections", "Comparó ganadoras con perdedoras en lugar de con todas"), tip: L("The bottom of a probability counts every section, not just the losing ones.", "El denominador de una probabilidad cuenta todas las secciones, no solo las perdedoras.") },
};

// ----- Build -----
const expressionBuild = {
  prompt: () => L("Tap the operation to do next, following the order of operations.", "Toca la operación que sigue, según el orden de operaciones."),
  init: (s) => ({ tokens: s.tokens }),
  render(st, s) {
    const ops = st.tokens.map((t, i) => (isOp(t) ? i : -1)).filter((i) => i >= 0);
    const alt = L(`The expression ${show(st.tokens)}.`, `La expresión ${show(st.tokens)}.`);
    const body = exprBody(st.tokens);
    return { svg: svgWrap(body, alt.en, { h: 140 }), alt, controls: ops.map((i) => ({ id: "op", arg: i, label: L(`${fmtN(st.tokens[i - 1])} ${st.tokens[i] === "-" ? "−" : st.tokens[i]} ${fmtN(st.tokens[i + 1])}`, `${fmtN(st.tokens[i - 1])} ${st.tokens[i] === "-" ? "−" : st.tokens[i]} ${fmtN(st.tokens[i + 1])}`) })), status: st.tokens.length === 1 ? L(`Done: ${fmtN(st.tokens[0])}.`, `Listo: ${fmtN(st.tokens[0])}.`) : null };
  },
  act(st, id, i) {
    const want = nextOp(st.tokens);
    if (i !== want) return { state: st, ok: false, msg: st.tokens.includes("(") ? L("Parentheses come first: work inside them.", "Primero los paréntesis: trabaja dentro de ellos.") : ["×", "÷"].includes(st.tokens[want]) ? L("Multiplication and division come before addition and subtraction.", "La multiplicación y la división van antes de la suma y la resta.") : L("Do equal-ranked operations from left to right.", "Haz las operaciones del mismo nivel de izquierda a derecha."), tag: "wrongOrder" };
    return { state: { tokens: step(st.tokens).tokens }, ok: true };
  },
  done: (st) => st.tokens.length === 1,
};
const BUILDS = {
  expr: expressionBuild,
  system: choiceBuild({ prompt: () => L("Which move removes y?", "¿Qué movimiento elimina y?"), options: () => [{ label: L("Add the equations", "Sumar las ecuaciones"), ok: true }, { label: L("Subtract the equations", "Restar las ecuaciones"), ok: false, msg: L("Subtracting cancels x, not y. Look at the signs of y.", "Restar cancela x, no y. Mira los signos de y.") }], draw: (s, pick) => ({ body: frames(s).at(pick === 0 ? 1 : 0).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("Two equations.", "Dos ecuaciones."), h: 220 }), doneMsg: (s) => L(`Adding gives 2x = ${sg(s.s + s.d)}, so x = ${sg(s.x)}.`, `Sumar da 2x = ${sg(s.s + s.d)}, así que x = ${sg(s.x)}.`) }),
  ineq: choiceBuild({ prompt: (s) => L(`Is ${sg(s.v)} a solution to x ${s.op} ${sg(s.n)}?`, `¿${sg(s.v)} es solución de x ${s.op} ${sg(s.n)}?`), options: (s) => ["yes", "no"].map((w) => ({ label: L(w === "yes" ? "Yes" : "No", w === "yes" ? "Sí" : "No"), ok: w === s.result, msg: L("Put the number on the line. Is it in the shaded part?", "Pon el número en la recta. ¿Está en la parte sombreada?") })), draw: (s, pick) => ({ body: frames(s).at(pick !== null ? 1 : 0).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("A number line.", "Una recta numérica."), h: 190 }), doneMsg: (s) => L(`${sg(s.v)} ${s.result === "yes" ? "is" : "is not"} a solution.`, `${sg(s.v)} ${s.result === "yes" ? "es" : "no es"} solución.`) }),
  median: choiceBuild({ prompt: () => L("Tap the median of the ordered numbers.", "Toca la mediana de los números ordenados."), available: (s) => s.sorted.length % 2 === 1, options: (s) => s.sorted.map((v, i) => ({ label: L(fmtN(v), fmtN(v)), ok: i === Math.floor(s.sorted.length / 2), msg: L("The median has as many numbers below it as above it.", "La mediana tiene tantos números debajo como encima.") })), draw: (s, pick) => ({ body: frames(s).at(pick !== null ? 2 : 1).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("The numbers in order.", "Los números en orden."), h: 150 }), doneMsg: (s) => L(`The median is ${fmtN(s.median)}.`, `La mediana es ${fmtN(s.median)}.`) }),
  prob: choiceBuild({ prompt: () => L("Which fraction is P(win)?", "¿Qué fracción es P(ganar)?"), options: (s) => [{ label: L(`${s.n}/${s.t}`, `${s.n}/${s.t}`), ok: true }, { label: L(`${s.t}/${s.n}`, `${s.t}/${s.n}`), ok: false, msg: L("Probability is winning sections over all sections, not the other way.", "La probabilidad es secciones ganadoras entre todas, no al revés.") }, ...(s.t - s.n > 0 && s.t - s.n !== s.n ? [{ label: L(`${s.n}/${s.t - s.n}`, `${s.n}/${s.t - s.n}`), ok: false, msg: L("The bottom counts all sections, not only the losing ones.", "El denominador cuenta todas las secciones, no solo las perdedoras.") }] : [])], draw: (s, pick) => ({ body: frames(s).at(pick !== null ? 2 : 1).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("A spinner.", "Una ruleta."), h: 240 }), doneMsg: (s) => L(`P(win) = ${s.n}/${s.t}.`, `P(ganar) = ${s.n}/${s.t}.`) }),
  bars: choiceBuild({ prompt: () => L("Tap the fruit with the most votes.", "Toca la fruta con más votos."), options: (s) => s.rows.map(([name]) => ({ label: L(name, name), ok: name === s.result, msg: L("Compare the heights of the bars.", "Compara las alturas de las barras.") })), draw: (s, pick) => ({ body: barBody(s.rows, pick !== null && s.rows[pick][0] === s.result ? s.result : null), alt: L("A bar chart.", "Una gráfica de barras."), h: 220 }), doneMsg: (s) => L(`${s.result} has the tallest bar.`, `${s.result} tiene la barra más alta.`) }),
  scatter: choiceBuild({ prompt: () => L("What association do the points show?", "¿Qué asociación muestran los puntos?"), options: (s) => ["positive", "negative", "none"].map((w) => ({ label: L(w, w === "positive" ? "positiva" : w === "negative" ? "negativa" : "ninguna"), ok: w === s.result, msg: L("Read the points left to right. Does y go up, go down, or jump around?", "Lee los puntos de izquierda a derecha. ¿y sube, baja o salta?") })), draw: (s, pick) => ({ body: frames(s).at(pick !== null ? 1 : 0).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("A scatter plot.", "Un diagrama de dispersión."), h: 230 }), doneMsg: (s) => L(`A ${s.result} association.`, `Asociación ${s.result === "positive" ? "positiva" : s.result === "negative" ? "negativa" : "ninguna"}.`) }),
  pct: choiceBuild({ prompt: (s) => L(`How do we find the ${s.up ? "increase" : "decrease"}?`, `¿Cómo hallamos el ${s.up ? "aumento" : "descuento"}?`), options: (s) => [{ label: L(`Find ${s.p}% of ${s.n}, then ${s.up ? "add" : "subtract"} it`, `Hallar ${s.p}% de ${s.n} y luego ${s.up ? "sumarlo" : "restarlo"}`), ok: true }, { label: L(`${s.up ? "Add" : "Subtract"} ${s.p} to ${s.n}`, `${s.up ? "Sumar" : "Restar"} ${s.p} a ${s.n}`), ok: false, msg: L("A percent is a share of the whole, not a plain number to add.", "Un porcentaje es una parte del entero, no un número simple para sumar.") }], draw: (s, pick) => ({ body: frames(s).at(pick === 0 ? 2 : 0).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("A bar for the whole.", "Una barra para el entero."), h: 220 }), doneMsg: (s) => L(`${s.n} ${s.up ? "+" : "−"} ${fmtN(s.change)} = ${fmtN(s.result)}.`, `${s.n} ${s.up ? "+" : "−"} ${fmtN(s.change)} = ${fmtN(s.result)}.`) }),
  percentWhole: choiceBuild({ prompt: (s) => L(`Which equation finds the whole when ${s.p}% is ${fmtN(s.part)}?`, `¿Qué ecuación halla el entero si el ${s.p}% es ${fmtN(s.part)}?`), options: (s) => [{ label: L(`Whole = ${fmtN(s.part)} ÷ ${fmtN(s.p / 100)}`, `Entero = ${fmtN(s.part)} ÷ ${fmtN(s.p / 100)}`), ok: true }, { label: L(`Whole = ${fmtN(s.part)} × ${fmtN(s.p / 100)}`, `Entero = ${fmtN(s.part)} × ${fmtN(s.p / 100)}`), ok: false, msg: L("That finds the percent of the known part. The known part is already only p% of the whole.", "Eso halla el porcentaje de la parte conocida. La parte conocida ya es solo p% del entero.") }, { label: L(`Whole = ${fmtN(s.part)} × ${s.p}`, `Entero = ${fmtN(s.part)} × ${s.p}`), ok: false, msg: L("Percent means per 100. Use p/100 as the multiplier, then divide to recover the whole.", "Porcentaje significa por cada 100. Usa p/100 como factor y divide para recuperar el entero.") }], draw: (s) => ({ body: frames(s)[0].svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("The known part matched with its percent and an unknown whole.", "La parte conocida emparejada con su porcentaje y un entero desconocido."), h: 280 }), doneMsg: (s) => L(`The whole is ${fmtN(s.whole)}.`, `El entero es ${fmtN(s.whole)}.`) }),
};
BUILDS.mean = choiceBuild({ prompt: () => L("What do we do to find the mean?", "¿Qué hacemos para hallar la media?"), options: () => [{ label: L("Add them, then divide by how many", "Sumarlos y dividir entre cuántos hay"), ok: true }, { label: L("Pick the middle one", "Elegir el del medio"), ok: false, msg: L("That is the median. The mean uses every number.", "Eso es la mediana. La media usa todos los números.") }], draw: (s, pick) => ({ body: frames(s).at(pick === 0 ? 2 : 0).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("The numbers.", "Los números."), h: 150 }), doneMsg: (s) => L(`The mean is ${fmtN(s.mean)}.`, `La media es ${fmtN(s.mean)}.`) });
BUILDS.hist = choiceBuild({
  prompt: (s) => L("How many values fall in interval " + s.bins[s.target].lo + "–" + s.bins[s.target].hi + "?", "¿Cuántos valores caen en el intervalo " + s.bins[s.target].lo + "–" + s.bins[s.target].hi + "?"),
  options: (s) => {
    const count = s.result;
    return [
      { label: L(String(count), String(count)), ok: true },
      { label: L(String(count + 1), String(count + 1)), ok: false, msg: L("Check the bar height for this interval only.", "Revisa la altura de esta barra solamente.") },
      { label: L(String(Math.max(0, count - 1)), String(Math.max(0, count - 1))), ok: false, msg: L("Count every data value inside both interval endpoints.", "Cuenta cada dato entre los dos extremos del intervalo.") },
    ];
  },
  draw: (s, pick) => ({ body: frames(s)[1].svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("Histogram with the target interval highlighted.", "Histograma con el intervalo indicado resaltado."), h: 220 }),
  doneMsg: (s) => L("There are " + s.result + " values in this interval.", "Hay " + s.result + " valores en este intervalo."),
});
BUILDS.freq = choiceBuild({
  prompt: () => L("What should we do with the row frequencies?", "¿Qué hacemos con las frecuencias de las filas?"),
  options: () => [
    { label: L("Add every row count", "Sumar el conteo de cada fila"), ok: true },
    { label: L("Use only the largest row", "Usar solo la fila con más"), ok: false, msg: L("The total includes every category, not just the largest one.", "El total incluye cada categoría, no solo la mayor.") },
    { label: L("Count the category names", "Contar los nombres de las categorías"), ok: false, msg: L("The row count is the number of categories, not the students.", "El número de filas cuenta categorías, no estudiantes.") },
  ],
  draw: (s, pick) => ({ body: frames(s)[pick === 0 ? 1 : 0].svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("A frequency table and the total number of students.", "Tabla de frecuencias y total de estudiantes."), h: 340 }),
  doneMsg: (s) => L("The rows add to " + s.result + " students.", "Las filas suman " + s.result + " estudiantes."),
});
BUILDS.mad = choiceBuild({
  prompt: () => L("What do we average for MAD?", "¿Qué promediamos para hallar la DMA?"),
  options: () => [
    { label: L("Absolute distances from the mean", "Distancias absolutas desde la media"), ok: true },
    { label: L("The original values", "Los valores originales"), ok: false, msg: L("That gives the mean. MAD averages the distances from the mean.", "Eso da la media. La DMA promedia las distancias desde la media.") },
    { label: L("Distances from the median", "Distancias desde la mediana"), ok: false, msg: L("For MAD, measure each value from the mean.", "Para la DMA, mide cada valor desde la media.") },
  ],
  draw: (s, pick) => ({ body: frames(s).at(pick === 0 ? 3 : 1).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("Data values with their absolute distances from the mean.", "Datos con sus distancias absolutas desde la media."), h: 340 }),
  doneMsg: (s) => L("Now average the listed distances to find MAD = " + fmtN(s.mad) + ".", "Ahora promedia las distancias mostradas para hallar DMA = " + fmtN(s.mad) + "."),
});
BUILDS.iqr = choiceBuild({
  prompt: () => L("How do we measure the spread of the middle half?", "¿Cómo medimos la dispersión de la mitad central?"),
  options: () => [
    { label: L("Subtract Q1 from Q3", "Restar Q1 de Q3"), ok: true },
    { label: L("Subtract the minimum from the maximum", "Restar el mínimo del máximo"), ok: false, msg: L("That is the range. IQR only measures the middle half.", "Eso es el rango. El RIC mide solo la mitad central.") },
    { label: L("Add Q1 and Q3", "Sumar Q1 y Q3"), ok: false, msg: L("A spread is a distance between quartiles, so subtract.", "La dispersión es una distancia entre cuartiles, así que resta.") },
  ],
  draw: (s, pick) => ({ body: frames(s).at(pick === 0 ? 2 : 0).svg.replace(/^.*?<svg[^>]*>|<\/svg>$/g, ""), alt: L("A box plot marking Q1 and Q3.", "Diagrama de caja que marca Q1 y Q3."), h: 170 }),
  doneMsg: (s) => L("The middle-half spread is " + fmtN(s.result) + ".", "La dispersión de la mitad central es " + fmtN(s.result) + "."),
});
export const build = {
  available: (s) => Boolean(BUILDS[s.mode]) && (BUILDS[s.mode].available ? BUILDS[s.mode].available(s) : true),
  prompt: (s) => (typeof BUILDS[s.mode].prompt === "function" ? BUILDS[s.mode].prompt(s) : BUILDS[s.mode].prompt),
  init: (s) => BUILDS[s.mode].init(s),
  render: (st, s, x) => BUILDS[s.mode].render(st, s, x),
  act: (st, id, arg, s) => BUILDS[s.mode].act(st, id, arg, s),
  done: (st, s) => BUILDS[s.mode].done(st, s),
};
void keyed;
