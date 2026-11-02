// Game 5: Array Architect. Learners build arrays, rectangles, prisms, area models and algebra-tile rectangles on a
// grid to satisfy constraints; every figure is judged by counting what they built. @fm2 FM-011 FM-017 FM-019
import { check } from "./rules.js";
import { GAME_TEXT } from "./copy.js";
import { hint } from "./hints.js";
import { answerText, makeRound, solve } from "./logic.js";
import { SKILLS } from "./skills.js";
import { mount } from "./ui.js";

const icon = `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="6" width="36" height="36" rx="5" fill="#F7F4EC" stroke="#1FA6A2" stroke-width="2.5"/><path d="M18 6v36M30 6v36M6 18h36M6 30h36" stroke="#1FA6A2" stroke-width="2"/><rect x="18" y="18" width="12" height="12" fill="#1FA6A2" opacity=".85"/></svg>`;

export default {
  id: "array-architect",
  mechanic: "grid-construction",
  order: 5,
  title: GAME_TEXT.title,
  tagline: GAME_TEXT.tagline,
  howTo: GAME_TEXT.howTo,
  together: GAME_TEXT.together,
  icon,
  secPerRound: 60,
  skills: SKILLS,
  makeRound,
  check,
  hint,
  solve,
  answerText,
  mount,
  cssHref: new URL("./game.css", import.meta.url).href,
};
