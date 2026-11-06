// Dynamic Triangle Shear & Area Manipulative (Geometry & Measurement)
// Draggable apex along a parallel line demonstrating that Area = 1/2 * base * height is invariant under shear.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function renderTriangleShear(state = {}) {
  const {
    base = 12,
    height = 8,
    shearX = 6, // apex X offset relative to base origin (range -4 to 16)
    showDouble = false,
  } = state;

  const svgWidth = 380;
  const svgHeight = 200;
  const margin = 40;
  const scale = 14;

  const bx1 = margin;
  const by1 = svgHeight - margin;
  const bx2 = margin + base * scale;
  const by2 = svgHeight - margin;

  const apexX = margin + shearX * scale;
  const apexY = svgHeight - margin - height * scale;

  const area = (0.5 * base * height).toFixed(1);
  const doubleArea = (base * height).toFixed(1);

  // Parallel guide line
  const guideLine = `<line x1="${margin - 20}" y1="${apexY}" x2="${svgWidth - margin + 20}" y2="${apexY}" stroke="#94a3b8" stroke-dasharray="4 3" stroke-width="1.5"/>`;

  // Bounding box / double triangle
  let doubleBox = "";
  if (showDouble) {
    doubleBox = `
      <rect x="${bx1}" y="${apexY}" width="${base * scale}" height="${height * scale}" fill="rgba(16, 185, 129, 0.08)" stroke="#10b981" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="${bx1 + (base * scale) / 2}" y="${apexY - 8}" text-anchor="middle" font-size="10" font-weight="700" fill="#047857">Full Rectangle: b × h = ${doubleArea}</text>
    `;
  }

  // Perpendicular height altitude drop
  const altX = apexX;
  const altY1 = apexY;
  const altY2 = by1;

  return `
    <div class="triangle-shear-wrap" data-tri-root="true" data-base="${base}" data-height="${height}" data-shear="${shearX}" data-double="${showDouble}">
      <div class="coord-header">
        <span class="coord-title">📐 Invariant Area Triangle Shear</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">Base: ${base} units</span>
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">Height: ${height} units</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46; font-weight:800">Area = ½ × ${base} × ${height} = ${area}</span>
        </div>
      </div>

      <div class="tri-shear-slider-row">
        <label for="tri-shear-range" style="font-size:0.8rem; font-weight:700; color:#475569">Shear Apex (Slide Left/Right):</label>
        <input type="range" id="tri-shear-range" class="tri-shear-slider" min="0" max="${base}" value="${shearX}" aria-label="Shear apex horizontal position" />
      </div>

      <div class="coord-stage-box" style="height:210px">
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="Triangle with base ${base} and height ${height}. Area is ${area} square units.">
          <!-- Parallel height guide line -->
          ${guideLine}
          <text x="${svgWidth - margin + 25}" y="${apexY + 4}" font-size="9" font-weight="700" fill="#64748b">Parallel Line</text>

          <!-- Bounding rectangle -->
          ${doubleBox}

          <!-- Triangle Polygon -->
          <polygon points="${bx1},${by1} ${bx2},${by2} ${apexX},${apexY}" fill="rgba(59, 130, 246, 0.15)" stroke="#2563eb" stroke-width="2.5"/>

          <!-- Altitude Line -->
          <line x1="${altX}" y1="${altY1}" x2="${altX}" y2="${altY2}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3 2"/>
          <text x="${altX + (altX > bx2 ? -18 : 6)}" y="${(altY1 + altY2) / 2}" font-size="10" font-weight="800" fill="#dc2626">h = ${height}</text>

          <!-- Base label -->
          <line x1="${bx1}" y1="${by1 + 10}" x2="${bx2}" y2="${by2 + 10}" stroke="#1e293b" stroke-width="1.5"/>
          <text x="${(bx1 + bx2) / 2}" y="${by1 + 24}" text-anchor="middle" font-size="11" font-weight="800" fill="#0f172a">Base = ${base}</text>

          <!-- Apex Vertex Handle -->
          <circle cx="${apexX}" cy="${apexY}" r="6" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
        </svg>
      </div>

      <div class="coord-controls-row">
        <button type="button" class="coord-btn" data-tri-act="toggle-double">
          ${showDouble ? "Hide Double Rectangle" : "🧩 Double into Rectangle (Prove ½ Multiplier)"}
        </button>
        <button type="button" class="coord-btn" data-tri-act="reset">
          🔄 Right Triangle Mode
        </button>
      </div>
    </div>
  `;
}

export function mountTriangleShear(container, onChange) {
  if (!container) return;
  const root = container.matches("[data-tri-root]") ? container : container.querySelector("[data-tri-root]");
  if (!root) return;

  const base = Number(root.dataset.base) || 12;
  const height = Number(root.dataset.height) || 8;
  let showDouble = root.dataset.double === "true";

  const slider = root.querySelector("#tri-shear-range");
  if (slider) {
    slider.addEventListener("input", (e) => {
      const shearX = Number(e.target.value);
      root.outerHTML = renderTriangleShear({ base, height, shearX, showDouble });
      const updated = container.querySelector("[data-tri-root]") || container;
      mountTriangleShear(updated, onChange);
      if (onChange) onChange({ base, height, shearX, showDouble });
    });
  }

  root.querySelector('[data-tri-act="toggle-double"]')?.addEventListener("click", () => {
    showDouble = !showDouble;
    const shearX = Number(root.dataset.shear) || 6;
    root.outerHTML = renderTriangleShear({ base, height, shearX, showDouble });
    const updated = container.querySelector("[data-tri-root]") || container;
    mountTriangleShear(updated, onChange);
    if (onChange) onChange({ base, height, shearX, showDouble });
  });

  root.querySelector('[data-tri-act="reset"]')?.addEventListener("click", () => {
    root.outerHTML = renderTriangleShear({ base, height, shearX: 0, showDouble });
    const updated = container.querySelector("[data-tri-root]") || container;
    mountTriangleShear(updated, onChange);
    if (onChange) onChange({ base, height, shearX: 0, showDouble });
  });
}
