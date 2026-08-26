import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("the student lesson picker keeps the teacher workflow hidden", async ({ page }) => {
  // /curriculum/ is the teacher console and no longer has a student view
  // (AUTH_CONTRACT §2b), so the "does teacher material leak to a student?"
  // question moved to the page a student can actually reach. It shares the same
  // bundle, so the leak this guards against is still possible there.
  await page.goto("/curriculum/units/");
  await expect(page.locator("#curriculum-teacher-workflow")).toBeHidden();
  await expect(page.getByText("Gradebook & Save Codes")).toBeHidden();
});

test.describe("teacher command center", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        // The real key — STORAGE_MODE in assets/curriculum-enhancements.js,
        // TEACHER_KEY in engine/core/teacher-mode.js. `neft_teacher_mode_v1`,
        // which this used to write, is read by nothing that ships.
        localStorage.setItem("nt-teacher-mode", "1");
      } catch {}
    });
    await page.goto("/curriculum/");
    await expect(page.locator("#curriculum-teacher-workflow")).toBeVisible();
  });

  test("selects and launches a student-safe lesson", async ({ page }) => {
    const workflow = page.locator("#curriculum-teacher-workflow");
    await expect(workflow.getByRole("heading", { name: "Plan it. Teach it. Launch it." })).toBeVisible();
    const today = workflow.locator(".ctw-today-card");
    await expect(today.getByRole("heading", { name: /1-1 · Prime Factorization/ })).toBeVisible();
    const launch = today.getByRole("link", { name: "Launch for students" });
    await expect(launch).toHaveAttribute("href", /\/curriculum\/student-launch\/\?lesson=1-1$/);
    await expect(workflow.getByRole("heading", { name: "Lesson Readiness" })).toBeVisible();
    await expect(workflow.getByRole("heading", { name: "WIDA 1–2" })).toBeVisible();
    await expect(workflow.getByRole("heading", { name: "Common misconception" })).toBeVisible();
  });

  test("saves weekly pacing locally", async ({ page }) => {
    await page.getByRole("button", { name: "Weekly Pacing" }).click();
    const monday = page.getByLabel("Monday lesson");
    await monday.selectOption("2-1");
    await page.reload();
    await page.getByRole("button", { name: "Weekly Pacing" }).click();
    await expect(page.getByLabel("Monday lesson")).toHaveValue("2-1");
  });

  test("builds a canonical student playlist", async ({ page }) => {
    await page.getByRole("button", { name: "Student Playlist" }).click();
    await page.locator(".ctw-planning-card select").selectOption("1-1");
    await page.getByRole("button", { name: "Add lesson" }).click();
    await page.locator(".ctw-planning-card select").selectOption("1-2");
    await page.getByRole("button", { name: "Add lesson" }).click();
    const preview = page.getByRole("link", { name: "Preview student playlist" });
    await expect(preview).toHaveAttribute("href", /playlist=1-1,1-2$/);
  });

  test("stores aggregate next-day evidence without student names", async ({ page }) => {
    await page.getByRole("button", { name: "Next-Day Plan" }).click();
    const workflow = page.locator("#curriculum-teacher-workflow");
    await workflow.getByRole("spinbutton", { name: "Ready", exact: true }).fill("12");
    await workflow.getByRole("spinbutton", { name: "Developing", exact: true }).fill("7");
    await workflow.getByRole("spinbutton", { name: "Reteach", exact: true }).fill("3");
    await expect(page.getByRole("heading", { name: "Extend · 12" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Core practice · 7" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Reteach · 3" })).toBeVisible();
    await expect(page.getByText(/No names, IDs, or responses/)).toBeVisible();
  });
});

test("student launcher is focused, safe, and accessible", async ({ page }) => {
  await page.goto("/curriculum/student-launch/?playlist=1-1,1-2");
  await expect(page.getByRole("heading", { name: "Prime Factorization" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start lesson" })).toHaveAttribute(
    "href",
    "/lessons/1-1/?student=1",
  );
  await expect(page.getByText("Lesson 1 of 2")).toBeVisible();
  await page.getByRole("button", { name: "Next lesson →" }).click();
  await expect(page.getByRole("heading", { name: "Greatest Common Factor" })).toBeVisible();
  await expect(page.getByText(/answer key|teacher notes|gradebook/i)).toHaveCount(0);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
