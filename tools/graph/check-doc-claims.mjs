#!/usr/bin/env node
/**
 * Every file path a doc or comment points at must exist.
 *
 * Prose is the one part of this repo nothing checks, and it has been wrong in
 * expensive ways:
 *
 *   - CLAUDE.md stated "`.claude/settings.json` declares two [hooks] … Both
 *     scripts exist and both were verified by execution." One of them,
 *     the Bash guard, was not in the repo at all, so every fresh clone ran
 *     with no Bash guard while the docs promised one.
 *   - tools/a11y-ratchet.test.mjs said it works on "the COMMITTED report",
 *     `reports/a11y-audit.md` — a path `.gitignore` made impossible to commit.
 *     It failed in CI every run.
 *
 * Both were a sentence naming a file that was not there. That is mechanically
 * checkable, and this checks it.
 *
 * What it does NOT catch, stated plainly so nobody reads a pass as more than it
 * is: prose that is wrong about BEHAVIOUR rather than about a path. The comment
 * in lesson-renderer.js listing the phase chain as "Continue to Learn It,
 * Continue to Practice" — skipping Explore — named no file, and a spec was
 * written against that misreading. Nothing here would have found it.
 *
 *   node tools/graph/check-doc-claims.mjs
 *   node tools/graph/check-doc-claims.mjs --list   # every claim, not just breaks
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const LIST = process.argv.includes("--list");
/* Report-only by default. 412 pre-existing broken references is a backlog, not
   a bug to fix in one commit, and a gate that starts red is a gate people learn
   to ignore. `--gate` makes it exit non-zero, for once the backlog is down. */
const GATE = process.argv.includes("--gate");

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".wrangler",
  ".vite",
  "test-results",
  "playwright-report",
  "canvas-packages",
  "scorm-packages",
  "tmp",
  "coverage",
  ".codex",
  ".superpowers",
]);

/* Extensions that make a token unambiguously a file reference. A bare word with
   a slash could be a URL path, a route, or an npm scope; requiring a known
   extension keeps this to things that are meant to be files on disk. */
const FILE_EXT = /\.(md|mjs|cjs|js|ts|tsx|json|html|sh|bash|yml|yaml|css|txt|toml|sql|py)$/i;

/* Paths that are real but deliberately absent from a checkout, or that name
   something generated at build time. Claiming these exist is not a lie. */
const ALLOWED_MISSING = [
  /^dist\//,
  /^node_modules\//,
  /^\.git\//,
  /^coverage\//,
  /^canvas-packages\//,
  /^scorm-packages\//,
  /^playwright-report\//,
  /^test-results\//,
  /^\.wrangler\//,
  /^tmp\//,
  // Generated audit output: `.gitignore` keeps everything under reports/ except
  // the a11y baseline, so a doc naming one is describing a command's output,
  // not claiming a tracked file.
  /^reports\/(?!a11y-audit\.md$)/,
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && ![".github", ".claude"].includes(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (/\.(md|mjs|cjs|js|ts|html|yml|yaml|sh)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Prose regions only: markdown is all prose; source files, just the comments. */
function proseOf(file, text) {
  if (file.endsWith(".md")) return text;
  const parts = [];
  for (const m of text.matchAll(/\/\*[\s\S]*?\*\//g)) parts.push(m[0]);
  for (const m of text.matchAll(/(^|[^:"'`\\])\/\/([^\n]*)/g)) parts.push(m[2]);
  for (const m of text.matchAll(/<!--[\s\S]*?-->/g)) parts.push(m[0]);
  for (const m of text.matchAll(/^\s*#(?!!)([^\n]*)/gm)) parts.push(m[1]);
  return parts.join("\n");
}

/**
 * Path-shaped tokens inside backticks, markdown links, or bare in prose.
 *
 * Backticks are the strong signal: a backticked repo-relative path is a
 * deliberate reference, not incidental prose.
 * Bare tokens are accepted too, but only with a slash AND an extension, which
 * keeps `package.json` in a sentence from being read as a claim about a
 * specific one.
 */
function claimsIn(prose) {
  const found = new Set();
  const add = (raw) => {
    const p = String(raw)
      .trim()
      .replace(/^\.\//, "")
      .replace(/[),.;:]+$/, "");
    if (!p || p.includes("*") || p.includes("://") || /\s/.test(p)) return;
    if (p.startsWith("#") || p.startsWith("@") || p.startsWith("~")) return;
    if (!FILE_EXT.test(p)) return;
    if (p.startsWith("/")) return; // site-absolute URL, not a repo path

    // Templates, not claims: `lessons/<id>/vocab.html`, `math/unit-N/index.html`,
    // `lessons/{a,b}.html`. These describe a shape, and no single file answers
    // them — treating them as broken would train people to ignore this check.
    if (/[<>{}]/.test(p)) return;
    const segments = p.split("/");
    if (segments.some((s) => /^[A-Z]$|-[A-Z]$|^\.\w+$/.test(s))) return;

    // A bare filename is ambiguous — `config.json`, `printable.html` and
    // `forge.js` each name dozens of real files, and which one a sentence means
    // is not recoverable. Only multi-segment paths are specific enough to be
    // called wrong.
    if (segments.length < 2) return;

    found.add(p);
  };
  for (const m of prose.matchAll(/`([^`\n]+)`/g)) add(m[1]);
  for (const m of prose.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) add(m[1]);
  for (const m of prose.matchAll(/(?:^|[\s(])((?:[\w.@-]+\/)+[\w.@-]+)/g)) add(m[1]);
  return [...found];
}

const files = walk(ROOT);
const broken = [];
let claimCount = 0;

for (const file of files) {
  let text;
  try {
    if (statSync(file).size > 4_000_000) continue;
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const rel = relative(ROOT, file);
  const here = dirname(file);

  for (const claim of claimsIn(proseOf(file, text))) {
    if (ALLOWED_MISSING.some((re) => re.test(claim))) continue;
    claimCount++;
    // Resolve against the repo root first, then beside the file that says it —
    // comments routinely name a sibling without a path.
    if (existsSync(resolve(ROOT, claim)) || existsSync(resolve(here, claim))) {
      if (LIST) console.log(`   ok  ${rel} → ${claim}`);
      continue;
    }
    broken.push({ file: rel, claim });
  }
}

console.log(`doc claims: ${claimCount} file reference(s) checked across ${files.length} file(s)`);

if (broken.length) {
  console.error(`\n✗ ${broken.length} reference(s) point at files that do not exist:\n`);
  const byFile = new Map();
  for (const b of broken) byFile.set(b.file, [...(byFile.get(b.file) ?? []), b.claim]);
  for (const [file, claims] of [...byFile].sort()) {
    console.error(`   ${file}`);
    for (const c of claims) console.error(`      → ${c}`);
  }
  console.error(
    "\n  Fix the path, create the file, or reword the sentence — but do not leave\n" +
      "  a doc naming something that is not there. A hook wired to a missing\n" +
      "  script does not announce itself; it just never runs, and the docs go on\n" +
      "  saying it does.",
  );
  if (GATE) process.exit(1);
}

console.log("✓ every referenced file exists");
