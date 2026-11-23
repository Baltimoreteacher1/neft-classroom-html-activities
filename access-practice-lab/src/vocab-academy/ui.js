// Vocabulary Academy — small shared UI helpers for the Core views (labels, badges, progress, breadcrumbs).
// Markup helpers return html`` results. Plain strings for attributes come from I.S, markup from I.T.
import { crumbsHTML } from "../components.js";
import { announce, html, raw } from "../util.js";
import { SHIPPED_GRADES, STATES, STATE_LABEL, bandOfGrade } from "./contract.js";
import { gradeHref, isCustomId, lessonHref, unitHref, unitOfLesson, vaHref } from "./data.js";
import { setGrade } from "./model.js";

/** "Grade 6" / "Grado 6" / "Kindergarten" / "Kínder". */
export const gradeName = (I, g) =>
  g === "K" ? I.T("Kindergarten", "Kínder") : I.T(`Grade ${g}`, `Grado ${g}`);
export const gradeNameS = (I, g) =>
  g === "K" ? I.S("Kindergarten", "Kínder") : I.S(`Grade ${g}`, `Grado ${g}`);

/** Bands of this release (grades 9 to 12 are not built; contract.js SHIPPED_GRADES). */
export const BAND_ORDER = ["early", "upper-elem", "middle"];
export const gradesOfBand = (band) => SHIPPED_GRADES.filter((g) => bandOfGrade(g) === band);
export const BAND_NAME = {
  early: ["Kindergarten to Grade 2", "Kínder a 2.º grado"],
  "upper-elem": ["Grades 3 to 5", "Grados 3 a 5"],
  middle: ["Grades 6 to 8", "Grados 6 a 8"],
  high: ["Grades 9 to 12", "Grados 9 a 12"],
};
/** The data-va-band for the learner's own lab grade band (before they pick an Academy grade). */
export const bandOfLabBand = (labBand) =>
  ["K", "1", "2-3"].includes(labBand)
    ? "early"
    : labBand === "3-5"
      ? "upper-elem"
      : labBand === "6-8"
        ? "middle"
        : "";
export const bandFor = (grade, labBand) => (grade ? bandOfGrade(grade) : bandOfLabBand(labBand));

export const STRAND = {
  thematic: ["Theme", "Tema"],
  morphology: ["Word parts", "Partes de palabras"],
  disciplinary: ["Subject words", "Palabras de las materias"],
  literary: ["Literary words", "Palabras literarias"],
  rhetoric: ["Argument and rhetoric", "Argumentación y retórica"],
};

/** Distinct silhouettes so a state is never told by colour alone (the label always sits next to it). */
const SHAPES = {
  new: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  learning:
    '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M12 12V4a8 8 0 0 1 8 8z" fill="currentColor"/>',
  developing:
    '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
  applying:
    '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M12 12V4a8 8 0 1 1-8 8z" fill="currentColor"/>',
  secure:
    '<circle cx="12" cy="12" r="9" fill="currentColor"/><path d="m7.5 12.5 3 3 6-7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  "review-needed":
    '<path d="M12 2.5 21.5 12 12 21.5 2.5 12z" fill="currentColor"/><path d="M12 7.5v6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="16.6" r="1.5" fill="#fff"/>',
};
export const stateIcon = (state) =>
  raw(
    `<svg class="va-shape" data-state="${STATES.includes(state) ? state : "new"}" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">${SHAPES[state] || SHAPES.new}</svg>`,
  );
/** Icon shape + text label (+ optional count). */
export const stateBadge = (I, state, count) =>
  html`<span class="va-state" data-state="${state}"
    >${stateIcon(state)}<span class="va-state-label">${I.T(...STATE_LABEL[state])}</span
    >${count == null ? "" : html`<strong class="va-state-count">${count}</strong>`}</span
  >`;

/** A native <progress> with a visible fraction (works without colour, announced by screen readers). */
export const progressMeter = (I, done, total, label) =>
  html`<span class="va-meter"
    ><progress
      class="va-progress"
      max="${Math.max(1, total)}"
      value="${Math.min(done, Math.max(1, total))}"
      aria-label="${label}"
    >
      ${done}/${total}</progress
    ><span class="va-meter-text" aria-hidden="true">${done}/${total}</span></span
  >`;

export const crumbs = (I, items) => crumbsHTML(items, { i18n: I });
export const rootCrumb = (I) => [I.S("My Vocabulary", "Mi vocabulario"), vaHref()];
/** "Lesson 6" / "Lección 6", or "My word list" for a teacher's custom list. */
export const lessonLabel = (I, n) =>
  isCustomId(n) ? I.S("Custom word list", "Lista personalizada") : `${I.S("Lesson", "Lección")} ${n}`;
/**
 * Breadcrumbs down to a lesson: My Vocabulary › Grade Levels › Grade › Unit U › Lesson N. `count` is the number of
 * lessons in the grade (it decides the unit); without it, or for a custom list, the unit crumb is left out.
 * `here` true makes the lesson the current (unlinked) crumb.
 */
export function lessonTrail(I, g, n, count = 0, here = false) {
  const trail = [
    rootCrumb(I),
    [I.S("Grade Levels", "Niveles por grado"), vaHref("grades")],
    [gradeNameS(I, g), gradeHref(g)],
  ];
  if (count && !isCustomId(n)) {
    const u = unitOfLesson(n, count);
    trail.push([`${I.S("Unit", "Unidad")} ${u}`, unitHref(g, u)]);
  }
  trail.push([lessonLabel(I, n), here ? "" : lessonHref(g, n)]);
  return trail;
}

/** The designed unit cover, built in CSS from the unit's strand: a calm motif, the unit number, no text to translate. */
export const unitCover = (n, strand) =>
  html`<span
    class="va-cover"
    data-strand="${strand in STRAND ? strand : "thematic"}"
    data-tone="${Math.abs(Number(n) || 0) % 6}"
    aria-hidden="true"
    ><i></i><i></i><i></i><b class="va-cover-n">${n}</b></span
  >`;

/** Honest empty states. */
export const notPublishedPanel = (I, { title, text, href, label }) =>
  html`<section class="va-panel va-empty" aria-labelledby="vaEmptyTitle">
    <h1 id="vaEmptyTitle" tabindex="-1">${title}</h1>
    <p>${text}</p>
    ${href ? html`<p><a class="btn btn-primary va-btn" href="${href}">${label}</a></p>` : ""}
  </section>`;

/** Grades of the lab band a learner already chose, used only to mark "suggested" (never to restrict). */
export const suggestedGrades = (labBand) =>
  ({ K: ["K"], 1: ["1"], "2-3": ["2", "3"], "3-5": ["3", "4", "5"], "6-8": ["6", "7", "8"] })[labBand] || [];

/** Click handler shared by every page with a "make this my grade" control ([data-va-set-grade="6"]). */
export function onSetGrade(e, ctx, va) {
  const button = e.target.closest?.("[data-va-set-grade]");
  if (!button || !SHIPPED_GRADES.includes(button.dataset.vaSetGrade)) return false;
  setGrade(va.progress, button.dataset.vaSetGrade);
  va.save();
  announce(va.I.S(`Your grade is now ${gradeNameS(va.I, button.dataset.vaSetGrade)}.`, `Tu grado ahora es ${gradeNameS(va.I, button.dataset.vaSetGrade)}.`), { toast: false });
  ctx.rerender();
  return true;
}

/** A short, honest status pill: icon-free text, never colour alone. */
export const statusPill = (text, tone = "") =>
  html`<span class="va-pill" ${tone ? raw(`data-tone="${tone}"`) : ""}>${text}</span>`;

/** The part-of-speech label students see ("adj" → "adjective"). */
const POS_NAME = {
  n: ["noun", "sustantivo"],
  v: ["verb", "verbo"],
  adj: ["adjective", "adjetivo"],
  adv: ["adverb", "adverbio"],
  prep: ["preposition", "preposición"],
  conj: ["conjunction", "conjunción"],
  pron: ["pronoun", "pronombre"],
  phr: ["phrase", "frase"],
};
export const posName = (I, pos) => (POS_NAME[pos] ? I.T(...POS_NAME[pos]) : pos || "");
export const posNameS = (I, pos) => (POS_NAME[pos] ? I.S(...POS_NAME[pos]) : pos || "");
