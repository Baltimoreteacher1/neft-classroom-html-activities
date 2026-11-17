#!/usr/bin/env node
/**
 * Experience Builder (/experience-builder), in a real browser: paste the ecosystem sample → build → the editor shows
 * a valid experience → edit a character's line and reorder a scene (live validation, autosave, undo) → the preview
 * shows the change and is played for a few steps (the builder's walk-through AND the real simulation player) →
 * publish and assign to a class → a learner opens the published link in a clean browser → no sideways scroll at
 * 375px, no console errors, Spanish, axe.
 * The publish path is NOT stubbed: this script's static server also answers /api/class/* by calling the real Pages
 * Function (functions/api/class/[[path]].js) against an in-memory SQL engine (node:sqlite), the same way the unit
 * tests do. `--shots <dir>` saves screenshots. Synthetic data only.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SAMPLE_TEXT, SAMPLE_TITLE } from "../access-practice-lab/src/compiler/sample-ecosystem.js";
import { onRequest } from "../functions/api/class/[[path]].js";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("compiler-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

// ── the class server: the real function over node:sqlite ─────────────────────
const TEACHER_KEY = "e2e-teacher-key";
function d1(sqlite) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    first: async () => sqlite.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
    run: async () => ({
      success: true,
      meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) },
    }),
  });
  return {
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      const out = [];
      for (const s of statements) out.push(await s.run());
      return out;
    },
  };
}
const env = { DB: d1(new DatabaseSync(":memory:")), TEACHER_KEY };
async function api(req, res, url) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
  headers.set("CF-Connecting-IP", "10.9.0.1");
  const request = new Request(`http://localhost${url.pathname}${url.search}`, {
    method: req.method,
    headers,
    ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
  });
  const out = await onRequest({
    request,
    env,
    params: { path: url.pathname.replace("/api/class/", "").split("/") },
  });
  res.writeHead(out.status, {
    "content-type": out.headers.get("Content-Type") || "application/json",
  });
  res.end(Buffer.from(await out.arrayBuffer()));
}

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
    const url = new URL(req.url, "http://x");
    const p = decodeURIComponent(url.pathname);
    if (p.startsWith("/api/class/"))
      return api(req, res, url).catch((err) => (res.writeHead(500), res.end(String(err))));
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
const XB = `${LAB}/experience-builder`;
const server = await serve();
const origin = `http://localhost:${server.address().port}`;
const browser = await chromium.launch();
const errors = [];
const watch = (page) => {
  page.on(
    "pageerror",
    (e) => !/web-vitals/.test(String(e)) && errors.push(`pageerror ${e.stack || e}`),
  );
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(`console ${m.text()}`),
  );
  page.on(
    "response",
    (r) =>
      r.status() >= 400 &&
      /\/(src|shared|engine)\/|\.css$/.test(r.url()) &&
      errors.push(`${r.status()} ${r.url()}`),
  );
};
const settle = async (page) => {
  await page.waitForFunction(
    () => !document.querySelector(".route-loading") && document.querySelector("#app, main"),
  );
  await page.waitForTimeout(250);
};
const noOverflow = async (page, name) => {
  await settle(page);
  const w = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    win: window.innerWidth,
  }));
  ok(w.doc <= w.win + 1, `375px: no sideways scroll on ${name} (${w.doc} <= ${w.win})`);
};
async function axe(page, name) {
  if (!AxeBuilder) return console.log(`SKIP axe: ${name} (@axe-core/playwright is not installed)`);
  await settle(page);
  const r = await new AxeBuilder({ page })
    .include(".xb")
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(
    bad.length === 0,
    `axe: ${name} ${bad.map((v) => `${v.id}(${v.nodes.length}) ${v.nodes[0]?.target}`).join(" ")}`,
  );
}
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
};
const draftOf = (page, key) =>
  page.evaluate(
    (k) => JSON.parse(localStorage.getItem("accessPracticeLab:v1:experiences") || "{}")[k] || null,
    key,
  );

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  watch(page);

  // ── home → paste the sample → build ────────────────────────────────────────
  await page.goto(`${origin}${XB}?grades=6-8`);
  await page.waitForSelector(".xb-hero h1");
  ok(
    (await page.textContent(".xb-hero h1")).includes("Experience Builder"),
    "home: the builder opens",
  );
  ok(
    await page.isVisible('[data-xb-act="example"]'),
    "home: a 'Try the ecosystem example' button is offered",
  );
  await page.click('a[href*="experience-builder/new"]');
  await page.waitForSelector("#xbText");
  await page.fill("#xbTitle", SAMPLE_TITLE);
  await page.fill("#xbText", "Ponds are nice.");
  await page.click('[data-xb-act="compile"]');
  await page.waitForSelector("[data-xb-note]");
  ok(
    /too short/i.test(await page.textContent("[data-xb-note]")),
    "a text that is too short is refused with a reason, in the page",
  );
  await page.fill("#xbText", SAMPLE_TEXT);
  ok(
    /3\d\d words/.test(await page.textContent("#xbWords")),
    "the word count follows the pasted text",
  );
  await page.fill(
    "#xbLangObj",
    "Explain a cause-and-effect chain aloud and in writing, using evidence.",
  );
  await page.fill(
    "#xbConObj",
    "Explain how a change in one part of a pond ecosystem affects the other parts.",
  );
  await page.click('[data-xb-act="compile"]');
  await page.waitForURL(/experience-builder\/x[a-z0-9]{10}\/edit/);
  const key = /experience-builder\/(x[a-z0-9]{10})\//.exec(page.url())[1];
  await page.waitForSelector("[data-xb-valid]");
  ok(
    (await page.getAttribute("[data-xb-valid]", "data-xb-valid")) === "yes",
    "compile: the sample becomes a valid, playable experience",
  );
  ok((await page.locator("[data-xb-scene]").count()) === 3, "editor: three scenes");
  ok(
    (await draftOf(page, key))?.def?.schema === "lp-sim/1",
    "the draft is saved on this device as an lp-sim/1 definition",
  );
  await shot(page, "edit-scenes");
  await axe(page, "editor, scenes");

  // ── edit a character's line ────────────────────────────────────────────────
  await page.click('[data-xb-tab="people"]');
  await page.waitForSelector('[data-xb-character="c-witness"]');
  ok((await page.locator("[data-xb-character]").count()) === 2, "editor: two characters");
  const LINE = "Hi there. I am Sam, and I watched this pond turn green.";
  const greeting = "#xb-character_set-c-witness-greeting-en";
  await page.fill(greeting, LINE);
  await page.press(greeting, "Tab");
  await page.waitForFunction(
    (k) =>
      JSON.parse(localStorage.getItem("accessPracticeLab:v1:experiences"))[k].def.characters.some(
        (c) => c.greeting[0].startsWith("Hi there. I am Sam"),
      ),
    key,
  );
  ok(
    (await page.inputValue(greeting)) === LINE,
    "edit: the character's line is kept after the live re-validation",
  );
  ok(
    (await page.getAttribute("[data-xb-valid]", "data-xb-valid")) === "yes",
    "edit: still valid after the change",
  );
  ok(await page.isEnabled('[data-xb-act="undo"]'), "edit: undo is offered");
  // dialogue preview: which topic answers a typed question
  await page.fill('[data-xb-ask="c-witness"]', "Who did people blame for the minnows?");
  await page.click('[data-xb-act="ask"][data-xb-arg*="c-witness"]');
  await page.waitForSelector("[data-xb-reply]");
  ok(
    /blamed the herons/.test(await page.textContent("[data-xb-reply]")),
    "dialogue preview: a typed question finds the topic that answers it",
  );
  // a line that is not in the text is flagged at once
  const answer = "#xb-topic_set-c-witness-t-saw-answer-en";
  const before = await page.inputValue(answer);
  await page.fill(answer, "A dragon drank all of the water in one night.");
  await page.press(answer, "Tab");
  await page.waitForSelector('[data-xb-topic="t-saw"] .xb-badge.is-warn');
  ok(true, "a character answer that is not in the text is marked 'Not from your text'");
  await page.click('[data-xb-act="undo"]');
  await page.waitForFunction(
    (sel) => !document.querySelector(sel),
    '[data-xb-topic="t-saw"] .xb-badge.is-warn',
  );
  ok((await page.inputValue(answer)) === before, "undo: the last change is undone");
  await axe(page, "editor, people");

  // ── reorder a scene ────────────────────────────────────────────────────────
  await page.click('[data-xb-tab="scenes"]');
  await page.waitForSelector("[data-xb-scenes]");
  const order = () =>
    page.$$eval("[data-xb-scene]", (els) => els.map((e) => e.getAttribute("data-xb-scene")));
  ok((await order()).join() === "s1,s2,s3", "scenes start in order");
  await page.click('[data-xb-scene="s3"] [data-xb-act="op"][data-xb-arg*="scene.move"]');
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("[data-xb-scene]")]
        .map((e) => e.getAttribute("data-xb-scene"))
        .join() === "s1,s3,s2",
  );
  ok(
    (await draftOf(page, key)).def.scenes.map((s) => s.id).join() === "s1,s3,s2",
    "reorder: the saved draft has the new scene order",
  );
  ok(
    (await page.getAttribute("[data-xb-valid]", "data-xb-valid")) === "yes",
    "reorder: still valid",
  );
  await page.click('[data-xb-tab="endings"]');
  await page.waitForSelector("[data-xb-endings]");
  ok(
    (await page.locator("[data-xb-ending] .xb-badge.is-ok").count()) === 3,
    "branch inspector: three endings are reached by a scripted learner",
  );
  await page.click('[data-xb-tab="check"]');
  await page.waitForSelector('[data-xb-section="check"]');
  ok(/Ready/.test(await page.textContent('[data-xb-section="check"] .xb-status')), "check: ready");
  await page.reload();
  await page.waitForSelector("[data-xb-valid]");
  ok(
    (await page.getAttribute("[data-xb-valid]", "data-xb-valid")) === "yes",
    "the draft survives a reload",
  );

  // ── preview: the change is there, and it plays ─────────────────────────────
  await page.click('[data-xb-step="preview"]');
  await page.waitForSelector("[data-xb-pvmode]");
  const hasPlayer = (await page.locator("[data-xb-player] [data-sim-player]").count()) > 0;
  ok(hasPlayer, "preview: the real simulation player is embedded on the current draft");
  if (hasPlayer) {
    await page.click('[data-xb-player] .sim-q[data-sim-hot="h-c-witness"]');
    await page.waitForFunction(
      (t) => document.querySelector("[data-xb-player]").textContent.includes(t),
      "I watched this pond turn green",
    );
    ok(true, "preview (real player): the edited character line is what the character says");
    await page.locator("[data-xb-player] [data-sim-ask]").first().click();
    await page.waitForTimeout(300);
    ok(
      (await page.locator("[data-xb-player] [data-sim-player]").count()) > 0,
      "preview (real player): asking a question keeps playing",
    );
    await shot(page, "preview-player");
    const saves = await page.evaluate(() => [
      localStorage.getItem("accessPracticeLab:v1:sim"),
      localStorage.getItem("accessPracticeLab:v1:intel"),
    ]);
    ok(
      !saves[0] && !saves[1],
      "preview: nothing is written to a learner's saves or feedback loops",
    );
  }
  await page.click('[data-xb-pvmode="steps"]');
  await page.waitForSelector("[data-xb-preview]");
  ok(
    (await page.textContent("[data-xb-pv-scene]")).includes("The site"),
    "walk-through: starts in the first scene",
  );
  await page.click('[data-xb-act="pv-open"][data-xb-arg*="h-ev-object"]');
  await page.waitForSelector('[data-xb-pv-open="evidence"]');
  ok(
    /70 percent/.test(await page.textContent('[data-xb-pv-open="evidence"]')),
    "walk-through: examining the object shows the source's own sentence",
  );
  await page.click('[data-xb-act="pv-open"][data-xb-arg*="h-ev-doc"]');
  await page.waitForFunction(() =>
    /2 of 6/.test(document.querySelector("[data-xb-pv-progress]").textContent),
  );
  await page.click('[data-xb-act="pv-open"][data-xb-arg*="h-c-witness"]');
  await page.waitForSelector("[data-xb-pv-line]");
  ok(
    (await page.textContent("[data-xb-pv-line]")).includes(LINE),
    "walk-through: the edited character line is shown",
  );
  await page.click('[data-xb-act="pv-topic"][data-xb-arg*="t-idea"]');
  await page.waitForFunction(() =>
    /blamed the herons/.test(document.querySelector("[data-xb-pv-line]").textContent),
  );
  await page.waitForFunction(() =>
    /3 of 6/.test(document.querySelector("[data-xb-pv-progress]").textContent),
  );
  ok(true, "walk-through: an interview answer gives testimony (3 of 6 pieces of evidence)");
  await page.fill("[data-xb-pv-ask]", "What is your favorite pizza?");
  await page.click('[data-xb-act="pv-ask"]');
  await page.waitForFunction(() =>
    /can't speak to that/.test(document.querySelector("[data-xb-pv-line]").textContent),
  );
  ok(true, "walk-through: an off-topic question gets the in-role fallback");
  await page.click('[data-xb-act="pv-open"][data-xb-arg*="h-next0"]');
  await page.waitForFunction(() =>
    document.querySelector("[data-xb-pv-scene]").textContent.includes("The records room"),
  );
  ok(true, "walk-through: with two pieces of evidence the door to the next scene opens");
  await shot(page, "preview-steps");
  await axe(page, "preview walk-through");

  // ── assign ─────────────────────────────────────────────────────────────────
  await page.click('[data-xb-step="assign"]');
  await page.waitForSelector("[data-xb-noclass]");
  ok(
    (await page.locator("[data-xb-noclass] ol li").count()) === 3,
    "assign without a class: the exact steps are shown",
  );
  ok(
    await page.isVisible('[data-xb-act="export"]'),
    "assign without a class: export as a file is offered",
  );
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click('[data-xb-act="export"]'),
  ]);
  ok(
    /\.json$/.test(download.suggestedFilename()),
    `export: a .json file is offered (${download.suggestedFilename()})`,
  );
  await axe(page, "assign");

  // a class on this device, made through the real endpoint
  const made = await (
    await fetch(`${origin}/api/class/create`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-teacher-key": TEACHER_KEY },
      body: JSON.stringify({ app: "language", title: "Period 4" }),
    })
  ).json();
  ok(made.ok && made.code, "the local class function created a class");
  await page.evaluate(
    (c) => localStorage.setItem("accessPracticeLabClass:v1:teacher-classes", JSON.stringify([c])),
    { code: made.code, passcode: made.teacherPasscode, title: "Period 4" },
  );
  await page.reload();
  await page.waitForSelector("[data-xb-class]");
  await page.click('[data-xb-act="publish"]');
  await page.waitForSelector("[data-xb-published]");
  const id = await page.getAttribute("[data-xb-published]", "data-xb-published");
  ok(/^x[a-z0-9]{8,12}$/.test(id), `publish: the class server returned an id (${id})`);
  ok(
    /Published and added/.test(await page.textContent("[data-xb-assign-msg]")),
    "publish: added to the class's assignments",
  );
  const got = await (await fetch(`${origin}/api/class/experience/get?id=${id}`)).json();
  ok(
    got.ok && got.def.scenes.map((s) => s.id).join() === "s1,s3,s2",
    "the published definition is the edited one (reordered scenes)",
  );
  ok(
    got.def.source === undefined && got.def.compiled === undefined,
    "the instructor's raw text and the compiler's notes are not in what learners download",
  );
  ok(
    got.def.characters.some((c) => c.greeting[0] === LINE),
    "the published definition has the edited character line",
  );
  const info = await (await fetch(`${origin}/api/class/info?code=${made.code}`)).json();
  ok(
    info.assignments?.some((a) => a.id === id && a.path === `${LAB}/simulations/x/${id}`),
    "the class's assignments list the experience at /simulations/x/<id>",
  );
  const anon = await fetch(`${origin}/api/class/experience/publish`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code: made.code, def: got.def }),
  });
  ok(anon.status === 401, "publishing without the teacher credential is refused (401)");
  await shot(page, "assign-published");

  // a learner opens the assigned link in a clean browser (no draft on that device)
  const kid = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const kp = await kid.newPage();
  watch(kp);
  await kp.goto(`${origin}${LAB}/simulations/x/${id}?grades=6-8`);
  await kp.waitForSelector("[data-sim-player]", { timeout: 15000 }).catch(() => {});
  ok(
    (await kp.locator("[data-sim-player]").count()) > 0,
    "a learner on another device opens the published experience in the simulation player",
  );
  if (await kp.locator("[data-sim-player]").count()) {
    await kp.click('.sim-q[data-sim-hot="h-c-witness"]');
    await kp
      .waitForFunction(
        (t) => document.body.textContent.includes(t),
        "I watched this pond turn green",
      )
      .catch(() => {});
    ok(
      (await kp.textContent("body")).includes("I watched this pond turn green"),
      "the learner meets the edited character",
    );
  }
  await kid.close();

  // unpublish
  await page.click('[data-xb-act="unpublish"]');
  await page.waitForFunction(() => !document.querySelector("[data-xb-published]"));
  ok(
    (await fetch(`${origin}/api/class/experience/get?id=${id}`)).status === 404,
    "unpublish: learners can no longer open it",
  );

  // ── the example button, an upload, Spanish ─────────────────────────────────
  await page.goto(`${origin}${XB}?grades=6-8`);
  await page.waitForSelector("[data-xb-drafts]");
  ok((await page.locator("[data-xb-drafts] > li").count()) === 1, "home lists the draft");
  await page.click('[data-xb-act="example"]');
  await page.waitForSelector("#xbText");
  ok(
    (await page.inputValue("#xbText")).startsWith("Willow Pond is a small ecosystem"),
    "the ecosystem example loads into the builder",
  );
  await page.setInputFiles("#xbFile", {
    name: "unit.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer: Buffer.from("PK"),
  });
  await page.waitForSelector("[data-xb-note]");
  ok(
    /Word and PDF files cannot be read/.test(await page.textContent("[data-xb-note]")),
    "upload: a .docx is refused with what to do instead",
  );
  await page.setInputFiles("#xbFile", {
    name: "pond.html",
    mimeType: "text/html",
    buffer: Buffer.from(`<h1>Pond</h1><script>window.__xbHacked = 1</script><p>${SAMPLE_TEXT}</p>`),
  });
  await page.waitForFunction(
    () =>
      document.querySelector("#xbText").value.includes("Willow Pond is a small ecosystem") &&
      document.querySelector("#xbTitle").value === "pond",
  );
  ok(
    !(await page.inputValue("#xbText")).includes("<") &&
      !(await page.evaluate(() => window.__xbHacked)),
    "upload: an .html file is read as text; its script never runs",
  );
  await page.click('[data-xb-act="compile"]');
  await page.waitForURL(/experience-builder\/x[a-z0-9]{10}\/edit/);
  ok(
    (await page.getAttribute("[data-xb-valid]", "data-xb-valid")) === "yes",
    "the uploaded text compiles to a valid experience",
  );

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
  await page.goto(`${origin}${XB}/${key}/edit?tab=people&grades=6-8`);
  await page.waitForSelector("[data-xb-character]");
  ok(
    (await page.textContent('[data-xb-step="preview"]')).includes("Vista previa") &&
      /Válida y jugable/.test(await page.textContent("[data-xb-valid]")),
    "Spanish: the builder speaks Spanish",
  );
  ok(
    !/Suggested question|Add a topic|Greeting \(/.test(await page.textContent(".xb")),
    "Spanish: no English labels are left in the editor",
  );
  await page.evaluate(() => {
    const k = "accessPracticeLab:v1:prefs";
    localStorage.setItem(
      k,
      JSON.stringify({ ...JSON.parse(localStorage.getItem(k) || "{}"), lang: "en" }),
    );
  });
  await context.close();

  // ── 375px ──────────────────────────────────────────────────────────────────
  const phone = await browser.newContext({ viewport: { width: 375, height: 760 } });
  const pp = await phone.newPage();
  watch(pp);
  await pp.goto(`${origin}${XB}?grades=6-8`);
  await pp.waitForSelector(".xb-hero");
  await noOverflow(pp, "home");
  await pp.click('[data-xb-act="example"]');
  await pp.waitForSelector("#xbText");
  await noOverflow(pp, "material and settings");
  await pp.click('[data-xb-act="compile"]');
  await pp.waitForURL(/experience-builder\/x[a-z0-9]{10}\/edit/);
  const k2 = /experience-builder\/(x[a-z0-9]{10})\//.exec(pp.url())[1];
  for (const tab of ["scenes", "people", "evidence", "tasks", "supports", "endings", "check"]) {
    await pp.goto(`${origin}${XB}/${k2}/edit?tab=${tab}&grades=6-8`);
    await pp.waitForSelector(`[data-xb-section="${tab}"]`);
    await noOverflow(pp, `editor: ${tab}`);
  }
  const small = await pp.$$eval(
    ".xb button, .xb a.btn, .xb .xb-tab, .xb .xb-step-link, .xb select, .xb input[type=text]",
    (els) =>
      els
        .filter((e) => e.offsetParent && e.getBoundingClientRect().height < 43.5)
        .map(
          (e) =>
            `${e.tagName} ${e.textContent.trim().slice(0, 30)} ${Math.round(e.getBoundingClientRect().height)}`,
        ),
  );
  ok(
    small.length === 0,
    `375px: every control is at least 44px tall ${small.slice(0, 4).join(" | ")}`,
  );
  await pp.goto(`${origin}${XB}/${k2}/preview?grades=6-8`);
  await pp.waitForSelector("[data-xb-pvmode]");
  await noOverflow(pp, "preview (player)");
  await shot(pp, "phone-preview");
  await pp.goto(`${origin}${XB}/${k2}/preview?tab=steps&grades=6-8`);
  await pp.waitForSelector("[data-xb-preview]");
  await noOverflow(pp, "preview (walk-through)");
  await pp.goto(`${origin}${XB}/${k2}/assign?grades=6-8`);
  await pp.waitForSelector("[data-xb-act='publish']");
  await noOverflow(pp, "assign");
  await shot(pp, "phone-assign");
  await phone.close();

  ok(errors.length === 0, `no console or page errors ${errors.slice(0, 5).join(" || ")}`);
} catch (err) {
  failures.push(`crashed: ${err.stack || err}`);
  console.log(`FAIL crashed: ${err.stack || err}`);
  if (errors.length) console.log(`errors so far: ${errors.slice(0, 5).join(" || ")}`);
} finally {
  await browser.close();
  server.close();
}
console.log(
  failures.length ? `\ncompiler-e2e: ${failures.length} FAILED` : "\ncompiler-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);
