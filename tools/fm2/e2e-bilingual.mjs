// E2E journey 5, BILINGUAL: start in English, switch to Spanish and back on the home, start a session, switch to Spanish in the
// middle of an activity (round, hints and the coins already on the tray must survive), finish the activity, switch again on the
// between card, finish the session, switch on the end screen and the progress page, and end back in English. At every step the
// visible text and the accessible labels are checked against a list of English interface words (on Spanish pages) and a list of
// Spanish ones (on English pages). @fm2 FM-084 FM-020 FM-021
import {
  activitiesOf,
  answerSeam,
  attempt,
  clickNext,
  DAY,
  decodePlan,
  englishLeaks,
  feedbackOf,
  fingerprint,
  gameById,
  games,
  keyFor,
  LANG,
  labelsText,
  marketClear,
  openHome,
  playSession,
  progressSnapshot,
  readPlan,
  roundOf,
  run,
  STORE,
  seedLocal,
  shellInfo,
  skillRecord,
  solveUi,
  spanishHits,
  storeOf,
  storeState,
  text,
  visibleText,
} from "./e2e-kit.mjs";

const GAME = "math-market";
const SKILL = "exact-pay";
const GRADE = 3;
const market = gameById(GAME);

await run("e2e-bilingual", async (h, T) => {
  const context = await h.context({ width: 1100, height: 900 });
  // exact-pay is due for review, so the planner opens the session with it (a tray whose coins are visible work in progress)
  const rec = skillRecord({
    recent: [attempt(1, 0, 1), attempt(1, 0, 1), attempt(0, 0, 1), attempt(1, 1, 1)],
    level: 1,
    plays: 4,
    dueAt: Date.now() - 3 * DAY,
  });
  await seedLocal(context, {
    [keyFor(STORE, 0)]: storeState({
      skills: { [`${GAME}:${SKILL}`]: rec },
      settings: { grade: GRADE, minutes: 5, mode: "solo" },
    }),
  });

  const checkedKinds = new Set();
  const english = async (label, page) => {
    const [body, labels] = [await visibleText(page), await labelsText(page)];
    T.eq(
      await page.evaluate(() => document.documentElement.lang),
      "en",
      `${label}: the page language is en`,
    );
    T.eq(
      spanishHits(`${body} ${labels}`),
      [],
      `${label}: no Spanish interface words on an English page`,
    );
  };
  const spanish = async (label, page) => {
    const [body, labels] = [await visibleText(page), await labelsText(page)];
    T.eq(
      await page.evaluate(() => document.documentElement.lang),
      "es",
      `${label}: the page language is es`,
    );
    T.eq(
      englishLeaks(body).filter((w) => w !== "skip to"),
      [],
      `${label}: no English interface words in the visible text`,
    );
    T.eq(
      englishLeaks(labels),
      [],
      `${label}: no English interface words in aria-labels and titles`,
    );
    T.ok(
      spanishHits(`${body} ${labels}`).length >= 1,
      `${label}: Spanish interface words are present`,
    );
    // once per kind of page: the skip link and the tab title are static text on some pages
    const kind = new URL(page.url()).pathname.split("/").pop() || "index";
    if (!checkedKinds.has(kind)) {
      checkedKinds.add(kind);
      const title = await page.title();
      T.ok(
        !/^(Play|Family Math) ·/.test(title),
        `${kind}: the browser tab title follows the language ("${title}")`,
      );
      T.eq(
        englishLeaks(body).filter((w) => w === "skip to"),
        [],
        `${kind}: the skip link is in Spanish`,
      );
    }
  };
  const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), LANG);

  // -- home -------------------------------------------------------------------------------------------------------------------------
  T.section("bilingual: home English, Spanish, English");
  const page = await openHome(h, context);
  await english("home (en)", page);
  T.eq(await stored(page), null, "no language is stored until the learner switches");
  const enHero = await text(page, "#welcome-title");
  await page.click("[data-testid=lang-toggle]");
  await spanish("home (es)", page);
  T.eq(await stored(page), "es", "the language choice is stored");
  const esHero = await text(page, "#welcome-title");
  T.ok(esHero !== enHero, "the hero text changed");
  T.eq(await text(page, "[data-testid=lang-toggle]"), "English", "the toggle offers English");
  T.match(
    await page.locator("[data-testid=start-session]").getAttribute("href"),
    /lang=es/,
    "the Start link carries lang=es",
  );
  await page.click("[data-testid=lang-toggle]");
  await english("home (back to en)", page);
  T.eq(await text(page, "#welcome-title"), enHero, "the English hero text came back");
  T.eq(await stored(page), "en", "English is stored again");

  // -- start in English, switch mid-activity ----------------------------------------------------------------------------------------
  T.section("bilingual: switch to Spanish in the middle of an activity");
  const { code } = await readPlan(page);
  const plan = decodePlan(code, games);
  T.eq(
    [plan.activities[0].gameId, plan.activities[0].skillId],
    [GAME, SKILL],
    "the session opens with the due skill (a tray activity)",
  );
  await page.locator("[data-testid=start-session]").click();
  await page.waitForSelector("[data-fm2-shell] .mm-tray");
  await english("activity (en)", page);
  const info0 = await shellInfo(page);
  const round = await roundOf(page);
  T.eq(round.kind, "tray", "round 1 is a coin-tray round");
  const fp = await fingerprint(page);
  await page.click("[data-fm2-hint]");
  T.eq(
    (await text(page, "[data-fm2-hintbox]")).includes(market.hint(round, 0, null).en),
    true,
    "the English hint text is showing",
  );
  const coins = round.pool.slice(0, 2);
  for (const c of coins) await page.click(`[data-mm-add="${c}"]`);
  const placed = () => page.locator(".mm-tray .mm-placed").count();
  T.eq(await placed(), 2, "two coins are on the tray");
  await page.click("[data-fm2-lang]");
  await spanish("activity (es, mid-round)", page);
  const mid = await shellInfo(page);
  T.eq(
    [mid.index, mid.hints, mid.attempts, mid.skillId],
    [info0.index, 1, 0, SKILL],
    "round, hint count and attempts are kept",
  );
  T.eq(await fingerprint(page), fp, "the round is the same item");
  T.eq(await placed(), 2, "the two coins are still on the tray");
  T.eq(
    await text(page, "[data-fm2-hintbox]"),
    `Pista 1 ${market.hint(round, 0, null).es}`,
    "the hint box shows the Spanish hint for the same tier",
  );
  T.eq(await text(page, "[data-fm2-prompt]"), round.prompt.es, "the prompt is the Spanish prompt");
  T.eq(
    await text(page, "[data-fm2-round]"),
    `Ronda 1 de ${info0.total}`,
    "the round label is Spanish",
  );
  T.eq(await text(page, "[data-fm2-hint]"), "Pista 2", "the hint button offers Pista 2");
  T.eq(await text(page, "[data-fm2-title]"), market.title.es, "the game title is Spanish");
  await page.click("[data-fm2-lang]");
  await english("activity (en again)", page);
  T.eq(
    [await placed(), (await shellInfo(page)).hints, await fingerprint(page)],
    [2, 1, fp],
    "switching back keeps the tray, the hint and the round",
  );
  await page.click("[data-fm2-lang]");
  await spanish("activity (es again)", page);
  T.eq(await placed(), 2, "still two coins after the third switch");

  // -- finish the activity in Spanish ---------------------------------------------------------------------------------------------------
  T.section("bilingual: complete practice in Spanish");
  await marketClear(page);
  T.eq(await placed(), 0, "the tray was cleared by the learner");
  T.ok(await solveUi(page), "the round is solved with the register controls");
  await page.waitForFunction(() => window.__fm2.tools.solved);
  T.match(await feedbackOf(page), /¡Correcto!/, "the feedback is Spanish");
  await spanish("solved round (es)", page);
  await clickNext(page);
  let switchedMidSession = false;
  let betweenSeen = 0;
  const log = await playSession(page, T, {
    onRound: async (row, info) => {
      T.match(
        row.feedback,
        /¡Correcto!/,
        `${info.gameId} round ${info.index + 1}: feedback in Spanish`,
      );
    },
    onBetween: async (entry, p) => {
      betweenSeen += 1;
      await spanish(`between card ${entry.step} (es)`, p);
      T.match(entry.text, /Actividad \d+ de \d+/i, "the between card names the step in Spanish");
      T.match(entry.next, /^Siguiente: /, "the between card names the next game in Spanish");
      T.match(entry.left, /Quedan unos \d+ min/, "the minutes left are Spanish");
      if (!switchedMidSession) {
        switchedMidSession = true;
        await p.click("[data-testid=session-lang]");
        await english(`between card ${entry.step} (en)`, p);
        T.match(
          await text(p, "[data-testid=session-next]"),
          /^Next: /,
          "the card re-rendered in English",
        );
        await p.click("[data-testid=session-lang]");
        await spanish(`between card ${entry.step} (es again)`, p);
        T.match(await text(p, "[data-testid=session-next]"), /^Siguiente: /, "and back in Spanish");
      }
    },
  });
  T.ok(betweenSeen >= 1, "the session has at least one between card");
  // -- end screen ---------------------------------------------------------------------------------------------------------------------------
  T.section("bilingual: end screen and progress");
  await spanish("end screen (es)", page);
  const countsEs = await text(page, "[data-testid=session-correct]");
  T.match(countsEs, /^\d+ de \d+$/, "the solved count reads 'n de m'");
  const rowsEs = await page
    .locator("[data-testid=session-activity]")
    .evaluateAll((r) => r.map((x) => x.dataset.stars));
  await page.click("[data-testid=session-lang]");
  await english("end screen (en)", page);
  T.eq(
    (await text(page, "[data-testid=session-correct]")).replace(" of ", " de "),
    countsEs,
    "the counts are the same in English",
  );
  T.eq(
    await page
      .locator("[data-testid=session-activity]")
      .evaluateAll((r) => r.map((x) => x.dataset.stars)),
    rowsEs,
    "the stars are the same in English",
  );
  await page.click("[data-testid=session-lang]");
  await spanish("end screen (es again)", page);
  const store = await storeOf(page);
  T.eq(store.sessions.length, 1, "switching languages on the end screen recorded one session only");
  const total = activitiesOf(log).reduce((n, a) => n + a.rounds.length, 0) + 1;
  T.ok(store.sessions[0].total >= total, "the session total covers every round played");
  await page.click("[data-testid=session-progress]");
  await page.waitForSelector("[data-testid=mastery-cell]");
  await spanish("progress (es)", page);
  const pEs = await progressSnapshot(page);
  await page.click("[data-testid=lang-toggle]");
  await english("progress (en)", page);
  const pEn = await progressSnapshot(page);
  T.eq(
    [pEn.sessions, pEn.minutes, pEn.stars, pEn.streak, pEn.cells],
    [pEs.sessions, pEs.minutes, pEs.stars, pEs.streak, pEs.cells],
    "the numbers on the progress page do not change with the language",
  );
  await page.click("[data-testid=lang-toggle]");
  await spanish("progress (es again)", page);
  T.match(await page.title(), /^Mi progreso/, "the progress page title is Spanish");

  // -- back home, back to English ---------------------------------------------------------------------------------------------------------
  T.section("bilingual: home remembers Spanish, then back to English");
  await page.click("[data-testid=back-home]");
  await page.waitForSelector("[data-testid=start-session]:not([disabled])");
  await spanish("home after the session (es)", page);
  await page.click("[data-testid=lang-toggle]");
  await english("home (en at the end)", page);
  T.eq(await stored(page), "en", "the journey ends in English with English stored");
  const fresh = await context.newPage();
  await fresh.goto(h.url(""));
  await fresh.waitForSelector("[data-testid=start-session]:not([disabled])");
  await english("a new tab (en)", fresh);
});
