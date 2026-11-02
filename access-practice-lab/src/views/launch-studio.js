// Teacher launch builder. Links contain only public task IDs and instructional settings.
// No roster, name, response, or student progress is encoded in a launch URL.
import { bandRows, loadBlueprint, loadDomain, loadExemplars, loadSpeakingTasks, loadWorlds, loadWritingTasks } from "../content.js";
import { stationCard, stationCardHTML, stationOptions } from "../lang/teacher.js";
import { crumbsHTML } from "../components.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { BASE, CORE_DOMAINS, DOMAIN_META, html, icon, raw } from "../util.js";
import { activityHref } from "./room.js";

const state = { band: "6-8", domain: "", skill: "", length: "", mode: "learning", selected: "", rows: [], station: "" };
const stationCache = { data: null };
let I = makeI18n("en");
const DOMAIN_ES = { Listening: "Escuchar", Reading: "Leer", Speaking: "Hablar", Writing: "Escribir" };
const domainName = (name) => I.S(name, DOMAIN_ES[name]);

/** Content behind the station sheets: the same files tools/generate-access-studio-printables.mjs reads. */
async function stationData() {
  if (!stationCache.data) {
    const [worlds, speaking, writing, exemplars, blueprint] = await Promise.all([
      loadWorlds().catch(() => ({ worlds: [] })),
      loadSpeakingTasks().catch(() => ({ tasks: [] })),
      loadWritingTasks().catch(() => ({ tasks: [] })),
      loadExemplars().catch(() => []),
      loadBlueprint().catch(() => ({})),
    ]);
    stationCache.data = { worlds: worlds.worlds || [], speaking: speaking.tasks || [], writing: writing.tasks || [], exemplars, standards: blueprint.standards || [] };
  }
  return stationCache.data;
}

async function selectedStation() {
  const data = { ...(await stationData()), band: state.band };
  const options = stationOptions({ ...data, activities: state.rows });
  if (!options.some((o) => `${o.kind}:${o.id}` === state.station)) state.station = options[0] ? `${options[0].kind}:${options[0].id}` : "";
  const [kind, ...rest] = state.station.split(":");
  const sel = { kind, id: rest.join(":"), mode: state.mode };
  if (kind === "activity") {
    const row = state.rows.find((r) => r.id === sel.id);
    const domain = row ? await loadDomain(state.band, row.domain).catch(() => null) : null;
    const activity = domain?.levels?.[row.level]?.activities?.find((a) => a.id === sel.id);
    data.activity = activity ? { domain: row.domain, level: row.level, activity } : null;
  }
  return { options, card: stationCard(sel, data) };
}

function stationPanel({ options, card }) {
  const groups = [["world", I.S("Language Worlds", "Mundos lingüísticos")], ["studio", I.S("Speaking and Writing Studios", "Estudios de expresión oral y escritura")], ["activity", I.S("Activities", "Actividades")]];
  return html`<section class="panel station-panel" aria-labelledby="station-title">
    <h2 id="station-title">${I.T("Print Station Cards / Answer Key & Teacher Notes", "Imprimir tarjetas de estación / Claves y notas docentes")}</h2>
    <p>${I.T("Choose a World, a Studio task, or an Activity for a one-page station sheet: direct link, WIDA ELD standard, Key Language Use, look-fors, oral probing questions, and exemplar responses in the practice bands early / building / strong.", "Elija un Mundo, una tarea de Estudio o una Actividad para obtener una hoja de estación de una página: enlace directo, estándar WIDA ELD, uso clave del lenguaje, aspectos que observar, preguntas orales de sondeo y respuestas de ejemplo en las bandas de práctica inicial / en desarrollo / sólido. La hoja impresa está en inglés.")}</p>
    <label class="field station-pick">${I.T("Station item", "Elemento de estación")}<select data-station-field ${options.length ? "" : "disabled"}>${groups.map(([kind, label]) => {
      const list = options.filter((o) => o.kind === kind);
      return list.length ? html`<optgroup label="${label}">${list.map((o) => html`<option value="${o.kind}:${o.id}" ${`${o.kind}:${o.id}` === state.station ? "selected" : ""}>${o.label}</option>`)}</optgroup>` : "";
    })}</select></label>
    ${card ? html`<div class="station-preview" data-station-preview>${raw(stationCardHTML(card, location.origin))}</div>
      <div class="row-actions"><button type="button" class="btn btn-primary" data-station-print>${icon("print")} ${I.T("Print station card", "Imprimir tarjeta de estación")}</button></div>
      <p class="fine">${I.T("Teacher copy: it includes exemplar responses. The same sheets are generated for the Teacher Hub packets.", "Copia docente: incluye respuestas de ejemplo. Las mismas hojas se generan para los paquetes del Centro docente.")}</p>` : html`<p role="status">${I.T("No station content is available for this grade band.", "No hay contenido de estación para este nivel de grados.")}</p>`}
  </section>`;
}

function options(items, selected, emptyLabel) {
  return html`<option value="">${emptyLabel}</option>${items.map((item) => html`<option value="${item.value}" ${item.value === selected ? "selected" : ""}>${item.label}</option>`)}`;
}

function taskUrl(row) {
  if (!row) return "";
  const url = new URL(activityHref(row.domain, row.level, row.id), location.origin);
  url.searchParams.set("grades", state.band);
  if (state.mode === "independent") url.searchParams.set("mode", "independent");
  return url.href;
}

function selectedRow() { return state.rows.find((row) => row.id === state.selected) || null; }

function filteredRows() {
  return state.rows.filter((row) =>
    (!state.domain || row.domain === state.domain) &&
    (!state.skill || row.skill === state.skill) &&
    (!state.length || Number(row.minutes || 0) <= Number(state.length)),
  );
}

const modeLabel = (mode) => (mode === "independent" ? I.T("Independent: try on your own first", "Independiente: intente primero por su cuenta") : I.T("Learning: supports and feedback", "Aprendizaje: con apoyos y comentarios"));

/** The student ticket: what a learner needs to open the activity. No QR code (the lab has no verified encoder). */
function ticketHTML(row, url) {
  return html`<article class="ls-ticket d-${row.domain.toLowerCase()}" aria-label="${I.S("Student launch ticket", "Boleto de acceso para estudiantes")}">
    <p class="ls-ticket-brand">${icon(DOMAIN_META[row.domain]?.icon || "launch")} ACCESS Practice Lab</p>
    <h3>${row.title}</h3>
    <p class="ls-ticket-meta">${domainName(row.domain)} · ${row.skill || I.S("Language practice", "Práctica de lenguaje")} · ${row.minutes || I.S("Flexible", "Flexible")} min · ${I.S(`Grades ${state.band.replace("-", "–")}`, `Grados ${state.band.replace("-", "–")}`)}</p>
    <p class="ls-ticket-label">${I.T("Open this link", "Abre este enlace")}</p>
    <p class="ls-ticket-url">${url}</p>
    <p class="ls-ticket-mode">${modeLabel(state.mode)}</p>
  </article>`;
}

function configureHTML(rows, skills, domains, taskOptions) {
  return html`<div class="teacher-launch-grid">
    <label class="field">${I.T("Grade band", "Nivel de grados")}<select data-launch-field="band"><option value="3-5" ${state.band === "3-5" ? "selected" : ""}>${I.S("Grades 3–5", "Grados 3–5")}</option><option value="6-8" ${state.band === "6-8" ? "selected" : ""}>${I.S("Grades 6–8", "Grados 6–8")}</option></select></label>
    <label class="field">${I.T("Language domain", "Dominio del lenguaje")}<select data-launch-field="domain">${options(domains, state.domain, I.S("All four domains", "Los cuatro dominios"))}</select></label>
    <label class="field">${I.T("Target skill", "Destreza meta")}<select data-launch-field="skill">${options(skills.map((s) => ({ value: s, label: s })), state.skill, I.S("Any skill", "Cualquier destreza"))}</select></label>
    <label class="field">${I.T("Session length", "Duración de la sesión")}<select data-launch-field="length">${options([{ value: "10", label: I.S("Up to 10 minutes", "Hasta 10 minutos") }, { value: "20", label: I.S("Up to 20 minutes", "Hasta 20 minutos") }, { value: "30", label: I.S("Up to 30 minutes", "Hasta 30 minutos") }], state.length, I.S("Any length", "Cualquier duración"))}</select></label>
    <label class="field">${I.T("Practice mode", "Modo de práctica")}<select data-launch-field="mode"><option value="learning" ${state.mode === "learning" ? "selected" : ""}>${I.S("Learning — supports and feedback", "Aprendizaje: con apoyos y comentarios")}</option><option value="independent" ${state.mode === "independent" ? "selected" : ""}>${I.S("Independent — try on your own first", "Independiente: intente primero por su cuenta")}</option></select></label>
    <label class="field teacher-launch-task">${I.T("Activity", "Actividad")}<select data-launch-field="selected" ${rows.length ? "" : "disabled"}>${options(taskOptions, state.selected, rows.length ? I.S("Choose an activity", "Elija una actividad") : I.S("No matching activities", "No hay actividades que coincidan"))}</select></label>
  </div>`;
}

function shareHTML(row, url) {
  return html`<div class="teacher-launch-preview" aria-live="polite"><a class="btn btn-primary" href="${url}">${I.T("Open student activity", "Abrir la actividad del estudiante")} ${icon("external")}</a><span class="fine">${I.T("Opens the activity exactly as a learner sees it.", "Abre la actividad tal como la ve el estudiante.")}</span></div>
    <div class="ls-link">
      <label class="field teacher-launch-url" for="launchUrl">${I.T("Direct link", "Enlace directo")}</label>
      <div class="ls-link-row"><input id="launchUrl" type="url" readonly value="${url}" data-launch-url aria-label="${I.S("Direct student activity link", "Enlace directo a la actividad del estudiante")}"><button type="button" class="btn btn-primary" data-launch-copy>${icon("copy")} <span data-launch-copy-label>${I.T("Copy link", "Copiar enlace")}</span></button></div>
    </div>
    <div class="row-actions"><button type="button" class="btn" data-launch-print>${icon("print")} ${I.T("Print launch card", "Imprimir tarjeta de acceso")}</button><button type="button" class="btn" data-launch-sheet>${icon("print")} ${I.T("Print tickets (8 per page)", "Imprimir boletos (8 por página)")}</button></div>
    <p class="fine" data-launch-status role="status" aria-live="polite">${I.T("Share the link with students or display it for the class. A QR code is not shown because this application has no verified QR encoder.", "Comparta el enlace con los estudiantes o muéstrelo a la clase. No se muestra un código QR porque esta aplicación no tiene un codificador QR verificado.")}</p>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  state.band = ctx.band;
  try { state.rows = await bandRows(state.band); }
  catch { state.rows = []; }
  const rows = filteredRows();
  if (!rows.some((row) => row.id === state.selected)) state.selected = rows[0]?.id || "";
  const row = selectedRow();
  const skills = [...new Set(state.rows.filter((r) => !state.domain || r.domain === state.domain).map((r) => r.skill).filter(Boolean))].sort();
  const url = taskUrl(row);
  const domains = CORE_DOMAINS.map((name) => ({ value: name, label: domainName(name) }));
  const taskOptions = rows.map((r) => ({ value: r.id, label: `${r.title} · ${domainName(r.domain)} · ${r.minutes || "—"} min` }));
  const station = await selectedStation();
  return {
    title: I.S("Teacher Launch Studio", "Estudio de lanzamiento docente"),
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], [I.S("Teacher Launch Studio", "Estudio de lanzamiento docente"), null]])}
    <div class="ls">
    <section class="ls-hero">
      <div><p class="eyebrow">${icon("launch")} ${I.T("Teacher workspace", "Espacio docente")}</p><h1 tabindex="-1">${I.T("Teacher Launch Studio", "Estudio de lanzamiento docente")}</h1>
      <p class="lead">${I.T("Build a focused, direct classroom link in a few steps. Learners can open it without an account.", "Cree un enlace directo y enfocado para la clase en pocos pasos. Los estudiantes pueden abrirlo sin cuenta.")}</p></div>
      <ol class="ls-flow" aria-label="${I.S("Steps", "Pasos")}"><li>${I.T("Choose an activity", "Elija una actividad")}</li><li>${I.T("Copy the link", "Copie el enlace")}</li><li>${I.T("Share or print a ticket", "Comparta o imprima un boleto")}</li></ol>
    </section>
    <div class="ls-layout">
    <section class="panel teacher-launch-panel" aria-labelledby="launch-config-title">
      <h2 id="launch-config-title" class="workbook-heading"><span aria-hidden="true">1</span> ${I.T("Configure a practice launch", "Configure un acceso a la práctica")}</h2>
      <p>${I.T("Choose an existing activity. The link includes its grade band and selected practice mode; it does not include student information.", "Elija una actividad existente. El enlace incluye su nivel de grados y el modo de práctica elegido; no incluye información de los estudiantes.")}</p>
      ${configureHTML(rows, skills, domains, taskOptions)}
    </section>
    <section class="panel ls-share" aria-labelledby="launch-share-title">
      <h2 id="launch-share-title" class="workbook-heading"><span aria-hidden="true">2</span> ${I.T("Share it", "Compártalo")}</h2>
      ${row ? html`${ticketHTML(row, url)}${shareHTML(row, url)}` : html`<p role="status">${I.T("No activity matches those choices. Try a different grade band, domain, skill, or session length.", "Ninguna actividad coincide con esas opciones. Pruebe otro nivel de grados, dominio, destreza o duración.")}</p>`}
    </section>
    </div>
    ${stationPanel(station)}
    <section class="panel ls-quick"><h2>${I.T("Quick links", "Enlaces rápidos")}</h2><div class="row-actions"><a class="btn" href="${BASE}/classroom">${icon("classroom")} ${I.T("Whole-Class Language Studio", "Estudio de lenguaje para toda la clase")}</a><a class="btn" href="/access-teacher/">${icon("teacher")} ${I.T("Open Teacher Hub", "Abrir el Centro docente")}</a><a class="btn" href="${BASE}/">${icon("home")} ${I.T("Return to student lab", "Volver al laboratorio de estudiantes")}</a></div><p class="fine">${I.T("The Teacher Hub stores its local evidence in this browser. Launch links work without sending roster or learner data.", "El Centro docente guarda sus evidencias locales en este navegador. Los enlaces de acceso funcionan sin enviar listas de estudiantes ni datos de los alumnos.")}</p></section>
    </div>`,
  };
}

export async function onChange(e, ctx) {
  if (e.target.matches("[data-station-field]")) {
    state.station = e.target.value;
    ctx.rerender();
    return;
  }
  const field = e.target.dataset.launchField;
  if (!field) return;
  state[field] = e.target.value;
  if (field === "band") {
    state.domain = ""; state.skill = ""; state.selected = "";
    ctx.setBand(state.band);
  }
  if (field === "domain" || field === "band") state.skill = "";
  ctx.rerender();
}

export async function onClick(e, ctx) {
  const L = ctx ? i18nFor(ctx) : I;
  const copy = e.target.closest("[data-launch-copy]");
  const print = e.target.closest("[data-launch-print]");
  if (e.target.closest("[data-station-print]")) {
    printStation();
    return true;
  }
  const url = taskUrl(selectedRow());
  const status = document.querySelector("[data-launch-status]");
  if (copy) {
    try {
      await navigator.clipboard.writeText(url);
      if (status) status.textContent = L.S("Link copied. It contains the selected activity and mode only.", "Enlace copiado. Contiene solo la actividad y el modo elegidos.");
      const label = copy.querySelector("[data-launch-copy-label]");
      if (label) {
        label.textContent = L.S("Copied", "Copiado");
        copy.classList.add("is-copied");
        setTimeout(() => { label.textContent = L.S("Copy link", "Copiar enlace"); copy.classList.remove("is-copied"); }, 2500);
      }
    } catch {
      const input = document.querySelector("[data-launch-url]");
      input?.focus(); input?.select();
      if (status) status.textContent = L.S("Clipboard access is unavailable. The link is selected so you can copy it with your keyboard.", "No se puede acceder al portapapeles. El enlace está seleccionado para que lo copie con el teclado.");
    }
    return true;
  }
  if (print) { printTickets(1); return true; }
  if (e.target.closest("[data-launch-sheet]")) { printTickets(8); return true; }
  return false;
}

/** Print only the ticket(s): copy them into a body-level host so nothing else takes a page. */
function printTickets(count) {
  const ticket = document.querySelector(".ls-ticket");
  if (!ticket) return;
  let host = document.getElementById("ticketPrint");
  if (!host) {
    host = Object.assign(document.createElement("div"), { id: "ticketPrint" });
    document.body.append(host);
  }
  host.className = count > 1 ? "is-sheet" : "is-single";
  host.replaceChildren(...Array.from({ length: count }, () => ticket.cloneNode(true)));
  document.body.dataset.printing = "tickets";
  const done = () => {
    delete document.body.dataset.printing;
    host.replaceChildren();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}

/** Print only the station sheet: copy it into a body-level host so nothing else takes a page. */
function printStation() {
  const card = document.querySelector("[data-station-preview] .station-card");
  if (!card) return;
  let host = document.getElementById("stationPrint");
  if (!host) {
    host = Object.assign(document.createElement("div"), { id: "stationPrint" });
    document.body.append(host);
  }
  host.replaceChildren(card.cloneNode(true));
  document.body.dataset.printing = "station";
  const done = () => {
    delete document.body.dataset.printing;
    host.replaceChildren();
    window.removeEventListener("afterprint", done);
  };
  window.addEventListener("afterprint", done);
  window.print();
}
