// Word Machine: one canonical set of reels and one list of real words. Render, click and tests all read this file.
export const REELS = Object.freeze([
  Object.freeze(["c", "m", "s"]),
  Object.freeze(["a", "e", "i", "o", "u"]),
  Object.freeze(["t", "p", "n"]),
]);
// Real words the reels can spell. Every entry must be reachable (tools/access-reading-path.test.mjs proves it).
export const REAL_WORDS = Object.freeze(
  new Set([
    "cat",
    "cap",
    "can",
    "cot",
    "cop",
    "con",
    "cut",
    "cup",
    "mat",
    "map",
    "man",
    "met",
    "men",
    "mop",
    "sat",
    "sap",
    "set",
    "sit",
    "sip",
    "sin",
    "sop",
    "sun",
    "son",
  ]),
);
export const clampReel = (reel, position) => {
  const n = REELS[reel]?.length;
  return n ? ((Number(position) % n) + n) % n : 0;
};
export const machineWord = (positions) =>
  REELS.map((pool, i) => pool[clampReel(i, positions[i])]).join("");
export const isRealWord = (word) => REAL_WORDS.has(word);
