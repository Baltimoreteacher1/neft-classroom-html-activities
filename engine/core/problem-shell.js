// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.

import { renderMathText } from "./math-typography.js";
import { renderConversionChip, hasConversionFacts } from "./conversion-chart.js";
import { renderToolChip } from "./tool-drawer.js";

const TYPE_LABELS = {
  "multiple-choice": "Multiple Choice",
  "drag-sort": "Drag & Sort",
  "matching-game": "Matching",
  matching: "Matching",
  "number-line": "Number Line",
  "fill-table": "Fill the Table",
  "coordinate-grid": "Coordinate Grid",
  "coordinate-plane": "Coordinate Plane",
  "open-response": "Written Response",
  "error-analysis": "Error Analysis",
  "bar-model": "Bar Model",
  "balance-scale": "Balance Scale",
  "algebra-tiles": "Algebra Tiles",
  "fraction-bars": "Fraction Bars",
  "net-folder": "Net & Fold",
};

export function problemTypeLabel(def = {}) {
  return TYPE_LABELS[def.type] || "Practice";
}

function detectConceptTool(stemText) {
  if (!stemText || typeof stemText !== "string") return null;
  const str = stemText.toLowerCase();

  if (str.includes("exponent") || str.includes("power") || str.includes("base") || str.includes("squared") || str.includes("cubed")) {
    return { kind: "power-builder", icon: "⚡", label: "Powers & Exponents" };
  }
  if (str.includes("factor tree") || str.includes("prime factor")) {
    return { kind: "factor-tree-lab", icon: "🌳", label: "Factor Tree Lab" };
  }
  if (str.includes("lcm") || str.includes("least common multiple")) {
    return { kind: "lcm-lab", icon: "🔢", label: "LCM Lab" };
  }
  if (str.includes("fraction") && (str.includes("divide") || str.includes("÷") || str.includes("kcf") || str.includes("reciprocal"))) {
    return { kind: "fraction-divide", icon: "🥞", label: "Divide Fractions Lab" };
  }
  if (str.includes("decimal") && (str.includes("multiply") || str.includes("product"))) {
    return { kind: "decimal-product", icon: "🔢", label: "Multiply Decimals Lab" };
  }
  if (str.includes("decimal") && (str.includes("divide") || str.includes("quotient"))) {
    return { kind: "decimal-quotient", icon: "🔢", label: "Divide Decimals Lab" };
  }
  if (str.includes("decimal") && (str.includes("add") || str.includes("subtract") || str.includes("column"))) {
    return { kind: "decimal-columns", icon: "🔢", label: "Decimal Column Lab" };
  }
  if ((str.includes("divide") || str.includes("quotient") || str.includes("long division")) && str.includes("remainder")) {
    return { kind: "long-division-builder", icon: "🧮", label: "Long Division Lab" };
  }
  if (str.includes("equation") || str.includes("balance scale")) {
    return { kind: "algebra-balance-scale", icon: "⚖️", label: "Balance Scale" };
  }
  if (str.includes("inequality") || str.includes("greater than") || str.includes("less than") || str.includes("≤") || str.includes("≥")) {
    return { kind: "neon-inequality", icon: "📈", label: "Inequality Lab" };
  }
  if (str.includes("surface area") || str.includes("net") || str.includes("prism")) {
    return { kind: "surface-area-packer", icon: "📦", label: "Surface Area Packer" };
  }
  if (str.includes("area of") || str.includes("parallelogram") || str.includes("trapezoid")) {
    return { kind: "area-morph", icon: "📐", label: "Area Lab" };
  }
  if (str.includes("coordinate") || str.includes("quadrant") || str.includes("ordered pair") || str.includes("x-axis")) {
    return { kind: "coordinate-navigator", icon: "📍", label: "Coordinate Navigator" };
  }
  if (str.includes("box plot") || str.includes("quartile") || str.includes("interquartile")) {
    return { kind: "box-plot-detective", icon: "📊", label: "Box Plot Detective" };
  }
  if (str.includes("histogram") || str.includes("frequency table")) {
    return { kind: "histogram-master-lab", icon: "📊", label: "Histogram Lab" };
  }
  if (str.includes("mean absolute deviation") || str.includes("mad")) {
    return { kind: "mad-balance-sandbox", icon: "⚖️", label: "MAD Balance Lab" };
  }
  return null;
}

/**
 * Create a premium problem card. Returns { card, body, coinSlot, setResult }.
 */
export function createProblemCard({ number, total, tier, typeLabel, stem, hasConversionChart } = {}) {
  const card = document.createElement("article");
  card.className = "problem-card";
  card.setAttribute("aria-label", `Problem ${number} of ${total}`);

  const header = document.createElement("div");
  header.className = "problem-header-row";

  const left = document.createElement("div");
  left.className = "problem-header-left";
  left.innerHTML = `
    <span class="problem-number-badge" aria-hidden="true">#${number}</span>
    <span class="problem-of-total">of ${total}</span>
  `;

  const right = document.createElement("div");
  right.className = "problem-header-right";

  if (tier) {
    const tierEl = document.createElement("span");
    tierEl.className = `problem-tier-badge tier-${tier}`;
    const tierNames = {
      level1: "Level 1",
      core: "On Level",
      level2: "Level 2",
    };
    tierEl.textContent = tierNames[tier] || tier;
    right.append(tierEl);
  }

  if (typeLabel) {
    const typeEl = document.createElement("span");
    typeEl.className = "problem-type-badge";
    typeEl.textContent = typeLabel;
    right.append(typeEl);
  }

  if (hasConversionChart || hasConversionFacts(stem)) {
    renderConversionChip(right, { label: "Conversion Chart", icon: "📋" });
  }

  const conceptTool = detectConceptTool(stem);
  if (conceptTool) {
    renderToolChip(right, conceptTool, { label: conceptTool.label, icon: conceptTool.icon });
  }

  const coinSlot = document.createElement("span");
  coinSlot.className = "problem-coin-slot";
  coinSlot.setAttribute("aria-hidden", "true");
  right.append(coinSlot);

  header.append(left, right);
  card.append(header);

  if (stem) {
    const stemEl = document.createElement("p");
    stemEl.className = "problem-stem";
    // Let students mark up the problem text (highlight / underline / bold).
    stemEl.setAttribute("data-annotate", "word-problem");
    stemEl.innerHTML = renderMathText(stem);
    card.append(stemEl);
  }

  const body = document.createElement("div");
  body.className = "problem-body";
  card.append(body);

  function setResult(kind) {
    card.classList.remove("problem-correct", "problem-incorrect", "problem-pending");
    if (kind === "correct") {
      card.classList.add("problem-correct");
      awardCoin(coinSlot);
    } else if (kind === "incorrect") {
      card.classList.add("problem-incorrect");
    }
  }

  return { card, body, coinSlot, setResult };
}

function awardCoin(slot) {
  if (!slot || slot.querySelector(".coin-earned")) return;
  const coin = document.createElement("span");
  coin.className = "coin-earned";
  coin.textContent = "🪙";
  coin.setAttribute("title", "+1 coin");
  slot.append(coin);
}
