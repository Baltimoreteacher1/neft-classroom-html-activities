#!/usr/bin/env node
/**
 * validate-preunit-project.mjs — structural contract for the Pre-Unit
 * culminating project (math/pre-unit/projects/).
 *
 * This checks STRUCTURE, not the presence of strings. A validator that greps
 * for "Level 2" passes a page whose Level 2 content was deleted and whose
 * heading survived; the checks below resolve ids, parse the inline script, and
 * cross-reference the shared configs and the pacing sources instead.
 *
 * What it pins, and why each one is a real failure mode:
 *   • The Pre-Unit is ASSEMBLED. Its five lessons live in
 *     data/pacing-unit-lessons.json, and every one of them must still exist in
 *     the curriculum manifest — a renamed or retired lesson silently strands the
 *     project's rationale.
 *   • Exactly three levels. The tier bar, the body class, and the level-gated
 *     content must all agree; a page with three buttons and no .lvl0-only block
 *     is a page whose Level 0 differentiation was lost.
 *   • Every answer-checking function the markup calls must exist in the inline
 *     script (a renamed handler is a dead button, and a dead button on a project
 *     page reads as "the check is broken").
 *   • No untaught mathematics. The Pre-Unit teaches division only; ratio,
 *     percent, expression and equation vocabulary must not appear.
 *   • Registration in the five shared projects-* configs — a page absent from
 *     projects-check-config.json is a SILENT no-op, which is exactly how three
 *     real failures hid before.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertNonEmpty } from "./lib/non-empty.mjs";
import { PROJECT_UNITS } from "./lib/project-units.mjs";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROUTE = "/math/pre-unit/projects/version-a/";
const PAGE = "math/pre-unit/projects/version-a/index.html";
const CHOOSER = "math/pre-unit/projects/index.html";
const KEY = "math/pre-unit/projects/answer-key/index.html";
const PRE_LESSONS = ["1-1", "2-6", "2-7", "6-1", "6-2"];

const failures = [];
const fail = (m) => failures.push(m);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));

/* ---------------------------------------------------------------- routes -- */
for (const rel of [PAGE, CHOOSER, KEY]) {
  if (!fs.existsSync(path.join(ROOT, rel))) fail(`${rel}: missing`);
}
if (!PROJECT_UNITS.includes("pre-unit")) {
  fail(
    "tools/lib/project-units.mjs no longer lists pre-unit — every projects-* layer would skip it",
  );
}
assertNonEmpty(
  "source lessons the pre-unit project draws on",
  PRE_LESSONS,
  "PRE_LESSONS is empty — every cross-lesson check below would pass over nothing.",
  3,
);
assertSweptEnough(
  "validate:preunit-project",
  PRE_LESSONS,
  "Discovery for validate:preunit-project returned far fewer items than this gate's pinned floor — see data/sweep-floors.json.",
);

if (failures.length) finish();

const html = read(PAGE);
const chooser = read(CHOOSER);

/* ------------------------------------------------------- the five lessons -- */
const authored = readJson("data/pacing-unit-lessons.json");
const pre = authored.units && authored.units.PRE;
if (!pre || !Array.isArray(pre.lessons)) {
  fail("data/pacing-unit-lessons.json no longer authors a PRE unit");
} else if (pre.lessons.join(",") !== PRE_LESSONS.join(",")) {
  fail(
    `the Pre-Unit sequence changed to ${pre.lessons.join(" → ")}; the project's mathematics was designed for ${PRE_LESSONS.join(" → ")} and must be re-audited`,
  );
}
const manifest = readJson("data/curriculum-launch-manifest.json");
const byId = new Map((manifest.lessons || []).map((l) => [l.id, l]));
for (const id of PRE_LESSONS) {
  if (!byId.has(id)) fail(`Pre-Unit lesson ${id} is not in the curriculum manifest`);
}

/* The project claims exactly the standards its five lessons carry. */
const lessonStandards = new Set(
  PRE_LESSONS.map((id) => byId.get(id)?.standard).filter((s) => s && /^6\./.test(s)),
);
const claimed = (html.match(/<meta name="nt-project-standards" content="([^"]*)"/) || [])[1];
if (!claimed) {
  fail(`${PAGE}: projects-meta never injected nt-project-standards`);
} else {
  for (const code of claimed.split(",").filter(Boolean)) {
    if (!lessonStandards.has(code)) {
      fail(
        `${PAGE}: claims ${code}, which no Pre-Unit lesson teaches (lessons carry ${[...lessonStandards].join(", ")})`,
      );
    }
  }
}

/* ------------------------------------------------------- exactly 3 levels -- */
for (const n of [0, 1, 2]) {
  if (!html.includes(`id="btn-lv${n}"`)) fail(`${PAGE}: level ${n} button is missing`);
  if (!new RegExp(`\\blvl${n}-only\\b`).test(html)) {
    fail(`${PAGE}: no .lvl${n}-only content — level ${n} has no differentiated material`);
  }
  if (!new RegExp(`body\\.level-${n}\\s+\\.lvl${n}-only`).test(html)) {
    fail(`${PAGE}: .lvl${n}-only is never revealed by body.level-${n}`);
  }
}
if (/id="btn-lv3"/.test(html))
  fail(`${PAGE}: a fourth level appeared; the contract is exactly three`);
if (!/<body class="level-1[^"]*"/.test(html)) fail(`${PAGE}: does not open on Level 1`);

/* Real scaffold fade: each level's gated content must be distinct text, not the
   same paragraph three times. */
const levelText = {};
for (const n of [0, 1, 2]) {
  const blocks = [...html.matchAll(new RegExp(`lvl${n}-only[^>]*>([\\s\\S]*?)</div>`, "g"))].map(
    (m) =>
      m[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
  );
  levelText[n] = blocks.join(" ");
}
if (levelText[0] && levelText[0] === levelText[1]) {
  fail(`${PAGE}: Level 0 and Level 1 show identical scaffolding — no fade`);
}
if (levelText[1] && levelText[1] === levelText[2]) {
  fail(`${PAGE}: Level 1 and Level 2 show identical scaffolding — no fade`);
}

/* ------------------------------------------------- three parts, six steps -- */
const panels = [...html.matchAll(/<div class="step-panel[^"]*" id="step-(\d+)">/g)].map((m) =>
  Number(m[1]),
);
if (panels.length !== 6) fail(`${PAGE}: expected 6 step panels, found ${panels.length}`);
for (const part of ["Part 1", "Part 2", "Part 3"]) {
  if (!html.includes(part)) fail(`${PAGE}: no step is labelled "${part}"`);
}
const stepsDecl = (html.match(/const STEPS = \[([\s\S]*?)\];/) || [])[1] || "";
const stepIds = [...stepsDecl.matchAll(/\{ id: (\d+)/g)].map((m) => Number(m[1]));
if (stepIds.join(",") !== panels.sort((a, b) => a - b).join(",")) {
  fail(`${PAGE}: the STEPS trail (${stepIds.join(",")}) does not match the panels on the page`);
}

/* ------------------------------------------- every handler the page calls -- */
const called = new Set(
  [...html.matchAll(/on(?:click|input|change)="([a-zA-Z_$][\w$]*)\(/g)].map((m) => m[1]),
);
const declared = new Set([...html.matchAll(/function ([a-zA-Z_$][\w$]*)\s*\(/g)].map((m) => m[1]));
/* window.foo = function () — the save/resume backup handlers are attached this
   way so the shared engine can call them too. */
for (const m of html.matchAll(/window\.([a-zA-Z_$][\w$]*)\s*=\s*function/g)) declared.add(m[1]);
for (const fn of called) {
  if (!declared.has(fn) && !/^(goStep|setLevel|toggleLanguage|readAloud)$/.test(fn)) {
    fail(`${PAGE}: ${fn}() is wired to a control but never defined — dead button`);
  }
}
for (const required of [
  "checkBuses",
  "checkPacks",
  "checkBanners",
  "checkBags",
  "checkRepair",
  "checkDesign",
  "parseValue",
  "saveWizard",
  "restoreWizard",
]) {
  if (!declared.has(required)) fail(`${PAGE}: ${required}() is missing`);
}

/* Every id a check function reads must exist in the markup. */
const referenced = new Set(
  /* Only ids read WITHOUT optional chaining are required to exist: the
     save/resume engine injects #student-name and #class-period at runtime, and
     the page reads those with ?. precisely because they may be absent. */
  [...html.matchAll(/getElementById\("([^"]+)"\)(?!\?)/g)]
    .map((m) => m[1])
    .filter((id) => id !== "body"),
);
const present = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const id of referenced) {
  if (!present.has(id)) fail(`${PAGE}: the script reads #${id}, which is not on the page`);
}

/* ------------------------------------------------------- no untaught math -- */
const body = html.slice(html.indexOf("<body"));
const visible = body
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .toLowerCase();
const UNTAUGHT = [
  ["ratio", /\bratios?\b/],
  ["unit rate", /\bunit rate\b/],
  ["percent", /\bpercent\b|%/],
  ["exponent", /\bexponent\b/],
  ["inequality", /\binequalit(?:y|ies)\b/],
  ["coordinate plane", /\bcoordinate plane\b/],
  ["surface area", /\bsurface area\b/],
];
for (const [label, re] of UNTAUGHT) {
  if (re.test(visible)) {
    fail(`${PAGE}: mentions ${label}, which no Pre-Unit lesson teaches`);
  }
}

/* ------------------------------------------------------ answers not given -- */
if (!/BUSES_SOLVED/.test(html)) {
  fail(
    `${PAGE}: the bus diagram has no solved gate — it would print the quotient the step asks for`,
  );
}
if (!/BUSES_SOLVED \? String\(busAnswer/.test(html)) {
  fail(`${PAGE}: the bus diagram no longer masks its result behind the solved gate`);
}
if (!/if \(!BUSES_SOLVED\)/.test(html)) {
  fail(`${PAGE}: the partner comparison no longer waits for the student's own answer`);
}

/* ---------------------------------------------------- shared registration -- */
const registrations = [
  ["shared/projects/projects-check-config.json", (c) => c.pages && c.pages[ROUTE]],
  ["shared/projects/projects-meta-config.json", (c) => c.pages && c.pages["pre-unit-a"]],
  ["shared/projects/projects-award-config.json", (c) => c.projects && c.projects[ROUTE]],
  ["shared/projects/projects-twist-config.json", (c) => c.projects && c.projects[ROUTE]],
  ["shared/projects/projects-partner-config.json", (c) => c.pages && c.pages[ROUTE]],
];
for (const [rel, get] of registrations) {
  if (!get(readJson(rel)))
    fail(`${rel}: no entry for the Pre-Unit project (the layer is a silent no-op)`);
}

/* Every ref in the check config must resolve to an element on the page. */
const checkCfg = readJson("shared/projects/projects-check-config.json").pages[ROUTE];
if (checkCfg) {
  for (const [stepId, step] of Object.entries(checkCfg.steps || {})) {
    if (!present.has(stepId)) fail(`projects-check-config: ${stepId} is not a panel on the page`);
    for (const check of step.checks || []) {
      if (!present.has(check.ref)) {
        fail(`projects-check-config: ${stepId} check ref #${check.ref} does not exist on the page`);
      }
    }
  }
  for (const skipped of checkCfg.skipFields || []) {
    if (!present.has(skipped)) fail(`projects-check-config: skipField #${skipped} does not exist`);
  }
}

/* ------------------------------------------------------------- discovery -- */
if (!chooser.includes(ROUTE)) fail(`${CHOOSER}: does not link the project`);
if (!chooser.includes("/math/pre-unit/projects/answer-key/")) {
  fail(`${CHOOSER}: does not link the teacher answer key`);
}
for (const surface of [
  "curriculum/projects/index.html",
  "math/projects/index.html",
  "math/projects/portfolio/index.html",
]) {
  if (!read(surface).includes(ROUTE))
    fail(`${surface}: the Pre-Unit project is not discoverable here`);
}

/* ------------------------------------------------------- pacing placement -- */
const pacing = read("assets/curriculum-district-pacing.js");
if (!pacing.includes('project: { path: "/math/pre-unit/projects/"')) {
  fail(
    "assets/curriculum-district-pacing.js: the Pre-Unit no longer carries its culminating project",
  );
}
if (/lessons: \[[^\]]*pre-unit/.test(pacing)) {
  fail(
    "assets/curriculum-district-pacing.js: the project was added to the LESSONS array — it is not a lesson",
  );
}

/* ---------------------------------------------------------------- a11y ---- */
if (!/aria-live="polite"/.test(html)) fail(`${PAGE}: feedback readouts are not announced`);
if (!/prefers-reduced-motion/.test(html)) fail(`${PAGE}: the celebration ignores reduced motion`);
for (const [, id] of html.matchAll(/<(?:input|textarea|select)[^>]*\sid="([^"]+)"/g)) {
  const labelled =
    new RegExp(`<label[^>]*for="${id}"`).test(html) ||
    new RegExp(`id="${id}"[^>]*aria-label=`).test(html) ||
    /hidden/.test((html.match(new RegExp(`<[^>]*id="${id}"[^>]*>`)) || [""])[0]);
  if (!labelled) fail(`${PAGE}: #${id} has no <label for> and no aria-label`);
}

finish();

function finish() {
  if (failures.length) {
    console.error(
      `Pre-Unit project validation failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`,
    );
    failures.forEach((f) => console.error("- " + f));
    globalThis.process.exit(1);
  }
  console.log(
    `Pre-Unit project validation passed: 3 levels, 6 steps across 3 parts, ${PRE_LESSONS.length} source lessons resolved, 5 shared configs registered, no untaught mathematics.`,
  );
}
