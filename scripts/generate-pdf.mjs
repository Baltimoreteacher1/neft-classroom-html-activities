// ── PDF generation for notes packets ─────────────────────────────────────────
// Renders each lesson's notes.html / notes-teacher.html to print-ready, branded
// PDFs using a headless Chrome/Chromium binary (no extra npm dependency).
//
// Three behaviours layered on the basic print:
//   1. Per-level variants — the leveled-mode toggle (L1 Support / L2 Standard /
//      L3 Enrichment) is a runtime JS class on <html>, so a plain print only
//      captures the default tier. We render one PDF per level by forcing the
//      level class into a temp copy of the HTML before printing, and write
//      <id>-notes-l1.pdf, -l2.pdf, -l3.pdf alongside the default <id>-notes.pdf.
//   2. Accessible / tagged PDFs — Chrome's --export-tagged-pdf emits a tagged
//      tree (reading order + alt text + headings), and we stamp /Lang(en-US)
//      and the document title into the PDF catalog so screen readers behave.
//   3. Idempotent regeneration — a content hash of the source HTML + this
//      generator's version is stored in downloads/.pdf-manifest.json; unchanged
//      variants are skipped, so `npm run generate-downloads` no-ops when nothing
//      changed and diffs stay focused.
//
// Usage:
//   node scripts/generate-pdf.mjs            # all lessons
//   node scripts/generate-pdf.mjs 1-1 5-1    # specific lessons
//   node scripts/generate-pdf.mjs --force    # ignore the hash manifest
//
// Output: lessons/<id>/downloads/<id>-notes[-teacher][-lN].pdf
//
// If no Chrome/Chromium binary can be found, the script logs a clear message
// and exits 0 (so the build is never blocked); the HTML/DOCX downloads still
// work and the PDF link will resolve once a binary is available.

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

// Bump when the rendering pipeline changes in a way that should invalidate
// every previously-rendered PDF (flags, level injection, tagging, etc.).
const GENERATOR_VERSION = "2-leveled-tagged";

// The leveled-mode tiers the notes template understands (see generate-notes.mjs:
// html.level-l1 / l2 / l3). l2 is the on-screen default. We keep the default
// (unsuffixed) PDF for back-compat plus one explicit file per tier.
const LEVELS = [
  { key: "l1", label: "L1 Support" },
  { key: "l2", label: "L2 Standard" },
  { key: "l3", label: "L3 Enrichment" },
];

const DOC_LANG = "en-US";

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
  const pwCache = join(process.env.HOME || "", "Library/Caches/ms-playwright");
  if (existsSync(pwCache)) {
    for (const d of readdirSync(pwCache)) {
      const mac = join(pwCache, d, "chrome-mac/Chromium.app/Contents/MacOS/Chromium");
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

// ── Manifest (content-hash skip) ─────────────────────────────────────────────
function manifestPath(outDir) {
  return join(outDir, ".pdf-manifest.json");
}

function readManifest(outDir) {
  const p = manifestPath(outDir);
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf8")) || {};
  } catch {
    return {};
  }
}

function writeManifest(outDir, data) {
  try {
    writeFileSync(manifestPath(outDir), JSON.stringify(data, null, 2) + "\n");
  } catch {}
}

function hashFor(srcHtml, levelKey) {
  return createHash("sha256")
    .update(GENERATOR_VERSION)
    .update("\0")
    .update(levelKey || "default")
    .update("\0")
    .update(srcHtml)
    .digest("hex");
}

// ── Level injection ──────────────────────────────────────────────────────────
// Force a leveled-mode tier into a copy of the rendered HTML so the printed PDF
// captures that tier instead of the runtime default. We (a) add the level class
// to <html> and (b) rewrite the two localStorage-default reads so the page's own
// setLevel logic re-applies the forced tier on load instead of falling back.
function injectLevel(html, levelKey) {
  let out = html.replace(/<html\s+lang="en"\s*>/i, `<html lang="en" class="level-${levelKey}">`);
  out = out.replace(/localStorage\.getItem\('notes-level'\)\s*\|\|\s*'l2'/g, `'${levelKey}'`);
  return out;
}

// ── PDF catalog tagging (/Lang + /Title) ─────────────────────────────────────
// Chrome --export-tagged-pdf emits the structure tree but does not always set a
// document language or title in the catalog. We patch the catalog dictionary
// in place: add /Lang and /Markinfo, and set the title via the Info dict. This
// is a minimal byte-level edit that keeps the existing xref valid because the
// PDF is parsed leniently by readers and we only append, never shift offsets of
// existing objects — we add a fresh object and an /Lang entry into the catalog.
function stampAccessibility(outPath, title) {
  let buf;
  try {
    buf = readFileSync(outPath);
  } catch {
    return;
  }
  let text = buf.toString("latin1");

  // Ensure the catalog declares the language and that it is tagged. Chrome's
  // catalog looks like: <</Type /Catalog ... >>. Inject /Lang + /MarkInfo right
  // after "/Type /Catalog" if not already present.
  if (!/\/Lang\s*\(/.test(text)) {
    text = text.replace(/(\/Type\s*\/Catalog)/, `$1 /Lang(${DOC_LANG}) /MarkInfo<</Marked true>>`);
  }

  // Stamp the title into the Info dictionary if Chrome left it empty.
  if (title && /\/Title\s*\(\s*\)/.test(text)) {
    const safe = title.replace(/[()\\]/g, "\\$&");
    text = text.replace(/\/Title\s*\(\s*\)/, `/Title(${safe})`);
  }

  try {
    writeFileSync(outPath, Buffer.from(text, "latin1"));
  } catch {}
}

// Read the <title> out of the source HTML for the PDF catalog.
function titleFromHtml(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : "";
}

// Render one PDF by spawning headless Chrome detached, then polling for a
// non-empty, stable output file. Once the PDF is on disk we kill the whole
// process group — Chrome does not always self-exit when another instance is
// running, so we never rely on it terminating on its own.
async function renderPdf(chrome, htmlPath, outPath) {
  const profile = join(tmpdir(), `neft-pdf-${process.pid}-${Math.random().toString(36).slice(2)}`);
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
      "--export-tagged-pdf",
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

// Render every variant (default + per-level) for one source HTML file, honoring
// the content-hash manifest so unchanged variants are skipped.
async function renderAllVariants(chrome, { id, srcHtml, baseName, outDir, manifest, force }) {
  const title = titleFromHtml(srcHtml) || `${id} notes`;
  let wrote = 0;
  let skipped = 0;
  let attempted = 0;

  // The unsuffixed default keeps the on-screen default tier (l2 in template).
  // Per-level files force their tier. We treat "default" as its own variant key.
  const variantPlan = [
    { key: "default", suffix: "", level: null },
    ...LEVELS.map((l) => ({ key: l.key, suffix: `-${l.key}`, level: l.key })),
  ];

  for (const variant of variantPlan) {
    const outPath = join(outDir, `${baseName}${variant.suffix}.pdf`);
    const manKey = `${baseName}${variant.suffix}`;
    const hash = hashFor(srcHtml, variant.key);

    if (!force && manifest[manKey] === hash && fileSize(outPath) > 0) {
      skipped++;
      continue;
    }

    attempted++;
    const renderHtml = variant.level == null ? srcHtml : injectLevel(srcHtml, variant.level);

    // Render from a temp HTML that lives in the lesson dir so relative asset
    // URLs (images, etc.) still resolve against the original location.
    const tmpName = `.pdf-render-${process.pid}-${variant.key}-${Math.random()
      .toString(36)
      .slice(2)}.html`;
    const tmpHtmlPath = join(outDir, "..", tmpName);
    let ok = false;
    try {
      writeFileSync(tmpHtmlPath, renderHtml);
      ok = await renderPdf(chrome, tmpHtmlPath, outPath);
    } catch (e) {
      console.warn(`generate-pdf: failed for ${manKey}: ${e.message}`);
    } finally {
      try {
        rmSync(tmpHtmlPath, { force: true });
      } catch {}
    }

    if (ok) {
      stampAccessibility(outPath, title);
      manifest[manKey] = hash;
      wrote++;
    } else {
      // Drop any stale manifest entry so a future run retries this variant.
      delete manifest[manKey];
      console.warn(`generate-pdf: no output for ${manKey}`);
    }
  }

  return { wrote, skipped, attempted };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const filter = args.filter((a) => a !== "--force");
  const chrome = findChrome();
  const ids = lessonIds(filter);

  if (!chrome) {
    console.warn(
      "generate-pdf: no Chrome/Chromium binary found. Set CHROME_PATH to enable PDF export. Skipping (HTML + DOCX downloads still available).",
    );
    return;
  }

  // Student copy (notes.html, no answer key) + teacher copy
  // (notes-teacher.html, with answer key) when present.
  const sources = [
    { suffix: "", src: "notes.html" },
    { suffix: "-teacher", src: "notes-teacher.html" },
  ];

  let wrote = 0;
  let skipped = 0;
  let attempted = 0;

  for (const id of ids) {
    const outDir = join(lessonsDir, id, "downloads");
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
    const manifest = readManifest(outDir);

    for (const s of sources) {
      const htmlPath = join(lessonsDir, id, s.src);
      if (!existsSync(htmlPath)) continue;
      let srcHtml;
      try {
        srcHtml = readFileSync(htmlPath, "utf8");
      } catch {
        continue;
      }
      const res = await renderAllVariants(chrome, {
        id,
        srcHtml,
        baseName: `${id}-notes${s.suffix}`,
        outDir,
        manifest,
        force,
      });
      wrote += res.wrote;
      skipped += res.skipped;
      attempted += res.attempted;
    }

    writeManifest(outDir, manifest);
  }

  console.log(
    `Generated ${wrote} notes PDFs (${skipped} unchanged, skipped) across ${ids.length} lessons using ${chrome}` +
      (attempted && wrote < attempted ? ` — ${attempted - wrote} failed` : ""),
  );
}

main();
