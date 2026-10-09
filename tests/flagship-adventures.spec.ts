import { test, expect, type Page } from '@playwright/test';

const games = [
  ['kitchen', '/math/unit-2/games/unit2-fraction-kitchen.html', [1, 2]],
  ['foundry', '/math/unit-2/games/unit2-fraction-foundry.html', [2, 4]],
  ['ratio', '/math/unit-3/6-rp-1game/', [4, 6]],
  ['discount', '/math/unit-4/games/unit4-discount-dash.html', [3, 0]],
  ['area', '/math/unit-5/games/unit5-area-architect.html', [3, 2]],
  ['expression', '/math/unit-6/games/unit6-expression-engine.html', [0, 1]],
  ['equation', '/math/unit-8/games/unit7-equation-escape.html', [3, 3, 4]],
  ['variable', '/math/unit-9/games/unit9-variable-velocity.html', [2, 4]],
  ['volume', '/math/unit-10/games/unit10-volume-vault.html', [2, 2, 3]],
  ['stats', '/math/statistics/games/unit8-stats-slam.html', [4, 6]],
] as const;

async function nativeMove(page: Page, id: string, correct: boolean) {
  await page.evaluate(({ id, correct }) => {
    const host = window as any;
    const s = host.__flagshipGame?.scene.getScenes(true).find((scene: any) => ['Game', 'GameScene'].includes(scene.scene.key));
    if (id === 'volume') {
      const state = host.__flagshipState;
      state.l = 1; state.w = 1; state.h = 1;
      if (correct) {
        outer: for (let l = 1; l <= state.maxdim; l++) for (let w = 1; w <= state.maxdim; w++) for (let h = 1; h <= state.maxdim; h++) if (l*w*h === state.cur.target) { state.l=l; state.w=w; state.h=h; break outer; }
      }
      document.getElementById('seal')!.click();
    } else if (id === 'kitchen') {
      s.fill = correct ? s.order.fraction : 0; s.release();
    } else if (id === 'foundry') {
      s.cuts = correct ? s.current.d : 1; s.sel = correct ? s.current.answer : 0; s.forge();
    } else if (id === 'ratio') {
      if (correct) s.counts = s.round.need.slice(); else s.counts = [0, 0]; s.serve();
    } else if (id === 'discount') {
      s.grabCell(s.row, correct ? s.row.data.bestIdxs[0] : s.row.data.cells.findIndex((_: any, i: number) => !s.row.data.bestIdxs.includes(i)));
    } else if (id === 'area') {
      if (correct) s.round.dims = { ...s.round.target }; else s.round.dims[s.round.freeKey] = s.round.target[s.round.freeKey] === 1 ? 2 : 1;
      s.onLock();
    } else if (id === 'variable') {
      s.pick(s.current.choices.findIndex((choice: any) => choice.correct === correct));
    } else {
      const q = s.questions[s.qIndex];
      const boxes = s.answerBoxes || s.answerBtns;
      s.submitAnswer(boxes.findIndex((box: any) => (box.optText === q.correct) === correct));
    }
  }, { id, correct });
}

for (const [id, path, solution] of games) {
  test(`${id}: native success unlocks a unique mission, wrong moves do not, result persists`, async ({ page }) => {
    test.setTimeout(45_000);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(path);
    await expect(page.locator(`.adventure-world[data-world="${id}"]`)).toBeVisible();
    await expect(page.locator('.adventure-enter').first()).toBeDisabled();
    await page.locator('#fm-start').click();
    await page.waitForFunction(() => !!(window as any).__flagshipState?.cur || (window as any).__flagshipGame?.scene.getScenes(true).some((s: any) => s.scene.key === 'Game' || s.scene.key === 'GameScene'));
    await nativeMove(page, id, false);
    expect(await page.evaluate(() => (window as any).FlagshipAdventure.progress.steps)).toBe(0);
    for (let step = 1; step <= 3; step++) {
      // Relaunch is a real player action; adventure progress continues across runs.
      await page.locator('#fm-start').click();
      await nativeMove(page, id, true);
      await expect.poll(() => page.evaluate(() => (window as any).FlagshipAdventure.progress.steps)).toBe(step);
    }
    await page.locator('.adventure-enter').first().click();
    const dialog = page.locator('.adventure-dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('.adventure-enter').click();
    await expect(dialog.locator('.adventure-puzzle-feedback')).toHaveAttribute('data-result', 'retry');
    for (let index = 0; index < solution.length; index++) {
      const input = dialog.locator(`#expedition-input-${index}`);
      if (await input.evaluate(node => node.tagName === 'SELECT')) await input.selectOption(String(solution[index]));
      else await input.fill(String(solution[index]));
    }
    await dialog.locator('.adventure-enter').first().click();
    await expect(dialog.locator('.adventure-puzzle-feedback')).toHaveAttribute('data-result', 'correct');
    expect(await page.evaluate(() => (window as any).FlagshipAdventure.progress.site)).toBe(1);
    await dialog.getByRole('button', { name: 'Continue the adventure', exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await page.reload();
    expect(await page.evaluate(() => (window as any).FlagshipAdventure.progress)).toMatchObject({ site: 1, steps: 0, relics: 1 });
    expect(errors).toEqual([]);
  });

  test(`${id}: mobile expedition and construction controls stay inside viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(id => localStorage.setItem(`ewl.flagship.expedition.v1.${id}`, JSON.stringify({ site:0,steps:3,route:0,chapter:0,relics:0 })), id);
    await page.goto(path);
    await page.locator('.adventure-enter').first().click();
    await expect(page.locator('.adventure-dialog')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('.adventure-dialog').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('.adventure-dialog')).not.toBeVisible();
  });
}

test('volume vault cannot reward repeated sealing of one completed round', async ({ page }) => {
  await page.goto('/math/unit-10/games/unit10-volume-vault.html');
  await page.locator('#fm-start').click();
  await nativeMove(page, 'volume', true);
  await page.evaluate(() => { document.getElementById('seal')!.click(); document.getElementById('seal')!.click(); });
  expect(await page.evaluate(() => ({ sealed: (window as any).__flagshipState.sealed, steps: (window as any).FlagshipAdventure.progress.steps }))).toEqual({sealed:1,steps:1});
});

test('corrupt saved expedition recovers safely and longer routes require four successes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ewl.flagship.expedition.v1.kitchen', '{broken'));
  await page.goto('/math/unit-2/games/unit2-fraction-kitchen.html');
  await page.getByRole('button', { name: 'Banquet trail', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'Fieldwork completed' })).toHaveAttribute('aria-valuemax', '4');
  await page.locator('#fm-start').click();
  await nativeMove(page, 'kitchen', true);
  await expect(page.getByRole('button', { name: 'Picnic trail', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => (window as any).FlagshipAdventure.progress)).toMatchObject({ steps:1,route:1 });
});

test('Chromebook launch scrolls to the fieldwork and fits the native playfield', async ({ page }) => {
  await page.setViewportSize({width:1366,height:768});
  await page.goto('/math/unit-2/games/unit2-fraction-foundry.html');
  await page.locator('#fm-start').click();
  const canvas=page.locator('.flagship-stage');
  await expect.poll(async()=>{const box=await canvas.boundingBox();return !!box && box.y>=0 && box.y+box.height<=768;}).toBe(true);
});
