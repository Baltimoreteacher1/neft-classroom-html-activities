// Number Line Quest: the skill table and the pure functions of the game contract. A round is a pure function of
// (skillId, level, rng, grade) and plain JSON, so a seed rebuilds it exactly. @fm2 FM-012 FM-017 FM-019 FM-061 FM-065
import { STRAND } from "./copy.js";
import { g1Hops, g2Skip, g7Hops, kHop } from "./gen-hop.js";
import { g3Round, g5Order, g5Round, g5Zoom, g6Order } from "./gen-other.js";
import {
  g1Place,
  g2EvenOdd,
  g2Place,
  g3Fractions,
  g4Equivalent,
  g4FracDec,
  kNext,
  kPlace,
} from "./gen-place.js";
import {
  g6Integers,
  g6Opposite,
  g7Distance,
  g7HopPlace,
  g8Roots,
  g8Scientific,
} from "./gen-upper.js";

export { answerText, solve } from "./answer.js";
export { check } from "./check.js";
export { hint } from "./hints.js";

const S = (en, es) => ({ en, es });
const skill = (id, strand, title, grades, standard, make) => ({
  id,
  strand,
  title,
  grades,
  standard,
  make,
});

export const SKILL_SPECS = [
  skill(
    "k-next-on-line",
    STRAND.count,
    S("Count on and back on the line", "Contar hacia adelante y hacia atrás en la recta"),
    [0, 0],
    "K.CC.A.2",
    kNext,
  ),
  skill(
    "k-place-to-20",
    STRAND.place,
    S("Place numbers to 20", "Ubicar números hasta el 20"),
    [0, 0],
    "K.CC.A.3",
    kPlace,
  ),
  skill(
    "k-hop-count",
    STRAND.hop,
    S("Hop to the goal by counting", "Saltar a la meta contando"),
    [0, 1],
    "1.OA.C.5",
    kHop,
  ),
  skill(
    "g1-place-100",
    STRAND.place,
    S("Place numbers to 100", "Ubicar números hasta el 100"),
    [1, 1],
    "1.NBT.A.1",
    g1Place,
  ),
  skill(
    "g1-hop-tens-ones",
    STRAND.hop,
    S("Hop by tens and ones", "Saltar de diez en diez y de uno en uno"),
    [1, 2],
    "1.NBT.C.4",
    g1Hops,
  ),
  skill(
    "g2-skip-hops",
    STRAND.hop,
    S("Skip-counting hops", "Saltos de conteo salteado"),
    [2, 2],
    "2.NBT.A.2",
    g2Skip,
  ),
  skill(
    "g2-place-1000",
    STRAND.place,
    S("Place numbers to 1000", "Ubicar números hasta el 1000"),
    [2, 2],
    "2.NBT.A.1",
    g2Place,
  ),
  skill(
    "g2-even-odd",
    STRAND.count,
    S("Even and odd on the line", "Pares e impares en la recta"),
    [2, 2],
    "2.OA.C.3",
    g2EvenOdd,
  ),
  skill(
    "g3-fractions-line",
    STRAND.frac,
    S("Fractions on a number line", "Fracciones en la recta numérica"),
    [3, 3],
    "3.NF.A.2",
    g3Fractions,
  ),
  skill(
    "g3-round-nearest",
    STRAND.round,
    S("Round to the nearest 10 or 100", "Redondear a la decena o centena más cercana"),
    [3, 3],
    "3.NBT.A.1",
    g3Round,
  ),
  skill(
    "g4-frac-dec",
    STRAND.dec,
    S("Decimals and mixed numbers on a line", "Decimales y números mixtos en la recta"),
    [4, 4],
    "4.NF.C.6",
    g4FracDec,
  ),
  skill(
    "g4-equivalent-positions",
    STRAND.frac,
    S("Equivalent fractions share a spot", "Las fracciones equivalentes comparten lugar"),
    [4, 4],
    "4.NF.A.1",
    g4Equivalent,
  ),
  skill(
    "g5-zoom-decimals",
    STRAND.dec,
    S("Zoom in to place decimals", "Acercarse para ubicar decimales"),
    [5, 5],
    "5.NBT.A.3",
    g5Zoom,
  ),
  skill(
    "g5-round-decimals",
    STRAND.round,
    S("Round decimals on a line", "Redondear decimales en la recta"),
    [5, 5],
    "5.NBT.A.4",
    g5Round,
  ),
  skill(
    "g5-order-decimals",
    STRAND.dec,
    S("Order decimals on a line", "Ordenar decimales en la recta"),
    [5, 5],
    "5.NBT.A.3b",
    g5Order,
  ),
  skill(
    "g6-integers-rationals",
    STRAND.rational,
    S("Integers and rational numbers", "Enteros y números racionales"),
    [6, 6],
    "6.NS.C.6c",
    g6Integers,
  ),
  skill(
    "g6-opposite-absolute",
    STRAND.rational,
    S("Opposites and distance from zero", "Opuestos y distancia al cero"),
    [6, 6],
    "6.NS.C.6a",
    g6Opposite,
  ),
  skill(
    "g6-order-rationals",
    STRAND.rational,
    S("Order rational numbers", "Ordenar números racionales"),
    [6, 6],
    "6.NS.C.7a",
    g6Order,
  ),
  skill(
    "g7-hop-rationals",
    STRAND.rational,
    S("Hop with rational numbers", "Saltar con números racionales"),
    [7, 7],
    "7.NS.A.1b",
    g7Hops,
  ),
  skill(
    "g7-hop-place",
    STRAND.rational,
    S("Add and subtract on the line", "Sumar y restar en la recta"),
    [7, 7],
    "7.NS.A.1d",
    g7HopPlace,
  ),
  skill(
    "g7-distance-between",
    STRAND.rational,
    S("Distance between points", "Distancia entre puntos"),
    [7, 7],
    "7.NS.A.1c",
    g7Distance,
  ),
  skill(
    "g8-square-roots",
    STRAND.real,
    S("Place square roots", "Ubicar raíces cuadradas"),
    [8, 8],
    "8.NS.A.2",
    (rng, level) => g8Roots(rng, level, 2),
  ),
  skill(
    "g8-cube-roots",
    STRAND.real,
    S("Place cube roots", "Ubicar raíces cúbicas"),
    [8, 8],
    "8.EE.A.2",
    (rng, level) => g8Roots(rng, level, 3),
  ),
  skill(
    "g8-scientific-positions",
    STRAND.real,
    S("Scientific notation on a line", "Notación científica en la recta"),
    [8, 8],
    "8.EE.A.3",
    g8Scientific,
  ),
];

export function makeRound(skillId, level, rng, grade) {
  const spec = SKILL_SPECS.find((s) => s.id === skillId);
  if (!spec) throw new RangeError(`Unknown skill ${skillId}`);
  const clamped = Math.min(3, Math.max(1, Number(level) || 1));
  const g = Math.min(
    spec.grades[1],
    Math.max(spec.grades[0], Number.isInteger(grade) ? grade : spec.grades[0]),
  );
  return spec.make(rng, clamped, g);
}
