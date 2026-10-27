// Scoring for Number Line Quest. A response is exact data (rationals), the verdict is decided with exact comparisons, and a
// miss is named: a catalogued slip when the marker sits on one, otherwise which way and about how far. The target position is
// never put in the feedback. @fm2 FM-052 FM-055 FM-060 FM-063
import { add, cmp, div, eq, frac, isInt, mul, sub, toDecimalString } from "../../rational.js";
import { directionFeedback, FB, TRAP } from "./copy-feedback.js";
import { fmt, L } from "../../lang.js";
import { placesOf, showNum } from "./format.js";
import { absF, asFrac, floorOf, placeAccepts, targetOf } from "./geometry.js";

const bad = (mistake, feedback) => ({ correct: false, mistake, feedback });
const good = (feedback) => ({ correct: true, feedback });
const fill = (copy, vars) =>
  Object.fromEntries(
    ["en", "es"].map((lang) => [
      lang,
      fmt(copy[lang], Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, L(v, lang)]))),
    ]),
  );
const flat = (detail) =>
  Object.fromEntries(
    Object.entries(detail || {})
      .filter(([, v]) => typeof v !== "object")
      .map(([k, v]) => [k, String(v)]),
  );
const pow10 = (e) => (e >= 0 ? frac(10 ** e) : frac(1, 10 ** -e));
const sign = (a) => Math.sign(a.n);

// Largest power of ten that is at most a tenth of the span (but never finer than one step), so "about 0.4" is a coarse
// estimate of the miss rather than a precise correction.
function coarseUnit(window, mode) {
  if (mode === "frac" || mode === "mixed") return window.step;
  const tenth = div(sub(window.max, window.min), frac(10));
  let unit = frac(1);
  while (cmp(mul(unit, frac(10)), tenth) <= 0) unit = mul(unit, frac(10));
  while (cmp(unit, tenth) > 0) unit = div(unit, frac(10));
  return cmp(unit, window.step) < 0 ? window.step : unit;
}

export function directionAbout(mode, window, x, target) {
  const dist = sub(x, target);
  const away = absF(dist);
  const span = sub(window.max, window.min);
  const band =
    cmp(mul(away, frac(25)), mul(span, frac(2))) < 0
      ? "near"
      : cmp(mul(away, frac(4)), span) < 0
        ? "mid"
        : "far";
  const unit = coarseUnit(window, mode);
  const count = floorOf(add(div(away, unit), frac(1, 2)));
  const text =
    count === 0
      ? null
      : showNum(mul(unit, frac(count)), mode === "frac" || mode === "mixed" ? "frac" : "dec");
  return directionFeedback(dist.n > 0 ? "right" : "left", band, text);
}

function checkPlace(round, response) {
  const x = asFrac(response.x);
  if (!x) return bad("incomplete", FB.incomplete);
  if (cmp(x, round.line.min) < 0 || cmp(x, round.line.max) > 0) return bad("off-line", FB.offLine);
  if (placeAccepts(round, x)) return good(round.tol.n === 0 ? FB.exact : FB.near);
  const hit = round.traps.find((t) => eq(t.x, x));
  if (hit) return bad(hit.key, fill(TRAP[hit.key], flat(round.detail)));
  const away = sub(x, targetOf(round));
  return {
    ...bad(
      away.n > 0 ? "too-right" : "too-left",
      directionAbout(round.mode, round.line, x, targetOf(round)),
    ),
  };
}

function checkHop(round, response) {
  const list = Array.isArray(response.hops) ? response.hops.map(asFrac) : [];
  if (!list.length) return bad("no-hops", FB.noHops);
  if (list.some((h) => !h || !round.hops.some((o) => eq(o, h)))) return bad("bad-hop", FB.badHop);
  const pos = list.reduce((p, h) => add(p, h), round.start);
  const needed = sub(round.target, round.start);
  const vars = {
    pos: showNum(pos, round.mode, placesOf(round.line.step)),
    n: list.length,
    cap: round.cap,
    side: needed.n > 0 ? { en: "right", es: "derecha" } : { en: "left", es: "izquierda" },
  };
  if (eq(pos, round.target))
    return list.length > round.cap
      ? bad("too-many", fill(FB.tooMany, vars))
      : good(fill(FB.hopsOk, vars));
  const net = sub(pos, round.start);
  if (net.n === 0) return bad("no-progress", FB.noProgress);
  if (sign(net) !== sign(needed)) return bad("wrong-way", fill(FB.wrongWay, vars));
  return sign(sub(pos, round.target)) === sign(needed)
    ? bad("overshot", fill(FB.overshot, vars))
    : bad("short", fill(FB.short, vars));
}

function checkRound(round, response) {
  const x = asFrac(response.x);
  const pick = asFrac(response.pick);
  if (!x || !pick || !(eq(pick, round.lo) || eq(pick, round.hi)))
    return bad("incomplete", FB.incomplete);
  if (cmp(absF(sub(x, round.value)), round.tol) > 0)
    return bad(
      cmp(x, round.value) > 0 ? "too-right" : "too-left",
      directionAbout(round.mode, round.line, x, round.value),
    );
  const nearest =
    cmp(sub(round.value, round.lo), sub(round.hi, round.value)) < 0 ? round.lo : round.hi;
  const vars = {
    v: showNum(round.value, round.mode, placesOf(round.line.step)),
    pick: showNum(nearest, round.mode),
  };
  if (eq(pick, nearest)) return good(fill(FB.roundOk, vars));
  return bad(
    eq(pick, round.hi) ? "rounded-up-early" : "rounded-down-late",
    fill(eq(pick, round.hi) ? FB.roundedUpEarly : FB.roundedDownLate, vars),
  );
}

const letter = (i) => String.fromCharCode(65 + i);
// 0.45 read as "forty-five" and 0.5 as "five": the number you get by ignoring the decimal point.
const digitsAsWhole = (v) => Number((toDecimalString(absF(v)) || "0").replace(".", ""));
const pairs = (n) =>
  Array.from({ length: n }, (_, i) =>
    Array.from({ length: n - i - 1 }, (_, k) => [i, i + k + 1]),
  ).flat();

function checkOrder(round, response) {
  const xs = Array.isArray(response.xs) ? response.xs.map(asFrac) : [];
  const n = round.items.length;
  if (xs.length !== n || xs.some((x) => !x)) return bad("incomplete", FB.incomplete);
  if (xs.some((x) => cmp(x, round.line.min) < 0 || cmp(x, round.line.max) > 0))
    return bad("off-line", FB.offLine);
  const all = pairs(n);
  const tie = all.find(([i, j]) => eq(xs[i], xs[j]));
  if (tie) return bad("tied", fill(FB.tied, { a: letter(tie[0]), b: letter(tie[1]) }));
  const values = round.items.map((item) => item.v);
  const wrong = all.find(([i, j]) => cmp(xs[i], xs[j]) !== cmp(values[i], values[j]));
  if (!wrong) return good(FB.orderOk);
  // A tie in the comparison key (a number and its opposite have the same size) fits either order.
  const matches = (key) => all.every(([i, j]) => Math.sign(key(i, j)) === 0 || cmp(xs[i], xs[j]) === Math.sign(key(i, j)));
  if (all.every(([i, j]) => cmp(xs[i], xs[j]) === -cmp(values[i], values[j])))
    return bad("reversed", FB.reversed);
  if (values.some((v) => v.n < 0) && matches((i, j) => cmp(absF(values[i]), absF(values[j]))))
    return bad("abs-order", FB.absOrder);
  if (round.detail.decimals && matches((i, j) => digitsAsWhole(values[i]) - digitsAsWhole(values[j])))
    return bad("digits-as-whole", FB.digitsAsWhole);
  return bad("out-of-order", fill(FB.outOfOrder, { a: letter(wrong[0]), b: letter(wrong[1]) }));
}

function checkZoom(round, response) {
  const { z, outerMin } = round.zoom;
  const path = Array.isArray(response.path) ? response.path.map(asFrac) : [];
  const x = asFrac(response.x);
  if (path.length !== z || path.some((p) => !p) || !x) return bad("incomplete", FB.zoomIncomplete);
  let low = outerMin;
  for (let i = 0; i < z; i += 1) {
    const slice = pow10(-(i + 1));
    const index = div(sub(path[i], low), slice);
    if (!isInt(index) || index.n < 0 || index.n > 9) return bad("incomplete", FB.zoomIncomplete);
    const high = add(path[i], slice);
    const vars = { lo: showNum(path[i], "dec", i + 1), hi: showNum(high, "dec", i + 1) };
    if (cmp(round.target, path[i]) < 0) return bad("slice-right", fill(FB.sliceRight, vars));
    if (cmp(round.target, high) > 0) return bad("slice-left", fill(FB.sliceLeft, vars));
    low = path[i];
  }
  const width = pow10(-z);
  const window = { min: low, max: add(low, width), step: pow10(-(z + 1)) };
  if (cmp(x, window.min) < 0 || cmp(x, window.max) > 0) return bad("off-line", FB.offLine);
  if (cmp(absF(sub(x, round.target)), round.tol) <= 0) return good(FB.zoomOk);
  return bad(
    cmp(x, round.target) > 0 ? "too-right" : "too-left",
    directionAbout("dec", window, x, round.target),
  );
}

const CHECKS = {
  place: checkPlace,
  hop: checkHop,
  round: checkRound,
  order: checkOrder,
  zoom: checkZoom,
};

export function check(round, response) {
  return CHECKS[round.kind](round, response && typeof response === "object" ? response : {});
}
