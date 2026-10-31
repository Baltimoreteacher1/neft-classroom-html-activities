// Graph engine: slope as rise over run between two points on a coordinate grid, and a linear function as a
// machine with an input and an output. The grid frames record both points and the rise and run, and the
// function frames record each step of the machine, so the tests can recompute them with exact arithmetic.
import { COLORS, L, esc, frame, gcd, keyed, num, svgWrap, txt } from "./core.js";

const sg = (n) => (n < 0 ? `−${-n}` : String(n));

export function parse(question) {
  // Raw text: the commas in "(1, 8)" and "y = 4x − 8, find" are part of the question.
  const q = String(question).replaceAll("−", "-").trim();
  let m = q.match(/^Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.$/);
  if (m) {
    const [x1, y1, x2, y2] = m.slice(1).map(Number);
    const run = x2 - x1;
    const rise = y2 - y1;
    if (run === 0 || [x1, y1, x2, y2].some((v) => Math.abs(v) > 30)) return null;
    return { engine: "graph", mode: "slope", x1, y1, x2, y2, run, rise, result: rise / run };
  }
  m = q.match(/^If y = (-?\d*)x ([+-]) (\d+), find y when x = (-?\d+)\.$/);
  if (m) {
    const k = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]);
    const c = m[2] === "+" ? Number(m[3]) : -Number(m[3]);
    const x = Number(m[4]);
    return { engine: "graph", mode: "fn", k, c, x, times: k * x, result: k * x + c };
  }
  return null;
}

function grid(s, { points = 0, triangle = 0, tokenAt = null } = {}) {
  const xs = [s.x1, s.x2];
  const ys = [s.y1, s.y2];
  const [lx, hx] = [Math.min(...xs, 0) - 1, Math.max(...xs, 0) + 1];
  const [ly, hy] = [Math.min(...ys, 0) - 1, Math.max(...ys, 0) + 1];
  const cell = Math.min(36, 440 / (hx - lx), 280 / (hy - ly));
  const X = (v) => 280 - ((hx + lx) / 2 - v) * cell;
  const Y = (v) => 150 + ((hy + ly) / 2 - v) * cell;
  let out = "";
  for (let v = Math.ceil(lx); v <= hx; v += 1) out += `<line x1="${X(v)}" x2="${X(v)}" y1="${Y(hy)}" y2="${Y(ly)}" stroke="${v === 0 ? COLORS.ink : COLORS.rule}" stroke-width="${v === 0 ? 2.5 : 1}"/>`;
  for (let v = Math.ceil(ly); v <= hy; v += 1) out += `<line y1="${Y(v)}" y2="${Y(v)}" x1="${X(lx)}" x2="${X(hx)}" stroke="${v === 0 ? COLORS.ink : COLORS.rule}" stroke-width="${v === 0 ? 2.5 : 1}"/>`;
  // Numbers on both axes, every `tick`, so a point can be read off the grid.
  const tick = [1, 2, 5, 10].find((n) => n * cell >= 22) ?? 10;
  for (let v = Math.ceil(lx / tick) * tick; v <= hx; v += tick)
    if (v !== 0) out += txt(X(v), Y(0) + 16, sg(v), { size: 12, weight: 600, fill: COLORS.mute });
  for (let v = Math.ceil(ly / tick) * tick; v <= hy; v += tick)
    if (v !== 0) out += txt(X(0) - 6, Y(v) + 4, sg(v), { size: 12, weight: 600, fill: COLORS.mute, anchor: "end" });
  const dot = (x, y, key, color) => keyed(key, X(x), Y(y), `<circle r="7" fill="${color}" stroke="#fff" stroke-width="2"/>${txt(10, -10, `(${sg(x)}, ${sg(y)})`, { size: 13, anchor: "start", fill: color })}`);
  if (points >= 1) out += dot(s.x1, s.y1, "p1", COLORS.whole);
  if (points >= 2) out += dot(s.x2, s.y2, "p2", COLORS.hundreds) + `<line x1="${X(s.x1)}" y1="${Y(s.y1)}" x2="${X(s.x2)}" y2="${Y(s.y2)}" stroke="${COLORS.ink}" stroke-width="3"/>`;
  if (triangle >= 1) out += `<line x1="${X(s.x1)}" y1="${Y(s.y1)}" x2="${X(s.x2)}" y2="${Y(s.y1)}" stroke="${COLORS.warn}" stroke-width="4"/>` + txt((X(s.x1) + X(s.x2)) / 2, Y(s.y1) + (s.rise >= 0 ? 20 : -10), `${L("run", "avance").en} ${sg(s.run)}`, { size: 14, fill: COLORS.warn });
  if (triangle >= 2) out += `<line x1="${X(s.x2)}" y1="${Y(s.y1)}" x2="${X(s.x2)}" y2="${Y(s.y2)}" stroke="${COLORS.part}" stroke-width="4"/>` + txt(X(s.x2) + (s.run >= 0 ? 10 : -10), (Y(s.y1) + Y(s.y2)) / 2, `${L("rise", "subida").en} ${sg(s.rise)}`, { size: 14, anchor: s.run >= 0 ? "start" : "end", fill: COLORS.part });
  if (tokenAt) out += keyed("tok", X(tokenAt[0]), Y(tokenAt[1]), `<circle r="9" fill="${COLORS.part}" stroke="#fff" stroke-width="3"/>`);
  return svgWrap(out, "", { h: 300 });
}

function machine(s, stage) {
  let out = `<rect x="205" y="50" width="150" height="80" rx="14" fill="${COLORS.whole}" fill-opacity=".9"/>${txt(280, 100, `y = ${s.k === 1 ? "" : s.k === -1 ? "−" : sg(s.k)}x ${s.c < 0 ? "−" : "+"} ${Math.abs(s.c)}`, { size: 22, fill: "#fff" })}`;
  out += txt(100, 95, `x = ${sg(s.x)}`, { size: 22 }) + `<path d="M150,90 h50" stroke="${COLORS.ink}" stroke-width="3"/>`;
  if (stage >= 1) out += txt(280, 168, `${sg(s.k)} × ${sg(s.x)} = ${sg(s.times)}`, { size: 20, fill: COLORS.whole });
  if (stage >= 2) out += txt(280, 204, `${sg(s.times)} ${s.c < 0 ? "−" : "+"} ${Math.abs(s.c)} = ${sg(s.result)}`, { size: 20, fill: COLORS.part }) + txt(460, 95, `y = ${sg(s.result)}`, { size: 22, fill: COLORS.part }) + `<path d="M360,90 h50" stroke="${COLORS.ink}" stroke-width="3"/>`;
  return svgWrap(out, "", { h: 230 });
}
const mk = (id, cap, easy, eq, svg, alt, meta = {}) => Object.assign(frame({ id, cap, easy, eq, svg: svg.replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt }), { meta });

export function frames(s) {
  if (s.mode === "fn") {
    const alt = L(`Function machine y = ${s.k}x ${s.c < 0 ? "−" : "+"} ${Math.abs(s.c)} with input ${s.x}.`, `Máquina y = ${s.k}x ${s.c < 0 ? "−" : "+"} ${Math.abs(s.c)} con entrada ${s.x}.`);
    return [
      mk("input", L(`Put x = ${sg(s.x)} into the machine.`, `Pon x = ${sg(s.x)} en la máquina.`), L(`Input ${sg(s.x)}.`, `Entrada ${sg(s.x)}.`), `x = ${sg(s.x)}`, machine(s, 0), alt, { x: s.x }),
      mk("multiply", L(`The machine multiplies first: ${sg(s.k)} × ${sg(s.x)} = ${sg(s.times)}.`, `La máquina multiplica primero: ${sg(s.k)} × ${sg(s.x)} = ${sg(s.times)}.`), L(`${sg(s.k)} × ${sg(s.x)} = ${sg(s.times)}.`, `${sg(s.k)} × ${sg(s.x)} = ${sg(s.times)}.`), `${sg(s.k)}x = ${sg(s.times)}`, machine(s, 1), alt, { x: s.x, times: s.times, k: s.k }),
      mk("add", L(`Then it ${s.c < 0 ? "subtracts" : "adds"} ${Math.abs(s.c)}: ${sg(s.times)} ${s.c < 0 ? "−" : "+"} ${Math.abs(s.c)} = ${sg(s.result)}.`, `Luego ${s.c < 0 ? "resta" : "suma"} ${Math.abs(s.c)}: ${sg(s.times)} ${s.c < 0 ? "−" : "+"} ${Math.abs(s.c)} = ${sg(s.result)}.`), L(`y = ${sg(s.result)}.`, `y = ${sg(s.result)}.`), `y = ${sg(s.result)}`, machine(s, 2), alt, { x: s.x, times: s.times, k: s.k, c: s.c, result: s.result }),
    ];
  }
  const alt = (n) => L(`Coordinate grid with ${n} point${n === 1 ? "" : "s"}.`, `Cuadrícula con ${n} punto${n === 1 ? "" : "s"}.`);
  const frac = s.run === 1 ? `${sg(s.rise)}` : `${sg(s.rise)}/${sg(s.run)}`;
  return [
    mk("points", L(`Plot the points (${sg(s.x1)}, ${sg(s.y1)}) and (${sg(s.x2)}, ${sg(s.y2)}).`, `Marca los puntos (${sg(s.x1)}, ${sg(s.y1)}) y (${sg(s.x2)}, ${sg(s.y2)}).`), L("Two points.", "Dos puntos."), "slope = rise ÷ run", grid(s, { points: 2 }), alt(2), { rise: s.rise, run: s.run }),
    mk("run", L(`Go across first: the run is ${sg(s.x2)} − ${sg(s.x1)} = ${sg(s.run)}.`, `Ve primero a lo ancho: el avance es ${sg(s.x2)} − ${sg(s.x1)} = ${sg(s.run)}.`), L(`Run = ${sg(s.run)}.`, `Avance = ${sg(s.run)}.`), `run = ${sg(s.run)}`, grid(s, { points: 2, triangle: 1 }), alt(2), { rise: s.rise, run: s.run }),
    mk("rise", L(`Then up or down: the rise is ${sg(s.y2)} − ${sg(s.y1)} = ${sg(s.rise)}.`, `Luego arriba o abajo: la subida es ${sg(s.y2)} − ${sg(s.y1)} = ${sg(s.rise)}.`), L(`Rise = ${sg(s.rise)}.`, `Subida = ${sg(s.rise)}.`), `rise = ${sg(s.rise)}`, grid(s, { points: 2, triangle: 2 }), alt(2), { rise: s.rise, run: s.run }),
    mk("slope", L(`Slope is rise over run: ${sg(s.rise)} ÷ ${sg(s.run)} = ${Number.isInteger(s.result) ? sg(s.result) : frac}.`, `La pendiente es subida entre avance: ${sg(s.rise)} ÷ ${sg(s.run)} = ${Number.isInteger(s.result) ? sg(s.result) : frac}.`), L(`Slope = ${Number.isInteger(s.result) ? sg(s.result) : frac}.`, `Pendiente = ${Number.isInteger(s.result) ? sg(s.result) : frac}.`), `m = ${sg(s.rise)}/${sg(s.run)}`, grid(s, { points: 2, triangle: 2 }), alt(2), { rise: s.rise, run: s.run, result: s.result }),
  ];
}

export const answer = (s) => s.result;

export function predicts(s) {
  if (s.mode === "fn")
    return [{ at: 2, q: L(`In y = ${s.k}x ${s.c < 0 ? "−" : "+"} ${Math.abs(s.c)}, which happens first: multiplying by x or ${s.c < 0 ? "subtracting" : "adding"} ${Math.abs(s.c)}?`, `En y = ${s.k}x ${s.c < 0 ? "−" : "+"} ${Math.abs(s.c)}, ¿qué pasa primero: multiplicar por x o ${s.c < 0 ? "restar" : "sumar"} ${Math.abs(s.c)}?`), choices: [
      { t: L("Multiply first.", "Multiplicar primero."), ok: true, why: L("Multiplication comes before adding or subtracting, so the machine multiplies x first.", "La multiplicación va antes de sumar o restar, así que la máquina multiplica x primero.") },
      { t: L(`${s.c < 0 ? "Subtract" : "Add"} first.`, `${s.c < 0 ? "Restar" : "Sumar"} primero.`), ok: false, why: L("That changes x before it is multiplied, which gives a different rule.", "Eso cambia x antes de multiplicarlo, lo que da otra regla.") },
    ], explain: [{ t: L("Because the order of operations does multiplying before adding or subtracting.", "Porque el orden de operaciones multiplica antes de sumar o restar."), ok: true }, { t: L("Because the machine reads from right to left.", "Porque la máquina lee de derecha a izquierda."), ok: false }] }];
  return [{ at: 2, q: L("Slope compares how far up (rise) to how far across (run). Which goes on top?", "La pendiente compara cuánto sube (subida) con cuánto avanza (avance). ¿Cuál va arriba?"), choices: [
    { t: L("Rise on top, run on the bottom.", "Subida arriba, avance abajo."), ok: true, why: L("Slope is rise over run: how much it goes up for each step across.", "La pendiente es subida entre avance: cuánto sube por cada paso a lo ancho.") },
    { t: L("Run on top, rise on the bottom.", "Avance arriba, subida abajo."), ok: false, why: L("That flips the fraction and gives the wrong steepness.", "Eso invierte la fracción y da una inclinación equivocada.") },
  ], explain: [{ t: L("Because slope measures change in y for each change in x.", "Porque la pendiente mide el cambio en y por cada cambio en x."), ok: true }, { t: L("Because the bigger number always goes on top.", "Porque el número mayor siempre va arriba."), ok: false }] }];
}

export function hints(s) {
  const list = frames(s);
  if (s.mode === "fn")
    return [{ text: L("Put the number in for x, then follow the order of operations.", "Pon el número en lugar de x y sigue el orden de operaciones.") }, { text: L("The machine shows the input and the rule.", "La máquina muestra la entrada y la regla."), frame: list[0] }, { text: L("Multiply first, then add or subtract the last number.", "Multiplica primero y luego suma o resta el último número."), frame: list[0] }];
  const peek = list[0];
  return [{ text: L("Slope is how much the line goes up for each step across.", "La pendiente es cuánto sube la recta por cada paso a lo ancho.") }, { text: L("The grid shows both points.", "La cuadrícula muestra ambos puntos."), frame: peek }, { text: L("Find the run (change in x) and the rise (change in y), then put rise over run.", "Halla el avance (cambio en x) y la subida (cambio en y) y pon subida entre avance."), frame: peek }];
}

export function diagnose(s, raw) {
  const v = num(raw);
  if (v === null) return null;
  if (s.mode === "slope") {
    if (Math.abs(v - s.result) < 1e-9) return null;
    if (s.rise !== 0 && Math.abs(v - s.run / s.rise) < 1e-9) return "flipped";
    if (Math.abs(v + s.result) < 1e-9) return "signSlip";
    return null;
  }
  if (v === s.result) return null;
  if (v === s.k * (s.x + s.c)) return "addedFirst";
  if (v === s.k + s.x + s.c) return "addedAll";
  return null;
}
export const tags = {
  flipped: { label: L("Put run over rise", "Puso el avance entre la subida"), tip: L("Slope is rise over run: change in y on top, change in x on the bottom.", "La pendiente es subida entre avance: el cambio en y arriba y el cambio en x abajo.") },
  signSlip: { label: L("Subtracted the points in different orders", "Restó los puntos en órdenes distintos"), tip: L("Subtract in the same order for y and for x: second minus first, both times.", "Resta en el mismo orden para y y para x: segundo menos primero, las dos veces.") },
  addedFirst: { label: L("Added before multiplying", "Sumó antes de multiplicar"), tip: L("Multiply x by its number first, then add or subtract the last number.", "Multiplica x por su número primero y luego suma o resta el último número.") },
  addedAll: { label: L("Added everything instead of multiplying", "Sumó todo en lugar de multiplicar"), tip: L("The number next to x multiplies it. Use × there, not +.", "El número junto a x lo multiplica. Usa × ahí, no +.") },
};

export const build = {
  prompt: (s) => (s.mode === "fn" ? L("Run x through the machine one step at a time.", "Pasa x por la máquina un paso a la vez.") : L(`Start at the first point. Move across by the run, then up or down by the rise, to reach the second point.`, `Empieza en el primer punto. Avanza lo ancho y luego sube o baja para llegar al segundo punto.`)),
  init: () => ({ run: 0, rise: 0, stage: 0 }),
  render(st, s) {
    if (s.mode === "fn") {
      const alt = L(`Machine after ${st.stage} step${st.stage === 1 ? "" : "s"}.`, `Máquina tras ${st.stage} paso${st.stage === 1 ? "" : "s"}.`);
      return { svg: machine(s, st.stage).replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt, controls: st.stage >= 2 ? [] : [{ id: "step", arg: st.stage === 0 ? "multiply" : "add", label: st.stage === 0 ? L(`Multiply x by ${sg(s.k)}`, `Multiplicar x por ${sg(s.k)}`) : s.c < 0 ? L(`Subtract ${Math.abs(s.c)}`, `Restar ${Math.abs(s.c)}`) : L(`Add ${s.c}`, `Sumar ${s.c}`) }, { id: "step", arg: "wrong", label: st.stage === 0 ? (s.c < 0 ? L(`Subtract ${Math.abs(s.c)} first`, `Restar ${Math.abs(s.c)} primero`) : L(`Add ${s.c} first`, `Sumar ${s.c} primero`)) : L(`Multiply again`, `Multiplicar otra vez`) }], status: st.stage >= 2 ? L(`y = ${sg(s.result)}.`, `y = ${sg(s.result)}.`) : null };
    }
    const reached = st.run === s.run && st.rise === s.rise;
    const alt = L(`Moved ${st.run} across and ${st.rise} up.`, `Se movió ${st.run} a lo ancho y ${st.rise} hacia arriba.`);
    return { svg: grid({ ...s }, { points: 1, tokenAt: [s.x1 + st.run, s.y1 + st.rise] }).replace('aria-label=""', `aria-label="${esc(alt.en)}"`), alt, controls: [{ id: "run", arg: -1, label: L("Across: left 1", "A lo ancho: izquierda 1") }, { id: "run", arg: 1, label: L("Across: right 1", "A lo ancho: derecha 1") }, { id: "rise", arg: -1, label: L("Down 1", "Abajo 1") }, { id: "rise", arg: 1, label: L("Up 1", "Arriba 1") }], status: reached ? L(`You reached (${sg(s.x2)}, ${sg(s.y2)}): rise ${sg(s.rise)} over run ${sg(s.run)}.`, `Llegaste a (${sg(s.x2)}, ${sg(s.y2)}): subida ${sg(s.rise)} entre avance ${sg(s.run)}.`) : L(`So far: run ${sg(st.run)}, rise ${sg(st.rise)}.`, `Hasta ahora: avance ${sg(st.run)}, subida ${sg(st.rise)}.`) };
  },
  act(st, id, arg, s) {
    if (s.mode === "fn") {
      if (arg === "wrong") return { state: st, ok: false, msg: L("Multiplication comes before adding or subtracting.", "La multiplicación va antes de sumar o restar."), tag: "orderSlip" };
      return { state: { ...st, stage: st.stage + 1 }, ok: true };
    }
    const v = st[id] + arg;
    return { state: { ...st, [id]: Math.min(40, Math.max(-40, v)) }, ok: true };
  },
  done: (st, s) => (s.mode === "fn" ? st.stage >= 2 : st.run === s.run && st.rise === s.rise),
};
