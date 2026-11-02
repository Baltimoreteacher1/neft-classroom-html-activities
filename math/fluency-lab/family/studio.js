// Family Math Studio page: a short plan from this learner's saved practice, in English or Spanish. The page reads the
// same local records as the rest of the family area and sends nothing anywhere.
import { GRADES } from "../problem-bank.js";
import { emptyTutor, sanitizeTutor } from "../tutor-engine.js";
import { PROFILE_NAMES, profileKey, profiles, readLocal, selectProfile } from "../school-tools.js";
import { getLang, setLang } from "../i18n.js";
import { E8_KEY, sanitizeE8 } from "../e8/e8-store.js";
import { AVOID, MINUTES, buildTonight, planText } from "../e8/family-studio.js";
import { auditE8, checkRoundTrip, storageReport } from "../e8/data-integrity.js";
import { buildPacket } from "../e8/print-engine.js";

const TUTOR_KEY = "ewl-fluency-tutor-v2";
const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]);

let lang = params.get("lang") === "es" ? "es" : getLang() === "es" ? "es" : "en";
let household = profiles();
let profile = Number.isInteger(Number(params.get("profile"))) && params.has("profile") ? Number(params.get("profile")) : household.active;
if (!household.ids.includes(profile)) profile = household.active;
let minutes = MINUTES.includes(Number(params.get("minutes"))) ? Number(params.get("minutes")) : 10;
let grade = null;

const T = (en, es) => (lang === "es" ? es : en);
const tutor = () => sanitizeTutor(readLocal(profileKey(TUTOR_KEY, profile), emptyTutor()));
const e8 = () => sanitizeE8(readLocal(profileKey(E8_KEY, profile), null));
// The grade this learner has practiced most; a new learner starts at the grade in the link, or Grade 1.
function defaultGrade() {
  const asked = Number(params.get("grade"));
  if (GRADES.some((g) => g.grade === asked)) return asked;
  const counts = {};
  for (const key of Object.keys(tutor().records)) counts[key.split(":")[0]] = (counts[key.split(":")[0]] || 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const g = top ? Number(top[0]) : 1;
  return GRADES.some((x) => x.grade === g) ? g : 1;
}

function renderControls() {
  $("fs-controls").innerHTML = `<label>${esc(T("Grade", "Grado"))}<select name="grade">${GRADES.map((g) => `<option value="${g.grade}" ${g.grade === grade ? "selected" : ""}>${esc(g.grade === 0 ? T("Kindergarten", "Kínder") : T(`Grade ${g.grade}`, `Grado ${g.grade}`))}</option>`).join("")}</select></label><fieldset><legend>${esc(T("Time you have", "Tiempo que tienen"))}</legend>${MINUTES.map((m) => `<label class="fs-radio"><input type="radio" name="minutes" value="${m}" ${m === minutes ? "checked" : ""}> ${esc(T(`${m} minutes`, `${m} minutos`))}</label>`).join("")}</fieldset>`;
}

function renderPlan() {
  const plan = buildTonight({ tutor: tutor(), e8: e8(), grade, minutes });
  $("fs-plan").innerHTML = `<p class="fs-note">${esc(plan.evidence.note[lang])}</p><ol class="fs-list">${plan.activities
    .map(
      (a) =>
        `<li class="fs-card"><h2>${esc(a.verb[lang])}: ${esc(a.title)} <small>${esc(T(`${a.minutes} min`, `${a.minutes} min`))}</small></h2><p>${esc(a.doThis[lang])}</p><h3>${esc(T("Ask", "Pregunta"))}</h3><ul>${a.ask.map((q) => `<li>${esc(q[lang])}</li>`).join("")}</ul><p class="fs-why">${esc(a.why?.[lang] ?? a.why ?? "")}</p></li>`,
    )
    .join("")}</ol><div class="fs-avoid"><h2>${esc(T("Helpful to avoid", "Conviene evitar"))}</h2><ul>${AVOID.map((a) => `<li>${esc(a[lang])}</li>`).join("")}</ul></div><p class="fs-note">${esc(plan.supportNote[lang])}</p><div class="fs-actions"><button type="button" id="fs-copy">${esc(T("Copy this plan", "Copiar este plan"))}</button><button type="button" id="fs-print">${esc(T("Print a practice page", "Imprimir una página de práctica"))}</button><span id="fs-status" role="status"></span></div>`;
  $("fs-copy").onclick = async () => {
    try {
      await navigator.clipboard.writeText(planText(plan, lang));
      $("fs-status").textContent = T("Copied.", "Copiado.");
    } catch {
      $("fs-status").textContent = T("Copy was blocked. Select the text and copy it.", "No se pudo copiar. Selecciona el texto y cópialo.");
    }
  };
  $("fs-print").onclick = () => {
    const keys = plan.activities.map((a) => a.key);
    const packet = buildPacket({ skills: keys, count: 8, level: 1, seed: (Date.now() / 86400000) | 0, language: lang, title: T("Math together", "Matemáticas juntos") });
    const win = window.open("", "_blank");
    if (!win) {
      $("fs-status").textContent = T("The pop-up was blocked. Allow pop-ups to print.", "Se bloqueó la ventana. Permite ventanas emergentes para imprimir.");
      return;
    }
    win.document.write(packet.student.replace("pe-note", "pe-note"));
    win.document.close();
    win.focus();
    win.print();
  };
}

function renderHealth() {
  const store = storageReport(globalThis.localStorage);
  const record = readLocal(profileKey(E8_KEY, profile), null);
  const audit = auditE8(record);
  const round = checkRoundTrip(record);
  const healthy = !store.unreadable.length && audit.ok && round.ok;
  $("fs-health").innerHTML = `<h2 id="fs-health-title">${esc(T("Is my data healthy?", "¿Están sanos mis datos?"))}</h2><p>${esc(T("All progress lives only in this browser. This check reads it here and sends nothing.", "Todo el progreso vive solo en este navegador. Esta revisión lo lee aquí y no envía nada."))}</p><p role="status"><b>${esc(healthy ? T("Everything looks fine.", "Todo se ve bien.") : T("Something needs attention.", "Algo necesita atención."))}</b> ${esc(T(`${store.keys.length} saved items, about ${Math.round(store.bytes / 1024)} KB.`, `${store.keys.length} elementos guardados, unos ${Math.round(store.bytes / 1024)} KB.`))}</p>${store.unreadable.length ? `<p>${esc(T(`${store.unreadable.length} saved item(s) could not be read. Save a backup from the Math Fluency Lab (Progress, Save a backup) before clearing browser data.`, `${store.unreadable.length} elemento(s) guardado(s) no se pudo leer. Guarda una copia desde el Laboratorio de fluidez antes de borrar los datos del navegador.`))}</p>` : ""}<p>${esc(T("Tip: save a backup file now and then, because clearing browser data erases progress.", "Consejo: guarda de vez en cuando un archivo de copia, porque borrar los datos del navegador borra el progreso."))}</p>`;
}

function renderChrome() {
  document.documentElement.lang = lang;
  document.title = T("Family Math Studio · Family Math Tonight", "Estudio de matemáticas en familia · Matemáticas en familia");
  $("fs-title").textContent = T("Family Math Studio", "Estudio de matemáticas en familia");
  $("fs-intro").textContent = T("A short plan with no materials needed. It comes from this learner's saved practice, and it never ranks or labels a child.", "Un plan corto que no necesita materiales. Viene de la práctica guardada de este estudiante y nunca clasifica ni etiqueta a un niño.");
  $("fs-back").textContent = T("← Back to family math", "← Volver a matemáticas en familia");
  $("fs-language").textContent = lang === "es" ? "English" : "Español";
  document.querySelector(".profile-label").textContent = T("Learner", "Estudiante");
  $("fs-profile").innerHTML = household.ids.map((id) => `<option value="${id}" ${id === profile ? "selected" : ""}>${esc(PROFILE_NAMES[id])}</option>`).join("");
}

function renderAll() {
  renderChrome();
  renderControls();
  renderPlan();
  renderHealth();
}

grade = defaultGrade();
$("fs-language").onclick = () => {
  lang = lang === "es" ? "en" : "es";
  setLang(lang);
  renderAll();
};
$("fs-profile").onchange = (e) => {
  profile = Number(e.target.value);
  selectProfile(profile);
  grade = defaultGrade();
  renderAll();
};
$("fs-controls").onchange = (e) => {
  if (e.target.name === "grade") grade = Number(e.target.value);
  if (e.target.name === "minutes") minutes = Number(e.target.value);
  renderPlan();
};
renderAll();
