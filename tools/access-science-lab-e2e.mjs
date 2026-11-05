#!/usr/bin/env node
/**
 * Science Investigation Lab (/worlds/science-lab) in a real browser, at 375px and 1440px. A learner chooses
 * "On my own", completes all twelve stages and the independent transfer for the Grades 6-8 ice-cover case through
 * the UI (keyboard where it matters), and the run asserts: the support choice comes before anything else; feedback is
 * the learner's quoted words then a question; no score, percent, level or timer text anywhere; opening help marks
 * the stage as working with help; focus moves to the new heading on every stage change; reload resumes exactly; state
 * sits under the science-lab key; the ledger gains entries that hold no learner text; the Spanish toggle renders
 * Spanish; the Grades 3-5 case opens; the Passport export carries the key; no console or page errors; no horizontal
 * overflow; axe WCAG 2.2 AA with zero violations; no timers or randomness in the lab's source.
 *
 *   node tools/access-science-lab-e2e.mjs        (serves this working tree; BASE=<url> to point elsewhere)
 *
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { createReadStream, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-science-lab-e2e: SKIP: playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn(
    "access-science-lab-e2e: axe-core/playwright is not installed; skipping axe checks.",
  );
}
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
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
const LAB = "/access-practice-lab";
const STATE_KEY = "accessPracticeLab:v1:science-lab";
const LEDGER_KEY = "accessPracticeLab:v1:ledger";
const STAGES = [
  "notice",
  "question",
  "hypothesis",
  "plan",
  "collect",
  "represent",
  "claim",
  "evidence",
  "reasoning",
  "revise",
  "present",
  "reflect",
];
/** Words the learner types. KUMQUAT must never reach the ledger. */
const SAY = {
  notice: "I notice that the wrapped cube still has ice, like a kumquat in a warm coat.",
  wonder: "I wonder which cover keeps ice frozen longest.",
  weak: "Is ice cold?",
  question: "How does the cover material change the minutes until the ice cube melts?",
  hypothesis:
    "If I change the cover from foil to wool, then the ice will last more minutes because wool keeps heat out.",
  measure: "the minutes until the ice cube is fully melted",
  steps: "Use one 20 g cube each time and the same tray.",
  sentence: "The wool bars are longer than the foil bars.",
  claim: "Wool cloth kept the ice frozen longer than aluminum foil in this test.",
  reasoning:
    "Row 5 shows 71 minutes and row 6 shows 118 minutes for wool, but row 1 shows only 34 minutes for foil, so wool slows heat more than foil.",
  revised:
    "Wool cloth kept the ice frozen longer than aluminum foil in this test, 71 minutes compared with 34 minutes.",
  talk: "My investigation tested covers on ice. Wool cloth kept the ice frozen the longest, and I can point to the rows that show it.",
  reflect: "Putting my claim into words was hardest, and the sentence starter helped.",
  tQuestion: "How does the cup type change the minutes the cocoa stays warm?",
  tClaim: "The foam cup kept the cocoa warm longer than the paper cup.",
  tReason:
    "Row t1 shows 38 minutes for foam and row t3 shows 24 minutes for paper, so foam holds heat in better than paper.",
};
const BANNED =
  /\d\s*%|\bscores?\b|\bpercent(age)?\b|\bstars?\b|\blevels?\b|\bpoints?\b|countdown|\btimers?\b|time left|time is up|\bseconds? (left|remaining)\b|puntaje|\bnivel(es)?\b/i;

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
  console.warn(`access-science-lab-e2e: SKIP: no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}

// ── source rules: no timers, clocks or randomness in the lab's screens ───────
{
  const dir = join(REPO_ROOT, "access-practice-lab/src/views");
  const files = readdirSync(dir).filter((f) => /^science-lab.*\.js$/.test(f));
  const src = files.map((f) => [f, readFileSync(join(dir, f), "utf8")]);
  const hits = (re) => src.flatMap(([f, s]) => (s.match(re) || []).map(() => f));
  const timeouts = hits(/setTimeout\s*\(/g);
  ok(
    timeouts.length === 1 &&
      timeouts[0] === "science-lab.js" &&
      /draftTimer = setTimeout/.test(src.find(([f]) => f === "science-lab.js")[1]),
    `the only setTimeout in the lab's screens is the autosave debounce (${timeouts.join(", ") || "none"})`,
  );
  ok(
    hits(/setInterval|Date\.now|new Date|performance\.now|Math\.random|requestAnimationFrame/g)
      .length === 0,
    "no interval, clock or randomness in the lab's screens",
  );
  ok(
    files.every((f) => !/teacher|dashboard/i.test(f)) && files.length >= 6,
    `lab files avoid reserved words (${files.length} files)`,
  );
}

async function runFlow(width) {
  const tag = `${width}px`;
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => {
    try {
      if (!sessionStorage.getItem("sl-e2e")) {
        localStorage.clear();
        localStorage.setItem(
          "accessPracticeLab:v1:prefs",
          JSON.stringify({ langChosen: true, band: "6-8" }),
        );
        sessionStorage.setItem("sl-e2e", "1");
      }
    } catch {}
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  const go = async (path) => {
    await page.goto(origin + LAB + path, { waitUntil: "load" });
    await page.waitForSelector("#app > :not(.boot)");
  };
  const lsGet = (key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), key);
  const lab = async () => (await lsGet(STATE_KEY))?.bands?.["6-8"]?.cases?.["ice-cover"];
  const appText = () => page.locator("#app").innerText();
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  const axe = async (label) => {
    if (!AxeBuilder) return;
    await page.evaluate(() => window.scrollTo(0, 0));
    const res = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const bad = res.violations.map(
      (v) => `${v.id}[${v.impact}](${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
    );
    ok(
      bad.length === 0,
      `${tag} axe WCAG 2.2 AA: ${label}${bad.length ? `: ${bad.slice(0, 3).join(" | ")}` : ""}`,
    );
  };
  /** Layout, text rules and target size for the screen that is open. */
  const audit = async (label) => {
    ok((await overflow()) <= 0, `${tag} no horizontal overflow: ${label}`);
    const text = await appText();
    ok(
      !BANNED.test(text),
      `${tag} no score, percent, level or timer text: ${label}${BANNED.test(text) ? ` (${text.match(BANNED)[0]})` : ""}`,
    );
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("#app button, #app a.btn, #app .sl-radio, #app .sl-check")]
        .filter((el) => el.offsetParent !== null)
        .filter((el) => el.getBoundingClientRect().height < 43.5)
        .map((el) => el.textContent.trim().slice(0, 30)),
    );
    ok(
      small.length === 0,
      `${tag} controls are at least 44px tall: ${label}${small.length ? ` (${small.slice(0, 3).join(" | ")})` : ""}`,
    );
  };
  const focusedTitle = () =>
    page
      .waitForFunction(() => document.activeElement?.id === "slTitle", null, { timeout: 5000 })
      .then(
        () => true,
        () => false,
      );
  const fill = (id, text) => page.locator(`#${id}`).fill(text);
  const check = async (stage) => {
    await page.locator(`[data-sl-check="${stage}"]`).click();
    await page.waitForSelector("[data-sl-feedback]");
    await page.waitForFunction(() => document.activeElement?.id === "slFbTitle");
  };
  /** Finish the stage and land on the next one (or the hub); focus must be on the new heading. */
  const done = async (stage, nextPath) => {
    await page.locator(`[data-sl-done="${stage}"]`).click();
    await page.waitForURL(new RegExp(`/worlds/science-lab${nextPath}(\\?|$)`));
    await page.waitForSelector("#slTitle");
    ok(await focusedTitle(), `${tag} focus moves to the heading after ${stage}`);
  };
  const stageUrl = (s) => `/worlds/science-lab/${s}`;
  const feedbackOf = () => page.locator("[data-sl-feedback]").innerText();

  try {
    // ── the help choice comes first ─────────────────────────────────────────
    await go("/worlds/science-lab?grades=6-8");
    ok(
      (await page.locator("h1").innerText()).includes("How do you want to work"),
      `${tag} the first screen asks how much help`,
    );
    ok(
      (await page.locator("[data-sl-help], .ex-help, .sl-path").count()) === 0,
      `${tag} no help and no path render before the choice`,
    );
    ok(
      (await page.locator("[data-sl-support]").count()) === 3,
      `${tag} three help choices (A, B, C)`,
    );
    ok(
      (await page.locator('[data-sl-support][aria-pressed="true"]').count()) === 0,
      `${tag} nothing is pre-selected`,
    );
    await audit("help choice");
    await axe("help choice");
    // A stage URL asks first too.
    await go(stageUrl("claim"));
    ok(
      (await page.locator("[data-sl-support]").count()) === 3 &&
        (await page.locator("#slf-claim-text").count()) === 0,
      `${tag} a stage link also asks first and shows no work yet`,
    );
    await go("/worlds/science-lab");
    await page.locator('[data-sl-support="C"]').focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector("[data-sl-continue]");

    // ── hub ─────────────────────────────────────────────────────────────────
    ok((await page.locator(".sl-path-step").count()) === 12, `${tag} the hub lists twelve steps`);
    ok(
      (await page
        .locator('[data-sl-support][aria-pressed="true"]')
        .getAttribute("data-sl-support")) === "C",
      `${tag} "On my own" (C) is the pressed choice`,
    );
    ok(
      /\/worlds\/science-lab\/notice/.test(
        await page.locator("[data-sl-continue]").getAttribute("href"),
      ),
      `${tag} Start leads to the first step`,
    );
    ok((await lab())?.support === "C", `${tag} the choice is saved as support C`);
    await audit("hub");
    await axe("hub");

    // ── notice ──────────────────────────────────────────────────────────────
    await page.locator("[data-sl-continue]").click();
    await page.waitForURL(/\/worlds\/science-lab\/notice/);
    await page.waitForSelector("#slf-notice-notice");
    ok(await focusedTitle(), `${tag} focus is on the heading when a stage opens`);
    ok((await page.locator("h1").count()) === 1, `${tag} one h1 on a stage`);
    ok(
      (await page.locator('[data-sl-mode="independent"]').count()) === 1 &&
        (await page.locator("[data-sl-help][aria-expanded='true']").count()) === 0,
      `${tag} on my own: marked on my own and every help is closed`,
    );
    await page.locator("[data-sl-done='notice']").click();
    ok(
      /notice/i.test(await page.locator("#slMsg").innerText()) && /\/notice/.test(page.url()),
      `${tag} finishing with nothing written says what is missing and does not move`,
    );
    await fill("slf-notice-notice", SAY.notice);
    await fill("slf-notice-wonder", SAY.wonder);
    await audit("notice");
    await axe("notice (on my own)");
    // Opening help (keyboard) marks the stage as working with help.
    await page.locator("[data-sl-help]").first().focus();
    await page.keyboard.press("Space");
    await page.waitForSelector("[data-sl-mode='supported']");
    ok(
      /with help/i.test(await page.locator(".sl-mode").innerText()),
      `${tag} opening help shows "Working with help"`,
    );
    ok(
      (await lab())?.helpUsed?.some((h) => h.startsWith("notice:")) === true,
      `${tag} the opened help is recorded in the saved state`,
    );
    ok(
      (await page.locator("#slf-notice-notice").inputValue()) === SAY.notice,
      `${tag} help rerender keeps what was typed`,
    );
    await axe("notice (help open)");
    await done("notice", "/question");

    // ── question: weak first, quoted words and a question back ──────────────
    ok(
      (await page.locator('[data-sl-mode="independent"]').count()) === 1,
      `${tag} help on one stage does not mark the next stage`,
    );
    await page.locator("[data-sl-done='question']").click();
    ok(
      /check/i.test(await page.locator("#slMsg").innerText()) && /\/question/.test(page.url()),
      `${tag} continuing before a check says to check first`,
    );
    await fill("slf-question-text", SAY.weak);
    await check("question");
    const q1 = await feedbackOf();
    const quote = await page.locator(".sl-feedback .sl-quote").first().innerText();
    const ask = await page.locator(".sl-feedback .sl-ask").first().innerText();
    ok(
      quote.includes("Is ice cold"),
      `${tag} feedback quotes the learner's own words (${quote.slice(0, 40)})`,
    );
    ok(ask.trim().endsWith("?"), `${tag} the note is a question: ${ask.slice(0, 50)}`);
    ok(!/\b(correct|wrong|right|good job|great)\b/i.test(q1), `${tag} feedback does not judge`);
    await audit("question feedback");
    await axe("question feedback");
    const forQuestion = async () =>
      ((await lsGet(LEDGER_KEY))?.entries || []).filter((e) => e.task === "ice-cover/question");
    const ledger1 = await forQuestion();
    ok(
      ledger1.length === 1 && ledger1[0].src === "science-lab" && ledger1[0].kind === "first",
      `${tag} the first check writes one first-attempt ledger entry (${ledger1.length})`,
    );
    await fill("slf-question-text", SAY.question);
    await page.locator("[data-sl-check='question']").click();
    await page.waitForFunction(
      () =>
        !document.querySelector(".sl-feedback .ex-change") &&
        document.activeElement?.id === "slFbTitle",
    );
    ok(
      (await forQuestion()).length === 1,
      `${tag} checking again does not add another first attempt`,
    );
    await done("question", "/hypothesis");

    // ── hypothesis ──────────────────────────────────────────────────────────
    await fill("slf-hypothesis-text", SAY.hypothesis);
    await check("hypothesis");
    await audit("hypothesis");
    await done("hypothesis", "/plan");

    // ── plan ────────────────────────────────────────────────────────────────
    await page.locator('[data-sl-var="cover"][value="change"]').check();
    await page.locator('[data-sl-var="layers"][value="held"]').check();
    await fill("slf-plan-measure", SAY.measure);
    await fill("slf-plan-trials", "3");
    await fill("slf-plan-steps", SAY.steps);
    await check("plan");
    const plan = (await lab())?.stages?.plan;
    ok(
      plan?.changed?.[0] === "cover" && plan?.held?.[0] === "layers",
      `${tag} plan choices are saved (${JSON.stringify(plan?.changed)} / ${JSON.stringify(plan?.held)})`,
    );
    await audit("plan");
    await axe("plan");
    await done("plan", "/collect");

    // ── collect: run each test, reload keeps them ───────────────────────────
    const runs = await page.locator("[data-sl-run]").count();
    ok(runs === 8, `${tag} eight tests to run (${runs})`);
    for (let i = 0; i < 3; i++) await page.locator("[data-sl-run]").first().click();
    await page.waitForFunction(() => document.querySelectorAll("[data-sl-result]").length === 3);
    ok(
      await page.evaluate(() => document.activeElement?.hasAttribute("data-sl-result")),
      `${tag} focus lands on the result just revealed`,
    );
    await page.locator("[data-sl-done='collect']").click();
    ok(
      /every test/i.test(await page.locator("#slMsg").innerText()),
      `${tag} collect asks for every test first`,
    );
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("[data-sl-result]");
    ok(
      (await page.locator("[data-sl-result]").count()) === 3 && /\/collect/.test(page.url()),
      `${tag} reload resumes on collect with the three results kept`,
    );
    ok(
      (await page.locator("[data-sl-result]").first().innerText()).includes("34 minutes"),
      `${tag} a test reveals its fixed data row`,
    );
    while ((await page.locator("[data-sl-run]").count()) > 0)
      await page.locator("[data-sl-run]").first().click();
    await audit("collect");
    await axe("collect");
    // The hub resumes at the next unfinished step.
    await page.locator("[data-sl-done='collect']").click();
    await page.waitForURL(/\/represent/);
    await go("/worlds/science-lab");
    ok(
      /\/worlds\/science-lab\/represent/.test(
        await page.locator("[data-sl-continue]").getAttribute("href"),
      ),
      `${tag} the hub resumes at the right stage (represent)`,
    );
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("[data-sl-continue]");
    ok(
      /\/represent/.test(await page.locator("[data-sl-continue]").getAttribute("href")) &&
        (await page.locator(".sl-path-step.is-done").count()) === 5,
      `${tag} reload on the hub still resumes at represent with five steps done`,
    );

    // ── represent ───────────────────────────────────────────────────────────
    await go(stageUrl("represent"));
    await page.locator("[data-sl-done='represent']").click();
    ok(
      /two results/i.test(await page.locator("#slMsg").innerText()),
      `${tag} represent asks for at least two results`,
    );
    for (const id of ["r1", "r3", "r5"])
      await page.locator(`[data-sl-evid="represent:rows:${id}"]`).check();
    await page.locator('[data-sl-format][value="bars"]').check();
    await page.waitForSelector(".sl-bars");
    ok(
      (await page.locator(".sl-bars li").count()) === 3,
      `${tag} the bar chart shows the chosen results`,
    );
    ok(
      (await page.locator(".sl-alt").innerText()).includes("34 minutes"),
      `${tag} the bar chart has a text alternative with the values`,
    );
    await audit("bar chart");
    await axe("bar chart");
    await page.locator('[data-sl-format][value="table"]').check();
    await page.waitForSelector(".sl-table");
    ok(
      (await page.locator(".sl-table tbody tr").count()) === 3,
      `${tag} the table shows the chosen results`,
    );
    await fill("slf-represent-sentence", SAY.sentence);
    await audit("table");
    await axe("table");
    await done("represent", "/claim");

    // ── claim: typed text survives a reload before any check ────────────────
    await fill("slf-claim-text", SAY.claim);
    await page.waitForFunction(() =>
      /Saved on this device\./.test(document.querySelector("[data-sl-saved]")?.textContent || ""),
    );
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("#slf-claim-text");
    ok(
      (await page.locator("#slf-claim-text").inputValue()) === SAY.claim,
      `${tag} typed words survive a reload`,
    );
    await check("claim");
    await audit("claim");
    await done("claim", "/evidence");

    // ── evidence ────────────────────────────────────────────────────────────
    await page.locator("[data-sl-done='evidence']").click();
    ok(
      /one test/i.test(await page.locator("#slMsg").innerText()),
      `${tag} evidence asks for at least one test`,
    );
    for (const id of ["r1", "r5", "r6"])
      await page.locator(`[data-sl-evid="evidence:ids:${id}"]`).check();
    ok(
      JSON.stringify((await lab())?.stages?.evidence?.ids?.sort()) ===
        JSON.stringify(["r1", "r5", "r6"]),
      `${tag} the chosen row ids are saved`,
    );
    await audit("evidence");
    await axe("evidence");
    await done("evidence", "/reasoning");

    // ── reasoning ───────────────────────────────────────────────────────────
    ok(
      (await appText()).includes("Wool cloth kept the ice"),
      `${tag} reasoning shows the learner's own claim back`,
    );
    await fill("slf-reasoning-text", SAY.reasoning);
    await check("reasoning");
    await audit("reasoning");
    await axe("reasoning");
    await done("reasoning", "/revise");

    // ── revise: earlier, a counter-question, then the new version ───────────
    ok((await page.locator(".sl-counter").count()) === 1, `${tag} revise shows a counter-question`);
    ok(
      (await page.locator(".sl-counter .sl-ask").innerText()).trim().endsWith("?"),
      `${tag} the counter-question is a question`,
    );
    ok(
      (await page.locator("#slf-revise-after").inputValue()) === SAY.claim,
      `${tag} the new version starts from the earlier words`,
    );
    await fill("slf-revise-after", SAY.revised);
    await check("revise");
    ok(
      (await page.locator(".sl-changes").count()) === 1 &&
        /71 minutes/.test(await page.locator(".sl-changes").innerText()),
      `${tag} revise shows what changed in the learner's words`,
    );
    await audit("revise");
    await axe("revise");
    await done("revise", "/present");

    // ── present ─────────────────────────────────────────────────────────────
    ok(
      (await page.locator("[data-rec-start]").count()) +
        (await page.locator(".sl-recorder, .fine").count()) >
        0,
      `${tag} recording is offered but optional`,
    );
    await fill("slf-present-transcript", SAY.talk);
    await audit("present");
    await axe("present");
    await done("present", "/reflect");

    // ── reflect ─────────────────────────────────────────────────────────────
    await page.locator("[data-sl-done='reflect']").click();
    ok(
      /one question/i.test(await page.locator("#slMsg").innerText()),
      `${tag} reflect asks for at least one answer`,
    );
    await fill("slf-reflect-answers-hard", SAY.reflect);
    ok(
      (await page.locator("[data-sl-field^='reflect:answers']").count()) >= 2,
      `${tag} reflection questions follow what the learner did`,
    );
    await audit("reflect");
    await axe("reflect");
    await done("reflect", "/transfer");

    // ── transfer: help closed, independent ──────────────────────────────────
    ok(
      (await page.locator("[data-sl-help]").count()) === 0 &&
        (await page.locator('[data-sl-mode="independent"]').count()) === 1,
      `${tag} transfer: no help to open and marked on my own`,
    );
    for (const id of ["t1", "t3"])
      await page.locator(`[data-sl-evid="transfer:evidenceIds:${id}"]`).check();
    await fill("slf-transfer-question", SAY.tQuestion);
    await fill("slf-transfer-claim", SAY.tClaim);
    await fill("slf-transfer-reasoning", SAY.tReason);
    await check("transfer");
    ok(
      (await page.locator(".sl-feedback h3").count()) === 3,
      `${tag} transfer feedback is grouped by question, claim and reasoning`,
    );
    await audit("transfer");
    await axe("transfer");
    await done("transfer", "");
    ok(
      (await page.locator(".sl-path-step.is-done").count()) === 12,
      `${tag} all twelve steps show done on the hub`,
    );
    ok(
      (await page.locator("[data-sl-continue]").count()) === 0,
      `${tag} nothing is left to continue`,
    );
    await audit("hub (finished)");

    // ── saved state, ledger, Passport ───────────────────────────────────────
    const state = await lsGet(STATE_KEY);
    const c = state?.bands?.["6-8"]?.cases?.["ice-cover"];
    ok(
      STAGES.every((s) => c?.stages?.[s]?.done === true) && c?.stages?.transfer?.done === true,
      `${tag} the state under the science-lab key marks all twelve stages and transfer done`,
    );
    ok(
      c?.stages?.question?.text === SAY.question && c?.stages?.claim?.text === SAY.claim,
      `${tag} the learner's words are saved under the key`,
    );
    ok(c?.helpUsed?.length === 1, `${tag} exactly the one opened help is recorded`);
    const ledgerRaw = await page.evaluate((k) => localStorage.getItem(k) || "", LEDGER_KEY);
    const entries = JSON.parse(ledgerRaw || '{"entries":[]}').entries.filter(
      (e) => e.src === "science-lab",
    );
    ok(
      entries.length === 11,
      `${tag} one ledger entry for each of the 11 stages that hold the learner's words (${entries.length})`,
    );
    const leaks = Object.values(SAY).filter((s) => ledgerRaw.includes(s));
    ok(
      !/kumquat|wool cloth|wrapped cube/i.test(ledgerRaw) && leaks.length === 0,
      `${tag} the ledger holds no learner text`,
    );
    ok(
      entries.every((e) => e.band === "6-8" && ["first", "revision", "transfer"].includes(e.kind)),
      `${tag} ledger entries carry ids and kinds only`,
    );
    ok(
      entries.some((e) => e.kind === "revision") &&
        entries.some((e) => e.kind === "transfer" && e.stage === "independent"),
      `${tag} a revision and an independent transfer are recorded`,
    );
    const code = await page.evaluate(() =>
      import("/access-practice-lab/src/store.js").then((m) => m.exportCode()),
    );
    const exported = JSON.parse(
      decodeURIComponent(
        escape(Buffer.from(code.replace("ACCESS1.", ""), "base64").toString("binary")),
      ),
    );
    ok(STATE_KEY in exported.data, `${tag} the Passport export contains the science-lab key`);

    if (width === 1440) {
      // ── Spanish follows the lab toggle ────────────────────────────────────
      await page.evaluate(() =>
        localStorage.setItem(
          "accessPracticeLab:v1:prefs",
          JSON.stringify({ langChosen: true, band: "6-8", lang: "es" }),
        ),
      );
      await go("/worlds/science-lab");
      ok(
        (await page.locator("h1").innerText()).includes("Laboratorio de investigación científica"),
        `${tag} the hub renders in Spanish`,
      );
      await audit("hub (Spanish)");
      await go(stageUrl("question"));
      ok(
        (await page.locator("h1").innerText()).includes("Hacer una pregunta"),
        `${tag} a stage renders in Spanish`,
      );
      await fill("slf-question-text", SAY.weak);
      await check("question");
      ok(
        /[¿áéíóúñ]/.test(await page.locator(".sl-feedback .sl-ask").first().innerText()),
        `${tag} the question back to the learner is in Spanish`,
      );
      await axe("question (Spanish)");
      await audit("question (Spanish)");
      await go(stageUrl("collect"));
      ok(/Prueba/.test(await appText()), `${tag} collect renders in Spanish`);
      await page.evaluate(() =>
        localStorage.setItem(
          "accessPracticeLab:v1:prefs",
          JSON.stringify({ langChosen: true, band: "6-8", lang: "bi" }),
        ),
      );
      await go(stageUrl("question"));
      ok(
        /Your question/.test(await appText()) && /Tu pregunta/.test(await appText()),
        `${tag} bilingual mode shows both languages`,
      );
      await axe("question (bilingual)");

      // ── Grades 3-5 case ───────────────────────────────────────────────────
      await page.evaluate(() =>
        localStorage.setItem(
          "accessPracticeLab:v1:prefs",
          JSON.stringify({ langChosen: true, band: "3-5", lang: "en" }),
        ),
      );
      await go("/worlds/science-lab?grades=3-5");
      ok(
        (await page.locator("[data-sl-support]").count()) === 3,
        `${tag} the Grades 3-5 case asks for help first`,
      );
      await page.locator('[data-sl-support="A"]').click();
      await page.waitForSelector("[data-sl-continue]");
      await page.locator("[data-sl-continue]").click();
      await page.waitForURL(/\/notice/);
      await page.waitForSelector(".sl-phenomenon");
      ok(
        (await page.locator(".sl-phenomenon").innerText()).length > 80 &&
          (await page.locator("[data-sl-help][aria-expanded='true']").count()) >= 1 &&
          (await page.locator('[data-sl-mode="supported"]').count()) === 1,
        `${tag} the Grades 3-5 case opens with its phenomenon, help open and marked as working with help`,
      );
      await audit("Grades 3-5 notice");
      await axe("Grades 3-5 notice");
      const soil = (await lsGet(STATE_KEY))?.bands?.["3-5"]?.cases?.["soil-sprout"];
      ok(soil?.support === "A", `${tag} the Grades 3-5 state is saved under its own case`);
      // The Language Worlds page keeps four tiles and links to the lab with a card that is not a tile.
      await go("/worlds?grades=6-8");
      ok(
        (await page.locator(".world-tile").count()) === 4 &&
          (await page.locator(".sl-hub-card a").count()) === 1,
        `${tag} /worlds keeps four world tiles and one lab card`,
      );
      await axe("Language Worlds with the lab card");
    }
    ok(
      errors.length === 0,
      `${tag} no console or page errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`,
    );
  } catch (error) {
    ok(false, `${tag} run aborted: ${error.message.split("\n")[0]}`);
  } finally {
    await context.close();
  }
}

try {
  await runFlow(1440);
  await runFlow(375);
} finally {
  await browser.close();
  server?.close();
}
console.log(failures.length ? `\n${failures.length} failure(s)` : "\nall checks passed");
process.exit(failures.length ? 1 : 0);
