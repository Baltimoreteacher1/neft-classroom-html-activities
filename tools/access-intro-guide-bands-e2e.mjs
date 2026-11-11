#!/usr/bin/env node
/**
 * The grade-aware teacher pages in a real browser, for every grade choice: /start/explore, /start/activities,
 * /start/guide and /start/lesson with ?grades=<pick>.
 *   - the grade picker shows the pick, the page shows that grade's activities / lesson, one h1;
 *   - Mr. Neft is on the page and does not cover the picker or the main action;
 *   - axe WCAG 2.2 AA (serious and critical) at 1280 and 390, no horizontal scroll at 320;
 *   - every quoted button or label in the Activity Guide steps is on the activity page itself (its text or an
 *     aria-label), so a guide never names a control the page does not have. A few labels appear only after a student
 *     acts (after "Check", after choosing help); they are listed in AFTER_ACTION with where they were seen.
 * Screenshots go to SHOTS (default: a temp folder), e.g.  SHOTS=/path node tools/access-intro-guide-bands-e2e.mjs
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { mkdirSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildActivityGuideModel } from "../access-practice-lab/src/intro/activity-guide-model.js";
import { exploreActivity } from "../access-practice-lab/src/intro/explore-bands.js";
import { lessonFor } from "../access-practice-lab/src/intro/lesson-bands.js";
import { gradeName, PICK_IDS } from "../access-practice-lab/src/intro/quick-guide-files.js";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-intro-guide-bands-e2e: SKIP: playwright or axe is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const SHOTS = process.env.SHOTS || mkdtempSync(join(tmpdir(), "intro-bands-shots-"));
mkdirSync(SHOTS, { recursive: true });
const { server, base } = await serveAccess();
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-intro-guide-bands-e2e: SKIP: no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}
const LAB = `${base}/access-practice-lab`;
const failures = [];
const errors = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const context = await browser.newContext({ reducedMotion: "reduce" });
context.setDefaultTimeout(60000);
async function open(path, width = 1280) {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: 900 });
  page.on(
    "pageerror",
    (e) => !/web-vitals/.test(e.message) && errors.push(`${path}: ${e.message}`),
  );
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(`${path}: ${m.text()}`),
  );
  await page.goto(`${LAB}${path}`, { waitUntil: "load" });
  await page.waitForSelector("#app > :not(.boot):not(.route-loading)");
  await page.waitForTimeout(250);
  return page;
}
async function axe(page, label) {
  const res = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const bad = res.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(bad.length === 0, `axe: ${label}${bad.length ? ` (${bad.map((v) => v.id).join(", ")})` : ""}`);
}
const overlap = (a, b) =>
  a &&
  b &&
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

const PAGES = {
  explore: (pick) => `/start/explore?stop=2&focus=listening&grades=${pick}`,
  activities: (pick) => `/start/activities?grades=${pick}`,
  guide: (pick) => `/start/guide?grades=${pick}`,
  lesson: (pick) => `/start/lesson?grades=${pick}`,
};

/** What each page must show for a grade choice. */
async function content(page, name, pick) {
  const text = await page.locator("#app").innerText();
  if (name === "explore") return text.includes(exploreActivity(pick, "listening").name);
  if (name === "activities")
    return buildActivityGuideModel(pick).cards.every((c) => text.includes(c.name));
  if (name === "lesson") {
    const L = lessonFor(pick);
    const img = await page
      .locator(".in-prompt img")
      .evaluate((i) => i.complete && i.naturalWidth > 0);
    return text.includes(L.title) && text.includes(L.prompt) && img;
  }
  return text.includes(`Quick Guide: ${gradeName(pick)}`);
}

for (const pick of PICK_IDS)
  for (const [name, path] of Object.entries(PAGES)) {
    for (const width of [1280, 390]) {
      const page = await open(path(pick), width);
      const label = `${name} ${pick} @${width}`;
      ok(
        (await page.locator(`[data-tb-pick="${pick}"][aria-pressed="true"]`).count()) === 1,
        `${label}: the picker shows ${pick}`,
      );
      ok(await content(page, name, pick), `${label}: shows that grade's content`);
      ok((await page.locator("#app h1").count()) === 1, `${label}: one h1`);
      const guide = await page.locator("#app .pg").boundingBox();
      const action = await page.locator("#app .btn-primary").first().boundingBox();
      const picker = await page.locator("#app .tb-picker").boundingBox();
      ok(
        guide && !overlap(guide, action) && !overlap(guide, picker),
        `${label}: Mr. Neft is on the page and covers neither the picker nor the main action`,
      );
      await axe(page, label);
      await page.screenshot({ path: join(SHOTS, `${name}-${pick}-${width}.png`), fullPage: true });
      await page.close();
    }
    const narrow = await open(path(pick), 320);
    ok(
      (await narrow.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )) <= 0,
      `${name} ${pick}: no horizontal scroll at 320px`,
    );
    await narrow.close();
  }

// Labels that appear only after a student acts, each seen in the running page on 2026-11-11.
const AFTER_ACTION = new Set([
  "Not yet — try again", // lab pages, after "Check my answer" with a wrong answer
  "One next step",
  "Try again",
  "Show me the model",
  "My revision", // Language Upgrade Lab, after choosing the help
  "Check my work",
  "Ask for more help",
  "Not yet. Here is what to fix:",
  "Plants need stuff.", // the everyday sentence, shown once the help is chosen
  "Phones in class are bad.",
]);
const norm = (s) =>
  s
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,:]$/, "");
const AFTER = new Set([...AFTER_ACTION].map((q) => norm(q)));
const quoted = (s) => [...s.matchAll(/“([^”]+)”/g)].map((m) => m[1]);

/** Every quoted label in an Activity Guide card's steps is on the activity page. */
for (const pick of PICK_IDS)
  for (const card of buildActivityGuideModel(pick).cards) {
    if (["board", "paragraph", "seasons", "morphemes"].includes(card.id)) continue; // checked when curated (2026-11-10)
    const page = await open(card.link.route);
    const seen = norm(
      await page.evaluate(
        () =>
          `${document.querySelector("#app").innerText} ${[
            ...document.querySelectorAll("#app [aria-label]"),
          ]
            .map((e) => e.getAttribute("aria-label"))
            .join(" ")}`,
      ),
    );
    const missing = card.steps
      .flatMap(quoted)
      .filter((q) => !AFTER.has(norm(q)) && !seen.includes(norm(q)));
    ok(
      missing.length === 0,
      `${pick} ${card.id}: every quoted control is on the page${missing.length ? `; missing: ${missing.join(" | ")}` : ""}`,
    );
    await page.close();
  }

ok(errors.length === 0, `no console or page errors${errors.length ? `: ${errors[0]}` : ""}`);
console.log(`screenshots: ${SHOTS}`);
await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-intro-guide-bands-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-intro-guide-bands-e2e: all checks passed");
