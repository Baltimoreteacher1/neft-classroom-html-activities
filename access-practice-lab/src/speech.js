// Read-aloud with the browser's own voices (works offline on Chromebooks).
// Supports custom voices for reading, multi-speaker dialogue synthesis,
// sentence/karaoke boundary tracking, and persona-based pitch/rate adjustments.
let voices = [];
export const refreshVoices = () => {
  try {
    voices = window.speechSynthesis?.getVoices() || [];
  } catch {
    voices = [];
  }
  return voices;
};

/**
 * Whether this device can read Spanish aloud: "ready" (a Spanish voice exists), "none" (voices are loaded and
 * none is Spanish, so an English voice would mispronounce it) or "unknown" (no voice list yet).
 */
export function spanishVoiceStatus(list = voices) {
  if (!list?.length) return "unknown";
  return list.some((v) => v.lang?.toLowerCase().startsWith("es")) ? "ready" : "none";
}

/** Marks the page when no Spanish voice exists, so Spanish audio buttons step aside (see acc.css). */
function markSpanishVoice() {
  if (typeof document === "undefined") return;
  document.documentElement?.toggleAttribute?.("data-no-es-voice", spanishVoiceStatus() === "none");
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  markSpanishVoice();
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    refreshVoices();
    markSpanishVoice();
  });
}

const QUALITY = /natural|neural|google|enhanced|premium|samantha|aria|jenny/i;

/**
 * Return all available voices, optionally filtered by language prefix.
 */
export function getAvailableVoices(langPrefix = "") {
  if (!voices.length) refreshVoices();
  const list = voices || [];
  if (!langPrefix) return list;
  const pfx = langPrefix.toLowerCase().split("-")[0];
  return list.filter((v) => v.lang?.toLowerCase().startsWith(pfx));
}

/**
 * Human-friendly labeled voice choices for reading and narrations.
 */
export function getVoiceOptions(lang = "en") {
  const matching = getAvailableVoices(lang);
  const suitable = matching.filter((v) => QUALITY.test(v.name || ""));
  return [
    { id: "default", name: "Normal", lang: lang === "en" ? "en-US" : lang, quality: true },
    ...suitable.map((v) => {
      let tag = "Standard";
      if (/natural|neural/i.test(v.name)) tag = "Natural";
      else if (/premium|enhanced/i.test(v.name)) tag = "Enhanced";
      else if (/google/i.test(v.name)) tag = "Google";
      return {
        id: v.voiceURI || v.name,
        name: `${v.name} (${tag})`,
        rawName: v.name,
        lang: v.lang,
        quality: true,
      };
    }),
  ];
}

export function pickVoice(lang = "en-US", { voiceURI = "", persona = "narrator" } = {}) {
  if (!voices.length) refreshVoices();
  const base = lang.toLowerCase().split("-")[0];

  // "Normal" leaves voice choice to the browser's built-in default.
  if (voiceURI === "default") return null;

  // Explicit voiceURI selection from user preference
  if (voiceURI) {
    const direct = voices.find(
      (v) =>
        (v.voiceURI === voiceURI || v.name === voiceURI) &&
        v.lang?.toLowerCase().startsWith(base) &&
        QUALITY.test(v.name || ""),
    );
    if (direct) return direct;
  }

  // Persona hints (e.g. teacher vs student partner vs narrator)
  if (persona === "student") {
    const studentVoice = voices.find(
      (v) =>
        v.lang?.toLowerCase().startsWith(base) &&
        /victoria|junior|child|ava|karen|samantha|aria|zira/i.test(v.name),
    );
    if (studentVoice) return studentVoice;
  } else if (persona === "teacher" || persona === "guide") {
    const guideVoice = voices.find(
      (v) =>
        v.lang?.toLowerCase().startsWith(base) &&
        /daniel|guy|oliver|jenny|google|enhanced/i.test(v.name),
    );
    if (guideVoice) return guideVoice;
  }

  const prefs =
    base === "es" ? ["es-us", "es-mx", "es-419", "es-es"] : [lang.toLowerCase(), "en-us", "en-gb"];
  for (const tag of prefs) {
    const matches = voices.filter((v) => v.lang?.toLowerCase().replace("_", "-") === tag);
    if (matches.length) return matches.find((v) => QUALITY.test(v.name)) || matches[0];
  }
  return voices.find((v) => v.lang?.toLowerCase().startsWith(base)) || null;
}

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;
let current = null;

/**
 * Speak one or more segments in order. Returns a promise that resolves when
 * speech ends (or is stopped). `onSegment` receives the segment index.
 * `onBoundary` receives { index, charIndex, charLength }.
 */
export function speak(
  segments,
  {
    lang = "en-US",
    rate = 0.9,
    pitch = 1.0,
    voiceURI = "",
    persona = "narrator",
    onSegment,
    onBoundary,
  } = {},
) {
  stop();
  const list = (Array.isArray(segments) ? segments : [segments])
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  if (!canSpeak() || !list.length) return Promise.resolve(false);
  const token = {};
  current = token;
  const voice = pickVoice(lang, { voiceURI, persona });

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
      const text = list[i];
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      if (voice) u.voice = voice;
      u.rate = rate;
      u.pitch = pitch;

      onSegment?.(i, text);

      if (onBoundary) {
        u.onboundary = (e) => {
          if (current !== token) return;
          onBoundary({
            index: i,
            charIndex: e.charIndex,
            charLength: e.charLength || 0,
            name: e.name,
          });
        };
      }

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

/**
 * Parse multi-speaker dialogue scripts and speak with alternating voices and pitches.
 * Recognizes lines like:
 * "Narrator: In the science lab..."
 * "Dr. Chen: Look at the temperature chart."
 * "Student: The water is heating up."
 */
export function speakDialogue(
  lines,
  { rate = 0.9, lang = "en-US", voiceURI = "", onLineChange } = {},
) {
  stop();
  const list = (Array.isArray(lines) ? lines : [lines])
    .map((l) => String(l || "").trim())
    .filter(Boolean);
  if (!canSpeak() || !list.length) return Promise.resolve(false);

  const parsed = list.map((line) => {
    const match = line.match(/^([A-Za-z0-9\s.]+):\s*(.*)$/);
    if (match) {
      const speaker = match[1].trim();
      const text = match[2].trim();
      const isStudent = /student|mateo|sofia|kid|partner|jordan|maya/i.test(speaker);
      const isTeacher = /teacher|dr\.|mr\.|ms\.|mrs\.|guide|instructor/i.test(speaker);
      return {
        speaker,
        text,
        persona: isStudent ? "student" : isTeacher ? "teacher" : "narrator",
        pitch: isStudent ? 1.15 : isTeacher ? 0.95 : 1.0,
      };
    }
    return { speaker: "Narrator", text: line, persona: "narrator", pitch: 1.0 };
  });

  const token = {};
  current = token;

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
      if (i >= parsed.length) return finish(true);
      const entry = parsed[i];
      const voice = pickVoice(lang, { voiceURI, persona: entry.persona });
      const u = new SpeechSynthesisUtterance(entry.text);
      u.lang = lang;
      if (voice) u.voice = voice;
      u.rate = rate;
      u.pitch = entry.pitch;

      onLineChange?.(i, entry);

      u.onend = () => {
        if (current !== token) return finish(false);
        i++;
        setTimeout(next, 340);
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

/**
 * Play pre-recorded audio files in order, with a short pause between them. Resolves true when all finished,
 * false when stopped, and "failed" when a file could not play before anything was heard (the caller can then
 * fall back to speech). Shares `stop()` with speak().
 */
export function playRecording(urls, { rate = 1 } = {}) {
  stop();
  const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  if (!list.length || typeof Audio === "undefined") return Promise.resolve("failed");
  const token = {};
  current = token;
  return new Promise((resolve) => {
    let i = 0;
    let heard = false;
    let audio = null;
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (current === token) current = null;
      resolve(result);
    };
    token.finish = (completed) => {
      audio?.pause();
      finish(completed);
    };
    const fail = () => finish(heard ? false : "failed");
    const next = () => {
      if (current !== token) return finish(false);
      if (i >= list.length) return finish(true);
      audio = new Audio(list[i]);
      audio.playbackRate = Math.min(Math.max(rate, 0.5), 1.5);
      audio.onplaying = () => {
        heard = true;
      };
      audio.onended = () => {
        i++;
        setTimeout(next, 280);
      };
      audio.onerror = fail;
      audio.play().catch(fail);
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

/**
 * Spanish (es-US first, then es-MX, es-419, es-ES) for vocabulary previews. Resolves "no-voice" without speaking
 * when the device has voices but none is Spanish, so the caller can say so instead of mispronouncing it.
 */
export function speakSpanish(text, { rate = 0.9 } = {}) {
  if (!voices.length) refreshVoices();
  if (spanishVoiceStatus() === "none") return Promise.resolve("no-voice");
  return speak(text, { lang: "es-US", rate });
}
