// Outlook: everything the studio can honestly say about what comes next for one student, in three labelled
// kinds. (1) a validated forecast range, only when the engine's held-out validation passes; (2) WIDA's
// MODEL-to-ACCESS concordance estimate, only when that table applies; (3) goal math: the yearly change needed
// to reach a goal level by a chosen year. Goal math is arithmetic on the teacher's goal, never a prediction.
import { concordanceFor } from "./concordance.js";
import { nextYear } from "./forecast.js";
import { recordsOf } from "./records.js";

/** Yearly change needed to move from `from` to `goal` between two school years ("2024-25" -> "2026-27"). */
export function goalMath(from, goal, fromYear, byYear) {
  if (from == null || goal == null || !fromYear || !byYear) return null;
  const years = Number(byYear.slice(0, 4)) - Number(fromYear.slice(0, 4));
  if (years < 1) return null;
  const total = Math.round((goal - from) * 10) / 10;
  // Levels before and after the 2025-26 revision (and the 2026 cut scores) are not the same measure.
  const crossesChange = fromYear < "2025-26" && byYear >= "2025-26";
  return { years, total, perYear: Math.round((total / years) * 100) / 100, reached: total <= 0, crossesChange };
}

/** The default goal: the next whole level above the latest overall (capped at 6), or the teacher's target. */
export const defaultGoal = (overall, target) => target ?? (overall == null ? null : Math.min(6, Math.floor(overall) + 1));

export function outlookFor(ws, st) {
  const recs = recordsOf(st);
  const access = recs.filter((r) => r.assessmentType === "ACCESS").at(-1) || null;
  const model = recs.filter((r) => r.assessmentType.startsWith("MODEL")).at(-1) || null;
  const fc = ws.forecast(st, "Overall", ws.state.targets.Overall ?? null);
  const conc = model ? concordanceFor(model) : null;
  const overall = access?.composites.Overall.level ?? null;
  const goal = defaultGoal(overall, ws.state.goalsMath?.[st.id]?.goal ?? null);
  const byYear = ws.state.goalsMath?.[st.id]?.by || (access ? nextYear(nextYear(access.academicYear)) : null);
  return {
    access,
    model,
    forecast: fc.status === "validated" ? fc : null,
    forecastWhy: fc.status === "validated" ? "" : fc.plain,
    concordance: conc?.status === "available" ? conc : null,
    goal,
    byYear,
    math: access ? goalMath(overall, goal, access.academicYear, byYear) : null,
  };
}
