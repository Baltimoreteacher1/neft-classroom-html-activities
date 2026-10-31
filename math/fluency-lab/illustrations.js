// Illustration library for the Fluency Lab (owner: art). Original SVG, palette from ds4.css, no raster, no fonts, no
// external references. Every function returns an SVG string and takes `{ decorative, size, idPrefix }`:
//   decorative  true -> aria-hidden, no <title>; false (default) -> role="img" plus a <title>
//   size        rendered width in px (height follows the aspect ratio); the viewBox does the scaling
//   idPrefix    prefix for every id inside the SVG so many can share a page (a unique one is made if omitted)
// Geometry lives in art/*.js; names live in art-labels.js; Spanish in i18n-es-lab4-art.js.
import { badgeSpec, BADGE_IDS as BADGE_KEYS } from "./art/badges.js";
import { PAL, panelOf, svg } from "./art/core.js";
import { HEADER_KINDS, headerSpec, REPORT_KINDS, reportSpec } from "./art/headers.js";
import { MOTIF_KEYS } from "./art/motifs.js";
import { certificateSpec, clampGrade, gradeSpec, milestoneSpec, pathwaySpec, skillSpec, stateOf, strandSpec } from "./art/progress.js";
import { EMPTY_KINDS, emptySpec, FAMILY_KINDS, familySpec, ONBOARD_STEPS, onboardSpec } from "./art/spot.js";
import {
  BADGE_NAMES,
  EMPTY_LABELS,
  FAMILY_LABELS,
  HEADER_LABELS,
  label,
  MOTIF_LABELS,
  ONBOARD_LABELS,
  REPORT_LABELS,
} from "./art-labels.js";

export const BADGE_IDS = BADGE_KEYS;

const tintOf = (tint) => PAL[tint] || tint;
const render = (spec, title, opts = {}, rx = 14) =>
  svg({
    vb: spec.vb,
    natural: spec.natural,
    label: title,
    decorative: opts.decorative,
    size: opts.size,
    idPrefix: opts.idPrefix,
    c: spec.c,
    defs: spec.defs,
    body: spec.body,
    panel: spec.tint ? panelOf(tintOf(spec.tint), spec.plain ? 0 : rx) : undefined,
  });
const pick = (list, key, fallback) => (list.includes(key) ? key : fallback);

/** One illustration per strand family, tinted by grade band (K-2 teal, 3-5 blue, 6-8 amber) with a nine-step grade ladder. */
export const skillArt = (skill, options) => {
  const spec = skillSpec(skill);
  return render(spec, MOTIF_LABELS[spec.motif](), options);
};
export const strandArt = (strand, options) => {
  const spec = strandSpec(strand);
  return render(spec, MOTIF_LABELS[spec.motif](), options);
};
export const gradeArt = (grade, options) => render(gradeSpec(grade), label.grade(clampGrade(grade)), options);
export const headerArt = (kind = "dashboard", options) => {
  const key = pick(HEADER_KINDS, kind, "dashboard");
  return render(headerSpec(key), HEADER_LABELS[key](), options, 16);
};
export const pathwayArt = (steps = [], options) => {
  const spec = pathwaySpec(steps);
  const states = (Array.isArray(steps) && steps.length ? steps : ["new", "new", "new", "new", "new"]).slice(0, 24).map(stateOf);
  const count = (name) => states.filter((s) => s === name).length;
  const title = label.pathway({ n: states.length, new: count("new"), developing: count("developing"), proficient: count("proficient"), mastered: count("mastered") });
  return render(spec, title, options);
};
export const badgeArt = (id, { earned = false, ...options } = {}) => {
  const key = pick(BADGE_KEYS, id, BADGE_KEYS[0]);
  return render(badgeSpec(key, Boolean(earned)), label.badge(BADGE_NAMES[key](), Boolean(earned)), options);
};
export const milestoneArt = (level = 1, options) => {
  const n = Math.max(1, Math.min(5, Math.round(Number(level)) || 1));
  return render(milestoneSpec(n), label.milestone(n), options);
};
export const certificateFrame = (options = {}) => render(certificateSpec(options), label.certificate(), options, 0);
export const emptyStateArt = (kind = "start", options) => {
  const key = pick(EMPTY_KINDS, kind, "start");
  return render(emptySpec(key), EMPTY_LABELS[key](), options, 18);
};
export const onboardingArt = (step = 1, options) => {
  const key = ONBOARD_STEPS.includes(Number(step)) ? Number(step) : 1;
  return render(onboardSpec(key), ONBOARD_LABELS[key](), options, 18);
};
export const reportHeaderArt = (kind = "student", options) => {
  const key = pick(REPORT_KINDS, kind, "student");
  return render(reportSpec(key), REPORT_LABELS[key](), options);
};
export const familyArt = (kind = "home", options) => {
  const key = pick(FAMILY_KINDS, kind, "home");
  return render(familySpec(key), FAMILY_LABELS[key](), options, 18);
};

// Index for the contact sheet and tests: name -> { factory(options) -> svg, description, group }.
const SAMPLE_STRAND = {
  counting: "Counting", patterns: "Patterns", operations: "Operations", fluency: "Fluency", addition: "Addition",
  subtraction: "Subtraction", "place-value": "Place value", multiplication: "Multiplication", division: "Division",
  "number-theory": "Number theory", fractions: "Fractions", decimals: "Decimals", money: "Money",
  measurement: "Measurement", geometry: "Geometry", data: "Data", "number-system": "Number system", ratios: "Ratios",
  expressions: "Expressions", exponents: "Exponents", linear: "Functions",
};
const SAMPLE_GRADE = { counting: 0, patterns: 0, operations: 3, fluency: 2, addition: 1, subtraction: 2, "place-value": 2, multiplication: 3, division: 4, "number-theory": 4, fractions: 4, decimals: 5, money: 2, measurement: 3, geometry: 6, data: 7, "number-system": 6, ratios: 6, expressions: 7, exponents: 8, linear: 8 };
const entries = {};
const add = (name, group, description, factory) => {
  entries[name] = { factory, description, group };
};
for (const key of MOTIF_KEYS) {
  add(`skill/${key}`, "skill", `Skill tile for the ${SAMPLE_STRAND[key]} strand family (grade ${SAMPLE_GRADE[key]} accent).`, (o) =>
    skillArt({ strand: SAMPLE_STRAND[key], grade: SAMPLE_GRADE[key] }, o));
  add(`strand/${key}`, "strand", `Strand picture: ${key}.`, (o) => strandArt(SAMPLE_STRAND[key], o));
}
for (let g = 0; g <= 8; g += 1) add(`grade/${g}`, "grade", `Grade ladder with step ${g} highlighted.`, (o) => gradeArt(g, o));
for (const kind of HEADER_KINDS) add(`header/${kind}`, "header", `Wide ${kind} header, picture on the right.`, (o) => headerArt(kind, o));
for (const kind of REPORT_KINDS) add(`report/${kind}`, "report", `Report header strip for the ${kind} report.`, (o) => reportHeaderArt(kind, o));
add("pathway/sample", "pathway", "Pathway with all four node states.", (o) =>
  pathwayArt(["mastered", "mastered", "proficient", "proficient", "developing", "developing", "new", "new"], o));
add("pathway/empty", "pathway", "Pathway default: five new nodes.", (o) => pathwayArt([], o));
for (let n = 1; n <= 5; n += 1) add(`milestone/${n}`, "milestone", `Milestone medal, level ${n}.`, (o) => milestoneArt(n, o));
for (const id of BADGE_KEYS)
  for (const earned of [true, false])
    add(`badge/${id}${earned ? "" : "/unearned"}`, "badge", `${id} badge, ${earned ? "earned" : "not yet earned"}.`, (o) => badgeArt(id, { ...o, earned }));
for (const orientation of ["landscape", "portrait"])
  add(`certificate/${orientation}`, "certificate", `Ink-light certificate frame, ${orientation}.`, (o) => certificateFrame({ ...o, orientation }));
for (const kind of EMPTY_KINDS) add(`empty/${kind}`, "empty", `Empty state: ${kind}.`, (o) => emptyStateArt(kind, o));
for (const step of ONBOARD_STEPS) add(`onboarding/${step}`, "onboarding", `Onboarding step ${step}.`, (o) => onboardingArt(step, o));
for (const kind of FAMILY_KINDS) add(`family/${kind}`, "family", `Family scene: ${kind}.`, (o) => familyArt(kind, o));
export const ILLUSTRATION_INDEX = Object.freeze(entries);
