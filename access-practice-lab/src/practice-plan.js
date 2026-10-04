// Transparent local practice suggestions, not a proficiency assessment.
import { answerOf, loadRecord } from "./store.js";
import { isActivityComplete } from "./attempts.js";
import { CORE_DOMAINS } from "./util.js";

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
const priority = { draft: 0, retry: 1, revisit: 2, new: 3, done: 4 };

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
    selected.push({ ...next, reason: STATUS_REASON[next.status] });
    used.add(next.id);
    domainCounts[next.domain]++;
    if (next.status === "revisit") revisits++;
  }
  return selected;
}
