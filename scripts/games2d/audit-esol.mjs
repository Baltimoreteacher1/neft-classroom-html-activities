// QA gate: fail if the forbidden "ESOL" label re-appears in any game file.
//
// Repo naming rule (CLAUDE.md / global instructions): never label student
// content "ESOL" — use "Level 1" (support) / "Level 2" (enrichment). This
// guard scans the 2D/Phaser game trees and exits non-zero on any real "esol"
// token, so the label can never silently creep back in.
//
//     npm run audit:games2d-esol
//
// It excludes the legitimate English word family "resolve / resolved /
// resolution / unresolved" (which contains the substring "esol") and matches
// only true ESOL tokens via word boundaries and the known identifier forms.
import { readdirSync, statSync, readFileSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Scope: the 2D/Phaser math GAME files only (the games-2d resource class).
// We deliberately do NOT scan the whole math tree — many legitimate ESOL
// reading lessons / supplemental tabs live there and are out of scope here.
// A file counts as a game if its path contains a "*game*" folder, lives under
// math/games/, or is one of the histogram-master-lab game pages.
const SKIP_DIRS = new Set(["node_modules", "dist", "vendor", ".git"]);
const GAME_PATH_RE =
  /(^|[/\\])(games)([/\\]|$)|game[/\\]|[/\\][^/\\]*game[^/\\]*[/\\]|histogram-master-lab[/\\]games[/\\]/i;
// Directory subtrees to walk (cheap pre-filter; final gate is GAME_PATH_RE).
const ROOTS = ["math", "games"];

// Match a real "esol" token but never the "resolv*" family. We strip every
// occurrence of resolv-words first, then look for any remaining "esol".
const RESOLVE_RE = /resolv\w*/gi;
const ESOL_RE = /esol/i;

// Allowed exceptions: backward-compat localStorage keys (so existing student
// saves still resume) are explicitly tagged and must not count as offenders.
const ALLOW_RE = /legacyStorageKey|LEGACY_STORAGE_KEY|games2d-allow-esol/;

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else if (name.toLowerCase().endsWith(".html") || name.toLowerCase().endsWith(".js")) out.push(full);
  }
}

const files = [];
for (const r of ROOTS) {
  const abs = join(ROOT, r);
  try {
    if (statSync(abs).isDirectory()) walk(abs, files);
  } catch {}
}

const offenders = [];
const gameFiles = files.filter((f) => GAME_PATH_RE.test(relative(ROOT, f)));
for (const file of gameFiles) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (ALLOW_RE.test(line)) return;
    const cleaned = line.replace(RESOLVE_RE, "");
    if (ESOL_RE.test(cleaned)) {
      offenders.push({ file: relative(ROOT, file), line: i + 1, text: line.trim().slice(0, 140) });
    }
  });
}

if (offenders.length) {
  console.error(`✗ Forbidden "ESOL" label found in ${offenders.length} place(s) — use "Level 1"/"Level 2":`);
  for (const o of offenders) console.error(`  ${o.file}:${o.line}  ${o.text}`);
  process.exit(1);
}

console.log(`✓ games2d ESOL audit clean (${files.length} files scanned)`);
