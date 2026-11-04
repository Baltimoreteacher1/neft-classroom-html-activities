// Lab-wide sweep: every top-level route at 375, 768 and 1280px, in the engine named by E2E_BROWSER (default
// chromium). Fails on a page error, horizontal overflow, or an axe WCAG 2.2 AA violation. Serves the source tree.
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

const ENGINE = process.env.E2E_BROWSER || "chromium";
let engine;
let AxeBuilder;
try {
  engine = (await import("playwright"))[ENGINE];
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-lab-sweep: SKIP — playwright or axe missing");
  process.exit(process.env.CI ? 1 : 0);
}
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
};
const server = await new Promise((r) => {
  const s = http.createServer((req, res) => {
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
  s.listen(0, () => r(s));
});
const origin = process.env.BASE || `http://localhost:${server.address().port}`;
const ROUTES = process.env.ROUTES
  ? process.env.ROUTES.split(",")
  : [
      "",
      "tests",
      "family",
      "family/start",
      "family/practice",
      "family/progress",
      "family/help",
      "family/save",
      "passport",
      "tools",
      "library",
      "missions",
      "conversation",
      "construction",
      "evidence",
      "growth",
      "speak",
      "write",
      "detective",
      "launch",
      "classroom",
      "vocabulary",
      "flashcards",
      "stories",
      "road",
      "worlds",
      "publisher-demo",
      "publisher-demo/family",
      "journey",
      "journey/map",
      "journey/m08",
      "journey/m08/discover",
      "journey/guide",
    ];
const WIDTHS = process.env.WIDTHS ? process.env.WIDTHS.split(",").map(Number) : [375, 768, 1280];
const noise = /web-vitals|Failed to load resource|ERR_ABORTED|speechSynthesis|downloadable font/i;
const browser = await engine.launch();
const bad = [];
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => !noise.test(e.message) && errs.push(e.message));
  for (const route of ROUTES) {
    errs.length = 0;
    await page.goto(`${origin}/access-practice-lab/${route}`, { waitUntil: "networkidle" });
    await page
      .waitForSelector("#app h1, #app h2", { timeout: 10000 })
      .catch(() => errs.push("no heading rendered"));
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    const where = `${width}px /${route}`;
    if (over > 1) {
      const culprits = await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
          .slice(0, 4)
          .map(
            (el) =>
              `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]} right=${Math.round(el.getBoundingClientRect().right)}`,
          ),
      );
      bad.push(`${where}: horizontal overflow ${over}px · ${culprits.join(" | ")}`);
    }
    for (const v of axe.violations)
      bad.push(
        `${where}: axe ${v.id} (${v.impact}) x${v.nodes.length} ${v.nodes[0]?.target?.join(" ")}`,
      );
    if (width === 1280 && ENGINE !== "webkit") {
      // Keyboard only: three Tabs must land on visible controls that draw a focus indicator (WebKit tabs differently by default).
      await page.evaluate(() => document.activeElement?.blur());
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press("Tab");
        const f = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return "no focus";
          const r = el.getBoundingClientRect();
          const c = getComputedStyle(el);
          const drawn =
            (c.outlineStyle !== "none" && Number.parseFloat(c.outlineWidth) > 0) ||
            c.boxShadow !== "none";
          return r.width > 0 && r.height > 0 && drawn
            ? ""
            : `${el.tagName.toLowerCase()} has no visible focus indicator`;
        });
        if (f) bad.push(`${where}: keyboard Tab ${i + 1}: ${f}`);
      }
    }
    for (const e of errs) bad.push(`${where}: ${e.slice(0, 160)}`);
  }
  await ctx.close();
}
await browser.close();
server.close();
for (const b of bad) console.log(`FAIL ${b}`);
console.log(
  `access-lab-sweep ${bad.length ? `FAIL (${bad.length})` : "PASS"} · ${ROUTES.length} routes x ${WIDTHS.length} widths · ${ENGINE}`,
);
process.exit(bad.length ? 1 : 0);
