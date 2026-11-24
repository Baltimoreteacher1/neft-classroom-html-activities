#!/usr/bin/env node
// bcpss-studio-links-e2e — the activity <-> lesson links and the shared enhancement pack, driven like a student
// and a teacher drive them, in Chromium against the source tree plus the real unit/lesson API data.
//   - an activity's "Part of lesson" chips open that lesson, and the lesson lists the activity back
//   - the lesson page's "Practice in the Studio" links open the right activity
//   - Grade 6 math lessons show Reveal Math lessons to a teacher, never to a student view
//   - "How to play" opens the first time a kind is met and is folded away afterwards
//   - finishing an activity offers a confidence check (saved on the device), a level nudge and the lesson
// Exits 3 (SKIP) when Chromium is unavailable.
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { startStudioServer } from "./lib/bcpss-studio-serve.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STUDIO = "/bcpss-teachers/language-studio/";
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
const UNIT = "g6-math-u1";
const detail = await server.detailFor(UNIT);
const acts = detail.studio.activities;
const talk = acts.findIndex((a) => a.kind === "talk_cards") + 1;
const match = acts.findIndex((a) => a.kind === "match") + 1;

const context = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => {
  if (!/web-vitals/.test(e.message)) errors.push(e.message);
});
const open = async (query) => {
  await page.goto(`${server.origin}${STUDIO}?unit=${UNIT}&${query}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".st-main > *:not(.st-loading)", { timeout: 15000 });
};

// 1. chips on an activity open the lesson, and the lesson lists the activity back
await open(`a=${match}&level=l3_4`);
const first = acts[match - 1].lessons[0];
const chip = page.locator(".st-run__lessons a").first();
check(
  "activity shows a chip for each linked lesson",
  (await page.locator(".st-run__lessons a").count()) === acts[match - 1].lessons.length,
);
check(
  "chip names the lesson",
  (await chip.textContent()).includes(first.title),
  await chip.textContent(),
);
check("chip is a 44px target", ((await chip.boundingBox())?.height ?? 0) >= 43.5);
await chip.click();
await page.waitForSelector(".sl h1", { timeout: 10000 });
check("chip opens the linked lesson", (await page.locator(".sl h1").textContent()) === first.title);
const listed = await page.locator(".sl-practice__link b").allTextContents();
check(
  "lesson lists the activity back under Practice in the Studio",
  listed.includes(acts[match - 1].title),
  listed.join(" | "),
);

// 2. a practice link opens its activity
await page
  .locator(".sl-practice__link", { hasText: acts[match - 1].title })
  .first()
  .click();
await page.waitForSelector("#stRunTitle", { timeout: 10000 });
check(
  "practice link opens the activity",
  (await page.locator("#stRunTitle").textContent()) === acts[match - 1].title,
);

// 3. Reveal Math: teacher view yes, student view no
await open(`lesson=${first.id}&level=l3_4`);
await page.waitForSelector(".sl h1");
const revealLinks = await page.locator(".sl-reveal a").count();
check(
  "Grade 6 math lesson shows Reveal Math lessons to a teacher",
  revealLinks > 0,
  `${revealLinks} links`,
);
if (revealLinks) {
  const href = await page.locator(".sl-reveal a").first().getAttribute("href");
  check("Reveal Math link points at a lesson page", /\/lessons\/\d+-\d+\/$/.test(href), href);
}
await open(`lesson=${first.id}&level=l3_4&view=student`);
await page.waitForSelector(".sl h1");
check("student view has no Reveal Math section", (await page.locator(".sl-reveal").count()) === 0);
check(
  "student view still has Practice in the Studio",
  (await page.locator(".sl-practice").count()) === 1,
);

// 4. How to play: open on the first visit to a kind, folded after
await context.clearCookies();
await page.evaluate(() => localStorage.clear());
await open(`a=${match}&level=l3_4`);
check(
  "How to play is open the first time",
  await page.locator(".st-howto").evaluate((d) => d.open),
);
await open(`a=${match}&level=l3_4`);
check(
  "How to play is folded the second time",
  !(await page.locator(".st-howto").evaluate((d) => d.open)),
);
check("How to play lists three steps", (await page.locator(".st-howto li").count()) === 3);

// 5. finish an activity (talk_cards: draw three cards, then We're done): win extras
await open(`a=${talk}&level=l3_4`);
for (let i = 0; i < 3; i++)
  await page.getByRole("button", { name: /Draw a card|Next card/ }).click();
await page.getByRole("button", { name: "We're done" }).click();
await page.waitForSelector(".st-win .st-conf", { timeout: 10000 });
check(
  "win card asks how sure the student feels",
  (await page.locator(".st-conf__btn").count()) === 3,
);
await page.getByRole("button", { name: "Got it" }).click();
const saved = await page.evaluate(
  (u) => localStorage.getItem(`bcpss-studio:prefs:confidence:${u}`),
  UNIT,
);
check(
  "confidence is saved on the device",
  JSON.parse(saved || "{}")[talk] === "got",
  String(saved),
);
const stars = await page.locator(".st-stars").getAttribute("aria-label");
const nudge = page.locator(".st-win__nudge button");
const n = Number.parseInt(stars, 10);
check(
  "level nudge matches the stars",
  n === 3 || n === 1 ? (await nudge.count()) === 1 : (await nudge.count()) === 0,
  `${stars}, ${await nudge.count()} nudge buttons`,
);
if (await nudge.count()) {
  const want = n === 3 ? "Stretch" : "Starter";
  check(
    "nudge names the level it offers",
    (await nudge.textContent()).includes(want),
    await nudge.textContent(),
  );
  await nudge.click();
  await page.waitForFunction(
    (w) =>
      [...document.querySelectorAll("#stLevel button")].some(
        (b) => b.getAttribute("aria-pressed") === "true" && b.textContent.includes(w),
      ),
    want,
  );
  check("nudge switches the level", true);
}
await open(`a=${talk}&level=l3_4`);
for (let i = 0; i < 3; i++)
  await page.getByRole("button", { name: /Draw a card|Next card/ }).click();
await page.getByRole("button", { name: "We're done" }).click();
await page.waitForSelector(".st-win .st-conf");
const keepGoing = page.locator(".st-win__lesson a");
check(
  "win card points to the lesson",
  (await keepGoing.count()) === 1 &&
    (await keepGoing.textContent()).includes(acts[talk - 1].lessons[0].title),
);
check(
  "a reload remembers the saved confidence",
  await page.evaluate(
    (u) => Boolean(localStorage.getItem(`bcpss-studio:prefs:confidence:${u}`)),
    UNIT,
  ),
);

check("no page errors", errors.length === 0, errors.join(" | "));
await browser.close();
await server.close();
const failed = results.filter((r) => !r).length;
console.log(
  failed
    ? `\nFAIL  bcpss-studio-links-e2e: ${failed} of ${results.length} checks failed`
    : `\nPASS  bcpss-studio-links-e2e: ${results.length} checks`,
);
process.exit(failed ? 1 : 0);
