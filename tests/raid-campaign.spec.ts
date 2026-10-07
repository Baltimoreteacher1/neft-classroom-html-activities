import { test, expect } from '@playwright/test';
import { buildQuestion, hashSeed } from '../curriculum/class-boss/questions.js';

test('correct native answers charge a chosen ward; misses cannot earn or spend charges', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('nt_boss.device', 'campaign-browser-fixture'));
  await page.route('**/api/class-pulse?*', route => route.fulfill({ json: { ok: true, suppressed: true, tags: [] } }));
  await page.route('**/api/class-boss**', route => route.fulfill({ json: { ok: true, offline: true } }));
  await page.goto('/curriculum/class-boss/');
  await expect(page.locator('.raid-campaign')).toBeVisible();
  await expect(page.locator('#bossArt svg')).toBeVisible();
  await page.locator('[data-ward="0"]').click();
  const tag = await page.locator('#raidFocus').inputValue();
  const week = await page.evaluate(() => Object.keys(localStorage).find(k => k.startsWith('ewl.raid-campaign.v1.'))?.replace('ewl.raid-campaign.v1.', ''));
  for (let attempt = 0; attempt < 3; attempt++) {
    const q = buildQuestion(tag, attempt, `${week}|${hashSeed('campaign-browser-fixture') % 100000}|${attempt}`);
    await expect(page.locator('#questionText')).toHaveText(q.prompt.en);
    if (attempt === 0) {
      const wrong = q.choices.find(value => String(value) !== String(q.correct));
      await page.locator('.choice').filter({ has: page.locator(`span:text-is("${String(wrong).replace(/^-/, '−')}")`) }).click();
      await expect(page.locator('[data-ward="0"]')).toContainText('0/3');
      await expect(page.locator('[data-restore="0"]')).toBeDisabled();
    }
    await page.locator(`.choice[data-value=${JSON.stringify(String(q.correct))}]`).click();
    await expect(page.locator('[data-ward="0"]')).toContainText(`${attempt + 1}/3`);
    if (attempt < 2) await page.locator('#nextBtn').click();
  }
  await page.locator('[data-restore="0"]').click();
  await expect(page.locator('[data-ward="0"]')).toContainText('restored');
  await expect(page.locator('[data-restore="0"]')).toBeDisabled();
  await page.reload();
  await expect(page.locator('[data-ward="0"]')).toContainText('restored');
  await page.locator('#langBtn').click();
  await expect(page.locator('.raid-campaign h2')).toHaveText('Ciudadela de los tres sellos');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});

test('arcade world artwork loads and skill filtering preserves accessible links', async ({ page }) => {
  await page.goto('/curriculum/arcade/');
  await expect(page.locator('.adventure-hero h1')).toHaveText('Arcade Games');
  await expect.poll(() => page.locator('.adventure-hero img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.locator('#arcade-find').fill('decimal');
  const card = page.locator('.card[href="/math/games/u1-decimal-dash/"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Cloudline Courier');
  await expect.poll(() => card.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
