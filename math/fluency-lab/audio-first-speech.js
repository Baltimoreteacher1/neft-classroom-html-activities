// Audio-first (pre-reader) mode, the voice. A small queue over the browser's speech synthesis: lines are spoken one
// after another, each can be reported as it starts (so the guide can highlight it), a new request cancels the old
// one, and every failure ends in a plain callback so the screen can say "no sound here" while the text stays on it.
import { canSpeak, getSpeechRate } from "./speech.js";

const LANG_TAG = { en: "en-US", es: "es-MX" };
let token = 0; // bumping it makes every utterance of an older queue stale

export const audioAvailable = () =>
  canSpeak() && typeof globalThis.SpeechSynthesisUtterance === "function";

export function stopSpeaking() {
  token += 1;
  if (canSpeak()) globalThis.speechSynthesis.cancel();
}

// A voice that matches the language when the device has one; otherwise the engine picks from the language tag.
function voiceFor(lang) {
  const voices = globalThis.speechSynthesis?.getVoices?.() || [];
  const tag = LANG_TAG[lang] || LANG_TAG.en;
  return voices.find((v) => v.lang === tag) || voices.find((v) => v.lang?.startsWith(lang)) || null;
}

// lines: [{ text, ... }]. Callbacks: onLine(line, index) as each starts, onDone() after the last, onError(reason) once.
// Pre-readers get a slightly slower voice than the learner's chosen speed.
export function speakLines(
  lines,
  { lang = "en", onLine = () => {}, onDone = () => {}, onError = () => {} } = {},
) {
  stopSpeaking();
  const queue = (lines || []).filter((line) => line?.text);
  if (!audioAvailable()) {
    onError("unavailable");
    return false;
  }
  if (!queue.length) {
    onDone();
    return true;
  }
  const mine = token;
  let failed = false;
  const next = (index) => {
    if (mine !== token || failed) return;
    if (index >= queue.length) {
      onDone();
      return;
    }
    const line = queue[index];
    const utterance = new globalThis.SpeechSynthesisUtterance(line.text);
    const spokenLang = line.lang || lang;
    utterance.lang = LANG_TAG[spokenLang] || LANG_TAG.en;
    const voice = voiceFor(spokenLang);
    if (voice) utterance.voice = voice;
    utterance.rate = Math.max(0.5, getSpeechRate() * 0.9);
    utterance.onstart = () => mine === token && onLine(line, index);
    utterance.onend = () => next(index + 1);
    utterance.onerror = (event) => {
      // "canceled" and "interrupted" are our own stop; anything else means the device could not speak.
      if (mine !== token || ["canceled", "interrupted"].includes(event?.error)) return;
      failed = true;
      onError(event?.error || "error");
    };
    globalThis.speechSynthesis.speak(utterance);
  };
  next(0);
  return true;
}
