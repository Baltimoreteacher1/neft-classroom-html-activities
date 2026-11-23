#!/usr/bin/env node
/**
 * Vocabulary Academy teacher experience, driven in real Chromium (docs/vocab-academy/SPEC.md §10).
 * The lab is served from this working tree and /api/class/* runs the REAL class-platform handler in-process over node:sqlite
 * (the same stand-in tools/book-collab-e2e.mjs uses), so assigning really writes to a class. The committed index.json is
 * replaced in the browser by one built in memory from the authored files (the lead regenerates the committed one).
 * Walk: teacher dashboard -> grade -> unit -> supports -> differentiate -> assign -> results -> presentation by keyboard ->
 * custom unit create/save/reopen; then a student device sees none of it.
 *   node tools/vocab-academy-educator-e2e.mjs [--shots <dir>]
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { onRequest } from "../functions/api/class/[[path]].js";
import { buildIndex } from "./build-vocab-academy-index.mjs";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { loadCorpus } from "./lib/vocab-academy-scope.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("vocab-academy-educator-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const LAB = "/access-practice-lab";
const VA = `${LAB}/vocabulary-academy`;
const KEY = "e2e-teacher-key";
const INDEX = JSON.stringify(buildIndex(loadCorpus(REPO_ROOT)));

function d1(sqlite) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    async first() {
      return sqlite.prepare(sql).get(...params) ?? null;
    },
    async all() {
      return { results: sqlite.prepare(sql).all(...params) };
    },
    async run() {
      const r = sqlite.prepare(sql).run(...params);
      return { success: true, meta: { changes: Number(r.changes) } };
    },
  });
  return {
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        sqlite.exec("COMMIT");
        return out;
      } catch (err) {
        sqlite.exec("ROLLBACK");
        throw err;
      }
    },
  };
}
const env = { DB: d1(new DatabaseSync(":memory:")), TEACHER_KEY: KEY };
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
let clientN = 0;
async function api(req, res, body) {
  const url = new URL(req.url, "http://x");
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  headers.set("CF-Connecting-IP", `10.9.1.${(clientN++ % 200) + 1}`);
  const request = new Request(`https://lab.test${url.pathname}${url.search}`, {
    method: req.method,
    headers,
    ...(req.method === "GET" || req.method === "HEAD" ? {} : { body }),
  });
  const path = url.pathname.replace(/^\/api\/class\/?/, "").split("/");
  const out = await onRequest({ request, env, params: { path } });
  const buf = Buffer.from(await out.arrayBuffer());
  const h = {};
  out.headers.forEach((v, k) => {
    h[k] = v;
  });
  res.writeHead(out.status, h);
  res.end(buf);
}
const server = await new Promise((resolve) => {
  const s = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.startsWith("/api/class/")) {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () =>
        api(req, res, Buffer.concat(chunks)).catch(() => (res.writeHead(500), res.end())),
      );
      return;
    }
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith(`${LAB}/`) && !/\.[a-z0-9]+$/i.test(p))
        file = join(REPO_ROOT, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, {
      "content-type": TYPES[extname(file)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    createReadStream(file).pipe(res);
  });
  s.listen(0, () => resolve(s));
});
const origin = `http://localhost:${server.address().port}`;

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const call = async (path, { body, headers = {} } = {}) =>
  (
    await fetch(`${origin}/api/class/${path}`, {
      method: body ? "POST" : "GET",
      headers: { "content-type": "application/json", ...headers },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  ).json();

// A real class the teacher "opened on this device".
const made = await call("create", {
  body: { app: "language", title: "Period 3" },
  headers: { "x-teacher-key": KEY },
});
const CLASS = { code: made.code, passcode: made.teacherPasscode, title: "Period 3" };
const assignmentsOf = async () =>
  (await call(`roster?code=${CLASS.code}`, { headers: { "x-class-teacher": CLASS.passcode } }))
    .settings?.assignments || [];

const browser = await chromium.launch();
const errors = [];
async function device({ teacher, width = 1280, height = 900 }) {
  const ctx = await browser.newContext({ viewport: { width, height }, acceptDownloads: true });
  await ctx.addInitScript(
    ({ teacher, cls }) => {
      if (teacher) {
        localStorage.setItem("accessPracticeLab:v1:audience", "teacher");
        localStorage.setItem("accessPracticeLabClass:v1:teacher-classes", JSON.stringify([cls]));
      }
    },
    { teacher, cls: CLASS },
  );
  await ctx.route("**/content/vocab-academy/index.json", (r) =>
    r.fulfill({ contentType: "application/json", body: INDEX }),
  );
  const page = await ctx.newPage();
  page.on(
    "pageerror",
    (e) => !/web-vitals|@engine\//.test(String(e)) && errors.push(String(e.stack || e)),
  );
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource|404/.test(m.text()) &&
      errors.push(m.text()),
  );
  return { ctx, page };
}
const shot = async (page, name) =>
  SHOTS && (await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true }));
const axe = async (page, name) => {
  if (!AxeBuilder) return;
  // axe's target-size rule reads what covers an element at the CURRENT scroll position; the sticky lab header covers
  // whatever the previous step scrolled under it, so every scan starts from the top of the page.
  await page.evaluate(() => scrollTo(0, 0));
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(
    bad.length === 0,
    `axe serious/critical on ${name}: ${bad.map((v) => `${v.id}(${v.nodes.length})`).join(", ") || "none"}`,
  );
  for (const v of bad)
    for (const n of v.nodes.slice(0, 3))
      console.log(
        `   ${v.id}: ${n.target.join(" ")} :: ${n.html.slice(0, 140)} :: ${(n.any[0]?.message || "").slice(0, 200)}`,
      );
};
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

// ── teacher device ────────────────────────────────────────────────────────────
{
  const { ctx, page } = await device({ teacher: true });
  await page.goto(`${origin}${VA}/teacher`);
  await page.getByRole("heading", { name: "Teacher dashboard" }).waitFor();
  ok(true, "teacher dashboard opens on a teacher device");
  ok((await page.locator("[data-vat], .vat-panel").count()) > 0, "dashboard has teacher panels");
  ok(
    await page.getByText("Grades 9 to 12 are not part of this release").isVisible(),
    "9-12 are not offered",
  );
  ok((await page.locator(".vat-grades a").count()) === 9, "exactly K-8 offered");
  await shot(page, "01-dashboard");

  await page.getByRole("link", { name: "Grade 3", exact: true }).click();
  await page.getByRole("heading", { name: /Grade 3: units and lessons/ }).waitFor();
  ok(true, "grade page lists units");
  await shot(page, "02-grade");
  await page.getByRole("link", { name: "Open this lesson" }).first().click();
  await page.getByRole("link", { name: "Open presentation mode" }).waitFor();
  ok((await page.locator(".vat-word").count()) === 10, "unit preview lists its 10 words");
  await page.locator(".vat-word summary").first().click();
  ok(
    (await page.locator(".vat-teacher-note").count()) >= 1,
    "teacher notes are shown to the teacher",
  );
  ok((await page.locator(".vat-seq a").count()) === 8, "eight lessons with launch links");
  ok((await page.locator('a[href*="/print/3/1/"]').count()) === 6, "six printable links");
  await shot(page, "03-unit");
  await axe(page, "unit preview");

  // supports
  await page.getByRole("link", { name: "Supports", exact: true }).click();
  await page.getByRole("heading", { name: "Supports", exact: true }).waitFor();
  const before = await page.locator("#vatResolved").innerText();
  await page.selectOption("#vatBand-speaking", "1");
  const after = await page.locator("#vatResolved").innerText();
  ok(before !== after, "changing one domain's band updates what a student gets");
  ok(/Support intensity 1/.test(after), "band labelled with the lab's support-intensity wording");
  ok(!/WIDA level|ACCESS score/i.test(after), "no official level claimed in the preview");
  await page.locator("#vatFade").fill("50");
  ok((await page.locator("#vatFadeOut").innerText()) === "50%", "fade slider reports its value");
  await page.selectOption("#vatPreset", "oral-ahead");
  await page.waitForFunction(() => document.querySelector("#vatBand-reading")?.value === "2");
  ok(
    (await page.locator("#vatBand-reading").inputValue()) === "2" &&
      (await page.locator("#vatBand-speaking").inputValue()) === "4",
    "a mixed-domain preset loads per-domain bands",
  );
  await page.fill("#vatPresetName", "Group B");
  await page.getByRole("button", { name: "Save preset" }).click();
  await page.getByRole("list", { name: "Your saved presets" }).waitFor();
  ok(
    (await page.locator('ul[aria-label="Your saved presets"] li').first().innerText()).includes(
      "Group B",
    ),
    "a saved preset is listed",
  );
  await page.getByRole("button", { name: "Preview as a student" }).click();
  await page.getByRole("button", { name: "Stop previewing" }).waitFor();
  ok(true, "preview as student starts (tab-scoped)");
  await page.getByRole("button", { name: "Stop previewing" }).click();
  await page.getByRole("button", { name: "Apply to this device" }).click();
  ok(/Saved/.test(await page.locator("#vatSupStatus").innerText()), "apply to this device saves");
  await shot(page, "04-supports");
  await axe(page, "supports");

  // assign + differentiate
  await page.getByRole("link", { name: "Assign", exact: true }).first().click();
  await page.locator("#vatAssignH").waitFor();
  await page.waitForFunction(() => document.querySelector("#vatClass"));
  ok(
    (await page.locator("#vatClass option").count()) === 1,
    "the class opened on this device is offered",
  );
  await page.getByLabel("The whole lesson (word list, Exercises A to F and the review)").check();
  await page.getByLabel(/Word List/).check();
  await page.getByRole("button", { name: "Assign to the class" }).click();
  await page.waitForFunction(() =>
    /Assigned 2/.test(document.querySelector("#vatAssignStatus")?.textContent || ""),
  );
  let list = await assignmentsOf();
  ok(
    list.length === 2 &&
      list.every(
        (a) => a.path.startsWith(`${VA}/grade/3/lesson/1`) && a.path.includes("grades=3-5"),
      ),
    "two assignments saved through the class settings endpoint",
  );
  ok(
    list.some((a) => a.path.includes("/lesson/1/a")),
    "lesson A path has the lesson letter",
  );
  await page.getByRole("button", { name: "Assign to the class" }).click();
  await page.waitForFunction(() =>
    /already assigned/.test(document.querySelector("#vatAssignStatus")?.textContent || ""),
  );
  ok((await assignmentsOf()).length === 2, "assigning again never duplicates");

  await page.getByLabel(/Give this assignment different supports/).check();
  await page.fill("#vatVarLabel", "Group B");
  console.log(
    "   var preset box:",
    JSON.stringify(await page.locator("#vatVarPreset").boundingBox()),
  );
  await page.selectOption("#vatVarPreset", "emerging");
  await page.locator("#vatVarFade").fill("75");
  await page.locator('[data-vat="var-word"][data-i="1"]').check();
  await page.locator('[data-vat="var-word"][data-i="2"]').check();
  await page.locator('[data-vat="var-word"][data-i="3"]').check();
  await page.getByRole("button", { name: "Assign to the class" }).click();
  await page.waitForFunction(() =>
    /Assigned 2/.test(document.querySelector("#vatAssignStatus")?.textContent || ""),
  );
  list = await assignmentsOf();
  const alt = list.filter((a) => /sup=2222/.test(a.path));
  ok(
    alt.length === 2 &&
      alt.every(
        (a) => /sf=75/.test(a.path) && /w=1\.2\.3/.test(a.path) && /lesson\/1/.test(a.path),
      ),
    "differentiated copies carry supports + fewer words on the SAME unit",
  );
  ok(
    alt.every((a) => a.title.endsWith("Group B")),
    "differentiated titles name the group",
  );
  ok(new Set(list.map((a) => a.id)).size === list.length, "ids unique");
  await page
    .getByRole("button", { name: /Assign a differentiated copy/ })
    .first()
    .click();
  await page.waitForFunction(() =>
    /already assigned|Differentiated copy assigned/.test(
      document.querySelector("#vatAssignStatus")?.textContent || "",
    ),
  );
  await shot(page, "05-assign");
  await page.mouse.move(0, 0);
  await page.locator("#vatVarPreset").evaluate((e) => e.scrollIntoView({ block: "center" }));
  await axe(page, "assign");

  // results
  await page.getByRole("link", { name: "Results", exact: true }).click();
  await page.locator("#vatResH").waitFor();
  ok(
    await page.getByText("This page does not guess").isVisible(),
    "no data: a truthful empty state",
  );
  ok((await page.locator(".vat-sample").count()) === 0, "no sample until asked");
  await page
    .getByRole("button", { name: /Load class results|Refresh/ })
    .first()
    .click();
  await page
    .getByText("Assignment completion", { exact: false })
    .first()
    .waitFor({ state: "attached" });
  ok(
    (await page.locator("#vatClassSummary table").count()) >= 1,
    "class summary shows assigned-work completion from the class server",
  );
  await page.getByRole("button", { name: "Show a labelled sample" }).click();
  await page.locator(".vat-sample").waitFor();
  ok(
    /Sample data/.test(await page.locator(".vat-sample").innerText()),
    "sample is labelled as sample data",
  );
  ok(
    (await page.locator("#vatResults table").count()) >= 3,
    "needs, progress and class tables render for the sample",
  );
  const boxes = page.locator('[data-vat="follow"]:not([disabled])');
  ok((await boxes.count()) >= 1, "weak words are offered for follow-up practice");
  await boxes.first().check();
  await page.getByRole("button", { name: "Assign follow-up practice" }).click();
  await page.waitForFunction(() =>
    /Follow-up practice assigned/.test(
      document.querySelector("#vatFollowStatus")?.textContent || "",
    ),
  );
  list = await assignmentsOf();
  ok(
    list.some((a) => a.path.includes("/practice?set=va.")),
    "follow-up practice assigned as practice?set=<ids>",
  );
  await shot(page, "06-results");
  await axe(page, "results");

  // presentation by keyboard
  await page.goto(`${origin}${VA}/present/3/1`);
  await page.locator("#vatStage h1").waitFor();
  const title = await page.locator("#vatStage h1").innerText();
  await page.keyboard.press("ArrowRight");
  const w1 = await page.locator("#vatStage h1").innerText();
  ok(w1 !== title, "ArrowRight moves from the title to the first word");
  ok(
    (await page
      .locator("#vatStage h1")
      .evaluate((e) => parseFloat(getComputedStyle(e).fontSize))) >= 64,
    "the word is shown in large type (64px or more)",
  );
  ok((await page.locator(".vat-p-def").count()) === 0, "meaning is not revealed yet");
  await page.keyboard.press("ArrowRight");
  ok((await page.locator(".vat-p-def").count()) === 1, "second press reveals the meaning");
  await page.keyboard.press("PageDown");
  ok(
    (await page.locator(".vat-p-ex").count()) === 1 &&
      (await page.locator(".vat-p-say").count()) === 1,
    "example + say-it-together",
  );
  await page.keyboard.press(".");
  ok(
    (await page.locator(".vat-p-talk").count()) === 1,
    "turn-and-talk after the example (clicker key)",
  );
  await page.keyboard.press("n");
  ok(await page.locator("#vatNotes").isVisible(), "N opens the teacher notes drawer");
  await page.keyboard.press("n");
  await page.keyboard.press("ArrowLeft");
  ok((await page.locator(".vat-p-talk").count()) === 0, "ArrowLeft steps back through the reveal");
  await shot(page, "07-present");
  await page.keyboard.press("End");
  ok(
    /Word wall/.test(await page.locator("#vatStage h1").innerText()),
    "End jumps to the word wall",
  );
  await axe(page, "presentation");
  await page.keyboard.press("Escape");
  await page.waitForURL(/\/grade\/3\/lesson\/1/);
  ok(true, "Escape exits to the unit page");
  await page.goto(`${origin}${VA}/present/3/1`);
  await page.getByRole("button", { name: "Full screen" }).waitFor();
  ok(true, "full screen control is present");

  // custom unit
  await page.goto(`${origin}${VA}/teacher/custom`);
  await page.getByRole("heading", { name: "Custom lesson builder" }).waitFor();
  await page.fill("#vatCTitle", "Cozy Words");
  await page.selectOption("#vatCGrade", "3");
  await page.fill("#vatPaste", "timid\nsnug (adj)\nsplendid (adj)");
  await page.getByRole("button", { name: "Make word cards" }).click();
  await page.locator("#vatCw-2-hw").waitFor();
  ok(
    (await page.locator("#vatCw-0-def").inputValue()).length > 3,
    "a corpus word (timid) is pre-filled",
  );
  ok(
    (await page.locator("#vatCw-1-def").inputValue()) === "",
    "an unknown word is blank for the teacher to write",
  );
  await page.fill("#vatCw-1-def", "Warm and comfortable in a small space.");
  await page.fill("#vatCw-1-ex", "The kitten fell asleep in the basket."); // missing the word
  await page.fill("#vatCw-2-def", "A splendid thing is wonderful."); // uses the word
  await page.fill("#vatCw-2-ex", "The splendid parade filled the street.");
  await page.getByRole("button", { name: "Save to my Teacher Library" }).click();
  await page.locator("#vatCAlert").waitFor();
  const text = await page.locator(".vat-builder").innerText();
  ok(
    /example sentence must use the word/i.test(text),
    "example without the word is refused with a plain message",
  );
  ok(
    /definition uses the word/i.test(text),
    "definition containing the word (or its family) is refused",
  );
  ok((await page.locator('[aria-invalid="true"]').count()) >= 2, "the fields are marked invalid");
  await shot(page, "08-custom-errors");
  await page.fill("#vatCw-1-ex", "The kitten felt snug in the basket.");
  await page.fill("#vatCw-2-def", "Wonderful and impressive.");
  await page.getByRole("button", { name: "Save to my Teacher Library" }).click();
  await page.waitForFunction(() =>
    /Saved to your Teacher Library/.test(
      document.querySelector("#vatCSaveStatus")?.textContent || "",
    ),
  );
  ok(true, "valid custom unit saves to the Teacher Library");
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("accessPracticeLab:v1:vocabAcademy")).custom,
  );
  const saved = Object.values(stored)[0];
  ok(
    saved.custom === true && saved.id.startsWith("cu.") && saved.words.length === 3,
    "stored under progress.custom as a cu. record with 3 words",
  );
  ok(
    saved.words.every((w) => w.id.startsWith(saved.id)),
    "word ids never collide with published ids",
  );
  await shot(page, "09-custom-saved");
  await axe(page, "custom builder");
  await page.reload();
  await page.getByRole("heading", { name: "Cozy Words" }).first().waitFor();
  ok(true, "the saved unit is in the library after a reload");
  await page.getByRole("link", { name: "Edit" }).first().click();
  await page.waitForFunction(() => document.querySelector("#vatCTitle")?.value === "Cozy Words");
  ok((await page.locator(".vat-wcard").count()) === 3, "reopened for editing with its three words");
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export file" }).click();
  ok(/\.json$/.test((await dl).suggestedFilename()), "export downloads a JSON file");
  await page.getByRole("link", { name: "Present" }).first().click();
  await page.locator("#vatStage h1").waitFor();
  ok(
    /Cozy Words/.test(await page.locator("#vatStage h1").innerText()),
    "a custom unit runs in presentation mode",
  );
  await page.goto(`${origin}${VA}/teacher?custom=${encodeURIComponent(saved.id)}&tab=assign`);
  await page.getByLabel("The whole lesson (word list, Exercises A to F and the review)").waitFor();
  await page.getByLabel("The whole lesson (word list, Exercises A to F and the review)").check();
  await page.getByRole("button", { name: "Assign to the class" }).click();
  await page.waitForFunction(() =>
    /Assigned 1/.test(document.querySelector("#vatAssignStatus")?.textContent || ""),
  );
  ok(
    (await assignmentsOf()).some((a) => a.path.includes("/lesson/cu_")),
    "a custom unit assigns with its cu_ path",
  );
  ok(
    /Students need the lesson file/.test(await page.locator("#vatAssign").innerText()),
    "the page says custom units need the unit file",
  );

  // the other word sources: topic, published-word search, clone
  await page.goto(`${origin}${VA}/teacher/custom`);
  await page.getByRole("heading", { name: "Custom lesson builder" }).waitFor();
  await page.getByLabel("Start from a topic").check();
  await page.fill("#vatTopic", "forest");
  await page.getByRole("button", { name: /Find published words/ }).click();
  await page.locator(".vat-hits li").first().waitFor();
  ok(
    (await page.locator(".vat-hits li").count()) >= 3,
    "a topic finds published words from matching unit themes",
  );
  await page.locator('[data-vc="add-id"]').first().click();
  await page.locator("#vatCw-0-hw").waitFor();
  ok(
    (await page.locator("#vatCw-0-def").inputValue()).length > 3,
    "an added published word arrives as an editable copy",
  );
  await page.getByLabel("Pick published words").check();
  await page.fill("#vatSearch", "timid");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page.locator('[data-vc="add-id"]').first().waitFor();
  await page.locator('[data-vc="add-id"]').first().click();
  await page.locator("#vatCw-1-hw").waitFor();
  ok((await page.locator(".vat-wcard").count()) === 2, "a searched word is added too");
  await page.getByLabel("Copy a published lesson").check();
  await page.selectOption("#vatCloneUnit", "g3-u01");
  await page.getByRole("button", { name: "Copy it" }).click();
  await page.waitForFunction(() => document.querySelectorAll(".vat-wcard").length === 10);
  ok(
    (await page.locator("#vatCTitle").inputValue()).includes("(copy)"),
    "cloning copies a unit's 10 words into a separate draft",
  );
  await page.getByRole("button", { name: "Save to my Teacher Library" }).click();
  await page.waitForFunction(() =>
    /Saved to your Teacher Library/.test(
      document.querySelector("#vatCSaveStatus")?.textContent || "",
    ),
  );
  const all = await page.evaluate(() =>
    Object.keys(JSON.parse(localStorage.getItem("accessPracticeLab:v1:vocabAcademy")).custom),
  );
  ok(
    all.length === 2 && all.every((id) => id.startsWith("cu.")),
    "the cloned unit is a separate cu. record; the published unit is untouched",
  );
  await page
    .getByRole("button", { name: /^Delete/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await page.waitForFunction(() => document.querySelectorAll(".vat-unit").length === 1);
  ok(true, "delete asks inside the page and removes the unit");

  // Spanish chrome and 390px reflow
  await page.evaluate(() =>
    localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify({ lang: "es" })),
  );
  await ctx.close();
}
{
  const { ctx, page } = await device({ teacher: true, width: 390, height: 844 });
  for (const path of [
    "teacher",
    "teacher?grade=3&unit=1&tab=supports",
    "teacher?grade=3&unit=1&tab=assign",
    "teacher/custom",
    "present/3/1",
  ]) {
    await page.goto(`${origin}${VA}/${path}`);
    await page.locator(".vat, .vat-present").first().waitFor();
    ok(!(await overflow(page)), `no horizontal scroll at 390px on ${path}`);
  }
  await shot(page, "10-mobile-present");
  await ctx.close();
}

// ── a student device sees none of it ──────────────────────────────────────────
{
  const { ctx, page } = await device({ teacher: false });
  for (const path of [
    "teacher",
    "teacher?grade=3&unit=1&tab=assign",
    "teacher/custom",
    "teacher?assign=g3-u01",
  ]) {
    await page.goto(`${origin}${VA}/${path}`);
    await page.locator(".va").first().waitFor();
    await page.waitForTimeout(300);
    const dom = await page.locator("#app").innerHTML();
    ok(/This page is for teachers/.test(dom), `student sees the teachers-only panel at /${path}`);
    ok(
      !/data-vat|data-vc|vat-panel|Assign to the class|Support strength|Teacher Library/.test(dom),
      `no teacher controls in the student DOM at /${path}`,
    );
  }
  await shot(page, "11-student-blocked");
  await page.goto(`${origin}${VA}/present/3/1`);
  await page.locator("#vatStage h1").waitFor();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("n");
  const dom = await page.locator("#app").innerHTML();
  ok(
    !dom.includes("vatNotes") && !/Teacher notes/.test(dom),
    "a student's presentation has no notes drawer, and N does nothing",
  );
  await ctx.close();
}

await browser.close();
server.close();
ok(
  errors.length === 0,
  `no page or console errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`,
);
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nvocab-academy-educator-e2e: all checks passed");
