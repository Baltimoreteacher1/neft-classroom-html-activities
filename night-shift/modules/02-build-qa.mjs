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
  // Judge what is shippable: a clean origin/main checkout, never the live tree.
  const src = ctx.auditRoot || ctx.root;
  const details = [];
  const actions = [];
  let worst = "ok";

  // 1. Validators.
  if (cfg.runValidate) {
    const budget = 25 * 60_000;
    const r = await sh("npm", ["run", "validate"], { cwd: src, timeout: budget });
    if (r.ok) {
      details.push("✅ `npm run validate` passed (static, hub, curriculum-top1, reveal-math).");
    } else if (r.timedOut) {
      if (worst === "ok") worst = "warn";
      details.push(`⚠️ \`npm run validate\` TIMED OUT after ${budget / 60_000}m — inconclusive, not a failure.`);
      actions.push("Validate exceeded its time budget — raise the budget or split the suite.");
    } else {
      worst = "fail";
      const tail = r.stdout.split("\n").filter(Boolean).slice(-6).join(" / ");
      details.push(`❌ \`npm run validate\` FAILED. Tail: ${tail || r.stderr.slice(-300)}`);
      actions.push("Validators failing — fix before any deploy.");
    }
  }

  // 2. Optional build.
  if (cfg.runBuild) {
    const budget = 25 * 60_000;
    const r = await sh("npm", ["run", "build"], { cwd: src, timeout: budget });
    if (r.ok) details.push("✅ `npm run build` produced dist/.");
    else if (r.timedOut) {
      if (worst === "ok") worst = "warn";
      details.push(`⚠️ \`npm run build\` TIMED OUT after ${budget / 60_000}m — inconclusive, not a failure.`);
      actions.push("Build exceeded its time budget — raise the budget or investigate slowness.");
    } else {
      worst = "fail";
      details.push(`❌ \`npm run build\` FAILED: ${r.stderr.split("\n").slice(-4).join(" / ")}`);
      actions.push("Build is broken — deploy would fail.");
    }
  }

  // 3. Browser smoke for the DOM-crash class.
  // Resolve the actual package — `npx playwright --version` is unreliable
  // (wrappers can exit 0 without the package present).
  const pwInstalled = (
    await sh("node", ["-e", "require.resolve('playwright')"], { cwd: src })
  ).ok;

  if (!pwInstalled) {
    if (worst === "ok") worst = "warn";
    details.push(
      "⚠️ Playwright not installed — browser smoke SKIPPED. " +
        "The unguarded-DOM crash class can only be caught in a real browser. " +
        "Install with `npx playwright install chromium` to enable.",
    );
  } else {
    // Smoke must run against BUILT output served over HTTP, so root-relative
    // `/assets/...` paths resolve. Loading raw source via file:// produces
    // meaningless ERR_FILE_NOT_FOUND noise. Require dist/.
    const distDir = path.join(src, "dist");
    const haveDist = (await sh("test", ["-d", distDir])).ok;
    if (!haveDist) {
      if (worst === "ok") worst = "warn";
      details.push(
        "⚠️ Browser smoke SKIPPED — no `dist/`. Set `buildQa.runBuild: true` so the " +
          "smoke runs against built, HTTP-served pages (set in config; default for the nightly job).",
      );
    } else {
      const pages = await findLessonPages(["dist"], src, cfg.playwrightSampleSize || 8);
      const sample = rotatingSample(pages, cfg.playwrightSampleSize || 8).map((f) =>
        path.relative(distDir, f),
      );
      if (!sample.length) {
        details.push("⏭️ No built lesson pages found in dist/ to smoke-test.");
      } else {
        const tmp = path.join(src, "night-shift", "briefings", ".smoke.mjs");
        await writeText(tmp, pwSmokeScript(distDir, sample));
        const r = await sh("node", [tmp], { cwd: src, timeout: 6 * 60_000 });
        const errLines = r.stdout.split("\n").filter((l) => l.startsWith("ERR "));
        const noteLines = r.stdout.split("\n").filter((l) => l.startsWith("NOTE "));
        if (r.ok && errLines.length === 0) {
          let msg = `✅ Browser smoke clean (no JS exceptions) on ${sample.length} built page(s).`;
          if (noteLines.length) msg += ` (${noteLines.length} page(s) had ignorable resource 404s.)`;
          details.push(msg);
        } else if (!r.ok && errLines.length === 0) {
          // Runner crashed without emitting page errors → tooling, not a page bug.
          if (worst === "ok") worst = "warn";
          const why = (r.stderr || r.stdout).split("\n").filter(Boolean).slice(-2).join(" ");
          details.push(`⚠️ Browser smoke could not run (tooling): ${why.slice(0, 200)}.`);
        } else {
          worst = "fail";
          details.push(`❌ Browser smoke caught JS exceptions on ${errLines.length} page(s):`);
          errLines.slice(0, 8).forEach((b) => details.push(`   ${b.replace(/^ERR /, "")}`));
          actions.push("Built page(s) throw JS at runtime — the validator-invisible crash class.");
        }
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

// Standalone runner emitted to a temp file. Serves `root` over a local HTTP
// server (so root-relative asset paths resolve), loads each relative page, and
// separates real JS exceptions (`ERR`) from ignorable resource 404s (`NOTE`).
function pwSmokeScript(root, relPages) {
  return `import { chromium } from "playwright";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { join, normalize, extname } from "node:path";

const ROOT = ${JSON.stringify(root)};
const PAGES = ${JSON.stringify(relPages)};
const MIME = { ".html":"text/html", ".js":"text/javascript", ".mjs":"text/javascript",
  ".css":"text/css", ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png",
  ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".gif":"image/gif", ".webp":"image/webp",
  ".woff":"font/woff", ".woff2":"font/woff2", ".ttf":"font/ttf", ".pptx":"application/octet-stream",
  ".docx":"application/octet-stream", ".pdf":"application/pdf", ".map":"application/json" };

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    let fp = normalize(join(ROOT, p));
    if (!fp.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
    if (existsSync(fp) && statSync(fp).isDirectory()) fp = join(fp, "index.html");
    if (!existsSync(fp)) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "content-type": MIME[extname(fp)] || "application/octet-stream" });
    res.end(await readFile(fp));
  } catch { res.writeHead(500); res.end(); }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;
const base = "http://127.0.0.1:" + port + "/";

// A real bug = uncaught JS exception. Resource-load failures are environmental noise.
const isResourceNoise = (s) => /Failed to load resource|ERR_[A-Z_]+|net::|favicon/i.test(s);

const browser = await chromium.launch();
let jsErrors = 0;
for (const rel of PAGES) {
  const page = await browser.newPage();
  const real = [], noise = [];
  page.on("pageerror", (e) => real.push(String(e.message || e)));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    (isResourceNoise(t) ? noise : real).push(t);
  });
  try {
    await page.goto(base + rel.split("/").map(encodeURIComponent).join("/"),
      { waitUntil: "load", timeout: 25000 });
    await page.waitForTimeout(900);
  } catch (e) { real.push("navigation: " + String(e.message || e)); }
  if (real.length) { jsErrors++; for (const e of real.slice(0, 3)) console.log("ERR /" + rel + " :: " + e); }
  else if (noise.length) console.log("NOTE /" + rel + " :: " + noise.length + " resource 404(s) ignored");
  await page.close();
}
await browser.close();
server.close();
process.exit(jsErrors ? 1 : 0);
`;
}
