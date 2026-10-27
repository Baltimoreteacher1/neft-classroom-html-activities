// Number Line Quest (Family Math 2.0 game 6): place a marker on an interactive number line within a stated tolerance, hop a
// path to a goal, round between benchmarks, order several markers, or zoom in to place a decimal. @fm2 FM-012 FM-017 FM-019 FM-020
import * as copy from "./copy.js";
import { answerText, check, hint, makeRound, SKILL_SPECS, solve } from "./logic.js";
import { mount } from "./ui.js";

const icon = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><line x1="5" y1="33" x2="43" y2="33" stroke="#30265f" stroke-width="3" stroke-linecap="round"/><g stroke="#30265f" stroke-width="2.5" stroke-linecap="round"><line x1="9" y1="28" x2="9" y2="38"/><line x1="19" y1="30" x2="19" y2="36"/><line x1="29" y1="30" x2="29" y2="36"/><line x1="39" y1="28" x2="39" y2="38"/></g><path d="M9 33 Q19 6 29 33" fill="none" stroke="#5b49c9" stroke-width="3" stroke-dasharray="5 4" stroke-linecap="round"/><circle cx="29" cy="20" r="7" fill="#d99a12" stroke="#30265f" stroke-width="2.5"/><line x1="29" y1="27" x2="29" y2="33" stroke="#30265f" stroke-width="2.5"/></svg>`;

export default {
  id: "number-line-quest",
  mechanic: "place-and-hop-on-line",
  order: 6,
  title: copy.TITLE,
  tagline: copy.TAGLINE,
  howTo: copy.HOW_TO,
  together: copy.TOGETHER,
  icon,
  secPerRound: 60,
  skills: SKILL_SPECS.map(({ id, strand, title, grades, standard }) => ({ id, strand, title, grades, standard })),
  makeRound,
  check,
  hint,
  solve,
  answerText,
  mount,
  cssHref: new URL("./game.css", import.meta.url).href,
};
