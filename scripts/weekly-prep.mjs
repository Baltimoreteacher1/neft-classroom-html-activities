#!/usr/bin/env node
/**
 * Weekly Prep Autopilot
 * =====================
 * One scoped orchestrator that rebuilds every teaching artifact for a slice of
 * lessons (a unit + lesson range), then the global indexes, then optionally the
 * Canvas package, a full build, validation, and a guarded deploy.
 *
 * Usage:
 *   npm run prep -- --unit 2 --lessons 1-5
 *   npm run prep -- --unit 3 --lessons 1-4 --flagship --canvas --build
 *   npm run prep -- --unit 2 --lessons 3 --only slides,homework
 *   npm run prep -- --unit 2 --lessons 1-5 --dry-run
 *   npm run prep -- --unit 2 --lessons 1-5 --build --validate --deploy   (needs ALLOW_DEPLOY=1)
 *
 * Flags:
 *   --unit N            (required) unit number
 *   --lessons A-B | A   (required) lesson number or inclusive range within the unit
 *   --flagship          also include the "<u>-<l>-flagship" variant of each lesson
 *   --only a,b,c        run only these lesson steps (see STEPS keys)
 *   --skip a,b,c        skip these lesson steps
 *   --pdf               include the (heavy) PDF export step
 *   --printables        re-run printable integration (all-lessons, idempotent)
 *   --canvas            build the Canvas unit pack for this unit
 *   --no-aggregates     skip the global manifest/registry/curriculum rebuild
 *   --build             run `npm run build` at the end
 *   --validate          run `npm run validate` at the end
 *   --deploy            commit the scoped artifacts and ship to production
 *   --dry-run           print the plan; run nothing
 *   --list              print resolved lessons + steps and exit
 *
 * Backward-compatible: the all-or-nothing generators (slides/homework/notes) are
 * scoped via the NEFT_LESSON_SCOPE env var (see scripts/lib/lesson-scope.mjs);
 * running them without this orchestrator is unchanged.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");

/* ---------------- tiny ANSI helpers (no deps) ---------------- */
const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

/* ---------------- arg parsing ---------------- */
function parseArgs(argv) {
  const a = { flags: new Set(), only: null, skip: null, unit: null, lessons: null };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--unit") a.unit = argv[++i];
    else if (t === "--lessons") a.lessons = argv[++i];
    else if (t === "--only") a.only = argv[++i].split(",").map((s) => s.trim());
    else if (t === "--skip") a.skip = argv[++i].split(",").map((s) => s.trim());
    else if (t.startsWith("--")) a.flags.add(t.slice(2));
    else throw new Error(`Unexpected argument: ${t}`);
  }
  return a;
}

function resolveLessons(unit, lessonsSpec, includeFlagship) {
  const u = Number(unit);
  if (!Number.isInteger(u) || u < 0) throw new Error(`--unit must be a whole number (got "${unit}")`);
  let from;
  let to;
  const m = String(lessonsSpec).match(/^(\d+)(?:-(\d+))?$/);
  if (!m) throw new Error(`--lessons must be "A" or "A-B" (got "${lessonsSpec}")`);
  from = Number(m[1]);
  to = m[2] != null ? Number(m[2]) : from;
  if (to < from) [from, to] = [to, from];

  const resolved = [];
  const missing = [];
  for (let l = from; l <= to; l++) {
    for (const id of includeFlagship ? [`${u}-${l}`, `${u}-${l}-flagship`] : [`${u}-${l}`]) {
      if (existsSync(join(LESSONS, id, "config.json"))) resolved.push(id);
      else if (!id.endsWith("-flagship")) missing.push(id); // flagship absence is normal
    }
  }
  return { resolved, missing };
}

/* ---------------- step registry ----------------
 * `scoped:true`  → uses NEFT_LESSON_SCOPE env (all-or-nothing generators).
 * `args:true`    → passes lesson ids as positional argv (natively scopeable).
 * `default`      → whether it runs unless --only/--skip says otherwise. */
const STEPS = [
  { key: "shells", label: "Lesson page shells", script: "scripts/generate-lesson-shells.mjs", args: true, default: true },
  { key: "notes", label: "TWR notes · learn · vocab", script: "scripts/generate-notes.mjs", scoped: true, default: true },
  { key: "slides", label: "Premium slides", script: "scripts/generate-slides.mjs", scoped: true, default: true },
  { key: "worksheets", label: "Printable worksheets", script: "scripts/generate-worksheets.mjs", args: true, default: true },
  { key: "homework", label: "Family homework (.docx)", script: "scripts/generate-homework.mjs", scoped: true, default: true },
  { key: "docx", label: "Editable Word downloads", script: "scripts/generate-docx.mjs", args: true, default: true },
  { key: "pdf", label: "PDF downloads (heavy)", script: "scripts/generate-pdf.mjs", args: true, default: false },
  { key: "printables", label: "Printable integration", script: "scripts/integrate-lesson-printables.mjs", default: false },
];

/* Global aggregates — always rebuilt once after any lesson change. */
const AGGREGATES = [
  ["Curriculum manifest", "scripts/generate-curriculum-manifest.mjs"],
  ["Registry", "scripts/generate-registry.mjs"],
  ["Launch manifest", "scripts/generate-launch-manifest.mjs"],
  ["Curriculum search index", "scripts/generate-curriculum-search-index.mjs"],
  ["Curriculum launch manifest", "scripts/generate-curriculum-launch-manifest.mjs"],
  ["Curriculum hub", "scripts/generate-curriculum.mjs", ["--force"]],
];

/* ---------------- runner ---------------- */
function run(label, file, args, { scope, dry }) {
  const cmd = file.endsWith(".sh") ? "bash" : file === "npm" ? "npm" : "node";
  const argv = file.endsWith(".sh") || file === "npm" ? args : [file, ...args];
  const printable = `${cmd} ${argv.join(" ")}`;
  process.stdout.write(`  ${C.cyan("▶")} ${label} ${C.dim(printable)}\n`);
  if (dry) return { label, ms: 0, ok: true, dry: true };
  const env = { ...process.env };
  if (scope) env.NEFT_LESSON_SCOPE = scope.join(",");
  else delete env.NEFT_LESSON_SCOPE;
  const t0 = Date.now();
  try {
    execFileSync(cmd, argv, { cwd: ROOT, stdio: "inherit", env });
    const ms = Date.now() - t0;
    process.stdout.write(`  ${C.green("✔")} ${label} ${C.dim(`(${(ms / 1000).toFixed(1)}s)`)}\n`);
    return { label, ms, ok: true };
  } catch (err) {
    const ms = Date.now() - t0;
    process.stdout.write(`  ${C.red("✗")} ${label} FAILED ${C.dim(`(${(ms / 1000).toFixed(1)}s)`)}\n`);
    return { label, ms, ok: false, err };
  }
}

/**
 * Resolve which lesson steps run, in canonical order.
 * - --only X,Y   → exactly those keys (opt-in steps included if named).
 * - otherwise    → every default:true step, plus any opt-in step turned on by
 *                  its flag (--pdf/--printables), minus anything in --skip.
 */
function selectedSteps({ only, skip, forced }) {
  return STEPS.filter((s) => {
    if (only) return only.includes(s.key);
    if (skip?.includes(s.key)) return false;
    return s.default || forced.has(s.key);
  });
}

function main() {
  const a = parseArgs(process.argv.slice(2));
  const flag = (f) => a.flags.has(f);

  if (flag("help") || !a.unit || !a.lessons) {
    process.stdout.write(
      `${C.bold("Weekly Prep Autopilot")}\n` +
        `Usage: npm run prep -- --unit <N> --lessons <A-B> [flags]\n` +
        `See the header of scripts/weekly-prep.mjs for all flags.\n`,
    );
    process.exit(a.unit && a.lessons ? 0 : 1);
  }

  const includeFlagship = flag("flagship");
  const { resolved, missing } = resolveLessons(a.unit, a.lessons, includeFlagship);
  if (!resolved.length) {
    process.stdout.write(C.red(`No lessons found for unit ${a.unit}, lessons ${a.lessons}.\n`));
    if (missing.length) process.stdout.write(C.dim(`Looked for: ${missing.join(", ")}\n`));
    process.exit(1);
  }

  // Opt-in steps (pdf/printables) are enabled by their own flags.
  const forced = new Set();
  if (flag("pdf")) forced.add("pdf");
  if (flag("printables")) forced.add("printables");
  const steps = selectedSteps({ only: a.only, skip: a.skip, forced });

  const dry = flag("dry-run");
  process.stdout.write(
    `\n${C.bold("📚 Weekly Prep Autopilot")}  ${C.dim(`unit ${a.unit} · lessons ${a.lessons}`)}\n`,
  );
  process.stdout.write(`   Lessons: ${C.bold(resolved.join(", "))}\n`);
  if (missing.length) process.stdout.write(C.yellow(`   ⚠ Missing (skipped): ${missing.join(", ")}\n`));
  process.stdout.write(`   Steps:   ${steps.map((s) => s.key).join(" → ")}\n`);
  if (dry) process.stdout.write(C.yellow("   DRY RUN — nothing will be executed.\n"));

  if (flag("list")) return;

  const results = [];
  process.stdout.write(`\n${C.bold("Lesson artifacts")}\n`);
  for (const s of steps) {
    const r = run(s.label, s.script, s.args ? resolved : [], { scope: s.scoped ? resolved : null, dry });
    results.push(r);
    if (!r.ok) return finish(results, resolved, a, 1);
  }

  if (!flag("no-aggregates")) {
    process.stdout.write(`\n${C.bold("Global indexes")}\n`);
    for (const [label, script, extra = []] of AGGREGATES) {
      const r = run(label, script, extra, { dry });
      results.push(r);
      if (!r.ok) return finish(results, resolved, a, 1);
    }
  }

  if (flag("canvas")) {
    process.stdout.write(`\n${C.bold("Canvas package")}\n`);
    const r = run(`Unit ${a.unit} Canvas pack`, "tools/canvas/build-unit-pack.mjs", [String(a.unit)], { dry });
    results.push(r);
    if (!r.ok) return finish(results, resolved, a, 1);
  }

  if (flag("build")) {
    process.stdout.write(`\n${C.bold("Build")}\n`);
    const r = run("npm run build", "npm", ["run", "build"], { dry });
    results.push(r);
    if (!r.ok) return finish(results, resolved, a, 1);
  }

  if (flag("validate")) {
    process.stdout.write(`\n${C.bold("Validate")}\n`);
    const r = run("npm run validate", "npm", ["run", "validate"], { dry });
    results.push(r);
    if (!r.ok) return finish(results, resolved, a, 1);
  }

  if (flag("deploy")) return deploy(results, resolved, a, dry);
  finish(results, resolved, a, 0);
}

/* ---------------- guarded deploy ---------------- */
function deploy(results, resolved, a, dry) {
  process.stdout.write(`\n${C.bold("Deploy")}\n`);
  if (!process.env.ALLOW_DEPLOY) {
    process.stdout.write(
      C.yellow("   --deploy requires ALLOW_DEPLOY=1. Skipping. Run:\n") +
        C.dim(`   ALLOW_DEPLOY=1 npm run prep -- --unit ${a.unit} --lessons ${a.lessons} --deploy\n`),
    );
    return finish(results, resolved, a, 0);
  }
  const paths = [
    ...resolved.map((id) => `lessons/${id}`),
    "lessons/notes-index.html",
    "data",
    "curriculum/index.html",
    ...(a.flags.has("canvas") ? [`canvas-packages/unit-${a.unit}`] : []),
  ];
  const msg = `chore(prep): rebuild unit ${a.unit} lessons ${a.lessons} [autopilot]`;
  const add = run("git add (scoped)", "git", ["add", "--", ...paths], { dry });
  results.push(add);
  if (!add.ok) return finish(results, resolved, a, 1);
  const commit = run("git commit", "git", ["commit", "-m", msg], { dry });
  results.push(commit);
  if (!commit.ok) return finish(results, resolved, a, 1);
  const ship = run("ship to production", "scripts/ship.sh", ["HEAD"], { dry });
  results.push(ship);
  finish(results, resolved, a, ship.ok ? 0 : 1);
}

/* ---------------- summary ---------------- */
function finish(results, resolved, a, code) {
  const total = results.reduce((n, r) => n + (r.ms || 0), 0);
  const ok = results.filter((r) => r.ok).length;
  process.stdout.write(`\n${C.bold("Summary")}\n`);
  process.stdout.write(
    `  ${ok}/${results.length} steps ok · ${(total / 1000).toFixed(1)}s · lessons: ${resolved.join(", ")}\n`,
  );
  if (code === 0 && !a.flags.has("deploy") && !a.flags.has("dry-run")) {
    process.stdout.write(
      C.dim(
        "  Next: review the diff, then deploy with\n" +
          `    ALLOW_DEPLOY=1 npm run prep -- --unit ${a.unit} --lessons ${a.lessons} --deploy\n` +
          "  or the canonical  ALLOW_DEPLOY=1 npm run ship -- <sha>\n",
      ),
    );
  }
  process.exit(code);
}

main();
