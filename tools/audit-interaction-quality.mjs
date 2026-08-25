#!/usr/bin/env node
/* =============================================================================
 * audit-interaction-quality.mjs — is the student DOING the mathematics?
 * -----------------------------------------------------------------------------
 * Not "does this lesson have an interactive component" — every lesson does.
 * The question is whether the student manipulates the representation that
 * carries the concept, or answers an ordinary question inside an interactive
 * wrapper.
 *
 * The discriminator is the MANIPULABLE VISUAL: an interactive `kind` the
 * student can change and watch the mathematics respond. Answer-entry item types
 * (multiple-choice, guided-fill, open-response) are how a lesson ASKS; they are
 * not how a student explores. A lesson built only from those is a worksheet
 * with a submit button, however good its feedback.
 *
 * Grades:
 *   A  >=3 manipulable visuals, spread across more than one phase
 *   B  >=2 manipulable visuals, or 1 plus a build/construct practice type
 *   C  exactly 1 manipulable visual carrying the whole concept
 *   D  none — every interaction is answer entry
 *
 * Reports only. → reports/interaction-quality.{json,md}
 * ========================================================================== */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { assertNonEmpty } from "./lib/non-empty.mjs";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";

const LESSONS = "lessons";

/* The interactive-visual REGISTRY in engine/core/interactive-visual.js, read at
 * run time so a new kind cannot quietly fall outside this audit. */
const registrySrc = readFileSync("engine/core/interactive-visual.js", "utf8");
const REGISTERED = new Set([...registrySrc.matchAll(/^ {2}"([a-z0-9-]+)":/gm)].map((m) => m[1]));

/* Kinds whose component only DRAWS. Everything else in the registry accepts
 * student input and recomputes. `bar-chart`/`dot-plot`/`box-plot` route through
 * data-live.js, which carries an explicit What-if sandbox, so they count as
 * manipulable. Keep this list evidence-based: a kind belongs here only if its
 * component has no input path at all. */
const DISPLAY_ONLY = new Set([]);

/* Practice types where the student constructs rather than selects. */
const CONSTRUCTIVE_TYPES = new Set(["drag-sort", "fill-table", "matching-game", "plot-point"]);
const ANSWER_ENTRY_TYPES = new Set(["multiple-choice", "guided-fill", "open-response"]);

function walk(node, visit) {
  if (Array.isArray(node)) for (const c of node) walk(c, visit);
  else if (node && typeof node === "object") {
    visit(node);
    for (const v of Object.values(node)) walk(v, visit);
  }
}

/** Which top-level section of the config a node sits under — the closest thing
 * the data has to a lesson phase. */
function sectionsOf(config, predicate) {
  const hits = new Set();
  for (const [section, value] of Object.entries(config)) {
    let found = false;
    walk(value, (n) => {
      if (predicate(n)) found = true;
    });
    if (found) hits.add(section);
  }
  return [...hits];
}

const rows = [];
for (const id of readdirSync(LESSONS).sort()) {
  const path = join(LESSONS, id, "config.json");
  if (!existsSync(path)) continue;
  let config;
  try {
    config = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    continue;
  }

  const kinds = new Map();
  const types = new Map();
  walk(config, (n) => {
    if (typeof n.kind === "string" && REGISTERED.has(n.kind))
      kinds.set(n.kind, (kinds.get(n.kind) || 0) + 1);
    /* A `simulator` block is a scenario-sim mounted by lesson-renderer.js —
     * it carries no `kind`, so counting only `kind` reported 24 lessons as
     * having one fewer manipulable representation than they do, and reported
     * scenario-sim itself as an unused component. */
    if (n.simulator && typeof n.simulator === "object")
      kinds.set("scenario-sim", (kinds.get("scenario-sim") || 0) + 1);
    if (typeof n.type === "string") types.set(n.type, (types.get(n.type) || 0) + 1);
  });

  const manipulable = [...kinds.keys()].filter((k) => !DISPLAY_ONLY.has(k));
  const phases = sectionsOf(
    config,
    (n) =>
      (typeof n.kind === "string" && REGISTERED.has(n.kind) && !DISPLAY_ONLY.has(n.kind)) ||
      (n.simulator && typeof n.simulator === "object"),
  );
  const constructive = [...types.keys()].filter((t) => CONSTRUCTIVE_TYPES.has(t));
  const answerEntry = [...types.entries()]
    .filter(([t]) => ANSWER_ENTRY_TYPES.has(t))
    .reduce((a, [, n]) => a + n, 0);

  let grade;
  if (manipulable.length >= 3 && phases.length > 1) grade = "A";
  else if (manipulable.length >= 2 || (manipulable.length === 1 && constructive.length))
    grade = "B";
  else if (manipulable.length === 1) grade = "C";
  else grade = "D";

  const unit = Number(String(id).split("-")[0]);
  rows.push({
    id,
    unit: Number.isFinite(unit) ? unit : null,
    variant: /-group\d$/.test(id) ? "small-group" : /-catchup$/.test(id) ? "catch-up" : "core",
    title: config.title || config.lessonTitle || null,
    standard: config.standard || null,
    manipulableVisuals: manipulable.sort(),
    manipulableCount: manipulable.length,
    phasesWithVisuals: phases.sort(),
    constructiveTypes: constructive.sort(),
    answerEntryItems: answerEntry,
    grade,
  });
}

mkdirSync("reports", { recursive: true });
writeFileSync("reports/interaction-quality.json", `${JSON.stringify(rows, null, 2)}\n`);

const by = (pred) => rows.filter(pred);
const count = (g) => by((r) => r.grade === g).length;
const units = [...new Set(rows.map((r) => r.unit))].filter((u) => u != null).sort((a, b) => a - b);

let md = "# Interaction quality audit\n\n";
md += `${rows.length} lessons. A ${count("A")} · B ${count("B")} · C ${count("C")} · D ${count("D")}\n\n`;
md += "Grade = how many manipulable representations the student can act on.\n";
md += "D means every interaction in the lesson is answer entry.\n\n";
md += "| Unit | Lessons | A | B | C | D |\n|---|---|---|---|---|---|\n";
for (const u of units) {
  const r = by((x) => x.unit === u);
  const c = (g) => r.filter((x) => x.grade === g).length;
  md += `| ${u} | ${r.length} | ${c("A")} | ${c("B")} | ${c("C")} | ${c("D")} |\n`;
}
md += "\n## D — no manipulable representation\n\n";
md += "| Lesson | Variant | Standard | Answer-entry items | Title |\n|---|---|---|---|---|\n";
for (const r of by((x) => x.grade === "D")) {
  md += `| ${r.id} | ${r.variant} | ${r.standard || "—"} | ${r.answerEntryItems} | ${r.title || "—"} |\n`;
}
md += "\n## C — one manipulable representation carrying the concept\n\n";
md += "| Lesson | Variant | Visual | Standard | Title |\n|---|---|---|---|---|\n";
for (const r of by((x) => x.grade === "C")) {
  md += `| ${r.id} | ${r.variant} | ${r.manipulableVisuals.join(", ")} | ${r.standard || "—"} | ${r.title || "—"} |\n`;
}
writeFileSync("reports/interaction-quality.md", md);

assertNonEmpty(
  "lessons with interactive components",
  rows,
  "The lessons/ walk produced no rows — quality cannot be measured over an empty set.",
);
assertSweptEnough(
  "audit:interaction",
  rows,
  "Discovery for audit:interaction returned far fewer items than this gate's pinned floor — see data/sweep-floors.json.",
);
console.log(
  `interaction-quality: ${rows.length} lessons — A ${count("A")} · B ${count("B")} · C ${count("C")} · D ${count("D")}`,
);
console.log("→ reports/interaction-quality.{json,md}");
