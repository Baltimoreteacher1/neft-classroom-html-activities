// Speech-to-text for speaking practice, in place of "type what you said" (Joel's decision of 2026-11-06, recorded in
// PLATFORM.md). Order of preference:
//   1. on-device recognition: SpeechRecognition with processLocally = true, when the browser reports the language
//      model is available on this device (SpeechRecognition.available);
//   2. the browser's standard recognition (may use the browser maker's speech service);
//   3. typing, which always remains: recognized words land in an editable box, never a locked one.
// Nothing here stores audio. Recognized text is treated like typed text.

const ctorOf = (env = globalThis) => env.SpeechRecognition || env.webkitSpeechRecognition || null;

/** "none" when this browser has no speech recognition at all. */
export const canDictate = (env = globalThis) => Boolean(ctorOf(env));

/**
 * Whether on-device recognition is ready for `lang`: "available" | "downloadable" | "downloading" | "unavailable" |
 * "unsupported" (the browser cannot say). Never throws.
 */
export async function localAvailability(lang = "en-US", env = globalThis) {
  const Ctor = ctorOf(env);
  if (!Ctor || typeof Ctor.available !== "function") return "unsupported";
  try {
    const v = await Ctor.available({ langs: [lang], processLocally: true });
    return typeof v === "string" ? v : "unsupported";
  } catch {
    return "unsupported";
  }
}

/** Joins final results and the current interim result into one transcript. */
export function joinResults(results) {
  let final = "";
  let interim = "";
  for (const r of Array.from(results || [])) {
    const text = String(r?.[0]?.transcript || "").trim();
    if (!text) continue;
    if (r.isFinal) final = `${final} ${text}`.trim();
    else interim = `${interim} ${text}`.trim();
  }
  return { final, interim, text: `${final} ${interim}`.trim() };
}

/**
 * Starts dictation. Resolves to a session { mode: "local" | "standard", stop(): Promise<string> } or null when the
 * browser cannot recognize speech. `onText({ final, interim, text })` fires as words arrive.
 */
export async function startDictation({
  lang = "en-US",
  env = globalThis,
  onText,
  onError,
  onEnd,
} = {}) {
  const Ctor = ctorOf(env);
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  let mode = "standard";
  if ("processLocally" in rec && (await localAvailability(lang, env)) === "available") {
    rec.processLocally = true;
    mode = "local";
  }
  let latest = { final: "", interim: "", text: "" };
  let wanted = true;
  let resolveStop = null;
  const stopped = new Promise((r) => {
    resolveStop = r;
  });
  rec.onresult = (e) => {
    latest = joinResults(e.results);
    onText?.(latest);
  };
  rec.onerror = (e) => {
    wanted = false;
    onError?.(e?.error || "error");
  };
  rec.onend = () => {
    // Chrome ends continuous recognition after a silence; keep listening until the learner stops.
    if (wanted) {
      try {
        rec.start();
        return;
      } catch {}
    }
    onEnd?.(latest);
    resolveStop(latest.text);
  };
  try {
    rec.start();
  } catch (e) {
    onError?.(e?.name || "start-failed");
    return null;
  }
  return {
    mode,
    get text() {
      return latest.text;
    },
    stop() {
      wanted = false;
      try {
        rec.stop();
      } catch {
        resolveStop(latest.text);
      }
      return stopped;
    },
  };
}

/** Plain [English, Spanish] note about where recognition runs. */
export const DICTATION_NOTE = {
  local: [
    "Your words are recognized on this device.",
    "Tus palabras se reconocen en este dispositivo.",
  ],
  standard: [
    "Your browser's speech service turns your voice into words. Check them and fix anything it heard wrong.",
    "El servicio de voz de tu navegador convierte tu voz en palabras. Revísalas y corrige lo que haya oído mal.",
  ],
  none: [
    "This browser cannot turn speech into words. Type what you said.",
    "Este navegador no puede convertir la voz en palabras. Escribe lo que dijiste.",
  ],
};
