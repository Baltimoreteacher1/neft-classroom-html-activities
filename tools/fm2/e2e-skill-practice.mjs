// E2E journey 4, SKILL PRACTICE: from the home skill browser choose a grade and a skill, open the activity, use hints, enter a
// wrong response and revise it, solve, and get a new item next round (different round fingerprint). The recommendation text
// on the home and the progress page must change once the skill has evidence. @fm2 FM-083 FM-031 FM-032
import {
  answerSeam,
  CORRECT,
  clickNext,
  feedbackOf,
  fingerprint,
  gameById,
  games,
  isVisible,
  marketClear,
  marketWrong,
  masteryOracle,
  openHome,
  progressSnapshot,
  roundOf,
  run,
  shellInfo,
  skillsCovering,
  solveUi,
  starsIn,
  starsOracle,
  storeOf,
  text,
} from "./e2e-kit.mjs";

const GAME = "math-market";
const SKILL = "exact-pay";
const GRADE = 3;
const containsAnswer = (value, answer) =>
  new RegExp(
    `(?<![\\w./-])${String(answer).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w./-])`,
  ).test(value);

await run("e2e-skill-practice", async (h, T) => {
  const context = await h.context({ width: 1100, height: 900 });
  const page = await openHome(h, context);

  // -- choose a grade, browse skills ----------------------------------------------------------------------------------------------
  T.section("skill practice: the skill browser follows the grade");
  const browse = async (grade) => {
    await page.locator(`[data-testid=grade-${grade}]`).click();
    // open every strand so every row is in the DOM-visible tree
    while ((await page.locator("[data-testid=strand-group]:not([open])").count()) > 0)
      await page.locator("[data-testid=strand-group]:not([open]) > summary").first().click();
    return (
      await page
        .locator("[data-testid=skill-row]")
        .evaluateAll((rows) => rows.map((r) => `${r.dataset.game}:${r.dataset.skill}`))
    ).sort();
  };
  for (const grade of [GRADE, 6, 0]) {
    const rows = await browse(grade);
    T.eq(
      rows,
      skillsCovering(games, grade).sort(),
      `grade ${grade}: the skill browser lists exactly the skills whose grade range covers it (${rows.length})`,
    );
  }
  await browse(GRADE);
  const before = {
    mission: await page.locator("[data-testid=mission-activity] .hm-why").allInnerTexts(),
    missionItems: await page
      .locator("[data-testid=mission-activity]")
      .evaluateAll((e) => e.map((x) => `${x.dataset.game}:${x.dataset.skill}`)),
  };
  const row = page.locator(`[data-testid=skill-row][data-game=${GAME}][data-skill=${SKILL}]`);
  T.eq(await row.count(), 1, `the browser has a row for ${GAME}/${SKILL}`);
  T.eq(await starsIn(row), 0, "the skill starts with no stars");
  T.ok(
    (await row.innerText()).includes(gameById(GAME).skills.find((x) => x.id === SKILL).standard),
    "the row shows the skill's standard code",
  );
  await row.scrollIntoViewIfNeeded();
  const startedFrom = await row.locator("[data-testid=skill-practice]").getAttribute("href");
  T.match(
    startedFrom,
    new RegExp(`game=${GAME}.*skill=${SKILL}.*level=1.*grade=${GRADE}`),
    "the Practice link carries game, skill, level 1 and grade 3",
  );

  // -- open the activity, hint, wrong, revise, solve ------------------------------------------------------------------------
  T.section("skill practice: hint, wrong response, revision, solve, new item");
  await row.locator("[data-testid=skill-practice]").click();
  await page.waitForSelector("[data-fm2-shell] .mm-register, [data-fm2-shell] .mm");
  const first = await shellInfo(page);
  T.eq(
    [first.gameId, first.skillId, first.grade, first.level, first.total],
    [GAME, SKILL, GRADE, 1, 5],
    "the activity opens on the chosen skill, grade and level with five rounds",
  );
  const fingerprints = [await fingerprint(page)];
  T.ok(!(await isVisible(page, "[data-fm2-hintbox]")), "no hint is showing at first");
  T.eq(await text(page, "[data-fm2-hint]"), "Hint", "the hint button starts as Hint");
  await page.click("[data-fm2-hint]");
  const hint0 = await text(page, "[data-fm2-hintbox]");
  T.ok((await isVisible(page, "[data-fm2-hintbox]")) && hint0.length > 12, "Hint 1 shows a nudge");
  T.eq(await text(page, "[data-fm2-hint]"), "Hint 2", "the button now offers Hint 2");
  await page.click("[data-fm2-hint]");
  const hint1 = await text(page, "[data-fm2-hintbox]");
  T.ok(hint1 !== hint0, "Hint 2 is a different, stronger hint");
  T.ok(
    !containsAnswer(hint0, first.answer) && !containsAnswer(hint1, first.answer),
    `the first two hints do not state the answer (${first.answer})`,
  );
  T.eq((await shellInfo(page)).hints, 2, "two hints are counted");

  await marketWrong(page);
  await page.waitForFunction(() =>
    /Not yet|Todavía no/.test(document.querySelector("[data-fm2-feedback]")?.textContent || ""),
  );
  const miss = await feedbackOf(page);
  T.ok(
    miss.length > 30,
    `the wrong entry gets feedback that says what to check: "${miss.slice(0, 90)}"`,
  );
  T.ok(!(await isVisible(page, "[data-fm2-next]")), "Next is not offered after a wrong response");
  T.ok(
    !containsAnswer(miss, first.answer) || first.answer.length < 2,
    "a miss does not print the worked answer",
  );
  T.eq((await shellInfo(page)).attempts, 1, "one attempt is counted");
  T.eq((await shellInfo(page)).hints, 2, "the hints stay at two while revising");
  await marketClear(page);
  T.ok(await solveUi(page), "the revision is entered with the register controls");
  await page.waitForFunction(() => window.__fm2.tools.solved);
  T.match(await feedbackOf(page), CORRECT, "the revised response is accepted");
  T.eq((await shellInfo(page)).attempts, 2, "the revision is the second attempt");
  await clickNext(page);
  await page.waitForFunction(() => window.__fm2.index === 1);
  fingerprints.push(await fingerprint(page));
  T.ok(
    fingerprints[1] !== fingerprints[0],
    "the next round is a new item (different round fingerprint)",
  );
  T.eq(await text(page, "[data-fm2-hint]"), "Hint", "the hint ladder starts over on the new round");
  T.ok(!(await isVisible(page, "[data-fm2-hintbox]")), "the old hint is gone");
  T.eq((await shellInfo(page)).attempts, 0, "attempts start over");
  for (let i = 1; i < 5; i += 1) {
    T.ok((await answerSeam(page)).correct, `round ${i + 1} solved`);
    await clickNext(page);
    if (i < 4) {
      await page.waitForFunction((n) => window.__fm2.index === n, i + 1);
      fingerprints.push(await fingerprint(page));
    }
  }
  T.eq(new Set(fingerprints).size, 5, "all five rounds are different items");
  await page.waitForSelector(".fm2-finish:not([hidden])");
  T.match(
    await page.locator(".fm2-stars").getAttribute("aria-label"),
    /^3 of 3 stars$/,
    "five of five solved (one with hints) earns three stars",
  );

  // -- the record ----------------------------------------------------------------------------------------------------------------
  T.section("skill practice: the record and the recommendation text move");
  const store = await storeOf(page);
  const rec = store.skills[`${GAME}:${SKILL}`];
  T.eq(rec.plays, 5, "five plays are recorded");
  T.eq(
    rec.recent.map((a) => [a.c, a.h, a.l]),
    [
      [1, 2, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 0, 1],
      [1, 0, 1],
    ],
    "the first round records its two hints; the others are clean",
  );
  const stars = starsOracle(rec.recent);
  T.ok(
    masteryOracle(rec.recent).score > 0.7,
    `mastery is ${masteryOracle(rec.recent).score.toFixed(3)}`,
  );
  T.eq(store.resume, null, "no resume record remains");
  T.eq(store.sessions.length, 0, "a single skill practice is not recorded as a family session");
  await page.click("[data-fm2-home]");
  await page.waitForSelector("[data-testid=start-session]:not([disabled])");
  await browse(GRADE);
  const after = {
    mission: await page.locator("[data-testid=mission-activity] .hm-why").allInnerTexts(),
    missionItems: await page
      .locator("[data-testid=mission-activity]")
      .evaluateAll((e) => e.map((x) => `${x.dataset.game}:${x.dataset.skill}`)),
  };
  T.eq(
    await starsIn(page.locator(`[data-testid=skill-row][data-game=${GAME}][data-skill=${SKILL}]`)),
    stars,
    `the skill row now shows ${stars} stars`,
  );
  T.ok(
    before.mission.length > 0 && after.mission.length > 0,
    "today's mission lists activities with a reason each",
  );
  T.ok(
    JSON.stringify(before.mission) !== JSON.stringify(after.mission) ||
      JSON.stringify(before.missionItems) !== JSON.stringify(after.missionItems),
    "the recommendation text changed after practice",
  );
  T.ok(
    !after.missionItems.some(
      (x, i) => x === `${GAME}:${SKILL}` && /This is a new skill/.test(after.mission[i]),
    ),
    "the practiced skill is no longer described as a new skill",
  );
  await page.locator("[data-testid=progress-link]").click();
  await page.waitForSelector("[data-testid=grade-skills] [data-testid=skill-row]");
  const progress = await progressSnapshot(page);
  T.eq(
    progress.skillStars[`${GAME}:${SKILL}`],
    stars,
    "the progress page shows the same stars for the skill",
  );
  const gameRow = progress.gameRows.find((r) => r.game === GAME);
  T.match(gameRow.text, /played 1 times/, "the progress page counts one play of the game");
  T.eq(progress.stars, stars, "total stars equal this skill's stars");
  T.ok(
    await isVisible(page, "[data-testid=next-list]"),
    "the progress page lists what to try next",
  );
  const nextText = (await page.locator("[data-testid=next-row]").allInnerTexts()).join(" | ");
  if (stars === 3)
    T.match(
      nextText,
      /earned three stars at level \d\. Ready to try level \d/,
      "with three stars the next-list offers a stretch to the next level",
    );
  T.ok(
    !/new skill/i.test(
      await page
        .locator(
          `[data-testid=next-row]:has-text("${gameById(GAME).skills.find((s) => s.id === SKILL).title.en}")`,
        )
        .allInnerTexts()
        .then((t) => t.join(" ")),
    ),
    "the next list never calls the practiced skill new",
  );
});
