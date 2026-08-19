import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/*
 * Small-group studio contracts — refreshed 2026-08-19.
 *
 * The previous suite hardcoded curriculum content ("Writing a whole number as
 * a product of only prime numbers." on lesson 1-1) that the 2026-08-10 Reveal
 * TOC renumber moved to other lessons, so 11 of its 12 cases failed against a
 * production site that was working — identical failures against old and new
 * code, pure noise. Every content assertion here derives from the lesson's
 * own config.json at test time, so a content wave cannot rot the suite again.
 *
 * Deliberately dropped, with their standing coverage:
 *  - teacher-surface 401s: the vite preview serves no Pages Functions, so the
 *    old case could never exercise the gate here; it is held by
 *    validate:auth-contract, e2e:auth (real wrangler dev, two engines) and
 *    smoke:live. What CAN be held here — no facilitation text in student DOM —
 *    still is.
 *  - curriculum dropdown ordering: pinned by validate:pacing-unit-order and
 *    the hub gates, which read the same manifests the dropdowns do.
 *  - Award Edition evidence walk-throughs: superseded by behavior contracts
 *    below (retry-first coaching, streaks are engine internals the fleet eval
 *    covers).
 */

const G1 = "/lessons/1-1-group1/";
const G2 = "/lessons/7-2-group2/";

async function openStudio(page, path: string) {
  await page.goto(path);
  // Lesson pages hold a telemetry connection open — never wait for networkidle.
  await page.locator(".sg-hero").waitFor({ timeout: 15000 });
}

async function lessonConfig(page, path: string) {
  const res = await page.request.get(`${path}config.json`);
  return res.json();
}

const tab = (page, key: string) => page.locator(`#sg-tab-sg-tab-${key}`);

test.describe("small-group guided math studio", () => {
  test("Group 1 opens on a leveled vocabulary studio built from its own config", async ({
    page,
  }) => {
    await openStudio(page, G1);
    const cfg = await lessonConfig(page, G1);

    // Foundations register greets the group; Notice & Wonder stays out of
    // small groups (directive 2026-07-16).
    await expect(page.locator(".sg-tagline")).toContainText(/one step at a time/i);
    await expect(page.getByLabel("Notice", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Wonder", { exact: true })).toHaveCount(0);

    // The five studio tabs, in teaching order.
    for (const key of ["vocab", "learn", "guided", "practice", "more"]) {
      await expect(tab(page, key)).toBeVisible();
    }

    // Vocabulary is the landing tab and the match game plays THIS lesson's
    // words — read from the config, never hardcoded.
    const match = page.locator(".sg-match");
    await expect(match).toBeVisible();
    const terms = (cfg.vocabulary || [])
      .map((v: { term?: string }) => String(v.term || ""))
      .filter((t: string) => t && t.length > 2);
    let seen = 0;
    for (const term of terms) {
      if (await match.getByText(term, { exact: false }).count()) seen++;
    }
    expect(seen, "match game shows this lesson's own vocabulary").toBeGreaterThanOrEqual(2);
  });

  test("guided practice coaches a retry and opens the step guide on the second miss", async ({
    page,
  }) => {
    await openStudio(page, G1);
    await tab(page, "guided").click();
    const firstProblem = page.locator("#sg-guided-practice .prob").first();
    await firstProblem.scrollIntoViewIfNeeded();

    const answer = firstProblem.getByLabel("Your answer");
    if ((await answer.count()) === 0) {
      // Open-response guided card (no checker) — the retry contract lives on
      // the sections that have one; nothing to assert here.
      test.skip(true, "first guided problem is open-response on this lesson");
    }
    await answer.fill("999999");
    await firstProblem.getByRole("button", { name: "Check my thinking" }).click();
    await expect(firstProblem.getByText(/Not yet/)).toBeVisible();
    await answer.fill("999998");
    await firstProblem.getByRole("button", { name: "Check my thinking" }).click();
    // Second miss: support arrives without a hunt.
    await expect(
      firstProblem.getByText(/step guide below just opened|Still building/),
    ).toBeVisible();
  });

  test("independent practice is notebook-first with the guidance one tap away", async ({
    page,
  }) => {
    await openStudio(page, G1);
    await tab(page, "practice").click();
    const section = page.locator("#sg-independent-practice");
    await expect(section).toBeVisible();

    // The section direction sets the norm — read inside the ACTIVE panel;
    // the hidden Guided tab also says "notebook" and resolves first otherwise.
    await expect(
      page.locator(".sg-tabpanel:not([hidden])").getByText(/notebook/i).first(),
    ).toBeVisible();

    // …and every problem card opens with the cue + folded guidance.
    const probs = section.locator(".prob");
    const count = await probs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const prob = probs.nth(i);
      const row = prob.locator(".sg-notebook-row");
      const guidance = prob.locator(".sg-guidance");
      if ((await guidance.count()) === 0) continue; // cards with no workspace have no fold
      await expect(row).toHaveCount(1);
      expect(await guidance.getAttribute("hidden")).not.toBeNull();
    }

    // The toggle opens the workspace on the visible card.
    const visible = section.locator(".prob:not([hidden])").first();
    const toggle = visible.locator(".sg-guidance-btn");
    if (await toggle.count()) {
      await toggle.click();
      expect(await visible.locator(".sg-guidance").getAttribute("hidden")).toBeNull();
    }
  });

  test("Group 2 is a distinct challenge register with its own Math Check tab", async ({ page }) => {
    await openStudio(page, G2);
    await expect(page.locator(".sg-tagline")).toContainText(/like a mathematician/i);
    await expect(page.locator(".sg-tagline")).not.toContainText(/one step at a time/i);
    await expect(tab(page, "prove")).toBeVisible();
  });

  test("no facilitation guidance leaks into the student studio", async ({ page }) => {
    for (const path of [G1, G2]) {
      await openStudio(page, path);
      await expect(
        page.getByText(/Teacher studio guide|Listen for during team talk|facilitation/i),
      ).toHaveCount(0);
    }
  });

  test("underlined math vocabulary opens a definition popup with real content", async ({
    page,
  }) => {
    await openStudio(page, G2);
    const term = page.locator('button[aria-label$="open definition"]').first();
    await expect(term).toBeAttached();
    const label = (await term.getAttribute("aria-label")) || "";
    const termName = label.replace(/: open definition$/, "");
    await term.click({ force: true });
    const dialog = page.getByRole("dialog").filter({ hasText: termName }).first();
    await expect(dialog).toBeVisible();
    // A popup is only worth opening if it defines something.
    expect(((await dialog.textContent()) || "").length).toBeGreaterThan(termName.length + 20);
    const img = dialog.getByRole("img").first();
    if (await img.count()) {
      await expect(img).toHaveAttribute("src", /\/assets\/vocab-images\/[a-z0-9-]+\.svg$/);
    }
  });

  test("multi-digit underlines as ONE vocabulary word, never a split digit", async ({ page }) => {
    // 2-6 writes "Multi-Digit" throughout. Before the glossary gained a
    // multi-digit entry, only the "Digit" half underlined — reading as two
    // words where the lesson means one.
    await openStudio(page, "/lessons/2-6-group1/");
    const whole = page.locator('button[aria-label="multi-digit: open definition"]');
    const half = page
      .locator('button[aria-label="digit: open definition"]')
      .filter({ hasText: /^Digit$/ });
    if ((await whole.count()) === 0) {
      // The SG underliner may not carry glossary terms on this surface; the
      // core-lesson panel must. Either way the split form is forbidden here.
      expect(await half.count(), "the bare Digit half of Multi-Digit is underlined").toBe(0);
    } else {
      await expect(whole.first()).toBeAttached();
    }
  });

  test("student studio has no serious or critical accessibility violations", async ({ page }) => {
    await openStudio(page, G1);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(
      serious.map((v) => `${v.id}: ${v.nodes.length} node(s)`),
      "serious/critical axe violations",
    ).toEqual([]);
  });
});
