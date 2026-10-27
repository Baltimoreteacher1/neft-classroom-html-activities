// Builds a PLACE round (move one marker to a number) from a compact spec, and checks that it is solvable, that the marker
// does not start inside the accepted range, and that every catalogued wrong spot is really wrong and really on the grid.
// @fm2 FM-052 FM-060 FM-061
import { div, frac, sub } from "../../rational.js";
import { pick } from "../../rng.js";
import { makePrompt, tolSentence } from "./copy.js";
import { showNum } from "./format.js";
import { acceptedSpots, at, gridCount, gridIndex, placeAccepts } from "./geometry.js";

export const F = frac;
// Whole numbers lo, lo+by, ... up to hi, as exact fractions (used for tick labels).
export const labelsBy = (lo, hi, by) => {
  const out = [];
  for (let v = lo; v <= hi; v += by) out.push(frac(v));
  return out;
};
export const ints = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);

// Nearest grid position to x (clamped to the line).
export function snap(line, x) {
  const k = div(sub(x, line.min), line.step);
  const nearest = Math.floor((2 * k.n + k.d) / (2 * k.d));
  return at(
    line.min,
    line.step,
    Math.min(gridCount(line.min, line.max, line.step), Math.max(0, nearest)),
  );
}

export function tolText(tol, mode) {
  if (tol.n === 0) return null;
  return showNum(tol, mode === "frac" || mode === "mixed" ? "frac" : "dec");
}

export function buildPlace(spec) {
  const {
    rng,
    skill,
    family,
    level,
    line,
    mode,
    step,
    tol = frac(0),
    target = null,
    radical = null,
    detail = {},
  } = spec;
  const full = { ...line, step };
  const round = {
    skill,
    level,
    kind: "place",
    family,
    line: full,
    mode,
    tol,
    target,
    radical,
    detail,
    marks: spec.marks || [],
    valueText: spec.vars?.v ?? spec.vars?.d ?? "",
    traps: [],
  };
  const count = gridCount(full.min, full.max, step);
  if (!acceptedSpots(round).length)
    throw new RangeError(`${skill}: no grid spot is within the tolerance`);
  const taken = new Set();
  for (const trap of spec.traps || []) {
    const x = trap.snap ? snap(full, trap.x) : trap.x;
    const key = `${x.n}/${x.d}`;
    const index = gridIndex(full.min, step, x);
    if (index === null || index < 0 || index > count || placeAccepts(round, x) || taken.has(key)) continue;
    taken.add(key);
    round.traps.push({ key: trap.key, x });
  }
  // The marker may start anywhere that is neither a right answer nor a catalogued wrong spot.
  const options = [];
  for (let k = 0; k <= count; k += 1) {
    const x = at(full.min, step, k);
    if (!placeAccepts(round, x) && !taken.has(`${x.n}/${x.d}`)) options.push(x);
  }
  round.start = spec.start ?? pick(rng, options.length ? options : [full.min]);
  if (placeAccepts(round, round.start)) round.start = full.min;
  round.prompt = makePrompt(spec.promptKey, spec.vars, tolSentence(tolText(tol, mode)));
  return round;
}
