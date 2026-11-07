import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { i18nFor } from "../i18n.js";
import { BASE, html } from "../util.js";
import { LESSONS, lessonFor, lessonForGrade } from "./lessons.js";
import { STAGES, lessonState, loadProgress, nextStage, responseNudge, saveProgress, updateLesson, wordsIn } from "./model.js";

const LABELS = {
  preview: ["Discover", "Descubre"], explore: ["Explore words", "Explora palabras"],
  relationships: ["Connect ideas", "Conecta ideas"], context: ["Use context", "Usa el contexto"],
  passage: ["Investigate a text", "Investiga un texto"], application: ["Apply", "Aplica"],
  revision: ["Revise", "Revisa"], transfer: ["Try it alone", "Inténtalo por tu cuenta"],
};
const href = (id) => `${BASE}/vocab-curriculum/${id}`;
const current = (ctx) => lessonFor(ctx.route.id) || lessonForGrade(ctx.route.id);
const phrase = (I, en, es) => I.T(en, es);

function hubHTML(I, progress) {
  return html`<div class="vc vc-hub"><header class="vc-hero"><p class="eyebrow">${phrase(I, "Vocabulary investigations", "Investigaciones de vocabulario")}</p>
    <h1>${phrase(I, "Words make ideas possible", "Las palabras hacen posibles las ideas")}</h1>
    <p>${phrase(I, "Explore meanings, connect ideas, read evidence, write, revise, and apply a word in a new situation. Choose a grade example to begin without an account.", "Explora significados, conecta ideas, lee evidencia, escribe, revisa y aplica una palabra en otra situación. Elige un ejemplo de grado para comenzar sin cuenta.")}</p></header>
    <section aria-labelledby="vc-lessons"><h2 id="vc-lessons">${phrase(I, "Choose an investigation", "Elige una investigación")}</h2>
    <div class="vc-lessons">${LESSONS.map((lesson) => {
      const saved = lessonState(progress, lesson.id);
      return html`<a class="vc-lesson" href="${href(lesson.id)}"><span class="vc-grade">${phrase(I, "Grade", "Grado")} ${lesson.grade}</span>
        <strong>${lesson.title}</strong><span>${lesson.goal}</span><em>${saved.completed ? phrase(I, "Review completed work", "Revisar trabajo completado") : saved.stage !== "preview" ? phrase(I, `Continue: ${LABELS[saved.stage][0]}`, `Continuar: ${LABELS[saved.stage][1]}`) : phrase(I, "Start lesson", "Comenzar lección")}</em></a>`;
    })}</div></section>
    <p class="vc-note">${phrase(I, "Your work is saved on this device. These lessons provide instructional evidence, not a WIDA level or score.", "Tu trabajo se guarda en este dispositivo. Estas lecciones aportan evidencia de aprendizaje, no un nivel ni un puntaje WIDA.")}</p></div>`;
}

function stepRail(I, stage, completed) {
  const here = STAGES.indexOf(stage);
  return html`<ol class="vc-rail" aria-label="${I.S("Lesson stages", "Etapas de la lección")}">${STAGES.map((id, index) =>
    html`<li class="${index === here ? "is-current" : ""} ${index < here || completed ? "is-done" : ""}" ${index === here ? 'aria-current="step"' : ""}>${index + 1}. ${I.T(...LABELS[id])}</li>`)}</ol>`;
}

const feedbackHTML = (state) => state.feedback ? html`<p class="vc-feedback" role="status">${state.feedback}</p>` : "";
const nextButton = (I, stage) => html`<button class="btn btn-primary" type="button" data-vc-next="${stage}">${phrase(I, "Continue", "Continuar")}</button>`;

function choiceStage(I, lesson, state, stage) {
  const task = stage === "relationships" ? lesson.relationship : stage === "context" ? lesson.context : lesson.evidence;
  const prompt = stage === "passage" ? task.prompt : task.prompt;
  const order = lesson.grade === "K" || lesson.grade === "4" || lesson.grade === "8" ? [1, 0, 2] : [2, 1, 0];
  return html`<div class="vc-task">
    ${stage === "passage" ? html`<div class="vc-source"><strong>${phrase(I, "Read the source", "Lee la fuente")}</strong><p lang="en">${lesson.passage}</p></div>` : ""}
    <h2 lang="en">${prompt}</h2>
    ${stage === "context" ? html`<p class="vc-note">${phrase(I, "Look for a clue in the sentence before choosing.", "Busca una pista en la oración antes de elegir.")}</p>` : ""}
    <fieldset class="vc-choices"><legend>${phrase(I, "Choose one response", "Elige una respuesta")}</legend>
      ${order.map((index) => html`<label><input type="radio" name="vc-choice" value="${index}" /><span>${task.choices[index]}</span></label>`)}</fieldset>
    <label class="vc-field">${phrase(I, "What clue or relationship helped you decide?", "¿Qué pista o relación te ayudó a decidir?")}
      <textarea data-vc-explanation rows="3" maxlength="600">${state.explanation}</textarea></label>
    ${feedbackHTML(state)}
    <button type="button" class="btn btn-primary" data-vc-check="${stage}">${phrase(I, "Check my reasoning", "Comprobar mi razonamiento")}</button>
  </div>`;
}

function lessonStage(I, lesson, state) {
  switch (state.stage) {
    case "preview": return html`<div class="vc-task"><p class="vc-kicker">${phrase(I, "The question", "La pregunta")}</p><h2 lang="en">${lesson.question}</h2>
      <p lang="en">${lesson.goal}</p><p>${phrase(I, "You will inspect words, test relationships, read a short source, and improve your own explanation.", "Examinarás palabras, probarás relaciones, leerás una fuente breve y mejorarás tu propia explicación.")}</p>${nextButton(I, "preview")}</div>`;
    case "explore": return html`<div class="vc-task"><h2>${phrase(I, "Inspect both words", "Examina las dos palabras")}</h2><p>${phrase(I, "Select each word to uncover its meaning and an example. Notice how the words help answer the question.", "Selecciona cada palabra para descubrir su significado y un ejemplo. Observa cómo ayudan a responder la pregunta.")}</p>
      <div class="vc-words">${lesson.words.map((word) => html`<div class="vc-word"><button type="button" class="vc-word-button" data-vc-inspect="${word.id}" aria-expanded="${state.inspected.includes(word.id)}">${word.term}</button>
        ${state.inspected.includes(word.id) ? html`<div><p><strong>${phrase(I, "Meaning", "Significado")}:</strong> ${word.meaning}</p><p lang="en">“${word.example}”</p><p><strong>${phrase(I, "Connects to", "Se relaciona con")}:</strong> ${word.relation}</p></div>` : ""}</div>`)}</div>
      ${state.inspected.length >= lesson.words.length ? nextButton(I, "explore") : html`<p role="status">${state.inspected.length} / ${lesson.words.length} ${phrase(I, "words inspected", "palabras examinadas")}</p>`}</div>`;
    case "relationships": case "context": case "passage": return choiceStage(I, lesson, state, state.stage);
    case "application": return html`<div class="vc-task"><h2>${phrase(I, "Build an explanation", "Construye una explicación")}</h2><p lang="en">${lesson.produce}</p>
      <button type="button" class="btn" data-vc-frame>${phrase(I, "Use a sentence frame", "Usar una estructura de oración")}</button>
      <p class="vc-note" lang="en">${state.supportUsed ? lesson.frame : "A frame is optional. Your ideas matter most."}</p>
      <label class="vc-field">${phrase(I, "Your first response", "Tu primera respuesta")}<textarea data-vc-draft rows="6" maxlength="1800">${state.draft}</textarea></label>
      ${feedbackHTML(state)}<button type="button" class="btn btn-primary" data-vc-submit="application">${phrase(I, "Save first response", "Guardar primera respuesta")}</button></div>`;
    case "revision": return html`<div class="vc-task"><h2>${phrase(I, "Make one change that helps your reader", "Haz un cambio que ayude a tu lector")}</h2><p lang="en">${lesson.revision}</p>
      <div class="vc-source"><strong>${phrase(I, "Your first response", "Tu primera respuesta")}</strong><p>${state.first}</p></div>
      <label class="vc-field">${phrase(I, "Revised response", "Respuesta revisada")}<textarea data-vc-draft rows="6" maxlength="1800">${state.draft || state.first}</textarea></label>
      ${feedbackHTML(state)}<button type="button" class="btn btn-primary" data-vc-submit="revision">${phrase(I, "Compare and save revision", "Comparar y guardar la revisión")}</button></div>`;
    case "transfer": return state.completed ? html`<div class="vc-task"><h2>${phrase(I, "You completed the investigation", "Terminaste la investigación")}</h2>
      <p>${phrase(I, "You explored word meanings, used source evidence, revised your explanation, and tried a new situation independently. This records your work; it is not a proficiency score.", "Exploraste significados, usaste evidencia, revisaste tu explicación e intentaste otra situación de forma independiente. Esto registra tu trabajo; no es un puntaje de dominio.")}</p>
      <div class="vc-compare"><div><strong>${phrase(I, "First", "Primera")}</strong><p>${state.first}</p></div><div><strong>${phrase(I, "Revised", "Revisada")}</strong><p>${state.revised}</p></div><div><strong>${phrase(I, "New situation", "Nueva situación")}</strong><p>${state.transfer}</p></div></div>
      <a class="btn btn-primary" href="${BASE}/vocab-curriculum">${phrase(I, "Choose another investigation", "Elegir otra investigación")}</a></div>` : html`<div class="vc-task"><h2>${phrase(I, "Use the idea somewhere new", "Usa la idea en otra situación")}</h2>
      <p lang="en">${lesson.transfer}</p><p class="vc-note">${phrase(I, "Try this on your own. Your earlier writing is available below for comparison; this new response has no sentence frame.", "Inténtalo por tu cuenta. Tu texto anterior aparece abajo para compararlo; esta respuesta nueva no tiene estructura de oración.")}</p>
      <label class="vc-field">${phrase(I, "Independent response", "Respuesta independiente")}<textarea data-vc-draft rows="6" maxlength="1800">${state.draft}</textarea></label>
      ${feedbackHTML(state)}<button type="button" class="btn btn-primary" data-vc-submit="transfer">${phrase(I, "Finish investigation", "Terminar investigación")}</button></div>`;
    default: return "";
  }
}

export function render(ctx) {
  const I = i18nFor(ctx);
  const progress = loadProgress();
  const lesson = current(ctx);
  if (!lesson) return { title: I.S("Vocabulary investigations", "Investigaciones de vocabulario"), html: hubHTML(I, progress) };
  const state = lessonState(progress, lesson.id);
  return { title: `${lesson.title} · Vocabulary investigations`, html: html`<div class="vc vc-lesson-page">
    <nav aria-label="${I.S("Breadcrumb", "Ruta de navegación")}"><a href="${BASE}/vocab-curriculum">${phrase(I, "Vocabulary investigations", "Investigaciones de vocabulario")}</a></nav>
    <header class="vc-hero"><p class="eyebrow">${phrase(I, "Grade", "Grado")} ${lesson.grade} · ${lesson.use}</p><h1>${lesson.title}</h1><p lang="en">${lesson.goal}</p></header>
    ${stepRail(I, state.stage, state.completed)}<main class="vc-stage" id="vc-stage">${lessonStage(I, lesson, state)}</main>
    <p class="vc-note">${phrase(I, "Saved on this device. Your first response, revision, and independent transfer stay distinct in the evidence record.", "Guardado en este dispositivo. Tu primera respuesta, revisión y transferencia independiente quedan separadas en el registro de evidencia.")}</p>
  </div>` };
}

function record(lesson, stage, state, response, { correct = null } = {}) {
  const ledger = loadLedger();
  const produced = ["application", "revision", "transfer"].includes(stage);
  const lower = response.toLowerCase();
  appendEntry(ledger, {
    src: produced ? "mission" : "item", task: `vocab-curriculum:${lesson.id}:${stage}`,
    band: lesson.grade, domain: produced ? "Writing" : "Reading", use: lesson.use,
    stage: stage === "transfer" ? "independent" : state.supportUsed || stage === "revision" ? "supported" : "independent",
    kind: stage === "revision" ? "revision" : stage === "transfer" ? "transfer" : "first",
    supports: stage === "application" && state.supportUsed ? { frame: true } : {},
    m: produced ? { words: wordsIn(response), academic: lesson.words.filter(({ term }) => new RegExp(`\\b${term}\\b`, "i").test(lower)).length,
      link: /\b(because|so|however|but|while|for example)\b/i.test(response) ? 1 : 0 } : { correct, words: wordsIn(response) },
  });
  saveLedger(ledger);
}

function persist(lesson, patch) {
  const next = updateLesson(loadProgress(), lesson.id, patch);
  saveProgress(next);
  return lessonState(next, lesson.id);
}

export function onInput(event, ctx) {
  const lesson = current(ctx);
  if (!lesson) return false;
  const target = event.target;
  if (target.matches?.("[data-vc-draft]")) {
    persist(lesson, { draft: target.value });
    return true;
  }
  if (target.matches?.("[data-vc-explanation]")) {
    persist(lesson, { explanation: target.value });
    return true;
  }
  return false;
}

export function onClick(event, ctx) {
  const button = event.target.closest?.("button[data-vc-next],button[data-vc-inspect],button[data-vc-check],button[data-vc-frame],button[data-vc-submit]");
  const lesson = current(ctx);
  if (!button || !lesson) return false;
  let state = lessonState(loadProgress(), lesson.id);
  if (button.dataset.vcNext && button.dataset.vcNext === state.stage) {
    if (state.stage === "explore" && state.inspected.length < lesson.words.length) return true;
    persist(lesson, { stage: nextStage(state.stage), feedback: "", explanation: "", draft: state.stage === "application" ? state.first : "" });
  } else if (button.dataset.vcInspect && state.stage === "explore") {
    const id = button.dataset.vcInspect;
    if (lesson.words.some((word) => word.id === id)) persist(lesson, { inspected: [...new Set([...state.inspected, id])] });
  } else if (button.hasAttribute("data-vc-frame") && state.stage === "application") {
    persist(lesson, { supportUsed: true });
  } else if (button.dataset.vcCheck === state.stage && ["relationships", "context", "passage"].includes(state.stage)) {
    const choice = document.querySelector("input[name=vc-choice]:checked");
    const explanation = document.querySelector("[data-vc-explanation]")?.value.trim() || "";
    const task = state.stage === "relationships" ? lesson.relationship : state.stage === "context" ? lesson.context : lesson.evidence;
    const attempts = { ...state.attempts, [state.stage]: state.attempts[state.stage] + 1 };
    if (!choice) persist(lesson, { attempts, feedback: "Choose a response, then explain the clue that supports it." });
    else if (Number(choice.value) !== task.answer) persist(lesson, { attempts, feedback: state.stage === "relationships" ? task.feedback : state.stage === "context" ? `Look again for this clue: “${task.clue}.”` : "Return to the source and find a detail that directly supports the idea." });
    else if (wordsIn(explanation) < 4) persist(lesson, { attempts, feedback: "Explain your choice in at least four words so someone else can follow your thinking." });
    else {
      record(lesson, state.stage, state, explanation, { correct: true });
      persist(lesson, { attempts, stage: nextStage(state.stage), feedback: "", explanation: "" });
    }
  } else if (button.dataset.vcSubmit === state.stage && ["application", "revision", "transfer"].includes(state.stage)) {
    const response = document.querySelector("[data-vc-draft]")?.value.trim() || "";
    const attempts = { ...state.attempts, [state.stage]: state.attempts[state.stage] + 1 };
    if (wordsIn(response) < 6) persist(lesson, { attempts, feedback: "Write or type at least six words with an idea and a detail. You can use voice dictation from your device." });
    else if (state.stage === "revision" && response === state.first.trim()) persist(lesson, { attempts, feedback: "Change at least one part of your first response. Use the revision goal above." });
    else {
      record(lesson, state.stage, state, response);
      const patch = { attempts, feedback: state.stage === "transfer" ? "" : responseNudge(response, lesson, { revision: state.stage === "revision" }),
        [state.stage === "application" ? "first" : state.stage === "revision" ? "revised" : "transfer"]: response,
        completed: state.stage === "transfer", stage: nextStage(state.stage), draft: state.stage === "application" ? response : "" };
      state = persist(lesson, patch);
    }
  } else return false;
  ctx.rerender();
  return true;
}
