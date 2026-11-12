// Learner preferences for the student app. They live in the SAME per-learner settings record the full lab
// (lab.html) uses, `ewl-fluency-settings-v1`, so "larger text" or "reading font" chosen on one screen holds on the
// other. Fields the shell does not own are kept untouched (read, merge, write).
//   largeText    boolean — larger type everywhere
//   readingFont  boolean — Atkinson Hyperlegible, a typeface designed for low-vision and early readers
//   reduceMotion boolean — no animation, on top of the system preference
//   audioFirst   "auto" | "on" | "off" — the lab's listening help (K–3); "auto" is on for K–2 (audio-first-core.js)
//   readAloud    boolean — the student app's read-aloud at any grade; unset follows audioFirst
import { audioFirstActive, audioFirstOffered, cleanSettings } from "../audio-first-core.js";
import { profileKey } from "../family/fm2/profile-key.js";
import { canSpeak, speak } from "../speech.js";
import { activeProfile } from "./store.js";

const SETTINGS = "ewl-fluency-settings-v1";
const key = () => profileKey(SETTINGS, activeProfile().active);

export function prefs() {
  try {
    return cleanSettings(JSON.parse(localStorage.getItem(key()) || "{}"));
  } catch {
    return cleanSettings({});
  }
}

export function setPref(name, value) {
  const next = { ...prefs(), [name]: value };
  try {
    localStorage.setItem(key(), JSON.stringify(next));
  } catch {
    /* private mode: the choice still applies to this page */
  }
  applyPrefs(next);
  return next;
}

export function applyPrefs(p = prefs()) {
  const root = document.documentElement.dataset;
  root.large = p.largeText ? "1" : "0";
  root.readingFont = p.readingFont ? "1" : "0";
  root.motion = p.reduceMotion ? "reduce" : "auto";
}

// Read-aloud: the learner's explicit choice wins at any grade; unset, it follows the lab's audio-first rule (on for
// Kindergarten to Grade 2). Turning it on or off in Kindergarten to Grade 3 also sets the lab's listening help.
export function readAloudOn(grade) {
  if (!canSpeak()) return false;
  const p = prefs();
  return typeof p.readAloud === "boolean"
    ? p.readAloud
    : audioFirstActive({ setting: p.audioFirst, grade });
}
export function setReadAloud(on, grade) {
  if (audioFirstOffered(grade)) setPref("audioFirst", on ? "on" : "off");
  return setPref("readAloud", on);
}

// A small "Listen" button that reads one piece of text in the interface language. Rendered only when read-aloud
// is on, so it never sits on screen as a control that does nothing.
export const listenButton = (label) =>
  `<button type="button" class="btn btn-quiet btn-sm btn-listen" data-listen><span aria-hidden="true">🔊</span> ${label}</button>`;

export function bindListen(scope, getText, lang) {
  scope.querySelectorAll("[data-listen]").forEach((button) =>
    button.addEventListener("click", () => {
      const text = getText(button);
      if (text) speak(text, lang());
    }),
  );
}
