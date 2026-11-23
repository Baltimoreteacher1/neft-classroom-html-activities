// Vocabulary Academy print: shared constants and tiny helpers. Pure (no DOM), so Node and the browser both import it.
import { bandOfGrade, DISCLAIMER, PRINT_KINDS } from "../contract.js";
import { esc, html, raw, toHtml } from "../../util.js";

export { esc, html, raw, toHtml, PRINT_KINDS, DISCLAIMER };

/** Kinds a student may print. Everything else needs teacher mode (see views/print.js). */
export const STUDENT_KINDS = ["workbook", "review", "assessment", "words"];
export const TEACHER_KINDS = PRINT_KINDS.filter((k) => !STUDENT_KINDS.includes(k));
export const isTeacherKind = (kind) => TEACHER_KINDS.includes(kind);

export const KIND_TITLE = {
  workbook: "Student Workbook",
  teacher: "Teacher Edition",
  review: "Review Packet",
  assessment: "Assessment, Forms A and B",
  "assessment-key": "Assessment Answer Key",
  words: "Word List and Cards",
};

/** Per-band print layout decisions. One place, read by every sheet. */
export function bandInfo(grade) {
  const band = bandOfGrade(String(grade));
  return {
    band,
    early: band === "early",
    numbering: band === "early" ? "none" : band === "upper-elem" ? "paragraph" : "line",
    choiceCount: band === "early" ? 3 : band === "upper-elem" ? 3 : 4,
    letters: band === "early" ? ["A", "B", "C"] : ["A", "B", "C", "D"],
    writeLines: band === "early" ? 2 : band === "upper-elem" ? 4 : 0,
  };
}

export const gradeLabel = (grade) => (String(grade) === "K" ? "Kindergarten" : `Grade ${grade}`);
export const gradeShort = (grade) => `Grade ${grade}`;

/** The running header string: identical on every page of a unit document. */
export const runningHeader = (unit) =>
  `Vocabulary Academy · Grade ${unit.grade} · Lesson ${unit.n} · ${unit.title}`;

export const SITE = "thelanguagepage.com";

/** Supports a print route may request (SPEC section 5 flags); printing never reads profiles, only these. */
export const PRINT_SUPPORTS = ["picture", "glossaryEs", "frames", "wordBank", "rehearsal"];
export function parseSupports(value) {
  const list = Array.isArray(value) ? value : String(value ?? "").split(",");
  const on = new Set(list.map((s) => s.trim()).filter((s) => PRINT_SUPPORTS.includes(s)));
  return Object.fromEntries(PRINT_SUPPORTS.map((k) => [k, k === "picture" ? true : on.has(k)]));
}

/** A forms-of-the-word list used to bold target words wherever they appear in running text. */
export function wordForms(word) {
  const forms = new Set([word.hw, ...(word.family ?? []).map((f) => f.w)]);
  const base = word.hw.toLowerCase();
  for (const suffix of ["s", "es", "ed", "d", "ing", "ly"]) forms.add(base + suffix);
  if (base.endsWith("e")) forms.add(`${base.slice(0, -1)}ing`);
  if (base.endsWith("y")) forms.add(`${base.slice(0, -1)}ies`).add(`${base.slice(0, -1)}ied`);
  return [...forms].filter(Boolean).sort((a, b) => b.length - a.length);
}

/** Escape `text` and wrap every whole-word match of `forms` in <b class="vap-tw">. */
export function boldWords(text, forms) {
  const safe = esc(text);
  if (!forms.length) return raw(safe);
  const pattern = new RegExp(
    `(^|[^A-Za-z\\u00C0-\\u024F])(${forms.map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![A-Za-z\\u00C0-\\u024F])`,
    "gi",
  );
  return raw(safe.replace(pattern, '$1<b class="vap-tw">$2</b>'));
}

export const allForms = (words) => [...new Set(words.flatMap(wordForms))];
export const plural = (n, one, many = `${one}s`) => (n === 1 ? one : many);
