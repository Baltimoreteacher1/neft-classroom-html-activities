/* Validate the Unit 3 Learning Loop pilot.
 *
 * This gate exists because the loop's teacher material contains ANSWERS
 * (transferSuccess: "80 km", retentionSuccess: "20 litres", rubric descriptors,
 * misconception diagnoses) and lessons/<id>/config.json is PUBLIC — Cloudflare
 * Pages serves it verbatim. A refactor that moves a field into the student
 * projection would silently publish answer keys to every student. That must fail
 * a check, loudly, rather than ship.
 *
 * Checks
 *   1. LEAK    no teacher-only key or success-criteria string appears in any
 *              publicly-served artifact (lessons/<id>/config.json, data/*.json,
 *              and dist/** when a build is present).
 *   2. SHAPE   every piloted lesson has a complete, well-formed `loop` block.
 *   3. LINKS   every href in the teacher module resolves to a file on disk.
 *   4. PAIRING every lesson with student loop content has teacher content, and
 *              vice versa — a half-migrated lesson is a silent gap.
 *
 * Self-tests first (repo idiom): if the scanner itself stops detecting a planted
 * leak, this exits non-zero instead of reporting a clean curriculum.
 *
 * Usage: node scripts/validate-learning-loop.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/* Keys unique to the loop's teacher schema. These always carry teacher content,
   so they must never appear in a publicly-served file at any nesting depth. */
const FORBIDDEN_KEYS = ["teacherOnly", "transferSuccess", "retentionSuccess", "reteachMove", "facilitationNote"];

/* Generic words that legitimately appear in public content-tagging data
   (data/_tagging/merged.json carries misconception CODES for asset matching —
   codes only, no diagnoses or answers). Forbidding them outright produces false
   positives, so they are only forbidden INSIDE a `loop` block, checked
   structurally against the parsed JSON rather than by string match. */
const FORBIDDEN_IN_LOOP = ["misconceptions", "rubric"];

/* Student-safe fields every piloted lesson must carry. */
const REQUIRED_STUDENT = [
  "version",
  "pilot",
  "prerequisites",
  "evidenceTask",
  "transfer",
  "retention",
  "scaffolds",
  "printableAlternative",
  "familyConnection",
];

/* Teacher fields every piloted lesson must carry. */
const REQUIRED_TEACHER = ["misconceptions", "rubric", "transferSuccess", "retentionSuccess", "reteach", "extension"];

const errors = [];
const warnings = [];
let checks = 0;

function fail(msg) {
  errors.push(msg);
}
function ok() {
  checks += 1;
}

// ---------------------------------------------------------------- self-test
/* Plant a leak and confirm the scanner catches it. A gate that has quietly
   stopped firing is worse than no gate — it reports success. */
function selfTest() {
  const cases = [
    // [label, object, expectLeak]
    ["planted teacherOnly + answer", { loop: { teacherOnly: { transferSuccess: "80 km" } } }, true],
    ["planted rubric inside loop", { loop: { rubric: [{ level: "independent" }] } }, true],
    ["planted misconceptions inside loop", { loop: { misconceptions: [{ code: "x" }] } }, true],
    ["clean student loop", { loop: { evidenceTask: { prompt: "Write a ratio." } } }, false],
    // The public content-tagging shape must NOT trip the gate.
    ["public tagging data", { entries: [{ url: "/x/", misconceptions: ["inverse-op"] }] }, false],
  ];
  let bad = 0;
  for (const [label, obj, expected] of cases) {
    const found = leaksIn(obj, JSON.stringify(obj)).length > 0;
    if (found !== expected) {
      console.error(`✗ SELF-TEST FAILED: "${label}" expected leak=${expected}, got ${found}`);
      bad += 1;
    }
  }
  if (bad) process.exit(1);
  console.log(`✓ self-test passed (${cases.length} cases: ${FORBIDDEN_KEYS.length} absolute keys, ${FORBIDDEN_IN_LOOP.length} loop-scoped keys)`);
}

/* Returns a list of leak descriptions for one parsed document.
   `raw` is used for the absolute key match (cheap, depth-independent);
   the structural walk handles the loop-scoped keys. */
function leaksIn(doc, raw) {
  const hits = [];
  for (const key of FORBIDDEN_KEYS) {
    if (raw.includes(`"${key}"`)) hits.push(`forbidden key "${key}"`);
  }
  const visit = (node, inLoop) => {
    if (node == null || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const v of node) visit(v, inLoop);
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (inLoop && FORBIDDEN_IN_LOOP.includes(k)) {
        hits.push(`teacher-only key "${k}" inside a public loop block`);
      }
      visit(v, inLoop || k === "loop");
    }
  };
  visit(doc, false);
  return hits;
}

// ------------------------------------------------------------------ helpers
function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    fail(`unreadable JSON: ${relative(ROOT, file)} — ${e.message}`);
    return null;
  }
}

function walk(dir, out = [], depth = 0, exts = [".json"]) {
  if (depth > 8 || !existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules") continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      // dist/functions is compiled into the Worker and never served as a static
      // asset (verified: /functions/_lib/scorm.js -> 404 in production). It is
      // where the teacher data is SUPPOSED to live, so skip it.
      if (name === "functions") continue;
      walk(p, out, depth + 1, exts);
    } else if (exts.some((e) => name.endsWith(e))) {
      out.push(p);
    }
  }
  return out;
}

// -------------------------------------------------------------- 1. leak scan
function scanPublic() {
  const targets = [];
  // Every lesson config is publicly served.
  const lessonsDir = join(ROOT, "lessons");
  if (existsSync(lessonsDir)) {
    for (const id of readdirSync(lessonsDir)) {
      const f = join(lessonsDir, id, "config.json");
      if (existsSync(f)) targets.push(f);
    }
  }
  // data/ is copied into dist verbatim.
  targets.push(...walk(join(ROOT, "data")));
  // If a build exists, scan what would actually ship — including client-side JS
  // and HTML, so an accidental `import` of the private teacher module into a
  // browser bundle is caught rather than shipped.
  const dist = join(ROOT, "dist");
  if (existsSync(dist)) targets.push(...walk(dist, [], 0, [".json", ".js", ".html"]));

  for (const file of targets) {
    let raw;
    try {
      raw = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    let doc = null;
    if (file.endsWith(".json")) {
      try {
        doc = JSON.parse(raw);
      } catch {
        continue; // unparseable public JSON is not this gate's job
      }
    }
    // For non-JSON, only the quoted-key match applies. That distinguishes a
    // serialized `"teacherOnly":` payload from an unrelated local variable of
    // the same name (assets/curriculum-audit-badges.js has one).
    for (const hit of leaksIn(doc, raw)) {
      fail(`LEAK: ${hit} in publicly-served file ${relative(ROOT, file)}`);
    }
  }
  ok();
  console.log(`✓ leak scan: ${targets.length} publicly-served files checked (json + built js/html)`);
}

// ------------------------------------------------------- 2/3/4. shape + links
async function checkPilot() {
  const teacherFile = join(ROOT, "functions", "_lib", "unit3-loop-teacher.js");
  if (!existsSync(teacherFile)) {
    fail("missing functions/_lib/unit3-loop-teacher.js — run scripts/seed-unit3-learning-loop.mjs");
    return;
  }
  const mod = await import(`file://${teacherFile}`);
  const teacher = mod.UNIT3_LOOP_TEACHER || {};

  const lessonsDir = join(ROOT, "lessons");
  const studentIds = [];
  for (const id of readdirSync(lessonsDir)) {
    const f = join(lessonsDir, id, "config.json");
    if (!existsSync(f)) continue;
    const cfg = readJson(f);
    if (!cfg || !cfg.loop) continue;
    studentIds.push(id);

    for (const key of REQUIRED_STUDENT) {
      if (cfg.loop[key] == null) fail(`${id}: loop.${key} missing from student projection`);
    }
    const t = cfg.loop.transfer;
    if (t && !t.prompt) fail(`${id}: loop.transfer.prompt missing`);
    const r = cfg.loop.retention;
    if (r && !(Number(r.afterDays) > 0)) fail(`${id}: loop.retention.afterDays must be a positive number`);
    // The printable alternative must name a resource the lesson actually has.
    const res = cfg.loop.printableAlternative?.resource;
    if (res && !existsSync(join(lessonsDir, id, `${res === "handout" ? "handout" : res}.html`))) {
      fail(`${id}: printableAlternative.resource "${res}" has no matching file`);
    }
    ok();
  }

  // Pairing: student content <-> teacher content.
  for (const id of studentIds) {
    if (!teacher[id]) fail(`${id}: has student loop content but no teacher content (half-migrated)`);
  }
  for (const id of Object.keys(teacher)) {
    if (!studentIds.includes(id)) fail(`${id}: has teacher content but no student loop content (half-migrated)`);
  }

  // Teacher shape + link resolution.
  for (const [id, block] of Object.entries(teacher)) {
    for (const key of REQUIRED_TEACHER) {
      if (block[key] == null) fail(`${id}: teacher loop.${key} missing`);
    }
    if (Array.isArray(block.misconceptions)) {
      if (block.misconceptions.length < 2 || block.misconceptions.length > 4) {
        fail(`${id}: expected 2–4 misconception categories, found ${block.misconceptions.length}`);
      }
      for (const m of block.misconceptions) {
        if (!m.code || !m.label || !m.lookFor || !m.reteachMove) {
          fail(`${id}: misconception "${m.code || "?"}" is missing a required field`);
        }
      }
    }
    const hrefs = [];
    if (block.reteach?.href) hrefs.push(block.reteach.href);
    if (block.reteach?.alternate?.href) hrefs.push(block.reteach.alternate.href);
    if (block.extension?.href) hrefs.push(block.extension.href);
    for (const href of hrefs) {
      const rel = href.replace(/^\//, "").split(/[?#]/)[0];
      if (!existsSync(join(ROOT, rel))) fail(`${id}: loop link does not resolve on disk → ${href}`);
    }
    ok();
  }

  console.log(`✓ pilot shape: ${studentIds.length} lessons with student loop, ${Object.keys(teacher).length} with teacher loop`);
}

// ---------------------------------------------------------------------- main
async function main() {
  selfTest();
  scanPublic();
  await checkPilot();

  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  ! ${w}`);
  }
  if (errors.length) {
    console.error(`\n✗ validate:learning-loop FAILED — ${errors.length} error(s):`);
    for (const e of errors) console.error(`  • ${e}`);
    process.exit(1);
  }
  console.log(`\n✓ validate:learning-loop passed (${checks} check groups, 0 errors)`);
}

main().catch((e) => {
  console.error(`✗ validate:learning-loop crashed: ${e.stack || e.message}`);
  process.exit(1);
});
