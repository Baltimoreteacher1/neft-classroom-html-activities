// The game's own solution for a round: one response check() accepts, and the answer as short text. @fm2 FM-017 FM-060
import { add, cmp, div, frac, mul, sub } from "../../rational.js";
import { MINUS, placesOf, showNum } from "./format.js";
import { absF, acceptedSpots, at, floorOf } from "./geometry.js";

const pow10 = (e) => (e >= 0 ? frac(10 ** e) : frac(1, 10 ** -e));
const nearestOf = (round) =>
  cmp(sub(round.value, round.lo), sub(round.hi, round.value)) < 0 ? round.lo : round.hi;
const floorSpot = (line, v) => at(line.min, line.step, floorOf(div(sub(v, line.min), line.step)));

export const hopText = (h) => `${h.n < 0 ? MINUS : "+"}${showNum(absF(h), "dec")}`;
export const planText = (round) =>
  round.plan
    .map((h) =>
      round.mode === "frac" ? `${h.n < 0 ? MINUS : "+"}${showNum(absF(h), "frac")}` : hopText(h),
    )
    .join(" ");

export function zoomPath(round) {
  const { z, outerMin } = round.zoom;
  let low = outerMin;
  const path = [];
  for (let i = 0; i < z; i += 1) {
    const slice = pow10(-(i + 1));
    low = add(low, mul(slice, frac(floorOf(div(sub(round.target, low), slice)))));
    path.push(low);
  }
  return path;
}

export function solve(round) {
  switch (round.kind) {
    case "place":
      return { x: acceptedSpots(round)[0] };
    case "hop":
      return { hops: round.plan };
    case "round":
      return { x: round.value, pick: nearestOf(round) };
    case "order":
      return { xs: round.items.map((item) => floorSpot(round.line, item.v)) };
    default:
      return { path: zoomPath(round), x: round.target };
  }
}

export function answerText(round) {
  switch (round.kind) {
    case "place":
      return showNum(acceptedSpots(round)[0], round.mode, placesOf(round.line.step));
    case "hop":
      return planText(round);
    case "round":
      return showNum(nearestOf(round), round.mode);
    case "order":
      return [...round.items]
        .sort((a, b) => cmp(a.v, b.v))
        .map((item) => item.text)
        .join(" < ");
    default:
      return showNum(round.target, "dec", round.detail.digits);
  }
}

