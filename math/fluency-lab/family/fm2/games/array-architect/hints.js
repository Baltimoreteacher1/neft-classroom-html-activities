// Tiered hints: tier 0 nudges, tier 1 names a strategy, tier 2 works a PARALLEL example with different numbers, tier 3
// states the solution. Tiers 0-2 are screened against every form of the answer; a candidate that would leak it is
// skipped for the next one. @fm2 FM-032 FM-062 FM-020
import { classesOf, measure } from "./measure.js";
import { answerText, secrets, solve } from "./logic.js";
import { planModel } from "./model.js";
import { polyText } from "./poly.js";

import { GENERIC, H, TIER01 } from "./hints-text.js";
import { TIER2 } from "./hints-examples.js";

function modeOf(round) {
  const t = round.task;
  if (round.kind === "rect") {
    if (round.skillId === "g1-repeat-add") return round.level === 3 ? "skip" : "repeat";
    if (t.maxArea) return "maxArea";
    if (t.rows != null && t.cols != null) return "dims";
    if (t.area != null && t.perim != null) return "areaPerim";
    if (t.area != null && t.side != null) return "areaSide";
    if (t.perim != null && t.side != null) return "perimSide";
    if (t.perim != null) return "perim";
    if (t.area != null && (t.rows != null || t.cols != null)) return "areaRows";
    return "areaOnly";
  }
  if (round.kind === "paint") return t.rule;
  if (round.kind === "collect") return t.mode;
  if (round.kind === "model") {
    if (t.mode === "poly") return t.rows.parts.length === 1 ? "polyOne" : "polyTwo";
    if (t.rows.mode !== "none") return "twoDigit";
    return t.cols.mode === "given"
      ? "given"
      : t.cols.mode === "free"
        ? "free"
        : t.cols.whole.includes(".")
          ? "decimal"
          : "place";
  }
  if (round.kind === "prism")
    return t.rows != null ? "prismBuild" : t.layers != null ? "prismLayers" : "prismAny";
  if (round.kind === "tiling") return t.mode;
  return round.kind;
}

const rot = (list, round) => {
  const seed = JSON.stringify(round.task).length + (round.grid?.rows || 0) + round.level;
  return list.map((_, i) => list[(i + seed) % list.length]);
};
function explanation(round, mode) {
  const t = round.task;
  const s = solve(round);
  const m = s.cells ? measure(s.cells) : null;
  switch (mode) {
    case "dims":
    case "repeat":
    case "skip":
      return H(
        `Set ${m.rows} rows and ${m.cols} columns. ${m.rows} rows of ${m.cols} make ${m.area}.`,
        `Fija ${m.rows} filas y ${m.cols} columnas. ${m.rows} filas de ${m.cols} hacen ${m.area}.`,
      );
    case "areaOnly":
    case "areaRows":
      return H(
        `${m.area} in ${m.rows} equal rows is ${m.cols} in each row. Other pairs of numbers that multiply to ${m.area} work too.`,
        `${m.area} en ${m.rows} filas iguales son ${m.cols} en cada fila. También sirven otros pares de números que se multiplican para dar ${m.area}.`,
      );
    case "perim":
    case "perimSide":
    case "areaPerim":
    case "areaSide":
    case "maxArea":
      return H(
        `A ${m.rows} by ${m.cols} rectangle has an area of ${m.area} and a perimeter of ${m.perimeter}.`,
        `Un rectángulo de ${m.rows} por ${m.cols} tiene un área de ${m.area} y un perímetro de ${m.perimeter}.`,
      );
    case "count":
      return H(
        `Tap ${t.total} squares${t.perRow ? `, ${t.perRow} in each row` : ""}.`,
        `Toca ${t.total} cuadros${t.perRow ? `, ${t.perRow} en cada fila` : ""}.`,
      );
    case "pairs":
      return H(
        `${t.total} counters make ${Math.floor(t.total / 2)} pairs with ${t.total % 2} left over, so it is ${s.parity}.`,
        `${t.total} fichas forman ${Math.floor(t.total / 2)} parejas con ${t.total % 2} sobrante(s), así que es ${s.parity === "odd" ? "impar" : "par"}.`,
      );
    case "target":
      return H(
        `Cover every square. There are ${t.shape.length} tiles, so the area is ${t.shape.length} square units.`,
        `Cubre cada cuadro. Hay ${t.shape.length} baldosas, así que el área es de ${t.shape.length} unidades cuadradas.`,
      );
    case "decompose": {
      const areas = [...classesOf(s.cells).values()].map((list) => list.length);
      return H(
        `Cut the shape into rectangles with areas ${areas.join(" + ")}. They add to ${t.shape.length}.`,
        `Corta la figura en rectángulos con áreas ${areas.join(" + ")}. Suman ${t.shape.length}.`,
      );
    }
    case "factors":
      return H(
        `Try each number of rows from 1 up and keep the ones that share ${t.area} evenly.`,
        `Prueba cada cantidad de filas desde 1 y quédate con las que reparten ${t.area} en partes iguales.`,
      );
    case "commute":
      return H(
        `Add the array and then its turned copy.`,
        "Agrega la matriz y luego su copia girada.",
      );
    case "turns":
      return H(
        `Find each pair with both sides at least 2, and add each pair turned both ways.`,
        "Encuentra cada par con los dos lados de al menos 2 y agrega cada par girado de las dos maneras.",
      );
    case "given":
    case "place":
    case "free":
    case "decimal":
    case "twoDigit":
    case "polyOne":
    case "polyTwo": {
      const plan = planModel(round, s.cuts);
      const parts = plan.flat.map((r) => `${r.label} = ${r.text}`).join("; ");
      return H(
        `The regions are ${parts}. Adding them gives the total.`,
        `Las regiones son ${parts}. Al sumarlas se obtiene el total.`,
      );
    }
    case "prismBuild":
    case "prismLayers":
    case "prismAny":
      return H(
        `${s.layers} layers of ${m.rows} by ${m.cols} make ${s.layers * m.area} cubes.`,
        `${s.layers} capas de ${m.rows} por ${m.cols} hacen ${s.layers * m.area} cubos.`,
      );
    case "scale":
      return H(
        `Both sides are multiplied by the factor, so the new rectangle is ${m.rows} by ${m.cols}. The area changes by the factor times itself.`,
        `Los dos lados se multiplican por el factor, así que el rectángulo nuevo mide ${m.rows} por ${m.cols}. El área cambia por el factor multiplicado por sí mismo.`,
      );
    case "gcf":
      return H(
        `The largest square tile that fits both ${t.a} and ${t.b} exactly is ${s.s} by ${s.s}.`,
        `La baldosa cuadrada más grande que cabe exacto en ${t.a} y en ${t.b} es de ${s.s} por ${s.s}.`,
      );
    case "lcm":
      return H(
        `The smallest number that both ${t.a} and ${t.b} divide into evenly is ${s.s}, so the square's side is ${s.s}.`,
        `El número más pequeño que ${t.a} y ${t.b} dividen exacto es ${s.s}, así que el lado del cuadrado es ${s.s}.`,
      );
    default: {
      const side = (p) => polyText(p);
      return H(
        `A width of ${side(s.w)} and a height of ${side(s.h)} multiply to ${side(round.task.target)}, so every tile is used.`,
        `Un ancho de ${side(s.w)} y un alto de ${side(s.h)} se multiplican para dar ${side(round.task.target)}, así que se usa cada ficha.`,
      );
    }
  }
}

const ANSWER = H("Answer", "Respuesta");

const standalone = (text, secret) => {
  const body = secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(/^[\d-]/.test(secret) ? `(?<![\\d.])${body}(?![\\d.])` : body, "i").test(text);
};
const leaks = (hint, list) =>
  list.some((secret) => secret && (standalone(hint.en, secret) || standalone(hint.es, secret)));

// An example built from the round's own numbers is not parallel: it would just be the solution.
const sameNumbers = (round, h) => {
  const given = [...new Set(round.prompt.en.match(/\d+(?:\.\d+)?/g) || [])];
  return given.length > 0 && given.every((n) => standalone(h.en, n));
};

export function hint(round, tier) {
  const mode = modeOf(round);
  const clean = Math.max(0, Math.min(3, tier));
  if (clean === 3) {
    const base = explanation(round, mode);
    const answer = answerText(round);
    return { en: `${base.en} ${ANSWER.en}: ${answer}.`, es: `${base.es} ${ANSWER.es}: ${answer}.` };
  }
  const banned = secrets(round);
  const pool = clean === 2 ? rot(TIER2[mode](round), round) : [TIER01[mode][clean]];
  return pool.find((h) => !leaks(h, banned) && !(clean === 2 && sameNumbers(round, h))) || GENERIC[clean];
}

