#!/usr/bin/env node
/**
 * Language Page Playwright crawler (reusable for baseline and after-state runs).
 *
 *   node reports/language-page-quality/tools/crawl.mjs [options]
 *     --inventory <file>   inventory.json written by enumerate.mjs        (default: ../inventory.json)
 *     --out <file>         machine-readable results                       (default: ../crawl-baseline.json)
 *     --shots <dir>        where representative screenshots go            (default: ../screenshots/before)
 *     --widths 390,768,1280
 *     --axe-widths 390,1280
 *     --only <substring>   run only targets whose id contains it
 *     --limit <n>          cap number of targets (smoke runs)
 *     --concurrency <n>    parallel pages (default 4)
 *     --update             merge into an existing --out file (replace results with the same id) and recompute the summary
 *     --no-shots / --no-axe / --no-interact
 *     --base <url>         crawl an already-running server instead of the built-in static server (e.g. vite dev/preview)
 *     --root <dir>         repo root to serve (default: repo containing this script) - point it at a worktree for "after" runs
 *
 * Serving: the lab is plain ES modules + static JSON, so no build is needed. The built-in server mirrors
 * tools/access-axe-sweep.mjs: static files, directory index.html, and the Cloudflare _redirects rule
 * `/access-practice-lab/* -> /access-practice-lab/index.html` for extensionless routes. Service workers are blocked so
 * a stale precache can never mask a regression.
 *
 * Per target and width: console/page errors and failed requests, horizontal overflow, interactive targets under 44px
 * (and under 24px = WCAG 2.2 AA minimum), heading/landmark/lang/alt sanity, axe (WCAG 2.0/2.1/2.2 A+AA tags).
 * Once per target at the widest width, a minimal interaction: activity pages click "Check my answer" empty, answer the first
 * control, check again, and record the text that appeared; other pages Tab three times and record whether focus is visible
 * and click the first primary call to action. Only observed facts are recorded.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const HERE = import.meta.dirname;
const OUT_DIR = path.resolve(HERE, "..");
const argv = process.argv.slice(2);
const opt = (n, d) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const flag = (n) => argv.includes(`--${n}`);
const ROOT = path.resolve(opt("root", path.resolve(OUT_DIR, "../..")));
const INVENTORY = opt("inventory", path.join(OUT_DIR, "inventory.json"));
const OUT = opt("out", path.join(OUT_DIR, "crawl-baseline.json"));
const SHOTS = opt("shots", path.join(OUT_DIR, "screenshots/before"));
const WIDTHS = opt("widths", "390,768,1280").split(",").map(Number);
const AXE_WIDTHS = opt("axe-widths", "390,1280").split(",").map(Number);
const ONLY = opt("only", "");
const LIMIT = Number(opt("limit", 0));
const CONC = Number(opt("concurrency", 4));
const EXT_BASE = opt("base", "");
const DO_SHOTS = !flag("no-shots");
const DO_AXE = !flag("no-axe");
const DO_INTERACT = !flag("no-interact");
const BASE = "/access-practice-lab";

// representative screenshots: one per distinct template (390 and 1280)
const REP_SHOTS = new Set(["home", "tpl-6-8-multipleChoice", "tpl-6-8-constructed", "tpl-3-5-sort", "tpl-g1-multipleChoice", "speak", "deep-speak", "deep-write", "deep-missions", "tests", "deep-tests", "deep-reading-room",
  "deep-city", "deep-scenarios", "book-studio", "language-adventures:hub", "wida-access:hub", "family-corner", "teacher-hub", "deep-detective"]);
const MAX_SHOTS = 12;
const REP_ORDER = ["home", "tpl-6-8-multipleChoice", "tpl-6-8-constructed", "tpl-3-5-sort", "tpl-g1-multipleChoice", "deep-speak", "deep-write", "deep-missions", "deep-tests", "deep-reading-room", "deep-city",
  "deep-scenarios", "book-studio", "language-adventures:hub", "wida-access:hub", "family-corner", "teacher-hub"];

// ----------------------------------------------------------------------------------------------- static server
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".mp3": "audio/mpeg", ".webmanifest": "application/manifest+json", ".txt": "text/plain", ".pdf": "application/pdf" };
function startServer() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = path.join(ROOT, p);
    const isDir = fs.existsSync(file) && fs.statSync(file).isDirectory();
    if (isDir) file = path.join(file, "index.html");
    if (!fs.existsSync(file) && fs.existsSync(path.join(ROOT, "public", p))) file = path.join(ROOT, "public", p);
    if (!fs.existsSync(file)) {
      if (/^\/access-(practice-lab|teacher)\//.test(p) && !/\.[a-z0-9]+$/i.test(p)) file = path.join(ROOT, p.startsWith("/access-teacher") ? "access-teacher/index.html" : "access-practice-lab/index.html");
      else return res.writeHead(404), res.end("not found");
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, () => r(server)));
}

// ----------------------------------------------------------------------------------------------- targets
function buildTargets(inv) {
  const T = [];
  const seen = new Set();
  const add = (t) => { if (!seen.has(t.id) && t.url) { seen.add(t.id); T.push(t); } };
  // routes that are not site-map destinations: the lab home per band and the unknown-route page
  add({ id: "home", family: "home", url: `${BASE}/`, kind: "route", interact: "page" });
  add({ id: "home-35", family: "home", url: `${BASE}/?grades=3-5`, kind: "route", interact: "page" });
  add({ id: "not-found", family: "not-found", url: `${BASE}/NoSuchRoom`, kind: "route", interact: "page" });
  for (const f of inv.families) for (const [i, u] of (f.probe || []).entries()) add({ id: i ? `${f.id}#${i}` : f.id, family: f.id, url: u, kind: "family-probe", interact: /\/(Listening|Reading|Speaking|Writing)\/[ABC]\//.test(u) ? "activity" : "page" });
  // one probe per distinct item template of the core bank, per band (first activity of each type)
  const bands = ["K", "1", "2-3", "3-5", "6-8"];
  for (const b of bands) {
    const seenType = new Set();
    for (const a of inv.activities.filter((x) => x.family?.startsWith("core-") && x.gradeBand === b)) {
      if (seenType.has(a.type)) continue;
      seenType.add(a.type);
      add({ id: `tpl-${b === "K" ? "gK" : b === "1" ? "g1" : b}-${a.type}`, family: a.family, url: a.url, kind: "template-probe", activityType: a.type, interact: "activity" });
    }
  }
  // one deep probe per other family (first enumerated item), so detail templates are exercised not just hubs
  const doneFam = new Set();
  for (const a of inv.activities) {
    if (a.family?.startsWith("core-") || doneFam.has(a.family) || !a.url || a.testable === false) continue;
    doneFam.add(a.family);
    add({ id: `deep-${a.family}`, family: a.family, url: a.url, kind: "deep-probe", interact: /\/test\//.test(a.url) ? "page" : "page" });
  }
  return T;
}

// ----------------------------------------------------------------------------------------------- in-page measurement
const MEASURE = () => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  const vw = window.innerWidth;
  const offenders = [];
  for (const e of document.querySelectorAll("body *")) {
    if (offenders.length >= 4) break;
    const r = e.getBoundingClientRect();
    if (r.width > 0 && r.right > vw + 2 && vis(e) && !e.closest("[hidden],.visually-hidden,.sr-only") ) {
      let p = e.parentElement, clipped = false;
      while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === "auto" || o === "scroll" || o === "hidden") { clipped = true; break; } p = p.parentElement; }
      if (!clipped) offenders.push(`${e.tagName.toLowerCase()}.${String(e.className).split(" ")[0]} right=${Math.round(r.right)}`);
    }
  }
  const sel = "a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=link],[tabindex='0']";
  const targets = [...document.querySelectorAll(sel)].filter(vis);
  // a visually hidden radio/checkbox is operated through its label: measure the label's box
  const box = (e) => { const l = /^(radio|checkbox)$/.test(e.type) ? (e.labels && e.labels[0]) || e.closest("label") : null; return (l || e).getBoundingClientRect(); };
  const small = (n) => targets.filter((e) => { const r = box(e); return Math.min(r.width, r.height) < n && !(e.tagName === "A" && e.closest("p,li") && getComputedStyle(e).display === "inline"); });
  const small44 = small(44), small24 = small(24);
  const main = document.querySelector("main");
  return {
    title: document.title, lang: document.documentElement.lang, h1: document.querySelectorAll("h1").length, hasMain: !!main,
    landmarks: ["header", "nav", "main", "footer"].filter((t) => document.querySelector(t)).length,
    overflowX: document.documentElement.scrollWidth > vw + 1, scrollWidth: document.documentElement.scrollWidth, overflowOffenders: offenders,
    interactive: targets.length, under44: small44.length, under24: small24.length,
    under24Samples: small24.slice(0, 3).map((e) => `${e.tagName.toLowerCase()}:${(e.getAttribute("aria-label") || e.innerText || e.className || "").toString().trim().slice(0, 24)}`),
    imgsNoAlt: [...document.images].filter((i) => !i.hasAttribute("alt") && vis(i)).length,
    buttonsNoName: targets.filter((e) => e.tagName === "BUTTON" && !(e.innerText || e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || e.getAttribute("title") || e.querySelector("img[alt],svg title,[aria-label]") || "").toString().trim()).length,
    mainWords: ((main || document.body).innerText.match(/\S+/g) || []).length,
    bodyHeight: document.body.scrollHeight,
  };
};
const MAIN_TEXT = () => (document.querySelector("main") || document.body).innerText;
const LIVE_TEXT = () => [...document.querySelectorAll("[aria-live]:not([aria-live=off]),[role=status],[role=alert]")].filter((e) => e.getClientRects().length).map((e) => (e.innerText || "").trim()).filter(Boolean).slice(0, 4);
const FOCUS_INFO = () => {
  const e = document.activeElement; if (!e || e === document.body) return null;
  const s = getComputedStyle(e); const out = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0; const sh = s.boxShadow && s.boxShadow !== "none";
  return { el: `${e.tagName.toLowerCase()}:${(e.getAttribute("aria-label") || e.innerText || "").trim().slice(0, 24)}`, visibleIndicator: out || !!sh };
};
const newLines = (before, after) => { const b = new Set(before.split("\n").map((x) => x.trim())); return after.split("\n").map((x) => x.trim()).filter((x) => x && !b.has(x)); };

async function interactActivity(page) {
  const r = { kind: "activity" };
  await page.getByRole("button", { name: /Got it, let me try/i }).first().click({ timeout: 1500 }).catch(() => {});
  await page.waitForTimeout(300);
  const check = page.getByRole("button", { name: /^(Check|Submit)/i }).first();
  r.hasCheckButton = await check.count().then((n) => n > 0);
  const t0 = await page.evaluate(MAIN_TEXT);
  r.checkDisabledUntilAnswer = r.hasCheckButton ? await check.isDisabled().catch(() => false) : null;
  if (r.hasCheckButton && !r.checkDisabledUntilAnswer) {
    await check.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(250);
    const t1 = await page.evaluate(MAIN_TEXT);
    r.emptyCheck = { newText: newLines(t0, t1).slice(0, 4), live: await page.evaluate(LIVE_TEXT) };
  }
  // answer: textarea, else hot-text sentence, else sort rows, else cloze selects, else first choice; ordering items are checked in their given order
  let answered = "none";
  const ta = page.locator("main textarea").first();
  if (await ta.count() && await ta.isVisible().catch(() => false)) { await ta.fill("The school garden has many plants and the students water them every day.").catch(() => {}); answered = "textarea"; }
  else if (await page.locator("main button.hot").count()) { await page.locator("main button.hot").first().click({ timeout: 1500 }).catch(() => {}); answered = "hot-text"; }
  else if (await page.locator("main .sort-row").count()) {
    const rows = page.locator("main .sort-row");
    for (let i = 0; i < await rows.count(); i++) await rows.nth(i).locator(".sort-cats label, .sort-cats input, .sort-cats button").first().click({ timeout: 800 }).catch(() => {});
    answered = "sort-rows";
  } else if (await page.locator("main select:not(.voice-select)").count()) {
    const sels = page.locator("main select:not(.voice-select)");
    for (let i = 0; i < await sels.count(); i++) await sels.nth(i).selectOption({ index: 1 }).catch(() => {});
    answered = "cloze-select";
  } else if (await page.locator("main label.choice, main .choice input, main button.early-pick").count()) { await page.locator("main label.choice, main .choice input, main button.early-pick").first().click({ timeout: 1500 }).catch(() => {}); answered = "choice"; }
  else if (await page.locator("main [class*=order] li, main .order-item").count()) answered = "default-order";
  r.answered = answered;
  if (r.hasCheckButton) {
    const before = await page.evaluate(MAIN_TEXT);
    r.secondCheckClicked = await page.getByRole("button", { name: /^(Check|Submit)/i }).first().click({ timeout: 2000 }).then(() => true).catch(() => false);
    await page.waitForTimeout(400);
    const after = await page.evaluate(MAIN_TEXT);
    const nl = newLines(before, after);
    r.afterCheck = { newText: nl.slice(0, 8), newWords: nl.join(" ").split(/\s+/).filter(Boolean).length, live: await page.evaluate(LIVE_TEXT) };
    r.retryOffered = /try again|retry|another try|revise|change your/i.test(after);
    r.nextOffered = /\bnext\b|continue|finish|done/i.test(after);
    r.bareVerdict = nl.length > 0 && nl.join(" ").split(/\s+/).filter(Boolean).length < 6;
  }
  r.state = r.afterCheck ? (r.afterCheck.newWords >= 6 ? "feedback-shown" : r.afterCheck.newWords ? "terse-feedback" : "no-visible-feedback") : r.hasCheckButton ? "answer-not-possible" : "no-check-button";
  return r;
}
async function interactPage(page) {
  const r = { kind: "page" };
  const focus = [];
  for (let i = 0; i < 3; i++) { await page.keyboard.press("Tab").catch(() => {}); focus.push(await page.evaluate(FOCUS_INFO)); }
  r.focus = focus.filter(Boolean);
  r.focusVisible = r.focus.length ? r.focus.every((f) => f.visibleIndicator) : null;
  const url0 = page.url(); const t0 = await page.evaluate(MAIN_TEXT);
  const cta = page.locator("main .btn-primary, main button.primary, main .btn.primary, main [class*=cta]").first();
  if (await cta.count() && await cta.isVisible().catch(() => false)) {
    r.cta = ((await cta.innerText().catch(() => "")) || "").trim().slice(0, 40);
    await cta.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(500);
    const t1 = await page.evaluate(MAIN_TEXT);
    r.ctaChangedPage = page.url() !== url0 || t1 !== t0;
    r.state = r.ctaChangedPage ? "cta-responded" : "cta-no-visible-change";
  } else r.state = "no-primary-cta";
  return r;
}

// ----------------------------------------------------------------------------------------------- run one target
async function shotTo(page, file, width) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  for (const q of [60, 45, 32, 22]) {
    const buf = await page.screenshot({ type: "jpeg", quality: q, fullPage: width < 800, clip: width < 800 ? undefined : { x: 0, y: 0, width, height: 900 } }).catch(() => null);
    if (!buf) return null;
    if (buf.length < 290 * 1024 || q === 22) { fs.writeFileSync(file, buf); return { file: path.relative(OUT_DIR, file), bytes: buf.length }; }
  }
}
async function crawlTarget(browser, base, AxeBuilder, t, wantShot) {
  const res = { id: t.id, family: t.family, url: t.url, kind: t.kind, widths: {}, consoleErrors: [], failedRequests: [], pageErrors: [], shots: [] };
  const errs = new Set();
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 }, serviceWorkers: "block", deviceScaleFactor: 1, ...(w < 800 ? { hasTouch: true } : {}) });
    await ctx.addInitScript(() => { try { localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify({ langChosen: true })); } catch {} });
    const page = await ctx.newPage();
    page.on("console", (m) => { if (m.type() === "error" && !/web-vitals|favicon|Failed to load resource/.test(m.text())) { const k = `console: ${m.text().slice(0, 160)}`; if (!errs.has(k)) { errs.add(k); res.consoleErrors.push(m.text().slice(0, 200)); } } });
    page.on("pageerror", (e) => { if (/web-vitals/.test(e.message)) return; /* nt-web-vitals.js needs a bundler: static-server artifact, ignored by every access-*-e2e tool */ const k = `pageerror: ${e.message.slice(0, 160)}`; if (!errs.has(k)) { errs.add(k); res.pageErrors.push(e.message.slice(0, 200)); } });
    page.on("response", (r) => { if (r.status() >= 400 && !errs.has(r.url())) { errs.add(r.url()); res.failedRequests.push(`${r.status()} ${r.url().replace(base, "")}`.slice(0, 200)); } });
    const wr = {};
    try {
      const resp = await page.goto(base + t.url, { waitUntil: "load", timeout: 30000 });
      wr.status = resp?.status();
      await page.waitForSelector("main", { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(500);
      Object.assign(wr, await page.evaluate(MEASURE));
      if (DO_AXE && AXE_WIDTHS.includes(w)) {
        const a = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        wr.axe = { violations: a.violations.length, serious: a.violations.filter((v) => ["serious", "critical"].includes(v.impact)).length, nodes: a.violations.reduce((n, v) => n + v.nodes.length, 0),
          rules: a.violations.map((v) => v.id), detail: a.violations.slice(0, 6).map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes[0]?.target?.join(" ").slice(0, 80) })) };
      }
      if (wantShot && DO_SHOTS && (w === 390 || w === 1280)) { const s = await shotTo(page, path.join(SHOTS, `${t.id.replace(/[^\w.-]+/g, "_")}-${w}.jpg`), w); if (s) res.shots.push(s.file); }
      if (DO_INTERACT && w === Math.max(...WIDTHS)) {
        try { res.interaction = t.interact === "activity" ? await interactActivity(page) : await interactPage(page); } catch (e) { res.interaction = { error: String(e.message).slice(0, 160) }; }
      }
    } catch (e) { wr.error = String(e.message).slice(0, 200); }
    res.widths[w] = wr;
    await ctx.close();
  }
  return res;
}

// ----------------------------------------------------------------------------------------------- main
const inv = JSON.parse(fs.readFileSync(INVENTORY, "utf8"));
let targets = buildTargets(inv).filter((t) => !ONLY || t.id.includes(ONLY));
if (LIMIT) targets = targets.slice(0, LIMIT);
const server = EXT_BASE ? null : await startServer();
const base = EXT_BASE || `http://localhost:${server.address().port}`;
const { chromium } = await import(pathToFileURL(path.join(ROOT, "node_modules/playwright/index.mjs")).href).catch(() => import("playwright"));
const AxeBuilder = (await import(pathToFileURL(path.join(ROOT, "node_modules/@axe-core/playwright/dist/index.mjs")).href).catch(() => import("@axe-core/playwright"))).default;
const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
const shotIds = new Set(); // choose up to MAX_SHOTS representative targets, preferring REP_SHOTS order
for (const id of REP_ORDER) if (shotIds.size < MAX_SHOTS && targets.some((t) => t.id === id)) shotIds.add(id);
console.log(`crawling ${targets.length} targets x ${WIDTHS.join("/")}px at ${base} (concurrency ${CONC}); ${shotIds.size} screenshot targets`);
const results = new Array(targets.length);
let next = 0, done = 0;
async function worker() {
  while (next < targets.length) {
    const i = next++; const t = targets[i];
    results[i] = await crawlTarget(browser, base, AxeBuilder, t, shotIds.has(t.id));
    if (++done % 10 === 0 || done === targets.length) console.log(`  ${done}/${targets.length}`);
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
await browser.close(); server?.close();

// ----------------------------------------------------------------------------------------------- summary
let all = results;
if (flag("update") && fs.existsSync(OUT)) {
  const prev = JSON.parse(fs.readFileSync(OUT, "utf8")).results || [];
  const fresh = new Map(results.map((r) => [r.id, r]));
  all = [...prev.map((r) => fresh.get(r.id) || r), ...results.filter((r) => !prev.some((p) => p.id === r.id))];
}
const W = (r, w) => r.widths?.[w] || {};
const summary = {
  targets: all.length, widths: WIDTHS,
  loadErrors: all.filter((r) => Object.values(r.widths).some((w) => w.error)).map((r) => r.id),
  withConsoleOrPageErrors: all.filter((r) => r.consoleErrors.length || r.pageErrors.length).length,
  overflowByWidth: Object.fromEntries(WIDTHS.map((w) => [w, all.filter((r) => W(r, w).overflowX).map((r) => r.id)])),
  axe: Object.fromEntries(AXE_WIDTHS.map((w) => [w, { pagesWithViolations: all.filter((r) => W(r, w).axe?.violations).length, pagesWithSeriousOrCritical: all.filter((r) => W(r, w).axe?.serious).length,
    ruleCounts: Object.entries(all.flatMap((r) => W(r, w).axe?.rules || []).reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]) }])),
  pagesWithTargetsUnder24at390: all.filter((r) => W(r, 390).under24 > 0).length,
  pagesWithTargetsUnder44at390: all.filter((r) => W(r, 390).under44 > 0).length,
  activityInteractionStates: Object.entries(all.map((r) => r.interaction?.state).filter(Boolean).reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {})),
  focusNotVisible: all.filter((r) => r.interaction?.focusVisible === false).map((r) => r.id),
};
fs.writeFileSync(OUT, JSON.stringify({ schema: 1, base: "(local static server)", root: ROOT, generatedAt: new Date().toISOString(), widths: WIDTHS, summary, results: all }, null, 1) + "\n");
console.log(JSON.stringify(summary, null, 1).slice(0, 3500));
