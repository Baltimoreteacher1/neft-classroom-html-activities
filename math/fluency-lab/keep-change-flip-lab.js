// Keep-Change-Flip (KCF) Interactive Fraction Division Studio
// Grounded in conceptual fraction division: "How many groups fit?"
// Demonstrates why dividing by a fraction is identical to multiplying by its reciprocal.
// Features:
//   1. Textbook vertical fractions throughout.
//   2. Interactive 3-card transformation: KEEP, CHANGE, FLIP.
//   3. 3D card flip animation for reciprocal inversion.
//   4. Visual measurement tape model showing groups of c/d fitting into a/b.
//   5. Live interactive simplifier with greatest common factor (GCF) and mixed number conversion.
//   6. "Try your own fractions" sandbox with instant recalculation.

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

export function verticalFracHtml(num, den) {
  return `<span class="v-frac"><span class="v-num">${esc(num)}</span><span class="v-den">${esc(den)}</span></span>`;
}

export function renderKCFStudio({ a = 2, b = 3, c = 4, d = 5 } = {}) {
  const prodNum = a * d;
  const prodDen = b * c;
  const g = gcd(prodNum, prodDen);
  const simpNum = prodNum / g;
  const simpDen = prodDen / g;

  let mixedText = "";
  if (simpDen === 1) {
    mixedText = `${simpNum}`;
  } else if (simpNum > simpDen) {
    const whole = Math.floor(simpNum / simpDen);
    const rem = simpNum % simpDen;
    mixedText = `${whole} ${verticalFracHtml(rem, simpDen)}`;
  }

  return `
    <div class="kcf-studio-container" data-kcf-a="${a}" data-kcf-b="${b}" data-kcf-c="${c}" data-kcf-d="${d}">
      <div class="kcf-header">
        <div class="kcf-title-row">
          <span class="kcf-badge">🔄 Strategy Studio</span>
          <h4>Dividing Fractions: Keep · Change · Flip</h4>
        </div>
        <p class="kcf-subtitle">
          Dividing by a fraction asks: <em>"How many groups of ${verticalFracHtml(c, d)} fit in ${verticalFracHtml(a, b)}?"</em> Multiplying by the reciprocal gives the exact same result!
        </p>
      </div>

      <!-- Problem Hero -->
      <div class="kcf-problem-hero">
        <span class="kcf-hero-frac">${verticalFracHtml(a, b)}</span>
        <span class="kcf-hero-op">÷</span>
        <span class="kcf-hero-frac">${verticalFracHtml(c, d)}</span>
        <span class="kcf-hero-op">=</span>
        <span class="kcf-hero-target">?</span>
      </div>

      <!-- Interactive 3-Stage Cards -->
      <div class="kcf-stages-grid">
        <!-- 1. KEEP -->
        <div class="kcf-stage-card card-keep" id="kcfCardKeep">
          <div class="kcf-card-top">
            <span class="kcf-stage-pill">Step 1</span>
            <strong>KEEP</strong>
          </div>
          <div class="kcf-fraction-display">
            ${verticalFracHtml(a, b)}
          </div>
          <p class="kcf-card-desc">The first fraction stays exactly the same.</p>
          <button type="button" class="kcf-action-btn" data-kcf-action="keep">
            <span class="kcf-btn-icon">🔒</span> Keep It
          </button>
        </div>

        <!-- 2. CHANGE -->
        <div class="kcf-stage-card card-change" id="kcfCardChange">
          <div class="kcf-card-top">
            <span class="kcf-stage-pill">Step 2</span>
            <strong>CHANGE</strong>
          </div>
          <div class="kcf-operator-display" id="kcfOpDisplay">
            ÷
          </div>
          <p class="kcf-card-desc">Change division (÷) into multiplication (×).</p>
          <button type="button" class="kcf-action-btn" data-kcf-action="change">
            <span class="kcf-btn-icon">⚡</span> Change to ×
          </button>
        </div>

        <!-- 3. FLIP -->
        <div class="kcf-stage-card card-flip" id="kcfCardFlip">
          <div class="kcf-card-top">
            <span class="kcf-stage-pill">Step 3</span>
            <strong>FLIP</strong>
          </div>
          <div class="kcf-flip-wrapper">
            <div class="kcf-fraction-display kcf-flip-inner" id="kcfFlipDisplay">
              ${verticalFracHtml(c, d)}
            </div>
          </div>
          <p class="kcf-card-desc">Flip the second fraction to its <strong>reciprocal</strong>.</p>
          <button type="button" class="kcf-action-btn" data-kcf-action="flip">
            <span class="kcf-btn-icon">🔃</span> Flip to Reciprocal
          </button>
        </div>
      </div>

      <!-- Multiplied Across Calculation Banner -->
      <div class="kcf-solution-banner" id="kcfSolutionBanner">
        <div class="kcf-sol-title">4. Multiply Straight Across</div>
        <div class="kcf-sol-equation">
          ${verticalFracHtml(a, b)}
          <span style="margin: 0 0.5rem; font-size:1.5rem">×</span>
          <span class="kcf-flipped-frac">${verticalFracHtml(d, c)}</span>
          <span style="margin: 0 0.5rem; font-size:1.5rem">=</span>
          <span class="v-frac" style="font-size:1.2em">
            <span class="v-num">${a} × ${d}</span>
            <span class="v-den">${b} × ${c}</span>
          </span>
          <span style="margin: 0 0.5rem; font-size:1.5rem">=</span>
          <span class="kcf-result-frac">${verticalFracHtml(prodNum, prodDen)}</span>
          ${g > 1 ? `
            <span style="margin: 0 0.5rem; font-size:1.5rem">=</span>
            <span class="kcf-simplified-frac">${verticalFracHtml(simpNum, simpDen)}</span>
          ` : ""}
          ${mixedText && mixedText !== `${simpNum}` && mixedText !== `${prodNum}` ? `
            <span class="kcf-mixed-badge">(or ${mixedText})</span>
          ` : ""}
        </div>
        <div class="kcf-reciprocal-note">
          💡 <strong>Reciprocal Check:</strong> ${verticalFracHtml(c, d)} × ${verticalFracHtml(d, c)} = ${c * d}/${c * d} = 1. A number times its reciprocal always equals 1!
        </div>
      </div>

      <!-- Conceptual Visual Measurement Tape Model -->
      <div class="kcf-visual-tape-section">
        <div class="kcf-tape-header">
          <h5>📏 Visual Measurement Model: Why Keep-Change-Flip Works</h5>
          <button type="button" class="kcf-tape-action-btn" data-kcf-measure-step>
            ▶️ Animate Measuring Servings
          </button>
        </div>
        <div class="kcf-tape-viewport">
          <div class="kcf-tape-label">Dividend: <strong>${a}/${b} of a whole</strong></div>
          <div class="kcf-bar-track" style="--total-parts: ${b}">
            ${Array.from({ length: b }, (_, i) => `
              <div class="kcf-bar-cell ${i < a ? "is-filled" : ""}">
                ${i < a ? `<span>1/${b}</span>` : ""}
              </div>
            `).join("")}
          </div>
          <div class="kcf-measurement-readout" id="kcfMeasurementReadout">
            A whole holds ${b} parts. Exactly <strong>${simpNum}${simpDen > 1 ? `/${simpDen}` : ""}</strong> groups of size ${c}/${d} fit inside ${a}/${b}.
          </div>
        </div>
      </div>

      <!-- Custom Fraction Tester -->
      <div class="kcf-sandbox-bar">
        <span class="kcf-sb-label">Try custom fractions:</span>
        <div class="kcf-sb-inputs">
          <input type="number" min="1" max="12" value="${a}" class="kcf-num-in" id="kcfInA" aria-label="First numerator"/>
          <span>/</span>
          <input type="number" min="1" max="12" value="${b}" class="kcf-num-in" id="kcfInB" aria-label="First denominator"/>
          <span style="font-weight:800; font-size:1.25rem">÷</span>
          <input type="number" min="1" max="12" value="${c}" class="kcf-num-in" id="kcfInC" aria-label="Second numerator"/>
          <span>/</span>
          <input type="number" min="1" max="12" value="${d}" class="kcf-num-in" id="kcfInD" aria-label="Second denominator"/>
          <button type="button" class="kcf-recalc-btn" id="kcfRecalcBtn">Update Model</button>
        </div>
      </div>
    </div>
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
    };
  };

  // KEEP Button
  container.querySelectorAll("[data-kcf-action='keep']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = container.querySelector("#kcfCardKeep");
      card?.classList.toggle("is-active");
      btn.innerHTML = card?.classList.contains("is-active")
        ? '<span class="kcf-btn-icon">✅</span> Kept!'
        : '<span class="kcf-btn-icon">🔒</span> Keep It';
    });
  });

  // CHANGE Button
  container.querySelectorAll("[data-kcf-action='change']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = container.querySelector("#kcfCardChange");
      const opDisplay = container.querySelector("#kcfOpDisplay");
      card?.classList.toggle("is-active");
      if (card?.classList.contains("is-active")) {
        if (opDisplay) opDisplay.textContent = "×";
        btn.innerHTML = '<span class="kcf-btn-icon">✅</span> Changed to ×!';
      } else {
        if (opDisplay) opDisplay.textContent = "÷";
        btn.innerHTML = '<span class="kcf-btn-icon">⚡</span> Change to ×';
      }
    });
  });

  // FLIP Button
  container.querySelectorAll("[data-kcf-action='flip']").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = container.querySelector("#kcfCardFlip");
      const flipDisplay = container.querySelector("#kcfFlipDisplay");
      const { c, d } = getVals();
      card?.classList.toggle("is-active");
      if (card?.classList.contains("is-active")) {
        if (flipDisplay) flipDisplay.innerHTML = verticalFracHtml(d, c);
        btn.innerHTML = '<span class="kcf-btn-icon">✅</span> Flipped to Reciprocal!';
      } else {
        if (flipDisplay) flipDisplay.innerHTML = verticalFracHtml(c, d);
        btn.innerHTML = '<span class="kcf-btn-icon">🔃</span> Flip to Reciprocal';
      }
    });
  });

  // Animate Measuring Servings
  container.querySelectorAll("[data-kcf-measure-step]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cells = container.querySelectorAll(".kcf-bar-cell.is-filled");
      cells.forEach((cell, i) => {
        setTimeout(() => {
          cell.classList.add("is-measured");
          setTimeout(() => cell.classList.remove("is-measured"), 1200);
        }, i * 180);
      });
    });
  });

  // Custom Recalculate
  const recalcBtn = container.querySelector("#kcfRecalcBtn");
  if (recalcBtn) {
    recalcBtn.addEventListener("click", () => {
      const inA = Number(container.querySelector("#kcfInA")?.value || 2);
      const inB = Number(container.querySelector("#kcfInB")?.value || 3);
      const inC = Number(container.querySelector("#kcfInC")?.value || 4);
      const inD = Number(container.querySelector("#kcfInD")?.value || 5);
      container.innerHTML = renderKCFStudio({ a: inA, b: inB, c: inC, d: inD });
      mountKCFLab(container, options);
    });
  }
}
