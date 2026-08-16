#!/usr/bin/env node
/**
 * audit-lesson-alignment.mjs — one report answering "does every part of this
 * lesson point at the same mathematics?"
 *
 * The two gates it reads are the enforcement; this is the VIEW. `validate:*`
 * answers yes/no for a build, and a yes/no cannot tell a curriculum author
 * which lessons deliberately have no interactive, how many mappings the ladder
 * guessed, or how many Learn It findings a human has actually read. Those are
 * the numbers that say whether the curriculum is aligned or merely passing.
 *
 * Everything here is derived. There is NO second curriculum registry: lesson
 * ids resolve against lessons/, tools against the real runtime resolver, topics
 * against data/ccss-standards.json, and decisions against the two review files.
 * Nothing is copied, so nothing can go stale.
 *
 *   node tools/audit-lesson-alignment.mjs [--json]
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractElements,
  lessonNumbers,
  lessonText,
  loadStandardTopics,
  readFleet,
  resolvedLearnItElement,
  toolNumbers,
  topicAgrees,
  withoutInteractives,
} from "./lib/interactive-alignment.mjs";
import { learnIt, scopeFindings } from "./lib/learn-it-scope.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const JSON_OUT = process.argv.includes("--json");
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const topics = loadStandardTopics(ROOT);
const fleet = readFleet(ROOT);
const canonical = fleet.filter((l) => l.canonical);

const toolReview = read("data/interactive-alignment-review.json");
const scopeReview = read("data/learn-it-scope-review.json");

const toolDecisions = new Map(
  (toolReview.reviewed || []).map((r) => [`${r.lessonId}|${r.slot}|${r.key}`, r]),
);
const scopeDecisions = new Map(
  (scopeReview.reviewed || []).map((r) => [`${r.lessonId}|${r.detector}|${r.subject}`, r]),
);

const count = (map, field) => {
  const out = {};
  for (const entry of map.values()) out[entry[field]] = (out[entry[field]] || 0) + 1;
  return out;
};

/* ── Interactive mappings ──────────────────────────────────────────────────── */

const tools = {
  lessons: canonical.length,
  mappings: 0,
  authored: 0,
  resolved: 0,
  unsafeFallback: 0,
  noInteractive: 0,
  flagged: 0,
  awaitingReview: 0,
  invalid: 0,
  missingLearnItTool: [],
};

for (const lesson of fleet) {
  const bare = withoutInteractives(lesson.config);
  const numbers = lessonNumbers(bare);
  const _text = lessonText(bare);
  const resolved = lesson.canonical ? await resolvedLearnItElement(lesson.config) : [];
  if (lesson.canonical) {
    if (!resolved.length) tools.noInteractive++;
    if (resolved[0]?.source === "fallback") tools.unsafeFallback++;
  }
  for (const element of [...extractElements(lesson.config), ...resolved]) {
    tools.mappings++;
    if (element.source === "authored") tools.authored++;
    else tools.resolved++;

    const flags = [];
    if (!topicAgrees(element.key, lesson.config.standard, topics)) flags.push("topic");
    const configured = toolNumbers(element.config);
    if (configured.size && [...configured.values()].every((v) => !numbers.has(v)))
      flags.push("numbers");
    if (element.source === "fallback") flags.push("fallback");
    if (!flags.length) continue;

    tools.flagged++;
    // Variants inherit the parent's decision, the way the gate does. A report
    // that disagrees with the gate it reports on is the drift this whole audit
    // exists to catch, so the inheritance rule is stated in both places or the
    // number here is fiction.
    const own = `${lesson.id}|${element.slot}|${element.key}`;
    const parent = `${lesson.parent || lesson.id}|${element.slot}|${element.key}`;
    if (!toolDecisions.has(own) && !toolDecisions.has(parent)) tools.awaitingReview++;
  }
}

// A review entry naming a lesson that no longer exists is an invalid mapping —
// a decision about something that is not there.
const lessonIds = new Set(fleet.map((l) => l.id));
for (const entry of toolReview.reviewed || []) {
  if (!lessonIds.has(entry.lessonId)) tools.invalid++;
}

/* ── Learn It scope ────────────────────────────────────────────────────────── */

const scope = {
  lessons: canonical.length,
  withLearnIt: 0,
  findings: 0,
  awaitingReview: 0,
  byDetector: {},
};

for (const lesson of canonical) {
  if (learnIt(lesson.config)) scope.withLearnIt++;
  for (const f of scopeFindings(lesson.config, topics.get(lesson.config.standard))) {
    scope.findings++;
    scope.byDetector[f.detector] = (scope.byDetector[f.detector] || 0) + 1;
    if (!scopeDecisions.has(`${lesson.id}|${f.detector}|${f.subject}`)) scope.awaitingReview++;
  }
}

const report = {
  lessonsReviewed: canonical.length,
  variants: fleet.length - canonical.length,
  interactives: { ...tools, classifications: count(toolDecisions, "classification") },
  learnItScope: { ...scope, classifications: count(scopeDecisions, "classification") },
};

if (JSON_OUT) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const pad = (n) => String(n).padStart(5);
console.log(
  `Lesson alignment — ${canonical.length} canonical lessons, ${report.variants} variants`,
);
console.log("");
console.log("INTERACTIVE MAPPINGS");
console.log(`${pad(tools.mappings)}  mappings audited`);
console.log(`${pad(tools.authored)}    authored by the lesson`);
console.log(`${pad(tools.resolved)}    resolved by engine/core/lesson-tool-resolver.js`);
console.log(`${pad(tools.unsafeFallback)}  unsafe fallback assignments        (target 0)`);
console.log(`${pad(tools.noInteractive)}  lessons deliberately no-interactive (not a failure)`);
console.log(`${pad(tools.flagged)}  flagged by a detector`);
for (const [k, v] of Object.entries(report.interactives.classifications))
  console.log(`${pad(v)}    reviewed ${k}`);
console.log(`${pad(tools.awaitingReview)}  awaiting review                    (target 0)`);
console.log(`${pad(tools.invalid)}  invalid mappings                   (target 0)`);
console.log("");
console.log("LEARN IT SCOPE");
console.log(`${pad(scope.withLearnIt)}  lessons with a Learn It`);
console.log(`${pad(scope.findings)}  findings`);
for (const [k, v] of Object.entries(scope.byDetector)) console.log(`${pad(v)}    ${k}`);
for (const [k, v] of Object.entries(report.learnItScope.classifications))
  console.log(`${pad(v)}    reviewed ${k}`);
console.log(`${pad(scope.awaitingReview)}  awaiting review                    (target 0)`);
console.log("");
console.log(
  "Reported, not judged: an unflagged lesson has not been individually read. The " +
    "detectors are structural evidence; the review files carry the instructional judgement.",
);
