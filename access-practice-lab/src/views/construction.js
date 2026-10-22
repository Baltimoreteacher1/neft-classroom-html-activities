// Language Construction Lab: Interactive sentence expansion, grammar-in-context, cohesion,
// and academic register manipulation (WIDA ELD Sentence and Word/Phrase dimensions).
import { crumbsHTML } from "../components.js";
import { speak } from "../speech.js";
import { BASE, announce, html, raw, safeJson, storage } from "../util.js";

const CONST_KEY = "accessPracticeLab:v1:construction";

export const EXPANSION_CHALLENGES = [
  {
    id: "glacier-melt",
    topic: "Earth Science: Climate & Sea Level",
    kernel: "Glaciers melt.",
    stages: [
      {
        prompt: "Add a causal clause explaining WHY this happens.",
        options: [
          { text: "Because global atmospheric temperatures continue to climb,", note: "Adverbial causal clause" },
          { text: "Because ice is cold,", note: "Too basic" },
          { text: "Since summer is fun,", note: "Informal" }
        ],
        target: "Because global atmospheric temperatures continue to climb, glaciers melt."
      },
      {
        prompt: "Now add a prepositional phrase specifying WHERE and HOW FAST.",
        options: [
          { text: "in polar and alpine regions at an unprecedented rate,", note: "Specific geographical & rate modifiers" },
          { text: "everywhere a lot,", note: "Vague" }
        ],
        target: "Because global atmospheric temperatures continue to climb, glaciers in polar and alpine regions melt at an unprecedented rate."
      },
      {
        prompt: "Finally, add a dependent relative clause describing the CONSEQUENCE.",
        options: [
          { text: "which accelerates sea level rise and imperils low-lying coastal biomes.", note: "High academic register with precise vocabulary" },
          { text: "which makes water get higher.", note: "Basic informal" }
        ],
        target: "Because global atmospheric temperatures continue to climb, glaciers in polar and alpine regions melt at an unprecedented rate, which accelerates sea level rise and imperils low-lying coastal biomes."
      }
    ]
  },
  {
    id: "plant-photosynthesis",
    topic: "Life Science: Cellular Energy & Ecosystems",
    kernel: "Plants produce glucose.",
    stages: [
      {
        prompt: "Add an adverbial clause explaining the PROCESS.",
        options: [
          { text: "By capturing solar photons through chlorophyll molecules,", note: "Specific biological process" },
          { text: "When the sun shines,", note: "Informal" }
        ],
        target: "By capturing solar photons through chlorophyll molecules, plants produce glucose."
      },
      {
        prompt: "Now specify the INPUT MATERIALS (water and carbon dioxide).",
        options: [
          { text: "from ambient carbon dioxide and groundwater,", note: "Precise scientific chemical inputs" },
          { text: "from air and dirt,", note: "Too informal" }
        ],
        target: "By capturing solar photons through chlorophyll molecules, plants produce glucose from ambient carbon dioxide and groundwater."
      },
      {
        prompt: "Finally, explain the FUNCTION for the broader food web.",
        options: [
          { text: "establishing the foundational chemical energy for all terrestrial food webs.", note: "Explains ecological role and trophic level" },
          { text: "so bugs and animals have stuff to eat.", note: "Casual phrasing" }
        ],
        target: "By capturing solar photons through chlorophyll molecules, plants produce glucose from ambient carbon dioxide and groundwater, establishing the foundational chemical energy for all terrestrial food webs."
      }
    ]
  }
];

export const REGISTER_TRANSFORMS = [
  {
    informal: "A lot of animals die when it gets super hot and dry.",
    options: [
      {
        text: "Prolonged arid conditions and extreme thermal elevation result in significant wildlife mortality.",
        correct: true,
        reason: "Uses academic vocabulary ('arid conditions', 'thermal elevation', 'wildlife mortality') and cause/effect cohesion."
      },
      {
        text: "Animals pass away because the weather is way too hot outside.",
        correct: false,
        reason: "Still relies on colloquial phrasing ('pass away', 'way too hot')."
      }
    ]
  },
  {
    informal: "The scientist did the test over and over to be really sure.",
    options: [
      {
        text: "The investigator conducted repeated experimental trials to ensure empirical reliability and data validity.",
        correct: true,
        reason: "Replaces informal phrases with precise scientific terminology: 'repeated experimental trials', 'empirical reliability'."
      },
      {
        text: "The scientist repeated the test many times to check it.",
        correct: false,
        reason: "Simple sentence structure without domain-specific research terminology."
      }
    ]
  }
];

export async function render(ctx) {
  const saved = safeJson(storage.get(CONST_KEY), {}) || {};
  const activeTab = ctx.route.tab || "expansion";
  const challengeIdx = saved.challengeIdx || 0;
  const challenge = EXPANSION_CHALLENGES[challengeIdx] || EXPANSION_CHALLENGES[0];
  const stageIdx = saved.stageIdx || 0;
  const currentStage = challenge.stages[stageIdx];

  const breadcrumbs = [
    ["Lab", `${BASE}/?grades=${ctx.band}`],
    ["Language Construction Lab", null],
  ];

  return {
    title: "Language Construction Lab",
    html: html`${crumbsHTML(breadcrumbs)}
      <section class="room-hero" style="--room:#6a4c93">
        <div>
          <span class="badge" style="background:#6a4c93; color:white">Grammar-in-Context & Cohesion Workbench</span>
          <h1 tabindex="-1">🧱 Language Construction Lab</h1>
          <p class="lead">Manipulate, expand, and elevate sentences. Build complex syntax, academic cohesion, and formal register.</p>
        </div>
      </section>

      <div class="mission-nav" role="tablist">
        <button
          type="button"
          class="mission-step-btn ${activeTab === "expansion" ? "is-active" : ""}"
          data-const-tab="expansion"
        >
          <span class="step-num">1</span>
          <span class="step-label">Sentence Expansion</span>
        </button>
        <button
          type="button"
          class="mission-step-btn ${activeTab === "register" ? "is-active" : ""}"
          data-const-tab="register"
        >
          <span class="step-num">2</span>
          <span class="step-label">Academic Register Transformer</span>
        </button>
      </div>

      ${
        activeTab === "expansion"
          ? html`<article class="panel construction-card">
              <span class="eyebrow">${challenge.topic}</span>
              <h2>Sentence Expansion Workbench</h2>

              <div class="workbench-display card">
                <span class="fine">Current Sentence Construction:</span>
                <p class="built-sentence">
                  <strong>${saved.currentText || challenge.kernel}</strong>
                </p>
                <button type="button" class="btn ghost small" data-say="${saved.currentText || challenge.kernel}">
                  🔊 Hear Sentence Aloud
                </button>
              </div>

              ${
                stageIdx < challenge.stages.length
                  ? html`<div class="stage-container">
                      <h3>Stage ${stageIdx + 1} of ${challenge.stages.length}: ${currentStage.prompt}</h3>
                      <div class="options-grid">
                        ${currentStage.options.map((opt, oIdx) => html`<div class="card construction-option">
                            <p><strong>${opt.text}</strong></p>
                            <span class="fine">${opt.note}</span>
                            <div class="row-actions">
                              <button
                                type="button"
                                class="btn btn-secondary small"
                                data-const-add="${oIdx}"
                              >
                                + Insert & Expand
                              </button>
                            </div>
                          </div>`)}
                      </div>
                    </div>`
                  : html`<div class="completion-banner">
                      <h3>⭐ Masterful Sentence Construction Completed!</h3>
                      <p>You transformed a simple 2-word kernel into an authoritative, publisher-grade academic complex sentence with causal, spatial, and consequence clauses.</p>
                      <button type="button" class="btn btn-primary" data-const-reset>
                        Try Another Expansion Challenge →
                      </button>
                    </div>`
              }
            </article>`
          : ""
      }

      ${
        activeTab === "register"
          ? html`<article class="panel construction-card">
              <span class="eyebrow">Academic Elevation</span>
              <h2>Academic Register Transformer</h2>
              <p>Evaluate conversational expressions and choose the formal, authoritative academic equivalent.</p>

              ${REGISTER_TRANSFORMS.map((rt, idx) => html`<div class="card register-card">
                  <span class="eyebrow">Informal / Conversational Phrasing</span>
                  <p class="informal-speech">💬 “${rt.informal}”</p>

                  <h4>Select the Formal Academic Construction:</h4>
                  <div class="options-group">
                    ${rt.options.map((opt, oIdx) => {
                      const isChosen = saved.transforms?.[idx] === oIdx;
                      return html`<label class="choice-option ${isChosen ? "selected" : ""}">
                        <input
                          type="radio"
                          name="reg-trans-${idx}"
                          value="${oIdx}"
                          data-reg-select="${idx}:${oIdx}"
                          ${isChosen ? raw("checked") : ""}
                        />
                        <span>${opt.text}</span>
                      </label>
                      ${isChosen ? html`<p class="fine ${opt.correct ? "pass" : "warn"}"><strong>${opt.correct ? "✓ Academic Excellence" : "Needs Refinement"}:</strong> ${opt.reason}</p>` : ""}`;
                    })}
                  </div>
                </div>`)}
            </article>`
          : ""
      }`,
  };
}

export function onConstructionEvent(t, ctx) {
  const tab = t.closest("[data-const-tab]");
  if (tab) {
    const val = tab.dataset.constTab;
    const url = new URL(location.href);
    url.searchParams.set("tab", val);
    location.href = url.pathname + url.search;
    return true;
  }

  const add = t.closest("[data-const-add]");
  if (add) {
    const oIdx = Number(add.dataset.constAdd);
    const saved = safeJson(storage.get(CONST_KEY), {}) || {};
    const challengeIdx = saved.challengeIdx || 0;
    const challenge = EXPANSION_CHALLENGES[challengeIdx] || EXPANSION_CHALLENGES[0];
    const stageIdx = saved.stageIdx || 0;

    saved.stageIdx = stageIdx + 1;
    saved.currentText = challenge.stages[stageIdx].target;
    storage.set(CONST_KEY, JSON.stringify(saved));
    announce("Sentence expanded.");
    return true;
  }

  const reset = t.closest("[data-const-reset]");
  if (reset) {
    const saved = safeJson(storage.get(CONST_KEY), {}) || {};
    saved.challengeIdx = ((saved.challengeIdx || 0) + 1) % EXPANSION_CHALLENGES.length;
    saved.stageIdx = 0;
    saved.currentText = "";
    storage.set(CONST_KEY, JSON.stringify(saved));
    announce("Loaded next challenge.");
    return true;
  }

  const regSelect = t.closest("[data-reg-select]");
  if (regSelect) {
    const [qIdx, oIdx] = regSelect.dataset.regSelect.split(":").map(Number);
    const saved = safeJson(storage.get(CONST_KEY), {}) || {};
    saved.transforms = saved.transforms || {};
    saved.transforms[qIdx] = oIdx;
    storage.set(CONST_KEY, JSON.stringify(saved));
    announce("Selection updated.");
    return true;
  }

  return false;
}
