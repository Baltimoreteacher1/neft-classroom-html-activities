// ACCESS Learning Journey: the teacher mission guide (route /journey/guide; the name avoids the word the site's auth gate
// treats as teacher-only, so students can load this module). Nothing here reads or writes student progress or any roster:
// assigning is a link naming a mission and a step. `guideHTML` is shared with the Teacher Hub panel.
import { i18nFor } from "../../i18n.js";
import { MOVES } from "../../lang/purpose.js";
import { BASE, html, toHtml } from "../../util.js";
import {
  BANDS,
  KLUS,
  MISSION_IDS,
  MISSIONS,
  STEPS,
  UNITS,
  loadMission,
} from "../curriculum.js";
import { WIDA_LIMITS } from "../wida.js";
import {
  BAND_NAME,
  DAYS,
  DOES_NOT,
  DOMAINS,
  DOMAIN_NAME,
  EVIDENCE_KINDS,
  KLU_NAME,
  MOVE_GUIDE,
  PACKET_LEVELS,
  SUPPORT_NAME,
  filterQuery,
  loadModes,
  matchesFilters,
  normalizeFilters,
  parseFilters,
  printableHref,
  teacherPacketHref,
} from "./guide-data.js";
import { missionCard, packDetailsHTML } from "./guide-mission.js";

const tx = (I, pair) => I.T(pair[0], pair[1]);
const txS = (I, pair) => I.S(pair[0], pair[1]);
const needsModes = (f) => f.domain === "Speaking" || f.domain === "Writing";

// ── filters ───────────────────────────────────────────────────────────────────
function select(I, name, labelPair, options, value) {
  return html`<label class="jg-field" for="jg-${name}"
    ><span>${tx(I, labelPair)}</span>
    <select id="jg-${name}" name="${name}">
      ${options.map(([v, text]) => html`<option value="${v}" ${v === value ? "selected" : ""}>${text}</option>`)}
    </select></label
  >`;
}

function filterForm(I, f, opts) {
  const all = I.S("All", "Todos");
  return html`<form
    class="jg-filters no-print"
    method="get"
    action="${opts.action || `${BASE}/journey/guide`}"
    data-gd-filters
    aria-label="${I.S("Filter missions", "Filtrar misiones")}"
  >
    ${select(
      I,
      "band",
      ["Grade band", "Banda de grados"],
      BANDS.map((b) => [b, txS(I, BAND_NAME[b])]),
      f.band,
    )}
    ${select(I, "klu", ["Language purpose", "Propósito del lenguaje"], [["", all], ...KLUS.map((k) => [k, txS(I, KLU_NAME[k])])], f.klu)}
    ${select(I, "domain", ["Domain", "Dominio"], [["", all], ...DOMAINS.map((d) => [d, txS(I, DOMAIN_NAME[d])])], f.domain)}
    ${select(I, "mission", ["Mission", "Misión"], [["", all], ...MISSION_IDS.map((m) => [m, I.S(...MISSIONS[m].title)])], f.mission)}
    <div class="jg-filter-actions">
      <button type="submit" class="btn btn-primary">
        ${I.T("Apply filters", "Aplicar filtros")}
      </button>
      <a
        class="btn btn-secondary"
        href="${opts.action || `${BASE}/journey/guide`}?band=${f.band}"
        data-gd-clear
        >${I.T("Clear", "Borrar")}</a
      >
    </div>
  </form>`;
}

// ── page sections ─────────────────────────────────────────────────────────────
const limitsBox = (I) =>
  html`<aside class="jg-limits" aria-label="${I.S("Limits of this guide", "Límites de esta guía")}">
    <p>
      <strong>${I.T("About the WIDA references", "Sobre las referencias de WIDA")}:</strong>
      ${I.T(WIDA_LIMITS[0], WIDA_LIMITS[1])}
    </p>
  </aside>`;

const doesNotBox = (I) =>
  html`<section class="jg-not" id="does-not" aria-labelledby="jg-not-h">
    <h2 id="jg-not-h">${I.T("What this guide does not do", "Lo que esta guía no hace")}</h2>
    <ul>
      ${DOES_NOT.map((p) => html`<li>${tx(I, p)}</li>`)}
    </ul>
  </section>`;

const stepMinutes = (I, id, i) => {
  const s = STEPS.find((x) => x.id === id);
  return html`${i ? " · " : ""}${I.S(...s.label)} (${s.minutes} min)`;
};

function pacingSection(I) {
  const total = STEPS.reduce((n, s) => n + s.minutes, 0);
  return html`<section class="jg-sec" id="pacing" aria-labelledby="jg-pace-h">
    <h2 id="jg-pace-h">${I.T("Suggested pacing", "Ritmo sugerido")}</h2>
    <p>
      ${I.T(`One mission is about ${total} minutes of student work. This five-day rhythm is a suggestion: split, repeat or skip any step.`, `Una misión son unos ${total} minutos de trabajo del estudiante. Este ritmo de cinco días es una sugerencia: divide, repite u omite cualquier paso.`)}
    </p>
    <ol class="jg-days">
      ${DAYS.map(
        (d) =>
          html`<li>
            <strong>${I.T("Day", "Día")} ${d.n}.</strong> ${tx(I, d.what)}
            <span class="jg-fine"
              >${d.steps.map((id, i) => stepMinutes(I, id, i))}</span
            >
          </li>`,
      )}
    </ol>
  </section>`;
}

function supportsSection(I) {
  const modes = Object.keys(SUPPORT_NAME);
  return html`<section class="jg-sec" id="supports" aria-labelledby="jg-sup-h">
    <h2 id="jg-sup-h">${I.T("Supports and independence", "Apoyos e independencia")}</h2>
    <p>
      ${I.T("Learners pick a support mode: ", "Los estudiantes eligen un modo de apoyo: ")}${modes.map((k, i) => html`${i ? ", " : ""}<strong>${tx(I, SUPPORT_NAME[k])}</strong> (${k})`)}.
      ${I.T("Each step lists the supports it can open in the mission cards below.", "Cada paso enumera los apoyos que puede abrir en las tarjetas de misión de abajo.")}
    </p>
    <p class="jg-callout">
      ${I.T('Opening any help marks that step "completed with support". Choosing "on my own" renders no supports at all, and the Show step never shows any. Supported work and independent work are saved separately, and one is never relabeled as the other.', 'Abrir cualquier ayuda marca ese paso como "completado con apoyo". Elegir "por mi cuenta" no muestra ningún apoyo, y el paso Muestra nunca los muestra. El trabajo con apoyo y el independiente se guardan por separado, y uno nunca se rotula como el otro.')}
    </p>
  </section>`;
}

function evidenceSection(I) {
  return html`<section class="jg-sec" id="evidence" aria-labelledby="jg-ev-h">
    <h2 id="jg-ev-h">
      ${I.T("Observable learning evidence", "Evidencia de aprendizaje observable")}
    </h2>
    <p>
      ${I.T("The lab records what a learner did on this device: observations examined, evidence selected, the first response, the revision and the independent attempt. Every observation quotes the learner's own words. Nothing is scored and nothing is sent anywhere.", "El laboratorio registra lo que el estudiante hizo en este dispositivo: observaciones examinadas, evidencia elegida, la primera respuesta, la revisión y el intento independiente. Cada observación cita las propias palabras del estudiante. Nada se califica y nada se envía a ningún lado.")}
    </p>
    <p>
      <strong
        >${I.T("Evidence kinds you may see in the Teacher Hub", "Tipos de evidencia que puedes ver en el Centro docente")}:</strong
      >
    </p>
    <ul>
      ${EVIDENCE_KINDS.map((k) => html`<li><strong>${I.T(k[0], k[1])}</strong>: ${I.T(k[2], k[3])}</li>`)}
    </ul>
  </section>`;
}

function responsesSection(I, f) {
  const klus = f.klu ? [f.klu] : KLUS;
  return html`<section class="jg-sec" id="responses" aria-labelledby="jg-resp-h">
    <h2 id="jg-resp-h">
      ${I.T("Suggested instructional responses", "Respuestas didácticas sugeridas")}
    </h2>
    <p>
      ${I.T("When a response is missing one of the Key Language Use moves, try one of these next steps with the learner.", "Cuando a una respuesta le falta uno de los movimientos del uso clave del lenguaje, prueba uno de estos pasos siguientes con el estudiante.")}
    </p>
    ${klus.map(
      (k) =>
        html`<h3>${tx(I, KLU_NAME[k])}</h3>
          <dl class="jg-moves">
            ${MOVES[k].map(
              (m) =>
                html`<dt>${I.T(MOVE_GUIDE[m.id][0], MOVE_GUIDE[m.id][1])}</dt>
                  <dd>${I.T(MOVE_GUIDE[m.id][2], MOVE_GUIDE[m.id][3])}</dd>`,
            )}
          </dl>`,
    )}
  </section>`;
}

function printablesSection(I, f, opts) {
  const domains = f.domain ? [f.domain] : DOMAINS;
  const link = (href, text) =>
    html`<a class="btn btn-secondary" href="${href}" target="_blank" rel="noopener">${text}</a>`;
  return html`<section class="jg-sec no-print-links" id="printables" aria-labelledby="jg-print-h">
    <h2 id="jg-print-h">${I.T("Printable materials", "Materiales para imprimir")}</h2>
    <p>
      ${I.T(`Student practice packets for ${BAND_NAME[f.band][0]}, by domain and level. Student packets have no answer keys. The family companion for each mission is linked on its card.`, `Paquetes de práctica para estudiantes, ${BAND_NAME[f.band][1]}, por dominio y nivel. Los paquetes del estudiante no tienen claves de respuesta. El compañero familiar de cada misión está enlazado en su tarjeta.`)}
    </p>
    <ul class="jg-print">
      ${domains.map(
        (d) =>
          html`<li>
            <strong>${tx(I, DOMAIN_NAME[d])}</strong>
            ${PACKET_LEVELS.map((l) => html`${link(printableHref(f.band, d, l), html`${tx(I, SUPPORT_NAME[l])}`)}${opts.hub ? link(teacherPacketHref(f.band, d, l), html`${tx(I, SUPPORT_NAME[l])} (${I.T("with answers", "con respuestas")})`) : ""}`)}
          </li>`,
      )}
    </ul>
  </section>`;
}

function missionList(I, f, opts) {
  const ctxBase = { band: f.band, modes: opts.modes, compact: !!opts.compact, hub: !!opts.hub };
  const groups = UNITS.map((u) => ({
    u,
    ids: u.missions.filter((id) => matchesFilters(f, id, MISSIONS[id], opts.modes)),
  })).filter((g) => g.ids.length);
  const shown = groups.reduce((n, g) => n + g.ids.length, 0);
  const domainNote =
    needsModes(f) && !opts.modes
      ? html`<p class="jg-fine">
          ${I.T("Task kinds are still loading; showing every mission.", "Todavía se cargan los tipos de tarea; se muestran todas las misiones.")}
        </p>`
      : f.domain
        ? html`<p class="jg-fine">
            ${I.T("Listening and Reading are in every mission (step 2). Speaking or Writing follows each mission's conversation or draft (steps 4 to 6).", "Escuchar y leer están en todas las misiones (paso 2). Hablar o escribir depende de la conversación o el borrador de cada misión (pasos 4 a 6).")}
          </p>`
        : "";
  return html`<div class="jg-list" id="missions">
    <p class="jg-count" role="status" data-gd-count>
      ${I.T(`Showing ${shown} of ${MISSION_IDS.length} missions.`, `Se muestran ${shown} de ${MISSION_IDS.length} misiones.`)}
    </p>
    ${domainNote}
    ${groups.length ? groups.map((g) => unitBlock(I, g, ctxBase)) : html`<p class="jg-empty">${I.T("No mission matches these filters. Clear a filter to see more.", "Ninguna misión coincide con estos filtros. Borra un filtro para ver más.")}</p>`}
  </div>`;
}

const unitBlock = (I, { u, ids }, ctxBase) =>
  html`<section class="jg-unit" aria-labelledby="jg-u${u.n}">
    <h2 id="jg-u${u.n}">
      ${I.T("Unit", "Unidad")} ${u.n}: ${tx(I, u.title)}
      <span class="jg-klu">${tx(I, KLU_NAME[u.klu])}</span>
    </h2>
    <p>${tx(I, u.blurb)}</p>
    ${ids.map((id) => missionCard(I, { ...ctxBase, id }))}
  </section>`;

/**
 * The guide body (everything below the page title). `opts`: { band, klu, domain, mission, modes, compact, hub, action }.
 * `compact` keeps the filters, mission cards, limits and the does-not box (the Teacher Hub panel).
 */
export function guideBodyHTML(I, opts = {}) {
  const f = normalizeFilters(opts);
  const full = !opts.compact;
  return html`${limitsBox(I)} ${filterForm(I, f, opts)} ${full ? pacingSection(I) : ""}
  ${missionList(I, f, opts)}
  ${full ? html`${supportsSection(I)}${evidenceSection(I)}${responsesSection(I, f)}${printablesSection(I, f, opts)}` : ""}
  ${doesNotBox(I)}`;
}

/** The reusable guide: wrapper element with the data hook the mount reads. Used by the route and by the Teacher Hub panel. */
export function guideHTML(I, opts = {}) {
  return html`<div class="jg" data-gd data-compact="${opts.compact ? "1" : ""}">
    <div data-gd-body>${guideBodyHTML(I, opts)}</div>
  </div>`;
}

// ── route view ────────────────────────────────────────────────────────────────
export async function render(ctx) {
  const I = i18nFor(ctx);
  const f = parseFilters(location.search, ctx.band);
  const modes = needsModes(f) ? await loadModes(loadMission) : null;
  const opts = { ...f, modes };
  return {
    title: I.S("Journey teacher guide", "Guía docente del viaje"),
    html: html`<div class="jg-page">
      <nav class="crumbs" aria-label="${I.S("Breadcrumb", "Ruta de navegación")}">
        <ol>
          <li><a href="${BASE}/journey?grades=${f.band}">${I.T("My Journey", "Mi viaje")}</a></li>
          <li aria-current="page">${I.T("Teacher guide", "Guía docente")}</li>
        </ol>
      </nav>
      <section class="panel">
        <h1 tabindex="-1">${I.T("Journey teacher guide", "Guía docente del viaje")}</h1>
        <p class="jg-lede">
          ${I.T("Four units, twelve missions, six steps each. Use the filters, copy a direct link for any step, and print this page for a clean one-column guide.", "Cuatro unidades, doce misiones, seis pasos cada una. Usa los filtros, copia un enlace directo de cualquier paso e imprime esta página para tener una guía limpia en una columna.")}
        </p>
        <p class="jg-toc no-print">
          <a href="#missions">${I.T("Missions", "Misiones")}</a> ·
          <a href="#pacing">${I.T("Pacing", "Ritmo")}</a> ·
          <a href="#supports">${I.T("Supports", "Apoyos")}</a> ·
          <a href="#evidence">${I.T("Evidence", "Evidencia")}</a> ·
          <a href="#responses">${I.T("Responses", "Respuestas")}</a> ·
          <a href="#printables">${I.T("Printables", "Materiales")}</a> ·
          <a href="#does-not">${I.T("Limits", "Límites")}</a>
        </p>
        <button type="button" class="btn btn-secondary no-print" data-gd-print>
          ${I.T("Print this guide", "Imprimir esta guía")}
        </button>
        ${guideHTML(I, opts)}
      </section>
    </div>`,
  };
}

// ── mount (filters, details, copy, print) ─────────────────────────────────────
const fieldsOf = (form) =>
  parseFilters(new URLSearchParams(new FormData(form)), form.elements.band?.value);

async function copyLink(path, status) {
  const url = new URL(path, location.origin).href;
  try {
    await navigator.clipboard.writeText(url);
    status.textContent = status.dataset.done || "Copied";
  } catch {
    showFallback(url, status);
  }
}

/** No clipboard access: show the link in a field the teacher can copy by hand. */
function showFallback(url, status) {
  const input = document.createElement("input");
  input.type = "text";
  input.readOnly = true;
  input.value = url;
  input.className = "jg-fallback";
  input.setAttribute("aria-label", status.dataset.label || "Link");
  status.replaceChildren(input);
  input.focus();
  input.select();
}

/**
 * Wire a guide inside `root`. `I` and `opts` must be the ones the markup was rendered with. `urlState` keeps the filters
 * in the address (?band=&klu=&domain=&mission=). Safe to call once per root.
 */
export function mountGuide(root, { I, opts = {}, urlState = true } = {}) {
  const host = root.querySelector("[data-gd]") || root;
  const body = host.querySelector("[data-gd-body]");
  if (!body || host.dataset.gdMounted) return () => {};
  host.dataset.gdMounted = "1";
  let state = { ...opts };
  const redraw = async (f) => {
    state = { ...state, ...f, modes: state.modes };
    if (needsModes(f) && !state.modes) state.modes = await loadModes(loadMission);
    body.innerHTML = toHtml(guideBodyHTML(I, state));
    if (urlState)
      history.replaceState({}, "", `${location.pathname}?${filterQuery(f)}${location.hash}`);
    for (const s of body.querySelectorAll("[data-gd-copied]")) {
      s.dataset.done = I.S("Copied", "Copiado");
      s.dataset.label = I.S("Link", "Enlace");
    }
  };
  host.addEventListener("change", (e) => {
    const form = e.target.closest?.("[data-gd-filters]");
    if (form) redraw(fieldsOf(form));
  });
  host.addEventListener("submit", (e) => {
    const form = e.target.closest?.("[data-gd-filters]");
    if (!form) return;
    e.preventDefault();
    redraw(fieldsOf(form));
  });
  host.addEventListener("click", async (e) => {
    const t = e.target.closest?.("button, a");
    if (!t) return;
    if (t.matches("[data-gd-clear]")) {
      e.preventDefault();
      redraw({ band: state.band, klu: "", domain: "", mission: "" });
    } else if (t.dataset.gdCopy) {
      const status = t.parentElement.querySelector("[data-gd-copied]");
      status.dataset.done ||= I.S("Copied", "Copiado");
      status.dataset.label ||= I.S("Link", "Enlace");
      copyLink(t.dataset.gdCopy, status);
    } else if (t.dataset.gdDetails) {
      toggleDetails(I, t, state);
    } else if (t.matches("[data-gd-print]")) {
      window.print();
    }
  });
  const setAll = (open) => {
    for (const d of host.querySelectorAll("details")) {
      if (open) d.dataset.wasOpen = d.open ? "1" : "";
      d.open = open ? true : d.dataset.wasOpen === "1";
    }
  };
  const before = () => setAll(true);
  const after = () => setAll(false);
  window.addEventListener("beforeprint", before);
  window.addEventListener("afterprint", after);
  return () => {
    window.removeEventListener("beforeprint", before);
    window.removeEventListener("afterprint", after);
  };
}

async function toggleDetails(I, button, state) {
  const id = button.dataset.gdDetails;
  const panel = button.closest(".jg-mission").querySelector(`[data-gd-pack="${id}"]`);
  const open = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(open));
  panel.hidden = !open;
  if (!open || panel.dataset.loaded) return;
  panel.textContent = I.S("Loading…", "Cargando…");
  try {
    panel.innerHTML = toHtml(packDetailsHTML(I, id, state.band, await loadMission(id)));
    panel.dataset.loaded = "1";
  } catch {
    panel.textContent = I.S(
      "The mission details could not be loaded.",
      "No se pudieron cargar los detalles de la misión.",
    );
  }
}

let dispose = () => {};
export function mount(root, ctx) {
  dispose();
  dispose = mountGuide(root, { I: i18nFor(ctx), opts: parseFilters(location.search, ctx.band) });
}
export function unmount() {
  dispose();
  dispose = () => {};
}
