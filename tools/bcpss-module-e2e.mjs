#!/usr/bin/env node
// bcpss-module-e2e — the district pacing-guide module in the Language Studio, driven like a teacher drives it, in
// Chromium against the source tree plus the real unit/lesson API data.
//   - an ELA unit 1-3 shows its module card (title, question, introduction, end-of-module task, texts, weeks)
//   - every lesson row carries a suggested week, and the weeks never go backwards down the list
//   - the lesson page says where the lesson sits and why; the student view says nothing about it
//   - Module 4 and other subjects show no module card
//   - at 360px, plain and easy-read, the card has no sideways scroll and its controls are 44px
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
const errors = [];
const newPage = async (viewport, readable = false) => {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  if (readable)
    await context.addInitScript(() => localStorage.setItem("bcpss-studio:prefs:readable", "on"));
  const page = await context.newPage();
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message)) errors.push(e.message);
  });
  return page;
};
const open = async (page, query) => {
  await page.goto(`${server.origin}${STUDIO}?${query}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".st-main > *:not(.st-loading)", { timeout: 15000 });
};

const UNIT = "g3-ela-u2";
const detail = await server.detailFor(UNIT);
check(
  "unit detail carries the module",
  detail.module?.title === "Outer Space",
  JSON.stringify(detail.module?.title),
);

const page = await newPage({ width: 1366, height: 900 });
await open(page, `unit=${UNIT}&level=l3_4`);
await page.waitForSelector(".sm-panel", { timeout: 10000 });
const panel = page.locator(".sm-panel");
check(
  "module card names the module",
  /Module 2 · Outer Space/.test(await panel.locator(".sm-title").textContent()),
);
check(
  "module card shows the essential question",
  /How do people learn about space\?/.test(await panel.locator(".sm-eq").textContent()),
);
check(
  "module card shows the introduction",
  (await panel.locator(".sm-intro").textContent()).includes("outer space"),
);
check(
  "module card shows the end-of-module task",
  (await panel.locator(".sm-eom").textContent()).includes("four-paragraph essay"),
);
check(
  "module card shows the dates and writing type",
  /Dec 1, 2025 – Mar 4, 2026 · Opinion Writing/.test(await panel.locator(".sm-sub").textContent()),
);
check(
  "texts open and list the guide's texts",
  await (async () => {
    await panel.locator("summary", { hasText: "Texts in the guide" }).click();
    return (await panel.locator(".sm-texts li").count()) > 3;
  })(),
);
check(
  "weeks open and list every week the guide prints",
  await (async () => {
    await panel.locator("summary", { hasText: "Module weeks" }).click();
    return (await panel.locator(".sm-week").count()) === detail.module.weeks.length;
  })(),
);
check(
  "a week row shows its dates and lessons",
  /Week 2.*Dec 8–12.*Wit & Wisdom lessons 4–7/.test(
    await panel.locator(".sm-week").nth(1).textContent(),
  ),
  await panel.locator(".sm-week").nth(1).textContent(),
);

const chips = await page.locator(".sl-tl__item .sm-chip").allTextContents();
check("every lesson row has a suggested week", chips.length === 12, `${chips.length} chips`);
const nums = chips.map((c) => Number(/week (\d+)/.exec(c)?.[1]));
check(
  "suggested weeks never go backwards down the list",
  nums.every((n, i) => i === 0 || n >= nums[i - 1]),
  nums.join(","),
);

const firstLesson = (await (await fetch(`${server.origin}/api/bcpss/units/${UNIT}/lessons`)).json())
  .lessons[3];
await open(page, `unit=${UNIT}&lesson=${firstLesson.id}&level=l3_4`);
await page.waitForSelector(".sl h1");
const note = await page.locator(".sm-weeknote").textContent();
check(
  "lesson page says where the lesson sits and why",
  /Suggested for Module 2, week \d+/.test(note) && /(use|order)/.test(note),
  note,
);
await open(page, `unit=${UNIT}&lesson=${firstLesson.id}&level=l3_4&view=student`);
await page.waitForSelector(".sl h1");
check(
  "student view says nothing about the pacing guide",
  (await page.locator(".sm-weeknote, .sm-panel").count()) === 0,
);

await open(page, "unit=g3-ela-u4&level=l3_4");
await page.waitForSelector(".sl-tl", { timeout: 10000 });
check(
  "Module 4 has no module card (not in the district files)",
  (await page.locator(".sm-panel").count()) === 0,
);
await open(page, "unit=g6-math-u1&level=l3_4");
await page.waitForSelector(".sl-tl", { timeout: 10000 });
check("a math unit has no module card", (await page.locator(".sm-panel, .sm-chip").count()) === 0);

for (const readable of [false, true]) {
  const phone = await newPage({ width: 360, height: 780 }, readable);
  await open(phone, `unit=${UNIT}&level=l3_4`);
  await phone.waitForSelector(".sm-panel");
  for (const s of await phone.locator(".sm-panel summary").all()) await s.click();
  const tag = readable ? "easy-read, 360px" : "360px";
  const overflow = await phone.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  check(`no sideways scroll (${tag})`, overflow <= 0, `${overflow}px`);
  const small = await phone
    .locator(".sm-panel summary")
    .evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 43.5).length);
  check(`module controls are 44px (${tag})`, small === 0, `${small} too small`);
  const tiny = await phone
    .locator(".sm-panel *")
    .evaluateAll(
      (els) =>
        els.filter(
          (e) =>
            e.childNodes.length &&
            [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) &&
            parseFloat(getComputedStyle(e).fontSize) < 14,
        ).length,
    );
  check(`module text is at least 14px (${tag})`, tiny === 0, `${tiny} elements`);
}

check("no page errors", errors.length === 0, errors.join(" | "));
await browser.close();
await server.close();
const failed = results.filter((r) => !r).length;
console.log(
  failed
    ? `\nFAIL  bcpss-module-e2e: ${failed} of ${results.length} checks failed`
    : `\nPASS  bcpss-module-e2e: ${results.length} checks`,
);
process.exit(failed ? 1 : 0);
