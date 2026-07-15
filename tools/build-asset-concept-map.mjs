#!/usr/bin/env node
// =============================================================================
// build-asset-concept-map.mjs — the "second brain" join surface (Build B).
//
// Joins data/catalog.json (every asset, by standard + category) against
// data/ccss-standards.json (the standards source of truth that lesson configs
// validate against — `npm run validate:ccss`) to produce an INVERSE index:
// standard -> all assets, across every category, that teach it.
//
// This is the other half of the Insight Signal join. Insight Signal answers
// "which standard is this student weak on?"; this map answers "which of my own
// assets already address that standard?" — powering Resource Finder and the
// cross-type links in Insight Brief.
//
// GENERATED — do not hand-edit data/asset-concept-map.json. Re-run after adding
// assets, re-coding standards, or editing overrides:
//   node tools/build-asset-concept-map.mjs   (npm run generate-asset-concept-map)
//
// How an asset gets a standard (in priority order), and its `via` badge:
//   - "direct" — the asset's own config carries the standard (lessons, readiness).
//   - "manual" — a human-curated tag in data/asset-standard-overrides.json
//                (the ONLY hand-authored tags; for games/tools/topic practice).
//   - "unit"   — a Unit Project inherits the standards taught in its unit
//                (from data/curriculum-manifest.json). Honest unit-level match.
//
// Honesty guarantees:
//   - Standards come only from ccss-standards.json; the builder never invents a
//     code. Games/tools with no config standard, no override, and no unit stay
//     ORPHANS (reported), not fabricated.
//   - `misconceptions` is an enrichment slot, intentionally EMPTY until tagged.
// =============================================================================
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(resolve(root, p), "utf8"));
const readOptional = (p, fallback) => {
  try {
    return read(p);
  } catch {
    return fallback;
  }
};

const catalog = read("data/catalog.json");
const ccss = read("data/ccss-standards.json");
const manifest = readOptional("data/curriculum-manifest.json", { lessons: [] });
const overridesDoc = readOptional("data/asset-standard-overrides.json", { overrides: {} });

const domains = ccss.domains || {};
const ccssStandards = ccss.standards || {}; // { "6.AT.1": { domain, cluster, topic, shortLabel, fullText } }
const overrides = overridesDoc.overrides || {}; // { "/path/": ["6.AT.1", ...] }

// Unit -> Set(standard codes), from the lessons in that unit.
const unitStandards = {};
for (const l of manifest.lessons || []) {
  if (l && l.unit != null && l.standard) {
    (unitStandards[l.unit] = unitStandards[l.unit] || new Set()).add(l.standard);
  }
}

const byStandard = {};
const orphans = [];
const categoryCoverage = {}; // category -> { total, tagged }

const bucketFor = (code) => {
  const meta = ccssStandards[code];
  return (byStandard[code] = byStandard[code] || {
    standard: code,
    label: meta ? meta.shortLabel : "",
    fullText: meta ? meta.fullText : "",
    domain: meta ? domains[meta.domain] || meta.domain : "",
    cluster: meta ? meta.cluster : "",
    topic: meta ? meta.topic : "",
    matched: Boolean(meta), // false = code not found in the ccss SoT
    misconceptions: [], // enrichment slot — populated later, never fabricated here
    assets: [],
  });
};

for (const e of catalog.entries || []) {
  const asset = {
    title: e.title,
    path: e.path,
    category: e.category,
    audience: e.audience,
    unit: e.unit,
  };
  const cat = e.category || "Uncategorized";
  const cov = (categoryCoverage[cat] = categoryCoverage[cat] || { total: 0, tagged: 0 });
  cov.total += 1;

  // Resolve this asset's (code, via) assignments in priority order.
  let assignments = [];
  const direct = String(e.standard || "").trim();
  const override = overrides[e.path];
  if (direct) {
    assignments = [{ code: direct, via: "direct" }];
  } else if (Array.isArray(override) && override.length) {
    assignments = override.map((code) => ({ code: String(code).trim(), via: "manual" }));
  } else if (cat === "Project" && e.unit != null && unitStandards[e.unit]) {
    assignments = [...unitStandards[e.unit]].map((code) => ({ code, via: "unit" }));
  }

  if (!assignments.length) {
    orphans.push(asset);
    continue;
  }
  cov.tagged += 1;
  for (const { code, via } of assignments) {
    bucketFor(code).assets.push({ ...asset, via });
  }
}

const VIA_ORDER = { direct: 0, manual: 1, unit: 2 };
const sortAssets = (a, b) =>
  (VIA_ORDER[a.via] ?? 9) - (VIA_ORDER[b.via] ?? 9) ||
  String(a.category || "").localeCompare(b.category || "") ||
  String(a.title || "").localeCompare(b.title || "");
for (const b of Object.values(byStandard)) b.assets.sort(sortAssets);
orphans.sort(
  (a, b) =>
    String(a.category || "").localeCompare(b.category || "") ||
    String(a.title || "").localeCompare(b.title || ""),
);

const coveredStandards = Object.keys(byStandard).sort();
const allCodes = Object.keys(ccssStandards);
const uncoveredStandards = allCodes.filter((code) => !byStandard[code]);
const unmatchedCodes = coveredStandards.filter((k) => !byStandard[k].matched);

// Categories present in the catalog that still carry NO standards at all — the
// remaining enrichment gap (add entries to asset-standard-overrides.json).
const untaggedCategories = Object.entries(categoryCoverage)
  .filter(([, c]) => c.tagged === 0)
  .map(([name, c]) => ({ category: name, assets: c.total }));

const sortedByStandard = {};
for (const k of coveredStandards) sortedByStandard[k] = byStandard[k];

const out = {
  generated: new Date().toISOString(),
  note: "GENERATED by tools/build-asset-concept-map.mjs — do not hand-edit. Inverse index: standard -> assets that teach it, across all catalog categories. `via`: direct (asset config) | manual (overrides file) | unit (project inherits unit standards). `misconceptions` is an enrichment slot, intentionally empty until tagged.",
  source: {
    catalog: catalog.total || (catalog.entries || []).length,
    ccssStandards: allCodes.length,
    overrides: Object.keys(overrides).length,
  },
  standardsCovered: coveredStandards.length,
  assetsIndexed: (catalog.entries || []).length - orphans.length,
  uncoveredStandards, // standards with NO asset — the build-gap signal
  unmatchedCodes, // asset codes not present in the ccss SoT (should be empty)
  categoryCoverage, // per category: total vs standard-tagged
  untaggedCategories, // categories that still can't join (add overrides to fix)
  byStandard: sortedByStandard,
  orphans, // assets with no standard, no override, no unit
};

const outPath = "data/asset-concept-map.json";
writeFileSync(resolve(root, outPath), `${JSON.stringify(out, null, 2)}\n`);
console.log(
  `asset-concept-map: ${coveredStandards.length}/${allCodes.length} standards covered, ` +
    `${out.assetsIndexed} assets indexed (${Object.keys(overrides).length} overrides), ` +
    `${uncoveredStandards.length} uncovered, ${unmatchedCodes.length} unmatched, ${orphans.length} orphans -> ${outPath}`,
);
if (untaggedCategories.length) {
  console.log(
    `  enrichment gap — untagged categories: ${untaggedCategories
      .map((c) => `${c.category}(${c.assets})`)
      .join(", ")}  (add tags in data/asset-standard-overrides.json)`,
  );
}
