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

import { speakText } from "../core/speech-voice.js";

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
      <div style="background: #0f172a; padding: 20px; border-radius: 24px; border: 2.5px solid #38bdf8; box-shadow: 0 25px 60px rgba(0,0,0,0.75);">
        <img src="${imgSrc}" style="max-width: 100%; max-height: 68vh; border-radius: 14px; background: white; padding: 14px; display: inline-block;" />
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
 * Comprehensive Interactive Math Tool Resolver.
 * Uses the lesson's standard code (most reliable) first, then falls back to
 * regex word-boundary matching on the title/objective text. Every match uses
 * \b word boundaries to prevent false positives ("means" ≠ "mean", etc.).
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

  const text =
    `${cfg.title || ""} ${cfg.standard || ""} ${cfg.contentObjective || ""} ${cfg.objective || ""}`.toLowerCase();

  // Helper: word-boundary test (prevents "means" matching "mean", etc.)
  const wb = (pattern) => new RegExp(`\\b(?:${pattern})\\b`, "i").test(text);

  // ── 1. Standard-based classification (most reliable) ──────────────────────
  const std = String(cfg.standard || "")
    .trim()
    .toUpperCase();

  // 6.NOS.1 — Fraction Division
  if (std === "6.NOS.1") {
    return {
      kind: "fraction-divide",
      dividend: "3/4",
      divisor: "1/2",
      label: "Interactive Fraction Division: Keep, Change, Flip!",
    };
  }
  // 6.NOS.2 — Long Division
  if (std === "6.NOS.2") {
    return {
      kind: "long-division-builder",
      label: "Interactive Long Division & Partial Quotients Lab",
    };
  }
  // 6.NOS.3 — Decimal Operations (refine by wording)
  if (std === "6.NOS.3") {
    if (wb("multiply|multiplication|product"))
      return { kind: "decimal-product", a: 4.5, b: 1.2, label: "Interactive Decimal Multiplication Tool" };
    if (wb("divide|division|quotient"))
      return { kind: "decimal-quotient", dividend: 18.9, divisor: 6.3, label: "Interactive Decimal Division Tool" };
    return { kind: "decimal-columns", op: "+", a: 3.4, b: 1.25, label: "Interactive Decimal Columns & Regrouping Tool" };
  }
  // 6.NOS.4 — Factors, GCF, LCM
  if (std === "6.NOS.4") {
    if (wb("least common multiple|LCM"))
      return {
        kind: "lcm-lab",
        num1: 6,
        num2: 8,
        label: "Interactive LCM Explorer: Tap shared multiples to find the LCM!",
      };
    if (wb("greatest common factor|GCF"))
      return {
        kind: "factor-tree-lab",
        number: 48,
        label: "Interactive GCF & Factor Tree Explorer",
      };
    return {
      kind: "factor-tree-lab",
      number: 36,
      label: "Interactive Factor Tree Explorer: Build prime factorizations step-by-step!",
    };
  }
  // 6.NOS.6 — Coordinate Plane / Number Line
  if (std === "6.NOS.6") {
    if (wb("number line"))
      return { kind: "number-line-explorer", label: "Interactive Number Line Explorer" };
    return {
      kind: "coordinate-plane",
      points: [
        { x: 3, y: 4, label: "A" },
        { x: -2, y: 5, label: "B" },
      ],
      label: "Interactive Coordinate Plane Explorer",
    };
  }
  // 6.NOS.7 — Quadrants / Coordinate Plane
  if (std === "6.NOS.7") {
    return {
      kind: "coordinate-plane",
      points: [
        { x: 3, y: 4, label: "A" },
        { x: -2, y: -3, label: "B" },
      ],
      label: "Interactive Four-Quadrant Coordinate Plane Explorer",
    };
  }
  // 6.NOS.8 — Integers / Absolute Value
  if (std === "6.NOS.8") {
    return { kind: "number-line-explorer", label: "Interactive Absolute Value & Integer Explorer" };
  }
  // 6.NOS.9 — Distance
  if (std === "6.NOS.9") {
    return {
      kind: "number-line-explorer",
      label: "Interactive Distance on a Number Line Explorer",
    };
  }
  // 6.AT.1 — Ratios
  if (std === "6.AT.1") {
    return {
      kind: "tape-diagram",
      // tape-diagram-lab reads `rows: [{ label, parts: [{value}] }]`. The
      // parts/labels pair below was a shape no component ever consumed, so the
      // lab counted zero parts and drew nothing.
      rows: [
        { label: "Quantity A", parts: [{ value: 1 }, { value: 1 }, { value: 1 }] },
        { label: "Quantity B", parts: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }] },
      ],
      label: "Interactive Tape Diagram Explorer: Count and compare equal parts!",
    };
  }
  // 6.AT.2 — Rates
  if (std === "6.AT.2") {
    return {
      kind: "unit-rate-builder",
      label:
        "Interactive Unit Rate Builder: Calculate 'per 1' unit rates live on double number lines!",
    };
  }
  // 6.AT.3, 6.AT.3a — Ratio Tables / Rates
  if (std === "6.AT.3" || std === "6.AT.3A") {
    if (wb("unit rate"))
      return { kind: "unit-rate-builder", label: "Interactive Unit Rate Builder" };
    return {
      kind: "ratio-table-builder",
      label:
        "Interactive Ratio Table Explorer: Scale quantities up and down to find equivalent ratios!",
    };
  }
  // 6.AT.3c — Measurement Conversions
  if (std === "6.AT.3C") {
    return { kind: "ratio-table-builder", label: "Interactive Measurement Conversion Ratio Table" };
  }
  // 6.AT.4 — Percents
  if (std === "6.AT.4") {
    if (wb("percent of|percentage of"))
      return { kind: "percent-builder", label: "Interactive Percent of a Quantity Builder" };
    return { kind: "percent-grid", percent: 45, label: "Interactive Percent Grid Tool" };
  }
  // 6.AT.5 — Exponents
  if (std === "6.AT.5") {
    return {
      kind: "power-builder",
      base: 2,
      exponent: 4,
      label: "Interactive Powers & Exponents Builder",
    };
  }
  // 6.AT.6a, 6.AT.6c, 6.AT.7 — Expressions
  if (std === "6.AT.6A" || std === "6.AT.6C" || std === "6.AT.7") {
    if (wb("distributive"))
      return {
        kind: "distributive-builder",
        a: 3,
        b: "x",
        c: 4,
        label: "Interactive Distributive Property Area Model",
      };
    if (wb("like terms|combine"))
      return { kind: "combine-like-terms", expr: "5x + 3 + 2x - 1", label: "Interactive Combine Like Terms Lab" };
    return { kind: "step-solver", label: "Interactive Expression Evaluator & Step Solver" };
  }
  // 6.AT.8 — Equations / Inequalities
  if (std === "6.AT.8") {
    if (wb("inequalit"))
      return {
        kind: "number-line",
        min: -5,
        max: 5,
        step: 1,
        problems: [{ inequality: "x > 2", boundary: 2, circleType: "open", direction: "right" }],
        label: "Interactive Inequality Number Line",
      };
    return {
      kind: "equation-balance-lab",
      label: "Interactive Equation Pan Balance: Keep both sides equal!",
    };
  }
  // 6.AT.9 — Inequalities
  if (std === "6.AT.9") {
    return {
      kind: "number-line",
      min: -5,
      max: 5,
      step: 1,
      problems: [{ inequality: "x > 2", boundary: 2, circleType: "open", direction: "right" }],
      label: "Interactive Inequality Number Line",
    };
  }
  // 6.DS.1 — Statistical Questions
  if (std === "6.DS.1") {
    return { kind: "stats-data-lab", label: "Interactive Statistics & Data Set Explorer" };
  }
  // 6.DS.3 — Distributions
  if (std === "6.DS.3") {
    return { kind: "stats-data-lab", label: "Interactive Distribution Shape Explorer" };
  }
  // 6.DS.4 — Mean, Median, Mode
  if (std === "6.DS.4") {
    return { kind: "stats-data-lab", label: "Interactive Mean, Median & Mode Explorer" };
  }
  // 6.DS.5 — Box Plots / Histograms
  if (std === "6.DS.5") {
    if (wb("histogram"))
      return { kind: "histogram-builder", label: "Interactive Histogram Bar Builder" };
    return {
      kind: "box-plot-builder",
      label: "Interactive Box Plot & Five-Number Summary Builder",
    };
  }
  // 6.DS.6c, 6.DS.6d — MAD / Center
  if (std === "6.DS.6C" || std === "6.DS.6D") {
    return { kind: "stats-data-lab", label: "Interactive Mean Absolute Deviation Explorer" };
  }
  // 6.GR.1 — Area
  if (std === "6.GR.1") {
    const shape = wb("triangle") ? "triangle" : wb("trapezoid") ? "trapezoid" : "parallelogram";
    return { kind: "area-morph", shape, label: "Interactive Area Morph & Transformation Explorer" };
  }
  // 6.GR.2, 6.GR.4 — Solids / Nets
  if (std === "6.GR.2" || std === "6.GR.4") {
    if (wb("net|fold|surface area"))
      return {
        kind: "net-folder",
        solid: "cube",
        label: "Interactive 3D Net Folder: Fold 2D nets into 3D solids!",
      };
    return {
      kind: "solid-3d",
      shape: wb("pyramid") ? "triangular-pyramid" : "cube",
      label: "Interactive 3D Solid & Net Explorer",
    };
  }

  // Also handle RP standard codes (alternate standard labels)
  if (/^6\.RP/i.test(std)) {
    if (wb("ratio table|equivalent ratio"))
      return { kind: "ratio-table-builder", label: "Interactive Ratio Table Explorer" };
    if (wb("unit rate"))
      return { kind: "unit-rate-builder", label: "Interactive Unit Rate Builder" };
    if (wb("percent"))
      return { kind: "percent-grid", percent: 45, label: "Interactive Percent Grid Tool" };
    return {
      kind: "tape-diagram",
      // tape-diagram-lab reads `rows: [{ label, parts: [{value}] }]`. The
      // parts/labels pair below was a shape no component ever consumed, so the
      // lab counted zero parts and drew nothing.
      rows: [
        { label: "Quantity A", parts: [{ value: 1 }, { value: 1 }, { value: 1 }] },
        { label: "Quantity B", parts: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }] },
      ],
      label: "Interactive Tape Diagram Explorer",
    };
  }
  if (/^6\.EE/i.test(std)) {
    if (wb("inequalit"))
      return {
        kind: "number-line",
        min: -5,
        max: 5,
        step: 1,
        problems: [{ inequality: "x > 2", boundary: 2, circleType: "open", direction: "right" }],
        label: "Interactive Inequality Number Line",
      };
    if (wb("equation"))
      return { kind: "equation-balance-lab", label: "Interactive Equation Pan Balance" };
    return { kind: "step-solver", label: "Interactive Expression Evaluator & Step Solver" };
  }
  if (/^6\.NS/i.test(std)) {
    if (wb("fraction|divid"))
      return {
        kind: "fraction-divide",
        dividend: "3/4",
        divisor: "1/2",
        label: "Interactive Fraction Division",
      };
    if (wb("decimal"))
      return { kind: "decimal-columns", op: "+", a: 3.4, b: 1.25, label: "Interactive Decimal Columns Tool" };
    if (wb("factor|GCF|LCM"))
      return { kind: "factor-tree-lab", number: 36, label: "Interactive Factor Tree Explorer" };
    if (wb("coordinate"))
      return {
        kind: "coordinate-plane",
        points: [{ x: 3, y: 4, label: "A" }],
        label: "Interactive Coordinate Plane Explorer",
      };
    return { kind: "number-line-explorer", label: "Interactive Number Line Explorer" };
  }
  if (/^6\.SP/i.test(std)) {
    if (wb("box plot")) return { kind: "box-plot-builder", label: "Interactive Box Plot Builder" };
    if (wb("histogram"))
      return { kind: "histogram-builder", label: "Interactive Histogram Builder" };
    return { kind: "stats-data-lab", label: "Interactive Statistics Explorer" };
  }
  if (/^6\.G/i.test(std)) {
    if (wb("area"))
      return { kind: "area-morph", shape: "parallelogram", label: "Interactive Area Explorer" };
    return { kind: "solid-3d", shape: "cube", label: "Interactive 3D Solid Explorer" };
  }

  // ── 2. Wording-based fallback (regex word boundaries) ─────────────────────
  // Most specific phrases first, most general last.

  if (wb("ratio table|equivalent ratio|table of ratios")) {
    return { kind: "ratio-table-builder", label: "Interactive Ratio Table Explorer" };
  }
  if (wb("unit rate|constant of proportionality")) {
    return { kind: "unit-rate-builder", label: "Interactive Unit Rate Builder" };
  }
  if (wb("tape diagram")) {
    return {
      kind: "tape-diagram",
      // tape-diagram-lab reads `rows: [{ label, parts: [{value}] }]`. The
      // parts/labels pair below was a shape no component ever consumed, so the
      // lab counted zero parts and drew nothing.
      rows: [
        { label: "Quantity A", parts: [{ value: 1 }, { value: 1 }, { value: 1 }] },
        { label: "Quantity B", parts: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }] },
      ],
      label: "Interactive Tape Diagram Explorer",
    };
  }
  if (wb("factor tree|prime factorization")) {
    return { kind: "factor-tree-lab", number: 36, label: "Interactive Factor Tree Explorer" };
  }
  if (wb("least common multiple") || /\bLCM\b/.test(text)) {
    return { kind: "lcm-lab", num1: 6, num2: 8, label: "Interactive LCM Explorer" };
  }
  if (wb("greatest common factor") || /\bGCF\b/.test(text)) {
    return { kind: "factor-tree-lab", number: 48, label: "Interactive GCF & Factor Tree Explorer" };
  }
  if (wb("exponents?|powers of")) {
    return {
      kind: "power-builder",
      base: 2,
      exponent: 4,
      label: "Interactive Powers & Exponents Builder",
    };
  }
  if (wb("divid\\w* fractions?|fraction division|divid\\w* by a fraction")) {
    return {
      kind: "fraction-divide",
      dividend: "3/4",
      divisor: "1/2",
      label: "Interactive Fraction Division: Keep, Change, Flip!",
    };
  }
  if (wb("long division|partial quotients?")) {
    return { kind: "long-division-builder", label: "Interactive Long Division Lab" };
  }
  if (wb("divid\\w* decimals?|decimal division")) {
    return { kind: "decimal-quotient", dividend: 18.9, divisor: 6.3, label: "Interactive Decimal Division Tool" };
  }
  if (wb("multiply\\w* decimals?|decimal multiplication")) {
    return { kind: "decimal-product", a: 4.5, b: 1.2, label: "Interactive Decimal Multiplication Tool" };
  }
  if (wb("add\\w* decimals?|subtract\\w* decimals?|decimal")) {
    return { kind: "decimal-columns", op: "+", a: 3.4, b: 1.25, label: "Interactive Decimal Columns & Regrouping Tool" };
  }
  if (wb("percent of|percentage of")) {
    return { kind: "percent-builder", label: "Interactive Percent of a Quantity Builder" };
  }
  if (wb("percents?|percentage")) {
    return { kind: "percent-grid", percent: 45, label: "Interactive Percent Grid Tool" };
  }
  if (wb("ratios?")) {
    return {
      kind: "tape-diagram",
      // tape-diagram-lab reads `rows: [{ label, parts: [{value}] }]`. The
      // parts/labels pair below was a shape no component ever consumed, so the
      // lab counted zero parts and drew nothing.
      rows: [
        { label: "Quantity A", parts: [{ value: 1 }, { value: 1 }, { value: 1 }] },
        { label: "Quantity B", parts: [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }] },
      ],
      label: "Interactive Tape Diagram Explorer",
    };
  }
  if (wb("distributive property")) {
    return {
      kind: "distributive-builder",
      a: 3,
      b: "x",
      c: 4,
      label: "Interactive Distributive Property Area Model",
    };
  }
  if (wb("combine like terms|like terms")) {
    return { kind: "combine-like-terms", expr: "5x + 3 + 2x - 1", label: "Interactive Combine Like Terms Lab" };
  }
  if (wb("equations?") && wb("solve|one-step|two-step|balance")) {
    return { kind: "equation-balance-lab", label: "Interactive Equation Pan Balance" };
  }
  if (wb("inequalit\\w*")) {
    return {
      kind: "number-line",
      min: -5,
      max: 5,
      step: 1,
      problems: [{ inequality: "x > 2", boundary: 2, circleType: "open", direction: "right" }],
      label: "Interactive Inequality Number Line",
    };
  }
  if (wb("absolute value")) {
    return { kind: "number-line-explorer", label: "Interactive Absolute Value Explorer" };
  }
  if (wb("coordinate plane|ordered pairs?")) {
    return {
      kind: "coordinate-plane",
      points: [
        { x: 3, y: 4, label: "A" },
        { x: -2, y: 5, label: "B" },
      ],
      label: "Interactive Coordinate Plane Explorer",
    };
  }
  if (wb("number line")) {
    return { kind: "number-line-explorer", label: "Interactive Number Line Explorer" };
  }
  if (wb("area of|parallelogram|trapezoid")) {
    const shape = wb("triangle") ? "triangle" : wb("trapezoid") ? "trapezoid" : "parallelogram";
    return { kind: "area-morph", shape, label: "Interactive Area Explorer" };
  }
  if (wb("nets?|surface area") && !wb("internet|planet")) {
    return { kind: "net-folder", solid: "cube", label: "Interactive 3D Net Folder" };
  }
  if (wb("prisms?|pyramids?|volume")) {
    return {
      kind: "solid-3d",
      shape: wb("pyramid") ? "triangular-pyramid" : "cube",
      label: "Interactive 3D Solid Explorer",
    };
  }
  if (wb("cross sections?")) {
    return { kind: "cross-section", label: "Interactive 3D Cross-Section Slicing Tool" };
  }
  // Statistics: use \bmean\b (whole word only — never matches "means")
  if (/\bmean\b/.test(text) || wb("median|data sets?|variability") || /\bMAD\b/.test(text)) {
    return { kind: "stats-data-lab", label: "Interactive Statistics & Live Data Explorer" };
  }
  if (wb("box plots?|quartiles?")) {
    return { kind: "box-plot-builder", label: "Interactive Box Plot Builder" };
  }
  if (wb("histograms?")) {
    return { kind: "histogram-builder", label: "Interactive Histogram Builder" };
  }
  if (wb("dot plots?")) {
    return { kind: "dot-plot", label: "Interactive Dot Plot Explorer" };
  }
  if (wb("fractions?")) {
    return {
      kind: "fraction-divide",
      dividend: "3/4",
      divisor: "1/2",
      label: "Interactive Fraction Division Tool",
    };
  }
  if (wb("equations?")) {
    return { kind: "equation-balance-lab", label: "Interactive Equation Pan Balance" };
  }
  if (wb("expressions?|variables?")) {
    return { kind: "step-solver", label: "Interactive Expression Step Solver" };
  }

  // Default fallback interactive manipulative for any math lesson:
  return {
    kind: "step-solver",
    label: "Interactive Math Step Solver & Equivalence Checker",
  };
}

function resolveLessonMisconception(config) {
  const cfg = config || {};
  if (cfg.misconception) return cfg.misconception;
  const text =
    `${cfg.title || ""} ${cfg.standard || ""} ${cfg.contentObjective || ""}`.toLowerCase();

  if (text.includes("factor tree") || text.includes("prime factor")) {
    return {
      en: "Don't stop factoring until all numbers at the bottom of the tree are prime numbers (numbers like 2, 3, 5, 7)! Composite numbers like 4 or 6 must be factored further.",
      es: "¡No pares de factorizar hasta que todos los números en la parte inferior del árbol sean números primos (como 2, 3, 5, 7)! Los números compuestos como 4 o 6 deben factorizarse más.",
    };
  }
  if (text.includes("ratio") || text.includes("rate")) {
    return {
      en: "Keep the order of quantities consistent! If the ratio compares apples to oranges (3:5), do not mix up the order when scaling up equivalent ratios.",
      es: "¡Mantén constante el orden de las cantidades! Si la razón compara manzanas con naranjas (3:5), no confundas el orden al calcular razones equivalentes.",
    };
  }
  if (text.includes("fraction") && text.includes("divide")) {
    return {
      en: "Remember to Keep the first fraction, Change division to multiplication, and Flip the second fraction (reciprocal)! Do not flip the first fraction.",
      es: "¡Recuerda Mantener la primera fracción, Cambiar división a multiplicación y Voltear la segunda fracción! No voltees la primera fracción.",
    };
  }
  if (text.includes("decimal")) {
    return {
      en: "Always align the decimal points vertically before adding or subtracting decimals, so you are adding digits in the same place value!",
      es: "¡Siempre alinea los puntos decimales verticalmente antes de sumar o restar decimales para sumar dígitos en el mismo valor posicional!",
    };
  }
  if (text.includes("area")) {
    return {
      en: "When finding the area of a triangle or parallelogram, the height MUST be perpendicular (forms a 90° right angle) to the base. Do not use the slanted side length!",
      es: "Al calcular el área de un triángulo o paralelogramo, la altura DEBE ser perpendicular (formar un ángulo recto de 90°) a la base. ¡No uses el lado inclinado!",
    };
  }
  return {
    en: "Double check your math steps in order! Make sure to verify your solution by substituting your answer back into the original problem.",
    es: "¡Verifica tus pasos matemáticos en orden! Asegúrate de comprobar tu solución probando tu respuesta en el problema original.",
  };
}

function resolveTryItChallenge(config) {
  const cfg = config || {};
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
  return {
    question: "Which statement best describes how to check if your math reasoning is correct?",
    questionEs:
      "¿Qué afirmación describe mejor cómo comprobar si tu razonamiento matemático es correcto?",
    options: [
      {
        text: "Explain each step and prove why the visual model matches your math",
        correct: true,
        explain: "Exactly! Explaining each step and connecting to a visual model proves accuracy!",
      },
      {
        text: "Only write down the final number without showing steps",
        correct: false,
        explain: "Showing steps and explaining reasoning is essential for deep math learning.",
      },
      {
        text: "Guess the answer without checking the math model",
        correct: false,
        explain: "Always verify your answer using the visual representation.",
      },
    ],
  };
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
      margin: 0 0 16px;
      line-height: 1.6;
    }
    .vl-hero-speak-btn {
      padding: 8px 18px;
      border-radius: 999px;
      border: 1.5px solid rgba(255,255,255,0.35);
      background: rgba(255,255,255,0.18);
      color: #ffffff;
      font-weight: 800;
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
      font-weight: 900;
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
      font-weight: 750;
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
      font-weight: 900;
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
      font-weight: 750;
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

function seedVisualFromWorkedExample(iv, lines) {
  if (!iv || !iv.kind || !Array.isArray(lines) || !lines.length) return iv;
  const text = lines.join(" ");
  const num = "(\\d+(?:\\.\\d+)?)";
  const find = (opChars) => {
    const m = text.match(new RegExp(`${num}\\s*([${opChars}])\\s*${num}`));
    return m ? { a: Number(m[1]), op: m[2], b: Number(m[3]) } : null;
  };

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
  const { onComplete = () => {}, state = null } = options;
  injectVocabLearnStyles();
  container.innerHTML = "";

  const isEs = getPreferredLang() === "es";

  const wrap = document.createElement("div");
  wrap.className = "vl-container";

  const concept = config.conceptIntro || config.launch?.conceptIntro || {};
  const heading = concept.heading || config.contentObjective || `Understanding ${config.title}`;
  const intro = concept.intro || config.contentObjective || "";
  const keyIdea = concept.keyIdea || config.contentObjective || "";
  const iDo = concept.iDo || {};

  const misconception = resolveLessonMisconception(config);
  const tryIt = resolveTryItChallenge(config);

  // Top Header Banner with Full Audio Read-Aloud
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
    <button type="button" class="vl-hero-speak-btn" id="vlHeroSpeakBtn">
      🔊 ${isEs ? "Escuchar Concepto Completo" : "Listen to Concept Summary"}
    </button>
  `;

  hero.querySelector("#vlHeroSpeakBtn").addEventListener("click", () => {
    const fullText = `${config.title}. ${intro || keyIdea}`;
    speakText(fullText, isEs ? "es-US" : "en-US");
  });

  wrap.append(hero);

  const visuals = resolveObjectiveVisuals(config);
  const ivConfig = seedVisualFromWorkedExample(
    resolveInteractiveToolForLesson(config),
    iDo.lines,
  );

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

    <!-- COMMON MATHEMATICAL MISCONCEPTION WARNING -->
    <div class="vl-misconception-card">
      <span class="vl-misconception-label">
        <span>⚠️</span> <span>${isEs ? "Atención: Error Común a Evitar" : "Watch Out: Common Math Pitfall"}</span>
      </span>
      <p class="vl-misconception-text">${renderMathText(isEs ? misconception.es : misconception.en)}</p>
    </div>

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

    <!-- WORKED EXAMPLE + THE TOOL THAT PRACTISES IT, SIDE BY SIDE -->
    <div class="vl-learn-pair">
      <!-- Watch me -->
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
      <!-- Now try that step here -->
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

    </div>
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

  // ─── MINI PRACTICE CHECKPOINT (TRY IT!) ─────────────────────────────────────
  const tryItCard = document.createElement("div");
  tryItCard.className = "vl-tryit-card";
  tryItCard.innerHTML = `
    <div class="vl-tryit-head">
      <div class="vl-tryit-title">
        <span>✏️ ${isEs ? "¡Pruébalo! Verificación Rápida de Práctica" : "Try It! Quick Concept Practice"}</span>
      </div>
    </div>
    <div style="font-size:1.12rem; font-weight:800; color:#0c4a6e; margin-bottom:16px;">
      "${escHtml(isEs ? tryIt.questionEs : tryIt.question)}"
    </div>
    <div style="display:flex; flex-direction:column; gap:12px;" class="vl-tryit-opts">
      ${tryIt.options
        .map(
          (opt, idx) => `
        <button type="button" class="vl-tryit-opt" data-correct="${opt.correct}" data-explain="${escHtml(opt.explain)}">
          <span>${idx === 0 ? "A" : idx === 1 ? "B" : "C"}. ${escHtml(opt.text)}</span>
        </button>
      `,
        )
        .join("")}
    </div>
    <div class="vl-tryit-feedback" style="margin-top:16px; padding:14px; border-radius:14px; font-weight:800; font-size:1rem; display:none;"></div>
  `;

  const tryOpts = /** @type {NodeListOf<HTMLButtonElement>} */ (
    tryItCard.querySelectorAll(".vl-tryit-opt")
  );
  const tryFb = /** @type {HTMLElement} */ (tryItCard.querySelector(".vl-tryit-feedback"));

  tryOpts.forEach((btn) => {
    btn.addEventListener("click", () => {
      const isCorrect = btn.dataset.correct === "true";
      const explain = btn.dataset.explain;

      tryOpts.forEach((b) => {
        b.style.background = "#ffffff";
        b.style.borderColor = "#bae6fd";
      });

      if (isCorrect) {
        btn.style.background = "#dcfce7";
        btn.style.borderColor = "#16a34a";
        tryFb.style.background = "#f0fdf4";
        tryFb.style.color = "#14532d";
        tryFb.style.border = "2px solid #22c55e";
        tryFb.textContent = `🎉 ${explain}`;
      } else {
        btn.style.background = "#fef2f2";
        btn.style.borderColor = "#ef4444";
        tryFb.style.background = "#fff1f2";
        tryFb.style.color = "#9f1239";
        tryFb.style.border = "2px solid #f43f5e";
        tryFb.textContent = `💡 ${explain}`;
      }
      tryFb.style.display = "block";
      speakText(explain, isEs ? "es-US" : "en-US");
    });
  });

  mainCard.append(tryItCard);

  // ─── BUILT-IN TURN AND TALK SECTION ─────────────────────────────────────────
  const turnAndTalkData = (Array.isArray(config.turnAndTalk) && config.turnAndTalk[0]) || {};
  let currentLangEs = isEs;

  const defaultQuestionEn =
    turnAndTalkData.question ||
    `Turn and talk with your partner: How does this math visual and example work? What step did you notice first?`;
  const defaultQuestionEs =
    turnAndTalkData.questionEs ||
    `Habla con tu compañero: ¿Cómo funciona este modelo visual y ejemplo? ¿Qué paso notaste primero?`;

  // 202 of 222 lesson configs author `turnAndTalk[].stems` — bilingual starters
  // written against THAT lesson's problem and visual. Reading them is the point:
  // the generic trio below talks about "the visual" and "Step 1" in the abstract,
  // so when it renders next to a specific figure the two disagree.
  const authoredStems = Array.isArray(turnAndTalkData.stems) ? turnAndTalkData.stems : [];
  const stemText = (stem, lang) => (typeof stem === "string" ? stem : stem?.[lang]);
  const authoredEn = authoredStems.map((st) => stemText(st, "en")).filter(Boolean);
  const authoredEs = authoredStems.map((st) => stemText(st, "es")).filter(Boolean);

  const startersEn = authoredEn.length
    ? authoredEn
    : [
        `Looking at the visual, I notice that ______ in Step 1.`,
        `This math model shows ______ because ______.`,
        `My partner and I agree that the key step is ______.`,
      ];
  const startersEs = authoredEs.length
    ? authoredEs
    : [
        `Mirando el modelo visual, noté que ______ en el Paso 1.`,
        `Este modelo matemático muestra ______ porque ______.`,
        `Mi compañero y yo estamos de acuerdo en que el paso clave es ______.`,
      ];

  const ttContainer = document.createElement("div");
  ttContainer.className = "vl-turntalk-card";

  function renderTurnAndTalk() {
    const qText = currentLangEs ? defaultQuestionEs : defaultQuestionEn;
    const starters = currentLangEs ? startersEs : startersEn;

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

    const starterChips = /** @type {NodeListOf<HTMLElement>} */ (
      ttContainer.querySelectorAll(".vl-starter-chip")
    );
    starterChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        ttContainer
          .querySelectorAll(".vl-starter-chip")
          .forEach((c) => c.classList.remove("active"));
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

  const confButtons = /** @type {NodeListOf<HTMLButtonElement>} */ (
    confWidget.querySelectorAll(".vl-conf-btn")
  );
  const confFb = /** @type {HTMLElement} */ (confWidget.querySelector(".vl-conf-feedback"));

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
    try {
      underlineVocabTerms(mainCard, vocabList);
    } catch (_) {}
  }

  // Bottom Continue Action Button
  const actions = document.createElement("div");
  actions.className = "vl-actions";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn-primary btn-lg vl-continue-btn";
  btn.innerHTML = `<span>${
    // Learn It hands off to Practice. The label used to say "let's explore",
    // which named a phase this button has never opened.
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
