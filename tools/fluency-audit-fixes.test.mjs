// Pins the Fluency Lab audit fixes of 2026-10-12: mixed-number answers, answer-free peeks, level-0 variety,
// zero in integer multiply/divide, and streaks that survive DST and a broken run.
import assert from "node:assert/strict";

const store = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
const { ALL_SKILLS, generateProblem, seededRandom, validateAnswer } = await import(
  "../math/fluency-lab/problem-bank.js"
);
const { peekCap, stepLeaks } = await import("../math/fluency-lab/step-leak.js");
const { adaptiveProblem, emptyTutor, evidence, recommendations, recordAnswer } = await import(
  "../math/fluency-lab/tutor-engine.js"
);
const { STICKERS, cleanRewards, dailyGame, noteToday, streakOf, summarize } = await import(
  "../math/fluency-lab/rewards.js"
);

// 1. Fraction answers: mixed numbers read as mixed numbers, never fused into one numerator.
const frac = (answer, typed) => validateAnswer(typed, { kind: "fraction", answers: [answer] });
assert.equal(frac("17/12", "1 5/12"), true);
assert.equal(frac("11/4", "1 1/4"), false, "1 1/4 is 5/4");
assert.equal(frac("-17/12", "−1 5/12"), true);
assert.equal(frac("3/4", "6/8"), true);

// 2. A peek never reaches a step that states the answer (all 80 skills).
let capped = 0;
for (const skill of ALL_SKILLS) {
  for (let i = 0; i < 60; i += 1) {
    const item = generateProblem(skill, seededRandom(i + 11));
    const cap = peekCap(item);
    for (let s = 0; s < cap; s += 1)
      assert.equal(
        stepLeaks(item.steps[s], item),
        false,
        `${skill.grade}:${skill.id} "${item.question}" step ${s + 1}`,
      );
    if (cap === 0) capped += 1;
  }
}
assert.ok(
  capped < ALL_SKILLS.length * 60 * 0.25,
  `peeks are empty for ${capped} problems; the guard is over-trimming`,
);
assert.equal(
  stepLeaks("7 × 8 = 56", { question: "56 ÷ 7 = ?", answers: ["8"], displayAnswer: "8" }),
  true,
);
assert.equal(
  stepLeaks("Factors of 48: 1, 2, 3, 4, 6, 8", {
    question: "GCF of 48 and 14",
    answers: ["2"],
    displayAnswer: "2",
  }),
  false,
);

// 3. Support level 0 keeps variety instead of collapsing to the skill's floor.
for (const skill of ALL_SKILLS) {
  const seen = new Set();
  for (let i = 0; i < 300; i += 1)
    seen.add(adaptiveProblem(skill, seededRandom(i + 1), 0).question);
  if (!["make-10", "exponents", "square-roots", "pythagorean"].includes(skill.id))
    assert.ok(seen.size >= 12, `${skill.grade}:${skill.id} level 0 has ${seen.size} problems`);
}

// 4. A zero factor never gets a sign rule.
const intMul = ALL_SKILLS.find((skill) => skill.id === "integer-mul");
for (let i = 0; i < 1500; i += 1) {
  const item = generateProblem(intMul, seededRandom(i));
  if (item.answers[0] === "0")
    assert.doesNotMatch(item.steps.join(" "), /positive|negative/, item.question);
}

// 5. Streak stickers stay earned after the run breaks; DST does not shorten a run; the daily pick changes at local midnight.
const data = cleanRewards({});
const day = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
data.days = [day(10), day(9), day(8), day(7)];
data.bestStreak = 4;
assert.equal(streakOf(data.days), 0);
const summary = summarize({ stations: {}, facts: {}, recent: [] }, data);
assert.equal(summary.streak, 0);
assert.equal(
  STICKERS.find((sticker) => sticker.id === "days-3").test(summary),
  true,
  "3-day sticker survives a broken run",
);
const fresh = cleanRewards({});
noteToday(fresh);
assert.equal(fresh.bestStreak, 1);
assert.equal(
  cleanRewards(JSON.parse(JSON.stringify(data))).bestStreak,
  4,
  "best streak survives backup/restore",
);
const lateEvening = new Date(2026, 9, 12, 23, 30).getTime();
const nextMorning = new Date(2026, 9, 13, 0, 30).getTime();
assert.notEqual(dailyGame(lateEvening), dailyGame(nextMorning), "pick changes at local midnight");
assert.equal(
  dailyGame(new Date(2026, 9, 12, 0, 5).getTime()),
  dailyGame(lateEvening),
  "pick is stable through the local day",
);

// 6. Mastery: spacing is elapsed time, a stale checkup miss fades, a hinted success only halves the review wait.
const skill = ALL_SKILLS.find((entry) => entry.grade === 3 && entry.id === "mul-0-5");
const tutor = emptyTutor();
const night = new Date(2026, 9, 5, 23, 50).getTime();
for (let i = 0; i < 7; i += 1)
  recordAnswer(tutor, skill, { correct: true, independent: true, level: 1 }, night + i * 60000);
recordAnswer(tutor, skill, { correct: true, independent: true, level: 1 }, night + 15 * 60000);
assert.equal(
  evidence(tutor, skill, night + 20 * 60000).secure,
  false,
  "one late-night sitting is not two days",
);
recordAnswer(tutor, skill, { correct: true, independent: true, level: 1 }, night + 25 * 3600000);
assert.equal(
  evidence(tutor, skill, night + 26 * 3600000).secure,
  true,
  "correct answers a day apart are spaced",
);

const checkup = emptyTutor();
checkup.diagnostics[3] = { at: night, results: { [`3:${skill.id}`]: false } };
const top = () =>
  recommendations(checkup, 3, night + 30 * 3600000).find((entry) => entry.skill === skill);
assert.equal(top().reason, "A useful next step from your checkup");
for (let i = 0; i < 4; i += 1)
  recordAnswer(checkup, skill, { correct: true, independent: true, level: 1 }, night + i * 3600000);
assert.notEqual(
  top().reason,
  "A useful next step from your checkup",
  "checkup miss fades once practice is going well",
);

const review = emptyTutor();
review.records[`3:${skill.id}`] = { recent: [], interval: 14 };
recordAnswer(review, skill, { correct: true, independent: false, level: 1 }, night);
assert.equal(review.records[`3:${skill.id}`].interval, 7, "hinted success halves the interval");
recordAnswer(review, skill, { correct: false, independent: true, level: 1 }, night);
assert.equal(review.records[`3:${skill.id}`].interval, 1, "an independent miss rechecks soon");

console.log(
  "fluency audit fixes: mixed numbers, answer-free peeks, level-0 variety, zero signs, streak rewards hold",
);
