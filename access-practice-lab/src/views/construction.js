// Language Construction Lab: Interactive sentence expansion, grammar-in-context, cohesion,
// and academic register manipulation (WIDA ELD Sentence and Word/Phrase dimensions).
import { crumbsHTML } from "../components.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { ART, BASE, announce, html, icon, raw, safeJson, storage } from "../util.js";

const CONST_KEY = "accessPracticeLab:v1:construction";
let I = makeI18n("en");

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

const tabs = () => [
  ["expansion", I.T("Sentence Expansion", "Expansión de oraciones")],
  ["register", I.T("Academic Register Transformer", "Transformador de registro académico")],
];

function stageTrack(challenge, stageIdx) {
  return html`<ol class="cs-stages" aria-label="${I.S("Expansion stages", "Etapas de expansión")}">
    ${challenge.stages.map(
      (_, i) =>
        html`<li class="${i < stageIdx ? "is-done" : ""} ${i === stageIdx ? "is-here" : ""}" ${i === stageIdx ? raw('aria-current="step"') : ""}>
          <span class="cs-stage-num">${i < stageIdx ? icon("check") : i + 1}</span> ${I.T(`Stage ${i + 1}`, `Etapa ${i + 1}`)}
        </li>`,
    )}
  </ol>`;
}

function expansionHTML(saved) {
  const challenge = EXPANSION_CHALLENGES[saved.challengeIdx || 0] || EXPANSION_CHALLENGES[0];
  const stageIdx = saved.stageIdx || 0;
  const stage = challenge.stages[stageIdx];
  const sentence = saved.currentText || challenge.kernel;
  return html`<article class="panel cs-card">
    <p class="eyebrow">${challenge.topic}</p>
    <h2>${I.T("Sentence Expansion Workbench", "Taller de expansión de oraciones")}</h2>
    ${stageTrack(challenge, stageIdx)}
    <div class="cs-sentence">
      <p class="cs-label">${stageIdx === 0 ? I.T("Starting sentence", "Oración inicial") : I.T("Current sentence construction", "Oración que estás construyendo")}</p>
      <p class="built-sentence"><strong>${sentence}</strong></p>
      <button type="button" class="btn ghost small" data-say="${sentence}">${icon("volume")} ${I.T("Hear sentence aloud", "Escuchar la oración en voz alta")}</button>
    </div>
    ${
      stage
        ? html`<div class="stage-container">
            <h3><span class="cs-stage-tag">${I.T(`Stage ${stageIdx + 1} of ${challenge.stages.length}`, `Etapa ${stageIdx + 1} de ${challenge.stages.length}`)}</span> ${stage.prompt}</h3>
            <div class="options-grid">
              ${stage.options.map(
                (opt, oIdx) => html`<div class="cs-option">
                  <p class="cs-option-text">${opt.text}</p>
                  <p class="cs-option-note"><span>${I.T("Register note", "Nota de registro")}</span> ${opt.note}</p>
                  <button type="button" class="btn btn-secondary small" data-const-add="${oIdx}">${icon("arrow-right")} ${I.T("Insert and expand", "Insertar y expandir")}</button>
                </div>`,
              )}
            </div>
          </div>`
        : html`<div class="completion-banner" role="status">
            <p class="fb-title">${icon("check")} ${I.T("Sentence complete", "Oración completa")}</p>
            <p>${I.T("You expanded a short kernel into a complex academic sentence with cause, place and consequence clauses. Read it aloud, then try another challenge.", "Expandiste una oración corta en una oración académica compleja con cláusulas de causa, lugar y consecuencia. Léela en voz alta y luego prueba otro reto.")}</p>
            <button type="button" class="btn btn-primary btn-domain" data-const-reset>${I.T("Try another expansion challenge", "Probar otro reto de expansión")} ${icon("arrow-right")}</button>
          </div>`
    }
  </article>`;
}

function registerHTML(saved) {
  return html`<article class="panel cs-card">
    <p class="eyebrow">${I.T("Academic elevation", "Elevación académica")}</p>
    <h2>${I.T("Academic Register Transformer", "Transformador de registro académico")}</h2>
    <p class="cs-intro">${I.T("Evaluate conversational expressions and choose the formal, academic equivalent.", "Evalúa expresiones de conversación y elige el equivalente formal y académico.")}</p>
    ${REGISTER_TRANSFORMS.map(
      (rt, idx) => html`<section class="cs-register" aria-labelledby="regq-${idx}">
        <p class="cs-label">${icon("conversation")} ${I.T("Informal, conversational phrasing", "Forma informal, de conversación")}</p>
        <blockquote class="informal-speech" id="regq-${idx}">${rt.informal}</blockquote>
        <h3>${I.T("Select the formal academic construction", "Elige la construcción formal y académica")}</h3>
        <div class="choices options-group">
          ${rt.options.map((opt, oIdx) => {
            const chosen = saved.transforms?.[idx] === oIdx;
            return html`<div class="cs-opt">
              <label class="choice ${chosen ? "is-on" : ""}">
                <input type="radio" name="reg-trans-${idx}" value="${oIdx}" data-reg-select="${idx}:${oIdx}" ${chosen ? raw("checked") : ""} />
                <span class="choice-letter">${String.fromCharCode(65 + oIdx)}</span>
                <span>${opt.text}</span>
              </label>
              ${
                chosen
                  ? html`<div class="feedback ${opt.correct ? "is-right" : "is-hint"}" role="status">
                      <p class="fb-title">${icon(opt.correct ? "check" : "bulb")} ${opt.correct ? I.T("Formal academic wording", "Redacción formal y académica") : I.T("Needs refinement", "Necesita mejorarse")}</p>
                      <p>${opt.reason}</p>
                    </div>`
                  : ""
              }
            </div>`;
          })}
        </div>
      </section>`,
    )}
  </article>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  const saved = safeJson(storage.get(CONST_KEY), {}) || {};
  const activeTab = ctx.route.tab === "register" ? "register" : "expansion";

  return {
    title: I.S("Language Construction Lab", "Laboratorio de construcción del lenguaje"),
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], [I.S("Language Construction Lab", "Laboratorio de construcción del lenguaje"), null]])}
      <div class="cs d-writing">
        <section class="lx-hero">
          <div>
            <p class="eyebrow">${icon("construction")} ${I.T("Grammar-in-context and cohesion workbench", "Taller de gramática en contexto y cohesión")}</p>
            <h1 tabindex="-1">${I.T("Language Construction Lab", "Laboratorio de construcción del lenguaje")}</h1>
            <p class="lead">${I.T("Manipulate, expand, and elevate sentences. Build complex syntax, academic cohesion, and formal register.", "Manipula, expande y mejora oraciones. Construye sintaxis compleja, cohesión académica y registro formal.")}</p>
          </div>
          <div class="lx-hero-art"><img src="${ART}/domain-writing.svg" alt="" width="480" height="360" /></div>
        </section>

        <div class="cs-tabs" role="group" aria-label="${I.S("Choose a workbench", "Elige un taller")}">
          ${tabs().map(
            ([id, label], i) => html`<button type="button" class="cs-tab" data-const-tab="${id}" aria-pressed="${String(activeTab === id)}">
              <span class="cs-tab-num">${i + 1}</span>${label}
            </button>`,
          )}
        </div>

        ${activeTab === "expansion" ? expansionHTML(saved) : registerHTML(saved)}
      </div>`,
  };
}

export function onConstructionEvent(t, ctx) {
  const L = i18nFor(ctx);
  const tab = t.closest("[data-const-tab]");
  if (tab) {
    const val = tab.dataset.constTab;
    const url = new URL(location.href);
    url.searchParams.set("tab", val);
    ctx.navigate(url.pathname + url.search);
    return false;
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
    announce(L.S("Sentence expanded.", "Oración expandida."));
    return true;
  }

  const reset = t.closest("[data-const-reset]");
  if (reset) {
    const saved = safeJson(storage.get(CONST_KEY), {}) || {};
    saved.challengeIdx = ((saved.challengeIdx || 0) + 1) % EXPANSION_CHALLENGES.length;
    saved.stageIdx = 0;
    saved.currentText = "";
    storage.set(CONST_KEY, JSON.stringify(saved));
    announce(L.S("Loaded next challenge.", "Se cargó el siguiente reto."));
    return true;
  }

  const regSelect = t.closest("[data-reg-select]");
  if (regSelect) {
    const [qIdx, oIdx] = regSelect.dataset.regSelect.split(":").map(Number);
    const saved = safeJson(storage.get(CONST_KEY), {}) || {};
    saved.transforms = saved.transforms || {};
    saved.transforms[qIdx] = oIdx;
    storage.set(CONST_KEY, JSON.stringify(saved));
    announce(L.S("Selection updated.", "Selección actualizada."));
    return true;
  }

  return false;
}
