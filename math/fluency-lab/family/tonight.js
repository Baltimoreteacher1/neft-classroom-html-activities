import { GRADES, validateAnswer } from "../problem-bank.js";
import { emptyTutor, findSkill, recommendations, recordAnswer, sanitizeTutor } from "../tutor-engine.js";
import { PROFILE_NAMES, profileKey, profiles, readLocal, selectProfile, writeLocal } from "../school-tools.js";
import { getLang, setLang } from "../i18n.js";
import { mountVisualLesson } from "../visual-lab.js";
import { choicesEs, questionEs } from "../question-es.js";
import { createNightSession, markNightStageComplete, moveNightStage, NIGHT_STAGES, NIGHT_STORAGE, sanitizeNightSession } from "./family-session-core.js";

const TUTOR_KEY = "ewl-fluency-tutor-v2";
const LABELS = {
  en: {
    stages: ["Warm-up", "See the idea", "Try independently", "Family challenge", "Reflect"],
    names: { retrieval: "Retrieval warm-up", concept: "Build the idea", independent: "Try independently", family: "Family challenge", reflection: "Reflect and choose a next step" },
    desc: {
      retrieval: "Wake up an idea from earlier practice. If this learner is new to the lab, we’ll use a helpful foundation as a first look.",
      concept: "Work through an interactive visual lesson. Notice how the model and the numbers connect.",
      independent: "Use the same mathematical idea on fresh problems. Hints are available, and using one is part of learning.",
      family: "Take turns thinking together. The learner solves at their own pace; a partner listens for the strategy and asks one useful question.",
      reflection: "Name a strategy you used and see the next practice suggestion, based on this session’s saved evidence.",
    },
    goal: "Learning focus: {skill}", start: "Begin this step", check: "Check", next: "Continue", retry: "Try once more", worked: "Show the useful step", hint: "Use this hint: {hint}", correct: "That works. What made it work?", wrong: "Not yet. Here is a clue to help you revise.", solution: "Here is one way to reason it out: {explanation}", stageCount: "Question {n} of {total}", noHistory: "This is a first look, so this warm-up uses a related foundation when one is available.", retrieval: "A quick retrieval practice supports remembering ideas across days.", independent: "Work on your own first. Take the time you need.", familyRoles: ["Learner thinks", "Partner listens"], partnerPrompt: "Ask: “What did you notice first? Can you show it with a model or another way?”", familySupport: "A family challenge is shared practice. A correct answer here counts as supported evidence, separate from independent work.", chooseStrategy: "Which strategy helped you most?", strategies: ["Count or track each step", "Break a number into parts", "Use a model or drawing", "Use a fact I already know", "Compare two ways", "I am still figuring it out"], reflectionPrompt: "Tell your partner one thing you noticed. You can say it aloud; no written explanation is saved.", finish: "Finish tonight’s math", completeTitle: "A math moment worth keeping", completeCopy: "You worked through a warm-up, a visual idea, independent practice, and a family challenge.", progress: "Independent checks: {correct} of {total}. Supported family challenge: {family}.", nextFocus: "A useful next step", noEvidence: "There is not enough evidence yet for a specific skill recommendation. Continue with this grade’s next practice suggestion.", startAgain: "Start another session", pause: "Pause and come back later", switch: "Switch learner", failed: "This browser could not save this session. You can continue, but pause only after the Fluency Lab confirms progress is saved.", skipConcept: "Continue without the visual lesson", warmEvidence: "Earlier practice found for this learner.", partner: "Family partner", learner: "Learner", turn: "Turn: {who}", familyAnswer: "The family pair worked it out together.", reviewed: "Warm-up complete.", independentDone: "Independent practice complete.", familyDone: "Family challenge complete.", conceptDone: "Visual lesson complete.", partial: "Your progress is saved on this device. You can pause at any point.", missing: "That response is not available to check. Try a number, fraction, or the choices shown.", language: "Español", returnFamily: "Back to family math", method: "How we use practice evidence", methodCopy: "Practice recommendations use recent accuracy, independent attempts, and review timing. A family challenge is recorded as supported, not as independent mastery.", stageFinished: "Step complete", reflectionDone: "Reflection saved. Your optional strategy choice stays on this device.",
  },
  es: {
    stages: ["Repaso", "Mira la idea", "Intenta a solas", "Reto familiar", "Reflexiona"],
    names: { retrieval: "Repaso de recuperación", concept: "Construye la idea", independent: "Intenta a solas", family: "Reto familiar", reflection: "Reflexiona y elige el siguiente paso" },
    desc: {
      retrieval: "Recuerda una idea de la práctica anterior. Si es la primera vez, usaremos una base útil para comenzar.",
      concept: "Completa una lección visual interactiva. Observa cómo se conectan el modelo y los números.",
      independent: "Usa la misma idea matemática en problemas nuevos. Hay pistas; pedir una también es parte de aprender.",
      family: "Piensen juntos por turnos. El estudiante resuelve a su ritmo; su compañero escucha la estrategia y hace una pregunta útil.",
      reflection: "Nombra una estrategia y mira la siguiente sugerencia, basada en la evidencia guardada de esta sesión.",
    },
    goal: "Enfoque de aprendizaje: {skill}", start: "Comenzar este paso", check: "Comprobar", next: "Continuar", retry: "Intentar una vez más", worked: "Mostrar un paso útil", hint: "Usa esta pista: {hint}", correct: "Así funciona. ¿Qué hizo que funcionara?", wrong: "Todavía no. Aquí tienes una pista para revisar tu idea.", solution: "Una forma de razonarlo es: {explanation}", stageCount: "Problema {n} de {total}", noHistory: "Este es un primer intento. El repaso usará una base relacionada si está disponible.", retrieval: "Un repaso breve ayuda a recordar ideas de un día a otro.", independent: "Primero inténtalo por tu cuenta. Tómate el tiempo que necesites.", familyRoles: ["El estudiante piensa", "Su compañero escucha"], partnerPrompt: "Pregunta: «¿Qué notaste primero? ¿Puedes mostrarlo con un modelo u otra forma?»", familySupport: "El reto familiar es práctica compartida. La respuesta cuenta como evidencia con apoyo, separada del trabajo independiente.", chooseStrategy: "¿Qué estrategia te ayudó más?", strategies: ["Contar o seguir cada paso", "Separar un número en partes", "Usar un modelo o dibujo", "Usar un hecho que ya conozco", "Comparar dos formas", "Todavía lo estoy pensando"], reflectionPrompt: "Cuéntale a tu compañero algo que notaste. Puedes decirlo en voz alta; no guardamos una explicación escrita.", finish: "Terminar las matemáticas de hoy", completeTitle: "Un momento de matemáticas para recordar", completeCopy: "Hicieron un repaso, exploraron una idea visual, practicaron a solas y resolvieron un reto familiar.", progress: "Comprobaciones independientes: {correct} de {total}. Reto familiar con apoyo: {family}.", nextFocus: "Un siguiente paso útil", noEvidence: "Todavía no hay suficiente evidencia para sugerir una destreza específica. Sigue con la práctica sugerida para este grado.", startAgain: "Comenzar otra sesión", pause: "Pausar y volver después", switch: "Cambiar estudiante", failed: "Este navegador no pudo guardar la sesión. Pueden continuar, pero antes de pausar asegúrense de guardar el progreso en el laboratorio.", language: "English", returnFamily: "Volver a matemáticas en familia", method: "Cómo usamos la evidencia de práctica", methodCopy: "Las recomendaciones usan respuestas recientes, intentos independientes y el tiempo de repaso. El reto familiar se registra con apoyo, no como dominio independiente.", stageFinished: "Paso completo", reflectionDone: "Reflexión guardada. La estrategia opcional se guarda en este dispositivo.",
  },
};
LABELS.en.showHint = "Show a hint";
LABELS.es.showHint = "Mostrar una pista";

const params = new URLSearchParams(location.search);
const gradeNumber = Number(params.get("grade"));
let grade = GRADES.some((entry) => entry.grade === gradeNumber) ? gradeNumber : 1;
let household = profiles();
const profileParam = params.get("profile");
let profile = profileParam === null ? household.active : Number(profileParam);
if (!Number.isInteger(profile) || profile < 0 || profile > 5) profile = household.active;
if (!household.ids.includes(profile)) { selectProfile(profile); household = profiles(); }
const requestedSkill = params.get("skill");
const minutes = params.get("minutes") === "10" ? 10 : 5;
const challenge = ["adaptive", "building", "grade-stretch"].includes(params.get("challenge")) ? params.get("challenge") : "adaptive";
const support = params.get("support") === "extra" ? "extra" : "standard";
const hasSharedSettings = ["minutes", "challenge", "support"].some((key) => params.has(key));
const hasProfileInLaunch = profileParam !== null;
let lang = params.get("lang") === "es" ? "es" : getLang();
let tutor = sanitizeTutor(readLocal(profileKey(TUTOR_KEY, profile), emptyTutor()));
function sessionKey(forProfile = profile) {
  const base = profileKey(NIGHT_STORAGE, forProfile);
  return hasSharedSettings ? `${base}:share:${grade}:${encodeURIComponent(requestedSkill || "")}:${minutes}:${challenge}:${support}` : base;
}
function restoreSession(forProfile = profile) {
  return sanitizeNightSession(readLocal(sessionKey(forProfile), null), {
    profile: forProfile, grade, skillKey: requestedSkill ? `${grade}:${requestedSkill}` : undefined,
    minutes: hasSharedSettings ? minutes : undefined,
    challenge: hasSharedSettings ? challenge : undefined,
    support: hasSharedSettings ? support : undefined,
  });
}
function newSession() {
  return createNightSession({ grade, profile, lang, tutor, skill: requestedSkill, minutes, challenge, support });
}
let saved = restoreSession();
let session = saved;
if (!session) {
  session = newSession();
  saveSession();
}
let visualCleanup = null;
const root = document.querySelector("#night-panel");
const t = (key, values = {}) => Object.entries(values).reduce((copy, [name, value]) => copy.replaceAll(`{${name}}`, String(value)), LABELS[lang][key]);
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

function saveSession() {
  session.updatedAt = Date.now();
  const ok = writeLocal(sessionKey(), session);
  document.querySelector("#storage-warning").hidden = ok;
  if (!ok) document.querySelector("#storage-warning").textContent = t("failed");
}
function saveTutor() { writeLocal(profileKey(TUTOR_KEY, profile), tutor); }
function updateUrl() {
  const url = new URL(location.href);
  url.searchParams.set("grade", String(grade));
  if (hasProfileInLaunch) url.searchParams.set("profile", String(profile));
  else url.searchParams.delete("profile");
  url.searchParams.set("lang", lang);
  history.replaceState(null, "", url);
}
function renderProfileSelect() {
  household = profiles();
  const select = document.querySelector("#night-profile");
  select.innerHTML = household.ids.map((id) => `<option value="${id}" ${id === profile ? "selected" : ""}>${esc(lang === "es" ? "Estudiante" : "Learner")} ${id + 1} · ${esc(PROFILE_NAMES[id])}</option>`).join("");
}
function renderHeader() {
  document.documentElement.lang = lang;
  document.title = lang === "es" ? "Matemáticas de hoy · Matemáticas en familia" : "Tonight’s Math · Family Math Tonight";
  document.querySelector("#night-language").textContent = t("language");
  document.querySelector("#night-language").setAttribute("aria-label", lang === "en" ? "Switch to Spanish" : "Cambiar a inglés");
  document.querySelector(".profile-label").textContent = lang === "es" ? "Estudiante" : "Learner";
  document.querySelector("#night-profile").setAttribute("aria-label", lang === "es" ? "Elegir perfil de estudiante" : "Choose learner profile");
  document.querySelector("#night-progress").setAttribute("aria-label", lang === "es" ? "Pasos de la sesión" : "Session steps");
  document.querySelector(".back-link").textContent = `← ${t("returnFamily")}`;
  document.querySelector("#night-kicker").textContent = lang === "es" ? "MATEMÁTICAS EN FAMILIA · UNOS 5–10 MINUTOS" : "FAMILY MATH · ABOUT 5–10 MINUTES";
  document.querySelector("#night-title").textContent = lang === "es" ? "Matemáticas de hoy" : "Tonight’s Math";
  document.querySelector("#night-description").textContent = lang === "es" ? "Un camino breve que usa la práctica guardada de este estudiante. Pueden pausar; este dispositivo guarda el lugar." : "A short path built from this learner’s saved practice. Pause anytime; this device saves the place.";
  document.querySelector("#pause-link").textContent = t("pause");
  document.querySelector("#pause-link").setAttribute("aria-label", t("pause"));
  document.querySelector("#pause-link").nextElementSibling.textContent = t("returnFamily");
  document.querySelector("#pause-link").nextElementSibling.previousElementSibling?.setAttribute("aria-label", t("pause"));
  renderProfileSelect();
}
function renderProgress() {
  const index = NIGHT_STAGES.indexOf(session.stage);
  document.querySelector("#night-progress").innerHTML = NIGHT_STAGES.map((key, i) => {
    const done = session.stages[key]?.complete;
    return `<div class="night-step" data-done="${done ? "true" : "false"}" ${i === index ? 'aria-current="step"' : ""}><span class="night-step-number">${done ? "✓" : i + 1}</span><span class="night-step-label">${esc(t("stages")[i])}</span></div>`;
  }).join("");
}
function stageHeader(stage) {
  const skill = findSkill(session.skillKey);
  return `<p class="stage-eyebrow">${esc(t("stages")[NIGHT_STAGES.indexOf(stage)])} · ${NIGHT_STAGES.indexOf(stage) + 1} / 5</p><h2 id="stage-title" tabindex="-1">${esc(t("names")[stage])}</h2><p class="stage-copy">${esc(t("desc")[stage])}</p><p class="night-goal">✦ ${esc(t("goal", { skill: skill?.title || "Mathematics" }))}</p>`;
}
function stageActions({ nextLabel = t("next"), canNext = false } = {}) {
  return `<div class="night-actions">${canNext ? `<button class="button button-dark" type="button" data-next-stage>${esc(nextLabel)} <span aria-hidden="true">→</span></button>` : ""}</div>`;
}
function currentItem(stageName) { return session.stages[stageName].items[session.stages[stageName].cursor]; }
function questionStage(stageName) {
  const data = session.stages[stageName];
  const isFamily = stageName === "family";
  const done = data.complete;
  if (done) {
    const label = stageName === "retrieval" ? t("reviewed") : stageName === "independent" ? t("independentDone") : t("familyDone");
    return `${stageHeader(stageName)}<div class="night-complete"><h3>${esc(t("stageFinished"))}</h3><p>${esc(label)}</p></div>${stageActions({ canNext: true })}`;
  }
  const item = currentItem(stageName);
  if (!item) { markNightStageComplete(session, stageName); saveSession(); return render(); }
  const skill = findSkill(item.skillKey);
  const translated = lang === "es" ? questionEs(item) : null;
  const prompt = translated || item.question;
  const status = data.awaitingRetry
    ? `<p class="night-feedback" data-kind="hint" role="status" aria-live="polite">${esc(t("wrong"))}<br>${esc(t("hint", { hint: item.hint || "Look for a relationship in the numbers." }))}</p>`
    : data.hintRevealed ? `<p class="night-feedback" data-kind="hint" role="status" aria-live="polite">${esc(t("hint", { hint: item.hint || "Look for a relationship in the numbers." }))}</p>`
      : data.lastCorrect ? `<p class="night-feedback" data-kind="good" role="status" aria-live="polite">${esc(t("correct"))}</p>` : "";
  const role = isFamily ? `<p class="night-turn"><strong>${esc(t("familyRoles")[0])}</strong><span aria-hidden="true">→</span><strong>${esc(t("familyRoles")[1])}</strong></p><p class="stage-copy">${esc(t("partnerPrompt"))}</p><p class="stage-copy">${esc(t("familySupport"))}</p>` : "";
  const localizedChoices = lang === "es" ? choicesEs(item) || item.choices : item.choices;
  const answer = item.choices?.length ? `<div class="night-answer-choices">${item.choices.map((choice, i) => `<button type="button" class="button button-light" data-choice="${esc(choice)}" ${data.awaitingSolution ? "disabled" : ""}>${esc(localizedChoices[i] ?? choice)}</button>`).join("")}</div>` : `<input id="night-answer" type="text" inputmode="${item.kind === "text" ? "text" : "decimal"}" autocomplete="off" aria-label="${esc(lang === "es" ? "Tu respuesta" : "Your answer")}" ${data.awaitingSolution ? "disabled" : ""}>`;
  const submit = data.awaitingSolution ? `<button class="button button-dark" type="button" data-question-next>${esc(t("next"))}</button>` : `<button class="button button-dark" type="submit">${esc(t("check"))}</button>`;
  const count = t("stageCount", { n: data.cursor + 1, total: data.items.length });
  const solution = data.awaitingSolution ? `<p class="night-feedback" data-kind="hint" role="status" aria-live="polite">${esc(t("solution", { explanation: item.explanation || item.hint || "Check your work with the model." }))}</p>` : "";
  const hintButton = session.support === "extra" && !data.hintRevealed && !data.awaitingRetry && !data.awaitingSolution
    ? `<button class="text-button" type="button" data-show-hint>${esc(t("showHint"))}</button>` : "";
  return `${stageHeader(stageName)}${role}<p class="stage-copy">${esc(count)}${skill ? ` · ${esc(skill.title)}` : ""}</p><div class="night-question"><p>${esc(prompt)}</p><form data-night-answer>${answer}${submit}</form>${hintButton}${status}${solution}</div>${stageActions()}`;
}
function conceptStage() {
  const data = session.stages.concept;
  if (data.complete) return `${stageHeader("concept")}<div class="night-complete"><h3>${esc(t("stageFinished"))}</h3><p>${esc(t("conceptDone"))}</p></div>${stageActions({ canNext: true })}`;
  return `${stageHeader("concept")}<div class="visual-host" id="visual-host"></div>${stageActions()}`;
}
function reflectionStage() {
  const data = session.stages.reflection;
  if (data.complete) return completeStage();
  const choices = t("strategies");
  return `${stageHeader("reflection")}<p class="stage-copy">${esc(t("chooseStrategy"))}</p><fieldset class="strategy-options"><legend class="sr-only">${esc(t("chooseStrategy"))}</legend>${choices.map((choice, i) => `<label><input type="radio" name="strategy" value="s${i}" ${data.strategy === `s${i}` ? "checked" : ""}><span>${esc(choice)}</span></label>`).join("")}</fieldset><p class="stage-copy">${esc(t("reflectionPrompt"))}</p><button class="button button-dark" type="button" data-finish>${esc(t("finish"))}</button>`;
}
function completeStage() {
  const independent = session.stages.independent;
  const family = session.stages.family;
  const next = recommendations(tutor, grade)[0];
  const independentTotal = independent.items.length;
  const nextMessage = next ? `${next.reason}: ${next.skill.title}` : t("noEvidence");
  return `${stageHeader("reflection")}<div class="night-complete"><h3>${esc(t("completeTitle"))}</h3><p>${esc(t("completeCopy"))}</p><p class="night-next-copy">${esc(t("progress", { correct: independent.correct, total: independentTotal, family: family.correct ? "✓" : "●" }))}</p><h3>${esc(t("nextFocus"))}</h3><p class="night-next-copy">${esc(nextMessage)}</p><p class="stage-copy">${esc(t("methodCopy"))}</p><button class="button button-dark" type="button" data-start-fresh>${esc(t("startAgain"))}</button><a class="text-button" href="../?grade=${grade}&profile=${profile}&view=path">${esc(lang === "es" ? "Ver el progreso guardado" : "See saved progress")}</a></div>`;
}
function render() {
  visualCleanup?.(); visualCleanup = null;
  renderHeader(); renderProgress();
  const stage = session.stage;
  if (stage === "retrieval" || stage === "independent" || stage === "family") root.innerHTML = questionStage(stage);
  else if (stage === "concept") {
    root.innerHTML = conceptStage();
    if (!session.stages.concept.complete) {
      visualCleanup = mountVisualLesson(root.querySelector("#visual-host"), findSkill(session.skillKey), {
        onComplete: ({ supported }) => {
          tutor.records[session.skillKey] = { ...(tutor.records[session.skillKey] || {}), lessonCompleted: true };
          if (supported) session.stages.concept.supported = true;
          markNightStageComplete(session, "concept"); saveTutor(); saveSession(); renderProgress();
          root.querySelector(".night-actions").innerHTML = `<button class="button button-dark" type="button" data-next-stage>${esc(t("next"))} <span aria-hidden="true">→</span></button>`;
          queueMicrotask(() => root.querySelector("[data-next-stage]")?.focus());
        },
        onPractice: () => moveForward(),
      });
    }
  } else root.innerHTML = reflectionStage();
}
function moveForward() {
  if (!moveNightStage(session)) return;
  saveSession(); render();
  root.querySelector("h2")?.focus();
}
function answerCurrent(value) {
  const stageName = session.stage;
  const data = session.stages[stageName];
  const item = currentItem(stageName);
  const skill = findSkill(item.skillKey);
  if (!item || !skill) return;
  const correct = validateAnswer(value, item);
  const isFamily = stageName === "family";
  if (!data.awaitingRetry) {
    recordAnswer(tutor, skill, { correct, independent: !isFamily && !data.hintRevealed, level: item.level }, Date.now());
    if (correct) {
      data.correct += 1;
      data.lastCorrect = true;
      data.hintRevealed = false;
      data.cursor += 1;
    } else {
      data.awaitingRetry = true;
      data.lastCorrect = false;
    }
  } else {
    recordAnswer(tutor, skill, { correct, independent: false, level: item.level }, Date.now());
    if (correct) data.correct += 1;
    data.assisted += 1;
    if (correct) {
      data.awaitingRetry = false; data.lastCorrect = true; data.hintRevealed = false; data.cursor += 1;
    } else {
      data.awaitingRetry = false; data.awaitingSolution = true; data.lastCorrect = false;
    }
  }
  saveTutor();
  if (data.cursor >= data.items.length) data.complete = true;
  saveSession(); render();
  (root.querySelector("#night-answer") || root.querySelector("[data-next-stage]") || root.querySelector("[data-question-next]"))?.focus();
}

root.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-night-answer]")) return;
  event.preventDefault();
  const input = event.target.querySelector("#night-answer");
  if (input && !input.value.trim()) { input.focus(); return; }
  if (input) answerCurrent(input.value);
});
root.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  if (target.hasAttribute("data-choice")) answerCurrent(target.dataset.choice);
  if (target.hasAttribute("data-show-hint")) {
    const data = session.stages[session.stage];
    data.hintRevealed = true;
    saveSession(); render();
    root.querySelector("#night-answer")?.focus();
  }
  if (target.hasAttribute("data-next-stage")) moveForward();
  if (target.hasAttribute("data-question-next")) {
    const data = session.stages[session.stage];
    data.cursor += 1; data.awaitingRetry = false; data.awaitingSolution = false; data.hintRevealed = false;
    if (data.cursor >= data.items.length) data.complete = true;
    saveSession(); render();
  }
  if (target.hasAttribute("data-finish")) {
    const checked = root.querySelector('input[name="strategy"]:checked');
    if (!checked) { root.querySelector('input[name="strategy"]')?.focus(); return; }
    session.stages.reflection.strategy = checked.value;
    markNightStageComplete(session, "reflection"); saveSession(); render();
  }
  if (target.hasAttribute("data-start-fresh")) {
    session = newSession();
    saveSession(); render();
  }
});
root.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-choice]");
  if (choice) root.querySelector("#night-answer")?.focus();
});
document.querySelector("#night-language").addEventListener("click", () => {
  lang = lang === "en" ? "es" : "en"; session.lang = lang; setLang(lang); updateUrl(); saveSession(); render();
});
document.querySelector("#night-profile").addEventListener("change", (event) => {
  profile = Number(event.target.value);
  selectProfile(profile);
  tutor = sanitizeTutor(readLocal(profileKey(TUTOR_KEY, profile), emptyTutor()));
  session = restoreSession(profile);
  if (!session) session = newSession();
  updateUrl(); saveSession(); render();
});
window.addEventListener("fluency-storage-unavailable", () => {
  const warning = document.querySelector("#storage-warning");
  warning.textContent = t("failed"); warning.hidden = false;
});

if (!findSkill(session.skillKey) || findSkill(session.skillKey).grade !== grade) {
  session = newSession();
  saveSession();
}
setLang(lang, { persist: !params.has("lang") }); updateUrl(); render();
