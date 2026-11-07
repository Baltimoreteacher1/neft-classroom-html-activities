/**
 * Module 1: The Discourse Architect (Kinetic Syntactic Loom)
 * Targets: #discourse-architect-app
 * WIDA 2020 Proficiency Standards Telemetry + Kinetic Reflow Engine
 */

import { diagnostics } from "../../../shared/diagnostics-overlay.js";

export const WIDA_LEVELS = [
  { level: 1, name: "Entering", desc: "Single words, basic phrases, simple kernels." },
  { level: 2, name: "Emerging", desc: "Coordinated simple sentences, repetitive connectors." },
  { level: 3, name: "Developing", desc: "Subordinated clauses with commas, basic transitionals." },
  { level: 4, name: "Expanding", desc: "Compound-complex clauses with Tier 2 academic adverbs." },
  { level: 5, name: "Bridging", desc: "High-density syntactic nominalization & nuanced concession." }
];

export const VOCAB_TIERS = {
  tier3: ["consequently", "simultaneously", "inadvertently", "drastically", "conversely", "precipitate", "photosynthesis"],
  tier2: ["ceased", "stabilized", "altered", "unexpected", "reaction", "chemical", "despite", "although", "provided"],
  tier1: ["the", "was", "that", "and", "but", "so", "because", "while", "levels", "data"]
};

export class DiscourseArchitect {
  constructor(container) {
    this.container = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.container) {
      console.warn("DiscourseArchitect: Target container not found.");
      return;
    }

    this.state = {
      subordinator: null, // e.g. "Although"
      adverbial: null,    // e.g. "drastically"
      kernelClause: "the chemical reaction ceased",
      kernelIsSubordinated: false,
      elaboration: null,  // e.g. "which was unexpected"
      concession: null,   // e.g. "conversely"
      companionClause: null, // e.g. "energy levels stabilized"
      widaScore: 1,
      linguisticComplexity: 0.2,
      conventionsScore: 1.0,
      vocabRegister: 0.33,
      selectedToken: null
    };

    this.trayData = {
      subordinators: ["Although", "Even though", "Because", "While", "Provided that"],
      concessions: ["However", "Conversely", "Despite the fact that"],
      adverbials: ["drastically", "consequently", "simultaneously", "inadvertently"],
      elaborations: ["which was unexpected", "that altered the outcome"],
      companions: ["energy levels stabilized", "the precipitate dissolved", "data collection continued"]
    };

    this.init();
    diagnostics.registerState("DiscourseArchitect", () => this.getTelemetry());
  }

  init() {
    this.render();
    this.bindEvents();
    this.evaluateTelemetry();
  }

  evaluateTelemetry() {
    let complexity = 0.2;
    let conventions = 1.0;
    let tier23Count = 0;
    let totalWords = 0;

    const words = this.assembleSentence().toLowerCase().replace(/[,.]/g, "").split(/\s+/).filter(Boolean);
    totalWords = words.length || 1;

    for (const w of words) {
      if (VOCAB_TIERS.tier3.includes(w)) tier23Count += 2;
      else if (VOCAB_TIERS.tier2.includes(w)) tier23Count += 1;
    }

    const vocabRatio = Math.min(1.0, tier23Count / totalWords);

    if (this.state.subordinator) complexity += 0.35;
    if (this.state.companionClause) complexity += 0.25;
    if (this.state.elaboration) complexity += 0.2;
    if (this.state.concession) complexity += 0.15;

    // Check conventions: Subordinator requires a comma before the companion clause
    if (this.state.subordinator && !this.state.companionClause) {
      conventions = 0.6; // Fragment / dependent clause standing alone
    } else if (this.state.subordinator && this.state.companionClause) {
      conventions = 1.0;
    }

    // Determine WIDA Level (1-5)
    let level = 1;
    const composite = (complexity * 0.4) + (vocabRatio * 0.35) + (conventions * 0.25);
    if (composite >= 0.82 && this.state.subordinator && this.state.companionClause && this.state.adverbial) {
      level = 5;
    } else if (composite >= 0.65 && this.state.subordinator && this.state.companionClause) {
      level = 4;
    } else if (composite >= 0.45 && (this.state.subordinator || this.state.companionClause)) {
      level = 3;
    } else if (composite >= 0.25) {
      level = 2;
    } else {
      level = 1;
    }

    this.state.widaScore = level;
    this.state.linguisticComplexity = Math.round(complexity * 100);
    this.state.vocabRegister = Math.round(vocabRatio * 100);
    this.state.conventionsScore = Math.round(conventions * 100);

    this.updateTelemetryUI();
  }

  assembleSentence() {
    let parts = [];
    if (this.state.concession) {
      parts.push(this.state.concession + ",");
    }
    if (this.state.subordinator) {
      let subPart = this.state.subordinator + " " + this.state.kernelClause;
      if (this.state.adverbial) {
        subPart = this.state.subordinator + " " + this.state.kernelClause.replace("ceased", this.state.adverbial + " ceased");
      }
      if (this.state.elaboration) {
        subPart += ", " + this.state.elaboration;
      }
      parts.push(subPart + ",");
      if (this.state.companionClause) {
        parts.push(this.state.companionClause);
      }
    } else {
      let k = this.state.kernelClause;
      if (this.state.adverbial) {
        k = k.replace("ceased", this.state.adverbial + " ceased");
      }
      if (this.state.elaboration) {
        k += ", " + this.state.elaboration;
      }
      parts.push(k.charAt(0).toUpperCase() + k.slice(1));
      if (this.state.companionClause) {
        parts.push("and " + this.state.companionClause);
      }
    }

    let rawSentence = parts.join(" ").trim();
    if (!rawSentence.endsWith(".")) rawSentence += ".";
    return rawSentence.charAt(0).toUpperCase() + rawSentence.slice(1);
  }

  render() {
    this.container.innerHTML = `
      <div class="loom-header">
        <div class="loom-title">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            The Discourse Architect
          </h2>
          <p class="loom-subtitle">Kinetic Syntactic Loom: Build academic complex sentences across WIDA 2020 benchmarks.</p>
        </div>
        <button class="btn-secondary" id="loom-reset-btn" type="button" aria-label="Reset workspace to default kernel">
          Reset Loom
        </button>
      </div>

      <!-- Live WIDA 2020 Scoring Telemetry -->
      <section class="wida-telemetry-panel" aria-label="WIDA 2020 Live Telemetry">
        <div class="wida-scale" role="list" aria-label="WIDA Proficiency Scale">
          ${WIDA_LEVELS.map(lvl => `
            <div class="wida-step ${lvl.level === this.state.widaScore ? 'active' : ''}" id="wida-step-${lvl.level}" role="listitem">
              <span class="step-level">Level ${lvl.level}</span>
              <span class="step-name">${lvl.name}</span>
            </div>
          `).join("")}
        </div>
        <div class="wida-metrics-grid">
          <div class="metric-pill">
            <span class="metric-label">Linguistic Complexity</span>
            <span class="metric-value" id="metric-complexity">${this.state.linguisticComplexity}%</span>
          </div>
          <div class="metric-pill">
            <span class="metric-label">Language Conventions</span>
            <span class="metric-value" id="metric-conventions">${this.state.conventionsScore}%</span>
          </div>
          <div class="metric-pill">
            <span class="metric-label">Academic Vocabulary</span>
            <span class="metric-value" id="metric-vocab">${this.state.vocabRegister}%</span>
          </div>
        </div>
        <div id="wida-live-feedback" aria-live="polite" style="font-size: 13px; color: #94a3b8; font-style: italic;">
          Current benchmark: ${WIDA_LEVELS[this.state.widaScore - 1].desc}
        </div>
      </section>

      <!-- Sentence Preview -->
      <div class="sentence-preview-text" id="loom-assembled-sentence" aria-label="Compiled academic sentence">
        ${this.assembleSentence()}
      </div>

      <!-- Kinetic Workspace -->
      <div class="loom-workspace" id="loom-canvas" role="region" aria-label="Sentence Loom Construction Canvas" tabindex="0">
        <div class="loom-sentence-flow" id="sentence-flow-tokens">
          ${this.renderTokens()}
        </div>
      </div>

      <!-- Node Tray -->
      <section class="loom-tray" aria-label="Syntactic Node Tray">
        <div class="tray-category">
          <span class="tray-title">1. Subordinating Conjunctions (Transform Kernel to Dependent Clause)</span>
          <div class="tray-tokens">
            ${this.trayData.subordinators.map(sub => `
              <button type="button" class="syntactic-token token-subordinator" data-type="subordinator" data-val="${sub}" role="button" aria-grabbed="false">
                + ${sub}
              </button>
            `).join("")}
          </div>
        </div>

        <div class="tray-category">
          <span class="tray-title">2. Concession & Contrast Transitions</span>
          <div class="tray-tokens">
            ${this.trayData.concessions.map(conc => `
              <button type="button" class="syntactic-token token-concession" data-type="concession" data-val="${conc}" role="button" aria-grabbed="false">
                + ${conc}
              </button>
            `).join("")}
          </div>
        </div>

        <div class="tray-category">
          <span class="tray-title">3. Tier 2/3 Academic Adverbials</span>
          <div class="tray-tokens">
            ${this.trayData.adverbials.map(adv => `
              <button type="button" class="syntactic-token token-adverbial" data-type="adverbial" data-val="${adv}" role="button" aria-grabbed="false">
                + ${adv}
              </button>
            `).join("")}
          </div>
        </div>

        <div class="tray-category">
          <span class="tray-title">4. Elaboration Tokens (Relative Clauses)</span>
          <div class="tray-tokens">
            ${this.trayData.elaborations.map(elab => `
              <button type="button" class="syntactic-token token-elaboration" data-type="elaboration" data-val="${elab}" role="button" aria-grabbed="false">
                + ${elab}
              </button>
            `).join("")}
          </div>
        </div>

        <div class="tray-category">
          <span class="tray-title">5. Independent Clause Companions</span>
          <div class="tray-tokens">
            ${this.trayData.companions.map(comp => `
              <button type="button" class="syntactic-token token-kernel" data-type="companion" data-val="${comp}" role="button" aria-grabbed="false">
                + ${comp}
              </button>
            `).join("")}
          </div>
        </div>
      </section>
    `;
  }

  renderTokens() {
    let html = "";
    if (this.state.concession) {
      html += `
        <span class="syntactic-token token-concession" role="button" tabindex="0">
          ${this.state.concession}
          <button type="button" class="token-remove-btn" data-remove="concession" aria-label="Remove transition" style="background:none;border:none;color:#fce7f3;cursor:pointer;font-weight:bold;margin-left:4px;">&times;</button>
        </span>
      `;
    }

    if (this.state.subordinator) {
      html += `
        <span class="syntactic-token token-subordinator" role="button" tabindex="0">
          ${this.state.subordinator}
          <button type="button" class="token-remove-btn" data-remove="subordinator" aria-label="Remove subordinator" style="background:none;border:none;color:#f3e8ff;cursor:pointer;font-weight:bold;margin-left:4px;">&times;</button>
        </span>
      `;
    }

    const kernelClass = this.state.subordinator ? "syntactic-token token-kernel clause-dependent" : "syntactic-token token-kernel";
    let kernelLabel = this.state.kernelClause;
    if (this.state.adverbial) {
      kernelLabel = kernelLabel.replace("ceased", `<span style="color:#6ee7b7; text-decoration: underline;">${this.state.adverbial}</span> ceased`);
    }

    html += `
      <span class="${kernelClass}" role="button" tabindex="0">
        ${kernelLabel}
      </span>
    `;

    if (this.state.elaboration) {
      html += `
        <span class="syntactic-token token-elaboration" role="button" tabindex="0">
          ${this.state.elaboration}
          <button type="button" class="token-remove-btn" data-remove="elaboration" aria-label="Remove elaboration" style="background:none;border:none;color:#fef3c7;cursor:pointer;font-weight:bold;margin-left:4px;">&times;</button>
        </span>
      `;
    }

    if (this.state.subordinator) {
      html += `<span class="token-comma" aria-label="Clause boundary comma">,</span>`;
      if (this.state.companionClause) {
        html += `
          <span class="syntactic-token token-kernel" role="button" tabindex="0">
            ${this.state.companionClause}
            <button type="button" class="token-remove-btn" data-remove="companion" aria-label="Remove companion clause" style="background:none;border:none;color:#dbeafe;cursor:pointer;font-weight:bold;margin-left:4px;">&times;</button>
          </span>
        `;
      } else {
        html += `
          <div class="placeholder-dropzone" id="loom-companion-dropzone" role="button" tabindex="0" aria-label="Placeholder drop-zone: Drop matching independent clause here">
            [ + Drop Independent Clause Here ]
          </div>
        `;
      }
    }

    return html;
  }

  bindEvents() {
    this.container.addEventListener("click", (e) => {
      // Add from tray
      const tokenBtn = e.target.closest(".tray-tokens .syntactic-token");
      if (tokenBtn) {
        const type = tokenBtn.dataset.type;
        const val = tokenBtn.dataset.val;
        this.addToken(type, val);
        return;
      }

      // Remove button
      const removeBtn = e.target.closest(".token-remove-btn");
      if (removeBtn) {
        const removeType = removeBtn.dataset.remove;
        this.removeToken(removeType);
        return;
      }

      // Reset
      if (e.target.closest("#loom-reset-btn")) {
        this.reset();
        return;
      }

      // Dropzone click shortcut
      if (e.target.closest("#loom-companion-dropzone")) {
        this.addToken("companion", "energy levels stabilized");
      }
    });

    // Keyboard support for workspace
    const canvas = this.container.querySelector("#loom-canvas");
    if (canvas) {
      canvas.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" || e.key === "Delete") {
          if (this.state.companionClause) this.removeToken("companion");
          else if (this.state.elaboration) this.removeToken("elaboration");
          else if (this.state.subordinator) this.removeToken("subordinator");
          else if (this.state.adverbial) this.removeToken("adverbial");
          else if (this.state.concession) this.removeToken("concession");
        }
      });
    }
  }

  addToken(type, val) {
    if (type === "subordinator") {
      this.state.subordinator = val;
      this.state.kernelIsSubordinated = true;
    } else if (type === "concession") {
      this.state.concession = val;
    } else if (type === "adverbial") {
      this.state.adverbial = val;
    } else if (type === "elaboration") {
      this.state.elaboration = val;
    } else if (type === "companion") {
      this.state.companionClause = val;
    }

    this.refreshUI();
  }

  removeToken(type) {
    if (type === "subordinator") {
      this.state.subordinator = null;
      this.state.kernelIsSubordinated = false;
    } else if (type === "concession") {
      this.state.concession = null;
    } else if (type === "adverbial") {
      this.state.adverbial = null;
    } else if (type === "elaboration") {
      this.state.elaboration = null;
    } else if (type === "companion") {
      this.state.companionClause = null;
    }

    this.refreshUI();
  }

  reset() {
    this.state.subordinator = null;
    this.state.adverbial = null;
    this.state.concession = null;
    this.state.elaboration = null;
    this.state.companionClause = null;
    this.state.kernelIsSubordinated = false;
    this.refreshUI();
  }

  refreshUI() {
    const flowContainer = this.container.querySelector("#sentence-flow-tokens");
    if (flowContainer) {
      flowContainer.innerHTML = this.renderTokens();
    }
    const sentenceEl = this.container.querySelector("#loom-assembled-sentence");
    if (sentenceEl) {
      sentenceEl.textContent = this.assembleSentence();
    }
    this.evaluateTelemetry();
  }

  updateTelemetryUI() {
    for (let i = 1; i <= 5; i++) {
      const step = this.container.querySelector(`#wida-step-${i}`);
      if (step) {
        step.classList.toggle("active", i === this.state.widaScore);
      }
    }

    const cEl = this.container.querySelector("#metric-complexity");
    if (cEl) cEl.textContent = `${this.state.linguisticComplexity}%`;

    const convEl = this.container.querySelector("#metric-conventions");
    if (convEl) convEl.textContent = `${this.state.conventionsScore}%`;

    const vEl = this.container.querySelector("#metric-vocab");
    if (vEl) vEl.textContent = `${this.state.vocabRegister}%`;

    const feedEl = this.container.querySelector("#wida-live-feedback");
    if (feedEl) {
      feedEl.textContent = `Current WIDA Benchmark: ${WIDA_LEVELS[this.state.widaScore - 1].name} (Level ${this.state.widaScore}) — ${WIDA_LEVELS[this.state.widaScore - 1].desc}`;
    }
  }

  getTelemetry() {
    return {
      sentence: this.assembleSentence(),
      widaScore: this.state.widaScore,
      linguisticComplexity: this.state.linguisticComplexity,
      conventionsScore: this.state.conventionsScore,
      vocabRegister: this.state.vocabRegister
    };
  }
}

export function initDiscourseArchitect(container = "#discourse-architect-app") {
  return new DiscourseArchitect(container);
}
