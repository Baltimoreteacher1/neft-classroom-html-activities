import { GRADES } from "../problem-bank.js";
import { emptyTutor, recommendations, sanitizeTutor } from "../tutor-engine.js";
import { PROFILE_NAMES, profileKey, profiles, readLocal, selectProfile, writeLocal } from "../school-tools.js";
import { getLang, setLang } from "../i18n.js";
import { familyLaunch, familySessionLaunch } from "./family-planner.js";
import { familyCoaching } from "./family-coaching.js";
import { familyWeeklyReport } from "./family-report.js";

const TUTOR_KEY = "ewl-fluency-tutor-v2";
const SETTINGS_KEY = "ewl-fluency-settings-v1";
const COPY = {
  en: {
    heading: "Make room for a math moment.", intro: "A short practice path, one good question, and a chance to notice how your learner thinks.", start: "Start tonight’s math", progress: "See this learner’s progress", privacy: "Progress stays on this device. No account is needed.",
    actions: ["Tonight’s Math", "Choose a Grade", "Practice a Skill", "Play Together", "My Progress"],
    storageWarning: "This browser could not save a family setting. You can keep practicing, but close the page only after the Fluency Lab confirms the learner’s progress is saved.",
    descriptions: ["A five-part learning mission chosen from real practice evidence.", "Find a comfortable place to begin.", "Choose a topic and practice with fresh questions.", "Solve, build, and explain as a team.", "See skills growing and what could come next."],
    kicker: "A GOOD PLACE TO START", gradeTitle: "Choose a grade", gradeIntro: "Pick the learner’s current grade. Practice can still revisit earlier ideas when that helps.", selected: "Selected: {grade}. Skill suggestions are based on this grade and this learner’s saved evidence.",
    skillKicker: "A SMALL, USEFUL NEXT STEP", skillTitle: "Pick a skill", skillIntro: "These suggestions come from the learner’s saved practice. With little evidence, start with a new idea.", skillLabel: "Choose another skill", openSkill: "Open this skill", noEvidence: "We don’t have enough saved practice to spot a next step yet. Here is a good place to explore.", evidence: "{n} independent checks · {pct}% recently correct", review: "Ready to revisit based on recent practice", new: "A new idea to explore", recommendation: "Suggested next: {title}",
    weekKicker: "PICK ANY DAY, ANY TIME", weekTitle: "Seven ways into math", weekIntro: "Missed a day? No problem. Every option is open whenever it works for your family.",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], modes: ["Math Mission", "Fluency Builder", "Family Game Night", "Math Detective", "Challenge Quest", "Real-World Math", "Math Memory Mix"], modeDesc: ["A five-step path toward a grade-level idea.", "Practice a skill with fresh questions.", "Explore cooperative math games.", "Try a short starting-point checkup.", "Take an independent step at your own pace.", "Try familiar story problems when they fit the skill.", "Review ideas chosen from recent evidence."],
    coachKicker: "A HELPFUL QUESTION", coachTitle: "Try this together", goal: "Learning focus: {title}", ask: "“Can you show me how you figured this out? What did you notice first?”", thinking: "Look for: a drawing, model, equation, or words that make the learner’s strategy visible.", stuck: "If they get stuck: return to the first step in the visual lesson and solve one small part together.", print: "Print this coaching card ↗", bottom: "There is no perfect pace. A short conversation about how a solution works is meaningful mathematics.", lab: "Explore the full Fluency Lab →", back: "Back to the Fluency Lab", caregiver: "Caregiver", learner: "Learner", printTitle: "Family Math Coaching Card", profile: "Choose learner profile", family: "FAMILY MATH", dayAny: "Open this activity", reportUnavailable: "No progress evidence is saved for this learner yet.", weekReportKicker: "A LOOK BACK, WITH CARE", weekReportTitle: "Practice this week", weekReportIntro: "A simple summary of saved practice from the last seven days. Supported checks stay separate from independent checks.", weekNone: "No practice is recorded for the last seven days. New practice will appear here after it is saved.", weekIndependent: "Independent checks", weekCorrect: "correct", weekSupported: "checks with support", weekSkills: "Recent skills", weekDue: "Skills to revisit", weekSuggested: "Next suggested practice", weekPrint: "Print weekly summary", weekChecksFor: "independent checks", weekCheckFor: "independent check", weekSupportedFor: "supported checks", weekSupportedForOne: "supported check", weekNoIndependent: "No independent checks yet", weekNoDue: "No skills are currently marked due for review.", weekPrintTitle: "Family practice this week",
  },
  es: {
    heading: "Hagamos un momento para las matemáticas.", intro: "Una práctica breve, una buena pregunta y una oportunidad para descubrir cómo piensa tu estudiante.", start: "Comenzar las matemáticas de hoy", progress: "Ver el progreso de este estudiante", privacy: "El progreso queda en este dispositivo. No se necesita una cuenta.",
    actions: ["Matemáticas de hoy", "Elegir un grado", "Practicar una destreza", "Jugar juntos", "Mi progreso"],
    storageWarning: "Este navegador no pudo guardar un ajuste familiar. Pueden seguir practicando, pero cierren la página solo después de que el laboratorio confirme que guardó el progreso.",
    descriptions: ["Una misión de cinco pasos elegida con evidencia de práctica.", "Busca un buen punto para comenzar.", "Elige un tema y practica con preguntas nuevas.", "Resuelvan, construyan y expliquen en equipo.", "Mira qué destrezas crecen y qué sigue."],
    kicker: "UN BUEN LUGAR PARA COMENZAR", gradeTitle: "Elige un grado", gradeIntro: "Elige el grado actual. La práctica puede volver a ideas anteriores cuando sea útil.", selected: "Seleccionado: {grade}. Las sugerencias usan este grado y la evidencia guardada del estudiante.",
    skillKicker: "UN SIGUIENTE PASO PEQUEÑO Y ÚTIL", skillTitle: "Elige una destreza", skillIntro: "Estas sugerencias vienen de la práctica guardada. Con poca evidencia, comienza con una idea nueva.", skillLabel: "Elige otra destreza", openSkill: "Abrir esta destreza", noEvidence: "Todavía no hay suficiente práctica guardada para sugerir un siguiente paso. Aquí hay una buena idea para explorar.", evidence: "{n} comprobaciones independientes · {pct}% correctas recientemente", review: "Lista para repasar según la práctica reciente", new: "Una idea nueva para explorar", recommendation: "Sugerencia: {title}",
    weekKicker: "ELIGE CUALQUIER DÍA", weekTitle: "Siete maneras de explorar las matemáticas", weekIntro: "¿No pudieron practicar un día? No pasa nada. Todas las opciones están disponibles cuando les convenga.",
    days: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"], modes: ["Misión matemática", "Práctica fluida", "Noche de juegos", "Detectives matemáticos", "Reto", "Matemáticas cotidianas", "Repaso de memoria"], modeDesc: ["Un camino de cinco pasos hacia una idea del grado.", "Practica una destreza con preguntas nuevas.", "Explora juegos matemáticos cooperativos.", "Prueba una evaluación inicial breve.", "Intenta un paso independiente a tu ritmo.", "Prueba problemas cotidianos cuando encajen con la destreza.", "Repasa ideas elegidas con evidencia reciente."],
    coachKicker: "UNA PREGUNTA ÚTIL", coachTitle: "Prueben juntos", goal: "Enfoque de aprendizaje: {title}", ask: "«¿Cómo encontraste la respuesta? ¿Qué notaste primero?»", thinking: "Observa si usa un dibujo, modelo, ecuación o palabras para explicar su estrategia.", stuck: "Si se atasca: vuelvan al primer paso de la lección visual y resuelvan juntos una parte pequeña.", print: "Imprimir esta tarjeta ↗", bottom: "No hay un ritmo perfecto. Hablar un poco sobre cómo funciona una solución también es aprender matemáticas.", lab: "Explorar el laboratorio de matemáticas →", back: "Volver al laboratorio", caregiver: "Familiar", learner: "Estudiante", printTitle: "Tarjeta para acompañar las matemáticas", profile: "Elegir perfil", family: "MATEMÁTICAS EN FAMILIA", dayAny: "Abrir esta actividad", reportUnavailable: "Todavía no hay evidencia de progreso guardada para este estudiante.", weekReportKicker: "UN REPASO CON CUIDADO", weekReportTitle: "Práctica de esta semana", weekReportIntro: "Un resumen sencillo de la práctica guardada en los últimos siete días. Las comprobaciones con apoyo se muestran aparte de las independientes.", weekNone: "No hay práctica registrada en los últimos siete días. La práctica nueva aparecerá aquí después de guardarse.", weekIndependent: "Comprobaciones independientes", weekCorrect: "correctas", weekSupported: "comprobaciones con apoyo", weekSkills: "Destrezas recientes", weekDue: "Destrezas para repasar", weekSuggested: "Siguiente práctica sugerida", weekPrint: "Imprimir resumen semanal", weekChecksFor: "comprobaciones independientes", weekCheckFor: "comprobación independiente", weekSupportedFor: "comprobaciones con apoyo", weekSupportedForOne: "comprobación con apoyo", weekNoIndependent: "Aún no hay comprobaciones independientes", weekNoDue: "No hay destrezas marcadas para repasar por ahora.", weekPrintTitle: "Práctica familiar de esta semana",
  },
};
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
let lang = getLang();
let household = profiles();
let profile = household.active;
let grade = Number(readLocal(profileKey(`${SETTINGS_KEY}:grade`, profile), 1));
if (!GRADES.some((item) => item.grade === grade)) grade = 1;
let skills = [];
let recommendation = null;
const t = (key) => COPY[lang][key] || COPY.en[key] || key;
const target = (params = {}) => familyLaunch({ grade, profile, ...params });
const safeTutor = () => sanitizeTutor(readLocal(profileKey(TUTOR_KEY, profile), emptyTutor()));
function getPreferredSkill() {
  const list = recommendations(safeTutor(), grade);
  return list.find((item) => item.status.due || item.status.recent.length) || list[0];
}
function updateLinks() {
  const mission = familySessionLaunch({ grade, profile, skill: recommendation?.skill.id || skills[0]?.id, lang });
  document.querySelector("#tonight-link").href = mission;
  document.querySelector("#tonight-card").href = mission;
  document.querySelector("#progress-link").href = target({ view: "path" });
  document.querySelector("#games-link").href = target({ view: "games" });
  document.querySelector("#lab-link").href = target();
  if (recommendation) document.querySelector("#skill-start").href = target({ skill: recommendation.skill.id, start: "practice" });
}
function updateGrade() {
  const buttons = document.querySelectorAll(".grade-option");
  for (const button of buttons) button.setAttribute("aria-pressed", String(Number(button.dataset.grade) === grade));
  const selectedGrade = GRADES.find((item) => item.grade === grade)?.label || `Grade ${grade}`;
  const localizedGrade = grade === 0 ? (lang === "es" ? "Jardín de niños" : "Kindergarten") : (lang === "es" ? `Grado ${grade}` : selectedGrade);
  document.querySelector("#grade-selected").textContent = t("selected").replace("{grade}", localizedGrade);
  writeLocal(profileKey(`${SETTINGS_KEY}:grade`, profile), grade);
  skills = GRADES.find((item) => item.grade === grade)?.skills || [];
  document.querySelector("#skill-select").innerHTML = skills.map((skill) => `<option value="${esc(skill.id)}">${esc(skill.title)} · ${esc(skill.strand)}</option>`).join("");
  recommendation = getPreferredSkill();
  renderRecommendation();
  renderCoach();
  renderWeeklyReport();
  updateLinks();
}
function renderRecommendation() {
  if (!recommendation) return;
  const s = recommendation.status;
  const evidenceText = s.independent
    ? t("evidence").replace("{n}", String(s.independent)).replace("{pct}", String(Math.round((s.ratio || 0) * 100)))
    : recommendation.reason === "Explore something new" ? t("noEvidence") : t("new");
  document.querySelector("#recommended-skill").innerHTML = `<strong>${esc(recommendation.skill.title)}</strong><p>${esc(evidenceText)}${s.due ? ` · <span class="status-pill">${esc(t("review"))}</span>` : ""}</p>`;
  document.querySelector("#skill-select").value = recommendation.skill.id;
  document.querySelector("#skill-start").href = target({ skill: recommendation.skill.id, start: "practice" });
  document.querySelector("#skill-start").innerHTML = `${esc(t("openSkill"))} <span aria-hidden="true">→</span>`;
}
function renderCoach() {
  const skill = recommendation?.skill;
  if (!skill) return;
  const coaching = familyCoaching(skill, recommendation.status, lang);
  document.querySelector("#coach-content").innerHTML = `<p class="coach-goal">${esc(t("goal").replace("{title}", skill.title))}</p><p class="coach-evidence" role="status">${esc(coaching.evidence)}</p><p class="coach-quote">“${esc(coaching.ask)}”</p><p class="coach-help"><strong>${lang === "es" ? "Escucha si:" : "Listen for:"}</strong> ${esc(coaching.lookFor)}</p><p class="coach-help"><strong>${lang === "es" ? "Si necesita ayuda:" : "If they need help:"}</strong> ${esc(coaching.ifStuck)}</p><p class="coach-help"><strong>${lang === "es" ? "Reconoce:" : "Acknowledge:"}</strong> ${esc(coaching.acknowledge)}</p>`;
}
function renderWeeklyReport() {
  const report = familyWeeklyReport(safeTutor(), grade);
  const root = document.querySelector("#family-week-report");
  if (!report.available) {
    root.innerHTML = `<p class="panel-intro">${esc(t("weekNone"))}</p>`;
    return;
  }
  const recent = report.skills.map((row) => `<li><strong>${esc(row.title)}</strong><span>${row.checks ? `${row.correct}/${row.checks} ${esc(t(row.checks === 1 ? "weekCheckFor" : "weekChecksFor"))}` : esc(t("weekNoIndependent"))} · ${row.supported} ${esc(t(row.supported === 1 ? "weekSupportedForOne" : "weekSupportedFor"))}</span></li>`).join("");
  const due = report.due.length ? `<ul>${report.due.map((title) => `<li>${esc(title)}</li>`).join("")}</ul>` : `<p>${esc(t("weekNoDue"))}</p>`;
  root.innerHTML = `<p class="panel-intro">${esc(t("weekReportIntro"))}</p><div class="week-report-totals"><p><strong>${report.totals.independent}</strong><span>${esc(t("weekIndependent"))} · ${report.totals.correct} ${esc(t("weekCorrect"))}</span></p><p><strong>${report.totals.supported}</strong><span>${esc(t("weekSupported"))}</span></p></div><h3>${esc(t("weekSkills"))}</h3><ul class="week-skill-list">${recent}</ul><h3>${esc(t("weekDue"))}</h3>${due}<p class="week-suggested"><strong>${esc(t("weekSuggested"))}:</strong> ${esc(report.suggested || "—")}</p>`;
}
function printWeeklyReport() {
  const section = document.querySelector("#family-week-panel");
  const printWindow = window.open("", "_blank", "width=700,height=700");
  const html = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>${esc(t("weekPrintTitle"))}</title><style>body{font:16px/1.6 system-ui,sans-serif;max-width:660px;margin:36px auto;padding:0 20px;color:#20233d}h1,h2,h3{font-family:Georgia,serif}li{margin:.4rem 0}p{margin:.8rem 0}</style><h1>${esc(t("weekPrintTitle"))}</h1>${section.querySelector("#family-week-report").innerHTML}</html>`;
  if (printWindow) { printWindow.document.write(html); printWindow.document.close(); printWindow.focus(); printWindow.print(); return; }
  const frame = document.createElement("iframe"); frame.title = t("weekPrintTitle"); frame.style.cssText = "position:fixed;width:1px;height:1px;left:-10px;bottom:0;border:0"; frame.srcdoc = html;
  frame.onload = () => { frame.contentWindow.print(); window.setTimeout(() => frame.remove(), 1000); }; document.body.append(frame);
}

function renderRotation() {
  const modeLinks = [
    familySessionLaunch({ grade, profile, skill: recommendation?.skill.id || skills[0]?.id, lang }),
    recommendation ? target({ skill: recommendation.skill.id, start: "practice" }) : target({ start: "daily" }),
    target({ view: "games" }),
    target({ start: "checkup" }),
    target({ start: "mission" }),
    target({ start: "realworld" }),
    target({ start: "daily" }),
  ];
  document.querySelector("#rotation-list").innerHTML = t("modes").map((mode, i) => `<a class="rotation-row" href="${esc(modeLinks[i])}"><span class="rotation-day">${esc(t("days")[i].slice(0, 2))}</span><span><strong>${esc(mode)}</strong><small>${esc(t("modeDesc")[i])}</small></span><span class="rotation-arrow" aria-hidden="true">↗</span></a>`).join("");
}
function renderProfiles() {
  household = profiles();
  const select = document.querySelector("#family-profile");
  select.innerHTML = household.ids.map((id) => `<option value="${id}" ${id === profile ? "selected" : ""}>${esc(t("learner"))} ${id + 1} · ${esc(PROFILE_NAMES[id])}</option>`).join("");
  const add = PROFILE_NAMES.findIndex((_, id) => !household.ids.includes(id));
  if (add >= 0) select.insertAdjacentHTML("beforeend", `<option value="add:${add}">+ ${lang === "es" ? "Agregar estudiante" : "Add learner"}</option>`);
}
function applyLanguage() {
  const selectedSkillId = recommendation?.skill.id;
  document.documentElement.lang = lang;
  document.querySelector("#welcome-title").textContent = t("heading");
  document.querySelector("#welcome-text").textContent = t("intro");
  document.querySelector(".welcome-secondary").textContent = t("progress");
  document.querySelector("#tonight-link").firstChild.textContent = `${t("start")} `;
  document.querySelector("#tonight-card").querySelector("strong").textContent = t("actions")[0];
  document.querySelector("#tonight-card").querySelector("small").textContent = t("descriptions")[0];
  document.querySelectorAll(".action-card").forEach((card, i) => {
    card.querySelector("strong").textContent = t("actions")[i];
    card.querySelector("small").textContent = t("descriptions")[i];
  });
  document.querySelector("#privacy-note").textContent = t("privacy");
  document.querySelector("#grade-kicker").textContent = t("kicker");
  document.querySelector("#grade-heading").textContent = t("gradeTitle");
  document.querySelector("#grade-description").textContent = t("gradeIntro");
  document.querySelector("#skill-kicker").textContent = t("skillKicker");
  document.querySelector("#skill-heading").textContent = t("skillTitle");
  document.querySelector("#skill-description").textContent = t("skillIntro");
  document.querySelector("#skill-label").textContent = t("skillLabel");
  document.querySelector("#week-kicker").textContent = t("weekKicker");
  document.querySelector("#rotation-heading").textContent = t("weekTitle");
  document.querySelector("#rotation-intro").textContent = t("weekIntro");
  document.querySelector("#week-report-kicker").textContent = t("weekReportKicker");
  document.querySelector("#week-report-heading").textContent = t("weekReportTitle");
  document.querySelector("#print-week-report").textContent = t("weekPrint");
  document.querySelector("#coach-kicker").textContent = t("coachKicker");
  document.querySelector("#coach-heading").textContent = t("coachTitle");
  document.querySelector("#print-coach").textContent = t("print");
  document.querySelector("#bottom-copy").innerHTML = `<strong>${esc(t("bottom").split(".")[0])}.</strong>${esc(t("bottom").split(".").slice(1).join("."))}`;
  document.querySelector("#lab-link").textContent = t("lab");
  document.querySelector("footer a").textContent = t("back");
  document.querySelector(".profile-label").textContent = t("caregiver");
  document.querySelector("#family-profile").setAttribute("aria-label", t("profile"));
  document.querySelector("#language-toggle").textContent = lang === "en" ? "Español" : "English";
  document.querySelectorAll(".grade-option").forEach((button) => { const gradeNumber = Number(button.dataset.grade); button.textContent = gradeNumber === 0 ? (lang === "es" ? "Jardín de niños" : "Kindergarten") : lang === "es" ? `Grado ${gradeNumber}` : `Grade ${gradeNumber}`; });
  renderProfiles(); updateGrade();
  if (selectedSkillId && skills.some((skill) => skill.id === selectedSkillId)) {
    const selectedRecommendation = recommendations(safeTutor(), grade).find((entry) => entry.skill.id === selectedSkillId);
    if (selectedRecommendation) {
      recommendation = selectedRecommendation;
      renderRecommendation(); renderCoach(); updateLinks();
    }
  }
  renderRotation();
}

document.querySelector("#grade-options").innerHTML = GRADES.map(({ grade: number, label }) => `<button class="grade-option" type="button" data-grade="${number}" aria-pressed="false">${number === 0 ? "Kindergarten" : label}</button>`).join("");
document.querySelector("#grade-options").addEventListener("click", (event) => {
  const button = event.target.closest("[data-grade]");
  if (!button) return;
  grade = Number(button.dataset.grade);
  updateGrade(); renderRotation();
});
document.querySelector("#skill-select").addEventListener("change", (event) => {
  const selected = skills.find((skill) => skill.id === event.target.value);
  if (!selected) return;
  recommendation = { ...recommendations(safeTutor(), grade).find((item) => item.skill.id === selected.id), skill: selected };
  renderRecommendation(); renderCoach(); renderRotation(); updateLinks();
});
document.querySelector("#family-profile").addEventListener("change", (event) => {
  const selected = event.target.value;
  if (selected.startsWith("add:")) {
    profile = Number(selected.slice(4));
    selectProfile(profile);
  } else { profile = Number(selected); selectProfile(profile); }
  grade = Number(readLocal(profileKey(`${SETTINGS_KEY}:grade`, profile), 1));
  if (!GRADES.some((item) => item.grade === grade)) grade = 1;
  updateGrade(); renderProfiles();
});
document.querySelector("#language-toggle").addEventListener("click", () => { lang = lang === "en" ? "es" : "en"; setLang(lang); applyLanguage(); });
document.querySelector("#print-week-report").addEventListener("click", printWeeklyReport);
document.querySelector("#print-coach").addEventListener("click", () => {
  const title = recommendation?.skill.title || "Math";
  const content = document.querySelector("#coach-content").innerHTML;
  const printWindow = window.open("", "_blank", "width=700,height=700");
  const documentHtml = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>${esc(t("printTitle"))}</title><style>body{font:17px/1.6 system-ui,sans-serif;max-width:620px;margin:40px auto;padding:0 20px;color:#20233d}h1{font:600 30px Georgia}p{margin:14px 0}.coach-quote{border-left:3px solid #7fb69a;padding-left:14px}</style><h1>${esc(t("printTitle"))}</h1><p><strong>${esc(title)}</strong></p>${content}</html>`;
  if (printWindow) {
    printWindow.document.write(documentHtml);
    printWindow.document.close(); printWindow.focus(); printWindow.print();
    return;
  }
  const frame = document.createElement("iframe");
  frame.title = t("printTitle");
  frame.style.cssText = "position:fixed;width:1px;height:1px;left:-10px;bottom:0;border:0";
  frame.srcdoc = documentHtml;
  frame.onload = () => { frame.contentWindow.print(); window.setTimeout(() => frame.remove(), 1000); };
  document.body.append(frame);
});

document.querySelector("#tonight-title").textContent = t("actions")[0];
document.querySelector("#grade-action").textContent = t("actions")[1];
document.querySelector("#skill-action").textContent = t("actions")[2];
document.querySelector("#games-action").textContent = t("actions")[3];
document.querySelector("#progress-action").textContent = t("actions")[4];
window.addEventListener("fluency-storage-unavailable", () => {
  const warning = document.querySelector("#family-storage-warning");
  warning.textContent = t("storageWarning");
  warning.hidden = false;
});
renderProfiles();
applyLanguage();
