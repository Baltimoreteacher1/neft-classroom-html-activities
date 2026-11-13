// "Picture it": one practice problem's stem -> a small bilingual SVG of its GIVENS.
//
//   pictureFor(stem, { topic, lang }) -> { kind, svg, caption: { en, es } } | null
//
// Pure and deterministic (string in, string out, no DOM), so it runs in the browser and in Node. A picture is a
// scaffold, never a giveaway: the unknown is drawn as "?" and no recognizer prints a value the problem asks for.
// Each recognizer is strict and returns null unless the stem reads UNAMBIGUOUSLY as its shape; a wrong picture is
// far worse than none, so precision always wins over coverage.
//
// Recognizers (picture-arith.mjs, picture-plane.mjs, picture-geo.mjs), tried in this order:
//   power, order, equation, fraction-division, percent, coordinates, compare, inequality, dot-plot, area, conversion

import { ALG } from "./picture-alg.mjs";
import { ARITH } from "./picture-arith.mjs";
import { EXTRA } from "./picture-extra.mjs";
import { FACTOR } from "./picture-factor.mjs";
import { GEO } from "./picture-geo.mjs";
import { GROUP } from "./picture-group.mjs";
import { norm, shell } from "./picture-kit.mjs";
import { LINE } from "./picture-line.mjs";
import { MORE } from "./picture-more.mjs";
import { OPS } from "./picture-ops.mjs";
import { PCT } from "./picture-pct.mjs";
import { PLANE } from "./picture-plane.mjs";
import { RATE } from "./picture-rate.mjs";
import { RATIO } from "./picture-ratio.mjs";
import { SCALE } from "./picture-scale.mjs";
import { SHAPE } from "./picture-shape.mjs";
import { SOLID } from "./picture-solid.mjs";
import { SPREAD } from "./picture-spread.mjs";
import { STATS } from "./picture-stats.mjs";

export const RECOGNIZERS = [...ARITH, ...PLANE, ...GEO, ...SOLID, ...RATIO, ...OPS, ...ALG, ...STATS, ...LINE, ...RATE, ...PCT, ...GROUP, ...SHAPE, ...SPREAD, ...MORE, ...FACTOR, ...SCALE, ...EXTRA];

/** Stems that describe a task with several items or a drag/sort board: no single problem to draw. */
const MULTI = /^(sort|match|drag|complete the table|put the steps)|\beach (one|problem|expression|equation|inequality|power)\b/i;

/**
 * Read one stem and return its picture, or null when no recognizer reads it unambiguously.
 * `topic` is a hint only (it can belong to a neighbouring problem), so it never forces a recognizer.
 */
export function pictureFor(stem, { topic = "", lang = "en" } = {}) {
  void topic;
  const L = lang === "es" ? "es" : "en";
  // A game label in front of the problem ("Leg 2: ", "Light Cue 1: ", "Mission 3 — ") is not part of the mathematics.
  const s = norm(stem).replace(/^(?:[A-Z][a-z]+ ){1,2}\d+ ?[:—–] +(?=[A-Z])/, "");
  if (!s || s.length > 400 || MULTI.test(s)) return null;
  for (const r of RECOGNIZERS) {
    const data = r.match(s);
    if (!data) continue;
    const part = r.draw(data, L);
    if (!part) return null;
    const svg = shell({ kind: r.kind, key: s, lang: L, title: part.title[L], desc: part.desc[L], h: part.h, body: part.body });
    return { kind: r.kind, svg, caption: part.caption };
  }
  return null;
}
