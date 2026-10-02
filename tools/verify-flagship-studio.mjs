import fs from "node:fs";
import { chromium } from "playwright";

const base = process.env.GAME_BASE_URL || "http://127.0.0.1:4179";
const output = "output/game-studio/flagship";
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const paths = [
  "math/unit-7/games/unit9-coordinate-quest.html",
  "math/unit-9/games/unit9-variable-velocity.html",
  "math/unit-8/games/unit7-equation-escape.html",
  "math/unit-1/games/unit1-factor-frenzy.html",
  "math/unit-6/games/unit6-expression-engine.html",
  "math/unit-10/games/unit10-volume-vault.html",
  "math/unit-3/games/unit3-ratio-rally.html",
  "math/unit-4/games/unit4-discount-dash.html",
  "math/unit-5/games/unit5-area-architect.html",
  "math/unit-2/games/unit2-fraction-foundry.html",
  "math/unit-2/games/unit2-fraction-kitchen.html",
  "math/statistics/games/unit8-stats-slam.html",
  "math/unit-3/6-rp-1game/index.html",
];
const results = [];
for (const path of paths) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/" + path, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1600);
  await page.locator("#fm-start").click();
  await page.waitForTimeout(700);
  const r = {
    path,
    errors,
    mobileOverflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    launch: await page.evaluate(() =>
      window.__flagshipGame
        ? window.__flagshipGame.scene
            .getScenes(true)
            .some((s) => ["Game", "GameScene"].includes(s.scene.key))
        : !!document.querySelector("#screen-play.on"),
    ),
  };
  if (await page.evaluate(() => !!window.__flagshipGame)) {
    await page.evaluate(() => {
      const s = window.__flagshipGame.scene.getScenes(true)[0];
      window.__timerFired = false;
      s.time.delayedCall(300, () => (window.__timerFired = true));
      window.GameStudio.pause();
    });
    await page.waitForTimeout(500);
    r.pause = await page.evaluate(
      () =>
        window.GameStudio.paused &&
        !window.__timerFired &&
        window.__flagshipGame.scene.getScenes(true).length === 0,
    );
    await page.evaluate(() => window.GameStudio.resume());
    await page.waitForTimeout(1400);
    r.resume = await page.evaluate(() => window.__timerFired);
  }
  if (
    /coordinate-quest|equation-escape|stats-slam|expression-engine|variable-velocity/.test(path)
  ) {
    const index = await page.evaluate(() => {
      const s = window.__flagshipGame.scene.getScenes(true)[0],
        q = s.current || s.questions[s.qIndex];
      return q.choices
        ? q.choices.findIndex((c) => c.correct)
        : q.options.findIndex((c) => c === q.correct);
    });
    await page.locator(".fm-actions button").nth(index).click();
    await page.waitForTimeout(250);
    r.correct = await page.evaluate(() =>
      document.querySelector(".fm-stats").textContent.includes("Streak 1"),
    );
    await page
      .locator("#fm-level")
      .selectOption({ index: (await page.locator("#fm-level option").count()) - 1 });
    await page.locator("#fm-start").click();
    await page.waitForTimeout(450);
    r.challenge = await page.evaluate(() => {
      const s = window.__flagshipGame.scene.getScenes(true)[0];
      return {
        difficulty: s.difficulty,
        tiers: s.questions?.map((q) => q.tier),
        level: s.levelIndex,
      };
    });
  }
  if (/fraction-foundry/.test(path)) {
    await page.locator(".fm-actions button").filter({ hasText: "Forge answer" }).click();
    await page.waitForTimeout(200);
    r.retry = await page.evaluate(
      () =>
        document.querySelector(".fm-feedback").dataset.result === "retry" &&
        !window.__flagshipGame.scene.getScenes(true)[0].locked,
    );
  }
  if (/area-architect/.test(path)) {
    await page.locator(".fm-actions button").filter({ hasText: "Lock construction" }).click();
    await page.waitForTimeout(200);
    r.feedback = await page.evaluate(() => !!document.querySelector(".fm-feedback").textContent);
  }
  if (/6-rp-1game/.test(path)) {
    await page.locator(".fm-actions button").filter({ hasText: "Serve recipe" }).click();
    await page.waitForTimeout(200);
    r.retry = await page.evaluate(
      () => document.querySelector(".fm-feedback").dataset.result === "retry",
    );
  }
  if (/fraction-kitchen/.test(path)) {
    const count = await page.evaluate(
      () => window.__flagshipGame.scene.getScenes(true)[0].order.targetNum,
    );
    for (let i = 0; i < count; i++)
      await page.locator(".fm-actions button").filter({ hasText: "Add one jug division" }).click();
    await page.locator(".fm-actions button").filter({ hasText: "Check fill" }).click();
    await page.waitForTimeout(200);
    r.correct = await page.evaluate(
      () => document.querySelector(".fm-feedback").dataset.result === "correct",
    );
  }
  await page.screenshot({
    path: output + "/" + path.replaceAll("/", "-").replace(".html", "") + "-mobile.png",
    fullPage: true,
  });
  results.push(r);
  console.log(JSON.stringify(r));
  await page.close();
}
fs.writeFileSync(output + "/results.json", JSON.stringify(results, null, 2));
await browser.close();
const failed = results.filter(
  (r) =>
    r.errors.length ||
    r.mobileOverflow ||
    !r.launch ||
    r.pause === false ||
    r.resume === false ||
    r.correct === false ||
    r.retry === false,
);
console.log(`${results.length} flagship games checked; ${failed.length} failures.`);
if (failed.length) process.exitCode = 1;
