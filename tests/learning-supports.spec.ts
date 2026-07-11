import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TEST_LESSON_PATH = "/lessons/1-1/";

test.describe("Learning Supports E2E & Accessibility QA", () => {
  test("learning supports teacher panel trigger and dialog are functional", async ({ page }) => {
    // 1. Navigate to canonical lesson
    await page.goto(TEST_LESSON_PATH, { waitUntil: "networkidle" });

    // 2. Teacher button is present and says "Prepare Supports"
    const teacherBtn = page.locator(".ewl-supports-btn-teacher");
    await expect(teacherBtn).toBeVisible();
    await expect(teacherBtn).toContainText("Prepare Supports");

    // 3. Dialog is hidden by default
    const dialog = page.locator("#ewl-supports-dialog");
    await expect(dialog).toBeHidden();

    // 4. Click teacher button opens the dialog
    await teacherBtn.click();
    await expect(dialog).toBeVisible();

    // 5. Verify the 6 profile checkboxes are present
    const profiles = [
      "read-understand",
      "focus-organize",
      "build-math",
      "express-thinking",
      "language-support",
      "challenge-extend"
    ];
    for (const key of profiles) {
      await expect(page.locator(`#ewl-profile-${key}`)).toBeAttached();
    }

    // 6. Check a profile (e.g. Read & Understand) and verify student tools show up
    const readUnderstandCb = page.locator("#ewl-profile-read-understand");
    await readUnderstandCb.check();

    const toolsDock = page.locator("[data-ewl-supports-tools]");
    await expect(toolsDock).toBeVisible();

    // Check vocabulary/Words is visible
    const wordsBtn = page.locator('[data-tool="words"]');
    await expect(wordsBtn).toBeVisible();
    await wordsBtn.click();

    // Verify slide-out panel opens
    const contentPanel = page.locator("[data-ewl-supports-panel]");
    await expect(contentPanel).toBeVisible();
    await expect(contentPanel.locator(".ewl-supports-panel-title")).toContainText("Vocabulary Helper");

    // Close dialog
    const closeDialogBtn = page.locator(".ewl-supports-dialog-close");
    await closeDialogBtn.click();
    await expect(dialog).toBeHidden();
  });

  test("URL hash activation pre-selects supports", async ({ page }) => {
    // Navigate with hash activation
    await page.goto(`${TEST_LESSON_PATH}#supports=read-understand,focus-organize`, { waitUntil: "networkidle" });

    // Student tools dock should be visible instantly
    const toolsDock = page.locator("[data-ewl-supports-tools]");
    await expect(toolsDock).toBeVisible();

    // Verify correct profiles are checked in the dialog
    const teacherBtn = page.locator(".ewl-supports-btn-teacher");
    await teacherBtn.click();
    await expect(page.locator("#ewl-profile-read-understand")).toBeChecked();
    await expect(page.locator("#ewl-profile-focus-organize")).toBeChecked();
    await expect(page.locator("#ewl-profile-build-math")).not.toBeChecked();
  });

  test("focus mode applies body class and is reversible", async ({ page }) => {
    await page.goto(`${TEST_LESSON_PATH}#supports=focus-organize`, { waitUntil: "networkidle" });

    const focusBtn = page.locator('[data-tool="focus"]');
    await expect(focusBtn).toBeVisible();

    // Body should not have class initially
    await expect(page.locator("body")).not.toHaveClass(/ewl-supports-focus-active/);

    // Toggle focus mode
    await focusBtn.click();
    await expect(page.locator("body")).toHaveClass(/ewl-supports-focus-active/);

    // Toggle off
    await focusBtn.click();
    await expect(page.locator("body")).not.toHaveClass(/ewl-supports-focus-active/);
  });

  test("supports dialog and panels have zero serious or critical WCAG violations", async ({ page }) => {
    await page.goto(TEST_LESSON_PATH, { waitUntil: "networkidle" });

    // Open dialog to expose its DOM elements
    const teacherBtn = page.locator(".ewl-supports-btn-teacher");
    await teacherBtn.click();
    await expect(page.locator("#ewl-supports-dialog")).toBeVisible();

    // Run axe on the learning supports root
    const results = await new AxeBuilder({ page })
      .include(".ewl-supports-root")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(blocking, `serious/critical WCAG violations found: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
  });

  test("multilingual ESOL language selection translates content", async ({ page }) => {
    await page.goto(`${TEST_LESSON_PATH}#supports=language-support`, { waitUntil: "networkidle" });

    // Open dialog
    await page.locator(".ewl-supports-btn-teacher").click();
    await expect(page.locator("#ewl-lang-select-container")).toBeVisible();

    // Select Spanish
    await page.locator("#ewl-lang-select").selectOption("es");

    // Close dialog
    await page.locator(".ewl-supports-dialog-close").click();

    // Open Words panel and verify Spanish vocabulary text is shown
    await page.locator('[data-tool="words"]').click();
    await expect(page.locator(".ewl-supports-vocab-term").first()).toContainText("Número primo");
  });

  test("synthesis playback rate cycles on dock click", async ({ page }) => {
    await page.goto(`${TEST_LESSON_PATH}#supports=read-understand`, { waitUntil: "networkidle" });

    const rateBtn = page.locator('[data-tool="rate"]');
    await expect(rateBtn).toBeVisible();
    await expect(rateBtn).toContainText("1x");

    // Cycle rate: 1.0 -> 1.25 -> 1.5 -> 0.8 -> 1.0
    await rateBtn.click();
    await expect(rateBtn).toContainText("1.25x");

    await rateBtn.click();
    await expect(rateBtn).toContainText("1.5x");

    await rateBtn.click();
    await expect(rateBtn).toContainText("0.8x");

    await rateBtn.click();
    await expect(rateBtn).toContainText("1x");
  });
});
