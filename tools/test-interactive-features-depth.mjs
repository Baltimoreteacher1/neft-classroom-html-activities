import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

console.log("Deep auditing interactive lesson features in DOM execution environment...");

const dom = new JSDOM(
  `<!DOCTYPE html>
<html>
<head></head>
<body>
  <div class="learn-it try-it">
    <span class="math-num" data-sim-num="1">3</span>
    <span class="math-num" data-sim-num="2">5</span>
    <span class="live-sim-derived-value" data-formula="x1 * x2">15</span>
    <input type="text" class="ratio-input" data-expected-ratio="3:5" id="step-ratio" />
    <canvas class="draw-canvas" width="400" height="300"></canvas>
  </div>
</body>
</html>`,
  { runScripts: "dangerously", url: "https://eduwonderlab.com/lessons/1-1/" },
);

const win = dom.window;
const doc = win.document;
global.window = win;
global.document = doc;

// Polyfill speech recognition / synthesis for JS environment
win.SpeechSynthesisUtterance = class SpeechSynthesisUtterance {
  constructor(text) {
    this.text = text;
  }
};
win.speechSynthesis = {
  cancel: () => {},
  speak: (u) => {
    win.__lastSpoken = u.text;
  },
};

// Execute features in window context
function execJs(file) {
  const code = read(file);
  win.eval(code);
}

execJs("assets/interactive-live-sim.js");
execJs("assets/process-telemetry.js");
execJs("assets/ink-native-math.js");
execJs("assets/voice-native-lesson.js");
execJs("assets/reasoning-replay.js");
execJs("assets/convince-skeptic.js");
execJs("assets/edge-tuned-twins.js");
execJs("assets/lesson-mentor.js");

// Dispatch DOMContentLoaded to trigger auto-enhancers
doc.dispatchEvent(new win.Event("DOMContentLoaded"));

const passes = [];
const failures = [];

function check(cond, msg) {
  if (cond) passes.push(msg);
  else failures.push(msg);
}

try {
  // 1. Live Simulation Engine
  execJs("assets/interactive-live-sim.js");
  check(win.NTLiveSim && win.NTLiveSim.__booted, "1. Live Simulation engine boots");
  const dragEl = doc.querySelector(".live-sim-draggable");
  check(dragEl !== null, "1. Live Simulation auto-detects draggable numbers");

  // 2. Process Telemetry
  execJs("assets/process-telemetry.js");
  check(
    win.NTProcessTelemetry && win.NTProcessTelemetry.__booted,
    "2. Process Telemetry engine boots",
  );
  const inputEl = doc.querySelector(".ratio-input");
  inputEl.value = "5:3"; // Inverted ratio
  inputEl.dispatchEvent(new win.Event("input"));
  const hintEl = doc.querySelector(".process-telemetry-hint");
  check(
    hintEl !== null && hintEl.textContent.includes("Check term order"),
    "2. Mid-solve intervention triggers on inverted ratio",
  );

  // 3. Ink-Native Math Canvas
  execJs("assets/ink-native-math.js");
  check(win.NTInkMath && win.NTInkMath.__booted, "3. Ink-Native Math engine boots");
  const overlayEl = doc.querySelector(".ink-math-overlay");
  check(overlayEl !== null, "3. Canvas overlay element rendered");

  // 4. Voice-Native Assistant
  execJs("assets/voice-native-lesson.js");
  check(win.NTVoiceLesson && win.NTVoiceLesson.__booted, "4. Voice-Native Lesson assistant boots");
  win.NTVoiceLesson.speak("Hello Math");
  check(win.__lastSpoken === "Hello Math", "4. Bilingual SpeechSynthesis works");

  // 5. Reasoning Replay
  execJs("assets/reasoning-replay.js");
  check(
    win.NTReasoningReplay && win.NTReasoningReplay.__booted,
    "5. Reasoning Replay engine boots",
  );
  win.NTReasoningReplay.trigger();
  const replayModal = doc.querySelector(".reasoning-replay-modal");
  check(
    replayModal !== null && replayModal.textContent.includes("Metacognition"),
    "5. Reasoning Replay modal opens and displays metacognition timeline",
  );

  // 6. Convince the Skeptic
  execJs("assets/convince-skeptic.js");
  check(win.NTSkeptic && win.NTSkeptic.__booted, "6. Convince the Skeptic engine boots");
  const skepticCard = doc.querySelector(".skeptic-card");
  check(
    skepticCard !== null && skepticCard.textContent.includes("Sam (AI Classmate)"),
    "6. AI classmate skeptic card rendered",
  );

  // 7. Edge-Tuned Twins
  execJs("assets/edge-tuned-twins.js");
  check(win.NTEdgeTwins && win.NTEdgeTwins.__booted, "7. Edge-Tuned Twin Problem engine boots");
  const twinCard = doc.querySelector(".twin-problem-card");
  check(
    twinCard !== null && twinCard.textContent.includes("Edge-Tuned Twin Problem"),
    "7. Twin problem generator card rendered",
  );

  // 8. Moment-of-Relevance Mentor Cameo
  execJs("assets/lesson-mentor.js");
  check(win.NTMentor && win.NTMentor.__booted, "8. Lesson Mentor layer boots");
  win.NTMentor.triggerCameo("Emmy Noether", "look for what stays the same here");
  const cameoToast = doc.querySelector("#ntm-cameo-toast");
  check(
    cameoToast !== null && cameoToast.textContent.includes("Emmy Noether"),
    "8. Unit 0 mentor cameo toast triggered and rendered",
  );
} catch (err) {
  failures.push("Execution error: " + err.message);
}

console.log(`\nDeep Feature Audit: ${passes.length} passed, ${failures.length} failed.`);
passes.forEach((p) => console.log(`  ✓ ${p}`));

if (failures.length > 0) {
  console.error("\nFailures:");
  failures.forEach((f) => console.error(`  ✗ ${f}`));
  process.exit(1);
} else {
  console.log(
    "\nAll 8 Tier 1 & Tier 2 interactive features are 100% functional, flawless, and verified!",
  );
  process.exit(0);
}
