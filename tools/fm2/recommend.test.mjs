// The recommender, proven with scripted learner histories and seeded random states. Expected values come from an
// oracle written in this file (its own mastery formula and its own sort), never from the module under test.
// @fm2 FM-022 FM-064 FM-065 FM-020
import assert from "node:assert/strict";
import { reasonText, recommend } from "../../math/fluency-lab/family/fm2/recommend.js";
import { FAKE_GAMES } from "./fixtures/fake-games.mjs";

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};
const DAY = 86400000;
const NOW = 1_800_000_000_000;
const GAMES = FAKE_GAMES;

// ---- oracle ---------------------------------------------------------------------------------------------------
const weightOf = ([c, h]) => (!c ? 0 : h >= 2 ? 0.35 : h === 1 ? 0.6 : 1);
function oracleMastery(attempts) {
  const last = attempts.slice(-12);
  if (!last.length) return { score: 0, n: 0 };
  let top = 0;
  let bottom = 0;
  last.forEach((a, i) => {
    const w = Math.pow(0.85, last.length - 1 - i);
    top += w * weightOf(a);
    bottom += w;
  });
  return { score: top / bottom, n: last.length };
}
const oracleStars = (m) =>
  m.n < 3 ? 0 : m.score >= 0.9 ? 3 : m.score >= 0.75 ? 2 : m.score >= 0.5 ? 1 : 0;
const record = (attempts, level, dueAt) => ({
  recent: attempts.map(([c, h]) => ({ c, h, l: level, t: 0 })),
  level,
  plays: attempts.length,
  dueAt,
});
const key = (gameId, skillId) => `${gameId}:${skillId}`;
const stateOf = (entries) => ({ skills: Object.fromEntries(entries) });
const names = (recs) => recs.map((r) => `${r.gameId}:${r.skillId}`);
const REASON_RANK = { review: 0, weak: 1, stretch: 2, new: 3 };
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const lastHalf = (n) => Array.from({ length: n }, () => [0, 0]);
const clean = (n) => Array.from({ length: n }, () => [1, 0]);

// ---- A. brand-new learner: everything is new, spread over games --------------------------------------------------
for (const grade of [0, 3, 5, 8]) {
  const all = recommend({ state: { skills: {} }, grade, games: GAMES, now: NOW, limit: 1000 });
  const covering = GAMES.flatMap((g) =>
    g.skills.filter((s) => s.grades[0] <= grade && grade <= s.grades[1]).map((s) => ({ g, s })),
  );
  ok(
    all.length === covering.length && new Set(names(all)).size === all.length,
    `grade ${grade}: every covering skill once (${all.length})`,
  );
  ok(
    all.every((r) => r.reason === "new"),
    `grade ${grade}: all new`,
  );
  for (const r of all) {
    const skill = GAMES.find((g) => g.id === r.gameId).skills.find((s) => s.id === r.skillId);
    ok(
      r.level === (grade > skill.grades[0] ? 2 : 1),
      `${r.skillId} grade ${grade}: new skills start at 1, or 2 above their first grade`,
    );
    ok(
      r.evidence.n === 0 &&
        r.evidence.mastery === 0 &&
        r.evidence.stars === 0 &&
        r.evidence.dueDays === null,
      "new evidence is empty",
    );
  }
  for (const g of GAMES) {
    const order = g.skills
      .filter((s) => s.grades[0] <= grade && grade <= s.grades[1])
      .map((s) => s.id);
    ok(
      JSON.stringify(all.filter((r) => r.gameId === g.id).map((r) => r.skillId)) ===
        JSON.stringify(order),
      `${g.id} grade ${grade}: skills keep the game's own order`,
    );
  }
  const head = all.slice(0, 10);
  ok(
    new Set(head.map((r) => r.gameId)).size === 10,
    `grade ${grade}: first ten recommendations come from ten different games`,
  );
  for (let i = 1; i < all.length - 20; i += 1)
    ok(
      all[i].gameId !== all[i - 1].gameId,
      `grade ${grade}: consecutive new skills differ in game (#${i})`,
    );
}
{
  const six = recommend({ state: { skills: {} }, grade: 3, games: GAMES, now: NOW });
  ok(six.length === 6, "default limit is 6");
  ok(
    JSON.stringify(recommend({ state: {}, grade: 3, games: GAMES, now: NOW, limit: 0 })) === "[]",
    "limit 0",
  );
  ok(recommend({ state: {}, grade: 3, games: GAMES, now: NOW, limit: 2 }).length === 2, "limit 2");
  ok(
    recommend({ state: null, grade: 3, games: [], now: NOW }).length === 0,
    "no games, no recommendations",
  );
}

// ---- B. review: due skills, lowest mastery first, then oldest due ----------------------------------------------------
{
  const s = (id) => key(id, `${id}-g3`);
  const wrongs = lastHalf(4);
  const mixed = [
    [1, 0],
    [0, 0],
    [1, 0],
    [0, 0],
  ];
  const state = stateOf([
    [s("number-builder"), record(wrongs, 1, NOW - 1 * DAY)], // mastery 0, due 1 day ago
    [s("math-match"), record(mixed, 2, NOW - 2 * DAY)], // same mastery as array-architect, due later than it
    [s("array-architect"), record(mixed, 1, NOW - 5 * DAY)], // same mastery, oldest due, so it comes first of the pair
    [s("fraction-kitchen"), record(clean(5), 1, NOW - 9 * DAY)], // highest mastery, very overdue: last of the reviews
    [s("math-market"), record(wrongs, 1, NOW + 1 * DAY)], // weak but NOT due: not a review
  ]);
  const recs = recommend({ state, grade: 3, games: GAMES, now: NOW, limit: 8 });
  ok(
    JSON.stringify(names(recs.slice(0, 4))) ===
      JSON.stringify([
        "number-builder:number-builder-g3",
        "array-architect:array-architect-g3",
        "math-match:math-match-g3",
        "fraction-kitchen:fraction-kitchen-g3",
      ]),
    `review order by mastery then oldest due: ${names(recs.slice(0, 4))}`,
  );
  ok(
    recs.slice(0, 4).every((r) => r.reason === "review"),
    "first four are review",
  );
  ok(
    recs[4].reason === "weak" && recs[4].gameId === "math-market",
    "weak but not due comes after the reviews",
  );
  ok(
    recs.slice(5).every((r) => r.reason === "new"),
    "then new skills",
  );
  ok(recs[0].level === 1 && recs[2].level === 2, "review keeps the stored level");
  const first = recs[0];
  ok(
    first.evidence.mastery === 0 &&
      first.evidence.n === 4 &&
      first.evidence.stars === 0 &&
      first.evidence.dueDays === 1,
    `evidence: ${JSON.stringify(first.evidence)}`,
  );
  const fk = recs[3].evidence;
  ok(
    Math.abs(fk.mastery - oracleMastery(clean(5)).score) < 1e-12 &&
      fk.stars === 3 &&
      fk.dueDays === 9,
    "evidence for a strong overdue skill",
  );
  ok(
    recs.find((r) => r.gameId === "math-match").evidence.recentRight === 2 &&
      recs.find((r) => r.gameId === "math-match").evidence.recentOf === 4,
    "recent 2 of 4",
  );
  // Alphabetical tie: identical mastery and identical due date.
  const tie = stateOf([
    [s("pattern-detective"), record(wrongs, 1, NOW - DAY)],
    [s("math-match"), record(wrongs, 1, NOW - DAY)],
    [s("number-builder"), record(wrongs, 1, NOW - DAY)],
  ]);
  ok(
    JSON.stringify(names(recommend({ state: tie, grade: 3, games: GAMES, now: NOW, limit: 3 }))) ===
      JSON.stringify([
        "math-match:math-match-g3",
        "number-builder:number-builder-g3",
        "pattern-detective:pattern-detective-g3",
      ]),
    "ties break by gameId alphabetically",
  );
  // Due exactly now counts as due.
  const exact = stateOf([[s("math-match"), record(clean(3), 1, NOW)]]);
  ok(
    recommend({ state: exact, grade: 3, games: GAMES, now: NOW, limit: 1 })[0].reason === "review",
    "dueAt equal to now is due",
  );
  const later = stateOf([
    [
      s("math-match"),
      record(
        [
          [1, 1],
          [1, 1],
          [1, 1],
        ],
        1,
        NOW + 1,
      ),
    ],
  ]); // 0.6 mastery: not weak, not three stars
  ok(
    recommend({ state: later, grade: 3, games: GAMES, now: NOW, limit: 30 }).every(
      (r) => r.gameId !== "math-match" || r.skillId !== "math-match-g3",
    ),
    "not yet due, not weak, not three stars: left alone",
  );
}

// ---- C. weak: reliable (3+ attempts) and mastery below 0.6 ----------------------------------------------------------
{
  const future = NOW + 3 * DAY;
  const s = (id) => key(id, `${id}-g4`);
  const hist = {
    reliableLow: [
      [0, 0],
      [0, 0],
      [1, 0],
    ],
    lowest: lastHalf(5),
    twoOnly: [
      [0, 0],
      [0, 0],
    ],
    justOver: [
      [0, 0],
      [1, 0],
      [1, 0],
      [1, 0],
    ],
    hinted: [
      [1, 3],
      [1, 3],
      [1, 3],
    ],
  };
  const m = Object.fromEntries(Object.entries(hist).map(([k, v]) => [k, oracleMastery(v)]));
  ok(
    m.reliableLow.score < 0.6 &&
      m.lowest.score === 0 &&
      m.justOver.score >= 0.6 &&
      m.hinted.score < 0.6,
    "oracle sanity for the weak boundary",
  );
  const state = stateOf([
    [s("number-builder"), record(hist.reliableLow, 1, future)],
    [s("math-match"), record(hist.lowest, 1, future)],
    [s("fraction-kitchen"), record(hist.twoOnly, 1, future)],
    [s("math-market"), record(hist.justOver, 1, future)],
    [s("array-architect"), record(hist.hinted, 3, future)],
  ]);
  const recs = recommend({ state, grade: 4, games: GAMES, now: NOW, limit: 100 });
  const weak = recs.filter((r) => r.reason === "weak");
  const expectWeak = Object.entries({
    "number-builder": m.reliableLow.score,
    "math-match": m.lowest.score,
    "array-architect": m.hinted.score,
  })
    .sort((a, b) => a[1] - b[1] || cmp(a[0], b[0]))
    .map(([id]) => id);
  ok(
    JSON.stringify(weak.map((r) => r.gameId)) === JSON.stringify(expectWeak),
    `weak ordered by mastery: ${weak.map((r) => r.gameId)} vs ${expectWeak}`,
  );
  ok(weak.find((r) => r.gameId === "array-architect").level === 3, "weak keeps stored level 3");
  ok(
    !names(recs).includes("fraction-kitchen:fraction-kitchen-g4"),
    "two attempts is not reliable evidence: never weak, and not new either",
  );
  ok(!names(recs).includes("math-market:math-market-g4"), "mastery above 0.6 is left alone");
  ok(
    recs.findIndex((r) => r.reason === "weak") === 0 &&
      recs.findIndex((r) => r.reason === "new") === 3,
    "weak comes before new",
  );
}

// ---- D. stretch: three stars and level below 3 -> same skill, next level ---------------------------------------------
{
  const future = NOW + 5 * DAY;
  const s = (id) => key(id, `${id}-g5`);
  const state = stateOf([
    [s("number-builder"), record(clean(5), 1, future)], // stars 3, level 1 -> 2
    [s("math-match"), record(clean(6), 2, future)], // stars 3, level 2 -> 3
    [s("array-architect"), record(clean(6), 3, future)], // stars 3 but top level: nothing to stretch to
    [
      s("math-market"),
      record(
        [
          [1, 0],
          [1, 0],
          [1, 0],
          [0, 0],
          [1, 0],
        ],
        1,
        future,
      ),
    ], // two stars at best
    [s("fraction-kitchen"), record(clean(2), 1, future)], // not reliable: no stars
  ]);
  ok(
    oracleStars(oracleMastery(clean(5))) === 3 &&
      oracleStars(oracleMastery(clean(2))) === 0 &&
      oracleStars(
        oracleMastery([
          [1, 0],
          [1, 0],
          [1, 0],
          [0, 0],
          [1, 0],
        ]),
      ) < 3,
    "oracle stars",
  );
  const recs = recommend({ state, grade: 5, games: GAMES, now: NOW, limit: 100 });
  const stretch = recs.filter((r) => r.reason === "stretch");
  ok(
    JSON.stringify(stretch.map((r) => [r.gameId, r.level])) ===
      JSON.stringify([
        ["number-builder", 2],
        ["math-match", 3],
      ]),
    `stretch lowest level first and level+1: ${JSON.stringify(stretch.map((r) => [r.gameId, r.level]))}`,
  );
  ok(
    stretch.every((r) => r.evidence.stars === 3 && r.skillId.endsWith("-g5")),
    "stretch is the same skill, with three stars",
  );
  ok(
    !names(recs).includes("array-architect:array-architect-g5"),
    "a three-star level-3 skill is finished: not recommended again",
  );
  ok(
    recs.findIndex((r) => r.reason === "stretch") === 0 &&
      recs.findIndex((r) => r.reason === "new") === 2,
    "stretch comes before new",
  );
}

// ---- E. the four rules together fire in priority order -----------------------------------------------------------
{
  const future = NOW + 4 * DAY;
  const state = stateOf([
    [key("math-match", "math-match-g6"), record(clean(5), 1, future)], // stretch
    [key("number-builder", "number-builder-g6"), record(lastHalf(4), 2, future)], // weak
    [key("array-architect", "array-architect-g6"), record(clean(4), 1, NOW - DAY)], // review (strong but due)
  ]);
  const recs = recommend({ state, grade: 6, games: GAMES, now: NOW, limit: 100 });
  ok(
    JSON.stringify(recs.slice(0, 3).map((r) => r.reason)) ===
      JSON.stringify(["review", "weak", "stretch"]) && recs[3].reason === "new",
    "review, weak, stretch, new",
  );
  ok(
    recs[0].gameId === "array-architect" &&
      recs[1].gameId === "number-builder" &&
      recs[2].gameId === "math-match",
    "the right skill in each slot",
  );
  ok(
    recs[3].gameId !== recs[2].gameId,
    "the first new skill is from a different game than the one before it",
  );
}

// ---- F. earlier-grade review: grade-1 skills with weak evidence, never two grades back, at most one -------------------
{
  const future = NOW + 4 * DAY;
  const state = stateOf([
    [
      key("math-match", "math-match-g3"),
      record(
        [
          [1, 0],
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        1,
        future,
      ),
    ], // grade 3, weak
    [key("number-builder", "number-builder-g3"), record(lastHalf(5), 2, future)], // grade 3, weaker
    [key("fraction-kitchen", "fraction-kitchen-g2"), record(lastHalf(5), 1, future)], // two grades back: ignored
    [key("math-market", "math-market-g3"), record(clean(5), 1, future)], // strong: ignored
  ]);
  const recs = recommend({ state, grade: 4, games: GAMES, now: NOW, limit: 100 });
  ok(
    recs[0].reason === "review" &&
      recs[0].gameId === "number-builder" &&
      recs[0].skillId === "number-builder-g3" &&
      recs[0].level === 2,
    "the weakest earlier-grade skill comes back as a review at its stored level",
  );
  ok(recs.filter((r) => r.reason === "review").length === 1, "at most one earlier-grade review");
  ok(
    !names(recs).includes("fraction-kitchen:fraction-kitchen-g2") &&
      !names(recs).includes("math-match:math-match-g3"),
    "grade-2 skills and the second weak grade-3 skill are not offered at grade 4",
  );
  const g3 = recommend({ state, grade: 3, games: GAMES, now: NOW, limit: 100 });
  ok(
    g3
      .filter((r) => r.reason === "weak")
      .map((r) => r.gameId)
      .join() === "number-builder,math-match",
    "the same skills are simply weak when practiced at their own grade",
  );
  ok(
    recommend({ state, grade: 0, games: GAMES, now: NOW, limit: 100 }).every(
      (r) => r.reason === "new",
    ),
    "grade 0 has no earlier grade to review",
  );
}

// ---- G. determinism and seeded property tests (FM-065) --------------------------------------------------------------
{
  const realRandom = Math.random;
  Math.random = () => {
    throw new Error("recommend must not use randomness");
  };
  let lcg = 20260101;
  const rnd = () => (lcg = (Math.imul(lcg, 1664525) + 1013904223) >>> 0) / 4294967296;
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  let sections = 0;
  try {
    for (let trial = 0; trial < 200; trial += 1) {
      const grade = int(0, 8);
      const now = NOW + int(0, 400) * DAY + int(0, 86399) * 1000;
      const covering = GAMES.flatMap((g) =>
        g.skills
          .filter(
            (s) => s.grades[0] <= Math.min(8, grade + 1) && s.grades[1] >= Math.max(0, grade - 1),
          )
          .map((s) => ({ g, s })),
      );
      const entries = [];
      const history = new Map();
      for (const { g, s } of covering) {
        if (rnd() < 0.55) continue;
        const attempts = Array.from({ length: int(1, 14) }, () => [
          rnd() < 0.55 ? 1 : 0,
          int(0, 3),
        ]);
        const level = int(1, 3);
        const rec = record(attempts, level, now + int(-6, 6) * DAY + int(-40, 40) * 1000);
        entries.push([key(g.id, s.id), rec]);
        history.set(key(g.id, s.id), { attempts, level, dueAt: rec.dueAt });
      }
      const state = stateOf(entries);
      const run = () => recommend({ state, grade, games: GAMES, now, limit: 1000 });
      const recs = run();
      ok(
        JSON.stringify(recs) === JSON.stringify(run()) &&
          JSON.stringify(recs) ===
            JSON.stringify(
              recommend({
                state: JSON.parse(JSON.stringify(state)),
                grade,
                games: GAMES,
                now,
                limit: 1000,
              }),
            ),
        `trial ${trial}: same input, same output`,
      );
      ok(
        JSON.stringify(recommend({ state, grade, games: GAMES, now, limit: 5 })) ===
          JSON.stringify(recs.slice(0, 5)),
        `trial ${trial}: a limit is a prefix`,
      );
      ok(new Set(names(recs)).size === recs.length, `trial ${trial}: no duplicates`);
      let prevRank = 0;
      let reviewsPrior = 0;
      for (const r of recs) {
        ok(REASON_RANK[r.reason] >= prevRank, `trial ${trial}: reasons stay in priority order`);
        prevRank = REASON_RANK[r.reason];
        ok(Number.isInteger(r.level) && r.level >= 1 && r.level <= 3, "level in 1..3");
        const h = history.get(key(r.gameId, r.skillId));
        const skill = GAMES.find((g) => g.id === r.gameId).skills.find((s) => s.id === r.skillId);
        const m = h ? oracleMastery(h.attempts) : { score: 0, n: 0 };
        if (r.reason === "new") {
          ok(
            !h && skill.grades[0] <= grade && grade <= skill.grades[1],
            "new means no record and a skill for this grade",
          );
          ok(r.level === (grade > skill.grades[0] ? 2 : 1), "new level rule");
        } else {
          ok(
            Math.abs(r.evidence.mastery - m.score) < 1e-12 &&
              r.evidence.n === m.n &&
              r.evidence.stars === oracleStars(m),
            "evidence matches the oracle",
          );
        }
        if (r.reason === "review") {
          const covers = skill.grades[0] <= grade && grade <= skill.grades[1];
          if (covers)
            ok(
              h.dueAt <= now && r.level === h.level,
              "review of this grade's skill is due, at the stored level",
            );
          else {
            reviewsPrior += 1;
            ok(
              skill.grades[1] === grade - 1 ||
                (skill.grades[0] <= grade - 1 && grade - 1 <= skill.grades[1]),
              "earlier-grade review comes from the grade just below",
            );
            ok(m.n >= 3 && m.score < 0.6, "earlier-grade review needs weak, reliable evidence");
          }
        }
        if (r.reason === "weak")
          ok(
            m.n >= 3 && m.score < 0.6 && h.dueAt > now && r.level === h.level,
            "weak: reliable, below 0.6, not due",
          );
        if (r.reason === "stretch")
          ok(
            oracleStars(m) === 3 && h.level < 3 && r.level === h.level + 1 && h.dueAt > now,
            "stretch: three stars, next level",
          );
      }
      ok(reviewsPrior <= 1, "at most one earlier-grade review");
      // Everything that qualifies is present: the recommendation set is complete.
      for (const [k, h] of history) {
        const [gameId, skillId] = k.split(":");
        const skill = GAMES.find((g) => g.id === gameId).skills.find((s) => s.id === skillId);
        const covers = skill.grades[0] <= grade && grade <= skill.grades[1];
        const m = oracleMastery(h.attempts);
        const should =
          covers &&
          (h.dueAt <= now || (m.n >= 3 && m.score < 0.6) || (oracleStars(m) === 3 && h.level < 3));
        if (should)
          ok(names(recs).includes(k), `trial ${trial}: ${k} qualifies and must be offered`);
        if (covers && !should)
          ok(!names(recs).includes(k), `trial ${trial}: ${k} does not qualify`);
      }
      // Within each rule the order is the documented one.
      const reviewDue = recs.filter(
        (r) =>
          r.reason === "review" &&
          history.get(key(r.gameId, r.skillId)).dueAt <= now &&
          GAMES.find((g) => g.id === r.gameId).skills.find((s) => s.id === r.skillId).grades[0] <=
            grade &&
          GAMES.find((g) => g.id === r.gameId).skills.find((s) => s.id === r.skillId).grades[1] >=
            grade,
      );
      const expectedDue = [...reviewDue].sort(
        (a, b) =>
          oracleMastery(history.get(key(a.gameId, a.skillId)).attempts).score -
            oracleMastery(history.get(key(b.gameId, b.skillId)).attempts).score ||
          history.get(key(a.gameId, a.skillId)).dueAt -
            history.get(key(b.gameId, b.skillId)).dueAt ||
          cmp(a.gameId, b.gameId) ||
          cmp(a.skillId, b.skillId),
      );
      ok(
        JSON.stringify(names(reviewDue)) === JSON.stringify(names(expectedDue)),
        `trial ${trial}: reviews ordered by mastery, then oldest due, then id`,
      );
      const weakOnes = recs.filter((r) => r.reason === "weak");
      for (let i = 1; i < weakOnes.length; i += 1)
        ok(
          weakOnes[i - 1].evidence.mastery <= weakOnes[i].evidence.mastery,
          "weak ordered by mastery",
        );
      // New skills avoid the same game twice in a row whenever another game still has something left.
      const fresh = recs.filter((r) => r.reason === "new");
      for (let i = 1; i < fresh.length; i += 1) {
        if (fresh[i].gameId === fresh[i - 1].gameId)
          ok(
            fresh.slice(i).every((r) => r.gameId === fresh[i].gameId),
            `trial ${trial}: repeated game only when nothing else is left`,
          );
      }
      sections += 1;
    }
  } finally {
    Math.random = realRandom;
  }
  ok(sections === 200, "200 seeded states");
}

// ---- H. hostile and damaged state never throws ---------------------------------------------------------------------
{
  const evil = JSON.parse(
    '{"skills":{"__proto__":{"recent":[{"c":1,"h":0}],"dueAt":1},"constructor":{"recent":[]},"number-builder:number-builder-g3":{"recent":"nope"},"math-match:math-match-g3":{"recent":[{"c":1,"h":0,"l":1,"t":0},null,{"c":"x"}],"level":99,"dueAt":"soon"},"math-market:math-market-g3":7}}',
  );
  for (const state of [null, undefined, {}, { skills: null }, { skills: [] }, "text", evil]) {
    let recs;
    try {
      recs = recommend({ state, grade: 3, games: GAMES, now: NOW, limit: 50 });
    } catch (e) {
      assert.fail(`threw on ${JSON.stringify(state)}: ${e.message}`);
    }
    ok(
      Array.isArray(recs) && recs.every((r) => r.level >= 1 && r.level <= 3),
      "damaged state is survivable",
    );
  }
  ok(
    recommend({ state: evil, grade: 3, games: GAMES, now: NOW, limit: 50 }).every(
      (r) => r.gameId !== "__proto__",
    ),
    "prototype keys are ignored",
  );
  ok(
    recommend({ state: { skills: {} }, grade: 3, games: GAMES }).length === 6,
    "now defaults to the clock",
  );
}

// ---- I. reason text -------------------------------------------------------------------------------------------------
{
  const review = {
    gameId: "a",
    skillId: "b",
    level: 1,
    reason: "review",
    evidence: { mastery: 0.7, n: 4, dueDays: 2.4, stars: 1, recentRight: 3, recentOf: 4 },
  };
  const weak = { ...review, reason: "weak", evidence: { ...review.evidence, dueDays: -1 } };
  const stretch = {
    ...review,
    reason: "stretch",
    level: 3,
    evidence: { ...review.evidence, stars: 3 },
  };
  const fresh = {
    gameId: "a",
    skillId: "b",
    level: 2,
    reason: "new",
    evidence: { mastery: 0, n: 0, dueDays: null, stars: 0, recentRight: 0, recentOf: 0 },
  };
  ok(reasonText(weak, "en").includes("3 of the last 4 right at level 1"), reasonText(weak, "en"));
  ok(
    reasonText(weak, "es").includes("3 de las últimas 4") &&
      reasonText(weak, "es").includes("nivel 1"),
    reasonText(weak, "es"),
  );
  ok(
    reasonText(review, "en").includes("2 days") && reasonText(review, "es").includes("2 días"),
    "review mentions the days",
  );
  ok(
    reasonText({ ...review, evidence: { ...review.evidence, dueDays: 1 } }, "en").includes(
      "1 day ",
    ) &&
      reasonText({ ...review, evidence: { ...review.evidence, dueDays: 1 } }, "es").includes(
        "1 día ",
      ),
    "singular day",
  );
  ok(
    reasonText({ ...review, evidence: { ...review.evidence, dueDays: 0 } }, "en").includes(
      "time to look at this again",
    ) &&
      reasonText({ ...review, evidence: { ...review.evidence, dueDays: 0 } }, "es").includes(
        "Ya toca",
      ),
    "due today wording",
  );
  ok(
    reasonText(stretch, "en").includes("level 2") &&
      reasonText(stretch, "en").includes("level 3") &&
      reasonText(stretch, "es").includes("nivel 3"),
    "stretch names both levels",
  );
  ok(
    reasonText(fresh, "en").includes("level 2") && reasonText(fresh, "es").includes("nivel 2"),
    "new names the starting level",
  );
  const banned = /\b(wrong|bad|fail|failed|stupid|incorrect)\b|incorrect|\bmal\b|fracas/i;
  for (const r of [review, weak, stretch, fresh]) {
    for (const lang of ["en", "es"]) {
      const text = reasonText(r, lang);
      ok(
        text.length > 20 &&
          !banned.test(text) &&
          !text.includes("undefined") &&
          !text.includes("NaN"),
        `${r.reason}/${lang} reads well: ${text}`,
      );
    }
    ok(reasonText(r, "en") !== reasonText(r, "es"), `${r.reason}: Spanish is not a copy`);
  }
  ok(
    reasonText(review) === reasonText(review, "en") && typeof reasonText(null, "en") === "string",
    "default language and null are safe",
  );
}

console.log(`PASS recommend: ${checks} checks`);
