import { resolveVocabImage, vocabImageAlt } from "../core/vocab-images.js";
import { exploreLabel, openExplorer } from "./vocab-explore.js";

function vocabImageEl(term, definition) {
  const fig = document.createElement("img");
  fig.src = resolveVocabImage(term);
  fig.alt = vocabImageAlt(term, definition);
  fig.loading = "lazy";
  fig.style.cssText = `
    display:block; width:100%; max-width:200px; aspect-ratio:4 / 3;
    margin:0 auto; border-radius:var(--radius-md); background:var(--card);
    border:1px solid var(--line); object-fit:contain;
  `;
  return fig;
}

export function renderVocabIntro(container, { terms, onComplete }) {
  const wrapper = document.createElement("div");

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div class="section-icon section-icon-amber">📖</div>
    <div>
      <div class="section-title">Word Wall</div>
      <div class="section-desc">Study each word, its definition, and the example before practicing.</div>
    </div>
  `;
  wrapper.append(header);

  const grid = document.createElement("div");
  grid.style.cssText =
    "display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:var(--sp-4); margin-bottom:var(--sp-6);";

  terms.forEach((t, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = `
      animation: phaseIn 0.3s var(--ease-out) ${i * 0.08}s both;
      display:flex; flex-direction:column; gap:var(--sp-3);
    `;

    const termEl = document.createElement("div");
    termEl.style.cssText = `
      text-align:center; padding:var(--sp-4); background:var(--navy);
      color:white; border-radius:var(--radius-md);
      font-family:var(--font-display); font-size:1.25rem; font-weight:800;
    `;
    termEl.textContent = t.term;

    // The "study" view of the card: image + word + definition + visual + Explore.
    // When Explore is opened, this view is hidden and an inline explorer panel
    // takes its place; closing the explorer restores this view.
    const studyView = document.createElement("div");
    studyView.style.cssText =
      "display:flex; flex-direction:column; gap:var(--sp-3);";

    studyView.append(vocabImageEl(t.term, t.definition));
    studyView.append(termEl);

    const defEl = document.createElement("div");
    defEl.style.cssText =
      "font-size:0.95rem; line-height:1.6; color:var(--ink); padding:0 var(--sp-2);";
    defEl.textContent = t.definition;
    studyView.append(defEl);

    if (t.visual) {
      const vizEl = document.createElement("div");
      vizEl.style.cssText = `
        padding:var(--sp-3); background:var(--cream);
        border-radius:var(--radius-md); text-align:center;
        font-family:var(--font-mono, monospace); font-size:0.9rem;
        color:var(--teal); font-weight:600; border:1px dashed var(--teal-light, #b2dfdb);
      `;
      vizEl.textContent = t.visual;
      studyView.append(vizEl);
    }

    // Explore affordance — opens an inline interactive panel for this term.
    const exploreBtn = exploreLabel(t);
    const exploreHost = document.createElement("div");
    exploreHost.hidden = true;

    exploreBtn.addEventListener("click", () => {
      studyView.hidden = true;
      exploreHost.hidden = false;
      openExplorer(exploreHost, t, {
        // Sibling terms supply plausible distractors for the Predict step.
        siblings: terms.filter((other) => other !== t),
        onClose: () => {
          exploreHost.hidden = true;
          studyView.hidden = false;
          exploreBtn.focus({ preventScroll: true });
        },
      });
    });

    studyView.append(exploreBtn);
    card.append(studyView);
    card.append(exploreHost);

    grid.append(card);
  });

  wrapper.append(grid);

  const btn = document.createElement("button");
  btn.className = "btn btn-teal btn-lg";
  btn.style.cssText = "display:block; margin:0 auto;";
  btn.textContent = "I've studied these words — let's practice! →";
  btn.addEventListener("click", () => {
    if (onComplete) onComplete(terms.length, terms.length);
  });
  wrapper.append(btn);

  container.append(wrapper);
}
