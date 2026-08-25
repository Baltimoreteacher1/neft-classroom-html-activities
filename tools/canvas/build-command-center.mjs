#!/usr/bin/env node
/**
 * build-command-center.mjs — produce the data file that powers the Canvas +
 * EduWonderLab Command Center page (teacher-tools/canvas-command-center/).
 *
 * It scans the curriculum manifest + each lesson config the SAME way the Canvas
 * generators do, and snapshots which packages currently exist under
 * canvas-packages/. Output: teacher-tools/canvas-command-center/status.json.
 *
 * The page is static (served by Cloudflare Pages) and cannot run Node, so this
 * pre-computes everything it needs: per-unit readiness, recommended import path,
 * package snapshot, and a single "next best action".
 *
 * Usage:  node tools/canvas/build-command-center.mjs   |   npm run command-center
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { assertNonEmpty } from "../lib/non-empty.mjs";
import { assertSweptEnough } from "../lib/sweep-guard.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const QUIZ_MAX = Number(process.env.QUIZ_MAX || 8);
const STAMP = process.env.CC_STAMP || ""; // optional ISO timestamp (Date.* unavailable here)
const CHECK = process.argv.includes("--check");

const UNSUPPORTED_TYPES = new Set([
  "drag-sort",
  "drag-and-drop",
  "sequence",
  "ordering",
  "sorting",
  "error-analysis",
  "fill-blank",
  "fill-in-the-blank",
  "short-answer",
  "open-response",
  "number-line",
  "graphing",
]);

function extract(id) {
  const p = resolve(repoRoot, "lessons", id, "config.json");
  if (!existsSync(p)) return { mc: 0, match: 0, skipped: {} };
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return { mc: 0, match: 0, skipped: {} };
  }
  let mc = 0,
    match = 0;
  const skipped = {};
  (function walk(o) {
    if (o && typeof o === "object") {
      if (
        o.type === "multiple-choice" &&
        Array.isArray(o.choices) &&
        o.choices.length >= 2 &&
        Number.isInteger(o.correctIndex)
      )
        mc++;
      else if (
        o.type === "matching-game" &&
        Array.isArray(o.pairs) &&
        o.pairs.length >= 2 &&
        o.pairs.every((x) => x && x.term != null && x.match != null)
      )
        match++;
      else if (typeof o.type === "string" && UNSUPPORTED_TYPES.has(o.type))
        skipped[o.type] = (skipped[o.type] || 0) + 1;
      for (const k in o) walk(o[k]);
    }
  })(cfg);
  // cap mirrors the generator (mc first, then matching)
  const capped = Math.min(mc + match, QUIZ_MAX);
  const keptMc = Math.min(mc, capped);
  const keptMatch = capped - keptMc;
  return { mc: keptMc, match: keptMatch, skipped };
}

const manifest = JSON.parse(
  readFileSync(resolve(repoRoot, "data/curriculum-manifest.json"), "utf8"),
);
let lessons = (
  Array.isArray(manifest.lessons) ? manifest.lessons : Object.values(manifest.lessons)
).filter((l) => l && l.id && !l.flagship);

assertNonEmpty(
  "lessons in the curriculum manifest",
  lessons,
  "The manifest yielded no lessons — the command centre would then build (or verify) an empty deck and call it deterministic.",
);
assertSweptEnough(
  "validate:determinism",
  lessons,
  "Discovery for validate:determinism returned far fewer items than this gate's pinned floor — see data/sweep-floors.json.",
);

const unitMap = {};
for (const l of lessons) {
  const u = Number(l.unit);
  unitMap[u] = unitMap[u] || { unit: u, lessons: [], mc: 0, match: 0, skipped: {}, quizLessons: 0 };
  const e = extract(l.id);
  unitMap[u].lessons.push({
    id: l.id,
    lesson: l.lesson,
    title: l.title,
    standard: l.standard || "",
    quizQuestions: e.mc + e.match,
  });
  unitMap[u].mc += e.mc;
  unitMap[u].match += e.match;
  if (e.mc + e.match > 0) unitMap[u].quizLessons++;
  for (const [t, n] of Object.entries(e.skipped))
    unitMap[u].skipped[t] = (unitMap[u].skipped[t] || 0) + n;
}

/* ---- package snapshot (what is currently built on disk) ---- */
const pkgDir = resolve(repoRoot, "canvas-packages");
function pkgInfo(name) {
  const f = resolve(pkgDir, name);
  if (!existsSync(f)) return { name, exists: false };
  const s = statSync(f);
  // File mtimes are machine-local build noise: package content can be identical
  // while every `npm run build` rewrites status.json with a new timestamp. Keep
  // only availability and size, which are stable properties teachers can act on.
  return { name, exists: true, sizeKB: Math.round(s.size / 1024) };
}

const units = Object.values(unitMap).sort((a, b) => a.unit - b.unit);
for (const u of units) {
  const quizQ = u.mc + u.match;
  u.recommendedPath =
    quizQ > 0
      ? "Native Canvas quizzes (QTI) — auto-graded, no IT"
      : "Lesson assignment + completion code";
  u.warnings = [];
  if (u.quizLessons < u.lessons.length)
    u.warnings.push(`${u.lessons.length - u.quizLessons} lesson(s) have no quiz questions`);
  if (quizQ === 0) u.warnings.push("no native quiz data — use completion-code grading");
  u.packages = {
    cartridge: pkgInfo(`neft-lessons-unit${u.unit}.imscc`),
    quizzes: pkgInfo(`neft-quizzes-unit${u.unit}.zip`),
    course: pkgInfo(`neft-course-unit${u.unit}.imscc`),
    unitPack: existsSync(resolve(pkgDir, `unit-${u.unit}`)),
  };
}

const globalPackages = {
  cartridge: pkgInfo("neft-lessons.imscc"),
  quizzes: pkgInfo("neft-quizzes.zip"),
  course: pkgInfo("neft-course.imscc"),
};

/* ---- next best action ---- */
function nextBestAction() {
  // 1) nothing built yet → build Unit 1 quizzes first (smallest safe test)
  if (!globalPackages.quizzes.exists && !units[0].packages.quizzes.exists)
    return {
      action: "Build the Unit 1 quiz package first (smallest, safest test).",
      command: "npm run course -- 1 --quizzes-only",
    };
  // 2) the all-units quiz package is built → import it and publish what you need
  if (globalPackages.quizzes.exists)
    return {
      action:
        "Native quiz package is built (neft-quizzes.zip). Import it into Canvas as a QTI .zip, then publish only the quizzes you need.",
      command: 'Canvas → Settings → Import Course Content → "QTI .zip file"',
    };
  // 3) only some per-unit packages built → build the next missing unit
  const missing = units.find((u) => u.mc + u.match > 0 && !u.packages.quizzes.exists);
  if (missing)
    return {
      action: `Build the Unit ${missing.unit} quiz package, then import it into Canvas.`,
      command: `npm run course -- ${missing.unit} --quizzes-only`,
    };
  return {
    action:
      "All quiz packages are built. Import Unit 1 into Canvas and publish only the quizzes you need.",
    command: 'Canvas → Settings → Import Course Content → "QTI .zip file"',
  };
}

const status = {
  generatedAt: STAMP,
  quizMax: QUIZ_MAX,
  site: (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, ""),
  totals: {
    units: units.length,
    lessons: lessons.length,
    mc: units.reduce((a, u) => a + u.mc, 0),
    match: units.reduce((a, u) => a + u.match, 0),
    quizLessons: units.reduce((a, u) => a + u.quizLessons, 0),
  },
  units,
  globalPackages,
  nextBestAction: nextBestAction(),
  paths: {
    noIT: "Common Cartridge lesson assignment + completion code + Canvas Grade Bridge",
    betterNoIT: "Native Canvas quizzes (QTI .zip) — auto-graded, no admin needed",
    itPath: "SCORM upload, LTI 1.3 external tool, or scoped API token (requires district IT)",
  },
};

const outDir = resolve(repoRoot, "teacher-tools", "canvas-command-center");
const outPath = resolve(outDir, "status.json");
const serialized = JSON.stringify(status, null, 2) + "\n";

/**
 * CI clones do not contain ignored Canvas package archives, while teacher
 * workstations often do. Remove that local-only snapshot before comparing so
 * `--check` catches curriculum/status drift without making clean CI clones lie
 * about package availability. Timestamps remain forbidden everywhere.
 */
function stableStatus(value) {
  if (Array.isArray(value)) return value.map(stableStatus);
  if (!value || typeof value !== "object") return value;
  if (typeof value.name === "string" && typeof value.exists === "boolean") {
    return { name: value.name };
  }
  const next = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === "generatedAt") continue;
    next[key] = stableStatus(child);
  }
  return next;
}

if (CHECK) {
  if (serialized.includes('"mtime"')) {
    throw new Error("Command Center status is nondeterministic: package mtime is forbidden.");
  }
  const committed = JSON.parse(readFileSync(outPath, "utf8"));
  if (JSON.stringify(stableStatus(committed)) !== JSON.stringify(stableStatus(status))) {
    throw new Error(
      "Command Center status is stale. Run `npm run command-center`, review status.json, and commit it.",
    );
  }
  console.log("✓ Command Center status is deterministic and current.");
  process.exit(0);
}

writeFileSync(outPath, serialized);
console.log(
  `✓ Command Center status: ${units.length} units, ${lessons.length} lessons, ` +
    `${status.totals.mc} MC + ${status.totals.match} matching questions.`,
);
console.log(`  Next best action: ${status.nextBestAction.action}`);
console.log(`  Wrote teacher-tools/canvas-command-center/status.json`);
