/**
 * Headless smoke test for the Grade 6 math games.
 *
 * Uses the repo's root playwright.config.ts harness (builds the site and serves
 * the static `dist/` output on the contract port). For each game it loads the
 * page, lets the engine boot, then interacts with it (click to start + a spread
 * of common keys) so the Title→Game transition and first-input handlers run.
 * It asserts:
 *   - the game rendered (a <canvas> for Phaser games, real DOM for the few
 *     DOM-engine games),
 *   - the rendering surface survives interaction (no crash mid-game),
 *   - no uncaught JS exceptions fired (during boot OR interaction),
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

    // The shared Game FX kit deliberately opens a one-time "Mission Brief"
    // dialog (#gfx-mission-brief, aria-modal) on top of the whole page before
    // play. On games that ALSO have a vocab gate (u1-factor-frenzy,
    // unit10-volume-vault) it sits above the gate and intercepts pointer
    // events, so the gate-dismissal clicks below timed out. The dialog is an
    // intentional site feature — dismiss it first (stale test, not a game bug).
    const missionBrief = page.locator("#gfx-mission-brief");
    await missionBrief.waitFor({ state: "visible", timeout: 1500 }).catch(() => {});
    if (await missionBrief.isVisible()) {
      await missionBrief
        .locator("button:visible")
        .last()
        .click({ timeout: 3_000 })
        .catch(() => {});
      await missionBrief.waitFor({ state: "hidden", timeout: 2_000 }).catch(() => {});
    }

    // Some games show a one-time "vocab gate" modal (id ending in -vocab) BEFORE
    // play; a few (e.g. u2-fraction-frenzy) defer creating the Phaser canvas
    // until it is dismissed. Dismiss it so the real game flow runs. This repo's
    // gates are single "I'm ready" buttons (#fr-vocab-go, #vocab-go, …) — there
    // are no Back/Next step controls — so click the gate's primary (last visible)
    // button; the loop also tolerates any future step-through gate. Wait for the
    // gate rather than sleeping blindly. No-op for games without a gate.
    const vocabGate = page.locator('[id$="-vocab"]').first();
    await vocabGate.waitFor({ state: "visible", timeout: 1500 }).catch(() => {});
    for (let i = 0; i < 8 && (await vocabGate.isVisible()); i++) {
      await vocabGate
        .locator("button:visible")
        .last()
        .click({ timeout: 3_000 })
        .catch(() => {});
      await page.waitForTimeout(300);
    }

    // Allow the game engine to boot, build textures, and start the first scene.
    await page.waitForTimeout(2500);

    // Most games are Phaser (canvas); a few use a DOM-based 2D engine. Verify
    // each "rendered something" with an engine-appropriate signal rather than
    // assuming Phaser everywhere.
    const phaserLoaded = await page.evaluate(
      () => typeof (window as unknown as { Phaser?: unknown }).Phaser !== "undefined",
    );
    const canvasCount = await page.locator("canvas").count();
    const bodyTextLen = await page.evaluate(
      () => (document.body?.innerText || "").trim().length,
    );

    if (phaserLoaded || canvasCount > 0) {
      // Canvas-engine game: a rendering surface must exist.
      expect(canvasCount, `no <canvas> rendered on ${url}`).toBeGreaterThan(0);
    } else {
      // DOM-engine game: the page must not be blank (real content rendered).
      expect(
        bodyTextLen,
        `page appears blank (no canvas, no DOM content) on ${url}`,
      ).toBeGreaterThan(40);
    }

    // ── Exercise the game PAST boot ────────────────────────────────────────
    // Click to focus/start, then send a spread of common inputs (advance a
    // title, answer 1–4, move) so the Title→Game transition and first-input
    // handlers actually run. Mechanics differ per game, so we don't assert
    // specific content — only that nothing crashed (caught by the error
    // listeners below) and the surface survives. Best-effort: every step is
    // guarded so a game that ignores an input can't fail the test.
    const urlBefore = page.url();
    const target =
      canvasCount > 0 ? page.locator("canvas").first() : page.locator("body");
    await target.click({ timeout: 5_000 }).catch(() => {});
    for (const key of [
      "Enter",
      "Space",
      "Digit1",
      "ArrowRight",
      "ArrowUp",
      "Space",
      "Digit2",
      "ArrowLeft",
    ]) {
      await page.keyboard.press(key).catch(() => {});
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(800);

    // If an input didn't navigate away, a canvas game must still have its
    // surface (a crash mid-game would tear it down).
    if ((phaserLoaded || canvasCount > 0) && page.url() === urlBefore) {
      expect(
        await page.locator("canvas").count(),
        `canvas disappeared after input on ${url}`,
      ).toBeGreaterThan(0);
    }

    // These accumulate across BOTH boot and the interaction above.
    expect(pageErrors, `uncaught error(s) on ${url}`).toEqual([]);
    expect(badResponses, `broken same-origin asset(s) on ${url}`).toEqual([]);
    expect(consoleErrors, `console error(s) on ${url}`).toEqual([]);
  });
}
