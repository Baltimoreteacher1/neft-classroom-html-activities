// Family Math Duel (Family Math 2.0 game 10): a head-to-head card duel. A learner and a caregiver (or Orbit, the
// computer opponent) draft cards into an expression, claim exact values, may challenge each other, and the exact values
// decide the winner. @fm2 FM-016 FM-017 FM-019 FM-020 FM-027 FM-079
import { HOW_TO, TAGLINE, TITLE, TOGETHER } from "./copy.js";
import { hint } from "./hints.js";
import { answerText, check, makeRound, solve } from "./logic.js";
import { SKILLS } from "./specs.js";
import { mount } from "./ui.js";

const icon = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><rect x="3" y="10" width="19" height="27" rx="4" fill="#F7F4EC" stroke="#17324D" stroke-width="2.5" transform="rotate(-8 12 24)"/><rect x="26" y="10" width="19" height="27" rx="4" fill="#fbefcf" stroke="#17324D" stroke-width="2.5" transform="rotate(8 36 24)"/><text x="12" y="30" text-anchor="middle" font-size="16" font-weight="800" fill="#17324D" font-family="system-ui,sans-serif" transform="rotate(-8 12 24)">7</text><text x="36" y="30" text-anchor="middle" font-size="16" font-weight="800" fill="#17324D" font-family="system-ui,sans-serif" transform="rotate(8 36 24)">5</text><path d="M20 41h8" stroke="#1FA6A2" stroke-width="3" stroke-linecap="round"/></svg>`;

export default {
  id: "family-math-duel",
  mechanic: "two-player-challenge-duel",
  order: 10,
  title: TITLE,
  tagline: TAGLINE,
  howTo: HOW_TO,
  together: TOGETHER,
  icon,
  secPerRound: 150,
  skills: SKILLS.map(({ id, strand, title, grades, standard, labSkill }) => ({ id, strand, title, grades, standard, ...(labSkill ? { labSkill } : {}) })),
  makeRound,
  check,
  hint,
  solve,
  answerText,
  mount,
  cssHref: new URL("./game.css", import.meta.url).href,
};
