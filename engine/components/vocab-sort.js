import { resolveVocabImage, vocabImageAlt } from "../core/vocab-images.js";

// ─────────────────────────────────────────────────────────────────────────
// Inject-once scoped polish styles. This component renders into 1000s of
// activities, so the <style> block is added exactly once per document and is
// purely ADDITIVE — it augments the existing .vocab-sort-item / .vocab-sort-zone
// classes and the new vs-* hooks WITHOUT changing any layout, interaction,
// checking, callback, or return value the JS depends on. EVERY animation /
// transition lives behind `@media (prefers-reduced-motion: reduce)` negation —
// i.e. it is suppressed for reduced-motion users so they get the original calm
// experience. The responsive bucket reflow, mobile chip wrap, and keyboard
// focus ring are layout / accessibility aids (not motion) and apply to everyone.
const VS_STYLE_ID = "vs-polish-styles";
function injectVocabSortStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(VS_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = VS_STYLE_ID;
  style.textContent = `
    /* Accessibility aid (not motion): visible focus ring for keyboard users so
       tabbing through example chips and drop buckets is always legible. */
    .vocab-sort-item:focus-visible,
    .vocab-sort-zone:focus-visible {
      outline: 3px solid var(--teal, #1fa6a2);
      outline-offset: 2px;
    }

    /* Layout aid (not motion): keep example chips comfortably tappable and let
       long example text wrap instead of overflowing the bank on small screens. */
    .vs-bank {
      gap: var(--sp-2, 8px);
    }
    .vs-bank .vocab-sort-item {
      max-width: 100%;
      white-space: normal;
      overflow-wrap: anywhere;
      line-height: 1.3;
    }

    /* Responsive bucket grid (not motion): the JS sets an explicit
       grid-template-columns for desktop; on narrow screens collapse to a single
       full-width column so each bucket and its drop target stay big and
       tappable. !important is scoped to .vs-buckets only. */
    @media (max-width: 640px) {
      .vs-buckets {
        grid-template-columns: 1fr !important;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      /* Reduced-motion users: no celebration pop, no shake — only the instant
         color/state changes the original component already applied. */
      .vs-placed.vs-celebrate,
      .vocab-sort-item.incorrect {
        animation: none !important;
      }
    }

    /* Success celebration micro-animation: a gentle confidence pop when an
       example lands in the correct bucket. Guarded — suppressed above for
       reduced-motion users. */
    .vs-placed.vs-celebrate {
      animation: vsPop 0.42s var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
    }
    @keyframes vsPop {
      0%   { transform: scale(0.85); }
      55%  { transform: scale(1.06); }
      100% { transform: scale(1); }
    }

    /* Error feedback: a short, restrained horizontal shake on a wrong drop.
       Guarded — suppressed above for reduced-motion users. The original
       component already toggles the .incorrect class for the same window. */
    .vocab-sort-item.incorrect {
      animation: vsShake 0.4s ease-in-out;
    }
    @keyframes vsShake {
      0%, 100% { transform: translateX(0); }
      20%      { transform: translateX(-5px); }
      40%      { transform: translateX(5px); }
      60%      { transform: translateX(-3px); }
      80%      { transform: translateX(3px); }
    }
  `;
  (document.head || document.documentElement).append(style);
}

function vocabImageEl(term, definition, max = 96) {
  const img = document.createElement("img");
  img.src = resolveVocabImage(term);
  img.alt = vocabImageAlt(term, definition);
  img.loading = "lazy";
  img.style.cssText = `
    display:block; width:${max}px; aspect-ratio:4 / 3; flex:0 0 auto;
    border-radius:var(--radius-sm); background:var(--card);
    border:1px solid var(--line); object-fit:contain;
  `;
  return img;
}

export function renderVocabSort(container, { terms, onComplete }) {
  injectVocabSortStyles();

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
  bank.className = "drag-zone vs-bank";
  bank.style.cssText +=
    "margin-bottom:var(--sp-5); min-height:60px; flex-wrap:wrap;";

  let selectedItem = null;

  shuffledExamples.forEach((ex, i) => {
    const chip = document.createElement("span");
    chip.className = "drag-item vocab-sort-item";
    // Only an opaque index is exposed; the correct bucket (ex.termName) stays in
    // the `shuffledExamples` closure so it can't be read off the DOM. Keying by
    // idx (not term name) also fixes consuming the wrong chip when two examples
    // share a term.
    chip.dataset.idx = String(i);
    chip.textContent = ex.text;
    chip.setAttribute("draggable", "true");

    chip.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("application/json", JSON.stringify({ idx: i }));
      e.dataTransfer.setData("text/plain", ex.text);
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
  buckets.className = "vs-buckets";
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

    const labelRow = document.createElement("div");
    labelRow.style.cssText = `
      display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-2);
      padding-bottom:var(--sp-2); border-bottom:2px solid var(--line);
    `;
    labelRow.append(vocabImageEl(t.term, t.definition));

    const bucketLabel = document.createElement("div");
    bucketLabel.style.cssText =
      "font-weight:800; font-size:0.95rem; color:var(--navy);";
    bucketLabel.textContent = t.term;
    if (t.termEs) {
      const es = document.createElement("span");
      es.lang = "es";
      es.style.cssText =
        "display:block; font-size:0.78rem; font-weight:600; font-style:italic; color:var(--muted);";
      es.textContent = t.termEs;
      bucketLabel.append(es);
    }
    labelRow.append(bucketLabel);
    bucket.append(labelRow);

    const bucketHint = document.createElement("div");
    bucketHint.style.cssText =
      "font-size:0.8rem; color:var(--muted); font-style:italic; margin-bottom:var(--sp-2);";
    bucketHint.textContent = t.definition;
    if (t.definitionEs) {
      const es = document.createElement("span");
      es.lang = "es";
      es.style.cssText = "display:block; margin-top:2px; opacity:0.9;";
      es.textContent = t.definitionEs;
      bucketHint.append(es);
    }
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
      const data = { idx: Number(selectedItem.dataset.idx) };
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
    const ex = shuffledExamples[data.idx];
    if (!ex) return;
    const correct = ex.termName === bucketTerm;
    const chipEl = bank.querySelector(
      `.vocab-sort-item[data-idx="${data.idx}"]:not(.sorted)`,
    );

    if (!chipEl) return;

    if (correct) {
      const placed = document.createElement("span");
      placed.className = "drag-item correct vs-placed vs-celebrate";
      placed.textContent = ex.text;
      placed.style.cursor = "default";
      dropZone.append(placed);
      // Clean up the one-shot celebration hook after it plays (or immediately
      // for reduced-motion users, where the keyframe is suppressed) so the
      // class never lingers on re-render. Purely cosmetic; no state depends on it.
      placed.addEventListener("animationend", () => {
        placed.classList.remove("vs-celebrate");
      });

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
