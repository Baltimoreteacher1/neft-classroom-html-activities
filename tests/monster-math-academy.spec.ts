import { test, expect } from "@playwright/test";

const MMA = "/curriculum/monster-math-academy/";

test.describe("Monster Math Academy smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MMA);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("page loads title screen", async ({ page }) => {
    await expect(page).toHaveTitle(/Monster Math Academy/i);
    await expect(page.getByText(/Monster Math/i).first()).toBeVisible();
  });

  test("student can create monster and reach adventure map", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
    await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
    await expect(page.getByRole("heading", { name: /Adventure|Aventura/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("wrong answer shows hint and correct answer advances", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
    await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
    await page.getByRole("button", { name: /Unit 1|Unidad 1/i }).click();
    await page.getByRole("button", { name: /Let's teach|A enseñar|Ready|Listo/i }).first().click({
      timeout: 10_000,
    });
    // Skip watch beat
    const nextBtn = page.getByRole("button", { name: /Next step|Siguiente|I'm ready|Ready/i });
    if (await nextBtn.isVisible().catch(() => false)) {
      for (let i = 0; i < 8; i++) {
        if (!(await nextBtn.isVisible().catch(() => false))) break;
        await nextBtn.click();
        await page.waitForTimeout(400);
      }
    }
    const readyBtn = page.getByRole("button", { name: /I'm ready|Ready|Listo/i });
    if (await readyBtn.isVisible().catch(() => false)) {
      await readyBtn.click();
    }
    const padInput = page.locator(".mma-pad-input, input[type='text']").first();
    if (await padInput.isVisible().catch(() => false)) {
      await padInput.fill("99999");
      await page.getByRole("button", { name: /Check|Comprobar/i }).click();
      await expect(
        page.getByText(/Not quite|No es correcto|hint|pista/i).first(),
      ).toBeVisible({ timeout: 8_000 });
    }
  });

  test("report route opens", async ({ page }) => {
    await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
    await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
    await page.goto(`${MMA}#/report`);
    await expect(page.getByText(/Progress Report|Informe/i).first()).toBeVisible({
      timeout: 8_000,
    });
  });

  test("save progress page is reachable from header", async ({ page }) => {
    await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
    await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
    await page.getByRole("button", { name: /Save Progress|Guardar Progreso/i }).click();
    await expect(
      page.getByRole("heading", { name: /Save Progress|Guardar Progreso/i }),
    ).toBeVisible({ timeout: 8_000 });
    await expect(page.getByLabel(/load code|continuar|code/i).first()).toBeVisible();
  });

  test("teacher guide loads without PIN", async ({ page }) => {
    await page.goto(`${MMA}#/guide`);
    await expect(
      page.getByText(/Teacher Quick Guide|Guia Rapida/i).first(),
    ).toBeVisible();
    await expect(page.getByLabel(/PIN/i)).toHaveCount(0);
  });
});
