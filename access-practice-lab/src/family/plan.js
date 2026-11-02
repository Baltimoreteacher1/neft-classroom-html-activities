// Family practice sessions: short, purposeful sets built from the lab's existing activities and the
// practice already saved on this device. Reuses buildPracticePlan (unfinished work first, then retries,
// then new work, skills spread evenly); this file only trims the result to a time estimate and names it.
// Minutes are estimates for choosing a session, never a countdown.
import { estimateMinutes } from "../learning.js";
import { buildPracticePlan } from "../practice-plan.js";
import { allRecords, loadRecord } from "../store.js";
import { BASE, CORE_DOMAINS } from "../util.js";

export const DEFAULT_MINUTES = 10;
/** A session may run a little over its target; the first activity is always kept. */
const SLACK = { 5: 2, 10: 3, 15: 4 };

/** True once any activity on this device has a saved result or completion for the grade group. */
export const hasHistory = (band) =>
  allRecords().some((r) => r.band === band && (r.record.complete.length > 0 || Object.keys(r.record.results).length > 0));

/** Keep activities, in priority order, until the time estimate is reached. */
export function trimToMinutes(list, minutes) {
  const target = minutes || DEFAULT_MINUTES;
  const cap = target + (SLACK[target] ?? 3);
  const out = [];
  let total = 0;
  for (const row of list) {
    const m = estimateMinutes([row]);
    if (out.length && total + m > cap) continue;
    out.push(row);
    total += m;
    if (total >= target) break;
  }
  return out;
}

const domainPlan = (rows, focus, tiers, recordFor) => buildPracticePlan(rows, { focus, count: 6, tiers }, recordFor);

/**
 * Every session choice the planner can offer, each a list of activity rows (possibly empty).
 * `recordFor(row)` returns a saved record; the default reads this device.
 */
export function sessionOptions({ rows, band, minutes = 0, tiers = {}, recordFor = (r) => loadRecord(r.band, r.domain, r.level) }) {
  const balanced = domainPlan(rows, "balanced", tiers, recordFor);
  const byDomain = Object.fromEntries(CORE_DOMAINS.map((d) => [d, domainPlan(rows, d, tiers, recordFor)]));
  const pool = CORE_DOMAINS.flatMap((d) => byDomain[d]);
  const firsts = CORE_DOMAINS.map((d) => byDomain[d][0]).filter(Boolean);
  const history = hasHistory(band);
  return {
    history,
    recommended: trimToMinutes(balanced, minutes),
    oneSkill: Object.fromEntries(CORE_DOMAINS.map((d) => [d, trimToMinutes(byDomain[d], minutes)])),
    allFour: firsts,
    continue: pool.filter((r) => r.status === "draft"),
    review: pool.filter((r) => ["retry", "revisit", "review"].includes(r.status)),
  };
}

export const sessionMinutes = (plan) => estimateMinutes(plan);

/** A playlist URL the activity player understands. Never carries a response. */
export const playlistHref = (plan, title, band) =>
  `${BASE}/play?${new URLSearchParams({ ids: plan.map((r) => r.id).join(","), t: title, grades: band })}`;

/** Typical activity length (minutes) in one skill, for the skill cards. */
export function typicalMinutes(rows, domain) {
  const list = rows.filter((r) => r.domain === domain && r.level === "A").map((r) => estimateMinutes([r])).sort((a, b) => a - b);
  return list.length ? list[Math.floor(list.length / 2)] : 5;
}
