// Read-aloud with the browser's own voices (works offline on Chromebooks).
// u.lang alone does not switch voices on most browsers, so a real matching
// voice is picked — Latin-American Spanish preferred for this audience — and
// the best-sounding English voice available ("Natural"/"Google"/"Enhanced").
let voices = [];
const refresh = () => {
  try {
    voices = window.speechSynthesis?.getVoices() || [];
  } catch {
    voices = [];
  }
};
if ("speechSynthesis" in window) {
  refresh();
  window.speechSynthesis.addEventListener?.("voiceschanged", refresh);
}

const QUALITY = /natural|neural|google|enhanced|premium|samantha|aria|jenny/i;
function pickVoice(lang) {
  if (!voices.length) refresh();
  const base = lang.toLowerCase().split("-")[0];
  const prefs =
    base === "es" ? ["es-us", "es-mx", "es-419", "es-es"] : [lang.toLowerCase(), "en-us", "en-gb"];
  for (const tag of prefs) {
    const matches = voices.filter((v) => v.lang?.toLowerCase().replace("_", "-") === tag);
    if (matches.length) return matches.find((v) => QUALITY.test(v.name)) || matches[0];
  }
  return voices.find((v) => v.lang?.toLowerCase().startsWith(base)) || null;
}

export const canSpeak = () => "speechSynthesis" in window;
let current = null;

/**
 * Speak one or more segments in order. Returns a promise that resolves when
 * speech ends (or is stopped). `onBoundary` receives the segment index.
 */
export function speak(segments, { lang = "en-US", rate = 0.9, onSegment } = {}) {
  stop();
  const list = (Array.isArray(segments) ? segments : [segments])
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  if (!canSpeak() || !list.length) return Promise.resolve(false);
  const token = {};
  current = token;
  const voice = pickVoice(lang);
  return new Promise((resolve) => {
    let i = 0;
    let settled = false;
    const finish = (completed) => {
      if (settled) return;
      settled = true;
      if (current === token) current = null;
      resolve(completed);
    };
    token.finish = finish;
    const next = () => {
      if (current !== token) return finish(false);
      if (i >= list.length) return finish(true);
      const u = new SpeechSynthesisUtterance(list[i]);
      u.lang = lang;
      if (voice) u.voice = voice;
      u.rate = rate;
      onSegment?.(i);
      u.onend = () => {
        if (current !== token) return finish(false);
        i++;
        // A short pause between sentences, like a test narrator.
        setTimeout(next, 280);
      };
      u.onerror = () => finish(false);
      try {
        window.speechSynthesis.speak(u);
      } catch {
        finish(false);
      }
    };
    next();
  });
}

export function stop() {
  const previous = current;
  current = null;
  // Some browsers cancel silently, without dispatching end/error events.
  previous?.finish?.(false);
  try {
    window.speechSynthesis?.cancel();
  } catch {}
}

export const isSpeaking = () => current !== null;
