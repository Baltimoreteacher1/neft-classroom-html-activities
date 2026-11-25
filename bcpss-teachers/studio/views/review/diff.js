// Line diff for the side-by-side view: what the reviewer approved last time vs the content now.
// Pure, no DOM. Classic longest-common-subsequence over pretty-printed JSON lines.

/** Pretty-printed lines of a value with object keys in a stable order. */
export function linesOf(value) {
  const sort = (v) =>
    Array.isArray(v) ? v.map(sort) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(value), null, 2).split("\n");
}

/**
 * Rows for two columns: { left, right, kind } where kind is "same" | "removed" | "added".
 * "removed" rows have only a left side, "added" rows only a right side.
 */
export function diffLines(before, after) {
  const n = before.length;
  const m = after.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = before[i] === after[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const rows = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && before[i] === after[j]) rows.push({ left: before[i++], right: after[j++], kind: "same" });
    else if (j < m && (i >= n || lcs[i][j + 1] >= lcs[i + 1][j])) rows.push({ left: null, right: after[j++], kind: "added" });
    else rows.push({ left: before[i++], right: null, kind: "removed" });
  }
  return rows;
}

export const changedCount = (rows) => rows.filter((r) => r.kind !== "same").length;
