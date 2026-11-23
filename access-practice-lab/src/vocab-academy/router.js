// Vocabulary Academy — sub-routing (SPEC §2). Core-owned. Pure: maps the path segments after /vocabulary-academy to a
// named sub-view and its params; index.js loads the module and renders it. Every route in the spec is wired here.
//
//   []                                   dashboard   (My Vocabulary)
//   ["grades"]                           grades
//   ["grade", G]                         grade                 { grade }
//   ["grade", G, "unit", U]              unit                  { grade, u }            a group of lessons
//   ["grade", G, "unit", U, activity]    unit-activity         { grade, u, activity }  crossword | test
//   ["grade", G, "lesson", N]            lesson-home           { grade, n }            ten words (N or cu_<slug>)
//   ["grade", G, "lesson", N, a-h]       lesson                { grade, n, letter }    the word list, an exercise, the review
//   ["word", id]                         word                  { wordId }
//   ["word-study"] ["practice"] ["review"] ["family"]
//   ["games"] / ["games", id]            games                 { gameId }
//   ["teacher"] / ["teacher", "custom"]  teacher / custom      (teacher-only)
//   ["present", G, N]                    present               { grade, n }
//   ["print", G, N, kind]                print                 { grade, n, kind }   (teacher + assessment-key are teacher-only)
import { LESSONS, PRINT_KINDS } from "./contract.js";
import { normGrade, wordIdFromSegment } from "./data.js";

/** One literal dynamic import per sub-view (the shell tooling versions and caches literal imports). */
export const SUBVIEW_LOADERS = {
  dashboard: () => import("./views/home.js"),
  grades: () => import("./views/grades.js"),
  grade: () => import("./views/grade.js"),
  unit: () => import("./views/unit.js"),
  "unit-activity": () => import("./views/unit-activity.js"),
  "lesson-home": () => import("./views/lesson-home.js"),
  word: () => import("./views/word.js"),
  lesson: () => import("./views/lesson.js"),
  practice: () => import("./views/practice.js"),
  review: () => import("./views/review.js"),
  games: () => import("./views/games.js"),
  "word-study": () => import("./views/word-study.js"),
  teacher: () => import("./views/educator.js"),
  custom: () => import("./views/custom.js"),
  present: () => import("./views/present.js"),
  print: () => import("./views/print.js"),
  family: () => import("./integrations/family-view.js"),
};

/** Sub-views that never render for a learner (decided in index.js from the lab's teacher-mode check). */
export const TEACHER_VIEWS = new Set(["teacher", "custom"]);
export const TEACHER_PRINT_KINDS = new Set(["teacher", "assessment-key"]);
/** Pages that own the whole screen: no save-status or disclaimer chrome around them. */
export const CHROMELESS_VIEWS = new Set(["print", "present"]);

const LETTERS = new Set(LESSONS.map((l) => l.id));
export const UNIT_ACTIVITIES = ["crossword", "test"];
/** A lesson path segment: a number, or a custom unit's "cu_<slug>" (dots travel as underscores) → number | "cu.<slug>" | 0. */
const unitNumber = (s) => {
  const seg = String(s ?? "");
  if (/^cu_[a-z0-9-]+$/.test(seg)) return seg.replace("_", ".");
  return /^\d{1,3}$/.test(seg) && Number(seg) > 0 ? Number(seg) : 0;
};

/** → { name, params, teacherOnly }. Anything the spec does not list is { name: "notfound" }. */
export function resolve(path = []) {
  const [a, b, c, d, e] = path.map(String);
  const some = (name, params = {}, teacherOnly = false) => ({ name, params, teacherOnly });
  if (!a) return some("dashboard");
  const single = {
    grades: "grades",
    "word-study": "word-study",
    practice: "practice",
    review: "review",
    family: "family",
  };
  if (single[a] && !b) return some(single[a]);
  // Word Study Lab tools live at /word-study/<tool>; the view treats an unknown tool as the lab home.
  if (a === "word-study" && /^[a-z][a-z-]{0,30}$/.test(b || "") && !c)
    return some("word-study", { tool: b });
  if (a === "grade") {
    const grade = normGrade(b);
    if (!grade) return some("notfound");
    if (!c) return some("grade", { grade });
    if (c === "unit") {
      const u = /^\d{1,2}$/.test(d || "") && Number(d) > 0 ? Number(d) : 0;
      if (!u || path.length > 5) return some("notfound");
      if (!e) return some("unit", { grade, u });
      return UNIT_ACTIVITIES.includes(e) ? some("unit-activity", { grade, u, activity: e }) : some("notfound");
    }
    const n = unitNumber(d);
    if (c !== "lesson" || !n || path.length > 5) return some("notfound");
    if (!e) return some("lesson-home", { grade, n });
    const letter = e.toLowerCase();
    return LETTERS.has(letter) ? some("lesson", { grade, n, letter }) : some("notfound");
  }
  if (a === "word" && b && !c) return some("word", { wordId: wordIdFromSegment(b) });
  if (a === "games" && !c) return some("games", { gameId: b || "" });
  if (a === "teacher" && !b) return some("teacher", {}, true);
  if (a === "teacher" && b === "custom" && !c) return some("custom", {}, true);
  if (a === "present") {
    const grade = normGrade(b);
    const n = unitNumber(c);
    return grade && n && !d ? some("present", { grade, n }) : some("notfound");
  }
  if (a === "print") {
    const grade = normGrade(b);
    const n = unitNumber(c);
    if (!grade || !n || !PRINT_KINDS.includes(d) || e) return some("notfound");
    return some("print", { grade, n, kind: d }, TEACHER_PRINT_KINDS.has(d));
  }
  return some("notfound");
}
