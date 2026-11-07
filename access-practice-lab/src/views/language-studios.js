// Language Studios — The Language Page / EduWonderLab
// Cutting-edge interactive manipulatives for English Learners (ELs) and Academic Language Acquisition:
//   1. WIDA Academic Discourse Level Slider (Levels 1–5: Entering to Bridging across Science, Social Studies, Math)
//   2. Dynamic Syntax Clause Slicer & Connector (Independent vs Dependent with auto-comma logic)
//   3. Concentric Morphology & Multilingual Cognate Wheel (Prefix-Root-Suffix with Spanish bridges)
//   4. Discourse Cohesion & Logic Balancer (Claim vs Evidence vs Reasoning CER with connector vault)
//   5. Spot the Syntax Glitch (Error analysis bug-hunt cards)

import { crumbsHTML } from "../components.js";
import { BASE, ICONS, esc, html, icon, raw, toHtml } from "../util.js";
import { i18nFor } from "../i18n.js";
import { dictationControlsHTML, toggleDictation } from "../dictation-ui.js";
import {
  analyzeRatioExplanation,
  checkRatioTransfer,
  ratioTransferBase,
  supportForLevel,
} from "../studios/math-reasoning-bridge.js";

// Plain-string icon for the template-string markup in this file.
const ico = (name) => `<svg class="ico" aria-hidden="true" focusable="false"><use href="${ICONS}#${name}"></use></svg>`;

// --- 1. WIDA Academic Discourse Scenarios ---
export const WIDA_DISCOURSE_DATA = {
  science: {
    domain: "Science: Energy & Ecosystems",
    levels: [
      {
        level: 1,
        title: "Level 1: Entering",
        passage: "Sun. Plant make food. Animal eat plant.",
        wordLevel: "Single words & everyday nouns (sun, plant, animal).",
        sentenceLevel: "Short repetitive phrase fragments.",
        discourseLevel: "No transitional connectors.",
      },
      {
        level: 2,
        title: "Level 2: Emerging",
        passage: "Plants get sunlight and they make food. Then rabbits eat the green plants.",
        wordLevel: "Basic sequential vocabulary (then, green).",
        sentenceLevel: "Compound sentences joined by 'and', 'then'.",
        discourseLevel: "Beginning chronological linkage.",
      },
      {
        level: 3,
        title: "Level 3: Developing",
        passage: "Because plants absorb radiant sunlight through their leaves, they produce glucose for energy. Primary consumers like rabbits rely directly on these producers for survival.",
        wordLevel: "Tier 2 & 3 academic terminology (absorb, radiant, glucose, consumers).",
        sentenceLevel: "Complex sentences with subordinate clauses ('Because plants absorb...').",
        discourseLevel: "Cause-and-effect relationship established across sentences.",
      },
      {
        level: 4,
        title: "Level 4: Expanding",
        passage: "During the process of photosynthesis, autotrophs convert solar energy into chemical bonds within glucose molecules. Consequently, any disruption to the producer population immediately destabilizes higher trophic levels in the food web.",
        wordLevel: "Specialized disciplinary technical terms (autotrophs, trophic levels).",
        sentenceLevel: "Fronted prepositional phrases, passive voice, nominalized clauses.",
        discourseLevel: "Cohesive discourse markers ('Consequently', 'any disruption...').",
      },
      {
        level: 5,
        title: "Level 5: Bridging",
        passage: "Photosynthetic energy transduction serves as the thermodynamic foundation of terrestrial ecosystems. Consequently, thermodynamic efficiency dictates that only approximately ten percent of energy transfers between successive trophic tiers, inevitably constraining apex predator biomass.",
        wordLevel: "Dense, abstract academic nominalizations (transduction, thermodynamic efficiency).",
        sentenceLevel: "Syntactically dense embedded clauses with parenthetical precision.",
        discourseLevel: "Sustained, nuanced disciplinary argumentation with modal nuance.",
      },
    ],
  },
  socialStudies: {
    domain: "Social Studies: Democratic Governance",
    levels: [
      {
        level: 1,
        title: "Level 1: Entering",
        passage: "People vote. Leader make law.",
        wordLevel: "Basic content words (people, vote, law).",
        sentenceLevel: "Simple Subject-Verb-Object.",
        discourseLevel: "Isolated statements.",
      },
      {
        level: 2,
        title: "Level 2: Emerging",
        passage: "Citizens vote for leaders so the leaders can write fair rules for the city.",
        wordLevel: "High-frequency civic words (citizens, rules, fair).",
        sentenceLevel: "Compound sentences with 'so'.",
        discourseLevel: "Simple purpose connection.",
      },
      {
        level: 3,
        title: "Level 3: Developing",
        passage: "When citizens participate in democratic elections, they select representatives who draft legislation. This system ensures that governmental power remains accountable to the public.",
        wordLevel: "Civic terminology (participate, representatives, legislation, accountable).",
        sentenceLevel: "Complex sentences with relative clauses ('who draft legislation').",
        discourseLevel: "Referential cohesion ('This system ensures...').",
      },
      {
        level: 4,
        title: "Level 4: Expanding",
        passage: "By exercising their constitutional franchise through secret ballots, electorates delegate authority to legislative bodies. Consequently, institutional legitimacy depends entirely on transparent election protocols and equal voting access.",
        wordLevel: "Formal legal and political terms (constitutional franchise, electorates).",
        sentenceLevel: "Participial phrases ('By exercising...'), abstract passive constructions.",
        discourseLevel: "Analytical cause-consequence linking ('Consequently, institutional legitimacy...').",
      },
      {
        level: 5,
        title: "Level 5: Bridging",
        passage: "The deliberate decentralization of governmental authority into tripartite branches serves as a constitutional safeguard against tyranny. Furthermore, robust civic participation and the enfranchisement of marginalized constituencies remain indispensable prerequisites for sustaining democratic pluralism.",
        wordLevel: "Abstract academic phrasing (decentralization, tripartite branches, enfranchisement).",
        sentenceLevel: "Highly structured multi-clausal periods with parallel noun phrases.",
        discourseLevel: "Sophisticated ideological argumentation and cohesive rhetorical balance.",
      },
    ],
  },
  math: {
    domain: "Math: Proportional Reasoning",
    levels: [
      {
        level: 1,
        title: "Level 1: Entering",
        passage: "2 cups flour. 1 cup sugar. More flour.",
        wordLevel: "Concrete measurement units and quantities.",
        sentenceLevel: "Phrasal fragments without verbs.",
        discourseLevel: "No relational connective.",
      },
      {
        level: 2,
        title: "Level 2: Emerging",
        passage: "You need two cups of flour for every one cup of sugar to make the recipe.",
        wordLevel: "Relational words ('for every').",
        sentenceLevel: "Prepositional phrases.",
        discourseLevel: "Direct one-to-one correspondence.",
      },
      {
        level: 3,
        title: "Level 3: Developing",
        passage: "The ratio of flour to sugar is 2:1, which means the amount of flour is always double the amount of sugar. If you triple the batch, you must multiply both quantities by three to maintain proportionality.",
        wordLevel: "Mathematical terms (ratio, double, batch, proportionality).",
        sentenceLevel: "Non-defining relative clauses ('which means...') and conditional structures ('If you triple...').",
        discourseLevel: "Logical deduction and invariance reasoning.",
      },
      {
        level: 4,
        title: "Level 4: Expanding",
        passage: "Because the relationship between flour and sugar exhibits a constant rate of change, the unit rate equals 2 cups of flour per cup of sugar. Graphing this linear function yields a line passing through the origin with a slope of k = 2.",
        wordLevel: "Function terminology (constant rate of change, unit rate, linear function, slope).",
        sentenceLevel: "Causal subordinate clause with coordinate predicate.",
        discourseLevel: "Multi-modal cross-representation (tabular to algebraic to graphical).",
      },
      {
        level: 5,
        title: "Level 5: Bridging",
        passage: "The constant of proportionality, k = 2, defines the invariant multiplicative relationship y = kx between the independent and dependent variables. Hence, scalar transformations preserve the geometric colinearity of the coordinates on the Cartesian plane.",
        wordLevel: "Formal mathematical abstraction (constant of proportionality, invariant, scalar).",
        sentenceLevel: "Syntactically dense appositive and modifying clauses.",
        discourseLevel: "Rigorous formal mathematical proof and deductive synthesis.",
      },
    ],
  },
};

// --- 2. Dynamic Syntax Slicer Models ---
export const SYNTAX_CLAUSES = [
  {
    id: "sc-1",
    dependent: "Although the temperature dropped dramatically",
    independent: "the chemical reaction proceeded at a normal rate",
    depType: "Concession Clause",
    indepType: "Main Clause",
  },
  {
    id: "sc-2",
    dependent: "Because the river flooded the lowlands",
    independent: "the ancient farmers cultivated nutrient-rich silt",
    depType: "Causal Subordinate",
    indepType: "Main Clause",
  },
  {
    id: "sc-3",
    dependent: "While the legislative committee reviewed the amendments",
    independent: "citizens organized peaceful public hearings outside city hall",
    depType: "Temporal Clause",
    indepType: "Main Clause",
  },
];

// --- 3. Concentric Morphology Data ---
export const WHEEL_DATA = {
  prefixes: [
    { text: "re-", meaning: "again / back", spanish: "re-" },
    { text: "in- / im-", meaning: "into / inside or not", spanish: "in- / im-" },
    { text: "trans-", meaning: "across / through", spanish: "trans-" },
    { text: "de-", meaning: "down / away from", spanish: "de-" },
    { text: "con-", meaning: "together / with", spanish: "con-" },
  ],
  roots: [
    { text: "struct", origin: "Latin (struere)", meaning: "to build", spanish: "construir / estructura" },
    { text: "port", origin: "Latin (portare)", meaning: "to carry", spanish: "transportar / importar" },
    { text: "tract", origin: "Latin (trahere)", meaning: "to pull or drag", spanish: "atraer / contrato" },
    { text: "form", origin: "Latin (formare)", meaning: "shape / mold", spanish: "transformar / reforma" },
    { text: "scrib", origin: "Latin (scribere)", meaning: "to write", spanish: "describir / escribir" },
  ],
  suffixes: [
    { text: "-ion", meaning: "act or result of (noun)", pos: "Noun", spanish: "-ción" },
    { text: "-able", meaning: "able to be (adjective)", pos: "Adjective", spanish: "-able" },
    { text: "-ive", meaning: "having the nature of (adjective)", pos: "Adjective", spanish: "-ivo / -iva" },
    { text: "-or / -er", meaning: "one who performs the action (noun)", pos: "Noun", spanish: "-or" },
    { text: "-ed", meaning: "completed past action (verb)", pos: "Verb", spanish: "-ado / -ido" },
  ],
};

// --- 4. Discourse Cohesion Balancer ---
export const COHESION_PASSAGES = [
  {
    id: "coh-1",
    context: "Renewable Energy Transition",
    claim: "Solar energy reduces carbon emissions and operates with virtually zero fuel cost.",
    slotNeed: "contrast",
    targetConnector: "However",
    options: ["However", "Consequently", "Furthermore", "Similarly"],
    evidence: "solar power generation remains dependent on daily sunlight availability and requires substantial battery storage capacity.",
    correctExplain: "'However' signals a concession/contrast between the benefits and the limitations of solar energy.",
  },
  {
    id: "coh-2",
    context: "Ecosystem Stability",
    claim: "Deforestation removes the root systems that anchor topsoil on hillsides.",
    slotNeed: "cause-effect",
    targetConnector: "Consequently",
    options: ["Consequently", "On the other hand", "In contrast", "Conversely"],
    evidence: "heavy seasonal rainfall triggers severe mudslides and destroys downstream aquatic habitats.",
    correctExplain: "'Consequently' indicates the direct cause-and-effect relationship between soil destabilization and subsequent mudslides.",
  },
];

// --- 5. Spot the Syntax Glitch Bug Hunt ---
export const SYNTAX_GLITCHES = [
  {
    id: "glitch-1",
    title: "Subject-Verb Agreement with Intervening Phrase",
    sentence: "The collection of rare volcanic minerals in the museum exhibit [are] inspected by geologists weekly.",
    glitchPart: "are",
    replacement: "is",
    rule: "The subject is the singular noun 'collection', NOT the plural 'minerals' inside the prepositional phrase. Singular subjects take singular verbs: 'The collection... is inspected.'",
  },
  {
    id: "glitch-2",
    title: "Comma Splice / Run-On Sentence",
    sentence: "The telescope focused on the distant nebula, [it] revealed vibrant gaseous clouds.",
    glitchPart: "it",
    replacement: "; it (or ', and it')",
    rule: "Two independent clauses cannot be joined by a bare comma. Add a coordinating conjunction (', and it') or use a semicolon ('; it').",
  },
  {
    id: "glitch-3",
    title: "Misplaced Modifier",
    sentence: "[Walking into the laboratory], the microscope was adjusted by the research assistant.",
    glitchPart: "the microscope was adjusted",
    replacement: "the research assistant adjusted the microscope",
    rule: "A participial phrase must modify the actor who was actually walking. The microscope was not walking into the laboratory!",
  },
  {
    id: "glitch-4",
    title: "Inconsistent Verb Tense Shift",
    sentence: "The historian examined the parchment carefully and [discovers] a hidden signature.",
    glitchPart: "discovers",
    replacement: "discovered",
    rule: "Maintain consistent past tense throughout the narrative compound predicate: 'examined... and discovered'.",
  },
];

// In-memory state
let state = {
  tab: "wida", // "wida", "syntax", "wheel", "cohesion", "glitch"
  widaDomain: "science",
  widaLevel: 3,
  clauseDepFirst: true,
  activeClauseIdx: 0,
  wheelP: 0,
  wheelR: 0,
  wheelS: 0,
  cohIdx: 0,
  cohSelected: null,
  glitchActiveId: null,
  bridgeKey: "",
  bridgeStep: "draft",
  bridgeSupport: 3,
  bridgeTransferCorrect: false,
  bridgeDraft: "",
  bridgeRevision: "",
  bridgeTransfer: "",
  bridgeTransferExplain: "",
  bridgeTransferFeedback: "",
};

function ratioBridgePanel(bridge, I, language) {
  const firstx3 = bridge.first * 3;
  const secondx3 = bridge.second * 3;
  const [transferFirst, transferSecond] = ratioTransferBase(bridge);
  const support = supportForLevel(state.bridgeSupport, language);
  const bank = support?.bank?.map((word) => `<span>${esc(word)}</span>`).join("") || "";
  const features = (response) => {
    const result = analyzeRatioExplanation(response);
    const items = [
      [result.evidence.namesBoth, I.T("Names both quantities", "Nombra las dos cantidades")],
      [result.evidence.usesRatioWord, I.T("Uses ratio language", "Usa lenguaje de razones")],
      [result.evidence.connectsReason, I.T("Connects ideas with a reason", "Conecta las ideas con una razón")],
    ];
    return `<p class="mlb-feedback">${I.T(result.feedback.en, result.feedback.es)}</p><ul class="mlb-evidence">${items.map(([yes, label]) => `<li class="${yes ? "is-present" : "is-next"}"><span aria-hidden="true">${yes ? "✓" : "○"}</span> ${label}</li>`).join("")}</ul>`;
  };
  const table = `<table class="mlb-ratio-table"><caption>${I.T("One ratio, scaled equally", "Una razón, escalada por igual")}</caption><thead><tr><th scope="col">${I.T("Model", "Modelo")}</th><th scope="col">${I.T("Group A", "Grupo A")}</th><th scope="col">${I.T("Group B", "Grupo B")}</th></tr></thead><tbody><tr><th scope="row">${I.T("Starting ratio", "Razón inicial")}</th><td>${bridge.first}</td><td>${bridge.second}</td></tr><tr><th scope="row">${I.T("Multiply both by 3", "Multiplica ambos por 3")}</th><td>${firstx3}</td><td>${secondx3}</td></tr></tbody></table>`;
  const common = `<div class="mlb-model">${table}<p>${I.T("Compare the two rows. What changed in each group? What stayed the same in the relationship?", "Compara las dos filas. ¿Qué cambió en cada grupo? ¿Qué se mantuvo igual en la relación?")}</p></div><aside class="mlb-separate"><strong>${I.T("Two kinds of evidence stay separate", "Dos tipos de evidencia se mantienen separados")}</strong><p>${I.T("The ratio model shows the math. Your response is used only for language feedback. No audio is recorded, and no name, response, or progress is sent back to Math Fluency Lab.", "El modelo muestra las matemáticas. Tu respuesta se usa solo para recibir comentarios sobre el lenguaje. No se graba audio ni se envían nombres, respuestas o progreso a Math Fluency Lab.")}</p></aside>`;

  if (state.bridgeStep === "draft") {
    return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Explain the ratio", "Explica la razón")}</h2><p>${I.T(`Why do ${bridge.first}:${bridge.second} and ${firstx3}:${secondx3} describe the same relationship? Say your idea aloud first, or type it below.`, `¿Por qué ${bridge.first}:${bridge.second} y ${firstx3}:${secondx3} describen la misma relación? Di tu idea en voz alta o escríbela abajo.`)}</p></div>${common}<label class="mlb-support"><span>${I.T("Choose language support for this task (not a proficiency score)", "Elige el apoyo lingüístico para esta tarea (no es una puntuación de dominio)")}</span><select data-bridge-support aria-label="${esc(I.S("Language support for this task", "Apoyo lingüístico para esta tarea"))}"><option value="2" ${state.bridgeSupport === 2 ? "selected" : ""}>${I.T("More support", "Más apoyo")}</option><option value="3" ${state.bridgeSupport === 3 ? "selected" : ""}>${I.T("Some support", "Algo de apoyo")}</option><option value="5" ${state.bridgeSupport === 5 ? "selected" : ""}>${I.T("Few supports", "Poco apoyo")}</option></select></label>${support ? `<div class="mlb-scaffold"><strong>${I.T("Useful words", "Palabras útiles")}</strong><div class="mlb-word-bank">${bank}</div><p><strong>${I.T("Sentence starter", "Inicio de oración")}</strong> ${esc(support.frame)}</p></div>` : ""}<form data-bridge-draft><label for="mlb-draft">${I.T("Your explanation", "Tu explicación")}</label>${toHtml(dictationControlsHTML("mlb-draft", I, { label: I.T("Say it: words appear here", "Dilo: las palabras aparecen aquí") }))}<textarea id="mlb-draft" name="response" maxlength="1200" rows="4" required>${esc(state.bridgeDraft)}</textarea><button type="submit" class="btn primary">${I.T("Get language feedback", "Recibir comentarios sobre el lenguaje")}</button></form></section>`;
  }

  if (state.bridgeStep === "revision") {
    const reduced = state.bridgeSupport <= 2 ? `<div class="mlb-scaffold"><strong>${I.T("Word bank (the sentence frame is faded)", "Banco de palabras (se quitó el inicio de oración)")}</strong><div class="mlb-word-bank">${bank}</div></div>` : "";
    return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Improve your explanation", "Mejora tu explicación")}</h2><p>${I.T("Use the evidence below to revise one part. The sentence starter is now removed.", "Usa la evidencia para revisar una parte. Ahora se quitó el inicio de oración.")}</p></div>${common}<div class="mlb-original"><strong>${I.T("First explanation", "Primera explicación")}</strong><p>${esc(state.bridgeDraft)}</p>${features(state.bridgeDraft)}</div>${reduced}<form data-bridge-revision><label for="mlb-revision">${I.T("Your revision", "Tu revisión")}</label><textarea id="mlb-revision" maxlength="1200" rows="4" required>${esc(state.bridgeRevision)}</textarea><button type="submit" class="btn primary">${I.T("Continue to a new problem", "Continuar con un problema nuevo")}</button></form></section>`;
  }

  if (state.bridgeStep === "transfer") {
    return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Prove it with a new ratio", "Demuéstralo con una razón nueva")}</h2><p>${I.T(`A new problem starts with ${transferFirst}:${transferSecond}. Make an equivalent ratio using 4 groups. Enter the two quantities as A:B.`, `Un problema nuevo comienza con ${transferFirst}:${transferSecond}. Crea una razón equivalente con 4 grupos. Escribe las cantidades como A:B.`)}</p></div><div class="mlb-transfer-model"><p>${I.T("Starting relationship", "Relación inicial")}: <strong>${transferFirst}:${transferSecond}</strong></p><p>${I.T("Your new pair", "Tu nuevo par")}: <strong>${state.bridgeTransfer ? esc(state.bridgeTransfer) : "? : ?"}</strong></p></div>${state.bridgeTransferFeedback ? `<p class="mlb-feedback" role="status">${esc(state.bridgeTransferFeedback)}</p>` : ""}<form data-bridge-transfer><label for="mlb-transfer">${I.T("Equivalent pair", "Par equivalente")}</label><input id="mlb-transfer" value="${esc(state.bridgeTransfer)}" inputmode="text" autocomplete="off" aria-describedby="mlb-transfer-help" required/><small id="mlb-transfer-help">${I.T("Use a colon, for example 12:20.", "Usa dos puntos, por ejemplo 12:20.")}</small><button type="submit" class="btn primary">${I.T("Check the math", "Revisar las matemáticas")}</button></form>${state.bridgeTransferCorrect ? `<div class="mlb-transfer-success"><p role="status">${I.T("The pair is equivalent. Now explain the new example independently.", "El par es equivalente. Ahora explica el ejemplo nuevo por tu cuenta.")}</p><form data-bridge-transfer-explain><label for="mlb-transfer-explain">${I.T("Explain in your own words (no sentence starter)", "Explica con tus propias palabras (sin inicio de oración)")}</label>${toHtml(dictationControlsHTML("mlb-transfer-explain", I, { label: I.T("Say your independent explanation", "Di tu explicación independiente") }))}<textarea id="mlb-transfer-explain" maxlength="1200" rows="3" required>${esc(state.bridgeTransferExplain)}</textarea><button type="submit" class="btn primary">${I.T("Finish the investigation", "Terminar la investigación")}</button></form></div>` : ""}</section>`;
  }

  return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Investigation complete", "Investigación completa")}</h2><p>${I.T("You revised an explanation and completed a new ratio problem independently.", "Revisaste una explicación y resolviste un problema nuevo de razones por tu cuenta.")}</p></div>${common}<div class="mlb-comparison"><article><h3>${I.T("First", "Primera")}</h3><p>${esc(state.bridgeDraft)}</p></article><article><h3>${I.T("Revised", "Revisada")}</h3><p>${esc(state.bridgeRevision)}</p></article><article><h3>${I.T("Independent transfer", "Transferencia independiente")}</h3><p>${esc(state.bridgeTransferExplain)}</p></article></div><h3>${I.T("Language evidence", "Evidencia del lenguaje")}</h3>${features(state.bridgeTransferExplain)}<p class="mlb-caution">${I.T("These observations describe words in this response only. They are not an official WIDA score or a measure of math achievement.", "Estas observaciones describen solo las palabras de esta respuesta. No son una puntuación oficial de WIDA ni una medida de logro matemático.")}</p><button type="button" class="btn ghost" data-bridge-reset>${I.T("Try another ratio", "Probar otra razón")}</button></section>`;
}

export async function render(ctx = {}) {
  const bridge = ctx.route?.mathBridge || null;
  const bridgeKey = bridge ? `${bridge.schema}:${bridge.grade}:${bridge.first}:${bridge.second}` : "";
  if (bridgeKey && bridgeKey !== state.bridgeKey) {
    Object.assign(state, {
      bridgeKey,
      tab: "math-bridge",
      bridgeStep: "draft",
      bridgeTransferCorrect: false,
      bridgeDraft: "",
      bridgeRevision: "",
      bridgeTransfer: "",
      bridgeTransferExplain: "",
      bridgeTransferFeedback: "",
    });
  } else if (!bridgeKey && state.bridgeKey) {
    Object.assign(state, {
      bridgeKey: "",
      tab: state.tab === "math-bridge" ? "wida" : state.tab,
      bridgeStep: "draft",
      bridgeTransferCorrect: false,
      bridgeDraft: "",
      bridgeRevision: "",
      bridgeTransfer: "",
      bridgeTransferExplain: "",
      bridgeTransferFeedback: "",
    });
  }
  const currentTab = state.tab;
  const I = i18nFor(ctx);
  const language = ctx.prefs?.lang === "es" ? "es" : "en";
  const widaCurrentData = WIDA_DISCOURSE_DATA[state.widaDomain] || WIDA_DISCOURSE_DATA.science;
  const currentWidaLevelData = widaCurrentData.levels[state.widaLevel - 1] || widaCurrentData.levels[2];
  const clauseObj = SYNTAX_CLAUSES[state.activeClauseIdx];

  // Concentric Wheel Word Construction
  const pObj = WHEEL_DATA.prefixes[state.wheelP];
  const rObj = WHEEL_DATA.roots[state.wheelR];
  const sObj = WHEEL_DATA.suffixes[state.wheelS];
  const cleanP = pObj.text.replace(/[\/-].*$/, "");
  const cleanR = rObj.text.split(" ")[0];
  const cleanS = sObj.text.replace(/^[-\/]/, "").split(" ")[0];
  const combinedWord = `${cleanP}${cleanR}${cleanS}`;

  // Cohesion
  const cohObj = COHESION_PASSAGES[state.cohIdx];

  const htmlContent = `
    <div class="lang-studios-container">
      ${crumbsHTML([
        ["The Language Page", `${BASE}/`],
        ["Language Studios"],
      ])}

      <div class="ls-header">
        <div class="ls-title-wrap">
          <h1>Interactive Language &amp; Discourse Studios</h1>
          <p class="ls-lead">
            Empowering multilingual scholars with visual manipulatives for WIDA academic discourse, syntax clause transformation, cross-linguistic morphology cognates, and argumentative cohesion.
          </p>
        </div>
        <div class="ls-badge">
          <span>${ico("star")} Academic English Mastery</span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="ls-nav-tabs" role="tablist">
        ${bridge ? `<button type="button" class="ls-tab-btn ${currentTab === "math-bridge" ? "active" : ""}" data-ls-tab="math-bridge">${ico("construction")} ${I.T("Math explanation", "Explicación matemática")}</button>` : ""}
        <button type="button" class="ls-tab-btn ${currentTab === "wida" ? "active" : ""}" data-ls-tab="wida">${ico("growth")} WIDA Discourse Slider</button>
        <button type="button" class="ls-tab-btn ${currentTab === "syntax" ? "active" : ""}" data-ls-tab="syntax">${ico("tools")} Syntax Clause Slicer</button>
        <button type="button" class="ls-tab-btn ${currentTab === "wheel" ? "active" : ""}" data-ls-tab="wheel">${ico("grid")} Morphology &amp; Cognate Wheel</button>
        <button type="button" class="ls-tab-btn ${currentTab === "cohesion" ? "active" : ""}" data-ls-tab="cohesion">${ico("conversation")} Cohesion &amp; Logic Balancer</button>
        <button type="button" class="ls-tab-btn ${currentTab === "glitch" ? "active" : ""}" data-ls-tab="glitch">${ico("detective")} Spot the Syntax Glitch</button>
      </div>

      <!-- Studio Stage Body -->
      <div class="ls-stage-body">
        ${currentTab === "math-bridge" && bridge ? ratioBridgePanel(bridge, I, language) : ""}
        
        <!-- 1. WIDA Discourse Slider Studio -->
        ${currentTab === "wida" ? `
          <div class="ls-panel-section">
            <div class="ls-section-banner">
              <h3>WIDA Academic Discourse Level Slider (Levels 1–5)</h3>
              <p>Observe how academic expression dynamically scales from single words to compound sentences, to cohesive paragraphs with nominalization, passive voice, and technical register across disciplines.</p>
            </div>

            <div class="wida-slider-card">
              <div class="wida-controls-row">
                <div>
                  <span style="font-weight:700;font-size:0.875rem;margin-right:0.5rem">Academic Domain:</span>
                  <div class="wida-domain-tabs">
                    <button type="button" class="wida-domain-btn ${state.widaDomain === "science" ? "active" : ""}" data-wida-dom="science">${ico("evidence")} Science</button>
                    <button type="button" class="wida-domain-btn ${state.widaDomain === "socialStudies" ? "active" : ""}" data-wida-dom="socialStudies">${ico("library")} Social Studies</button>
                    <button type="button" class="wida-domain-btn ${state.widaDomain === "math" ? "active" : ""}" data-wida-dom="math">${ico("construction")} Mathematics</button>
                  </div>
                </div>
                <div>
                  <span style="font-weight:700;font-size:0.9375rem;color:#1e40af">Current: <strong>Level ${state.widaLevel} (${currentWidaLevelData.title.split(": ")[1]})</strong></span>
                </div>
              </div>

              <!-- Slider Range -->
              <div class="wida-range-wrap">
                <input type="range" min="1" max="5" value="${state.widaLevel}" class="wida-range-slider" id="widaLevelSlider" aria-label="WIDA Proficiency Level"/>
                <div class="wida-level-ticks">
                  <span>Level 1: Entering</span>
                  <span>Level 2: Emerging</span>
                  <span>Level 3: Developing</span>
                  <span>Level 4: Expanding</span>
                  <span>Level 5: Bridging</span>
                </div>
              </div>

              <!-- Output Display -->
              <div class="wida-output-display">
                <span class="wida-level-badge">${esc(currentWidaLevelData.title)} · ${esc(widaCurrentData.domain)}</span>
                <div class="wida-passage-text">
                  “${esc(currentWidaLevelData.passage)}”
                </div>

                <div class="wida-linguistic-breakdown">
                  <div class="wida-breakdown-cell">
                    <strong>Word / Phrase Dimension</strong>
                    <p>${esc(currentWidaLevelData.wordLevel)}</p>
                  </div>
                  <div class="wida-breakdown-cell">
                    <strong>Sentence Dimension</strong>
                    <p>${esc(currentWidaLevelData.sentenceLevel)}</p>
                  </div>
                  <div class="wida-breakdown-cell">
                    <strong>Discourse Dimension</strong>
                    <p>${esc(currentWidaLevelData.discourseLevel)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ` : ""}

        <!-- 2. Dynamic Syntax Clause Slicer -->
        ${currentTab === "syntax" ? `
          <div class="ls-panel-section">
            <div class="ls-section-banner">
              <h3>Dynamic Syntax Clause Slicer &amp; Auto-Punctuator</h3>
              <p>Explore how complex sentences are formed. Notice how the comma appears or disappears based on clause order!</p>
            </div>

            <div class="syntax-slicer-workbench">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                <div>
                  <span style="font-weight:700;font-size:0.875rem">Select Sentence Prompt:</span>
                  ${SYNTAX_CLAUSES.map((c, idx) => `
                    <button type="button" class="btn small ${idx === state.activeClauseIdx ? "btn-primary" : "ghost"}" data-clause-idx="${idx}" style="margin:0 0.25rem">
                      Sample ${idx + 1}
                    </button>
                  `).join("")}
                </div>
                <button type="button" class="syntax-swap-btn" id="swapClausesBtn">
                  ${ico("retry")} Swap Clause Order
                </button>
              </div>

              <div class="clause-drop-zone">
                ${state.clauseDepFirst ? `
                  <div class="clause-block clause-dependent">
                    <span>${esc(clauseObj.dependent)}</span>
                    <small style="opacity:0.75;font-size:0.75rem">(${esc(clauseObj.depType)})</small>
                  </div>
                  <div class="clause-block clause-comma" title="Comma is required after an introductory dependent clause!">
                    <span>,</span>
                  </div>
                  <div class="clause-block clause-independent">
                    <span>${esc(clauseObj.independent.toLowerCase())}.</span>
                    <small style="opacity:0.75;font-size:0.75rem">(${esc(clauseObj.indepType)})</small>
                  </div>
                ` : `
                  <div class="clause-block clause-independent">
                    <span>${esc(clauseObj.independent.charAt(0).toUpperCase() + clauseObj.independent.slice(1))}</span>
                    <small style="opacity:0.75;font-size:0.75rem">(${esc(clauseObj.indepType)})</small>
                  </div>
                  <div class="clause-block clause-dependent">
                    <span>${esc(clauseObj.dependent.toLowerCase())}.</span>
                    <small style="opacity:0.75;font-size:0.75rem">(${esc(clauseObj.depType)})</small>
                  </div>
                `}
              </div>

              <div class="comma-rule-explainer">
                ${state.clauseDepFirst ? `
                  ${ico("bulb")} <strong>Rule in Action:</strong> When a dependent/subordinate clause comes <em>first</em>, it functions as an introductory adverbial element and <strong>requires a comma</strong> before the main independent clause.
                ` : `
                  ${ico("bulb")} <strong>Rule in Action:</strong> When the independent clause comes <em>first</em> followed by the dependent clause, <strong>no comma is needed</strong> because the conjunction smoothly bridges the thought!
                `}
              </div>
            </div>
          </div>
        ` : ""}

        <!-- 3. Concentric Morphology & Cognate Wheel -->
        ${currentTab === "wheel" ? `
          <div class="ls-panel-section">
            <div class="ls-section-banner">
              <h3>Concentric Morphology &amp; Multilingual Cognate Wheel</h3>
              <p>Over 75% of academic English and Spanish words share Latin and Greek root ancestors. Combine morphemes and explore the linguistic bridge between English and Spanish.</p>
            </div>

            <div class="morph-wheel-wrap">
              <div class="wheel-rotators-col">
                <div class="rotator-group">
                  <label>Prefix (Front)</label>
                  <select class="rotator-select" id="selectWheelP">
                    ${WHEEL_DATA.prefixes.map((p, idx) => `
                      <option value="${idx}" ${idx === state.wheelP ? "selected" : ""}>${p.text} (${p.meaning})</option>
                    `).join("")}
                  </select>
                </div>

                <div class="rotator-group">
                  <label>Base Root (Center)</label>
                  <select class="rotator-select" id="selectWheelR">
                    ${WHEEL_DATA.roots.map((r, idx) => `
                      <option value="${idx}" ${idx === state.wheelR ? "selected" : ""}>${r.text} [${r.origin}] - ${r.meaning}</option>
                    `).join("")}
                  </select>
                </div>

                <div class="rotator-group">
                  <label>Suffix (End)</label>
                  <select class="rotator-select" id="selectWheelS">
                    ${WHEEL_DATA.suffixes.map((s, idx) => `
                      <option value="${idx}" ${idx === state.wheelS ? "selected" : ""}>${s.text} (${s.pos} - ${s.meaning})</option>
                    `).join("")}
                  </select>
                </div>
              </div>

              <div class="morph-card-result">
                <div class="assembled-word">${esc(combinedWord)}</div>
                <div class="assembled-pos">${esc(sObj.pos)}</div>
                <div class="assembled-meaning">
                  <strong>Literally:</strong> The ${esc(sObj.meaning)} ${esc(pObj.meaning)} ${esc(rObj.meaning)}.
                </div>
                <div class="cognate-highlight-pill">
                  ${ico("language")} <strong>Spanish Cognate:</strong> <em>${esc(rObj.spanish)}</em>
                </div>
              </div>
            </div>
          </div>
        ` : ""}

        <!-- 4. Cohesion & Logic Balancer -->
        ${currentTab === "cohesion" ? `
          <div class="ls-panel-section">
            <div class="ls-section-banner">
              <h3>Discourse Cohesion &amp; Argumentative Logic Balancer</h3>
              <p>Cohesion creates the logical glue between sentences. Choose the transition connector that balances the claim and the evidence.</p>
            </div>

            <div class="cohesion-balancer-stage">
              <div style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
                <strong>Passage Context: ${esc(cohObj.context)}</strong>
                <button type="button" class="btn small ghost" id="nextCohBtn">Next Passage ${ico("arrow-right")}</button>
              </div>

              <div class="connector-bank-row">
                <span style="font-weight:700;font-size:0.875rem">Connector Vault:</span>
                ${cohObj.options.map((opt) => `
                  <button type="button" class="connector-tag-btn ${opt === state.cohSelected ? "active" : ""}" data-coh-pick="${opt}">
                    ${esc(opt)}
                  </button>
                `).join("")}
              </div>

              <div class="passage-repair-box">
                <p>
                  ${esc(cohObj.claim)} 
                  <span class="slot-marker">${state.cohSelected ? esc(state.cohSelected) : "[Select transition]"}</span>, 
                  ${esc(cohObj.evidence)}
                </p>
              </div>

              ${state.cohSelected ? `
                <div style="margin-top:1.25rem;padding:1rem;border-radius:8px;background:${state.cohSelected === cohObj.targetConnector ? '#ecfdf5;border:1.5px solid #6ee7b7' : '#fef2f2;border:1.5px solid #fecaca'}">
                  ${state.cohSelected === cohObj.targetConnector ? `
                    <span style="color:#065f46;font-weight:700">${ico("check")} Cohesion Balanced! ${esc(cohObj.correctExplain)}</span>
                  ` : `
                    <span style="color:#991b1b;font-weight:700">${ico("x")} Check the relationship! Is this passage contrasting an obstacle or stating a cause? Try another connector.</span>
                  `}
                </div>
              ` : ""}
            </div>
          </div>
        ` : ""}

        <!-- 5. Spot the Syntax Glitch -->
        ${currentTab === "glitch" ? `
          <div class="ls-panel-section">
            <div class="ls-section-banner">
              <h3>Spot the Syntax Glitch (Error Analysis Bug Hunt)</h3>
              <p>Analyze these sentences for common syntactic traps. Tap the highlighted bracketed segment to inspect the glitch and reveal the standard revision.</p>
            </div>

            <div class="glitch-grid">
              ${SYNTAX_GLITCHES.map((g) => {
                const isOpen = state.glitchActiveId === g.id;
                return `
                  <div class="glitch-card">
                    <div class="glitch-header">
                      <strong style="font-size:1.0625rem;color:var(--mi-900,#121c3f)">${esc(g.title)}</strong>
                      <span class="glitch-category-badge">Bug Hunt</span>
                    </div>

                    <div class="glitch-sentence-box">
                      ${esc(g.sentence.replace(/\[(.*?)\]/, ''))}
                      <span class="glitch-word-target" data-glitch-target="${g.id}">
                        ${esc(g.glitchPart)} ${ico("search")}
                      </span>
                      ${esc(g.sentence.split(']')[1] || '')}
                    </div>

                    ${isOpen ? `
                      <div class="glitch-solution">
                        <div style="margin-bottom:0.5rem;font-weight:800;color:#065f46">
                          ${ico("sparkle")} Revision: <span style="text-decoration:underline">${esc(g.replacement)}</span>
                        </div>
                        <p style="margin:0;line-height:1.4">${esc(g.rule)}</p>
                      </div>
                    ` : `
                      <button type="button" class="btn small ghost" data-glitch-target="${g.id}" style="width:100%">
                        Inspect Glitch &amp; Fix ${ico("arrow-right")}
                      </button>
                    `}
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        ` : ""}

      </div>
    </div>
  `;

  return {
    title: "Language Studios",
    html: raw(htmlContent),
  };
}

export function mount(root, ctx) {
  if (!root) return;

  const bridge = ctx.route?.mathBridge || null;
  const I = i18nFor(ctx);

  root.querySelectorAll("[data-dictate^='mlb-']").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.dictate;
      const fieldId = id === "mlb-draft" ? "#mlb-draft" : "#mlb-transfer-explain";
      const handled = await toggleDictation(id, {
        I,
        lang: ctx.prefs?.lang === "es" ? "es-ES" : "en-US",
        onText: (text) => {
          const field = root.querySelector(fieldId);
          if (!field) return;
          field.value = text;
          if (id === "mlb-draft") state.bridgeDraft = text;
          else state.bridgeTransferExplain = text;
        },
        onDone: (text) => {
          if (id === "mlb-draft") state.bridgeDraft = text;
          else state.bridgeTransferExplain = text;
        },
      });
      if (handled) ctx.rerender();
    });
  });

  root.querySelector("[data-bridge-support]")?.addEventListener("change", (event) => {
    state.bridgeSupport = Number(event.target.value);
    ctx.rerender();
  });
  root.querySelector("[data-bridge-draft]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.bridgeDraft = root.querySelector("#mlb-draft")?.value.trim() || "";
    if (!state.bridgeDraft) return;
    state.bridgeStep = "revision";
    ctx.rerender();
  });
  root.querySelector("[data-bridge-revision]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.bridgeRevision = root.querySelector("#mlb-revision")?.value.trim() || "";
    if (!state.bridgeRevision) return;
    state.bridgeStep = "transfer";
    ctx.rerender();
  });
  root.querySelector("[data-bridge-transfer]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.bridgeTransfer = root.querySelector("#mlb-transfer")?.value.trim() || "";
    if (!bridge) return;
    state.bridgeTransferCorrect = checkRatioTransfer(bridge, state.bridgeTransfer);
    state.bridgeTransferFeedback = state.bridgeTransferCorrect
      ? i18nFor(ctx).S("Correct: both quantities were multiplied by 4.", "Correcto: ambas cantidades se multiplicaron por 4.")
      : i18nFor(ctx).S("Check the factor. Both quantities must be multiplied by 4.", "Revisa el factor. Ambas cantidades deben multiplicarse por 4.");
    ctx.rerender();
  });
  root.querySelector("[data-bridge-transfer-explain]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.bridgeTransferExplain = root.querySelector("#mlb-transfer-explain")?.value.trim() || "";
    if (!state.bridgeTransferExplain) return;
    state.bridgeStep = "complete";
    ctx.rerender();
  });
  root.querySelector("[data-bridge-reset]")?.addEventListener("click", () => {
    Object.assign(state, {
      bridgeStep: "draft",
      bridgeTransferCorrect: false,
      bridgeDraft: "",
      bridgeRevision: "",
      bridgeTransfer: "",
      bridgeTransferExplain: "",
      bridgeTransferFeedback: "",
    });
    ctx.rerender();
  });

  // Tabs
  root.querySelectorAll("[data-ls-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.dataset.lsTab;
      ctx.rerender();
    });
  });

  // WIDA Domain buttons
  root.querySelectorAll("[data-wida-dom]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.widaDomain = btn.dataset.widaDom;
      ctx.rerender();
    });
  });

  // WIDA Level Slider
  const widaSlider = root.querySelector("#widaLevelSlider");
  if (widaSlider) {
    widaSlider.addEventListener("input", (e) => {
      state.widaLevel = Number(e.target.value);
      ctx.rerender();
    });
  }

  // Syntax Clause Slicer
  root.querySelectorAll("[data-clause-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.activeClauseIdx = Number(btn.dataset.clauseIdx);
      ctx.rerender();
    });
  });
  const swapBtn = root.querySelector("#swapClausesBtn");
  if (swapBtn) {
    swapBtn.addEventListener("click", () => {
      state.clauseDepFirst = !state.clauseDepFirst;
      ctx.rerender();
    });
  }

  // Morphology Selects
  const selP = root.querySelector("#selectWheelP");
  const selR = root.querySelector("#selectWheelR");
  const selS = root.querySelector("#selectWheelS");
  selP?.addEventListener("change", (e) => {
    state.wheelP = Number(e.target.value);
    ctx.rerender();
  });
  selR?.addEventListener("change", (e) => {
    state.wheelR = Number(e.target.value);
    ctx.rerender();
  });
  selS?.addEventListener("change", (e) => {
    state.wheelS = Number(e.target.value);
    ctx.rerender();
  });

  // Cohesion
  root.querySelectorAll("[data-coh-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.cohSelected = btn.dataset.cohPick;
      ctx.rerender();
    });
  });
  const nextCohBtn = root.querySelector("#nextCohBtn");
  if (nextCohBtn) {
    nextCohBtn.addEventListener("click", () => {
      state.cohIdx = (state.cohIdx + 1) % COHESION_PASSAGES.length;
      state.cohSelected = null;
      ctx.rerender();
    });
  }

  // Glitch Hunt
  root.querySelectorAll("[data-glitch-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const gId = btn.dataset.glitchTarget;
      state.glitchActiveId = state.glitchActiveId === gId ? null : gId;
      ctx.rerender();
    });
  });
}
