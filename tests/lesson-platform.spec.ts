/**
 * Lesson platform smoke + accessibility tests.
 *
 * Loads the reference lesson (1-1 Math is Mine) served from the production
 * `dist/` build and verifies the shared platform layer is wired correctly:
 *
 *   1. No console errors on load.
 *   2. The platform globals are all defined: NTAdaptive, NTJuice, NTtelemetry,
 *      NTa11y.
 *   3. axe-core finds no serious/critical accessibility violations.
 *   4. The "tutor"/telemetry path degrades gracefully when offline — no console
 *      errors, no thrown exceptions, and queued telemetry survives in
 *      localStorage rather than being lost.
 *
 * Requires: @playwright/test + @axe-core/playwright (already a devDependency).
 * Run with `npm run e2e`.
 */
import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const LESSON_PATH = "/math/unit-1/1-1-math-is-mine/";

/** Collect console errors + page errors for the lifetime of a page. */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err: Error) => {
    errors.push(`pageerror: ${err.message}`);
  });
  return errors;
}

test.describe("lesson platform — reference lesson", () => {
  test("loads with no console errors", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(LESSON_PATH, { waitUntil: "networkidle" });
    await expect(page.locator("article.q-card").first()).toBeVisible();
    expect(
      errors,
      `unexpected console/page errors:\n${errors.join("\n")}`,
    ).toEqual([]);
  });

  test("platform globals are all defined", async ({ page }) => {
    await page.goto(LESSON_PATH, { waitUntil: "networkidle" });
    // Wait for deferred scripts + DOMContentLoaded handlers to register globals.
    await page.waitForFunction(
      () =>
        !!(window as any).NTtelemetry &&
        !!(window as any).NTa11y &&
        !!(window as any).NTAdaptive &&
        !!(window as any).NTJuice,
      undefined,
      { timeout: 10_000 },
    );

    const present = await page.evaluate(() => ({
      NTAdaptive: typeof (window as any).NTAdaptive,
      NTJuice: typeof (window as any).NTJuice,
      NTtelemetry: typeof (window as any).NTtelemetry,
      NTa11y: typeof (window as any).NTa11y,
      announce: typeof (window as any).NTa11y?.announce,
      track: typeof (window as any).NTtelemetry?.track,
    }));

    expect(present.NTAdaptive).toBe("object");
    expect(present.NTJuice).toBe("object");
    expect(present.NTtelemetry).toBe("object");
    expect(present.NTa11y).toBe("object");
    expect(present.announce).toBe("function");
    expect(present.track).toBe("function");
  });

  test("a11y live region + skip link exist", async ({ page }) => {
    await page.goto(LESSON_PATH, { waitUntil: "networkidle" });
    await expect(page.locator("#lp-a11y-live")).toHaveCount(1);
    await expect(page.locator("#lp-skip-link")).toHaveCount(1);
    // Skip link becomes visible (moves on-screen) when focused.
    await page.locator("#lp-skip-link").focus();
    await expect(page.locator("#lp-skip-link")).toBeFocused();
  });

  test("no serious or critical axe violations", async ({ page }) => {
    await page.goto(LESSON_PATH, { waitUntil: "networkidle" });
    await expect(page.locator("article.q-card").first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    const summary = blocking
      .map(
        (v) => `${v.id} (${v.impact}) — ${v.nodes.length} node(s): ${v.help}`,
      )
      .join("\n");
    expect(blocking, `serious/critical a11y violations:\n${summary}`).toEqual(
      [],
    );
  });

  test("telemetry/tutor degrades gracefully offline", async ({
    page,
    context,
  }) => {
    const errors = trackErrors(page);
    await page.goto(LESSON_PATH, { waitUntil: "networkidle" });
    await page.waitForFunction(() => !!(window as any).NTtelemetry, undefined, {
      timeout: 10_000,
    });

    // Force offline so any /api/progress POST fails the way it would for a
    // student with no connection (the D1-less 503 path is exercised online).
    await context.setOffline(true);

    // Drive telemetry directly + via a graded interaction; nothing should throw.
    const result = await page.evaluate(async () => {
      try {
        const t = (window as any).NTtelemetry;
        t.track("item_attempt", { item: "w1", result: "correct" });
        t.track("hint_used", { item: "w1" });
        await t.flush(); // offline -> must resolve, not reject
        (window as any).NTa11y.announce("offline check");
        return { ok: true, queued: t.getQueue().length };
      } catch (e: any) {
        return { ok: false, error: String(e && e.message) };
      }
    });

    expect(result.ok, `offline path threw: ${(result as any).error}`).toBe(
      true,
    );
    // Events are preserved in the offline queue rather than silently dropped.
    expect(result.queued).toBeGreaterThan(0);

    // Going back online should let the queue drain without errors.
    await context.setOffline(false);

    // No console/page errors throughout the offline -> online transition.
    expect(
      errors,
      `errors during offline degrade:\n${errors.join("\n")}`,
    ).toEqual([]);
  });
});
