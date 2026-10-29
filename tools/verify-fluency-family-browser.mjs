// End-to-end family route smoke and accessibility check against repository source.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { createServer } from "vite";
import { loadAll } from "../math/fluency-lab/family/fm2/registry.js";
import { decodePlan } from "../math/fluency-lab/family/fm2/session.js";
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

  const directLinkContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const directLinkPage = await directLinkContext.newPage();
  await directLinkPage.goto(
    `${base}/math/fluency-lab/family/?grade=8&game=array-architect&skill=g8-expand&minutes=5&mode=together&lang=en`,
    { waitUntil: "networkidle" },
  );
  const focusedMission = directLinkPage.locator(
    '[data-testid="mission-activity"][data-game="array-architect"][data-skill="g8-expand"]',
  );
  assert.equal(
    await focusedMission.count(),
    1,
    "a teacher link foregrounds the exact grade 8 skill",
  );
  assert.equal(
    await directLinkPage.locator("#welcome-title").innerText(),
    "Practice: Multiply binomials with area",
  );
  assert.match(
    await directLinkPage.locator(".hm-hero-lead").innerText(),
    /side lengths.*partial area/i,
  );
  assert.match(
    await directLinkPage.locator("#mission-sub").innerText(),
    /Multiply binomials with area/,
  );
  const sourceShareUrl = new URL(
    `${base}/math/fluency-lab/family/?grade=8&game=array-architect&skill=g8-expand&minutes=5&mode=together&lang=en`,
  );
  assert.equal(
    sourceShareUrl.searchParams.has("profile"),
    false,
    "the teacher link contains no learner profile",
  );
  await directLinkPage.locator("#add-learner").click();
  let sharedParams = new URL(directLinkPage.url()).searchParams;
  assert.equal(sharedParams.get("profile"), "1");
  assert.equal(sharedParams.get("grade"), "8");
  assert.equal(sharedParams.get("game"), "array-architect");
  assert.equal(sharedParams.get("skill"), "g8-expand");
  assert.equal(sharedParams.get("minutes"), "5");
  assert.equal(sharedParams.get("mode"), "together");
  const regeneratedShare = new URL(await directLinkPage.locator("#teacher-link").inputValue());
  assert.equal(
    regeneratedShare.searchParams.has("profile"),
    false,
    "re-shared skill links exclude the local profile",
  );
  await directLinkPage.locator("#lang-toggle").click();
  sharedParams = new URL(directLinkPage.url()).searchParams;
  assert.equal(sharedParams.get("lang"), "es");
  assert.equal(sharedParams.get("skill"), "g8-expand");
  assert.equal(await directLinkPage.locator("html").getAttribute("lang"), "es");
  assert.equal(
    await directLinkPage.locator("#welcome-title").innerText(),
    "Práctica: Multiplicar binomios con área",
  );
  assert.match(
    await directLinkPage.locator(".hm-hero-lead").innerText(),
    /binomios.*área parcial/i,
  );
  const focusedStart = new URL(
    await directLinkPage.locator("#start-link").getAttribute("href"),
    directLinkPage.url(),
  );
  const focusedPlan = decodePlan(focusedStart.searchParams.get("plan"), await loadAll());
  assert.equal(focusedPlan.grade, 8);
  assert.equal(focusedPlan.minutes, 5);
  assert.equal(focusedPlan.mode, "together");
  assert.deepEqual(
    focusedPlan.activities.map(({ gameId, skillId }) => [gameId, skillId]),
    [["array-architect", "g8-expand"]],
    "the primary action starts only the requested skill",
  );
  assert.equal(
    await directLinkPage.locator("#guided-start").count(),
    0,
    "a chosen skill does not offer the guided session, which picks its own skill",
  );
  assert.deepEqual(
    await directLinkPage.locator(".fm2-btn-primary").allInnerTexts(),
    [await directLinkPage.locator("#start-link").innerText()],
    "directed practice presents exactly one primary start action",
  );
  await directLinkPage.locator("#start-link").click();
  await directLinkPage.waitForSelector('[data-fm2-shell][data-game="array-architect"]');
  assert.match(await directLinkPage.locator("[data-fm2-skill]").innerText(), /binomios/i);
  assert.equal(await directLinkPage.locator("html").getAttribute("lang"), "es");
  assert.equal(new URL(directLinkPage.url()).searchParams.get("resume"), "1");
  await directLinkPage.locator("[data-fm2-exit]").click();
  await directLinkPage.waitForURL(/\/math\/fluency-lab\/family\/$/);
  const continueLink = new URL(
    await directLinkPage.locator('[data-testid="resume-link"]').getAttribute("href"),
    directLinkPage.url(),
  );
  const continuedPlan = decodePlan(continueLink.searchParams.get("plan"), await loadAll());
  assert.deepEqual(
    continuedPlan.activities.map(({ gameId, skillId }) => [gameId, skillId]),
    [["array-architect", "g8-expand"]],
    "resume keeps the requested skill as the only activity",
  );
  await directLinkPage.locator('[data-testid="resume-link"]').click();
  await directLinkPage.waitForSelector('[data-fm2-shell][data-game="array-architect"]');
  assert.match(await directLinkPage.locator("[data-fm2-skill]").innerText(), /binomios/i);
  await directLinkContext.close();

  await page.locator("#family-grade").selectOption("4");
  // The home still picks Tonight's Math from the learner's real Fluency Lab evidence (seeded above: round-large is due).
  assert.match(await page.locator("#tonight-link").getAttribute("href"), /skill=round-large/);
  const firstRow = page.locator('[data-testid="skill-row"]').first();
  const skillHref = await firstRow.locator('[data-testid="skill-practice"]').getAttribute("href");
  assert.match(skillHref, /^play\.html\?/);
  assert.match(skillHref, /grade=4/);
  const selectedGame = new URL(skillHref, "http://x/").searchParams.get("game");
  const selectedSkill = new URL(skillHref, "http://x/").searchParams.get("skill");
  await page.getByRole("button", { name: "Español" }).click();
  const spanishHref = await page
    .locator('[data-testid="skill-row"]')
    .first()
    .locator('[data-testid="skill-practice"]')
    .getAttribute("href");
  assert.equal(
    new URL(spanishHref, "http://x/").searchParams.get("skill"),
    selectedSkill,
    "switching language preserves the grade and the skill list",
  );
  assert.equal(new URL(spanishHref, "http://x/").searchParams.get("game"), selectedGame);
  assert.equal(new URL(spanishHref, "http://x/").searchParams.get("lang"), "es");
  assert.equal(
    await page.locator("h1").first().innerText(),
    "Hagamos un momento para las matemáticas.",
  );
  assert.equal(await page.locator("#progress-link").innerText(), "Ver mi progreso");
  assert.equal(
    await page.locator('[data-testid="game-card"]').count(),
    10,
    "the shelf lists all ten games, ready or coming soon",
  );
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

  await page.locator("#add-learner").click();
  assert.match(await page.locator("#tonight-link").getAttribute("href"), /profile=1/);
  const startHref = await page.locator("#start-link").getAttribute("href");
  assert.match(startHref, /^play\.html\?plan=/);
  assert.match(startHref, /profile=1/);
  assert.match(await page.locator("#lab-link").getAttribute("href"), /^\.\.\/\?grade=\d&profile=1/);

  // The Fluency Lab itself still starts a real practice session from a family launch link.
  await page.goto(
    `${base}/math/fluency-lab/?grade=4&profile=1&start=practice&skill=4%3Around-large`,
    {
      waitUntil: "networkidle",
    },
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
  await page.goto(
    new URL(skillHref.replace("profile=0", "profile=1"), `${base}/math/fluency-lab/family/`).href,
    {
      waitUntil: "networkidle",
    },
  );
  assert.equal(new URL(page.url()).pathname, "/math/fluency-lab/family/play.html");
  assert.ok(
    (
      await page
        .locator("a[href]")
        .evaluateAll((links) => links.map((l) => new URL(l.href).pathname))
    ).every((path) => path.startsWith("/math/fluency-lab/")),
    "family play page links stay inside Math Fluency Lab",
  );
  assert.equal(
    (await page.locator("#fm2-main h1").count()) > 0,
    true,
    "the skill link opens a family activity",
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
      if (String(key).startsWith("ewl-fm2-v1"))
        throw new DOMException("Storage full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  const noSavePage = await noSaveContext.newPage();
  await noSavePage.goto(`${base}/math/fluency-lab/family/`, { waitUntil: "networkidle" });
  // The new home saves the grade in the learner's Family Math record only when the grade is changed.
  await noSavePage.locator("#family-grade").selectOption("3");
  assert.equal(
    await noSavePage.locator("#family-storage-warning").isVisible(),
    true,
    "storage failures are announced to families",
  );
  await noSaveContext.close();

  const teacherContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const teacherPage = await teacherContext.newPage();
  await teacherPage.addInitScript(() => {
    window.print = () => {};
    const now = Date.now();
    localStorage.setItem("ewl-fluency-profiles-v1", JSON.stringify({ ids: [0, 1], active: 0 }));
    for (const id of [0, 1]) {
      const recordKey = id === 0 ? "ewl-fluency-tutor-v2" : `ewl-fluency-tutor-v2:profile-${id}`;
      const settingsKey =
        id === 0 ? "ewl-fluency-settings-v1:grade" : `ewl-fluency-settings-v1:grade:profile-${id}`;
      const key = "1:add-20";
      localStorage.setItem(settingsKey, "1");
      localStorage.setItem(
        recordKey,
        JSON.stringify({
          version: 2,
          records: {
            [key]: {
              recent: [
                { correct: false, independent: true, level: 1, at: now - 120000 },
                { correct: false, independent: true, level: 1, at: now - 60000 },
              ],
              independentTotal: 2,
              supportedTotal: 1,
              dueAt: now - 1000,
              lastAt: now - 60000,
              lessonCompleted: true,
            },
          },
          mistakes: [
            {
              id: String(id),
              key,
              question: "7 + 5 = ?",
              submitted: "2",
              category: "subtractInsteadOfAdding",
              at: now - 60000,
              resolvedAt: null,
            },
          ],
          diagnostics: { 1: { at: now - 180000, results: { [key]: false } } },
          sessions: [{ at: now - 60000, answered: 3, correct: 1, grade: 1, mode: "practice" }],
        }),
      );
    }
  });
  await teacherPage.goto(`${base}/math/fluency-lab/?view=teacher`, { waitUntil: "networkidle" });
  assert.equal(
    await teacherPage
      .locator("#teacher-evidence-host .teacher-evidence-metrics strong")
      .first()
      .innerText(),
    "2",
  );
  assert.equal(
    await teacherPage.locator("#teacher-evidence-host .teacher-intervention").count(),
    1,
  );
  assert.match(
    await teacherPage.locator("#teacher-evidence-host .teacher-intervention").innerText(),
    /possible misconception/i,
  );
  assert.match(
    await teacherPage.locator("#teacher-evidence-host .teacher-intervention").innerText(),
    /subtracted/i,
  );
  const evidenceAxe = await new AxeBuilder({ page: teacherPage })
    .include("#teacher-evidence-host")
    .analyze();
  assert.deepEqual(
    evidenceAxe.violations
      .filter((v) => ["critical", "serious"].includes(v.impact))
      .map((v) => ({
        id: v.id,
        nodes: v.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    [],
    "teacher evidence dashboard has no serious or critical Axe findings",
  );
  const evidenceDownload = teacherPage.waitForEvent("download");
  await teacherPage.locator("[data-teacher-export]").click();
  const evidenceFile = await evidenceDownload;
  assert.equal(evidenceFile.suggestedFilename(), "fluency-grade-1-evidence.csv");
  const evidenceCsv = await readFile(await evidenceFile.path(), "utf8");
  assert.match(evidenceCsv, /Recent independent accuracy/);
  assert.match(evidenceCsv, /possible/i);
  const interventionDownload = teacherPage.waitForEvent("download");
  await teacherPage.locator("[data-teacher-export-groups]").click();
  const interventionFile = await interventionDownload;
  const interventionCsv = await readFile(await interventionFile.path(), "utf8");
  assert.match(interventionCsv, /Teaching routine/);
  assert.match(interventionCsv, /Assign a short set/);
  await teacherPage.locator("[data-teacher-assign]").first().click();
  assert.equal(await teacherPage.locator('[name="assignment-skill"]:checked').count(), 1);
  await teacherPage.locator("#assignment-session-type").selectOption("family");
  assert.equal(
    await teacherPage.locator("#assignment-game").count(),
    0,
    "family configuration hides the unused game selector",
  );
  await teacherPage.locator("#assignment-grade").selectOption("1");
  await teacherPage.locator("#assignment-language").selectOption("es");
  await teacherPage.locator("#assignment-challenge").selectOption("building");
  await teacherPage.locator("#assignment-mode").selectOption("guided");
  await teacherPage.locator("#assignment-count").selectOption("10");
  await teacherPage.locator('input[name="assignment-skill"]').first().check();
  await teacherPage.locator("#assignment-builder button[type=submit]").click();
  const teacherShare = new URL(await teacherPage.locator("#assignment-link").inputValue());
  assert.equal(teacherShare.origin, new URL(base).origin);
  assert.ok(teacherShare.pathname.startsWith("/math/fluency-lab/family/tonight"));
  assert.equal(teacherShare.searchParams.get("lang"), "es");
  assert.equal(teacherShare.searchParams.get("minutes"), "10");
  assert.equal(teacherShare.searchParams.get("challenge"), "building");
  assert.equal(teacherShare.searchParams.get("support"), "extra");
  assert.equal(
    teacherShare.searchParams.has("profile"),
    false,
    "teacher share URLs contain no learner profile",
  );
  await teacherPage.locator("[data-print-family]").click();
  const familyPrint = await teacherPage.locator("#print-sheet").innerHTML();
  assert.match(familyPrint, /class="fluency-local-qr"/);
  assert.match(familyPrint, /aria-label="Código QR para la práctica familiar"/);
  assert.doesNotMatch(familyPrint, /qrserver\.com/);
  assert.match(familyPrint, /count-patterns/);
  await teacherPage.locator("#assignment-session-type").selectOption("practice");
  assert.equal(
    await teacherPage.locator("#assignment-game").count(),
    1,
    "game options remain available for fluency assignments",
  );
  await teacherContext.close();

  // Run all three publisher games through their real browser/UI and inspect their active boards with Axe.
  const gameContext = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const gamePage = await gameContext.newPage();
  gamePage.on("pageerror", (error) => errors.push(error.message));
  gamePage.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await gamePage.goto(`${base}/math/fluency-lab/?grade=3&view=games`, { waitUntil: "networkidle" });
  const savedGameIds = ["mathworldbuilder", "numberpuzzlestudio", "fluencyrally"];
  for (const gameId of savedGameIds) {
    await gamePage.locator(`[data-game="${gameId}"]`).click();
    const activeAxe = await new AxeBuilder({ page: gamePage }).analyze();
    assert.deepEqual(
      activeAxe.violations
        .filter((v) => ["critical", "serious"].includes(v.impact))
        .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      [],
      `${gameId} active game board has no serious or critical accessibility violations`,
    );
    for (let round = 0; round < 5; round += 1) {
      if (gameId === "mathworldbuilder") {
        const prompt = await gamePage.locator(".sig-head h2").innerText();
        const target = Number(prompt.match(/(?:with|Build) (\d+) floor tiles/)?.[1]);
        const budget = Number(prompt.match(/no more than (\d+) fence units/)?.[1]);
        const optimize = prompt.includes("fewest fence units");
        let minFence = Number.POSITIVE_INFINITY;
        for (let rows = 1; rows <= 12; rows += 1)
          for (let columns = 1; columns <= 12; columns += 1)
            if (rows * columns === target) minFence = Math.min(minFence, 2 * (rows + columns));
        let plan;
        for (let rows = 1; rows <= 12 && !plan; rows += 1)
          for (let columns = 1; columns <= 12; columns += 1)
            if (
              rows * columns === target &&
              (!budget || 2 * (rows + columns) <= budget) &&
              (!optimize || 2 * (rows + columns) === minFence)
            ) {
              plan = [rows, columns];
              break;
            }
        assert.ok(plan, "each visible structure task has a valid plan");
        for (const [selector, desired] of [
          ["[data-rows]", plan[0]],
          ["[data-columns]", plan[1]],
        ]) {
          const range = gamePage.locator(selector);
          await range.focus();
          await range.press("Home");
          for (let value = 1; value < desired; value += 1) await range.press("ArrowRight");
        }
      } else if (gameId === "numberpuzzlestudio") {
        const prompt = await gamePage.locator(".sig-head h2").innerText();
        const [, op, targetText] = prompt.match(/use (\+|×) to make (\d+)/);
        const target = Number(targetText);
        const tiles = (await gamePage.locator("[data-choice]").allInnerTexts()).map(Number);
        const found = new Set();
        for (let solution = 0; solution < 2; solution += 1) {
          let pair;
          for (let a = 0; a < tiles.length && !pair; a += 1)
            for (let b = a + 1; b < tiles.length; b += 1)
              if (
                !found.has(`${a}:${b}`) &&
                (op === "+" ? tiles[a] + tiles[b] : tiles[a] * tiles[b]) === target
              ) {
                pair = [a, b];
                break;
              }
          assert.ok(pair, "each number puzzle has a second distinct solution");
          found.add(`${pair[0]}:${pair[1]}`);
          for (const index of pair) {
            const tile = gamePage.locator(`[data-choice="${index}"]`);
            await tile.focus();
            await tile.press("Enter");
          }
          const check = gamePage.locator("[data-check]");
          await check.focus();
          await check.press("Enter");
          assert.equal(
            await gamePage.locator("[data-feedback]").getAttribute("data-state"),
            "right",
          );
          if (solution === 0) {
            const explore = gamePage.getByRole("button", { name: "Find another valid pair" });
            await explore.focus();
            await explore.press("Enter");
          }
        }
      } else {
        const prompt = await gamePage.locator(".sig-head h2").innerText();
        const [, factorText, nText, addText] =
          prompt.match(/follows (\d+) × (\d+) \+ (\d+).*n = (\d+)/) || [];
        const factor = Number(factorText);
        const n = Number(nText);
        const add = Number(addText);
        const route = gamePage
          .locator("[data-choice]")
          .filter({ hasText: `${factor} × ${n} + ${add}` });
        await route.focus();
        await route.press("Enter");
        await gamePage.locator("[data-distance]").fill(String(factor * n + add));
      }
      const check = gamePage.locator("[data-check]");
      if (await check.count()) {
        await check.focus();
        await check.press("Enter");
      }
      assert.equal(
        await gamePage.locator("[data-feedback]").getAttribute("data-state"),
        "right",
        `${gameId} accepts its mathematically valid response`,
      );
      const advance = gamePage.locator(".sig-actions button").last();
      await advance.focus();
      await advance.press("Enter");
    }
    assert.equal(
      await gamePage.locator(".gm-result").count(),
      1,
      `${gameId} completes its full five-challenge session`,
    );
    if (gameId !== savedGameIds.at(-1)) {
      const back = gamePage.getByRole("button", { name: /Back to the Game Room/ });
      if (await back.count()) await back.click();
      else await gamePage.getByRole("button", { name: /Back to games/ }).click();
    }
  }
  const persisted = await gamePage.evaluate(() =>
    JSON.parse(localStorage.getItem("ewl-fluency-rewards-v1")),
  );
  assert.ok(persisted.plays >= 3, "completed game sessions persist their play count");
  for (const gameId of savedGameIds)
    assert.ok(persisted.best[gameId] >= 1, `${gameId} completion reward persists`);
  await gamePage.reload({ waitUntil: "networkidle" });
  const gamesAfterReload = await gamePage.evaluate(() =>
    JSON.parse(localStorage.getItem("ewl-fluency-rewards-v1")),
  );
  assert.deepEqual(
    gamesAfterReload.best,
    persisted.best,
    "game results remain saved after a page reload",
  );
  assert.equal(
    await gamePage.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    0,
    "game screens fit the desktop viewport",
  );
  await gameContext.close();

  const studentContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const studentPage = await studentContext.newPage();
  studentPage.on("pageerror", (error) => errors.push(error.message));
  await studentPage.goto(`${base}/math/fluency-lab/?grade=3`, { waitUntil: "networkidle" });
  const homeAxe = await new AxeBuilder({ page: studentPage }).analyze();
  assert.deepEqual(
    homeAxe.violations.filter((v) => ["critical", "serious"].includes(v.impact)).map((v) => v.id),
    [],
    "student home has no serious or critical accessibility violations",
  );
  await studentPage.locator("#settings-toggle").click();
  const settingsAxe = await new AxeBuilder({ page: studentPage })
    .include("#header-settings-popover")
    .analyze();
  assert.deepEqual(
    settingsAxe.violations
      .filter((v) => ["critical", "serious"].includes(v.impact))
      .map((v) => v.id),
    [],
    "display and access settings have no serious or critical accessibility violations",
  );
  await studentPage.keyboard.press("Escape");
  assert.equal(
    await studentPage.evaluate(() => document.activeElement?.id),
    "settings-toggle",
    "Escape closes settings and restores keyboard focus",
  );
  await studentPage.locator('[data-view="path"]').click();
  const progressAxe = await new AxeBuilder({ page: studentPage }).analyze();
  assert.deepEqual(
    progressAxe.violations
      .filter((v) => ["critical", "serious"].includes(v.impact))
      .map((v) => v.id),
    [],
    "student growth view has no serious or critical accessibility violations",
  );
  await studentPage.locator('[data-view="library"]').click();
  await studentPage.locator("#skill-grid .open-skill").first().click();
  const workspaceAxe = await new AxeBuilder({ page: studentPage }).analyze();
  assert.deepEqual(
    workspaceAxe.violations
      .filter((v) => ["critical", "serious"].includes(v.impact))
      .map((v) => v.id),
    [],
    "visual lesson view has no serious or critical accessibility violations",
  );
  await studentPage.locator('#mode-tabs [data-mode="practice"]').click();
  const practiceAxe = await new AxeBuilder({ page: studentPage }).analyze();
  assert.deepEqual(
    practiceAxe.violations
      .filter((v) => ["critical", "serious"].includes(v.impact))
      .map((v) => ({
        id: v.id,
        nodes: v.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
      })),
    [],
    "independent practice view has no serious or critical accessibility violations",
  );
  assert.equal(
    await studentPage.getByRole("textbox", { name: "Your answer" }).count(),
    1,
    "practice answer is exposed as a named textbox",
  );
  assert.equal(
    await studentPage.getByRole("group", { name: "My feeling:" }).count(),
    1,
    "confidence choices are exposed as a labelled screen-reader group",
  );
  assert.equal(
    await studentPage.getByRole("button", { name: /Certain/ }).getAttribute("aria-pressed"),
    "true",
    "the default confidence choice is announced as pressed",
  );
  const thinkingChoice = studentPage.getByRole("button", { name: /Thinking/ });
  await thinkingChoice.focus();
  await thinkingChoice.press("Enter");
  assert.equal(
    await thinkingChoice.getAttribute("aria-pressed"),
    "true",
    "keyboard confidence selection updates its announced state",
  );
  assert.equal(
    await studentPage.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    0,
    "mobile student workflows do not overflow",
  );
  await studentPage.goto(`${base}/math/fluency-lab/?grade=8`, { waitUntil: "networkidle" });
  assert.match(await studentPage.locator("#grade-heading").innerText(), /Grade 8/);
  const middleAxe = await new AxeBuilder({ page: studentPage }).analyze();
  assert.deepEqual(
    middleAxe.violations.filter((v) => ["critical", "serious"].includes(v.impact)).map((v) => v.id),
    [],
    "Grade 8 student home has no serious or critical accessibility violations",
  );
  await studentContext.close();

  console.log(
    "Family, teacher, and student workflows passed with Axe, keyboard focus recovery, saved-session, Spanish, print, and responsive checks; all three publisher games completed, keyboard-operated, Axe-checked, and retained their results after reload.",
  );
} finally {
  await browser?.close();
  await new Promise((resolveClose, reject) => server.close().then(resolveClose, reject));
}
