// Interactive Tape Diagram & Proportional Ratio Scaler (Ratios & Proportions)
// Scalable tape diagrams with live synchronized ratio table and unit rate computations.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function renderRatioScaler(state = {}) {
  const {
    labelA = "Part A (Blue)",
    labelB = "Part B (Green)",
    a = 3,
    b = 5,
    multiplier = 2,
  } = state;

  const mult = Math.max(1, Math.min(6, multiplier));
  const currentA = a * mult;
  const currentB = b * mult;
  const total = currentA + currentB;
  const unitRate = (b / a).toFixed(2);

  const pills = [1, 2, 3, 4, 5].map((factor) => {
    const active = factor === mult;
    return `
      <button type="button" class="expl-slicer-pill ${active ? "is-active" : ""}"
        data-ratio-factor="${factor}" aria-pressed="${active}">
        Scale ×${factor}
      </button>
    `;
  }).join("");

  const renderBlocks = (count, color, stroke) => {
    return Array.from({ length: count }, () => `
      <div class="ratio-tape-block" style="background:${color}; border-color:${stroke}">
        <span>1</span>
      </div>
    `).join("");
  };

  // Ratio Table rows
  const tableRows = [1, 2, 3, 4].map((m) => {
    const isCurrent = m === mult;
    return `
      <tr class="${isCurrent ? "ratio-row-current" : ""}">
        <td><strong>×${m}</strong></td>
        <td>${a * m}</td>
        <td>${b * m}</td>
        <td>${(a + b) * m}</td>
      </tr>
    `;
  }).join("");

  return `
    <div class="ratio-scaler-wrap" data-ratio-root="true" data-a="${a}" data-b="${b}" data-mult="${mult}" data-la="${esc(labelA)}" data-lb="${esc(labelB)}">
      <div class="coord-header">
        <span class="coord-title">📊 Proportional Tape Diagram &amp; Ratio Scaler</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">Base Ratio: ${a} : ${b}</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46">Scaled: <strong>${currentA} : ${currentB}</strong></span>
          <span class="coord-badge" style="background:#fef3c7; color:#92400e">Unit Rate: 1 to ${unitRate}</span>
        </div>
      </div>

      <div class="expl-inputs-bar">
        <label>Base Ratio:</label>
        <input type="number" min="1" max="15" value="${a}" class="expl-num-in" data-ratio-in="a" aria-label="Part A"/>
        <span>:</span>
        <input type="number" min="1" max="15" value="${b}" class="expl-num-in" data-ratio-in="b" aria-label="Part B"/>
        <button type="button" class="expl-update-btn" data-ratio-update="true">Apply Ratio</button>
      </div>

      <div class="expl-slicer-controls">
        <span class="expl-slicer-label">Multiplier Factor:</span>
        <div class="expl-slicer-pills" role="group" aria-label="Scale multiplier">
          ${pills}
        </div>
      </div>

      <div class="ratio-display-grid">
        <div class="ratio-tapes-column">
          <!-- Tape A -->
          <div class="ratio-tape-row">
            <span class="ratio-tape-label">${esc(labelA)}: <strong>${currentA}</strong></span>
            <div class="ratio-tape-track">
              ${renderBlocks(currentA, "#dbeafe", "#3b82f6")}
            </div>
          </div>

          <!-- Tape B -->
          <div class="ratio-tape-row">
            <span class="ratio-tape-label">${esc(labelB)}: <strong>${currentB}</strong></span>
            <div class="ratio-tape-track">
              ${renderBlocks(currentB, "#dcfce7", "#10b981")}
            </div>
          </div>
          <p style="margin:0.25rem 0 0; font-size:0.8rem; color:#64748b">
            Total Combined Units: <strong>${total}</strong> (Scaled by factor of ${mult})
          </p>
        </div>

        <div class="ratio-table-column">
          <table class="ratio-table">
            <thead>
              <tr>
                <th>Factor</th>
                <th>${esc(labelA)}</th>
                <th>${esc(labelB)}</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

export function mountRatioScaler(container, onChange) {
  if (!container) return;
  const root = container.matches("[data-ratio-root]") ? container : container.querySelector("[data-ratio-root]");
  if (!root) return;

  const a = Number(root.dataset.a) || 3;
  const b = Number(root.dataset.b) || 5;
  const labelA = root.dataset.la || "Part A";
  const labelB = root.dataset.lb || "Part B";

  root.querySelectorAll("[data-ratio-factor]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mult = Number(btn.dataset.ratioFactor) || 1;
      root.outerHTML = renderRatioScaler({ a, b, labelA, labelB, multiplier: mult });
      const updated = container.querySelector("[data-ratio-root]") || container;
      mountRatioScaler(updated, onChange);
      if (onChange) onChange({ a, b, multiplier: mult });
    });
  });

  root.querySelector("[data-ratio-update]")?.addEventListener("click", () => {
    const inA = Number(root.querySelector("[data-ratio-in='a']")?.value || a);
    const inB = Number(root.querySelector("[data-ratio-in='b']")?.value || b);
    const mult = Number(root.dataset.mult) || 1;
    root.outerHTML = renderRatioScaler({ a: inA, b: inB, labelA, labelB, multiplier: mult });
    const updated = container.querySelector("[data-ratio-root]") || container;
    mountRatioScaler(updated, onChange);
    if (onChange) onChange({ a: inA, b: inB, multiplier: mult });
  });
}
