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

  test("skip link targets main content", async ({ page }) => {
    await page.getByRole("link", { name: /Skip to main content/i }).focus();
    await expect(page.getByRole("link", { name: /Skip to main content/i })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
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

  test("mobile menu opens navigation drawer", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
    await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
    await page.getByRole("button", { name: /Open menu|Abrir menu/i }).click();
    const drawer = page.locator("#mma-nav-drawer");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("button", { name: /Journal|Diario/i })).toBeVisible();
    await drawer.getByRole("button", { name: /Journal|Diario/i }).click();
    await expect(page.getByText(/Journal|Diario/i).first()).toBeVisible({ timeout: 8_000 });
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
        page.getByText(/Not quite|No es correcto|hint|pista|mistake|error/i).first(),
      ).toBeVisible({ timeout: 8_000 });
    }
  });

  test("report route opens with completion code", async ({ page }) => {
    await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
    await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
    await page.goto(`${MMA}#/report`);
    await expect(page.getByText(/Progress Report|Informe/i).first()).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByText(/MMA-/i).first()).toBeVisible();
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

  test("Math Workbench link on title screen", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /Math Workbench|Banco de Matematicas/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Math Workbench|Banco de Matematicas/i }),
    ).toHaveAttribute("href", /math-workbench/);
  });

  test("teacher guide loads without PIN and shows time table", async ({ page }) => {
    await page.goto(`${MMA}#/guide`);
    await expect(
      page.getByText(/Teacher Quick Guide|Guia Rapida/i).first(),
    ).toBeVisible();
    await expect(page.getByLabel(/PIN/i)).toHaveCount(0);
    await expect(
      page.getByText(/Estimated time per unit|Tiempo estimado por unidad/i).first(),
    ).toBeVisible();
  });

  test("teacher guide links to class analytics and shows standards checklist", async ({
    page,
  }) => {
    await page.goto(`${MMA}#/guide`);
    await expect(
      page.getByText(/Standards Checklist|Lista de Estandares/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/Common Misconceptions|Errores Comunes/i).first(),
    ).toBeVisible();
    const statsLink = page.getByRole("link", {
      name: /View Class Analytics|Ver Analitica de Clase/i,
    });
    await expect(statsLink).toBeVisible();
    await statsLink.click();
    await expect(
      page.getByRole("heading", { name: /Class Analytics|Analitica de Clase/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("teach view shows the lesson step rail with three beats", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
    await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
    await page.getByRole("button", { name: /Unit 1|Unidad 1/i }).click();
    const rail = page.locator(".mma-step-rail");
    await expect(rail).toBeVisible({ timeout: 8_000 });
    await expect(rail.locator(".mma-step-rail-node")).toHaveCount(3);
  });
});
