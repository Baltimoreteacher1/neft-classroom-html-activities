// One small object on this device for the introduction pages: `accessPracticeLab:v1:intro`.
// Teacher tour place and notes, exploration choices, quick-guide checkboxes and the Site Guide audience all live in it
// under their own keys. Every writer reads, changes its own key and writes back, so no page overwrites another.
// Nothing here is student data and nothing leaves the device. The lab's "Start everything fresh", Save and Resume and
// Passport transfer all match the `accessPracticeLab:` prefix, so this follows them without extra code.
import { storage } from "../util.js";

export const INTRO_KEY = "accessPracticeLab:v1:intro";

export function loadIntro() {
  try {
    const v = JSON.parse(storage.get(INTRO_KEY) || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

/** Reads `key`, applies `change(current)` (which returns the new value) and saves. Returns the new value. */
export function updateIntro(key, change) {
  const all = loadIntro();
  const next = change(all[key] && typeof all[key] === "object" ? all[key] : {});
  storage.set(INTRO_KEY, JSON.stringify({ ...all, [key]: next }));
  return next;
}

export function clearIntro(key) {
  const { [key]: _gone, ...rest } = loadIntro();
  storage.set(INTRO_KEY, JSON.stringify(rest));
}

/** The one sentence about where saved teacher work lives (the tour and the exploration both show it). */
export const SAVED_NOTE =
  "Your place and notes are saved in this browser on this device only. They are not sent anywhere and no account is used. Clearing site data, or “Start everything fresh” in the More menu, removes them.";
