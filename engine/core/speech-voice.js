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

export function pickBestVoice(lang = "en-US") {
  const voices = refreshVoices();
  if (!voices.length) return null;

  const targetLang = String(lang || "en-US").toLowerCase();
  const primaryLang = targetLang.split("-")[0]; // "en" or "es"

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
