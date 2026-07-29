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
    expect(errors, `unexpected console/page errors:\n${errors.join("\n")}`).toEqual([]);
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
      .map((v) => `${v.id} (${v.impact}) — ${v.nodes.length} node(s): ${v.help}`)
      .join("\n");
    expect(blocking, `serious/critical a11y violations:\n${summary}`).toEqual([]);
  });

  test("telemetry/tutor degrades gracefully offline", async ({ page, context }) => {
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

    expect(result.ok, `offline path threw: ${(result as any).error}`).toBe(true);
    // Events are preserved in the offline queue rather than silently dropped.
    expect(result.queued).toBeGreaterThan(0);

    // Going back online should let the queue drain without errors.
    await context.setOffline(false);

    // No console/page errors throughout the offline -> online transition.
    expect(errors, `errors during offline degrade:\n${errors.join("\n")}`).toEqual([]);
  });
});

test.describe("lesson engine launcher — award layer", () => {
  test("practice serves leveled tier voice, bilingual praise, and milestone confetti", async ({
    page,
    request,
  }) => {
    // The launcher bundles its config, but the same file ships in dist —
    // use it as the answer key so the test never hardcodes content.
    const config = await (await request.get("/lessons/1-1/config.json")).json();
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const mcByStem = new Map<string, string>(
      ["approaching", "onLevel", "extending"]
        .flatMap((tier) => config.practice?.[tier] || [])
        .filter(
          (p: any) =>
            p.type === "multiple-choice" &&
            Array.isArray(p.choices) &&
            Number.isInteger(p.correctIndex),
        )
        .map((p: any) => [
          String(p.stem || p.title || "").trim(),
          String(p.choices[p.correctIndex]),
        ]),
    );
    expect(mcByStem.size).toBeGreaterThanOrEqual(3);

    await page.goto("/lessons/1-1/");
    await page.getByPlaceholder(/First name Last initial/i).fill("Test S");
    const period = page.getByPlaceholder(/e\.g\.\s*3/);
    if (await period.count()) await period.fill("3");
    await page.getByRole("button", { name: /Start Activity/ }).click();

    // Navigate by the visible phase label. Pre-lesson resources now precede
    // the core phases, so positional phase indexes are intentionally fluid.
    await page.locator(".phase-nav").getByRole("button", { name: /Practice/ }).click();

    // The leveled coaching line follows the served problem's tier.
    const tierVoice = page.locator(".practice-tier-voice");
    await expect(tierVoice).toBeVisible();
    await expect(tierVoice).toHaveText(/one step at a time|say your because|convince a skeptic/i);

    // Force the Level 1 lane (authored multiple-choice items) and confirm the
    // voice line switches to the supportive register.
    await page.locator('.level-option[data-level="level1"]').click();
    await expect(tierVoice).toHaveText(/part of the plan, not a penalty/i);

    // Three consecutive correct answers: the streak toast at 3 must carry the
    // bilingual stacked message, and the milestone confetti must actually fire
    // (it was authored-but-unwired before the award wave). Hidden phase
    // sections keep their own components in the DOM, so every interaction is
    // scoped to the problem card that is actually on screen.
    for (let i = 0; i < 3; i++) {
      const card = page.locator(".problem-card").filter({ visible: true }).first();
      const stemEl = card.locator(".problem-stem").first();
      await expect(stemEl).toBeVisible();
      const stem = ((await stemEl.textContent()) || "").trim();
      const answer = mcByStem.get(stem);
      expect(answer, `no authored MC answer for served stem: "${stem}"`).toBeTruthy();
      await card
        .locator(".mc-option-label")
        .filter({
          has: page.locator(".choice-text", {
            hasText: new RegExp(`^${escapeRegex(answer as string)}$`),
          }),
        })
        .first()
        .click();
      await card.getByRole("button", { name: "Check Answer" }).click();
      if (i === 2) {
        await expect(page.locator(".practice-toast .i18n-es").first()).toBeVisible();
        await expect(page.locator(".celebration-overlay .confetti-piece").first()).toBeVisible();
      }
      // Correct answers auto-advance after ~1.5s.
      await page.waitForTimeout(1700);
    }
  });
});
