#!/usr/bin/env node
// Browser playthrough for every Language Game Studio route, including miss/revise feedback, transfer,
// local save, responsive rendering and the shared Passport-compatible game ledger.
import assert from "node:assert/strict";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import { GAMES } from "../access-practice-lab/src/games/registry.js";

const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://local").pathname);
  let file = join(root, pathname.endsWith("/") ? `${pathname}index.html` : pathname);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    if (pathname.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(pathname))
      file = join(root, "access-practice-lab/index.html");
    else {
      res.writeHead(404);
      return res.end();
    }
  }
  res.writeHead(200, {
    "content-type": types[extname(file)] || "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const failures = [];
try {
  const resumeContext = await browser.newContext({ viewport: { width: 375, height: 900 } });
  await resumeContext.addInitScript(() => {
    if (sessionStorage.getItem("access-game-studio-cleared") !== "1") {
      localStorage.clear();
      sessionStorage.setItem("access-game-studio-cleared", "1");
    }
  });
  const resumePage = await resumeContext.newPage();
  await resumePage.goto(
    `${base}/access-practice-lab/games/vocab-quest?grades=3-5&mode=A&len=quick&qa=1`,
    { waitUntil: "networkidle" },
  );
  await resumePage.click("[data-g-start]");
  await resumePage.waitForSelector(".gs-stage");
  const firstPick = await resumePage.evaluate(() => window.__ACCESS_GAMES__.plan({})[0].click);
  await resumePage.click(firstPick);
  await resumePage.waitForTimeout(120);
  const savedPick = await resumePage.evaluate(
    () =>
      JSON.parse(localStorage.getItem("accessPracticeLab:v1:games")).sessions["vocab-quest:3-5"]
        .state.match.sel,
  );
  assert.ok(savedPick, "an in-progress selection should save locally");
  await resumePage.reload({ waitUntil: "networkidle" });
  await resumePage.waitForSelector(".gs-stage");
  assert.equal(
    await resumePage.locator(`[data-g-pic="${savedPick}"]`).getAttribute("aria-pressed"),
    "true",
    "an in-progress game should resume after reload",
  );
  await resumePage.click("[data-g-hint]");
  await resumePage.waitForTimeout(100);
  const nextAction = await resumePage.evaluate(() => window.__ACCESS_GAMES__.plan({})[0].click);
  await resumePage.click(nextAction);
  await resumePage.waitForTimeout(150);
  assert.ok(
    (await resumePage.locator(".gs-progress-t").innerText()).startsWith("1/"),
    "a resumed game should accept a hint and answer",
  );
  await resumeContext.close();

  for (const [index, game] of GAMES.entries()) {
    const band = index % 2 ? "6-8" : "3-5";
    const support = ["A", "B", "C"][index % 3];
    const width = [375, 768, 1280][index % 3];
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(() => {
      if (sessionStorage.getItem("access-game-studio-cleared") !== "1") {
        localStorage.clear();
        sessionStorage.setItem("access-game-studio-cleared", "1");
      }
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.on("pageerror", (e) => {
      if (!/web-vitals/.test(e.message)) failures.push(`${game.id}: ${e.message}`);
    });
    page.on("console", (m) => {
      if (m.type() === "error" && !/web-vitals|favicon|Failed to load resource/.test(m.text()))
        failures.push(`${game.id}: ${m.text()}`);
    });
    await page.goto(
      `${base}/access-practice-lab/games/${game.id}?grades=${band}&mode=${support}&len=quick&qa=1`,
      { waitUntil: "networkidle" },
    );
    await page.waitForSelector("[data-g-start]");
    assert.equal(
      await page.locator("[data-game]").getAttribute("data-game"),
      game.id,
      `${game.id}: start screen did not load`,
    );
    await page.click("[data-g-start]");
    await page.waitForSelector(".gs-stage");
    let guard = 0;
    while (guard++ < 60) {
      const phase = await page.evaluate(
        () => window.__ACCESS_GAMES__?.phase?.() || document.querySelector(".gs")?.dataset.phase,
      );
      if (phase === "transfer") {
        const field = page.locator("[data-g-transfer-text]");
        if (await field.count())
          await field.fill(
            "I noticed a detail. It supports my idea because the evidence explains what happened. I can compare this result with another example and use precise words to explain my thinking.",
          );
        try {
          await page.waitForFunction(
            () => document.querySelector("[data-g-transfer-save]")?.disabled === false,
            null,
            { timeout: 3000 },
          );
        } catch (error) {
          throw new Error(
            `${game.id}: transfer save did not enable; text=${await field.inputValue().catch(() => "missing")}; count=${await field.evaluate((el) => el.nextElementSibling?.textContent).catch(() => "missing")}; ${error.message}`,
          );
        }
        await page.click("[data-g-transfer-save]");
        await page.waitForTimeout(100);
        break;
      }
      if (phase === "done") break;
      assert.equal(phase, "play", `${game.id}: expected play or transfer, got ${phase}`);
      const actions = await page.evaluate(
        (wrong) => window.__ACCESS_GAMES__.plan({ wrong }),
        guard % 3 === 0,
      );
      assert.ok(
        actions.length,
        `${game.id}: no next game action (phase=${phase}, guard=${guard}, progress=${JSON.stringify(await page.evaluate(() => window.__ACCESS_GAMES__?.progress?.()))})`,
      );
      for (const action of actions) {
        if (action.click) await page.click(action.click);
        else if (action.drag) {
          await page.click(action.drag[0]);
          await page.waitForTimeout(120);
          await page.click(action.drag[1]);
        } else if (action.fill) await page.fill(action.fill[0], action.fill[1]);
        else if (action.key) await page.keyboard.press(action.key);
        await page.waitForTimeout(180);
      }
      assert.ok(
        (await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )) <= 0,
        `${game.id}: horizontal overflow at ${width}px`,
      );
    }
    assert.ok(guard < 60, `${game.id}: playthrough did not finish`);
    await page.waitForFunction(() => document.querySelector(".gs")?.dataset.phase === "done");
    const finalPhase = await page.evaluate(() => document.querySelector(".gs")?.dataset.phase);
    assert.equal(finalPhase, "done", `${game.id}: expected completion screen`);
    const ledger = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("accessPracticeLab:v1:games") || "{}"),
    );
    assert.ok(
      ledger.history?.some((row) => row.game === game.id && row.band && row.transferWords > 0),
      `${game.id}: completion was not saved`,
    );
    if (index === 0) {
      await page.goto(`${base}/access-practice-lab/passport?grades=${band}`, {
        waitUntil: "networkidle",
      });
      await page.waitForSelector("#passGamesTitle");
      assert.ok(
        (await page.locator("#passGamesTitle").innerText()).includes("Language games"),
        "Passport should show the game summary",
      );
      assert.equal(
        await page.locator('[data-share-opt="games"]').isChecked(),
        true,
        "teacher share should include the optional game summary",
      );
      await page.goto(`${base}/access-practice-lab/Writing/A?grades=${band}`, {
        waitUntil: "networkidle",
      });
      await page.waitForSelector("#roomGamesTitle");
      assert.ok(
        await page.locator(".room-games-list a").count(),
        "skill room should link relevant games",
      );
      await page.goto(`${base}/access-practice-lab/family?grades=${band}`, {
        waitUntil: "networkidle",
      });
      assert.ok(
        await page.getByRole("link", { name: /Try a language game/i }).count(),
        "Family Corner should link to games",
      );
    }
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
assert.deepEqual(failures, [], "browser console/page errors");
console.log(
  `ACCESS Game Studio browser playthrough: ${GAMES.length} games completed across both bands and support modes.`,
);
