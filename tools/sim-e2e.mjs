#!/usr/bin/env node
/**
 * Simulations (/simulations): the flagship mission, The City That Stopped Talking, played in a real browser along
 * two different investigation paths to two different outcomes.
 *   Path A (grades 6-8, thorough): keyboard into the first hotspot, listen without the transcript, a typed question
 *   matched on the device, an off-topic question that gets the in-role fallback, a reload in the middle that resumes
 *   in the same place, a wrong-then-right comparison, a gated topic, the decision with two cited pieces of evidence,
 *   spoken and written work on the learner's own, the outcome, a revision, the independent transfer task (no help
 *   offered), the evidence report and "Share with my teacher" (the class server is stubbed).
 *   Path B (grades 3-5, quick): listening with the transcript and a word bank (both recorded as support), a decision
 *   the collected evidence contradicts, and a different outcome.
 * Also: hotspots are real buttons reachable with Tab and at least 44px, the map keeps a locked place locked, no
 * sideways scroll at 375px, axe (when installed), and no page or console errors.
 * `--shots <dir>` saves screenshots. BASE=<url> to point elsewhere. Synthetic data only.
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
  console.warn("sim-e2e: SKIP — playwright is not installed.");
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
const MISSION = "city-that-stopped-talking";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
const browser = await chromium.launch();
const errors = [];
const watch = (page) => {
  page.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  page.on("console", (m) => {
    // A static file server has no /api and no build-time modules; those misses are the harness, not the page.
    if (m.type() === "error" && !/web-vitals|Failed to load resource/.test(m.text()))
      errors.push(m.text());
  });
};
const settle = (page) => page.waitForTimeout(200);
async function axe(page, sel, name) {
  if (!AxeBuilder) return console.log(`SKIP axe: ${name} (@axe-core/playwright is not installed)`);
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
const shot = async (page, name) => {
  if (!SHOTS) return;
  await settle(page);
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
};

// ── player helpers ───────────────────────────────────────────────────────────
const saved = (page) =>
  page.evaluate(
    (id) => JSON.parse(localStorage.getItem("accessPracticeLab:v1:sim") || "{}")[id] || null,
    MISSION,
  );
const panelText = (page) => page.locator(".sim-panel").innerText();
async function hot(page, id) {
  await page.click(`.sim-stage [data-sim-hot="${id}"]`);
  await page.waitForSelector("#simPanelH");
  await settle(page);
}
async function travel(page, scene) {
  await page.click('[data-sim-view="map"]');
  await page.waitForSelector(`[data-sim-go="${scene}"]`);
  await page.click(`[data-sim-go="${scene}"]`);
  await page.waitForFunction(
    (s) =>
      !document.querySelector(".sim-stage.is-map") && document.querySelector(`[data-sim-player]`),
    scene,
  );
  await settle(page);
}
async function ask(page, hotspot, topic, { clarify = false } = {}) {
  if (hotspot) await hot(page, hotspot);
  await page.click(`[data-sim-${clarify ? "clarify" : "ask"}="${topic}"]`);
  await settle(page);
}
async function listen(page, hotspot, evidence, { transcript = false } = {}) {
  await hot(page, hotspot);
  if (transcript) await page.click("[data-sim-transcript]");
  else await page.click(`[data-sim-play="${evidence}"]`);
  await settle(page);
  await page.click(`[data-sim-collect="${evidence}"]`);
  await settle(page);
}
async function compare(page, hotspot, relation, stronger, reason) {
  await hot(page, hotspot);
  await page.check(`[name="sim-rel"][value="${relation}"]`);
  await page.check(`[name="sim-strong"][value="${stronger}"]`);
  await page.fill("[data-sim-reason]", reason);
  await page.click("[data-sim-compare]");
  await settle(page);
}
async function decide(page, hotspot, option, cited, { confirm = false } = {}) {
  await hot(page, hotspot);
  await page.check(`[name="sim-opt"][value="${option}"]`);
  for (const id of cited) await page.check(`[data-sim-cite="${id}"]`);
  await page.click("[data-sim-decide]");
  if (confirm) await page.click('[data-sim-decide][data-sure="1"]');
  await settle(page);
}
async function write(page, hotspot, task, text) {
  await hot(page, hotspot);
  await page.fill(`[data-sim-text="${task}"]`, text);
  await page.click(`[data-sim-submit="${task}"]`);
  await page.waitForSelector(".sim-work");
  await settle(page);
}
async function open(page, band) {
  await page.goto(`${origin}${LAB}/simulations/${MISSION}?grades=${band}`);
  await page.waitForSelector("[data-sim-player] h1", { timeout: 15000 });
  await settle(page);
}

const BRIEF =
  "At six o'clock an automatic update changed the relay channel from seven to seventeen. Because phones still use channel seven, messages leave but never arrive. The system log shows this, and the channel test shows it too.";
const RECOMMEND =
  "I recommend that the city set the relay back to channel seven. The evidence shows the channel changed at six, because the log recorded it. For example, the test message on channel seven did not arrive three times. Some people think the storm broke the tower. However, the inspection sheet says the antenna is whole.";
const REVISED = `${RECOMMEND} The strongest evidence is the relay log because it was recorded at the moment the messages stopped.`;
const TRANSFER =
  "The most likely cause is the new bell file, because the speakers went silent at eight, exactly when the file was loaded. The gym speaker runs on an older box and still works, so rain is unlikely. Loading the old file again would make me more sure.";

try {
  // ── Path A: grades 6-8, thorough ───────────────────────────────────────────
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  watch(page);

  await page.goto(`${origin}${LAB}/simulations?grades=6-8`);
  await page.waitForSelector(".sim-hub h1", { timeout: 15000 });
  ok((await page.locator(".sim-card").count()) >= 1, "hub lists the flagship mission");
  ok((await page.locator(".sim-card .sim-art").count()) >= 1, "the mission card has its scene art");
  await page.click(".sim-teach summary");
  ok(
    (await page.locator("#simAssignLink").innerText()).endsWith(`/simulations/${MISSION}`),
    "the teacher fold gives the assignable link",
  );
  await axe(page, ".sim-hub", "hub");
  await shot(page, "hub-1280");
  await page.click(`.sim-card[href*="${MISSION}"]`);
  await page.waitForSelector("[data-sim-player] h1");
  await settle(page);
  ok(
    (await page.locator("[data-sim-player] h1").innerText()).includes(
      "The City That Stopped Talking",
    ),
    "the flagship opens in the player",
  );
  ok((await page.locator(".sim-acts li").count()) === 5, "five acts are shown");

  // Hotspots: real buttons, Tab-reachable in order, 44px, labelled, and the label shows on focus.
  const hots = await page.$$eval(".sim-stage .sim-hot", (els) =>
    els.map((el) => ({
      id: el.dataset.simHot,
      tag: el.tagName,
      tab: el.tabIndex,
      label: el.getAttribute("aria-label") || "",
      w: el.getBoundingClientRect().width,
      h: el.getBoundingClientRect().height,
    })),
  );
  ok(
    hots.length >= 5 && hots.every((x) => x.tag === "BUTTON" && x.tab === 0 && x.label.length > 5),
    `hotspots are labelled buttons (${hots.length})`,
  );
  ok(
    hots.every((x) => x.w >= 44 && x.h >= 44),
    "hotspots are at least 44px",
  );
  await page.focus("#simSceneH");
  const tabbed = [];
  for (let i = 0; i < hots.length; i++) {
    await page.keyboard.press("Tab");
    tabbed.push(await page.evaluate(() => document.activeElement?.dataset?.simHot || ""));
  }
  ok(
    JSON.stringify(tabbed) === JSON.stringify(hots.map((x) => x.id)),
    `Tab reaches every hotspot in order (${tabbed.join(",")})`,
  );
  await page.focus('.sim-stage [data-sim-hot="loudspeaker"]');
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  ok(
    (await page.evaluate(
      () => getComputedStyle(document.activeElement.querySelector(".sim-hot-tip")).display,
    )) === "block",
    "a focused hotspot shows its label",
  );
  ok(
    (await page.locator(".sim-hotlist [data-sim-hot]").count()) === hots.length,
    "the same actions are listed as text under the picture",
  );
  await axe(page, "[data-sim-player]", "player scene");
  await shot(page, "scene-1280");

  // Listening: opened with the keyboard, played, added without the transcript.
  await page.keyboard.press("Enter");
  await page.waitForSelector('[data-sim-play="first-report"]');
  await page.click('[data-sim-collect="first-report"]', { force: true });
  ok(
    !(await saved(page))?.evidence?.["first-report"],
    "a message cannot be added before it is played or read",
  );
  await page.click('[data-sim-play="first-report"]');
  await settle(page);
  await page.click('[data-sim-collect="first-report"]');
  await settle(page);
  ok(
    (await saved(page)).evidence["first-report"].supported === false,
    "listening without the transcript is recorded as unsupported",
  );
  await page.click('.sim-hotlist [data-sim-hot="board"]');
  await settle(page);
  ok(
    Boolean((await saved(page)).evidence["notice-board"]),
    "the list under the picture opens the same evidence",
  );

  // Dialogue: a suggested question, a clarification, a typed question, an off-topic question.
  await ask(page, "okafor", "what-happened");
  ok(
    (await panelText(page)).includes("four neighborhoods"),
    "the coordinator answers from her authored topic",
  );
  await ask(page, "", "what-happened", { clarify: true });
  ok(
    (await panelText(page)).includes("delivery problem"),
    "a clarification question gets its own answer",
  );
  await page.fill("[data-sim-question]", "Which places should I look at first?");
  await page.click("[data-sim-send]");
  await settle(page);
  ok(
    (await panelText(page)).includes("Nobody knows all of it"),
    "a typed question is matched to the nearest authored topic",
  );
  await page.fill("[data-sim-question]", "What is your favorite pizza topping?");
  await page.keyboard.press("Enter");
  // Against a deployed site the helper is really asked (the character "thinks" for up to AI_TIMEOUT_MS = 4 s).
  await page.waitForSelector("[data-sim-thinking]", { state: "detached", timeout: 6000 });
  await settle(page);
  ok(
    (await panelText(page)).includes("I cannot help with that one"),
    "an off-topic question gets the in-role fallback",
  );
  ok(
    !(await panelText(page)).includes("Is the Emergency Operations Room ready"),
    "a gated topic is not offered yet",
  );
  await shot(page, "dialogue-1280");
  await axe(page, ".sim-panel", "dialogue panel");

  await decide(page, "clipboard", "citywide", ["notice-board"]);
  ok((await saved(page)).act === 1, "naming the problem with evidence finishes act 1");

  await page.click('[data-sim-view="map"]');
  await page.waitForSelector(".sim-stage.is-map");
  ok(
    (await page.getAttribute('[data-sim-go="ops"]', "aria-disabled")) === "true",
    "the Emergency Operations Room is locked on the map",
  );
  await page.click('[data-sim-go="ops"]', { force: true });
  await settle(page);
  ok((await saved(page)).scene === "square", "a locked place cannot be entered");
  await axe(page, "[data-sim-player]", "map");
  await shot(page, "map-1280");
  await page.click('[data-sim-go="comms"]');
  await settle(page);
  for (const id of ["terminal", "chart", "sheet"]) await hot(page, id);
  await ask(page, "nair", "changed");
  await ask(page, "", "changed", { clarify: true });
  const before = await saved(page);

  // Reload in the middle of the mission.
  await page.reload();
  await page.waitForSelector("[data-sim-player] h1");
  await settle(page);
  const after = await saved(page);
  ok(
    (await page.locator("#simSceneH").innerText()).includes("Communication Center"),
    "after a reload the learner is in the same place",
  );
  ok(
    JSON.stringify(after) === JSON.stringify(before) && Object.keys(after.evidence).length === 7,
    "after a reload the notebook, dialogue memory and act are intact",
  );
  await page.click("[data-sim-journal]");
  await settle(page);
  ok(
    (await page.locator(".sim-notebook li").count()) === 7,
    "the journal lists the evidence collected before the reload",
  );
  ok(
    (await panelText(page)).includes("may not fit together"),
    "the journal raises an open question about conflicting evidence",
  );
  await shot(page, "journal-1280");

  // Compare: wrong first, then right.
  await compare(page, "whiteboard", "agree", "no-change", "they both talk about the center");
  ok(
    (await panelText(page)).includes("Not settled yet") &&
      !(await saved(page)).tasks["compare-change"].resolved,
    "a wrong comparison gets a question to think about, not the answer",
  );
  await compare(
    page,
    "whiteboard",
    "conflict",
    "system-log",
    "the log was recorded at six but she only remembers",
  );
  ok(
    (await saved(page)).tasks["compare-change"].resolved === true,
    "the conflict is settled on the second try",
  );
  await shot(page, "compare-1280");

  await travel(page, "lab");
  await hot(page, "li");
  ok(
    (await page.locator('[data-sim-ask="run-test"]').count()) === 1,
    "the scientist's test topic opens once the log is in the notebook",
  );
  await ask(page, "", "run-test");
  ok(
    Boolean((await saved(page)).evidence["channel-test"]) && (await saved(page)).act === 2,
    "the test result is evidence and act 2 is finished",
  );

  await travel(page, "ops");
  await hot(page, "plans");
  await decide(page, "decision", "reset-relay", ["system-log", "channel-test"], { confirm: true });
  ok(
    (await saved(page)).decision?.option === "reset-relay",
    "the decision is recorded with its cited evidence",
  );
  await write(page, "microphone", "brief", BRIEF);
  ok(
    (await page.locator(".sim-fb").count()) === 1,
    "the spoken explanation gets feedback from the shared engine",
  );
  ok(
    (await saved(page)).tasks.brief.supported === false,
    "work with no help opened is recorded as independent",
  );
  await write(page, "form", "recommend", RECOMMEND);
  await shot(page, "feedback-1280");
  await page.click("[data-sim-outcome]");
  await settle(page);
  ok(
    (await panelText(page)).includes("The city finds its voice"),
    "path A reaches the outcome: the city finds its voice",
  );
  ok((await panelText(page)).includes("not a grade"), "the outcome says it is not a grade");
  await shot(page, "outcome-a-1280");
  await page.click("[data-sim-continue]");
  await settle(page);

  // Revise (prefilled with the first version), then the transfer task with help closed.
  await hot(page, "revise");
  ok(
    (await page.inputValue('[data-sim-text="revise-recommend"]')) === RECOMMEND,
    "the revision starts from the first version",
  );
  await page.click('[data-sim-submit="revise-recommend"]');
  await settle(page);
  ok(
    (await panelText(page)).includes("Change at least one thing"),
    "an unchanged revision is not accepted",
  );
  await write(page, "revise", "revise-recommend", REVISED);
  ok(
    (await saved(page)).tasks["revise-recommend"].supported === true,
    "a revision after feedback is recorded as supported",
  );
  await hot(page, "new-call");
  ok(
    (await page.locator("[data-sim-help]").count()) === 0,
    "the transfer task offers no word bank or frames",
  );
  await write(page, "new-call", "river-school", TRANSFER);
  await page.click("[data-sim-finish]");
  await settle(page);
  ok(
    (await panelText(page)).includes("Mission complete") && (await saved(page)).complete === true,
    "path A: the mission is complete",
  );

  const stores = await page.evaluate(() => ({
    intel: JSON.parse(localStorage.getItem("accessPracticeLab:v1:intel") || "{}"),
    ledger: Object.keys(localStorage)
      .filter((k) => /ledger/i.test(k))
      .map((k) => localStorage.getItem(k))
      .join(""),
  }));
  const loops = Object.values(stores.intel.loops || {}).filter((l) => l.src === "sim");
  const written = loops.find((l) => l.task.id.endsWith(":recommend"));
  ok(
    loops.length === 2 && loops.every((l) => l.objective === "explain-with-evidence"),
    "spoken and written work are loops with src sim",
  );
  ok(
    Boolean(
      written?.stages.response &&
        written.stages.feedback &&
        written.stages.revision &&
        written.stages.transfer?.independent,
    ),
    "the written loop holds response, feedback, revision and an independent transfer",
  );
  ok(/intel:sim/.test(stores.ledger), "the work is in the evidence ledger");

  // Evidence report and share (the class server is stubbed; the link is synthetic).
  await page.route("**/api/class/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        route.request().url().includes("review/share") ? { ok: true, workId: "w1" } : { ok: false },
      ),
    }),
  );
  let sharedText = "";
  page.on("request", (req) => {
    if (req.url().includes("review/share"))
      sharedText = JSON.parse(req.postData() || "{}").text || "";
  });
  await page.evaluate(() =>
    localStorage.setItem(
      "accessPracticeLabClass:v1:link",
      JSON.stringify({
        code: "ABC234",
        studentId: "s0123456789",
        studentKey: "ABCDEFGH",
        alias: "Test",
      }),
    ),
  );
  await page.goto(`${origin}${LAB}/simulations/${MISSION}/report?grades=6-8`);
  await page.waitForSelector(".sim-report");
  const report = await page.locator(".sim-report").innerText();
  ok(
    /SPOKEN EXPLANATION \[on my own\]/.test(report) &&
      /WRITTEN RECOMMENDATION \[on my own\]/.test(report),
    "the report labels independent work",
  );
  ok(
    /REVISION \(after feedback, counted as supported\)/.test(report) &&
      /NEW PROBLEM, TRANSFER \[on my own, help closed\]/.test(report),
    "the report keeps the revision and the transfer apart",
  );
  ok(
    /DECISION:/.test(report) &&
      /EVIDENCE CITED: .*Relay system log/.test(report) &&
      /PATH TAKEN: City Square > Communication Center/.test(report),
    "the report shows the path, the decision and the cited evidence",
  );
  await shot(page, "report-1280");
  await page.click("[data-simv-share]");
  await page.waitForSelector(".sim-report-page .feedback.is-right");
  ok(
    sharedText.includes("STORY OUTCOME") && sharedText.includes("channel seven"),
    "Share sends the evidence report to the class review queue",
  );
  await context.close();

  // ── Path B: grades 3-5, quick, with supports, a decision the evidence contradicts ──
  const contextB = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pb = await contextB.newPage();
  watch(pb);
  await open(pb, "3-5");
  await listen(pb, "loudspeaker", "first-report", { transcript: true });
  ok(
    (await saved(pb)).evidence["first-report"].supported === true,
    "path B: listening with the transcript open is recorded as supported",
  );
  await hot(pb, "board");
  await ask(pb, "okafor", "your-job");
  await decide(pb, "clipboard", "one-street", ["notice-board"]);
  ok(
    (await panelText(pb)).includes("I will note your idea"),
    "path B: another reading of the problem gets a respectful reply",
  );
  await ask(pb, "haddad", "last-night");
  await hot(pb, "sign");
  await travel(pb, "newsroom");
  await hot(pb, "draft");
  await hot(pb, "poster");
  await listen(pb, "machine", "voicemail");
  await ask(pb, "rivas", "crowd");
  await compare(pb, "desk-time", "conflict", "voicemail", "the voicemail was recorded at 5:58");
  ok((await saved(pb)).act === 2, "path B: a different route also finishes the investigation");
  await travel(pb, "ops");
  await decide(pb, "decision", "fix-tower", ["bent-sign", "storm-memory"], { confirm: true });
  await hot(pb, "microphone");
  await pb.click('[data-sim-help="bank"]');
  await settle(pb);
  ok(
    (await pb.locator(".sim-bank li").count()) >= 3,
    "path B: the word bank opens when the learner asks for it",
  );
  await write(
    pb,
    "microphone",
    "brief",
    "The storm hit the tower at midnight so the messages stopped. The bent sign shows the wind was strong.",
  );
  ok(
    (await saved(pb)).tasks.brief.supported === true,
    "path B: work done with the word bank is recorded as supported",
  );
  await write(
    pb,
    "form",
    "recommend",
    "I recommend that the city send the repair crew up the tower because the storm was strong. The bent sign and Mr. Haddad both show the storm. Another idea is weaker.",
  );
  await pb.click("[data-sim-outcome]");
  await settle(pb);
  ok(
    (await panelText(pb)).includes("A long climb up Harbor Hill"),
    "path B reaches a different outcome: a long climb up Harbor Hill",
  );
  ok((await saved(pb)).outcome === "tower-climb", "path B: the saved outcome differs from path A");
  await shot(pb, "outcome-b-1280");
  await pb.goto(`${origin}${LAB}/simulations/${MISSION}/report?grades=3-5`);
  await pb.waitForSelector(".sim-report");
  const reportB = await pb.locator(".sim-report").innerText();
  ok(
    /with supports: word bank/.test(reportB) && /listened with the transcript open/.test(reportB),
    "path B: the report says which work used supports",
  );
  await pb.goto(`${origin}${LAB}/simulations?grades=3-5`);
  await pb.waitForSelector(".sim-card");
  ok(
    (await pb.locator(".sim-card").first().innerText()).includes("Continue"),
    "the hub offers to continue a mission in progress",
  );
  await contextB.close();

  // ── an experience that does not exist, and the hub card on Adventure Worlds ──
  const contextC = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const pc = await contextC.newPage();
  pc.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  await pc.goto(`${origin}${LAB}/simulations/x/x-missing?grades=6-8`);
  await pc.waitForSelector(".sim-problem");
  ok(
    (await pc.locator(".sim-problem").innerText()).length > 20,
    "a compiled experience that cannot be loaded shows a clear message",
  );
  await pc.goto(`${origin}${LAB}/adventures?grades=6-8`);
  await pc.waitForSelector("#app h1");
  ok(
    (await pc.locator(`a[href*="/simulations"]`).count()) >= 1,
    "Adventure Worlds links to the simulations",
  );
  await contextC.close();

  // ── Phone, 375px ───────────────────────────────────────────────────────────
  const phone = await browser.newContext({
    viewport: { width: 375, height: 760 },
    isMobile: true,
    hasTouch: true,
  });
  const pp = await phone.newPage();
  watch(pp);
  const noScroll = async (name) => {
    await settle(pp);
    const over = await pp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 1, `375px: ${name} has no sideways scroll (${over}px)`);
    if (SHOTS) await pp.screenshot({ path: join(SHOTS, `${name}-375.png`), fullPage: true });
  };
  await pp.goto(`${origin}${LAB}/simulations?grades=6-8`);
  await pp.waitForSelector(".sim-card");
  await noScroll("hub");
  await open(pp, "6-8");
  await noScroll("scene");
  const small = await pp.$$eval(
    ".sim-stage .sim-hot",
    (els) =>
      els
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width < 44 || r.height < 44 || r.left < 0 || r.right > window.innerWidth)
        .length,
  );
  ok(small === 0, "375px: every hotspot is at least 44px and inside the screen");
  const overlaps = await pp.$$eval(".sim-stage .sim-hot", (els) => {
    const r = els.map((el) => el.getBoundingClientRect());
    let n = 0;
    for (let i = 0; i < r.length; i++)
      for (let j = i + 1; j < r.length; j++)
        if (
          r[i].left < r[j].right &&
          r[j].left < r[i].right &&
          r[i].top < r[j].bottom &&
          r[j].top < r[i].bottom
        )
          n++;
    return n;
  });
  ok(overlaps === 0, `375px: no two hotspots overlap (${overlaps})`);
  await pp.tap('.sim-stage [data-sim-hot="okafor"]');
  await pp.waitForSelector("[data-sim-ask]");
  await noScroll("dialogue");
  await pp.tap('[data-sim-view="map"]');
  await pp.waitForSelector(".sim-stage.is-map");
  await noScroll("map");
  await pp.tap("[data-sim-journal]");
  await noScroll("journal");
  await phone.close();
} catch (error) {
  failures.push(`crashed: ${error.stack || error}`);
  console.log(`FAIL crashed: ${error.stack || error}`);
} finally {
  await browser.close();
  server?.close();
}
ok(errors.length === 0, `no page or console errors ${errors.slice(0, 3).join(" | ")}`);
console.log(failures.length ? `\nsim-e2e: ${failures.length} FAILED` : "\nsim-e2e: all passed");
process.exit(failures.length ? 1 : 0);
