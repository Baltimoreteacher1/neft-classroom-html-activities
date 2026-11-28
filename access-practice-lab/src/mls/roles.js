// Math Literacy Studio: the 30 resource roles (content/mls/inventory.json) and how each is served.
// A role is not a page: several roles share one resource type, and a few are served by an interactive engine or by the answer key.
// roleCoverage() proves, for any skill, that every role has something real behind it.

/** role id -> { type, variant?, launch?: { kind: "engine"|"manip"|"game", id }, how } */
export const ROLE_MAP = {
  "teacher-guide": { type: "lesson-guide", how: "Teacher guide: objectives, vocabulary, misconceptions, language demands, a full lesson and next steps." },
  "student-objective": { type: "poster", variant: "targets", how: "Targets poster: what we are learning." },
  "language-objective": { type: "poster", variant: "targets", how: "Targets poster: what we will say and write." },
  "success-criteria": { type: "poster", variant: "targets", how: "Targets poster: how we know we have it." },
  prerequisites: { type: "organizer", variant: "prereqs", how: "Checklist of the skills this one builds on." },
  "vocab-cards": { type: "vocab-cards", how: "Visual vocabulary cards with examples, non-examples and Spanish cognates." },
  "vocab-practice": { type: "vocab-practice", how: "Matching, cloze, word parts and a student-made example." },
  "multiple-meaning": { type: "vocab-practice", variant: "multiple-meaning", how: "Everyday meaning compared with math meaning." },
  "concept-explainer": { type: "guided-notes", launch: { kind: "engine", id: "concept-comics" }, how: "Guided notes, plus an interactive concept comic with a prediction." },
  manipulative: { type: null, launch: { kind: "manip", id: "auto" }, how: "An accessible virtual manipulative chosen for this skill." },
  "guided-practice": { type: "worksheet", variant: "guided", how: "Practice with the first step shown." },
  "independent-practice": { type: "worksheet", variant: "independent", how: "Practice with no scaffolds on the page." },
  "reading-passage": { type: "reading-passage", launch: { kind: "engine", id: "reading-lab" }, how: "Original passage in a standard and a simplified version, with questions." },
  "wp-model": { type: "organizer", variant: "anatomy", launch: { kind: "engine", id: "anatomy" }, how: "Word Problem Anatomy: take a situation apart before solving." },
  "wp-practice": { type: "word-problems", how: "Word problems with a read, picture, plan, solve routine." },
  "writing-activity": { type: "writing-task", launch: { kind: "engine", id: "sentence-studio" }, how: "Because, but and so sentences, then an explanation." },
  "speaking-activity": { type: "speaking-task", launch: { kind: "engine", id: "talk-studio" }, how: "Partner talk with stems for the chosen language band." },
  "listening-activity": { type: "listening-task", launch: { kind: "engine", id: "listening-lab" }, how: "Listen and answer; transcript always available; device speech, not a recording." },
  "error-analysis": { type: "error-analysis", launch: { kind: "engine", id: "error-detective" }, how: "Find the first wrong step, explain it, fix it, try a new problem." },
  "discussion-prompts": { type: "discussion-cards", how: "Which one doesn't belong, notice and wonder, always/sometimes/never, would you rather, debate." },
  "collaborative-activity": { type: "collab-activity", how: "Group roles, a task and a group decision." },
  worksheet: { type: "worksheet", how: "Printable practice worksheet." },
  "interactive-activity": { type: "worksheet", variant: "interactive", launch: { kind: "engine", id: "reading-lab" }, how: "The worksheet as a standalone web page with checking, or the live Reading Lab." },
  "game-practice": { type: "game-sheet", launch: { kind: "game", id: "auto" }, how: "A printable matching game and an untimed digital game." },
  "exit-ticket": { type: "exit-ticket", how: "Three questions and a how-sure check." },
  "formative-assessment": { type: "mini-assessment", how: "Eight items across accuracy, reading, vocabulary, representation, explanation and reasoning, with a feedback guide." },
  "intervention-activity": { type: "intervention-packet", how: "Diagnostic, prerequisite check, step-by-step learning and a follow-up." },
  "extension-activity": { type: "task-cards", variant: "extension", how: "Extension tasks with a reasoning prompt." },
  "family-practice": { type: "family-practice", how: "One page for home in English and Spanish." },
  "answer-key": { type: "worksheet", key: true, how: "Separate teacher answer key for any resource." },
};

/** The roles a resource type covers (inverse of ROLE_MAP). */
export const rolesOfType = (type, variant = "") => Object.entries(ROLE_MAP).filter(([, r]) => r.type === type && (!r.variant || r.variant === variant || !variant)).map(([id]) => id);

/** Friendly names for resource types (teacher language). */
export const TYPE_LABEL = {
  worksheet: "Worksheet",
  notebook: "Notebook page",
  "guided-notes": "Guided notes",
  "vocab-cards": "Vocabulary cards",
  "task-cards": "Task cards",
  "reading-passage": "Reading passage",
  "discussion-cards": "Discussion cards",
  organizer: "Graphic organizer",
  "exit-ticket": "Exit ticket",
  "mini-assessment": "Mini-assessment",
  "intervention-packet": "Intervention packet",
  "family-practice": "Family practice",
  poster: "Classroom poster",
  "game-sheet": "Printable game",
  "collab-activity": "Group activity",
  "lesson-guide": "Teacher guide",
  "speaking-task": "Speaking task",
  "listening-task": "Listening task",
  "writing-task": "Writing task",
  "error-analysis": "Error analysis",
  "word-problems": "Word problems",
  "vocab-practice": "Vocabulary practice",
};
/** Which language domain, instructional purpose and format each type serves (search filters). */
export const TYPE_META = {
  worksheet: { domain: "Reading", purpose: "practice", format: "printable", minutes: 20 },
  notebook: { domain: "Writing", purpose: "teach", format: "printable", minutes: 20 },
  "guided-notes": { domain: "Reading", purpose: "teach", format: "printable", minutes: 20 },
  "vocab-cards": { domain: "Vocabulary", purpose: "teach", format: "printable", minutes: 15 },
  "task-cards": { domain: "Reading", purpose: "practice", format: "printable", minutes: 20 },
  "reading-passage": { domain: "Reading", purpose: "teach", format: "interactive", minutes: 20 },
  "discussion-cards": { domain: "Speaking", purpose: "discuss", format: "printable", minutes: 15 },
  organizer: { domain: "Reading", purpose: "teach", format: "printable", minutes: 15 },
  "exit-ticket": { domain: "Writing", purpose: "assess", format: "printable", minutes: 5 },
  "mini-assessment": { domain: "Reading", purpose: "assess", format: "printable", minutes: 25 },
  "intervention-packet": { domain: "Reading", purpose: "intervene", format: "printable", minutes: 20 },
  "family-practice": { domain: "Speaking", purpose: "family", format: "printable", minutes: 15 },
  poster: { domain: "Vocabulary", purpose: "teach", format: "printable", minutes: 5 },
  "game-sheet": { domain: "Speaking", purpose: "practice", format: "printable", minutes: 20 },
  "collab-activity": { domain: "Speaking", purpose: "discuss", format: "printable", minutes: 25 },
  "lesson-guide": { domain: "Reading", purpose: "plan", format: "printable", minutes: 50 },
  "speaking-task": { domain: "Speaking", purpose: "practice", format: "printable", minutes: 15 },
  "listening-task": { domain: "Listening", purpose: "practice", format: "interactive", minutes: 15 },
  "writing-task": { domain: "Writing", purpose: "practice", format: "interactive", minutes: 20 },
  "error-analysis": { domain: "Reading", purpose: "practice", format: "interactive", minutes: 20 },
  "word-problems": { domain: "Reading", purpose: "practice", format: "printable", minutes: 25 },
  "vocab-practice": { domain: "Vocabulary", purpose: "practice", format: "printable", minutes: 20 },
};

/**
 * For one skill: every role, the resource type that serves it and whether that builds. `build` is buildResource.
 * Used by the coverage report and the tests; throws never (a failing role is reported, not hidden).
 */
export function roleCoverage(skill, roles, build) {
  return roles.map((r) => {
    const m = ROLE_MAP[r.id];
    let ok = false;
    let detail = "";
    try {
      if (m.type) {
        const res = build(skill, m.type, { variant: m.variant || "" });
        ok = res.sections.length > 0 && (m.key ? res.key.length > 0 : true);
        detail = `${res.sections.length} sections, ${res.key.length} key entries`;
      } else if (m.launch) {
        ok = true;
        detail = `interactive ${m.launch.kind}`;
      }
      if (m.launch && m.type) detail += `, plus interactive ${m.launch.kind} ${m.launch.id}`;
    } catch (e) {
      detail = e.message;
    }
    return { role: r.id, n: r.n, type: m.type, variant: m.variant || null, launch: m.launch || null, ok, detail };
  });
}
