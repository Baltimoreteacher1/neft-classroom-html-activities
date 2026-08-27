/**
 * Studio experience layer — persona verification across the three pillars.
 *
 * Covers the four learner tiers:
 *   - Advanced: Go Deeper Lab in whole-class Practice + Design Twist on projects.
 *   - Core: hub Studio Journey momentum (resume chip + lit pills).
 *   - ESOL L1/2: Spanish sublines on every new surface.
 *   - IEP L0: everything optional — collapsed invitations, no new blockers,
 *     reduced-motion safety.
 * Plus the teacher-facing Rhythm Coach (facilitation route mocked — the Pages
 * function does not run under `vite preview`).
 *
 * Run with `npm run e2e` (or `npx playwright test tests/award-experience.spec.ts`).
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function enterLesson(page: Page, path: string) {
  await page.goto(path);
  // The 10 unit-entry lessons (1-1 among them) were moved onto the flagship
  // narrative shell in dfb9d20, which opens on a full-screen Mission Briefing
  // and does not call bootLesson() — so the identity gate does not exist yet —
  // until the student presses Start. Conditional, so this helper stays correct
  // for the ~200 lessons that have no briefing.
  const start = page.locator(".flagship-mission-start");
  if (await start.count()) {
    await start.click();
    await page.locator(".flagship-mission").waitFor({ state: "detached" });
  }
  await page.locator("#id-name").fill("Test Star");
  await page.locator("#id-start").click();
}

async function openPractice(page: Page) {
  // Act 2 is called "Lesson", not "Practice". The 3-Act reflow (33cef3cde,
  // "Act 1 opens on the Warm-Up, and Act 2 is called Lesson") renamed the act
  // that carries the practice work; the phase rail now reads
  // "1 Warm-Up / 2 Lesson / 3 Exit Ticket" and no button matches /Practice/ at
  // all, so every test in this file timed out for 30s on a locator that can
  // never resolve. The award layer it is checking still lives in that act.
  await page.locator(".phase-nav").getByRole("button", { name: /Lesson/ }).click();
  // …and then the Practice STEP inside that act. The reflow also split each act
  // into an in-act strip ("one moment on screen at a time"), so opening the act
  // lands on Explore and leaves Practice — and the Go Deeper Lab in it —
  // rendered but [hidden]. Clicking the act alone got .ntgd into the DOM and
  // never onto the screen, which reads as a missing feature rather than an
  // unopened tab.
  // Conditional: not every lesson renders the strip, and an unconditional click
  // just swaps one 30s timeout for another.
  const practiceStep = page.locator(".act-step-strip").getByRole("button", { name: /Practice/ });
  if (await practiceStep.count()) await practiceStep.first().click();
}

async function completeGoDeeper(page: Page, root: ReturnType<Page["locator"]>) {
  await root.locator("summary").click();
  const stepOne = root.locator(".ntgd-step").nth(0);
  await stepOne.locator("textarea").fill("I decomposed both numbers into primes first.");
  await stepOne.getByRole("button", { name: /Lock it in/ }).click();

  const stepTwo = root.locator(".ntgd-step").nth(1);
  await stepTwo.getByRole("button", { name: /second way/ }).click();
  await expect(stepTwo.locator(".ntgd-frame")).toBeVisible();
  await stepTwo
    .locator("textarea")
    .fill("A factor tree and repeated division both give the same primes.");
  await stepTwo.getByRole("button", { name: /skeptic is convinced/ }).click();

  const stepThree = root.locator(".ntgd-step").nth(2);
  await stepThree.locator("textarea").fill("Find the prime factorization of 360 using exponents.");
  await stepThree.locator('input[type="text"]').fill("2^3 x 3^2 x 5");
  await stepThree.getByRole("button", { name: /Publish my challenge/ }).click();
  await expect(root.locator(".ntgd-done")).toBeVisible();
}

test.describe("Go Deeper Lab — whole-class Practice (advanced tier)", () => {
  test("full three-step flow completes, persists, and celebrates", async ({ page }) => {
    await enterLesson(page, "/lessons/1-1/");
    await openPractice(page);
    const lab = page.locator(".ntgd");
    await expect(lab).toBeVisible();
    // Invitation-only: collapsed by default, so it never blocks Level 0.
    await expect(lab.locator(".ntgd-body")).not.toBeVisible();
    await completeGoDeeper(page, lab);
    const stored = await page.evaluate(() => localStorage.getItem("nt-godeeper:1-1"));
    expect(JSON.parse(stored || "{}").done).toBe(true);
  });

  test("bilingual sublines are present (ESOL L1/2)", async ({ page }) => {
    await enterLesson(page, "/lessons/1-1/");
    await openPractice(page);
    await page.locator(".ntgd summary").click();
    await expect(page.locator(".ntgd summary .ntgd-es")).toContainText("Ve más allá");
    await expect(page.locator(".ntgd-step .ntgd-es").first()).toContainText("Acepta el reto");
  });

  test("reduced motion: completion shows no animated sparks (IEP L0 calm)", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await enterLesson(page, "/lessons/1-1/");
    await openPractice(page);
    const lab = page.locator(".ntgd");
    await completeGoDeeper(page, lab);
    for (const spark of await page.locator(".ntgd-spark").all()) {
      await expect(spark).toBeHidden();
    }
    await context.close();
  });
});

test.describe("Go Deeper Lab — small-group parity", () => {
  test("group1 gets the stretch invitation in More Practice", async ({ page }) => {
    await page.goto("/lessons/1-1-group1/");
    await page.locator("#sg-tab-sg-tab-more").click();
    const lab = page.locator("#sg-tab-more .ntgd");
    await expect(lab).toBeVisible();
    await expect(lab.locator("summary")).toContainText("You've earned a stretch");
    await expect(lab.locator("summary .ntgd-es")).toContainText("Te ganaste un reto");
  });

  test("catch-up studios get the stretch invitation too", async ({ page }) => {
    await page.goto("/lessons/1-3-catchup/");
    await page.locator("#sg-tab-sg-tab-more").click();
    await expect(page.locator("#sg-tab-more .ntgd")).toBeVisible();
  });

  test("group2 keeps Prove It and does NOT get a duplicate stretch", async ({ page }) => {
    await page.goto("/lessons/1-1-group2/");
    await expect(page.locator("#sg-tab-sg-tab-prove")).toBeVisible();
    await expect(page.locator(".ntgd")).toHaveCount(0);
  });
});

test.describe("Rhythm Coach — small-group facilitation (teacher)", () => {
  test("teacher route mounts the pacing bar with live segments", async ({ page }) => {
    await page.route("**/teacher-small-group/1-1-group1/data", (route) =>
      route.fulfill({
        json: {
          facilitation: {
            group: 1,
            label: "Extra Support",
            duration: "15–20 min",
            who: "Pull 3–5 students.",
            moves: ["Open strong.", "Build together.", "Let them talk.", "Release.", "Celebrate."],
            frames: ["I know because ___."],
            listenFor: ["Students explain their split."],
          },
        },
      }),
    );
    await page.goto("/lessons/1-1-group1/?teacher=1");
    const coach = page.locator(".ntfr");
    await expect(coach).toBeVisible();
    await expect(coach.locator(".ntfr-seg").nth(0)).toHaveAttribute("data-state", "active");
    await expect(coach.locator(".ntfr-move")).toContainText("Open strong.");
    await coach.getByRole("button", { name: "Skip to next segment" }).click();
    await expect(coach.locator(".ntfr-seg").nth(1)).toHaveAttribute("data-state", "active");
    await expect(coach.locator(".ntfr-move")).toContainText("Build together.");
    // Student mode never sees the coach.
    await page.goto("/lessons/1-1-group1/");
    await expect(page.locator(".ntfr")).toHaveCount(0);
  });
});

test.describe("Studio Journey — curriculum hub (core momentum + first 90 seconds)", () => {
  test("empty state invites instead of shaming", async ({ page }) => {
    await page.goto("/curriculum/");
    const firstStrip = page.locator("#interactive-hub .ntj-strip").first();
    await expect(firstStrip).toBeVisible({ timeout: 15_000 });
    await expect(firstStrip.locator(".ntj-pill").first()).toHaveAttribute("data-lit", "false");
    await expect(page.locator(".ntj-invite").first()).toContainText("Start your gallery");
    await expect(page.locator(".ntj-continue")).toHaveCount(0);
  });

  test("seeded signals light the pillars and offer resume", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("curriculumProgress", JSON.stringify({ "1-1": true }));
      localStorage.setItem("nt-sg:1-1-group1", JSON.stringify({ buildDone: true }));
      localStorage.setItem("nt-godeeper:1-1", JSON.stringify({ done: true }));
      localStorage.setItem(
        "nt-community-math-studio:v1:/math/unit-1/projects/version-a/",
        JSON.stringify({ brief: "seen" }),
      );
      localStorage.setItem(
        "nt-journey-last",
        JSON.stringify({ id: "1-1", title: "Prime Factorization", path: "/lessons/1-1/", t: 1 }),
      );
    });
    await page.goto("/curriculum/");
    const resume = page.locator(".ntj-continue");
    await expect(resume).toBeVisible({ timeout: 15_000 });
    await expect(resume.getByRole("link", { name: "Prime Factorization" })).toHaveAttribute(
      "href",
      "/lessons/1-1/",
    );
    const unitOne = page
      .locator("#interactive-hub .unit-card")
      .filter({ has: page.locator(".unit-card-num", { hasText: /^\s*(Unit\s*)?1\s*$/ }) })
      .first();
    const strip = unitOne.locator(".ntj-strip");
    await expect(strip.locator(".ntj-pill", { hasText: /Lessons 1\// })).toHaveAttribute(
      "data-lit",
      "true",
    );
    await expect(strip.locator(".ntj-pill", { hasText: "Studio 1" })).toHaveAttribute(
      "data-lit",
      "true",
    );
    await expect(strip.locator(".ntj-pill", { hasText: "Deeper" })).toHaveAttribute(
      "data-lit",
      "true",
    );
    await expect(strip.locator(".ntj-pill", { hasText: "Project ✓" })).toHaveAttribute(
      "data-lit",
      "true",
    );
  });
});

test.describe("Design Twist — culminating projects (advanced + agency)", () => {
  test("client twist flow completes with bilingual support and no axe violations", async ({
    page,
  }) => {
    // Project wizards are heavy pages (lazy three.js + several enhancement
    // layers); the default 30s budget is too tight for flow + axe scan.
    test.setTimeout(90_000);
    await page.goto("/math/unit-1/projects/version-a/");
    // Dismiss the gold-layer level chooser the way a student does.
    await page.locator('.gold-level-option[data-level="2"]').click();
    await expect(page.locator("#gold-level-overlay")).toHaveCount(0);
    const card = page.locator(".ntdt");
    await expect(card).toBeVisible({ timeout: 15_000 });
    await card.locator("summary").click();
    await expect(card.locator(".ntdt-lead .ntdt-es")).toContainText("Los diseñadores");
    await card.locator(".ntdt-chip").first().click();
    await expect(card.locator(".ntdt-chip").first()).toHaveAttribute("aria-pressed", "true");
    const work = card.locator(".ntdt-work");
    await work.locator("textarea").nth(0).fill("We re-split the shared costs into 3 equal groups.");
    await work.locator("textarea").nth(1).fill("Old: 120 ÷ 4 = 30. New: 90 ÷ 3 = 30 per group.");
    await card.getByRole("button", { name: /Deliver the revision/ }).click();
    await expect(card.locator(".ntdt-done")).toBeVisible();
    const stored = await page.evaluate(() =>
      localStorage.getItem("nt-design-twist:v1:/math/unit-1/projects/version-a/"),
    );
    expect(JSON.parse(stored || "{}").done).toBe(true);

    const axe = await new AxeBuilder({ page }).include(".ntdt").analyze();
    const serious = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
    expect(serious).toEqual([]);
  });
});
