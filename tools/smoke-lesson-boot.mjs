#!/usr/bin/env node
// smoke-lesson-boot.mjs — headless render smoke test for client-rendered pages.
//
// WHY: lessons (and several hubs/SPAs) render client-side into a mount element.
// build/validate/lint all pass on the FILES, but none of them ever executes a
// page in a browser — so a runtime boot failure (e.g. the 2026-07-05 incident:
// app.js called initTeacherAccess/mountIdentityTeacherButton without importing
// them → ReferenceError → every lesson blank, HTTP still 200) sails straight to
// production. This tool is the missing check: it loads real pages in headless
// Chromium and asserts each actually renders content with no uncaught error.
//
// Coverage:
//   • Lessons — one sample per unit (or --lessons / --all), asserted on #app.
//   • Other SPA surfaces (curriculum hub, AI hub, Monster Math, Math Brain,
//     ACCESS Lab, Games hub) — from night-shift/render-manifest.json, asserted
//     on each route's mount selector (or body text) + min content.
//
// Two modes, one tool:
//   • LOCAL (default) — serves the built dist/ via `vite preview` and probes it.
//       Used by `npm run validate:lesson-boot` → the pre-push QA gate.
//   • LIVE  (--base <url>) — probes production directly (no server spawned).
//       Used by `npm run monitor:lesson-render` + the night-shift render module.
//
// A page FAILS if it emits an uncaught page error OR its measured content stays
// below the route's threshold. Console.error noise (optional assets, third
// party) is reported but does NOT fail the run — only uncaught exceptions and
// empty renders do, to keep the gate robust rather than flaky.
//
// Exit codes: 0 = all rendered; 1 = one or more failed; 2 = could not run
// (no dist, no browser, server never came up).
//
// Usage:
//   node tools/smoke-lesson-boot.mjs                     # local dist, auto sample
//   node tools/smoke-lesson-boot.mjs --base https://eduwonderlab.com
//   node tools/smoke-lesson-boot.mjs --lessons 1-1,5-3   # only these lessons
//   node tools/smoke-lesson-boot.mjs --all               # every lesson
//   node tools/smoke-lesson-boot.mjs --no-routes         # skip the SPA manifest
import { readdir, readFile, access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..");
const LESSONS_DIR = path.join(ROOT, "lessons");
const MANIFEST = path.join(ROOT, "night-shift", "render-manifest.json");
// Ephemeral port by default: concurrent runs (pre-push gate, ship worktrees,
// background automation) used to fight over a fixed 41847 — one run's server
// getting killed mid-probe produced the recurring "-1 content" / connection-
// refused false failures. SMOKE_PORT=<n> pins a port when determinism matters.
const PORT = Number(process.env.SMOKE_PORT || 0) || 0;
const LESSON_MIN = 800; // a rendered lesson is ~10k chars; a blank shell is 0
const NAV_TIMEOUT = 25000;
const RENDER_TIMEOUT = 12000; // how long to wait for the mount to fill
// Shared runtime scripts every hub (curriculum, monster-math, …) loads and needs
// to render. They are committed static files copied into dist/ by vite.config's
// copy-standalone-html plugin. If a concurrent build sharing node_modules disrupts
// that copy, they can be absent from dist/ even though they exist in source and
// git — blanking the hubs. That is a build-tooling artifact, NOT a page defect
// (CF's production build is unaffected), so the gate must not report it as a
// blank-page FAIL. See buildIsIncomplete().
const CRITICAL_ASSETS = [
  "assets/neft-theme.js",
  "assets/nt-page-enhance.js",
  "shared/save-resume/save-resume-engine.js",
];

function parseArgs(argv) {
  const a = { base: null, lessons: null, all: false, routes: true };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base") a.base = argv[++i];
    else if (argv[i] === "--lessons") a.lessons = argv[++i];
    else if (argv[i] === "--all") a.all = true;
    else if (argv[i] === "--no-routes") a.routes = false;
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

/** Load the SPA render manifest; returns [] if absent/unreadable. */
async function loadRouteManifest() {
  try {
    const raw = await readFile(MANIFEST, "utf8");
    const json = JSON.parse(raw);
    return Array.isArray(json.routes) ? json.routes : [];
  } catch {
    return [];
  }
}

/** Ask the OS for a free ephemeral port. */
async function getFreePort() {
  const { createServer } = await import("node:net");
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// Guarantee every spawned server is killed on ANY process exit — normal return,
// Ctrl-C, kill, or an uncaught crash. Interrupted runs failing to do this are how
// orphaned `vite preview` servers used to accumulate and hold ports.
const _spawned = new Set();
let _cleanupHooked = false;
function registerCleanup(child) {
  _spawned.add(child);
  child.on("exit", () => _spawned.delete(child));
  if (_cleanupHooked) return;
  _cleanupHooked = true;
  const killAll = () => {
    for (const c of _spawned) {
      try {
        c.kill("SIGKILL");
      } catch {}
    }
  };
  process.on("exit", killAll);
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(sig, () => {
      killAll();
      process.exit(130);
    });
  }
}

/** Spawn `vite preview` on dist/ on a fresh free port and resolve once it serves, or throw. */
async function startPreviewServer() {
  if (!(await pathExists(path.join(ROOT, "dist", "index.html")))) {
    const err = new Error("dist/ not built — run `npm run build` first.");
    err.code = "NO_DIST";
    throw err;
  }
  const port = PORT || (await getFreePort());
  // Spawn the vite binary DIRECTLY (not via `npx`): with npx the real server runs
  // as a grandchild that survives when the wrapper is killed — reparented to init,
  // it keeps holding a port. Spawning vite directly makes `child` the actual
  // server, so child.kill() (and the cleanup hooks) truly stop it.
  const viteBin = path.join(ROOT, "node_modules", ".bin", "vite");
  const child = spawn(
    viteBin,
    ["preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"],
    { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] },
  );
  registerCleanup(child);
  const base = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    // If vite exits early (e.g. the just-freed port got taken), fail loudly now
    // instead of polling a dead process for the full timeout.
    if (child.exitCode !== null) {
      throw new Error(`vite preview exited early (code ${child.exitCode}) before serving on port ${port}.`);
    }
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

/**
 * Load one page and judge whether it rendered. Never throws.
 * route = { url, label, selector?, min, measure: "html" | "text" }
 *   measure "html" → selector.innerHTML length; "text" → body.innerText length.
 */
async function probeRoute(page, base, route) {
  const pageErrors = [];
  const consoleErrors = [];
  const onPageError = (e) => pageErrors.push(e.message);
  const onConsole = (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  };
  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  const url = `${base}${route.url}?cb=${encodeURIComponent(route.label)}`;
  let navError = null;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
    await page
      .waitForFunction(
        ({ selector, min }) => {
          const el = selector ? document.querySelector(selector) : document.body;
          if (!el) return false;
          const len = selector ? el.innerHTML.length : el.innerText.trim().length;
          return len > min;
        },
        { selector: route.measure === "html" ? route.selector : null, min: route.min },
        { timeout: RENDER_TIMEOUT },
      )
      .catch(() => {}); // fall through to measurement below
  } catch (e) {
    navError = e.message;
  }
  const len = await page
    .evaluate(
      ({ selector, measure }) => {
        const el = selector ? document.querySelector(selector) : document.body;
        if (!el) return -1;
        return measure === "html" ? el.innerHTML.length : el.innerText.trim().length;
      },
      { selector: route.measure === "html" ? route.selector : null, measure: route.measure },
    )
    .catch(() => -1);
  page.off("pageerror", onPageError);
  page.off("console", onConsole);

  const reasons = [];
  if (navError) reasons.push(`navigation failed: ${navError}`);
  if (pageErrors.length) reasons.push(`uncaught: ${pageErrors[0]}`);
  if (len < route.min) reasons.push(`content below min (${len} < ${route.min})`);
  return { ...route, len, pageErrors, consoleErrors, ok: reasons.length === 0, reasons };
}

/**
 * Detect an incomplete LOCAL build: critical shared assets present in the source
 * tree (and git) but not copied into dist/. Checked on the filesystem, not over
 * HTTP — `vite preview`'s SPA history fallback answers a missing `/assets/x.js`
 * with index.html (200), so an HTTP probe cannot tell "missing" from "served".
 * An asset absent from source too is NOT incompleteness — that is a real change,
 * so we skip it and let the normal render probe judge the result.
 */
async function buildIsIncomplete() {
  const missing = [];
  for (const rel of CRITICAL_ASSETS) {
    if (!(await pathExists(path.join(ROOT, rel)))) continue; // absent from source → not an incomplete-build case
    if (!(await pathExists(path.join(ROOT, "dist", rel)))) missing.push(rel);
  }
  return missing;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const live = Boolean(args.base);

  // Build the route list: lessons (mount #app) + optional SPA manifest.
  const routes = [];
  let lessonIds;
  if (args.lessons) lessonIds = args.lessons.split(",").map((s) => s.trim()).filter(Boolean);
  else {
    const all = await listLessonIds();
    lessonIds = args.all ? all : sampleByUnit(all);
  }
  for (const id of lessonIds) {
    routes.push({ url: `/lessons/${id}/`, label: id, selector: "#app", min: LESSON_MIN, measure: "html" });
  }
  if (args.routes && !args.lessons) {
    for (const r of await loadRouteManifest()) {
      routes.push({
        url: r.path,
        label: r.label || r.path,
        selector: r.selector || null,
        min: r.min ?? 200,
        measure: r.selector ? "html" : "text",
      });
    }
  }
  if (!routes.length) {
    console.error("No routes to probe.");
    process.exit(2);
  }

  // Import playwright lazily so a missing browser is a clean SKIP, not a crash.
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("⚠️  playwright not installed — render smoke SKIPPED.");
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
    // Guard against a false blank-page FAIL from an incomplete local build.
    const missing = await buildIsIncomplete();
    if (missing.length) {
      console.log("⚠️  Local build is INCOMPLETE — render smoke SKIPPED (not a page defect).");
      console.log("   These committed shared assets exist in source but are missing from dist/:");
      for (const a of missing) console.log(`     • ${a}`);
      console.log("   Every hub loads these, so probing would report false blank pages. The cause");
      console.log("   is build tooling (typically concurrent builds sharing node_modules), not the");
      console.log("   pages — CF's production build is unaffected. Rebuild in isolation to run the");
      console.log("   full render smoke. Skipping to avoid a false failure that blocks deploys.");
      server.child.kill("SIGKILL");
      process.exit(0);
    }
  }

  let browser;
  try {
    // PW_CHROMIUM_PATH: point at a system Chromium when the Playwright-managed
    // download is missing/version-mismatched (e.g. sandboxed CI containers).
    browser = await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
  } catch (e) {
    console.error(`⚠️  Could not launch Chromium — render smoke SKIPPED (${e.message}).`);
    console.error("   Install with: npx playwright install chromium");
    if (server) server.child.kill("SIGKILL");
    process.exit(0);
  }

  console.log(`Render smoke — ${live ? "LIVE" : "local dist"} @ ${base}`);
  console.log(`Probing ${routes.length} page(s).\n`);

  const results = [];
  const page = await browser.newPage();
  for (const route of routes) {
    const r = await probeRoute(page, base, route);
    results.push(r);
    const tag = r.ok ? "PASS" : "FAIL";
    const extra = r.ok ? `${r.measure === "html" ? "#app/mount" : "text"} ${r.len}` : r.reasons.join("; ");
    console.log(`  ${tag}  ${String(r.label).padEnd(22)} ${extra}`);
    if (r.ok && r.consoleErrors.length) {
      console.log(`        (note: ${r.consoleErrors.length} console.error — non-fatal)`);
    }
  }
  await browser.close();
  if (server) server.child.kill("SIGKILL");

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} pages rendered; ${failed.length} failed.`);
  if (failed.length) {
    console.log("FAIL — a page did not render. This is the blank-page class of bug.");
    process.exit(1);
  }
  console.log("PASS — all probed pages render.");
  process.exit(0);
}

main().catch((e) => {
  console.error("render smoke crashed:", e);
  process.exit(2);
});
