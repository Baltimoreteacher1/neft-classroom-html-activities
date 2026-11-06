// Pythagorean Theorem & Distance Laboratory (Grade 8 Geometry)
// Interactive right triangle with physical square areas on legs a, b and hypotenuse c.
// Demonstrates visually and algebraically that a² + b² = c² (or c = √(a² + b²)).

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function computePythagoras(a, b) {
  const aSq = a * a;
  const bSq = b * b;
  const cSq = aSq + bSq;
  const c = Math.sqrt(cSq);
  return {
    a,
    b,
    c,
    aSq,
    bSq,
    cSq,
    formattedC: c.toFixed(2),
    isTriple: Number.isInteger(c),
  };
}

export function renderPythagorasLab(state = {}) {
  const {
    a = 3,
    b = 4,
    showSquares = true,
  } = state;

  const validA = Math.max(1, Math.min(8, a));
  const validB = Math.max(1, Math.min(8, b));
  const metrics = computePythagoras(validA, validB);

  // Scaled coordinates for SVG right triangle
  // Right angle at (originX, originY) = (150, 140)
  const ox = 150;
  const oy = 140;
  const scale = 16; // 1 unit = 16 px

  const legAX = ox;
  const legAY = oy - validA * scale; // Point C (top)
  const legBX = ox + validB * scale; // Point B (right)
  const legBY = oy;

  // Squares on legs
  // Square A: left of leg A (from x = ox - validA*scale to ox, y from legAY to oy)
  const sqA = `
    <rect x="${ox - validA * scale}" y="${legAY}" width="${validA * scale}" height="${validA * scale}" fill="rgba(59, 130, 246, 0.2)" stroke="#2563eb" stroke-width="2"/>
    <text x="${ox - (validA * scale) / 2}" y="${legAY + (validA * scale) / 2 + 5}" text-anchor="middle" font-size="12" font-weight="900" fill="#1e40af">a² = ${metrics.aSq}</text>
  `;

  // Square B: below leg B (from x = ox to legBX, y from oy to oy + validB*scale)
  const sqB = `
    <rect x="${ox}" y="${oy}" width="${validB * scale}" height="${validB * scale}" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="2"/>
    <text x="${ox + (validB * scale) / 2}" y="${oy + (validB * scale) / 2 + 5}" text-anchor="middle" font-size="12" font-weight="900" fill="#065f46">b² = ${metrics.bSq}</text>
  `;

  return `
    <div class="pythagoras-lab-wrap" data-pyth-root="true" data-a="${validA}" data-b="${validB}" data-squares="${showSquares}">
      <div class="coord-header">
        <span class="coord-title">📐 Pythagorean Theorem &amp; Distance Studio</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">a = ${validA} (a² = ${metrics.aSq})</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46">b = ${validB} (b² = ${metrics.bSq})</span>
          <span class="coord-badge" style="background:#fef3c7; color:#92400e; font-weight:800">
            c = √(${metrics.aSq} + ${metrics.bSq}) = ${metrics.formattedC} ${metrics.isTriple ? "★ (Pythagorean Triple!)" : ""}
          </span>
        </div>
      </div>

      <div class="coord-stage-box" style="height:220px">
        <svg viewBox="0 0 380 220" role="img" aria-label="Right triangle with Pythagorean squares">
          ${showSquares ? sqA + sqB : ""}
          
          <!-- Right angle symbol -->
          <rect x="${ox}" y="${oy - 12}" width="12" height="12" fill="none" stroke="#64748b" stroke-width="1.5"/>

          <!-- Right Triangle ABC -->
          <polygon points="${ox},${oy} ${legBX},${legBY} ${legAX},${legAY}" fill="rgba(241, 245, 249, 0.7)" stroke="#1e293b" stroke-width="3"/>
          
          <!-- Leg Labels -->
          <text x="${ox - 10}" y="${(oy + legAY) / 2 + 4}" text-anchor="end" font-size="12" font-weight="800" fill="#2563eb">a = ${validA}</text>
          <text x="${(ox + legBX) / 2}" y="${oy + 16}" text-anchor="middle" font-size="12" font-weight="800" fill="#10b981">b = ${validB}</text>
          <text x="${(legAX + legBX) / 2 + 12}" y="${(legAY + legBY) / 2 - 8}" text-anchor="middle" font-size="13" font-weight="900" fill="#b45309">
            c ≈ ${metrics.formattedC}
          </text>
        </svg>
      </div>

      <div class="tri-shear-slider-row">
        <label for="pyth-leg-a" style="font-size:0.85rem; font-weight:700; color:#1e40af">Leg a:</label>
        <input type="range" id="pyth-leg-a" class="tri-shear-slider" min="1" max="8" value="${validA}" aria-label="Length of leg a" />
        <span style="font-size:0.85rem; font-weight:800; color:#2563eb; width:25px">${validA}</span>

        <label for="pyth-leg-b" style="font-size:0.85rem; font-weight:700; color:#065f46; margin-left:1rem">Leg b:</label>
        <input type="range" id="pyth-leg-b" class="tri-shear-slider" min="1" max="8" value="${validB}" aria-label="Length of leg b" />
        <span style="font-size:0.85rem; font-weight:800; color:#10b981; width:25px">${validB}</span>
      </div>

      <div class="coord-controls-row">
        <span style="font-size:0.8rem; font-weight:700; color:#475569">Classic Triples:</span>
        <button type="button" class="coord-btn" data-triple="3:4">3 - 4 - 5</button>
        <button type="button" class="coord-btn" data-triple="6:8">6 - 8 - 10</button>
        <button type="button" class="coord-btn" data-triple="5:12" disabled style="opacity:0.6" title="Exceeds compact canvas">5 - 12 - 13</button>
        <button type="button" class="coord-btn" id="pyth-toggle-squares">
          ${showSquares ? "Hide Squares" : "Show a² &amp; b² Squares"}
        </button>
      </div>
    </div>
  `;
}

export function mountPythagorasLab(container) {
  if (!container) return;
  const root = container.querySelector('[data-pyth-root="true"]');
  if (!root) return;

  const a = Number(root.dataset.a) || 3;
  const b = Number(root.dataset.b) || 4;
  const showSquares = root.dataset.squares !== "false";

  const sliderA = root.querySelector("#pyth-leg-a");
  if (sliderA) {
    sliderA.addEventListener("input", (e) => {
      const valA = Number(e.target.value);
      root.outerHTML = renderPythagorasLab({ a: valA, b, showSquares });
      mountPythagorasLab(container);
    });
  }

  const sliderB = root.querySelector("#pyth-leg-b");
  if (sliderB) {
    sliderB.addEventListener("input", (e) => {
      const valB = Number(e.target.value);
      root.outerHTML = renderPythagorasLab({ a, b: valB, showSquares });
      mountPythagorasLab(container);
    });
  }

  root.querySelectorAll("[data-triple]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [tA, tB] = btn.dataset.triple.split(":").map(Number);
      root.outerHTML = renderPythagorasLab({ a: tA, b: tB, showSquares });
      mountPythagorasLab(container);
    });
  });

  const toggleBtn = root.querySelector("#pyth-toggle-squares");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      root.outerHTML = renderPythagorasLab({ a, b, showSquares: !showSquares });
      mountPythagorasLab(container);
    });
  }
}
