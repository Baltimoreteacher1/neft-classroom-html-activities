import { escHtml } from "../core/i18n.js";
import { renderMathText } from "../core/math-typography.js";
import { renderVocabIntro } from "./vocab-intro.js";

let injectedStyles = false;

function injectVocabLearnStyles() {
  if (injectedStyles || (typeof document !== "undefined" && document.getElementById("vl-panel-styles"))) {
    injectedStyles = true;
    return;
  }
  injectedStyles = true;
  const s = document.createElement("style");
  s.id = "vl-panel-styles";
  s.textContent = `
    .vl-container {
      max-width: 860px;
      margin: 0 auto;
      padding: 12px 16px 32px;
      font-family: "Hanken Grotesk", system-ui, sans-serif;
      color: #0f172a;
    }
    .vl-hero {
      background: linear-gradient(135deg, #0f2b48 0%, #134074 100%);
      color: #ffffff;
      border-radius: 16px;
      padding: 24px 28px;
      margin-bottom: 24px;
      box-shadow: 0 8px 24px rgba(15, 43, 72, 0.18);
    }
    .vl-hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 14px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(4px);
      font-size: 0.82rem;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .vl-hero-title {
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 1.6rem;
      font-weight: 900;
      margin: 0 0 6px;
      line-height: 1.25;
    }
    .vl-hero-sub {
      font-size: 1rem;
      opacity: 0.92;
      margin: 0;
      line-height: 1.5;
    }
    .vl-section-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }
    .vl-section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
      padding-bottom: 14px;
      border-bottom: 2px solid #f1f5f9;
    }
    .vl-section-tag {
      flex: 0 0 auto;
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .vl-tag-amber { background: #fef3c7; color: #b45309; }
    .vl-tag-teal { background: #ccfbf1; color: #0f766e; }
    .vl-section-title {
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 1.3rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    .vl-section-desc {
      font-size: 0.92rem;
      color: #64748b;
      margin: 2px 0 0;
    }
    .vl-key-idea-card {
      background: linear-gradient(135deg, #fffbe6 0%, #fef3c7 100%);
      border: 2px solid #f59e0b;
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12);
    }
    .vl-key-idea-label {
      font-size: 0.8rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #b45309;
      margin-bottom: 6px;
      display: block;
    }
    .vl-key-idea-text {
      font-size: 1.08rem;
      font-weight: 700;
      color: #78350f;
      margin: 0;
      line-height: 1.5;
    }
    .vl-demo-box {
      background: #f8fbff;
      border: 1.5px solid #cbd5e1;
      border-radius: 14px;
      padding: 20px;
    }
    .vl-demo-title {
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 1.1rem;
      font-weight: 800;
      color: #0f2b48;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .vl-demo-steps {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .vl-demo-step {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 12px 14px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      border-left: 4px solid #0d7a76;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
    }
    .vl-step-num {
      flex: 0 0 auto;
      padding: 4px 10px;
      border-radius: 6px;
      background: #0d7a76;
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 900;
    }
    .vl-step-text {
      font-size: 0.98rem;
      line-height: 1.5;
      color: #0f172a;
      font-weight: 600;
    }
    .vl-actions {
      text-align: center;
      padding: 20px 0 32px;
    }
    .vl-continue-btn {
      padding: 16px 36px;
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
      background: linear-gradient(135deg, #0d7a76 0%, #0f4c81 100%);
      border: none;
      border-radius: 14px;
      box-shadow: 0 6px 20px rgba(13, 122, 118, 0.3);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .vl-continue-btn:hover {
      filter: brightness(1.08);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(13, 122, 118, 0.4);
    }
    @media (max-width: 600px) {
      .vl-container { padding: 8px 10px 24px; }
      .vl-hero { padding: 18px 20px; }
      .vl-hero-title { font-size: 1.35rem; }
      .vl-section-card { padding: 16px; }
      .vl-continue-btn { width: 100%; padding: 16px 20px; font-size: 1.05rem; }
    }
  `;
  document.head.appendChild(s);
}

export function renderVocabAndLearnIt(container, config, { onComplete, state } = {}) {
  injectVocabLearnStyles();
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "vl-container";

  // Top Header Banner
  const hero = document.createElement("div");
  hero.className = "vl-hero";
  hero.innerHTML = `
    <div class="vl-hero-badge">🔑📖 Vocab & Learn It</div>
    <h2 class="vl-hero-title">${escHtml(config.title)}</h2>
    <p class="vl-hero-sub">Study the key vocabulary words, read the big math idea, and review the worked demonstration.</p>
  `;
  wrap.append(hero);

  // PART 1: Key Vocabulary
  if (Array.isArray(config.vocabulary) && config.vocabulary.length > 0) {
    const part1 = document.createElement("div");
    part1.className = "vl-section-card";
    part1.innerHTML = `
      <div class="vl-section-header">
        <span class="vl-section-tag vl-tag-amber">Part 1</span>
        <div>
          <h3 class="vl-section-title">🔑 Key Vocabulary</h3>
          <p class="vl-section-desc">Tap each card to flip and study its definition, visual model, and audio.</p>
        </div>
      </div>
      <div class="vl-vocab-target"></div>
    `;
    wrap.append(part1);
    const vocabTarget = part1.querySelector(".vl-vocab-target");
    renderVocabIntro(vocabTarget, { terms: config.vocabulary });
  }

  // PART 2: Learn It (Concept Notes & Worked Demonstration)
  const concept = config.conceptIntro || config.launch?.conceptIntro || {};
  const heading = concept.heading || config.contentObjective || `Understanding ${config.title}`;
  const intro = concept.intro || config.contentObjective || "";
  const keyIdea = concept.keyIdea || "";
  const iDo = concept.iDo || {};

  const part2 = document.createElement("div");
  part2.className = "vl-section-card";
  part2.innerHTML = `
    <div class="vl-section-header">
      <span class="vl-section-tag vl-tag-teal">Part 2</span>
      <div>
        <h3 class="vl-section-title">💡 How the Math Works (Learn It)</h3>
        <p class="vl-section-desc">${escHtml(heading)}</p>
      </div>
    </div>
    ${intro ? `<p style="font-size:1.02rem; line-height:1.55; color:#1e293b; font-weight:600; margin:0 0 16px;">${renderMathText(intro)}</p>` : ""}
    ${keyIdea ? `
      <div class="vl-key-idea-card">
        <span class="vl-key-idea-label">💡 Key Math Idea</span>
        <p class="vl-key-idea-text">${renderMathText(keyIdea)}</p>
      </div>` : ""}
    ${Array.isArray(iDo.lines) && iDo.lines.length > 0 ? `
      <div class="vl-demo-box">
        <div class="vl-demo-title">
          <span>👀 Worked Demonstration:</span>
          <span>${escHtml(iDo.title || "Watch Me")}</span>
        </div>
        <div class="vl-demo-steps">
          ${iDo.lines.map((line, idx) => `
            <div class="vl-demo-step">
              <span class="vl-step-num">Step ${idx + 1}</span>
              <span class="vl-step-text">${renderMathText(line)}</span>
            </div>
          `).join("")}
        </div>
      </div>` : ""}
  `;
  wrap.append(part2);

  // Bottom Continue Action Button
  const actions = document.createElement("div");
  actions.className = "vl-actions";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-primary btn-lg vl-continue-btn";
  btn.innerHTML = `<span>I've studied the words & concept — let's explore!</span> <span aria-hidden="true">🚀 →</span>`;
  btn.addEventListener("click", () => {
    try {
      if (state) state.set({ notesVisited: true, vocabVisited: true });
    } catch (_) {}
    onComplete?.();
  });
  actions.append(btn);
  wrap.append(actions);

  container.append(wrap);
}
