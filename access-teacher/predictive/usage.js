// Practice usage from the lab's practice ledger (real students: the Teacher Hub roster's ledger; the sample
// class: synthetic entries). Counts and shares only: practice evidence is never turned into a level or score.
import { DOMAINS } from "./rules.js";

const WEEK = 7 * 864e5;
const mondayOf = (t) => {
  const d = new Date(t);
  const day = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
};
const short = (t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** Weekly practice counts by domain over the most recent `max` weeks with any activity span. */
export function weeklyActivity(entries = [], { max = 16 } = {}) {
  const times = entries.map((e) => Date.parse(e.t)).filter(Number.isFinite);
  if (!times.length) return [];
  const last = mondayOf(Math.max(...times));
  const first = Math.max(mondayOf(Math.min(...times)), last - (max - 1) * WEEK);
  const weeks = [];
  for (let w = first; w <= last; w += WEEK) weeks.push({ start: w, label: short(w), byDomain: {} });
  for (const e of entries) {
    const t = Date.parse(e.t);
    if (!Number.isFinite(t) || !DOMAINS.includes(e.domain)) continue;
    const wk = weeks.find((x) => mondayOf(t) === x.start);
    if (wk) wk.byDomain[e.domain] = (wk.byDomain[e.domain] || 0) + 1;
  }
  return weeks;
}

/** Headline usage numbers for one or many students. */
export function usageSummary(entries = []) {
  const times = entries.map((e) => Date.parse(e.t)).filter(Number.isFinite);
  const byDomain = Object.fromEntries(DOMAINS.map((d) => [d, entries.filter((e) => e.domain === d).length]));
  const independent = entries.filter((e) => e.stage === "independent").length;
  return {
    total: entries.length,
    weeks: new Set(times.map(mondayOf)).size,
    last: times.length ? new Date(Math.max(...times)) : null,
    byDomain,
    most: DOMAINS.filter((d) => byDomain[d]).sort((a, b) => byDomain[b] - byDomain[a])[0] || null,
    least: DOMAINS.filter((d) => byDomain[d] != null).sort((a, b) => byDomain[a] - byDomain[b])[0] || null,
    even: entries.length > 0 && new Set(Object.values(byDomain)).size === 1,
    independentShare: entries.length ? independent / entries.length : null,
  };
}

/** Independent share per domain (for the support-to-independence chart). */
export function independenceByDomain(entries = []) {
  return DOMAINS.map((d) => {
    const rows = entries.filter((e) => e.domain === d);
    return { domain: d, n: rows.length, independentShare: rows.length ? rows.filter((e) => e.stage === "independent").length / rows.length : 0 };
  }).filter((r) => r.n);
}
