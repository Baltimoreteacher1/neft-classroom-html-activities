// Speech.js — spoken prompts for listening tasks, with the controls a student needs and an honest fallback.
// Browser speech synthesis is a stand-in for a recording: voices differ and some devices have none, and it
// is not the official ACCESS listening audio. Every spoken prompt therefore has a visible transcript route
// the student can open at any time; when speech is muted or unavailable the caller shows it automatically.
import { SLOW_RATE } from "./Prompts.js";
import { SoundEngine } from "./SoundEngine.js";
import { canSpeak, speak, stop } from "../speech.js";

export const Speech = {
  available: () => canSpeak(),
  /** Speak `text`. Resolves { ok, reason }. reason: "muted" | "unavailable" | "stopped" | "". */
  async say(text, { slow = false, prefs = {}, lang = "en-US" } = {}) {
    if (SoundEngine.isMuted()) return { ok: false, reason: "muted" };
    if (!canSpeak()) return { ok: false, reason: "unavailable" };
    const rate = slow ? SLOW_RATE : prefs.rate || 0.95;
    const done = await speak(text, { lang, rate, voiceURI: prefs.readingVoice || "", volume: SoundEngine.getVolumes().speech });
    return { ok: done, reason: done ? "" : "stopped" };
  },
  stop() {
    try {
      stop();
    } catch {}
  },
};
export default Speech;
