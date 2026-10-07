import { expect, type Page, test } from "@playwright/test";

/**
 * Almost-Right Lab equation missions — expedition layer (adventure.js).
 * Every mission is played through its OWN native UI: diagnose, explain, fix,
 * practice, creature retry, result. Rewards must come only from accepted
 * answers, never twice for the same equation (including across a reload), and
 * the finished expedition must bank the ending the student's builds earned.
 */
const MISSIONS = [
  { n: 1, world: "Canyon Bridge", practice: 3, ending: "Stone Span Builder" },
  { n: 2, world: "Pearl Reef Dive", practice: 3, ending: "Coral Keeper" },
  { n: 3, world: "Gear Works", practice: 3, ending: "Wheel Master" },
  { n: 4, world: "Harbor Fleet", practice: 3, ending: "Sail Captain" },
  { n: 5, world: "Storm Lab", practice: 4, ending: "Shield Maker" },
];

const url = (n: number) => `/curriculum/almost-right-lab/equations/mission-${n}/`;
const state = (page: Page) => page.evaluate(() => (window as any).ARLAdventure.state());

function undoOp(eq: string) {
  if (eq.includes("+")) return "sub";
  if (eq.includes("−")) return "add";
  if (eq.includes("÷")) return "mul";
  return "div";
}

async function open(page: Page, n: number, errors: string[]) {
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(url(n));
  await page.evaluate(() => {
    localStorage.removeItem("arl-adventure-v1");
    localStorage.removeItem("arl_progress");
  });
  await page.reload();
  await expect(page.locator("#adv-world")).toBeVisible();
}

async function diagnose(page: Page, wrongFirst: boolean) {
  await page.locator("#intro-next-btn").click();
  if (wrongFirst) {
    await page.locator('.diag-btn[data-correct="false"]').first().click();
    await expect(page.locator("#diag-feedback")).toHaveClass(/coach/);
  }
  await page.locator('.diag-btn[data-correct="true"]').click();
  await page.locator("#diag-feedback .mission-continue").click();
  await page
    .locator("#explain-input")
    .fill("The mistake is the operation. The inverse operation keeps the equation in balance.");
  await page.locator("#teach-next-btn").click();
  await page.locator("#explain-feedback .mission-continue").click();
}

async function answerMain(page: Page, value: number) {
  await page.locator("#main-ans-input").fill(String(value));
  await page.locator("#main-check-btn").click();
}

async function mainAnswer(page: Page) {
  const eq = (await page.locator("#step-correct .correct-work").textContent())!.trim();
  return page.evaluate((t) => {
    const c = (window as any).ARLCoach;
    return c.solve(c.parse(t));
  }, eq);
}

async function solvePractice(page: Page, count: number, tools: boolean) {
  for (let i = 0; i < count; i++) {
    const item = page.locator(`#practice-${i}`);
    if (tools) {
      const eq = (await item.locator(".practice-eq").textContent())!.trim();
      await item.locator(`.adv-tool[data-op="${undoOp(eq)}"]`).click();
      await expect(item.locator(".adv-tools-fb")).toContainText("Yes.");
    }
    await item.locator(".ans-input").fill((await item.getAttribute("data-answer"))!);
    await item.locator(".check-ans-btn").click();
    await expect(item.locator(".practice-feedback")).toHaveClass(/correct/);
  }
}

for (const m of MISSIONS) {
  test(`Mission ${m.n} (${m.world}): earn, choose, resume, finish, replay`, async ({ page }) => {
    test.setTimeout(60_000);
    const errors: string[] = [];
    await open(page, m.n, errors);
    await expect(page.locator(".adv-title")).toHaveText(m.world);
    expect((await state(page)).pouch).toBe(0);

    // Diagnose: a wrong pick pays nothing; the right pick (after a miss) pays 1.
    await page.locator("#intro-next-btn").click();
    await page.locator('.diag-btn[data-correct="false"]').first().click();
    expect((await state(page)).pouch).toBe(0);
    await page.locator('.diag-btn[data-correct="true"]').click();
    expect((await state(page)).pouch).toBe(1);
    await page.locator("#diag-feedback .mission-continue").click();
    await page
      .locator("#explain-input")
      .fill("The inverse operation keeps the equation in balance.");
    await page.locator("#teach-next-btn").click();
    await page.locator("#explain-feedback .mission-continue").click();

    // Fix: a wrong answer gets coaching feedback and no reward.
    const x = await mainAnswer(page);
    await answerMain(page, x + 1);
    await expect(page.locator("#main-ans-feedback")).not.toBeEmpty();
    await expect(page.locator("#main-ans-feedback")).not.toContainText("Correct");
    expect((await state(page)).pouch).toBe(1);
    await answerMain(page, x);
    await expect(page.locator("#main-ans-feedback")).toContainText("Correct");
    expect((await state(page)).pouch).toBe(2); // +1 correct, no first-try bonus
    await expect(page.locator("#adv-action")).toContainText(`= ${x}`);

    // Not double-collectable: the native button is spent, and the engine
    // refuses the same key even when called directly.
    await page.locator("#main-ans-input").press("Enter");
    const again = await page.evaluate(() => {
      const t = document.querySelector("#step-correct .correct-work")!.textContent!.trim();
      return (window as any).ARLAdventure.award(`main|${t}`, { firstTry: true, eq: t });
    });
    expect(again.paid).toBe(false);
    expect((await state(page)).pouch).toBe(2);

    // Reload: the expedition resumes and already-paid answers stay paid.
    await page.reload();
    await expect(page.locator("#adv-msg")).toContainText("Welcome back");
    const resumed = await state(page);
    expect(resumed.pouch).toBe(2);
    expect(resumed.progress).toBe(2);
    await diagnose(page, false);
    await answerMain(page, x);
    await expect(page.locator("#main-ans-feedback")).toContainText("Correct");
    await expect(page.locator("#adv-msg")).toContainText("Already collected");
    expect((await state(page)).pouch).toBe(2);
    await page.locator("#main-ans-feedback .mission-continue").click();

    // Practice: first tries pay 2 each; the Storm Lab pays +1 for the right undo tool.
    const per = m.n === 5 ? 3 : 2;
    await solvePractice(page, m.practice, m.n === 5);
    const afterPractice = await state(page);
    expect(afterPractice.pouch).toBe(2 + per * m.practice);
    expect(afterPractice.progress).toBe(2 + m.practice);

    // Choose: build the first track to level 3 (costs 1 + 2 + 3).
    const firstBuild = page.locator('.adv-build-btn[data-track="0"]');
    for (let i = 0; i < 3; i++) await firstBuild.click();
    const built = await state(page);
    expect(built.tracks).toEqual([3, 0, 0]);
    expect(built.pouch).toBe(2 + per * m.practice - 6);
    await expect(page.locator('.adv-build.on[data-t="0"]')).toHaveCount(3);
    await expect(firstBuild).toBeDisabled();

    // Finish through the native retry step.
    await page.locator("#practice-next-btn").click();
    await expect(page.locator("#retry-complete-btn")).toBeVisible({ timeout: 10_000 });
    await page.locator("#retry-complete-btn").click();
    await expect(page.locator("#adv-result")).toContainText(m.ending);
    await expect(page.locator("#adv-result")).toContainText("New trophy");
    const done = await state(page);
    expect(done.finished).toBe(true);
    expect(done.trophies).toHaveLength(1);
    await expect(page.locator(".adv-trophy.has")).toHaveCount(1);
    await expect(page.locator('.adv-build-btn[data-track="1"]')).toBeDisabled();

    // Replay: new numbers start a new expedition and pay again.
    await page.locator("#practice-again-btn").click();
    const freshEq = (await page.locator("#practice-0 .practice-eq").textContent())!.trim();
    // freshLike() can rarely repeat an equation solved earlier; that one must not pay.
    const repeat = done.ledger.includes(`practice|${freshEq}`);
    await solvePractice(page, 1, m.n === 5);
    const replay = await state(page);
    expect(replay.pouch).toBe(done.pouch + (repeat ? 0 : per));
    if (!repeat) {
      expect(replay.finished).toBe(false);
      expect(replay.tracks).toEqual([0, 0, 0]);
    }

    expect(errors).toEqual([]);
  });
}

for (const n of [1, 4, 5]) {
  test(`Mission ${n} fits a 390px phone`, async ({ page }) => {
    const errors: string[] = [];
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, n, errors);
    const overflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);
    await diagnose(page, true);
    await answerMain(page, await mainAnswer(page));
    await page.locator("#main-ans-feedback .mission-continue").click();
    await solvePractice(page, 1, n === 5);
    await expect(page.locator("#adv-action")).toBeVisible();
    expect(await overflow()).toBeLessThanOrEqual(0);
    if (process.env.ARL_SHOTS) {
      await page
        .locator("#adv-world")
        .screenshot({ path: `${process.env.ARL_SHOTS}/m${n}-390-world.png` });
      await page.screenshot({ path: `${process.env.ARL_SHOTS}/m${n}-390.png`, fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test("Calm motion: no running animations in the expedition panel", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  await open(page, 3, errors);
  const running = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => (a.effect as KeyframeEffect)?.target?.closest?.(".adv")).length,
  );
  expect(running).toBe(0);
  expect(errors).toEqual([]);
});
