/**
 * Safely parse a division expression or word problem stem and return a
 * long-division-builder diagram config object if it is a division problem.
 */
export function extractDivisionDiagram(item) {
  if (!item) return null;
  if (item.diagram && item.diagram.kind === "long-division-builder") return item.diagram;

  const text = `${item.stem || ""} ${item.prompt || ""} ${item.instructions || ""} ${item.work || ""} ${item.explanation || ""} ${item.title || ""}`;

  // 1. Division expression: e.g. "936 ÷ 12", "14.4 ÷ 1.2", "4,928 ÷ 7"
  const m1 = text.match(/([\d,]+(?:\.\d+)?)\s*÷\s*([\d,]+(?:\.\d+)?)/);
  if (m1) {
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
  if (m2) {
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
