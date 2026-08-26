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

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  refreshVoices();
  try {
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
  } catch (_) {}
}

const VOICE_PREF_KEY = "nt-read-aloud-voice";

/**
 * The voice a teacher CHOSE, if any. Read-aloud used to pick one on its own
 * with no way to overrule it, so a device whose "best" match was a voice the
 * class found hard to follow was stuck with it (Joel, 2026-08-26: "the voice
 * reading, is it possible to change?").
 *
 * Stored per device, by name. A name that is not installed on this device
 * simply loses and the automatic pick takes over, so a preference copied
 * between machines can never leave a lesson silent.
 */
export function getPreferredVoiceName() {
  try {
    return localStorage.getItem(VOICE_PREF_KEY) || "";
  } catch (_) {
    return "";
  }
}

export function setPreferredVoiceName(name) {
  try {
    if (name) localStorage.setItem(VOICE_PREF_KEY, String(name));
    else localStorage.removeItem(VOICE_PREF_KEY);
  } catch (_) {
    /* storage blocked — the choice lasts for this page only */
  }
}

/** Every installed voice for a language, for a picker to list. */
export function listVoices(lang = "en-US") {
  const primary = String(lang || "en-US")
    .toLowerCase()
    .split("-")[0];
  return refreshVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith(primary));
}

export function pickBestVoice(lang = "en-US") {
  const voices = refreshVoices();
  if (!voices.length) return null;

  const targetLang = String(lang || "en-US").toLowerCase();
  const primaryLang = targetLang.split("-")[0]; // "en" or "es"

  // A chosen voice wins over every heuristic below — but only when it speaks
  // the language being read, so choosing an English voice does not hijack the
  // Spanish lane.
  const preferred = getPreferredVoiceName();
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

export function speakText(text, lang = "en-US") {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = lang || "en-US";
    const voice = pickBestVoice(u.lang);
    if (voice) u.voice = voice;
    u.rate = 0.92;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
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
