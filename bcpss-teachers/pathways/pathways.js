// BCPSS Year Pathways: grade-level and content-level views of the K–8 curriculum-to-language hub.
// Nothing is preselected: a teacher chooses a grade (the atlas needs none).

import { keepView } from "../keep-view.js";
import { renderCoverage } from "./pathways-coverage.js";
import { renderPlay } from "./pathways-play.js";
import { $, announce, esc, store } from "./pathways-util.js";
import { renderAtlas, renderCoPlan, renderYearMap } from "./pathways-views.js";

const TABS = ["map", "coplan", "play", "atlas"];
const NEEDS_GRADE = new Set(["map", "coplan", "play"]);

const state = { grade: "", tab: "map", atlasView: "move", atlasPick: "", index: null, atlas: null, grades: new Map() };

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

function syncUrl() {
  const url = new URL(window.location.href);
  if (state.grade) url.searchParams.set("grade", state.grade);
  else url.searchParams.delete("grade");
  url.searchParams.set("tab", state.tab);
  history.replaceState(null, "", url.pathname + url.search);
}

function readUrl() {
  const q = new URLSearchParams(window.location.search);
  const grade = (q.get("grade") || "").toUpperCase();
  if (state.index.grades.some((g) => g.grade === grade)) state.grade = grade;
  if (TABS.includes(q.get("tab"))) state.tab = q.get("tab");
}

function renderGrades() {
  $("#pwGrades").innerHTML = state.index.grades
    .map(
      (g) =>
        `<button type="button" class="pw-pill" data-grade="${esc(g.grade)}" aria-pressed="${g.grade === state.grade}" aria-label="${esc(g.label)}">${esc(g.grade)}</button>`,
    )
    .join("");
}

function renderTabs() {
  for (const name of TABS) {
    const tab = $(`#tab-${name}`);
    const active = name === state.tab;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    $(`#panel-${name}`).hidden = !active;
  }
}

const prompt = (panel, text) => {
  panel.innerHTML = `<p class="pw-empty">${esc(text)}</p>`;
};

/** The coverage report, or null when it cannot be loaded (the section is then simply absent). */
async function coverageData() {
  state.coverage ||= fetchJson("/data/bcpss-standards-coverage.json").catch(() => null);
  return state.coverage;
}

async function gradeData() {
  if (!state.grades.has(state.grade)) {
    state.grades.set(state.grade, await fetchJson(`/api/bcpss/pathways?grade=${encodeURIComponent(state.grade)}`));
  }
  return state.grades.get(state.grade);
}

async function show() {
  renderTabs();
  syncUrl();
  const panel = $(`#panel-${state.tab}`);
  if (NEEDS_GRADE.has(state.tab) && !state.grade) return prompt(panel, "Choose a grade above to see its year.");
  panel.setAttribute("aria-busy", "true");
  try {
    if (state.tab === "atlas") {
      state.atlas ||= await fetchJson("/api/bcpss/pathways?view=atlas");
      panel.innerHTML = renderAtlas(state.atlas, state.atlasView, state.atlasPick);
    } else {
      const data = await gradeData();
      if (state.tab === "map")
        panel.innerHTML = renderYearMap(data, store.read().taught) + renderCoverage(await coverageData(), state.grade);
      else if (state.tab === "coplan") panel.innerHTML = renderCoPlan(data);
      else renderPlay(panel, data);
    }
  } catch (err) {
    panel.innerHTML = `<p class="pw-empty" role="alert">Could not load this view (${esc(err.message)}). <button type="button" class="pw-btn" data-retry>Try again</button></p>`;
  } finally {
    panel.removeAttribute("aria-busy");
  }
}

function selectGrade(grade) {
  if (!grade || grade === state.grade) return;
  state.grade = grade;
  keepView($("#pwGrades"), renderGrades);
  const label = state.index.grades.find((g) => g.grade === grade).label;
  announce(`Showing ${label}.`);
  show();
}

function selectTab(name, { focus = false } = {}) {
  if (!TABS.includes(name)) return;
  state.tab = name;
  if (focus) $(`#tab-${name}`).focus();
  show();
}

function updateProgress(panel) {
  const boxes = [...panel.querySelectorAll("[data-taught]")];
  const done = boxes.filter((b) => b.checked).length;
  const bar = $("#pwProgress", panel);
  if (bar) bar.value = done;
  const text = $("#pwProgressText", panel);
  if (text) text.textContent = `${done} of ${boxes.length} units marked taught on this device`;
}

function bindEvents() {
  $("#pwGrades").addEventListener("click", (e) => {
    const pill = e.target.closest("[data-grade]");
    if (pill) selectGrade(pill.dataset.grade);
  });
  const tabs = $("#pwTabs");
  tabs.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) selectTab(tab.dataset.tab);
  });
  tabs.addEventListener("keydown", (e) => {
    const i = TABS.indexOf(state.tab);
    const move = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (move === undefined) return;
    e.preventDefault();
    selectTab(TABS[(move + TABS.length) % TABS.length], { focus: true });
  });

  const main = $("#pwMain");
  main.addEventListener("click", (e) => {
    if (e.target.closest("[data-print]")) window.print();
    if (e.target.closest("[data-retry]")) show();
    const view = e.target.closest("[data-atlas-view]");
    if (view && view.dataset.atlasView !== state.atlasView) {
      state.atlasView = view.dataset.atlasView;
      state.atlasPick = "";
      keepView($("#panel-atlas"), () => {
        $("#panel-atlas").innerHTML = renderAtlas(state.atlas, state.atlasView, state.atlasPick);
      });
    }
  });
  main.addEventListener("change", (e) => {
    const box = e.target.closest("[data-taught]");
    if (box) {
      store.update((s) => {
        if (box.checked) s.taught[box.dataset.taught] = true;
        else delete s.taught[box.dataset.taught];
      });
      updateProgress($("#panel-map"));
      return;
    }
    if (e.target.matches("[data-atlas-pick]")) {
      state.atlasPick = e.target.value;
      keepView($("#panel-atlas"), () => {
        $("#panel-atlas").innerHTML = renderAtlas(state.atlas, state.atlasView, state.atlasPick);
      });
    }
  });
}

async function init() {
  try {
    state.index = await fetchJson("/api/bcpss/pathways");
  } catch (err) {
    $("#pwStatus").textContent = `Could not load pathways (${err.message}). Please refresh.`;
    return;
  }
  readUrl();
  renderGrades();
  bindEvents();
  show();
}

init();
