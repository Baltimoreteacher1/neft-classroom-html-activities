#!/usr/bin/env node
/**
 * Visual QA matrix for the ACCESS Practice Lab: opens representative screens at desktop, Chromebook,
 * tablet and phone widths, saves full-page screenshots, and reports horizontal overflow, console
 * errors and failed requests per screen.
 *
 *   node tools/access-visual-qa.mjs --out <dir> [--base local|live|<url>] [--only <substring>] [--widths 1440,390]
 *
 * "local" serves the working tree (the same static mapping the e2e tools use). Exit code 1 when any
 * screen overflows horizontally or logs a page error, so it can gate a release.
 */
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : dflt;
};
const OUT = opt("out", "");
if (!OUT) {
  console.error(
    "usage: access-visual-qa.mjs --out <dir> [--base local|live|url] [--only s] [--widths a,b]",
  );
  process.exit(2);
}
const ONLY = opt("only", "");
const BASE_ARG = opt("base", "local");
const WIDTHS = opt("widths", "1440,1024,768,390,320").split(",").map(Number);
// --y/--h crop the full-page capture to a band, so a long page can be read at true scale.
const CROP_Y = Number(opt("y", 0));
const CROP_H = Number(opt("h", 0));
const HEIGHTS = { 1440: 900, 1280: 800, 1024: 768, 768: 1024, 390: 844, 320: 640 };

export const SCREENS = [
  ["home", "/access-practice-lab/"],
  ["home-35", "/access-practice-lab/?grades=3-5"],
  ["room-listening", "/access-practice-lab/Listening/A?grades=6-8"],
  ["room-reading", "/access-practice-lab/Reading/A?grades=6-8"],
  ["room-speaking", "/access-practice-lab/Speaking/A?grades=6-8"],
  ["room-writing", "/access-practice-lab/Writing/A?grades=6-8"],
  ["room-35-listening", "/access-practice-lab/Listening/A?grades=3-5"],
  ["act-mc-listening", "/access-practice-lab/Listening/A/classroom-directions?grades=6-8"],
  ["act-mc-reading", "/access-practice-lab/Reading/A/read-main-idea?grades=6-8"],
  ["act-hot-reading", "/access-practice-lab/Reading/A/v3-r-a-1?grades=6-8"],
  ["act-cloze-reading", "/access-practice-lab/Reading/A/v3-r-a-2?grades=6-8"],
  ["act-order-reading", "/access-practice-lab/Reading/A/rv5-school-garden-2?grades=6-8"],
  ["act-multi-reading", "/access-practice-lab/Reading/A/rv5-multiselect-true-details?grades=6-8"],
  ["act-sort-reading", "/access-practice-lab/Reading/A/read-sequence-order?grades=6-8"],
  ["act-constructed-speaking", "/access-practice-lab/Speaking/A/v3-s-a-1?grades=6-8"],
  [
    "act-constructed-writing",
    "/access-practice-lab/Writing/A/write-describe-one-sentence?grades=6-8",
  ],
  ["act-sort-writing", "/access-practice-lab/Writing/A/wv5-a-sort-paragraph-parts?grades=6-8"],
  ["act-worksheet", "/access-practice-lab/Writing/A/ws-writing-classes?grades=6-8"],
  ["act-35-order", "/access-practice-lab/Listening/A/g35-l-a-morning-order?grades=3-5"],
  ["act-35-sort", "/access-practice-lab/Listening/A/g35-l-a-water-land-sort?grades=3-5"],
  ["tests", "/access-practice-lab/tests"],
  ["test-intro", "/access-practice-lab/test/g35-reading-mini"],
  ["test-model", "/access-practice-lab/test/model-form-a"],
  ["passport", "/access-practice-lab/passport"],
  ["passport-portfolio", "/access-practice-lab/passport?portfolio=1"],
  ["road", "/access-practice-lab/road"],
  ["road-week", "/access-practice-lab/road/3"],
  ["family", "/access-practice-lab/family"],
  ["tools", "/access-practice-lab/tools"],
  ["library", "/access-practice-lab/library"],
  [
    "library-picked",
    "/access-practice-lab/library?pick=speak-ask-for-help,v10-l-a-water-cycle&grades=6-8",
  ],
  ["speak", "/access-practice-lab/speak"],
  ["speak-task", "/access-practice-lab/speak/spk-seedlings-retell"],
  ["speak-task-chart", "/access-practice-lab/speak/spk-rainfall-describe"],
  ["speak-task-discuss", "/access-practice-lab/speak/spk-icemelt-discuss"],
  ["write", "/access-practice-lab/write"],
  ["write-task", "/access-practice-lab/write/wrt-mulch-cer"],
  ["write-portfolio", "/access-practice-lab/write?tab=portfolio"],
  ["missions", "/access-practice-lab/missions"],
  ["mission-page", "/access-practice-lab/missions/watershed-mystery"],
  ["mission-decision", "/access-practice-lab/missions/watershed-mystery?phase=p3"],
  ["mission-debrief", "/access-practice-lab/missions/watershed-mystery?phase=zz"],
  ["detective", "/access-practice-lab/detective"],
  ["detective-case", "/access-practice-lab/detective/sv-agree-3sg"],
  ["growth", "/access-practice-lab/growth"],
  ["worlds", "/access-practice-lab/worlds"],
  ["world-signal", "/access-practice-lab/worlds/signal-station"],
  ["world-evidence", "/access-practice-lab/worlds/evidence-city?grades=3-5"],
  ["world-conversation", "/access-practice-lab/worlds/conversation-quest"],
  ["world-storyworks", "/access-practice-lab/worlds/storyworks"],
  ["mission-signal", "/access-practice-lab/worlds/signal-station/schedule-shift"],
  ["mission-evidence", "/access-practice-lab/worlds/evidence-city/shade-survey?grades=3-5"],
  ["mission-storyworks", "/access-practice-lab/worlds/storyworks/garden-recommendation"],
  ["evidence", "/access-practice-lab/evidence"],
  ["conversation", "/access-practice-lab/conversation"],
  ["construction", "/access-practice-lab/construction"],
  ["construction-register", "/access-practice-lab/construction?tab=register"],
  ["classroom", "/access-practice-lab/classroom"],
  ["vocabulary", "/access-practice-lab/vocabulary"],
  ["reading-room", "/access-practice-lab/reading-room"],
  ["reading-lesson", "/access-practice-lab/reading-room/rr1-night-library"],
  ["reading-lesson-table", "/access-practice-lab/reading-room/rr45-park-cools-block"],
  ["reading-words", "/access-practice-lab/reading-room/words"],
  ["reading-pathways", "/access-practice-lab/reading-room/pathways"],
  ["reading-teacher", "/access-practice-lab/reading-room/teacher"],
  ["diagnostic", "/access-practice-lab/diagnostic"],
  ["diagnostic-listening", "/access-practice-lab/diagnostic/Listening"],
  ["diagnostic-writing", "/access-practice-lab/diagnostic/Writing"],
  ["launch", "/access-practice-lab/launch-studio"],
  ["teacher-hub", "/access-teacher/"],
  ["not-found", "/access-practice-lab/NoSuchRoom"],
];

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    // Vite copies public/ to the site root; mirror that for fonts and shared assets.
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
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
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const { chromium } = await import("playwright");
let server;
let base = BASE_ARG;
if (BASE_ARG === "local") {
  server = await serve();
  base = `http://localhost:${server.address().port}`;
} else if (BASE_ARG === "live") base = "https://eduwonderlab.com";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const report = [];
for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: HEIGHTS[width] || 800 },
    reducedMotion: "reduce",
  });
  for (const [name, path] of SCREENS) {
    if (ONLY && !name.includes(ONLY)) continue;
    const page = await ctx.newPage();
    const problems = [];
    // web-vitals is a Vite build-time import in the shared head injector; the source server cannot resolve it.
    page.on(
      "pageerror",
      (e) => !/web-vitals/.test(e.message) && problems.push(`pageerror: ${e.message}`),
    );
    page.on("console", (m) => {
      if (m.type() === "error") problems.push(`console: ${m.text().slice(0, 140)}`);
    });
    try {
      await page.goto(base + path, { waitUntil: "load", timeout: 30000 });
      await page.waitForSelector("#app > :not(.boot)", { timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(500);
      const over = await page.evaluate(() => {
        const de = document.documentElement;
        return de.scrollWidth - de.clientWidth;
      });
      if (over > 1) problems.push(`horizontal overflow ${over}px`);
      const shot = { path: join(OUT, `${name}@${width}.png`), fullPage: true };
      if (CROP_H) {
        const full = await page.evaluate(() => document.documentElement.scrollHeight);
        shot.clip = {
          x: 0,
          y: Math.min(CROP_Y, full - 1),
          width,
          height: Math.min(CROP_H, full - CROP_Y),
        };
      }
      await page.screenshot(shot);
    } catch (e) {
      problems.push(`navigation: ${e.message.slice(0, 120)}`);
    }
    report.push({ name, width, problems });
    if (problems.length) console.log(`${name}@${width}: ${problems.join(" | ")}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
server?.close();
writeFileSync(join(OUT, "report.json"), JSON.stringify(report, null, 1));
const bad = report.filter((r) => r.problems.some((p) => /overflow|pageerror|navigation/.test(p)));
console.log(`${report.length} captures, ${bad.length} with overflow/page errors → ${OUT}`);
process.exit(bad.length ? 1 : 0);
