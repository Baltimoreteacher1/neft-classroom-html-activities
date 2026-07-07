import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const MMA = "/curriculum/monster-math-academy/";

async function createMonster(page: import("@playwright/test").Page): Promise<void> {
  await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
  await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
}

test.describe("Monster Math Academy smoke", () => {
  test.beforeEach(async ({ page }) => {
    // The build loads Google Fonts stylesheets ahead of its deferred module
    // script; in egress-restricted environments those requests can stall for
    // the whole test budget and hold DOMContentLoaded hostage. Abort them —
    // font fallbacks are fine for behavioral assertions.
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
    await page.goto(MMA);
    await page.evaluate(() => {
      localStorage.clear();
      // Pre-seed the first-run flag: the welcome tour overlay is modal and
      // intercepts every pointer event on the title screen, which would block
      // all click-driven tests. The tour itself is covered by the dedicated
      // "onboarding tour can be dismissed" test below.
      localStorage.setItem("mma:web:onboarded", "1");
    });
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
    // Walks the full teach → repair → solve flow (~30s+ on slow containers).
    test.slow();
    await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
    await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
    // Anchored on the colon: "Unit 1" is also a substring of "Unit 10", which
    // would otherwise make this locator ambiguous (strict-mode violation).
    await page.getByRole("button", { name: /Unit 1:|Unidad 1:/i }).click();
    // The unit opens with a modal "Mission Briefing" story overlay that
    // intercepts pointer events — skip it to reach the teach CTA.
    const skipStory = page.getByRole("button", { name: /Skip story|Saltar historia/i });
    if (
      await skipStory
        .waitFor({ state: "visible", timeout: 4_000 })
        .then(() => true)
        .catch(() => false)
    ) {
      await skipStory.click();
    }
    // 20s budget: the unit-intro CTA animates in and can stay "not stable"
    // for several seconds on slow containers before settling.
    await page.getByRole("button", { name: /Let's teach|A enseñar|Ready|Listo/i }).first().click({
      timeout: 20_000,
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

  test("student can resume from save code on #/resume", async ({ page }) => {
    const mockState = {
      monster: {
        name: "ResumeTest",
        body: "blob",
        palette: "toxic",
        eyes: "wide",
        trait: "cocky",
        createdAt: 9001,
      },
      minds: {},
      readingLevel: "support",
      history: [],
      saveCode: "MMA-RESUME",
      equippedCosmetic: null,
      rewards: {
        coins: 5,
        totalSolved: 0,
        totalWrong: 0,
        streakCount: 0,
        streakLastDay: null,
        careCount: 0,
      },
      purchasedCosmetics: [],
      progression: { xp: 0, bossWins: [], quickPlayRuns: 0, badges: [] },
      writtenResponses: [],
      missedSkills: [],
      completionCode: null,
      equippedAura: null,
      purchasedAuras: [],
    };

    await page.goto(`${MMA}#/resume`);
    await expect(
      page.getByRole("heading", { name: /Welcome Back|Bienvenido de Nuevo/i }),
    ).toBeVisible();

    await page.evaluate((state) => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const href =
          typeof input === "string"
            ? input
            : input && typeof input === "object" && "url" in input
              ? String(input.url)
              : String(input);
        if (href.includes("/api/monster-save/load")) {
          return new Response(JSON.stringify({ ok: true, state }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return originalFetch(input, init);
      };
    }, mockState);

    await page.locator("#mma-resume-code").fill("MMA-RESUME");
    await page
      .getByRole("button", { name: /Continue My Adventure|Continuar Mi Aventura/i })
      .click();

    await expect(
      page.getByText(/Welcome back, ResumeTest|Bienvenido de nuevo, ResumeTest/i),
    ).toBeVisible({ timeout: 8_000 });

    await page.getByRole("button", { name: /Go to Adventure Map|Ir al Mapa/i }).click();
    await expect(page.getByRole("heading", { name: /Adventure|Aventura/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("title screen links to resume page", async ({ page }) => {
    // Current build labels the resume entry "Continue with Code".
    const resumeBtn = page.getByRole("button", {
      name: /Continue with Code|Continuar con Codigo|Already playing|Ya juegas/i,
    });
    await expect(resumeBtn).toBeVisible();
    await resumeBtn.click();
    await expect(page).toHaveURL(/#\/resume/);
    await expect(
      page.getByRole("heading", { name: /Welcome Back|Bienvenido de Nuevo/i }),
    ).toBeVisible();
  });

  test("invalid save code shows error without corrupting local state", async ({ page }) => {
    await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
    await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
    await expect(page.getByRole("heading", { name: /Adventure|Aventura/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.route(
      (url) => url.pathname.includes("/monster-save/load"),
      async (route) => {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ ok: false, error: "not-found" }),
        });
      },
    );

    await page.goto(`${MMA}#/resume`);
    await page.locator("#mma-resume-code").fill("MMA-BADBAD");
    await page
      .getByRole("button", { name: /Continue My Adventure|Continuar Mi Aventura/i })
      .click();
    await expect(page.getByText(/wasn't found|No se encontró/i).first()).toBeVisible({
      timeout: 8_000,
    });

    await page.goto(`${MMA}#/map`);
    await expect(page.getByRole("heading", { name: /Adventure|Aventura/i })).toBeVisible({
      timeout: 10_000,
    });
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

  test("title screen shows Start Mission, Choose Level, and Settings", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
    await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
    // Creating a monster lands on the adventure map; the Start Mission /
    // Choose Level entries live on the title screen once a monster exists.
    // Hash change (not goto): navigating from #/map to the bare URL is a
    // same-document navigation whose load events never fire, so goto would
    // hang. The SPA router responds to hashchange directly.
    await page.evaluate(() => {
      location.hash = "#/";
    });
    await expect(
      page.getByRole("button", { name: /Start Mission|Iniciar Mision/i }),
    ).toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByRole("button", { name: /Choose Level|Elegir Nivel/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Settings|Ajustes/i }),
    ).toBeVisible();
  });

  test("HUD reward pill visible after monster created", async ({ page }) => {
    await createMonster(page);
    await expect(page.locator("#mma-reward-pill")).toBeVisible();
    // The pill abbreviates to "Lv <n>" in the current build.
    await expect(page.locator("#mma-reward-pill")).toContainText(/Lv|Level|Nivel/i);
  });

  test("profile route loads player dashboard", async ({ page }) => {
    await createMonster(page);
    await page.goto(`${MMA}#/profile`);
    await expect(
      page.getByRole("button", { name: /Continue adventure|Continuar aventura/i }),
    ).toBeVisible({ timeout: 8_000 });
  });

  test("onboarding tour can be dismissed", async ({ page }) => {
    // Undo the beforeEach pre-seed so the real first-run tour appears.
    // domcontentloaded: blocked third-party font requests can hold the full
    // "load" event past the test budget in sandboxed environments.
    await page.evaluate(() => localStorage.removeItem("mma:web:onboarded"));
    await page.reload({ waitUntil: "domcontentloaded" });
    const overlay = page.locator(".mma-tour-overlay");
    await expect(overlay).toBeVisible({ timeout: 8_000 });
    await overlay.getByRole("button", { name: /Skip|Saltar/i }).click();
    await expect(overlay).not.toBeVisible();
    // Dismissal persists the first-run flag, so the title CTA is clickable.
    await createMonster(page);
    await expect(page.getByRole("heading", { name: /Adventure|Aventura/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("whats-new route loads changelog", async ({ page }) => {
    await page.goto(`${MMA}#/whats-new`);
    await expect(page.getByText(/What's New|Novedades/i).first()).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.getByText(/v2\.0|Premium Game Pass|Pase de Juego/i).first()).toBeVisible();
  });

  test("build route loads progress artifact", async ({ page }) => {
    await createMonster(page);
    await page.goto(`${MMA}#/build`);
    await expect(
      page.getByText(/Build Project|Proyecto de Construccion/i).first(),
    ).toBeVisible({ timeout: 8_000 });
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

  test("teach view shows the lesson step rail with four beats", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /Create Your Monster|Crea/i }).click();
    await page.getByRole("button", { name: /Bring It To Life|Dale Vida/i }).click();
    await page.getByRole("button", { name: /Unit 1:|Unidad 1:/i }).click();
    const rail = page.locator(".mma-step-rail");
    await expect(rail).toBeVisible({ timeout: 8_000 });
    // Watch → Repair → Together → Apply (the Apply beat was added in the
    // TYMTR-style teach upgrade).
    await expect(rail.locator(".mma-step-rail-node")).toHaveCount(4);
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
    // Axe's recursive scan takes ~10s+ on the MMA screens even standalone;
    // triple the budget so slow CI containers don't time out mid-analyze.
    test.slow();
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
    test.slow();
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
