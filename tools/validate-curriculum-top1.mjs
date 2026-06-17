#!/usr/bin/env node
/**
 * validate-curriculum-top1.mjs
 * Validates the additive "Start Here" / UIFR Level 4 curriculum layer:
 *  - the four data files exist, parse, and carry required keys
 *  - curriculum/index.html wires the top1 CSS + JS
 *  - the public default mode is Student (public/private safety)
 *  - accessibility: 44px progress-check target + focus-visible styles exist
 * Exits non-zero on any failure so it can gate the build.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const fails = [];
const oks = [];
const ok = (m) => oks.push(m);
const fail = (m) => fails.push(m);

function readJson(rel) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) {
    fail(`missing data file: ${rel}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    fail(`invalid JSON in ${rel}: ${e.message}`);
    return null;
  }
}

// 1. Data files + required shape
const ident = readJson("data/curriculum-unit-identities.json");
if (ident) {
  const u = ident.units || {};
  const missing = [];
  for (let i = 1; i <= 10; i++) {
    const e = u[String(i)];
    if (!e || !e.mission || !e.icon || !e.finalChallenge) missing.push(i);
  }
  missing.length
    ? fail(`unit-identities incomplete for units: ${missing.join(", ")}`)
    : ok("unit-identities: 10 units with icon/mission/finalChallenge");
}

const supports = readJson("data/curriculum-supports.json");
if (supports) {
  const fams = supports.families || {};
  const need = ["sentenceFrame", "becauseButSo", "vocabulary", "wida12", "wida34", "sped", "extension", "teacherNote"];
  const bad = Object.keys(fams).filter((k) => need.some((n) => fams[k][n] == null));
  if (!Object.keys(fams).length) fail("supports: no families defined");
  else if (bad.length) fail(`supports families missing keys: ${bad.join(", ")}`);
  else ok(`supports: ${Object.keys(fams).length} skill families complete`);
}

const tax = readJson("data/curriculum-resource-taxonomy.json");
if (tax) {
  if (!Array.isArray(tax.rules) || !tax.rules.length) fail("taxonomy: no rules");
  else if (!tax.fallback) fail("taxonomy: no fallback");
  else {
    const bad = tax.rules.filter((r) => !r.match || !r.type || !r.visibility || !Array.isArray(r.badges));
    bad.length ? fail(`taxonomy: ${bad.length} malformed rules`) : ok(`taxonomy: ${tax.rules.length} rules + fallback`);
    // regex must compile
    for (const r of tax.rules) {
      try {
        new RegExp(r.match, "i");
      } catch (e) {
        fail(`taxonomy: bad regex "${r.match}"`);
      }
    }
  }
}

const uifr = readJson("data/curriculum-uifr-level4.json");
if (uifr) {
  const needArrays = ["components", "questioningLadder", "academicTalkStems", "formativeCheckpoints", "masteryChecklist", "reflectionCard", "dataNextSteps"];
  const miss = needArrays.filter((k) => !Array.isArray(uifr[k]) || !uifr[k].length);
  if (miss.length) fail(`uifr missing/empty: ${miss.join(", ")}`);
  else if ((uifr.components || []).length !== 11) fail(`uifr: expected 11 rubric components, found ${uifr.components.length}`);
  else ok("uifr: 11 components + ladder/talk/checkpoints/mastery/reflection/next-steps");
  if (!uifr.disclaimer || /guarantee/i.test(uifr.disclaimer)) fail("uifr: disclaimer must exist and must not claim a guaranteed rating");
  else ok("uifr: non-inflated disclaimer present");
}

// 2. Wiring in curriculum/index.html
const idxPath = join(ROOT, "curriculum/index.html");
if (!existsSync(idxPath)) fail("curriculum/index.html not found");
else {
  const html = readFileSync(idxPath, "utf8");
  html.includes("curriculum-top1.css") ? ok("index wires curriculum-top1.css") : fail("index missing curriculum-top1.css link");
  html.includes("curriculum-top1.js") ? ok("index wires curriculum-top1.js") : fail("index missing curriculum-top1.js script");
}

// 3. Public/private safety: student-mode default
const enhPath = join(ROOT, "assets/curriculum-enhancements.js");
if (!existsSync(enhPath)) fail("assets/curriculum-enhancements.js not found");
else {
  const js = readFileSync(enhPath, "utf8");
  const fn = js.slice(js.indexOf("function loadTeacherMode"), js.indexOf("function saveTeacherMode"));
  /return\s+false\s*;\s*\}?\s*$/.test(fn.trim()) || /Public-safe default: Student Mode/.test(fn)
    ? ok("public default is Student Mode")
    : fail("loadTeacherMode default is not Student Mode (public-safety regression)");
  /slides\\.html\$?/i.test(js) ? ok("slide decks are teacher-gated by href") : fail("slides.html not in teacher href patterns (Student-Mode leak)");
  /hub-teacher-only/.test(js) ? ok("teacher dashboard link is teacher-only") : fail("teacher dashboard not gated (Student-Mode leak)");
}

// 4. Accessibility in CSS
const cssPath = join(ROOT, "assets/curriculum-top1.css");
if (!existsSync(cssPath)) fail("assets/curriculum-top1.css not found");
else {
  const css = readFileSync(cssPath, "utf8");
  /\.progress-check[\s\S]*?min-height:\s*44px/.test(css) ? ok("progress-check >= 44px target") : fail("progress-check 44px rule missing");
  /:focus-visible/.test(css) ? ok("focus-visible styles present") : fail("focus-visible styles missing");
}

// 5. JS file present
existsSync(join(ROOT, "assets/curriculum-top1.js")) ? ok("curriculum-top1.js present") : fail("curriculum-top1.js missing");

// report
console.log("curriculum-top1 validation");
oks.forEach((m) => console.log("  PASS " + m));
fails.forEach((m) => console.log("  FAIL " + m));
console.log(`\n${oks.length} passed, ${fails.length} failed`);
process.exit(fails.length ? 1 : 0);
