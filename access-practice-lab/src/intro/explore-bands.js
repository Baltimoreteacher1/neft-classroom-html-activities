// The four activities a teacher explores for a grade choice (one per language domain, from BAND_TOUR in
// tour-bands.js), in the one shape the exploration page and the Quick Guide both read. Grades 6–8 Speaking and Writing
// are the curated activities in data.js, so they keep their own wording, preview and links.
// Pure: no DOM, so the document generator imports it in Node.
import { ACTIVITY_BY_ID, EXPLORE_SEQUENCE } from "./data.js";
import { PLAN_SAMPLES } from "./explore-data.js";
import { DOMAINS, tourActivity, tourRoute } from "./tour-bands.js";

/** The exploration steps: the first now offers the four domains instead of speaking or writing. */
export const EXPLORE_STEPS = EXPLORE_SEQUENCE.map((s) =>
  s.id === "focus" ? { ...s, detail: "Listening, speaking, reading or writing." } : s,
);

/**
 * The "What to try" row of the printed Quick Guide: whole steps, in order, while the row stays short enough for one
 * Letter page (at least one step; the lab's "if a skill lesson opens first" step is skipped). The exploration page
 * shows every step.
 */
function printedTry(steps, max = 150) {
  const real = steps.filter((x) => !/^If (a|the) short skill lesson opens/.test(x));
  const out = [real[0]];
  for (const step of real.slice(1)) {
    if (`${out.join(" ")} ${step}`.length > max) break;
    out.push(step);
  }
  return out.join(" ");
}

/** One explore activity. `route` is the lab route to open (with the grade), `curated` the data.js entry if any. */
export function exploreActivity(pick, domainId) {
  const a = tourActivity(pick, domainId);
  if (!a) return null;
  const curated = ACTIVITY_BY_ID[a.id] || null;
  const base = {
    id: a.id,
    pick,
    domain: a.domain,
    cls: a.domain.cls,
    icon: a.domain.icon,
    name: a.title,
    where: `${a.domain.studio} · ${a.level}`,
    minutes: a.minutes,
    time: `${a.minutes} min`,
    does: a.students,
    steps: a.steps,
    tryNow: printedTry(a.steps),
    classroomUse: a.use,
    notice: a.notice,
    supports: a.supports.map(([, label]) => label),
    sample: a.sample || "",
    route: tourRoute(a),
    plan: PLAN_SAMPLES[a.id],
    curated,
  };
  if (!curated) return base;
  // Curated activities keep the wording, the preview and the plain link the rest of the introduction uses.
  return {
    ...base,
    name: curated.name,
    where: curated.where,
    time: curated.time,
    does: curated.does,
    tryNow: curated.tryNow,
    classroomUse: curated.classroomUse,
    route: curated.route,
  };
}

/** The four activities for a grade choice, in domain order (Listening, Speaking, Reading, Writing). */
export const exploreActivities = (pick) =>
  DOMAINS.map((d) => exploreActivity(pick, d.id)).filter(Boolean);
