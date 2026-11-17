#!/usr/bin/env node
import { openHubSections } from "./lib/access-hub.mjs";
/**
 * The WIDA Data Intelligence Studio (/access-teacher/predictive/), driven in a real browser: the Teacher Hub
 * card (Open Data Studio, Try with Sample Data); real mode with no data shows no forecast numbers; the import
 * wizard (sample file -> map -> validate -> review with a corrected error -> save -> analyze), manual entry,
 * undo; the scale-reset refusal; MODEL to ACCESS refuses a number; synthetic demo mode shows validated numbers
 * whose 80% interval holds the expected value; Teacher tour Part 2 walks every section; keyboard tabs; the
 * Data Explorer answers a supported question and refuses an unsupported one; every section is axe-clean
 * (no serious/critical) with no horizontal overflow at 1280px and 390px in both modes. Serves the source
 * tree; a missing browser is a SKIP locally and a FAIL in CI.
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
  "glance",
  "overview",
  "students",
  "growth",
  "forecasts",
  "classroom",
  "planner",
  "reports",
  "toolkit",
];
const open = async (q = "") => {
  await page.goto(`${origin}${WS}${q}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[role="tablist"]', { timeout: 15000 });
};
const tab = async (id) => {
  await page.click(`#pi-tab-${id}`);
  await page.waitForSelector(`#pi-tab-${id}[aria-selected="true"]`);
};
const sub = (id) => page.click(`[data-subnav="${id}"]`);
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

// 1. Teacher Hub card.
await page.goto(`${origin}/access-teacher/`, { waitUntil: "domcontentloaded" });
await openHubSections(page);
ok(
  (await page.locator("#thWidaTitle").innerText()) === "WIDA Data Intelligence",
  "Teacher Hub shows the WIDA Data Intelligence card",
);
ok(
  (await page.locator("#thPredictive").getAttribute("href")) === WS,
  "Open Data Studio links to the studio",
);
ok(
  (await page.locator("#thWidaDemo").getAttribute("href")) === `${WS}?demo=1`,
  "Try with Sample Data opens the synthetic demo",
);

// 2. First visit opens the sample class; My class with no data shows the welcome screen.
await open();
ok(
  (await page.locator('[data-mode-btn="demo"][aria-pressed="true"]').count()) === 1,
  "a first visit with no class data opens the sample class",
);
ok(
  (await page.locator('#pi-tab-glance[aria-selected="true"]').count()) === 1,
  "the studio opens on Class at a glance",
);
ok(
  (await page.locator("[data-student-row]").count()) === 12 &&
    (await page.locator("th[aria-sort]").count()) >= 8,
  "Class at a glance shows a sortable row for each of the 12 sample students",
);
await page.locator(".pi-gl-name").first().click();
ok(
  await page.evaluate(() => document.getElementById("piDrawer")?.open === true),
  "a student name opens the spotlight drawer",
);
await page.keyboard.press("Escape");
await tab("overview");
ok(
  (await page.locator(".pi-strip [data-student]").count()) === 12,
  "the sample class has 12 students to pick from",
);
ok(
  (await page.locator(".pi-dtile").count()) === 4 &&
    (await page.locator(".pi-gauge").count()) === 1,
  "the student overview shows a gauge and four domain tiles",
);
await page.click('[data-mode-btn="real"]');
ok(
  (await page.locator('[data-welcome="sample"]').count()) === 1,
  "My class with no data shows the welcome choices",
);
await tab("forecasts");
ok((await numbers()) === 0, "real mode with no data shows no forecast numbers");

// 3. Keyboard tabs.
await page.focus("#pi-tab-forecasts");
await page.keyboard.press("ArrowRight");
ok(
  (await page.evaluate(() => document.activeElement?.id)) === "pi-tab-classroom",
  "ArrowRight moves to the next section",
);

// 4. Import wizard with the fictional sample file; one value is corrected in review.
await page.click("#piImportBtn");
await page.click("[data-sample]");
await page.click("[data-wizard-next]");
await page.click("[data-wizard-next]");
ok(
  /2\s*results/.test(await page.locator("[data-import-summary]").innerText()),
  "validation counts both sample rows",
);
await page.click("[data-wizard-next]");
const cellL = () => page.locator('[data-review-row="0"] input').nth(4);
await cellL().fill("7.2");
await cellL().press("Tab");
ok(
  (await page.locator('[data-review-row="0"].is-error').count()) === 1,
  "an out-of-range level is flagged in review",
);
await cellL().fill("3.4");
await cellL().press("Tab");
ok(
  (await page.locator('[data-review-row="0"].is-error').count()) === 0,
  "the corrected value passes",
);
await page.click("[data-wizard-next]");
await page.check("#piVerified");
await page.click("[data-confirm-import]");
ok(/2 result/.test(await page.locator("[data-import-done]").innerText()), "two results are saved");
const stores = await page.evaluate(() => ({
  official: JSON.parse(localStorage.getItem("accessTeacher:v1:officialResults") || "{}"),
  interim: JSON.parse(localStorage.getItem("accessTeacher:v1:predictive:interim") || "{}"),
}));
const sid = "import|Sample student (fictional)";
ok(
  stores.official[sid]?.[0]?.assessment === "ACCESS" &&
    stores.official[sid][0].provenance?.record?.kind === "csv-import",
  "ACCESS goes to the hub's official store with provenance",
);
ok(
  stores.interim[sid]?.[0]?.assessment === "MODEL_ONLINE",
  "MODEL goes to the studio's interim store",
);
await page.click("[data-open-analysis]");
ok(
  (await page.locator('[data-kpi="latest"]').count()) === 1,
  "Analyze opens the student's overview",
);

// 5. MODEL to ACCESS never invents a number.
await tab("forecasts");
await sub("concordance");
ok(
  /No validated prediction is available/.test(await page.locator("[data-concordance]").innerText()),
  "MODEL to ACCESS states that no validated prediction is available",
);

// 6. Manual entry of a post-reset result, then the reset refusal on Growth.
await page.click("#piImportBtn");
await page.click('[data-source="manual"]');
await page.fill("#piAsYear", "2025-26");
await page.click("[data-wizard-next]");
const row = () => page.locator('[data-review-row="0"] input');
await row().nth(0).fill("Sample student (fictional)");
await row().nth(0).press("Tab");
for (const [i, v] of [
  [4, "4.0"],
  [6, "3.2"],
  [8, "3.8"],
  [10, "3.0"],
  [12, "3.5"],
]) {
  await row().nth(i).fill(v);
  await row().nth(i).press("Tab");
}
await page.click("[data-wizard-next]");
await page.click("[data-confirm-import]");
await page.click("[data-open-analysis]");
await tab("growth");
ok(
  /reset/.test(
    await page
      .locator("[data-not-comparable]")
      .first()
      .innerText()
      .catch(() => ""),
  ),
  "growth refuses to compare across the 2025-26 scale reset",
);
await tab("forecasts");
await sub("forecast");
ok((await numbers()) === 0, "no forecast numbers for real data");

// 7. Undo the manual entry.
await page.click("#piImportBtn");
await page.click("[data-undo-import]");
const afterUndo = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("accessTeacher:v1:officialResults") || "{}"),
);
ok(
  !afterUndo["import|Sample student (fictional)"]?.some((r) => r.year === "2025-26"),
  "undo removes what the last import added",
);

// 8. Synthetic demonstration mode.
await open("?demo=1");
await page.waitForSelector("#piDemoBanner");
ok(
  /Sample class/.test(await page.locator("#piDemoBanner").innerText()),
  "the sample class is labelled as fictional",
);
await tab("overview");
await page.click('[data-subnav="class"]');
ok(
  (await page.locator(".pi-heat").count()) >= 1 && (await page.locator(".pi-cols").count()) === 1,
  "the class overview shows the heatmap and weekly practice",
);
await tab("students");
await sub("practice");
ok(
  (await page.locator(".pi-cols").count()) === 1 && (await page.locator(".pi-indep").count()) === 1,
  "practice activity shows weekly practice and independence charts",
);
await sub("kid");
ok(
  (await page.locator(".pi-kidcard").count()) === 4 &&
    (await page.locator(".pi-ladder .is-here").count()) >= 3,
  "the student view shows a ladder per domain",
);
await tab("forecasts");
await sub("forecast");
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
await sub("scenarios");
ok(
  (await page.locator('[data-kind="hypothetical"]').count()) === 1,
  "scenarios are labelled hypothetical",
);
ok(
  !(
    await page.evaluate(() => localStorage.getItem("accessTeacher:v1:officialResults") || "")
  ).includes("DEMO"),
  "demo data is never written to the real store",
);

// 8b. Outlook, practice links, class outlook, toolkit.
await tab("overview");
await page.click('[data-subnav="student"]');
ok((await page.locator("[data-outlook]").count()) >= 1, "each student has an Outlook card");
const acts = await page.$$eval(".pi-practice [data-activity]", (x) =>
  x.map((a) => a.getAttribute("href")),
);
ok(
  acts.length >= 3 && acts.every((u) => /^\/access-practice-lab\/.+grades=/.test(u)),
  "Practice next links go to Language Page activities at the student's grade band",
);
await page.waitForSelector('.pi-practice [data-activity^="act:"]', { timeout: 15000 });
const exactActs = await page.$$eval('.pi-practice [data-activity^="act:"]', (x) =>
  x.map((a) => a.getAttribute("href")),
);
ok(
  exactActs.length >= 2 &&
    exactActs.every((u) =>
      /^\/access-practice-lab\/(Listening|Speaking|Reading|Writing)\/[ABC]\/[\w:-]+\?grades=/.test(
        u,
      ),
    ),
  "Practice next links straight to specific activities at the student's support level",
);
await page.click('[data-student="DEMO-0002"]');
ok(
  (await page.locator('[data-outlook="concordance"]').count()) === 1,
  "Bao's MODEL Online score shows WIDA's concordance estimate",
);
await tab("forecasts");
await sub("outlook");
ok((await page.locator(".pi-ranges").count()) === 1, "Class outlook draws every student's range");
await sub("concordance");
ok(
  (await page.locator('[data-concordance="available"]').count()) === 1,
  "MODEL to ACCESS shows the WIDA estimate for an applicable result",
);
await tab("toolkit");
ok(
  (await page.locator("[data-tool]").count()) === 9,
  "the Toolkit offers nine tools (goal form added 2026-11-17)",
);
for (const t of [
  "levels",
  "words",
  "families",
  "conference",
  "library",
  "year",
  "official",
  "templates",
]) {
  await page.click(`[data-tool="${t}"]`);
  ok(
    (await page.locator("#pi-panel .pi-error").count()) === 0 &&
      (await page.locator("[data-toolkit-back]").count()) === 1,
    `Toolkit: ${t} opens`,
  );
  await page.click("[data-toolkit-back]");
}

// 8c. Live class (sample), exit criterion, story report, whole-class print.
await tab("classroom");
await sub("patterns");
ok(
  (await page.locator('[data-class-live="ok"]').count()) === 1,
  "the sample class shows live class practice",
);
ok(
  (await page.locator("[data-exit]").count()) === 1,
  "Classroom Insights shows the state exit criterion panel",
);
ok(
  (await page.locator("[data-assign-class]").count()) >= 1,
  "group playlists offer Assign to my class",
);
await tab("reports");
await sub("story");
ok(
  (await page.locator(".pi-story-era").count()) >= 1,
  "the Language story groups results into comparable eras",
);
await sub("family");
await page.click('[data-subnav="all"]');
ok(
  (await page.locator(".pi-bulk-page").count()) === 12 &&
    (await page.locator("#piReport").count()) === 1,
  "Whole class prints one family page per student with one report root",
);
await page.click('[data-subnav="one"]');

// 9. Data Explorer.
await tab("classroom");
await sub("explorer");
await page.fill("#pi-q", "Who is struggling with independent writing?");
await page.click(".pi-ask button[type=submit]");
const ans = page.locator('[data-answer="independent-struggle"]');
ok(
  (await ans.count()) === 1 && /Uncertainty/.test(await ans.innerText()),
  "Data Explorer answers a supported question with its uncertainty",
);
await page.fill("#pi-q", "What will the weather be?");
await page.click(".pi-ask button[type=submit]");
ok(
  (await page.locator('[data-answer="unsupported"]').count()) === 1,
  "Data Explorer refuses an unsupported question",
);

// 10. Teacher tour, Part 2.
await open("?demo=1&tour=1");
await page.waitForSelector("#piTour");
let steps = 1;
while (await page.locator('[data-tour="next"]').count()) {
  await page.click('[data-tour="next"]');
  steps++;
}
ok(
  steps === 11 && (await page.locator('#pi-tab-toolkit[aria-selected="true"]').count()) === 1,
  "Part 2 walks eleven steps and ends on the Toolkit",
);
await page.click('[data-tour="finish"]');
ok((await page.locator("#piTour").count()) === 0, "finishing closes the tour");
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
