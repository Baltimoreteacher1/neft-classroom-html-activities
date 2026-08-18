// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
//
// Design principle — ADDITIVE / HONOR-SYSTEM FALLBACK:
//   The textarea keeps working exactly as before. This attaches a mic button, a
//   live status line, and a keyword-chips row directly AFTER the textarea. If
//   SpeechRecognition is unsupported (or the mic is denied), the student can
//   still simply type — the feature degrades to nothing rather than blocking.
//   Every final utterance is APPENDED to the textarea and an `input` event is
//   dispatched so Save/Resume and any keyword checks observe the change.
//
// Public API:  attachVoiceInput(textarea, opts) -> { destroy } | null
//   opts.keywords : string[] target math words to listen for (chips light up)
//   opts.lang     : BCP-47 tag; defaults to <html lang> ('es-…' → Spanish UI)
//   opts.label    : optional mic button label

const STYLE_ID = "voice-explain-styles";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .vexp{--vx-teal:var(--teal,#2a9d8f);--vx-coral:var(--coral,#d9795d);--vx-navy:var(--navy,#264653);--vx-ink:var(--ink,#333);--vx-muted:var(--muted,#6b7280);
    margin:8px 0 2px}
  .vexp-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
  .vexp-btn{font:inherit;font-size:.86rem;font-weight:700;color:#fff;background:var(--vx-teal);border:1.5px solid var(--vx-teal);border-radius:999px;padding:8px 15px;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:6px}
  .vexp-btn:hover{filter:brightness(1.05)}
  .vexp-btn:focus-visible{outline:3px solid rgba(42,157,143,.4);outline-offset:2px}
  .vexp-btn[data-listening="1"]{background:var(--vx-coral);border-color:var(--vx-coral);animation:vexp-pulse 1.3s ease-in-out infinite}
  @keyframes vexp-pulse{0%,100%{box-shadow:0 0 0 0 rgba(217,121,93,.5)}50%{box-shadow:0 0 0 7px rgba(217,121,93,0)}}
  @media (prefers-reduced-motion:reduce){.vexp-btn[data-listening="1"]{animation:none}}
  .vexp-status{font-size:.84rem;color:var(--vx-muted);font-weight:500;min-height:1.1em;flex:1 1 160px}
  .vexp-status .interim{color:var(--vx-ink);font-style:italic}
  .vexp-status.err{color:var(--vx-coral);font-weight:600}
  .vexp-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  .vexp-chips:empty{display:none}
  .vexp-chip{font-size:.74rem;font-weight:600;color:var(--vx-navy);background:#fff;border:1.5px solid rgba(38,70,83,.22);border-radius:999px;padding:3px 9px;transition:.15s}
  .vexp-chip[data-used="1"]{color:#fff;background:var(--vx-teal);border-color:var(--vx-teal)}
`;
  document.head.appendChild(s);
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// Whole-wordish, accent- and case-insensitive keyword presence test. Escapes
// regex metacharacters so a keyword like "x + y" cannot break the pattern.
function hasWord(text, word) {
  const w = String(word || "").trim();
  if (!w) return false;
  const rx = new RegExp(
    `(^|[^\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}\\p{N}]|$)`,
    "iu",
  );
  return rx.test(text);
}

// Localized copy — Spanish when the page/opts lang starts with "es".
function strings(es) {
  return es
    ? {
        label: "🎤 Dilo en voz alta",
        stop: "⏹ Detener",
        listening: "Escuchando… habla ahora.",
        idle: "Toca el micrófono y explica tu razonamiento en voz alta.",
        added: "✓ Agregado a tu respuesta.",
        noSpeech: "No escuché nada — inténtalo de nuevo.",
        denied: "El micrófono está apagado — igual puedes escribir tu respuesta.",
        error: "El micrófono tuvo un problema — igual puedes escribir tu respuesta.",
        used: "usaste",
      }
    : {
        label: "🎤 Say it out loud",
        stop: "⏹ Stop",
        listening: "Listening… speak now.",
        idle: "Tap the mic and explain your thinking out loud.",
        added: "✓ Added to your answer.",
        noSpeech: "I didn't hear anything — try again.",
        denied: "Mic permission is off — you can still type your answer.",
        error: "The mic had a problem — you can still type your answer.",
        used: "used",
      };
}

export function attachVoiceInput(textarea, opts = {}) {
  try {
    if (!textarea || textarea.tagName !== "TEXTAREA") return null;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null; // unsupported → honor-system textarea still works

    const lang = String(opts.lang || document.documentElement.lang || "en-US");
    const es = /^es/i.test(lang);
    const t = strings(es);
    const keywords = Array.isArray(opts.keywords)
      ? opts.keywords.map((k) => String(k)).filter(Boolean)
      : [];

    injectStyles();

    // ── injected DOM (inserted directly after the textarea) ──────────────────
    const wrap = document.createElement("div");
    wrap.className = "vexp";
    wrap.innerHTML =
      `<div class="vexp-tools">` +
      `<button type="button" class="vexp-btn" data-el="mic" data-listening="0" aria-pressed="false">${esc(opts.label || t.label)}</button>` +
      `<span class="vexp-status" data-el="status" role="status" aria-live="polite"></span>` +
      `</div>` +
      `<div class="vexp-chips" data-el="chips" role="list" aria-label="${es ? "Palabras clave" : "Target words"}"></div>`;
    textarea.after(wrap);

    const micBtn = wrap.querySelector('[data-el="mic"]');
    const statusEl = wrap.querySelector('[data-el="status"]');
    const chipsEl = wrap.querySelector('[data-el="chips"]');

    // Chips are a VOCABULARY scaffold ("percent", "decimal"), not an answer key.
    // Connect keyword lists mix vocabulary with the scenario's numeric answers
    // (lesson 4-2 listed 60, 0.6 and 16 — the percent, the decimal and the sale
    // price), so rendering every keyword printed the answers on screen before
    // the student had answered. Numeric keywords still count toward the written
    // check below; they are just not displayed.
    keywords
      .filter((k) => !/^[\d.,$%/\s:-]+$/.test(k))
      .forEach((k) => {
        const c = document.createElement("span");
        c.className = "vexp-chip";
        c.dataset.used = "0";
        c.dataset.word = k;
        c.setAttribute("role", "listitem");
        c.textContent = k;
        chipsEl.appendChild(c);
      });

    let rec = null;
    let listening = false;
    statusEl.textContent = t.idle;

    function setStatus(text, kind) {
      statusEl.classList.toggle("err", kind === "err");
      statusEl.innerHTML =
        kind === "interim" ? `<span class="interim">${esc(text)}</span>` : esc(text);
    }

    function refreshChips(extra) {
      const hay = `${textarea.value} ${extra || ""}`;
      chipsEl.querySelectorAll(".vexp-chip").forEach((c) => {
        const used = hasWord(hay, c.dataset.word);
        c.dataset.used = used ? "1" : "0";
        c.textContent = used ? `✓ ${t.used}: ${c.dataset.word}` : c.dataset.word;
      });
    }

    function setListening(on) {
      listening = on;
      micBtn.dataset.listening = on ? "1" : "0";
      micBtn.setAttribute("aria-pressed", String(on));
      micBtn.textContent = on ? t.stop : opts.label || t.label;
    }

    function appendFinal(text) {
      const clean = String(text || "").trim();
      if (!clean) return;
      const sep = textarea.value && !/\s$/.test(textarea.value) ? " " : "";
      textarea.value += sep + clean;
      // Let Save/Resume + keyword checks see the transcription.
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
      refreshChips();
    }

    function stop() {
      if (rec) {
        try {
          rec.abort();
        } catch (_) {}
        rec = null;
      }
      setListening(false);
    }

    function start() {
      if (listening) {
        stop();
        setStatus(t.idle);
        return;
      }
      try {
        rec = new SR();
      } catch (_) {
        setStatus(t.error, "err");
        return;
      }
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      let gotResult = false;

      rec.onresult = (ev) => {
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          if (r.isFinal) {
            gotResult = true;
            appendFinal(r[0].transcript);
          } else {
            interim += r[0].transcript;
          }
        }
        if (interim) {
          setStatus(interim, "interim");
          refreshChips(interim);
        }
      };
      rec.onerror = (ev) => {
        const code = ev && ev.error;
        if (code === "not-allowed" || code === "service-not-allowed") setStatus(t.denied, "err");
        else if (code === "no-speech") setStatus(t.noSpeech, "err");
        else if (code !== "aborted") setStatus(t.error, "err");
        stop();
      };
      rec.onend = () => {
        setListening(false);
        if (gotResult) setStatus(t.added);
        else if (!statusEl.classList.contains("err")) setStatus(t.idle);
        rec = null;
      };

      try {
        rec.start();
        setListening(true);
        setStatus(t.listening);
      } catch (_) {
        setStatus(t.error, "err");
        stop();
      }
    }

    micBtn.addEventListener("click", start);
    // Keep chips honest if the student edits the textarea by hand too.
    const onInput = () => refreshChips();
    textarea.addEventListener("input", onInput);
    refreshChips();

    return {
      destroy() {
        stop();
        micBtn.removeEventListener("click", start);
        textarea.removeEventListener("input", onInput);
        wrap.remove();
      },
    };
  } catch (e) {
    console.warn("voice-explain: attach failed", e);
    return null;
  }
}

export default attachVoiceInput;
