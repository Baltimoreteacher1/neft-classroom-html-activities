#!/usr/bin/env node
/**
 * End-to-end walk of the ACCESS Practice Lab in a real browser.
 *
 * Serves the SOURCE tree (or BASE=<url> to point at a preview/production) and
 * drives what a student actually does: answer, miss twice and see the answer,
 * order steps, write, check off speaking, take a practice test to the results
 * page, open the passport, road, family and tools pages, and load old shared
 * URLs. Also asserts the defects the 2026-10 rebuild fixed stay fixed:
 *   - no answer choice carries a correctness label
 *   - a Listening script is not on screen before the student answers
 *   - every <img> on the page actually loads
 *   - no horizontal overflow at phone width
 * A missing browser is a SKIP (exit 0 locally, exit 1 in CI), never a pass.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-lab-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
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

let server = null;
let BASE = process.env.BASE;
if (!BASE) {
  server = await serve();
  BASE = `http://localhost:${server.address().port}`;
}
let browser;
try {
  browser = await chromium.launch({
    ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
} catch (error) {
  console.warn(`access-lab-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();
const errors = [];
// "web-vitals" is a bare npm specifier that Vite resolves at build time; when this
// test serves the SOURCE tree, the site-wide telemetry loader cannot resolve it.
// That is the build working as designed, not a lab defect.
page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
page.on(
  "console",
  (m) =>
    m.type() === "error" &&
    !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
    errors.push(m.text()),
);
const lab = (p) => `${BASE}/access-practice-lab${p}`;
const go = async (p) => {
  await page.goto(lab(p), { waitUntil: "networkidle" });
  await page.waitForSelector("#app h1");
};
const brokenImages = () =>
  page.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
  );

try {
  // Home
  await go("/");
  ok((await page.locator(".room-tile").count()) === 4, "home shows four skill rooms");
  await page.click('[data-set-band="3-5"]');
  await page.waitForFunction(() => document.body.dataset.labBand === "3-5");
  ok(/Grades 3–5/.test(await page.textContent(".eyebrow")), "band switch shows grades 3–5");

  const startBounds = await page.locator(".session-heading .btn-primary").boundingBox();
  ok(
    startBounds && startBounds.y + startBounds.height <= 900,
    "start action appears in the initial desktop viewport",
  );
  // Guided sessions retain preferences and draft work across navigation/reload.
  await page.locator("#planOptions summary").click();
  await page.selectOption("#planFocus", "Writing");
  await page.selectOption("#planLevel", "B");
  await page.selectOption("#planCount", "2");
  await page.waitForFunction(
    () => document.getElementById("planOptions").open && document.activeElement.id === "planCount",
  );
  ok(
    (await page.locator("#planOptions").getAttribute("open")) !== null,
    "planner remains open after changes",
  );
  ok(
    (await page.locator(".session-list li").count()) === 2,
    "planner creates requested session length",
  );
  ok(
    (await page.locator(".session-domain").allTextContents()).every(
      (t) => t.includes("Writing") && t.includes("Growing"),
    ),
    "planner respects skill and support",
  );
  await page.reload({ waitUntil: "networkidle" });
  ok((await page.inputValue("#planFocus")) === "Writing", "planner preferences survive reload");
  await page.locator("#planOptions summary").click();
  await page.locator(".session-list a").first().click();
  await page.waitForSelector("[data-note]");
  await page.fill("[data-note]", "A draft I will continue later.");
  await go("/?grades=3-5");
  ok(
    (await page.textContent(".session-list li:first-child")).includes("Continue your saved work"),
    "planner surfaces saved unfinished writing",
  );
  await page.getByRole("button", { name: "Start today’s mission · 10 min" }).click();
  await page.waitForSelector("[data-note]");
  ok(
    (await page.inputValue("[data-note]")).includes("draft I will continue"),
    "guided session resumes saved draft",
  );

  // Search, filters, assignment links, empty state, and URL restoration.
  await go("/library?grades=3-5");
  ok(
    (await page.locator(".library-item").count()) === 24,
    "library renders 24 activities per page",
  );
  const pageOneId = await page.locator("[data-pick]").first().getAttribute("data-pick");
  await page.locator('[data-page="2"]').click();
  ok(new URL(page.url()).searchParams.get("page") === "2", "pagination persists page in URL");
  ok(
    (await page.locator("[data-pick]").first().getAttribute("data-pick")) !== pageOneId,
    "second page shows different activities",
  );
  ok(
    await page.evaluate(() => document.activeElement.id === "libraryResultTitle"),
    "pagination focuses result heading",
  );
  await page.reload({ waitUntil: "networkidle" });
  ok(
    await page
      .locator(".library-pagination")
      .textContent()
      .then((text) => text.includes("Page 2")),
    "reload restores result page",
  );
  await page.selectOption("#libraryDomain", "Writing");
  await page.selectOption("#libraryLevel", "B");
  await page.selectOption("#libraryStatus", "draft");
  ok(
    (await page.locator(".library-item").count()) === 1,
    "library finds unfinished work with combined filters",
  );
  await page.locator("[data-pick]").first().click();
  ok((await page.locator(".library-picked li").count()) === 1, "add activity builds practice set");
  const assignment = await page.inputValue("#assignmentLink");
  ok(
    new URL(assignment).searchParams.get("grades") === "3-5" &&
      !assignment.includes("draft I will"),
    "assignment link keeps grade band and excludes responses",
  );
  await page.reload({ waitUntil: "networkidle" });
  ok(
    (await page.locator(".library-picked li").count()) === 1 &&
      (await page.inputValue("#libraryStatus")) === "draft",
    "library URL restores filters and selected activities",
  );
  await page.fill("#librarySearch", "zzzz-no-matching-task");
  ok(
    await page.getByRole("heading", { name: "No matching activities" }).isVisible(),
    "search has a useful empty state",
  );
  ok(
    await page.locator("#librarySearch").evaluate((el) => document.activeElement === el),
    "live search preserves keyboard focus",
  );
  await page.click("[data-clear-filters]");
  await page.getByRole("link", { name: "Start this set" }).click();
  await page.waitForSelector("[data-note]");
  ok(
    (await page.inputValue("[data-note]")).includes("draft I will continue"),
    "shared set launches its selected activity",
  );

  // Old shared URL shape still resolves (6–8 id → band switches automatically)
  await go("/Speaking/A/speak-ask-for-help");
  ok(
    (await page.textContent("h1")).includes("Ask for Help Politely"),
    "legacy activity URL resolves",
  );
  const labels = await page.locator(".choice").allTextContents();
  ok(
    !labels.some((t) => /[✓✗]|not polite|polite request/i.test(t)),
    "answer choices carry no correctness labels",
  );

  // Miss twice → answer revealed; then get it right
  await page.locator(".choice", { hasText: "Say it again now." }).click();
  await page.click("[data-check]");
  ok(await page.isVisible(".feedback.is-hint"), "first miss shows a hint");
  ok(
    await page.locator(".feedback").evaluate((el) => document.activeElement === el),
    "answer check moves keyboard focus to feedback",
  );
  await page.click("[data-retry]");
  await page.locator(".choice", { hasText: "Say it again now." }).click();
  await page.click("[data-check]");
  ok(await page.isVisible(".feedback.is-shown"), "second miss shows the answer");
  await page.click("[data-retry]");
  await page.locator(".choice", { hasText: "Could you please repeat" }).click();
  await page.click("[data-check]");
  ok(await page.isVisible(".feedback.is-right"), "correct answer is confirmed");

  // Listening: script is not on screen before answering
  await go("/Listening/A/v10-l-a-water-cycle");
  const body = await page.textContent("#app");
  ok(
    !/The sun heats the water and it rises/i.test(body) && !(await page.isVisible(".transcript")),
    "listening transcript hidden before answering",
  );
  ok(await page.isVisible("[data-listen]"), "listening player present");
  // Order item: solve it with the move buttons
  const want = ["evap", "cond", "precip", "collect"];
  for (let target = 0; target < want.length; target++) {
    for (let guard = 0; guard < 6; guard++) {
      const order = await page.$$eval("[data-ans-move][data-dir='-1']", (els) =>
        els.map((e) => e.dataset.ansMove),
      );
      const at = order.indexOf(want[target]);
      if (at <= target) break;
      await page.click(`[data-ans-move="${want[target]}"][data-dir="-1"]`);
    }
  }
  await page.click("[data-check]");
  ok(await page.isVisible(".feedback.is-right"), "order item solved with ▲/▼");
  ok(await page.isVisible(".transcript"), "transcript offered after answering");

  // Pictures load wherever an item has one
  await go("/Speaking/A/sv5-compare-two-pets");
  ok(
    (await page.locator(".lab-picture img").count()) > 0 && (await brokenImages()).length === 0,
    "picture item shows a real picture",
  );
  await go("/Listening/A/g35-l-a-fraction-circle");
  ok(
    (await page.locator(".opt-picture").count()) === 4 && (await brokenImages()).length === 0,
    "picture answer choices load",
  );
  await go("/Model-Test/6-8/A/model-68-a-reading-2");
  ok(await page.isVisible(".lab-chart svg"), "chart drawn from data");

  // Tap-a-word help: glossed words in a passage open a card with the Spanish; "on my own" gets none.
  const readingWithPassage = await page.evaluate(async () => {
    const d = await (await fetch("/access-practice-lab/content/g6-8/Reading.json")).json();
    return d.levels.B.activities.find((a) => a.passage?.length && a.vocabulary?.length)?.id;
  });
  await go(`/Reading/B/${readingWithPassage}`);
  ok(
    (await page.locator(".passage .gloss-word").count()) > 0,
    "passage words are glossed in supported mode",
  );
  ok(
    (await page.locator(".gloss-chip").count()) > 0,
    "the Word help list has a real button per word",
  );
  await page.locator(".gloss-list summary").click();
  await page.locator(".gloss-chip").first().click();
  ok(await page.isVisible("#glossCard"), "tapping a word opens the glossary card");
  ok(
    (await page.locator("#glossCard [lang=es]").innerText()).trim().length > 3,
    "the card shows Spanish",
  );
  ok(
    await page.evaluate(() => document.activeElement?.matches("[data-gloss-close]")),
    "focus moves into the card",
  );
  await page.keyboard.press("Escape");
  ok(!(await page.isVisible("#glossCard")), "Escape closes the card");
  ok(
    await page.evaluate((id) => {
      const key = Object.keys(localStorage).find(
        (k) => k.includes(":Reading:B") || k.includes("Reading"),
      );
      return (
        /supportUsed/.test(localStorage.getItem(key) || "") &&
        localStorage.getItem(key).includes(id)
      );
    }, readingWithPassage),
    "opening a word counts as help used",
  );
  await go(`/Reading/B/${readingWithPassage}?mode=independent`);
  ok(
    (await page.locator(".gloss-word, .gloss-chip").count()) === 0,
    "on my own offers no word help",
  );

  // Writing
  const writing = await page.evaluate(async () => {
    const idx = await (await fetch("/access-practice-lab/content/index.json")).json();
    return idx.bands["3-5"].domains.Writing.levels.A.activities.find(
      (r) => r[2] === "constructed",
    )[0];
  });
  await go(`/Writing/A/${writing}`);
  await page.fill(
    "[data-note]",
    "First I see a park. The children play because it is sunny. Then they eat lunch and go home.",
  );
  await page.click("[data-check-writing]");
  ok(await page.isVisible(".feedback"), "writing check gives feedback");
  ok(await page.getByText("One next step:").isVisible(), "writing check names one next step");
  await page.getByText("What the checker noticed", { exact: true }).click();
  ok(await page.isVisible(".feedback .checks"), "what the checker noticed can be opened");
  ok(
    !(await page.locator(".feedback").innerText()).match(/proficien|WIDA level|score:/i),
    "writing feedback claims no level or score",
  );

  // Speaking constructed: practiced + checklist → saved
  const speaking = await page.evaluate(async () => {
    const idx = await (await fetch("/access-practice-lab/content/index.json")).json();
    return idx.bands["3-5"].domains.Speaking.levels.A.activities.find(
      (r) => r[2] === "constructed",
    )[0];
  });
  await go(`/Speaking/A/${speaking}`);
  ok(await page.isVisible(".recorder"), "speaking item has a recorder");
  await page.click("[data-practiced]");
  await page.waitForSelector("[data-practiced]:checked");
  await page.check('[data-selfcheck="topic"]');
  await page.check('[data-selfcheck="details"]');
  await page.click("[data-save-speaking]");
  ok(await page.isVisible(".saved-note"), "speaking practice saves");

  // Practice test: untimed, answer one, review, submit, results with answer review
  await go("/test/g35-reading-mini");
  ok(!(await page.isVisible(".test-clock")), "test is untimed by default");
  await page.click("[data-start]");
  await page.waitForSelector("#qTitle");
  const first = page.locator(".choice").first();
  if (await first.count()) await first.click();
  const total = await page.locator(".dot").count();
  await page.click(`[data-jump="${total - 1}"]`);
  await page.click("[data-review]");
  await page.click("[data-submit]");
  ok(await page.isVisible(".answer-review"), "test results include an answer review");
  ok(
    !/Level \d — (Entering|Emerging|Developing|Expanding|Bridging|Reaching)/.test(
      await page.textContent("#app"),
    ),
    "results do not predict a WIDA level",
  );

  // Practice composite: weighted like ACCESS Overall, withheld until Speaking and Writing are rated, never a level.
  await go("/test/model-form-a");
  await page.evaluate(() =>
    localStorage.setItem(
      "accessPracticeLab:v1:test:model-form-a",
      JSON.stringify({
        phase: "results",
        index: 0,
        answers: {},
        flags: [],
        results: {
          sections: [
            {
              domain: "Listening",
              title: "Listening",
              correct: 5,
              total: 6,
              attempted: 6,
              open: 0,
              openDone: 0,
            },
            {
              domain: "Reading",
              title: "Reading",
              correct: 4,
              total: 6,
              attempted: 6,
              open: 0,
              openDone: 0,
            },
            {
              domain: "Writing",
              title: "Writing",
              correct: 0,
              total: 0,
              attempted: 0,
              open: 2,
              openDone: 2,
            },
            {
              domain: "Speaking",
              title: "Speaking",
              correct: 0,
              total: 0,
              attempted: 0,
              open: 2,
              openDone: 2,
            },
          ],
          correct: 9,
          total: 12,
          meaningful: true,
          date: new Date().toISOString(),
          studentName: "",
        },
      }),
    ),
  );
  await go("/test/model-form-a");
  await page.waitForSelector(".composite");
  const comp = () => page.locator(".composite").innerText();
  ok(
    /Practice comprehension[\s\S]*72\s*\/ 100 practice points/.test(await comp()),
    "comprehension composite is 15:35 weighted (72)",
  );
  ok(
    /Practice overall needs all four skills/.test(await comp()),
    "overall is withheld until Speaking and Writing are rated",
  );
  for (const c of ["lc", "vu", "lctl"])
    await page.check(`[data-rating="Speaking"][data-rating-crit="${c}"][value="strong"]`);
  for (const c of ["lc", "vu", "lctl"])
    await page.check(`[data-rating="Writing"][data-rating-crit="${c}"][value="building"]`);
  await page.check('[data-rating-by="Writing"][value="teacher"]');
  ok(
    /Practice overall[\s\S]*74\s*\/ 100 practice points/.test(await comp()),
    "overall composite appears after both ratings (74)",
  );
  ok(
    await page.evaluate(() => document.activeElement?.matches('[data-rating-by="Writing"]')),
    "focus stays on the control just changed",
  );
  ok(/rated by both you and your teacher/.test(await comp()), "the report says who rated");
  ok(
    !/\bLevel \d|proficiency level \d|WIDA level \d|your (ACCESS|WIDA) (score|level)|will (score|reach|exit)|on track/i.test(
      await page.textContent(".composite"),
    ),
    "composite never shows a level or prediction",
  );
  await go("/test/model-form-a");
  ok((await page.locator(".composite").innerText()).includes("74"), "ratings survive a reload");

  // Test conditions: each recording plays once, and a reload cannot reset the count.
  await go("/test/g35-listening-mini");
  await page.evaluate(() =>
    localStorage.removeItem("accessPracticeLab:v1:test:g35-listening-mini"),
  );
  await go("/test/g35-listening-mini");
  await page.check('[data-conditions][value="test"]');
  ok(await page.isVisible("[data-replay]"), "test conditions offer the replay accommodation");
  await page.click("[data-start]");
  await page.waitForSelector("#qTitle");
  ok(await page.isVisible(".listen-player.is-limited"), "test conditions use the limited player");
  ok(
    !(await page.isVisible("[data-stop-audio]")),
    "a recording cannot be paused or stopped under test conditions",
  );
  await page.evaluate(() => {
    window.__spoken = [];
    window.speechSynthesis.speak = (u) => {
      window.__spoken.push(u.text);
      setTimeout(() => u.onend?.({}), 20);
    };
  });
  await page.click("[data-listen]");
  await page.waitForFunction(() => document.querySelector("[data-listen]")?.disabled, null, {
    timeout: 5000,
  });
  ok((await page.evaluate(() => window.__spoken.length)) >= 1, "the recording played once");
  ok(
    await page.evaluate(() => document.querySelector("[data-listen]").disabled),
    "the Play button is spent after one play",
  );
  await page.reload();
  await page.click("[data-start]"); // a reload pauses the test at its intro; resume it
  await page.waitForSelector("#qTitle");
  ok(
    await page.evaluate(() => document.querySelector("[data-listen]").disabled),
    "a reload does not give the recording back",
  );
  await go("/test/g35-listening-mini");
  await page.evaluate(() =>
    localStorage.removeItem("accessPracticeLab:v1:test:g35-listening-mini"),
  );

  // A paused timed test retains its position and cannot keep ticking on another route.
  await go("/test/g35-listening-mini");
  await page.check('[data-conditions][value="test"]');
  await page.check("[data-timer]");
  await page.click("[data-start]");
  await page.waitForSelector("#qTitle");
  await page.click('[data-jump="1"]');
  await page.click("[data-exit]");
  await page.waitForSelector("#app h1");
  const paused = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("accessPracticeLab:v1:test:g35-listening-mini")),
  );
  ok(
    paused.phase === "intro" && paused.index === 1,
    "Save & exit pauses timed test and keeps position",
  );
  await go("/test/g35-listening-mini");
  ok(
    await page.getByRole("button", { name: "Resume test" }).isVisible(),
    "paused test offers explicit resume",
  );

  // Listening test: script not printed
  await go("/test/wida-listening-leon");
  await page.click("[data-start]");
  ok(
    !/Leon grew up watching his mother cook/.test(await page.textContent("#app")),
    "listening test story is audio-only",
  );

  // Other pages
  for (const p of [
    "/passport",
    "/road",
    "/road/3",
    "/family",
    "/tools",
    "/tests",
    "/Reading/C",
    "/play?ids=v10-l-a-water-cycle,speak-ask-for-help",
  ]) {
    await go(p);
    ok((await page.locator(".error-panel").count()) === 0, `${p} renders`);
  }
  await page.click('[data-set-band="6-8"]').catch(() => {});

  // Camera postcards: completed Family Trip only; exercise the accessible no-camera path and explicit share opt-in.
  await page.evaluate(async () => {
    const idx = await (await fetch("/access-practice-lab/content/index.json")).json();
    const level = idx.bands["3-5"].domains.Reading.levels.A;
    const id = level.activities[0][0];
    const key = "accessPracticeLab:v1:g3-5:Reading:A";
    localStorage.setItem(
      key,
      JSON.stringify({
        complete: [id],
        results: { [id]: { ok: true, meaningful: true, practiced: true } },
      }),
    );
    const prefsKey = "accessPracticeLab:v1:prefs";
    const prefs = JSON.parse(localStorage.getItem(prefsKey) || "{}");
    prefs.family = {
      v: 1,
      grade: "3-5",
      who: "together",
      minutes: 10,
      done: true,
      skipped: false,
      trip: { skill: "Reading", stop: 0, ids: [id] },
      tripWeeks: [],
    };
    prefs.lang = "en";
    localStorage.setItem(prefsKey, JSON.stringify(prefs));
  });
  await go("/family/trip?grades=3-5");
  ok(
    await page.locator("[data-postcard-camera]").isVisible(),
    "completed Family Trip offers optional postcards",
  );
  ok(
    (await page.locator("[data-postcard-return]").getAttribute("href"))?.startsWith(
      "/access-practice-lab/family/trip",
    ),
    "postcard maker has a direct return link to Family Trip",
  );
  ok(
    (await page.locator("[data-postcard-passport]").getAttribute("href"))?.startsWith(
      "/access-practice-lab/passport",
    ),
    "postcard maker has a direct return link to My Passport",
  );

  ok(
    await page.locator("[data-postcard-capture]").isHidden(),
    "camera is not activated until explicitly requested",
  );
  await context.grantPermissions(["camera", "clipboard-read", "clipboard-write"], { origin: BASE });
  await page.click("[data-postcard-camera]");
  await page.waitForFunction(() => document.querySelector("[data-postcard-video]")?.videoWidth > 0);
  ok(
    await page.locator("[data-postcard-capture]").isVisible(),
    "camera stream starts only after the learner taps Use camera",
  );
  await page.click("[data-postcard-capture]");
  ok(
    await page.locator("[data-postcard-capture]").isHidden(),
    "capturing a frame stops the camera stream",
  );
  await page.fill("[data-postcard-alt]", "A test camera picture of an object.");
  await page.click("[data-postcard-save]");
  await page.waitForFunction(() =>
    /saved on this device/i.test(
      document.querySelector("[data-postcard-status]")?.textContent || "",
    ),
  );
  await go("/passport?grades=3-5");
  ok(
    (await page.locator(".postcard-list > li").count()) === 1,
    "Passport lists the locally saved camera postcard",
  );
  await page.click("[data-postcard-delete]");
  await page.waitForFunction(() => document.querySelectorAll(".postcard-list > li").length === 0);
  await go("/family/trip?grades=3-5");
  await page.click("[data-postcard-picture]");
  await page.fill("[data-postcard-alt]", "A green plant beside a sunny window.");
  await page.click("[data-postcard-save]");
  await page.waitForFunction(() =>
    /saved on this device/i.test(
      document.querySelector("[data-postcard-status]")?.textContent || "",
    ),
  );
  await go("/passport?grades=3-5");
  ok(
    (await page.locator(".postcard-list > li").count()) === 1,
    "Passport lists the locally saved postcard",
  );
  await page.click("[data-share-copy]");
  await page.waitForFunction(() =>
    (document.querySelector("[data-share-status]")?.textContent || "").includes("copied"),
  );
  let postcardShare = await page.evaluate(async () => {
    const code = await navigator.clipboard.readText();
    return JSON.parse(decodeURIComponent(escape(atob(code.slice(9)))));
  });
  ok(
    postcardShare.postcards.length === 0,
    "postcard is excluded from teacher share until the learner opts in",
  );
  await page.check("[data-postcard-keep]");
  await page.click("[data-share-copy]");
  await page.waitForFunction(() =>
    (document.querySelector("[data-share-status]")?.textContent || "").includes("copied"),
  );
  postcardShare = await page.evaluate(async () => {
    const code = await navigator.clipboard.readText();
    return JSON.parse(decodeURIComponent(escape(atob(code.slice(9)))));
  });
  ok(
    postcardShare.postcards.length === 1 &&
      postcardShare.postcards[0].alt === "A green plant beside a sunny window.",
    "explicitly kept postcard enters the teacher share with sentence alt text",
  );
  await page.uncheck("[data-postcard-keep]");
  await page.click("[data-export]");
  await page.waitForFunction(async () =>
    (await navigator.clipboard.readText()).startsWith("ACCESS1."),
  );
  const defaultProgressCode = await page.evaluate(() => navigator.clipboard.readText());
  const defaultProgress = JSON.parse(
    decodeURIComponent(escape(atob(defaultProgressCode.slice(8)))),
  );
  ok(
    !JSON.stringify(defaultProgress).includes("data:image/jpeg"),
    "ACCESS1 backup excludes postcards unless the learner opts in",
  );
  await page.check("[data-postcard-keep]");
  await page.click("[data-export]");
  await page.waitForFunction(
    async (previous) => (await navigator.clipboard.readText()) !== previous,
    defaultProgressCode,
  );
  const progressCode = await page.evaluate(() => navigator.clipboard.readText());
  const progressData = JSON.parse(decodeURIComponent(escape(atob(progressCode.slice(8)))));
  ok(
    progressData.postcards?.length === 1,
    "ACCESS1 backup includes only the postcard marked for the teacher",
  );
  await page.click("[data-postcard-delete]");
  await page.waitForFunction(() => document.querySelectorAll(".postcard-list > li").length === 0);
  ok(true, "Passport delete removes the local postcard");
  await page.fill("[data-import-text]", progressCode);
  await page.click("[data-import]");
  await page.waitForFunction(() => document.querySelectorAll(".postcard-list > li").length === 1);
  ok(
    await page.locator("[data-postcard-keep]").isChecked(),
    "restoring an opted-in ACCESS1 backup restores the postcard sharing choice",
  );

  // Phone width: no horizontal scroll on the busiest pages
  await page.setViewportSize({ width: 375, height: 800 });
  await page.evaluate(() => {
    const key = "accessPracticeLab:v1:prefs";
    const prefs = JSON.parse(localStorage.getItem(key) || "{}");
    prefs.lang = "es";
    localStorage.setItem(key, JSON.stringify(prefs));
  });
  await go("/family/trip?grades=3-5");
  ok(
    await page.getByRole("heading", { name: "Crea una postal" }).isVisible(),
    "postcard maker is available in Spanish mode on phone width",
  );
  await page.evaluate(() => {
    const key = "accessPracticeLab:v1:prefs";
    const prefs = JSON.parse(localStorage.getItem(key) || "{}");
    prefs.lang = "en";
    localStorage.setItem(key, JSON.stringify(prefs));
  });
  for (const p of [
    "/",
    "/Listening/A",
    "/Listening/A/g35-l-a-fraction-circle",
    "/test/g35-form-a",
    "/passport",
    "/family/trip?grades=3-5",
    "/library?grades=3-5",
  ]) {
    await go(p);
    ok(
      !(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)),
      `no horizontal overflow at 375px: ${p}`,
    );
  }
  ok(
    errors.length === 0,
    `no page errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`,
  );
} catch (error) {
  failures.push(`crashed: ${error.message}`);
  console.error(error);
} finally {
  await browser.close();
  server?.close();
}
if (failures.length) {
  console.error(`\naccess-lab-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-lab-e2e: PASS");
