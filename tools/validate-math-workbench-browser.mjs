#!/usr/bin/env node
/**
 * validate-math-workbench-browser.mjs — the Math Workbench, driven in a real browser.
 *
 * The static half (validate-math-workbench.mjs) proves the page's promises in text. This
 * half proves them where a student sees them, at the sizes classrooms really use:
 *   - the empty-state "Fast start" panel is INSIDE the first viewport (it sat 750–1,200px
 *     down, below the visible board, on every desktop and tablet size until 2026-10)
 *   - the top bar is one short row and its title is never clipped (it was 106px tall,
 *     14% of a 768px screen, with "Math Workben" cut off)
 *   - no horizontal scroll, no button pushed off screen, no uncaught error
 *   - Spanish: switching language leaves no visible English interface string
 *   - Teacher controls stay locked without Teacher Mode and open with it
 *   - the calculator answers the keyboard
 *   - axe finds no WCAG A/AA violation, in English and in Spanish
 * Serves the SOURCE tree. A missing browser is a SKIP (3 locally, 1 in CI), never a pass.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  process.exit(skipExit("playwright is not installed"));
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = join(ROOT, p.endsWith("/") ? `${p}index.html` : p);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const BASE = `http://127.0.0.1:${server.address().port}/curriculum/math-workbench/`;

let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (error) {
  server.close();
  process.exit(
    skipExit(
      `no browser (${error.message.split("\n")[0]})`,
      "Set PW_CHROMIUM_PATH or run: npx playwright install chromium",
    ),
  );
}

const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
// The source tree has no Vite build, so the site-wide telemetry loader cannot resolve its
// bare "web-vitals" import; that is the harness, not the page.
const harmless = (text) => /web-vitals/.test(text);

async function open({ width, height, lang = "en", teacher = false, touch = false }) {
  const context = await browser.newContext({
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch && width < 800,
  });
  await context.addInitScript(
    ([l, t]) => {
      try {
        localStorage.setItem("mw_tour_done", "1");
        if (l === "es") localStorage.setItem("mw_lang", "es");
        if (t) localStorage.setItem("nt-teacher-mode", "1");
      } catch (_) {}
    },
    [lang, teacher],
  );
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on("pageerror", (e) => {
    if (!harmless(e.message)) errors.push(e.message.slice(0, 160));
  });
  await page.goto(BASE, { waitUntil: "networkidle" });
  return { context, page, errors };
}

/* ── layout at classroom sizes ───────────────────────────────────────────────────── */
for (const [width, height] of [
  [1366, 768],
  [1280, 720],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [1920, 1080],
]) {
  const { context, page, errors } = await open({ width, height, touch: width < 800 });
  const m = await page.evaluate(() => {
    const rect = (s) => document.querySelector(s).getBoundingClientRect();
    const h1 = document.querySelector(".brand h1");
    const hint = rect("#emptyHint");
    const buttons = [...document.querySelectorAll(".topbar .tbtn, .topbar summary")].filter(
      (b) => b.getClientRects().length,
    );
    return {
      top: rect(".topbar").height,
      hintTop: hint.top,
      hintBottom: hint.bottom,
      clipped: h1.getClientRects().length ? h1.scrollWidth > h1.clientWidth : false,
      hScroll: document.documentElement.scrollWidth > innerWidth,
      off: buttons.filter((b) => b.getBoundingClientRect().right > innerWidth + 1).length,
    };
  });
  const tag = `${width}×${height}`;
  check(
    m.hintTop >= 0 && m.hintBottom <= height,
    `${tag}: the Fast start panel is inside the first viewport (${Math.round(m.hintTop)}–${Math.round(m.hintBottom)})`,
  );
  check(m.top <= 64, `${tag}: top bar is one row (${Math.round(m.top)}px)`);
  check(!m.clipped, `${tag}: the title is not clipped`);
  check(!m.hScroll && m.off === 0, `${tag}: no horizontal scroll and no button off screen`);
  check(errors.length === 0, `${tag}: no uncaught error ${errors[0] || ""}`);
  await context.close();
}

/* ── Spanish leaves no English interface ─────────────────────────────────────────── */
{
  const { context, page, errors } = await open({
    width: 1366,
    height: 900,
    lang: "es",
    teacher: true,
  });
  const left = new Set();
  const grab = async () =>
    (await page.evaluate(() => window.MWBI18n.missing())).forEach((k) => left.add(k));
  const step = async (fn) => {
    try {
      await fn();
      await page.waitForTimeout(120);
      await grab();
    } catch (error) {
      failures.push(`Spanish walk could not reach a state: ${error.message.split("\n")[0]}`);
    }
  };
  await grab();
  await step(() => page.click("#mwbMoreTools summary"));
  await page.evaluate(() => (document.getElementById("mwbMoreTools").open = false));
  for (const tool of ["pen", "number", "operation", "setup", "shapes", "tools"])
    await step(() => page.click(`[data-tool="${tool}"]`));
  await step(() => page.click("#guideBtn"));
  await page.click("#guideClose");
  await step(() => page.click("#multBtn"));
  await page.click("#multClose");
  await step(() => page.click("#liveBtn"));
  await step(() => page.click("#liveGoTeacher"));
  await step(() => page.click("#playCustom"));
  await page.click("#liveStop");
  await page.click("#liveClose");
  await step(() => page.click("#a11yBtn"));
  await page.click("#a11yClose");
  await step(() => page.click("#printBtn"));
  await page.click("#pcClose");
  await page.evaluate(() => (document.getElementById("mwbMoreTools").open = true));
  await step(() => page.click("#helpBtn"));
  await page.click("#helpClose");
  await page.evaluate(() => (document.getElementById("mwbMoreTools").open = true));
  await step(() => page.click("#calcBtn"));
  await step(() => page.click('[data-extra="fractions"]'));
  await step(() => page.click('[data-extra="percent"]'));
  await page.click("#calcClose");
  await step(() => page.click("#wbxToolBtn"));
  await page.keyboard.press("Escape");
  await step(() => page.evaluate(() => window.MWBShellUI.startTour()));
  await step(() => page.click("#dockToggle"));
  check(
    left.size === 0,
    `Spanish: no visible English interface string left${left.size ? ` — ${[...left].slice(0, 6).join(" | ")}` : ""}`,
  );
  check(errors.length === 0, `Spanish: no uncaught error ${errors[0] || ""}`);
  await context.close();
}

/* ── Teacher controls + calculator keyboard ───────────────────────────────────────── */
{
  const student = await open({ width: 1366, height: 900 });
  await student.page.click("#liveBtn");
  await student.page.click("#liveGoTeacher");
  check(
    !!(await student.page.$(".wbx-gate")),
    "without Teacher Mode, Broadcast explains it is for the teacher",
  );
  check(!(await student.page.$("#liveStop")), "without Teacher Mode, no room is opened");
  await student.page.click(".wbx-gate button");
  await student.page.click("#liveClose");
  await student.page.evaluate(() => (document.getElementById("mwbMoreTools").open = true));
  await student.page.click("#calcBtn");
  for (const key of ["7", "*", "6", "Enter"]) await student.page.keyboard.press(key);
  check(
    (await student.page.textContent("#calcOut")).trim() === "42",
    "the calculator answers the keyboard (7 × 6 = 42)",
  );
  await student.context.close();

  const teacher = await open({ width: 1366, height: 900, teacher: true });
  await teacher.page.click("#liveBtn");
  await teacher.page.click("#liveGoTeacher");
  check(
    !(await teacher.page.$(".wbx-gate")) && !!(await teacher.page.$("#liveStop")),
    "with Teacher Mode, Broadcast opens the room",
  );
  await teacher.page.click("#liveStop");
  await teacher.context.close();
}

/* ── axe: no WCAG A/AA violation in either language ───────────────────────────────── */
try {
  const axe = readFileOf(require.resolve("axe-core/axe.min.js"));
  for (const lang of ["en", "es"]) {
    const { context, page } = await open({ width: 1366, height: 768, lang });
    await page.evaluate(axe);
    const run = () =>
      page.evaluate(() =>
        axe
          .run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] })
          .then((r) => r.violations.map((v) => `${v.id} x${v.nodes.length}`)),
      );
    check((await run()).length === 0, `axe (${lang}): no violation on the board`);
    await page.click('[data-tool="tools"]');
    const flyout = await run();
    check(
      flyout.length === 0,
      `axe (${lang}): no violation with the tools palette open${flyout.length ? ` — ${flyout.join(", ")}` : ""}`,
    );
    await context.close();
  }
} catch (error) {
  failures.push(`axe could not run: ${error.message.split("\n")[0]}`);
}
function readFileOf(path) {
  return require("node:fs").readFileSync(path, "utf8");
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\nFAIL validate:math-workbench-browser — ${failures.length} problem(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("PASS validate:math-workbench-browser");
