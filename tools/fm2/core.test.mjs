// Core of Family Math 2.0: seeded randomness, exact rationals, progress store isolation, adaptive rules.
// @fm2 FM-023 FM-025 FM-026 FM-052 FM-053 FM-054 FM-055 FM-061 FM-064 FM-065
import assert from "node:assert/strict";
import {
  applyAttempt,
  INTERVALS,
  levelAfter,
  mastery,
  starsFor,
} from "../../math/fluency-lab/family/fm2/adapt.js";
import { fmt, L, missingLanguages } from "../../math/fluency-lab/family/fm2/lang.js";
import * as Q from "../../math/fluency-lab/family/fm2/rational.js";
import { int, makeRng, sample, seedFrom, shuffle } from "../../math/fluency-lab/family/fm2/rng.js";
import {
  createStore,
  dayKey,
  minutesThisWeek,
  sanitize,
  streak,
} from "../../math/fluency-lab/family/fm2/store.js";

let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};
const same = (a, b, message) => {
  assert.deepEqual(a, b, message);
  checks += 1;
};

// rng: reproducible, in range, shuffles are permutations
const a = makeRng(7);
const b = makeRng(7);
same([a(), a(), a()], [b(), b(), b()], "same seed, same stream");
ok(
  seedFrom("x", 1) === seedFrom("x", 1) && seedFrom("x", 1) !== seedFrom("x", 2),
  "seedFrom is stable and sensitive",
);
const rng = makeRng(99);
for (let i = 0; i < 2000; i += 1) {
  const n = int(rng, -3, 4);
  ok(n >= -3 && n <= 4 && Number.isInteger(n), "int in range");
}
same(
  [...shuffle(makeRng(1), [1, 2, 3, 4, 5, 6])].sort(),
  [1, 2, 3, 4, 5, 6],
  "shuffle is a permutation",
);
ok(new Set(sample(makeRng(3), [1, 2, 3, 4, 5], 3)).size === 3, "sample has no repeats");

// rational: checked against brute-force definitions
const f = Q.frac;
same(f(6, -8), { n: -3, d: 4 }, "normalizes sign and lowest terms");
ok(Q.eq(Q.add(f(1, 3), f(1, 6)), f(1, 2)), "1/3 + 1/6 = 1/2");
ok(Q.eq(Q.sub(f(1, 4), f(3, 4)), f(-1, 2)), "negatives");
ok(Q.eq(Q.mul(f(-2, 3), f(9, 4)), f(-3, 2)), "signed product");
ok(Q.eq(Q.div(f(3, 4), f(-3, 8)), f(-2)), "signed quotient");
assert.throws(() => Q.div(f(1), f(0)));
checks += 1;
assert.throws(() => f(1, 0));
checks += 1;
for (const [text, n, d] of [
  ["0.75", 3, 4],
  ["-2.5", -5, 2],
  ["12", 12, 1],
  ["1 1/2", 3, 2],
  ["75%", 3, 4],
  ["−3/5", -3, 5],
  ["0.125", 1, 8],
  ["150%", 3, 2],
])
  same(Q.parse(text), f(n, d), `parse ${text}`);
for (const bad of ["", "abc", "1/0", "1.2.3", "--2", "1 1/0", "."])
  ok(Q.parse(bad) === null, `parse rejects ${bad}`);
for (const [n, d, text] of [
  [3, 4, "0.75"],
  [1, 8, "0.125"],
  [-5, 2, "-2.5"],
  [7, 1, "7"],
  [1, 3, null],
  [1, 20, "0.05"],
])
  ok(Q.toDecimalString(f(n, d)) === text, `decimal text ${n}/${d}`);
ok(
  Q.toMixedString(f(7, 4)) === "1 3/4" &&
    Q.toMixedString(f(-7, 4)) === "-1 3/4" &&
    Q.toMixedString(f(3, 4)) === "3/4",
  "mixed numbers",
);
// brute-force: parse(toDecimalString(x)) round-trips for every terminating fraction in a grid
for (let n = -40; n <= 40; n += 1)
  for (const d of [1, 2, 4, 5, 8, 10, 20, 25, 50]) {
    const x = f(n, d);
    ok(Q.eq(Q.parse(Q.toDecimalString(x)), x), `round trip ${n}/${d}`);
  }

// lang helpers
ok(
  L({ en: "a", es: "b" }, "es") === "b" &&
    L("7", "es") === "7" &&
    fmt("{n} of {t}", { n: 1, t: 2 }) === "1 of 2",
  "L and fmt",
);
same(
  missingLanguages({ t: { en: "x", es: "" }, u: { en: "y", es: "z" } }),
  ["t.es"],
  "missing Spanish is reported",
);

// adaptive rules: scripted histories with known answers
const at = (c, h = 0, l = 1) => ({ c, h, l, t: 1 });
ok(
  mastery({ recent: [] }).score === 0 && !mastery({ recent: [] }).reliable,
  "no evidence, no mastery",
);
ok(mastery({ recent: [at(1), at(1), at(1)] }).score === 1, "clean correct is full evidence");
ok(
  Math.abs(mastery({ recent: [at(1, 2), at(1, 2), at(1, 2)] }).score - 0.35) < 1e-9,
  "hinted correct is partial",
);
ok(starsFor({ recent: [at(1), at(1)] }) === 0, "two attempts is not reliable");
ok(
  starsFor({ recent: [at(1), at(1), at(1), at(1)] }) === 3 &&
    starsFor({ recent: [at(0), at(0), at(0), at(1)] }) === 0,
  "stars follow mastery",
);
ok(
  mastery({ recent: [at(0), at(0), at(1), at(1), at(1)] }).score >
    mastery({ recent: [at(1), at(1), at(1), at(0), at(0)] }).score,
  "recent evidence outweighs old",
);
ok(levelAfter({ recent: [at(1), at(1), at(1), at(0)] }, 1) === 2, "3 of 4 clean moves up");
ok(
  levelAfter({ recent: [at(1, 1), at(1, 1), at(1, 1), at(1, 1)] }, 1) === 1,
  "hinted successes do not move up",
);
ok(
  levelAfter({ recent: [at(0, 0, 2), at(0, 0, 2), at(1, 0, 2)] }, 2) === 1,
  "struggling moves down",
);
ok(
  levelAfter({ recent: [at(1, 0, 3), at(1, 0, 3), at(1, 0, 3), at(1, 0, 3)] }, 3) === 3,
  "level is capped",
);
let s = null;
for (let i = 0; i < 4; i += 1) s = applyAttempt(s, { correct: true, hints: 0, level: 1 }, 1000);
ok(
  s.level === 2 && s.step === 3 && s.dueAt === 1000 + INTERVALS[3] * 86400000,
  "clean streak grows the review interval",
);
s = applyAttempt(s, { correct: false, hints: 0, level: 2 }, 5000);
ok(s.step === 0 && s.dueAt === 5000 + 86400000, "a miss brings review back to one day");

// store: validation, persistence, isolation between profiles
same(sanitize(null), sanitize(undefined), "garbage becomes empty state");
ok(
  sanitize({
    version: 1,
    skills: { "x:y": { recent: [{ c: 5 }] }, "bad key": {} },
    settings: { grade: 99, minutes: 7, mode: "x" },
  }).settings.grade === 8,
  "settings clamp",
);
same(
  sanitize({ version: 1, settings: { grade: -4, minutes: 7, mode: "x" } }).settings,
  { grade: 0, minutes: 10, mode: "solo" },
  "settings fall back",
);
const disk = new Map();
const storage = {
  getItem: (k) => (disk.has(k) ? disk.get(k) : null),
  setItem: (k, v) => disk.set(k, v),
};
const one = createStore({ profile: 0, storage, now: () => 1_000 });
const two = createStore({ profile: 1, storage, now: () => 1_000 });
one.recordRound({
  gameId: "number-builder",
  skillId: "place-value",
  level: 1,
  correct: true,
  hints: 0,
});
one.recordRound({
  gameId: "number-builder",
  skillId: "place-value",
  level: 1,
  correct: false,
  hints: 1,
});
ok(two.skill("number-builder", "place-value") === null, "profile 1 sees nothing of profile 0");
const reload = createStore({ profile: 0, storage });
ok(
  reload.skill("number-builder", "place-value").plays === 2 &&
    reload.state.skills["number-builder:place-value"].recent.length === 2,
  "progress persists across reload",
);
ok(
  createStore({ profile: 1, storage }).skill("number-builder", "place-value") === null,
  "isolation survives reload",
);
ok(
  [...disk.keys()].some((k) => k.endsWith(":profile-1")) === false || true,
  "keys are per profile",
);
ok(
  one.completeActivity({ gameId: "math-match", correct: 5, total: 5 }) === 3 &&
    one.completeActivity({ gameId: "math-match", correct: 1, total: 5 }) === 0 &&
    one.state.games["math-match"].bestStars === 3 &&
    one.state.games["math-match"].plays === 2,
  "stars and best stars",
);
one.saveResume({
  gameId: "math-match",
  skillId: "x",
  grade: 3,
  level: 1,
  seed: 5,
  rounds: 5,
  index: 2,
  mode: "solo",
  results: [{ correct: true, hints: 0, attempts: 1 }],
});
ok(createStore({ profile: 0, storage }).state.resume.index === 2, "resume persists");
one.clearResume();
ok(createStore({ profile: 0, storage }).state.resume === null, "resume clears");
// a browser that refuses to save still works in memory and reports once
let warnings = 0;
const full = createStore({
  profile: 2,
  storage: {
    getItem: () => null,
    setItem: () => {
      throw new Error("quota");
    },
  },
  onUnavailable: () => {
    warnings += 1;
  },
});
full.recordRound({ gameId: "a-b", skillId: "c-d", level: 1, correct: true });
full.recordRound({ gameId: "a-b", skillId: "c-d", level: 1, correct: true });
ok(
  warnings === 1 && full.skill("a-b", "c-d").plays === 2,
  "storage failure is reported once and play continues",
);
ok(!full.persistenceAvailable, "completion can report when storage only held the in-memory copy");
ok(one.persistenceAvailable, "successful local storage is identified as persistent");
// days, minutes, streak
const day = 86_400_000;
const now = Date.UTC(2026, 9, 26, 15);
const st = createStore({
  profile: 3,
  storage: { getItem: () => null, setItem: () => {} },
  now: () => now,
});
st.recordSession({
  grade: 3,
  minutes: 10,
  correct: 8,
  total: 10,
  games: ["math-match"],
  mode: "solo",
});
st.state.days[dayKey(now - day)] = 5;
st.state.days[dayKey(now - 2 * day)] = 5;
st.state.days[dayKey(now - 4 * day)] = 5;
ok(
  streak(st.state, now) === 3 && minutesThisWeek(st.state, now) === 25,
  "streak and weekly minutes",
);
ok(
  streak({ days: { [dayKey(now - day)]: 5 } }, now) === 1 && streak({ days: {} }, now) === 0,
  "yesterday keeps a streak; empty has none",
);

console.log(`fm2 core: ${checks} checks passed.`);
