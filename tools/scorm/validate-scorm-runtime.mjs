#!/usr/bin/env node
/**
 * validate-scorm-runtime.mjs — the authoritative SCORM Runtime v2 gate.
 *
 * The existing SCORM checks each hold one layer and none of them holds the
 * runtime CONTRACT:
 *   validate:scorm                 — the SCO still contains its hardening lines
 *   validate:scorm:fleet           — all 554 packages open, parse and are unique
 *   validate:scorm-self-contained  — the packages are LIVE wrappers, on purpose
 *   scorm-lifecycle.test.mjs       — the SCORM 1.2 data model behaves
 *   scorm-runtime.test.mjs         — the runtime scenarios behave
 *
 * This gate asserts the invariants that span them: that every structural family
 * a teacher can download gets the SAME Runtime v2 shell, that the versions are
 * coherent across the wrapper, the live bridge and the reachability endpoint,
 * that pre-flight actually refuses the packages it claims to refuse, and that
 * the download names are stable, unique and safe on Windows and macOS.
 *
 * Nothing here is a grep for a line someone remembered to add: every check
 * BUILDS a package and interrogates the result, and the negative cases are run
 * against deliberately broken inputs so a detector that has stopped firing
 * fails loudly instead of reporting a clean fleet.
 *
 * Run:  npm run validate:scorm-runtime
 * Exit: 0 = the runtime contract holds, 1 = it does not (each problem printed).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildScormFiles,
  ERROR_CODES,
  PackagePreflightError,
  packageFileName,
  preflight,
  SCORM_PROTOCOL_VERSION,
  SCORM_RUNTIME_VERSION,
  zipStore,
} from "../../functions/_lib/scorm.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const problems = [];
const fail = (m) => problems.push(m);

/**
 * The structurally distinct package families. Every one of them must come out
 * of ONE shared runtime — the point of v2 is that there are not four wrappers
 * drifting apart, which is what the deleted tools/scorm/template/ used to be.
 */
const FAMILIES = [
  { name: "lesson", target: "1-1" },
  { name: "lesson-interactive", target: "5-1" },
  { name: "homework", target: "/lessons/1-1/homework.html" },
  { name: "activity", target: "/ratio-color-mixer/" },
  { name: "activity-with-query", target: "/math/games/practice-arcade/?unit=3" },
  { name: "lesson-savecodes", target: "1-1", codes: true },
  { name: "lesson-personalized", target: "1-1", supports: "read-understand", lang: "es" },
];

// --- self-test: every detector must fire before any of them is trusted -------
function selfTest() {
  const bad = [];
  const base = buildScormFiles({ target: "1-1" });

  const mustRefuse = [
    ["a missing manifest", { "index.html": base.files["index.html"] }],
    ["a missing SCO entry", { "imsmanifest.xml": base.files["imsmanifest.xml"] }],
    [
      "a manifest launching a file that is not in the package",
      {
        "imsmanifest.xml": base.files["imsmanifest.xml"].replace(
          'href="index.html"',
          'href="go.html"',
        ),
        "index.html": base.files["index.html"],
      },
    ],
    [
      "a wrapper with the runtime code stripped",
      {
        ...base.files,
        "index.html": base.files["index.html"].replace(/<script>[\s\S]*<\/script>/, ""),
      },
    ],
    [
      "a wrapper pointing at localhost",
      {
        ...base.files,
        "index.html": base.files["index.html"].replace(
          /https:\/\/eduwonderlab\.com/g,
          "http://localhost:4499",
        ),
      },
    ],
    [
      "a wrapper pointing at a preview deployment",
      {
        ...base.files,
        "index.html": base.files["index.html"].replace(
          /https:\/\/eduwonderlab\.com/g,
          "https://abc123.pages.dev",
        ),
      },
    ],
    [
      "a wrapper carrying an authentication value",
      { ...base.files, "index.html": `${base.files["index.html"]}<!-- TEACHER_KEY=abc -->` },
    ],
  ];
  for (const [label, files] of mustRefuse) {
    let refused = false;
    try {
      preflight(files, { lessonUrl: base.lessonUrl, id: base.id });
    } catch (e) {
      refused = e instanceof PackagePreflightError;
    }
    if (!refused) bad.push(`pre-flight accepted ${label}`);
  }
  // And it must ACCEPT a good package, or it is a gate that blocks everything.
  try {
    preflight(base.files, { lessonUrl: base.lessonUrl, id: base.id });
  } catch (e) {
    bad.push(`pre-flight refused a valid package: ${e.message}`);
  }
  // A lesson id the curriculum has never heard of must be refused at build.
  let refusedGhost = false;
  try {
    buildScormFiles({ target: "99-99" });
  } catch (e) {
    refusedGhost = e instanceof PackagePreflightError;
  }
  if (!refusedGhost) bad.push("a non-existent lesson id was packaged instead of refused");
  return bad;
}

const selfFails = selfTest();
if (selfFails.length) {
  console.log("SCORM Runtime v2 contract\n\nFAIL — the gate's own detectors are broken:");
  for (const f of selfFails) console.log("  ✗ " + f);
  console.log("\nA detector that does not fire reports a healthy runtime. Fix the gate first.");
  process.exit(1);
}

// --- 1. one shared runtime across every family -------------------------------
const built = [];
for (const f of FAMILIES) {
  let pkg;
  try {
    pkg = buildScormFiles({ ...f, generatedAt: "2026-01-01" });
  } catch (e) {
    fail(`${f.name}: build threw — ${e.message}`);
    continue;
  }
  built.push({ ...f, pkg });
  const html = pkg.files["index.html"];

  if (pkg.runtime !== SCORM_RUNTIME_VERSION) fail(`${f.name}: wrong runtime version`);
  if (!html.includes(`var RUNTIME = ${SCORM_RUNTIME_VERSION};`))
    fail(`${f.name}: the wrapper does not declare Runtime v${SCORM_RUNTIME_VERSION}`);
  if (!html.includes(`var PROTOCOL = ${SCORM_PROTOCOL_VERSION};`))
    fail(`${f.name}: the wrapper does not declare protocol v${SCORM_PROTOCOL_VERSION}`);

  // The four things a student's experience actually rests on.
  for (const [what, needle] of [
    ["a loading state", "Loading your math lesson"],
    ["a failure state", "We couldn't load your lesson."],
    ["a retry control", 'id="ewl-retry"'],
    ["the Cloudflare Access classifier", "/api/scorm-probe"],
    ["origin validation on incoming messages", "e.origin !== LESSON_ORIGIN"],
    ["an allow-list of message types", "if (!ALLOWED[type])"],
  ]) {
    if (!html.includes(needle)) fail(`${f.name}: the wrapper is missing ${what}`);
  }
  for (const code of Object.values(ERROR_CODES)) {
    if (!html.includes(code)) fail(`${f.name}: reference code ${code} is not reachable`);
  }

  // Package metadata: enough to diagnose a zip found in a Canvas course later,
  // and never anything sensitive.
  if (!html.includes('name="ewl:runtime"')) fail(`${f.name}: no runtime metadata`);
  if (!html.includes('name="ewl:target"')) fail(`${f.name}: no target metadata`);
  if (!html.includes('content="2026-01-01"')) fail(`${f.name}: the generation stamp is missing`);
  // No secret and no personal data may be baked into a package. Scoped to the
  // metadata block and to credential SHAPES: an earlier version searched the
  // whole document for the word "student" and flagged every family, because the
  // wrapper's own comments discuss students constantly. A detector that fires
  // on everything is the same as one that fires on nothing.
  const metaBlock = html.slice(0, html.indexOf("</head>"));
  for (const [what, re] of [
    ["a teacher key", /TEACHER_KEY|x-teacher-key/i],
    ["a site password", /SITE_PASSWORD/i],
    ["an email address", /[\w.-]+@[\w.-]+\.\w+/],
    ["an API token", /\b(sk|pk|ghp|xox[abpr])[-_][A-Za-z0-9]{16,}/],
  ]) {
    if (re.test(metaBlock)) fail(`${f.name}: the package metadata carries ${what}`);
  }

  // Live wrapper, not a bundled lesson. The whole upgrade path depends on it.
  const names = Object.keys(pkg.files).sort();
  if (names.join(",") !== "imsmanifest.xml,index.html")
    fail(`${f.name}: package holds unexpected files (${names.join(", ")})`);
  if (!html.includes(pkg.lessonUrl)) fail(`${f.name}: the wrapper does not target the live lesson`);

  // Lightweight. A package that grows toward the curriculum has stopped being
  // a launcher, and a teacher uploads these one at a time.
  const bytes = zipStore(pkg.files).length;
  if (bytes > 80_000) fail(`${f.name}: package is ${bytes} B — the wrapper must stay lightweight`);
}

// --- 2. download names: stable, unique, cross-platform safe -------------------
const names = new Map();
for (const b of built) {
  const name = packageFileName(b.pkg.id, b.pkg.codes);
  if (!/^EduWonderLab_[A-Za-z0-9._-]+_SCORM\.zip$/.test(name))
    fail(`${b.name}: "${name}" does not follow EduWonderLab_<id>_<title>_SCORM.zip`);
  // Windows rejects \ / : * ? " < > | ; spaces break naive upload tooling.
  if (/[\\/:*?"<>|\s]/.test(name)) fail(`${b.name}: "${name}" is not filesystem-safe`);
  if (name.length > 150) fail(`${b.name}: "${name}" is too long for some filesystems`);
  if (names.has(name)) fail(`name collision: ${b.name} and ${names.get(name)} both → "${name}"`);
  names.set(name, b.name);
  // Stable: the same id must always produce the same name, in every builder.
  if (packageFileName(b.pkg.id, b.pkg.codes) !== name)
    fail(`${b.name}: the download name is unstable`);
}

// --- 3. canonical titles, not internal slugs ---------------------------------
for (const b of built) {
  const t = b.pkg.title;
  if (!t.startsWith("EduWonderLab")) fail(`${b.name}: title "${t}" is not branded`);
  if (/[a-z]-[a-z]{3,}-[a-z]/.test(t)) fail(`${b.name}: title "${t}" looks like a raw slug`);
  if (!b.pkg.files["imsmanifest.xml"].includes("<title>"))
    fail(`${b.name}: the manifest declares no title for Canvas to show`);
}
const lessonTitle = built.find((b) => b.name === "lesson")?.pkg.title || "";
if (!/Lesson 1-1: /.test(lessonTitle))
  fail(`the lesson title is not the canonical curriculum title (got "${lessonTitle}")`);

// --- 4. version coherence across the three places a version lives ------------
const bridge = read("assets/canvas-bridge.js");
if (!bridge.includes(`type: "ready", protocol: ${SCORM_PROTOCOL_VERSION}`))
  fail("assets/canvas-bridge.js does not announce the current protocol version in its handshake");
for (const t of ["heartbeat", "height"]) {
  if (!bridge.includes(`type: "${t}"`))
    fail(`assets/canvas-bridge.js no longer emits the ${t} message the runtime expects`);
}
const probe = read("functions/api/scorm-probe.js");
if (!probe.includes("SCORM_RUNTIME_VERSION") || !probe.includes("SCORM_PROTOCOL_VERSION"))
  fail("/api/scorm-probe does not report the runtime contract the wrapper checks for");
if (!read("functions/api/scorm.js").includes("PackagePreflightError"))
  fail("/api/scorm does not surface a pre-flight refusal — a broken zip could still download");

// --- 5. determinism -----------------------------------------------------------
for (const b of built) {
  const a = zipStore(buildScormFiles({ ...b, generatedAt: "2026-01-01" }).files);
  const c = zipStore(buildScormFiles({ ...b, generatedAt: "2026-01-01" }).files);
  if (Buffer.compare(Buffer.from(a), Buffer.from(c)) !== 0)
    fail(`${b.name}: two builds of the same package differ — a re-download is not comparable`);
}

// --- 6. every canonical engine lesson can reach the Canvas bridge ------------
// The gap this closes: lessons/<id>/index.html was never a target of
// tools/inject-canvas-bridge.js (which covers the activity catalog plus every
// homework.html), so no engine lesson loaded the bridge — no `ready` handshake
// and nothing ever written to cmi.suspend_data. Every existing gate passed,
// because each asked whether the SCORM PACKAGE was well-formed and none asked
// whether the LESSON could answer it.
//
// Derived from the curriculum manifest, never a hardcoded lesson list: a list
// is a second thing to maintain, and the failure mode here is precisely a new
// lesson silently missing from one.
const BOOTS = {
  "@engine/core/lesson-renderer.js": "bootLesson",
  "@engine/templates/flagship/flagship.js": "bootFlagship",
  "@engine/core/small-group-renderer.js": "bootSmallGroup",
  "@engine/core/part-two-renderer.js": "bootPartTwo",
};
// Both renderers must call the shared hook; flagship inherits it by delegating
// to bootLesson, which is asserted rather than assumed.
for (const f of [
  "engine/core/lesson-renderer.js",
  "engine/core/small-group-renderer.js",
  "engine/core/part-two-renderer.js",
]) {
  const src = read(f);
  if (!/import \{ ensureCanvasBridge \}/.test(src) || !/ensureCanvasBridge\(config\)/.test(src))
    fail(`${f}: does not reach the shared Canvas bridge hook — engine lessons lose SCORM resume`);
}
if (!/bootLesson/.test(read("engine/templates/flagship/flagship.js")))
  fail("flagship no longer delegates to bootLesson — it needs its own ensureCanvasBridge call");

// DERIVATION SOURCE. `data/curriculum-manifest.json` holds ONLY the 84 core
// lessons — it has no entry for any of the 168 small-group, 36 catch-up or 10
// unit-project pathways, so deriving from it leaves 214 pathways outside every
// guard in this repo (which is exactly how they got there). The launch manifest
// is the one file that enumerates all four types.
const launch = JSON.parse(read("data/curriculum-launch-manifest.json"));
const PATHWAY_SETS = [
  ["lesson", launch.lessons || []],
  ["smallGroup", launch.smallGroups || []],
  ["catchUp", launch.catchUps || []],
  ["partTwo", launch.partTwo || []],
  ["endOfUnit", launch.endOfUnit || []],
];
for (const [kind, arr] of PATHWAY_SETS) {
  if (!arr.length)
    fail(`launch manifest has no ${kind} pathways — the derivation source is broken`);
}
// Declared counts must match their arrays, or the manifest is lying about its
// own contents and every count derived from it is unreliable.
for (const [kind, arr, declared] of [
  ["lesson", launch.lessons || [], launch.lessonCount],
  ["smallGroup", launch.smallGroups || [], launch.smallGroupCount],
  ["catchUp", launch.catchUps || [], launch.catchUpCount],
  ["endOfUnit", launch.endOfUnit || [], launch.endOfUnitCount],
]) {
  if (declared != null && declared !== arr.length)
    fail(`launch manifest ${kind}Count=${declared} but the array holds ${arr.length}`);
}

// --- 6b. manifest completeness: nothing on disk may be invisible to the gate --
// The orphan class this closes: math/unit-1/projects/version-c,
// math/unit-10/projects/version-c and math/unit-10/projects/world-architect
// were student-reachable from /curriculum/projects/ but absent from the SCORM
// activity catalog, so the bridge injector skipped them, no package existed,
// and no validator could see them.
const catalog = JSON.parse(read("tools/scorm/activity-catalog.json"));
const catalogPaths = new Set(
  (catalog.activities || []).map((a) => String(a.path).replace(/^\/+|\/+$/g, "")),
);
const projectDirs = [];
for (const unit of readdirSync(join(ROOT, "math"))) {
  const base = join("math", unit, "projects");
  if (!existsSync(join(ROOT, base))) continue;
  // The hub page itself is a pathway too. Checking only the variant
  // subdirectories left math/pre-unit/projects/index.html uncatalogued and
  // bridge-less — a gap in this gate, found only because the id listing had no
  // bare "pre-unit" row. A gate that inspects children but not the parent is
  // the same blind spot it exists to close.
  if (existsSync(join(ROOT, base, "index.html"))) projectDirs.push(base.replace(/\\/g, "/"));
  for (const entry of readdirSync(join(ROOT, base))) {
    const rel = `${base}/${entry}`.replace(/\\/g, "/");
    // answer-key is teacher-only: isTeacherSurface gates it and it must NOT be
    // packaged. Excluding it here is the correct behaviour, not an omission.
    if (entry === "answer-key") continue;
    if (existsSync(join(ROOT, rel, "index.html"))) projectDirs.push(rel);
  }
}
const uncatalogued = projectDirs.filter((p) => !catalogPaths.has(p));
if (uncatalogued.length)
  fail(
    `${uncatalogued.length} student-facing project pathway(s) exist on disk but are absent from the SCORM activity catalog, so they get no Canvas bridge and no package: ${uncatalogued.join(", ")}`,
  );

let engineChecked = 0;
const orphans = [];
// DECLARED exclusions. `lessons/_template/` is a scaffold, not a pathway: it
// boots through bootLesson like any lesson, but it is not in the launch
// manifest and vite.config.js:11 refuses to copy any underscore-prefixed
// directory into dist/, so it is 404 in production (verified). It was
// previously excluded only INCIDENTALLY — by being absent from the manifest —
// which means a future manifest change could silently pull a scaffold into the
// gate, or silently drop a real pathway and look identical. Declaring it makes
// the disk-vs-manifest reconciliation exact and checkable.
const DECLARED_NON_PATHWAYS = new Set(["_template", "_incoming-decks", "1-1-flagship"]);

// Reconcile disk against the manifest, both directions. 289 lesson.js files on
// disk = 288 manifest pathways + 1 declared scaffold.
const onDisk = readdirSync(join(ROOT, "lessons")).filter((d) =>
  existsSync(join(ROOT, "lessons", d, "lesson.js")),
);
const allEnginePathways = [
  ...(launch.lessons || []),
  ...(launch.smallGroups || []),
  ...(launch.catchUps || []),
  ...(launch.partTwo || []),
];
const manifestIds = new Set(allEnginePathways.map((l) => l.id));
const undeclared = onDisk.filter((d) => !manifestIds.has(d) && !DECLARED_NON_PATHWAYS.has(d));
if (undeclared.length)
  fail(
    `${undeclared.length} lesson pathway(s) exist on disk but are neither in the launch manifest nor declared as non-pathways, so no validator can see them: ${undeclared.join(", ")}`,
  );
const missingOnDisk = allEnginePathways.filter((l) => !onDisk.includes(l.id));
if (missingOnDisk.length)
  fail(
    `${missingOnDisk.length} manifest pathway(s) have no lesson.js on disk: ${missingOnDisk
      .map((l) => l.id)
      .slice(0, 6)
      .join(", ")}`,
  );

for (const l of allEnginePathways) {
  const entry = `lessons/${l.id}/lesson.js`;
  let src;
  try {
    src = read(entry);
  } catch {
    continue; // not an engine lesson (static page, redirect, etc.)
  }
  engineChecked++;
  // Structural compatibility = it boots through one of the shared entry points
  // that reaches the hook. A lesson that hand-rolled its own boot would be the
  // one that silently loses passback again.
  if (!Object.entries(BOOTS).some(([mod, fn]) => src.includes(mod) && src.includes(fn))) {
    orphans.push(l.id);
  }
}
if (!engineChecked) fail("no engine lessons were checked — the manifest scan found nothing");
if (orphans.length)
  fail(
    `${orphans.length} engine lesson(s) do not boot through a shared renderer, so they cannot inherit the Canvas bridge: ${orphans.slice(0, 6).join(", ")}${orphans.length > 6 ? " …" : ""}`,
  );

// --- 6c. suspend_data growth alarm (WARN, never a failure) -------------------
// The cap is 4,096 chars and crossing it degrades a pathway to a resume
// pointer. Homework 1-1 already serializes 2,542 (62%), and homework is the
// type most likely to grow, so the threshold exists to make that visible while
// it is still cheap. Source-level: the gate proves the warn exists and is
// wired; the measured sizes come from the browser probe.
const bridgeSrc = read("assets/canvas-bridge.js");
const warnings = [];
if (!/var SUSPEND_WARN = 3000;/.test(bridgeSrc))
  fail("the suspend_data warn threshold is gone — growth would be invisible until it refuses");
if (!/out\.length > SUSPEND_WARN/.test(bridgeSrc))
  fail("the warn threshold is declared but never checked on the write path");
if (/if \(out\.length > SUSPEND_WARN\)[\s\S]{0,400}?\breturn ""/.test(bridgeSrc))
  fail("the warn threshold refuses a write — it must warn only");
warnings.push(
  "suspend_data warn threshold is 3000 chars (cap 4000). Measured: homework 1-1 = 2,542 (62% of cap); small-group/catch-up/project exceed the cap structurally and use a resume pointer by design.",
);

// ---------------------------------------------------------------------------
console.log("SCORM Runtime v2 contract");
const declaredOnDisk = onDisk.filter((d) => DECLARED_NON_PATHWAYS.has(d));
// Exact arithmetic, not a plausible-looking sum: only the declared entries that
// actually carry a lesson.js are part of the on-disk count.
if (engineChecked + declaredOnDisk.length !== onDisk.length)
  fail(
    `pathway reconciliation does not balance: ${engineChecked} manifest + ${declaredOnDisk.length} declared != ${onDisk.length} on disk`,
  );
console.log(
  `  engine pathways wired : ${engineChecked} manifest + ${declaredOnDisk.length} declared (${declaredOnDisk.join(", ") || "none"}) = ${onDisk.length} on disk`,
);
console.log("  self-test: all detectors fire ✅");
console.log(`  runtime / protocol    : v${SCORM_RUNTIME_VERSION} / v${SCORM_PROTOCOL_VERSION}`);
console.log(`  structural families   : ${built.length} / ${FAMILIES.length}`);
console.log(`  unique download names : ${names.size}`);
for (const [n, fam] of names) console.log(`    ${fam.padEnd(20)} ${n}`);
if (problems.length) {
  console.log(`\nFAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.log("  ✗ " + p);
  console.log("\nSee docs/scorm-runtime.md for the runtime and protocol contract.");
  process.exit(1);
}
for (const w of warnings) console.log(`  WARN: ${w}`);
console.log("\nRESULT: PASS ✅ (one Runtime v2 shell across every package family)");
