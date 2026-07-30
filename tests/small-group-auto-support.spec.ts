import { expect, test } from "@playwright/test";

/**
 * Set-wide supports used to be reachable only by tapping "Find our next move"
 * in the adaptive coach. A student who never opened the coach — most of them —
 * worked an unscaffolded set no matter how many problems they missed.
 *
 * These cover the behaviour in the browser, where the source gates cannot see
 * it: the escalation has to actually open banks and step guides on cards that
 * were rendered without them, and it has to stay quiet for a student who is
 * doing fine.
 */
// A missed answer animates in feedback, hints, and the regenerate-practice
// offer, which keeps the next card moving under the click. The behaviour under
// test has nothing to do with motion, so take motion out of it.
test.use({ reducedMotion: "reduce" });

// Every goto here uses `domcontentloaded`. The studio's shared-table room holds
// a connection open, so the `load` event never fires and the default wait burned
// ~13s per navigation doing nothing — which put both tests within a second of
// the repo-wide 30s timeout and failed them roughly one run in three on timing
// alone. With that removed they finish in ~17s; the raised ceiling is headroom,
// not the fix.
test.describe.configure({ timeout: 90_000 });

test.describe("small-group automatic support escalation", () => {
  test("misses on two different problems open supports across the set", async ({ page }) => {
    await page.goto("/lessons/1-1-group1/", { waitUntil: "domcontentloaded" });
    await page.locator("#sg-tab-sg-tab-guided").click();
    const guided = page.locator("#sg-guided-practice");
    await expect(guided.locator(".prob").first()).toBeVisible();

    // Step guides start closed on every card. `:not([hidden])` rather than
    // `:visible` because pagination hides all but the current problem, and the
    // claim is about every card in the set, not just the one on screen.
    const openGuides = guided.locator(".steplist:not([hidden])");
    const allGuides = guided.locator(".steplist");
    await expect(openGuides).toHaveCount(0);
    await expect(guided).not.toHaveAttribute("data-auto-support", "on");

    // One miss on problem 1. Not enough on its own — a single hard problem is
    // handled by that card's own supports, not by rescaffolding the whole set.
    const first = guided.locator(".prob").first();
    await first.getByLabel("Your answer").fill("41");
    await first.getByRole("button", { name: "Check my thinking" }).click();
    await expect(first.getByText(/Not yet/)).toBeVisible();
    await expect(guided).not.toHaveAttribute("data-auto-support", "on");
    await expect(openGuides).toHaveCount(0);

    // A miss on a DIFFERENT problem is the signal that the set is too hard.
    await guided.getByRole("button", { name: "Next problem →" }).click();
    const second = guided.locator(".prob").nth(1);
    await expect(second).toBeVisible();
    await second.getByLabel("Your answer").fill("41");
    const check = second.getByRole("button", { name: "Check my thinking" });
    await check.scrollIntoViewIfNeeded();
    await check.click();

    await expect(guided).toHaveAttribute("data-auto-support", "on");
    await expect(
      guided.getByText(/Supports are open: every problem now shows/),
    ).toBeVisible();

    // The banner must correspond to real support appearing, not just a message —
    // and it says "every problem", so every step guide has to be open, not the
    // one the student happens to be looking at.
    const total = await allGuides.count();
    expect(total).toBeGreaterThan(0);
    await expect(openGuides).toHaveCount(total);
  });

  test("a student answering correctly is never rescaffolded", async ({ page }) => {
    await page.goto("/lessons/1-1-group1/", { waitUntil: "domcontentloaded" });
    await page.locator("#sg-tab-sg-tab-guided").click();
    const guided = page.locator("#sg-guided-practice");

    const first = guided.locator(".prob").first();
    await first.getByLabel("Your answer").fill("2 x 3 x 7");
    await first.getByRole("button", { name: "Check my thinking" }).click();
    await expect(first.getByText(/Your reasoning landed/)).toBeVisible();

    await guided.getByRole("button", { name: "Next problem →" }).click();
    const second = guided.locator(".prob").nth(1);
    await second.getByLabel("Your answer").fill("2 x 3 x 3 x 3");
    await second.getByRole("button", { name: "Check my thinking" }).click();
    await expect(second.getByText(/Your reasoning landed/)).toBeVisible();

    await expect(guided).not.toHaveAttribute("data-auto-support", "on");
    await expect(guided.getByText(/Supports are open/)).toHaveCount(0);
  });
});
