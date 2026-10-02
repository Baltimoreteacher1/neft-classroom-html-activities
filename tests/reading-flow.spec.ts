import { expect, test } from "@playwright/test";

async function enter(page, slug) {
  await page.goto(`/lessons/${slug}/?sn=Reading%20Test`, { waitUntil: "networkidle" });
  const start = page.locator(".flagship-mission-start");
  if (await start.count()) await start.click();
  await expect(page.locator(".reading-guide").first()).toBeVisible();
}

test("warm-up keeps answers while paging, restores position, and reviews all feedback", async ({ page }) => {
  await enter(page, "3-2");
  const questions = page.locator(".warmup-questions-list > [data-reading-card]");
  const total = await questions.count();
  expect(total).toBeGreaterThan(1);
  await questions.first().locator('input[type="radio"]').first().check();
  await page.getByRole("button", { name: "Next question →", exact: true }).click();
  await expect(questions.first()).toBeHidden();
  await expect(questions.nth(1)).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  const start = page.locator(".flagship-mission-start");
  if (await start.count()) await start.click();
  await expect(questions.nth(1)).toBeVisible();
  await page.getByRole("button", { name: "Show all", exact: true }).click();
  await expect(questions.first().locator('input[type="radio"]').first()).toBeChecked();
  for (let i = 1; i < total; i++) await questions.nth(i).locator('input[type="radio"]').first().check();
  await page.getByRole("button", { name: "One at a time", exact: true }).click();
  await page.getByRole("button", { name: /Submit Warmup Answers/ }).click();
  for (let i = 0; i < total; i++) await expect(questions.nth(i)).toBeVisible();
});

for (const slug of ["1-1-group1", "3-2-group2", "3-2-group1"]) {
  test(`${slug}: one forward destination, vocabulary review, print, and all steps reachable`, async ({ page }) => {
    await enter(page, slug);
    const panel = page.locator('.sg-tabpanel:not([hidden])');
    await expect(panel.locator('.sg-next')).toBeHidden();
    await panel.getByRole("button", { name: /Next:.*Key Words/ }).click();
    const cards = page.locator(".sg-vcard");
    expect(await cards.count()).toBeGreaterThan(1);
    await expect(cards.first()).toBeVisible();
    await expect(cards.nth(1)).toBeHidden();
    await page.getByRole("button", { name: "Next word →", exact: true }).click();
    await expect(cards.first()).toBeHidden();
    await expect(cards.nth(1)).toBeVisible();
    await page.getByRole("button", { name: "Show all", exact: true }).click();
    for (const card of await cards.all()) await expect(card).toBeVisible();
    await page.getByRole("button", { name: "One at a time", exact: true }).click();
    await page.emulateMedia({ media: "print" });
    for (const card of await cards.all()) await expect(card).toBeVisible();
    await page.emulateMedia({ media: "screen" });
    await expect(cards.first()).toBeHidden();
    // Keyboard disclosure; each outline button selects its original panel.
    const summary = panel.locator('.reading-outline > summary');
    await summary.focus();
    await page.keyboard.press("Enter");
    const chips = panel.locator('.sg-substep-chip');
    await chips.last().click();
    await expect(panel.locator('.sg-next')).toBeVisible();
    await expect(panel.locator('.reading-outline')).not.toHaveAttribute('open', '');
  });
}

for (const width of [320, 768, 1024, 1280]) {
  for (const slug of ["3-2", "3-2-group1"]) {
    test(`${slug} fits ${width}px and exposes the current task`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await enter(page, slug);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (width >= 1024) {
        const task = page.locator(slug.includes("group") ? '.sg-pulse-btn' : '.warmup-questions-list input').first();
        const box = await task.boundingBox();
        expect(box?.y).toBeLessThan(780);
      }
    });
  }
}

test("an old small-group numeric bookmark still opens the same activity", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("nt-sg:3-2-group1", JSON.stringify({
      lastTab: "sg-tab-learn", "substep-sg-tab-learn": 1,
    }));
  });
  await enter(page, "3-2-group1");
  await expect(page.locator('.sg-tabpanel:not([hidden]) .reading-current')).toContainText("Build the Idea");
});
