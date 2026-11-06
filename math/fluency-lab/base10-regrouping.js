// Interactive Base-10 Regrouping Mat (Place Value & Regrouping)
// Visual place-value disks with live "Group 10 Ones -> 1 Ten" and "Unbundle 1 Ten -> 10 Ones" operations.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function renderBase10Regrouping(state = {}) {
  const {
    hundreds = 1,
    tens = 4,
    ones = 12,
  } = state;

  const total = hundreds * 100 + tens * 10 + ones;
  const canGroup = ones >= 10;
  const canUnbundle = tens >= 1;

  const renderDisks = (count, color, label) => {
    return Array.from({ length: Math.min(24, count) }, (_, i) => `
      <div class="pv-disk" style="background:${color}" title="${label}">
        <span>${label}</span>
      </div>
    `).join("") + (count > 24 ? `<span class="pv-extra">+${count - 24} more</span>` : "");
  };

  return `
    <div class="base10-mat-wrap" data-base10-root="true" data-h="${hundreds}" data-t="${tens}" data-o="${ones}">
      <div class="coord-header">
        <span class="coord-title">🧮 Interactive Place-Value Regrouping Mat</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">${hundreds} Hundreds</span>
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">${tens} Tens</span>
          <span class="coord-badge" style="background:${canGroup ? "#fef3c7; color:#92400e; font-weight:800" : "#eff6ff; color:#1e40af"}">${ones} Ones</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46; font-weight:800">Total Value = ${total}</span>
        </div>
      </div>

      <div class="pv-columns-grid">
        <!-- Hundreds Column -->
        <div class="pv-col">
          <div class="pv-col-header hundreds">Hundreds (100s) · ${hundreds}</div>
          <div class="pv-disks-box">${renderDisks(hundreds, "#3b82f6", "100")}</div>
          <div class="pv-col-actions">
            <button type="button" class="pv-mini-btn" data-pv-act="add-h">+100</button>
            <button type="button" class="pv-mini-btn" data-pv-act="sub-h" ${hundreds <= 0 ? "disabled" : ""}>−100</button>
          </div>
        </div>

        <!-- Tens Column -->
        <div class="pv-col">
          <div class="pv-col-header tens">Tens (10s) · ${tens}</div>
          <div class="pv-disks-box">${renderDisks(tens, "#10b981", "10")}</div>
          <div class="pv-col-actions">
            <button type="button" class="pv-mini-btn" data-pv-act="add-t">+10</button>
            <button type="button" class="pv-mini-btn" data-pv-act="sub-t" ${tens <= 0 ? "disabled" : ""}>−10</button>
          </div>
        </div>

        <!-- Ones Column -->
        <div class="pv-col ${canGroup ? "pv-needs-group" : ""}">
          <div class="pv-col-header ones">Ones (1s) · ${ones} ${canGroup ? "⚠️ (≥10)" : ""}</div>
          <div class="pv-disks-box">${renderDisks(ones, "#f59e0b", "1")}</div>
          <div class="pv-col-actions">
            <button type="button" class="pv-mini-btn" data-pv-act="add-o">+1</button>
            <button type="button" class="pv-mini-btn" data-pv-act="sub-o" ${ones <= 0 ? "disabled" : ""}>−1</button>
          </div>
        </div>
      </div>

      <div class="coord-controls-row">
        <button type="button" class="coord-btn group-btn ${canGroup ? "is-highlighted" : ""}" data-pv-act="group-ones" ${!canGroup ? "disabled" : ""}>
          ⚡ Regroup 10 Ones ➔ 1 Ten
        </button>
        <button type="button" class="coord-btn unbundle-btn" data-pv-act="unbundle-ten" ${!canUnbundle ? "disabled" : ""}>
          📦 Unbundle 1 Ten ➔ 10 Ones
        </button>
        <button type="button" class="coord-btn" data-pv-act="reset">
          🔄 Reset Mat
        </button>
      </div>
    </div>
  `;
}

export function mountBase10Regrouping(container, onChange) {
  if (!container) return;
  const root = container.matches("[data-base10-root]") ? container : container.querySelector("[data-base10-root]");
  if (!root) return;

  let h = Number(root.dataset.h) || 1;
  let t = Number(root.dataset.t) || 4;
  let o = Number(root.dataset.o) || 12;

  const update = () => {
    root.outerHTML = renderBase10Regrouping({ hundreds: h, tens: t, ones: o });
    const updated = container.querySelector("[data-base10-root]") || container;
    mountBase10Regrouping(updated, onChange);
    if (onChange) onChange({ hundreds: h, tens: t, ones: o });
  };

  root.querySelector('[data-pv-act="add-h"]')?.addEventListener("click", () => { h++; update(); });
  root.querySelector('[data-pv-act="sub-h"]')?.addEventListener("click", () => { if (h > 0) h--; update(); });
  root.querySelector('[data-pv-act="add-t"]')?.addEventListener("click", () => { t++; update(); });
  root.querySelector('[data-pv-act="sub-t"]')?.addEventListener("click", () => { if (t > 0) t--; update(); });
  root.querySelector('[data-pv-act="add-o"]')?.addEventListener("click", () => { o++; update(); });
  root.querySelector('[data-pv-act="sub-o"]')?.addEventListener("click", () => { if (o > 0) o--; update(); });

  root.querySelector('[data-pv-act="group-ones"]')?.addEventListener("click", () => {
    if (o >= 10) {
      o -= 10;
      t += 1;
      update();
    }
  });

  root.querySelector('[data-pv-act="unbundle-ten"]')?.addEventListener("click", () => {
    if (t >= 1) {
      t -= 1;
      o += 10;
      update();
    }
  });

  root.querySelector('[data-pv-act="reset"]')?.addEventListener("click", () => {
    h = 1; t = 4; o = 12;
    update();
  });
}
