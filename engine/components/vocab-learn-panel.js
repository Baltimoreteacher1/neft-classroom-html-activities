import { getPreferredLang } from "../core/i18n.js";
import { renderMathText } from "../core/math-typography.js";
import { renderVocabIntro } from "./vocab-intro.js";
import { resolveObjectiveVisuals } from "../core/objective-visuals.js";
import { interactiveVisualHost, mountInteractiveVisuals } from "../core/interactive-visual.js";
import { underlineVocabTerms } from "../core/lesson-renderer.js";

function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function speakText(text, lang = "en-US") {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  } catch (_) {}
}

function openVisualLightbox(imgSrc, captionText) {
  if (typeof document === "undefined") return;
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(11, 15, 25, 0.95); backdrop-filter: blur(12px);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 24px; cursor: zoom-out;
  `;
  modal.innerHTML = `
    <div style="max-width: 92vw; max-height: 90vh; text-align: center; color: white;" onclick="event.stopPropagation()">
      <div style="background: #0f172a; padding: 18px; border-radius: 20px; border: 2px solid #38bdf8; box-shadow: 0 25px 60px rgba(0,0,0,0.7);">
        <img src="${imgSrc}" style="max-width: 100%; max-height: 68vh; border-radius: 12px; background: white; padding: 14px; display: inline-block;" />
        <div style="margin-top: 18px; font-size: 1.15rem; font-weight: 800; line-height: 1.5; color: #f8fafc; max-width: 680px; margin-left: auto; margin-right: auto;">
          ${escHtml(captionText)}
        </div>
        <div style="margin-top: 20px;">
          <button type="button" class="vl-modal-close-btn" style="padding: 12px 36px; border-radius: 999px; border: none; background: #ffffff; color: #0f172a; font-weight: 900; font-size: 1.05rem; cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,0.3);">
            ✕ Close Visual
          </button>
        </div>
      </div>
    </div>
  `;
  modal.querySelector(".vl-modal-close-btn")?.addEventListener("click", () => modal.remove());
  modal.addEventListener("click", () => modal.remove());
  document.body.append(modal);
}

/**
 * Resolve or derive the appropriate interactive math tool configuration for any lesson.
 */
export function resolveInteractiveToolForLesson(config) {
  const cfg = config || {};

  const authored =
    cfg.conceptIntro?.interactiveVisual ||
    cfg.interactiveVisual ||
    cfg.visualModel ||
    cfg.explore?.visual ||
    null;

  if (authored && typeof authored === "object" && authored.kind) {
    return authored;
  }

  const text = `${cfg.title || ""} ${cfg.standard || ""} ${cfg.contentObjective || ""} ${cfg.objective || ""}`.toLowerCase();

  if (text.includes("factor tree") || text.includes("prime factor") || text.includes("prime factorization") || text.includes("factorization")) {
    return {
      kind: "factor-tree-lab",
      number: 36,
      label: "Interactive Factor Tree Explorer: Build prime factorizations step-by-step!",
    };
  }

  if (text.includes("least common multiple") || text.includes("lcm")) {
    return {
      kind: "lcm-lab",
      num1: 6,
      num2: 8,
      label: "Interactive LCM Explorer: Tap shared multiples to find the LCM!",
    };
  }

  if (text.includes("greatest common factor") || text.includes("gcf")) {
    return {
      kind: "factor-tree-lab",
      number: 48,
      label: "Interactive GCF & Factor Tree Explorer",
    };
  }

  if (text.includes("exponent") || text.includes("power") || text.includes("base")) {
    return {
      kind: "power-builder",
      base: 2,
      exponent: 4,
      label: "Interactive Powers & Exponents Builder",
    };
  }

  if (text.includes("divide fraction") || text.includes("fraction division") || text.includes("dividing fraction")) {
    return {
      kind: "fraction-divide",
      num1: "3/4",
      num2: "1/2",
      label: "Interactive Fraction Division: Keep, Change, Flip!",
    };
  }

  if (text.includes("tape diagram") || text.includes("ratio")) {
    return {
      kind: "tape-diagram",
      parts: [3, 5],
      labels: ["Quantity A", "Quantity B"],
      label: "Interactive Tape Diagram Explorer",
    };
  }

  if (text.includes("divide decimal") || text.includes("decimal division")) {
    return {
      kind: "decimal-quotient",
      label: "Interactive Decimal Division Tool",
    };
  }

  if (text.includes("multiply decimal") || text.includes("decimal multiplication")) {
    return {
      kind: "decimal-product",
      label: "Interactive Decimal Multiplication Tool",
    };
  }

  if (text.includes("add decimal") || text.includes("subtract decimal") || text.includes("decimal")) {
    return {
      kind: "decimal-columns",
      label: "Interactive Decimal Columns & Regrouping Tool",
    };
  }

  if (text.includes("area of") || text.includes("parallelogram") || text.includes("triangle area") || text.includes("trapezoid")) {
    return {
      kind: "area-morph",
      shape: text.includes("triangle") ? "triangle" : text.includes("trapezoid") ? "trapezoid" : "parallelogram",
      label: "Interactive Area Morph & Transformation Explorer",
    };
  }

  if (text.includes("net") || text.includes("surface area") || text.includes("3d") || text.includes("prism") || text.includes("pyramid")) {
    return {
      kind: "solid-3d",
      shape: text.includes("pyramid") ? "triangular-pyramid" : text.includes("triangular") ? "triangular-prism" : "cube",
      label: "Interactive 3D Solid & Net Explorer",
    };
  }

  if (text.includes("percent") || text.includes("percentage")) {
    return {
      kind: "percent-grid",
      percent: 45,
      label: "Interactive Percent Grid Tool",
    };
  }

  if (text.includes("distribut") || text.includes("expand")) {
    return {
      kind: "distributive-builder",
      a: 3,
      b: "x",
      c: 4,
      label: "Interactive Distributive Property Area Model",
    };
  }

  if (text.includes("combine like terms") || text.includes("like terms")) {
    return {
      kind: "combine-like-terms",
      label: "Interactive Combine Like Terms Lab",
    };
  }

  if (text.includes("coordinate") || text.includes("ordered pair") || text.includes("quadrant")) {
    return {
      kind: "coordinate-plane",
      points: [{ x: 3, y: 4, label: "A" }, { x: -2, y: 5, label: "B" }],
      label: "Interactive Coordinate Plane Explorer",
    };
  }

  if (text.includes("number line") || text.includes("inequality") || text.includes("inequalities")) {
    return {
      kind: "number-line",
      min: -5,
      max: 5,
      step: 1,
      points: [{ value: 3, label: "x = 3" }],
      label: "Interactive Number Line Explorer",
    };
  }

  return null;
}

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
      max-width: 920px;
      margin: 0 auto;
      padding: 20px 24px 44px;
      font-family: "Hanken Grotesk", system-ui, -apple-system, sans-serif;
      color: #0f172a;
    }
    .vl-hero {
      background: linear-gradient(135deg, #0f2b48 0%, #134074 100%);
      color: #ffffff;
      border-radius: 24px;
      padding: 30px 36px;
      margin-bottom: 32px;
      box-shadow: 0 14px 36px rgba(15, 43, 72, 0.24);
      border: 2px solid rgba(255,255,255,0.15);
    }
    .vl-hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 20px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.22);
      backdrop-filter: blur(10px);
      font-size: 0.88rem;
      font-weight: 900;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      margin-bottom: 16px;
      box-shadow: inset 0 1px 2px rgba(255,255,255,0.3);
    }
    .vl-hero-title {
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 2.05rem;
      font-weight: 900;
      margin: 0 0 12px;
      line-height: 1.25;
      letter-spacing: -0.015em;
    }
    .vl-hero-sub {
      font-size: 1.12rem;
      opacity: 0.96;
      margin: 0;
      line-height: 1.6;
    }
    .vl-section-card {
      background: #ffffff;
      border: 2.5px solid #cbd5e1;
      border-radius: 24px;
      padding: 30px;
      margin-bottom: 32px;
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
    }
    .vl-section-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 2.5px solid #e2e8f0;
    }
    .vl-section-tag {
      flex: 0 0 auto;
      padding: 6px 18px;
      border-radius: 999px;
      font-size: 0.86rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .vl-tag-amber { background: #fef3c7; color: #92400e; }
    .vl-tag-teal { background: #ccfbf1; color: #0f766e; }
    .vl-tag-coral { background: #ffedd5; color: #9a3412; }
    .vl-section-title {
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 1.55rem;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
    }
    .vl-key-idea-card {
      background: linear-gradient(135deg, #fffbe6 0%, #fef3c7 100%);
      border: 2.5px solid #f59e0b;
      border-radius: 20px;
      padding: 24px 26px;
      margin-bottom: 26px;
      box-shadow: 0 8px 20px rgba(245, 158, 11, 0.16);
    }
    .vl-key-idea-label {
      font-size: 0.88rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #92400e;
      margin-bottom: 10px;
      display: block;
    }
    .vl-key-idea-text {
      font-size: 1.2rem;
      font-weight: 800;
      color: #78350f;
      margin: 0;
      line-height: 1.65;
    }
    .vl-visual-card {
      margin-bottom: 26px;
      border-radius: 20px;
      overflow: hidden;
      border: 2.5px solid #cbd5e1;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.09);
      background: #0f172a;
    }
    .vl-visual-img-wrap {
      cursor: zoom-in;
      background: #0b0f19;
      text-align: center;
      padding: 18px;
    }
    .vl-visual-img-wrap img {
      max-width: 100%;
      height: auto;
      max-height: 360px;
      display: inline-block;
      border-radius: 12px;
    }
    .vl-visual-caption {
      padding: 18px 22px;
      background: #ffffff;
      border-top: 2px solid #e2e8f0;
      font-size: 1.05rem;
      color: #0f172a;
      font-weight: 800;
      line-height: 1.55;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .vl-zoom-badge {
      font-size: 0.85rem;
      font-weight: 900;
      color: #0284c7;
      background: rgba(2, 132, 199, 0.1);
      padding: 6px 14px;
      border-radius: 8px;
      border: 1.5px solid rgba(2, 132, 199, 0.25);
    }
    .vl-demo-box {
      background: #f8fbff;
      border: 2.5px solid #cbd5e1;
      border-radius: 20px;
      padding: 26px;
      margin-bottom: 26px;
    }
    .vl-demo-title {
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 1.25rem;
      font-weight: 900;
      color: #0f2b48;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .vl-demo-steps {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .vl-demo-step {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 16px 20px;
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      border-left: 6px solid #0d7a76;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    }
    .vl-step-num {
      flex: 0 0 auto;
      padding: 6px 14px;
      border-radius: 10px;
      background: #0d7a76;
      color: #ffffff;
      font-size: 0.86rem;
      font-weight: 900;
      letter-spacing: 0.03em;
    }
    .vl-step-text {
      font-size: 1.12rem;
      line-height: 1.55;
      color: #0f172a;
      font-weight: 750;
      flex: 1;
    }
    .vl-step-speak-btn {
      flex: 0 0 auto;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1.5px solid #0d7a76;
      background: #f0fdfa;
      color: #0f766e;
      font-weight: 800;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .vl-turntalk-card {
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
      border: 2.5px solid #ea580c;
      border-radius: 22px;
      padding: 26px;
      margin-top: 28px;
      box-shadow: 0 10px 28px rgba(234, 88, 12, 0.12);
    }
    .vl-turntalk-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .vl-turntalk-title {
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 1.3rem;
      font-weight: 900;
      color: #9a3412;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .vl-turntalk-controls {
      display: flex;
      gap: 10px;
    }
    .vl-tt-btn {
      padding: 7px 16px;
      border-radius: 12px;
      font-size: 0.88rem;
      font-weight: 900;
      border: 2px solid #fdba74;
      background: #ffffff;
      color: #c2410c;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .vl-tt-btn:hover {
      background: #ea580c;
      color: #ffffff;
      border-color: #ea580c;
    }
    .vl-turntalk-question {
      font-size: 1.18rem;
      font-weight: 800;
      color: #431407;
      line-height: 1.6;
      margin-bottom: 20px;
      background: rgba(255, 255, 255, 0.9);
      padding: 16px 20px;
      border-radius: 16px;
      border-left: 6px solid #ea580c;
    }
    .vl-starters-label {
      font-size: 0.9rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #9a3412;
      margin-bottom: 14px;
    }
    .vl-starters-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .vl-starter-chip {
      padding: 14px 18px;
      border-radius: 14px;
      background: #ffffff;
      border: 1.5px solid #fed7aa;
      font-size: 1.05rem;
      font-weight: 750;
      color: #292524;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .vl-starter-chip:hover {
      border-color: #ea580c;
      background: #fff7ed;
      transform: translateX(4px);
    }
    .vl-starter-chip.active {
      border-color: #ea580c;
      background: #ea580c;
      color: #ffffff;
    }
    .vl-actions {
      text-align: center;
      padding: 28px 0 44px;
    }
    .vl-continue-btn {
      padding: 20px 48px;
      font-size: 1.25rem;
      font-weight: 900;
      color: #ffffff;
      background: linear-gradient(135deg, #0d7a76 0%, #0f4c81 100%);
      border: none;
      border-radius: 20px;
      box-shadow: 0 12px 32px rgba(13, 122, 118, 0.38);
      cursor: pointer;
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .vl-continue-btn:hover {
      filter: brightness(1.08);
      transform: translateY(-3px);
      box-shadow: 0 16px 38px rgba(13, 122, 118, 0.48);
    }
    .vl-continue-btn:active {
      transform: translateY(-1px);
    }
    @media (max-width: 600px) {
      .vl-container { padding: 12px 14px 32px; }
      .vl-hero { padding: 22px; }
      .vl-hero-title { font-size: 1.55rem; }
      .vl-section-card { padding: 20px; }
      .vl-continue-btn { width: 100%; padding: 18px 24px; font-size: 1.15rem; }
    }
  `;
  document.head.appendChild(s);
}

// ─── 1. SEPARATE VOCABULARY PANEL ───────────────────────────────────────────
export function renderVocabPanel(container, config, options = {}) {
  const { onComplete = () => {}, state = null } = options;
  injectVocabLearnStyles();
  container.innerHTML = "";

  const isEs = getPreferredLang() === "es";

  const wrap = document.createElement("div");
  wrap.className = "vl-container";

  // Top Header Banner
  const hero = document.createElement("div");
  hero.className = "vl-hero";
  hero.style.background = "linear-gradient(135deg, #78350f 0%, #b45309 100%)";
  hero.innerHTML = `
    <div class="vl-hero-badge">${isEs ? "🔑 Vocabulario Clave" : "🔑 Key Vocabulary"}</div>
    <h2 class="vl-hero-title">${escHtml(config.title)}</h2>
    <p class="vl-hero-sub">
      ${
        isEs
          ? "Explora las tarjetas de vocabulario, sus modelos visuales y pronunciación antes de aprender el concepto."
          : "Explore key math terms, visual models, and pronunciation audio before learning the concept."
      }
    </p>
  `;
  wrap.append(hero);

  const cardSection = document.createElement("div");
  cardSection.className = "vl-section-card";
  cardSection.innerHTML = `<div class="vl-vocab-target"></div>`;
  wrap.append(cardSection);

  const vocabTarget = cardSection.querySelector(".vl-vocab-target");
  const vocabList = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  renderVocabIntro(vocabTarget, {
    terms: vocabList,
    onComplete: () => {
      try { if (state) state.set({ vocabVisited: true }); } catch (_) {}
      onComplete?.();
    },
  });

  // Highlight vocabulary terms throughout
  if (vocabList.length > 0) {
    try { underlineVocabTerms(cardSection, vocabList); } catch (_) {}
  }

  const actions = document.createElement("div");
  actions.className = "vl-actions";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-primary btn-lg vl-continue-btn";
  btn.style.background = "linear-gradient(135deg, #b45309 0%, #0d7a76 100%)";
  btn.innerHTML = `<span>${
    isEs ? "Siguiente: Aprender el Concepto 💡 →" : "Next: Learn It (How the Math Works) 💡 →"
  }</span>`;
  btn.addEventListener("click", () => {
    try { if (state) state.set({ vocabVisited: true }); } catch (_) {}
    onComplete?.();
  });
  actions.append(btn);
  wrap.append(actions);

  container.append(wrap);
}

// ─── 2. SEPARATE LEARN IT PANEL (EXPLANATION + INTERACTIVE VISUAL + TURN AND TALK + CONFIDENCE CHECK) ──
export function renderLearnItPanel(container, config, options = {}) {
  const { onComplete = () => {}, state = null } = options;
  injectVocabLearnStyles();
  container.innerHTML = "";

  const isEs = getPreferredLang() === "es";

  const wrap = document.createElement("div");
  wrap.className = "vl-container";

  // Top Header Banner
  const hero = document.createElement("div");
  hero.className = "vl-hero";
  hero.innerHTML = `
    <div class="vl-hero-badge">${isEs ? "💡 Cómo Funciona la Matemática" : "💡 How the Math Works (Learn It)"}</div>
    <h2 class="vl-hero-title">${escHtml(config.title)}</h2>
    <p class="vl-hero-sub">
      ${
        isEs
          ? "Lee la explicación sencilla, explora el modelo visual interactivo y repasa los pasos. Luego habla con tu compañero."
          : "Read the simple math explanation, explore the interactive visual model, and review the steps. Then turn & talk with your partner."
      }
    </p>
  `;
  wrap.append(hero);

  const concept = config.conceptIntro || config.launch?.conceptIntro || {};
  const heading = concept.heading || config.contentObjective || `Understanding ${config.title}`;
  const intro = concept.intro || config.contentObjective || "";
  const keyIdea = concept.keyIdea || config.contentObjective || "";
  const iDo = concept.iDo || {};

  const visuals = resolveObjectiveVisuals(config);
  const ivConfig = resolveInteractiveToolForLesson(config);

  const mainCard = document.createElement("div");
  mainCard.className = "vl-section-card";
  mainCard.innerHTML = `
    <div class="vl-section-header">
      <span class="vl-section-tag vl-tag-teal">${isEs ? "Concepto" : "Concept"}</span>
      <div>
        <h3 class="vl-section-title">${escHtml(heading)}</h3>
      </div>
    </div>

    <!-- SIMPLE EXPLANATION -->
    ${intro ? `<p style="font-size:1.15rem; line-height:1.65; color:#0f172a; font-weight:700; margin:0 0 22px;">${renderMathText(intro)}</p>` : ""}
    ${
      keyIdea
        ? `
      <div class="vl-key-idea-card">
        <span class="vl-key-idea-label">${isEs ? "💡 Explicación Sencilla" : "💡 Simple Explanation"}</span>
        <p class="vl-key-idea-text">${renderMathText(keyIdea)}</p>
      </div>`
        : ""
    }

    <!-- INTERACTIVE MATH VISUAL MODEL CARD -->
    <div class="vl-visual-card">
      <div class="vl-visual-img-wrap" id="vlVisualZoomTarget" title="Click to enlarge visual model">
        <img src="${visuals.content.src}" alt="${escHtml(visuals.content.alt)}" />
      </div>
      <div class="vl-visual-caption">
        <span>📊 <strong>${isEs ? "Modelo Visual:" : "Interactive Math Visual:"}</strong> ${escHtml(visuals.content.caption)}</span>
        <span class="vl-zoom-badge">🔍 ${isEs ? "Toca para ampliar" : "Click to enlarge"}</span>
      </div>
    </div>

    <!-- MOUNT HOST FOR LIVE INTERACTIVE MATH TOOL -->
    ${
      ivConfig && ivConfig.kind
        ? `
      <div style="margin:26px 0; padding:20px; background:#f8fbff; border:2.5px solid #38bdf8; border-radius:20px; box-shadow:0 8px 24px rgba(56,189,248,0.14);">
        <div style="font-family:'Outfit',sans-serif; font-size:1.15rem; font-weight:900; color:#0369a1; margin-bottom:14px; display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
          <span>🛠️ ${isEs ? "Herramienta Matemática Interactiva (¡Toca para explorar!):" : "Interactive Math Tool (Tap & Explore Live!):"}</span>
          <span style="font-size:0.82rem; font-weight:800; color:#0284c7; background:#e0f2fe; padding:4px 10px; border-radius:999px;">Live Tool</span>
        </div>
        ${interactiveVisualHost(ivConfig, ivConfig.label || visuals.content.caption)}
      </div>`
        : ""
    }

    <!-- STEP-BY-STEP WORKED EXAMPLE -->
    ${
      Array.isArray(iDo.lines) && iDo.lines.length > 0
        ? `
      <div class="vl-demo-box">
        <div class="vl-demo-title">
          <span>👀 ${isEs ? "Ejemplo Resuelto Paso a Paso:" : "Step-by-Step Worked Example:"}</span>
          <span style="font-weight:700; color:#475569;">(${escHtml(iDo.title || (isEs ? "Mira cómo se hace" : "Watch Me"))})</span>
        </div>
        <div class="vl-demo-steps">
          ${iDo.lines
            .map(
              (line, idx) => `
            <div class="vl-demo-step">
              <span class="vl-step-num">${isEs ? "Paso" : "Step"} ${idx + 1}</span>
              <span class="vl-step-text">${renderMathText(line)}</span>
              <button type="button" class="vl-step-speak-btn" data-step-text="${escHtml(line)}">🔊 Hear Step</button>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>`
        : ""
    }
  `;

  // Attach Step Audio Listeners
  mainCard.querySelectorAll(".vl-step-speak-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-step-text");
      if (text) speakText(text, isEs ? "es-US" : "en-US");
    });
  });

  // Attach Lightbox Zoom for Visual Model
  const zoomTarget = mainCard.querySelector("#vlVisualZoomTarget");
  if (zoomTarget) {
    zoomTarget.addEventListener("click", () => {
      openVisualLightbox(visuals.content.src, visuals.content.caption);
    });
  }

  // ─── BUILT-IN TURN AND TALK SECTION ─────────────────────────────────────────
  const turnAndTalkData = (Array.isArray(config.turnAndTalk) && config.turnAndTalk[0]) || {};
  let currentLangEs = isEs;

  const defaultQuestionEn = turnAndTalkData.question ||
    `Turn and talk with your partner: How does this math visual and example work? What step did you notice first?`;
  const defaultQuestionEs = turnAndTalkData.questionEs ||
    `Habla con tu compañero: ¿Cómo funciona este modelo visual y ejemplo? ¿Qué paso notaste primero?`;

  const defaultStartersEn = [
    `Looking at the visual, I notice that ______ in Step 1.`,
    `This math model shows ______ because ______.`,
    `My partner and I agree that the key step is ______.`,
  ];
  const defaultStartersEs = [
    `Mirando el modelo visual, noté que ______ en el Paso 1.`,
    `Este modelo matemático muestra ______ porque ______.`,
    `Mi compañero y yo estamos de acuerdo en que el paso clave es ______.`,
  ];

  const ttContainer = document.createElement("div");
  ttContainer.className = "vl-turntalk-card";

  function renderTurnAndTalk() {
    const qText = currentLangEs ? defaultQuestionEs : defaultQuestionEn;
    const starters = currentLangEs ? defaultStartersEs : defaultStartersEn;

    ttContainer.innerHTML = `
      <div class="vl-turntalk-head">
        <div class="vl-turntalk-title">
          <span>🗣️ ${currentLangEs ? "Habla con tu Compañero (Turn & Talk)" : "Turn and Talk with Your Partner"}</span>
        </div>
        <div class="vl-turntalk-controls">
          <button type="button" class="vl-tt-btn" id="ttListenBtn">🔊 ${currentLangEs ? "Escuchar" : "Listen"}</button>
          <button type="button" class="vl-tt-btn" id="ttLangBtn">${currentLangEs ? "🇺🇸 English" : "🇲🇽 Español"}</button>
        </div>
      </div>
      <div class="vl-turntalk-question">"${escHtml(qText)}"</div>
      <div class="vl-starters-label">${currentLangEs ? "💬 Frases de Inicio (Toca para seleccionar):" : "💬 Sentence Starters (Tap to speak & practice):"}</div>
      <div class="vl-starters-grid">
        ${starters
          .map(
            (st, idx) => `
          <div class="vl-starter-chip" data-idx="${idx}" tabindex="0" role="button">
            <span>💬</span>
            <span>"${escHtml(st)}"</span>
          </div>
        `,
          )
          .join("")}
      </div>
    `;

    ttContainer.querySelector("#ttLangBtn").addEventListener("click", () => {
      currentLangEs = !currentLangEs;
      renderTurnAndTalk();
    });

    ttContainer.querySelector("#ttListenBtn").addEventListener("click", () => {
      speakText(qText, currentLangEs ? "es-US" : "en-US");
    });

    ttContainer.querySelectorAll(".vl-starter-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        ttContainer.querySelectorAll(".vl-starter-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const idx = Number(chip.dataset.idx);
        const text = starters[idx];
        speakText(text, currentLangEs ? "es-US" : "en-US");
      });
    });
  }

  renderTurnAndTalk();
  mainCard.append(ttContainer);

  // ─── INTERACTIVE CONCEPT CONFIDENCE CHECKPOINT WIDGET ───────────────────────
  const confWidget = document.createElement("div");
  confWidget.className = "vl-confidence-widget";
  confWidget.style.cssText = `
    margin-top: 28px; padding: 22px 26px;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 2.5px solid #16a34a; border-radius: 22px;
    box-shadow: 0 8px 24px rgba(22,163,74,0.14);
  `;
  confWidget.innerHTML = `
    <div style="font-family:'Outfit',sans-serif; font-size:1.15rem; font-weight:900; color:#14532d; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
      <span>🎯 ${isEs ? "Verificación de Confianza" : "Self-Check Confidence Checkpoint"}</span>
      <span style="font-size:0.82rem; font-weight:800; color:#166534; background:rgba(255,255,255,0.85); padding:4px 12px; border-radius:999px; border:1px solid rgba(22,163,74,0.3);">${isEs ? "Toca una opción" : "Tap to select"}</span>
    </div>
    <div style="font-size:1.05rem; font-weight:750; color:#166534; margin-bottom:16px;">
      ${isEs ? "¿Qué tan bien entiendes cómo funciona la matemática en este momento?" : "How confident do you feel with this math concept right now?"}
    </div>
    <div class="vl-conf-options" style="display:flex; gap:12px; flex-wrap:wrap;">
      <button type="button" class="vl-conf-btn" data-level="3" style="flex:1; min-width:140px; padding:14px; border-radius:16px; border:2.5px solid #bbf7d0; background:#ffffff; color:#14532d; font-weight:800; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s ease;">
        <span>🤩</span> <span>${isEs ? "¡Lo Tengo!" : "Got It! Ready!"}</span>
      </button>
      <button type="button" class="vl-conf-btn" data-level="2" style="flex:1; min-width:140px; padding:14px; border-radius:16px; border:2.5px solid #fef08a; background:#ffffff; color:#713f12; font-weight:800; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s ease;">
        <span>🤔</span> <span>${isEs ? "Casi Listo" : "Almost There"}</span>
      </button>
      <button type="button" class="vl-conf-btn" data-level="1" style="flex:1; min-width:140px; padding:14px; border-radius:16px; border:2.5px solid #fed7aa; background:#ffffff; color:#7c2d12; font-weight:800; font-size:1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s ease;">
        <span>🙋‍♂️</span> <span>${isEs ? "Necesito Práctica" : "Need Practice"}</span>
      </button>
    </div>
    <div class="vl-conf-feedback" style="margin-top:16px; font-weight:800; font-size:1.02rem; padding:12px 16px; border-radius:12px; display:none;"></div>
  `;

  const confButtons = confWidget.querySelectorAll(".vl-conf-btn");
  const confFb = confWidget.querySelector(".vl-conf-feedback");

  confButtons.forEach((b) => {
    b.addEventListener("click", () => {
      confButtons.forEach((x) => {
        x.style.background = "#ffffff";
        x.style.borderColor = "#cbd5e1";
      });
      b.style.background = "#14532d";
      b.style.color = "#ffffff";
      b.style.borderColor = "#14532d";

      const lvl = b.dataset.level;
      let msg = "";
      if (lvl === "3") {
        msg = isEs
          ? "🌟 ¡Excelente! Estás listo para resolver los problemas de práctica."
          : "🌟 Awesome! You are ready to tackle the practice problems.";
        confFb.style.background = "#dcfce7";
        confFb.style.color = "#14532d";
      } else if (lvl === "2") {
        msg = isEs
          ? "💡 ¡Buen esfuerzo! Explora la herramienta interactiva arriba para reforzar tu comprensión."
          : "💡 Great effort! Use the interactive math tool above to reinforce your steps.";
        confFb.style.background = "#fef9c3";
        confFb.style.color = "#713f12";
      } else {
        msg = isEs
          ? "🤝 ¡Está bien! Repasa los pasos del ejemplo y practica con un compañero."
          : "🤝 That's okay! Review the worked example steps above and talk with your partner.";
        confFb.style.background = "#ffedd5";
        confFb.style.color = "#7c2d12";
      }
      confFb.textContent = msg;
      confFb.style.display = "block";
      speakText(msg, isEs ? "es-US" : "en-US");
    });
  });

  mainCard.append(confWidget);
  wrap.append(mainCard);

  // Underline vocabulary terms throughout Learn It for definition & image popups
  const vocabList = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  if (vocabList.length > 0) {
    try { underlineVocabTerms(mainCard, vocabList); } catch (_) {}
  }

  // Bottom Continue Action Button
  const actions = document.createElement("div");
  actions.className = "vl-actions";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-primary btn-lg vl-continue-btn";
  btn.innerHTML = `<span>${
    isEs
      ? "¡He aprendido el concepto — a explorar! 🚀 →"
      : "I've learned the concept — let's explore! 🚀 →"
  }</span>`;
  btn.addEventListener("click", () => {
    try { if (state) state.set({ notesVisited: true }); } catch (_) {}
    onComplete?.();
  });
  actions.append(btn);
  wrap.append(actions);

  container.append(wrap);

  // Hydrate any mounted interactive manipulative hosts live!
  mountInteractiveVisuals(mainCard, { state });
}

// ─── 3. COMBINED PANEL FOR BACKWARD COMPATIBILITY ───────────────────────────
export function renderVocabAndLearnIt(container, config, options = {}) {
  const { onComplete = () => {}, state = null } = options;
  injectVocabLearnStyles();
  container.innerHTML = "";

  renderVocabPanel(container, config, {
    state,
    onComplete: () => {
      renderLearnItPanel(container, config, {
        state,
        onComplete,
      });
      container.scrollIntoView({ block: "start" });
    },
  });
}
