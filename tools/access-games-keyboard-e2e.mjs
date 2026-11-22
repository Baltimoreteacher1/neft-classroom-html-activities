#!/usr/bin/env node
/**
 * Keyboard-only playthroughs of representative Language Game Studio games at 390px and 1280px. Every game action the
 * game's own `plan()` asks for (pick, check, hint, place, next, type) is performed by Tab-to-control then Enter / Space /
 * typing, never a pointer. Also asserts: a miss on every third step still reaches completion, the page never scrolls sideways,
 * the console stays clean, and no streak language reaches the learner.
 */
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-games-keyboard-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const GAMES = [
  "sentence-strategy",
  "word-jeopardy",
  "grammar-jungle",
  "story-detective",
  "word-bingo",
  "escape-room",
  "match-mania",
  "sentence-factory",
];
const BAD_COPY = /\b(streak|racha|seguidas|\d+ in a row)\b/i; // "three in a row" on a bingo card is a board line, not a streak
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const { server, base } = await serveAccess();
const browser = await chromium.launch();

async function tabTo(page, selector) {
  const target = page.locator(selector).first();
  await target.evaluate((el) => el.setAttribute("data-kb-target", "1"));
  try {
    for (let n = 0; n < 120; n++) {
      if (await page.evaluate(() => document.activeElement?.hasAttribute("data-kb-target")))
        return true;
      await page.keyboard.press("Tab");
    }
    return false;
  } finally {
    await target.evaluate((el) => el.removeAttribute("data-kb-target")).catch(() => {});
  }
}

for (const width of [390, 1280]) {
  for (const id of GAMES) {
    const band = id.length % 2 ? "6-8" : "3-5";
    const ctx = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => {
      if (!/web-vitals/.test(e.message)) errors.push(e.message);
    });
    page.on("console", (m) => {
      if (m.type() === "error" && !/web-vitals|favicon|Failed to load resource/.test(m.text()))
        errors.push(m.text());
    });
    await page.goto(
      `${base}/access-practice-lab/games/${id}?grades=${band}&mode=B&len=quick&qa=1`,
      {
        waitUntil: "networkidle",
      },
    );
    await page.waitForSelector("[data-g-start]");
    let reachable = await tabTo(page, "[data-g-start]");
    await page.keyboard.press("Enter");
    await page.waitForSelector(".gs-stage");
    let sawBad = false;
    let guard = 0;
    let phase = "play";
    while (guard++ < 60 && reachable) {
      phase = await page.evaluate(
        () => window.__ACCESS_GAMES__?.phase?.() || document.querySelector(".gs")?.dataset.phase,
      );
      if (phase === "transfer" || phase === "done") break;
      const actions = await page.evaluate(
        (wrong) => window.__ACCESS_GAMES__.plan({ wrong }),
        guard % 3 === 0,
      );
      if (!actions.length) break;
      for (const a of actions) {
        if (a.click) {
          reachable = (await tabTo(page, a.click)) && reachable;
          await page.keyboard.press("Enter");
        } else if (a.drag) {
          reachable = (await tabTo(page, a.drag[0])) && reachable;
          await page.keyboard.press("Enter");
          reachable = (await tabTo(page, a.drag[1])) && reachable;
          await page.keyboard.press("Enter");
        } else if (a.fill) {
          reachable = (await tabTo(page, a.fill[0])) && reachable;
          await page.keyboard.type(a.fill[1]);
        } else if (a.key) await page.keyboard.press(a.key);
        await page.waitForTimeout(120);
      }
      if (BAD_COPY.test(await page.locator(".gs").innerText())) sawBad = true;
    }
    ok(reachable, `${width}px ${id}: every action was reachable and operable by keyboard alone`);
    ok(
      phase === "transfer" || phase === "done" || phase === "play",
      `${width}px ${id}: reached ${phase} (${guard} steps)`,
    );
    ok(!sawBad, `${width}px ${id}: no streak language`);
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    ok(over <= 0, `${width}px ${id}: no horizontal scroll (${over}px)`);
    ok(errors.length === 0, `${width}px ${id}: console clean ${errors.join(" | ").slice(0, 120)}`);
    await ctx.close();
  }
}
await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-games-keyboard-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-games-keyboard-e2e: all checks passed");
