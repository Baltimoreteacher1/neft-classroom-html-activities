// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.

import { detectConceptTool } from "./concept-tool.js";
import { hasConversionFacts, renderConversionChip } from "./conversion-chart.js";
import { stackContentHtml } from "./i18n.js";
import { renderMathText } from "./math-typography.js";
import { notebookPromptFor } from "./notebook-prompt.js";
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

/**
 * Create a premium problem card. Returns { card, body, coinSlot, setResult }.
 */
export function createProblemCard({
  number,
  total,
  tier,
  typeLabel,
  stem,
  stemEs,
  hasConversionChart,
  // The item itself, so the notebook prompt can be DERIVED from it. Optional:
  // a caller that does not pass it simply gets no prompt, which is the correct
  // silent default — no lesson is ever asked to author anything to earn one.
  problemDef,
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
    // Both lanes go through renderMathText — the Spanish stem carries the same
    // numbers and math markup as the English one, so escaping it instead would
    // print the markup literally on exactly the students who need it readable.
    stemEl.innerHTML = stackContentHtml(renderMathText(stem), stemEs ? renderMathText(stemEs) : "");
    card.append(stemEl);
  }

  // Notebook prompt: sits between the stem and the answer UI, because that is
  // the moment the student decides whether to work it out or just pick. It is
  // deliberately NOT a modal and does NOT gate the input — the software cannot
  // see the notebook, so a gate would enforce a claim, and the tap that
  // dismisses it becomes muscle memory within days.
  const notebook = notebookPromptFor(problemDef, number);
  if (notebook) {
    const note = document.createElement("p");
    note.className = "problem-notebook-prompt";
    // Not aria-hidden: a student using a screen reader needs this instruction
    // as much as a sighted one. The pencil is decorative and marked as such.
    note.innerHTML =
      '<span class="problem-notebook-icon" aria-hidden="true">\u270F\uFE0F</span>' +
      stackContentHtml(esc(notebook.en), esc(notebook.es));
    card.append(note);
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

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function awardCoin(slot) {
  if (!slot || slot.querySelector(".coin-earned")) return;
  const coin = document.createElement("span");
  coin.className = "coin-earned";
  coin.textContent = "🪙";
  coin.setAttribute("title", "+1 coin");
  slot.append(coin);
}
