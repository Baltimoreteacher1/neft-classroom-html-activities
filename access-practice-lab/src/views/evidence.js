// Evidence-to-Language Studio: Transform diagrams, charts, and observations into
// student-generated academic explanations (WIDA Key Language Uses: Explain & Inform).
import { crumbsHTML } from "../components.js";
import { speak } from "../speech.js";
import { BASE, announce, html, raw, safeJson, storage } from "../util.js";

const EVIDENCE_KEY = "accessPracticeLab:v1:evidence_studio";

export const EVIDENCE_SETS = [
  {
    id: "renewable-energy",
    title: "Global Renewable Energy Transition (2015–2025)",
    domain: "Science & Engineering",
    type: "Data Chart",
    dataPoints: [
      { id: "dp1", label: "Solar Photovoltaic Cost", value: "Declined 82%", tag: "Economic Driver" },
      { id: "dp2", label: "Wind Capacity Installed", value: "Grew from 432 GW to 1,020 GW", tag: "Infrastructure Growth" },
      { id: "dp3", label: "Grid Battery Storage", value: "Expanded by 1,400%", tag: "Reliability & Storage" },
      { id: "dp4", label: "Fossil Fuel Share of Electricity", value: "Decreased from 67% to 48%", tag: "Systemic Transition" }
    ],
    stems: {
      observation: "Between 2015 and 2025, solar photovoltaic energy costs declined by 82%, while installed wind capacity more than doubled.",
      interpretation: "This dramatic price decline made renewable infrastructure more cost-effective than conventional fossil fuels.",
      explanation: "Consequently, utility providers invested heavily in grid-scale battery storage, enabling clean energy to replace traditional coal generation without compromising power reliability."
    }
  },
  {
    id: "water-erosion",
    title: "Vegetative Cover and Topsoil Retention",
    domain: "Earth Systems",
    type: "Field Experiment",
    dataPoints: [
      { id: "dp1", label: "Bare Soil Slope", value: "Lost 48 tons of sediment per acre/year", tag: "Erosion Risk" },
      { id: "dp2", label: "Grassland Buffer", value: "Lost 4 tons of sediment per acre/year", tag: "Moderate Protection" },
      { id: "dp3", label: "Forested Canopy with Root Network", value: "Lost under 0.5 tons per acre/year", tag: "Maximum Protection" }
    ],
    stems: {
      observation: "Data indicates that slopes lacking vegetative cover experienced 48 tons of annual sediment loss compared to less than 0.5 tons in forested areas.",
      interpretation: "Deep root systems bind soil particles together, while dense tree canopies intercept rainfall and reduce direct surface impact.",
      explanation: "As a result, retaining vegetative buffers along slopes dramatically prevents catastrophic topsoil erosion and protects riverbeds from sedimentation."
    }
  }
];

export async function render(ctx) {
  const saved = safeJson(storage.get(EVIDENCE_KEY), {}) || {};
  const currentSetIdx = saved.setIdx || 0;
  const evSet = EVIDENCE_SETS[currentSetIdx] || EVIDENCE_SETS[0];
  const selectedDps = new Set(saved.selected || []);

  const breadcrumbs = [
    ["Lab", `${BASE}/?grades=${ctx.band}`],
    ["Evidence-to-Language Studio", null],
  ];

  return {
    title: "Evidence-to-Language Studio",
    html: html`${crumbsHTML(breadcrumbs)}
      <section class="room-hero" style="--room:#2b9348">
        <div>
          <span class="badge" style="background:#2b9348; color:white">Data-to-Language Scaffold</span>
          <h1 tabindex="-1">📊 Evidence-to-Language Studio</h1>
          <p class="lead">Transform charts, diagrams, and scientific observations into authoritative, evidence-based academic explanations.</p>
        </div>
      </section>

      <article class="panel evidence-panel">
        <header>
          <span class="eyebrow">${evSet.domain} · ${evSet.type}</span>
          <h2>${evSet.title}</h2>
          <p>Click data points below to collect evidence into your Evidence Notebook.</p>
        </header>

        <div class="evidence-grid">
          ${evSet.dataPoints.map((dp) => {
            const isPicked = selectedDps.has(dp.id);
            return html`<button
              type="button"
              class="card evidence-card ${isPicked ? "is-selected" : ""}"
              data-evidence-toggle="${dp.id}"
            >
              <span class="badge">${dp.tag}</span>
              <h3>${dp.label}</h3>
              <p class="data-val">📈 ${dp.value}</p>
              <span class="fine">${isPicked ? "✓ Collected in Notebook" : "+ Click to Collect"}</span>
            </button>`;
          })}
        </div>

        <section class="notebook-section card">
          <h3>📓 Academic Explanation Construction</h3>
          <p class="fine">Follow the 3-step scientific discourse model: Observation → Interpretation → Causal Explanation.</p>

          <div class="step-card">
            <span class="eyebrow">Step 1: Observation (What do the numbers show?)</span>
            <p class="model-stem">${evSet.stems.observation}</p>
            <button type="button" class="btn ghost small" data-say="${evSet.stems.observation}">
              🔊 Hear Observation Aloud
            </button>
          </div>

          <div class="step-card">
            <span class="eyebrow">Step 2: Interpretation (Why does this matter?)</span>
            <p class="model-stem">${evSet.stems.interpretation}</p>
            <button type="button" class="btn ghost small" data-say="${evSet.stems.interpretation}">
              🔊 Hear Interpretation Aloud
            </button>
          </div>

          <div class="step-card">
            <span class="eyebrow">Step 3: Causal Explanation (What is the overall consequence?)</span>
            <p class="model-stem">${evSet.stems.explanation}</p>
            <button type="button" class="btn ghost small" data-say="${evSet.stems.explanation}">
              🔊 Hear Explanation Aloud
            </button>
          </div>

          <div class="row-actions">
            <button type="button" class="btn btn-secondary" data-evidence-next>
              Next Evidence Investigation →
            </button>
          </div>
        </section>
      </article>`,
  };
}

export function onEvidenceEvent(t, ctx) {
  const toggle = t.closest("[data-evidence-toggle]");
  if (toggle) {
    const dpId = toggle.dataset.evidenceToggle;
    const saved = safeJson(storage.get(EVIDENCE_KEY), {}) || {};
    const selected = new Set(saved.selected || []);
    if (selected.has(dpId)) selected.delete(dpId);
    else selected.add(dpId);
    saved.selected = [...selected];
    storage.set(EVIDENCE_KEY, JSON.stringify(saved));
    announce("Evidence notebook updated.");
    return true;
  }

  const nextBtn = t.closest("[data-evidence-next]");
  if (nextBtn) {
    const saved = safeJson(storage.get(EVIDENCE_KEY), {}) || {};
    saved.setIdx = ((saved.setIdx || 0) + 1) % EVIDENCE_SETS.length;
    saved.selected = [];
    storage.set(EVIDENCE_KEY, JSON.stringify(saved));
    announce("Next evidence set loaded.");
    return true;
  }

  return false;
}
