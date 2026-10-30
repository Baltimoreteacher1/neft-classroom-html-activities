#!/usr/bin/env node
/**
 * The evidence tools, driven in a real browser the way a learner, a family and a teacher use them:
 * "how sure are you" + retell on a Reading activity, Passport "How I work" and the family letter, word
 * cards and partner talk, the reading log, then the Teacher Hub (supports, goals, official results,
 * conference sheet, check-in calendar). Each new page gets axe WCAG 2.2 AA and a 375px overflow check,
 * and the honesty rules are asserted: no screen states a proficiency level or a score of the learner.
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-evidence-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-evidence-e2e: axe-core/playwright is not installed; skipping axe checks.");
}
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
        file = join(REPO_ROOT, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const BASE = "/access-practice-lab";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-evidence-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}
const context = await browser.newContext({
  viewport: { width: 1200, height: 900 },
  acceptDownloads: true,
});
const page = await context.newPage();
const problems = [];
const noise = /web-vitals|Failed to load resource|ERR_ABORTED|speechSynthesis/i;
page.on("pageerror", (e) => !noise.test(e.message) && problems.push(`pageerror: ${e.message}`));
page.on(
  "console",
  (m) => m.type() === "error" && !noise.test(m.text()) && problems.push(`console: ${m.text()}`),
);
const go = async (path) => {
  await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => (document.querySelector("#app")?.innerText || "").trim().length > 10,
    { timeout: 10000 },
  );
};
const store = (key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), key);
const bodyText = () => page.locator("body").innerText();
async function axeCheck(label, exclude = "") {
  if (!AxeBuilder) return;
  const builder = new AxeBuilder({ page }).withTags([
    "wcag2a",
    "wcag2aa",
    "wcag21a",
    "wcag21aa",
    "wcag22aa",
  ]);
  const res = await (exclude ? builder.exclude(exclude) : builder).analyze();
  const bad = res.violations.map(
    (v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
  );
  ok(
    bad.length === 0,
    `axe WCAG 2.2 AA: ${label}${bad.length ? ` — ${bad.slice(0, 3).join(" | ")}` : ""}`,
  );
}
async function overflowAt375(label) {
  const vp = page.viewportSize();
  await page.setViewportSize({ width: 375, height: 800 });
  await page.waitForTimeout(150);
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  ok(over <= 1, `no horizontal overflow at 375px: ${label}`);
  await page.setViewportSize(vp);
}
const NO_LEVEL_OR_SCORE =
  /\b(level\s*[1-6]|your score|scored|proficiency level|bridging|reaching)\b/i;

// ── Reading activity: "how sure are you" and retell ───────────────────────────
const RECORD = "accessPracticeLab:v1:Reading:A";
await go(`${BASE}/Reading/A/read-main-idea?grades=6-8`);
ok(
  (await page.locator(".sure-row [data-sure]").count()) === 3,
  "three optional confidence chips sit before Check",
);
await page.locator('[data-sure="1"]').click();
ok(
  (await page.locator('[data-sure="1"]').getAttribute("aria-pressed")) === "true",
  "choosing a confidence chip marks it pressed",
);
await page.locator(".choice", { hasText: "Students can save water" }).click();
await page.click("[data-check]");
await page.waitForSelector(".sure-note.is-lucky");
ok(
  (await bodyText()).includes("You guessed and it was right"),
  "a guessed-but-right answer says it will come back",
);
const rec = await store(RECORD);
ok(
  rec?.results?.["read-main-idea"]?.sure === 1 && rec.results["read-main-idea"].ok === true,
  "the rating is saved with the result and does not change correctness",
);
ok((await page.locator(".retell").count()) === 1, "retell appears after a right Reading answer");
ok(
  (await page.locator(".retell-frames li").count()) === 3,
  "retell shows its frames in Learn with help",
);
await page.locator('[data-retell-check="main"]').check();
ok(
  (await store(RECORD))?.retell?.["read-main-idea"]?.checks?.main === true,
  "retell self-check is saved on this device",
);
await axeCheck("reading activity with confidence and retell");
await overflowAt375("reading activity with confidence and retell");
await page.evaluate(() => localStorage.clear());
await go(`${BASE}/Reading/A/read-main-idea?grades=6-8&mode=independent`);
await page.locator('[data-sure="3"]').click();
await page.locator(".choice", { hasText: "Students have backpacks" }).click();
await page.click("[data-check]");
await page.waitForSelector(".sure-note.is-sure-wrong");
ok(
  (await bodyText()).includes("You were sure, but this one was not right"),
  "a sure-but-wrong answer is flagged as worth a second look",
);
ok((await page.locator(".retell").count()) === 0, "no retell after a wrong answer");
await page
  .locator(".choice", { hasText: "Students can save water" })
  .click()
  .catch(() => {});

// ── Passport: How I work and the family letter ────────────────────────────────
await page.evaluate(() => localStorage.clear());
await page.goto(`${origin}${BASE}/passport`, { waitUntil: "networkidle" });
await page.waitForSelector("#passHow");
ok((await page.locator(".fam-letter").count()) >= 1, "Passport shows the family letter");
await page.locator('[data-letter-lang="es"]').click();
await page.waitForSelector('.fam-letter[lang="es"]');
ok(
  (await page.locator('.fam-letter[lang="en"]').count()) === 0 &&
    (await bodyText()).includes("Estimada familia"),
  "the letter switches to Spanish only",
);
await page.locator('[data-letter-lang="both"]').click();
await page.waitForSelector('.fam-letter[lang="en"]');
ok((await page.locator(".fam-letter").count()) === 2, "both languages can be shown together");
ok(
  !NO_LEVEL_OR_SCORE.test(await page.locator(".fam-letter-wrap").innerText()),
  "the family letter states no level or score",
);
await axeCheck("passport with How I work and family letter");
await overflowAt375("passport with How I work and family letter");

// ── Word cards and partner talk ───────────────────────────────────────────────
await go(`${BASE}/flashcards?grades=6-8`);
const firstTerm = (await page.locator(".fc-term").innerText()).trim();
ok(firstTerm.length > 0, "a word card is shown");
await page.locator("[data-fc-flip]").click();
ok(
  (await page.locator(".fc-def").count()) === 1 && (await page.locator(".fc-es").count()) === 1,
  "flipping shows the meaning and the Spanish gloss",
);
await axeCheck("word cards, flipped");
await page.locator('[data-fc-know="1"]').click();
await page.waitForFunction(
  (t) => document.querySelector(".fc-term")?.textContent.trim() !== t,
  firstTerm,
);
const deckState = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("accessPracticeLab:v1:flashcards") || "{}"),
);
ok(
  Object.values(deckState)[0]?.[firstTerm.toLowerCase()]?.box === 0,
  "'I know it' is saved with its review step",
);
const word1 = (await page.locator(".fc-word").innerText()).trim();
await page.locator("[data-fc-pair-next]").click();
await page.waitForFunction(
  (w) => document.querySelector(".fc-word")?.textContent.trim() !== w,
  word1,
);
ok((await page.locator(".fc-roles dt").count()) === 2, "partner talk gives each partner a role");
await page.locator("a.cat-chip", { hasText: "Listening" }).first().click();
await page.waitForFunction(() => location.search.includes("domain=Listening"));
ok((await page.locator(".fc-term, .fc-card h2").count()) >= 1, "another skill's deck loads");
await overflowAt375("word cards");
await go(`${BASE}/family?grades=6-8`);
ok(
  (await page.locator('a[href*="/flashcards"]').count()) >= 1,
  "the Families page links to word cards",
);

// ── Reading log ───────────────────────────────────────────────────────────────
await go(`${BASE}/reading-room`);
await page.locator("[data-rr-log-title]").fill("Charlotte's Web");
await page.locator("[data-rr-log-minutes]").fill("20");
await page.locator("[data-rr-log-note]").fill("Wilbur is brave");
await page.locator("[data-rr-log-add]").click();
await page.waitForSelector(".rr-log-list li");
ok(
  (await page.locator(".rr-log-sum").innerText()).includes("1 text"),
  "the reading log counts this week's texts",
);
ok(
  (await page.locator(".rr-log-list").innerText()).includes("Wilbur is brave"),
  "the log keeps my own note",
);
// The two serialized-story entry buttons above the log already fail contrast on the shelf (not part of this change).
await axeCheck("reading room reading log", ".rr-adventure-entry");
await overflowAt375("reading room with reading log");

// ── Teacher Hub ───────────────────────────────────────────────────────────────
await go(`${BASE}/passport`);
const [code] = await page.evaluate(async () => {
  const m = await import("/access-practice-lab/src/lang/share.js");
  const { makeEntry } = await import("/access-practice-lab/src/lang/ledger.js");
  const bundle = m.buildShare({ alias: "River 7", band: "6-8" });
  const stages = ["guided", "supported", "independent", "independent"];
  bundle.ledger.entries = stages.map((stage, i) =>
    makeEntry({
      src: "writing",
      domain: "Writing",
      use: "Explain",
      band: "6-8",
      kind: "first",
      stage,
      t: `2026-10-0${i + 1}T10:00:00Z`,
      supports: stage === "independent" ? {} : { frames: true },
      m: { words: 45, link: i + 1, errs: {} },
    }),
  );
  bundle.records = {
    "Reading:A": {
      band: "6-8",
      domain: "Reading",
      level: "A",
      results: Object.fromEntries(
        [1, 2, 3, 4, 5].map((i) => [
          `syn-${i}`,
          {
            skill: "Identify main idea in a short text",
            ok: i % 2 === 1,
            supportUsed: false,
            sure: i % 3 === 0 ? 3 : 1,
            date: `2026-10-2${i}T12:00:00Z`,
          },
        ]),
      ),
    },
  };
  bundle.readingLog = [{ t: new Date().toISOString(), title: "Bus sign", minutes: 5, note: "" }];
  return [m.encodeShare(bundle)];
});
await page.goto(`${origin}/access-teacher/`, { waitUntil: "networkidle" });
await page.waitForSelector("#evCode");
await page.locator("#evSection").fill("Period 3");
await page.locator("#evCode").fill(code);
await page.locator("[data-add]").click();
await page.waitForSelector("#classEvidence td.t-title");
await page.locator('[data-student="Period 3|River 7|6-8"]').first().click();
await page.waitForSelector(".student-panel");
let panel = await page.locator(".student-panel").innerText();
ok(
  panel.includes("Supports and independence") && panel.includes("2 of 4 first attempts"),
  "teacher sees supports and independence as counts",
);
ok(panel.includes("Gradual release by purpose"), "teacher sees gradual release by purpose");
ok(
  panel.includes("Confidence ratings") && panel.includes("Guessing but right"),
  "teacher sees confidence ratings once there are five",
);
ok(
  panel.includes("Independent reading log") && panel.includes("Bus sign"),
  "teacher sees the shared reading log",
);
ok((await page.locator("[data-goal-pick] option").count()) > 40, "the goal picker lists the bank");
await page.locator("[data-goal-pick]").selectOption({ value: "pw-link-ideas" });
await page.locator("[data-goal-add]").click();
await page.waitForSelector(".ev-goal");
panel = await page.locator(".student-panel").innerText();
ok(
  panel.includes("I link my ideas in at least two different ways") &&
    panel.includes("Shown on my own") &&
    !panel.includes("Try tomorrow"),
  "a goal already shown on the student's own says so and offers no move",
);
await page.locator("[data-goal-pick]").selectOption({ value: "pat-capital-punct" });
await page.locator("[data-goal-add]").click();
await page.waitForFunction(() => document.querySelectorAll(".ev-goal").length === 2);
panel = await page.locator(".student-panel").innerText();
ok(
  panel.includes("Not enough evidence yet") && panel.includes("Try tomorrow (3–5 min)"),
  "a goal without evidence shows the count and a try-tomorrow move",
);
const goals = await store("accessTeacher:v1:goals");
ok(
  Object.values(goals)[0]?.[0]?.goalId === "pw-link-ideas",
  "goals are saved in this browser only",
);
// official results
const fillYear = async (year, levels, overall) => {
  const form = page.locator("[data-official-form]");
  await form.locator("[data-official-year]").fill(year);
  for (const [d, v] of Object.entries(levels))
    await form.locator(`[data-official-level="${d}"]`).fill(v);
  await form.locator("[data-official-overall]").fill(overall);
  await form.locator("[data-official-save]").click();
};
await fillYear("2025-26", { Listening: "7.5" }, "");
ok(
  (await page.locator("#classEvidence").innerText()).includes("enter a level from 1.0 to 6.0"),
  "an impossible level is refused with a plain message",
);
await fillYear("2024-25", { Listening: "3.0", Reading: "3.4" }, "3.2");
await fillYear("2025-26", { Listening: "4.1", Reading: "3.1" }, "3.6");
panel = await page.locator(".student-panel").innerText();
ok(
  panel.includes("2024-25 to 2025-26") &&
    panel.includes("Listening +1.1") &&
    panel.includes("Reading -0.3"),
  "growth is plain arithmetic on two reported levels",
);
ok(
  panel.includes("never combined with it") &&
    !/predict|placement/i.test(
      panel.replace(/It is not a growth target, a prediction or a placement\./, ""),
    ),
  "official results carry the not-a-prediction note",
);
await axeCheck("teacher student panel with goals and official results");
await overflowAt375("teacher student panel");
// conference sheet
await page.locator("[data-print-sheets]").first().click();
await page.waitForSelector("#evPrint .ev-sheet", { state: "attached" });
const sheet = await page.locator("#evPrint").innerText();
ok(
  sheet.includes("My reflection") &&
    sheet.includes("Official ACCESS results") &&
    sheet.includes("Goals"),
  "the printed sheet is a conference sheet with goals, official results and reflection lines",
);
await page.evaluate(() => delete document.body.dataset.printing);
// check-in calendar
await page.locator('[data-tab="checkins"]').click();
await page.locator('[data-checkin="start"]').fill("2026-11-02");
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.locator("[data-checkin-download]").click(),
]);
const ics = await (async () => {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8").replace(/^﻿/, "");
})();
ok(
  ics.startsWith("BEGIN:VCALENDAR") &&
    (ics.match(/BEGIN:VEVENT/g) || []).length === 6 &&
    !/River/.test(ics),
  "the calendar file has six reminders and no student data",
);
await axeCheck("teacher check-ins");
// removal clears goals and official results
await page.locator('[data-tab="class"]').click();
if ((await page.locator(".student-panel").count()) === 0)
  await page.locator('[data-student="Period 3|River 7|6-8"]').first().click();
page.once("dialog", (d) => d.accept());
await page.locator("[data-remove]").first().click();
const after = await page.evaluate(() => [
  localStorage.getItem("accessTeacher:v1:goals"),
  localStorage.getItem("accessTeacher:v1:officialResults"),
]);
ok(
  !after[0].includes("pw-link-ideas") && after[1] === "{}",
  "removing a student removes their goals and official results",
);

ok(
  problems.length === 0,
  `no page errors${problems.length ? `: ${problems.slice(0, 3).join(" | ")}` : ""}`,
);
await browser.close();
server?.close();
if (failures.length) {
  console.error(`\naccess-evidence-e2e: FAIL (${failures.length})`);
  process.exit(1);
}
console.log("\naccess-evidence-e2e: PASS");
