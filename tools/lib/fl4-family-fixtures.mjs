// Fixtures shared by the family 4.0 tests: a saved tutor record with known evidence, built entry by entry, plus a
// stand-in for the teacher's growth-log API (the real module is published by another workstream).
import { DAY, emptyTutor } from "../../math/fluency-lab/tutor-engine.js";

export { DAY };

export const NOW = new Date(2026, 9, 20, 12, 0, 0).getTime();
export const daysAgo = (n) => NOW - n * DAY;
export const entry = (ago, { correct = true, independent = true, level = 1, sig } = {}) => ({
  correct,
  independent,
  level,
  at: daysAgo(ago),
  ...(sig ? { sig } : {}),
});
const record = (recent, extra = {}) => ({
  recent,
  independentTotal: recent.filter((e) => e.independent).length,
  supportedTotal: recent.filter((e) => !e.independent).length,
  dueAt: null,
  interval: 1,
  lastAt: recent.at(-1)?.at ?? null,
  lastSuccessfulDay: "",
  lessonCompleted: false,
  strategyTags: [],
  ...extra,
});
// ten distinct problems answered correctly on their own, from `span` days ago to yesterday
const solid = (span) =>
  record(
    Array.from({ length: 10 }, (_, i) =>
      entry(Math.round(span - (i * (span - 1)) / 9), { sig: `s${i}` }),
    ),
  );

export function fixtureTutor() {
  const tutor = emptyTutor();
  tutor.records["3:mul-0-5"] = solid(30); // solid and retained (30 days apart)
  // proficient, not mastered: one miss, six days of evidence, correct answers only six days apart
  tutor.records["3:mul-6-9"] = record([
    entry(7, { sig: "a" }),
    entry(6, { sig: "b" }),
    entry(5, { sig: "c" }),
    entry(4, { correct: false, sig: "d" }),
    entry(3, { sig: "e" }),
    entry(2, { sig: "f" }),
    entry(1, { sig: "g" }),
  ]);
  // developing: three misses in five tries
  tutor.records["3:mul-10-12"] = record([
    entry(10, { correct: false, sig: "a" }),
    entry(8, { correct: false, sig: "b" }),
    entry(6, { sig: "c" }),
    entry(4, { correct: false, sig: "d" }),
    entry(2, { sig: "e" }),
  ]);
  // twelve correct answers, every one with a hint or a retry: supported credit only
  tutor.records["3:division-facts"] = record(
    Array.from({ length: 12 }, (_, i) => entry(12 - i, { independent: false, sig: `h${i}` })),
  );
  // the same problem answered correctly twenty times: it is one piece of evidence
  tutor.records["4:division"] = record(
    Array.from({ length: 20 }, (_, i) => entry(20 - i, { sig: "same" })),
  );
  // a skill with a checkup miss that is now proficient
  tutor.records["6:ratios"] = record([
    entry(5, { correct: false, sig: "a" }),
    entry(4, { sig: "b" }),
    entry(3, { correct: false, sig: "c" }),
    entry(2, { sig: "d" }),
    entry(1, { sig: "e" }),
    entry(1, { sig: "f" }),
  ]);
  tutor.diagnostics[6] = {
    at: daysAgo(40),
    results: { "6:ratios": false, "6:percent": true },
    foundations: {},
  };
  // one repaired slip (counts), one open slip, one repaired without a recognised idea (neither counts)
  const slip = {
    question: "3 x 4 = ?",
    submitted: "7",
    explanation: "",
    hint: "",
    at: daysAgo(15),
  };
  tutor.mistakes = [
    { ...slip, id: "a", key: "3:mul-0-5", category: "addedFactors", resolvedAt: daysAgo(9) },
    { ...slip, id: "b", key: "3:mul-6-9", category: "addedFactors", resolvedAt: null },
    { ...slip, id: "c", key: "3:mul-6-9", category: null, resolvedAt: daysAgo(3) },
  ];
  return tutor;
}

export const fixtureRewards = () => ({
  days: [daysAgo(0), daysAgo(1), daysAgo(2), daysAgo(9)].map((t) => localDate(t)),
  bestStreak: 4,
  goal: 3,
});
export const localDate = (time) => {
  const d = new Date(time);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// A stand-in growth API: 3:mul-6-9 started at Learning (22) and is now Proficient.
export const fakeLog = { tag: "fixture" };
export const fakeApi = {
  growthFor: (_log, key) =>
    key === "3:mul-6-9"
      ? {
          start: { score: 22, state: "learning", at: daysAgo(12) },
          now: { score: 87, state: "proficient", at: daysAgo(0) },
          history: [
            { at: daysAgo(12), score: 22, state: "learning" },
            { at: daysAgo(6), score: 51, state: "developing" },
            { at: daysAgo(0), score: 87, state: "proficient" },
          ],
          delta: 65,
        }
      : { start: null, now: null, history: [], delta: 0 },
};

// The same fixture moved so every entry keeps its age relative to the real clock (for browser tests).
export function shiftedSeed(now = Date.now()) {
  const shift = now - NOW;
  const tutor = fixtureTutor();
  for (const item of Object.values(tutor.records)) {
    for (const e of item.recent) e.at += shift;
    item.lastAt += shift;
  }
  for (const diagnostic of Object.values(tutor.diagnostics)) diagnostic.at += shift;
  for (const mistake of tutor.mistakes) {
    mistake.at += shift;
    if (mistake.resolvedAt) mistake.resolvedAt += shift;
  }
  const rewards = { ...fixtureRewards(), days: [0, 1, 2, 9].map((n) => localDate(now - n * DAY)) };
  return { tutor, rewards };
}
