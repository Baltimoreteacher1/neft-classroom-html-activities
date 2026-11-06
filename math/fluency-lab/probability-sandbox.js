// Interactive Probability Spinner & Law of Large Numbers (Grade 7 Statistics & Probability)
// Direct-manipulation probability spinner, high-speed Monte Carlo simulation,
// and live convergence to theoretical probability.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const DEFAULT_SECTORS = [
  { id: "red", label: "Red (½ = 50%)", p: 0.5, color: "#ef4444", stroke: "#b91c1c" },
  { id: "blue", label: "Blue (¼ = 25%)", p: 0.25, color: "#3b82f6", stroke: "#1d4ed8" },
  { id: "green", label: "Green (¼ = 25%)", p: 0.25, color: "#10b981", stroke: "#047857" },
];

export function renderProbabilitySandbox(state = {}) {
  const {
    sectors = DEFAULT_SECTORS,
    spins = 0,
    counts = { red: 0, blue: 0, green: 0 },
    arrowAngle = 0,
  } = state;

  const totalSpins = Math.max(1, spins);

  // SVG pie sectors (cx=100, cy=100, r=80)
  const cx = 100;
  const cy = 100;
  const r = 80;
  let currentAngle = 0;

  const sectorPaths = sectors.map((sec) => {
    const sweep = sec.p * 360;
    const startRad = (currentAngle * Math.PI) / 180;
    const endRad = ((currentAngle + sweep) * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = sweep > 180 ? 1 : 0;
    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    currentAngle += sweep;

    return `<path d="${pathData}" fill="${sec.color}" stroke="${sec.stroke}" stroke-width="1.5" opacity="0.9"/>`;
  }).join("");

  // Pointer arrow at arrowAngle
  const arrowRad = (arrowAngle * Math.PI) / 180;
  const ax = cx + (r - 10) * Math.cos(arrowRad);
  const ay = cy + (r - 10) * Math.sin(arrowRad);

  // Frequency rows
  const freqRows = sectors.map((sec) => {
    const count = counts[sec.id] || 0;
    const expProb = spins > 0 ? ((count / spins) * 100).toFixed(1) : "0.0";
    const theoProb = (sec.p * 100).toFixed(1);
    const diff = spins > 0 ? Math.abs(expProb - theoProb).toFixed(1) : "—";

    return `
      <div class="prob-stat-row">
        <div class="prob-stat-label">
          <span class="prob-color-dot" style="background:${sec.color}"></span>
          <strong>${sec.id.toUpperCase()}</strong>
        </div>
        <div class="prob-stat-bar-track">
          <div class="prob-stat-bar-fill" style="width:${expProb}%; background:${sec.color}"></div>
        </div>
        <div class="prob-stat-values">
          <span>${count} spins (${expProb}%)</span>
          <small style="color:#64748b">Target: ${theoProb}% (Δ ${diff}%)</small>
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="prob-sandbox-wrap" data-prob-root="true" data-spins="${spins}"
         data-r="${counts.red || 0}" data-b="${counts.blue || 0}" data-g="${counts.green || 0}"
         data-angle="${arrowAngle}">
      <div class="coord-header">
        <span class="coord-title">🎲 Probability Spinner &amp; Law of Large Numbers</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af; font-weight:800">Total Spins: ${spins}</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46">
            ${spins >= 100 ? "✨ High Sample: Experimental matches Theoretical!" : "Spin more to see the Law of Large Numbers!"}
          </span>
        </div>
      </div>

      <div class="prob-stage-grid">
        <!-- Spinner Visual -->
        <div class="prob-spinner-box">
          <svg viewBox="0 0 200 200" role="img" aria-label="Probability spinner">
            ${sectorPaths}
            <!-- Outer Ring -->
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e293b" stroke-width="3"/>
            <!-- Arrow -->
            <line x1="${cx}" y1="${cy}" x2="${ax}" y2="${ay}" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
            <polygon points="${ax},${ay} ${ax - 6 * Math.sin(arrowRad)},${ay + 6 * Math.cos(arrowRad)} ${ax + 6 * Math.sin(arrowRad)},${ay - 6 * Math.cos(arrowRad)}" fill="#0f172a"/>
            <!-- Center Pin -->
            <circle cx="${cx}" cy="${cy}" r="7" fill="#ffffff" stroke="#0f172a" stroke-width="2.5"/>
          </svg>
        </div>

        <!-- Frequency Distribution Stats -->
        <div class="prob-stats-column">
          ${freqRows}
        </div>
      </div>

      <div class="coord-controls-row">
        <button type="button" class="coord-btn is-highlighted" data-spin-count="1">🎯 Spin 1×</button>
        <button type="button" class="coord-btn" data-spin-count="20">⚡ Simulate 20×</button>
        <button type="button" class="coord-btn" data-spin-count="100">🚀 Simulate 100×</button>
        <button type="button" class="coord-btn" data-spin-count="500">🔥 Simulate 500×</button>
        <button type="button" class="coord-btn" data-spin-reset="true">🔄 Reset Trials</button>
      </div>
    </div>
  `;
}

export function mountProbabilitySandbox(container, onSpin) {
  if (!container) return;
  const root = container.matches("[data-prob-root]") ? container : container.querySelector("[data-prob-root]");
  if (!root) return;

  let spins = Number(root.dataset.spins) || 0;
  let counts = {
    red: Number(root.dataset.r) || 0,
    blue: Number(root.dataset.b) || 0,
    green: Number(root.dataset.g) || 0,
  };
  let arrowAngle = Number(root.dataset.angle) || 0;

  const runSpins = (batch) => {
    for (let i = 0; i < batch; i++) {
      const rnd = Math.random();
      if (rnd < 0.5) counts.red++;
      else if (rnd < 0.75) counts.blue++;
      else counts.green++;
    }
    spins += batch;
    arrowAngle = (arrowAngle + 120 + Math.floor(Math.random() * 360)) % 360;

    root.outerHTML = renderProbabilitySandbox({ spins, counts, arrowAngle });
    const updated = container.querySelector("[data-prob-root]") || container;
    mountProbabilitySandbox(updated, onSpin);
    if (onSpin) onSpin({ spins, counts });
  };

  root.querySelectorAll("[data-spin-count]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const count = Number(btn.dataset.spinCount) || 1;
      runSpins(count);
    });
  });

  root.querySelector("[data-spin-reset]")?.addEventListener("click", () => {
    spins = 0;
    counts = { red: 0, blue: 0, green: 0 };
    arrowAngle = 0;
    root.outerHTML = renderProbabilitySandbox({ spins, counts, arrowAngle });
    const updated = container.querySelector("[data-prob-root]") || container;
    mountProbabilitySandbox(updated, onSpin);
    if (onSpin) onSpin({ spins, counts });
  });
}
