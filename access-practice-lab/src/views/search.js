// Search the lab (/search?q=...&kind=...&all=1): ranked results over every page, activity, studio, mission and word,
// English or Spanish, limited to the learner's grade band unless "all grades" is on. The header palette (Ctrl/Cmd+K)
// uses the same engine (src/lang/site-search.js).
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import {
  KINDS,
  KIND_LABEL,
  highlight,
  hrefFor,
  queryWords,
  search,
  suggestions,
} from "../lang/site-search.js";
import { loadSearch } from "../search-data.js";
import { BASE, html, icon, raw, toHtml } from "../util.js";

const KIND_FILTERS = ["", "page", "practice", "studio", "word"];
let data = null;
const state = { q: "", kind: "", all: false };
let announceTimer = 0;

function card(I, r, band, qw) {
  const d = r.doc;
  const title = I.S(d.title, d.titleEs || d.title);
  const text = I.spanish && d.textEs ? d.textEs : d.text;
  const kind = KIND_LABEL[d.kind];
  const href = hrefFor(d, band);
  const lang = I.spanish && d.titleEs ? "es" : "en";
  const heading = href
    ? html`<a href="${href}" lang="${lang}">${raw(highlight(title, qw))}</a>`
    : html`<button type="button" class="linklike" data-sx-cmd="${d.cmd}" lang="${lang}">
        ${raw(highlight(title, qw))}
      </button>`;
  return html`<li class="sx-card d-${d.kind}">
    <span class="sx-card-ico" aria-hidden="true">${icon(d.icon || "search")}</span>
    <div class="sx-card-body">
      <h3>${heading} <span class="sx-r-kind">${I.S(kind.en, kind.es)}</span></h3>
      ${I.bilingual && d.titleEs && d.titleEs !== d.title ? html`<p class="sx-r-es" lang="es">${d.titleEs}</p>` : ""}
      ${text ? html`<p class="sx-r-text" lang="${I.spanish && d.textEs ? "es" : "en"}">${raw(highlight(text, qw))}</p>` : ""}
      ${d.word ? html`<p class="row-actions"><button type="button" class="btn small" data-say="${d.word.term}">${icon("volume")} ${I.T("Hear it", "Escucharla")}</button>${d.word.es ? html`<span lang="es"><strong>${d.word.es}</strong>${d.word.esDef ? html`: ${d.word.esDef}` : ""}</span>` : ""}</p>` : ""}
    </div>
  </li>`;
}

function resultsHTML(I, band) {
  const qw = queryWords(state.q);
  if (!qw.length) {
    const list = suggestions(data.docs, state.all ? "" : band);
    return html`<h2>${I.T("Good places to start", "Buenos lugares para empezar")}</h2>
      <ul class="sx-cards">
        ${list.map((r) => card(I, r, band, []))}
      </ul>`;
  }
  const items = search(data.docs, state.q, {
    band,
    all: state.all,
    kind: state.kind,
    bridge: data.bridge,
    limit: 40,
  });
  if (!items.length)
    return html`<section class="panel empty-state" role="status">
      <h2>
        ${I.T(`No results for "${state.q.trim()}"`, `No hay resultados para "${state.q.trim()}"`)}
      </h2>
      <p>
        ${I.T("Check the spelling, try a Spanish word or a shorter word, or search all grades.", "Revisa la ortografía, prueba una palabra en español o una más corta, o busca en todos los grados.")}
      </p>
      ${state.all ? "" : html`<button type="button" class="btn" data-sx-all-grades>${I.T("Search all grades", "Buscar en todos los grados")}</button>`}
    </section>`;
  return html`<ul class="sx-cards">
    ${items.map((r) => card(I, r, band, qw))}
  </ul>`;
}

const count = (I, band) => {
  const qw = queryWords(state.q);
  if (!qw.length) return I.S("Type to search.", "Escribe para buscar.");
  const n = search(data.docs, state.q, {
    band,
    all: state.all,
    kind: state.kind,
    bridge: data.bridge,
    limit: 40,
  }).length;
  return I.S(
    `${n} ${n === 1 ? "result" : "results"}${n === 40 ? " (showing the top 40)" : ""}`,
    `${n} ${n === 1 ? "resultado" : "resultados"}${n === 40 ? " (se muestran los 40 primeros)" : ""}`,
  );
};

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const title = I.S("Search the lab", "Buscar en el laboratorio");
  state.q = ctx.route.q || "";
  state.kind = KINDS.includes(ctx.route.kind) ? ctx.route.kind : "";
  state.all = ctx.route.all === "1";
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
  const chip = (k) => {
    const label = k ? KIND_LABEL[k] : { en: "All", es: "Todo" };
    return html`<button
      type="button"
      class="chip${state.kind === k ? " is-on" : ""}"
      data-sx-kind="${k}"
      aria-pressed="${state.kind === k}"
    >
      ${I.T(label.en, label.es)}
    </button>`;
  };
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [title, null],
      ])}
      <section class="sx-page" aria-labelledby="sxPageTitle">
        <h1 id="sxPageTitle" tabindex="-1">${I.T("Search the lab", "Buscar en el laboratorio")}</h1>
        <p class="lead">
          ${I.T("Find a word, an activity, a studio or a page. Type in English or Spanish.", "Encuentra una palabra, una actividad, un estudio o una página. Escribe en inglés o en español.")}
        </p>
        <form class="sx-form" role="search" data-sx-page-form>
          <label class="field" for="sxPageInput"
            ><span>${I.T("What are you looking for?", "¿Qué buscas?")}</span></label
          >
          <div class="sx-field">
            ${icon("search")}<input
              id="sxPageInput"
              class="sx-input"
              type="search"
              name="q"
              value="${state.q}"
              autocomplete="off"
              spellcheck="false"
              enterkeyhint="search"
              data-sx-input
            />
          </div>
        </form>
        <div
          class="sx-filters row-actions"
          role="group"
          aria-label="${I.S("Filter results", "Filtrar resultados")}"
        >
          ${KIND_FILTERS.map(chip)}
          <label class="sx-scope"
            ><input type="checkbox" data-sx-allbox ${state.all ? "checked" : ""} />
            <span>${I.T("All grades", "Todos los grados")}</span></label
          >
        </div>
        <p class="fine" id="sxCount" role="status" aria-live="polite">${count(I, band)}</p>
        <div id="sxResults">${resultsHTML(I, band)}</div>
      </section>`,
  };
}

function refresh(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const box = document.getElementById("sxResults");
  if (!box || !data) return;
  box.innerHTML = toHtml(resultsHTML(I, band));
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => {
    const c = document.getElementById("sxCount");
    if (c) c.textContent = count(I, band);
  }, 250);
  const url = new URL(location.href);
  for (const [k, v] of [
    ["q", state.q.trim()],
    ["kind", state.kind],
    ["all", state.all ? "1" : ""],
  ])
    v ? url.searchParams.set(k, v) : url.searchParams.delete(k);
  history.replaceState({}, "", url.pathname + url.search);
}

export function onInput(e, ctx) {
  if (!e.target.matches?.("[data-sx-input]")) return;
  state.q = e.target.value;
  refresh(ctx);
}

export function onChange(e, ctx) {
  if (!e.target.matches?.("[data-sx-allbox]")) return;
  state.all = e.target.checked;
  refresh(ctx);
}

export function onClick(e, ctx) {
  const kind = e.target.closest("[data-sx-kind]");
  if (kind) {
    state.kind = kind.dataset.sxKind;
    document.querySelectorAll("[data-sx-kind]").forEach((b) => {
      b.classList.toggle("is-on", b === kind);
      b.setAttribute("aria-pressed", String(b === kind));
    });
    refresh(ctx);
    return true;
  }
  if (e.target.closest("[data-sx-all-grades]")) {
    state.all = true;
    const box = document.querySelector("[data-sx-allbox]");
    if (box) box.checked = true;
    refresh(ctx);
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
  if (e.key === "Enter" && e.target.matches?.("[data-sx-input]")) e.preventDefault();
}
