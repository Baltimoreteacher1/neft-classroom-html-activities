#!/usr/bin/env node
/**
 * generate-math-finder-index.mjs
 *
 * Builds data/math-finder-index.json — the single source of truth for the
 * student/teacher-facing Math Activities Finder (/math/finder/).
 *
 * It reads data/registry.json (the auto-generated inventory of every page in
 * the repo) and keeps only the Grade 6 MATH activities, normalising each into a
 * compact, search-friendly record:
 *
 *   { title, url, type, unit, strand, standards[], teacher }
 *
 * Why a generated index? The old Finder hand-listed ~22 resources and silently
 * missed ~20 standalone interactive activities. Generating from the registry
 * means the Finder can never drift out of sync again — re-run this whenever the
 * registry changes (npm run generate-math-finder-index).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REGISTRY = join(ROOT, "data", "registry.json");
const OUT = join(ROOT, "data", "math-finder-index.json");

/**
 * Top-level folders that are unambiguously Grade 6 MATH content. The big
 * buckets (math, lessons) carry the bulk; the rest are the standalone
 * interactive activities + math hubs that were previously hard to find.
 */
const MATH_FOLDERS = new Set([
  // core curriculum
  "math",
  "lessons",
  "reveal-math",
  // reusable lesson tools / cross-unit engines
  "math-lab-missions",
  "reveal-evidence-studio",
  "misconception-museum",
  "misconception-lab",
  // artifact sets
  "webquests",
  "hyperdocs",
  // 3D WebGL unit games
  "games",
  // teacher workflow tools (flagged teacher-only in the Finder)
  "teacher-tools",
  "dashboard",
  // review / test prep / bridges
  "mcap-review",
  "spiral-review",
  "end-of-year",
  "summer-bridge",
  "bridge-to-grade-6",
  // standalone interactive activities (the previously-orphaned ones)
  "algebra-balance-scale",
  "cartesian-odyssey",
  "correlation-playground",
  "double-line-racer",
  "expressions-equations",
  "fractions-soccer",
  "geometry-prep",
  "mad-balance-sandbox",
  "neft-data-studio",
  "neft-math-lab-studio",
  "number-system",
  "ratio-color-mixer",
  "ratiolab",
  "ratios-proportions",
  "sports-analytics",
  "starfield-coordinate-defender",
  "statistics-data",
  "surface-area-review",
  "word-to-equations",
  "world-architect-math-project",
  "netfold-3d",
  "netfold-pro",
]);

/**
 * Folder-scoped allowlist: for shared folders that hold both math and non-math
 * content, only these exact sub-paths are math.
 */
const MATH_SUBPATHS = [
  "/activities/architect", // build-and-design challenges, one per unit
  "/activities/thinking-trails-evidence-demo",
];

/** Folders that look mathy by name but are NOT Grade 6 math activities. */
const DENY_FOLDERS = new Set([
  "esol",
  "esol-reading-writing",
  "esol-vocab-scrambler",
  "esol-study-guide",
  "vocab-hub",
  "wida-access",
  "blood-on-the-river",
  "graphic-novels",
  "refugee",
  "futures",
  "living-school",
  "personal",
  "ecology-noam",
  "cosmic-gravity-lab",
  "spectral-waves-lab",
  "forecast-engine",
  "noam-bar-mitzvah",
  "noam-school-v10",
  "neft-school-hub",
]);

function firstSegment(url) {
  return String(url || "").split("/").filter(Boolean)[0] || "";
}

function isMath(entry) {
  const url = entry.url || "";
  const seg = firstSegment(url);
  if (DENY_FOLDERS.has(seg)) return false;
  if (MATH_FOLDERS.has(seg)) return true;
  if (MATH_SUBPATHS.some((p) => url.startsWith(p))) return true;
  return false;
}

const STRAND_BY_PREFIX = {
  NS: "Number System",
  NOS: "Number System",
  RP: "Ratios & Rates",
  EE: "Expressions & Equations",
  AT: "Expressions & Equations",
  G: "Geometry",
  GR: "Geometry",
  SP: "Statistics & Probability",
  DS: "Statistics & Probability",
};

// Match CCSS-style codes anywhere (6.NS.1, 6.EE.C.9, 6.G.1, 6.SP.5a, 6.RP.3) and
// Maryland codes (6.NOS.B.2, 6.AT.D.11, 6.DS, 6.GR).
const STD_RE = /6\.(NS|RP|EE|G|SP|NOS|AT|DS|GR)\.?[A-D]?\.?\d{0,2}[a-d]?/gi;

function extractStandards(entry) {
  STD_RE.lastIndex = 0; // global regex — reset state between calls (defensive)
  const text = `${entry.title || ""} ${entry.standard || ""}`;
  const found = new Set();
  let m;
  while ((m = STD_RE.exec(text)) !== null) {
    found.add(m[0].toUpperCase().replace(/\.$/, ""));
  }
  if (entry.standard) found.add(String(entry.standard).toUpperCase());
  return [...found];
}

function strandFor(standards) {
  for (const s of standards) {
    const prefix = s.split(".")[1];
    if (prefix && STRAND_BY_PREFIX[prefix]) return STRAND_BY_PREFIX[prefix];
  }
  return null;
}

/**
 * Keyword → strand fallback for cross-unit support pages (intervention,
 * manipulatives, remediation, reading) that carry no standard but whose slug or
 * title names a clear topic. Order matters — first match wins. Used only when no
 * standard-derived strand was found; never assigns a unit (these span units).
 */
const STRAND_KEYWORDS = [
  [/ratio|unit[-\s]?rate|\brate(s)?\b|percent|proportion/, "Ratios & Rates"],
  [/expression|equation|inequalit|algebra[-\s]?tile|distributive|variable|exponent|propert/, "Expressions & Equations"],
  [/area|volume|surface|geometry|perimeter|polygon|\bprism|\bnet(s)?\b|trapezoid|triangle/, "Geometry"],
  [/statistic|\bdata\b|\bmean\b|median|\bmode\b|\bmad\b|deviation|histogram|box[-\s]?plot|distribution/, "Statistics & Probability"],
  [/fraction|decimal|integer|number[-\s]?line|place[-\s]?value|factor|multiple|\bprime|\bgcf\b|\blcm\b|coordinate|plotter|divis|whole[-\s]?number|number[-\s]?operations|rational/, "Number System"],
];

function strandFromText(url, title) {
  const text = `${url} ${title}`.toLowerCase();
  for (const [re, strand] of STRAND_KEYWORDS) {
    if (re.test(text)) return strand;
  }
  return null;
}

/** Derive the canonical unit number from the URL where possible. */
function unitFor(url) {
  let m = /\/lessons\/(\d{1,2})-\d/.exec(url);
  if (m) return Number(m[1]);
  m = /\/math\/unit-(\d{1,2})\b/.exec(url);
  if (m) return Number(m[1]);
  m = /\/u(?:nit)?-?(\d{1,2})[-/]/.exec(url); // cluster games: /games/u9-…, /games/3d/unit-10/
  if (m) return Number(m[1]);
  if (/\/math\/statistics\b/.test(url)) return 8;
  return null;
}

/**
 * Curated metadata for standalone interactive activities that carry no standard
 * in the registry and no CCSS code in their title. Keyed by first URL segment.
 * Lets these (previously near-invisible) activities filter by unit/strand too.
 */
const CURATED = {
  "algebra-balance-scale": { unit: 7, strand: "Expressions & Equations", standards: ["6.EE.7"] },
  "word-to-equations": { unit: 7, strand: "Expressions & Equations", standards: ["6.EE.7"] },
  "expressions-equations": { unit: 6, strand: "Expressions & Equations", standards: ["6.EE.2"] },
  "cartesian-odyssey": { unit: 9, strand: "Number System", standards: ["6.NS.6", "6.NS.8"] },
  "starfield-coordinate-defender": { unit: 9, strand: "Number System", standards: ["6.NS.6"] },
  "number-system": { unit: 9, strand: "Number System", standards: ["6.NS.5", "6.NS.6", "6.NS.7"] },
  "ratiolab": { unit: 3, strand: "Ratios & Rates", standards: ["6.RP.2", "6.RP.3"] },
  "double-line-racer": { unit: 3, strand: "Ratios & Rates", standards: ["6.RP.3"] },
  "ratio-color-mixer": { unit: 3, strand: "Ratios & Rates", standards: ["6.RP.3"] },
  "ratios-proportions": { unit: 3, strand: "Ratios & Rates", standards: ["6.RP.1", "6.RP.3"] },
  "fractions-soccer": { unit: 2, strand: "Number System", standards: ["6.NS.1"] },
  "geometry-prep": { unit: 5, strand: "Geometry", standards: ["6.G.1"] },
  "surface-area-review": { unit: 10, strand: "Geometry", standards: ["6.G.4"] },
  "world-architect-math-project": { unit: 5, strand: "Geometry", standards: ["6.G.1", "6.G.2"] },
  "netfold-3d": { unit: 10, strand: "Geometry", standards: ["6.G.4"] },
  "netfold-pro": { unit: 10, strand: "Geometry", standards: ["6.G.4"] },
  "statistics-data": { unit: 8, strand: "Statistics & Probability", standards: ["6.SP.5"] },
  "sports-analytics": { unit: 8, strand: "Statistics & Probability", standards: ["6.SP.5"] },
  "correlation-playground": { unit: 8, strand: "Statistics & Probability", standards: ["6.SP.5"] },
  "mad-balance-sandbox": { unit: 8, strand: "Statistics & Probability", standards: ["6.SP.5"] },
  "neft-data-studio": { unit: 8, strand: "Statistics & Probability", standards: ["6.SP.4", "6.SP.5"] },
};

const TEACHER_FOLDERS = new Set(["teacher-tools", "dashboard"]);
const TEACHER_HINT = /\b(notes|teacher|answer|key|command-center|tracker|dashboard|studio)\b/i;
// Teacher-only content that must NOT surface to students by default: answer
// keys, teacher guides/notes, and anything under a /teacher/ path segment.
const TEACHER_URL_RE = /(\/teacher\/|\/teacher$|\/answer-key(\/|$)|notes-teacher|teacher-(guide|notes))/i;
const TEACHER_TITLE_RE = /\b(answer key|teacher guide|teacher notes|teacher setup|teacher workspace|growth tracker)\b/i;

/** True when an entry is teacher-facing and should be hidden from students by default. */
function isTeacher(seg, type, url, title) {
  return (
    TEACHER_FOLDERS.has(seg) ||
    TEACHER_URL_RE.test(url) ||
    TEACHER_TITLE_RE.test(title || "") ||
    (type === "Tool" && TEACHER_HINT.test(url + " " + (title || "")))
  );
}

const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));
const seen = new Set();
const records = [];

for (const a of registry.activities) {
  if (!isMath(a)) continue;
  const url = a.url;
  if (!url || seen.has(url)) continue;
  seen.add(url);
  const seg = firstSegment(url);
  const curated = CURATED[seg];
  let standards = extractStandards(a);
  let unit = unitFor(url);
  let strand = strandFor(standards);
  if (curated) {
    if (!standards.length) standards = curated.standards;
    if (unit == null) unit = curated.unit;
    if (!strand) strand = curated.strand;
  }
  if (!strand) strand = strandFromText(url, a.title || "");
  const type = a.activityType || "Activity";
  records.push({
    title: a.title || url,
    url,
    type: type === "Game" || /\/games?\//.test(url) || seg === "games" ? "Game" : type,
    unit,
    strand,
    standards,
    teacher: isTeacher(seg, type, url, a.title),
  });
}

records.sort((x, y) => {
  const tx = x.type.localeCompare(y.type);
  if (tx) return tx;
  return x.title.localeCompare(y.title);
});

const byType = {};
for (const r of records) byType[r.type] = (byType[r.type] || 0) + 1;

const out = {
  note: "Generated by scripts/generate-math-finder-index.mjs from data/registry.json. Do not hand-edit.",
  generated: new Date().toISOString(),
  total: records.length,
  byType,
  activities: records,
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`math-finder-index.json: ${records.length} math activities`);
console.log("by type:", JSON.stringify(byType));
