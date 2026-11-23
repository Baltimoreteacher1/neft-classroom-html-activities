// Vocabulary Academy print: pure renderers (SPEC section 10). One unit JSON in, US-Letter print HTML out, no DOM.
//
//   buildContext(unit, kind, { reviewWords, supports })  -> the context every sheet reads
//   renderSheets(kind, ctx)                              -> [html value]
//   renderBody(unit, kind, opts)                         -> { html, ctx, count }   (string of <section class="vap-sheet">)
//   pageCss(unit, kind)                                  -> the @page rules (running header and footer) as text
//   documentShell({ title, lang, css, fontCss, body, band }) -> a complete standalone HTML document string
//
// Student kinds are rendered ONLY from studentSafe(unit) and key-stripped derived items (project.js); the full unit is
// used just to derive items, and every answer lives under a `key` property that stripKeys removes.
import { buildAssessmentForms } from "./assess.js";
import { buildUnitItems } from "./items.js";
import {
  buildReviewItems,
  assessmentSheets,
  keySheets,
  reviewSheets,
  wordsSheets,
} from "./packets.js";
import { stripKeys, studentSafe } from "./project.js";
import {
  bandInfo,
  isTeacherKind,
  KIND_TITLE,
  parseSupports,
  runningHeader,
  toHtml,
} from "./shared.js";
import { cover, exercises, wordList, worked } from "./sheets-a.js";
import { extended, morphology, reading, relations, review, show, writing } from "./sheets-b.js";
import { teacherFront } from "./educator.js";

export { KIND_TITLE, isTeacherKind, parseSupports, runningHeader };

const workbookSheets = (c) =>
  [
    cover,
    wordList,
    worked,
    exercises,
    relations,
    morphology,
    reading,
    writing,
    extended,
    review,
    show,
  ]
    .map((fn) => fn(c))
    .filter(Boolean);

const BUILDERS = {
  workbook: workbookSheets,
  teacher: (c) => [...teacherFront(c), ...workbookSheets(c)],
  review: reviewSheets,
  assessment: assessmentSheets,
  "assessment-key": keySheets,
  words: wordsSheets,
};

/** The word records a review packet needs: the unit's `review` ids, resolved by the caller (view: data.getWords). */
const reviewable = (words) => (words ?? []).filter((w) => w?.def && w.hw);

/**
 * Everything a sheet reads. `unit` is the FULL unit as authored. For a student kind the context carries only the
 * student-safe projection and key-less derived data; for a teacher kind it carries everything, with answers.
 */
export function buildContext(unit, kind, { reviewWords = [], supports = {} } = {}) {
  if (!BUILDERS[kind]) throw new Error(`Unknown print kind: ${kind}`);
  const teacher = isTeacherKind(kind);
  const info = bandInfo(unit.grade);
  const flags =
    typeof supports === "object" && !Array.isArray(supports)
      ? { ...parseSupports([]), ...supports }
      : parseSupports(supports);
  const items = buildUnitItems(unit);
  const forms = buildAssessmentForms(unit);
  const earlier = reviewable(reviewWords);
  const review = buildReviewItems(unit, earlier, items);
  if (teacher) return { unit, items, forms, review, teacher, info, supports: flags, kind };
  // Student: the word records of earlier units are reduced to what a student may see; everything else loses its keys.
  const safeReview = stripKeys({
    ...review,
    earlier: review.earlier.map((w) => ({ id: w.id, hw: w.hw, pos: w.pos })),
  });
  return {
    unit: studentSafe(unit),
    items: stripKeys(items),
    forms: stripKeys(forms),
    review: safeReview,
    teacher,
    info,
    supports: flags,
    kind,
  };
}

export const renderSheets = (kind, ctx) => BUILDERS[kind](ctx);

/** The unit's printable body as an HTML string, one `<section class="vap-sheet">` per designed sheet. */
export function renderBody(unit, kind, opts = {}) {
  const ctx = buildContext(unit, kind, opts);
  const sheets = renderSheets(kind, ctx);
  return { html: sheets.map((s) => toHtml(s)).join("\n"), ctx, count: sheets.length };
}

// ---- page setup ---------------------------------------------------------------------------------------------------
const cssString = (text) =>
  `"${String(text).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/</g, "\\3c ").replace(/\r?\n/g, " ")}"`;

/**
 * The @page rules. They are NOT in the static stylesheet: a stylesheet stays in the document after you leave the print
 * route, and an @page rule left behind would put this header on every other page you print from the lab. The view
 * injects this text on mount and removes it on unmount; the PDF generator inlines it.
 */
export function pageCss(unit, kind, { name = "" } = {}) {
  const header = cssString(runningHeader(unit));
  const student = !isTeacherKind(kind) && kind !== "words";
  const left = student
    ? cssString("Name ______________________   Date ____________")
    : cssString(isTeacherKind(kind) ? "Teacher materials. Do not hand out." : "Vocabulary Academy");
  const selector = name ? `@page ${name}` : "@page";
  const first = name ? `@page ${name}:first` : "@page :first";
  return `${selector} {
  size: 8.5in 11in;
  margin: 0.75in;
  @top-left { content: ${header}; font: 11pt/1.2 "Atkinson Hyperlegible", system-ui, sans-serif; color: #3b4a56; vertical-align: bottom; padding-bottom: 0.12in; }
  @bottom-left { content: ${left}; font: 11pt/1.2 "Atkinson Hyperlegible", system-ui, sans-serif; color: #3b4a56; vertical-align: top; padding-top: 0.12in; }
  @bottom-right { content: "Page " counter(page); font: 11pt/1.2 "Atkinson Hyperlegible", system-ui, sans-serif; color: #3b4a56; vertical-align: top; padding-top: 0.12in; }
}
${first} { @top-left { content: none; } }
`;
}

/** A complete standalone document: used by the PDF generator and by anything that wants the page outside the app. */
export function documentShell({
  title,
  lang = "en",
  css = "",
  fontCss = "",
  body,
  band = "middle",
  extraCss = "",
}) {
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>${toHtml(title)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${fontCss}</style>
<style>${css}</style>
<style>${extraCss}</style>
</head>
<body class="vap-standalone">
<main class="vap-doc" data-band="${band}" lang="${lang}" aria-label="${toHtml(title)}">
${body}
</main>
</body>
</html>`;
}

export const documentTitle = (unit, kind) => `${runningHeader(unit)} · ${KIND_TITLE[kind] ?? kind}`;

// ---- the leak check (used by the tests, the generator and the validator) -------------------------------------------
import { forbiddenStrings } from "./project.js";

const plainText = (markup) =>
  String(markup)
    .replace(/<[^>]+>/g, " ")
    .replace(
      /&(amp|lt|gt|quot|#39);/g,
      (_m, e) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[e],
    )
    .replace(/\s+/g, " ");

/**
 * Teacher-only or answer-key strings that appear in `markup`. A student page must return an empty list.
 * Checked against the visible text AND the raw markup (an aria-label or attribute is also a leak).
 */
export function findLeaks(unit, markup) {
  const text = plainText(markup).toLowerCase();
  const rawLower = String(markup).toLowerCase();
  const norm = (s) => s.replace(/\s+/g, " ").trim().toLowerCase();
  // An answer explanation or model often quotes a sentence that is ALSO student-facing (a passage sentence, a word's
  // example). Showing that sentence is not a leak: the string counts only when it is not part of any student-safe string.
  const visible = [];
  const collect = (v) => {
    if (typeof v === "string") visible.push(norm(v));
    else if (Array.isArray(v)) v.forEach(collect);
    else if (v && typeof v === "object") Object.values(v).forEach(collect);
  };
  collect(studentSafe(unit));
  return forbiddenStrings(unit).filter((s) => {
    const n = norm(s);
    if (visible.some((v) => v.includes(n))) return false;
    return text.includes(n) || rawLower.includes(n);
  });
}
