/**
 * Headless smoke test for the Grade 6 math games.
 *
 * Uses the repo's root playwright.config.ts harness (builds the site and serves
 * the static `dist/` output on the contract port). For each game it loads the
 * page, lets Phaser boot, and asserts:
 *   - Phaser actually loaded (local vendor copy or CDN fallback),
 *   - a <canvas> rendering surface was created,
 *   - no uncaught JS exceptions fired,
 *   - no broken SAME-ORIGIN asset requests (a real missing /assets or
 *     /games/vendor file), and
 *   - no unexpected console errors.
 *
 * Cross-origin calls (the EduPulse gradebook Worker) and benign WebAudio /
 * favicon noise are ignored — they are not game defects.
 */
import { test, expect } from "@playwright/test";

const GAMES: string[] = [
  // Cluster games (interactive 2D)
  "/math/games/u1-factor-frenzy/",
  "/math/games/u1-decimal-dash/",
  "/math/games/u2-fraction-frenzy/",
  "/math/games/u3-ratio-rush/",
  "/math/games/u4-percent-power/",
  "/math/games/u5-area-attack/",
  "/math/games/u6-expression-express/",
  "/math/games/u7-equation-quest/",
  "/math/games/u8-data-dash/",
  "/math/games/u9-coordinate-quest/",
  "/math/games/u10-volume-blast/",
  // Per-unit flagship games
  "/math/unit-1/games/unit1-factor-frenzy.html",
  "/math/unit-2/games/unit2-fraction-foundry.html",
  "/math/unit-2/games/unit2-fraction-kitchen.html",
  "/math/unit-3/games/unit3-ratio-rally.html",
  "/math/unit-4/games/unit4-discount-dash.html",
  "/math/unit-5/games/unit5-area-architect.html",
  "/math/unit-6/games/unit6-expression-engine.html",
  "/math/unit-7/games/unit9-coordinate-quest.html",
  "/math/unit-8/games/unit7-equation-escape.html",
  "/math/unit-9/games/unit9-variable-velocity.html",
  "/math/unit-10/games/unit10-volume-vault.html",
  "/math/statistics/games/unit8-stats-slam.html",
];

const IGNORE_404 = [/\/favicon\.ico$/];

const IGNORE_CONSOLE = [
  /edupulse/i,
  /workers\.dev/i,
  /gradebook/i,
  /AudioContext|webaudio|autoplay/i,
  /favicon/i,
  /ERR_(NETWORK|INTERNET|CONNECTION|NAME_NOT_RESOLVED|BLOCKED)/i,
];

for (const url of GAMES) {
  test(`game boots: ${url}`, async ({ page, baseURL }) => {
    const pageErrors: string[] = [];
    const badResponses: string[] = [];
    const consoleErrors: string[] = [];

    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("response", (res) => {
      const u = res.url();
      if (baseURL && !u.startsWith(baseURL)) return; // ignore cross-origin
      if (res.status() < 400) return;
      if (IGNORE_404.some((re) => re.test(u))) return;
      badResponses.push(`${res.status()} ${u}`);
    });
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      const text = msg.text();
      if (IGNORE_CONSOLE.some((re) => re.test(text))) return;
      consoleErrors.push(text);
    });

    await page.goto(url, { waitUntil: "load", timeout: 30_000 });
    // Allow Phaser to boot, generate textures, and start the first scene.
    await page.waitForTimeout(2500);

    const phaserType = await page.evaluate(
      () => typeof (window as unknown as { Phaser?: unknown }).Phaser,
    );
    expect(phaserType, `Phaser did not load on ${url}`).not.toBe("undefined");

    const canvasCount = await page.locator("canvas").count();
    expect(canvasCount, `no <canvas> rendered on ${url}`).toBeGreaterThan(0);

    expect(pageErrors, `uncaught error(s) on ${url}`).toEqual([]);
    expect(badResponses, `broken same-origin asset(s) on ${url}`).toEqual([]);
    expect(consoleErrors, `console error(s) on ${url}`).toEqual([]);
  });
}
