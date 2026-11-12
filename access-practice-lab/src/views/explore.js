// Explore: every destination on The Language Page in one place (/explore) and one hub per section
// (/explore/<practice|play|prep|progress|teach|family|help>). Filters (who, skill, kind, words) live in the URL
// (?for=teacher&skill=Reading&kind=game&q=…) so a teacher can share a filtered view. Everything it lists comes from
// src/sitemap.js, the same registry the navigation and the section bar read.
import { isEarlyBand } from "../bands.js";
import { crumbsHTML } from "../components.js";
import { EARLY_VIEWS } from "../early/gate.js";
import { i18nFor } from "../i18n.js";
import {
  AUDIENCES,
  DESTINATIONS,
  KINDS,
  SECTIONS,
  SECTION_BY_ID,
  SKILLS,
  inBand as inContentBand,
  matchesOf,
} from "../sitemap.js";
import { BASE, announce, html, icon, raw, toHtml } from "../util.js";

const state = { section: "", for: "", skill: "", kind: "", q: "" };
let I = null;
let band = "6-8";

// K–3 bands open only the picture-first views (src/early/gate.js), so their directory lists only those.
const inBand = (d, b) =>
  inContentBand(d, b) &&
  (!isEarlyBand(b) || d.href.startsWith("/") || matchesOf(d).some(([v]) => EARLY_VIEWS.has(v)));
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
const hrefOf = (d) =>
  d.href.startsWith("/")
    ? d.href
    : `${BASE}/${d.href}${d.href.includes("?") ? "&" : "?"}grades=${band}`;

function readQuery() {
  const q = new URLSearchParams(location.search);
  state.for = AUDIENCES.some((a) => a.id === q.get("for")) ? q.get("for") : "";
  state.skill = SKILLS.some((s) => s.id === q.get("skill")) ? q.get("skill") : "";
  state.kind = KINDS[q.get("kind")] ? q.get("kind") : "";
  state.q = q.get("q") || "";
}
function writeQuery() {
  const url = new URL(location.href);
  for (const k of ["for", "skill", "kind", "q"])
    state[k] ? url.searchParams.set(k, state[k]) : url.searchParams.delete(k);
  history.replaceState(history.state, "", url.pathname + url.search);
}

export function matches(d, f = state, b = band) {
  if (!inBand(d, b)) return false;
  if (f.section && d.section !== f.section) return false;
  if (f.for && !d.for.includes(f.for)) return false;
  if (f.skill && d.skill !== f.skill) return false;
  if (f.kind && d.kind !== f.kind) return false;
  if (f.q) {
    const hay = norm([...d.title, ...d.text, d.skill, ...(KINDS[d.kind] || [])].join(" "));
    if (
      !norm(f.q)
        .split(/\s+/)
        .filter(Boolean)
        .every((w) => hay.includes(w))
    )
      return false;
  }
  return true;
}

function cardHTML(d) {
  const tags = [I.S(...KINDS[d.kind])];
  if (d.skill !== "Mixed" && state.section !== "practice")
    tags.push(I.S(...SKILLS.find((s) => s.id === d.skill).title));
  if (d.for.length === 1 && d.for[0] !== "student")
    tags.push(I.S(...AUDIENCES.find((a) => a.id === d.for[0]).title));
  return html`<li class="xp-card" data-xp-id="${d.id}">
    <a class="xp-card-link" href="${hrefOf(d)}" ${d.external ? raw('rel="noopener"') : ""}>
      <span class="xp-card-ico" aria-hidden="true">${icon(d.icon)}</span>
      <span class="xp-card-body">
        <span class="xp-card-title"
          >${I.T(...d.title)}${d.external ? html` <span class="xp-ext">${I.T("(EduWonderLab)", "(EduWonderLab)")}</span>` : ""}</span
        >
        <span class="xp-card-text">${I.T(...d.text)}</span>
        <span class="xp-tags">${tags.map((t) => html`<span class="xp-tag">${t}</span>`)}</span>
      </span>
    </a>
  </li>`;
}

/** Results grouped by section (directory) or by skill (Practice hub). */
function resultsHTML() {
  const list = DESTINATIONS.filter((d) => matches(d));
  if (!list.length)
    return html`<div class="xp-empty" role="status">
      <p>${I.T("Nothing matches those filters.", "Nada coincide con esos filtros.")}</p>
      <button type="button" class="btn" data-xp-clear>
        ${I.T("Clear filters", "Quitar filtros")}
      </button>
    </div>`;
  const groups =
    state.section === "practice" || state.section === ""
      ? null
      : [{ id: state.section, title: null, items: list }];
  const bySection = SECTIONS.map((s) => ({
    id: s.id,
    title: s.title,
    items: list.filter((d) => d.section === s.id),
  })).filter((g) => g.items.length);
  const bySkill = SKILLS.map((s) => ({
    id: s.id,
    title: s.title,
    icon: s.icon,
    items: list.filter((d) => d.skill === s.id),
  })).filter((g) => g.items.length);
  const use = groups || (state.section === "practice" ? bySkill : bySection);
  return html`<p class="xp-count" role="status">
      ${I.T(`${list.length} places`, `${list.length} lugares`)}
    </p>
    ${use.map(
      (g) =>
        html`<section class="xp-group" aria-labelledby="xp-g-${g.id}">
          ${
            g.title
              ? html`<h2 id="xp-g-${g.id}" class="xp-group-title">
                  ${g.icon ? icon(g.icon) : ""}${I.T(...g.title)}
                  ${!state.section ? html`<a class="xp-group-all" href="${BASE}/explore/${g.id}?grades=${band}">${I.T("Open this section", "Abrir esta sección")}</a>` : ""}
                </h2>`
              : html`<h2 id="xp-g-${g.id}" class="visually-hidden">${I.T("Places", "Lugares")}</h2>`
          }
          <ul class="xp-grid" role="list">
            ${g.items.map(cardHTML)}
          </ul>
        </section>`,
    )}`;
}

function chips(name, items, current, all) {
  return html`<div class="xp-chips" role="group" aria-label="${all.label}">
    <button
      type="button"
      class="chip${current === "" ? " is-on" : ""}"
      data-xp-filter="${name}"
      data-xp-value=""
      aria-pressed="${current === ""}"
    >
      ${all.text}
    </button>
    ${items.map(
      (it) =>
        html`<button
          type="button"
          class="chip${current === it.id ? " is-on" : ""}"
          data-xp-filter="${name}"
          data-xp-value="${it.id}"
          aria-pressed="${current === it.id}"
        >
          ${it.icon ? icon(it.icon) : ""}${I.T(...it.title)}
        </button>`,
    )}
  </div>`;
}

function filtersHTML() {
  const pool = DESTINATIONS.filter(
    (d) => inBand(d, band) && (!state.section || d.section === state.section),
  );
  const skills = SKILLS.filter((s) => pool.some((d) => d.skill === s.id));
  const kinds = Object.keys(KINDS)
    .filter((k) => pool.some((d) => d.kind === k))
    .map((k) => ({ id: k, title: KINDS[k] }));
  const audiences = AUDIENCES.filter((a) => pool.some((d) => d.for.includes(a.id)));
  return html`<div class="xp-filters">
    <label class="xp-search">
      <span class="visually-hidden">${I.S("Find a place", "Buscar un lugar")}</span>
      ${icon("search")}
      <input
        type="search"
        data-xp-q
        value="${state.q}"
        placeholder="${I.S("Type a word: games, speaking, debate…", "Escribe una palabra: juegos, hablar, debate…")}"
        autocomplete="off"
      />
    </label>
    ${audiences.length > 1 ? chips("for", audiences, state.for, { label: I.S("Who it is for", "Para quién"), text: I.T("Everyone", "Todos") }) : ""}
    ${skills.length > 1 ? chips("skill", skills, state.skill, { label: I.S("Skill", "Destreza"), text: I.T("Every skill", "Toda destreza") }) : ""}
    ${kinds.length > 1 ? chips("kind", kinds, state.kind, { label: I.S("Kind of place", "Tipo de lugar"), text: I.T("Every kind", "Todo tipo") }) : ""}
  </div>`;
}

function sectionTabsHTML() {
  return html`<nav class="xp-sections" aria-label="${I.S("Sections", "Secciones")}">
    <a href="${BASE}/explore?grades=${band}" ${!state.section ? raw('aria-current="page"') : ""}
      >${icon("grid")}${I.T("Everything", "Todo")}</a
    >
    ${SECTIONS.map(
      (s) =>
        html`<a
          href="${BASE}/explore/${s.id}?grades=${band}"
          ${state.section === s.id ? raw('aria-current="page"') : ""}
          >${icon(s.icon)}${I.T(...s.title)}</a
        >`,
    )}
  </nav>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  band = ctx.band;
  state.section = SECTION_BY_ID[ctx.route.id] ? ctx.route.id : "";
  readQuery();
  const sec = SECTION_BY_ID[state.section];
  const title = sec
    ? I.S(...sec.title)
    : I.S("Everything on The Language Page", "Todo en The Language Page");
  const lead = sec
    ? sec.lead
    : [
        "Every studio, game, story world, test-prep tool and guide, in one place. Filter by who you are, a skill or the kind of place.",
        "Todos los estudios, juegos, mundos, herramientas de preparación y guías en un lugar. Filtra por quién eres, una destreza o el tipo de lugar.",
      ];
  const trail = [[I.S("Home", "Inicio"), `${BASE}/?grades=${band}`]];
  if (sec) trail.push([I.S("Explore", "Explorar"), `${BASE}/explore?grades=${band}`], [title]);
  else trail.push([I.S("Explore", "Explorar")]);
  return {
    title,
    html: html`${crumbsHTML(trail, { i18n: I })}
      <div class="xp">
        <header class="xp-head">
          <h1 tabindex="-1">
            ${sec ? I.T(...sec.title) : I.T("Everything on The Language Page", "Todo en The Language Page")}
          </h1>
          <p class="xp-lead">${I.T(...lead)}</p>
        </header>
        ${sectionTabsHTML()} ${filtersHTML()}
        <div class="xp-results" data-xp-results>${resultsHTML()}</div>
      </div>`,
  };
}

function refresh() {
  writeQuery();
  const box = document.querySelector("[data-xp-results]");
  if (box) box.innerHTML = toHtml(resultsHTML());
}

export function onInput(e) {
  if (!e.target.matches?.("[data-xp-q]")) return false;
  state.q = e.target.value.slice(0, 80);
  refresh();
  return true;
}

export function onClick(e) {
  const chip = e.target.closest("[data-xp-filter]");
  if (chip) {
    const name = chip.dataset.xpFilter;
    state[name] = chip.dataset.xpValue;
    chip.parentElement.querySelectorAll("[data-xp-filter]").forEach((b) => {
      const on = b === chip;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    refresh();
    const n = DESTINATIONS.filter((d) => matches(d)).length;
    announce(I.S(`${n} places`, `${n} lugares`));
    return true;
  }
  if (e.target.closest("[data-xp-clear]")) {
    Object.assign(state, { for: "", skill: "", kind: "", q: "" });
    document.querySelectorAll("[data-xp-filter]").forEach((b) => {
      const on = b.dataset.xpValue === "";
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
    const input = document.querySelector("[data-xp-q]");
    if (input) input.value = "";
    refresh();
    return true;
  }
  return false;
}
