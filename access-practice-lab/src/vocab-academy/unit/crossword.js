// Vocabulary Academy — the unit crossword. Pure: no DOM, no storage. Deterministic for a seed.
//
//   buildCrossword(words, { seed, max, span }) -> { rows, cols, entries:[{ num, dir, row, col, answer, clue, wordId, hw }],
//                                             cells:[[{ ch, num } | null]], placed, skipped }
//
// The answers are the headwords themselves (letters only, 3 to 13 letters), placed so that every word after the first
// crosses one already on the grid, no two words touch except where they cross, and no word runs into another. The clue
// is the word's meaning; when the meaning contains the word, the clue is its sentence with a blank instead.
import { rngFor } from "../rng.js";

const letters = (hw) => String(hw || "").toUpperCase();
const usable = (w) => /^[a-z]{3,13}$/i.test(String(w.hw || "")) && Boolean(w.def);
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A clue that never prints the answer. Pure. */
export function clueFor(w) {
  const has = (t) => new RegExp(`\\b${reEsc(String(w.hw))}`, "i").test(String(t || ""));
  if (w.def && !has(w.def)) return String(w.def).trim();
  const s = w.cloze?.s || "";
  if (s.includes("___") && !has(s)) return s.trim();
  const ex = String(w.ex || "");
  if (ex) return ex.replace(new RegExp(`\\b${reEsc(String(w.hw))}\\w*`, "gi"), "___").trim();
  return "";
}

/** Choose up to `max` words, taking them in turn from each lesson so every lesson is in the puzzle. Pure. */
export function pickWords(lessons, max, rng) {
  const pools = lessons.map((ws) => rng.shuffle(ws.filter(usable)));
  const out = [];
  for (let round = 0; out.length < max && pools.some((p) => p.length > round); round++)
    for (const p of pools) if (p[round] && out.length < max) out.push(p[round]);
  return out;
}

function fits(grid, word, r, c, dir) {
  const dr = dir === "down" ? 1 : 0;
  const dc = dir === "down" ? 0 : 1;
  const at = (y, x) => grid.get(`${y},${x}`);
  if (at(r - dr, c - dc) || at(r + dr * word.length, c + dc * word.length)) return -1;
  let crossings = 0;
  for (let i = 0; i < word.length; i++) {
    const y = r + dr * i;
    const x = c + dc * i;
    const cell = at(y, x);
    if (cell) {
      if (cell.ch !== word[i] || cell[dir]) return -1;
      crossings++;
      continue;
    }
    // a new letter may not sit beside another word's letter (that would spell a non-word)
    if (at(y + dc, x + dr) || at(y - dc, x - dr)) return -1;
  }
  return crossings;
}

function put(grid, word, r, c, dir) {
  const dr = dir === "down" ? 1 : 0;
  const dc = dir === "down" ? 0 : 1;
  for (let i = 0; i < word.length; i++) {
    const k = `${r + dr * i},${c + dc * i}`;
    const cell = grid.get(k) || { ch: word[i] };
    cell[dir] = true;
    grid.set(k, cell);
  }
}

/** Build the puzzle: several seeded layouts, keeping the one that places the most words (then the smallest). */
export function buildCrossword(words, { seed = "crossword", max = 14, span = 15, tries = 12 } = {}) {
  let best = null;
  for (let t = 0; t < tries; t++) {
    const p = layout(words, { seed: `${seed}#${t}`, max, span });
    if (!best || p.placed > best.placed || (p.placed === best.placed && p.rows * p.cols < best.rows * best.cols))
      best = p;
    if (best.placed >= max) break;
  }
  return best;
}

function layout(words, { seed, max, span }) {
  const rng = rngFor(String(seed));
  const list = [...words].filter(usable);
  const order = rng.shuffle(list).sort((a, b) => b.hw.length - a.hw.length);
  const grid = new Map();
  const placed = [];
  const skipped = [];
  for (const w of order) {
    if (placed.length >= max) break;
    const word = letters(w.hw);
    if (!placed.length) {
      put(grid, word, 0, 0, "across");
      placed.push({ w, word, r: 0, c: 0, dir: "across" });
      continue;
    }
    let best = null;
    for (const p of placed)
      for (let i = 0; i < p.word.length; i++)
        for (let j = 0; j < word.length; j++) {
          if (p.word[i] !== word[j]) continue;
          const dir = p.dir === "across" ? "down" : "across";
          const r = p.dir === "across" ? p.r - j : p.r + i;
          const c = p.dir === "across" ? p.c + i : p.c - j;
          const x = fits(grid, word, r, c, dir);
          if (x < 1) continue;
          // prefer more crossings, then a squarer grid
          const ends = (q) => [q.r + (q.dir === "down" ? q.word.length - 1 : 0), q.c + (q.dir === "across" ? q.word.length - 1 : 0)];
          const me = { r, c, dir, word };
          const all = [...placed, me];
          const ys = all.flatMap((q) => [q.r, ends(q)[0]]);
          const xs = all.flatMap((q) => [q.c, ends(q)[1]]);
          const h = Math.max(...ys) - Math.min(...ys);
          const wd = Math.max(...xs) - Math.min(...xs);
          if (h >= span || wd >= span) continue; // keep the grid small enough for a phone
          const score = x * 100 - (h + wd) - Math.abs(h - wd);
          if (!best || score > best.score) best = { r, c, dir, score };
        }
    if (best) {
      put(grid, word, best.r, best.c, best.dir);
      placed.push({ w, word, r: best.r, c: best.c, dir: best.dir });
    } else skipped.push(w);
  }
  if (!placed.length) return { rows: 0, cols: 0, entries: [], cells: [], placed: 0, skipped: list };
  const keys = [...grid.keys()].map((k) => k.split(",").map(Number));
  const minR = Math.min(...keys.map(([r]) => r));
  const minC = Math.min(...keys.map(([, c]) => c));
  const rows = Math.max(...keys.map(([r]) => r)) - minR + 1;
  const cols = Math.max(...keys.map(([, c]) => c)) - minC + 1;
  const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  for (const [k, v] of grid) {
    const [r, c] = k.split(",").map(Number);
    cells[r - minR][c - minC] = { ch: v.ch, num: 0 };
  }
  const starts = new Map(placed.map((p) => [`${p.r - minR},${p.c - minC},${p.dir}`, p]));
  const entries = [];
  let num = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const across = starts.get(`${r},${c},across`);
      const down = starts.get(`${r},${c},down`);
      if (!across && !down) continue;
      num += 1;
      cells[r][c].num = num;
      for (const p of [across, down].filter(Boolean))
        entries.push({
          num,
          dir: p.dir,
          row: r,
          col: c,
          answer: p.word,
          clue: clueFor(p.w),
          wordId: p.w.id,
          hw: p.w.hw,
        });
    }
  return { rows, cols, entries, cells, placed: placed.length, skipped };
}

/** The cells [row, col] of one entry. Pure. */
export const cellsOf = (e) =>
  Array.from({ length: e.answer.length }, (_, i) =>
    e.dir === "across" ? [e.row, e.col + i] : [e.row + i, e.col],
  );

/** Check a filled grid ({ "r,c": "A" }): { wrong:[keys], empty:[keys], done } and the entries now fully right. Pure. */
export function checkCrossword(puzzle, fill = {}) {
  const wrong = [];
  const empty = [];
  puzzle.cells.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (!cell) return;
      const k = `${r},${c}`;
      const v = String(fill[k] || "").toUpperCase();
      if (!v) empty.push(k);
      else if (v !== cell.ch) wrong.push(k);
    }),
  );
  const solved = puzzle.entries.filter((e) =>
    cellsOf(e).every(([r, c]) => String(fill[`${r},${c}`] || "").toUpperCase() === puzzle.cells[r][c].ch),
  );
  return { wrong, empty, done: !wrong.length && !empty.length, solved: solved.map((e) => `${e.num}${e.dir}`) };
}
