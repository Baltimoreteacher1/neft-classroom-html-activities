// Module 2 — Build + Visual QA.
// Runs the repo validators, optionally builds, then browser-smoke-tests a rotating
// sample of lesson pages for the unguarded-DOM crash class. Degrades gracefully.
import { readdir } from "node:fs/promises";
import path from "node:path";
import { sh, writeText } from "../lib/util.mjs";

export const name = "Build + Visual QA";

async function findLessonPages(roots, root, limit) {
  const found = [];
  async function walk(dir, depth) {
    if (found.length >= limit * 6 || depth > 6) return;
    let entries = [];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (/node_modules|\.git/.test(e.name)) continue;
        await walk(full, depth + 1);
      } else if (e.name === "index.html" && /math|lesson|unit/i.test(full)) {
        found.push(full);
      }
    }
  }
  for (const r of roots) await walk(path.join(root, r), 0);
  return found;
}

// Deterministic-but-rotating sample keyed on day-of-year so coverage cycles.
function rotatingSample(items, size) {
  if (items.length <= size) return items;
  const sorted = [...items].sort();
  const doy = Math.floor((Date.now() - Date.UTC(new Date().getUTCFullYear(), 0, 0)) / 86400000);
  const start = (doy * size) % sorted.length;
  const out = [];
  for (let i = 0; i < size; i++) out.push(sorted[(start + i) % sorted.length]);
  return out;
}

export async function run(ctx) {
  const cfg = ctx.config.buildQa || {};
  const details = [];
  const actions = [];
  let worst = "ok";

  // 1. Validators.
  if (cfg.runValidate) {
    const r = await sh("npm", ["run", "validate"], { cwd: ctx.root, timeout: 8 * 60_000 });
    if (r.ok) {
      details.push("✅ `npm run validate` passed (static, hub, curriculum-top1, reveal-math).");
    } else {
      worst = "fail";
      const tail = r.stdout.split("\n").filter(Boolean).slice(-6).join(" / ");
      details.push(`❌ \`npm run validate\` FAILED. Tail: ${tail || r.stderr.slice(-300)}`);
      actions.push("Validators failing — fix before any deploy.");
    }
  }

  // 2. Optional build.
  if (cfg.runBuild) {
    const r = await sh("npm", ["run", "build"], { cwd: ctx.root, timeout: 15 * 60_000 });
    if (r.ok) details.push("✅ `npm run build` produced dist/.");
    else {
      worst = "fail";
      details.push(`❌ \`npm run build\` FAILED: ${r.stderr.split("\n").slice(-4).join(" / ")}`);
      actions.push("Build is broken — deploy would fail.");
    }
  }

  // 3. Browser smoke for the DOM-crash class.
  // Resolve the actual package — `npx playwright --version` is unreliable
  // (wrappers can exit 0 without the package present).
  const pwInstalled = (
    await sh("node", ["-e", "require.resolve('playwright')"], { cwd: ctx.root })
  ).ok;

  if (!pwInstalled) {
    if (worst === "ok") worst = "warn";
    details.push(
      "⚠️ Playwright not installed — browser smoke SKIPPED. " +
        "The unguarded-DOM crash class can only be caught in a real browser. " +
        "Install with `npx playwright install chromium` to enable.",
    );
  } else {
    const roots = cfg.runBuild ? cfg.lessonGlobRoots : ["math", "lessons"];
    const pages = await findLessonPages(roots || ["dist"], ctx.root, cfg.playwrightSampleSize || 8);
    const sample = rotatingSample(pages, cfg.playwrightSampleSize || 8);
    if (!sample.length) {
      details.push("⏭️ No lesson pages found to smoke-test (build dist first?).");
    } else {
      const script = pwSmokeScript(sample);
      const tmp = path.join(ctx.root, "night-shift", "briefings", ".smoke.mjs");
      await writeText(tmp, script);
      const r = await sh("node", [tmp], { cwd: ctx.root, timeout: 5 * 60_000 });
      const errLines = r.stdout.split("\n").filter((l) => l.startsWith("ERR "));
      if (r.ok) {
        details.push(`✅ Browser smoke clean on ${sample.length} sampled lesson page(s).`);
      } else if (errLines.length === 0) {
        // Process failed but produced no page errors → the runner itself broke
        // (missing browser binary, launch failure). Tooling issue, not a page bug.
        if (worst === "ok") worst = "warn";
        const why = (r.stderr || r.stdout).split("\n").filter(Boolean).slice(-2).join(" ");
        details.push(
          `⚠️ Browser smoke could not run (tooling): ${why.slice(0, 200)}. ` +
            "Run `npx playwright install chromium`.",
        );
      } else {
        worst = "fail";
        details.push(`❌ Browser smoke found console errors on ${errLines.length} page(s):`);
        errLines.slice(0, 8).forEach((b) => details.push(`   ${b.replace(/^ERR /, "")}`));
        actions.push("Lesson page(s) throw JS at runtime — the validator-invisible crash class.");
      }
    }
  }

  const summary =
    worst === "fail"
      ? "QA found failures — see details."
      : worst === "warn"
        ? "QA passed with limitations (browser smoke unavailable)."
        : "Validators + browser smoke all green.";
  return { name, status: worst, summary, details, actions };
}

// Standalone Playwright runner emitted to a temp file; prints `ERR <url> :: <msg>` lines.
function pwSmokeScript(files) {
  return `import { chromium } from "playwright";
const files = ${JSON.stringify(files)};
const browser = await chromium.launch();
let bad = 0;
for (const f of files) {
  const page = await browser.newPage();
  const errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e.message || e)));
  try {
    await page.goto("file://" + f, { waitUntil: "load", timeout: 20000 });
    await page.waitForTimeout(800);
  } catch (e) { errs.push("navigation: " + String(e.message || e)); }
  if (errs.length) { bad++; for (const e of errs.slice(0, 3)) console.log("ERR " + f + " :: " + e); }
  await page.close();
}
await browser.close();
process.exit(bad ? 1 : 0);
`;
}
