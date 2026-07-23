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

const TEACHER_PIN = "TeacherNeft";

// Switching INTO Teacher Mode fires window.prompt("Enter teacher password:").
// Accept it with the master PIN so a first click can complete end to end.
function acceptTeacherPin(page: Page) {
  page.on("dialog", (dialog) => {
    if (dialog.type() === "prompt") dialog.accept(TEACHER_PIN);
    else dialog.accept();
  });
}

test.describe("guide first-click journeys from Student Mode", () => {
  test("Teach today opens the workflow on Today's Teaching in one click", async ({ page }) => {
    acceptTeacherPin(page);
    await page.goto("/curriculum/");
    // Baseline: public default is Student Mode with the workflow hidden.
    await expect(page.locator("#hub-mode-toggle")).toContainText("Student Mode");
    await expect(page.locator("#curriculum-teacher-workflow")).toBeHidden();

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
    await page.goto("/curriculum/");
    await expect(page.locator("#curriculum-teacher-workflow")).toBeHidden();

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
  await page.goto("/curriculum/");
  const teachToday = page.locator("button[data-guide-teacher-view='today']");
  await teachToday.focus();
  await expect(teachToday).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#curriculum-teacher-workflow")).toBeVisible();
});

test("mobile layout keeps the guide actions visible without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/curriculum/");
  await expect(page.locator("button[data-guide-teacher-view='today']")).toBeVisible();
  await expect(page.locator("button[data-guide-teacher-view='week']")).toBeVisible();
  await expect(page.getByRole("link", { name: /Explore by unit/ })).toBeVisible();
  // The page must not scroll sideways on a phone.
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
