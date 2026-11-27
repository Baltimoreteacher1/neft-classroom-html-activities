#!/usr/bin/env node
/**
 * validate-find-browser.mjs — /curriculum/find/ driven the way a teacher and a student drive it, in Chromium.
 *
 *   Teacher: Plan a set from the form (lesson + purpose), every pick equal to plan-engine.js for that request, Swap
 *   moves to the engine's next choice and survives a reload, Save as a collection, reorder, note, the share link
 *   opened on a fresh device, Print shows only the set, Clear everything empties the device.
 *   Student: My practice path, "I did this" marks kept across a reload, the resume card on the search page, the
 *   finish panel and the next lesson's path.
 *   Every state at 1366px and 390px: no horizontal scroll, 44px controls, axe WCAG A/AA/2.2 (serious/critical), no
 *   console error. Storage blocked: the page still works and says it cannot save.
 *
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
const FIND = `${BASE}/curriculum/find/`;

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
// The source tree has no Vite build: build-time fonts and the telemetry loader 404 here. That is the harness.
const harmless = (text) => /web-vitals|ERR_ABORTED|Failed to load resource/.test(text);

/* The expected sets come from the engine and the index, not from the page under test. */
const index = JSON.parse(readFileSync(join(ROOT, "data/curriculum-find-index.json"), "utf8"));
const engine = await import(pathToFileURL(join(ROOT, "curriculum/find/plan-engine.js")).href);
const expected = (target, purpose, swaps = {}) =>
  engine.applySwaps(engine.buildSet(index, target, purpose), swaps);
const hrefsOf = (set) =>
  set.slots.map((s) => (s.external ? s.external.href : s.pick ? s.pick.doc.p : null));

async function open(viewport, url, { blockStorage = false } = {}) {
  const context = await browser.newContext({ viewport });
  if (blockStorage)
    await context.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("blocked", "SecurityError");
        },
      });
    });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !harmless(m.text()) && errors.push(m.text()));
  await page.goto(url, { waitUntil: "networkidle" });
  return { page, context, errors };
}

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
async function layout(page, label) {
  const m = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    small: [
      ...document.querySelectorAll(
        ".find-wrap button, .find-wrap select, .find-modes a, .find-starters a",
      ),
    ]
      .filter((e) => e.offsetParent && !e.closest("[hidden]"))
      .map((e) => [e.textContent.trim().slice(0, 30), e.getBoundingClientRect().height])
      .filter(([, h]) => h > 0 && h < 43.5),
  }));
  check(!m.overflow, `${label}: no horizontal scroll`);
  check(
    !m.small.length,
    `${label}: every control is at least 44px tall${m.small.length ? ` (${m.small.map((x) => x.join(" ")).join("; ")})` : ""}`,
  );
}
const slotHrefs = (page) =>
  page.$$eval(".find-plan-slots > li", (lis) =>
    lis.map((li) => li.querySelector("h4 a")?.getAttribute("href") || null),
  );

for (const viewport of [
  { width: 1366, height: 900 },
  { width: 390, height: 844 },
]) {
  const w = `${viewport.width}px`;

  /* ---------- teacher: plan a set ---------- */
  {
    const { page, context, errors } = await open(viewport, `${FIND}?mode=plan`);
    check(
      (await page.locator(".find-wrap").getAttribute("data-mode")) === "plan",
      `${w} ?mode=plan opens Plan a set`,
    );
    check(
      (await page.locator(".find-starters a").count()) === 6,
      `${w} six common needs to start from`,
    );
    await layout(page, `${w} plan form`);
    await axe(page, `${w} plan form`);
    // Submitting with nothing chosen explains, and does not navigate.
    await page.locator("#find-plan-form button[type=submit]").click();
    check(
      /Choose a lesson/.test(await page.locator("#find-plan-error").innerText()),
      `${w} the form says what is missing`,
    );
    await page.selectOption("#find-plan-target", "6-6");
    await page.locator("input[name='for'][value='intervene']").check();
    await page.locator("#find-plan-form button[type=submit]").click();
    await page.waitForSelector(".find-plan-slots");
    check(
      page.url().includes("target=6-6") && page.url().includes("for=intervene"),
      `${w} the set is in the URL`,
    );
    const want = expected("6-6", "intervene");
    check(
      JSON.stringify(await slotHrefs(page)) === JSON.stringify(hrefsOf(want)),
      `${w} every pick equals plan-engine.js for 6-6 / small-group reteach`,
    );
    check(
      (await page.locator(".find-slot-why").count()) === want.slots.length,
      `${w} every part says why it was chosen`,
    );
    // Swap the game, and the swap survives a reload.
    const game = want.slots.find((s) => s.id === "game");
    await page.locator("#find-slot-game .find-swap").click();
    await page.waitForURL(/swap=game%3A1/);
    check(
      (await page.locator("#find-slot-game h4 a").getAttribute("href")) === game.alts[0].doc.p,
      `${w} Swap shows the engine's next choice`,
    );
    await page.reload({ waitUntil: "networkidle" });
    check(
      (await page.locator("#find-slot-game h4 a").getAttribute("href")) === game.alts[0].doc.p,
      `${w} a swap survives a reload`,
    );
    await layout(page, `${w} built set`);
    await axe(page, `${w} built set`);
    // Save as a collection.
    await page.getByRole("button", { name: "Save as a collection" }).click();
    const n = want.slots.filter((s) => s.pick || s.external).length;
    check(
      (await page.locator("#find-saved-count").innerText()) === String(n),
      `${w} Save as a collection keeps all ${n} parts`,
    );
    check(
      (await page.locator("#find-set-name").innerText()) === "Lesson 6-6 · Small-group reteach",
      `${w} the collection is named for the lesson and purpose`,
    );
    // Reorder and note.
    const first = await page.locator("#find-saved-list li a").first().innerText();
    await page.locator("#find-saved-list li").nth(1).locator("[data-move='up']").click();
    check(
      (await page.locator("#find-saved-list li a").nth(1).innerText()) === first,
      `${w} Up moves an item`,
    );
    const noteEdit = page.locator("#find-saved-list li").first().locator(".find-note-edit");
    await noteEdit.locator("summary").click();
    await noteEdit.locator("textarea").fill("Group 1, Tuesday");
    await noteEdit.getByRole("button", { name: /Save the note/ }).click();
    check(
      (await page
        .locator("#find-saved-list li")
        .first()
        .locator(".find-saved-note-text")
        .innerText()) === "Group 1, Tuesday",
      `${w} a note is saved on the item`,
    );
    await page.reload({ waitUntil: "networkidle" });
    check(
      (await page
        .locator("#find-saved-list li")
        .first()
        .locator(".find-saved-note-text")
        .innerText()) === "Group 1, Tuesday",
      `${w} the collection, order and note survive a reload`,
    );
    // Print shows the set only.
    await page.evaluate(() => document.body.classList.add("find-print-plan"));
    await page.emulateMedia({ media: "print" });
    const printed = await page.evaluate(() => ({
      plan: getComputedStyle(document.querySelector(".find-plan-slots")).display !== "none",
      side: getComputedStyle(document.getElementById("find-saved")).display,
      buttons: [...document.querySelectorAll(".find-wrap button")].filter((b) => b.offsetParent)
        .length,
    }));
    check(
      printed.plan && printed.side === "none" && printed.buttons === 0,
      `${w} Print this set prints the set alone, with no buttons`,
    );
    await page.emulateMedia({ media: "screen" });
    await page.evaluate(() => document.body.classList.remove("find-print-plan"));
    // Share link, opened on a fresh device.
    await page.locator("#find-share").click();
    const shared = await page.evaluate(() => navigator.clipboard.readText());
    check(/#share=[\w-]+$/.test(shared), `${w} Copy share link copies a #share link`);
    const fresh = await open(viewport, shared.replace(/^https?:\/\/[^/]+/, BASE));
    await fresh.page.waitForSelector("#find-shared:not([hidden]) li");
    check(
      (await fresh.page.locator("#find-shared li").count()) === n,
      `${w} the share link opens the ${n} resources on another device`,
    );
    check(
      (await fresh.page.locator("#find-shared .find-saved-note-text").first().innerText()) ===
        "Group 1, Tuesday",
      `${w} the shared copy carries the teacher's note`,
    );
    await axe(fresh.page, `${w} shared collection`);
    await fresh.page.getByRole("button", { name: "Save a copy on this device" }).click();
    check(
      (await fresh.page.locator("#find-saved-count").innerText()) === String(n) &&
        !(await fresh.page.evaluate(() => location.hash)),
      `${w} Save a copy keeps the set and clears the link`,
    );
    check(
      fresh.errors.length === 0,
      `${w} no console errors on the shared link${fresh.errors.length ? `: ${fresh.errors[0]}` : ""}`,
    );
    await fresh.context.close();
    // Clear everything.
    await page.locator("#find-forget").click();
    const left = await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k.startsWith("ewl-find")),
    );
    check(left.length === 0, `${w} Clear everything leaves nothing from Find on the device`);
    check(
      errors.length === 0,
      `${w} no console errors while planning${errors.length ? `: ${errors[0]}` : ""}`,
    );
    await context.close();
  }

  /* ---------- student: practice path ---------- */
  {
    const { page, context, errors } = await open(viewport, `${FIND}?mode=path`);
    check(
      (await page.locator("#find-saved").isVisible()) === false,
      `${w} the student path hides the teacher collections`,
    );
    await page.selectOption("#find-path-lesson", "4-2");
    await page.locator("#find-path-form button[type=submit]").click();
    await page.waitForSelector(".find-steps");
    const want = expected("4-2", "path").slots.filter((s) => s.pick);
    check(
      JSON.stringify(
        await page.$$eval(".find-step-go", (as) => as.map((a) => a.getAttribute("href"))),
      ) === JSON.stringify(want.map((s) => s.pick.doc.p)),
      `${w} the path's steps equal plan-engine.js for 4-2`,
    );
    await layout(page, `${w} practice path`);
    await axe(page, `${w} practice path`);
    const marks = page.locator(".find-step-done");
    await marks.nth(0).click();
    await marks.nth(1).click();
    check(
      (await page.locator(".find-path-progress").innerText()) === `2 of ${want.length} steps done`,
      `${w} marks count up`,
    );
    await page.reload({ waitUntil: "networkidle" });
    check(
      (await page.locator(".find-step-done[aria-pressed='true']").count()) === 2,
      `${w} marks survive a reload`,
    );
    await page.goto(FIND, { waitUntil: "networkidle" });
    check(
      /Continue my practice path[\s\S]*2 of/.test(await page.locator("#find-resume").innerText()),
      `${w} the search page offers to continue the path`,
    );
    await page.locator("#find-resume a").click();
    await page.waitForSelector(".find-steps");
    for (let i = 2; i < want.length; i++) await page.locator(".find-step-done").nth(i).click();
    check(
      await page.locator(".find-path-finish").isVisible(),
      `${w} finishing every step shows the finish panel`,
    );
    check(
      (await page.locator(".find-path-finish a").getAttribute("href")) === "?mode=path&lesson=4-3",
      `${w} the finish panel links the next lesson's path`,
    );
    // The path output only: the lesson list itself names real lessons ("Graph Points on the Coordinate Plane").
    const words = await page.locator("#find-path-out").innerText();
    check(
      !/\b(score|points|level up|streak|rank)\b/i.test(words),
      `${w} the path never talks about scores`,
    );
    await axe(page, `${w} finished path`);
    // Back returns to the last view.
    await page.goBack({ waitUntil: "networkidle" });
    check(
      (await page.locator(".find-wrap").getAttribute("data-mode")) === "search",
      `${w} Back returns to search`,
    );
    check(
      errors.length === 0,
      `${w} no console errors on the path${errors.length ? `: ${errors[0]}` : ""}`,
    );
    await context.close();
  }

  /* ---------- search still works, and storage blocked ---------- */
  {
    const { page, context, errors } = await open(
      viewport,
      `${FIND}?q=practice+equivalent+expressions`,
      {
        blockStorage: true,
      },
    );
    await page.waitForSelector("#find-list > li");
    check(
      (await page.locator("#find-list > li").count()) > 0,
      `${w} search answers with storage blocked`,
    );
    await page.locator("#find-list .find-save").first().click();
    check(
      /not letting the page save/.test(await page.locator("#find-saved-status").innerText()),
      `${w} with storage blocked, Save works for the visit and says so`,
    );
    await layout(page, `${w} search results`);
    await axe(page, `${w} search results`);
    check(
      errors.length === 0,
      `${w} no console errors on search${errors.length ? `: ${errors[0]}` : ""}`,
    );
    await context.close();
  }
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\nvalidate-find-browser FAILED (${failures.length}):\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log("\n✓ validate-find-browser passed");
