#!/usr/bin/env node
/* =============================================================================
 * fix-copy-config — the ONLY way copy in a lesson config is changed for style.
 * -----------------------------------------------------------------------------
 * Most notation (minus, times, divide, no-break spaces, thousands commas) is
 * fixed at render time by engine/core/math-typography.js, so lesson data stays
 * plain text. What cannot be fixed at render time, and is unambiguous, is fixed
 * here:
 *
 *   term-variant         "coordinate pair" -> "ordered pair", "lowest terms" ->
 *                        "simplest form" (the enforced rows of
 *                        engine/core/copy-dictionary.js TERMS)
 *   multiple-exclamations  a string with more than one "!" keeps only the last
 *
 * Guarantees, checked per change and aborting the change if any fails:
 *   - only a student-facing prose string changes (never an answer key, a
 *     `choices` option, an id or a number): correctIndex / answers are untouched
 *   - every digit sequence is identical before and after
 *   - English strings only, so Spanish parity cannot move
 *   - the file is edited by exact string replacement, never re-serialised, so the
 *     diff is the change and nothing else
 *
 * Every change is appended to docs/copy-change-log.md (file, field, before,
 * after). Dry run by default.
 *
 *   node scripts/fix-copy-config.mjs            report only
 *   node scripts/fix-copy-config.mjs --write    apply and log
 * ========================================================================== */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TERMS } from "@eduwonderlab/engine/core/copy-dictionary.js";
import { collectTexts, loadCoreConfigs } from "../tools/lib/copy-scan.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");
const LOG = join(ROOT, "docs/copy-change-log.md");

const digits = (s) => (String(s).match(/\d+/g) || []).join(",");

/** Match the capital of the word being replaced; fix "a" -> "an" before a vowel. */
function replaceTerm(text, variantRe, preferred) {
  const flags = `${variantRe.flags.replace("g", "")}g`;
  const cap = (word, matched) =>
    /^[A-Z]/.test(matched) ? word[0].toUpperCase() + word.slice(1) : word;
  const vowel = /^[aeiou]/i.test(preferred);
  // "a coordinate pair" -> "an ordered pair": the article agrees with the new word.
  const withArticle = new RegExp(`\\b([Aa]) (?:${variantRe.source})`, flags);
  const first = text.replace(
    withArticle,
    (m, a) => `${a}${vowel ? "n" : ""} ${cap(preferred, m.slice(2))}`,
  );
  return first.replace(new RegExp(variantRe.source, flags), (m) => cap(preferred, m));
}

function fixOne(entry) {
  let after = entry.text;
  const reasons = [];
  for (const t of TERMS) {
    if (!t.enforce) continue;
    for (const v of t.variants) {
      if (v.test(after)) {
        after = replaceTerm(after, v, t.preferred);
        reasons.push("term-variant");
      }
    }
  }
  const ex = (after.match(/!/g) || []).length;
  if (ex > 1) {
    const last = after.lastIndexOf("!");
    after = after.slice(0, last).replace(/!/g, ".") + after.slice(last);
    reasons.push("multiple-exclamations");
  }
  return after === entry.text ? null : { after, reasons: [...new Set(reasons)] };
}

const changes = [];
const skipped = [];
const filesTouched = new Map();

for (const { id, file, cfg } of loadCoreConfigs(ROOT)) {
  const abs = join(ROOT, file);
  let raw = readFileSync(abs, "utf8");
  const perString = new Map(); // before -> {after, paths:[], reasons}
  for (const t of collectTexts(cfg)) {
    if (t.lang !== "en") continue;
    const fix = fixOne(t);
    if (!fix) continue;
    if (t.kind === "choice") {
      skipped.push({ file, path: t.path, why: "choices option left as authored", text: t.text });
      continue;
    }
    if (digits(t.text) !== digits(fix.after)) {
      skipped.push({ file, path: t.path, why: "digits would change", text: t.text });
      continue;
    }
    const rec = perString.get(t.text) || { after: fix.after, reasons: fix.reasons, paths: [] };
    rec.paths.push(t.path);
    perString.set(t.text, rec);
  }
  for (const [before, rec] of perString) {
    const needle = JSON.stringify(before).slice(1, -1);
    const replacement = JSON.stringify(rec.after).slice(1, -1);
    // Every raw occurrence must be one we are changing, or we stop: the same
    // sentence in an answer-key field must not be edited by accident.
    const occurrences = raw.split(needle).length - 1;
    const seenInConfig = JSON.stringify(cfg).split(JSON.stringify(before)).length - 1;
    if (occurrences !== rec.paths.length || seenInConfig !== rec.paths.length) {
      skipped.push({
        file,
        path: rec.paths.join(", "),
        why: `string occurs ${occurrences}x in the file but ${rec.paths.length}x as student prose`,
        text: before,
      });
      continue;
    }
    raw = raw.split(needle).join(replacement);
    for (const path of rec.paths) {
      changes.push({ file, id, path, rule: rec.reasons.join("+"), before, after: rec.after });
    }
    filesTouched.set(file, raw);
  }
}

for (const c of changes) {
  console.log(
    `${WRITE ? "CHANGE" : "WOULD CHANGE"} ${c.file}${c.path} [${c.rule}]\n    - ${c.before.slice(0, 160)}\n    + ${c.after.slice(0, 160)}`,
  );
}
for (const s of skipped) console.log(`SKIPPED ${s.file}${s.path}: ${s.why}`);
console.log(
  `\n${changes.length} change(s) in ${filesTouched.size} file(s); ${skipped.length} skipped`,
);

if (WRITE && changes.length) {
  for (const [file, raw] of filesTouched) writeFileSync(join(ROOT, file), raw);
  const header = existsSync(LOG)
    ? ""
    : "# Copy change log\n\nEvery edit `scripts/fix-copy-config.mjs --write` makes to a lesson config, in the order made. Fields are English prose only; no answer key, `choices` option, `correctIndex` or digit was changed. Notation (minus, times, divide, no-break spaces, thousands commas) is typeset at render time by `engine/core/math-typography.js` and is not edited in lesson data.\n";
  const run = [
    `\n## Run ${new Date().toISOString().slice(0, 10)}\n`,
    "| File | Field | Rule | Before | After |",
    "|---|---|---|---|---|",
  ];
  const cell = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
  for (const c of changes)
    run.push(
      `| ${c.file} | \`${c.path.replace(/^\./, "")}\` | ${c.rule} | ${cell(c.before)} | ${cell(c.after)} |`,
    );
  appendFileSync(LOG, `${header}${run.join("\n")}\n`);
  console.log(`logged to ${LOG}`);
}
