// Game 9, Math Puzzle Studio: logic and constraint puzzles with a solver behind every round. The learner places number
// tiles into number bonds, balance scales, magic triangles and squares, factor grids and KenKen cages, builds
// order-of-operations targets, and keeps equation scales balanced while getting one x-box alone.
// Mechanic tag: constraint-puzzle-solver. @fm2 FM-015 FM-078
import { HOW_TO, ICON, SKILL_COPY, TAGLINE, TITLE, TOGETHER } from "./copy.js";
import { hint } from "./hints.js";
import { answerText, check, makeRound, SKILL_TABLE, solve } from "./logic.js";
import { mount } from "./ui.js";

const skills = Object.entries(SKILL_TABLE).map(([id, [low, high, standard]]) => ({
  id,
  strand: SKILL_COPY[id][0],
  title: SKILL_COPY[id][1],
  grades: [low, high],
  standard,
}));

export default {
  id: "math-puzzle-studio",
  mechanic: "constraint-puzzle-solver",
  order: 9,
  title: TITLE,
  tagline: TAGLINE,
  howTo: HOW_TO,
  together: TOGETHER,
  icon: ICON,
  secPerRound: 75,
  skills,
  makeRound,
  check,
  hint,
  solve,
  answerText,
  mount,
  cssHref: new URL("./game.css", import.meta.url).href,
};
