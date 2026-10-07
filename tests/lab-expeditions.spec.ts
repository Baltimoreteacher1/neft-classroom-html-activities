import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { puzzle, evaluate, controls } from '../curriculum/learning-labs/shared/math.mjs';
import { expeditionWorlds } from '../curriculum/learning-labs/shared/expedition-worlds.mjs';

const labs = readdirSync('curriculum/learning-labs', { withFileTypes: true })
  .filter(d => d.isDirectory() && existsSync(`curriculum/learning-labs/${d.name}/content.json`))
  .map(d => JSON.parse(readFileSync(`curriculum/learning-labs/${d.name}/content.json`, 'utf8')));

for (const lab of labs) {
  test(`${lab.id}: restores three chosen destinations and saves the world`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`/curriculum/learning-labs/${lab.id}/`);
    await page.locator('#tab-games').click();
    await expect(page.locator('.lab-expedition')).toBeVisible();
    const world = expeditionWorlds[lab.id];
    await expect(page.locator('.lab-expedition-banner h3')).toHaveText(world.goal);
    for (const round of [2, 0, 1]) {
      await page.locator(`[data-site="${round}"]`).click();
      const challenge = puzzle(lab.model, round, 1);
      let value = challenge.goal[challenge.free];
      if (lab.model.kind === 'inequality') {
        const f = controls(lab.model)[challenge.free];
        for (let v = f.min; v <= f.max; v += f.step) {
          const values = [...challenge.start]; values[challenge.free] = v;
          if (evaluate(lab.model, values).pass === (round % 2 === 0)) { value = v; break; }
        }
      }
      await page.locator(`#game-${challenge.free}`).fill(String(value));
      await page.locator('[data-check]').click();
      await expect(page.locator('.game-feedback')).toContainText('restored.');
      await page.locator('[data-check]').click();
      await expect(page.locator(`[data-site="${round}"]`)).toBeDisabled();
    }
    await expect(page.locator('.lab-expedition-status')).toContainText('Expedition complete');
    await page.reload();
    await expect(page.locator('.lab-expedition-status')).toContainText('3/3 restored');
    await expect(page.locator('[data-site]:disabled')).toHaveCount(3);
    await page.locator('[data-replay]').click();
    await expect(page.locator('.lab-expedition-status')).toContainText('0/3 restored');
    expect(errors).toEqual([]);
  });
}

test('mobile expedition supports retry, a hint, route choice, and reload mid-mission', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/curriculum/learning-labs/power-plant/');
  await page.locator('#tab-games').click();
  await page.locator('[data-site="1"]').click();
  await page.locator('#game-0').fill('');
  await page.locator('[data-check]').click();
  await expect(page.locator('.game-feedback')).toContainText('highlighted');
  await page.locator('[data-hint]').click();
  await expect(page.locator('.game-feedback')).toContainText('Predict');
  await page.locator('#game-0').fill('2');
  await page.reload();
  await expect(page.locator('#game-0')).toHaveValue('2');
  await expect(page.locator('[data-return]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
