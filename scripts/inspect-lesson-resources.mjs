#!/usr/bin/env node
/**
 * Resource Quality & Alignment Inspector
 * Validates canonical lesson resource catalog, standards, objectives,
 * student/teacher boundaries, broken links, and unit directory parity.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lessonPath } from "../tools/lib/curriculum-source.mjs";
import {
  buildCanonicalResourceCatalog,
  FLAGSHIP_LESSONS,
} from "./lib/canonical-resource-registry.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FORBIDDEN_STUDENT_PATH =
  /slides|teacher|answer(?:-|_)?key|gradebook|dashboard|\.docx(?:\?|$|#)|\.pdf(?:\?|$|#)/i;

export function inspectLessonResources(root = ROOT) {
  const findings = [];
  const add = (
    resourceId,
    severity,
    problem,
    location,
    suggestedCorrection,
    manualReview = false,
  ) => {
    findings.push({
      resourceId,
      severity,
      problem,
      location,
      suggestedCorrection,
      validationResult: severity === "high" ? "FAIL" : "WARN",
      manualReviewRequired: manualReview,
    });
  };

  const catalog = buildCanonicalResourceCatalog(root);
  const standardsRaw = JSON.parse(readFileSync(join(root, "data/ccss-standards.json"), "utf8"));
  const standards = standardsRaw.standards || standardsRaw;
  const unitsHtmlPath = join(root, "curriculum/units/index.html");
  const unitsHtml = existsSync(unitsHtmlPath) ? readFileSync(unitsHtmlPath, "utf8") : "";

  for (const lesson of catalog.lessons) {
    if (!lesson.objective) {
      add(
        lesson.id,
        "high",
        "Missing learning objective",
        `lessons/${lesson.id}/config.json`,
        "Add contentObjective in lesson config.json",
        true,
      );
    }
    if (!lesson.standard || !standards[lesson.standard]) {
      add(
        lesson.id,
        "high",
        `Standard '${lesson.standard}' not found in ccss-standards.json`,
        `lessons/${lesson.id}/config.json`,
        "Update standard code to match data/ccss-standards.json",
        true,
      );
    }
    if (!lesson.vocabulary.length) {
      add(
        lesson.id,
        "medium",
        "No vocabulary terms attached",
        `lessons/${lesson.id}/config.json`,
        "Add vocabulary array in lesson config.json",
        false,
      );
    }

    const seenIds = new Set();
    for (const res of lesson.resources) {
      if (seenIds.has(res.resourceId)) {
        add(
          res.resourceId,
          "high",
          "Duplicate resourceId in lesson",
          "data/lesson-resource-catalog.json",
          "Deduplicate resource key",
        );
      }
      seenIds.add(res.resourceId);

      if (res.audience !== "teacher" && FORBIDDEN_STUDENT_PATH.test(res.href)) {
        add(
          res.resourceId,
          "high",
          `Teacher-only path exposed in student/family catalog: ${res.href}`,
          "data/lesson-resource-catalog.json",
          "Remove forbidden path from student catalog",
        );
      }
      if (!res.exists) {
        add(
          res.resourceId,
          "high",
          `Target file missing on disk for ${res.href}`,
          res.href,
          "Restore missing file or remove stale manifest entry",
        );
      }
      if (res.key === "worksheet") {
        const keyPath = lessonPath(lesson.id, "worksheet-answer-key.html");
        if (!existsSync(keyPath)) {
          add(
            res.resourceId,
            "medium",
            "Missing teacher answer key for Practice Sheet A",
            `lessons/${lesson.id}/worksheet-answer-key.html`,
            "Generate worksheet-answer-key.html",
          );
        }
      }
    }

    if (FLAGSHIP_LESSONS.has(lesson.id)) {
      if (!lesson.capabilities.interactiveTheater || !lesson.capabilities.livingGuidedNotes) {
        add(
          lesson.id,
          "high",
          "Flagship lesson missing required interactive capabilities",
          `lessons/${lesson.id}`,
          "Enable flagship capabilities in canonical registry",
        );
      }
    }

    // Check Lesson 6-4 parity in curriculum/units/index.html
    if (lesson.id === "6-4" && unitsHtml) {
      if (
        unitsHtml.includes(
          "I can evaluate algebraic expressions by substituting values for the variables.",
        )
      ) {
        add(
          "6-4:units-dir",
          "high",
          "Lesson 6-4 in curriculum/units/index.html has Lesson 6-5's algebraic-substitution objective",
          "curriculum/units/index.html",
          "Replace with canonical 6-4 numerical-expressions objective",
        );
      }
      if (
        unitsHtml.includes('href="/teacher-tools/post-forms/?lesson=6-2"') &&
        unitsHtml.includes("6-4 write and evaluate numerical expressions")
      ) {
        add(
          "6-4:forms-link",
          "medium",
          "Lesson 6-4 Google Forms link points to ?lesson=6-2",
          "curriculum/units/index.html",
          "Update query param to ?lesson=6-4",
        );
      }
    }
  }

  const highCount = findings.filter((f) => f.severity === "high").length;
  const mediumCount = findings.filter((f) => f.severity === "medium").length;
  return {
    lessonCount: catalog.lessonCount,
    resourceCount: catalog.resourceCount,
    highCount,
    mediumCount,
    passed: highCount === 0,
    findings,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = inspectLessonResources(ROOT);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `Resource Quality & Alignment Inspector: ${report.lessonCount} lessons, ${report.resourceCount} resources`,
    );
    console.log(
      `High-severity issues: ${report.highCount} | Medium-severity issues: ${report.mediumCount}`,
    );
    for (const f of report.findings.slice(0, 20)) {
      console.log(`  [${f.severity.toUpperCase()}] ${f.resourceId}: ${f.problem} (${f.location})`);
    }
  }
  if (!report.passed) process.exit(1);
}
