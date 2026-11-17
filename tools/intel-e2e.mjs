#!/usr/bin/env node
/**
 * Language Intelligence Engine in a real browser, with synthetic data only (docs/part2-integration-map.md,
 * acceptance tests 2 and 4):
 *   A. Speaking Studio, typed-transcript path: the existing Language Coach still shows; "Coach my explanation" opens
 *      the loop; the feedback is grounded (every marked quote is in the learner's own words); guided practice gives a
 *      rule-based note and can be skipped; the revision box starts with the response; "what changed" names a change
 *      with a quote; the new task is a different prompt with help closed; a half-typed new task survives a reload at
 *      the same stage; the finished loop keeps response / revision / new task as three records; with no class joined
 *      the share step explains how to join; the loop and its ledger entries are saved (revision supported, new task
 *      independent).
 *   B. Spanish: the panel reads in Spanish.
 *   C. Book Studio: a book made by the existing code (no coach data in it) still opens in the reader; "Language coach
 *      for this page" starts a loop (src "book") from that page's words; the book in IndexedDB is byte-for-byte
 *      unchanged afterwards.
 *   D. Phone width: no sideways scroll with the panel open. axe on the panel.
 * BASE=<url> to point at another server. `--shots <dir>` saves screenshots.
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
  console.warn("intel-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
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
const TASK = "spk-evaporation-explain";
const SAID =
  "The open cup lost the most water. The sun was hot. The water went into the air. The covered cup lost only a little water.";
const REVISED =
  "The open cup lost the most water because the sun was hot and the water went into the air. The covered cup lost only a little water.";
const NEW_TASK = "With less light, plants make less food, so the animals that eat them have less to eat.";

let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
const browser = await chromium.launch();
const errors = [];
const settle = (page) => page.waitForTimeout(200);
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
};
async function axe(page, sel, name) {
  if (!AxeBuilder) return;
  await settle(page);
  const r = await new AxeBuilder({ page })
    .include(sel)
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(
    bad.length === 0,
    `axe: ${name} ${bad.map((v) => `${v.id}(${v.nodes.length}) ${v.nodes[0]?.target}`).join(" ")}`,
  );
}
const stage = (page) => page.locator("[data-intel-panel]").getAttribute("data-intel-stage");
const waitStage = (page, s) => page.waitForSelector(`[data-intel-panel][data-intel-stage="${s}"]`, { timeout: 10000 });
/** The newest saved loop for a source, straight from this device's storage. */
const savedLoop = (page, src) =>
  page.evaluate((s) => {
    const st = JSON.parse(localStorage.getItem("accessPracticeLab:v1:intel") || '{"loops":{}}');
    return Object.values(st.loops)
      .filter((l) => l.src === s)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
  }, src);

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  const go = async (path) => {
    await page.goto(`${origin}${LAB}/${path}`);
    await page.waitForSelector("#app h1", { timeout: 15000 });
  };

  // ── A. Speaking Studio: typed transcript → grounded feedback → revise → new task → saved and resumed ──
  await go(`speak/${TASK}?grades=6-8`);
  const taskPrompt = await page.evaluate(async (id) => {
    const t = await (await fetch("/access-practice-lab/content/studio/speaking.json")).json();
    return (t.tasks || t).find((x) => x.id === id).prompt;
  }, TASK);
  await page.locator("[data-manual-take]").first().click();
  await page.waitForSelector("[data-transcript]");
  await page.fill("[data-transcript]", SAID);
  await page.click("[data-analyze]");
  await page.waitForSelector("[data-intel-coach]");
  ok((await page.locator("#spk-coach").count()) === 1, "speak: the existing Language Coach feedback is still shown");
  ok((await page.locator("[data-intel-panel]").count()) === 0, "speak: the loop does not open until the learner asks");
  await page.click("[data-intel-coach]");
  await waitStage(page, "practice");
  await shot(page, "speak-feedback-1280");
  if (SHOTS) await page.locator("[data-intel-panel]").screenshot({ path: join(SHOTS, "panel-feedback.png") });

  const card = page.locator(".intel-fb");
  ok((await card.locator(".intel-strength p").innerText()).trim().length > 10, "feedback: one strength is named first");
  ok((await card.locator(".intel-next").count()) === 1, "feedback: exactly one next step");
  ok(/Why this helps/.test(await card.innerText()), "feedback: says why the next step helps");
  ok((await page.locator("[data-intel-uncertainty]").count()) === 0, "feedback: a typed transcript carries no recognition warning");
  const marks = await page.locator(".intel-own .intel-mark").evaluateAll((els) =>
    els.map((m) => [...m.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("")),
  );
  ok(marks.length >= 1 && marks.every((m) => SAID.includes(m)), `feedback: every marked quote is in the learner's own words (${marks.length})`);
  const own = await page.locator(".intel-fb .intel-own").evaluate((el) =>
    [...el.querySelectorAll(".intel-sr")].reduce((t, s) => t.replace(s.textContent, ""), el.textContent),
  );
  ok(own.trim() === SAID, "feedback: the learner's words are shown exactly as typed");
  let loop = await savedLoop(page, "speak");
  ok(loop?.task.id === TASK && loop.stages.response.text === SAID && loop.stages.response.source === "typed", "loop: the response is saved as typed");
  const grounded = await page.evaluate(async (l) => {
    const E = await import("/access-practice-lab/src/intel/engine.js");
    return E.isGrounded(l.stages.feedback.feedback, l.stages.response.text);
  }, loop);
  ok(grounded && loop.stages.feedback.feedbackSource === "local-rule", "loop: the saved feedback is grounded and rule-based");
  ok(!/score|level|%/i.test(await card.locator(".intel-strength, .intel-next").allInnerTexts().then((t) => t.join(" "))), "feedback: no score, level or percent");
  await axe(page, "[data-intel-panel]", "feedback card and guided practice");

  // guided practice: an empty check gives a note, a real try is checked by rule, and it can be skipped
  await page.click('[data-intel="practice-check"]');
  await page.waitForSelector(".intel-pnote");
  ok((await stage(page)) === "practice", "practice: an empty try stays on practice with a note");
  const given = await page.locator(".intel-given li").allInnerTexts();
  ok(given.length >= 1 && given.every((g) => SAID.includes(g.trim())), "practice: built from the learner's own sentences");
  await page.click('[data-intel="practice-skip"]');
  await waitStage(page, "revision");

  // revision: prefilled with the response, saved as its own record
  ok((await page.inputValue('[data-intel-field="revision"]')) === SAID, "revision: the box starts with the learner's own response");
  await page.fill('[data-intel-field="revision"]', REVISED);
  await page.click('[data-intel="revise-save"]');
  await waitStage(page, "transfer");
  const changes = Number(await page.locator("[data-intel-changes]").getAttribute("data-intel-changes"));
  const changeQuotes = await page.locator(".intel-changes .intel-now .intel-q").allInnerTexts();
  ok(changes >= 1 && changeQuotes.every((q) => REVISED.includes(q)), `revision: what changed is named with quotes from the revision (${changes})`);
  ok(changeQuotes.includes("because"), "revision: the new joining word is quoted");
  await shot(page, "speak-changes-1280");
  await page.click('[data-intel="changes-next"]');
  await page.waitForSelector('[data-intel-field="transfer"]');

  // new task: a different prompt, help closed, a draft that survives a reload at the same stage
  const newPrompt = (await page.locator("[data-intel-prompt]").innerText()).trim();
  ok(newPrompt.length > 10 && newPrompt !== taskPrompt.trim(), "new task: a different prompt from the task's own");
  ok((await page.locator("[data-intel-help]").count()) === 0, "new task: all help is closed");
  ok((await page.inputValue('[data-intel-field="transfer"]')) === "", "new task: the box starts empty");
  await page.fill('[data-intel-field="transfer"]', NEW_TASK.slice(0, 30));
  await page.reload();
  await page.waitForSelector("#app h1");
  await waitStage(page, "transfer");
  ok((await page.inputValue('[data-intel-field="transfer"]')) === NEW_TASK.slice(0, 30), "reload: the loop resumes at the new task with the half-typed words");
  ok((await page.locator("[data-intel-prompt]").innerText()).trim() === newPrompt, "reload: the same new task is shown");
  await page.fill('[data-intel-field="transfer"]', NEW_TASK);
  await page.click('[data-intel="transfer-save"]');
  await waitStage(page, "review");

  // share: no class joined on this device
  ok((await page.locator("[data-intel-noclass]").count()) === 1 && (await page.locator('[data-intel="share"]').count()) === 0, "share: with no class it explains how to join and offers no send button");
  ok((await page.locator('[data-intel-noclass] a[href*="/class"]').count()) === 1, "share: links to My class");
  await page.click('[data-intel="finish"]');
  await waitStage(page, "done");
  const records = await page.locator("[data-intel-record]").evaluateAll((els) =>
    els.map((r) => [r.dataset.intelRecord, r.querySelector("[data-intel-how]").dataset.intelHow, r.querySelector(".intel-own").textContent.trim()]),
  );
  ok(records.length === 3 && records.map((r) => r[0]).join() === "response,revision,transfer", "done: response, revision and new task are three separate records");
  ok(records[0][2] === SAID && records[1][2] === REVISED && records[2][2] === NEW_TASK, "done: each record holds its own words");
  ok(records[1][1] === "revised" && records[2][1] === "own", "done: the revision is marked after feedback and the new task on my own");
  ok((await page.locator('[data-intel-shared="no"]').count()) === 1, "done: says it was not shared");
  await shot(page, "speak-done-1280");
  await axe(page, "[data-intel-panel]", "done summary");

  loop = await savedLoop(page, "speak");
  ok(["response", "feedback", "practice", "revision", "transfer", "review"].every((s) => loop.stages[s]), "loop: every stage is saved");
  ok(loop.stages.transfer.independent === true && loop.stages.transfer.prompt === newPrompt, "loop: the new task is saved as independent with its prompt");
  ok(loop.stages.revision.supports.coach === true && loop.stages.review.shared === false, "loop: the revision is supported and nothing was shared");
  const ledger = await page.evaluate((id) => {
    const key = Object.keys(localStorage).find((k) => /ledger/.test(k) && localStorage.getItem(k).includes(id));
    return (JSON.parse(localStorage.getItem(key)).entries || []).filter((e) => e.attempt === id).map((e) => `${e.src}:${e.kind}:${e.stage}`);
  }, loop.id);
  ok(ledger.includes("intel:speak:revision:supported") && ledger.includes("intel:speak:transfer:independent"), `ledger: revision supported, new task independent (${ledger.join(" ")})`);
  ok(!ledger.includes("intel:speak:revision:independent"), "ledger: a revision is never independent");

  // a second reload still shows the finished loop
  await page.reload();
  await page.waitForSelector("#app h1");
  await waitStage(page, "done");
  ok((await page.locator("[data-intel-record]").count()) === 3, "reload: the finished loop is still there");

  // ── B. Spanish ──
  await page.evaluate(() => {
    const k = "accessPracticeLab:v1:prefs";
    localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k) || "{}"), lang: "es", langChosen: true }));
  });
  await page.reload();
  await page.waitForSelector("#app h1");
  await waitStage(page, "done");
  const es = await page.locator("[data-intel-panel]").innerText();
  ok(/Entrenador de lenguaje/.test(es) && /Primera respuesta/.test(es) && /Por mi cuenta/.test(es), "spanish: the panel reads in Spanish");
  ok(!/First response|On my own|Language coach/.test(es), "spanish: no English panel labels are left");
  await page.evaluate(() => {
    const k = "accessPracticeLab:v1:prefs";
    localStorage.setItem(k, JSON.stringify({ ...JSON.parse(localStorage.getItem(k) || "{}"), lang: "en" }));
  });

  // ── C. Book Studio: an existing book still opens, and the page coach makes a loop without touching the book ──
  await go("book-studio?grades=6-8");
  const bookId = await page.evaluate(async () => {
    const { createBookFromContent } = await import("/access-practice-lab/src/book/handoff.js");
    return createBookFromContent({
      source: { kind: "writing", id: "t1", label: "Explain" },
      title: "My Plant Book",
      pages: [{ heading: "Why plants need light", text: "Plants use light to make food. Without light, a plant cannot grow. The leaves turn yellow." }],
    });
  });
  const bookBefore = await page.evaluate(async (id) => {
    const db = await import("/access-practice-lab/src/book/db.js");
    return JSON.stringify(await db.getBook(id));
  }, bookId);
  ok(!/"intel|intelLoop|data-intel/.test(bookBefore), "book: the book was made by the existing code and holds no loop data");
  await page.goto(`${origin}${LAB}/book-studio/read/${bookId}`);
  await page.waitForSelector("[data-bk-reader] .bk-reader-title", { timeout: 15000 });
  ok((await page.locator(".bk-reader-title").innerText()).trim() === "My Plant Book", "book: an existing book still opens in the reader");
  ok((await page.locator("[data-r-book] .bk-page").count()) >= 1, "book: its pages render");
  ok(await page.locator("[data-r-coach]").isHidden(), "book: the coach is closed until asked for");
  // find the page that holds the learner's words (the cover comes first)
  for (let i = 0; i < 4; i++) {
    if (/Plants use light/.test(await page.locator("[data-r-book]").innerText())) break;
    await page.click('[data-r="next"]');
    await page.waitForTimeout(400);
  }
  await page.click('[data-r="coach"]');
  await page.waitForSelector('[data-r-coach] [data-intel-panel][data-intel-stage="practice"]', { timeout: 10000 });
  const bookLoop = await savedLoop(page, "book");
  ok(bookLoop?.task.id.startsWith(`book:${bookId}:`) && /Plants use light to make food/.test(bookLoop.stages.response.text), "book: the coach made a loop from the words on that page");
  const bookMarks = await page.locator("[data-r-coach] .intel-own .intel-mark").evaluateAll((els) =>
    els.map((m) => [...m.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("")),
  );
  ok(bookMarks.length >= 1 && bookMarks.every((m) => bookLoop.stages.response.text.includes(m)), "book: the feedback quotes the page's own words");
  ok((await page.locator('[data-r-coach] [data-intel="ai"]').count()) === 1 && bookLoop.stages.feedback.feedbackSource === "local-rule", "book: feedback came from the rules; AI is only an optional button");
  await shot(page, "book-coach-1280");
  await page.click('[data-r-coach] [data-intel="practice-skip"]');
  await page.waitForSelector('[data-r-coach] [data-intel-stage="revision"]');
  await page.fill('[data-r-coach] [data-intel-field="revision"]', "Plants use light to make food, so without light a plant cannot grow. The leaves turn yellow.");
  await page.click('[data-r-coach] [data-intel="revise-save"]');
  await page.waitForSelector('[data-r-coach] [data-intel-stage="transfer"]');
  ok((await page.locator('[data-intel-book="copy"]').count()) === 1, "book: the learner can copy their own revision");
  const bookAfter = await page.evaluate(async (id) => {
    const db = await import("/access-practice-lab/src/book/db.js");
    return JSON.stringify(await db.getBook(id));
  }, bookId);
  ok(bookAfter === bookBefore, "book: the coach did not change the book");
  await axe(page, "[data-r-coach]", "book coach");
  // reopening the reader and the coach resumes the same loop
  await page.reload();
  await page.waitForSelector("[data-bk-reader] .bk-reader-title", { timeout: 15000 });
  for (let i = 0; i < 4; i++) {
    if (/Plants use light/.test(await page.locator("[data-r-book]").innerText())) break;
    await page.click('[data-r="next"]');
    await page.waitForTimeout(400);
  }
  await page.click('[data-r="coach"]');
  await page.waitForSelector('[data-r-coach] [data-intel-stage="transfer"]');
  ok((await page.locator("[data-r-coach] [data-intel-panel]").getAttribute("data-intel-panel")) === bookLoop.id, "book: reopening the coach resumes the same loop");
  await context.close();

  // ── D. Phone width ──
  const phone = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const p2 = await phone.newPage();
  p2.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  await p2.goto(`${origin}${LAB}/speak/${TASK}?grades=6-8`);
  await p2.waitForSelector("#app h1");
  await p2.locator("[data-manual-take]").first().click();
  await p2.fill("[data-transcript]", SAID);
  await p2.click("[data-analyze]");
  await p2.click("[data-intel-coach]");
  await p2.waitForSelector('[data-intel-panel][data-intel-stage="practice"]');
  await settle(p2);
  const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(over <= 1, `phone: no sideways scroll with the panel open (${over}px)`);
  const small = await p2.locator("[data-intel-panel] button, [data-intel-panel] summary").evaluateAll((els) =>
    els.filter((b) => b.getBoundingClientRect().height < 43.5 && b.offsetParent).map((b) => `${b.textContent.trim().slice(0, 24)}:${Math.round(b.getBoundingClientRect().height)}`),
  );
  ok(small.length === 0, `phone: every panel control is at least 44px tall ${small.join(" ")}`);
  if (SHOTS) await p2.screenshot({ path: join(SHOTS, "speak-feedback-375.png"), fullPage: true });
  await phone.close();
} catch (error) {
  failures.push(`crashed: ${error.stack || error}`);
  console.log(`FAIL crashed: ${error.stack || error}`);
} finally {
  await browser.close();
  server?.close();
}
ok(errors.length === 0, `no page errors ${errors.slice(0, 3).join(" | ")}`);
console.log(failures.length ? `\nintel-e2e: ${failures.length} FAILED` : "\nintel-e2e: all passed");
process.exit(failures.length ? 1 : 0);
