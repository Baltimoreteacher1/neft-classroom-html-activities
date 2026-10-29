// Family Trip: one skill, six stops, one short session per stop, in order. A stop is the planner's next
// set for that skill (unfinished work first), frozen when the stop begins so it does not shuffle while the
// family works through it. Everything is read from saved practice on this device; stops are finished
// practice, never a score or a level.
import { isActivityComplete, loadRecord } from "../store.js";
import { CORE_DOMAINS } from "../util.js";
import { sessionOptions } from "./plan.js";

export { TRIP_STOPS } from "./state.js";

const savedRecord = (r) => loadRecord(r.band, r.domain, r.level);

/** The skill with the smallest share of finished activities on this device. Ties keep skill order. */
export function suggestSkill(rows, recordFor = savedRecord) {
  const cache = new Map();
  const record = (r) => {
    const key = `${r.band}|${r.domain}|${r.level}`;
    if (!cache.has(key)) cache.set(key, recordFor(r));
    return cache.get(key);
  };
  const share = Object.fromEntries(CORE_DOMAINS.map((d) => [d, { done: 0, total: 0 }]));
  for (const r of rows) {
    if (!share[r.domain]) continue;
    share[r.domain].total++;
    if (isActivityComplete(record(r), r.id)) share[r.domain].done++;
  }
  const ratio = (d) => (share[d].total ? share[d].done / share[d].total : 1);
  return CORE_DOMAINS.reduce((best, d) => (ratio(d) < ratio(best) ? d : best), CORE_DOMAINS[0]);
}

/** Activity ids for the next stop of a trip in `skill`. */
export function nextStopIds({ rows, band, skill, minutes = 0, tiers = {}, recordFor = savedRecord }) {
  return sessionOptions({ rows, band, minutes, tiers, recordFor }).oneSkill[skill].map((r) => r.id);
}

/** Where the current stop stands: how many of its activities are finished, and whether the stop is. */
export function stopProgress(ids, rows, recordFor = savedRecord) {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const done = ids.filter((id) => byId.has(id) && isActivityComplete(recordFor(byId.get(id)), id)).length;
  return { done, total: ids.length, finished: ids.length > 0 && done === ids.length };
}
