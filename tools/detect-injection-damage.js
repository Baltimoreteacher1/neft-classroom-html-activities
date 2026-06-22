#!/usr/bin/env node
/**
 * One-time detector for the injection-damage repair.
 *
 * Verifies, across every page that carries an injected Save/Resume or
 * Math Workbench block:
 *   1. No injected block sits INSIDE a JS template/string (the marker comment
 *      must not appear between <script> ... </script> of an inline script).
 *   2. Every inline <script> parses (node --check equivalent via vm.compile).
 *   3. Injected tags sit before the real final </body> (the last one).
 *   4. The Math Workbench page itself is not injected (no self-injection).
 *   5. The launcher tag is present on student pages that were injected.
 *
 * Exits non-zero if any page is broken. Pure read-only.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, mkdtempSync } from "fs";
import { join, relative } from "path";
import { tmpdir } from "os";
import { execFileSync } from "child_process";
import vm from "vm";

const ROOT = process.cwd();
const TMP = mkdtempSync(join(tmpdir(), "injchk-"));
const NSR_MARK = "nsr-injected:begin";
const MWB_MARK = "mwb-injected:begin";
const NSR_SCRIPT = "save-resume-engine.js";
const MWB_SCRIPT = "math-workbench-launcher.js";

const SKIP_DIRS = new Set([
  "node_modules", "dist", ".git", "engine", "lessons", "scripts", "docs",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full, out);
    } else if (name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

// Extract inline <script> bodies (skip those with a src= attribute).
function inlineScripts(html) {
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || "";
    if (/\bsrc\s*=/.test(attrs)) continue;
    if (/\btype\s*=\s*["']?(application\/json|text\/template|importmap)/i.test(attrs)) continue;
    const isModule = /\btype\s*=\s*["']?module/i.test(attrs);
    blocks.push({ body: m[2], index: m.index, isModule });
  }
  return blocks;
}

let tmpCounter = 0;
function checkSyntax(code, isModule) {
  if (isModule) {
    // module scripts use ESM import/export — check via `node --check` on a .mjs.
    const f = join(TMP, `s${tmpCounter++}.mjs`);
    writeFileSync(f, code);
    try {
      execFileSync(process.execPath, ["--check", f], { stdio: "pipe" });
      return null;
    } catch (e) {
      return String(e.stderr || e.message).split("\n").find((l) => /Error/.test(l)) || "syntax error";
    }
  }
  try {
    new vm.Script(code);
    return null;
  } catch (e) {
    return e.message;
  }
}

const pages = walk(ROOT);
const problems = [];
let injectedPages = 0;
let okPages = 0;

for (const file of pages) {
  const rel = relative(ROOT, file);
  const html = readFileSync(file, "utf8");
  const hasNsr = html.includes(NSR_MARK);
  const hasMwb = html.includes(MWB_MARK);
  if (!hasNsr && !hasMwb) continue;
  injectedPages++;

  let pageBad = false;

  // (1) injected markers must NOT be inside an inline <script> body
  const scripts = inlineScripts(html);
  for (const s of scripts) {
    if (s.body.includes(NSR_MARK) || s.body.includes(MWB_MARK)) {
      problems.push(`${rel}: injected marker INSIDE an inline <script> body`);
      pageBad = true;
    }
    // (2) every inline script must parse
    const err = checkSyntax(s.body, s.isModule);
    if (err) {
      problems.push(`${rel}: inline <script> SYNTAX ERROR — ${err}`);
      pageBad = true;
    }
  }

  // (3) injected tags before the real final </body>
  const bodies = [...html.matchAll(/<\/body>/gi)];
  if (bodies.length) {
    const lastBody = bodies[bodies.length - 1].index;
    if (hasNsr) {
      const nsrIdx = html.indexOf(NSR_SCRIPT);
      if (nsrIdx > lastBody) {
        problems.push(`${rel}: save-resume tag AFTER final </body>`);
        pageBad = true;
      }
    }
    if (hasMwb) {
      const mwbIdx = html.indexOf(MWB_SCRIPT);
      if (mwbIdx > lastBody) {
        problems.push(`${rel}: workbench tag AFTER final </body>`);
        pageBad = true;
      }
    }
  } else {
    problems.push(`${rel}: no </body> at all`);
    pageBad = true;
  }

  // (5) launcher tag present if mwb injected
  if (hasMwb && !html.includes(MWB_SCRIPT)) {
    problems.push(`${rel}: mwb marker present but launcher <script> missing`);
    pageBad = true;
  }

  if (!pageBad) okPages++;
}

// (4) Workbench page must not be self-injected
const wbCandidates = pages.filter((p) =>
  /math-workbench\/index\.html$/.test(relative(ROOT, p)),
);
for (const wb of wbCandidates) {
  const html = readFileSync(wb, "utf8");
  if (html.includes(MWB_MARK)) {
    problems.push(`${relative(ROOT, wb)}: Math Workbench page is self-injected`);
  }
}

console.log(`Injected pages scanned: ${injectedPages}`);
console.log(`Clean pages:            ${okPages}`);
console.log(`Workbench pages found:  ${wbCandidates.length}`);
console.log(`Problems:               ${problems.length}`);
if (problems.length) {
  console.log("\n--- PROBLEMS ---");
  for (const p of problems) console.log("  ✗ " + p);
  process.exit(1);
}
console.log("\n✓ All injected pages clean.");
