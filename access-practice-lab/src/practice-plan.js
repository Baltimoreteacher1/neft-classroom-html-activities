// Transparent local practice suggestions, not a proficiency assessment.
import { answerOf, loadRecord } from "./store.js";
import { isActivityComplete } from "./attempts.js";
import { CORE_DOMAINS } from "./util.js";
import { dueForReview } from "./lang/adapt.js";
import { skillIdFor } from "./lang/skill-graph.js";

const hasValue = (value) => {
  if (Array.isArray(value)) return value.some(hasValue);
  if (value && typeof value === "object") return Object.values(value).some(hasValue);
  return value !== undefined && value !== null && value !== false && String(value).trim() !== "";
};

export function activityStatus(record, id) {
  const result = record.results?.[id];
  if (result?.evidence === "draft") return "draft";
  if (result?.ok === false) return "retry";
  if (isActivityComplete(record, id)) return "done";
  if (result && result.meaningful !== false && result.words !== 0 && result.practiced !== false) return "retry";
  if (
    hasValue(answerOf({ answers: {}, ...record }, id)) ||
    hasValue(record.notes?.[id]) ||
    record.practiced?.[id] ||
    hasValue(record.selfChecks?.[id])
  )
    return "draft";
  return "new";
}

export const STATUS_REASON = {
  draft: "Continue your saved work and review this version.",
  retry: "Revisit this activity and try the feedback.",
  new: "Build your language with a new activity.",
  done: "Practice a finished activity again.",
  revisit: "You used help or a retry before. Try a fresh answer independently.",
};
const priority = { draft: 0, review: 0.5, retry: 1, revisit: 2, new: 3, done: 4 };

/**
 * Attach spaced-review skill items (adapt.js dueForReview) to the candidate activity that practices
 * the same skill node, or else to an activity in the same domain. The row's reason becomes the item's
 * evidence trace. At most half the session is review.
 */
function markReview(candidates, due, count) {
  const limit = Math.max(1, Math.floor(count / 2));
  const taken = new Set();
  for (const item of due) {
    // Error patterns are reviewed in Error Detective, not in a room activity.
    if (item.kind !== "skill" || taken.size >= limit || !CORE_DOMAINS.includes(item.domain)) continue;
    const open = candidates.filter((r) => !taken.has(r.id) && r.domain === item.domain && r.status !== "draft");
    const row =
      (item.kind === "skill" && open.find((r) => skillIdFor(r.domain, r.skill) === item.id)) ||
      open.find((r) => r.status === "done" || r.status === "revisit") ||
      open[0];
    if (!row) continue;
    taken.add(row.id);
    row.status = "review";
    row.review = item;
  }
}

/** Rows must come from one grade band's index. Never uses responses in URLs. */
export function buildPracticePlan(
  rows,
  options = {},
  recordFor = (r) => loadRecord(r.band, r.domain, r.level),
) {
  const focus = CORE_DOMAINS.includes(options.focus) ? options.focus : "balanced";
  const count = [2, 4, 6].includes(Number(options.count)) ? Number(options.count) : 4;
  const level = ["A", "B", "C"].includes(options.level) ? options.level : "preferred";
  const candidates = rows
    .filter(
      (row) =>
        CORE_DOMAINS.includes(row.domain) &&
        (focus === "balanced" || row.domain === focus) &&
        row.level === (level === "preferred" ? options.tiers?.[row.domain] || "A" : level),
    )
    .map((row, order) => {
      const record = recordFor(row);
      const status = activityStatus(record, row.id);
      // Independent correctness is available only for selected-response tasks.
      const revisit = status === "done" && !["constructed", "worksheet"].includes(row.type) &&
        (record.results?.[row.id]?.evidence === "supported" || record.results?.[row.id]?.supportUsed === true);
      return { ...row, status: revisit ? "revisit" : status, order };
    });
  // Spaced review only when the caller passes the learner's evidence: { entries, records, now }.
  const due = options.review ? dueForReview(options.review.entries, options.review.now ?? Date.now(), { records: options.review.records, n: count }) : null;
  if (due) markReview(candidates, due, count);
  const selected = [];
  const used = new Set();
  const domainCounts = Object.fromEntries(CORE_DOMAINS.map((domain) => [domain, 0]));
  let revisits = 0;
  while (selected.length < count) {
    const next = candidates
      .filter((r) => !used.has(r.id))
      .map((r) => r.status === "revisit" && revisits > 0 ? { ...r, status: "done" } : r)
      .sort(
        (a, b) =>
          priority[a.status] - priority[b.status] ||
          domainCounts[a.domain] - domainCounts[b.domain] ||
          a.order - b.order,
      )[0];
    if (!next) break;
    selected.push({ ...next, reason: next.review ? next.review.reason : STATUS_REASON[next.status] });
    used.add(next.id);
    domainCounts[next.domain]++;
    if (next.status === "revisit") revisits++;
  }
  if (due) selected.due = due;
  return selected;
}
