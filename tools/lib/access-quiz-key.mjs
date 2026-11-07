// The live class quiz (Language Page) draws on the lab's own item bank. The server judges every answer, so it
// needs the key; this generated file is that key (shared/class-platform/quiz-key.json). It lists only items a
// phone can show on its own: single-answer multiple choice with no audio script, picture, chart or table.
// The key file carries what the bank already publishes (item id, band, domain, level, correct option id).
import { allActivities } from "./access-lab-content.mjs";

const NEEDS_MEDIA = [
  "script",
  "adminScript",
  "listening",
  "sayFor",
  "picture",
  "chart",
  "table",
  "tracker",
  "writeFor",
  "testPart",
];
// Model-Test items rehearse the test format and are not quiz material.
const EXCLUDED_DOMAINS = new Set(["Model-Test"]);

export function quizEligible({ domain, activity }) {
  return (
    activity.type === "multipleChoice" &&
    !EXCLUDED_DOMAINS.has(domain) &&
    NEEDS_MEDIA.every((key) => activity[key] == null) &&
    !(activity.options || []).some((o) => o.picture) &&
    (activity.options || []).some((o) => o.id === activity.answer)
  );
}

export function buildQuizKey() {
  const items = {};
  for (const row of allActivities()) {
    if (!quizEligible(row)) continue;
    if (items[row.activity.id])
      throw new Error(`quiz key: duplicate activity id ${row.activity.id}`);
    items[row.activity.id] = {
      band: row.band,
      domain: row.domain,
      level: row.level,
      answer: row.activity.answer,
    };
  }
  return {
    items: Object.fromEntries(Object.entries(items).sort(([a], [b]) => a.localeCompare(b))),
  };
}
