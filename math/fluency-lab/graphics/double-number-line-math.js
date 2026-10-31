// Exact math for the double number line. Two aligned lines share one horizontal position: the top line runs
// 0..max in `a` units, the bottom line runs 0..max*b/a in `b` units, so every mark pairs a top value with
// the exact bottom value (top * b / a).
import {
  ONE,
  ZERO,
  add,
  clamp,
  cmp,
  div,
  eq,
  floorInt,
  isRat,
  mul,
  parse,
  rat,
  sane,
  snapTo,
} from "./b-rational.js";

export const MAX_MARKS = 8;
export const MAX_TICKS = 40;

export const bottomOf = (top, ratio) => mul(top, div(ratio.b, ratio.a));
export const topOf = (bottom, ratio) => mul(bottom, div(ratio.a, ratio.b));
export const unitRate = (ratio) => div(ratio.b, ratio.a);
export const tickValues = (state) =>
  Array.from({ length: floorInt(div(state.max, state.step)) + 1 }, (_, k) =>
    mul(state.step, rat(k)),
  );

export function sanitize(input = {}, config = {}) {
  const src = { ...config, ...input };
  const ratio = {
    a: sane(src.ratio?.a, rat(2), rat(1, 1000)),
    b: sane(src.ratio?.b, rat(5), rat(1, 1000)),
  };
  const max = sane(src.max, mul(ratio.a, rat(5)), rat(1, 100), rat(1000));
  let step = sane(src.step, ONE, rat(1, 1000), max);
  while (floorInt(div(max, step)) > MAX_TICKS) step = mul(step, rat(2));
  const snap = (value) => clamp(snapTo(parse(value, ZERO), step), ZERO, max);
  const marks = (Array.isArray(input.marks) ? input.marks : (config.marks ?? []))
    .slice(0, MAX_MARKS)
    .map(snap);
  const selected = marks.length
    ? Math.min(Math.max(Number(input.selected) || 0, 0), marks.length - 1)
    : -1;
  return { ratio, max, step, marks, selected };
}

export function normalizeFixed(config, state) {
  return (config.fixed ?? [])
    .map((entry) => {
      const top =
        entry.top !== undefined
          ? parse(entry.top)
          : entry.bottom !== undefined
            ? topOf(parse(entry.bottom), state.ratio)
            : null;
      return top && cmp(top, ZERO) >= 0 && cmp(top, state.max) <= 0 ? top : null;
    })
    .filter(Boolean);
}

export function withMark(state, top) {
  if (state.marks.length >= MAX_MARKS) return state;
  const value = clamp(snapTo(top, state.step), ZERO, state.max);
  return { ...state, marks: [...state.marks, value], selected: state.marks.length };
}
export function movedMark(state, index, top) {
  if (index < 0 || index >= state.marks.length) return state;
  const marks = state.marks.slice();
  marks[index] = clamp(snapTo(top, state.step), ZERO, state.max);
  return { ...state, marks, selected: index };
}
export function withoutMark(state, index) {
  if (index < 0 || index >= state.marks.length) return state;
  const marks = state.marks.filter((_, i) => i !== index);
  return { ...state, marks, selected: marks.length ? Math.min(index, marks.length - 1) : -1 };
}
export const nudged = (state, index, steps) =>
  movedMark(state, index, add(state.marks[index], mul(state.step, rat(steps))));

export function isCorrect(state, target) {
  if (!target) return false;
  const want =
    target.top !== undefined
      ? parse(target.top)
      : target.bottom !== undefined
        ? topOf(parse(target.bottom), state.ratio)
        : null;
  return Boolean(want) && state.marks.some((mark) => eq(mark, want));
}

// The scale factor between the basis ratio and a mark: mark / a, so 2:5 and 6:15 differ by x3.
export const scaleFactor = (state, top) => div(top, state.ratio.a);
export { isRat };
