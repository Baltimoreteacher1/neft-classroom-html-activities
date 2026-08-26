// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
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

    /* Long terms and definitions wrap instead of widening their track, so the
       board never forces the page to scroll sideways. */
    .vocab-dm-term,
    .vocab-dm-def {
      min-width: 0;
      overflow-wrap: anywhere;
      hyphens: auto;
    }

    /* Legibility (not motion): the base sizes below are set inline on each card
       so they travel with the element; these rules only carry the line-height
       and vertical rhythm that the bigger 6th-grade type needs. Cards are sized
       by their content — no fixed heights — so a two-line term and a four-line
       definition both grow instead of clipping. */
    .vocab-dm-term {
      line-height: 1.3;
    }
    .vocab-dm-def {
      line-height: 1.45;
    }

    /* Tablet / narrow-laptop band: one step down from the desktop size so two
       columns still fit side by side without the cards becoming a wall of
       wrapped words. Still well above the old 0.88rem. */
    @media (max-width: 900px) {
      .vocab-dm-term {
        font-size: 1.2rem !important;
        padding: 14px 16px !important;
      }
      .vocab-dm-def {
        font-size: 1.05rem !important;
        padding: 14px 16px !important;
      }
    }

    /* Layout aid (not motion): TWO COLUMNS ALWAYS — terms on one side,
       definitions on the other, at every viewport width and every zoom level.
       This used to collapse to a single full-width stack below 560px, which put
       every definition underneath every term and destroyed the left↔right
       pairing the activity is built on. Instead the decorative arrow column is
       dropped (it is redundant once the two columns sit side by side) and the
       cards get tighter padding, keeping a 44px+ tap target. */
    @media (max-width: 560px) {
      .vdm-board {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
        gap: var(--sp-2, 8px) !important;
      }
      .vdm-arrow-col {
        display: none !important;
      }
      .vocab-dm-term {
        font-size: 1.05rem !important;
        padding: 12px 12px !important;
      }
      .vocab-dm-def {
        font-size: 1rem !important;
        padding: 12px 12px !important;
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

// Takes the whole vocab entry so a lesson's `image` override (a term like
// "base" means something different in 4.4, 5.1, 6.1 and 10.5) is honored here
// too, not just in the glossary popup.
function vocabImageEl(entry) {
  const img = document.createElement("img");
  img.src = resolveVocabImage(entry.term, entry.image);
  img.alt = vocabImageAlt(entry.term, entry.definition);
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
    "font-size:1rem; font-weight:600; color:var(--muted); margin-bottom:var(--sp-4);";
  progress.textContent = `0 / ${terms.length} matched`;
  wrapper.append(progress);

  const board = document.createElement("div");
  board.className = "vdm-board";
  // The activity mounts a long way down the Vocab panel (2,339px on 5-3), so
  // the student who just chose it has to hunt for it. Bring it to them.
  requestAnimationFrame(() => {
    try {
      board.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (_) {
      /* older browsers ignore the options object; position is cosmetic */
    }
  });
  board.style.cssText =
    // FITTING THE BOARD ON ONE SCREEN. With 8 pairs this ran past 1,000px —
    // taller than a classroom laptop — so a student could not see the options
    // they were matching between (Joel, 2026-08-26: "it is hard to see all of
    // the options on the screen … because of the sizing and formatting").
    //
    // The height came from padding, a 64px min-height and a 52px image on every
    // row, NOT from the type, so the type is untouched and the padding is not.
    // The arrow gutter drops 44px → 26px, which also gives the text more width
    // and so fewer wrapped lines.
    // The DEFINITION column gets the width. Terms are one or two words
    // ("Trapezoid", "Height"); definitions are sentences, and at an equal split
    // they wrapped to three lines and made every row 123px tall. Measured on
    // 5-3, eight pairs: 878px of board in a 900px viewport, with nothing else
    // able to fit beside it.
    "display:grid; grid-template-columns:minmax(0, 0.72fr) 26px minmax(0, 1.28fr); gap:10px; align-items:start;";

  const termsCol = document.createElement("div");
  termsCol.style.cssText = "display:flex; flex-direction:column; gap:8px; min-width:0;";

  const arrowCol = document.createElement("div");
  arrowCol.className = "vdm-arrow-col";
  arrowCol.style.cssText =
    "display:flex; flex-direction:column; gap:8px; align-items:center; padding-top:8px;";

  const defsCol = document.createElement("div");
  defsCol.style.cssText = "display:flex; flex-direction:column; gap:8px; min-width:0;";

  let selectedTerm = null;
  let selectedTermEl = null;

  shuffledTerms.forEach((term, i) => {
    const el = document.createElement("button");
    el.className = "vocab-dm-term";
    el.dataset.termIdx = String(i);
    el.dataset.termName = term.term;
    el.style.cssText = `
      display:flex; align-items:center; gap:var(--sp-2);
      padding:10px 14px; border:2px solid var(--teal); border-radius:var(--radius-md);
      background:white; font-weight:600; font-size:1.35rem; line-height:1.25; text-align:left;
      cursor:pointer; transition:all var(--duration-fast) ease; width:100%;
      color:var(--ink);
    `;
    el.append(vocabImageEl(term));
    const termLabel = document.createElement("span");
    if (term.termEs) {
      termLabel.innerHTML = "";
      const en = document.createElement("span");
      en.textContent = term.term;
      const es = document.createElement("span");
      es.lang = "es";
      es.style.cssText =
        // Kept proportional to the English term (~0.8×) so the Spanish support
        // label stays comfortably readable rather than shrinking to a footnote.
        "display:block; margin-top:2px; font-size:1.05rem; font-weight:500; font-style:italic; color:var(--muted);";
      es.textContent = term.termEs;
      termLabel.append(en, es);
    } else {
      termLabel.textContent = term.term;
    }
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
      // Height tracks the definition card's min-height so the decorative arrows
      // keep roughly lining up with the rows.
      "color:var(--muted); font-size:1.2rem; height:56px; display:grid; place-items:center;";
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
      padding:10px 14px; border:2px dashed var(--line); border-radius:var(--radius-md);
      background:white; font-size:1.15rem; line-height:1.35; text-align:left; cursor:pointer;
      transition:all var(--duration-fast) ease; width:100%; min-height:56px;
      color:var(--ink);
    `;
    el.textContent = term.definition;
    if (term.definitionEs) {
      const es = document.createElement("span");
      es.lang = "es";
      es.style.cssText =
        // Same proportional rule as the term sub-label: readable support text,
        // clearly secondary to the English definition above it.
        "display:block; margin-top:6px; font-size:1rem; font-style:italic; color:var(--muted);";
      es.textContent = term.definitionEs;
      el.append(es);
    }

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
    const termEl = termsCol.querySelector(`[data-term-name="${CSS.escape(draggedTermName)}"]`);

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
