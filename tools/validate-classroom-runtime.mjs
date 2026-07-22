#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const html = read("curriculum/runtime/index.html");
const config = read("curriculum/runtime/runtime-config.js");
const service = read("curriculum/runtime/runtime-service.js");
const controller = read("curriculum/runtime/runtime-controller.js");
const hub = read("curriculum/index.html");
const guided = read("assets/curriculum-guided-path.js");
const failures = [];
const passes = [];
const check = (condition, message) => (condition ? passes : failures).push(message);

const capabilities = [
  ["intent compiler", html.includes("teacher-intent") && service.includes("compileRuntime")],
  ["generated working interface", html.includes("lab-frame") && service.includes("LABS")],
  ["real-time co-pilot", html.includes("copilot-prompt") && controller.includes('mode: "teach"')],
  ["reasoning model", service.includes("modelReasoning") && html.includes("reasoning-confidence")],
  ["multi-specialist review", service.includes("reviewLesson") && html.includes("agent-reviews")],
  ["tool invention", service.includes("Factor Forge") && service.includes("Balance Bench")],
  [
    "voice and vision",
    controller.includes("SpeechRecognition") && controller.includes('mode: "photo"'),
  ],
  [
    "teacher-approved improvement",
    html.includes("approve-revision") && service.includes("proposeRevision"),
  ],
  [
    "collective strategy intelligence",
    service.includes("clusterStrategies") && html.includes("strategy-clusters"),
  ],
  [
    "controlled curriculum forks",
    service.includes("forkRuntime") && html.includes("fork-invariants"),
  ],
];
capabilities.forEach(([name, present]) => check(present, `runtime includes ${name}`));

check(hub.includes('href="/curriculum/runtime/"'), "curriculum hub links to the runtime");
check(
  config.includes('code: "en"') && config.includes('code: "es"'),
  "configuration declares English and Spanish",
);
check(!/code:\s*"(?:fr|de|it|pt|zh|ar)"/.test(config), "configuration declares no third language");
check(
  html.includes('<option value="en">English</option><option value="es">Español</option>'),
  "interface offers exactly English and Spanish",
);
check(!/<option value="(?:fr|de|it|pt|zh|ar)"/.test(html), "interface offers no third language");
check(
  controller.includes("tutorLanguage(currentRuntime.language)"),
  "AI calls use the allowlisted language mapper",
);
check(
  html.includes("No student names") && html.includes("de-identified"),
  "privacy boundary is visible at collection points",
);
check(
  html.includes("confidence") && html.includes("Teacher approves revision"),
  "inferences show confidence and require approval",
);
check(
  !controller.includes("innerHTML") && !service.includes("innerHTML"),
  "runtime does not inject untrusted HTML",
);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
check(ids.length === new Set(ids).size, "runtime HTML ids are unique");
check((html.match(/<h1\b/g) || []).length === 1, "runtime exposes one page-level heading");
check(html.includes('type="module" src="./runtime-controller.js"'), "runtime controller is wired");
check(
  !guided.includes("card.hidden") && !guided.includes("curriculum-unit-nav"),
  "unit-rail regression remains blocked",
);
check(
  !controller.includes("curriculum-unit-nav") && !controller.includes("curr-rail-item"),
  "runtime does not compete with curriculum unit navigation",
);

console.log("classroom runtime validation");
passes.forEach((message) => console.log(`  PASS ${message}`));
failures.forEach((message) => console.log(`  FAIL ${message}`));
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
