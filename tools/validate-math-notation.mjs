#!/usr/bin/env node
/* =============================================================================
 * validate-math-notation — student-facing math is typeset one way.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * docs/style-guide.md section 3 says minus is U+2212, multiplication is the
 * times sign, quantities join their unit with a no-break space, thousands take a
 * comma. A census of the 84 core configs (tools/report-copy-scan.mjs) found the
 * opposite in the DATA: ~2,900 hyphen-minus signs, ~150 letter-x multiplication
 * signs, ~5,500 number-unit pairs with an ordinary space, ~80 numbers without a
 * thousands comma. Lesson data stays plain text on purpose (answers are typed
 * and compared as plain text), so the fix is a render-time formatter,
 * engine/core/math-typography.js.
 *
 * THE CHECK
 * A formatter nobody tests is a promise. So this gate runs EVERY student-facing
 * string in the 84 core configs through the formatter and then asks the
 * independent detectors in tools/lib/copy-scan.mjs whether any violation
 * survives. It also proves the formatter is safe:
 *   - idempotent (typeset twice == typeset once)
 *   - it never changes a number: the digits are the same before and after
 *     (thousands commas aside)
 *   - the two render entry points the engine uses (stackContent, renderMathText)
 *     really apply it
 * A rule the formatter cannot fix (money with one decimal, a decimal comma) is
 * reported from the data directly.
 *
 * Exceptions live in data/math-notation-review.json with a 40+ character reason;
 * an entry that no longer fires FAILS. A sweep of too few strings FAILS.
 *
 *   node tools/validate-math-notation.mjs
 *   node tools/validate-math-notation.mjs --root <dir> --formatter <module> --min-strings 1
 * ========================================================================== */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collectTexts, loadCoreConfigs, plain, scanNotation } from "./lib/copy-scan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? fallback : args[i + 1];
};
const ROOT = resolve(opt("root", join(HERE, "..")));
const FORMATTER = resolve(opt("formatter", join(HERE, "..", "engine/core/math-typography.js")));
const MIN_STRINGS = Number(opt("min-strings", 30000));
const MIN_CONFIGS = Number(opt("min-configs", 80));
const REVIEW = resolve(opt("review", join(ROOT, "data/math-notation-review.json")));
const usingEngineFormatter = !args.includes("--formatter");

const failures = [];
const fail = (msg) => failures.push(msg);

// --- 1. Self-test the detectors: a detector that stopped firing reports a clean site.
const SELF = [
  ["minus-spaced", "Compute 36 - 20 = 16", true],
  ["minus-spaced", "Pages 5-10 and 2026-10-27", false],
  ["minus-negative", "The temperature fell to -12 degrees", true],
  ["minus-negative", "Use the x-axis and a 3-digit number", false],
  ["multiply-x", "3 x 4 = 12", true],
  ["multiply-x", "Plot the x-axis and 2x + 1", false],
  ["multiply-star", "3 * 4 = 12", true],
  ["divide-slash-spaced", "24 / 4 = 6", true],
  ["divide-slash-spaced", "$7 / 10%", false],
  ["number-unit-space", "a 12 ft fence", true],
  ["number-unit-space", "Put 5 in a row, or 1/3 mile", false],
  ["percent-space", "about 35 % of 40", true],
  ["thousands-no-comma", "It costs 1500 dollars", true],
  ["thousands-no-comma", "In 2024, room 1204", false],
  ["money-one-decimal", "It costs $4.5 today", true],
  ["money-one-decimal", "a $2.5M budget", false],
];
for (const [rule, text, shouldFire] of SELF) {
  const fired = scanNotation(text, "en").some((h) => h.rule === rule);
  if (fired !== shouldFire) {
    console.error(
      `SELF-TEST FAILED: ${rule} on ${JSON.stringify(text)} should ${shouldFire ? "fire" : "stay quiet"}`,
    );
    process.exit(1);
  }
}

// --- 2. Load the formatter under test.
if (!existsSync(FORMATTER)) {
  console.error(`validate-math-notation: formatter not found at ${FORMATTER}`);
  process.exit(1);
}
const formatterModule = await import(pathToFileURL(FORMATTER).href);
const { typesetPlain } = formatterModule;
if (typeof typesetPlain !== "function") {
  console.error("validate-math-notation: the formatter module must export typesetPlain(text)");
  process.exit(1);
}

// --- 3. Review (documented exceptions).
let reviewed = [];
if (existsSync(REVIEW)) {
  const doc = JSON.parse(readFileSync(REVIEW, "utf8"));
  reviewed = doc.reviewed || [];
  for (const [i, r] of reviewed.entries()) {
    if (!r.file || !r.path || !r.rule) fail(`review entry ${i} needs file, path and rule`);
    if (String(r.reason || "").length < 40) {
      fail(
        `review entry ${i} (${r.file}${r.path}): the reason must be 40+ characters, it explains why the text is right as written`,
      );
    }
  }
}
const used = new Set();

// --- 4. Sweep.
const digitsOf = (s) => (s.replace(/,/g, "").match(/\d+/g) || []).join("|");
const configs = loadCoreConfigs(ROOT);
let scanned = 0;
const rawByRule = {};
const afterByRule = {};
const samples = [];
for (const { file, cfg } of configs) {
  for (const t of collectTexts(cfg)) {
    scanned++;
    const text = String(t.text);
    for (const h of scanNotation(text, t.lang)) rawByRule[h.rule] = (rawByRule[h.rule] || 0) + 1;

    const once = typesetPlain(text);
    if (typesetPlain(once) !== once) {
      fail(`formatter is not idempotent on ${file}${t.path}: ${JSON.stringify(text.slice(0, 80))}`);
    }
    if (digitsOf(once) !== digitsOf(text)) {
      fail(`formatter changed a number on ${file}${t.path}: ${JSON.stringify(text.slice(0, 80))}`);
    }
    for (const h of scanNotation(once, t.lang)) {
      const key = `${file}|${t.path}|${h.rule}`;
      const ex = reviewed.findIndex((r) => `${r.file}|${r.path}|${r.rule}` === key);
      if (ex >= 0) {
        used.add(ex);
        continue;
      }
      afterByRule[h.rule] = (afterByRule[h.rule] || 0) + 1;
      if (samples.length < 25) {
        const p = plain(once);
        samples.push(
          `${file}${t.path} [${h.rule}] ...${p.slice(Math.max(0, h.index - 25), h.index + h.match.length + 25)}...`,
        );
      }
    }
  }
}
reviewed.forEach((r, i) => {
  if (!used.has(i))
    fail(`stale review entry ${r.file}${r.path} [${r.rule}]: it no longer fires, so delete it`);
});

if (configs.length < MIN_CONFIGS)
  fail(
    `only ${configs.length} lesson configs were read (need at least ${MIN_CONFIGS}): a sweep that finds nothing has verified nothing`,
  );
if (scanned < MIN_STRINGS)
  fail(
    `only ${scanned} strings were scanned (need at least ${MIN_STRINGS}): a sweep that finds nothing has verified nothing`,
  );

// --- 5. The engine entry points really apply the formatter.
if (usingEngineFormatter) {
  const { renderMathText } = formatterModule;
  const rendered = renderMathText("2 x 3 = 6 and 8 - 5 = 3 in 12 ft");
  if (!rendered.includes("×") || !rendered.includes("−") || !rendered.includes("12 ft")) {
    fail(`renderMathText did not typeset: ${rendered}`);
  }
  // The engine under test is always this checkout's, even when --root points at a fixture.
  const { stackContent } = await import(
    pathToFileURL(join(HERE, "..", "engine/core/i18n.js")).href
  );
  const stacked = stackContent("2 x 3 = 6 and 8 - 5 = 3", "");
  if (!stacked.includes("×") || !stacked.includes("−")) {
    fail(
      `stackContent (the bilingual renderer almost every component uses) did not typeset: ${stacked}`,
    );
  }
}

const rawTotal = Object.values(rawByRule).reduce((a, b) => a + b, 0);
const afterTotal = Object.values(afterByRule).reduce((a, b) => a + b, 0);
console.log(`validate-math-notation: ${scanned} strings in ${configs.length} lesson configs`);
console.log(`  in the data (plain text, by design): ${rawTotal} notation items`);
for (const [r, n] of Object.entries(rawByRule).sort()) console.log(`      ${r.padEnd(22)} ${n}`);
console.log(
  `  after the render-time formatter:     ${afterTotal} violations${reviewed.length ? `, ${used.size} documented exception(s)` : ""}`,
);
for (const [r, n] of Object.entries(afterByRule).sort()) console.log(`      ${r.padEnd(22)} ${n}`);
for (const s of samples) failures.push(`survives rendering: ${s}`);

if (failures.length) {
  console.error(`\nFAIL validate-math-notation (${failures.length})`);
  for (const f of failures.slice(0, 40)) console.error(`  - ${f}`);
  if (failures.length > 40) console.error(`  ... and ${failures.length - 40} more`);
  process.exit(1);
}
console.log("PASS validate-math-notation");
