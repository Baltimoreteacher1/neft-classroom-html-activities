// The area-model plan for a round: how the sides are split, which partial products result and what each one is.
// Shared by the checker, the solver and the on-screen model so they can never disagree. @fm2 FM-059 FM-058 FM-054
import { add, eq, frac, mul, parse, sub, toDecimalString, toString as ratio } from "../../rational.js";
import { polyAdd, polyMul, polyText } from "./poly.js";

export const numText = (q) => toDecimalString(q) ?? ratio(q);
export const REGION_IDS = "ABCDEFGHI";

function numParts(dim, cutText, key, lenient) {
  if (dim.mode === "none") return { parts: [parse(dim.whole)] };
  if (dim.mode === "given") return { parts: dim.parts.map(parse) };
  if (cutText == null || String(cutText).trim() === "") return { error: "cutMissing", vars: { key } };
  const cut = parse(cutText);
  const whole = parse(dim.whole);
  if (!cut || !(cut.n > 0 && cut.n * whole.d < whole.n * cut.d)) return { error: "cutRange", vars: { key } };
  if (dim.mode === "place" && !lenient) {
    const unit = parse(dim.unit);
    const steps = Math.floor((whole.n * unit.d) / (whole.d * unit.n));
    if (!eq(cut, mul(frac(steps), unit))) return { error: "cutPlace", vars: { key, cut: numText(cut) } };
  }
  return { parts: [cut, sub(whole, cut)] };
}

// cuts: { rows?: text, cols?: text }. Returns { ok, error, vars, rows, cols, regions, total }.
export function planModel(round, cuts = {}, lenient = false) {
  const { mode, rows: rd, cols: cd } = round.task;
  let rows;
  let cols;
  if (mode === "poly") {
    rows = rd.parts.map((p) => ({ value: p, text: polyText(p), weight: Math.abs(p[1] ? 4 : p[0]) || 1 }));
    cols = cd.parts.map((p) => ({ value: p, text: polyText(p), weight: Math.abs(p[1] ? 4 : p[0]) || 1 }));
  } else {
    const r = numParts(rd, cuts.rows, "rows", lenient);
    const c = numParts(cd, cuts.cols, "cols", lenient);
    const error = r.error ? r : c.error ? c : null;
    if (error) return { ok: false, error: error.error, vars: error.vars, rowDim: rd, colDim: cd };
    const view = (list) => list.map((value) => ({ value, text: numText(value), weight: Math.abs(value.n / value.d) }));
    rows = view(r.parts);
    cols = view(c.parts);
  }
  const product = (a, b) => (mode === "poly" ? polyMul(a, b) : mul(a, b));
  const sum = (a, b) => (mode === "poly" ? polyAdd(a, b) : add(a, b));
  const same = (a, b) => (mode === "poly" ? [0, 1, 2].every((i) => (a[i] || 0) === (b[i] || 0)) : eq(a, b));
  const regions = rows.map((rp, i) =>
    cols.map((cp, j) => {
      const value = product(rp.value, cp.value);
      return { id: REGION_IDS[i * cols.length + j], value, text: mode === "poly" ? polyText(value) : numText(value), label: `${rp.text} × ${cp.text}`, row: rp, col: cp };
    }),
  );
  const flat = regions.flat();
  const total = flat.map((r) => r.value).reduce((a, b) => sum(a, b));
  return { ok: true, mode, rows, cols, regions, flat, total, totalText: mode === "poly" ? polyText(total) : numText(total), sum, same, product };
}

// The cut a solver would choose for each splittable side.
export function solverCuts(round) {
  const cuts = {};
  for (const key of ["rows", "cols"]) {
    const dim = round.task[key];
    if (dim.mode === "place") {
      const whole = parse(dim.whole);
      const unit = parse(dim.unit);
      cuts[key] = numText(mul(frac(Math.floor((whole.n * unit.d) / (whole.d * unit.n))), unit));
    } else if (dim.mode === "free") {
      const whole = parse(dim.whole);
      const tens = Math.floor((whole.n / whole.d - 1) / 10) * 10;
      cuts[key] = String(tens > 0 ? tens : 1);
    }
  }
  return cuts;
}
