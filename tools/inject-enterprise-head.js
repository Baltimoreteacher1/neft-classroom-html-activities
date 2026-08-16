/* Inject the enterprise head/meta layer into every lesson page under lessons/.
 *
 * What it adds (sentinel-guarded, idempotent, additive only):
 *   <head> block (`enthead-injected`):
 *     - favicon + apple-touch-icon (brand parity with the Curriculum Hub)
 *     - <meta name="theme-color"> (navy, matches lesson chrome)
 *     - <link rel="canonical"> per page URL
 *     - <meta name="description"> derived from the <title> when missing
 *     - Open Graph tags (title / description / url / image / site_name) so
 *       links pasted into Google Classroom, Canvas, iMessage, etc. unfurl
 *       with real lesson info instead of a bare URL.
 *   <body> block (`entshell-injected`) — JS-rendered launcher shells only
 *   (index.html with an empty <div id="app">):
 *     - <noscript> notice for JS-disabled browsers
 *     - /assets/lesson-shell-guard.js watchdog (blank-screen recovery card)
 *
 * Mirrors tools/inject-mobile-access.js conventions: sentinel markers,
 * --dry-run / --revert, lastIndexOf-based insertion (never splice inside
 * inline scripts), and a summary report.
 *
 * Usage:
 *   node tools/inject-enterprise-head.js            # inject (writes files)
 *   node tools/inject-enterprise-head.js --dry-run  # report only
 *   node tools/inject-enterprise-head.js --revert   # remove injected blocks
 *
 * Re-run this after regenerating lesson pages (notes/worksheets/etc.), same
 * as the other injector layers.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const SITE = "https://eduwonderlab.com";
const OG_IMAGE = `${SITE}/assets/og-curriculum.png`;
const THEME = "#12355b";

const HEAD_MARK = "enthead-injected";
const HEAD_BEGIN = `<!-- ${HEAD_MARK}:begin (enterprise head/meta — tools/inject-enterprise-head.js) -->`;
const HEAD_END = `<!-- ${HEAD_MARK}:end -->`;

const SHELL_MARK = "entshell-injected";
const SHELL_BEGIN = `<!-- ${SHELL_MARK}:begin (no-JS + boot-failure fallback — tools/inject-enterprise-head.js) -->`;
const SHELL_END = `<!-- ${SHELL_MARK}:end -->`;

// Student/family-facing lesson pages that get the head layer. Generated pages
// (slides, downloads) are excluded; support subdirs have their own layer.
const PAGE_FILES = new Set([
  "index.html",
  "learn.html",
  "vocab.html",
  "notes.html",
  "notes-teacher.html",
  "homework.html",
  "worksheet.html",
  "handout.html",
]);

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

const report = {
  scanned: 0,
  headInjected: 0,
  shellInjected: 0,
  reverted: 0,
  skipped: 0,
};

const escapeAttr = (s) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const stripBlock = (html, begin, end) => {
  const b = html.indexOf(begin);
  if (b === -1) return html;
  const e = html.indexOf(end, b);
  if (e === -1) return html; // unbalanced — leave for validate:injection to flag
  return (
    html.slice(0, b).replace(/[ \t]*$/, "") + html.slice(e + end.length).replace(/^\s*\n/, "\n")
  );
};

function extractTitle(html) {
  const m = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  return m[1].replace(/\s+/g, " ").replace(/&amp;/g, "&").trim();
}

function hasOwnDescription(html) {
  // A description outside our sentinel block (block is stripped before calling).
  return /<meta\s+name="description"/i.test(html);
}

function buildHeadBlock(file, dirName, html) {
  const page = basename(file);
  const canonical =
    page === "index.html" ? `${SITE}/lessons/${dirName}/` : `${SITE}/lessons/${dirName}/${page}`;
  const title = extractTitle(html) || `Lesson ${dirName} — Neft Teacher`;
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const description =
    (descMatch && descMatch[1]) ||
    `Neft Teacher Grade 6 Reveal Math resource — ${title.replace(/\s*—\s*Neft Teacher\s*$/i, "")}.`;

  const lines = [
    HEAD_BEGIN,
    '<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">',
    '<link rel="apple-touch-icon" href="/assets/favicon.svg">',
    `<meta name="theme-color" content="${THEME}">`,
    `<link rel="canonical" href="${canonical}">`,
  ];
  if (!hasOwnDescription(html)) {
    lines.push(`<meta name="description" content="${escapeAttr(description)}">`);
  }
  lines.push(
    `<meta property="og:type" content="${page === "index.html" ? "website" : "article"}">`,
    '<meta property="og:site_name" content="Neft Teacher">',
    `<meta property="og:title" content="${escapeAttr(title)}">`,
    `<meta property="og:description" content="${escapeAttr(description)}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    HEAD_END,
  );
  return lines.join("\n  ");
}

const SHELL_BLOCK = [
  SHELL_BEGIN,
  "<noscript>",
  '  <div role="alert" style="max-width:520px;margin:64px auto;padding:28px;background:#fff;border:1px solid #d7e2ed;border-radius:16px;font-family:system-ui,sans-serif;color:#21313f;text-align:center">',
  '    <h1 style="font-size:22px;color:#12355b;margin:0 0 8px">This lesson needs JavaScript</h1>',
  '    <p style="font-size:16px;color:#5f6f80;margin:0 0 14px">Please turn JavaScript on in your browser, then reload this page.</p>',
  '    <p style="margin:0"><a href="/curriculum/" style="color:#0d7a76;font-weight:600">← Back to the Curriculum Hub</a></p>',
  "  </div>",
  "</noscript>",
  '<script src="/assets/lesson-shell-guard.js" defer></script>',
  SHELL_END,
].join("\n  ");

/**
 * A page whose body is mounted by JavaScript, and which therefore needs the
 * no-JS notice and the boot-failure guard.
 *
 * The mount point is `<div id="app">`; what it CONTAINS before the module runs
 * is not part of that question. This used to require the div be empty
 * (`<div id="app">\s*</div>`), which was true when it was written and stopped
 * being true when the small-group shells gained a "Loading your math studio…"
 * placeholder inside it. Since this tool strips its own block and rebuilds,
 * that made re-running it DESTRUCTIVE: 212 lesson pages carry the guard today
 * and only 85 still match the empty-div form, so a single run would have
 * silently removed the no-JS fallback and lesson-shell-guard.js from the other
 * ~127 — the guard whose absence validate:lesson-boot exists to notice.
 */
function isLauncherShell(html, file) {
  return (
    basename(file) === "index.html" && /<div id="app"[\s>]/.test(html) && /type="module"/.test(html)
  );
}

function processFile(file, dirName) {
  report.scanned++;
  const original = readFileSync(file, "utf8");
  let html = stripBlock(original, HEAD_BEGIN, HEAD_END);
  html = stripBlock(html, SHELL_BEGIN, SHELL_END);

  if (REVERT) {
    if (html !== original) {
      report.reverted++;
      if (!DRY) writeFileSync(file, html);
    }
    return;
  }

  const headAt = html.lastIndexOf("</head>");
  if (headAt === -1) {
    report.skipped++;
    return;
  }
  html = `${html.slice(0, headAt)}  ${buildHeadBlock(file, dirName, html)}\n${html.slice(headAt)}`;
  report.headInjected++;

  if (isLauncherShell(html, file)) {
    const bodyAt = html.lastIndexOf("</body>");
    if (bodyAt !== -1) {
      html = `${html.slice(0, bodyAt)}  ${SHELL_BLOCK}\n${html.slice(bodyAt)}`;
      report.shellInjected++;
    }
  }

  if (!DRY && html !== original) writeFileSync(file, html);
}

for (const entry of readdirSync(LESSONS)) {
  const dir = join(LESSONS, entry);
  if (entry.startsWith("_") || !statSync(dir).isDirectory()) continue; // _template etc.
  for (const name of readdirSync(dir)) {
    if (!PAGE_FILES.has(name)) continue;
    const file = join(dir, name);
    if (!statSync(file).isFile()) continue;
    processFile(file, entry);
  }
}

console.log(
  `[inject-enterprise-head] ${DRY ? "(dry-run) " : ""}scanned=${report.scanned} head=${report.headInjected} shell=${report.shellInjected} reverted=${report.reverted} skipped=${report.skipped}`,
);
if (report.skipped > 0) console.log("  skipped = pages with no </head> tag (not real documents)");
