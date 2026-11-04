#!/usr/bin/env node
/**
 * validate-all-resources-browser.mjs — /curriculum/all-resources/, driven the way a
 * teacher drives it.
 *
 *   - browse by unit: 10 unit cards, one click opens that unit's resources, the URL records it
 *   - search narrows to exactly the rows an independent count expects; counts in the rail follow
 *   - reload keeps the view; the back button undoes it
 *   - "Show more" pages through a long list; the Tools tab lists every tool page
 *   - keyboard: a filter chip is reachable by Tab, operable by Enter, and shows a focus ring
 *   - phone (390px): filters start collapsed, no sideways scroll, 44px targets
 *   - axe WCAG A/AA/2.2: no serious or critical violation in any state
 * Serves the SOURCE tree. A missing browser is a SKIP (3 locally, 1 in CI), never a pass.
 */
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve("axe-core/axe.min.js");

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
  ".woff2": "font/woff2",
};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(ROOT, p.endsWith("/") ? `${p}index.html` : p);
  const pub = join(ROOT, "public", p);
  if (!existsSync(file) && existsSync(pub) && statSync(pub).isFile()) file = pub;
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;
const PAGE = `${BASE}/curriculum/all-resources/`;

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
// The source tree has no Vite build, so the site-wide telemetry loader cannot resolve its bare
// "web-vitals" import; that is the harness, not the page.
const harmless = (text) => /web-vitals|ERR_ABORTED|Failed to load resource/.test(text);

/* The expected numbers come from the data, not from the page under test. */
const manifest = JSON.parse(
  readFileSync(join(ROOT, "data/curriculum-download-manifest.json"), "utf8"),
);
const tools = JSON.parse(readFileSync(join(ROOT, "curriculum/all-resources/tools.json"), "utf8"));
const { flatten } = await import(
  pathToFileURL(join(ROOT, "curriculum/all-resources/all-resources.js")).href
);
const rows = flatten(manifest);
const expectCount = ({ unit = "", group = "", q = "" }) =>
  rows.filter(
    (r) =>
      (!unit || String(r.unit) === unit) &&
      (!group || r.group === group) &&
      q
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((t) => r.hay.includes(t)),
  ).length;

async function open(viewport, url = PAGE) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !harmless(m.text()) && errors.push(m.text()));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector(".ar-unit, .ar-row, .ar-empty");
  return { page, context, errors };
}

const statusCount = async (page) => {
  const text = await page.locator("#ar-status").innerText();
  return Number(text.match(/of ([\d,]+) resource/)?.[1].replace(/,/g, ""));
};

async function axe(page, label) {
  await page.addScriptTag({ path: AXE_PATH });
  const result = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    }),
  );
  const bad = result.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  check(
    !bad.length,
    `axe: ${label} has no serious/critical violation${bad.length ? ` (${bad.map((v) => `${v.id}×${v.nodes.length}`).join(", ")})` : ""}`,
  );
}

/* --- desktop ------------------------------------------------------------- */
{
  const { page, context, errors } = await open({ width: 1440, height: 900 });
  check(
    (await page.locator(".ar-unit").count()) === manifest.units.length,
    "default view shows one card per unit",
  );
  check(
    await page
      .locator("#ar-status")
      .innerText()
      .then((t) => t.includes(rows.length.toLocaleString("en-US"))),
    "status states the full resource count",
  );
  check(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "no horizontal scroll at 1440px",
  );
  await axe(page, "default view");

  await page.locator('.ar-unit[data-value="3"]').click();
  await page.waitForSelector(".ar-row");
  check(page.url().includes("unit=3"), "choosing a unit is recorded in the URL");
  check(
    (await statusCount(page)) === expectCount({ unit: "3" }),
    `unit 3 lists ${expectCount({ unit: "3" })} resources`,
  );
  check(
    await page
      .locator(".ar-unit-head")
      .allInnerTexts()
      .then((t) => t.length === 1 && t[0].startsWith("Unit 3")),
    "only Unit 3 is shown",
  );
  check(
    (await page.locator(".ar-row").count()) === 100,
    "a long list renders one page of 100 rows",
  );
  await page.locator("#ar-more").click();
  check((await page.locator(".ar-row").count()) === 200, "Show more adds the next 100");
  await axe(page, "unit view");

  await page.locator('.ar-chip[data-kind="unit"][data-value="4"]').click();
  await page.locator("#ar-q").fill("percent homework");
  await page.waitForFunction(() => location.search.includes("q=percent"));
  const expected = expectCount({ unit: "4", q: "percent homework" });
  await page.waitForFunction(
    (n) =>
      document
        .querySelector("#ar-status")
        .textContent.includes(n === 0 ? "Nothing" : `of ${n.toLocaleString("en-US")}`) ||
      document.querySelector(".ar-empty"),
    expected,
  );
  const empty = await page.locator(".ar-empty").count();
  check(
    expected === 0 ? empty === 1 : (await statusCount(page)) === expected,
    `search within Unit 4 narrows to ${expected}`,
  );
  await page.locator('.ar-chip[data-kind="unit"][data-value=""]').click();
  await page.waitForFunction(
    (n) =>
      document.querySelector("#ar-status").textContent.includes(`of ${n.toLocaleString("en-US")}`),
    expectCount({ q: "percent homework" }),
  );
  check(
    (await statusCount(page)) === expectCount({ q: "percent homework" }),
    `choosing All units widens search to ${expectCount({ q: "percent homework" })}`,
  );
  const counts = await page
    .locator('.ar-chip[data-kind="unit"]:not([data-value=""]) .ar-count')
    .allInnerTexts();
  const allUnits = Number(
    (await page.locator('.ar-chip[data-kind="unit"][data-value=""] .ar-count').innerText()).replace(
      /,/g,
      "",
    ),
  );
  check(
    counts.reduce((a, c) => a + Number(c.replace(/,/g, "")), 0) === allUnits,
    "rail unit counts add up to the all-units count",
  );

  /* back button: overview -> unit 3 -> back is the overview again */
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await page.waitForSelector(".ar-unit");
  await page.locator('.ar-unit[data-value="3"]').click();
  await page.waitForSelector(".ar-row");
  await page.goBack();
  await page.waitForSelector(".ar-unit");
  check(!page.url().includes("unit="), "back button returns to the unit overview");
  check(
    (await page.locator(".ar-unit").count()) === manifest.units.length,
    "the overview is rendered again after Back",
  );

  await page.goto(`${PAGE}?unit=4&group=homework`, { waitUntil: "networkidle" });
  await page.waitForSelector(".ar-row");
  check(
    (await page
      .locator('.ar-chip[data-kind="unit"][data-value="4"]')
      .getAttribute("aria-pressed")) === "true",
    "a direct link restores the unit chip",
  );
  check(
    (await statusCount(page)) === expectCount({ unit: "4", group: "homework" }),
    "a direct link restores the filtered count",
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".ar-row");
  check(
    (await statusCount(page)) === expectCount({ unit: "4", group: "homework" }),
    "refresh keeps the view",
  );

  await page.locator('.ar-view[data-view="tools"]').click();
  await page.waitForSelector(".ar-list--tools .ar-row");
  check(
    (await page.locator(".ar-list--tools .ar-row").count()) === tools.tools.length,
    `Tools tab lists all ${tools.tools.length} tools`,
  );
  check(
    (await page.locator('.ar-name[href="/curriculum/map/"]').count()) === 1,
    "a tool that had no listing (Curriculum Map) is reachable",
  );
  await axe(page, "tools view");
  check(
    errors.length === 0,
    `no console errors on desktop${errors.length ? `: ${errors[0]}` : ""}`,
  );

  /* keyboard */
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await page.waitForSelector(".ar-unit");
  await page.locator("#ar-q").focus();
  let reached = false;
  for (let i = 0; i < 12 && !reached; i++) {
    await page.keyboard.press("Tab");
    reached = await page.evaluate(() => document.activeElement?.classList.contains("ar-chip"));
  }
  check(reached, "a filter chip is reachable by Tab");
  const ring = await page.evaluate(() =>
    parseFloat(getComputedStyle(document.activeElement).outlineWidth),
  );
  check(ring >= 3, `focused chip shows a ${ring}px focus ring`);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  check(page.url().includes("unit="), "Enter on a chip applies it");
  await context.close();
}

/* --- phone --------------------------------------------------------------- */
{
  const { page, context, errors } = await open(
    { width: 390, height: 844 },
    `${PAGE}?unit=3&group=worksheets`,
  );
  check(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "no horizontal scroll at 390px",
  );
  check(
    (await page.locator("#ar-filters").getAttribute("open")) === null,
    "filters start collapsed on a phone",
  );
  const small = await page.evaluate(
    () =>
      [...document.querySelectorAll(".ar-btn, .ar-view, .ar-more, .ar-filters > summary")]
        .filter((e) => e.offsetParent)
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.height < 44).length,
  );
  check(
    small === 0,
    `every visible button is at least 44px tall${small ? ` (${small} are not)` : ""}`,
  );
  await page.locator("#ar-filters > summary").click();
  check(
    (await page.locator("#ar-filters").getAttribute("open")) !== null,
    "the Filters disclosure opens",
  );
  await axe(page, "phone view");
  check(errors.length === 0, `no console errors on phone${errors.length ? `: ${errors[0]}` : ""}`);
  await context.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(
    `\nvalidate-all-resources-browser FAILED (${failures.length}):\n  ${failures.join("\n  ")}`,
  );
  process.exit(1);
}
console.log("\n✓ validate-all-resources-browser passed");
