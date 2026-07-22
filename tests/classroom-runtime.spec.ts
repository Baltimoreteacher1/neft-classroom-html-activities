import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("classroom runtime compiles, adapts, reviews, and forks in English/Spanish only", async ({
  page,
}) => {
  await page.goto("/curriculum/runtime/");
  await expect(page.getByRole("status")).toContainText("74 canonical lessons ready");

  const language = page.getByLabel("Bilingual mode");
  await expect(language.locator("option")).toHaveCount(2);
  await expect(language.locator("option")).toHaveText(["English", "Español"]);
  await language.selectOption("es");
  await page.getByLabel("What should students understand?").fill("Comparar dos estrategias");
  await page.getByRole("button", { name: "Compile classroom runtime" }).click();

  await expect(page.getByRole("heading", { name: "Prime Factorization" })).toBeVisible();
  await expect(page.getByText("¿Qué notas? ¿Qué permanece igual?")).toBeVisible();
  await expect(page.locator("#agent-reviews .review-row")).toHaveCount(7);
  await page.getByRole("button", { name: "5", exact: true }).click();
  await expect(page.getByRole("button", { name: "5", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByRole("button", { name: "03 Evidence" }).click();
  await page.getByLabel("Secure").fill("4");
  await page.getByLabel("Developing").fill("3");
  await page.getByLabel("Stuck").fill("5");
  await page
    .getByLabel("De-identified reasoning sample")
    .fill("I used a factor tree because every leaf is prime.");
  await page.getByRole("button", { name: "Update reasoning model" }).click();
  await expect(page.locator("#adaptation-level")).toHaveText("reteach");
  await expect(page.locator("#reasoning-state")).toHaveText("connected");

  await page.getByRole("button", { name: "04 Improve" }).click();
  await expect(page.locator("#revision-status")).toHaveText("awaiting-teacher-approval");
  await page.getByRole("button", { name: "Teacher approves revision" }).click();
  await expect(page.locator("#revision-status")).toHaveText("teacher-approved");

  await page.getByRole("button", { name: "05 Fork" }).click();
  await page.getByLabel("New context or theme").fill("Baltimore neighborhood garden");
  await page.getByRole("button", { name: "Create controlled fork" }).click();
  await expect(page.locator("#fork-theme-output")).toHaveText("Baltimore neighborhood garden");
  await expect(page.locator("#fork-invariants")).toContainText("6.NOS.4");
});

test("runtime has no serious accessibility violations", async ({ page }) => {
  await page.goto("/curriculum/runtime/");
  await expect(page.getByRole("status")).toContainText("canonical lessons ready");
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
  expect(blocking, blocking.map(({ id, help }) => `${id}: ${help}`).join("\n")).toEqual([]);
});

test("clicking a left-side unit keeps its lessons visible and launchable", async ({ page }) => {
  await page.goto("/curriculum/");
  const rail = page.getByRole("navigation", { name: "Units" });
  await expect(rail).toBeVisible();
  await rail.getByRole("button", { name: /Unit 8/ }).click();

  const activeUnit = page.locator("#interactive-hub .unit-card.curr-active");
  await expect(activeUnit).toContainText("Unit 8");
  await expect(activeUnit.locator('a[href^="/lessons/8-"]')).not.toHaveCount(0);
  await expect(activeUnit.locator('a[href="/lessons/8-1/"]').first()).toBeVisible();
  await expect(activeUnit).not.toHaveAttribute("hidden", "");
  await expect(activeUnit).not.toHaveAttribute("inert", "");
});
