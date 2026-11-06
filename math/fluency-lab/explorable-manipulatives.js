// Explorable Manipulatives & Slicers (Stage 1 Enhancements)
// Direct-manipulation math sandboxes: dynamic fraction slicer, scrubbable area decomposition, and micro-physics pan balance.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/**
 * 1. DYNAMIC FRACTION SLICER
 * Cuts a fraction a/b into k equal slices (a*k)/(b*k), demonstrating that multiplying numerator
 * and denominator by the same factor preserves the total quantity of the whole.
 */
export function renderFractionSlicer(a, b, k = 1) {
  const mult = Math.max(1, Math.min(6, k));
  const newNum = a * mult;
  const newDen = b * mult;
  const totalSlices = newDen;
  const shadedSlices = newNum;
  const slicePercent = (100 / totalSlices).toFixed(3);

  const pills = [1, 2, 3, 4, 5, 6].map((factor) => {
    const active = factor === mult;
    return `
      <button type="button" class="expl-slicer-pill ${active ? "is-active" : ""}"
        data-slicer-factor="${factor}" aria-pressed="${active}"
        aria-label="Cut each piece into ${factor} sub-slices">
        ${factor === 1 ? "Original (1×)" : `Cut ×${factor}`}
      </button>
    `;
  }).join("");

  const slices = Array.from({ length: totalSlices }, (_, i) => {
    const isShaded = i < shadedSlices;
    return `
      <div class="expl-slicer-slice ${isShaded ? "shaded" : "unshaded"}"
           style="width: ${slicePercent}%"
           title="Piece ${i + 1} of ${totalSlices} (${isShaded ? "shaded" : "unshaded"})">
        ${totalSlices <= 12 ? (isShaded ? "1" : "") : ""}
      </div>
    `;
  }).join("");

  return `
    <div class="expl-slicer-wrap" data-slicer-root="true" data-num="${a}" data-den="${b}" data-mult="${mult}">
      <div class="expl-slicer-top-bar">
        <div class="expl-inputs-bar">
          <label>Fraction to slice:</label>
          <input type="number" min="1" max="12" value="${a}" class="expl-num-in" data-slicer-in="a" aria-label="Numerator" />
          <span>/</span>
          <input type="number" min="1" max="12" value="${b}" class="expl-num-in" data-slicer-in="b" aria-label="Denominator" />
          <button type="button" class="expl-update-btn" data-slicer-update="true">Apply</button>
        </div>
        <div class="expl-slicer-controls">
          <span class="expl-slicer-label">✂️ Slices:</span>
          <div class="expl-slicer-pills" role="group" aria-label="Slice multiplier">
            ${pills}
          </div>
        </div>
      </div>
      <div class="expl-slicer-bar-track" role="img" aria-label="${newNum} out of ${newDen} parts shaded (${a}/${b} partitioned by ${mult})">
        ${slices}
      </div>
      <div class="expl-slicer-equation-badge" role="status">
        <span>${a}/${b}</span>
        <span aria-hidden="true">×</span>
        <span>${mult}/${mult}</span>
        <span aria-hidden="true">=</span>
        <strong style="color: #2563eb; font-size: 1.05rem">${newNum}/${newDen}</strong>
        <span style="font-size: 0.8rem; font-weight: 500; color: #64748b; margin-left: 0.5rem">
          (Same shaded area, smaller pieces!)
        </span>
      </div>
    </div>
  `;
}

export function mountFractionSlicer(container, onSliceChange) {
  if (!container) return;
  const root = container.matches("[data-slicer-root]") ? container : container.querySelector("[data-slicer-root]");
  if (!root) return;

  const a = Number(root.dataset.num) || 1;
  const b = Number(root.dataset.den) || 2;

  root.querySelectorAll("[data-slicer-factor]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const factor = Number(btn.dataset.slicerFactor) || 1;
      const html = renderFractionSlicer(a, b, factor);
      root.outerHTML = html;
      const updated = container.querySelector("[data-slicer-root]") || container;
      mountFractionSlicer(updated, onSliceChange);
      if (onSliceChange) onSliceChange(factor, a * factor, b * factor);
    });
  });

  const updateFraction = () => {
    const inA = Number(root.querySelector("[data-slicer-in='a']")?.value || a);
    const inB = Number(root.querySelector("[data-slicer-in='b']")?.value || b);
    const mult = Number(root.dataset.mult) || 1;
    root.outerHTML = renderFractionSlicer(inA, inB, mult);
    const updated = container.querySelector("[data-slicer-root]") || container;
    mountFractionSlicer(updated, onSliceChange);
  };
  root.querySelector("[data-slicer-update]")?.addEventListener("click", updateFraction);
}

/**
 * 2. SCRUBBABLE PARTIAL PRODUCT AREA MODEL
 * Splits a dimension (e.g. 14 × 18) into two friendly parts (e.g. 10 + 4), recalculating
 * partial areas and showing the Distributive Property in real time.
 */
export function renderScrubbableAreaModel(small, big, split1 = null) {
  const minSplit = 1;
  const maxSplit = big - 1;
  const defaultSplit = split1 != null ? split1 : (big > 10 ? 10 : (big > 5 ? 5 : Math.floor(big / 2) || 1));
  const s1 = Math.max(minSplit, Math.min(maxSplit, defaultSplit));
  const s2 = big - s1;
  const p1 = small * s1;
  const p2 = small * s2;
  const total = small * big;

  // Compute SVG proportional widths
  const stageWidth = 360;
  const stageHeight = 100;
  const margin = 20;
  const innerWidth = stageWidth - margin * 2;
  const innerHeight = stageHeight - margin * 2;
  const w1 = Math.round((s1 / big) * innerWidth);
  const w2 = innerWidth - w1;

  return `
    <div class="expl-scrubber-wrap" data-scrubber-root="true" data-small="${small}" data-big="${big}" data-s1="${s1}">
      <div class="expl-scrubber-header">
        <span class="expl-scrubber-title">📦 Scrubbable Area Model: ${small} × ${big}</span>
        <span class="expl-scrubber-split-indicator">Split ${big} = <strong>${s1}</strong> + <strong>${s2}</strong></span>
      </div>
      <div class="expl-inputs-bar">
        <label>Dimensions:</label>
        <input type="number" min="2" max="30" value="${small}" class="expl-num-in" data-area-in="small" aria-label="Height"/>
        <span>×</span>
        <input type="number" min="3" max="50" value="${big}" class="expl-num-in" data-area-in="big" aria-label="Width"/>
        <button type="button" class="expl-update-btn" data-area-update="true">Apply</button>
      </div>
      <div class="expl-scrubber-slider-row">
        <label for="expl-area-slider" style="font-size:0.8rem; font-weight:700; color:#475569">Divider:</label>
        <input type="range" id="expl-area-slider" class="expl-scrubber-slider"
          min="${minSplit}" max="${maxSplit}" value="${s1}"
          aria-label="Partition divider for ${big}" />
      </div>
      <div class="expl-area-svg-stage">
        <svg width="100%" height="${stageHeight}" viewBox="0 0 ${stageWidth} ${stageHeight}" role="img" aria-label="Decomposition of ${small} times ${big} into ${small} times ${s1} and ${small} times ${s2}">
          <!-- Left partial product box -->
          <rect x="${margin}" y="${margin}" width="${w1}" height="${innerHeight}" rx="4" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
          <text x="${margin + w1 / 2}" y="${margin + innerHeight / 2 - 6}" text-anchor="middle" font-size="11" font-weight="800" fill="#047857">${small} × ${s1}</text>
          <text x="${margin + w1 / 2}" y="${margin + innerHeight / 2 + 12}" text-anchor="middle" font-size="13" font-weight="900" fill="#065f46">= ${p1}</text>

          <!-- Right partial product box -->
          <rect x="${margin + w1}" y="${margin}" width="${w2}" height="${innerHeight}" rx="4" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
          <text x="${margin + w1 + w2 / 2}" y="${margin + innerHeight / 2 - 6}" text-anchor="middle" font-size="11" font-weight="800" fill="#1d4ed8">${small} × ${s2}</text>
          <text x="${margin + w1 + w2 / 2}" y="${margin + innerHeight / 2 + 12}" text-anchor="middle" font-size="13" font-weight="900" fill="#1e40af">= ${p2}</text>
        </svg>
      </div>
      <div class="expl-slicer-equation-badge" role="status">
        <span>(${small} × ${s1}) + (${small} × ${s2})</span>
        <span aria-hidden="true">=</span>
        <span>${p1} + ${p2}</span>
        <span aria-hidden="true">=</span>
        <strong style="color: #059669; font-size: 1.05rem">${total}</strong>
      </div>
    </div>
  `;
}

export function mountScrubbableAreaModel(container, onSplitChange) {
  if (!container) return;
  const root = container.matches("[data-scrubber-root]") ? container : container.querySelector("[data-scrubber-root]");
  if (!root) return;

  const small = Number(root.dataset.small) || 6;
  const big = Number(root.dataset.big) || 14;
  const slider = root.querySelector("#expl-area-slider");
  if (!slider) return;

  slider.addEventListener("input", (e) => {
    const s1 = Number(e.target.value);
    const html = renderScrubbableAreaModel(small, big, s1);
    root.outerHTML = html;
    const updated = container.querySelector("[data-scrubber-root]") || container;
    mountScrubbableAreaModel(updated, onSplitChange);
    if (onSplitChange) onSplitChange(s1, big - s1);
  });

  const updateArea = () => {
    const inSmall = Number(root.querySelector("[data-area-in='small']")?.value || small);
    const inBig = Number(root.querySelector("[data-area-in='big']")?.value || big);
    const html = renderScrubbableAreaModel(inSmall, inBig);
    root.outerHTML = html;
    const updated = container.querySelector("[data-scrubber-root]") || container;
    mountScrubbableAreaModel(updated, onSplitChange);
  };
  root.querySelector("[data-area-update]")?.addEventListener("click", updateArea);
}

/**
 * 3. MICRO-PHYSICS PAN BALANCE SCALE
 * Models linear equations like ax + b = c. Demonstrates that doing the same operation
 * to BOTH sides preserves equality (0 deg tilt), while an unequal operation tips the beam.
 */
export function renderPhysicsBalance(state = {}) {
  const {
    varName = "x",
    coeff = 2,
    constant = 6,
    rightTotal = 14,
    leftRemoved = 0,
    rightRemoved = 0,
    leftDivided = false,
    rightDivided = false,
  } = state;

  const currentLeftConst = Math.max(0, constant - leftRemoved);
  const currentRightConst = Math.max(0, rightTotal - rightRemoved);

  // Effective weight calculation: let x = 4 (the true value)
  const trueX = (rightTotal - constant) / coeff;
  const effectiveLeft = coeff * trueX + currentLeftConst;
  const effectiveRight = currentRightConst;

  // Tilt in degrees: 0 = balanced, positive = right heavy (clockwise), negative = left heavy
  let tilt = 0;
  if (effectiveLeft > effectiveRight) tilt = -9;
  else if (effectiveLeft < effectiveRight) tilt = 9;

  const isBalanced = tilt === 0;

  return `
    <div class="expl-physics-balance-wrap" data-balance-root="true"
         data-coeff="${coeff}" data-constant="${constant}" data-right="${rightTotal}"
         data-lrem="${leftRemoved}" data-rrem="${rightRemoved}">
      <div class="expl-scrubber-header">
        <span class="expl-scrubber-title">⚖️ Dynamic Equation Balance: ${coeff}${varName} + ${constant} = ${rightTotal}</span>
        <span class="expl-bal-status-alert ${isBalanced ? "balanced" : "unbalanced"}">
          ${isBalanced ? "✅ Perfectly Balanced (Equal Sides)" : "⚠️ Unbalanced! Operations must match on both sides."}
        </span>
      </div>

      <div class="expl-inputs-bar">
        <label>Set Equation:</label>
        <input type="number" min="1" max="10" value="${coeff}" class="expl-num-in" data-bal-in="coeff" aria-label="Coefficient" />
        <span>x +</span>
        <input type="number" min="0" max="25" value="${constant}" class="expl-num-in" data-bal-in="constant" aria-label="Constant" />
        <span>=</span>
        <input type="number" min="1" max="60" value="${rightTotal}" class="expl-num-in" data-bal-in="right" aria-label="Right total" />
        <button type="button" class="expl-update-btn" data-bal-update="true">Balance</button>
      </div>

      <div style="position:relative; width:100%; height:120px; overflow:hidden">
        <svg class="expl-balance-beam-svg" style="transform: rotate(${tilt}deg)" viewBox="0 0 380 120" role="img" aria-label="Balance scale tilted ${tilt} degrees">
          <!-- Fulcrum base -->
          <polygon points="190,45 175,95 205,95" fill="#64748b"/>
          <!-- Central pivot pin -->
          <circle cx="190" cy="45" r="5" fill="#0f172a"/>
          <!-- Horizontal beam -->
          <line x1="40" y1="45" x2="340" y2="45" stroke="#1e293b" stroke-width="5" stroke-linecap="round"/>
          
          <!-- Left Pan hanger -->
          <line x1="75" y1="45" x2="75" y2="80" stroke="#94a3b8" stroke-width="2"/>
          <line x1="50" y1="80" x2="100" y2="80" stroke="#475569" stroke-width="3"/>
          <rect x="45" y="60" width="60" height="20" rx="3" fill="#dbeafe" stroke="#3b82f6" stroke-width="1.5"/>
          <text x="75" y="74" text-anchor="middle" font-size="11" font-weight="800" fill="#1e40af">${coeff}${varName} + ${currentLeftConst}</text>

          <!-- Right Pan hanger -->
          <line x1="305" y1="45" x2="305" y2="80" stroke="#94a3b8" stroke-width="2"/>
          <line x1="280" y1="80" x2="330" y2="80" stroke="#475569" stroke-width="3"/>
          <rect x="275" y="60" width="60" height="20" rx="3" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
          <text x="305" y="74" text-anchor="middle" font-size="11" font-weight="800" fill="#065f46">${currentRightConst}</text>
        </svg>
      </div>

      <div class="expl-balance-actions">
        <button type="button" class="expl-bal-btn" data-bal-act="sub-both" ${leftRemoved > 0 ? "disabled" : ""}>
          ➖ Subtract ${constant} from Both Sides
        </button>
        <button type="button" class="expl-bal-btn" data-bal-act="sub-left-only" ${leftRemoved > 0 ? "disabled" : ""}>
          ⚠️ Subtract from Left Only (Watch it tilt!)
        </button>
        <button type="button" class="expl-bal-btn" data-bal-act="div-both" ${leftRemoved < constant ? "disabled" : ""}>
          ➗ Divide Both Sides by ${coeff}
        </button>
        <button type="button" class="expl-bal-btn" data-bal-act="reset">
          🔄 Reset Balance
        </button>
      </div>
    </div>
  `;
}

export function mountPhysicsBalance(container, onBalanceChange) {
  if (!container) return;
  const root = container.matches("[data-balance-root]") ? container : container.querySelector("[data-balance-root]");
  if (!root) return;

  const coeff = Number(root.dataset.coeff) || 2;
  const constant = Number(root.dataset.constant) || 6;
  const rightTotal = Number(root.dataset.right) || 14;

  root.querySelectorAll("[data-bal-act]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.balAct;
      let state = { coeff, constant, rightTotal, leftRemoved: 0, rightRemoved: 0 };
      if (act === "sub-both") {
        state.leftRemoved = constant;
        state.rightRemoved = constant;
      } else if (act === "sub-left-only") {
        state.leftRemoved = constant;
        state.rightRemoved = 0;
      } else if (act === "div-both") {
        state.leftRemoved = constant;
        state.rightRemoved = constant;
        state.leftDivided = true;
        state.rightDivided = true;
      } else if (act === "reset") {
        state.leftRemoved = 0;
        state.rightRemoved = 0;
      }
      root.outerHTML = renderPhysicsBalance(state);
      const updated = container.querySelector("[data-balance-root]") || container;
      mountPhysicsBalance(updated, onBalanceChange);
      if (onBalanceChange) onBalanceChange(state);
    });
  });

  const updateBalance = () => {
    const inCoeff = Number(root.querySelector("[data-bal-in='coeff']")?.value || coeff);
    const inConst = Number(root.querySelector("[data-bal-in='constant']")?.value || constant);
    const inRight = Number(root.querySelector("[data-bal-in='right']")?.value || rightTotal);
    root.outerHTML = renderPhysicsBalance({ coeff: inCoeff, constant: inConst, rightTotal: inRight });
    const updated = container.querySelector("[data-balance-root]") || container;
    mountPhysicsBalance(updated, onBalanceChange);
  };
  root.querySelector("[data-bal-update]")?.addEventListener("click", updateBalance);
}
