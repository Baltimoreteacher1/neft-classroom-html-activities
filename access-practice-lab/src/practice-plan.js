// Transparent local practice suggestions, not a proficiency assessment.
import { answerOf, loadRecord } from "./store.js";
import { CORE_DOMAINS } from "./util.js";

const hasValue = (value) => {
  if (Array.isArray(value)) return value.some(hasValue);
  if (value && typeof value === "object") return Object.values(value).some(hasValue);
  return value !== undefined && value !== null && value !== false && String(value).trim() !== "";
};

export function activityStatus(record, id) {
  if (record.complete?.includes(id)) return "done";
  const result = record.results?.[id];
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
  draft: "Continue work you already started.",
  retry: "Revisit this activity and try the feedback.",
  new: "Build your language with a new activity.",
  done: "Practice a finished activity again.",
};
const priority = { draft: 0, retry: 1, new: 2, done: 3 };

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
    .map((row, order) => ({ ...row, status: activityStatus(recordFor(row), row.id), order }));
  const selected = [];
  const used = new Set();
  const domainCounts = Object.fromEntries(CORE_DOMAINS.map((domain) => [domain, 0]));
  while (selected.length < count) {
    const next = candidates
      .filter((r) => !used.has(r.id))
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
  }
  return selected;
}
