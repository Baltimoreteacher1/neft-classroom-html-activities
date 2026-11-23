// Vocabulary Academy — the Vocabulary Arcade registry (SPEC §7). One entry per game, in GAME_IDS order:
//   { id, title, titleEs, blurb, blurbEs, purpose, minGrade, maxGrade, dims, mount(root, { unit|words, ctx, onResult, onDone }) }
// mount() returns a handle { destroy(), ready, note }. Every judged action reaches the learning model ONLY through
// the onResult callback the caller passes in; a game never reads or writes progress itself.
import { GAME_IDS, GRADES } from "../contract.js";
import contextDetective from "./context-detective.js";
import meaningMatch from "./meaning-match.js";
import readingMystery from "./reading-mystery.js";
import sentenceLab from "./sentence-lab.js";
import vocabArena from "./vocab-arena.js";
import wordBuilder from "./word-builder.js";
import wordConnections from "./word-connections.js";
import wordMastery from "./word-mastery.js";
import wordQuest from "./word-quest.js";
import wordSort from "./word-sort.js";

const ALL = [wordQuest, contextDetective, wordBuilder, meaningMatch, wordSort, vocabArena, sentenceLab, wordConnections, readingMystery, wordMastery];
const byId = new Map(ALL.map((g) => [g.id, g]));

/** The ten games in the order of GAME_IDS. */
export const GAMES = GAME_IDS.map((id) => byId.get(id)).filter(Boolean);
export const getGame = (id) => byId.get(id) || null;

const gradeIndex = (g) => GRADES.indexOf(String(g).toUpperCase());
/** Does a game suit this grade? (minGrade/maxGrade are inclusive grade ids.) */
export const fitsGrade = (game, grade) => {
  const i = gradeIndex(grade);
  return i >= 0 && i >= gradeIndex(game.minGrade) && i <= gradeIndex(game.maxGrade);
};

export { normalize } from "./data.js";
