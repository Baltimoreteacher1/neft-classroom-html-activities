// BCPSS Teacher page — "Plan & Respond" tab.
// One place to see how a unit fits together, build a set of resources for a purpose, check a piece of student work and
// plan a small-group reteach. Everything is assembled from the unit's own authored content; nothing leaves the device.

import {
  buildCatalog,
  buildSupportSheet,
  buildUnitMap,
  composeSet,
  groupCatalog,
  LEVELS,
  PURPOSES,
} from "./companion-data.js";
import { openPrint, supportSheetDoc } from "./companion-print.js";
import { bindCheck, bindReteach, checkView, reteachView } from "./companion-views.js";

export const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const VIEWS = [
  { id: "map", label: "Unit map", hint: "How this unit fits together" },
  { id: "build", label: "Build a set", hint: "Pick a purpose, get resources" },
  { id: "check", label: "Check work", hint: "See what an answer shows" },
  { id: "reteach", label: "Reteach plan", hint: "A short small-group lesson" },
];

const courseCache = new Map();
const panelState = new WeakMap();

async function courseUnits(unit) {
  const key = `${unit.grade}|${unit.subject}`;
  if (!courseCache.has(key)) {
    const q = new URLSearchParams({ grade: unit.grade, subject: unit.subject });
    courseCache.set(
      key,
      fetch(`/api/bcpss/units?${q}`)
        .then((r) => (r.ok ? r.json() : { units: [] }))
        .then((j) => j.units || [])
        .catch(() => []),
    );
  }
  return courseCache.get(key);
}

const linkBtn = (href, label, cls = "cp-btn") =>
  href
    ? `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a>`
    : "";

function itemActions(item) {
  if (item.type === "tab")
    return `<button type="button" class="cp-btn" data-cp-tab="${esc(item.tab)}">Open</button>`;
  if (item.type === "local")
    return `<button type="button" class="cp-btn" data-cp-view="${esc(item.view)}">Open</button>`;
  return [
    linkBtn(item.play, "Play", "cp-btn cp-btn--solid"),
    linkBtn(item.page, "Preview"),
    linkBtn(item.print, "PDF"),
    linkBtn(item.word, "Word"),
  ].join("");
}

function itemRow(item, { pick = false } = {}) {
  const meta = [
    item.domain,
    item.minutes ? `${item.minutes} min` : "",
    item.grouping,
    item.teacher ? "Teacher copy" : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return `
    <li class="cp-item">
      ${pick ? `<input type="checkbox" class="cp-check" data-cp-pick="${esc(item.id)}" ${item.selected ? "checked" : ""} aria-label="Include ${esc(item.title)}" />` : ""}
      <div class="cp-item-main"><b>${esc(item.title)}</b><span>${esc(item.note || "")}</span>${meta ? `<small>${esc(meta)}</small>` : ""}</div>
      <div class="cp-item-actions">${itemActions(item)}</div>
    </li>`;
}

// ── Unit map ────────────────────────────────────────────────────────────────

function unitChip(u, label) {
  if (!u)
    return `<div class="cp-seq-card cp-seq-card--empty"><small>${esc(label)}</small><span>None in this course</span></div>`;
  return `<button type="button" class="cp-seq-card" data-cp-unit="${esc(u.id || u.unit_id)}"><small>${esc(label)}</small><b>Unit ${esc(u.unit_number ?? "")}: ${esc(u.unit_title || u.title)}</b></button>`;
}

function mapView(map, catalog) {
  const u = map.unit;
  const groups = groupCatalog(catalog)
    .map(
      (g) =>
        `<section class="cp-group" aria-labelledby="cpg-${g.id}"><h4 id="cpg-${g.id}">${esc(g.label)} <span>${g.items.length}</span></h4><ul class="cp-list">${g.items.map((i) => itemRow(i)).join("")}</ul></section>`,
    )
    .join("");
  const watch = [
    map.misconception?.pattern
      ? `<li><b>Common mix-up:</b> ${esc(map.misconception.pattern)} <span class="cp-fix"><b>Try:</b> ${esc(map.misconception.redirect)}</span></li>`
      : "",
    ...map.watchouts.map(
      (w) =>
        `<li><b>${esc(w.group)}:</b> ${esc(w.issue)} <span class="cp-fix"><b>Try:</b> ${esc(w.fix)}</span></li>`,
    ),
  ].join("");
  const transfers = map.transfers.length
    ? `<div class="cp-card"><h4>Connects to other subjects</h4><ul class="cp-plain">${map.transfers.map((t) => `<li><button type="button" class="cp-link" data-cp-unit="${esc(t.id)}">Grade ${esc(t.grade)} ${esc(t.subject)}: ${esc(t.title)}</button>${t.note ? `<span>${esc(t.note)}</span>` : ""}</li>`).join("")}</ul></div>`
    : "";
  const spiral = map.spiralFrom.length
    ? `<p class="cp-muted">Spiral review in this unit draws on: ${map.spiralFrom.map(esc).join(", ")}.</p>`
    : "";
  return `
    <div class="cp-map">
      <div class="cp-card cp-card--lead">
        <p class="cp-eyebrow">Big question</p>
        <p class="cp-question">${esc(map.question)}</p>
        <div class="cp-goals">
          <div><h4>Content goal</h4><p>${esc(map.contentGoal)}</p></div>
          <div><h4>Language goal</h4><p>${esc(map.languageGoal)}</p>${map.klu ? `<p class="cp-muted">Main language use: ${esc(map.klu)}</p>` : ""}</div>
        </div>
        ${map.standards.length ? `<p class="cp-muted">Standards: ${map.standards.map(esc).join(", ")}</p>` : ""}
      </div>
      <div class="cp-seq" aria-label="Unit sequence in this course">
        ${unitChip(map.before, "Comes before")}
        <div class="cp-seq-card cp-seq-card--here"><small>This unit</small><b>Unit ${esc(u.unit_number)}: ${esc(u.unit_title)}</b></div>
        ${unitChip(map.after, "Comes next")}
      </div>
      ${spiral}
      <div class="cp-two">
        <div class="cp-card"><h4>Key words</h4><ul class="cp-words">${map.words.map((w) => `<li><b>${esc(w.term)}</b>${w.es ? ` <i>${esc(w.es)}</i>` : ""}<span>${esc(w.def)}</span></li>`).join("")}</ul></div>
        <div class="cp-card"><h4>Watch for</h4><ul class="cp-plain">${watch}</ul>${map.connectors.length ? `<p class="cp-muted">Linking words: ${map.connectors.map(esc).join(", ")}</p>` : ""}</div>
      </div>
      ${transfers}
      <h3 class="cp-h">Everything for this unit</h3>
      <div class="cp-groups">${groups}</div>
    </div>`;
}

// ── Build a set ─────────────────────────────────────────────────────────────

function supportPreview(sheet) {
  const body = sheet.frames.length
    ? `<ol>${sheet.frames.map((f) => `<li>${esc(f)}</li>`).join("")}</ol>`
    : sheet.starters.length
      ? `<ol>${sheet.starters.map((f) => `<li>${esc(f)} ...</li>`).join("")}</ol>`
      : `<p class="cp-muted">Students write on lines with only the word bank and linking words.</p>`;
  return `
    <div class="cp-preview" aria-live="polite">
      <p class="cp-eyebrow">Preview: Language Support Sheet</p>
      <p><b>${esc(sheet.question)}</b></p>
      <p class="cp-chips">${sheet.words.map((w) => `<span>${esc(w.term)}${w.es ? ` / ${esc(w.es)}` : ""}</span>`).join("")}</p>
      <p class="cp-chips cp-chips--soft">${sheet.connectors.map((c) => `<span>${esc(c)}</span>`).join("")}</p>
      ${body}
    </div>`;
}

function buildView(st, detail, catalog) {
  const set = composeSet(st.purpose, catalog);
  for (const item of set.items)
    if (st.picks.has(`${st.purpose}:${item.id}`))
      item.selected = st.picks.get(`${st.purpose}:${item.id}`);
  const chosen = set.items.filter((i) => i.selected);
  const minutes = chosen.reduce((n, i) => n + (Number(i.minutes) || 0), 0);
  const sheet = buildSupportSheet(detail, st.level, st.fade);
  const fades = ["Full frames", "Starters only", "Word bank only"];
  return `
    <div class="cp-build">
      <fieldset class="cp-field"><legend>1. What do you need?</legend>
        <div class="cp-chiprow">${PURPOSES.map((p) => `<button type="button" class="cp-chip" data-cp-purpose="${p.id}" aria-pressed="${p.id === st.purpose}">${esc(p.label)}</button>`).join("")}</div>
      </fieldset>
      <fieldset class="cp-field"><legend>2. How much language support?</legend>
        <div class="cp-chiprow">${LEVELS.map((l) => `<button type="button" class="cp-chip" data-cp-level="${l.key}" aria-pressed="${l.key === st.level}">${esc(l.label)}<small>${esc(l.hint)}</small></button>`).join("")}</div>
      </fieldset>
      <div class="cp-set">
        <div class="cp-set-head"><h3 class="cp-h">3. Your set: ${esc(set.purpose.label)}</h3><span class="cp-muted">${chosen.length} picked${minutes ? ` · about ${minutes} min of activities` : ""}</span></div>
        ${set.purpose.id === "access" ? `<p class="cp-note">Informal practice in all four language domains, built from this unit's content. It is not an ACCESS test and gives no scores.</p>` : ""}
        <ul class="cp-list">${set.items.map((i) => itemRow(i, { pick: true })).join("")}</ul>
      </div>
      <div class="cp-card">
        <div class="cp-set-head"><h4>Language Support Sheet</h4>
          <div class="cp-chiprow cp-chiprow--tight" role="group" aria-label="Fade the support">${fades.map((f, i) => `<button type="button" class="cp-chip" data-cp-fade="${i}" aria-pressed="${i === st.fade}">${f}</button>`).join("")}</div>
        </div>
        <p class="cp-muted">Fade the support over the unit: start with full frames, move to starters, end with the word bank alone. The question and words stay the same.</p>
        ${supportPreview(sheet)}
        <button type="button" class="cp-btn cp-btn--solid" data-cp-print="support">Print support sheet</button>
      </div>
    </div>`;
}

// ── Shell ───────────────────────────────────────────────────────────────────

function shell(st, inner) {
  return `
    <div class="cp" data-cp-root>
      <div class="cp-top">
        <div><h3 class="cp-title">Plan &amp; Respond</h3><p class="cp-muted">Built from this unit's own words, goals and activities. Nothing you type here leaves this device.</p></div>
        <div class="cp-views" role="group" aria-label="Plan and respond views">${VIEWS.map((v) => `<button type="button" class="cp-view" data-cp-view="${v.id}" aria-pressed="${v.id === st.view}"><b>${esc(v.label)}</b><small>${esc(v.hint)}</small></button>`).join("")}</div>
      </div>
      <div class="cp-body" data-cp-body>${inner}</div>
    </div>`;
}

/**
 * @param {HTMLElement} panel
 * @param {{ detail: object, wida: string, onOpenTab?: (tab:string)=>void, onOpenUnit?: (id:string)=>void }} ctx
 */
export function renderCompanionTab(panel, ctx) {
  if (!panel) return;
  const detail = ctx.detail;
  if (!detail?.unit?.id || !detail.studio) {
    panel.innerHTML = `<div class="bh-empty">Plan &amp; Respond needs a unit with Language Studio content. Choose a unit above.</div>`;
    return;
  }
  const st = panelState.get(panel) || {
    view: "map",
    purpose: "introduce",
    fade: 0,
    picks: new Map(),
    pathway: "content",
    text: "",
    task: "exit",
  };
  if (st.unitId !== detail.unit.id) {
    st.picks = new Map();
    st.text = "";
    st.result = null;
    st.unitId = detail.unit.id;
  }
  st.level = ctx.wida || st.level || "3_4";
  panelState.set(panel, st);
  st.ctx = ctx;
  let course = [];

  const draw = () => {
    const catalog = buildCatalog(detail, st.level);
    const map = buildUnitMap(detail, course);
    const inner =
      st.view === "build"
        ? buildView(st, detail, catalog)
        : st.view === "check"
          ? checkView(st, detail)
          : st.view === "reteach"
            ? reteachView(st, detail, map.before)
            : mapView(map, catalog);
    panel.innerHTML = shell(st, inner);
  };
  st.draw = draw;
  draw();
  courseUnits(detail.unit).then((list) => {
    course = list;
    if (st.unitId === detail.unit.id && (st.view === "map" || st.view === "reteach")) draw();
  });

  if (panel.dataset.cpBound) return;
  panel.dataset.cpBound = "1";
  panel.addEventListener("click", (e) => onClick(panel, e));
  panel.addEventListener("change", (e) => onChange(panel, e));
  panel.addEventListener("input", (e) => onInput(panel, e));
}

function onClick(panel, e) {
  const st = panelState.get(panel);
  if (!st) return;
  const t = e.target.closest("button, a");
  if (!t || t.tagName === "A") return;
  const { detail } = st.ctx;
  const d = t.dataset;
  if (d.cpView) {
    st.view = d.cpView;
    st.draw();
    panel.querySelector(`[data-cp-view="${st.view}"]`)?.focus();
    return;
  }
  if (d.cpTab) return st.ctx.onOpenTab?.(d.cpTab);
  if (d.cpUnit) return st.ctx.onOpenUnit?.(d.cpUnit);
  if (d.cpPurpose) st.purpose = d.cpPurpose;
  else if (d.cpLevel) st.level = d.cpLevel;
  else if (d.cpFade) st.fade = Number(d.cpFade);
  else if (d.cpPrint === "support") {
    openPrint(
      supportSheetDoc(detail.unit, buildSupportSheet(detail, st.level, st.fade)),
      `support-${detail.unit.id}.html`,
    );
    return;
  } else if (bindCheck(st, t) || bindReteach(st, t)) {
    // handled in companion-views.js
  } else return;
  const focusKey = Object.keys(d).find((k) => k.startsWith("cp"));
  st.draw();
  if (focusKey) {
    const attr = `data-${focusKey.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
    panel.querySelector(`[${attr}="${CSS.escape(d[focusKey])}"]`)?.focus();
  }
}

function onChange(panel, e) {
  const st = panelState.get(panel);
  const box = e.target.closest("[data-cp-pick]");
  if (box && st) {
    st.picks.set(`${st.purpose}:${box.dataset.cpPick}`, box.checked);
    st.draw();
    panel.querySelector(`[data-cp-pick="${CSS.escape(box.dataset.cpPick)}"]`)?.focus();
    return;
  }
  const sel = e.target.closest("[data-cp-task]");
  if (sel && st) st.task = sel.value;
}

function onInput(panel, e) {
  const st = panelState.get(panel);
  const ta = e.target.closest("[data-cp-text]");
  if (ta && st) st.text = ta.value;
}
