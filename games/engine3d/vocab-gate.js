import { onActivate } from "./a11y.js";
import { resolveVocabImage } from "../../engine/core/vocab-images.js";

/**
 * Level 1 vocab intro. Shows word + plain-language definition + image for each
 * term BEFORE gameplay. Student clicks through; onComplete fires at the end.
 *
 * terms: [{ term, definition, image?, emoji? }]
 * image: URL (preferred). If absent, emoji or an SVG letter placeholder is used.
 */
export function showVocabGate(
  mountEl,
  { terms = [], onComplete, announce } = {},
) {
  if (!mountEl) throw new Error("showVocabGate: mountEl is required");
  injectVocabStyles();

  if (!terms.length) {
    if (onComplete) onComplete();
    return { dispose() {} };
  }

  const overlay = document.createElement("div");
  overlay.className = "e3d-vocab";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Key words before we play");
  mountEl.appendChild(overlay);

  let i = 0;

  function render() {
    const t = terms[i];
    const media = mediaFor(t);
    const last = i === terms.length - 1;
    overlay.innerHTML = `
      <div class="e3d-vocab-card">
        <div class="e3d-vocab-step">Key word ${i + 1} of ${terms.length}</div>
        <div class="e3d-vocab-media">${media}</div>
        <h2 class="e3d-vocab-term">${escapeHtml(t.term)}</h2>
        <p class="e3d-vocab-def">${escapeHtml(t.definition || "")}</p>
        <div class="e3d-vocab-actions">
          ${i > 0 ? '<button class="e3d-vocab-back" type="button">Back</button>' : ""}
          <button class="e3d-vocab-next" type="button">${last ? "Start playing ▶" : "Next →"}</button>
        </div>
        <div class="e3d-vocab-dots">${terms.map((_, n) => `<span class="${n === i ? "on" : ""}"></span>`).join("")}</div>
      </div>`;

    const nextBtn = overlay.querySelector(".e3d-vocab-next");
    const backBtn = overlay.querySelector(".e3d-vocab-back");
    onActivate(nextBtn, advance);
    if (backBtn)
      onActivate(backBtn, () => {
        i = Math.max(0, i - 1);
        render();
      });
    nextBtn.focus();
    if (announce) announce(`${t.term}. ${t.definition || ""}`);
  }

  function advance() {
    if (i < terms.length - 1) {
      i += 1;
      render();
    } else {
      finish();
    }
  }

  function finish() {
    dispose();
    if (onComplete) onComplete();
  }

  function dispose() {
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }

  render();
  return { dispose };
}

function mediaFor(t) {
  const src = t.image || resolveVocabImage(t.term);
  if (src) {
    return `<img src="${escapeAttr(src)}" alt="${escapeAttr(t.term)}" class="e3d-vocab-img"
      onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'e3d-vocab-emoji',textContent:'${escapeAttr(t.emoji || letterFor(t.term))}'}))" />`;
  }
  return `<div class="e3d-vocab-emoji">${escapeHtml(t.emoji || letterFor(t.term))}</div>`;
}

function letterFor(term) {
  return (term || "?").trim().charAt(0).toUpperCase() || "?";
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function escapeAttr(s) {
  return escapeHtml(s);
}

function injectVocabStyles() {
  if (document.getElementById("e3d-vocab-styles")) return;
  const s = document.createElement("style");
  s.id = "e3d-vocab-styles";
  s.textContent = `
  .e3d-vocab{position:absolute;inset:0;z-index:40;display:flex;align-items:center;
    justify-content:center;background:rgba(18,53,91,.94);padding:var(--sp-4,16px);
    font-family:var(--font-body,system-ui,sans-serif);}
  .e3d-vocab-card{background:var(--card,#fff);color:var(--ink,#21313f);max-width:440px;width:100%;
    border-radius:var(--radius-lg,22px);padding:var(--sp-6,24px);text-align:center;
    box-shadow:0 18px 50px rgba(0,0,0,.4);}
  .e3d-vocab-step{font-size:13px;font-weight:700;color:var(--teal,#1fa6a2);
    text-transform:uppercase;letter-spacing:.05em;}
  .e3d-vocab-media{margin:var(--sp-4,16px) auto;width:160px;height:160px;border-radius:var(--radius-md,14px);
    background:var(--teal-light,#dff2ee);display:flex;align-items:center;justify-content:center;overflow:hidden;}
  .e3d-vocab-img{width:100%;height:100%;object-fit:cover;}
  .e3d-vocab-emoji{font-size:84px;line-height:1;}
  .e3d-vocab-term{font-family:var(--font-display,system-ui,sans-serif);font-size:30px;
    margin:var(--sp-2,8px) 0;color:var(--navy,#12355b);}
  .e3d-vocab-def{font-size:18px;line-height:1.5;color:var(--muted,#5f6f80);margin:0 0 var(--sp-5,20px);}
  .e3d-vocab-actions{display:flex;gap:var(--sp-3,12px);justify-content:center;}
  .e3d-vocab-next,.e3d-vocab-back{font-size:17px;font-weight:700;border:none;cursor:pointer;
    padding:12px 24px;border-radius:999px;font-family:var(--font-display,system-ui,sans-serif);}
  .e3d-vocab-next{background:var(--teal,#1fa6a2);color:#fff;}
  .e3d-vocab-back{background:var(--line,#d7e2ed);color:var(--ink,#21313f);}
  .e3d-vocab-next:focus-visible,.e3d-vocab-back:focus-visible{outline:3px solid var(--amber,#f2c15b);outline-offset:2px;}
  .e3d-vocab-dots{display:flex;gap:6px;justify-content:center;margin-top:var(--sp-5,20px);}
  .e3d-vocab-dots span{width:9px;height:9px;border-radius:50%;background:var(--line,#d7e2ed);}
  .e3d-vocab-dots span.on{background:var(--teal,#1fa6a2);}`;
  document.head.appendChild(s);
}
