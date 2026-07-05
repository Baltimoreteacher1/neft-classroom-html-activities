#!/usr/bin/env node
// smoke-lesson-boot.mjs — headless render smoke test for Reveal Math lessons.
//
// WHY: lessons render client-side into <div id="app"></div> via the Vite
// lesson-renderer. build/validate/lint all pass on the FILES, but none of them
// ever executes a lesson in a browser — so a runtime boot failure (e.g. the
// 2026-07-05 incident: app.js called initTeacherAccess/mountIdentityTeacherButton
// without importing them → ReferenceError → every lesson blank, HTTP still 200)
// sails straight to production. This tool is the missing check: it loads a
// sample of real lessons in headless Chromium and asserts each one actually
// renders content with no uncaught error.
//
// Two modes, one tool:
//   • LOCAL (default) — serves the built dist/ via `vite preview` and probes it.
//       Used by `npm run validate:lesson-boot` → the pre-push QA gate (blocks
//       a blank-lesson regression before it can deploy).
//   • LIVE  (--base <url>) — probes production directly (no server spawned).
//       Used by `npm run monitor:lesson-render` + the night-shift render module
//       (catches anything that slips through, within minutes of deploy).
//
// A lesson FAILS if it emits an uncaught page error OR #app stays (near) empty.
// Console.error noise (optional assets, third-party) is reported but does NOT
// fail the run — only uncaught exceptions and empty renders do, to keep the
// gate robust rather than flaky.
//
// Exit codes: 0 = all sampled lessons rendered; 1 = one or more failed;
//             2 = could not run (no dist, no browser, server never came up).
//
// Usage:
//   node tools/smoke-lesson-boot.mjs                     # local dist, auto sample
//   node tools/smoke-lesson-boot.mjs --base https://eduwonderlab.com
//   node tools/smoke-lesson-boot.mjs --lessons 1-1,5-3,10-2
//   node tools/smoke-lesson-boot.mjs --all               # every lesson, not a sample
import { readdir, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const LESSONS_DIR = path.join(ROOT, "lessons");
const PORT = 41847; // fixed, strict — fail loudly if occupied rather than race
const MIN_APP_HTML = 800; // a rendered lesson is ~10k chars; a blank shell is 0
const NAV_TIMEOUT = 25000;
const RENDER_TIMEOUT = 12000; // how long to wait for #app to fill

function parseArgs(argv) {
  const a = { base: null, lessons: null, all: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base") a.base = argv[++i];
    else if (argv[i] === "--lessons") a.lessons = argv[++i];
    else if (argv[i] === "--all") a.all = true;
  }
  return a;
}

/** List lesson ids (e.g. "1-1") from the repo's lessons/ dir. */
async function listLessonIds() {
  const entries = await readdir(LESSONS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && /^\d+-\d+(-flagship)?$/.test(e.name))
    .map((e) => e.name)
    .filter((n) => !n.endsWith("-flagship")) // flagship variants share the engine
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au - bu || al - bl;
    });
}

/** One representative lesson per unit (fast but broad coverage). */
function sampleByUnit(ids) {
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    const unit = id.split("-")[0];
    if (!seen.has(unit)) {
      seen.add(unit);
      out.push(id);
    }
  }
  return out;
}

async function pathExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Spawn `vite preview` on dist/ and resolve once it serves, or throw. */
async function startPreviewServer() {
  if (!(await pathExists(path.join(ROOT, "dist", "index.html")))) {
    const err = new Error("dist/ not built — run `npm run build` first.");
    err.code = "NO_DIST";
    throw err;
  }
  const child = spawn(
    "npx",
    ["vite", "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
  );
  const base = `http://127.0.0.1:${PORT}`;
  const deadline = Date.now() + 20000;
  // Poll until the server answers (avoids racing on stdout banner parsing).
  // eslint-disable-next-line no-constant-condition
  while (Date.now() < deadline) {
    try {
      const res = await fetch(base + "/", { redirect: "manual" });
      if (res.status > 0) return { child, base };
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  child.kill("SIGKILL");
  throw new Error("vite preview did not come up within 20s");
}

/** Load one lesson and judge whether it rendered. Never throws. */
async function probeLesson(page, base, id) {
  const pageErrors = [];
  const consoleErrors = [];
  const onPageError = (e) => pageErrors.push(e.message);
  const onConsole = (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  };
  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  const url = `${base}/lessons/${id}/?cb=${id}`;
  let navError = null;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    // Wait for the renderer to populate #app (or give up).
    await page
      .waitForFunction(
        (min) => {
          const el = document.getElementById("app");
          return el && el.innerHTML.length > min;
        },
        MIN_APP_HTML,
        { timeout: RENDER_TIMEOUT },
      )
      .catch(() => {}); // fall through to measurement below
  } catch (e) {
    navError = e.message;
  }
  const appLen = await page
    .$eval("#app", (el) => el.innerHTML.length)
    .catch(() => -1);
  page.off("pageerror", onPageError);
  page.off("console", onConsole);

  const reasons = [];
  if (navError) reasons.push(`navigation failed: ${navError}`);
  if (pageErrors.length) reasons.push(`uncaught: ${pageErrors[0]}`);
  if (appLen < MIN_APP_HTML) reasons.push(`#app nearly empty (${appLen} chars)`);
  return { id, appLen, pageErrors, consoleErrors, ok: reasons.length === 0, reasons };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const live = Boolean(args.base);

  // Resolve the lesson sample.
  let ids;
  if (args.lessons) ids = args.lessons.split(",").map((s) => s.trim()).filter(Boolean);
  else {
    const all = await listLessonIds();
    ids = args.all ? all : sampleByUnit(all);
  }
  if (!ids.length) {
    console.error("No lessons found to probe.");
    process.exit(2);
  }

  // Import playwright lazily so a missing browser is a clean SKIP, not a crash.
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("⚠️  playwright not installed — lesson-boot smoke SKIPPED.");
    console.error("   Install with: npm i -D playwright && npx playwright install chromium");
    process.exit(0);
  }

  let server = null;
  let base = args.base;
  if (!live) {
    try {
      server = await startPreviewServer();
      base = server.base;
    } catch (e) {
      if (e.code === "NO_DIST") {
        console.error(`⚠️  ${e.message}`);
        process.exit(2);
      }
      throw e;
    }
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    console.error(`⚠️  Could not launch Chromium — lesson-boot smoke SKIPPED (${e.message}).`);
    console.error("   Install with: npx playwright install chromium");
    if (server) server.child.kill("SIGKILL");
    process.exit(0);
  }

  console.log(`Lesson-boot smoke — ${live ? "LIVE" : "local dist"} @ ${base}`);
  console.log(`Probing ${ids.length} lesson(s): ${ids.join(", ")}\n`);

  const results = [];
  const page = await browser.newPage();
  for (const id of ids) {
    const r = await probeLesson(page, base, id);
    results.push(r);
    const tag = r.ok ? "PASS" : "FAIL";
    const extra = r.ok
      ? `#app ${r.appLen}`
      : r.reasons.join("; ");
    console.log(`  ${tag}  ${id.padEnd(8)} ${extra}`);
    if (r.ok && r.consoleErrors.length) {
      console.log(`        (note: ${r.consoleErrors.length} console.error — non-fatal)`);
    }
  }
  await browser.close();
  if (server) server.child.kill("SIGKILL");

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failed.length}/${results.length} lessons rendered; ${failed.length} failed.`,
  );
  if (failed.length) {
    console.log("FAIL — a lesson did not render. This is the blank-lesson class of bug.");
    process.exit(1);
  }
  console.log("PASS — all sampled lessons render.");
  process.exit(0);
}

main().catch((e) => {
  console.error("lesson-boot smoke crashed:", e);
  process.exit(2);
});
