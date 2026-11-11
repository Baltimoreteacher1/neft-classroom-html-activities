// Runtime audit of every arcade game and review surface, driven in a real browser.
//
// Source gates cannot see what a student sees: the shared scaffold overlay and the
// live "model" panel are chosen at run time, so a game can ship a correct coach
// tip in its HTML and still show another topic's picture after a wrong answer.
// This script loads each surface, launches a mission where one exists, gives a
// wrong answer, and records what the page actually rendered.
//
// Usage:  node tools/audit-arcade-games.mjs [--only=id,id] [--root=dist] [--out=reports/arcade-overhaul/<label>] [--shots]
// Serves the BUILT site by default: the source tree cannot resolve build-time specifiers
// (web-vitals, font bundles), which would bury real defects under 65 fake 404s.
// Output: <out>/audit.json (machine readable) and, with --shots, <out>/<id>.jpg
// Report-only: exits 0 unless the browser is unavailable (exit 3 = SKIP).

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ARCADE_GAMES, ARCADE_SURFACES } from "./lib/arcade-registry.mjs";
import { launchBrowser, startStaticServer } from "./lib/lesson-gate-kit.mjs";

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .map((a) => a.replace(/^--/, "").split("="))
    .map(([k, v]) => [k, v ?? true]),
);
const out = resolve(args.out || "reports/arcade-overhaul/audit");
mkdirSync(out, { recursive: true });

const browser = await launchBrowser();
if (!browser) {
  console.error("SKIP: no Chromium available (set PW_CHROMIUM_PATH)");
  process.exit(3);
}
const server = await startStaticServer(resolve(args.root || "dist"));

/** Reads what a student can see of the model/scaffold/coach layers on a flagship page. */
const probe = () => {
  const txt = (s) => document.querySelector(s)?.innerText?.trim() || null;
  return {
    question: txt(".fm-question"),
    coach: txt("#ewl-coach-text"),
    liveModel: document.querySelector(".fm-live-svg svg")?.getAttribute("aria-label") || null,
    scaffold: txt(".gs-cdda-card"),
    scaffoldModel: document.querySelector(".gs-cdda-card svg")?.getAttribute("aria-label") || null,
    rewind: txt("[data-pattern]"),
    actions: [...document.querySelectorAll(".fm-actions button")].map((b) => b.textContent.trim()),
  };
};

const rows = [];
const only = args.only ? String(args.only).split(",") : null;
for (const game of [...ARCADE_GAMES, ...ARCADE_SURFACES]) {
  if (only && !only.includes(game.id)) continue;
  const row = { id: game.id, route: game.route, family: game.family, errors: [], failed: [] };
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => row.errors.push(String(e.message).slice(0, 160)));
  page.on("console", (m) => {
    if (m.type() === "error") row.errors.push(m.text().slice(0, 160));
  });
  page.on("requestfailed", (r) => row.failed.push(r.url().replace(server.base, "")));
  // A 404 is a response, not a failed request, and the console line omits the URL.
  page.on("response", (r) => {
    if (r.status() >= 400) row.failed.push(`${r.status()} ${r.url().replace(server.base, "")}`);
  });
  try {
    const t0 = Date.now();
    await page.goto(server.base + game.route, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(1200);
    row.loadMs = Date.now() - t0;
    row.title = await page.title();
    row.canvas = await page.evaluate(() => {
      const c = document.querySelector("canvas");
      return c ? [c.width, c.height] : null;
    });
    row.overflowX = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    row.before = await page.evaluate(probe);
    // The mission panel re-renders its buttons every ~180ms, so Playwright's
    // actionability retries lose the node; click inside the page instead.
    if (await page.evaluate(() => !!document.querySelector("#fm-start"))) {
      await page.evaluate(() => document.querySelector("#fm-start").click());
      await page.waitForTimeout(2500);
      row.started = await page.evaluate(probe);
      // Pick answers until one is a miss (the scaffold appears) or the tries run out. The audit
      // cannot know which choice is wrong, and a correct pick just advances the question.
      for (let i = 0; i < 6; i += 1) {
        const clicked = await page.evaluate((n) => {
          const buttons = [...document.querySelectorAll(".fm-actions button")].filter(
            (b) => !b.disabled,
          );
          buttons[n % Math.max(1, buttons.length)]?.click();
          return buttons.length > 0;
        }, i);
        if (!clicked) break;
        await page.waitForTimeout(800);
        row.afterAnswer = await page.evaluate(probe);
        row.picks = i + 1;
        if (row.afterAnswer.scaffold || row.afterAnswer.rewind) break;
      }
    }
    if (args.shots)
      await page.screenshot({ path: `${out}/${game.id}.jpg`, quality: 55, type: "jpeg" });
  } catch (e) {
    row.fatal = String(e.message).slice(0, 200);
  }
  await ctx.close();
  rows.push(row);
  console.log(`${row.fatal ? "FAIL" : "ok  "} ${game.id} ${row.errors.length} err`);
}

await browser.close();
await server.close();
writeFileSync(`${out}/audit.json`, JSON.stringify({ at: new Date().toISOString(), rows }, null, 2));
console.log(`wrote ${out}/audit.json (${rows.length} surfaces)`);
