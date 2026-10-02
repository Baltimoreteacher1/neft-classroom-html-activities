import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const catalogs = ['/curriculum/', '/curriculum/units/', '/curriculum/arcade/', '/curriculum/projects/', '/curriculum/learning-labs/', '/curriculum/practice-workbooks/', '/curriculum/manipulatives/', '/curriculum/my-progress/', '/curriculum/family-connections/'];

for (const width of [360, 768, 1366, 1920]) {
  test(`curriculum catalogs reflow, keep navigation, and pass accessibility at ${width}px`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of catalogs) {
      await page.goto(route, { waitUntil: 'networkidle' });
      await expect(page.getByRole('navigation', { name: 'Curriculum navigation', exact: true })).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, route).toBeLessThanOrEqual(1);
      const targets = await page.locator('.ewl-course-nav li a').evaluateAll(links => links.map(link => link.getBoundingClientRect().height));
      expect(targets.every(height => height >= 44), route).toBe(true);
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(audit.violations, route).toEqual([]);
    }
    expect(errors).toEqual([]);
  });
}

test('unit shortcuts follow lesson selection, history, and exact resource URLs', async ({ page }) => {
  await page.goto('/curriculum/units/?u=3&l=3-4#unit-3');
  const unit = page.locator('#unit-3');
  const shortcuts = unit.locator('.units-lesson-actions');
  await expect(shortcuts.getByRole('link', { name: 'Open lesson', exact: true })).toHaveAttribute('href', '/lessons/3-4/?student=1');
  await expect(shortcuts.getByRole('link', { name: 'Practice', exact: true })).toHaveAttribute('href', '/lessons/3-4/worksheet.html?student=1');
  await expect(shortcuts.getByRole('link', { name: 'Homework', exact: true })).toHaveAttribute('href', '/lessons/3-4/homework.html?student=1');
  await unit.getByRole('button', { name: 'Next lesson', exact: true }).click();
  await expect(shortcuts.getByRole('link', { name: 'Open lesson', exact: true })).toHaveAttribute('href', '/lessons/3-5/?student=1');
  await expect(page).toHaveURL(/l=3-5/);
  await page.goBack();
  await expect(shortcuts.getByRole('link', { name: 'Open lesson', exact: true })).toHaveAttribute('href', '/lessons/3-4/?student=1');
  await page.reload();
  await expect(shortcuts.getByRole('link', { name: 'Homework', exact: true })).toHaveAttribute('href', '/lessons/3-4/homework.html?student=1');
  await unit.locator('.lesson-select').selectOption({ label: 'Lesson 3-1 · Understand Ratios 6.AT.1' });
  await expect(unit.getByRole('button', { name: 'Previous lesson', exact: true })).toBeDisabled();
});

test('course overview uses working direct links and keyboard reading controls return focus', async ({ page }) => {
  await page.goto('/curriculum/');
  await expect(page.locator('.course-unit-list > li')).toHaveCount(10);
  const reading = page.getByRole('button', { name: 'Reading supports', exact: true });
  await reading.focus();
  await page.keyboard.press('Enter');
  await expect(reading).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(reading).toBeFocused();
  await expect(reading).toHaveAttribute('aria-expanded', 'false');
  await page.locator('.course-unit-list a[href$="#unit-7"]').click();
  await expect(page.locator('#unit-7')).toBeVisible();
  await expect(page.locator('#unit-3')).toBeHidden();
});

test('course and core lesson links remain useful without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/curriculum/`);
  await expect(page.locator('.course-unit-list > li')).toHaveCount(10);
  await page.locator('.course-unit-list a[href$="#unit-3"]').click();
  await expect(page.locator('details.unit#unit-3')).toBeVisible();
  await expect(page.locator('details.unit#unit-3 a[href="/lessons/3-4/"]')).toHaveCount(1);
  await context.close();
});

test('lesson entry and active lesson keep course navigation and saved state', async ({ page }) => {
  await page.goto('/lessons/3-4/?student=1');
  const navigation = page.getByRole('navigation', { name: 'Curriculum and lesson sequence' });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Back to Unit 3' })).toHaveAttribute('href', '/curriculum/units/?u=3&l=3-4#unit-3');
  await expect(navigation.getByRole('link', { name: /^Next lesson/ })).toHaveAttribute('href', '/lessons/3-5/?student=1');
  await page.locator('#id-name').fill('Design QA');
  await page.locator('#id-start').click();
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(navigation).toBeVisible();
  await expect(page.locator('.lesson-hero-title')).toHaveJSProperty('tagName', 'H1');
  await page.reload();
  await expect(page.locator('.sidebar')).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Back to Unit 3' })).toBeVisible();
});

test('review, notes, and support tools expose accessible controls on phones', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/curriculum/3-4-activity/', '/curriculum/ai-hub/', '/curriculum/almost-right-lab/', '/curriculum/class-boss/', '/curriculum/class-brain/', '/curriculum/division-foundry/', '/curriculum/notes-studio/', '/curriculum/ratio-rate-review-mission/', '/curriculum/unit-rate-market-mission/', '/curriculum/teach-the-machine/', '/lessons/3-4-group1/?sn=Design%20QA&student=1']) {
    await page.goto(route, { waitUntil: 'networkidle' });
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(audit.violations, route).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), route).toBeLessThanOrEqual(1);
  }
  await page.goto('/curriculum/ai-hub/');
  const student = page.getByRole('button', { name: /I am a Student/ });
  await student.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#panel-2')).toBeVisible();
});

test('Practice Arcade keeps its canvas visible and hints support keyboard dismissal', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/math/games/practice-arcade/?lesson=3-4', { waitUntil: 'networkidle' });
  const tools = page.locator('.game-tools-menu');
  await expect(tools).toBeVisible();
  await expect(tools).not.toHaveAttribute('open');
  const phoneLaunch = page.locator('#pa-phone-launch');
  await expect(phoneLaunch).toBeVisible();
  await expect(phoneLaunch.getByRole('heading', { level: 1 })).toContainText('Equivalent Ratios');
  await phoneLaunch.locator('#pa-phone-tier').selectOption('l1');
  await phoneLaunch.locator('#pa-phone-tier').press('Enter');
  await expect(phoneLaunch).toBeVisible();
  const start = phoneLaunch.getByRole('button', { name: 'Start practice', exact: true });
  expect((await start.boundingBox())!.height).toBeGreaterThanOrEqual(48);
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(phoneLaunch).toBeHidden();
  const canvas = page.locator('#pa-stage canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box!.width).toBeGreaterThan(300);
  expect(box!.height).toBeGreaterThan(200);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844 - 76);
  const summary = tools.locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#btn-game-controls')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#btn-game-controls')).toBeHidden();
  const hints = page.getByRole('button', { name: /Need a hint/ });
  await hints.click();
  await expect(page.getByRole('dialog', { name: 'Hints', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close hints' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(hints).toBeFocused();
  await expect(page.getByRole('dialog', { name: 'Hints', exact: true })).toBeHidden();
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(audit.violations).toEqual([]);
});

test('lesson course navigation remains inside LMS and embedded launches', async ({ page }) => {
  for (const query of ['embed=1', 'lms=scorm']) {
    await page.goto(`/lessons/3-4/?${query}`);
    await expect(page.locator('.identity-card')).toBeVisible();
    await expect(page.locator('.lesson-course-nav')).toHaveCount(0);
  }
});

test('family display preferences still work with shared curriculum navigation', async ({ page }) => {
  await page.goto('/curriculum/family-connections/');
  await page.getByText('Display options', { exact: true }).click();
  await page.getByRole('button', { name: 'Larger text', exact: true }).click();
  await expect(page.locator('body')).toHaveCSS('font-size', '20px');
  await page.getByRole('button', { name: 'Contrast', exact: true }).click();
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(17, 17, 17)');
  await page.reload();
  await expect(page.locator('body')).toHaveCSS('font-size', '20px');
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(17, 17, 17)');
});
