// Exact math for the decimal / percent / fraction graphic. A quantity is a rational share of one whole, counted in
// "units" of 1/res (res = 100 for hundredths, 1000 for tenths of a percent). It may exceed 1 (percent over 100%) and
// be smaller than 1/100 (percent under 1%).
import { ZERO, decimalText, eq, fmt, mixed, mul, parse, rat, sane } from "./b-rational.js";

export const RESOLUTIONS = [100, 1000];
export const MAX_WHOLES = 3;

export const unitsOf = (state) => Math.round((state.value.n * state.res) / state.value.d);
export const valueOfUnits = (k, res) => rat(k, res);

export function sanitize(input = {}, config = {}) {
  const src = { ...config, ...input };
  const res = RESOLUTIONS.includes(Number(src.res)) ? Number(src.res) : 100;
  const max = Math.min(MAX_WHOLES, Math.max(1, Math.round(Number(src.max)) || 1));
  const raw = sane(src.value, ZERO, ZERO, rat(max));
  const k = Math.max(0, Math.min(max * res, Math.round((raw.n * res) / raw.d)));
  return { value: valueOfUnits(k, res), res, max };
}

export const setUnits = (state, k) => ({ ...state, value: valueOfUnits(Math.max(0, Math.min(state.max * state.res, k)), state.res) });
export const stepUnits = (state, delta) => setUnits(state, unitsOf(state) + delta);

// Percent of the whole as exact decimal text ("37", "0.5", "125"), the decimal ("0.37") and fractions.
export const percentText = (state) => decimalText(mul(state.value, rat(100)));
export const decimalOf = (state) => decimalText(state.value);
export const fractionParts = (state) => ({ units: unitsOf(state), res: state.res, reduced: fmt(state.value), mixed: mixed(state.value) });

// Place-value digits of the value, counted in units of 1/res (works past 1 whole and below 1/100).
export function digits(state) {
  const k = unitsOf(state);
  const per = state.res / 10;
  const wholes = Math.floor(k / state.res);
  const rem = k % state.res;
  const tenths = Math.floor(rem / per);
  const rest = rem % per;
  return { wholes, tenths, hundredths: state.res === 100 ? rest : Math.floor(rest / 10), thousandths: state.res === 1000 ? rest % 10 : 0 };
}

// Shaded cells for each 10 x 10 grid: whole cells plus a partial last cell (tenths of a cell when res = 1000).
export function gridFill(state) {
  const k = unitsOf(state);
  const per = state.res / 100;
  return Array.from({ length: state.max }, (_, g) => {
    const local = Math.max(0, Math.min(state.res, k - g * state.res));
    return { full: Math.floor(local / per), partial: (local % per) / per };
  });
}

export function targetValue(target) {
  if (!target) return null;
  const strip = (v) => (typeof v === "string" ? v.replace("%", "").trim() : v);
  if (target.value !== undefined) return parse(target.value);
  if (target.decimal !== undefined) return parse(strip(target.decimal));
  if (target.fraction !== undefined) return parse(target.fraction);
  if (target.percent !== undefined) {
    const p = parse(strip(target.percent));
    return p ? mul(p, rat(1, 100)) : null;
  }
  return null;
}
export function isCorrect(state, target) {
  const want = targetValue(target);
  return Boolean(want) && eq(state.value, want);
}
