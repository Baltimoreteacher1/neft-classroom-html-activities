// Session planning: time budgets over every grade x minutes x mode x seed, role and game rules, determinism, the
// share code round trip, and strict rejection of malformed codes. Expected totals are recomputed here from the
// fixture games' seconds-per-round. @fm2 FM-003 FM-004 FM-005 FM-030 FM-065 FM-020
import assert from "node:assert/strict";
import { missingLanguages } from "../../math/fluency-lab/family/fm2/lang.js";
import { recommend } from "../../math/fluency-lab/family/fm2/recommend.js";
import {
  dailyMission,
  decodePlan,
  encodePlan,
  planSession,
  REFLECTIONS,
} from "../../math/fluency-lab/family/fm2/session.js";
import { FAKE_GAMES, FAKE_SEC, makeFakeGames, subset } from "./fixtures/fake-games.mjs";

let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};
const DAY = 86400000;
const NOW = 1_800_000_000_000;
const GAMES = FAKE_GAMES;
const covers = (gameId, skillId, grade) => {
  const skill = GAMES.find((g) => g.id === gameId)?.skills.find((s) => s.id === skillId);
  return Boolean(skill) && skill.grades[0] <= grade && grade <= skill.grades[1];
};
const record = (attempts, level, dueAt) => ({
  recent: attempts.map(([c, h]) => ({ c, h, l: level, t: 0 })),
  level,
  plays: attempts.length,
  dueAt,
});
const stateOf = (entries) => ({ skills: Object.fromEntries(entries) });
const clean = (n) => Array.from({ length: n }, () => [1, 0]);

// A busy learner at a grade: due reviews of different strength, a weak skill and a three-star skill.
function busyState(grade) {
  const id = (game) => `${game}:${game}-g${grade}`;
  return stateOf([
    [
      id("number-builder"),
      record(
        [
          [0, 0],
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        1,
        NOW - 3 * DAY,
      ),
    ],
    [
      id("math-match"),
      record(
        [
          [1, 0],
          [0, 0],
          [1, 0],
          [0, 0],
        ],
        2,
        NOW - 1 * DAY,
      ),
    ],
    [
      id("fraction-kitchen"),
      record(
        [
          [0, 0],
          [0, 0],
          [1, 0],
        ],
        1,
        NOW + 2 * DAY,
      ),
    ],
    [id("math-market"), record(clean(6), 1, NOW + 4 * DAY)],
    [id("array-architect"), record(clean(6), 2, NOW + 4 * DAY)],
  ]);
}
const sumEst = (plan) =>
  plan.activities.reduce((n, a) => n + a.rounds * FAKE_SEC[a.gameId] + 15, 0);

// ---- budgets, shapes and rules over the whole grid ------------------------------------------------------------------
const EXPECT_COUNT = { 5: 2, 10: 3, 15: 4 };
let plans = 0;
let longestCode = 0;
for (let grade = 0; grade <= 8; grade += 1) {
  for (const minutes of [5, 10, 15]) {
    for (const mode of ["solo", "together"]) {
      for (let seed = 0; seed < 20; seed += 1) {
        for (const state of [{ skills: {} }, busyState(grade)]) {
          const plan = planSession({ grade, minutes, mode, state, games: GAMES, now: NOW, seed });
          const label = `g${grade} ${minutes}m ${mode} s${seed}`;
          plans += 1;
          ok(
            plan.grade === grade && plan.minutes === minutes && plan.mode === mode,
            `${label}: echoes its inputs`,
          );
          ok(
            plan.activities.length === EXPECT_COUNT[minutes],
            `${label}: ${EXPECT_COUNT[minutes]} activities`,
          );
          const budget = minutes * 60;
          ok(
            sumEst(plan) === plan.estSec &&
              plan.activities.every((a) => a.estSec === a.rounds * FAKE_SEC[a.gameId] + 15),
            `${label}: estSec = sum(rounds x secPerRound + 15)`,
          );
          ok(
            plan.estSec >= 0.85 * budget && plan.estSec <= 1.05 * budget,
            `${label}: ${plan.estSec}s not within 85-105% of ${budget}s`,
          );
          ok(
            plan.activities.every(
              (a) =>
                Number.isInteger(a.rounds) &&
                a.rounds >= 2 &&
                a.rounds <= 6 &&
                a.level >= 1 &&
                a.level <= 3,
            ),
            `${label}: rounds 2-6, level 1-3`,
          );
          ok(
            plan.activities.every((a) => covers(a.gameId, a.skillId, grade)),
            `${label}: every skill is for this grade`,
          );
          ok(
            new Set(plan.activities.map((a) => a.gameId)).size === plan.activities.length,
            `${label}: distinct games`,
          );
          ok(
            plan.activities[0].role === "warmup" &&
              plan.activities.every((a) =>
                ["warmup", "main", "stretch", "together"].includes(a.role),
              ),
            `${label}: roles`,
          );
          ok(
            plan.activities.filter((a) => a.role === "warmup").length === 1,
            `${label}: exactly one warm-up`,
          );
          ok(plan.activities[0].level <= 2, `${label}: the warm-up is low pressure`);
          const duels = plan.activities.filter((a) => a.gameId === "family-math-duel");
          if (mode === "together") {
            ok(
              duels.length === 1 &&
                duels[0].role === "together" &&
                plan.activities.at(-1) === duels[0],
              `${label}: the duel appears once, last, as the together activity`,
            );
            ok(
              plan.activities.filter((a) => a.role === "together").length === 1,
              `${label}: only one together role`,
            );
          } else
            ok(
              duels.length <= 1 && plan.activities.every((a) => a.role !== "together"),
              `${label}: solo has no together role`,
            );
          if (minutes === 15)
            ok(
              plan.reflection &&
                plan.reflection.en.length > 20 &&
                plan.reflection.es.length > 20 &&
                missingLanguages(plan.reflection).length === 0,
              `${label}: 15 minutes carries a bilingual reflection card`,
            );
          else ok(plan.reflection === null, `${label}: no reflection under 15 minutes`);
          const code = encodePlan(plan);
          longestCode = Math.max(longestCode, code.length);
          ok(/^[A-Za-z0-9_~-]+$/.test(code), `${label}: URL-safe code`);
          ok(
            JSON.stringify(decodePlan(code, GAMES)) === JSON.stringify(plan),
            `${label}: code round trip`,
          );
        }
      }
    }
  }
}
ok(plans === 9 * 3 * 2 * 20 * 2, "all combinations planned");
ok(longestCode <= 600, `codes fit the 600 character resume field (longest ${longestCode})`);

// ---- role layout --------------------------------------------------------------------------------------------------------
{
  const roles = (minutes, mode) =>
    planSession({ grade: 4, minutes, mode, state: null, games: GAMES, now: NOW, seed: 1 })
      .activities.map((a) => a.role)
      .join();
  ok(
    roles(5, "solo") === "warmup,main" &&
      roles(10, "solo") === "warmup,main,stretch" &&
      roles(15, "solo") === "warmup,main,main,stretch",
    "solo role layout",
  );
  ok(
    roles(5, "together") === "warmup,together" &&
      roles(10, "together") === "warmup,main,together" &&
      roles(15, "together") === "warmup,main,stretch,together",
    "together role layout",
  );
}

// ---- the warm-up is the top review from recommend(); strict ranking ignores the seed -----------------------------
{
  for (const grade of [1, 4, 7]) {
    const state = busyState(grade);
    const top = recommend({ state, grade, games: GAMES, now: NOW, limit: 100 });
    ok(
      top[0].reason === "review" &&
        top[0].gameId === "number-builder" &&
        top[1].gameId === "math-match" &&
        top[2].reason === "weak" &&
        top[2].gameId === "fraction-kitchen",
      "scripted history: two reviews (strongest need first), then a weak skill",
    );
    const seen = new Set();
    for (let seed = 0; seed < 25; seed += 1) {
      for (const mode of ["solo", "together"]) {
        const plan = planSession({ grade, minutes: 10, mode, state, games: GAMES, now: NOW, seed });
        const [warm, main] = plan.activities;
        const weak = top.find((r) => r.reason === "weak");
        ok(
          warm.gameId === top[0].gameId &&
            warm.skillId === top[0].skillId &&
            warm.level === Math.min(top[0].level, 2),
          `g${grade} s${seed}: warm-up is recommend()'s first review`,
        );
        ok(
          main.gameId === weak.gameId && main.skillId === weak.skillId && main.level === weak.level,
          `g${grade} s${seed}: main goes to the weak skill`,
        );
        seen.add(JSON.stringify(plan.activities.slice(0, 2)));
      }
    }
    ok(
      seen.size <= 2,
      `g${grade}: the seed never reorders ranked candidates (${seen.size} variants across modes)`,
    );
    // The third activity is a stretch: the 3-star skill at the next level.
    const solo = planSession({
      grade,
      minutes: 10,
      mode: "solo",
      state,
      games: GAMES,
      now: NOW,
      seed: 4,
    });
    const stretch = top.find((r) => r.reason === "stretch");
    ok(
      stretch &&
        solo.activities[2].gameId === stretch.gameId &&
        solo.activities[2].level === stretch.level &&
        solo.activities[2].role === "stretch",
      `g${grade}: stretch activity is the three-star skill one level up`,
    );
  }
  // Weak skills lead the main slot over later reviews.
  const grade = 3;
  const state = stateOf([
    [
      `math-match:math-match-g${grade}`,
      record(
        [
          [0, 0],
          [0, 0],
          [0, 0],
        ],
        1,
        NOW + DAY,
      ),
    ],
    [`number-builder:number-builder-g${grade}`, record(clean(4), 1, NOW - 2 * DAY)],
    [`array-architect:array-architect-g${grade}`, record(clean(4), 1, NOW - DAY)],
  ]);
  const plan = planSession({
    grade,
    minutes: 10,
    mode: "solo",
    state,
    games: GAMES,
    now: NOW,
    seed: 2,
  });
  ok(
    plan.activities[0].gameId === "number-builder" && plan.activities[1].gameId === "math-match",
    "warm-up is the review, main is the weak skill",
  );
}

// ---- determinism, and variation only among equals --------------------------------------------------------------------
{
  const run = (seed) =>
    JSON.stringify(
      planSession({
        grade: 5,
        minutes: 15,
        mode: "together",
        state: { skills: {} },
        games: GAMES,
        now: NOW,
        seed,
      }),
    );
  for (let seed = 0; seed < 200; seed += 1)
    ok(run(seed) === run(seed), `seed ${seed}: identical inputs give an identical plan`);
  const variants = new Set(Array.from({ length: 20 }, (_, seed) => run(seed)));
  ok(
    variants.size >= 3,
    `a new learner's tied candidates vary with the seed (${variants.size} variants in 20 seeds)`,
  );
  for (let seed = 0; seed < 20; seed += 1) {
    const plan = planSession({
      grade: 5,
      minutes: 10,
      mode: "solo",
      state: null,
      games: GAMES,
      now: NOW,
      seed,
    });
    ok(
      plan.activities.every((a) => {
        const first = GAMES.find((g) => g.id === a.gameId).skills.find(
          (s) => s.grades[0] <= 5 && 5 <= s.grades[1],
        );
        return a.skillId === first.id;
      }),
      `seed ${seed}: with no history, only each game's first skill (the tied head of the queue) is chosen`,
    );
  }
  ok(
    run(1) === run(1) &&
      planSession({ grade: 5, minutes: 10, state: null, games: GAMES, now: NOW }).estSec > 0,
    "seed defaults",
  );
  const noNow = planSession({
    grade: 5,
    minutes: 10,
    state: busyState(5),
    games: GAMES,
    now: NOW,
    seed: 9,
  });
  ok(
    JSON.stringify(noNow) ===
      JSON.stringify(
        planSession({
          grade: 5,
          minutes: 10,
          state: JSON.parse(JSON.stringify(busyState(5))),
          games: GAMES,
          now: NOW,
          seed: 9,
        }),
      ),
    "plans do not depend on object identity",
  );
}

// ---- small and awkward shelves ----------------------------------------------------------------------------------------
{
  const two = subset(GAMES, ["math-match", "number-builder"]);
  const plan = planSession({
    grade: 3,
    minutes: 15,
    mode: "solo",
    state: null,
    games: two,
    now: NOW,
    seed: 3,
  });
  const keys = plan.activities.map((a) => `${a.gameId}:${a.skillId}`);
  ok(
    plan.activities.length === 4 && new Set(keys).size === 4,
    "with fewer games than activities a game repeats but never the same skill",
  );
  ok(plan.estSec >= 0.85 * 900 && plan.estSec <= 1.05 * 900, "budget still holds");
  const noDuel = planSession({
    grade: 3,
    minutes: 10,
    mode: "together",
    state: null,
    games: two,
    now: NOW,
    seed: 3,
  });
  ok(
    noDuel.activities.length === 3 &&
      !noDuel.activities.some((a) => a.gameId === "family-math-duel") &&
      noDuel.activities.at(-1).role === "together",
    "without the duel game the together role goes to the last activity",
  );
  const empty = planSession({
    grade: 3,
    minutes: 10,
    mode: "solo",
    state: null,
    games: [],
    now: NOW,
    seed: 3,
  });
  ok(
    empty.activities.length === 0 && empty.estSec === 0 && empty.reflection === null,
    "no games, no activities",
  );
  const slow = makeFakeGames().map((g) => ({ ...g, secPerRound: 100 }));
  const slowPlan = planSession({
    grade: 3,
    minutes: 5,
    mode: "solo",
    state: null,
    games: slow,
    now: NOW,
    seed: 1,
  });
  ok(
    slowPlan.activities.length === 2 &&
      slowPlan.activities.every((a) => a.rounds >= 1 && a.rounds <= 8) &&
      slowPlan.estSec > 0,
    "impossible budgets still produce a plan",
  );
  const mixed = makeFakeGames().map((g, i) => ({ ...g, secPerRound: i < 5 ? 150 : 25 }));
  for (let seed = 0; seed < 20; seed += 1) {
    const p = planSession({
      grade: 6,
      minutes: 5,
      mode: "solo",
      state: null,
      games: mixed,
      now: NOW,
      seed,
    });
    ok(
      p.estSec >= 255 && p.estSec <= 315 && p.activities.every((a) => a.rounds >= 2),
      `seed ${seed}: slow games are skipped when they would break the 5-minute budget (${p.estSec}s)`,
    );
  }
  const odd = (minutes, mode) =>
    planSession({ grade: 4, minutes, mode, state: null, games: GAMES, now: NOW, seed: 1 });
  ok(
    odd(7).minutes === 5 &&
      odd(12).minutes === 10 &&
      odd(14).minutes === 15 &&
      odd(1000).minutes === 15 &&
      odd(undefined).minutes === 10,
    "minutes snap to 5, 10 or 15",
  );
  ok(
    odd(10, "weird").mode === "solo" &&
      planSession({ grade: 99, minutes: 10, games: GAMES, now: NOW }).grade === 8 &&
      planSession({ grade: -4, minutes: 10, games: GAMES, now: NOW }).grade === 0,
    "mode and grade are clamped",
  );
}

// ---- share codes -------------------------------------------------------------------------------------------------------
{
  const good = encodePlan(
    planSession({
      grade: 3,
      minutes: 10,
      mode: "together",
      state: null,
      games: GAMES,
      now: NOW,
      seed: 2,
    }),
  );
  ok(decodePlan(good, GAMES) !== null, "a real code decodes");
  const parts = good.split("~");
  const act = parts[4];
  const bad = [
    "",
    " ",
    "1",
    "1~g3",
    "1~g3~m10~s",
    `2~g3~m10~s~${act}`,
    `1~g9~m10~s~${act}`,
    `1~g3~m7~s~${act}`,
    `1~g3~m10~x~${act}`,
    `1~gx~m10~s~${act}`,
    `1~g3~m10~s~${act}~`,
    `1~g3~m10~s~${act}~${act}_extra`,
    "1~g3~m10~s~family-math-duel_nope_1_3_w",
    "1~g3~m10~s~no-such-game_number-builder-g3_1_3_w",
    "1~g3~m10~s~number-builder_number-builder-g3_0_3_w",
    "1~g3~m10~s~number-builder_number-builder-g3_4_3_w",
    "1~g3~m10~s~number-builder_number-builder-g3_1_0_w",
    "1~g3~m10~s~number-builder_number-builder-g3_1_9_w",
    "1~g3~m10~s~number-builder_number-builder-g3_1_3_x",
    "1~g3~m10~s~number-builder_number-builder-g3_1_3",
    "1~g3~m10~s~number-builder_number-builder-g3_1_3_w_w",
    "1~g3~m10~s~__proto___number-builder-g3_1_3_w",
    "1~g3~m10~s~__proto__",
    "1~g3~m10~s~constructor_constructor_1_3_w",
    "1~g3~m10~s~number-builder_toString_1_3_w",
    "1~g3~m10~s~number-builder_hasOwnProperty_1_3_w",
    "1~g3~m10~s~number-builder_number-builder-g3_1_3_w~r99",
    `1~g3~m10~s~${act}\n${act}`,
    `1~g3~m10~s~${act} `,
    "1~g3~m10~s~numb%65r-builder_number-builder-g3_1_3_w",
    "javascript:alert(1)",
    "1~g3~m10~s~<script>_x_1_1_w",
    "1~g3~m10~s~number-builder_number-builder-g3_1.5_3_w",
    "1~g3~m10~s~number-builder_number-builder-g3_1_3_w~r-1",
    "1~g3~m10~s~numbér-builder_number-builder-g3_1_3_w",
    `1~g3~m10~s~${act}`.repeat(200),
    "x".repeat(5000),
  ];
  ok(bad.length >= 30, `${bad.length} malformed strings`);
  for (const text of bad)
    ok(decodePlan(text, GAMES) === null, `rejects ${JSON.stringify(text.slice(0, 70))}`);
  for (const value of [null, undefined, 42, {}, [], true, Symbol.iterator])
    ok(decodePlan(value, GAMES) === null, `rejects non-string ${String(value)}`);
  ok(
    decodePlan(good, null) === null &&
      decodePlan(good, {}) === null &&
      decodePlan(good, []) === null,
    "needs a games list",
  );
  ok(
    decodePlan(
      good,
      GAMES.filter((g) => g.id !== parts[4].split("_")[0]),
    ) === null,
    "a game missing from the list is rejected",
  );
  const one = "number-builder_number-builder-g3_2_3_w";
  const twenty = `1~g3~m15~s~${Array(20).fill(one).join("~")}`;
  ok(
    decodePlan(twenty, GAMES)?.activities.length === 20,
    "twenty activities is the ceiling and is accepted",
  );
  ok(decodePlan(`${twenty}~${one}`, GAMES) === null, "twenty-one activities is rejected");
  ok(
    decodePlan(`${"1~g3~m15~s~"}${Array(200).fill(one).join("~")}`, GAMES) === null,
    "oversize input is rejected",
  );
  ok(
    {}.polluted === undefined && Object.keys(Object.prototype).length === 0,
    "decoding leaves the prototype alone",
  );
  const odd = decodePlan("1~g0~m5~t~number-builder_number-builder-g0_3_6_s", GAMES);
  ok(
    odd &&
      odd.mode === "together" &&
      odd.grade === 0 &&
      odd.activities[0].role === "stretch" &&
      odd.estSec === 6 * 40 + 15 &&
      odd.reflection === null,
    "a hand-made valid code decodes with recomputed seconds",
  );
  let threw = false;
  try {
    encodePlan({
      grade: 1,
      minutes: 5,
      mode: "solo",
      activities: [{ gameId: "Bad Id", skillId: "x", level: 1, rounds: 2, role: "main" }],
      reflection: null,
    });
  } catch {
    threw = true;
  }
  ok(threw, "encode refuses ids that could not survive a round trip");
}

// ---- daily mission -----------------------------------------------------------------------------------------------------
{
  const morning = new Date(2026, 9, 26, 7, 30).getTime();
  const evening = new Date(2026, 9, 26, 21, 5).getTime();
  const nextDay = new Date(2026, 9, 27, 7, 30).getTime();
  const state = { skills: {} };
  const a = dailyMission({ grade: 3, state, games: GAMES, now: morning });
  const b = dailyMission({ grade: 3, state, games: GAMES, now: evening });
  ok(JSON.stringify(a) === JSON.stringify(b), "the mission is the same all day");
  ok(
    a.minutes === 10 && a.activities.length === 3 && a.daily === true && a.day === "2026-10-26",
    "ten minutes, three activities, labelled for the day",
  );
  ok(
    missingLanguages(a.title, "title").length === 0 &&
      a.title.en.length > 10 &&
      a.title.es.length > 10 &&
      a.title.en !== a.title.es,
    "bilingual title",
  );
  const lead = GAMES.find((g) => g.id === a.activities[1].gameId).skills.find(
    (s) => s.id === a.activities[1].skillId,
  );
  ok(
    a.title.en.includes(lead.strand.en) && a.title.es.includes(lead.strand.es),
    "the title names the main activity's strand",
  );
  ok(a.estSec >= 510 && a.estSec <= 630, "within the 10-minute budget");
  const c = dailyMission({ grade: 3, state, games: GAMES, now: nextDay });
  ok(c.day === "2026-10-27", "a new day is a new mission");
  const days = new Set(
    Array.from({ length: 14 }, (_, i) =>
      JSON.stringify(
        dailyMission({ grade: 3, state, games: GAMES, now: morning + i * DAY }).activities,
      ),
    ),
  );
  ok(days.size >= 4, `missions vary across two weeks (${days.size} different)`);
  ok(
    dailyMission({ grade: 3, state, games: GAMES, now: morning, mode: "together" }).activities.some(
      (x) => x.gameId === "family-math-duel",
    ),
    "together missions include the duel",
  );
  ok(
    dailyMission({ grade: 3, state, games: GAMES, now: morning, seed: 5 }).day === "2026-10-26",
    "explicit seed accepted",
  );
  ok(
    dailyMission({ grade: 3, state: null, games: [], now: morning }).title.en.length > 5,
    "empty shelf still has a title",
  );
}

// ---- reflection bank ----------------------------------------------------------------------------------------------------
{
  ok(
    REFLECTIONS.length >= 6 && new Set(REFLECTIONS.map((r) => r.en)).size === REFLECTIONS.length,
    "six or more different reflection cards",
  );
  ok(missingLanguages(REFLECTIONS).length === 0, "reflections are bilingual");
  const banned = /\b(wrong|bad|stupid|fail|easy)\b|incorrecto|\bmal\b|fácil/i;
  ok(
    REFLECTIONS.every((r) => !banned.test(r.en) && !banned.test(r.es) && !/\d/.test(r.en)),
    "reflections are kind",
  );
  const seen = new Set(
    Array.from(
      { length: 30 },
      (_, seed) =>
        planSession({
          grade: 2,
          minutes: 15,
          mode: "solo",
          state: null,
          games: GAMES,
          now: NOW,
          seed,
        }).reflection.en,
    ),
  );
  ok(seen.size >= 3, `reflection varies with the seed (${seen.size})`);
}

console.log(`PASS session: ${plans} plans, ${checks} checks`);
