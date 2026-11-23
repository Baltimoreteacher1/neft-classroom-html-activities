// Explore: every destination on The Language Page in one place (/explore) and one hub per section
// (/explore/<practice|play|prep|progress|teach|family|help>). Filters (who, skill, kind, words) live in the URL
// (?for=teacher&skill=Reading&kind=game&q=…) so a teacher can share a filtered view. Everything it lists comes from
// src/sitemap.js, the same registry the navigation and the section bar read.
import { bandLabel, bandLabelEs, isEarlyBand } from "../bands.js";
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
  skillLead,
} from "../sitemap.js";
import { BASE, announce, html, icon, raw, safeJson, storage, toHtml } from "../util.js";
import { jumpInHTML } from "../quick-start.js";
import { loadLab } from "../lab/store.js";
import { readinessPanelHTML } from "../lab/progress-ui.js";
import { EDUCATIONAL_SYNONYMS } from "../resource-intelligence.js";
import { arcadeHTML } from "./play-arcade.js";

const state = { section: "", for: "", skill: "", kind: "", q: "" };
// Each group opens with six places; "Show all" expands that group. Any filter or search shows every match.
const PREVIEW = 6;
const expandedGroups = new Set();
const filtering = () => Boolean(state.q || state.for || state.skill || state.kind);
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
// The places a learner opened from Explore, newest first, so the hub can say "Opened" and offer "Pick up again".
// Only ids and times live here; nothing about the work itself.
const RECENT_KEY = "accessPracticeLab:v1:exploreRecent";
const RECENT_MAX = 12;
const readRecent = () => {
  const list = safeJson(storage.get(RECENT_KEY), []);
  return Array.isArray(list) ? list.filter((r) => r && typeof r.id === "string") : [];
};
function rememberOpened(id) {
  if (!DESTINATIONS.some((d) => d.id === id)) return;
  const list = [{ id, at: Date.now() }, ...readRecent().filter((r) => r.id !== id)].slice(0, RECENT_MAX);
  storage.set(RECENT_KEY, JSON.stringify(list));
}
// What the count calls the places in a section ("38 studios and practice sets").
const COUNT_NOUN = {
  practice: ["studios and practice sets", "estudios y prácticas"],
};
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
        .every((w) => {
          if (hay.includes(w)) return true;
          const anyLiteral = DESTINATIONS.some((dest) =>
            norm([...dest.title, ...dest.text, dest.skill, ...(KINDS[dest.kind] || [])].join(" ")).includes(w),
          );
          if (anyLiteral) return false;
          return (EDUCATIONAL_SYNONYMS[w] || []).some((syn) => hay.includes(syn));
        })
    )
      return false;
  }
  return true;
}

// The title is the card's one link (stretched over the whole card), so a screen reader hears a short link name and
// can move card to card by heading; the description and tags are read as the card's text.
function cardHTML(d, { start = false, opened = new Set() } = {}) {
  const tags = [I.S(...KINDS[d.kind])];
  if (d.skill !== "Mixed" && state.section !== "practice")
    tags.push(I.S(...SKILLS.find((s) => s.id === d.skill).title));
  if (d.for.length === 1 && d.for[0] !== "student")
    tags.push(I.S(...AUDIENCES.find((a) => a.id === d.for[0]).title));
  const seen = opened.has(d.id);
  return html`<li class="xp-card${start ? " is-start" : ""}" data-xp-id="${d.id}" data-kind="${d.kind}">
    ${start ? html`<span class="xp-flag">${icon("sparkle")}${I.T("Start here", "Empieza aquí")}</span>` : ""}
    <span class="xp-card-ico" aria-hidden="true">${icon(d.icon)}</span>
    <span class="xp-card-body">
      <h3 class="xp-card-title">
        <a class="xp-card-link" href="${hrefOf(d)}" data-xp-open="${d.id}" ${d.external ? raw('rel="noopener"') : ""}
          >${I.T(...d.title)}${d.external ? html` <span class="xp-ext">${I.T("(EduWonderLab)", "(EduWonderLab)")}</span>` : ""}</a
        >
      </h3>
      <span class="xp-card-text">${I.T(...d.text)}</span>
      <span class="xp-tags"
        >${tags.map((t, i) => html`<span class="xp-tag${i === 0 ? " xp-tag-kind" : ""}">${t}</span>`)}${
          seen ? html`<span class="xp-tag xp-tag-seen">${icon("check")}${I.T("Opened", "Abierto")}</span>` : ""
        }</span
      >
    </span>
  </li>`;
}

/** "Pick up again": the last three places opened from Explore that this view lists. */
function recentHTML(list) {
  if (filtering()) return "";
  const byId = new Map(list.map((d) => [d.id, d]));
  const recent = readRecent()
    .map((r) => byId.get(r.id))
    .filter(Boolean)
    .slice(0, 3);
  if (!recent.length) return "";
  return html`<section class="xp-recent" aria-labelledby="xp-recent-h">
    <h2 id="xp-recent-h" class="xp-recent-title">${icon("replay")}${I.T("Pick up again", "Retoma donde ibas")}</h2>
    <ul class="xp-recent-list" role="list">
      ${recent.map(
        (d) => html`<li>
          <a href="${hrefOf(d)}" data-xp-open="${d.id}"
            ><span class="xp-card-ico" aria-hidden="true">${icon(d.icon)}</span><span>${I.T(...d.title)}</span>${icon("arrow-right")}</a
          >
        </li>`,
      )}
    </ul>
  </section>`;
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
    lead: skillLead(s, band),
    items: list.filter((d) => d.skill === s.id),
  }))
    .filter((g) => g.items.length)
    // The first practice set in a skill is the guided way in, so it carries "Start here".
    .map((g) => ({ ...g, startId: g.id !== "Mixed" ? g.items.find((d) => d.kind === "practice")?.id : undefined }));
  const use = groups || (state.section === "practice" ? bySkill : bySection);
  const opened = new Set(readRecent().map((r) => r.id));
  const noun = COUNT_NOUN[state.section] || ["places", "lugares"];
  return html`${recentHTML(list)}
    <p class="xp-count" role="status">
      ${I.T(`${list.length} ${noun[0]} for ${bandLabel(band)}`, `${list.length} ${noun[1]} para ${bandLabelEs(band)}`)}
    </p>
    ${use.map(
      (g) =>
        html`<section class="xp-group" aria-labelledby="xp-g-${g.id}">
          ${
            g.title
              ? html`<div class="xp-group-head">
                  <h2 id="xp-g-${g.id}" class="xp-group-title">
                    ${g.icon ? html`<span class="xp-group-ico" aria-hidden="true">${icon(g.icon)}</span>` : ""}${I.T(...g.title)}
                    <span class="xp-group-n">${g.items.length}</span>
                  </h2>
                  ${g.lead ? html`<p class="xp-group-lead">${I.T(...g.lead)}</p>` : ""}
                  ${!state.section ? html`<a class="xp-group-all" href="${BASE}/explore/${g.id}?grades=${band}">${I.T("Open this section", "Abrir esta sección")}</a>` : ""}
                </div>`
              : html`<h2 id="xp-g-${g.id}" class="visually-hidden">${I.T("Places", "Lugares")}</h2>`
          }
          <ul class="xp-grid" role="list">
            ${(filtering() || expandedGroups.has(g.id) ? g.items : g.items.slice(0, PREVIEW)).map((d) =>
              cardHTML(d, { opened, start: g.startId === d.id }),
            )}
          </ul>
          ${!filtering() && !expandedGroups.has(g.id) && g.items.length > PREVIEW ? html`<p class="xp-more"><button type="button" class="btn small" data-xp-more="${g.id}">${I.T(`Show all ${g.items.length}`, `Mostrar los ${g.items.length}`)} ${icon("chevron-down")}</button></p>` : ""}
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
    ${skills.length > 1 ? chips("skill", skills, state.skill, { label: I.S("Skill", "Destreza"), text: I.T("Every skill", "Toda destreza") }) : ""}
    ${
      audiences.length > 1 || kinds.length > 1
        ? html`<details class="xp-more-filters" ${state.for || state.kind ? raw("open") : ""}>
            <summary>${icon("settings")}${I.T("More filters", "Más filtros")}</summary>
            <div class="xp-more-body">
              ${audiences.length > 1 ? chips("for", audiences, state.for, { label: I.S("Who it is for", "Para quién"), text: I.T("Everyone", "Todos") }) : ""}
              ${kinds.length > 1 ? chips("kind", kinds, state.kind, { label: I.S("Kind of place", "Tipo de lugar"), text: I.T("Every kind", "Todo tipo") }) : ""}
            </div>
          </details>`
        : ""
    }
  </div>`;
}

function sectionTabsHTML() {
  return html`<nav class="xp-sections" aria-label="${I.S("Explore sections", "Secciones para explorar")}">
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
    ? sec.bandLead?.[band] || sec.lead
    : [
        "Every studio, game, story world, test-prep tool and guide, in one place. Filter by who you are, a skill or the kind of place.",
        "Todos los estudios, juegos, mundos, herramientas de preparación y guías en un lugar. Filtra por quién eres, una destreza o el tipo de lugar.",
      ];
  const trail = [[I.S("Home", "Inicio"), `${BASE}/?grades=${band}`]];
  if (sec) trail.push([I.S("Explore", "Explorar"), `${BASE}/explore?grades=${band}`], [title]);
  else trail.push([I.S("Explore", "Explorar")]);
  // Practice and the all-places directory open with one-tap practice sets, so practice is never behind the filters.
  const jumpIn = !state.section || state.section === "practice" ? await jumpInHTML(ctx, I) : "";
  return {
    title,
    html: html`${crumbsHTML(trail, { i18n: I })}
      <div class="xp">
        <header class="xp-head">
          ${sec ? html`<p class="xp-band">${icon("classroom")}${I.T(bandLabel(band), bandLabelEs(band))}</p>` : ""}
          <h1 tabindex="-1">
            ${sec ? I.T(...sec.title) : I.T("Everything on The Language Page", "Todo en The Language Page")}
          </h1>
          <p class="xp-lead">${I.T(...lead)}</p>
        </header>
        ${jumpIn}
        ${state.section === "progress" ? readinessPanelHTML(I, loadLab(), { band, idp: "xpLab" }) : ""}
        ${
          state.section === "play" && !filtering()
            ? html`${arcadeHTML(I, band, (d) => inBand(d, band))}
                <section class="xp-directory" id="xp-directory" data-fold>
                  <h2>${I.T("Search every game and world", "Busca en todos los juegos y mundos")}</h2>
                  ${sectionTabsHTML()} ${filtersHTML()}
                  <div class="xp-results" data-xp-results>${resultsHTML()}</div>
                </section>`
            : html`${sectionTabsHTML()} ${filtersHTML()}
                <div class="xp-results" data-xp-results>${resultsHTML()}</div>`
        }
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
  const open = e.target.closest("[data-xp-open]");
  if (open) {
    rememberOpened(open.dataset.xpOpen);
    return false; // the link still navigates
  }
  const more = e.target.closest("[data-xp-more]");
  if (more) {
    expandedGroups.add(more.dataset.xpMore);
    refresh();
    return true;
  }
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
