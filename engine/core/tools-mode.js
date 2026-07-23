// tools-mode.js — a standalone "Interactive Tools" practice page for a lesson.
//
// Every lesson already authors its manipulatives (equation-balance lab, step
// solver, balance scale, tape diagram, number lines, …) inside its section
// `diagram`/`visual`/`simulator` slots. This module surfaces JUST those tools on
// one clean page so students can keep practicing with them, decoupled from the
// instructional flow. It is opt-in from the lesson's Tools menu or a
// `?mode=tools` deep link, and fully reversible (a back link returns to the
// lesson).
//
// Design notes:
//   • Config-driven: tools are collected straight from the lesson `config`, so
//     the page works identically under the full renderer AND the small-group
//     compact renderer — it never scrapes rendered DOM, sidestepping the two
//     renderers' different section handling.
//   • Registry-gated: a block is a "tool" iff `interactiveVisualHost(v)` returns
//     a host (i.e. its `kind` is in the shared interactive-visual REGISTRY). So
//     resource blocks that also carry a `kind` (printables: activity,
//     word-search, …) are excluded automatically, and any new registered kind
//     is picked up with no change here.

import { interactiveVisualHost, mountInteractiveVisuals } from "./interactive-visual.js";

// Sections whose visual slots hold genuine lesson manipulatives, in the order we
// want them to appear on the tools page (hands-on practice first, hook last).
const SECTION_ORDER = ["explore", "practice", "connect", "launch", "reflect"];
// Keys within a section that can carry an interactive-visual block (a single
// object or an array of them).
const VISUAL_KEYS = ["diagram", "visual", "simulator", "lab"];

// Friendly display names per kind (falls back to a title-cased kind).
const KIND_LABEL = {
  "equation-balance-lab": "Equation Balance Lab",
  "step-solver": "Work It Out — Step Solver",
  "tape-diagram": "Tape Diagram",
  "coordinate-plane": "Coordinate Plane",
  "number-line": "Number Line",
  "factor-tree": "Factor Tree",
  "factor-tree-lab": "Factor Tree Lab",
  "line-grapher": "Line Grapher",
  "scenario-sim": "Scenario Simulator",
  "algebra-expand": "Distribute Lab",
  "combine-like-terms": "Combine Like Terms",
  "percent-builder": "Percent Lab",
  "unit-rate-builder": "Unit Rate Lab",
  "ratio-table-builder": "Ratio Table Lab",
  histogram: "Data Explorer",
  "dot-plot": "Data Explorer",
  "box-plot": "Data Explorer",
  "bar-chart": "Data Explorer",
  "stats-data-lab": "Stats Data Lab",
  "number-line-explorer": "Number Line Explorer",
};

const MANIP_LABEL = {
  balance: "Balance Scale",
  "number-line": "Number Line",
  "line-grapher": "Line Grapher",
};

function titleCase(kind) {
  return String(kind || "Interactive Tool")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function toolTitle(v) {
  if (v.kind === "manip") return MANIP_LABEL[v.manip] || titleCase(v.manip);
  return v.title || v.label || KIND_LABEL[v.kind] || titleCase(v.kind);
}

/** True if `mode=tools` is on the current URL. */
export function isToolsMode() {
  try {
    return new URLSearchParams(window.location.search).get("mode") === "tools";
  } catch (_e) {
    return false;
  }
}

/**
 * Collect every interactive-tool block from a lesson `config`, gated by the
 * shared interactive-visual registry. Returns `[{ v, section }]` in
 * SECTION_ORDER, de-duplicated by kind+config so a tool authored twice on the
 * page (e.g. explore and a guided block) appears once.
 */
export function collectTools(config) {
  const out = [];
  const seen = new Set();
  const consider = (v, section) => {
    if (!v || typeof v !== "object" || typeof v.kind !== "string") return;
    if (!interactiveVisualHost(v)) return; // not a registered interactive kind
    const key = `${v.kind}::${JSON.stringify(v)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ v, section });
  };
  for (const section of SECTION_ORDER) {
    const sec = config?.[section];
    if (!sec || typeof sec !== "object") continue;
    for (const key of VISUAL_KEYS) {
      const slot = sec[key];
      if (Array.isArray(slot)) slot.forEach((v) => consider(v, section));
      else consider(slot, section);
    }
  }
  return out;
}

const STYLE_ID = "nt-tools-mode-style";
const CSS = `
.nt-tools { max-width: 1100px; margin: 0 auto; padding: clamp(16px, 4vw, 40px) 18px 72px; }
.nt-tools-head { margin-bottom: clamp(18px, 3vw, 28px); }
.nt-tools-eyebrow { font: 700 13px/1.2 var(--font-ui, system-ui, sans-serif); letter-spacing: .12em; text-transform: uppercase; color: var(--accent, #0d7a76); margin: 0 0 6px; }
.nt-tools-title { font: 800 clamp(26px, 5vw, 40px)/1.1 var(--font-display, "Outfit", system-ui, sans-serif); color: var(--ink, #12355b); margin: 0 0 8px; }
.nt-tools-sub { font: 400 clamp(15px, 2.4vw, 18px)/1.5 var(--font-body, "Hanken Grotesk", system-ui, sans-serif); color: var(--muted, #5f6f80); max-width: 62ch; margin: 0; }
.nt-tools-nav { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.nt-tools-nav a { display: inline-flex; align-items: center; gap: 6px; font: 600 15px/1 var(--font-ui, system-ui, sans-serif); text-decoration: none; padding: 10px 16px; border-radius: 999px; border: 1px solid #d7e2ed; color: var(--ink, #12355b); background: #fff; transition: background .15s ease, border-color .15s ease; }
.nt-tools-nav a:hover { background: #f2f7fb; border-color: #b9cee0; }
.nt-tools-nav a.primary { background: var(--accent, #0d7a76); border-color: var(--accent, #0d7a76); color: #fff; }
.nt-tools-nav a.primary:hover { filter: brightness(.95); }
.nt-tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: clamp(16px, 2.4vw, 24px); margin-top: clamp(20px, 3vw, 30px); }
.nt-tool-card { background: #fff; border: 1px solid #e2ebf3; border-radius: 18px; padding: clamp(14px, 2.4vw, 22px); box-shadow: 0 1px 2px rgba(18,53,91,.05), 0 8px 24px rgba(18,53,91,.05); overflow-x: auto; }
.nt-tool-card > h2 { display: flex; align-items: baseline; gap: 10px; font: 700 19px/1.2 var(--font-display, "Outfit", system-ui, sans-serif); color: var(--ink, #12355b); margin: 0 0 12px; }
.nt-tool-card .nt-tool-tag { font: 600 11px/1 var(--font-ui, system-ui, sans-serif); letter-spacing: .08em; text-transform: uppercase; color: var(--accent, #0d7a76); background: #e7f4f2; padding: 4px 8px; border-radius: 6px; }
.nt-tools-empty { margin-top: 30px; padding: 28px; border: 1px dashed #cdd9e5; border-radius: 16px; color: #5f6f80; font: 400 16px/1.5 var(--font-body, system-ui, sans-serif); text-align: center; }
.nt-tool-edit { margin: 0 0 14px; border: 1px solid #dbe6f0; border-radius: 12px; background: #f7fafd; }
.nt-tool-edit > summary { cursor: pointer; list-style: none; padding: 10px 14px; font: 600 14px/1.2 var(--font-ui, system-ui, sans-serif); color: var(--accent, #0d7a76); user-select: none; }
.nt-tool-edit > summary::-webkit-details-marker { display: none; }
.nt-tool-edit[open] > summary { border-bottom: 1px solid #dbe6f0; }
.nt-edit-form { padding: 12px 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px 14px; }
.nt-edit-field { display: flex; flex-direction: column; gap: 4px; font: 600 12px/1.2 var(--font-ui, system-ui, sans-serif); color: var(--muted, #5f6f80); }
.nt-edit-field input { font: 500 15px/1.2 var(--font-body, system-ui, sans-serif); color: var(--ink, #12355b); padding: 8px 10px; border: 1px solid #cdd9e5; border-radius: 8px; background: #fff; min-width: 0; }
.nt-edit-field input:focus { outline: 2px solid var(--accent, #0d7a76); outline-offset: 1px; border-color: var(--accent, #0d7a76); }
.nt-edit-btns { grid-column: 1 / -1; display: flex; gap: 8px; margin-top: 2px; }
.nt-edit-btns button { font: 700 14px/1 var(--font-ui, system-ui, sans-serif); padding: 9px 16px; border-radius: 999px; cursor: pointer; border: 1px solid transparent; }
.nt-edit-apply { background: var(--accent, #0d7a76); color: #fff; }
.nt-edit-apply:hover { filter: brightness(.95); }
.nt-edit-reset { background: #fff; color: var(--ink, #12355b); border-color: #cdd9e5; }
.nt-edit-reset:hover { background: #eef4f9; }
.nt-theme-row { display: flex; justify-content: flex-end; margin-bottom: 4px; }
.nt-theme-toggle { display: inline-flex; align-items: center; gap: 6px; font: 600 13px/1 var(--font-ui, system-ui, sans-serif); cursor: pointer; padding: 8px 14px; border-radius: 999px; border: 1px solid #d7e2ed; background: #fff; color: var(--ink, #12355b); }
.nt-theme-toggle:hover { background: #f2f7fb; border-color: #b9cee0; }
/* Dark theme — teacher toggle ONLY (never auto), so classroom pages stay light
   by default regardless of the device's OS dark-mode setting. */
body.nt-tools-dark { background: #0f171f; }
body.nt-tools-dark .nt-tools-eyebrow { color: #4fd0c4; }
body.nt-tools-dark .nt-tools-title { color: #eef3f8; }
body.nt-tools-dark .nt-tools-sub { color: #9fb0c0; }
body.nt-tools-dark .nt-tool-card { background: #16202b; border-color: #26333f; }
body.nt-tools-dark .nt-tool-card > h2 { color: #eef3f8; }
body.nt-tools-dark .nt-tools-empty { color: #9fb0c0; border-color: #2b3a47; }
body.nt-tools-dark .nt-tool-edit { background: #131c25; border-color: #2b3a47; }
body.nt-tools-dark .nt-tool-edit > summary { color: #4fd0c4; }
body.nt-tools-dark .nt-tool-edit[open] > summary { border-color: #2b3a47; }
body.nt-tools-dark .nt-edit-field { color: #9fb0c0; }
body.nt-tools-dark .nt-edit-field input { background: #0f171f; border-color: #2b3a47; color: #eef3f8; }
body.nt-tools-dark .nt-edit-reset { background: #16202b; color: #eef3f8; border-color: #2b3a47; }
body.nt-tools-dark .nt-edit-reset:hover { background: #1c2833; }
body.nt-tools-dark .nt-theme-toggle { background: #16202b; border-color: #2b3a47; color: #eef3f8; }
body.nt-tools-dark .nt-theme-toggle:hover { background: #1c2833; }
`;

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

// The lesson URL with `mode=tools` stripped — the "Back to lesson" target.
function _lessonUrl() {
  try {
    const u = new URL(window.location.href);
    u.searchParams.delete("mode");
    return u.pathname + (u.search || "") + u.hash;
  } catch (_e) {
    return "./";
  }
}

// ── "Change the numbers" editor ─────────────────────────────────────────────
// Config-key-driven (not per-kind): the same field names recur across kinds, so
// a small allow-list of editable keys + type inference covers the whole engine.
// Editing rebuilds the config and re-mounts the widget from the shared registry.
const NUMBER_KEYS = new Set([
  "min",
  "max",
  "step",
  "value",
  "a",
  "b",
  "c",
  "h",
  "w",
  "d",
  "base",
  "exponent",
  "whole",
  "percent",
  "q1",
  "median",
  "q3",
  "axisMin",
  "axisMax",
  "binWidth",
  "startB",
  "kMin",
  "kMax",
  "kStep",
  "kDefault",
]);
const EQUATION_KEYS = new Set(["equation", "answer", "expr"]);
const AMBIG_KEYS = new Set(["start", "dividend", "divisor"]); // number OR expression by type
const LIST_KEYS = new Set(["values", "data"]);
const FIELD_LABEL = {
  equation: "Equation",
  answer: "Answer",
  expr: "Expression",
  start: "Start",
  startB: "Second number",
  a: "First number",
  b: "Second number",
  c: "Add",
  h: "Height",
  w: "Width",
  d: "Depth",
  base: "Base",
  exponent: "Exponent",
  whole: "Whole",
  percent: "Percent",
  dividend: "Dividend",
  divisor: "Divisor",
  min: "Minimum",
  max: "Maximum",
  step: "Step",
  value: "Number",
  q1: "Q1",
  median: "Median",
  q3: "Q3",
  axisMin: "Axis min",
  axisMax: "Axis max",
  binWidth: "Bin width",
  values: "Values",
  data: "Data",
  kMin: "Slope min",
  kMax: "Slope max",
  kStep: "Slope step",
  kDefault: "Slope",
};

const fieldLabel = (k) => FIELD_LABEL[k] || titleCase(k);
const isNumeric = (v) =>
  typeof v === "number" || (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)));
const clone = (o) => JSON.parse(JSON.stringify(o));

function setPath(obj, path, value) {
  let o = obj;
  for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
  o[path[path.length - 1]] = value;
}

// Editable field descriptors for a tool config: scalars, equations, `manip`
// attrs, per-bar values, tape-diagram part values, and flat number lists.
// (`points` grids stay read-only — their numbers live inside coordinate labels.)
function editableFields(cfg) {
  const fields = [];
  const push = (path, label, type, value) => fields.push({ path, label, type, value });
  for (const [k, val] of Object.entries(cfg)) {
    if (k === "attrs" && val && typeof val === "object" && !Array.isArray(val)) {
      for (const [ak, av] of Object.entries(val)) {
        if (ak === "equation") push(["attrs", ak], "Equation", "text", av);
        else if (isNumeric(av)) push(["attrs", ak], fieldLabel(ak), "number", Number(av));
      }
    } else if (k === "bars" && Array.isArray(val)) {
      val.forEach((bar, i) => {
        if (bar && isNumeric(bar.value))
          push(["bars", i, "value"], bar.label || `Bar ${i + 1}`, "number", Number(bar.value));
      });
    } else if (k === "rows" && Array.isArray(val)) {
      // Tape-diagram parts. Each part's `value` is editable; its `label` often
      // carries the number ("37") or a variable expression ("p = 23"), so the
      // custom setter also swaps the old number token in the label for the new
      // one, keeping the drawn segment and its caption consistent.
      val.forEach((row, i) => {
        if (!row || !Array.isArray(row.parts)) return;
        const many = row.parts.length > 1;
        row.parts.forEach((part, j) => {
          if (!part || !isNumeric(part.value)) return;
          const base = row.label ? String(row.label) : `Row ${i + 1}`;
          fields.push({
            label: many ? `${base} (${j + 1})` : base,
            type: "number",
            value: Number(part.value),
            set: (next, nv) => {
              const p = next.rows?.[i]?.parts?.[j];
              if (!p) return;
              const oldStr = String(p.value);
              p.value = nv;
              if (typeof p.label === "string") {
                p.label = p.label === oldStr ? String(nv) : p.label.replace(oldStr, String(nv));
              }
            },
          });
        });
      });
    } else if (LIST_KEYS.has(k) && Array.isArray(val) && val.length && val.every(isNumeric)) {
      push([k], `${fieldLabel(k)} (comma-separated)`, "numlist", val.join(", "));
    } else if (EQUATION_KEYS.has(k) && typeof val === "string") {
      push([k], fieldLabel(k), "text", val);
    } else if (AMBIG_KEYS.has(k)) {
      if (typeof val === "number") push([k], fieldLabel(k), "number", val);
      else if (typeof val === "string") push([k], fieldLabel(k), "text", val);
    } else if (NUMBER_KEYS.has(k) && typeof val === "number") {
      push([k], fieldLabel(k), "number", val);
    }
  }
  return fields;
}

// Read an input back to a config value; returns null to mean "leave unchanged".
function readField(f, inputEl) {
  if (f.type === "number") {
    const n = Number(inputEl.value);
    return Number.isFinite(n) ? n : null;
  }
  if (f.type === "numlist") {
    const nums = String(inputEl.value)
      .split(/[,\s]+/)
      .map(Number)
      .filter(Number.isFinite);
    return nums.length ? nums : null;
  }
  const s = String(inputEl.value).trim();
  return s || null;
}

// Build one tool card: heading, optional "Change the numbers" editor, live widget.
function buildToolCard({ v, section }) {
  const card = document.createElement("section");
  card.className = "nt-tool-card";

  const h2 = document.createElement("h2");
  h2.innerHTML = `${esc(toolTitle(v))}<span class="nt-tool-tag">${esc(section)}</span>`;
  card.appendChild(h2);

  const host = document.createElement("div");
  host.className = "nt-tool-host";
  let current = clone(v);
  const remount = () => {
    host.innerHTML = interactiveVisualHost(current, {
      ariaLabel: `${toolTitle(current)} interactive tool`,
    });
    mountInteractiveVisuals(host);
  };

  const fields = editableFields(v);
  if (fields.length) {
    const ed = document.createElement("details");
    ed.className = "nt-tool-edit";
    const summary = document.createElement("summary");
    summary.textContent = "✏️ Change the numbers";
    ed.appendChild(summary);

    const form = document.createElement("div");
    form.className = "nt-edit-form";
    const inputs = [];
    fields.forEach((f) => {
      const row = document.createElement("label");
      row.className = "nt-edit-field";
      const span = document.createElement("span");
      span.textContent = f.label;
      const inp = document.createElement("input");
      inp.type = f.type === "number" ? "number" : "text";
      if (f.type === "number") inp.step = "any";
      inp.inputMode = f.type === "number" ? "decimal" : "text";
      inp.value = String(f.value);
      inputs.push({ f, inp });
      row.append(span, inp);
      form.appendChild(row);
    });

    const btns = document.createElement("div");
    btns.className = "nt-edit-btns";
    const apply = document.createElement("button");
    apply.type = "button";
    apply.className = "nt-edit-apply";
    apply.textContent = "Apply";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "nt-edit-reset";
    reset.textContent = "Reset";
    btns.append(apply, reset);
    form.appendChild(btns);
    ed.appendChild(form);

    apply.addEventListener("click", () => {
      const next = clone(current);
      for (const { f, inp } of inputs) {
        const val = readField(f, inp);
        if (val === null) continue;
        if (f.set) f.set(next, val);
        else setPath(next, f.path, val);
      }
      // Several widgets (lcm-lab, step-solver, …) render presets[0] and IGNORE
      // the top-level scalars when a `presets` array is present. Drop it so the
      // teacher's edited numbers actually become the active problem.
      delete next.presets;
      current = next;
      remount();
    });
    reset.addEventListener("click", () => {
      current = clone(v);
      for (const { f, inp } of inputs) inp.value = String(f.value);
      remount();
    });
    card.appendChild(ed);
  }

  card.appendChild(host);
  remount();
  return card;
}

/**
 * Render the standalone Interactive Tools page for `config` into `root`,
 * replacing whatever it held. Each tool gets a live widget plus a "Change the
 * numbers" editor. No links to other lessons — safe to post to students on its
 * own (only an optional same-lesson back link).
 */
export function renderToolsPage(config, root) {
  if (!root) return;
  ensureStyles();
  document.body.classList.add("nt-tools-mode");
  const tools = collectTools(config);
  const title = config?.title || "This Lesson";
  const lessonNo = config?.lessonId ? `Lesson ${config.lessonId}` : "";
  if (document.title) document.title = `Interactive Tools · ${title}`;

  root.innerHTML = `<main class="nt-tools">
    <header class="nt-tools-head">
      <div class="nt-theme-row">
        <button type="button" class="nt-theme-toggle" id="nt-theme-toggle" aria-pressed="false"></button>
      </div>
      <p class="nt-tools-eyebrow">${esc(lessonNo)} · Interactive Tools</p>
      <h1 class="nt-tools-title">${esc(title)}</h1>
      <p class="nt-tools-sub">Keep practicing with the hands-on models from this lesson. Use “Change the numbers” to build your own examples — nothing here is graded.</p>
    </header>
    <div class="nt-tools-grid" id="nt-tools-grid"></div>
    <div class="nt-tools-empty" id="nt-tools-empty" hidden>This lesson doesn't have standalone interactive tools yet.</div>
  </main>`;

  setupThemeToggle();

  const grid = root.querySelector("#nt-tools-grid");
  if (!tools.length) {
    root.querySelector("#nt-tools-empty").hidden = false;
    grid.hidden = true;
    return;
  }
  for (const t of tools) grid.appendChild(buildToolCard(t));
}

// Teacher light/dark toggle. Default is LIGHT (classroom pages never auto-follow
// the device's OS dark mode); the choice persists per browser in localStorage.
const THEME_KEY = "nt-tools-theme";
function setupThemeToggle() {
  const btn = document.getElementById("nt-theme-toggle");
  const apply = (dark) => {
    document.body.classList.toggle("nt-tools-dark", dark);
    if (btn) {
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.innerHTML = dark
        ? '<span aria-hidden="true">☀️</span> Light mode'
        : '<span aria-hidden="true">🌙</span> Dark mode';
    }
  };
  let dark = false;
  try {
    dark = localStorage.getItem(THEME_KEY) === "dark";
  } catch (_e) {
    /* private mode — default light */
  }
  apply(dark);
  btn?.addEventListener("click", () => {
    dark = !document.body.classList.contains("nt-tools-dark");
    apply(dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch (_e) {
      /* ignore */
    }
  });
}

/**
 * Add an "Interactive Tools" item to the lesson's Tools/utility menu that links
 * to `?mode=tools`. No-op when the lesson has no registered tools. Mirrors the
 * retry-until-mounted pattern present-mode.js uses (the menu mounts with the
 * lesson chrome).
 */
export function mountToolsMenuItem(config) {
  if (typeof document === "undefined") return;
  if (!collectTools(config).length) return;
  const tryMount = () => {
    const slot = document.querySelector('.nt-utility-pop [data-slot="actions"]');
    if (!slot || slot.querySelector("[data-tools-mode]")) return !!slot;
    const item = document.createElement("a");
    item.className = "nt-utility-item";
    item.setAttribute("data-tools-mode", "");
    const u = new URL(window.location.href);
    u.searchParams.set("mode", "tools");
    item.href = u.pathname + u.search;
    item.innerHTML = '<span aria-hidden="true">🧰</span><span>Interactive Tools</span>';
    slot.appendChild(item);
    return true;
  };
  // The utility menu mounts only after the student passes the identity gate, so
  // watch the document and add our item the moment its actions slot appears.
  if (tryMount()) return;
  if (typeof MutationObserver === "undefined") return; // non-DOM/SSR env
  const obs = new MutationObserver(() => {
    if (tryMount()) obs.disconnect();
  });
  obs.observe(document.body, { childList: true, subtree: true });
  // Renderers without a utility menu (e.g. small groups) never surface the slot,
  // so stop watching after a grace period rather than observing the DOM forever.
  setTimeout(() => obs.disconnect(), 20000);
}
