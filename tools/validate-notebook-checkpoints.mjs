#!/usr/bin/env node
/**
 * validate-notebook-checkpoints.mjs — the build gate for notebook checkpoints.
 *
 * What this holds that nothing else can:
 *
 *  1. EVERY core lesson declares exactly two checkpoints, boxes 1-2, no gaps
 *     and no duplicates. Zero checkpoints FAILS — the whole point is that a
 *     student is asked to write in their notebook in every lesson, and a lesson
 *     that quietly opted out looks identical to one that was never reached.
 *     Declaring a third checkpoint (such as Box 3) FAILS.
 *  2. Every checkpoint names a phase id the ENGINE actually has, and a section
 *     THAT lesson actually ships. A checkpoint on a nonexistent phase renders
 *     nowhere and gates nothing, while looking authored.
 *  3. The canonical Math Notes model exists at the path the engine links, and
 *     every lesson resolves that same one — there is no per-lesson copy.
 *  4. The default prompt copy exists in exactly ONE place. Three copies drifting
 *     apart is the recurring defect shape in this repo, and this copy is a
 *     classroom norm: it must read identically in every lesson.
 *  5. The suspend_data guard is still wired — the notebook key in
 *     assets/canvas-bridge.js must match the engine's.
 *  6. COVERAGE IS PRINTED, both numbers: lessons with authored prompts and
 *     lessons running defaults. A silent 100%-default forever is the failure
 *     this reporting exists to expose, and it cannot be seen from a pass/fail.
 *
 * Self-tests its detectors against known-bad fixtures before sweeping, because a
 * gate that has stopped firing reports a perfectly checkpointed curriculum.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
// The denominator below is a user-visible number, and "pathway" already meant
// three different things across three surfaces. It is derived, never typed:
// tools/validate-pathway-counts.mjs owns the definitions and fails if any
// surface drifts from the generated manifest.
import { pathwayCounts } from "./lib/pathway-counts.mjs";

const ENGINE = "engine/core/notebook-checkpoint.js";
const BRIDGE = "assets/canvas-bridge.js";
const MODEL_IMAGE = "assets/math-notes/math-notes-model.svg";
const MODEL_PAGE = "curriculum/student-supports/math-notes/index.html";
const CORE = /^\d+-\d+$/;

// Mirrors engine/core/notebook-checkpoint.js PHASE_IDS, and is checked against
// it below rather than trusted.
const PHASE_IDS = [
  "warmup",
  "objectives",
  "launch",
  "explore",
  "practice",
  "connect",
  "reflect",
  "objectives-review",
];
// A checkpoint phase is only real if the lesson ships the section that renders
// it. Phases with no config section of their own are always available.
const PHASE_SECTION = {
  launch: "launch",
  explore: "explore",
  practice: "practice",
  connect: "connect",
  reflect: "reflect",
  warmup: "warmup",
};

let failures = 0;
function check(ok, msg) {
  if (!ok) {
    failures++;
    console.error(`  FAIL  ${msg}`);
  }
}

/* ── detector, used by both the self-test and the sweep ──────────────────── */

/** @returns {{errors: string[], authored: number}} */
function inspect(config) {
  const errors = [];
  const list = config?.notebook?.checkpoints;
  if (!Array.isArray(list) || list.length === 0) {
    return { errors: ["declares no notebook checkpoints"], authored: 0 };
  }
  if (list.length !== 2) errors.push(`has ${list.length} checkpoints, expected 2`);
  const boxes = list.map((c) => c?.box);
  if (boxes.includes(3))
    errors.push("box 3 is forbidden — lessons must declare exactly 2 checkpoints (boxes 1 and 2)");
  for (const want of [1, 2]) {
    const n = boxes.filter((b) => b === want).length;
    if (n === 0) errors.push(`missing box ${want}`);
    if (n > 1) errors.push(`box ${want} declared ${n} times`);
  }
  let authored = 0;
  for (const cp of list) {
    if (!cp || typeof cp !== "object") {
      errors.push("a checkpoint is not an object");
      continue;
    }
    const phase = String(cp.phase || "");
    if (!PHASE_IDS.includes(phase)) {
      errors.push(`box ${cp.box}: "${phase}" is not an engine phase id`);
    } else {
      const section = PHASE_SECTION[phase];
      if (section && !config[section]) {
        errors.push(`box ${cp.box}: phase "${phase}" has no ${section} section in this lesson`);
      }
    }
    if (cp.prompt != null && String(cp.prompt).trim()) authored++;
    if (cp.capture?.maxLength != null && Number(cp.capture.maxLength) > 40) {
      errors.push(`box ${cp.box}: capture maxLength ${cp.capture.maxLength} exceeds 40`);
    }
  }
  return { errors, authored };
}

/* ── self-test: every detector must fire on a known-bad input ────────────── */

const base = { launch: {}, explore: {} };
const cp = (box, phase) => ({ box, phase });
const cases = [
  [{ ...base }, /no notebook checkpoints/, "a lesson with no notebook block"],
  [
    { ...base, notebook: { checkpoints: [cp(1, "launch")] } },
    /1 checkpoints|missing box 2/,
    "a lesson missing box 2",
  ],
  [
    { ...base, notebook: { checkpoints: [cp(1, "launch"), cp(2, "explore"), cp(3, "practice")] } },
    /3 checkpoints|expected 2|box 3 is forbidden/,
    "a lesson declaring 3 checkpoints (box 3 reintroduced)",
  ],
  [
    { ...base, notebook: { checkpoints: [cp(1, "launch"), cp(1, "explore")] } },
    /box 1 declared 2 times/,
    "a duplicated box",
  ],
  [
    { ...base, notebook: { checkpoints: [cp(1, "launch"), cp(2, "nope")] } },
    /not an engine phase id/,
    "a nonexistent phase id",
  ],
  [
    {
      launch: {},
      notebook: { checkpoints: [cp(1, "launch"), cp(2, "explore")] },
    },
    /has no explore section/,
    "a phase the lesson does not ship",
  ],
];
console.log("notebook-checkpoints: self-testing detectors");
for (const [config, pattern, name] of cases) {
  const { errors } = inspect(config);
  check(pattern.test(errors.join(" | ")), `detector stopped firing for ${name}`);
}
// …and must NOT fire on a good one.
{
  const good = {
    ...base,
    notebook: { checkpoints: [cp(1, "launch"), cp(2, "explore")] },
  };
  const { errors } = inspect(good);
  check(errors.length === 0, `a valid lesson was rejected: ${errors.join(", ")}`);
}

/* ── 1. engine + bridge contract ─────────────────────────────────────────── */

const engineSrc = readFileSync(ENGINE, "utf8");
for (const id of PHASE_IDS) {
  check(engineSrc.includes(`"${id}"`), `engine PHASE_IDS no longer contains "${id}"`);
}
const engineKey = engineSrc.match(/NOTEBOOK_STATE_KEY\s*=\s*"([^"]+)"/)?.[1];
const bridgeKey = readFileSync(BRIDGE, "utf8").match(/NOTEBOOK_STATE_KEY\s*=\s*"([^"]+)"/)?.[1];
check(!!engineKey, "the engine no longer declares NOTEBOOK_STATE_KEY");
check(
  !!bridgeKey && bridgeKey === engineKey,
  `the suspend_data guard key drifted: engine "${engineKey}" vs bridge "${bridgeKey}"`,
);
const bridgeSrc = readFileSync(BRIDGE, "utf8");
check(
  bridgeSrc.includes("withoutNotebook("),
  "assets/canvas-bridge.js no longer strips the notebook `custom` slice from suspend_data",
);
// The save/resume engine captures every form field on the page by id, so the
// typed capture has a SECOND route into suspend_data that the `custom` guard
// cannot see. Both doors, both pinned.
check(
  bridgeSrc.includes("withoutNotebookFields("),
  "assets/canvas-bridge.js no longer strips notebook FIELDS from suspend_data",
);
const enginePrefix = engineSrc.match(/NOTEBOOK_FIELD_PREFIX\s*=\s*"([^"]+)"/)?.[1];
const bridgePrefix = bridgeSrc.match(/NOTEBOOK_FIELD_PREFIX\s*=\s*"([^"]+)"/)?.[1];
check(
  !!enginePrefix && enginePrefix === bridgePrefix,
  `the notebook field prefix drifted: engine "${enginePrefix}" vs bridge "${bridgePrefix}"`,
);

/* ── 2. one canonical model, resolved identically everywhere ─────────────── */

check(existsSync(MODEL_IMAGE), `the Math Notes model is missing at /${MODEL_IMAGE}`);
check(existsSync(MODEL_PAGE), `the Math Notes page is missing at /${MODEL_PAGE}`);
check(
  engineSrc.includes(`"/${MODEL_IMAGE}"`),
  "the engine no longer points at the canonical Math Notes image path",
);
// A per-lesson copy of the model is exactly what this design exists to prevent.
const strays = readdirSync("lessons")
  .filter((d) => CORE.test(d))
  .filter((d) => existsSync(join("lessons", d, "math-notes-model.svg")));
check(strays.length === 0, `per-lesson copies of the Math Notes model: ${strays.join(", ")}`);

/* ── 3. the default copy lives in exactly one place ──────────────────────── */

const DEFAULT_STRINGS = [
  "Start a new page. Write today's lesson number and the date at the top.",
  "Copy the rule, formula, or model from the screen into your notebook.",
  "Work these problems in your notebook, not on the screen.",
  "I wrote this in my notebook.",
  "Write it in your notebook first, then check the box to keep going.",
];
const SEARCH_DIRS = ["engine", "assets", "shared", "curriculum", "tools", "scripts"];
function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(js|mjs|cjs|html|css|json)$/.test(e.name)) out.push(p);
  }
  return out;
}
const sources = SEARCH_DIRS.filter(existsSync).flatMap((d) => walk(d));
for (const s of DEFAULT_STRINGS) {
  const holders = sources.filter((f) => {
    if (f === "tools/validate-notebook-checkpoints.mjs") return false; // this gate quotes them to check them
    return readFileSync(f, "utf8").includes(s);
  });
  check(
    holders.length === 1 && holders[0] === ENGINE,
    `default copy "${s.slice(0, 40)}…" lives in ${holders.length} place(s): ${holders.join(", ") || "none"} — it must live only in ${ENGINE}`,
  );
}

/* ── 4. sweep every core lesson + coverage report ────────────────────────── */

const ids = readdirSync("lessons")
  .filter((d) => CORE.test(d))
  .sort();
let withAuthored = 0;
let withDefaults = 0;
let totalAuthoredBoxes = 0;
for (const id of ids) {
  const file = join("lessons", id, "config.json");
  if (!existsSync(file)) {
    check(false, `${id}: no config.json`);
    continue;
  }
  const config = JSON.parse(readFileSync(file, "utf8"));
  const { errors, authored } = inspect(config);
  for (const e of errors) check(false, `${id}: ${e}`);
  totalAuthoredBoxes += authored;
  if (authored === 2) withAuthored++;
  else withDefaults++;
}

/* ── 5. the pathway gap, stated out loud ─────────────────────────────────── */

// A number that counts only core reads as full coverage of a curriculum that
// actually serves 288 student-reachable pathways. The small-group (group1 /
// group2) and catch-up variants are rendered by engine/core/small-group-
// renderer.js, which never calls createApp() — so both halves of this feature
// (the block, mounted in app.js renderPhase, and the gate in navigateTo) are
// UNREACHABLE there. Their configs do carry launch/explore sections,
// so attach-notebook-checkpoints.mjs would write checkpoints into each
// one that render nowhere and gate nothing: authored, inert, and invisible.
//
// Until that renderer grows its own checkpoint surface, a checkpoint on a
// variant is a defect, not coverage. This gate says so in both directions —
// it FAILS if one appears, and it PRINTS the gap on every run so it cannot be
// mistaken for a solved problem.
const VARIANT = /^(\d+-\d+)-(group1|group2|catchup)$/;
const variants = readdirSync("lessons")
  .filter((d) => VARIANT.test(d))
  .sort();
const variantWithCheckpoints = [];
const byType = { group1: 0, group2: 0, catchup: 0 };
for (const id of variants) {
  byType[id.match(VARIANT)[2]]++;
  const file = join("lessons", id, "config.json");
  if (!existsSync(file)) continue;
  if (JSON.parse(readFileSync(file, "utf8")).notebook) variantWithCheckpoints.push(id);
}
check(
  variantWithCheckpoints.length === 0,
  `these variant pathways declare notebook checkpoints, but small-group-renderer.js cannot render or gate them — they would be inert: ${variantWithCheckpoints.join(", ")}`,
);

console.log(
  `notebook checkpoints — ${ids.length} core lessons | authored prompts: ${withAuthored} | running defaults: ${withDefaults} | authored boxes: ${totalAuthoredBoxes}/${ids.length * 2}`,
);
const reachable = ids.length + variants.length;
const { LESSON_ROUTES } = pathwayCounts();
check(
  reachable === LESSON_ROUTES,
  `this gate counts ${reachable} lesson routes but the launch manifest says ${LESSON_ROUTES} — one of them is stale`,
);
console.log(
  `  PATHWAY COVERAGE: ${ids.length}/${reachable} student-reachable pathways carry checkpoints. ` +
    `${variants.length} do NOT (group1 ${byType.group1}, group2 ${byType.group2}, catch-up ${byType.catchup}) — ` +
    "they use a different renderer (small-group-renderer.js, six tabs) with no checkpoint surface yet. " +
    "This is a known, unclosed gap, not an exemption.",
);
if (withDefaults === ids.length) {
  console.log(
    "  NOTE: every lesson is on the default copy. That is the intended day-one floor, not the destination — the default count is expected to fall as prompts are authored.",
  );
}

if (failures) {
  console.error(`FAIL validate:notebook-checkpoints — ${failures} problem(s)`);
  process.exit(1);
}
console.log("PASS validate:notebook-checkpoints");
