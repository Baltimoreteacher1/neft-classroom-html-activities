// Game 4, Math Market: a shopping register. The learner reads a price tag, cart or problem, then PAYS with coins and
// bills in the tray, GIVES CHANGE, fills a cart under a budget, or types a total where a typed number is the answer.
// Mechanic tag: transaction-register. @fm2 FM-010 FM-073
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
  id: "math-market",
  mechanic: "transaction-register",
  order: 4,
  title: TITLE,
  tagline: TAGLINE,
  howTo: HOW_TO,
  together: TOGETHER,
  icon: ICON,
  secPerRound: 60,
  skills,
  makeRound,
  check,
  hint,
  solve,
  answerText,
  mount,
  cssHref: new URL("./game.css", import.meta.url).href,
};
