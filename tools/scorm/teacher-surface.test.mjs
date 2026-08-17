#!/usr/bin/env node
/**
 * teacher-surface.test.mjs — the SCORM generation boundary only builds packages
 * of STUDENT surfaces, and no spelling of a teacher path gets past it.
 *
 * Packaging a teacher route was never a content leak — the launch URL still
 * 401s — but the endpoint should not manufacture an assignment that opens a
 * password prompt for a class. This pins the refusal, and pins that the refusal
 * cannot be walked around with encoding or traversal.
 *
 * It also pins the thing that made this worth doing at all: functions/
 * _middleware.js (what actually 401s), the SCORM endpoint and the download
 * taxonomy must all be asking the SAME function. A security predicate kept in
 * three places fails silently in the dangerous direction — the stale copy does
 * not throw, it answers "student".
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildScormFiles, resolveTarget, TeacherSurfaceError } from "../../functions/_lib/scorm.js";
import { isTeacherSurface, normalizePath } from "../../functions/_lib/teacher-surface.js";
import { isTeacherSurface as taxonomyPredicate } from "../../scripts/lib/download-taxonomy.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
let passed = 0;
const failures = [];
const check = (name, fn) => {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
};

const build = (target) => buildScormFiles({ target, title: "Probe" });
const refuses = (target) => {
  try {
    build(target);
    return false;
  } catch (e) {
    return e instanceof TeacherSurfaceError;
  }
};

// --- 1. the happy path still works ------------------------------------------
check("a student lesson still produces a valid package", () => {
  const pkg = build("1-1");
  assert.ok(pkg.files["imsmanifest.xml"], "no manifest");
  assert.ok(pkg.files["index.html"], "no launch file");
  assert.equal(pkg.id, "1-1");
});

check("student activities and homework are unaffected", () => {
  for (const t of [
    "/lessons/1-1/homework.html",
    "/lessons/1-1/worksheet.html",
    "/ratio-color-mixer/",
    "math/games/practice-arcade?unit=3",
    "/curriculum/",
    "/lessons/1-1/family/",
    // "lesson-plan" contains "plan" but is not /curriculum/plan-notes, and
    // students open these. A loose prefix match here would break real packages.
    "/curriculum/lesson-plans/",
  ]) {
    assert.ok(!refuses(t), `refused a student surface: ${t}`);
  }
});

// --- 2. teacher surfaces are refused ----------------------------------------
check("teacher-only categories are refused at generation", () => {
  for (const t of [
    "/teacher-tools/",
    "/teacher-tools/scorm-builder/",
    "/lessons/1-1/teacher-notes/",
    "/math/unit-1/projects/answer-key/",
    "/curriculum/plan-notes",
    "/curriculum/plan-notes/unit-3",
    "/curriculum/planning/",
    "/curriculum/planning/index.html",
    "/admin/",
    "/teacher-dashboard/",
    "/lessons/2-4/teacher-notes/index.html",
    "/lessons/2-4/worksheet-answer-key.html",
  ]) {
    assert.ok(refuses(t), `packaged a teacher surface: ${t}`);
  }
});

check("a full URL to a teacher surface is refused too", () => {
  assert.ok(refuses("https://eduwonderlab.com/teacher-tools/"), "full-URL form got through");
});

check("the refusal does not leak how the gate decides", () => {
  try {
    build("/teacher-tools/");
    assert.fail("did not refuse");
  } catch (e) {
    const m = e.message;
    assert.match(m, /teacher-only/i);
    for (const leak of [/password/i, /SITE_PASSWORD/, /basic auth/i, /includes\(/, /regex/i]) {
      assert.doesNotMatch(m, leak, `refusal message leaks implementation: ${m}`);
    }
  }
});

check("the error carries a 403, not a 400", () => {
  try {
    build("/teacher-tools/");
    assert.fail("did not refuse");
  } catch (e) {
    assert.equal(e.status, 403);
    assert.equal(e.name, "TeacherSurfaceError");
  }
});

// --- 3. bypass matrix --------------------------------------------------------
// Each of these is a different spelling of a path the gate must refuse.
check("percent-encoding cannot bypass the check", () => {
  for (const t of [
    "/lessons/1-1/%74eacher-notes/", // %74 = t
    "/%74eacher-tools/",
    "/teacher%2Dtools/", // %2D = -
    "/lessons/1-1/%2574eacher-notes/", // double-encoded
    "/math/unit-1/projects/answer%2Dkey/",
  ]) {
    assert.ok(refuses(t), `encoded form got through: ${t}`);
  }
});

check("traversal cannot bypass the check", () => {
  for (const t of [
    "/lessons/1-1/../teacher-notes/",
    "/a/b/../../teacher-tools/",
    "/teacher-tools/../teacher-tools/",
    "/./teacher-tools/",
  ]) {
    assert.ok(refuses(t), `traversal form got through: ${t}`);
  }
});

check("duplicate slashes cannot bypass the check", () => {
  for (const t of ["//teacher-tools//", "/lessons//1-1///teacher-notes/", "///admin///"]) {
    assert.ok(refuses(t), `doubled-slash form got through: ${t}`);
  }
});

check("case differences cannot bypass the check", () => {
  for (const t of ["/Teacher-Tools/", "/LESSONS/1-1/TEACHER-NOTES/", "/Admin/", "/Answer-Key/"]) {
    assert.ok(refuses(t), `mis-cased form got through: ${t}`);
  }
});

check("backslashes cannot bypass the check", () => {
  assert.ok(refuses("/lessons\\1-1\\teacher-notes/"), "backslash separator got through");
});

check("a query string cannot smuggle or fake a verdict", () => {
  // The query is not part of the path: it must neither hide a teacher path...
  assert.ok(refuses("/teacher-tools/?x=/lessons/1-1/"), "query hid a teacher path");
  // ...nor make a student path look teacher-only.
  assert.ok(!refuses("/lessons/1-1/homework.html?ref=teacher"), "query faked a teacher path");
  assert.ok(!refuses("/lessons/1-1/?from=dashboard"), "query faked a teacher path");
});

check("a fragment cannot fake a verdict either", () => {
  assert.ok(!refuses("/lessons/1-1/homework.html#teacher"), "fragment faked a teacher path");
});

// --- 4. unknown / malformed targets still behave as before -------------------
check("an unknown activity is NOT turned into a teacher refusal", () => {
  // The point of this check is the CLASSIFICATION, not the outcome: a lesson id
  // that does not exist must never be reported to a teacher as "that page is
  // teacher-only", which sends them looking for a permissions problem they do
  // not have.
  //
  // It used to resolve and be handed to the endpoint's 404 existence probe.
  // Runtime v2 pre-flight now refuses it earlier, at build time, against the
  // canonical curriculum — the probe is a network round-trip that only the
  // endpoint can make, so the CLI builders were shipping zips that iframe a
  // 404. Either way it must not be a TeacherSurfaceError.
  assert.ok(!refuses("99-99"), "a non-existent lesson was reported as teacher-only");
  assert.throws(
    () => build("99-99"),
    (e) => e.name === "PackagePreflightError" && /no lesson at/.test(e.message),
    "a non-existent lesson id must be refused with a reason a teacher can act on",
  );
  // resolveTarget itself is unchanged and still resolves the route.
  assert.ok(resolveTarget("99-99").lessonUrl.endsWith("/lessons/99-99/"));
});

check("off-site targets are still rejected as before", () => {
  assert.throws(() => build("https://evil.example.com/x/"), /eduwonderlab/);
  // and not misreported as a teacher-surface refusal
  assert.ok(!refuses("https://evil.example.com/x/"));
});

check("an empty target still fails as a missing activity", () => {
  assert.throws(() => build(""), /missing activity/);
});

// --- 5. normalizePath's own contract ----------------------------------------
check("normalizePath collapses every equivalent spelling to one", () => {
  const want = "/lessons/1-1/teacher-notes/";
  for (const t of [
    "/lessons/1-1/teacher-notes/",
    "/Lessons/1-1/Teacher-Notes/",
    "/lessons//1-1///teacher-notes/",
    "/lessons/1-1/x/../teacher-notes/",
    "/lessons/1-1/%74eacher-notes/",
    "/lessons/./1-1/teacher-notes/",
  ]) {
    assert.equal(normalizePath(t), want, `normalizePath(${t})`);
  }
});

check("normalizePath does not hang or throw on hostile input", () => {
  for (const t of ["%", "%zz", "%%%%", "/".repeat(500), "../".repeat(200), null, undefined]) {
    assert.doesNotThrow(() => normalizePath(t), `threw on ${String(t)}`);
  }
});

// --- 6. ONE predicate, not three --------------------------------------------
check("the download taxonomy uses the shared predicate, not a copy", () => {
  assert.equal(
    taxonomyPredicate,
    isTeacherSurface,
    "download-taxonomy re-declared the predicate instead of re-exporting it",
  );
});

check("the middleware imports the shared predicate rather than inlining rules", () => {
  const mw = readFileSync(join(ROOT, "functions/_middleware.js"), "utf8");
  assert.match(mw, /from "\.\/_lib\/teacher-surface\.js"/, "middleware no longer imports it");
  // The old inline rule list must not come back alongside the import.
  assert.doesNotMatch(
    mw,
    /p\.includes\("answer-key"\)/,
    "middleware re-inlined the predicate — that is the drift this consolidation removed",
  );
});

check("every path the middleware would gate, generation also refuses", () => {
  // The gate is the definition of record. Generation must never be LOOSER than
  // it: a path that 401s must not yield a package.
  for (const p of [
    "/teacher-tools/x/",
    "/lessons/1-1/teacher-notes/",
    "/some/dashboard/",
    "/x/answer-key/",
    "/curriculum/plan-notes",
    "/curriculum/planning/",
    "/admin/anything",
  ]) {
    assert.ok(isTeacherSurface(p), `shared predicate missed ${p}`);
    assert.ok(refuses(p), `gate would 401 ${p} but generation built a package`);
  }
});

check("shared student code and data are still not treated as teacher paths", () => {
  // curriculum-teacher-workflow.js is fetched by the PUBLIC hub; treating it as
  // teacher-only would 401 a student page's script.
  for (const p of ["/assets/curriculum-teacher-workflow.js", "/data/curriculum-manifest.json"]) {
    assert.ok(!isTeacherSurface(p), `would have gated a shared student asset: ${p}`);
  }
});

console.log("SCORM teacher-surface boundary");
console.log(`  checks passed: ${passed}`);
if (failures.length) {
  console.log(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.log("  ✗ " + f);
  process.exit(1);
}
console.log("RESULT: PASS ✅");
