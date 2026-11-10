// The English strings MathSense passes to t() by variable (mission text, cut names, form names ...), listed once so
// tools/fluency-i18n.test.mjs and content.test.mjs can prove each has a Spanish entry. Literal t() calls with a string and the
// data-i18n text in index.html are found by those tests scanning the sources.
import { FORM_NAMES, PARSE_MESSAGES } from "./missions-check.js";
import { BANDS, MISSIONS, SCENARIOS, TOPICS } from "./missions.js";
import { PART_CHOICES } from "./model.js";
import { NAMED_WORDS } from "./progress.js";
import { PIECE_NAMES } from "./readouts.js";
import { STATUS_TEXT } from "./ui-missions.js";
import { FIELD_NAMES } from "./ui-workspace.js";

const keys = new Set();
// Numbers and symbols (a choice such as "5/9" or "61%") read the same in both languages and need no entry.
const add = (...values) => {
  for (const value of values)
    if (value && /[A-Za-z]/.test(value.replace(/\{\w+\}/g, ""))) keys.add(value);
};
for (const band of BANDS) add(band.label);
for (const topic of Object.values(TOPICS)) add(topic.name, topic.explain, ...topic.frames);
for (const mission of MISSIONS) {
  add(
    mission.prompt,
    mission.done,
    ...mission.hints,
    ...(mission.slips ?? []).map((slip) => slip.say),
  );
  for (const option of mission.options ?? []) add(option.text, option.say);
}
for (const scenario of SCENARIOS) add(scenario.label);
for (const parts of PART_CHOICES) add(PIECE_NAMES[parts]);
add(
  ...Object.values(FORM_NAMES),
  ...Object.values(PARSE_MESSAGES),
  ...Object.values(STATUS_TEXT),
  ...Object.values(FIELD_NAMES),
  ...NAMED_WORDS.map((word) => word.id),
);

export const MATHSENSE_I18N_KEYS = Object.freeze([...keys]);
