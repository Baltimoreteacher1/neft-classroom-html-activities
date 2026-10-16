//
// Accessibility + access aid (great for emerging readers and ESOL). It never
// listens until the student taps the mic, and it shows what it heard.
//
// mountVoiceNav({ getCurrentPhase, phaseCount, phaseNames, navigateTo, getPhaseEl })
//
// It listens in the language the student chose (EN or ES) and understands the
// commands in both. Spoken replies use the shared reading voice, so the voice a
// student picked for read-aloud is the voice they hear here too.

import { getPreferredLang } from "./i18n.js";
import { makeUtterance } from "./speech-voice.js";

/** Command words, matched after accents are removed so "atrás" and "atras" both work. */
const COMMANDS = {
  en: {
    stop: /\b(stop|quiet|silence|pause)\b/,
    read: /\b(read|listen|say|aloud)\b/,
    help: /\b(explain|help|stuck|hint|i'?m stuck)\b/,
    back: /\b(back|previous|go back|before)\b/,
    next: /\b(next|forward|continue|onward|go on)\b/,
  },
  es: {
    stop: /\b(para|parar|calla|silencio|pausa)\b/,
    read: /\b(lee|leer|leelo|lee esto|escuchar|en voz alta)\b/,
    help: /\b(ayuda|ayudame|pista|explica|explicar|atascado|atascada)\b/,
    back: /\b(atras|anterior|regresa|regresar|volver)\b/,
    next: /\b(siguiente|adelante|continua|continuar|proximo|sigue)\b/,
  },
};

const SAY = {
  en: {
    mic: "Voice control: tap, then say next, back, or read this",
    reading: "Reading this part…",
    heard: (t) => `Heard: "${t}"`,
    stopped: "Stopped reading.",
    opening: "Opening help…",
    noHelper: "No helper on this part.",
    last: "This is the last part.",
    try: "Try: next, back, or read this.",
    denied: "Microphone permission is off.",
    off: "Voice off.",
    listening: "Listening… say next, back, or read this.",
  },
  es: {
    mic: "Control por voz: toca y di siguiente, atrás o leer esto",
    reading: "Leyendo esta parte…",
    heard: (t) => `Escuché: "${t}"`,
    stopped: "Lectura detenida.",
    opening: "Abriendo la ayuda…",
    noHelper: "No hay ayuda en esta parte.",
    last: "Esta es la última parte.",
    try: "Prueba: siguiente, atrás o leer esto.",
    denied: "El micrófono está apagado.",
    off: "Voz apagada.",
    listening: "Escuchando… di siguiente, atrás o leer esto.",
  },
};

const plain = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export function mountVoiceNav(opts) {
  const SR =
    (typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
    null;
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  // Need at least recognition to be useful.
  if (!SR) return null;

  const { getCurrentPhase, phaseCount, phaseNames, navigateTo, getPhaseEl } = opts;
  // Read each time, so a student who switches EN/ES mid-lesson is understood.
  const langKey = () => (getPreferredLang() === "es" ? "es" : "en");
  const say = () => SAY[langKey()];

  const mic = document.createElement("button");
  mic.type = "button";
  mic.className = "nt-voice-mic";
  mic.setAttribute("aria-label", say().mic);
  mic.setAttribute("aria-pressed", "false");
  mic.textContent = "🎤";
  mic.style.cssText =
    "position:fixed; right:16px; bottom:146px; z-index:9997; width:52px; height:52px; " +
    "border-radius:50%; border:0; background:#1fa6a2; color:#fff; font-size:1.4rem; " +
    "cursor:pointer; box-shadow:0 4px 14px rgba(12,27,42,.28); transition:background .15s;";
  document.body.appendChild(mic);

  const status = document.createElement("div");
  status.setAttribute("aria-live", "polite");
  status.style.cssText =
    "position:fixed; right:74px; bottom:150px; z-index:9997; max-width:240px; padding:8px 14px; " +
    "border-radius:12px; background:#12355b; color:#fff; font-size:.9rem; font-weight:500; " +
    "box-shadow:0 4px 14px rgba(12,27,42,.28); display:none;";
  document.body.appendChild(status);

  let listening = false;
  let rec = null;
  let statusTimer = null;

  function showStatus(msg, sticky) {
    status.textContent = msg;
    status.style.display = "block";
    if (statusTimer) clearTimeout(statusTimer);
    if (!sticky) statusTimer = setTimeout(() => (status.style.display = "none"), 2600);
  }

  function speak(text) {
    if (!canSpeak || !text) return;
    window.speechSynthesis.cancel();
    const lang = langKey() === "es" ? "es-US" : "en-US";
    window.speechSynthesis.speak(makeUtterance(text.slice(0, 4000), lang, { rate: 0.95 }));
  }

  function readCurrent() {
    const el = getPhaseEl?.();
    if (!el) return;
    // Read visible text only, collapsed to a clean string.
    const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    speak(text);
    showStatus(say().reading);
  }

  function handle(transcript) {
    const t = plain(transcript).trim();
    showStatus(say().heard(transcript.trim()));
    const cur = getCurrentPhase();
    const words = COMMANDS[langKey()];

    if (words.stop.test(t)) {
      if (canSpeak) window.speechSynthesis.cancel();
      showStatus(say().stopped);
      return;
    }
    if (words.read.test(t)) {
      readCurrent();
      return;
    }
    if (words.help.test(t)) {
      const stuck = document.querySelector(
        '[data-stuck-support] button, .stuck-support-bar button, [data-tool="explain"], button.nt-stuck-btn',
      );
      if (stuck) {
        /** @type {HTMLElement} */ (stuck).click();
        showStatus(say().opening);
      } else {
        showStatus(say().noHelper);
      }
      return;
    }
    if (words.back.test(t)) {
      if (cur > 0) navigateTo(cur - 1);
      return;
    }
    if (words.next.test(t)) {
      if (cur < phaseCount - 1) navigateTo(cur + 1);
      else showStatus(say().last);
      return;
    }
    // "go to <phase name>"
    const named = phaseNames.findIndex((n) => n && t.includes(plain(n)));
    if (named >= 0) {
      navigateTo(named);
      return;
    }
    showStatus(say().try);
  }

  function start() {
    rec = new SR();
    rec.lang = langKey() === "es" ? "es-US" : "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript || "";
      if (transcript) handle(transcript);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        stop();
        showStatus(say().denied);
      }
    };
    rec.onend = () => {
      // Re-arm while the student keeps voice mode on.
      if (listening) {
        try {
          rec.start();
        } catch (_err) {
          /* start() throws if called too fast; ignore */
        }
      }
    };
    try {
      rec.start();
    } catch (_err) {
      /* already started */
    }
  }

  function stop() {
    listening = false;
    mic.style.background = "#1fa6a2";
    mic.textContent = "🎤";
    mic.setAttribute("aria-pressed", "false");
    if (rec) {
      try {
        rec.stop();
      } catch (_err) {
        /* ignore */
      }
    }
  }

  mic.addEventListener("click", () => {
    if (listening) {
      stop();
      showStatus(say().off);
      return;
    }
    listening = true;
    mic.style.background = "#e8663c";
    mic.textContent = "🔴";
    mic.setAttribute("aria-pressed", "true");
    showStatus(say().listening, true);
    start();
  });

  return {
    destroy() {
      stop();
      mic.remove();
      status.remove();
    },
  };
}

export default mountVoiceNav;
