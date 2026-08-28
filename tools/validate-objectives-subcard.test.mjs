#!/usr/bin/env node
import assert from "node:assert";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

console.log("Testing Objectives subcard structural configuration...");

// 1. Check engine/core/app.js PHASE_SUBTABS configuration
const appJsPath = join(ROOT, "engine", "core", "app.js");
const appJs = readFileSync(appJsPath, "utf8");

// Objectives is an Act 1 STEP (Warm-Up → Math Notes → Objectives → Notice &
// Wonder); the side rail's entry is a jump into that step, never a takeover
// extra beside a button that skips it (Joel, 2026-08-28).
assert.ok(
  appJs.includes('{ jump: "objectives", icon: "🎯", label: "Objectives" }'),
  "engine/core/app.js must include { jump: 'objectives', icon: '🎯', label: 'Objectives' } in PHASE_SUBTABS",
);

// Check that PHASE_SUBTABS has Math Notes followed by Objectives
const subtabsMatch = appJs.match(/0:\s*\[([\s\S]*?)\]/);
assert.ok(subtabsMatch, "PHASE_SUBTABS[0] must be defined in app.js");
const phase0Content = subtabsMatch[1];
const mathNotesPos = phase0Content.indexOf("mathnotes");
const objectivesPos = phase0Content.indexOf("objectives");
assert.ok(mathNotesPos !== -1, "Math Notes must be present in PHASE_SUBTABS[0]");
assert.ok(objectivesPos !== -1, "Objectives must be present in PHASE_SUBTABS[0]");
assert.ok(
  objectivesPos > mathNotesPos,
  "Objectives must appear immediately after Math Notes in PHASE_SUBTABS[0]",
);

// Check fullpage takeover class toggle
assert.ok(
  appJs.includes('kind === "objectives"'),
  "engine/core/app.js must include kind === 'objectives' in nt-extra-fullpage-open classList toggle",
);

// Check openObjectives function exists with close button and interactive cards
assert.ok(appJs.includes("openObjectives()"), "engine/core/app.js must define openObjectives()");
assert.ok(
  appJs.includes("renderObjectivesStep(host)"),
  "engine/core/app.js must define renderObjectivesStep(host) — the Act 1 step renderer",
);
assert.ok(
  appJs.includes('data-act="close"'),
  "openObjectives() must provide a data-act='close' button",
);

// 2. Verify all core lessons have contentObjective and languageObjective
const lessonsDir = join(ROOT, "lessons");
const lessonDirs = readdirSync(lessonsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d+-\d+$/.test(d.name))
  .map((d) => d.name)
  .sort((a, b) => {
    const [uA, lA] = a.split("-").map(Number);
    const [uB, lB] = b.split("-").map(Number);
    return uA !== uB ? uA - uB : lA - lB;
  });

assert.strictEqual(lessonDirs.length, 84, "Expected 84 core lessons");

let totalObjectives = 0;
for (const id of lessonDirs) {
  const cfgPath = join(lessonsDir, id, "config.json");
  if (!existsSync(cfgPath)) continue;
  const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
  assert.ok(
    typeof cfg.contentObjective === "string" && cfg.contentObjective.trim().length > 0,
    `Lesson ${id} must define a non-empty contentObjective`,
  );
  assert.ok(
    typeof cfg.languageObjective === "string" && cfg.languageObjective.trim().length > 0,
    `Lesson ${id} must define a non-empty languageObjective`,
  );
  totalObjectives++;
}

console.log(
  `✓ Objectives subcard configuration verified across ${totalObjectives}/84 core interactive math lessons.`,
);
