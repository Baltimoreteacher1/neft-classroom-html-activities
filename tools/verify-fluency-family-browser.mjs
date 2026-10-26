// End-to-end family route smoke and accessibility check against repository source.
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { createServer } from "vite";
import { createLesson } from "../math/fluency-lab/lesson-content.js";
import { GRADES } from "../math/fluency-lab/problem-bank.js";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const server = await createServer({
  root: REPO_ROOT,
  logLevel: "error",
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => {
    localStorage.setItem(
      "ewl-fluency-tutor-v2",
      JSON.stringify({
        version: 2,
        records: {
          "4:round-large": {
            recent: [{ correct: false, independent: true, at: Date.now(), level: 1 }],
            dueAt: Date.now() - 1000,
          },
        },
        mistakes: [],
        diagnostics: {},
        sessions: [],
      }),
    );
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/math/fluency-lab/family/`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("h1").first().innerText(), "Make room for a math moment.");
  const familyNavigation = await page.locator("a[href]").evaluateAll((anchors) =>
    anchors.map((anchor) => {
      const url = new URL(anchor.href);
      return { origin: url.origin, pathname: url.pathname };
    }),
  );
  assert.ok(
    familyNavigation.every(
      (url) => url.origin === new URL(base).origin && url.pathname.startsWith("/math/fluency-lab/"),
    ),
    `Rendered family navigation stays in Math Fluency Lab: ${familyNavigation.map((url) => url.pathname).join(", ")}`,
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.classList.contains("skip-link")),
    true,
    "first keyboard stop is the skip link",
  );
  const englishAxe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(
    englishAxe.violations
      .filter((v) => ["critical", "serious"].includes(v.impact))
      .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    [],
    "English family page has no serious or critical accessibility violations",
  );

  await page.getByRole("button", { name: "Grade 4" }).click();
  assert.match(await page.locator("#recommended-skill").innerText(), /Round/);
  await page.locator("#skill-select").selectOption({ index: 2 });
  const skillHref = await page.locator("#skill-start").getAttribute("href");
  assert.match(skillHref, /grade=4/);
  assert.match(skillHref, /start=practice/);
  assert.match(skillHref, /skill=4%3A/);
  await page.getByRole("button", { name: "Español" }).click();
  assert.equal(
    await page.locator("h1").first().innerText(),
    "Hagamos un momento para las matemáticas.",
  );
  assert.equal(
    await page.locator(".welcome-secondary").innerText(),
    "Ver el progreso de este estudiante",
  );
  assert.equal(await page.locator("#rotation-list .rotation-row").count(), 7);
  const spanishAxe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(
    spanishAxe.violations
      .filter((v) => ["critical", "serious"].includes(v.impact))
      .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    [],
    "Spanish family page has no serious or critical accessibility violations",
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    0,
    "mobile page has no horizontal overflow",
  );

  await page.locator("#family-profile").selectOption("add:1");
  assert.match(await page.locator("#tonight-link").getAttribute("href"), /profile=1/);
  const modes = await page.locator("#rotation-list a").evaluateAll((links) =>
    links.map((link) => {
      const url = new URL(link.href);
      return url.pathname.endsWith("/tonight.html")
        ? "tonight"
        : url.searchParams.get("start") || url.searchParams.get("view");
    }),
  );
  assert.deepEqual(modes, [
    "tonight",
    "practice",
    "games",
    "checkup",
    "mission",
    "realworld",
    "daily",
  ]);

  await page.goto(
    new URL(skillHref.replace("profile=0", "profile=1"), `${base}/math/fluency-lab/family/`).href,
    { waitUntil: "networkidle" },
  );
  assert.equal(new URL(page.url()).pathname, "/math/fluency-lab/");
  const labNavigation = await page.locator("a[href]").evaluateAll((anchors) =>
    anchors.map((anchor) => {
      const url = new URL(anchor.href);
      return { origin: url.origin, pathname: url.pathname };
    }),
  );
  assert.ok(
    labNavigation.every(
      (url) => url.origin === new URL(base).origin && url.pathname.startsWith("/math/fluency-lab/"),
    ),
    `Rendered Math Fluency Lab navigation stays inside its route: ${labNavigation.map((url) => url.pathname).join(", ")}`,
  );
  assert.match(
    await page.locator("#session-count").innerText(),
    /0 completed/i,
    "skill link starts a real practice session",
  );
  assert.match(await page.locator("#problem-number").innerText(), /Problem 1/);
  await page.setViewportSize({ width: 1365, height: 900 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    0,
    "desktop page has no horizontal overflow",
  );
  assert.deepEqual(errors, [], "family and Fluency Lab routes have no uncaught page errors");
  await context.close();

  const nightContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const nightPage = await nightContext.newPage();
  nightPage.on("pageerror", (error) => errors.push(error.message));
  await nightPage.goto(`${base}/math/fluency-lab/family/?grade=1&profile=0`, {
    waitUntil: "networkidle",
  });
  const nightHref = await nightPage.locator("#tonight-link").getAttribute("href");
  assert.match(nightHref, /^tonight\.html\?/);
  await nightPage.locator("#tonight-link").click();
  assert.equal(new URL(nightPage.url()).pathname, "/math/fluency-lab/family/tonight.html");
  assert.equal(await nightPage.locator("#stage-title").innerText(), "Retrieval warm-up");
  const nightLinks = await nightPage
    .locator("a[href]")
    .evaluateAll((links) => links.map((link) => new URL(link.href).pathname));
  assert.ok(
    nightLinks.every((path) => path.startsWith("/math/fluency-lab/")),
    `night session links stay inside Math Fluency Lab: ${nightLinks.join(", ")}`,
  );
  const nightAxe = await new AxeBuilder({ page: nightPage }).analyze();
  assert.deepEqual(
    nightAxe.violations.filter((v) => ["critical", "serious"].includes(v.impact)).map((v) => v.id),
    [],
    "night session has no serious or critical accessibility violations",
  );
  if ((await nightPage.locator("html").getAttribute("lang")) !== "es")
    await nightPage.locator("#night-language").click();
  assert.equal(
    await nightPage.locator("html").getAttribute("lang"),
    "es",
    "night session offers its Spanish version",
  );
  assert.equal(await nightPage.locator("#stage-title").innerText(), "Repaso de recuperación");
  const spanishNightAxe = await new AxeBuilder({ page: nightPage }).analyze();
  assert.deepEqual(
    spanishNightAxe.violations
      .filter((v) => ["critical", "serious"].includes(v.impact))
      .map((v) => v.id),
    [],
    "Spanish night session has no serious or critical accessibility violations",
  );
  await nightPage.locator("#night-language").click();
  assert.equal(await nightPage.locator("html").getAttribute("lang"), "en");
  assert.equal(
    await nightPage.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    0,
    "night session has no mobile horizontal overflow",
  );

  async function answerSessionItems(stageName) {
    for (;;) {
      const state = await nightPage.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)),
        "ewl-family-night-v1",
      );
      const stage = state.stages[stageName];
      if (stage.complete) break;
      const answer = stage.items[stage.cursor].answers[0];
      await nightPage.locator("#night-answer").fill(String(answer));
      await nightPage.locator('[data-night-answer] button[type="submit"]').click();
    }
    await nightPage.locator("[data-next-stage]").click();
  }
  await answerSessionItems("retrieval");
  assert.equal(await nightPage.locator("#stage-title").innerText(), "Build the idea");
  const liveNight = await nightPage.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    "ewl-family-night-v1",
  );
  const lessonSkillId = liveNight.skillKey.split(":")[1];
  const lesson = createLesson(
    GRADES.find((g) => g.grade === 1).skills.find((skill) => skill.id === lessonSkillId),
  );
  for (const step of lesson.steps) {
    if (step.choices?.length) {
      await nightPage.locator(`[data-visual-answer="${step.answers[0]}"]`).click();
    } else {
      await nightPage.locator("#visual-answer").fill(String(step.answers[0]));
      await nightPage.locator('[data-visual-form] button[type="submit"]').click();
    }
    await nightPage.locator("[data-visual-next]").click();
  }
  await nightPage.locator(".night-actions [data-next-stage]").click();
  assert.equal(await nightPage.locator("#stage-title").innerText(), "Try independently");
  await answerSessionItems("independent");
  assert.equal(await nightPage.locator("#stage-title").innerText(), "Family challenge");
  await answerSessionItems("family");
  assert.equal(
    await nightPage.locator("#stage-title").innerText(),
    "Reflect and choose a next step",
  );
  await nightPage.locator('input[name="strategy"][value="s2"]').check();
  await nightPage.locator("[data-finish]").click();
  const finished = await nightPage.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    "ewl-family-night-v1",
  );
  assert.equal(finished.stages.reflection.complete, true, "a completed family session is saved");
  const actualTutor = await nightPage.evaluate(() =>
    JSON.parse(localStorage.getItem("ewl-fluency-tutor-v2")),
  );
  const targetEvidence = actualTutor.records[finished.skillKey].recent;
  assert.ok(
    targetEvidence.some((entry) => entry.independent),
    "standalone practice records independent evidence",
  );
  assert.ok(
    targetEvidence.some((entry) => !entry.independent),
    "family challenge success stays supported evidence",
  );
  assert.equal(
    await nightPage.locator(".night-complete h3").first().innerText(),
    "A math moment worth keeping",
  );
  const languageBeforeSwitch = await nightPage.locator("html").getAttribute("lang");
  await nightPage.locator("#night-language").click();
  assert.notEqual(
    await nightPage.locator("html").getAttribute("lang"),
    languageBeforeSwitch,
    "the language control switches the page language",
  );
  assert.match(
    await nightPage.locator("#night-title").innerText(),
    /Math|matemáticas/i,
    "a completed session survives a language switch",
  );
  assert.equal(
    await nightPage.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    0,
  );

  const resumeContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const resumePage = await resumeContext.newPage();
  await resumePage.goto(
    `${base}/math/fluency-lab/family/tonight.html?grade=1&profile=3&skill=add-10`,
    { waitUntil: "networkidle" },
  );
  const resumeKey = "ewl-family-night-v1:profile-3";
  const resumeState = await resumePage.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    resumeKey,
  );
  await resumePage
    .locator("#night-answer")
    .fill(String(resumeState.stages.retrieval.items[0].answers[0]));
  await resumePage.locator('[data-night-answer] button[type="submit"]').click();
  await resumePage.locator("#pause-link").click();
  assert.equal(new URL(resumePage.url()).pathname, "/math/fluency-lab/family/");
  await resumePage.locator("#tonight-link").click();
  const afterReload = await resumePage.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    resumeKey,
  );
  assert.equal(
    afterReload.stages.retrieval.cursor,
    1,
    "an interrupted session resumes at its saved question",
  );
  assert.match(await resumePage.locator("#stage-title").innerText(), /Retrieval/);
  assert.equal(
    await resumePage.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    0,
  );
  await resumeContext.close();
  await nightContext.close();

  const noSaveContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await noSaveContext.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (String(key).startsWith("ewl-fluency-settings-v1:grade"))
        throw new DOMException("Storage full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  const noSavePage = await noSaveContext.newPage();
  await noSavePage.goto(`${base}/math/fluency-lab/family/`, { waitUntil: "networkidle" });
  assert.equal(
    await noSavePage.locator("#family-storage-warning").isVisible(),
    true,
    "storage failures are announced to families",
  );
  await noSaveContext.close();
  console.log(
    "Family browser flow passed: adaptive skill selection, profile switch, seven routes, bilingual family entry, saved five-stage session, visual lesson, independent versus supported evidence, pause/resume, keyboard focus, Axe, real practice launch, and mobile/desktop layout.",
  );
} finally {
  await browser?.close();
  await new Promise((resolveClose, reject) => server.close().then(resolveClose, reject));
}
