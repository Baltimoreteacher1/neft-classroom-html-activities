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

export function renderKCFStudio({
  a = 2,
  b = 3,
  c = 4,
  d = 5,
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

  // Quotient representation
  let mixedText = "";
  if (simpDen === 1) {
    mixedText = `<strong class="kcf-res-val">${simpNum}</strong>`;
  } else if (simpNum > simpDen) {
    const whole = Math.floor(simpNum / simpDen);
    const rem = simpNum % simpDen;
    mixedText = `<strong class="kcf-res-val">${whole}</strong> ${verticalFracHtml(rem, simpDen, "kcf-mixed-frac")}`;
  } else {
    mixedText = verticalFracHtml(simpNum, simpDen, "kcf-mixed-frac");
  }

  // Quotitive serving count
  const fullServings = Math.floor(num1Common / num2Common);
  const remainderUnits = num1Common % num2Common;
  const activeMeasureStep = measureStep != null ? measureStep : fullServings;

  return `
    <div class="kcf-studio-container" data-kcf-a="${a}" data-kcf-b="${b}" data-kcf-c="${c}" data-kcf-d="${d}" data-kcf-tab="${activeTab}" data-kcf-mode="${studioMode}">
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
          Grounded in the question: <em>"How many groups of ${verticalFracHtml(c, d)} fit into ${verticalFracHtml(a, b)}?"</em> &nbsp;—&nbsp;
          Type your own numbers directly into the fractions below to explore!
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

          <span class="kcf-hero-op">÷</span>

          <!-- Second Fraction (Divisor) -->
          <div class="kcf-interactive-fraction-box" title="Divisor: Click to type custom number">
            <input type="number" min="1" max="24" value="${c}" class="kcf-hero-in kcf-in-num" id="kcfInHeroC" aria-label="Divisor numerator" />
            <span class="kcf-hero-bar"></span>
            <input type="number" min="1" max="24" value="${d}" class="kcf-hero-in kcf-in-den" id="kcfInHeroD" aria-label="Divisor denominator" />
          </div>

          <span class="kcf-hero-op">=</span>

          <span class="kcf-hero-result" id="kcfHeroResultDisplay">${mixedText}</span>
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
                <p>Since the pieces are the same size, divide the numerators directly: <strong>${num1Common} ÷ ${num2Common} = ${verticalFracHtml(num1Common, num2Common)} = ${mixedText}</strong> servings!</p>
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
                <span class="kcf-final-badge">${mixedText}</span>
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
            <h6>Step 4: Multiply Straight Across</h6>
            <div class="kcf-solve-mult-row">
              <div class="kcf-solve-term">
                <label>Top (${a} × ${d}):</label>
                <input type="number" class="kcf-solve-input-small" id="kcfSolveInProdNum" placeholder="?" data-target="${prodNum}" />
              </div>
              <span class="kcf-solve-slash">/</span>
              <div class="kcf-solve-term">
                <label>Bottom (${b} × ${c}):</label>
                <input type="number" class="kcf-solve-input-small" id="kcfSolveInProdDen" placeholder="?" data-target="${prodDen}" />
              </div>
              <span class="kcf-solve-arrow">➔</span>
              <div class="kcf-solve-term">
                <label>Simplified Final Answer:</label>
                <input type="text" class="kcf-solve-input-final" id="kcfSolveInFinal" placeholder="${simpDen === 1 ? simpNum : `${simpNum}/${simpDen}`}" data-target-num="${simpNum}" data-target-den="${simpDen}" />
              </div>
              <button type="button" class="kcf-check-solve-btn" id="kcfCheckSolveAllBtn">Check My Work</button>
            </div>
            <div class="kcf-solve-celebration is-hidden" id="kcfSolveCelebration">
              🎉 <strong>Outstanding job!</strong> You executed Keep · Change · Flip flawlessly!
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

  // Practice Mode: Check Multiply All
  const checkWorkoutBtn = container.querySelector("#kcfCheckSolveAllBtn");
  if (checkWorkoutBtn) {
    checkWorkoutBtn.addEventListener("click", () => {
      checkKeep();
      checkFlip();
      const inNum = container.querySelector("#kcfSolveInProdNum");
      const inDen = container.querySelector("#kcfSolveInProdDen");
      const inFinal = container.querySelector("#kcfSolveInFinal");
      const celebration = container.querySelector("#kcfSolveCelebration");

      const numCorrect = Number(inNum?.value) === Number(inNum?.dataset.target);
      const denCorrect = Number(inDen?.value) === Number(inDen?.dataset.target);

      const targetSimpNum = Number(inFinal?.dataset.targetNum);
      const targetSimpDen = Number(inFinal?.dataset.targetDen);
      const finalVal = inFinal?.value?.trim() || "";
      let finalCorrect = false;

      if (targetSimpDen === 1) {
        finalCorrect = finalVal === String(targetSimpNum);
      } else {
        finalCorrect = finalVal === `${targetSimpNum}/${targetSimpDen}` ||
          finalVal === `${targetSimpNum} / ${targetSimpDen}` ||
          finalVal === `${Math.floor(targetSimpNum / targetSimpDen)} ${targetSimpNum % targetSimpDen}/${targetSimpDen}`;
      }

      inNum?.classList.toggle("is-correct", numCorrect);
      inDen?.classList.toggle("is-correct", denCorrect);
      inFinal?.classList.toggle("is-correct", finalCorrect);

      if (numCorrect && denCorrect && finalCorrect) {
        celebration?.classList.remove("is-hidden");
        celebration?.classList.add("is-animated");
      }
    });
  }

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
