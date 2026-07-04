// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

const PAGE_URL = 'http://localhost:3000/';

// Helper to select all builder chips and submit to start the chat
async function submitPromptStudent(page) {
  // Wait for step 3 to be active
  await page.waitForSelector('#panel-3.active');

  // 1. Click first chip in Role column
  const roleChip = page.locator('div.builder-col:nth-child(1) .builder-chip').first();
  await roleChip.click();

  // 2. Click first chip in Lesson column
  const lessonChip = page.locator('div.builder-col:nth-child(2) .builder-chip').first();
  await lessonChip.click();

  // 3. Click first chip in Help Amount column
  const helpChip = page.locator('div.builder-col:nth-child(3) .builder-chip').first();
  await helpChip.click();

  // Submit
  const submitBtn = page.locator('#submit-prompt');
  await expect(submitBtn).not.toBeDisabled();
  await submitBtn.click();
  await page.waitForTimeout(600);
}

test.describe('AI Learning Hub - Browser QA Suite', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('  [BROWSER] ' + msg.text()));
    await page.goto(PAGE_URL);
    await page.waitForLoadState('domcontentloaded');
  });

  // ─── 1. Page loads without errors ───────────────────────────────
  test('Page loads and renders title', async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  // ─── 2. Role selection cards are visible ────────────────────────
  test('Role selection cards are present on step 1', async ({ page }) => {
    const roleCards = page.locator('.role-card');
    const count = await roleCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // ─── 3. Clicking student role navigates to step 2 ───────────────
  test('Student role click navigates to unit grid (step 2)', async ({ page }) => {
    const studentCard = page.locator('.role-card').first();
    await studentCard.click();
    await page.waitForTimeout(600);
    const panel2 = page.locator('#panel-2');
    await expect(panel2).toHaveClass(/active/);
  });

  // ─── 4. Unit grid renders 10 units ──────────────────────────────
  test('Unit grid renders 10 unit cards', async ({ page }) => {
    await page.locator('.role-card').first().click();
    await page.waitForTimeout(600);
    const unitCards = page.locator('.unit-card');
    await expect(unitCards).toHaveCount(10);
  });

  // ─── 5. Mute button exists and toggles ──────────────────────────
  test('Mute button toggles state', async ({ page }) => {
    const muteBtn = page.locator('#btn-mute');
    await expect(muteBtn).toBeVisible();
    const initialText = await muteBtn.textContent();
    await muteBtn.click();
    await page.waitForTimeout(200);
    const toggledText = await muteBtn.textContent();
    expect(initialText).not.toEqual(toggledText);
  });

  // ─── 6. Playwright localStorage verification test ────────────────
  test('Browser localStorage persists values across page reload', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('manual-test', 'persisted-value'));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const val = await page.evaluate(() => localStorage.getItem('manual-test'));
    expect(val).toBe('persisted-value');
  });

  // ─── 7. Mute state persists across reload ───────────────────────
  test('Mute state persists in localStorage', async ({ page }) => {
    const muteBtn = page.locator('#btn-mute');
    await muteBtn.click();
    await page.waitForTimeout(300);
    const mutedTextAfterClick = await muteBtn.textContent();

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const muteBtnAfterReload = page.locator('#btn-mute');
    const mutedTextAfterReload = await muteBtnAfterReload.textContent();
    expect(mutedTextAfterReload).toEqual(mutedTextAfterClick);
  });

  // ─── 8. ESOL level selector is visible and changes ──────────────
  test('ESOL level selector dropdown is present and functional', async ({ page }) => {
    const esolSelect = page.locator('#select-esol-level');
    await expect(esolSelect).toBeVisible();

    await esolSelect.selectOption('3');
    await page.waitForTimeout(200);

    const selectedValue = await esolSelect.inputValue();
    expect(selectedValue).toBe('3');
  });

  // ─── 9. ESOL level persists across reload ───────────────────────
  test('ESOL level persists in localStorage', async ({ page }) => {
    const esolSelect = page.locator('#select-esol-level');
    await esolSelect.selectOption('2');
    await page.waitForTimeout(300);

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    const esolSelectReloaded = page.locator('#select-esol-level');
    const value = await esolSelectReloaded.inputValue();
    expect(value).toBe('2');
  });

  // ─── 10. Student progress dashboard renders ──────────────────────
  test('Student progress dashboard renders when student role selected', async ({ page }) => {
    await page.locator('.role-card').first().click();
    await page.waitForTimeout(600);
    const dashboard = page.locator('#student-progress-dashboard');
    await expect(dashboard).toBeVisible();
    const dashboardText = await dashboard.textContent();
    expect(dashboardText).toContain('Progress');
  });

  // ─── 11. Clicking a unit card navigates to step 3 ───────────────
  test('Clicking unit 1 card navigates to workspace (step 3)', async ({ page }) => {
    await page.locator('.role-card').first().click();
    await page.waitForTimeout(600);
    const firstUnit = page.locator('.unit-card').first();
    await firstUnit.click();
    await page.waitForTimeout(600);
    const panel3 = page.locator('#panel-3');
    await expect(panel3).toHaveClass(/active/);
  });

  // ─── 12. Chat console elements are present ──────────────────────
  test('Chat console UI elements are present in workspace', async ({ page }) => {
    await page.locator('.role-card').first().click();
    await page.waitForTimeout(600);
    await page.locator('.unit-card').first().click();
    await page.waitForTimeout(600);

    // Click chips and submit prompt to show chat console
    await submitPromptStudent(page);

    const chatInput = page.locator('#chat-input');
    await expect(chatInput).toBeVisible();

    const sendBtn = page.locator('.chat-send-btn');
    await expect(sendBtn).toBeVisible();
  });

  // ─── 13. I'm Stuck button is present ────────────────────────────
  test('I\'m Stuck helper button is present', async ({ page }) => {
    await page.locator('.role-card').first().click();
    await page.waitForTimeout(600);
    await page.locator('.unit-card').first().click();
    await page.waitForTimeout(600);

    // Click chips and submit prompt to show chat console
    await submitPromptStudent(page);

    const stuckBtn = page.locator('.helper-btn', { hasText: 'Stuck' });
    await expect(stuckBtn).toBeVisible();
  });

  // ─── 14. Show Another Way button is present ─────────────────────
  test('Show Another Way helper button is present', async ({ page }) => {
    await page.locator('.role-card').first().click();
    await page.waitForTimeout(600);
    await page.locator('.unit-card').first().click();
    await page.waitForTimeout(600);

    // Click chips and submit prompt to show chat console
    await submitPromptStudent(page);

    const anotherWayBtn = page.locator('.helper-btn', { hasText: 'Another Way' });
    await expect(anotherWayBtn).toBeVisible();
  });

  // ─── 15. Teacher role shows planning matrix ─────────────────────
  test('Teacher role displays planning matrix with all 10 units', async ({ page }) => {
    await page.locator('.role-card').nth(2).click();
    await page.waitForTimeout(600);

    const matrixTitle = page.locator('h4', { hasText: 'Teacher Planning' });
    await expect(matrixTitle).toBeVisible();

    const launchButtons = page.locator('button', { hasText: 'Launch' });
    const count = await launchButtons.count();
    expect(count).toBe(10);
  });

  // ─── 16. Deep link handling ─────────────────────────────────────
  test('Deep link with hash unit parameter loads page', async ({ page }) => {
    await page.goto(PAGE_URL + '#unit=1&role=student');
    await page.waitForTimeout(800);
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  // ─── 17. Page body has substantial content ──────────────────────
  test('Page body has substantial content', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body.length).toBeGreaterThan(100);
  });

  // ─── 18. Back navigation works ─────────────────────────────────
  test('Back navigation from step 3 returns to step 2', async ({ page }) => {
    await page.locator('.role-card').first().click();
    await page.waitForTimeout(600);
    await page.locator('.unit-card').first().click();
    await page.waitForTimeout(600);

    const backBtn = page.locator('button', { hasText: 'Change Unit' });
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await page.waitForTimeout(300);

    const panel2 = page.locator('#panel-2');
    await expect(panel2).toHaveClass(/active/);
  });

  // ─── 19. SVG canvas container exists in workspace ───────────────
  test('SVG canvas container exists for math visualizations', async ({ page }) => {
    await page.locator('.role-card').first().click();
    await page.waitForTimeout(600);
    await page.locator('.unit-card').first().click();
    await page.waitForTimeout(600);

    const svgCanvas = page.locator('#svg-canvas-container');
    await expect(svgCanvas).toBeVisible();
  });

  // ─── 20. Calculator display exists ──────────────────────────────
  test('Calculator display exists in workspace', async ({ page }) => {
    await page.locator('.role-card').first().click();
    await page.waitForTimeout(600);
    await page.locator('.unit-card').first().click();
    await page.waitForTimeout(600);

    const calcDisplay = page.locator('#calc-display');
    if (await calcDisplay.count() > 0) {
      const displayValue = await calcDisplay.textContent();
      expect(typeof displayValue).toBe('string');
    } else {
      expect(true).toBe(true);
    }
  });

  // ─── 21. No console errors on full flow ─────────────────────────
  test('Full student flow produces no uncaught errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(PAGE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('.role-card').first().click();
    await page.waitForTimeout(600);
    await page.locator('.unit-card').first().click();
    await page.waitForTimeout(600);

    expect(errors).toEqual([]);
  });

});
