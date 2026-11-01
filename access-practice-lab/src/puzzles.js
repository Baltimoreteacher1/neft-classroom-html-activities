// Puzzle Den: sentence builders, clue grids and odd-one-out words, each with a three-step hint ladder.
// Pure state logic only; the Puzzle Den view draws it. Stars show how independently a puzzle was solved
// (hints and misses cost a star). They are practice counts on this device, not a language level or score.
export const MAX_HINTS = 3;
export const PUZZLE_TYPES = ["order", "grid", "odd"];

const whole = (n) => (Number.isInteger(n) && n > 0 ? n : 0);

export const starsFor = (hints, misses) => {
  const spent = whole(hints) + whole(misses);
  return spent === 0 ? 3 : spent <= 2 ? 2 : 1;
};

export const forBand = (puzzles, band) =>
  puzzles.filter((p) => p.band === "both" || p.band === band);

// ---- sentence builder
export const sameTiles = (a, b) => a.length === b.length && a.every((tile, i) => tile === b[i]);
export const checkOrder = (puzzle, placed) =>
  puzzle.answers.some((answer) => sameTiles(answer, placed));
export function buildSentence(tiles, end = ".") {
  if (!tiles.length) return "";
  const text = tiles.join(" ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}${end}`;
}

// ---- clue grid: every person gets a different option
export function clueHolds(rule, assignment) {
  const has = (person, option) => assignment[person] === option;
  switch (rule.t) {
    case "is":
      return has(rule.p, rule.o);
    case "not":
      return !has(rule.p, rule.o);
    case "notAny":
      return rule.os.every((o) => !has(rule.p, o));
    case "notAny2":
      return rule.ps.every((p) => !has(p, rule.o));
    case "either":
      return rule.os.some((o) => has(rule.p, o));
    default:
      throw new Error(`Unknown clue rule: ${rule.t}`);
  }
}

function permutations(list) {
  if (list.length <= 1) return [list];
  return list.flatMap((item, i) =>
    permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

/** Every assignment that satisfies every clue. A well-made grid has exactly one. */
export function gridSolutions(puzzle) {
  return permutations(puzzle.options)
    .map((order) => Object.fromEntries(puzzle.people.map((person, i) => [person, order[i]])))
    .filter((assignment) => puzzle.clues.every((clue) => clueHolds(clue.rule, assignment)));
}

export const gridComplete = (puzzle, picks) =>
  puzzle.people.every((p) => picks?.[p]) &&
  new Set(puzzle.people.map((p) => picks[p])).size === puzzle.people.length;
export function checkGrid(puzzle, picks) {
  if (!gridComplete(puzzle, picks)) return false;
  return gridSolutions(puzzle).some((solution) =>
    puzzle.people.every((p) => solution[p] === picks[p]),
  );
}
/** The people whose pick breaks a clue, so feedback can name a clue without giving the answer. */
export const brokenClues = (puzzle, picks) =>
  puzzle.clues.map((clue, i) => (clueHolds(clue.rule, picks) ? -1 : i)).filter((i) => i >= 0);

// ---- odd one out
export const checkOdd = (puzzle, index) => index === puzzle.answer;

// ---- saved state
/** Reads saved state defensively: anything unreadable means no puzzles solved yet. */
export function normalizePuzzleState(raw) {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const solved = {};
  for (const [id, row] of Object.entries(
    value.solved && typeof value.solved === "object" ? value.solved : {},
  )) {
    if (row && Number.isInteger(row.stars) && row.stars >= 1 && row.stars <= 3)
      solved[id] = {
        stars: row.stars,
        hints: whole(row.hints),
        misses: whole(row.misses),
        day: typeof row.day === "string" ? row.day : "",
      };
  }
  const open = {};
  for (const [id, row] of Object.entries(
    value.open && typeof value.open === "object" ? value.open : {},
  )) {
    if (!row || typeof row !== "object") continue;
    open[id] = {
      hints: Math.min(MAX_HINTS, whole(row.hints)),
      misses: whole(row.misses),
      placed: Array.isArray(row.placed)
        ? row.placed.filter((n) => Number.isInteger(n) && n >= 0)
        : [],
      picks:
        row.picks && typeof row.picks === "object" && !Array.isArray(row.picks)
          ? Object.fromEntries(Object.entries(row.picks).filter(([, v]) => typeof v === "string"))
          : {},
      odd: Number.isInteger(row.odd) ? row.odd : null,
      missText: typeof row.missText === "string" ? row.missText.slice(0, 300) : "",
    };
  }
  return { solved, open };
}

export const freshAttempt = () => ({ hints: 0, misses: 0, placed: [], picks: {}, odd: null, missText: "" });

/** Records a solve. A later solve can raise the saved stars, never lower them. */
export function recordSolve(state, id, attempt, day) {
  const stars = starsFor(attempt.hints, attempt.misses);
  const old = state.solved[id];
  const keep =
    old && old.stars >= stars ? old : { stars, hints: attempt.hints, misses: attempt.misses, day };
  const open = { ...state.open };
  delete open[id];
  return { ...state, solved: { ...state.solved, [id]: keep }, open };
}

export function puzzleSummary(state, puzzles) {
  const ids = new Set(puzzles.map((p) => p.id));
  const done = Object.entries(state.solved).filter(([id]) => ids.has(id));
  return {
    total: puzzles.length,
    solved: done.length,
    stars: done.reduce((sum, [, row]) => sum + row.stars, 0),
    threeStar: done.filter(([, row]) => row.stars === 3).length,
  };
}
