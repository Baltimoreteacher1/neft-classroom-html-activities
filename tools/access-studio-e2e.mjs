#!/usr/bin/env node
/**
 * End-to-end walk of the ACCESS Practice Lab studios in a real browser, the way a learner and a
 * teacher use them: speak (fake microphone) → type transcript → feedback → self-review; write →
 * feedback → revise → portfolio; detective fix/transfer; adaptive mission with a decision; Passport
 * share code → Teacher Hub dashboard. Also asserts the honesty rules:
 *   - "on my own" never renders frames, word bank or a model, and is recorded as independent
 *   - frames/bank are recorded as supports, so an independent result can never be contaminated
 *   - no screen prints a proficiency level or score
 *   - nothing overflows horizontally at 375px
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-studio-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-studio-e2e: axe-core/playwright is not installed; skipping axe checks.");
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
const LEDGER = "accessPracticeLab:v1:ledger";
const STUDIO = "accessPracticeLab:v1:studio";

let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}

let browser;
try {
  browser = await chromium.launch({
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
} catch (error) {
  console.warn(`access-studio-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}
const context = await browser.newContext({
  viewport: { width: 1200, height: 900 },
  permissions: ["microphone"],
});
const page = await context.newPage();
const problems = [];
const screenshotDir = "/tmp/access-practice-lab-visual-qa";
mkdirSync(screenshotDir, { recursive: true });
const capture = (name) => page.screenshot({ path: join(screenshotDir, name), fullPage: true });
const noise = /web-vitals|Failed to load resource|ERR_ABORTED|speechSynthesis/i;
page.on("pageerror", (e) => !noise.test(e.message) && problems.push(`pageerror: ${e.message}`));
page.on(
  "console",
  (m) => m.type() === "error" && !noise.test(m.text()) && problems.push(`console: ${m.text()}`),
);
const go = async (path) => {
  await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
  try {
    await page.waitForFunction(
      () => (document.querySelector("#app")?.innerText || "").trim().length > 10,
      { timeout: 10000 },
    );
  } catch (error) {
    console.error(
      `access-studio-e2e: could not load ${path}:`,
      await page
        .locator("#app")
        .innerText()
        .catch(() => "<empty>"),
      problems.slice(-3),
    );
    throw error;
  }
};
const store = (key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), key);
const bodyText = () => page.locator("body").innerText();

// ── Optional diagnostics, teacher launch, and the four language worlds ───────
await go(`${BASE}/diagnostic/Listening`);
await page.locator('input[name="diagnosticAnswer"][value="0"]').check();
await page.locator("[data-diagnostic-answer]").click();
ok(
  /matches the information/i.test(await bodyText()),
  "listening check-in gives item-specific feedback",
);
await page.locator("[data-diagnostic-next]").click();
await page.locator('input[name="diagnosticAnswer"][value="1"]').check();
await page.locator("[data-diagnostic-answer]").click();
ok(
  /strategy to try/i.test(await bodyText()),
  "listening check-in responds to a misinterpretation with a strategy",
);
await page.locator("[data-diagnostic-next]").click();
await page.locator('input[name="diagnosticAnswer"][value="0"]').check();
await page.locator("[data-diagnostic-answer]").click();
await page.locator("[data-diagnostic-next]").click();
await page.getByText(/Suggested starting point/).waitFor();
const diagnosticSaved = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("accessPracticeLab:v1:diagnostic") || "{}"),
);
const diagnosticScreen = await page.locator("#app").innerText();
ok(
  /Suggested starting point/i.test(diagnosticScreen),
  "three-task check-in offers a provisional, non-score practice recommendation",
);
ok(
  diagnosticSaved["6-8:Listening"]?.answers?.length === 3,
  "check-in evidence restores locally without storing student text",
);
await page.reload({ waitUntil: "networkidle" });
await page.getByText(/Suggested starting point/i).waitFor();
ok(true, "check-in recommendation and evidence restore after reload");

await go(`${BASE}/diagnostic/Reading`);
await page.locator('input[name="diagnosticAnswer"][value="0"]').check();
await page.locator("[data-diagnostic-answer]").click();
await page.locator("[data-diagnostic-next]").click();
ok(
  (await bodyText()).includes("A neighborhood library"),
  "reading check-in presents original text and comprehension evidence",
);

await go(`${BASE}/diagnostic/Writing`);
await page
  .locator("[data-diagnostic-draft]")
  .fill("A garden helps students because they observe plants.");
await page.locator('[data-diagnostic-complete="Writing"]').click();
ok(
  /does not retain your spoken or written response/i.test(await bodyText()),
  "writing check-in is honest that its draft is temporary",
);

await go(`${BASE}/launch-studio`);
ok(
  (await page.locator("[data-launch-url]").count()) === 1,
  "Teacher Launch Studio generates a direct activity link",
);
await go(`${BASE}/teacher-launch`);
ok(
  (await page.locator("[data-launch-url]").count()) === 1,
  "Teacher Launch Studio route alias works",
);
const launchHref = await page.locator("[data-launch-url]").inputValue();
ok(
  /grades=6-8/.test(launchHref) && !/student|name|alias/i.test(launchHref),
  "launch URL carries instructional settings and no student identity",
);

await go(`${BASE}/worlds`);
ok(
  (await page.locator(".world-tile").count()) === 4,
  "Language Worlds presents four original environments",
);
for (const id of ["signal-station", "evidence-city", "conversation-quest", "storyworks"]) {
  await go(`${BASE}/worlds/${id}`);
  ok(
    (await page.locator(".world-task-grid .task-card").count()) >= 8,
    `${id} offers eight real Grades 6–8 activities`,
  );
  await go(`${BASE}/worlds/${id}?grades=3-5`);
  ok(
    (await page.locator(".world-task-grid .task-card").count()) >= 8,
    `${id} offers eight real Grades 3–5 activities`,
  );
}
await go(`${BASE}/?grades=6-8`);

// ── Speaking Studio ───────────────────────────────────────────────────────────
await go(`${BASE}/speak`);
ok(/Speaking Studio/.test(await page.locator("h1").innerText()), "speaking chooser loads");
ok((await page.locator(".task-card").count()) >= 18, "speaking chooser lists the authored tasks");

await go(`${BASE}/speak/spk-seedlings-retell`);
await page.getByLabel("On my own").check();
ok(
  (await page.locator(".frames, .wordbank, details[data-model]").count()) === 0,
  "independent speaking shows no frames, word bank or model",
);
await page.locator("[data-rec-start]").click();
await page.waitForSelector("[data-rec-stop]");
await page.waitForTimeout(2600);
await page.locator("[data-rec-stop]").click();
await page.waitForSelector("[data-transcript]", { timeout: 8000 });
ok((await page.locator(".takes audio").count()) === 1, "a take is recorded and playable");
ok(
  /You spoke for|barely hear|did not hear/.test(await bodyText()),
  "audio read-out describes the take (time speaking, pauses, or a quiet-mic hint)",
);
await page
  .locator("[data-transcript]")
  .fill(
    "First, we planted two seeds in a cup. Then we watered them every day because they needed water. After ten days, the seedling grew taller than the first one.",
  );
await page.locator("[data-analyze]").click();
await page.waitForSelector(".coach-card");
ok(
  /What your \d+-word response shows/.test(await page.locator(".coach-card").innerText()),
  "language coach reports on the transcript",
);
let ledger = await store(LEDGER);
const spk = ledger?.entries?.filter((e) => e.src === "speaking") || [];
ok(
  spk.length === 1 && spk[0].stage === "independent" && spk[0].kind === "first",
  "speaking first attempt is recorded as independent",
);
const take0 = Object.values((await store(STUDIO)).speaking)[0].takes[0];
ok(
  Boolean(spk[0]?.m?.spk) || take0.audio?.reason === "too-quiet",
  "speaking take carries on-device audio measures (or an honest quiet-mic result with the fake microphone)",
);
for (const c of ["lc", "vu", "lctl"])
  await page.locator(`input[data-rubric="${c}"][value="building"]`).check();
await page.locator("[data-finish]").click();
ok(
  (await bodyText()).includes("Saved. This is practice evidence"),
  "self-review saves as practice evidence",
);
ok(
  !/\b(level\s*[1-6]|bridging|reaching|you scored)\b/i.test(await bodyText()),
  "speaking screens never state a proficiency level or score",
);
await capture("speaking-feedback-desktop.png");

// ── Writing Studio: guided is recorded as supported ───────────────────────────
await go(`${BASE}/write/wrt-mulch-cer`);
await page.getByLabel("With frames and words").check();
ok(
  (await page.locator(".frames").count()) > 0 && (await page.locator(".wordbank").count()) > 0,
  "guided stage shows frames and a word bank",
);
const draft1 = "Mulch protects soil. It is good.";
await page.locator("[data-draft]").fill(draft1);
await page.locator("[data-feedback]").click();
await page.waitForSelector(".coach-card");
await capture("writing-feedback-desktop.png");
ok(
  (await page.locator(".coach-moves li").count()) >= 1,
  "writing feedback gives specific next moves",
);
await page
  .locator("[data-draft]")
  .fill(
    `${draft1} According to the data, the soil lost 12 pounds without mulch because rain hit the bare ground directly.`,
  );
await page.locator("[data-feedback]").click();
await page.waitForSelector(".draft-history ins");
ok(true, "revision shows a first-draft vs now comparison");
await page
  .locator("[data-reflection]")
  .fill("I added evidence from the data and a reason because it was missing.");
await page.locator("[data-finish]").click();
await page.waitForSelector(".saved-note");
ledger = await store(LEDGER);
const wr = ledger.entries.filter((e) => e.src === "writing");
ok(
  wr[0].kind === "first" && wr[0].stage !== "independent" && wr[0].supports.frames === true,
  "guided first attempt is recorded as supported (frames), never independent",
);
ok(wr[1]?.kind === "revision", "second feedback request is recorded as a revision");

// evidence picker: tapping a source sentence must show state (regression: the notebook never appeared)
await go(`${BASE}/write/wrt-mulch-cer`);
const sent = page.locator(".ev-sent").first();
await sent.click();
ok(
  (await page.locator(".evidence-notebook li").count()) === 1 &&
    (await page.locator(".ev-sent.is-picked").count()) === 1 &&
    (await sent.getAttribute("aria-pressed")) === "true",
  "tapping a source sentence adds it to the evidence notebook and shows it as picked",
);
await page.locator(".ev-sent.is-picked").first().click();
ok((await page.locator(".evidence-notebook li").count()) === 0, "tapping it again removes it");

// independent writing hides supports and is recorded as independent
await go(`${BASE}/write/wrt-bike-plan-paragraph`);
await page.getByLabel("On my own").check();
ok(
  (await page.locator(".frames, .wordbank, details[data-model]").count()) === 0,
  "independent writing shows no frames, word bank or model",
);
await page
  .locator("[data-draft]")
  .fill(
    "The city should build the bike lane because it is safer for students and more families would ride to school together every day.",
  );
await page.locator("[data-feedback]").click();
await page.waitForSelector(".coach-card");
ledger = await store(LEDGER);
const ind = ledger.entries.filter((e) => e.task === "wrt-bike-plan-paragraph");
ok(
  ind[0]?.stage === "independent" && !ind[0].supports.frames && !ind[0].supports.bank,
  "independent writing attempt is recorded with no supports",
);
ok(
  !(await page.locator(".coach-moves .frame").count()),
  "independent feedback offers no sentence frames",
);
await go(`${BASE}/write?tab=portfolio`);
ok((await bodyText()).includes("First draft"), "portfolio keeps the first draft");

// ── Error Detective ───────────────────────────────────────────────────────────
await go(`${BASE}/detective/sv-agree-3sg`);
await page.locator("[data-next]").click();
await page.locator("[data-next]").click();
await page.locator("[data-check-fix]").click();
ok(
  /still|has not changed/i.test(await page.locator(".feedback").innerText()),
  "an unfixed sentence gets a specific, non-answer hint",
);
const broken = await page.locator("#det-answer").inputValue();
const fixed = broken.replace(
  /\b(\w+) (play|go|walk|need|eat|like|study|work|read|talk|ride|help|want|live|run|cook)\b/i,
  (_m, a, v) => `${a} ${v}${/(s|sh|ch|x|o)$/.test(v) ? "es" : "s"}`,
);
await page.locator("#det-answer").fill(fixed);
await page.locator("[data-check-fix]").click();
ok(/Fixed/.test(await page.locator(".feedback").innerText()), "a correct revision is accepted");

// ── Mission with a decision ───────────────────────────────────────────────────
await go(`${BASE}/missions/watershed-mystery`);
ok((await page.locator(".mission-steps li").count()) >= 5, "mission shows its phases");
const radios = page.locator("input[data-q]");
await radios.first().check();
await page.locator("[data-check-q]").first().click();
ok(
  (await page.locator(".mission-q .feedback").count()) > 0,
  "mission question gives feedback tied to the choice",
);

// Mission scaffolds must reach the actual studio stage picker. The studio's own suggestion can
// differ: repeated independent Explain evidence yields a mission word-bank suggestion, while the
// studio would suggest another independent attempt. The learner remains free to change the stage.
await page.evaluate((k) => {
  const entries = ["Explain", "Argue"].flatMap((use) =>
    Array.from({ length: 3 }, (_, i) => ({
      id: `e2e-${use}-${i}`,
      t: new Date(Date.now() - (i + 1) * 864e5).toISOString(),
      src: "writing",
      task: `e2e-${use}-${i}`,
      band: "6-8",
      domain: "Writing",
      use,
      stage: "independent",
      kind: "first",
      supports: {},
      m: { words: 60, link: 2, academic: 2, cites: 1, sentences: 4, clauses: 1, errors: {} },
    })),
  );
  localStorage.setItem(k, JSON.stringify({ v: 1, entries }));
}, LEDGER);
await go(`${BASE}/missions/watershed-mystery?phase=p4`);
await page.locator('a[href*="speak/watershed-mystery-council-brief"]').click();
ok(
  (await page.locator('.stage-picker input[value="supported"]').isChecked()) &&
    (await page.locator(".stage-why").innerText()).includes("mission suggested"),
  "mission support recommendation reaches speaking's real stage picker",
);
await page.locator('.stage-picker input[value="guided"]').check();
ok(
  await page.locator('.stage-picker input[value="guided"]').isChecked(),
  "learner can override the mission's suggested speaking support",
);
await go(`${BASE}/missions/watershed-mystery?phase=p5`);
await page.locator('a[href*="write/watershed-mystery-recommendation"]').click();
ok(
  (await page.locator('.stage-picker input[value="supported"]').isChecked()) &&
    (await page.locator(".stage-why").innerText()).includes("mission suggested"),
  "mission support recommendation reaches writing's real stage picker",
);

// ── Passport share → Teacher dashboard ────────────────────────────────────────
await go(`${BASE}/passport`);
await page.locator("[data-share-alias]").fill("River 7");
const code = await page.evaluate(async () => {
  const m = await import("/access-practice-lab/src/lang/share.js");
  const records = {
    "Reading:A": {
      band: "6-8",
      domain: "Reading",
      level: "A",
      results: Object.fromEntries(
        [1, 2, 3].map((i) => [
          `synthetic-read-${i}`,
          {
            skill: "Identify main idea in a short text",
            ok: false,
            supportUsed: false,
            date: `2026-10-2${i}T12:00:00Z`,
          },
        ]),
      ),
    },
    "Listening:A": {
      band: "6-8",
      domain: "Listening",
      level: "A",
      results: {
        "synthetic-listen-1": {
          skill: "Follow sequence words",
          ok: true,
          supportUsed: true,
          date: "2026-10-22T12:00:00Z",
        },
      },
    },
  };
  const bundle = m.buildShare({ alias: "River 7", band: "6-8" });
  bundle.records = records;
  const second = { ...bundle, alias: "Bay 2", created: new Date(Date.now() + 1000).toISOString() };
  return [m.encodeShare(bundle), m.encodeShare(second)];
});
const [code1, code2] = code;
ok(
  code1.startsWith("ACCESST1.") && code2.startsWith("ACCESST1."),
  "passport can produce share codes with synthetic literacy evidence",
);
await page.goto(`${origin}/access-teacher/`, { waitUntil: "networkidle" });
await page.waitForSelector("#evCode");
await page.locator("#evSection").fill("Period 3");
await page.locator("#evCode").fill(`${code1}\n\n${code2}`);
await page.locator("[data-add]").click();
await page.waitForFunction(
  () => document.querySelectorAll("#classEvidence td.t-title").length === 2,
);
ok(
  (await page.locator("#classEvidence td.t-title").allInnerTexts()).some((name) =>
    name.includes("River 7"),
  ),
  "teacher dashboard lists the student from a share code",
);
await page.locator('[data-student="Period 3|River 7|6-8"]').first().click();
ok((await page.locator(".student-panel").count()) === 1, "student detail opens");
await page.locator('[data-tab="samples"]').click();
ok((await bodyText()).includes("wrt-mulch-cer"), "teacher can read the learner's writing sample");
await page.locator('[data-tab="scoring"]').click();
ok((await page.locator(".hub-card h3").count()) >= 3, "scoring anchors show three practice bands");
await page.locator('[data-tab="groups"]').click();
ok(
  (await page.locator("[data-make-lesson]").count()) > 0,
  "shared evidence creates editable instructional group suggestions",
);
await page.locator('[data-tab="skills"]').click();
ok(
  (await page.locator("#classEvidence").innerText()).includes("Reading: Identify a main idea"),
  "teacher skill diagnostics include traceable reading evidence",
);
await page.locator("[data-skill-domain]").selectOption("Listening");
ok(
  (await page.locator("#classEvidence").innerText()).includes("Listening: Recognize sequence"),
  "teacher can filter diagnostics by domain",
);
await page.locator("[data-skill-domain]").selectOption("All");
await axeCheck("teacher skill diagnostics");
await page.locator('[data-tab="groups"]').click();
const lessonButton = page.locator('[data-make-lesson="reading.main-idea"]').first();
await lessonButton.click();
ok(
  (await page.locator("#lesson-title").innerText()).includes("12 minutes"),
  "teacher can generate an editable template-only lesson draft",
);
await page
  .locator('[data-lesson-edit="languageObjective"]')
  .fill("Students will identify the main idea and support it with one detail.");
for (const check of await page.locator("[data-review-check]").all()) await check.check();
await page.locator("[data-lesson-save]").click();
await page.locator("[data-lesson-approve]").click();
const lessonStatus = await page.locator("#classEvidence").innerText();
ok(
  lessonStatus.includes("approved") && !lessonStatus.includes("not approved"),
  "lesson requires a saved content review and teacher approval",
);
await page.locator('[data-tab="content"]').click();
await axeCheck("teacher lesson provenance review");
await page.locator('[data-tab="blueprint"]').click();
ok(
  !(await page.locator("#classEvidence").innerText()).includes("could not be loaded"),
  "blueprint loads on the live-shaped page",
);
ok(
  (await page.locator("#classEvidence").innerText()).includes("Coverage by Key Language Use"),
  "blueprint tab shows coverage by Key Language Use",
);
const alignmentText = await page.locator("#classEvidence").innerText();
ok(
  alignmentText.includes("539") &&
    alignmentText.includes("27") &&
    alignmentText.includes("candidate mappings"),
  "blueprint tab loads the generated inventory and source-tag-based candidate mapping count",
);
await page.locator('[data-align-filter="band"]').selectOption("6-8");
await page.locator('[data-align-filter="keyUse"]').selectOption("Explain");
await page.locator('[data-align-filter="contentArea"]').selectOption("Science");
await page.locator('[data-align-filter="domain"]').selectOption("Speaking");
await page
  .locator('[data-align-filter="languageFunction"]')
  .selectOption("Explain cause and effect");
await page.locator('[data-align-filter="standard"]').selectOption("ELD-SC");
await page
  .locator('[data-align-filter="expectation"]')
  .selectOption("ELD-SC.6-8.Explain.Expressive");
const alignedRows = page.locator(
  '.ev-body section[aria-labelledby="activityCoverageTitle"] .lab-table-wrap tbody tr',
);
ok(
  (await alignedRows.allInnerTexts()).some((text) =>
    text.includes("Explain Why the Water Disappeared"),
  ),
  "teacher filters across grade, KLU, context, domain, function, standard and expectation gap",
);
ok(
  (await page.locator("#classEvidence").innerText()).includes(
    "They are candidates, not verified alignments",
  ),
  "alignment table distinguishes candidate mappings from verified WIDA alignments",
);
await alignedRows
  .filter({ hasText: "Explain Why the Water Disappeared" })
  .locator("[data-alignment-review] summary")
  .click();
const alignmentReview = alignedRows
  .filter({ hasText: "Explain Why the Water Disappeared" })
  .locator("[data-alignment-review]");
await alignmentReview.locator('[data-alignment-field="gradeCluster"]').selectOption("6-8");
await alignmentReview.locator('[data-alignment-field="academicContext"]').fill("Science");
await alignmentReview.locator('[data-alignment-field="keyUse"]').selectOption("Explain");
await alignmentReview.locator('[data-alignment-field="standard"]').selectOption("ELD-SC");
await alignmentReview
  .locator('[data-alignment-field="languageExpectation"]')
  .selectOption("ELD-LA.6-8.Argue.Expressive");
await alignmentReview
  .locator('[data-alignment-field="languageFunction"]')
  .fill("Explain cause and effect");
await alignmentReview
  .locator('[data-alignment-field="languageFeatures"]')
  .fill("causal conjunctions; connected clauses");
await alignmentReview
  .locator('[data-alignment-field="sourceReference"]')
  .fill("https://wida.wisc.edu/teach/standards/eld");
await alignmentReview.locator("[data-align-save]").click();
ok(
  await alignmentReview.locator("[data-alignment-review-error]").isVisible(),
  "teacher review rejects a catalog ID that conflicts with the selected standard and use",
);
await alignmentReview
  .locator('[data-alignment-field="languageExpectation"]')
  .selectOption("ELD-SC.6-8.Explain.Expressive");
await alignmentReview.locator("[data-align-save]").click();
const savedAlignmentReview = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("accessTeacher:v1:alignmentReviews") || "{}"),
);
ok(
  Boolean(savedAlignmentReview["spk-evaporation-explain"]),
  "teacher can save source-cited local metadata review in this browser",
);
ok(
  savedAlignmentReview["spk-evaporation-explain"]?.status === "teacher-reviewed-local",
  "saved review remains explicitly distinct from official WIDA verification",
);
await page.locator("[data-align-reset]").click();
await page.evaluate(() => {
  const saved = JSON.parse(localStorage.getItem("accessTeacher:v1:alignmentReviews") || "{}");
  delete saved["spk-evaporation-explain"];
  localStorage.setItem("accessTeacher:v1:alignmentReviews", JSON.stringify(saved));
});
await page.reload({ waitUntil: "networkidle" });
await page.locator('[data-tab="blueprint"]').click();
await page.locator("[data-align-reset]").click();
ok(
  (await page.locator("#classEvidence").innerText()).includes("539 of 539 records"),
  "teacher can reset alignment filters",
);
await axeCheck("teacher activity alignment matrix");
await overflowAt375("teacher activity alignment matrix");

// ── quality-upgrade slices: spaced review, listening lab, evidence notebook, rehearsal modes,
//    station cards, teacher conference plans. Each new page/view gets axe + 375px overflow. ────
async function overflowAt375(label, pg = page) {
  const vp = pg.viewportSize();
  await pg.setViewportSize({ width: 375, height: 800 });
  await pg.waitForTimeout(150);
  const over = await pg.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  ok(over <= 1, `no horizontal overflow at 375px: ${label}`);
  await pg.setViewportSize(vp);
}
const NO_LEVEL_OR_SCORE = /\b(level\s*[1-6]|scores?|scored|proficiency|bridging|reaching)\b/i;

// 1. Spaced retrieval: an independent Error Detective miss 5 days ago is due today (1-day step).
const ledgerBefore = await page.evaluate((k) => localStorage.getItem(k), LEDGER);
await page.evaluate((k) => {
  const saved = JSON.parse(localStorage.getItem(k) || '{"v":1,"entries":[]}');
  const t = new Date(Date.now() - 5 * 864e5).toISOString();
  saved.entries.push({
    id: "e2e-spaced-seed",
    t,
    src: "detective",
    task: "det-past-marker",
    band: "6-8",
    domain: "Writing",
    use: "",
    stage: "independent",
    kind: "first",
    supports: {},
    m: { pattern: "past-marker", ok: false },
  });
  localStorage.setItem(k, JSON.stringify(saved));
}, LEDGER);
await go(`${BASE}/?grades=6-8`);
const review = page.locator("section.review-due");
ok(
  (await review.count()) === 1 &&
    (await page.locator("#reviewTitle").innerText()).includes("Keep it strong"),
  "home shows the Keep it strong review hub when stored evidence makes an item due",
);
const traces = await review.locator("li .fine").allInnerTexts();
const seededTrace = traces.find((t) => /Error Detective/.test(t)) || "";
ok(
  traces.length > 0 &&
    traces.every((t) => t.includes("Why this is recommended:")) &&
    /5 days ago/.test(seededTrace),
  "each due item carries a 'Why this is recommended' trace built from its stored evidence",
);
ok(
  traces.every((t) => !NO_LEVEL_OR_SCORE.test(t)),
  `spaced-review traces state no level or score${traces.find((t) => NO_LEVEL_OR_SCORE.test(t)) ? ` — "${traces.find((t) => NO_LEVEL_OR_SCORE.test(t))}"` : ""}`,
);
await axeCheck("home with spaced review due");
await overflowAt375("home with spaced review due");
await page.evaluate(
  ([k, v]) => (v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v)),
  [LEDGER, ledgerBefore],
);

// 2. Listening Strategy Lab (Learn with help) vs Independent.
const LISTEN_ID = "lst-v11-b-cause-effect-storm";
const LISTEN_PATH = `${BASE}/Listening/B/${LISTEN_ID}?grades=6-8`;
const scriptParts = await page.evaluate(async (id) => {
  const res = await fetch("/access-practice-lab/content/g6-8/Listening.json");
  const data = await res.json();
  const a = data.levels.B.activities.find((x) => x.id === id);
  const { listeningSegments } = await import("/access-practice-lab/src/learning.js");
  return listeningSegments(a.script).map((s) => s.text);
}, LISTEN_ID);
const scriptLeaks = () =>
  page.evaluate((parts) => {
    // Every text node and attribute value on the page, minus the number-only replay controls.
    const chunks = [];
    const walk = (el) => {
      if (el.matches?.("[data-replay-seg]")) return;
      for (const attr of el.attributes || []) chunks.push(attr.value);
      for (const node of el.childNodes) {
        if (node.nodeType === 3) chunks.push(node.nodeValue);
        else if (node.nodeType === 1) walk(node);
      }
    };
    walk(document.body);
    const all = chunks.join(" ").replace(/\s+/g, " ");
    return parts.filter((p) => p.length >= 20 && all.includes(p));
  }, scriptParts);
await page.evaluate(() => {
  for (const k of Object.keys(localStorage))
    if (/:Listening:B$/.test(k) || k.includes("listenNotes")) localStorage.removeItem(k);
});
await go(LISTEN_PATH);
ok(
  scriptParts.length >= 2 && (await page.locator(".listen-strategy").count()) === 1,
  "Learn with help: a Listening activity shows the Listening strategy lab",
);
ok(
  /Before you listen: your purpose/.test(
    await page.locator(".listen-strategy").evaluate((el) => el.textContent),
  ),
  "Learn with help: the strategy lab previews the listening purpose",
);
const leaksBefore = await scriptLeaks();
ok(
  leaksBefore.length === 0,
  `before the first answer no script text is in the DOM outside the replay controls${leaksBefore.length ? ` — leaked: "${leaksBefore[0]}"` : ""}`,
);
await axeCheck("listening activity with strategy lab");
await overflowAt375("listening activity with strategy lab");
await page.locator(".choice", { hasText: "field was being cleaned" }).click();
await page.locator("[data-check]").click();
await page.waitForSelector(".feedback");
ok(
  (await page.locator(".listen-trap").count()) === 1,
  "Learn with help: a wrong listening answer gets a trap diagnosis",
);
ok(
  (await page.locator(".transcript .signal-word").count()) > 0,
  "Learn with help: after answering, the transcript offers taggable signal words",
);
await axeCheck("listening activity after a diagnosed miss");
await page.evaluate(() => {
  for (const k of Object.keys(localStorage))
    if (/:Listening:B$/.test(k)) localStorage.removeItem(k);
});
await go(`${LISTEN_PATH}&mode=independent`);
ok(
  (await page.locator(".listen-strategy").count()) === 0,
  "Independent: no strategy lab or purpose preview",
);
ok(
  (await page.locator("[data-listen]").count()) === 1 &&
    (await page.locator("[data-stop-audio]").count()) === 1,
  "Independent: play and stop controls remain",
);
ok((await scriptLeaks()).length === 0, "Independent: no script text before answering");
await page.locator(".choice", { hasText: "field was being cleaned" }).click();
await page.locator("[data-check]").click();
await page.waitForSelector(".feedback");
ok(
  (await page.locator(".signal-word, [data-tag-signal]").count()) === 0 &&
    (await page.locator(".listen-trap").count()) === 0 &&
    (await page.locator(".listen-strategy").count()) === 0,
  "Independent: no signal-word highlights, no diagnosis and no strategy lab after a miss",
);
ok(
  (await page.locator("[data-listen]").count()) === 1 &&
    (await page.locator("[data-stop-audio]").count()) === 1,
  "Independent: play and stop controls remain after answering",
);
await axeCheck("independent listening activity");
await overflowAt375("independent listening activity");

// 3. Reading evidence: keyboard pin → Claim → notebook → reload → matrix → criterion feedback.
await page.evaluate(() => localStorage.removeItem("accessPracticeLab:evidenceNotebook:v1"));
await go(`${BASE}/evidence?grades=6-8`);
const sentenceBtn = page.locator(".passage button[data-nb-pick]").first();
const sentenceText = (await sentenceBtn.innerText()).trim();
await sentenceBtn.focus();
await page.keyboard.press("Enter");
await page.waitForSelector('[data-nb-tag="claim"]');
ok(
  (await page.locator("#nbTagLabel").innerText()).includes(sentenceText.slice(0, 30)),
  "Enter on a focused sentence button selects it for tagging",
);
await page.locator('[data-nb-tag="claim"]').focus();
await page.keyboard.press("Enter");
await page.waitForFunction(
  (txt) => (document.querySelector("#notebook")?.textContent || "").includes(txt),
  sentenceText.slice(0, 30),
);
const notebookHas = async () => {
  const groups = await page.locator("#notebook .nb-group").allInnerTexts();
  return groups.some((g) => /^Claim/.test(g.trim()) && g.includes(sentenceText.slice(0, 30)));
};
ok(await notebookHas(), "the pinned sentence appears in the Evidence Notebook as a Claim");
await page.reload({ waitUntil: "networkidle" });
await page.waitForSelector("#notebook");
ok(await notebookHas(), "the Evidence Notebook survives a reload");
ok((await page.locator("table.nb-matrix").count()) === 1, "the synthesis matrix is shown");
await page.locator('[data-nb-place$=":text"]').first().click();
await page.waitForFunction(
  (txt) =>
    [...document.querySelectorAll("table.nb-matrix tbody tr")].some(
      (tr) => /only the text/i.test(tr.textContent) && tr.textContent.includes(txt),
    ),
  sentenceText.slice(0, 30),
);
ok(true, "a pin can be placed in the synthesis matrix");
const synTitles = await page.evaluate(() => [
  document.querySelector("#synText")?.textContent.trim(),
  document.querySelector("#synData")?.textContent.trim(),
]);
await page
  .locator("[data-syn-text]")
  .fill(
    `According to ${synTitles[0]}, ${sentenceText} The data in ${synTitles[1]} also supports this idea, so both sources agree.`,
  );
await page.locator("[data-syn-check]").click();
await page.waitForSelector(".feedback .checks li");
const critText = await page.locator(".feedback .checks").innerText();
ok(
  (await page.locator(".feedback .checks li").count()) >= 2,
  "synthesis check gives criterion-by-criterion feedback",
);
ok(
  !NO_LEVEL_OR_SCORE.test(critText) &&
    /not a score or a level/i.test(await page.locator(".feedback").innerText()),
  "synthesis feedback gives no score or level and says so",
);
await axeCheck("evidence studio with notebook and synthesis feedback");
await overflowAt375("evidence studio with notebook and synthesis feedback");

// 4. Practice-test modes: Guided vs Independent Rehearsal.
const TEST_ID = "wida-writing-mini";
// Leave the runner first: it saves its record on pagehide, which would undo the reset.
const resetTest = async () => {
  await go(`${BASE}/tests`);
  await page.evaluate((id) => localStorage.removeItem(`accessPracticeLab:v1:test:${id}`), TEST_ID);
};
await resetTest();
await go(`${BASE}/test/${TEST_ID}?grades=6-8`);
const rhIntro = await page.locator(".rh-tools").innerText();
ok(
  /EduWonderLab rehearsal settings/.test(rhIntro) &&
    /not official WIDA ACCESS accommodations/i.test(rhIntro),
  "rehearsal settings are labelled EduWonderLab rehearsal settings, not official WIDA ACCESS accommodations",
);
await axeCheck("practice test intro (mode choice)");
await overflowAt375("practice test intro (mode choice)");
await page.locator("[data-start]").click();
await page.waitForSelector("#qTitle");
ok(/Guided Practice Mode/.test(await bodyText()), "practice test launches in Guided Practice Mode");
ok(
  (await page.locator("[data-guided-check]", { hasText: "Check my answer" }).count()) === 1 &&
    (await page.locator(".frames li").count()) > 0,
  "Guided mode offers 'Check my answer' and sentence frames",
);
await axeCheck("practice test runner, Guided");
await overflowAt375("practice test runner, Guided");
await resetTest();
await go(`${BASE}/test/${TEST_ID}?grades=6-8`);
await page.check('[data-conditions][value="test"]');
await page.waitForSelector("[data-replay]");
const replayLabel = await page.locator("label", { has: page.locator("[data-replay]") }).innerText();
ok(
  /EduWonderLab rehearsal setting/.test(replayLabel) &&
    /does not grant or represent an official/i.test(replayLabel),
  "the replay option is labelled an EduWonderLab rehearsal setting, not an official accommodation",
);
ok(
  /not official WIDA ACCESS accommodations/i.test(await page.locator(".rh-tools").innerText()),
  "Independent intro keeps the not-official-WIDA-ACCESS-accommodations notice",
);
await axeCheck("practice test intro, Independent Rehearsal chosen");
await page.locator("[data-start]").click();
await page.waitForSelector("#qTitle");
const indText = await bodyText();
ok(
  /Independent Rehearsal Mode/.test(indText),
  "practice test launches in Independent Rehearsal Mode",
);
ok(
  (await page.locator("[data-guided-check]").count()) === 0 && !/Check my answer/.test(indText),
  "Independent Rehearsal shows no 'Check my answer' button",
);
ok(
  (await page.locator(".frames, .wordbank, details.lookback").count()) === 0,
  "Independent Rehearsal shows no sentence frames, word bank or look-back hints",
);
ok(
  /not the official WIDA ACCESS accommodations/i.test(await page.locator(".rh-tools").innerText()),
  "runner rehearsal toolbar says it is not the official WIDA ACCESS accommodations",
);
await axeCheck("practice test runner, Independent Rehearsal");
await overflowAt375("practice test runner, Independent Rehearsal");
await resetTest();

// 5. Station cards on /launch-studio.
await go(`${BASE}/launch-studio`);
ok(
  /Print Station Cards/.test(await page.locator("#station-title").innerText()),
  "Launch Studio has a Print Station Cards view",
);
const stationValues = await page.$$eval("[data-station-field] option", (os) =>
  os.map((o) => o.value),
);
const pickStation = async (value) => {
  await page.locator("[data-station-field]").selectOption(value);
  await page.waitForSelector(`[data-station="${value}"]`);
};
const bandHeads = () => page.locator(".station-card .station-ex h4").allInnerTexts();
const stationLinkOk = async (kindPath) => {
  const url = (await page.locator(".station-card .station-url").innerText()).trim();
  return (
    url.startsWith(`${origin}${BASE}/${kindPath}`) &&
    (await page
      .locator(
        ".station-card .station-link img, .station-card .station-link canvas, .station-card .station-link svg",
      )
      .count()) === 0 &&
    /No QR code/.test(await page.locator(".station-card .station-link").innerText())
  );
};
const worldValue = stationValues.find((v) => v.startsWith("world:"));
const activityValue = stationValues.find((v) => v.startsWith("activity:"));
const studioValues = stationValues.filter((v) => v.startsWith("studio:"));
ok(
  Boolean(worldValue && activityValue && studioValues.length),
  "station picker lists worlds, studio tasks and activities",
);
await pickStation(worldValue);
ok(
  (await stationLinkOk("worlds/")) && (await bandHeads()).length === 0,
  "world station card prints a full URL (no QR) and no early/building/strong exemplars",
);
await pickStation(activityValue);
ok(
  (await stationLinkOk("")) && (await bandHeads()).length === 0,
  "activity station card prints a full URL (no QR) and no early/building/strong exemplars",
);
let studioBands = [];
for (const v of studioValues.slice(0, 12)) {
  await pickStation(v);
  studioBands = await bandHeads();
  if (studioBands.length) {
    ok(await stationLinkOk(""), `studio station card prints a full URL (no QR): ${v}`);
    break;
  }
}
ok(
  studioBands.join(",") === "Early,Building,Strong",
  `studio station card shows early / building / strong exemplars (got: ${studioBands.join(",") || "none"})`,
);
await axeCheck("launch studio station card");
await overflowAt375("launch studio station card");

// 6. Teacher conference plans: empty with no codes; demo button is labelled SYNTHETIC DEMO.
const teacherCtx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const tPage = await teacherCtx.newPage();
tPage.on("pageerror", (e) => !noise.test(e.message) && problems.push(`pageerror: ${e.message}`));
await tPage.goto(`${origin}/access-teacher/`, { waitUntil: "networkidle" });
await tPage.waitForSelector('[data-tab="plans"]');
await tPage.locator('[data-tab="plans"]').click();
await tPage.waitForSelector("#plansTitle");
const plansText = await tPage.locator("#classEvidence").innerText();
ok(
  /No student codes are loaded/.test(plansText) &&
    (await tPage.locator(".hub-card h4").count()) === 0,
  "conference plans tab shows an empty state with no codes loaded",
);
ok(
  (await tPage.locator("[data-demo-load]").innerText()).includes("SYNTHETIC DEMO"),
  "the 'Load sample demo class' button is labelled SYNTHETIC DEMO",
);
await axeCheck("teacher conference plans (empty)", tPage);
await overflowAt375("teacher conference plans (empty)", tPage);
await tPage.locator("[data-demo-load]").click();
await tPage.waitForSelector("[data-demo-clear]");
ok(
  /SYNTHETIC DEMO DATA/.test(await tPage.locator("#plansTitle").innerText()) &&
    (await tPage.locator("#classEvidence article.hub-card h4").count()) > 0 &&
    // The plan cards and the gap table themselves; the page's "never a WIDA level or ACCESS
    // score" disclaimers and the import box's storage note are outside these elements.
    !NO_LEVEL_OR_SCORE.test(
      (
        await tPage
          .locator(
            'section[aria-labelledby="plansTitle"] article.hub-card, section[aria-labelledby="gapsTitle"] table',
          )
          .allInnerTexts()
      ).join("\n"),
    ),
  "demo conference plans are marked SYNTHETIC DEMO DATA and the plans state no level or score",
);
await axeCheck("teacher conference plans (synthetic demo)", tPage);
await overflowAt375("teacher conference plans (synthetic demo)", tPage);
await teacherCtx.close();

// ── accessibility (axe: WCAG 2.2 AA) ──────────────────────────────────────────
async function axeCheck(label, pg = page) {
  if (!AxeBuilder) return;
  const res = await new AxeBuilder({ page: pg })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const bad = res.violations.map(
    (v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
  );
  ok(
    bad.length === 0,
    `axe WCAG 2.2 AA: ${label}${bad.length ? ` — ${bad.slice(0, 3).join(" | ")}` : ""}`,
  );
}
await go(`${BASE}/`);
await axeCheck("home");
await capture("home-desktop.png");
await go(`${BASE}/tests`);
await capture("practice-tests-desktop.png");
await go(`${BASE}/Listening`);
await capture("listening-desktop.png");
await go(`${BASE}/Reading`);
await capture("reading-desktop.png");
await go(`${BASE}/speak`);
await axeCheck("speaking chooser");
await capture("speaking-desktop.png");
await go(`${BASE}/speak/spk-seedlings-retell`);
await axeCheck("speaking task");
await go(`${BASE}/write/wrt-mulch-cer`);
await axeCheck("writing task with feedback");
await go(`${BASE}/write`);
await axeCheck("writing chooser");
await capture("writing-desktop.png");
await go(`${BASE}/detective`);
await axeCheck("detective hub");
await go(`${BASE}/detective/sv-agree-3sg`);
await axeCheck("detective case");
await go(`${BASE}/missions`);
await axeCheck("missions hub");
await go(`${BASE}/missions/watershed-mystery`);
await axeCheck("mission phase");
await go(`${BASE}/growth`);
await axeCheck("growth map");
await go(`${BASE}/passport`);
await axeCheck("passport");
await go(`${BASE}/diagnostic/Listening`);
await axeCheck("listening check-in");
await go(`${BASE}/diagnostic/Writing`);
await axeCheck("writing check-in");
await go(`${BASE}/teacher-launch`);
await axeCheck("teacher launch studio");
await capture("teacher-launch-desktop.png");
await go(`${BASE}/worlds`);
await axeCheck("language worlds hub");
await capture("worlds-desktop.png");
await go(`${BASE}/worlds/evidence-city`);
await axeCheck("language world detail");
await capture("world-detail-desktop.png");
await go(`${BASE}/worlds/signal-station/schedule-shift`);
await axeCheck("world mission console");
await go(`${BASE}/classroom`);
await axeCheck("whole-class studio");
await capture("classroom-desktop.png");
await go(`${BASE}/vocabulary`);
await axeCheck("vocabulary word builder");
await capture("vocabulary-desktop.png");
await page.goto(`${origin}/access-teacher/`, { waitUntil: "networkidle" });
await page.waitForSelector("#classEvidence td.t-title");
await axeCheck("teacher dashboard");

// ── mobile overflow ───────────────────────────────────────────────────────────
await page.setViewportSize({ width: 375, height: 800 });
for (const p of [
  `${BASE}/`,
  `${BASE}/speak`,
  `${BASE}/speak/spk-seedlings-retell`,
  `${BASE}/write/wrt-mulch-cer`,
  `${BASE}/detective`,
  `${BASE}/missions/watershed-mystery`,
  `${BASE}/growth`,
  `${BASE}/passport`,
  `${BASE}/diagnostic/Listening`,
  `${BASE}/diagnostic/Writing`,
  `${BASE}/teacher-launch`,
  `${BASE}/worlds`,
  `${BASE}/worlds/storyworks`,
  `${BASE}/worlds/signal-station/schedule-shift`,
  `${BASE}/classroom`,
  `${BASE}/vocabulary`,
]) {
  await go(p);
  if ([`${BASE}/`, `${BASE}/teacher-launch`, `${BASE}/worlds`].includes(p))
    await capture(`${p === `${BASE}/` ? "home" : p.slice(BASE.length + 1)}-mobile.png`);
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  ok(over <= 1, `no horizontal overflow at 375px: ${p}`);
}
ok(
  problems.length === 0,
  `no page errors${problems.length ? `: ${problems.slice(0, 3).join(" | ")}` : ""}`,
);

await browser.close();
server?.close();
if (failures.length) {
  console.error(`\naccess-studio-e2e: FAIL (${failures.length})`);
  process.exit(1);
}
console.log("\naccess-studio-e2e: PASS");
