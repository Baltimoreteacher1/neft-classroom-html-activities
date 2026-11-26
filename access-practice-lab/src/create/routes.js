// Project Studio · the route-capability registry. ONE answer to "what may the Create panel offer on this page?".
// Every lab route view (parseRoute in src/main.js) has a disposition; tools/create-routes.test.mjs fails when a view
// is added without one. Pure: no DOM, no storage.
//
//   source     Create builds from THIS page's own content through a Customize adapter (src/studio/adapters).
//   hub        a teacher page with no single resource: Create opens with a source picker (the adapters' own lists).
//   workspace  the page already IS a creation tool; Create is not added on top of it (no competing buttons).
//   excluded   Create never appears, with the reason (student-only, family-facing, no adapter can read it yet).
//
// Pages outside the lab app (Teacher Hub, BCPSS Teachers) are listed in EXTERNAL_PAGES with the same fields.

const ADAPTER_GAP =
  "No adapter can read this content into the activity model yet, so Create is not shown rather than offering a blank page.";
const STUDENT_ONLY = "Student-facing: authoring controls never appear here.";
const FAMILY =
  "Family-facing: the simple family experience is kept; teachers create from the teacher pages instead.";

const source = (resolve, note) => ({ disposition: "source", resolve, note });
const hub = (note) => ({ disposition: "hub", note });
const workspace = (note) => ({ disposition: "workspace", note });
const excluded = (note, { tray = true } = {}) => ({ disposition: "excluded", note, tray });

const VA_REF = (path = []) => {
  const [g, grade, l, n] = path;
  if (
    g !== "grade" ||
    l !== "lesson" ||
    !/^(K|[1-8])$/.test(grade || "") ||
    !/^\d{1,2}$/.test(n || "")
  )
    return null;
  return { family: "vocab-academy", ref: `g${grade}-u${String(Number(n)).padStart(2, "0")}` };
};
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/i;

/** view id -> capability. Keep alphabetical inside each group. */
export const ROUTES = Object.freeze({
  // ── source: the page's own resource feeds Create ─────────────────────────
  assess: source(
    (r) => (SLUG.test(r.id || "") ? { family: "access-bank", ref: r.id } : null),
    "An ACCESS Practice Lab set (instructional practice; no test material is reproduced).",
  ),
  "reading-room": source(
    (r) => (SLUG.test(r.id || "") ? { family: "reading-room", ref: r.id } : null),
    "A Reading Room lesson: its reading, vocabulary and authored questions.",
  ),
  "vocab-academy": source(
    (r) => VA_REF(r.path),
    "A Vocabulary Academy lesson: its words, meanings, examples, Spanish and reading.",
  ),

  // ── hub: teacher pages that open Create with a source picker ─────────────
  classroom: hub("Classroom tools."),
  "class-teacher": hub("Class teacher view."),
  launch: hub("Teacher launch page."),
  "launch-studio": hub("Teacher launch studio."),
  library: hub("Resource library."),
  program: hub("Program and strategies pages."),
  "publisher-demo": hub("Publisher demo."),
  "site-guide": hub("Site guide."),
  start: hub("Getting started."),
  "teacher-launch": hub("Teacher launch."),
  tools: hub("Teacher tools."),
  units: hub("Units overview."),
  "vocab-curriculum": hub("Vocabulary curriculum overview."),

  // ── workspace: already a creation tool ───────────────────────────────────
  "activity-studio": workspace(
    "The Activity Studio is the full editor that Create hands drafts to.",
  ),
  "book-studio": workspace(
    "Book Studio has its own creation workflow; Create does not add a second one.",
  ),
  "experience-builder": workspace("Experience Builder has its own authoring workflow."),
  "lesson-builder": workspace("The Lesson Builder has its own resource studio and planner."),
  pathways: workspace("Pathways has its own builder."),

  // ── excluded: student-only, family-facing or no adapter ──────────────────
  do: excluded(STUDENT_ONLY, { tray: false }),
  play: excluded(STUDENT_ONLY, { tray: false }),
  "session-done": excluded(STUDENT_ONLY, { tray: false }),
  students: excluded(STUDENT_ONLY, { tray: false }),
  tests: excluded("Practice-test chooser for students.", { tray: false }),
  test: excluded(`${STUDENT_ONLY} Test simulation must stay unchanged.`, { tray: false }),
  "class-quiz": excluded(STUDENT_ONLY, { tray: false }),
  class: excluded(STUDENT_ONLY, { tray: false }),
  family: excluded(FAMILY, { tray: false }),
  "family-bridge": excluded(FAMILY, { tray: false }),
  "family-start": excluded(FAMILY, { tray: false }),
  "practice-together": excluded(FAMILY, { tray: false }),
  accessibility: excluded("No instructional content."),
  privacy: excluded("No instructional content."),
  styleguide: excluded("Design reference, no instructional content."),
  search: excluded("Search results: Create appears on the resource a result opens."),
  home: excluded("The home page leads to the hubs, where Create appears."),
  ...Object.fromEntries(
    [
      "access-prep",
      "activity",
      "adventures",
      "architect",
      "arena",
      "bridge",
      "choice-boards",
      "city",
      "claim-check",
      "collection",
      "communication",
      "construction",
      "conversation",
      "demand",
      "detective",
      "diagnostic",
      "dialogue-studio",
      "early",
      "evidence",
      "exhibition",
      "explore",
      "flashcards",
      "games",
      "goals",
      "grammar",
      "growth",
      "guided-units",
      "journey",
      "ladder",
      "language-games",
      "language-labs",
      "language-studios",
      "learn",
      "lens",
      "lingua",
      "mentor",
      "method",
      "mission",
      "missions",
      "move",
      "newsroom",
      "packs",
      "pairs",
      "partner",
      "passport",
      "path",
      "portfolio",
      "puzzles",
      "quest",
      "radar",
      "reader",
      "reading-path",
      "ready-plan",
      "reality",
      "road",
      "room",
      "scaffold",
      "scenarios",
      "scenes",
      "science-of-reading",
      "sentences",
      "simulations",
      "simulator",
      "skill-arcade",
      "sor",
      "speak",
      "stories",
      "subject-reading",
      "supports",
      "talk-table",
      "task-packs",
      "teach-back",
      "time-machine",
      "twr",
      "vocab-sets",
      "vocabulary",
      "voice",
      "warmup",
      "wordlab",
      "worlds",
      "write",
    ].map((v) => [v, excluded(ADAPTER_GAP)]),
  ),
});

/** Pages outside the lab app that mount Create themselves (src/create/page.js). */
export const EXTERNAL_PAGES = Object.freeze([
  {
    path: "/bcpss-teachers/",
    disposition: "source",
    note: "The open BCPSS unit (vocabulary, cloze items, one reading level, exit ticket, standards), at the WIDA band the page shows.",
  },
  {
    path: "/access-teacher/",
    disposition: "source",
    note: "Each ACCESS set row in the content panel opens Create with that set.",
  },
]);

const UNIT_ID = /^[a-zA-Z0-9_-]{2,80}$/;
const BANDS = ["1_2", "3_4", "5_6"];

/**
 * What Create may do on this route: { disposition, source: {family, ref, band?} | null, note, tray }.
 * `?bcpssUnit=<id>` (the lab's BCPSS hydration parameter) makes any non-excluded, non-workspace route a BCPSS source.
 */
export function capabilityFor(route = {}, search = "") {
  const cap = ROUTES[route.view] || excluded("Unknown route.", { tray: false });
  const q = new URLSearchParams(search);
  const unit = q.get("bcpssUnit") || "";
  if (UNIT_ID.test(unit) && (cap.disposition === "hub" || cap.disposition === "source")) {
    const band = q.get("band");
    return {
      disposition: "source",
      source: { family: "bcpss-unit", ref: unit, ...(BANDS.includes(band) ? { band } : {}) },
      note: "The BCPSS unit named in the address.",
      tray: true,
    };
  }
  if (cap.disposition !== "source")
    return { disposition: cap.disposition, source: null, note: cap.note, tray: cap.tray !== false };
  const src = cap.resolve(route);
  // a source route without a resource open (the Reading Room shelf, the Academy home) behaves as a hub
  return src
    ? { disposition: "source", source: src, note: cap.note, tray: true }
    : { disposition: "hub", source: null, note: cap.note, tray: true };
}

/** Whether the Create button belongs on this route at all. */
export const offersCreate = (cap) => cap.disposition === "source" || cap.disposition === "hub";
