#!/usr/bin/env node
/**
 * Español-mode leak scan. Opens many lab routes with prefs.lang = "es", collects the visible text that is
 * NOT practice content (content is English by design), and fails when English interface words remain.
 *
 * Excluded as content: anything inside [lang="en"], activity/test passages and prompts, answer choices,
 * titles loaded from JSON, code/pre, and the Spanish-mode language switch itself. What is left is chrome:
 * if it contains English function words ("the", "your", "and", "you", "to", "with"...) it was not localized.
 *
 *   node tools/access-es-leak-scan.mjs [--max N] [--verbose]
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-es-leak-scan: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const args = process.argv.slice(2);
const MAX = Number(args[args.indexOf("--max") + 1]) || 0;
const VERBOSE = args.includes("--verbose");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
      file = join(REPO_ROOT, "access-practice-lab/index.html");
    else {
      res.writeHead(404);
      return res.end();
    }
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const origin = `http://localhost:${server.address().port}`;

const BASE = "/access-practice-lab";
const ROUTES = [
  "/",
  "/?grades=3-5",
  "/Listening/A?grades=6-8",
  "/Reading/A?grades=6-8",
  "/Speaking/A?grades=3-5",
  "/Writing/A?grades=6-8",
  "/Listening/A/g35-l-a-classroom-place?grades=3-5",
  "/Reading/A/read-main-idea?grades=6-8",
  "/Speaking/A/v3-s-a-1?grades=6-8",
  "/Writing/A/write-describe-one-sentence?grades=6-8",
  "/Reading/A/rv5-school-garden-2?grades=6-8",
  "/Listening/A/g35-l-a-morning-order?grades=3-5",
  "/tests?grades=6-8",
  "/test/g35-reading-mini?grades=3-5",
  "/passport?grades=6-8",
  "/road?grades=6-8",
  "/library?grades=6-8",
  "/tools?grades=6-8",
  "/growth?grades=6-8",
  "/diagnostic?grades=6-8",
  "/speak?grades=6-8",
  "/write?grades=6-8",
  "/missions?grades=6-8",
  "/detective?grades=6-8",
  "/worlds?grades=6-8",
  "/vocabulary?grades=6-8",
  "/conversation?grades=6-8",
  "/construction?grades=6-8",
  "/evidence?grades=6-8",
  "/classroom?grades=6-8",
  "/launch-studio?grades=6-8",
  "/reading-room?grades=6-8",
  "/family?grades=3-5",
  "/family/start?grades=3-5",
  "/family/practice?grades=3-5",
  "/family/progress?grades=3-5",
  "/family/help?grades=3-5",
  "/family/save?grades=3-5",
];
// English function words that essentially never appear in Spanish interface text.
const ENGLISH =
  /\b(the|your|you|and|with|for|this|that|from|are|is|will|can|not|have|has|an|of|to|in|on|or|each|then|next|back|start|choose|open|save|close|continue|practice|listen|read|write|speak|try|check|answer)\b/i;
const STRONG = /\b(the|your|you|and|with|this|that|from|are|will|can|have|each|then)\b/i;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(() =>
  localStorage.setItem(
    "accessPracticeLab:v1:prefs",
    JSON.stringify({ lang: "es", langChosen: true }),
  ),
);
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (e) => !/web-vitals/.test(e.message) && pageErrors.push(e.message));

let total = 0;
const report = [];
for (const route of ROUTES) {
  await page.goto(`${origin}${BASE}${route}`, { waitUntil: "networkidle" }).catch(() => {});
  await page.waitForTimeout(350);
  const leaks = await page.evaluate(
    ({ ENGLISH, STRONG }) => {
      const english = new RegExp(ENGLISH, "i");
      const strong = new RegExp(STRONG, "i");
      const SKIP =
        "[lang='en'], script, style, pre, code, svg, textarea, input, .stimulus, .passage, .prompt-text, .choice, .choice-text, .opt, h1, [data-content], .act-context, .crumbs li:last-child";
      const found = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const text = n.textContent.replace(/\s+/g, " ").trim();
        if (text.length < 4) continue;
        const el = n.parentElement;
        if (
          !el ||
          el.closest(SKIP) ||
          el.closest("[hidden]") ||
          getComputedStyle(el).display === "none"
        )
          continue;
        if (el.closest("#labBuild")) continue;
        // a text node of 1-2 short words is a name or a number, not a sentence
        const words = text.split(" ");
        if (words.length < 3 && !strong.test(text)) continue;
        if (strong.test(text) || (words.length >= 3 && english.test(text)))
          found.push(text.slice(0, 110));
      }
      return [...new Set(found)];
    },
    { ENGLISH: ENGLISH.source, STRONG: STRONG.source },
  );
  total += leaks.length;
  report.push([route, leaks]);
}
await browser.close();
server.close();

for (const [route, leaks] of report) {
  if (!leaks.length) continue;
  console.log(`\n${route}  (${leaks.length})`);
  for (const l of leaks.slice(0, VERBOSE ? 99 : 6)) console.log(`   · ${l}`);
}
console.log(
  `\naccess-es-leak-scan: ${ROUTES.length} routes, ${total} English interface string(s) found in Español mode`,
);
if (pageErrors.length)
  console.log(`page errors: ${[...new Set(pageErrors)].slice(0, 3).join(" | ")}`);
process.exit(total > MAX || pageErrors.length ? 1 : 0);
