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
 * and theme by the unit that CANONICALLY owns that standard (from
 * data/curriculum-manifest.json) — which is always correct regardless of folder
 * numbering or of what a legacy /unit-N/ path is called. Theme palette is reused from
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
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, join } from "path";
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

// Theme comes from the identity palette (single source), looked up by the unit
// that CANONICALLY owns the lesson's standard.
//
// This used to be a hand-written DOMAIN_UNIT = { RP:"3", NS:"1", EE:"7", SP:"8",
// G:"5" } map. Both halves of it went stale: the CCSS domains were replaced by
// the 2025 MCCRS codes (6.EE.C.8 is now 6.AT.C.8), and the unit numbers were the
// pre-renumber ones, so "EE" pointed at the unit that is now Integers. The
// curriculum manifest already records which unit owns each standard, so ask it
// rather than restating it here.
const identities = load("data/curriculum-unit-identities.json");
const units = (identities && identities.units) || {};
const curriculum = load("data/curriculum-manifest.json");
// Pages badge the cluster letter ("6.AT.C.8") while lesson configs omit it
// ("6.AT.8"), so both forms are indexed and both are tried.
const dropCluster = (id) => String(id || "").replace(/\.[A-Z](?=\.)/, "");
const unitForStandard = new Map();
for (const lesson of (curriculum && curriculum.lessons) || []) {
  if (!lesson.standard) continue;
  // First lesson wins: a standard taught in two units belongs to the earlier
  // one, which is also where the hub lists it.
  for (const key of [lesson.standard, dropCluster(lesson.standard)]) {
    if (!unitForStandard.has(key)) unitForStandard.set(key, String(lesson.unit));
  }
}
/** Canonical lesson id -> unit, the second way to reach the same answer. */
const unitForLesson = new Map(
  ((curriculum && curriculum.lessons) || []).map((l) => [l.id, String(l.unit)]),
);

/**
 * A page's badge can carry an older standard than its lesson config does
 * (6.GR.A.3 on what the manifest now records as 6.NOS.9), so fall back to the
 * canonical lesson id in the page's own path. Both routes ask the curriculum
 * manifest; neither reads a number out of a legacy /unit-N/ folder name.
 */
function themeFor(standard, file) {
  const byLesson = /\/(\d{1,2}-\d{1,2})(?:-[^/]*)?\/[^/]*$/.exec(file || "")?.[1];
  const unit =
    unitForStandard.get(standard) ||
    unitForStandard.get(dropCluster(standard)) ||
    (byLesson && unitForLesson.get(byLesson));
  const u = unit && units[unit];
  if (!u) return null; // unresolvable -> no theme, never a guessed one
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

function buildConfig(html, file) {
  const m = html.match(CCSS_RE);
  if (!m) return null; // no detectable standard -> skip (no fabrication)
  const standard = m[0];
  const cfg = { NT_LESSON_STANDARD: standard };
  const title = extractTitle(html);
  if (title) cfg.NT_LESSON_TITLE = title;
  const theme = themeFor(standard, file);
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
  const cfg = buildConfig(html, file);
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
