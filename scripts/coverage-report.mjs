#!/usr/bin/env node
/*
 * coverage-report.mjs — standards x content-type matrix from data/content-graph.json.
 * Flags standards with no level-0 support, no enrichment, or no content at all.
 * Writes data/content-coverage.json and prints a summary table.
 *
 * Three things this report is careful about, because each one used to make it
 * claim more than it knew:
 *
 *  1. standards-taxonomy.json carries one row per OLD (CCSS) standard, and the
 *     crosswalk to the new IDs is many-to-one — 6.RP.A.2 and 6.RP.A.3.B both
 *     became 6.AT.A.2. Emitting a row per taxonomy entry counted the same
 *     standard, with the same content, up to three times. Rows are keyed by the
 *     new ID and the old labels are collected onto it.
 *  2. An activity with no level tag defaults to level 1 in the graph. Counting
 *     those as level-1 support reports "we have support material" where the
 *     truth is "this has never been levelled". They are counted separately as
 *     `untagged`, and `l1` now means level-1 that something actually asserted.
 *  3. Level-0 material tagged FOUNDATIONAL is not attached to any grade-6
 *     standard, so a per-standard view shows zero level-0 everywhere while a
 *     substantial bridge/catch-up library exists. That inventory is reported
 *     alongside, so `no-level-0` reads as "none mapped to this standard"
 *     rather than "none exists".
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const graph = JSON.parse(readFileSync(join(root, "data/content-graph.json"), "utf8"));
const tax = JSON.parse(readFileSync(join(root, "data/standards-taxonomy.json"), "utf8"));

// 1 — collapse the crosswalk collisions, keeping every old label.
const byId = new Map();
for (const s of tax.standards) {
  const existing = byId.get(s.id);
  if (existing) {
    if (s.label && !existing.labels.includes(s.label)) existing.labels.push(s.label);
    if (s.oldId && !existing.oldIds.includes(s.oldId)) existing.oldIds.push(s.oldId);
  } else {
    byId.set(s.id, {
      id: s.id,
      domain: s.domain,
      labels: s.label ? [s.label] : [],
      oldIds: s.oldId ? [s.oldId] : [],
    });
  }
}

const rows = [];
const gaps = [];
for (const s of byId.values()) {
  const urls = graph.byStandard[s.id] || [];
  const levels = { 0: 0, 1: 0, 2: 0 };
  let untagged = 0;
  urls.forEach((u) => {
    const e = graph.byUrl[u];
    if (!e) return;
    // 2 — an unlevelled activity is not evidence of level-1 support.
    if (e.levelTagged === false) untagged += 1;
    else levels[e.level] = (levels[e.level] || 0) + 1;
  });
  const total = urls.length;
  const flags = [];
  if (total === 0) flags.push("NO_CONTENT");
  if (levels[0] === 0) flags.push("no-level-0");
  if (levels[2] === 0) flags.push("no-enrichment");
  // Say so when the picture rests on material nobody has levelled.
  if (untagged > 0 && untagged >= total / 2) flags.push("mostly-unlevelled");
  rows.push({
    standard: s.id,
    domain: s.domain,
    labels: s.labels,
    oldIds: s.oldIds,
    total,
    l0: levels[0],
    l1: levels[1],
    l2: levels[2],
    untagged,
    flags,
  });
  if (flags.length) gaps.push({ standard: s.id, label: s.labels.join(" / "), flags });
}

// 3 — level-0 that exists but is not mapped to a standard.
const unmappedLevel0 = graph.entries.filter(
  (e) => e.level === 0 && e.levelTagged !== false && !byId.has(e.standard),
);
const unmappedLevel0ByStandard = {};
for (const e of unmappedLevel0) {
  (unmappedLevel0ByStandard[e.standard] = unmappedLevel0ByStandard[e.standard] || []).push(e.url);
}

const totals = {
  standards: rows.length,
  taxonomyEntries: tax.standards.length,
  l0: rows.reduce((n, r) => n + r.l0, 0),
  l1: rows.reduce((n, r) => n + r.l1, 0),
  l2: rows.reduce((n, r) => n + r.l2, 0),
  untagged: rows.reduce((n, r) => n + r.untagged, 0),
  graphEntries: graph.total,
  graphUntagged: graph.entries.filter((e) => e.levelTagged === false).length,
  level0Unmapped: unmappedLevel0.length,
};

writeFileSync(
  join(root, "data/content-coverage.json"),
  JSON.stringify(
    { generated: new Date().toISOString(), totals, rows, gaps, unmappedLevel0ByStandard },
    null,
    1,
  ),
);

console.log("\nSTANDARD      TOT  L0  L1  L2  UNL  FLAGS");
rows.forEach((r) => {
  console.log(
    r.standard.padEnd(13) +
      String(r.total).padStart(3) +
      String(r.l0).padStart(4) +
      String(r.l1).padStart(4) +
      String(r.l2).padStart(4) +
      String(r.untagged).padStart(5) +
      "  " +
      r.flags.join(","),
  );
});

console.log(
  `\n${rows.length} distinct standards (from ${totals.taxonomyEntries} taxonomy entries — ` +
    `the crosswalk to the new IDs is many-to-one).`,
);
console.log(
  `${gaps.length} have coverage gaps. Levelled: L0=${totals.l0} L1=${totals.l1} L2=${totals.l2}; ` +
    `${totals.untagged} activities on these standards carry no level tag.`,
);
console.log(
  `Repo-wide, ${totals.graphUntagged} of ${totals.graphEntries} activities are unlevelled.`,
);
if (totals.level0Unmapped) {
  console.log(
    `${totals.level0Unmapped} level-0 activities exist but map to no grade-6 standard ` +
      `(${Object.keys(unmappedLevel0ByStandard).join(", ")}) — "no-level-0" above means ` +
      `none mapped to that standard, not that none exists.`,
  );
}
console.log("Full report: data/content-coverage.json");
