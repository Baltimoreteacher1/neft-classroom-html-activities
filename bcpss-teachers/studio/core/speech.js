// Pronunciation and read-aloud through the browser's speech synthesis. No audio files; the text IS the transcript.
let voices = [];
const load = () => {
  try {
    voices = speechSynthesis.getVoices();
  } catch {
    voices = [];
  }
};
if (typeof speechSynthesis !== "undefined") {
  load();
  speechSynthesis.addEventListener?.("voiceschanged", load);
}

export const canSpeak = () => typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined";

let muted = false;
export const setMuted = (m) => {
  muted = !!m;
  if (muted) stop();
};
export const isMuted = () => muted;

export function stop() {
  if (canSpeak()) speechSynthesis.cancel();
}

/**
 * Watchdog limits for one utterance. A browser with a broken speech engine (headless Chromium, a missing voice
 * pack) accepts speak() and then never fires start or end, which would soft-lock any code that awaits the result.
 *  - startMs: give up when playback has not begun by then.
 *  - endMs: give up when playback began but never ended (a rough reading time for the text, with slack).
 */
export function speechTimeouts(text, rate = 0.92) {
  const chars = String(text || "").length;
  const reading = (chars * 85) / Math.max(0.3, rate);
  return { startMs: 3000, endMs: Math.min(60000, Math.max(4000, 2500 + reading * 1.6)) };
}

/** speak(text, {lang:"en-US"|"es-US", rate}) -> Promise that resolves when done (or immediately when unavailable or stuck) */
export function speak(text, { lang = "en-US", rate = 0.92 } = {}) {
  if (!canSpeak() || muted || !text) return Promise.resolve(false);
  return new Promise((resolve) => {
    stop();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = lang;
    u.rate = rate;
    const pick = voices.find((v) => v.lang === lang) || voices.find((v) => v.lang?.startsWith(lang.slice(0, 2)));
    if (pick) u.voice = pick;
    const { startMs, endMs } = speechTimeouts(text, rate);
    let timer = null;
    let settled = false;
    const finish = (ok, cancel) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (cancel) stop();
      resolve(ok);
    };
    timer = setTimeout(() => finish(false, true), startMs);
    u.onstart = () => {
      clearTimeout(timer);
      timer = setTimeout(() => finish(false, true), endMs);
    };
    u.onend = () => finish(true);
    u.onerror = () => finish(false);
    try {
      speechSynthesis.speak(u);
    } catch {
      finish(false);
    }
  });
}
