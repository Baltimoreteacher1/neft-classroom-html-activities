#!/usr/bin/env node
/**
 * Connected Pathways (/pathways) in a real browser, synthetic data only.
 *
 * REALLY DRIVEN: the hub; the reference pathway; stage 1 followed into a real ACCESS Reading activity (the banner
 * shows there; coming back without answering completes nothing; answering it correctly does); the Book Studio
 * hand-off (a real book is created and the editor opens); the independent transfer stage done in place with the
 * feedback loop panel; the family conversation card; reload and hub consistency; the Family hub card; the share
 * packet (the class endpoint is intercepted: there is no class server behind a static file server); the builder
 * (reorder, search, add, optional, supports, reject a suggestion, title), "assign" to a class through the settings
 * API (intercepted), preview, opening the assigned custom link as a student; Spanish; 375px; axe.
 *
 * SEEDED (work that belongs to other workers' features, written through the SAME stores those features use):
 * the Speaking Studio take (a ledger entry src "speaking"), the simulation (a finished save under
 * accessPracticeLab:v1:sim plus its loop with src "sim"), and the learner's second save of the book (the editor's
 * own autosave is Book Studio's to test; here the stored book is saved again through src/book/db.js).
 *
 * `--shots <dir>` saves screenshots. BASE=<url> to point elsewhere.
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
  console.warn("pathways-e2e: SKIP — playwright is not installed.");
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
const PW = "explain-with-evidence";
const WORDS =
  "Plants need light because the window plant grew to 14 cm and the closet plant only grew to 6 cm.";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
const browser = await chromium.launch();
const errors = [];
const consoleErrors = [];
const watch = (page) => {
  page.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  // A static file server has no /api and no service worker: a failed fetch of those is the harness, not the page.
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/Failed to load resource|web-vitals|favicon/.test(m.text()) &&
      consoleErrors.push(m.text().slice(0, 200)),
  );
};
const settle = async (page) => {
  await page.waitForFunction(
    () => !document.querySelector(".is-entering") && !document.querySelector("#app[aria-busy]"),
  );
  await page.waitForTimeout(200);
};
const open = async (page, path, sel = "#app h1") => {
  await page.goto(`${origin}${LAB}${path}`);
  await page.waitForSelector(sel);
  await settle(page);
};
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const stageState = (page, n) =>
  page
    .locator(`#pwStage${n}`)
    .evaluate((el) =>
      el.classList.contains("is-done")
        ? "done"
        : el.classList.contains("is-next")
          ? "next"
          : "later",
    );
const states = async (page) => Promise.all([1, 2, 3, 4, 5, 6].map((n) => stageState(page, n)));
const shot = async (page, name) =>
  SHOTS && (await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true }));
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

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  // No class server behind the static file server: class calls answer "offline" unless a step below takes them over.
  await context.route("**/api/class/**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"ok":false,"error":"offline"}',
    }),
  );
  const page = await context.newPage();
  watch(page);

  // ── hub ──────────────────────────────────────────────────────────────────────────────────────────────────
  await open(page, "/pathways?grades=6-8");
  ok(
    (await page.locator("#app h1").innerText()).includes("Connected Pathways"),
    "hub: opens with its heading",
  );
  ok((await page.locator(".pw-card").count()) >= 3, "hub: at least three built-in pathways");
  ok((await page.locator(".pw-resume").count()) === 0, "hub: nothing to resume on a fresh device");
  ok(
    (await page.locator('.pw-teach a[href*="/pathways/build"]').count()) === 1,
    "hub: a labelled For teachers entry to the builder",
  );
  await shot(page, "hub");

  // ── the reference pathway ────────────────────────────────────────────────────────────────────────────────
  await page.click(`.pw-card a[href*="/pathways/${PW}"]`);
  await page.waitForSelector(".pw-ladder");
  await settle(page);
  ok(
    (await page.locator("#app h1").innerText()) === "Explain an idea using evidence",
    "runner: the reference pathway opens from the hub",
  );
  ok((await page.locator(".pw-stage").count()) === 6, "runner: six stages");
  ok(
    (await page.locator(".pw-goal").innerText()).includes(
      "I can explain an idea and point to the evidence",
    ),
    "runner: the objective in student language",
  );
  const features = await page.locator(".pw-stage-meta > span:first-child").allInnerTexts();
  ok(
    /ACCESS Practice Lab/.test(features[0]) &&
      /Speaking Studio/.test(features[1]) &&
      /Living Simulation/.test(features[2]) &&
      /Book Studio/.test(features[3]) &&
      /On my own/.test(features[4]) &&
      /With my family/.test(features[5]),
    `runner: stages in the required order (${features.join(" | ")})`,
  );
  ok(
    (await page.locator(".pw-why").count()) === 6 &&
      (await page.locator(".pw-why").allInnerTexts()).every((t) =>
        t.includes("Goal: Explain an idea using evidence"),
      ),
    "runner: every stage says how it serves the shared goal",
  );
  ok(
    (await states(page)).join() === "next,later,later,later,later,later",
    "runner: a fresh pathway has step 1 next and nothing done",
  );
  ok(
    (await page.locator(".pw-count").innerText()).includes("0 of 5 steps done"),
    "runner: 0 of 5 required steps",
  );
  ok(
    (await page.locator(".pw-reco-why").innerText()).includes("not enough evidence yet"),
    "runner: with no work it says there is not enough evidence yet",
  );
  ok(
    (await page.locator("[data-pw-help]").count()) === 4 &&
      (await page.locator('[data-pw-help][aria-expanded="true"]').count()) === 0,
    "transfer: four helps offered, all closed by default",
  );
  ok(
    (await page.locator("[data-pw-share]").count()) === 0 &&
      (await page.locator('.pw-share a[href*="/class"]').count()) === 1,
    "share: without a class it offers to join one, and sends nothing",
  );
  await axe(page, ".pw-run", "runner");
  await shot(page, "runner-start");

  // ── stage 1: a real ACCESS activity, with the banner; a visit alone completes nothing ─────────────────────
  await page.click("#pwStage1 a.btn");
  await page.waitForSelector(".activity");
  await settle(page);
  const actUrl = new URL(page.url());
  ok(
    actUrl.pathname === `${LAB}/Reading/B/read-best-evidence` &&
      actUrl.searchParams.get("pw") === PW &&
      actUrl.searchParams.get("st") === "rread-best-evidence",
    `stage 1: opens the real Reading activity with the pathway context (${actUrl.pathname}${actUrl.search})`,
  );
  const banner = await page.locator(".pw-banner").innerText();
  ok(
    /Step 1 of 6/.test(banner) &&
      /Goal: Explain an idea using evidence/.test(banner) &&
      /Back to my pathway/.test(banner),
    `banner: shows on the activity (${banner.replace(/\s+/g, " ")})`,
  );
  await page.click(".pw-banner-back");
  await page.waitForSelector(".pw-ladder");
  await settle(page);
  ok(
    (await stageState(page, 1)) === "next",
    "stage 1: opening the activity and coming back does NOT complete it",
  );
  await page.click("#pwStage1 a.btn");
  await page.waitForSelector(".activity .answer-zone");
  await page.locator('.answer-zone label:has(input[type=radio][value="a"])').click();
  await page.locator("[data-check]").click();
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem("accessPracticeLab:v1:Reading:B") || "{}").complete?.includes(
      "read-best-evidence",
    ),
  );
  ok(true, "stage 1: the activity itself saved a correct answer");
  ok((await page.locator(".pw-banner").count()) === 1, "banner: still there after answering");
  await page.click(".pw-banner-back");
  await page.waitForSelector(".pw-ladder");
  await settle(page);
  ok(
    (await states(page)).join() === "done,next,later,later,later,later",
    "stage 1: done because the activity recorded it; step 2 is next",
  );
  ok(
    /on my own/.test(await page.locator("#pwStage1 .pw-evidence").innerText()),
    "stage 1: evidence says it was done on my own",
  );

  // ── stages 2 and 3: SEEDED through the stores Speaking Studio and the simulation write ────────────────────
  await page.click("#pwStage2 a.btn");
  await page.waitForSelector("#app h1");
  await settle(page);
  ok(
    new URL(page.url()).pathname === `${LAB}/speak/spk-evaporation-explain` &&
      new URL(page.url()).searchParams.get("pw") === PW,
    "stage 2: the link opens the real Speaking Studio task with the pathway context",
  );
  await page.goBack();
  await page.waitForSelector(".pw-ladder");
  await settle(page);
  ok(
    (await stageState(page, 2)) === "next",
    "stage 2: visiting Speaking Studio does not complete it",
  );
  await page.click("#pwStage3 a.btn");
  await page.waitForSelector("#app h1");
  await settle(page);
  ok(
    new URL(page.url()).pathname === `${LAB}/simulations/city-that-stopped-talking` &&
      (await page.locator(".error-panel").count()) === 0,
    "stage 3: the link opens the real simulation route",
  );
  await page.goBack();
  await page.waitForSelector(".pw-ladder");
  await settle(page);
  ok(
    (await stageState(page, 3)) !== "done",
    "stage 3: opening the simulation does not complete it",
  );
  const simViewExists = existsSync(join(REPO_ROOT, "access-practice-lab/src/views/simulations.js"));
  await page.evaluate(async () => {
    const L = await import("/access-practice-lab/src/lang/ledger.js");
    const book = L.loadLedger();
    L.appendEntry(book, {
      src: "speaking",
      task: "spk-evaporation-explain",
      band: "6-8",
      domain: "Speaking",
      use: "Explain",
      stage: "supported",
      supports: { frames: true },
      m: { words: 42, cites: 1, link: 2, academic: 2 },
    });
    L.saveLedger(book);
    const I = await import("/access-practice-lab/src/intel/loop.js");
    const state = I.loadIntel();
    const loop = I.startLoop(state, {
      src: "sim",
      band: "6-8",
      objective: "explain-with-evidence",
      task: {
        id: "city:convince-mayor",
        title: "Convince the mayor",
        keyUse: "Explain",
        domain: "Speaking",
      },
    });
    I.recordStage(
      state,
      loop.id,
      "response",
      {
        text: "The pump log shows the water stopped at noon, so the signal failed before the storm.",
        source: "typed",
        supports: {},
      },
      { metrics: { words: 16, cites: 1, link: 1 } },
    );
    I.saveIntel(state);
    const saves = JSON.parse(localStorage.getItem("accessPracticeLab:v1:sim") || "{}");
    saves["city-that-stopped-talking"] = {
      ...(saves["city-that-stopped-talking"] || {
        v: 1,
        mission: "city-that-stopped-talking",
        step: 40,
      }),
      outcome: "seeded-ending",
      complete: true,
    };
    localStorage.setItem("accessPracticeLab:v1:sim", JSON.stringify(saves));
  });
  await page.reload();
  await page.waitForSelector(".pw-ladder");
  await settle(page);
  ok(
    (await states(page)).join() === "done,done,done,next,later,later",
    "stages 2-3 (seeded ledger + finished simulation save): done; Book Studio is next",
  );
  ok(
    /with help: sentence starters/.test(await page.locator("#pwStage2 .pw-evidence").innerText()),
    "stage 2: supported work is shown as with help, naming the help",
  );
  ok(
    /pump log/.test(await page.locator("#pwStage3 .pw-quote").innerText()),
    "stage 3: quotes the learner's own words from the simulation loop",
  );

  // ── stage 4: the real Book Studio hand-off ───────────────────────────────────────────────────────────────
  await page.click("[data-pw-book]");
  await page.waitForURL(/book-studio\/edit\//);
  await page.waitForSelector(
    "#app h1, #app [contenteditable], #app .bk-editor, #app main, #app section",
  );
  await settle(page);
  const bookId = new URL(page.url()).pathname.split("/").pop();
  const made = await page.evaluate(async (id) => {
    const db = await import("/access-practice-lab/src/book/db.js");
    const b = await db.getBook(id);
    return b
      ? {
          source: b.source,
          rev: b.rev,
          pages: b.pages.length,
          text: JSON.stringify(b.pages).includes("My goal:"),
        }
      : null;
  }, bookId);
  ok(
    made?.source?.kind === "pathway" && made.source.id === `${PW}:bevidence-argument` && made.text,
    `stage 4: Book Studio opened a real book made from the pathway (rev ${made?.rev}, ${made?.pages} pages)`,
  );
  // The editor shows the pathway banner (the hand-off carries ?pw=&st= into the editor's URL).
  await page.waitForSelector(".bk-editor .bk-topbar");
  const edUrl = new URL(page.url());
  const bkBanner = page.locator(".bk-editor .pw-banner");
  const bkBannerText = (await bkBanner.count()) ? await bkBanner.innerText() : "";
  ok(
    edUrl.searchParams.get("pw") === PW &&
      edUrl.searchParams.get("st") === "bevidence-argument" &&
      /Step 4 of 6/.test(bkBannerText) &&
      /Goal: Explain an idea using evidence/.test(bkBannerText) &&
      /Back to my pathway/.test(bkBannerText) &&
      (await bkBanner.isVisible()),
    `stage 4: the Book Studio editor shows the pathway banner (${bkBannerText.replace(/\s+/g, " ")})`,
  );
  const bkBannerFits = await page.evaluate(() => {
    const ed = document.querySelector(".bk-editor");
    const b = document.querySelector(".bk-editor .pw-banner");
    const ws = document.querySelector(".bk-editor .bk-workspace");
    return (
      b.getBoundingClientRect().bottom <= ed.getBoundingClientRect().bottom &&
      ws.getBoundingClientRect().height > 200 &&
      document.documentElement.scrollWidth <= window.innerWidth
    );
  });
  ok(bkBannerFits, "stage 4: the banner sits inside the editor and leaves the page canvas room");
  await shot(page, "pathway-book-editor");
  await page.click(".bk-editor .pw-banner-back");
  await page.waitForSelector(".pw-ladder");
  ok(
    new URL(page.url()).pathname === `${LAB}/pathways/${PW}`,
    "stage 4: Back to my pathway from the editor returns to the runner",
  );
  // The same book opened the ordinary way (no pathway context) opens exactly as before: no banner.
  await open(page, `/book-studio/edit/${bookId}`, ".bk-editor .bk-topbar");
  ok(
    (await page.locator(".pw-banner").count()) === 0 &&
      (await page.locator(".bk-editor [data-bk-canvas]").count()) === 1,
    "stage 4: a book opened without ?pw= shows the plain editor (no banner)",
  );
  // A pathway query that names an unknown run shows nothing either.
  await open(page, `/book-studio/edit/${bookId}?pw=not-a-run&st=x`, ".bk-editor .bk-topbar");
  ok(
    (await page.locator(".pw-banner").count()) === 0,
    "stage 4: an unknown pathway run in the query shows no banner",
  );
  await open(page, `/pathways/${PW}?grades=6-8`, ".pw-ladder");
  ok(
    (await stageState(page, 4)) === "next" &&
      (await page.locator('#pwStage4 a[href*="/book-studio/edit/"]').count()) === 1,
    "stage 4: starting the book does not complete it; the pathway links back to the same book",
  );
  await page.evaluate(async (id) => {
    const db = await import("/access-practice-lab/src/book/db.js");
    const b = await db.getBook(id);
    await db.saveBook(b, { baseRev: b.rev });
  }, bookId);
  await page.reload();
  await page.waitForSelector(".pw-ladder");
  await settle(page);
  ok(
    (await states(page)).join() === "done,done,done,done,next,later",
    "stage 4 (second save seeded through src/book/db.js): done; the transfer is next",
  );

  // ── stage 5: the independent transfer, in place, with the loop panel ─────────────────────────────────────
  await page.click("[data-pw-transfer-save]");
  ok(
    (await page.locator("#pwTransferNote").innerText()).includes("Write your explanation first"),
    "transfer: an empty box saves nothing and says why",
  );
  await page.fill("[data-pw-draft]", "Plants need");
  await page.reload();
  await page.waitForSelector("[data-pw-draft]");
  ok(
    (await page.inputValue("[data-pw-draft]")) === "Plants need",
    "transfer: a draft survives a reload",
  );
  await page.fill("[data-pw-draft]", WORDS);
  await page.click("[data-pw-transfer-save]");
  await page.waitForSelector("#pwTransfer .intel-panel");
  await settle(page);
  ok(
    (await states(page)).join() === "done,done,done,done,done,later",
    "stage 5: done once the loop store holds the learner's response",
  );
  const ev5 = await page.locator("#pwStage5 .pw-evidence").innerText();
  ok(
    /on my own/.test(ev5) && ev5.includes("Plants need light because"),
    "stage 5: independent (no help opened) and quoted in the learner's own words",
  );
  ok(
    (await page.locator(".pw-count").innerText()).includes("5 of 5 steps done") &&
      (await page.locator(".pw-count").innerText()).includes("pathway complete"),
    "runner: 5 of 5 required steps, pathway complete (the optional family step does not block)",
  );
  const loop = await page.evaluate(() =>
    Object.values(JSON.parse(localStorage.getItem("accessPracticeLab:v1:intel")).loops).find(
      (l) => l.src === "pathway",
    ),
  );
  ok(
    loop?.objective === "explain-with-evidence" &&
      loop.task.id.startsWith(`pw:${PW}:`) &&
      Boolean(loop.stages.feedback),
    "transfer: the loop carries the shared objective and has feedback from the engine",
  );
  await shot(page, "runner-transfer");

  // ── stage 6: the optional family conversation ────────────────────────────────────────────────────────────
  ok(
    (await page.locator(".pw-talk-item").count()) === 3 &&
      (await page.locator('.pw-talk-item [lang="es"]').count()) === 3,
    "family card: three talk prompts, each in English and Spanish",
  );
  await page.click("[data-pw-talk-save]");
  ok(
    (await stageState(page, 6)) !== "done",
    "family card: pressing the button with nothing ticked records nothing",
  );
  await page.check('[data-pw-talk="0"]');
  await page.check('[data-pw-talk="2"]');
  await page.click("[data-pw-talk-save]");
  await page.waitForFunction(() =>
    document.querySelector("#pwStage6")?.classList.contains("is-done"),
  );
  ok(true, "family card: the family's own tick completes the optional step");

  // ── reload, hub and Family hub agree ─────────────────────────────────────────────────────────────────────
  await page.reload();
  await page.waitForSelector(".pw-ladder");
  await settle(page);
  ok(
    (await states(page)).join() === "done,done,done,done,done,done",
    "reload: every stage is still done",
  );
  ok(
    (await page.locator(".pw-reco-why").innerText()).length > 30 &&
      !(await page.locator(".pw-reco-why").innerText()).includes("not enough evidence"),
    `recommendation: now names counted evidence (${(await page.locator(".pw-reco-why").innerText()).slice(0, 90)}…)`,
  );
  await open(page, "/pathways?grades=6-8");
  const resume = await page.locator(".pw-resume").innerText();
  ok(
    /Explain an idea using evidence/.test(resume) && /5 of 5 steps done/.test(resume),
    "hub: the resume card shows the same progress",
  );
  ok(
    (await page.locator(".pw-card.is-started .pw-count").first().innerText()).includes("5 of 5"),
    "hub: the pathway card shows the same progress",
  );
  await open(page, "/family?grades=6-8");
  ok(
    (await page.locator(".pw-family-hub .pw-talk-item").count()) === 3 &&
      (await page.locator('.pw-family-hub a[href*="/pathways/explain-with-evidence"]').count()) ===
        1,
    "Family hub: the conversation card for the pathway this child is on",
  );

  // ── share one packet with the teacher (class endpoint intercepted) ───────────────────────────────────────
  await page.evaluate(() =>
    localStorage.setItem(
      "accessPracticeLabClass:v1:link",
      JSON.stringify({
        code: "ABC234",
        studentId: "s0123456789",
        studentKey: "ABCDEFGH",
        alias: "Test",
        title: "Room 12",
      }),
    ),
  );
  let shared = null;
  await context.route("**/api/class/review/share", (route) => {
    shared = route.request().postDataJSON();
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"ok":true,"workId":"w1"}',
    });
  });
  await open(page, `/pathways/${PW}?grades=6-8`, "[data-pw-share]");
  await page.click("[data-pw-share]");
  await page.waitForFunction(() =>
    /Sent\./.test(document.querySelector("#pwShareNote")?.textContent || ""),
  );
  ok(
    shared?.label === "Pathway: Explain an idea using evidence" &&
      [1, 2, 3, 4, 5, 6].every((n) => shared.text.includes(`STEP ${n} —`)) &&
      shared.text.includes(WORDS) &&
      /\[on my own\]/.test(shared.text) &&
      /\[with supports: frames\]/.test(shared.text),
    "share: ONE labelled packet covers all six steps, independent vs supported, with the learner's words",
  );
  await page.evaluate(() => localStorage.removeItem("accessPracticeLabClass:v1:link"));

  // ── builder: For teachers ────────────────────────────────────────────────────────────────────────────────
  await open(page, "/pathways/build?grades=6-8");
  ok(
    (await page.locator(".pw-build .eyebrow").first().innerText()).includes("For teachers") &&
      (await page.locator("#app h1").innerText()) === "Build a connected pathway",
    "builder: clearly labelled For teachers",
  );
  ok(
    (await page.locator(".pw-build-item").count()) === 6,
    "builder: starts from the reference pathway",
  );
  ok(
    (await page.inputValue("#pwPath")) === `${LAB}/pathways/${PW}` &&
      (await page.locator(".pw-qr svg").count()) === 1,
    "builder: an unchanged built-in pathway keeps its short route and gets a QR code",
  );
  const titles = () => page.locator(".pw-build-title").allInnerTexts();
  const before = await titles();
  await page.click('[data-pw-move="0"][data-dir="1"]');
  await settle(page);
  const moved = await titles();
  ok(
    moved[0] === before[1] && moved[1] === before[0],
    "builder: Move down reorders with a button (no dragging)",
  );
  await page.click('[data-pw-move="1"][data-dir="-1"]');
  await settle(page);
  await page.fill("[data-pw-search]", "volcano");
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".pw-result")].some((r) => /Volcano/.test(r.textContent)),
  );
  ok(
    (await page.evaluate(() => document.activeElement?.id)) === "pwSearch",
    "builder: typing in search keeps the caret in the box",
  );
  await page.locator(".pw-result:has-text('Volcano') [data-pw-add]").first().click();
  await settle(page);
  ok(
    (await page.locator(".pw-build-item").count()) === 7 &&
      (await page.locator(".pw-build-item:has-text('Not linked to this goal')").count()) === 1,
    "builder: an added bank activity is listed and labelled as not linked to the goal",
  );
  const addedAt = (await titles()).findIndex((t) => /Volcano/.test(t));
  await page.check(`[data-pw-optional="${addedAt}"]`);
  await settle(page);
  await page.uncheck('[data-pw-support="spanish"]');
  await settle(page);
  await page.click('[data-pw-need="link-ideas"][data-reject="1"]');
  await settle(page);
  ok(
    (await page.getAttribute('[data-pw-need="link-ideas"][data-reject="1"]', "aria-pressed")) ===
      "true",
    "builder: a system suggestion can be rejected",
  );
  await page.selectOption("[data-pw-follow]", "wwrt-heat-island-essay");
  await settle(page);
  await page.fill("[data-pw-title]", "Evidence week: Room 12!");
  await page.locator("[data-pw-title]").blur();
  await settle(page);
  const path = await page.inputValue("#pwPath");
  ok(
    /^\/[\w\-./?=&%]{0,200}$/.test(path) &&
      path.startsWith(`${LAB}/pathways/c?o=explain-with-evidence&s=`) &&
      path.includes("&t=Evidence_week_Room_12") &&
      path.includes("&x=link-ideas") &&
      path.includes("&h=fwp"),
    `builder: the assignable path is valid and within 200 characters (${path.length - 1}): ${path}`,
  );
  ok(
    (await page.locator(".pw-assign .pw-note.is-ok").innerText()).includes("Ready to assign"),
    "builder: says it is ready to assign, with the length",
  );
  ok(
    (await page
      .locator(".pw-build .pw-note.is-warn")
      .filter({ hasText: "Some characters in the title" })
      .count()) === 1,
    "builder: tells the teacher the title was changed to fit a class link",
  );
  ok(
    (await page.locator(".pw-qr").count()) === 0 &&
      (await page.locator(".pw-assign").innerText()).includes("No QR code for this one"),
    "builder: a link too long for the site's QR helper says so instead of drawing a broken code",
  );
  ok(
    (await page.inputValue("#pwLink")) === `${origin}${path}`,
    "builder: the share link is the same path on this site",
  );
  ok(
    (await page.locator(".pw-steps li").count()) === 3 &&
      (await page.locator("[data-pw-class]").count()) === 0,
    "builder: with no class open on this device it shows the exact steps",
  );
  await axe(page, ".pw-build", "builder");
  await shot(page, "builder");

  // "assign": a class is open on this device → the existing settings API gets ONE assignment
  await page.evaluate(() =>
    localStorage.setItem(
      "accessPracticeLabClass:v1:teacher-classes",
      JSON.stringify([{ code: "ABC234", passcode: "pass-1", title: "Room 12" }]),
    ),
  );
  let saved = null;
  await context.route("**/api/class/roster**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        students: [],
        settings: {
          assignments: [
            {
              id: "read-main-idea",
              title: "x",
              path: `${LAB}/Reading/A/read-main-idea`,
              due: null,
            },
          ],
        },
      }),
    }),
  );
  await context.route("**/api/class/settings", (route) => {
    saved = {
      body: route.request().postDataJSON(),
      pass: route.request().headers()["x-class-teacher"],
    };
    route.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' });
  });
  await page.reload();
  await page.waitForSelector("[data-pw-class]");
  await page.click('[data-pw-class="ABC234"]');
  await page.waitForFunction(() =>
    /Assigned to Room 12/.test(document.querySelector("#pwAssignNote")?.textContent || ""),
  );
  const list = saved?.body?.settings?.assignments || [];
  ok(
    saved?.pass === "pass-1" &&
      saved.body.code === "ABC234" &&
      list.length === 2 &&
      list[0].id === "read-main-idea" &&
      list[1].path === path &&
      /^[a-z0-9][a-z0-9:_-]{0,39}$/.test(list[1].id) &&
      list[1].title === "Pathway: Evidence week Room 12",
    `assign: the class settings API received ONE new assignment (${JSON.stringify(list[1])})`,
  );

  // preview as a student: nothing is saved
  await page.click("[data-pw-preview]");
  await page.waitForSelector(".pw-preview");
  await settle(page);
  ok(
    (await page.locator(".pw-stage").count()) === 7 &&
      (await page.locator("#app h1").innerText()) === "Evidence week Room 12",
    "preview: the custom pathway renders as a student would see it",
  );
  ok(
    (
      await page.evaluate(() =>
        Object.keys(JSON.parse(localStorage.getItem("accessPracticeLab:v1:pathways")).runs),
      )
    ).join() === PW,
    "preview: no pathway run is written",
  );

  // the assigned link, opened as a student
  await open(page, path.slice(LAB.length), ".pw-ladder");
  ok(
    (await page.locator(".pw-stage").count()) === 7 &&
      (await page.locator(".pw-stage.is-optional").count()) === 2 &&
      (await page.locator("[data-pw-help]").count()) === 3,
    "custom link: opens with its 7 steps, 2 optional, and only the 3 helps the teacher kept",
  );
  ok(
    (await stageState(page, 1)) === "next" &&
      (await page.locator(".pw-count").innerText()).includes("0 of 5"),
    "custom link: its own progress starts fresh (work from before it started does not count)",
  );
  ok(
    (await page.locator("#pwStage1 .pw-note").innerText()).includes(
      "before you started the pathway",
    ),
    "custom link: earlier work on a step is named as prior work",
  );
  await open(
    page,
    "/pathways/c?o=explain-with-evidence&s=rnot-a-real-one.t&grades=6-8",
    ".pw-ladder",
  );
  ok(
    (await page.locator(".pw-head .pw-note.is-warn").innerText()).includes("rnot-a-real-one"),
    "custom link: an unknown step is left out with a visible note",
  );
  await open(page, "/pathways/c?o=nope&s=t&grades=6-8", ".pw-missing");
  ok(true, "custom link: an unknown goal shows a clear not-found page");

  // ── Spanish ──────────────────────────────────────────────────────────────────────────────────────────────
  await page.evaluate(() => {
    const k = "accessPracticeLab:v1:prefs";
    localStorage.setItem(
      k,
      JSON.stringify({
        ...JSON.parse(localStorage.getItem(k) || "{}"),
        lang: "es",
        langChosen: true,
      }),
    );
  });
  await open(page, `/pathways/${PW}?grades=6-8`, ".pw-ladder");
  ok(
    (await page.locator("#app h1").innerText()) === "Explicar una idea con evidencia" &&
      /Mi meta:/.test(await page.locator(".pw-goal").innerText()) &&
      /5 de 5 pasos hechos/.test(await page.locator(".pw-count").innerText()),
    "Spanish: the runner is in Spanish",
  );
  const esText = await page.locator(".pw-run").innerText();
  ok(!/undefined|\[object/.test(esText), "Spanish: no undefined or [object] on the page");
  await open(page, "/pathways/build?grades=6-8");
  ok(
    (await page.locator("#app h1").innerText()) === "Crear una ruta conectada",
    "Spanish: the builder is in Spanish",
  );
  await context.close();

  // ── 375px ────────────────────────────────────────────────────────────────────────────────────────────────
  const phone = await browser.newContext({ viewport: { width: 375, height: 760 } });
  await phone.route("**/api/class/**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"ok":false,"error":"offline"}',
    }),
  );
  const p2 = await phone.newPage();
  watch(p2);
  for (const [path, sel, name] of [
    ["/pathways?grades=6-8", ".pw-cards", "hub"],
    [`/pathways/${PW}?grades=6-8`, ".pw-ladder", "runner"],
    ["/pathways/build?grades=6-8", ".pw-build-list", "builder"],
    [
      `/Reading/B/read-best-evidence?pw=${PW}&st=rread-best-evidence`,
      ".pw-banner",
      "activity banner",
    ],
    [`/pathways/${PW}?grades=3-5`, ".pw-ladder", "runner grades 3-5"],
  ]) {
    await open(p2, path, sel);
    if (name === "runner") {
      await p2.click('[data-pw-help="frames"]');
      await p2.waitForSelector(".pw-help-open");
      await p2.fill("[data-pw-draft]", WORDS);
      await p2.click("[data-pw-transfer-save]");
      await p2.waitForSelector("#pwTransfer .intel-panel");
      ok(
        /with help: sentence starters/.test(await p2.locator("#pwStage5 .pw-evidence").innerText()),
        "phone: a transfer done with a help opened is saved as with help, never on my own",
      );
    }
    const over = await overflow(p2);
    ok(over <= 1, `375px: ${name} has no sideways scroll (${over}px)`);
    const small = await p2.evaluate(() =>
      [
        ...document.querySelectorAll(
          ".pw-run .btn, .pw-hub .btn, .pw-build .btn, .pw-banner .btn, .pw-check, .pw-talk-tick, .pw-details summary",
        ),
      ]
        .filter((el) => el.offsetParent && el.getBoundingClientRect().height < 43.5)
        .map((el) => `${el.className}:${Math.round(el.getBoundingClientRect().height)}`),
    );
    ok(
      small.length === 0,
      `375px: ${name} controls are at least 44px tall ${small.slice(0, 4).join(" ")}`,
    );
    if (SHOTS)
      await p2.screenshot({
        path: join(SHOTS, `${name.replace(/\W+/g, "-")}-375.png`),
        fullPage: true,
      });
  }
  ok(
    (await p2.locator("#pwStage1 a.btn").getAttribute("href")).includes(
      "/Reading/B/g35-r2-b-mei-proof",
    ),
    "grades 3-5: the reference pathway uses a grades 3-5 reading activity",
  );
  const speak35 = await p2.locator("#pwStage2 a.btn").getAttribute("href");
  ok(
    speak35.includes("/speak/spk35-icewrap-explain?"),
    `grades 3-5: the speaking stage is a grades 3-5 Speaking Studio task (${speak35})`,
  );
  await p2.click("#pwStage2 a.btn");
  await p2.waitForSelector(".pw-banner");
  await settle(p2);
  ok(
    /Step 2 of 6/.test(await p2.locator(".pw-banner").innerText()) &&
      /Which Wrap Kept the Ice Frozen/.test(await p2.locator("#app h1").innerText()),
    "grades 3-5: the Speaking Studio task opens with the pathway banner",
  );
  await open(p2, "/speak?grades=3-5", "#app h1");
  const cards35 = await p2.evaluate(() =>
    [...document.querySelectorAll('#app a[href*="/speak/"]')].map((a) =>
      new URL(a.href).pathname.split("/").pop(),
    ),
  );
  await open(p2, "/speak?grades=6-8", "#app h1");
  const cards68 = await p2.evaluate(() =>
    [...document.querySelectorAll('#app a[href*="/speak/"]')].map((a) =>
      new URL(a.href).pathname.split("/").pop(),
    ),
  );
  ok(
    cards35.length >= 8 &&
      cards35.every((id) => id.startsWith("spk35-")) &&
      cards68.length > 0 &&
      cards68.every((id) => id.startsWith("spk-")),
    `Speaking Studio: grades 3-5 list only 3-5 tasks (${new Set(cards35).size}), grades 6-8 only 6-8 tasks (${new Set(cards68).size})`,
  );
  await phone.close();
  console.log(
    `\nNOTE simulation view on disk: ${simViewExists ? "yes" : "no"} (stage 3 was seeded either way). Seeded: Speaking Studio ledger entry, simulation save + loop, the book's second save. Really driven: everything else.`,
  );
} catch (error) {
  failures.push(`crashed: ${error.stack || error}`);
  console.log(`FAIL crashed: ${error.stack || error}`);
} finally {
  await browser.close();
  server?.close();
}
ok(errors.length === 0, `no page errors ${errors.slice(0, 3).join(" | ")}`);
ok(consoleErrors.length === 0, `no console errors ${consoleErrors.slice(0, 3).join(" | ")}`);
console.log(
  failures.length ? `\npathways-e2e: ${failures.length} FAILED` : "\npathways-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);
