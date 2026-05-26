export function renderVocabSort(container, { terms, onComplete }) {
  const wrapper = document.createElement("div");

  const header = document.createElement("div");
  header.className = "section-header";
  header.innerHTML = `
    <div class="section-icon section-icon-coral">🗂️</div>
    <div>
      <div class="section-title">Example Sort</div>
      <div class="section-desc">Sort each example under the correct vocabulary term.</div>
    </div>
  `;
  wrapper.append(header);

  const examples = [];
  terms.forEach((t) => {
    const exList = buildExamples(t);
    exList.forEach((ex) => examples.push({ text: ex, termName: t.term }));
  });

  const shuffledExamples = [...examples].sort(() => Math.random() - 0.5);
  let sorted = 0;
  const total = shuffledExamples.length;

  const progress = document.createElement("div");
  progress.style.cssText =
    "font-size:0.85rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-4);";
  progress.textContent = `0 / ${total} sorted`;
  wrapper.append(progress);

  const bankLabel = document.createElement("div");
  bankLabel.style.cssText =
    "font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--muted); margin-bottom:var(--sp-2);";
  bankLabel.textContent = "Examples to Sort";
  wrapper.append(bankLabel);

  const bank = document.createElement("div");
  bank.className = "drag-zone";
  bank.style.cssText +=
    "margin-bottom:var(--sp-5); min-height:60px; flex-wrap:wrap;";

  let selectedItem = null;

  shuffledExamples.forEach((ex, i) => {
    const chip = document.createElement("span");
    chip.className = "drag-item vocab-sort-item";
    chip.dataset.correctTerm = ex.termName;
    chip.dataset.idx = String(i);
    chip.textContent = ex.text;
    chip.setAttribute("draggable", "true");

    chip.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("application/json", JSON.stringify(ex));
      e.dataTransfer.setData("text/plain", ex.termName);
      chip.style.opacity = "0.4";
    });
    chip.addEventListener("dragend", () => {
      chip.style.opacity = "";
    });

    chip.addEventListener("click", () => {
      if (chip.classList.contains("sorted")) return;
      if (selectedItem) selectedItem.style.boxShadow = "";
      selectedItem = chip;
      chip.style.boxShadow = "var(--shadow-glow)";
    });

    bank.append(chip);
  });
  wrapper.append(bank);

  const buckets = document.createElement("div");
  const cols = terms.length <= 3 ? terms.length : 2;
  buckets.style.cssText = `
    display:grid; grid-template-columns:repeat(${cols}, 1fr);
    gap:var(--sp-4); margin-top:var(--sp-3);
  `;

  terms.forEach((t) => {
    const bucket = document.createElement("div");
    bucket.className = "card card-compact";
    bucket.dataset.termName = t.term;
    bucket.style.cssText +=
      "min-height:120px; transition:all var(--duration-fast) ease;";

    const bucketLabel = document.createElement("div");
    bucketLabel.style.cssText = `
      font-weight:800; font-size:0.95rem; color:var(--navy); margin-bottom:var(--sp-2);
      padding-bottom:var(--sp-2); border-bottom:2px solid var(--line);
    `;
    bucketLabel.textContent = t.term;
    bucket.append(bucketLabel);

    const bucketHint = document.createElement("div");
    bucketHint.style.cssText =
      "font-size:0.8rem; color:var(--muted); font-style:italic; margin-bottom:var(--sp-2);";
    bucketHint.textContent = t.definition;
    bucket.append(bucketHint);

    const dropZone = document.createElement("div");
    dropZone.className = "drag-zone vocab-sort-zone";
    dropZone.dataset.termName = t.term;
    dropZone.style.cssText +=
      "min-height:50px; border-style:dashed; flex-wrap:wrap;";

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("over");
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("over");
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("over");
      let data;
      try {
        data = JSON.parse(e.dataTransfer.getData("application/json"));
      } catch {
        return;
      }
      handleDrop(data, t.term, dropZone);
    });

    dropZone.addEventListener("click", () => {
      if (!selectedItem) return;
      const data = {
        text: selectedItem.textContent,
        termName: selectedItem.dataset.correctTerm,
      };
      handleDrop(data, t.term, dropZone);
      if (selectedItem) selectedItem.style.boxShadow = "";
      selectedItem = null;
    });

    bucket.append(dropZone);
    buckets.append(bucket);
  });

  wrapper.append(buckets);

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  wrapper.append(feedbackSlot);

  function handleDrop(data, bucketTerm, dropZone) {
    const correct = data.termName === bucketTerm;
    const chipEl = bank.querySelector(
      `.vocab-sort-item[data-correct-term="${CSS.escape(data.termName)}"][data-idx]:not(.sorted)`,
    );

    if (!chipEl) return;

    if (correct) {
      const placed = document.createElement("span");
      placed.className = "drag-item correct";
      placed.textContent = data.text;
      placed.style.cursor = "default";
      dropZone.append(placed);

      chipEl.classList.add("sorted");
      chipEl.style.opacity = "0.2";
      chipEl.style.cursor = "default";
      chipEl.setAttribute("draggable", "false");

      sorted++;
      progress.textContent = `${sorted} / ${total} sorted`;

      if (sorted === total) {
        showFb(feedbackSlot, "success", "All examples sorted correctly!");
        setTimeout(() => {
          if (onComplete) onComplete(total, total);
        }, 600);
      }
    } else {
      chipEl.classList.add("incorrect");
      dropZone.style.borderColor = "var(--error)";
      setTimeout(() => {
        chipEl.classList.remove("incorrect");
        dropZone.style.borderColor = "";
      }, 600);
    }
  }

  container.append(wrapper);
}

function buildExamples(term) {
  if (term.examples && term.examples.length) return term.examples;
  const pieces = [];
  if (term.visual) pieces.push(term.visual);
  pieces.push(`"${term.term}" — ${term.definition}`);
  return pieces;
}

function showFb(slot, type, msg) {
  const fb = document.createElement("div");
  fb.className = `feedback feedback-${type} visible`;
  fb.setAttribute("role", "alert");
  fb.innerHTML = `<span class="feedback-icon">${type === "success" ? "✓" : "💡"}</span><span>${msg}</span>`;
  slot.innerHTML = "";
  slot.append(fb);
}
