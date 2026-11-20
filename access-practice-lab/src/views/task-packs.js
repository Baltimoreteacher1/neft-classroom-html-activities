import { i18nFor } from "../i18n.js";
import { ACCESS_LAB_FLAGS } from "../lang/feature-flags.js";
import { BASE, announce, html } from "../util.js";
import { DEFAULT_TASK_SETTINGS, newQuestionLimits, validateTaskPack } from "../speaking/task-packs.js";
import { clearTaskPacks, deleteTaskPack, listTaskPacks, saveTaskPack } from "../speaking/task-pack-store.js";
import { rehearsalPlan } from "../speaking/task-packs.js";
import * as rec from "../recorder.js";
import * as audioStore from "../audio-store.js";

const slug = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 56) || `task-${Date.now().toString(36)}`;
const input = (name, value = "", type = "text") => html`<input name="${name}" type="${type}" value="${value}" />`;
const field = (label, name, value, type = "text") => html`<label class="field"><span>${label}</span>${input(name, value, type)}</label>`;

function formMarkup(I) {
  const T = (en, es) => I.T(en, es);
  const limits = newQuestionLimits();
  return html`<form class="panel sp-pack-form" data-task-pack-form>
    <h2>${T("Task pack draft", "Borrador de tarea")}</h2>
    <p>${T("Build and validate a speaking task. Drafts stay in this browser.", "Crea y valida una tarea oral. Los borradores se guardan en este navegador.")}</p>
    ${field(T("Title in English", "Título en inglés"), "titleEn", "")}
    ${field(T("Título en español", "Title in Spanish"), "titleEs", "")}
    <div class="sp-pack-grid">
      <label class="field"><span>${T("Grade band", "Grados")}</span><select name="band"><option value="3-5">3–5</option><option value="6-8">6–8</option></select></label>
      <label class="field"><span>${T("Classroom support choice", "Opción de apoyo en el aula")}</span><select name="stage"><option>A</option><option>B</option><option>C</option></select></label>
      <label class="field"><span>${T("Key Language Use", "Uso clave del lenguaje")}</span><select name="klu"><option>Narrate</option><option>Inform</option><option>Explain</option><option>Argue</option></select></label>
      <label class="field"><span>${T("Response type", "Tipo de respuesta")}</span><select name="response"><option value="audio">${T("Audio", "Audio")}</option><option value="video">${T("Video", "Video")}</option><option value="text">${T("Text", "Texto")}</option><option value="choice">${T("Choice", "Selección")}</option><option value="screen">${T("Screen + audio", "Pantalla + audio")}</option><option value="conversation">${T("Conversation", "Conversación")}</option></select></label>
    </div>
    ${field(T("Prompt in English", "Consigna en inglés"), "promptEn", "")}
    ${field(T("Consigna en español", "Prompt in Spanish"), "promptEs", "")}
    <fieldset><legend>${T("Assignment settings", "Configuración de la tarea")}</legend>
      <label><input type="checkbox" name="rehearsal" /> ${T("Enable test-day rehearsal limits (default off)", "Activar límites de ensayo para el día de la prueba (desactivado por defecto)")}</label>
      <div class="sp-pack-grid">
        ${field(T("Start date and time (optional)", "Fecha y hora de inicio (opcional)"), "startsAt", "", "datetime-local")}
        ${field(T("Due date and time (optional)", "Fecha y hora límite (opcional)"), "dueAt", "", "datetime-local")}
        ${field(T("Review seconds (blank = off; 0 is invalid)", "Segundos para revisar (vacío = desactivado; 0 no es válido)"), "reviewSec", "", "number")}
        ${field(T("Response seconds (blank = off)", "Segundos para responder (vacío = desactivado)"), "respondSec", "", "number")}
        ${field(T("Minimum response seconds (audio/video only)", "Segundos mínimos de respuesta (solo audio/video)"), "minRespondSec", "", "number")}
        <label class="field"><span>${T("Attempts", "Intentos")}</span><select name="attempts"><option>1</option><option>2</option><option>3</option></select></label>
        <label class="field"><span>${T("Late work", "Trabajo tardío")}</span><select name="late"><option value="accept-flag">${T("Accept and flag", "Aceptar y marcar")}</option><option value="refuse">${T("Refuse", "Rechazar")}</option></select></label>
        <label class="field"><span>${T("Question order", "Orden de preguntas")}</span><select name="order"><option value="fixed">${T("Fixed", "Fijo")}</option><option value="random">${T("Random", "Aleatorio")}</option></select></label>
        <label class="field"><span>${T("Release responses", "Publicar respuestas")}</span><select name="release"><option value="manual">${T("Manual", "Manual")}</option><option value="auto">${T("Automatic", "Automático")}</option></select></label>
        <label class="field"><span>${T("Review order", "Orden de revisión")}</span><select name="review"><option value="after-feedback">${T("After feedback", "Después de comentarios")}</option><option value="before-feedback">${T("Before feedback", "Antes de comentarios")}</option></select></label>
      </div>
      <label><input type="checkbox" name="sequential" /> ${T("Require questions in order", "Exigir que las preguntas se respondan en orden")}</label>
    </fieldset>
    <fieldset><legend>${T("Question behavior", "Comportamiento de la pregunta")}</legend>
      <label><input type="checkbox" name="showPromptAfterReview" checked /> ${T("Keep prompt visible after review", "Mantener la consigna visible después de revisarla")}</label>
      <label><input type="checkbox" name="replayMedia" checked /> ${T("Allow media replay", "Permitir repetir el audio o video")}</label>
      <label><input type="checkbox" name="slowPlayback" checked /> ${T("Offer 0.75× playback", "Ofrecer reproducción a 0.75×")}</label>
    </fieldset>
    <p class="fine">${T("Test-day rehearsal. Practice, not the official test. Games and quick practice remain untimed. Student answers are never scored by a model.", "Ensayo para el día de la prueba. Es práctica, no la prueba oficial. Los juegos y la práctica rápida no tienen cronómetro. Un modelo nunca califica las respuestas del estudiante.")}</p>
    <div class="row-actions"><button class="btn btn-primary" type="button" data-task-save>${T("Validate and save draft", "Validar y guardar borrador")}</button><button class="btn" type="reset">${T("Clear form", "Borrar formulario")}</button></div>
    <div data-task-errors role="status" aria-live="polite"></div>
  </form>`;
}

function packList(I, packs) {
  if (!packs.length) return html`<p>${I.T("No local task drafts yet.", "Aún no hay borradores locales.")}</p>`;
  return html`<ul class="sp-pack-list">${packs.map((p) => html`<li><div><strong>${I.pick(p.title)}</strong><small>${p.band} · ${p.stage} · ${p.klu} · ${p.status || "Draft"}</small></div><div class="row-actions"><button type="button" class="btn small" data-task-load="${p.id}">${I.T("Load", "Cargar")}</button><button type="button" class="btn small" data-task-duplicate="${p.id}">${I.T("Duplicate", "Duplicar")}</button><button type="button" class="btn small" data-task-archive="${p.id}">${I.T(p.status === "Archived" ? "Restore" : "Archive", p.status === "Archived" ? "Restaurar" : "Archivar")}</button><a class="btn small" href="${BASE}/task-packs/student/${p.id}">${I.T("View as student", "Ver como estudiante")}</a><a class="btn small" href="${BASE}/class/teacher">${I.T("Copy to a class", "Copiar a una clase")}</a><button type="button" class="btn small" data-task-export="${p.id}">${I.T("Export JSON", "Exportar JSON")}</button><button type="button" class="btn small ghost" data-task-delete="${p.id}">${I.T("Delete", "Eliminar")}</button></div></li>`)}</ul>`;
}

let studentTake = null;
let studentRecording = false;
let studentMediaRecorder = null;
let studentMediaStream = null;
let studentMediaStarted = 0;
let reviewTimer = null;
let studentStatusMessage = "";
const studentKey = (id) => `accessPracticeLab:v1:speaking-task:${id}`;
const limitKey = (packId, questionId) => `${studentKey(packId)}:limits:${questionId}`;
function rehearsalClock(pack, question) {
  if (!rehearsalPlan(question, pack.settings).enabled) return { phase: "off", remaining: 0 };
  const key = limitKey(pack.id, question.id);
  let clock;
  try { clock = JSON.parse(sessionStorage.getItem(key) || "null"); } catch { clock = null; }
  if (!clock) {
    const openedAt = Date.now();
    clock = question.limits.reviewSec ? { phase: "review", openedAt } : { phase: "countdown", openedAt, responseStartedAt: openedAt + 3000 };
    sessionStorage.setItem(key, JSON.stringify(clock));
  }
  if (clock.phase === "review") {
    const remaining = Math.max(0, Math.ceil((clock.openedAt + question.limits.reviewSec * 1000 - Date.now()) / 1000));
    if (!remaining) {
      clock = { phase: "countdown", openedAt: clock.openedAt, responseStartedAt: Date.now() + 3000 };
      sessionStorage.setItem(key, JSON.stringify(clock));
      return { ...clock, remaining: 3 };
    }
    return { ...clock, remaining };
  }
  if (clock.phase === "countdown") {
    const remaining = Math.max(0, Math.ceil((clock.responseStartedAt - Date.now()) / 1000));
    if (remaining) return { ...clock, remaining };
    clock.phase = "respond";
    sessionStorage.setItem(key, JSON.stringify(clock));
  }
  return { ...clock, phase: "respond", remaining: question.limits.respondSec == null ? 0 : Math.max(0, Math.ceil((clock.responseStartedAt + question.limits.respondSec * 1000 - Date.now()) / 1000)) };
}
async function studentPage(ctx, I) {
  const packs = await listTaskPacks(), pack = packs.find((p) => p.id === ctx.route.sub);
  if (!pack) return { title: I.T("Speaking task", "Tarea oral"), html: html`<section class="panel"><h1>${I.T("Task not found on this device.", "No se encontró la tarea en este dispositivo.")}</h1></section>` };
  const ix = Math.max(0, Math.min(pack.questions.length - 1, Number(sessionStorage.getItem(`${studentKey(pack.id)}:q`) || 0))), q = pack.questions[ix];
  const plan = rehearsalPlan(q, pack.settings);
  const clock = rehearsalClock(pack, q);
  let recordingStartedAt = Number(sessionStorage.getItem(`${limitKey(pack.id, q.id)}:recording`) || 0);
  const minRemaining = q.limits.minRespondSec ? (recordingStartedAt ? Math.max(0, q.limits.minRespondSec - Math.floor((Date.now() - recordingStartedAt) / 1000)) : q.limits.minRespondSec) : 0;
  if (plan.enabled && !reviewTimer && (clock.phase === "review" || clock.phase === "countdown" || minRemaining || clock.remaining)) reviewTimer = setInterval(() => ctx.rerender(), 1000);
  if (plan.enabled && clock.phase === "respond" && !minRemaining && !clock.remaining && reviewTimer) { clearInterval(reviewTimer); reviewTimer = null; }
  let saved = null; try { saved = JSON.parse(localStorage.getItem(studentKey(pack.id)) || "null"); } catch {}
  if (plan.enabled && saved?.question !== q.id && !sessionStorage.getItem(`${studentKey(pack.id)}:confirmed`)) return { title: I.pick(pack.title), html: html`<article class="panel"><h1>${I.pick(pack.title)}</h1><p>${I.T("Test-day rehearsal. Practice, not the official test.", "Ensayo para el día de la prueba. Es práctica, no una prueba oficial.")}</p><h2>${q.limits.reviewSec ? I.T(`Review time: ${q.limits.reviewSec} seconds`, `Tiempo para revisar: ${q.limits.reviewSec} segundos`) : ""}</h2><p>${q.limits.respondSec ? I.T(`Response time: ${q.limits.respondSec} seconds`, `Tiempo para responder: ${q.limits.respondSec} segundos`) : I.T("No response timer set.", "Sin cronómetro de respuesta.")}</p><p>${I.T(`Attempts: ${q.limits.attempts}`, `Intentos: ${q.limits.attempts}`)}</p><button class="btn btn-primary" data-student-confirm>${I.T("Continue", "Continuar")}</button></article>` };
  return { title: I.pick(pack.title), html: html`<article class="sp-task-packs"><p class="eyebrow">${I.T("Speaking practice · not an official test", "Práctica oral · no es una prueba oficial")}</p><h1 tabindex="-1">${I.pick(pack.title)}</h1><p class="fine">${pack.band} · ${pack.stage} · ${pack.klu} · ${ix + 1} / ${pack.questions.length}</p>${plan.enabled ? html`<p class="panel">${I.T("Test-day rehearsal. Practice, not the official test.", "Ensayo para el día de la prueba. Es práctica, no una prueba oficial.")} ${clock.phase === "review" ? I.T(`Review: ${clock.remaining}s`, `Revisión: ${clock.remaining}s`) : clock.phase === "countdown" ? I.T(`Starting in ${clock.remaining}…`, `Comienza en ${clock.remaining}…`) : clock.remaining ? I.T(`Response time remaining: ${clock.remaining}s`, `Tiempo restante para responder: ${clock.remaining}s`) : ""}</p>` : ""}<section class="panel"><h2 lang="en">${q.prompt.text.en}</h2><p lang="es">${q.prompt.text.es}</p>${q.response === "text" || q.response === "conversation" ? html`<label class="field">${I.T("Your response", "Tu respuesta")}<textarea data-student-answer maxlength="1200"></textarea></label><p>${["á", "é", "í", "ó", "ú", "ñ", "ü", "¿", "¡"].map((c) => html`<button type="button" class="btn small" data-accent="${c}">${c}</button>`)}</p>` : q.response === "choice" ? html`<p>${I.T("Choice responses are teacher-configured in this pack.", "El docente configura las opciones de respuesta en este paquete.")}</p><label><input type="radio" name="student-choice" value="A"> A</label><label><input type="radio" name="student-choice" value="B"> B</label>` : html`<p>${q.response === "screen" ? I.T("Choose to share your screen and microphone. Only the recording you keep is saved on this device.", "Elige compartir tu pantalla y micrófono. Solo se guarda en este dispositivo la grabación que decidas conservar.") : I.T("Recordings stay in this tab unless you choose to keep one for your teacher.", "Las grabaciones quedan en esta pestaña a menos que decidas guardar una.")}</p><button class="btn" data-student-record ${clock.phase !== "respond" ? "disabled" : ""}>${I.T("Start recording", "Empezar a grabar")}</button><button class="btn" data-student-stop ${studentRecording ? "" : "disabled"}>${I.T("Stop", "Detener")}</button>${studentTake ? html`<video controls playsinline src="${studentTake.url}" ${q.response === "audio" ? "hidden" : ""}></video><audio controls src="${studentTake.url}" ${q.response === "audio" ? "" : "hidden"}></audio><button class="btn small" data-student-keep>${I.T("Keep for my teacher", "Guardar para mi docente")}</button>` : ""}`}</section><div class="row-actions"><button class="btn" data-student-save ${clock.phase !== "respond" ? "disabled" : ""}>${I.T("Save response on this device", "Guardar respuesta en este dispositivo")}</button><button class="btn btn-primary" data-student-next ${clock.phase !== "respond" || minRemaining ? "disabled" : ""}>${minRemaining ? I.T(`Minimum response: ${minRemaining}s remaining`, `Respuesta mínima: faltan ${minRemaining}s`) : ix + 1 === pack.questions.length ? I.T("Finish", "Terminar") : I.T("Next question", "Siguiente pregunta")}</button></div><p data-student-status role="status" aria-live="polite">${studentStatusMessage}</p><p class="fine">${I.T("Student identity is not requested. A standalone task does not lock attempts on refresh.", "No se pide identidad. Una tarea independiente no bloquea intentos al actualizar.")}</p></article>` };
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  if (ctx.route.id === "student") return studentPage(ctx, I);
  if (!ACCESS_LAB_FLAGS.speakingTaskPacksEnabled) return { title: I.T("Speaking task packs", "Tareas de expresión oral"), html: html`<section class="panel"><h1>${I.T("Not available", "No disponible")}</h1></section>` };
  let packs = [], storageError = "";
  try { packs = await listTaskPacks(); } catch (error) { storageError = error.message; }
  return {
    title: I.T("Speaking task packs", "Tareas de expresión oral"),
    html: html`<article class="sp-task-packs">
      <p class="eyebrow">${I.T("Teacher tools", "Herramientas docentes")}</p>
      <h1 tabindex="-1">${I.T("Speaking task packs", "Tareas de expresión oral")}</h1>
      <p class="lead">${I.T("Create local assignment drafts with explicit response types and rehearsal settings.", "Crea borradores locales con tipos de respuesta y opciones de ensayo explícitos.")}</p>
      <p class="fine">${I.T("Local to this browser. Provider-backed live rooms and real LMS registration remain disabled until configured.", "Se guarda solo en este navegador. Las salas en vivo y el registro real de LMS permanecen desactivados hasta su configuración.")}</p>
      ${storageError ? html`<p class="panel" role="alert">${storageError}</p>` : html`<section class="panel"><h2>${I.T("Saved drafts", "Borradores guardados")}</h2>${packList(I, packs)}<label class="field"><span>${I.T("Import a validated task-pack JSON", "Importar JSON validado de una tarea")}</span><input type="file" accept="application/json,.json" data-task-import /></label><p data-task-import-status role="status"></p><button class="btn small ghost" type="button" data-task-clear>${I.T("Remove all local drafts", "Eliminar todos los borradores locales")}</button></section>`}
      ${formMarkup(I)}
      <a href="/access-teacher/">${I.T("Back to Teacher Hub", "Volver al Centro docente")}</a>
    </article>`,
  };
}

function packFromForm(form) {
  const f = new FormData(form);
  const number = (name) => f.get(name) === "" ? null : Number(f.get(name));
  const title = { en: String(f.get("titleEn") || "").trim(), es: String(f.get("titleEs") || "").trim() };
  return {
    schema: "lp-speak-pack/1",
    id: slug(title.en),
    title,
    band: String(f.get("band")),
    stage: String(f.get("stage")),
    klu: String(f.get("klu")),
    settings: { ...DEFAULT_TASK_SETTINGS, startsAt: f.get("startsAt") ? new Date(String(f.get("startsAt"))).toISOString() : null, dueAt: f.get("dueAt") ? new Date(String(f.get("dueAt"))).toISOString() : null, late: String(f.get("late")), order: String(f.get("order")), sequential: f.has("sequential"), release: String(f.get("release")), review: String(f.get("review")), rehearsal: f.has("rehearsal") },
    questions: [{ id: "q1", prompt: { text: { en: String(f.get("promptEn") || "").trim(), es: String(f.get("promptEs") || "").trim() } }, response: String(f.get("response")), limits: { reviewSec: number("reviewSec"), showPromptAfterReview: f.has("showPromptAfterReview"), replayMedia: f.has("replayMedia"), respondSec: number("respondSec"), minRespondSec: number("minRespondSec"), attempts: Number(f.get("attempts")), slowPlayback: f.has("slowPlayback") } }],
    status: "Draft",
    updatedAt: new Date().toISOString(),
  };
}

const download = (pack) => {
  const blob = new Blob([`${JSON.stringify(pack, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${pack.id}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export async function onClick(e, ctx) {
  if (ctx.route.id === "student") {
    const I = i18nFor(ctx), id = ctx.route.sub, status = document.querySelector("[data-student-status]");
    if (e.target.closest?.("[data-student-confirm]")) { sessionStorage.setItem(`${studentKey(id)}:confirmed`, "1"); ctx.rerender(); return true; }
    if (e.target.closest?.("[data-student-record]")) { try { const packs = await listTaskPacks(), pack = packs.find((p) => p.id === id), ix = Number(sessionStorage.getItem(`${studentKey(id)}:q`) || 0), type = pack.questions[ix].response; sessionStorage.setItem(`${limitKey(id, pack.questions[ix].id)}:recording`, String(Date.now())); if (type === "audio") { await rec.start(studentKey(id), { onStop: (takes) => { studentTake = takes.at(-1) || null; studentRecording = false; ctx.rerender(); } }); studentRecording = rec.isRecording(studentKey(id)); } else { if (type === "screen") { const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); const mic = await navigator.mediaDevices.getUserMedia({ audio: true }); studentMediaStream = new MediaStream([...display.getTracks(), ...mic.getAudioTracks()]); } else studentMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); studentMediaRecorder = new MediaRecorder(studentMediaStream); const chunks = []; studentMediaStarted = Date.now(); studentMediaRecorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); }); studentMediaRecorder.addEventListener("stop", () => { studentMediaStream?.getTracks().forEach((track) => track.stop()); const blob = new Blob(chunks, { type: studentMediaRecorder.mimeType || chunks[0]?.type || "video/webm" }); const extension = blob.type.includes("mp4") ? "mp4" : "webm"; studentTake = { id: `take-${Date.now().toString(36)}`, blob, url: URL.createObjectURL(blob), extension, seconds: Math.round((Date.now() - studentMediaStarted) / 1000) }; studentRecording = false; ctx.rerender(); }); studentMediaRecorder.start(250); studentRecording = true; } ctx.rerender(); } catch (error) { studentMediaStream?.getTracks().forEach((track) => track.stop()); studentMediaStream = null; studentStatusMessage = error.message; if (status) status.textContent = studentStatusMessage; } return true; }
    if (e.target.closest?.("[data-student-stop]")) { if (studentMediaRecorder?.state === "recording") studentMediaRecorder.stop(); else { await rec.stop(); studentRecording = false; studentTake = rec.takesFor(studentKey(id)).at(-1) || null; ctx.rerender(); } return true; }
    if (e.target.closest?.("[data-student-keep]")) { const ok = studentTake && await audioStore.keep(studentTake, id); studentStatusMessage = ok ? I.T("Kept on this device for up to 30 days. You can remove it in Passport.", "Guardado en este dispositivo por hasta 30 días. Puedes quitarlo en Pasaporte.") : I.T("Could not keep this recording.", "No se pudo guardar esta grabación."); if (status) status.textContent = studentStatusMessage; return true; }
    const accent = e.target.closest?.("[data-accent]"); if (accent) { const field = document.querySelector("[data-student-answer]"); if (field) { const a = field.selectionStart, b = field.selectionEnd; field.setRangeText(accent.dataset.accent, a, b, "end"); field.focus(); } return true; }
    if (e.target.closest?.("[data-student-save]")) { const answer = document.querySelector("[data-student-answer]")?.value || document.querySelector('[name="student-choice"]:checked')?.value || ""; let saved = {}; try { saved = JSON.parse(localStorage.getItem(studentKey(id)) || "{}"); } catch {} const packs = await listTaskPacks(), pack = packs.find((p) => p.id === id), ix = Number(sessionStorage.getItem(`${studentKey(id)}:q`) || 0); saved[pack.questions[ix].id] = { answer, savedAt: new Date().toISOString() }; localStorage.setItem(studentKey(id), JSON.stringify(saved)); studentStatusMessage = I.T("Saved on this device.", "Guardado en este dispositivo."); if (status) status.textContent = studentStatusMessage; return true; }
    if (e.target.closest?.("[data-student-next]")) { const packs = await listTaskPacks(), pack = packs.find((p) => p.id === id), ix = Number(sessionStorage.getItem(`${studentKey(id)}:q`) || 0); if (ix + 1 >= pack.questions.length) { sessionStorage.setItem(`${studentKey(id)}:completed`, "1"); sessionStorage.removeItem(`${studentKey(id)}:q`); sessionStorage.removeItem(`${studentKey(id)}:confirmed`); announce(I.T("Practice complete. No score was calculated.", "Práctica terminada. No se calculó un puntaje.")); return true; } sessionStorage.setItem(`${studentKey(id)}:q`, String(ix + 1)); ctx.rerender(); return true; }
    return false;
  }
  const saveButton = e.target.closest?.("[data-task-save]");
  if (saveButton) {
    const form = saveButton.closest("form");
    const result = validateTaskPack(packFromForm(form));
    const errors = form.querySelector("[data-task-errors]");
    if (!result.ok) { errors.innerHTML = `<ul>${result.errors.map((x) => `<li>${x}</li>`).join("")}</ul>`; return true; }
    try { await saveTaskPack(result.value); ctx.rerender(); }
    catch (error) { errors.textContent = error.message; }
    return true;
  }
  const actionButton = e.target.closest?.("[data-task-load], [data-task-export], [data-task-delete], [data-task-duplicate], [data-task-archive]");
  const id = actionButton?.dataset.taskLoad || actionButton?.dataset.taskExport || actionButton?.dataset.taskDelete || actionButton?.dataset.taskDuplicate || actionButton?.dataset.taskArchive;
  if (id) {
    const pack = (await listTaskPacks()).find((p) => p.id === id);
    if (e.target.closest("[data-task-export]")) { if (pack) download(pack); return true; }
    if (e.target.closest("[data-task-delete]")) { await deleteTaskPack(id); ctx.rerender(); return true; }
    if (e.target.closest("[data-task-duplicate]")) { if (pack) { const duplicate = { ...structuredClone(pack), id: `${pack.id.slice(0, 42)}-copy-${Date.now().toString(36)}`, title: { en: `Copy of ${pack.title.en}`, es: `Copia de ${pack.title.es}` }, status: "Draft", updatedAt: new Date().toISOString() }; await saveTaskPack(duplicate); ctx.rerender(); } return true; }
    if (e.target.closest("[data-task-archive]")) { if (pack) { pack.status = pack.status === "Archived" ? "Draft" : "Archived"; pack.updatedAt = new Date().toISOString(); await saveTaskPack(pack); ctx.rerender(); } return true; }
    if (pack) {
      const form = document.querySelector("[data-task-pack-form]");
      const values = { titleEn: pack.title.en, titleEs: pack.title.es, band: pack.band, stage: pack.stage, klu: pack.klu, promptEn: pack.questions[0]?.prompt.text.en, promptEs: pack.questions[0]?.prompt.text.es, response: pack.questions[0]?.response, rehearsal: pack.settings.rehearsal ? "on" : "", ...pack.questions[0]?.limits, ...pack.settings };
      for (const [name, value] of Object.entries(values)) { const el = form.elements.namedItem(name); if (!el) continue; if (el.type === "checkbox") el.checked = value === true || value === "on"; else if (value != null && typeof value !== "object") el.value = value; }
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return true;
  }
  if (e.target.closest?.("[data-task-clear]")) { await clearTaskPacks(); ctx.rerender(); return true; }
  return false;
}

export async function unmount() { if (studentRecording) { await rec.stop(); if (studentMediaRecorder?.state === "recording") studentMediaRecorder.stop(); } studentMediaStream?.getTracks().forEach((track) => track.stop()); studentMediaStream = null; studentMediaRecorder = null; studentRecording = false; studentTake = null; if (reviewTimer) clearInterval(reviewTimer); }

export async function onChange(e, ctx) {
  const file = e.target.closest?.("[data-task-import]");
  if (!file?.files?.[0]) return;
  try {
    const pack = JSON.parse(await file.files[0].text());
    const checked = validateTaskPack(pack);
    if (!checked.ok) throw new Error(checked.errors.join(" "));
    await saveTaskPack(checked.value);
    ctx.rerender();
  } catch (error) {
    const status = document.querySelector("[data-task-import-status]");
    studentStatusMessage = error.message; if (status) status.textContent = studentStatusMessage;
  }
}
