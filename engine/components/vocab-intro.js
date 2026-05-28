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
    card.append(termEl);

    const defEl = document.createElement("div");
    defEl.style.cssText =
      "font-size:0.95rem; line-height:1.6; color:var(--ink); padding:0 var(--sp-2);";
    defEl.textContent = t.definition;
    card.append(defEl);

    if (t.visual) {
      const vizEl = document.createElement("div");
      vizEl.style.cssText = `
        padding:var(--sp-3); background:var(--cream);
        border-radius:var(--radius-md); text-align:center;
        font-family:var(--font-mono, monospace); font-size:0.9rem;
        color:var(--teal); font-weight:600; border:1px dashed var(--teal-light, #b2dfdb);
      `;
      vizEl.textContent = t.visual;
      card.append(vizEl);
    }

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
