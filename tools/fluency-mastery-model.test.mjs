import assert from "node:assert/strict";
import {
  ladderIndex,
  masteryScore,
  masteryState,
  nextInterval,
  REVIEW_LADDER,
} from "../math/fluency-lab/mastery-model.js";
import {
  DAY,
  emptyTutor,
  evidence,
  findSkill,
  recordAnswer,
  sanitizeTutor,
} from "../math/fluency-lab/tutor-engine.js";

let checks = 0;
const check = (condition, message) => {
  assert.ok(condition, message);
  checks++;
};
const now = Date.UTC(2026, 9, 30, 15);
const entry = (offsetDays, overrides = {}) => ({
  correct: true,
  independent: true,
  level: 1,
  at: now - offsetDays * DAY,
  ...overrides,
});

check(
  masteryScore({}, now) === null && masteryState({}, now) === "new",
  "no evidence is 'new', not zero",
);

// Eight independent successes on one day: strong accuracy, but one sitting cannot be mastered.
const oneSitting = {
  recent: Array.from({ length: 8 }, (_, i) => entry(0, { at: now - i * 1000, sig: `p${i}` })),
};
check(
  masteryScore(oneSitting, now) < 90 && masteryState(oneSitting, now) === "proficient",
  "one sitting tops out at proficient",
);

const spread = { recent: Array.from({ length: 10 }, (_, i) => entry(9 - i, { sig: `p${i}` })) };
check(
  masteryState(spread, now) === "mastered" && masteryScore(spread, now) >= 90,
  "ten distinct successes over ten days is mastered",
);

// Repeating one identical problem is one piece of evidence.
const repeated = { recent: Array.from({ length: 10 }, (_, i) => entry(9 - i, { sig: "same" })) };
check(
  masteryScore(repeated, now) < masteryScore(spread, now) - 25,
  "identical repeats do not inflate the score",
);
check(masteryState(repeated, now) !== "mastered", "identical repeats never reach mastered");

// Hints do not buy mastery.
const hinted = {
  recent: Array.from({ length: 10 }, (_, i) => entry(9 - i, { independent: false, sig: `p${i}` })),
};
check(
  masteryScore(hinted, now) < 50 && masteryState(hinted, now) === "learning",
  "hint-assisted success stays 'learning'",
);

// Concrete-level-only success is capped.
const concrete = {
  recent: Array.from({ length: 10 }, (_, i) => entry(9 - i, { level: 0, sig: `p${i}` })),
};
check(masteryScore(concrete, now) <= 50, "level-0 work alone cannot exceed 50");

// Recent misses pull the score down more than old ones.
const oldMiss = {
  recent: [
    entry(9, { correct: false, sig: "a" }),
    ...Array.from({ length: 9 }, (_, i) => entry(8 - i, { sig: `p${i}` })),
  ],
};
const newMiss = {
  recent: [
    ...Array.from({ length: 9 }, (_, i) => entry(9 - i, { sig: `p${i}` })),
    entry(0, { correct: false, sig: "z" }),
  ],
};
check(
  masteryScore(oldMiss, now) > masteryScore(newMiss, now),
  "a recent miss costs more than an old one",
);

// Review ladder: 1, 3, 7, 14, 30.
check(REVIEW_LADDER.join() === "1,3,7,14,30", "ladder is 1/3/7/14/30");
check(
  ladderIndex(14) === 3 && ladderIndex(2) === 1 && ladderIndex(99) === 4,
  "stored intervals map to a rung",
);
let interval = 1;
const climbed = [];
for (let i = 0; i < 5; i++) {
  interval = nextInterval(interval, { correct: true, independent: true, advance: true });
  climbed.push(interval);
}
check(
  climbed.join() === "3,7,14,30,30",
  `a correct independent day climbs and caps at 30 (${climbed})`,
);
check(
  nextInterval(30, { correct: false, independent: true }) === 1,
  "an independent miss restarts at one day",
);
check(
  nextInterval(14, { correct: true, independent: false }) === 7,
  "a hinted success steps back one rung",
);

// Through the engine: first success schedules +1 day; later new-day successes climb the ladder.
const tutor = emptyTutor();
const skill = findSkill("4:division");
const day = (n) => now + n * DAY;
const seen = [];
for (let n = 0; n < 6; n++) {
  recordAnswer(tutor, skill, { correct: true, independent: true, level: 1, sig: `q${n}` }, day(n));
  seen.push(tutor.records["4:division"].interval);
}
check(seen.join() === "1,3,7,14,30,30", `engine climbs the ladder across days (${seen})`);
recordAnswer(tutor, skill, { correct: false, independent: true, level: 1, sig: "miss" }, day(6));
check(tutor.records["4:division"].interval === 1, "engine restarts on an independent miss");
check(
  evidence(tutor, skill, day(6)).state && typeof evidence(tutor, skill, day(6)).score === "number",
  "evidence exposes score and state",
);

// Save/resume: old records without sig or reviewStep still load; sig and 30-day interval survive.
const clean = sanitizeTutor(JSON.parse(JSON.stringify(tutor)));
check(
  clean.records["4:division"].interval === 1 &&
    clean.records["4:division"].recent.some((r) => r.sig === "q0"),
  "sig survives sanitize",
);
const legacy = {
  version: 2,
  records: {
    "4:division": { recent: [entry(1)], interval: 30, independentTotal: 1, supportedTotal: 0 },
  },
  mistakes: [],
  diagnostics: {},
  sessions: [],
};
check(sanitizeTutor(legacy).records["4:division"].interval === 30, "a 30-day interval is kept");

console.log(`fluency-mastery-model: ${checks} checks passed`);
