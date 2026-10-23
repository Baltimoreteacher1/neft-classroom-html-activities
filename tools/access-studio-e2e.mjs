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
import { createReadStream, existsSync, statSync } from "node:fs";
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
const noise = /web-vitals|Failed to load resource|ERR_ABORTED|speechSynthesis/i;
page.on("pageerror", (e) => !noise.test(e.message) && problems.push(`pageerror: ${e.message}`));
page.on(
  "console",
  (m) => m.type() === "error" && !noise.test(m.text()) && problems.push(`console: ${m.text()}`),
);
const go = async (path) => {
  await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector("#app h1, #app h2", { timeout: 10000 });
};
const store = (key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), key);
const bodyText = () => page.locator("body").innerText();

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
await page.locator('[data-student="Period 3|River 7|6-8"]').click();
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

// ── accessibility (axe: WCAG 2.2 AA) ──────────────────────────────────────────
async function axeCheck(label) {
  if (!AxeBuilder) return;
  const res = await new AxeBuilder({ page })
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
await go(`${BASE}/speak`);
await axeCheck("speaking chooser");
await go(`${BASE}/speak/spk-seedlings-retell`);
await axeCheck("speaking task");
await go(`${BASE}/write/wrt-mulch-cer`);
await axeCheck("writing task with feedback");
await go(`${BASE}/write`);
await axeCheck("writing chooser");
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
]) {
  await go(p);
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
