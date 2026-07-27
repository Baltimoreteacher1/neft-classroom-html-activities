import { expect, test } from "@playwright/test";

const LESSON_PATH = "/lessons/1-1/?sn=Layout%20Tester";

test.describe("shared lesson shell reflow", () => {
  for (const lessonPath of ["/lessons/1-1/", "/lessons/10-3/"]) {
    test(`bottom Continue buttons advance each shared lesson phase: ${lessonPath}`, async ({
      page,
    }) => {
      await page.goto(`${lessonPath}?sn=Navigation%20Tester`, { waitUntil: "networkidle" });

      await expect(page.locator('[data-bind="hero-phase-name"]')).toHaveText("Warmup");
      await page.getByRole("button", { name: "Continue to Phase 2: Objectives 🎯" }).click();
      await expect(page.locator('[data-bind="hero-phase-name"]')).toHaveText("Objectives");

      await page.getByRole("button", { name: "Continue to Phase 3: Launch 🚀" }).click();
      await expect(page.locator('[data-bind="hero-phase-name"]')).toHaveText("Launch");

      const launchResponses = page.locator(".phase textarea");
      await launchResponses.nth(0).fill("I notice a math pattern in the example.");
      await launchResponses.nth(1).fill("I wonder how the pattern will help me solve it.");
      await page.getByRole("button", { name: "Continue to Vocab →" }).click();
      await expect(page.locator(".extra-panel")).toHaveAttribute("aria-label", "Vocab");
      await page.getByRole("button", { name: "Continue to Learn It →" }).click();
      await expect(page.locator(".extra-panel")).toHaveAttribute("aria-label", "Learn It");
      await page.getByRole("button", { name: "Continue to the Lesson →" }).click();
      await expect(page.locator('[data-bind="hero-phase-name"]')).toHaveText("Explore");
    });
  }

  test("keeps every lesson navigation item visible at 320 CSS pixels", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(LESSON_PATH, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 48));

    const layout = await page.locator(".sidebar").evaluate((sidebar) => {
      const navs = Array.from(
        sidebar.querySelectorAll<HTMLElement>(".prelesson-nav, .phase-nav, .bonus-nav"),
      );
      const buttons = Array.from(sidebar.querySelectorAll<HTMLElement>(".phase-btn"));
      const sidebarRect = sidebar.getBoundingClientRect();
      const intersects = (a: DOMRect, b: DOMRect) =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const floatingChrome = Array.from(
        document.querySelectorAll<HTMLElement>(".minimap-hud, .nt-next-phase-btn"),
      ).filter((element) => getComputedStyle(element).display !== "none");
      const utility = document.querySelector<HTMLElement>(".nt-utility-menu");
      const header = sidebar.querySelector<HTMLElement>(".sidebar-header");

      return {
        navsFit: navs.every((nav) => nav.scrollWidth <= nav.clientWidth + 1),
        buttonsFit: buttons.every((button) => {
          const rect = button.getBoundingClientRect();
          return rect.left >= sidebarRect.left - 1 && rect.right <= sidebarRect.right + 1;
        }),
        floatingChromeClear: floatingChrome.every((element) =>
          buttons.every((button) => !intersects(element.getBoundingClientRect(), button.getBoundingClientRect())),
        ),
        toolsClear:
          !utility ||
          !header ||
          !intersects(utility.getBoundingClientRect(), header.getBoundingClientRect()),
        toolsFollowDocument: !utility || getComputedStyle(utility).position === "absolute",
        pageFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      };
    });

    expect(layout.pageFits, "lesson page should not scroll sideways").toBe(true);
    expect(layout.navsFit, "lesson navigation should reflow instead of scrolling sideways").toBe(
      true,
    );
    expect(layout.buttonsFit, "every lesson navigation item should remain on-screen").toBe(true);
    expect(layout.floatingChromeClear, "floating controls should not cover lesson navigation").toBe(
      true,
    );
    expect(layout.toolsClear, "the tools menu should not cover the lesson heading").toBe(true);
    expect(layout.toolsFollowDocument, "the tools menu should move with the lesson page").toBe(
      true,
    );
  });

  test("centers the lesson column when browser zoom exposes a wide layout viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 2560, height: 900 });
    await page.goto(LESSON_PATH, { waitUntil: "networkidle" });

    const gaps = await page.locator(".app").evaluate((app) => {
      const sidebar = app.querySelector<HTMLElement>(".sidebar");
      const main = app.querySelector<HTMLElement>(".main");
      if (!sidebar || !main) throw new Error("lesson shell is incomplete");

      const appRect = app.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      return {
        left: mainRect.left - sidebarRect.right,
        right: appRect.right - mainRect.right,
      };
    });

    expect(Math.abs(gaps.left - gaps.right), "wide lesson column should stay centered").toBeLessThan(
      2,
    );
  });
});
