/**
 * download-taxonomy.mjs — the vocabulary the bulk downloader speaks.
 *
 * Shared by the build-time manifest generator (scripts/generate-download-manifest.mjs)
 * and its validator (tools/validate-download-manifest.mjs). The browser reads the
 * types + presets straight out of the GENERATED manifest, so this file is the one
 * place a resource type or preset is defined.
 *
 * `group` decides the quick-filter chips in the Custom screen; `folder` decides
 * where the resource lands inside a package.
 */

/** Ordered resource types. `order` is the index — packages sort by it. */
export const TYPES = [
  // --- core lesson ---
  { id: "interactive-lesson", label: "Interactive Lesson", group: "lessons", folder: "" },
  { id: "slides", label: "Slides", group: "slides", folder: "Slides" },
  { id: "editable-slides", label: "Editable Slides", group: "slides", folder: "Slides" },
  { id: "guided-notes", label: "Guided Notes", group: "notes", folder: "Guided-Notes" },
  { id: "notes-pdf", label: "Notes PDF", group: "notes", folder: "Guided-Notes" },
  { id: "notes-docx", label: "Notes DOCX", group: "notes", folder: "Guided-Notes" },
  { id: "handout", label: "Handout", group: "print", folder: "Handout" },
  { id: "homework", label: "Homework", group: "homework", folder: "Homework" },
  { id: "homework-docx", label: "Homework DOCX", group: "homework", folder: "Homework" },
  { id: "student-practice", label: "Student Practice", group: "print", folder: "Practice" },
  { id: "activity-pack", label: "Activity Pack", group: "print", folder: "Activity-Pack" },
  { id: "sub-plan", label: "Sub Plan / Printable Packet", group: "print", folder: "Sub-Plan" },
  {
    id: "interactive-bundle",
    label: "Interactive Bundle",
    group: "lessons",
    folder: "Interactive",
  },
  { id: "family-page", label: "Family Page", group: "family", folder: "Family" },
  { id: "student-help", label: "Student Help", group: "family", folder: "Family" },
  { id: "google-form", label: "Google Form", group: "assessments", folder: "" },
  { id: "teacher-notes", label: "Teacher Notes", group: "teacher", folder: "Teacher-Notes" },

  // --- small group / catch-up ---
  {
    id: "small-group-lesson",
    label: "Small-Group Lesson",
    group: "small-groups",
    folder: "Small-Group",
  },
  {
    id: "small-group-worksheet",
    label: "Small-Group Worksheet",
    group: "worksheets",
    folder: "Small-Group",
  },
  {
    id: "small-group-homework",
    label: "Small-Group Homework",
    group: "worksheets",
    folder: "Small-Group",
  },
  { id: "catchup-lesson", label: "Catch-Up Station", group: "small-groups", folder: "Catch-Up" },

  // --- unit level ---
  { id: "pre-test", label: "Pre-Test", group: "assessments", folder: "Assessments" },
  { id: "post-test", label: "Post-Test", group: "assessments", folder: "Assessments" },
  { id: "study-guide", label: "Study Guide", group: "assessments", folder: "Study-Guides" },
  { id: "project", label: "Culminating Project", group: "projects", folder: "Projects" },
  {
    id: "architect-challenge",
    label: "Architect Challenge",
    group: "projects",
    folder: "Projects",
  },
  { id: "graphic-novel", label: "Graphic Novel", group: "extensions", folder: "Unit-Resources" },
  { id: "unit-game", label: "Unit Game", group: "games", folder: "Unit-Resources" },
  { id: "arcade-game", label: "Arcade Game", group: "games", folder: "Unit-Resources" },
  { id: "unit-resource", label: "Unit Resource", group: "extensions", folder: "Unit-Resources" },

  // --- generated ---
  { id: "scorm", label: "SCORM Package", group: "scorm", folder: "SCORM" },
];

export const TYPE_BY_ID = new Map(TYPES.map((t, i) => [t.id, { ...t, order: i }]));

/** Quick-filter chips in the Custom screen, in display order. */
export const GROUPS = [
  { id: "lessons", label: "Interactive Lessons" },
  { id: "slides", label: "Slides" },
  { id: "notes", label: "Guided Notes" },
  { id: "homework", label: "Homework" },
  { id: "print", label: "Print & Packets" },
  { id: "small-groups", label: "Small Groups" },
  { id: "worksheets", label: "Worksheets" },
  { id: "assessments", label: "Assessments" },
  { id: "projects", label: "Projects" },
  { id: "games", label: "Games" },
  { id: "family", label: "Family" },
  { id: "extensions", label: "Unit Resources" },
  { id: "teacher", label: "Teacher Notes" },
  { id: "scorm", label: "SCORM" },
];

/**
 * Presets. `types` lists the resource type ids a preset selects; a preset never
 * names a type that does not exist in TYPES (validated by
 * tools/validate-download-manifest.mjs).
 */
export const PRESETS = [
  {
    id: "complete",
    label: "Complete Unit",
    description: "Everything downloadable for the unit, plus links for live resources.",
    types: TYPES.filter((t) => t.id !== "scorm").map((t) => t.id),
  },
  {
    id: "core",
    label: "Core Lesson Pack",
    description: "Interactive lessons plus the teacher and student materials that go with them.",
    types: [
      "interactive-lesson",
      "slides",
      "editable-slides",
      "guided-notes",
      "notes-pdf",
      "notes-docx",
      "handout",
      "homework",
      "homework-docx",
      "interactive-bundle",
      "teacher-notes",
    ],
  },
  {
    id: "print",
    label: "Print & Editable Pack",
    description: "PDFs, DOCX files, worksheets, homework, and printable packets.",
    types: [
      "notes-pdf",
      "notes-docx",
      "guided-notes",
      "handout",
      "homework",
      "homework-docx",
      "student-practice",
      "activity-pack",
      "sub-plan",
      "small-group-worksheet",
      "small-group-homework",
    ],
  },
  {
    id: "small-groups",
    label: "Small-Group Pack",
    description: "Both small-group levels, their worksheets, and catch-up stations.",
    types: [
      "small-group-lesson",
      "small-group-worksheet",
      "small-group-homework",
      "catchup-lesson",
    ],
  },
  {
    id: "assessment",
    label: "Assessment & Review Pack",
    description: "Pre-tests, post-tests, study guides, and culminating projects.",
    types: ["pre-test", "post-test", "study-guide", "project", "architect-challenge"],
  },
  {
    id: "scorm",
    label: "Canvas / SCORM Pack",
    description: "One ready-to-upload SCORM package per activity, bundled into one download.",
    types: ["scorm"],
  },
];

export const PRESET_BY_ID = new Map(PRESETS.map((p) => [p.id, p]));

/** Types whose SCORM package is worth offering (live, launchable activities). */
export const SCORMABLE_TYPES = new Set([
  "interactive-lesson",
  "small-group-lesson",
  "catchup-lesson",
  "homework",
  "handout",
  "guided-notes",
  "small-group-worksheet",
  "unit-game",
  "arcade-game",
  "project",
  "architect-challenge",
  "pre-test",
  "post-test",
  "study-guide",
]);

// The teacher-surface predicate lives in functions/_lib/teacher-surface.js — the
// same module the HTTP Basic Auth gate and the SCORM endpoint use. This file
// used to carry a hand-maintained "mirror" of it, which is how a security
// predicate drifts: the stale copy does not throw, it just answers "student".
export { isTeacherSurface } from "../../functions/_lib/teacher-surface.js";

/** Filenames safe on Windows and macOS: no <>:"/\|?* and no trailing dot/space. */
export function safeName(value, fallback = "resource") {
  const cleaned = String(value == null ? "" : value)
    // En/em dashes and ampersands read badly in filenames but are not illegal;
    // fold them before the illegal-character pass so nothing is lost silently.
    .replace(/[\u2010-\u2015]/g, "-")
    // Emoji and pictographs are legal in filenames but render as boxes in
    // Windows Explorer and break some district file pickers.
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2190}-\u{27BF}\u{FE00}-\u{FE0F}\u{2B00}-\u{2BFF}\u{200D}]/gu,
      " ",
    )
    .replace(/[\u00b7\u2022]/g, " ")
    .replace(/&/g, " and ")
    // Reserved on Windows (< > : " / \\ | ? *), control chars, and whitespace.
    .replace(/[<>:"/\\|?*\u0000-\u001f\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+/, "")
    // A stripped emoji leaves an orphan separator behind ("Unit-5_-Post-Test").
    .replace(/_-+/g, "_")
    .replace(/-+_/g, "_")
    .slice(0, 80)
    // A trailing dot or space makes a name unopenable on Windows.
    .replace(/[-.\s]+$/, "");
  return cleaned || fallback;
}

/**
 * WHO OWNS A UNIT-LEVEL RESOURCE — the order of authority.
 * ---------------------------------------------------------------------------
 * Lessons were renumbered to the publisher's Reveal TOC on 2026-08-10
 * (data/toc-migration.json). Most unit-level ASSETS were never renamed, so the
 * number inside a path is the unit that resource belonged to BEFORE the
 * renumber. It is a historical fact about a filename, not a statement about the
 * current curriculum, and it must never be treated as one:
 *
 *   /pre-test/unit9-review.html   titles itself "Integers and Coordinate Plane" -> Unit 7
 *   /pre-test/unit7-review.html   titles itself "Equations and Inequalities"    -> Unit 8
 *   /pre-test/unit8-review.html   titles itself "Statistics"                    -> Unit 2
 *   /math/unit-10/projects/       titles itself "Volume & Surface Area in Action" -> Unit 5
 *
 * Resolve ownership in this order, and stop at the first that answers:
 *
 *   1. CANONICAL_UNIT below — an explicit, reviewed assignment.
 *   2. The current curriculum structure: which unit card in
 *      curriculum/units/index.html contains the link, and data/curriculum-manifest.json
 *      for anything lesson-scoped. This is the working default.
 *   3. The resource page's own <h1>/<title>, compared against the CURRENT unit
 *      names. Used to catch a clear contradiction, never to reassign quietly.
 *   4. The number in the path or filename — a diagnostic clue only. On its own
 *      it may never move a resource or fail a build.
 *
 * Enforced by tools/validate-unit-resource-placement.mjs.
 *
 * Note for anyone reaching for more metadata: data/curriculum-unit-identities.json
 * is ALSO keyed by the pre-renumber numbering (its "9" is "Integer Outpost",
 * its "10" is "Volume Vault"). Do not use it to decide ownership.
 */

/**
 * Explicit ownership for resources that rule 2 and rule 3 cannot settle. Build
 * time only — nothing here reaches the teacher-facing UI.
 *
 * Keep this map as short as it can be. An entry earns its place by naming a
 * resource whose own title does not identify a unit, so that without it the
 * placement would rest on inference.
 */
export const CANONICAL_UNIT = new Map([
  [
    "/math/unit-1/projects/",
    {
      unit: 6,
      title: "Number Sense in Action",
      because:
        "Joel's call, 2026-08-13: Unit 6 carries the prime-factorization and " +
        "fraction-division content this project applies, which is a defensible " +
        "instructional match. The 'unit-1' in the path is pre-renumber and is " +
        "not authoritative. The title names no unit, so rule 3 cannot decide it.",
    },
  ],
  [
    "/math/unit-10/projects/",
    {
      unit: 5,
      title: "Volume & Surface Area in Action",
      because:
        "Its own title is Volume & Surface Area, which is Unit 5 " +
        "(Area, Surface Area & Volume). Pinned explicitly because the path says " +
        "unit-10, and Unit 10 is a reflection unit with no culminating project.",
    },
  ],
]);
