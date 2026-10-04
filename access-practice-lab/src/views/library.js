// Search the lightweight index, then build a shareable practice playlist.
// Links contain content IDs only; answers and student names never leave the device.
import { bandSwitchHTML, crumbsHTML } from "../components.js";
import { bandRows } from "../content.js";
import { estimateMinutes } from "../learning.js";
import { activityStatus } from "../practice-plan.js";
import { loadRecord } from "../store.js";
import { BASE, CORE_DOMAINS, TIERS, announce, bandLabel, html, raw, toHtml } from "../util.js";
import { activityHref } from "./room.js";

const LIMIT = 12;
export const PAGE_SIZE = 24;
let page = 1;
const STATUS = { new: "Not started", draft: "In progress", retry: "Try again", done: "Completed" };
let rows = [];
let selected = [];
let band = "";
let filters = {};

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

function resultHTML() {
  const matches = filterActivities(rows, filters);
  const slice = pageActivities(matches, page);
  page = slice.page;
  return html`<h2 class="library-count" id="libraryResultTitle" tabindex="-1">Activities</h2><p role="status">${matches.length} ${matches.length === 1 ? "activity" : "activities"} found${matches.length ? ` · showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, matches.length)}` : ""}</p>
    ${
      matches.length
        ? html`<ul class="library-results">${slice.items.map(
            (r) => html`<li class="library-item">
      <div><p class="eyebrow">${r.domain} · ${TIERS[r.level]?.name || r.level}</p>
      <a class="library-title" href="${activityHref(r.domain, r.level, r.id)}?grades=${band}">${r.title}</a>
      <p class="fine">${r.skill || "Language practice"} · about ${estimateMinutes([r])} minutes · <strong>${STATUS[r.status]}</strong></p></div>
      <button type="button" class="btn library-add" data-pick="${r.id}" aria-pressed="${selected.includes(r.id)}" aria-label="${selected.includes(r.id) ? "Remove" : "Add"} ${r.title} ${selected.includes(r.id) ? "from" : "to"} practice set">${selected.includes(r.id) ? "✓ Added" : "+ Add"}</button>
    </li>`,
          )}</ul>`
        : html`<div class="panel"><h2>No matching activities</h2><p>Try a shorter search or choose a different skill, support, or progress filter.</p><button type="button" class="btn" data-clear-filters>Clear filters</button></div>`
    }
    ${slice.pages > 1 ? html`<nav class="library-pagination" aria-label="Activity result pages"><button type="button" class="btn" data-page="${page - 1}" ${page === 1 ? raw("disabled") : ""}>Previous</button><span>Page ${page} of ${slice.pages}</span><button type="button" class="btn" data-page="${page + 1}" ${page === slice.pages ? raw("disabled") : ""}>Next</button></nav>` : ""}`;
}

function setHTML() {
  const picked = selected.map((id) => rows.find((r) => r.id === id)).filter(Boolean);
  if (!picked.length) return html`<div class="library-set-empty"><h2 id="practiceSetTitle">Build a practice set</h2><p class="fine">Use “+ Add” below to combine up to ${LIMIT} activities into a shareable session.</p></div>`;
  return html`<h2 id="practiceSetTitle">Your practice set <span class="fine">${picked.length}/${LIMIT} · about ${estimateMinutes(picked)} minutes</span></h2>
    <p class="fine">Add activities in the order you want to practice. A shared link includes only the activities, not your answers or progress.</p>
    ${
      picked.length
        ? html`<ol class="library-picked">${picked.map((r) => html`<li><span>${r.title}</span><button type="button" class="ghost" data-remove-pick="${r.id}" aria-label="Remove ${r.title}">Remove</button></li>`)}</ol>
      <div class="row-actions"><a class="btn btn-primary" href="${playlistURL(selected, band)}">Start this set →</a><button type="button" class="btn" data-copy-set>Copy assignment link</button><button type="button" class="ghost" data-clear-set>Clear set</button></div>
      <label class="field"><span>Assignment link — copy or share</span><input id="assignmentLink" type="text" readonly value="${new URL(playlistURL(selected, band), location.origin).href}" data-nsr-ignore /></label>`
        : html`<p>Add an activity below to build a short session for yourself or your class.</p>`
    }`;
}

export async function render(ctx) {
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
    title: "Activity library",
    html: html`${crumbsHTML([
      ["Lab", `${BASE}/`],
      ["Activity library", null],
    ])}
    <header class="room-hero"><div><p class="eyebrow">Find a task · Build a practice set</p><h1 tabindex="-1">Activity library</h1><p class="lead">Search by topic or skill. Pick a task to open it, or combine up to 12 into one shareable session.</p>${bandSwitchHTML(band, ctx.bands)}</div></header>
    <section class="panel library-set" aria-labelledby="practiceSetTitle" id="practiceSet">${setHTML()}</section>
    <section aria-label="Find activities"><div class="library-filters">
      <label class="field library-search"><span>Search topics or skills</span><input type="search" id="librarySearch" maxlength="120" value="${filters.q}" placeholder="Try garden, evidence, compare…" aria-controls="libraryResults" data-nsr-ignore /></label>
      <label class="field"><span>Skill</span><select id="libraryDomain" data-library-filter="domain" data-nsr-ignore>${options([["", "All four skills"], ...CORE_DOMAINS.map((d) => [d, d])], filters.domain)}</select></label>
      <label class="field"><span>Support</span><select id="libraryLevel" data-library-filter="level" data-nsr-ignore>${options([["", "All support choices"], ...Object.entries(TIERS).map(([k, t]) => [k, t.name])], filters.level)}</select></label>
      <label class="field"><span>My progress</span><select id="libraryStatus" data-library-filter="status" data-nsr-ignore>${options([["", "Any progress"], ...Object.entries(STATUS)], filters.status)}</select></label>
    </div><p class="fine">${bandLabel(band)} · Progress is for this browser. Support changes tasks and scaffolds: Starting uses words and short sentences; Growing connects ideas; Expanding adds details and explanations. These are not WIDA scores.</p>
    <div class="library-quick" aria-label="Quick activity searches"><span>Start with:</span>${["garden", "evidence", "compare", "sequence"].map((topic) => html`<button type="button" class="btn" data-quick-topic="${topic}">${topic}</button>`)}</div>
    <div id="libraryResults">${resultHTML()}</div></section>`,
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
      announce(`A practice set holds up to ${LIMIT} activities. Remove one before adding another.`);
      return true;
    }
    document.getElementById("practiceSet").innerHTML = toHtml(setHTML());
    refreshResults();
    const selector = `[data-pick="${CSS.escape(id)}"]`;
    (document.querySelector(selector) || document.getElementById("librarySearch"))?.focus({
      preventScroll: true,
    });
    announce(`${selected.length} ${selected.length === 1 ? "activity" : "activities"} in your practice set.`);
    return true;
  }
  if (t.closest("[data-clear-set]")) {
    selected = [];
    document.getElementById("practiceSet").innerHTML = toHtml(setHTML());
    refreshResults();
    document.getElementById("librarySearch").focus();
    announce("Practice set cleared. Your saved progress is unchanged.");
    return true;
  }
  if (t.closest("[data-copy-set]")) {
    const field = document.getElementById("assignmentLink");
    navigator.clipboard?.writeText(field.value).then(
      () => announce("Assignment link copied."),
      () => {
        field.focus();
        field.select();
        announce("Select and copy the assignment link below.");
      },
    );
    if (!navigator.clipboard) {
      field.focus();
      field.select();
      announce("Select and copy the assignment link below.");
    }
    return true;
  }
}
