#!/usr/bin/env node
// WCAG 2.1 AA (axe) on the Language Game Studio: every game's start screen and playing frame, in English and
// EN+ES, at a Chromebook viewport. Fails on any serious or critical violation. Set PW_CHROMIUM_PATH to use an
// installed Chrome when Playwright's own browser is not downloaded. Usage: node tools/access-lab-axe.mjs [game-id ...]
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { exitSkipped } from "./lib/skip-exit.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  exitSkipped("Playwright or axe-core is not installed for the game accessibility check.", "Install the locked project dependencies.");
}
const { GAMES } = await import("../access-practice-lab/src/games/registry.js");
const only = process.argv.slice(2);
const games = GAMES.map((g) => g.id).filter((id) => !only.length || only.includes(id));
const root = process.cwd();
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://local").pathname);
  let file = join(root, p.endsWith("/") ? `${p}index.html` : p);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p)) file = join(root, "access-practice-lab/index.html");
    else {
      res.writeHead(404);
      return res.end();
    }
  }
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const launch = () => chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
let browser = await launch();

const found = new Map();
const errors = [];
for (const lang of ["en", "en-es"]) {
  for (const id of games) {
    try {
      if (!browser.isConnected()) browser = await launch();
      const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      await page.goto(`${base}/access-practice-lab/games/${id}?band=6-8&lang=${lang}&support=guided`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("[data-g-start]", { timeout: 15000 });
      for (const phase of ["start", "play"]) {
        if (phase === "play") {
          await page.click("[data-g-start]");
          await page.waitForSelector(".lh", { timeout: 10000 });
        }
        await page.waitForTimeout(400);
        const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        for (const v of result.violations) {
          if (!["serious", "critical"].includes(v.impact)) continue;
          const key = `${v.id} ${v.nodes[0].target.join(" ").slice(0, 80)}`;
          const entry = found.get(key) || { impact: v.impact, help: v.help, detail: (v.nodes[0].any[0]?.message || v.nodes[0].none[0]?.message || "").replace(/\s+/g, " ").slice(0, 150), where: [] };
          if (entry.where.length < 3) entry.where.push(`${id}/${phase}/${lang}`);
          found.set(key, entry);
        }
      }
      await ctx.close();
    } catch (error) {
      errors.push(`${id}/${lang}: ${String(error.message).split("\n")[0]}`);
    }
  }
}
await browser.close().catch(() => {});
server.close();
for (const [key, e] of found) console.error(`FAIL ${e.impact} ${key} — ${e.help} (${e.where.join(", ")})${e.detail ? `\n     ${e.detail}` : ""}`);
for (const e of errors) console.error(`ERROR ${e}`);
if (found.size || errors.length) {
  console.error(`\naccess-lab-axe: ${found.size} violation(s), ${errors.length} run error(s)`);
  process.exit(1);
}
console.log(`access-lab-axe: ${games.length} games × start/play × en, en-es — no serious or critical WCAG 2.1 AA violations`);
