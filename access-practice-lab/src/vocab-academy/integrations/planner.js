// Vocabulary Academy · Lesson Planner side: put a unit, or one lesson letter of a unit, into the instructional
// sequence a teacher is building. The lab's sequence builders are the Lesson Builder's lesson (ordered phases) and its
// five-day week (src/lesson-builder/*); a class assignment (path `vocabulary-academy/grade/<G>/lesson/<N>[/<letter>]`) is
// the Teacher area's assign.js. This module only adds a labelled step with a real link to those existing structures:
// it keeps no plan of its own.
import { LESSONS, sectionTitle } from "../contract.js";
import { lessonHref } from "../data.js";

const clean = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const LETTER = new Set(LESSONS.map((l) => l.id));

/** `{ title, href, letter }` for a whole lesson (`letter` empty) or one section of it. Null when it is unusable. */
export function planStep(unit, letter = "") {
  const g = clean(unit?.grade, 4);
  const n = Number(unit?.n);
  const lesson = String(letter || "").toLowerCase();
  if (!g || !Number.isInteger(n) || n < 1 || (lesson && !LETTER.has(lesson))) return null;
  const lessonName = LESSONS.find((l) => l.id === lesson);
  const title = `Vocabulary Academy · ${g === "K" ? "Kindergarten" : `Grade ${g}`} Lesson ${n}: ${clean(unit.title, 80)}`;
  return {
    title: lessonName ? `${title} · ${sectionTitle(lesson, n)[0]}` : title,
    href: lessonHref(g, n, lesson),
    letter: lesson,
  };
}

const absolute = (href, origin) => (origin ? `${origin}${href}` : href);

/** Add the step to one phase of a Lesson Builder lesson (teacher directions; the teacher can edit the line). */
export function addStepToPhase(lesson, phaseKey, step, { origin = "" } = {}) {
  const phase = lesson?.phases?.find((p) => p.key === phaseKey);
  if (!phase || !step) return { ok: false, reason: "no-phase" };
  const url = absolute(step.href, origin);
  if (String(phase.teacher || "").includes(url)) return { ok: true, added: false };
  phase.teacher = `${String(phase.teacher || "").trimEnd()}\n${step.title}: ${url}`.slice(0, 2000);
  phase.edited = true;
  return { ok: true, added: true };
}

/** Add the step to a day of a Lesson Builder week (shown under that day on screen and in print). */
export function addStepToDay(week, dayIndex, step) {
  const day = week?.days?.[dayIndex];
  if (!day || !step) return { ok: false, reason: "no-day" };
  const list = Array.isArray(day.va) ? day.va : (day.va = []);
  if (list.some((s) => s.href === step.href)) return { ok: true, added: false };
  list.push({ title: step.title, href: step.href });
  return { ok: true, added: true };
}
