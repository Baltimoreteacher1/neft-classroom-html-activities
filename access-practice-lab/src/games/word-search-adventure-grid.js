// Word Search Adventure: pure grid helpers (no DOM). Seeded placement, straight-line selection and spelling.
// Words are placed forward along the band's directions; a selection may be made in either order (first letter ->
// last letter, or the reverse) and is accepted when the straight line between the two taps spells the word.

export const DIRS = { across: [0, 1], down: [1, 0], diag: [1, 1], up: [-1, 1] };
const FILL = "ABCDEFGHIJKLMNOPRSTUVWY";

/** All cells of a word placed at `at` going `dir` (a DIRS key). */
export const cellsOf = (w) => {
  const [dr, dc] = DIRS[w.dir];
  return [...w.word].map((_, k) => [w.at[0] + dr * k, w.at[1] + dc * k]);
};

/** Cells on the straight line from a to b, or null when the line is not one of the allowed directions (either way). */
export function lineBetween(a, b, dirNames) {
  const dr = Math.sign(b[0] - a[0]);
  const dc = Math.sign(b[1] - a[1]);
  const lr = Math.abs(b[0] - a[0]);
  const lc = Math.abs(b[1] - a[1]);
  if (!lr && !lc) return null;
  if (lr && lc && lr !== lc) return null;
  const ok = dirNames.some((n) => {
    const [r, c] = DIRS[n];
    return (r === dr && c === dc) || (r === -dr && c === -dc);
  });
  if (!ok) return null;
  const len = Math.max(lr, lc) + 1;
  return Array.from({ length: len }, (_, k) => [a[0] + dr * k, a[1] + dc * k]);
}

export const spell = (rows, cells) => cells.map(([r, c]) => rows[r][c]).join("");

/** How many times `word` can be read along the allowed directions, forward or backward. */
function occurrences(rows, word, dirNames) {
  const n = rows.length;
  const rev = [...word].reverse().join("");
  let count = 0;
  for (const name of dirNames) {
    const [dr, dc] = DIRS[name];
    for (let r = 0; r < n; r += 1)
      for (let c = 0; c < n; c += 1) {
        const er = r + dr * (word.length - 1);
        const ec = c + dc * (word.length - 1);
        if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
        const got = spell(
          rows,
          Array.from({ length: word.length }, (_, k) => [r + dr * k, c + dc * k]),
        );
        if (got === word) count += 1;
        if (got === rev && rev !== word) count += 1;
      }
  }
  return count;
}

/**
 * Place every word in a size x size grid with the seeded `random` (engine rng). Longest words first; overlaps only
 * where letters agree; the filled grid must contain each word exactly once. Throws if no grid is found.
 * Returns { rows: string[], at: { WORD: { at: [r, c], dir } } }.
 */
export function placeWords(words, size, dirNames, random) {
  const order = [...words].sort((a, b) => b.length - a.length || (a < b ? -1 : 1));
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const g = Array.from({ length: size }, () => Array(size).fill(""));
    const at = {};
    let ok = true;
    for (const w of order) {
      const options = [];
      for (const name of dirNames) {
        const [dr, dc] = DIRS[name];
        for (let r = 0; r < size; r += 1)
          for (let c = 0; c < size; c += 1) {
            const er = r + dr * (w.length - 1);
            const ec = c + dc * (w.length - 1);
            if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
            let fits = true;
            let shared = 0;
            for (let k = 0; k < w.length && fits; k += 1) {
              const cur = g[r + dr * k][c + dc * k];
              if (cur && cur !== w[k]) fits = false;
              else if (cur) shared += 1;
            }
            if (fits && shared < w.length - 1) options.push({ r, c, name });
          }
      }
      if (!options.length) {
        ok = false;
        break;
      }
      const p = options[random.int(options.length)];
      const [dr, dc] = DIRS[p.name];
      for (let k = 0; k < w.length; k += 1) g[p.r + dr * k][p.c + dc * k] = w[k];
      at[w] = { at: [p.r, p.c], dir: p.name };
    }
    if (!ok) continue;
    const rows = g.map((row) => row.map((ch) => ch || FILL[random.int(FILL.length)]).join(""));
    if (words.every((w) => occurrences(rows, w, dirNames) === 1)) return { rows, at };
  }
  throw new Error(`word search: could not place ${words.join(", ")} in ${size}x${size}`);
}
