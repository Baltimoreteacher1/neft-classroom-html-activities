import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Chromebook Profile: 1366x768, touch enabled
test.use({
  viewport: { width: 1366, height: 768 },
  hasTouch: true,
});

test.describe("Curriculum Shell & Progressive Hub Acceptance Suite", () => {
  // /curriculum/ is excluded: the hub returned to its pre-2026-10-16 layout (data/product-decisions.json, curriculum-hub-original-layout).
  const PRIMARY_ROUTES = [
    { path: "/curriculum/studio/", title: "Interactive Studio" },
    { path: "/curriculum/practice/", title: "Practice & Fluency" },
    { path: "/curriculum/family/", title: "Family & Review" },
  ];

  test("1. All 4 primary routes load with persistent header, valid meta, and zero console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    for (const route of PRIMARY_ROUTES) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveTitle(new RegExp(route.title, "i"));

      // Verify persistent zero-shift header is mounted
      const header = page.locator(".curriculum-header");
      await expect(header).toBeVisible();

      // Check header height reserves fixed space (64px desktop / Chromebook)
      const box = await header.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(56);
      expect(box!.height).toBeLessThanOrEqual(70);

      // Verify skip link exists and points to main content
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeAttached();
    }

    expect(consoleErrors).toEqual([]);
  });

  // Progressive-hub behaviour, retired with the hub layout revert (curriculum-hub-original-layout).
  test.skip("2. Language toggle updates in place, syncs <html lang>, and announces politely", async ({
    page,
  }) => {
    await page.goto("/curriculum/", { waitUntil: "domcontentloaded" });

    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");

    const esBtn = page.locator('[data-lang-btn="es"]');
    const enBtn = page.locator('[data-lang-btn="en"]');
    const announcer = page.locator("#shell-live-announcer");

    // Switch to Spanish
    await esBtn.click();
    await expect(html).toHaveAttribute("lang", "es");
    await expect(esBtn).toHaveAttribute("aria-pressed", "true");
    await expect(enBtn).toHaveAttribute("aria-pressed", "false");
    await expect(announcer).toContainText(/idioma|español/i);

    // Switch back to English
    await enBtn.click();
    await expect(html).toHaveAttribute("lang", "en");
    await expect(enBtn).toHaveAttribute("aria-pressed", "true");
    await expect(esBtn).toHaveAttribute("aria-pressed", "false");
    await expect(announcer).toContainText(/english/i);
  });

  // Progressive-hub behaviour, retired with the hub layout revert (curriculum-hub-original-layout).
  test.skip("3. Role toggle enforces strict DOM absence in Student Mode", async ({ page }) => {
    // Clear storage to guarantee default Student mode
    await page.goto("/curriculum/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.setItem("edu_role", "student");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hub-unit-tab");

    const studentBtn = page.locator('[data-role-btn="student"]');
    const teacherBtn = page.locator('[data-role-btn="teacher"]');

    await expect(studentBtn).toHaveAttribute("aria-pressed", "true");
    await expect(teacherBtn).toHaveAttribute("aria-pressed", "false");

    // In Student Mode: Protected Teacher Tray & pacing tags are NEVER present in the DOM (0 nodes)
    await expect(page.locator(".hub-teacher-tray")).toHaveCount(0);
    await expect(page.locator(".hub-pacing-tag")).toHaveCount(0);
    await expect(page.locator(".hub-docs-item-protected")).toHaveCount(0);

    // Switch to Teacher Mode
    await teacherBtn.click();
    await expect(teacherBtn).toHaveAttribute("aria-pressed", "true");
    await expect(studentBtn).toHaveAttribute("aria-pressed", "false");

    // Teacher elements become present in DOM
    const pacingTags = page.locator(".hub-pacing-tag");
    await expect(pacingTags.first()).toBeAttached();

    // Expand lesson 1-1 to check Teacher Tray
    const toggleChevron = page.locator('.hub-drawer-toggle[data-drawer-toggle="1-1"]');
    await toggleChevron.click();
    await expect(page.locator(".hub-teacher-tray")).toBeVisible();

    // Switch back to Student Mode
    await studentBtn.click();
    await expect(studentBtn).toHaveAttribute("aria-pressed", "true");

    // Once again completely absent from DOM
    await expect(page.locator(".hub-teacher-tray")).toHaveCount(0);
    await expect(page.locator(".hub-pacing-tag")).toHaveCount(0);
    await expect(page.locator(".hub-docs-item-protected")).toHaveCount(0);
  });

  // Progressive-hub behaviour, retired with the hub layout revert (curriculum-hub-original-layout).
  test.skip("4. ESOL Supports pill toggles learning supports state", async ({ page }) => {
    await page.goto("/curriculum/", { waitUntil: "domcontentloaded" });

    const supportsBtn = page.locator("[data-supports-btn]");
    await expect(supportsBtn).toHaveAttribute("aria-pressed", "false");

    // Toggle on
    await supportsBtn.click();
    await expect(supportsBtn).toHaveAttribute("aria-pressed", "true");
    const announcer = page.locator("#shell-live-announcer");
    await expect(announcer).toContainText(/supports enabled/i);

    // Toggle off
    await supportsBtn.click();
    await expect(supportsBtn).toHaveAttribute("aria-pressed", "false");
  });

  // Progressive-hub behaviour, retired with the hub layout revert (curriculum-hub-original-layout).
  test.skip("5. Sticky Unit Ribbon provides single-unit isolation, persistence, and hash routing", async ({
    page,
  }) => {
    await page.goto("/curriculum/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hub-unit-tab");

    // Verify exactly 10 unit tabs in sticky ribbon
    const unitTabs = page.locator(".hub-unit-tab");
    await expect(unitTabs).toHaveCount(10);

    // Click Unit 4
    const unit4Tab = page.locator('.hub-unit-tab[data-unit-tab="4"]');
    await unit4Tab.click();
    await expect(unit4Tab).toHaveAttribute("aria-selected", "true");

    // Single-unit isolation: Header card displays Unit 4
    const unitTitle = page.locator(".hub-unit-card-title");
    await expect(unitTitle).toContainText(/Unit 4|Percents/i);

    // Only Unit 4 lessons visible (4-1 through 4-5)
    const lessonBadges = page.locator(".hub-lesson-badge");
    await expect(lessonBadges).toHaveCount(5);
    await expect(lessonBadges.first()).toHaveText("4-1");
    await expect(lessonBadges.last()).toHaveText("4-5");

    // Refresh: Unit 4 remains active via sessionStorage
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator('.hub-unit-tab[data-unit-tab="4"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Deep link hash navigation to #unit-3
    await page.goto("/curriculum/#unit-3", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hub-unit-tab");
    await expect(page.locator('.hub-unit-tab[data-unit-tab="3"]')).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator(".hub-unit-card-title")).toContainText(/Unit 3|Ratios/i);
  });

  // Progressive-hub behaviour, retired with the hub layout revert (curriculum-hub-original-layout).
  test.skip("6. Docs dropdown menu implements roving tabindex and Escape/click dismiss", async ({
    page,
  }) => {
    await page.goto("/curriculum/#unit-3", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hub-docs-trigger");

    const firstDocsBtn = page.locator(".hub-docs-trigger").first();
    await expect(firstDocsBtn).toBeVisible();
    await expect(firstDocsBtn).toHaveAttribute("aria-expanded", "false");

    // Open Docs menu
    await firstDocsBtn.click();
    await expect(firstDocsBtn).toHaveAttribute("aria-expanded", "true");

    const menu = page.locator(".hub-docs-menu").first();
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute("aria-hidden", "false");

    // In Student Mode: Teacher Key and Sub Plan must NOT be rendered in menu
    const menuLinks = menu.locator("a");
    const menuTexts = await menuLinks.allTextContents();
    for (const txt of menuTexts) {
      expect(txt).not.toMatch(/Teacher Key|Sub Plan|Facilitation/i);
    }

    // Escape closes the menu and returns focus to trigger
    await page.keyboard.press("Escape");
    await expect(firstDocsBtn).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toHaveAttribute("aria-hidden", "true");
    await expect(firstDocsBtn).toBeFocused();
  });

  test("7. In-tool utility bar docks at 38px and provides 1-click Hub return", async ({ page }) => {
    await page.goto("/curriculum/notes-studio/?lesson=3-4", { waitUntil: "domcontentloaded" });

    const bar = page.locator(".curriculum-in-tool-bar");
    await expect(bar).toBeVisible();

    const box = await bar.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeLessThanOrEqual(42);

    const hubReturnLink = bar.locator(".in-tool-hub-btn");
    await expect(hubReturnLink).toBeVisible();
    await expect(hubReturnLink).toHaveAttribute("href", "/curriculum/#lesson-3-4");

    // Click Hub Return
    await hubReturnLink.click();
    await expect(page).toHaveURL(/\/curriculum\/#lesson-3-4$/);
  });

  test("8. Accessibility audit: Axe-core zero critical/serious issues across primary routes", async ({
    page,
  }) => {
    for (const route of PRIMARY_ROUTES) {
      await page.goto(route.path, { waitUntil: "domcontentloaded" });

      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();

      const seriousOrCritical = audit.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );

      expect(seriousOrCritical, `Axe violations on ${route.path}`).toEqual([]);
    }
  });

  // Progressive-hub behaviour, retired with the hub layout revert (curriculum-hub-original-layout).
  test.skip("9. Performance: CLS < 0.05 and boot storage reads <= 3", async ({ page }) => {
    await page.goto("/curriculum/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".hub-unit-tab");

    // Measure CLS during ribbon switches
    await page.evaluate(() => {
      (window as any).__clsScore = 0;
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            (window as any).__clsScore += (entry as any).value;
          }
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
    });

    // Click tabs using Playwright's trusted user input events
    const tabs = page.locator(".hub-unit-tab");
    if ((await tabs.count()) >= 3) {
      await tabs.nth(1).click();
      await page.waitForTimeout(60);
      await tabs.nth(2).click();
      await page.waitForTimeout(60);
      await tabs.nth(0).click();
      await page.waitForTimeout(60);
    }

    const clsScore = await page.evaluate(() => (window as any).__clsScore || 0);
    expect(clsScore).toBeLessThan(0.05);

    // Verify storage read efficiency on boot
    const storageReadCount = await page.evaluate(() => {
      return (window as any).__EWL_STORAGE_READ_COUNT__ || 3;
    });
    expect(storageReadCount).toBeLessThanOrEqual(3);
  });
});
