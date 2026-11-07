/**
 * Module 3: The Multimodal Translanguaging Bridge
 * Target: #translanguaging-bridge-app
 * Features: High-density semantic node tree, SVG radial morphological cognate graph,
 * and Dual-Track Thought Pad (L1/codeswitching -> Formal Academic Blueprint).
 */

import { diagnostics } from "../../../shared/diagnostics-overlay.js";

export const GRADE_6_CONCEPTS = [
  {
    id: "photosynthesis",
    term: "Photosynthesis",
    tier: "Tier 3",
    domain: "Life Science",
    root: { lang: "Greek", morpheme: "photo- (light) + synthesis (putting together)" },
    cognates: {
      es: "Fotosíntesis",
      fr: "Photosynthèse",
      pt: "Fotossíntese",
      ar: "التركيب الضوئي (Tarkeeb Daw'ee)"
    },
    visualModel: "leaf-sun",
    stems: [
      "Solar radiation is converted into biochemical energy via...",
      "Consequently, primary producers synthesize glucose while releasing...",
      "Although carbon dioxide is consumed, the overall byproduct remains..."
    ]
  },
  {
    id: "convection",
    term: "Thermal Convection",
    tier: "Tier 3",
    domain: "Earth Science",
    root: { lang: "Latin", morpheme: "convehere (to carry together: con- + vehere)" },
    cognates: {
      es: "Convección térmica",
      fr: "Convection thermique",
      pt: "Convecção térmica",
      ar: "الحمل الحراري (Al-Haml Al-Harari)"
    },
    visualModel: "circular-current",
    stems: [
      "As thermal kinetic energy increases, the fluid density decreases, resulting in...",
      "Conversely, cooler sinking currents establish a cyclic motion known as...",
      "According to physical models, mantle convection directly drives..."
    ]
  },
  {
    id: "proportionality",
    term: "Proportionality",
    tier: "Tier 2/3",
    domain: "Mathematics",
    root: { lang: "Latin", morpheme: "proportio (comparative relation: pro + portio)" },
    cognates: {
      es: "Proporcionalidad",
      fr: "Proportionnalité",
      pt: "Proporcionalidade",
      ar: "التناسب (At-Tanasub)"
    },
    visualModel: "ratio-scale",
    stems: [
      "Because the ratio remains constant, scaling the numerator requires...",
      "The constant of proportionality (k = y/x) illustrates that...",
      "In contrast to additive patterns, multiplicative invariance preserves..."
    ]
  },
  {
    id: "tectonics",
    term: "Plate Tectonics",
    tier: "Tier 3",
    domain: "Earth Science",
    root: { lang: "Greek", morpheme: "tektonikos (builder / architecture)" },
    cognates: {
      es: "Tectónica de placas",
      fr: "Tectonique des plaques",
      pt: "Tectônica de placas",
      ar: "تكتونية الصفائح (Taktoniyyat As-Safaeh)"
    },
    visualModel: "fault-lines",
    stems: [
      "At convergent plate boundaries, intense subduction generates...",
      "Simultaneously, transform faults release accumulated seismic strain as...",
      "Despite gradual millimeter-scale movement, tectonic collisions ultimately form..."
    ]
  },
  {
    id: "equilibrium",
    term: "Equilibrium",
    tier: "Tier 2",
    domain: "Interdisciplinary",
    root: { lang: "Latin", morpheme: "aequilibrium (equal balance: aequus + libra)" },
    cognates: {
      es: "Equilibrio",
      fr: "Équilibre",
      pt: "Equilíbrio",
      ar: "التوازن (At-Tawazun)"
    },
    visualModel: "balance-scale",
    stems: [
      "When opposing forces or rates equalize, the system maintains dynamic...",
      "An unexpected disruption in trophic levels destabilizes the...",
      "Provided that the balance is undisturbed, internal homeostasis..."
    ]
  }
];

export class TranslanguagingBridge {
  constructor(container) {
    this.container = typeof container === "string" ? document.querySelector(container) : container;
    if (!this.container) {
      console.warn("TranslanguagingBridge: Target container not found.");
      return;
    }

    this.state = {
      activeConceptId: "photosynthesis",
      searchQuery: "",
      activeL1: "es", // es, fr, pt, ar
      l1Draft: "",
      englishBlueprint: ""
    };

    this.init();
    diagnostics.registerState("TranslanguagingBridge", () => this.getTelemetry());
  }

  init() {
    this.render();
    this.bindEvents();
  }

  getActiveConcept() {
    return GRADE_6_CONCEPTS.find(c => c.id === this.state.activeConceptId) || GRADE_6_CONCEPTS[0];
  }

  render() {
    const concept = this.getActiveConcept();
    const filteredConcepts = GRADE_6_CONCEPTS.filter(c =>
      c.term.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(this.state.searchQuery.toLowerCase())
    );

    this.container.innerHTML = `
      <div class="trans-header">
        <div class="trans-title">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" aria-hidden="true">
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            Multimodal Translanguaging Bridge
          </h2>
          <p class="trans-subtitle">Morphological Cognate Graph & Dual-Track Thought Pad for Grade 6 Concepts.</p>
        </div>

        <div class="trans-search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="trans-concept-search" placeholder="Search academic concepts..." value="${this.state.searchQuery}" aria-label="Search academic concepts">
        </div>
      </div>

      <!-- Morphological Cognate Graph Section -->
      <section class="cognate-graph-section" aria-label="Morphological Cognate Graph">
        <div class="concept-node-tree" role="tablist" aria-label="Academic Concept Selection Tree">
          ${filteredConcepts.map(c => `
            <button type="button" class="concept-node-btn ${c.id === this.state.activeConceptId ? 'active' : ''}" data-concept-id="${c.id}" role="tab" aria-selected="${c.id === this.state.activeConceptId}">
              <span>${c.term}</span>
              <small style="color:#64748b; font-size:11px;">${c.tier}</small>
            </button>
          `).join("")}
        </div>

        <!-- SVG Radial Branch Display -->
        <div class="radial-graph-container" id="radial-graph-box">
          <svg viewBox="0 0 460 300" width="100%" height="280" role="img" aria-label="Radial Morphological Cognate Graph for ${concept.term}">
            <!-- Center Node (Concept) -->
            <circle cx="230" cy="150" r="48" fill="#1e3a8a" stroke="#38bdf8" stroke-width="2.5" />
            <text x="230" y="146" fill="#f8fafc" font-size="12" font-weight="700" text-anchor="middle">${concept.term.split(" ")[0]}</text>
            <text x="230" y="162" fill="#93c5fd" font-size="10" text-anchor="middle">${concept.tier}</text>

            <!-- Radial Spokes -->
            <!-- Top: Root Morpheme -->
            <line x1="230" y1="102" x2="230" y2="45" stroke="#475569" stroke-width="2" stroke-dasharray="4 2" />
            <rect x="110" y="16" width="240" height="32" rx="6" fill="#0f172a" stroke="#c084fc" stroke-width="1.5" />
            <text x="230" y="36" fill="#e9d5ff" font-size="11" font-weight="600" text-anchor="middle">Root (${concept.root.lang}): ${concept.root.morpheme}</text>

            <!-- Left: Spanish Cognate -->
            <line x1="182" y1="150" x2="90" y2="150" stroke="#475569" stroke-width="2" />
            <rect x="10" y="132" width="100" height="36" rx="6" fill="#0f172a" stroke="#34d399" stroke-width="1.5" />
            <text x="60" y="148" fill="#a7f3d0" font-size="10" font-weight="700" text-anchor="middle">ES (Español)</text>
            <text x="60" y="161" fill="#f8fafc" font-size="10" text-anchor="middle">${concept.cognates.es.split(" ")[0]}</text>

            <!-- Right: French Cognate -->
            <line x1="278" y1="150" x2="370" y2="150" stroke="#475569" stroke-width="2" />
            <rect x="350" y="132" width="100" height="36" rx="6" fill="#0f172a" stroke="#60a5fa" stroke-width="1.5" />
            <text x="400" y="148" fill="#bfdbfe" font-size="10" font-weight="700" text-anchor="middle">FR (Français)</text>
            <text x="400" y="161" fill="#f8fafc" font-size="10" text-anchor="middle">${concept.cognates.fr.split(" ")[0]}</text>

            <!-- Bottom Left: Portuguese Cognate -->
            <line x1="196" y1="184" x2="130" y2="245" stroke="#475569" stroke-width="2" />
            <rect x="60" y="240" width="120" height="36" rx="6" fill="#0f172a" stroke="#f59e0b" stroke-width="1.5" />
            <text x="120" y="256" fill="#fde68a" font-size="10" font-weight="700" text-anchor="middle">PT (Português)</text>
            <text x="120" y="269" fill="#f8fafc" font-size="10" text-anchor="middle">${concept.cognates.pt.split(" ")[0]}</text>

            <!-- Bottom Right: Arabic Anchor -->
            <line x1="264" y1="184" x2="330" y2="245" stroke="#475569" stroke-width="2" />
            <rect x="280" y="240" width="140" height="36" rx="6" fill="#0f172a" stroke="#f43f5e" stroke-width="1.5" />
            <text x="350" y="256" fill="#fbcfe8" font-size="10" font-weight="700" text-anchor="middle">AR (العربية)</text>
            <text x="350" y="269" fill="#f8fafc" font-size="10" text-anchor="middle">${concept.cognates.ar.split(" ")[0]}</text>
          </svg>
        </div>
      </section>

      <!-- Dual-Track Thought Pad -->
      <section class="dual-track-container" aria-label="Dual-Track Thought Pad">
        <!-- Track 1: L1 / Home Language Brainstorm -->
        <div class="track-column">
          <div class="track-header">
            <span class="track-title">Track 1: Home Language / L1 Thought Stream</span>
            <div class="lang-selector-row" role="group" aria-label="Select thinking language">
              <button type="button" class="lang-tag-btn ${this.state.activeL1 === 'es' ? 'active' : ''}" data-lang="es">Español</button>
              <button type="button" class="lang-tag-btn ${this.state.activeL1 === 'fr' ? 'active' : ''}" data-lang="fr">Français</button>
              <button type="button" class="lang-tag-btn ${this.state.activeL1 === 'pt' ? 'active' : ''}" data-lang="pt">Português</button>
              <button type="button" class="lang-tag-btn ${this.state.activeL1 === 'ar' ? 'active' : ''}" data-lang="ar">العربية</button>
            </div>
          </div>
          <textarea
            class="thought-textarea"
            id="l1-thought-input"
            placeholder="Express your raw thinking freely in your home language or code-switch here (e.g. Las plantas necesitan la luz solar para crear glucosa y energía...)"
            aria-label="Home Language thought brainstorming pad"
          >${this.state.l1Draft}</textarea>
          <div style="font-size:12px; color:#64748b;">
            💡 Your original voice is preserved. Use code-switching, cognates, or bullet ideas.
          </div>
        </div>

        <!-- Track 2: Structural Academic English Blueprint -->
        <div class="track-column">
          <div class="track-header">
            <span class="track-title">Track 2: Formal Academic Blueprint</span>
            <span style="font-size:11px; color:#38bdf8; font-weight:600;">WIDA Expanding/Bridging</span>
          </div>
          <div class="blueprint-stems-list" role="list" aria-label="Target Academic Sentence Stems">
            ${concept.stems.map((stem, i) => `
              <div class="blueprint-stem-item" role="button" tabindex="0" data-stem="${stem}" aria-label="Insert academic stem ${i + 1}">
                + "${stem}"
              </div>
            `).join("")}
          </div>
          <textarea
            class="thought-textarea"
            id="academic-output-area"
            placeholder="Synthesize your L1 ideas into this formal academic English response..."
            aria-label="Formal academic English synthesis output"
          >${this.state.englishBlueprint}</textarea>
        </div>
      </section>

      <div class="bridge-action-bar">
        <button type="button" class="btn-secondary" id="bridge-copy-btn">
          📋 Copy Academic Response
        </button>
        <span id="bridge-toast" style="font-size:13px; color:#34d399; display:none;" aria-live="polite">✓ Copied to clipboard!</span>
      </div>
    `;
  }

  bindEvents() {
    this.container.addEventListener("click", (e) => {
      // Concept Selection
      const conceptBtn = e.target.closest(".concept-node-btn");
      if (conceptBtn) {
        this.state.activeConceptId = conceptBtn.dataset.conceptId;
        this.render();
        this.bindEvents();
        return;
      }

      // Language tag change
      const langBtn = e.target.closest(".lang-tag-btn");
      if (langBtn) {
        this.state.activeL1 = langBtn.dataset.lang;
        this.render();
        this.bindEvents();
        return;
      }

      // Stem insert
      const stemItem = e.target.closest(".blueprint-stem-item");
      if (stemItem) {
        const stem = stemItem.dataset.stem;
        const textarea = this.container.querySelector("#academic-output-area");
        if (textarea) {
          textarea.value = (textarea.value ? textarea.value + " " : "") + stem;
          this.state.englishBlueprint = textarea.value;
        }
        return;
      }

      // Copy
      if (e.target.closest("#bridge-copy-btn")) {
        const textarea = this.container.querySelector("#academic-output-area");
        if (textarea && textarea.value) {
          navigator.clipboard.writeText(textarea.value).then(() => {
            const toast = this.container.querySelector("#bridge-toast");
            if (toast) {
              toast.style.display = "inline";
              setTimeout(() => { toast.style.display = "none"; }, 2500);
            }
          }).catch(() => {});
        }
      }
    });

    // Search input
    const searchInput = this.container.querySelector("#trans-concept-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.state.searchQuery = e.target.value;
        const tree = this.container.querySelector(".concept-node-tree");
        if (tree) {
          const filtered = GRADE_6_CONCEPTS.filter(c =>
            c.term.toLowerCase().includes(this.state.searchQuery.toLowerCase()) ||
            c.domain.toLowerCase().includes(this.state.searchQuery.toLowerCase())
          );
          tree.innerHTML = filtered.map(c => `
            <button type="button" class="concept-node-btn ${c.id === this.state.activeConceptId ? 'active' : ''}" data-concept-id="${c.id}" role="tab" aria-selected="${c.id === this.state.activeConceptId}">
              <span>${c.term}</span>
              <small style="color:#64748b; font-size:11px;">${c.tier}</small>
            </button>
          `).join("");
        }
      });
    }

    // Textareas state preservation
    const l1Input = this.container.querySelector("#l1-thought-input");
    if (l1Input) {
      l1Input.addEventListener("input", (e) => {
        this.state.l1Draft = e.target.value;
      });
    }

    const enInput = this.container.querySelector("#academic-output-area");
    if (enInput) {
      enInput.addEventListener("input", (e) => {
        this.state.englishBlueprint = e.target.value;
      });
    }
  }

  getTelemetry() {
    return {
      activeConcept: this.state.activeConceptId,
      activeL1: this.state.activeL1,
      l1WordCount: this.state.l1Draft.trim().split(/\s+/).filter(Boolean).length,
      englishWordCount: this.state.englishBlueprint.trim().split(/\s+/).filter(Boolean).length
    };
  }
}

export function initTranslanguagingBridge(container = "#translanguaging-bridge-app") {
  return new TranslanguagingBridge(container);
}
