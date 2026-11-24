// BCPSS unit work as class assignments: the ONE place that decides what an assignable item is, which link a student
// opens, and which assignment id names it. Pure functions (no DOM, no network). The teacher shelf builds items with
// these; the student player and Writing Lab use `matchIds` to find "is this page an assignment of my class?".
//
// An assignment is { id, title, path } plus the optional due/availableFrom the class API already validates. The id is
// `<kind>:<unit>[:<detail>][:<level>]` and must satisfy the class contract (lowercase, <= 40 chars); the path is an
// app-relative link, so a student opens exactly what the teacher clicked on the shelf.

export const LEVELS = Object.freeze(["l1_2", "l3_4", "l5_6"]);
export const LEVEL_NAMES = Object.freeze({ l1_2: "Starter", l3_4: "Core", l5_6: "Stretch" });

const ID_RE = /^[a-z0-9][a-z0-9:_-]{0,39}$/;
const UNIT_RE = /^g(k|[1-8])-(ela|math|sci|ss)-u\d{1,2}$/;
const LESSON_RE = /^g(?:k|[1-8])-(?:ela|math|sci|ss)-u\d{1,2}-l\d{2}$/;
const PART_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LEVEL_SUFFIX = /:l\d_\d$/;

export const STUDIO_PATH = "/bcpss-teachers/language-studio/";
export const WRITING_PATH = "/bcpss-teachers/writing-lab/";
export const EXPORT_PATH = "/api/bcpss/export/";

export const KIND_LABELS = Object.freeze({
  su: "Language Studio",
  sa: "Activity",
  wl: "Writing Lab",
  ls: "Lesson",
  pr: "Printable page",
});

const SUBJECT_TEXT = { ela: "ELA", math: "Math", sci: "Science", ss: "Social Studies" };

/** "Gr 6 ELA U1" from a unit id, or "" when the id is not a BCPSS unit. */
export function unitLabel(unitId) {
  const m = /^g(k|[1-8])-(ela|math|sci|ss)-u(\d{1,2})$/.exec(String(unitId || ""));
  return m ? `${m[1] === "k" ? "K" : `Gr ${m[1]}`} ${SUBJECT_TEXT[m[2]]} U${m[3]}` : "";
}

const level = (value) => (LEVELS.includes(value) ? value : "");
const withLevel = (id, lv) => (lv ? `${id}:${lv}` : id);
const clip = (text, max = 80) => {
  const s = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
};
const query = (pairs) =>
  new URLSearchParams(pairs.filter(([, v]) => v !== "" && v != null)).toString();

function need(ok, what) {
  if (!ok) throw new Error(`bcpss-assignments: invalid ${what}`);
}

function finish({ id, title, path, kind }) {
  need(ID_RE.test(id), `assignment id "${id}"`);
  return { id, kind, title: clip(title), path };
}

/** Every Language Studio activity of a unit, as one assignment ("Gr 6 ELA U1 · Language Studio"). */
export function studioItem(unitId, { title = "Language Studio", level: lv } = {}) {
  need(UNIT_RE.test(unitId), "unit");
  const l = level(lv);
  return finish({
    kind: "su",
    id: withLevel(`su:${unitId}`, l),
    title: `${unitLabel(unitId)} · ${title}`,
    path: `${STUDIO_PATH}?${query([
      ["unit", unitId],
      ["level", l],
    ])}`,
  });
}

/** One activity (1-based `index`) of the unit's Language Studio. */
export function activityItem(unitId, index, { title = "", level: lv } = {}) {
  need(UNIT_RE.test(unitId), "unit");
  need(Number.isInteger(index) && index >= 1 && index <= 99, "activity number");
  const l = level(lv);
  return finish({
    kind: "sa",
    id: withLevel(`sa:${unitId}:${index}`, l),
    title: `${unitLabel(unitId)} · ${title || `Activity ${index}`}`,
    path: `${STUDIO_PATH}?${query([
      ["unit", unitId],
      ["a", String(index)],
      ["level", l],
    ])}`,
  });
}

/** The unit's Writing Lab (Writing Revolution path). */
export function writingItem(unitId, { title = "", level: lv } = {}) {
  need(UNIT_RE.test(unitId), "unit");
  const l = level(lv);
  return finish({
    kind: "wl",
    id: withLevel(`wl:${unitId}`, l),
    title: `${unitLabel(unitId)} · Writing Lab${title ? ` · ${title}` : ""}`,
    path: `${WRITING_PATH}?${query([
      ["unit", unitId],
      ["level", l],
    ])}`,
  });
}

/** One lesson of the unit, opened in the student view. */
export function lessonItem(lessonId, { title = "", level: lv } = {}) {
  need(LESSON_RE.test(lessonId), "lesson");
  const unitId = lessonId.replace(/-l\d{2}$/, "");
  const l = level(lv);
  return finish({
    kind: "ls",
    id: withLevel(`ls:${lessonId}`, l),
    title: `${unitLabel(unitId)} · ${title || `Lesson ${lessonId.slice(-2)}`}`,
    path: `${STUDIO_PATH}?${query([
      ["unit", unitId],
      ["lesson", lessonId],
      ["view", "student"],
      ["level", l],
    ])}`,
  });
}

/** A printable part (book, activity-3, writing, …) opened as a web page; `wida` is "1_2" | "3_4" | "5_6". */
export function printableItem(unitId, part, wida, { title = "" } = {}) {
  need(UNIT_RE.test(unitId), "unit");
  need(PART_RE.test(part) && part.length <= 14, "printable part");
  need(LEVELS.includes(`l${wida}`), "printable level");
  return finish({
    kind: "pr",
    id: `pr:${unitId}:${part}:${wida}`,
    title: `${unitLabel(unitId)} · ${title || part}`,
    path: `${EXPORT_PATH}${unitId}?${query([
      ["format", "html"],
      ["part", part],
      ["wida", wida],
    ])}`,
  });
}

/** The class API's assignment, from an item and the teacher's optional dates. */
export function toClassAssignment(item, { due, availableFrom } = {}) {
  return {
    id: item.id,
    title: item.title,
    path: item.path,
    due: due || null,
    ...(availableFrom ? { availableFrom } : {}),
  };
}

/** The id without its trailing level, so a learner who switches level still matches the assignment. */
export const baseId = (id) => String(id || "").replace(LEVEL_SUFFIX, "");

/**
 * Base ids that make the page at `pathname` + `search` count as assigned work: its own item first, then the wider item
 * that contains it (an activity is part of its unit's Language Studio). Empty for any other page.
 */
export function matchIds(pathname, search) {
  const p = new URLSearchParams(search || "");
  const unit = p.get("unit") || "";
  if (!UNIT_RE.test(unit)) return [];
  if (pathname.startsWith(WRITING_PATH)) return [`wl:${unit}`];
  if (!pathname.startsWith(STUDIO_PATH)) return [];
  const lesson = (p.get("lesson") || "").toLowerCase();
  if (lesson) return LESSON_RE.test(lesson) ? [`ls:${lesson}`] : [];
  const a = Number.parseInt(p.get("a") || "", 10);
  return Number.isInteger(a) && a >= 1 ? [`sa:${unit}:${a}`, `su:${unit}`] : [`su:${unit}`];
}

/** The class assignment that covers this page, or null. The most specific item wins. */
export function assignmentFor(assignments, pathname, search) {
  const byBase = new Map();
  for (const a of assignments || []) if (!byBase.has(baseId(a.id))) byBase.set(baseId(a.id), a);
  for (const id of matchIds(pathname, search)) if (byBase.has(id)) return byBase.get(id);
  return null;
}

/** The BCPSS unit a saved assignment link belongs to ("g6-ela-u1"), or "" for any other link. */
export function bcpssUnitOf(path) {
  const text = String(path || "");
  if (!text.startsWith("/bcpss-teachers/") && !text.startsWith(EXPORT_PATH)) return "";
  const m = /(?:[?&]unit=|\/export\/)(g(?:k|[1-8])-(?:ela|math|sci|ss)-u\d{1,2})(?![\w-])/.exec(
    text,
  );
  return m ? m[1] : "";
}

/** Absolute student link for an item. */
export const studentUrl = (item, origin) => `${origin}${item.path}`;

/** Google Classroom's "share to class" link for an item: opens Classroom with the title and link filled in. */
export const googleClassroomUrl = (item, origin) =>
  `https://classroom.google.com/share?${new URLSearchParams({ url: studentUrl(item, origin), title: item.title })}`;
