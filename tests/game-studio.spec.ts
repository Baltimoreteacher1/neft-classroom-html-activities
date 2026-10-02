import { test, expect } from '@playwright/test';

test('player preferences and dialog focus persist across games', async ({ page }) => {
  await page.goto('/curriculum/almost-right-lab/equations/mission-1/');
  const nav = page.getByRole('navigation', { name: 'Game player controls' });
  await expect(nav).toBeVisible();
  await nav.getByRole('button', { name: 'Sound off', exact: true }).click();
  await nav.getByRole('button', { name: 'Settings', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Reduce motion and celebrations').check();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(nav.getByRole('button', { name: 'Settings', exact: true })).toBeFocused();
  await page.goto('/curriculum/division-foundry/');
  await expect(page.getByRole('button', { name: 'Sound on', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Calm motion', exact: true })).toBeVisible();
});

for (let mission = 1; mission <= 5; mission++) {
  test(`mission ${mission} lets the player read and explicitly advance feedback`, async ({ page }) => {
    await page.goto(`/curriculum/almost-right-lab/equations/mission-${mission}/`);
    await page.locator('#intro-next-btn').click();
    await page.locator('.diag-btn[data-correct=true]').click();
    await expect(page.locator('#step-diagnose')).toBeVisible();
    await page.locator('.mission-continue').click();
    await expect(page.locator('#explain-input')).toBeVisible();
    await page.locator('#explain-input').fill('Use the inverse operation to balance both sides.');
    await page.locator('#teach-next-btn').click();
    await expect(page.locator('#teach-next-btn')).toBeDisabled();
    await page.locator('.mission-continue:visible').click();
    await page.locator('#main-ans-input').fill('');
    await page.locator('#main-check-btn').click();
    await expect(page.locator('#main-ans-feedback')).toHaveText('Enter a number for x.');
    await page.reload();
    await expect(page.locator('#explain-input')).toHaveValue('Use the inverse operation to balance both sides.');
  });
}

test('Monster Academy pause restores native app interaction', async ({ page }) => {
  await page.goto('/curriculum/monster-math-academy/');
  const tour = page.getByRole('dialog', { name: 'Welcome to Monster Math Academy' });
  if (await tour.isVisible()) await tour.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.locator('#app')).toHaveAttribute('inert', '');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(page.locator('#app')).not.toHaveAttribute('inert', '');
});

for (const saved of ['null', '{broken']) {
  test(`invalid preference data recovers: ${saved}`, async ({ page }) => {
    await page.addInitScript(value => localStorage.setItem('ewl-game-studio-v1', value), saved);
    await page.goto('/curriculum/division-foundry/');
    await expect(page.getByRole('navigation', { name: 'Game player controls' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sound off', exact: true })).toBeVisible();
  });
}

test('Ratio Kitchen awards a completed recipe once and unlocks the next order', async ({ page }) => {
  await page.goto('/math/unit-3/6-rp-1game/');
  await page.locator('#fm-start').click();
  await page.waitForFunction(() => {
    const s = (window as any).__flagshipGame?.scene.getScenes(true)[0];
    return !!s?.round;
  });
  await page.evaluate(() => {
    const s = (window as any).__flagshipGame.scene.getScenes(true)[0];
    const factor = s.round.capacity ? s.round.capacity / (s.round.a + s.round.b) : 1;
    s.counts = [s.round.a * factor, s.round.b * factor];
    s.serve();
    s.serve();
    s.onCorrect();
  });
  await expect.poll(() => page.evaluate(() => {
    const s = (window as any).__flagshipGame.scene.getScenes(true)[0];
    return s.served;
  })).toBe(1);
  await expect(page.locator('.fm-actions button').filter({ hasText: 'Serve recipe' })).toBeDisabled();
  await page.waitForFunction(() => {
    const s = (window as any).__flagshipGame.scene.getScenes(true)[0];
    return s.served === 1 && s.roundIx === 1 && !s.roundLocked;
  });
  await expect(page.locator('.fm-actions button').filter({ hasText: 'Serve recipe' })).toBeEnabled();
});
