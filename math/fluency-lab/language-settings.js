// The learner's chosen language-support level, kept on this device per profile slot. This module does not
// import school-tools.js (which imports language-bridge.js), so it can sit under every language module.
import { DEFAULT_LEVEL, levelById } from "./language-frames.js";

const LEVEL_KEY = "ewl-language-level-v1";
let profile = 0;

export const setLanguageProfile = (id) => {
  profile = Number.isInteger(id) && id >= 0 ? id : 0;
};
export const scopedKey = (base) => (profile === 0 ? base : `${base}:profile-${profile}`);

export function readJson(base, fallback) {
  try {
    const raw = localStorage.getItem(scopedKey(base));
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
export function writeJson(base, value) {
  try {
    localStorage.setItem(scopedKey(base), JSON.stringify(value));
    return true;
  } catch {
    if (typeof window !== "undefined")
      window.dispatchEvent(new CustomEvent("fluency-storage-unavailable"));
    return false;
  }
}

export const getLevel = () => levelById(readJson(LEVEL_KEY, DEFAULT_LEVEL)).id;
export function setLevel(id) {
  const level = levelById(id).id;
  writeJson(LEVEL_KEY, level);
  return level;
}
