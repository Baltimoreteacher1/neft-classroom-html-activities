// Net-to-3D Solid Folder (Grade 6 Geometry & Surface Area)
// Interactive folding slider transforming 2D nets into 3D isometric polyhedra,
// visually demonstrating that Surface Area = sum of individual face areas.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function renderNet3DFolder(state = {}) {
  const {
    l = 4,
    w = 3,
    h = 2,
    foldPercent = 35, // 0 = flat net, 100 = closed 3D prism
  } = state;

  const fold = Math.max(0, Math.min(100, foldPercent));
  const t = fold / 100; // interpolation factor

  // Calculations
  const areaBottom = l * w;
  const areaTop = l * w;
  const areaFront = l * h;
  const areaBack = l * h;
  const areaLeft = w * h;
  const areaRight = w * h;
  const totalArea = (2 * (l * w + l * h + w * h)).toFixed(1);

  // SVG dimensions
  const svgWidth = 380;
  const svgHeight = 220;
  const cx = 190;
  const cy = 110;
  const s = 16; // unit scale in pixels

  // Net layout coordinates
  // Bottom center face (l x w)
  const bW = l * s;
  const bH = w * s;
  const bx = cx - bW / 2;
  const by = cy - bH / 2;

  // Front & Back flaps (height h) rotate upward with fold factor
  const flapScaleY = (1 - 0.7 * t);
  const frontH = h * s * flapScaleY;
  const backH = h * s * flapScaleY;

  // Isometric 3D box view when fold approaches 100%
  let stageContent = "";
  if (t < 0.85) {
    // 2D Net folding mode
    stageContent = `
      <!-- Top Face Flap -->
      <rect x="${bx}" y="${by - backH - bH * flapScaleY}" width="${bW}" height="${bH * flapScaleY}" fill="#bfdbfe" stroke="#2563eb" stroke-width="1.5"/>
      <text x="${cx}" y="${by - backH - (bH * flapScaleY) / 2 + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#1e40af">Top: ${areaTop}</text>

      <!-- Back Flap -->
      <rect x="${bx}" y="${by - backH}" width="${bW}" height="${backH}" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="${cx}" y="${by - backH / 2 + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#1e40af">Back: ${areaBack}</text>

      <!-- Bottom Base Face -->
      <rect x="${bx}" y="${by}" width="${bW}" height="${bH}" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2"/>
      <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" font-weight="900" fill="#1e3a8a">Bottom: ${areaBottom}</text>

      <!-- Front Flap -->
      <rect x="${bx}" y="${by + bH}" width="${bW}" height="${frontH}" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="${cx}" y="${by + bH + frontH / 2 + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#1e40af">Front: ${areaFront}</text>

      <!-- Left Flap -->
      <rect x="${bx - h * s * flapScaleY}" y="${by}" width="${h * s * flapScaleY}" height="${bH}" fill="#bbf7d0" stroke="#10b981" stroke-width="1.5"/>
      <text x="${bx - (h * s * flapScaleY) / 2}" y="${cy + 4}" text-anchor="middle" font-size="9" font-weight="700" fill="#065f46">L: ${areaLeft}</text>

      <!-- Right Flap -->
      <rect x="${bx + bW}" y="${by}" width="${h * s * flapScaleY}" height="${bH}" fill="#bbf7d0" stroke="#10b981" stroke-width="1.5"/>
      <text x="${bx + bW + (h * s * flapScaleY) / 2}" y="${cy + 4}" text-anchor="middle" font-size="9" font-weight="700" fill="#065f46">R: ${areaRight}</text>
    `;
  } else {
    // 3D Isometric Prism view
    const isoL = l * 18;
    const isoW = w * 12;
    const isoH = h * 18;
    const px = 180;
    const py = 130;

    stageContent = `
      <!-- Front Face (l x h) -->
      <polygon points="${px},${py} ${px + isoL},${py - isoL * 0.3} ${px + isoL},${py - isoL * 0.3 - isoH} ${px},${py - isoH}" fill="#93c5fd" stroke="#1d4ed8" stroke-width="2"/>
      <text x="${px + isoL / 2}" y="${py - isoH / 2}" font-size="11" font-weight="800" fill="#1e3a8a">Front (${areaFront})</text>

      <!-- Side Face (w x h) -->
      <polygon points="${px},${py} ${px - isoW},${py - isoW * 0.4} ${px - isoW},${py - isoW * 0.4 - isoH} ${px},${py - isoH}" fill="#86efac" stroke="#15803d" stroke-width="2"/>
      <text x="${px - isoW / 2 - 10}" y="${py - isoH / 2}" font-size="11" font-weight="800" fill="#14532d">Side (${areaLeft})</text>

      <!-- Top Face (l x w) -->
      <polygon points="${px},${py - isoH} ${px + isoL},${py - isoL * 0.3 - isoH} ${px + isoL - isoW},${py - isoL * 0.3 - isoW * 0.4 - isoH} ${px - isoW},${py - isoW * 0.4 - isoH}" fill="#bfdbfe" stroke="#2563eb" stroke-width="2"/>
      <text x="${px + (isoL - isoW) / 2}" y="${py - isoH - 12}" text-anchor="middle" font-size="11" font-weight="800" fill="#1e40af">Top (${areaTop})</text>
    `;
  }

  return `
    <div class="net-folder-wrap" data-net-root="true" data-l="${l}" data-w="${w}" data-h="${h}" data-fold="${fold}">
      <div class="coord-header">
        <span class="coord-title">📦 Net-to-3D Solid Folder &amp; Surface Area</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">Dimensions: ${l} × ${w} × ${h}</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46; font-weight:800">
            Surface Area = 2(${l}×${w} + ${l}×${h} + ${w}×${h}) = ${totalArea} sq units
          </span>
        </div>
      </div>

      <div class="tri-shear-slider-row">
        <label for="fold-range" style="font-size:0.8rem; font-weight:700; color:#475569">Fold Slider (2D Net ➔ 3D Solid):</label>
        <input type="range" id="fold-range" class="tri-shear-slider" min="0" max="100" value="${fold}" aria-label="3D net fold percentage" />
        <span style="font-weight:800; min-width:45px; text-align:right">${fold}%</span>
      </div>

      <div class="coord-stage-box" style="height:220px">
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="Unfolded net folded at ${fold} percent">
          ${stageContent}
        </svg>
      </div>

      <div class="coord-controls-row">
        <button type="button" class="coord-btn" data-prism-preset="cube">Cube (3×3×3)</button>
        <button type="button" class="coord-btn" data-prism-preset="tall">Tall Box (2×3×5)</button>
        <button type="button" class="coord-btn" data-prism-preset="flat">Flat Box (5×4×2)</button>
        <button type="button" class="coord-btn" data-fold-toggle="true">
          ${fold >= 90 ? "📄 Unfold to 2D Net" : "📦 Fold into 3D Solid"}
        </button>
      </div>
    </div>
  `;
}

export function mountNet3DFolder(container, onChange) {
  if (!container) return;
  const root = container.matches("[data-net-root]") ? container : container.querySelector("[data-net-root]");
  if (!root) return;

  let l = Number(root.dataset.l) || 4;
  let w = Number(root.dataset.w) || 3;
  let h = Number(root.dataset.h) || 2;
  let foldPercent = Number(root.dataset.fold) || 35;

  const update = () => {
    root.outerHTML = renderNet3DFolder({ l, w, h, foldPercent });
    const updated = container.querySelector("[data-net-root]") || container;
    mountNet3DFolder(updated, onChange);
    if (onChange) onChange({ l, w, h, foldPercent });
  };

  const slider = root.querySelector("#fold-range");
  if (slider) {
    slider.addEventListener("input", (e) => {
      foldPercent = Number(e.target.value);
      update();
    });
  }

  root.querySelector("[data-fold-toggle]")?.addEventListener("click", () => {
    foldPercent = foldPercent >= 90 ? 0 : 100;
    update();
  });

  root.querySelectorAll("[data-prism-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.dataset.prismPreset;
      if (preset === "cube") { l = 3; w = 3; h = 3; }
      else if (preset === "tall") { l = 2; w = 3; h = 5; }
      else if (preset === "flat") { l = 5; w = 4; h = 2; }
      update();
    });
  });
}
