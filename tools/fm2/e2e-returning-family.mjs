// E2E journey 2, RETURNING FAMILY: storage is seeded in the real store shape (learner 3, Comet, Spanish, grade 5, an
// interrupted Math Market activity at round 3, earlier skill records, a past session and a two-day streak). The home must
// restore profile, language and grade and show the resume banner; Continue must reopen the same round; finishing must add
// exactly the new plays and leave everything else untouched. A second interruption, this time inside a planned session,
// is then resumed and recorded once. @fm2 FM-081 FM-026 FM-023

import { COPY } from "../../math/fluency-lab/family/fm2/home-copy.js";
import {
  activitiesOf,
  answerSeam,
  attempt,
  CORRECT,
  checker,
  clickNext,
  DAY,
  dayOf,
  feedbackOf,
  fingerprint,
  gameById,
  games,
  homeStats,
  isVisible,
  keyFor,
  LANG,
  makeRng,
  masteryOracle,
  openHome,
  PROFILES,
  playSession,
  readPlan,
  roundOf,
  run,
  STORE,
  seedFrom,
  seedLocal,
  sessionOf,
  shellInfo,
  skillRecord,
  solveUi,
  starCountOracle,
  starsOracle,
  storeOf,
  storeState,
  text,
  totalStars,
} from "./e2e-kit.mjs";

const PROFILE = 2;
const GRADE = 5;
const market = gameById("math-market");
const SKILL = "decimal-ops";
const LEVEL = 2;
const SEED = 424242;
const ROUNDS = 5;
const OTHER = {
  game: "pattern-detective",
  skill: games
    .find((g) => g.id === "pattern-detective")
    .skills.find((s) => s.grades[0] <= GRADE && GRADE <= s.grades[1]).id,
};

// Independent copy of the level rule (3 clean of the last 4 at this level goes up; at most 1 right in the last 3 goes down).
function levelAfter(recent, level) {
  const here = recent.filter((a) => a.l === level);
  const four = here.slice(-4);
  const three = here.slice(-3);
  if (four.length >= 4 && four.filter((a) => a.c && a.h === 0).length >= 3)
    return Math.min(3, level + 1);
  if (three.length >= 3 && three.filter((a) => a.c).length <= 1) return Math.max(1, level - 1);
  return level;
}

await run("e2e-returning-family", async (h, T) => {
  const now = Date.now();
  const marketRecent = [
    attempt(0, 0, LEVEL),
    attempt(1, 1, LEVEL),
    attempt(1, 0, LEVEL),
    attempt(0, 0, LEVEL),
    attempt(1, 2, LEVEL),
    attempt(1, 0, LEVEL),
  ];
  const otherRecent = [attempt(1, 0, 1), attempt(1, 0, 1), attempt(0, 1, 1)];
  const pastSession = {
    at: now - DAY,
    grade: GRADE,
    minutes: 7,
    correct: 8,
    total: 10,
    games: ["math-market"],
    mode: "solo",
  };
  const seeded = storeState({
    skills: {
      [`math-market:${SKILL}`]: skillRecord({
        recent: marketRecent,
        level: LEVEL,
        plays: 9,
        step: 1,
      }),
      [`${OTHER.game}:${OTHER.skill}`]: skillRecord({
        recent: otherRecent,
        level: 1,
        plays: 3,
        step: 0,
      }),
    },
    games: { "math-market": { plays: 2, completed: 2, bestStars: 2, lastAt: now - DAY } },
    sessions: [pastSession],
    days: { [dayOf(now - DAY)]: 7, [dayOf(now - 2 * DAY)]: 5 },
    settings: { grade: GRADE, minutes: 5, mode: "solo" },
    resume: {
      gameId: "math-market",
      skillId: SKILL,
      grade: GRADE,
      level: LEVEL,
      seed: SEED,
      rounds: ROUNDS,
      index: 2,
      mode: "solo",
      plan: "",
      step: 0,
      at: now - 3600000,
      results: [
        { correct: true, hints: 0, attempts: 1, revealed: false },
        { correct: true, hints: 1, attempts: 1, revealed: false },
      ],
    },
  });
  const context = await h.context({ width: 1100, height: 900, locale: "es-MX" });
  await seedLocal(context, {
    [PROFILES]: { ids: [0, PROFILE], active: PROFILE },
    [LANG]: "es",
    [keyFor(STORE, PROFILE)]: seeded,
  });

  // -- the home restores the family ------------------------------------------------------------------------------------------
  T.section("returning family: home restores profile, language and grade");
  const page = await openHome(h, context);
  T.eq(
    await page.evaluate(() => document.documentElement.lang),
    "es",
    "the page language is Spanish",
  );
  T.eq(
    await page.locator("#family-profile").inputValue(),
    String(PROFILE),
    "the Comet profile is selected",
  );
  T.match(
    await page.locator("#family-profile option:checked").innerText(),
    /Estudiante 3 · Comet/,
    "the learner bar names learner 3 in Spanish",
  );
  T.eq(
    await page.locator(`[data-testid=grade-${GRADE}]`).getAttribute("aria-pressed"),
    "true",
    "grade 5 is restored",
  );
  T.ok(await page.locator("[data-testid=minutes-5]").isChecked(), "5 minutes is restored");
  T.ok(await page.locator("[data-testid=mode-solo]").isChecked(), "solo is restored");
  T.eq(await text(page, "#lang-toggle"), "English", "the language button offers English");
  T.match(
    await text(page, "#welcome-title"),
    new RegExp(COPY.heroTitle.es.slice(0, 20)),
    "the hero is in Spanish",
  );
  T.eq(
    await homeStats(page),
    { streak: 2, minutes: 12, stars: totalStars(seeded) },
    "the streak, minutes and stars come from the seeded record",
  );
  T.ok(
    !(await isVisible(page, "[data-testid=progress-empty]")),
    "the home does not claim there is no progress",
  );
  const banner = page.locator("[data-testid=resume-banner]");
  T.ok(await banner.isVisible(), "the resume banner appears for the interrupted activity");
  T.match(
    await banner.innerText(),
    new RegExp(`${COPY.resumeTitle.es}[\\s\\S]*${market.title.es}`),
    "the banner names the activity in Spanish",
  );
  T.eq(
    await text(page, "[data-testid=resume-link]"),
    COPY.resumeGo.es,
    "the banner button reads Continuar",
  );
  const href = await page.locator("[data-testid=resume-link]").getAttribute("href");
  T.match(
    href,
    /game=math-market.*skill=decimal-ops.*resume=1/,
    "the Continue link names the game, skill and resume=1",
  );
  T.eq(await storeOf(page, PROFILE), seeded, "opening the home does not change the stored record");

  // -- Continue resumes at the same round ---------------------------------------------------------------------------------------
  T.section(
    "returning family: Continue resumes the same round, finishing adds exactly the new plays",
  );
  await page.locator("[data-testid=resume-link]").click();
  await page.waitForSelector("[data-fm2-shell] .mm-register, [data-fm2-shell] .mm");
  const info = await shellInfo(page);
  T.eq(
    [info.gameId, info.skillId, info.index, info.total, info.level, info.grade],
    ["math-market", SKILL, 2, ROUNDS, LEVEL, GRADE],
    "the activity reopens at round 3 of 5",
  );
  T.match(
    await text(page, "[data-fm2-round]"),
    /Ronda 3 de 5/,
    "the round label is Spanish: Ronda 3 de 5",
  );
  const expectRound = JSON.stringify(
    JSON.parse(
      JSON.stringify(
        market.makeRound(
          SKILL,
          LEVEL,
          makeRng(seedFrom(SEED, "math-market", SKILL, LEVEL, 2)),
          GRADE,
        ),
      ),
    ),
  );
  T.eq(
    await fingerprint(page),
    expectRound,
    "round 3 is rebuilt from the seed (same numbers as before the interruption)",
  );
  T.eq(
    await page.evaluate(() => window.__fm2.results.map((r) => [r.correct, r.hints])),
    [
      [true, 0],
      [true, 1],
    ],
    "the earlier two results are restored",
  );
  T.eq(await page.locator(".fm2-dot-done").count(), 2, "two finished dots are shown");

  const rows = [];
  for (let i = 2; i < ROUNDS; i += 1) {
    const current = await shellInfo(page);
    T.eq(current.index, i, `playing round ${i + 1}`);
    if (i === 2) T.ok(await solveUi(page), "round 3 is answered with real register controls");
    else T.ok((await answerSeam(page)).correct, `round ${i + 1} accepted`);
    await page.waitForFunction(() => window.__fm2.tools.solved);
    T.match(await feedbackOf(page), CORRECT, `round ${i + 1}: feedback`);
    rows.push(i);
    await clickNext(page);
    if (i < ROUNDS - 1) await page.waitForFunction((n) => window.__fm2.index === n, i + 1);
  }
  await page.waitForSelector(".fm2-finish:not([hidden])");
  T.match(
    await page.locator(".fm2-stars").getAttribute("aria-label"),
    /3 de 3 estrellas/,
    "five of five solved earns three stars",
  );

  const after = await storeOf(page, PROFILE);
  const before = seeded.skills[`math-market:${SKILL}`];
  const rec = after.skills[`math-market:${SKILL}`];
  T.eq(rec.plays, before.plays + 3, "plays rose by exactly the three new rounds (9 to 12)");
  T.eq(
    rec.recent.slice(0, 6).map((a) => [a.c, a.h, a.l]),
    marketRecent.map((a) => [a.c, a.h, a.l]),
    "the earlier attempts are preserved in order",
  );
  T.eq(
    rec.recent.slice(6).map((a) => [a.c, a.h, a.l]),
    [
      [1, 0, LEVEL],
      [1, 0, LEVEL],
      [1, 0, LEVEL],
    ],
    "three clean right answers were appended",
  );
  const expectRecent = [...marketRecent, ...[1, 1, 1].map((c) => ({ c, h: 0, l: LEVEL }))];
  const expectScore = masteryOracle(expectRecent).score;
  T.ok(
    Math.abs(masteryOracle(rec.recent).score - expectScore) < 1e-12,
    "mastery of the stored record equals the independent calculation",
  );
  T.ok(
    expectScore > masteryOracle(marketRecent).score,
    `mastery rose (${masteryOracle(marketRecent).score.toFixed(3)} to ${expectScore.toFixed(3)})`,
  );
  let level = LEVEL;
  const walked = [...marketRecent];
  for (let i = 0; i < 3; i += 1) {
    walked.push({ c: 1, h: 0, l: LEVEL });
    level = levelAfter(walked, level);
  }
  T.eq(rec.level, level, `the level follows the evidence rule (level ${level})`);
  T.eq(
    rec.step,
    4,
    "the review step advanced past the earlier miss history (step 1 to 4 after three clean answers)",
  );
  T.eq(
    after.skills[`${OTHER.game}:${OTHER.skill}`],
    seeded.skills[`${OTHER.game}:${OTHER.skill}`],
    "another skill's record is untouched",
  );
  T.eq(after.games["math-market"].plays, 3, "the game's play count rose from 2 to 3");
  T.eq(after.games["math-market"].completed, 3, "completed rose from 2 to 3");
  T.eq(
    after.games["math-market"].bestStars,
    Math.max(2, starCountOracle(5, 5)),
    "best stars is the larger of before and now",
  );
  T.eq(after.sessions, seeded.sessions, "the earlier session is preserved");
  T.eq(
    after.days,
    seeded.days,
    "the minutes per day are preserved (a single activity adds no session)",
  );
  T.eq(after.resume, null, "the resume record is cleared when the activity finishes");
  T.eq(after.settings, seeded.settings, "settings are preserved");
  T.eq(await storeOf(page, 0), null, "learner 1's storage was never created");

  // -- the home afterwards -------------------------------------------------------------------------------------------------------------
  await page.locator("[data-fm2-home]").click();
  await page.waitForSelector("[data-testid=start-session]:not([disabled])");
  T.eq(
    await page.locator("#family-profile").inputValue(),
    String(PROFILE),
    "going home keeps learner 3 in this tab",
  );
  T.ok(!(await isVisible(page, "[data-testid=resume-banner]")), "the resume banner is gone");
  T.eq(
    await homeStats(page),
    { streak: 2, minutes: 12, stars: totalStars(after) },
    "home stars follow the new record",
  );
  T.ok(
    totalStars(after) > totalStars(seeded) ||
      starsOracle(rec.recent) === starsOracle(before.recent),
    "stars never go down after clean play",
  );

  // -- a second interruption, inside a planned session -------------------------------------------------------------------------------
  T.section("returning family: interrupt a planned session, Continue, finish, recorded once");
  const { code } = await readPlan(page);
  await page.locator("[data-testid=start-session]").click();
  await page.waitForSelector("[data-fm2-shell]");
  const first = await shellInfo(page);
  T.ok(first.total >= 2, "the first activity has at least two rounds");
  T.ok((await answerSeam(page)).correct, "session round 1 solved");
  await clickNext(page);
  await page.waitForFunction(() => window.__fm2.index === 1);
  const resumeAt = await fingerprint(page);
  const sessionBefore = await sessionOf(page, PROFILE);
  T.eq(sessionBefore.step, 0, "the session record is still on the first activity");
  await page.locator("[data-fm2-exit]").click();
  await page.waitForSelector("[data-testid=resume-banner]");
  T.eq(
    await page.locator("#family-profile").inputValue(),
    String(PROFILE),
    "Back returns to the same learner",
  );
  const stored = await storeOf(page, PROFILE);
  T.eq(
    [stored.resume.index, stored.resume.results.length, stored.resume.step, stored.resume.plan],
    [1, 1, 0, code],
    "the resume record holds round 2, one result and the plan code",
  );
  T.eq(stored.sessions.length, 1, "no session is recorded for an interrupted session");
  await page.locator("[data-testid=resume-link]").click();
  await page.waitForSelector("[data-fm2-shell]");
  const back = await shellInfo(page);
  T.eq(
    [back.gameId, back.skillId, back.index],
    [first.gameId, first.skillId, 1],
    "Continue returns to the same activity and round",
  );
  T.eq(await fingerprint(page), resumeAt, "the round shown is the one that was interrupted");
  const prior = JSON.stringify((await storeOf(page, PROFILE)).skills);
  const log = await playSession(page, T, {});
  T.ok(activitiesOf(log).length >= 2, "the rest of the session ran to the end screen");
  const finalStore = await storeOf(page, PROFILE);
  T.eq(finalStore.sessions.length, 2, "exactly one new session was recorded (two in total)");
  T.eq(
    finalStore.sessions[0],
    seeded.sessions[0],
    "the earlier session is still first and unchanged",
  );
  T.eq(finalStore.sessions[1].grade, GRADE, "the new session carries the grade");
  T.ok(prior !== JSON.stringify(finalStore.skills), "skill records moved on during the session");
  T.eq(finalStore.resume, null, "no resume record remains");
  T.match(
    await text(page, "[data-testid=session-complete]"),
    /Sesión completa/,
    "the end screen is in Spanish",
  );
  await page.reload();
  await page.waitForSelector("[data-testid=session-complete]");
  T.eq(
    (await storeOf(page, PROFILE)).sessions.length,
    2,
    "reloading the end screen does not record again",
  );
});
