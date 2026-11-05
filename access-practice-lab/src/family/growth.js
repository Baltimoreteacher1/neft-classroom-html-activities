// Observable family-facing change, derived only from comparable local ledger events.
// This describes the support/context used; it does not infer correctness or mastery.
const DOMAINS = new Set(["Listening", "Reading", "Speaking", "Writing"]);
const USES = new Set(["Narrate", "Inform", "Explain", "Argue"]);

function independent(entry) {
  return entry.stage === "independent" && !Object.values(entry.supports || {}).some(Boolean);
}

/**
 * Find same-band, same-domain, same-language-function examples that move from supported
 * practice to a later independent first attempt or transfer. Never returns learner text or IDs.
 */
export function familyGrowthEvidence(entries, band, limit = 3) {
  const groups = new Map();
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!entry || entry.band !== band || !DOMAINS.has(entry.domain) || !USES.has(entry.use)) continue;
    if (!(entry.kind === "first" || entry.kind === "transfer")) continue;
    if (typeof entry.t !== "string" || !Number.isFinite(Date.parse(entry.t))) continue;
    const taskKey = entry.task || entry.id;
    if (!taskKey) continue;
    const key = `${entry.domain}|${entry.use}`;
    const rows = groups.get(key) || [];
    rows.push({ entry, taskKey, at: Date.parse(entry.t) });
    groups.set(key, rows);
  }

  const found = [];
  for (const rows of groups.values()) {
    rows.sort((a, b) => a.at - b.at);
    const independentRows = rows.filter(({ entry }) => independent(entry));
    const supportedRows = rows.filter(({ entry }) => !independent(entry));
    const later = independentRows.at(-1);
    if (!later) continue;
    const earlier = supportedRows.find((row) => row.at < later.at && row.taskKey !== later.taskKey);
    if (!earlier) continue;
    found.push({
      domain: later.entry.domain,
      use: later.entry.use,
      earlierDay: earlier.entry.t.slice(0, 10),
      laterDay: later.entry.t.slice(0, 10),
      transfer: later.entry.kind === "transfer",
      sortAt: later.at,
    });
  }
  return found.sort((a, b) => b.sortAt - a.sortAt).slice(0, Math.max(0, limit)).map(({ sortAt, ...item }) => item);
}
