// Game 8, Ratio Recipe Lab: a dynamic scaling workbench. The learner scales a batch with a stepper, slider or x/÷ buttons
// and the ratio table, the bowls and the double number line follow from exact rationals; unknown cells are typed.
// Mechanic tag: scaling-table-lab. @fm2 FM-014 FM-077
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
  id: "ratio-recipe-lab",
  mechanic: "scaling-table-lab",
  order: 8,
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
