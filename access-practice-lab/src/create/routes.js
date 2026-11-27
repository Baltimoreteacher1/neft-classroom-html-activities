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

import { normalizeBand } from "../bands.js";

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
const LAB_BANDS = ["K", "1", "2-3", "3-5", "6-8"];
const bandOf = (r, bands = LAB_BANDS) => (bands.includes(r.grades) ? r.grades : "");
const ref = (family, value) => (value ? { family, ref: value } : null);
const PHONICS = (r) => ref("phonics", r.id === "lesson" && SLUG.test(r.lessonId || "") ? r.lessonId : "");
const WORLDS = ["signal-station", "evidence-city", "conversation-quest", "storyworks"];
const MISSION_BAND = { g35: "3-5", g68: "6-8" };
const TOOLS = ["sentence-architecture", "evidence-builder", "language-upgrade"];

const MISSION_REF = (r) => {
  const id = r.id || r.missionId || "";
  return SLUG.test(id) ? { family: "missions", ref: id } : null;
};
const MENTOR = /^m\d{2}$/;
const NEWS = /^np-\d{2}-\d{2}$/;
const PACKS = ["new-arrival-school", "speaking-listening-cards"];
const RP_PAGES = ["letters", "library", "decodable"];
const NO_CONTENT_RECORD = (what) =>
  `${what}: a record of the learner's own work with no content of its own; Create opens with the source picker.`;
const ENGINE_GAP = (what) =>
  `${what}: its content lives inside the page's own interactive engine and no adapter reads it yet, so Create is not shown rather than offering a blank page.`;
const slugRef = (family) => (r) => (SLUG.test(r.id || "") ? { family, ref: r.id } : null);
const fixedRef = (family, ref) => () => ({ family, ref });
/** The content band named in the address (?grades=), or "" when it names none of `allowed`. */
const bandIn = (r, allowed) => {
  const b = normalizeBand(r.grades);
  return allowed.includes(b) ? b : "";
};
const ACADEMIC = ["3-5", "6-8"];
const PREP_SKILLS = [
  "notes",
  "data-talk",
  "raters-eye",
  "word-meanings",
  "text-structures",
  "task-words",
  "daily-drill",
  "extempore-speak",
];
/** City episodes have a different shape from missions and no adapter (src/content/city-*-episode.js). */
const CITY_EPISODES = new Set([
  "market/community-market",
  "clinic/sunrise-clinic",
  "library/neighborhood-newsroom",
]);

/** view id -> capability. Keep alphabetical inside each group. */
export const ROUTES = Object.freeze({
  // ── source: the page's own resource feeds Create ─────────────────────────
  "access-prep": source(
    (r) =>
      PREP_SKILLS.includes(r.id) && SLUG.test(r.setId || "")
        ? { family: "access-prep", ref: `${r.id}/${r.setId}` }
        : null,
    "An Access Prep skill-builder set: its texts, word work and every step.",
  ),
  activity: source(
    (r) =>
      SLUG.test(r.id || "") && !/^\d+$/.test(r.id) ? { family: "lab-activity", ref: r.id } : null,
    "A practice activity: its reading or listening, vocabulary and task.",
  ),
  adventures: source((r) => {
    const band = bandIn(r, ACADEMIC);
    return SLUG.test(r.worldId || "") && SLUG.test(r.missionId || "") && band
      ? { family: "adventures", ref: `${r.worldId}/${r.missionId}/${band}` }
      : null;
  }, "An Adventure Worlds mission at the grade band in the address: its story, readings, clues, choices and writing."),
  architect: source(
    fixedRef("sentence-architect", "studio"),
    "The Sentence Architect kernels and their phrase blocks.",
  ),
  arena: source(
    slugRef("argument-arena"),
    "An Argument Arena topic: its question, evidence cards and objections.",
  ),
  assess: source(
    (r) => (SLUG.test(r.id || "") ? { family: "access-bank", ref: r.id } : null),
    "An ACCESS Practice Lab set (instructional practice; no test material is reproduced).",
  ),
  ladder: source(
    () => null,
    "Reading Ladder: the passage shown follows the learner's round, so Create opens with the ladder's passages in the picker.",
  ),
  mentor: source(
    (r) => (MENTOR.test(r.id || "") ? { family: "mentor-texts", ref: r.id } : null),
    "A Mentor Text Explorer text: the text, its writer's moves and the try-it tasks.",
  ),
  mission: source(MISSION_REF, "An Academic Mission: its sources, vocabulary and every task."),
  missions: source(MISSION_REF, "An Academic Mission: its sources, vocabulary and every task."),
  newsroom: source(
    (r) => (NEWS.test(r.id || "") ? { family: "newsroom-prompts", ref: r.id } : null),
    "A Newsroom story prompt: the assignment, the reporter's notes and the writing tasks.",
  ),
  packs: source(
    (r) => (PACKS.includes(r.id) ? { family: "newcomer-packs", ref: r.id } : null),
    "A newcomer pack: the open pack, or the survival-vocabulary topics in the picker.",
  ),
  puzzles: source(
    (r) => (SLUG.test(r.id || "") ? { family: "puzzle-den", ref: r.id } : null),
    "A Puzzle Den puzzle with its hints and answer.",
  ),
  quest: source(
    (r) =>
      r.id === "mission" && SLUG.test(r.sub || "") ? { family: "quest-missions", ref: r.sub } : null,
    "A Language Quest mission: its readings, checks, sorts, timelines and writing and speaking tasks.",
  ),
  "choice-boards": source((r) => {
    const band = bandIn(r, ["K", "1", "2-3", "3-5", "6-8"]);
    return band && /^(narrate|inform|explain|argue)$/.test(r.id || "")
      ? { family: "choice-boards", ref: `${band}-${r.id}` }
      : null;
  }, "A Language Choice Board at the grade band in the address: its nine tasks, frames and texts."),
  city: source(
    (r) =>
      SLUG.test(r.id || "") &&
      SLUG.test(r.missionId || "") &&
      !CITY_EPISODES.has(`${r.id}/${r.missionId}`)
        ? { family: "language-city", ref: `${r.id}/${r.missionId}` }
        : null,
    "A Language City mission: its signs, what the character says and every step.",
  ),
  "claim-check": source(
    slugRef("claim-check"),
    "A Misconception Detective case: the explanation, the wrong line and the evidence cards.",
  ),
  communication: source(
    slugRef("communication"),
    "A Culture & Communication scenario: its messages, audience shifts and writing task.",
  ),
  construction: source(
    fixedRef("construction-lab", "lab"),
    "The Construction Lab's expansion challenges and register rewrites.",
  ),
  conversation: source(
    (r) => ({
      family: "conversation-sim",
      ref: SLUG.test(r.scenarioId || "") ? r.scenarioId : "ecosystem-debate",
    }),
    "A Conversation Simulator scenario: each turn and its sample responses.",
  ),
  detective: source(
    slugRef("error-detective"),
    "A Language Error Detective case file: the rule, examples and sentences to fix.",
  ),
  "dialogue-studio": source(
    fixedRef("dialogue-studio", "studio"),
    "The Dialogue Studio's dialogues, grammar stories, picture words and warm-ups.",
  ),
  exhibition: source((r) => {
    const band = bandIn(r, ACADEMIC);
    return band ? { family: "exhibition", ref: band } : null;
  }, "The Language World exhibition for the grade band in the address: its four linked tasks."),
  grammar: source(
    (r) => (/^\d{1,2}$/.test(r.id || "") ? { family: "grammar-packs", ref: r.id } : null),
    "A grammar practice pack: its rule and every item.",
  ),
  "reading-room": source(
    (r) => (SLUG.test(r.id || "") ? { family: "reading-room", ref: r.id } : null),
    "A Reading Room lesson: its reading, vocabulary and authored questions.",
  ),
  "reading-path": source(
    (r) =>
      SLUG.test(r.id || "") && !RP_PAGES.includes(r.id) ? { family: "reading-path", ref: r.id } : null,
    "A Reading Path phonics unit: its decodable book, Spanish version and words.",
  ),
  scaffold: source(
    (r) =>
      ref("scaffold-items", TOOLS.includes(r.id) && bandOf(r, ["3-5", "6-8"]) ? `${r.id}-${r.grades}` : ""),
    "A language builder (sentence building, evidence or language upgrade): its items for the grade band.",
  ),
  scenarios: source(
    (r) => ref("scenarios", SLUG.test(r.id || "") ? r.id : ""),
    "A Real-Life Scenario: each conversation turn with the reply the scene rates best, and a role-play.",
  ),
  "science-of-reading": source(
    PHONICS,
    "A Phonics Path lesson: sound cards, build, read, sort, spell, passage and dictation.",
  ),
  sentences: source((r) => {
    if (r.id === "boss") return ref("craft-sentences", /^[gm]boss\d{1,2}$/.test(r.sub || "") ? r.sub : "");
    return ref("craft-sentences", /^\d$/.test(r.id || "") && bandOf(r, ["3-5", "6-8"]) ? `${r.grades}-l${r.id}` : "");
  }, "A Sentence Lab level or paragraph challenge: sentences to build, combine, expand and fix."),
  sor: source(PHONICS, "Science of Reading: a Phonics Path lesson when one is open."),
  speak: source(
    (r) => ref("studio-task", /^spk[a-z0-9-]{1,60}$/.test(r.id || "") ? r.id : ""),
    "A Speaking Studio task: scenario, recording or source, checks, vocabulary, frames and the task.",
  ),
  "subject-reading": source(
    (r) => ref("subject-reading", SLUG.test(r.id || "") ? r.id : ""),
    "A Subject Reading passage: the reading, its words and the evidence question.",
  ),
  "talk-table": source(
    (r) =>
      ref(
        "talk-table",
        /^(narrate|inform|explain|argue)$/.test(r.id || "") && bandOf(r) ? `${r.grades}-${r.id}` : "",
      ),
    "A Talk Table deck: eight discussion cards for one grade band and language use.",
  ),
  "teach-back": source(
    (r) => ref("teach-back", SLUG.test(r.id || "") ? r.id : ""),
    "A Teach-Back concept: the idea, its words, the key points and the explanation task.",
  ),
  twr: source(
    (r) => ref("twr", /^(k|g1|g23|g35|g68)-[a-z-]+-\d$/.test(r.setId || "") ? r.setId : ""),
    "A TWR set: the rule and model, every practice item and the writing task.",
  ),
  "vocab-academy": source(
    (r) => VA_REF(r.path),
    "A Vocabulary Academy lesson: its words, meanings, examples, Spanish and reading.",
  ),
  vocabulary: source(
    (r) => ref("word-parts", bandOf(r, ["3-5", "6-8"])),
    "The Vocabulary word-part builders for the grade band in the address.",
  ),
  voice: source(
    (r) => ref("voice-lab", ["retell", "ladder", "sounds"].includes(r.id) && SLUG.test(r.sub || "") ? `${r.id}-${r.sub}` : ""),
    "A Voice Lab retell, picture-talk ladder or sound-pair set.",
  ),
  wordlab: source(
    (r) => ref("wordlab", /^w-[a-z0-9-]{1,60}$/.test(r.sub || "") ? r.sub : ""),
    "Word Lab: the word set that holds the open word.",
  ),
  worlds: source((r) => {
    const world = WORLDS.includes(r.worldId) ? r.worldId : "";
    const band = MISSION_BAND[(r.missionId || "").split("-")[0]] || bandOf(r, ["3-5", "6-8"]);
    return ref("world-missions", world && band ? `${world}-${band}` : "");
  }, "A Language World's eight missions for the grade band."),
  write: source(
    (r) => ref("studio-task", /^wrt[a-z0-9-]{1,60}$/.test(r.id || "") ? r.id : ""),
    "A Writing Studio task: scenario, sources, vocabulary, organizer, frames and the task.",
  ),

  // ── hub: teacher pages that open Create with a source picker ─────────────
  bridge: hub(
    "Language Bridge analyzes text a teacher pastes; it has no content of its own, so Create opens the source picker.",
  ),
  classroom: hub("Classroom tools."),
  "class-teacher": hub("Class teacher view."),
  collection: hub(
    "A learner's collection book: badges and keepsakes, no content of its own; Create opens the source picker.",
  ),
  early: hub("Early learners' home: a launcher of the early pages; Create opens the source picker."),
  evidence: hub(
    "Evidence Studio pairs readings from the practice activities and missions; Create opens the source picker (the practice activities family holds those readings).",
  ),
  explore: hub(
    "Explore lists every destination; it has no content of its own, so Create opens the source picker.",
  ),
  flashcards: hub(
    "Word cards are drawn from the practice activities and reviewed on this device; Create opens the source picker.",
  ),
  growth: hub(
    "Language Growth Map: a record of the learner's own work, no content of its own; Create opens the source picker.",
  ),
  "guided-units": hub("Guided Units link to other pages in a sequence; Create opens the source picker."),
  launch: hub("Teacher launch page."),
  lens: hub(NO_CONTENT_RECORD("My Words (the Language Lens)")),
  "launch-studio": hub("Teacher launch studio."),
  library: hub("Resource library."),
  partner: hub(
    "Partner Talk: a pass-the-device recorder with three general speaking prompts; Create opens with the source picker.",
  ),
  passport: hub(NO_CONTENT_RECORD("My Passport")),
  path: hub(NO_CONTENT_RECORD("My Language Path")),
  portfolio: hub(NO_CONTENT_RECORD("My portfolio")),
  program: hub("Program and strategies pages."),
  "publisher-demo": hub("Publisher demo."),
  radar: hub(
    "Reclassification Radar: a teacher evidence view over a demo roster with no content of its own; Create opens with the source picker.",
  ),
  reader: hub(
    "Immersive Reader: a reading tool for any text; its three sample texts have no tasks, so Create opens with the source picker.",
  ),
  "ready-plan": hub(NO_CONTENT_RECORD("My ACCESS plan")),
  road: hub("Road to ACCESS: a weekly plan that links to activities; it has no content of its own."),
  room: hub("Skill room: a list of activities for one domain and level; Create opens with the source picker."),
  simulator: hub(
    "Speaking simulator: a practice engine over a few built-in prompts; the Speaking Studio tasks in the picker hold the full authored speaking content.",
  ),
  "site-guide": hub("Site guide."),
  start: hub("Getting started."),
  supports: hub(
    "Scaffold Studio in use: support layers over one pilot reading and this device's independence record, with no questions to build from.",
  ),
  "teacher-launch": hub("Teacher launch."),
  "time-machine": hub("Language Time Machine: a learner's own earlier and later work, a personal record with no content of its own."),
  tools: hub("Teacher tools."),
  units: hub("Units overview."),
  "vocab-curriculum": hub("Vocabulary curriculum overview."),
  warmup: hub("Daily Warm-Up: the day's word changes daily; the picker offers the warm-up words in sets of ten."),

  // ── workspace: already a creation tool ───────────────────────────────────
  "activity-studio": workspace(
    "The Activity Studio is the full editor that Create hands drafts to.",
  ),
  demand: workspace(
    "The Language Demand Analyzer has its own hand-off into Activity Studio; Create does not add a second one.",
  ),
  "book-studio": workspace(
    "Book Studio has its own creation workflow; Create does not add a second one.",
  ),
  "experience-builder": workspace("Experience Builder has its own authoring workflow."),
  "lesson-builder": workspace("The Lesson Builder has its own resource studio and planner."),
  pathways: workspace("Pathways has its own builder."),
  "task-packs": workspace("Task Packs is a speaking task builder with its own drafts."),
  "vocab-sets": workspace("Vocabulary Sets is a word-list builder with its own practice, print and share."),

  // ── excluded: student-only, family-facing or no adapter ──────────────────
  diagnostic: excluded(
    `${STUDENT_ONLY} The check-in recommends a starting point and must stay unchanged.`,
    { tray: false },
  ),
  games: excluded(
    "Live game play: each game is its own engine. Teachers make a game from any source with Create on a teacher page.",
    { tray: false },
  ),
  goals: excluded(
    "The student and family goal sheet; teachers set goals in the Teacher Hub's goal-setting form.",
    { tray: false },
  ),
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
  pairs: excluded(`${STUDENT_ONLY} Listening partners share recorded takes between classmates.`, {
    tray: false,
  }),
  journey: excluded(ENGINE_GAP("ACCESS Learning Journey")),
  "language-games": excluded(ENGINE_GAP("Language Games (four story games on the flagship engine)")),
  "language-labs": excluded(ENGINE_GAP("Language Labs (Verb Time Machine, Connector Bridge, Paragraph X-Ray)")),
  "language-studios": excluded(ENGINE_GAP("Language Studios (syntax, morphology and cohesion manipulatives)")),
  learn: excluded(ENGINE_GAP("Interactive Learn Hub")),
  lingua: excluded(ENGINE_GAP("Everyday English studio")),
  reality: excluded(ENGINE_GAP("Language Reality View")),
  method: excluded("No instructional content: explains how practice is built and what the lab can show."),
  move: excluded("Moves a learner's saved work between sites: a device utility with no instructional content."),
  accessibility: excluded("No instructional content."),
  privacy: excluded("No instructional content."),
  styleguide: excluded("Design reference, no instructional content."),
  search: excluded("Search results: Create appears on the resource a result opens."),
  home: excluded("The home page leads to the hubs, where Create appears."),
  scenes: excluded(
    "Class scenes are written by learners in a class and approved by their teacher; learner writing is never a Create source.",
    { tray: false },
  ),
  simulations: excluded(
    "Simulation missions are branching, saved-state experiences whose later scenes depend on earlier choices; no adapter maps them to a linear activity yet.",
  ),
  "skill-arcade": excluded(`${STUDENT_ONLY} Phonics and sound game rounds.`, { tray: false }),
  stories: excluded(
    "Student story episodes whose text is part of the page code rather than a content file, so no adapter can read it.",
    { tray: false },
  ),
  ...Object.fromEntries(
    [
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
