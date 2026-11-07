#!/usr/bin/env node
/**
 * Reading comfort and keyboard shortcuts, driven in a real browser
 * (access-practice-lab/src/comfort.js, shortcuts.js, comfort.css).
 * Asserts: the panel opens by button and by "C" and returns focus; every theme applies, persists across a reload
 * (including before the first paint) and passes axe WCAG 2.2 AA on the home page; text size, spacing, the ruler and
 * calm motion take effect; the shortcut keys are inert while typing; "g then s" navigates; reset restores the defaults.
 * A missing browser is a SKIP locally and a FAIL in CI. Set SHOTS=<dir> to save screenshots.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-comfort-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-comfort-e2e: axe-core/playwright is not installed; skipping axe checks.");
}
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
function serve() {
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
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const BASE = "/access-practice-lab";
const KEY = "accessPracticeLab:v1:comfort";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-comfort-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}
const shots = process.env.SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const page = await context.newPage();
const problems = [];
const noise = /web-vitals|Failed to load resource|ERR_ABORTED|speechSynthesis/i;
page.on("pageerror", (e) => !noise.test(e.message) && problems.push(`pageerror: ${e.message}`));
page.on(
  "console",
  (m) => m.type() === "error" && !noise.test(m.text()) && problems.push(`console: ${m.text()}`),
);
const go = async (path) => {
  await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => (document.querySelector("#app")?.innerText || "").trim().length > 10,
    { timeout: 10000 },
  );
};
const attr = (name) => page.evaluate((n) => document.documentElement.dataset[n] || "", name);
const saved = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), KEY);
async function axeCheck(label, exclude = "") {
  if (!AxeBuilder) return;
  const builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22aa",
  ]);
  const res = await (exclude ? builder.exclude(exclude) : builder).analyze();
  const bad = res.violations.map(
    (v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
  );
  ok(
    bad.length === 0,
    `axe WCAG 2.2 AA: ${label}${bad.length ? ` — ${bad.slice(0, 3).join(" | ")}` : ""}`,
  );
}

try {
  await page.addInitScript(() => {
    try {
      localStorage.setItem(
        "accessPracticeLab:v1:prefs",
        JSON.stringify({ langChosen: true, lang: "en", band: "6-8" }),
      );
    } catch {}
  });
  await go(`${BASE}/`);

  // ── panel: button, focus, keyboard ──
  const button = page.locator("[data-comfort-open]").first();
  ok((await button.count()) === 1, "header shows one Reading comfort button");
  ok(
    await page.evaluate(() =>
      [...document.querySelectorAll(".lab-search-btn svg, .lab-comfort-btn svg")].every(
        (s) => s.getBoundingClientRect().width > 8,
      ),
    ),
    "header search and comfort icons are visible at 1200px",
  );
  await button.focus();
  await button.click();
  const dialog = page.locator("dialog.comfort-dialog");
  ok(await dialog.evaluate((d) => d.open), "button opens the comfort panel");
  ok((await dialog.locator("input[name=theme]").count()) === 4, "panel offers four colour themes");
  await page.keyboard.press("Escape");
  ok(!(await dialog.evaluate((d) => d.open)), "Escape closes the panel");
  ok(
    await button.evaluate((b) => b === document.activeElement),
    "focus returns to the header button",
  );
  await page.locator("h1").first().focus();
  await page.keyboard.press("c");
  ok(await dialog.evaluate((d) => d.open), "the C key opens the panel");

  // ── themes ──
  const baseBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  for (const theme of ["paper", "calm", "contrast", "default"]) {
    await page.locator(`.cm-theme[data-theme-card=${theme}]`).click();
    ok((await attr("comfortTheme")) === theme, `theme ${theme} applied to <html>`);
    ok((await saved())?.theme === theme, `theme ${theme} saved on this device`);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    if (theme !== "default")
      ok(bg !== baseBg, `theme ${theme} changes the page background (${bg})`);
  }

  // ── size, spacing, motion ──
  await page.locator(".cm-size input[value='1.3']").evaluate((i) => i.click());
  ok(
    (await page.evaluate(() => document.documentElement.style.getPropertyValue("--lab-scale"))) ===
      "1.3",
    "text size 130% sets --lab-scale",
  );
  await page.locator(".cm-opt input[name=lh][value=airy]").evaluate((i) => i.click());
  await page.locator(".cm-opt input[name=ls][value=roomy]").evaluate((i) => i.click());
  ok(
    (await attr("comfortLh")) === "airy" && (await attr("comfortLs")) === "roomy",
    "line and letter spacing applied",
  );
  const ls = await page.evaluate(
    () => getComputedStyle(document.querySelector(".lab-main p, .lab-main li")).letterSpacing,
  );
  ok(ls !== "normal" && parseFloat(ls) > 0, `letter spacing reaches page text (${ls})`);
  await page.locator("input[name=calm]").evaluate((i) => i.click());
  ok((await attr("comfortMotion")) === "calm", "calm motion applied");
  await page.locator("input[name=calm]").evaluate((i) => i.click());
  await page.locator("input[name=ruler]").evaluate((i) => i.click());
  ok((await page.locator("#comfortRuler").count()) === 1, "reading ruler appears");
  if (shots) await page.screenshot({ path: join(shots, "panel-open.png") });
  await page.keyboard.press("Escape");
  await page.mouse.move(600, 500);
  await page.waitForTimeout(150);
  const top = await page
    .locator("#comfortRuler")
    .evaluate((r) => parseFloat(r.style.getPropertyValue("--cr-top")));
  ok(Math.abs(top - (500 - 28)) < 2, `ruler follows the pointer (top ${top})`);
  ok(
    await page
      .locator("#comfortRuler")
      .evaluate((r) => getComputedStyle(r).pointerEvents === "none"),
    "ruler never blocks clicks",
  );

  // ── persistence before first paint ──
  await page.locator("[data-comfort-open]").first().click();
  await page.locator(".cm-theme[data-theme-card=paper]").click();
  await page.keyboard.press("Escape");
  await page.reload({ waitUntil: "domcontentloaded" });
  ok(
    (await attr("comfortTheme")) === "paper",
    "saved theme is on <html> right after load (before modules run)",
  );
  await page.waitForFunction(
    () => (document.querySelector("#app")?.innerText || "").trim().length > 10,
  );
  ok((await page.locator("#comfortRuler").count()) === 1, "ruler setting persists after reload");

  // ── contrast on every theme ──
  for (const theme of ["paper", "calm", "contrast", "default"]) {
    await page.evaluate((t) => (document.documentElement.dataset.comfortTheme = t), theme);
    await page.waitForTimeout(100);
    if (shots) await page.screenshot({ path: join(shots, `home-${theme}.png`) });
    await axeCheck(`home, ${theme} theme`, "#comfortRuler");
  }

  // ── reset ──
  await page.locator("[data-comfort-open]").first().click();
  await page.locator("[data-comfort-reset]").click();
  const after = await saved();
  ok(
    after.theme === "default" &&
      after.lh === "normal" &&
      after.ls === "normal" &&
      !after.ruler &&
      !after.calm,
    "reset restores every default",
  );
  ok(
    (await page.evaluate(() => document.documentElement.style.getPropertyValue("--lab-scale"))) ===
      "1",
    "reset restores text size",
  );
  ok((await page.locator("#comfortRuler").count()) === 0, "reset removes the ruler");
  await page.waitForTimeout(500);
  await axeCheck("comfort panel open", "");
  await page.keyboard.press("Escape");

  // ── shortcuts ──
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("?");
  const sc = page.locator("dialog.shortcuts-dialog");
  ok(await sc.evaluate((d) => d.open), "? opens the shortcuts list");
  ok((await sc.locator("kbd").count()) > 10, "the list shows the keys");
  await page.waitForTimeout(500);
  await axeCheck("shortcuts dialog", "");
  await page.keyboard.press("Escape");
  ok(!(await sc.evaluate((d) => d.open)), "Escape closes the shortcuts list");
  await page
    .locator("[data-search-form] input, #labSearchInput")
    .first()
    .evaluate((i) => i.closest("details")?.setAttribute("open", ""));
  await page.locator("#labSearchInput").focus();
  await page.keyboard.type("c? g");
  ok(!(await page.locator("dialog[open]").count()), "shortcut keys stay quiet while typing");
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press("g");
  ok(await page.locator(".go-hint").isVisible(), "g shows the jump hints");
  await page.keyboard.press("s");
  await page.waitForURL(`**${BASE}/speak`);
  ok(page.url().endsWith(`${BASE}/speak`), "g then s opens the Speaking Studio");
  ok((await page.locator(".go-hint").count()) === 0, "jump hints close after use");

  // ── phone width ──
  await page.setViewportSize({ width: 375, height: 700 });
  await go(`${BASE}/`);
  ok(
    await page.locator("[data-comfort-open]").first().isVisible(),
    "Comfort button stays reachable at 375px",
  );
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  ok(!overflow, "no horizontal overflow at 375px");
  await page.locator("[data-comfort-open]").first().click();
  const box = await page.locator(".comfort-sheet").boundingBox();
  ok(box && box.width <= 376, "panel fits a phone screen");
  if (shots) await page.screenshot({ path: join(shots, "panel-phone.png") });

  ok(
    problems.length === 0,
    `no console errors${problems.length ? `: ${problems.slice(0, 3).join(" | ")}` : ""}`,
  );
} catch (error) {
  failures.push(`threw: ${error.message}`);
  console.log(`FAIL threw: ${error.stack}`);
} finally {
  await browser.close();
  server?.close();
}
if (failures.length) {
  console.error(
    `\naccess-comfort-e2e: ${failures.length} failure(s)\n - ${failures.join("\n - ")}`,
  );
  process.exit(1);
}
console.log("\naccess-comfort-e2e: all checks passed");
