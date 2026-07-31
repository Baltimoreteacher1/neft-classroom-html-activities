#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");

const failures = [];
const passes = [];

function check(condition, message) {
  (condition ? passes : failures).push(message);
}

console.log("Validating Interactive Lesson Upgrades (Tier 1 & Tier 2)...");

// 1. Asset Files Existence
const assetFiles = [
  "assets/interactive-live-sim.js",
  "assets/interactive-live-sim.css",
  "assets/process-telemetry.js",
  "assets/process-telemetry.css",
  "assets/ink-native-math.js",
  "assets/ink-native-math.css",
  "assets/voice-native-lesson.js",
  "assets/voice-native-lesson.css",
  "assets/reasoning-replay.js",
  "assets/reasoning-replay.css",
  "assets/convince-skeptic.js",
  "assets/convince-skeptic.css",
  "assets/edge-tuned-twins.js",
  "assets/edge-tuned-twins.css",
];

for (const file of assetFiles) {
  check(existsSync(join(root, file)), `asset file present: ${file}`);
}

// 2. Platform Manifest Wiring
const platformJs = read("assets/lesson-platform.js");
const expectedGlobals = [
  "NTLiveSim",
  "NTProcessTelemetry",
  "NTInkMath",
  "NTVoiceLesson",
  "NTReasoningReplay",
  "NTSkeptic",
  "NTEdgeTwins",
];

for (const globalName of expectedGlobals) {
  check(platformJs.includes(globalName), `lesson-platform.js registers layer: ${globalName}`);
}

// 3. Mentor Cameo Wiring
const mentorJs = read("assets/lesson-mentor.js");
check(mentorJs.includes("triggerCameo"), "lesson-mentor.js exposes triggerCameo method");
check(mentorJs.includes("ntm-cameo-toast"), "lesson-mentor.js includes cameo toast UI");

// 4. Feature Contract Inspections
const liveSimJs = read("assets/interactive-live-sim.js");
check(liveSimJs.includes("reDeriveContainer"), "live-sim engine re-derives calculations");

const processTelemetryJs = read("assets/process-telemetry.js");
check(processTelemetryJs.includes("misconception_mid_solve"), "process telemetry detects mid-solve misconceptions");

const inkMathJs = read("assets/ink-native-math.js");
check(inkMathJs.includes("analyzeStrokes"), "ink-native math analyzes drawn canvas strokes");

const voiceJs = read("assets/voice-native-lesson.js");
check(voiceJs.includes("SpeechSynthesisUtterance"), "voice assistant supports text-to-speech synthesis");

const reasoningJs = read("assets/reasoning-replay.js");
check(reasoningJs.includes("reasoning-replay-modal"), "reasoning replay renders metacognition modal");

const skepticJs = read("assets/convince-skeptic.js");
check(skepticJs.includes("Convince the Skeptic Challenge"), "convince skeptic renders AI classmate challenge");

const twinsJs = read("assets/edge-tuned-twins.js");
check(twinsJs.includes("Edge-Tuned Twin Problem"), "edge-tuned twins generates parallel practice problems");

// 5. Service Worker Precaching
const swJs = read("public/sw.js");
for (const file of assetFiles) {
  check(swJs.includes("/" + file), `service worker precaches: ${file}`);
}

// Output summary
console.log(`\n${passes.length} passed, ${failures.length} failed.`);

if (failures.length > 0) {
  console.error("\nFailures:");
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
} else {
  console.log("All interactive lesson upgrades validated successfully!");
  process.exit(0);
}
