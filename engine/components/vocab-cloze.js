export function renderVocabCloze(container, { terms, onComplete }) {
  injectClozeStyles();

  const wrapper = document.createElement("div");
  wrapper.className = "vocab-cloze-root";

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
    "font-size:0.85rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-2);";
  progress.textContent = `0 / ${total} filled`;
  wrapper.append(progress);

  const progressTrack = document.createElement("div");
  progressTrack.className = "vocab-cloze-progress-track";
  progressTrack.style.cssText =
    "height:8px; border-radius:999px; background:var(--line); overflow:hidden; margin-bottom:var(--sp-4);";
  const progressFill = document.createElement("div");
  progressFill.className = "vocab-cloze-progress-fill";
  progressFill.style.cssText =
    "height:100%; width:0%; border-radius:999px; background:linear-gradient(90deg, var(--teal), var(--success));";
  progressTrack.append(progressFill);
  wrapper.append(progressTrack);

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
    if (t.termEs) {
      const es = document.createElement("span");
      es.lang = "es";
      es.style.cssText =
        "display:block; font-size:0.72rem; font-weight:600; font-style:italic; opacity:0.8;";
      es.textContent = t.termEs;
      chip.append(es);
    }
    chip.style.cssText += "cursor:grab; user-select:none; text-align:center;";

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
      if (selectedChip) {
        selectedChip.style.boxShadow = "";
        selectedChip.classList.remove("vocab-cloze-chip-selected");
      }
      selectedChip = chip;
      chip.style.boxShadow = "var(--shadow-glow)";
      chip.classList.add("vocab-cloze-chip-selected");
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

  // Which term fills each blank, kept in a closure (never in the DOM) so the
  // answers can't be read off data-* attributes.
  const blankAnswers = [];

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
    blank.dataset.idx = String(idx);
    blankAnswers[idx] = s.term;
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
      selectedChip.classList.remove("vocab-cloze-chip-selected");
      selectedChip = null;
    });

    row.append(blank);
    if (parts[1]) row.append(document.createTextNode(parts[1]));

    sentenceList.append(row);
  });

  wrapper.append(sentenceList);

  function attemptFill(blank, term, chipEl) {
    if (blank.classList.contains("filled")) return;

    const expected = blankAnswers[Number(blank.dataset.idx)] || "";
    const correct = term.toLowerCase().trim() === expected.toLowerCase().trim();

    if (correct) {
      blank.textContent = term;
      blank.classList.add("filled");
      blank.style.borderColor = "var(--success)";
      blank.style.borderStyle = "solid";
      blank.style.background = "var(--success-bg)";
      blank.style.color = "var(--success)";

      blank.classList.add("vocab-cloze-pop");
      blank.addEventListener(
        "animationend",
        () => blank.classList.remove("vocab-cloze-pop"),
        { once: true },
      );
      burstParticles(blank);

      if (chipEl) {
        chipEl.classList.add("used");
        chipEl.classList.remove("vocab-cloze-chip-selected");
        chipEl.style.opacity = "0.3";
        chipEl.style.cursor = "default";
        chipEl.setAttribute("draggable", "false");
      }

      filled++;
      progress.textContent = `${filled} / ${total} filled`;
      progressFill.style.width = `${Math.round((filled / total) * 100)}%`;

      if (filled === total) {
        cascadeComplete(sentenceList);
        setTimeout(() => {
          if (onComplete) onComplete(total, total);
        }, 600);
      }
    } else {
      blank.style.borderColor = "var(--error)";
      blank.style.background = "var(--error-bg)";
      blank.classList.add("vocab-cloze-shake");
      blank.addEventListener(
        "animationend",
        () => blank.classList.remove("vocab-cloze-shake"),
        { once: true },
      );
      setTimeout(() => {
        if (blank.classList.contains("filled")) return;
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

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function burstParticles(blank) {
  if (prefersReducedMotion()) return;
  const burst = document.createElement("span");
  burst.className = "vocab-cloze-burst";
  burst.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 8; i++) {
    const p = document.createElement("span");
    p.className = "vocab-cloze-particle";
    const angle = (Math.PI * 2 * i) / 8;
    p.style.setProperty("--dx", `${Math.cos(angle) * 26}px`);
    p.style.setProperty("--dy", `${Math.sin(angle) * 26}px`);
    burst.append(p);
  }
  // Ensure positioning context without disturbing layout flow.
  if (getComputedStyle(blank).position === "static") {
    blank.style.position = "relative";
  }
  blank.append(burst);
  burst.addEventListener("animationend", () => burst.remove(), { once: true });
  setTimeout(() => burst.remove(), 900);
}

function cascadeComplete(sentenceList) {
  if (prefersReducedMotion()) return;
  const rows = sentenceList.children;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    row.style.setProperty("--cascade-delay", `${i * 70}ms`);
    row.classList.add("vocab-cloze-cascade");
    row.addEventListener(
      "animationend",
      () => row.classList.remove("vocab-cloze-cascade"),
      { once: true },
    );
  }
}

function injectClozeStyles() {
  if (
    typeof document === "undefined" ||
    document.getElementById("vocab-cloze-styles")
  ) {
    return;
  }
  const style = document.createElement("style");
  style.id = "vocab-cloze-styles";
  style.textContent = `
    .vocab-cloze-progress-fill {
      transition: width var(--duration-fast, 0.2s) ease;
    }
    @keyframes vocabClozeChipPulse {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-1px) scale(1.04); }
    }
    .vocab-cloze-chip-selected {
      animation: vocabClozeChipPulse 1.1s ease-in-out infinite;
    }
    @keyframes vocabClozePop {
      0% { transform: scale(0.82); }
      55% { transform: scale(1.14); }
      100% { transform: scale(1); }
    }
    .vocab-cloze-pop {
      animation: vocabClozePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes vocabClozeShake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-5px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(3px); }
    }
    .vocab-cloze-shake {
      animation: vocabClozeShake 0.45s ease-in-out;
    }
    .vocab-cloze-burst {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      pointer-events: none;
    }
    .vocab-cloze-particle {
      position: absolute;
      top: 0;
      left: 0;
      width: 6px;
      height: 6px;
      margin: -3px 0 0 -3px;
      border-radius: 50%;
      background: var(--success);
      opacity: 0;
      animation: vocabClozeParticle 0.7s ease-out forwards;
    }
    @keyframes vocabClozeParticle {
      0% { transform: translate(0, 0) scale(1); opacity: 1; }
      100% { transform: translate(var(--dx), var(--dy)) scale(0.2); opacity: 0; }
    }
    @keyframes vocabClozeCascade {
      0% { transform: translateY(8px); opacity: 0.45; }
      100% { transform: translateY(0); opacity: 1; }
    }
    .vocab-cloze-cascade {
      animation: vocabClozeCascade 0.42s ease-out both;
      animation-delay: var(--cascade-delay, 0ms);
    }
    @media (prefers-reduced-motion: reduce) {
      .vocab-cloze-progress-fill { transition: none; }
      .vocab-cloze-chip-selected,
      .vocab-cloze-pop,
      .vocab-cloze-shake,
      .vocab-cloze-particle,
      .vocab-cloze-cascade {
        animation: none !important;
      }
      .vocab-cloze-burst { display: none; }
    }
  `;
  document.head.append(style);
}
