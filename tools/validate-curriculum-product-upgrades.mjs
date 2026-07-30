#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const hub = read("curriculum/index.html");
const product = read("assets/curriculum-product-upgrades.js");
const productCss = read("assets/curriculum-product-upgrades.css");
const launcher = read("assets/curriculum-student-launch.js");
const sidebar = read("assets/curriculum-sidebar.js");
const teacherWorkflow = read("assets/curriculum-teacher-workflow.js");
const privacy = read("curriculum/data-privacy/index.html");
const aiHub = read("curriculum/ai-hub/index.html");
const worker = read("public/sw.js");
const failures = [];
const passes = [];

function check(condition, message) {
  (condition ? passes : failures).push(message);
}

check(
  hub.includes("curriculum-product-upgrades.css") && hub.includes("curriculum-product-upgrades.js"),
  "curriculum page wires the product upgrade layer",
);
for (const marker of [
  "Teacher workspace",
  "Student lesson",
  "Family connection",
  "Find anything",
  "cpu-command-palette",
])
  check(product.includes(marker), `product layer includes ${marker}`);
check(
  product.includes("portableProgress") && product.includes("restoreProgress"),
  "progress can move between trusted devices",
);
check(
  product.includes("saveOffline") && product.includes("eduwonderlab-user-offline-v1"),
  "selected lesson can be saved for offline recovery",
);
check(
  !product.includes("Evidence and teacher approval") &&
    !product.includes("Retrieval practice is scheduled"),
  "retired evidence-approval checklist stays removed from the curriculum hub",
);
check(
  product.includes("WIDA 1–2") && product.includes("TWR explanation"),
  "teacher can launch WIDA and TWR support bundles",
);
check(
  teacherWorkflow.includes("Lesson Readiness") &&
    teacherWorkflow.includes("Common misconception") &&
    teacherWorkflow.includes("WIDA 1–2"),
  "teacher workflow preserves lesson-readiness and language-support guidance",
);
check(
  product.includes("recordLaunch") && product.includes("bestMs"),
  "time-to-launch is measured locally",
);
check(
  product.includes("Report an error") && product.includes("canonical curriculum manifest"),
  "feedback and content provenance are visible",
);
check(
  /min-height:\s*(?:44|48|52|68|72)px/.test(productCss),
  "new controls use accessible target sizes",
);
check(
  hub.includes("writing-mode: horizontal-tb") && hub.includes("inset: auto 8px 76px"),
  "mobile supports use a non-overlapping bottom sheet",
);
check(
  launcher.includes("function querySupports()") && launcher.includes('url.hash = "supports="'),
  "student launcher safely propagates learning supports",
);
check(
  sidebar.includes('dataset.lazyUnitCatalog = "1"') && sidebar.includes("function showOne"),
  "unit detail view keeps only the active card in the live DOM",
);
check(
  privacy.includes("Copy my curriculum data") &&
    privacy.includes("Delete curriculum data on this device"),
  "privacy page provides local export and deletion controls",
);
check(
  privacy.includes("AI tutor") && privacy.includes("legal name"),
  "privacy page explains AI data use in plain language",
);
check(
  worker.includes("/curriculum/data-privacy/") && worker.includes("curriculum-product-upgrades.js"),
  "service worker precaches the upgraded curriculum shell",
);
check(
  worker.includes("key !== USER_OFFLINE_CACHE"),
  "deploy cache cleanup preserves user-requested offline lessons",
);
check(
  !aiHub.includes("Include answers.") && !aiHub.includes("final target answer"),
  "AI Hub practice and hints do not request or reveal final responses",
);

console.log("curriculum product-upgrade validation");
passes.forEach((message) => console.log(`  PASS ${message}`));
failures.forEach((message) => console.log(`  FAIL ${message}`));
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
