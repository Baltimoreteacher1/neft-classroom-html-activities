// Cross-curricular reading investigations. Original content, device-local work, traceable ledger evidence.
import { i18nFor } from "../i18n.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { BASE, html, safeJson, storage, wordCount } from "../util.js";
import { ECOSYSTEM_SEQUENCE, READING_BY_ID, READINGS } from "./content.js";

export const KEY = "accessPracticeLab:v1:subjectReading";
const blank = () => ({ v: 1, readings: {} });
const isObj = (value) => value && typeof value === "object" && !Array.isArray(value);
const limit = (value, max = 4000) => (typeof value === "string" ? value.slice(0, max) : "");

export function loadSubjectReading(read = (key) => storage.get(key)) {
  const raw = safeJson(read(KEY), null);
  if (raw?.v !== 1 || !isObj(raw.readings)) return blank();
  const readings = {};
  for (const [id, value] of Object.entries(raw.readings)) {
    const passage = READING_BY_ID[id];
    if (!passage || !isObj(value)) continue;
    readings[id] = {
      evidence: [...new Set((Array.isArray(value.evidence) ? value.evidence : []).filter((n) => Number.isInteger(n) && n >= 0 && n < passage.paragraphs.length))],
      openWord: passage.vocabulary.some((word) => word.term === value.openWord) ? value.openWord : "",
      draft: limit(value.draft),
      revised: limit(value.revised),
      feedback: isObj(value.feedback) ? value.feedback : null,
      completedAt: limit(value.completedAt, 40),
      startedAt: limit(value.startedAt, 40),
      updatedAt: limit(value.updatedAt, 40),
    };
  }
  return { v: 1, readings };
}

export const saveSubjectReading = (state, write = (key, value) => storage.set(key, value)) =>
  write(KEY, JSON.stringify(state));

const recordOf = (state, id) => state.readings[id] || {
  evidence: [], openWord: "", draft: "", revised: "", feedback: null, completedAt: "", startedAt: "",
};
const hasTerm = (text, terms) => terms.some((term) => new RegExp(`\\b${term}\\b`, "i").test(text));
const hasConnection = (text) => /\b(because|therefore|so|as a result|which means|this suggests|if .+ then)\b/i.test(text);

/** Transparent observable checks; these do not judge the scientific truth of a response. */
export function reviewResponse(reading, response, evidence) {
  const chosen = evidence.some((index) => reading.evidenceParagraphs.includes(index));
  const checks = {
    developed: wordCount(response) >= 12,
    selectedEvidence: chosen,
    subjectWords: hasTerm(response, reading.focusTerms),
    connection: hasConnection(response),
  };
  const nextMove = !checks.selectedEvidence
    ? "Select a paragraph that helps answer the question, then use a detail from it."
    : !checks.developed
      ? "Add a specific observation and explain what it shows."
      : !checks.subjectWords
        ? "Name the organisms or features involved, using precise words from the reading."
        : !checks.connection
          ? "Connect your observation to your explanation with because, so, or this suggests."
          : "Your response includes evidence and a connection. Check whether the selected detail actually supports your explanation.";
  return { checks, nextMove, ready: Object.values(checks).every(Boolean) };
}

const href = (id, band) => `${BASE}/subject-reading/${id}?grades=${band}`;
const tidyGrade = (grade) => String(grade).replaceAll("-", "–");
const allDone = (state) => ECOSYSTEM_SEQUENCE.every((id) => recordOf(state, id).completedAt);

function hub(ctx, state, I) {
  const q = new URLSearchParams(location.search);
  const grade = q.get("grade") || "all";
  const subject = q.get("subject") || "all";
  const complexity = q.get("complexity") || "all";
  const options = (name, values, selected) => html`<select aria-label="${name}" data-sr-filter="${name.toLowerCase()}">
    ${values.map((value) => html`<option value="${value}" ${value === selected ? "selected" : ""}>${value === "all" ? I.S(`All ${name.toLowerCase()}s`, `Todos los ${name.toLowerCase()}s`) : value}</option>`)}
  </select>`;
  const list = READINGS.filter((reading) =>
    (grade === "all" || reading.grade === grade) &&
    (subject === "all" || reading.subject === subject) &&
    (complexity === "all" || reading.complexity === complexity),
  );
  return html`<div class="sr-page sr-hub">
    <header class="sr-hero"><p class="eyebrow">${I.T("Reading Investigation Lab", "Laboratorio de investigación de lectura")}</p><h1 tabindex="-1">${I.T("Read across subjects. Build an explanation.", "Lee sobre distintas materias. Construye una explicación.")}</h1><p>${I.T("Choose a reading, inspect words in context, collect evidence, write, revise, and apply your thinking in the next investigation. Your work stays on this device.", "Elige una lectura, examina palabras en contexto, reúne evidencia, escribe, revisa y aplica tus ideas en la siguiente investigación. Tu trabajo queda en este dispositivo.")}</p></header>
    <section class="sr-feature" aria-labelledby="sr-unit"><div><p class="eyebrow">${I.T("Connected Grade 6 unit", "Unidad conectada de sexto grado")}</p><h2 id="sr-unit">${I.T("Ecosystems: from food webs to new evidence", "Ecosistemas: de las redes alimentarias a nueva evidencia")}</h2><p>${I.T("Three original readings move from relationships to population change, then to an unfamiliar forest problem. Each stop asks for evidence and an explanation.", "Tres lecturas originales van de las relaciones a los cambios de población y luego a un problema forestal nuevo. Cada etapa pide evidencia y una explicación.")}</p></div><ol>${ECOSYSTEM_SEQUENCE.map((id) => { const r = READING_BY_ID[id]; const done = Boolean(recordOf(state, id).completedAt); return html`<li><a href="${href(id, r.band)}"><strong>${r.title}</strong><span>${done ? I.T("Completed", "Completado") : I.T(`Reading ${r.order}`, `Lectura ${r.order}`)}</span></a></li>`; })}</ol></section>
    ${allDone(state) ? html`<p class="sr-complete" role="status">${I.T("You completed all three investigations. Revisit your first explanation and compare it with your forest response.", "Completaste las tres investigaciones. Vuelve a tu primera explicación y compárala con tu respuesta sobre el bosque.")}</p>` : ""}
    <section aria-labelledby="sr-browse"><h2 id="sr-browse">${I.T("Browse readings", "Explorar lecturas")}</h2><div class="sr-filters">${options("Grade", ["all", "3–5", "6", "7–8"], grade)}${options("Subject", ["all", "Science", "Geography"], subject)}${options("Complexity", ["all", "Supported", "Core", "Extended", "Transfer"], complexity)}</div><div class="sr-cards">${list.map((r) => html`<a class="sr-card" href="${href(r.id, r.band)}"><span class="sr-meta">${I.T(`Grade ${tidyGrade(r.grade)} · ${r.subject} · ${r.complexity}`, `Grado ${tidyGrade(r.grade)} · ${r.subject} · ${r.complexity}`)}</span><strong>${r.title}</strong><span>${r.goal}</span><small>${recordOf(state, r.id).completedAt ? I.T("Read again", "Leer de nuevo") : I.T("Start investigation", "Empezar la investigación")}</small></a>`)}</div>${!list.length ? html`<p>${I.T("No reading matches those filters. Choose another grade, subject, or complexity.", "Ninguna lectura coincide con esos filtros. Elige otro grado, materia o nivel de complejidad.")}</p>` : ""}</section>
  </div>`;
}

function evidenceList(reading, record, I) {
  return html`<div class="sr-passages">${reading.paragraphs.map((paragraph, index) => html`<article class="sr-paragraph"><div class="sr-para-head"><span>${I.T(`Paragraph ${index + 1}`, `Párrafo ${index + 1}`)}</span><button type="button" class="sr-evidence ${record.evidence.includes(index) ? "is-selected" : ""}" data-sr-evidence="${index}" aria-pressed="${record.evidence.includes(index)}">${record.evidence.includes(index) ? I.T("Evidence selected", "Evidencia seleccionada") : I.T("Use as evidence", "Usar como evidencia")}</button></div><p lang="en">${paragraph}</p></article>`)}</div>`;
}

function readingPage(ctx, reading, record, I) {
  const first = Boolean(record.feedback);
  const revised = Boolean(record.completedAt);
  const next = reading.next && READING_BY_ID[reading.next];
  return html`<div class="sr-page sr-lesson"><nav aria-label="${I.S("Breadcrumb", "Ruta")}"><a href="${BASE}/subject-reading?grades=${ctx.band}">${I.T("Reading Investigation Lab", "Laboratorio de lectura")}</a><span aria-hidden="true"> / </span><span>${reading.title}</span></nav>
    <header class="sr-lesson-head"><p class="eyebrow">${I.T(`Grade ${reading.grade} · ${reading.subject} · ${reading.complexity}`, `Grado ${reading.grade} · ${reading.subject} · ${reading.complexity}`)}</p><h1 tabindex="-1">${reading.title}</h1><p>${I.T("Learning goal:", "Meta de aprendizaje:")} ${reading.goal}</p>${reading.unit === "ecosystems" ? html`<p class="sr-step-count">${I.T(`Ecosystems investigation ${reading.order} of 3`, `Investigación de ecosistemas ${reading.order} de 3`)}</p>` : ""}</header>
    <ol class="sr-rail" aria-label="${I.S("Learning sequence", "Secuencia de aprendizaje")}"><li>${I.T("Explore words", "Explora palabras")}</li><li>${I.T("Read and collect evidence", "Lee y reúne evidencia")}</li><li>${I.T("Explain", "Explica")}</li><li>${I.T("Use feedback and revise", "Usa comentarios y revisa")}</li><li>${I.T("Apply", "Aplica")}</li></ol>
    <div class="sr-layout"><div><section class="sr-panel" aria-labelledby="sr-words"><h2 id="sr-words">${I.T("Words in context", "Palabras en contexto")}</h2><p>${I.T("Open a word to see its meaning and an example from this investigation.", "Abre una palabra para ver su significado y un ejemplo de esta investigación.")}</p><div class="sr-words">${reading.vocabulary.map((word) => html`<div><button type="button" data-sr-word="${word.term}" aria-expanded="${record.openWord === word.term}">${word.term}</button>${record.openWord === word.term ? html`<div class="sr-word-meaning" role="note"><strong>${word.meaning}</strong><p>${word.context}</p></div>` : ""}</div>`)}</div></section><section class="sr-panel" aria-labelledby="sr-text"><h2 id="sr-text">${I.T("Read and investigate", "Lee e investiga")}</h2><p>${I.T("Choose the paragraph or paragraphs that help you answer the question. You can change your selection.", "Elige el párrafo o los párrafos que te ayudan a responder. Puedes cambiar tu selección.")}</p>${evidenceList(reading, record, I)}</section></div>
    <section class="sr-panel sr-response" aria-labelledby="sr-question"><h2 id="sr-question">${I.T("Explain with evidence", "Explica con evidencia")}</h2><p class="sr-prompt">${reading.prompt}</p><p>${I.T("Your selected paragraphs:", "Tus párrafos seleccionados:")} ${record.evidence.length ? record.evidence.map((n) => n + 1).join(", ") : I.T("None yet", "Todavía ninguno")}</p><label for="sr-draft">${I.T("First explanation", "Primera explicación")}</label><textarea id="sr-draft" rows="6" maxlength="4000" data-sr-draft ${first ? "readonly" : ""}>${record.draft}</textarea>${!first ? html`<button type="button" class="btn btn-primary" data-sr-submit>${I.T("Get specific feedback", "Recibir comentarios específicos")}</button>` : ""}
      ${first ? html`<div class="sr-feedback" role="status"><h3>${I.T("One next move", "Un próximo paso")}</h3><p>${record.feedback?.nextMove}</p><ul><li>${record.feedback?.checks?.selectedEvidence ? I.T("You selected a relevant paragraph.", "Seleccionaste un párrafo relevante.") : I.T("Select a paragraph that addresses the question.", "Selecciona un párrafo que responda a la pregunta.")}</li><li>${record.feedback?.checks?.connection ? I.T("Your explanation uses a connecting phrase.", "Tu explicación usa una frase de conexión.") : I.T("Connect a detail to your idea with because or so.", "Conecta un detalle con tu idea usando because o so.")}</li></ul><p class="fine">${I.T("These checks describe visible features. They do not judge whether your scientific conclusion is correct.", "Estas comprobaciones describen rasgos visibles. No juzgan si tu conclusión científica es correcta.")}</p></div><label for="sr-revision">${I.T("Revised explanation", "Explicación revisada")}</label><textarea id="sr-revision" rows="6" maxlength="4000" data-sr-revision>${record.revised}</textarea>${!revised ? html`<button type="button" class="btn btn-primary" data-sr-revise>${I.T("Review my revision", "Revisar mi explicación revisada")}</button>` : ""}` : ""}
      ${revised ? html`<div class="sr-finish" role="status"><h3>${I.T("Investigation complete", "Investigación completada")}</h3><p>${I.T("Compare your first and revised explanations above. Your revision met the visible response criteria; a teacher can review the accuracy of your reasoning.", "Compara arriba tu primera explicación y la revisada. Tu revisión cumplió los criterios visibles; un docente puede revisar la exactitud de tu razonamiento.")}</p>${next ? html`<a class="btn btn-primary" href="${href(next.id, next.band)}">${I.T(`Apply this skill next: ${next.title}`, `Aplica esta destreza: ${next.title}`)}</a>` : html`<a class="btn" href="${BASE}/subject-reading?grades=${ctx.band}">${I.T("Explore more readings", "Explorar más lecturas")}</a>`}</div>` : ""}
    </section></div></div>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const state = loadSubjectReading();
  const reading = READING_BY_ID[ctx.route.id];
  if (ctx.route.id && !reading) return { title: I.S("Reading not found", "Lectura no encontrada"), html: html`<section class="sr-page sr-panel"><h1>${I.T("Reading not found", "Lectura no encontrada")}</h1><a href="${BASE}/subject-reading?grades=${ctx.band}">${I.T("Browse readings", "Explorar lecturas")}</a></section>` };
  return reading
    ? { title: reading.title, html: readingPage(ctx, reading, recordOf(state, reading.id), I) }
    : { title: I.S("Reading Investigation Lab", "Laboratorio de investigación de lectura"), html: hub(ctx, state, I) };
}

function writeEvidence(reading, record, kind, text, review) {
  const ledger = loadLedger();
  const stage = kind === "revision" ? "supported" : reading.complexity === "Transfer" ? "independent" : "supported";
  appendEntry(ledger, { src: "item", task: `subject-reading:${reading.id}`, band: reading.band, domain: "Reading", use: "Explain", stage, kind, supports: { coach: kind === "revision" }, m: { selectedParagraphs: record.evidence.length, relevantParagraphs: record.evidence.filter((n) => reading.evidenceParagraphs.includes(n)).length, responseWords: wordCount(text), observableCriteriaMet: review.ready }, confidence: null });
  appendEntry(ledger, { src: "writing", task: `subject-reading:${reading.id}`, band: reading.band, domain: "Writing", use: "Explain", stage, kind, supports: { coach: kind === "revision" }, m: { words: wordCount(text), cites: Number(review.checks.selectedEvidence), link: Number(review.checks.connection), academic: Number(review.checks.subjectWords), responseCriteriaMet: review.ready, sourceReading: reading.id }, confidence: null });
  saveLedger(ledger);
}

export function onInput(event, ctx) {
  const reading = READING_BY_ID[ctx.route.id];
  if (!reading) return false;
  const state = loadSubjectReading();
  const record = (state.readings[reading.id] ||= recordOf(state, reading.id));
  if (event.target.matches("[data-sr-draft]") && !record.feedback) record.draft = limit(event.target.value);
  else if (event.target.matches("[data-sr-revision]") && record.feedback && !record.completedAt) record.revised = limit(event.target.value);
  else return false;
    record.startedAt ||= new Date().toISOString();
    record.updatedAt = new Date().toISOString();
  saveSubjectReading(state);
  return true;
}

export function onClick(event, ctx) {
  const reading = READING_BY_ID[ctx.route.id];
  if (!reading) return false;
  const button = event.target.closest("button");
  if (!button) return false;
  const state = loadSubjectReading();
  const record = (state.readings[reading.id] ||= recordOf(state, reading.id));
  if (button.hasAttribute("data-sr-evidence")) {
    const index = Number(button.dataset.srEvidence);
    record.evidence = record.evidence.includes(index) ? record.evidence.filter((n) => n !== index) : [...record.evidence, index].sort();
  } else if (button.hasAttribute("data-sr-word")) {
    record.openWord = record.openWord === button.dataset.srWord ? "" : button.dataset.srWord;
  } else if (button.hasAttribute("data-sr-submit")) {
    if (record.feedback) return true;
    const draft = record.draft.trim();
    if (wordCount(draft) < 4) { button.insertAdjacentHTML("afterend", `<p role="alert">${i18nFor(ctx).S("Write at least one complete thought before asking for feedback.", "Escribe al menos una idea completa antes de pedir comentarios.")}</p>`); return true; }
    record.feedback = reviewResponse(reading, draft, record.evidence);
    writeEvidence(reading, record, reading.complexity === "Transfer" ? "transfer" : "first", draft, record.feedback);
  } else if (button.hasAttribute("data-sr-revise")) {
    if (!record.feedback || record.completedAt) return true;
    const revised = record.revised.trim();
    if (revised === record.draft.trim()) { button.insertAdjacentHTML("afterend", `<p role="alert">${i18nFor(ctx).S("Change your explanation before reviewing the revision.", "Cambia tu explicación antes de revisar la revisión.")}</p>`); return true; }
    const review = reviewResponse(reading, revised, record.evidence);
    record.feedback = review;
    writeEvidence(reading, record, "revision", revised, review);
    if (review.ready) record.completedAt = new Date().toISOString();
  } else return false;
  record.startedAt ||= new Date().toISOString();
  record.updatedAt = new Date().toISOString();
  saveSubjectReading(state);
  ctx.rerender();
  return true;
}

export function onChange(event) {
  const select = event.target.closest("[data-sr-filter]");
  if (!select) return false;
  const query = new URLSearchParams(location.search);
  if (select.value === "all") query.delete(select.dataset.srFilter);
  else query.set(select.dataset.srFilter, select.value);
  location.assign(`${BASE}/subject-reading?${query}`);
  return true;
}
