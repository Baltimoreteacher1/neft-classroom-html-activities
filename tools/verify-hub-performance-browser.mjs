#!/usr/bin/env node
/* =============================================================================
 * verify-hub-performance-browser — the hub keeps its behaviour while it loads less.
 * -----------------------------------------------------------------------------
 * /curriculum/ was brought under its perf budgets by NOT fetching data nothing
 * on the page reads yet. A deferral that is wrong fails silently: the page is
 * fast and a card is empty. So this drives the real hub in a real browser and
 * checks both halves:
 *
 *   1. LOAD     the deferred files are not requested at boot (skipped with
 *               --baseline, which is how production before the change is read);
 *   2. BEHAVE   every feature that depended on them still ends in the same state:
 *               Today's Mission picker, the Learning Atlas card (scrolled into
 *               view), Find-a-lesson search, This-week card, the teacher panel
 *               (loaded as a teacher AND switched on at runtime), and a Reveal
 *               document link (download attribute, and a click that beats the
 *               manifest still downloads under the right filename);
 *   3. A11Y     axe on the page at 1440 and 390;
 *   4. VITALS   LCP / CLS and interaction-event durations (an INP proxy) at 4x
 *               CPU throttle.
 *
 *   node tools/verify-hub-performance-browser.mjs --base http://localhost:4187
 *   node tools/verify-hub-performance-browser.mjs --base https://eduwonderlab.com --baseline
 *   node tools/verify-hub-performance-browser.mjs --base ... --mutate atlas   # must FAIL
 *
 * --mutate rewrites a served script so ONE deferral is undone, then runs the same
 * assertions. A check that cannot fail proves nothing; each mutation must turn
 * its own LOAD assertion red. A mutation whose text is not found in the served
 * script aborts, so it can never pass vacuously.
 *
 * Not in the pre-push gate: it needs a served build and Chromium and takes about
 * a minute. The budgets themselves are enforced by scripts/perf-curriculum.mjs,
 * which runs in the scheduled production-observability workflow.
 * ========================================================================== */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const option = (name, fallback) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};
const BASE = option("--base", "http://localhost:4178").replace(/\/$/, "");
const BASELINE = argv.includes("--baseline");
const MUTATE = option("--mutate", "");
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

/** Data each deferral stopped fetching at boot, by feature. */
const DEFERRED = {
  reveal: ["reveal-document-downloads.json"],
  atlas: ["retrieval-bank.json", "atlas-student-why.json", "standards-prerequisites.json"],
  nervous: ["curriculum-nervous-system.json"],
  search: ["curriculum-search-index.json"],
  realWorld: ["curriculum-real-world.json"],
  teacher: [
    "curriculum-supports.json",
    "curriculum-teacher-workflow.json",
    "curriculum-uifr-level4.json",
  ],
};

const BUNDLE = /curriculum-hub\.bundle\..*\.js/;

/** One undone deferral each: [served-script pattern, text to find, replacement]. */
const MUTATIONS = {
  reveal: [
    /curriculum-hub\.tail\..*\.js/,
    "const DOCUMENT_PATH",
    'fetch("/data/reveal-document-downloads.json?v=language-support-20261008");\n  const DOCUMENT_PATH',
  ],
  atlas: [BUNDLE, 'typeof root.IntersectionObserver !== "function"', "true"],
  nervous: [
    BUNDLE,
    "if (existing && existing.unitsData && !existing.unitsData.length) return;",
    "",
  ],
  search: [
    BUNDLE,
    "if (hubHasBrowser()) {\n      loadSearchIndex();",
    "if (true) {\n      loadSearchIndex();",
  ],
  teacher: [
    BUNDLE,
    "DATA.launch = launch || {};",
    "DATA.launch = launch || {};\n        loadEnrichment();",
  ],
};

const fails = [];
const log = [];
function check(ok, label, detail = "") {
  log.push(`${ok ? "  ok  " : "  FAIL"} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) fails.push(label);
}

async function open(browser, { width, height = 900, throttle = 0, teacher = false }) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  let mutationApplied = !MUTATE;
  page.on("request", (r) => requests.push(r.url()));
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    // The "Failed to load resource" line carries no URL; the response listener
    // below names it, so only other console errors are recorded here.
    if (m.type() === "error" && !m.text().startsWith("Failed to load resource"))
      errors.push(`console: ${m.text().slice(0, 160)}`);
  });
  page.on("response", (r) => {
    // /api/* is a Pages Function: a plain static preview has none, and 404s it.
    if (r.status() >= 400 && !new URL(r.url()).pathname.startsWith("/api/"))
      errors.push(`${r.status()} ${r.url().replace(BASE, "")}`);
  });
  if (MUTATE) {
    const [pattern, from, to] = MUTATIONS[MUTATE] ?? [];
    if (!pattern) throw new Error(`unknown --mutate ${MUTATE}`);
    await page.route(pattern, async (route) => {
      const response = await route.fetch();
      const body = await response.text();
      if (!body.includes(from))
        throw new Error(`mutation "${MUTATE}": text not found in ${route.request().url()}`);
      mutationApplied = true;
      await route.fulfill({ response, body: body.replace(from, to) });
    });
  }
  if (throttle) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  }
  await page.addInitScript(() => {
    window.__lcp = 0;
    window.__cls = 0;
    window.__events = [];
    const observe = (type, fn, extra = {}) => {
      try {
        new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({
          type,
          buffered: true,
          ...extra,
        });
      } catch {}
    };
    observe("largest-contentful-paint", (e) => {
      window.__lcp = e.startTime;
    });
    observe("layout-shift", (e) => {
      if (!e.hadRecentInput) window.__cls += e.value;
    });
    observe("event", (e) => window.__events.push(e.duration), { durationThreshold: 16 });
  });
  await page.goto(`${BASE}/curriculum/${teacher ? "?teacher=1" : ""}`, { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(600);
  if (!mutationApplied) throw new Error(`mutation "${MUTATE}" never matched a served script`);
  return { context, page, requests, errors };
}

const hits = (requests, names) => names.filter((n) => requests.some((u) => u.includes(n)));
const text = (page, selector) =>
  page.evaluate(
    (s) => document.querySelector(s)?.innerText.replace(/\s+/g, " ").trim() ?? null,
    selector,
  );

async function axeViolations(page) {
  await page.evaluate(AXE);
  const result = await page.evaluate(() =>
    window.axe.run(document, { resultTypes: ["violations"] }),
  );
  return result.violations.map((v) => `${v.id}:${v.nodes.length}`).sort();
}

async function studentPass(browser, width) {
  const tag = `student@${width}`;
  const { context, page, requests, errors } = await open(browser, { width });

  /* LOAD: nothing deferred was requested at boot. */
  if (!BASELINE) {
    for (const [feature, files] of Object.entries(DEFERRED)) {
      const early = hits(requests, files);
      check(early.length === 0, `${tag} boot does not fetch ${feature} data`, early.join(", "));
    }
  }
  check(errors.length === 0, `${tag} no console/page errors`, errors.slice(0, 2).join(" | "));

  /* BEHAVE: This-week card and Today's Mission picker. */
  const obs = {};
  obs.thisWeek = await text(page, "#hub-now");
  check(Boolean(obs.thisWeek && obs.thisWeek.length > 40), `${tag} This-week card has content`);
  await page.selectOption("#ewlc-unit", { index: 2 });
  const lessons = await page.$$eval("#ewlc-lesson option", (o) =>
    o.map((x) => x.textContent.trim()),
  );
  await page.selectOption("#ewlc-lesson", { index: 1 });
  obs.picker = {
    lessons: lessons.length,
    first: lessons[0],
    chosen: await page.$eval("#ewlc-lesson", (s) => s.selectedOptions[0].textContent.trim()),
  };
  check(lessons.length > 1, `${tag} picking Unit 3 lists its lessons`, `${lessons.length} lessons`);

  /* Atlas: scrolled into view, the card fills. */
  await page.locator(".ewlc-atlas").scrollIntoViewIfNeeded();
  await page.waitForSelector(".ewlc-atlas .at-mini", { timeout: 10000 });
  obs.atlas = await text(page, ".ewlc-atlas");
  check(
    /My Learning Atlas/.test(obs.atlas),
    `${tag} Atlas card fills once in view`,
    obs.atlas.slice(0, 60),
  );
  const atlasHref = await page.$eval(".ewlc-atlas a.at-btn", (a) => a.getAttribute("href"));
  check(/my-progress/.test(atlasHref), `${tag} Atlas card links to My Progress`, atlasHref);
  if (!BASELINE) {
    const late = hits(requests, DEFERRED.atlas);
    check(
      late.length === DEFERRED.atlas.length,
      `${tag} Atlas data is fetched when the card nears view`,
      `${late.length}/${DEFERRED.atlas.length}`,
    );
  }

  /* Find-a-lesson search. */
  await page.fill("#hub-find-input", "ratio");
  await page.waitForTimeout(500);
  obs.search = await page.$$eval(".hub-find__results > *", (n) =>
    n.slice(0, 3).map((x) => x.textContent.replace(/\s+/g, " ").trim().slice(0, 60)),
  );
  check(obs.search.length > 0, `${tag} searching "ratio" lists lessons`, obs.search[0] ?? "");

  obs.axe = await axeViolations(page);
  log.push(`  info  ${tag} axe violations: ${obs.axe.join(" ") || "none"}`);

  await context.close();
  return obs;
}

async function revealPass(browser) {
  const href = "/lessons/3-4/downloads/reveal/3.4-session-1-practice-form-a.docx";
  const expected = "3.4 Session 1 Practice - Form A.docx";
  const addLink = ({ id, h }) => {
    const a = document.createElement("a");
    a.id = id;
    a.href = h;
    a.target = "_blank";
    a.textContent = id;
    document.body.appendChild(a);
  };

  {
    const { context, page, requests } = await open(browser, { width: 1440 });
    const before = hits(requests, DEFERRED.reveal).length;
    await page.evaluate(addLink, { id: "rv-probe", h: href });
    await page.waitForFunction(
      () => document.getElementById("rv-probe")?.hasAttribute("download"),
      null,
      { timeout: 8000 },
    );
    const attrs = await page.$eval("#rv-probe", (a) => ({
      download: a.getAttribute("download"),
      target: a.getAttribute("target"),
    }));
    check(attrs.download === expected, "reveal: link gets its original filename", attrs.download);
    check(attrs.target === null, "reveal: link drops target=_blank like before");
    if (!BASELINE) {
      check(before === 0, "reveal: manifest not fetched until a Reveal link exists");
      check(
        hits(requests, DEFERRED.reveal).length === 1,
        "reveal: manifest fetched once, on demand",
      );
    }
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: true,
    });
    const page = await context.newPage();
    await page.route("**/data/reveal-document-downloads.json*", async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.continue();
    });
    await page.route(`**${href}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        body: "docx",
      }),
    );
    await page.goto(`${BASE}/curriculum/`, { waitUntil: "load" });
    await page.evaluate(addLink, { id: "rv-race", h: href });
    const popups = [];
    page.on("popup", (p) => popups.push(p.url()));
    const downloading = page.waitForEvent("download", { timeout: 9000 });
    await page.evaluate(() => document.getElementById("rv-race").click());
    const download = await downloading.catch(() => null);
    check(
      download?.suggestedFilename() === expected,
      "reveal: a click that beats the manifest still downloads under the original filename",
      download?.suggestedFilename() ?? "no download",
    );
    check(popups.length === 0, "reveal: early click opens no stray tab");
    await context.close();
  }
}

/** The teacher panel is shown and its stage has been drawn. */
const drawn = () => {
  const panel = document.getElementById("curriculum-teacher-workflow");
  return Boolean(panel && !panel.hidden && panel.querySelector(".ctw-stage")?.children.length);
};
const stageLength = (page) =>
  page.evaluate(
    () =>
      document.querySelector("#curriculum-teacher-workflow .ctw-stage")?.textContent.trim()
        .length ?? 0,
  );

async function teacherPass(browser) {
  {
    const { context, page, requests, errors } = await open(browser, { width: 1440, teacher: true });
    await page.waitForFunction(drawn, null, { timeout: 10000 });
    // The panel lives in one tab of the teacher bar; open that tab first.
    await page.evaluate(() =>
      window.CurriculumTeacherBar?.reveal(document.getElementById("curriculum-teacher-workflow")),
    );
    const tabs = {};
    for (const view of ["today", "week", "playlist", "unit", "next"]) {
      await page.click(`#curriculum-teacher-workflow [data-ctw-view="${view}"]`);
      await page.waitForTimeout(250);
      tabs[view] = await stageLength(page);
    }
    check(
      Object.values(tabs).every((n) => n > 40),
      "teacher (loaded as teacher): all five views draw",
      JSON.stringify(tabs),
    );
    const selects = await page.$$eval(".tws-pick select", (s) => s.map((x) => x.options.length));
    check(
      selects.length === 3,
      "teacher: lesson picker renders its three selects",
      selects.join("/"),
    );
    check(errors.length === 0, "teacher: no console/page errors", errors.slice(0, 2).join(" | "));
    check(
      DEFERRED.teacher.every((f) => hits(requests, [f]).length === 1),
      "teacher: panel data fetched once each",
    );
    await context.close();
  }
  {
    const { context, page, requests, errors } = await open(browser, { width: 1440 });
    const hidden = await page
      .$eval("#curriculum-teacher-workflow", (p) => p.hidden)
      .catch(() => null);
    check(hidden === true, "student: teacher panel stays hidden");
    if (!BASELINE) {
      const early = hits(requests, DEFERRED.teacher);
      check(early.length === 0, "student: no teacher-panel data fetched", early.join(", "));
    }
    await page.evaluate(() => document.body.classList.add("teacher-mode"));
    await page.waitForFunction(drawn, null, { timeout: 10000 });
    const chars = await stageLength(page);
    check(chars > 40, "teacher (switched on at runtime): panel draws whole", `${chars} chars`);
    check(
      DEFERRED.teacher.every((f) => hits(requests, [f]).length === 1),
      "teacher (runtime): panel data fetched once each",
    );
    check(
      errors.length === 0,
      "teacher (runtime): no console/page errors",
      errors.slice(0, 2).join(" | "),
    );
    await context.close();
  }
}

async function vitals(browser) {
  const { context, page } = await open(browser, { width: 1440, throttle: 4 });
  await page.click(".hub-find__chip >> nth=0").catch(() => {});
  await page.selectOption("#ewlc-unit", { index: 3 }).catch(() => {});
  await page.keyboard.press("Tab");
  await page.waitForTimeout(400);
  const v = await page.evaluate(() => ({
    lcp: Math.round(window.__lcp),
    cls: Number(window.__cls.toFixed(4)),
    events: window.__events.length,
    maxEvent: Math.round(Math.max(0, ...window.__events)),
  }));
  log.push(
    `  info  vitals @4x CPU: LCP ${v.lcp} ms, CLS ${v.cls}, slowest interaction ${v.maxEvent} ms over ${v.events} events >16 ms`,
  );
  check(v.cls < 0.1, "CLS under 0.1", String(v.cls));
  check(v.lcp < 2500, "LCP under 2500 ms at 4x CPU", `${v.lcp} ms`);
  await context.close();
}

const browser = await chromium.launch();
try {
  const observations = {};
  for (const width of [1440, 390]) observations[width] = await studentPass(browser, width);
  await revealPass(browser);
  await teacherPass(browser);
  await vitals(browser);
  console.log(log.join("\n"));
  console.log(`\nobservations ${JSON.stringify(observations)}`);
} finally {
  await browser.close();
}
console.log(
  fails.length
    ? `\n${fails.length} FAILED${MUTATE ? ` (mutation "${MUTATE}")` : ""}`
    : "\nall checks passed",
);
process.exit(fails.length ? 1 : 0);
