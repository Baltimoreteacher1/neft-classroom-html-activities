let _cachedVoices = [];

function refreshVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  try {
    _cachedVoices = window.speechSynthesis.getVoices() || [];
  } catch (_) {
    _cachedVoices = [];
  }
  return _cachedVoices;
}

const voiceListeners = new Set();

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  try {
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      refreshVoices();
      for (const fn of voiceListeners) fn();
    });
  } catch (_) {}
}

/**
 * Voices load after the page does (and again when a device finishes
 * downloading one). A voice picker calls this to fill itself in when they
 * arrive. Returns an unsubscribe function.
 */
export function onVoicesChanged(fn) {
  voiceListeners.add(fn);
  return () => voiceListeners.delete(fn);
}

const VOICE_PREF_KEY = "nt-read-aloud-voice";
const VOICE_PREF_KEY_ES = "nt-read-aloud-voice-es";

const primaryOf = (lang) =>
  String(lang || "en-US")
    .toLowerCase()
    .split("-")[0];
const prefKeyFor = (lang) => (primaryOf(lang) === "es" ? VOICE_PREF_KEY_ES : VOICE_PREF_KEY);

/**
 * The voice a teacher or student CHOSE for a language, if any. Read-aloud used
 * to pick one on its own with no way to overrule it, so a device whose "best"
 * match was a voice the class found hard to follow was stuck with it (Joel,
 * 2026-08-26: "the voice reading, is it possible to change?").
 *
 * Stored per device, by name, one choice per language: an English voice never
 * hijacks the Spanish lane. The English key is the original one, so choices
 * made before Spanish had its own still apply. A name that is not installed on
 * this device simply loses and the automatic pick takes over, so a preference
 * copied between machines can never leave a lesson silent.
 */
export function getPreferredVoiceName(lang = "en-US") {
  try {
    return localStorage.getItem(prefKeyFor(lang)) || "";
  } catch (_) {
    return "";
  }
}

export function setPreferredVoiceName(name, lang = "en-US") {
  try {
    if (name) localStorage.setItem(prefKeyFor(lang), String(name));
    else localStorage.removeItem(prefKeyFor(lang));
  } catch (_) {
    /* storage blocked — the choice lasts for this page only */
  }
}

/**
 * Voices saved on the device work with no connection; the rest stream from a
 * speech service. When the device is offline only the saved ones can speak.
 */
function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Every installed voice for a language, for a picker to list.
 * `localOnly` keeps just the voices stored on this device.
 */
export function listVoices(lang = "en-US", { localOnly = false } = {}) {
  const primary = primaryOf(lang);
  return refreshVoices().filter(
    (v) =>
      v.lang &&
      v.lang.toLowerCase().startsWith(primary) &&
      (!localOnly || v.localService !== false),
  );
}

/**
 * The best voice for a language. `localOnly` is for devices that should not
 * use a network voice; it is also forced on when the device has no connection.
 */
export function pickBestVoice(lang = "en-US", { localOnly = false } = {}) {
  const offlineOnly = localOnly || isOffline();
  const voices = refreshVoices().filter((v) => !offlineOnly || v.localService !== false);
  if (!voices.length) return null;

  const targetLang = String(lang || "en-US").toLowerCase();
  const primaryLang = targetLang.split("-")[0]; // "en" or "es"

  // A chosen voice wins over every heuristic below — but only when it speaks
  // the language being read, so choosing an English voice does not hijack the
  // Spanish lane.
  const preferred = getPreferredVoiceName(lang);
  if (preferred) {
    const chosen = voices.find(
      (v) => v.name === preferred && v.lang && v.lang.toLowerCase().startsWith(primaryLang),
    );
    if (chosen) return chosen;
  }

  // Filter voices matching primary language subtag
  const matchingVoices = voices.filter(
    (v) => v.lang && v.lang.toLowerCase().startsWith(primaryLang),
  );
  if (!matchingVoices.length) return null;

  // Keywords indicating high-quality, natural neural voices
  const premiumKeywords = [
    "natural",
    "neural",
    "google",
    "premium",
    "enhanced",
    "samantha",
    "alex",
    "karen",
    "daniel",
    "victoria",
    "paulina",
    "monica",
    "jorge",
    "helena",
  ];

  // 1. Check for premium/natural voice matching exact language tag (e.g. en-US or es-US/es-MX)
  let best = matchingVoices.find((v) => {
    const name = (v.name || "").toLowerCase();
    const matchesTag = v.lang.toLowerCase() === targetLang;
    return matchesTag && premiumKeywords.some((kw) => name.includes(kw));
  });
  if (best) return best;

  // 2. Check for premium/natural voice in primary language (e.g. any natural English/Spanish)
  best = matchingVoices.find((v) => {
    const name = (v.name || "").toLowerCase();
    return premiumKeywords.some((kw) => name.includes(kw));
  });
  if (best) return best;

  // 3. Fallback to exact tag match
  best = matchingVoices.find((v) => v.lang && v.lang.toLowerCase() === targetLang);
  if (best) return best;

  // 4. Fallback to any voice in primary language
  return matchingVoices[0] || null;
}

/**
 * An utterance with the right language, voice and speed already set. The one
 * place that decides how a line is spoken, so read-aloud, the lesson tools and
 * voice commands all sound the same and obey the same voice choice.
 */
export function makeUtterance(text, lang = "en-US", { rate = 0.92, localOnly = false } = {}) {
  const u = new SpeechSynthesisUtterance(String(text));
  u.lang = lang || "en-US";
  const voice = pickBestVoice(u.lang, { localOnly });
  if (voice) u.voice = voice;
  u.rate = rate;
  u.pitch = 1.0;
  return u;
}

export function speakText(text, lang = "en-US") {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(makeUtterance(text, lang));
  } catch (_) {}
}

/**
 * A voice picker in the Tools menu: every voice installed on this device for
 * the language being read, plus "Automatic". Mounted next to the other Tools
 * actions so it sits where the rest of the read-aloud controls live, and
 * speaks a sample on change so the chooser hears the result immediately.
 *
 * Idempotent, and a no-op on a device with no speech synthesis or before the
 * Tools menu exists — it retries briefly, the same shape mountToolsMenuItem
 * uses, because the menu mounts after the lesson shell.
 */
export function mountVoicePicker() {
  if (typeof document === "undefined") return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const tryMount = () => {
    const slot = document.querySelector('.nt-utility-pop [data-slot="actions"]');
    if (!slot || slot.querySelector("[data-voice-picker]")) return !!slot;
    const voices = listVoices("en-US");
    if (!voices.length) return false;

    const row = document.createElement("div");
    row.className = "nt-utility-item";
    row.setAttribute("data-voice-picker", "");
    row.style.cssText = "display:flex; align-items:center; gap:8px; flex-wrap:wrap;";
    const label = document.createElement("label");
    label.textContent = "🗣️ Reading voice";
    label.setAttribute("for", "nt-voice-select");
    label.style.cssText = "font-weight:600;";
    const select = document.createElement("select");
    select.id = "nt-voice-select";
    select.style.cssText = "flex:1 1 160px; min-width:0; padding:4px 6px; border-radius:8px;";
    const auto = document.createElement("option");
    auto.value = "";
    auto.textContent = "Automatic (best match)";
    select.append(auto);
    for (const v of voices) {
      const opt = document.createElement("option");
      opt.value = v.name;
      opt.textContent = v.name;
      select.append(opt);
    }
    select.value = getPreferredVoiceName();
    select.addEventListener("change", () => {
      setPreferredVoiceName(select.value);
      speakText("This is how the reading voice will sound.", "en-US");
    });
    row.append(label, select);
    slot.append(row);
    return true;
  };

  if (tryMount()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (tryMount() || tries > 20) clearInterval(timer);
  }, 250);
}
