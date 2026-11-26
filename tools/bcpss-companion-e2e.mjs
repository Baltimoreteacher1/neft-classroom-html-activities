#!/usr/bin/env node
// bcpss-companion-e2e — the Plan & Respond tab on /bcpss-teachers/, driven the way a teacher drives it, in Chromium
// against the source tree plus the real unit data. At 1366px and 390px:
//   Unit map (goals, sequence, resource groups) · Build a set (purpose, level, fade, print) · Check work (shows
//   observations vs things to check, name warning, nothing sent over the network) · Reteach plan (both pathways, print)
// plus no horizontal scroll, 44px targets on controls, axe WCAG A/AA serious+critical = 0, and no console errors.
// Exits 3 (SKIP) when Chromium is unavailable.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { listUnits } from "../functions/_lib/bcpss/db.js";
import { startStudioServer } from "./lib/bcpss-studio-serve.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UNIT = "g6-math-u2";
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : ` — ${detail}`}`);
};

const { chromium } = await import("playwright");
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (err) {
  process.exit(
    skipExit(
      `Chromium unavailable (${err.message.split("\n")[0]})`,
      "Install Playwright Chromium or set PW_CHROMIUM_PATH.",
    ),
  );
}
const server = await startStudioServer(ROOT);
const detail = await server.detailFor(UNIT);
const axeSource = readFileSync(resolve(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");

async function run(width, label) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const errors = [];
  const writes = [];
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  page.on(
    "request",
    (r) =>
      r.method() !== "GET" && /\/api\//.test(r.url()) && writes.push(`${r.method()} ${r.url()}`),
  );
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/bcpss/units") {
      const { units } = await listUnits(
        {},
        url.searchParams.get("grade"),
        url.searchParams.get("subject"),
      );
      return route.fulfill({
        json: {
          grade: url.searchParams.get("grade"),
          subject: url.searchParams.get("subject"),
          units,
        },
      });
    }
    if (/^\/api\/bcpss\/units\/[^/]+$/.test(url.pathname)) return route.continue();
    return route.fulfill({ status: 200, json: {} });
  });
  await page.goto(`${server.origin}/bcpss-teachers/?unit=${UNIT}&tab=plan`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".cp .cp-question", { timeout: 20000 });
  const T = (s) => `[${label}] ${s}`;

  // Unit map
  const q = await page.textContent(".cp-question");
  check(T("map shows the unit's big question"), q.trim() === detail.studio.essential_question, q);
  check(
    T("map shows content and language goals"),
    (await page.textContent(".cp-goals")).includes(detail.studio.can_do.language),
  );
  await page.waitForSelector(".cp-seq-card[data-cp-unit]", { timeout: 8000 }).catch(() => {});
  const nextCard = await page.$$eval(".cp-seq-card[data-cp-unit]", (els) =>
    els.map((e) => e.dataset.cpUnit),
  );
  check(T("map links the neighbouring unit"), nextCard.includes("g6-math-u3"), nextCard.join(","));
  const groups = await page.$$eval(".cp-group h4", (els) =>
    els.map((e) => e.textContent.replace(/\d+$/, "").trim()),
  );
  check(
    T("map groups resources into the six teacher groups"),
    groups.length >= 5 && groups.includes("Teach and explain"),
    groups.join("|"),
  );

  // Build a set
  await page.click('[data-cp-view="build"]');
  await page.click('[data-cp-purpose="vocab"]');
  const rows = await page.$$eval(".cp-set .cp-item", (els) => els.length);
  const picked = await page.$$eval(".cp-set .cp-check:checked", (els) => els.length);
  check(
    T("vocabulary purpose assembles a set with defaults picked"),
    rows >= 5 && picked >= 3 && picked <= 5,
    `${rows}/${picked}`,
  );
  await page.click(".cp-set .cp-check:checked");
  check(
    T("unchecking an item sticks across a redraw"),
    (await page.$$eval(".cp-set .cp-check:checked", (e) => e.length)) === picked - 1,
  );
  const before = await page.textContent(".cp-preview");
  await page.click('[data-cp-level="1_2"]');
  await page.click('[data-cp-fade="2"]');
  const after = await page.textContent(".cp-preview");
  check(
    T("fading to word bank removes frames from the preview"),
    before !== after && /only the word bank/.test(after),
    after.slice(0, 200),
  );
  check(
    T("level and fade selections show pressed state"),
    (await page.getAttribute('[data-cp-fade="2"]', "aria-pressed")) === "true" &&
      (await page.getAttribute('[data-cp-level="1_2"]', "aria-pressed")) === "true",
  );
  await page.click('[data-cp-fade="0"]');
  const [pop] = await Promise.all([
    context.waitForEvent("page"),
    page.click('[data-cp-print="support"]'),
  ]);
  await pop.waitForLoadState("domcontentloaded");
  const popText = await pop.textContent("body");
  check(
    T("support sheet opens as a printable page with the unit's words"),
    /Language Support/.test(popText) &&
      popText.includes(detail.studio.vocab[0].term) &&
      popText.includes(detail.studio.essential_question),
  );
  await pop.close();

  // Check work
  await page.click('[data-cp-view="check"]');
  await page.fill("#cpText", detail.studio.exit_ticket.model);
  const before404 = writes.length;
  await page.click("[data-cp-analyze]");
  const shown = await page.textContent(".cp-result");
  check(
    T("check work separates what it shows from things to check"),
    /What the work shows/.test(shown) && /Things to check/.test(shown) && /guesses/.test(shown),
  );
  check(
    T("model answer includes every number"),
    /every number in the model/.test(shown),
    shown.slice(0, 300),
  );
  await page.fill("#cpText", "My name is Ana. 2 and 5 is 7");
  await page.click("[data-cp-analyze]");
  check(
    T("a name in the text raises a privacy warning"),
    (await page.textContent(".cp-result")).includes("may contain a name"),
  );
  const full = await page.textContent(".cp-check-view");
  check(
    T("check work never states a level, score or diagnosis"),
    !/proficien|disabilit|\bscore of|level [1-6]\b/i.test(full),
    full.slice(0, 200),
  );
  check(
    T("check work sends nothing over the network"),
    writes.length === before404 && writes.length === 0,
    writes.join(","),
  );
  const [slip] = await Promise.all([
    context.waitForEvent("page"),
    page.click('[data-cp-print="slip"]'),
  ]);
  await slip.waitForLoadState("domcontentloaded");
  const slipText = await slip.textContent("body");
  check(
    T("feedback slip carries strengths and a fresh task, not analysis notes"),
    /What you did well/.test(slipText) &&
      /Try a new one/.test(slipText) &&
      !/Things to check/.test(slipText),
  );
  await slip.close();

  // Reteach
  await page.click('[data-cp-view="reteach"]');
  check(T("reteach plan has eight steps"), (await page.$$eval(".cp-step", (e) => e.length)) === 8);
  const contentModel = await page.textContent(".cp-step:nth-child(3)");
  await page.click('[data-cp-pathway="language"]');
  const languageModel = await page.textContent(".cp-step:nth-child(3)");
  check(
    T("content and language pathways differ at the model step"),
    contentModel !== languageModel && /Take apart|mentor|Ask:/.test(languageModel),
    languageModel.slice(0, 160),
  );
  const [plan] = await Promise.all([
    context.waitForEvent("page"),
    page.click('[data-cp-print="reteach"]'),
  ]);
  await plan.waitForLoadState("domcontentloaded");
  check(
    T("reteach plan prints with all steps"),
    (await plan.$$eval(".step", (e) => e.length)) === 8,
  );
  await plan.close();

  // Layout, targets, axe, keyboard
  for (const view of ["map", "build", "check", "reteach"]) {
    await page.click(`[data-cp-view="${view}"]`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(T(`${view}: no horizontal scroll`), overflow <= 0, `${overflow}px`);
    const small = await page.$$eval(".cp button, .cp a.cp-btn, .cp select, .cp .cp-check", (els) =>
      els
        .filter(
          (e) =>
            e.offsetParent &&
            (e.getBoundingClientRect().height < 43.5 || e.getBoundingClientRect().width < 43.5),
        )
        .map((e) => `${e.className}:${Math.round(e.getBoundingClientRect().height)}`),
    );
    check(
      T(`${view}: controls are at least 44px`),
      small.length === 0,
      small.slice(0, 4).join(" "),
    );
    await page.evaluate(axeSource);
    const axe = await page.evaluate(async () => {
      const r = await window.axe.run(document.querySelector("#panel-plan"), {
        runOnly: ["wcag2a", "wcag2aa", "wcag22aa"],
      });
      return r.violations
        .filter((v) => ["serious", "critical"].includes(v.impact))
        .map((v) => `${v.id}:${v.nodes.length}`);
    });
    check(T(`${view}: axe serious/critical = 0`), axe.length === 0, axe.join(","));
  }
  await page.click('[data-cp-view="map"]');
  await page.focus('[data-cp-view="build"]');
  await page.keyboard.press("Enter");
  check(
    T("keyboard Enter switches the view and keeps focus on it"),
    (await page.getAttribute('[data-cp-view="build"]', "aria-pressed")) === "true" &&
      (await page.evaluate(() => document.activeElement?.dataset.cpView)) === "build",
  );
  check(T("no console or page errors"), errors.length === 0, errors.slice(0, 3).join(" | "));
  await context.close();
}

try {
  await run(1366, "desktop");
  await run(390, "phone");
} finally {
  await browser.close();
  await server.close();
}
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
