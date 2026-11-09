// Language City: saved state on this device (key accessPracticeLab:v1:city) and the on-screen state of the current step.
// Saved: the learner's character, the support they picked, the attempt in progress (so a reload resumes it) and per-mission
// progress with independent and supported runs counted separately. Never saved: anything the learner typed.
import { CITY_KEY } from "../lang/city.js";
import { loadState, saveState } from "./studio-kit.js";

const DEFAULT = { look: 0, support: "none", att: null, prog: {} };
export const cityState = () => loadState(CITY_KEY, DEFAULT);
export const saveCity = (st) => saveState(CITY_KEY, st);

/** What is on screen for the current step only; it resets whenever the step changes. `es` lasts for the whole mission. */
export const ui = {
  key: "",
  mission: "",
  es: false,
  seq: [],
  text: "",
  picked: [],
  fb: null,
  hint: false,
  words: false,
};
export function syncUi(missionId, stepId) {
  if (ui.mission !== missionId) Object.assign(ui, { mission: missionId, es: false, key: "" });
  const key = `${missionId}:${stepId}`;
  if (ui.key === key) return;
  Object.assign(ui, { key, seq: [], text: "", picked: [], fb: null, hint: false, words: false });
}
export const resetUi = () => {
  Object.assign(ui, {
    key: "",
    mission: "",
    es: false,
    seq: [],
    text: "",
    picked: [],
    fb: null,
    hint: false,
    words: false,
  });
};
