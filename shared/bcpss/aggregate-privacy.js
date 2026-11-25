// Anonymous aggregate privacy helper (D14: minimum cell size 10).
// Pure ESM — groups anonymous counts and suppresses any cell with count < MIN_CELL_SIZE.
// Never returns raw student, alias, or row-level records.

export const MIN_CELL_SIZE = 10;

const SUPPRESSED_DISPLAY = `<${MIN_CELL_SIZE} (suppressed)`;

function extractKey(row, groupKey) {
  if (typeof groupKey === "function") {
    const value = groupKey(row);
    return value === null || value === undefined || String(value).trim() === ""
      ? "unknown"
      : String(value).trim();
  }
  if (row && typeof row === "object" && groupKey in row) {
    const value = row[groupKey];
    return value === null || value === undefined || String(value).trim() === ""
      ? "unknown"
      : String(value).trim();
  }
  return "unknown";
}

function formatCell(key, rawCount) {
  const suppressed = rawCount < MIN_CELL_SIZE;
  return {
    key,
    suppressed,
    count: suppressed ? null : rawCount,
    display: suppressed ? SUPPRESSED_DISPLAY : String(rawCount),
  };
}

/**
 * Group anonymous rows by `groupKey` (property name or selector function) and
 * enforce the D14 minimum cell size (10). Cells with count < 10 are suppressed
 * (`suppressed: true, count: null, display: "<10 (suppressed)"`).
 * Raw rows and any student/alias fields are never included in the output.
 */
export function summarizeAggregate(rows, groupKey) {
  if (!Array.isArray(rows)) {
    throw new TypeError("summarizeAggregate expects an array of rows.");
  }
  if (
    typeof groupKey !== "function" &&
    (typeof groupKey !== "string" || groupKey.trim().length === 0)
  ) {
    throw new TypeError("summarizeAggregate expects a non-empty string or function groupKey.");
  }

  const counts = new Map();
  for (const row of rows) {
    const key = extractKey(row, groupKey);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const cells = [...counts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rawCount]) => formatCell(key, rawCount));

  const totalRaw = rows.length;
  const totalSuppressed = totalRaw > 0 && totalRaw < MIN_CELL_SIZE;

  return {
    minCellSize: MIN_CELL_SIZE,
    totalSuppressed,
    totalCount: totalSuppressed ? null : totalRaw,
    totalDisplay: totalSuppressed ? SUPPRESSED_DISPLAY : String(totalRaw),
    cells,
  };
}
