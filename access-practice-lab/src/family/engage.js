// Engagement without pressure: one family challenge a week, and recognition for effort.
// The challenge is the current Road to ACCESS week (its authored family prompt and playlist); nothing is
// invented here. Recognition rewards trying, explaining, retrying and revising, never speed or streaks, and
// nothing is ever lost or taken away. None of it is an official ACCESS achievement or a measure of ability.
import { CORE_DOMAINS } from "../util.js";

/** The week whose start date is the latest one not after `today` (ISO), or the first week. */
export function weekFor(plan, today) {
  const weeks = plan?.weeks || [];
  if (!weeks.length) return null;
  let pick = weeks[0];
  for (const w of weeks) if (w.start <= today) pick = w;
  return pick;
}

/** @param entries allRecords() output; done = how many of this week's activities are completed on this device */
export function weeklyChallenge(plan, entries, today) {
  const week = weekFor(plan, today);
  if (!week) return null;
  const completed = new Set(entries.flatMap((e) => e.record.complete));
  const ids = week.activities || [];
  return {
    n: week.n,
    theme: week.theme || "",
    taskType: week.taskType || "",
    prompt: week.family || null,
    ids,
    total: ids.length,
    done: ids.filter((id) => completed.has(id)).length,
  };
}

/**
 * Recognition earned so far, from a summarize() result. Each item is something the saved work shows.
 * `kind` picks the wording (strings.js `recog.<kind>`); `domain` is set for per-skill items.
 */
export function recognition(summary) {
  const out = [];
  for (const d of CORE_DOMAINS) if (summary.byDomain[d].tried > 0) out.push({ kind: "first", domain: d });
  if (CORE_DOMAINS.every((d) => summary.byDomain[d].tried > 0)) out.push({ kind: "allFour" });
  if (summary.dayCount >= 3) out.push({ kind: "days" });
  if (summary.help >= 1) out.push({ kind: "retry" });
  if (summary.revised >= 1) out.push({ kind: "revised" });
  return out;
}

/** The next thing that would be recognised, so a family has something kind to aim for. Null when all are earned. */
export function nextRecognition(summary) {
  const earned = recognition(summary);
  const has = (kind, domain) => earned.some((r) => r.kind === kind && (!domain || r.domain === domain));
  const untried = CORE_DOMAINS.find((d) => !has("first", d));
  if (untried) return { kind: "first", domain: untried };
  for (const kind of ["days", "retry", "revised"]) if (!has(kind)) return { kind };
  return null;
}
