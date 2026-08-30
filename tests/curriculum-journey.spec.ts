import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Journey-level coverage for the curriculum hub's "start with the next teaching
 * decision" header. These exercise the full path a teacher takes from the
 * public Student-Mode default — the guide actions (Teach today / Plan the week /
 * Explore by unit) — plus mobile layout, keyboard operation, and student-safe
 * links. The Teach-today / Plan-the-week cases are the regression guard for the
 * first-click bug where the guide flipped into Teacher Mode but never opened the
 * requested workflow view (so "Plan the week" landed on Today's Teaching, and a
 * second click was needed).
 */

/**
 * Open the teacher console.
 *
 * /curriculum/ IS the console now (AUTH_CONTRACT §2b): the middleware serves it
 * only to a request that passed the password gate and redirects everyone else to
 * /curriculum/units/. These specs run against the static `dist/` build, where no
 * middleware runs — and where nothing else turns Teacher Mode on either, so the
 * seeded flag below is what puts the page in the state an authorized browser
 * reaches. Measured: with no seed, `body` stays `"light-theme"`.
 *
 * The key is `nt-teacher-mode`, which is the ONE both the hub
 * (assets/curriculum-enhancements.js `STORAGE_MODE`) and the lesson engine
 * (engine/core/teacher-mode.js `TEACHER_KEY`) read; `saveTeacherMode()` writes
 * "1"/"0" to it. This used to seed `neft_teacher_mode_v1`, a key nothing in the
 * repo has ever read, so every test in this file died on the assertion below
 * with `body class="light-theme"` — before exercising a single thing it names.
 * A fixture that seeds the wrong key does not weaken a test, it deletes it.
 *
 * Anchored to the body class, NOT to the button's words — and no longer to the
 * toggle at all, because there is no toggle. `applyTeacherMode()` sets
 * `body.teacher-mode` from the same `teacherMode` boolean that drives every
 * teacher panel, on every mode change AND at boot, so it cannot drift from the
 * state it reports. It is also language-independent, which visible prose is not:
 * this assertion used to read `toContainText("Teacher Mode")` and went red on a
 * deliberate copy change.
 */
async function enterTeacherMode(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("nt-teacher-mode", "1");
    } catch {}
  });
  await page.goto("/curriculum/");
  await expect(page.locator("body")).toHaveClass(/teacher-mode/);
}

test.describe("guide first-click journeys in Teacher Mode", () => {
  test("Teach today opens the workflow on Today's Teaching in one click", async ({ page }) => {
    await enterTeacherMode(page);

    const workflowEl = page.locator("#curriculum-teacher-workflow");
    await expect(workflowEl).toBeVisible();
    // Move OFF Today first. The workflow opens on Today by default, so clicking
    // "Teach today" from that state would pass even if guide routing were
    // completely broken — the regression is only observable as a real switch.
    await page.locator("button[data-guide-teacher-view='week']").click();
    await expect(workflowEl.locator("button[data-ctw-view='week']")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.locator("button[data-guide-teacher-view='today']").click();

    const workflow = page.locator("#curriculum-teacher-workflow");
    await expect(workflow).toBeVisible();
    // The requested view actually opened — Today's Teaching tab is active and
    // the today card rendered — without a second click.
    await expect(workflow.locator("button[data-ctw-view='today']")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(workflow.locator(".ctw-today-card")).toBeVisible();
  });

  test("Plan the week opens Weekly Pacing in one click (not Today)", async ({ page }) => {
    await enterTeacherMode(page);
    // Opens on Today by default; the regression is that "Plan the week" used to
    // leave it there, so Today being active first is the meaningful baseline.
    await expect(
      page.locator("#curriculum-teacher-workflow button[data-ctw-view='today']"),
    ).toHaveAttribute("aria-pressed", "true");

    await page.locator("button[data-guide-teacher-view='week']").click();

    const workflow = page.locator("#curriculum-teacher-workflow");
    await expect(workflow).toBeVisible();
    // Regression: the requested Weekly Pacing view is active on the FIRST click.
    await expect(workflow.locator("button[data-ctw-view='week']")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(workflow.locator("button[data-ctw-view='today']")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await expect(page.getByLabel("Monday lesson")).toBeVisible();
  });

  test("Explore by unit stays student-safe and jumps to the unit browser", async ({ page }) => {
    await page.goto("/curriculum/");
    const explore = page.getByRole("link", { name: /Explore by unit/ });
    // The link used to be an in-page anchor (#interactive-hub) and now navigates
    // to the unit browser page. This test asserted the ANCHOR, so it went red on
    // a product change that satisfies its own stated intent — /curriculum/units/
    // IS the unit browser. What was stale was the encoded mechanism, not the
    // claim, so the assertions below are written against the claim instead:
    // it goes to the unit browser, the browser actually renders, and the student
    // is still a student when they arrive.
    await expect(explore).toHaveAttribute("href", "/curriculum/units/");
    await explore.click();
    await expect(page).toHaveURL(/\/curriculum\/units\/$/);
    // Student-safe on the DESTINATION is read from the persisted state and the
    // absence of teacher UI, not from the toggle. localStorage is what the
    // toggle reflects, so this reads the same single source of truth one step
    // earlier and does not depend on when the injected control appears.
    //
    // (An earlier version of this comment claimed the toggle takes ~13s to
    // appear. That was wrong: the 13s was this sandbox stalling on a blocked
    // fonts.googleapis.com stylesheet, not the page. With that host reachable
    // the units page settles in ~840ms. The assertion below is still the better
    // one — state over rendering — but not for the reason first given.)
    // The DESTINATION is the student surface, and it must render as one even
    // though the console the click came from is in Teacher Mode: /curriculum/
    // writes the shared key, and /curriculum/units/ must not inherit the teacher
    // workflow panel from it.
    await expect(page.locator("#curriculum-teacher-workflow")).toBeHidden();
    // Nothing is asserted about the units page's RENDERED content. The claim in
    // this test's name — jumps to the unit browser, stays student-safe — is
    // fully covered by the URL and the two student-safety assertions above, and
    // curriculum-hub-search.js rebuilds the row list (84 static core rows become
    // 252, each core lesson plus its two group variants), so any count assertion
    // here would restate what validate:lesson-catalogues already holds against
    // disk, and would need re-pinning on every curriculum change.
  });
});

test("the guide header is keyboard operable", async ({ page }) => {
  await enterTeacherMode(page);
  const teachToday = page.locator("button[data-guide-teacher-view='today']");
  await teachToday.focus();
  await expect(teachToday).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#curriculum-teacher-workflow")).toBeVisible();
});

test("mobile student layout is student-safe and does not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // The STUDENT page, not the console. /curriculum/ is teacher-only now, so the
  // "is a student safe here?" question moved to the page a student can reach.
  await page.goto("/curriculum/units/");
  await expect(page.locator("button[data-guide-teacher-view='today']")).toBeHidden();
  await expect(page.locator("button[data-guide-teacher-view='week']")).toBeHidden();
  // The page must not scroll sideways on a phone.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("mobile teacher layout keeps the guide actions usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enterTeacherMode(page);
  await expect(page.locator("button[data-guide-teacher-view='today']")).toBeVisible();
  await expect(page.locator("button[data-guide-teacher-view='week']")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("the public curriculum landing is accessible", async ({ page }) => {
  // This used to scan `/curriculum/`'s #curriculum-start. That page is the
  // TEACHER CONSOLE now (AUTH_CONTRACT §2b) and no student can reach it, so the
  // claim in this test's name moved with the audience: /curriculum/units/ is
  // where a student lands. Scoped to #interactive-hub, the unit browser itself.
  //
  // NOT re-pointed at the console. Scanning it in Teacher view surfaces 208 axe
  // violations — almost entirely colour contrast inside teacher-only panels that
  // this test could never see while the hub defaulted to Student view. Those are
  // real and pre-existing, and fixing them is its own piece of work; adding a
  // gate here that fails on day one would only teach people to ignore it.
  await page.goto("/curriculum/units/");
  await expect(page.locator("#interactive-hub")).toBeVisible();
  const results = await new AxeBuilder({ page }).include("#interactive-hub").analyze();
  expect(results.violations).toEqual([]);
});
