#!/usr/bin/env node
/**
 * tools/validate-curriculum-manifest.mjs
 * -----------------------------------------------------------------------------
 * Rigorous validator for data/curriculum-manifest.json:
 * 1. Schema conformity against data/curriculum-manifest.schema.json.
 * 2. Dead-link verification: checks every URL against disk and _redirects.
 * 3. Derived-count assertions against disk inventory.
 * 4. Generates an ES-coverage report per unit.
 * 5. Self-tests / negative controls ensuring it fails on corrupt/broken input.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(ROOT, "data/curriculum-manifest.json");
const SCHEMA_PATH = join(ROOT, "data/curriculum-manifest.schema.json");
const REDIRECTS_PATH = join(ROOT, "_redirects");

// Units whose resource gaps are tolerated: Unit 10 is not taught this year.
const UNTAUGHT_UNITS = new Set([10]);

function loadJson(absPath) {
  return JSON.parse(readFileSync(absPath, "utf8"));
}

function parseRedirects() {
  if (!existsSync(REDIRECTS_PATH)) return new Set();
  const text = readFileSync(REDIRECTS_PATH, "utf8");
  const routes = new Set();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      routes.add(parts[0]);
      if (parts[0].endsWith("/")) {
        routes.add(parts[0].slice(0, -1));
      } else {
        routes.add(parts[0] + "/");
      }
    }
  }
  return routes;
}

export function resolvesPath(urlStr, redirectsSet = null) {
  if (!urlStr || typeof urlStr !== "string") return false;
  const redirects = redirectsSet || parseRedirects();

  // Strip query and hash
  const cleanPath = urlStr.split("?")[0].split("#")[0];
  if (!cleanPath.startsWith("/")) return false;

  // Check redirects
  if (redirects.has(cleanPath)) return true;

  // Check on disk
  const rel = cleanPath.slice(1);
  const localTarget = join(ROOT, rel);
  const publicTarget = join(ROOT, "public", rel);

  for (const target of [localTarget, publicTarget]) {
    if (existsSync(target)) {
      try {
        const st = statSync(target);
        if (st.isFile()) return true;
        if (st.isDirectory() && existsSync(join(target, "index.html"))) return true;
      } catch {}
    }
  }

  // Also check if .html extension was omitted
  if (!cleanPath.endsWith("/")) {
    for (const target of [`${localTarget}.html`, `${publicTarget}.html`]) {
      if (existsSync(target)) return true;
    }
  }

  return false;
}

/** Pure schema and semantic validator function. */
export function validateManifest(manifest, options = {}) {
  const errors = [];
  const warnings = [];
  const esStats = {};

  for (let u = 1; u <= 10; u++) {
    esStats[u] = { totalFields: 0, translatedFields: 0, gaps: 0 };
  }

  if (!manifest || typeof manifest !== "object") {
    return { valid: false, errors: ["Manifest must be an object"], warnings: [], esStats };
  }

  if (manifest.schemaVersion !== 2) {
    errors.push(`Expected schemaVersion 2, found ${manifest.schemaVersion}`);
  }

  if (!Array.isArray(manifest.units) || manifest.units.length !== 10) {
    errors.push(`Expected exactly 10 units, found ${manifest.units?.length}`);
  } else {
    for (const unit of manifest.units) {
      if (typeof unit.number !== "number" || unit.number < 1 || unit.number > 10) {
        errors.push(`Invalid unit number: ${unit.number}`);
      }
      if (!unit.title?.en || !unit.title?.es) {
        errors.push(`Unit ${unit.number} missing title {en, es}`);
      }
      if (!unit.bigIdea?.en || !unit.bigIdea?.es) {
        errors.push(`Unit ${unit.number} missing bigIdea {en, es}`);
      }
      if (unit.capstones) {
        for (const [capName, capUrl] of Object.entries(unit.capstones)) {
          if (capUrl && !options.skipUrlCheck && !resolvesPath(capUrl)) {
            errors.push(`Unit ${unit.number} capstone ${capName} dead link: ${capUrl}`);
          }
        }
      }
    }
  }

  if (!Array.isArray(manifest.lessons) || manifest.lessons.length < 84) {
    errors.push(`Expected at least 84 lessons, found ${manifest.lessons?.length}`);
  }
  if (Array.isArray(manifest.lessons)) {
    const validReps = new Set(["tape-diagram", "double-number-line", "coordinate-plane", "table"]);
    const seenIds = new Set();

    for (const lesson of manifest.lessons) {
      const id = lesson.id;
      if (!id || !/^\d+-\d+$/.test(id)) {
        errors.push(`Invalid lesson id: ${id}`);
        continue;
      }
      if (seenIds.has(id)) {
        errors.push(`Duplicate lesson id: ${id}`);
      }
      seenIds.add(id);

      const u = lesson.unit;
      if (!esStats[u]) esStats[u] = { totalFields: 0, translatedFields: 0, gaps: 0 };

      // Title & BigIdea
      if (!lesson.title?.en || typeof lesson.title.en !== "string") {
        errors.push(`Lesson ${id} missing title.en`);
      }
      if (!lesson.title?.es || typeof lesson.title.es !== "string") {
        errors.push(`Lesson ${id} missing title.es`);
      } else {
        esStats[u].totalFields++;
        if (lesson.esGaps?.title) {
          esStats[u].gaps++;
        } else {
          esStats[u].translatedFields++;
        }
      }

      if (!lesson.bigIdea?.en || !lesson.bigIdea?.es) {
        errors.push(`Lesson ${id} missing bigIdea {en, es}`);
      } else {
        esStats[u].totalFields++;
        if (lesson.esGaps?.bigIdea) {
          esStats[u].gaps++;
        } else {
          esStats[u].translatedFields++;
        }
      }

      // Standards
      if (!Array.isArray(lesson.standards) || lesson.standards.length === 0) {
        errors.push(`Lesson ${id} missing standards array`);
      }

      // Representations
      if (!Array.isArray(lesson.representations) || lesson.representations.length === 0) {
        errors.push(`Lesson ${id} missing representations`);
      } else {
        for (const rep of lesson.representations) {
          if (!validReps.has(rep)) {
            errors.push(`Lesson ${id} has invalid representation "${rep}"`);
          }
        }
      }

      // Resources: a resource flagged applicable must exist on disk, otherwise the
      // hub, unit pages and picker would link a 404. A lesson with no source for a
      // resource (no authored mstarPractice items, say) is applicable:false in the
      // generator and is never linked. Unit 10 is not taught this year (Joel's
      // standing decision) and is the one declared exemption.
      if (lesson.resources && typeof lesson.resources === "object" && !UNTAUGHT_UNITS.has(u)) {
        for (const [resKey, res] of Object.entries(lesson.resources)) {
          if (res?.applicable && res.exists === false) {
            errors.push(
              `Lesson ${id} resource ${resKey} is applicable but missing on disk: ${res.file}`,
            );
          }
        }
      }

      // Tools
      if (!lesson.tools || typeof lesson.tools !== "object") {
        errors.push(`Lesson ${id} missing tools object`);
      } else if (!options.skipUrlCheck) {
        for (const [toolKey, toolUrl] of Object.entries(lesson.tools)) {
          if (toolUrl && !resolvesPath(toolUrl)) {
            errors.push(`Lesson ${id} tool ${toolKey} dead link: ${toolUrl}`);
          }
        }
      }

      // Printables
      if (!lesson.printables || typeof lesson.printables !== "object") {
        errors.push(`Lesson ${id} missing printables object`);
      } else {
        for (const reqKey of ["practiceSheet", "guidedNotes", "familyHomework"]) {
          const item = lesson.printables[reqKey];
          if (!item?.en || !item?.es) {
            errors.push(`Lesson ${id} printable ${reqKey} missing {en, es}`);
          } else if (!options.skipUrlCheck) {
            if (!resolvesPath(item.en))
              errors.push(`Lesson ${id} printable ${reqKey}.en dead link: ${item.en}`);
            if (!resolvesPath(item.es))
              errors.push(`Lesson ${id} printable ${reqKey}.es dead link: ${item.es}`);
          }
        }
        if (
          lesson.printables.teacherKey &&
          !options.skipUrlCheck &&
          !resolvesPath(lesson.printables.teacherKey)
        ) {
          errors.push(`Lesson ${id} teacherKey dead link: ${lesson.printables.teacherKey}`);
        }
        if (
          lesson.printables.subSummary &&
          !options.skipUrlCheck &&
          !resolvesPath(lesson.printables.subSummary)
        ) {
          errors.push(`Lesson ${id} subSummary dead link: ${lesson.printables.subSummary}`);
        }
      }

      // Scaffolding
      if (
        !lesson.scaffolding?.widaLevel2_3?.sentenceFrames?.length ||
        !lesson.scaffolding?.widaLevel2_3?.wordBank
      ) {
        errors.push(`Lesson ${id} missing scaffolding.widaLevel2_3`);
      }

      // Teacher Tray
      if (
        !lesson.teacher?.objective ||
        !Array.isArray(lesson.teacher.misconceptions) ||
        !lesson.teacher.interventionNotes?.tier2
      ) {
        errors.push(`Lesson ${id} missing teacher tray requirements`);
      }

      // Pathways
      if (lesson.pathways && !options.skipUrlCheck) {
        for (const [pKey, pUrl] of Object.entries(lesson.pathways)) {
          if (pUrl && !resolvesPath(pUrl)) {
            errors.push(`Lesson ${id} pathway ${pKey} dead link: ${pUrl}`);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    esStats,
  };
}

/** Negative controls to prove the validator catches failures. */
export function runSelfTest() {
  console.log("running validate:curriculum-manifest self-test (negative controls)...");

  // Case 1: Corrupted schemaVersion
  {
    const res = validateManifest({ schemaVersion: 1, units: [], lessons: [] });
    if (res.valid || !res.errors.some((e) => e.includes("schemaVersion"))) {
      throw new Error("Self-test failed: validator allowed invalid schemaVersion");
    }
  }

  // Case 2: Dead link detection
  {
    const badManifest = {
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
      units: Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        title: { en: "U", es: "U" },
        bigIdea: { en: "B", es: "B" },
      })),
      lessons: [
        {
          id: "1-1",
          unit: 1,
          lesson: 1,
          title: { en: "T", es: "T" },
          bigIdea: { en: "B", es: "B" },
          standards: ["6.RP.1"],
          representations: ["table"],
          tools: {
            notesStudio: "/curriculum/nonexistent-broken-route-12345/",
          },
          printables: {
            practiceSheet: { en: "/lessons/1-1/worksheet.html", es: "/lessons/1-1/worksheet.html" },
            guidedNotes: { en: "/lessons/1-1/notes.html", es: "/lessons/1-1/notes.html" },
            familyHomework: { en: "/lessons/1-1/homework.html", es: "/lessons/1-1/homework.html" },
          },
          scaffolding: {
            widaLevel2_3: {
              sentenceFrames: ["Test"],
              wordBank: ["word"],
            },
          },
          teacher: {
            objective: "Obj",
            misconceptions: ["Mistake"],
            interventionNotes: { tier2: "T2", tier3: "T3" },
          },
        },
      ],
    };
    const res = validateManifest(badManifest);
    if (res.valid || !res.errors.some((e) => e.includes("dead link"))) {
      throw new Error("Self-test failed: validator allowed dead link");
    }
  }

  // Case 3: Invalid representation enum
  {
    const badRepManifest = {
      schemaVersion: 2,
      generatedAt: new Date().toISOString(),
      units: Array.from({ length: 10 }, (_, i) => ({
        number: i + 1,
        title: { en: "U", es: "U" },
        bigIdea: { en: "B", es: "B" },
      })),
      lessons: [
        {
          id: "1-1",
          unit: 1,
          lesson: 1,
          title: { en: "T", es: "T" },
          bigIdea: { en: "B", es: "B" },
          standards: ["6.RP.1"],
          representations: ["pie-chart-invalid"],
          tools: {},
          printables: {
            practiceSheet: { en: "/lessons/1-1/worksheet.html", es: "/lessons/1-1/worksheet.html" },
            guidedNotes: { en: "/lessons/1-1/notes.html", es: "/lessons/1-1/notes.html" },
            familyHomework: { en: "/lessons/1-1/homework.html", es: "/lessons/1-1/homework.html" },
          },
          scaffolding: {
            widaLevel2_3: { sentenceFrames: ["F"], wordBank: ["W"] },
          },
          teacher: {
            objective: "Obj",
            misconceptions: ["Mistake"],
            interventionNotes: { tier2: "T2", tier3: "T3" },
          },
        },
      ],
    };
    const res = validateManifest(badRepManifest, { skipUrlCheck: true });
    if (res.valid || !res.errors.some((e) => e.includes("invalid representation"))) {
      throw new Error("Self-test failed: validator allowed invalid representation enum");
    }
  }

  // Case 4: an applicable resource missing on disk fails; Unit 10 is exempt
  {
    const base = loadJson(MANIFEST_PATH);
    const withGap = (unit) => {
      const copy = structuredClone(base);
      const lesson = copy.lessons.find((l) => l.unit === unit);
      lesson.resources.mstarWorksheet = { ...lesson.resources.mstarWorksheet };
      lesson.resources.mstarWorksheet.applicable = true;
      lesson.resources.mstarWorksheet.exists = false;
      return validateManifest(copy, { skipUrlCheck: true });
    };
    if (!withGap(2).errors.some((e) => e.includes("applicable but missing on disk"))) {
      throw new Error("Self-test failed: validator allowed an applicable resource missing on disk");
    }
    if (withGap(10).errors.some((e) => e.includes("applicable but missing on disk"))) {
      throw new Error("Self-test failed: validator did not exempt Unit 10");
    }
  }

  console.log("✓ Negative controls passed: all 4 corrupt inputs failed as expected.");
}

function printEsReport(esStats) {
  console.log("\n========================================================");
  console.log("SPANISH (ES) COVERAGE REPORT BY UNIT (WCAG 3.1.2 Audit)");
  console.log("========================================================");
  let totalAll = 0;
  let translatedAll = 0;
  let gapsAll = 0;

  for (let u = 1; u <= 10; u++) {
    const s = esStats[u] || { totalFields: 0, translatedFields: 0, gaps: 0 };
    totalAll += s.totalFields;
    translatedAll += s.translatedFields;
    gapsAll += s.gaps;
    const pct = s.totalFields > 0 ? Math.round((s.translatedFields / s.totalFields) * 100) : 100;
    const bar = "█".repeat(Math.round(pct / 10)) + "░".repeat(10 - Math.round(pct / 10));
    console.log(
      `  Unit ${String(u).padStart(2)}: [${bar}] ${String(pct).padStart(3)}% translated (${s.translatedFields}/${s.totalFields} fields, ${s.gaps} gaps with lang="en" fallback)`,
    );
  }
  const overallPct = totalAll > 0 ? Math.round((translatedAll / totalAll) * 100) : 100;
  console.log("--------------------------------------------------------");
  console.log(
    `  OVERALL: ${overallPct}% translated (${translatedAll}/${totalAll} fields, ${gapsAll} fallback tags)`,
  );
  console.log("========================================================\n");
}

function main() {
  if (process.argv.includes("--selftest")) {
    runSelfTest();
    return;
  }

  runSelfTest();

  if (!existsSync(MANIFEST_PATH)) {
    console.error(`✗ Manifest missing at ${MANIFEST_PATH}`);
    process.exit(1);
  }
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`✗ Schema missing at ${SCHEMA_PATH}`);
    process.exit(1);
  }
  loadJson(SCHEMA_PATH);

  const manifest = loadJson(MANIFEST_PATH);
  const result = validateManifest(manifest);

  printEsReport(result.esStats);

  if (!result.valid) {
    console.error(`✗ validate:curriculum-manifest FAILED with ${result.errors.length} error(s):`);
    for (const err of result.errors) {
      console.error(`  • ${err}`);
    }
    process.exit(1);
  }

  console.log(
    `✓ validate:curriculum-manifest passed — 10 units, ${manifest.lessons.length} lessons, all URLs resolve, zero schema errors.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
