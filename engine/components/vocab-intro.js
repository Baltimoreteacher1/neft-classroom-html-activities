import { resolveVocabImage, vocabImageAlt } from "../core/vocab-images.js";
import { openExplorer } from "./vocab-explore.js";
import { speakText } from "../core/speech-voice.js";

function _esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// ─────────────────────────────────────────────────────────────────────────
// Full-Screen Interactive Pop-Out Modal for any Vocabulary Term
// ─────────────────────────────────────────────────────────────────────────
export function openVocabPopOut(t) {
  if (typeof document === "undefined" || !t) return;

  const term = String(t.term || "").trim();
  const termEs = String(t.termEs || t.spanish || "").trim();
  const defEn = String(t.definition || "").trim();
  const defEs = String(t.definitionEs || "").trim();
  const example = String(t.visual || t.example || "").trim();
  const imgSrc = resolveVocabImage(term, t.image);
  const imgAlt = vocabImageAlt(term, defEn);

  const modal = document.createElement("div");
  modal.className = "vocab-popout-modal";
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(11, 15, 25, 0.94); backdrop-filter: blur(12px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 20px; cursor: zoom-out; overflow-y: auto;
  `;

  modal.innerHTML = `
    <div class="vocab-popout-content" style="max-width: 680px; width: 100%; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.6); cursor: default; border: 2.5px solid #cbd5e1;" onclick="event.stopPropagation()">
      <div style="background: linear-gradient(135deg, #0f2b48 0%, #134074 100%); padding: 22px 26px; color: #ffffff; display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div>
          <div style="font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; color: #38bdf8; margin-bottom: 4px;">📖 Math Vocabulary Pop-Out</div>
          <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.75rem; font-weight: 900; margin: 0; line-height: 1.2;">
            ${_esc(term)}
            ${termEs ? `<span style="font-size: 1.1rem; font-weight: 700; color: #93c5fd; margin-left: 8px;">(${_esc(termEs)})</span>` : ""}
          </h2>
        </div>
        <button type="button" class="vocab-popout-speech-btn" style="padding: 8px 18px; border-radius: 999px; border: 1.5px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.18); color: #ffffff; font-weight: 800; font-size: 0.92rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
          🔊 Listen
        </button>
      </div>

      <div style="padding: 24px;">
        <!-- LARGE POP-OUT IMAGE -->
        <div style="background: #0f172a; border-radius: 16px; padding: 16px; text-align: center; margin-bottom: 20px; border: 1.5px solid #cbd5e1;">
          <img src="${imgSrc}" alt="${_esc(imgAlt)}" style="max-width: 100%; max-height: 360px; height: auto; border-radius: 10px; display: inline-block;" />
        </div>

        <!-- ENGLISH DEFINITION -->
        <div style="background: #f8fbff; border: 1.5px solid #cbd5e1; border-left: 5px solid #0369a1; border-radius: 14px; padding: 16px 18px; margin-bottom: 14px;">
          <div style="font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; color: #0369a1; margin-bottom: 4px;">🇺🇸 English Definition</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #0f172a; line-height: 1.55;">${_esc(defEn)}</div>
        </div>

        <!-- SPANISH DEFINITION -->
        ${
          defEs
            ? `
        <div style="background: #fffdf5; border: 1.5px solid #fed7aa; border-left: 5px solid #ea580c; border-radius: 14px; padding: 16px 18px; margin-bottom: 14px;">
          <div style="font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; color: #c2410c; margin-bottom: 4px;">🇲🇽 Definición en Español</div>
          <div style="font-size: 1.1rem; font-weight: 700; color: #431407; line-height: 1.55;">${_esc(defEs)}</div>
        </div>`
            : ""
        }

        <!-- EXAMPLE SENTENCE / NOTE -->
        ${
          example
            ? `
        <div style="background: #f0fdf4; border: 1.5px solid #bbf7d0; border-left: 5px solid #16a34a; border-radius: 14px; padding: 14px 18px; margin-bottom: 18px;">
          <div style="font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.06em; color: #15803d; margin-bottom: 4px;">💡 Example & Visual Note</div>
          <div style="font-size: 1.02rem; font-weight: 600; color: #14532d; line-height: 1.5;">${_esc(example)}</div>
        </div>`
            : ""
        }

        <div style="text-align: center; margin-top: 20px;">
          <button type="button" class="vocab-popout-close-btn" style="padding: 12px 36px; border-radius: 999px; border: none; background: #0f172a; color: #ffffff; font-weight: 800; font-size: 1.05rem; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  `;

  const speak = () => {
    speakText(`${term}. ${defEn}`, "en-US");
  };

  modal.querySelector(".vocab-popout-speech-btn").addEventListener("click", speak);
  modal.querySelector(".vocab-popout-close-btn").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", () => modal.remove());

  document.body.append(modal);
}

// ─────────────────────────────────────────────────────────────────────────
// Inject-once scoped polish styles.
// ─────────────────────────────────────────────────────────────────────────
const VI_STYLE_ID = "vi-polish-styles";
function injectVocabIntroStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(VI_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = VI_STYLE_ID;
  style.textContent = `
    .vocab-card:focus-visible {
      outline: 3px solid var(--teal, #1fa6a2);
      outline-offset: 3px;
      border-radius: var(--radius-md, 12px);
    }

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

    @media not all and (prefers-reduced-motion: reduce) {
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
      <div class="section-desc">Tap each card to flip and study. Tap the image to pop out the high-res diagram & full definitions!</div>
    </div>
  `;
  wrapper.append(header);

  const hint = document.createElement("p");
  hint.className = "vocab-flip-hint";
  hint.innerHTML =
    '<span aria-hidden="true">👆</span> <strong>Tap card to flip</strong> — or <strong>tap image to pop out</strong> the definition & visual!';
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
    thumbWrap.style.position = "relative";
    thumbWrap.style.cursor = "zoom-in";
    thumbWrap.title = "Click to pop out full image & definitions";

    const thumb = document.createElement("img");
    thumb.className = "vocab-thumb";
    thumb.src = resolveVocabImage(t.term, t.image);
    thumb.alt = vocabImageAlt(t.term, t.definition);
    thumb.loading = "lazy";
    thumbWrap.append(thumb);

    // No "Pop Out" chip over the picture. The badge sat on the bottom-right
    // corner of a 72px thumbnail and covered the part of the diagram it was
    // advertising. The image itself is the affordance (cursor:zoom-in, a title
    // tooltip, and the hint line above the deck), so the pop-out still works —
    // there is just no chrome on top of the visual any more.
    thumbWrap.addEventListener("click", (e) => {
      e.stopPropagation();
      openVocabPopOut(t);
    });

    const termH = document.createElement("h3");
    termH.textContent = t.term;
    front.append(thumbWrap, termH);

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

    const defEs = t.definitionEs || (t.termEs ? null : t.spanish);
    if (defEs) {
      const defEsEl = document.createElement("p");
      defEsEl.className = "vocab-def-es";
      defEsEl.lang = "es";
      defEsEl.textContent = defEs;
      back.append(defEsEl);
    }

    const exampleText = t.visual || t.example;
    if (exampleText) {
      const ex = document.createElement("p");
      ex.className = "vocab-example";
      ex.textContent = exampleText;
      back.append(ex);
    }

    // The back of the card used to end in a "🔍 Pop Out Image & Defs" button.
    // It is gone for the same reason as the front badge: the pop-out is reached
    // by tapping the picture, and a button that duplicates that only competes
    // with the definition for the small amount of room on the back face.
    inner.append(front, back);
    card.append(inner);

    const flipCard = (evt) => {
      if (evt && (evt.target.closest(".vocab-thumb-wrap") || evt.target.closest(".btn"))) {
        return;
      }
      card.classList.add("vi-flipping");
      card.classList.toggle("flipped");
      setTimeout(() => card.classList.remove("vi-flipping"), 600);
    };

    card.addEventListener("click", flipCard);
    card.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault();
        flipCard(evt);
      }
    });

    scroll.append(card);
  });

  wrapper.append(scroll);

  if (Array.isArray(terms) && terms.length >= 2) {
    const footer = document.createElement("div");
    footer.className = "vocab-footer-actions";
    const expBtn = document.createElement("button");
    expBtn.className = "btn primary lg vocab-explore-btn";
    expBtn.type = "button";
    expBtn.textContent = `🧠 Explore all ${terms.length} words`;
    expBtn.addEventListener("click", () => {
      openExplorer({ terms, onComplete });
    });
    footer.append(expBtn);
    wrapper.append(footer);
  }

  container.append(wrapper);
}
