// A learner-owned ACCESS preparation program. It brings the existing 12-week sequence,
// practice evidence and Passport together around the learner's own date and weekly routine.
import { crumbsHTML, domainGlyph } from "../components.js";
import { bandRows, loadRoad } from "../content.js";
import { i18nFor } from "../i18n.js";
import { loadRecord } from "../store.js";
import { readPath } from "./path-data.js";
import { activityHref } from "./room.js";
import { BASE, DOMAIN_META, bandLabel, formatDate, html, icon, safeJson, storage, todayISO } from "../util.js";

const KEY = "accessPracticeLab:v1:readyProgram";
const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
const EMPTY = { start: "", target: "", days: 4, focus: "auto", reflections: {} };
const esDomain = { Listening: "Comprensión auditiva", Reading: "Lectura", Speaking: "Expresión oral", Writing: "Escritura" };

function allPlans() {
  const data = safeJson(storage.get(KEY), {});
  return data?.v === 1 && data.bands && typeof data.bands === "object" ? data : { v: 1, bands: {} };
}

function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function nextMonday() {
  const d = new Date(`${todayISO()}T12:00:00`);
  const days = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function safeSettings(value) {
  const s = { ...EMPTY, ...(value || {}) };
  s.start = validDate(s.start) ? s.start : nextMonday();
  s.target = validDate(s.target) && s.target > s.start ? s.target : addDays(s.start, 83);
  s.days = [2, 3, 4].includes(Number(s.days)) ? Number(s.days) : 4;
  s.focus = ["auto", ...DOMAINS].includes(s.focus) ? s.focus : "auto";
  s.reflections = s.reflections && typeof s.reflections === "object" ? s.reflections : {};
  return s;
}

function weekIndex(settings, now = todayISO()) {
  const span = Math.max(1, Math.ceil((Date.parse(`${settings.target}T12:00:00`) - Date.parse(`${settings.start}T12:00:00`)) / 86400000) + 1);
  const elapsed = Math.max(0, Date.parse(`${now}T12:00:00`) - Date.parse(`${settings.start}T12:00:00`));
  const beforeStart = now < settings.start;
  return { week: Math.max(1, Math.min(12, Math.floor((elapsed / span) * 12) + 1)), span, elapsedDays: Math.floor(elapsed / 86400000), beforeStart };
}

function recommendationDomain(settings, dna, previousFocus = "auto") {
  if (previousFocus !== "auto" && DOMAINS.includes(previousFocus)) return previousFocus;
  if (settings.focus !== "auto") return settings.focus;
  const counts = new Map((dna?.domains || []).map((row) => [row.domain, Number(row.instructional?.responseCount) || 0]));
  return [...DOMAINS].sort((a, b) => (counts.get(a) || 0) - (counts.get(b) || 0) || DOMAINS.indexOf(a) - DOMAINS.indexOf(b))[0];
}

function sessionGroups(activities, days) {
  const patterns = { 2: [[0, 1], [2, 3]], 3: [[0, 1], [2], [3]], 4: [[0], [1], [2], [3]] };
  return (patterns[days] || patterns[4]).map((indices) => indices.map((i) => activities[i]).filter(Boolean));
}

function skillStatus(I, count) {
  if (count === 0) return I.T("Ready for a first sample", "Listo para una primera muestra");
  if (count < 3) return I.T(`${count} practice ${count === 1 ? "sample" : "samples"} saved`, `${count} ${count === 1 ? "muestra guardada" : "muestras guardadas"}`);
  return I.T("Several samples saved", "Varias muestras guardadas");
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const { T, S } = I;
  const band = ctx.band;
  const data = allPlans();
  const settings = safeSettings(data.bands[band]);
  const [road, rows] = await Promise.all([loadRoad(), bandRows(band)]);
  const weeks = road?.[band]?.weeks || [];
  if (!weeks.length) return { title: S("My readiness plan", "Mi plan de preparación"), html: html`<section class="panel"><h1>${T("My readiness plan", "Mi plan de preparación")}</h1><p>${T("This grade band’s preparation path is not available yet.", "La ruta de preparación de este grado todavía no está disponible.")}</p></section>` };
  const path = readPath(band);
  const { week: index, span, beforeStart } = weekIndex(settings);
  const week = weeks[index - 1];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const activities = week.activities.map((id) => byId.get(id)).filter(Boolean);
  const previousFocus = settings.reflections[String(Math.max(1, index - 1))]?.focus || "auto";
  const targetDomain = recommendationDomain(settings, path.dna, index > 1 ? previousFocus : "auto");
  const leading = activities.find((a) => a.domain === targetDomain) || activities[0];
  const groups = sessionGroups(activities, settings.days);
  const completed = (a) => loadRecord(band, a.domain, a.level).complete.includes(a.id);
  const finishedCount = activities.filter(completed).length;
  const weeksDone = weeks.filter((w) => w.activities.length && w.activities.every((id) => {
    const row = byId.get(id);
    return row && loadRecord(band, row.domain, row.level).complete.includes(id);
  })).length;
  const availableDays = Math.max(1, Math.ceil((Date.parse(`${settings.target}T12:00:00`) - Date.parse(`${todayISO()}T12:00:00`)) / 86400000));
  const pace = Math.max(1, Math.ceil(12 / Math.max(1, Math.ceil(span / 7))));
  const reflection = settings.reflections[String(index)] || {};
  const savedCount = path.dna?.domains?.reduce((sum, d) => sum + (Number(d.instructional?.responseCount) || 0), 0) || 0;
  const status = beforeStart ? T("Your plan starts soon", "Tu plan empieza pronto") : T(`Week ${index} of 12`, `Semana ${index} de 12`);

  return {
    title: S("My ACCESS readiness plan", "Mi plan de preparación para ACCESS"),
    html: html`${crumbsHTML([[S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`], [S("My readiness plan", "Mi plan de preparación"), null]])}
      <div class="rp-page">
        <section class="rp-hero" aria-labelledby="rpTitle">
          <div class="rp-hero-copy">
            <p class="rp-eyebrow">${icon("road")} ${T("A plan built around your goal", "Un plan creado alrededor de tu meta")}</p>
            <h1 id="rpTitle" tabindex="-1">${T("Get ready, one strong week at a time.", "Prepárate, una buena semana a la vez.")}</h1>
            <p class="rp-lead">${T("Your practice, your schedule, your evidence. This plan connects four-skill practice to a date you choose and adjusts its focus as you work.", "Tu práctica, tu horario y tu evidencia. Este plan conecta las cuatro destrezas con la fecha que elijas y ajusta el enfoque mientras practicas.")}</p>
            <div class="rp-bands" role="group" aria-label="${S("Choose grade band", "Elige el grupo de grados")}">${["3-5", "6-8"].map((b) => html`<a href="${BASE}/ready-plan?grades=${b}" ${b === band ? "aria-current=page" : ""}>${T(`Grades ${b.replace("-", "–")}`, `Grados ${b.replace("-", "–")}`)}</a>`)}</div>
          </div>
          <div class="rp-progress" aria-label="${S("Plan progress", "Progreso del plan")}">
            <p class="rp-progress-kicker">${T("Your place in the program", "Tu lugar en el programa")}</p>
            <strong>${status}</strong>
            <div class="rp-progress-bar" role="progressbar" aria-label="${S("Program weeks completed", "Semanas del programa terminadas")}" aria-valuemin="0" aria-valuemax="12" aria-valuenow="${weeksDone}"><span style="width:${Math.round(weeksDone / 12 * 100)}%"></span></div>
            <p>${T(`${weeksDone} of 12 weekly sets completed`, `${weeksDone} de 12 conjuntos semanales terminados`)}</p>
            <p class="rp-progress-note">${savedCount ? T(`${savedCount} saved practice samples shape your next focus.`, `${savedCount} muestras de práctica guardadas ayudan a elegir tu próximo enfoque.`) : T("Your first saved practice sample will help shape the next focus.", "Tu primera muestra guardada ayudará a elegir el próximo enfoque.")}</p>
          </div>
        </section>

        <section class="rp-next" aria-labelledby="rpNextTitle">
          <div class="rp-next-head"><div><p class="rp-eyebrow">${T(`Week ${index} · ${week.taskType}`, `Semana ${index} · ${week.taskType}`)}</p><h2 id="rpNextTitle">${week.theme}</h2><p>${week.focus}</p></div><span class="rp-date-chip">${T("Test date", "Fecha de prueba")}<br />${formatDate(settings.target, { month: "short", day: "numeric", year: "numeric" })}</span></div>
          ${pace > 1 ? html`<p class="rp-pace-note">${icon("clock")} ${T(`Your date is ${availableDays} days away, so this is a condensed timeline. It will move through up to ${pace} learning weeks per calendar week. Choose a later date if you want a slower pace.`, `Tu fecha está a ${availableDays} días, así que este es un plan comprimido. Avanzará hasta ${pace} semanas de aprendizaje por semana del calendario. Elige una fecha posterior si prefieres avanzar con más calma.`)}</p>` : ""}
          <div class="rp-mission">
            <div class="rp-mission-mark">${domainGlyph(targetDomain)}</div>
            <div><p class="rp-eyebrow">${T("Recommended first", "Primero te recomendamos")}</p><h3>${leading?.title || T("Choose your first activity", "Elige tu primera actividad")}</h3><p>${T(`We picked ${targetDomain} because it has the least saved practice evidence right now. This is a helpful next step, not a score or language level.`, `Elegimos ${esDomain[targetDomain]} porque ahora tiene menos evidencia de práctica guardada. Es un siguiente paso útil, no un puntaje ni un nivel de idioma.`)}</p></div>
            ${leading ? html`<a class="btn btn-primary" href="${activityHref(leading.domain, leading.level, leading.id)}?grades=${band}">${T("Start this practice", "Empezar esta práctica")} ${icon("arrow-right")}</a>` : ""}
          </div>
          <div class="rp-days" aria-label="${S("Suggested practice schedule", "Horario de práctica sugerido")}">
            ${groups.map((group, i) => { const mins = group.reduce((sum, a) => sum + (Number(a.minutes) || Number.parseInt(a.time, 10) || 8), 0); return html`<article class="rp-day ${group.length && group.every(completed) ? "is-done" : ""}"><p class="rp-day-label">${T(`Practice day ${i + 1}`, `Día de práctica ${i + 1}`)} <span>${T(`about ${mins} min`, `unos ${mins} min`)}</span></p><ul>${group.map((a) => html`<li class="d-${a.domain.toLowerCase()}">${completed(a) ? icon("check") : domainGlyph(a.domain)}<span><strong>${a.title}</strong><small>${T(a.domain, esDomain[a.domain])} · ${Number(a.minutes) || Number.parseInt(a.time, 10) || 8} min</small></span><a href="${activityHref(a.domain, a.level, a.id)}?grades=${band}" aria-label="${S(`Open ${a.title}`, `Abrir ${a.title}`)}">${icon("arrow-right")}</a></li>`)}</ul></article>`; })}
          </div>
          ${path.due?.length ? html`<p class="rp-review">${icon("retry")} ${T(`${path.due.length} quick review ${path.due.length === 1 ? "check is" : "checks are"} ready from your saved work.`, `Hay ${path.due.length} repasos breves listos a partir de tu trabajo guardado.`)} <a href="${BASE}/growth?grades=${band}">${T("Review what is due", "Repasar lo pendiente")} ${icon("arrow-right")}</a></p>` : ""}
          <div class="rp-week-footer"><p>${T(`${finishedCount} of ${activities.length} practice activities completed this week. They stay on this device.`, `${finishedCount} de ${activities.length} actividades terminadas esta semana. Se guardan en este dispositivo.`)}</p><a class="btn" href="${BASE}/play?ids=${week.activities.join(",")}&t=${encodeURIComponent(S(`Readiness week ${index}`, `Semana ${index} de preparación`))}&grades=${band}">${icon("play")} ${T("Play this week in order", "Hacer esta semana en orden")}</a></div>
        </section>

        <div class="rp-lower">
          <section class="rp-panel rp-settings" aria-labelledby="rpSettingsTitle">
            <p class="rp-eyebrow">${icon("tools")} ${T("Make the plan fit your life", "Ajusta el plan a tu rutina")}</p><h2 id="rpSettingsTitle">${T("Your schedule", "Tu horario")}</h2>
            <p>${T("Choose a practice rhythm you can keep. The daily sessions show the real activity time, and you can change this schedule whenever your week changes.", "Elige un ritmo de práctica que puedas mantener. Las sesiones muestran el tiempo real de las actividades y puedes cambiar el horario cuando cambie tu semana.")}</p>
          <div class="rp-fields">
              <label>${T("Start my program", "Empezar mi programa")}<input type="date" data-rp-field="start" min="${todayISO()}" value="${settings.start}" /></label>
              <label>${T("My ACCESS test date", "La fecha de mi prueba ACCESS")}<input type="date" data-rp-field="target" min="${addDays(settings.start, 1)}" value="${settings.target}" /></label>
              <label>${T("Practice days each week", "Días de práctica cada semana")}<select data-rp-field="days">${[2, 3, 4].map((n) => html`<option value="${n}" ${settings.days === n ? "selected" : ""}>${T(`${n} days`, `${n} días`)}</option>`)}</select></label>
              <label>${T("Choose a focus", "Elige un enfoque")}<select data-rp-field="focus"><option value="auto" ${settings.focus === "auto" ? "selected" : ""}>${T("Let my practice guide it", "Dejar que mi práctica lo guíe")}</option>${DOMAINS.map((d) => html`<option value="${d}" ${settings.focus === d ? "selected" : ""}>${T(d, esDomain[d])}</option>`)}</select></label>
            </div>
            <button class="btn btn-primary" type="button" data-rp-save>${icon("check")} ${T("Save my plan", "Guardar mi plan")}</button><p class="rp-save-status" role="status" data-rp-status>${T("Your plan is saved only in this browser.", "Tu plan solo se guarda en este navegador.")}</p>
          </section>
          <section class="rp-panel rp-reflection" aria-labelledby="rpReflectionTitle">
            <p class="rp-eyebrow">${icon("growth")} ${T("A weekly check-in", "Un repaso semanal")}</p><h2 id="rpReflectionTitle">${T("Notice what is changing.", "Fíjate en lo que va cambiando.")}</h2><p>${T("A reflection helps you choose a useful next step. It is not graded and does not estimate your ACCESS score.", "Una reflexión te ayuda a elegir un siguiente paso útil. No se califica ni calcula tu puntaje de ACCESS.")}</p>
            <label for="rpReflection">${T("What feels easier now? What would you like to practice again?", "¿Qué se siente más fácil ahora? ¿Qué te gustaría practicar otra vez?")}</label><textarea id="rpReflection" rows="4" maxlength="500" data-rp-reflection placeholder="${S("One thing I can do now…", "Algo que ahora puedo hacer…")}">${reflection.text || ""}</textarea>
            <label>${T("What should we focus on next week?", "¿En qué nos enfocamos la próxima semana?")}<select data-rp-reflection-focus><option value="auto" ${!reflection.focus || reflection.focus === "auto" ? "selected" : ""}>${T("Let my practice guide it", "Dejar que mi práctica lo guíe")}</option>${DOMAINS.map((d) => html`<option value="${d}" ${reflection.focus === d ? "selected" : ""}>${T(d, esDomain[d])}</option>`)}</select></label><button class="btn" type="button" data-rp-reflect>${icon("bookmark")} ${T("Save this check-in", "Guardar este repaso")}</button><p class="rp-save-status" role="status" data-rp-reflect-status>${reflection.text ? T("Your last check-in is saved on this device.", "Tu último repaso está guardado en este dispositivo.") : T("Your words stay on this device.", "Tus palabras se quedan en este dispositivo.")}</p>
          </section>
        </div>

        <section class="rp-family" aria-labelledby="rpFamilyTitle"><div class="rp-family-copy"><p class="rp-eyebrow">${icon("families")} ${T("Bring the learning home", "Lleva el aprendizaje a casa")}</p><h2 id="rpFamilyTitle">${T("A small conversation can make practice stick.", "Una charla breve puede ayudar a recordar lo practicado.")}</h2><p>${T("Talk about this week’s theme in any language your family uses. No account or shared profile is needed.", "Conversen sobre el tema de esta semana en cualquier idioma que use la familia. No se necesita una cuenta ni un perfil compartido.")}</p><div class="rp-family-prompt"><strong>${T("Try asking", "Prueba preguntar")}</strong><p lang="en">${week.family?.en || T("What is one idea you want to remember from this week?", "¿Qué idea de esta semana quieres recordar?")}</p>${week.family?.es ? html`<p lang="es">${week.family.es}</p>` : ""}</div><label class="rp-talked"><input type="checkbox" data-rp-talked ${reflection.talked ? "checked" : ""} /><span>${T("We talked about this week’s learning together (optional).", "Conversamos sobre lo aprendido esta semana (opcional).")}</span></label></div><div class="rp-family-actions"><p>${T(`This week: ${finishedCount} of ${activities.length} practice activities complete. ${savedCount} practice samples saved across four skills.`, `Esta semana: ${finishedCount} de ${activities.length} actividades terminadas. ${savedCount} muestras de práctica guardadas en cuatro destrezas.`)}</p><button type="button" class="btn btn-primary" data-rp-print>${icon("print")} ${T("Print my family update", "Imprimir mi resumen familiar")}</button><a class="btn" href="${BASE}/portfolio?view=family&grades=${band}">${icon("families")} ${T("Open the family growth story", "Abrir el resumen de crecimiento familiar")}</a><p class="rp-save-status" role="status" data-rp-print-status>${T("The printout is made on this device. Nothing is sent.", "La impresión se prepara en este dispositivo. No se envía nada.")}</p></div></section>

        <section class="rp-evidence" aria-labelledby="rpEvidenceTitle"><div><p class="rp-eyebrow">${icon("passport")} ${T("Evidence of your effort", "Evidencia de tu esfuerzo")}</p><h2 id="rpEvidenceTitle">${T("Four skills, one growing picture.", "Cuatro destrezas, una imagen que crece.")}</h2><p>${T("These are saved practice samples, not proficiency ratings. Your plan stays on this device. Use your Passport backup code to carry it to another browser.", "Son muestras de práctica guardadas, no calificaciones de dominio. Tu plan se queda en este dispositivo. Usa el código de respaldo de tu Pasaporte para llevarlo a otro navegador.")}</p><a class="btn" href="${BASE}/passport?grades=${band}">${icon("passport")} ${T("Back up or move my plan", "Respaldar o trasladar mi plan")}</a><a class="btn" href="${BASE}/portfolio?grades=${band}">${icon("growth")} ${T("Review my work and growth", "Revisar mi trabajo y crecimiento")}</a></div><ul>${DOMAINS.map((d) => { const count = Number(path.dna?.domains?.find((x) => x.domain === d)?.instructional?.responseCount) || 0; return html`<li class="d-${d.toLowerCase()}">${domainGlyph(d)}<span><strong>${T(d, esDomain[d])}</strong><small>${skillStatus(I, count)}</small></span><a href="${BASE}/${d}?grades=${band}" aria-label="${S(`Practice ${d}`, `Practicar ${esDomain[d]}`)}">${icon("arrow-right")}</a></li>`; })}</ul></section>

        <details class="rp-roadmap"><summary class="rp-roadmap-head"><div><p class="rp-eyebrow">${T("Your 12-week learning arc", "Tu recorrido de aprendizaje de 12 semanas")}</p><h2 id="rpRoadmapTitle">${T("Build, apply, show what you know.", "Construye, aplica y muestra lo que sabes.")}</h2></div><span class="rp-roadmap-toggle"><span class="rp-roadmap-closed">${T("View all 12 weeks", "Ver las 12 semanas")}</span><span class="rp-roadmap-open">${T("Hide the 12-week map", "Ocultar el mapa de 12 semanas")}</span></span></summary><ol>${weeks.map((w, i) => { const active = i + 1 === index; const done = w.activities.length && w.activities.every((id) => { const row = byId.get(id); return row && loadRecord(band, row.domain, row.level).complete.includes(id); }); return html`<li class="${active ? "is-current" : ""} ${done ? "is-done" : ""}"><span>${done ? icon("check") : i + 1}</span><div><strong>${T(`Week ${i + 1}`, `Semana ${i + 1}`)} · ${w.taskType}</strong><small>${w.theme}</small></div><a href="${BASE}/road/${w.n}?grades=${band}" aria-label="${S(`Open week ${i + 1}: ${w.theme}`, `Abrir semana ${i + 1}: ${w.theme}`)}">${icon("arrow-right")}</a></li>`; })}</ol><a class="btn" href="${BASE}/road?grades=${band}">${T("View the full Road to ACCESS", "Ver todo el Camino a ACCESS")} ${icon("arrow-right")}</a></details>
        <p class="rp-trust">${T("Practice evidence stays in this browser. The program is a learning guide, not an official WIDA ACCESS test, score, prediction, or placement.", "La evidencia de práctica permanece en este navegador. El programa es una guía de aprendizaje, no una prueba, puntaje, predicción ni ubicación oficial de WIDA ACCESS.")}</p>
      </div>`,
  };
}

function saveBand(band, next) {
  const data = allPlans();
  data.bands[band] = safeSettings({ ...data.bands[band], ...next });
  storage.set(KEY, JSON.stringify(data));
  return data.bands[band];
}

export function onClick(e, ctx) {
  const save = e.target.closest("[data-rp-save]");
  if (save) {
    const values = Object.fromEntries([...document.querySelectorAll("[data-rp-field]")].map((el) => [el.dataset.rpField, el.value]));
    const next = safeSettings({ ...allPlans().bands[ctx.band], ...values });
    if (values.target <= values.start || values.target <= todayISO() || values.start < todayISO()) {
      const status = document.querySelector("[data-rp-status]");
      if (status) status.textContent = i18nFor(ctx).S("Choose a start date today or later and a test date after it.", "Elige una fecha de inicio hoy o después y una fecha de prueba posterior.");
      return true;
    }
    saveBand(ctx.band, next);
    ctx.rerender();
    return true;
  }
  const reflection = e.target.closest("[data-rp-reflect]");
  if (reflection) {
    const text = document.querySelector("[data-rp-reflection]")?.value.trim() || "";
    const focus = document.querySelector("[data-rp-reflection-focus]")?.value || "auto";
    const talked = Boolean(document.querySelector("[data-rp-talked]")?.checked);
    const settings = safeSettings(allPlans().bands[ctx.band]);
    settings.reflections[String(weekIndex(settings).week)] = { text: text.slice(0, 500), focus, talked, savedAt: new Date().toISOString() };
    saveBand(ctx.band, settings);
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-rp-print]")) {
    window.print();
    return true;
  }
  return false;
}
