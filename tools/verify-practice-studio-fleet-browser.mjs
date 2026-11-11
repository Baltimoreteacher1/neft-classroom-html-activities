#!/usr/bin/env node
/**
 * Practice Studio fleet sweep: every Practice and Challenge studio (67 generated lessons + the 5 hand-built Unit 4 lessons,
 * 144 pages) opened in a real browser at four viewports, with a lesson-by-lesson verification ledger.
 *
 *   node tools/verify-practice-studio-fleet-browser.mjs                 all 144 pages
 *   node tools/verify-practice-studio-fleet-browser.mjs 3-2 9-4         only these lessons
 *   node tools/verify-practice-studio-fleet-browser.mjs --origin URL    test a server that is already running
 *   node tools/verify-practice-studio-fleet-browser.mjs --no-shots      skip screenshots
 *
 * Viewports: 1366x768 (Chromebook), 1024x768, 768x1024 (tablet), 390x844 (phone). At each: the page loads with no page
 * error, five stages show, nothing scrolls sideways, and no visible text is cut off at the right edge or set under 12px.
 * At 1366 it also drives the page the way a student does: every stage opens and shows a task with an answer control; a
 * wrong multiple-choice answer produces feedback; the chosen stage survives a reload; ?lang=es switches the page to
 * Spanish (generated studios). Writes docs/audits/practice-studio/verification-ledger.{md,json} and, unless --no-shots,
 * first-screen screenshots to reports/practice-studio-sweep/ (git-ignored). A missing browser is a SKIP (exit 3).
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const args = process.argv.slice(2);
const flag = (/** @type {string} */ n) => {
  const i = args.indexOf(n);
  return i < 0 ? null : args[i + 1];
};
const wanted = args.filter((a) => /^\d+-\d+$/.test(a));
const SHOTS = !args.includes("--no-shots");
const OUT = "docs/audits/practice-studio";
const SHOT_DIR = join(REPO_ROOT, "reports/practice-studio-sweep");
const VIEWPORTS = [
  { name: "1366", width: 1366, height: 768 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024, touch: true },
  { name: "390", width: 390, height: 844, touch: true },
];
// build-time and server-only noise in a static server: the web-vitals bare specifier (Vite rewrites it) and /api
const NOISE = /web-vitals|\/api\/|favicon|Failed to load resource/i;
const UNIT4 = [
  ["4-1", "percent-practice-studio", "percent-practice-studio-challenging"],
  ["4-2", "4-2-practice-studio", "4-2-practice-studio-challenging"],
  ["4-3", "4-3-practice-studio", "4-3-practice-studio-challenging"],
  ["4-4", "4-4-practice-studio", "4-4-practice-studio-challenging"],
  ["4-5", "4-5-practice-studio", "4-5-practice-studio-challenging"],
];

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  skipExit("verify-practice-studio-fleet-browser: playwright is not installed");
}

/* ---- pages ------------------------------------------------------------------------------------------------------ */
const byId = (/** @type {string} */ a, /** @type {string} */ b) =>
  a.localeCompare(b, undefined, { numeric: true });
const generated = [
  ...new Set(
    [
      ...readFileSync(join(REPO_ROOT, "math/practice-studio/index.html"), "utf8").matchAll(
        /\/math\/practice-studio\/(\d+-\d+)\//g,
      ),
    ].map((m) => m[1]),
  ),
]
  .filter((id) => existsSync(join(REPO_ROOT, `math/practice-studio/${id}/index.html`)))
  .sort(byId);
const pages = [
  ...generated.flatMap((id) => [
    { id, mode: "practice", path: `/math/practice-studio/${id}/`, gen: true },
    { id, mode: "challenge", path: `/math/practice-studio/${id}/challenge/`, gen: true },
  ]),
  ...UNIT4.flatMap(([id, p, c]) => [
    { id, mode: "practice", path: `/math/unit-4/${p}/`, gen: false },
    { id, mode: "challenge", path: `/math/unit-4/${c}/`, gen: false },
  ]),
]
  .filter((p) => !wanted.length || wanted.includes(p.id))
  .sort((a, b) => byId(a.id, b.id) || (a.mode === "practice" ? -1 : 1));
if (!pages.length) {
  console.error("no pages selected");
  process.exit(1);
}

/* ---- a static server over the repo (public/ is the site root's fallback) ---------------------------------------- */
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webp": "image/webp",
};
let server = null;
let origin = flag("--origin");
if (!origin) {
  const root = resolve(REPO_ROOT);
  server = createServer((req, res) => {
    let path = decodeURIComponent(new URL(req.url || "/", "http://x").pathname);
    if (path.endsWith("/")) path += "index.html";
    for (const base of [root, join(root, "public")]) {
      const f = resolve(base, `.${path}`);
      if (f.startsWith(`${root}/`) && existsSync(f) && statSync(f).isFile()) {
        res.writeHead(200, {
          "content-type":
            TYPES[/** @type {keyof typeof TYPES} */ (extname(f))] || "application/octet-stream",
        });
        return void res.end(readFileSync(f));
      }
    }
    res.writeHead(404).end();
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", () => r(null)));
  origin = `http://127.0.0.1:${/** @type {any} */ (server.address()).port}`;
}

let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (e) {
  server?.close();
  skipExit(
    `verify-practice-studio-fleet-browser: no browser (${/** @type {Error} */ (e).message.split("\n")[0]})`,
  );
}
if (SHOTS) mkdirSync(SHOT_DIR, { recursive: true });

/* ---- measurements run inside the page --------------------------------------------------------------------------- */
function layoutProbe() {
  const vw = document.documentElement.clientWidth;
  const visible = (/** @type {Element} */ el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.visibility !== "hidden" && s.display !== "none" && r.width > 0 && r.height > 0;
  };
  const tiny = [];
  const cut = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = (n.textContent || "").trim();
    const el = n.parentElement;
    if (
      !t ||
      !el ||
      el.closest("svg, script, style, .sr-only, [aria-hidden='true'], #nsr-root, .print-only")
    )
      continue;
    if (!visible(el)) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 12) tiny.push(`${t.slice(0, 30)} (${size}px)`);
    const r = el.getBoundingClientRect();
    // text inside its own scroll or clip box (the stage trail, a wide table) is reachable, not cut off the page
    let held = false;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement)
      if (
        getComputedStyle(a).overflowX !== "visible" &&
        a.getBoundingClientRect().right <= vw + 2
      ) {
        held = true;
        break;
      }
    if (!held && r.right > vw + 2 && r.left < vw) cut.push(t.slice(0, 30));
  }
  const tabs = [...document.querySelectorAll(".tab-bar .tab-btn")].filter(visible);
  return {
    sideways: document.documentElement.scrollWidth > vw + 1,
    stages: tabs.map(
      (b) => (b.querySelector(".tab-name .t-en, .tab-name") || b).textContent?.trim() || "",
    ),
    tiny: tiny.slice(0, 5),
    cut: cut.slice(0, 5),
  };
}

/* ---- one page ----------------------------------------------------------------------------------------------------- */
async function checkPage(/** @type {any} */ pg) {
  const rec = {
    ...pg,
    views: /** @type {any} */ ({}),
    stages: [],
    items: [],
    tasks: "",
    feedback: "",
    resume: "",
    spanish: "",
    errors: /** @type {string[]} */ ([]),
  };
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: !!vp.touch,
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => {
      if (!NOISE.test(e.message)) errs.push(e.message);
    });
    page.on("console", (m) => {
      if (m.type() === "error" && !NOISE.test(m.text())) errs.push(m.text());
    });
    const res = await page
      .goto(origin + pg.path, { waitUntil: "load", timeout: 60000 })
      .catch((e) => ({ status: () => `ERR ${e.message}` }));
    await page.waitForTimeout(900);
    const lay = await page.evaluate(layoutProbe);
    const problems = [];
    if (res?.status() !== 200) problems.push(`HTTP ${res?.status()}`);
    if (errs.length) problems.push(`console: ${errs[0].slice(0, 90)}`);
    if (lay.stages.length !== 5) problems.push(`${lay.stages.length} stages visible`);
    if (lay.sideways) problems.push("scrolls sideways");
    if (lay.cut.length) problems.push(`text cut at right edge: ${lay.cut[0]}`);
    if (lay.tiny.length) problems.push(`text under 12px: ${lay.tiny[0]}`);
    rec.views[vp.name] = problems;
    if (vp.name === "1366") {
      rec.stages = lay.stages;
      await drive(page, pg, rec);
    }
    if (SHOTS) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: join(SHOT_DIR, `${pg.id}-${pg.mode}-${vp.name}.png`) });
    }
    rec.errors.push(...errs.map((e) => `${vp.name}: ${e.slice(0, 120)}`));
    await ctx.close();
  }
  return rec;
}

/** At 1366: open every stage, find a task and an answer control; a wrong choice must explain; a stage survives a reload. */
async function drive(/** @type {any} */ page, /** @type {any} */ pg, /** @type {any} */ rec) {
  const tabs = page.locator(".tab-bar .tab-btn");
  const missing = [];
  for (let i = 0; i < 5; i++) {
    await tabs
      .nth(i)
      .click()
      .catch(() => {});
    await page.waitForTimeout(250);
    const panel = page.locator(".tab-panel.active").first();
    const dots = await panel.locator(".dots-row button, .step-dot, .u4-dot").count();
    rec.items.push(dots);
    const control = await panel
      .locator(
        ".stage-card button:visible, .stage-card input:visible, .task-card button:visible, button.choice-btn:visible, input:visible",
      )
      .count();
    if (!control) missing.push(rec.stages[i] || `stage ${i + 1}`);
  }
  rec.tasks = missing.length ? `no answer control in: ${missing.join(", ")}` : "ok";
  // a wrong multiple-choice answer: try choices last-first. When the first pick is right there is no wrong left to test
  // on that item, so the next item in the stage is opened (generated studios take ?s=&i= deep links), then the next stage.
  rec.feedback = "no multiple-choice item on a first screen";
  let tried = false;
  scan: for (let i = 0; i < 5; i++) {
    for (let k = 1; k <= 3; k++) {
      if (k === 1) {
        await tabs
          .nth(i)
          .click()
          .catch(() => {});
      } else if (pg.gen) {
        await page.goto(`${origin}${pg.path}?s=${i + 1}&i=${k}`, { waitUntil: "load" });
        await page.waitForTimeout(600);
      } else break;
      await page.waitForTimeout(200);
      const panel = page.locator(".tab-panel.active").first();
      // only enabled choices: some items unlock their choices after an earlier step on the same screen
      const choices = panel.locator("button.choice-btn:visible:not([disabled])");
      const n = await choices.count();
      if (!n) continue;
      tried = true;
      let right = false;
      for (let c = n - 1; c >= 0 && !right; c--) {
        await choices
          .nth(c)
          .click({ timeout: 3000 })
          .catch(() => {});
        const check = panel.locator("button:visible", { hasText: /^Check/ }).first();
        if (await check.count()) await check.click().catch(() => {});
        await page.waitForTimeout(350);
        const fb = panel.locator(".item-fb.show, .feedback-box.show, .u4-fb.show").first();
        if (await panel.locator(".choice-btn.wrong").count()) {
          rec.feedback = (await fb.count())
            ? `wrong answer explained: "${(await fb.innerText()).trim().replace(/\s+/g, " ").slice(0, 80)}"`
            : "MISSING: a wrong choice gave no feedback";
          break scan;
        }
        if (
          (await panel.locator(".choice-btn.correct").count()) ||
          (await panel.locator(".item-fb.show.ok, .feedback-box.show.ok").count())
        )
          right = true;
      }
    }
  }
  if (tried && rec.feedback.startsWith("no multiple-choice"))
    rec.feedback = "not tested: the first pick was right on every item tried";
  await page.goto(`${origin}${pg.path}`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  // resume: pick stage 3, reload, it should still be open
  await tabs
    .nth(2)
    .click()
    .catch(() => {});
  await page.waitForTimeout(400);
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(800);
  const sel = await page
    .locator(".tab-bar .tab-btn[aria-selected='true']")
    .first()
    .getAttribute("id")
    .catch(() => null);
  rec.resume = sel === "tab-3" ? "ok" : `MISSING: reload opened ${sel}`;
  if (pg.gen) {
    await page.goto(`${origin}${pg.path}?lang=es`, { waitUntil: "load" });
    await page.waitForTimeout(700);
    const es = await page.evaluate(
      () => document.documentElement.lang === "es" || document.body.classList.contains("show-es"),
    );
    rec.spanish = es ? "ok" : "MISSING: ?lang=es did not switch";
  } else rec.spanish = "n/a (hand-built page has its own toggle)";
}

/* ---- run with a small pool ------------------------------------------------------------------------------------------ */
const POOL = Number(process.env.FLEET_JOBS || 3);
const results = [];
let next = 0;
async function worker() {
  while (next < pages.length) {
    const pg = pages[next++];
    const t0 = Date.now();
    const rec = await checkPage(pg).catch((e) => ({
      ...pg,
      crash: String(e.message || e).slice(0, 200),
      views: {},
    }));
    results.push(rec);
    const bad =
      Object.values(rec.views || {}).flat().length +
      (rec.crash ? 1 : 0) +
      [rec.tasks, rec.feedback, rec.resume, rec.spanish].filter(
        (s) => String(s).startsWith("MISSING") || String(s).startsWith("no answer"),
      ).length;
    console.log(
      `${bad ? "FAIL" : "PASS"} ${pg.id} ${pg.mode} (${((Date.now() - t0) / 1000).toFixed(1)}s)${bad ? ` ${JSON.stringify(rec.views)} ${rec.crash || ""}` : ""}`,
    );
  }
}
await Promise.all(Array.from({ length: Math.min(POOL, pages.length) }, worker));
await browser.close();
server?.close();
// a lesson subset updates its rows in the existing ledger rather than replacing the whole file
const ledgerJson = join(REPO_ROOT, OUT, "verification-ledger.json");
const merged = wanted.length && existsSync(ledgerJson);
if (merged) {
  const fresh = new Set(results.map((r) => `${r.id}|${r.mode}`));
  for (const old of JSON.parse(readFileSync(ledgerJson, "utf8")))
    if (!fresh.has(`${old.id}|${old.mode}`)) results.push(old);
}
results.sort((a, b) => byId(a.id, b.id) || (a.mode === "practice" ? -1 : 1));

/* ---- ledger ---------------------------------------------------------------------------------------------------------- */
const failed = (/** @type {any} */ r) =>
  !!r.crash ||
  Object.values(r.views).flat().length > 0 ||
  [r.tasks, r.feedback, r.resume, r.spanish].some((s) => /^(MISSING|no answer)/.test(String(s)));
const md = [
  "# Practice Studio verification ledger",
  "",
  "Generated by `node tools/verify-practice-studio-fleet-browser.mjs` (real Chromium, source tree). Do not edit by hand.",
  "",
  `${results.length} pages · viewports ${VIEWPORTS.map((v) => `${v.width}×${v.height}`).join(", ")} · ${results.filter((r) => !failed(r)).length} pass, ${results.filter(failed).length} with findings.`,
  "",
  "Per viewport: page loads with no page error, 5 stages visible, no sideways scroll, no visible text cut at the right edge or under 12px. At 1366: every stage shows a task with an answer control (Tasks), a wrong multiple-choice answer is explained (Feedback), the open stage survives a reload (Resume), and `?lang=es` switches to Spanish (generated studios).",
  "",
  "| Lesson | Ver | Items per stage | 1366 | 1024 | 768 | 390 | Tasks | Feedback | Resume | Spanish |",
  "|---|---|---|---|---|---|---|---|---|---|---|",
  ...results.map((r) => {
    const v = (/** @type {string} */ k) =>
      r.crash
        ? "crash"
        : (r.views[k] || []).length
          ? r.views[k].join("; ").replace(/\|/g, "/")
          : "pass";
    const s = (/** @type {any} */ x) => String(x || "—").replace(/\|/g, "/");
    return `| ${r.id} | ${r.mode === "practice" ? "P" : "C"} | ${(r.items || []).join(" / ")} | ${v("1366")} | ${v("1024")} | ${v("768")} | ${v("390")} | ${s(r.tasks)} | ${s(r.feedback)} | ${s(r.resume)} | ${s(r.spanish)} |`;
  }),
  "",
].join("\n");
mkdirSync(join(REPO_ROOT, OUT), { recursive: true });
if (!wanted.length || merged) {
  writeFileSync(join(REPO_ROOT, OUT, "verification-ledger.md"), md);
  writeFileSync(
    join(REPO_ROOT, OUT, "verification-ledger.json"),
    `${JSON.stringify(results, null, 1)}\n`,
  );
}
const nFail = results.filter(failed).length;
console.log(
  `\n${results.length - nFail}/${results.length} pages clean${wanted.length && !merged ? " (subset: ledger not written)" : ` -> ${OUT}/verification-ledger.md`}`,
);
process.exit(nFail ? 1 : 0);
