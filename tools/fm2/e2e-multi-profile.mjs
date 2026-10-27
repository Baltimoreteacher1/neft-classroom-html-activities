// E2E journey 7, MULTIPLE LOCAL PROFILES: learner 1 (with a two-day streak already on the device) plays a session, learner 2 is
// created with Add learner and plays one, then each is switched back to alternately. Progress records, streaks, mastery grids,
// settings and resume snapshots must never cross from one profile to the other in storage, on the home or on the progress
// page. A second tab switches the device to another learner while the first tab is mid-session; each tab keeps its own learner.
// @fm2 FM-086 FM-025
import { STRAND_KEYS } from "../../math/fluency-lab/family/fm2/coach.js";
import {
  answerSeam,
  attempt,
  clickNext,
  DAY,
  dayOf,
  gameById,
  games,
  homeStats,
  isVisible,
  keyFor,
  openHome,
  PROFILES,
  playSession,
  progressSnapshot,
  revealRound,
  run,
  SESSION,
  STORE,
  seedLocal,
  sessionOf,
  setup,
  shellInfo,
  skillRecord,
  starsOracle,
  storeOf,
  storeState,
  strandOf,
  text,
  totalStars,
} from "./e2e-kit.mjs";

const profilesOf = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), PROFILES);
const roundsOf = (log) =>
  log
    .filter((e) => e.activity)
    .flatMap((e) =>
      e.activity.rounds.map((r) => ({ ...r, key: `${e.activity.gameId}:${e.activity.skillId}` })),
    );
const countBy = (rounds) => {
  const out = {};
  for (const r of rounds) out[r.key] = (out[r.key] || 0) + 1;
  return out;
};
const SEED_KEY = "math-market:percent-off";
const seededPlays = { [SEED_KEY]: 6 };
const merge = (base, counts) => {
  const out = { ...base };
  for (const [k, n] of Object.entries(counts)) out[k] = (out[k] || 0) + n;
  return out;
};
// Mastery grid cells (strand rows x grade columns, cells that have skills) recomputed from a record with the stars oracle.
function gridOracle(state) {
  const cells = [];
  for (const strand of STRAND_KEYS) {
    const row = [];
    let any = false;
    for (let grade = 0; grade <= 8; grade += 1) {
      const skills = games.flatMap((g) =>
        g.skills
          .filter(
            (s) => s.grades[0] <= grade && grade <= s.grades[1] && strandOf(g.id, s) === strand,
          )
          .map((s) => `${g.id}:${s.id}`),
      );
      if (!skills.length) continue;
      any = true;
      const earned = skills.reduce((n, k) => n + starsOracle(state.skills[k]?.recent || []), 0);
      const ratio = earned / (skills.length * 3);
      row.push(earned === 0 ? 0 : ratio <= 1 / 3 ? 1 : ratio <= 2 / 3 ? 2 : 3);
    }
    if (any) cells.push(...row);
  }
  return cells;
}
const playsOf = (state) =>
  Object.fromEntries(Object.entries(state.skills).map(([k, v]) => [k, v.plays]));

await run("e2e-multi-profile", async (h, T) => {
  const context = await h.context({ width: 1100, height: 900 });
  const now = Date.now();
  await seedLocal(context, {
    [keyFor(STORE, 0)]: storeState({
      days: { [dayOf(now - DAY)]: 6, [dayOf(now - 2 * DAY)]: 6 },
      skills: {
        [SEED_KEY]: skillRecord({
          recent: Array.from({ length: 6 }, () => attempt(1, 0, 2)),
          level: 2,
          plays: 6,
          step: 3,
          dueAt: now + 5 * DAY,
        }),
      },
    }),
  });
  const page = await openHome(h, context);
  const select = page.locator("#family-profile");
  const switchTo = async (p, id) => {
    await p.locator("#family-profile").selectOption(String(id));
    await p.waitForFunction(
      (v) => document.querySelector("#family-profile").value === v,
      String(id),
    );
  };

  // -- learner 1 -------------------------------------------------------------------------------------------------------------------------
  T.section("profiles: learner 1 plays");
  T.eq(await select.locator("option").count(), 1, "one learner to start");
  T.eq(
    await homeStats(page),
    { streak: 2, minutes: 12, stars: 3 },
    "learner 1 starts with the seeded two-day streak and three stars",
  );
  await setup(page, { grade: 6, minutes: 5 });
  await page.locator("[data-testid=start-session]").click();
  const log1 = await playSession(page, T, {});
  const rounds1 = roundsOf(log1);
  const s0 = await storeOf(page, 0);
  T.eq(s0.sessions.length, 1, "learner 1 has one recorded session");
  T.eq(s0.settings.grade, 6, "learner 1's grade is 6");
  T.eq(
    playsOf(s0),
    merge(seededPlays, countBy(rounds1)),
    "learner 1's plays equal the seeded plays plus the rounds learner 1 played",
  );
  T.eq(await storeOf(page, 1), null, "no storage exists for learner 2 yet");

  // -- add learner 2 ------------------------------------------------------------------------------------------------------------------------
  T.section("profiles: Add learner starts clean");
  await page.locator("[data-testid=session-home]").click();
  await page.waitForSelector("[data-testid=start-session]:not([disabled])");
  const snapshot0 = JSON.stringify(await storeOf(page, 0));
  await page.locator("[data-testid=add-learner]").click();
  await page.waitForFunction(() => document.querySelector("#family-profile").options.length === 2);
  T.eq(await select.inputValue(), "1", "learner 2 is selected after Add learner");
  T.match(
    await page.locator("#family-profile option:checked").innerText(),
    /Learner 2 · River/,
    "learner 2 is named in the bar",
  );
  T.match(page.url(), /profile=1/, "the URL names profile 1");
  T.eq(
    await profilesOf(page),
    { ids: [0, 1], active: 1 },
    "the device lists both learners with learner 2 active",
  );
  T.eq(
    await page.locator("[data-testid=grade-6]").getAttribute("aria-pressed"),
    "false",
    "learner 2 does not inherit learner 1's grade",
  );
  T.eq(
    await page.locator("[data-testid=grade-1]").getAttribute("aria-pressed"),
    "true",
    "learner 2 starts on the default grade",
  );
  T.eq(
    await homeStats(page),
    { streak: 0, minutes: 0, stars: 0 },
    "learner 2 has no streak, minutes or stars",
  );
  T.ok(
    await isVisible(page, "[data-testid=progress-empty]"),
    "learner 2 sees the empty progress note",
  );
  T.ok(!(await isVisible(page, "[data-testid=resume-banner]")), "learner 2 has no resume banner");
  await setup(page, { grade: 3, minutes: 5 });
  T.eq(
    JSON.stringify(await storeOf(page, 0)),
    snapshot0,
    "choosing learner 2's grade did not touch learner 1's record",
  );
  T.eq((await storeOf(page, 1)).settings.grade, 3, "learner 2's grade is saved under learner 2");

  T.section("profiles: learner 2 plays (one round shown with Show me)");
  await page.locator("[data-testid=start-session]").click();
  const log2 = await playSession(page, T, {
    choose: ({ step, index }) => (step === 0 && index === 0 ? "reveal" : "seam"),
  });
  const rounds2 = roundsOf(log2);
  const s1 = await storeOf(page, 1);
  T.eq(s1.sessions.length, 1, "learner 2 has one recorded session");
  T.eq(playsOf(s1), countBy(rounds2), "learner 2's plays equal the rounds learner 2 played");
  T.eq(
    s1.sessions[0].correct,
    rounds2.filter((r) => r.solved).length,
    "learner 2's correct count excludes the shown round",
  );
  T.eq(
    JSON.stringify(await storeOf(page, 0)),
    snapshot0,
    "learner 1's record is unchanged by learner 2's session",
  );
  T.ok(
    s1.sessions[0].grade === 3 && s0.sessions[0].grade === 6,
    "each session keeps its own learner's grade",
  );
  T.ok(
    !(SEED_KEY in s1.skills) || !rounds2.every((r) => r.key !== SEED_KEY),
    "learner 1's seeded skill does not appear in learner 2's record unless learner 2 played it",
  );
  const sess1 = await sessionOf(page, 1);
  const sess0 = await sessionOf(page, 0);
  T.ok(
    sess1.finished && sess0.finished && sess1.sid !== sess0.sid,
    "each learner has a separate finished session record",
  );

  // -- switching back and forth ---------------------------------------------------------------------------------------------------------------
  T.section("profiles: switching restores each learner's own home");
  await page.locator("[data-testid=session-home]").click();
  await page.waitForSelector("[data-testid=start-session]:not([disabled])");
  const snapshot1 = JSON.stringify(await storeOf(page, 1));
  await switchTo(page, 0);
  T.eq(
    await page.locator("[data-testid=grade-6]").getAttribute("aria-pressed"),
    "true",
    "learner 1's grade 6 is back",
  );
  T.eq(
    (await homeStats(page)).streak,
    3,
    "learner 1's streak is three days (two seeded days plus today)",
  );
  T.eq(
    (await homeStats(page)).stars,
    totalStars(s0),
    "learner 1's stars come from learner 1's record",
  );
  T.ok(
    totalStars(s0) >= 3 && totalStars(s1) < totalStars(s0),
    "learner 1 keeps the seeded stars; learner 2 does not get them",
  );
  await switchTo(page, 1);
  T.eq(
    await page.locator("[data-testid=grade-3]").getAttribute("aria-pressed"),
    "true",
    "learner 2's grade 3 is back",
  );
  T.eq(
    await homeStats(page),
    { streak: 1, minutes: s1.sessions[0].minutes, stars: totalStars(s1) },
    "learner 2's streak is one day, with their own minutes and stars",
  );
  await switchTo(page, 0);

  // learner 1 interrupts an activity from the shelf
  const card = page.locator("[data-testid=game-card][data-ready=true]").first();
  const gameId = await card.getAttribute("data-game");
  await card.locator("[data-testid=game-play]").click();
  await page.waitForSelector("[data-fm2-shell]");
  const infoA = await shellInfo(page);
  T.ok((await answerSeam(page)).correct, "learner 1 solves a round of a shelf activity");
  await clickNext(page);
  await page.waitForFunction(() => window.__fm2.index === 1);
  await page.locator("[data-fm2-exit]").click();
  await page.waitForSelector("[data-testid=resume-banner]");
  const r0 = (await storeOf(page, 0)).resume;
  T.eq(
    [r0.gameId, r0.index, r0.results.length],
    [gameId, 1, 1],
    "learner 1's resume snapshot holds the interrupted activity",
  );
  T.eq((await storeOf(page, 1)).resume, null, "learner 2's resume snapshot stays empty");
  T.eq(
    JSON.stringify(await storeOf(page, 1)),
    snapshot1,
    "learner 2's record is byte-for-byte unchanged",
  );
  await switchTo(page, 1);
  T.ok(
    !(await isVisible(page, "[data-testid=resume-banner]")),
    "learner 2 does not see learner 1's resume banner",
  );
  await switchTo(page, 0);
  T.ok(await isVisible(page, "[data-testid=resume-banner]"), "learner 1 sees the banner again");

  // -- the progress pages -----------------------------------------------------------------------------------------------------------------------
  T.section("profiles: each progress page shows only that learner");
  const stateByProfile = { 0: await storeOf(page, 0), 1: await storeOf(page, 1) };
  const grids = {};
  for (const id of [0, 1]) {
    await switchTo(page, id);
    await page.locator("[data-testid=progress-link]").click();
    await page.waitForSelector("[data-testid=mastery-cell]");
    T.eq(
      await page.locator("#family-profile").inputValue(),
      String(id),
      `progress: learner ${id + 1} is selected`,
    );
    const p = await progressSnapshot(page);
    const st = stateByProfile[id];
    T.eq([p.sessions, p.sessionRows.length], [1, 1], `progress learner ${id + 1}: one session`);
    T.eq(p.stars, totalStars(st), `progress learner ${id + 1}: stars match their own record`);
    T.eq(p.streak, id === 0 ? 3 : 1, `progress learner ${id + 1}: their own streak`);
    T.eq(
      p.minutes,
      Math.round(Object.values(st.days).reduce((n, m) => n + m, 0)),
      `progress learner ${id + 1}: this week's minutes are their own`,
    );
    T.match(
      p.sessionRows[0],
      new RegExp(`Grade ${st.sessions[0].grade}`),
      `progress learner ${id + 1}: the session row shows their grade ${st.sessions[0].grade}`,
    );
    for (const [key, stars] of Object.entries(p.skillStars))
      T.eq(
        stars,
        starsOracle(st.skills[key]?.recent || []),
        `progress learner ${id + 1}: ${key} stars`,
      );
    grids[id] = p.cells.join("");
    T.eq(
      p.cells,
      gridOracle(st),
      `progress learner ${id + 1}: the mastery grid equals the grid computed from their own record`,
    );
    for (const row of p.gameRows)
      T.match(
        row.text,
        new RegExp(`played ${st.games[row.game]?.plays || 0} times`),
        `progress learner ${id + 1}: ${row.game} plays are their own`,
      );
    await page.locator("[data-testid=back-home]").click();
    await page.waitForSelector("[data-testid=start-session]:not([disabled])");
  }
  T.ok(
    grids[0] !== grids[1],
    "the two mastery grids differ (learner 1 has a three-star skill, learner 2 has none)",
  );

  // -- two tabs ---------------------------------------------------------------------------------------------------------------------------------
  T.section("profiles: a second tab switching learners does not move the first tab");
  await switchTo(page, 0);
  await page.locator("[data-testid=resume-link]").click();
  await page.waitForSelector("[data-fm2-shell]");
  const a = await shellInfo(page);
  T.eq([a.gameId, a.index], [gameId, 1], "tab A resumes learner 1's activity at round 2");
  const tabB = await context.newPage();
  await tabB.goto(h.url("?profile=1"));
  await tabB.waitForSelector("[data-testid=start-session]:not([disabled])");
  T.eq(await tabB.locator("#family-profile").inputValue(), "1", "tab B shows learner 2");
  T.eq((await profilesOf(tabB)).active, 1, "the device's active learner is now learner 2");
  const plays0 = (await storeOf(page, 0)).skills[`${infoA.gameId}:${infoA.skillId}`].plays;
  T.ok(
    (await answerSeam(page)).correct,
    "tab A (learner 1) answers a round while the device points at learner 2",
  );
  await clickNext(page);
  await page.waitForFunction(() => window.__fm2.index === 2);
  T.eq(
    (await storeOf(page, 0)).skills[`${infoA.gameId}:${infoA.skillId}`].plays,
    plays0 + 1,
    "the round was recorded for learner 1",
  );
  T.eq(JSON.stringify(await storeOf(page, 1)), snapshot1, "learner 2's record did not receive it");
  await page.reload();
  await page.waitForSelector("[data-fm2-shell]");
  T.eq(
    [(await shellInfo(page)).gameId, (await shellInfo(page)).index],
    [gameId, 2],
    "tab A reloads into learner 1's activity at round 3",
  );
  await page.locator("[data-fm2-exit]").click();
  await page.waitForSelector("[data-testid=resume-banner]");
  T.eq(
    await page.locator("#family-profile").inputValue(),
    "0",
    "tab A's Back lands on learner 1's home even though the device points at learner 2",
  );
  T.eq(await tabB.locator("#family-profile").inputValue(), "1", "tab B still shows learner 2");
  await tabB.locator("[data-testid=start-session]").click();
  const logB = await playSession(tabB, T, {});
  T.eq((await storeOf(tabB, 1)).sessions.length, 2, "tab B recorded its session for learner 2");
  T.eq((await storeOf(page, 0)).sessions.length, 1, "learner 1 still has one session");
  T.eq((await storeOf(page, 1)).resume, null, "learner 2 has no resume snapshot");
  T.eq(
    (await storeOf(page, 0)).resume?.gameId,
    gameId,
    "learner 1's resume snapshot is still learner 1's activity",
  );
  // finish learner 1's activity in tab A
  await page.locator("[data-testid=resume-link]").click();
  await page.waitForSelector("[data-fm2-shell]");
  T.eq((await shellInfo(page)).index, 2, "tab A continues at round 3");
  for (let i = 2; i < a.total; i += 1) {
    await answerSeam(page);
    await clickNext(page);
    if (i < a.total - 1) await page.waitForFunction((n) => window.__fm2.index === n, i + 1);
  }
  await page.waitForSelector(".fm2-finish:not([hidden])");
  const final0 = await storeOf(page, 0);
  const final1 = await storeOf(page, 1);
  T.eq(
    final0.games[gameId].completed,
    1 + (s0.games[gameId]?.completed || 0),
    "learner 1's finished activity counts for learner 1",
  );
  T.eq(
    final1.games[gameId]?.completed || 0,
    (s1.games[gameId]?.completed || 0) +
      (roundsOf(logB).some((r) => r.key.startsWith(gameId)) ? 1 : 0),
    "and not for learner 2 (beyond what learner 2 played)",
  );
  T.eq(
    [final0.sessions.length, final1.sessions.length],
    [1, 2],
    "session counts per learner are 1 and 2",
  );
});
