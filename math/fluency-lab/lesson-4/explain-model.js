// Explain It: the language support for a skill, from language-frames.js and language-terms.js. Frames fade with the
// support level and hold no numbers, so a frame can never state an answer. The checklist reads the writing for four
// ideas and is never a grade (language-journal.js analyze()).
import { connectors, framesFor, functionsFor, levelById, promptFor } from "../language-frames.js";
import { checkMoves, doneMoves, languageProfile } from "../language-terms.js";

// Which move the learner is asked for first. After a miss the card opens on "fix it", like the explain card.
export const defaultFunction = ({ missed }) => (missed ? "fix" : "explain");

export function explainModel(skill, { supportLevel = 2, missed = false } = {}) {
  const level = levelById(supportLevel).id;
  const { family, terms } = languageProfile(skill);
  const fns = functionsFor(level).filter((fn) => fn.id !== "fix" || missed);
  const byFunction = Object.fromEntries(
    fns.map((fn) => [
      fn.id,
      {
        prompt: promptFor(fn.id),
        // Level 4 gives the question only; the level 3 starters wait behind "Need a starter?".
        frames: framesFor(level >= 4 ? 3 : level, fn.id),
        framesOpen: level < 4,
      },
    ]),
  );
  return {
    level,
    family,
    functions: fns.map((fn) => ({ id: fn.id, en: fn.en, es: fn.es })),
    start: defaultFunction({ missed }),
    byFunction,
    words: terms.map((term) => ({ id: term.id, en: term.en, es: term.es, cognate: term.cognate })),
    // "What I did" and "how I can check" phrases are a Starter-to-Growing support; level 4 writes its own.
    did: level <= 3 ? doneMoves(family) : [],
    check: level <= 3 ? checkMoves(family) : [],
    connectors: level >= 2 ? connectors() : [],
    // Starter shows two ideas to look for; the rest show all four.
    checklist: level > 1 ? ["term", "reason", "sequence", "check"] : ["term", "reason"],
  };
}
