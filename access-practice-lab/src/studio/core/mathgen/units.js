// Which verified-problem topics fit a unit. Nothing is guessed: a topic is offered only when the unit's own standard
// codes (or, failing that, its title) name it, and only when that topic is written for the unit's grade.

import { MATH_TOPICS } from "./topics.js";

const GRADE_OF = Object.fromEntries(MATH_TOPICS.map((t) => [t.id, t.grades]));

/** Standard-code prefixes (Common Core) → topics. The longest matching prefix wins for each code. */
const BY_STANDARD = [
  ["6.RP.A.1", ["equivalent-ratios"]],
  ["6.RP.A.2", ["unit-rate"]],
  ["6.RP.A.3", ["equivalent-ratios", "unit-rate", "percent"]],
  ["7.RP.A.1", ["unit-rate"]],
  ["7.RP.A.2", ["equivalent-ratios", "unit-rate"]],
  ["7.RP.A.3", ["percent"]],
  ["4.NF.B.3", ["fraction-add-sub"]],
  ["4.NF.B.4", ["fraction-multiply"]],
  ["5.NF.A", ["fraction-add-sub"]],
  ["5.NF.B.4", ["fraction-multiply"]],
  ["5.NF.B.6", ["fraction-multiply"]],
  ["5.NF.B.7", ["fraction-divide"]],
  ["6.NS.A", ["fraction-divide"]],
  ["4.NF.C", ["decimal-ops"]],
  ["5.NBT.B.7", ["decimal-ops"]],
  ["6.NS.B.3", ["decimal-ops"]],
  ["6.NS.C.5", ["integer-ops"]],
  ["6.NS.C.6", ["integer-ops", "coordinate-plane"]],
  ["6.NS.C.7", ["integer-ops"]],
  ["7.NS.A", ["integer-ops"]],
  ["5.OA.A.1", ["order-of-operations"]],
  ["6.EE.A.1", ["order-of-operations"]],
  ["6.EE.A.2", ["evaluate-expressions"]],
  ["6.EE.B.5", ["one-step-equations"]],
  ["6.EE.B.7", ["one-step-equations"]],
  ["6.EE.B.8", ["inequalities"]],
  ["7.EE.B.4", ["two-step-equations", "inequalities"]],
  ["3.MD.C", ["area-perimeter"]],
  ["3.MD.D.8", ["area-perimeter"]],
  ["4.MD.A.3", ["area-perimeter"]],
  ["6.G.A.1", ["area-perimeter"]],
  ["5.MD.C", ["volume"]],
  ["6.G.A.2", ["volume"]],
  ["6.SP.A.3", ["mean-median-mode-range"]],
  ["6.SP.B.5", ["mean-median-mode-range"]],
  ["5.G.A", ["coordinate-plane"]],
  ["6.G.A.3", ["coordinate-plane"]],
];

/** Title keywords, used only when no standard code matched. */
const BY_TITLE = [
  [/\bratio|\bproportion/i, ["equivalent-ratios"]],
  [/\brate\b|\bunit rate/i, ["unit-rate"]],
  [/\bpercent|\bpercentage/i, ["percent"]],
  [/\bfraction|\bmixed number/i, ["fraction-add-sub", "fraction-multiply", "fraction-divide"]],
  [/\bdecimal/i, ["decimal-ops"]],
  [/\binteger|\bnegative|\bnumber line|\brational number/i, ["integer-ops"]],
  [/\border of operations|\bpemdas|\bexponent/i, ["order-of-operations"]],
  [/\bexpression|\bvariable/i, ["evaluate-expressions"]],
  [/\binequalit/i, ["inequalities"]],
  [/\bequation/i, ["one-step-equations", "two-step-equations"]],
  [/\barea|\bperimeter/i, ["area-perimeter"]],
  [/\bvolume|\bprism/i, ["volume"]],
  [/\bmean\b|\bmedian|\bmode\b|\baverage|\bdata\b/i, ["mean-median-mode-range"]],
  [/\bcoordinate|\bordered pair/i, ["coordinate-plane"]],
];

const MAX_TOPICS = 4;

/**
 * Topic ids for a unit, best match first, at most four.
 * @param {{grade?: string|number, subject?: string, unitTitle?: string, standards?: string[]}} unit
 * Non-math subjects, and grades no matching topic is written for, give [].
 */
export function topicForUnit({ grade, subject, unitTitle = "", standards = [] } = {}) {
  if (subject && subject !== "Math") return [];
  const g = Number(grade);
  const found = new Map();
  const add = (ids, weight) => {
    for (const id of ids) found.set(id, (found.get(id) || 0) + weight);
  };

  for (const raw of standards) {
    const code = String(raw || "").trim();
    let best = null;
    for (const entry of BY_STANDARD) {
      if (code.startsWith(entry[0]) && (!best || entry[0].length > best[0].length)) best = entry;
    }
    if (best) add(best[1], 2);
  }
  if (!found.size) for (const [pattern, ids] of BY_TITLE) if (pattern.test(unitTitle)) add(ids, 1);

  return [...found.entries()]
    .filter(([id]) => !Number.isFinite(g) || GRADE_OF[id].includes(g))
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TOPICS)
    .map(([id]) => id);
}
