#!/usr/bin/env node
/**
 * The show lesson books (tools/build-lesson-books.mjs), read and solved the way a student does, in Chromium at 390px.
 *
 * For every book: start reading, turn every page, and at each reader gate
 *   1. answer the first item WRONG and require that item's named feedback (not a generic line),
 *   2. answer every item RIGHT from the spec and require the gate's pass message,
 * then require that the certificate page was reached, every art frame painted, and no console or page error fired.
 * The answers come from the spec, so a gate whose widget cannot accept its own key fails here.
 *
 *   node tools/verify-lesson-books-browser.mjs [6-1 6-2 ...] [--shots=<dir>]
 * A missing browser is a SKIP (exit 3 locally, 1 in CI).
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { bookName, specs } from "./build-lesson-books.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith("--"));
const shots = (args.find((a) => a.startsWith("--shots=")) || "").slice(8);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".webp": "image/webp", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2" };

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP: playwright not installed");
  process.exit(process.env.CI ? 1 : 3);
}

const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = normalize(join(ROOT, p));
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

let browser;
try {
  browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
} catch (e) {
  console.log(`SKIP: no browser (${e.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 3);
}

const WRONG_POINT = new Map();

/** Put one item into its wrong state; returns the feedback the gate must show. */
async function answerWrong(el, it) {
  if (it.type === "choice") {
    const i = it.options.findIndex((o) => !o.ok);
    await el.locator(`button[data-i="${i}"]`).click();
    return it.options[i].fb;
  }
  if (it.type === "number") {
    const f = (it.fb || [])[0];
    await el.locator("input").fill(f ? String(f.eq) : "999999");
    return f ? f.msg : it.fbDefault || "Not yet. Check your steps and try again.";
  }
  if (it.type === "order") {
    for (const id of [...it.answer].reverse()) await el.locator(`button[data-id="${id}"]`).click();
    return it.fb;
  }
  if (it.type === "multi") {
    const i = it.options.findIndex((o) => !o.ok);
    await el.locator(`button[data-i="${i}"]`).click();
    return it.options[i].fb || it.fbExtra;
  }
  if (it.type === "grid") {
    const f = (it.fb || [])[0];
    const p = f ? f.at : [it.answer[0][1], it.answer[0][0]];
    await el.locator(`.gp[data-x="${p[0]}"][data-y="${p[1]}"]`).click();
    if (!it.answer.some((a) => a[0] === p[0] && a[1] === p[1])) WRONG_POINT.set(it, p);
    return f ? f.msg : it.fbDefault || "Not quite. Check each coordinate: x first, then y.";
  }
  if (it.type === "numberline") {
    const f = (it.fb || [])[0];
    const v = f ? f.at : it.answer.value === it.min ? it.max : it.min;
    await el.locator(`.lp[data-v="${v}"]`).click();
    return f ? f.msg : it.fbDefault || "That mark is not in the right place. Check the number again.";
  }
  throw new Error(`unknown item ${it.type}`);
}

async function answerRight(el, it) {
  if (it.type === "choice") return el.locator(`button[data-i="${it.options.findIndex((o) => o.ok)}"]`).click();
  if (it.type === "number") return el.locator("input").fill(String(it.answer));
  if (it.type === "order") {
    for (const b of await el.locator("button[aria-pressed=true]").all()) await b.click();
    for (const id of it.answer) await el.locator(`button[data-id="${id}"]`).click();
    return;
  }
  if (it.type === "multi") {
    for (const [i, o] of it.options.entries()) {
      const b = el.locator(`button[data-i="${i}"]`);
      if ((await b.getAttribute("aria-pressed")) === "true" !== !!o.ok) await b.click();
    }
    return;
  }
  if (it.type === "grid") {
    const wrong = WRONG_POINT.get(it); // tapping a placed point again removes it
    if (wrong) await el.locator(`.gp[data-x="${wrong[0]}"][data-y="${wrong[1]}"]`).click();
    for (const p of it.answer) await el.locator(`.gp[data-x="${p[0]}"][data-y="${p[1]}"]`).click();
    return;
  }
  if (it.type === "numberline") {
    await el.locator(`.lp[data-v="${it.answer.value}"]`).click();
    if (it.inequality) {
      await el.locator(`[data-c="${it.answer.closed ? "closed" : "open"}"]`).click();
      await el.locator(`[data-d="${it.answer.dir}"]`).click();
    }
  }
}

const failures = [];
let books = 0;
const list = specs().filter((s) => !only.length || only.includes(s.lesson));
for (const spec of list) {
  const fail = (m) => failures.push(`${spec.lesson} ${bookName(spec)}: ${m}`);
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  // bare specifiers ("web-vitals", "@engine/...") resolve only in the Vite build; serving source cannot load them
  const SOURCE_ONLY = /Failed to resolve module specifier "(web-vitals|@engine)/;
  page.on("pageerror", (e) => !SOURCE_ONLY.test(e.message) && errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => m.type() === "error" && !/favicon|Failed to load resource.*\/api\//.test(m.text()) && errors.push(`console: ${m.text()}`));
  await page.goto(`${base}/graphic-novels/axiom-city/episodes/${bookName(spec)}.html`);
  await page.locator("#startBtn").click();
  const solved = new Set();
  let certificate = false;
  for (let turn = 0; turn < 40; turn++) {
    if (shots) {
      mkdirSync(shots, { recursive: true });
      await page.screenshot({ path: join(shots, `${spec.lesson}-${String(turn).padStart(2, "0")}.png`), fullPage: false });
    }
    const ids = await page.locator(".gatemount[data-gate]").evaluateAll((ms) => ms.filter((m) => m.offsetParent !== null).map((m) => m.dataset.gate));
    for (const id of ids) {
      if (solved.has(id)) continue;
      const mount = page.locator(`.gatemount[data-gate="${id}"]`).first();
      const gate = spec.gates.find((g) => g.id === id);
      await mount.scrollIntoViewIfNeeded();
      const widgets = mount.locator(".gwidget > *");
      const n = await widgets.count();
      if (n !== gate.items.length) fail(`${id}: ${n} item widgets for ${gate.items.length} items`);
      const want = await answerWrong(widgets.nth(0), gate.items[0]);
      await mount.locator(".gatecheck").first().click();
      const bad = (await mount.locator(".gatefeedback").first().textContent()).trim();
      if (bad !== String(want).replace(/<[^>]+>/g, "").trim()) fail(`${id}: wrong answer showed "${bad}", expected "${want}"`);
      for (let i = 0; i < gate.items.length; i++) await answerRight(widgets.nth(i), gate.items[i]);
      await mount.locator(".gatecheck").first().click();
      // a pass replaces the gate with its SOLVED stamp carrying the pass message
      const stamp = mount.locator(".gatesolved");
      if (await stamp.count()) {
        if (!(await stamp.textContent()).includes(String(gate.pass).replace(/<[^>]+>/g, "").slice(0, 40))) fail(`${id}: solved stamp lacks the pass message`);
      } else fail(`${id}: right answers did not pass ("${(await mount.locator(".gatefeedback").first().textContent()).trim()}")`);
      solved.add(id);
    }
    if (await page.locator("#certificate").isVisible().catch(() => false)) certificate = true;
    const next = page.locator("#nextBtn");
    if (!(await next.isVisible()) || (await next.isDisabled())) break;
    await next.click();
    await page.waitForTimeout(60);
  }
  for (const g of spec.gates) if (!solved.has(g.id)) fail(`gate ${g.id} was never reached`);
  if (!certificate) fail("never reached the certificate page");
  const blank = await page.evaluate(() => [...document.querySelectorAll(".gn-art")].filter((a) => !getComputedStyle(a).backgroundImage.includes("url(")).length);
  if (blank) fail(`${blank} art frames without an image`);
  for (const e of errors) fail(e);
  books++;
  await ctx.close();
}
await browser.close();
server.close();
if (!books) {
  console.error("FAIL: no books checked");
  process.exit(1);
}
if (failures.length) {
  console.error(failures.map((f) => `✗ ${f}`).join("\n"));
  process.exit(1);
}
console.log(`lesson books browser: ${books} book(s) read, every gate failed with its named feedback and passed with its key`);
