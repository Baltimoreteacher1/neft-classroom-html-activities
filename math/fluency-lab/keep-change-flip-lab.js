// Keep-Change-Flip (KCF) Interactive Fraction Division Studio
// Grounded in CCSS 6.NS.A.1, NCTM, and Singapore Math:
//   1. Full interactive number input: users can put in their own numbers directly in the hero equation,
//      stepper cards, measurement tape, and practice solver.
//   2. "Put in Numbers & Solve It" student engagement mode with step-by-step input validation and instant feedback.
//   3. Quotitive / Measurement Division with Common Denominator Subdivision Strip Model & scrubbable serving slider.
//   4. The Multiplicative Inverse Algebraic Proof (Complex Fraction Transformation).
//   5. Interactive Cross-Cancellation Workbench.
//   6. 2D Area Model (Unit Square Partitioning).
//   7. Authentic Vertical Stacked Fractions across every visual surface.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
};

const lcm = (a, b) => (Math.abs(a * b) / gcd(a, b)) || 1;

export function verticalFracHtml(num, den, extraClass = "") {
  const cls = extraClass ? `v-frac ${extraClass}` : "v-frac";
  return `<span class="${cls}"><span class="v-num">${esc(num)}</span><span class="v-den">${esc(den)}</span></span>`;
}

// Curriculum-aligned presets for instant exploration
export const KCF_PRESETS = [
  { label: "2/3 ÷ 4/5 (Proper Fractions)", a: 2, b: 3, c: 4, d: 5 },
  { label: "3/4 ÷ 1/8 (Unit Fraction Divisor)", a: 3, b: 4, c: 1, d: 8 },
  { label: "5/6 ÷ 1/3 (Clean Measurement)", a: 5, b: 6, c: 1, d: 3 },
  { label: "3 ÷ 2/5 (Whole ÷ Fraction)", a: 3, b: 1, c: 2, d: 5 },
  { label: "4/5 ÷ 2 (Fraction ÷ Whole)", a: 4, b: 5, c: 2, d: 1 },
  { label: "7/4 ÷ 1/2 (Improper Fractions)", a: 7, b: 4, c: 1, d: 2 },
];

export function renderMixedFractionBarsSvg(simpNum, simpDen) {
  const whole = Math.floor(simpNum / simpDen);
  const rem = simpNum % simpDen;
  const numBars = Math.ceil(simpNum / simpDen);

  const svgWidth = 640;
  const barHeight = 26;
  const barGap = 14;
  const svgHeight = 24 + numBars * (barHeight + barGap);
  const startX = 145;
  const barWidth = 475;
  const segWidth = barWidth / simpDen;

  let barsHtml = "";
  let partsCounted = 0;

  for (let bIdx = 0; bIdx < numBars; bIdx++) {
    const isFullWhole = bIdx < whole;
    const y = 10 + bIdx * (barHeight + barGap);
    const label = isFullWhole
      ? `Whole ${bIdx + 1} (${simpDen}/${simpDen})`
      : `Leftover (${rem}/${simpDen})`;

    barsHtml += `
      <text x="10" y="${y + 18}" font-size="12" font-weight="800" fill="${isFullWhole ? "#047857" : "#b45309"}">${label}</text>
      <rect x="${startX}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    `;

    for (let sIdx = 0; sIdx < simpDen; sIdx++) {
      const segX = startX + sIdx * segWidth;
      const isFilled = partsCounted < simpNum;
      partsCounted++;

      if (isFilled) {
        const fillCol = isFullWhole ? "#10b981" : "#f59e0b";
        barsHtml += `
          <rect x="${segX}" y="${y}" width="${segWidth}" height="${barHeight}" fill="${fillCol}" stroke="#ffffff" stroke-width="1"/>
          <text x="${segX + segWidth / 2}" y="${y + 17}" text-anchor="middle" font-size="10" font-weight="700" fill="#ffffff">1/${simpDen}</text>
        `;
      } else {
        barsHtml += `
          <rect x="${segX}" y="${y}" width="${segWidth}" height="${barHeight}" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3"/>
          <text x="${segX + segWidth / 2}" y="${y + 17}" text-anchor="middle" font-size="10" font-weight="600" fill="#94a3b8">1/${simpDen}</text>
        `;
      }
    }
  }

  return `
    <svg class="kcf-mixed-bars-svg" viewBox="0 0 ${svgWidth} ${svgHeight}" role="img" aria-label="Fraction bar visual model showing ${simpNum} parts of size 1/${simpDen}">
      ${barsHtml}
    </svg>
  `;
}

export function renderKCFStudio({
  a = 2,
  b = 3,
  c = 4,
  d = 5,
  opMode = "div", // "div" | "mult"
  activeTab = "measure",
  studioMode = "explore", // "explore" | "practice"
  measureStep = null,
} = {}) {
  // Normalize values
  a = Math.max(1, Math.min(24, Math.round(Number(a) || 2)));
  b = Math.max(1, Math.min(24, Math.round(Number(b) || 3)));
  c = Math.max(1, Math.min(24, Math.round(Number(c) || 4)));
  d = Math.max(1, Math.min(24, Math.round(Number(d) || 5)));

  // Common Denominator Math (Measurement model)
  const commonDen = lcm(b, d);
  const num1Common = a * (commonDen / b);
  const num2Common = c * (commonDen / d);

  // Keep Change Flip Multiplication
  const prodNum = a * d;
  const prodDen = b * c;
  const g = gcd(prodNum, prodDen);
  const simpNum = prodNum / g;
  const simpDen = prodDen / g;

  // Cross-canceling checks
  const gAC = gcd(a, c);
  const gBD = gcd(b, d);
  const canCrossCancel = gAC > 1 || gBD > 1;

  // Raw product representation (DO NOT automatically reduce or convert to mixed number)
  const rawProductHtml = verticalFracHtml(prodNum, prodDen, "kcf-hero-frac-raw");
  const canReduce = g > 1;
  const isImproper = simpNum > simpDen && simpDen > 1;

  // Quotitive serving count
  const fullServings = Math.floor(num1Common / num2Common);
  const remainderUnits = num1Common % num2Common;
  const activeMeasureStep = measureStep != null ? measureStep : fullServings;

  const subtitleHtml = opMode === "mult"
    ? `Keep first fraction (${verticalFracHtml(a, b)}) · <strong>Change ÷ to ×</strong> · <strong>Flip second fraction into reciprocal (${verticalFracHtml(d, c)})</strong>. Now multiply straight across!`
    : `Grounded in the question: <em>"How many groups of ${verticalFracHtml(c, d)} fit into ${verticalFracHtml(a, b)}?"</em> &nbsp;—&nbsp; Click <strong>÷</strong> or the Change button to switch to multiplication!`;

  return `
    <div class="kcf-studio-container" data-kcf-a="${a}" data-kcf-b="${b}" data-kcf-c="${c}" data-kcf-d="${d}" data-kcf-op="${opMode}" data-kcf-tab="${activeTab}" data-kcf-mode="${studioMode}">
      <!-- Header Bar & Mode Toggle -->
      <div class="kcf-header">
        <div class="kcf-title-row">
          <span class="kcf-badge">🔄 Interactive Math Lab</span>
          <h4>Dividing Fractions: Keep · Change · Flip</h4>
          <div class="kcf-mode-toggle" role="group" aria-label="Studio mode">
            <button type="button" class="kcf-mode-btn ${studioMode === "explore" ? "is-active" : ""}" data-kcf-mode-set="explore">
              👁️ Concept Explorer
            </button>
            <button type="button" class="kcf-mode-btn ${studioMode === "practice" ? "is-active" : ""}" data-kcf-mode-set="practice">
              ✍️ Put In Numbers &amp; Solve It
            </button>
          </div>
        </div>
        <p class="kcf-subtitle">
          ${subtitleHtml}
        </p>
      </div>

      <!-- Live Interactive Hero Banner with Direct-Input Fractions -->
      <div class="kcf-problem-hero" aria-label="Interactive Fraction Equation">
        <div class="kcf-hero-equation">
          <!-- First Fraction (Dividend) -->
          <div class="kcf-interactive-fraction-box" title="Dividend: Click to type custom number">
            <input type="number" min="1" max="24" value="${a}" class="kcf-hero-in kcf-in-num" id="kcfInHeroA" aria-label="Dividend numerator" />
            <span class="kcf-hero-bar"></span>
            <input type="number" min="1" max="24" value="${b}" class="kcf-hero-in kcf-in-den" id="kcfInHeroB" aria-label="Dividend denominator" />
          </div>

          <!-- Operation Toggle Button: Click to Change Division to Multiplication -->
          <button type="button" class="kcf-hero-op-btn ${opMode === "mult" ? "is-mult" : "is-div"}" id="kcfHeroOpToggle" title="Click to Change Operation: ${opMode === "div" ? "Change ÷ to × (Keep Change Flip)" : "Switch back to ÷"}" aria-label="Change Operation">
            ${opMode === "mult" ? "×" : "÷"}
          </button>

          <!-- Second Fraction: Divisor in ÷ mode, Flipped Reciprocal in × mode -->
          ${opMode === "mult" ? `
          <div class="kcf-interactive-fraction-box is-flipped" title="Reciprocal (Flipped Divisor): Click to type custom number">
            <span class="kcf-reciprocal-tag">Reciprocal (Flipped)</span>
            <input type="number" min="1" max="24" value="${d}" class="kcf-hero-in kcf-in-num" id="kcfInHeroD" aria-label="Reciprocal numerator" />
            <span class="kcf-hero-bar"></span>
            <input type="number" min="1" max="24" value="${c}" class="kcf-hero-in kcf-in-den" id="kcfInHeroC" aria-label="Reciprocal denominator" />
          </div>
          ` : `
          <div class="kcf-interactive-fraction-box" title="Divisor: Click to type custom number">
            <input type="number" min="1" max="24" value="${c}" class="kcf-hero-in kcf-in-num" id="kcfInHeroC" aria-label="Divisor numerator" />
            <span class="kcf-hero-bar"></span>
            <input type="number" min="1" max="24" value="${d}" class="kcf-hero-in kcf-in-den" id="kcfInHeroD" aria-label="Divisor denominator" />
          </div>
          `}

          <span class="kcf-hero-op">=</span>

          <span class="kcf-hero-result" id="kcfHeroResultDisplay">
            ${rawProductHtml}
            ${canReduce ? '<span class="kcf-reducible-pill" title="This fraction can be reduced!">Needs Reducing</span>' : ""}
          </span>
        </div>

        <!-- Operation Toggle Action Button -->
        <div class="kcf-op-switch-container">
          <button type="button" class="kcf-op-switch-btn ${opMode === "mult" ? "is-mult" : ""}" id="kcfOpSwitchAction" title="Toggle Operation">
            ${opMode === "div" ? "⚡ Change ÷ to × (Flip Divisor into Reciprocal)" : "↩️ Switch back to ÷ (Original Division)"}
          </button>
        </div>
        
        <!-- Curriculum Presets Row directly under hero -->
        <div class="kcf-hero-presets-row">
          <span class="kcf-presets-label">Quick Presets:</span>
          <div class="kcf-preset-chips">
            ${KCF_PRESETS.map((p) => `
              <button type="button" class="kcf-preset-btn ${p.a === a && p.b === b && p.c === c && p.d === d ? "is-selected" : ""}" data-preset-a="${p.a}" data-preset-b="${p.b}" data-preset-c="${p.c}" data-preset-d="${p.d}">
                ${p.label}
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Guided Fraction Reduction Studio (No Auto-Reducing) -->
        ${canReduce ? `
        <div class="kcf-reduction-section" id="kcfReductionSection">
          <div class="kcf-reduction-card">
            <div class="kcf-card-top">
              <span class="kcf-stage-pill orange">Guided Step</span>
              <h5>Reduce ${verticalFracHtml(prodNum, prodDen)} to Simplest Form (Your Turn)</h5>
              <span class="kcf-badge-sub">Divide by Common Factor</span>
            </div>
            
            <p class="kcf-reduction-hint">
              <strong>Your Turn:</strong> Both <strong>${prodNum}</strong> and <strong>${prodDen}</strong> share a common factor. 
              Find the number that divides evenly into both, then calculate the simplified numerator and denominator:
            </p>

            <div class="kcf-reduction-row">
              <div class="kcf-reduce-term">
                <span class="kcf-term-label">Divide both by:</span>
                <input type="number" min="2" max="50" class="kcf-conv-num-in gcf-in" id="kcfInGcf" placeholder="÷ ?" data-target="${g}" aria-label="Common factor" />
              </div>

              <span class="kcf-conv-arrow">➔</span>

              <div class="kcf-reduce-term">
                <span class="kcf-term-label">Simplified Fraction:</span>
                <div class="kcf-conv-vertical-frac">
                  <input type="number" min="1" max="99" class="kcf-conv-num-in num" id="kcfInSimpNum" placeholder="?" data-target="${simpNum}" aria-label="Simplified numerator" />
                  <span class="kcf-conv-frac-line"></span>
                  <input type="number" min="1" max="99" class="kcf-conv-num-in den" id="kcfInSimpDen" placeholder="?" data-target="${simpDen}" aria-label="Simplified denominator" />
                </div>
              </div>

              <button type="button" class="kcf-conv-check-btn" id="kcfCheckReduceBtn">Check Simplification</button>
            </div>

            <div class="kcf-conv-feedback" id="kcfReduceFeedback" role="status" aria-live="polite"></div>
          </div>
        </div>
        ` : `
        <div class="kcf-already-simplified-banner">
          <span>✅ <strong>${verticalFracHtml(prodNum, prodDen)}</strong> is already in simplest form (greatest common factor is 1).</span>
        </div>
        `}

        <!-- Guided Mixed Number Conversion Studio (No Auto-Conversion) -->
        ${isImproper ? `
        <div class="kcf-mixed-converter-section" id="kcfMixedConverterSection">
          <div class="kcf-converter-card">
            <div class="kcf-converter-header">
              <span class="kcf-converter-tag">Guided Step</span>
              <h5>Convert Improper Fraction to Mixed Number (Your Turn)</h5>
              <span class="kcf-improper-badge">${verticalFracHtml(canReduce ? prodNum : simpNum, canReduce ? prodDen : simpDen)} &gt; 1</span>
            </div>
            
            <p class="kcf-converter-hint">
              <strong>Your Turn:</strong> The fraction has a numerator greater than its denominator. 
              Divide <strong>${simpNum}</strong> by <strong>${simpDen}</strong>: how many complete wholes fit, and what fraction is left over?
            </p>

            <div class="kcf-converter-interactive-grid">
              <!-- Interactive Visual Model: Fraction Strip Bars -->
              <div class="kcf-converter-model-stage">
                <div class="kcf-converter-model-label">Interactive Visual Model (${simpNum} parts of size 1/${simpDen}):</div>
                ${renderMixedFractionBarsSvg(simpNum, simpDen)}
              </div>

              <!-- Guided Input Spaces -->
              <div class="kcf-converter-inputs-col">
                <div class="kcf-conv-row">
                  <div class="kcf-conv-box whole-box">
                    <label for="kcfConvInWhole">Whole Number</label>
                    <input type="number" min="0" max="99" class="kcf-conv-num-in" id="kcfConvInWhole" placeholder="?" data-target="${Math.floor(simpNum / simpDen)}" aria-label="Whole number part" />
                  </div>

                  <span class="kcf-conv-plus">+</span>

                  <div class="kcf-conv-box frac-box">
                    <label>Fraction Part</label>
                    <div class="kcf-conv-vertical-frac">
                      <input type="number" min="0" max="99" class="kcf-conv-num-in num" id="kcfConvInRemNum" placeholder="?" data-target="${simpNum % simpDen}" aria-label="Remainder numerator" />
                      <span class="kcf-conv-frac-line"></span>
                      <input type="number" min="1" max="99" class="kcf-conv-num-in den" id="kcfConvInRemDen" value="${simpDen}" readonly aria-label="Denominator" />
                    </div>
                  </div>

                  <span class="kcf-conv-eq">=</span>

                  <div class="kcf-conv-result-preview" id="kcfConvResultPreview">
                    <span class="kcf-preview-placeholder">?</span>
                  </div>
                </div>

                <div class="kcf-conv-btn-row">
                  <button type="button" class="kcf-conv-check-btn" id="kcfConvCheckBtn">Check My Mixed Number</button>
                </div>

                <div class="kcf-conv-feedback" id="kcfConvFeedback" role="status" aria-live="polite"></div>
              </div>
            </div>
          </div>
        </div>
        ` : ""}
      </div>

      <!-- ========================================================================= -->
      <!-- EXPLORER VIEW (4 Math Models) -->
      <!-- ========================================================================= -->
      <div class="kcf-view-container ${studioMode === "explore" ? "is-visible" : "is-hidden"}" id="kcfViewExplore">
        <!-- Navigation Tabs: Mathematical Models -->
        <div class="kcf-model-tabs" role="tablist">
          <button type="button" class="kcf-tab-btn ${activeTab === "measure" ? "is-active" : ""}" data-kcf-tab-nav="measure">
            📏 Visual Measurement Model
          </button>
          <button type="button" class="kcf-tab-btn ${activeTab === "proof" ? "is-active" : ""}" data-kcf-tab-nav="proof">
            ⚖️ Why KCF Works (Inverse Proof)
          </button>
          <button type="button" class="kcf-tab-btn ${activeTab === "stepper" ? "is-active" : ""}" data-kcf-tab-nav="stepper">
            🔄 Keep · Change · Flip Stepper
          </button>
          <button type="button" class="kcf-tab-btn ${activeTab === "grid" ? "is-active" : ""}" data-kcf-tab-nav="grid">
            🔲 2D Area Model
          </button>
        </div>

        <!-- MODEL 1: Visual Measurement Tape & Common Denominator Model -->
        <div class="kcf-tab-panel ${activeTab === "measure" ? "is-active" : ""}" id="kcfPanelMeasure">
          <div class="kcf-panel-card">
            <div class="kcf-card-header">
              <div>
                <h5>Quotitive Measurement: Dividing Equal-Sized Pieces</h5>
                <p class="kcf-card-sub">
                  To count how many ${c}/${d}s fit in ${a}/${b}, rename both fractions using their <strong>common denominator (${commonDen})</strong> so all pieces are identical in size!
                </p>
              </div>
              <div class="kcf-toggle-group">
                <button type="button" class="kcf-tool-btn" id="kcfToggleCommonGrid" data-active="true">
                  ✨ Common Denominator Grid (${commonDen}ths)
                </button>
                <button type="button" class="kcf-tool-btn primary" id="kcfStepMeasureBtn">
                  ▶️ Step-by-Step Measure Fit
                </button>
              </div>
            </div>

            <!-- Scrubbable Measurement Slider directly above SVG -->
            <div class="kcf-slider-controller-row">
              <label for="kcfTapeSlider"><strong>Interactive Servings Scrubber:</strong></label>
              <input type="range" min="0" max="${fullServings + 1}" value="${activeMeasureStep}" class="kcf-tape-slider" id="kcfTapeSlider" aria-label="Servings to fit"/>
              <span class="kcf-serving-scrub-val" id="kcfServingScrubVal">
                ${activeMeasureStep === 0 ? "0 servings" : `${activeMeasureStep} of ${fullServings} full servings`}
              </span>
            </div>

            <!-- Dynamic SVG Measurement Tape -->
            <div class="kcf-svg-tape-stage" id="kcfSvgTapeStage">
              ${renderTapeSvg({ a, b, c, d, commonDen, num1Common, num2Common, fullServings, remainderUnits, step: activeMeasureStep })}
            </div>

            <!-- Measurement Conceptual Walkthrough -->
            <div class="kcf-measure-walkthrough" id="kcfMeasureWalkthrough">
              <div class="kcf-step-pill-row">
                <span class="kcf-math-tag">1. Dividend Amount</span>
                <p>You have <strong>${verticalFracHtml(a, b)}</strong> = <strong>${verticalFracHtml(num1Common, commonDen)}</strong> of a whole (${num1Common} pieces of size <sup>1</sup>/<sub>${commonDen}</sub>).</p>
              </div>
              <div class="kcf-step-pill-row">
                <span class="kcf-math-tag">2. Serving Size</span>
                <p>One full serving requires <strong>${verticalFracHtml(c, d)}</strong> = <strong>${verticalFracHtml(num2Common, commonDen)}</strong> (${num2Common} pieces of size <sup>1</sup>/<sub>${commonDen}</sub>).</p>
              </div>
              <div class="kcf-step-pill-row highlight">
                <span class="kcf-math-tag">3. Direct Division</span>
                <p>Since the pieces are the same size, divide the numerators directly: <strong>${num1Common} ÷ ${num2Common} = ${verticalFracHtml(num1Common, num2Common)} = ${rawProductHtml}</strong> servings!</p>
              </div>
            </div>
          </div>
        </div>

        <!-- MODEL 2: The Multiplicative Inverse Algebraic Proof -->
        <div class="kcf-tab-panel ${activeTab === "proof" ? "is-active" : ""}" id="kcfPanelProof">
          <div class="kcf-panel-card">
            <div class="kcf-card-header">
              <div>
                <h5>Why Keep · Change · Flip Works: The Multiplicative Inverse</h5>
                <p class="kcf-card-sub">
                  Division by a fraction is fundamentally multiplication by its reciprocal. Observe the algebraic transformation that makes the denominator equal to 1.
                </p>
              </div>
              <button type="button" class="kcf-tool-btn primary" id="kcfAnimateProofBtn">
                ⚡ Step Through Transformation
              </button>
            </div>

            <!-- Complex Fraction Transformer Visualizer -->
            <div class="kcf-proof-stage" id="kcfProofStage">
              <div class="kcf-complex-frac-box">
                <div class="kcf-complex-title">Complex Fraction Representation:</div>
                <div class="kcf-complex-equation">
                  <!-- Left: a/b over c/d -->
                  <div class="kcf-stacked-fraction-unit">
                    <span class="kcf-c-num">${verticalFracHtml(a, b)}</span>
                    <span class="kcf-c-bar"></span>
                    <span class="kcf-c-den">${verticalFracHtml(c, d)}</span>
                  </div>

                  <span class="kcf-proof-arrow">➔</span>

                  <!-- Middle: Multiply by Reciprocal on Top and Bottom -->
                  <div class="kcf-stacked-fraction-unit is-highlighted" id="kcfProofMid">
                    <span class="kcf-c-num">${verticalFracHtml(a, b)} <strong class="kcf-op-symbol">×</strong> <span class="kcf-recip-badge">${verticalFracHtml(d, c)}</span></span>
                    <span class="kcf-c-bar"></span>
                    <span class="kcf-c-den">${verticalFracHtml(c, d)} <strong class="kcf-op-symbol">×</strong> <span class="kcf-recip-badge">${verticalFracHtml(d, c)}</span></span>
                  </div>

                  <span class="kcf-proof-arrow">➔</span>

                  <!-- Right: Denominator Becomes 1 -->
                  <div class="kcf-stacked-fraction-unit" id="kcfProofEnd">
                    <span class="kcf-c-num">${verticalFracHtml(a, b)} <strong class="kcf-op-symbol">×</strong> ${verticalFracHtml(d, c)}</span>
                    <span class="kcf-c-bar"></span>
                    <span class="kcf-c-den"><strong class="kcf-one-badge">1</strong></span>
                  </div>

                  <span class="kcf-proof-arrow">=</span>

                  <div class="kcf-proof-final">
                    <span class="kcf-final-eq">${verticalFracHtml(a, b)} × ${verticalFracHtml(d, c)}</span>
                  </div>
                </div>
              </div>

              <!-- Proof Conceptual Breakdown -->
              <div class="kcf-proof-cards-grid">
                <div class="kcf-proof-card">
                  <span class="kcf-proof-step-num">Step 1</span>
                  <strong>Division is a Fraction</strong>
                  <p>Any division <em>X ÷ Y</em> can be written as <sup>X</sup>/<sub>Y</sub>. So ${a}/${b} ÷ ${c}/${d} is simply a complex fraction.</p>
                </div>
                <div class="kcf-proof-card">
                  <span class="kcf-proof-step-num">Step 2</span>
                  <strong>The Multiplicative Inverse</strong>
                  <p>Multiplying a fraction by its reciprocal always equals 1: <strong>${verticalFracHtml(c, d)} × ${verticalFracHtml(d, c)} = <sup>${c * d}</sup>/<sub>${c * d}</sub> = 1</strong>.</p>
                </div>
                <div class="kcf-proof-card">
                  <span class="kcf-proof-step-num">Step 3</span>
                  <strong>Multiply Top and Bottom</strong>
                  <p>To keep the value unchanged (multiplying by 1), multiply both numerator and denominator by the reciprocal <strong>${verticalFracHtml(d, c)}</strong>.</p>
                </div>
                <div class="kcf-proof-card highlight">
                  <span class="kcf-proof-step-num">Step 4</span>
                  <strong>Keep · Change · Flip!</strong>
                  <p>The denominator collapses to 1! Leaving: <strong>${verticalFracHtml(a, b)} × ${verticalFracHtml(d, c)}</strong>. KCF is proven!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MODEL 3: Keep Change Flip Stepper & Cross-Cancellation -->
        <div class="kcf-tab-panel ${activeTab === "stepper" ? "is-active" : ""}" id="kcfPanelStepper">
          <div class="kcf-panel-card">
            <div class="kcf-card-header">
              <div>
                <h5>Keep · Change · Flip Guided Stepper</h5>
                <p class="kcf-card-sub">
                  Follow the 3 tactical moves: Keep the dividend, change the operator, and flip the divisor to its reciprocal.
                </p>
              </div>
              ${canCrossCancel ? `
                <button type="button" class="kcf-tool-btn warning" id="kcfCrossCancelBtn" data-canceled="false">
                  ✂️ Cross-Cancel Shared Factors
                </button>
              ` : ""}
            </div>

            <!-- Interactive 3-Stage Cards -->
            <div class="kcf-stages-grid">
              <!-- 1. KEEP -->
              <div class="kcf-stage-card card-keep is-active" id="kcfCardKeep">
                <div class="kcf-card-top">
                  <span class="kcf-stage-pill">Step 1</span>
                  <strong>KEEP</strong>
                </div>
                <div class="kcf-fraction-display">
                  ${verticalFracHtml(a, b)}
                </div>
                <p class="kcf-card-desc">The dividend stays exactly the same amount.</p>
                <button type="button" class="kcf-action-btn" data-kcf-action="keep">
                  <span class="kcf-btn-icon">🔒</span> Kept
                </button>
              </div>

              <!-- 2. CHANGE -->
              <div class="kcf-stage-card card-change is-active" id="kcfCardChange">
                <div class="kcf-card-top">
                  <span class="kcf-stage-pill">Step 2</span>
                  <strong>CHANGE</strong>
                </div>
                <div class="kcf-operator-display" id="kcfOpDisplay">
                  ×
                </div>
                <p class="kcf-card-desc">Change division (÷) into multiplication (×).</p>
                <button type="button" class="kcf-action-btn" data-kcf-action="change">
                  <span class="kcf-btn-icon">⚡</span> Changed to ×
                </button>
              </div>

              <!-- 3. FLIP -->
              <div class="kcf-stage-card card-flip is-active" id="kcfCardFlip">
                <div class="kcf-card-top">
                  <span class="kcf-stage-pill">Step 3</span>
                  <strong>FLIP</strong>
                </div>
                <div class="kcf-flip-wrapper">
                  <div class="kcf-fraction-display kcf-flip-inner" id="kcfFlipDisplay">
                    ${verticalFracHtml(d, c)}
                  </div>
                </div>
                <p class="kcf-card-desc">Flip only the divisor into its <strong>reciprocal</strong>.</p>
                <button type="button" class="kcf-action-btn" data-kcf-action="flip">
                  <span class="kcf-btn-icon">🔃</span> Flipped (${c}/${d} ➔ ${d}/${c})
                </button>
              </div>
            </div>

            <!-- Cross-Cancellation Callout (if factors exist) -->
            <div class="kcf-cross-cancel-box ${canCrossCancel ? "" : "is-hidden"}" id="kcfCrossCancelBox">
              <span class="kcf-cancel-badge">💡 Smart Math Strategy</span>
              <div class="kcf-cancel-content">
                <strong>Simplify before multiplying:</strong>
                ${gAC > 1 ? `<span class="kcf-cancel-factor">Divide ${a} and ${c} by their GCF (${gAC}): ${a} ➔ ${a / gAC}, ${c} ➔ ${c / gAC}</span>` : ""}
                ${gBD > 1 ? `<span class="kcf-cancel-factor">Divide ${b} and ${d} by their GCF (${gBD}): ${b} ➔ ${b / gBD}, ${d} ➔ ${d / gBD}</span>` : ""}
              </div>
            </div>

            <!-- Multiply Across Calculation Banner -->
            <div class="kcf-solution-banner" id="kcfSolutionBanner">
              <div class="kcf-sol-title">Step 4: Multiply Numerators and Denominators Straight Across</div>
              <div class="kcf-sol-equation">
                ${verticalFracHtml(a, b)}
                <span class="kcf-calc-op">×</span>
                ${verticalFracHtml(d, c)}
                <span class="kcf-calc-op">=</span>
                <span class="kcf-stacked-calc">
                  <span class="kcf-calc-top">${a} × ${d}</span>
                  <span class="kcf-calc-line"></span>
                  <span class="kcf-calc-bot">${b} × ${c}</span>
                </span>
                <span class="kcf-calc-op">=</span>
                ${verticalFracHtml(prodNum, prodDen, "kcf-unreduced")}
                ${g > 1 ? `
                  <span class="kcf-calc-op">=</span>
                  <span class="kcf-reduced-tag">Divide by GCF (${g})</span>
                  <span class="kcf-calc-op">=</span>
                  ${verticalFracHtml(simpNum, simpDen, "kcf-reduced")}
                ` : ""}
                <span class="kcf-calc-op">=</span>
                <span class="kcf-final-badge">${rawProductHtml}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- MODEL 4: 2D Area Model (Unit Square Partitioning) -->
        <div class="kcf-tab-panel ${activeTab === "grid" ? "is-active" : ""}" id="kcfPanelGrid">
          <div class="kcf-panel-card">
            <div class="kcf-card-header">
              <div>
                <h5>2D Area Model: Comparing Dimensions</h5>
                <p class="kcf-card-sub">
                  A unit square of 1 whole subdivided into ${b} columns and ${d} rows creates ${b * d} unit grid cells.
                </p>
              </div>
            </div>
            <div class="kcf-grid-area-stage">
              ${renderAreaGridSvg({ a, b, c, d })}
              <div class="kcf-area-caption">
                The dividend covers <strong>${a} of ${b} columns</strong> (${a * d} of ${b * d} cells). Each divisor serving takes <strong>${c} of ${d} rows</strong> (${b * c} of ${b * d} cells). The ratio of areas is <strong>${a * d} : ${b * c} = ${simpNum}/${simpDen}</strong>!
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- PRACTICE VIEW ("Put In Numbers & Solve It") -->
      <!-- ========================================================================= -->
      <div class="kcf-view-container ${studioMode === "practice" ? "is-visible" : "is-hidden"}" id="kcfViewPractice">
        <div class="kcf-practice-card">
          <div class="kcf-practice-header">
            <div>
              <h5>Interactive Step-by-Step Solver: Put in the Numbers</h5>
              <p class="kcf-card-sub">
                Type the correct numbers into each card to execute Keep · Change · Flip!
              </p>
            </div>
            <button type="button" class="kcf-tool-btn primary" id="kcfNewPracticeProblemBtn">
              🎲 Try Another Problem
            </button>
          </div>

          <div class="kcf-practice-stages-grid">
            <!-- Step 1: KEEP -->
            <div class="kcf-stage-card card-keep" id="kcfSolveCardKeep">
              <div class="kcf-card-top">
                <span class="kcf-stage-pill">Step 1</span>
                <strong>KEEP</strong>
              </div>
              <p class="kcf-solve-prompt">Enter the first fraction:</p>
              <div class="kcf-solve-frac-inputs">
                <input type="number" min="1" max="24" class="kcf-solve-input" id="kcfSolveInKeepA" placeholder="?" data-target="${a}" aria-label="First fraction numerator"/>
                <span class="kcf-solve-line"></span>
                <input type="number" min="1" max="24" class="kcf-solve-input" id="kcfSolveInKeepB" placeholder="?" data-target="${b}" aria-label="First fraction denominator"/>
              </div>
              <span class="kcf-feedback-msg" id="kcfFeedbackKeep"></span>
            </div>

            <!-- Step 2: CHANGE -->
            <div class="kcf-stage-card card-change" id="kcfSolveCardChange">
              <div class="kcf-card-top">
                <span class="kcf-stage-pill">Step 2</span>
                <strong>CHANGE</strong>
              </div>
              <p class="kcf-solve-prompt">Choose the new operation:</p>
              <div class="kcf-op-choices" role="group" aria-label="Operation buttons">
                <button type="button" class="kcf-op-btn" data-solve-op="+">+</button>
                <button type="button" class="kcf-op-btn" data-solve-op="−">−</button>
                <button type="button" class="kcf-op-btn" data-solve-op="×">×</button>
                <button type="button" class="kcf-op-btn" data-solve-op="÷">÷</button>
              </div>
              <span class="kcf-feedback-msg" id="kcfFeedbackChange"></span>
            </div>

            <!-- Step 3: FLIP -->
            <div class="kcf-stage-card card-flip" id="kcfSolveCardFlip">
              <div class="kcf-card-top">
                <span class="kcf-stage-pill">Step 3</span>
                <strong>FLIP</strong>
              </div>
              <p class="kcf-solve-prompt">Enter reciprocal of ${c}/${d}:</p>
              <div class="kcf-solve-frac-inputs">
                <input type="number" min="1" max="24" class="kcf-solve-input" id="kcfSolveInFlipD" placeholder="?" data-target="${d}" aria-label="Reciprocal numerator"/>
                <span class="kcf-solve-line"></span>
                <input type="number" min="1" max="24" class="kcf-solve-input" id="kcfSolveInFlipC" placeholder="?" data-target="${c}" aria-label="Reciprocal denominator"/>
              </div>
              <span class="kcf-feedback-msg" id="kcfFeedbackFlip"></span>
            </div>
          </div>

          <!-- Step 4: Multiply Across Workout Banner -->
          <div class="kcf-solve-workout-banner" id="kcfSolveWorkoutBanner">
            <h6>Step 4: Multiply Straight Across (Raw Product)</h6>
            <div class="kcf-solve-mult-row">
              <div class="kcf-solve-term">
                <label>Top (${a} × ${d}):</label>
                <input type="number" class="kcf-solve-input-small" id="kcfSolveInProdNum" placeholder="?" data-target="${prodNum}" aria-label="Raw numerator" />
              </div>
              <span class="kcf-solve-slash">/</span>
              <div class="kcf-solve-term">
                <label>Bottom (${b} × ${c}):</label>
                <input type="number" class="kcf-solve-input-small" id="kcfSolveInProdDen" placeholder="?" data-target="${prodDen}" aria-label="Raw denominator" />
              </div>
              <button type="button" class="kcf-check-solve-btn" id="kcfCheckSolveRawBtn">Check Raw Product</button>
            </div>
            <span class="kcf-feedback-msg" id="kcfFeedbackRaw"></span>

            <!-- Step 5: Reduce / Simplify (if canReduce) -->
            ${canReduce ? `
            <div class="kcf-solve-step-reduce" id="kcfSolveStepReduce">
              <h6>Step 5: Reduce to Simplest Form (Your Turn)</h6>
              <p class="kcf-solve-subhint">Find the common factor that divides both ${prodNum} and ${prodDen}:</p>
              <div class="kcf-reduce-inputs-box">
                <div class="kcf-solve-term">
                  <label>Common Factor:</label>
                  <input type="number" class="kcf-solve-input-small" id="kcfSolveInGcf" placeholder="÷ ?" data-target="${g}" aria-label="Common factor" />
                </div>
                <span class="kcf-conv-arrow">➔</span>
                <div class="kcf-solve-term">
                  <label>Simplified Top:</label>
                  <input type="number" class="kcf-solve-input-small" id="kcfSolveInSimpNum" placeholder="?" data-target="${simpNum}" aria-label="Simplified numerator" />
                </div>
                <span class="kcf-solve-slash">/</span>
                <div class="kcf-solve-term">
                  <label>Simplified Bottom:</label>
                  <input type="number" class="kcf-solve-input-small" id="kcfSolveInSimpDen" placeholder="?" data-target="${simpDen}" aria-label="Simplified denominator" />
                </div>
                <button type="button" class="kcf-check-solve-btn" id="kcfCheckReduceSolveBtn">Check Simplification</button>
              </div>
              <span class="kcf-feedback-msg" id="kcfFeedbackReduce"></span>
            </div>
            ` : `
            <div class="kcf-already-simplified-banner">
              <span>✅ <strong>${prodNum}/${prodDen}</strong> is already in simplest form (greatest common factor is 1).</span>
            </div>
            `}

            <!-- Step 6 (or 5 if already simplified): Convert to Mixed Number (if isImproper) -->
            ${isImproper ? `
            <div class="kcf-solve-step5-row" id="kcfSolveStep5Row">
              <h6>${canReduce ? "Step 6" : "Step 5"}: Convert Improper Fraction to a Mixed Number (Your Turn)</h6>
              <p class="kcf-solve-subhint">Divide ${simpNum} by ${simpDen}: How many wholes fit, and what fraction is leftover?</p>
              <div class="kcf-step5-inputs-box">
                <div class="kcf-solve-term">
                  <label>Whole Number:</label>
                  <input type="number" min="0" max="99" class="kcf-solve-input-small" id="kcfSolveStep5Whole" placeholder="?" data-target="${Math.floor(simpNum / simpDen)}" aria-label="Whole number" />
                </div>
                <span class="kcf-solve-plus">+</span>
                <div class="kcf-solve-term">
                  <label>Remainder Num:</label>
                  <input type="number" min="0" max="99" class="kcf-solve-input-small" id="kcfSolveStep5Rem" placeholder="?" data-target="${simpNum % simpDen}" aria-label="Remainder numerator" />
                </div>
                <span class="kcf-solve-slash">/</span>
                <div class="kcf-solve-term">
                  <label>Denominator:</label>
                  <input type="number" class="kcf-solve-input-small" id="kcfSolveStep5Den" value="${simpDen}" readonly aria-label="Denominator" />
                </div>
                <button type="button" class="kcf-check-solve-btn" id="kcfCheckStep5Btn">Check Mixed Number</button>
              </div>
              <span class="kcf-feedback-msg" id="kcfFeedbackStep5"></span>
            </div>
            ` : ""}

            <div class="kcf-solve-celebration is-hidden" id="kcfSolveCelebration">
              🎉 <strong>Outstanding job!</strong> You executed Keep · Change · Flip with all steps verified!
            </div>
          </div>
        </div>
      </div>

      </div>
    </div>
  `;
}

// Render the high-precision SVG measurement tape
function renderTapeSvg({ a, b, c, d, commonDen, num1Common, num2Common, fullServings, remainderUnits, step = 0 }) {
  const maxWhole = Math.max(1, Math.ceil(a / b), Math.ceil(c / d));
  const totalSub = maxWhole * commonDen;
  const svgWidth = 680;
  const startX = 60;
  const trackWidth = 580;
  const unitPx = trackWidth / totalSub;

  const dividendPx = num1Common * unitPx;
  const divisorPx = num2Common * unitPx;

  // Servings arcs
  const activeStep = step != null ? step : fullServings;
  let servingsArcs = "";
  for (let s = 0; s < activeStep; s++) {
    const sStart = startX + s * divisorPx;
    const sEnd = Math.min(startX + dividendPx, sStart + divisorPx);
    const midX = (sStart + sEnd) / 2;
    servingsArcs += `
      <path d="M ${sStart},105 Q ${midX},75 ${sEnd},105" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${midX}" cy="82" r="10" fill="#2563eb"/>
      <text x="${midX}" y="86" text-anchor="middle" font-size="11" font-weight="900" fill="#ffffff">${s + 1}</text>
    `;
  }

  // Ticks for wholes and common units
  let ticksHtml = "";
  for (let i = 0; i <= totalSub; i++) {
    const x = startX + i * unitPx;
    const isWhole = i % commonDen === 0;
    const wholeVal = i / commonDen;
    ticksHtml += `
      <line x1="${x}" y1="120" x2="${x}" y2="${isWhole ? 145 : 132}" stroke="${isWhole ? "#0f172a" : "#94a3b8"}" stroke-width="${isWhole ? 2.5 : 1}"/>
      ${isWhole ? `<text x="${x}" y="162" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">${wholeVal}</text>` : ""}
    `;
  }

  return `
    <svg class="kcf-svg-tape" viewBox="0 0 ${svgWidth} 190" aria-label="Measurement Tape Visual Model">
      <defs>
        <linearGradient id="kcfGradDividend" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0ea5e9"/>
        </linearGradient>
        <linearGradient id="kcfGradDivisor" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#fbbf24"/>
        </linearGradient>
        <pattern id="kcfRemainderStripes" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" stroke-width="3" />
        </pattern>
      </defs>

      <!-- Label Row -->
      <text x="${startX}" y="25" font-size="12" font-weight="800" fill="#0369a1">Dividend Amount: ${a}/${b} (${num1Common} of ${commonDen} parts)</text>
      <text x="${startX}" y="180" font-size="12" font-weight="800" fill="#b45309">Divisor Serving: ${c}/${d} (${num2Common} of ${commonDen} parts)</text>

      <!-- Dividend Bar (Top) -->
      <rect x="${startX}" y="34" width="${trackWidth}" height="28" rx="4" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5"/>
      <rect x="${startX}" y="34" width="${dividendPx}" height="28" rx="4" fill="url(#kcfGradDividend)"/>

      <!-- Remainder Stripe Overlay on Dividend Bar (if any) -->
      ${remainderUnits > 0 && activeStep >= fullServings ? `
        <rect x="${startX + fullServings * divisorPx}" y="34" width="${remainderUnits * unitPx}" height="28" fill="url(#kcfRemainderStripes)" opacity="0.8"/>
      ` : ""}

      <!-- Number Line Ruler (Middle) -->
      <line x1="${startX}" y1="120" x2="${startX + trackWidth}" y2="120" stroke="#64748b" stroke-width="2"/>
      ${ticksHtml}

      <!-- Measurement Arcs -->
      ${servingsArcs}

      <!-- Serving Unit Indicators (Bottom) -->
      <rect x="${startX}" y="125" width="${divisorPx}" height="14" rx="3" fill="url(#kcfGradDivisor)"/>
    </svg>
  `;
}

// Render the 2D Area Grid
function renderAreaGridSvg({ a, b, c, d }) {
  const cellSize = 32;
  const width = b * cellSize;
  const height = d * cellSize;
  const svgWidth = Math.max(340, width + 80);
  const svgHeight = Math.max(240, height + 60);

  let cells = "";
  for (let r = 0; r < d; r++) {
    for (let col = 0; col < b; col++) {
      const isDividendCol = col < a;
      const isDivisorRow = r < c;
      let fill = "#f8fafc";
      if (isDividendCol && isDivisorRow) fill = "#818cf8"; // Overlap
      else if (isDividendCol) fill = "#bae6fd"; // Dividend column
      else if (isDivisorRow) fill = "#fde68a"; // Divisor row

      cells += `
        <rect x="${40 + col * cellSize}" y="${30 + r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="#cbd5e1" stroke-width="1"/>
      `;
    }
  }

  return `
    <svg class="kcf-svg-grid" viewBox="0 0 ${svgWidth} ${svgHeight}">
      ${cells}
      <!-- Column Header -->
      <text x="${40 + width / 2}" y="20" text-anchor="middle" font-size="12" font-weight="800" fill="#0284c7">Dividend: ${a}/${b} Columns</text>
      <!-- Row Header -->
      <text x="25" y="${30 + height / 2}" text-anchor="middle" font-size="12" font-weight="800" fill="#d97706" transform="rotate(-90 25 ${30 + height / 2})">Divisor: ${c}/${d} Rows</text>
    </svg>
  `;
}

export function mountKCFLab(container, options = {}) {
  if (!container) return;

  const getVals = () => {
    const el = container.querySelector(".kcf-studio-container");
    return {
      a: Number(el?.dataset.kcfA || 2),
      b: Number(el?.dataset.kcfB || 3),
      c: Number(el?.dataset.kcfC || 4),
      d: Number(el?.dataset.kcfD || 5),
      opMode: el?.dataset.kcfOp || "div",
      activeTab: el?.dataset.kcfTab || "measure",
      studioMode: el?.dataset.kcfMode || "explore",
    };
  };

  const updateAll = (newVals = {}) => {
    const current = getVals();
    const merged = { ...current, ...newVals };
    container.innerHTML = renderKCFStudio(merged);
    mountKCFLab(container, options);
  };

  // Operation Switcher (Change ÷ to × / Keep Change Flip)
  const handleOpToggle = () => {
    const vals = getVals();
    const nextOp = vals.opMode === "mult" ? "div" : "mult";
    updateAll({ opMode: nextOp });
  };
  container.querySelector("#kcfHeroOpToggle")?.addEventListener("click", handleOpToggle);
  container.querySelector("#kcfOpSwitchAction")?.addEventListener("click", handleOpToggle);

  // Guided Mixed Number Conversion Checker (Explorer Mode)
  const checkConv = () => {
    const inWhole = container.querySelector("#kcfConvInWhole");
    const inRemNum = container.querySelector("#kcfConvInRemNum");
    const fb = container.querySelector("#kcfConvFeedback");
    const preview = container.querySelector("#kcfConvResultPreview");
    if (!inWhole || !inRemNum || !fb) return;

    const valWhole = Number(inWhole.value);
    const valRem = Number(inRemNum.value);
    const targetWhole = Number(inWhole.dataset.target);
    const targetRem = Number(inRemNum.dataset.target);
    const den = container.querySelector("#kcfConvInRemDen")?.value || 1;

    if (inWhole.value.trim() === "" || inRemNum.value.trim() === "") {
      fb.className = "kcf-conv-feedback is-error";
      fb.innerHTML = "Please enter both the whole number and the leftover numerator.";
      return;
    }

    if (valWhole === targetWhole && valRem === targetRem) {
      fb.className = "kcf-conv-feedback is-correct";
      fb.innerHTML = `🎉 Correct! You converted it perfectly: <strong>${targetWhole} ${targetRem}/${den}</strong>!`;
      if (preview) {
        preview.innerHTML = `<strong class="kcf-res-val">${targetWhole}</strong> ${verticalFracHtml(targetRem, den, "kcf-mixed-frac")}`;
      }
    } else {
      fb.className = "kcf-conv-feedback is-error";
      fb.innerHTML = `Not quite: whole is <strong>${targetWhole}</strong> and remainder is <strong>${targetRem}</strong>. Try again!`;
    }
  };
  container.querySelector("#kcfConvCheckBtn")?.addEventListener("click", checkConv);

  // Guided Fraction Reduction Checker (Explorer Mode)
  const checkExplorerReduce = () => {
    const inGcf = container.querySelector("#kcfInGcf");
    const inSimpNum = container.querySelector("#kcfInSimpNum");
    const inSimpDen = container.querySelector("#kcfInSimpDen");
    const fb = container.querySelector("#kcfReduceFeedback");
    if (!inGcf || !inSimpNum || !inSimpDen || !fb) return;

    const valGcf = Number(inGcf.value);
    const valNum = Number(inSimpNum.value);
    const valDen = Number(inSimpDen.value);

    const targetGcf = Number(inGcf.dataset.target);
    const targetNum = Number(inSimpNum.dataset.target);
    const targetDen = Number(inSimpDen.dataset.target);

    if (!inGcf.value.trim() || !inSimpNum.value.trim() || !inSimpDen.value.trim()) {
      fb.className = "kcf-conv-feedback is-error";
      fb.innerHTML = "Please enter the common factor and the simplified fraction.";
      return;
    }

    if (valGcf === targetGcf && valNum === targetNum && valDen === targetDen) {
      fb.className = "kcf-conv-feedback is-correct";
      fb.innerHTML = `🎉 Correct! Dividing by ${targetGcf} simplifies to <strong>${targetNum}/${targetDen}</strong>!`;
      const heroRes = container.querySelector("#kcfHeroResultDisplay");
      if (heroRes) {
        heroRes.innerHTML = `${verticalFracHtml(targetNum, targetDen, "kcf-hero-frac-res")} <span class="kcf-reciprocal-tag">Simplified</span>`;
      }
    } else {
      fb.className = "kcf-conv-feedback is-error";
      fb.innerHTML = `Not quite: common factor is <strong>${targetGcf}</strong>, giving simplified fraction <strong>${targetNum}/${targetDen}</strong>.`;
    }
  };
  container.querySelector("#kcfCheckReduceBtn")?.addEventListener("click", checkExplorerReduce);

  // Studio Mode Toggle ("explore" vs "practice")
  container.querySelectorAll("[data-kcf-mode-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.kcfModeSet;
      updateAll({ studioMode: mode });
    });
  });

  // Direct Number Steppers in Hero Banner
  container.querySelectorAll(".kcf-step-arrow").forEach((arrow) => {
    arrow.addEventListener("click", () => {
      const field = arrow.dataset.stepField;
      const dir = Number(arrow.dataset.stepDir);
      const vals = getVals();
      vals[field] = Math.max(1, Math.min(24, vals[field] + dir));
      updateAll(vals);
    });
  });

  // Direct Hero Number Input Changes (on change / blur)
  const heroInputs = [
    { id: "kcfInHeroA", field: "a" },
    { id: "kcfInHeroB", field: "b" },
    { id: "kcfInHeroC", field: "c" },
    { id: "kcfInHeroD", field: "d" },
  ];
  heroInputs.forEach(({ id, field }) => {
    const input = container.querySelector(`#${id}`);
    if (input) {
      input.addEventListener("change", () => {
        const val = Math.max(1, Math.min(24, Number(input.value) || 1));
        const vals = getVals();
        vals[field] = val;
        updateAll(vals);
      });
    }
  });

  // Tab Navigation Switching
  container.querySelectorAll("[data-kcf-tab-nav]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.kcfTabNav;
      container.querySelectorAll("[data-kcf-tab-nav]").forEach((b) => b.classList.toggle("is-active", b === btn));
      container.querySelectorAll(".kcf-tab-panel").forEach((p) => {
        const matches = p.id === `kcfPanel${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
        p.classList.toggle("is-active", matches);
      });
      const el = container.querySelector(".kcf-studio-container");
      if (el) el.dataset.kcfTab = tabName;
    });
  });

  // Scrubbable Serving Slider
  const tapeSlider = container.querySelector("#kcfTapeSlider");
  if (tapeSlider) {
    tapeSlider.addEventListener("input", () => {
      const step = Number(tapeSlider.value);
      const { a, b, c, d } = getVals();
      const commonDen = lcm(b, d);
      const num1Common = a * (commonDen / b);
      const num2Common = c * (commonDen / d);
      const fullServings = Math.floor(num1Common / num2Common);
      const remainderUnits = num1Common % num2Common;

      const stage = container.querySelector("#kcfSvgTapeStage");
      if (stage) {
        stage.innerHTML = renderTapeSvg({
          a, b, c, d,
          commonDen, num1Common, num2Common,
          fullServings, remainderUnits,
          step,
        });
      }
      const readout = container.querySelector("#kcfServingScrubVal");
      if (readout) {
        readout.textContent = step === 0 ? "0 servings" : `${step} of ${fullServings} full servings`;
      }
    });
  }

  // KEEP Action
  container.querySelectorAll("[data-kcf-action='keep']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = container.querySelector("#kcfCardKeep");
      card?.classList.toggle("is-active");
      btn.innerHTML = card?.classList.contains("is-active")
        ? '<span class="kcf-btn-icon">🔒</span> Kept'
        : '<span class="kcf-btn-icon">🔓</span> Keep It';
    });
  });

  // CHANGE Action
  container.querySelectorAll("[data-kcf-action='change']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = container.querySelector("#kcfCardChange");
      const opDisplay = container.querySelector("#kcfOpDisplay");
      card?.classList.toggle("is-active");
      if (card?.classList.contains("is-active")) {
        if (opDisplay) opDisplay.textContent = "×";
        btn.innerHTML = '<span class="kcf-btn-icon">⚡</span> Changed to ×';
      } else {
        if (opDisplay) opDisplay.textContent = "÷";
        btn.innerHTML = '<span class="kcf-btn-icon">÷</span> Change to ×';
      }
    });
  });

  // FLIP Action
  container.querySelectorAll("[data-kcf-action='flip']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = container.querySelector("#kcfCardFlip");
      const flipDisplay = container.querySelector("#kcfFlipDisplay");
      const { c, d } = getVals();
      card?.classList.toggle("is-active");
      if (card?.classList.contains("is-active")) {
        if (flipDisplay) flipDisplay.innerHTML = verticalFracHtml(d, c);
        btn.innerHTML = `<span class="kcf-btn-icon">🔃</span> Flipped (${c}/${d} ➔ ${d}/${c})`;
      } else {
        if (flipDisplay) flipDisplay.innerHTML = verticalFracHtml(c, d);
        btn.innerHTML = '<span class="kcf-btn-icon">🔃</span> Flip to Reciprocal';
      }
    });
  });

  // Cross-Cancel Button
  const crossCancelBtn = container.querySelector("#kcfCrossCancelBtn");
  if (crossCancelBtn) {
    crossCancelBtn.addEventListener("click", () => {
      const isCanceled = crossCancelBtn.dataset.canceled === "true";
      crossCancelBtn.dataset.canceled = String(!isCanceled);
      const cancelBox = container.querySelector("#kcfCrossCancelBox");
      if (cancelBox) cancelBox.classList.toggle("is-active", !isCanceled);
      crossCancelBtn.textContent = !isCanceled ? "✅ Factors Simplified!" : "✂️ Cross-Cancel Shared Factors";
    });
  }

  // Step-by-Step Measure Fit Button
  let currentMeasureStep = 0;
  const measureStepBtn = container.querySelector("#kcfStepMeasureBtn");
  if (measureStepBtn) {
    measureStepBtn.addEventListener("click", () => {
      const { a, b, c, d } = getVals();
      const commonDen = lcm(b, d);
      const num1Common = a * (commonDen / b);
      const num2Common = c * (commonDen / d);
      const fullServings = Math.floor(num1Common / num2Common);
      const remainderUnits = num1Common % num2Common;

      currentMeasureStep = (currentMeasureStep + 1) % (fullServings + 2);
      const stage = container.querySelector("#kcfSvgTapeStage");
      if (stage) {
        stage.innerHTML = renderTapeSvg({
          a, b, c, d,
          commonDen, num1Common, num2Common,
          fullServings, remainderUnits,
          step: currentMeasureStep,
        });
      }
      if (tapeSlider) tapeSlider.value = currentMeasureStep;
      measureStepBtn.textContent = currentMeasureStep === 0
        ? "▶️ Step-by-Step Measure Fit"
        : `▶️ Serving ${currentMeasureStep} of ${fullServings}`;
    });
  }

  // Complex Fraction Transform Animation Button
  const animateProofBtn = container.querySelector("#kcfAnimateProofBtn");
  if (animateProofBtn) {
    animateProofBtn.addEventListener("click", () => {
      const mid = container.querySelector("#kcfProofMid");
      const end = container.querySelector("#kcfProofEnd");
      mid?.classList.add("is-popping");
      setTimeout(() => {
        mid?.classList.remove("is-popping");
        end?.classList.add("is-popping");
        setTimeout(() => end?.classList.remove("is-popping"), 600);
      }, 500);
    });
  }

  // Preset Buttons
  container.querySelectorAll("[data-preset-a]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const a = Number(btn.dataset.presetA);
      const b = Number(btn.dataset.presetB);
      const c = Number(btn.dataset.presetC);
      const d = Number(btn.dataset.presetD);
      const { activeTab, studioMode } = getVals();
      updateAll({ a, b, c, d, activeTab, studioMode });
    });
  });

  // Custom Recalculate Button
  const recalcBtn = container.querySelector("#kcfRecalcBtn");
  if (recalcBtn) {
    recalcBtn.addEventListener("click", () => {
      const inA = Number(container.querySelector("#kcfInA")?.value || 2);
      const inB = Number(container.querySelector("#kcfInB")?.value || 3);
      const inC = Number(container.querySelector("#kcfInC")?.value || 4);
      const inD = Number(container.querySelector("#kcfInD")?.value || 5);
      const { activeTab, studioMode } = getVals();
      updateAll({ a: inA, b: inB, c: inC, d: inD, activeTab, studioMode });
    });
  }

  // =========================================================================
  // PRACTICE MODE EVENT HANDLERS ("Put in Numbers & Solve")
  // =========================================================================
  const checkKeep = () => {
    const inA = container.querySelector("#kcfSolveInKeepA");
    const inB = container.querySelector("#kcfSolveInKeepB");
    const fb = container.querySelector("#kcfFeedbackKeep");
    if (!inA || !inB || !fb) return;
    const valA = Number(inA.value);
    const valB = Number(inB.value);
    const targetA = Number(inA.dataset.target);
    const targetB = Number(inB.dataset.target);
    if (valA === targetA && valB === targetB) {
      fb.innerHTML = "✅ Kept! Dividend unchanged.";
      fb.className = "kcf-feedback-msg is-correct";
      container.querySelector("#kcfSolveCardKeep")?.classList.add("is-solved");
    } else if (inA.value && inB.value) {
      fb.innerHTML = `Keep first fraction as ${targetA}/${targetB}.`;
      fb.className = "kcf-feedback-msg is-error";
    }
  };
  container.querySelector("#kcfSolveInKeepA")?.addEventListener("input", checkKeep);
  container.querySelector("#kcfSolveInKeepB")?.addEventListener("input", checkKeep);

  // Practice Mode: Op buttons
  container.querySelectorAll("[data-solve-op]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const op = btn.dataset.solveOp;
      const fb = container.querySelector("#kcfFeedbackChange");
      container.querySelectorAll("[data-solve-op]").forEach((b) => b.classList.toggle("is-selected", b === btn));
      if (op === "×") {
        if (fb) {
          fb.innerHTML = "✅ Correct! ÷ changes to ×.";
          fb.className = "kcf-feedback-msg is-correct";
        }
        container.querySelector("#kcfSolveCardChange")?.classList.add("is-solved");
      } else if (fb) {
        fb.innerHTML = "Change ÷ to its inverse (×).";
        fb.className = "kcf-feedback-msg is-error";
      }
    });
  });

  // Practice Mode: Flip Inputs
  const checkFlip = () => {
    const inD = container.querySelector("#kcfSolveInFlipD");
    const inC = container.querySelector("#kcfSolveInFlipC");
    const fb = container.querySelector("#kcfFeedbackFlip");
    if (!inD || !inC || !fb) return;
    const valD = Number(inD.value);
    const valC = Number(inC.value);
    const targetD = Number(inD.dataset.target);
    const targetC = Number(inC.dataset.target);
    if (valD === targetD && valC === targetC) {
      fb.innerHTML = `✅ Flipped to reciprocal ${targetD}/${targetC}!`;
      fb.className = "kcf-feedback-msg is-correct";
      container.querySelector("#kcfSolveCardFlip")?.classList.add("is-solved");
    } else if (inD.value && inC.value) {
      fb.innerHTML = `Flip numerator and denominator (${targetD}/${targetC}).`;
      fb.className = "kcf-feedback-msg is-error";
    }
  };
  container.querySelector("#kcfSolveInFlipD")?.addEventListener("input", checkFlip);
  container.querySelector("#kcfSolveInFlipC")?.addEventListener("input", checkFlip);

  // Practice Mode: Check Step 4 Raw Product
  const checkRawSolve = () => {
    const inNum = container.querySelector("#kcfSolveInProdNum");
    const inDen = container.querySelector("#kcfSolveInProdDen");
    const fb = container.querySelector("#kcfFeedbackRaw");
    const celebration = container.querySelector("#kcfSolveCelebration");
    if (!inNum || !inDen) return;

    const numCorrect = Number(inNum.value) === Number(inNum.dataset.target);
    const denCorrect = Number(inDen.value) === Number(inDen.dataset.target);

    inNum.classList.toggle("is-correct", numCorrect);
    inDen.classList.toggle("is-correct", denCorrect);

    if (numCorrect && denCorrect) {
      if (fb) {
        fb.className = "kcf-feedback-msg is-correct";
        fb.innerHTML = `✅ Correct! Raw product is ${inNum.value}/${inDen.value}.`;
      }
      if (!container.querySelector("#kcfSolveStepReduce") && !container.querySelector("#kcfSolveStep5Row")) {
        celebration?.classList.remove("is-hidden");
        celebration?.classList.add("is-animated");
      }
    } else if (inNum.value && inDen.value) {
      if (fb) {
        fb.className = "kcf-feedback-msg is-error";
        fb.innerHTML = `Multiply top by top (${inNum.dataset.target}) and bottom by bottom (${inDen.dataset.target}).`;
      }
    }
  };
  container.querySelector("#kcfCheckSolveRawBtn")?.addEventListener("click", checkRawSolve);

  // Practice Mode: Check Step 5 Simplification
  const checkReduceSolve = () => {
    const inGcf = container.querySelector("#kcfSolveInGcf");
    const inNum = container.querySelector("#kcfSolveInSimpNum");
    const inDen = container.querySelector("#kcfSolveInSimpDen");
    const fb = container.querySelector("#kcfFeedbackReduce");
    const celebration = container.querySelector("#kcfSolveCelebration");
    if (!inGcf || !inNum || !inDen) return;

    const gcfCorrect = Number(inGcf.value) === Number(inGcf.dataset.target);
    const numCorrect = Number(inNum.value) === Number(inNum.dataset.target);
    const denCorrect = Number(inDen.value) === Number(inDen.dataset.target);

    inGcf.classList.toggle("is-correct", gcfCorrect);
    inNum.classList.toggle("is-correct", numCorrect);
    inDen.classList.toggle("is-correct", denCorrect);

    if (gcfCorrect && numCorrect && denCorrect) {
      if (fb) {
        fb.className = "kcf-feedback-msg is-correct";
        fb.innerHTML = `✅ Correctly simplified to ${inNum.value}/${inDen.value}!`;
      }
      if (!container.querySelector("#kcfSolveStep5Row")) {
        celebration?.classList.remove("is-hidden");
        celebration?.classList.add("is-animated");
      }
    } else if (inGcf.value || inNum.value || inDen.value) {
      if (fb) {
        fb.className = "kcf-feedback-msg is-error";
        fb.innerHTML = `Divide top and bottom by common factor ${inGcf.dataset.target} to get ${inNum.dataset.target}/${inDen.dataset.target}.`;
      }
    }
  };
  container.querySelector("#kcfCheckReduceSolveBtn")?.addEventListener("click", checkReduceSolve);

  // Practice Mode: Check Step 5 Mixed Conversion
  const checkStep5 = () => {
    const inWhole = container.querySelector("#kcfSolveStep5Whole");
    const inRem = container.querySelector("#kcfSolveStep5Rem");
    const fb = container.querySelector("#kcfFeedbackStep5");
    const celebration = container.querySelector("#kcfSolveCelebration");
    if (!inWhole || !inRem || !fb) return;

    const valWhole = Number(inWhole.value);
    const valRem = Number(inRem.value);
    const targetWhole = Number(inWhole.dataset.target);
    const targetRem = Number(inRem.dataset.target);
    const den = container.querySelector("#kcfSolveStep5Den")?.value || 1;

    if (inWhole.value.trim() === "" || inRem.value.trim() === "") {
      fb.className = "kcf-feedback-msg is-error";
      fb.innerHTML = "Please enter both whole number and remainder.";
      return;
    }

    if (valWhole === targetWhole && valRem === targetRem) {
      fb.className = "kcf-feedback-msg is-correct";
      fb.innerHTML = `🎉 Correct! Mixed number is <strong>${targetWhole} ${targetRem}/${den}</strong>!`;
      celebration?.classList.remove("is-hidden");
      celebration?.classList.add("is-animated");
    } else {
      fb.className = "kcf-feedback-msg is-error";
      fb.innerHTML = `Not quite: Whole is <strong>${targetWhole}</strong>, remainder is <strong>${targetRem}</strong>.`;
    }
  };
  container.querySelector("#kcfCheckStep5Btn")?.addEventListener("click", checkStep5);

  // Try New Practice Problem
  const newProblemBtn = container.querySelector("#kcfNewPracticeProblemBtn");
  if (newProblemBtn) {
    newProblemBtn.addEventListener("click", () => {
      const presets = [
        { a: 3, b: 4, c: 2, d: 3 },
        { a: 2, b: 5, c: 3, d: 4 },
        { a: 5, b: 6, c: 1, d: 2 },
        { a: 3, b: 8, c: 1, d: 4 },
        { a: 4, b: 7, c: 2, d: 5 },
      ];
      const next = presets[Math.floor(Math.random() * presets.length)];
      updateAll({ ...next, studioMode: "practice" });
    });
  }
}
