#!/usr/bin/env node
/**
 * Back-fill small-group / catch-up vocabulary that the generator used to drop.
 *
 * `generate-small-group-lessons.mjs` sliced the base lesson's vocabulary to the
 * first 4 terms, so 1–3 authored terms per lesson never reached a variant config
 * even after the renderer's display cap was raised to 8. The generator now slices
 * to 8; this script brings the already-generated configs up to the same state
 * WITHOUT a full regeneration (which would pull unrelated base drift).
 *
 * Append-only: existing terms keep their order and content, and nothing is
 * added beyond the base lesson's own authored list.
 *
 *   node tools/backfill-variant-vocabulary.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";

const LIMIT = 8;
const dryRun = process.argv.includes("--dry-run");

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const termKey = (entry) =>
  String(entry?.term || "")
    .trim()
    .toLowerCase();

let changed = 0;
let added = 0;
const skipped = [];

const dirs = fs
  .readdirSync("lessons", { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /-(group1|group2)$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

for (const dir of dirs) {
  const file = path.join("lessons", dir, "config.json");
  const baseId = dir.replace(/-(group1|group2)$/, "");
  const baseFile = path.join("lessons", baseId, "config.json");
  if (!fs.existsSync(file) || !fs.existsSync(baseFile)) {
    skipped.push(dir);
    continue;
  }
  const raw = fs.readFileSync(file, "utf8");
  const config = JSON.parse(raw);
  const base = readJson(baseFile);
  const current = Array.isArray(config.vocabulary) ? config.vocabulary : [];
  const have = new Set(current.map(termKey));
  const next = current.slice();
  for (const entry of base.vocabulary || []) {
    if (next.length >= LIMIT) break;
    const key = termKey(entry);
    if (!key || have.has(key)) continue;
    have.add(key);
    next.push(entry);
  }
  if (next.length === current.length) continue;
  added += next.length - current.length;
  config.vocabulary = next;
  const out = `${JSON.stringify(config, null, 2)}\n`;
  if (out !== raw) {
    if (!dryRun) fs.writeFileSync(file, out);
    changed += 1;
  }
}

console.log(`configs updated ${changed}, terms restored ${added}${dryRun ? " (dry run)" : ""}`);
if (skipped.length) console.log(`skipped (no base config): ${skipped.join(", ")}`);
