import { workedFigure, workedStepFigures } from "../../scripts/lib/learn-figures.mjs";
import { carriedDivisionFigures, DIVISION_FIGURE_CSS } from "../core/division-walk-figure.js";
import { getPreferredLang } from "../core/i18n.js";
import { interactiveVisualHost, mountInteractiveVisuals } from "../core/interactive-visual.js";
import {
  extractEquation,
  extractStepMove,
  parseKeyIdea,
  parseStepCycle,
  splitGuidedSteps,
} from "../core/learn-step-model.js";
import { underlineVocabTerms } from "../core/lesson-renderer.js";
import {
  resolveInteractiveToolForLesson,
  resolveLessonMisconception,
} from "../core/lesson-tool-resolver.js";
import { renderMathText } from "../core/math-typography.js";
import { resolveObjectiveVisuals } from "../core/objective-visuals.js";
import { renderVocabIntro } from "./vocab-intro.js";

function escHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

import { speakText } from "../core/speech-voice.js";

function openVisualLightbox(imgSrc, captionText) {
  if (typeof document === "undefined") return;
  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(11, 15, 25, 0.95); backdrop-filter: blur(12px);
    display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
    padding: 24px; cursor: zoom-out; overflow-y: auto; overscroll-behavior: contain;
  `;
  modal.innerHTML = `
    <div style="max-width: 92vw; margin: auto; flex: 0 0 auto; text-align: center; color: white;" onclick="event.stopPropagation()">
      <div style="background: #0f172a; padding: 20px; border-radius: 24px; border: 2.5px solid #38bdf8; box-shadow: 0 25px 60px rgba(0,0,0,0.75);">
        <img src="${imgSrc}" style="max-width: 100%; max-height: 68vh; border-radius: 14px; background: white; padding: 14px; display: inline-block;" />
        <div style="margin-top: 18px; font-size: 1.15rem; font-weight: 700; line-height: 1.5; color: #f8fafc; max-width: 680px; margin-left: auto; margin-right: auto;">
          ${escHtml(captionText)}
        </div>
        <div style="margin-top: 20px;">
          <button type="button" class="vl-modal-close-btn" style="padding: 12px 36px; border-radius: 999px; border: none; background: #ffffff; color: #0f172a; font-weight: 800; font-size: 1.05rem; cursor: pointer; box-shadow: 0 4px 18px rgba(0,0,0,0.3);">
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
 * Build a Try It challenge from the lesson's OWN practice items — the only way
 * the checkpoint is guaranteed to be about THIS lesson's concept. Picks the
 * first multiple-choice item with a stem and a valid answer, keeps the correct
 * choice plus the first two distractors (preferring authored choiceFeedback so
 * the wrong-answer coaching names the actual error), and preserves the
 * original choice order. Returns null when the lesson has no usable item.
 */
function tryItFromPractice(cfg) {
  const seen = new Set();
  const findItem = (node, depth) => {
    if (!node || typeof node !== "object" || depth > 4 || seen.has(node)) return null;
    seen.add(node);
    if (
      typeof node.stem === "string" &&
      node.stem.trim() &&
      Array.isArray(node.choices) &&
      node.choices.length >= 3 &&
      Number.isInteger(node.correctIndex) &&
      node.choices[node.correctIndex] != null
    ) {
      return node;
    }
    for (const value of Object.values(node)) {
      const hit = findItem(value, depth + 1);
      if (hit) return hit;
    }
    return null;
  };
  const item = findItem(cfg.practice, 0) || findItem(cfg.explore, 0);
  if (!item) return null;

  const feedback = Array.isArray(item.choiceFeedback) ? item.choiceFeedback : [];
  const correctExplain =
    (typeof item.explanation === "string" && item.explanation.trim()) ||
    "Correct! That matches the worked example above.";
  const options = [];
  item.choices.forEach((choice, idx) => {
    if (choice == null || String(choice).trim() === "") return;
    if (idx === item.correctIndex) {
      options.push({ text: String(choice), correct: true, explain: correctExplain, idx });
    } else {
      options.push({
        text: String(choice),
        correct: false,
        explain:
          (typeof feedback[idx] === "string" && feedback[idx].trim()) ||
          "Not quite — walk back through the worked example above and try again.",
        idx,
      });
    }
  });
  const correct = options.find((o) => o.correct);
  if (!correct) return null;
  // Cap at 3 (A/B/C), always including the correct choice, original order.
  const wrong = options.filter((o) => !o.correct).slice(0, 2);
  const capped = [correct, ...wrong].sort((a, b) => a.idx - b.idx);
  return {
    question: item.stem,
    questionEs: typeof item.stemEs === "string" && item.stemEs.trim() ? item.stemEs : item.stem,
    options: capped.map(({ text, correct: ok, explain }) => ({ text, correct: ok, explain })),
  };
}

function resolveTryItChallenge(config) {
  const cfg = config || {};
  // Lesson-specific first: a question from this lesson's own practice set
  // beats any keyword-matched bank.
  const fromPractice = tryItFromPractice(cfg);
  if (fromPractice) return fromPractice;
  const text = `${cfg.title || ""} ${cfg.standard || ""}`.toLowerCase();

  if (text.includes("ratio") || text.includes("2-1")) {
    return {
      question:
        "In a ratio table comparing flour to sugar as 3 : 2, if you use 9 cups of flour, how much sugar do you need?",
      questionEs:
        "En una tabla de razones que compara harina y azúcar como 3 : 2, si usas 9 tazas de harina, ¿cuánta azúcar necesitas?",
      options: [
        {
          text: "6 cups of sugar (scaled up by ×3)",
          correct: true,
          explain: "Correct! Both quantities scaled up by ×3 (3×3=9 and 2×3=6)!",
        },
        {
          text: "5 cups of sugar",
          correct: false,
          explain:
            "Not quite: Remember to multiply both terms of the ratio by the SAME factor (3×3=9, so 2×3=6).",
        },
        {
          text: "12 cups of sugar",
          correct: false,
          explain: "Not quite: Scale 2 by ×3 to get 6 cups.",
        },
      ],
    };
  }
  if (text.includes("factor tree") || text.includes("prime factor")) {
    return {
      question: "Which of the following is the correct prime factorization of 12?",
      questionEs: "¿Cuál de las siguientes es la factorización prima correcta de 12?",
      options: [
        {
          text: "2 × 2 × 3",
          correct: true,
          explain: "Correct! 2 × 2 × 3 = 12, and 2 and 3 are both prime numbers!",
        },
        {
          text: "2 × 6",
          correct: false,
          explain: "Not quite: 6 is not a prime number (6 = 2 × 3).",
        },
        {
          text: "3 × 4",
          correct: false,
          explain: "Not quite: 4 is not a prime number (4 = 2 × 2).",
        },
      ],
    };
  }
  if (text.includes("fraction") && text.includes("divide")) {
    return {
      question: "When computing 3/4 ÷ 1/2, what is the first step?",
      questionEs: "Al calcular 3/4 ÷ 1/2, ¿cuál es el primer paso?",
      options: [
        {
          text: "Multiply 3/4 by 2/1 (Keep, Change, Flip)",
          correct: true,
          explain: "Correct! Flip 1/2 into 2/1 and multiply: 3/4 × 2/1 = 6/4 = 1 1/2!",
        },
        {
          text: "Divide 3 by 1 and 4 by 2 directly",
          correct: false,
          explain: "Incorrect: Remember the rule: Keep, Change, Flip!",
        },
        {
          text: "Flip 3/4 into 4/3",
          correct: false,
          explain: "Incorrect: Always keep the first fraction unchanged!",
        },
      ],
    };
  }
  // No lesson-specific item and no matching bank: render NO checkpoint. A
  // generic "how do you check your reasoning?" question taught nothing about
  // the lesson at hand and read as filler.
  return null;
}

let injectedStyles = false;

function injectVocabLearnStyles() {
  if (
    injectedStyles ||
    (typeof document !== "undefined" && document.getElementById("vl-panel-styles"))
  ) {
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
      font-weight: 800;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      margin-bottom: 16px;
      box-shadow: inset 0 1px 2px rgba(255,255,255,0.3);
    }
    .vl-hero-title {
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 2.05rem;
      font-weight: 800;
      margin: 0 0 12px;
      line-height: 1.25;
      letter-spacing: -0.015em;
    }
    .vl-hero-sub {
      font-size: 1.12rem;
      opacity: 0.96;
      margin: 0 0 16px;
      line-height: 1.6;
    }
    .vl-hero-speak-btn {
      padding: 8px 18px;
      border-radius: 999px;
      border: 1.5px solid rgba(255,255,255,0.35);
      background: rgba(255,255,255,0.18);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      backdrop-filter: blur(6px);
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
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .vl-tag-amber { background: #fef3c7; color: #92400e; }
    .vl-tag-teal { background: #ccfbf1; color: #0f766e; }
    .vl-tag-coral { background: #ffedd5; color: #9a3412; }
    .vl-section-title {
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 1.55rem;
      font-weight: 800;
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
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #92400e;
      margin-bottom: 10px;
      display: block;
    }
    .vl-key-idea-text {
      font-size: 1.2rem;
      font-weight: 700;
      color: #78350f;
      margin: 0;
      line-height: 1.65;
    }
    .vl-misconception-card {
      background: linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%);
      border: 2.5px solid #e11d48;
      border-radius: 20px;
      padding: 22px 26px;
      margin-bottom: 26px;
      box-shadow: 0 8px 20px rgba(225, 29, 72, 0.14);
    }
    .vl-misconception-label {
      font-size: 0.88rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #9f1239;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .vl-misconception-text {
      font-size: 1.08rem;
      font-weight: 600;
      color: #881337;
      margin: 0;
      line-height: 1.6;
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
      font-weight: 700;
      line-height: 1.55;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .vl-zoom-badge {
      font-size: 0.85rem;
      font-weight: 800;
      color: #0284c7;
      background: rgba(2, 132, 199, 0.1);
      padding: 6px 14px;
      border-radius: 8px;
      border: 1.5px solid rgba(2, 132, 199, 0.25);
    }
    /* Watch Me and the tool that practises it, side by side. The tool sticks so
       it stays beside whichever step the student is reading, instead of
       scrolling away from the step it is meant to be used on. Stacks to one
       column on anything narrower than a laptop, worked example first. */
    .vl-learn-pair {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      gap: var(--sp-4, 16px);
      align-items: start;
      margin: 26px 0;
    }
    .vl-learn-pair > :last-child {
      position: sticky;
      top: var(--sp-3, 12px);
      margin: 0 !important;
    }
    .vl-learn-pair .vl-demo-box { margin: 0; }
    /* Each step is a [badge][text][Hear Step] row, which needs the full panel
       width. In half a panel the sentence wrapped every three words, so inside
       the pair the row becomes a small grid: badge and button on one line, the
       sentence across the full column underneath. */
    .vl-learn-pair .vl-demo-step {
      display: grid;
      grid-template-columns: auto 1fr;
      grid-template-areas: "num btn" "text text";
      align-items: center;
      gap: 8px 10px;
    }
    .vl-learn-pair .vl-demo-step .vl-step-num { grid-area: num; }
    .vl-learn-pair .vl-demo-step .vl-step-text { grid-area: text; }
    .vl-learn-pair .vl-demo-step .vl-step-speak-btn { grid-area: btn; justify-self: end; }
    @media (max-width: 1023px) {
      .vl-learn-pair {
        grid-template-columns: 1fr;
      }
      .vl-learn-pair > :last-child {
        position: static;
      }
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
      font-weight: 800;
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
      font-weight: 800;
      letter-spacing: 0.03em;
    }
    .vl-step-text {
      font-size: 1.12rem;
      line-height: 1.55;
      color: #0f172a;
      font-weight: 600;
      flex: 1;
    }
    .vl-step-speak-btn {
      flex: 0 0 auto;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1.5px solid #0d7a76;
      background: #f0fdfa;
      color: #0f766e;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .vl-tryit-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2.5px solid #0284c7;
      border-radius: 22px;
      padding: 26px;
      margin-top: 28px;
      box-shadow: 0 10px 28px rgba(2, 132, 199, 0.12);
    }
    .vl-tryit-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .vl-tryit-title {
      font-family: "Outfit", system-ui, sans-serif;
      font-size: 1.3rem;
      font-weight: 800;
      color: #0369a1;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .vl-tryit-opt {
      padding: 14px 18px;
      border-radius: 14px;
      background: #ffffff;
      border: 2px solid #bae6fd;
      font-size: 1.05rem;
      font-weight: 600;
      color: #0c4a6e;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      width: 100%;
    }
    .vl-tryit-opt:hover {
      border-color: #0284c7;
      background: #f0f9ff;
      transform: translateY(-2px);
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
      font-weight: 800;
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
      font-weight: 800;
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
    /* The problem this Turn & Talk is about, quoted so both partners can see
       what "it" refers to. Quieter than the prompt — it is the context, not
       the ask. */
    .vl-turntalk-context {
      font-size: 1rem;
      font-weight: 600;
      color: #7c2d12;
      line-height: 1.55;
      margin-bottom: 10px;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 12px;
      border-left: 4px solid #fdba74;
    }
    .vl-turntalk-question {
      font-size: 1.18rem;
      font-weight: 700;
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
      font-weight: 800;
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
      font-weight: 600;
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
      font-weight: 800;
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
    /* ── Sequential Learn It stepper ─────────────────────────────────────── */
    .vl-hero-compact { padding: 22px 28px; margin-bottom: 18px; }
    .vl-hero-compact .vl-hero-title { font-size: 1.7rem; margin: 8px 0 10px; }
    .vl-rail {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0 0 18px;
    }
    .vl-rail-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-height: 44px;
      padding: 8px 14px;
      border-radius: 999px;
      border: 2px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      font-family: inherit;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
    }
    .vl-rail-btn:hover { border-color: #0f4c81; }
    .vl-rail-btn:focus-visible { outline: 3px solid #0f4c81; outline-offset: 2px; }
    .vl-rail-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #334155;
      font-size: 0.9rem;
      font-weight: 800;
    }
    .vl-rail-btn.vl-rail-active {
      background: #14223a;
      border-color: #14223a;
      color: #ffffff;
    }
    .vl-rail-btn.vl-rail-active .vl-rail-num { background: #ffffff; color: #14223a; }
    .vl-rail-btn.vl-rail-done { border-color: #0d7a76; }
    .vl-rail-btn.vl-rail-done .vl-rail-num { background: #ccfbf1; color: #0f766e; }
    .vl-step { display: none; }
    .vl-step.vl-step-active { display: block; }
    .vl-step-head { margin: 0 0 14px; }
    .vl-step-kicker {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #64748b;
    }
    .vl-step-title {
      margin: 4px 0 2px;
      font-family: "Outfit", "Hanken Grotesk", sans-serif;
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
    }
    .vl-step-title:focus { outline: none; }
    .vl-step-sub { margin: 0; font-size: 1.05rem; color: #475569; font-weight: 600; }
    .vl-step-body {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 24px 26px;
      box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
    }
    .vl-today-problem {
      margin: 0 0 18px;
      padding: 12px 16px 12px 18px;
      border-left: 4px solid #0d7a76;
      background: #f7faf9;
      border-radius: 0 12px 12px 0;
    }
    .vl-today-label {
      display: block;
      font-size: 0.82rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #0d7a76;
      margin-bottom: 4px;
    }
    .vl-today-text {
      margin: 0;
      /* Same scale and weight as .vl-bigidea-text — the scenario IS lesson
         content, and at 1.05rem it read as fine print under the question. */
      font-size: clamp(1.1rem, 1.8vw, 1.3rem);
      font-weight: 600;
      line-height: 1.6;
      color: #0f172a;
    }
    .vl-step-question {
      margin: 0 0 12px;
      font-family: "Outfit", "Hanken Grotesk", sans-serif;
      font-size: clamp(1.35rem, 2.4vw, 1.7rem);
      font-weight: 800;
      color: #0f4c81;
    }
    .vl-bigidea-text {
      margin: 0 0 18px;
      font-size: clamp(1.1rem, 1.8vw, 1.3rem);
      line-height: 1.6;
      color: #0f172a;
      font-weight: 600;
    }
    .vl-mathline {
      margin: 10px 0 2px;
      font-size: clamp(1.45rem, 2.6vw, 2rem);
      font-weight: 800;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
      overflow-x: auto;
      max-width: 100%;
    }
    .vl-mathline-hero { font-size: clamp(1.7rem, 3.2vw, 2.4rem); color: #0d3b66; }
    .vl-formula-card, .vl-example-card {
      background: #fffbeb;
      border: 2px solid #f5d78e;
      border-radius: 16px;
      padding: 16px 20px;
      margin: 6px 0 4px;
    }
    .vl-formula-label {
      display: block;
      font-size: 0.9rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #92400e;
      margin-bottom: 4px;
    }
    .vl-topic-line { margin: 4px 0 0; font-size: 1.2rem; font-weight: 700; color: #0f172a; }
    /* The algorithm's steps as a ladder: initial large enough to be the
       mnemonic, the operation's symbol beside it, the sentence to its right. */
    .vl-cycle {
      background: #f0f7ff;
      border: 2px solid #b9d6f2;
      border-radius: 16px;
      padding: 14px 18px 16px;
      margin: 14px 0 6px;
    }
    .vl-cycle .vl-formula-label { color: #0f4c81; }
    .vl-cycle-steps {
      list-style: none;
      margin: 8px 0 0;
      padding: 0;
      display: grid;
      gap: 10px;
      counter-reset: none;
    }
    .vl-cycle-step {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      background: #ffffff;
      border: 1px solid #cfe2f5;
      border-radius: 14px;
    }
    .vl-cycle-key {
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
      min-width: 4.6rem;
    }
    .vl-cycle-letter {
      font-size: clamp(2.1rem, 5vw, 3rem);
      font-weight: 900;
      line-height: 1;
      color: #0f4c81;
      font-variant-numeric: tabular-nums;
    }
    .vl-cycle-symbol {
      font-size: clamp(1.5rem, 3.4vw, 2.1rem);
      font-weight: 800;
      line-height: 1;
      color: #b45309;
    }
    .vl-cycle-body { display: grid; gap: 2px; }
    .vl-cycle-name {
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: #0f172a;
    }
    .vl-cycle-detail { font-size: 1rem; line-height: 1.5; color: #334155; }
    .vl-cycle-note {
      margin: 12px 0 0;
      font-size: 1rem;
      line-height: 1.55;
      font-weight: 600;
      color: #0f4c81;
    }
    @media (max-width: 480px) {
      .vl-cycle-step { grid-template-columns: 1fr; gap: 4px; }
      .vl-cycle-key { min-width: 0; }
    }
    .vl-rulepoints {
      margin: 0 0 16px;
      padding: 0 0 0 0;
      list-style: none;
      counter-reset: vl-rule;
      display: grid;
      gap: 10px;
    }
    .vl-rulepoints li {
      counter-increment: vl-rule;
      position: relative;
      padding: 12px 16px 12px 52px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      font-size: 1.08rem;
      line-height: 1.55;
      font-weight: 600;
      color: #0f172a;
    }
    .vl-rulepoints li::before {
      content: counter(vl-rule);
      position: absolute;
      left: 14px;
      top: 12px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #0f4c81;
      color: #ffffff;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .vl-lead { margin: 0 0 12px; font-size: 1.05rem; color: #334155; }
    /* Dual-Track Think-Aloud Workspace */
    .vl-dual-stage {
      display: grid;
      /* The right column carries prose — the step text and its workspace — so it
         gets the wider share. At 1.15fr / 1fr the steps wrapped at about 25
         characters and every step became a tall thin ribbon. */
      grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.25fr);
      gap: 16px;
      align-items: start;
      margin: 12px 0;
    }
    @media (max-width: 860px) {
      .vl-dual-stage { grid-template-columns: 1fr; }
    }
    .vl-stage-visual {
      background: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px;
      box-shadow: 0 1px 3px rgba(15,23,42,0.06);
    }
    .vl-stage-visual-head {
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .vl-stage-think {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .vl-step-crumbs {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .vl-crumb-pill {
      font-family: 'Outfit', sans-serif;
      font-size: 0.8rem;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #475569;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }
    .vl-crumb-pill.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }
    .vl-crumb-pill.completed {
      background: #ccfbf1;
      color: #0d9488;
      border-color: #0d9488;
    }
    .vl-think-badge-notice {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 800;
      color: #0284c7;
      background: #e0f2fe;
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .vl-think-badge-reason {
      display: inline-block;
      font-size: 0.72rem;
      font-weight: 800;
      color: #0d9488;
      background: #ccfbf1;
      padding: 2px 6px;
      border-radius: 4px;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .vl-solve-steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 12px;
    }
    .vl-solve-step {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: start;
      padding: 14px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
    }
    .vl-solve-step.vl-hidden { display: none; }
    .vl-hidden { display: none; }
    .vl-solve-body { min-width: 0; }
    .vl-solve-body .vl-step-text {
      display: block;
      font-size: 1.05rem;
      line-height: 1.55;
      color: #0f172a;
    }
    /* The step's manipulable workspace (components/step-workspace.js). */
    .vl-stepwork { margin-top: 12px; }
    .sw-shell {
      border: 2px dashed #93c5fd;
      border-radius: 14px;
      background: #f8fbff;
      padding: 12px 14px;
    }
    .sw-head {
      font-weight: 800;
      font-size: 0.95rem;
      color: #1d4ed8;
      margin-bottom: 8px;
    }
    .sw-lead { margin: 0 0 10px; font-size: 1rem; color: #334155; }
    .sw-board {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .sw-strip {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 4px;
      background: #ffffff;
      border: 2px solid #cbd5e1;
      border-radius: 10px;
    }
    .sw-digit {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 30px;
      padding: 6px 4px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 1.5rem;
      font-weight: 800;
      color: #0f172a;
    }
    .sw-point {
      display: inline-flex;
      align-items: flex-end;
      justify-content: center;
      min-width: 22px;
      min-height: 44px;
      padding: 0 2px 8px;
      font-size: 1.9rem;
      line-height: 1;
      font-weight: 900;
      color: #dc2626;
      background: #fee2e2;
      border: 2px solid #dc2626;
      border-radius: 8px;
      cursor: grab;
      touch-action: none;
    }
    .sw-point:active { cursor: grabbing; }
    .sw-point:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
    .sw-readout, .sw-eq-sign {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
    }
    .sw-op {
      font-size: 1.4rem;
      font-weight: 800;
      color: #1d4ed8;
    }
    .sw-num {
      min-width: 3ch;
      min-height: 44px;
      padding: 4px 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 1.3rem;
      font-weight: 800;
      text-align: center;
      color: #0f172a;
      background: #ffffff;
      border: 2px solid #cbd5e1;
      border-radius: 10px;
    }
    .sw-num:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 1px; }
    .sw-answer { border-color: #1d4ed8; background: #eff6ff; }
    .sw-controls { display: flex; flex-wrap: wrap; gap: 8px; }
    .sw-btn {
      min-height: 44px;
      padding: 8px 14px;
      border-radius: 12px;
      font-family: inherit;
      font-size: 0.98rem;
      font-weight: 800;
      cursor: pointer;
      background: #ffffff;
      border: 2px solid #cbd5e1;
      color: #334155;
    }
    .sw-btn-primary { background: #1d4ed8; border-color: #1d4ed8; color: #ffffff; }
    .sw-btn-quiet { font-weight: 700; }
    .sw-status { margin: 8px 0 0; font-size: 1rem; font-weight: 700; min-height: 1.2em; }
    .sw-status.sw-ok { color: #047857; }
    .sw-status.sw-try { color: #b45309; }
    @media print { .sw-controls { display: none; } }
    .vl-pace {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 16px 0 4px;
    }
    .vl-pace-next, .vl-pace-all, .vl-back-btn, .vl-next-btn {
      min-height: 48px;
      padding: 10px 20px;
      border-radius: 14px;
      font-family: inherit;
      font-size: 1.02rem;
      font-weight: 800;
      cursor: pointer;
    }
    .vl-pace-next {
      background: #0f4c81;
      border: 2px solid #0f4c81;
      color: #ffffff;
    }
    .vl-pace-all, .vl-back-btn {
      background: #ffffff;
      border: 2px solid #cbd5e1;
      color: #334155;
    }
    .vl-pace-count { font-weight: 700; opacity: 0.85; margin-left: 6px; }
    /* Must out-rank .vl-pace { display:flex } — a bare .vl-hidden ties on
       specificity and loses when it appears earlier in this sheet. */
    .vl-pace.vl-hidden { display: none; }
    .vl-check-reveal {
      margin-top: 8px;
      border: 2px solid #bae6fd;
      border-radius: 12px;
      background: #f0f9ff;
    }
    .vl-check-reveal summary {
      cursor: pointer;
      padding: 10px 14px;
      font-weight: 800;
      color: #0369a1;
      min-height: 44px;
      display: flex;
      align-items: center;
    }
    .vl-check-reveal .vl-check-body {
      padding: 4px 14px 12px;
      font-size: 1.08rem;
      font-weight: 600;
      color: #0c4a6e;
    }
    .vl-tool-block {
      margin: 20px 0 4px;
      padding: 18px;
      background: #f8fbff;
      border: 2px solid #38bdf8;
      border-radius: 18px;
    }
    .vl-tool-block.vl-hidden { display: none; }
    .vl-tool-head {
      font-family: "Outfit", sans-serif;
      font-size: 1.1rem;
      font-weight: 800;
      color: #0369a1;
      margin-bottom: 12px;
    }
    .vl-tryit-question {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0c4a6e;
      margin-bottom: 16px;
    }
    .vl-tryit-opts { display: flex; flex-direction: column; gap: 12px; }
    .vl-tryit-opt.vl-opt-right { background: #dcfce7; border-color: #16a34a; }
    .vl-tryit-opt.vl-opt-wrong { background: #fef2f2; border-color: #ef4444; }
    .vl-tryit-feedback {
      margin-top: 16px;
      padding: 14px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 1rem;
    }
    .vl-tryit-feedback.vl-fb-right { background: #f0fdf4; color: #14532d; border: 2px solid #22c55e; }
    .vl-tryit-feedback.vl-fb-wrong { background: #fff1f2; color: #9f1239; border: 2px solid #f43f5e; }
    .vl-confidence-widget {
      margin-top: 24px;
      padding: 20px 24px;
      background: #f0fdf4;
      border: 2px solid #16a34a;
      border-radius: 20px;
    }
    .vl-conf-title {
      font-family: "Outfit", sans-serif;
      font-size: 1.12rem;
      font-weight: 800;
      color: #14532d;
      margin-bottom: 14px;
    }
    .vl-conf-options { display: flex; gap: 12px; flex-wrap: wrap; }
    .vl-conf-btn {
      flex: 1;
      min-width: 140px;
      min-height: 48px;
      padding: 12px;
      border-radius: 14px;
      border: 2px solid #cbd5e1;
      background: #ffffff;
      color: #14532d;
      font-family: inherit;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .vl-conf-btn.vl-conf-active { background: #14532d; border-color: #14532d; color: #ffffff; }
    .vl-conf-feedback {
      margin-top: 14px;
      font-weight: 700;
      font-size: 1.02rem;
      padding: 12px 16px;
      border-radius: 12px;
      background: #dcfce7;
      color: #14532d;
    }
    .vl-stepnav {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 16px;
    }
    .vl-stepnav .vl-next-btn {
      margin-left: auto;
      background: #14223a;
      border: 2px solid #14223a;
      color: #ffffff;
    }
    .vl-stepnav button:focus-visible, .vl-pace button:focus-visible {
      outline: 3px solid #0f4c81;
      outline-offset: 2px;
    }
    .vl-stepfig {
      margin: 12px 0 2px;
      padding: 12px 14px 8px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow-x: auto;
      max-width: 100%;
    }
    .vl-stepfig-cap {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 700;
      margin-top: 4px;
    }
    .vl-stepfig .li-fig-svg {
      display: block;
      width: 100%;
      max-width: 420px;
      height: auto;
    }
    /* The live problem: LARGE, and it stays on screen while the student scrolls
       the steps beside it, because the whole point is that the steps happen ON
       this problem. Sticky only where there is a second column to scroll past
       it — on one column it just sits at the top like any other figure. */
    /* The move this step makes — DIVIDE, MULTIPLY, SUBTRACT, BRING DOWN — as a
       chip at the head of the step, so the four-move cycle is visible as a
       shape instead of being buried at the front of a sentence. */
    .vl-step-move {
      display: inline-block;
      margin-bottom: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      background: #0f766e;
      color: #ffffff;
      font-family: 'Outfit', sans-serif;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .vl-livefig {
      margin: 0;
      border: none;
      padding: 4px 0 0;
      background: transparent;
    }
    /* The division figure carries class "dwf", not "li-fig-svg", so the shared
       rule above never reached it and it rendered at its intrinsic 182px inside
       a 430px column. This is the "large problem" half of the ask.
       NOTE: no backticks in this comment — the whole block is a JS template
       literal, and a single backtick here would end it. */
    .vl-livefig svg,
    .vl-livefig .li-fig-svg {
      display: block;
      width: 100%;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
    }
    @media (min-width: 861px) {
      .vl-stage-visual:has(.vl-livefig) {
        position: sticky;
        top: 12px;
      }
    }
    ${DIVISION_FIGURE_CSS}
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    @media (prefers-reduced-motion: reduce) {
      .vl-container * { transition: none !important; animation: none !important; }
    }
    @media print {
      .vl-step { display: block !important; }
      .vl-solve-step.vl-hidden { display: grid !important; }
      .vl-tool-block.vl-hidden, .vl-rail, .vl-stepnav, .vl-pace { display: none !important; }
    }
    @media (max-width: 600px) {
      .vl-container { padding: 12px 14px 32px; }
      .vl-hero { padding: 22px; }
      .vl-hero-title { font-size: 1.55rem; }
      .vl-section-card { padding: 20px; }
      .vl-continue-btn { width: 100%; padding: 18px 24px; font-size: 1.15rem; }
      .vl-step-body { padding: 16px 14px; }
      .vl-rail-label { font-size: 0.85rem; }
      .vl-solve-step { grid-template-columns: auto 1fr; }
      .vl-solve-step .vl-step-speak-btn { grid-column: 1 / -1; justify-self: end; }
      .vl-stepnav { flex-direction: column-reverse; }
      .vl-stepnav .vl-next-btn, .vl-stepnav .vl-back-btn { width: 100%; }
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
      try {
        if (state) state.set({ vocabVisited: true });
      } catch (_) {}
      onComplete?.();
    },
  });

  // Highlight vocabulary terms throughout
  if (vocabList.length > 0) {
    try {
      underlineVocabTerms(cardSection, vocabList);
    } catch (_) {}
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
    try {
      if (state) state.set({ vocabVisited: true });
    } catch (_) {}
    onComplete?.();
  });
  actions.append(btn);
  wrap.append(actions);

  container.append(wrap);
}

// ─── 2. SEPARATE LEARN IT PANEL (EXPLANATION + INTERACTIVE VISUAL + TURN AND TALK + CONFIDENCE CHECK) ──
// Open the Learn It tool on the problem the worked example is actually working.
//
// The tool used to be chosen by resolveInteractiveVisual() from the standard and
// the title, with hard-coded operands — so a student read "I add: 128.75 + 46.80"
// and then met a tool set to 3.4 + 1.25. Nothing connected the two. Reading the
// operands out of the iDo lines makes the tool the place you TRY the step you
// just watched.
//
// Conservative by design: it overrides only on a clean match for the operation
// the tool already performs, and otherwise leaves the authored defaults alone.
function decimalsIn(n) {
  const s = String(n);
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : s.length - dot - 1;
}

// A PARALLEL problem — same shape, different numbers.
//
// Seeding the tool with the exact problem the worked example solves let a
// student read the answer straight off the step beside it. This keeps every
// feature the lesson is teaching — the number of decimal places in each operand
// (so "annex a zero" still applies), the operation, and which operand is larger
// — and changes only the digits, so the student has to actually do it.
//
// Deterministic: the same lesson always produces the same practice problem, so
// it matches the printout and does not reshuffle on every reload.
function parallelPair(a, b, op) {
  const keep = (v, places) => Number(v.toFixed(places));
  const pa = decimalsIn(a);
  const pb = decimalsIn(b);
  let na = keep(a * 1.17, pa);
  let nb = keep(b * 1.17, pb);
  // Subtraction must not go negative, and neither operand should collapse to 0.
  if (op === "-" && nb >= na) [na, nb] = [nb + keep(na, pa), na];
  if (!(na > 0) || !(nb > 0)) return [a, b];
  return [na, nb];
}

// Display unit for the tool, read from the words the lesson actually uses.
// area-morph prints the unit on every measurement ("b = 12 ft"), so an unset
// unit makes the figure read as abstract next to a lesson about a garden.
function unitFromText(text) {
  const m = text.match(
    /\b(feet|foot|ft|inches|inch|in\.|centimeters|cm|meters|metres|m|yards|yd)\b/i,
  );
  if (!m) return "";
  const w = m[1].toLowerCase();
  if (/^(feet|foot|ft)$/.test(w)) return "ft";
  if (/^(inches|inch|in\.)$/.test(w)) return "in";
  if (/^(centimeters|cm)$/.test(w)) return "cm";
  if (/^(meters|metres|m)$/.test(w)) return "m";
  return "yd";
}

/* Give the area explorer the LESSON'S OWN measurements.
 *
 * Unlike the arithmetic tools above, this one is deliberately NOT a parallel
 * problem. area-morph does not pose a question to answer — it demonstrates WHY
 * a formula works, by rotating a copy of the triangle to build a parallelogram.
 * There is no answer for a student to read off the worked example, so changing
 * the digits buys nothing and costs the thing that matters: seeing the very
 * garden they just read about get cut apart. Left unseeded it drew the
 * component's built-in 8 × 5 default beside a lesson about 12 × 8.
 *
 * Dimensions are clamped to what the drawing can actually hold — a stray
 * "126 square feet" total from the same paragraph must not become a base.
 */
function seedAreaMorph(iv, text) {
  const n = "(\\d+(?:\\.\\d+)?)";
  const grab = (re) => {
    const m = text.match(re);
    const v = m ? Number(m[1]) : NaN;
    return Number.isFinite(v) && v > 0 && v <= 40 ? v : null;
  };

  const unit = unitFromText(text);
  const out = { ...iv };
  if (unit) out.unit = unit;

  const height = grab(new RegExp(`heights?\\s+of\\s+${n}`, "i"));

  if (iv.figure === "trapezoid") {
    // "a top base of 4 feet, a bottom base of 8 feet" → a = top, b = bottom.
    const top = grab(new RegExp(`top\\s+base\\s+of\\s+${n}`, "i"));
    const bottom = grab(new RegExp(`bottom\\s+base\\s+of\\s+${n}`, "i"));
    if (top) out.a = top;
    if (bottom) out.b = bottom;
    if (height) out.h = height;
    return out;
  }

  if (iv.figure === "polygon") {
    // "Each side is 6 feet, and each center triangle has a height of 5.2 feet"
    const side = grab(new RegExp(`each\\s+side\\s+is\\s+${n}`, "i"));
    if (side) out.b = side;
    if (height) out.h = height;
    return out;
  }

  if (iv.figure === "composite") {
    // "one is 12 ft by 8 ft" — the first rectangle sets the overall scale.
    const by = text.match(new RegExp(`${n}\\s*(?:ft|feet|in|cm|m)?\\s+by\\s+${n}`, "i"));
    const w = by ? Number(by[1]) : null;
    const t = by ? Number(by[2]) : null;
    if (w > 0 && w <= 40) out.b = w;
    if (t > 0 && t <= 40) out.h = t;
    return out;
  }

  // parallelogram + triangle: "a base of 12 feet and a height of 8 feet"
  const base = grab(new RegExp(`bases?\\s+of\\s+${n}`, "i"));
  if (base) out.b = base;
  if (height) out.h = height;
  return out;
}

/**
 * Pull a worked step apart into its MOVE and its sentence.
 *
 * Authored steps carry two things the UI was printing raw:
 *
 *   "STEP 0 — MOVE THE POINT: I move the decimal point 1 place right…"
 *   "DIVIDE: 63 does not fit into 1 or 18, so my first working number is 189…"
 *
 * The leading "STEP 0 —" fought the panel's OWN step number: the card headed
 * "Step 2" opened with the words "STEP 0", which is the first thing a reader
 * trips over. And the move name — DIVIDE, MULTIPLY, SUBTRACT, BRING DOWN — was
 * buried at the front of a sentence, so the four-move cycle a student is
 * supposed to SEE repeating was invisible in a column of prose (Joel,
 * 2026-08-26: "the watch me solve it steps did not address the concern — it's
 * hard to follow the way it goes now").
 *
 * Returns `{ move, text }`. `move` is null when the step names no move, which
 * is most of them in most lessons — this changes nothing for those.
 */
function splitStepMove(line) {
  const raw = String(line || "").trim();
  // Drop an authored "STEP n —" / "STEP n:" opener; the panel numbers the step.
  const noStep = raw.replace(/^step\s*\d+\s*[—:-]\s*/i, "");
  // A short ALL-CAPS label followed by a colon is a named move.
  const m = noStep.match(/^([A-Z][A-Z '’]{1,22}):\s*(.+)$/s);
  if (!m) return { move: null, text: noStep };
  // "BRING DOWN: there are no digits left…" must not become a sentence that
  // starts lowercase once the label is lifted off it.
  const rest = m[2].trim();
  return { move: m[1].trim(), text: rest.charAt(0).toUpperCase() + rest.slice(1) };
}

function seedVisualFromWorkedExample(iv, lines) {
  if (!iv || !iv.kind || !Array.isArray(lines) || !lines.length) return iv;
  const text = lines.join(" ");
  const num = "(\\d+(?:\\.\\d+)?)";
  const find = (opChars) => {
    const m = text.match(new RegExp(`${num}\\s*([${opChars}])\\s*${num}`));
    return m ? { a: Number(m[1]), op: m[2], b: Number(m[3]) } : null;
  };

  if (iv.kind === "area-morph") return seedAreaMorph(iv, text);

  if (iv.kind === "decimal-columns") {
    const hit = find("+\\-\u2212");
    if (hit) {
      const [a, b] = parallelPair(hit.a, hit.b, hit.op === "+" ? "+" : "-");
      return { ...iv, op: hit.op === "+" ? "+" : "-", a, b };
    }
  }
  if (iv.kind === "decimal-product") {
    const hit = find("\u00d7x*");
    if (hit) {
      const [a, b] = parallelPair(hit.a, hit.b, "*");
      return { ...iv, a, b };
    }
  }
  if (iv.kind === "decimal-quotient") {
    const hit = find("\u00f7/");
    if (hit && hit.b) {
      // Keep the quotient exact: scale the dividend so it still divides evenly.
      const divisor = hit.b;
      const q = Math.round(hit.a / hit.b);
      const dividend = Number((divisor * (q + 1)).toFixed(decimalsIn(hit.a)));
      return { ...iv, dividend, divisor };
    }
  }
  if (iv.kind === "fraction-divide") {
    const f = "(\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+)";
    const m = text.match(new RegExp(`${f}\\s*\u00f7\\s*${f}`));
    if (m) return { ...iv, dividend: m[1].trim(), divisor: m[2].trim() };
  }
  return iv;
}

export function renderLearnItPanel(container, config, options = {}) {
  const { onComplete = () => {}, state = null, renderExtras = null } = options;
  injectVocabLearnStyles();
  container.innerHTML = "";

  const isEs = getPreferredLang() === "es";
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const wrap = document.createElement("div");
  wrap.className = "vl-container";

  const concept = config.conceptIntro || config.launch?.conceptIntro || {};
  // The panel SWITCHES language rather than stacking (matching misconception.es
  // and its own chrome), so the Spanish is chosen here and the English is the
  // fallback whenever a lesson has no translation yet.
  const pickEs = (en, es) => (isEs && String(es ?? "").trim() ? es : en);
  const heading =
    pickEs(concept.heading, concept.headingEs) ||
    config.contentObjective ||
    `Understanding ${config.title}`;
  const intro = pickEs(concept.intro, concept.introEs) || config.contentObjective || "";
  const keyIdea = parseKeyIdea(concept.keyIdea || config.contentObjective || "");
  // The algorithm's named steps, when the lesson authors one (long division's
  // DIVIDE · MULTIPLY · SUBTRACT · BRING DOWN). Parsed from the reader's OWN
  // language so the initials spell the mnemonic they are being taught; null
  // for every lesson whose key idea is not a named cycle.
  const stepCycle = parseStepCycle(
    parseKeyIdea(pickEs(concept.keyIdea, concept.keyIdeaEs) || "").points,
  );
  const cycleHtml = stepCycle
    ? `<div class="vl-cycle">
         <span class="vl-formula-label">🪜 ${
           isEs ? "Estos son los pasos — en este orden" : "These are the steps — in this order"
}</span>
         <ol class="vl-cycle-steps">${stepCycle.steps
           .map(
             (step) => `<li class="vl-cycle-step">
                  <span class="vl-cycle-key"><span class="vl-cycle-letter">${escHtml(step.letter)}</span><span class="vl-cycle-symbol">${escHtml(step.symbol)}</span></span>
                  <span class="vl-cycle-body"><b class="vl-cycle-name">${escHtml(step.name)}</b><span class="vl-cycle-detail">${renderMathText(step.detail)}</span></span>
                </li>`,
           )
           .join("")}</ol>
         ${stepCycle.note ? `<p class="vl-cycle-note">${renderMathText(stepCycle.note)}</p>` : ""}
       </div>`
    : "";
  const iDo = concept.iDo || {};
  const weDo = concept.weDo || {};
  const isLine = (l) => typeof l === "string" && l.trim();
  const iLines = Array.isArray(iDo.lines) ? iDo.lines.filter(isLine) : [];
  const weLines = Array.isArray(weDo.lines) ? weDo.lines.filter(isLine) : [];
  /* The worked example's Spanish — a parallel array in the same shape as
     stemEs / hintsEs / choicesEs, filled from data/es-translations by
     tools/apply-es-concept-intro.mjs.

     ALL-OR-NOTHING, and the length is compared against the UNFILTERED authored
     array: `lines` above drops blanks, so a translation written against the
     authored file would be one short of the filtered list and every step after
     the blank would show the previous step's Spanish. Mismatched lengths fall
     back to English entirely, which is the same rule choicesEs already follows —
     a walkthrough with one Spanish step between two English ones reads as a
     broken page, not as support.

     DISPLAY ONLY. Everything derived from a line — the tableau, the equation
     strip, the manipulable move — keeps parsing the ENGLISH, because those
     readers match on English wording ("becomes", "DIVIDE:") and are what
     validate:learn-figures and validate:surface-numbers hold to the lesson's
     own numbers. */
  const parallelEs = (authored, filtered, key) => {
    const list = Array.isArray(authored?.[key]) ? authored[key] : null;
    if (!list || !Array.isArray(authored?.lines)) return null;
    if (list.length !== authored.lines.length) return null;
    const kept = authored.lines.map((l, i) => [l, list[i]]).filter(([l]) => isLine(l));
    return kept.length === filtered.length ? kept.map(([, es]) => es) : null;
  };
  const iLinesEs = parallelEs(iDo, iLines, "linesEs");
  const weLinesEs = parallelEs(weDo, weLines, "linesEs");
  /** The line to SHOW for step `idx` — Spanish when the lane is on and it exists. */
  const shown = (esList, idx, line) => (isEs && esList?.[idx]?.trim() ? esList[idx] : line);
  const vocabList = Array.isArray(config.vocabulary) ? config.vocabulary : [];

  const misconception = resolveLessonMisconception(config);
  const tryIt = resolveTryItChallenge(config);
  const visuals = resolveObjectiveVisuals(config);
  const ivConfig = seedVisualFromWorkedExample(resolveInteractiveToolForLesson(config), iDo.lines);

  // One display-math line, printed LARGE. Only ever fed authored text or an
  // equation extractEquation() vouched for — never invented mathematics.
  const mathLine = (eq, extraClass = "") =>
    `<p class="vl-mathline ${extraClass}" role="math" aria-label="${escHtml(eq)}">${renderMathText(eq)}</p>`;
  const lineEquation = (line) => {
    const eq = extractEquation(line);
    return eq ? mathLine(eq) : "";
  };

  // ── Header: what this is + read-aloud ─────────────────────────────────────
  const hero = document.createElement("div");
  hero.className = "vl-hero vl-hero-compact";
  hero.innerHTML = `
    <div class="vl-hero-badge">${isEs ? "📖 Aprende — un paso a la vez" : "📖 Learn It — one step at a time"}</div>
    <h2 class="vl-hero-title">${escHtml(config.title)}</h2>
    <button type="button" class="vl-hero-speak-btn" id="vlHeroSpeakBtn">
      🔊 ${isEs ? "Escuchar la idea principal" : "Listen to the big idea"}
    </button>
  `;
  hero.querySelector("#vlHeroSpeakBtn").addEventListener("click", () => {
    speakText(`${heading}. ${intro}`, isEs ? "es-US" : "en-US");
  });
  wrap.append(hero);

  // ── The instructional moments, one mathematical idea at a time ────────────
  // Teach → Show → Work Through → Try → Notice/Check (+ Apply). A moment with
  // nothing to show for THIS lesson is dropped and the rest renumber cleanly.
  /** @type {Array<{icon:string,label:string,sub:string,build:(host:HTMLElement)=>void,onFirstShow?:(host:HTMLElement)=>void}>} */
  const steps = [];

  // ① The Big Idea — what are we learning? Short, math first. It OPENS with
  // the lesson's own scenario — the same problem the teacher just projected
  // from the Launch slide — so the steps that follow read as "here is how we
  // crack today's problem", not as a brand-new abstract exercise. Rendered
  // verbatim from launch.narrative (the canonical field the deck's Scenario
  // Launch slide prints), never paraphrased; Step 6 returns to solve it.
  const todaysProblem = String(config.launch?.narrative || "").trim();
  // "See How It Works" listed the rule as numbered prose and then "Watch Me
  // Solve It" walked those same moves against the real problem — the same
  // teaching twice, the weaker copy first. Where a walkthrough exists the
  // listing step is dropped and its two pieces of real content move to where
  // they earn their place: the example beside the rule it demonstrates, and
  // the visual model at the head of the walk it illustrates. A lesson with no
  // walkthrough keeps the step exactly as it was.
  const hasWalkthrough = iLines.length > 0;
  const exampleCardHtml = keyIdea.example
    ? `<div class="vl-example-card">
         <span class="vl-formula-label">${isEs ? "Por ejemplo:" : "Like this:"}</span>
         ${mathLine(keyIdea.example)}
       </div>`
    : "";
  const visualCardHtml = visuals?.content?.src
    ? `<div class="vl-visual-card">
         <div class="vl-visual-img-wrap" id="vlVisualZoomTarget" title="Click to enlarge visual model">
           <img src="${visuals.content.src}" alt="${escHtml(visuals.content.alt)}" loading="lazy" />
         </div>
         <div class="vl-visual-caption">
           <span>📊 <strong>${isEs ? "Modelo visual:" : "The math as a picture:"}</strong> ${escHtml(visuals.content.caption)}</span>
           <span class="vl-zoom-badge">🔍 ${isEs ? "Toca para ampliar" : "Click to enlarge"}</span>
         </div>
       </div>`
    : "";
  const wireVisualZoom = (host) => {
    const zoomTarget = host.querySelector("#vlVisualZoomTarget");
    if (!zoomTarget) return;
    zoomTarget.addEventListener("click", () => {
      openVisualLightbox(visuals.content.src, visuals.content.caption);
    });
  };
  steps.push({
    icon: "💡",
    label: isEs ? "La gran idea" : "The Big Idea",
    sub: isEs ? "¿Qué vamos a aprender?" : "What are we learning?",
    build(host) {
      host.innerHTML = `
        ${
          todaysProblem
            ? `<div class="vl-today-problem">
                 <span class="vl-today-label">📌 ${isEs ? "El problema de hoy" : "Today's problem"}</span>
                 <p class="vl-today-text">${renderMathText(todaysProblem)}</p>
               </div>`
            : ""
        }
        <h4 class="vl-step-question">${renderMathText(heading)}</h4>
        ${intro ? `<p class="vl-bigidea-text">${renderMathText(intro)}</p>` : ""}
        ${cycleHtml}
        ${
          keyIdea.formula
            ? `<div class="vl-formula-card">
                 <span class="vl-formula-label">${isEs ? "💡 La regla — recuérdala" : "💡 The rule — remember this"}</span>
                 ${mathLine(keyIdea.formula, "vl-mathline-hero")}
               </div>`
            : keyIdea.topic
              ? `<div class="vl-formula-card">
                   <span class="vl-formula-label">${isEs ? "💡 La idea clave" : "💡 The key idea"}</span>
                   <p class="vl-topic-line">${renderMathText(keyIdea.topic)}</p>
                 </div>`
              : ""
        }
        ${hasWalkthrough ? exampleCardHtml : ""}`;
    },
  });

  // ② See How It Works — the rule as short numbered moves + the visual model.
  // Only for a lesson with no worked walkthrough; see `hasWalkthrough`.
  if (!hasWalkthrough && (keyIdea.points.length || keyIdea.example || visuals?.content?.src)) {
    steps.push({
      icon: "👁️",
      label: isEs ? "Cómo funciona" : "See How It Works",
      sub: isEs ? "La regla y el modelo visual" : "The rule, and what it looks like",
      build(host) {
        host.innerHTML = `
          ${
            keyIdea.points.length
              ? `<ol class="vl-rulepoints">${keyIdea.points
                  .map((p) => `<li>${renderMathText(p)}</li>`)
                  .join("")}</ol>`
              : ""
          }
          ${exampleCardHtml}
          ${visualCardHtml}`;
        wireVisualZoom(host);
      },
    });
  }

  // Reveal-one-step-at-a-time wiring shared by "Watch me" and "Try with me".
  // All items exist in the DOM (print shows everything); pacing is display
  // only. With 0–1 items the pace row never appears.
  const wirePaced = (host, onAllShown, onStep) => {
    const items = Array.from(host.querySelectorAll(".vl-solve-step"));
    const pace = /** @type {HTMLElement|null} */ (host.querySelector(".vl-pace"));
    const crumbs = Array.from(host.querySelectorAll(".vl-crumb-pill"));
    let shown = 1;
    const finish = () => {
      if (pace) pace.classList.add("vl-hidden");
      onAllShown?.();
    };
    const updateCrumbs = () => {
      crumbs.forEach((c, idx) => {
        c.classList.remove("active", "completed");
        if (idx < shown - 1) c.classList.add("completed");
        else if (idx === shown - 1) c.classList.add("active");
      });
    };
    if (items.length <= 1 || !pace) {
      items.forEach((it) => it.classList.remove("vl-hidden"));
      updateCrumbs();
      onStep?.(items.length - 1);
      finish();
      return;
    }
    const nextBtn = /** @type {HTMLButtonElement} */ (pace.querySelector(".vl-pace-next"));
    const allBtn = /** @type {HTMLButtonElement} */ (pace.querySelector(".vl-pace-all"));
    const count = pace.querySelector(".vl-pace-count");
    const update = () => {
      if (count) count.textContent = `${shown} / ${items.length}`;
      updateCrumbs();
      // The problem on the left continues to the step the student is on.
      onStep?.(shown - 1);
    };
    update();
    nextBtn.addEventListener("click", () => {
      const item = items[shown];
      if (!item) return;
      item.classList.remove("vl-hidden");
      shown++;
      update();
      if (!prefersReducedMotion) item.scrollIntoView({ behavior: "smooth", block: "nearest" });
      if (shown >= items.length) finish();
    });
    allBtn.addEventListener("click", () => {
      items.forEach((it) => it.classList.remove("vl-hidden"));
      shown = items.length;
      update();
      finish();
    });
    crumbs.forEach((c, idx) => {
      c.addEventListener("click", () => {
        items.forEach((it, i) => {
          if (i <= idx) it.classList.remove("vl-hidden");
        });
        shown = Math.max(shown, idx + 1);
        update();
        if (!prefersReducedMotion)
          items[idx]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        if (shown >= items.length) finish();
      });
    });
  };

  const speakButtonsIn = (host) => {
    host.querySelectorAll(".vl-step-speak-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-step-text");
        if (text) speakText(text, isEs ? "es-US" : "en-US");
      });
    });
  };

  // ③ Watch Me Solve It — the worked example, one move at a time, with each
  // move's mathematics printed large under the sentence. Where the walk IS
  // the standard long-division algorithm, each step also carries a snapshot
  // of the vertical tableau as it stands after that move — quotient above
  // the bar, products and differences in their columns — derived by
  // simulating the algorithm and drawn only when every snapshot's numbers
  // are the ones the authored line states (division-walk-figure.js).
  const divFigs = carriedDivisionFigures(iLines);
  // Factor-tree walks (6-13) reuse the exact reader/drawer the generated
  // learn.html pages already trust (scripts/lib/learn-figures.mjs — gated by
  // validate:learn-figures): the tree gains a branch per authored line. Fed
  // the panel's own filtered lines so figure i always belongs to step i.
  const treeFigs =
    workedStepFigures({ launch: { conceptIntro: { iDo: { lines: iLines } } } }) || [];
  // The problem's own labelled picture — parallelogram with ITS base and
  // height, the prism, the number line, the coordinate plane, the tape model —
  // drawn by the same strictly-validated reader learn.html trusts
  // (validate:learn-figures: every measurement the figure claims must appear
  // in the lesson text; it draws nothing when unsure). Pinned at the top of
  // Watch Me Solve It so the steps unfold against a picture of the problem
  // they are solving. 21 lessons across 9 figure kinds qualify today.
  let workedFig = null;
  try {
    workedFig = workedFigure(config);
  } catch (_) {}
  // The manipulable half of each step: the move its own sentence describes,
  // when that move can be read AND verified from the lesson's own numbers.
  // A step with no readable move gets no workspace and reads as it always has.
  const stepMoves = iLines.map((line) => {
    try {
      return extractStepMove(line);
    } catch (_) {
      return null;
    }
  });
  const stepFigureFor = (idx) => {
    const carried = divFigs[idx];
    if (carried) {
      return { svg: carried, cap: isEs ? "La división hasta ahora" : "The division so far" };
    }
    if (treeFigs[idx]?.svg) {
      return {
        svg: treeFigs[idx].svg,
        cap: isEs ? "El árbol de factores hasta ahora" : "The factor tree so far",
      };
    }
    return null;
  };
  if (iLines.length) {
    steps.push({
      icon: "👀",
      label: isEs ? "Mírame resolverlo" : "Watch Me Solve It",
      sub: isEs ? "Lee un paso, luego muestra el siguiente" : "Read one step, then show the next",
      build(host) {
        let visualElemHtml = workedFig
          ? `<figure class="vl-stepfig vl-workedfig">${workedFig.svg}<figcaption class="vl-stepfig-cap">${isEs ? "El problema se ve así" : "The problem looks like this"}</figcaption></figure>`
          : visualCardHtml;

        // THE PROBLEM ITSELF, LARGE, ON THE LEFT — and it grows as the steps
        // are revealed. What used to sit here was a static D/M/S/B legend card
        // ("Divide: how many times does the divisor fit?" …), which repeated
        // what the steps beside it already said and left the actual division
        // duplicated as a small figure under every step in the right-hand
        // column (Joel, 2026-08-26: "get rid of the DMSB part on the screen —
        // not necessary (this is in the watch me)" and "make it a large problem
        // with steps that happen directly on the problem and then the problem
        // continues").
        //
        // `divFigs[i]` is the division as it stands after step i, so showing the
        // latest revealed one is literally the problem continuing.
        // The division SVG ships an INLINE style="max-width:…px" sized for a
        // small in-step figure, and an inline style beats any stylesheet rule
        // without !important. The live stage wants it full width, so the cap is
        // stripped here rather than fought with specificity — and only here, so
        // the small per-step figures elsewhere keep theirs.
        const widen = (svg) => String(svg || "").replace(/style="max-width:\s*\d+px"/g, "");
        const liveFigs = !workedFig && divFigs.length > 0 ? divFigs : null;
        // Not every step has a figure: the first lines of 2-7 move the decimal
        // point before the tall form exists, and the last one is the check. The
        // host is seeded with the first REAL figure and an empty entry means
        // "no change", so the problem is on screen from the start and never
        // blanks out mid-solve.
        const firstLiveFig = liveFigs ? liveFigs.find(Boolean) || "" : "";
        if (liveFigs) {
          visualElemHtml = `
            <figure class="vl-stepfig vl-livefig" data-live-fig>
              ${widen(firstLiveFig)}
              <figcaption class="vl-stepfig-cap">${isEs ? "La división hasta ahora" : "The division so far"}</figcaption>
            </figure>`;
        }

        const crumbsHtml =
          iLines.length > 1
            ? `<div class="vl-step-crumbs">
               ${iLines
                 .map(
                   (_, idx) => `
                 <button type="button" class="vl-crumb-pill ${idx === 0 ? "active" : ""}" data-crumb-step="${idx}">
                   <span>${isEs ? "Paso" : "Step"} ${idx + 1}</span>
                 </button>
               `,
                 )
                 .join("")}
             </div>`
            : "";

        const stepsHtml = `
          <ol class="vl-solve-steps">
            ${iLines
              .map(
                (line, idx) => `
              <li class="vl-solve-step${idx === 0 ? "" : " vl-hidden"}">
                <span class="vl-step-num">${isEs ? "Paso" : "Step"} ${idx + 1}</span>
                <div class="vl-solve-body">
                  ${(() => {
                    const { move } = splitStepMove(line);
                    return move ? `<span class="vl-step-move">${escHtml(move)}</span>` : "";
                  })()}
                  <span class="vl-step-text">${renderMathText(splitStepMove(shown(iLinesEs, idx, line)).text)}</span>
                  ${lineEquation(line)}
                  ${(() => {
                    // The live figure on the left is already showing the
                    // division at this step; repeating it inside every step was
                    // the same picture eight times down one column.
                    if (liveFigs) return "";
                    const fig = stepFigureFor(idx);
                    return fig
                      ? `<figure class="vl-stepfig">${fig.svg}<figcaption class="vl-stepfig-cap">${fig.cap}</figcaption></figure>`
                      : "";
                  })()}
                  ${stepMoves[idx] ? `<div class="vl-stepwork" data-step-work="${idx}"></div>` : ""}
                </div>
                <button type="button" class="vl-step-speak-btn" data-step-text="${escHtml(splitStepMove(shown(iLinesEs, idx, line)).text)}">🔊 <span class="sr-only">${isEs ? "Escuchar paso" : "Hear step"} ${idx + 1}</span></button>
              </li>`,
              )
              .join("")}
          </ol>
          <div class="vl-pace no-print">
            <button type="button" class="vl-pace-next">${isEs ? "Muestra el siguiente paso" : "Show the next step"} ▸ <span class="vl-pace-count"></span></button>
            <button type="button" class="vl-pace-all">${isEs ? "Mostrar todos" : "Show all steps"}</button>
          </div>
        `;

        host.innerHTML = `
          ${iDo.title ? `<p class="vl-lead"><strong>${escHtml(isEs && iDo.titleEs ? iDo.titleEs : iDo.title)}</strong></p>` : ""}
          ${
            visualElemHtml
              ? `
            <div class="vl-dual-stage">
              <div class="vl-stage-visual">
                <div class="vl-stage-visual-head">${liveFigs ? `🧮 ${isEs ? "El problema" : "The problem"}` : `🎨 ${isEs ? "Modelo visual del problema" : "Problem Visual Model"}`}</div>
                ${visualElemHtml}
              </div>
              <div class="vl-stage-think">
                ${crumbsHtml}
                ${stepsHtml}
              </div>
            </div>
          `
              : `
            ${crumbsHtml}
            ${stepsHtml}
          `
          }
          ${
            ivConfig && ivConfig.kind
              ? `<div class="vl-tool-block vl-hidden">
                   <div class="vl-tool-head">🛠️ ${isEs ? "Ahora prueba ese mismo movimiento aquí:" : "Now try that same move here:"}</div>
                   ${interactiveVisualHost(ivConfig, ivConfig.label || visuals?.content?.caption || "")}
                 </div>`
              : ""
          }`;
        speakButtonsIn(host);
        wireVisualZoom(host);
        // Each step's workspace, mounted where its own sentence sits. Loaded on
        // demand so a lesson whose steps yield no move pays nothing for it.
        const workHosts = host.querySelectorAll("[data-step-work]");
        if (workHosts.length) {
          import("./step-workspace.js")
            .then(({ mountStepWorkspace }) => {
              workHosts.forEach((slot) => {
                const move = stepMoves[Number(slot.getAttribute("data-step-work"))];
                if (move)
                  mountStepWorkspace(/** @type {HTMLElement} */ (slot), move, {
                    lang: isEs ? "es" : "en",
                  });
              });
            })
            .catch((err) => console.warn("step-workspace: mount skipped", err));
        }
        const toolBlock = /** @type {HTMLElement|null} */ (host.querySelector(".vl-tool-block"));
        let toolMounted = false;
        // Swap the live figure to the latest revealed step. Cheap: the SVGs are
        // already built, and a step with no figure of its own keeps the last one
        // on screen rather than blanking the problem mid-solve.
        const liveHost = liveFigs
          ? /** @type {HTMLElement|null} */ (host.querySelector("[data-live-fig]"))
          : null;
        const showLiveFig = liveHost
          ? (idx) => {
              const svg = widen(liveFigs[Math.max(0, Math.min(idx, liveFigs.length - 1))]);
              if (!svg) return;
              const cap = liveHost.querySelector(".vl-stepfig-cap");
              liveHost.innerHTML = svg + (cap ? cap.outerHTML : "");
            }
          : undefined;
        wirePaced(
          host,
          () => {
            if (!toolBlock || toolMounted) return;
            toolMounted = true;
            toolBlock.classList.remove("vl-hidden");
            mountInteractiveVisuals(toolBlock, { state });
          },
          showLiveFig,
        );
      },
    });
  }

  // ④ Try It With Me — the guided example ASKS before it tells: the answer to
  // each question sits behind a "Check" reveal instead of in the next line.
  // Ends with the one thing to Notice (the lesson's own misconception).
  if (weLines.length || misconception) {
    steps.push({
      icon: "🤝",
      label: isEs ? "Inténtalo conmigo" : "Try It With Me",
      sub: isEs ? "Responde primero, luego comprueba" : "Answer first in your head, then check",
      build(host) {
        // ONE STEP PER TAUGHT MOVE. An authored line can hold several: 2-6
        // writes "MULTIPLY: 4 × 8 = ? (32 …) SUBTRACT: 38 − 32 = ? (6.)" on one
        // line, and rendering that as a single numbered step showed 3 steps for
        // a 4-move algorithm and gave the next question away inside the
        // previous answer's reveal. splitGuidedSteps cuts at each ask; both
        // language lanes are split the same way so the ask and its "Check" stay
        // together in whichever one is showing.
        const guided = weLines
          .flatMap((line, idx) => {
            const segs = splitGuidedSteps(line);
            const segsEs =
              isEs && weLinesEs?.[idx]?.trim() ? splitGuidedSteps(weLinesEs[idx]) : null;
            return segs.map((g, k) => {
              // Only pair the Spanish lane when it split into the same number of
              // moves; a mismatched split would show move 2's Spanish under
              // move 1's English.
              const gEs = segsEs && segsEs.length === segs.length ? segsEs[k] : null;
              return {
                ask: gEs ? gEs.ask : g.ask,
                tell: gEs ? gEs.tell || g.tell : g.tell,
                enAsk: g.ask,
              };
            });
          })
          .map((step, idx) => {
            const reveal = step.tell
              ? `<details class="vl-check-reveal"><summary>✓ ${isEs ? "Comprueba" : "Check"}</summary><div class="vl-check-body">${renderMathText(step.tell)}</div></details>`
              : lineEquation(step.enAsk);
            return `
              <li class="vl-solve-step${idx === 0 ? "" : " vl-hidden"}">
                <span class="vl-step-num">${idx + 1}</span>
                <div class="vl-solve-body">
                  <span class="vl-step-text">${renderMathText(step.ask)}</span>
                  ${reveal}
                </div>
                <button type="button" class="vl-step-speak-btn" data-step-text="${escHtml(step.ask)}">🔊 <span class="sr-only">${isEs ? "Escuchar" : "Hear step"} ${idx + 1}</span></button>
              </li>`;
          })
          .join("");
        host.innerHTML = `
          ${
            weLines.length
              ? `${weDo.title ? `<p class="vl-lead"><strong>${escHtml(isEs && weDo.titleEs ? weDo.titleEs : weDo.title)}</strong></p>` : ""}
          <ol class="vl-solve-steps">${guided}</ol>
          <div class="vl-pace no-print">
            <button type="button" class="vl-pace-next">${isEs ? "Muestra el siguiente paso" : "Show the next step"} ▸ <span class="vl-pace-count"></span></button>
            <button type="button" class="vl-pace-all">${isEs ? "Mostrar todos" : "Show all steps"}</button>
          </div>`
              : ""
          }
          ${
            misconception
              ? `<div class="vl-misconception-card">
                   <span class="vl-misconception-label"><span>⚠️</span> <span>${isEs ? "Fíjate — error común" : "Notice — the common mistake"}</span></span>
                   <p class="vl-misconception-text">${renderMathText(isEs ? misconception.es : misconception.en)}</p>
                 </div>`
              : ""
          }`;
        speakButtonsIn(host);
        wirePaced(host, null);
      },
    });
  }

  // ⑤ Quick Check — did the teaching land? One small question with immediate
  // feedback, then talk it through and rate your confidence.
  steps.push({
    icon: "✅",
    label: isEs ? "Comprobación rápida" : "Quick Check",
    sub: isEs ? "¿Lo entendiste? Demuéstralo" : "Did you get it? Prove it to yourself",
    build(host) {
      if (tryIt) {
        const tryItCard = document.createElement("div");
        tryItCard.className = "vl-tryit-card";
        tryItCard.innerHTML = `
          <div class="vl-tryit-head">
            <div class="vl-tryit-title"><span>✏️ ${isEs ? "¡Pruébalo!" : "Try it!"}</span></div>
          </div>
          <div class="vl-tryit-question">${renderMathText(isEs ? tryIt.questionEs : tryIt.question)}</div>
          <div class="vl-tryit-opts">
            ${tryIt.options
              .map(
                (opt, idx) => `
              <button type="button" class="vl-tryit-opt" data-correct="${opt.correct}" data-explain="${escHtml(opt.explain)}">
                <span>${["A", "B", "C"][idx] || "•"}. ${renderMathText(opt.text)}</span>
              </button>`,
              )
              .join("")}
          </div>
          <div class="vl-tryit-feedback" role="status" style="display:none;"></div>`;

        const tryOpts = /** @type {NodeListOf<HTMLButtonElement>} */ (
          tryItCard.querySelectorAll(".vl-tryit-opt")
        );
        const tryFb = /** @type {HTMLElement} */ (tryItCard.querySelector(".vl-tryit-feedback"));
        tryOpts.forEach((btn) => {
          btn.addEventListener("click", () => {
            const isCorrect = btn.dataset.correct === "true";
            const explain = btn.dataset.explain || "";
            tryOpts.forEach((b) => b.classList.remove("vl-opt-right", "vl-opt-wrong"));
            btn.classList.add(isCorrect ? "vl-opt-right" : "vl-opt-wrong");
            tryFb.classList.toggle("vl-fb-right", isCorrect);
            tryFb.classList.toggle("vl-fb-wrong", !isCorrect);
            tryFb.textContent = `${isCorrect ? "🎉" : "💡"} ${explain}`;
            tryFb.style.display = "block";
            speakText(explain, isEs ? "es-US" : "en-US");
          });
        });
        host.append(tryItCard);
      }

      // Turn & Talk — about THE PROBLEM DIRECTLY ABOVE IT.
      //
      // This card sits under the Quick Check problem, and it used to ask the
      // lesson-level `config.turnAndTalk[0].question` — a prompt written for the
      // lesson as a whole, with no connection to the problem a student had just
      // answered. Two partners would be looking at one problem and talking about
      // something else (Joel, 2026-08-26).
      //
      // When there is a problem above, the prompt is about that problem and the
      // problem is quoted in the card so both partners can see what "it" means.
      // The lesson-level prompt is still the fallback, and it is still rendered
      // in full by the lesson's own Turn & Talk phase — nothing is lost here.
      const turnAndTalkData = (Array.isArray(config.turnAndTalk) && config.turnAndTalk[0]) || {};
      let currentLangEs = isEs;
      const aboveEn = tryIt ? String(tryIt.question || "") : "";
      const aboveEs = tryIt ? String(tryIt.questionEs || tryIt.question || "") : "";
      const defaultQuestionEn = tryIt
        ? "Look at the problem above. Tell your partner which answer you chose and how you decided — then, if you chose different answers, work out together which one is right and why."
        : turnAndTalkData.question ||
          "Turn and talk with your partner: which step could you teach to someone else, and which step is still fuzzy?";
      const defaultQuestionEs = tryIt
        ? "Mira el problema de arriba. Dile a tu compañero qué respuesta escogiste y cómo lo decidiste — y si escogieron respuestas distintas, decidan juntos cuál es la correcta y por qué."
        : turnAndTalkData.questionEs ||
          "Habla con tu compañero: ¿qué paso podrías enseñar a otra persona y cuál todavía es confuso?";
      const authoredStems = Array.isArray(turnAndTalkData.stems) ? turnAndTalkData.stems : [];
      const stemText = (stem, lang) => (typeof stem === "string" ? stem : stem?.[lang]);
      const authoredEn = authoredStems.map((st) => stemText(st, "en")).filter(Boolean);
      const authoredEs = authoredStems.map((st) => stemText(st, "es")).filter(Boolean);
      // Starters that fit the prompt: about the answer when there is a problem
      // above, about the steps when there is not.
      const startersEn = tryIt
        ? [
            "I chose ______ because ______.",
            "I can prove it by ______.",
            "You chose ______ — show me how you got it.",
          ]
        : authoredEn.length
          ? authoredEn
          : ["I noticed that ______.", "The most important step is ______ because ______."];
      const startersEs = tryIt
        ? [
            "Escogí ______ porque ______.",
            "Lo puedo comprobar así: ______.",
            "Tú escogiste ______ — muéstrame cómo lo obtuviste.",
          ]
        : authoredEs.length
          ? authoredEs
          : ["Noté que ______.", "El paso más importante es ______ porque ______."];

      const ttContainer = document.createElement("div");
      ttContainer.className = "vl-turntalk-card";
      const renderTurnAndTalk = () => {
        const qText = currentLangEs ? defaultQuestionEs : defaultQuestionEn;
        const above = currentLangEs ? aboveEs : aboveEn;
        const starters = currentLangEs ? startersEs : startersEn;
        ttContainer.innerHTML = `
          <div class="vl-turntalk-head">
            <div class="vl-turntalk-title"><span>🗣️ ${currentLangEs ? "Habla con tu Compañero" : "Turn and Talk with Your Partner"}</span></div>
            <div class="vl-turntalk-controls">
              <button type="button" class="vl-tt-btn" id="ttListenBtn">🔊 ${currentLangEs ? "Escuchar" : "Listen"}</button>
              <button type="button" class="vl-tt-btn" id="ttLangBtn">${currentLangEs ? "🇺🇸 English" : "🇲🇽 Español"}</button>
            </div>
          </div>
          ${
            above
              ? `<div class="vl-turntalk-context">${currentLangEs ? "Sobre el problema de arriba" : "About the problem above"}: <em>${renderMathText(above)}</em></div>`
              : ""
          }
          <div class="vl-turntalk-question">"${escHtml(qText)}"</div>
          <div class="vl-starters-label">${currentLangEs ? "💬 Frases de Inicio (Toca para escuchar):" : "💬 Sentence Starters (Tap to speak & practice):"}</div>
          <div class="vl-starters-grid">
            ${starters
              .map(
                (st, idx) => `
              <div class="vl-starter-chip" data-idx="${idx}" tabindex="0" role="button">
                <span>💬</span>
                <span>"${escHtml(st)}"</span>
              </div>`,
              )
              .join("")}
          </div>`;
        ttContainer.querySelector("#ttLangBtn").addEventListener("click", () => {
          currentLangEs = !currentLangEs;
          renderTurnAndTalk();
        });
        ttContainer.querySelector("#ttListenBtn").addEventListener("click", () => {
          speakText(qText, currentLangEs ? "es-US" : "en-US");
        });
        const starterChips = /** @type {NodeListOf<HTMLElement>} */ (
          ttContainer.querySelectorAll(".vl-starter-chip")
        );
        starterChips.forEach((chip) => {
          const speakChip = () => {
            ttContainer
              .querySelectorAll(".vl-starter-chip")
              .forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            speakText(starters[Number(chip.dataset.idx)], currentLangEs ? "es-US" : "en-US");
          };
          chip.addEventListener("click", speakChip);
          chip.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              speakChip();
            }
          });
        });
      };
      renderTurnAndTalk();
      host.append(ttContainer);

      // Confidence self-check — routes low confidence back to the steps.
      const confWidget = document.createElement("div");
      confWidget.className = "vl-confidence-widget";
      confWidget.innerHTML = `
        <div class="vl-conf-title">🎯 ${isEs ? "¿Qué tan seguro te sientes?" : "How confident do you feel right now?"}</div>
        <div class="vl-conf-options">
          <button type="button" class="vl-conf-btn" data-level="3"><span>🤩</span> <span>${isEs ? "¡Lo Tengo!" : "Got It! Ready!"}</span></button>
          <button type="button" class="vl-conf-btn" data-level="2"><span>🤔</span> <span>${isEs ? "Casi Listo" : "Almost There"}</span></button>
          <button type="button" class="vl-conf-btn" data-level="1"><span>🙋</span> <span>${isEs ? "Necesito Práctica" : "Need Practice"}</span></button>
        </div>
        <div class="vl-conf-feedback" role="status" style="display:none;"></div>`;
      const confButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (
        confWidget.querySelectorAll(".vl-conf-btn")
      );
      const confFb = /** @type {HTMLElement} */ (confWidget.querySelector(".vl-conf-feedback"));
      confButtons.forEach((b) => {
        b.addEventListener("click", () => {
          confButtons.forEach((x) => x.classList.remove("vl-conf-active"));
          b.classList.add("vl-conf-active");
          const lvl = b.dataset.level;
          let msg;
          if (lvl === "3") {
            msg = isEs
              ? "🌟 ¡Excelente! Estás listo para los problemas de práctica."
              : "🌟 Awesome! You are ready to tackle the practice problems.";
          } else if (lvl === "2") {
            msg = isEs
              ? "💡 ¡Buen esfuerzo! Vuelve a 'Mírame resolverlo' y repasa los pasos."
              : "💡 Great effort! Step back to Watch Me Solve It and re-read the moves.";
          } else {
            msg = isEs
              ? "🤝 ¡Está bien! Repasa los pasos y habla con un compañero."
              : "🤝 That's okay! Walk back through the steps and talk with your partner.";
          }
          confFb.textContent = msg;
          confFb.style.display = "block";
          speakText(msg, isEs ? "es-US" : "en-US");
        });
      });
      host.append(confWidget);

      // The step's own way forward: finish Learn It and head into the lesson.
      const actions = document.createElement("div");
      actions.className = "vl-actions";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-primary btn-lg vl-continue-btn";
      btn.innerHTML = `<span>${
        isEs
          ? "¡He aprendido el concepto — a practicar! ✏️ →"
          : "I've learned the concept — let's practice! ✏️ →"
      }</span>`;
      btn.addEventListener("click", () => {
        try {
          if (state) state.set({ notesVisited: true });
        } catch (_) {}
        onComplete?.();
      });
      actions.append(btn);
      host.append(actions);
    },
  });

  // ⑥ Apply It — today's actual problem (scenario + Show Your Work), restored
  // from the Launch move-out. Built lazily on first visit so its heavier
  // pieces (Reveal slides, saved-work scaffold) only render when reached.
  if (typeof renderExtras === "function") {
    steps.push({
      icon: "🌍",
      label: isEs ? "Aplícalo" : "Apply It",
      sub: isEs ? "Usa la matemática en el problema de hoy" : "Use the math on today's problem",
      build() {},
      onFirstShow(host) {
        renderExtras(host);
      },
    });
  }

  // ── Stepper shell: rail + one visible step + back/next ────────────────────
  const stepper = document.createElement("div");
  stepper.className = "vl-stepper";

  const rail = document.createElement("nav");
  rail.className = "vl-rail no-print";
  rail.setAttribute("aria-label", isEs ? "Pasos de Aprende" : "Learn It steps");
  rail.innerHTML = steps
    .map(
      (s, i) => `
    <button type="button" class="vl-rail-btn" data-step="${i}">
      <span class="vl-rail-num" aria-hidden="true">${i + 1}</span>
      <span class="vl-rail-label">${s.icon} ${escHtml(s.label)}</span>
    </button>`,
    )
    .join("");
  stepper.append(rail);

  const sections = steps.map((s, i) => {
    const section = document.createElement("section");
    section.className = "vl-step";
    section.setAttribute("aria-labelledby", `vl-step-h-${i}`);
    section.innerHTML = `
      <header class="vl-step-head">
        <p class="vl-step-kicker">${isEs ? "Paso" : "Step"} ${i + 1} ${isEs ? "de" : "of"} ${steps.length}</p>
        <h3 class="vl-step-title" id="vl-step-h-${i}" tabindex="-1">${s.icon} ${escHtml(s.label)}</h3>
        <p class="vl-step-sub">${escHtml(s.sub)}</p>
      </header>
      <div class="vl-step-body"></div>
      <div class="vl-stepnav no-print">
        <button type="button" class="vl-back-btn"${i === 0 ? " hidden" : ""}>‹ ${isEs ? "Atrás" : "Back"}</button>
        ${
          i < steps.length - 1
            ? `<button type="button" class="vl-next-btn">${isEs ? "Siguiente" : "Next"}: ${steps[i + 1].icon} ${escHtml(steps[i + 1].label)} ›</button>`
            : ""
        }
      </div>`;
    const body = /** @type {HTMLElement} */ (section.querySelector(".vl-step-body"));
    s.build(body);
    if (vocabList.length) {
      try {
        underlineVocabTerms(body, vocabList);
      } catch (_) {}
    }
    stepper.append(section);
    return section;
  });

  const railBtns = /** @type {NodeListOf<HTMLButtonElement>} */ (
    rail.querySelectorAll(".vl-rail-btn")
  );
  const firstShown = new Set();
  let activeIndex = -1;
  const activate = (index, { focus = true } = {}) => {
    const next = Math.max(0, Math.min(steps.length - 1, index));
    if (next === activeIndex) return;
    activeIndex = next;
    sections.forEach((sec, i) => sec.classList.toggle("vl-step-active", i === next));
    railBtns.forEach((b, i) => {
      if (i === next) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
      b.classList.toggle("vl-rail-active", i === next);
      b.classList.toggle("vl-rail-done", i < next);
    });
    if (!firstShown.has(next)) {
      firstShown.add(next);
      const body = /** @type {HTMLElement} */ (sections[next].querySelector(".vl-step-body"));
      steps[next].onFirstShow?.(body);
    }
    if (focus) {
      wrap.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      const title = /** @type {HTMLElement|null} */ (
        sections[next].querySelector(".vl-step-title")
      );
      title?.focus?.({ preventScroll: true });
    }
  };

  railBtns.forEach((b) => {
    b.addEventListener("click", () => activate(Number(b.dataset.step)));
  });
  sections.forEach((sec, i) => {
    sec.querySelector(".vl-back-btn")?.addEventListener("click", () => activate(i - 1));
    sec.querySelector(".vl-next-btn")?.addEventListener("click", () => activate(i + 1));
  });

  wrap.append(stepper);
  container.append(wrap);
  activate(0, { focus: false });
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

export { resolveInteractiveToolForLesson };
