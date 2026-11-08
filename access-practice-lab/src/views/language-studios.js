// Language Studios — The Language Page / EduWonderLab
// Cutting-edge interactive manipulatives for English Learners (ELs) and Academic Language Acquisition:
//   1. Classroom language-sample lens across science, social studies, and mathematics
//   2. Dynamic Syntax Clause Slicer & Connector (Independent vs Dependent with auto-comma logic)
//   3. Concentric Morphology & Multilingual Cognate Wheel (Prefix-Root-Suffix with Spanish bridges)
//   4. Discourse Cohesion & Logic Balancer (Claim vs Evidence vs Reasoning CER with connector vault)
//   5. Spot the Syntax Glitch (Error analysis bug-hunt cards)

import { crumbsHTML } from "../components.js";
import { BASE, ICONS, esc, html, icon, raw, storage, toHtml } from "../util.js";
import { i18nFor } from "../i18n.js";
import { dictationControlsHTML, toggleDictation } from "../dictation-ui.js";
import { renderFractionBridge } from "../studios/fraction-bridge-view.js";
import { renderDataBridge, renderDataModel } from "../studios/data-bridge-view.js";
import {
  analyzeRatioExplanation,
  analyzePercentExplanation,
  analyzeFractionExplanation,
  checkPercentTransfer,
  checkFractionTransfer,
  checkDataTransfer,
  checkRatioTransfer,
  percentSupportForLevel,
  fractionSupportForLevel,
  ratioTransferBase,
  supportForLevel,
} from "../studios/math-reasoning-bridge.js";

// Plain-string icon for the template-string markup in this file.
const ico = (name) => `<svg class="ico" aria-hidden="true" focusable="false"><use href="${ICONS}#${name}"></use></svg>`;

// --- 1. WIDA Academic Discourse Scenarios ---
export const WIDA_DISCOURSE_DATA = {
  science: {
    domain: "Science: Energy in a Food Web",
    concept: "Plants use sunlight to make food. Animals get some of that stored energy by eating plants.",
    prompt: "Explain how energy moves from plants to animals.",
    levels: [
      {
        level: 1,
        title: "Sample A",
        passage: "Plants use sunlight to make food. Animals eat plants. Energy moves from plants to animals.",
        wordLevel: "Everyday words name the same science idea.",
        sentenceLevel: "Complete, short sentences make each step clear.",
        discourseLevel: "Repeated words connect the steps in the explanation.",
      },
      {
        level: 2,
        title: "Sample B",
        passage: "Plants use sunlight to make food, and rabbits get energy when they eat the plants.",
        wordLevel: "Familiar content words name the organisms and energy.",
        sentenceLevel: "A joined sentence links two related ideas.",
        discourseLevel: "The word “when” links the animal’s action to its energy source.",
      },
      {
        level: 3,
        title: "Sample C",
        passage: "Because plants store energy from sunlight in the food they make, rabbits get some of that energy by eating plants.",
        wordLevel: "The precise verb “store” describes what happens to energy.",
        sentenceLevel: "A “because” clause gives a reason for the result.",
        discourseLevel: "The phrase “that energy” connects the two parts of the explanation.",
      },
      {
        level: 4,
        title: "Sample D",
        passage: "Plants capture sunlight during photosynthesis and store some of its energy in food. As a result, animals that eat plants can use that stored energy.",
        wordLevel: "The science term “photosynthesis” names the process.",
        sentenceLevel: "A relative clause identifies which animals the sentence describes.",
        discourseLevel: "“As a result” makes the cause-and-effect link explicit.",
      },
      {
        level: 5,
        title: "Sample E",
        passage: "Through photosynthesis, plants transform sunlight into stored chemical energy; that energy becomes available to animals when they consume plants.",
        wordLevel: "A concise technical term names the process precisely.",
        sentenceLevel: "A semicolon joins two closely related independent clauses.",
        discourseLevel: "The explanation states the process and then traces its consequence.",
      },
    ],
  },
  socialStudies: {
    domain: "Social Studies: A Community Decision",
    concept: "Residents share evidence about a road. Their city council uses that evidence when it chooses a repair plan.",
    prompt: "Explain how residents’ evidence can shape the council’s decision.",
    levels: [
      {
        level: 1,
        title: "Sample A",
        passage: "Residents share facts about the road. The council uses the facts to choose a repair.",
        wordLevel: "Everyday words name the people, evidence, and decision.",
        sentenceLevel: "Complete sentences state who acts and what they do.",
        discourseLevel: "Repeated words connect the evidence to the decision.",
      },
      {
        level: 2,
        title: "Sample B",
        passage: "Residents share facts about the road, so the council can use them to choose a repair.",
        wordLevel: "“Residents” and “council” identify the people in the process.",
        sentenceLevel: "The connector “so” links the evidence to its purpose.",
        discourseLevel: "The pronoun “them” refers back to the facts.",
      },
      {
        level: 3,
        title: "Sample C",
        passage: "Because residents provide evidence about the road, the council can compare the problems before selecting a repair plan.",
        wordLevel: "“Evidence” and “compare” describe the decision-making work.",
        sentenceLevel: "A “because” clause explains why the council can compare plans.",
        discourseLevel: "The sentence connects residents’ information to the council’s choice.",
      },
      {
        level: 4,
        title: "Sample D",
        passage: "Residents document the road’s condition; the council evaluates that evidence alongside cost and safety before choosing a repair.",
        wordLevel: "“Document” and “evaluates” describe precise civic actions.",
        sentenceLevel: "A semicolon connects the evidence-gathering step to the decision step.",
        discourseLevel: "The sentence names multiple criteria used in the decision.",
      },
      {
        level: 5,
        title: "Sample E",
        passage: "By documenting road conditions and weighing safety against cost, the council can justify its repair choice with evidence residents can review.",
        wordLevel: "Precise verbs summarize how evidence informs public decisions.",
        sentenceLevel: "An opening phrase names the criteria before the main claim.",
        discourseLevel: "The explanation connects evidence, decision-making, and public accountability.",
      },
    ],
  },
  math: {
    domain: "Math: Interpreting Data",
    concept: "In the data set 2, 4, 4, 10, the mean is 5 and the median is 4. The value 10 raises the mean more than it changes the median.",
    prompt: "Explain how the value 10 affects the mean and the median.",
    levels: [
      {
        level: 1,
        title: "Sample A",
        passage: "The data are 2, 4, 4, and 10. The mean is 5. The median is 4.",
        wordLevel: "The values and math terms are named directly.",
        sentenceLevel: "Complete short sentences state each result.",
        discourseLevel: "The data values keep the explanation focused on one idea.",
      },
      {
        level: 2,
        title: "Sample B",
        passage: "The value 10 is far from the other data values, so it raises the mean to 5.",
        wordLevel: "“Far from” describes how 10 compares with the other values.",
        sentenceLevel: "The word “so” links the value to its effect.",
        discourseLevel: "The sentence identifies a cause and a result.",
      },
      {
        level: 3,
        title: "Sample C",
        passage: "The value 10 pulls the mean up to 5 because the mean uses every value, while the median remains 4.",
        wordLevel: "“Pulls up” describes how a large value affects the mean.",
        sentenceLevel: "A reason clause and “while” compare the two measures.",
        discourseLevel: "The explanation distinguishes how mean and median respond.",
      },
      {
        level: 4,
        title: "Sample D",
        passage: "Because the mean includes every value, the outlying 10 raises it to 5; the median stays 4 because it depends on the middle position.",
        wordLevel: "“Outlying” and “middle position” name the relevant statistical ideas.",
        sentenceLevel: "Two reason clauses explain the different effects.",
        discourseLevel: "The sentence compares both measures using the same data.",
      },
      {
        level: 5,
        title: "Sample E",
        passage: "Although the value 10 increases the mean to 5, it leaves the median at 4 because the median depends on the center of the ordered data, not the size of every value.",
        wordLevel: "“Although” and “ordered data” make the contrast and method precise.",
        sentenceLevel: "A contrast clause sets up the explanation.",
        discourseLevel: "The response justifies why the two measures react differently.",
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
  percentDraft: "",
  percentRevision: "",
  percentTransferAnswer: "",
  percentTransferCorrect: false,
  percentTransferFeedback: "",
  percentTransferExplain: "",
  fractionScale: 1,
  fractionDraft: "",
  fractionRevision: "",
  fractionTransferAnswer: "",
  fractionTransferCorrect: false,
  fractionTransferFeedback: "",
  fractionTransferExplain: "",
  dataMoveValue: null,
  dataDraft: "",
  dataRevision: "",
  dataTransferMean: "",
  dataTransferMedian: "",
  dataTransferCorrect: false,
  dataTransferFeedback: "",
  dataTransferExplain: "",
};

const bridgeSaveKey = (key) => `accessPracticeLab:v1:mathLanguageBridge:${encodeURIComponent(key)}`;
function saveBridge(key) {
  if (!key) return;
  const fields = ["bridgeStep", "bridgeSupport", "bridgeDraft", "bridgeRevision", "bridgeTransfer", "bridgeTransferExplain", "percentDraft", "percentRevision", "percentTransferAnswer", "percentTransferExplain", "fractionScale", "fractionDraft", "fractionRevision", "fractionTransferAnswer", "fractionTransferExplain", "dataMoveValue", "dataDraft", "dataRevision", "dataTransferMean", "dataTransferMedian", "dataTransferExplain"];
  const data = Object.fromEntries(fields.map((field) => [field, state[field]]));
  storage.set(bridgeSaveKey(key), JSON.stringify({ version: 1, data }));
}
function restoreBridge(key, bridge) {
  try {
    const saved = JSON.parse(storage.get(bridgeSaveKey(key)) || "null");
    if (saved?.version !== 1 || !saved.data || typeof saved.data !== "object") return;
    const d = saved.data;
    state.bridgeStep = ["draft", "revision", "transfer", "complete"].includes(d.bridgeStep) ? d.bridgeStep : "draft";
    state.bridgeSupport = [2, 3, 5].includes(Number(d.bridgeSupport)) ? Number(d.bridgeSupport) : 3;
    state.fractionScale = [1, 2, 3].includes(Number(d.fractionScale)) ? Number(d.fractionScale) : 1;
    state.dataMoveValue = Number.isInteger(d.dataMoveValue) && d.dataMoveValue >= 0 && d.dataMoveValue <= 40 ? d.dataMoveValue : bridge?.task === "data-center" ? bridge.values[bridge.selectedIndex] : null;
    for (const keyName of ["bridgeDraft", "bridgeRevision", "bridgeTransfer", "bridgeTransferExplain", "percentDraft", "percentRevision", "percentTransferAnswer", "percentTransferExplain", "fractionDraft", "fractionRevision", "fractionTransferAnswer", "fractionTransferExplain", "dataDraft", "dataRevision", "dataTransferMean", "dataTransferMedian", "dataTransferExplain"])
      state[keyName] = typeof d[keyName] === "string" ? d[keyName].slice(0, 1200) : "";
    if (["transfer", "complete"].includes(state.bridgeStep)) {
      const mathIsCorrect = bridge?.task === "percent-part-whole"
        ? checkPercentTransfer(bridge, state.percentTransferAnswer)
        : bridge?.task === "fraction-of-whole"
          ? checkFractionTransfer(bridge, state.fractionTransferAnswer)
          : bridge?.task === "data-center"
            ? checkDataTransfer(bridge, state.dataTransferMean, state.dataTransferMedian)
            : checkRatioTransfer(bridge, state.bridgeTransfer);
      if (!mathIsCorrect) state.bridgeStep = "transfer";
    }
  } catch { /* Ignore malformed or unavailable local saves. */ }
}

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
    return `<p class="mlb-feedback">${I.T(result.feedback.en, result.feedback.es)}</p><ul class="mlb-evidence">${items.map(([yes, label]) => `<li class="${yes ? "is-present" : "is-next"}"><span aria-hidden="true" class="mlb-evidence-mark" data-state="${yes ? "present" : "next"}"></span> ${label}</li>`).join("")}</ul>`;
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

function percentBridgePanel(bridge, I, language) {
  const { percent, whole, part, transferPart, transferWhole } = bridge;
  const support = percentSupportForLevel(state.bridgeSupport, language, { percent, whole, part });
  const bank = support?.bank?.map((word) => `<span>${esc(word)}</span>`).join("") || "";
  const feedbackFor = (response) => {
    const result = analyzePercentExplanation(response);
    const items = [
      [result.evidence.namesPercent, I.T("Uses percent language", "Usa lenguaje de porcentaje")],
      [result.evidence.namesWhole, I.T("Names the whole", "Nombra el todo")],
      [result.evidence.namesPart, I.T("Identifies the part", "Identifica la parte")],
      [result.evidence.connectsReason, I.T("Connects ideas with a reason", "Conecta las ideas con una razón")],
    ];
    return `<p class="mlb-feedback">${I.T(result.feedback.en, result.feedback.es)}</p><ul class="mlb-evidence">${items.map(([yes, label]) => `<li class="${yes ? "is-present" : "is-next"}"><span aria-hidden="true" class="mlb-evidence-mark" data-state="${yes ? "present" : "next"}"></span> ${label}</li>`).join("")}</ul>`;
  };
  const cells = Array.from({ length: 100 }, (_, index) => `<span class="mlb-percent-cell${index < percent ? " is-shaded" : ""}" aria-hidden="true"></span>`).join("");
  const model = `<div class="mlb-model mlb-percent-model"><div class="mlb-percent-grid" role="img" aria-label="${esc(I.S(`A 10 by 10 grid: ${percent} of 100 squares are shaded, representing ${percent} percent.`, `Cuadrícula de 10 por 10: ${percent} de 100 cuadros están sombreados, que representan ${percent} por ciento.`))}">${cells}</div><p>${I.T(`100 equal squares; ${percent} are shaded. If the whole is ${whole}, each square represents ${whole / 100}.`, `100 cuadros iguales; ${percent} están sombreados. Si el todo es ${whole}, cada cuadro representa ${whole / 100}.`)}</p><p><strong>${I.T("Part", "Parte")}: ${part} = ${whole} × ${percent}/100</strong></p><p>${I.T("Connect the grid to the quantities: the whole is 100%, and the shaded part is the percent of that whole.", "Conecta la cuadrícula con las cantidades: el todo es 100% y la parte sombreada es el porcentaje de ese todo.")}</p></div><aside class="mlb-separate"><strong>${I.T("Math and language evidence stay separate", "La evidencia matemática y lingüística se mantiene separada")}</strong><p>${I.T("The model checks the quantities. Your words receive language feedback only. Your response and progress are not sent back to Math Fluency Lab.", "El modelo comprueba las cantidades. Tus palabras reciben comentarios de lenguaje solamente. Tu respuesta y progreso no se envían a Math Fluency Lab.")}</p></aside>`;
  const supportPicker = `<label class="mlb-support"><span>${I.T("Choose language support for this task", "Elige el apoyo lingüístico para esta tarea")}</span><select data-bridge-support aria-label="${esc(I.S("Language support for this task", "Apoyo lingüístico para esta tarea"))}"><option value="2" ${state.bridgeSupport === 2 ? "selected" : ""}>${I.T("More support", "Más apoyo")}</option><option value="3" ${state.bridgeSupport === 3 ? "selected" : ""}>${I.T("Some support", "Algo de apoyo")}</option><option value="5" ${state.bridgeSupport === 5 ? "selected" : ""}>${I.T("Few supports", "Poco apoyo")}</option></select></label>`;
  const scaffold = support ? `<div class="mlb-scaffold"><strong>${I.T("Useful words", "Palabras útiles")}</strong><div class="mlb-word-bank">${bank}</div><p><strong>${I.T("Sentence starter", "Inicio de oración")}</strong> ${esc(support.frame)}</p></div>` : "";

  if (state.bridgeStep === "draft") return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Explain the percent model", "Explica el modelo de porcentaje")}</h2><p>${I.T(`What do ${percent}%, ${part}, and ${whole} represent? Use the grid to explain how you know.`, `¿Qué representan ${percent}%, ${part} y ${whole}? Usa la cuadrícula para explicar cómo lo sabes.`)}</p></div>${model}${supportPicker}${scaffold}<form data-pct-draft><label for="mlb-pct-draft">${I.T("Your explanation", "Tu explicación")}</label>${toHtml(dictationControlsHTML("mlb-pct-draft", I, { label: I.T("Say it: words appear here", "Dilo: las palabras aparecen aquí") }))}<textarea id="mlb-pct-draft" maxlength="1200" rows="4" required>${esc(state.percentDraft)}</textarea><button type="submit" class="btn primary">${I.T("Get language feedback", "Recibir comentarios sobre el lenguaje")}</button></form></section>`;
  if (state.bridgeStep === "revision") return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Improve your explanation", "Mejora tu explicación")}</h2><p>${I.T("Revise one part using the language evidence. The sentence frame is removed for this revision.", "Revisa una parte usando la evidencia lingüística. Se quita el marco de oración para esta revisión.")}</p></div>${model}<div class="mlb-original"><strong>${I.T("First explanation", "Primera explicación")}</strong><p>${esc(state.percentDraft)}</p>${feedbackFor(state.percentDraft)}</div>${state.bridgeSupport <= 2 ? `<div class="mlb-scaffold"><strong>${I.T("Word bank only", "Solo banco de palabras")}</strong><div class="mlb-word-bank">${bank}</div></div>` : ""}<form data-pct-revision><label for="mlb-pct-revision">${I.T("Your revision", "Tu revisión")}</label><textarea id="mlb-pct-revision" maxlength="1200" rows="4" required>${esc(state.percentRevision)}</textarea><button type="submit" class="btn primary">${I.T("Continue to a new problem", "Continuar con un problema nuevo")}</button></form></section>`;
  if (state.bridgeStep === "transfer") return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Prove it with a new percent problem", "Demuéstralo con un problema nuevo de porcentaje")}</h2><p>${I.T(`${transferPart} is ${percent}% of what whole? Solve without the grid or sentence frame.`, `¿${transferPart} es el ${percent}% de qué todo? Resuelve sin la cuadrícula ni el marco de oración.`)}</p></div>${state.percentTransferFeedback ? `<p class="mlb-feedback" role="status">${esc(state.percentTransferFeedback)}</p>` : ""}<form data-pct-transfer><label for="mlb-pct-transfer">${I.T("The whole", "El todo")}</label><input id="mlb-pct-transfer" inputmode="decimal" value="${esc(state.percentTransferAnswer)}" required/><button type="submit" class="btn primary">${I.T("Check the math", "Revisar las matemáticas")}</button></form>${state.percentTransferCorrect ? `<div class="mlb-transfer-success"><p role="status">${I.T("That whole is correct. Now explain the relationship independently.", "Ese todo es correcto. Ahora explica la relación por tu cuenta.")}</p><form data-pct-transfer-explain><label for="mlb-pct-transfer-explain">${I.T("Explain in your own words", "Explica con tus propias palabras")}</label>${toHtml(dictationControlsHTML("mlb-pct-transfer-explain", I, { label: I.T("Say your independent explanation", "Di tu explicación independiente") }))}<textarea id="mlb-pct-transfer-explain" maxlength="1200" rows="3" required>${esc(state.percentTransferExplain)}</textarea><button type="submit" class="btn primary">${I.T("Finish the investigation", "Terminar la investigación")}</button></form></div>` : ""}</section>`;
  return `<section class="ls-panel-section mlb-panel"><div class="ls-section-banner"><h2>${I.T("Investigation complete", "Investigación completa")}</h2><p>${I.T("You revised an explanation and solved a new percent problem independently.", "Revisaste una explicación y resolviste un problema nuevo de porcentaje por tu cuenta.")}</p></div>${model}<div class="mlb-comparison"><article><h3>${I.T("First", "Primera")}</h3><p>${esc(state.percentDraft)}</p></article><article><h3>${I.T("Revised", "Revisada")}</h3><p>${esc(state.percentRevision)}</p></article><article><h3>${I.T("Independent transfer", "Transferencia independiente")}</h3><p>${esc(state.percentTransferExplain)}</p></article></div><h3>${I.T("Language evidence", "Evidencia del lenguaje")}</h3>${feedbackFor(state.percentTransferExplain)}<p class="mlb-caution">${I.T("These observations describe language in this response only. They are not a WIDA score or a measure of math achievement.", "Estas observaciones describen solo el lenguaje de esta respuesta. No son una puntuación WIDA ni una medida de logro matemático.")}</p><button type="button" class="btn ghost" data-pct-reset>${I.T("Try another percent task", "Probar otro problema de porcentaje")}</button></section>`;
}

export async function render(ctx = {}) {
  const bridge = ctx.route?.mathBridge || null;
  const bridgeKey = bridge ? bridge.task === "percent-part-whole"
    ? `${bridge.schema}:${bridge.task}:${bridge.grade}:${bridge.percent}:${bridge.whole}`
    : bridge.task === "fraction-of-whole"
      ? `${bridge.schema}:${bridge.task}:${bridge.grade}:${bridge.numerator}:${bridge.denominator}:${bridge.whole}`
      : bridge.task === "data-center"
        ? `${bridge.schema}:${bridge.task}:${bridge.grade}:${bridge.values.join(",")}`
        : `${bridge.schema}:${bridge.grade}:${bridge.first}:${bridge.second}` : "";
  if (bridgeKey && bridgeKey !== state.bridgeKey) {
    Object.assign(state, {
      bridgeKey,
      tab: "math-bridge",
      bridgeStep: "draft",
      bridgeSupport: 3,
      bridgeTransferCorrect: false,
      bridgeDraft: "",
      bridgeRevision: "",
      bridgeTransfer: "",
      bridgeTransferExplain: "",
      bridgeTransferFeedback: "",
      percentDraft: "",
      percentRevision: "",
      percentTransferAnswer: "",
      percentTransferCorrect: false,
      percentTransferFeedback: "",
      percentTransferExplain: "",
      fractionScale: 1,
      fractionDraft: "",
      fractionRevision: "",
      fractionTransferAnswer: "",
      fractionTransferCorrect: false,
      fractionTransferFeedback: "",
      fractionTransferExplain: "",
      dataMoveValue: bridge.task === "data-center" ? bridge.values[bridge.selectedIndex] : null,
      dataDraft: "",
      dataRevision: "",
      dataTransferMean: "",
      dataTransferMedian: "",
      dataTransferCorrect: false,
      dataTransferFeedback: "",
      dataTransferExplain: "",
    });
    restoreBridge(bridgeKey, bridge);
    if (bridge.task === "percent-part-whole") state.percentTransferCorrect = checkPercentTransfer(bridge, state.percentTransferAnswer);
    else if (bridge.task === "fraction-of-whole") state.fractionTransferCorrect = checkFractionTransfer(bridge, state.fractionTransferAnswer);
    else if (bridge.task === "data-center") state.dataTransferCorrect = checkDataTransfer(bridge, state.dataTransferMean, state.dataTransferMedian);
    else state.bridgeTransferCorrect = checkRatioTransfer(bridge, state.bridgeTransfer);
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
          <span>${ico("star")} Language learning · no proficiency score</span>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="ls-nav-tabs" role="tablist">
        ${bridge ? `<button type="button" class="ls-tab-btn ${currentTab === "math-bridge" ? "active" : ""}" data-ls-tab="math-bridge">${ico("construction")} ${I.T("Math explanation", "Explicación matemática")}</button>` : ""}
        <button type="button" class="ls-tab-btn ${currentTab === "wida" ? "active" : ""}" data-ls-tab="wida">${ico("growth")} Language Sample Lens</button>
        <button type="button" class="ls-tab-btn ${currentTab === "syntax" ? "active" : ""}" data-ls-tab="syntax">${ico("tools")} Syntax Clause Slicer</button>
        <button type="button" class="ls-tab-btn ${currentTab === "wheel" ? "active" : ""}" data-ls-tab="wheel">${ico("grid")} Morphology &amp; Cognate Wheel</button>
        <button type="button" class="ls-tab-btn ${currentTab === "cohesion" ? "active" : ""}" data-ls-tab="cohesion">${ico("conversation")} Cohesion &amp; Logic Balancer</button>
        <button type="button" class="ls-tab-btn ${currentTab === "glitch" ? "active" : ""}" data-ls-tab="glitch">${ico("detective")} Spot the Syntax Glitch</button>
      </div>

      <!-- Studio Stage Body -->
      <div class="ls-stage-body">
        ${currentTab === "math-bridge" && bridge ? bridge.task === "percent-part-whole" ? percentBridgePanel(bridge, I, language) : bridge.task === "fraction-of-whole" ? renderFractionBridge(bridge, state, I, language) : bridge.task === "data-center" ? renderDataBridge(bridge, state, I, language) : ratioBridgePanel(bridge, I, language) : ""}
        
        <!-- 1. Compare language samples without treating them as assessment evidence. -->
        ${currentTab === "wida" ? `
          <div class="ls-panel-section">
            <div class="ls-section-banner">
              <h3>Compare classroom language samples</h3>
              <p>Explore different ways to express the same content idea. These short examples can prompt discussion about language choices; they are not WIDA descriptors, a placement tool, or a proficiency score.</p>
            </div>

            <div class="wida-slider-card">
              <div class="wida-controls-row">
                <div>
                  <span style="font-weight:700;font-size:0.875rem;margin-right:0.5rem">Content area:</span>
                  <div class="wida-domain-tabs">
                    <button type="button" class="wida-domain-btn ${state.widaDomain === "science" ? "active" : ""}" data-wida-dom="science">${ico("evidence")} Science</button>
                    <button type="button" class="wida-domain-btn ${state.widaDomain === "socialStudies" ? "active" : ""}" data-wida-dom="socialStudies">${ico("library")} Social Studies</button>
                    <button type="button" class="wida-domain-btn ${state.widaDomain === "math" ? "active" : ""}" data-wida-dom="math">${ico("construction")} Mathematics</button>
                  </div>
                </div>
                <div>
                  <span style="font-weight:700;font-size:0.9375rem;color:#1e40af">Sample ${String.fromCharCode(64 + state.widaLevel)}</span>
                </div>
              </div>

              <!-- Slider Range -->
              <div class="wida-range-wrap">
                <input type="range" min="1" max="5" value="${state.widaLevel}" class="wida-range-slider" id="widaLevelSlider" aria-label="Choose a classroom language sample" aria-describedby="wida-sample-note"/>
                <div class="wida-level-ticks">
                  <span>Sample A</span>
                  <span>Sample B</span>
                  <span>Sample C</span>
                  <span>Sample D</span>
                  <span>Sample E</span>
                </div>
              </div>

              <!-- Output Display -->
              <div class="wida-output-display">
                <span class="wida-level-badge">Illustrative sample · ${esc(widaCurrentData.domain)}</span>
                <div class="wida-concept"><strong>Shared content idea</strong><p>${esc(widaCurrentData.concept)}</p><strong>Explain</strong><p>${esc(widaCurrentData.prompt)}</p></div>
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
                <p id="wida-sample-note" class="fine">The same topic remains in view as the language sample changes. A single writing sample cannot identify a learner’s proficiency or predict an official assessment result.</p>
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
      const fieldMap = { "mlb-draft": "#mlb-draft", "mlb-transfer-explain": "#mlb-transfer-explain", "mlb-pct-draft": "#mlb-pct-draft", "mlb-pct-transfer-explain": "#mlb-pct-transfer-explain", "mlb-frac-draft": "#mlb-frac-draft", "mlb-frac-transfer-explain": "#mlb-frac-transfer-explain", "mlb-data-draft": "#mlb-data-draft", "mlb-data-transfer-explain": "#mlb-data-transfer-explain" };
      const fieldId = fieldMap[id];
      const setText = (text) => {
        const field = root.querySelector(fieldId);
        if (!field) return;
        field.value = text;
        if (id === "mlb-draft") state.bridgeDraft = text;
        else if (id === "mlb-transfer-explain") state.bridgeTransferExplain = text;
        else if (id === "mlb-pct-draft") state.percentDraft = text;
        else if (id === "mlb-pct-transfer-explain") state.percentTransferExplain = text;
        else if (id === "mlb-frac-draft") state.fractionDraft = text;
        else if (id === "mlb-frac-transfer-explain") state.fractionTransferExplain = text;
        else if (id === "mlb-data-draft") state.dataDraft = text;
        else state.dataTransferExplain = text;
        saveBridge(state.bridgeKey);
      };
      const handled = await toggleDictation(id, {
        I,
        lang: ctx.prefs?.lang === "es" ? "es-ES" : "en-US",
        onText: setText,
        onDone: setText,
      });
      if (handled) ctx.rerender();
    });
  });

  root.querySelector("[data-bridge-support]")?.addEventListener("change", (event) => {
    state.bridgeSupport = Number(event.target.value);
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });
  root.querySelector("[data-data-move-value]")?.addEventListener("input", (event) => {
    state.dataMoveValue = Math.max(0, Math.min(40, Number(event.target.value) || 0));
    const rendered = document.createElement("div");
    rendered.innerHTML = renderDataModel(bridge, state.dataMoveValue, I);
    const next = rendered.querySelector("[data-data-model]");
    const current = root.querySelector("[data-data-model]");
    if (next && current) {
      current.querySelector("figure").innerHTML = next.querySelector("figure").innerHTML;
      current.querySelector("output").textContent = String(state.dataMoveValue);
      current.querySelector(".mlb-data-stats").textContent = next.querySelector(".mlb-data-stats").textContent;
      event.target.setAttribute("aria-valuetext", I.S(`Observation value ${state.dataMoveValue}`, `Valor del dato ${state.dataMoveValue}`));
    }
    saveBridge(state.bridgeKey);
  });
  for (const [selector, field, limit] of [
    ["#mlb-data-draft", "dataDraft", 1200],
    ["#mlb-data-revision", "dataRevision", 1200],
    ["#mlb-data-mean", "dataTransferMean", 20],
    ["#mlb-data-median", "dataTransferMedian", 20],
    ["#mlb-data-transfer-explain", "dataTransferExplain", 1200],
  ]) root.querySelector(selector)?.addEventListener("input", (event) => {
    state[field] = event.target.value.slice(0, limit);
    saveBridge(state.bridgeKey);
  });
  root.querySelector("[data-data-draft]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.dataDraft = root.querySelector("#mlb-data-draft")?.value.trim() || "";
    if (!state.dataDraft) return;
    state.bridgeStep = "revision";
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });
  root.querySelector("[data-data-revision]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.dataRevision = root.querySelector("#mlb-data-revision")?.value.trim() || "";
    if (!state.dataRevision) return;
    state.bridgeStep = "transfer";
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });
  root.querySelector("[data-data-transfer]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.dataTransferMean = root.querySelector("#mlb-data-mean")?.value.trim() || "";
    state.dataTransferMedian = root.querySelector("#mlb-data-median")?.value.trim() || "";
    state.dataTransferCorrect = checkDataTransfer(bridge, state.dataTransferMean, state.dataTransferMedian);
    state.dataTransferFeedback = state.dataTransferCorrect
      ? I.S("Both measures are correct. Now explain which one moved more and why.", "Ambas medidas son correctas. Ahora explica cuál cambió más y por qué.")
      : I.S("Check the total and the ordered middle values. The new set includes one additional value of 40.", "Revisa el total y los valores del medio en orden. El conjunto nuevo incluye un valor adicional de 40.");
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });
  root.querySelector("[data-data-transfer-explain]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.dataTransferExplain = root.querySelector("#mlb-data-transfer-explain")?.value.trim() || "";
    if (!state.dataTransferCorrect || !state.dataTransferExplain) return;
    state.bridgeStep = "complete";
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });
  root.querySelector("[data-data-reset]")?.addEventListener("click", () => {
    storage.remove(bridgeSaveKey(state.bridgeKey));
    Object.assign(state, { bridgeStep: "draft", bridgeSupport: 3, dataMoveValue: bridge.values[bridge.selectedIndex], dataDraft: "", dataRevision: "", dataTransferMean: "", dataTransferMedian: "", dataTransferCorrect: false, dataTransferFeedback: "", dataTransferExplain: "" });
    ctx.rerender();
  });
  root.querySelectorAll("[data-frac-scale]").forEach((button) => button.addEventListener("click", () => {
    state.fractionScale = Number(button.dataset.fracScale);
    saveBridge(state.bridgeKey);
    ctx.rerender();
  }));
  root.querySelector("#mlb-frac-draft")?.addEventListener("input", (event) => { state.fractionDraft = event.target.value.slice(0, 1200); saveBridge(state.bridgeKey); });
  root.querySelector("#mlb-frac-revision")?.addEventListener("input", (event) => { state.fractionRevision = event.target.value.slice(0, 1200); saveBridge(state.bridgeKey); });
  root.querySelector("#mlb-frac-transfer")?.addEventListener("input", (event) => { state.fractionTransferAnswer = event.target.value.slice(0, 30); saveBridge(state.bridgeKey); });
  root.querySelector("#mlb-frac-transfer-explain")?.addEventListener("input", (event) => { state.fractionTransferExplain = event.target.value.slice(0, 1200); saveBridge(state.bridgeKey); });
  root.querySelector("[data-frac-draft]")?.addEventListener("submit", (event) => {
    event.preventDefault(); state.fractionDraft = root.querySelector("#mlb-frac-draft")?.value.trim() || "";
    if (!state.fractionDraft) return; state.bridgeStep = "revision"; saveBridge(state.bridgeKey); ctx.rerender();
  });
  root.querySelector("[data-frac-revision]")?.addEventListener("submit", (event) => {
    event.preventDefault(); state.fractionRevision = root.querySelector("#mlb-frac-revision")?.value.trim() || "";
    if (!state.fractionRevision) return; state.bridgeStep = "transfer"; saveBridge(state.bridgeKey); ctx.rerender();
  });
  root.querySelector("[data-frac-transfer]")?.addEventListener("submit", (event) => {
    event.preventDefault(); state.fractionTransferAnswer = root.querySelector("#mlb-frac-transfer")?.value.trim() || "";
    state.fractionTransferCorrect = checkFractionTransfer(bridge, state.fractionTransferAnswer);
    state.fractionTransferFeedback = state.fractionTransferCorrect
      ? I.S("Correct. Now explain how the fraction and part determine the whole.", "Correcto. Ahora explica cómo la fracción y la parte determinan el todo.")
      : I.S("Not yet. First find the value of one equal part, then determine how many parts make the whole.", "Todavía no. Primero encuentra el valor de una parte igual y luego determina cuántas partes forman el todo.");
    saveBridge(state.bridgeKey); ctx.rerender();
  });
  root.querySelector("[data-frac-transfer-explain]")?.addEventListener("submit", (event) => {
    event.preventDefault(); state.fractionTransferExplain = root.querySelector("#mlb-frac-transfer-explain")?.value.trim() || "";
    if (!state.fractionTransferCorrect || !state.fractionTransferExplain) return; state.bridgeStep = "complete"; saveBridge(state.bridgeKey); ctx.rerender();
  });
  root.querySelector("[data-frac-reset]")?.addEventListener("click", () => {
    storage.remove(bridgeSaveKey(state.bridgeKey));
    Object.assign(state, { bridgeStep: "draft", fractionScale: 1, fractionDraft: "", fractionRevision: "", fractionTransferAnswer: "", fractionTransferCorrect: false, fractionTransferFeedback: "", fractionTransferExplain: "" });
    ctx.rerender();
  });
  root.querySelector("#mlb-draft")?.addEventListener("input", (event) => { state.bridgeDraft = event.target.value.slice(0, 1200); saveBridge(state.bridgeKey); });
  root.querySelector("#mlb-revision")?.addEventListener("input", (event) => { state.bridgeRevision = event.target.value.slice(0, 1200); saveBridge(state.bridgeKey); });
  root.querySelector("#mlb-transfer")?.addEventListener("input", (event) => { state.bridgeTransfer = event.target.value.slice(0, 100); saveBridge(state.bridgeKey); });
  root.querySelector("#mlb-transfer-explain")?.addEventListener("input", (event) => { state.bridgeTransferExplain = event.target.value.slice(0, 1200); saveBridge(state.bridgeKey); });
  root.querySelector("[data-bridge-draft]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.bridgeDraft = root.querySelector("#mlb-draft")?.value.trim() || "";
    if (!state.bridgeDraft) return;
    state.bridgeStep = "revision";
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });
  root.querySelector("[data-bridge-revision]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.bridgeRevision = root.querySelector("#mlb-revision")?.value.trim() || "";
    if (!state.bridgeRevision) return;
    state.bridgeStep = "transfer";
    saveBridge(state.bridgeKey);
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
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });
  root.querySelector("[data-bridge-transfer-explain]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.bridgeTransferExplain = root.querySelector("#mlb-transfer-explain")?.value.trim() || "";
    if (!state.bridgeTransferExplain) return;
    state.bridgeStep = "complete";
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });

  root.querySelector("#mlb-pct-draft")?.addEventListener("input", (event) => {
    state.percentDraft = event.target.value.slice(0, 1200);
    saveBridge(state.bridgeKey);
  });
  root.querySelector("[data-pct-draft]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.percentDraft = root.querySelector("#mlb-pct-draft")?.value.trim() || "";
    if (!state.percentDraft) return;
    state.bridgeStep = "revision";
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });
  root.querySelector("[data-pct-revision]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.percentRevision = root.querySelector("#mlb-pct-revision")?.value.trim() || "";
    if (!state.percentRevision) return;
    state.bridgeStep = "transfer";
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });
  root.querySelector("#mlb-pct-transfer")?.addEventListener("input", (event) => {
    state.percentTransferAnswer = event.target.value.slice(0, 30);
    saveBridge(state.bridgeKey);
  });
  root.querySelector("[data-pct-transfer]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.percentTransferAnswer = root.querySelector("#mlb-pct-transfer")?.value.trim() || "";
    state.percentTransferCorrect = checkPercentTransfer(bridge, state.percentTransferAnswer);
    state.percentTransferFeedback = state.percentTransferCorrect
      ? I.S("Correct. Now explain how the percent and part determine the whole.", "Correcto. Ahora explica cómo el porcentaje y la parte determinan el todo.")
      : I.S("Not yet. Think about what percent as a decimal means, then divide the part by that decimal.", "Todavía no. Piensa qué significa el porcentaje como decimal y divide la parte entre ese decimal.");
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });
  root.querySelector("#mlb-pct-transfer-explain")?.addEventListener("input", (event) => {
    state.percentTransferExplain = event.target.value.slice(0, 1200);
    saveBridge(state.bridgeKey);
  });
  root.querySelector("[data-pct-transfer-explain]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    state.percentTransferExplain = root.querySelector("#mlb-pct-transfer-explain")?.value.trim() || "";
    if (!state.percentTransferExplain) return;
    state.bridgeStep = "complete";
    saveBridge(state.bridgeKey);
    ctx.rerender();
  });
  root.querySelector("[data-pct-reset]")?.addEventListener("click", () => {
    storage.remove(bridgeSaveKey(state.bridgeKey));
    Object.assign(state, { bridgeStep: "draft", percentDraft: "", percentRevision: "", percentTransferAnswer: "", percentTransferCorrect: false, percentTransferFeedback: "", percentTransferExplain: "" });
    ctx.rerender();
  });
  root.querySelector("[data-bridge-reset]")?.addEventListener("click", () => {
    storage.remove(bridgeSaveKey(state.bridgeKey));
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
