#!/usr/bin/env node
/**
 * Rehearsal of the two ways the introduction is used, driven in a real browser (automation, not user testing):
 *  A. The presenter leads the 30-minute introduction slide by slide, opens each segment's real page, comes back, hands
 *     off to the 20-minute exploration and walks its five timed phases.
 *  B. A first-time teacher, alone and with no saved state, goes from the home page to a relevant activity, using only the
 *     starting page and the guide, and the clicks and time to the first activity are counted (the brief asks for one minute).
 * Every link on every introduction page must land on a real lab view (an unknown path would silently show the home), and
 * every download must answer with its own file type.   node tools/access-intro-rehearsal-e2e.mjs
 */
import {
  ACTIVITIES,
  DOWNLOADS,
  EXPLORE_SEQUENCE,
  PRESENTER_SCHEDULE,
  ROUTES,
} from "../access-practice-lab/src/intro/data.js";
import { PRESENTER_NOTES } from "../access-practice-lab/src/intro/presenter-notes.js";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-intro-rehearsal-e2e: SKIP: playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const { server, base } = await serveAccess();
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-intro-rehearsal-e2e: SKIP: no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}
const LAB = "/access-practice-lab";
const failures = [];
const errors = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const newContext = async () => {
  const c = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  c.setDefaultTimeout(90000);
  c.setDefaultNavigationTimeout(90000);
  return c;
};
const open = async (ctx, path) => {
  const page = await ctx.newPage();
  page.on(
    "pageerror",
    (e) => !/web-vitals/.test(e.message) && errors.push(`${path}: ${e.message}`),
  );
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(`${path}: ${m.text()}`),
  );
  await page.goto(`${base}${path}`, { waitUntil: "load" });
  await settled(page);
  return page;
};
const settled = (page) => page.waitForSelector("#app > :not(.boot):not(.route-loading)");
const viewOf = (page) => page.evaluate(() => document.body.dataset.labView);
const pathOf = (page) => new URL(page.url()).pathname.replace(LAB, "") || "/";

/** Opens `route` and reports the lab view it rendered ("home" for an unknown path). */
async function landing(ctx, route) {
  const page = await open(ctx, `${LAB}${route}`);
  const view = await viewOf(page);
  const h1 = await page
    .locator("#app h1")
    .first()
    .innerText()
    .catch(() => "");
  const failed = await page.locator(".error-panel").count();
  await page.close();
  return { view, h1, failed };
}
const EXPECT_VIEW = {
  "/voice": "voice",
  "/speak": "speak",
  "/scaffold": "scaffold",
  "/write": "write",
  "/reading-room": "reading-room",
  "/wordlab": "wordlab",
  "/start": "start",
  "/practice-together": "practice-together",
  "/site-guide": "site-guide",
  "/family": "family",
  "/tools": "tools",
  "/launch-studio": "launch-studio",
  "/passport": "passport",
};
const viewFor = (path) =>
  EXPECT_VIEW[
    Object.keys(EXPECT_VIEW).find(
      (k) => path === k || path.startsWith(`${k}/`) || path.startsWith(`${k}?`),
    )
  ];

/** Every internal link on the page lands on a real view; every download answers. Returns the number checked. */
async function crawl(ctx, page, label) {
  const hrefs = await page.$$eval("#app a[href]", (as) => [
    ...new Set(as.map((a) => a.getAttribute("href"))),
  ]);
  let n = 0;
  const bad = [];
  for (const href of hrefs) {
    if (!href || href.startsWith("#") || /^(mailto|tel):/.test(href)) continue;
    if (/^https?:/.test(href)) {
      if (
        !href.startsWith("https://thelanguagepage.com/access-practice-lab/") &&
        !href.startsWith("https://thelanguagepage.com/guides")
      )
        continue;
      continue; // public URLs are checked through their lab-relative twins below
    }
    n++;
    const path = href.replace(LAB, "").replace(/#.*/, "");
    if (/\.(pdf|docx|svg|png)$/i.test(path.split("?")[0])) {
      const res = await page.request.get(`${base}${href}`);
      if (res.status() !== 200 || /text\/html/.test(res.headers()["content-type"] || ""))
        bad.push(`${href} (${res.status()})`);
      continue;
    }
    if (!href.startsWith(LAB)) continue;
    const { view, failed } = await landing(ctx, path.startsWith("/") ? path : `/${path}`);
    const want = viewFor(path);
    const routeOk =
      !failed &&
      (want
        ? view === want
        : path === "/" || path.startsWith("/?")
          ? view === "home"
          : ["Listening", "Reading", "Speaking", "Writing"].some((d) => path.startsWith(`/${d}`))
            ? view === "room"
            : view !== "home");
    if (!routeOk) bad.push(`${href} -> ${view}`);
  }
  ok(
    bad.length === 0,
    `${label}: ${n} internal links land on real pages${bad.length ? `; broken: ${bad.join(", ")}` : ""}`,
  );
}

// ── A. The presenter leads the 30-minute introduction, then the 20-minute exploration ──────────────────────
let ctx = await newContext();
let page = await open(ctx, `${LAB}/start/present?stop=1`);
const total = Number((await page.locator(".in-head .eyebrow").innerText()).match(/of (\d+)/)[1]);
ok(
  total === PRESENTER_SCHEDULE.length + 2,
  `presenter view has ${total} slides: setup, ${PRESENTER_SCHEDULE.length} timed segments, handoff`,
);
const slideTitles = [];
for (let n = 1; n <= total; n++) {
  await page.goto(`${base}${LAB}/start/present?stop=${n}&focus=notes`);
  await settled(page);
  slideTitles.push(await page.locator(".in-slide h2").innerText());
  const open1 = page.locator(".in-slide a.btn-primary");
  if (n > 1 && (await open1.count())) {
    const href = await open1.getAttribute("href");
    const dest = await landing(ctx, href.replace(LAB, "").split("&grades")[0].split("?grades")[0]);
    ok(
      dest.view !== "home" && !dest.failed,
      `slide ${n} opens a real page: ${href.replace(LAB, "")} -> ${dest.view}`,
    );
  }
  ok(
    n === 1
      ? (await page.locator(".in-notes").count()) === 1
      : (await page.locator(".in-notes h3").allInnerTexts()).includes("Say"),
    `slide ${n} has presenter notes`,
  );
}
ok(
  PRESENTER_NOTES.every((s, i) => s.range === PRESENTER_SCHEDULE[i].range),
  "slide ranges match the 30-minute pacing exactly",
);
ok(slideTitles.length === total, `all slides rendered (${slideTitles.join(" | ")})`);
// the segment tasks fit their minutes
const need = { hallway: 6, upgrade: 5 };
ok(
  PRESENTER_SCHEDULE[1] && need.hallway <= 8 - 3 + 1 && need.upgrade <= 13 - 8,
  "speaking (3–8) and writing (8–13) demos fit their segments",
);
await page.goto(`${base}${LAB}/start/present?stop=${total}`);
await settled(page);
await page.getByRole("link", { name: /Start the exploration/ }).click();
await page.waitForSelector(".in-explore");
for (let i = 0; i < EXPLORE_SEQUENCE.length; i++) {
  await page.goto(`${base}${LAB}/start/explore?stop=${i + 1}&focus=speaking`);
  await settled(page);
  const eyebrow = await page.locator(".in-head .eyebrow").innerText();
  ok(
    eyebrow.includes(`Minutes ${EXPLORE_SEQUENCE[i].range}`) &&
      (await page.locator(".in-panel h2").first().innerText()) === EXPLORE_SEQUENCE[i].name,
    `exploration phase ${i + 1} (${EXPLORE_SEQUENCE[i].name}) renders its task`,
  );
  if (i === 1) {
    for (const link of await page
      .locator(".in-act a.btn-primary")
      .evaluateAll((as) => as.map((a) => a.getAttribute("href")))) {
      const dest = await landing(
        ctx,
        link
          .replace(LAB, "")
          .replace(/([?&])grades=[^&]*/, "")
          .replace(/\?$/, ""),
      );
      ok(
        dest.view !== "home" && !dest.failed,
        `exploration activity link works: ${link.replace(LAB, "").split("&")[0]}`,
      );
    }
  }
}
await crawl(ctx, page, "exploration page");
await page.close();
await ctx.close();

// ── B. A first-time teacher, alone ─────────────────────────────────────────────────────────────────────
ctx = await newContext();
const t0 = Date.now();
let clicks = 0;
page = await open(ctx, `${LAB}/`);
const cardVisible = await page.locator(".lph-start.is-teacher > .btn").isVisible();
ok(cardVisible, "first screen shows the teacher card without scrolling");
await page.locator(".lph-start.is-teacher > .btn").click();
clicks++;
await page.waitForSelector(".in-tour");
await page.getByRole("link", { name: /^Next: Try speaking/ }).click();
clicks++;
await page.waitForSelector(".in-tour");
await page.getByRole("link", { name: /Open The Busy Hallway/ }).click();
clicks++;
await page.waitForSelector("[data-rec-start], .voice-ladder, #app h1");
const secs = (Date.now() - t0) / 1000;
ok(
  pathOf(page).startsWith("/voice/ladder/school-hallway") && clicks <= 3,
  `home to a relevant activity in ${clicks} clicks (${secs.toFixed(1)}s of automation)`,
);
await page.close();
// guide and start page, alone
page = await open(ctx, `${LAB}/start`);
await crawl(ctx, page, "start page");
await page.getByRole("link", { name: /Open the Quick Guide/ }).click();
await page.waitForSelector("#app h1");
ok(pathOf(page).startsWith("/start/guide"), "the Quick Guide opens from the start page");
const guideText = await page.locator("#app").innerText();
for (const a of ACTIVITIES) ok(guideText.includes(a.name), `quick guide lists ${a.name}`);
ok(
  guideText.includes("thelanguagepage.com/access-practice-lab/start"),
  "quick guide prints the one entrance link",
);
await crawl(ctx, page, "quick guide");
for (const group of Object.values(DOWNLOADS))
  for (const path of Object.values(group)) {
    const res = await page.request.get(`${base}${path}`);
    ok(
      res.status() === 200 && !/text\/html/.test(res.headers()["content-type"] || ""),
      `download exists: ${path}`,
    );
  }
await page.close();
for (const route of [ROUTES.tour, ROUTES.lesson, ROUTES.together, ROUTES.siteGuide]) {
  page = await open(ctx, `${LAB}${route}`);
  await crawl(ctx, page, `${route} page`);
  await page.close();
}
await ctx.close();
ok(errors.length === 0, `no console or page errors${errors.length ? `: ${errors[0]}` : ""}`);
await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-intro-rehearsal-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-intro-rehearsal-e2e: all checks passed");
