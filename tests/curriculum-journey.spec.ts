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
  await expect(page.locator("#hub-mode-toggle")).toContainText("Teacher Mode");
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
    await expect(explore).toHaveAttribute("href", "#interactive-hub");
    await explore.click();
    // No PIN, no Teacher Mode — a student-safe anchor jump only.
    await expect(page.locator("#hub-mode-toggle")).toContainText("Student Mode");
    await expect(page.locator("#curriculum-teacher-workflow")).toBeHidden();
    await expect(page.locator("#interactive-hub")).toBeVisible();
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
