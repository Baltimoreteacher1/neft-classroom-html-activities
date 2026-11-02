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
const GAME_IMPORTERS = {
  "number-builder": () => import("./games/number-builder/index.js"),
  "math-match": () => import("./games/math-match/index.js"),
  "fraction-kitchen": () => import("./games/fraction-kitchen/index.js"),
  "math-market": () => import("./games/math-market/index.js"),
  "array-architect": () => import("./games/array-architect/index.js"),
  "number-line-quest": () => import("./games/number-line-quest/index.js"),
  "pattern-detective": () => import("./games/pattern-detective/index.js"),
  "ratio-recipe-lab": () => import("./games/ratio-recipe-lab/index.js"),
  "math-puzzle-studio": () => import("./games/math-puzzle-studio/index.js"),
  "family-math-duel": () => import("./games/family-math-duel/index.js"),
};

export async function loadGame(id) {
  if (!GAME_IDS.includes(id)) throw new RangeError(`Unknown game: ${id}`);
  if (!cache.has(id)) cache.set(id, GAME_IMPORTERS[id]().then((module) => module.default));
  const pending = cache.get(id);
  try {
    return await pending;
  } catch (error) {
    if (cache.get(id) === pending) cache.delete(id);
    throw error;
  }
}

export const loadAll = () => Promise.all(GAME_IDS.map(loadGame));
