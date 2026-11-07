#!/usr/bin/env node
/**
 * axe WCAG 2.2 AA over every screen in the ACCESS visual QA matrix (tools/access-visual-qa.mjs SCREENS),
 * at one width per run. Report-first: prints each violation with its first target; exit 1 when any remain.
 *
 *   node tools/access-axe-sweep.mjs [--width 1440] [--only <substring>] [--base local|live|<url>]
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

const args = process.argv.slice(2);
const opt = (name, dflt) =>
  args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : dflt;
const WIDTH = Number(opt("width", 1440));
const ONLY = opt("only", "");
const BASE_ARG = opt("base", "local");
const { chromium } = await import("playwright");
const AxeBuilder = (await import("@axe-core/playwright")).default;
// SCREENS lives in the visual QA tool, which runs on import; read the list from its source instead.
const src = (await import("node:fs")).readFileSync(
  join(REPO_ROOT, "tools/access-visual-qa.mjs"),
  "utf8",
);
const SCREENS = [
  ...src
    .slice(
      src.indexOf("export const SCREENS"),
      src.indexOf("];", src.indexOf("export const SCREENS")),
    )
    .matchAll(/\[\s*"([^"]+)",\s*"([^"]+)",?\s*\]/g),
].map((m) => [m[1], m[2]]);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
let server;
let base = BASE_ARG === "live" ? "https://eduwonderlab.com" : BASE_ARG;
if (BASE_ARG === "local") {
  server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (/^\/access-(practice-lab|teacher)\//.test(p) && !/\.[a-z0-9]+$/i.test(p))
        file = join(
          REPO_ROOT,
          p.startsWith("/access-teacher")
            ? "access-teacher/index.html"
            : "access-practice-lab/index.html",
        );
      else return res.writeHead(404), res.end();
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
}
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: 900 },
  reducedMotion: "reduce",
});
await ctx.addInitScript(() => {
  try {
    localStorage.setItem(
      "accessPracticeLab:v1:prefs",
      JSON.stringify({
        ...JSON.parse(localStorage.getItem("accessPracticeLab:v1:prefs") || "{}"),
        langChosen: true,
      }),
    );
  } catch {}
});
let total = 0;
let checked = 0;
for (const [name, path] of SCREENS) {
  if (ONLY && !name.includes(ONLY)) continue;
  const page = await ctx.newPage();
  try {
    await page.goto(base + path, { waitUntil: "load", timeout: 30000 });
    await page.waitForSelector("#app > :not(.boot), main", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(300);
    checked++;
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    for (const v of r.violations) {
      total++;
      console.log(
        `${name}: ${v.id} (${v.nodes.length}) ${v.nodes[0].target.join(" ")} — ${v.nodes[0].failureSummary?.split("\n")[1]?.trim() || ""}`,
      );
    }
  } catch (e) {
    console.log(`${name}: navigation ${e.message.slice(0, 100)}`);
    total++;
  }
  await page.close();
}
await browser.close();
server?.close();
console.log(
  `\nchecked ${checked} screens at ${WIDTH}px: ${total ? `${total} violation group(s)` : "no axe violations"}`,
);
process.exit(total || !checked ? 1 : 0);
