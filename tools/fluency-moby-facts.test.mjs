// Moby per-fact mastery model and personalized daily sessions: thresholds (with boundaries), retention, honesty about
// timing and help, fact families, strategy coverage, sanitize/migrate/backup, and session shape. Seeded and offline.
import assert from "node:assert/strict";

const memory = (store = new Map()) => ({
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => void store.set(key, String(value)),
  removeItem: (key) => void store.delete(key),
});
Object.defineProperty(globalThis, "localStorage", { configurable: true, value: memory() });
Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: memory() });

const { seededRandom, validateAnswer } = await import("../math/fluency-lab/problem-bank.js");
const { TRAILS, chartKey, makeProblem } = await import("../math/fluency-lab/fact-trail.js");
const M = await import("../math/fluency-lab/moby/fact-model.js");
const S = await import("../math/fluency-lab/moby/fact-session.js");
const { ES_MOBY_FACTS } = await import("../math/fluency-lab/moby/i18n-es-facts.js");
const { ES } = await import("../math/fluency-lab/i18n-es.js");
const school = await import("../math/fluency-lab/school-tools.js");
const play = await import("../math/fluency-lab/play-backup.js");
const { emptyTutor } = await import("../math/fluency-lab/tutor-engine.js");

const failures = [];
const check = (condition, message) => condition || failures.push(message);
const same = (actual, expected, message) => {
  try {
    assert.deepStrictEqual(actual, expected);
  } catch {
    failures.push(`${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
  }
};
const D = (n, hour = 12) => new Date(2026, 0, 5 + n, hour).getTime();
const attempt = (store, key, correct, now, extra = {}) =>
  M.recordFactAttempt(store, { key, correct, firstTry: true, supported: false, ...extra }, now);
// answers: [[dayOffset, correct], ...] for one key, in order
const run = (key, answers, extra = {}) =>
  answers.reduce(
    (store, [day, correct], i) => attempt(store, key, correct, D(day, 9 + (i % 8)), extra),
    M.emptyFacts(),
  );
const status = (store, key, now = D(60)) => M.factStatus(store.facts[key], now);
const K = "add:7:8";

// ---------- thresholds, with boundaries ----------
check(
  Object.isFrozen(M.FACT_THRESHOLDS) && Object.isFrozen(M.FACT_SPEED_BANDS),
  "Thresholds are exported frozen constants.",
);
check(
  M.FACT_THRESHOLDS.secureMinIndependent === 4 &&
    M.FACT_THRESHOLDS.secureMinDays === 2 &&
    M.FACT_THRESHOLDS.retainedMinGapDays === 7,
  "The documented numbers are the real numbers.",
);
check(
  M.factStatus(undefined) === "not-yet" && M.factStatus(null) === "not-yet",
  "No record means not-yet.",
);
check(
  status(run(K, [[0, true]]), K) === "developing",
  "One right answer is developing, never secure.",
);
check(
  status(
    run(K, [
      [0, true],
      [0, true],
      [1, true],
    ]),
    K,
  ) === "developing",
  "3 right on 2 days: below the 4-answer floor.",
);
check(
  status(
    run(K, [
      [0, true],
      [0, true],
      [0, true],
      [0, true],
    ]),
    K,
  ) === "developing",
  "4 right on ONE day: a lucky streak cannot be secure.",
);
check(
  status(
    run(K, [
      [0, true],
      [0, true],
      [1, true],
      [1, true],
    ]),
    K,
  ) === "secure",
  "4 right on 2 days: exactly at the boundary is secure.",
);
check(
  status(
    run(K, [
      [0, false],
      [0, true],
      [0, true],
      [1, true],
      [1, true],
    ]),
    K,
  ) === "secure",
  "4 of 5 (80%) on 2 days is secure.",
);
check(
  status(
    run(K, [
      [0, false],
      [0, false],
      [0, true],
      [0, true],
      [1, true],
      [1, true],
    ]),
    K,
  ) === "developing",
  "4 of 6 (67%) is below the accuracy line.",
);
check(
  status(
    run(K, [
      [0, true],
      [0, true],
      [1, true],
      [1, true],
      [1, false],
    ]),
    K,
  ) === "developing",
  "A miss as the latest answer is not secure.",
);
check(
  status(
    run(K, [
      [0, true],
      [0, true],
      [1, true],
    ]).facts[K] && run(K, [[0, true]]),
    K,
  ) === "developing",
  "A single answer is only evidence.",
);
// guess: a single lucky first try; or many first tries all in one sitting
const lucky = run(
  "mul:6:7",
  Array.from({ length: 12 }, () => [0, true]),
);
check(
  status(lucky, "mul:6:7") === "developing",
  "Twelve right answers in one day are still not secure (needs 2 separate days).",
);

// help never counts toward secure
const helped = run(
  K,
  Array.from({ length: 10 }, (_, i) => [i, true]).map(([d, c]) => [d, c]),
  { supported: true },
);
check(
  status(helped, K) === "developing" &&
    helped.facts[K].firstTryRight === 0 &&
    helped.facts[K].supportedRight === 10,
  "Supported right answers never count toward secure.",
);
let retry = M.emptyFacts();
for (let d = 0; d < 6; d += 1)
  retry = M.recordFactAttempt(
    retry,
    { key: K, correct: true, firstTry: false, supported: false },
    D(d),
  );
check(
  status(retry, K) === "developing",
  "A right answer after a miss (not first try) never counts toward secure.",
);
check(
  M.factAccuracy(retry.facts[K]).independent === 0,
  "Accuracy reads independent first-try answers only.",
);

// ---------- retention ----------
const secureAt = (key) =>
  run(key, [
    [0, true],
    [0, true],
    [1, true],
    [1, true],
  ]);
const untimed = secureAt(K);
check(status(untimed, K) === "secure", "Fixture: secure after two days.");
const back7 = attempt(untimed, K, true, D(8, 10));
check(
  status(back7, K) === "retained",
  "Secure, then right after exactly 7 days away: retained (no timing data at all).",
);
check(
  back7.facts[K].recent.every((entry) => !("ms" in entry)) &&
    M.factEfficiency(back7.facts[K]).band === null,
  "An untimed learner reaches retained with zero ms data.",
);
check(
  status(attempt(untimed, K, true, D(7, 10)), K) === "secure",
  "Only 6 days away: still secure, not retained.",
);
check(
  status(attempt(untimed, K, true, D(1, 18)), K) === "secure",
  "A same-week review keeps it secure only.",
);
const slipped = attempt(back7, K, false, D(9));
check(
  status(slipped, K) === "developing" &&
    slipped.facts[K].retainedAt === null &&
    M.isDifficult(slipped.facts[K], D(9)),
  "A miss clears retained and marks the slip as tricky.",
);
check(
  status(
    attempt(
      attempt(attempt(attempt(slipped, K, true, D(10)), K, true, D(10)), K, true, D(11)),
      K,
      true,
      D(12),
    ),
    K,
    D(13),
  ) !== "retained",
  "Retained has to be earned again after a slip.",
);
check(
  status(
    attempt(
      run(K, [
        [0, true],
        [1, true],
      ]),
      K,
      true,
      D(20),
    ),
    K,
  ) === "developing",
  "A gap alone does not make a developing fact retained.",
);
check(
  M.factRetention(back7.facts[K]).retained === true &&
    M.factRetention(untimed.facts[K]).retained === false,
  "factRetention reports the retained flag separately.",
);

// ---------- timing is separate and optional ----------
const timedRun = (ms) =>
  run(
    K,
    [
      [0, true],
      [0, true],
      [1, true],
      [1, true],
    ],
    { mode: "timed", ms },
  );
check(
  status(timedRun(9000), K) === "secure",
  "A slow timed learner is just as secure (speed is never required).",
);
check(status(timedRun(900), K) === status(untimed, K), "Speed does not change the status.");
check(
  M.factEfficiency(timedRun(2000).facts[K]).band === "quick" &&
    M.factEfficiency(timedRun(5000).facts[K]).band === "steady" &&
    M.factEfficiency(timedRun(9000).facts[K]).band === "building",
  "Speed bands come from timed answers only.",
);
check(
  M.factEfficiency(
    run(
      K,
      [
        [0, true],
        [0, true],
      ],
      { mode: "timed", ms: 1000 },
    ).facts[K],
  ).band === null,
  "Fewer than 3 timed answers: no band.",
);
check(
  !("ms" in run(K, [[0, true]], { mode: "untimed", ms: 1234 }).facts[K].recent[0]),
  "ms is dropped unless the learner chose timed mode.",
);
check(
  run(K, [[0, true]], { mode: "timed", ms: 99999999 }).facts[K].recent[0].ms ===
    M.FACT_SPEED_BANDS.maxMs,
  "Absurd timings are clamped.",
);
const report = M.factReport(back7, K, D(8));
check(
  report.accuracy &&
    report.efficiency &&
    report.retention &&
    report.strategy &&
    !("score" in report),
  "factReport keeps four separate readings and no blended score.",
);
same(
  M.factStrategyUse(
    run(
      K,
      [
        [0, true],
        [1, true],
      ],
      { strategy: "make-ten" },
    ).facts[K],
  ),
  { "make-ten": 2 },
  "Strategy use is counted on its own",
);
check(
  M.factStrategyUse(run(K, [[0, true]], { strategy: "not-a-strategy" }).facts[K])[
    "not-a-strategy"
  ] === undefined,
  "Unknown strategy ids are dropped.",
);

// ---------- ladder and due ----------
let ladder = M.emptyFacts();
const intervals = [];
for (const [day, correct] of [
  [0, true],
  [0, true],
  [1, true],
  [5, true],
  [13, true],
  [0.5, false],
]) {
  ladder = attempt(ladder, K, correct, D(Math.floor(day)) + (day % 1) * 3600000);
  intervals.push(ladder.facts[K].interval);
}
same(
  intervals,
  [1, 1, 3, 7, 14, 1],
  "The 1/3/7/14/30 ladder: climb on new days, restart after a miss",
);
check(ladder.facts[K].dueAt === D(0) + 0.5 * 3600000 + 86400000, "dueAt is now + interval days.");
const dueStore = secureAt("mul:4:5");
check(
  M.dueFacts(dueStore, D(1, 13)).length === 0 &&
    M.dueFacts(dueStore, D(30)).some((entry) => entry.key === "mul:4:5"),
  "A fact becomes due once its interval has passed.",
);
check(M.dueFacts(M.emptyFacts(), D(0)).length === 0, "No evidence, nothing due.");
check(
  M.dueFacts(dueStore, D(30), { statuses: ["developing"] }).length === 0,
  "dueFacts can filter by status.",
);

// ---------- difficult ----------
const tricky = run("mul:6:7", [
  [0, false],
  [0, true],
  [1, false],
  [1, true],
]);
check(M.isDifficult(tricky.facts["mul:6:7"], D(2)), "2 misses in the last 5 attempts is tricky.");
check(
  !M.isDifficult(
    run("mul:6:7", [
      [0, false],
      [0, true],
      [1, true],
    ]).facts["mul:6:7"],
    D(2),
  ),
  "One miss is not tricky.",
);
check(
  !M.isDifficult(secureAt("mul:6:7").facts["mul:6:7"], D(2)) && !M.isDifficult(undefined),
  "Secure facts and unseen facts are not tricky.",
);
check(
  !M.isDifficult(
    run("mul:6:7", [
      [0, false],
      [0, false],
      [1, true],
      [1, true],
      [2, true],
      [2, true],
      [3, true],
    ]).facts["mul:6:7"],
    D(4),
  ),
  "Old misses age out of the last-5 window.",
);
const mixedStore = {
  ...tricky,
  facts: {
    ...tricky.facts,
    "mul:2:3": run("mul:2:3", [
      [0, false],
      [0, false],
    ]).facts["mul:2:3"],
    "mul:11:12": run("mul:11:12", [
      [0, false],
      [0, false],
    ]).facts["mul:11:12"],
  },
};
same(
  M.difficultFacts(mixedStore, 3, D(2))
    .map((entry) => entry.key)
    .sort(),
  ["mul:2:3", "mul:6:7"],
  "difficultFacts is limited to the grade's own domain",
);
check(
  M.difficultFacts(mixedStore, 3, D(2)).every((entry) => entry.strategy),
  "Every difficult fact carries a strategy.",
);

// ---------- domains, families, progress map ----------
const allDomainKeys = new Set();
for (let grade = 0; grade <= 8; grade += 1) {
  const domain = M.gradeFactDomain(grade);
  check(
    domain.keys.length > 0 && domain.keys.every(M.isTrackedKey),
    `Grade ${grade}: every domain key is a tracked key.`,
  );
  domain.keys.forEach((key) => allDomainKeys.add(key));
}
check(
  M.gradeFactDomain(0).keys.every((key) => {
    const p = M.parseKey(key);
    return p.op === "add" ? p.x + p.y <= 5 : p.op === "sub" ? p.x <= 5 : false;
  }),
  "Kindergarten facts stay within 5.",
);
const g1 = M.gradeFactDomain(1);
check(
  g1.has("add:3:4") &&
    g1.has("sub:7:3") &&
    g1.has("add:10:10") &&
    g1.has("sub:20:10") &&
    !g1.keys.some((key) => /^(mul|div)/.test(key)),
  "Grade 1: add and subtract within 10 and 20.",
);
check(
  M.gradeFactDomain(2).has("add:20:30") && M.gradeFactDomain(2).has("sub:90:40"),
  "Grade 2 adds the 100 work.",
);
const g3 = M.gradeFactDomain(3);
check(
  g3.has("mul:6:7") && g3.has("div:42:6") && !g3.has("mul:11:12") && g3.has("add:7:8"),
  "Grade 3: times and division within 100, plus within 20 kept.",
);
check(
  M.gradeFactDomain(4).has("mul:11:12") &&
    M.gradeFactDomain(4).newKeys.every((key) => /^(mul|div)/.test(key)),
  "Grade 4 extends to 12 x 12; its new facts are times and division.",
);
check(
  M.gradeFactDomain(5).newKeys.length === 0 &&
    M.gradeFactDomain(8).keys.length === M.gradeFactDomain(5).keys.length,
  "Grade 5 maintains; Grades 6-8 use Grade 5's set.",
);
for (const key of allDomainKeys) {
  const family = M.familyOf(key);
  check(
    family &&
      family.keys.includes(
        M.parseKey(key).op === "add" || M.parseKey(key).op === "mul" ? key : family.id,
      ) &&
      family.keys.every((member) => M.familyOf(member).id === family.id),
    `${key}: family membership is symmetric.`,
  );
  check(
    family.equations.length >= 1 &&
      family.equations.every((equation) => /^\d+ [+−×÷] \d+ = \d+$/.test(equation)),
    `${key}: family equations are well formed.`,
  );
}
same(
  M.familyOf("sub:11:3").keys,
  ["add:3:8", "sub:11:3", "sub:11:8"],
  "Subtraction records link to their addition family",
);
same(
  M.familyOf("div:42:6").equations,
  ["6 × 7 = 42", "7 × 6 = 42", "42 ÷ 6 = 7", "42 ÷ 7 = 6"],
  "A division fact shows all four equations",
);
same(M.familyOf("mul:0:5").keys, ["mul:0:5", "div:0:5"], "Zero facts have no division by zero");
check(
  M.familyOf("add:9:3") === null && M.familyOf("junk") === null && M.familyOf("mul:13:2") === null,
  "Untracked keys have no family.",
);

// progress map: counts add up for every grade and operation, and track real statuses
const sample = (grade) => {
  const keys = M.gradeFactDomain(grade).keys;
  let store = M.emptyFacts();
  keys.forEach((key, i) => {
    if (i % 7 === 0)
      store = run(key, [
        [0, true],
        [0, true],
        [1, true],
        [1, true],
      ]).facts[key]
        ? {
            ...store,
            facts: {
              ...store.facts,
              [key]: run(key, [
                [0, true],
                [0, true],
                [1, true],
                [1, true],
              ]).facts[key],
            },
          }
        : store;
    else if (i % 7 === 1)
      store = {
        ...store,
        facts: { ...store.facts, [key]: attempt(M.emptyFacts(), key, true, D(0)).facts[key] },
      };
    else if (i % 7 === 2)
      store = {
        ...store,
        facts: {
          ...store.facts,
          [key]: run(key, [
            [0, true],
            [0, true],
            [1, true],
            [1, true],
            [9, true],
          ]).facts[key],
        },
      };
  });
  return store;
};
for (let grade = 0; grade <= 8; grade += 1) {
  const store = sample(grade);
  for (const op of M.factOps(grade)) {
    const map = M.progressMap(store, grade, op, D(30));
    const { secure, retained, developing, notYet, total } = map.counts;
    check(
      secure + retained + developing + notYet === total && total > 0,
      `Grade ${grade} ${op}: counts add up.`,
    );
    check(
      map.cells.length === map.rows.length &&
        map.cells.every((row) => row.length === map.cols.length),
      `Grade ${grade} ${op}: grid is rows x cols.`,
    );
    const keys = new Set(
      map.cells
        .flat()
        .filter((cell) => cell.key)
        .map((cell) => cell.key),
    );
    check(
      keys.size === total,
      `Grade ${grade} ${op}: every key appears in the grid exactly once as a distinct fact.`,
    );
    check(
      map.cells
        .flat()
        .every((cell) =>
          cell.key === null
            ? cell.status === "none"
            : M.FACT_STATUSES.includes(cell.status) && typeof cell.difficult === "boolean",
        ),
      `Grade ${grade} ${op}: cells carry status and difficult.`,
    );
    check(
      map.mastered === secure + retained,
      `Grade ${grade} ${op}: mastered is secure plus retained.`,
    );
    for (const band of map.bands)
      check(
        M.progressMap(store, grade, op, D(30), { band: band.id }).band.id === band.id,
        `Grade ${grade} ${op}: band ${band.id} can be chosen.`,
      );
  }
  check(
    M.progressMap(store, grade, "nope", D(0)).cells.length === 0,
    `Grade ${grade}: an operation the grade does not own gives an empty map.`,
  );
}
const g3map = M.progressMap(sample(3), 3, "mul", D(30));
check(
  g3map.counts.retained > 0 &&
    g3map.counts.secure > 0 &&
    g3map.counts.developing > 0 &&
    g3map.counts.notYet > 0,
  "Map separates retained, secure, developing and not-yet.",
);
check(
  M.progressMap(M.emptyFacts(), 3, "mul", D(0)).counts.notYet ===
    M.progressMap(M.emptyFacts(), 3, "mul", D(0)).counts.total,
  "An empty store is all not-yet.",
);

// ---------- strategies ----------
const used = new Set();
for (const key of allDomainKeys) {
  const strategy = M.strategyFor(key);
  check(
    M.STRATEGY_IDS.includes(strategy),
    `${key}: has a strategy from the fixed vocabulary (${strategy}).`,
  );
  used.add(strategy);
  const hint = M.strategyHint(key);
  const answer = M.factParts(key).answer;
  check(
    hint && hint.strategy === strategy && !/undefined|NaN|\{|\}/.test(hint.text),
    `${key}: hint is complete (${hint?.text}).`,
  );
  check(
    !new RegExp(`= ${answer}(?![\\d])`).test(hint.text),
    `${key}: hint does not state the answer (${hint.text}).`,
  );
  check(
    M.HINT_TEMPLATES[hint.id] === hint.template &&
      [...hint.template.matchAll(/\{(\w+)\}/g)].every(([, name]) => name in hint.vars),
    `${key}: hint vars match its template.`,
  );
}
check(
  M.STRATEGY_IDS.length === 14 &&
    Object.isFrozen(M.STRATEGY_IDS) &&
    new Set(M.STRATEGY_IDS).size === 14,
  "The fixed vocabulary has 14 ids.",
);
check(used.size >= 13, `The mapping uses nearly the whole vocabulary (${used.size} of 14).`);
for (const [key, expected] of Object.entries({
  "add:7:8": "make-ten",
  "add:6:6": "doubles",
  "add:6:7": "near-doubles",
  "mul:7:9": "nines-pattern",
  "mul:6:7": "break-apart",
  "mul:7:7": "square-facts",
  "mul:4:7": "half-and-double",
  "mul:11:12": "distributive",
  "mul:5:7": "fives-and-tens",
  "mul:0:9": "ones-and-zeros",
  "mul:2:8": "doubles",
  "div:42:6": "fact-family",
  "sub:15:8": "make-ten",
  "add:0:5": "ones-and-zeros",
  "add:1:5": "count-on",
  "mul:3:4": "array-model",
  "mul:3:7": "skip-count",
  "sub:12:6": "doubles",
  "div:18:2": "half-and-double",
  "add:20:30": "break-apart",
}))
  check(M.strategyFor(key) === expected, `${key} -> ${expected}, got ${M.strategyFor(key)}`);
check(
  M.strategyFor("junk") === null && M.strategyFor("add:9:3") === null,
  "No strategy for an untracked key.",
);

// ---------- keys from existing items ----------
let tracked = 0;
for (const grade of [1, 2, 3]) {
  const rng = seededRandom(grade * 77);
  for (const station of TRAILS[grade].stations) {
    for (let i = 0; i < 60; i += 1) {
      const item = makeProblem(grade, station, rng);
      const key = M.keyFromItem(item);
      if (!key) continue;
      tracked += 1;
      check(
        M.familyOf(key).id === chartKey(item),
        `Grade ${grade}/${station.id}: ${item.question} has the same fact family as the legacy chart (${chartKey(item)}).`,
      );
    }
  }
}
check(tracked > 300, `Trail facts for Grades 1-3 are recognised (${tracked}).`);
check(
  M.keyFromItem({ question: "34 × 6 = ?", answers: ["204"] }) === null &&
    M.keyFromItem({ question: "12 + 13 = ?", answers: ["25"] }) === null &&
    M.keyFromItem({ question: "Ann has 3 + 4 apples", answers: ["7"] }) === null,
  "Multi-digit work and other questions are not facts.",
);
check(
  M.keyFromItem({ question: "8 + 7 = ?", answers: ["16"] }) === null &&
    M.keyFromItem({ question: "7 + 8 = ?", answers: ["15"] }) === "add:7:8" &&
    M.keyFromItem({ question: "7 + 8 = ?", answers: ["15"] }) ===
      M.keyFromItem({ question: "8 + 7 = ?", answers: ["15"] }),
  "Either order of an addition is one fact; a disagreeing answer is refused.",
);

// ---------- sanitize ----------
const clean0 = M.sanitizeFacts(null);
same(clean0, M.emptyFacts(), "sanitize(null) is an empty store");
same(M.sanitizeFacts("junk"), M.emptyFacts(), "sanitize(string)");
same(M.sanitizeFacts([1, 2]), M.emptyFacts(), "sanitize(array)");
const hostile = M.sanitizeFacts({
  facts: {
    __proto__: { evil: 1 },
    "add:7:8": {
      attempts: 999,
      firstTryRight: "5",
      supportedRight: -3,
      misses: 1e12,
      recent: [
        { at: 1, correct: true },
        {
          at: D(0),
          day: "garbage",
          correct: 1,
          firstTry: false,
          ms: 5,
          mode: "untimed",
          strategy: "x",
        },
        null,
        "z",
        { at: D(1), correct: true, mode: "timed", ms: -5 },
        { at: D(2), correct: true, mode: "timed", ms: 1e9 },
        ...Array.from({ length: 30 }, (_, i) => ({ at: D(i), correct: true })),
      ],
      interval: 5,
      dueAt: "x",
      lastSeenDay: "nope",
      retainedAt: NaN,
    },
    "mul:13:2": { attempts: 1, firstTryRight: 1 },
    "add:9:3": { firstTryRight: 1 },
    "constructor:1:2": { firstTryRight: 1 },
    "mul:6:7": "string",
    "mul:2:3": { firstTryRight: 0, supportedRight: 0, misses: 0 },
    "div:42:6": { misses: 2, recent: "no", interval: 9999, dueAt: D(3), slipAt: D(2) },
  },
});
same(
  Object.keys(hostile.facts).sort(),
  ["add:7:8", "div:42:6"],
  "sanitize keeps only tracked keys with evidence",
);
const h = hostile.facts["add:7:8"];
check(
  h.attempts === h.firstTryRight + h.supportedRight + h.misses &&
    h.supportedRight === 0 &&
    h.firstTryRight === 5 &&
    h.misses === 100000,
  "sanitize clamps counts and recomputes attempts",
);
check(
  h.recent.length === M.FACT_THRESHOLDS.ringSize &&
    h.recent.every(
      (entry) =>
        /^\d{4}-\d{2}-\d{2}$/.test(entry.day) &&
        typeof entry.correct === "boolean" &&
        (entry.strategy === null || M.STRATEGY_IDS.includes(entry.strategy)),
    ),
  "sanitize caps the ring buffer and repairs entries",
);
check(
  h.recent.every((entry) => (entry.mode === "timed" ? true : !("ms" in entry))) &&
    h.recent.every(
      (entry) => !("ms" in entry) || (entry.ms >= 0 && entry.ms <= M.FACT_SPEED_BANDS.maxMs),
    ),
  "sanitize drops ms for untimed and clamps timed",
);
check(
  M.FACT_THRESHOLDS.ladder.includes(h.interval) &&
    h.dueAt === null &&
    h.lastSeenDay === null &&
    h.retainedAt === null,
  "sanitize snaps the interval and nulls bad stamps",
);
check(
  M.FACT_THRESHOLDS.ladder.includes(hostile.facts["div:42:6"].interval) &&
    hostile.facts["div:42:6"].recent.length === 0,
  "sanitize survives a non-array ring buffer",
);
const real = (() => {
  let store = secureAt("mul:6:7");
  store = attempt(store, "mul:6:7", true, D(9));
  return M.migrateLegacyTrail(
    { "add:3:8": { right: 6, missed: 1, last: true, lastDay: "2026-01-02" } },
    store,
    D(10),
  );
})();
same(
  M.sanitizeFacts(JSON.parse(JSON.stringify(real))),
  real,
  "sanitize is the identity on a real store (and survives JSON)",
);
same(M.sanitizeFacts(M.sanitizeFacts(hostile)), hostile, "sanitize is idempotent");
check(
  Object.keys(
    M.sanitizeFacts({
      facts: Object.fromEntries([...allDomainKeys].map((key) => [key, { firstTryRight: 1 }])),
    }).facts,
  ).length <= M.FACT_THRESHOLDS.maxFacts,
  "sanitize caps the number of records",
);
check(
  M.recordFactAttempt(M.emptyFacts(), { key: "add:9:3", correct: true }, D(0)).facts["add:9:3"] ===
    undefined &&
    M.recordFactAttempt(undefined, { key: "mul:6:7", correct: true }, D(0)).facts["mul:6:7"]
      .attempts === 1,
  "recordFactAttempt ignores untracked keys and tolerates a missing store.",
);
const frozen = Object.freeze({ version: 1, facts: Object.freeze({}) });
check(
  M.recordFactAttempt(frozen, { key: K, correct: true }, D(0)) !== frozen &&
    Object.keys(frozen.facts).length === 0,
  "recordFactAttempt never mutates the store it is given.",
);

// ---------- legacy migration ----------
const trail = Object.freeze({
  "add:3:8": Object.freeze({ right: 6, missed: 1, last: true, lastDay: "2026-01-02" }),
  "mul:6:7": Object.freeze({ right: 1, missed: 2, last: false, lastDay: "2026-01-03" }),
  "mul:2:2": Object.freeze({ right: 2, missed: 0, last: true }),
  "add:2:2": Object.freeze({ right: 0, missed: 0, last: false }),
  "sub:11:3": Object.freeze({ right: 9, missed: 0, last: true }),
  "mul:13:13": Object.freeze({ right: 9, missed: 0, last: true }),
  junk: Object.freeze({ right: 9 }),
});
const migrated = M.migrateLegacyTrail(trail, M.emptyFacts(), D(10));
same(
  Object.keys(migrated.facts).sort(),
  ["add:3:8", "mul:2:2", "mul:6:7"],
  "Migration credits only tracked add/mul chart cells that have evidence",
);
check(
  status(migrated, "add:3:8") === "secure" &&
    status(migrated, "mul:6:7") === "developing" &&
    status(migrated, "mul:2:2") === "developing",
  "Legacy counts become secure only at 5+ right and 80%+ with the last one right.",
);
check(
  migrated.facts["add:3:8"].recent.length === 0 &&
    migrated.facts["add:3:8"].dueAt === null &&
    migrated.facts["add:3:8"].attempts === 0 &&
    migrated.facts["add:3:8"].legacy.right === 6,
  "Migration invents no timestamps, timing or attempts and marks the evidence legacy.",
);
check(
  migrated.facts["add:3:8"].lastSeenDay === "2026-01-02" &&
    migrated.facts["mul:2:2"].lastSeenDay === null,
  "Only a date the chart really had is kept.",
);
check(
  status(migrated, "add:3:8") !== "retained" &&
    M.isDifficult(migrated.facts["mul:6:7"], D(10)) &&
    !M.isDifficult(migrated.facts["add:3:8"], D(10)),
  "Legacy evidence is never retained by itself; a last-missed chart cell with 2+ misses is tricky.",
);
same(M.migrateLegacyTrail(trail, migrated, D(11)), migrated, "Migration is idempotent");
same(
  M.migrateLegacyTrail(trail, M.migrateLegacyTrail(trail, M.emptyFacts(), D(10)), D(99)),
  migrated,
  "Running it twice, at any time, gives the same store",
);
check(
  M.dueFacts(migrated, D(10)).some((entry) => entry.key === "add:3:8"),
  "A legacy-secure fact is offered for review, since the new model has never checked it.",
);
const withNew = migrated.facts["add:3:8"] && attempt(migrated, "add:3:8", false, D(11));
check(
  status(withNew, "add:3:8") === "developing",
  "New evidence of a miss overrides legacy credit.",
);
const already = M.migrateLegacyTrail(trail, secureAt("mul:6:7"), D(10));
check(
  !already.facts["mul:6:7"].legacy && already.facts["mul:6:7"].attempts === 4,
  "A fact that already has new evidence is not credited twice.",
);
const retained = attempt(migrated, "add:3:8", true, D(40));
check(
  status(retained, "add:3:8") === "retained",
  "A legacy-secure fact can earn retained with a real right answer after a real gap.",
);
check(
  M.migrateLegacyTrail(null, null, D(0)).facts &&
    Object.keys(M.migrateLegacyTrail("x", M.emptyFacts(), 0).facts).length === 0,
  "Migration tolerates junk input.",
);

// ---------- recorder on the existing 'fluency-fact' event ----------
{
  let stored = M.emptyFacts();
  let clock = D(0);
  const win = new EventTarget();
  const fire = (question, firstTry, answers) =>
    win.dispatchEvent(
      new CustomEvent("fluency-fact", { detail: { item: { question, answers }, firstTry } }),
    );
  const off = M.attachFactRecorder(win, {
    now: () => clock,
    load: () => stored,
    save: (next) => {
      stored = next;
    },
  });
  fire("8 + 7 = ?", true, ["15"]);
  fire("11 − 3 = ?", false, ["8"]);
  fire("34 × 6 = ?", true, ["204"]);
  fire("what is this", true, ["1"]);
  win.dispatchEvent(new CustomEvent("fluency-fact", {}));
  check(
    stored.facts["add:7:8"]?.firstTryRight === 1 &&
      stored.facts["sub:11:3"]?.misses === 1 &&
      Object.keys(stored.facts).length === 2,
    "The recorder credits first-try answers and misses, and ignores everything that is not a basic fact.",
  );
  clock = D(1);
  fire("7 + 8 = ?", true, ["15"]);
  check(
    stored.facts["add:7:8"].attempts === 2 &&
      stored.facts["add:7:8"].recent[1].day !== stored.facts["add:7:8"].recent[0].day,
    "Reversed addition lands on the same record, stamped with the injected clock.",
  );
  off();
  fire("2 × 3 = ?", true, ["6"]);
  check(!stored.facts["mul:2:3"], "Unsubscribe stops recording.");
  check(typeof M.attachFactRecorder(null) === "function", "A missing window is tolerated.");
}

// ---------- sessions ----------
const NOW = D(14);
const rich = (grade) => {
  const keys = M.gradeFactDomain(grade).keys;
  const facts = {};
  keys.slice(0, 40).forEach((key, i) => {
    const pattern =
      i % 8 === 0
        ? [
            [0, false],
            [0, false],
            [1, true],
          ]
        : i % 3 === 0
          ? [
              [0, true],
              [0, true],
              [1, true],
              [1, true],
            ]
          : [
              [1, true],
              [2, true],
            ];
    facts[key] = run(key, pattern).facts[key];
  });
  return { version: 1, facts };
};
const stores = (grade) => [M.emptyFacts(), rich(grade)];
let sessions = 0;
for (let grade = 0; grade <= 8; grade += 1) {
  for (const store of stores(grade)) {
    for (const minutes of S.SESSION_MINUTES) {
      for (const mode of ["untimed", "timed"]) {
        sessions += 1;
        const label = `grade ${grade} / ${minutes} min / ${mode} / ${Object.keys(store.facts).length ? "rich" : "fresh"}`;
        const session = S.buildFactSession({
          store,
          grade,
          minutes,
          mode,
          now: NOW,
          rng: seededRandom(grade * 31 + minutes),
        });
        const plan = S.SESSION_PLAN[minutes];
        check(
          session.items.length === plan.items && plan.items === (minutes * 60) / S.SECONDS_PER_ITEM,
          `${label}: length matches the minutes setting (${session.items.length}).`,
        );
        check(
          session.items.every((item, i) => i === 0 || item.key !== session.items[i - 1].key),
          `${label}: no fact twice in a row.`,
        );
        const domain = M.gradeFactDomain(grade);
        const ahead = M.gradeFactDomain(Math.min(8, domain.grade + 1));
        check(
          session.items.every(
            (item) => domain.has(item.key) || (item.phase === "stretch" && ahead.has(item.key)),
          ),
          `${label}: items come from the grade's domain (stretch from the next).`,
        );
        check(
          session.items.every(
            (item) =>
              M.STRATEGY_IDS.includes(item.strategy) &&
              item.hint &&
              item.why &&
              S.WHY_TEMPLATES[item.whyKey] &&
              ["warm-up", "review", "learn", "stretch"].includes(item.phase),
          ),
          `${label}: every item has a strategy, hint, reason and phase.`,
        );
        check(
          session.items.every(
            (item) =>
              chartKey(item) !== null &&
              validateAnswer(item.answers[0], item) &&
              M.keyFromItem(item) === item.key &&
              item.kind === "number" &&
              Array.isArray(item.steps) &&
              item.steps.length,
          ),
          `${label}: items use the exact existing item format (chartKey, validateAnswer).`,
        );
        check(
          session.items.every(
            (item) => !/^(?!.*)/.test(item.question) && /^\d+ [+−×÷] \d+ = \?$/.test(item.question),
          ),
          `${label}: questions read "a ○ b = ?".`,
        );
        const learn = session.items.filter((item) => item.phase === "learn");
        check(
          learn.every((item) => item.strategyFirst && item.strategy),
          `${label}: learn items show the strategy first.`,
        );
        check(
          learn.filter((item) => item.reason !== "difficult").length <= plan.newCap,
          `${label}: new facts stay within the cap (${plan.newCap}).`,
        );
        check(learn.length <= plan.learnMax, `${label}: learn facts stay within ${plan.learnMax}.`);
        const counts = {};
        session.items.forEach((item) => {
          counts[item.key] = (counts[item.key] || 0) + 1;
        });
        check(
          Math.max(...Object.values(counts)) <= S.MAX_APPEARANCES + 1,
          `${label}: no fact is drilled more than ${S.MAX_APPEARANCES} times.`,
        );
        check(
          session.items
            .filter((item) => item.phase === "warm-up")
            .every((item, i) => session.items[i] === item),
          `${label}: warm-up comes first.`,
        );
        check(
          session.items.at(-1).phase === "stretch" ||
            !session.items.some((item) => item.phase === "stretch"),
          `${label}: stretch comes last.`,
        );
        check(
          !Object.keys(session).some((key) =>
            /limit|deadline|expire|countdown|penalty/i.test(key),
          ) && session.mode === mode,
          `${label}: no time limit or penalty fields.`,
        );
        const summary = S.sessionSummary(session);
        check(
          summary.lines[0].vars.n === session.items.length &&
            summary.lines.every(
              (entry) =>
                !/undefined|NaN|\{|\}/.test(entry.text) &&
                S.SUMMARY_TEMPLATES[entry.id] === entry.template,
            ),
          `${label}: the summary is built from counted numbers.`,
        );
        check(
          (mode === "timed") === summary.lines.some((entry) => entry.id === "timed"),
          `${label}: timed note appears only in timed mode.`,
        );
        check(
          summary.lines.find((entry) => entry.id === "difficult")?.vars.n ===
            (learn.filter((item) => item.reason === "difficult").length || undefined),
          `${label}: the tricky-fact count matches the items.`,
        );
        check(
          summary.lines.find((entry) => entry.id === "again")?.vars.n ===
            (session.items.filter((item) => item.repeat).length || undefined),
          `${label}: the second-look count matches the items.`,
        );
      }
    }
  }
}
check(sessions === 9 * 2 * 3 * 2, "Swept every grade, store, length and mode.");
const fiveMin = S.buildFactSession({
  store: rich(3),
  grade: 3,
  minutes: 5,
  now: NOW,
  rng: seededRandom(4),
});
const tenMin = S.buildFactSession({
  store: rich(3),
  grade: 3,
  minutes: 10,
  now: NOW,
  rng: seededRandom(4),
});
check(
  fiveMin.items.length === 10 &&
    tenMin.items.length === 20 &&
    fiveMin.items.filter((item) => item.phase === "learn").length <= 2,
  "A 5-minute session is short: 10 facts and at most 2 learn items.",
);
same(
  S.buildFactSession({
    store: rich(3),
    grade: 3,
    minutes: 10,
    now: NOW,
    rng: seededRandom(9),
  }).items.map((item) => item.question),
  S.buildFactSession({
    store: rich(3),
    grade: 3,
    minutes: 10,
    now: NOW,
    rng: seededRandom(9),
  }).items.map((item) => item.question),
  "A seeded session is reproducible",
);
check(
  S.buildFactSession({ store: rich(3), grade: 3, minutes: 10, now: NOW, rng: seededRandom(9) })
    .items.map((item) => item.question)
    .join() !==
    S.buildFactSession({ store: rich(3), grade: 3, minutes: 10, now: NOW, rng: seededRandom(10) })
      .items.map((item) => item.question)
      .join(),
  "A different seed gives a different session",
);
check(
  S.buildFactSession({
    store: M.emptyFacts(),
    grade: 3,
    minutes: 7,
    now: NOW,
    rng: seededRandom(1),
  }).minutes === 10 && S.buildFactSession({}).items.length === 20,
  "An unknown minutes value falls back to 10; defaults never throw.",
);
check(
  S.buildFactSession({ store: null, grade: "x", minutes: 5, now: NOW, rng: seededRandom(1) }).items
    .length === 10,
  "Junk grade and store never throw.",
);

// tricky facts: learn phase, strategy first, partners interleaved
const trickyStore = {
  version: 1,
  facts: {
    "mul:6:7": run("mul:6:7", [
      [0, false],
      [0, false],
      [1, true],
    ]).facts["mul:6:7"],
    "mul:7:8": run("mul:7:8", [
      [0, false],
      [1, false],
    ]).facts["mul:7:8"],
  },
};
const trickySession = S.buildFactSession({
  store: trickyStore,
  grade: 3,
  minutes: 10,
  now: NOW,
  rng: seededRandom(5),
});
const trickyLearn = trickySession.items.filter(
  (item) => item.phase === "learn" && item.reason === "difficult",
);
same(
  trickyLearn.map((item) => item.key).sort(),
  ["mul:6:7", "mul:7:8"],
  "Difficult facts are taught first, in the learn phase",
);
check(
  trickyLearn.every(
    (item) =>
      item.strategyFirst &&
      item.strategy &&
      item.hint &&
      /tricky/.test(item.why) &&
      item.whyVars.misses >= 2,
  ),
  "Difficult items carry a strategy and a counted reason.",
);
const familyKeys = trickySession.items.filter(
  (item) => item.reason === "partner" || item.reason === "new",
);
check(
  familyKeys.every((item) => !trickyStore.facts[item.key]),
  "New facts are facts with no evidence yet.",
);
const firstIndex = (key) =>
  trickySession.items.findIndex((item) => item.key === key && !item.repeat);
const secondIndex = (key) =>
  trickySession.items.findIndex((item) => item.key === key && item.repeat);
check(
  trickyLearn.every((item) => secondIndex(item.key) > firstIndex(item.key)),
  "Each learn fact returns later in the session as retrieval practice.",
);

// due reviews of secure facts show up as review (retention)
const dueStore2 = {
  version: 1,
  facts: Object.fromEntries(
    ["mul:4:5", "mul:3:6", "mul:2:9", "add:7:8", "mul:8:9"].map((key) => [
      key,
      secureAt(key).facts[key],
    ]),
  ),
};
const dueSession = S.buildFactSession({
  store: dueStore2,
  grade: 3,
  minutes: 10,
  now: D(40),
  rng: seededRandom(6),
});
const dueItems = dueSession.items.filter((item) => item.whyKey === "review.due");
check(
  dueItems.length === 5 &&
    dueItems.every((item) => item.phase === "review" && item.whyVars.days > 0),
  "Every due secure fact is reviewed first, with the days since it was seen.",
);
check(
  S.sessionSummary(dueSession).lines.find((entry) => entry.id === "due").vars.n === 5,
  "The summary counts the due reviews.",
);
const notDue = S.buildFactSession({
  store: dueStore2,
  grade: 3,
  minutes: 10,
  now: D(2),
  rng: seededRandom(6),
});
check(
  !notDue.items.some((item) => item.whyKey === "review.due"),
  "Facts that are not due are not presented as due.",
);

// too many developing facts: limit new facts and say so
const loaded = {
  version: 1,
  facts: Object.fromEntries(
    M.gradeFactDomain(3)
      .keys.slice(0, 14)
      .map((key) => [key, attempt(M.emptyFacts(), key, true, D(0)).facts[key]]),
  ),
};
const held = S.buildFactSession({
  store: loaded,
  grade: 3,
  minutes: 15,
  now: NOW,
  rng: seededRandom(7),
});
check(
  held.heldBack &&
    held.items.filter((item) => item.phase === "learn" && item.reason !== "difficult").length <=
      1 &&
    S.sessionSummary(held).lines.some((entry) => entry.id === "heldBack" && entry.vars.m === 14),
  "With many developing facts, new facts are held to one and the summary says why.",
);

// finishing a session
const nearly = {
  version: 1,
  facts: {
    "mul:6:7": run("mul:6:7", [
      [0, true],
      [0, true],
      [1, true],
    ]).facts["mul:6:7"],
    "mul:8:9": secureAt("mul:8:9").facts["mul:8:9"],
  },
};
const frozenNearly = JSON.parse(JSON.stringify(nearly));
const results = [
  { key: "mul:6:7", correct: true, firstTry: true, strategy: "break-apart" },
  { key: "mul:3:4", correct: false, firstTry: true },
  { key: "mul:3:4", correct: true, firstTry: false, supported: true },
  { key: "mul:2:5", correct: false, firstTry: true },
  { key: "mul:2:5", correct: false, firstTry: true },
  {
    key: "mul:8:9",
    correct: true,
    firstTry: true,
    mode: "timed",
    ms: 4100,
    strategy: "nines-pattern",
  },
  { key: "add:9:3", correct: true },
  null,
];
const done = S.finishSession(nearly, results, D(2));
same(nearly, frozenNearly, "finishSession does not mutate the store it receives");
check(
  done.receipt.practiced === 4 && done.receipt.attempts === 6 && done.receipt.firstTryRight === 2,
  `Receipt counts facts, attempts and first-try rights (${JSON.stringify(done.receipt)}).`,
);
same(done.receipt.newlySecure, ["mul:6:7"], "A fact that crossed the secure line is named");
same(
  done.receipt.needsAnotherLook,
  ["mul:2:5"],
  "A fact with 2 misses is flagged as worth another look",
);
same(
  done.receipt.strategyUse,
  { "break-apart": 1, "nines-pattern": 1 },
  "Strategy use is counted from what was recorded",
);
check(
  done.receipt.timedAnswers === 1 &&
    done.store.facts["mul:8:9"].recent.at(-1).ms === 4100 &&
    done.store.facts["mul:3:4"].supportedRight === 1 &&
    done.store.facts["mul:3:4"].misses === 1,
  "Timed ms is a separate field; supported answers stay separate from first-try rights.",
);
check(
  S.receiptSummary(done.receipt).every(
    (entry) =>
      !/undefined|NaN|\{|\}/.test(entry.text) && S.RECEIPT_TEMPLATES[entry.id] === entry.template,
  ),
  "The receipt reads from counted numbers.",
);
const lone = S.finishSession(M.emptyFacts(), [], D(0));
check(
  lone.receipt.practiced === 0 &&
    lone.receipt.attempts === 0 &&
    S.finishSession(undefined, undefined, D(0)).receipt.attempts === 0,
  "An empty or missing result list gives an empty receipt.",
);
// a whole session answered correctly untimed, over two days, makes progress without any ms data
let journey = M.emptyFacts();
for (let day = 0; day < 3; day += 1) {
  const session = S.buildFactSession({
    store: journey,
    grade: 3,
    minutes: 10,
    now: D(day),
    rng: seededRandom(100 + day),
  });
  journey = S.finishSession(
    journey,
    session.items.map((item) => ({
      key: item.key,
      correct: true,
      firstTry: true,
      strategy: item.strategy,
    })),
    D(day),
  ).store;
}
check(
  Object.values(journey.facts).some((record) => M.factStatus(record, D(3)) === "secure") &&
    Object.values(journey.facts).every((record) =>
      record.recent.every((entry) => !("ms" in entry)),
    ),
  "An untimed learner makes real progress with zero timing data.",
);

// ---------- storage, profiles and the JSON backup ----------
{
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: memory() });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: memory() });
  school.selectProfile(0);
  check(M.FACTS_KEY === "ewl-fluency-moby-facts-v1", "The storage key is the documented one.");
  same(M.loadFacts(), M.emptyFacts(), "Nothing saved loads an empty store");
  M.saveFacts(real);
  same(M.loadFacts(), real, "Facts round-trip through storage");
  check(localStorage.getItem("ewl-fluency-moby-facts-v1") !== null, "Learner 0 uses the bare key.");
  school.selectProfile(1);
  same(M.loadFacts(), M.emptyFacts(), "Another learner has their own records");
  M.saveFacts(secureAt("add:2:9"));
  check(
    localStorage.getItem("ewl-fluency-moby-facts-v1:profile-1") !== null &&
      Object.keys(M.loadFacts().facts).join() === "add:2:9",
    "Facts are profile-scoped.",
  );
  school.selectProfile(0);
  localStorage.setItem("ewl-fluency-moby-facts-v1", "{not json");
  same(M.loadFacts(), M.emptyFacts(), "A corrupted save loads empty and does not throw");
  localStorage.setItem(
    "ewl-fluency-moby-facts-v1",
    JSON.stringify({ facts: { "mul:6:7": { firstTryRight: "x", recent: 5 }, bad: 1 } }),
  );
  same(M.loadFacts(), M.emptyFacts(), "A hand-edited save is repaired");

  // the backup exactly as app.js builds and restores it
  M.saveFacts(real);
  const wire = JSON.parse(
    JSON.stringify({
      ...school.makeBackup({ progress: {}, tutor: emptyTutor(), settings: {}, grade: 3 }),
      play: play.exportPlay(),
    }),
  );
  check(
    wire.play.facts && Object.keys(wire.play.facts.facts).length === Object.keys(real.facts).length,
    "The JSON backup carries the fact records.",
  );
  check(school.parseBackup(wire).grade === 3, "The backup still parses as before.");
  const restored = play.cleanPlay(wire.play);
  same(restored.facts, real, "Restoring sanitizes the facts and keeps the real ones");
  const poisoned = JSON.parse(JSON.stringify(wire.play));
  poisoned.facts.facts["add:7:8"] = {
    firstTryRight: "99999999999",
    recent: [{ at: D(0), correct: true, ms: -1, strategy: "evil" }],
    interval: 11,
    retainedAt: "x",
  };
  poisoned.facts.facts["mul:99:99"] = { firstTryRight: 5 };
  poisoned.facts.facts.__proto__ = { firstTryRight: 5 };
  const cleaned = play.cleanPlay(poisoned).facts;
  check(
    !cleaned.facts["mul:99:99"] &&
      cleaned.facts["add:7:8"].firstTryRight === 100000 &&
      cleaned.facts["add:7:8"].retainedAt === null &&
      cleaned.facts["add:7:8"].recent[0].strategy === null &&
      M.FACT_THRESHOLDS.ladder.includes(cleaned.facts["add:7:8"].interval),
    "A hand-edited backup is sanitized on restore.",
  );
  localStorage.removeItem("ewl-fluency-moby-facts-v1");
  play.importPlay(restored);
  same(M.loadFacts(), real, "Importing a backup restores the fact records");
  const older = play.cleanPlay({ trail: {}, rewards: {} });
  check(older.facts === null, "A backup made before the fact model has no facts.");
  M.saveFacts(secureAt("add:5:5"));
  play.importPlay(older);
  check(
    Object.keys(M.loadFacts().facts).join() === "add:5:5",
    "Restoring an older backup leaves the learner's own facts alone.",
  );
  check(
    play.cleanPlay({ trail: {}, rewards: {}, facts: "junk" }).facts === null &&
      play.cleanPlay({ trail: {}, rewards: {}, facts: [] }).facts !== undefined,
    "Non-object facts in a backup are ignored.",
  );
}

// ---------- Spanish ----------
{
  const english = new Set([
    ...Object.values(M.STRATEGY_LABELS),
    ...Object.values(M.STATUS_LABELS),
    ...Object.values(M.SPEED_LABELS),
    ...Object.values(M.PHASE_LABELS),
    ...Object.values(M.STATUS_RULES),
    ...Object.values(M.HINT_TEMPLATES),
    ...Object.values(S.WHY_TEMPLATES),
    ...Object.values(S.SUMMARY_TEMPLATES),
    ...Object.values(S.RECEIPT_TEMPLATES),
  ]);
  for (let grade = 0; grade <= 8; grade += 1)
    M.gradeFactDomain(grade).bands.forEach((band) => english.add(band.label));
  const holes = [...english].filter((text) => !(text in ES_MOBY_FACTS));
  check(
    holes.length === 0,
    `Every string the modules produce has a Spanish entry. Missing: ${holes.join(" | ")}`,
  );
  const orphans = Object.keys(ES_MOBY_FACTS).filter((text) => !english.has(text));
  check(orphans.length === 0, `No orphan Spanish entries. Orphans: ${orphans.join(" | ")}`);
  const holders = (text) =>
    [...text.matchAll(/\{(\w+)\}/g)]
      .map((match) => match[1])
      .sort()
      .join();
  for (const [text, spanish] of Object.entries(ES_MOBY_FACTS)) {
    check(holders(text) === holders(spanish), `Placeholders match: ${text}`);
    check(spanish.trim() && !/\busted\b/i.test(spanish), `Spanish is filled and uses tú: ${text}`);
    check(
      spanish !== text || /^(Doubles?|Building)$/.test(text) === false,
      `Spanish differs from English: ${text}`,
    );
    if (text in ES)
      check(ES[text] === spanish, `Agrees with the existing translation of "${text}": ${ES[text]}`);
  }
  for (const rule of M.statusRules())
    check(
      rule.text && !/\{|\}/.test(rule.text) && ES_MOBY_FACTS[rule.template],
      `Status rule ${rule.id} renders and translates.`,
    );
  check(
    M.statusRules().find((rule) => rule.id === "secure").vars.n ===
      M.FACT_THRESHOLDS.secureMinIndependent,
    "Status rules read the real thresholds.",
  );
}

if (failures.length) {
  console.error(`${failures.length} fluency-moby-facts check(s) failed:`);
  for (const message of failures.slice(0, 60)) console.error(` - ${message}`);
  process.exit(1);
}
console.log(`fluency-moby-facts: all checks passed (${sessions} sessions swept).`);
