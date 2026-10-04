/**
 * Figure-spec rules for data/small-group-build/*.json (see
 * docs/specs/small-group-build-v2.md → Figures). The renderer in
 * engine/core/small-group-build-figures.js draws exactly these kinds; a spec
 * that passes here is one it can draw without guessing.
 */
const num = (v) => typeof v === "number" && Number.isFinite(v);
const str = (v) => typeof v === "string" && v.trim().length > 0;
const arr = (v, min = 1) => Array.isArray(v) && v.length >= min;
const pt = (p) => Array.isArray(p) && p.length === 2 && p.every(num);

export const FIGURE_KINDS = {
  dotPlot(f, e) {
    if (!arr(f.values) || !f.values.every(num)) e("values must be numbers");
    if (!num(f.min) || !num(f.max) || f.min >= f.max) e("needs min < max");
    else if (f.values?.some((v) => v < f.min || v > f.max)) e("a value is outside min..max");
    if (f.step !== undefined && !(num(f.step) && f.step > 0)) e("step must be > 0");
    if (num(f.min) && num(f.max) && (f.max - f.min) / (f.step || 1) > 40) e("more than 40 ticks");
    if (!str(f.label)) e("label missing");
    if (f.mark && !num(f.mark.value)) e("mark.value must be a number");
  },
  numberLine(f, e) {
    if (!num(f.min) || !num(f.max) || f.min >= f.max) e("needs min < max");
    if (!(num(f.step) && f.step > 0)) e("step must be > 0");
    else if ((f.max - f.min) / f.step > 40) e("more than 40 ticks");
    const inRange = (v) => num(v) && v >= f.min - 1e-9 && v <= f.max + 1e-9;
    for (const p of f.points || []) if (!inRange(p.value)) e(`point ${p.value} outside min..max`);
    for (const j of f.jumps || [])
      if (!inRange(j.from) || !inRange(j.to)) e("jump outside min..max");
    if (f.ray && (!inRange(f.ray.from) || !["left", "right"].includes(f.ray.dir)))
      e("ray needs from in range and dir left|right");
    if (!f.points?.length && !f.jumps?.length && !f.ray)
      e("draws nothing (no points, jumps or ray)");
  },
  doubleNumberLine(f, e) {
    for (const k of ["top", "bottom"]) {
      if (!str(f[k]?.label)) e(`${k}.label missing`);
      if (!arr(f[k]?.values, 2)) e(`${k}.values needs ≥ 2`);
    }
    if (f.top?.values?.length !== f.bottom?.values?.length) e("top and bottom need the same count");
  },
  coordGrid(f, e) {
    for (const k of ["xMin", "xMax", "yMin", "yMax", "xStep", "yStep"])
      if (!num(f[k])) e(`${k} missing`);
    if (f.xMin >= f.xMax || f.yMin >= f.yMax) e("needs min < max on both axes");
    if ((f.xMax - f.xMin) / f.xStep > 24 || (f.yMax - f.yMin) / f.yStep > 24)
      e("more than 24 grid lines");
    if (!arr(f.points)) e("points missing");
    for (const p of f.points || []) {
      if (!num(p.x) || !num(p.y)) e("point needs x and y");
      else if (p.x < f.xMin || p.x > f.xMax || p.y < f.yMin || p.y > f.yMax)
        e(`point (${p.x}, ${p.y}) is off the grid`);
    }
  },
  shape(f, e) {
    if (!arr(f.polygons)) return e("polygons missing");
    for (const poly of f.polygons)
      if (!arr(poly.points, 3) || !poly.points.every(pt)) e("polygon needs ≥ 3 [x,y] points");
    for (const s of [...(f.sides || []), ...(f.heights || [])])
      if (!pt(s.from) || !pt(s.to) || !str(s.text)) e("side/height needs from, to and text");
    if (!f.sides?.length) e("label at least one side");
  },
  prism(f, e) {
    for (const k of ["l", "w", "h"]) if (!(num(f[k]) && f[k] > 0)) e(`${k} must be > 0`);
    if (!str(f.unit)) e("unit missing");
    if (f.cubes && f.l * f.w * f.h > 240) e("too many cubes to draw (max 240)");
    for (const [k, v] of Object.entries(f.labels || {}))
      if (!["l", "w", "h"].includes(k) || !str(v)) e("labels takes l, w, h strings only");
  },
  tape(f, e) {
    if (!arr(f.rows)) return e("rows missing");
    for (const r of f.rows) {
      if (!str(r.label)) e("row label missing");
      if (!(Number.isInteger(r.parts) && r.parts >= 1 && r.parts <= 20)) e("parts must be 1–20");
      if (
        r.shaded !== undefined &&
        !(Number.isInteger(r.shaded) && r.shaded >= 0 && r.shaded <= r.parts)
      )
        e("shaded must be 0..parts");
    }
  },
  ratioTable(f, e) {
    if (!arr(f.headers, 2)) e("headers needs ≥ 2");
    if (!arr(f.rows, 2) || f.rows.some((r) => r.length !== f.headers?.length))
      e("rows must match headers");
  },
  table(f, e) {
    if (!arr(f.headers)) e("headers missing");
    if (!arr(f.rows) || f.rows.some((r) => r.length !== f.headers?.length))
      e("rows must match headers");
  },
  fractionBars(f, e) {
    if (!arr(f.bars)) return e("bars missing");
    for (const b of f.bars)
      if (
        !(
          Number.isInteger(b.parts) &&
          b.parts >= 1 &&
          b.parts <= 24 &&
          Number.isInteger(b.shaded) &&
          b.shaded >= 0 &&
          b.shaded <= b.parts
        )
      )
        e("bar needs integer parts 1–24 and shaded 0..parts");
  },
  hundredGrid(f, e) {
    if (!(num(f.shaded) && f.shaded >= 0 && f.shaded <= 100)) e("shaded must be 0–100");
  },
  boxPlot(f, e) {
    const v = [f.min, f.q1, f.median, f.q3, f.max];
    if (!v.every(num)) return e("needs min, q1, median, q3, max");
    if (v.some((x, i) => i && x < v[i - 1])) e("five-number summary is out of order");
    if (!num(f.axisMin) || !num(f.axisMax) || f.axisMin > f.min || f.axisMax < f.max)
      e("axis must cover min..max");
    if (!(num(f.step) && f.step > 0)) e("step must be > 0");
  },
  histogram(f, e) {
    if (!arr(f.bins)) return e("bins missing");
    f.bins.forEach((b, i) => {
      if (!num(b.from) || !num(b.to) || !Number.isInteger(b.count) || b.count < 0)
        e("bin needs from, to, count");
      if (i && b.from !== f.bins[i - 1].to) e("bins must touch (from = previous to)");
    });
    if (!str(f.xLabel) || !str(f.yLabel)) e("xLabel and yLabel required");
  },
  longDivision(f, e) {
    if (!/^\d+(\.\d+)?$/.test(String(f.dividend ?? ""))) e("dividend must be a numeric string");
    if (!/^\d+(\.\d+)?$/.test(String(f.divisor ?? "")) || Number(f.divisor) === 0)
      e("divisor must be a non-zero numeric string");
    else if (/\./.test(String(f.divisor))) e("shift the decimal first — divisor must be whole");
  },
  factorTree(f, e) {
    if (!(Number.isInteger(f.root) && f.root > 1)) return e("root must be an integer > 1");
    const leaves = new Set([f.root]);
    for (const s of f.splits || []) {
      const [p, a, b] = s;
      if (a * b !== p) e(`${p} ≠ ${a} × ${b}`);
      if (!leaves.has(p)) e(`${p} is not on the tree yet`);
      leaves.delete(p);
      leaves.add(a);
      leaves.add(b);
    }
  },
  areaModel(f, e) {
    if (!arr(f.rows) || !arr(f.cols)) e("rows and cols required");
    if (
      !arr(f.cells) ||
      f.cells.length !== f.rows?.length ||
      f.cells.some((r) => r.length !== f.cols?.length)
    )
      e("cells must be rows × cols");
  },
  balance(f, e) {
    if (!str(f.left) || !str(f.right)) e("left and right required");
  },
};

export function checkFigure(err, path, f) {
  const rule = FIGURE_KINDS[f?.kind];
  if (!rule) return err(`${path}.kind "${f?.kind}" is not a known figure kind`);
  rule(f, (m) => err(`${path} (${f.kind}): ${m}`));
  if (f.caption !== undefined) {
    if (String(f.caption).split(/\s+/).length > 12) err(`${path}.caption > 12 words`);
    if (!f.captionEs) err(`${path}.captionEs missing`);
  }
}
