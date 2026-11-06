// Unit Circle to Sine & Cosine Wave Dynamic Harmonograph (Grades 7–8 Algebra & Functions)
// Direct-manipulation phasor on unit circle projecting orthogonal coordinates onto continuous sinusoidal wave graphs.
// Visually proves how circular motion unfolds into wave mechanics: y = A sin(ωθ).

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function computeTrigState(deg) {
  const rad = (deg * Math.PI) / 180;
  const sinVal = Math.sin(rad);
  const cosVal = Math.cos(rad);
  const tanVal = Math.abs(cosVal) > 0.001 ? Math.tan(rad) : null;

  return {
    deg,
    rad,
    sinVal,
    cosVal,
    tanVal,
    formattedSin: sinVal.toFixed(3),
    formattedCos: cosVal.toFixed(3),
    formattedTan: tanVal !== null ? tanVal.toFixed(3) : "Undefined",
  };
}

export function renderTrigWaveStudio(state = {}) {
  const {
    angle = 45, // in degrees 0 to 360
  } = state;

  const deg = Math.max(0, Math.min(360, angle));
  const trig = computeTrigState(deg);

  // Unit Circle (Center ox=70, oy=100, radius r=45)
  const ox = 70;
  const oy = 100;
  const r = 45;

  const px = ox + r * trig.cosVal;
  const py = oy - r * trig.sinVal; // SVG y goes down

  // Continuous Sine Wave to the right (x from 150 to 350, length 200 px = 360 degrees)
  const waveStartX = 150;
  const waveLength = 200;

  const wavePoints = [];
  for (let d = 0; d <= 360; d += 10) {
    const wx = waveStartX + (d / 360) * waveLength;
    const wy = oy - r * Math.sin((d * Math.PI) / 180);
    wavePoints.push(`${wx},${wy}`);
  }

  // Current tracer point on wave
  const waveCurrX = waveStartX + (deg / 360) * waveLength;
  const waveCurrY = py;

  return `
    <div class="trig-wave-wrap" data-trig-root="true" data-angle="${deg}">
      <div class="coord-header">
        <span class="coord-title">🌊 Unit Circle &amp; Sine Wave Harmonograph</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">θ = ${deg}°</span>
          <span class="coord-badge" style="background:#fef2f2; color:#b91c1c; font-weight:800">sin(θ) = ${trig.formattedSin}</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46">cos(θ) = ${trig.formattedCos}</span>
        </div>
      </div>

      <div class="coord-stage-box" style="height:210px">
        <svg viewBox="0 0 380 200" role="img" aria-label="Unit circle unfolding to sine wave">
          <!-- Circle Axes -->
          <line x1="${ox - r - 15}" y1="${oy}" x2="${ox + r + 15}" y2="${oy}" stroke="#cbd5e1" stroke-width="1.5"/>
          <line x1="${ox}" y1="${oy - r - 15}" x2="${ox}" y2="${oy + r + 15}" stroke="#cbd5e1" stroke-width="1.5"/>

          <!-- Unit Circle -->
          <circle cx="${ox}" cy="${oy}" r="${r}" fill="rgba(241, 245, 249, 0.4)" stroke="#3b82f6" stroke-width="2"/>

          <!-- Phasor Radius Arm -->
          <line x1="${ox}" y1="${oy}" x2="${px}" y2="${py}" stroke="#1e293b" stroke-width="2.5"/>

          <!-- Vertical Sin Component (Red) -->
          <line x1="${px}" y1="${oy}" x2="${px}" y2="${py}" stroke="#ef4444" stroke-width="3"/>

          <!-- Horizontal Cos Component (Green) -->
          <line x1="${ox}" y1="${oy}" x2="${px}" y2="${oy}" stroke="#10b981" stroke-width="3"/>

          <!-- Rotating Tip Point -->
          <circle cx="${px}" cy="${py}" r="5" fill="#dc2626"/>

          <!-- Wave Coordinate Grid -->
          <line x1="${waveStartX}" y1="${oy}" x2="${waveStartX + waveLength}" y2="${oy}" stroke="#94a3b8" stroke-width="1.5"/>
          <text x="${waveStartX}" y="${oy + 14}" font-size="9" fill="#64748b">0°</text>
          <text x="${waveStartX + waveLength / 2}" y="${oy + 14}" text-anchor="middle" font-size="9" fill="#64748b">180°</text>
          <text x="${waveStartX + waveLength}" y="${oy + 14}" text-anchor="middle" font-size="9" fill="#64748b">360°</text>

          <!-- Wave Curve -->
          <polyline points="${wavePoints.join(" ")}" fill="none" stroke="#93c5fd" stroke-width="2" stroke-dasharray="2,2"/>

          <!-- Horizontal Projection Laser Line -->
          <line x1="${px}" y1="${py}" x2="${waveCurrX}" y2="${waveCurrY}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3"/>

          <!-- Trace Point on Wave -->
          <circle cx="${waveCurrX}" cy="${waveCurrY}" r="5" fill="#ef4444"/>
        </svg>
      </div>

      <div class="tri-shear-slider-row">
        <label for="trig-angle-slider" style="font-size:0.85rem; font-weight:700; color:#1e40af">Rotation Angle (θ):</label>
        <input type="range" id="trig-angle-slider" class="tri-shear-slider" min="0" max="360" value="${deg}" aria-label="Angle in degrees" />
        <span style="font-size:0.85rem; font-weight:800; color:#2563eb; width:45px">${deg}°</span>
      </div>

      <div class="coord-controls-row">
        <span style="font-size:0.8rem; font-weight:700; color:#475569">Cardinal Angles:</span>
        <button type="button" class="coord-btn" data-trig-angle="0">0°</button>
        <button type="button" class="coord-btn" data-trig-angle="90">90° (π/2)</button>
        <button type="button" class="coord-btn" data-trig-angle="180">180° (π)</button>
        <button type="button" class="coord-btn" data-trig-angle="270">270° (3π/2)</button>
        <button type="button" class="coord-btn" data-trig-angle="360">360° (2π)</button>
      </div>
    </div>
  `;
}

export function mountTrigWaveStudio(container) {
  if (!container) return;
  const root = container.querySelector('[data-trig-root="true"]');
  if (!root) return;

  const slider = root.querySelector("#trig-angle-slider");
  if (slider) {
    slider.addEventListener("input", (e) => {
      const a = Number(e.target.value);
      root.outerHTML = renderTrigWaveStudio({ angle: a });
      mountTrigWaveStudio(container);
    });
  }

  root.querySelectorAll("[data-trig-angle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const a = Number(btn.dataset.trigAngle);
      root.outerHTML = renderTrigWaveStudio({ angle: a });
      mountTrigWaveStudio(container);
    });
  });
}
