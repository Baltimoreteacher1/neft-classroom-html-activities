// Practice-test runner tools that work on the live page, reused from the /assess engine:
//   Highlighter  (Independent Rehearsal) the engine's highlight-dom.js + tool-state.js: select text in the passage or
//                question, then press a colour. Offsets are saved with the run and re-applied after every render.
//   Mic check    (before the first Speaking question) the engine's MicPreflight: a real 3-second level check from the
//                live microphone. Always skippable: a learner without a microphone says the answer aloud instead.
import { MicPreflight, PREFLIGHT_MESSAGES } from "../acc/audio/mic-preflight.js";
import { applyHighlights, safeSelection } from "../acc/engine/highlight-dom.js";
import { addHighlight, HIGHLIGHT_COLORS } from "../acc/engine/tool-state.js";
import { announce, html, icon } from "../util.js";

// ── highlighter ───────────────────────────────────────────────────────────────
const COLOR_ES = { yellow: "Amarillo", blue: "Azul", green: "Verde" };
let pending = null; // last safe selection inside a highlightable scope
let stopSel = null;

/** Highlightable scopes on the current question: each passage paragraph and the question text. */
function scopesIn(root) {
  const out = {};
  root.querySelectorAll(".test-q .passage p").forEach((p, i) => {
    out[`p${i}`] = p;
  });
  const q = root.querySelector(".test-q .prompt-text");
  if (q) out.prompt = q;
  return out;
}

export function highlightBarHTML(I) {
  return html`<span class="test-hl" role="group" aria-label="${I.S("Highlighter", "Resaltador")}">
    ${icon("bookmark")}<span class="test-hl-label">${I.T("Highlight", "Resaltar")}</span>
    ${Object.entries(HIGHLIGHT_COLORS).map(
      ([key, c]) =>
        html`<button
          type="button"
          class="btn small acc-swatch swatch-${key}"
          data-hl-color="${key}"
          title="${I.S(`Select text, then press to highlight in ${c.label.toLowerCase()}`, `Selecciona texto y presiona para resaltar en ${COLOR_ES[key].toLowerCase()}`)}"
        >
          ${I.T(c.label, COLOR_ES[key])}
        </button>`,
    )}
    <button type="button" class="btn small" data-hl-clear>
      ${I.T("Clear highlights", "Borrar resaltado")}
    </button>
  </span>`;
}

/** Re-apply this question's highlights and start tracking selections. Returns nothing; call unmountLiveTools to stop. */
export function mountHighlighter(root, list) {
  stopSel?.();
  const scopes = scopesIn(root);
  applyHighlights(scopes, list || []);
  const doc = root.ownerDocument || root;
  const onSel = () => {
    const sel = doc.defaultView.getSelection?.();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    const safe = safeSelection(sel.getRangeAt(0), scopesIn(root));
    if (safe) pending = safe;
  };
  doc.addEventListener("selectionchange", onSel);
  stopSel = () => doc.removeEventListener("selectionchange", onSel);
}

/**
 * Handle a highlighter click. `state` is { list, save(list) } for the current question.
 * @returns {boolean} true when the click was a highlighter command
 */
export function onHighlightClick(e, root, state, I) {
  const colorBtn = e.target.closest?.("[data-hl-color]");
  const clear = e.target.closest?.("[data-hl-clear]");
  if (!colorBtn && !clear) return false;
  const scopes = scopesIn(root);
  if (clear) {
    state.save([]);
    applyHighlights(scopes, []);
    announce(I.S("Highlights removed.", "Se borró el resaltado."));
    return true;
  }
  const sel = (root.ownerDocument || root).defaultView.getSelection?.();
  const live =
    sel?.rangeCount && !sel.isCollapsed ? safeSelection(sel.getRangeAt(0), scopes) : null;
  const target = live || pending;
  pending = null;
  if (!target) {
    announce(
      I.S(
        "Select words in the passage or question first, then press a colour.",
        "Primero selecciona palabras del texto o de la pregunta y luego presiona un color.",
      ),
    );
    return true;
  }
  const key = colorBtn.dataset.hlColor;
  const next = addHighlight(state.list || [], { ...target, color: key });
  state.save(next);
  applyHighlights(scopes, next);
  sel?.removeAllRanges?.();
  announce(
    I.S(
      `${HIGHLIGHT_COLORS[key].label} highlight added.`,
      `Resaltado en ${COLOR_ES[key].toLowerCase()}.`,
    ),
  );
  return true;
}

// ── microphone check ──────────────────────────────────────────────────────────
const MIC_ES = {
  idle: "Revisa tu micrófono antes de empezar.",
  requesting: "Tu navegador pide usar el micrófono. Elige Permitir.",
  calibrating: "Di una oración en voz alta, como «Me llamo…». Revisando durante 3 segundos.",
  ready: "Tu micrófono funciona.",
  denied:
    "El micrófono está bloqueado. Permítelo en la configuración del sitio de tu navegador y vuelve a intentarlo.",
  unavailable:
    "No se encontró un micrófono. Conecta uno o usa otro dispositivo y vuelve a intentarlo.",
  unsupported:
    "Este navegador no puede grabar audio. Prueba una versión reciente de Chrome, Edge, Firefox o Safari.",
  silent: "El micrófono no te oyó. Revisa que no esté silenciado, acércate y vuelve a intentarlo.",
  interrupted: "El micrófono se detuvo. Revisa el dispositivo y vuelve a revisar.",
};
const micText = (I, state) =>
  I.S(PREFLIGHT_MESSAGES[state] || PREFLIGHT_MESSAGES.idle, MIC_ES[state] || MIC_ES.idle);
let mic = null;

/** Shown above the first Speaking question until the learner checks the microphone or skips. */
export function micCheckHTML(I) {
  return html`<section class="panel test-mic" aria-labelledby="micTitle">
    <h2 id="micTitle">${icon("record")} ${I.T("Check your microphone", "Revisa tu micrófono")}</h2>
    <p>
      ${I.T("The Speaking part starts here. Check that the microphone hears you before you answer. Nothing is recorded or saved during the check.", "Aquí empieza la parte de Hablar. Revisa que el micrófono te oiga antes de responder. Durante la revisión no se graba ni se guarda nada.")}
    </p>
    <p class="test-mic-status" role="status" data-mic-status>${micText(I, "idle")}</p>
    <span
      class="rec-meter test-mic-meter"
      style="--lvl:0.00"
      aria-hidden="true"
      data-mic-meter
    ></span>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-mic-check>
        ${icon("record")}${I.T("Check my microphone", "Revisar mi micrófono")}
      </button>
      <button type="button" class="btn" data-mic-skip>
        ${I.T("Skip: I have no microphone", "Omitir: no tengo micrófono")}
      </button>
    </div>
    <p class="fine">
      ${I.T("Without a microphone, say each answer aloud to your teacher or a partner and check the box under the question.", "Sin micrófono, di cada respuesta en voz alta a tu docente o a un compañero y marca la casilla debajo de la pregunta.")}
    </p>
  </section>`;
}

/**
 * Handle the mic-check buttons. `done(result)` is called with "ready" or "skipped" when the gate opens.
 * @returns {boolean} true when the click was a mic-check command
 */
export function onMicClick(e, root, I, done) {
  if (e.target.closest?.("[data-mic-skip]")) {
    mic?.destroy();
    mic = null;
    done("skipped");
    return true;
  }
  const btn = e.target.closest?.("[data-mic-check]");
  if (!btn) return false;
  const status = root.querySelector("[data-mic-status]");
  const meter = root.querySelector("[data-mic-meter]");
  mic?.destroy();
  btn.disabled = true;
  mic = new MicPreflight({
    onState: (state) => {
      if (status) status.textContent = micText(I, state);
    },
    onLevel: (lvl) => meter?.style.setProperty("--lvl", lvl.toFixed(2)),
  });
  mic.request().then((state) => {
    btn.disabled = false;
    if (state !== "ready") return;
    mic?.destroy();
    mic = null;
    done("ready");
  });
  return true;
}

export function unmountLiveTools() {
  stopSel?.();
  stopSel = null;
  pending = null;
  mic?.destroy();
  mic = null;
}
