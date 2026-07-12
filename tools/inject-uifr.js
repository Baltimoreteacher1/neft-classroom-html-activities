#!/usr/bin/env node
/* =============================================================================
 * inject-uifr.js — stamp a hidden, student-invisible BCPS UIFR (TEACH · Level 4)
 * evidence COMMENT into <head> of every lesson launcher and standalone activity.
 *
 * Why: the engine already injects a runtime <meta> stamp into rendered lessons,
 * but that only exists in the live DOM (DevTools). This adds a STATIC HTML
 * comment so the evidence is discoverable in raw "View Source" — before any JS
 * runs — for every lesson AND for the 200 standalone activities (which are not
 * engine-driven and so have no runtime stamp). An HTML comment never renders, so
 * students never see rubric language; a teacher/observer/auditor reading source
 * does. Family "uifr" balances under validate:injection.
 *
 * Head-only, idempotent, reversible. Usage:
 *   node tools/inject-uifr.js            # inject / refresh
 *   node tools/inject-uifr.js --revert   # remove the block
 *   node tools/inject-uifr.js --check    # verify balance (exit 1 on drift)
 * ========================================================================== */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { computeTeachL4Evidence, classifyActivityTeachSupport } from "../engine/core/uifr.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS_DIR = join(ROOT, "lessons");
const BEGIN = "<!-- uifr-injected:begin -->";
const END = "<!-- uifr-injected:end -->";
const BLOCK_RE =
  /\n?[ \t]*<!--\s*uifr-injected:begin\s*-->[\s\S]*?<!--\s*uifr-injected:end\s*-->/gi;

function block(inner) {
  return `\n    ${BEGIN}\n    <!-- ${inner} -->\n    ${END}`;
}

function lessonComment(id, cfg) {
  const ev = computeTeachL4Evidence(cfg);
  return [
    "BCPS Instructional Framework Rubric · TEACH · Level 4 (Highly Effective) evidence.",
    "Teacher/observer reference — NOT shown to students.",
    `Lesson ${id}: creates the Level 4 conditions on direct indicators T1-T5 (${ev.direct.met}/${ev.direct.total});`,
    `supports facilitated indicators T6-T7 (${ev.facilitated.supported}/${ev.facilitated.total}).`,
    "Full evidence: Teacher Mode panel · /teacher-tools/teaching-evidence/ · docs/uifr-teach-l4.md.",
  ].join(" ");
}

function activityComment(path, supports) {
  return [
    "BCPS Instructional Framework Rubric · TEACH support.",
    "Teacher/observer reference — NOT shown to students.",
    `Interactive practice activity (${path}): supports Level 4 conditions on ${supports.join(", ")}`,
    "(students choose their approach + immediate no-fail feedback with retry).",
    "Full evidence: /teacher-tools/teaching-evidence/ · docs/uifr-teach-l4.md.",
  ].join(" ");
}

function apply(file, inner, mode) {
  if (!existsSync(file)) return false;
  const orig = readFileSync(file, "utf8");
  const present = orig.includes(BEGIN);

  if (mode === "revert") {
    if (!present) return false;
    // Fresh regex each call so the /g lastIndex can never leak between files.
    writeFileSync(file, orig.replace(new RegExp(BLOCK_RE.source, "gi"), ""), "utf8");
    return true;
  }

  // Inject is IDEMPOTENT: if a stamp is already present, leave it untouched (no
  // git churn on re-runs). To refresh stale comment text, run `--revert` first.
  if (present) return false;
  const at = orig.toLowerCase().lastIndexOf("</head>");
  if (at === -1) return false;
  writeFileSync(file, orig.slice(0, at) + block(inner) + "\n  " + orig.slice(at), "utf8");
  return true;
}

function checkFile(file) {
  const html = readFileSync(file, "utf8");
  const b = html.split("uifr-injected:begin").length - 1;
  const e = html.split("uifr-injected:end").length - 1;
  return b === e && b <= 1;
}

export function targets() {
  const list = [];
  // Lessons: every dir with a config.json + index.html.
  for (const id of readdirSync(LESSONS_DIR).sort()) {
    const idx = join(LESSONS_DIR, id, "index.html");
    const cfgP = join(LESSONS_DIR, id, "config.json");
    if (!existsSync(idx) || !existsSync(cfgP)) continue;
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(cfgP, "utf8"));
    } catch {
      continue;
    }
    list.push({ file: idx, inner: lessonComment(id, cfg), label: `lesson ${id}` });
  }
  // Activities: catalog entries are either a dir path ("foo") or a full HTML
  // path ("a/b/index.html"). Resolve to the real .html file either way.
  const catP = join(ROOT, "tools", "scorm", "activity-catalog.json");
  if (existsSync(catP)) {
    const cat = JSON.parse(readFileSync(catP, "utf8"));
    const all = [...(cat.activities || []), ...(cat.injectOnly || [])];
    const seen = new Set();
    for (const a of all) {
      const path = typeof a === "string" ? a : a && a.path;
      if (!path) continue;
      const direct = join(ROOT, path);
      const nested = join(ROOT, path, "index.html");
      const file =
        path.endsWith(".html") && existsSync(direct) ? direct : existsSync(nested) ? nested : null;
      if (!file || seen.has(file)) continue;
      seen.add(file);
      const label = path.replace(/\/index\.html$/, "");
      const supports = classifyActivityTeachSupport(`${path} ${label}`);
      list.push({ file, inner: activityComment(label, supports), label: `activity ${label}` });
    }
  }
  return list;
}

function main() {
  const args = process.argv.slice(2);
  const mode = args.includes("--revert") ? "revert" : args.includes("--check") ? "check" : "inject";
  const list = targets();
  let touched = 0;
  let bad = 0;

  for (const t of list) {
    if (mode === "check") {
      if (!checkFile(t.file)) {
        console.error(`  IMBALANCED: ${t.label}`);
        bad++;
      }
    } else if (apply(t.file, t.inner, mode)) {
      touched++;
    }
  }

  if (mode === "check") {
    console.log(`inject-uifr: check — ${list.length - bad}/${list.length} balanced.`);
    process.exit(bad > 0 ? 1 : 0);
  }
  console.log(
    `inject-uifr: ${mode.toUpperCase()} — ${touched} files ${mode === "revert" ? "cleared" : "stamped"} (of ${list.length} targets).`,
  );
}

// Only run the CLI when executed directly — not when imported (e.g. by
// tools/validate-uifr.mjs, which reuses targets() to assert stamp coverage).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
