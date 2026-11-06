// Unit Rate & Best-Buy Comparator (Grade 6 Ratios & Rates)
// Side-by-side unit rate comparison normalizing multi-unit packages to 1 unit,
// visually demonstrating proportional savings and rate of change.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function renderUnitRateComparator(state = {}) {
  const {
    itemA = { name: "Package A", quantity: 16, cost: 4.00, unit: "oz" },
    itemB = { name: "Package B", quantity: 24, cost: 5.40, unit: "oz" },
    normalized = true,
  } = state;

  const rateA = itemA.cost / itemA.quantity;
  const rateB = itemB.cost / itemB.quantity;

  const bestIsA = rateA < rateB;
  const savingsPerUnit = Math.abs(rateA - rateB);

  return `
    <div class="unit-rate-wrap" data-rate-root="true" data-qa="${itemA.quantity}" data-ca="${itemA.cost}" data-qb="${itemB.quantity}" data-cb="${itemB.cost}" data-norm="${normalized}">
      <div class="coord-header">
        <span class="coord-title">🏷️ Unit Rate &amp; "Best Buy" Comparator</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46; font-weight:800">
            ⭐ ${bestIsA ? itemA.name : itemB.name} is the Better Value!
          </span>
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">
            Save $${savingsPerUnit.toFixed(3)} per ${itemA.unit}
          </span>
        </div>
      </div>

      <div class="pv-columns-grid" style="grid-template-columns: 1fr 1fr">
        <!-- Option A Card -->
        <div class="pv-col ${bestIsA ? "pv-needs-group" : ""}">
          <div class="pv-col-header ${bestIsA ? "tens" : "hundreds"}">
            ${esc(itemA.name)} ${bestIsA ? "⭐ BEST BUY" : ""}
          </div>
          <div style="padding:0.85rem; display:flex; flex-direction:column; gap:0.4rem; background:#ffffff">
            <span style="font-size:1.1rem; font-weight:800; color:#0f172a">$${itemA.cost.toFixed(2)}</span>
            <span style="font-size:0.85rem; color:#64748b">for ${itemA.quantity} ${itemA.unit}</span>
            <hr style="border:none; border-top:1px dashed #cbd5e1; margin:0.3rem 0"/>
            <div style="font-size:0.95rem; font-weight:800; color:${bestIsA ? "#16a34a" : "#1e40af"}">
              $${itemA.cost.toFixed(2)} ÷ ${itemA.quantity} = <strong>$${rateA.toFixed(3)}</strong> / ${itemA.unit}
            </div>
          </div>
        </div>

        <!-- Option B Card -->
        <div class="pv-col ${!bestIsA ? "pv-needs-group" : ""}">
          <div class="pv-col-header ${!bestIsA ? "tens" : "hundreds"}">
            ${esc(itemB.name)} ${!bestIsA ? "⭐ BEST BUY" : ""}
          </div>
          <div style="padding:0.85rem; display:flex; flex-direction:column; gap:0.4rem; background:#ffffff">
            <span style="font-size:1.1rem; font-weight:800; color:#0f172a">$${itemB.cost.toFixed(2)}</span>
            <span style="font-size:0.85rem; color:#64748b">for ${itemB.quantity} ${itemB.unit}</span>
            <hr style="border:none; border-top:1px dashed #cbd5e1; margin:0.3rem 0"/>
            <div style="font-size:0.95rem; font-weight:800; color:${!bestIsA ? "#16a34a" : "#1e40af"}">
              $${itemB.cost.toFixed(2)} ÷ ${itemB.quantity} = <strong>$${rateB.toFixed(3)}</strong> / ${itemB.unit}
            </div>
          </div>
        </div>
      </div>

      <div class="coord-controls-row">
        <button type="button" class="coord-btn" data-rate-preset="cereal">🥣 Cereal: 16oz ($4.00) vs 24oz ($5.40)</button>
        <button type="button" class="coord-btn" data-rate-preset="juice">🧃 Juice: 8 bottles ($6.00) vs 12 bottles ($8.40)</button>
        <button type="button" class="coord-btn" data-rate-preset="gas">⛽ Gas: 15 gal ($48.00) vs 20 gal ($62.00)</button>
      </div>
    </div>
  `;
}

export function mountUnitRateComparator(container, onChange) {
  if (!container) return;
  const root = container.matches("[data-rate-root]") ? container : container.querySelector("[data-rate-root]");
  if (!root) return;

  root.querySelectorAll("[data-rate-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.dataset.ratePreset;
      let itemA, itemB;
      if (preset === "cereal") {
        itemA = { name: "16oz Box", quantity: 16, cost: 4.00, unit: "oz" };
        itemB = { name: "24oz Family Size", quantity: 24, cost: 5.40, unit: "oz" };
      } else if (preset === "juice") {
        itemA = { name: "8-Pack", quantity: 8, cost: 6.00, unit: "bottle" };
        itemB = { name: "12-Pack", quantity: 12, cost: 8.40, unit: "bottle" };
      } else if (preset === "gas") {
        itemA = { name: "Station A", quantity: 15, cost: 48.00, unit: "gal" };
        itemB = { name: "Station B", quantity: 20, cost: 62.00, unit: "gal" };
      }
      root.outerHTML = renderUnitRateComparator({ itemA, itemB });
      const updated = container.querySelector("[data-rate-root]") || container;
      mountUnitRateComparator(updated, onChange);
      if (onChange) onChange({ itemA, itemB });
    });
  });
}
