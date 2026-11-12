#!/usr/bin/env node
/**
 * Rehearsal of the two ways the introduction is used, driven in a real browser (automation, not user testing):
 *  A. For every grade choice, a teacher walks the 20-minute exploration's five timed phases, opens that grade's
 *     activity for each of the four domains, and every link on the exploration, Activity Guide, Quick Guide and
 *     Featured Lesson pages is followed.
 *  B. A first-time teacher, alone and with no saved state, goes from the home page to a relevant activity, using only the
 *     starting page and the guide, and the clicks and time to the first activity are counted (the brief asks for one minute).
 * Every link on every introduction page must land on a real lab view (an unknown path would silently show the home), and
 * every download must answer with its own file type.   node tools/access-intro-rehearsal-e2e.mjs
 */
import { DOWNLOADS, ROUTES } from "../access-practice-lab/src/intro/data.js";
import {
  EXPLORE_STEPS,
  exploreActivities,
} from "../access-practice-lab/src/intro/explore-bands.js";
import { PICK_IDS, printFiles } from "../access-practice-lab/src/intro/quick-guide-files.js";
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
            ? ["room", "activity"].includes(view)
            : view !== "home");
    if (!routeOk) bad.push(`${href} -> ${view}`);
  }
  ok(
    bad.length === 0,
    `${label}: ${n} internal links land on real pages${bad.length ? `; broken: ${bad.join(", ")}` : ""}`,
  );
}

// ── A. Every grade choice: the 20-minute exploration, then every link on the four reference pages ───────────
// (The presenter view was taken down on 2026-11-11; the exploration and the printed guides carry the introduction.)
let ctx = await newContext();
let page;
// REHEARSAL_PART=B skips part A (the long per-grade crawl) when only the first-time path is being checked.
for (const pick of process.env.REHEARSAL_PART === "B" ? [] : PICK_IDS) {
  page = await open(ctx, `${LAB}/start/explore?stop=1&grades=${pick}`);
  for (let i = 0; i < EXPLORE_STEPS.length; i++) {
    await page.goto(`${base}${LAB}/start/explore?stop=${i + 1}&focus=speaking&grades=${pick}`);
    await settled(page);
    const eyebrow = await page.locator(".ts-progress-text").innerText();
    ok(
      eyebrow.includes(`Minutes ${EXPLORE_STEPS[i].range}`) &&
        (await page.locator(".in-panel h2").first().innerText()) === EXPLORE_STEPS[i].name,
      `${pick}: exploration phase ${i + 1} (${EXPLORE_STEPS[i].name}) renders its task`,
    );
  }
  for (const a of exploreActivities(pick)) {
    await page.goto(`${base}${LAB}/start/explore?stop=2&focus=${a.domain.id}&grades=${pick}`);
    await settled(page);
    const link = await page.locator(".in-act a.btn-primary").getAttribute("href");
    const dest = await landing(ctx, link.replace(LAB, ""));
    ok(
      dest.view !== "home" && !dest.failed,
      `${pick} ${a.domain.id}: exploration opens ${link.replace(LAB, "").split("&intro")[0]} -> ${dest.view}`,
    );
  }
  await crawl(ctx, page, `${pick} exploration page`);
  await page.close();
  for (const route of [ROUTES.activities, ROUTES.guide, ROUTES.lesson]) {
    page = await open(ctx, `${LAB}${route}?grades=${pick}`);
    await crawl(ctx, page, `${pick} ${route}`);
    await page.close();
  }
}
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
await page.waitForSelector(".gt-part-goal");
await page.locator(".gt-goal.is-recommended").click();
clicks++;
await page.waitForSelector("iframe.gc-frame");
const frameSrc = await page.locator("iframe.gc-frame").getAttribute("src");
const secs = (Date.now() - t0) / 1000;
ok(
  /\/(Listening|Reading)\//.test(frameSrc || "") && clicks <= 2,
  `home to a real activity, running in the tour, in ${clicks} clicks (${secs.toFixed(1)}s of automation)`,
);
await page.close();
// guide and start page, alone
page = await open(ctx, `${LAB}/start`);
await crawl(ctx, page, "start page");
await page.getByRole("link", { name: /Open the Quick Guide/ }).click();
await page.waitForSelector("#app h1");
ok(pathOf(page).startsWith("/start/guide"), "the Quick Guide opens from the start page");
const guideText = await page.locator("#app").innerText();
const shownPick = await page
  .locator('[data-tb-pick][aria-pressed="true"]')
  .getAttribute("data-tb-pick");
for (const a of exploreActivities(shownPick))
  ok(guideText.includes(a.name), `quick guide (${shownPick}) lists ${a.name}`);
ok(
  guideText.includes("thelanguagepage.com/access-practice-lab/start"),
  "quick guide prints the one entrance link",
);
await crawl(ctx, page, "quick guide");
const allFiles = [
  ...Object.values(DOWNLOADS),
  ...PICK_IDS.flatMap((p) => Object.values(printFiles(p))),
];
for (const group of new Set(allFiles))
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
