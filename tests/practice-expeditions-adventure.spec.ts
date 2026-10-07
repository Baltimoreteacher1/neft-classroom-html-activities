import { test, expect, type Page } from '@playwright/test';

const worlds = ['Tidewater Survey', 'Expedition Meridian', 'The Hundred Lanterns', 'The Architect’s Vault', 'The Clockwork Foundry', 'Polar Station Zero', 'The Balance Keepers', 'Skyline Relay'];

async function firstReviewMission(page: Page, unit: number) {
  await page.goto(`/curriculum/unit-${unit}-adventure-review/`);
  await page.evaluate(() => {
    const r = (window as any).RX;
    r.Game.bootMission(r.ZONES[0].id, r.ZONES[0].missions[0].id);
  });
  await expect(page.locator('.voyage')).toBeVisible();
}

async function solveFirstQuestion(page: Page) {
  const q = await page.evaluate(() => (window as any).RX.Game._debug().q);
  if (q.type === 'num') await page.locator('#q-body input').fill(String(q.answer));
  else if (q.type === 'mc') await page.locator(`#q-body .choice[data-i="${q.answer}"]`).click();
  else if (q.type === 'sort') {
    for (let i = 0; i < q.items.length; i++) {
      await page.locator(`.sort-item[data-i="${i}"]`).click();
      await page.locator(`.sort-bin[data-bin="${q.items[i].bin}"] .sort-title`).click();
    }
  } else if (q.type === 'shade') {
    for (let n = 0; n < Math.floor(q.count / 10); n++) await page.getByRole('button', { name: 'Shade a full row' }).click();
    for (let i = Math.floor(q.count / 10) * 10; i < q.count; i++) await page.locator('.shade-cell').nth(i).click();
  } else if (q.type === 'tf') {
    await page.locator(`.tf-btn[data-v="${q.answer}"]`).click();
    await page.locator(`#q-body .choice[data-i="${q.reasons.findIndex((r: any) => r.correct)}"]`).click();
  } else if (q.type === 'cloze') {
    for (let i = 0; i < q.answers.length; i++) await page.locator('.cloze-sel').nth(i).selectOption(String(q.answers[i]));
  } else throw new Error(`Unexpected first-question widget: ${q.type}`);
  await page.locator('#btn-check').click();
  await expect(page.locator('#q-feedback')).toContainText('Correct');
}

for (let unit = 2; unit <= 9; unit++) {
  test(`Unit ${unit}: travel, recover, resume, solve and advance`, async ({ page }) => {
    await firstReviewMission(page, unit);
    await expect(page.locator('.voyage h2')).toHaveText(worlds[unit - 2]);
    await page.locator('[data-tile="3,0"]').click();
    await page.locator('[data-tile="6,4"]').click();
    await page.locator('[data-tile="7,1"]').click();
    await expect(page.locator('.voyage-inventory')).toContainText('2 finds');
    await expect(page.locator('.voyage-inventory')).toContainText('1 rescues');
    const checkpoint = await page.evaluate(() => JSON.stringify((window as any).RX.State.load().current.voyage));
    await page.reload();
    await page.locator('#btn-continue').click();
    expect(await page.evaluate(() => JSON.stringify((window as any).RX.State.load().current.voyage))).toBe(checkpoint);
    await page.locator('[data-tile="8,2"]').click();
    await page.locator('.voyage-enter').click();
    await solveFirstQuestion(page);
    await page.locator('#btn-next').click();
    await expect(page.locator('.voyage-kicker').first()).toContainText('SECTOR 2');
    expect(await page.evaluate(() => {
      const s = (window as any).RX.State.load();
      return { correct: s.stats.correct, stage: s.current.voyage.stage, seals: s.current.voyage.seals.length };
    })).toEqual({ correct: 1, stage: 1, seals: 1 });
  });
}

test('Polar traversal: keyboard ice slide and grip change actual movement', async ({ page }) => {
  await firstReviewMission(page, 7);
  // A fixed seed selects a board with a clear central ice tile.
  await page.evaluate(() => {
    const r = (window as any).RX;
    r.State.load().current.voyage = (window as any).ExpeditionVoyage.createState(0);
    r.Game.resumeIfNeeded();
  });
  await page.locator('.voyage-grid').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => (window as any).RX.State.load().current.voyage.x)).toBe(3);
  await page.locator('[data-tile="3,1"]').click();
  await page.locator('[data-tile="1,2"]').click();
  await page.locator('.voyage-grid').focus();
  await page.keyboard.press('ArrowRight');
  expect(await page.evaluate(() => (window as any).RX.State.load().current.voyage.x)).toBe(2);
});

test('Placement: diagnostic answers remain single-graded after reload; every station completes', async ({ page }) => {
  await page.goto('/math/games/placement-quest/');
  await page.locator('#pq-start').click();
  await page.locator('[data-tile="3,0"]').click();
  await page.locator('.voyage-focus').click();
  await page.locator('#choices-container [data-option="0"]').click();
  await page.reload();
  await page.locator('#pq-resume').click();
  await expect(page.locator('#q-score')).toHaveText('1');
  await expect(page.locator('#choices-container button').first()).toBeDisabled();
  await page.locator('#quest-next').click();
  for (let i = 1; i < 11; i++) {
    await expect(page.locator('.voyage-kicker').first()).toContainText(`SECTOR ${i + 1} OF 11`);
    await page.locator('.voyage-focus').click();
    await page.locator('#choices-container [data-option="0"]').click();
    await page.locator('#quest-next').click();
  }
  await expect(page.locator('#result-title')).toContainText('Level 2');
  await expect(page.locator('#feedback-text')).toContainText('11 of 11');
  await expect(page.locator('#placement-journal')).toContainText('1 finds recovered');
  expect(await page.evaluate(() => localStorage.getItem('pq-expedition-v1'))).toBeNull();
});

test('Practice Arcade: route checkpoint survives reload and opens the original lesson challenge', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/math/games/practice-arcade/?lesson=3-1');
  await page.locator('#pa-phone-start').click();
  await expect(page.locator('.voyage h2')).toHaveText('Expedition Meridian');
  await page.locator('[data-tile="3,0"]').click();
  await page.reload();
  await page.locator('#practice-resume').click();
  await expect(page.locator('.voyage-inventory')).toContainText('1 finds');
  await page.locator('[data-tile="8,2"]').click();
  await page.locator('.voyage-enter').click();
  await expect(page.locator('#pa-stage')).toBeVisible();
  await expect(page.locator('.practice-native-prompt')).not.toBeEmpty();
  expect(await page.evaluate(() => (window as any).paGame.scene.getScene('Play').idx)).toBe(0);
});

test('Review Atlas uses the same in-mission exploration without changing unit content', async ({ page }) => {
  await page.goto('/curriculum/review-expeditions/#trek');
  await page.locator('#tk-start').click();
  await expect(page.locator('.voyage')).toBeVisible();
  await page.locator('.voyage-focus').click();
  await expect(page.locator('#q-body')).not.toBeEmpty();
});

for (const width of [390, 768, 1366]) {
  test(`Adventure map fits ${width}px and keyboard never escapes its controls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await firstReviewMission(page, 5);
    await page.locator('.voyage-grid').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.voyage-tile[aria-current="location"]')).toHaveAttribute('data-tile', '1,2');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('.voyage-focus').click();
    const input = page.locator('#q-body input').first();
    await input.fill('123');
    await input.press('ArrowLeft');
    await input.press('4');
    await expect(input).toHaveValue('1243');
  });
}
