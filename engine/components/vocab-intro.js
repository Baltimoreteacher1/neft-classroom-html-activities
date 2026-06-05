import { resolveVocabImage, vocabImageAlt } from "../core/vocab-images.js";
import { exploreLabel, openExplorer } from "./vocab-explore.js";

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

export function renderVocabIntro(container, { terms, onComplete }) {
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

    if (t.spanish) {
      const es = document.createElement("p");
      es.className = "vocab-es";
      es.textContent = t.spanish;
      front.append(thumbWrap, termH, es);
    } else {
      front.append(thumbWrap, termH);
    }

    if (t.visual) {
      const viz = document.createElement("div");
      viz.className = "vocab-visual-hint";
      viz.textContent = t.visual;
      front.append(viz);
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

    if (t.spanish) {
      const defEs = document.createElement("p");
      defEs.className = "vocab-def-es";
      defEs.textContent = t.spanish;
      back.append(defEs);
    }

    if (t.visual) {
      const backViz = document.createElement("p");
      backViz.className = "vocab-back-visual";
      backViz.textContent = t.visual;
      back.append(backViz);
    }

    inner.append(front, back);
    card.append(inner);

    const flip = () => card.classList.toggle("flipped");
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
