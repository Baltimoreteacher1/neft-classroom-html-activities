import { resolveVocabImage, vocabImageAlt } from "../core/vocab-images.js";

const VOCAB_STYLE_ID = "vocab-builder-polish";

// Inject scoped polish styles once per document. Purely additive: every
// animation/transition is disabled under prefers-reduced-motion: reduce.
function ensureVocabStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(VOCAB_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = VOCAB_STYLE_ID;
  style.textContent = `
    .vb-progress-track {
      height:8px; width:100%; background:var(--line);
      border-radius:999px; overflow:hidden; margin-bottom:var(--sp-4);
    }
    .vb-progress-fill {
      height:100%; width:0%; border-radius:999px;
      background:linear-gradient(90deg, var(--teal), var(--navy));
      transition:width 0.45s var(--ease-out);
    }
    .vb-img-skeleton { position:relative; }
    .vb-img-skeleton::after {
      content:""; position:absolute; inset:0; border-radius:var(--radius-md);
      background:linear-gradient(90deg, var(--card) 25%, var(--line) 37%, var(--card) 63%);
      background-size:400% 100%; animation:vbShimmer 1.4s ease-in-out infinite;
    }
    .vb-img-loaded::after { content:none; }
    .vb-option { position:relative; overflow:hidden; }
    .vb-option::before {
      content:""; position:absolute; top:0; left:-130%; width:60%; height:100%;
      background:linear-gradient(100deg, transparent, rgba(255,255,255,0.55), transparent);
      transform:skewX(-18deg); pointer-events:none; transition:left 0.5s var(--ease-out);
    }
    .vb-option:hover:not(.vb-answered)::before { left:140%; }
    .vb-card-in { animation:vbCardIn 0.4s var(--ease-out) both; }
    .vb-option-in { animation:vbOptionIn 0.35s var(--ease-out) both; }
    .vb-burst {
      position:absolute; width:8px; height:8px; border-radius:999px;
      background:var(--success); pointer-events:none; will-change:transform, opacity;
      animation:vbBurst 0.7s var(--ease-out) forwards;
    }
    .vb-pop { animation:vbPop 0.45s var(--ease-out); }
    @keyframes vbShimmer { 0% { background-position:100% 0; } 100% { background-position:0 0; } }
    @keyframes vbCardIn {
      from { opacity:0; transform:translateY(12px) scale(0.985); }
      to { opacity:1; transform:none; }
    }
    @keyframes vbOptionIn {
      from { opacity:0; transform:translateY(8px); }
      to { opacity:1; transform:none; }
    }
    @keyframes vbBurst {
      from { opacity:1; transform:translate(0,0) scale(1); }
      to { opacity:0; transform:translate(var(--vb-dx,0), var(--vb-dy,0)) scale(0.4); }
    }
    @keyframes vbPop {
      0% { transform:scale(1); } 45% { transform:scale(1.04); } 100% { transform:scale(1); }
    }
    @media (prefers-reduced-motion: reduce) {
      .vb-progress-fill { transition:none; }
      .vb-img-skeleton::after { animation:none; }
      .vb-option::before { display:none; }
      .vb-card-in, .vb-option-in, .vb-pop { animation:none; }
      .vb-burst { display:none; }
    }
  `;
  (document.head || document.documentElement).append(style);
}

// Spawn a short-lived particle burst centered on an element. No-op visually
// under reduced motion (the .vb-burst keyframe is disabled), and self-cleaning.
function spawnBurst(anchor) {
  if (!anchor || typeof document === "undefined") return;
  const layer = document.createElement("div");
  layer.style.cssText =
    "position:absolute; inset:0; overflow:visible; pointer-events:none;";
  const prev = getComputedStyle(anchor).position;
  if (prev === "static") anchor.style.position = "relative";
  anchor.append(layer);
  const colors = ["var(--success)", "var(--teal)", "var(--navy)"];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("span");
    p.className = "vb-burst";
    const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
    const dist = 36 + Math.random() * 26;
    p.style.left = "50%";
    p.style.top = "50%";
    p.style.background = colors[i % colors.length];
    p.style.setProperty("--vb-dx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--vb-dy", `${Math.sin(angle) * dist}px`);
    layer.append(p);
  }
  setTimeout(() => layer.remove(), 800);
}

function vocabImageEl(term, definition) {
  const img = document.createElement("img");
  img.alt = vocabImageAlt(term, definition);
  img.loading = "lazy";
  img.className = "vb-img-skeleton";
  img.style.cssText = `
    display:block; width:100%; max-width:180px; aspect-ratio:4 / 3;
    margin:0 auto var(--sp-3); border-radius:var(--radius-md);
    background:var(--card); border:1px solid var(--line); object-fit:contain;
  `;
  const clearSkeleton = () => {
    img.classList.remove("vb-img-skeleton");
    img.classList.add("vb-img-loaded");
  };
  img.addEventListener("load", clearSkeleton);
  img.addEventListener("error", clearSkeleton);
  img.src = resolveVocabImage(term);
  if (img.complete) clearSkeleton();
  return img;
}

export function renderVocabBuilder(container, { terms, onComplete }) {
  ensureVocabStyles();
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
    "font-size:0.85rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-2);";
  wrapper.append(progressText);

  const progressTrack = document.createElement("div");
  progressTrack.className = "vb-progress-track";
  progressTrack.setAttribute("role", "progressbar");
  progressTrack.setAttribute("aria-label", "Vocabulary progress");
  const progressFill = document.createElement("div");
  progressFill.className = "vb-progress-fill";
  progressTrack.append(progressFill);
  wrapper.append(progressTrack);

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
    const remaining = total - currentIndex;
    progressText.textContent = `${currentIndex + 1} of ${total} · ${remaining} card${remaining === 1 ? "" : "s"} remaining`;
    progressFill.style.width = `${(currentIndex / total) * 100}%`;
    progressTrack.setAttribute("aria-valuenow", String(currentIndex));
    progressTrack.setAttribute("aria-valuemin", "0");
    progressTrack.setAttribute("aria-valuemax", String(total));

    cardArea.innerHTML = "";

    const card = document.createElement("div");
    card.className = "card vb-card-in";

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

    options.forEach((opt, optIndex) => {
      const btn = document.createElement("button");
      btn.className = "vb-option vb-option-in";
      btn.style.animationDelay = `${0.08 + optIndex * 0.07}s`;
      btn.style.cssText += `
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
          b.classList.add("vb-answered");
          b.style.borderColor = bCorrect ? "var(--success)" : "var(--line)";
          b.style.background = bCorrect ? "var(--success-bg)" : "white";
          if (b === btn && !isCorrect) {
            b.style.borderColor = "var(--error)";
            b.style.background = "var(--error-bg)";
          }
          if (bCorrect) {
            b.classList.add("vb-pop");
            spawnBurst(b);
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
    progressFill.style.width = "100%";
    progressTrack.setAttribute("aria-valuenow", String(total));
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
