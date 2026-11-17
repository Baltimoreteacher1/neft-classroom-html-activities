#!/usr/bin/env node
/**
 * Book Studio 2.0 (Living Storyworld + ESOL Support Studio), driven in a real browser:
 *   four creation modes on the shelf → Make an Adventure → five stages → teacher adds a Language Support to selected
 *   words/an element → it persists after reload → Preview as student shows Level 1 vs Level 5 side by side (only the
 *   intended profile sees it) → a student with that profile uses a starter, hides a help, and the use is recorded →
 *   animation timeline plays (and jumps to the final pose under reduced motion) → a playable branch (clue unlocks a
 *   choice, ending) → a share link carries no teacher supports, plans or work → axe on the new surfaces.
 * Serves this working tree; BASE=<url> to point elsewhere.   node tools/book-studio-2-e2e.mjs [--shots <dir>]
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
  console.warn("book-studio-2-e2e: SKIP — playwright is not installed.");
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
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/favicon|ERR_FILE_NOT_FOUND|404|net::ERR_|Failed to load resource|web-vitals/.test(
        m.text(),
      ) &&
      errors.push(m.text()),
  );
  page.on("dialog", (d) => d.dismiss());
};
const bookIdOf = (page) => page.url().match(/edit\/([a-z0-9]+)/i)?.[1];
const withBook = (page, fn, arg) =>
  page.evaluate(
    async ({ src, arg }) => {
      const db = await import("/access-practice-lab/src/book/db.js");
      const run = new Function("db", "arg", `return (async () => { ${src} })()`);
      return run(db, arg);
    },
    { src: fn, arg },
  );

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();
  watch(page);

  // ── 1. four creation modes; Make an Adventure ──
  await page.goto(`${origin}${LAB}/book-studio?grades=4-5`);
  await page.waitForSelector(".bk-home h1", { timeout: 15000 });
  ok(
    (await page.locator(".bk-mode-card").count()) === 4,
    "the shelf offers four creation experiences",
  );
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "home-modes.png") });
  await page.locator(".bk-mode-card.is-adventure").click();
  await page.waitForSelector("[data-create]");
  await page.fill('input[name="title"]', "The Hidden Door");
  await page.locator("[data-create] button[type=submit]").click();
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page", { timeout: 15000 });
  const id = bookIdOf(page);
  ok(!!id, "the editor opens for the new adventure");
  ok(
    (await page.locator(".bk-stage-btn").count()) === 5,
    "five stages: Imagine, Create, Bring It to Life, Improve, Publish",
  );
  ok(
    (await page.locator(".bk-page-item").count()) === 5,
    "Make an Adventure starts with a start page, two paths and an ending",
  );
  ok(
    await page.locator('[data-bk-add="text"]').isVisible(),
    "a novice sees Add Text on the Create stage",
  );

  // ── 2. a text box with words ──
  await page.locator(".bk-page-item .bk-thumb").nth(1).click();
  await page.locator('[data-bk-add="text"]').click();
  await page.keyboard.type("The fox is scared.");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(900);

  // ── 3. teacher adds a Language Support to the selected element ──
  await page.locator('[data-bk-act="teacher"]').click();
  ok(
    (await page.locator(".bk-teacher-bar").count()) === 1,
    "teacher tools appear only after the teacher turns them on",
  );
  await page.locator('[data-dock="add-support"]').click();
  await page.waitForSelector(".bk-sp-dialog[open] .bk-sp-form");
  ok(
    (await page.locator(".bk-sp-target strong").innerText()).length > 0,
    "the support says exactly what it is attached to",
  );
  await page.fill('.bk-sp-form [data-f="title"]', "Describe the fox");
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "add-language-support.png") });
  await page.locator('.bk-sp-form input[data-f="levels"][value="1"]').check();
  const intensity = page.locator('.bk-sp-form input[data-f="intensity"][value="heavy"]');
  await intensity.check();
  await page.locator('.bk-sp-form [data-f="content.frames"]').fill("The fox is ___. It sees ___.");
  ok(
    (await page.locator(".bk-sp-preview .bk-sp-frame").count()) === 1,
    "the live preview shows the starter a Level 1 student would see",
  );
  await page.selectOption("[data-spx-prevlevel]", "5");
  ok(
    (await page.locator(".bk-sp-preview .bk-sp-hidden").count()) === 1,
    "the preview says it is not shown to a Level 5 profile",
  );
  await page.selectOption("[data-spx-prevlevel]", "1");
  await page.locator('[data-spx="save"]').click();
  await page.waitForFunction(() => !document.querySelector(".bk-sp-dialog[open]"));
  await page.waitForTimeout(900);
  const saved = await withBook(
    page,
    `const b = await db.getBook(arg); return b.supports.map((s) => ({ t: s.title, l: s.levels, i: s.intensity, f: s.content.frames }));`,
    id,
  );
  ok(
    saved.length === 1 && saved[0].l[0] === 1 && saved[0].f[0].includes("___"),
    "the support is saved in the book with its levels and wording",
  );

  // ── 4. it persists after reload; preview as student, two profiles side by side ──
  await page.reload();
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.locator('[data-dock="studio"]').click();
  await page.waitForSelector(".bk-sp-dialog[open] .bk-sp-row");
  ok(
    (await page.locator(".bk-sp-row strong").first().innerText()) === "Describe the fox",
    "the support is still there after reopening the book",
  );
  await page.locator('[data-spx="tab"][data-tab="preview"]').click();
  await page.waitForSelector("[data-pv-col='a']");
  await page.selectOption('[data-pv="page"]', "1");
  await page.selectOption('[data-pv="a"]', "1");
  await page.selectOption('[data-pv="b"]', "5");
  await page.waitForSelector("[data-pv-col='b'] h3");
  ok(
    (await page.locator("[data-pv-col='a'] .bk-sp-card").count()) === 1,
    "Level 1 preview sees the support",
  );
  ok(
    (await page.locator("[data-pv-col='b'] .bk-sp-card").count()) === 0,
    "Level 5 preview does not see it (same page, different access)",
  );
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "preview-level1-vs-level5.png") });
  if (AxeBuilder) {
    const axe = await new AxeBuilder({ page }).include(".bk-sp-dialog").analyze();
    const bad = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    ok(
      bad.length === 0,
      `axe: the Language Support Studio has no serious/critical violations ${bad.map((v) => v.id).join(",")}`,
    );
  }
  await page.keyboard.press("Escape");

  // ── 5. a student with a Level 1 plan: uses a starter, hides help, evidence is recorded ──
  await page.locator('[data-bk-act="teacher"]').click();
  await withBook(
    page,
    `const b = await db.getBook(arg); b.plan = { profile: 1, intensity: "heavy", domains: { listening: "heavy", speaking: "heavy", reading: "heavy", writing: "heavy" } }; await db.saveBook(b);`,
    id,
  );
  await page.reload();
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.locator(".bk-page-item .bk-thumb").nth(1).click();
  await page.waitForSelector(".bk-sp-tray");
  ok(
    (await page.locator(".bk-sp-tray .bk-sp-card").count()) === 1,
    "the student sees only their assigned support, under the page",
  );
  await page.locator(".bk-sp-head").first().click();
  if (SHOTS)
    await page
      .locator("[data-bk-editor]")
      .screenshot({ path: join(SHOTS, "student-level1-editor.png") });
  await page.locator(".bk-sp-frame").first().click();
  await page.waitForTimeout(500);
  const txt = await page.locator(".bk-canvas .bk-txt").first().innerText();
  ok(
    txt.includes("The fox is scared.") && txt.includes("It sees"),
    "a starter is added to the student's own words, never replacing them",
  );
  await page.waitForSelector(".bk-sp-tray");
  await page.locator('[data-sp="hide"]').first().click();
  await page.waitForTimeout(900);
  const work = await withBook(
    page,
    `const b = await db.getBook(arg); return b.work.records.map((r) => r.action);`,
    id,
  );
  ok(
    work.includes("opened") && work.includes("used") && work.includes("hidden"),
    `support use is recorded (${work.join(",")})`,
  );

  // ── 6. animation: a walk plays to its final pose; reduced motion jumps there ──
  await withBook(
    page,
    `const b = await db.getBook(arg);
     const p = b.pages[1];
     p.elements.push({ id: "foxel0001", type: "art", art: "char-cat", alt: "A cat", x: 5, y: 40, w: 20, h: 30 });
     p.scene = { actions: [{ id: "act00001", type: "walk", target: "foxel0001", t: 0, dur: 600, params: { x: 60, y: 40 } }], ambience: "", parallax: false };
     await db.saveBook(b);`,
    id,
  );
  await page.reload();
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.locator(".bk-page-item .bk-thumb").nth(1).click();
  await page.locator('[data-stage="life"]').click();
  await page.waitForSelector("[data-dock='play']");
  const x0 = await page
    .locator('.bk-canvas [data-el="foxel0001"]')
    .evaluate((n) => n.getBoundingClientRect().left);
  await page.locator("[data-dock='play']").click();
  await page.waitForTimeout(1400);
  const x1 = await page
    .locator('.bk-canvas [data-el="foxel0001"]')
    .evaluate((n) => n.getBoundingClientRect().left);
  ok(
    x1 > x0 + 50,
    `the walk action moves the character on the page (${Math.round(x0)} → ${Math.round(x1)})`,
  );
  // the director proposes, the author approves
  await page.fill("[data-dir-text]", "Make the cat jump");
  await page.locator("[data-director] button[type=submit]").click();
  await page.waitForSelector("[data-dir-apply]");
  ok(true, "Direct this scene shows a proposal before anything changes");
  await page.locator("[data-dir-apply]").click();
  await page.waitForTimeout(1500);
  const acts = await withBook(
    page,
    `const b = await db.getBook(arg); return b.pages[1].scene.actions.map((a) => a.type);`,
    id,
  );
  ok(
    acts.join() === "walk,jump",
    `the approved direction became an editable action (${acts.join()})`,
  );

  // Reduced motion: the same page, same storage, but the person prefers less motion.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.locator(".bk-page-item .bk-thumb").nth(1).click();
  await page.locator('[data-stage="life"]').click();
  await page.locator("[data-dock='play']").click();
  await page.waitForTimeout(150);
  const rx = await page
    .locator('.bk-canvas [data-el="foxel0001"]')
    .evaluate((n) => n.getBoundingClientRect().left);
  ok(rx > x0 + 50, "with reduced motion the scene shows its final pose immediately");
  await page.emulateMedia({ reducedMotion: "no-preference" });

  // ── 7. a playable branch: a clue unlocks a choice and leads to an ending ──
  const playId = await withBook(
    page,
    `const m = await import("/access-practice-lab/src/book/model.js");
     const b = m.normalizeBook({
       title: "Door", mode: "adventure",
       story: { startPageId: "page0001", items: [{ id: "itemkey01", name: "Key", art: "obj-key" }], vars: [] },
       pages: [
         { id: "page0001", elements: [{ id: "keyel0001", type: "art", art: "obj-key", alt: "A key", x: 10, y: 10, w: 20, h: 20, hotspot: { label: "Rusty key", give: "itemkey01", reveal: "The key is rusty, so nobody used the door for years.", requires: [] } }, { id: "textel0001", type: "text", html: "<p>A door.</p>", x: 5, y: 60, w: 90, h: 20 }],
           choices: [{ id: "choice0001", label: "Unlock the door", to: "page0002", requires: [{ item: "itemkey01" }], effects: [], lockedText: "You need a key." }, { id: "choice0002", label: "Walk away", to: "page0003", requires: [], effects: [] }] },
         { id: "page0002", ending: "good", elements: [{ id: "textel0002", type: "text", html: "<p>The room glows.</p>", x: 5, y: 40, w: 90, h: 20 }] },
         { id: "page0003", ending: "neutral", elements: [{ id: "textel0003", type: "text", html: "<p>You go home.</p>", x: 5, y: 40, w: 90, h: 20 }] },
       ] });
     const s = await db.saveBook(b); return s.id;`,
  );
  await page.goto(`${origin}${LAB}/book-studio/play/${playId}`);
  await page.waitForSelector(".bk-play-choice");
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "play-mode.png") });
  ok(
    (await page.locator('.bk-play-choice[aria-disabled="true"]').count()) === 1,
    "a locked choice stays visible and says it is locked",
  );
  await page.locator('[data-hotspot="keyel0001"]').click();
  await page.waitForSelector(".bk-play-pop");
  ok(
    (await page.locator(".bk-play-pop").innerText()).includes("rusty"),
    "the clue shows the author's own explanation",
  );
  await page.locator('[data-pp="close"]').click();
  ok(
    (await page.locator('.bk-play-choice[aria-disabled="true"]').count()) === 0,
    "finding the key unlocks the choice",
  );
  await page.locator('[data-p-choice="choice0001"]').click();
  await page.waitForSelector(".bk-play-end");
  ok(
    (await page.locator(".bk-play-page").innerText()).includes("The room glows."),
    "the choice leads to its ending page",
  );
  await page.locator('[data-p="back"]').click();
  ok(
    (await page.locator('[data-p-choice="choice0002"]').count()) === 1,
    "Back returns to the decision",
  );

  // story map
  await page.goto(`${origin}${LAB}/book-studio/edit/${playId}`);
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.locator('[data-stage="imagine"]').click();
  await page.locator('[data-dock="map"]').click();
  await page.waitForSelector(".bk-st-dialog[open] .bk-map");
  ok(
    (await page.locator(".bk-node").count()) === 3,
    "the story map draws every page as a box with arrows for choices",
  );
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "story-map.png") });
  await page.keyboard.press("Escape");

  // ── 8. a shared link carries no teacher supports, plan or work ──
  const shared = await withBook(
    page,
    `const m = await import("/access-practice-lab/src/book/model.js");
     const ex = await import("/access-practice-lab/src/book/export.js");
     const sp = await import("/access-practice-lab/src/book/lang/supports.js");
     const b = m.normalizeBook({ title: "S", plan: { profile: 3, intensity: "heavy" }, pages: [{ id: "page0001", elements: [] }],
       supports: [sp.makeSupport("frame", "starter", { title: "TEACHER ONLY" }), sp.makeSupport("vocab", "bank", { title: "FOR READERS", inPublished: true, content: { words: [{ w: "clue" }] } })],
       work: { revisions: [{ elementId: "e1", before: "a", after: "b" }] } });
     const { url } = await ex.shareLink(b);
     const back = await ex.readShared("#b=" + url.split("#b=")[1]);
     return { titles: back.supports.map((s) => s.title), profile: back.plan.profile, rev: back.work.revisions.length };`,
  );
  ok(
    shared.titles.join() === "FOR READERS" && shared.profile === 0 && shared.rev === 0,
    `a share link carries only allowed supports (${shared.titles.join()})`,
  );

  // ── 9. old books (schema 2) open unchanged ──
  const oldId = await withBook(
    page,
    `const s = await db.saveBook({ schema: 2, title: "Old book", format: "landscape", lang: "es", pages: [{ id: "oldpage001", bg: "#fffaf0", elements: [{ id: "oldel00001", type: "text", html: "<p>Hola, mundo</p>", x: 10, y: 10, w: 50, h: 20 }] }] });
     return s.id;`,
  );
  await page.goto(`${origin}${LAB}/book-studio/edit/${oldId}`);
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  ok(
    (await page.locator(".bk-canvas .bk-txt").first().innerText()).includes("Hola, mundo"),
    "a book saved before the upgrade opens with its words intact",
  );
  await page.goto(`${origin}${LAB}/book-studio/read/${oldId}`);
  await page.waitForSelector(".bk-reader .bk-page");
  ok(true, "and reads in the reader");

  // ── 10. teacher workspace and story map open ──
  await page.goto(`${origin}${LAB}/book-studio/teacher`);
  await page.waitForSelector("[data-t-create]");
  ok(
    (await page.locator('[name="pack"]').count()) >= 5,
    "the teacher workspace offers support packs for a differentiated assignment",
  );
  await page.fill('[data-t-create] [name="title"]', "Mystery assignment");
  await page.locator("[data-t-create] button[type=submit]").click();
  await page.waitForSelector(".bk-sp-dialog[open] .bk-sp-row", { timeout: 15000 });
  const n = await page.locator(".bk-sp-row").count();
  ok(
    n >= 6,
    `the new assignment opens in the Support Studio with its starter pack supports (${n})`,
  );
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "support-studio.png") });

  // ── 11. every authoring surface opens and works: characters, choices, clues, coach, publish, library, designer ──
  await page.goto(`${origin}${LAB}/book-studio/edit/${id}`);
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.locator(".bk-page-item .bk-thumb").nth(1).click();
  await page.locator('[data-stage="imagine"]').click();
  await page.locator('[data-dock="characters"]').click();
  await page.waitForSelector(".bk-st-dialog[open]");
  await page.locator('[data-st="new-char"]').click();
  await page.waitForSelector(".bk-char-form");
  await page.fill('[data-c="name"]', "Mia");
  await page.locator('[data-st="done-char"]').click();
  await page.locator('[data-st="place"]').first().click();
  await page.waitForSelector(".bk-canvas [data-char]");
  ok(
    (await page.locator(".bk-canvas [data-char]").count()) === 1,
    "a character is made once and placed on the page",
  );
  await page.locator('[data-dock="items"]').click();
  await page.waitForSelector('[data-st="add-item"]');
  await page.locator('[data-st="add-item"]').click();
  await page.locator('[data-it="name"]').first().fill("Brass key");
  await page.keyboard.press("Escape");
  await page.locator(".bk-canvas [data-char]").first().click();
  await page.locator('[data-dock="hotspot"]').click();
  await page.waitForSelector('[data-hs="label"]');
  await page.fill('[data-hs="label"]', "Mia's key");
  await page.selectOption('[data-hs="give"]', { index: 1 });
  await page.fill('[data-hs="reveal"]', "The key fits the hidden door.");
  await page.locator('[data-st="save-hs"]').click();
  await page.waitForTimeout(1200);
  const hs = await withBook(
    page,
    `const b = await db.getBook(arg); const el = b.pages[1].elements.find((e) => e.hotspot); return el && el.hotspot;`,
    id,
  );
  ok(
    hs?.give && hs.reveal.includes("hidden door"),
    "a clickable clue saves with the author's own explanation",
  );
  await page.locator('[data-dock="choices"]').click();
  await page.waitForSelector('[data-ch="label"]');
  await page.locator('[data-ch="label"]').first().fill("Open the door");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
  const lab = await withBook(
    page,
    `const b = await db.getBook(arg); return b.pages[1].choices.map((c) => c.label);`,
    id,
  );
  ok(lab[0] === "Open the door", "choice words are saved");

  await page.locator('[data-stage="improve"]').click();
  await page.waitForSelector("[data-coach-el]");
  await page.locator('[data-dock="coach-ask"]').click();
  await page.waitForSelector(".bk-coach-q");
  ok(
    (await page.locator(".bk-coach-q strong").innerText()).includes("?"),
    "the coach asks a question instead of rewriting",
  );
  await page.fill("[data-coach-rev]", "The fox froze when it heard footsteps.");
  await page.locator('[data-dock="coach-apply"]').click();
  await page.waitForTimeout(1200);
  const rev = await withBook(
    page,
    `const b = await db.getBook(arg); return b.work.revisions.map((r) => [r.by, r.before, r.after]);`,
    id,
  );
  ok(
    rev.at(-1)?.[0] === "student" &&
      rev.at(-1)[1].includes("scared") &&
      rev.at(-1)[2].includes("froze"),
    "the original and the student's revision are both kept, labelled as the student's",
  );

  await page.locator('[data-stage="publish"]').click();
  await page.locator('[data-dock-aud][value="class"]').check();
  ok(
    (await page.locator(".bk-dock .bk-warn").count()) === 1,
    "sharing with a class needs a teacher's approval first",
  );
  await page.locator('[data-stage="create"]').click();

  // the Support Studio: library search, packs, designer, plans and groups
  if ((await page.locator('[data-bk-act="teacher"]').getAttribute("aria-pressed")) !== "true")
    await page.locator('[data-bk-act="teacher"]').click();
  await page.locator('[data-dock="studio"]').click();
  await page.waitForSelector(".bk-sp-dialog[open] .bk-sp-tabs");
  const before = await page.locator(".bk-sp-row").count();
  await page.locator('[data-spx="tab"][data-tab="library"]').click();
  await page.fill("[data-spx-q]", "Cause and effect, grade 6, WIDA Level 2");
  await page.waitForTimeout(500);
  const hits = await page.locator(".bk-sp-lib").count();
  ok(hits >= 1, `the library answers “Cause and effect, grade 6, WIDA Level 2” (${hits})`);
  await page.locator('[data-spx="lib-page"]').first().click();
  await page.locator('[data-spx="tab"][data-tab="manage"]').click();
  ok(
    (await page.locator(".bk-sp-row").count()) === before + 1,
    "Add to this page puts the library support in the book",
  );
  await page.locator('[data-spx="tab"][data-tab="packs"]').click();
  await page.locator('[data-spx="pack-book"]').first().click();
  await page.locator('[data-spx="tab"][data-tab="designer"]').click();
  await page.fill("[data-dz-text]", "Add Level 1 and 2 sentence starters to the first two pages.");
  await page.locator('[data-spx="dz-plan"]').click();
  await page.waitForSelector("[data-spx='dz-apply']");
  ok(
    (await page.locator("[data-dz-inc]").count()) >= 2,
    "Design Language Supports previews exactly which pages change before adding",
  );
  await page.locator('[data-spx="dz-apply"]').click();
  await page.waitForSelector(".bk-sp-row");
  await page.locator('[data-spx="tab"][data-tab="plan"]').click();
  await page.locator('[data-spx="group-add"]').click();
  await page.waitForSelector("[data-pg]");
  const dl = page.waitForEvent("download");
  await page.locator('[data-spx="group-export"]').first().click();
  const file = await dl;
  ok(file.suggestedFilename().endsWith(".langbook"), "a group copy exports for just that group");
  await page.keyboard.press("Escape");

  // a vocabulary support through the builder, with a suggested word list
  await page.locator('[data-dock="add-support"]').click();
  await page.waitForSelector(".bk-sp-form");
  await page.selectOption('[data-f="typekind"]', "vocab:bank");
  await page.locator('[data-spx="suggest-words"]').click();
  ok(
    (await page.locator(".bk-sp-wordrow").count()) >= 1,
    "words are suggested from the selected content for the teacher to complete",
  );
  await page.locator('[data-wf="0.def"]').first().fill("Not safe");
  await page.locator('[data-spx="save"]').click();
  await page.waitForFunction(() => !document.querySelector(".bk-sp-dialog[open]"));

  // ── 12. tablet and phone: nothing overflows sideways; mobile reading works; axe on the new pages ──
  await page.waitForTimeout(1500); // let the editor finish saving so leaving it raises no unsaved-changes prompt
  for (const [w, h, label] of [
    [768, 1024, "tablet"],
    [390, 844, "phone"],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    for (const path of [
      `/book-studio`,
      `/book-studio/edit/${id}`,
      `/book-studio/play/${playId}`,
      `/book-studio/read/${playId}`,
      `/book-studio/teacher`,
    ]) {
      await page.goto(`${origin}${LAB}${path}`);
      await page.waitForSelector(".bk-root h1, .bk-reader, [data-bk-editor]", { timeout: 15000 });
      await page.waitForTimeout(500);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      ok(
        over <= 2,
        `${label} ${path.replace(/[a-z0-9]{12,}/i, ":id")}: no sideways overflow (${over}px)`,
      );
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  if (AxeBuilder) {
    for (const [path, sel, name] of [
      [`/book-studio/play/${playId}`, ".bk-play", "play mode"],
      [`/book-studio/teacher`, ".bk-teacher", "teacher workspace"],
      [`/book-studio`, ".bk-modes", "creation modes"],
    ]) {
      await page.goto(`${origin}${LAB}${path}`);
      await page.waitForSelector(sel, { timeout: 15000 });
      await page.waitForTimeout(400);
      const axe = await new AxeBuilder({ page }).include(sel).analyze();
      const bad = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact));
      ok(
        bad.length === 0,
        `axe: ${name} has no serious/critical violations ${bad.map((v) => `${v.id}(${v.nodes.length})`).join(",")}`,
      );
    }
    await page.goto(`${origin}${LAB}/book-studio/edit/${id}`);
    await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
    await page.locator('[data-stage="life"]').click();
    const axe = await new AxeBuilder({ page }).include("[data-bk-dock]").analyze();
    const bad = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    ok(
      bad.length === 0,
      `axe: the animation dock has no serious/critical violations ${bad.map((v) => `${v.id}(${v.nodes.length})`).join(",")}`,
    );
  }
} catch (error) {
  failures.push(`crashed: ${error.message}`);
  console.log(`FAIL crashed: ${error.stack || error.message}`);
} finally {
  await browser.close();
  server?.close();
}
ok(
  errors.length === 0,
  `no page errors${errors.length ? ` ${errors.slice(0, 3).join(" | ")}` : ""}`,
);
console.log(
  failures.length
    ? `\nbook-studio-2-e2e: ${failures.length} FAILED`
    : "\nbook-studio-2-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);
