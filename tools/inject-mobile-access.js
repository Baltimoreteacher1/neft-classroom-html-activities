/* Inject the shared mobile accessibility layer (assets/mobile-access.css) into
 * every student-facing HTML page so lessons, activities, games, and parent
 * homework render well and are easy to tap on phones and tablets.
 *
 * Mirrors tools/inject-game-fx.js: walks the repo, injects a single
 * <link> before </head>, guarded by an idempotent sentinel marker. The layer
 * is additive and defensive (small-screen / touch only) — see
 * assets/mobile-access.css.
 *
 * Usage:
 *   node tools/inject-mobile-access.js            # inject (writes files)
 *   node tools/inject-mobile-access.js --dry-run  # report only
 *   node tools/inject-mobile-access.js --revert   # remove the injected blocks
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const MARK = "mobile-access-injected";
const LINK_TAG = '<link rel="stylesheet" href="/assets/mobile-access.css">';
const BEGIN = `<!-- ${MARK}:begin (shared mobile a11y — tools/inject-mobile-access.js) -->`;
const END = `<!-- ${MARK}:end -->`;

// Non-student / build / tooling dirs we never touch.
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".claude",
  ".codex",
  "scripts",
  "tools",
  "docs",
  "reports",
  "data",
  "canvas-packages",
  "night-shift",
  ".qa-logs",
  "vendor",
  "templates",
  ".playwright-mcp",
]);

// Files whose name marks them as a template/partial, not a real page.
const SKIP_FILE = (name) => /(^|[._-])(template|partial|fragment)\b/i.test(name);

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

const report = {
  scanned: 0,
  injected: 0,
  already: 0,
  reverted: 0,
  skippedNoTags: [],
};


// Find the real closing tag: skip occurrences that sit inside a <script> block
// (vendored libs / print-template string literals contain "</head>"/"</body>"
// text; injecting a <script> there terminates the page's inline script early —
// this corrupted neft-data-studio and reveal-evidence-studio).
function realCloseIndex(html, closeTag) {
  const lower = html.toLowerCase();
  const candidates = [];
  let i = lower.indexOf(closeTag);
  while (i !== -1) {
    const before = lower.slice(0, i);
    const opens = (before.match(/<script\b/g) || []).length;
    const closes = (before.match(/<\/script>/g) || []).length;
    if (opens === closes) candidates.push(i);
    i = lower.indexOf(closeTag, i + 1);
  }
  return candidates.length ? candidates[candidates.length - 1] : -1;
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else if (name.toLowerCase().endsWith(".html") && !SKIP_FILE(name)) out.push(full);
  }
}

function revert(html) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\s*${esc(BEGIN)}[\\s\\S]*?${esc(END)}`, "g");
  return html.replace(re, "");
}

function processFile(file) {
  report.scanned++;
  let html = readFileSync(file, "utf8");

  if (REVERT) {
    if (html.includes(`${MARK}:begin`)) {
      if (!DRY) writeFileSync(file, revert(html));
      report.reverted++;
    }
    return;
  }

  if (html.includes(`${MARK}:begin`)) {
    report.already++;
    return;
  }
  if (!/<\/head>/i.test(html)) {
    report.skippedNoTags.push(file);
    return;
  }

  const headAt = realCloseIndex(html, "</head>");
  if (headAt === -1) {
    report.skippedNoTags.push(file);
    return;
  }
  html = html.slice(0, headAt) + `  ${BEGIN}\n  ${LINK_TAG}\n  ${END}\n` + html.slice(headAt);
  if (!DRY) writeFileSync(file, html);
  report.injected++;
}

const files = [];
walk(ROOT, files);
files.forEach(processFile);

console.log(`Mobile-access injection ${DRY ? "(dry-run)" : ""}${REVERT ? " — revert" : ""}`);
console.log("  HTML scanned     :", report.scanned);
if (REVERT) {
  console.log("  reverted         :", report.reverted);
} else {
  console.log("  injected         :", report.injected);
  console.log("  already injected :", report.already);
  console.log("  skipped (no </head>):", report.skippedNoTags.length);
}
