#!/usr/bin/env node
// validate:pfa-browser — the PFA pages driven in a real browser (gates 6, 11, 13 of the brief).
//
//  6  axe (WCAG 2.0/2.1/2.2 A+AA) on the homework, family, assignment, key and hub templates, EN and
//     ES, 390 and 1280 px, plus one homework/family/assignment per unit: 0 serious/critical.
//     Keyboard-only completion of 6-6 homework (Tab/Shift+Tab, Space, Enter, typing; no clicks).
//  -  The hint ladder (conceptual -> procedural -> worked parallel example), misconception feedback,
//     "Try a similar problem", save/resume across a reload, the Spanish toggle remembered.
// 11  Print: headless-Chrome PDF of each printable within its page budget, nothing clipped.
// 13  Reduced motion (reducedMotion: "reduce" and the on-page toggle): no running animation, every
//     worked-example step reachable; frame time of the animated worked example.
//  -  The answer key path is a teacher surface (functions/_lib/teacher-surface.js); student paths are not.
// Serves the pages through tools/pfa/serve.mjs (the same renderer the Pages Function calls).
// Missing browser: SKIP (exit 3) locally, FAIL in CI. A run that checked nothing FAILS.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const ALL = args.includes("--all");
const exe =
  process.env.PW_CHROMIUM_PATH ||
  (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
let chromium;
try {
  ({ chromium } = await import(
    pathToFileURL(join(ROOT, "node_modules/playwright/index.mjs")).href
  ));
} catch {
  console.error(
    `${process.env.CI ? "FAIL" : "SKIP"} validate:pfa-browser — playwright not installed`,
  );
  process.exit(process.env.CI ? 1 : 3);
}
let browser;
try {
  browser = await chromium.launch(exe ? { executablePath: exe } : {});
} catch (e) {
  console.error(
    `${process.env.CI ? "FAIL" : "SKIP"} validate:pfa-browser — no browser (${String(e.message).split("\n")[0]})`,
  );
  process.exit(process.env.CI ? 1 : 3);
}
const { startServer } = await import(pathToFileURL(join(ROOT, "tools/pfa/serve.mjs")).href);
const { decodeInsight } = await import(
  pathToFileURL(join(ROOT, "functions/_lib/pfa/insight-code.js")).href
);
const { isTeacherSurface } = await import(
  pathToFileURL(join(ROOT, "functions/_lib/teacher-surface.js")).href
);
// --base <url> runs the same checks against a deployed site (live verification). Teacher-gated pages
// (the answer key) are then checked for their 401 instead of being rendered.
const baseArg = args.includes("--base")
  ? args[args.indexOf("--base") + 1].replace(/\/$/, "")
  : null;
const server = baseArg
  ? { url: baseArg, close: async () => {} }
  : await startServer(4790 + Math.floor(Math.random() * 100));
const BASE = server.url;
const LIVE = !!baseArg;
const BASE_HOST = new URL(BASE).hostname;
const observed = new Set();
const AXE = readFileSync(join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");
const MAP = JSON.parse(readFileSync(join(ROOT, "data/assignments.json"), "utf8"));

const failures = [];
const passes = [];
const fail = (g, m) => failures.push(`[${g}] ${m}`);
const ok = (m) => passes.push(m);

async function newPage(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: opts.width || 390, height: opts.height || 844 },
    reducedMotion: opts.reduced ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  page._errors = [];
  page.on("pageerror", (e) => page._errors.push(e.message));
  page.on("console", (m) => {
    const msg = `${m.text()} ${m.location()?.url || ""}`;
    if (m.type() === "error" && !(LIVE && /cloudflareinsights/.test(msg))) page._errors.push(msg);
  });
  page.on("request", (r) => {
    const u = new URL(r.url());
    // Cloudflare injects its Web Analytics beacon into every production HTML response (a zone setting,
    // not page code); live mode records it once instead of failing every page on it.
    if (LIVE && u.hostname === "static.cloudflareinsights.com") {
      observed.add(u.hostname);
      return;
    }
    if (u.hostname !== BASE_HOST && u.protocol.startsWith("http"))
      page._errors.push(`external request ${r.url()}`);
  });
  return page;
}

async function axe(page, label) {
  await page.addScriptTag({ content: AXE });
  const res = await page.evaluate(() =>
    axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    }),
  );
  const bad = res.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  for (const v of bad)
    fail(6, `${label}: axe ${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0]?.target}`);
  return bad.length;
}

async function noOverflow(page, label) {
  const o = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (o > 1) fail(6, `${label}: horizontal scroll of ${o}px`);
}

// ---------------- negative controls: each detector must catch a seeded defect ----------------
{
  const before = failures.length;
  const page = await newPage({ width: 390, reduced: true });
  await page.setContent(
    '<!doctype html><html lang="en"><head><title>x</title></head><body><main><h1>x</h1><p style="color:#bbb;background:#fff">low contrast text here</p></main></body></html>',
  );
  const axeBad = await axe(page, "negative-control");
  await page.setContent(
    `<!doctype html><html lang="en"><head><title>x</title><style>@keyframes spin{to{transform:rotate(360deg)}}.x{animation:spin 1s infinite}</style></head><body><main><div class="x">spin</div><div style="width:900px">wide</div>${"<p>line</p>".repeat(400)}</main></body></html>`,
  );
  const running = await page.evaluate(
    () => document.getAnimations().filter((a) => a.playState === "running").length,
  );
  const beforeOverflow = failures.length;
  await noOverflow(page, "negative-control");
  const overflowCaught = failures.length > beforeOverflow;
  const pdf = await page.pdf({ format: "Letter" });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  await page.close();
  const caught = axeBad > 0 && running > 0 && overflowCaught && pages > 2;
  failures.length = before; // the seeded defects are expected; only a MISSED one is a failure
  if (!caught) {
    console.error(
      `FAIL validate:pfa-browser — a detector missed its seeded defect (axe ${axeBad}, running ${running}, overflow ${overflowCaught}, pages ${pages})`,
    );
    process.exit(1);
  }
  ok(
    "negative controls: axe, running-animation, overflow and print-length detectors each caught a seeded defect",
  );
}

// ---------------- 6: axe sweep ----------------
const TEMPLATES = [
  "/lessons/6-6/practice",
  "/lessons/6-6/family-guide",
  "/lessons/6-6/assignment",
  ...(LIVE ? [] : ["/lessons/6-6/assignment-answer-key"]),
  "/practice-hub/",
  "/practice-hub/family/unit-6",
  "/practice-hub/family/unit-6/letter",
  "/practice-hub/insights",
];
const sample = [];
for (const u of MAP.units) {
  const ids = ALL ? u.lessons : [u.lessons[Math.min(1, u.lessons.length - 1)]];
  for (const id of ids)
    sample.push(
      `/lessons/${id}/practice`,
      `/lessons/${id}/family-guide`,
      `/lessons/${id}/assignment`,
    );
}
let axed = 0;
for (const path of TEMPLATES) {
  for (const width of [390, 1280]) {
    for (const lang of ["en", "es"]) {
      const page = await newPage({ width });
      await page.goto(`${BASE}${path}?lang=${lang}`, { waitUntil: "load" });
      await axe(page, `${path} ${lang} ${width}`);
      await noOverflow(page, `${path} ${lang} ${width}`);
      if (page._errors.length)
        fail(6, `${path}: console/page errors: ${page._errors.slice(0, 2).join(" | ")}`);
      axed++;
      await page.close();
    }
  }
}
for (const path of sample) {
  const page = await newPage({ width: 390 });
  await page.goto(`${BASE}${path}`, { waitUntil: "load" });
  await axe(page, `${path} en 390`);
  await noOverflow(page, `${path} 390`);
  if (page._errors.length) fail(6, `${path}: errors: ${page._errors.slice(0, 2).join(" | ")}`);
  axed++;
  await page.close();
}
ok(`axe: ${axed} page views, 0 serious/critical expected`);

// Answers, read from the page's own check data (the harness knows the key; the student does not see it).
async function answers(page) {
  return page.evaluate(() => JSON.parse(document.getElementById("pfa-data").textContent).problems);
}

// ---------------- 6: keyboard-only completion of 6-6 ----------------
{
  const page = await newPage({ width: 1280 });
  await page.goto(`${BASE}/lessons/6-6/practice?lang=en`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  const key = await answers(page);
  const focusIs = (sel) => page.evaluate((s) => !!document.activeElement?.matches(s), sel);
  async function tabTo(sel, max = 600) {
    for (let i = 0; i < max; i++) {
      if (await focusIs(sel)) return true;
      await page.keyboard.press("Tab");
    }
    return false;
  }
  let solved = 0;
  const cards = await page.$$eval(".problem[data-pid]", (els) =>
    els.map((e) => ({ pid: e.dataset.pid, type: e.dataset.type })),
  );
  for (const { pid, type } of cards) {
    const d = key[pid];
    const scope = `#p-${pid}`;
    let reached = true;
    if (d.kind === "entry") {
      reached = await tabTo(`${scope} input[type=text]`);
      await page.keyboard.type(String(d.answer));
      await page.keyboard.press("Enter");
    } else if (d.kind === "mc" || d.kind === "error" || d.kind === "mc-gen") {
      reached = await tabTo(`${scope} input[type=radio]`);
      // Arrow keys move within a radio group; select the right one.
      const values = await page.$$eval(`${scope} input[type=radio]`, (els) =>
        els.map((e) => e.value),
      );
      const target =
        d.kind === "mc-gen" ? values.indexOf(d.answer) : values.indexOf(String(d.correct));
      await page.keyboard.press("Space");
      for (let k = 0; k < target; k++) await page.keyboard.press("ArrowDown");
      reached = reached && (await tabTo(`${scope} [data-act=check]`));
      await page.keyboard.press("Enter");
    } else if (d.kind === "select") {
      const boxes = d.correct.length;
      reached = await tabTo(`${scope} input[type=checkbox]`);
      for (let k = 0; k < boxes; k++) {
        if (d.correct[k]) await page.keyboard.press("Space");
        if (k < boxes - 1) await page.keyboard.press("Tab");
      }
      reached = reached && (await tabTo(`${scope} [data-act=check]`));
      await page.keyboard.press("Enter");
    } else if (d.kind === "match") {
      for (let i = 0; i < d.pairs.length; i++) {
        reached = reached && (await tabTo(`${scope} .chip[data-side=l][data-i="${i}"]`));
        await page.keyboard.press("Enter");
        reached = reached && (await tabTo(`${scope} .chip[data-side=r][data-i="${i}"]`));
        await page.keyboard.press("Enter");
      }
      reached = reached && (await tabTo(`${scope} [data-act=check]`));
      await page.keyboard.press("Enter");
    } else if (d.kind === "explain") {
      reached = await tabTo(`${scope} textarea`);
      await page.keyboard.type(
        "I know the answer is right because I combined the like terms and checked with a number.",
      );
      reached = reached && (await tabTo(`${scope} [data-act=check]`));
      await page.keyboard.press("Enter");
    }
    if (!reached) fail(6, `keyboard: could not reach the controls of ${pid} (${type})`);
    const correct = await page.$eval(scope, (el) => el.querySelector(".feedback.ok") != null);
    if (correct) solved++;
    else fail(6, `keyboard: ${pid} (${type}) not marked correct after keyboard entry`);
  }
  await tabTo("[data-act=finish]");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  const fin = await page.$eval("#finish", (el) => ({
    hidden: el.hidden,
    score: el.querySelector(".score-num").textContent,
    total: el.querySelector(".score-total").textContent,
  }));
  if (fin.hidden || fin.score !== fin.total)
    fail(6, `keyboard: finish screen shows ${fin.score}/${fin.total} (hidden=${fin.hidden})`);
  if (solved === 0) fail(6, "keyboard: solved nothing");
  ok(
    `keyboard-only: ${solved}/${cards.length} problems on 6-6 solved, finish ${fin.score}/${fin.total}`,
  );
  // save/resume: reload keeps every solved card
  await page.reload({ waitUntil: "load" });
  const kept = await page.$$eval(".problem.is-correct", (els) => els.length);
  if (kept !== solved)
    fail(6, `save/resume: ${kept} of ${solved} solved problems restored after reload`);
  else ok(`save/resume: ${kept}/${solved} restored after reload`);
  const stored = await page.evaluate(() => (localStorage.getItem("ewl_pfa_6-6_hw") || "").length);
  if (stored > 4096) fail(6, `saved state is ${stored} chars, over SCORM 1.2 suspend_data 4,096`);
  else ok(`saved state ${stored} chars (< 4,096)`);
  if (page._errors.length) fail(6, `keyboard run errors: ${page._errors.slice(0, 3).join(" | ")}`);
  await page.close();
}

// ---------------- keyboard on the table and number-line items (3-3, 7-1) ----------------
for (const [lesson, kind] of [
  ["3-3", "table"],
  ["7-1", "line"],
]) {
  const page = await newPage({ width: 390 });
  await page.goto(`${BASE}/lessons/${lesson}/practice?lang=en`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  const key = await answers(page);
  const entry = Object.entries(key).find(([, v]) => v.kind === kind);
  if (!entry) {
    fail("inputs", `${lesson}: no ${kind} item on the page`);
    await page.close();
    continue;
  }
  const [pid, d] = entry;
  const scope = `#p-${pid}`;
  const focusIs = (sel) => page.evaluate((x) => !!document.activeElement?.matches(x), sel);
  const tabTo = async (sel) => {
    for (let i = 0; i < 400; i++) {
      if (await focusIs(sel)) return true;
      await page.keyboard.press("Tab");
    }
    return false;
  };
  if (kind === "table") {
    // wrong first: every cell off by one -> per-cell red outline, nothing solved
    for (let i = 0; i < d.blanks.length; i++) {
      if (!(await tabTo(`${scope} input[data-blank="${i}"]`)))
        fail("inputs", `${lesson}: cannot Tab to table cell ${i}`);
      await page.keyboard.type(String(Number(d.blanks[i]) + 1));
    }
    await page.keyboard.press("Enter");
    const invalid = await page.$$eval(
      `${scope} input[data-blank]`,
      (els) => els.filter((e) => e.getAttribute("aria-invalid") === "true").length,
    );
    if (invalid !== d.blanks.length)
      fail("inputs", `${lesson}: wrong table cells not marked (${invalid}/${d.blanks.length})`);
    for (let i = 0; i < d.blanks.length; i++) {
      await page.fill(`${scope} input[data-blank="${i}"]`, "");
      await tabTo(`${scope} input[data-blank="${i}"]`);
      await page.keyboard.type(String(d.blanks[i]));
    }
    await page.keyboard.press("Enter");
  } else {
    if (!(await tabTo(`${scope} .nl-range`)))
      fail("inputs", `${lesson}: cannot Tab to the number line`);
    const target = d.accept.eq != null ? d.accept.eq : d.accept.gt + 1;
    const min = Number(await page.$eval(`${scope} .nl-range`, (e) => e.min));
    // a known wrong placement first (the misconception value), then the right one
    const wrongV = Number(d.known?.[0]?.value);
    if (Number.isFinite(wrongV)) {
      await page.keyboard.press("Home");
      for (let k = min; k < wrongV; k++) await page.keyboard.press("ArrowRight");
      await tabTo(`${scope} [data-act=check]`);
      await page.keyboard.press("Enter");
      const fb = await page.$eval(`${scope} .feedback`, (e) => e.innerText);
      if (!fb.includes(d.known[0].why.en.slice(0, 20)))
        fail("inputs", `${lesson}: wrong point ${wrongV} got no misconception feedback`);
      await tabTo(`${scope} .nl-range`);
    }
    await page.keyboard.press("Home");
    for (let k = min; k < target; k++) await page.keyboard.press("ArrowRight");
    const shown = await page.$eval(`${scope} .nl-value`, (e) => e.textContent.replace("−", "-"));
    if (Number(shown) !== target)
      fail("inputs", `${lesson}: readout shows ${shown}, slider at ${target}`);
    await tabTo(`${scope} [data-act=check]`);
    await page.keyboard.press("Enter");
  }
  const solved = await page.$eval(scope, (e) => !!e.querySelector(".feedback.ok"));
  if (!solved) fail("inputs", `${lesson}: ${kind} item not marked correct after keyboard entry`);
  await page.reload({ waitUntil: "load" });
  const kept = await page.$eval(scope, (e) => e.classList.contains("is-correct"));
  if (!kept) fail("inputs", `${lesson}: ${kind} item not restored after reload`);
  if (page._errors.length)
    fail("inputs", `${lesson}: errors ${page._errors.slice(0, 2).join(" | ")}`);
  if (solved && kept)
    ok(
      `${kind} item on ${lesson}: wrong answer flagged, solved by keyboard, restored after reload`,
    );
  await page.close();
}

// ---------------- hint ladder, misconception feedback, similar problem, Spanish ----------------
{
  const page = await newPage({ width: 390 });
  await page.goto(`${BASE}/lessons/6-6/practice?lang=en`, { waitUntil: "load" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  const key = await answers(page);
  const [pid, d] = Object.entries(key).find(([, v]) => v.kind === "entry" && v.known?.length);
  const scope = `#p-${pid}`;
  const wrongV = d.known[0].value;
  const seen = [];
  for (let k = 1; k <= 3; k++) {
    await page.fill(`${scope} input[type=text]`, wrongV);
    await page.click(`${scope} [data-act=check]`);
    const st = await page.$eval(scope, (el) => ({
      fb: el.querySelector(".feedback")?.innerText || "",
      hint: el.querySelector(".hint")?.innerText || "",
      h4: el.querySelector(".hint h4")?.innerText || "",
    }));
    seen.push(st);
  }
  if (!seen[0].fb.includes(d.known[0].why.en.slice(0, 25)))
    fail("hints", `wrong answer ${wrongV} did not get its misconception feedback`);
  if (
    !/think about it/i.test(seen[0].h4) ||
    !/try this step/i.test(seen[1].h4) ||
    !/watch a similar one/i.test(seen[2].h4)
  )
    fail("hints", `ladder order wrong: ${seen.map((s) => s.h4).join(" / ")}`);
  if (seen[0].hint.includes(d.hints?.conceptual?.en?.slice(0, 20) || "@@") === false)
    fail("hints", "level 1 is not the conceptual hint");
  const parallelAnswer = seen[2].hint.match(/Answer:\s*([^\n]+)/)?.[1]?.trim();
  if (!parallelAnswer) fail("hints", "level 3 shows no worked parallel example");
  if (parallelAnswer && parallelAnswer.replace(/\s/g, "") === String(d.answer).replace(/\s/g, ""))
    fail("hints", "level 3 example has the same answer as the original (numbers not changed)");
  const revealed = await page.$eval(
    scope,
    (el, ans) => el.querySelector(".feedback").innerText.includes(ans),
    String(d.answer),
  );
  if (revealed) fail("hints", "the original answer was revealed in the feedback");
  ok(
    `hint ladder on ${pid}: misconception feedback, conceptual -> procedural -> worked example (${parallelAnswer})`,
  );
  // similar problem
  await page.click(`${scope} [data-act=similar]`);
  const extra = await page.$(".problem.extra");
  if (!extra) fail("similar", "Try a similar problem added nothing");
  else {
    const xd = await extra.evaluate((el) => el._data);
    const inp = await extra.$("input[type=text]");
    if (inp) await inp.fill(String(xd.answer));
    else
      await extra.$$eval(
        "input[type=radio]",
        (els, a) => els.find((e) => e.value === a)?.click(),
        xd.answer,
      );
    await (await extra.$("[data-act=check]")).click();
    const okx = await extra.evaluate((el) => !!el.querySelector(".feedback.ok"));
    if (!okx) fail("similar", "the similar problem did not accept its own answer");
    else ok("similar problem: generated, checked, accepted");
  }
  // Spanish toggle, remembered
  await page.click('[data-set-lang="es"]');
  const es = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    text: document.querySelector("main").innerText,
  }));
  if (es.lang !== "es" || /Quick Refresher|Warm up|Try a similar problem/.test(es.text))
    fail(10, "Spanish view still shows English interface text");
  await page.goto(`${BASE}/lessons/6-6/practice`, { waitUntil: "load" });
  if ((await page.evaluate(() => document.documentElement.lang)) !== "es")
    fail(10, "language choice not remembered");
  else ok("Spanish toggle: interface fully Spanish, remembered across reload");
  if (page._errors.length) fail(6, `hint run errors: ${page._errors.slice(0, 3).join(" | ")}`);
  await page.close();
}

// ---------------- 13: reduced motion + frame time ----------------
for (const path of [
  "/lessons/6-6/practice",
  "/lessons/6-6/family-guide",
  "/lessons/6-6/assignment",
  "/practice-hub/family/unit-6",
]) {
  for (const mode of ["media", "toggle"]) {
    const page = await newPage({ width: 390, reduced: mode === "media" });
    await page.goto(`${BASE}${path}`, { waitUntil: "load" });
    if (mode === "toggle") await page.click('[data-act="motion"]');
    if (await page.$(".player")) {
      await page.click('.player [data-player="again"]');
      for (let k = 0; k < 6; k++) await page.click('.player [data-player="next"]').catch(() => {});
      const hidden = await page.$$eval(
        ".player .steps li",
        (els) =>
          els.filter(
            (e) => getComputedStyle(e).opacity === "0" || getComputedStyle(e).display === "none",
          ).length,
      );
      if (hidden)
        fail(
          13,
          `${path} (${mode}): ${hidden} worked-example steps not reachable with reduced motion`,
        );
    }
    const wrong = await page.$('.problem [data-act="check"]');
    if (wrong) await wrong.click();
    const running = await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === "running").length,
    );
    if (running) fail(13, `${path} (${mode}): ${running} animations running under reduced motion`);
    await page.close();
  }
}
ok("reduced motion: no running animation, all steps reachable (media query and toggle)");
{
  const page = await newPage({ width: 1280 });
  await page.goto(`${BASE}/lessons/6-6/practice`, { waitUntil: "load" });
  await page.click('.player [data-player="again"]');
  await page.click('.player [data-player="play"]');
  const avg = await page.evaluate(
    () =>
      new Promise((res) => {
        const ts = [];
        const step = (t) => {
          ts.push(t);
          if (ts.length < 180) requestAnimationFrame(step);
          else res((ts[ts.length - 1] - ts[0]) / (ts.length - 1));
        };
        requestAnimationFrame(step);
      }),
  );
  if (avg > 16.7 * 1.02) fail(13, `animated worked example: average frame ${avg.toFixed(2)} ms`);
  ok(`frame time during the animated worked example: ${avg.toFixed(2)} ms average over 180 frames`);
  await page.close();
}

// ---------------- 11: print ----------------
const PRINT = [
  ["/lessons/6-6/practice", "en", 2],
  ["/lessons/6-6/assignment", "en", 2],
  ["/lessons/6-6/assignment", "es", 2],
  ...(LIVE ? [] : [["/lessons/6-6/assignment-answer-key", "en", 2]]),
  ["/lessons/6-6/family-guide", "en", 1],
  ["/lessons/6-6/family-guide", "es", 1],
  ["/practice-hub/family/unit-6/letter", "en", 1],
  ["/practice-hub/family/unit-6/letter", "es", 1],
];
// Default: one lesson per unit. --all: every lesson's homework, assignment, key (not live: gated)
// and both family guides — the sweep that found 13 coordinate-plane/net pages at 3 pages.
for (const u of MAP.units)
  for (const id of ALL ? u.lessons : [u.lessons[0]])
    PRINT.push(
      [`/lessons/${id}/assignment`, "en", 2],
      [`/lessons/${id}/family-guide`, "es", 1],
      ...(ALL
        ? [
            [`/lessons/${id}/practice`, "en", 2],
            [`/lessons/${id}/family-guide`, "en", 1],
            ...(LIVE ? [] : [[`/lessons/${id}/assignment-answer-key`, "en", 2]]),
          ]
        : []),
    );
for (const [path, lang, max] of PRINT) {
  const page = await newPage({ width: 816 });
  await page.goto(`${BASE}${path}?lang=${lang}`, { waitUntil: "load" });
  await page.emulateMedia({ media: "print" });
  const clip = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (clip > 1) fail(11, `${path} ${lang}: print layout ${clip}px wider than the page`);
  const pdf = await page.pdf({ format: "Letter", printBackground: true });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  if (pages > max) fail(11, `${path} ${lang}: prints ${pages} pages (max ${max})`);
  passes.push(`print ${path} ${lang}: ${pages} page(s)`);
  await page.close();
}

// ---------------- coach, class code, spiral review and class insights ----------------
{
  const page = await newPage({ width: 390 });
  await page.goto(`${BASE}/lessons/6-6/practice?lang=en`, { waitUntil: "load" });
  const probs = await answers(page);
  const data = await page.evaluate(() =>
    JSON.parse(document.getElementById("pfa-data").textContent),
  );
  const review = Object.keys(probs).filter((k) => probs[k].review);
  if (review.length !== 2)
    fail("coach", `6-6 shows ${review.length} spiral review problems, expected 2`);
  // One tagged wrong answer, then everything multiple-choice right.
  let wrongTag = null;
  for (const [pid, d] of Object.entries(probs)) {
    if (d.kind !== "mc" || d.counted === false) continue;
    const card = page.locator(`#p-${pid}`);
    const wi = (d.tags || []).findIndex((t, i) => t && i !== d.correct && data.tips?.[t]);
    if (!wrongTag && wi >= 0) {
      await card.locator(`input[value="${wi}"]`).check();
      await card.locator('[data-act="check"]').click();
      wrongTag = d.tags[wi];
    }
    await card.locator(`input[value="${d.correct}"]`).check();
    await card.locator('[data-act="check"]').click();
  }
  // A spiral review problem's third hint is a worked example from ITS lesson's generator.
  const rc = page.locator(`#p-${review[0]}`);
  for (let k = 0; k < 3; k++) await rc.locator('[data-act="hint"]').click();
  if (!(await rc.locator(".hint .steps").count()))
    fail("coach", "review problem hint 3 has no worked example");
  await page.locator('[data-act="finish"]').click();
  const coach = await page.locator(".coach-body").innerText();
  if (!wrongTag) fail("coach", "6-6 has no tagged wrong answer to drive the coach");
  else if (!coach.includes(data.tips[wrongTag].label.en))
    fail("coach", `coach does not name ${wrongTag} after that wrong answer`);
  const code = (await page.locator("#finish .code").innerText()).trim();
  const dec = decodeInsight(code);
  const counted = Object.values(probs).filter((d) => d.counted !== false).length;
  if (!dec.ok || dec.lessonId !== "6-6" || dec.total !== counted || !dec.tags.includes(wrongTag))
    fail("coach", `class code ${code} decodes to ${JSON.stringify(dec)}`);
  await page.waitForTimeout(1800); // let the confetti and scroll-in fades finish before measuring
  await axe(page, "6-6 finish card with coach and code");
  await page.locator('[data-act="coach-try"]').first().click();
  if (!(await page.locator(".coach .problem.extra").count()))
    fail("coach", "coach practice did not add a problem");
  if (page._errors.length) fail("coach", `errors: ${page._errors.slice(0, 2).join(" | ")}`);
  // The teacher pastes it (with a name and a mistyped code) into class insights.
  const ins = await newPage({ width: 1280 });
  await ins.goto(`${BASE}/practice-hub/insights?lang=es`, { waitUntil: "load" });
  const bad = code.replace(/^./, (c) => (c === "5" ? "6" : "5"));
  await ins.locator("#ins-codes").fill(`Ana ${code}\nBen ${bad}`);
  await ins.locator('[data-act="ins-show"]').focus();
  await ins.keyboard.press("Enter");
  const out = await ins.locator("#ins-out").innerText();
  if (!/Lección 6-6/.test(out) || !out.includes("1 estudiante"))
    fail("insights", "pasted code not summarized for Lesson 6-6");
  if (!out.includes(bad)) fail("insights", "mistyped code was not listed as unreadable");
  await axe(ins, "insights results es");
  await ins.locator('[data-act="ins-sample"]').click();
  const sampleOut = await ins.locator("#ins-out").innerText();
  if (!/\b24\b/.test(sampleOut)) fail("insights", "sample class did not render 24 students");
  await noOverflow(ins, "insights sample 1280");
  if (ins._errors.length) fail("insights", `errors: ${ins._errors.slice(0, 2).join(" | ")}`);
  ok(
    `coach and codes: a ${wrongTag} answer is named on the finish card, the class code decodes (score, total, tag), a mistyped code is refused, class insights summarize it in Spanish`,
  );
  await page.close();
  await ins.close();
}

// ---------------- optional bilingual math models ----------------
{
  const cases = [
    ["2-8", "family-guide", [7], [12]],
    ["3-3", "practice", [4], [5]],
    ["4-2", "family-guide", [40], [75]],
    ["5-2", "practice", [6, 4], [6, 6]],
    ["6-6", "family-guide", [4, 4], [4, 5]],
    ["7-1", "practice", [4], [-5]],
    ["8-2", "family-guide", [6, 9], [9, 12]],
    ["9-1", "practice", [4, 3], [4, 4]],
  ];
  for (const [id, pageType, answer, second] of cases) {
    const family = pageType === "family-guide";
    const page = await newPage({ width: family ? 390 : 1280, reduced: family });
    await page.goto(`${BASE}/lessons/${id}/${pageType}?lang=${family ? "es" : "en"}`);
    const studio = page.locator("#math-model");
    const summary = studio.locator(".studio-opening");
    const check = studio.locator('[data-studio-action="check"]');
    const result = studio.locator("[data-studio-result]");
    const sliders = studio.getByRole("slider");
    await summary.focus({ timeout: 5000 });
    await page.keyboard.press("Enter");
    await check.click({ timeout: 5000 });
    if ((await result.getAttribute("data-correct")) !== "false")
      fail("studio", `${id}: initial state passed the challenge`);
    const setValues = async (numbers) => {
      for (const [i, value] of numbers.entries()) {
        await sliders.nth(i).evaluate((slider, n) => {
          slider.value = n;
          slider.dispatchEvent(new Event("input", { bubbles: true }));
          slider.dispatchEvent(new Event("change", { bubbles: true }));
        }, value);
      }
    };
    await setValues(answer);
    await check.click();
    const feedback = await result.innerText();
    if (!(family ? /Llegaste a la meta/ : /You reached the target/).test(feedback))
      fail("studio", `${id}: expected success in active language, got ${feedback}`);
    await studio.locator('[data-studio-action="next"]').click();
    await setValues(second);
    await check.click();
    if ((await result.getAttribute("data-correct")) !== "true")
      fail("studio", `${id}: second challenge failed`);
    if (id === "9-1") {
      await studio.locator(".studio-table summary").click();
      const row = await studio.locator("tr.studio-current").innerText();
      if (!/^4\s+16$/.test(row.trim())) fail("studio", `graph and table disagreed: ${row}`);
    }
    if (id === "4-2") {
      if ((await studio.locator(".studio-graphic .studio-teal").count()) !== 75)
        fail("studio", "the hundredths grid did not update");
      await studio.evaluate((node) => node.scrollIntoView({ block: "start" }));
      await axe(page, "open math model Spanish mobile");
    }
    if (id === "9-1") {
      await studio.evaluate((node) => node.scrollIntoView({ block: "start" }));
      await axe(page, "open math model English desktop");
    }
    await studio.locator('[data-studio-action="reset"]').click();
    const first = sliders.first();
    const value = Number(await first.inputValue());
    await first.focus();
    await page.keyboard.press("ArrowRight");
    if (Number(await first.inputValue()) !== value + 1)
      fail("studio", `${id}: keyboard range adjustment failed`);
    await studio.locator('[data-delta="-1"]').first().click();
    if (Number(await first.inputValue()) !== value) fail("studio", `${id}: step button failed`);
    await noOverflow(page, `open model ${id}`);
    if (page._errors.length) fail("studio", `${id}: ${page._errors.join(" | ")}`);
    await page.close();
  }
  const landing = await newPage({ width: 390 });
  await landing.goto(`${BASE}/practice-hub/family/`);
  const links = landing.locator(".studio-gallery li a");
  if ((await links.count()) !== cases.length) fail("studio", "family gallery is missing models");
  await links.first().click({ timeout: 5000 });
  if (!(await landing.locator("#math-model").evaluate((node) => node.open)))
    fail("studio", "family gallery link did not open its model");
  await landing.close();
  ok(
    "math models: both challenges on all eight models, keyboard ranges, step buttons, graph table, family deep link and bilingual layouts",
  );
}

// ---------------- live: every hub link for one unit, and the curriculum entry points ----------------
if (LIVE) {
  const hub = await (await fetch(`${BASE}/practice-hub/`)).text();
  const unit6 = hub.slice(hub.indexOf('id="u6"'), hub.indexOf('id="u7"'));
  const links = [...new Set([...unit6.matchAll(/href="(\/[^"]+)"/g)].map((m) => m[1]))];
  const qrs = [
    ...new Set([...unit6.matchAll(/src="(\/practice-hub\/qr\/[^"]+)"/g)].map((m) => m[1])),
  ];
  let okCount = 0;
  for (const href of [...links, ...qrs]) {
    const r = await fetch(`${BASE}${href}`, { redirect: "manual" });
    const want = href.includes("answer-key") ? 401 : 200;
    if (r.status !== want) fail("live", `${href} answered ${r.status}, expected ${want}`);
    else okCount++;
  }
  for (const page of ["/curriculum/", "/curriculum/units/"]) {
    const html = await (await fetch(`${BASE}${page}`)).text();
    for (const href of [
      "/practice-hub/",
      ...(page === "/curriculum/" ? ["/practice-hub/family/"] : []),
    ]) {
      if (!html.includes(`href="${href}"`)) fail("live", `${page} does not link ${href}`);
      else okCount++;
    }
  }
  ok(
    `live links: ${okCount} checked (unit 6 hub rows incl. QR codes, answer keys 401, curriculum entry points)`,
  );
}

// ---------------- teacher gate ----------------
if (!isTeacherSurface("/lessons/6-6/assignment-answer-key"))
  fail("auth", "answer key path is not a teacher surface");
for (const p of [
  "/lessons/6-6/practice",
  "/lessons/6-6/family-guide",
  "/lessons/6-6/assignment",
  "/practice-hub/",
  "/practice-hub/insights",
])
  if (isTeacherSurface(p)) fail("auth", `${p} is gated but is student/family-facing`);

await browser.close();
await server.close();
if (passes.length === 0) {
  console.error("FAIL validate:pfa-browser — checked nothing");
  process.exit(1);
}
if (failures.length) {
  console.error(`FAIL validate:pfa-browser — ${failures.length} problem(s)`);
  for (const f of failures.slice(0, 50)) console.error(`  ${f}`);
  process.exit(1);
}
if (observed.size)
  passes.push(
    `observed (not page code): ${[...observed].join(", ")} injected by the Cloudflare zone`,
  );
console.log(`PASS validate:pfa-browser\n  ${passes.join("\n  ")}`);
