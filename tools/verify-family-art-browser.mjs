#!/usr/bin/env node
/**
 * verify-family-art-browser.mjs: the art gallery (design/family-system/art.html) driven in Chromium.
 *
 *   node tools/verify-family-art-browser.mjs [--no-shots] [--page=<repo path>]   (--page is for negative controls)
 *
 * For 320, 768 and 1280px, light and dark: no horizontal scroll, axe (WCAG 2.x A/AA) clean, every <svg> on the page is
 * aria-hidden (itself or an ancestor) or role="img" with a <title>, no id appears twice (EN and ES copies share a page),
 * no request leaves the site, and every kit piece is present (45 + 9 icons, 10 scenes, 32 spots, 6 hook cards in two
 * languages, 16 model samples in two languages, celebration symbols, brand marks, Open Graph cards that load).
 * Writes section screenshots to docs/family-homework-v3/art/. A missing browser is a SKIP (exit 3), never a pass.
 */
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { SAMPLES } from "../assets/design/family/art/math-samples.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { exitSkipped } from "./lib/skip-exit.mjs";

const SHOTS = join(REPO_ROOT, "docs/family-homework-v3/art");
const shots = !process.argv.includes("--no-shots");
const pagePath =
  process.argv.find((a) => a.startsWith("--page="))?.slice(7) ?? "design/family-system/art.html";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};
const ROOT = resolve(REPO_ROOT);
const server = createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = resolve(ROOT, `.${path.endsWith("/") ? `${path}index.html` : path}`);
  if (!file.startsWith(`${ROOT}/`) || !existsSync(file) || !statSync(file).isFile())
    return void res.writeHead(404).end("Not found");
  res.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  server.close();
  exitSkipped(`no browser (${String(e.message).split("\n")[0]})`);
}

const failures = [];
const fail = (m) => failures.push(m);
const SECTIONS = ["icons", "scenes", "spots", "hooks", "celebration", "models", "brand"];
const COMBOS = [
  [320, "light"],
  [768, "light"],
  [1280, "light"],
  [1280, "dark"],
];
if (shots) mkdirSync(SHOTS, { recursive: true });

for (const width of [320, 768, 1280]) {
  for (const scheme of ["light", "dark"]) {
    const ctx = await browser.newContext({
      viewport: { width, height: 900 },
      colorScheme: scheme,
      reducedMotion: "no-preference",
    });
    const page = await ctx.newPage();
    const external = [];
    const errors = [];
    page.on("request", (r) => {
      if (!r.url().startsWith(base) && !r.url().startsWith("data:")) external.push(r.url());
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    const tag = `${width}px ${scheme}`;
    await page.goto(`${base}/${pagePath}`);
    await page.waitForSelector("body[data-ready]", { timeout: 15000 });
    if (external.length) fail(`${tag}: requests left the site: ${external.slice(0, 3).join(", ")}`);
    if (errors.length) fail(`${tag}: page errors: ${errors.slice(0, 3).join(" | ")}`);

    const dims = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      iw: window.innerWidth,
    }));
    if (dims.sw > dims.iw) fail(`${tag}: horizontal scroll (${dims.sw} > ${dims.iw})`);

    const facts = await page.evaluate(() => {
      const hiddenAnc = (el) => !!el.closest('[aria-hidden="true"]');
      const bad = [];
      for (const s of document.querySelectorAll("svg")) {
        if (hiddenAnc(s)) continue;
        const t = [...s.children].find((c) => c.localName === "title");
        if (!(s.getAttribute("role") === "img" && t && t.textContent.trim()))
          bad.push(s.getAttribute("class") || s.outerHTML.slice(0, 60));
      }
      const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
      const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
      const imgs = [...document.querySelectorAll("img")].map((i) => ({
        ok: i.complete && i.naturalWidth > 0,
        alt: i.alt,
      }));
      return {
        bad,
        dupes: [...new Set(dupes)],
        icons: document.querySelectorAll("#icon-grid figure").length,
        fills: document.querySelectorAll("#icon-fill-grid figure").length,
        scenes: document.querySelectorAll("#scene-list .scene.wide").length,
        phoneScenes: document.querySelectorAll("#scene-list .scene.phone").length,
        spots: document.querySelectorAll("#spot-grid figure").length,
        hooks: document.querySelectorAll("#hook-list svg.hook-card").length,
        models: document.querySelectorAll("#model-list svg.fm-model").length,
        esModels: document.querySelectorAll('#model-list svg[lang="es"]').length,
        celebration: document.querySelectorAll("#cel svg").length,
        imgs,
      };
    });
    if (facts.bad.length)
      fail(
        `${tag}: ${facts.bad.length} svg neither aria-hidden nor titled: ${facts.bad.slice(0, 3).join(", ")}`,
      );
    if (facts.dupes.length) fail(`${tag}: duplicate ids: ${facts.dupes.slice(0, 5).join(", ")}`);
    const want = {
      icons: 45,
      fills: 9,
      scenes: 10,
      phoneScenes: 10,
      spots: 32,
      hooks: 12,
      models: SAMPLES.length * 2,
      esModels: SAMPLES.length,
    };
    for (const [k, v] of Object.entries(want))
      if (facts[k] !== v) fail(`${tag}: expected ${v} ${k}, found ${facts[k]}`);
    if (facts.celebration < 10) fail(`${tag}: celebration set incomplete (${facts.celebration})`);
    if (facts.imgs.length !== 2 || facts.imgs.some((i) => !i.ok || !i.alt))
      fail(`${tag}: Open Graph cards did not load with alt text`);

    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    for (const v of axe.violations)
      fail(
        `${tag}: axe ${v.id} (${v.impact}) on ${v.nodes.length} node(s): ${v.nodes[0]?.target?.join(" ")}`,
      );

    // the Spanish label example: a titled ES model really carries Spanish text
    const es = await page.evaluate(
      () => document.querySelector('#model-list svg[lang="es"] desc')?.textContent ?? "",
    );
    if (!/El total|Recta|Tabla|Modelo|Cuadr|Barra|Gr[aá]fica|Plano|Balanza/.test(es))
      fail(`${tag}: Spanish model description missing (${es.slice(0, 40)})`);

    if (shots && COMBOS.some(([w, s]) => w === width && s === scheme)) {
      for (const id of SECTIONS) {
        await page.locator(`#${id}`).screenshot({
          path: join(SHOTS, `${id}-${width}-${scheme}.png`),
          animations: "disabled",
        });
      }
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
if (failures.length) {
  console.error(`FAIL validate:family-art-browser (${failures.length})`);
  for (const f of failures.slice(0, 40)) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  "PASS validate:family-art-browser (320/768/1280 x light/dark: no horizontal scroll, axe clean, every svg hidden or titled, ids unique, no external request)",
);
