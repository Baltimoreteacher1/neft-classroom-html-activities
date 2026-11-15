// growth:weather, growth:fees, growth:table. The input-output table fills row by row while the SAME points plot on a graph, and the rule
// y = a·x + b is shown with the fixed start b (added once, never multiplied) kept apart from the per-step part a·x.
// values = [per-step amount a, starting amount b, input x]; the lab's headline is the output a·x + b.
import { int } from "../exact.mjs";
import { COLOR, COPY_FILLS } from "../tokens.mjs";
import { KF, all, checkPath, crossPath, f1, para, pick, text, whole } from "./equations-kit.mjs";

const KEYS = ["growth:weather", "growth:fees", "growth:table"];
const PAD = 12;
const ROW = 22;

/** Each key's own words: what x and y are, and the per-step part. */
const CTX = {
  "growth:weather": {
    x: { en: ["minutes"], es: ["minutos"] },
    step: { en: ["per", "minute"], es: ["por", "minuto"] },
    start: { en: ["start,", "once"], es: ["inicio,", "una vez"] },
    y: { en: ["liters"], es: ["litros"] },
    names: { en: "x = minutes, y = liters in the tank", es: "x = minutos, y = litros en el tanque" },
    perBox: { en: "per minute", es: "por minuto" },
    startBox: { en: "start", es: "inicio" },
    labels: [
      { label: "Liters added each minute", labelEs: "Litros que entran cada minuto" },
      { label: "Starting liters", labelEs: "Litros al inicio" },
      { label: "Minutes", labelEs: "Minutos" },
    ],
  },
  "growth:fees": {
    x: { en: ["items"], es: ["artículos"] },
    step: { en: ["per", "item"], es: ["por", "artículo"] },
    start: { en: ["fee,", "once"], es: ["tarifa,", "una vez"] },
    y: { en: ["cost", "($)"], es: ["costo", "($)"] },
    names: { en: "x = items, y = cost ($)", es: "x = artículos, y = costo ($)" },
    perBox: { en: "per item", es: "por artículo" },
    startBox: { en: "fee", es: "tarifa" },
    labels: [
      { label: "Cost per item ($)", labelEs: "Costo por artículo ($)" },
      { label: "Starting fee ($)", labelEs: "Tarifa inicial ($)" },
      { label: "Items", labelEs: "Artículos" },
    ],
  },
  "growth:table": {
    x: { en: ["hours"], es: ["horas"] },
    step: { en: ["per", "hour"], es: ["por", "hora"] },
    start: { en: ["start,", "once"], es: ["inicio,", "una vez"] },
    y: { en: ["reading", "(mm)"], es: ["lectura", "(mm)"] },
    names: { en: "x = hours, y = reading (mm)", es: "x = horas, y = lectura (mm)" },
    perBox: { en: "per hour", es: "por hora" },
    startBox: { en: "start", es: "inicio" },
    labels: [
      { label: "Rain each hour (mm)", labelEs: "Lluvia cada hora (mm)" },
      { label: "Starting reading (mm)", labelEs: "Lectura inicial (mm)" },
      { label: "Hours", labelEs: "Horas" },
    ],
  },
};

/** @param {string} key @returns {keyof typeof CTX} */
function ctxKey(key) {
  if (!(key in CTX)) throw new RangeError(`not a growth model: ${key}`);
  return /** @type {keyof typeof CTX} */ (key);
}

/** @param {string} key */
function controls(key) {
  const c = CTX[ctxKey(key)].labels;
  return [
    { ...c[0], min: 1, max: 8, step: 1 },
    { ...c[1], min: 0, max: 12, step: 1 },
    { ...c[2], min: 1, max: 12, step: 1 },
  ];
}

/** @param {string} key @param {number[]} values */
function build(key, values) {
  const ck = ctxKey(key);
  const [a, b, c] = values;
  whole(a, 1, 8, "The amount per step");
  whole(b, 0, 12, "The starting amount");
  whole(c, 1, 12, "The input");
  const A = int(a);
  const B = int(b);
  const out = (/** @type {number} */ x) => A.mul(int(x)).add(B);
  // the table shows every input up to 7, otherwise 0-3, a gap, and the last two
  const xs = c <= 7 ? Array.from({ length: c + 1 }, (_, i) => i) : [0, 1, 2, 3, null, c - 1, c];
  const value = out(c);
  const wrong = (a + b) * c;
  return {
    ck,
    a,
    b,
    c,
    xs,
    rows: xs.map((x) => (x === null ? null : { x, ax: A.mul(int(x)).toString(), y: out(x).toString() })),
    /** the lab's headline: output at the chosen input */
    value: Number(value.n),
    valueText: value.toString(),
    /** (a + b) x c: the fixed amount multiplied as if it were per step; null when it happens to agree */
    wrong: wrong === Number(value.n) ? null : { total: wrong },
    maxY: Number(value.n),
  };
}

/** @typedef {ReturnType<typeof build>} Model */

/** @param {number} n @param {number} maxY */
const niceStep = (maxY) => [1, 2, 5, 10, 20, 50].find((s) => maxY / s <= 6) || 50;

/** Header cell lines: the symbol, then up to two words. */
/** @param {Model} m @param {string} lang */
function columns(m, lang) {
  const k = CTX[m.ck];
  const l = /** @type {"en" | "es"} */ (lang);
  const x = { head: ["x", ...k.x[l]], cell: (/** @type {NonNullable<Model["rows"][number]>} */ r) => String(r.x) };
  const ax = { head: [`${m.a} × x`, ...k.step[l]], cell: (/** @type {NonNullable<Model["rows"][number]>} */ r) => r.ax };
  const st = { head: [`+ ${m.b}`, ...k.start[l]], cell: () => `+ ${m.b}` };
  const y = { head: ["y", ...k.y[l]], cell: (/** @type {NonNullable<Model["rows"][number]>} */ r) => r.y, bold: true };
  const ch = { head: [`+${m.a}`, ...pick(lang, "each|step", "cada|paso").split("|")], cell: () => "" };
  return m.b > 0 ? [x, ax, st, y, ch] : [x, { ...y, head: ["y", ...k.y[l]] }, ch];
}

/** @param {Model} m @param {{ lang: "en" | "es", width: number }} o */
function render(m, { lang, width }) {
  const W = Math.max(300, Math.min(900, Math.round(width)));
  const wide = W >= 520;
  const k = CTX[m.ck];
  const l = /** @type {"en" | "es"} */ (lang);
  const cols = columns(m, lang);
  const tw = wide ? Math.min(340, W * 0.56) : W - 2 * PAD;
  const cwid = tw / cols.length;
  const HEAD = 56;
  let body = text(PAD, 18, k.names[l], { size: 13, anchor: "start", fill: COLOR.muted });
  const ty = 30;
  // ---- table
  let t = `<rect x="${PAD}" y="${ty}" width="${f1(tw)}" height="${HEAD}" rx="4" fill="${COLOR.navy}" fill-opacity="0.1" stroke="${COLOR.ink}" stroke-width="1.2"/>`;
  cols.forEach((c, i) => {
    c.head.forEach((line, j) => {
      t += text(PAD + cwid * (i + 0.5), ty + 17 + j * 15, line, { size: 13, weight: j === 0 ? 700 : 400, fill: j === 0 ? COLOR.ink : COLOR.muted });
    });
  });
  let rowsSvg = "";
  const adjacent = (/** @type {number} */ i) => m.xs[i] !== null && m.xs[i - 1] !== null && m.xs[i - 1] === (m.xs[i] ?? 0) - 1;
  m.rows.forEach((r, i) => {
    const y = ty + HEAD + i * ROW;
    const now = r !== null && r.x === m.c;
    let g = `<rect x="${PAD}" y="${y}" width="${f1(tw)}" height="${ROW}" fill="${now ? COLOR.amber : COLOR.white}" fill-opacity="${now ? 0.45 : 1}" stroke="${COLOR.ink}" stroke-width="${now ? 2.4 : 1}"/>`;
    cols.forEach((c, j) => {
      let s = "…";
      if (r) s = j === cols.length - 1 ? (r.x > 0 && adjacent(i) ? `+${m.a}` : "") : c.cell(r);
      if (j > 0) g += `<line x1="${f1(PAD + cwid * j)}" y1="${y}" x2="${f1(PAD + cwid * j)}" y2="${y + ROW}" stroke="${COLOR.ink}" stroke-opacity="0.35" stroke-width="1"/>`;
      if (s) g += text(PAD + cwid * (j + 0.5), y + 16, s, { size: 14, weight: now || /** @type {{ bold?: boolean }} */ (c).bold ? 700 : 400 });
    });
    rowsSvg += `<g class="eq-row" data-i="${i}">${g}</g>`;
  });
  body += t + rowsSvg;
  const tableBottom = ty + HEAD + m.rows.length * ROW;

  // ---- graph, drawn from the same rows
  const gx = wide ? PAD + tw + 14 : PAD;
  const gw = wide ? W - gx - PAD : W - 2 * PAD;
  const gy = wide ? ty : tableBottom + 18;
  const gh = wide ? Math.max(240, tableBottom - ty) : 200;
  const left = gx + 38;
  const right = gx + gw - 14;
  const top = gy + 22;
  const bot = gy + gh - 40;
  const sx = (/** @type {number} */ x) => left + ((right - left) * x) / m.c;
  const sy = (/** @type {number} */ v) => bot - ((bot - top) * v) / m.maxY;
  let g = text(gx + 2, gy + 12, k.y[l].join(" "), { size: 13, weight: 700, anchor: "start" });
  g += `<line x1="${f1(left)}" y1="${f1(bot)}" x2="${f1(right + 6)}" y2="${f1(bot)}" stroke="${COLOR.ink}" stroke-width="2"/><line x1="${f1(left)}" y1="${f1(bot)}" x2="${f1(left)}" y2="${f1(top - 6)}" stroke="${COLOR.ink}" stroke-width="2"/>`;
  const step = niceStep(m.maxY);
  for (let v = 0; v <= m.maxY; v += step) {
    g += `<line x1="${f1(left - 4)}" y1="${f1(sy(v))}" x2="${f1(left)}" y2="${f1(sy(v))}" stroke="${COLOR.ink}" stroke-width="1.5"/>`;
    if (v === 0 || Math.abs(sy(v) - sy(m.maxY)) >= 14) g += text(left - 7, sy(v) + 5, String(v), { size: 13, anchor: "end", fill: COLOR.muted });
  }
  const xstep = m.c <= 6 ? 1 : 2;
  for (let x = 0; x <= m.c; x++) {
    g += `<line x1="${f1(sx(x))}" y1="${f1(bot)}" x2="${f1(sx(x))}" y2="${f1(bot + 4)}" stroke="${COLOR.ink}" stroke-width="1.2"/>`;
    if ((x % xstep === 0 && m.c - x !== 1) || x === m.c) g += text(sx(x), bot + 19, String(x), { size: 13, fill: COLOR.muted });
  }
  g += text((left + right) / 2, gy + gh - 4, k.x[l].join(" "), { size: 13, weight: 700 });
  const outAt = (/** @type {number} */ x) => m.a * x + m.b;
  g += `<line x1="${f1(sx(0))}" y1="${f1(sy(m.b))}" x2="${f1(sx(m.c))}" y2="${f1(sy(outAt(m.c)))}" stroke="${COLOR.navy}" stroke-width="2"/>`;
  let pts = "";
  m.xs.forEach((x, i) => {
    if (x === null) return;
    const cx = sx(x);
    const cy = sy(outAt(x));
    const now = x === m.c;
    const startPt = x === 0;
    pts += `<g class="eq-pt" data-i="${i}"><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${now ? 7 : 5.5}" fill="${now ? COLOR.amber : startPt ? COLOR.white : COPY_FILLS[0]}" stroke="${COLOR.ink}" stroke-width="${now || startPt ? 2.5 : 1.5}"/></g>`;
  });
  g += pts;
  const endLabel = `(${m.c}, ${m.valueText})`;
  g += text(Math.min(right + 6, sx(m.c) + 4), sy(outAt(m.c)) - 12, endLabel, { size: 13, weight: 700, anchor: "end" });
  if (m.b > 0) {
    const label = pick(lang, `start ${m.b}`, `inicio ${m.b}`);
    // below the start point when there is room, otherwise in the empty top-left corner of the plot
    g += bot - sy(m.b) >= 28 ? text(sx(0) + 12, sy(m.b) + 18, label, { size: 13, weight: 700, anchor: "start" }) : `<circle cx="${f1(left + 14)}" cy="${f1(top + 4)}" r="5.5" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="2.5"/>${text(left + 24, top + 9, `${label} (0, ${m.b})`, { size: 13, weight: 700, anchor: "start" })}`;
  }
  body += `<g class="eq-graph">${g}</g>`;

  // ---- the rule: the per-step part and the start kept apart
  let y = (wide ? Math.max(tableBottom, gy + gh) : gy + gh) + 22;
  const boxW = Math.min(150, (W - 2 * PAD - 70) / 2);
  const total = 46 + (m.b > 0 ? 2 * boxW + 24 : boxW);
  const rx0 = (W - total) / 2;
  let rule = text(rx0 + 20, y + 40, "y =", { size: 20, weight: 700 });
  /** @param {number} x0 @param {string} big @param {string} w1 @param {string} w2 @param {boolean} dashed */
  const box = (x0, big, w1, w2, dashed) => `<rect x="${f1(x0)}" y="${y}" width="${f1(boxW)}" height="78" rx="8" fill="${COLOR.white}" stroke="${dashed ? COLOR.tealInk : COLOR.ink}" stroke-width="2"${dashed ? ' stroke-dasharray="6 4"' : ""}/>${text(x0 + boxW / 2, y + 28, big, { size: 22, weight: 700 })}${text(x0 + boxW / 2, y + 49, w1, { size: 13, weight: 700, fill: COLOR.muted })}${text(x0 + boxW / 2, y + 66, w2, { size: 13, fill: COLOR.muted })}`;
  rule += box(rx0 + 46, `${m.a}x`, k.perBox[l], pick(lang, "grows with x", "crece con x"), false);
  if (m.b > 0) {
    rule += text(rx0 + 46 + boxW + 12, y + 40, "+", { size: 22, weight: 700 });
    rule += box(rx0 + 46 + boxW + 24, String(m.b), k.startBox[l], pick(lang, "added once", "una sola vez"), true);
  }
  body += `<g class="eq-rule">${rule}</g>`;
  y += 78 + 8;
  let noStart = "";
  if (m.b === 0) {
    const p = para(W / 2, y + 12, [pick(lang, "No start amount: the graph begins at (0, 0).", "Sin cantidad inicial: la gráfica empieza en (0, 0).")], { size: 14, maxW: W - 2 * PAD });
    noStart = `<g class="eq-rule">${p.svg}</g>`;
    y = p.y;
  }
  body += noStart;
  y += 12;

  // ---- the answer, then the multiplied-fee mistake
  const bw = Math.min(520, W - 2 * PAD);
  const bx = (W - bw) / 2;
  const ans = pick(lang, `When x = ${m.c}: y = ${m.a} × ${m.c}${m.b ? ` + ${m.b}` : ""} = ${m.valueText}`, `Cuando x = ${m.c}: y = ${m.a} × ${m.c}${m.b ? ` + ${m.b}` : ""} = ${m.valueText}`);
  const pa = para(bx + 40, y + 24, [ans], { size: 14, maxW: bw - 50, anchor: "start", weight: 700 });
  const hA = pa.y - y + 2;
  body += `<g class="eq-answer"><rect x="${f1(bx)}" y="${y}" width="${f1(bw)}" height="${f1(hA)}" rx="8" fill="none" stroke="${COLOR.success}" stroke-width="2"/>${checkPath(bx + 14, y + hA / 2 - 3)}${pa.svg}</g>`;
  y += hA + 10;
  if (m.wrong) {
    const bad = pick(lang, `Not (${m.a} + ${m.b}) × ${m.c} = ${m.wrong.total}.`, `No es (${m.a} + ${m.b}) × ${m.c} = ${m.wrong.total}.`);
    const why = pick(lang, `The ${m.b} is added once. It is not multiplied by ${m.c}.`, `El ${m.b} se suma una sola vez. No se multiplica por ${m.c}.`);
    const pw = para(bx + 40, y + 24, [bad, why], { size: 14, maxW: bw - 50, anchor: "start", weight: 700 });
    const hW = pw.y - y + 2;
    body += `<g class="eq-wrong"><rect x="${f1(bx)}" y="${y}" width="${f1(bw)}" height="${f1(hW)}" rx="8" fill="none" stroke="${COLOR.error}" stroke-width="2" stroke-dasharray="6 4"/>${crossPath(bx + 12, y + hW / 2 - 8)}${pw.svg}</g>`;
    y += hW + 10;
  }
  return { body, width: W, height: Math.ceil(y + 2) };
}

/** @param {ParentNode} root @param {Model} _m */
function scene(root, _m) {
  const rows = all(root, ".eq-row");
  const pts = all(root, ".eq-pt");
  const k = Math.max(1, rows.length);
  const span = 0.6 / k;
  /** @type {Array<import("../motion.mjs").Track & { els: Element[] }>} */
  const tracks = [];
  rows.forEach((r, i) => {
    const from = 0.05 + i * span;
    tracks.push({ els: [r], from, to: from + span * 1.1, keyframes: KF.rise });
    const p = pts.filter((e) => e.getAttribute("data-i") === r.getAttribute("data-i"));
    tracks.push({ els: p, from: from + span * 0.5, to: Math.min(0.7, from + span * 1.4), keyframes: KF.pop });
  });
  tracks.push({ els: all(root, ".eq-graph > :not(.eq-pt)"), from: 0, to: 0.12, keyframes: KF.fade });
  tracks.push({ els: all(root, ".eq-rule"), from: 0.7, to: 0.82, keyframes: KF.rise });
  tracks.push({ els: all(root, ".eq-answer"), from: 0.82, to: 0.92, keyframes: KF.fade });
  tracks.push({ els: all(root, ".eq-wrong"), from: 0.9, to: 1, keyframes: KF.fade });
  return { durationMs: Math.min(8000, 1400 + 650 * k), tracks: tracks.filter((t) => t.els.length) };
}

/** @param {Model} m @param {"en" | "es"} lang */
function describe(m, lang) {
  const k = CTX[m.ck];
  const es = lang === "es";
  const shown = m.rows.filter((r) => r !== null).map((r) => `x = ${r.x}, y = ${r.y}`).join("; ");
  const out = [
    es ? `Una tabla de entrada y salida y una gráfica con los mismos puntos. ${k.names.es}. Regla: y = ${m.a}x${m.b ? ` + ${m.b}` : ""}.` : `An input-output table and a graph with the same points. ${k.names.en}. Rule: y = ${m.a}x${m.b ? ` + ${m.b}` : ""}.`,
    es ? `Filas de la tabla: ${shown}. En cada paso, y aumenta ${m.a}.` : `Table rows: ${shown}. Each step adds ${m.a} to y.`,
    m.b > 0 ? (es ? `La parte por paso es ${m.a}x y crece con x. El ${m.b} es el inicio: se suma una sola vez y la gráfica empieza en (0, ${m.b}).` : `The per-step part is ${m.a}x and grows with x. The ${m.b} is the start: it is added once, and the graph begins at (0, ${m.b}).`) : es ? "No hay cantidad inicial: la gráfica empieza en (0, 0)." : "There is no start amount: the graph begins at (0, 0).",
    es ? `Cuando x = ${m.c}: y = ${m.a} × ${m.c}${m.b ? ` + ${m.b}` : ""} = ${m.valueText}.` : `When x = ${m.c}: y = ${m.a} × ${m.c}${m.b ? ` + ${m.b}` : ""} = ${m.valueText}.`,
  ];
  if (m.wrong) out.push(es ? `No es (${m.a} + ${m.b}) × ${m.c} = ${m.wrong.total}: el ${m.b} no se multiplica por ${m.c}.` : `Not (${m.a} + ${m.b}) × ${m.c} = ${m.wrong.total}: the ${m.b} is not multiplied by ${m.c}.`);
  return out.join(" ");
}

/** @type {import("./mount.mjs").Figure} */
export default {
  id: "growth-table-graph-rule",
  keys: KEYS,
  title: { en: "A table, a graph and the rule y = ax + b", es: "Una tabla, una gráfica y la regla y = ax + b" },
  controls,
  build,
  render,
  scene,
  describe,
};
