#!/usr/bin/env node
/*
 * build-content-graph.mjs
 * Merges Phase-0 tag output (data/_tagging/merged.json) with the activity registry
 * into data/content-graph.json — the queryable spine the Math Brain reads.
 *
 * Output shape:
 *   {
 *     generated, total, taggedCount,
 *     entries: [ {url,title,type,standard,level,misconceptions,confidence} ],
 *     byUrl: { url: entry },
 *     byStandard: { "6.RP.A.2": [url, ...] },
 *     coverage: { "6.RP.A.2": {Activity:n, Game:n, ...} }
 *   }
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(readFileSync(join(root, "data/registry.json"), "utf8"));
const mergedPath = join(root, "data/_tagging/merged.json");
if (!existsSync(mergedPath)) {
  console.error("Missing data/_tagging/merged.json — run the tagging workflow first.");
  process.exit(1);
}
const merged = JSON.parse(readFileSync(mergedPath, "utf8"));
const tags = Array.isArray(merged) ? merged : merged.merged || [];
const tagByUrl = {};
tags.forEach((t) => (tagByUrl[t.url] = t));

const entries = [];
const byUrl = {};
const byStandard = {};
const coverage = {};
let taggedCount = 0;

for (const a of registry.activities) {
  const t = tagByUrl[a.url] || {};
  const standard = t.standard || a.standard || "MIXED";
  const entry = {
    url: a.url,
    title: a.title,
    type: a.activityType,
    standard,
    level: typeof t.level === "number" ? t.level : 1,
    misconceptions: t.misconceptions || [],
    confidence: typeof t.confidence === "number" ? t.confidence : null,
  };
  if (tagByUrl[a.url]) taggedCount++;
  entries.push(entry);
  byUrl[a.url] = entry;
  (byStandard[standard] = byStandard[standard] || []).push(a.url);
  coverage[standard] = coverage[standard] || {};
  coverage[standard][entry.type] = (coverage[standard][entry.type] || 0) + 1;
}

const out = {
  generated: new Date().toISOString(),
  total: entries.length,
  taggedCount,
  entries,
  byUrl,
  byStandard,
  coverage,
};
writeFileSync(join(root, "data/content-graph.json"), JSON.stringify(out, null, 1));
console.log(`content-graph.json: ${entries.length} entries, ${taggedCount} freshly tagged, ${Object.keys(byStandard).length} standards`);
