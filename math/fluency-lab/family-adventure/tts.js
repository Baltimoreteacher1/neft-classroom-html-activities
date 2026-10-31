/* Optional read-aloud for a stop, using the browser's own speech voices. Nothing is sent anywhere.
 * In "both languages" mode each element is read in English, then in Spanish. */

export const supported = () => typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";

const VOICE = { en: "en-US", es: "es-US" };

export function stop() {
  if (supported()) window.speechSynthesis.cancel();
}

/** Split a narrated element into [lang, text] pieces according to the page language mode. */
export function pieces(el, mode) {
  const es = el.querySelector(":scope > .es");
  if (mode === "es") return [["es", el.textContent.trim()]];
  if (mode === "bi" && es) {
    const english = [...el.childNodes].filter((n) => n !== es).map((n) => n.textContent).join("").trim();
    return [["en", english], ["es", es.textContent.trim()]];
  }
  return [["en", el.textContent.trim()]];
}

/** Speak the pieces in order. onEnd runs when the last one finishes or speech is cancelled. */
export function speak(list, onEnd) {
  if (!supported() || !list.length) return onEnd?.();
  const synth = window.speechSynthesis;
  synth.cancel();
  list.forEach(([lang, text], i) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = VOICE[lang];
    u.rate = 0.92;
    const voice = synth.getVoices().find((v) => v.lang.replace("_", "-").startsWith(lang));
    if (voice) u.voice = voice;
    if (i === list.length - 1) {
      u.onend = () => onEnd?.();
      u.onerror = () => onEnd?.();
    }
    synth.speak(u);
  });
}
