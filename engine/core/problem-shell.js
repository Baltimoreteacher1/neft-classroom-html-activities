// Premium problem card shell — numbered badge, type pill, coin slot.
// Wraps any interactive component so practice feels like TPT homework.

import { renderMathText } from "./math-typography.js";

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

/**
 * Create a premium problem card. Returns { card, body, coinSlot, setResult }.
 */
export function createProblemCard({
  number,
  total,
  tier,
  typeLabel,
  stem,
} = {}) {
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

  const coinSlot = document.createElement("span");
  coinSlot.className = "problem-coin-slot";
  coinSlot.setAttribute("aria-hidden", "true");
  right.append(coinSlot);

  header.append(left, right);
  card.append(header);

  if (stem) {
    const stemEl = document.createElement("p");
    stemEl.className = "problem-stem";
    stemEl.innerHTML = renderMathText(stem);
    card.append(stemEl);
  }

  const body = document.createElement("div");
  body.className = "problem-body";
  card.append(body);

  function setResult(kind) {
    card.classList.remove(
      "problem-correct",
      "problem-incorrect",
      "problem-pending",
    );
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
