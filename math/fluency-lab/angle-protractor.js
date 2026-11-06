// Interactive Angle & Protractor Studio (Grade 4–8 Geometry)
// Direct-manipulation ray rotation, circular 360-degree protractor overlay,
// and dynamic Complementary (90 deg) / Supplementary (180 deg) angle pair relationships.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function classifyAngle(degrees) {
  if (degrees < 90) return { type: "acute", label: "Acute Angle (< 90°)", color: "#2563eb" };
  if (degrees === 90) return { type: "right", label: "Right Angle (Exactly 90°)", color: "#16a34a" };
  if (degrees < 180) return { type: "obtuse", label: "Obtuse Angle (90°–180°)", color: "#d97706" };
  if (degrees === 180) return { type: "straight", label: "Straight Angle (180°)", color: "#7c3aed" };
  return { type: "reflex", label: "Reflex Angle (> 180°)", color: "#dc2626" };
}

export function renderAngleProtractor(state = {}) {
  const {
    angle = 45,
    mode = "single", // "single", "complementary" (90), "supplementary" (180)
    showProtractor = true,
  } = state;

  const deg = Math.max(0, Math.min(360, angle));
  const classification = classifyAngle(deg);

  const cx = 190;
  const cy = 160;
  const rayLen = 120;
  const rad = (deg * Math.PI) / 180;

  // Primary movable ray
  const rx = cx + rayLen * Math.cos(-rad);
  const ry = cy + rayLen * Math.sin(-rad);

  // Angle arc path
  const arcR = 36;
  const arcX = cx + arcR * Math.cos(-rad);
  const arcY = cy + arcR * Math.sin(-rad);
  const largeArc = deg > 180 ? 1 : 0;
  const arcPath = `M ${cx + arcR} ${cy} A ${arcR} ${arcR} 0 ${largeArc} 0 ${arcX} ${arcY}`;

  // Complementary or Supplementary second ray
  let pairedRay = "";
  let pairedAngleBadge = "";
  if (mode === "complementary") {
    const compDeg = Math.max(0, 90 - Math.min(90, deg));
    const targetRad = (90 * Math.PI) / 180;
    const px = cx + rayLen * Math.cos(-targetRad);
    const py = cy + rayLen * Math.sin(-targetRad);
    pairedRay = `
      <line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="#10b981" stroke-width="3" stroke-dasharray="4 3"/>
      <text x="${cx - 14}" y="${cy - 70}" font-size="11" font-weight="800" fill="#047857">90° Target</text>
    `;
    pairedAngleBadge = `
      <span class="coord-badge" style="background:#ecfdf5; color:#065f46">
        Complement: 90° − ${deg}° = <strong>${compDeg}°</strong>
      </span>
    `;
  } else if (mode === "supplementary") {
    const suppDeg = Math.max(0, 180 - Math.min(180, deg));
    pairedRay = `
      <line x1="${cx}" y1="${cy}" x2="${cx - rayLen}" y2="${cy}" stroke="#7c3aed" stroke-width="3" stroke-dasharray="4 3"/>
      <text x="${cx - rayLen / 2}" y="${cy + 18}" text-anchor="middle" font-size="11" font-weight="800" fill="#6d28d9">180° Baseline</text>
    `;
    pairedAngleBadge = `
      <span class="coord-badge" style="background:#f3e8ff; color:#6b21a8">
        Supplement: 180° − ${deg}° = <strong>${suppDeg}°</strong>
      </span>
    `;
  }

  // Semi-circular transparent protractor overlay
  let protractorSvg = "";
  if (showProtractor) {
    const prR = 100;
    let ticks = "";
    for (let a = 0; a <= 180; a += 10) {
      const aRad = (a * Math.PI) / 180;
      const tX1 = cx + prR * Math.cos(-aRad);
      const tY1 = cy + prR * Math.sin(-aRad);
      const tX2 = cx + (prR - 8) * Math.cos(-aRad);
      const tY2 = cy + (prR - 8) * Math.sin(-aRad);
      ticks += `<line x1="${tX1}" y1="${tY1}" x2="${tX2}" y2="${tY2}" stroke="#cbd5e1" stroke-width="${a % 30 === 0 ? "1.5" : "0.75"}"/>`;
      if (a % 30 === 0 && a > 0 && a < 180) {
        const textX = cx + (prR - 18) * Math.cos(-aRad);
        const textY = cy + (prR - 18) * Math.sin(-aRad);
        ticks += `<text x="${textX}" y="${textY + 3}" text-anchor="middle" font-size="7" font-weight="700" fill="#94a3b8">${a}°</text>`;
      }
    }
    protractorSvg = `
      <path d="M ${cx + prR} ${cy} A ${prR} ${prR} 0 0 0 ${cx - prR} ${cy} Z" fill="rgba(248, 250, 252, 0.75)" stroke="#cbd5e1" stroke-width="1.5"/>
      ${ticks}
    `;
  }

  return `
    <div class="angle-protractor-wrap" data-angle-root="true" data-angle="${deg}" data-mode="${mode}" data-protractor="${showProtractor}">
      <div class="coord-header">
        <span class="coord-title">📐 Dynamic Angle &amp; Protractor Studio</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:${classification.color}20; color:${classification.color}; font-weight:800; font-size:0.9rem">
            ${deg}° · ${classification.label}
          </span>
          ${pairedAngleBadge}
        </div>
      </div>

      <div class="tri-shear-slider-row">
        <label for="angle-slider" style="font-size:0.8rem; font-weight:700; color:#475569">Rotate Ray (0° to 180°):</label>
        <input type="range" id="angle-slider" class="tri-shear-slider" min="0" max="180" value="${deg}" aria-label="Angle measurement in degrees" />
        <span style="font-weight:800; min-width:45px; text-align:right">${deg}°</span>
      </div>

      <div class="coord-stage-box" style="height:210px">
        <svg viewBox="0 0 380 200" role="img" aria-label="Angle measured at ${deg} degrees">
          <!-- Protractor -->
          ${protractorSvg}

          <!-- Base horizontal ray (0 degrees) -->
          <line x1="${cx}" y1="${cy}" x2="${cx + rayLen}" y2="${cy}" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/>
          <circle cx="${cx + rayLen}" cy="${cy}" r="4" fill="#1e293b"/>

          <!-- Paired Ray (Complement / Supplement) -->
          ${pairedRay}

          <!-- Active Angle Arc -->
          ${deg > 0 ? `<path d="${arcPath}" fill="rgba(37, 99, 235, 0.15)" stroke="#2563eb" stroke-width="2"/>` : ""}

          <!-- Rotatable Ray -->
          <line x1="${cx}" y1="${cy}" x2="${rx}" y2="${ry}" stroke="#2563eb" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="${rx}" cy="${ry}" r="7" fill="#3b82f6" stroke="#ffffff" stroke-width="2" class="coord-point-handle" title="Movable Ray Vertex"/>

          <!-- Vertex Pivot -->
          <circle cx="${cx}" cy="${cy}" r="6" fill="#0f172a"/>
          <text x="${cx - 15}" y="${cy + 15}" font-size="11" font-weight="800" fill="#334155">Vertex</text>
        </svg>
      </div>

      <div class="coord-controls-row">
        <button type="button" class="coord-btn ${mode === "single" ? "is-highlighted" : ""}" data-angle-mode="single">Standard (0°–180°)</button>
        <button type="button" class="coord-btn ${mode === "complementary" ? "is-highlighted" : ""}" data-angle-mode="complementary">Complementary (90°)</button>
        <button type="button" class="coord-btn ${mode === "supplementary" ? "is-highlighted" : ""}" data-angle-mode="supplementary">Supplementary (180°)</button>
        <button type="button" class="coord-btn" data-angle-preset="90">Snap 90° (Right)</button>
        <button type="button" class="coord-btn" data-angle-preset="45">Snap 45°</button>
      </div>
    </div>
  `;
}

export function mountAngleProtractor(container, onChange) {
  if (!container) return;
  const root = container.matches("[data-angle-root]") ? container : container.querySelector("[data-angle-root]");
  if (!root) return;

  let deg = Number(root.dataset.angle) || 45;
  let mode = root.dataset.mode || "single";
  let showProtractor = root.dataset.protractor !== "false";

  const update = () => {
    root.outerHTML = renderAngleProtractor({ angle: deg, mode, showProtractor });
    const updated = container.querySelector("[data-angle-root]") || container;
    mountAngleProtractor(updated, onChange);
    if (onChange) onChange({ angle: deg, mode });
  };

  const slider = root.querySelector("#angle-slider");
  if (slider) {
    slider.addEventListener("input", (e) => {
      deg = Number(e.target.value);
      update();
    });
  }

  root.querySelectorAll("[data-angle-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.angleMode;
      update();
    });
  });

  root.querySelectorAll("[data-angle-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      deg = Number(btn.dataset.anglePreset);
      update();
    });
  });
}
