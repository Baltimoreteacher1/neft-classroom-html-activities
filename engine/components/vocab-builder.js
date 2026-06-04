import { resolveVocabImage, vocabImageAlt } from "../core/vocab-images.js";

function vocabImageEl(term, definition) {
  const img = document.createElement("img");
  img.src = resolveVocabImage(term);
  img.alt = vocabImageAlt(term, definition);
  img.loading = "lazy";
  img.style.cssText = `
    display:block; width:100%; max-width:180px; aspect-ratio:4 / 3;
    margin:0 auto var(--sp-3); border-radius:var(--radius-md);
    background:var(--card); border:1px solid var(--line); object-fit:contain;
  `;
  return img;
}

export function renderVocabBuilder(container, { terms, onComplete }) {
  const wrapper = document.createElement("div");

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div class="section-icon section-icon-amber">📖</div>
    <div>
      <div class="section-title">Vocabulary Builder</div>
      <div class="section-desc">Match each term to its definition. Drag or tap to connect.</div>
    </div>
  `;
  wrapper.append(header);

  const progressText = document.createElement("div");
  progressText.style.cssText =
    "font-size:0.85rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-4);";
  wrapper.append(progressText);

  let currentIndex = 0;
  let correct = 0;
  const total = terms.length;

  const cardArea = document.createElement("div");
  cardArea.style.cssText = "min-height:200px;";
  wrapper.append(cardArea);

  function renderCard() {
    if (currentIndex >= total) {
      showSummary();
      return;
    }

    const term = terms[currentIndex];
    progressText.textContent = `${currentIndex + 1} of ${total}`;

    cardArea.innerHTML = "";

    const card = document.createElement("div");
    card.className = "card";
    card.style.cssText = "animation:phaseIn 0.3s var(--ease-out);";

    card.append(vocabImageEl(term.term, term.definition));

    const termDisplay = document.createElement("div");
    termDisplay.style.cssText = `
      text-align:center; padding:var(--sp-5); margin-bottom:var(--sp-4);
      background:var(--navy); color:white; border-radius:var(--radius-md);
      font-family:var(--font-display); font-size:1.4rem; font-weight:800;
    `;
    termDisplay.textContent = term.term;
    card.append(termDisplay);

    const prompt = document.createElement("p");
    prompt.style.cssText =
      "font-weight:700; text-align:center; margin:var(--sp-3) 0;";
    prompt.textContent = "Choose the correct definition:";
    card.append(prompt);

    const allDefs = terms.map((t) => t.definition);
    const wrongDefs = allDefs.filter((d) => d !== term.definition);
    const shuffledWrong = wrongDefs.sort(() => Math.random() - 0.5).slice(0, 2);
    const options = [term.definition, ...shuffledWrong].sort(
      () => Math.random() - 0.5,
    );

    const optionsWrap = document.createElement("div");
    optionsWrap.style.cssText =
      "display:flex; flex-direction:column; gap:var(--sp-2);";

    let answered = false;

    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.style.cssText = `
        text-align:left; padding:14px 18px; border:2px solid var(--line);
        border-radius:var(--radius-md); background:white; font-size:0.95rem;
        transition:all var(--duration-fast) ease; min-height:48px; width:100%;
        font-weight:600; cursor:pointer;
      `;

      btn.addEventListener("mouseenter", () => {
        if (!answered) btn.style.borderColor = "var(--teal)";
      });
      btn.addEventListener("mouseleave", () => {
        if (!answered) btn.style.borderColor = "var(--line)";
      });

      btn.textContent = opt;
      btn.addEventListener("click", () => {
        if (answered) return;
        answered = true;

        const isCorrect = opt === term.definition;
        if (isCorrect) correct++;

        optionsWrap.querySelectorAll("button").forEach((b) => {
          const bCorrect = b.textContent === term.definition;
          b.style.borderColor = bCorrect ? "var(--success)" : "var(--line)";
          b.style.background = bCorrect ? "var(--success-bg)" : "white";
          if (b === btn && !isCorrect) {
            b.style.borderColor = "var(--error)";
            b.style.background = "var(--error-bg)";
          }
          b.style.cursor = "default";
        });

        if (term.visual) {
          const visual = document.createElement("div");
          visual.style.cssText = `
            margin-top:var(--sp-4); padding:var(--sp-3); background:var(--teal-light);
            border-radius:var(--radius-md); text-align:center; font-style:italic;
            color:var(--teal);
          `;
          visual.textContent = `Visual: ${term.visual}`;
          card.append(visual);
        }

        setTimeout(() => {
          currentIndex++;
          renderCard();
        }, 1200);
      });

      optionsWrap.append(btn);
    });

    card.append(optionsWrap);
    cardArea.append(card);
  }

  function showSummary() {
    progressText.textContent = "Complete!";
    cardArea.innerHTML = "";

    const summary = document.createElement("div");
    summary.className = "card text-center";
    summary.innerHTML = `
      <div class="badge badge-success" style="margin-bottom:var(--sp-3)">Vocabulary Complete</div>
      <h3 style="margin-bottom:var(--sp-2)">${correct} of ${total} correct on first try</h3>
      <p style="color:var(--muted);">Review the terms below for reference.</p>
    `;

    const table = document.createElement("table");
    table.className = "vocab-table";
    table.style.marginTop = "var(--sp-4)";
    table.innerHTML = `
      <thead><tr><th>Term</th><th>Definition</th></tr></thead>
      <tbody>
        ${terms.map((t) => `<tr><td style="font-weight:700;">${escHtml(t.term)}</td><td>${escHtml(t.definition)}</td></tr>`).join("")}
      </tbody>
    `;
    summary.append(table);
    cardArea.append(summary);

    if (onComplete) onComplete(correct, total);
  }

  renderCard();
  container.append(wrapper);
}

function escHtml(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}
