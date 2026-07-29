#!/usr/bin/env node
/**
 * Merge authored practice enrichment (Spanish stems, hint ladders, per-distractor
 * feedback, explanations) into lesson configs.
 *
 * Source of truth is the BASE lesson config: every small-group / catch-up variant
 * copies its `practice.*` bank verbatim from a base lesson, so enriching the base
 * and then propagating by item identity reaches all 148 variants plus the 64
 * flagship lessons without a full regeneration.
 *
 * Join strategy: a sidecar's `items[i]` corresponds to the i-th item, in tier
 * order, that had a content gap. That gap list is recomputed here from the config
 * itself rather than trusted from the sidecar, because several item types
 * (error-analysis, drag-sort, matching-game, fill-table, open-response) carry no
 * `stem` at all and cannot be keyed by one.
 *
 * Strictly additive: a field is only written when it is missing or blank. No
 * authored English is ever overwritten, and no item is added, removed, or
 * reordered.
 *
 *   node tools/merge-practice-enrichment.mjs <sidecarDir> [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";

const TIERS = ["approaching", "onLevel", "extending", "optional"];
const [, , sidecarDir, ...flags] = process.argv;
const dryRun = flags.includes("--dry-run");
// Wave 1 work orders shipped only `stem` as context, so items whose prompt lives
// in `title`/`workedExample`/`instructions`/`columns` (error-analysis, drag-sort,
// fill-table, matching-game, …) were authored without the author ever seeing the
// question. Their content is not trustworthy; skip it and re-author with context.
const requireStem = flags.includes("--require-stem");
// `--work-dir <dir>`: resolve a sidecar's `gapIndex` through the work order it
// was authored against, then locate the live item by a fingerprint of its
// immutable fields. Needed once an earlier wave has already filled gaps — the
// recomputed gap list shrinks and raw indices no longer line up. Enrichment is
// purely additive, so the immutable core is unchanged and matches exactly.
const workDir = (() => {
  const at = flags.indexOf("--work-dir");
  return at >= 0 ? flags[at + 1] : null;
})();
const ENRICHMENT_KEYS = new Set([
  "stemEs",
  "explanation",
  "explanationEs",
  "hints",
  "hintsEs",
  "hint",
  "hintEs",
  "titleEs",
  "choiceFeedback",
]);
function fingerprint(item) {
  const core = {};
  for (const key of Object.keys(item || {}).sort()) {
    if (!ENRICHMENT_KEYS.has(key)) core[key] = item[key];
  }
  return JSON.stringify(core);
}
if (!sidecarDir) {
  console.error("usage: merge-practice-enrichment.mjs <sidecarDir> [--dry-run]");
  process.exit(2);
}

const problems = [];
const stats = {
  sidecars: 0,
  stemEs: 0,
  titleEs: 0,
  hints: 0,
  hintsEs: 0,
  explanation: 0,
  explanationEs: 0,
  choiceFeedback: 0,
  baseFiles: 0,
  variantFiles: 0,
  propagated: 0,
  withheld: 0,
};

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const isBlank = (value) => value == null || String(value).trim() === "";
/** Same identity the engine uses in `collectPracticeItems`. */
const _identity = (item) => item?.stem || item?.title || JSON.stringify(item ?? {}).slice(0, 120);

/** Fields still missing on an authored item — mirrors the extraction pass. */
function gapsFor(item) {
  const needs = {};
  if (isBlank(item.stemEs)) needs.stemEs = true;
  if (isBlank(item.explanation)) needs.explanation = true;
  else if (isBlank(item.explanationEs)) needs.explanationEs = true;
  const hasHints = Array.isArray(item.hints) ? item.hints.length > 0 : !isBlank(item.hint);
  if (!hasHints) needs.hints = true;
  if (item.type === "multiple-choice") {
    const choices = item.choices || [];
    const feedback = item.choiceFeedback || [];
    const blanks = choices
      .map((_, index) => index)
      .filter((index) => index !== item.correctIndex && isBlank(feedback[index]));
    if (blanks.length) needs.choiceFeedback = blanks;
  }
  return Object.keys(needs).length ? needs : null;
}

/** Ordered list of gap items in a config, tier by tier. */
function gapList(config) {
  const out = [];
  for (const tier of TIERS) {
    for (const item of config.practice?.[tier] || []) {
      if (item && gapsFor(item)) out.push(item);
    }
  }
  return out;
}

/** Apply one sidecar entry to one authored item. Returns the fields written. */
function applyEntry(item, entry) {
  const written = [];
  if (isBlank(item.stemEs) && !isBlank(entry.stemEs)) {
    item.stemEs = entry.stemEs;
    written.push("stemEs");
  }
  // error-analysis cards carry their prompt in `title`; the renderer falls back
  // to `titleEs` when there is no `stemEs`, so this is their Spanish lane.
  if (!isBlank(item.title) && isBlank(item.titleEs) && !isBlank(entry.titleEs)) {
    item.titleEs = entry.titleEs;
    written.push("titleEs");
  }
  if (isBlank(item.explanation) && !isBlank(entry.explanation)) {
    item.explanation = entry.explanation;
    written.push("explanation");
  }
  if (!isBlank(item.explanation) && isBlank(item.explanationEs) && !isBlank(entry.explanationEs)) {
    item.explanationEs = entry.explanationEs;
    written.push("explanationEs");
  }
  const hasHints = Array.isArray(item.hints) ? item.hints.length > 0 : !isBlank(item.hint);
  if (!hasHints && Array.isArray(entry.hints) && entry.hints.length) {
    item.hints = entry.hints.slice();
    written.push("hints");
    if (Array.isArray(entry.hintsEs) && entry.hintsEs.length === entry.hints.length) {
      item.hintsEs = entry.hintsEs.slice();
      written.push("hintsEs");
    }
  }
  if (
    item.type === "multiple-choice" &&
    Array.isArray(item.choices) &&
    Array.isArray(entry.choiceFeedback)
  ) {
    const next = item.choices.map((_, index) => {
      const existing = item.choiceFeedback?.[index];
      if (!isBlank(existing)) return existing;
      if (index === item.correctIndex) return "";
      const authored = entry.choiceFeedback[index];
      return isBlank(authored) ? "" : String(authored);
    });
    if (JSON.stringify(next) !== JSON.stringify(item.choiceFeedback || [])) {
      item.choiceFeedback = next;
      written.push("choiceFeedback");
    }
  }
  return written;
}

const writeConfig = (file, config, raw) => {
  const next = `${JSON.stringify(config, null, 2)}\n`;
  if (next === raw) return false;
  if (!dryRun) fs.writeFileSync(file, next);
  return true;
};

// ── Pass 1: enrich the base lesson configs ────────────────────────────────
/** fingerprint -> enriched item, used to propagate into every variant.
 *  Keyed on the immutable core so the lookup is stable before/after enrichment. */
const enriched = new Map();

for (const name of fs.readdirSync(sidecarDir).sort()) {
  if (!name.endsWith(".json")) continue;
  const lessonId = name.replace(/\.json$/, "");
  const baseFile = path.join("lessons", lessonId, "config.json");
  if (!fs.existsSync(baseFile)) {
    problems.push(`${lessonId}: no base config`);
    continue;
  }
  let sidecar;
  try {
    sidecar = readJson(path.join(sidecarDir, name));
  } catch (error) {
    problems.push(`${name}: unparseable JSON — ${error.message}`);
    continue;
  }
  if (!Array.isArray(sidecar.items)) {
    problems.push(`${name}: missing items[]`);
    continue;
  }
  const raw = fs.readFileSync(baseFile, "utf8");
  const config = JSON.parse(raw);
  const gaps = gapList(config);
  // Wave 2 sidecars carry an explicit `gapIndex` (they cover only a subset of
  // the gap list); wave 1 sidecars are a positional 1:1 cover.
  const indexed = sidecar.items.every((entry) => Number.isInteger(entry?.gapIndex));
  if (!indexed && gaps.length !== sidecar.items.length) {
    problems.push(
      `${lessonId}: sidecar has ${sidecar.items.length} entries but ${gaps.length} items need content — skipped`,
    );
    continue;
  }
  stats.sidecars += 1;
  let pairs;
  if (indexed && workDir) {
    // Resolve gapIndex through the work order, then match the live item by the
    // fingerprint of its immutable fields.
    const orderFile = path.join(workDir, `${lessonId}.json`);
    if (!fs.existsSync(orderFile)) {
      problems.push(`${lessonId}: no work order in ${workDir}`);
      continue;
    }
    const byGapIndex = new Map(
      (readJson(orderFile).items || []).map((entry) => [entry.gapIndex, entry.item]),
    );
    const live = new Map();
    for (const tier of TIERS) {
      for (const item of config.practice?.[tier] || []) {
        if (item) live.set(fingerprint(item), item);
      }
    }
    pairs = sidecar.items.map((entry) => {
      const source = byGapIndex.get(entry.gapIndex);
      return [source ? live.get(fingerprint(source)) : null, entry];
    });
  } else if (indexed) {
    pairs = sidecar.items.map((entry) => [gaps[entry.gapIndex], entry]);
  } else {
    pairs = gaps.map((item, index) => [item, sidecar.items[index]]);
  }
  for (const [item, entry] of pairs) {
    if (!item) {
      problems.push(`${lessonId}: gapIndex ${entry?.gapIndex} out of range (${gaps.length} gaps)`);
      continue;
    }
    // Position is still consumed so the join stays aligned — only the write is
    // withheld for items the author could not see.
    if (requireStem && isBlank(item.stem)) {
      stats.withheld += 1;
      continue;
    }
    for (const field of applyEntry(item, entry)) stats[field] += 1;
    enriched.set(fingerprint(item), item);
  }
  if (writeConfig(baseFile, config, raw)) stats.baseFiles += 1;
}

// ── Pass 2: propagate the same enrichment into every variant config ───────
const variantDirs = fs
  .readdirSync("lessons", { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /-(group1|group2|catchup)$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

for (const dir of variantDirs) {
  const file = path.join("lessons", dir, "config.json");
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, "utf8");
  const config = JSON.parse(raw);
  let touched = false;
  for (const tier of TIERS) {
    for (const item of config.practice?.[tier] || []) {
      const source = enriched.get(fingerprint(item));
      if (!source) continue;
      // Reuse the same additive rules so a variant that already has content
      // (or diverged from its base) is never overwritten.
      const written = applyEntry(item, source);
      if (written.length) {
        touched = true;
        stats.propagated += written.length;
      }
    }
  }
  if (touched && writeConfig(file, config, raw)) stats.variantFiles += 1;
}

console.log(
  [
    `sidecars merged    ${stats.sidecars}`,
    `enriched items     ${enriched.size}`,
    `base configs       ${stats.baseFiles}`,
    `variant configs    ${stats.variantFiles} (${stats.propagated} fields propagated)`,
    "",
    `stemEs written     ${stats.stemEs}`,
    `titleEs written    ${stats.titleEs}`,
    `hints written      ${stats.hints} (es ${stats.hintsEs})`,
    `explanation        ${stats.explanation} (es ${stats.explanationEs})`,
    `choiceFeedback     ${stats.choiceFeedback}`,
    `withheld (no stem) ${stats.withheld}`,
    dryRun ? "\n(dry run — nothing written)" : "",
  ].join("\n"),
);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems.slice(0, 25)) console.error(`  - ${problem}`);
  process.exit(1);
}
