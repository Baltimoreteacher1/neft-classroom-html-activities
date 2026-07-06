#!/usr/bin/env node
/**
 * validate-ai-hub.mjs — regression guard for curriculum/ai-hub/index.html
 *
 * This page has repeatedly regressed via concurrent rewrites (dead tutor chat
 * on 2026-06-17 and again 2026-07-06; duplicate panel-2 ids on 2026-07-05).
 * The Playwright suite only asserts element PRESENCE, so a rewrite that drops
 * a function definition still passes it. This validator fails the build when:
 *
 *  1. The inline <script> does not parse (syntax error).
 *  2. Any inline event handler (onclick/onchange/...) calls a function that is
 *     not defined anywhere in the script — the exact "dead button" bug class.
 *  3. Any function in the CRITICAL list (chat pipeline) is missing or never
 *     referenced.
 *  4. Any element id is duplicated (getElementById silently picks the first).
 *
 * Runs via `npm run validate:ai-hub` (part of `npm run validate`, which the
 * pre-push qa:loop executes), so a regression cannot reach main unnoticed.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const filePath = resolve(repoRoot, "curriculum/ai-hub/index.html");
const src = readFileSync(filePath, "utf8");

const failures = [];

// ---------------------------------------------------------------- script text
const scriptBlocks = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
  (m) => m[1],
);
if (scriptBlocks.length === 0) {
  failures.push("no inline <script> block found — page rewrite removed it?");
}
const script = scriptBlocks.join("\n;\n");

// 1. Syntax check (throws on parse error; never executes the code)
try {
  new Function(script);
} catch (e) {
  failures.push(`inline script does not parse: ${e.message}`);
}

// Helper: is an identifier defined as a callable in the script or on window?
function isDefined(fn) {
  if (fn.startsWith("Controller.") || fn.startsWith("UI.")) {
    const method = fn.split(".")[1];
    return (
      new RegExp(`(?:^|[\\s,{])${method}\\s*\\(`, "m").test(script) ||
      new RegExp(`${method}\\s*:`, "m").test(script)
    );
  }
  if (/^(event|window|document|localStorage|console)\./.test(fn)) return true;
  return (
    new RegExp(`function\\s+${fn}\\s*\\(`).test(script) ||
    new RegExp(`window\\.${fn}\\s*=`).test(script) ||
    new RegExp(`(?:const|let|var)\\s+${fn}\\s*=`).test(script)
  );
}

// 2. Inline handler sweep — static HTML AND handlers inside JS template strings
const handlerNames = new Set();
const JS_KEYWORDS = new Set(["if", "for", "while", "switch", "return", "new"]);
for (const m of src.matchAll(
  /on(?:click|change|dblclick|keydown|keyup|input|submit)=\\?"\s*([A-Za-z_$][\w$.]*)\s*\(/g,
)) {
  if (!JS_KEYWORDS.has(m[1])) handlerNames.add(m[1]);
}
for (const fn of [...handlerNames].sort()) {
  if (!isDefined(fn)) {
    failures.push(
      `inline handler calls ${fn}() but no definition exists (dead button)`,
    );
  }
}

// 3. Critical chat pipeline — each must be DEFINED and REFERENCED
const CRITICAL = [
  "showTypingIndicator",
  "hideTypingIndicator",
  "startTutorChat",
  "sendChatAnswer",
  "appendTutorMessage",
  "buildSessionDialogues",
  "drawVisualModel",
  "setParentLang",
  "submitPrompt",
];
for (const fn of CRITICAL) {
  if (!new RegExp(`function\\s+${fn}\\s*\\(`).test(script)) {
    failures.push(`critical function ${fn} is not defined (tutor chat breaks)`);
  } else if (!new RegExp(`${fn}\\s*\\(`, "g").test(script.replace(new RegExp(`function\\s+${fn}\\s*\\(`), ""))) {
    failures.push(`critical function ${fn} is defined but never called`);
  }
}

// 4. Duplicate ids in the STATIC markup (JS-generated ids can't be seen here)
const staticHtml = src.replace(/<script>[\s\S]*?<\/script>/g, "");
const idCounts = new Map();
for (const m of staticHtml.matchAll(/\bid="([A-Za-z][\w-]*)"/g)) {
  idCounts.set(m[1], (idCounts.get(m[1]) || 0) + 1);
}
for (const [id, count] of idCounts) {
  if (count > 1) {
    failures.push(`duplicate id "${id}" appears ${count}× in static markup`);
  }
}

// ------------------------------------------------------------------- report
const checked = `${handlerNames.size} handlers, ${CRITICAL.length} critical fns, ${idCounts.size} ids`;
if (failures.length) {
  console.error(`ai-hub validation FAILED (${checked}):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(
    "\nThe AI Hub tutor page would ship broken. Fix curriculum/ai-hub/index.html before pushing.",
  );
  process.exit(1);
}
console.log(`ai-hub validation PASS ✅ (${checked})`);
