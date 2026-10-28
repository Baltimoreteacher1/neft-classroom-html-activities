#!/usr/bin/env node
/* =============================================================================
 * qa-run.test.mjs — pins the safety properties of the parallel QA scheduler.
 * -----------------------------------------------------------------------------
 * `scripts/qa-run.mjs` made the pre-push gate ~2.5x faster by running checks
 * concurrently instead of serially. The whole value of that depends on one
 * claim: it still runs EVERYTHING the serial loop ran. A scheduler that gets
 * fast by quietly dropping a gate is the worst possible outcome here — it looks
 * like a win on every run until the day it lets a broken deploy through.
 *
 * So this test reads the OLD serial definition out of scripts/qa-loop.sh (still
 * on disk, still the fallback) and asserts the new full set covers it. If
 * someone edits either list, this fails and names the missing check.
 * ========================================================================== */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COVERAGE,
  ENHANCEMENTS_LESSONS,
  expand,
  GATE,
  narrowStudioSweeps,
  needsOf,
  packageScriptsDelta,
  resolveSet,
  scopeFor,
  studioLessonSubset,
  testEnv,
} from "../scripts/qa-run.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
};

/* --- 1. The serial loop's candidate list, read from the shell script -------- */
const sh = readFileSync(join(ROOT, "scripts/qa-loop.sh"), "utf8");
const block = sh.match(/CANDIDATES=\(([\s\S]*?)\n\)/);
check(block, "could not find CANDIDATES=( ... ) in scripts/qa-loop.sh");

const serialNames = (block?.[1] ?? "")
  .split("\n")
  .map((l) => l.replace(/#.*/, "").trim())
  .filter(Boolean)
  .filter((n) => pkg.scripts[n]); // the shell list intentionally names some that don't exist

check(
  serialNames.length >= 12,
  `expected the serial loop to name 12+ real scripts, found ${serialNames.length}`,
);

const serialExpanded = new Set(resolveSet(serialNames));
const fullSet = new Set(resolveSet(GATE));

for (const name of serialExpanded) {
  check(
    fullSet.has(name),
    `qa-run's FULL set no longer runs "${name}", which scripts/qa-loop.sh runs`,
  );
}

/* --- 2. No check may appear twice (that was the 24s of duplicate work) ------ */
const list = resolveSet(GATE);
check(list.length === new Set(list).size, "qa-run's FULL set contains a duplicate check");

/* --- 3. `validate` must be expanded, not run as one opaque step ------------- */
check(
  !fullSet.has("validate"),
  "`validate` should expand into its members, not run as a single serial step",
);
check(
  fullSet.has("validate:math") && fullSet.has("eval:small-groups"),
  "`validate` members are missing from the FULL set",
);

/* --- 4. build is a barrier -------------------------------------------------- */
check(needsOf("build").length === 0, "build must not depend on anything");
for (const c of list) {
  if (c === "build") continue;
  check(
    needsOf(c).includes("build"),
    `"${c}" may run concurrently with the build, which rewrites the tree it reads`,
  );
}

/* --- 5. Change scoping is default-deny -------------------------------------- */
check(
  scopeFor(["some/path/nobody/mapped.xyz"]) === null,
  "an unmapped path must escalate to the FULL gate",
);
check(scopeFor([]) === null, "an empty change set must escalate to the FULL gate");

const scoped = scopeFor(["lessons/1-1/config.json"]);
check(
  Array.isArray(scoped) && scoped.includes("validate:math"),
  "a lesson config change must pull in validate:math",
);
check(
  Array.isArray(scoped) && !scoped.includes("validate:js-syntax"),
  "a JSON-only change should not pay for the 23s js-syntax sweep",
);
check(
  scopeFor(["curriculum/showcase/showcase.js"])?.includes("validate:js-syntax"),
  "a .js change must pull in validate:js-syntax",
);
check(
  scopeFor(["curriculum/plan-notes/plan-notes.js"])?.includes("validate:plan-notes"),
  "a plan-notes change must pull in validate:plan-notes — coverage that names the file but not the gate is how stale vocab shipped",
);
const readingContentScope = scopeFor(["tools/validate-reading-adventures.mjs"]);
check(
  Array.isArray(readingContentScope) &&
    readingContentScope.includes("validate:access-lab") &&
    readingContentScope.includes("test") &&
    readingContentScope.includes("validate:js-syntax") &&
    readingContentScope.includes("check"),
  "the Reading Adventures and Strategy Academy content validator must run its Access Lab, unit, syntax, and static checks without escalating to the full repository gate",
);
/* package.json: scripts-only edits may skip the full gate; everything else may not. */
const pj = (o) => JSON.stringify(o);
const base = {
  name: "x",
  dependencies: { a: "1" },
  scripts: { build: "vite build", t: "node t.mjs" },
};
const withScripts = (scripts, rest = {}) => pj({ ...base, ...rest, scripts });
const d1 = packageScriptsDelta(
  pj(base),
  withScripts({ ...base.scripts, "validate:new": "node v.mjs" }),
);
check(
  d1.safe && d1.changed.join() === "validate:new",
  "a new non-build script is a safe scripts-only edit",
);
check(
  !packageScriptsDelta(pj(base), withScripts({ ...base.scripts, build: "vite build && x" })).safe,
  "editing the build script is NOT safe",
);
check(
  !packageScriptsDelta(
    pj({
      ...base,
      scripts: { ...base.scripts, build: "npm run gen && vite build", gen: "node g.mjs" },
    }),
    pj({
      ...base,
      scripts: { ...base.scripts, build: "npm run gen && vite build", gen: "node g2.mjs" },
    }),
  ).safe,
  "editing a script the build chain runs is NOT safe",
);
check(
  !packageScriptsDelta(pj(base), withScripts(base.scripts, { dependencies: { a: "2" } })).safe,
  "a dependency change is NOT safe",
);
check(
  !packageScriptsDelta(pj(base), withScripts(base.scripts, { type: "module" })).safe,
  "a new top-level field is NOT safe",
);
check(
  !packageScriptsDelta(pj(base), withScripts({ ...base.scripts, postinstall: "node p.mjs" })).safe,
  "a lifecycle script is NOT safe",
);
check(!packageScriptsDelta("{", pj(base)).safe, "an unparseable base is NOT safe");
check(
  scopeFor(["package.json"]) === null,
  "without proof, package.json stays uncovered (default-deny)",
);
const pkgScope = scopeFor(["package.json"], {
  packageDelta: { safe: true, changed: ["validate:extra-help", "deploy", "no-such-script"] },
});
check(
  Array.isArray(pkgScope) &&
    pkgScope.includes("test") &&
    pkgScope.includes("validate:gate-coverage"),
  "a proven scripts-only package.json edit runs test + gate-coverage",
);
check(
  Array.isArray(pkgScope) && !pkgScope.includes("deploy") && !pkgScope.includes("no-such-script"),
  "a changed script joins the run only if it is a read-only gate member — never `deploy`",
);
check(
  scopeFor(["package.json", "some/unknown/file.txt"], {
    packageDelta: { safe: true, changed: [] },
  }) === null,
  "a proven package.json edit does not excuse another uncovered path",
);
check(
  testEnv("test", ["test"], "/tmp/c.txt", {
    baseManifestsFile: "/tmp/b.json",
    packageScriptsOnly: true,
  }).QA_TEST_PKG_SCRIPTS_ONLY === "1",
  "the scripts-only proof reaches the test runner",
);
check(
  testEnv("test", ["test"], null, { packageScriptsOnly: true }).QA_TEST_PKG_SCRIPTS_ONLY ===
    undefined,
  "no change list means no proof is forwarded",
);
check(
  testEnv("validate:static", ["test"], "/tmp/c.txt", { packageScriptsOnly: true })
    .QA_TEST_PKG_SCRIPTS_ONLY === undefined,
  "only the test check receives the proof",
);
check(
  Array.isArray(scopeFor(["sitemap.xml"])) && scopeFor(["sitemap.xml"]).includes("test"),
  "a sitemap.xml change must be covered (not escalate to the full gate) and run test for tools/sitemap.test.mjs",
);
check(
  scopeFor(["scripts/generate-worksheets.mjs"])?.includes("validate:worksheet-audience"),
  "a worksheet generator change must pull in validate:worksheet-audience",
);
check(
  scopeFor([".github/workflows/predeploy-verify.yml"])?.includes("test"),
  "a workflow edit must run test so a missing npm run X is caught by ci-scripts-exist",
);
check(
  scopeFor(["curriculum/projects/studio/unit-1/index.html"])?.includes(
    "validate:project-studio-browser",
  ),
  "a Project Studio edit must pull in validate:project-studio-browser",
);
check(
  scopeFor(["tools/generate-project-studio.mjs"])?.includes("validate:project-studio-browser") &&
    scopeFor(["tools/generate-project-studio.mjs"])?.includes("validate:unit-placement"),
  "the Project Studio generator must pull in Studio and unit placement gates",
);
check(
  scopeFor(["curriculum/fluency/unit-1-workshop.html"])?.includes(
    "validate:fluency-workshops-browser",
  ),
  "a Fluency Workshop edit must pull in validate:fluency-workshops-browser",
);
check(
  scopeFor(["curriculum/learning-labs/lab-1-1/index.html"])?.includes(
    "validate:learning-labs-browser",
  ),
  "a Learning Lab edit must pull in validate:learning-labs-browser",
);
check(
  scopeFor(["families/unit-1-week-1.html"])?.includes("verify:families") &&
    scopeFor(["families/unit-1-week-1.html"])?.includes("validate:homework"),
  "a families/homework edit must pull in verify:families and validate:homework",
);

/* --- 6. Every check named in the coverage table must actually exist --------- */
for (const [re, checks] of COVERAGE) {
  for (const c of checks) {
    check(pkg.scripts[c], `coverage rule ${re} names "${c}", which is not an npm script`);
  }
}

/* --- 7. The expander must refuse to reorder impure chains ------------------- */
check(
  expand("build").join() === "build",
  "`build` is not a pure npm-run chain and must stay atomic",
);

/* --- 6. The build-idempotency test is skipped only when this run built ----- */
/* tools/build-injectors-idempotent.test.mjs re-runs the whole build (~125s) and
 * is redundant ONLY when `build` + `build:generated-fresh` ran in the same gate.
 * Handing the flag to any other check, or to `test` in a run with no build,
 * would silently drop that property. */
check(
  testEnv("test", ["build", "test"]).QA_BUILD_VERIFIED === "1",
  "test must be told the build ran when `build` is in the same run",
);
check(
  testEnv("test", ["test"]).QA_BUILD_VERIFIED !== "1",
  "test must NOT be told the build ran when `build` is not part of the run",
);
check(
  testEnv("validate:hub", ["build", "validate:hub"]).QA_BUILD_VERIFIED !== "1",
  "only `test` may receive QA_BUILD_VERIFIED",
);
check(
  testEnv("test", ["test"], "/tmp/changed.txt").QA_TEST_SCOPE_FILES === "/tmp/changed.txt",
  "`test` is handed the change list so it can scope itself",
);
check(
  testEnv("test", ["test"]).QA_TEST_VERIFY === "1" &&
    testEnv("test", ["test"]).QA_TEST_SCOPE_FILES === undefined,
  "a gated `test` always verifies its reads, but is scoped only when a change list exists",
);
check(
  testEnv("validate:hub", ["validate:hub"], "/tmp/changed.txt").QA_TEST_SCOPE_FILES === undefined &&
    testEnv("validate:hub", ["validate:hub"]).QA_TEST_VERIFY === undefined,
  "only `test` may receive the scoping variables",
);
process.env.QA_TEST_SCOPE_FILES = "/leaked";
check(
  testEnv("test", ["test"]).QA_TEST_SCOPE_FILES === undefined,
  "an inherited QA_TEST_SCOPE_FILES must not leak into a run that has no change list",
);
delete process.env.QA_TEST_SCOPE_FILES;
check(
  fullSet.has("build") && fullSet.has("test"),
  "the full gate must contain both `build` and `test` (test relies on build ran)",
);

/* --- 8. Studio browser sweeps narrow only for lesson-scoped change sets ----- */
/* validate:studio-lab-browser costs ~240s for 144 pages. A change confined to
 * one lesson's files may drive only that lesson's pages; ANY other path must
 * keep the full sweep (default-deny, like COVERAGE). */
const sub = (paths) => studioLessonSubset(paths);
check(
  sub(["data/practice-studio/2-1.json"])?.join() === "2-1",
  "one lesson's studio data narrows to it",
);
check(
  sub(["lessons/6-2/config.json", "math/practice-studio/6-2/index.html"])?.join() === "6-2",
  "a lesson config edit plus its regenerated studio page narrows to that lesson",
);
check(
  sub([
    "math/practice-studio/3-3/challenge/index.html",
    "lessons/6-2-part2/homework.html",
  ])?.join() === "3-3,6-2",
  "a Challenge page and a lesson variant folder map to their lessons",
);
check(
  sub(["math/unit-4/4-2-practice-studio-challenging/index.html"])?.join() === "4-2",
  "Unit 4 pages map to lessons",
);
check(sub(["data/practice-studio-u4/4-3.json", "docs/x.md"])?.join() === "4-3", "docs are inert");
for (const shared of [
  "assets/studio/runtime.js",
  "assets/studio-v2.css",
  "assets/u4-studio.js",
  "data/practice-studio/worlds.json",
  "math/practice-studio/index.html",
  "math/practice-studio/boost/index.html",
  "scripts/generate-practice-studios.mjs",
  "scripts/lib/practice-studio-bench.mjs",
  "tools/verify-studio-lab-browser.mjs",
  "curriculum/learning-labs/shared/math.mjs",
  "shared/save-resume/save-resume-engine.js",
  "math/unit-4/some-other-page/index.html",
  "lessons/README.json",
]) {
  check(
    sub([shared]) === null,
    `${shared} can affect every studio page and must keep the full sweep`,
  );
  check(
    sub(["data/practice-studio/2-1.json", shared]) === null,
    `a lesson edit beside ${shared} must still run the full sweep`,
  );
}
check(sub([]) === null, "an empty change set never narrows");
const studioChecks = [
  "test",
  "validate:studio-enhancements-browser",
  "validate:studio-lab-browser",
];
const readingRoomOnly = narrowStudioSweeps(studioChecks, [
  "access-practice-lab/content/reading-room/lessons.json",
  "tools/author-reading-room-sustained-reads.mjs",
  "scripts/qa-run.mjs",
]);
check(
  readingRoomOnly.checks.join() === "test" && Object.keys(readingRoomOnly.args).length === 0,
  "Reading Room changes keep general tests without opening unrelated math studio pages",
);
const narrowA = narrowStudioSweeps(studioChecks, ["data/practice-studio/2-1.json"]);
check(
  narrowA.args["validate:studio-lab-browser"]?.join() === "2-1" &&
    !narrowA.checks.includes("validate:studio-enhancements-browser") &&
    narrowA.checks.includes("validate:studio-lab-browser") &&
    narrowA.checks.includes("test"),
  "a 2-1 edit drives 2-1's benches and drops the enhancements sweep, which opens no 2-1 page",
);
const narrow35 = narrowStudioSweeps(studioChecks, ["data/practice-studio/3-5.json"]);
check(
  narrow35.checks.includes("validate:studio-enhancements-browser"),
  "a 3-5 edit keeps the enhancements sweep, which opens 3-5",
);
const full = narrowStudioSweeps(studioChecks, ["assets/studio/runtime.js"]);
check(
  full.checks.length === studioChecks.length && Object.keys(full.args).length === 0,
  "a shared runtime edit keeps both sweeps in full",
);
/* ENHANCEMENTS_LESSONS must name every lesson the enhancements verifier opens. */
const enhSrc = readFileSync(join(ROOT, "tools/verify-studio-enhancements-browser.mjs"), "utf8");
for (const [, page] of enhSrc.matchAll(/\/math\/practice-studio\/([^/"`]+)\//g)) {
  const id = studioLessonSubset([`math/practice-studio/${page}/index.html`]);
  check(
    id === null || ENHANCEMENTS_LESSONS.includes(id[0]),
    `the enhancements verifier opens ${page}, which ENHANCEMENTS_LESSONS does not list`,
  );
}
check(
  /\/math\/unit-4\/\$\{d\}\//.test(enhSrc) && /percent-practice-studio/.test(enhSrc),
  "the enhancements verifier's Unit 4 pages changed shape; re-check ENHANCEMENTS_LESSONS",
);

/* -------------------------------------------------------------------------- */
if (failures.length) {
  console.error("qa-run.test.mjs FAILED:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `✓ qa-run scheduler: ${fullSet.size} checks, covers all ${serialExpanded.size} from the serial loop, build is a barrier, scoping is default-deny.`,
);
