import { resolveVocabImage, vocabImageAlt } from "../core/vocab-images.js";

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
  board.style.cssText =
    "display:grid; grid-template-columns:1fr 40px 1fr; gap:var(--sp-3); align-items:start;";

  const termsCol = document.createElement("div");
  termsCol.style.cssText =
    "display:flex; flex-direction:column; gap:var(--sp-2);";

  const arrowCol = document.createElement("div");
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
    arrow.style.cssText =
      "color:var(--muted); font-size:1.2rem; height:48px; display:grid; place-items:center;";
    arrow.textContent = "→";
    arrowCol.append(arrow);
  });

  shuffledDefs.forEach((term) => {
    const el = document.createElement("button");
    el.className = "vocab-dm-def";
    el.dataset.defFor = term.term;
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
      }
      defEl.style.background = "var(--success-bg)";
      defEl.style.borderColor = "var(--success)";
      defEl.style.borderStyle = "solid";
      defEl.style.color = "var(--success)";
      defEl.style.cursor = "default";

      if (matchedCount === terms.length) {
        setTimeout(() => {
          if (onComplete) onComplete(terms.length, attempts);
        }, 600);
      }
    } else {
      if (termEl) {
        termEl.style.borderColor = "var(--error)";
        termEl.classList.add("incorrect");
        setTimeout(() => {
          termEl.style.borderColor = "var(--teal)";
          termEl.classList.remove("incorrect");
        }, 600);
      }
      defEl.style.borderColor = "var(--error)";
      defEl.style.background = "var(--error-bg)";
      setTimeout(() => {
        defEl.style.borderColor = "var(--line)";
        defEl.style.background = "white";
      }, 600);
    }
  }

  board.append(termsCol, arrowCol, defsCol);
  wrapper.append(board);
  container.append(wrapper);
}
