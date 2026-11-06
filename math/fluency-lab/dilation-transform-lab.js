// Dilation, Similarity & Scale Factor Explorer (Grades 7–8 Geometry)
// Direct-manipulation geometric dilation from Center of Dilation (0,0).
// Visually proves that lengths scale by k, while areas scale quadratically by k²!

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function computeDilation(shape, k) {
  const scaledPoints = shape.points.map(([x, y]) => [x * k, y * k]);
  const originalPerimeter = shape.perimeter;
  const originalArea = shape.area;
  const scaledPerimeter = originalPerimeter * k;
  const scaledArea = originalArea * (k * k);

  return {
    k,
    scaledPoints,
    originalPerimeter,
    originalArea,
    scaledPerimeter,
    scaledArea,
    lengthMultiplier: k.toFixed(2),
    areaMultiplier: (k * k).toFixed(2),
  };
}

export const DILATION_SHAPES = {
  triangle: {
    name: "Right Triangle",
    points: [[0, 0], [4, 0], [0, 3]],
    perimeter: 12,
    area: 6,
  },
  rectangle: {
    name: "Rectangle",
    points: [[0, 0], [4, 0], [4, 3], [0, 3]],
    perimeter: 14,
    area: 12,
  },
  lshape: {
    name: "L-Block",
    points: [[0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4]],
    perimeter: 16,
    area: 12,
  },
};

export function renderDilationTransformLab(state = {}) {
  const {
    shapeKey = "triangle",
    k = 1.5,
    showRays = true,
  } = state;

  const validK = Math.max(0.5, Math.min(2.5, k));
  const baseShape = DILATION_SHAPES[shapeKey] || DILATION_SHAPES.triangle;
  const data = computeDilation(baseShape, validK);

  // SVG coordinate transform
  // Origin (0,0) at SVG (60, 160), scale 18 px per unit
  const ox = 60;
  const oy = 160;
  const s = 18;

  const toSvg = ([x, y]) => [ox + x * s, oy - y * s];

  const origPolyPoints = baseShape.points.map(toSvg).map(([x, y]) => `${x},${y}`).join(" ");
  const scaledPolyPoints = data.scaledPoints.map(toSvg).map(([x, y]) => `${x},${y}`).join(" ");

  // Projection rays from origin through each vertex
  const rays = data.scaledPoints.map(([sx, sy], i) => {
    const [origX, origY] = toSvg(baseShape.points[i]);
    const [projX, projY] = toSvg([sx, sy]);
    return `
      <line x1="${ox}" y1="${oy}" x2="${projX}" y2="${projY}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3,3"/>
    `;
  });

  return `
    <div class="dilation-lab-wrap" data-dilation-root="true" data-shape="${shapeKey}" data-k="${validK}" data-rays="${showRays}">
      <div class="coord-header">
        <span class="coord-title">🔍 Dynamic Dilation &amp; Similarity Studio</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">Scale Factor: k = ${validK}</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46">Lengths: × ${data.lengthMultiplier}</span>
          <span class="coord-badge" style="background:#fef3c7; color:#92400e; font-weight:800">
            Area: × k² = × ${data.areaMultiplier}
          </span>
        </div>
      </div>

      <div class="coord-stage-box" style="height:210px">
        <svg viewBox="0 0 380 200" role="img" aria-label="Geometric dilation diagram">
          <!-- Axes -->
          <line x1="30" y1="${oy}" x2="360" y2="${oy}" stroke="#cbd5e1" stroke-width="1.5"/>
          <line x1="${ox}" y1="180" x2="${ox}" y2="20" stroke="#cbd5e1" stroke-width="1.5"/>
          
          <!-- Center of Dilation (Origin) -->
          <circle cx="${ox}" cy="${oy}" r="4" fill="#1e293b"/>
          <text x="${ox - 10}" y="${oy + 14}" font-size="10" font-weight="800" fill="#475569">O(0,0)</text>

          <!-- Rays -->
          ${showRays ? rays.join("") : ""}

          <!-- Scaled Dilation Polygon (Image) -->
          <polygon points="${scaledPolyPoints}" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" stroke-width="2.5"/>

          <!-- Original Polygon (Pre-Image) -->
          <polygon points="${origPolyPoints}" fill="rgba(59, 130, 246, 0.4)" stroke="#2563eb" stroke-width="2"/>

          <!-- Labels -->
          <text x="${ox + 15}" y="${oy - 15}" font-size="11" font-weight="900" fill="#1d4ed8">Pre-Image</text>
          <text x="${toSvg(data.scaledPoints[1])[0] + 5}" y="${toSvg(data.scaledPoints[1])[1] - 10}" font-size="11" font-weight="900" fill="#047857">
            Image (×${validK})
          </text>
        </svg>
      </div>

      <div style="font-size:0.85rem; color:#334155; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:6px 10px">
        💡 <strong>Key Geometric Discovery:</strong> Original Area = <strong>${baseShape.area}</strong> sq units. With scale factor <strong>k = ${validK}</strong>, New Area = ${baseShape.area} × (${validK})² = <strong>${data.scaledArea.toFixed(1)}</strong> sq units!
      </div>

      <div class="tri-shear-slider-row">
        <label for="dilation-k-slider" style="font-size:0.85rem; font-weight:700; color:#1e40af">Scale Factor (k):</label>
        <input type="range" id="dilation-k-slider" class="tri-shear-slider" min="0.5" max="2.5" step="0.25" value="${validK}" aria-label="Scale factor k" />
        <span style="font-size:0.85rem; font-weight:800; color:#2563eb; width:45px">k = ${validK}</span>
      </div>

      <div class="coord-controls-row">
        <span style="font-size:0.8rem; font-weight:700; color:#475569">Pre-Image Shape:</span>
        <button type="button" class="coord-btn ${shapeKey === "triangle" ? "active" : ""}" data-shape-btn="triangle">Triangle</button>
        <button type="button" class="coord-btn ${shapeKey === "rectangle" ? "active" : ""}" data-shape-btn="rectangle">Rectangle</button>
        <button type="button" class="coord-btn ${shapeKey === "lshape" ? "active" : ""}" data-shape-btn="lshape">L-Block</button>
      </div>
    </div>
  `;
}

export function mountDilationTransformLab(container) {
  if (!container) return;
  const root = container.querySelector('[data-dilation-root="true"]');
  if (!root) return;

  const currentShape = root.dataset.shape || "triangle";
  const currentK = Number(root.dataset.k) || 1.5;

  const slider = root.querySelector("#dilation-k-slider");
  if (slider) {
    slider.addEventListener("input", (e) => {
      const k = Number(e.target.value);
      root.outerHTML = renderDilationTransformLab({ shapeKey: currentShape, k });
      mountDilationTransformLab(container);
    });
  }

  root.querySelectorAll("[data-shape-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const shape = btn.dataset.shapeBtn;
      root.outerHTML = renderDilationTransformLab({ shapeKey: shape, k: currentK });
      mountDilationTransformLab(container);
    });
  });
}
