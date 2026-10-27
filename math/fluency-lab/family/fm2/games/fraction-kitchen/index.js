// Fraction Kitchen (game 3, mechanic: partition-and-pour): cut shapes into equal parts, serve and join pieces, pour into
// measuring cups and tap scoops into a pitcher until the exact amount is made. All arithmetic is exact. @fm2 FM-009 FM-072
import { GAME_COPY, ICON } from "./copy.js";
import { answerText, check, hint, makeRound, solve } from "./logic.js";
import { SKILLS } from "./skills.js";
import { mountKitchen } from "./ui.js";

export default {
  id: "fraction-kitchen",
  mechanic: "partition-and-pour",
  order: 3,
  title: GAME_COPY.title,
  tagline: GAME_COPY.tagline,
  howTo: GAME_COPY.howTo,
  together: GAME_COPY.together,
  icon: ICON,
  secPerRound: 60,
  skills: SKILLS,
  makeRound,
  check,
  hint: (round, tier) => hint(round, tier),
  solve,
  answerText,
  mount: mountKitchen,
  cssHref: new URL("./game.css", import.meta.url).href,
};
