// Search the lightweight index, then build a shareable practice playlist.
// Links contain content IDs only; answers and student names never leave the device.
import { bandSwitchHTML, crumbsHTML, domainGlyph } from "../components.js";
import { bandRows } from "../content.js";
import { estimateMinutes } from "../learning.js";
import { activityStatus } from "../practice-plan.js";
import { loadRecord } from "../store.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { ART, BASE, CORE_DOMAINS, DOMAIN_META, TIERS, announce, bandLabel, html, icon, raw, toHtml } from "../util.js";
import { activityHref } from "./room.js";

const LIMIT = 12;
export const PAGE_SIZE = 24;
let page = 1;
const STATUS = { new: "Not started", draft: "In progress", retry: "Try again", done: "Completed" };
const STATUS_ES = { new: "Sin empezar", draft: "En progreso", retry: "Inténtalo de nuevo", done: "Terminada" };
const STATUS_ICON = { new: "clock", draft: "writing", retry: "retry", done: "check" };
let rows = [];
let selected = [];
let band = "";
let filters = {};
// Set at the top of render(); the helpers below build markup for that render.
let I = makeI18n("en");
const dom = (d) => I.T(d, DOMAIN_META[d]?.es);
const tier = (k) => (TIERS[k] ? I.T(TIERS[k].name, TIERS[k].es) : k);
const plural = (n, one, many) => (n === 1 ? one : many);

export function filterActivities(items, { q = "", domain = "", level = "", status = "" } = {}) {
  const words = q.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(
    (r) =>
      (!domain || r.domain === domain) &&
      (!level || r.level === level) &&
      (!status || r.status === status) &&
      words.every((word) =>
        `${r.title} ${r.skill || ""} ${r.domain}`.toLocaleLowerCase().includes(word),
      ),
  );
}

export function pageActivities(items, requested = 1) {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.max(1, Math.min(pages, Math.floor(Number(requested)) || 1));
  return { items: items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), page: current, pages };
}

export function playlistURL(ids, gradeBand) {
  const q = new URLSearchParams({
    ids: ids.slice(0, LIMIT).join(","),
    grades: gradeBand,
    t: "My practice set",
  });
  return `${BASE}/play?${q}`;
}

function syncURL() {
  const q = new URLSearchParams({ grades: band });
  for (const [key, value] of Object.entries(filters)) if (value) q.set(key, value);
  if (page > 1) q.set("page", page);
  if (selected.length) q.set("pick", selected.join(","));
  history.replaceState({}, "", `${BASE}/library?${q}`);
}

function itemHTML(r) {
  const on = selected.includes(r.id);
  return html`<li class="library-item lib-item d-${r.domain.toLowerCase()}">
    <span class="prog-tile">${domainGlyph(r.domain)}</span>
    <div class="lib-item-body">
      <p class="lib-meta">${dom(r.domain)} · ${tier(r.level)}</p>
      <a class="library-title" href="${activityHref(r.domain, r.level, r.id)}?grades=${band}">${r.title}</a>
      <p class="fine">${r.skill || I.T("Language practice", "Práctica de lenguaje")} · ${I.T(`about ${estimateMinutes([r])} minutes`, `unos ${estimateMinutes([r])} minutos`)}</p>
      <span class="lib-status is-${r.status}">${icon(STATUS_ICON[r.status])} ${I.T(STATUS[r.status], STATUS_ES[r.status])}</span>
    </div>
    <button type="button" class="btn small library-add" data-pick="${r.id}" aria-pressed="${on}" aria-label="${on ? I.S(`Remove ${r.title} from practice set`, `Quitar ${r.title} del conjunto de práctica`) : I.S(`Add ${r.title} to practice set`, `Agregar ${r.title} al conjunto de práctica`)}">${icon(on ? "check" : "bookmark")} ${on ? I.T("Added", "Agregada") : I.T("Add", "Agregar")}</button>
  </li>`;
}

function resultHTML() {
  const matches = filterActivities(rows, filters);
  const slice = pageActivities(matches, page);
  page = slice.page;
  return html`<div class="lib-count-row"><h2 class="library-count" id="libraryResultTitle" tabindex="-1">${I.T("Activities", "Actividades")}</h2><p role="status">${I.T(`${matches.length} ${plural(matches.length, "activity", "activities")} found${matches.length ? ` · showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, matches.length)}` : ""}`, `${matches.length} ${plural(matches.length, "actividad encontrada", "actividades encontradas")}${matches.length ? ` · mostrando ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, matches.length)}` : ""}`)}</p></div>
    ${
      matches.length
        ? html`<ul class="library-results lib-results">${slice.items.map(itemHTML)}</ul>`
        : html`<div class="empty-state lib-empty"><img src="${ART}/empty.svg" alt="" width="320" height="240" /><h2>${I.T("No matching activities", "No hay actividades que coincidan")}</h2><p>${I.T("Try a shorter search or choose a different skill, support, or progress filter.", "Prueba una búsqueda más corta o elige otro filtro de destreza, apoyo o progreso.")}</p><button type="button" class="btn" data-clear-filters>${I.T("Clear filters", "Borrar filtros")}</button></div>`
    }
    ${slice.pages > 1 ? html`<nav class="library-pagination" aria-label="${I.S("Activity result pages", "Páginas de resultados de actividades")}"><button type="button" class="btn" data-page="${page - 1}" ${page === 1 ? raw("disabled") : ""}>${icon("arrow-left")} ${I.T("Previous", "Anterior")}</button><span>${I.T(`Page ${page} of ${slice.pages}`, `Página ${page} de ${slice.pages}`)}</span><button type="button" class="btn" data-page="${page + 1}" ${page === slice.pages ? raw("disabled") : ""}>${I.T("Next", "Siguiente")} ${icon("arrow-right")}</button></nav>` : ""}`;
}

function setHTML() {
  const picked = selected.map((id) => rows.find((r) => r.id === id)).filter(Boolean);
  if (!picked.length) return html`<div class="library-set-empty"><h2 id="practiceSetTitle">${icon("list")} ${I.T("Build a practice set", "Crea un conjunto de práctica")}</h2><p class="fine">${I.T(`Use “Add” on any activity to combine up to ${LIMIT} into a shareable session.`, `Usa “Agregar” en cualquier actividad para combinar hasta ${LIMIT} en una sesión que se puede compartir.`)}</p></div>`;
  return html`<h2 id="practiceSetTitle">${icon("list")} ${I.T("Your practice set", "Tu conjunto de práctica")}</h2>
    <p class="lib-set-count"><strong>${picked.length}/${LIMIT}</strong> ${I.T(`activities · about ${estimateMinutes(picked)} minutes`, `actividades · unos ${estimateMinutes(picked)} minutos`)}</p>
    <p class="fine">${I.T("Add activities in the order you want to practice. A shared link includes only the activities, not your answers or progress.", "Agrega las actividades en el orden en que quieres practicar. Un enlace compartido incluye solo las actividades, no tus respuestas ni tu progreso.")}</p>
    <ol class="library-picked lib-picked">${picked.map((r) => html`<li class="d-${r.domain.toLowerCase()}"><span class="lib-picked-title">${r.title}</span><button type="button" class="ghost small" data-remove-pick="${r.id}" aria-label="${I.S(`Remove ${r.title}`, `Quitar ${r.title}`)}">${icon("x")} ${I.T("Remove", "Quitar")}</button></li>`)}</ol>
    <div class="row-actions"><a class="btn btn-primary" href="${playlistURL(selected, band)}">${I.T("Start this set", "Empezar este conjunto")} ${icon("arrow-right")}</a><button type="button" class="btn" data-copy-set>${icon("copy")} ${I.T("Copy assignment link", "Copiar enlace de la tarea")}</button><button type="button" class="ghost" data-clear-set>${I.T("Clear set", "Borrar conjunto")}</button></div>
    <label class="field"><span>${I.T("Assignment link — copy or share", "Enlace de la tarea: copia o comparte")}</span><input id="assignmentLink" type="text" readonly value="${new URL(playlistURL(selected, band), location.origin).href}" data-nsr-ignore /></label>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  band = ctx.band;
  const q = new URLSearchParams(location.search);
  page = Number(q.get("page")) || 1;
  filters = {
    q: (q.get("q") || "").slice(0, 120),
    domain: q.get("domain") || "",
    level: q.get("level") || "",
    status: q.get("status") || "",
  };
  if (!CORE_DOMAINS.includes(filters.domain)) filters.domain = "";
  if (!TIERS[filters.level]) filters.level = "";
  if (!STATUS[filters.status]) filters.status = "";
  const records = new Map();
  rows = (await bandRows(band))
    .filter((r) => CORE_DOMAINS.includes(r.domain))
    .map((r) => {
      const key = `${r.domain}:${r.level}`;
      if (!records.has(key)) records.set(key, loadRecord(band, r.domain, r.level));
      return { ...r, status: activityStatus(records.get(key), r.id) };
    });
  const ids = new Set(rows.map((r) => r.id));
  selected = [...new Set((q.get("pick") || "").split(","))]
    .filter((id) => ids.has(id))
    .slice(0, LIMIT);
  const options = (list, value) =>
    list.map(
      ([v, label]) =>
        html`<option value="${v}" ${v === value ? raw("selected") : ""}>${label}</option>`,
    );
  return {
    title: I.S("Activity library", "Biblioteca de actividades"),
    html: html`${crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/`],
      [I.S("Activity library", "Biblioteca de actividades"), null],
    ])}
    <div class="lib-page">
    <header class="prog-hero lib-hero"><div class="prog-hero-copy"><p class="eyebrow">${icon("library")} ${I.T("Find a task · Build a practice set", "Encuentra una tarea · Crea un conjunto de práctica")}</p><h1 tabindex="-1">${I.T("Activity library", "Biblioteca de actividades")}</h1><p class="lead">${I.T("Search by topic or skill. Pick a task to open it, or combine up to 12 into one shareable session.", "Busca por tema o destreza. Elige una tarea para abrirla o combina hasta 12 en una sesión que se puede compartir.")}</p>${bandSwitchHTML(band, ctx.bands)}</div></header>
    <div class="lib-layout">
    <aside class="library-set lib-set" aria-labelledby="practiceSetTitle" id="practiceSet">${setHTML()}</aside>
    <section class="lib-main" aria-label="${I.S("Find activities", "Buscar actividades")}"><div class="library-filters lib-filters">
      <label class="field library-search"><span>${I.T("Search topics or skills", "Buscar temas o destrezas")}</span><input type="search" id="librarySearch" maxlength="120" value="${filters.q}" placeholder="${I.S("Try garden, evidence, compare…", "Prueba con garden, evidence, compare…")}" aria-controls="libraryResults" data-nsr-ignore /></label>
      <label class="field"><span>${I.T("Skill", "Destreza")}</span><select id="libraryDomain" data-library-filter="domain" data-nsr-ignore>${options([["", I.S("All four skills", "Las cuatro destrezas")], ...CORE_DOMAINS.map((d) => [d, I.S(d, DOMAIN_META[d]?.es)])], filters.domain)}</select></label>
      <label class="field"><span>${I.T("Support", "Apoyo")}</span><select id="libraryLevel" data-library-filter="level" data-nsr-ignore>${options([["", I.S("All support choices", "Todas las opciones de apoyo")], ...Object.entries(TIERS).map(([k, t]) => [k, I.S(t.name, t.es)])], filters.level)}</select></label>
      <label class="field"><span>${I.T("My progress", "Mi progreso")}</span><select id="libraryStatus" data-library-filter="status" data-nsr-ignore>${options([["", I.S("Any progress", "Cualquier progreso")], ...Object.entries(STATUS).map(([k, v]) => [k, I.S(v, STATUS_ES[k])])], filters.status)}</select></label>
    </div><p class="fine">${bandLabel(band)} · ${I.T("Progress is for this browser. Support changes tasks and scaffolds: Starting uses words and short sentences; Growing connects ideas; Expanding adds details and explanations. These are not WIDA scores.", "El progreso es solo para este navegador. El apoyo cambia las tareas y los andamios: Comenzando usa palabras y oraciones cortas; Creciendo conecta ideas; Ampliando agrega detalles y explicaciones. No son puntajes de WIDA.")}</p>
    <div class="library-quick lib-quick" aria-label="${I.S("Quick activity searches", "Búsquedas rápidas de actividades")}"><span>${I.T("Start with:", "Empieza con:")}</span>${["garden", "evidence", "compare", "sequence"].map((topic) => html`<button type="button" class="cat-chip" data-quick-topic="${topic}">${icon("search")} ${topic}</button>`)}</div>
    <div id="libraryResults">${resultHTML()}</div></section>
    </div></div>`,
  };
}

function refreshResults() {
  document.getElementById("libraryResults").innerHTML = toHtml(resultHTML());
  syncURL();
}
export function onInput(e) {
  if (e.target.id !== "librarySearch") return;
  page = 1;
  filters.q = e.target.value;
  refreshResults();
}
export function onChange(e) {
  const key = e.target.dataset.libraryFilter;
  if (!key) return;
  page = 1;
  filters[key] = e.target.value;
  refreshResults();
}
export function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const t = e.target;
  const pageButton = t.closest("[data-page]");
  if (pageButton) {
    page = Number(pageButton.dataset.page);
    refreshResults();
    document.getElementById("libraryResultTitle")?.focus();
    return true;
  }
  const quick = t.closest("[data-quick-topic]");
  if (quick) {
    page = 1;
    filters = { q: quick.dataset.quickTopic };
    syncURL();
    ctx.rerender().then(() => document.getElementById("libraryResultTitle")?.focus());
    return true;
  }
  if (t.closest("[data-clear-filters]")) {
    page = 1;
    filters = {};
    syncURL();
    ctx.rerender().then(() => document.getElementById("librarySearch")?.focus());
    return true;
  }
  const pick = t.closest("[data-pick], [data-remove-pick]");
  if (pick) {
    const id = pick.dataset.pick || pick.dataset.removePick;
    const at = selected.indexOf(id);
    if (at >= 0) selected.splice(at, 1);
    else if (selected.length < LIMIT && rows.some((r) => r.id === id)) selected.push(id);
    else {
      announce(I.S(`A practice set holds up to ${LIMIT} activities. Remove one before adding another.`, `Un conjunto de práctica admite hasta ${LIMIT} actividades. Quita una antes de agregar otra.`));
      return true;
    }
    document.getElementById("practiceSet").innerHTML = toHtml(setHTML());
    refreshResults();
    const selector = `[data-pick="${CSS.escape(id)}"]`;
    (document.querySelector(selector) || document.getElementById("librarySearch"))?.focus({
      preventScroll: true,
    });
    announce(I.S(`${selected.length} ${plural(selected.length, "activity", "activities")} in your practice set.`, `${selected.length} ${plural(selected.length, "actividad", "actividades")} en tu conjunto de práctica.`));
    return true;
  }
  if (t.closest("[data-clear-set]")) {
    selected = [];
    document.getElementById("practiceSet").innerHTML = toHtml(setHTML());
    refreshResults();
    document.getElementById("librarySearch").focus();
    announce(I.S("Practice set cleared. Your saved progress is unchanged.", "Conjunto de práctica borrado. Tu progreso guardado no cambió."));
    return true;
  }
  if (t.closest("[data-copy-set]")) {
    const field = document.getElementById("assignmentLink");
    navigator.clipboard?.writeText(field.value).then(
      () => announce(I.S("Assignment link copied.", "Enlace de la tarea copiado.")),
      () => {
        field.focus();
        field.select();
        announce(I.S("Select and copy the assignment link below.", "Selecciona y copia el enlace de la tarea que aparece abajo."));
      },
    );
    if (!navigator.clipboard) {
      field.focus();
      field.select();
      announce(I.S("Select and copy the assignment link below.", "Selecciona y copia el enlace de la tarea que aparece abajo."));
    }
    return true;
  }
}
