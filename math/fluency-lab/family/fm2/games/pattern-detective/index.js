// Pattern Detective (Family Math 2.0 game 7): find a hidden rule by probing it a few times, collecting evidence,
// stating the rule, and predicting a faraway answer. @fm2 FM-013 FM-017 FM-019 FM-020
import { HOW_TO, TAGLINE, TITLE, TOGETHER } from "./copy.js";
import { answerText, check, hint, makeRound, SKILL_SPECS, solve } from "./logic.js";
import { mount } from "./ui.js";

const icon = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><circle cx="10" cy="14" r="5" fill="#5b49c9" stroke="#30265f" stroke-width="2"/><rect x="7" y="27" width="10" height="10" rx="2" fill="#e0583f" stroke="#30265f" stroke-width="2"/><circle cx="29" cy="20" r="11" fill="#fff" stroke="#30265f" stroke-width="3"/><circle cx="29" cy="20" r="6" fill="#dcebfb"/><path d="M37 28 L45 37" stroke="#30265f" stroke-width="4" stroke-linecap="round"/><text x="29" y="25" text-anchor="middle" font-size="12" font-weight="800" fill="#30265f" font-family="system-ui,sans-serif">?</text></svg>`;

export default {
  id: "pattern-detective",
  mechanic: "rule-discovery-by-probing",
  order: 7,
  title: TITLE,
  tagline: TAGLINE,
  howTo: HOW_TO,
  together: TOGETHER,
  icon,
  secPerRound: 100,
  skills: SKILL_SPECS,
  makeRound,
  check,
  hint,
  solve,
  answerText,
  mount,
  cssHref: new URL("./game.css", import.meta.url).href,
};
