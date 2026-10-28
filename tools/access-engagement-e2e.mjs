#!/usr/bin/env node
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { exitSkipped } from "./lib/skip-exit.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  exitSkipped(
    "Playwright is not installed for the ACCESS engagement browser check.",
    "Install the locked project dependencies.",
  );
}

const root = process.cwd();
const shots = join(root, "tmp", "access-practice-upgrade-qa-2026-10");
mkdirSync(shots, { recursive: true });
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://local").pathname);
  let file = join(root, p.endsWith("/") ? `${p}index.html` : p);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
      file = join(root, "access-practice-lab/index.html");
    else {
      res.writeHead(404);
      return res.end();
    }
  }
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
const failures = [];
const check = (ok, label) => {
  (ok ? console.log : console.error)(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failures.push(label);
};
page.on("pageerror", (error) => {
  if (!/web-vitals/.test(error.message)) failures.push(`page error: ${error.message}`);
});
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    !/web-vitals|favicon|Failed to load resource/.test(message.text())
  )
    failures.push(`console error: ${message.text()}`);
});
const go = async (path) => {
  await page.goto(`${base}/access-practice-lab${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector("#app h1");
};

try {
  await go("/?grades=6-8");
  await page.screenshot({ path: join(shots, "access-home-phone.png"), fullPage: true });
  check(
    await page.getByRole("button", { name: "Start today’s mission · 5 min" }).isVisible(),
    "first visit offers a visible, untimed 5-minute daily mission",
  );
  check(
    (await page.getByRole("button", { name: "Start today’s mission · 10 min" }).isVisible()) &&
      (await page.getByRole("button", { name: "Start today’s mission · 15 min" }).isVisible()),
    "10- and 15-minute choices remain available",
  );
  await page.locator("[data-weekly-goal]").selectOption("4");
  await page.getByRole("button", { name: "Start today’s mission · 5 min" }).click();
  let url = new URL(page.url());
  const sessionId = url.searchParams.get("sid");
  const ids = url.searchParams.get("ids").split(",").filter(Boolean);
  check(
    Boolean(sessionId && ids.length),
    "starting a mission saves a resumable session with selected activities",
  );
  await go("/?grades=6-8");
  const resume = page.getByRole("link", { name: /Resume today’s mission/ });
  check(await resume.isVisible(), "returning learner sees a distinct resume action");
  await resume.click();
  url = new URL(page.url());
  check(url.searchParams.get("sid") === sessionId, "resume restores the interrupted session");
  const found = await page.evaluate(async (id) => {
    const { findActivity } = await import("/access-practice-lab/src/content.js");
    const item = await findActivity(id);
    return { band: item.band, domain: item.domain, level: item.level, id: item.activity.id };
  }, ids[0]);
  await page.evaluate(
    async ({ found, started }) => {
      const { loadRecord, saveRecord } = await import("/access-practice-lab/src/store.js");
      const rec = loadRecord(found.band, found.domain, found.level);
      rec.complete = [...new Set([...rec.complete, found.id])];
      rec.results[found.id] = {
        meaningful: true,
        practiced: true,
        evidence: "synthetic",
        date: new Date().toISOString(),
      };
      saveRecord(found.band, found.domain, found.level, rec);
      return started;
    },
    { found, started: new Date().toISOString() },
  );
  const last = new URL(page.url());
  last.searchParams.set("i", String(ids.length - 1));
  await page.goto(last.toString(), { waitUntil: "networkidle" });
  await page.waitForSelector(".act-nav");
  await page.locator(".act-nav .btn-primary").click();
  await page.waitForSelector(".session-finish");
  check(
    (await page.locator(".session-finish").innerText()).includes(found.domain),
    "session ending names the exact skill and saved activity",
  );
  check(
    (await page.locator(".session-finish").innerText()).includes("Passport XP"),
    "a completed session has a clearly labeled participation reward",
  );
  await page.reload({ waitUntil: "networkidle" });
  check(
    await page.locator(".session-finish").isVisible(),
    "session ending survives reload without awarding again",
  );

  // Build only synthetic device-local results to check weekly-goal completion.
  await page.evaluate(async () => {
    const p = "accessPracticeLab:v1:Reading:A";
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    now.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const results = {};
    for (let i = 0; i < 3; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      results[`synthetic-${i}`] = { meaningful: true, practiced: true, date: d.toISOString() };
    }
    localStorage.setItem(p, JSON.stringify({ complete: [], results }));
  });
  await page.locator(".session-finish a").last().click();
  await page.waitForSelector("[data-weekly-goal]");
  await page.locator("[data-weekly-goal]").selectOption("3");
  await page.reload({ waitUntil: "networkidle" });
  check(
    (await page.locator(".weekly-goal").innerText()).includes("3 of 3 practice days"),
    "saved synthetic practice reaches the learner-selected weekly goal",
  );
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: join(shots, "access-home-tablet.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: join(shots, "access-home-desktop.png"), fullPage: true });

  // Family quest, read-aloud, local encouragement and no unsolicited notification permission.
  await go("/family?grades=6-8");
  await page.screenshot({ path: join(shots, "family-home-phone.png"), fullPage: true });
  check(
    await page.getByRole("heading", { name: "Find the clue together" }).isVisible(),
    "Family Corner presents an optional role-based weekly quest",
  );
  check(
    (await page.locator("[data-say]").count()) >= 2,
    "family prompts offer English browser read-aloud",
  );
  check(
    !(await page.locator("[data-reminder-enable]").isVisible()),
    "reminders stay in collapsed settings and no permission is requested on entry",
  );
  await page.locator("[data-family-settings] summary").click();
  check(
    await page.locator("[data-reminder-enable]").isVisible(),
    "families can find the optional reminder controls",
  );
  check(
    (await page.locator("[data-reminder-status]").innerText()).includes(
      "No permission is requested",
    ),
    "reminder explanation states when notification permission is requested",
  );
  await page.locator("[data-family-settings] summary").click();
  await page.locator("[data-independent-quest]").click();
  await page.waitForSelector(".goal-done");
  check(
    (await page.locator(".goal-done").innerText()).includes("Quest complete"),
    "independent practice earns the same optional quest credit",
  );
  await page.locator("[data-family-settings] summary").click();
  await page.locator("[data-family-encouragement]").selectOption("strategy");
  check(
    await page.locator("[data-family-settings]").evaluate((el) => el.open),
    "family settings remain open after saving encouragement",
  );
  await go("/?grades=6-8");
  check(
    (await page.locator(".student-family-note").innerText()).includes(
      "I noticed you used a helpful strategy",
    ),
    "chosen family encouragement appears locally on the learner home",
  );

  // Recurring authored story: retry, supported transfer, self-check and bounded completion.
  await go("/stories/rainy-route?grades=3-5");
  await page.locator("[data-story-heard]").click();
  await page.locator("[data-story-read]").click();
  await page.locator('[data-story-choice][value="1"]').check();
  await page.locator("[data-story-check]").click();
  check(
    await page.locator(".feedback.is-hint").isVisible(),
    "an incorrect story decision gives authored feedback and another attempt",
  );
  await page.locator('[data-story-choice][value="0"]').check();
  await page.locator("[data-story-check]").click();
  await page.fill(
    "[data-story-transfer-draft]",
    "The walkers stay inside because the path is wet.",
  );
  await page.locator("[data-story-transfer]").click();
  await page.fill(
    "[data-story-draft]",
    "The walkers stay with the teacher because the notice says the rain is still falling.",
  );
  await page.locator('[data-story-criteria][value="0"]').check();
  await page.locator("[data-story-finish]").click();
  check(
    await page.locator(".goal-done").isVisible(),
    "story episode completes after the retry and transfer attempt",
  );
  check(
    (await page.locator(".session-finish").innerText()).includes(
      "does not prove language proficiency",
    ),
    "episode self-check is explicitly not a proficiency claim",
  );
  await page.reload({ waitUntil: "networkidle" });
  check(
    await page.locator(".goal-done").isVisible(),
    "story progress and learner writing resume after reload",
  );

  // Family language parity and grade-band-specific entry.
  await go("/family?grades=3-5");
  await page.locator("#hub-es").click();
  await page.waitForFunction(() => document.documentElement.lang === "es");
  check(
    (await page.locator("#famQuestTitle").innerText()).includes("Encuentren la pista"),
    "the family quest is available in Spanish",
  );
  check(
    (await page.locator("[data-say-es]").count()) >= 2,
    "family prompts offer Spanish browser read-aloud",
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: join(shots, "family-home-desktop-es.png"), fullPage: true });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.screenshot({ path: join(shots, "family-home-tablet-es.png"), fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  check(
    !overflow,
    "Spanish Family Corner reflows without page-level horizontal overflow at tablet width",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) process.exitCode = 1;
else console.log(`access-engagement-e2e: PASS (${pathToFileURL(shots).pathname})`);
