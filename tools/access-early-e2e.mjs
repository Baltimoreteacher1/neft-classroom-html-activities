#!/usr/bin/env node
// K–3 bands in a real browser (source tree served locally): the early home for each band, the audio-first player
// (Listening, Reading, Speaking, Writing), Story Time, Sound Builder, picture word cards, family time, the gate on a
// grades 3–8 room, and the 4-5 picker alias. At 390px and 1366px: no console errors, no horizontal scroll, axe
// WCAG 2.2 AA (serious/critical), answer targets at least 64px, and a miss that keeps every choice.
//   node tools/access-early-e2e.mjs        (BASE=<url> to point elsewhere; a missing browser is a SKIP)
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
  console.warn(`access-early-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 3);
}

const failures = [];
const fail = (m) => failures.push(m);
const ROUTES = [
  ["/early?grades=K", "Kindergarten"],
  ["/early?grades=1", "Grade 1"],
  ["/early?grades=2-3", "Grades 2–3"],
  ["/?grades=K", "Kindergarten"],
  ["/early/story?grades=K", "Our Neighborhood Garden"],
  ["/early/phonics?grades=1", "Sound Builder"],
  ["/early/words?grades=2-3", "In the garden"],
  ["/early/family?grades=1", "Family time"],
  ["/family?grades=K", "Family time"],
  ["/Listening/A/g23-l-a-garden-helper?grades=2-3", "Who Waters the Garden?"],
  ["/Reading/B/g1-r-b-plant-grow?grades=1", "The Seed Grows"],
  ["/Speaking/A/g23-s-a-garden-see?grades=2-3", "What Do You See in the Garden?"],
  ["/Writing/C/g23-w-c-bean-howto?grades=2-3", "How to Plant a Seed"],
  ["/Speaking/A/gk-s-a-garden-see?grades=K", "What Do You See?"],
  ["/Listening/B/gk-l-b-rhyme-cat?grades=K", "What Rhymes with Cat?"],
  ["/Speaking/B/gk-s-b-snow-day?grades=K", "A Snowy Day"],
  ["/Writing/B/gk-w-b-i-feel?grades=K", "I Feel Happy"],
  ["/Listening/C/g1-l-c-cross-safe?grades=1", "Crossing the Street"],
  ["/Reading/C/g1-r-c-ice-steps?grades=1", "Ice Turns to Water"],
  ["/Speaking/C/g1-s-c-healthy-plate?grades=1", "Foods That Help Me Grow"],
  ["/Writing/C/g1-w-c-my-family?grades=1", "My Family Eats Together"],
  ["/Listening/C/g23-l-c-plant-needs?grades=2-3", "What Plants Need"],
  ["/Reading/C/g23-r-c-letter-journey?grades=2-3", "A Letter's Trip"],
  ["/Speaking/C/g23-s-c-steam-pot?grades=2-3", "Water Gets Hot"],
  ["/Writing/C/g23-w-c-matter-states?grades=2-3", "Ice, Water and Steam"],
  ["/reality?grades=K", "This room is made for grades 3–8."],
  ["/Listening/A?grades=1", ""],
  ["/?grades=4-5", ""],
];

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
  for (const [path, heading] of ROUTES) {
    errors.length = 0;
    await page.goto(`${BASE}/access-practice-lab${path}`, { waitUntil: "load" });
    await page
      .waitForSelector("#app h1", { timeout: 20000 })
      .catch(() => fail(`${width} ${path}: no h1`));
    const h1 = (await page.textContent("#app h1").catch(() => "")) || "";
    if (heading && !h1.includes(heading))
      fail(`${width} ${path}: h1 "${h1.trim()}" lacks "${heading}"`);
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    if (over > 1) fail(`${width} ${path}: horizontal scroll ${over}px`);
    const small = await page.$$eval(".early-pick, .early-big, .early-ph-tile, .early-card", (els) =>
      els
        .filter(
          (e) =>
            e.offsetParent &&
            (e.getBoundingClientRect().height < 63.5 || e.getBoundingClientRect().width < 63.5),
        )
        .map((e) => e.className),
    );
    if (small.length) fail(`${width} ${path}: targets under 64px: ${small.slice(0, 3).join(", ")}`);
    const axe = await new AxeBuilder({ page })
      .include("#app")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    for (const v of axe.violations.filter((x) => ["serious", "critical"].includes(x.impact)))
      fail(`${width} ${path}: axe ${v.id} (${v.nodes.length})`);
    if (errors.length) fail(`${width} ${path}: console ${errors.join(" | ").slice(0, 300)}`);
  }
  // A miss keeps every choice and never shows the answer; the right pick then succeeds.
  await page.goto(`${BASE}/access-practice-lab/Listening/A/g23-l-a-garden-helper?grades=2-3`, {
    waitUntil: "load",
  });
  await page.waitForSelector("[data-early-pick]");
  const n = await page.locator("[data-early-pick]").count();
  const texts = await page.locator(".early-choice-text").allTextContents();
  const wrong = texts.findIndex((t) => t.trim() !== "Ana");
  await page.locator("[data-early-pick]").nth(wrong).click();
  await page.click("[data-early-check]");
  await page.waitForSelector(".early-feedback.is-again");
  if ((await page.locator("[data-early-pick]").count()) !== n)
    fail(`${width}: a miss removed a choice`);
  if ((await page.textContent(".early-feedback")).includes("Ana"))
    fail(`${width}: a miss showed the answer`);
  await page
    .locator("[data-early-pick]")
    .nth(texts.findIndex((t) => t.trim() === "Ana"))
    .click();
  await page.click("[data-early-check]");
  await page.waitForSelector(".early-feedback.is-right");
  // The record is the same one the room list reads.
  await page.goto(`${BASE}/access-practice-lab/Listening/A?grades=2-3`, { waitUntil: "load" });
  await page.waitForSelector("#app h1");
  if (!(await page.locator(".act-row.is-done").count()))
    fail(`${width}: room list does not show the audio-first result as done`);
  // Turning audio-first off opens the classic page for the same band.
  await page.goto(`${BASE}/access-practice-lab/Listening/A/g23-l-a-rainy-park?grades=2-3`, {
    waitUntil: "load",
  });
  await page.click("[data-early-toggle]");
  await page.waitForSelector("[data-early-on]");
  await page.click("[data-early-on]");
  await page.waitForSelector("[data-early-player]");
  await context.close();
}

await browser.close();
server?.close();
if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  console.error(`access-early-e2e — ${failures.length} problem(s)`);
  process.exit(1);
}
console.log(
  `access-early-e2e — PASS · ${ROUTES.length} routes × 2 widths, audio-first miss/retry, record shared with rooms, mode switch`,
);
