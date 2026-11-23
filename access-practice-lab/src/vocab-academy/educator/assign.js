// Vocabulary Academy → the lab's EXISTING class assignment flow (src/class/assign.js + /api/class settings.assignments).
// No second roster or assignment store: a Vocabulary Academy stop is shaped like any other assignable row
// ({ id, title, path, band, unit:true }) and saved with the lab's own toAssignment(). The class server keeps only
// id / title / path / due, validates `id` with SKILL_RE and `path` with /^\/[\w\-./?=&%]{0,200}$/ (shared/class-platform
// contract), and stores nothing else, so everything an assignment needs travels in its path:
//
//   /access-practice-lab/vocabulary-academy/grade/<G>/lesson/<N>[/<lesson a-h>]?grades=<lab band>[&sup=…&sf=…&son=…&soff=…&w=…]
//   /access-practice-lab/vocabulary-academy/practice?set=<id>%2C<id>…&grades=<lab band>
//
// `grades` keeps the student's "Assigned practice" list naming the right grade band (assignmentBand reads it).
// `sup/sf/son/soff/w` are a supports override and/or a smaller word set (supports.js encodeVariant): the grade-level
// objective is the same unit, so a differentiated version changes ACCESS and amount, never the grade.
import { EXTRAS } from "../unit/extras.js";
import { LIMITS } from "../../../../shared/class-platform/contract.js";
import { ID_OK, assignmentBand, toAssignment } from "../../class/assign.js";
import { LESSONS, VA_ROUTE, labBandOfGrade, sectionTitle } from "../contract.js";
import { vaHref } from "../data.js";
import { hashSeed } from "../rng.js";
import { encodeVariant, parseVariant } from "../supports.js";

export { toAssignment };
/** What the class server accepts for a path (shared/class-platform/contract.js validateSettings). */
export const PATH_OK = /^\/[\w\-./?=&%]{0,200}$/;
/** Practice-set assignments carry full word ids (SPEC §10); this many fit inside the 200-character path limit. */
export const MAX_SET_WORDS = 8;

const pad2 = (n) => String(n).padStart(2, "0");
const slug = (v) =>
  String(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const short = (text) => hashSeed(text).toString(36).slice(0, 5);
/** A custom unit id ("cu.reading-a1b2") travels in a path with underscores for dots (the lab treats ".letters" as a file). */
export const customSegment = (id) => String(id).replaceAll(".", "_");
export const customIdFromSegment = (seg) => (String(seg).startsWith("cu_") ? String(seg).replaceAll("_", ".") : seg);
/** Unit key inside an id: published units are numeric (u01); custom units keep their cu. id. */
const unitKey = (n) => (/^\d+$/.test(String(n)) ? `u${pad2(n)}` : slug(n));

/** Class assignment id (SKILL_RE, <= 40 chars). The same stop + variant always yields the same id, so assigning twice dedupes. */
export function assignmentId({ grade, n, lesson = "", set = null, variant = "" }) {
  const id = set
    ? `va-p-${short(set.join(","))}${variant ? `-${short(variant)}` : ""}`
    : `va-g${slug(grade)}-${unitKey(n)}${lesson ? `-${lesson}` : ""}${variant ? `-${short(variant)}` : ""}`;
  return id.slice(0, 40);
}

/** App-relative assignment path. `variant` is an object for supports.js encodeVariant, or a ready query string. */
export function assignmentPath({ grade, n, lesson = "", set = null, variant = null }) {
  const vq = typeof variant === "string" ? variant : variant ? encodeVariant(variant) : "";
  if (set) {
    const ids = set.slice(0, MAX_SET_WORDS);
    return `${vaHref("practice")}?set=${ids.join("%2C")}&grades=${labBandOfGrade(grade)}${vq ? `&${vq}` : ""}`;
  }
  const seg = /^\d+$/.test(String(n)) ? n : customSegment(n);
  return `${vaHref("grade", grade, "lesson", seg, lesson ? String(lesson).toLowerCase() : "")}?grades=${labBandOfGrade(grade)}${vq ? `&${vq}` : ""}`;
}

/** App-relative path to a whole unit (a group of lessons) or one of its activities: "", "crossword", "vault" or "test". */
export function unitAssignmentPath({ grade, u, activity = "" }) {
  return `${vaHref("grade", grade, "unit", Number(u), activity)}?grades=${labBandOfGrade(grade)}`;
}

/** How many words of a practice set fit in one assignment link. */
export const fitsSet = (ids, grade = "6") => {
  let n = Math.min(ids.length, MAX_SET_WORDS);
  while (n > 0 && !PATH_OK.test(assignmentPath({ grade, set: ids.slice(0, n) }))) n -= 1;
  return n;
};

/**
 * Read an assignment path back, or null when it is not ours:
 *   { kind: "lesson"|"section", grade, n, lesson, set, variant, band }   a lesson, or one section (a–h) of it
 *   { kind: "unit", grade, u, activity, band }                          a unit, or its crossword / test
 *   { kind: "practice", set, band, variant }
 */
export function parseAssignmentPath(path) {
  let url;
  try {
    url = new URL(String(path || ""), "https://lab.invalid");
  } catch {
    return null;
  }
  const segs = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const at = segs.indexOf(VA_ROUTE);
  if (at < 0) return null;
  const rest = segs.slice(at + 1);
  const band = url.searchParams.get("grades") || "";
  const variant = parseVariant(url.search);
  if (rest[0] === "practice")
    return {
      kind: "practice",
      set: (url.searchParams.get("set") || "").split(",").filter(Boolean),
      band,
      variant,
    };
  if (rest[0] === "grade" && rest[2] === "unit" && /^\d+$/.test(rest[3] || ""))
    return { kind: "unit", grade: rest[1], u: Number(rest[3]), activity: rest[4] || "", band };
  if (rest[0] === "grade" && rest[2] === "lesson" && rest[3]) {
    const lesson = rest[4] || "";
    return {
      kind: lesson ? "section" : "lesson",
      grade: rest[1],
      n: /^\d+$/.test(rest[3]) ? Number(rest[3]) : customIdFromSegment(rest[3]),
      lesson,
      set: [],
      band,
      variant,
    };
  }
  return null;
}
export const isVocabAcademyAssignment = (a) => Boolean(parseAssignmentPath(a?.path));

/** Which of these assignments are ours, with their parsed stop. */
export const vocabAcademyAssignments = (list = []) =>
  list.map((a) => ({ a, p: parseAssignmentPath(a?.path) })).filter((x) => x.p);

const clip = (text, n) => (text.length > n ? `${text.slice(0, n - 1).trimEnd()}…` : text);

/**
 * Assignable rows for one unit: the whole unit and each lesson A-H, shaped like src/class/assign.js rows so
 * toAssignment(row) and the lab's band helpers work unchanged. `groupLabel` names a differentiated version.
 */
export function assignableStops({ unit, variant = null, groupLabel = "" }) {
  const grade = String(unit.grade);
  const vq = typeof variant === "string" ? variant : variant ? encodeVariant(variant) : "";
  const tag = groupLabel ? ` · ${clip(groupLabel, 16)}` : vq ? " · alt" : "";
  const key = unit.custom ? unit.id : unit.n;
  const head = `Vocab Academy G${grade} ${unit.custom ? "custom" : `L${unit.n}`}`;
  const stop = (lesson, label) => {
    const spec = { grade, n: key, lesson, variant: vq };
    return {
      id: assignmentId(spec),
      title: clip(`${head}: ${unit.title}${label}${tag}`, 80),
      path: assignmentPath(spec),
      band: labBandOfGrade(grade),
      unit: true,
      kind: lesson ? "section" : "lesson",
      grade,
      n: key,
      lesson,
    };
  };
  return [
    stop("", ""),
    ...LESSONS.map((l) => stop(l.id, ` · ${sectionTitle(l.id, unit.custom ? "" : unit.n)[0]}`)),
  ];
}

/** Assignable rows for one unit (a group of lessons): the unit page, its crossword, its Word Vault and its unit test. */
export function unitStops({ grade, u, first, last }) {
  const g = String(grade);
  const span = `Lessons ${first}-${last}`;
  const row = (activity, label) => ({
    id: `va-g${slug(g)}-unit${u}${activity ? `-${activity}` : ""}`,
    title: clip(`Vocab Academy G${g} Unit ${u} (${span})${label}`, 80),
    path: unitAssignmentPath({ grade: g, u, activity }),
    band: labBandOfGrade(g),
    unit: true,
    kind: "unit",
    grade: g,
    u,
    activity,
  });
  return [
    row("", ""),
    row("crossword", " · Crossword"),
    ...EXTRAS.map((x) => row(x.id, ` · ${x.title[0]}`)),
    row("test", " · Unit test"),
  ];
}

/** A follow-up practice row for chosen word ids (SPEC §10: vocabulary-academy/practice?set=<ids>). */
export function practiceStop({ ids, grade, variant = null, label = "Follow-up practice" }) {
  const set = ids.slice(0, fitsSet(ids, grade));
  const vq = typeof variant === "string" ? variant : variant ? encodeVariant(variant) : "";
  return {
    id: assignmentId({ set, variant: vq }),
    title: clip(`Vocab Academy G${grade}: ${label} (${set.length} words)`, 80),
    path: assignmentPath({ grade, set, variant: vq }),
    band: labBandOfGrade(grade),
    unit: true,
    kind: "practice",
    grade: String(grade),
    set,
  };
}

/** A copy of an assignment with a different supports override and/or a smaller word set (same unit, same grade). */
export function differentiate(assignment, { variant, groupLabel = "" }) {
  const p = parseAssignmentPath(assignment.path);
  if (!p || p.kind === "practice" || p.kind === "unit") return null;
  const vq = encodeVariant(variant || {});
  const spec = { grade: p.grade, n: p.n, lesson: p.lesson, variant: vq };
  const base = String(assignment.title || "").replace(/ · (alt|.{1,16})$/, "");
  return {
    id: assignmentId(spec),
    title: clip(`${base} · ${clip(groupLabel || "alt", 16)}`, 80),
    path: assignmentPath(spec),
    due: assignment.due ?? null,
  };
}

/** Add rows to the class's current assignments: deduped by id, valid per the server rules, at most LIMITS.maxAssignments. */
export function mergeAssignments(current = [], rows = [], due = null) {
  const list = current.map((a) => ({ id: a.id, title: a.title, path: a.path, due: a.due ?? null }));
  const skipped = [];
  const added = [];
  for (const row of rows) {
    const a = "band" in row ? { ...toAssignment(row), due: due || null } : row;
    if (!ID_OK.test(a.id)) skipped.push({ id: a.id, reason: "bad-id" });
    else if (!PATH_OK.test(a.path)) skipped.push({ id: a.id, reason: "path-too-long" });
    else if (list.some((x) => x.id === a.id))
      skipped.push({ id: a.id, reason: "already-assigned" });
    else if (list.length >= LIMITS.maxAssignments) skipped.push({ id: a.id, reason: "class-full" });
    else {
      list.push(a);
      added.push(a);
    }
  }
  return { list, added, skipped };
}

export { assignmentBand };
