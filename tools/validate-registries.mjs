#!/usr/bin/env node
/**
 * validate-registries.mjs — integrity gate for the two award-portfolio registries.
 *
 *   data/curriculum-canonical.json  (generated; canonical units + lessons + aliases)
 *   data/product-registry.json      (hand-maintained; the six approved products)
 *
 * Wired into `npm run validate`, so a push cannot ship a registry that
 * contradicts the curriculum, points at a route that does not exist, or
 * re-introduces the excluded product.
 *
 * Writes a readable maintainer report to reports/registry-validation.md
 * regardless of pass/fail, then exits non-zero on any error.
 *
 * Run: npm run validate:registries
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));

const errors = [];
const warnings = [];
const err = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const canonical = read("data/curriculum-canonical.json");
const productsDoc = read("data/product-registry.json");
const standardsDoc = read("data/ccss-standards.json");
const manifest = read("data/curriculum-manifest.json");
const routesDoc = read("data/routes.json");

/* The product that is explicitly out of scope. Checked by route AND by id so a
 * rename cannot smuggle it back in. */
const EXCLUDED_ROUTE = "/curriculum/monster-math-academy/";
const EXCLUDED_TOKENS = ["monster-math-academy", "monster math academy"];

/* ---------------------------------------------------------------- helpers */

/** Resolve a site-absolute route to a file on disk. */
function routeExists(route) {
  if (!route || typeof route !== "string") return false;
  if (/^https?:\/\//i.test(route)) return true; // external, not ours to verify
  const clean = route.split("#")[0].split("?")[0];
  if (clean === "/" || clean === "") return existsSync(resolve(ROOT, "index.html"));
  const rel = clean.replace(/^\//, "");
  if (rel.endsWith(".html") || /\.[a-z0-9]{2,5}$/i.test(rel)) {
    return existsSync(resolve(ROOT, rel));
  }
  return existsSync(resolve(ROOT, rel.replace(/\/$/, ""), "index.html"));
}

/** A route with a #fragment must still resolve to a real page. */
function checkRoute(label, route, sink = err) {
  if (!route) return;
  if (!routeExists(route)) sink(`${label}: route does not resolve to a file — ${route}`);
}

/* ------------------------------------------------- canonical registry checks */

if (canonical.schemaVersion !== 1) {
  err(`curriculum-canonical: unexpected schemaVersion ${canonical.schemaVersion}`);
}

const seenUnitIds = new Set();
const unitByNumber = new Map();
for (const unit of canonical.units) {
  if (seenUnitIds.has(unit.canonicalUnitId)) {
    err(`duplicate canonical unit id: ${unit.canonicalUnitId}`);
  }
  seenUnitIds.add(unit.canonicalUnitId);
  unitByNumber.set(unit.unitNumber, unit);

  if (!unit.title) err(`${unit.canonicalUnitId}: missing unit title`);
  if (!unit.description) warn(`${unit.canonicalUnitId}: missing unit description`);
  if (!unit.legacyAliases || unit.legacyAliases.length === 0) {
    err(`${unit.canonicalUnitId}: legacy unit number has no registered alias`);
  }
  for (const std of unit.standards) {
    if (!standardsDoc.standards[std]) {
      err(`${unit.canonicalUnitId}: unknown standard ${std}`);
    }
  }
}

const seenLessonIds = new Set();
const lessonByCanonicalId = new Map();
const STANDARD_RE = /^6\.(AT|NOS|GR|DS)\.\d+[a-z]?$/;

for (const lesson of canonical.lessons) {
  if (seenLessonIds.has(lesson.canonicalLessonId)) {
    err(`duplicate lesson id: ${lesson.canonicalLessonId}`);
  }
  seenLessonIds.add(lesson.canonicalLessonId);
  lessonByCanonicalId.set(lesson.canonicalLessonId, lesson);

  const where = lesson.canonicalLessonId;
  if (!lesson.title) err(`${where}: missing lesson title`);
  if (!lesson.learningTarget) err(`${where}: missing learning target`);
  if (!lesson.languageObjective) {
    // Every Grade 6 math lesson in this curriculum is expected to carry one;
    // the learning-supports manifest already enforces it for canonical lessons.
    err(`${where}: missing language objective`);
  }

  if (!STANDARD_RE.test(lesson.standard)) {
    err(`${where}: malformed standard code "${lesson.standard}"`);
  } else {
    const def = standardsDoc.standards[lesson.standard];
    if (!def) {
      err(`${where}: unknown standard ${lesson.standard}`);
    } else if (def.unit != null && def.unit !== lesson.unitNumber) {
      // "impossible standards range": a standard the SoT assigns to a
      // different unit than the lesson claiming it.
      err(
        `${where}: standard ${lesson.standard} belongs to unit ${def.unit} but the lesson is in unit ${lesson.unitNumber}`,
      );
    }
  }

  const unit = unitByNumber.get(lesson.unitNumber);
  if (!unit) {
    err(`${where}: references unknown unit ${lesson.unitNumber}`);
  } else {
    if (unit.canonicalUnitId !== lesson.canonicalUnitId) {
      err(
        `${where}: conflicting unit assignment — lesson says ${lesson.canonicalUnitId}, unit ${lesson.unitNumber} is ${unit.canonicalUnitId}`,
      );
    }
    if (!unit.lessonIds.includes(lesson.canonicalLessonId)) {
      err(`${where}: not listed in ${unit.canonicalUnitId}.lessonIds`);
    }
  }

  checkRoute(where, lesson.canonicalRoute);

  // Registered resources must exist on disk. The generator only emits entries
  // the manifest marked `exists`, so a failure here means the two drifted.
  for (const [group, items] of Object.entries(lesson.resources || {})) {
    for (const item of items) {
      if (!routeExists(item.path)) {
        err(`${where}: registered ${group} resource is missing — ${item.path}`);
      }
    }
  }
  for (const game of lesson.games || []) {
    if (!routeExists(game.route)) {
      warn(`${where}: registered game route is missing — ${game.route}`);
    }
  }

  if (!Array.isArray(lesson.supportedEvidenceEvents) || !lesson.supportedEvidenceEvents.length) {
    err(`${where}: no supported evidence events declared`);
  }
}

/* Lesson count must match the curriculum manifest — a silent drop is the
 * failure mode this catches. */
if (canonical.lessons.length !== manifest.lessons.length) {
  err(
    `canonical registry has ${canonical.lessons.length} lessons but the curriculum manifest has ${manifest.lessons.length} — regenerate with \`npm run generate-canonical-registry\``,
  );
}

/* Alias index must resolve. A dangling alias is what produces the duplicated
 * resources the brief warns about. */
const knownIds = new Set([...seenUnitIds, ...seenLessonIds, ...Object.keys(standardsDoc.standards)]);
for (const [alias, target] of Object.entries(canonical.aliases)) {
  if (!knownIds.has(target)) {
    err(`alias "${alias}" resolves to unknown canonical id "${target}"`);
  }
  if (knownIds.has(alias) && canonical.aliases[alias] !== alias) {
    // An alias that is ALSO a canonical id would make resolution order matter.
    if (!Object.prototype.hasOwnProperty.call(standardsDoc.standards, alias)) {
      err(`alias "${alias}" collides with a canonical id`);
    }
  }
}

/* --------------------------------------------------- product registry checks */

const REQUIRED_PRODUCT_FIELDS = [
  "id",
  "slug",
  "name",
  "shortName",
  "tagline",
  "summary",
  "problemSolved",
  "primaryAudience",
  "gradeLevels",
  "coreExperience",
  "differentiators",
  "entryRoute",
  "canonicalUnits",
  "evidenceSources",
  "accessibilityFeatures",
  "languageSupports",
  "privacyFeatures",
  "implementationRequirements",
  "awardCategoryTags",
  "status",
  "limitations",
  "lastValidated",
];

const EXPECTED_PRODUCT_IDS = [
  "number-realm",
  "language-bridge",
  "design-studio",
  "personalized-math-path",
  "grade6-curriculum-system",
  "teacher-studio",
];

const productIds = productsDoc.products.map((p) => p.id);
for (const expected of EXPECTED_PRODUCT_IDS) {
  if (!productIds.includes(expected)) err(`product registry is missing required product: ${expected}`);
}
for (const id of productIds) {
  if (!EXPECTED_PRODUCT_IDS.includes(id)) {
    err(`product registry contains an unapproved product: ${id}`);
  }
}
if (new Set(productIds).size !== productIds.length) err("duplicate product ids in the product registry");

const seenSlugs = new Set();
for (const product of productsDoc.products) {
  const where = `product ${product.id || "(no id)"}`;
  for (const field of REQUIRED_PRODUCT_FIELDS) {
    const value = product[field];
    const empty =
      value == null || value === "" || (Array.isArray(value) && value.length === 0 && field !== "standards");
    if (empty) err(`${where}: incomplete product metadata — missing "${field}"`);
  }
  if (seenSlugs.has(product.slug)) err(`${where}: duplicate slug "${product.slug}"`);
  seenSlugs.add(product.slug);

  checkRoute(`${where} entryRoute`, product.entryRoute);
  checkRoute(`${where} demoRoute`, product.demoRoute);
  checkRoute(`${where} judgeModeRoute`, product.judgeModeRoute);
  for (const route of product.relatedRoutes || []) {
    checkRoute(`${where} relatedRoute`, route);
  }

  for (const unitNumber of product.canonicalUnits || []) {
    if (!unitByNumber.has(unitNumber)) {
      err(`${where}: references unknown unit ${unitNumber}`);
    }
  }
  for (const std of product.standards || []) {
    if (!standardsDoc.standards[std]) err(`${where}: unknown standard ${std}`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(product.lastValidated))) {
    err(`${where}: lastValidated must be an ISO date (YYYY-MM-DD)`);
  }
}

/* ------------------------------------------------------- exclusion enforcement */

const serializedProducts = JSON.stringify(productsDoc.products).toLowerCase();
for (const token of EXCLUDED_TOKENS) {
  if (serializedProducts.includes(token)) {
    err(`excluded product "${token}" appears inside the product entries — it must stay out of the portfolio`);
  }
}
if (!(productsDoc.excluded || []).some((e) => e.route === EXCLUDED_ROUTE)) {
  err(`product registry must document the excluded product (${EXCLUDED_ROUTE}) in \`excluded\``);
}
if (!routeExists(EXCLUDED_ROUTE)) {
  err(`the excluded product's route must remain live and untouched — missing ${EXCLUDED_ROUTE}`);
}

/* ------------------------------------------------------------ redirect cycles */

const redirectMap = new Map();
for (const r of routesDoc.redirects || []) {
  if (r && r.source && r.destination) redirectMap.set(r.source, r.destination);
}
for (const source of redirectMap.keys()) {
  const seen = new Set([source]);
  let cursor = redirectMap.get(source);
  let hops = 0;
  while (cursor && redirectMap.has(cursor) && hops < 25) {
    if (seen.has(cursor)) {
      err(`circular redirect detected starting at ${source}`);
      break;
    }
    seen.add(cursor);
    cursor = redirectMap.get(cursor);
    hops += 1;
  }
}

/* ------------------------------------- evidence event lockstep with the runtime */

const evidenceSrc = readFileSync(resolve(ROOT, "shared/evidence/learning-evidence.js"), "utf8");
for (const type of canonical.evidenceEventTypes) {
  if (!evidenceSrc.includes(`"${type}"`)) {
    err(`evidence event "${type}" is registered but not declared in shared/evidence/learning-evidence.js`);
  }
}

/* ---------------------------------------------------------------- the report */

const lines = [];
lines.push("# Registry validation report");
lines.push("");
lines.push("Generated by `npm run validate:registries` — do not hand-edit.");
lines.push("");
lines.push(`- Result: **${errors.length === 0 ? "PASS" : "FAIL"}**`);
lines.push(`- Errors: ${errors.length}`);
lines.push(`- Warnings: ${warnings.length}`);
lines.push("");
lines.push("## Coverage");
lines.push("");
lines.push("| Registry | Records |");
lines.push("| --- | --- |");
lines.push(`| Canonical units | ${canonical.units.length} |`);
lines.push(`| Canonical lessons | ${canonical.lessons.length} |`);
lines.push(`| Legacy aliases | ${Object.keys(canonical.aliases).length} |`);
lines.push(`| Products | ${productsDoc.products.length} |`);
lines.push(`| Excluded products | ${(productsDoc.excluded || []).length} |`);
lines.push("");
lines.push("## Units");
lines.push("");
lines.push("| Unit | Title | Lessons | Standards | Products |");
lines.push("| --- | --- | --- | --- | --- |");
for (const unit of canonical.units) {
  lines.push(
    `| ${unit.unitNumber} | ${unit.title} | ${unit.lessonCount} | ${unit.standards.join(", ")} | ${unit.products.length} |`,
  );
}
lines.push("");
lines.push("## Products");
lines.push("");
lines.push("| Product | Entry route | Units | Status | Open limitations |");
lines.push("| --- | --- | --- | --- | --- |");
for (const product of productsDoc.products) {
  lines.push(
    `| ${product.name} | \`${product.entryRoute}\` | ${(product.canonicalUnits || []).length} | ${product.status} | ${(product.limitations || []).length} |`,
  );
}
lines.push("");
if (errors.length) {
  lines.push("## Errors");
  lines.push("");
  for (const e of errors) lines.push(`- ${e}`);
  lines.push("");
}
if (warnings.length) {
  lines.push("## Warnings");
  lines.push("");
  for (const w of warnings) lines.push(`- ${w}`);
  lines.push("");
}

mkdirSync(resolve(ROOT, "reports"), { recursive: true });
writeFileSync(resolve(ROOT, "reports/registry-validation.md"), `${lines.join("\n")}\n`);

for (const w of warnings) console.warn(`  warn: ${w}`);
for (const e of errors) console.error(`  ✗ ${e}`);
console.log(
  `validate-registries: ${errors.length === 0 ? "PASS ✅" : "FAIL ❌"} — ${canonical.units.length} units, ${canonical.lessons.length} lessons, ${productsDoc.products.length} products, ${warnings.length} warning(s). Report: reports/registry-validation.md`,
);
process.exit(errors.length === 0 ? 0 : 1);
