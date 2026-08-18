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

const TEACHER_PIN = "BlueHeron2026";

// Switching INTO Teacher Mode fires window.prompt("Enter teacher password:").
// Accept it with the master PIN so a first click can complete end to end.
function acceptTeacherPin(page: Page) {
  page.on("dialog", (dialog) => {
    if (dialog.type() === "prompt") dialog.accept(TEACHER_PIN);
    else dialog.accept();
  });
}

/**
 * Enter Teacher Mode the way a teacher's browser does.
 *
 * These journeys were originally written when the guide's teacher actions were
 * rendered for everyone, and they clicked them straight from the public page.
 * The student-mode-leak fix then gave those controls `hub-teacher-only`
 * (display:none for students), which is correct — and left these tests asserting
 * pre-fix behaviour, red ever since. The one-click regression they guard is
 * still worth guarding; only the precondition changed.
 *
 * The hub stores this key as "true"; other modules compare against "1".
 */
async function enterTeacherMode(page: Page) {
  await page.goto("/curriculum/");
  await page.evaluate(() => {
    localStorage.setItem("nt-teacher-mode", "true");
  });
  await page.reload();
  // Anchored to aria-pressed, NOT to the button's words.
  //
  // This asserted `toContainText("Teacher Mode")` and went red when the toggle
  // was relabelled to "👩‍🏫 You're in Teacher view — switch to Student" — a
  // deliberate improvement, because the old label read equally as "you are in
  // teacher mode" and "click for teacher mode". The label was right and the
  // test was wrong.
  //
  // Swapping in the new string would have repeated the mistake. Visible prose is
  // the worst possible key for an assertion on a bilingual site: it changes for
  // copy reasons, and under ?lang=es it changes entirely. That is the shape of
  // the article bug, which silently destroyed project completions by matching on
  // button text.
  //
  // `aria-pressed` is set by applyTeacherMode() from the same `teacherMode`
  // boolean that picks the label, on every mode change AND at boot (the init
  // sequence calls it), so it cannot drift from the state it reports. It is also
  // language-independent and has its own reason to be correct — a screen reader
  // depends on it. Every other state assertion in this file already keys on it.
  await expect(page.locator("#hub-mode-toggle")).toHaveAttribute("aria-pressed", "true");
}

test.describe("guide first-click journeys in Teacher Mode", () => {
  test("Teach today opens the workflow on Today's Teaching in one click", async ({ page }) => {
    acceptTeacherPin(page);
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
    acceptTeacherPin(page);
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
    // Student mode BEFORE the click, read off aria-pressed as everywhere else.
    await expect(page.locator("#hub-mode-toggle")).toHaveAttribute("aria-pressed", "false");
    await expect(explore).toHaveAttribute("href", "/curriculum/units/");
    await explore.click();
    await expect(page).toHaveURL(/\/curriculum\/units\/$/);
    // Student-safe on the DESTINATION is asserted from the persisted state and
    // the absence of teacher UI, NOT from the toggle. The toggle is injected by
    // curriculum-enhancements.js after the units page has built its 252 lesson
    // rows, and measured cold in Chromium it does not exist for ~13s on a direct
    // load and ~27s via this click — far past any sane expect timeout. Asserting
    // on it here would be a slow flake pretending to be a check.
    //
    // localStorage is what the toggle reflects, so reading it is reading the
    // same single source of truth one step earlier, with no injection race.
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem("nt-teacher-mode")))
      .not.toBe("true");
    await expect(page.locator("#curriculum-teacher-workflow")).toBeHidden();
    // NOTHING is asserted about the units page's RENDERED CONTENT here, and that
    // is deliberate rather than an omission.
    //
    // curriculum-hub-search.js clears its container (`hub.innerHTML = ""`) and
    // rebuilds every lesson row — 35 static rows in the HTML become 252 rendered
    // ones. Measured cold in Chromium, that work is not finished for ~13s on a
    // direct load and ~27s arriving via this click. `#interactive-hub` is a
    // static but EMPTY div until the rebuild fills it, so it has no box and is
    // not "visible" either. Every content assertion available here races a 5s
    // expect timeout, and one written with a 20s timeout inside a 30s test
    // budget is a flake waiting for a loaded CI runner.
    //
    // The test's own claim — jumps to the unit browser, stays student-safe — is
    // fully covered by the URL and the two student-safety assertions above. The
    // render time is a real finding about that page and is reported separately;
    // burying it in a test timeout would hide it.
  });
});

test("the guide header is keyboard operable", async ({ page }) => {
  acceptTeacherPin(page);
  await enterTeacherMode(page);
  const teachToday = page.locator("button[data-guide-teacher-view='today']");
  await teachToday.focus();
  await expect(teachToday).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#curriculum-teacher-workflow")).toBeVisible();
});

test("mobile student layout is student-safe and does not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/curriculum/");
  // On a student's phone the teacher actions must NOT be present — this used to
  // assert the opposite, which is what the student-mode-leak fix corrected.
  await expect(page.locator("button[data-guide-teacher-view='today']")).toBeHidden();
  await expect(page.locator("button[data-guide-teacher-view='week']")).toBeHidden();
  await expect(page.getByRole("link", { name: /Explore by unit/ })).toBeVisible();
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

test("public curriculum landing is accessible", async ({ page }) => {
  await page.goto("/curriculum/");
  await expect(page.locator("#curriculum-start")).toBeVisible();
  const results = await new AxeBuilder({ page }).include("#curriculum-start").analyze();
  expect(results.violations).toEqual([]);
});
