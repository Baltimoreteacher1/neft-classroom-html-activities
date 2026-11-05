// Family practice sessions: short, purposeful sets built from the lab's existing activities and the
// practice already saved on this device. Reuses buildPracticePlan (unfinished work first, then retries,
// then new work, skills spread evenly); this file only trims the result to a time estimate and names it.
// Minutes are estimates for choosing a session, never a countdown.
import { estimateMinutes } from "../learning.js";
import { buildPracticePlan } from "../practice-plan.js";
import { allRecords, loadRecord } from "../store.js";
import { loadLedger } from "../lang/ledger.js";
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

const domainPlan = (rows, focus, tiers, recordFor, review) =>
  buildPracticePlan(rows, { focus, count: 6, tiers, ...(review ? { review } : {}) }, recordFor);

/** Device-local evidence for the same due-review engine used by the learner home. */
export function localReviewContext(band, now = Date.now()) {
  const ledger = loadLedger();
  const records = allRecords().filter((row) => row.band === band);
  return {
    entries: ledger.entries.filter((entry) => entry.band === band),
    records: Object.fromEntries(
      records.map((row) => [`${row.domain}:${row.level}`, { domain: row.domain, results: row.record.results }]),
    ),
    now,
  };
}

/**
 * Every session choice the planner can offer, each a list of activity rows (possibly empty).
 * `recordFor(row)` returns a saved record; the default reads this device.
 */
export function sessionOptions({ rows, band, minutes = 0, tiers = {}, review = localReviewContext(band), recordFor = (r) => loadRecord(r.band, r.domain, r.level) }) {
  const balanced = domainPlan(rows, "balanced", tiers, recordFor, review);
  const byDomain = Object.fromEntries(CORE_DOMAINS.map((d) => [d, domainPlan(rows, d, tiers, recordFor, review)]));
  const pool = CORE_DOMAINS.flatMap((d) => byDomain[d]);
  const firsts = CORE_DOMAINS.map((d) => byDomain[d][0]).filter(Boolean);
  const history = hasHistory(band);
  const recommended = trimToMinutes(balanced, minutes);
  return {
    history,
    recommended,
    oneSkill: Object.fromEntries(CORE_DOMAINS.map((d) => [d, trimToMinutes(byDomain[d], minutes)])),
    allFour: firsts,
    continue: pool.filter((r) => r.status === "draft"),
    review: pool.filter((r) => ["retry", "revisit", "review"].includes(r.status)),
    retrievalCount: recommended.filter((r) => r.status === "review").length,
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
