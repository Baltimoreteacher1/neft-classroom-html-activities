// Proofs Without Words & Geometric Dissection Studio (Grades 6–8 Geometry)
// Interactive visual proofs that make abstract geometric formulas self-evident through continuous morphing.
// 1. Parallelogram: Slides right-triangle wedge across base to form a rectangle, proving Area = b × h.
// 2. Trapezoid: Rotates duplicate trapezoid 180° to form a parallelogram of base (b₁ + b₂), proving Area = ½(b₁ + b₂)h.
// 3. Odd Numbers Square: Nests concentric L-shaped gnomons showing 1 + 3 + 5 + ... + (2n-1) = n².

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function renderProofWithoutWords(state = {}) {
  const {
    theorem = "parallelogram", // "parallelogram", "trapezoid", "oddsum"
    progress = 0, // 0 to 100%
  } = state;

  const t = Math.max(0, Math.min(100, progress)) / 100;

  let diagramSvg = "";
  let formulaTitle = "";
  let formulaBadge = "";

  if (theorem === "parallelogram") {
    formulaTitle = "Parallelogram: Area = base × height";
    formulaBadge = `Area = 8 × 4 = 32 sq units (Morph: ${Math.round(t * 100)}%)`;

    // Base b = 8 units (160 px), height h = 4 units (80 px), slant = 2 units (40 px)
    const ox = 70;
    const oy = 150;
    const b = 160;
    const h = 80;
    const slant = 40;

    // Fixed trapezoidal body: (ox + slant, oy) to (ox + b, oy) to (ox + b + slant, oy - h) to (ox + slant, oy - h)
    // Sliced triangle ear: originally (ox, oy) to (ox + slant, oy) to (ox + slant, oy - h)
    // As t goes 0 -> 1, slide ear by +b px to the right!
    const earShift = t * b;

    diagramSvg = `
      <!-- Fixed Parallelogram Body -->
      <polygon points="${ox + slant},${oy} ${ox + b},${oy} ${ox + b + slant - t * slant},${oy - h} ${ox + slant},${oy - h}" fill="rgba(59, 130, 246, 0.4)" stroke="#2563eb" stroke-width="2"/>
      
      <!-- Sliced Triangle Ear (Slides to right side) -->
      <polygon points="${ox + earShift},${oy} ${ox + slant + earShift},${oy} ${ox + slant + earShift},${oy - h}" fill="rgba(239, 68, 68, 0.5)" stroke="#dc2626" stroke-width="2"/>

      <!-- Base & Height guides -->
      <line x1="${ox}" y1="${oy + 15}" x2="${ox + b}" y2="${oy + 15}" stroke="#1e293b" stroke-width="1.5"/>
      <text x="${ox + b / 2}" y="${oy + 30}" text-anchor="middle" font-size="11" font-weight="800" fill="#1e293b">Base = 8</text>

      <line x1="${ox - 15}" y1="${oy}" x2="${ox - 15}" y2="${oy - h}" stroke="#10b981" stroke-width="1.5"/>
      <text x="${ox - 22}" y="${oy - h / 2}" text-anchor="end" font-size="11" font-weight="800" fill="#047857">h = 4</text>
    `;
  } else if (theorem === "trapezoid") {
    formulaTitle = "Trapezoid: Area = ½(b₁ + b₂) × height";
    formulaBadge = `Area = ½(6 + 10) × 4 = 32 sq units`;

    // b1 = 6, b2 = 10, h = 4
    const ox = 70;
    const oy = 140;
    const b2 = 140; // bottom base
    const b1 = 90; // top base
    const h = 70;

    // Rotation of duplicate trapezoid from 0 to 180 degrees around right midpoint
    const rotDeg = t * 180;

    diagramSvg = `
      <!-- Original Trapezoid -->
      <polygon points="${ox},${oy} ${ox + b2},${oy} ${ox + b1 + 25},${oy - h} ${ox + 25},${oy - h}" fill="rgba(59, 130, 246, 0.45)" stroke="#2563eb" stroke-width="2"/>
      
      <!-- Rotating Duplicate Trapezoid -->
      <g transform="translate(${ox + b2}, ${oy}) rotate(${rotDeg})">
        <polygon points="0,0 ${b2},0 ${b1 + 25},-${h} 25,-${h}" fill="rgba(16, 185, 129, 0.35)" stroke="#10b981" stroke-width="2" stroke-dasharray="3,3"/>
      </g>

      <text x="${ox + b2 / 2}" y="${oy + 18}" text-anchor="middle" font-size="11" font-weight="800" fill="#1d4ed8">b₂ = 10</text>
      <text x="${ox + 25 + b1 / 2}" y="${oy - h - 8}" text-anchor="middle" font-size="11" font-weight="800" fill="#1d4ed8">b₁ = 6</text>
    `;
  } else {
    // Odd Numbers Sum = n^2
    formulaTitle = "Sum of Odd Numbers: 1 + 3 + 5 + 7 = 4² = 16";
    formulaBadge = `Sum = n² = 16`;

    const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"];
    const layers = [];
    for (let layer = 0; layer < 4; layer++) {
      const c = colors[layer];
      const count = 2 * layer + 1;
      const u = 24;
      const ox = 110;
      const oy = 40;

      // Render L-shaped gnomon for this layer
      for (let col = 0; col <= layer; col++) {
        layers.push(`<rect x="${ox + col * u}" y="${oy + layer * u}" width="${u - 2}" height="${u - 2}" fill="${c}" stroke="#ffffff" stroke-width="1" rx="2"/>`);
      }
      for (let row = 0; row < layer; row++) {
        layers.push(`<rect x="${ox + layer * u}" y="${oy + row * u}" width="${u - 2}" height="${u - 2}" fill="${c}" stroke="#ffffff" stroke-width="1" rx="2"/>`);
      }
    }

    diagramSvg = `
      ${layers.join("")}
      <text x="240" y="60" font-size="11" font-weight="800" fill="#ef4444">Layer 1: 1 = 1²</text>
      <text x="240" y="85" font-size="11" font-weight="800" fill="#d97706">Layer 2: + 3 = 2² (4)</text>
      <text x="240" y="110" font-size="11" font-weight="800" fill="#059669">Layer 3: + 5 = 3² (9)</text>
      <text x="240" y="135" font-size="11" font-weight="800" fill="#2563eb">Layer 4: + 7 = 4² (16)</text>
    `;
  }

  return `
    <div class="proof-words-wrap" data-proof-root="true" data-theorem="${theorem}" data-prog="${Math.round(t * 100)}">
      <div class="coord-header">
        <span class="coord-title">✨ Proofs Without Words: ${esc(formulaTitle)}</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46; font-weight:800">
            ${esc(formulaBadge)}
          </span>
        </div>
      </div>

      <div class="expl-nav-bar" role="tablist">
        <button type="button" class="expl-step-pill ${theorem === "parallelogram" ? "is-active" : ""}" data-proof-thm="parallelogram">▱ Parallelogram ➔ Rectangle</button>
        <button type="button" class="expl-step-pill ${theorem === "trapezoid" ? "is-active" : ""}" data-proof-thm="trapezoid">⏢ Trapezoid ➔ Parallelogram</button>
        <button type="button" class="expl-step-pill ${theorem === "oddsum" ? "is-active" : ""}" data-proof-thm="oddsum">🔲 Odd Numbers ➔ Square</button>
      </div>

      <div class="coord-stage-box" style="height:210px">
        <svg viewBox="0 0 380 200" role="img" aria-label="Proof without words geometric morph">
          ${diagramSvg}
        </svg>
      </div>

      ${theorem !== "oddsum" ? `
        <div class="tri-shear-slider-row">
          <label for="proof-morph-slider" style="font-size:0.85rem; font-weight:700; color:#1e40af">Morph Dissection:</label>
          <input type="range" id="proof-morph-slider" class="tri-shear-slider" min="0" max="100" value="${Math.round(t * 100)}" aria-label="Dissection morph percentage" />
          <span style="font-size:0.85rem; font-weight:800; color:#2563eb; width:50px">${Math.round(t * 100)}%</span>
        </div>
      ` : ""}
    </div>
  `;
}

export function mountProofWithoutWords(container) {
  if (!container) return;
  const root = container.querySelector('[data-proof-root="true"]');
  if (!root) return;

  const currentThm = root.dataset.theorem || "parallelogram";
  const currentProg = Number(root.dataset.prog) || 0;

  root.querySelectorAll("[data-proof-thm]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const thm = btn.dataset.proofThm;
      root.outerHTML = renderProofWithoutWords({ theorem: thm, progress: 0 });
      mountProofWithoutWords(container);
    });
  });

  const slider = root.querySelector("#proof-morph-slider");
  if (slider) {
    slider.addEventListener("input", (e) => {
      const p = Number(e.target.value);
      root.outerHTML = renderProofWithoutWords({ theorem: currentThm, progress: p });
      mountProofWithoutWords(container);
    });
  }
}
