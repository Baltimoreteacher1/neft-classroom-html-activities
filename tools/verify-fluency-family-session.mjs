// The guided family session, driven the way a family drives it (npm run validate:fluency-family-session).
// From a cold start on the family home: tap the guided Start, read Learn, tap Try (two taps to the first problem), answer
// the rounds, play a second game, explain, celebrate, continue. Checked in English and Spanish at 390 and 1280 wide:
// it resumes after a reload, works with storage blocked, makes no request that leaves the origin and no write request,
// stays under the first-view byte budget with no layout shift, and passes axe, keyboard, target-size and reading-size rules.
// A missing browser is a SKIP (exit 3 locally, a failure in CI).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { G } from "../math/fluency-lab/family/fm2/guided/guided-copy.js";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const FIRST_VIEW_BUDGET = 150 * 1024;
const TIMER_WORDS =
  /\b(countdown|timer|streak|leaderboard|rank(?:ing)?|racha|clasificaci[oó]n)\b|time left|tiempo restante|seconds? left|segundos restantes/i;
// Plain static files, exactly as the site ships them (the family pages are copied verbatim, not bundled), so the byte budget
// measures what a phone downloads rather than what a dev server adds.
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(
      /^(\.\.[/\\])+/,
      "",
    );
    const file = join(REPO_ROOT, path.endsWith("/") ? `${path}index.html` : path);
    if (!file.startsWith(REPO_ROOT)) throw new Error("outside");
    // Vite serves /public at the site root; do the same for files the source tree does not hold.
    const body = await readFile(file).catch(() => readFile(join(REPO_ROOT, "public", path)));
    res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const home = (lang) => `${base}/math/fluency-lab/family/?lang=${lang}`;
const session = (query) => `${base}/math/fluency-lab/family/session.html?${query}`;
const results = [];
const note = (text) => results.push(text);

async function open(browser, { width, lang, blockStorage = false }) {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 900 },
    reducedMotion: "reduce",
    hasTouch: width < 600,
  });
  const init = [];
  if (blockStorage)
    init.push(() =>
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("storage blocked");
        },
      }),
    );
  init.push(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  for (const fn of init) await context.addInitScript(fn);
  const page = await context.newPage();
  const log = { errors: [], requests: [], responses: [] };
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && log.errors.push(e.message));
  // web-vitals is a bare specifier that Vite resolves at build time; a source-tree server cannot, and the 404 console line
  // that goes with a missing file is reported by URL below instead of by its generic text.
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|status of 404/.test(m.text()) &&
      log.errors.push(m.text()),
  );
  page.on(
    "response",
    (r) =>
      r.status() === 404 &&
      !/web-vitals|favicon/.test(r.url()) &&
      log.errors.push(`404 ${r.url()}`),
  );
  page.on("request", (r) => log.requests.push({ url: r.url(), method: r.method() }));
  page.on("response", (r) => log.responses.push(r));
  return { context, page, log, lang, width };
}

const clean = (log, label) => {
  assert.deepEqual(log.errors, [], `${label}: no page or console errors`);
  const outside = log.requests.filter(
    (r) => !r.url.startsWith(base) && !r.url.startsWith("data:") && !r.url.startsWith("blob:"),
  );
  assert.deepEqual(outside, [], `${label}: no request leaves the origin`);
  const writes = log.requests.filter((r) => r.method !== "GET" && r.method !== "HEAD");
  assert.deepEqual(writes, [], `${label}: no write request`);
};

async function axeClean(page, label) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const bad = violations.filter((v) => ["serious", "critical"].includes(v.impact));
  assert.deepEqual(
    bad.map(
      (v) =>
        `${v.id}: ${v.nodes
          .slice(0, 2)
          .map((n) => n.target.join(" "))
          .join(", ")}`,
    ),
    [],
    `${label}: axe serious/critical`,
  );
}

async function layoutRules(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  assert.ok(overflow <= 0, `${label}: no horizontal scroll (${overflow}px)`);
  const small = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "#gs-step button, #gs-step a[href], #gs-step label.fm-choice, #gs-step .fm-seg__opt, .fm-topbar a, .fm-topbar .fm-seg__opt",
      ),
    ]
      .filter((el) => el.getBoundingClientRect().width > 0)
      .map((el) => ({
        el: (el.dataset.act || el.dataset.grade || el.className || el.tagName)
          .toString()
          .slice(0, 30),
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
      }))
      .filter((box) => box.h < 44 || box.w < 44),
  );
  assert.deepEqual(small, [], `${label}: every target is at least 44px`);
  const tiny = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "#gs-step p, #gs-step li, #gs-step h1, #gs-step h2, #gs-step label, #gs-step small, #gs-steps p",
      ),
    ]
      .filter(
        (el) =>
          el.offsetParent &&
          el.textContent.trim() &&
          getComputedStyle(el).fontSize &&
          parseFloat(getComputedStyle(el).fontSize) < 16,
      )
      .map((el) => `${el.tagName}.${el.className}:${getComputedStyle(el).fontSize}`),
  );
  assert.deepEqual(tiny, [], `${label}: reading text is 16px or larger`);
}

async function visible(page) {
  return page.evaluate(() => document.querySelector("main").innerText);
}

const noEnglishInSpanish = (text, label) => {
  const leaks = Object.values(G)
    .flatMap((value) => (value.en ? [value] : Object.values(value)))
    .filter(
      (pair) =>
        pair.en &&
        pair.en.length >= 14 &&
        pair.en !== pair.es &&
        !/\{/.test(pair.en) &&
        text.includes(pair.en),
    );
  assert.deepEqual(
    leaks.map((p) => p.en),
    [],
    `${label}: no English guided text on a Spanish screen`,
  );
};

const seamReady = (page) => page.waitForFunction(() => Boolean(window.__fm2?.round));

// Answer rounds through the shell's own seam until the stepper moves past the named step.
async function playRounds(page, until) {
  for (let i = 0; i < 14; i += 1) {
    // Either the next step is on screen or the shell holds a live round; between them the page is rendering asynchronously.
    await page.waitForFunction(
      (selector) => document.querySelector(selector) || window.__fm2?.round,
      until,
    );
    if (await page.locator(until).count()) return;
    if (await page.locator("[data-fm2-next]").isVisible())
      await page.locator("[data-fm2-next]").click();
    else {
      await page.evaluate(() => window.__fm2.submit(window.__fm2.solve()));
      await page.locator("[data-fm2-next]").waitFor({ state: "visible" });
    }
  }
  assert.ok(await page.locator(until).count(), `rounds ended before ${until}`);
}

async function fullFlow(browser, { width, lang }) {
  const label = `${lang}@${width}`;
  const h = await open(browser, { width, lang });
  const { page, log } = h;
  await page.goto(home(lang), { waitUntil: "networkidle" });
  await page.locator("[data-testid=start-guided]").waitFor();
  let taps = 0;
  await page.locator("[data-testid=start-guided]").click();
  taps += 1;
  await page.locator("[data-testid=learn-idea]").waitFor();
  assert.equal(new URL(page.url()).pathname, "/math/fluency-lab/family/session.html");
  assert.equal(await page.evaluate(() => document.documentElement.lang), lang);
  assert.ok(
    (await page.locator("[data-testid=learn-idea]").innerText()).length > 20,
    `${label}: Learn shows an idea`,
  );
  assert.ok(
    (await page.locator("[data-testid=learn-example]").innerText()).length > 10,
    `${label}: Learn shows a worked example`,
  );
  assert.ok(
    (await page.locator("[data-testid=parent-coach]").innerText()).length > 60,
    `${label}: Learn has a parent line`,
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.tagName),
    "H1",
    `${label}: focus moves to the step heading`,
  );
  const learnText = await visible(page);
  assert.ok(!TIMER_WORDS.test(learnText), `${label}: no timers or streaks on Learn`);
  if (lang === "es") noEnglishInSpanish(learnText, label);
  await layoutRules(page, `${label} learn`);
  await axeClean(page, `${label} learn`);

  // Resume: a reload on Learn comes back to the same card.
  const ideaBefore = await page.locator("[data-testid=learn-idea]").innerText();
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-testid=learn-idea]").waitFor();
  assert.equal(
    await page.locator("[data-testid=learn-idea]").innerText(),
    ideaBefore,
    `${label}: reload resumes the same Learn card`,
  );

  await page.locator("[data-testid=start-try]").click();
  taps += 1;
  await page.locator("[data-fm2-prompt]").waitFor();
  assert.ok(
    (await page.locator("[data-fm2-prompt]").innerText()).trim().length > 5,
    `${label}: first problem visible`,
  );
  assert.ok(taps <= 2, `${label}: two taps from the home page to the first problem (${taps})`);

  // Answer one round, reload mid-Try, expect round 2.
  await seamReady(page);
  await page.evaluate(() => window.__fm2.submit(window.__fm2.solve()));
  await page.locator("[data-fm2-next]").click();
  await page.waitForFunction(() =>
    /2/.test(document.querySelector("[data-fm2-round]")?.textContent || ""),
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-fm2-round]").waitFor();
  assert.match(
    await page.locator("[data-fm2-round]").innerText(),
    /2/,
    `${label}: reload resumes the Try round`,
  );
  if (lang === "en" && width === 390) await axeClean(page, `${label} try`);

  await playRounds(page, "[data-testid=play-intro]");
  if (lang === "es") noEnglishInSpanish(await visible(page), `${label} play`);
  await layoutRules(page, `${label} play intro`);
  await page.locator("[data-testid=start-play]").click();
  await page.locator("[data-fm2-prompt]").waitFor();
  await playRounds(page, "[data-testid=explain-card]");
  assert.ok(
    (await page.locator("input[name=gs-helped]").count()) >= 4,
    `${label}: Explain offers tap choices`,
  );
  if (lang === "es") noEnglishInSpanish(await visible(page), `${label} explain`);
  await layoutRules(page, `${label} explain`);
  await axeClean(page, `${label} explain`);
  await page.locator("[data-testid=explain-done]").click();
  assert.ok(
    (await page.locator("#gs-pick").innerText()).length > 3,
    `${label}: asks for a choice before finishing`,
  );
  await page.locator("input[name=gs-helped][value=model]").check();
  await page.locator("[data-testid=explain-done]").click();
  await page.locator("[data-testid=celebrate]").waitFor();
  const celebrateText = await visible(page);
  assert.ok(
    !TIMER_WORDS.test(celebrateText),
    `${label}: Celebrate has no timer, streak or ranking`,
  );
  if (lang === "es") noEnglishInSpanish(celebrateText, `${label} celebrate`);
  await layoutRules(page, `${label} celebrate`);
  await axeClean(page, `${label} celebrate`);
  await page.locator("[data-testid=to-continue]").click();
  await page.locator("[data-testid=continue-card]").waitFor();
  assert.equal(
    await page.locator("[data-testid=continue-card]").getAttribute("data-kind"),
    "next",
    `${label}: all rounds right leads to a new skill`,
  );
  await layoutRules(page, `${label} continue`);
  await axeClean(page, `${label} continue`);

  const saved = await page.evaluate(() => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("ewl-fm2-guided-v1"));
    return keys.map((k) => JSON.parse(localStorage.getItem(k)));
  });
  assert.equal(saved.length, 1, `${label}: one guided record on this device`);
  assert.equal(saved[0].history.length, 1, `${label}: one honest history line`);
  assert.equal(saved[0].history[0].explain, "model");
  const store = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k.startsWith("ewl-fm2-v1"))
      .map((k) => JSON.parse(localStorage.getItem(k))),
  );
  assert.equal(
    store[0].sessions.length,
    1,
    `${label}: the session reached the progress record once`,
  );

  // Continue into the next session: Learn again, and the home page says it is waiting.
  await page.locator("[data-testid=start-next]").click();
  await page.locator("[data-testid=learn-idea]").waitFor();
  await page.goto(home(lang), { waitUntil: "networkidle" });
  const resumeText = await page.locator("[data-testid=start-guided]").innerText();
  assert.match(
    resumeText,
    lang === "es" ? /Seguir/ : /Continue/,
    `${label}: home offers to continue the saved session`,
  );
  clean(log, label);
  await h.context.close();
  note(`${label}: flow ok (${taps} taps to first problem)`);
}

async function coldBudget(browser) {
  const h = await open(browser, { width: 390, lang: "en" });
  await h.page.goto(session("grade=4&lang=en&new=1"), { waitUntil: "networkidle" });
  await h.page.locator("[data-testid=learn-idea]").waitFor();
  await h.page.waitForTimeout(500);
  let total = 0;
  const sizes = [];
  for (const response of h.log.responses) {
    if (!response.url().startsWith(base) || response.status() >= 400) continue;
    try {
      const bytes = gzipSync(await response.body()).length;
      total += bytes;
      sizes.push([bytes, response.url().replace(base, "")]);
    } catch {
      /* redirects and aborted requests have no body */
    }
  }
  sizes.sort((a, b) => b[0] - a[0]);
  assert.ok(
    total <= FIRST_VIEW_BUDGET,
    `first view ${(total / 1024).toFixed(0)} KB gzip must be at most 150 KB; largest: ${sizes
      .slice(0, 16)
      .map(([b, u]) => `${(b / 1024).toFixed(0)}KB ${u}`)
      .join(", ")}`,
  );
  const cls = await h.page.evaluate(() => window.__cls);
  assert.ok(cls <= 0.05, `layout shift ${cls.toFixed(3)} must be at most 0.05`);
  clean(h.log, "cold first view");
  await h.context.close();
  note(`first view ${(total / 1024).toFixed(0)} KB gzip, layout shift ${cls.toFixed(3)}`);
}

async function keyboardPath(browser) {
  const h = await open(browser, { width: 1280, lang: "en" });
  await h.page.goto(session("grade=2&lang=en&new=1"), { waitUntil: "networkidle" });
  await h.page.locator("[data-testid=learn-idea]").waitFor();
  let reached = false;
  for (let i = 0; i < 40 && !reached; i += 1) {
    await h.page.keyboard.press("Tab");
    reached = await h.page.evaluate(() => document.activeElement?.dataset?.testid === "start-try");
  }
  assert.ok(reached, "keyboard Tab reaches Let's try it");
  const ring = await h.page.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return parseFloat(s.outlineWidth) >= 3 && s.outlineStyle !== "none";
  });
  assert.ok(ring, "focus ring is at least 3px");
  await h.page.keyboard.press("Enter");
  await h.page.locator("[data-fm2-prompt]").waitFor();
  await h.context.close();
  note("keyboard path ok");
}

async function noStorage(browser) {
  const h = await open(browser, { width: 390, lang: "en", blockStorage: true });
  await h.page.goto(session("grade=3&lang=en&new=1"), { waitUntil: "networkidle" });
  await h.page.locator("[data-testid=learn-idea]").waitFor();
  assert.ok(
    await h.page.locator("#gs-storage").isVisible(),
    "a calm note says progress cannot be saved",
  );
  await h.page.locator("[data-testid=start-try]").click();
  await h.page.locator("[data-fm2-prompt]").waitFor();
  await h.context.close();
  note("storage blocked: session still runs");
}

async function coldChoose(browser) {
  const h = await open(browser, { width: 390, lang: "es" });
  await h.page.goto(session("lang=es"), { waitUntil: "networkidle" });
  await h.page.locator("[data-testid=choose-grade]").waitFor();
  noEnglishInSpanish(await visible(h.page), "es choose");
  await axeClean(h.page, "es choose");
  await h.page.locator("[data-grade='5']").click();
  await h.page.locator("[data-testid=learn-idea]").waitFor();
  await h.page.locator("[data-act=skill]").click();
  await h.page.locator("[data-testid=choose-skill]").waitFor();
  await layoutRules(h.page, "es choose skill");
  await axeClean(h.page, "es choose skill");
  await h.page.locator(".gs-skill").first().click();
  await h.page.locator("[data-testid=learn-idea]").waitFor();
  await h.context.close();
  note("Choose grade and skill ok");
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch (error) {
  console.warn(
    `SKIP validate:fluency-family-session: no browser (${error.message.split("\n")[0]})`,
  );
  server.close();
  process.exit(process.env.CI ? 1 : 3);
}
try {
  for (const lang of ["en", "es"])
    for (const width of [390, 1280]) await fullFlow(browser, { width, lang });
  await coldBudget(browser);
  await keyboardPath(browser);
  await noStorage(browser);
  await coldChoose(browser);
  console.log(`Guided family session: ${results.join("; ")}`);
} finally {
  await browser?.close();
  server.close();
}
