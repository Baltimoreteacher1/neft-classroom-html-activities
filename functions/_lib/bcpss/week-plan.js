// "My Week" planner, server side: gathers a unit's candidate pool (ESOL pack week, Studio activities, lessons) and runs
// the shared pure planner. Stateless: the plan is a function of the query parameters (and the optional pacing calendar).
import { pickDates } from "../../../shared/planner/calendar.js";
import { buildCandidates } from "../../../shared/planner/candidates.js";
import { PlannerError, planWeek } from "../../../shared/planner/solve.js";
import { getUnitDetail } from "./db.js";
import { loadLessons } from "./lessons.js";

export const PACING_BASELINE_PATH = "/data/pacing-baseline-2026-27.json";

/** -> { unit, candidates } or null when the unit does not exist. */
export async function loadWeekInputs(env, unitId) {
  const { detail } = await getUnitDetail(env, unitId);
  if (!detail?.unit) return null;
  const lessonSet = await loadLessons(unitId);
  const u = detail.unit;
  return {
    unit: { id: u.id, title: u.unit_title, grade: u.grade, subject: u.subject },
    candidates: buildCandidates({
      pack: detail.esol_pack,
      studio: detail.studio,
      lessons: lessonSet?.lessons || [],
    }),
  };
}

/** The district pacing calendar's days[], read from the site's own static asset (functions cannot import JSON). */
export async function loadPacingDays(env, origin) {
  if (typeof env?.ASSETS?.fetch !== "function")
    throw new PlannerError("pacing calendar is not available here");
  const res = await env.ASSETS.fetch(new Request(new URL(PACING_BASELINE_PATH, origin)));
  if (!res.ok) throw new PlannerError(`pacing calendar did not load (${res.status})`);
  const baseline = await res.json();
  if (!Array.isArray(baseline.days)) throw new PlannerError("pacing calendar has no days");
  return baseline.days;
}

/**
 * -> { ok:true, plan } | { ok:false, status, error }.
 * `pacingDays` is the calendar's days[] when params.cal, else ignored.
 */
export async function buildWeekPlan(env, params, { pacingDays = null } = {}) {
  const inputs = await loadWeekInputs(env, params.unit);
  if (!inputs) return { ok: false, status: 404, error: `Unit "${params.unit}" not found.` };
  let dates = null;
  if (params.start) {
    dates = pickDates(params.cal ? pacingDays : null, params.start, params.days);
    if (!dates) {
      return {
        ok: false,
        status: 422,
        error: `The pacing calendar has fewer than ${params.days} teaching days from ${params.start}.`,
      };
    }
  }
  return { ok: true, plan: planWeek(inputs.candidates, params, { unit: inputs.unit, dates }) };
}
