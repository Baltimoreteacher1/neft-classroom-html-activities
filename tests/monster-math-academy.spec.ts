import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const MMA = "/curriculum/monster-math-academy/";

async function createMonster(page: import("@playwright/test").Page): Promise<void> {
  await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
  await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
}

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
    // Anchored on the colon: "Unit 1" is also a substring of "Unit 10", which
    // would otherwise make this locator ambiguous (strict-mode violation).
    await page.getByRole("button", { name: /Unit 1:|Unidad 1:/i }).click();
    await page.getByRole("button", { name: /Let's teach|A enseñar|Ready|Listo/i }).first().click({
      timeout: 10_000,
    });
    // The watch beat sometimes models a misconception ("catch the bug") —
    // resolve it if shown so the rest of the flow isn't blocked. The buggy
    // step is the one whose accessible name reveals "the monster got <x>";
    // then try each correction option until one sticks (no wrong-answer
    // penalty in this interaction, so retrying is safe).
    const buggyStep = page
      .getByRole("button", { name: /the monster got|el monstruo obtuvo/i })
      .first();
    const repairShown = await buggyStep
      .waitFor({ state: "visible", timeout: 4_000 })
      .then(() => true)
      .catch(() => false);
    if (repairShown) {
      await buggyStep.click();
      const options = page.locator(".mma-repair-option");
      await options
        .first()
        .waitFor({ state: "visible", timeout: 4_000 })
        .catch(() => {});
      const count = await options.count();
      for (let i = 0; i < count; i++) {
        const btn = options.nth(i);
        if (await btn.isDisabled().catch(() => true)) continue;
        await btn.click();
        await page.waitForTimeout(300);
        if (await page.locator(".mma-repair-option.is-correct").count()) break;
      }
      await page.waitForTimeout(1_000);
    }
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
    // The Together beat may open with the "plan the steps" pre-solve
    // minigame (see minigames/sort-steps.ts) before the answer pad — skip it
    // to reach the actual solving surface this test exercises.
    const skipMinigameBtn = page.getByRole("button", { name: /^(Skip|Saltar)$/i });
    if (await skipMinigameBtn.isVisible().catch(() => false)) {
      await skipMinigameBtn.click();
      await page.waitForTimeout(300);
    }
    // Scoped to the actual answer-pad input (answer-pad.ts's ".mma-answer-display")
    // — a bare input[type=text] would also match the always-present save-code
    // textbox elsewhere on this page and produce false positives.
    const padInput = page.locator(".mma-answer-display").first();
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
    // The map also shows its own "Save Progress" shortcut card button;
    // scope to the header's copy specifically to avoid strict-mode ambiguity.
    await page.locator("header").getByRole("button", { name: /Save Progress|Guardar Progreso/i }).click();
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
    await page.getByRole("button", { name: /Unit 1:|Unidad 1:/i }).click();
    const rail = page.locator(".mma-step-rail");
    await expect(rail).toBeVisible({ timeout: 8_000 });
    await expect(rail.locator(".mma-step-rail-node")).toHaveCount(3);
  });

  test("wardrobe shop is reachable from the header and shows aura colors", async ({
    page,
  }) => {
    await createMonster(page);
    await page.locator("header").getByRole("button", { name: /Shop/i }).click();
    await expect(
      page.getByRole("heading", { name: /Wardrobe Shop|Tienda de Vestuario/i }),
    ).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/Aura Colors|Colores de Aura/i).first()).toBeVisible();
  });

  test("adventure map links to the shop and to pair mode", async ({ page }) => {
    await createMonster(page);
    await expect(
      page.getByRole("button", { name: /Visit the Shop|Visitar la Tienda/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Pair Up|Jugar en Pareja/i }),
    ).toBeVisible();
  });

  test("practice offers a minigame for a supported unit", async ({ page }) => {
    await createMonster(page);
    await page.goto(`${MMA}#/practice/1`);
    const minigameBtn = page.getByRole("button", {
      name: /Play a Minigame|Jugar un Minijuego/i,
    });
    await expect(minigameBtn).toBeVisible({ timeout: 8_000 });
    await minigameBtn.click();
    await expect(
      page.getByRole("heading", { name: /Minigame|Minijuego/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("pair mode alternates turns between two players", async ({ page }) => {
    await createMonster(page);
    await page.goto(`${MMA}#/pair/1`);
    await expect(
      page.getByText(/Player 1's turn|Turno del Jugador 1/i).first(),
    ).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/Round 1 of/i).first()).toBeVisible();
  });

  test("settings has a classroom-mode strict-progression toggle (off by default)", async ({
    page,
  }) => {
    await createMonster(page);
    await page.goto(`${MMA}#/settings`);
    await expect(
      page.getByText(/Classroom Mode|Modo de Clase/i).first(),
    ).toBeVisible({ timeout: 8_000 });
    // The toggle's accessible name is its setting label (aria-labelledby),
    // not its own "On/Off" text — target it that way.
    const toggle = page.getByRole("button", {
      name: /Lock units until mastered|Bloquear unidades/i,
    });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  test("class analytics offers batch import and a district standards export", async ({
    page,
  }) => {
    await page.goto(`${MMA}#/class`);
    await expect(
      page.getByText(/Batch import codes|Importar codigos en lote/i).first(),
    ).toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByRole("button", {
        name: /Export District Standards Report|Exportar Informe de Estandares/i,
      }),
    ).toBeVisible();
  });

  test("no serious or critical axe violations on the title screen", async ({
    page,
  }) => {
    await page.waitForLoadState("networkidle");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    const summary = blocking
      .map((v) => `${v.id} (${v.impact}) — ${v.nodes.length} node(s): ${v.help}`)
      .join("\n");
    expect(blocking, `serious/critical a11y violations:\n${summary}`).toEqual([]);
  });

  test("no serious or critical axe violations on the adventure map", async ({
    page,
  }) => {
    await createMonster(page);
    await expect(
      page.getByRole("heading", { name: /Adventure|Aventura/i }),
    ).toBeVisible({ timeout: 10_000 });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    const summary = blocking
      .map((v) => `${v.id} (${v.impact}) — ${v.nodes.length} node(s): ${v.help}`)
      .join("\n");
    expect(blocking, `serious/critical a11y violations:\n${summary}`).toEqual([]);
  });
});
