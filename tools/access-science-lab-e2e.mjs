#!/usr/bin/env node
/**
 * Science Investigation Lab (/worlds/science-lab) in a real browser, at 375px and 1440px. A learner opens the hub
 * (no gate: the scene, the question and Start come first, help defaults to "Some"), switches help to "Less" (C),
 * completes all twelve stages and the independent transfer for the Grades 6-8 ice-cover case through the UI
 * (keyboard where it matters), using the illustrated scenes (hotspots, cards, ordering, the live plan preview, the
 * time-lapse runs, the bar builder), and the run asserts: feedback is
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
  ".mjs": "text/javascript",
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
    // ── the hub opens straight onto the investigation (no help gate) ───────
    await go("/worlds/science-lab?grades=6-8");
    ok(
      (await page.locator("h1").innerText()).includes("Which cover keeps ice frozen longest") &&
        !/How do you want to work/.test(await appText()),
      `${tag} the hub shows the question, with no help gate`,
    );
    ok(
      (await page.locator('.sl-hero svg[role="img"] title').count()) === 1 &&
        ((await page.locator(".sl-hero .slx-cap").textContent()) || "").length > 40,
      `${tag} the hub shows the scene with a title and a text equivalent`,
    );
    ok(
      /Start the investigation/.test(await page.locator("[data-sl-continue]").innerText()),
      `${tag} one Start button`,
    );
    ok(
      (await page
        .locator('[data-sl-support][aria-pressed="true"]')
        .getAttribute("data-sl-support")) === "B" && (await lab())?.support === "B",
      `${tag} the default help level is B (Some)`,
    );
    await audit("hub (new)");
    await axe("hub (new)");
    // A stage link renders the stage immediately.
    await go(stageUrl("claim"));
    ok(
      (await page.locator("#slf-claim-text").count()) === 1 &&
        (await page.locator("[data-sl-continue]").count()) === 0,
      `${tag} a direct stage link renders the stage immediately`,
    );
    await audit("direct stage link");
    await go("/worlds/science-lab");
    await page.locator('[data-sl-support="C"]').focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector('[data-sl-support="C"][aria-pressed="true"]');
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("[data-sl-continue]");
    ok(
      (await page
        .locator('[data-sl-support][aria-pressed="true"]')
        .getAttribute("data-sl-support")) === "C",
      `${tag} changing the help level persists across reload`,
    );

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
    ok(
      (await page.locator('.sl-scene-panel svg[role="img"] title').count()) === 1 &&
        ((await page.locator(".sl-scene-panel .slx-cap").textContent()) || "").length > 40,
      `${tag} notice: the scene has a title and a text equivalent`,
    );
    await page.locator('[data-slx-look="puddle"]').click();
    await page.waitForSelector('[data-slx-chip="n:puddle"]');
    await page.locator('[data-slx-chip="n:puddle"]').click();
    await page.waitForSelector(".slx-chip.is-n");
    ok(
      /puddle/.test(await page.locator(".slx-chip.is-n").innerText()) &&
        (await lab())?.stages?.notice?.chips?.[0]?.h === "puddle",
      `${tag} a hotspot adds an observation chip`,
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
    await page.locator('[data-slx-pick="cover"]').click();
    await page.locator('[data-slx-slot="change"]').click();
    await page.locator('[data-slx-pick="measure"]').click();
    await page.locator('[data-slx-slot="measure"]').click();
    await page.waitForFunction(
      () => document.querySelectorAll(".slx-blank.is-filled").length === 2,
    );
    ok(
      JSON.stringify((await lab())?.stages?.question?.slots) ===
        JSON.stringify({ change: "cover", measure: "measure" }),
      `${tag} question cards fill the change and measure slots`,
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
    await page.locator('[data-slx-move="wool:up"]').click();
    await page.waitForFunction(() => document.activeElement?.dataset?.slxMove?.startsWith("wool:"));
    await page.keyboard.press("Enter");
    await page.waitForFunction(() =>
      document.querySelector(".slx-order-item strong")?.textContent.includes("Wool"),
    );
    ok(
      JSON.stringify((await lab())?.stages?.hypothesis?.order) ===
        JSON.stringify(["wool", "foil", "paper"]),
      `${tag} the prediction order is saved (keyboard works)`,
    );
    await fill("slf-hypothesis-text", SAY.hypothesis);
    await check("hypothesis");
    await audit("hypothesis");
    await done("hypothesis", "/plan");

    // ── plan ────────────────────────────────────────────────────────────────
    const preview = () => page.locator("[data-sl-preview] .slx-cap").textContent();
    await page.locator('[data-sl-var="cover"][value="change"]').check();
    await page.locator('[data-sl-var="layers"][value="held"]').check();
    const byCover = await preview();
    ok(
      (await page.locator('[data-sl-preview] svg[role="img"] title').count()) >= 3 &&
        /Aluminum foil/.test(byCover) &&
        (await page.locator("[data-sl-preview] .slx-kept .is-held").count()) === 1,
      `${tag} plan: the preview draws one group per cover, a title per cup and "kept the same"`,
    );
    await page.locator('[data-sl-var="layers"][value="change"]').check();
    await page.locator('[data-sl-var="cover"][value="held"]').check();
    const byLayers = await preview();
    ok(
      byLayers !== byCover &&
        /3 layers/.test(byLayers) &&
        (await page.locator("[data-sl-preview]").getAttribute("data-slx-cols")) === "2",
      `${tag} plan: the preview changes when the changed variable changes`,
    );
    await page.locator('[data-sl-var="cover"][value="change"]').check();
    await page.locator('[data-sl-var="layers"][value="held"]').check();
    await fill("slf-plan-measure", SAY.measure);
    await fill("slf-plan-trials", "3");
    ok(
      (await page.locator("[data-sl-preview] .slx-col").first().locator("svg.slx-unit").count()) ===
        3,
      `${tag} plan: three trials show as three repeated cups`,
    );
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
    ok(
      (await page.locator('.sl-run svg[role="img"] title').count()) === 8 &&
        /Aluminum foil/.test((await page.locator(".sl-run svg desc").first().textContent()) || ""),
      `${tag} collect: every test has a scene with a title and a text equivalent`,
    );
    for (let i = 0; i < 3; i++) await page.locator("[data-sl-run]").first().click();
    await page.waitForFunction(() => document.querySelectorAll("[data-sl-result]").length === 3);
    const tableRows = await page
      .locator("[data-slx-row]")
      .evaluateAll((trs) =>
        trs.map((tr) => `${tr.dataset.slxRow}=${tr.lastElementChild.textContent.trim()}`),
      );
    ok(
      JSON.stringify(tableRows) === JSON.stringify(["r1=34", "r2=41", "r3=43"]) &&
        (await page.locator('[data-sl-result="r3"]').innerText()).includes("43 minutes") &&
        (await page.locator('[data-sl-run="r4"]').count()) === 1,
      `${tag} running a test reveals exactly that row's value and adds it to the table (${tableRows.join(" ")})`,
    );
    ok(
      (await page.locator(".slx-run-art.is-play").count()) === 1 &&
        (await page.locator(".slx-run-art.is-play .slx-still").isVisible()) &&
        !(await page.locator(".slx-run-art.is-play .slx-anim").isVisible()) &&
        (await page.evaluate(
          () => document.getAnimations().filter((a) => a.playState === "running").length,
        )) === 0,
      `${tag} reduced motion: start and end frames side by side, no running animation`,
    );
    ok(
      (await page.locator(".sl-run").nth(6).locator(".slx-trial").innerText()).includes("Trial 2"),
      `${tag} a repeated set of conditions shows as trial 2`,
    );
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
      (await page.locator('.slx-chart svg[role="img"] title').count()) === 1 &&
        (await page.locator(".slx-orders .slx-order").count()) === 2,
      `${tag} represent: the chart scene has a title, and the prediction sits beside the results`,
    );
    const setBar = async (id, v) => {
      await page.locator(`#slb-${id}`).fill(v);
      await page.locator(`#slb-${id}`).press("Tab");
      await page.waitForFunction(
        (rid) =>
          document.querySelector(`[data-slx-note="${rid}"]`)?.className.match(/is-(match|ask)/),
        id,
      );
    };
    await setBar("r1", "34");
    await setBar("r3", "44");
    await setBar("r5", "50");
    const barOf = (id) => page.locator(`.slx-bar[data-row="${id}"]`).getAttribute("data-value");
    ok(
      (await barOf("r1")) === "34" && (await barOf("r3")) === "43",
      `${tag} the chart bar for a row matches its dataset value (a close number snaps to it)`,
    );
    ok(
      (await barOf("r5")) === "50" &&
        (await page.locator('[data-slx-note="r5"]').innerText()).trim().endsWith("?") &&
        JSON.stringify((await lab())?.stages?.represent?.bars) ===
          JSON.stringify({ r1: 34, r3: 43, r5: 50 }),
      `${tag} a bar that differs from the table is pointed out as a question, and bars are saved`,
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
    ok(
      (await page.locator('.slx-argue .slx-chart svg[role="img"] title').count()) === 1 &&
        (await page.locator("[data-slx-bar^='claim:']").count()) === 3,
      `${tag} claim: the learner's own chart stays visible with a tappable bar per result`,
    );
    await page.locator('[data-slx-bar="claim:r1"]').click();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-slx-bar="claim:r1"]')?.getAttribute("aria-pressed") ===
        "true",
    );
    await page.locator('[data-slx-bar="claim:r5"]').focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelectorAll(".slx-side").length === 2);
    const sides = await page.locator(".slx-compare").innerText();
    ok(
      /Test 1/.test(sides) &&
        /Test 5/.test(sides) &&
        /34 minutes/.test(sides) &&
        /71 minutes/.test(sides) &&
        JSON.stringify((await lab())?.stages?.claim?.compare) === JSON.stringify(["r1", "r5"]),
      `${tag} claim: tapping two bars (keyboard works) puts those tests into a comparison and saves it`,
    );
    await check("claim");
    await audit("claim");
    await axe("claim");
    await done("claim", "/evidence");

    // ── evidence ────────────────────────────────────────────────────────────
    await page.locator("[data-sl-done='evidence']").click();
    ok(
      /one test/i.test(await page.locator("#slMsg").innerText()),
      `${tag} evidence asks for at least one test`,
    );
    const evBar = (id) => page.locator(`[data-slx-bar="evid:evidence:ids:${id}"]`);
    await evBar("r1").focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector('tr[data-slx-evrow="r1"].is-picked');
    ok(
      (await evBar("r1").getAttribute("aria-pressed")) === "true" &&
        (await page.locator('[data-sl-evid="evidence:ids:r1"]').isChecked()) &&
        (await page.locator('.slx-evpick .slx-bar[data-row="r1"]').getAttribute("stroke-width")) ===
          "5",
      `${tag} evidence: tapping a bar (keyboard) highlights it in the chart and the table together`,
    );
    await page.locator('[data-sl-evid="evidence:ids:r5"]').check();
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-slx-bar="evid:evidence:ids:r5"]')
          ?.getAttribute("aria-pressed") === "true",
    );
    ok(
      (await page.locator('tr[data-slx-evrow="r5"]').getAttribute("class")).includes("is-picked"),
      `${tag} evidence: choosing a table row highlights its bar on the chart`,
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
    const cer = page.locator(".slx-cer");
    const vals = await page.locator(".slx-cer-val strong").allInnerTexts();
    ok(
      (await cer.locator("[data-slx-cer-claim]").innerText()).includes(SAY.claim) &&
        JSON.stringify(vals) === JSON.stringify(["34", "71", "118"]) &&
        (await page.locator(".slx-cer .slx-fan").count()) === 2,
      `${tag} reasoning: the diagram holds the learner's claim and the chosen evidence values (${vals.join(", ")})`,
    );
    await fill("slf-reasoning-text", SAY.reasoning);
    ok(
      (await page.locator("[data-slx-cer-reason]").innerText()).includes("118 minutes for wool"),
      `${tag} reasoning: the diagram shows the learner's reasoning as they type`,
    );
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
    ok(
      (await page.locator('.slx-partner svg[role="img"] title').count()) === 1,
      `${tag} revise: an illustrated lab partner asks the counter-question`,
    );
    await fill("slf-revise-after", SAY.revised);
    ok(
      /71 minutes/.test(await page.locator(".slx-diff .is-after .slx-ins").first().innerText()) &&
        (await page.locator(".slx-diff .is-before").innerText()).includes("Wool cloth kept"),
      `${tag} revise: before and after show the changed words highlighted`,
    );
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
    ok(
      (await page.locator("[data-slx-poster-claim]").innerText()).includes(SAY.claim) &&
        (await page.locator('[data-slx-poster-chart] svg[role="img"] title').count()) === 1 &&
        /71/.test(await page.locator(".slx-poster-ev").innerText()),
      `${tag} present: the poster holds the learner's claim, chart and evidence`,
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
    const recap = page.locator(".slx-recap-strip");
    ok(
      (await recap.locator(".slx-recap-card").count()) >= 8 &&
        (await recap.locator('[data-slx-recap="claim"]').innerText()).includes("Wool cloth kept") &&
        (await recap.locator('[data-slx-recap="represent"] svg[role="img"]').count()) === 1 &&
        (await recap.locator('[data-slx-recap="hypothesis"] .slx-mini-order').count()) === 2,
      `${tag} reflect: the recap strip shows the learner's own chart, claim and prediction beside the result`,
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
    ok(
      (await page.locator('.slx-tf-scene svg[role="img"] title').count()) === 1 &&
        /cocoa/i.test(await page.locator(".slx-tf-scene .slx-cap").innerText()) &&
        (await page.locator('.slx-evpick svg.slx-chart-svg[role="img"]').count()) === 1 &&
        (await page.locator("tr[data-slx-evrow]").count()) === 4,
      `${tag} transfer: the new phenomenon's scene, chart and table are shown with help closed`,
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
        (await page.locator("[data-sl-continue]").count()) === 1 &&
          (await page.locator('.sl-hero svg[role="img"]').count()) === 1 &&
          (await page
            .locator('[data-sl-support][aria-pressed="true"]')
            .getAttribute("data-sl-support")) === "B",
        `${tag} the Grades 3-5 case opens on its scene and Start, help at B`,
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
      // The second Grades 3-5 investigation: the hub offers both cases and the new one opens on its own scene.
      await go("/worlds/science-lab?grades=3-5");
      ok(
        (await page.locator("[data-sl-cases] a").count()) === 2,
        `${tag} the Grades 3-5 hub offers both investigations`,
      );
      await page.locator('[data-sl-cases] a[href*="case=ramp-roll"]').click();
      await page.waitForFunction(() =>
        /toy car/i.test(document.querySelector(".sl-hero-q")?.textContent || ""),
      );
      ok(
        (
          await page.locator('[data-sl-cases] a[aria-current="true"]').getAttribute("href")
        ).includes("ramp-roll") && (await page.locator('.sl-hero svg[role="img"]').count()) === 1,
        `${tag} the ramp case opens on its own scene and marks itself as current`,
      );
      await audit("Grades 3-5 ramp hub");
      await axe("Grades 3-5 ramp hub");
      await go("/worlds/science-lab/notice?case=ramp-roll&grades=3-5");
      await page.waitForSelector(".slx-spot");
      ok(
        (await page.locator(".slx-spot").count()) >= 3,
        `${tag} the ramp scene has hotspots on its parts`,
      );
      await axe("Grades 3-5 ramp notice");
      // The Language Worlds page keeps four tiles and links to the lab with a card that is not a tile.
      await go("/worlds?grades=6-8");
      ok(
        (await page.locator(".world-tile").count()) === 4 &&
          (await page.locator(".sl-hub-card a").count()) === 1,
        `${tag} /worlds keeps four world tiles and one lab card`,
      );
      await axe("Language Worlds with the lab card");

      // ── with motion allowed, the latest run plays as a time-lapse ─────────
      const saved = await page.evaluate(() => JSON.stringify(localStorage));
      const moving = await browser.newContext({ viewport: { width, height: 900 } });
      await moving.addInitScript((data) => {
        if (!sessionStorage.getItem("sl-motion")) {
          for (const [k, v] of Object.entries(JSON.parse(data))) localStorage.setItem(k, v);
          sessionStorage.setItem("sl-motion", "1");
        }
      }, saved);
      const mp = await moving.newPage();
      await mp.goto(`${origin + LAB}/worlds/science-lab/collect?case=ice-cover&grades=6-8`, {
        waitUntil: "load",
      });
      await mp.waitForSelector(".slx-run-art.is-play");
      ok(
        (await mp.evaluate(
          () => document.getAnimations().filter((a) => a.playState === "running").length,
        )) > 0 && (await mp.locator(".slx-run-art.is-play .slx-anim").isVisible()),
        `${tag} with motion allowed, the latest run plays as a CSS time-lapse`,
      );
      await moving.close();
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
