// Reading Room: a digital reading environment. The shelf lists authored lessons; a lesson pairs a calm reading
// column (passage, optional word support, paragraph marks, saved place) with a separate response area.
// Everything is saved on this device only; nothing here is a score or a proficiency level.
import { findActivity, loadReadingAdventures, loadReadingRoomLessons, loadReadingStrategies } from "../content.js";
import { ART, BASE, esc, icon, raw, toHtml } from "../util.js";
import { canSpeak, speak, stop as stopSpeech } from "../speech.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { setComponentsI18n } from "../components.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import {
  loadReadingState,
  saveReadingState,
  clearReadingState,
} from "../reading-state.js";

let query = "";
let grade = "";
let genreFilter = "";
let lengthFilter = "";
let onlyBookmarks = false;
let activePhase = "first";
let activeMode = "practice";
let openedLessonId = "";
let notice = "";

// Chrome strings go through I (set at the top of render and of each event handler). Lesson, story and strategy text,
// vocabulary, questions and answer choices come from JSON and stay English.
let I = makeI18n("en");
const T = (en, es) => toHtml(I.T(en, es)); // markup-safe, for text nodes in the string templates below
const A = (en, es) => esc(I.S(en, es)); // plain string escaped for attributes and <option> text
// Like T, for a sentence that carries its own markup (a link). Both sides are HTML strings already escaped by the caller.
const TH = (en, es) =>
  I.bilingual
    ? `<span class="bi-pair">${en}<span class="bi-es" lang="es">${es}</span></span>`
    : I.spanish
      ? I.pageLang !== "es"
        ? `<span lang="es">${es}</span>`
        : es
      : en;
const ic = (name) => toHtml(icon(name));
const lessonUrl = (id) => `${BASE}/reading-room/${encodeURIComponent(id)}`;
const stateKey = (l) => `${l.id}@${l.revision}`;
const gradeLabel = (l) =>
  l.gradeCluster
    ? T(`Grades ${l.gradeCluster.replace("-", "–")}`, `Grados ${l.gradeCluster.replace("-", "–")}`)
    : T(
        `Grades ${l.localGradeBand || "3–5"} local · WIDA cluster unspecified`,
        `Grados ${l.localGradeBand || "3–5"} locales · grupo de WIDA sin especificar`,
      );
const passageWords = (l) =>
  l.paragraphs.reduce(
    (count, p) => count + p.text.trim().split(/\s+/).filter(Boolean).length,
    0,
  );
const lengthLabelOf = (words) =>
  words >= 350
    ? T("Sustained read", "Lectura sostenida")
    : words >= 180
      ? T("Extended practice", "Práctica extendida")
      : T("Short practice", "Práctica corta");
const clusterParam = () =>
  new URLSearchParams(location.search).get("cluster") || "6-8";
const CLUSTERS = ["1", "2-3", "4-5", "6-8", "9-12"];
const clusterOptions = (selected) =>
  CLUSTERS.map(
    (g) =>
      `<option value="${g}" ${g === selected ? "selected" : ""}>${A(`Grades ${g.replace("-", "–")}`, `Grados ${g.replace("-", "–")}`)}</option>`,
  ).join("");
// [stored value (English, never changes), Spanish label]
const MARKS = [
  ["Main idea", "Idea principal"],
  ["Important detail", "Detalle importante"],
  ["Evidence", "Evidencia"],
  ["Vocabulary", "Vocabulario"],
  ["Inference", "Inferencia"],
  ["Question", "Pregunta"],
];
const markLabel = (mark) => T(mark, Object.fromEntries(MARKS)[mark] || mark);
const LINE_SPACINGS = [
  ["1.5", "Compact", "Compacto"],
  ["1.75", "Comfortable", "Cómodo"],
  ["2", "Open", "Amplio"],
];
const SPEECH_RATES = [
  ["0.8", "Slow", "Lenta"],
  ["0.95", "Natural", "Natural"],
  ["1.1", "Faster", "Más rápida"],
];

// title/fields: [English, Español]; the stored key is the first field of each row and never changes.
const ORGANIZERS = [
  {id:"main-details",title:["Main Idea · Supporting Details","Idea principal · Detalles de apoyo"],fields:[["mainIdea","Main idea","Idea principal"],["detail1","Important detail 1","Detalle importante 1"],["detail2","Important detail 2","Detalle importante 2"],["paragraphRef","Paragraph evidence","Evidencia del párrafo"]]},
  {id:"sequence",title:["Sequence · Timeline","Secuencia · Línea de tiempo"],fields:[["sequenceStart","First event or step","Primer suceso o paso"],["sequenceNext","Next event or step","Siguiente suceso o paso"],["sequenceThen","Then","Después"],["sequenceEnd","Final event or result","Suceso o resultado final"]]},
  {id:"cause-effect",title:["Cause · Effect","Causa · Efecto"],fields:[["cause","Cause","Causa"],["effect","Effect","Efecto"],["causeLink","How are they connected?","¿Cómo se relacionan?"],["causeEvidence","Evidence paragraph","Párrafo con evidencia"]]},
  {id:"compare",title:["Compare · Contrast","Comparar · Contrastar"],fields:[["compareA","Idea or source A","Idea o fuente A"],["compareB","Idea or source B","Idea o fuente B"],["compareLink","What is similar or different?","¿Qué es parecido o diferente?"],["compareEvidence","Evidence from each source","Evidencia de cada fuente"]]},
  {id:"problem-solution",title:["Problem · Solution","Problema · Solución"],fields:[["problem","Problem","Problema"],["problemEvidence","Evidence of the problem","Evidencia del problema"],["solution","Proposed solution","Solución propuesta"],["result","Likely result or remaining question","Resultado probable o pregunta pendiente"]]},
  {id:"cer",title:["Claim · Evidence · Reasoning","Afirmación · Evidencia · Razonamiento"],fields:[["claim","Claim","Afirmación"],["evidence","Evidence","Evidencia"],["reasoning","Reasoning: how evidence supports the claim","Razonamiento: cómo la evidencia apoya la afirmación"]]},
  {id:"character",title:["Character Analysis","Análisis de personaje"],fields:[["character","Character","Personaje"],["goal","Goal or motivation","Meta o motivación"],["challenge","Challenge","Desafío"],["change","Change and evidence","Cambio y evidencia"]]},
  {id:"story",title:["Story Elements","Elementos del cuento"],fields:[["setting","Setting","Escenario"],["characters","Important characters","Personajes importantes"],["conflict","Problem or conflict","Problema o conflicto"],["events","Key events and resolution","Sucesos clave y resolución"]]},
  {id:"summary",title:["Concise Summary","Resumen breve"],fields:[["summaryTopic","Who or what is the text about?","¿De quién o de qué trata el texto?"],["summaryIdea","Central idea or event","Idea central o suceso"],["summaryDetail","One accurate detail","Un detalle exacto"],["summaryDraft","Write a concise summary","Escribe un resumen breve"]]},
  {id:"word-web",title:["Word Relationships","Relaciones entre palabras"],fields:[["wordRoot","Focus word or root","Palabra o raíz principal"],["wordFamily","Related forms or word family","Formas relacionadas o familia de palabras"],["wordCollocation","Words often used with it","Palabras que suelen usarse con ella"],["wordSentence","New sentence showing the meaning","Oración nueva que muestre el significado"]]},
  {id:"text-structure",title:["Text Structure Explorer","Explorador de la estructura del texto"],fields:[["structure","Structure (sequence, cause/effect, compare, etc.)","Estructura (secuencia, causa y efecto, comparación, etc.)"],["signalWords","Signal words","Palabras clave"],["evidenceOrganization","How are ideas organized?","¿Cómo se organizan las ideas?"],["structureEffect","How does the structure help the reader?","¿Cómo ayuda la estructura al lector?"]]},
  {id:"two-source",title:["Two-Source Synthesis","Síntesis de dos fuentes"],fields:[["sourceOne","Source 1: claim and evidence","Fuente 1: afirmación y evidencia"],["sourceTwo","Source 2: claim and evidence","Fuente 2: afirmación y evidencia"],["sharedIdea","Shared idea or disagreement","Idea compartida o desacuerdo"],["synthesis","Conclusion supported by both sources","Conclusión apoyada por ambas fuentes"]]},
  {id:"evidence-table",title:["Evidence Collection","Recopilación de evidencia"],fields:[["evidenceQuestion","Question to investigate","Pregunta para investigar"],["evidenceOne","Evidence detail 1","Detalle de evidencia 1"],["evidenceTwo","Evidence detail 2","Detalle de evidencia 2"],["evidenceReasoning","What do the details support?","¿Qué apoyan los detalles?"]]},
  {id:"vocabulary-map",title:["Vocabulary Concept Map","Mapa conceptual de vocabulario"],fields:[["conceptWord","Focus word","Palabra principal"],["conceptMeaning","Meaning in this text","Significado en este texto"],["conceptFeatures","Examples or features","Ejemplos o características"],["conceptConnections","Related words, roots, or concepts","Palabras, raíces o conceptos relacionados"],["conceptUse","Use it in a new sentence","Úsala en una oración nueva"]]},
];
const renderOrganizers = (lessonId, progress) =>
  `<details class="rr-organizers"><summary>${ic("list")} ${T(`Graphic organizers · ${ORGANIZERS.length} editable tools`, `Organizadores gráficos · ${ORGANIZERS.length} herramientas editables`)}</summary><p>${T("Write, revise, and save an organizer. Responses stay in this browser.", "Escribe, revisa y guarda un organizador. Las respuestas se quedan en este navegador.")}</p>${ORGANIZERS.map(
    (o) =>
      `<details class="rr-organizer"><summary>${T(o.title[0], o.title[1])}</summary><div class="rr-organizer-grid">${o.fields
        .map(
          ([key, label, es]) =>
            `<label>${T(label, es)}<textarea data-rr-organizer="${esc(key)}" data-rr-lesson="${esc(lessonId)}" rows="2">${esc(progress.organizer?.[key] || "")}</textarea></label>`,
        )
        .join("")}</div></details>`,
  ).join(
    "",
  )}<button type="button" class="btn small" data-rr-print>${ic("print")} ${T("Print lesson and organizers", "Imprimir la lección y los organizadores")}</button></details>`;

/** Page header shared by the shelf's sub-pages. */
const pageHeader = (eyebrow, title, intro, extra = "") =>
  `<header class="rr-title"><p class="rr-eyebrow">${eyebrow}</p><h1>${title}</h1>${intro}${extra}</header>`; // eyebrow, title and intro are markup-safe (T output)
const backLink = (to, label) =>
  `<a class="rr-link rr-return" href="${to}">${ic("arrow-left")} ${label}</a>`;

// ── shelf ───────────────────────────────────────────────────────────────────────────────────────────────────────────

function lessonCard(l, state) {
  const p = state.lessons[stateKey(l)] || {};
  const words = passageWords(l);
  const action = p.completed
    ? T("Read again", "Leer otra vez")
    : p.started
      ? T("Continue reading", "Seguir leyendo")
      : T("Open lesson", "Abrir la lección");
  return `<article class="rr-book"><div class="rr-book-mark" aria-hidden="true">${ic("reading")}<span>${esc(l.subject)}</span></div><div class="rr-book-copy"><p class="rr-eyebrow">${gradeLabel(l)} · ${esc(l.genre)} · ${l.minutes} min · ${lengthLabelOf(words)} · ${T(`${words} words`, `${words} palabras`)}</p><h2><a href="${lessonUrl(l.id)}">${esc(l.title)}</a></h2><p class="rr-summary">${esc(l.summary)}</p><p class="rr-meta">${esc(l.keyUse)} · ${esc(l.languageFunction)}</p><p class="rr-review-status">${T("Editorial review pending", "Revisión editorial pendiente")}</p><a class="rr-link" href="${lessonUrl(l.id)}">${action}<span aria-hidden="true"> →</span></a></div></article>`;
}

function filterLessons(lessons, state) {
  return lessons.filter((l) => {
    const words = passageWords(l);
    const inGrade =
      !grade ||
      (grade === "3-5-local"
        ? !l.gradeCluster && l.localGradeBand === "3-5"
        : l.gradeCluster === grade);
    const inLength =
      !lengthFilter ||
      (lengthFilter === "short"
        ? words < 180
        : lengthFilter === "extended"
          ? words >= 180 && words < 350
          : words >= 350);
    const hay =
      `${l.title} ${l.summary} ${l.genre} ${l.subject} ${l.topics.join(" ")} ${l.languageFunction}`.toLowerCase();
    return (
      inGrade &&
      (!genreFilter || l.genre === genreFilter) &&
      inLength &&
      (!onlyBookmarks || state.bookmarks.includes(l.id)) &&
      (!query || hay.includes(query.toLowerCase()))
    );
  });
}

function shelfHTML(ctx, lessons, state) {
  const filtered = filterLessons(lessons, state);
  const last = lessons.find((l) => l.id === state.lastRead);
  const recentRows = state.recent
    .map((rid) => lessons.find((l) => l.id === rid))
    .filter(Boolean)
    .slice(0, 5);
  const genres = [...new Set(lessons.map((l) => l.genre))].sort();
  const lastProgress = last ? state.lessons[stateKey(last)] || {} : {};
  return `<section class="rr-shell d-reading"><header class="rr-hero"><div><p class="rr-eyebrow">${ic("reading")} ${T("ACCESS Practice Lab · Reading", "Laboratorio ACCESS · Lectura")}</p><h1>${T("Reading Room", "Sala de lectura")}</h1><p class="rr-lead">${T("Read closely, collect evidence, and build the language to explain what a text means.", "Lee con atención, reúne evidencia y construye el lenguaje para explicar qué significa un texto.")}</p><div class="rr-chips"><span>${T("Original classroom practice", "Práctica original para el salón")}</span><span>${T("Saved on this device", "Guardado en este dispositivo")}</span><span>${T("WIDA-informed instruction · not an official assessment", "Enseñanza basada en WIDA · no es una evaluación oficial")}</span><span>${T("Editorial review pending · teacher preview", "Revisión editorial pendiente · vista previa para docentes")}</span></div></div><div class="rr-hero-art" aria-hidden="true"><img src="${ART}/domain-reading.svg" alt="" width="480" height="360"></div></header>
    <section class="rr-adventure-entry"><div><p class="rr-eyebrow">${T("Serialized Reading Adventures", "Aventuras de lectura por capítulos")}</p><h2>${T("Follow a story. Gather clues. Explain what changed.", "Sigue una historia. Reúne pistas. Explica qué cambió.")}</h2><p>${T("Original six-chapter mysteries and investigations with saved chapter notes, evidence responses, and comprehension checks.", "Misterios e investigaciones originales de seis capítulos, con notas de cada capítulo, respuestas con evidencia y preguntas de comprensión guardadas.")}</p></div><a class="btn btn-primary" href="${BASE}/reading-room/adventures">${T("Explore the adventures", "Explora las aventuras")}</a></section>
    <section class="rr-adventure-entry"><div><p class="rr-eyebrow">${T("Reading Strategy Academy", "Academia de estrategias de lectura")}</p><h2>${T("Learn a strategy, practice it, then transfer it.", "Aprende una estrategia, practícala y luego úsala en otros textos.")}</h2><p>${T("Short think-alouds and guided lessons help readers predict, investigate, clarify, summarize, and synthesize across new texts.", "Pensamientos en voz alta y lecciones guiadas te ayudan a predecir, investigar, aclarar, resumir y sintetizar en textos nuevos.")}</p></div><a class="btn btn-primary" href="${BASE}/reading-room/strategies">${T("Explore strategy lessons", "Explora las lecciones de estrategias")}</a></section>
    ${last ? `<section class="rr-continue"><span class="rr-continue-icon" aria-hidden="true">${ic("bookmark")}</span><div><p class="rr-eyebrow">${T("Pick up where you left off", "Sigue donde te quedaste")}</p><h2>${esc(last.title)}</h2><p>${lastProgress.phase ? T("Your lesson progress is saved on this device.", "Tu avance en la lección está guardado en este dispositivo.") : T("Your reading place is ready.", "Tu lugar en la lectura está listo.")}</p></div><a class="btn btn-primary btn-domain" href="${lessonUrl(last.id)}">${T("Continue reading", "Seguir leyendo")}</a></section>` : ""}
    ${recentRows.length ? `<section class="rr-recent"><h2>${T("Recently read", "Leído hace poco")}</h2><ul>${recentRows.map((l) => `<li><a href="${lessonUrl(l.id)}">${esc(l.title)}</a></li>`).join("")}</ul></section>` : ""}
    <section class="rr-library" aria-labelledby="rr-library-title"><div class="rr-library-head"><div><p class="rr-eyebrow">${T("The reading shelf", "El estante de lectura")}</p><h2 id="rr-library-title">${T("Choose a text", "Elige un texto")}</h2></div></div>
      <div class="rr-filters"><label class="rr-search">${T("Search texts", "Buscar textos")} <input data-rr-search type="search" value="${esc(query)}" placeholder="${A("Topic, skill, or title", "Tema, destreza o título")}"></label><label class="rr-filter">${T("Genre", "Género")}<select data-rr-genre><option value="">${A("All genres", "Todos los géneros")}</option>${genres.map((g) => `<option value="${esc(g)}" ${genreFilter === g ? "selected" : ""}>${esc(g)}</option>`).join("")}</select></label><label class="rr-filter">${T("Grade cluster", "Grupo de grados")}<select data-rr-grade><option value="">${A("All clusters", "Todos los grupos")}</option>${clusterOptions(grade)}<option value="3-5-local" ${grade === "3-5-local" ? "selected" : ""}>${A("Grades 3–5 local · WIDA cluster unspecified", "Grados 3–5 locales · grupo de WIDA sin especificar")}</option></select></label><label class="rr-filter">${T("Reading length", "Extensión de la lectura")}<select data-rr-length><option value="">${A("Any length", "Cualquier extensión")}</option><option value="short" ${lengthFilter === "short" ? "selected" : ""}>${A("Short practice · under 180 words", "Práctica corta · menos de 180 palabras")}</option><option value="extended" ${lengthFilter === "extended" ? "selected" : ""}>${A("Extended practice · 180–349 words", "Práctica extendida · 180–349 palabras")}</option><option value="sustained" ${lengthFilter === "sustained" ? "selected" : ""}>${A("Sustained reads · 350+ words", "Lecturas sostenidas · 350+ palabras")}</option></select></label></div>
      <div class="rr-count-row"><p class="rr-count" aria-live="polite">${T(`${filtered.length} of ${lessons.length} authored reading lessons`, `${filtered.length} de ${lessons.length} lecciones de lectura`)}</p><button type="button" class="rr-reset" data-rr-bookmark-filter aria-pressed="${onlyBookmarks}">${ic("bookmark")} ${onlyBookmarks ? T("Showing bookmarks", "Mostrando marcadores") : T("Show bookmarks only", "Mostrar solo marcadores")}</button></div>
      <div class="rr-books">${filtered.length ? filtered.map((l) => lessonCard(l, state)).join("") : `<div class="rr-empty"><img src="${ART}/empty.svg" alt="" width="240" height="180"><h3>${T("No texts match yet", "Ningún texto coincide todavía")}</h3><p>${T("Try another topic, grade cluster, or reading length.", "Prueba otro tema, grupo de grados o extensión de lectura.")}</p></div>`}</div></section>
    <section class="rr-legacy"><div><p class="rr-eyebrow">${T("More short practice", "Más práctica corta")}</p><h2>${T("Existing Reading activities", "Actividades de lectura existentes")}</h2><p>${T("Open the established ACCESS Lab Reading activities. These short practices are separate from the authored multi-part lessons above.", "Abre las actividades de lectura del Laboratorio ACCESS. Estas prácticas cortas son aparte de las lecciones de varias partes de arriba.")}</p></div><a class="btn" href="${BASE}/Reading?grades=${esc(ctx.band)}">${T("Browse Reading practice", "Ver práctica de lectura")} ${ic("arrow-right")}</a></section>
    <section class="rr-tools"><div><h2>${T("Your reading tools", "Tus herramientas de lectura")}</h2><p>${T("Bookmarks, annotations, preferences, and lesson progress stay in this browser. They are not synced across devices.", "Los marcadores, las anotaciones, las preferencias y el avance en las lecciones se quedan en este navegador. No se sincronizan entre dispositivos.")}</p><ul class="rr-tool-links"><li><a href="${BASE}/vocabulary?grades=${esc(ctx.band)}">${ic("words")} ${T("Open Word Builder", "Abrir el Constructor de palabras")}</a></li><li><a href="${BASE}/reading-room/words">${ic("bookmark")} ${T(`Open Reading Word Notebook (${state.words.length})`, `Abrir el Cuaderno de palabras de lectura (${state.words.length})`)}</a></li><li><a href="${BASE}/reading-room/family">${ic("families")} ${T("Family reading at home", "Lectura en familia en casa")}</a></li><li><a href="${BASE}/reading-room/teacher">${ic("teacher")} ${T("Local teacher progress view", "Vista local del avance para docentes")}</a></li><li><a href="${BASE}/reading-room/pathways">${ic("road")} ${T("Workshop pathways", "Rutas del taller")}</a></li></ul></div><div class="rr-tools-reset"><button type="button" class="rr-reset" data-rr-action="clear">${T("Clear local Reading Room data", "Borrar los datos locales de la Sala de lectura")}</button>${notice ? `<p role="status">${esc(notice)}</p>` : ""}</div></section></section>`;
}

const adventureUrl = (id) => `${BASE}/reading-room/adventure-${encodeURIComponent(id)}`;

const strategyUrl = (id) => `${BASE}/reading-room/strategy-${encodeURIComponent(id)}`;
const STRATEGY_STRANDS = {
  "predict-connect": "Predict and connect",
  "question-investigate": "Question and investigate",
  "clarify-explore": "Clarify and explore words",
  "summarize-synthesize": "Summarize and synthesize",
};
const STRATEGY_STRANDS_ES = {
  "predict-connect": "Predecir y conectar",
  "question-investigate": "Preguntar e investigar",
  "clarify-explore": "Aclarar y explorar palabras",
  "summarize-synthesize": "Resumir y sintetizar",
};
const strandLabel = (id) => T(STRATEGY_STRANDS[id], STRATEGY_STRANDS_ES[id]);
const STRATEGY_SKILL_LABELS = {
  prediction: "Make and revise predictions",
  "question-generation": "Generate useful questions",
  "literal-retrieval": "Locate explicit information",
  "inference-strategy": "Make evidence-based inferences",
  "evidence-selection-strategy": "Select strong evidence",
  "vocabulary-clarification-strategy": "Clarify unfamiliar words",
  morphology: "Use meaningful word parts",
  "rereading-purpose": "Reread with a purpose",
  "central-idea-strategy": "Identify a central idea",
  summarization: "Summarize essential information",
  synthesis: "Synthesize ideas across texts",
  sequence: "Summarize in sequence",
  "cause-effect": "Summarize cause and effect",
};
const STRATEGY_SKILL_LABELS_ES = {
  prediction: "Hacer y revisar predicciones",
  "question-generation": "Hacer preguntas útiles",
  "literal-retrieval": "Ubicar información explícita",
  "inference-strategy": "Hacer inferencias basadas en evidencia",
  "evidence-selection-strategy": "Elegir evidencia sólida",
  "vocabulary-clarification-strategy": "Aclarar palabras desconocidas",
  morphology: "Usar partes de palabras con significado",
  "rereading-purpose": "Releer con un propósito",
  "central-idea-strategy": "Identificar una idea central",
  summarization: "Resumir la información esencial",
  synthesis: "Sintetizar ideas de varios textos",
  sequence: "Resumir en orden",
  "cause-effect": "Resumir causa y efecto",
};
const skillLabel = (skill) => {
  const en = STRATEGY_SKILL_LABELS[skill] || skill.replaceAll("-", " ");
  return T(en, STRATEGY_SKILL_LABELS_ES[skill] || en);
};

function strategiesHTML(data, state) {
  const strand = new URLSearchParams(location.search).get("strand") || "";
  const cluster = new URLSearchParams(location.search).get("cluster") || "";
  const lessons = data.lessons.filter((lesson) => (!strand || lesson.strand === strand) && (!cluster || lesson.gradeCluster === cluster));
  const cards = lessons.map((lesson) => {
    const saved = state.strategies[lesson.id] || {};
    const status = saved.independent?.checked ? T("Independent transfer completed", "Transferencia independiente completada") : saved.guided?.checked ? T("Guided practice saved", "Práctica guiada guardada") : T("New lesson", "Lección nueva");
    return `<article class="rr-strategy-card"><p class="rr-eyebrow">${T(`Grades ${lesson.gradeCluster.replace("-", "–")}`, `Grados ${lesson.gradeCluster.replace("-", "–")}`)} · ${strandLabel(lesson.strand)}</p><h2><a href="${strategyUrl(lesson.id)}">${esc(lesson.title)}</a></h2><p><b>${T("Strategy:", "Estrategia:")}</b> ${skillLabel(lesson.skill)}</p><p class="rr-adventure-progress">${status}</p><a class="rr-link" href="${strategyUrl(lesson.id)}">${saved.independent?.checked ? T("Practice again", "Practicar otra vez") : saved.guided?.checked ? T("Continue lesson", "Seguir con la lección") : T("Start lesson", "Empezar la lección")} →</a></article>`;
  }).join("");
  return shell(`${backLink(`${BASE}/reading-room`, T("Return to the Reading Room", "Volver a la Sala de lectura"))}${pageHeader(T("Model · guided practice · independent transfer", "Modelo · práctica guiada · transferencia independiente"), T("Reading Strategy Academy", "Academia de estrategias de lectura"), `<p>${T("Each lesson makes a reading move visible, gives you a chance to explain your thinking, and ends with a new passage to try independently. Results are practice evidence, not a reading level.", "Cada lección hace visible un paso de la lectura, te da la oportunidad de explicar tu razonamiento y termina con un pasaje nuevo para probar por tu cuenta. Los resultados son evidencia de práctica, no un nivel de lectura.")}</p>`)}<div class="rr-strategy-filters"><label>${T("Strategy strand", "Línea de estrategias")}<select data-strategy-strand><option value="">${A("All strands", "Todas las líneas")}</option>${Object.entries(STRATEGY_STRANDS).map(([id, title]) => `<option value="${id}" ${strand === id ? "selected" : ""}>${A(title, STRATEGY_STRANDS_ES[id])}</option>`).join("")}</select></label><label>${T("Grade cluster", "Grupo de grados")}<select data-strategy-cluster><option value="">${A("All clusters", "Todos los grupos")}</option><option value="3-5" ${cluster === "3-5" ? "selected" : ""}>${A("Grades 3–5", "Grados 3–5")}</option><option value="6-8" ${cluster === "6-8" ? "selected" : ""}>${A("Grades 6–8", "Grados 6–8")}</option></select></label></div><p class="rr-count" aria-live="polite">${T(`${lessons.length} original strategy lessons`, `${lessons.length} lecciones de estrategias originales`)}</p><div class="rr-strategy-grid">${cards || `<p>${T("No lessons match these filters.", "Ninguna lección coincide con estos filtros.")}</p>`}</div>`);
}

function strategyLessonHTML(lesson, state) {
  const saved = state.strategies[lesson.id] || {};
  const renderQuestion = (stage, task) => {
    const response = saved[stage] || {};
    const checked = response.checked === true;
    const selected = task.options.map((option, i) => `<label><input type="radio" name="strategy-${stage}" value="${i}" data-strategy-choice="${stage}" ${response.selected === i ? "checked" : ""}> ${esc(option)}</label>`).join("");
    const feedback = checked ? `<p role="status" class="rr-adventure-feedback ${response.correct ? "is-correct" : "is-revisit"}">${response.correct ? T("That response is supported. ", "Esa respuesta tiene apoyo. ") : T("Revisit the clue, then try again. ", "Vuelve a la pista y vuelve a intentarlo. ")}${esc(response.correct ? task.explanation : task.feedback?.[response.selected] || task.explanation)}</p>` : "";
    const retry = checked && !response.correct ? `<button class="btn small" type="button" data-strategy-retry="${stage}">${T("Try this question again", "Intenta esta pregunta otra vez")}</button>` : "";
    return `<fieldset class="rr-adventure-choice"><legend>${esc(task.question)}</legend>${selected}<label class="rr-strategy-explain">${T("Explain your thinking", "Explica tu razonamiento")}<textarea rows="3" data-strategy-explanation="${stage}" placeholder="${A("Name a clue and explain how it supports your idea.", "Nombra una pista y explica cómo apoya tu idea.")}">${esc(response.explanation || "")}</textarea></label><button class="btn small" type="button" data-strategy-check="${stage}" ${response.selected == null || !response.explanation?.trim() || (checked && response.correct) ? "disabled" : ""}>${checked && response.correct ? T("Checked", "Revisado") : T("Check my thinking", "Revisar mi razonamiento")}</button>${retry}${feedback}</fieldset>`;
  };
  const completed = saved.independent?.checked && saved.independent?.correct;
  const independentReady = saved.guided?.checked && saved.guided?.correct;
  const model = independentReady ? "" : `<section class="rr-strategy-stage"><h2>${T("1. Watch: a reader thinks aloud", "1. Observa: un lector piensa en voz alta")}</h2><blockquote><p>${esc(lesson.model.text)}</p><p><b>${T("Think-aloud:", "Pensamiento en voz alta:")}</b> ${esc(lesson.model.think)}</p></blockquote></section>`;
  const guided = independentReady ? "" : `<section class="rr-strategy-stage"><h2>${T("2. Practice together", "2. Practiquemos juntos")}</h2><p>${esc(lesson.guided.text)}</p>${renderQuestion("guided", lesson.guided)}</section>`;
  const transfer = independentReady
    ? `<section class="rr-strategy-stage"><h2>${T("3. Try independently: new passage", "3. Prueba por tu cuenta: pasaje nuevo")}</h2><p>${esc(lesson.independent.text)}</p>${renderQuestion("independent", lesson.independent)}<p class="rr-help">${T("This fresh passage is checked separately from guided practice. No hints are provided in this step.", "Este pasaje nuevo se revisa aparte de la práctica guiada. En este paso no hay pistas.")}</p></section>`
    : `<section class="rr-strategy-stage rr-strategy-locked"><h2>${T("3. Independent transfer", "3. Transferencia independiente")}</h2><p>${T("First complete guided practice. Then you will apply the strategy to a new passage.", "Primero completa la práctica guiada. Después usarás la estrategia en un pasaje nuevo.")}</p></section>`;
  return shell(`${backLink(`${BASE}/reading-room/strategies`, T("All strategy lessons", "Todas las lecciones de estrategias"))}<header class="rr-adventure-heading"><p class="rr-eyebrow">${T(`Grades ${lesson.gradeCluster.replace("-", "–")}`, `Grados ${lesson.gradeCluster.replace("-", "–")}`)} · ${strandLabel(lesson.strand)}</p><h1>${esc(lesson.title)}</h1><p>${T("Strategy focus:", "Enfoque de la estrategia:")} <b>${skillLabel(lesson.skill)}</b></p><p>${T("Work is saved on this device. Your answer text stays here; the learning record stores only whether the keyed response was correct.", "Tu trabajo se guarda en este dispositivo. El texto de tus respuestas se queda aquí; el registro de aprendizaje solo guarda si la respuesta clave fue correcta.")}</p></header><ol class="rr-strategy-steps" aria-label="${A("Lesson sequence", "Secuencia de la lección")}"><li>${T("Watch a reader think", "Observa cómo piensa un lector")}</li><li>${T("Practice together", "Practiquemos juntos")}</li><li>${T("Try independently", "Prueba por tu cuenta")}</li></ol>${model}${guided}${transfer}${completed ? `<section role="status" class="rr-adventure-feedback is-correct"><h2>${T("Independent transfer complete", "Transferencia independiente completada")}</h2><p>${T("You used the strategy on a new passage. Revisit the lesson any time to practice again.", "Usaste la estrategia en un pasaje nuevo. Vuelve a la lección cuando quieras para practicar otra vez.")}</p><a href="${BASE}/reading-room/strategies">${T("Choose another strategy", "Elige otra estrategia")} →</a></section>` : ""}<p class="rr-status" role="status">${T("Progress saves automatically in this browser.", "El avance se guarda automáticamente en este navegador.")}</p>`);
}

function adventuresHTML(stories, state) {
  return shell(`${backLink(`${BASE}/reading-room`, T("Return to the Reading Room", "Volver a la Sala de lectura"))}${pageHeader(T("Original serialized stories · saved on this device", "Historias originales por capítulos · guardadas en este dispositivo"), T("Reading Adventures", "Aventuras de lectura"), `<p>${T("Read one chapter at a time. Make predictions, check an idea against the text, and keep a short chapter recap. Work stays in this browser and is not an official assessment.", "Lee un capítulo a la vez. Haz predicciones, comprueba una idea con el texto y escribe un resumen breve de cada capítulo. Tu trabajo se queda en este navegador y no es una evaluación oficial.")}</p>`)}<div class="rr-adventure-grid">${stories.map((story) => {
    const progress = state.adventures[story.id] || {};
    const chapter = Math.min(progress.chapter || 0, story.chapters.length - 1);
    const done = progress.completed === true;
    return `<article class="rr-adventure-card"><p class="rr-eyebrow">${T(`Grades ${story.gradeCluster.replace("-", "–")}`, `Grados ${story.gradeCluster.replace("-", "–")}`)} · ${esc(story.genre)} · ${T("6 chapters", "6 capítulos")}</p><h2><a href="${adventureUrl(story.id)}">${esc(story.title)}</a></h2><p>${esc(story.summary)}</p><p><b>${T("Language focus:", "Enfoque del lenguaje:")}</b> ${esc(story.skill)}</p><p class="rr-adventure-progress">${done ? T("Completed", "Completada") : progress.started ? T(`Chapter ${chapter + 1} of 6 · saved`, `Capítulo ${chapter + 1} de 6 · guardado`) : T("New story", "Historia nueva")}</p><a class="rr-link" href="${adventureUrl(story.id)}">${done ? T("Read again", "Leer otra vez") : progress.started ? T("Continue story", "Seguir con la historia") : T("Start story", "Empezar la historia")} →</a></article>`;
  }).join("")}</div>`);
}

function adventureHTML(story, state) {
  const progress = state.adventures[story.id] || { chapter: 0, responses: {} };
  const chapterIndex = Math.min(Math.max(0, Number(progress.chapter) || 0), story.chapters.length - 1);
  const chapter = story.chapters[chapterIndex];
  const response = progress.responses?.[chapterIndex] || {};
  const steps = story.chapters.map((part, i) => `<li><button type="button" data-adv-nav="${i}" aria-current="${chapterIndex === i ? "step" : "false"}"><span>${i + 1}</span>${esc(part.title)}${progress.responses?.[i]?.recap ? ` · ${T("saved", "guardado")}` : ""}</button></li>`).join("");
  const paragraphs = chapter.paragraphs.map((text, i) => `<p id="chapter-${chapterIndex + 1}-p-${i + 1}">${esc(text)}</p>`).join("");
  const words = chapter.vocabulary.map((v) => `<details class="rr-adventure-word"><summary>${esc(v.term)}</summary><p>${esc(v.definition)}</p><p><b>${T("In this story:", "En esta historia:")}</b> ${esc(v.example)}</p></details>`).join("");
  const choice = `<fieldset class="rr-adventure-choice"><legend>${esc(chapter.question.prompt)}</legend>${chapter.question.options.map((option, i) => `<label><input type="radio" name="adv-answer" value="${i}" ${response.answer === i ? "checked" : ""}> ${esc(option)}</label>`).join("")}<button class="btn small" type="button" data-adv-check="${chapterIndex}" ${response.answer == null ? "disabled" : ""}>${T("Check my thinking", "Revisar mi razonamiento")}</button>${response.checked ? `<p role="status" class="rr-adventure-feedback ${response.correct ? "is-correct" : "is-revisit"}">${response.correct ? T("That fits the evidence. ", "Eso encaja con la evidencia. ") : T("Read the explanation and revisit the clue. ", "Lee la explicación y vuelve a la pista. ")}${esc(chapter.question.why)}</p>` : ""}</fieldset>`;
  const prev = chapterIndex > 0 ? `<button type="button" class="btn" data-adv-nav="${chapterIndex - 1}">← ${T("Previous chapter", "Capítulo anterior")}</button>` : "";
  const next = chapterIndex < story.chapters.length - 1 ? `<button type="button" class="btn btn-primary" data-adv-nav="${chapterIndex + 1}">${T("Next chapter", "Capítulo siguiente")} →</button>` : `<button type="button" class="btn btn-primary" data-adv-complete>${T("Finish this adventure", "Terminar esta aventura")}</button>`;
  const done = progress.completed ? `<p role="status" class="rr-adventure-feedback is-correct">${T("Adventure complete. Your chapter notes and responses are saved on this device.", "Aventura completada. Tus notas de los capítulos y tus respuestas están guardadas en este dispositivo.")}</p>` : "";
  return shell(`${backLink(`${BASE}/reading-room/adventures`, T("All Reading Adventures", "Todas las aventuras de lectura"))}<header class="rr-adventure-heading"><p class="rr-eyebrow">${T(`Grades ${story.gradeCluster.replace("-", "–")}`, `Grados ${story.gradeCluster.replace("-", "–")}`)} · ${esc(story.genre)} · ${esc(story.keyUse)}</p><h1>${esc(story.title)}</h1><p>${esc(story.summary)}</p><p><b>${T("Characters:", "Personajes:")}</b> ${esc(story.characters)} · <b>${T("Reading focus:", "Enfoque de la lectura:")}</b> ${esc(story.skill)}</p><p class="rr-review-status">${T("Original instructional story · independent editorial review pending", "Historia didáctica original · revisión editorial independiente pendiente")}</p><progress max="${story.chapters.length}" value="${chapterIndex + (progress.responses?.[chapterIndex]?.recap ? 1 : 0)}" aria-label="${A("Adventure reading progress", "Avance de lectura de la aventura")}"></progress><span class="rr-adventure-progress-label">${T(`Chapter ${chapterIndex + 1} of ${story.chapters.length}`, `Capítulo ${chapterIndex + 1} de ${story.chapters.length}`)}</span>${canSpeak() ? `<p><button type="button" class="btn small" data-adv-listen="play">${T("Listen with this device’s voice", "Escucha con la voz de este dispositivo")}</button> <button type="button" class="btn small" data-adv-listen="stop">${T("Stop audio", "Detener el audio")}</button></p><span class="rr-help">${T("Audio uses your browser’s available speech voice; no recording is saved.", "El audio usa la voz disponible en tu navegador; no se guarda ninguna grabación.")}</span>` : `<p class="rr-help">${T("Device speech is unavailable. Read the chapter text on screen.", "La voz del dispositivo no está disponible. Lee el texto del capítulo en la pantalla.")}</p>`}</header><div class="rr-adventure-layout"><nav class="rr-adventure-nav" aria-label="${A("Chapters", "Capítulos")}"><h2>${T("Chapters", "Capítulos")}</h2><ol>${steps}</ol></nav><article class="rr-adventure-reading"><p class="rr-eyebrow">${T(`Chapter ${chapterIndex + 1}`, `Capítulo ${chapterIndex + 1}`)}</p><h2>${esc(chapter.title)}</h2><p class="rr-adventure-teaser">${esc(chapter.teaser)}</p><div class="rr-passage">${paragraphs}</div><section class="rr-adventure-vocabulary" aria-label="${A("Chapter vocabulary", "Vocabulario del capítulo")}">${words}</section><section class="rr-adventure-response"><h3>${T("Pause and think", "Haz una pausa y piensa")}</h3><label>${T("Make a prediction", "Haz una predicción")}<textarea rows="3" data-adv-response="prediction" placeholder="${A("What do you think may happen? Use a clue.", "¿Qué crees que puede pasar? Usa una pista.")}">${esc(response.prediction || "")}</textarea><span class="rr-help">${T("Your prediction saves as you type. You can revisit it after the next chapter.", "Tu predicción se guarda mientras escribes. Puedes volver a ella después del siguiente capítulo.")}</span></label>${choice}<label>${T("Explain with evidence", "Explica con evidencia")}<textarea rows="4" data-adv-response="evidence" placeholder="${A("Use a detail from this chapter and explain what it supports.", "Usa un detalle de este capítulo y explica qué apoya.")}">${esc(response.evidence || "")}</textarea><span class="rr-help">${T("This open response is saved for your review; it is not automatically scored.", "Esta respuesta abierta se guarda para que la revises; no se califica automáticamente.")}</span></label><label>${T("Chapter recap", "Resumen del capítulo")}<textarea rows="3" data-adv-response="recap" placeholder="${A("What changed, and which detail matters most?", "¿Qué cambió y qué detalle importa más?")}">${esc(response.recap || "")}</textarea></label>${done}<div class="rr-adventure-controls">${prev}${next}</div><p class="rr-status" role="status">${T("Your responses save in this browser.", "Tus respuestas se guardan en este navegador.")}</p></section></article></div>`);
}

// ── sub-pages ───────────────────────────────────────────────────────────────────────────────────────────────────────

const shell = (inner) =>
  `<section class="rr-shell d-reading">${inner}</section>`;

function familyHTML(lessons) {
  return shell(
    `${pageHeader(T("Read together · optional · no account", "Lean juntos · opcional · sin cuenta"), T("Family Reading", "Lectura en familia"), `<p>${T("Choose a short text and spend about 10–15 minutes reading, looking at the details, and talking together. English fluency is not required for a useful conversation.", "Elijan un texto breve y dediquen unos 10–15 minutos a leer, mirar los detalles y conversar juntos. No hace falta hablar inglés con fluidez para tener una conversación útil.")}</p>${I.mode === "en" ? `<p lang="es">Elijan un texto breve y lean durante unos 10–15 minutos. Pueden conversar en cualquier idioma; no es necesario hablar inglés con fluidez.</p>` : ""}`)}<div class="rr-books">${lessons.map((l) => `<article class="rr-book"><div class="rr-book-copy"><p class="rr-eyebrow">${gradeLabel(l)} · ${l.minutes} min</p><h2><a href="${lessonUrl(l.id)}">${esc(l.title)}</a></h2><p>${esc(l.familySupport.directions.en)}</p><p lang="es">${esc(l.familySupport.directions.es)}</p><p><b>${T("Try asking:", "Pregunten:")}</b> ${esc(l.familySupport.questions[0])}</p></div></article>`).join("")}</div>${backLink(`${BASE}/reading-room`, T("Return to the Reading Room", "Volver a la Sala de lectura"))}`,
  );
}

function wordsHTML(state) {
  const body = state.words.length
    ? `<div class="rr-books">${state.words.map((w, i) => `<article class="rr-book"><div class="rr-book-copy"><p class="rr-eyebrow">${w.lessonId ? esc(w.lessonId) : T("Reading", "Lectura")}</p><h2>${esc(w.term)}</h2><p>${esc(w.definition)}</p><p><b>${T("Example:", "Ejemplo:")}</b> ${esc(w.example)}</p><button type="button" class="rr-reset" data-rr-remove-word="${i}">${T("Remove word", "Quitar la palabra")}</button></div></article>`).join("")}</div>`
    : `<div class="rr-empty"><img src="${ART}/empty.svg" alt="" width="240" height="180"><h2>${T("No words saved yet", "Todavía no hay palabras guardadas")}</h2><p>${T("Open a lesson and choose “Save to Word Notebook” on a vocabulary card.", "Abre una lección y elige “Guardar en el Cuaderno de palabras” en una tarjeta de vocabulario.")}</p></div>`;
  return shell(
    `${pageHeader(T("Your saved academic words · this device", "Tus palabras académicas guardadas · este dispositivo"), T("Reading Word Notebook", "Cuaderno de palabras de lectura"), `<p>${T("Review each word in its reading context. Saved words stay in this browser.", "Repasa cada palabra en el contexto de la lectura. Las palabras guardadas se quedan en este navegador.")}</p>`)}${body}${backLink(`${BASE}/reading-room`, T("Return to the Reading Room", "Volver a la Sala de lectura"))}`,
  );
}

function pathwaysHTML(lessons) {
  const cluster = clusterParam();
  const picks = lessons.filter((l) => l.gradeCluster === cluster).slice(0, 4);
  const feature = picks[0] || lessons[0];
  const card = (eyebrow, title, body, link) =>
    `<article class="rr-book"><div class="rr-book-copy"><p class="rr-eyebrow">${eyebrow}</p><h2>${title}</h2><p>${body}</p>${link}</div></article>`;
  const go = (to, label) => `<a class="rr-link" href="${to}">${label} →</a>`;
  return shell(
    `${pageHeader(T("Teacher and student pathways · no account required", "Rutas para docentes y estudiantes · no se necesita cuenta"), T("Choose a way to read", "Elija una forma de leer"), `<p>${T("Use one lesson for a gradual-release sequence, a whole-class read, independent practice, a focused small group, or a conference. Work and notes stay in this browser.", "Use una lección para una secuencia de traspaso gradual, una lectura con toda la clase, práctica independiente, un grupo pequeño enfocado o una conferencia. El trabajo y las notas se quedan en este navegador.")}</p>`, `<label class="rr-filter rr-inline-filter">${T("Grade cluster", "Grupo de grados")} <select data-rr-workshop-cluster>${clusterOptions(cluster)}</select></label>`)}<div class="rr-books">${[
      card(
        T("Model and practice", "Modelar y practicar"),
        T("Learn, practice, then try independently", "Aprender, practicar y luego probar de forma independiente"),
        T("Start with the explicit reading move, use guided prompts, and fade supports before a fresh task.", "Comience con el paso de lectura explícito, use indicaciones guiadas y retire los apoyos antes de una tarea nueva."),
        go(`${lessonUrl(feature.id)}?mode=learn`, T("Open a modeled lesson", "Abrir una lección modelada")),
      ),
      card(
        T("Read together", "Leer juntos"),
        T("Chunked whole-class reading", "Lectura de toda la clase por partes"),
        T("Project the passage, pause at section questions, discuss evidence, and use teacher prompts.", "Proyecte el pasaje, haga pausas en las preguntas de cada sección, converse sobre la evidencia y use las indicaciones para docentes."),
        go(
          `${lessonUrl(feature.id)}?mode=together`,
          T("Open a read-together lesson", "Abrir una lección de lectura conjunta"),
        ),
      ),
      card(
        T("Independent reading", "Lectura independiente"),
        T("Practice without hints", "Práctica sin pistas"),
        T("Students choose a text, annotate, read, and check their own responses without revealing teacher models.", "Los estudiantes eligen un texto, lo anotan, lo leen y revisan sus propias respuestas sin ver los modelos del docente."),
        go(
          `${lessonUrl(feature.id)}?mode=independent`,
          T("Open an independent lesson", "Abrir una lección independiente"),
        ),
      ),
      card(
        T("Small group", "Grupo pequeño"),
        T("Plan from checked evidence", "Planificar con la evidencia comprobada"),
        T("Use observed errors to select a strategy, model it, and assign a fresh independent check.", "Use los errores observados para elegir una estrategia, modelarla y asignar una nueva comprobación independiente."),
        go(`${BASE}/reading-room/teacher`, T("Review local skill evidence", "Revisar la evidencia local de destrezas")),
      ),
      card(
        T("Reading conference", "Conferencia de lectura"),
        T("Capture a brief observation and next step", "Registrar una observación breve y el siguiente paso"),
        T("Keep observation notes on this device, tied to a lesson and instructional follow-up.", "Guarde las notas de observación en este dispositivo, vinculadas a una lección y a un seguimiento de enseñanza."),
        go(`${BASE}/reading-room/conference`, T("Open a conference note", "Abrir una nota de conferencia")),
      ),
      card(
        T("Weekly workshop", "Taller semanal"),
        T("Plan five connected days", "Planificar cinco días conectados"),
        T("Build a week around actual Reading Room texts and their objectives.", "Organice una semana en torno a los textos reales de la Sala de lectura y sus objetivos."),
        go(
          `${BASE}/reading-room/workshop?cluster=${encodeURIComponent(cluster)}`,
          T("Open the weekly plan", "Abrir el plan semanal"),
        ),
      ),
    ].join(
      "",
    )}</div><section class="rr-pathway-texts"><h2>${T("Texts for this pathway", "Textos para esta ruta")}</h2><div class="rr-books">${picks.map((l) => `<article class="rr-book"><div class="rr-book-copy"><h3><a href="${lessonUrl(l.id)}">${esc(l.title)}</a></h3><p>${esc(l.objectives.content)} · ${esc(l.objectives.language)}</p></div></article>`).join("")}</div></section>${backLink(`${BASE}/reading-room`, T("Return to the Reading Room", "Volver a la Sala de lectura"))}`,
  );
}

// [day, description, día, descripción]
const WORKSHOP_STAGES = [
  [
    "Day 1 · Prepare",
    "Connect background knowledge, introduce the essential question, and preview three useful words.",
    "Día 1 · Preparar",
    "Conectar los conocimientos previos, presentar la pregunta esencial y adelantar tres palabras útiles.",
  ],
  [
    "Day 2 · First reading",
    "Read for topic, people or concepts, sequence, and the central idea.",
    "Día 2 · Primera lectura",
    "Leer para identificar el tema, las personas o los conceptos, la secuencia y la idea central.",
  ],
  [
    "Day 3 · Investigate",
    "Reread key paragraphs, select evidence, and address a likely misconception.",
    "Día 3 · Investigar",
    "Releer párrafos clave, elegir evidencia y abordar un posible error de comprensión.",
  ],
  [
    "Day 4 · Organize and discuss",
    "Complete a lesson-linked organizer and explain how evidence supports an idea.",
    "Día 4 · Organizar y conversar",
    "Completar un organizador vinculado a la lección y explicar cómo la evidencia apoya una idea.",
  ],
  [
    "Day 5 · Transfer",
    "Complete an independent challenge and apply the same language function in a new context.",
    "Día 5 · Transferir",
    "Completar un desafío independiente y aplicar la misma función del lenguaje en un contexto nuevo.",
  ],
];

function workshopHTML(lessons) {
  const cluster = clusterParam();
  const selected = lessons
    .filter((l) => l.gradeCluster === cluster)
    .slice(0, 2);
  const move = (i) =>
    esc(
      i === 0
        ? selected[0].teacherGuide.miniLesson
        : i === 2
          ? selected[0].teacherGuide.misconception
          : selected[Math.min(i - 1, selected.length - 1)].teacherGuide
              .languageObjective,
    );
  const plan = selected.length
    ? `<section class="rr-continue rr-week"><div><p class="rr-eyebrow">${T("Week texts", "Textos de la semana")}</p>${selected.map((l) => `<h2><a href="${lessonUrl(l.id)}">${esc(l.title)}</a></h2><p>${esc(l.objectives.content)} · ${esc(l.objectives.language)}</p>`).join("")}</div></section><ol class="rr-workshop-days">${WORKSHOP_STAGES.map(([day, desc, dayEs, descEs], i) => `<li><h2>${T(day, dayEs)}</h2><p>${T(desc, descEs)}</p><p><b>${T("Teacher move:", "Acción del docente:")}</b> ${move(i)}</p><a class="rr-link" href="${lessonUrl(selected[Math.min(i < 3 ? 0 : 1, selected.length - 1)].id)}">${T("Open the lesson for this step", "Abrir la lección de este paso")} →</a></li>`).join("")}</ol><button type="button" class="rr-reset" data-rr-print>${ic("print")} ${T("Print this workshop plan", "Imprimir este plan del taller")}</button>`
    : `<p>${T("No authored lesson is available for that cluster yet.", "Todavía no hay una lección disponible para ese grupo.")}</p>`;
  return shell(
    `${pageHeader(T("Teacher planning · local content", "Planificación docente · contenido local"), T("Weekly Reading Workshop", "Taller semanal de lectura"), `<p>${T("A flexible five-day sequence built from the Reading Room’s actual lessons. Assign the full sequence or select individual days; students can still browse without signing in.", "Una secuencia flexible de cinco días basada en las lecciones reales de la Sala de lectura. Asigne la secuencia completa o elija días individuales; los estudiantes aún pueden explorar sin iniciar sesión.")}</p>`, `<label class="rr-filter rr-inline-filter">${T("Grade cluster", "Grupo de grados")} <select data-rr-workshop-cluster>${clusterOptions(cluster)}</select></label>`)}${plan}${backLink(`${BASE}/reading-room/teacher`, T("Return to teacher evidence", "Volver a la evidencia docente"))}`,
  );
}

function teacherHTML(lessons, state, stories = [], strategies = []) {
  const rows = lessons.map((l) => {
    const p = state.lessons[stateKey(l)] || {};
    const checked = Object.values(p.answers || {}).filter((a) => a.checked);
    return {
      l,
      p,
      checked,
      misses: checked.filter((a) => a.correct === false).length,
      independent: checked.filter((a) => a.mode === "independent").length,
    };
  });
  const groupNeeds = new Map();
  for (const { l, checked } of rows)
    for (const a of checked)
      if (a.correct === false) {
        const skill = a.skill || ""; // blank = the lesson item names no skill; shown as a localized fallback below
        const old = groupNeeds.get(skill) || { count: 0, lesson: l };
        old.count++;
        groupNeeds.set(skill, old);
      }
  const needs = groupNeeds.size
    ? [...groupNeeds]
        .map(
          ([skill, v]) =>
            `<article><h3>${skill ? esc(skill) : T("Revisit a checked response", "Repasar una respuesta comprobada")}</h3><p>${TH(`Evidence: ${v.count} checked miss(es) saved in <a href="${lessonUrl(v.lesson.id)}">${esc(v.lesson.title)}</a>. Revisit the linked paragraph, model the strategy, then offer a fresh independent check.`, `Evidencia: ${v.count} error(es) comprobado(s) guardado(s) en <a href="${lessonUrl(v.lesson.id)}">${esc(v.lesson.title)}</a>. Repase el párrafo vinculado, modele la estrategia y luego ofrezca una nueva comprobación independiente.`)}</p></article>`,
        )
        .join("")
    : `<p>${T("No checked misses are saved yet, so this local view has no evidence-based small-group suggestion.", "Todavía no hay errores comprobados guardados, así que esta vista local no tiene sugerencias para grupos pequeños basadas en evidencia.")}</p>`;
  const next = ({ misses, checked }, found) =>
    misses
      ? `${T("Revisit:", "Repasar:")} ${found ? esc(found) : T("the checked skill", "la destreza comprobada")}.`
      : checked.length
        ? T("Continue to a new reading.", "Pasar a una lectura nueva.")
        : T("No checked evidence saved.", "No hay evidencia comprobada guardada.");
  const adventureSummary = stories.map((story) => {
    const progress = state.adventures[story.id] || {};
    const checks = Object.values(progress.responses || {}).filter((answer) => answer.checked);
    return `<tr><th scope="row"><a href="${adventureUrl(story.id)}">${esc(story.title)}</a></th><td>${T(`${checks.length} of ${story.chapters.length}`, `${checks.length} de ${story.chapters.length}`)}</td><td>${checks.filter((answer) => answer.correct).length}</td><td>${checks.filter((answer) => !answer.correct).length}</td><td>${progress.completed ? T("Completed", "Completada") : progress.started ? T("In progress", "En progreso") : T("Not started", "Sin empezar")}</td></tr>`;
  }).join("");
  const strategySummary = strategies.map((lesson) => {
    const progress = state.strategies?.[lesson.id] || {};
    if (!progress.guided?.checked && !progress.independent?.checked) return "";
    const result = (row) => !row?.checked ? T("Not checked", "Sin comprobar") : row.correct ? T("Correct", "Correcta") : T("Revisit needed", "Hay que repasar");
    return `<tr><th scope="row">${esc(lesson.title)} · ${esc(lesson.gradeCluster)}</th><td>${strandLabel(lesson.strand)}</td><td>${result(progress.guided)}</td><td>${result(progress.independent)}</td></tr>`;
  }).join("");
  return shell(
    `${pageHeader(T("Teacher view · this device only", "Vista docente · solo este dispositivo"), T("Reading evidence", "Evidencia de lectura"), `<p>${T("These counts come only from the reading data saved in this browser. They do not sync across devices and are not WIDA scores or proficiency estimates.", "Estos conteos provienen solo de los datos de lectura guardados en este navegador. No se sincronizan entre dispositivos y no son puntajes de WIDA ni estimaciones de nivel de dominio.")}</p>`)}<p class="rr-count">${T(`${rows.filter((x) => x.p.completed).length} of ${lessons.length} authored lessons marked complete on this device.`, `${rows.filter((x) => x.p.completed).length} de ${lessons.length} lecciones marcadas como completas en este dispositivo.`)}</p><p><a class="rr-link" href="${BASE}/reading-room/workshop?cluster=6-8">${T("Open Weekly Reading Workshop", "Abrir el Taller semanal de lectura")} →</a></p><section class="rr-group-needs"><h2>${T("Small-group next steps", "Próximos pasos para grupos pequeños")}</h2>${needs}</section><div class="rr-teacher-table"><table><caption>${T("Saved reading evidence by lesson", "Evidencia de lectura guardada por lección")}</caption><thead><tr><th scope="col">${T("Lesson", "Lección")}</th><th scope="col">${T("Checked items", "Ítems comprobados")}</th><th scope="col">${T("Independent checks", "Comprobaciones independientes")}</th><th scope="col">${T("Items to revisit", "Ítems por repasar")}</th><th scope="col">${T("Next step", "Siguiente paso")}</th></tr></thead><tbody>${rows.map((r) => `<tr><th scope="row"><a href="${lessonUrl(r.l.id)}">${esc(r.l.title)}</a></th><td>${r.checked.length}</td><td>${r.independent}</td><td>${r.misses}</td><td>${next(r, r.checked.find((x) => x.correct === false)?.skill || "")}</td></tr>`).join("")}</tbody></table></div><section class="rr-teacher-table"><table><caption>${T("Reading Adventure checkpoint evidence · local counts, not mastery", "Evidencia de los puntos de control de Aventuras de lectura · conteos locales, no dominio")}</caption><thead><tr><th scope="col">${T("Adventure", "Aventura")}</th><th scope="col">${T("Checked checkpoints", "Puntos de control comprobados")}</th><th scope="col">${T("Correct keyed responses", "Respuestas clave correctas")}</th><th scope="col">${T("Responses to revisit", "Respuestas por repasar")}</th><th scope="col">${T("Progress", "Avance")}</th></tr></thead><tbody>${adventureSummary}</tbody></table><p class="rr-fine">${T("Open explanations and recaps remain private student work in this browser; this view shows only checkpoint counts. Independent editorial review is pending.", "Las explicaciones abiertas y los resúmenes siguen siendo trabajo privado del estudiante en este navegador; esta vista solo muestra conteos de los puntos de control. La revisión editorial independiente está pendiente.")}</p></section><section class="rr-teacher-table"><table><caption>${T("Reading Strategy Academy evidence · local counts", "Evidencia de la Academia de estrategias de lectura · conteos locales")}</caption><thead><tr><th scope="col">${T("Lesson", "Lección")}</th><th scope="col">${T("Strategy", "Estrategia")}</th><th scope="col">${T("Guided response", "Respuesta guiada")}</th><th scope="col">${T("Independent transfer", "Transferencia independiente")}</th></tr></thead><tbody>${strategySummary || `<tr><td colspan="4">${T("No strategy evidence is saved on this device.", "No hay evidencia de estrategias guardada en este dispositivo.")}</td></tr>`}</tbody></table><p class="rr-fine">${T("This view stores no student explanation text and does not establish mastery.", "Esta vista no guarda el texto de las explicaciones de los estudiantes y no establece dominio.")}</p></section><div class="rr-actions-row"><button type="button" class="rr-reset" data-rr-print>${ic("print")} ${T("Print this report", "Imprimir este informe")}</button><button type="button" class="rr-reset" data-rr-export>${ic("download")} ${T("Download report CSV", "Descargar informe en CSV")}</button></div><p class="rr-fine">${T("Interpretation rule: a correct supported response is not counted as an independent check. Counts are local descriptive evidence only; they do not establish mastery.", "Regla de interpretación: una respuesta correcta con apoyo no cuenta como comprobación independiente. Los conteos son solo evidencia descriptiva local; no establecen dominio.")}</p>${backLink(`${BASE}/reading-room`, T("Return to the Reading Room", "Volver a la Sala de lectura"))}`,
  );
}

function conferenceHTML(lessons, state) {
  const selectedId =
    new URLSearchParams(location.search).get("lesson") ||
    state.lastRead ||
    lessons[0]?.id;
  const selected = lessons.find((l) => l.id === selectedId) || lessons[0];
  const notes = state.conferences[selected?.id] || {};
  const fields = [
    ["strength", "Observed strength", "Fortaleza observada"],
    ["evidence", "Evidence observed in the reading or response", "Evidencia observada en la lectura o la respuesta"],
    ["support", "Scaffold or prompt used", "Andamio o indicación usada"],
    ["nextStep", "Instructional next step", "Siguiente paso de enseñanza"],
    ["followUp", "Fresh independent follow-up task", "Nueva tarea independiente de seguimiento"],
  ];
  const form = selected
    ? `<p class="rr-goals"><b>${T("Reading goal:", "Meta de lectura:")}</b> ${esc(selected.objectives.content)} <b>${T("Language goal:", "Meta de lenguaje:")}</b> ${esc(selected.objectives.language)}</p><div class="rr-organizer-grid">${fields.map(([key, label, es]) => `<label>${T(label, es)}<textarea data-rr-conference="${key}" data-lesson="${esc(selected.id)}" rows="3">${esc(notes[key] || "")}</textarea></label>`).join("")}</div><p role="status" data-rr-conference-status>${T("Notes save in this browser as you type.", "Las notas se guardan en este navegador mientras escribe.")}</p><button type="button" class="btn small" data-rr-print>${ic("print")} ${T("Print conference note", "Imprimir la nota de conferencia")}</button>`
    : `<p>${T("No reading lessons are available.", "No hay lecciones de lectura disponibles.")}</p>`;
  return shell(
    `${pageHeader(T("Teacher conference · stored on this device", "Conferencia docente · guardada en este dispositivo"), T("Reading Conference Notes", "Notas de conferencia de lectura"), `<p>${T("Capture instructional observations without adding student names or identifiers. These notes are local to this browser and are not shared or synced.", "Registre observaciones de enseñanza sin agregar nombres ni identificadores de estudiantes. Estas notas son locales de este navegador y no se comparten ni se sincronizan.")}</p>`, `<label class="rr-filter rr-inline-filter">${T("Lesson", "Lección")}<select data-rr-conference-lesson>${lessons.map((l) => `<option value="${esc(l.id)}" ${l.id === selected?.id ? "selected" : ""}>${esc(l.title)}</option>`).join("")}</select></label>`)}${form}${backLink(`${BASE}/reading-room/pathways`, T("Return to workshop pathways", "Volver a las rutas del taller"))}`,
  );
}

// ── a lesson ────────────────────────────────────────────────────────────────────────────────────────────────────────

const feedbackBox = (answer, okText, tryText, rationale) =>
  answer?.checked
    ? `<div role="status" class="feedback ${answer.correct ? "is-right" : "is-hint"}"><p class="fb-title">${ic(answer.correct ? "check" : "bulb")} ${answer.correct ? okText : tryText}</p><p>${esc(rationale)}</p></div>`
    : "";
const checkButton = (id, label) =>
  `<button type="button" class="btn btn-primary btn-domain small" data-rr-check="${esc(id)}">${label}</button>`;
const optionLabel = (input, text) =>
  `<label class="rr-option">${input}<span class="rr-option-text">${text}</span></label>`;

function activityHTML(a, progress) {
  const ans = progress.answers?.[a.id];
  if (a.type === "choice" || a.type === "connector")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend>${a.sentence ? `<p class="rr-sentence">${esc(a.sentence.replace("___", "_____"))}</p>` : ""}${a.choices.map((c) => optionLabel(`<input type="radio" name="rr-${esc(a.id)}" data-rr-answer="${esc(a.id)}" value="${esc(c.id)}" ${ans?.value === c.id ? "checked" : ""}>`, esc(c.text))).join("")}${checkButton(a.id, T("Check answer", "Revisar la respuesta"))}${feedbackBox(ans, T("That answer is supported.", "Esa respuesta tiene apoyo."), T("Look again at the text, then revise.", "Vuelve a mirar el texto y luego corrige."), a.rationale)}</fieldset>`;
  if (a.type === "multi" || a.type === "hotText")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend>${a.choices.map((c) => optionLabel(`<input type="checkbox" data-rr-multi="${esc(a.id)}" value="${esc(c.id)}" ${ans?.values?.includes(c.id) ? "checked" : ""}>`, esc(c.text))).join("")}${checkButton(a.id, T("Check selection", "Revisar la selección"))}${feedbackBox(ans, T("Your selection matches the source key.", "Tu selección coincide con la clave."), T("Compare the selected text with the task purpose, then revise.", "Compara el texto elegido con el propósito de la tarea y luego corrige."), a.rationale)}</fieldset>`;
  if (a.type === "cloze")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend><p class="rr-cloze">${a.segments.map((seg) => (seg.blank ? `<label class="rr-inline-cloze"><span class="visually-hidden">${T("Choose a word", "Elige una palabra")}</span><select data-rr-cloze="${esc(a.id)}" data-blank="${esc(seg.blank.id)}" aria-label="${A(`Word for blank ${seg.blank.id}`, `Palabra para el espacio ${seg.blank.id}`)}"><option value="">${A("Choose a word", "Elige una palabra")}</option>${seg.blank.options.map((v) => `<option value="${esc(v)}" ${ans?.values?.[seg.blank.id] === v ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>` : esc(seg.text))).join("")}</p>${checkButton(a.id, T("Check words", "Revisar las palabras"))}${feedbackBox(ans, T("The words fit the context.", "Las palabras encajan en el contexto."), T("Reread the full sentence and revise the word choice.", "Vuelve a leer la oración completa y corrige la palabra."), a.rationale)}</fieldset>`;
  if (a.type === "short")
    return `<div class="rr-question"><label for="rr-short-${esc(a.id)}">${esc(a.prompt)}</label><textarea id="rr-short-${esc(a.id)}" data-rr-response="${esc(a.id)}" rows="4">${esc(ans?.text || "")}</textarea>${a.model ? `<button type="button" class="btn small" data-rr-model="${esc(a.id)}">${T("Compare with an example", "Compara con un ejemplo")}</button><p class="rr-model" ${ans?.showModel ? "" : "hidden"}><b>${T("One possible response:", "Una respuesta posible:")}</b> ${esc(a.model)}</p>` : `<div class="rr-rubric"><b>${T("Response criteria:", "Criterios de la respuesta:")}</b><ul>${(a.rubric || a.lookFor || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul><span>${T("Open responses are practice work; automated scoring is not applied.", "Las respuestas abiertas son trabajo de práctica; no se califican automáticamente.")}</span></div>`}</div>`;
  if (a.type === "evidence")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend>${a.paragraphIds.map((pid) => optionLabel(`<input type="checkbox" data-rr-evidence="${esc(a.id)}" value="${esc(pid)}" ${ans?.values?.includes(pid) ? "checked" : ""}>`, T(`Paragraph ${pid.slice(1)}`, `Párrafo ${pid.slice(1)}`))).join("")}${checkButton(a.id, T("Check evidence", "Revisar la evidencia"))}${ans?.checked ? `<div role="status" class="feedback is-hint"><p class="fb-title">${ic("bulb")} ${T("Evidence check", "Revisión de la evidencia")}</p><p>${esc(a.rationale)}</p></div>` : ""}</fieldset>`;
  if (a.type === "order")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend>${a.items.map((item, i) => `<label class="rr-option rr-position"><span class="rr-option-text">${T(`Step ${i + 1}:`, `Paso ${i + 1}:`)} ${esc(item.text)}</span><select data-rr-structured="${esc(a.id)}" data-index="${i}" aria-label="${A(`Position for ${item.text}`, `Posición de ${item.text}`)}"><option value="">${A("Choose position", "Elige la posición")}</option>${a.items.map((_, n) => `<option value="${n}" ${ans?.values?.[i] === n ? "selected" : ""}>${n + 1}</option>`).join("")}</select></label>`).join("")}${checkButton(a.id, T("Check sequence", "Revisar la secuencia"))}${feedbackBox(ans, T("The sequence matches the passage.", "La secuencia coincide con el pasaje."), T("Return to the text and revise the order.", "Vuelve al texto y corrige el orden."), a.rationale)}</fieldset>`;
  if (a.type === "sort")
    return `<fieldset class="rr-question"><legend>${esc(a.prompt)}</legend>${a.items.map((item, i) => `<label class="rr-option rr-position"><span class="rr-option-text">${esc(item.text)}</span><select data-rr-structured="${esc(a.id)}" data-index="${i}" aria-label="${A(`Category for ${item.text}`, `Categoría de ${item.text}`)}"><option value="">${A("Choose category", "Elige la categoría")}</option>${a.categories.map((cat) => `<option value="${esc(cat)}" ${ans?.values?.[i] === cat ? "selected" : ""}>${esc(cat)}</option>`).join("")}</select></label>`).join("")}${checkButton(a.id, T("Check categories", "Revisar las categorías"))}${feedbackBox(ans, T("The categories match the passage.", "Las categorías coinciden con el pasaje."), T("Compare each choice with the paragraph about that item.", "Compara cada opción con el párrafo sobre ese elemento."), a.rationale)}</fieldset>`;
  return `<div class="rr-question"><h3>${esc(a.skill)}</h3><p>${esc(a.prompt)}</p><p>${esc(a.rationale)}</p></div>`;
}

function paragraphHTML(l, p, i, state, progress) {
  const mark =
    state.annotations[`${l.id}@${l.revision}:${p.id}`]?.category || "";
  const isPlace = progress.position === p.id;
  return `<article class="rr-paragraph ${isPlace ? "is-place" : ""}" id="${esc(p.id)}" ${mark ? `data-mark="${esc(mark)}"` : ""}>
    <span class="rr-paranum" aria-hidden="true">${i + 1}</span>
    <div class="rr-para-body">
      ${mark || isPlace ? `<p class="rr-para-flags">${mark ? `<span class="rr-flag">${ic("pin")} ${markLabel(mark)}</span>` : ""}${isPlace ? `<span class="rr-flag rr-flag-place">${ic("bookmark")} ${T("Saved place", "Lugar guardado")}</span>` : ""}</p>` : ""}
      <p class="rr-para-text">${esc(p.text)}</p>
      ${activeMode === "independent" ? "" : `<p class="rr-guide">${ic("bulb")}<span><b>${T("Pause and notice:", "Haz una pausa y observa:")}</b> ${p.guidingQuestion ? esc(p.guidingQuestion) : T("What is important in this section?", "¿Qué es importante en esta sección?")}</span></p>`}
      <div class="rr-margin">
        <div class="rr-paragraph-tools"><label>${T("Mark this paragraph", "Marca este párrafo")}<select data-rr-mark="${esc(l.id)}" data-rr-revision="${esc(l.revision)}" data-rr-paragraph="${esc(p.id)}"><option value="">${A("Choose a reading mark", "Elige una marca de lectura")}</option>${MARKS.map(([c, es]) => `<option value="${c}" ${mark === c ? "selected" : ""}>${A(c, es)}</option>`).join("")}</select></label><button type="button" class="btn small" data-rr-position="${esc(p.id)}">${ic("bookmark")} ${T("Save reading place", "Guardar el lugar de lectura")}</button></div>
        <label class="rr-annotation">${T(`Your note for paragraph ${i + 1}`, `Tu nota del párrafo ${i + 1}`)}<textarea data-rr-note="${esc(p.id)}" data-rr-lesson="${esc(l.id)}" rows="2">${esc(progress.notes?.[p.id] || "")}</textarea></label>
      </div>
    </div></article>`;
}

function visualBlockHTML(l) {
  if (l.table)
    return `<figure class="rr-data-visual"><figcaption>${ic("grid")} ${esc(l.table.caption)}</figcaption><div class="rr-teacher-table"><table><thead><tr>${l.table.headers.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${l.table.rows.map((row) => `<tr>${row.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></div><p class="rr-figure-note">${esc(l.table.description)}</p></figure>`;
  if (l.map)
    return `<figure class="rr-data-visual"><figcaption>${ic("pin")} ${esc(l.map.caption)}</figcaption><ol class="rr-map-key">${l.map.items.map((x) => `<li><b>${esc(x.label)}</b> — ${esc(x.symbol)}</li>`).join("")}</ol><p class="rr-figure-note">${esc(l.map.description)}</p></figure>`;
  return "";
}

function displayControls(state) {
  const spacing = Number(state.settings.lineSpacing) || 1.75;
  const rate = String(Number(state.settings.speechRate) || 0.95);
  const tts = canSpeak()
    ? `<div class="rr-audio-controls"><span>${T("Optional device voice; the passage text remains the transcript.", "Voz opcional del dispositivo; el texto del pasaje sigue siendo la transcripción.")}</span><button type="button" class="btn small" data-rr-listen="play">${ic("play")} ${T("Read passage aloud", "Leer el pasaje en voz alta")}</button><button type="button" class="btn small" data-rr-listen="stop">${ic("stop")} ${T("Stop audio", "Detener el audio")}</button><label>${T("Speech pace", "Ritmo de la voz")}<select data-rr-setting="speechRate">${SPEECH_RATES.map(([v, label, es]) => `<option value="${v}" ${Number(v) === Number(rate) ? "selected" : ""}>${A(label, es)}</option>`).join("")}</select></label></div>`
    : `<p class="rr-audio-note">${T("Read-aloud is not available in this browser. The full passage is displayed as text.", "La lectura en voz alta no está disponible en este navegador. El pasaje completo se muestra como texto.")}</p>`;
  return `<div class="rr-display"><label>${ic("text-size")} ${T("Text size", "Tamaño del texto")} <input type="range" min="0.9" max="1.3" step="0.1" value="${state.settings.fontScale}" data-rr-setting="fontScale"></label><label>${T("Line spacing", "Espacio entre líneas")} <select data-rr-setting="lineSpacing">${LINE_SPACINGS.map(([v, label, es]) => `<option value="${v}" ${Number(v) === spacing ? "selected" : ""}>${A(label, es)}</option>`).join("")}</select></label></div>${tts}`;
}

const MODE_NAMES = {
  learn: ["Learn", "Aprender"],
  practice: ["Practice", "Practicar"],
  independent: ["Independent challenge", "Desafío independiente"],
  together: ["Read together", "Leer juntos"],
};

function modeNoteHTML(l) {
  if (activeMode === "learn")
    return `<section class="rr-mode-note"><h2>${T("Model the reading move", "Modela el paso de lectura")}</h2><p>${esc(l.teacherGuide.miniLesson)}</p><p><b>${T("One possible response:", "Una respuesta posible:")}</b> ${esc(l.teacherGuide.modelResponse)}</p></section>`;
  if (activeMode === "independent")
    return `<section class="rr-mode-note"><h2>${T("Independent challenge", "Desafío independiente")}</h2><p>${T("Use the passage and your own notes. Vocabulary previews, paragraph questions, and models are hidden. This records local practice evidence, not a proficiency score.", "Usa el pasaje y tus propias notas. Las vistas previas de vocabulario, las preguntas de los párrafos y los modelos están ocultos. Esto guarda evidencia local de práctica, no un puntaje de dominio.")}</p></section>`;
  return `<section class="rr-mode-note"><h2>${T("Practice with support", "Practica con apoyo")}</h2><p>${T("Use the vocabulary, paragraph questions, and notes as you reread. Revise after feedback.", "Usa el vocabulario, las preguntas de los párrafos y las notas mientras vuelves a leer. Corrige después de ver los comentarios.")}</p></section>`;
}

function vocabularyHTML(l) {
  return `<section class="rr-vocabulary"><h2>${ic("language")} ${T("Words to notice", "Palabras para notar")}</h2><p class="rr-fine">${T("Optional support. Open a word for its meaning in this text.", "Apoyo opcional. Abre una palabra para ver su significado en este texto.")}</p><div class="rr-vocab-list">${l.vocabulary.map((v) => `<details class="rr-vocab"><summary><strong>${esc(v.term)}</strong><span>${esc(v.definition)}</span></summary><p><b>${T("In this text:", "En este texto:")}</b> ${esc(v.example)}${v.spanish ? ` <span lang="es">· ${esc(v.spanish)}</span>` : ""}</p><button type="button" class="btn small" data-rr-word="${esc(v.term)}" data-rr-lesson="${esc(l.id)}">${T("Save to Word Notebook", "Guardar en el Cuaderno de palabras")}</button></details>`).join("")}</div></section>`;
}

function workspaceHTML(l, progress) {
  const phases = [
    { id: "first", label: T("1 · Understand", "1 · Comprender") },
    { id: "second", label: T("2 · Investigate", "2 · Investigar") },
    { id: "third", label: T("3 · Apply", "3 · Aplicar") },
  ];
  const items = l.activities.filter((a) => a.phase === activePhase);
  const activities = items.map((a) => activityHTML(a, progress)).join("");
  const phaseNote =
    activePhase === "first"
      ? T("Build a first understanding", "Construye una primera comprensión")
      : activePhase === "second"
        ? T("Return for evidence", "Vuelve para buscar evidencia")
        : T("Apply the thinking", "Aplica lo que pensaste");
  return `<aside class="rr-workspace" aria-label="${A("Your response", "Tu respuesta")}"><p class="rr-workspace-label">${ic("writing")} ${T("Your response", "Tu respuesta")}</p><div class="rr-phase" role="tablist" aria-label="${A("Reading sequence", "Secuencia de lectura")}">${phases.map((p) => `<button type="button" role="tab" aria-selected="${activePhase === p.id}" data-rr-phase="${p.id}">${p.label}</button>`).join("")}</div><p class="rr-eyebrow">${phaseNote}</p><h2>${esc(l.objectives.language)}</h2>${activities || `<p>${T("This section is a rereading and reflection pause. Use your notes to explain what changed in your understanding.", "Esta sección es una pausa para volver a leer y reflexionar. Usa tus notas para explicar qué cambió en tu comprensión.")}</p>`}${
    activeMode !== "independent"
      ? `<div class="rr-teacher"><details><summary>${T("Teacher guide", "Guía para docentes")}</summary><p><b>${T("Mini-lesson:", "Minilección:")}</b> ${esc(l.teacherGuide.miniLesson)}</p><p><b>${T("Misconception to watch:", "Error de comprensión que vigilar:")}</b> ${esc(l.teacherGuide.misconception)}</p><ul>${l.teacherGuide.discussion.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p><b>${T("Model response:", "Respuesta modelo:")}</b> ${esc(l.teacherGuide.modelResponse)}</p></details><details><summary>${T("Family reading · 10–15 minutes", "Lectura en familia · 10–15 minutos")}</summary><p>${esc(l.familySupport.directions.en)}</p><p lang="es">${esc(l.familySupport.directions.es)}</p><p>${esc(l.familySupport.noEnglishRequired)}</p></details></div>${renderOrganizers(l.id, progress)}`
      : ""
  }<label class="rr-reflection">${T("My reflection", "Mi reflexión")}<textarea data-rr-reflection="${esc(l.id)}" rows="3">${esc(progress.reflection || "")}</textarea></label><button type="button" class="btn btn-primary btn-domain rr-button" data-rr-complete="${esc(l.id)}">${T("Save lesson progress", "Guardar el avance de la lección")}</button><p role="status" class="rr-status">${progress.completed ? T("Progress saved on this device.", "Avance guardado en este dispositivo.") : T("Your notes and answers save in this browser.", "Tus notas y respuestas se guardan en este navegador.")}</p></aside>`;
}

async function lessonHTML(ctx, l, state) {
  const linkedActivity = l.connections?.relatedActivity
    ? await findActivity(l.connections.relatedActivity).catch(() => null)
    : null;
  const relatedHref = linkedActivity
    ? `${BASE}/${encodeURIComponent(linkedActivity.domain)}/${encodeURIComponent(linkedActivity.level)}/${encodeURIComponent(linkedActivity.activity.id)}?grades=${encodeURIComponent(linkedActivity.band)}`
    : "";
  const key = stateKey(l);
  const progress = state.lessons[key] || {
    started: true,
    answers: {},
    notes: {},
    phase: "first",
    assisted: false,
  };
  const requestedMode = new URLSearchParams(location.search).get("mode");
  if (["learn", "practice", "independent", "together"].includes(requestedMode))
    activeMode = requestedMode;
  progress.started = true;
  progress.lastOpened = new Date().toISOString();
  progress.phase ||= "first";
  state.lastRead = l.id;
  state.recent = [l.id, ...state.recent.filter((x) => x !== l.id)].slice(0, 30);
  state.lessons[key] = progress;
  saveReadingState(state);
  if (openedLessonId !== l.id) {
    openedLessonId = l.id;
    if (progress.position)
      requestAnimationFrame(() =>
        document
          .getElementById(progress.position)
          ?.scrollIntoView({ block: "start" }),
      );
  }
  const modeControls = `<div class="rr-mode-controls" role="group" aria-label="${A("Reading mode", "Modo de lectura")}">${Object.entries(
    MODE_NAMES,
  )
    .map(
      ([value, [label, es]]) =>
        `<button type="button" data-rr-mode="${value}" aria-pressed="${activeMode === value}">${T(label, es)}</button>`,
    )
    .join("")}</div>`;
  const paragraphs = l.paragraphs
    .map((p, i) => paragraphHTML(l, p, i, state, progress))
    .join("");
  const links = `<div class="rr-actions">${relatedHref ? `<a href="${relatedHref}">${T("Related Reading practice", "Práctica de lectura relacionada")} →</a>` : ""}<a href="${BASE}/write?grades=${esc(ctx.band)}">${T("Write about a text", "Escribe sobre un texto")} →</a><a href="${BASE}/speak?grades=${esc(ctx.band)}">${T("Speak about a text", "Habla sobre un texto")} →</a><a href="${BASE}/vocabulary?grades=${esc(ctx.band)}">${T("Practice academic words", "Practica palabras académicas")} →</a></div>`;
  return `<section class="rr-shell rr-reader d-reading"><nav class="rr-back"><a href="${BASE}/reading-room">${ic("arrow-left")} ${T("Reading shelf", "Estante de lectura")}</a><span>${gradeLabel(l)} · ${esc(l.subject)} · ${l.minutes} min</span><button type="button" class="btn small" data-rr-bookmark="${esc(l.id)}">${ic("bookmark")} ${state.bookmarks.includes(l.id) ? T("Bookmarked", "Con marcador") : T("Bookmark", "Marcador")}</button></nav>
    <header class="rr-title"><p class="rr-eyebrow">${esc(l.genre)} · ${esc(l.keyUse)} · ${esc(l.eldStandard)}</p><h1>${esc(l.title)}</h1><p class="rr-lead">${esc(l.summary)}</p><div class="rr-objectives"><div><b>${T("Content goal", "Meta de contenido")}</b><span>${esc(l.objectives.content)}</span></div><div><b>${T("Language goal", "Meta de lenguaje")}</b><span>${esc(l.objectives.language)}</span></div></div><p class="rr-alignment">${ic("info")} <span>${esc(l.alignmentStatus)} ${TH("Independent editorial review is pending for this lesson package. This is original instructional practice, not an official WIDA assessment or score prediction. ", "La revisión editorial independiente de este paquete de lección está pendiente. Esta es práctica didáctica original, no una evaluación oficial de WIDA ni una predicción de puntajes. ")}<a href="https://wida.wisc.edu/assess/access/preparing-students" target="_blank" rel="noreferrer">${T("Official WIDA test familiarization resources", "Recursos oficiales de WIDA para familiarizarse con la prueba")}</a></span></p></header>
    ${modeControls}${modeNoteHTML(l)}
    <div class="rr-layout"><section class="rr-text" aria-label="${A("Reading passage", "Pasaje de lectura")}">${displayControls(state)}<section class="rr-before"><h2>${T("Before you read", "Antes de leer")}</h2><p><b>${T("Essential question:", "Pregunta esencial:")}</b> ${esc(l.beforeReading.essentialQuestion)}</p><p>${esc(l.beforeReading.background)} ${esc(l.beforeReading.hook)}</p><p><b>${T("Read to find out:", "Lee para descubrir:")}</b> ${esc(l.beforeReading.purpose)}</p></section>${visualBlockHTML(l)}${activeMode === "independent" ? "" : vocabularyHTML(l)}<div class="rr-passage" style="--rr-font:${Number(state.settings.fontScale) || 1};--rr-leading:${Number(state.settings.lineSpacing) || 1.75}">${paragraphs}</div>${links}</section>${workspaceHTML(l, progress)}</div></section>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  setComponentsI18n(I);
  const data = await loadReadingRoomLessons();
  const lessons = data.lessons || [];
  const state = loadReadingState();
  const id = ctx.route.id;
  if (!id)
    return { title: I.S("Reading Room", "Sala de lectura"), html: raw(shelfHTML(ctx, lessons, state)) };
  if (id === "adventures") {
    const { stories = [] } = await loadReadingAdventures();
    return { title: I.S("Reading Adventures", "Aventuras de lectura"), html: raw(adventuresHTML(stories, state)) };
  }
  if (id === "strategies") {
    const data = await loadReadingStrategies();
    return { title: I.S("Reading Strategy Academy", "Academia de estrategias de lectura"), html: raw(strategiesHTML(data, state)) };
  }
  if (id.startsWith("strategy-")) {
    const data = await loadReadingStrategies();
    const lesson = data.lessons.find((item) => item.id === id.slice("strategy-".length));
    if (lesson) return { title: lesson.title, html: raw(strategyLessonHTML(lesson, state)) };
  }
  if (id.startsWith("adventure-")) {
    const { stories = [] } = await loadReadingAdventures();
    const story = stories.find((item) => item.id === id.slice("adventure-".length));
    if (story) return { title: story.title, html: raw(adventureHTML(story, state)) };
  }
  if (id === "family")
    return { title: I.S("Family Reading", "Lectura en familia"), html: raw(familyHTML(lessons)) };
  if (id === "words")
    return { title: I.S("Reading Word Notebook", "Cuaderno de palabras de lectura"), html: raw(wordsHTML(state)) };
  if (id === "pathways")
    return {
      title: I.S("Reading Workshop Pathways", "Rutas del taller de lectura"),
      html: raw(pathwaysHTML(lessons)),
    };
  if (id === "workshop")
    return {
      title: I.S("Weekly Reading Workshop", "Taller semanal de lectura"),
      html: raw(workshopHTML(lessons)),
    };
  if (id === "teacher")
    return {
      title: I.S("Reading Progress · Local", "Avance en lectura · Local"),
      html: raw(teacherHTML(lessons, state, (await loadReadingAdventures()).stories || [], (await loadReadingStrategies()).lessons || [])),
    };
  if (id === "conference")
    return {
      title: I.S("Reading Conference · Local", "Conferencia de lectura · Local"),
      html: raw(conferenceHTML(lessons, state)),
    };
  const l = lessons.find((x) => x.id === id);
  if (!l)
    return {
      title: I.S("Reading not found", "No se encontró la lectura"),
      html: raw(
        `<section class="rr-shell"><p>${T("This text could not be found.", "No se pudo encontrar este texto.")}</p><a href="${BASE}/reading-room">${T("Return to the Reading Room", "Volver a la Sala de lectura")}</a></section>`,
      ),
    };
  return { title: l.title, html: raw(await lessonHTML(ctx, l, state)) };
}
export function onInput(e, ctx) {
  const el=e.target;
  if (el.matches("[data-strategy-explanation]")) {
    const current = loadReadingState();
    const lessonId = ctx.route.id.slice("strategy-".length);
    const saved = current.strategies[lessonId] || {};
    const stage = el.dataset.strategyExplanation;
    saved[stage] = { ...(saved[stage] || {}), explanation: el.value, updatedAt: new Date().toISOString() };
    current.strategies[lessonId] = saved; saveReadingState(current);
    const choice = document.querySelector(`[data-strategy-choice="${stage}"]:checked`);
    const check = document.querySelector(`[data-strategy-check="${stage}"]`);
    if (check) check.disabled = !choice || !el.value.trim();
  }
  if (el.matches("[data-rr-search]")) { query=el.value; ctx.rerender(); }
  if (el.matches("[data-adv-response]")) {
    const s = loadReadingState();
    const storyId = ctx.route.id.slice("adventure-".length);
    const current = s.adventures[storyId] || { chapter: 0, responses: {} };
    const chapter = Math.min(Math.max(0, Number(current.chapter) || 0), 5);
    current.started = true;
    current.responses = { ...(current.responses || {}), [chapter]: { ...(current.responses?.[chapter] || {}), [el.dataset.advResponse]: el.value, updatedAt: new Date().toISOString() } };
    s.adventures[storyId] = current;
    saveReadingState(s);
  }
  if (el.matches("[data-rr-note],[data-rr-reflection]")) saveField(el);
  if(el.matches("[data-rr-conference]"))saveConference(el);
  if (el.matches("[data-rr-response]")) saveAnswer(el.dataset.rrResponse,{text:el.value});
  if (el.matches("[data-rr-organizer]")) saveOrganizer(el);
}
export function onChange(e,ctx) {
  I = i18nFor(ctx);
  const el=e.target; if(el.matches("[data-rr-grade]")){grade=el.value;ctx.rerender();}
  if (el.matches("[data-strategy-strand],[data-strategy-cluster]")) {
    const params = new URLSearchParams(location.search);
    params.set(el.matches("[data-strategy-strand]") ? "strand" : "cluster", el.value);
    ctx.navigate(`${BASE}/reading-room/strategies?${params.toString()}`);
  }
  if (el.matches("[data-strategy-choice]")) {
    const stage = el.dataset.strategyChoice;
    const current = loadReadingState();
    const lessonId = ctx.route.id.slice("strategy-".length);
    const lesson = current.strategies[lessonId] || {};
    lesson[stage] = { ...(lesson[stage] || {}), selected: Number(el.value), checked: false, updatedAt: new Date().toISOString() };
    current.strategies[lessonId] = lesson; saveReadingState(current);
    ctx.rerender();
  }
  if (el.matches("input[name=adv-answer]")) {
    const s = loadReadingState();
    const storyId = ctx.route.id.slice("adventure-".length);
    const current = s.adventures[storyId] || { chapter: 0, responses: {} };
    const chapter = Math.min(Math.max(0, Number(current.chapter) || 0), 5);
    current.started = true;
    current.responses = { ...(current.responses || {}), [chapter]: { ...(current.responses?.[chapter] || {}), answer: Number(el.value), checked: false, updatedAt: new Date().toISOString() } };
    s.adventures[storyId] = current;
    saveReadingState(s);
    ctx.rerender();
  }
  if(el.matches("[data-rr-genre]")){genreFilter=el.value;ctx.rerender();}
  if(el.matches("[data-rr-mark]")){const s=loadReadingState(),meta=`${el.dataset.rrMark}@${el.dataset.rrRevision}:${el.dataset.rrParagraph}`;if(el.value)s.annotations[meta]={category:el.value};else delete s.annotations[meta];saveReadingState(s);}
  if(el.matches("[data-rr-workshop-cluster]")){const target=ctx.route.id==="pathways"?"pathways":"workshop";ctx.navigate(`${BASE}/reading-room/${target}?cluster=${encodeURIComponent(el.value)}&grades=${encodeURIComponent(ctx.band)}`);}
  if(el.matches("[data-rr-length]")){lengthFilter=el.value;ctx.rerender();}
  if(el.matches("[data-rr-conference-lesson]"))ctx.navigate(`${BASE}/reading-room/conference?lesson=${encodeURIComponent(el.value)}`);
  if(el.matches("[data-rr-setting]")){const s=loadReadingState();s.settings[el.dataset.rrSetting]=el.value;saveReadingState(s);ctx.rerender();}
  if(el.matches("[data-rr-answer]")) saveAnswer(el.dataset.rrAnswer,{value:el.value});
  if(el.matches("[data-rr-multi]")){const s=loadReadingState(),key=Object.keys(s.lessons).find(k=>k.startsWith(`${ctx.route.id}@`)),p=s.lessons[key]||{},a=p.answers||{},row=a[el.dataset.rrMulti]||{values:[]};row.values=[...document.querySelectorAll(`[data-rr-multi="${el.dataset.rrMulti}"]:checked`)].map(x=>x.value);a[el.dataset.rrMulti]=row;p.answers=a;s.lessons[key]=p;saveReadingState(s);}
  if(el.matches("[data-rr-cloze]")){const s=loadReadingState(),key=Object.keys(s.lessons).find(k=>k.startsWith(`${ctx.route.id}@`)),p=s.lessons[key]||{},a=p.answers||{},row=a[el.dataset.rrCloze]||{values:{}};row.values={...(row.values||{}),[el.dataset.blank]:el.value};a[el.dataset.rrCloze]=row;p.answers=a;s.lessons[key]=p;saveReadingState(s);}
  if(el.matches("[data-rr-structured]")){const s=loadReadingState(),key=Object.keys(s.lessons).find(k=>k.startsWith(`${ctx.route.id}@`)),p=s.lessons[key]||{},a=p.answers||{},id=el.dataset.rrStructured,row=a[id]||{values:[]};row.values=Array.from(document.querySelectorAll(`[data-rr-structured="${id}"]`)).map(x=>x.value===""?null:(Number.isNaN(Number(x.value))?x.value:Number(x.value)));a[id]=row;p.answers=a;s.lessons[key]=p;saveReadingState(s);}
  if(el.matches("[data-rr-evidence]")){const s=loadReadingState(), key=`${ctx.route.id}@1.0.0`,p=s.lessons[key]||{},a=p.answers||{},row=a[el.dataset.rrEvidence]||{values:[]};row.values=[...document.querySelectorAll(`[data-rr-evidence="${el.dataset.rrEvidence}"]:checked`)].map(x=>x.value);a[el.dataset.rrEvidence]=row;p.answers=a;s.lessons[key]=p;saveReadingState(s);}
}
function saveOrganizer(el){const s=loadReadingState(),id=el.dataset.rrLesson,key=Object.keys(s.lessons).find(k=>k.startsWith(`${id}@`))||`${id}@1.0.0`,p=s.lessons[key]||{};p.organizer={...(p.organizer||{}),[el.dataset.rrOrganizer]:el.value};s.lessons[key]=p;saveReadingState(s);}
function saveConference(el){const s=loadReadingState(),id=el.dataset.lesson;s.conferences={...(s.conferences||{}),[id]:{...(s.conferences?.[id]||{}),[el.dataset.rrConference]:el.value,updatedAt:new Date().toISOString()}};saveReadingState(s);}
function saveField(el){const s=loadReadingState(),id=el.dataset.rrLesson||el.dataset.rrReflection,key=Object.keys(s.lessons).find(k=>k.startsWith(`${id}@`))||`${id}@1.0.0`,p=s.lessons[key]||{};if(el.dataset.rrNote){p.notes={...(p.notes||{}),[el.dataset.rrNote]:el.value};}else p.reflection=el.value;s.lessons[key]=p;saveReadingState(s);}
function saveAnswer(id,patch){const s=loadReadingState(),key=Object.keys(s.lessons).find(k=>k.startsWith(`${location.pathname.split("/").pop()}@`)),p=s.lessons[key]||{},a=p.answers||{};a[id]={...(a[id]||{}),...patch};p.answers=a;s.lessons[key]=p;saveReadingState(s);}
export function onClick(e,ctx){I=i18nFor(ctx);const b=e.target.closest("button");if(!b)return false;const s=loadReadingState(),id=ctx.route.id,key=Object.keys(s.lessons).find(k=>k.startsWith(`${id}@`)),p=s.lessons[key]||{answers:{}};
  if (b.dataset.strategyRetry) {
    const lessonId = id.slice("strategy-".length), saved = s.strategies[lessonId] || {};
    saved[b.dataset.strategyRetry] = { ...(saved[b.dataset.strategyRetry] || {}), checked: false };
    s.strategies[lessonId] = saved; saveReadingState(s); ctx.rerender(); return true;
  }
  if (b.dataset.strategyCheck) {
    const stage = b.dataset.strategyCheck, lessonId = id.slice("strategy-".length);
    loadReadingStrategies().then(({ lessons = [] }) => {
      const lesson = lessons.find((row) => row.id === lessonId);
      if (!lesson) return;
      const current = loadReadingState(), saved = current.strategies[lessonId] || {}, response = saved[stage] || {};
      if (response.selected == null || !response.explanation?.trim() || (response.checked && response.correct)) return;
      const correct = response.selected === lesson[stage].answer;
      saved[stage] = { ...response, checked: true, correct, checkedAt: new Date().toISOString() };
      current.strategies[lessonId] = saved; saveReadingState(current); ctx.rerender();
      const evidenceId = `reading-strategy:${lessonId}:${stage}`;
      const ledger = loadLedger();
      if (!ledger.entries.some((entry) => entry.id === evidenceId)) {
        appendEntry(ledger, { id: evidenceId, src: "item", task: evidenceId, band: lesson.gradeCluster, domain: "Reading", stage: stage === "independent" ? "independent" : "guided", kind: "first", supports: stage === "guided" ? { model: true } : {}, m: { questions: [{ skill: lesson.skill, ok: correct, questionId: `${lessonId}-${stage}`, responseId: evidenceId }] } });
        saveLedger(ledger);
      }
    });
    return true;
  }
  if (b.dataset.advNav != null) {
    const storyId = id.slice("adventure-".length), current = s.adventures[storyId] || { responses: {} };
    current.started = true; current.chapter = Math.max(0, Math.min(5, Number(b.dataset.advNav)));
    s.adventures[storyId] = current; saveReadingState(s); ctx.rerender(); return true;
  }
  if (b.dataset.advListen === "stop") { stopSpeech(); return true; }
  if (b.dataset.advListen === "play") {
    loadReadingAdventures().then(({ stories = [] }) => {
      const story = stories.find((item) => item.id === id.slice("adventure-".length));
      const chapter = s.adventures[story?.id]?.chapter || 0;
      if (story) return speak(story.chapters[chapter].paragraphs, { lang: "en-US", rate: Number(s.settings.speechRate) || 0.95 });
    });
    return true;
  }
  if (b.dataset.advCheck != null) {
    loadReadingAdventures().then(({ stories = [] }) => {
      const story = stories.find((item) => item.id === id.slice("adventure-".length));
      if (!story) return;
      const current = loadReadingState(), saved = current.adventures[story.id] || { chapter: 0, responses: {} };
      const chapter = Number(b.dataset.advCheck), response = saved.responses?.[chapter] || {};
      if (response.answer == null) return;
      const correct = response.answer === story.chapters[chapter].question.answer;
      saved.responses = { ...saved.responses, [chapter]: { ...response, checked: true, correct, checkedAt: new Date().toISOString() } };
      current.adventures[story.id] = saved; saveReadingState(current); ctx.rerender();
      const ledgerId = `reading-adventure:${story.id}:chapter-${chapter + 1}`;
      const ledger = loadLedger();
      if (!ledger.entries.some((entry) => entry.id === ledgerId)) {
        appendEntry(ledger, { id: ledgerId, src: "item", task: ledgerId, band: story.gradeCluster, domain: "Reading", use: story.keyUse, stage: "independent", kind: "first", supports: {}, m: { questions: [{ skill: story.skill, ok: correct, questionId: `chapter-${chapter + 1}-checkpoint`, responseId: ledgerId }] } });
        saveLedger(ledger);
      }
    });
    return true;
  }
  if (b.hasAttribute("data-adv-complete")) {
    const storyId = id.slice("adventure-".length), current = s.adventures[storyId] || {};
    current.completed = true; current.completedAt = new Date().toISOString();
    s.adventures[storyId] = current; saveReadingState(s); ctx.rerender(); return true;
  }
  if(b.hasAttribute("data-rr-bookmark-filter")){onlyBookmarks=!onlyBookmarks;ctx.rerender();return true;}
  if(b.dataset.rrPhase){activePhase=b.dataset.rrPhase;ctx.rerender();return true;}
  if(b.dataset.rrPrint){window.print();return true;}
  if(b.hasAttribute("data-rr-export")){loadReadingRoomLessons().then(data=>{const quote=v=>`"${String(v??"").replaceAll('"','""')}"`;const lines=[["lesson_id","title","completed_on_device","checked_items","independent_checks","misses_to_revisit","skills_to_revisit"]];for(const l of data.lessons){const p=s.lessons[`${l.id}@${l.revision}`]||{},answers=Object.values(p.answers||{}).filter(a=>a.checked),independent=answers.filter(a=>a.mode==="independent").length,misses=answers.filter(a=>a.correct===false);lines.push([l.id,l.title,p.completed?"yes":"no",answers.length,independent,misses.length,[...new Set(misses.map(a=>a.skill||"checked skill"))].join("; ")]);}const csv=lines.map(row=>row.map(quote).join(",")).join("\r\n"),blob=new Blob(["\ufeff",csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="reading-room-local-progress.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});return true;}
  if(b.dataset.rrMode){activeMode=b.dataset.rrMode;ctx.rerender();return true;}
  if(b.dataset.rrPosition){const k=Object.keys(s.lessons).find(x=>x.startsWith(`${id}@`));if(k){s.lessons[k]={...(s.lessons[k]||{}),position:b.dataset.rrPosition};saveReadingState(s);ctx.rerender();}return true;}
  if(b.dataset.rrListen === "stop"){stopSpeech();return true;}
  if(b.dataset.rrListen === "play"){loadReadingRoomLessons().then(data=>{const lesson=data.lessons.find(x=>x.id===ctx.route.id);return speak(lesson.paragraphs.map(x=>x.text),{lang:"en-US",rate:Number(loadReadingState().settings.speechRate)||0.95});});return true;}
  if(b.dataset.rrRemoveWord){s.words.splice(Number(b.dataset.rrRemoveWord),1);saveReadingState(s);ctx.rerender();return true;}
  if(b.dataset.rrBookmark){s.bookmarks=s.bookmarks.includes(id)?s.bookmarks.filter(x=>x!==id):[...s.bookmarks,id];saveReadingState(s);ctx.rerender();return true;}
  if(b.dataset.rrAction==="clear"){clearReadingState();notice=I.S("Local Reading Room data cleared.","Se borraron los datos locales de la Sala de lectura.");ctx.rerender();return true;}
  if(b.dataset.rrWord){const lword=document.querySelector(`[data-rr-word="${CSS.escape(b.dataset.rrWord)}"]`);if(lword){const lessonId=b.dataset.rrLesson;const d=lessonId;loadReadingRoomLessons().then(data=>{const lesson=data.lessons.find(x=>x.id===d),v=lesson?.vocabulary.find(x=>x.term===b.dataset.rrWord);const st=loadReadingState();if(v&&!st.words.some(w=>w.term===v.term&&w.lessonId===d))st.words.push({term:v.term,definition:v.definition,example:v.example,lessonId:d});saveReadingState(st);b.textContent=I.S("Saved to Word Notebook","Guardado en el Cuaderno de palabras");});}return true;}
  if(b.dataset.rrCheck){const lessonPromise=loadReadingRoomLessons();lessonPromise.then(data=>{const l=data.lessons.find(x=>x.id===id),a=l.activities.find(x=>x.id===b.dataset.rrCheck),ans=p.answers?.[a.id]||{};let correct=false;if(a.type==='choice'||a.type==='connector')correct=ans.value===a.answerId;else if(a.type==='multi'||a.type==='hotText')correct=JSON.stringify([...(ans.values||[])].sort())===JSON.stringify([...(a.answerIds||[])].sort());else if(a.type==='cloze')correct=Object.entries(Object.fromEntries(a.segments.filter(x=>x.blank).map(x=>[x.blank.id,x.blank.answer]))).every(([blank,answer])=>ans.values?.[blank]===answer);else if(a.type==='evidence')correct=JSON.stringify([...(ans.values||[])].sort())===JSON.stringify([...a.answerIds].sort());else if(a.type==='order')correct=JSON.stringify(ans.values||[])===JSON.stringify(a.items.map(x=>a.answerOrder.indexOf(x.id)));else if(a.type==='sort')correct=JSON.stringify(ans.values||[])===JSON.stringify(a.items.map(x=>x.answer));p.answers={...(p.answers||{}),[a.id]:{...ans,checked:true,correct,attempts:(ans.attempts||0)+1,mode:activeMode,skill:a.skill}};s.lessons[key]=p;saveReadingState(s);ctx.rerender();});return true;}
  if(b.dataset.rrModel){p.answers={...(p.answers||{}),[b.dataset.rrModel]:{...(p.answers?.[b.dataset.rrModel]||{}),showModel:true}};s.lessons[key]=p;saveReadingState(s);ctx.rerender();return true;}
  if(b.dataset.rrComplete){p.completed=true;p.phase=activePhase;s.lessons[key]=p;saveReadingState(s);ctx.rerender();return true;}
  return false;
}
