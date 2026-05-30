// ── PDF generation for notes packets ─────────────────────────────────────────
// Renders each lesson's notes.html to a print-ready, branded PDF using a
// headless Chrome/Chromium binary (no extra npm dependency required).
//
// Usage:
//   node scripts/generate-pdf.mjs            # all lessons
//   node scripts/generate-pdf.mjs 1-1 5-1    # specific lessons
//
// Output: lessons/<id>/downloads/<id>-notes.pdf
//
// If no Chrome/Chromium binary can be found, the script logs a clear message
// and exits 0 (so the build is never blocked); the HTML/DOCX downloads still
// work and the PDF link will resolve once a binary is available.

import {
  readdirSync,
  existsSync,
  mkdirSync,
  rmSync,
  readFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

function findChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    fromEnv,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  // Look inside the Playwright cache (chromium-*/chrome-*).
  const pwCache = join(
    process.env.HOME || "",
    "Library/Caches/ms-playwright",
  );
  if (existsSync(pwCache)) {
    for (const d of readdirSync(pwCache)) {
      const mac = join(
        pwCache,
        d,
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
      );
      if (existsSync(mac)) return mac;
      const lin = join(pwCache, d, "chrome-linux/chrome");
      if (existsSync(lin)) return lin;
    }
  }
  return null;
}

function lessonIds(filter) {
  const all = readdirSync(lessonsDir)
    .filter((d) => LESSON_DIR_RE.test(d))
    .filter((d) => existsSync(join(lessonsDir, d, "notes.html")));
  if (filter && filter.length) return all.filter((id) => filter.includes(id));
  return all;
}

function fileSize(p) {
  try {
    return existsSync(p) ? readFileSync(p).length : 0;
  } catch {
    return 0;
  }
}

// Render one PDF by spawning headless Chrome detached, then polling for a
// non-empty, stable output file. Once the PDF is on disk we kill the whole
// process group — Chrome does not always self-exit when another instance is
// running, so we never rely on it terminating on its own.
async function renderPdf(chrome, htmlPath, outPath) {
  const profile = join(
    tmpdir(),
    `neft-pdf-${process.pid}-${Math.random().toString(36).slice(2)}`,
  );
  try {
    rmSync(outPath, { force: true });
  } catch {}

  const child = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-networking",
      "--run-all-compositor-stages-before-draw",
      "--virtual-time-budget=6000",
      "--no-pdf-header-footer",
      `--user-data-dir=${profile}`,
      `--print-to-pdf=${outPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: "ignore", detached: true },
  );

  const killTree = () => {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      try {
        child.kill("SIGKILL");
      } catch {}
    }
  };

  // Poll up to ~20s for a stable, non-empty PDF.
  const deadline = Date.now() + 20000;
  let lastSize = -1;
  while (Date.now() < deadline) {
    await sleep(400);
    const size = fileSize(outPath);
    if (size > 0 && size === lastSize) break; // file written and stable
    lastSize = size;
    if (child.exitCode != null || child.signalCode != null) {
      // Chrome exited on its own; give the FS a moment then stop.
      await sleep(200);
      break;
    }
  }

  killTree();
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
  return fileSize(outPath) > 0;
}

async function main() {
  const filter = process.argv.slice(2);
  const chrome = findChrome();
  const ids = lessonIds(filter);

  if (!chrome) {
    console.warn(
      "generate-pdf: no Chrome/Chromium binary found. Set CHROME_PATH to enable PDF export. Skipping (HTML + DOCX downloads still available).",
    );
    return;
  }

  let ok = 0;
  for (const id of ids) {
    const htmlPath = join(lessonsDir, id, "notes.html");
    const outDir = join(lessonsDir, id, "downloads");
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, `${id}-notes.pdf`);
    try {
      const wrote = await renderPdf(chrome, htmlPath, outPath);
      if (wrote) ok++;
      else console.warn(`generate-pdf: no output for ${id}`);
    } catch (e) {
      console.warn(`generate-pdf: failed for ${id}: ${e.message}`);
    }
  }
  console.log(`Generated ${ok}/${ids.length} notes PDFs using ${chrome}`);
}

main();
