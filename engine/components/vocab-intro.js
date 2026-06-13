import { resolveVocabImage, vocabImageAlt } from "../core/vocab-images.js";
import { exploreLabel, openExplorer } from "./vocab-explore.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// ─────────────────────────────────────────────────────────────────────────
// Inject-once scoped polish styles. This component renders into 1000s of
// activities, so the <style> block is added exactly once per document and is
// purely ADDITIVE — it augments the existing .vocab-card / .vocab-card-inner /
// .vocab-card-front / .vocab-card-back classes defined in design-system.css
// WITHOUT changing any layout, interaction, flip toggle, callback, or return
// value the JS depends on. EVERY animation / transition added here lives inside
// the prefers-reduced-motion negation (`@media not all and
// (prefers-reduced-motion: reduce)`), so reduced-motion users keep the original
// calm, instant experience. The mobile card-width / scroll-snap reflow and the
// keyboard focus ring are layout / accessibility aids (not motion) and apply to
// everyone.
const VI_STYLE_ID = "vi-polish-styles";
function injectVocabIntroStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(VI_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = VI_STYLE_ID;
  style.textContent = `
    /* Accessibility aid (not motion): visible focus ring for keyboard users so
       tabbing through flip cards is always legible. Applies to everyone. */
    .vocab-card:focus-visible {
      outline: 3px solid var(--teal, #1fa6a2);
      outline-offset: 3px;
      border-radius: var(--radius-md, 12px);
    }

    /* Layout aid (not motion): on narrow / touch screens make each flip card
       fill most of the viewport width and snap firmly to center so one card is
       comfortably readable at a time. Applies to everyone. */
    @media (max-width: 540px) {
      .vocab-container {
        scroll-snap-type: x mandatory;
        scroll-padding-inline: var(--sp-3, 12px);
      }
      .vocab-card {
        flex: 0 0 min(82vw, 300px);
        scroll-snap-align: center;
        scroll-snap-stop: always;
      }
    }

    /* All motion below is suppressed for prefers-reduced-motion users. */
    @media not all and (prefers-reduced-motion: reduce) {
      /* Hover / focus lift + deeper shadow for affordance and depth. */
      .vocab-card {
        transition: transform 0.25s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
      }
      .vocab-card:hover,
      .vocab-card:focus-visible {
        transform: translateY(-6px);
      }
      .vocab-card:hover .vocab-card-front,
      .vocab-card:hover .vocab-card-back,
      .vocab-card:focus-visible .vocab-card-front,
      .vocab-card:focus-visible .vocab-card-back {
        box-shadow: var(--shadow-lg, 0 16px 32px rgba(15, 35, 65, 0.22));
      }
      .vocab-card:active {
        transform: translateY(-2px);
      }

      /* Parallax on flip: a brief depth "pop" layered on the OUTER card so it
         composes with the inner element's rotateY flip (which the base CSS
         owns) instead of fighting it. The .vi-flipping class is added
         transiently by the JS flip handler and removed after the flip settles,
         so the resting transform is never altered. The card overrides its own
         hover transform here only while actively flipping. */
      .vocab-card.vi-flipping {
        animation: viFlipParallax 0.6s var(--ease-out, cubic-bezier(0.4, 0, 0.2, 1));
      }
      @keyframes viFlipParallax {
        0% { transform: translateY(0) scale(1); }
        45% { transform: translateY(-10px) scale(1.05); }
        100% { transform: translateY(0) scale(1); }
      }
    }
  `;
  document.head.append(style);
}

export function renderVocabIntro(container, { terms, onComplete }) {
  injectVocabIntroStyles();

  const wrapper = document.createElement("div");

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div class="section-icon section-icon-amber">📖</div>
    <div>
      <div class="section-title">Word Wall</div>
      <div class="section-desc">Tap each card to flip and study the definition. Say each word out loud!</div>
    </div>
  `;
  wrapper.append(header);

  const hint = document.createElement("p");
  hint.className = "vocab-flip-hint";
  hint.innerHTML =
    '<span aria-hidden="true">👆</span> <strong>Tap to flip</strong> — front shows the term, back shows the definition.';
  wrapper.append(hint);

  const scroll = document.createElement("div");
  scroll.className = "vocab-container";
  scroll.setAttribute("role", "list");
  scroll.setAttribute("aria-label", "Vocabulary flash cards");

  terms.forEach((t, i) => {
    const card = document.createElement("div");
    card.className = "vocab-card";
    card.setAttribute("role", "listitem");
    card.setAttribute("tabindex", "0");
    card.style.animationDelay = `${i * 0.06}s`;

    const inner = document.createElement("div");
    inner.className = "vocab-card-inner";

    const front = document.createElement("div");
    front.className = "vocab-card-front";

    const thumbWrap = document.createElement("div");
    thumbWrap.className = "vocab-thumb-wrap";
    const thumb = document.createElement("img");
    thumb.className = "vocab-thumb";
    thumb.src = resolveVocabImage(t.term, t.image);
    thumb.alt = vocabImageAlt(t.term, t.definition);
    thumb.loading = "lazy";
    thumbWrap.append(thumb);

    const termH = document.createElement("h3");
    termH.textContent = t.term;
    front.append(thumbWrap, termH);

    // Spanish term subtitle. Lesson configs carry the translation as `termEs`
    // (with `spanish` kept as a legacy fallback); show whichever is present so
    // the Word Wall actually delivers the bilingual support the EL tip promises.
    const termEs = t.termEs || t.spanish;
    if (termEs) {
      const es = document.createElement("p");
      es.className = "vocab-es";
      es.lang = "es";
      es.textContent = termEs;
      front.append(es);
    }

    const flipPrompt = document.createElement("span");
    flipPrompt.className = "flip-prompt";
    flipPrompt.textContent = "Tap to flip →";
    front.append(flipPrompt);

    const back = document.createElement("div");
    back.className = "vocab-card-back";

    const def = document.createElement("p");
    def.className = "vocab-def";
    def.textContent = t.definition;
    back.append(def);

    // Spanish definition under the English one (prefer `definitionEs`, fall back
    // to a Spanish term/definition if that's all the entry has).
    const defEs = t.definitionEs || (t.termEs ? null : t.spanish);
    if (defEs) {
      const defEsEl = document.createElement("p");
      defEsEl.className = "vocab-def-es";
      defEsEl.lang = "es";
      defEsEl.textContent = defEs;
      back.append(defEsEl);
    }

    // The worked example ("A box 3 × 2 × 4 holds 24 unit cubes…") belongs with
    // the definition on the back, not on the front where it pre-empts the flip.
    if (t.visual) {
      const backViz = document.createElement("p");
      backViz.className = "vocab-back-visual";
      backViz.textContent = t.visual;
      back.append(backViz);
    }

    inner.append(front, back);
    card.append(inner);

    // Transient parallax "pop" on each flip. Additive only: it toggles the
    // existing .flipped state exactly as before, then briefly adds .vi-flipping
    // so the inject-once CSS can run the depth animation. The class self-clears
    // on animationend (with a timeout fallback) and is suppressed entirely for
    // reduced-motion users via the @media gate, so behavior is unchanged.
    const clearParallax = () => card.classList.remove("vi-flipping");
    const flip = () => {
      card.classList.toggle("flipped");
      card.classList.remove("vi-flipping");
      // Force reflow so re-adding the class restarts the animation on rapid taps.
      void card.offsetWidth;
      card.classList.add("vi-flipping");
    };
    card.addEventListener("animationend", clearParallax);
    card.addEventListener("click", flip);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        flip();
      }
    });

    scroll.append(card);
  });

  wrapper.append(scroll);

  // Explore section below flip cards
  const exploreSection = document.createElement("div");
  exploreSection.className = "vocab-explore-section mt-6";
  exploreSection.innerHTML =
    '<h4 style="color:var(--teal); margin-bottom:var(--sp-3);">🔬 Explore a Word</h4>';

  const exploreGrid = document.createElement("div");
  exploreGrid.className = "vocab-explore-grid";

  terms.slice(0, 3).forEach((t) => {
    const exploreHost = document.createElement("div");
    const btn = exploreLabel(t);
    btn.addEventListener("click", () => {
      exploreHost.hidden = false;
      exploreHost.innerHTML = "";
      openExplorer(exploreHost, t, {
        siblings: terms.filter((o) => o !== t),
        onClose: () => {
          exploreHost.hidden = true;
        },
      });
    });
    const row = document.createElement("div");
    row.className = "vocab-explore-row";
    row.append(btn, exploreHost);
    exploreGrid.append(row);
  });

  exploreSection.append(exploreGrid);
  wrapper.append(exploreSection);

  const btn = document.createElement("button");
  btn.className = "btn btn-teal btn-lg vocab-continue-btn";
  btn.textContent = "I've studied these words — let's practice! →";
  btn.addEventListener("click", () => {
    if (onComplete) onComplete(terms.length, terms.length);
  });
  wrapper.append(btn);

  container.append(wrapper);
}
