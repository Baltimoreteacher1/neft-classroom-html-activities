// Language Escape Room: rooms with locks; every lock opens only after the learner interprets evidence (a note, a map,
// a schedule, a diagram) and explains the reasoning in a sentence that is checked. Four rooms per band (the fourth, a greenhouse control room, was added after launch), rising
// language demand; the final room combines the skills. Content: escape-room-35.js, escape-room-68.js.
import { BAND_35 } from "./escape-room-35.js";
import { BAND_68 } from "./escape-room-68.js";

export const GAME = {
  id: "escape-room",
  use: "Explain",
  chapters: 4,
  icon: "lock",
  art: ["bg-museum", "char-detective"],
  title: ["Language Escape Room", "Sala de escape del lenguaje"],
  tagline: [
    "Read the clues, explain your thinking, open the lock.",
    "Lee las pistas, explica lo que piensas y abre el candado.",
  ],
  noun: ["Room", "Sala"],
  verb: ["Enter the room", "Entrar a la sala"],
  done: ["Room open", "Sala abierta"],
  related: { href: "games/escape-room", title: ["Quick escape room practice", "Práctica rápida de sala de escape"] },
  book: "mystery-story",
  bands: { "3-5": BAND_35, "6-8": BAND_68 },
};
