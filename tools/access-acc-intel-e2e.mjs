#!/usr/bin/env node
/**
 * Phase 6C-6E in a real browser: the rule-based writing feedback and self-check in Learning mode, the teacher review workflow
 * (queue, rubric, save, share) and the student's view of that feedback, the insights panel with its suggested next step opening a
 * custom set, and the assignment builder producing a working link. Honesty checks: no score, level or "official" claim anywhere
 * a learner reads, and feedback kinds are labelled.
 */
import { fixtureRows, seedEvidence } from "./lib/access-acc-fixtures.mjs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-acc-intel-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const failures = [];
const ok = (c, m) => {
  if (!c) failures.push(m);
  console.log(`${c ? "PASS" : "FAIL"} ${m}`);
};
const { server, base } = await serveAccess();
const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const ROOT = `${base}/access-practice-lab`;
const SPEECH = `Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speaking: false, paused: false, getVoices: () => [], addEventListener() {}, removeEventListener() {}, cancel() {}, pause() {}, resume() {}, speak(u) { setTimeout(() => u.onend && u.onend({}), 600); } } });`;
const TEXT =
  "First the plants in the sun grew taller because they got more light. Then I compared them with the plants in the shade, which grew less. In addition the data show a clear difference, so light helps plants grow.";
const FORBIDDEN =
  /\b(your (wida|access) (score|level)|proficien|emerging|expanding|bridging|official score of)\b/i;

async function axeClean(page, label, include) {
  const { default: AxeBuilder } = await import("@axe-core/playwright");
  const r = await new AxeBuilder({ page })
    .include(include)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  ok(
    r.violations.length === 0,
    `${label}: axe WCAG 2.2 AA clean ${r.violations.map((v) => `${v.id}:${v.nodes[0].target.join(" ")}`).join(" | ")}`,
  );
}

async function fresh() {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ["microphone"],
  });
  await ctx.addInitScript(SPEECH);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals|@engine\//.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  return { ctx, page, errors };
}

// 1. a writing response: rule-based feedback, self-check, evidence row, teacher review, student feedback
{
  const { ctx, page, errors } = await fresh();
  await page.goto(`${ROOT}/assess/b35-write-01?mode=formative`, { waitUntil: "networkidle" });
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-textarea").fill(TEXT);
  await page.locator("[data-act=check]").click();
  const wf = page.locator(".acc-writing-feedback");
  await wf.waitFor();
  const wt = await wf.innerText();
  ok(
    /What the lab counted/.test(wt) && /does not judge meaning and it is not a score/.test(wt),
    "Learning mode shows rule-based writing observations labelled as not a score",
  );
  ok(
    /Linking words you used/.test(wt),
    "the observation names the linking words actually in the text",
  );
  ok(
    (await wf.getAttribute("data-evidence")) === "rule-based",
    "the feedback carries its evidence kind",
  );
  ok(!FORBIDDEN.test(wt), "the writing feedback makes no score, level or proficiency claim");
  const boxes = page.locator(".acc-checklist input[type=checkbox]");
  ok((await boxes.count()) >= 3, "the self-check is a set of tickable boxes");
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await page.locator("[data-act=review]").click();
  await page.locator("[data-act=submit]").click();
  await page.locator(".acc-results").waitFor();
  const rt = await page.locator(".acc-results").innerText();
  ok(/Not scored by the lab/.test(rt), "results label a writing response as not scored by the lab");
  const row = await page.evaluate(
    () =>
      new Promise((res) => {
        const o = indexedDB.open("ACCESS_Lab_DB");
        o.onsuccess = () => {
          const r = o.result
            .transaction("passport_progress")
            .objectStore("passport_progress")
            .getAll();
          r.onsuccess = () => res(r.result.find((x) => x.status === "needs-review"));
        };
      }),
  );
  ok(
    row && row.selfChecked === 2 && row.selfTotal >= 3,
    `the evidence row records the self-check (${row?.selfChecked} of ${row?.selfTotal})`,
  );

  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.locator("#accReviewBody [data-act=open-review]").first().waitFor();
  await page.locator("#accReviewBody [data-act=open-review]").first().click();
  await page.locator(".acc-review-text").waitFor();
  ok(
    (await page.locator(".acc-review-text").innerText()).includes("plants in the sun"),
    "the review shows the student's own writing",
  );
  await page.locator("[data-act=save-review]").click();
  ok(
    /Rate every dimension/.test(
      await page.locator(".acc-review-form .acc-state.is-error").innerText(),
    ),
    "a review cannot be saved until every dimension is rated",
  );
  const dims = await page.locator(".acc-review-dim").count();
  ok(dims >= 7, `the writing rubric has ${dims} dimensions`);
  for (let d = 0; d < dims; d++)
    await page.locator(".acc-review-dim").nth(d).locator("input[type=radio]").nth(2).check();
  await axeClean(page, "review form", "#accReview");
  await page
    .locator("#rvNote")
    .fill("Clear cause and effect. Add one number from the data next time.");
  await page.locator("#rvShare").check();
  await page.locator("[data-act=save-review]").click();
  await page.locator("#accReviewBody .acc-state.is-empty").waitFor();
  ok(
    /Nothing is waiting for review/.test(await page.locator("#accReviewBody").innerText()),
    "a saved review leaves the queue",
  );
  await page.locator("#accReviewBody [data-act=toggle-done]").click();
  ok(
    (await page.locator("#accReviewBody [data-act=open-review]").count()) === 1,
    "the reviewed list holds the finished review",
  );

  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  const tf = page.locator(".acc-teacher-feedback");
  await tf.waitFor({ timeout: 8000 });
  await axeClean(page, "teacher feedback", ".acc-teacher-feedback");
  const tft = await tf.innerText();
  ok(
    /Feedback from your teacher/.test(tft) &&
      /What you showed/.test(tft) &&
      /Clear cause and effect/.test(tft),
    "the student sees the shared teacher feedback with the teacher's note",
  );
  ok(
    !/\b\d+ (of|out of) \d+\b|%/.test(tft) && !FORBIDDEN.test(tft),
    "teacher feedback shows no number, score or level",
  );
  ok(
    /not a WIDA or ACCESS score or level/.test(tft),
    "teacher feedback says it is not a WIDA or ACCESS score",
  );
  ok(errors.length === 0, `no console errors ${errors.join("|")}`);
  await ctx.close();
}

// 2. insights and the suggested next step
{
  const { ctx, page, errors } = await fresh();
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  await seedEvidence(page, fixtureRows());
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.locator("#inSkills").waitFor({ timeout: 8000 });
  await page.locator("#inLearner").selectOption("L-fixture1");
  const txt = await page.locator("#accInsightsBody").innerText();
  ok(
    /Suggested next step/.test(txt) && /Re-teach, then practice/.test(txt),
    "the insights panel suggests re-teaching the skill with the misses",
  );
  ok(
    /Skill progress/.test(txt) && /Needs support/.test(txt) && /Building/.test(txt),
    "skills are shown as building / needs support, never as a level",
  );
  ok(
    !/\bSecure\b/.test(await page.locator("#inSkills tbody").innerText()),
    "four wins on one day is not called secure",
  );
  await page.locator("#accInsightsBody details summary").click();
  await page.locator("#th-minDays").fill("1");
  await page.locator("#th-minDays").dispatchEvent("change");
  await page.waitForTimeout(400);
  await page.locator("#accInsightsBody details summary").click();
  ok(
    (await page.locator("#th-minDays").inputValue()) === "1",
    "the teacher can change the mastery thresholds",
  );
  await axeClean(page, "learning insights", "#accInsights");
  const next = page.locator("[data-act=practice-next]");
  ok((await next.count()) === 1, "the next step links to suggested questions");
  await Promise.all([page.waitForURL(/assess\/custom/), next.click()]);
  await page.locator("[data-act=begin]").waitFor();
  ok(
    /Next step practice/.test(await page.locator("h1").innerText()),
    "the suggested questions open as a custom set",
  );
  ok(errors.length === 0, `no console errors ${errors.join("|")}`);
  await ctx.close();
}

// 3. assignment builder
{
  const { ctx, page, errors } = await fresh();
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.locator("#asKind").waitFor({ timeout: 8000 });
  await page.locator("#asKind").selectOption("domain");
  await page.locator("#asDomain").selectOption("Reading");
  await page.locator("#asCount").fill("6");
  await page.locator("#asCount").dispatchEvent("change");
  await page.waitForTimeout(300);
  ok(
    (await page.locator("#asPreview li").count()) === 6,
    "six matching Reading questions are previewed",
  );
  await axeClean(page, "assignment builder", "#accAssign");
  await page.locator("#asKind").selectOption("simulation");
  await page.locator("#asSet").selectOption("b35-read-02");
  await page.waitForTimeout(200);
  ok(
    /whole set will be taken as a test simulation/.test(
      await page.locator("#asCountMsg").innerText(),
    ),
    "a simulation assignment is a whole set",
  );
  await page.locator("#asKind").selectOption("supported");
  await page.locator("#asCount").fill("5");
  await page.locator("#asCount").dispatchEvent("change");
  await page.locator("#asTitle").fill("Friday practice");
  await page.locator("#asTitle").dispatchEvent("change");
  await page.waitForTimeout(200);
  await page.locator("[data-act=save-assign]").click();
  const href = await page.locator("#asSaved a").first().getAttribute("href");
  ok(
    /assess\/custom\?mode=formative&title=Friday%20practice&ids=/.test(href),
    "the saved assignment is a Learning-mode link with its title",
  );
  await page.goto(
    `${base}${href.startsWith("http") ? new URL(href).pathname + new URL(href).search : href}`,
    { waitUntil: "networkidle" },
  );
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
  ok(
    (await page.locator(".acc-qdot").count()) === 5,
    "the assignment link opens the five chosen questions",
  );
  ok(
    /Friday practice/.test(await page.locator("h1").innerText()),
    "the assignment title is shown to the student",
  );
  ok(errors.length === 0, `no console errors ${errors.join("|")}`);
  await ctx.close();
}

// 4. a speaking response: the teacher can play the recording and the rubric names what the lab does not score
{
  const { ctx, page, errors } = await fresh();
  await page.goto(`${ROOT}/assess/b35-speak-01?mode=summative`, { waitUntil: "networkidle" });
  const timer = page.locator("#accTimer");
  if (await timer.count()) await timer.uncheck();
  await page.locator("[data-act=begin]").click();
  await page.locator("[data-act=mic-check]").click();
  await page.locator('.acc-mic[data-state="ready"]').waitFor({ timeout: 15000 });
  await page.locator("[data-act=speak-begin]").click();
  await page.locator("[data-act=speak-skip]").click();
  await page.waitForTimeout(1500);
  await page.locator("[data-act=speak-stop]").click();
  await page.locator("[data-act=speak-use]").click();
  await page.locator("[data-act=speak-confirm]").click();
  await page.locator(".acc-state.is-success").waitFor();
  await page.locator("[data-act=review]").click();
  await page.locator("[data-act=submit]").click();
  await page.locator(".acc-results").waitFor();
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  const open = page.locator("#accReviewBody [data-act=open-review]").first();
  await open.waitFor();
  await open.click();
  const audio = page.locator("#accReviewBody audio");
  await audio.waitFor();
  await page.waitForFunction(
    () => document.querySelector("#accReviewBody audio")?.src?.startsWith("blob:"),
    null,
    { timeout: 8000 },
  );
  ok(true, "the teacher gets an audio player with the student's recording");
  const t = await page.locator(".acc-review-detail").innerText();
  ok(
    /Not scored here: Pronunciation, Speaking speed and pauses, Grammar accuracy/.test(t),
    "the speaking rubric names what the lab does not score",
  );
  ok(
    (await page.locator(".acc-review-dim").count()) === 7,
    "the speaking rubric has seven dimensions",
  );
  ok(errors.length === 0, `no console errors ${errors.join("|")}`);
  await ctx.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-acc-intel-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-acc-intel-e2e: all checks passed");
