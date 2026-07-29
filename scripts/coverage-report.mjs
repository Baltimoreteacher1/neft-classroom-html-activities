#!/usr/bin/env node
/*
 * coverage-report.mjs — standards x content-type matrix from data/content-graph.json.
 * Flags standards with no level-0 support, no enrichment, or no content at all.
 * Writes data/content-coverage.json and prints a summary table.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const graph = JSON.parse(readFileSync(join(root, "data/content-graph.json"), "utf8"));
const tax = JSON.parse(readFileSync(join(root, "data/standards-taxonomy.json"), "utf8"));

const rows = [];
const gaps = [];
for (const s of tax.standards) {
  const urls = graph.byStandard[s.id] || [];
  const levels = { 0: 0, 1: 0, 2: 0 };
  urls.forEach((u) => {
    const e = graph.byUrl[u];
    if (e) levels[e.level] = (levels[e.level] || 0) + 1;
  });
  const total = urls.length;
  const flags = [];
  if (total === 0) flags.push("NO_CONTENT");
  if (levels[0] === 0) flags.push("no-level-0");
  if (levels[2] === 0) flags.push("no-enrichment");
  rows.push({
    standard: s.id,
    domain: s.domain,
    total,
    l0: levels[0],
    l1: levels[1],
    l2: levels[2],
    flags,
  });
  if (flags.length) gaps.push({ standard: s.id, label: s.label, flags });
}

writeFileSync(
  join(root, "data/content-coverage.json"),
  JSON.stringify({ generated: new Date().toISOString(), rows, gaps }, null, 1),
);

console.log("\nSTANDARD      TOT  L0  L1  L2  FLAGS");
rows.forEach((r) => {
  console.log(
    r.standard.padEnd(13) +
      String(r.total).padStart(3) +
      String(r.l0).padStart(4) +
      String(r.l1).padStart(4) +
      String(r.l2).padStart(4) +
      "  " +
      r.flags.join(","),
  );
});
console.log(
  `\n${gaps.length} standards have coverage gaps. Full report: data/content-coverage.json`,
);
