export function renderVocabCloze(container, { terms, onComplete }) {
  const wrapper = document.createElement("div");

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div class="section-icon section-icon-navy">✍️</div>
    <div>
      <div class="section-title">Fill the Blanks</div>
      <div class="section-desc">Drag each vocabulary word into the correct sentence.</div>
    </div>
  `;
  wrapper.append(header);

  const sentences = terms.map((t) => ({
    term: t.term,
    sentence: buildSentence(t),
  }));

  const shuffled = [...sentences].sort(() => Math.random() - 0.5);
  const bankTerms = [...terms].sort(() => Math.random() - 0.5);

  let filled = 0;
  const total = terms.length;

  const progress = document.createElement("div");
  progress.style.cssText =
    "font-size:0.85rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-4);";
  progress.textContent = `0 / ${total} filled`;
  wrapper.append(progress);

  const bank = document.createElement("div");
  bank.className = "card card-compact";
  bank.style.cssText = "margin-bottom:var(--sp-5); padding:var(--sp-4);";

  const bankLabel = document.createElement("div");
  bankLabel.style.cssText =
    "font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:var(--sp-2);";
  bankLabel.textContent = "Word Bank";
  bank.append(bankLabel);

  const bankItems = document.createElement("div");
  bankItems.style.cssText = "display:flex; flex-wrap:wrap; gap:var(--sp-2);";

  bankTerms.forEach((t) => {
    const chip = document.createElement("span");
    chip.className = "drag-item vocab-cloze-chip";
    chip.dataset.term = t.term;
    chip.setAttribute("draggable", "true");
    chip.textContent = t.term;
    chip.style.cssText += "cursor:grab; user-select:none;";

    chip.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", t.term);
      chip.style.opacity = "0.4";
      activeDragChip = chip;
    });
    chip.addEventListener("dragend", () => {
      chip.style.opacity = "";
      activeDragChip = null;
    });

    chip.addEventListener("click", () => {
      if (chip.classList.contains("used")) return;
      if (selectedChip) selectedChip.style.boxShadow = "";
      selectedChip = chip;
      chip.style.boxShadow = "var(--shadow-glow)";
    });

    bankItems.append(chip);
  });
  bank.append(bankItems);
  wrapper.append(bank);

  let selectedChip = null;
  let activeDragChip = null;

  const sentenceList = document.createElement("div");
  sentenceList.style.cssText =
    "display:flex; flex-direction:column; gap:var(--sp-3);";

  shuffled.forEach((s, idx) => {
    const row = document.createElement("div");
    row.className = "card card-compact";
    row.style.cssText =
      "padding:var(--sp-4); line-height:1.8; font-size:0.95rem;";

    const parts = s.sentence.split("___");
    const span1 = document.createTextNode(parts[0] || "");
    row.append(span1);

    const blank = document.createElement("span");
    blank.className = "vocab-cloze-blank";
    blank.dataset.answer = s.term;
    blank.dataset.idx = String(idx);
    blank.style.cssText = `
      display:inline-block; min-width:120px; padding:4px 12px; margin:0 4px;
      border:2px dashed var(--teal); border-radius:var(--radius-sm);
      background:var(--teal-light); text-align:center; font-weight:700;
      color:var(--teal); vertical-align:middle; transition:all var(--duration-fast) ease;
      cursor:pointer; min-height:32px;
    `;
    blank.textContent = " ";

    blank.addEventListener("dragover", (e) => {
      e.preventDefault();
      blank.style.borderColor = "var(--amber)";
      blank.style.background = "var(--amber-light)";
    });
    blank.addEventListener("dragleave", () => {
      if (!blank.classList.contains("filled")) {
        blank.style.borderColor = "var(--teal)";
        blank.style.background = "var(--teal-light)";
      }
    });
    blank.addEventListener("drop", (e) => {
      e.preventDefault();
      const term = e.dataTransfer.getData("text/plain");
      attemptFill(blank, term, activeDragChip);
    });

    blank.addEventListener("click", () => {
      if (blank.classList.contains("filled")) return;
      if (!selectedChip || selectedChip.classList.contains("used")) return;
      attemptFill(blank, selectedChip.dataset.term, selectedChip);
      selectedChip.style.boxShadow = "";
      selectedChip = null;
    });

    row.append(blank);
    if (parts[1]) row.append(document.createTextNode(parts[1]));

    sentenceList.append(row);
  });

  wrapper.append(sentenceList);

  function attemptFill(blank, term, chipEl) {
    if (blank.classList.contains("filled")) return;

    const correct =
      term.toLowerCase().trim() === blank.dataset.answer.toLowerCase().trim();

    if (correct) {
      blank.textContent = term;
      blank.classList.add("filled");
      blank.style.borderColor = "var(--success)";
      blank.style.borderStyle = "solid";
      blank.style.background = "var(--success-bg)";
      blank.style.color = "var(--success)";

      if (chipEl) {
        chipEl.classList.add("used");
        chipEl.style.opacity = "0.3";
        chipEl.style.cursor = "default";
        chipEl.setAttribute("draggable", "false");
      }

      filled++;
      progress.textContent = `${filled} / ${total} filled`;

      if (filled === total) {
        setTimeout(() => {
          if (onComplete) onComplete(total, total);
        }, 600);
      }
    } else {
      blank.style.borderColor = "var(--error)";
      blank.style.background = "var(--error-bg)";
      setTimeout(() => {
        blank.style.borderColor = "var(--teal)";
        blank.style.background = "var(--teal-light)";
      }, 600);
    }
  }

  container.append(wrapper);
}

function buildSentence(term) {
  if (term.cloze) return term.cloze;
  const def = term.definition;
  const first = def.charAt(0).toUpperCase() + def.slice(1);
  return `___ means: ${first}.`;
}
