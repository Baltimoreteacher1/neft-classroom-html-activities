// Registry: which engine explains a problem, and which simulator lets a learner explore its idea.
// An engine is chosen from the problem's own numbers (never from a hard-coded answer), so any generated
// problem with a supported shape gets a real, validated model. Problems without a model get the worded
// steps as a player, and the coverage table says so plainly.
import { L, esc, frame, num, svgWrap, txt } from "./core.js";
import * as area from "./engine-area.js";
import * as balance from "./engine-balance.js";
import * as digits from "./engine-digits.js";
import * as factors from "./engine-factors.js";
import * as fraction from "./engine-fraction.js";
import * as fracmul from "./engine-fracmul.js";
import * as graph from "./engine-graph.js";
import * as hops from "./engine-hops.js";
import * as line from "./engine-line.js";
import * as place from "./engine-place.js";
import * as power from "./engine-power.js";
import * as ratio from "./engine-ratio.js";
import * as round from "./engine-round.js";
import { peekCap } from "../step-leak.js";

export const ENGINES = {
  place: { id: "place", label: L("Place value", "Valor posicional"), ...place },
  fraction: { id: "fraction", label: L("Fraction bars", "Barras de fracciones"), ...fraction },
  line: { id: "line", label: L("Number line", "Recta numérica"), ...line },
  balance: { id: "balance", label: L("Balance scale", "Balanza"), ...balance },
  ratio: { id: "ratio", label: L("Ratio table", "Tabla de razones"), ...ratio },
  fracmul: { id: "fracmul", label: L("Area grid", "Cuadrícula de área"), ...fracmul },
  round: { id: "round", label: L("Rounding line", "Recta de redondeo"), ...round },
  digits: { id: "digits", label: L("Place-value columns", "Columnas de valor posicional"), ...digits },
  hops: { id: "hops", label: L("Number line hops", "Saltos en la recta"), ...hops },
  power: { id: "power", label: L("Powers and roots", "Potencias y raíces"), ...power },
  factors: { id: "factors", label: L("Factor and multiple lists", "Listas de factores y múltiplos"), ...factors },
  graph: { id: "graph", label: L("Coordinate grid and machine", "Cuadrícula y máquina"), ...graph },
  area: { id: "area", label: L("Arrays and area", "Arreglos y área"), ...area },
};
const ORDER = ["place", "fraction", "fracmul", "round", "digits", "hops", "power", "factors", "graph", "line", "balance", "ratio", "area"];

// Worded steps as frames, for skills with no manipulable model yet.
const wrapText = (text, width = 46) => {
  const lines = [];
  let cur = "";
  for (const word of String(text).split(/\s+/)) {
    if (`${cur} ${word}`.trim().length > width) {
      lines.push(cur);
      cur = word;
    } else cur = `${cur} ${word}`.trim();
  }
  return [...lines, cur].filter(Boolean);
};
const stepsEngine = {
  id: "steps",
  label: L("Worked steps", "Pasos resueltos"),
  frames(spec) {
    const steps = spec.item.steps || [];
    return steps.map((s, i) => {
      const lines = wrapText(String(s).replace(/<[^>]+>/g, ""));
      const body =
        txt(280, 40, spec.item.question, { size: 15, fill: "#64748b" }) +
        lines.map((ln, j) => txt(280, 110 + j * 30, ln, { size: 22 })).join("");
      const alt = L(`Step ${i + 1}: ${lines.join(" ")}`, `Paso ${i + 1}: ${lines.join(" ")}`);
      return Object.assign(
        frame({
          id: `s${i}`,
          cap: L(String(s), String(s)),
          easy: null,
          eq: "",
          svg: svgWrap(body, alt.en, { h: 200 }),
          alt,
        }),
        { meta: {} },
      );
    });
  },
  predicts: () => [],
  hints(spec) {
    const cap = Math.max(0, peekCap(spec.item));
    const list = this.frames(spec);
    const t = (i) => (list[i] ? list[i].cap : null);
    return [
      {
        text: L(
          spec.item.hint || "Think about what the problem asks, then try one small step.",
          spec.item.hint || "Piensa qué pide el problema y prueba un paso pequeño.",
        ),
      },
      cap > 0 && t(0)
        ? { text: t(0), frame: list[0] }
        : {
            text: L(
              "Write what you know. Then choose the first step.",
              "Escribe lo que sabes. Luego elige el primer paso.",
            ),
          },
      cap > 1 && t(1)
        ? { text: t(1), frame: list[1] }
        : {
            text: L(
              "Try the first step on paper and keep going from there.",
              "Prueba el primer paso en papel y sigue desde ahí.",
            ),
          },
    ];
  },
  diagnose: () => null,
  tags: {},
};

export function lessonFor(item) {
  const q = item?.question;
  if (typeof q !== "string") return null;
  for (const id of ORDER) {
    const spec = ENGINES[id].parse(q);
    if (spec) return { engine: ENGINES[id], spec, modeled: true };
  }
  if ((item.steps || []).length >= 2)
    return { engine: stepsEngine, spec: { item }, modeled: false };
  return null;
}

export const repsOf = (lesson) => lesson.spec.reps || ["main"];
export const framesOf = (lesson, rep) =>
  lesson.engine.frames(lesson.spec, rep === "main" ? undefined : rep);
export const hasBuild = (lesson) =>
  Boolean(
    lesson.engine.build &&
    (lesson.engine.build.available ? lesson.engine.build.available(lesson.spec) : true),
  );

export function diagnose(lesson, raw) {
  const tag = lesson.engine.diagnose?.(lesson.spec, lesson.engine.id === "place" ? num(raw) : raw);
  return tag ? { id: tag, ...lesson.engine.tags[tag] } : null;
}

// Skills whose idea has a simulator, keyed by skill id.
export const SIM_FOR = {
  "fraction-equivalence": "fracEquiv",
  "fraction-equiv": "fracEquiv",
  ratios: "proportional",
  proportions: "proportional",
  "unit-rates": "proportional",
  "unit-rate": "proportional",
  percent: "proportional",
  "scale-drawing": "proportional",
  functions: "machine",
  "linear-equations": "machine",
  slope: "machine",
  area: "areaPerim",
  perimeter: "areaPerim",
  volume: "volume",
  "angle-relations": "angles",
  "interpret-data": "dotplot",
  probability: "dotplot",
  association: "dotplot",
};

export const describe = (lesson) =>
  lesson.modeled ? lesson.engine.label : L("Worked steps", "Pasos resueltos");
export { esc };
