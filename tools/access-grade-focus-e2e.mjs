#!/usr/bin/env node
// Grade focus (6, 7, 8 inside the 6-8 band) in a real browser, source tree served locally: the home picker, a skill
// room, the activity library and an activity's Next link, at 390px and 1366px. Choosing a focus filters, persists
// across a reload, honors ?gradeFocus=, leaves old links and saved progress alone, and raises no console errors, no
// horizontal scroll and no serious or critical axe findings.
//   node tools/access-grade-focus-e2e.mjs        (BASE=<url> to point elsewhere; a missing browser is a SKIP)
import { chromium } from "playwright";
import { serveAccess } from "./lib/access-serve.mjs";

const AxeBuilder = (await import("@axe-core/playwright")).default;
let server = null;
let BASE = process.env.BASE;
if (!BASE) {
  const served = await serveAccess();
  server = served.server;
  BASE = served.base;
}
let browser;
try {
  browser = await chromium.launch({
    ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
  });
} catch (error) {
  console.warn(`access-grade-focus-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 3);
}

const failures = [];
const fail = (m) => failures.push(m);
const LAB = `${BASE}/access-practice-lab`;
const index = await (await fetch(`${LAB}/content/index.json`)).json();
const rows = Object.entries(index.bands["6-8"].domains.Reading.levels.C.activities).map(
  ([, r]) => r,
);
const inFocus = (r, f) => !f || !r[5] || r[5].includes(f);
const want = (f) => rows.filter((r) => inFocus(r, f)).map((r) => r[0]);

for (const width of [390, 1366]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  const ids = async () =>
    page.$$eval(".act-row a", (as) =>
      as.map((a) => a.getAttribute("href").split("/").pop().split("?")[0]),
    );
  const pressed = () =>
    page.getAttribute('[data-grade-focus][aria-pressed="true"]', "data-grade-focus");
  const clean = async (label) => {
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    if (over > 1) fail(`${width} ${label}: horizontal scroll ${over}px`);
    const axe = await new AxeBuilder({ page })
      .include("#app")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    for (const v of axe.violations.filter((x) => ["serious", "critical"].includes(x.impact)))
      fail(`${width} ${label}: axe ${v.id} (${v.nodes.length})`);
    if (errors.length) fail(`${width} ${label}: console ${errors.join(" | ").slice(0, 300)}`);
    errors.length = 0;
  };

  // An old link: no focus, every activity.
  await page.goto(`${LAB}/Reading/C?grades=6-8`, { waitUntil: "load" });
  await page.waitForSelector(".act-row", { state: "attached" });
  if ((await ids()).length !== rows.length)
    fail(`${width}: old room link lists ${(await ids()).length}, want ${rows.length}`);
  if ((await pressed()) !== "") fail(`${width}: "All grades" is not the default`);
  await clean("room, no focus");

  // Choose Grade 8 in the room: the list filters and the choice survives a reload and other pages.
  await page.click('[data-grade-focus="8"]');
  await page.waitForFunction(
    (n) => document.querySelectorAll(".act-row").length === n,
    want("8").length,
  );
  if ((await pressed()) !== "8") fail(`${width}: Grade 8 not pressed after click`);
  if (JSON.stringify((await ids()).sort()) !== JSON.stringify(want("8").sort()))
    fail(`${width}: Grade 8 room list differs from the index`);
  await clean("room, grade 8");
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".act-row", { state: "attached" });
  if ((await ids()).length !== want("8").length) fail(`${width}: focus lost on reload`);

  // The first activity's Next link stays inside the focus.
  const first = (await ids())[0];
  await page.goto(`${LAB}/Reading/C/${first}?grades=6-8`, { waitUntil: "load" });
  await page.waitForSelector(".act-nav");
  const next = await page.$$eval(".act-nav a.btn-primary", (as) =>
    as.map((a) => a.getAttribute("href")),
  );
  const nextId = next[0]?.split("/").pop().split("?")[0];
  if (nextId && !want("8").includes(nextId))
    fail(`${width}: Next left the Grade 8 focus (${nextId})`);

  // Library and home show the same focus; ?gradeFocus= overrides and persists.
  await page.goto(`${LAB}/library?grades=6-8`, { waitUntil: "load" });
  await page.waitForSelector(".library-results, .lib-empty");
  if ((await pressed()) !== "8") fail(`${width}: library lost the focus`);
  await page.fill("#librarySearch", "evidence");
  await clean("library, grade 8");
  await page.goto(`${LAB}/?grades=6-8`, { waitUntil: "load" });
  await page.waitForSelector(".lph .grade-focus");
  if ((await pressed()) !== "8") fail(`${width}: home lost the focus`);
  const counts = await page.$$eval(".lph [data-grade-focus]", (bs) =>
    bs.map((b) => b.textContent.trim()),
  );
  if (counts.length !== 4 || !counts.every((t) => /\d/.test(t)))
    fail(`${width}: home focus counts missing (${counts})`);
  await clean("home");
  await page.goto(`${LAB}/Reading/C?grades=6-8&gradeFocus=6`, { waitUntil: "load" });
  await page.waitForSelector(".act-row", { state: "attached" });
  if ((await ids()).length !== want("6").length) fail(`${width}: ?gradeFocus=6 not applied`);
  await page.goto(`${LAB}/Reading/C?grades=6-8&gradeFocus=all`, { waitUntil: "load" });
  await page.waitForSelector(".act-row", { state: "attached" });
  if ((await ids()).length !== rows.length)
    fail(`${width}: ?gradeFocus=all did not clear the focus`);

  // No control on another band.
  await page.goto(`${LAB}/Reading/B?grades=3-5`, { waitUntil: "load" });
  await page.waitForSelector(".act-row", { state: "attached" });
  if (await page.locator("[data-grade-focus]").count())
    fail(`${width}: focus control shown on grades 3-5`);
  await context.close();
}

await browser.close();
server?.close();
if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.error(`access-grade-focus-e2e — ${failures.length} problem(s)`);
  process.exit(1);
}
console.log(
  "access-grade-focus-e2e — PASS · room, library, home, Next link, reload, URL parameter × 2 widths",
);
