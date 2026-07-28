#!/usr/bin/env node
/**
 * generate-canonical-registry.mjs — build data/curriculum-canonical.json.
 *
 * ONE authoritative curriculum registry, assembled from the sources that are
 * already the source of truth in this repo. Nothing here invents curriculum
 * data; it joins what already exists and adds the fields the award-portfolio
 * work needs (canonical IDs, legacy aliases, product associations, supported
 * evidence events).
 *
 * Sources (in precedence order):
 *   lessons/<id>/config.json          — lesson SoT (via data/curriculum-manifest.json)
 *   data/curriculum-unit-identities.json — unit titles / missions / accents
 *   data/ccss-standards.json          — standards SoT (2025 MCCRS + `oldId` CCSS crosswalk)
 *   assets/learning-supports/manifest.json — vocabulary + language objectives
 *   data/product-registry.json        — product associations (reverse-mapped)
 *
 * The canonical SEQUENCE is /curriculum/, which is itself driven by the lesson
 * configs, so the manifest is the authoritative ordering. Legacy /math/unit-N/
 * routes are recorded as aliases, never as a second source of truth.
 *
 * Run: npm run generate-canonical-registry   (also part of curriculum:rebuild)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "data/curriculum-canonical.json");

const read = (rel) => JSON.parse(readFileSync(resolve(ROOT, rel), "utf8"));

const manifest = read("data/curriculum-manifest.json");
const identities = read("data/curriculum-unit-identities.json");
const standardsDoc = read("data/ccss-standards.json");
const supports = read("assets/learning-supports/manifest.json");
const products = read("data/product-registry.json");

/* --------------------------------------------------------------------------
 * Evidence events a surface can emit. Kept in lockstep with the event types in
 * shared/evidence/learning-evidence.js — validate:canonical-registry fails if
 * the two drift.
 * ------------------------------------------------------------------------ */
const LESSON_EVIDENCE_EVENTS = [
  "activity_started",
  "activity_completed",
  "item_attempted",
  "hint_requested",
  "explanation_written",
  "confidence_rated",
  "support_used",
];

/* Products, reverse-mapped from the product registry so a product's unit list
 * is stated once. */
function productsForUnit(unitNumber) {
  return products.products
    .filter((p) => (p.canonicalUnits || []).includes(unitNumber))
    .map((p) => p.id)
    .sort();
}

/* Canonical identifiers. Lesson ids ("3-1") are already stable and are used in
 * routes, save keys, and Canvas packages, so they stay verbatim — the canonical
 * id namespaces them without changing anything that ships. */
const unitId = (n) => `unit-${n}`;
const lessonCanonicalId = (id) => `lesson-${id}`;

/* Legacy aliases. These are the identifiers that already exist in the wild:
 * bookmarks, Canvas packages, printed handouts, and the /math/unit-N/ hubs.
 * Recording them here is what lets validation reject NEW content that uses an
 * old identifier without declaring it. */
function unitAliases(n) {
  const aliases = [`math-unit-${n}`, `/math/unit-${n}/`];
  if (existsSync(resolve(ROOT, `math-rpg/unit-${n}/index.html`))) {
    aliases.push(`/math-rpg/unit-${n}/`);
  }
  return aliases;
}

function lessonAliases(lesson) {
  const aliases = [lesson.id];
  const legacyStandard = standardsDoc.standards[lesson.standard]?.oldId;
  if (legacyStandard) aliases.push(`${legacyStandard}:${lesson.id}`);
  return aliases;
}

/* Prerequisite skills are DERIVED, not authored: the preceding lessons in the
 * canonical sequence that share this lesson's standards cluster. Documented as
 * derived so nobody mistakes it for hand-written pedagogy. */
function prerequisiteSkills(lesson, ordered) {
  const cluster = standardsDoc.standards[lesson.standard]?.cluster;
  if (!cluster) return [];
  const idx = ordered.findIndex((l) => l.id === lesson.id);
  return ordered
    .slice(0, idx)
    .filter((prev) => standardsDoc.standards[prev.standard]?.cluster === cluster)
    .slice(-2)
    .map((prev) => ({
      lessonId: lessonCanonicalId(prev.id),
      title: prev.title,
      route: prev.lessonPath,
      derivedFrom: "same-cluster-earlier-lesson",
    }));
}

/* Resource groups, projected from the manifest's flat `resources` map into the
 * audience-shaped buckets the product surfaces ask for. Only resources the
 * manifest reports as existing on disk are listed. */
const RESOURCE_GROUPS = {
  student: ["lesson", "handout", "homework", "practice", "studentHelp", "graphicNovel"],
  teacher: ["teacherNotes", "slides", "guidedNotes", "answerKey", "lessonPlan"],
  family: ["familyPage", "familyLetter", "familyHomework"],
  printable: ["guidedNotesPdf", "guidedNotesDocx", "homeworkDocx", "printables", "worksheet"],
  assessment: ["exitTicket", "quiz", "assessment", "googleForm"],
};

function groupResources(resources = {}) {
  const out = {};
  for (const [group, keys] of Object.entries(RESOURCE_GROUPS)) {
    const items = [];
    for (const key of keys) {
      const entry = resources[key];
      if (entry && entry.exists && entry.path) items.push({ key, path: entry.path });
    }
    if (items.length) out[group] = items;
  }
  // Anything the manifest knows about that the buckets above did not claim.
  const claimed = new Set(Object.values(RESOURCE_GROUPS).flat());
  const other = Object.entries(resources)
    .filter(([key, v]) => !claimed.has(key) && v && v.exists && v.path)
    .map(([key, v]) => ({ key, path: v.path }));
  if (other.length) out.other = other;
  return out;
}

/* -------------------------------------------------------------------------- */

const ordered = [...manifest.lessons].sort(
  (a, b) => a.unit - b.unit || a.lesson - b.lesson || a.id.localeCompare(b.id),
);

const lessons = ordered.map((lesson) => {
  const std = standardsDoc.standards[lesson.standard] || null;
  const support = supports[lesson.id] || {};
  const vocabulary = (support.vocabulary || []).map((v) => ({
    term: v.term,
    termEs: v.termEs || null,
    definition: v.definition,
    definitionEs: v.definitionEs || null,
  }));

  return {
    canonicalLessonId: lessonCanonicalId(lesson.id),
    lessonId: lesson.id,
    canonicalUnitId: unitId(lesson.unit),
    unitNumber: lesson.unit,
    lessonNumber: lesson.lesson,
    title: lesson.title,
    flagship: Boolean(lesson.flagship),
    standard: lesson.standard,
    standardDescription: std ? std.fullText : null,
    standardShortLabel: std ? std.shortLabel : null,
    standardsCrosswalk: std && std.oldId ? { ccss2010: std.oldId } : {},
    learningTarget: lesson.objective || null,
    studentFriendlyLearningTarget: support.contentObjective || lesson.objective || null,
    languageObjective: lesson.languageObjective || support.languageObjective || null,
    essentialVocabulary: vocabulary,
    prerequisiteSkills: prerequisiteSkills(lesson, ordered),
    timeEstimate: lesson.timeEstimate || null,
    canonicalRoute: lesson.lessonPath,
    legacyAliases: lessonAliases(lesson),
    resources: groupResources(lesson.resources),
    games: lesson.arcade ? [{ title: lesson.arcade.title, route: lesson.arcade.path }] : [],
    products: productsForUnit(lesson.unit),
    supportedEvidenceEvents: LESSON_EVIDENCE_EVENTS,
    accessibilityFeatures: [
      "read-aloud",
      "keyboard-operable",
      "visible-focus",
      "reduced-motion",
      "larger-text",
      "print-friendly",
    ],
    languageSupportFeatures: [
      "language-objective",
      "bilingual-vocabulary",
      "sentence-frames",
      "read-aloud",
      ...(vocabulary.some((v) => v.termEs) ? ["spanish-vocabulary"] : []),
    ],
  };
});

const units = manifest.units.map((n) => {
  const identity = identities.units[String(n)] || {};
  const unitLessons = lessons.filter((l) => l.unitNumber === n);
  const unitStandards = [...new Set(unitLessons.map((l) => l.standard))].sort();
  return {
    canonicalUnitId: unitId(n),
    unitNumber: n,
    title: identity.title || `Unit ${n}`,
    icon: identity.icon || null,
    description: identity.mission || null,
    skills: identity.skills || [],
    finalChallenge: identity.finalChallenge || null,
    accent: identity.accent || null,
    standards: unitStandards,
    standardsCrosswalk: Object.fromEntries(
      unitStandards
        .map((s) => [s, standardsDoc.standards[s]?.oldId])
        .filter(([, old]) => Boolean(old)),
    ),
    lessonIds: unitLessons.map((l) => l.canonicalLessonId),
    lessonCount: unitLessons.length,
    canonicalRoute: `/curriculum/#unit-${n}`,
    legacyAliases: unitAliases(n),
    products: productsForUnit(n),
    accessibilityFeatures: ["keyboard-operable", "screen-reader-landmarks", "print-friendly"],
    languageSupportFeatures: ["language-objectives", "bilingual-vocabulary", "family-home-language"],
  };
});

/* Flat alias -> canonical id index. This is what a page or script consults to
 * resolve an old unit number or an old standard code, so the same lookup is
 * never re-implemented per surface. */
const aliases = {};
for (const unit of units) {
  for (const alias of unit.legacyAliases) aliases[alias] = unit.canonicalUnitId;
}
for (const lesson of lessons) {
  for (const alias of lesson.legacyAliases) aliases[alias] = lesson.canonicalLessonId;
}
for (const [code, def] of Object.entries(standardsDoc.standards)) {
  // Pre-2025 CCSS code, e.g. 6.RP.1 -> 6.AT.1.
  if (def.oldId) aliases[def.oldId] = code;
  // Cluster-qualified spelling used by Number Realm's problem bank and by some
  // printed materials, e.g. 6.AT.A.1 -> 6.AT.1. Registering it here is what
  // lets one shared resolver serve every surface instead of each one carrying
  // its own string surgery.
  if (def.cluster) {
    const suffix = code.slice(code.lastIndexOf(".") + 1);
    const clustered = `${def.cluster}.${suffix}`;
    if (clustered !== code) aliases[clustered] = code;
  }
}

const registry = {
  note: "GENERATED by scripts/generate-canonical-registry.mjs — do not hand-edit. Edit the sources listed in `generatedFrom` instead.",
  schemaVersion: 1,
  generatedFrom: [
    "data/curriculum-manifest.json",
    "data/curriculum-unit-identities.json",
    "data/ccss-standards.json",
    "assets/learning-supports/manifest.json",
    "data/product-registry.json",
  ],
  canonicalSequenceSource: "/curriculum/ (driven by lessons/<id>/config.json)",
  standardsFramework: {
    primary: "Maryland College and Career Ready Standards (2025 codes)",
    crosswalk: "ccss2010",
    domains: standardsDoc.domains,
  },
  evidenceEventTypes: LESSON_EVIDENCE_EVENTS,
  totals: { units: units.length, lessons: lessons.length, aliases: Object.keys(aliases).length },
  units,
  lessons,
  aliases,
  deprecatedRoutes: [],
};

writeFileSync(OUT, `${JSON.stringify(registry, null, 1)}\n`);
console.log(
  `generate-canonical-registry: wrote data/curriculum-canonical.json — ${units.length} units, ${lessons.length} lessons, ${Object.keys(aliases).length} aliases.`,
);
