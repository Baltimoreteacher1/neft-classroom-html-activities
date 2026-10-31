// Builders for `item.model = { graphic, config }`. One builder per graphic kind in graphics/registry.js. Every
// number in a config is an integer; a fraction is { n, d }; nothing is a float. `shows` is the exact quantity the
// picture represents (a rational string, "(x,y)" or a list); tools/fluency-problem-types.test.mjs reads each
// config back with its own code and fails when the picture and `shows` disagree.
//
// Config keys (all kinds also carry mode: "check", the registry's read-only mode for a shown model):
//   fraction-model      shape "bar"|"circle"|"set", parts, shaded, wholes        shows = shaded/parts
//   number-line         min, max, step (tick spacing), points:[{value,label}],   shows = points[0].value
//                       jumps?:[{from, by}] (arrows; by < 0 goes left)
//   place-value         columns:[{unit, count, group?}], take? (amount crossed out)  shows = sum unit*count - take
//   array               rows, cols                                               shows = rows*cols
//   area-model          rowParts:[Q], colParts:[Q]                               shows = (sum rows)(sum cols)
//   ratio-table         columns:[[a, b], ...], labels:[top, bottom]              shows = a/b of every column
//   double-number-line  top:{label, values}, bottom:{label, values}              shows = top/bottom of every pair
//   coordinate-grid     points:[{x, y, label}], extent                           shows = "(x,y)" of points[0]
//   geometry            shape, dims, quantity                                    shows = that quantity (pi kept out)
//   solids-nets         solid "prism", l, w, h, quantity                         shows = volume | surface area
//   decimal-percent     shaded, grid (100)                                       shows = shaded/100
//   stats-display       display "dot-plot"|"bar"|"table", values                 shows = sorted values, comma list
import { Q, ZERO, add, mul, qs, sub } from "./rational.js";

export const model = (graphic, config, shows, label) => ({
  graphic,
  config: { mode: "check", ...config, ...(label ? { label } : {}) },
  shows,
});

export const fractionModel = (parts, shaded, { shape = "bar", label } = {}) =>
  model(
    "fraction-model",
    { shape, parts, shaded, wholes: Math.max(1, Math.ceil(shaded / parts)) },
    qs(Q(shaded, parts)),
    label,
  );

export const numberLine = (min, max, step, points, label, jumps) =>
  model("number-line", { min, max, step, points, ...(jumps ? { jumps } : {}) }, qs(points[0].value), label);

export const placeValue = (columns, label, take) =>
  model(
    "place-value",
    { columns, ...(take ? { take } : {}) },
    qs(sub(columns.reduce((sum, c) => add(sum, mul(c.unit, Q(c.count))), ZERO), take || ZERO)),
    label,
  );

export const array = (rows, cols, label) => model("array", { rows, cols }, String(rows * cols), label);

export const areaModel = (rowParts, colParts, label) => {
  const total = (list) => list.reduce((s, v) => add(s, v), ZERO);
  return model("area-model", { rowParts, colParts }, qs(mul(total(rowParts), total(colParts))), label);
};

export const ratioTable = (columns, labels, label) =>
  model("ratio-table", { columns, labels }, qs(Q(columns[0][0], columns[0][1])), label);

export const doubleNumberLine = (top, bottom, label) =>
  model("double-number-line", { top, bottom }, qs(Q(top.values[0].n * bottom.values[0].d, top.values[0].d * bottom.values[0].n)), label);

export const coordinateGrid = (points, extent = 10, label) =>
  model("coordinate-grid", { points, extent }, `(${qs(points[0].x)},${qs(points[0].y)})`, label);

const GEOMETRY = {
  "rectangle/area": (d) => mul(d.l, d.w),
  "rectangle/perimeter": (d) => mul(Q(2), add(d.l, d.w)),
  "triangle/area": (d) => mul(Q(1, 2), mul(d.b, d.h)),
  "circle/r-squared": (d) => mul(d.r, d.r),
};
export const geometry = (shape, dims, quantity, label) =>
  model("geometry", { shape, dims, quantity }, qs(GEOMETRY[`${shape}/${quantity}`](dims)), label);

export const solid = (l, w, h, quantity = "volume", label) =>
  model(
    "solids-nets",
    { solid: "prism", l, w, h, quantity },
    String(quantity === "volume" ? l * w * h : 2 * (l * w + l * h + w * h)),
    label,
  );

export const decimalPercent = (shaded, label) =>
  model("decimal-percent", { shaded, grid: 100 }, qs(Q(shaded, 100)), label);

export const statsDisplay = (display, values, label) =>
  model("stats-display", { display, values }, [...values].sort((a, b) => a - b).join(","), label);
