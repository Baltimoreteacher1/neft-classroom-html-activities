#!/usr/bin/env node
/**
 * Evidence-based dead-code audit.
 *
 * This repo grows by addition: every wave adds scripts, injectors, and shared
 * assets, and nothing has ever been retired. That is how a 100-script `scripts/`
 * directory and hundreds of shared assets accumulate — and it makes every
 * future change more expensive, because nobody can tell which paths are live.
 *
 * This REPORTS candidates; it never deletes. Deleting a shared asset that turns
 * out to be referenced by one lesson breaks that lesson for a class of
 * students, so each finding carries the evidence needed to decide by hand.
 *
 * Method: one ripgrep pass collects every file-like token mentioned anywhere in
 * the tree, mapped to the files that mention it. A candidate is "unreferenced"
 * only when nothing but itself names it.
 *
 * Run:  npm run audit:dead-code
 * Writes reports/dead-code.md.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { assertNonEmpty } from "../tools/lib/non-empty.mjs";
import { assertSweptEnough } from "../tools/lib/sweep-guard.mjs";

const EXCLUDE = ["!node_modules", "!dist", "!.git", "!backups", "!canvas-packages", "!.qa-logs"];

/** Directories whose files are candidates for being dead. */
const CANDIDATE_DIRS = ["assets", "scripts", "tools", "engine/components"];
const CANDIDATE_EXT = new Set([".js", ".mjs", ".cjs", ".css", ".sh"]);

/**
 * Entry points are referenced by tooling, not by other source files, so their
 * absence from the reference graph proves nothing.
 */
const ENTRYPOINT_HINTS = [/^scripts\/ship\.sh$/, /^scripts\/guard-deploy\.js$/];

function rg(args) {
  try {
    return execFileSync("rg", args, { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });
  } catch (err) {
    if (err.status === 1) return ""; // no matches
    throw err;
  }
}

function listCandidates() {
  const out = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      const st = statSync(path);
      if (st.isDirectory()) walk(path);
      else if (CANDIDATE_EXT.has(extname(name))) out.push({ path, bytes: st.size });
    }
  };
  CANDIDATE_DIRS.forEach(walk);
  return out;
}

console.log("• Building the reference graph (one ripgrep pass)...");
const globArgs = EXCLUDE.flatMap((g) => ["-g", g]);
// Every file-like token in the tree, with the file that mentions it.
const raw = rg([
  "-o",
  "--no-heading",
  "--with-filename",
  "--no-line-number",
  "[A-Za-z0-9_.-]+\\.(?:js|mjs|cjs|css|sh)",
  ...globArgs,
  ".",
]);

/** basename -> Set of files that mention it */
const mentions = new Map();
// rg may still emit a line number depending on local config, so parse the
// optional `:<n>:` between path and match rather than splitting on the first
// colon — otherwise every referrer is recorded as "5" and self-references stop
// cancelling, which silently hides dead files.
const LINE_RE = /^(.*?):(?:\d+:)?([A-Za-z0-9_.-]+\.(?:js|mjs|cjs|css|sh))$/;
for (const line of raw.split("\n")) {
  const m = LINE_RE.exec(line);
  if (!m) continue;
  const from = m[1].replace(/^\.\//, "");
  const token = m[2];
  if (!mentions.has(token)) mentions.set(token, new Set());
  mentions.get(token).add(from);
}

// package.json scripts reference files by path; treat those as live references.
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const pkgScriptText = Object.values(pkg.scripts || {}).join(" ");

const candidates = listCandidates();
const dead = [];
const nearlyDead = [];

assertNonEmpty(
  "candidate files",
  candidates,
  "CANDIDATE_DIRS produced nothing — with no candidates the report says nothing is dead, which is not the same as nothing being dead.",
  20,
);
assertSweptEnough(
  "audit:dead-code",
  candidates,
  "Discovery for audit:dead-code returned far fewer items than this gate's pinned floor — see data/sweep-floors.json.",
);
for (const c of candidates) {
  const base = c.path.split("/").pop();
  const referrers = new Set(mentions.get(base) || []);
  referrers.delete(c.path); // self-mentions do not count
  const inPkg = pkgScriptText.includes(base) || pkgScriptText.includes(c.path);
  const isEntry = ENTRYPOINT_HINTS.some((re) => re.test(c.path));
  if (inPkg || isEntry) continue;
  if (referrers.size === 0) dead.push({ ...c, referrers: [] });
  else if (referrers.size === 1) nearlyDead.push({ ...c, referrers: [...referrers] });
}

const fmtKb = (n) => `${(n / 1024).toFixed(1)} KB`;
const totalBytes = dead.reduce((a, d) => a + d.bytes, 0);

const lines = [];
lines.push(`# Dead-code audit — ${new Date().toISOString().slice(0, 10)}`);
lines.push("");
lines.push(`Scanned \`${CANDIDATE_DIRS.join("`, `")}\` — ${candidates.length} files.`);
lines.push("");
lines.push("**Nothing here has been deleted.** These are candidates with evidence.");
lines.push("A file can be unreferenced and still load — anything invoked by a");
lines.push("generated path, an injector template, or a hand-run command will look");
lines.push("dead to a static scan. Verify before removing.");
lines.push("");
lines.push(`## Unreferenced (${dead.length} files, ${fmtKb(totalBytes)})`);
lines.push("");
if (dead.length) {
  lines.push("Nothing in the tree — and no `package.json` script — names these.");
  lines.push("");
  lines.push("| File | Size |");
  lines.push("| --- | ---: |");
  for (const d of dead.sort((a, b) => b.bytes - a.bytes))
    lines.push(`| \`${d.path}\` | ${fmtKb(d.bytes)} |`);
} else {
  lines.push("_None._");
}
lines.push("");
lines.push(`## Single-referrer (${nearlyDead.length} files)`);
lines.push("");
lines.push("Exactly one file mentions these. Often a legitimate one-consumer helper;");
lines.push("sometimes a leftover pair that can be inlined or dropped together.");
lines.push("");
if (nearlyDead.length) {
  lines.push("| File | Size | Referenced by |");
  lines.push("| --- | ---: | --- |");
  for (const d of nearlyDead.sort((a, b) => b.bytes - a.bytes).slice(0, 80)) {
    lines.push(`| \`${d.path}\` | ${fmtKb(d.bytes)} | \`${d.referrers[0]}\` |`);
  }
  if (nearlyDead.length > 80) lines.push(`\n_…and ${nearlyDead.length - 80} more._`);
} else {
  lines.push("_None._");
}
lines.push("");

mkdirSync("reports", { recursive: true });
writeFileSync("reports/dead-code.md", lines.join("\n"));

console.log(`✓ reports/dead-code.md`);
console.log(
  `  ${candidates.length} scanned · ${dead.length} unreferenced (${fmtKb(totalBytes)}) · ${nearlyDead.length} single-referrer`,
);
console.log("  Nothing deleted — review the report and remove by hand.");
