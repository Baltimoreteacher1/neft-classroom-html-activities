// Layout levels for document fitting. A "fit" is a plain, JSON-safe options object:
//
//   { v, level, workspace, bodyPt, lineHeight, k, wsScale, ruleIn, marginIn, grid, columns, copies, large }
//
//   workspace  "normal" | "roomy"  the setting the print renderer already accepts (activity.options.workspace)
//   bodyPt     body text size in points (never below FLOORS.bodyPt; large print never below FLOORS.largePt)
//   k          spacing scale (1 = today's gaps), wsScale  work-box / answer-cell height scale
//   ruleIn     height of one ruled writing line, marginIn  page margin on the student sheet
//   grid       answer choices in two columns, columns  1 or 2 text columns, copies  0 | 1 half page | 2 per page
//
// Everything is applied through CSS variables and classes in print/css.js; no content is ever removed or reordered.

import { normalizeActivity } from "../core/schema.js";
import { fitCss } from "../print/css.js";
import { renderWorksheetParts } from "../print/worksheet.js";
import { tr } from "../print/strings.js";

/** The usability floors. Nothing in this module goes below them. */
export const FLOORS = Object.freeze({
  bodyPt: 11, // body text
  labelPt: 10, // labels and captions (the print sheet keeps them at 11)
  largePt: 14, // large print body text
  marginIn: 0.5,
  wsScale: 0.5, // a work box is never under about half an inch
  ruleIn: 0.28, // college-ruled spacing
});

const BASE = {
  v: 1,
  wsScale: 1,
  ruleIn: 0.36,
  marginIn: 0.75,
  grid: false,
  columns: 1,
  copies: 0,
  large: false,
};

/**
 * Generous to tight. "standard" is the sheet as it prints today (workspace follows the teacher's setting). The trim
 * steps give up the least useful things first: gaps and work-box height, then margins and two-column choices,
 * then a little text size, and never below the floors.
 */
const LEVELS = {
  airy: { bodyPt: 13, lineHeight: 1.5, k: 1.25, wsScale: 1.25, ruleIn: 0.4, workspace: "roomy" },
  standard: { bodyPt: 13, lineHeight: 1.45, k: 1 },
  trim1: { bodyPt: 13, lineHeight: 1.42, k: 0.85, wsScale: 0.9, ruleIn: 0.34, workspace: "normal" },
  trim2: { bodyPt: 13, lineHeight: 1.4, k: 0.7, wsScale: 0.75, ruleIn: 0.32, workspace: "normal" },
  trim3: { bodyPt: 13, lineHeight: 1.38, k: 0.7, wsScale: 0.75, ruleIn: 0.32, marginIn: 0.6, grid: true, workspace: "normal" },
  trim4: { bodyPt: 12.5, lineHeight: 1.35, k: 0.6, wsScale: 0.65, ruleIn: 0.3, marginIn: 0.5, grid: true, workspace: "normal" },
  trim5: { bodyPt: 12, lineHeight: 1.32, k: 0.5, wsScale: 0.6, ruleIn: 0.3, marginIn: 0.5, grid: true, workspace: "normal" },
  trim6: { bodyPt: 11.5, lineHeight: 1.3, k: 0.45, wsScale: 0.55, ruleIn: 0.29, marginIn: 0.5, grid: true, workspace: "normal" },
  trim7: { bodyPt: 11, lineHeight: 1.27, k: 0.4, wsScale: 0.5, ruleIn: 0.28, marginIn: 0.5, grid: true, workspace: "normal" },
  trim8: { bodyPt: 11, lineHeight: 1.27, k: 0.4, wsScale: 0.5, ruleIn: 0.28, marginIn: 0.5, grid: true, columns: 2, workspace: "normal" },
  // more room to write, at today's text size
  spacious: { bodyPt: 13, lineHeight: 1.45, k: 1.1, wsScale: 1.5, ruleIn: 0.42, workspace: "roomy" },
  generous: { bodyPt: 13, lineHeight: 1.45, k: 1.15, wsScale: 2, ruleIn: 0.48, workspace: "roomy" },
  large: { bodyPt: 16, lineHeight: 1.5, k: 1.2, wsScale: 1.3, ruleIn: 0.46, workspace: "roomy", large: true },
};

/** From most generous to tightest; fitting walks this list. */
export const LEVEL_ORDER = Object.freeze([
  "airy", "standard", "trim1", "trim2", "trim3", "trim4", "trim5", "trim6", "trim7", "trim8",
]);

const MAX_OPTION_CHARS = 34;
const WIDE_FORMATS = new Set([
  "match",
  "sort",
  "fillTable",
  "plot",
  "numberline",
  "hotspot",
  "order",
  "error",
]);
const WIDE_BLOCKS = new Set(["table", "organizer"]);

/** What this activity can safely do: two text columns need no wide figures; two-column choices need short choices. */
export function safeFor(activity) {
  const a = normalizeActivity(activity);
  const qs = a.blocks.filter((b) => b.type === "question");
  const columns =
    !qs.some((q) => WIDE_FORMATS.has(q.format)) && !a.blocks.some((b) => WIDE_BLOCKS.has(b.type));
  const short = (list) =>
    (list || []).every((o) => String(o.text ?? o ?? "").length <= MAX_OPTION_CHARS);
  const grid = qs.every((q) => short(q.options) && short(q.fixOptions));
  return { columns, grid };
}

/**
 * The options object for a named level, trimmed to what the sheet can do (`grid` only for short choices).
 * `extra` overrides any field after the level is applied (for example `{ columns: 2 }` or `{ marginIn: 0.5 }`).
 */
export function levelOptions(id, activity, extra = {}) {
  const a = normalizeActivity(activity);
  const def = LEVELS[id];
  if (!def) throw new Error(`unknown fit level: ${id}`);
  const safe = safeFor(a);
  const o = {
    ...BASE,
    ...def,
    level: id,
    workspace: def.workspace || a.options.workspace,
    ...extra,
  };
  if (!safe.grid) o.grid = false;
  if (!safe.columns) o.columns = 1;
  o.bodyPt = Math.max(o.large ? FLOORS.largePt : FLOORS.bodyPt, o.bodyPt);
  o.marginIn = Math.max(FLOORS.marginIn, o.marginIn);
  o.wsScale = Math.max(FLOORS.wsScale, o.wsScale);
  o.ruleIn = Math.max(FLOORS.ruleIn, o.ruleIn);
  return o;
}

export const activityWith = (activity, o) => {
  const a = normalizeActivity(activity);
  return {
    ...a,
    options: { ...a.options, workspace: o?.workspace === "roomy" ? "roomy" : "normal" },
  };
};

const closeTag = '<section class="sheet key"';

/** Split the printed body into the student half and the key half. */
function splitMain(html) {
  const start = html.indexOf("<main>") + "<main>".length;
  const end = html.lastIndexOf("</main>");
  const key = html.indexOf(closeTag);
  const mid = key >= 0 ? key : end;
  return { head: html.slice(0, start), student: html.slice(start, mid), rest: html.slice(mid) };
}

/** Rename every id (and the aria-labelledby that points at it) so a second copy of the sheet stays valid. */
const suffixIds = (markup, suffix) =>
  markup
    .replace(/ id="([^"]+)"/g, (_m, id) => ` id="${id}${suffix}"`)
    .replace(/ aria-labelledby="([^"]+)"/g, (_m, id) => ` aria-labelledby="${id}${suffix}"`);

/** Add the fit to a finished worksheet document. The student half only: the key is never touched or copied. */
export function applyFit(html, o, furniture) {
  const css = fitCss(o, furniture);
  let out = html.replace("</style>", `${css}\n</style>`);
  const classes = [
    o.grid && "fit-grid",
    o.columns === 2 && "fit-cols",
    o.copies && "fit-halves-body",
  ].filter(Boolean);
  if (classes.length)
    out = out.replace(
      /<body class="([^"]*)"/,
      (_m, c) => `<body class="${c} ${classes.join(" ")}"`,
    );
  if (o.copies) {
    const { head, student, rest } = splitMain(out);
    if (student.trim()) {
      const box = (m, suffix = "") =>
        `<div class="halfbox">${suffix ? suffixIds(m, suffix) : m}</div>`;
      const cut = '<div class="cutline" aria-hidden="true"></div>';
      const body =
        o.copies === 2 ? `${box(student)}${cut}${box(student, "-copy2")}` : `${box(student)}${cut}`;
      out = `${head}<div class="fit-halves">${body}</div>${rest}`;
    }
  }
  return out;
}

/** A worksheet document laid out with fit `o` (null prints it as it is). Same shape as renderWorksheetParts. */
export function renderFitted(activity, o, { part = "student", lang = "en", baseUrl } = {}) {
  const a = o ? activityWith(activity, o) : normalizeActivity(activity);
  const r = renderWorksheetParts(a, { part, lang, baseUrl });
  if (!o || part === "key") return r;
  const w = lang === "es" ? "es" : "en";
  return { ...r, html: applyFit(r.html, o, { pageWord: tr(w, "page"), ofWord: tr(w, "of") }) };
}
