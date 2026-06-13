import { resolveVocabImage, vocabImageAlt } from "../core/vocab-images.js";

// ─────────────────────────────────────────────────────────────────────────
// Inject-once scoped polish styles. This component renders into 1000s of
// activities, so the <style> block is added exactly once per document and is
// purely ADDITIVE — it augments the existing .vocab-dm-term / .vocab-dm-def
// classes and the new vdm-* hooks WITHOUT changing any layout, interaction,
// checking, callback, or return value the JS depends on. EVERY animation /
// transition lives inside `@media (prefers-reduced-motion: reduce)` negation —
// i.e. it is suppressed for reduced-motion users so they get the original calm
// experience. The mobile single-column reflow and the keyboard focus ring are
// layout / accessibility aids (not motion) and apply to everyone.
const VDM_STYLE_ID = "vdm-polish-styles";
function injectVocabDragMatchStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(VDM_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = VDM_STYLE_ID;
  style.textContent = `
    /* Accessibility aid (not motion): visible focus ring for keyboard users so
       tab/arrow navigation through terms and definitions is always legible. */
    .vocab-dm-term:focus-visible,
    .vocab-dm-def:focus-visible {
      outline: 3px solid var(--teal, #1fa6a2);
      outline-offset: 2px;
    }

    /* Layout aid (not motion): on narrow screens collapse the three-column
       term → arrow → definition board into a single full-width stack so cards
       and drop targets stay big and tappable. Arrows rotate to point downward. */
    @media (max-width: 560px) {
      .vdm-board {
        grid-template-columns: 1fr !important;
      }
      .vdm-arrow-col {
        flex-direction: row !important;
        justify-content: center;
        padding-top: 0 !important;
      }
      .vdm-arrow {
        transform: rotate(90deg);
      }
      .vocab-dm-term,
      .vocab-dm-def {
        font-size: 1rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      /* Reduced-motion users: no celebration pop, no shake — only the instant
         color/state changes the original component already applied. */
      .vocab-dm-term.vdm-correct,
      .vocab-dm-def.vdm-correct,
      .vocab-dm-term.vdm-wrong,
      .vocab-dm-def.vdm-wrong {
        animation: none !important;
      }
    }

    /* Success celebration micro-animation: a gentle confidence pop on a correct
       match. Guarded — suppressed above for reduced-motion users. */
    .vocab-dm-term.vdm-correct,
    .vocab-dm-def.vdm-correct {
      animation: vdmPop 0.4s var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
    }
    @keyframes vdmPop {
      0%   { transform: scale(1); }
      45%  { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    /* Error feedback: a short, restrained horizontal shake on a wrong match.
       Guarded — suppressed above for reduced-motion users. */
    .vocab-dm-term.vdm-wrong,
    .vocab-dm-def.vdm-wrong {
      animation: vdmShake 0.4s ease-in-out;
    }
    @keyframes vdmShake {
      0%, 100% { transform: translateX(0); }
      20%      { transform: translateX(-5px); }
      40%      { transform: translateX(5px); }
      60%      { transform: translateX(-3px); }
      80%      { transform: translateX(3px); }
    }
  `;
  (document.head || document.documentElement).append(style);
}

function vocabImageEl(term, definition) {
  const img = document.createElement("img");
  img.src = resolveVocabImage(term);
  img.alt = vocabImageAlt(term, definition);
  img.loading = "lazy";
  img.draggable = false;
  img.style.cssText = `
    width:40px; aspect-ratio:4 / 3; flex:0 0 auto; vertical-align:middle;
    border-radius:var(--radius-sm); background:var(--card);
    border:1px solid var(--line); object-fit:contain;
  `;
  return img;
}

export function renderVocabDragMatch(container, { terms, onComplete }) {
  injectVocabDragMatchStyles();
  const wrapper = document.createElement("div");

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div class="section-icon section-icon-teal">🔗</div>
    <div>
      <div class="section-title">Term Match</div>
      <div class="section-desc">Drag each term to its correct definition.</div>
    </div>
  `;
  wrapper.append(header);

  const shuffledTerms = [...terms].sort(() => Math.random() - 0.5);
  const shuffledDefs = [...terms].sort(() => Math.random() - 0.5);

  let matchedCount = 0;
  let attempts = 0;
  const matched = new Set();

  const progress = document.createElement("div");
  progress.style.cssText =
    "font-size:0.85rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-4);";
  progress.textContent = `0 / ${terms.length} matched`;
  wrapper.append(progress);

  const board = document.createElement("div");
  board.className = "vdm-board";
  board.style.cssText =
    "display:grid; grid-template-columns:1fr 40px 1fr; gap:var(--sp-3); align-items:start;";

  const termsCol = document.createElement("div");
  termsCol.style.cssText =
    "display:flex; flex-direction:column; gap:var(--sp-2);";

  const arrowCol = document.createElement("div");
  arrowCol.className = "vdm-arrow-col";
  arrowCol.style.cssText =
    "display:flex; flex-direction:column; gap:var(--sp-2); align-items:center; padding-top:12px;";

  const defsCol = document.createElement("div");
  defsCol.style.cssText =
    "display:flex; flex-direction:column; gap:var(--sp-2);";

  let selectedTerm = null;
  let selectedTermEl = null;

  shuffledTerms.forEach((term, i) => {
    const el = document.createElement("button");
    el.className = "vocab-dm-term";
    el.dataset.termIdx = String(i);
    el.dataset.termName = term.term;
    el.style.cssText = `
      display:flex; align-items:center; gap:var(--sp-2);
      padding:12px 16px; border:2px solid var(--teal); border-radius:var(--radius-md);
      background:white; font-weight:700; font-size:0.92rem; text-align:left;
      cursor:pointer; transition:all var(--duration-fast) ease; width:100%;
      color:var(--ink);
    `;
    el.append(vocabImageEl(term.term, term.definition));
    const termLabel = document.createElement("span");
    termLabel.textContent = term.term;
    el.append(termLabel);

    el.setAttribute("draggable", "true");
    el.addEventListener("dragstart", (e) => {
      if (matched.has(term.term)) return;
      e.dataTransfer.setData("text/plain", term.term);
      el.style.opacity = "0.5";
    });
    el.addEventListener("dragend", () => {
      el.style.opacity = "";
    });

    el.addEventListener("click", () => {
      if (matched.has(term.term)) return;
      if (selectedTermEl) {
        selectedTermEl.style.background = "white";
        selectedTermEl.style.boxShadow = "";
      }
      selectedTerm = term.term;
      selectedTermEl = el;
      el.style.background = "var(--teal-light)";
      el.style.boxShadow = "var(--shadow-glow)";
    });

    termsCol.append(el);
  });

  shuffledTerms.forEach(() => {
    const arrow = document.createElement("span");
    arrow.className = "vdm-arrow";
    arrow.style.cssText =
      "color:var(--muted); font-size:1.2rem; height:48px; display:grid; place-items:center;";
    arrow.textContent = "→";
    arrowCol.append(arrow);
  });

  shuffledDefs.forEach((term) => {
    const el = document.createElement("button");
    el.className = "vocab-dm-def";
    // NB: the term this definition belongs to is captured in the closure
    // (`term`) and used by checkMatch — it is deliberately NOT written to a
    // data-* attribute, which would expose the answer pairing in the DOM.
    el.style.cssText = `
      padding:12px 16px; border:2px dashed var(--line); border-radius:var(--radius-md);
      background:white; font-size:0.88rem; text-align:left; cursor:pointer;
      transition:all var(--duration-fast) ease; width:100%; min-height:48px;
      color:var(--ink);
    `;
    el.textContent = term.definition;

    el.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (!matched.has(term.term)) el.style.borderColor = "var(--teal)";
    });
    el.addEventListener("dragleave", () => {
      if (!matched.has(term.term)) el.style.borderColor = "var(--line)";
    });
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      el.style.borderColor = "var(--line)";
      const droppedTerm = e.dataTransfer.getData("text/plain");
      checkMatch(droppedTerm, term.term, el);
    });

    el.addEventListener("click", () => {
      if (!selectedTerm || matched.has(term.term)) return;
      checkMatch(selectedTerm, term.term, el);
      if (selectedTermEl) {
        selectedTermEl.style.background = "white";
        selectedTermEl.style.boxShadow = "";
      }
      selectedTerm = null;
      selectedTermEl = null;
    });

    defsCol.append(el);
  });

  function checkMatch(draggedTermName, defTermName, defEl) {
    attempts++;
    const termEl = termsCol.querySelector(
      `[data-term-name="${CSS.escape(draggedTermName)}"]`,
    );

    if (draggedTermName === defTermName) {
      matched.add(draggedTermName);
      matchedCount++;
      progress.textContent = `${matchedCount} / ${terms.length} matched`;

      if (termEl) {
        termEl.style.background = "var(--success-bg)";
        termEl.style.borderColor = "var(--success)";
        termEl.style.color = "var(--success)";
        termEl.style.cursor = "default";
        termEl.classList.add("vdm-correct");
      }
      defEl.style.background = "var(--success-bg)";
      defEl.style.borderColor = "var(--success)";
      defEl.style.borderStyle = "solid";
      defEl.style.color = "var(--success)";
      defEl.style.cursor = "default";
      defEl.classList.add("vdm-correct");

      if (matchedCount === terms.length) {
        setTimeout(() => {
          if (onComplete) onComplete(terms.length, attempts);
        }, 600);
      }
    } else {
      if (termEl) {
        termEl.style.borderColor = "var(--error)";
        termEl.classList.add("incorrect", "vdm-wrong");
        setTimeout(() => {
          termEl.style.borderColor = "var(--teal)";
          termEl.classList.remove("incorrect", "vdm-wrong");
        }, 600);
      }
      defEl.style.borderColor = "var(--error)";
      defEl.style.background = "var(--error-bg)";
      defEl.classList.add("vdm-wrong");
      setTimeout(() => {
        defEl.style.borderColor = "var(--line)";
        defEl.style.background = "white";
        defEl.classList.remove("vdm-wrong");
      }, 600);
    }
  }

  board.append(termsCol, arrowCol, defsCol);
  wrapper.append(board);
  container.append(wrapper);
}
