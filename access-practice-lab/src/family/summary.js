// Family progress summary: counts read straight from saved results. Nothing here estimates ability,
// predicts a score, or turns completion into mastery. Completion, first-try correctness, correct-after-help,
// and revision are kept apart because they mean different things.
import { needsReview } from "../store.js";
import { CORE_DOMAINS } from "../util.js";

const countable = (r) => r && !needsReview(r) && r.meaningful !== false && r.words !== 0 && r.practiced !== false;
const dayOf = (iso) => (typeof iso === "string" ? iso.slice(0, 10) : "");

/**
 * @param entries  allRecords() output: [{ band, domain, level, record }]
 * @param rowsById Map of activity id -> row ({ title, skill, domain }) from the index, for naming
 * @param esGuide  content/es-guide.json activities map, for Spanish skill goals
 */
export function summarize(entries, rowsById = new Map(), esGuide = {}) {
  const byDomain = Object.fromEntries(CORE_DOMAINS.map((d) => [d, { completed: 0, tried: 0 }]));
  const out = { byDomain, completed: 0, independent: 0, help: 0, revised: 0, days: new Set(), latest: null, nextDomain: null, nextKind: "" };
  const dated = [];
  for (const { domain, record } of entries) {
    if (!byDomain[domain]) continue;
    byDomain[domain].completed += record.complete.length;
    out.completed += record.complete.length;
    for (const [id, result] of Object.entries(record.results || {})) {
      if (!countable(result)) continue;
      byDomain[domain].tried++;
      if (result.evidence === "independent") out.independent++;
      else if (result.evidence === "supported") out.help++;
      else if (result.evidence === "revised") out.revised++;
      const day = dayOf(result.date);
      if (day) {
        out.days.add(day);
        dated.push({ id, domain, day });
      }
    }
  }
  if (dated.length) {
    const newest = dated.map((d) => d.day).sort().at(-1);
    const items = dated.filter((d) => d.day === newest);
    const seen = new Set();
    out.latest = {
      day: newest,
      items: items
        .filter((d) => (seen.has(d.domain) ? false : seen.add(d.domain)))
        .map((d) => {
          const row = rowsById.get(d.id) || {};
          return { domain: d.domain, title: row.title || "", skillEn: row.skill || "", skillEs: esGuide[d.id]?.skill || "" };
        }),
    };
  }
  out.dayCount = out.days.size;
  out.hasWork = out.completed > 0 || dated.length > 0;
  // The next skill: an untried one first, else the one with the fewest completed activities.
  // With no saved practice there is nothing to be "next" after, so the page shows its starting prompt instead.
  const untried = out.hasWork ? CORE_DOMAINS.find((d) => byDomain[d].tried === 0) : null;
  if (untried) {
    out.nextDomain = untried;
    out.nextKind = "try";
  } else if (out.completed) {
    out.nextDomain = [...CORE_DOMAINS].sort((a, b) => byDomain[a].completed - byDomain[b].completed)[0];
    out.nextKind = "balance";
  }
  return out;
}
