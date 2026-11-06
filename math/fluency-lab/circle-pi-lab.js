// Circle Circumference, Area & Pi Discovery Lab (Grade 7 Geometry)
// 1. Wheel Unroller: Unrolls a circle along a linear scale proving Circumference = π × d ≈ 3.1416 × d.
// 2. Archimedes Wedge Slicer: Dissects a circle into N alternating pie sectors and rearranges
//    them into a rectangular parallelogram with Base = πr and Height = r, proving Area = πr².

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function computeCircleMetrics(r) {
  const d = 2 * r;
  const c = 2 * Math.PI * r;
  const a = Math.PI * r * r;
  return {
    radius: r,
    diameter: d,
    circumference: c,
    area: a,
    formattedC: c.toFixed(2),
    formattedA: a.toFixed(2),
  };
}

export function renderCirclePiLab(state = {}) {
  const {
    radius = 4,
    mode = "unroll", // "unroll" or "wedge"
    unrollProgress = 0, // 0 to 100%
    wedgeCount = 16, // 8, 16, 32
  } = state;

  const r = Math.max(1, Math.min(8, radius));
  const metrics = computeCircleMetrics(r);
  const prog = Math.max(0, Math.min(100, unrollProgress)) / 100;

  // Unroller SVG
  // A wheel of radius r_px = 35 rolling from x = 60 to x = 60 + 2*PI*r_px = 60 + 219.9 = 280
  const rPx = 32;
  const totalRollPx = 2 * Math.PI * rPx;
  const wheelX = 60 + prog * totalRollPx;
  const wheelY = 120;
  const wheelRotDeg = prog * 360;

  const unrollSvg = `
    <!-- Baseline linear ruler -->
    <line x1="30" y1="152" x2="350" y2="152" stroke="#475569" stroke-width="2"/>
    <text x="35" y="170" font-size="10" font-weight="700" fill="#64748b">0</text>
    <text x="${60 + totalRollPx}" y="170" font-size="10" font-weight="800" fill="#2563eb">C = 2πr ≈ ${(2 * Math.PI * r).toFixed(1)}</text>
    
    <!-- Unrolled red ribbon -->
    ${prog > 0 ? `
      <line x1="60" y1="152" x2="${wheelX}" y2="152" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
      <text x="${60 + (wheelX - 60) / 2}" y="145" text-anchor="middle" font-size="11" font-weight="800" fill="#dc2626">
        ${(prog * metrics.circumference).toFixed(1)} units
      </text>
    ` : ""}

    <!-- Rolling Circle Wheel -->
    <g transform="translate(${wheelX}, ${wheelY}) rotate(${wheelRotDeg})">
      <circle cx="0" cy="0" r="${rPx}" fill="#eff6ff" stroke="#2563eb" stroke-width="3"/>
      <!-- Diameter line -->
      <line x1="-${rPx}" y1="0" x2="${rPx}" y2="0" stroke="#1e40af" stroke-width="2"/>
      <!-- Radius line -->
      <line x1="0" y1="0" x2="0" y2="-${rPx}" stroke="#ef4444" stroke-width="2.5"/>
      <!-- Center hub -->
      <circle cx="0" cy="0" r="4" fill="#1e3a8a"/>
      <!-- Perimeter point marker -->
      <circle cx="0" cy="${rPx}" r="4" fill="#dc2626"/>
    </g>
    <text x="${wheelX}" y="${wheelY - 38}" text-anchor="middle" font-size="11" font-weight="800" fill="#1e40af">r = ${r}</text>
  `;

  // Wedge Slicer SVG (Archimedes Parallelogram)
  // Two rows of interleaved wedges forming base = πr and height = r
  const wedges = [];
  const count = wedgeCount;
  const wedgeW = 220 / count;
  for (let i = 0; i < count; i++) {
    const isTop = i % 2 === 0;
    const wx = 80 + i * wedgeW;
    const wy = isTop ? 70 : 130;
    const color = isTop ? "#3b82f6" : "#10b981";
    wedges.push(`
      <polygon points="${wx},${wy} ${wx + wedgeW / 2},${isTop ? 130 : 70} ${wx + wedgeW},${wy}" fill="${color}" fill-opacity="0.75" stroke="#ffffff" stroke-width="1"/>
    `);
  }

  const wedgeSvg = `
    <!-- Top base indicator: πr -->
    <line x1="80" y1="60" x2="${80 + count * wedgeW}" y2="60" stroke="#1d4ed8" stroke-width="2"/>
    <text x="${80 + (count * wedgeW) / 2}" y="52" text-anchor="middle" font-size="11" font-weight="800" fill="#1d4ed8">Base = πr ≈ ${(Math.PI * r).toFixed(1)}</text>
    
    <!-- Interleaved wedges -->
    ${wedges.join("")}
    
    <!-- Height indicator: r -->
    <line x1="${90 + count * wedgeW}" y1="70" x2="${90 + count * wedgeW}" y2="130" stroke="#047857" stroke-width="2"/>
    <text x="${100 + count * wedgeW}" y="104" font-size="11" font-weight="800" fill="#047857">Height = r = ${r}</text>
  `;

  return `
    <div class="circle-lab-wrap" data-circle-root="true" data-radius="${r}" data-mode="${mode}" data-prog="${prog}">
      <div class="coord-header">
        <span class="coord-title">⚪ Circle Investigator &amp; π Discovery Lab</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">r = ${r} | d = ${metrics.diameter}</span>
          <span class="coord-badge" style="background:#fef2f2; color:#b91c1c">C = 2πr = ${metrics.formattedC}</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46; font-weight:800">Area = πr² = ${metrics.formattedA}</span>
        </div>
      </div>

      <div class="expl-nav-bar" role="tablist">
        <button type="button" class="expl-step-pill ${mode === "unroll" ? "is-active" : ""}" data-circle-mode="unroll">🔄 Wheel Circumference Unroller</button>
        <button type="button" class="expl-step-pill ${mode === "wedge" ? "is-active" : ""}" data-circle-mode="wedge">🍕 Archimedes Wedge Slicer (Area = πr²)</button>
      </div>

      <div class="coord-stage-box" style="height:210px">
        <svg viewBox="0 0 380 200" role="img" aria-label="Circle visualization">
          ${mode === "unroll" ? unrollSvg : wedgeSvg}
        </svg>
      </div>

      <div class="tri-shear-slider-row">
        ${mode === "unroll" ? `
          <label for="circle-unroll-slider" style="font-size:0.85rem; font-weight:700; color:#334155">Unroll Perimeter:</label>
          <input type="range" id="circle-unroll-slider" class="tri-shear-slider" min="0" max="100" value="${Math.round(prog * 100)}" aria-label="Unroll progress percent" />
          <span style="font-size:0.85rem; font-weight:800; color:#2563eb; width:50px">${Math.round(prog * 100)}%</span>
        ` : `
          <label for="circle-wedge-slider" style="font-size:0.85rem; font-weight:700; color:#334155">Number of Slices:</label>
          <input type="range" id="circle-wedge-slider" class="tri-shear-slider" min="8" max="32" step="8" value="${wedgeCount}" aria-label="Number of wedges" />
          <span style="font-size:0.85rem; font-weight:800; color:#10b981; width:50px">${wedgeCount} wedges</span>
        `}
      </div>

      <div class="coord-controls-row">
        <span style="font-size:0.8rem; font-weight:700; color:#475569">Set Radius:</span>
        <button type="button" class="coord-btn" data-set-radius="2">r = 2</button>
        <button type="button" class="coord-btn" data-set-radius="4">r = 4</button>
        <button type="button" class="coord-btn" data-set-radius="6">r = 6</button>
        <button type="button" class="coord-btn" data-set-radius="8">r = 8</button>
      </div>
    </div>
  `;
}

export function mountCirclePiLab(container) {
  if (!container) return;
  const root = container.querySelector('[data-circle-root="true"]');
  if (!root) return;

  const currentRadius = Number(root.dataset.radius) || 4;
  const currentMode = root.dataset.mode || "unroll";
  const currentProg = Math.round((Number(root.dataset.prog) || 0) * 100);

  // Tab switching
  root.querySelectorAll("[data-circle-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.circleMode;
      root.outerHTML = renderCirclePiLab({ radius: currentRadius, mode, unrollProgress: currentProg });
      mountCirclePiLab(container);
    });
  });

  // Slider
  const unrollSlider = root.querySelector("#circle-unroll-slider");
  if (unrollSlider) {
    unrollSlider.addEventListener("input", (e) => {
      const p = Number(e.target.value);
      root.outerHTML = renderCirclePiLab({ radius: currentRadius, mode: "unroll", unrollProgress: p });
      mountCirclePiLab(container);
    });
  }

  const wedgeSlider = root.querySelector("#circle-wedge-slider");
  if (wedgeSlider) {
    wedgeSlider.addEventListener("input", (e) => {
      const count = Number(e.target.value);
      root.outerHTML = renderCirclePiLab({ radius: currentRadius, mode: "wedge", wedgeCount: count });
      mountCirclePiLab(container);
    });
  }

  // Radius buttons
  root.querySelectorAll("[data-set-radius]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const r = Number(btn.dataset.setRadius);
      root.outerHTML = renderCirclePiLab({ radius: r, mode: currentMode, unrollProgress: currentProg });
      mountCirclePiLab(container);
    });
  });
}
