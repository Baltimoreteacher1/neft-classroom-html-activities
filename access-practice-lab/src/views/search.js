// Find Resources (/search): the Unified Resource Finder. One index (src/lang/site-search.js, fed by
// src/search-data.js) over every page, activity, studio, game, world, printable packet, handout, hub section and word,
// English or Spanish, with plain-language queries ("third grade listening", "printable worksheets"), filters with
// counts and URL state (src/finder/facets.js), and result cards with Open, Preview, Copy link and Save
// (src/finder/card.js, src/finder/saved.js). The header palette (Ctrl/Cmd+K) uses the same engine and hands
// "See all results" to this page with ?q=.
//
//   /access-practice-lab/search?q=&for=teacher|student|family&grades=&all=1&skill=&kind=&format=&time=
import { crumbsHTML } from "../components.js";
import { resultCard } from "../finder/card.js";
import {
  AUDIENCE_VALUES,
  BAND_VALUES,
  FORMAT_VALUES,
  KIND_VALUES,
  MAIN_KINDS,
  SKILL_VALUES,
  TIME_VALUES,
  activeCount,
  applyFilters,
  browse,
  facetCounts,
  readState,
  writeState,
} from "../finder/facets.js";
import { parseGrades } from "../finder/intent.js";
import { readSaved, toggleSaved } from "../finder/saved.js";
import { i18nFor } from "../i18n.js";
import { norm, queryWords, search } from "../lang/site-search.js";
import { loadSearch } from "../search-data.js";
import { BASE, announce, bandLabel, html, icon, toHtml } from "../util.js";
import { bandLabelEs } from "../bands.js";

const PAGE = 20;
let data = null;
let state = null;
let shown = PAGE;
let announceTimer = 0;
let byId = new Map();

// Curated starting points, each a finder search a person can see and change. Labelled as what they are, not as
// "popular": nothing here counts what other people open.
const TASKS = [
  ["speaking", "Speaking games", "Juegos para hablar", "q=speaking+games"],
  ["print", "Printable worksheets", "Hojas para imprimir", "format=printable"],
  ["tests", "ACCESS practice", "Práctica para ACCESS", "kind=test"],
  ["writing", "Create a book", "Crear un libro", "q=create+a+book"],
  ["clock", "5-minute practice", "Práctica de 5 minutos", "kind=practice&time=5"],
  ["families", "Family practice", "Práctica en familia", "for=family"],
  [
    "teacher",
    "Teacher guides and handouts",
    "Guías y hojas para docentes",
    "for=teacher&kind=guide",
  ],
  ["words", "Vocabulary", "Vocabulario", "skill=Words"],
];
// When nothing matches: other words to try, each a real search.
const TRY = [
  ["games", "juegos"],
  ["speaking", "hablar"],
  ["printable", "imprimir"],
  ["vocabulary", "vocabulario"],
  ["family", "familia"],
  ["practice test", "prueba de práctica"],
];

const finderHref = (qs, band) => `${BASE}/search?${qs}${qs ? "&" : ""}grades=${band}`;

/** Results, facet counts and the grade a query names, for the current state. */
function compute() {
  const intent = parseGrades(norm(state.q));
  const words = queryWords(intent.rest);
  const filtering = activeCount(state) > 0 || !!intent.bands;
  const mode = words.length ? "query" : filtering ? "browse" : "home";
  const pool =
    mode === "query"
      ? search(data.docs, state.q, {
          all: true,
          bridge: data.bridge,
          limit: Number.POSITIVE_INFINITY,
        })
      : browse(data.docs, state);
  const poolDocs = pool.map((r) => r.doc);
  const keep = new Set(applyFilters(poolDocs, state, intent.bands));
  return {
    mode,
    intent,
    words,
    results: mode === "home" ? [] : pool.filter((r) => keep.has(r.doc)),
    counts: facetCounts(poolDocs, state, intent.bands),
  };
}

const chip = (I, facet, value, lbl, n, on) =>
  html`<button
    type="button"
    class="chip fx-chip${on ? " is-on" : ""}"
    data-fx-f="${facet}"
    data-fx-v="${value}"
    aria-pressed="${on}"
  >
    ${I.T(lbl.en, lbl.es)}<span class="fx-n"
      >${n}<span class="visually-hidden"> ${I.S("results", "resultados")}</span></span
    >
  </button>`;

function group(I, facet, legend, list, counts) {
  const items = list.filter(([v]) => counts[v] > 0 || state[facet] === v);
  if (!items.length) return "";
  return html`<fieldset class="fx-group">
    <legend>${legend}</legend>
    <div class="fx-chips">
      ${items.map(([v, lbl]) => chip(I, facet, v, lbl, counts[v] || 0, state[facet] === v))}
    </div>
  </fieldset>`;
}

function bandGroup(I, r) {
  const names = (bands) =>
    bands.map((b) => I.S(bandLabel(b), bandLabelEs(b))).join(I.S(" and ", " y "));
  if (r.intent.bands)
    return html`<p class="fx-note" role="note">
      ${icon("info")}${I.T(`Your search names a grade, so results are for ${names(r.intent.bands)}.`, `Tu búsqueda nombra un grado: los resultados son para ${names(r.intent.bands)}.`)}
    </p>`;
  const c = r.counts.band;
  const items = BAND_VALUES.filter(([v]) => c[v] > 0 || (!state.all && state.band === v));
  return html`<fieldset class="fx-group">
    <legend>${I.T("Grade band", "Grados")}</legend>
    <div class="fx-chips">
      ${chip(I, "band", "all", { en: "All grades", es: "Todos los grados" }, c.all, state.all)}
      ${items.map(([v, lbl]) => chip(I, "band", v, lbl, c[v] || 0, !state.all && state.band === v))}
    </div>
  </fieldset>`;
}

function filtersHTML(I, r) {
  const c = r.counts;
  const more = KIND_VALUES.filter(([v]) => !MAIN_KINDS.includes(v));
  const moreOn = !!(state.format || state.time || more.some(([v]) => v === state.kind));
  return html`${group(I, "for", I.T("Who it is for", "Para quién"), AUDIENCE_VALUES, c.for)}
    ${bandGroup(I, r)} ${group(I, "skill", I.T("Skill", "Destreza"), SKILL_VALUES, c.skill)}
    ${group(
      I,
      "kind",
      I.T("Kind", "Tipo"),
      KIND_VALUES.filter(([v]) => MAIN_KINDS.includes(v)),
      c.kind,
    )}
    <details class="fx-more" ${moreOn ? "open" : ""}>
      <summary>${I.T("More filters", "Más filtros")}</summary>
      ${group(I, "format", I.T("Format", "Formato"), FORMAT_VALUES, c.format)}
      ${group(I, "time", I.T("Time", "Tiempo"), TIME_VALUES, c.time)}
      ${group(I, "kind", I.T("More kinds", "Más tipos"), more, c.kind)}
    </details>`;
}

/** Pills for the filters that are on, each one removable, plus "Clear all". */
function activeHTML(I) {
  const lists = {
    for: AUDIENCE_VALUES,
    skill: SKILL_VALUES,
    kind: KIND_VALUES,
    format: FORMAT_VALUES,
    time: TIME_VALUES,
  };
  const on = Object.entries(lists).filter(([k]) => state[k]);
  if (!on.length) return "";
  return html`<div
    class="fx-active"
    role="group"
    aria-label="${I.S("Filters on", "Filtros activos")}"
  >
    ${on.map(([k, list]) => {
      const lbl = list.find(([v]) => v === state[k])[1];
      return html`<button
        type="button"
        class="chip is-on"
        data-fx-f="${k}"
        data-fx-v="${state[k]}"
        aria-pressed="true"
      >
        ${I.T(lbl.en, lbl.es)} ${icon("close")}<span class="visually-hidden"
          >${I.S("Remove this filter", "Quitar este filtro")}</span
        >
      </button>`;
    })}
    <button type="button" class="btn small ghost" data-fx-clear>
      ${I.T("Clear all", "Quitar todos")}
    </button>
  </div>`;
}

function savedHTML(I) {
  const list = readSaved();
  if (!list.length) return "";
  return html`<section class="fx-saved" aria-labelledby="fxSavedTitle">
    <h2 id="fxSavedTitle">
      ${icon("bookmark")}${I.T("My saved resources", "Mis recursos guardados")}
    </h2>
    <p class="fine">${I.T("Saved on this device only.", "Guardados solo en este dispositivo.")}</p>
    <ul class="fx-saved-list">
      ${list.map(
        (s) =>
          html`<li>
            <a href="${s.href}">${I.S(s.title, s.titleEs || s.title)}</a>
            <button type="button" class="btn small ghost" data-fx-unsave="${s.id}">
              ${I.T("Remove", "Quitar")}<span class="visually-hidden">: ${s.title}</span>
            </button>
          </li>`,
      )}
    </ul>
  </section>`;
}

/** Outside the "no query" screen the saved list stays one tap away, folded, above the results. */
function savedMiniHTML(I) {
  const n = readSaved().length;
  if (!n) return "";
  return html`<details class="fx-saved-mini">
    <summary>${icon("bookmark")}${I.T(`My saved resources (${n})`, `Mis recursos guardados (${n})`)}</summary>
    ${savedHTML(I)}
  </details>`;
}

function homeHTML(I, band) {
  return html`${savedHTML(I)}
    <section class="fx-tasks" aria-labelledby="fxTasksTitle">
      <h2 id="fxTasksTitle">${I.T("Common tasks", "Tareas comunes")}</h2>
      <ul class="fx-task-list">
        ${TASKS.map(
          ([ic, en, es, qs]) =>
            html`<li>
              <a class="fx-task" href="${finderHref(qs, band)}"
                >${icon(ic)}<span>${I.T(en, es)}</span>${icon("arrow-right")}</a
              >
            </li>`,
        )}
      </ul>
    </section>`;
}

function emptyHTML(I, band) {
  const q = state.q.trim();
  return html`<section class="panel empty-state" role="status">
    <h2>
      ${q ? I.T(`No results for "${q}"`, `No hay resultados para "${q}"`) : I.T("Nothing matches these filters", "Nada coincide con estos filtros")}
    </h2>
    <p>
      ${I.T("Check the spelling, use fewer words, remove a filter or try one of these:", "Revisa la ortografía, usa menos palabras, quita un filtro o prueba una de estas:")}
    </p>
    <p class="row-actions">
      ${TRY.map(([en, es]) => html`<a class="chip" href="${finderHref(`q=${encodeURIComponent(I.spanish ? es : en)}`, band)}">${I.spanish ? es : en}</a>`)}
    </p>
    <p class="row-actions">
      ${activeCount(state) ? html`<button type="button" class="btn" data-fx-clear>${I.T("Clear all filters", "Quitar todos los filtros")}</button>` : ""}
      ${state.all ? "" : html`<button type="button" class="btn" data-fx-f="band" data-fx-v="all" aria-pressed="false">${I.T("Search all grades", "Buscar en todos los grados")}</button>`}
      <a class="btn ghost" href="${BASE}/explore?grades=${band}"
        >${I.T("Browse everything on the site", "Ver todo el sitio")}</a
      >
    </p>
  </section>`;
}

function resultsHTML(I, r, band) {
  if (r.mode === "home") return homeHTML(I, band);
  if (!r.results.length) return html`${savedMiniHTML(I)}${activeHTML(I)}${emptyHTML(I, band)}`;
  const qw = r.words;
  const list = r.results.slice(0, shown);
  byId = new Map(list.map((x) => [x.doc.id, x.doc]));
  const saved = new Set(readSaved().map((s) => s.id));
  return html`${savedMiniHTML(I)}${activeHTML(I)}
    <ul class="fx-cards">
      ${list.map((x, n) => resultCard(I, x, n, band, qw, saved))}
    </ul>
    ${
      r.results.length > shown
        ? html`<p class="fx-more-results">
            <button type="button" class="btn" data-fx-more>
              ${I.T(`Show more (${r.results.length - shown} more)`, `Ver más (${r.results.length - shown} más)`)}
            </button>
          </p>`
        : ""
    }`;
}

const countText = (I, r) => {
  if (r.mode === "home")
    return I.S(
      "Type what you need, or pick a filter or a common task.",
      "Escribe lo que necesitas o elige un filtro o una tarea común.",
    );
  const n = r.results.length;
  return I.S(
    `${n} ${n === 1 ? "result" : "results"}`,
    `${n} ${n === 1 ? "resultado" : "resultados"}`,
  );
};

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const title = I.S("Find resources", "Buscar recursos");
  const prevQ = state?.q;
  state = readState(new URLSearchParams(location.search), band);
  if (ctx.route.q && !state.q) state.q = ctx.route.q;
  if (state.q !== prevQ) shown = PAGE;
  try {
    data = await loadSearch();
  } catch {
    return {
      title,
      html: html`<section class="panel empty-state" role="alert">
        <h1 tabindex="-1">${I.T("Search could not load.", "La búsqueda no se pudo cargar.")}</h1>
        <p>
          ${I.T("Check your internet connection, then try again.", "Revisa tu conexión a internet y vuelve a intentarlo.")}
        </p>
        <a class="btn btn-primary" href="${BASE}/search?grades=${band}"
          >${I.T("Try again", "Intentar de nuevo")}</a
        >
      </section>`,
    };
  }
  const r = compute();
  const n = activeCount(state);
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [title, null],
      ])}
      <section class="fx-page" aria-labelledby="sxPageTitle">
        <header class="fx-head">
          <h1 id="sxPageTitle" tabindex="-1">
            ${I.T("What are you looking for?", "¿Qué buscas?")}
          </h1>
          <p class="lead">
            ${I.T("Activities, games, printables, guides and words for every grade. Type in English or Spanish.", "Actividades, juegos, hojas para imprimir, guías y palabras para todos los grados. Escribe en inglés o en español.")}
          </p>
          <form class="sx-form" role="search" data-sx-page-form>
            <label class="visually-hidden" for="sxPageInput"
              >${I.T("What are you looking for?", "¿Qué buscas?")}</label
            >
            <div class="sx-field fx-field">
              ${icon("search")}<input
                id="sxPageInput"
                class="sx-input"
                type="search"
                name="q"
                value="${state.q}"
                autocomplete="off"
                spellcheck="false"
                enterkeyhint="search"
                placeholder="${I.S("Try: speaking games, third grade listening, printable worksheets", "Prueba: juegos para hablar, escuchar tercer grado, hojas para imprimir")}"
                data-sx-input
              />
            </div>
          </form>
        </header>
        <div class="fx-layout">
          <details class="fx-panel" data-fx-panel>
            <summary>
              ${I.T("Filters", "Filtros")}<span class="fx-on" id="fxOnCount"
                >${n ? ` (${n})` : ""}</span
              >
            </summary>
            <div
              id="fxFilters"
              class="fx-filters"
              role="group"
              aria-label="${I.S("Filter results", "Filtrar resultados")}"
            >
              ${filtersHTML(I, r)}
            </div>
          </details>
          <div class="fx-main">
            <p class="fine fx-count" id="sxCount" role="status" aria-live="polite">
              ${countText(I, r)}
            </p>
            <div id="sxResults">${resultsHTML(I, r, band)}</div>
          </div>
        </div>
      </section>`,
  };
}

/** Open the filter panel by default where there is room for it beside the results. */
export function mount(root) {
  const panel = root.querySelector("[data-fx-panel]");
  if (panel && window.matchMedia?.("(min-width: 60rem)").matches) panel.open = true;
}

function refresh(ctx, { focusFilter = null } = {}) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  if (!data || !document.getElementById("sxResults")) return;
  const r = compute();
  document.getElementById("sxResults").innerHTML = toHtml(resultsHTML(I, r, band));
  const filters = document.getElementById("fxFilters");
  const moreOpen = filters.querySelector(".fx-more")?.open;
  filters.innerHTML = toHtml(filtersHTML(I, r));
  if (moreOpen) filters.querySelector(".fx-more")?.setAttribute("open", "");
  const n = activeCount(state);
  document.getElementById("fxOnCount").textContent = n ? ` (${n})` : "";
  if (focusFilter) {
    const sel = `[data-fx-f="${focusFilter[0]}"][data-fx-v="${CSS.escape(focusFilter[1])}"]`;
    (
      filters.querySelector(sel) ||
      document.querySelector(sel) ||
      document.getElementById("sxPageInput")
    )?.focus({ preventScroll: true });
  }
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    const c = document.getElementById("sxCount");
    if (c) c.textContent = countText(I, r);
  }, 300);
  const url = new URL(location.href);
  url.search = writeState(state, url.searchParams).toString();
  history.replaceState(history.state, "", url.pathname + url.search);
}

export function onInput(e, ctx) {
  if (!e.target.matches?.("[data-sx-input]")) return;
  state.q = e.target.value;
  shown = PAGE;
  refresh(ctx);
}

function setFilter(ctx, facet, value) {
  shown = PAGE;
  if (facet === "band") {
    if (value === "all") state.all = !state.all;
    else {
      state.all = false;
      if (value !== state.band) {
        // A grade band is the lab's band: switching it goes through the router so the whole lab follows.
        state.band = value;
        const url = new URL(location.href);
        url.search = writeState(state, url.searchParams).toString();
        ctx.navigate(url.pathname + url.search, { replace: true });
        return;
      }
    }
  } else state[facet] = state[facet] === value ? "" : value;
  refresh(ctx, { focusFilter: [facet, value] });
}

async function copyLink(I, href) {
  const url = new URL(href, location.origin).href;
  try {
    await navigator.clipboard.writeText(url);
    announce(I.S("Link copied.", "Enlace copiado."), { tone: "success" });
  } catch {
    announce(I.S(`Copy this link: ${url}`, `Copia este enlace: ${url}`));
  }
}

export function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const f = e.target.closest("[data-fx-f]");
  if (f) {
    setFilter(ctx, f.dataset.fxF, f.dataset.fxV);
    return true;
  }
  if (e.target.closest("[data-fx-clear]")) {
    Object.assign(state, { for: "", skill: "", kind: "", format: "", time: "" });
    shown = PAGE;
    refresh(ctx, { focusFilter: ["", ""] });
    return true;
  }
  if (e.target.closest("[data-fx-more]")) {
    const first = shown;
    shown += PAGE;
    refresh(ctx);
    document.querySelectorAll(".fx-card h3 a, .fx-card h3 button")[first]?.focus();
    return true;
  }
  const prev = e.target.closest("[data-fx-preview]");
  if (prev) {
    const box = document.getElementById(prev.getAttribute("aria-controls"));
    const open = prev.getAttribute("aria-expanded") !== "true";
    prev.setAttribute("aria-expanded", String(open));
    if (box) box.hidden = !open;
    return true;
  }
  const copy = e.target.closest("[data-fx-copy]");
  if (copy) {
    copyLink(I, copy.dataset.fxCopy);
    return true;
  }
  const save = e.target.closest("[data-fx-save]");
  if (save) {
    const d = byId.get(save.dataset.fxSave);
    if (!d) return true;
    const href = save.closest(".fx-card")?.querySelector("h3 a")?.getAttribute("href") || "";
    const on = toggleSaved({ id: d.id, title: d.title, titleEs: d.titleEs || "", href });
    save.setAttribute("aria-pressed", String(on));
    save.querySelector(".fx-save-label").textContent = on
      ? I.S("Saved", "Guardado")
      : I.S("Save", "Guardar");
    announce(
      on
        ? I.S("Saved to My saved resources.", "Guardado en Mis recursos guardados.")
        : I.S("Removed from My saved resources.", "Quitado de Mis recursos guardados."),
    );
    return true;
  }
  const unsave = e.target.closest("[data-fx-unsave]");
  if (unsave) {
    const s = readSaved().find((x) => x.id === unsave.dataset.fxUnsave);
    if (s) toggleSaved(s);
    refresh(ctx, { focusFilter: ["", ""] });
    announce(I.S("Removed from My saved resources.", "Quitado de Mis recursos guardados."));
    return true;
  }
  const cmd = e.target.closest("[data-sx-cmd]");
  if (cmd) {
    import("../search-palette.js").then((m) => m.runCommand(cmd.dataset.sxCmd));
    return true;
  }
  return false;
}

export function onKey(e) {
  // Results update while typing; Enter must not submit the form and reload the page.
  if (e.key === "Enter" && e.target.matches?.("[data-sx-input]")) e.preventDefault();
}
