// check(round, response): every figure is judged by counting the cells the learner placed, so any correct build is
// accepted and each wrong build is named. Response shapes are documented beside each checker. @fm2 FM-033 FM-060 FM-050
import { eq, frac, mul, parse } from "../../rational.js";
import { feedback, praise } from "./feedback.js";
import { classesOf, factorPairs, gcd, lcm, measure } from "./measure.js";
import { planModel } from "./model.js";
import { polyEq, polyMul, polyParse } from "./poly.js";

const miss = (mistake, vars = {}) => ({ correct: false, mistake, feedback: feedback(mistake, vars) });
const win = (key, vars = {}) => ({ correct: true, feedback: praise(key, vars) });
const whole = (text) => {
  const q = parse(text ?? "");
  return q && q.d === 1 ? q.n : null;
};

export const bestArea = (perim) => {
  const half = perim / 2;
  let best = 0;
  for (let r = 1; r < half; r += 1) best = Math.max(best, r * (half - r));
  return best;
};

// Which constraint (if any) the measured rectangle breaks. Returns [mistake, vars] or null.
export function rectIssue(task, m) {
  if (task.rows != null || task.cols != null) {
    const rowsOk = task.rows == null || m.rows === task.rows;
    const colsOk = task.cols == null || m.cols === task.cols;
    if (!rowsOk || !colsOk) {
      if (task.rows != null && task.cols != null && task.rows !== task.cols && m.rows === task.cols && m.cols === task.rows) return ["swapped", { rows: task.rows, cols: task.cols }];
      return !rowsOk ? ["rowsOff", { have: m.rows, rows: task.rows }] : ["colsOff", { have: m.cols, cols: task.cols }];
    }
  }
  if (task.area != null && m.area !== task.area) {
    if (task.perim != null && m.area === task.perim && m.perimeter === task.area) return ["mixedUp", {}];
    return ["areaOff", { have: m.area, area: task.area }];
  }
  if (task.perim != null && m.perimeter !== task.perim) {
    if (task.area != null && m.perimeter === task.area) return ["mixedUp", {}];
    return ["perimOff", { have: m.perimeter, perim: task.perim }];
  }
  if (task.side != null && m.rows !== task.side && m.cols !== task.side) return ["sideOff", { side: task.side }];
  if (task.minSide != null && Math.min(m.rows, m.cols) < task.minSide) return ["minSide", { min: task.minSide }];
  if (task.maxArea && m.area !== bestArea(task.perim)) return ["notLargest", { have: m.area }];
  return null;
}

function askIssue(round, resp, actual) {
  const text = String(resp.value ?? "").trim();
  if (!text) return ["askMissing", {}];
  const value = whole(text);
  if (value === actual.value) return null;
  if (value === null) return ["askNotNumber", {}];
  if (actual.base != null && value === actual.base) return ["askBaseOnly", { have: value }];
  if (actual.perimeter != null && value === actual.perimeter) return ["askPerimeter", { have: value }];
  return ["askOff", { have: value, kind: actual.kind }];
}

// response: { cells: [[r, c], ...], value?: text }
function checkRect(round, resp) {
  const m = measure(resp.cells);
  if (!m.area) return miss("empty");
  if (!m.rect) return miss("notRect");
  const issue = rectIssue(round.task, m);
  if (issue) return miss(...issue);
  if (round.ask) {
    const actual = round.ask.kind === "cols" ? { value: m.cols, kind: "cols" } : { value: m.area, kind: "total" };
    const bad = askIssue(round, resp, actual);
    if (bad) return miss(...bad);
  }
  return win("rect", { rows: m.rows, cols: m.cols, area: m.area, perim: m.perimeter });
}

// response: { cells: [[r, c, tool], ...], value?: text, parity?: "even" | "odd" }
function checkPaint(round, resp) {
  const t = round.task;
  const cells = measure(resp.cells).cells;
  if (!cells.length) return miss("empty");
  if (t.rule === "count") {
    if (cells.length < t.total) return miss("tooFew", { have: cells.length, total: t.total });
    if (cells.length > t.total) return miss("tooMany", { have: cells.length, total: t.total });
    if (t.perRow) {
      const rows = new Map();
      for (const [r] of cells) rows.set(r, (rows.get(r) || 0) + 1);
      if ([...rows.values()].some((n) => n !== t.perRow)) return miss("unevenRows", { perRow: t.perRow, counts: [...rows.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]).join(", ") });
    }
    return win("count", { total: t.total });
  }
  if (t.rule === "pairs") {
    if (cells.length !== t.total) return miss("pairTotal", { have: cells.length, total: t.total });
    const lined = t.axis === "cols" ? cells.map(([r, c]) => [c, r]) : cells;
    const columns = new Map();
    for (const [r, c] of lined) columns.set(c, [...(columns.get(c) || []), r]);
    const singles = [...columns.values()].filter((rows) => rows.length === 1).length;
    const twoRows = lined.every(([r]) => r === 0 || r === 1);
    if (!twoRows || [...columns.values()].some((rows) => rows.length > 2) || singles !== t.total % 2) return miss("unpaired", { odd: t.total % 2 });
    if (resp.parity !== "even" && resp.parity !== "odd") return miss("parityMissing");
    if (resp.parity !== (t.total % 2 === 0 ? "even" : "odd")) return miss("parityWrong", { left: singles });
    return win("pairs", { total: t.total, left: singles });
  }
  const shape = t.shape;
  const inShape = new Set(shape.map(([r, c]) => `${r},${c}`));
  const painted = new Set(cells.map(([r, c]) => `${r},${c}`));
  const outside = cells.filter(([r, c]) => !inShape.has(`${r},${c}`)).length;
  const gaps = shape.filter(([r, c]) => !painted.has(`${r},${c}`)).length;
  if (t.rule === "target") {
    if (outside) return miss("outside", { count: outside });
    if (gaps) return miss("gaps", { count: gaps });
  } else {
    if (outside) return miss("outside", { count: outside });
    if (gaps) return miss("uncovered", { count: gaps });
    const groups = classesOf(cells);
    for (const [tool, list] of [...groups.entries()].sort((a, b) => a[0] - b[0])) if (!measure(list).rect) return miss("notRectPart", { tool: "ABCDEFG"[tool - 1] || tool });
    if (groups.size > t.parts) return miss("tooManyParts", { parts: t.parts });
    if (groups.size < 2) return miss("onePart");
  }
  const area = shape.length;
  const perimeter = measure(shape).perimeter;
  const bad = askIssue(round, resp, { value: area, perimeter, kind: "area" });
  if (bad) return miss(...bad);
  return win(t.rule, { area });
}

// The rectangles a "find them all" round asks for, derived here from the area alone.
export function requiredList(task) {
  if (task.mode === "commute") return [[task.a, task.b], [task.b, task.a]];
  const min = task.minSide || 1;
  const pairs = factorPairs(task.area).filter(([a, b]) => a >= min && b >= min);
  if (task.mode === "factors") return pairs;
  return pairs.flatMap(([a, b]) => (a === b ? [[a, b]] : [[a, b], [b, a]]));
}

const normalize = (pair, ordered) => (ordered || pair[0] <= pair[1] ? pair : [pair[1], pair[0]]).join("x");

// response: { list: [[rows, cols], ...] }
function checkCollect(round, resp) {
  const t = round.task;
  const ordered = t.mode !== "factors";
  const required = requiredList(t);
  const wanted = new Set(required.map((p) => normalize(p, ordered)));
  const list = (Array.isArray(resp.list) ? resp.list : []).filter((p) => Array.isArray(p) && Number.isInteger(p[0]) && Number.isInteger(p[1]) && p[0] > 0 && p[1] > 0);
  if (!list.length) return miss("emptyList");
  const have = new Set();
  for (const pair of list) {
    const key = normalize(pair, ordered);
    if (!wanted.has(key)) {
      const area = pair[0] * pair[1];
      return t.mode === "commute" || area === t.area ? miss("notAskedFor", { pair: `${pair[0]} × ${pair[1]}`, min: t.minSide || 1 }) : miss("wrongEntry", { pair: `${pair[0]} × ${pair[1]}`, area: t.area, have: area });
    }
    have.add(key);
  }
  if (have.size < wanted.size) return miss(t.mode === "factors" ? "missing" : "needTurn", { found: have.size, of: wanted.size });
  return win(wanted.size === 1 ? "collectOne" : "collect", { count: wanted.size });
}

// response: { cuts: { rows?, cols? }, partials: { A: text, ... }, total: text }
function checkModel(round, resp) {
  const plan = planModel(round, resp.cuts || {});
  if (!plan.ok) return miss(plan.error, plan.vars);
  const poly = plan.mode === "poly";
  const read = (text) => (poly ? polyParse(text) : parse(text ?? ""));
  for (const region of plan.flat) {
    const raw = String(resp.partials?.[region.id] ?? "").trim();
    if (!raw) return miss("partialMissing", { id: region.id });
    const value = read(raw);
    if (!value) return miss("notNumber", { id: region.id, poly });
    if (plan.same(value, region.value)) continue;
    const sumSides = plan.sum(region.row.value, region.col.value);
    if (plan.same(value, sumSides)) return miss("addedNotMultiplied", { id: region.id, label: region.label });
    if (poly) {
      const flip = region.value.map((c) => -c);
      if (polyEq(value, flip)) return miss("signSlip", { id: region.id });
      const nz = (p) => p.map((c, i) => [c, i]).filter(([c]) => c);
      const [a, b] = [nz(value), nz(region.value)];
      if (a.length === 1 && b.length === 1 && a[0][0] === b[0][0] && a[0][1] !== b[0][1]) return miss("degreeSlip", { id: region.id });
    } else if (region.value.n !== 0 && (eq(value, mul(region.value, frac(1, 10))) || eq(value, mul(region.value, frac(10))))) {
      return miss("zeroSlip", { id: region.id, label: region.label });
    }
    return miss("partialWrong", { id: region.id, label: region.label });
  }
  const raw = String(resp.total ?? "").trim();
  if (!raw) return miss("totalMissing");
  const total = read(raw);
  if (!total) return miss("notNumber", { id: "total", poly });
  if (!plan.same(total, plan.total)) return miss(plan.flat.length > 1 && plan.same(total, plan.flat[0].value) ? "totalOnePart" : "totalOff", {});
  return win("model", { total: plan.totalText });
}

// response: { cells: base [[r, c]], layers: n, value?: text }
function checkPrism(round, resp) {
  const t = round.task;
  const m = measure(resp.cells);
  const layers = Number.isInteger(resp.layers) ? resp.layers : 0;
  if (!m.area || layers < 1) return miss("empty");
  if (!m.rect) return miss("notRect");
  const volume = m.area * layers;
  if (t.layers != null && layers !== t.layers) return miss("layersOff", { have: layers, layers: t.layers });
  if (t.rows != null && (m.rows !== t.rows || m.cols !== t.cols)) return miss("baseOff", { rows: t.rows, cols: t.cols });
  if (t.volume != null && volume !== t.volume) return miss("volumeOff", { have: volume, layers, base: m.area, volume: t.volume });
  if (t.minLayers != null && layers < t.minLayers) return miss("fewLayers", { min: t.minLayers });
  if (t.minSide != null && Math.min(m.rows, m.cols) < t.minSide) return miss("minSide", { min: t.minSide });
  if (round.ask) {
    const bad = askIssue(round, resp, { value: volume, base: m.area, kind: "volume" });
    if (bad) return miss(...bad);
  }
  return win("prism", { rows: m.rows, cols: m.cols, layers, volume });
}

// response: { cells: [[r, c]], pick: text }
function checkScale(round, resp) {
  const [n, d] = round.task.k;
  const m = measure(resp.cells);
  if (!m.area) return miss("empty");
  if (!m.rect) return miss("notRect");
  const rowsOk = m.rows * d === round.task.rows * n;
  const colsOk = m.cols * d === round.task.cols * n;
  if (rowsOk !== colsOk) return miss("oneSide", {});
  if (!rowsOk) return miss("scaleDims", { rows: m.rows, cols: m.cols });
  const area = frac(n * n, d * d);
  const pick = parse(resp.pick ?? "");
  if (!pick) return miss("pickMissing");
  if (!eq(pick, area)) {
    if (eq(pick, frac(n, d))) return miss("areaLinear", {});
    if (eq(pick, frac(n ** 3, d ** 3))) return miss("areaCubed", {});
    return miss("pickWrong", {});
  }
  return win("scale", { rows: m.rows, cols: m.cols });
}

// response: { s: whole number }
function checkTiling(round, resp) {
  const { mode, a, b } = round.task;
  const s = Number.isInteger(resp.s) ? resp.s : 0;
  if (s < 1) return miss("empty");
  if (mode === "gcf") {
    if (a % s || b % s) return miss("gapTile", { s, left: a % s || b % s });
    const best = gcd(a, b);
    if (s < best) return miss("notLargest2", { s });
    return win("gcf", { s });
  }
  if (s % a || s % b) return miss("gapSquare", { s, left: s % a ? s % a : s % b });
  if (s > lcm(a, b)) return miss(s === a * b ? "lcmProduct" : "notSmallest", { s });
  return win("lcm", { s });
}

// response: { w: [ones, xs], h: [ones, xs] }
function checkTiles(round, resp) {
  const w = Array.isArray(resp.w) ? resp.w.map((n) => (Number.isInteger(n) && n >= 0 ? n : 0)) : [0, 0];
  const h = Array.isArray(resp.h) ? resp.h.map((n) => (Number.isInteger(n) && n >= 0 ? n : 0)) : [0, 0];
  if (!(w[0] || w[1]) || !(h[0] || h[1])) return miss("empty");
  const used = polyMul(w, h);
  const want = round.task.target;
  if (polyEq(used, want)) return win("tiles", { w, h });
  const key = used[2] !== want[2] ? "x2Off" : used[1] !== want[1] ? "xOff" : "onesOff";
  return miss(key, { used: used.join(","), want: want.join(","), x2: used[2], x: used[1], ones: used[0], wx2: want[2], wx: want[1], wones: want[0] });
}

const CHECKS = { rect: checkRect, paint: checkPaint, collect: checkCollect, model: checkModel, prism: checkPrism, scale: checkScale, tiling: checkTiling, tiles: checkTiles };

export function check(round, response) {
  const run = CHECKS[round?.kind];
  if (!run) return miss("empty");
  try {
    return run(round, response && typeof response === "object" ? response : {});
  } catch {
    return miss("empty");
  }
}
