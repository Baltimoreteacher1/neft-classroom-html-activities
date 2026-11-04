// EduWonderLab 7.0 unified learning workspace: one screen, one dominant action. Mathematical stage (living model),
// response stage (question + check), "Help me understand" coach, feedback stage. Deep link: ?grade=N&skill=ID.
import { generateProblem, seededRandom, validateAnswer } from "../problem-bank.js";
import { MathVisualEngine, seeded, getModel } from "../e8/engine-core.js";
import { Workspace } from "../e8/model-lab.js";
import { getLang, setLang } from "../i18n.js";
import { bandFor, conceptFor, FLAGSHIPS, stageParams } from "./concepts.js";
import { createCoach } from "./provider.js";
import { MAX_LEVEL } from "./tutor.js";
import { loadProgress, record } from "./store.js";
import { recommend } from "./learner.js";

const q = new URLSearchParams(location.search);
const pickLang = (o) => (o && typeof o === "object" ? o[getLang() === "es" ? "es" : "en"] : o);
const L = (en, es) => (getLang() === "es" ? es : en);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const $ = (s) => document.querySelector(s);

const grade = Math.min(8, Math.max(1, Number(q.get("grade")) || 4));
const wanted = q.get("skill");
const progress = loadProgress();
const flagship = FLAGSHIPS.find((f) => f.grade === grade);
let key = [wanted && `${grade}:${wanted}`, wanted, flagship?.skill].filter(Boolean).map((k) => conceptFor(k)).find(Boolean)?.key;
if (!key) key = recommend({ grade, progress }).key;
const concept = conceptFor(key);
document.body.dataset.band = bandFor(concept.grade).id;

const coach = createCoach({}); // no endpoint configured: deterministic coach only
let seed = Number(q.get("seed")) || 1 + Math.floor(Math.random() * 9999);
let item, level = 0, attempts = 0, solved = false;

function render() {
  $("#v7-title").textContent = pickLang(concept.title);
  $("#v7-meta").textContent = `${L("Grade", "Grado")} ${concept.grade} · ${concept.standard || ""}`;
  $("#v7-lang").textContent = getLang() === "es" ? "English" : "Español";
  document.documentElement.lang = getLang();
  $("#v7-ask-label").textContent = L("What is the answer?", "¿Cuál es la respuesta?");
  $("#v7-check").textContent = L("Check", "Comprobar");
  $("#v7-help").textContent = L("Help me understand", "Ayúdame a entender");
  $("#v7-next").textContent = L("Another one", "Otro");
  $("#v7-show").textContent = L("Show my problem in the picture", "Mostrar mi problema en el dibujo");
  $("#v7-show").hidden = !(attempts >= 1 && stageId && stageParams(stageId, item.question));
  $("#v7-stage-h").textContent = L("See it", "Velo");
  $("#v7-resp-h").textContent = L("Try it", "Inténtalo");
  $("#v7-coach-h").textContent = L("Coach", "Entrenador");
  $("#v7-back").textContent = L("← Fluency Lab", "← Laboratorio de fluidez");
  $("#v7-q").textContent = item.question;
}

let ws = null;
let stageId = null;
function mountStage(exact = false) {
  const host = $("#v7-model");
  const id = (flagship && key === flagship.skill ? flagship.model : null) || concept.primaryModel;
  stageId = id;
  if (!id || !getModel(id)) { host.innerHTML = `<p class="v7-meta">${esc(L("This skill has no picture yet — the coach can still help.", "Esta destreza aún no tiene dibujo; el entrenador aún puede ayudar."))}</p>`; ws = null; return; }
  const model = getModel(id);
  // By default the picture is a PARALLEL example (different numbers), so it cannot hand over the answer before an attempt.
  const params = (exact && stageParams(id, item.question)) || model.generate(seeded(seed * 31 + id.length), concept.grade);
  $("#v7-stage-note").textContent = exact && stageParams(id, item.question) ? L("This picture shows your problem.", "Este dibujo muestra tu problema.") : L("A similar example — change it and watch the numbers.", "Un ejemplo parecido: cámbialo y mira los números.");
  if (!ws) ws = new Workspace(host);
  ws.show(new MathVisualEngine(id, params));
}

function newItem() {
  item = generateProblem(concept.skill, seededRandom(seed));
  level = 0; attempts = 0; solved = false;
  $("#v7-answer").value = "";
  $("#v7-feedback").textContent = "";
  $("#v7-feedback").className = "v7-feedback";
  $("#v7-log").innerHTML = "";
  mountStage();
  render();
}

function say(msg, cls = "") {
  const f = $("#v7-feedback");
  f.textContent = msg;
  f.className = `v7-feedback ${cls}`;
}

async function help(response) {
  const move = await coach.ask({ concept, item, response, level, lang: getLang() });
  level = move.level;
  const li = document.createElement("li");
  li.textContent = pickLang(move.text) + (move.kind === "reveal" ? "" : "");
  $("#v7-log").appendChild(li);
  if (move.kind === "reveal") { solved = true; record(key, false); }
  return move;
}

$("#v7-check").addEventListener("click", async () => {
  const value = $("#v7-answer").value.trim();
  if (!value) { say(L("Type an answer first.", "Escribe una respuesta primero."), "try"); $("#v7-answer").focus(); return; }
  if (solved) return;
  attempts += 1;
  $("#v7-show").hidden = !(stageId && stageParams(stageId, item.question));
  if (validateAnswer(value, item)) {
    solved = true; record(key, true);
    say(L("Yes — that works!", "¡Sí, funciona!"), "ok");
    $("#v7-next").focus();
  } else {
    say(L("Not yet. Let's look closer.", "Todavía no. Miremos más de cerca."), "try");
    await help(value);
  }
});
$("#v7-answer").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#v7-check").click(); });
$("#v7-help").addEventListener("click", async () => {
  if (solved) return;
  // The coach is available before a first attempt, but the full solution is not: make one try first.
  if (attempts < 1 && level >= MAX_LEVEL - 1) {
    $("#v7-log").insertAdjacentHTML("beforeend", `<li>${esc(L("Make one try first, then I can show the whole solution.", "Haz un intento primero y luego te muestro la solución completa."))}</li>`);
    return;
  }
  await help($("#v7-answer").value.trim());
});
$("#v7-show").addEventListener("click", () => { mountStage(true); });
$("#v7-next").addEventListener("click", () => { seed += 1; newItem(); $("#v7-answer").focus(); });
$("#v7-lang").addEventListener("click", () => { setLang(getLang() === "es" ? "en" : "es"); render(); });

newItem();
window.__v7 = { get key() { return key; }, get item() { return item; }, coach };
