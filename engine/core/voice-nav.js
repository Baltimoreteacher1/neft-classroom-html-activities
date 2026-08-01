//
// Accessibility + access aid (great for emerging readers and ESOL). It never
// listens until the student taps the mic, and it shows what it heard.
//
// mountVoiceNav({ getCurrentPhase, phaseCount, phaseNames, navigateTo, getPhaseEl })

export function mountVoiceNav(opts) {
  const SR =
    (typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
    null;
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  // Need at least recognition to be useful.
  if (!SR) return null;

  const { getCurrentPhase, phaseCount, phaseNames, navigateTo, getPhaseEl } = opts;

  const mic = document.createElement("button");
  mic.type = "button";
  mic.className = "nt-voice-mic";
  mic.setAttribute("aria-label", "Voice control: tap, then say next, back, or read this");
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
    "border-radius:12px; background:#12355b; color:#fff; font-size:.9rem; font-weight:600; " +
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
    const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  function readCurrent() {
    const el = getPhaseEl?.();
    if (!el) return;
    // Read visible text only, collapsed to a clean string.
    const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    speak(text);
    showStatus("Reading this part…");
  }

  function handle(transcript) {
    const t = transcript.toLowerCase().trim();
    showStatus('Heard: "' + t + '"');
    const cur = getCurrentPhase();

    if (/\b(stop|quiet|silence|pause)\b/.test(t)) {
      if (canSpeak) window.speechSynthesis.cancel();
      showStatus("Stopped reading.");
      return;
    }
    if (/\b(read|listen|say|aloud)\b/.test(t)) {
      readCurrent();
      return;
    }
    if (/\b(explain|help|stuck|hint|i'?m stuck)\b/.test(t)) {
      const stuck = document.querySelector(
        '[data-stuck-support] button, .stuck-support-bar button, [data-tool="explain"], button.nt-stuck-btn',
      );
      if (stuck) {
        /** @type {HTMLElement} */ (stuck).click();
        showStatus("Opening help…");
      } else {
        showStatus("No helper on this part.");
      }
      return;
    }
    if (/\b(back|previous|go back|before)\b/.test(t)) {
      if (cur > 0) navigateTo(cur - 1);
      return;
    }
    if (/\b(next|forward|continue|onward|go on)\b/.test(t)) {
      if (cur < phaseCount - 1) navigateTo(cur + 1);
      else showStatus("This is the last part.");
      return;
    }
    // "go to <phase name>"
    const named = phaseNames.findIndex((n) => n && t.includes(n.toLowerCase()));
    if (named >= 0) {
      navigateTo(named);
      return;
    }
    showStatus("Try: next, back, or read this.");
  }

  function start() {
    rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript || "";
      if (transcript) handle(transcript);
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        stop();
        showStatus("Microphone permission is off.");
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
      showStatus("Voice off.");
      return;
    }
    listening = true;
    mic.style.background = "#e8663c";
    mic.textContent = "🔴";
    showStatus("Listening… say next, back, or read this.", true);
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
