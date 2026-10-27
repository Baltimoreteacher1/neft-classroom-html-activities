// E2E journey 1, NEW FAMILY: empty storage, open the home, choose a grade and a length (5, 10 and 15 minutes, each in its own
// fresh browser context), press Start, play the whole planned session through the between-activity cards to the end
// screen, then check the stars and counts on that screen, the two stored records, the progress page and the home.
// One round of the first activity is answered with real controls; a later round is revealed through Hint x3 + Show me and
// another uses one hint, so the expected counts are known without trusting the page. @fm2 FM-080 FM-003 FM-004 FM-005 FM-002 FM-001 FM-034 FM-024
import {
  activitiesOf,
  CORRECT,
  checker,
  dayOf,
  decodePlan,
  gameById,
  games,
  hasSolver,
  homeStats,
  isVisible,
  keyFor,
  openHome,
  playSession,
  progressSnapshot,
  readPlan,
  run,
  SESSION,
  STORE,
  sessionOf,
  setup,
  starCountOracle,
  starsOracle,
  storeOf,
  text,
  totalStars,
} from "./e2e-kit.mjs";

const JOURNEYS = [
  { minutes: 5, grade: 3 },
  { minutes: 10, grade: 0 },
  { minutes: 15, grade: 6 },
];

await run("e2e-new-family", async (h, T) => {
  for (const { minutes, grade } of JOURNEYS) {
    T.section(`new family, grade ${grade}, ${minutes} minutes`);
    const context = await h.context({ width: 1100, height: 900 });
    const page = await context.newPage();
    await page.goto(h.url(""));
    await page.waitForSelector("[data-testid=start-session]:not([disabled])");

    // -- the empty home ----------------------------------------------------------------------------------------------------
    T.ok(
      !(await isVisible(page, "[data-testid=resume-banner]")),
      "no resume banner on an empty device",
    );
    T.ok(
      await isVisible(page, "[data-testid=progress-empty]"),
      "the progress strip says there is no progress yet",
    );
    T.eq(
      await page.locator("[data-testid=grade-selector] button").count(),
      9,
      "nine grade buttons (K to 8)",
    );
    T.eq(
      await page.locator("[data-testid=game-card][data-ready=true]").count(),
      10,
      "all ten games are ready on the shelf",
    );
    T.eq(
      await page.evaluate(() => localStorage.getItem("ewl-fm2-v1")),
      null,
      "nothing is stored before the learner chooses anything",
    );

    await setup(page, { grade, minutes });
    T.eq(
      await page.locator(`[data-testid=grade-${grade}]`).getAttribute("aria-pressed"),
      "true",
      "the chosen grade is pressed",
    );
    T.ok(
      await page.locator(`[data-testid=minutes-${minutes}]`).isChecked(),
      "the chosen length is selected",
    );
    const saved = await storeOf(page);
    T.eq(
      [saved.settings.grade, saved.settings.minutes, saved.settings.mode],
      [grade, minutes, "solo"],
      "grade and length are saved as settings",
    );

    const { code, params } = await readPlan(page);
    const plan = decodePlan(code, games);
    T.ok(
      plan && plan.activities.length >= 2,
      `the Start link carries a plan with ${plan?.activities.length} activities`,
    );
    T.eq(
      [plan.grade, plan.minutes, plan.mode],
      [grade, minutes, "solo"],
      "the plan code names the chosen grade, length and solo mode",
    );
    T.eq(params.grade, String(grade), "the Start link carries the grade");
    const summary = await text(page, "[data-testid=plan-summary]");
    T.match(
      summary,
      new RegExp(
        `${plan.activities.length} activities · about ${Math.max(1, Math.round(plan.estSec / 60))} min · Solo`,
      ),
      "the plan summary matches the plan",
    );
    T.eq(
      await page.locator("[data-testid=mission-activity]").count(),
      plan.activities.length,
      "today's mission lists the same activities",
    );
    const band = plan.estSec / (minutes * 60);
    T.ok(
      band >= 0.85 && band <= 1.05,
      `the plan fits the ${minutes}-minute budget (${(plan.estSec / 60).toFixed(1)} min)`,
    );

    // -- press Start and play ------------------------------------------------------------------------------------------------
    await page.locator("[data-testid=start-session]").click();
    await page.waitForSelector("[data-fm2-shell]");
    T.match(
      page.url(),
      /play\.html\?.*plan=.*resume=1/,
      "Start opens the session host and the URL gains resume=1",
    );
    T.match(await text(page, "[data-fm2-round]"), /^Round 1 of \d+$/, "the shell opens on round 1");

    const checkedBetween = [];
    const log = await playSession(page, T, {
      choose: ({ step, index, gameId }) =>
        step === 0 && index === 0 && hasSolver(gameId)
          ? "ui"
          : step === 1 && index === 0
            ? "reveal"
            : step === 2 && index === 0
              ? "hint"
              : "seam",
      onRound: (row, info) => {
        if (row.action === "reveal")
          T.match(
            row.feedback,
            /worked answer|respuesta resuelta/,
            `${info.gameId}: Show me says the answer was shown`,
          );
        else
          T.match(
            row.feedback,
            CORRECT,
            `${info.gameId} round ${info.index + 1}: feedback says Correct after the answer`,
          );
      },
      onBetween: (entry) => checkedBetween.push(entry),
    });
    const acts = activitiesOf(log);
    T.eq(acts.length, plan.activities.length, "every planned activity was played");
    T.eq(
      acts[0].rounds[0].via,
      "ui",
      `the first round of ${acts[0].gameId} was answered with real controls`,
    );
    acts.forEach((a, i) => {
      const p = plan.activities[i];
      T.eq(
        [a.gameId, a.skillId, a.level, a.total],
        [p.gameId, p.skillId, p.level, p.rounds],
        `activity ${i + 1} is the planned ${p.gameId}/${p.skillId} at level ${p.level} with ${p.rounds} rounds`,
      );
    });

    // -- the cards between activities ----------------------------------------------------------------------------------------------
    T.eq(
      checkedBetween.length,
      plan.activities.length - 1,
      "one between card between every pair of activities",
    );
    checkedBetween.forEach((entry, i) => {
      const step = i + 1;
      const next = plan.activities[step];
      const remaining = Math.max(
        1,
        Math.ceil(plan.activities.slice(step).reduce((n, a) => n + a.estSec, 0) / 60),
      );
      T.match(
        entry.text,
        new RegExp(`Activity ${step + 1} of ${plan.activities.length}`, "i"),
        `between card ${step}: names the step`,
      );
      T.match(
        entry.next,
        new RegExp(`^Next: ${gameById(next.gameId).title.en}`),
        `between card ${step}: names the next game`,
      );
      T.match(
        entry.left,
        new RegExp(`About ${remaining} min left`),
        `between card ${step}: minutes left are ${remaining}`,
      );
      const before = acts[i];
      const solved = before.rounds.filter((r) => r.solved).length;
      T.match(
        entry.text,
        new RegExp(`Last activity: ${solved} of ${before.rounds.length} solved`),
        `between card ${step}: reports ${solved} of ${before.rounds.length} for the activity just played`,
      );
    });

    // -- the end screen -------------------------------------------------------------------------------------------------------
    const expected = acts.map((a) => {
      const correct = a.rounds.filter((r) => r.solved).length;
      return { ...a, correct, stars: starCountOracle(correct, a.rounds.length) };
    });
    const sumCorrect = expected.reduce((n, a) => n + a.correct, 0);
    const sumRounds = expected.reduce((n, a) => n + a.rounds.length, 0);
    T.ok(
      expected[1].correct === expected[1].rounds.length - 1,
      "the revealed round did not count as solved",
    );
    T.eq(
      (await text(page, "[data-testid=session-correct]")).trim(),
      `${sumCorrect} of ${sumRounds}`,
      "the end screen shows the solved count",
    );
    T.eq(
      Number(await text(page, "[data-testid=session-skill-count]")),
      new Set(expected.map((a) => `${a.gameId}:${a.skillId}`)).size,
      "the end screen counts the skills practiced",
    );
    const rows = await page
      .locator("[data-testid=session-activity]")
      .evaluateAll((r) =>
        r.map((x) => ({ game: x.dataset.game, stars: Number(x.dataset.stars), text: x.innerText })),
      );
    T.eq(
      rows.map((r) => r.game),
      expected.map((a) => a.gameId),
      "the end screen lists every activity in order",
    );
    T.eq(
      rows.map((r) => r.stars),
      expected.map((a) => a.stars),
      "each activity shows the stars its solved share earns",
    );
    rows.forEach((r, i) =>
      T.match(
        r.text,
        new RegExp(`${expected[i].correct} of ${expected[i].rounds.length} solved`),
        `activity ${i + 1}: shows ${expected[i].correct} of ${expected[i].rounds.length} solved`,
      ),
    );
    T.eq(
      await isVisible(page, "[data-testid=session-reflection]"),
      minutes === 15,
      "the family reflection appears on 15-minute sessions only",
    );
    for (const id of [
      "session-again",
      "session-home",
      "session-progress",
      "session-recommendation",
    ])
      T.ok(await isVisible(page, `[data-testid=${id}]`), `end screen offers ${id}`);
    const shownMinutes = Number(await text(page, "[data-testid=session-minutes]"));

    // -- the two stored records ---------------------------------------------------------------------------------------------------
    const store = await storeOf(page);
    const record = await sessionOf(page);
    T.eq(store.sessions.length, 1, "exactly one session is recorded");
    const s = store.sessions[0];
    T.eq(
      [s.grade, s.mode, s.correct, s.total],
      [grade, "solo", sumCorrect, sumRounds],
      "the recorded session has the grade, mode and counts",
    );
    T.eq(
      [...s.games].sort(),
      [...new Set(expected.map((a) => a.gameId))].sort(),
      "the recorded session lists the games played",
    );
    T.eq(s.minutes, shownMinutes, "recorded minutes equal the minutes on the end screen");
    const cap = Math.ceil((plan.estSec * 1.2) / 60);
    T.ok(
      s.minutes >= 1 && s.minutes <= cap,
      `recorded minutes (${s.minutes}) are within 1..${cap}`,
    );
    T.eq(store.days[dayOf()], s.minutes, "today's minutes equal the session minutes");
    T.eq(store.resume, null, "no resume record is left after finishing");
    T.eq(
      [store.settings.grade, store.settings.minutes],
      [grade, minutes],
      "settings survive the session",
    );
    for (const a of expected) {
      const k = `${a.gameId}:${a.skillId}`;
      const rec = store.skills[k];
      T.eq(rec?.plays, a.rounds.length, `${k}: one recorded play per round`);
      T.eq(
        rec?.recent.map((x) => x.c),
        a.rounds.map((r) => (r.solved ? 1 : 0)),
        `${k}: the right and missed rounds are recorded in order`,
      );
      T.eq(
        rec?.recent.map((x) => x.h),
        a.rounds.map((r) => r.hints),
        `${k}: hints used are recorded per round`,
      );
      const g = store.games[a.gameId];
      T.eq(
        [g?.plays, g?.completed, g?.bestStars],
        [1, 1, a.stars],
        `${a.gameId}: one completed play, best stars ${a.stars}`,
      );
    }
    T.eq(
      record.finished && record.recorded,
      true,
      "the session record is marked finished and recorded",
    );
    T.eq(
      [record.step, record.summaries.length],
      [plan.activities.length, plan.activities.length],
      "the session record has a summary per activity",
    );
    T.eq(
      record.summaries.map((x) => x.stars),
      expected.map((a) => a.stars),
      "summary stars match",
    );
    T.eq(
      Object.keys(
        await page.evaluate(() =>
          Object.fromEntries(Object.entries(localStorage).filter(([k]) => k.startsWith("ewl-fm2"))),
        ),
      ).sort(),
      [STORE, SESSION].sort(),
      "only the two Family Math 2 records exist for this learner",
    );

    // -- reload on the end screen: shown again, not recorded twice ------------------------------------------------------------------
    await page.reload();
    await page.waitForSelector("[data-testid=session-complete]");
    T.eq(
      (await storeOf(page)).sessions.length,
      1,
      "reloading the end screen does not record the session twice",
    );
    T.eq(
      (await text(page, "[data-testid=session-correct]")).trim(),
      `${sumCorrect} of ${sumRounds}`,
      "the end screen comes back with the same counts",
    );

    // -- progress page -------------------------------------------------------------------------------------------------------------------
    await page.locator("[data-testid=session-progress]").click();
    await page.waitForSelector("[data-testid=stat-sessions]");
    await page.waitForSelector("[data-testid=session-row]");
    const progress = await progressSnapshot(page);
    T.eq(progress.sessions, 1, "the progress page counts one session");
    T.eq(progress.sessionRows.length, 1, "the progress page lists the session");
    T.match(
      progress.sessionRows[0],
      new RegExp(`${sumCorrect} of ${sumRounds} solved`),
      "the session row shows the solved count",
    );
    T.eq(progress.minutes, s.minutes, "this week's minutes equal the session minutes");
    T.eq(progress.streak, 1, "the streak is one day");
    T.eq(progress.stars, totalStars(store), "total stars equal the independently computed stars");
    T.eq(progress.empty, false, "the 'no progress yet' card is gone");
    for (const [key, stars] of Object.entries(progress.skillStars))
      T.eq(stars, starsOracle(store.skills[key]?.recent || []), `progress page: stars for ${key}`);
    for (const a of expected) {
      const row = progress.gameRows.find((r) => r.game === a.gameId);
      const earned = gameById(a.gameId).skills.reduce(
        (n, sk) => n + starsOracle(store.skills[`${a.gameId}:${sk.id}`]?.recent || []),
        0,
      );
      T.match(
        row?.text || "",
        new RegExp(
          `${earned} of ${gameById(a.gameId).skills.length * 3} skill stars · played 1 times`,
        ),
        `progress page: ${a.gameId} shows ${earned} skill stars and one play`,
      );
    }
    T.eq(progress.gameRows.length, 10, "ten game rows are listed");

    // -- back home --------------------------------------------------------------------------------------------------------------------------
    await page.locator("[data-testid=back-home]").click();
    await page.waitForSelector("[data-testid=start-session]:not([disabled])");
    const home = await homeStats(page);
    T.eq(
      home,
      { streak: 1, minutes: s.minutes, stars: totalStars(store) },
      "home shows the streak, minutes and stars",
    );
    T.ok(
      !(await isVisible(page, "[data-testid=resume-banner]")),
      "no resume banner after a finished session",
    );
    T.ok(
      !(await isVisible(page, "[data-testid=progress-empty]")),
      "home no longer says there is no progress",
    );
    T.eq(
      await page.locator(`[data-testid=grade-${grade}]`).getAttribute("aria-pressed"),
      "true",
      "home restores the grade",
    );
    // The Start link now builds a plan from the new evidence (not the same activities as an empty record gives).
    const again = decodePlan((await readPlan(page)).code, games);
    T.ok(again.activities.length >= 2, "a new plan is offered after the session");
    await context.close();
  }
});
