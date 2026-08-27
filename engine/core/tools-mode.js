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

import { getPreferredLang } from "./i18n.js";
import { interactiveVisualHost, mountInteractiveVisuals } from "./interactive-visual.js";
import { resolveStandard } from "./small-group-standards.js";
import { SECTION_LABEL, toolMeta } from "./tool-catalog.js";

// Sections whose visual slots hold genuine lesson manipulatives, in the order we
// want them to appear on the tools page (hands-on practice first, hook last).
const SECTION_ORDER = ["explore", "practice", "connect", "launch", "reflect"];
// Keys within a section that can carry an interactive-visual block (a single
// object or an array of them).
const VISUAL_KEYS = ["diagram", "visual", "simulator", "lab"];

function titleCase(slug) {
  return String(slug || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * True when the student has the Spanish lane on.
 *
 * This used to check two keys, because the lesson engine wrote `nt-lang` while
 * the small-group studio wrote its own `nt-sg-lang`, and a tools page reached
 * from either had to honour both. That fallback was a symptom: the two
 * surfaces disagreed about the student's own language. The studio now writes
 * the shared preference, so there is one key and one answer. (i18n.js adopts
 * any lingering legacy value on load, so devices set in the old studio keep
 * their Spanish.)
 */
function esOn() {
  try {
    return getPreferredLang() === "es";
  } catch {
    return false;
  }
}

// Bilingual line: English always, Spanish stacked beneath when the lane is on.
// Mirrors the family-homework / small-group `bi()` convention.
function bi(en, es) {
  return es && esOn() ? `${esc(en)}<span class="nt-es" lang="es">${esc(es)}</span>` : esc(en);
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
/* The tool IS the page here — ?mode=tools exists to give a manipulative the whole
 * screen, so the container tracks the viewport instead of sitting at a reading
 * width. 1100px was a prose measure inherited from the lesson body. */
.nt-tools { max-width: min(1480px, 96vw); margin: 0 auto; padding: clamp(16px, 4vw, 40px) 18px 72px; }
.nt-tools-head { margin-bottom: clamp(18px, 3vw, 28px); }
.nt-tools-eyebrow { font: 700 13px/1.2 var(--font-ui, system-ui, sans-serif); letter-spacing: .12em; text-transform: uppercase; color: var(--accent, #0d7a76); margin: 0 0 6px; }
.nt-tools-title { font: 800 clamp(26px, 5vw, 40px)/1.1 var(--font-display, "Outfit", system-ui, sans-serif); color: var(--ink, #12355b); margin: 0 0 8px; }
.nt-tools-sub { font: 400 clamp(15px, 2.4vw, 18px)/1.5 var(--font-body, "Hanken Grotesk", system-ui, sans-serif); color: var(--muted, #5f6f80); max-width: 62ch; margin: 0; }
.nt-tools-nav { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.nt-tools-nav a { display: inline-flex; align-items: center; gap: 6px; font: 600 15px/1 var(--font-ui, system-ui, sans-serif); text-decoration: none; padding: 10px 16px; border-radius: 999px; border: 1px solid #d7e2ed; color: var(--ink, #12355b); background: #fff; transition: background .15s ease, border-color .15s ease; }
.nt-tools-nav a:hover { background: #f2f7fb; border-color: #b9cee0; }
.nt-tools-nav a.primary { background: var(--accent, #0d7a76); border-color: var(--accent, #0d7a76); color: #fff; }
.nt-tools-nav a.primary:hover { filter: brightness(.95); }
/* One tool per row, full width.
 *
 * This was "auto-fill, minmax(320px, 1fr)", and both halves worked against the
 * page. "auto-fill" MATERIALISES EMPTY TRACKS, so a lesson with one tool laid it
 * out at 320px and left two-thirds of the container blank; "auto-fit" collapses
 * them. And 320px is a card measure, not a workspace: lesson 2-7 carries three
 * long-division labs, so an 1100px container cut each to ~340px — a full long
 * division tableau, its DMSB cycle controls, the dividend/divisor inputs and the
 * step narration, all inside a phone-width column on a desktop screen, which is
 * what a teacher reported.
 *
 * The floor is now a workspace width, so these stack one per row and each gets
 * the full container. "min(100%, 760px)" keeps the floor from exceeding the
 * viewport on a phone — a bare 760px minimum would force a track wider than the
 * screen and overflow horizontally, which is the usual way this pattern breaks.
 * Above ~1520px two genuinely narrow tools can still pair up. */
.nt-tools-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 760px), 1fr)); gap: clamp(16px, 2.4vw, 24px); margin-top: clamp(20px, 3vw, 30px); }
/* Centre a fixed-width manipulative without shrinking a fluid one: the host
 * fills the card, and only its children are centred. */
.nt-tool-host { width: 100%; }
.nt-tool-host > * { margin-inline: auto; }
/* On this page the manipulative has the whole screen, so the notation itself
 * scales up with it. The long-division board is 2.4rem where it sits inside a
 * lesson beside prose; at a metre from a projector, in a room, that is the
 * element everyone is reading, and it was rendering the same size in a
 * container five times wider. Scoped to .nt-tool-host so the in-lesson and
 * small-group renderings are untouched. The clamp floor is the existing size,
 * so this can only grow the board, and the board keeps its own overflow-x. */
.nt-tool-host .ldl-board { font-size: clamp(2.4rem, 4vw, 4.4rem); padding: clamp(22px, 2.6vw, 34px) clamp(30px, 3.4vw, 50px); }
.nt-tool-card { background: #fff; border: 1px solid #e2ebf3; border-radius: 18px; padding: clamp(14px, 2.4vw, 22px); box-shadow: 0 1px 2px rgba(18,53,91,.05), 0 8px 24px rgba(18,53,91,.05); overflow-x: auto; scroll-margin-top: 16px; }
.nt-tool-card > h2 { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; font: 700 19px/1.2 var(--font-display, "Outfit", system-ui, sans-serif); color: var(--ink, #12355b); margin: 0 0 6px; }
.nt-tool-card .nt-tool-tag { font: 600 11px/1 var(--font-ui, system-ui, sans-serif); letter-spacing: .08em; text-transform: uppercase; color: var(--accent, #0d7a76); background: #e7f4f2; padding: 4px 8px; border-radius: 6px; }
.nt-tools-empty { margin-top: 30px; padding: 28px; border: 1px dashed #cdd9e5; border-radius: 16px; color: #5f6f80; font: 400 16px/1.5 var(--font-body, system-ui, sans-serif); text-align: center; }
/* ── Publisher layer: purpose, how-to, try-this, per-card actions ─────────── */
.nt-es { display: block; font-style: italic; color: #5f6f80; }
.nt-tool-instance { font: 500 14px/1.45 var(--font-body, system-ui, sans-serif); color: #5f6f80; margin: 0 0 8px; }
.nt-tool-purpose { font: 400 15px/1.5 var(--font-body, system-ui, sans-serif); color: var(--ink, #12355b); margin: 0 0 12px; max-width: 60ch; }
.nt-tool-guide { margin: 0 0 12px; border: 1px solid #dbe6f0; border-radius: 12px; background: #fbfdff; }
.nt-tool-guide > summary { cursor: pointer; list-style: none; padding: 9px 14px; font: 600 14px/1.2 var(--font-ui, system-ui, sans-serif); color: var(--ink, #12355b); user-select: none; display: flex; align-items: center; gap: 8px; }
.nt-tool-guide > summary::-webkit-details-marker { display: none; }
/* Explicit caret: the native marker is off (it renders differently per browser),
   so the row needs its own visible "this opens" affordance. */
.nt-tool-guide > summary::after { content: "▸"; margin-left: auto; color: var(--accent, #0d7a76); transition: transform .15s ease; }
.nt-tool-guide[open] > summary::after { transform: rotate(90deg); }
.nt-tool-guide[open] > summary { border-bottom: 1px solid #dbe6f0; }
.nt-tool-guide .nt-guide-body { padding: 10px 16px 14px; }
.nt-tool-guide ol { margin: 0; padding-left: 20px; font: 400 15px/1.55 var(--font-body, system-ui, sans-serif); color: var(--ink, #12355b); }
.nt-tool-guide ol li + li { margin-top: 4px; }
.nt-try { margin: 0 0 14px; padding: 10px 14px; border-left: 3px solid var(--accent, #0d7a76); background: #f4faf9; border-radius: 0 10px 10px 0; }
.nt-try-label { font: 700 11px/1 var(--font-ui, system-ui, sans-serif); letter-spacing: .1em; text-transform: uppercase; color: var(--accent, #0d7a76); display: block; margin-bottom: 6px; }
.nt-try ul { margin: 0; padding-left: 18px; font: 400 15px/1.5 var(--font-body, system-ui, sans-serif); color: var(--ink, #12355b); }
.nt-try ul li + li { margin-top: 3px; }
.nt-tool-foot { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.nt-tool-foot button { font: 600 13px/1 var(--font-ui, system-ui, sans-serif); padding: 8px 14px; border-radius: 999px; cursor: pointer; border: 1px solid #cdd9e5; background: #fff; color: var(--ink, #12355b); }
.nt-tool-foot button:hover { background: #eef4f9; }
.nt-tools-objective { margin: 14px 0 0; padding: 12px 16px; border-radius: 12px; background: #f4faf9; border: 1px solid #d8ece9; font: 400 15px/1.5 var(--font-body, system-ui, sans-serif); color: var(--ink, #12355b); max-width: 70ch; }
.nt-tools-objective b { font-weight: 600; }
.nt-tools-standard { margin: 8px 0 0; font: 400 14px/1.5 var(--font-body, system-ui, sans-serif); color: #5f6f80; max-width: 70ch; }
.nt-tools-jump { margin-top: 18px; }
.nt-tools-jump h2 { font: 700 12px/1 var(--font-ui, system-ui, sans-serif); letter-spacing: .1em; text-transform: uppercase; color: #5f6f80; margin: 0 0 8px; }
.nt-tools-jump ul { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; }
.nt-tools-jump a { display: inline-flex; align-items: center; gap: 6px; font: 600 14px/1 var(--font-ui, system-ui, sans-serif); text-decoration: none; padding: 9px 14px; border-radius: 999px; border: 1px solid #d7e2ed; color: var(--ink, #12355b); background: #fff; }
.nt-tools-jump a:hover { background: #f2f7fb; border-color: #b9cee0; }
.nt-tools-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.nt-tools-actions button { font: 600 13px/1 var(--font-ui, system-ui, sans-serif); padding: 8px 14px; border-radius: 999px; cursor: pointer; border: 1px solid #d7e2ed; background: #fff; color: var(--ink, #12355b); }
.nt-tools-actions button:hover { background: #f2f7fb; border-color: #b9cee0; }
.nt-tools-toast { position: fixed; inset-inline: 0; bottom: 18px; margin: 0 auto; width: max-content; max-width: 90vw; background: var(--ink, #12355b); color: #fff; font: 600 14px/1.3 var(--font-ui, system-ui, sans-serif); padding: 10px 18px; border-radius: 999px; box-shadow: 0 8px 24px rgba(18,53,91,.25); z-index: 50; }
.nt-tools :focus-visible { outline: 3px solid var(--accent, #0d7a76); outline-offset: 2px; border-radius: 4px; }
/* Print: the widget and its guidance, none of the editing chrome. */
@media print {
  .nt-theme-row, .nt-tools-jump, .nt-tools-actions, .nt-tool-edit, .nt-tool-foot, .nt-tools-toast { display: none !important; }
  .nt-tool-card { break-inside: avoid; box-shadow: none; border-color: #b9cee0; }
  .nt-tools-grid { grid-template-columns: 1fr; }
  .nt-tool-guide { border-color: #b9cee0; }
  .nt-tool-guide > summary { font-weight: 600; }
}
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
body.nt-tools-dark .nt-es { color: #9fb0c0; }
body.nt-tools-dark .nt-tool-instance { color: #9fb0c0; }
body.nt-tools-dark .nt-tool-purpose { color: #dce6ef; }
body.nt-tools-dark .nt-tool-guide { background: #131c25; border-color: #2b3a47; }
body.nt-tools-dark .nt-tool-guide > summary { color: #eef3f8; }
body.nt-tools-dark .nt-tool-guide[open] > summary { border-color: #2b3a47; }
body.nt-tools-dark .nt-tool-guide ol { color: #dce6ef; }
body.nt-tools-dark .nt-try { background: #13232a; }
body.nt-tools-dark .nt-try ul { color: #dce6ef; }
body.nt-tools-dark .nt-tool-foot button,
body.nt-tools-dark .nt-tools-actions button,
body.nt-tools-dark .nt-tools-jump a { background: #16202b; border-color: #2b3a47; color: #eef3f8; }
body.nt-tools-dark .nt-tool-foot button:hover,
body.nt-tools-dark .nt-tools-actions button:hover,
body.nt-tools-dark .nt-tools-jump a:hover { background: #1c2833; }
body.nt-tools-dark .nt-tools-jump h2 { color: #9fb0c0; }
body.nt-tools-dark .nt-tools-objective { background: #13232a; border-color: #2b3a47; color: #dce6ef; }
body.nt-tools-dark .nt-tools-standard { color: #9fb0c0; }
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

let cardSeq = 0;

/**
 * Build one publisher-grade tool card.
 *
 * Structure, in the order a student needs it: what the tool IS (canonical name +
 * where the lesson uses it), what it is FOR (one-line purpose), HOW to work it
 * (collapsed steps), something to TRY, the teacher's number editor, then the
 * live widget. The old card was a bare heading over a widget — a student who
 * arrived cold had nothing telling them what to do with it, which is precisely
 * the "not publisher-ready" gap.
 *
 * @param {{v: object, section: string}} tool authored block + its lesson section
 * @param {{ seed?: Record<string, unknown>|null, onNumbers?: ((values: Record<string, unknown>|null) => void)|null, showTry?: boolean, showEditor?: boolean }} [opts]
 *   `seed` restores previously applied numbers (share link / this device);
 *   `onNumbers` reports applied values (null on reset) so a surface can persist
 *   them; `showTry`/`showEditor` let a compact surface drop those blocks.
 */
export function buildToolCard({ v, section }, opts = {}) {
  const { seed = null, onNumbers = null, showTry = true, showEditor = true } = opts;
  // The card's stylesheet lives in this module, and callers outside the tools page
  // (the in-lesson drawer) never run renderToolsPage — so ensure it here rather
  // than shipping unstyled cards into a dialog. Idempotent.
  ensureStyles();
  const meta = toolMeta(v);
  const card = document.createElement("section");
  card.className = "nt-tool-card";
  const headingId = `nt-tool-h-${++cardSeq}`;
  card.setAttribute("aria-labelledby", headingId);

  const h2 = document.createElement("h2");
  h2.id = headingId;
  const phase = SECTION_LABEL[section] || titleCase(section);
  h2.innerHTML = `<span>${bi(meta.name, meta.nameEs)}</span><span class="nt-tool-tag">${esc(phase)}</span>`;
  card.appendChild(h2);

  // What this lesson set the tool up to do (the authored config title), kept as
  // a subtitle so the canonical tool name can own the heading.
  if (meta.instance) {
    const instance = document.createElement("p");
    instance.className = "nt-tool-instance";
    instance.textContent = `In this lesson: ${meta.instance}`;
    card.appendChild(instance);
  }

  if (meta.purpose) {
    const purpose = document.createElement("p");
    purpose.className = "nt-tool-purpose";
    purpose.innerHTML = bi(meta.purpose, meta.purposeEs);
    card.appendChild(purpose);
  }

  if (meta.howTo.length) {
    const guide = document.createElement("details");
    guide.className = "nt-tool-guide";
    const gs = document.createElement("summary");
    gs.textContent = "🧭 How to use it";
    const body = document.createElement("div");
    body.className = "nt-guide-body";
    const ol = document.createElement("ol");
    for (const step of meta.howTo) {
      const li = document.createElement("li");
      li.textContent = step;
      ol.appendChild(li);
    }
    body.appendChild(ol);
    guide.append(gs, body);
    card.appendChild(guide);
  }

  if (showTry && meta.tryThis.length) {
    const tryBox = document.createElement("div");
    tryBox.className = "nt-try";
    const label = document.createElement("span");
    label.className = "nt-try-label";
    label.textContent = "Try this";
    const ul = document.createElement("ul");
    for (const prompt of meta.tryThis) {
      const li = document.createElement("li");
      li.textContent = prompt;
      ul.appendChild(li);
    }
    tryBox.append(label, ul);
    card.appendChild(tryBox);
  }

  const host = document.createElement("div");
  host.className = "nt-tool-host";
  let current = clone(v);
  const remount = () => {
    host.innerHTML = interactiveVisualHost(current, {
      ariaLabel: `${meta.name} interactive tool`,
    });
    mountInteractiveVisuals(host);
  };

  const fields = showEditor ? editableFields(v) : [];
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

    // Restore numbers this device (or a shared link) applied earlier, keyed by
    // the field's stable label. The fields come from the same config every time,
    // so labels are a durable key and survive a field-order change.
    const applyValues = (values, { live = true } = {}) => {
      const next = clone(v);
      let touched = false;
      for (const { f, inp } of inputs) {
        if (!Object.hasOwn(values, f.label)) continue;
        inp.value = String(values[f.label]);
        const val = readField(f, inp);
        if (val === null) continue;
        if (f.set) f.set(next, val);
        else setPath(next, f.path, val);
        touched = true;
      }
      if (!touched) return false;
      delete next.presets;
      current = next;
      // The initial mount happens once at the end of this function, so a seeded
      // restore only needs to swap `current` — remounting here would render the
      // widget twice on first paint.
      if (live) remount();
      return true;
    };
    if (seed && typeof seed === "object") applyValues(seed, { live: false });

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
      const values = {};
      for (const { f, inp } of inputs) {
        const val = readField(f, inp);
        if (val === null) continue;
        if (f.set) f.set(next, val);
        else setPath(next, f.path, val);
        values[f.label] = inp.value;
      }
      // Several widgets (lcm-lab, step-solver, …) render presets[0] and IGNORE
      // the top-level scalars when a `presets` array is present. Drop it so the
      // teacher's edited numbers actually become the active problem.
      delete next.presets;
      current = next;
      remount();
      onNumbers?.(values);
    });
    reset.addEventListener("click", () => {
      current = clone(v);
      for (const { f, inp } of inputs) inp.value = String(f.value);
      remount();
      onNumbers?.(null);
    });
    card.appendChild(ed);
  }

  card.appendChild(host);

  // A "start over" that is about the WORK, not the numbers: a student who has
  // filled a factor tree or piled up dots needs one obvious way back to a blank
  // tool without reloading the page and losing the others.
  const foot = document.createElement("div");
  foot.className = "nt-tool-foot";
  const restart = document.createElement("button");
  restart.type = "button";
  restart.textContent = "↺ Start this tool over";
  restart.addEventListener("click", () => {
    remount();
    /** @type {HTMLElement} */ (host.querySelector("button, input, [tabindex]"))?.focus?.();
  });
  foot.appendChild(restart);
  card.appendChild(foot);

  remount();
  // Most widgets ship their own Clear / Start over control. Two of them side by
  // side is exactly the kind of seam a reviewer notices, so the card's generic
  // one removes itself as soon as the widget proves it already has one. Widgets
  // mount asynchronously (lazy import), hence the observer.
  const dropRedundantRestart = () => {
    const hasOwn = [...host.querySelectorAll("button")].some((b) =>
      /start over|reset|clear/i.test(b.textContent || ""),
    );
    if (hasOwn) foot.remove();
    return hasOwn;
  };
  if (!dropRedundantRestart() && typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(() => {
      if (dropRedundantRestart()) observer.disconnect();
    });
    observer.observe(host, { childList: true, subtree: true });
    // A widget that never renders a reset must not leave an observer running.
    // `unref` (Node only, a no-op in browsers) keeps this timer from holding the
    // event loop open when a test boots a card under JSDOM.
    // ?.unref?.() is a no-op in browsers; it exists so the same call is safe under Node.
    /** @type {any} */ (setTimeout(() => observer.disconnect(), 8000))?.unref?.();
  }
  return card;
}

// ── Saved / shared numbers ──────────────────────────────────────────────────
// Applied numbers persist per lesson on the device, and a teacher can hand out
// one link that opens the tools with THEIR numbers already in place. Both use the
// same shape: { "<tool index>": { "<field label>": "<input value>" } }.
const numsKey = (lessonId) => `nt-tools-nums:${lessonId || "lesson"}`;

function readSavedNums(lessonId) {
  try {
    const raw = window.localStorage.getItem(numsKey(lessonId));
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSavedNums(lessonId, all) {
  try {
    if (Object.keys(all).length) {
      window.localStorage.setItem(numsKey(lessonId), JSON.stringify(all));
    } else {
      window.localStorage.removeItem(numsKey(lessonId));
    }
  } catch {
    /* storage blocked — numbers just won't survive a reload */
  }
}

// URL-safe base64 of a JSON payload (and back). Only edited field VALUES travel,
// never the config, so the link stays short enough to paste into Canvas.
function encodeNums(all) {
  const json = JSON.stringify(all);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeNums(param) {
  if (!param) return null;
  try {
    const b64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const parsed = JSON.parse(decodeURIComponent(escape(atob(b64))));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** A brief, polite confirmation for copy/print actions. */
function toast(message) {
  const existing = document.querySelector(".nt-tools-toast");
  existing?.remove();
  const node = document.createElement("div");
  node.className = "nt-tools-toast";
  node.setAttribute("role", "status");
  node.textContent = message;
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), 2600);
}

/**
 * Render the standalone Interactive Tools page for `config` into `root`,
 * replacing whatever it held.
 *
 * Publisher layer, beyond the live widgets: the lesson's goal and its standard in
 * full wording, a jump list, per-tool purpose / how-to / try-this (from
 * tool-catalog.js), applied numbers that survive a reload, a shareable link that
 * carries those numbers, and a print path.
 *
 * No links to other lessons — safe to post to students on its own.
 */
/**
 * ONE CARD PER TOOL KIND. `collectTools` keys its dedupe on the whole config
 * object, so a lesson that authors the same model three times with different
 * numbers — 2-7 mounts the long-division builder three times, 3-7 the ratio
 * table four — put three or four identical widgets on this page, one under the
 * other (Joel, 2026-08-26: "stuff like this should only have one on the
 * screen"). Every one of these tools has a "Change the numbers" control, so the
 * second copy adds nothing a student cannot do in the first. 46 of the 84 core
 * lessons repeat at least one kind.
 *
 * The FIRST instance wins, which is the one the lesson introduces the model
 * with, so the numbers a student lands on are the numbers they were taught.
 */
function oneCardPerKind(tools) {
  const seen = new Set();
  return tools.filter(({ v }) => {
    const kind = String(v && v.kind);
    if (seen.has(kind)) return false;
    seen.add(kind);
    return true;
  });
}

export function renderToolsPage(config, root) {
  if (!root) return;
  ensureStyles();
  document.body.classList.add("nt-tools-mode");
  const tools = oneCardPerKind(collectTools(config));
  const title = config?.title || "This Lesson";
  const lessonId = String(config?.lessonId || "");
  const lessonNo = lessonId ? `Lesson ${lessonId}` : "";
  if (document.title) document.title = `Interactive Tools · ${title}`;

  // Every lesson config carries a contentObjective; the fallbacks cover any
  // hand-authored config that predates that field.
  const objective = String(
    config?.contentObjective || config?.objective || config?.goal || "",
  ).trim();

  root.innerHTML = `<main class="nt-tools">
    <header class="nt-tools-head">
      <div class="nt-theme-row">
        <div class="nt-tools-actions">
          <button type="button" class="nt-tools-print">🖨 Print</button>
          <button type="button" class="nt-tools-share">🔗 Copy link with these numbers</button>
        </div>
        <button type="button" class="nt-theme-toggle" id="nt-theme-toggle" aria-pressed="false"></button>
      </div>
      <p class="nt-tools-eyebrow">${esc(lessonNo)} · Interactive Tools</p>
      <h1 class="nt-tools-title">${esc(title)}</h1>
      <p class="nt-tools-sub">${bi(
        "Keep practicing with the hands-on models from this lesson. Use “Change the numbers” to build your own examples — nothing here is graded.",
        "Sigue practicando con los modelos de esta lección. Usa “Cambiar los números” para crear tus propios ejemplos: nada aquí se califica.",
      )}</p>
      ${
        objective
          ? `<p class="nt-tools-objective"><b>${esc("Today's goal:")}</b> ${esc(objective)}</p>`
          : ""
      }
      ${config?.standard ? `<p class="nt-tools-standard">📐 ${esc(config.standard)}</p>` : ""}
      <nav class="nt-tools-jump" aria-label="Tools on this page" hidden>
        <h2>On this page</h2>
        <ul></ul>
      </nav>
    </header>
    <div class="nt-tools-grid"></div>
    <div class="nt-tools-empty" hidden>This lesson doesn't have standalone interactive tools yet.</div>
  </main>`;

  setupThemeToggle();
  root.querySelector(".nt-tools-print")?.addEventListener("click", () => window.print());
  // Standards display: show what the code MEANS, not just the badge. Best-effort
  // — a failed registry fetch leaves the code-only line already rendered.
  if (config?.standard) {
    resolveStandard(config.standard)
      .then((entry) => {
        const line = root.querySelector(".nt-tools-standard");
        if (!entry || !line) return;
        line.innerHTML = `📐 <b>${esc(entry.code)}${entry.shortLabel ? ` · ${esc(entry.shortLabel)}` : ""}:</b> ${esc(entry.fullText)}`;
      })
      .catch(() => {});
  }

  const grid = root.querySelector(".nt-tools-grid");
  if (!tools.length) {
    root.querySelector(".nt-tools-empty").hidden = false;
    grid.hidden = true;
    // Nothing to print or share — leave no buttons that would do nothing.
    root.querySelector(".nt-tools-actions")?.remove();
    return;
  }

  // A shared link wins over this device's saved numbers: the teacher who sent it
  // meant those numbers for this session.
  let shared = null;
  try {
    shared = decodeNums(new URLSearchParams(window.location.search).get("nums"));
  } catch {
    shared = null;
  }
  const saved = shared || readSavedNums(lessonId);
  const applied = { ...saved };

  const jump = root.querySelector(".nt-tools-jump");
  const jumpList = jump.querySelector("ul");
  // A lesson can use the same tool twice with different numbers (a factor tree for
  // 84 in Practice and for 72 in Connect). Two identical jump-list entries are
  // useless, so repeated names carry what makes each one different.
  const nameCounts = tools.reduce((counts, t) => {
    const name = toolMeta(t.v).name;
    counts.set(name, (counts.get(name) || 0) + 1);
    return counts;
  }, new Map());
  tools.forEach((t, index) => {
    const card = buildToolCard(t, {
      seed: saved[String(index)] || null,
      onNumbers: (values) => {
        if (values && Object.keys(values).length) applied[String(index)] = values;
        else delete applied[String(index)];
        writeSavedNums(lessonId, applied);
      },
    });
    card.id = `nt-tool-${index + 1}`;
    grid.appendChild(card);

    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#nt-tool-${index + 1}`;
    const meta = toolMeta(t.v);
    const qualifier = meta.instance || SECTION_LABEL[t.section] || t.section;
    link.textContent = nameCounts.get(meta.name) > 1 ? `${meta.name} · ${qualifier}` : meta.name;
    li.appendChild(link);
    jumpList.appendChild(li);
  });
  // One tool needs no table of contents.
  jump.hidden = tools.length < 2;

  // Print must show the collapsed guidance, then restore the screen state.
  const openedForPrint = new Set();
  window.addEventListener("beforeprint", () => {
    for (const details of root.querySelectorAll("details:not([open])")) {
      details.open = true;
      openedForPrint.add(details);
    }
  });
  window.addEventListener("afterprint", () => {
    for (const details of openedForPrint) details.open = false;
    openedForPrint.clear();
  });

  // Share the numbers actually applied, resolved at click time.
  root.querySelector(".nt-tools-share")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const url = new URL(window.location.href);
    if (Object.keys(applied).length) url.searchParams.set("nums", encodeNums(applied));
    else url.searchParams.delete("nums");
    const link = url.toString();
    try {
      await navigator.clipboard.writeText(link);
      toast("Link copied — it opens these tools with these numbers.");
    } catch {
      // Clipboard blocked (insecure context / permission): show the link so the
      // teacher can still copy it by hand rather than getting a dead button.
      button.insertAdjacentHTML(
        "afterend",
        `<input class="nt-share-fallback" readonly value="${esc(link)}" style="min-width:min(420px,60vw)" aria-label="Shareable link">`,
      );
      button.nextElementSibling?.select?.();
    }
  });
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

// Teacher-mode read, done locally: importing teacher-mode.js here would pull
// lesson-renderer.js (and with it the engine's CSS imports) into every module
// that touches the tools page, including the node test harness.
function teacherModeOn() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("teacher") === "0" || params.get("student") === "1") return false;
    return localStorage.getItem("nt-teacher-mode") === "1";
  } catch (_e) {
    return false;
  }
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
    // Open in its own window: the tools page is a full takeover, and losing the
    // lesson screen mid-class (scroll position, current phase, unsaved work on
    // screen) is exactly what teachers do not want it to do.
    item.target = "_blank";
    item.rel = "noopener";
    item.innerHTML =
      '<span aria-hidden="true">🧰</span><span>Interactive Tools</span><span aria-hidden="true">↗</span>';
    // Teacher-only. Checked at PAINT time, not mount time: the menu mounts
    // before the identity gate is passed and teacher mode can be unlocked at any
    // point after, so a one-shot check at boot would hide it from a teacher who
    // signed in a second later (and is how "Clear all answers" is gated too).
    const paint = () => {
      item.style.display = teacherModeOn() ? "" : "none";
    };
    paint();
    window.addEventListener("storage", (e) => {
      if (!e.key || e.key === "nt-teacher-mode") paint();
    });
    setTimeout(paint, 1500);
    setTimeout(paint, 4000);
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
