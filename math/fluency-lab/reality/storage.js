// Math Reality saves live in the browser, per learner slot, under one versioned key. Reads repair what they find
// (engine.sanitizeSave); writes report failure instead of throwing, so a blocked or full store never breaks play.
import { profileKey } from "../family/fm2/profile-key.js";
import { emptySave, sanitizeSave } from "./engine.js";

const KEY = "ewl-reality-v1";
const PROFILES = "ewl-fluency-profiles-v1";
const TAB_PROFILE = "ewl-fluency-tab-profile";
const SETTINGS = "ewl-fluency-settings-v1";

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

// The learner slot in use: this tab's choice, else the device's last choice, else the first.
export function activeProfile() {
  try {
    const tab = sessionStorage.getItem(TAB_PROFILE);
    if (tab !== null && Number.isInteger(Number(tab)) && Number(tab) >= 0 && Number(tab) < 6) return Number(tab);
  } catch {
    /* fall through to the device's last choice */
  }
  const stored = read(PROFILES, {});
  return Number.isInteger(stored.active) && stored.active >= 0 && stored.active < 6 ? stored.active : 0;
}

export const loadSave = (profile = activeProfile()) => sanitizeSave(read(profileKey(KEY, profile), null));

export function writeSave(save, profile = activeProfile()) {
  try {
    localStorage.setItem(profileKey(KEY, profile), JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

// Grade: the link's ?grade=, else the grade this learner last used in the Lab, else 1.
export function loadGrade(search = location.search, profile = activeProfile()) {
  const fromUrl = Number(new URLSearchParams(search).get("grade"));
  if (Number.isInteger(fromUrl) && fromUrl >= 1 && fromUrl <= 8) return fromUrl;
  const stored = Number(read(profileKey(`${SETTINGS}:grade`, profile), 1));
  return Number.isInteger(stored) && stored >= 1 && stored <= 8 ? stored : 1;
}

export { emptySave };
