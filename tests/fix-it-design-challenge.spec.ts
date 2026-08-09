/**
 * Participant-page checks for /fix-it-design-challenge/ (AI Prompting with SAMR).
 *
 * Uses the repo's root playwright.config.ts harness. Against a live site or a
 * plain static server, run with PLAYWRIGHT_BASE_URL set — the config skips its
 * webServer then, and this page is copied into dist/ verbatim, so source and
 * built output are the same bytes.
 *
 * Why this file exists, in one line each:
 *
 *   - A group typed its fix by hand, refreshed, and the box came back empty
 *     while the save pill still read "Saved". buildFixChips() → rebuildPrompt()
 *     wrote assemblePrompt()'s "" over the stored answer on every load. Losing
 *     a group's work mid-session costs more than the prompt they were writing,
 *     so the persistence test here is the point of the file.
 *
 *   - The page teaches where the line runs inside vocabulary support, which is
 *     the one place its own worked example is most likely to leak reasoning.
 *     That block is content people edit; it should not silently vanish.
 *
 * Driving this page is not obvious, and the helpers below exist so nobody has
 * to rediscover it: group pages REBUILD themselves into a four-pane wizard on
 * open, so fields are not present until the right pane is shown; and the fix
 * textarea lives inside a collapsed <details class="hand-edit"> because the
 * tap-to-build slot picker is the primary path.
 */
import { test, expect, type Page } from "@playwright/test";

const PAGE = "/fix-it-design-challenge/";
const STORE = "fixit_design_challenge_participant_pages_v5_repaired";

/** Group pages are reachable only through the menu — walk the real path. */
async function openGroup(page: Page, id: number): Promise<void> {
  if (!(await page.locator(`#group-${id}.active`).count())) {
    await page.locator('[data-open-page="menu"]:visible').first().click();
    await page.locator(`[data-open-page="group-${id}"]:visible`).first().click();
  }
  await page.waitForSelector(`#group-${id}.active`);
}

/**
 * Show a wizard pane and wait for something on it.
 *
 * The dots only work once the page has finished rebuilding itself, and that
 * rebuild is not tied to any event we can await — hence the retry rather than
 * a fixed sleep.
 */
async function wizStep(page: Page, group: number, index: number, reveal: string): Promise<void> {
  await expect(async () => {
    await page.locator(`.wiz-dot[data-wiz-go="${index}"][data-group="${group}"]`).first().click();
    await expect(page.locator(reveal).first()).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

/** Typing by hand is behind a disclosure; the slot builder is the main path. */
async function openHandEdit(page: Page, group: number): Promise<void> {
  const details = page.locator(`#group-${group} details.hand-edit`).first();
  if (!(await details.evaluate((node: HTMLDetailsElement) => node.open))) {
    await details.locator("summary").first().click();
  }
  await expect(page.locator(`#g${group}-before`)).toBeVisible();
}

test.describe("participant work survives the session", () => {
  test("a hand-written fix is still there after a refresh", async ({ page }) => {
    const typed = "Word bank that names terms only, plus sentence frames.";

    await page.goto(PAGE);
    await openGroup(page, 1);
    await wizStep(page, 1, 1, "#group-1 .slot-builder");
    await openHandEdit(page, 1);
    await page.fill("#g1-before", typed);

    // Writes are coalesced, so let the debounce land before reloading.
    await expect
      .poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}").g1_before, STORE))
      .toBe(typed);

    await page.reload();
    await openGroup(page, 1);
    await wizStep(page, 1, 1, "#group-1 .slot-builder");
    await openHandEdit(page, 1);

    // The regression: this used to come back "" — and the stored value with it,
    // because the first paint wrote the empty assembled prompt over the answer.
    await expect(page.locator("#g1-before")).toHaveValue(typed);
    await expect
      .poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}").g1_before, STORE))
      .toBe(typed);
  });

  test("tapping a support chip still rewrites the prompt", async ({ page }) => {
    // The other half of the guard: preserving stored text must not break the
    // slot picker, whose whole job is to regenerate the box.
    await page.goto(PAGE);
    await openGroup(page, 1);
    await wizStep(page, 1, 1, "#group-1 .slot-builder");
    await openHandEdit(page, 1);
    await page.fill("#g1-before", "typed by hand");

    await page.locator('#group-1 .pick-chip[data-field="s_support"]').first().click();

    await expect(page.locator("#g1-before")).toHaveValue(/^Create /);
    await expect(page.locator("#group-1 .prompt-preview-out").first()).toContainText("Create");
  });
});

test.describe("where the line runs inside vocabulary support", () => {
  test("the compare block is on the walkthrough", async ({ page }) => {
    await page.goto(PAGE);

    const block = page.locator(".line-check");
    await expect(block).toBeVisible();
    await expect(block.locator("h4")).toContainText("Where the line runs");

    // Leaking definition first, term-naming second — the contrast is the lesson.
    const boxes = block.locator(".model-box");
    await expect(boxes).toHaveCount(2);
    await expect(boxes.first()).toHaveClass(/\bbad\b/);
    await expect(boxes.last()).toHaveClass(/\bgood\b/);
    await expect(block).toContainText("copy your definition into the answer blank");
  });

  test("group 1 does not present vocabulary support as flatly safe", async ({ page }) => {
    // Group 1's target IS the explanation, so "AI may help with academic
    // vocabulary" cannot stand unqualified: a definition of equivalent ratios
    // can be the explanation.
    await page.goto(PAGE);
    await openGroup(page, 1);
    await expect(page.locator("#group-1 .test-list li.ok").first()).toContainText("name the terms");
  });
});

test.describe("layout", () => {
  for (const [label, width] of [
    ["desktop", 1280],
    ["phone", 390],
  ] as const) {
    test(`no horizontal overflow on ${label}`, async ({ page }) => {
      // Participants run this on classroom Chromebooks and their phones; a
      // sideways-scrolling page loses the tab row.
      await page.setViewportSize({ width, height: 900 });
      await page.goto(PAGE);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${width}px viewport overflows by ${overflow}px`).toBeLessThanOrEqual(1);

      // The compare boxes are a two-column grid that must collapse by 1040px.
      const tops = await page
        .locator(".line-check .model-box")
        .evaluateAll((nodes) => nodes.map((n) => n.getBoundingClientRect().top));
      if (width < 1040) expect(tops[1]).toBeGreaterThan(tops[0]);
      else expect(Math.abs(tops[1] - tops[0])).toBeLessThan(4);
    });
  }
});
