/* One place that knows every hands-on model: how to mount it, what it is called, and the free-play starting setup
 * for each. The Stop 2 challenge and the free-play tabs both go through here. */
import { p } from "./core.js";
import { areaModel, arrayModel, numberLine, tenFrame } from "./models-a.js";
import { baseTen, fractionBars } from "./models-b.js";
import { ratioModel, slopeGraph } from "./models-c.js";

const FACTORIES = {
  tenFrame,
  numberLine,
  arrayModel,
  areaModel,
  fractionBars,
  baseTen,
  ratioModel,
  slopeGraph,
};

/** Mount a model by name. `props` are its options; returns { get, set }. */
export function mountModel(name, host, K, props) {
  const make = FACTORIES[name];
  if (!make) throw new RangeError(`Unknown model: ${name}`);
  return make(host, K, props);
}

/** Free-play tabs: a plain starting setup for each model family, with the grades it suits. */
export const FREE_PLAY = [
  {
    id: "tenFrame",
    label: p("Ten-frame", "Marco de diez"),
    grades: [1, 2],
    props: { initial: { count: 4 } },
  },
  {
    id: "numberLine",
    label: p("Number line", "Recta numérica"),
    grades: [1, 3],
    props: { min: 0, max: 30, start: 5, hops: [5, 1] },
  },
  {
    id: "arrayModel",
    label: p("Array", "Arreglo"),
    grades: [2, 4],
    props: { initial: { rows: 3, cols: 5 } },
  },
  {
    id: "fractionBars",
    label: p("Fraction bars", "Barras de fracciones"),
    grades: [3, 5],
    props: {
      initial: {
        bars: [
          { n: 1, d: 2 },
          { n: 2, d: 4 },
        ],
      },
    },
  },
  {
    id: "baseTen",
    label: p("Base-ten blocks", "Bloques de base diez"),
    grades: [2, 5],
    props: { initial: { h: 1, t: 3, o: 12, decimal: false } },
  },
  {
    id: "ratioModel",
    label: p("Ratio model", "Modelo de razones"),
    grades: [6, 7],
    props: { a: 2, b: 5, nameA: p("red", "rojo"), nameB: p("blue", "azul"), max: 6, unitRow: true },
  },
  {
    id: "slopeGraph",
    label: p("Slope graph", "Gráfica de pendiente"),
    grades: [8, 8],
    props: { x: 2, y: 3, maxX: 8, maxY: 10 },
  },
];

/** The model tab a grade should see first in free play. */
export const defaultTab = (grade) =>
  grade <= 1
    ? "tenFrame"
    : grade === 2
      ? "baseTen"
      : grade === 3
        ? "fractionBars"
        : grade === 4
          ? "arrayModel"
          : grade === 5
            ? "baseTen"
            : grade <= 7
              ? "ratioModel"
              : "slopeGraph";
