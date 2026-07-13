import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TEST_LESSON_PATH = "/lessons/1-1/";

test.describe("Learning Supports E2E & Accessibility QA", () => {
  // "Prepare Supports" is a teacher-only control. Enable Teacher Mode before every
  // navigation so the config-button tests below see it. Runs before page scripts.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("nt-teacher-mode", "1"));
  });

  test("prepare supports button is hidden for students (no teacher mode)", async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem("nt-teacher-mode"));
    await page.goto(TEST_LESSON_PATH, { waitUntil: "networkidle" });
    await expect(page.locator(".ewl-supports-btn-teacher")).toBeHidden();
  });

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

    // 5. The 6 legacy profile checkboxes remain as a hidden bridge that keeps
    //    Copy-Link / SCORM export working; teachers no longer interact with them.
    const profiles = [
      "read-understand",
      "focus-organize",
      "build-math",
      "express-thinking",
      "language-support",
      "challenge-extend",
    ];
    for (const key of profiles) {
      await expect(page.locator(`#ewl-profile-${key}`)).toBeAttached();
    }

    // 6. The per-student IEP/WIDA assignment surface is the teacher-facing UI.
    const assignRoot = page.locator("#ewl-supports-assign-root");
    await expect(assignRoot).toBeVisible();
    await expect(assignRoot.locator(".ewl-supports-assign-sec", { hasText: "601" })).toBeVisible();

    // 7. Close the (modal) dialog.
    const closeDialogBtn = page.locator(".ewl-supports-dialog-close");
    await closeDialogBtn.click();
    await expect(dialog).toBeHidden();
  });

  test("URL hash activation pre-selects supports", async ({ page }) => {
    // Navigate with hash activation
    await page.goto(`${TEST_LESSON_PATH}#supports=read-understand,focus-organize`, {
      waitUntil: "networkidle",
    });

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

  test("supports dialog and panels have zero serious or critical WCAG violations", async ({
    page,
  }) => {
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
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      blocking,
      `serious/critical WCAG violations found: ${JSON.stringify(blocking, null, 2)}`,
    ).toEqual([]);
  });

  test("multilingual ESOL language selection translates content", async ({ page }) => {
    await page.goto(`${TEST_LESSON_PATH}#supports=language-support`, { waitUntil: "networkidle" });

    // Open dialog — the ESOL home-language selector lives in the assignment surface.
    await page.locator(".ewl-supports-btn-teacher").click();
    await expect(page.locator("#ewl-lang-select")).toBeVisible();

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

  test("ADHD reading ruler overlay activates on click", async ({ page }) => {
    await page.goto(`${TEST_LESSON_PATH}#supports=focus-organize`, { waitUntil: "networkidle" });

    const rulerBtn = page.locator('[data-tool="ruler"]');
    await expect(rulerBtn).toBeVisible();

    const ruler = page.locator("#ewl-supports-ruler");
    await expect(ruler).toBeHidden();

    // Toggle ruler
    await rulerBtn.click();
    await expect(ruler).toBeVisible();
    await expect(rulerBtn).toHaveClass(/is-active/);

    // Toggle off
    await rulerBtn.click();
    await expect(ruler).toBeHidden();
    await expect(rulerBtn).not.toHaveClass(/is-active/);
  });

  test("confidence check-in tab records choices in storage", async ({ page }) => {
    await page.goto(`${TEST_LESSON_PATH}#supports=read-understand`, { waitUntil: "networkidle" });

    const checkinBtn = page.locator('[data-tool="checkin"]');
    await expect(checkinBtn).toBeVisible();
    await checkinBtn.click();

    // Verify check-in tab opens in panel
    const panel = page.locator("[data-ewl-supports-panel]");
    await expect(panel).toBeVisible();
    await expect(panel.locator(".ewl-supports-panel-title")).toContainText("My Learning Check-in");

    // Click "Got it!" selection
    const gotItBtn = page.locator(".ewl-supports-checkin-btn").first();
    await expect(gotItBtn).toContainText("I understand this!");
    await gotItBtn.click();

    // Feedback should display
    const feedback = page.locator(".ewl-supports-checkin-feedback");
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText("Awesome! You are making great progress.");

    // Storage is populated
    const saved = await page.evaluate(() => localStorage.getItem("ewl-supports:v1:feedback"));
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved!).choice).toBe("got-it");
  });

  test("visual comfort spacing toggle applies body class", async ({ page }) => {
    await page.goto(`${TEST_LESSON_PATH}#supports=focus-organize`, { waitUntil: "networkidle" });

    const comfortBtn = page.locator('[data-tool="comfort"]');
    await expect(comfortBtn).toBeVisible();

    // Body should not have class initially
    await expect(page.locator("body")).not.toHaveClass(/ewl-supports-comfort-active/);

    // Toggle comfort spacing mode
    await comfortBtn.click();
    await expect(page.locator("body")).toHaveClass(/ewl-supports-comfort-active/);

    // Toggle off
    await comfortBtn.click();
    await expect(page.locator("body")).not.toHaveClass(/ewl-supports-comfort-active/);
  });

  test("student notepad autosaves notes locally", async ({ page }) => {
    await page.goto(`${TEST_LESSON_PATH}#supports=read-understand`, { waitUntil: "networkidle" });

    const notepadBtn = page.locator('[data-tool="notepad"]');
    await expect(notepadBtn).toBeVisible();
    await notepadBtn.click();

    // Verify Notepad opens
    const panel = page.locator("[data-ewl-supports-panel]");
    await expect(panel).toBeVisible();
    await expect(panel.locator(".ewl-supports-panel-title")).toContainText("My Notes & Scratchpad");

    // Write notes in textarea
    const textarea = page.locator(".ewl-supports-notepad-textarea");
    await expect(textarea).toBeVisible();
    await textarea.fill("Calculations: 36 = 2^2 * 3^2");

    // Retrieve storage value to verify autosave
    const noteKey = "ewl-supports:v1:notes:1-1";
    const notes = await page.evaluate((key) => localStorage.getItem(key), noteKey);
    expect(notes).toBe("Calculations: 36 = 2^2 * 3^2");
  });
});

/* =============================================================================
 * v2 — per-student roster supports (STUDENT path).
 * The static test server has no Pages Functions, so /api/supports is stubbed
 * with page.route — exactly what a production API outage also looks like,
 * which keeps the "never worse than v1" invariant honest.
 * ========================================================================== */
test.describe("Learning Supports v2 — student roster path", () => {
  const SECTIONS = { ok: true, sections: { "601": ["JN", "MR"], "602": ["AS"], "603": [] } };

  // Student mode: explicitly clear teacher mode + any remembered identity.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("nt-teacher-mode");
      localStorage.removeItem("ewl-supports:v2:me");
      localStorage.removeItem("ewl-supports:v1:preferences");
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith("ewl-supports:v2:assigned:")) localStorage.removeItem(k);
      }
    });
  });

  function stubApi(page, forResponse) {
    return Promise.all([
      page.route("**/api/supports/sections", (route) =>
        route.fulfill({ json: SECTIONS, contentType: "application/json" }),
      ),
      page.route("**/api/supports/for**", (route) =>
        route.fulfill({ json: forResponse, contentType: "application/json" }),
      ),
    ]);
  }

  test("self-pick modal → assigned tools appear as a vertical rail with identity chip", async ({
    page,
  }) => {
    await stubApi(page, { ok: true, items: ["calculator", "vocab", "tts"] });
    await page.goto(TEST_LESSON_PATH, { waitUntil: "networkidle" });

    // Modal appears for an unidentified student device.
    const card = page.locator(".ewl-supports-selfpick-card");
    await expect(card).toBeVisible();

    // Pick 601 → JN.
    await card.locator(".ewl-supports-selfpick-sec", { hasText: "601" }).click();
    await card.locator(".ewl-supports-selfpick-ini", { hasText: "JN" }).click();
    await expect(card).toBeHidden();

    // Rail shows exactly the assigned interactive tools (+ listen's rate rider).
    const dock = page.locator("[data-ewl-supports-tools]");
    await expect(dock).toBeVisible();
    await expect(dock.locator('[data-tool="calculator"]')).toBeVisible();
    await expect(dock.locator('[data-tool="words"]')).toBeVisible();
    await expect(dock.locator('[data-tool="listen"]')).toBeVisible();
    await expect(dock.locator('[data-tool="focus"]')).toBeHidden();

    // Identity chip is present and labeled.
    await expect(dock.locator(".ewl-supports-me-chip")).toContainText("JN · 601");

    // Identity persists on the device.
    const me = await page.evaluate(() => localStorage.getItem("ewl-supports:v2:me"));
    expect(JSON.parse(me!).initials).toBe("JN");
  });

  test("passive-only assignment keeps the identity chip reachable", async ({ page }) => {
    await stubApi(page, { ok: true, items: ["text-large", "tint"] });
    await page.addInitScript(() =>
      localStorage.setItem("ewl-supports:v2:me", JSON.stringify({ section: "601", initials: "MR" })),
    );
    await page.goto(TEST_LESSON_PATH, { waitUntil: "networkidle" });

    // Passive supports applied…
    await expect(page.locator("body")).toHaveClass(/ewl-supports-text-lg/);
    // …and the rail stays visible carrying ONLY the switch chip.
    const dock = page.locator("[data-ewl-supports-tools]");
    await expect(dock).toBeVisible();
    await expect(dock.locator(".ewl-supports-me-chip")).toContainText("MR · 601");
    await expect(dock.locator('[data-tool="calculator"]')).toBeHidden();
  });

  test("?supports= QUERY launch (SCORM transport) wins over the roster and shows no modal", async ({
    page,
  }) => {
    // Roster would assign something entirely different — it must be ignored.
    await stubApi(page, { ok: true, items: ["focus", "ruler"] });
    await page.goto(`${TEST_LESSON_PATH}?supports=calculator`, { waitUntil: "networkidle" });

    // No self-pick interruption on a personalized launch.
    await expect(page.locator(".ewl-supports-selfpick-card")).toHaveCount(0);

    // The URL-requested tool is active; the roster's tools are not.
    const dock = page.locator("[data-ewl-supports-tools]");
    await expect(dock.locator('[data-tool="calculator"]')).toBeVisible();
    await expect(dock.locator('[data-tool="focus"]')).toBeHidden();
  });

  test("API failure leaves the v1 baseline untouched (never-worse invariant)", async ({ page }) => {
    await page.route("**/api/supports/**", (route) => route.abort());
    // Device remembers a student AND has legacy v1 prefs granting calculator.
    await page.addInitScript(() => {
      localStorage.setItem("ewl-supports:v2:me", JSON.stringify({ section: "601", initials: "JN" }));
      localStorage.setItem(
        "ewl-supports:v1:preferences",
        JSON.stringify({ profiles: { calculator: true }, language: "en", speechRate: 1 }),
      );
    });
    await page.goto(TEST_LESSON_PATH, { waitUntil: "networkidle" });

    // v1 baseline (calculator via stored prefs) survives the API outage.
    const dock = page.locator("[data-ewl-supports-tools]");
    await expect(dock).toBeVisible();
    await expect(dock.locator('[data-tool="calculator"]')).toBeVisible();
  });

  test("self-pick modal has zero serious/critical WCAG violations", async ({ page }) => {
    await stubApi(page, { ok: true, items: [] });
    await page.goto(TEST_LESSON_PATH, { waitUntil: "networkidle" });
    await expect(page.locator(".ewl-supports-selfpick-card")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include(".ewl-supports-selfpick-backdrop")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      blocking,
      `serious/critical WCAG violations: ${JSON.stringify(blocking, null, 2)}`,
    ).toEqual([]);
  });
});
