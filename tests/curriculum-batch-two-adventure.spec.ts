import { test, expect as baseExpect, type Locator, type Page } from "@playwright/test";

// These pages are large and the shared dev machine runs many browsers at once: give each
// test and assertion room so a slow machine reads as slow, not as a failure.
const expect = baseExpect.configure({ timeout: 15_000 });
test.beforeEach(() => test.slow());

/*
 * Batch two adventure layer: Ratio Quest (Caravan Road), Unit Rate Market Mission (Price Phantom),
 * Ratio & Rate Review Mission (Harbor), Unit 3 Test Review (Summit, bilingual), and the 3.4
 * Laser Lab (Crystal Frontier) and Sonar Hunt (Abyssal Rescue).
 *
 * Every title is played through its NATIVE question UI: a correct answer must add campaign
 * supplies, a wrong or revealed answer must not, an answer can never count twice, and the
 * campaign must survive a reload. Spending is then exercised to the capstone and a replay.
 * Set SHOT_DIR to also save 1366px and 390px screenshots of each campaign.
 */

const SHOT_DIR = process.env.SHOT_DIR;

function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function seed(page: Page, path: string, entries: Record<string, unknown>) {
  await page.goto(path);
  await page.evaluate((data) => {
    localStorage.clear();
    for (const [key, value] of Object.entries(data))
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  }, entries);
  await page.reload();
}

const supplies = (host: Locator, index = 0) => host.locator(".xc-coin-num").nth(index);

/* Commit the first affordable path in every chapter, open the capstone, then start expedition 2. */
async function playCampaignToEnd(host: Locator) {
  for (let chapter = 0; chapter < 3; chapter++) {
    await expect(host.locator(".xc-step")).toContainText(`${chapter + 1} of 3`);
    const commit = host.locator("[data-xc-commit]");
    await expect(commit).toBeDisabled();
    await host.locator(".xc-option:not(.xc-option--short)").first().click();
    await expect(host.locator('.xc-option[aria-pressed="true"]')).toHaveCount(1);
    await commit.click();
    await expect(host.locator(".xc-stop--done")).toHaveCount(chapter + 1);
  }
  await host.locator("[data-xc-capstone]").click();
  await expect(host.locator(".xc-card--end h3")).toBeVisible();
  await expect(host.locator(".xc-endings .xc-found")).toHaveCount(1);
  await host.locator("[data-xc-again]").click();
  await expect(host.locator(".xc-kicker")).toContainText("Expedition 2");
  await expect(host.locator(".xc-stop--done")).toHaveCount(0);
}

async function checkPhone(page: Page, host: Locator, name: string, scroller?: string) {
  if (SHOT_DIR) await host.screenshot({ path: `${SHOT_DIR}/${name}-1366.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await host.scrollIntoViewIfNeeded();
  const overflow = await page.evaluate((sel) => {
    const box = sel ? document.querySelector(sel) : document.documentElement;
    const doc = document.documentElement;
    return Math.max(doc.scrollWidth - doc.clientWidth, box ? box.scrollWidth - box.clientWidth : 0);
  }, scroller ?? null);
  expect(overflow).toBeLessThanOrEqual(1);
  const hostBox = await host.boundingBox();
  expect(hostBox && hostBox.x >= 0 && hostBox.x + hostBox.width <= 391).toBeTruthy();
  if (SHOT_DIR) await host.screenshot({ path: `${SHOT_DIR}/${name}-390.png` });
  await page.setViewportSize({ width: 1366, height: 900 });
}

test.describe("Ratio Quest · Caravan Road", () => {
  const PATH = "/curriculum/ratio-quest/";
  const SAVE = { name: "Ana", avatar: "fox", mode: "regular", sawGuide: true };

  async function openPotionShop(page: Page) {
    await page.locator('.building[data-shop="potion"]').last().click();
    await expect(page.locator("#check")).toBeVisible();
  }
  async function readRecipe(page: Page) {
    const text = (await page.locator(".recipe").innerText()).replace(/\s+/g, " ");
    const m = text.match(/(ember|frost) to (ember|frost) (\d+) : (\d+)/);
    expect(m, text).not.toBeNull();
    const [, firstName, , a, b] = m as RegExpMatchArray;
    const first = Number(a);
    const second = Number(b);
    return {
      first,
      second,
      ember: firstName === "ember" ? first : second,
      frost: firstName === "ember" ? second : first,
    };
  }
  async function setDrops(page: Page, ember: number, frost: number) {
    for (const [kind, want] of [
      ["ember", ember],
      ["frost", frost],
    ] as const) {
      const id = kind === "ember" ? "#cE" : "#cF";
      let have = Number(await page.locator(id).innerText());
      while (have !== want) {
        await page.locator(`.circ[data-k="${kind}"][data-d="${have < want ? 1 : -1}"]`).click();
        have += have < want ? 1 : -1;
      }
    }
  }
  async function brewCorrectly(page: Page) {
    const r = await readRecipe(page);
    await setDrops(page, r.ember, r.frost);
    await page.locator("#check").click();
    await page.locator("#w1").fill(`${r.first} : ${r.second}`);
    await page.locator("#w2").fill(`${r.first} to ${r.second}`);
    await page.locator("#w3").fill(`${r.first}/${r.second}`);
    await page.locator("#check2").click();
    await expect(page.locator("#roundStars")).not.toBeEmpty();
  }
  const potionBest = (page: Page) =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("ratioQuest.v2") || "{}").modes?.regular?.shops?.potion
          ?.best || [],
    );

  test("native orders earn crates once; wrong brews earn nothing; save resumes", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await seed(page, PATH, { "ratioQuest.v2": SAVE });
    await page.locator("#continue").click();
    await expect(page.locator(".caravan-gate")).toContainText("0 crates");
    await openPotionShop(page);

    // Wrong: swapped drops fizzle, and nothing reaches the caravan.
    const r = await readRecipe(page);
    await setDrops(page, r.frost, r.ember);
    await page.locator("#check").click();
    await expect(page.locator("#fb.bad")).toBeVisible();
    expect(await potionBest(page)).toEqual([]);

    // Correct after one miss: 2 stars → 2 potion crates.
    await brewCorrectly(page);
    expect(await potionBest(page)).toEqual([2]);
    await page.locator("#hudMap").last().click();
    await expect(page.locator(".caravan-gate")).toContainText("2 crates");
    await page.locator(".caravan-gate").click();
    const host = page.locator("#caravanHost");
    await expect(host.locator(".xc-title")).toHaveText("The Caravan Road");
    await expect(supplies(host, 0)).toHaveText("2");
    await expect(host.locator(".xc-gain")).toHaveText("+2");

    // Reload: same crates, no second celebration.
    await page.reload();
    await page.locator("#continue").click();
    await page.locator(".caravan-gate").click();
    await expect(supplies(host, 0)).toHaveText("2");
    await expect(host.locator(".xc-gain")).toHaveCount(0);

    // Replay the order with a first-try brew: only the improvement (+1) is added.
    await page.locator("#hudMap").last().click();
    await openPotionShop(page);
    await brewCorrectly(page);
    expect(await potionBest(page)).toEqual([3]);
    await page.locator("#hudMap").last().click();
    await page.locator(".caravan-gate").click();
    await expect(supplies(host, 0)).toHaveText("3");
    await expect(host.locator(".xc-gain")).toHaveText("+1");
    // A path that needs crates this player has not earned cannot be committed.
    await host.locator('[data-xc-option="healer"]').click();
    await expect(host.locator("[data-xc-commit]")).toBeDisabled();
    await expect(host.locator(".xc-commit-note")).toContainText("Solve more problems");
    expect(errors).toEqual([]);
  });

  test("crates are spent on town choices through the capstone, then replay", async ({ page }) => {
    const errors = watchErrors(page);
    const full = { best: [3, 3, 3, 3, 3, 3], visits: 1 };
    const fresh = { best: [], visits: 0 };
    await seed(page, PATH, {
      "ratioQuest.v2": {
        ...SAVE,
        modes: {
          regular: { shops: { potion: full, bakery: full, post: full, market: full }, finale: 0 },
          challenge: {
            shops: { potion: fresh, bakery: fresh, post: fresh, market: fresh },
            finale: 0,
          },
        },
      },
    });
    await page.locator("#continue").click();
    await page.locator(".caravan-gate").click();
    const host = page.locator("#caravanHost");
    await expect(supplies(host, 0)).toHaveText("18");
    await checkPhone(page, host, "ratio-quest", ".caravan-body");
    await playCampaignToEnd(host);
    await page.reload();
    await page.locator("#continue").click();
    await page.locator(".caravan-gate").click();
    await expect(host.locator(".xc-kicker")).toContainText("Expedition 2");
    expect(errors).toEqual([]);
  });

  test("Regular and Challenge stars both fill the same caravan", async ({ page }) => {
    const errors = watchErrors(page);
    const shops = (potion: number[]) => ({
      potion: { best: potion, visits: 1 },
      bakery: { best: [], visits: 0 },
      post: { best: [1], visits: 1 },
      market: { best: [], visits: 0 },
    });
    await seed(page, PATH, {
      "ratioQuest.v2": {
        ...SAVE,
        mode: "challenge",
        modes: { regular: { shops: shops([3, 3]), finale: 0 }, challenge: { shops: shops([2]), finale: 0 } },
      },
    });
    await page.locator("#continue").click();
    await expect(page.locator(".caravan-gate")).toContainText("10 crates");
    await page.locator(".caravan-gate").click();
    const host = page.locator("#caravanHost");
    await expect(supplies(host, 0)).toHaveText("8");
    await expect(supplies(host, 2)).toHaveText("2");
    expect(errors).toEqual([]);
  });

  test("old saves without a caravan still load", async ({ page }) => {
    const errors = watchErrors(page);
    // A pre-Challenge save kept shops at the top level.
    await seed(page, PATH, {
      "ratioQuest.v2": {
        name: "Old",
        avatar: "cat",
        coins: 40,
        shops: { potion: { best: [3, 2], visits: 1 } },
        sawGuide: true,
      },
      "ratioQuest.caravan.v1": { picks: { ford: 7 }, spent: "x", season: -2 },
    });
    await page.locator("#continue").click();
    if (await page.locator(".mode-card").count())
      await page.locator('.mode-card[data-m="regular"]').click();
    await page.locator(".caravan-gate").click();
    await expect(supplies(page.locator("#caravanHost"), 0)).toHaveText("5");
    await expect(page.locator("#caravanHost .xc-kicker")).toContainText("Expedition 1");
    expect(errors).toEqual([]);
  });
});

test.describe("Unit Rate Market Mission · The Price Phantom", () => {
  const PATH = "/curriculum/unit-rate-market-mission/";

  test("quick-sort answers give clues once; revealed answers give none; resume", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await seed(page, PATH, {});
    const host = page.locator("#case-files");
    await expect(host.locator(".xc-title")).toHaveText("The Price Phantom");
    await expect(supplies(host)).toHaveText("0");
    await page.locator('.tab-btn[data-tab="sort"]').click();
    const answers = await page.evaluate(() =>
      (window as any).eval("sortQs").map((q: any) => [q.id, q.answer]),
    );
    const pick = (id: string, a: string) =>
      page.locator(`#card-${id} .choice[data-a="${a}"]`).click();
    const wrong = (a: string) => (a === "rate" ? "unit" : "rate");

    await pick(answers[0][0], wrong(answers[0][1]));
    await expect(page.locator(`#fb-${answers[0][0]}`)).toContainText("Not yet");
    await expect(supplies(host)).toHaveText("0");
    await pick(answers[0][0], answers[0][1]);
    await expect(supplies(host)).toHaveText("1");

    // Two misses reveal the answer: no clue.
    await pick(answers[1][0], wrong(answers[1][1]));
    await pick(answers[1][0], wrong(answers[1][1]));
    await expect(page.locator(`#fb-${answers[1][0]}`)).toContainText("revealed");
    await expect(supplies(host)).toHaveText("1");

    for (const [id, a] of answers.slice(2)) await pick(id, a);
    await expect(supplies(host)).toHaveText(String(answers.length - 1));
    // Solved cards are locked; nothing can be re-earned.
    await expect(page.locator(`#card-${answers[0][0]} .choice`).first()).toBeDisabled();

    await page.reload();
    await expect(supplies(host)).toHaveText(String(answers.length - 1));
    await expect(host.locator(".xc-gain")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("Deal Detective aisles open with a role choice that shapes the run", async ({ page }) => {
    const errors = watchErrors(page);
    await seed(page, PATH, {});
    await page.locator('.tab-btn[data-tab="challenge"]').click();
    const roles = page.locator("#gBody .xc-roles [data-role]");
    await expect(roles).toHaveCount(3);
    await page.locator('#gBody [data-role="magnifier"]').click();
    await expect(page.locator("#gBody .xc-strip")).toContainText("Magnifier kit");
    await expect(page.locator('#gBody .power[data-power="hint"] .cost')).toHaveText("free");
    expect(errors).toEqual([]);
  });

  test("clues are spent on leads through the capstone, then replay", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(PATH);
    const ids = await page.evaluate(() =>
      (window as any)
        .eval("[...sortQs,...buildQs,...battleQs,...cartQs,...gameRounds]")
        .map((q: any) => q.id),
    );
    const completed = Object.fromEntries(ids.map((id: string) => [id, true]));
    const pts = Object.fromEntries(ids.map((id: string) => [id, 10]));
    await seed(page, PATH, {
      unitRateMarketMissionV1: {
        name: "Ana",
        score: ids.length * 10,
        completed,
        pts,
        attempts: {},
        hinted: {},
        locked: {},
        work: {},
      },
    });
    const host = page.locator("#case-files");
    await expect(supplies(host)).toHaveText(String(ids.length));
    // The map can be folded away and stays folded after a reload.
    await host.locator("[data-xc-toggle]").click();
    await expect(host.locator(".xc-scene")).toHaveCount(0);
    await expect(host.locator("[data-xc-toggle]")).toHaveAttribute("aria-expanded", "false");
    await page.reload();
    await expect(host.locator(".xc-mini")).toContainText(`${ids.length} clues`);
    await host.locator("[data-xc-toggle]").click();
    await expect(host.locator(".xc-scene")).toHaveCount(1);
    await checkPhone(page, host, "unit-rate-market-mission");
    await playCampaignToEnd(host);
    expect(errors).toEqual([]);
  });
});

test.describe("Ratio & Rate Review Mission · Harbor", () => {
  const PATH = "/curriculum/ratio-rate-review-mission/";

  test("mixed-review answers bring crates once; revealed answers do not; resume", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await seed(page, PATH, {});
    const host = page.locator("#review-basecamp");
    await expect(host.locator(".xc-title")).toHaveText("Rebuild the Harbor");
    await page.locator('.tab-btn[data-tab="mixed"]').click();
    const qs = await page.evaluate(() =>
      (window as any)
        .eval("mixedQs")
        .slice(0, 3)
        .map((q: any) => [q.id, q.answer, q.choices.length]),
    );
    const choose = (id: string, i: number) =>
      page.locator(`#card-${id} .choice[data-i="${i}"]`).click();
    const wrongOf = (answer: number, n: number) => (answer + 1) % n;

    await choose(qs[0][0], wrongOf(qs[0][1], qs[0][2]));
    await expect(supplies(host)).toHaveText("0");
    await choose(qs[0][0], qs[0][1]);
    await expect(supplies(host)).toHaveText("1");
    await choose(qs[1][0], qs[1][1]);
    await expect(supplies(host)).toHaveText("2");
    await choose(qs[2][0], wrongOf(qs[2][1], qs[2][2]));
    await choose(qs[2][0], (qs[2][1] + 2) % qs[2][2]);
    await expect(page.locator(`#card-${qs[2][0]} .feedback`)).toContainText("revealed");
    await expect(supplies(host)).toHaveText("2");

    await page.reload();
    await expect(supplies(host)).toHaveText("2");
    // "Earn more" jumps to the next unsolved question.
    await host.locator("[data-xc-practice]").click();
    await expect(page.locator(".panel.active")).toHaveAttribute("id", "ratios");
    expect(errors).toEqual([]);
  });

  test("supplies rebuild the harbor through the festival, then replay; quick path stays affordable", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await page.goto(PATH);
    const ids = await page.evaluate(() =>
      (window as any)
        .eval("[...ratioQs,...equivQs,...rateQs,...unitQs,...valueQs,...mixedQs]")
        .map((q: any) => q.id),
    );
    const done = (list: string[]) => ({
      name: "Fam",
      route: "full",
      completed: Object.fromEntries(list.map((id) => [id, true])),
      points: Object.fromEntries(list.map((id) => [id, 10])),
      attempts: {},
      work: {},
      hinted: {},
    });
    await seed(page, PATH, { ratioRateReviewMissionV1: done(ids) });
    const host = page.locator("#review-basecamp");
    await checkPhone(page, host, "ratio-rate-review-mission");
    await playCampaignToEnd(host);

    // The 4-question quick path must still reach the festival.
    await page.evaluate(() => localStorage.removeItem("ratioRateReviewMission.harbor.v1"));
    await seed(page, PATH, { ratioRateReviewMissionV1: { ...done(ids), route: "quick" } });
    await expect(supplies(host)).toHaveText("4");
    await playCampaignToEnd(host);
    expect(errors).toEqual([]);
  });
});

test.describe("Unit 3 Test Review · Summit Observatory", () => {
  const PATH = "/curriculum/unit-3-test-review/";

  test("family answers earn power cells once, in English and Spanish; resume", async ({ page }) => {
    const errors = watchErrors(page);
    await seed(page, PATH, { "ewl-review-lang": "en" });
    const host = page.locator("#review-basecamp");
    await expect(host.locator(".xc-title")).toHaveText("Power Up the Observatory");
    const mcs = await page.evaluate(() =>
      (window as any)
        .eval("ALL_QS")
        .filter((q: any) => q.type === "mc")
        .slice(0, 3)
        .map((q: any) => [
          q.id,
          q.answer,
          q.choices.length,
          (window as any).eval("SECTIONS").find((s: any) => s.qs.includes(q)).tab,
        ]),
    );
    const choose = async (q: any[], i: number) => {
      // The sticky family toolbar can cover the tab strip once scrolled; open the section directly.
      await page.evaluate((tab) => (window as any).goTab(tab), q[3]);
      await page.locator(`#card-${q[0]} .choice[data-i="${i}"]`).click();
    };
    await choose(mcs[0], (mcs[0][1] + 1) % mcs[0][2]);
    await expect(supplies(host)).toHaveText("0");
    await choose(mcs[0], mcs[0][1]);
    await expect(supplies(host)).toHaveText("1");
    await choose(mcs[1], mcs[1][1]);
    await expect(supplies(host)).toHaveText("2");
    await choose(mcs[2], (mcs[2][1] + 1) % mcs[2][2]);
    await choose(mcs[2], (mcs[2][1] + 2) % mcs[2][2]);
    await expect(supplies(host)).toHaveText("2");

    await page.reload();
    await expect(supplies(host)).toHaveText("2");
    await page
      .locator('.fam-btn[data-lang="es"]')
      .first()
      .evaluate((b: HTMLElement) => b.click());
    await expect(host.locator(".xc-title")).toHaveText("Enciende el observatorio");
    await page
      .locator('.fam-btn[data-lang="bilingual"]')
      .first()
      .evaluate((b: HTMLElement) => b.click());
    await expect(host.locator(".xc-title .xc-es")).toHaveText("Enciende el observatorio");
    expect(errors).toEqual([]);
  });

  test("power cells light the observatory, then replay", async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(PATH);
    const ids = await page.evaluate(() => (window as any).eval("ALL_QS").map((q: any) => q.id));
    await seed(page, PATH, {
      "ewl-review-lang": "en",
      "ewl-unit3-test-review-v1": {
        name: "Fam",
        completed: Object.fromEntries(ids.map((id: string) => [id, true])),
        points: Object.fromEntries(ids.map((id: string) => [id, 10])),
        attempts: {},
        work: {},
        plot: {},
        hinted: {},
      },
    });
    const host = page.locator("#review-basecamp");
    await expect(supplies(host)).toHaveText(String(ids.length));
    await checkPhone(page, host, "unit-3-test-review");
    await playCampaignToEnd(host);
    expect(errors).toEqual([]);
  });
});

test.describe("3.4 · Laser Lab and Sonar Hunt", () => {
  const PATH = "/curriculum/3-4-activity/";

  async function fireBeam(page: Page, dx: number, dy: number) {
    await page.locator("#lzDx").fill(String(dx));
    await page.locator("#lzDy").fill(String(dy));
    await page.locator('#lzForm button[type="submit"]').click();
  }

  test("laser sectors fund the Crystal Frontier; unlocked gear changes the game; resume", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await seed(page, PATH, {});
    await page.locator("#tab-laser").click();
    const host = page.locator('#panel-laser section[aria-label="Crystal Frontier expedition"]');
    await expect(host.locator(".xc-title")).toHaveText("Restore the Star Lanes");
    await expect(page.locator("#panel-laser [data-kit]")).toHaveCount(1);

    await fireBeam(page, 1, 1);
    await expect(page.locator("#lzCoach")).toContainText("Miss");
    await expect(supplies(host)).toHaveText("0");
    await page.locator("#lzRetry").click();
    await fireBeam(page, 2, 3);
    await expect(page.locator("#lzCoach")).toContainText("Level clear");
    await expect(supplies(host)).toHaveText("2");
    // The ratio-table log is native work too: a wrong log earns nothing, a correct one the third star.
    const logInputs = page.locator("#lzLog input");
    await logInputs.nth(0).fill("3");
    await logInputs.nth(1).fill("6");
    await logInputs.nth(2).fill("20");
    await page.locator("#lzLog button").click();
    await expect(page.locator("#lzCoach")).toContainText("Not yet");
    await expect(supplies(host)).toHaveText("2");
    await logInputs.nth(2).fill("21");
    await page.locator("#lzLog button").click();
    await expect(page.locator("#lzCoach")).toContainText("Log correct");
    await expect(supplies(host)).toHaveText("2"); // the bonus star is for a first-try log only
    // Replaying a cleared sector cannot farm stars.
    await page.locator("#lzRetry").click();
    await fireBeam(page, 2, 3);
    await expect(page.locator("#lzCoach")).toContainText("Level clear");
    await expect(supplies(host)).toHaveText("2");
    await logInputs.nth(0).fill("3");
    await logInputs.nth(1).fill("6");
    await logInputs.nth(2).fill("21");
    await page.locator("#lzLog button").click();
    await expect(supplies(host)).toHaveText("3");

    await host.locator('[data-xc-option="capacitor"]').click();
    await host.locator("[data-xc-commit]").click();
    await expect(supplies(host)).toHaveText("1");
    await page.locator('#panel-laser [data-kit="capacitor"]').click();
    await expect(page.locator("#lzShots")).toHaveText("4");

    await page.reload();
    await page.locator("#tab-laser").click();
    await expect(page.locator('#panel-laser [data-kit="capacitor"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator("#lzShots")).toHaveText("4");
    await expect(host.locator(".xc-stop--done")).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test("sonar wins fund Abyssal Rescue; rigs unlock; a later expedition costs more", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await seed(page, PATH, {});
    await page.locator("#tab-sonar").click();
    const host = page.locator('#panel-sonar section[aria-label="Abyssal Rescue expedition"]');
    await expect(host.locator(".xc-title")).toHaveText("Bring the Fleet Home");
    const call = async (a: number, b: number) => {
      await page.locator("#snA").fill(String(a));
      await page.locator("#snB").fill(String(b));
      await page.locator("#snCallBtn").click();
    };
    await call(2, 1);
    await expect(page.locator("#snCoach")).toContainText("Not the fleet");
    await expect(supplies(host)).toHaveText("0");
    await call(1, 2);
    await expect(page.locator("#snCoach")).toContainText("Fleet found");
    await expect(supplies(host)).toHaveText("2");
    // The round is over: calling again is impossible, so nothing is awarded twice.
    await expect(page.locator("#snCallBtn")).toBeDisabled();
    await expect(supplies(host)).toHaveText("2");
    // First-try captain's log: +1 star (fleet line 1 : 2, columns x = 1, 2, 13).
    const log = page.locator("#snExtra input");
    await log.nth(0).fill("2");
    await log.nth(1).fill("4");
    await log.nth(2).fill("26");
    await page.locator("#snExtra button").click();
    await expect(page.locator("#snCoach")).toContainText("Captain's log correct");
    await expect(supplies(host)).toHaveText("3");

    await host.locator('[data-xc-option="survey"]').click();
    await host.locator("[data-xc-commit]").click();
    await page.locator('#panel-sonar [data-rig="survey"]').click();
    await expect(page.locator("#snPings")).toHaveText("10");

    await seed(page, PATH, {
      "ewl-3-4-activity-v1": {
        name: "",
        level: 1,
        stars: { sonar: 60 },
        done: {},
        doneIds: {},
        best: {},
      },
    });
    await page.locator("#tab-sonar").click();
    await checkPhone(page, host, "sonar-abyss");
    await playCampaignToEnd(host);
    const firstCost = await host.locator(".xc-option .xc-chip").first().innerText();
    expect(Number(firstCost.replace(/\D/g, ""))).toBeGreaterThan(2);
    expect(errors).toEqual([]);
  });

  test("laser campaign renders cleanly on a phone", async ({ page }) => {
    const errors = watchErrors(page);
    await seed(page, PATH, {
      "ewl-3-4-activity-v1": {
        name: "",
        level: 1,
        stars: { laser: 36 },
        done: {},
        doneIds: {},
        best: { laser: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i, 3])) },
      },
    });
    await page.locator("#tab-laser").click();
    const host = page.locator('#panel-laser section[aria-label="Crystal Frontier expedition"]');
    await expect(supplies(host)).toHaveText("36");
    await checkPhone(page, host, "laser-frontier");
    await playCampaignToEnd(host);
    expect(errors).toEqual([]);
  });
});
