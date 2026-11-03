#!/usr/bin/env node
/**
 * Spanish completeness scan for the ACCESS enterprise surfaces. Opens each screen and state in Spanish mode and lists
 * every INTERFACE string (text and aria-label/title/placeholder) that the I18nEngine left in English. Authored content
 * (passages, questions, choices, supports, student work) is excluded by design and is checked to carry lang="en".
 *   node tools/access-acc-i18n-scan.mjs            fails if anything is untranslated
 *   node tools/access-acc-i18n-scan.mjs --list     prints them with the screen they came from
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { seedEvidence } from "./lib/access-acc-fixtures.mjs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-acc-i18n-scan: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const { server, base } = await serveAccess();
const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const ROOT = `${base}/access-practice-lab`;
const found = new Map(); // string -> first screen
const langProblems = [];

const SPEECH = `Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speaking: false, paused: false, getVoices: () => [], addEventListener() {}, removeEventListener() {}, cancel() {}, pause() {}, resume() {}, speak(u) { setTimeout(() => u.onend && u.onend({}), 1700); } } });`;
const ES_PREFS = `localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify({ lang: "es", langChosen: true, band: "3-5" }));`;

async function collect(page, screen) {
  await page.waitForTimeout(250);
  const strings = await page.evaluate(async () => {
    const { isInterface, wasTranslated } = await import(
      "/access-practice-lab/src/acc/i18n/I18nEngine.js"
    );
    const roots = [
      ".acc-wrap",
      "#accEvidence",
      "#accContent",
      "#accReview",
      "#accInsights",
      "#accAssign",
      ".acc-teacher-feedback",
    ]
      .map((q) => document.querySelector(q))
      .filter(Boolean);
    const out = new Set();
    const visit = (el) => {
      if (el.hasAttribute?.("hidden")) return;
      for (const a of ["aria-label", "title", "placeholder"]) {
        const v = el.getAttribute?.(a);
        if (v && /\p{L}{2}/u.test(v) && isInterface(el) && !wasTranslated(el, a)) out.add(v);
      }
      for (const n of el.childNodes) {
        if (n.nodeType === 3) {
          const t = n.nodeValue.trim();
          if (t && /\p{L}{2}/u.test(t) && isInterface(n) && !wasTranslated(n)) out.add(t);
        } else if (
          n.nodeType === 1 &&
          !["SCRIPT", "STYLE", "OPTION", "TEXTAREA"].includes(n.tagName)
        )
          visit(n);
      }
    };
    for (const r of roots.length ? roots : [document.body]) visit(r);
    return [...out];
  });
  for (const s of strings) if (!found.has(s)) found.set(s, screen);
  // authored content inside a Spanish page must declare English
  const wrong = await page.evaluate(
    () =>
      [...document.querySelectorAll(".acc-stim-scroll, .acc-stem, .acc-choice-text")].filter(
        (e) => e.closest("[lang]")?.getAttribute("lang") !== "en",
      ).length,
  );
  if (wrong) langProblems.push(`${screen}: ${wrong} content element(s) not marked lang="en"`);
}

async function ctx(init = "") {
  const c = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ["microphone"],
    acceptDownloads: true,
  });
  await c.addInitScript(ES_PREFS + SPEECH + init);
  const page = await c.newPage();
  page.on("pageerror", () => {});
  return { c, page };
}
const start = async (page, set, mode, label) => {
  await page.goto(`${ROOT}/assess/${set}?mode=${mode}`, { waitUntil: "networkidle" });
  await collect(page, `${label}: intro`);
  const timer = page.locator("#accTimer");
  if (await timer.count()) await timer.uncheck();
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
};

// chooser + storage panel
{
  const { c, page } = await ctx();
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  await page.locator(".acc-storage").waitFor();
  await collect(page, "chooser");
  await page.locator("[data-act=delete-all]").click();
  await collect(page, "storage: confirm delete");
  await page.locator("[data-act=confirm-delete]").click();
  await collect(page, "storage: after delete");
  await c.close();
}

// summative walk: every question type, toolbar, listening, speaking, review, results
for (const setId of ["starter-3-5", "starter-6-8"]) {
  const { c, page } = await ctx();
  await start(page, setId, "summative", `${setId} summative`);
  await page.locator("#accTimer").count();
  await collect(page, `${setId} q1`);
  await page.locator("[data-tool=eliminator]").click();
  await page.locator(".acc-strike").first().click();
  await page.locator("[data-tool=mark]").click();
  await page.locator("[data-tool=line-reader]").click();
  await collect(page, `${setId} toolbar on`);
  await page.locator("[data-tool=line-reader]").click();
  const n = await page.locator(".acc-qdot").count();
  for (let i = 1; i < n; i++) {
    await page.locator("[data-act=next]").click();
    await collect(page, `${setId} q${i + 1}`);
    if (await page.locator("[data-act=listen-play]").count()) {
      await page.locator("[data-act=listen-play]").click();
      await collect(page, `${setId} listening playing`);
      await page.waitForFunction(
        () => document.querySelector(".acc-listen")?.dataset.state !== "playing",
        null,
        { timeout: 40000 },
      );
      await collect(page, `${setId} listening played`);
    }
    if (await page.locator("[data-act=mic-check]").count()) {
      await page.locator("[data-act=mic-check]").click();
      await collect(page, `${setId} mic checking`);
      await page.locator('.acc-mic[data-state="ready"]').waitFor({ timeout: 15000 });
      await collect(page, `${setId} mic ready`);
      await page.locator("[data-act=speak-begin]").click();
      await collect(page, `${setId} speaking planning`);
      await page.locator("[data-act=speak-skip]").click();
      await page.locator(".acc-recording").waitFor();
      await page.waitForTimeout(1200);
      await collect(page, `${setId} speaking recording`);
      await page.locator("[data-act=speak-stop]").click();
      await page.locator("[data-act=speak-use]").waitFor();
      await collect(page, `${setId} speaking review`);
      await page.locator("[data-act=speak-use]").click();
      await collect(page, `${setId} speaking confirm`);
      await page.locator("[data-act=speak-confirm]").click();
      await page.locator(".acc-state.is-success").waitFor();
      await collect(page, `${setId} speaking saved`);
    }
  }
  await page.locator("[data-act=review]").click();
  await collect(page, `${setId} review`);
  await page.locator("[data-act=submit]").click();
  await page.locator(".acc-results").waitFor();
  await collect(page, `${setId} results`);
  await c.close();
}

// learning mode: feedback, support ladder, revision
{
  const { c, page } = await ctx();
  await start(page, "starter-3-5", "formative", "formative");
  await collect(page, "formative q1");
  await page.locator(".acc-choice input").nth(0).check();
  await page.locator("[data-act=check]").click();
  await collect(page, "formative wrong feedback");
  for (const t of [1, 2, 3]) {
    await page.locator(`[data-support-tier="${t}"]`).click();
  }
  await collect(page, "formative supports open");
  await page.locator("[data-act=revise]").click();
  await page.locator(".acc-choice input").nth(1).check();
  await page.locator("[data-act=check]").click();
  await collect(page, "formative correct feedback");
  await page.locator("[data-act=next]").click();
  await page.locator("[data-act=next]").click();
  await page.locator(".acc-stem").waitFor();
  await page.locator("[data-act=next]").click();
  await page.locator("[data-act=next]").click();
  await page.locator("[data-act=next]").click();
  await page.locator("[data-act=next]").click();
  await page.locator("[data-act=next]").click();
  await collect(page, "formative q8 writing");
  await page
    .locator(".acc-textarea")
    .fill("The sun warms the water. It turns into vapor and rises.");
  await page.locator("[data-act=check]").click();
  await collect(page, "formative writing checked");
  await page.locator(".acc-checklist input[type=checkbox]").first().check();
  await collect(page, "formative self-check ticked");
  await page.locator("[data-act=review]").click();
  await page.locator("[data-act=submit]").click();
  await page.locator(".acc-results").waitFor();
  await collect(page, "formative results");
  // teacher review of that writing, then the student's view of the shared feedback
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.locator("#accReviewBody [data-act=open-review]").first().waitFor();
  await collect(page, "teacher: review queue");
  await page.locator("#accReviewBody [data-act=open-review]").first().click();
  await page.locator(".acc-review-text").waitFor();
  await page.locator("[data-act=save-review]").click();
  await collect(page, "teacher: review incomplete");
  const dims = await page.locator(".acc-review-dim").count();
  for (let d = 0; d < dims; d++)
    await page.locator(".acc-review-dim").nth(d).locator("input[type=radio]").nth(1).check();
  await page.locator("#rvShare").check();
  await page.locator("[data-act=save-review]").click();
  await page.locator("#accReviewBody .acc-state.is-empty").waitFor();
  await collect(page, "teacher: review saved");
  await page.locator("#accReviewBody [data-act=toggle-done]").click();
  await collect(page, "teacher: reviewed list");
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  await page.locator(".acc-teacher-feedback").waitFor({ timeout: 8000 });
  await collect(page, "student: teacher feedback");
  await c.close();
}

// teacher insights and assignment builder
{
  const { c, page } = await ctx();
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  await seedEvidence(page);
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.locator("#inSkills").waitFor({ timeout: 8000 });
  await page.locator("#inLearner").selectOption("L-fixture1");
  await page.locator("#accInsightsBody details summary").click();
  await collect(page, "teacher: insights");
  await page.locator("#asKind").waitFor();
  await collect(page, "teacher: assignment builder");
  await page.locator("#asKind").selectOption("simulation");
  await collect(page, "teacher: assignment simulation");
  await page.locator("#asKind").selectOption("supported");
  await page.locator("[data-act=save-assign]").click();
  await collect(page, "teacher: assignment saved");
  await c.close();
}
{
  const { c, page } = await ctx();
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  await c.close();
}

// failure states + offline
for (const [name, init] of [
  [
    "mic denied",
    `navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error("x"), { name: "NotAllowedError" }));`,
  ],
  [
    "mic unavailable",
    `navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error("x"), { name: "NotFoundError" }));`,
  ],
  ["mic unsupported", "delete window.MediaRecorder;"],
]) {
  const { c, page } = await ctx(init);
  await start(page, "starter-3-5", "summative", name);
  for (let i = 0; i < 8; i++) await page.locator("[data-act=next]").click();
  await page.locator("[data-act=mic-check]").click();
  await page.waitForTimeout(600);
  await collect(page, name);
  await c.close();
}
{
  const { c, page } = await ctx();
  await start(page, "starter-3-5", "summative", "offline");
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await collect(page, "offline");
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await collect(page, "online again");
  await c.close();
}
{
  const { c, page } = await ctx("window.__failSpeech = true;");
  await start(page, "starter-3-5", "summative", "listening failed");
  for (let i = 0; i < 6; i++) await page.locator("[data-act=next]").click();
  await page.evaluate(() => {
    const s = window.speechSynthesis;
    s.speak = (u) => setTimeout(() => u.onerror?.({}), 10);
  });
  await page.locator("[data-act=listen-play]").click();
  await page.waitForFunction(
    () => document.querySelector(".acc-listen")?.dataset.state === "failed",
  );
  await collect(page, "listening failed");
  await c.close();
}

// teacher evidence panel: empty state, then seeded evidence, filters, alignment table and brief
{
  const { c, page } = await ctx();
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => document.querySelector("#accEvidence .acc-state, #accEvidence table"),
    null,
    { timeout: 8000 },
  );
  await collect(page, "teacher: empty");
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  await seedEvidence(page);
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#accEvidence table.acc-matrix", { timeout: 8000 });
  await page.locator("#evLearner").selectOption("L-fixture1");
  await page.waitForTimeout(300);
  await page.locator("#accEvidence summary").first().click();
  await page.waitForTimeout(800);
  await collect(page, "teacher: evidence");
  await page.waitForSelector("#accContent table.acc-matrix");
  await page.locator("#cDomain").selectOption("Reading");
  await page.locator(".acc-item-row .acc-actions button").first().click();
  await page.locator(".acc-preview").waitFor();
  await page.locator("#cExplicit").check();
  await page.locator("#accContent .acc-key summary").first().click();
  await collect(page, "teacher: content library");
  await c.close();
}

await browser.close();
server.close();

const list = process.argv.includes("--list");
if (list) for (const [s, screen] of found) console.log(`${JSON.stringify(s)}   <- ${screen}`);
if (langProblems.length) console.error(langProblems.join("\n"));
console.log(
  `access-acc-i18n-scan: ${found.size} interface string(s) left in English; ${langProblems.length} language-tag problem(s)`,
);
process.exit(found.size || langProblems.length ? 1 : 0);
