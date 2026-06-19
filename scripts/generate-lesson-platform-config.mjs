/* Generate per-lesson configuration for the shared Lesson Platform.
 *
 * The platform layers (adaptive engine, AI tutor, juice) read optional window
 * globals to tailor themselves to the specific lesson:
 *   - window.NT_LESSON_STANDARD   CCSS code (tutor context, adaptive framing)
 *   - window.NT_LESSON_TITLE      lesson title (tutor context)
 *   - window.NT_UNIT_THEME        { name, emoji, color } (juice accent + framing)
 *
 * Source of truth = the lesson's OWN rendered content, NOT a manifest lookup.
 * The classroom math/unit-N folders are numbered differently from the Reveal
 * scope-and-sequence (units 7/8/9 cross over — see project_unit_numbering),
 * so a number-based join produces WRONG standards. Instead we read the single
 * authoritative CCSS code each lesson already displays in its standard badge,
 * and theme by that standard's DOMAIN (RP/NS/EE/SP/G) — which is always correct
 * regardless of folder numbering. Theme palette is reused from
 * data/curriculum-unit-identities.json (single source for accents/icons).
 *
 * Injects one inline <script> into the <head> of every lesson the platform was
 * injected into (files carrying the ntlp-injected sentinel). The inline config
 * runs at parse time, before the deferred platform script, so the globals are
 * present when the layers boot. No data is fabricated: a lesson with no
 * detectable standard is skipped.
 *
 * Idempotent: re-running replaces the existing ntlp-config block.
 *
 * Usage:
 *   node scripts/generate-lesson-platform-config.mjs            # write
 *   node scripts/generate-lesson-platform-config.mjs --dry-run  # report only
 *   node scripts/generate-lesson-platform-config.mjs --revert   # remove blocks
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MARK = "ntlp-config";
const BEGIN = `<!-- ${MARK}:begin (per-lesson platform config — scripts/generate-lesson-platform-config.mjs) -->`;
const END = `<!-- ${MARK}:end -->`;
const SENTINEL = "ntlp-injected"; // only configure lessons that have the platform

// A Grade-6 CCSS code: 6.<domain>[.<cluster>].<number>[letter]. The lesson's
// standard badge is the only such code on the page.
const CCSS_RE = /6\.([A-Z]{1,3})(?:\.[A-Z])?\.\d+[a-z]?/;

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

function load(rel) {
  try {
    return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
}

// Build domain -> theme from the identity palette (single source). Each Grade-6
// domain maps to the scope-sequence unit that owns it; the accent/icon/title are
// reused verbatim so themes stay consistent with the curriculum hub.
const identities = load("data/curriculum-unit-identities.json");
const units = (identities && identities.units) || {};
const DOMAIN_UNIT = { RP: "3", NS: "1", EE: "7", SP: "8", G: "5" };
function themeForDomain(domain) {
  const u = units[DOMAIN_UNIT[domain]];
  if (!u) return null;
  return { name: u.title || "", emoji: u.icon || "", color: u.accent || "" };
}

function esc(re) {
  return re.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function stripBlock(html) {
  return html.replace(new RegExp(`\\s*${esc(BEGIN)}[\\s\\S]*?${esc(END)}`, "g"), "");
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  if (!m) return "";
  // "Lesson 7-3: Understand Absolute Value" -> "Understand Absolute Value"
  return m[1].replace(/^\s*Lesson\s+[\d-]+\s*:\s*/i, "").trim();
}

function buildConfig(html) {
  const m = html.match(CCSS_RE);
  if (!m) return null; // no detectable standard -> skip (no fabrication)
  const standard = m[0];
  const domain = m[1];
  const cfg = { NT_LESSON_STANDARD: standard };
  const title = extractTitle(html);
  if (title) cfg.NT_LESSON_TITLE = title;
  const theme = themeForDomain(domain);
  if (theme) cfg.NT_UNIT_THEME = theme;
  return cfg;
}

function renderBlock(cfg) {
  const lines = Object.entries(cfg).map(([k, v]) => `window.${k}=${JSON.stringify(v)};`);
  return `  ${BEGIN}\n  <script>${lines.join("")}</script>\n  ${END}\n</head>`;
}

const report = { scanned: 0, configured: 0, reverted: 0, noStandard: 0, byDomain: {} };

function processFile(file) {
  let html = readFileSync(file, "utf8");
  if (!html.includes(`${SENTINEL}:begin`)) return; // platform not injected here
  report.scanned++;

  if (REVERT) {
    if (html.includes(`${MARK}:begin`)) {
      if (!DRY) writeFileSync(file, stripBlock(html));
      report.reverted++;
    }
    return;
  }

  html = stripBlock(html); // strip any prior config FIRST, then read clean content
  const cfg = buildConfig(html);
  if (!cfg) {
    report.noStandard++;
    return;
  }
  const dom = cfg.NT_LESSON_STANDARD.match(CCSS_RE)[1];
  report.byDomain[dom] = (report.byDomain[dom] || 0) + 1;

  if (!/<\/head>/i.test(html)) return;
  html = html.replace(/<\/head>/i, renderBlock(cfg));
  if (!DRY) writeFileSync(file, html);
  report.configured++;
}

const mathDir = join(ROOT, "math");
if (existsSync(mathDir)) {
  for (const u of readdirSync(mathDir)) {
    if (!u.startsWith("unit-")) continue;
    const ud = join(mathDir, u);
    let entries;
    try {
      if (!statSync(ud).isDirectory()) continue;
      entries = readdirSync(ud);
    } catch {
      continue;
    }
    for (const slug of entries) {
      const f = join(ud, slug, "index.html");
      if (existsSync(f)) processFile(f);
    }
  }
}

console.log(`Lesson Platform config ${DRY ? "(dry-run)" : ""}${REVERT ? " — revert" : ""}`);
console.log("  lessons with platform :", report.scanned);
if (REVERT) {
  console.log("  reverted              :", report.reverted);
} else {
  console.log("  configured            :", report.configured);
  console.log("  no standard (skipped) :", report.noStandard);
  console.log("  by domain             :", JSON.stringify(report.byDomain));
}
