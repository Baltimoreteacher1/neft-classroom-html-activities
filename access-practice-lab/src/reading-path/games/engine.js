// Untimed games. These pure transitions commit only valid learner moves.
import { HUNT_PICTURES } from "./pictures.js";
import { place, tilesFor } from "../../early/phonics.js";
import { SIGHT_WORDS } from "../../content/early.js";
import { choose, seededOrder } from "../model.js";
export const TEMPLATE_IDS = [
  "build",
  "switch",
  "machine",
  "match",
  "sort",
  "hunt",
  "sentence",
  "sight",
];
const GRAPHEMES = /ee|sh|ch|th|wh|ph|ck|ng|ai|ay|oa|ow|ea|ar|or|er|ir|ur|./g;
const parts = (text) => text.match(GRAPHEMES) || [];
// A silent-e word keeps its vowel and final e as one split grapheme: "cake" is c, a_e, k.
export function segment(word) {
  const split = word.match(/^(.*?)([aeiou])([^aeiou]+)e$/);
  if (!split) return parts(word);
  const [, onset, vowel, coda] = split;
  return [...parts(onset), `${vowel}_e`, ...parts(coda)];
}
export const CARD_CHOICES = Object.freeze([6, 8, 12]);
export const ROUND_CHOICES = Object.freeze([5, 10, 15]);
export const STAGE_CHOICES = Object.freeze(["A", "B", "C"]);
export function roundFor(unit, template, options = {}) {
  const { seed = 1, band = "K" } = options;
  const cards = choose(options.cards, CARD_CHOICES);
  const stage = choose(options.stage, STAGE_CHOICES);
  const words = seededOrder(
    ["3-5", "6-8"].includes(band) ? unit.olderWords : unit.exampleWords,
    `${seed}:${stage}`,
  );
  const target = words[0];
  const sounds = segment(target);
  const sight = (SIGHT_WORDS[band] || SIGHT_WORDS.K).map((w) => w[0]);
  const pairs = seededOrder(
    words.slice(0, cards / 2).flatMap((w) => [
      { id: `${w}-a`, word: w },
      { id: `${w}-b`, word: w },
    ]),
    seed,
  );
  const pools = {
    6: ["cap", "cape"],
    7: ["pet", "Pete"],
    8: ["pin", "pine"],
    9: ["hop", "hope"],
    10: ["cub", "cube"],
  };
  return {
    template,
    target,
    words,
    sounds,
    pictures: seededOrder(HUNT_PICTURES[unit.n] || [], seed),
    tiles: tilesFor(target, sounds),
    pairs,
    sight: seededOrder(sight, seed).slice(0, 4),
    switchPair: pools[unit.n] || pools[6],
    sentence: unit.sentence.en,
    sortPatterns: unit.n === 14 ? ["er", "ir", "ur"] : ["ai", "oa", "ee"],
  };
}
export const newGame = () => ({
  placed: [],
  matched: [],
  sorted: [],
  found: [],
  sentence: [],
  complete: false,
});
export function move(round, state, action) {
  const wrong = () => ({
    state,
    replay: round.template === "sight" ? round.sight[0] : round.target,
  });
  if (state.complete) return wrong();
  if (round.template === "build") {
    const tile = round.tiles.find((t) => t.id === action.tile);
    if (!tile) return wrong();
    const result = place(round.sounds, state.placed, tile);
    if (!result.ok || state.placed.includes(tile.id)) return wrong();
    return {
      state: {
        ...state,
        placed: result.placed,
        complete: result.placed.length === round.sounds.length,
      },
      replay: "",
    };
  }
  if (round.template === "switch") {
    if (action.value !== "e") return wrong();
    return { state: { ...state, complete: true }, replay: round.switchPair.join(". ") };
  }
  if (round.template === "machine") {
    // Every combination is permitted; the learner, rather than a clock, ends the exploration.
    if (action.value !== "done") return wrong();
    return { state: { ...state, complete: true }, replay: "" };
  }
  if (round.template === "match") {
    const a = round.pairs.find((x) => x.id === action.a),
      b = round.pairs.find((x) => x.id === action.b);
    if (
      !a ||
      !b ||
      a.id === b.id ||
      a.word !== b.word ||
      state.matched.includes(a.id) ||
      state.matched.includes(b.id)
    )
      return wrong();
    const matched = [...state.matched, a.id, b.id];
    return {
      state: { ...state, matched, complete: matched.length === round.pairs.length },
      replay: a.word,
    };
  }
  if (round.template === "sort") {
    if (
      !round.words.includes(action.word) ||
      !round.sortPatterns.includes(action.bin) ||
      !action.word.includes(action.bin) ||
      state.sorted.includes(action.word)
    )
      return wrong();
    const sorted = [...state.sorted, action.word];
    const all = round.words.filter((w) => round.sortPatterns.some((p) => w.includes(p)));
    return {
      state: { ...state, sorted, complete: sorted.length === all.length },
      replay: action.word,
    };
  }
  if (round.template === "hunt") {
    const valid = round.pictures.filter((p) => p[2]).map((p) => p[0]);
    if (!valid.includes(action.word) || state.found.includes(action.word)) return wrong();
    const found = [...state.found, action.word];
    return {
      state: { ...state, found, complete: found.length === valid.length },
      replay: action.word,
    };
  }
  if (round.template === "sentence") {
    const tokens = round.sentence.split(" ");
    if (action.value !== tokens[state.sentence.length]) return wrong();
    const sentence = [...state.sentence, action.value];
    return {
      state: { ...state, sentence, complete: sentence.length === tokens.length },
      replay: sentence.length === tokens.length ? round.sentence : "",
    };
  }
  if (round.template === "sight") {
    if (action.value !== round.sight[0]) return wrong();
    return { state: { ...state, complete: true }, replay: round.sight[0] };
  }
  return wrong();
}
