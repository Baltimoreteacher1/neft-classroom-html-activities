// Fraction multiplication engine: an area grid for a/b × c/d, and equal groups for "a/b of N". The overlap of
// a of b columns and c of d rows is a·c of b·d cells, so the product is that count over that count; the tests
// recompute it with exact arithmetic. "a/b of N" splits N into b equal parts and keeps a of them.
import { COLORS, L, clean, esc, frame, gcd, keyed, num, svgWrap, txt } from "./core.js";

export function parse(question) {
  const q = clean(question);
  let m = q.match(/^(\d+)\/(\d+) × (\d+)\/(\d+) = \?$/);
  if (m) {
    const [a, b, c, d] = m.slice(1).map(Number);
    if (!(a > 0 && b > 0 && c > 0 && d > 0) || a > b * 3 || c > d * 3 || b > 12 || d > 12 || a > b || c > d) return null;
    return { engine: "fracmul", mode: "grid", a, b, c, d, overlap: a * c, cells: b * d };
  }
  m = q.match(/^What is (\d+)\/(\d+) of (\d+)\?$/);
  if (m) {
    const [a, b, n] = m.slice(1).map(Number);
    if (!(a > 0 && b > 0 && n > 0) || a > b || n % b !== 0 || b > 12) return null;
    return { engine: "fracmul", mode: "of", a, b, n, part: n / b, result: (n / b) * a };
  }
  return null;
}
const simp = (p, q) => {
  const g = gcd(p, q) || 1;
  return q / g === 1 ? String(p / g) : `${p / g}/${q / g}`;
};

function gridSvg(s, { cols = 0, rows = 0, showOverlap = true } = {}) {
  const size = 200;
  const [x0, y0] = [180, 24];
  let out = "";
  for (let r = 0; r < s.d; r += 1)
    for (let c = 0; c < s.b; c += 1) {
      const inCol = c < cols;
      const inRow = r < rows;
      const fill = inCol && inRow && showOverlap ? COLORS.hundreds : inCol ? COLORS.whole : inRow ? COLORS.part : "#fff";
      out += keyed(`g${r}-${c}`, x0 + (c * size) / s.b, y0 + (r * size) / s.d, `<rect width="${size / s.b - 1.5}" height="${size / s.d - 1.5}" fill="${fill}" fill-opacity="${fill === "#fff" ? 1 : 0.8}" stroke="${COLORS.rule}" stroke-width="1"/>`);
    }
  out += `<rect x="${x0}" y="${y0}" width="${size}" height="${size}" fill="none" stroke="${COLORS.ink}" stroke-width="3"/>`;
  return svgWrap(out, "", { h: 270 });
}
function barSvg(s, shaded, hide = false) {
  let out = "";
  const w = 440 / s.b;
  for (let i = 0; i < s.b; i += 1) out += keyed(`p${i}`, 60 + i * w, 70, `<rect width="${w - 3}" height="60" rx="6" fill="${i < shaded ? COLORS.whole : "#fff"}" fill-opacity=".85" stroke="${COLORS.ink}" stroke-width="2"/>${hide ? "" : txt((w - 3) / 2, 38, String(s.part), { size: w > 40 ? 18 : 12, fill: i < shaded ? "#fff" : COLORS.mute })}`);
  out += txt(280, 54, `${s.n}`, { size: 20 });
  return svgWrap(out, "", { h: 170 });
}
const mk = (id, cap, easy, eq, svg, alt, meta = {}) => Object.assign(frame({ id, cap, easy, eq, svg: svg.replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt }), { meta });

export function frames(s) {
  if (s.mode === "of") {
    const { a, b, n, part, result } = s;
    const alt = (k) => L(`${n} split into ${b} equal parts of ${part}, ${k} shaded.`, `${n} dividido en ${b} partes iguales de ${part}, ${k} sombreadas.`);
    return [
      mk("whole", L(`Start with ${n}. To find ${a}/${b} of it, split it into ${b} equal parts.`, `Empieza con ${n}. Para hallar ${a}/${b} de eso, divídelo en ${b} partes iguales.`), L(`Split ${n} into ${b}.`, `Divide ${n} en ${b}.`), `${a}/${b} of ${n}`, barSvg(s, 0), alt(0), { parts: [n] }),
      mk("part", L(`Each part is ${n} ÷ ${b} = ${part}.`, `Cada parte es ${n} ÷ ${b} = ${part}.`), L(`1 part = ${part}.`, `1 parte = ${part}.`), `${n} ÷ ${b} = ${part}`, barSvg(s, 1), alt(1), { parts: [part], count: 1 }),
      mk("keep", L(`Keep ${a} of the ${b} parts: ${a} × ${part} = ${result}.`, `Conserva ${a} de las ${b} partes: ${a} × ${part} = ${result}.`), L(`${a} × ${part} = ${result}.`, `${a} × ${part} = ${result}.`), `${a}/${b} of ${n} = ${result}`, barSvg(s, a), alt(a), { parts: Array(a).fill(part), count: a, result }),
    ];
  }
  const { a, b, c, d } = s;
  const alt = (t) => L(`A square cut into ${b} columns and ${d} rows. ${t}`, `Un cuadrado cortado en ${b} columnas y ${d} filas. ${t}`);
  const prod = simp(a * c, b * d);
  return [
    mk("cols", L(`Cut the square into ${b} equal columns and shade ${a} of them: that is ${a}/${b}.`, `Corta el cuadrado en ${b} columnas iguales y sombrea ${a}: eso es ${a}/${b}.`), L(`Shade ${a} of ${b} columns.`, `Sombrea ${a} de ${b} columnas.`), `${a}/${b}`, gridSvg(s, { cols: a }), alt(`${a} columns shaded.`), { cols: a, rows: 0 }),
    mk("rows", L(`Now cut it into ${d} equal rows and shade ${c} of them. Where the two shadings overlap is ${a}/${b} of ${c}/${d}.`, `Ahora córtalo en ${d} filas iguales y sombrea ${c}. Donde se cruzan los dos sombreados está ${a}/${b} de ${c}/${d}.`), L(`Shade ${c} of ${d} rows.`, `Sombrea ${c} de ${d} filas.`), `${a}/${b} × ${c}/${d}`, gridSvg(s, { cols: a, rows: c, showOverlap: false }), alt(`${a} columns and ${c} rows shaded.`), { cols: a, rows: c }),
    mk("overlap", L(`The overlap has ${a} × ${c} = ${a * c} cells out of ${b} × ${d} = ${b * d} cells in all.`, `El cruce tiene ${a} × ${c} = ${a * c} celdas de ${b} × ${d} = ${b * d} celdas en total.`), L(`${a * c} of ${b * d} cells.`, `${a * c} de ${b * d} celdas.`), `${a}/${b} × ${c}/${d} = ${a * c}/${b * d}`, gridSvg(s, { cols: a, rows: c }), alt(`${a * c} cells overlap.`), { cols: a, rows: c, overlap: a * c, cells: b * d }),
    ...(simp(a * c, b * d) !== `${a * c}/${b * d}` ? [mk("simplify", L(`${a * c}/${b * d} can be written with bigger pieces as ${prod}.`, `${a * c}/${b * d} se puede escribir con partes mayores como ${prod}.`), L(`= ${prod}.`, `= ${prod}.`), `${a * c}/${b * d} = ${prod}`, gridSvg(s, { cols: a, rows: c }), alt(`Product ${prod}.`), { cols: a, rows: c, overlap: a * c, cells: b * d })] : []),
  ];
}

export const answer = (s) => (s.mode === "of" ? s.result : simp(s.overlap, s.cells));

export function predicts(s) {
  if (s.mode === "of")
    return [{ at: 1, q: L(`${s.n} is split into ${s.b} equal parts. How big is each part?`, `${s.n} se divide en ${s.b} partes iguales. ¿Qué tan grande es cada parte?`), choices: [
      { t: L(`${s.n} ÷ ${s.b}`, `${s.n} ÷ ${s.b}`), ok: true, why: L("Sharing the whole equally into b parts means dividing by b.", "Repartir el total en b partes iguales significa dividir entre b.") },
      { t: L(`${s.n} × ${s.b}`, `${s.n} × ${s.b}`), ok: false, why: L("Multiplying makes a number bigger than the whole; each part is smaller than the whole.", "Multiplicar da un número mayor que el total; cada parte es menor que el total.") },
    ], explain: [
      { t: L("Because splitting into equal parts is dividing.", "Porque dividir en partes iguales es dividir."), ok: true },
      { t: L("Because a fraction of a number always makes it bigger.", "Porque una fracción de un número siempre lo hace mayor."), ok: false },
    ] }];
  return [{ at: 2, q: L(`The whole square has ${s.b} columns and ${s.d} rows. How many small cells is that?`, `El cuadrado entero tiene ${s.b} columnas y ${s.d} filas. ¿Cuántas celdas pequeñas son?`), choices: [
    { t: L(`${s.b} × ${s.d}`, `${s.b} × ${s.d}`), ok: true, why: L("Columns times rows counts every cell, and that is the new bottom number.", "Columnas por filas cuenta todas las celdas, y ese es el nuevo denominador.") },
    { t: L(`${s.b} + ${s.d}`, `${s.b} + ${s.d}`), ok: false, why: L("Adding counts a column and a row but not every cell in the grid.", "Sumar cuenta una columna y una fila pero no todas las celdas de la cuadrícula.") },
  ], explain: [
    { t: L("Because the overlap is a count of cells out of the cells in the whole square.", "Porque el cruce es un conteo de celdas entre las celdas del cuadrado entero."), ok: true },
    { t: L("Because the bottom numbers are added.", "Porque los denominadores se suman."), ok: false },
  ] }];
}

export function hints(s) {
  const list = frames(s);
  const peek = s.mode === "of" ? { ...list[0], svg: barSvg(s, 0, true) } : null;
  if (s.mode === "of")
    return [{ text: L("Finding a fraction of a number is two steps: share equally, then keep some parts.", "Hallar una fracción de un número son dos pasos: repartir en partes iguales y luego conservar algunas.") }, { text: L("The bar shows the whole split into equal parts.", "La barra muestra el total dividido en partes iguales."), frame: peek }, { text: L(`Find the size of one part first. Then count how many parts you keep.`, `Halla primero el tamaño de una parte. Luego cuenta cuántas partes conservas.`), frame: peek }];
  return [{ text: L("Picture one fraction as columns and the other as rows. The product is where they overlap.", "Imagina una fracción como columnas y la otra como filas. El producto es donde se cruzan.") }, { text: L("The square shows both shadings, without counting the overlap for you.", "El cuadrado muestra ambos sombreados, sin contar el cruce por ti."), frame: list[1] }, { text: L("Count the overlap cells, and count all the cells in the square. Write one over the other.", "Cuenta las celdas del cruce y todas las celdas del cuadrado. Escribe una sobre la otra."), frame: list[1] }];
}

const frac = (raw) => {
  const t = String(raw).replaceAll(" ", "").replace("−", "-");
  if (t.includes("/")) {
    const [p, q] = t.split("/").map(Number);
    return q ? p / q : NaN;
  }
  return num(t) ?? NaN;
};
const same = (x, y) => Number.isFinite(x) && Math.abs(x - y) < 1e-9;
export function diagnose(s, raw) {
  const v = frac(raw);
  if (s.mode === "of") {
    if (same(v, s.result)) return null;
    if (s.a > 1 && same(v, s.part)) return "forgotKeep";
    if (same(v, (s.n * s.a) / 1 / 1 / s.b / 1) ) return null;
    if (same(v, (s.n * s.b) / s.a)) return "flipped";
    return null;
  }
  if (same(v, (s.a * s.c) / (s.b * s.d))) return null;
  if (same(v, (s.a + s.c) / (s.b + s.d))) return "addedAcross";
  if (same(v, (s.a * s.d) / (s.b * s.c))) return "divided";
  return null;
}
export const tags = {
  addedAcross: { label: L("Added the tops and the bottoms", "Sumó los numeradores y los denominadores"), tip: L("Multiplying fractions counts an overlap: multiply the tops, multiply the bottoms.", "Multiplicar fracciones cuenta un cruce: multiplica los numeradores y los denominadores.") },
  divided: { label: L("Divided instead of multiplying", "Dividió en lugar de multiplicar"), tip: L("Only dividing by a fraction flips it. Here, multiply straight across.", "Solo al dividir entre una fracción se invierte. Aquí multiplica en línea recta.") },
  forgotKeep: { label: L("Found one part but kept only one", "Halló una parte pero conservó solo una"), tip: L("After finding one part, keep as many parts as the top number says.", "Después de hallar una parte, conserva tantas partes como dice el numerador.") },
  flipped: { label: L("Used the fraction upside down", "Usó la fracción al revés"), tip: L("Divide by the bottom number to share, then multiply by the top number to keep.", "Divide entre el denominador para repartir y multiplica por el numerador para conservar.") },
};

export const build = {
  prompt: (s) => (s.mode === "of" ? L(`Shade ${s.a} of the ${s.b} equal parts.`, `Sombrea ${s.a} de las ${s.b} partes iguales.`) : L(`Shade ${s.a} of ${s.b} columns, then ${s.c} of ${s.d} rows.`, `Sombrea ${s.a} de ${s.b} columnas y luego ${s.c} de ${s.d} filas.`)),
  init: () => ({ x: 0, y: 0 }),
  render(st, s) {
    if (s.mode === "of") {
      const alt = L(`${st.x} of ${s.b} parts shaded.`, `${st.x} de ${s.b} partes sombreadas.`);
      return { svg: barSvg(s, st.x).replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt, controls: [{ id: "x", arg: 1, label: L("Shade one more part", "Sombrear una parte más") }, { id: "x", arg: -1, label: L("Unshade one part", "Quitar una parte") }], status: st.x === s.a ? L(`${s.a} parts of ${s.part} make ${s.result}.`, `${s.a} partes de ${s.part} hacen ${s.result}.`) : L(`${st.x} part${st.x === 1 ? "" : "s"} shaded: ${st.x} × ${s.part} = ${st.x * s.part}.`, `${st.x} parte${st.x === 1 ? "" : "s"} sombreada${st.x === 1 ? "" : "s"}: ${st.x} × ${s.part} = ${st.x * s.part}.`) };
    }
    const alt = L(`${st.x} columns and ${st.y} rows shaded of ${s.b} by ${s.d}.`, `${st.x} columnas y ${st.y} filas sombreadas de ${s.b} por ${s.d}.`);
    const done = st.x === s.a && st.y === s.c;
    return { svg: gridSvg(s, { cols: st.x, rows: st.y }).replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt, controls: [{ id: "x", arg: 1, label: L("Shade one more column", "Sombrear una columna más") }, { id: "x", arg: -1, label: L("Unshade a column", "Quitar una columna") }, { id: "y", arg: 1, label: L("Shade one more row", "Sombrear una fila más") }, { id: "y", arg: -1, label: L("Unshade a row", "Quitar una fila") }], status: done ? L(`Overlap: ${s.a * s.c} of ${s.b * s.d} cells, so ${simp(s.a * s.c, s.b * s.d)}.`, `Cruce: ${s.a * s.c} de ${s.b * s.d} celdas, es decir ${simp(s.a * s.c, s.b * s.d)}.`) : L(`Overlap so far: ${st.x * st.y} of ${s.b * s.d} cells.`, `Cruce hasta ahora: ${st.x * st.y} de ${s.b * s.d} celdas.`) };
  },
  act(st, id, arg, s) {
    const max = id === "x" ? s.b : s.mode === "of" ? s.b : s.d;
    const v = Math.min(max, Math.max(0, st[id] + arg));
    return { state: { ...st, [id]: v }, ok: v !== st[id], msg: v === st[id] ? L("That is as far as this goes.", "Hasta aquí se puede.") : null };
  },
  done: (st, s) => (s.mode === "of" ? st.x === s.a : st.x === s.a && st.y === s.c),
};
