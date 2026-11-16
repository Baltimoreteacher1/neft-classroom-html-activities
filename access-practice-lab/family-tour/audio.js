// "Listen": the device's own text-to-speech (speechSynthesis). It is the browser or phone voice, not a recording of
// a person, and the tour says so. Nothing is sent anywhere. When the device has no voice the Listen buttons are
// not drawn and every screen still reads fine.
import { speechLang } from "./i18n.js";

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";

let playing = "";

function voiceFor(lang) {
  const voices = window.speechSynthesis.getVoices?.() || [];
  const base = lang.slice(0, 2);
  return voices.find((v) => v.lang === lang) || voices.find((v) => v.lang.replace("_", "-").startsWith(base)) || null;
}

export const isPlaying = () => playing;

/** Speak `text` in `lang` (a BCP 47 tag); a second call with the same key stops it. Returns the playing key. */
export function toggleSpeech(key, text, lang = speechLang(), onEnd = () => {}) {
  if (!canSpeak()) return "";
  const synth = window.speechSynthesis;
  const was = playing;
  synth.cancel();
  playing = "";
  if (was === key) {
    onEnd();
    return "";
  }
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  const voice = voiceFor(lang);
  if (voice) u.voice = voice;
  u.rate = 0.9;
  const done = () => {
    if (playing === key) playing = "";
    onEnd();
  };
  u.onend = done;
  u.onerror = done;
  playing = key;
  synth.speak(u);
  return key;
}

export function stopSpeech() {
  if (canSpeak()) window.speechSynthesis.cancel();
  playing = "";
}
