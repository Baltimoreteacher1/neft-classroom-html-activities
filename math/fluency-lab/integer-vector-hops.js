// Interactive Directed Integer Vector Line (Grade 7 Number System)
// Visualizes directed integer operations: a + b, a - b, a + (-b), and a - (-b)
// using directional vector arrows and walking-robot orientation (facing & stepping).

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export function evaluateIntegerOperation(a, op, b) {
  const result = op === "+" ? a + b : a - b;
  let explanation = "";
  if (op === "+") {
    explanation = b >= 0
      ? `Start at 0, move ${a} to ${a}. Then move right ${b} to land at ${result}.`
      : `Start at 0, move ${a} to ${a}. Adding negative ${Math.abs(b)} moves left to land at ${result}.`;
  } else {
    explanation = b >= 0
      ? `Start at ${a}. Subtracting positive ${b} moves left ${b} to land at ${result}.`
      : `Start at ${a}. Subtracting negative ${Math.abs(b)} reverses direction and moves right ${Math.abs(b)} to land at ${result}!`;
  }
  return { a, op, b, result, explanation };
}

export function renderIntegerVectorHops(state = {}) {
  const {
    a = -3,
    op = "-",
    b = -5,
  } = state;

  const validA = Math.max(-10, Math.min(10, a));
  const validB = Math.max(-10, Math.min(10, b));
  const opData = evaluateIntegerOperation(validA, op, validB);

  // SVG dimensions: line from -12 to +12
  const minVal = -12;
  const maxVal = 12;
  const svgWidth = 380;
  const lineY = 110;
  const xPos = (val) => 30 + ((val - minVal) / (maxVal - minVal)) * 320;

  // Axis ticks
  const ticks = [];
  for (let v = -10; v <= 10; v += 2) {
    const tx = xPos(v);
    const isZero = v === 0;
    ticks.push(`
      <line x1="${tx}" y1="${lineY - 6}" x2="${tx}" y2="${lineY + 6}" stroke="${isZero ? "#1e293b" : "#94a3b8"}" stroke-width="${isZero ? 2.5 : 1}"/>
      <text x="${tx}" y="${lineY + 20}" text-anchor="middle" font-size="${isZero ? 11 : 9}" font-weight="${isZero ? 800 : 600}" fill="${isZero ? "#1e293b" : "#64748b"}">${v}</text>
    `);
  }

  // Vector 1: from 0 to a (Blue)
  const x0 = xPos(0);
  const xA = xPos(validA);
  const yA = lineY - 30;

  // Vector 2: from a to result (Amber / Purple)
  const xRes = xPos(opData.result);
  const yB = lineY - 55;

  const arrowA = `
    <line x1="${x0}" y1="${yA}" x2="${xA}" y2="${yA}" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${xA}" cy="${yA}" r="4" fill="#2563eb"/>
    <text x="${(x0 + xA) / 2}" y="${yA - 6}" text-anchor="middle" font-size="11" font-weight="800" fill="#1e40af">Start: ${validA}</text>
  `;

  const arrowB = `
    <line x1="${xA}" y1="${yB}" x2="${xRes}" y2="${yB}" stroke="#d97706" stroke-width="3" stroke-dasharray="4,4" stroke-linecap="round"/>
    <circle cx="${xRes}" cy="${yB}" r="4" fill="#d97706"/>
    <text x="${(xA + xRes) / 2}" y="${yB - 6}" text-anchor="middle" font-size="11" font-weight="800" fill="#b45309">
      ${op} (${validB >= 0 ? "+" + validB : validB})
    </text>
  `;

  return `
    <div class="integer-vector-wrap" data-int-root="true" data-a="${validA}" data-op="${op}" data-b="${validB}">
      <div class="coord-header">
        <span class="coord-title">🔵🔴 Directed Integer Vector Line</span>
        <div class="coord-badges">
          <span class="coord-badge" style="background:#eff6ff; color:#1e40af">${validA < 0 ? `(${validA})` : validA} ${op} ${validB < 0 ? `(${validB})` : validB}</span>
          <span class="coord-badge" style="background:#ecfdf5; color:#065f46; font-weight:800; font-size:0.95rem">
            = ${opData.result}
          </span>
        </div>
      </div>

      <div class="coord-stage-box" style="height:190px">
        <svg viewBox="0 0 380 180" role="img" aria-label="Directed integer vector number line">
          <!-- Main Number line -->
          <line x1="20" y1="${lineY}" x2="360" y2="${lineY}" stroke="#1e293b" stroke-width="2"/>
          <polygon points="365,${lineY} 357,${lineY - 4} 357,${lineY + 4}" fill="#1e293b"/>
          <polygon points="15,${lineY} 23,${lineY - 4} 23,${lineY + 4}" fill="#1e293b"/>
          ${ticks.join("")}

          <!-- Drop lines down to axis -->
          <line x1="${x0}" y1="${lineY}" x2="${x0}" y2="${yA}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2"/>
          <line x1="${xA}" y1="${lineY}" x2="${xA}" y2="${yB}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2"/>
          <line x1="${xRes}" y1="${lineY}" x2="${xRes}" y2="${yB}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2"/>

          <!-- Target Landing marker on line -->
          <circle cx="${xRes}" cy="${lineY}" r="6" fill="#10b981" stroke="#047857" stroke-width="2"/>

          <!-- Vectors -->
          ${arrowA}
          ${arrowB}
        </svg>
      </div>

      <div style="font-size:0.85rem; color:#334155; background:#ffffff; border:1px solid #cbd5e1; border-radius:6px; padding:6px 10px">
        💡 <strong>Concept Insight:</strong> ${esc(opData.explanation)}
      </div>

      <div class="tri-shear-slider-row">
        <label for="int-slider-a" style="font-size:0.85rem; font-weight:700; color:#1e40af">1st Integer (a):</label>
        <input type="range" id="int-slider-a" class="tri-shear-slider" min="-10" max="10" value="${validA}" aria-label="First integer" />
        <span style="font-size:0.85rem; font-weight:800; color:#2563eb; width:25px">${validA}</span>

        <button type="button" class="coord-btn" id="int-toggle-op" style="margin:0 0.5rem; font-weight:900; font-size:1.1rem">
          ${op}
        </button>

        <label for="int-slider-b" style="font-size:0.85rem; font-weight:700; color:#b45309">2nd Integer (b):</label>
        <input type="range" id="int-slider-b" class="tri-shear-slider" min="-10" max="10" value="${validB}" aria-label="Second integer" />
        <span style="font-size:0.85rem; font-weight:800; color:#d97706; width:25px">${validB}</span>
      </div>

      <div class="coord-controls-row">
        <span style="font-size:0.8rem; font-weight:700; color:#475569">Common Tricky Cases:</span>
        <button type="button" class="coord-btn" data-preset="-3:-:-5">(-3) − (-5) = +2</button>
        <button type="button" class="coord-btn" data-preset="4:+:-7">4 + (-7) = -3</button>
        <button type="button" class="coord-btn" data-preset="-2:-:6">(-2) − 6 = -8</button>
        <button type="button" class="coord-btn" data-preset="-4:+:4">(-4) + 4 = 0 (Zero Pair)</button>
      </div>
    </div>
  `;
}

export function mountIntegerVectorHops(container) {
  if (!container) return;
  const root = container.querySelector('[data-int-root="true"]');
  if (!root) return;

  const a = Number(root.dataset.a) || 0;
  const op = root.dataset.op || "+";
  const b = Number(root.dataset.b) || 0;

  const sliderA = root.querySelector("#int-slider-a");
  if (sliderA) {
    sliderA.addEventListener("input", (e) => {
      const valA = Number(e.target.value);
      root.outerHTML = renderIntegerVectorHops({ a: valA, op, b });
      mountIntegerVectorHops(container);
    });
  }

  const sliderB = root.querySelector("#int-slider-b");
  if (sliderB) {
    sliderB.addEventListener("input", (e) => {
      const valB = Number(e.target.value);
      root.outerHTML = renderIntegerVectorHops({ a, op, b: valB });
      mountIntegerVectorHops(container);
    });
  }

  const toggleOp = root.querySelector("#int-toggle-op");
  if (toggleOp) {
    toggleOp.addEventListener("click", () => {
      const nextOp = op === "+" ? "-" : "+";
      root.outerHTML = renderIntegerVectorHops({ a, op: nextOp, b });
      mountIntegerVectorHops(container);
    });
  }

  root.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const [pA, pOp, pB] = btn.dataset.preset.split(":");
      root.outerHTML = renderIntegerVectorHops({ a: Number(pA), op: pOp, b: Number(pB) });
      mountIntegerVectorHops(container);
    });
  });
}
