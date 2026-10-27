// The ten games, in shelf order. Modules load on demand so the landing page stays light. @fm2 FM-007 FM-008 FM-009 FM-010 FM-011 FM-012 FM-013 FM-014 FM-015 FM-016
export const GAME_IDS = [
  "number-builder",
  "math-match",
  "fraction-kitchen",
  "math-market",
  "array-architect",
  "number-line-quest",
  "pattern-detective",
  "ratio-recipe-lab",
  "math-puzzle-studio",
  "family-math-duel",
];

const cache = new Map();

export async function loadGame(id) {
  if (!GAME_IDS.includes(id)) throw new RangeError(`Unknown game: ${id}`);
  if (!cache.has(id)) cache.set(id, import(`./games/${id}/index.js`).then((module) => module.default));
  return cache.get(id);
}

export const loadAll = () => Promise.all(GAME_IDS.map(loadGame));
