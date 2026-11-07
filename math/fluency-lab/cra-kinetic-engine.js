/**
 * Module 5: The Interconnected CRA Kinetic Engine (Dynamic Representation Canvas)
 * Target: #cra-kinetic-engine-app
 * Features: Single RationalState object, 3-panel synchronized viewport
 * (Concrete, Representational, Abstract), bi-directional sync, topological stress feedback.
 */

import { diagnostics } from "../../shared/diagnostics-overlay.js";
import { RationalNumber } from "../../shared/rational-math.js";

export class RationalState {
  constructor(a = 2, b = 5, multiplier = 3) {
    this.ratio = new RationalNumber(a, b);
    this.multiplier = multiplier;
    this.scaledRatio = new RationalNumber(a * multiplier, b * multiplier);
    this.isStressed = false;
    this.stressMessage = "";
    this.discrepancy = null;
  }

  setMultiplier(m) {
    if (m <= 0) {
      this.triggerStress("Zero or negative scaling invalid in proportional models.");
      return;
    }
    this.multiplier = m;
    this.scaledRatio = new RationalNumber(Number(this.ratio.n) * m, Number(this.ratio.d) * m);
    this.isStressed = false;
    this.stressMessage = "";
    this.discrepancy = null;
  }

  attemptAdditiveScaling(delta) {
    // Student tries to add delta to both numerator and denominator
    const newN = Number(this.ratio.n) + delta;
    const newD = Number(this.ratio.d) + delta;
    const additiveResult = new RationalNumber(newN, newD);

    // Topological Stress!
    this.isStressed = true;
    const expected = this.ratio.toNumber();
    const actual = additiveResult.toNumber();
    const diff = additiveResult.sub(this.ratio);

    this.discrepancy = diff;
    this.stressMessage = `Topological Stress: Additive scaling (+${delta}) changed ratio from ${this.ratio.toString()} (${expected.toFixed(2)}) to ${additiveResult.toString()} (${actual.toFixed(2)}). Discrepancy: ${diff.toString()}`;
  }

  clearStress() {
    this.isStressed = false;
    this.stressMessage = "";
    this.discrepancy = null;
  }
}

export class CraKineticEngine {
  constructor(container) {
    this.container = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.container) {
      console.warn("CraKineticEngine: Target container not found.");
      return;
    }

    this.state = new RationalState(2, 5, 3);
    this.init();
    diagnostics.registerState("CRA_KineticEngine", () => this.getTelemetry());
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    const r = this.state.ratio;
    const mult = this.state.multiplier;
    const scaled = this.state.scaledRatio;
    const isStressed = this.state.isStressed;

    this.container.innerHTML = `
      <div class="cra-header">
        <div class="cra-title">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" aria-hidden="true">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
            Interconnected CRA Kinetic Engine
          </h2>
          <p class="cra-subtitle">Synchronized Dynamic Viewport: Concrete (Fluid/Balance), Representational (Tape/Number Line), Abstract (Algebraic).</p>
        </div>

        <div class="cra-action-row">
          <button type="button" class="btn-secondary" id="cra-simulate-additive-stress-btn" style="border-color:#ef4444; color:#f87171;">
            ⚡ Trigger Additive Stress Test (+3)
          </button>
          <button type="button" class="btn-secondary" id="cra-reset-balance-btn">
            ↺ Restore Equilibrium
          </button>
        </div>
      </div>

      <!-- 3-Panel Synchronized Viewport Grid -->
      <div class="cra-viewport-grid">
        <!-- Panel A: Concrete (Fluid Mixing Cylinders & Balance Scales) -->
        <div class="cra-panel ${isStressed ? 'topological-stress' : ''}" id="cra-panel-a" role="region" aria-label="Panel A: Concrete Fluid Model">
          <div class="cra-panel-badge">
            <span>Panel A: Concrete Model</span>
            <span>Fluid: ${scaled.n * 10n}mL / ${scaled.d * 10n}mL</span>
          </div>

          <div class="cra-canvas-box">
            <div class="fluid-cylinder-wrapper">
              <div>
                <div class="cylinder-glass" title="Quantity A Cylinder">
                  <div class="cylinder-fluid" style="height: ${Math.min(100, Number(scaled.n) * 8)}%;"></div>
                </div>
                <div style="font-size:11px; text-align:center; color:#94a3b8; margin-top:4px;">Solute (${scaled.n})</div>
              </div>
              <div>
                <div class="cylinder-glass" title="Quantity B Cylinder">
                  <div class="cylinder-fluid alt" style="height: ${Math.min(100, Number(scaled.d) * 5)}%;"></div>
                </div>
                <div style="font-size:11px; text-align:center; color:#94a3b8; margin-top:4px;">Solvent (${scaled.d})</div>
              </div>
            </div>
          </div>
          <div style="font-size:12px; color:#cbd5e1; text-align:center;">
            Dynamic dual-liquid volume scales proportionally with multiplier k.
          </div>
        </div>

        <!-- Panel B: Representational (Tape Diagram & Double Number Line) -->
        <div class="cra-panel ${isStressed ? 'topological-stress' : ''}" id="cra-panel-b" role="region" aria-label="Panel B: Representational Tape Diagram">
          <div class="cra-panel-badge">
            <span>Panel B: Representational</span>
            <span>Scale Factor: ${mult}×</span>
          </div>

          <div class="cra-canvas-box">
            <svg class="tape-diagram-svg" viewBox="0 0 280 130" role="img" aria-label="Double Tape Diagram">
              <!-- Tape A (2 blocks scaled by mult) -->
              <text x="10" y="24" fill="#94a3b8" font-size="11" font-weight="700">Quantity A:</text>
              <rect x="80" y="10" width="${Number(scaled.n) * 16}" height="24" rx="4" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5" />
              <text x="${80 + (Number(scaled.n) * 8)}" y="26" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">${scaled.n}</text>

              <!-- Tape B (5 blocks scaled by mult) -->
              <text x="10" y="68" fill="#94a3b8" font-size="11" font-weight="700">Quantity B:</text>
              <rect x="80" y="54" width="${Number(scaled.d) * 9}" height="24" rx="4" fill="#7e22ce" stroke="#c084fc" stroke-width="1.5" />
              <text x="${80 + (Number(scaled.d) * 4.5)}" y="70" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">${scaled.d}</text>

              <!-- Proportional Ratio Handle Axis -->
              <line x1="80" y1="98" x2="260" y2="98" stroke="#334155" stroke-width="2" />
              <circle cx="${80 + mult * 40}" cy="98" r="7" fill="#38bdf8" stroke="#ffffff" stroke-width="2" style="cursor:ew-resize;" />
              <text x="${80 + mult * 40}" y="120" fill="#38bdf8" font-size="10" font-weight="700" text-anchor="middle">k = ${mult}</text>
            </svg>
          </div>
          <div class="coefficient-slider-row">
            <label for="cra-multiplier-slider" style="font-size:12px; color:#94a3b8; font-weight:600;">Scale (k):</label>
            <input type="range" id="cra-multiplier-slider" min="1" max="6" step="1" value="${mult}" aria-label="Proportional multiplier slider">
            <span style="font-family:monospace; font-weight:700; color:#38bdf8;">${mult}×</span>
          </div>
        </div>

        <!-- Panel C: Abstract (Algebraic Expression / Equation Editor) -->
        <div class="cra-panel ${isStressed ? 'topological-stress' : ''}" id="cra-panel-c" role="region" aria-label="Panel C: Abstract Equation Editor">
          <div class="cra-panel-badge">
            <span>Panel C: Abstract Symbolic</span>
            <span>${isStressed ? 'Status: LOCKED' : 'Status: BALANCED'}</span>
          </div>

          <div class="cra-canvas-box">
            <div class="equation-editor-box">
              <div class="equation-display ${isStressed ? 'inequality' : ''}">
                <span>${r.n} / ${r.d}</span>
                <span style="color:${isStressed ? '#ef4444' : '#10b981'};">${isStressed ? '≠' : '='}</span>
                <span>${isStressed ? `${Number(r.n) + 3} / ${Number(r.d) + 3}` : `${scaled.n} / ${scaled.d}`}</span>
              </div>

              ${isStressed ? `
                <div class="stress-offset-badge">
                  Discrepancy: ${this.state.discrepancy ? this.state.discrepancy.toString() : '+3/3'}
                </div>
              ` : `
                <div style="font-size:13px; color:#10b981; font-weight:600;">
                  Invariant Ratio: k = ${(scaled.toNumber() / r.toNumber()).toFixed(1)}
                </div>
              `}
            </div>
          </div>
          <div style="font-size:12px; color:#cbd5e1; text-align:center;">
            Algebraic formula: <em>a / b = (k · a) / (k · b)</em>
          </div>
        </div>
      </div>

      ${isStressed ? `
        <div style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; border-radius:8px; padding:12px 16px; color:#fca5a5; font-size:13px;" role="alert">
          <strong>⚠️ Topological Collision Detected:</strong> ${this.state.stressMessage}
        </div>
      ` : ''}
    `;
  }

  bindEvents() {
    // Multiplier slider
    this.container.addEventListener("input", (e) => {
      if (e.target.id === "cra-multiplier-slider") {
        const val = parseInt(e.target.value, 10);
        this.state.setMultiplier(val);
        this.render();
        this.bindEvents();
      }
    });

    this.container.addEventListener("click", (e) => {
      if (e.target.closest("#cra-simulate-additive-stress-btn")) {
        this.state.attemptAdditiveScaling(3);
        this.render();
        this.bindEvents();
      }

      if (e.target.closest("#cra-reset-balance-btn")) {
        this.state.clearStress();
        this.render();
        this.bindEvents();
      }
    });
  }

  getTelemetry() {
    return {
      ratio: this.state.ratio.toString(),
      multiplier: this.state.multiplier,
      scaledRatio: this.state.scaledRatio.toString(),
      isStressed: this.state.isStressed,
      discrepancy: this.state.discrepancy ? this.state.discrepancy.toString() : null
    };
  }
}

export function initCraKineticEngine(container = "#cra-kinetic-engine-app") {
  return new CraKineticEngine(container);
}
