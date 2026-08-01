/* =============================================================================
 * map.js — The Living Curriculum Map.
 * -----------------------------------------------------------------------------
 * Act 1  see the whole year        graph.js paints it, this file drives it
 * Act 2  trace the cause           panel.js renders it, this file routes to it
 * Act 3  live class signal + time  signal.js fetches it, this file spends it
 *
 * No build step, no dependencies. Plain ES modules served straight from
 * /curriculum/map/.
 * ========================================================================== */

import { domainStyle, loadModel, searchNodes } from "./data.js";
import { GraphView } from "./graph.js";
import { renderPanel } from "./panel.js";
import { createSignal, loadTeacherRows, QUIET_MESSAGE, signalMap, stuckList } from "./signal.js";

const $ = (id) => document.getElementById(id);
const DEFAULT_DAYS = 7;
const SCRUB_DEBOUNCE = 250;

const state = {
  model: null,
  graph: null,
  pulse: null,
  teacherRows: new Map(),
  openId: "",
  results: [],
  activeResult: -1,
  scrubTimer: 0,
};

/* --------------------------------------------------------------- bootstrap */

async function boot() {
  const shell = $("app");
  try {
    state.model = await loadModel();
  } catch (err) {
    showBootError(err);
    return;
  }
  shell.dataset.ready = "true";
  $("boot").hidden = true;

  state.graph = new GraphView($("graph"), state.model, {
    onSelect: (node) => openNode(node.id, { fly: false }),
    onHover: (node) => paintHoverChip(node),
  });

  buildIndex();
  buildDomainLegend();
  buildEdgeLegend();
  wireControls();
  wireKeyboard();
  wireSearch();
  wireScrubber();

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => state.graph.resize(), 120);
  });

  const fromUrl = state.model.resolve(new URLSearchParams(location.search).get("node") || "");
  if (fromUrl) openNode(fromUrl, { fly: true, replace: true });

  // Act 3 runs after the map is already usable — the curriculum view never
  // waits on the network.
  refreshPulse(DEFAULT_DAYS);
  loadTeacherRows(state.model).then((rows) => {
    state.teacherRows = rows;
    if (state.openId && rows.size) renderOpen();
  });
}

function showBootError(err) {
  const boot = $("boot");
  boot.hidden = false;
  boot.className = "boot boot-error";
  boot.textContent = "";
  const h = document.createElement("h2");
  h.textContent = "The curriculum map could not load";
  const p = document.createElement("p");
  p.textContent =
    (err && err.message) ||
    "The standards graph is unavailable right now. Everything below still works.";
  const a = document.createElement("a");
  a.className = "boot-link";
  a.href = "/curriculum/";
  a.textContent = "Go to the curriculum hub";
  const b = document.createElement("a");
  b.className = "boot-link";
  b.href = "#standards-fallback";
  b.textContent = "See the plain list of standards";
  boot.append(h, p, a, b);
  const fallback = $("standards-fallback");
  if (fallback) fallback.hidden = false;
}

/* ------------------------------------------------------- screen-reader index */

/**
 * The canvas is aria-hidden. THIS is the accessible map: a real, focusable,
 * ordered list of every standard. It also doubles as the "Tab cycles nodes"
 * affordance for sighted keyboard users — it fades in on focus.
 */
function buildIndex() {
  const list = $("index-list");
  list.textContent = "";
  const ordered = state.model.nodes.slice().sort((a, b) => {
    if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
    return a.depth - b.depth || a.id.localeCompare(b.id, undefined, { numeric: true });
  });

  for (const node of ordered) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "idx-item";
    btn.dataset.id = node.id;
    btn.style.setProperty("--dot", domainStyle(node.domain).glow);

    const id = document.createElement("span");
    id.className = "idx-id";
    id.textContent = node.id;
    const name = document.createElement("span");
    name.className = "idx-name";
    name.textContent = node.shortLabel || node.label;
    const meta = document.createElement("span");
    meta.className = "idx-meta";
    meta.textContent = `${node.domainName} · ${node.assetCount} resource${node.assetCount === 1 ? "" : "s"}`;

    btn.append(id, name, meta);
    btn.addEventListener("focus", () => {
      state.graph.setFocus(node.id);
      ensureVisible(node.id);
    });
    btn.addEventListener("blur", () => state.graph.setFocus(""));
    btn.addEventListener("click", () => openNode(node.id, { fly: true }));
    li.appendChild(btn);
    list.appendChild(li);
  }
  $("index-count").textContent = `${state.model.nodes.length} standards`;
}

function ensureVisible(id) {
  const g = state.graph;
  const node = state.model.byId.get(id);
  if (!node) return;
  const p = g.toScreen(node.x, node.y);
  const m = 90;
  if (p.x < m || p.y < m || p.x > g.w - m || p.y > g.h - m) g.flyTo(id);
}

/* ------------------------------------------------------------------ chrome */

function buildDomainLegend() {
  const list = $("legend-domains");
  list.textContent = "";
  for (const lane of state.model.lanes) {
    const li = document.createElement("li");
    const dot = document.createElement("span");
    dot.className = "lg-dot";
    dot.style.background = domainStyle(lane.domain).glow;
    const label = document.createElement("span");
    label.textContent = lane.name;
    const count = document.createElement("span");
    count.className = "lg-count";
    count.textContent = String(lane.count);
    li.append(dot, label, count);
    list.appendChild(li);
  }
}

function buildEdgeLegend() {
  const list = $("edgekey");
  list.textContent = "";
  for (const key of ["core", "supporting", "fluency"]) {
    const copy = state.model.strengths[key];
    if (!copy) continue;
    const li = document.createElement("li");
    const line = document.createElement("span");
    line.className = `ek-line ${key}`;
    const body = document.createElement("span");
    const name = document.createElement("b");
    name.textContent = key;
    const text = document.createElement("span");
    text.textContent = copy;
    body.append(name, text);
    li.append(line, body);
    list.appendChild(li);
  }
}

function paintHoverChip(node) {
  const chip = $("hover-chip");
  if (!node) {
    chip.hidden = true;
    return;
  }
  chip.hidden = false;
  chip.textContent = "";
  const id = document.createElement("strong");
  id.textContent = node.id;
  const name = document.createElement("span");
  name.textContent = node.shortLabel || node.label;
  const meta = document.createElement("em");
  meta.textContent = `${node.assetCount} resource${node.assetCount === 1 ? "" : "s"} · ${node.prereqs.length} underneath`;
  chip.append(id, name, meta);
}

function wireControls() {
  $("zoom-in").addEventListener("click", () => state.graph.zoomBy(1.28));
  $("zoom-out").addEventListener("click", () => state.graph.zoomBy(1 / 1.28));
  $("zoom-fit").addEventListener("click", () => state.graph.fit(true));
  $("panel-close").addEventListener("click", closePanel);
}

function wireKeyboard() {
  const field = $("field");
  field.addEventListener("keydown", (e) => {
    const step = e.shiftKey ? 220 : 70;
    switch (e.key) {
      case "ArrowLeft":
        state.graph.panBy(step, 0);
        break;
      case "ArrowRight":
        state.graph.panBy(-step, 0);
        break;
      case "ArrowUp":
        state.graph.panBy(0, step);
        break;
      case "ArrowDown":
        state.graph.panBy(0, -step);
        break;
      case "+":
      case "=":
        state.graph.zoomBy(1.28);
        break;
      case "-":
      case "_":
        state.graph.zoomBy(1 / 1.28);
        break;
      case "0":
        state.graph.fit(true);
        break;
      case "Enter":
        if (state.graph.focusId) openNode(state.graph.focusId, { fly: true });
        else return;
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.openId) {
      closePanel();
      $("field").focus();
    }
  });
}

/* ------------------------------------------------------------------ search */

function wireSearch() {
  const input = $("q");
  const box = $("results");

  input.addEventListener("input", () => runSearch(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!state.results.length) return;
      e.preventDefault();
      const dir = e.key === "ArrowDown" ? 1 : -1;
      const n = state.results.length;
      state.activeResult = (((state.activeResult + dir) % n) + n) % n;
      paintResults();
    } else if (e.key === "Enter") {
      const pick = state.results[Math.max(0, state.activeResult)];
      if (pick) {
        e.preventDefault();
        chooseResult(pick.id);
      }
    } else if (e.key === "Escape") {
      input.value = "";
      runSearch("");
      input.blur();
    }
  });
  box.addEventListener("mousedown", (e) => e.preventDefault());
}

function runSearch(query) {
  const hits = searchNodes(state.model, query);
  state.results = hits ? hits.slice(0, 8) : [];
  state.activeResult = hits && hits.length ? 0 : -1;
  state.graph.setFilter(hits ? new Set(hits.map((n) => n.id)) : null);
  paintResults();
  const status = $("search-status");
  if (!hits) status.textContent = "";
  else status.textContent = `${hits.length} standard${hits.length === 1 ? "" : "s"} match`;
}

function paintResults() {
  const box = $("results");
  const input = $("q");
  box.textContent = "";
  if (!state.results.length) {
    box.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    return;
  }
  box.hidden = false;
  input.setAttribute("aria-expanded", "true");
  state.results.forEach((node, i) => {
    const li = document.createElement("li");
    li.className = `result${i === state.activeResult ? " is-active" : ""}`;
    li.id = `result-${i}`;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", i === state.activeResult ? "true" : "false");
    li.tabIndex = -1;
    if (i === state.activeResult) input.setAttribute("aria-activedescendant", li.id);
    const id = document.createElement("span");
    id.className = "result-id";
    id.textContent = node.id;
    id.style.setProperty("--dot", domainStyle(node.domain).ink);
    const name = document.createElement("span");
    name.className = "result-name";
    name.textContent = node.shortLabel || node.label;
    li.append(id, name);
    li.addEventListener("click", () => chooseResult(node.id));
    box.appendChild(li);
  });
}

function chooseResult(id) {
  $("results").hidden = true;
  openNode(id, { fly: true });
}

/* ------------------------------------------------------------- Act 3 signal */

const signal = createSignal();

function wireScrubber() {
  const slider = $("scrub");
  slider.addEventListener("input", () => {
    paintScrubLabel(Number(slider.value));
    clearTimeout(state.scrubTimer);
    state.scrubTimer = setTimeout(() => refreshPulse(Number(slider.value)), SCRUB_DEBOUNCE);
  });
  paintScrubLabel(Number(slider.value));
}

function paintScrubLabel(days) {
  $("scrub-value").textContent = `last ${days} day${days === 1 ? "" : "s"}`;
}

async function refreshPulse(days) {
  const pulse = await signal.pulse(days);
  state.pulse = pulse;
  state.graph.setSignal(signalMap(pulse, state.model));
  paintPulse(pulse);
  if (state.openId) renderOpen();
}

function paintPulse(pulse) {
  const note = $("signal-note");
  const stuckBox = $("stuck");
  const legend = $("legend-live");
  stuckBox.textContent = "";
  legend.textContent = "";

  if (pulse.suppressed || !pulse.tags.length) {
    note.textContent = QUIET_MESSAGE;
    note.hidden = false;
    $("stuck-block").hidden = true;
    $("legend-live-block").hidden = true;
    $("cohort-note").textContent = "";
    return;
  }

  note.hidden = true;
  $("stuck-block").hidden = false;
  $("legend-live-block").hidden = false;

  const rows = stuckList(pulse, state.model);
  for (const row of rows) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stuck-item";
    btn.style.setProperty("--dot", domainStyle(row.node.domain).glow);
    const bar = document.createElement("span");
    bar.className = "stuck-bar";
    const fill = document.createElement("span");
    fill.className = "stuck-fill";
    fill.style.width = `${Math.max(6, Math.round(row.share * 100))}%`;
    bar.appendChild(fill);
    const id = document.createElement("span");
    id.className = "stuck-id";
    id.textContent = `${row.id} · ${row.node.shortLabel || row.node.label}`;
    const why = document.createElement("span");
    why.className = "stuck-why";
    why.textContent = row.label;
    btn.append(id, bar, why);
    btn.addEventListener("click", () => openNode(row.id, { fly: true }));
    stuckBox.appendChild(btn);
  }
  if (!rows.length) {
    const p = document.createElement("p");
    p.className = "rail-quiet";
    p.textContent = "Flagged mistakes this window do not map onto a Grade 6 standard.";
    stuckBox.appendChild(p);
  }

  for (const tag of pulse.tags.slice(0, 6)) {
    const li = document.createElement("li");
    const share = document.createElement("span");
    share.className = "lv-share";
    share.textContent = `${Math.round((tag.share || 0) * 100)}%`;
    const label = document.createElement("span");
    label.textContent = tag.label;
    li.append(share, label);
    legend.appendChild(li);
  }

  $("cohort-note").textContent =
    `${pulse.totalTagged} flagged moments · ${pulse.cohort} students in this window`;
}

/* ------------------------------------------------------------- Act 2 panel */

function openNode(id, opts = {}) {
  const resolved = state.model.resolve(id);
  if (!resolved) return;
  state.openId = resolved;
  state.graph.setSelected(resolved);
  if (opts.fly !== false) state.graph.flyTo(resolved);

  const panel = $("panel");
  panel.hidden = false;
  document.getElementById("app").dataset.panel = "open";
  renderOpen();
  if (!opts.replace) $("panel-close").focus({ preventScroll: true });

  const url = new URL(location.href);
  url.searchParams.set("node", resolved);
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function renderOpen() {
  renderPanel($("panel-content"), state.model, state.openId, {
    onOpen: (id) => openNode(id, { fly: true }),
    pulse: state.pulse,
    teacherRows: state.teacherRows.get(state.openId) || null,
  });
}

function closePanel() {
  state.openId = "";
  state.graph.setSelected("");
  $("panel").hidden = true;
  $("panel-content").textContent = "";
  document.getElementById("app").dataset.panel = "closed";
  const url = new URL(location.href);
  url.searchParams.delete("node");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

boot();
