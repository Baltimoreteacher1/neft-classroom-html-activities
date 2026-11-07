#!/usr/bin/env node
/**
 * The lesson frame in a real browser (ACCESS Practice Lab activity page), at 360 and 1366px.
 * Drives what a learner does: see the skill lesson, press "Got it", answer wrong then right, open the model from
 * feedback, mark a passage with the pen, pick what helped, reload; then the same page in Español + English with
 * 140% text, in forced-colors, in print, and in Try independently. Asserts no horizontal scroll, no console errors,
 * the step rail and chips fit, the printed sheet carries the lesson, and axe finds nothing serious inside the activity.
 * A missing browser is a SKIP (exit 0 locally, exit 1 in CI), never a pass.
 */
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-lesson-frame-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const AXE = createRequire(import.meta.url).resolve("axe-core");
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
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
await new Promise((r) => server.listen(0, r));
const origin = `http://localhost:${server.address().port}`;
const LAB = `${origin}/access-practice-lab`;

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const bank = (band, domain) =>
  JSON.parse(
    readFileSync(join(REPO_ROOT, "access-practice-lab/content", band, `${domain}.json`), "utf8"),
  );
const find = (band, domain, id) => {
  for (const [level, L] of Object.entries(bank(band, domain).levels)) {
    const a = L.activities.find((x) => x.id === id);
    if (a) return { level, a };
  }
  throw new Error(`${id} not found`);
};
const READ = find("g6-8", "Reading", "v3-r-b-1");
const LISTEN = find("g6-8", "Listening", "classroom-directions");

const browser = await chromium.launch({
  ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
});

async function open(
  width,
  { lang = "en", textSize = 1, forcedColors = "none", mode = "", start = true } = {},
) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, forcedColors });
  await context.addInitScript(
    ([l, size]) => {
      if (!sessionStorage.getItem("lf-seeded")) {
        localStorage.setItem(
          "accessPracticeLab:v1:prefs",
          JSON.stringify({ lang: l, langChosen: true, textSize: size }),
        );
        sessionStorage.setItem("lf-seeded", "1");
      }
    },
    [lang, textSize],
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/Failed to load resource|web-vitals/.test(m.text()) &&
      errors.push(m.text()),
  );
  if (start) await go(page, "Reading", READ, mode);
  return { context, page, errors };
}
async function go(page, domain, s, mode = "") {
  await page.goto(
    `${LAB}/${domain}/${s.level}/${s.a.id}?grades=6-8${mode ? `&mode=${mode}` : ""}`,
    { waitUntil: "networkidle" },
  );
  await page.waitForSelector("article.activity .lf-rail");
}
// Horizontal overflow of the lesson itself (the shared site header has its own 140% text behavior).
const overflow = (page) =>
  page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    let max = 0;
    for (const el of document.querySelectorAll("article.activity, article.activity *")) {
      if (el.closest("svg") && el.tagName !== "svg") continue;
      const closed = el.closest("details:not([open])");
      if (closed && !el.closest("summary")) continue; // not on screen
      max = Math.max(max, Math.ceil(el.getBoundingClientRect().right) - width);
    }
    return max;
  });
const clipped = (page) =>
  page.evaluate(
    () =>
      [
        ...document.querySelectorAll(
          ".lf-arc-btn, .lf-chip, .lf-goal, .lf-learn, .lf-fb-part, .lf-next, .lf-reflect",
        ),
      ].filter(
        (el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible",
      ).length,
  );
const counts = (page) =>
  page.evaluate(() => document.querySelector(".lf-rail-count")?.textContent.trim());

async function axeInActivity(page, label) {
  await page.addScriptTag({ path: AXE });
  const bad = await page.evaluate(async () => {
    const r = await window.axe.run(document.querySelector("article.activity"), {
      runOnly: ["wcag2a", "wcag2aa", "wcag22aa"],
    });
    return r.violations
      .filter((v) => ["serious", "critical"].includes(v.impact))
      .map((v) => `${v.id}: ${v.nodes[0].target.join(" ")}`);
  });
  ok(
    bad.length === 0,
    `${label}: axe serious/critical inside the activity (${bad.join(" | ") || "none"})`,
  );
}

for (const width of [360, 1366]) {
  const tag = `${width}px`;
  // ── a first visit, end to end ──
  const { context, page, errors } = await open(width);
  ok((await page.locator(".lf-arc > li").count()) === 4, `${tag}: four steps in the rail`);
  ok(
    /Step 1 of 4: Warm up/.test(await counts(page)),
    `${tag}: starts on Warm up (${await counts(page)})`,
  );
  ok(
    await page.locator("#lf-learn-body").isVisible(),
    `${tag}: the skill lesson is open on the first visit`,
  );
  ok(
    (await page.locator("#lf-learn svg.lf-dg").count()) === 1 &&
      (await page.locator("#lf-learn svg.lf-dg").evaluate((s) => s.getBoundingClientRect().width)) >
        200,
    `${tag}: diagram drawn at a readable width`,
  );
  ok((await overflow(page)) <= 0, `${tag}: no horizontal scroll with the lesson open`);
  ok((await clipped(page)) === 0, `${tag}: nothing in the frame is clipped`);
  await axeInActivity(page, `${tag} first visit`);

  await page.click("[data-frame-ready]");
  await page.waitForFunction(() => document.querySelector("#lf-learn-body")?.hidden === true);
  ok(
    /Step 3 of 4: Try/.test(await counts(page)),
    `${tag}: Got it moves to Try (${await counts(page)})`,
  );
  ok(
    await page.evaluate(() => document.activeElement?.closest(".answer-zone") !== null),
    `${tag}: focus lands in the answer zone`,
  );
  await page.reload({ waitUntil: "networkidle" });
  ok(
    !(await page.locator("#lf-learn-body").isVisible()),
    `${tag}: the lesson stays closed after a reload (seen on this device)`,
  );
  await page.click("[data-frame-learn-toggle]");
  ok(await page.locator("#lf-learn-body").isVisible(), `${tag}: the lesson can be re-opened`);
  await page.click("[data-frame-ready]");

  // pen
  await page.click('[data-frame-mark="highlight"]');
  const sentence = page.locator("[data-reading-passage] .reading-sentence").nth(1);
  await sentence.click();
  ok(
    (await sentence.getAttribute("data-mark")) === "highlight",
    `${tag}: the pen marks a sentence`,
  );
  await sentence.click();
  ok((await sentence.getAttribute("data-mark")) === null, `${tag}: tapping again removes it`);
  await page.click('[data-frame-mark="highlight"]');

  // a miss, then the model, then right
  const right = READ.a.answers;
  const wrong = READ.a.sentences.map((s) => s.id).filter((id) => !right.includes(id));
  await page.click(`[data-ans-hot="${right[0]}"]`);
  await page.click(`[data-ans-hot="${wrong[0]}"]`);
  await page.click("[data-check]");
  await page.waitForSelector(".feedback.is-hint .lf-fb-part");
  const heads = await page.locator(".feedback .lf-fb-part h3").allTextContents();
  ok(
    heads.join("|") === "What went well|One next step",
    `${tag}: miss feedback has two named parts (${heads.join("|")})`,
  );
  ok(
    /1 of 2 right/.test(await page.locator(".feedback .lf-fb-part p").first().textContent()),
    `${tag}: the miss names what is right`,
  );
  ok((await overflow(page)) <= 0, `${tag}: no horizontal scroll on feedback`);
  await page.click("[data-frame-model]");
  await page.waitForFunction(() => document.querySelector("#lf-learn-body")?.hidden === false);
  ok(
    await page.locator(".lf-learn-model").isVisible(),
    `${tag}: Show me the model opens the worked model`,
  );
  await page.click("[data-frame-ready]");
  await page.click("[data-retry]");
  await page.click(`[data-ans-hot="${wrong[0]}"]`);
  await page.click(`[data-ans-hot="${right[1]}"]`);
  await page.click("[data-check]");
  await page.waitForSelector(".lf-after .lf-next");
  ok(
    /Step 4 of 4: Reflect/.test(await counts(page)),
    `${tag}: after a right answer the rail reaches Reflect`,
  );
  ok((await page.locator("[data-frame-helped]").count()) >= 4, `${tag}: reflection chips offered`);
  ok(
    /Try one on your own/.test(await page.locator(".lf-next h3").textContent()),
    `${tag}: help was used, so the next step is to try one alone`,
  );
  await axeInActivity(page, `${tag} after answering`);
  await page.click('[data-frame-helped="again"]');
  await page.reload({ waitUntil: "networkidle" });
  ok(
    (await page.locator('[data-frame-helped="again"][aria-pressed="true"]').count()) === 1,
    `${tag}: the chosen reflection is remembered on this device`,
  );
  ok((await overflow(page)) <= 0, `${tag}: no horizontal scroll after reload`);

  // print: the lesson is on the sheet, the controls are not
  await page.emulateMedia({ media: "print" });
  const printed = await page.evaluate(() => {
    const shown = (sel) => {
      const el = document.querySelector(sel);
      return Boolean(el) && getComputedStyle(el).display !== "none";
    };
    return {
      body: shown("#lf-learn-body"),
      head: shown(".lf-print-head"),
      foot: shown(".lf-print-foot"),
      rail: shown(".lf-rail"),
      nav: shown(".act-nav"),
      moves: document.querySelectorAll(".lf-moves li").length,
    };
  });
  ok(
    printed.body && printed.head && printed.foot && printed.moves === 3,
    `${tag}: print view carries the skill lesson, name line and footer`,
  );
  ok(!printed.rail && !printed.nav, `${tag}: print view drops the rail and navigation`);
  await page.emulateMedia({ media: "screen" });
  ok(
    errors.length === 0,
    `${tag}: no console errors (${errors.slice(0, 2).join(" | ") || "none"})`,
  );
  await context.close();

  // ── independent: no lesson, no key words, no model ──
  const alone = await open(width, { mode: "independent" });
  ok(
    (await alone.page.locator(".lf-learn, .lf-words, [data-frame-model]").count()) === 0,
    `${tag}: Try independently shows no lesson, key words or model`,
  );
  ok(
    (await alone.page.locator(".lf-arc-step.is-skipped").count()) === 1,
    `${tag}: Learn is shown as closed on my own`,
  );
  ok((await overflow(alone.page)) <= 0, `${tag}: independent: no horizontal scroll`);
  await alone.context.close();

  // ── Español, then both languages, at 140% text ──
  for (const [lang, label] of [
    ["es", "Español"],
    ["bi", "English + Español"],
  ]) {
    const big = await open(width, { lang, textSize: 1.4 });
    await big.page.click(".lf-words > summary");
    ok((await overflow(big.page)) <= 0, `${tag} ${label} 140%: no horizontal scroll`);
    ok((await clipped(big.page)) === 0, `${tag} ${label} 140%: nothing clipped`);
    if (lang === "es") {
      ok(
        /^Paso \d de 4/.test(await counts(big.page)),
        `${tag}: Spanish rail count (${await counts(big.page)})`,
      );
      const english = await big.page.evaluate(() => {
        const found = [];
        const walker = document.createTreeWalker(
          document.querySelector(".lf-rail").parentElement,
          NodeFilter.SHOW_TEXT,
        );
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const el = n.parentElement;
          if (
            !el.closest(".lf-rail, .lf-goal-text, .lf-learn, .lf-eyebrow") ||
            el.closest("[lang='en'], svg, [hidden]")
          )
            continue;
          const text = n.textContent.replace(/\s+/g, " ").trim();
          if (/(?<!\p{L})(the|your|and|with|you|this|then|from)(?!\p{L})/iu.test(text))
            found.push(text.slice(0, 60));
        }
        return found;
      });
      ok(
        english.length === 0,
        `${tag}: Spanish frame chrome has no English function words (${english.slice(0, 2).join(" | ") || "none"})`,
      );
    }
    ok(big.errors.length === 0, `${tag} ${label}: no console errors`);
    await big.context.close();
  }

  // ── forced colors ──
  const forced = await open(width, { forcedColors: "active" });
  ok((await overflow(forced.page)) <= 0, `${tag} forced-colors: no horizontal scroll`);
  const stepBorder = await forced.page
    .locator(".lf-arc-step.is-current .lf-arc-btn")
    .evaluate((el) => getComputedStyle(el).borderTopWidth);
  ok(
    Number.parseFloat(stepBorder) >= 2,
    `${tag} forced-colors: the current step keeps a visible border`,
  );
  await forced.context.close();

  // ── listening (a heard activity) ──
  const listen = await open(width, { start: false });
  await go(listen.page, "Listening", LISTEN);
  ok(
    (await listen.page.locator(".lf-learn svg.lf-dg").count()) === 1,
    `${tag}: listening activity has its skill lesson`,
  );
  ok((await overflow(listen.page)) <= 0, `${tag}: listening: no horizontal scroll`);
  ok(listen.errors.length === 0, `${tag}: listening: no console errors`);
  await listen.context.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-lesson-frame-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-lesson-frame-e2e: all checks passed");
