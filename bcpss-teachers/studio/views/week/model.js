// "My Week" view model: no DOM, so Node tests can import it. URL building and labels only; the plan itself comes
// from /api/bcpss/week-plan (shared/planner does the work server side, so a shared link regenerates the same plan).
import { encodeParams, shareHash } from "../../../../shared/planner/params.js";
import { dateLabel } from "../../../../shared/planner/render.js";

export const API_PATH = "/api/bcpss/week-plan";
export const SUBJECT_OPTIONS = Object.freeze([
  { id: "math", api: "Math", label: "Math" },
  { id: "ela", api: "ELA", label: "ELA" },
  { id: "sci", api: "Science", label: "Science" },
  { id: "ss", api: "Social Studies", label: "Social Studies" },
]);
export const GRADE_OPTIONS = Object.freeze(["K", "1", "2", "3", "4", "5", "6", "7", "8"]);
const UNIT_ID = /^g(k|[1-8])-(ela|math|sci|ss)-u\d+$/;

/** "g6-math-u1" -> { grade: "6", subject: "math" }; null for an id the picker cannot place. */
export function facetsOf(unitId) {
  const m = UNIT_ID.exec(unitId || "");
  return m ? { grade: m[1].toUpperCase() === "K" ? "K" : m[1], subject: m[2] } : null;
}

export const apiUrl = (params, format = "json") => `${API_PATH}?${encodeParams(params)}&format=${format}`;
export const linkFor = (params, origin, pathname) => `${origin}${pathname}${shareHash(params)}`;

export function dayHeading(day) {
  const when = day.date ? ` · ${dateLabel(day.date)}` : "";
  return `Day ${day.day}${when} · ${day.minutes} of ${day.cap} minutes`;
}

export function summaryLine(plan) {
  const s = plan.summary;
  const n = plan.dropped.length;
  return `Planned ${s.plannedMinutes} of ${s.capacity} minutes. Median ${s.medianDayMinutes} minutes a day. ${n} ${n === 1 ? "item" : "items"} dropped.`;
}
