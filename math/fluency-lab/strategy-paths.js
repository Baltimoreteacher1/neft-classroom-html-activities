// Stage 2: Branching Strategy Selector ("Choose Your Way")
// Empowers learners to select their preferred valid mathematical pathway (Compensation, Decomposition, Standard Algorithm)
// rather than being forced into a single rigid procedure.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function getAvailableStrategies(item) {
  const q = String(item?.expr || item?.question || "");
  const addMatch = q.match(/(\d+)\s*\+\s*(\d+)/);
  const mulMatch = q.match(/(\d+)\s*[×*]\s*(\d+)/);

  if (addMatch) {
    const a = Number(addMatch[1]);
    const b = Number(addMatch[2]);
    const roundA = Math.round(a / 10) * 10;
    const diffA = roundA - a;

    return [
      {
        id: "decomp",
        name: "Place Value Split",
        badge: "🧩 Friendly Parts",
        desc: `Break both numbers into tens and ones: (${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10}) + (${a % 10} + ${b % 10})`,
        recommended: false,
      },
      {
        id: "comp",
        name: "Compensation (Jump to Benchmark)",
        badge: "⚡ Mental Shortcut",
        desc: `Round ${a} to ${roundA}: (${roundA} + ${b}) ${diffA > 0 ? "− " + diffA : "+ " + Math.abs(diffA)}`,
        recommended: Math.abs(diffA) <= 3 && Math.abs(diffA) > 0,
      },
      {
        id: "standard",
        name: "Standard Column Method",
        badge: "🧮 Vertical Algorithm",
        desc: "Line up place values vertically and add columns from right to left with regrouping.",
        recommended: false,
      },
    ];
  }

  if (mulMatch) {
    const a = Number(mulMatch[1]);
    const b = Number(mulMatch[2]);
    const big = Math.max(a, b);
    const small = Math.min(a, b);
    const splitTens = Math.floor(big / 10) * 10;
    const splitOnes = big % 10;

    return [
      {
        id: "area-split",
        name: "Partial Products Area Model",
        badge: "📦 Distributive Property",
        desc: `Split ${big} into (${splitTens} + ${splitOnes}): (${small} × ${splitTens}) + (${small} × ${splitOnes})`,
        recommended: true,
      },
      {
        id: "double-half",
        name: "Double and Halve",
        badge: "⚖️ Invariant Ratio",
        desc: small % 2 === 0 ? `Halve ${small} and double ${big}: (${small / 2} × ${big * 2})` : `Double ${small} and halve ${big}: (${small * 2} × ${big / 2})`,
        recommended: (small % 2 === 0 && small >= 4) || (big % 2 === 0 && big >= 12),
      },
      {
        id: "standard-mul",
        name: "Standard Long Multiplication",
        badge: "🧮 Column Method",
        desc: "Multiply ones digit, write partial product, multiply tens digit, and add results.",
        recommended: false,
      },
    ];
  }

  return [];
}

export function renderStrategySelector(strategies, activeId = null) {
  if (!strategies || !strategies.length) return "";

  const cardsHtml = strategies.map((strat) => {
    const isActive = activeId ? strat.id === activeId : strat.recommended;
    return `
      <div class="strat-choice-card ${isActive ? "is-active" : ""}" data-strat-id="${strat.id}" role="radio" aria-checked="${isActive}" tabindex="0">
        <div class="strat-card-header">
          <span class="strat-badge">${esc(strat.badge)}</span>
          ${strat.recommended ? '<span class="strat-recommended-tag">⭐ Teacher Pick</span>' : ""}
        </div>
        <strong class="strat-title">${esc(strat.name)}</strong>
        <p class="strat-desc">${esc(strat.desc)}</p>
      </div>
    `;
  }).join("");

  return `
    <div class="strategy-selector-panel" data-strat-selector="true">
      <div class="strategy-selector-title">
        <span>🛤️ Choose Your Strategy:</span>
        <small style="color:#64748b; font-weight:normal">Pick the mental model that makes the most sense to you!</small>
      </div>
      <div class="strategy-cards-grid" role="radiogroup" aria-label="Available calculation strategies">
        ${cardsHtml}
      </div>
    </div>
  `;
}

export function mountStrategySelector(container, onSelect) {
  if (!container) return;
  const panel = container.matches("[data-strat-selector]") ? container : container.querySelector("[data-strat-selector]");
  if (!panel) return;

  const cards = panel.querySelectorAll(".strat-choice-card");
  cards.forEach((card) => {
    const handlePick = () => {
      cards.forEach((c) => {
        c.classList.remove("is-active");
        c.setAttribute("aria-checked", "false");
      });
      card.classList.add("is-active");
      card.setAttribute("aria-checked", "true");
      if (onSelect) onSelect(card.dataset.stratId);
    };

    card.addEventListener("click", handlePick);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePick();
      }
    });
  });
}
