#!/usr/bin/env node
/**
 * Book Studio "Writing together", driven by two learners in two separate browsers (access-practice-lab/BOOK-STUDIO.md).
 * The lab is served statically from this working tree and /api/class/* runs the REAL class-platform handler in-process
 * over node:sqlite (the D1 stand-in the route tests use), so nothing is stubbed: share → join by code → each sees the
 * other (presence bar + soft lock) → concurrent new text boxes both survive → the same box edited by both converges on
 * one predictable result → the teacher sets the book read-only and the server refuses the next edit → without the
 * class server (503) the editor still works solo and says collaboration is unavailable. axe on the editor and the
 * shelf; screenshots at 1280 and 390 px.
 *   node tools/book-collab-e2e.mjs [--shots <dir>]
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { onRequest } from "../functions/api/class/[[path]].js";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("book-collab-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
const LAB = "/access-practice-lab";
const KEY = "e2e-teacher-key";

/* ── D1 stand-in (same adapter as functions/api/class/*.test.mjs) ── */
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
let apiOff = false; // flips the endpoint to "no D1" for the degradation check

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
  // Each browser context is one "device"; give it its own address so per-IP limits behave like a classroom.
  headers.set("CF-Connecting-IP", headers.get("x-e2e-ip") || `10.9.0.${(clientN++ % 200) + 1}`);
  const request = new Request(`https://lab.test${url.pathname}${url.search}`, {
    method: req.method,
    headers,
    ...(req.method === "GET" || req.method === "HEAD" ? {} : { body }),
  });
  const path = url.pathname.replace(/^\/api\/class\/?/, "").split("/");
  const out = await onRequest({ request, env: apiOff ? {} : env, params: { path } });
  const buf = Buffer.from(await out.arrayBuffer());
  const h = {};
  out.headers.forEach((v, k) => {
    h[k] = v;
  });
  res.writeHead(out.status, h);
  res.end(buf);
}
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.startsWith("/api/class/")) {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () =>
        api(req, res, Buffer.concat(chunks)).catch((e) => {
          console.error(e);
          res.writeHead(500);
          res.end();
        }),
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
const server = await serve();
const origin = `http://localhost:${server.address().port}`;
const call = async (path, { body, headers = {} } = {}) => {
  const r = await fetch(`${origin}/api/class/${path}`, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json", ...headers },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return r.json();
};

const browser = await chromium.launch();
const errors = [];
const watch = (page, who) => {
  page.on(
    "pageerror",
    (e) => !/web-vitals/.test(String(e)) && errors.push(`${who}: ${e.stack || e}`),
  );
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/favicon|404|503|net::ERR_|Failed to load resource|web-vitals/.test(m.text()) &&
      errors.push(`${who}: ${m.text()}`),
  );
  page.on("dialog", (d) => d.dismiss());
};
async function axe(page, include, label) {
  if (!AxeBuilder) return;
  await page.waitForFunction(() => !document.querySelector(".is-entering"));
  await page.waitForTimeout(300);
  const r = await new AxeBuilder({ page })
    .include(include)
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(
    bad.length === 0,
    `axe: ${label} has no serious/critical violations ${bad.map((v) => `${v.id} ${v.nodes.map((n) => n.target).join(",")}`).join(" ")}`,
  );
}
const canvasText = (page) => page.locator(".bk-canvas").innerText();

try {
  // ── a class with two learners (the real join route) ──
  const cls = await call("create", {
    body: { app: "language", title: "Room 12" },
    headers: { "x-teacher-key": KEY },
  });
  const ana = await call("join", { body: { code: cls.code, alias: "Ana" } });
  const ben = await call("join", { body: { code: cls.code, alias: "Ben" } });
  ok(!!(ana.studentKey && ben.studentKey), "two learners joined the class");
  const linkFor = (s) => ({
    code: cls.code,
    studentId: s.studentId,
    studentKey: s.studentKey,
    alias: s.alias,
    title: "Room 12",
  });

  const device = async (s, ip, viewport = { width: 1280, height: 860 }) => {
    const context = await browser.newContext({ viewport, extraHTTPHeaders: { "x-e2e-ip": ip } });
    await context.addInitScript((link) => {
      try {
        localStorage.setItem("accessPracticeLabClass:v1:link", JSON.stringify(link));
      } catch {}
    }, linkFor(s));
    const page = await context.newPage();
    watch(page, s.alias);
    return { context, page };
  };
  const A = await device(ana, "10.9.1.1");
  const B = await device(ben, "10.9.1.2");

  // ── Ana makes a book and shares it with the class ──
  await A.page.goto(`${origin}${LAB}/book-studio/new?template=personal-narrative&grades=6-8`);
  await A.page.fill('input[name="title"]', "Our Field Trip");
  await A.page.fill('input[name="author"]', "Ana and Ben");
  await A.page.click('form[data-create] button[type="submit"]');
  await A.page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page", { timeout: 15000 });
  await A.page.click('[data-bk-act="share"]');
  await A.page.waitForSelector('[data-bk-dlg="collab-share"]');
  ok(
    (await A.page.locator(".bk-collab-share").innerText()).includes(
      "recordings and videos stay on the device",
    ),
    "Share & export explains that recordings and videos stay on the device",
  );
  await A.page.click('[data-bk-dlg="collab-share"]');
  await A.page.waitForSelector(".bk-collab-code", { timeout: 10000 });
  await A.page.waitForSelector('[data-bk-dlg="collab-unshare"]', { timeout: 10000 });
  ok(
    (await A.page.locator(".bk-collab-members").innerText()).includes("Ana (you) · owner"),
    "the owner sees herself as owner and can stop sharing",
  );
  const bookCode = (await A.page.locator(".bk-collab-code").innerText()).trim();
  ok(/^[A-HJ-NP-Z2-9]{6}$/.test(bookCode), `sharing gives a 6-character book code (${bookCode})`);
  if (SHOTS) await A.page.screenshot({ path: join(SHOTS, "share-dialog-1280.png") });
  await A.page.keyboard.press("Escape");
  await A.page.waitForFunction(
    () => /synced|aquí|here/i.test(document.querySelector("[data-bk-collab]")?.textContent || ""),
    null,
    { timeout: 15000 },
  );
  ok(true, "Ana's editor shows the presence bar (shared with the class)");

  // ── Ben joins by code from his bookshelf ──
  await B.page.goto(`${origin}${LAB}/book-studio?grades=6-8`);
  await B.page.waitForSelector("[data-collab-join] input", { timeout: 15000 });
  if (SHOTS) await B.page.screenshot({ path: join(SHOTS, "shelf-1280.png"), fullPage: true });
  await axe(B.page, ".bk-collab-shelf", "Shared with my class shelf");
  await B.page.fill("[data-collab-join] input", bookCode.toLowerCase());
  await B.page.click('[data-collab-join] button[type="submit"]');
  await B.page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page", { timeout: 15000 });
  const pagesA = await A.page.locator(".bk-page-item").count();
  await B.page.waitForFunction(
    (n) => document.querySelectorAll(".bk-page-item").length === n,
    pagesA,
    { timeout: 10000 },
  );
  ok(
    (await B.page.locator("[data-bk-title]").inputValue()) === "Our Field Trip",
    "Ben's copy has the shared title",
  );
  ok(
    (await B.page.locator(".bk-page-item").count()) === pagesA,
    `Ben's copy has all ${pagesA} pages`,
  );

  // ── presence: each sees the other ──
  await A.page.waitForSelector("[data-bk-collab] .bk-peer", { timeout: 10000 });
  await B.page.waitForSelector("[data-bk-collab] .bk-peer", { timeout: 10000 });
  const peerA = await A.page.locator("[data-bk-collab] .bk-peer").first().textContent();
  ok(peerA.includes("BE") && peerA.includes("Ben"), `Ana sees Ben's initials and name (${peerA})`);
  const peerB = await B.page.locator("[data-bk-collab] .bk-peer").first().textContent();
  ok(peerB.includes("AN") && peerB.includes("Ana"), `Ben sees Ana's initials and name (${peerB})`);

  // ── soft lock: Ben selects the title; Ana sees it outlined with his name ──
  await B.page.click(".bk-canvas .bk-t-text[data-role=title]");
  await A.page.waitForSelector('.bk-canvas .bk-el[data-bk-peer="Ben"]', { timeout: 10000 });
  ok(true, "Ana sees a soft-lock outline with Ben's name on the box he selected");
  await B.page.keyboard.press("Escape");

  // ── concurrent new text boxes on the same page: both survive ──
  const addText = async (page, words) => {
    await page.click('[data-bk-add="text"]');
    await page.keyboard.type(words);
    await page.keyboard.press("Escape");
  };
  const t0 = Date.now();
  await Promise.all([
    addText(A.page, "Ana saw the river."),
    addText(B.page, "Ben saw the bridge."),
  ]);
  const both = (page) =>
    page.waitForFunction(
      () => {
        const t = document.querySelector(".bk-canvas")?.innerText || "";
        return t.includes("Ana saw the river.") && t.includes("Ben saw the bridge.");
      },
      null,
      { timeout: 15000 },
    );
  await Promise.all([both(A.page), both(B.page)]);
  const secs = (Date.now() - t0) / 1000;
  ok(
    true,
    `concurrent edits to different boxes both appear on both devices (${secs.toFixed(1)} s)`,
  );
  ok(secs < 12, "both devices see each other's edits within a few seconds");
  if (SHOTS) {
    await A.page.screenshot({ path: join(SHOTS, "editor-ana-1280.png") });
    await B.page.screenshot({ path: join(SHOTS, "editor-ben-1280.png") });
  }
  await axe(A.page, "[data-bk-editor]", "editor with the presence bar");

  // ── the same box edited on both devices: one predictable result, the same everywhere ──
  const retitle = async (page, words) => {
    // Keyboard path (focus, Enter) — the same as a keyboard-only learner; a classmate's presence outline sits over the box.
    await page
      .locator(".bk-canvas .bk-t-text", { hasText: /saw the river|Title by/ })
      .first()
      .focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(words);
    await page.keyboard.press("Escape");
  };
  await retitle(A.page, "Title by Ana");
  await retitle(B.page, "Title by Ben");
  // Book Studio 2.0 binds the cover title and byline, so the shared box is the text box Ana added above.
  const titleOf = (page) =>
    page
      .locator(".bk-canvas .bk-t-text", { hasText: /saw the river|Title by/ })
      .first()
      .innerText();
  await A.page.waitForTimeout(6500);
  const [ta, tb] = [await titleOf(A.page), await titleOf(B.page)];
  ok(ta === tb, `the same box converges on both devices ("${ta}" / "${tb}")`);
  ok(/Title by (Ana|Ben)/.test(ta), "the result is one learner's whole text, never a mix");
  const list = await call(`books/class?code=${cls.code}`, { headers: { "x-teacher-key": KEY } });
  const book = list.books[0];
  ok(
    book?.members.find((m) => m.alias === "Ben")?.edits > 0,
    "edits are attributed per learner on the server",
  );

  // ── teacher: read-only blocks edits server-side ──
  await call("books/lock", {
    body: { code: cls.code, bookId: book.bookId, locked: true },
    headers: { "x-teacher-key": KEY },
  });
  await B.page.waitForSelector("[data-bk-editor][data-readonly]", { timeout: 10000 });
  ok(
    (await B.page.locator("[data-bk-collab]").innerText()).includes("read-only"),
    "Ben's bar says the teacher set the book read-only",
  );
  const before = await canvasText(A.page);
  const attempt = await call("books/sync", {
    body: {
      code: cls.code,
      bookId: book.bookId,
      since: 0,
      ops: [{ type: "setMeta", baseRev: 9999, data: { title: "Hacked title" }, fields: ["title"] }],
    },
    headers: { "x-class-student": `${ben.studentId}.${ben.studentKey}` },
  });
  ok(
    attempt.results?.[0]?.reason === "read-only",
    "the server refuses an edit to a read-only book",
  );
  await A.page.waitForTimeout(2500);
  ok(
    (await A.page.locator("[data-bk-title]").inputValue()) === "Our Field Trip",
    "the refused edit never reached Ana",
  );
  ok((await canvasText(A.page)) === before, "Ana's page is unchanged");
  if (SHOTS) await B.page.screenshot({ path: join(SHOTS, "readonly-ben-1280.png") });
  await call("books/lock", {
    body: { code: cls.code, bookId: book.bookId, locked: false },
    headers: { "x-teacher-key": KEY },
  });

  // ── phone width ──
  await B.page.waitForFunction(
    () => !document.querySelector("[data-bk-editor][data-readonly]"),
    null,
    { timeout: 10000 },
  );
  ok(true, "turning read-only off gives Ben editing back");
  await B.page.setViewportSize({ width: 390, height: 844 });
  await B.page.waitForTimeout(600);
  await B.page.locator("[data-bk-collab]").scrollIntoViewIfNeeded();
  const sideways = await B.page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  ok(!sideways, "390 px: the editor with the presence bar does not scroll sideways");
  if (SHOTS) await B.page.screenshot({ path: join(SHOTS, "editor-ben-390.png") });

  // ── without the class server: solo Book Studio keeps working and says why ──
  apiOff = true;
  await A.page.reload();
  await A.page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page", { timeout: 15000 });
  await A.page.waitForFunction(
    () => /not available/i.test(document.querySelector("[data-bk-collab]")?.textContent || ""),
    null,
    { timeout: 15000 },
  );
  ok(true, "503: the bar says writing together is not available");
  await addText(A.page, "Still works alone.");
  await A.page.waitForFunction(
    () => document.querySelector("[data-bk-save]")?.dataset.state === "saved",
    null,
    { timeout: 8000 },
  );
  ok(
    (await canvasText(A.page)).includes("Still works alone."),
    "503: the book still edits and saves on the device",
  );
  apiOff = false;

  await A.context.close();
  await B.context.close();
} catch (error) {
  failures.push(`crashed: ${error.stack || error}`);
  console.log(`FAIL crashed: ${error.stack || error}`);
} finally {
  await browser.close();
  server.close();
}
ok(errors.length === 0, `no page errors ${errors.slice(0, 5).join(" | ")}`);
console.log(
  failures.length
    ? `\nbook-collab-e2e: ${failures.length} FAILED`
    : "\nbook-collab-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);
