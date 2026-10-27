// Math Match (Family Math 2.0 game 2): a memory board where each set is different representations of one exact value.
// @fm2 FM-008 FM-017 FM-019 FM-020
import * as copy from "./copy.js";
import { answerText, check, hint, makeRound, SKILL_SPECS, solve } from "./logic.js";
import { mount } from "./ui.js";

const icon = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect x="3" y="9" width="20" height="28" rx="4" fill="#e7e3fb" stroke="#30265f" stroke-width="2.5"/><rect x="25" y="11" width="20" height="28" rx="4" fill="#fff" stroke="#30265f" stroke-width="2.5"/><circle cx="9.5" cy="17" r="2.6" fill="#5b49c9"/><circle cx="16.5" cy="17" r="2.6" fill="#5b49c9"/><circle cx="13" cy="24" r="2.6" fill="#5b49c9"/><circle cx="9.5" cy="31" r="2.6" fill="#5b49c9"/><circle cx="16.5" cy="31" r="2.6" fill="#5b49c9"/><text x="35" y="32" text-anchor="middle" font-size="20" font-weight="800" fill="#30265f" font-family="system-ui,sans-serif">5</text></svg>`;

export default {
  id: "math-match",
  mechanic: "representation-concentration",
  order: 2,
  title: copy.TITLE,
  tagline: copy.TAGLINE,
  howTo: copy.HOW_TO,
  together: copy.TOGETHER,
  icon,
  secPerRound: 75,
  skills: SKILL_SPECS.map(({ id, strand, title, grades, standard, labSkill }) => ({
    id,
    strand,
    title,
    grades,
    standard,
    ...(labSkill ? { labSkill } : {}),
  })),
  makeRound,
  check,
  hint,
  solve,
  answerText,
  mount,
  cssHref: new URL("./game.css", import.meta.url).href,
};
