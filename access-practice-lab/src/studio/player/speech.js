// Read-aloud through the device's own speech voices (speechSynthesis). This is never official ACCESS audio, and the
// player says so. When the device has no voice, the caller shows a plain message instead of failing silently.

import { spokenText } from "./util.js";

/** @returns {{available: boolean, speak: (text: string, onEnd?: () => void) => boolean, stop: () => void}} */
export function createSpeaker() {
  const synth = globalThis.speechSynthesis;
  const Utter = globalThis.SpeechSynthesisUtterance;
  const available = Boolean(synth && Utter);
  const stop = () => {
    try {
      synth?.cancel();
    } catch {
      /* nothing is speaking */
    }
  };
  const speak = (text, onEnd) => {
    if (!available) return false;
    try {
      stop();
      const u = new Utter(spokenText(text));
      u.rate = 0.9;
      u.onend = () => onEnd?.();
      u.onerror = () => onEnd?.();
      synth.speak(u);
      return true;
    } catch {
      return false;
    }
  };
  return { available, speak, stop };
}
