/**
 * Safely parse a division expression or word problem stem and return a
 * long-division-builder diagram config object if it is a division problem.
 *
 * TWO GUARDS, both from a shipped defect (2026-08-19): lesson 1-1 "Math is
 * Mine" (MPP.3, estimation) mounted the full standard-algorithm Long Division
 * Lab — 2-6's mathematics, complete with its default 1,344 ÷ 12 problem set —
 * because one practice item's post-solve EXPLANATION said "200 ÷ 22 ≈ 9".
 *
 *  1. Only the TASK text is read (stem / prompt / instructions / work /
 *     title). `explanation` is what the student sees AFTER solving; a
 *     division mentioned there is commentary, not the problem, and it was
 *     the only field that put an algorithm workspace on an estimation card.
 *  2. A division stated as an approximation ("200 ÷ 22 ≈ 9", "about 9 per
 *     car") is an estimate to reason about, not an algorithm to execute —
 *     when the matched expression sits next to ≈ or estimation language,
 *     no workspace mounts.
 */
export function extractDivisionDiagram(item) {
  if (!item) return null;
  if (item.diagram && item.diagram.kind === "long-division-builder") return item.diagram;

  const text = `${item.stem || ""} ${item.prompt || ""} ${item.instructions || ""} ${item.work || ""} ${item.title || ""}`;

  const isEstimateContext = (matchIndex, matchLength) => {
    const around = text.slice(Math.max(0, matchIndex - 40), matchIndex + matchLength + 40);
    return /≈|\babout\b|\bestimat|\broughly\b|\bapproximate/i.test(around);
  };

  // 1. Division expression: e.g. "936 ÷ 12", "14.4 ÷ 1.2", "4,928 ÷ 7".
  // A fraction division is NOT one: "3/4 ÷ 1/2" otherwise regex-matches as
  // the whole-number "4 ÷ 1" and mounts a long-division tableau on a
  // fraction-reasoning item (shipped on 6-2's extending prompt).
  const m1 = text.match(/([\d,]+(?:\.\d+)?)\s*÷\s*([\d,]+(?:\.\d+)?)/);
  const touchesFraction =
    m1 && (text[m1.index - 1] === "/" || text[m1.index + m1[0].length] === "/");
  if (m1 && !touchesFraction && !isEstimateContext(m1.index, m1[0].length)) {
    const a = parseFloat(m1[1].replace(/,/g, ""));
    const b = parseFloat(m1[2].replace(/,/g, ""));
    if (!isNaN(a) && !isNaN(b) && b !== 0 && a >= b) {
      return {
        kind: "long-division-builder",
        dividend: a,
        divisor: b,
        decimal: String(m1[1]).includes(".") || String(m1[2]).includes("."),
      };
    }
  }

  // 2. Text phrasing: "divide 2,184 by 14", "divide 1,344 by 12"
  const m2 = text.match(/divide\s+([\d,]+(?:\.\d+)?)\s+(?:by|into)\s+([\d,]+(?:\.\d+)?)/i);
  if (m2 && !isEstimateContext(m2.index, m2[0].length)) {
    const a = parseFloat(m2[1].replace(/,/g, ""));
    const b = parseFloat(m2[2].replace(/,/g, ""));
    if (!isNaN(a) && !isNaN(b) && b !== 0) {
      return {
        kind: "long-division-builder",
        dividend: a,
        divisor: b,
        decimal: String(m2[1]).includes(".") || String(m2[2]).includes("."),
      };
    }
  }

  return null;
}
