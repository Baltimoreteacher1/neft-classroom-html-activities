#!/usr/bin/env node
/**
 * The Predictive Intelligence workspace (/access-teacher/predictive/), driven in a real browser: the Teacher
 * Hub entry button; real mode with no data and with a class-sized import shows no forecast numbers; CSV
 * import preview, confirm (provenance stored) and undo; synthetic demo mode shows validated numbers whose
 * 80% interval holds the expected value; keyboard tabs; the Research Analyst answers a supported question
 * and refuses an unsupported one; every tab is axe-clean (no serious/critical) and has no horizontal
 * overflow at 1280px and 390px in both modes. Serves the source tree; a missing browser is a SKIP locally
 * and a FAIL in CI.
 */
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder = null;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-predictive-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn(
    "access-predictive-e2e: @axe-core/playwright is not installed; skipping axe checks.",
  );
}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
let server = null;
let origin = process.env.BASE;
if (!origin) {
  const s = await serveAccess();
  server = s.server;
  origin = s.base;
}
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (error) {
  console.warn(`access-predictive-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}

const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const problems = [];
const noise = /web-vitals|Failed to load resource|ERR_ABORTED|nt-usage|speechSynthesis/i;
page.on("pageerror", (e) => !noise.test(e.message) && problems.push(`pageerror: ${e.message}`));
page.on(
  "console",
  (m) => m.type() === "error" && !noise.test(m.text()) && problems.push(`console: ${m.text()}`),
);

const WS = "/access-teacher/predictive/";
const TABS = [
  "overview",
  "growth",
  "probability",
  "simulator",
  "classroom",
  "analyst",
  "validation",
  "data",
];
const open = async () => {
  await page.goto(`${origin}${WS}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
};
const tab = async (id) => {
  await page.click(`#pi-tab-${id}`);
  await page.waitForSelector(`#pi-tab-${id}[aria-selected="true"]`);
};
const numbers = () => page.locator("[data-pi-number]").count();

async function sweep(label) {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of TABS) {
      await tab(id);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      ok(over <= 1, `${label} ${id} @${width}: no horizontal overflow (${over}px)`);
      if (!AxeBuilder) continue;
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      ok(
        !bad.length,
        `${label} ${id} @${width}: axe has no serious/critical violations${bad.length ? ` — ${bad.map((v) => `${v.id}: ${v.nodes[0]?.target}`).join(" | ")}` : ""}`,
      );
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
}

// 1. Teacher Hub entry point.
await page.goto(`${origin}/access-teacher/`, { waitUntil: "domcontentloaded" });
const entry = page.locator("#thPredictive");
ok(
  (await entry.getAttribute("href")) === WS,
  "Teacher Hub has the Predictive Intelligence button linking to the workspace",
);
ok(
  /Analyze language growth, forecast ACCESS outcomes, explore student needs, and plan targeted interventions\./.test(
    await entry.innerText(),
  ),
  "the button carries the description",
);

// 2. Real mode, nothing on this device.
await page.evaluate(() => localStorage.clear());
await open();
ok(
  (await page.locator('#pi-tab-overview[aria-selected="true"]').count()) === 1,
  "workspace opens on the Forecast Overview",
);
ok(
  (await page.getByText("No students yet").count()) > 0,
  "real mode with no data shows the empty state",
);
ok((await numbers()) === 0, "real mode with no data shows no forecast numbers");
await tab("validation");
ok(
  (await page.locator('[data-validation-status="insufficient-data"]').count()) === 2,
  "Validation Center reports insufficient data for both eras",
);

// 3. Keyboard tabs.
await page.focus("#pi-tab-validation");
await page.keyboard.press("ArrowRight");
ok(
  (await page.locator('#pi-tab-data[aria-selected="true"]').count()) === 1,
  "ArrowRight moves to the next tab",
);
ok(
  (await page.evaluate(() => document.activeElement?.id)) === "pi-tab-data",
  "focus follows the selected tab",
);

// 4. CSV import: preview, confirm, provenance.
const CSV = [
  "student,year,domain,level,scale_score",
  "Student Z,2023-24,Writing,2.4,",
  "Student Z,2024-25,Writing,2.9,",
  "Student Z,2024-25,Overall,3.1,",
  "Student Z,2025-26,Writing,3.3,",
  "Student Z,2025-26,Overall,3.4,",
  "Student Z,2025-26,Speaking,7.2,",
].join("\n");
await page.fill("#pi-csv", CSV);
await page.click("#piCheckImport");
await page.waitForSelector("#piImportSummary");
ok(
  /5 to import/.test(await page.locator("#piImportSummary").innerText()) &&
    /1 with errors/.test(await page.locator("#piImportSummary").innerText()),
  "preview counts new rows and the invalid level",
);
ok((await page.getByText("must be 1.0 to 6.0").count()) > 0, "preview explains the invalid level");
ok(
  (await page.getByText("both sides of the scale reset").count()) > 0,
  "preview flags the cross-reset comparison",
);
await page.click("#piConfirmImport");
await page.waitForSelector("#piUndoImport");
const stored = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("accessTeacher:v1:officialResults") || "{}"),
);
const z = stored["import|Student Z"] || [];
ok(
  z.length === 3 && z.find((r) => r.year === "2024-25")?.provenance?.Writing?.kind === "csv-import",
  "confirmed import is in the hub's official-results store with provenance",
);

// 5. Real class-sized data: still no numbers, status explains why.
await tab("overview");
ok(
  (await page.locator('[data-status="insufficient"]').count()) >= 1,
  "imported real data shows the 'Insufficient data' status",
);
ok((await numbers()) === 0, "imported real data still shows no forecast numbers");
await sweep("real");

// 6. Undo.
await tab("data");
await page.click("#piUndoImport");
await page.waitForSelector("#pi-csv");
const after = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("accessTeacher:v1:officialResults") || "{}"),
);
ok(!after["import|Student Z"], "undo removes what the import added");

// 7. Synthetic demonstration mode.
await page.getByRole("button", { name: "Synthetic demo" }).click();
await page.waitForSelector("#piDemoBanner");
ok(
  /SYNTHETIC DEMONSTRATION/.test(await page.locator("#piDemoBanner").innerText()),
  "demo mode shows the synthetic banner",
);
await tab("overview");
ok(
  (await page.locator('#piOverviewTable [data-status="validated"]').count()) === 5,
  "demo forecasts are validated for every domain and the overall",
);
const rows = await page.$$eval("#piOverviewTable tr[data-expected]", (els) =>
  els.map((e) => [Number(e.dataset.expected), Number(e.dataset.lo), Number(e.dataset.hi)]),
);
ok(
  rows.length === 5 && rows.every(([x, lo, hi]) => lo <= x && x <= hi),
  "each validated 80% interval contains the expected level",
);
ok(
  (await page.evaluate(() => localStorage.getItem("accessTeacher:v1:officialResults"))) === "{}" ||
    (await page.evaluate(
      () => !localStorage.getItem("accessTeacher:v1:officialResults")?.includes("DEMO"),
    )),
  "demo data is never written to the real store",
);

// 8. Research Analyst.
await tab("analyst");
await page.fill("#pi-q", "Who is struggling with independent writing?");
await page.click(".pi-ask button[type=submit]");
const ans = page.locator('[data-answer="independent-struggle"]');
ok(
  (await ans.count()) === 1 &&
    /Query interpretation/.test(await ans.innerText()) &&
    /Uncertainty/.test(await ans.innerText()),
  "analyst answers a supported question with its interpretation and uncertainty",
);
await page.fill("#pi-q", "What will the weather be?");
await page.click(".pi-ask button[type=submit]");
ok(
  (await page.locator('[data-answer="unsupported"]').count()) === 1,
  "analyst refuses an unsupported question and lists what it can answer",
);
await sweep("demo");

ok(
  !problems.length,
  `no console errors${problems.length ? ` — ${problems.slice(0, 3).join(" | ")}` : ""}`,
);
await browser.close();
server?.close();
if (failures.length) {
  console.error(`\naccess-predictive-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-predictive-e2e: all checks passed");
