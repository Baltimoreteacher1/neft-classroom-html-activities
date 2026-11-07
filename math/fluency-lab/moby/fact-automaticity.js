// Automaticity without a clock. A fact's status comes from first-try, no-help answers on separate days plus the
// learner's own one-tap note after a right answer ("I just knew it", "I used a strategy", "I counted"). Time is never
// read. Statuses: automatic, strategy, counting, not-yet. Pure: records in, labels out.
import { FACT_THRESHOLDS, factStatus } from "./fact-model.js";

export const HOW_IDS = Object.freeze(["knew", "strategy", "counted"]);
export const HOW_LABELS = Object.freeze({
  knew: "I just knew it",
  strategy: "I used a strategy",
  counted: "I counted",
});
export const AUTO_STATUSES = Object.freeze(["automatic", "strategy", "counting", "not-yet"]);
export const AUTO_LABELS = Object.freeze({
  automatic: "Automatic",
  strategy: "Strategy",
  counting: "Counting",
  "not-yet": "Not yet",
});
// The rule behind each status, shown to teachers and families exactly as applied.
export const AUTO_RULES = Object.freeze({
  automatic:
    "Secure (right on the first try, on their own, on {days} or more days), and the learner said “I just knew it” on {knew} or more of those days, most recently too.",
  strategy:
    "Secure, and the learner most recently said they used a strategy, or has not yet said they just knew it.",
  counting: "Right on their own, and the learner most recently said they counted.",
  "not-yet":
    "Not secure yet: fewer than {n} first-try right answers on their own, or not on {days} different days.",
});
export const AUTO_KNEW_DAYS = 2;

const independentRight = (entry) => entry.correct && entry.firstTry && !entry.supported;

export function automaticity(record, now) {
  const status = factStatus(record, now);
  const right = (record?.recent || []).filter(independentRight);
  const reported = right.filter((entry) => HOW_IDS.includes(entry.how));
  const latest = reported.at(-1)?.how || null;
  if (latest === "counted" && right.length) return "counting";
  if (status !== "secure" && status !== "retained") return "not-yet";
  const knewDays = new Set(
    reported.filter((entry) => entry.how === "knew").map((entry) => entry.day),
  );
  if (latest === "knew" && knewDays.size >= AUTO_KNEW_DAYS) return "automatic";
  return "strategy";
}

export function autoRules() {
  const vars = {
    days: FACT_THRESHOLDS.secureMinDays,
    n: FACT_THRESHOLDS.secureMinIndependent,
    knew: AUTO_KNEW_DAYS,
  };
  return AUTO_STATUSES.map((id) => ({
    id,
    label: AUTO_LABELS[id],
    template: AUTO_RULES[id],
    vars,
    text: AUTO_RULES[id].replace(/\{(\w+)\}/g, (_, name) => String(vars[name])),
  }));
}

// Counts for one learner over a set of fact keys (a grade's domain, or every recorded fact).
export function automaticityCounts(store, keys, now) {
  const counts = { automatic: 0, strategy: 0, counting: 0, "not-yet": 0 };
  const byStatus = { automatic: [], strategy: [], counting: [], "not-yet": [] };
  for (const key of keys) {
    const status = automaticity(store?.facts?.[key], now);
    counts[status] += 1;
    byStatus[status].push(key);
  }
  return { counts, byStatus, total: keys.length };
}
