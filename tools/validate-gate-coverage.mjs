#!/usr/bin/env node
/**
 * validate-gate-coverage.mjs — a validator that does not run is not a gate.
 *
 * THE FAILURE THIS EXISTS TO END. Twenty-six validator and audit files sat on
 * disk that `npm run qa:loop` never executed. Nine of them had no npm script at
 * all. They were not broken and they were not deleted — they were written in
 * response to a real bug, landed, and then quietly never wired into the gate.
 * `tools/smoke-planning.mjs` was written after the hub teacher drawer shipped
 * hiding its own cards; `tools/scorm/validate-scorm-self-contained.mjs` is one
 * of the three SCORM failure-class gates; `tools/smoke-injection.mjs` guards a
 * hazard this repo has re-broken more than once. Each one was believed to be
 * protecting main. None of them were.
 *
 * This is the same shape as the SKIP-that-printed-PASS that
 * `tools/lib/skip-exit.mjs` exists for, one level up: there the check ran and
 * verified nothing, here the check never ran at all. Both end as a green
 * summary line making a claim nobody checked.
 *
 * Wiring those twenty-six fixes the twenty-six. It does nothing about the
 * twenty-seventh, which is why this file is a gate and not a cleanup commit.
 *
 * THE RULE. Every validator-shaped file in tools/ and scripts/ must be either
 *
 *   (a) REACHABLE — executed by the full gate, directly or through an
 *       `npm run` chain, or
 *   (b) EXEMPT — named in qa-exempt.json with a reason a human wrote.
 *
 * There is no third state. A new validator that is neither fails this check, so
 * the author has to choose — wire it, or say in one line why it does not gate.
 * Exemption is cheap and reviewable; silence is not available.
 *
 * WHAT COUNTS AS THE GATE is whatever `scripts/qa-run.mjs --list` resolves,
 * asked at runtime. Nothing here restates the check set: if this file held its
 * own copy of the gate, the copy could drift from the gate and this validator
 * would be reporting on a set that nobody runs — the exact failure it exists to
 * catch, wearing its own uniform.
 *
 * EXEMPTIONS ARE ALSO CHECKED. A stale exemption is its own quiet lie: it says
 * a human considered this file, when the file may have been deleted or wired up
 * years ago. An exemption whose file is gone, or whose file the gate now runs,
 * fails here and must be removed.
 *
 * Self-tests its detectors first. A gate that has stopped firing reports
 * perfect coverage, which is what the gate said on the day all twenty-six were
 * dark.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { assertNonEmpty } from "./lib/non-empty.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXEMPT_FILE = join(ROOT, "qa-exempt.json");

const failures = [];
const fail = (m) => failures.push(m);

/* ── Detectors (exported so the self-test below can mutate them) ───────────── */

/**
 * Files this check governs: the validator-shaped ones.
 *
 * Anchored to the filename convention the repo already uses, not to a
 * hand-listed set — a hand-listed set is another copy that can drift. `.test.mjs`
 * files are out of scope: they are run by `npm test`, which is itself gated.
 */
export function isValidatorFile(relPath) {
  if (!/^(tools|scripts)\//.test(relPath)) return false;
  if (/\.test\.(mjs|js)$/.test(relPath)) return false;
  return /(^|\/)(validate|audit|smoke|verify)-[\w-]*\.(mjs|js)$/.test(relPath);
}

/**
 * Every `node <file>` a command line executes.
 *
 * Deliberately literal. A command that builds its script path out of a variable
 * is not matched, and would show up here as an unreached file rather than as a
 * silent pass — the safe direction to be wrong in.
 */
export function nodeTargets(cmd) {
  return [...cmd.matchAll(/node\s+(?:--[\w-]+(?:=\S+)?\s+)*([\w./-]+\.(?:mjs|js))/g)].map(
    (m) => m[1],
  );
}

/** Every `npm run <script>` a command line chains into. */
export function npmChildren(cmd) {
  return [...cmd.matchAll(/npm run ([\w:.-]+)/g)].map((m) => m[1]);
}

/**
 * Transitively resolve which files a set of npm scripts executes.
 *
 * @param {string[]} roots  npm script names
 * @param {Record<string,string>} scripts  package.json scripts
 * @returns {Set<string>} repo-relative file paths
 */
export function reachableFiles(roots, scripts) {
  const seen = new Set();
  const files = new Set();
  const walk = (name) => {
    if (seen.has(name)) return;
    seen.add(name);
    const cmd = scripts[name];
    if (!cmd) return;
    for (const f of nodeTargets(cmd)) files.add(f.replace(/^\.\//, ""));
    for (const child of npmChildren(cmd)) walk(child);
  };
  for (const r of roots) walk(r);
  return files;
}

/* ── Self-test: prove the detectors still fire ─────────────────────────────── */

const selfTests = [
  [
    "isValidatorFile accepts a nested validator",
    () => isValidatorFile("tools/scorm/validate-scorm-fleet.mjs") === true,
  ],
  [
    "isValidatorFile ignores test files",
    () => isValidatorFile("tools/generator-safety.test.mjs") === false,
  ],
  [
    "isValidatorFile ignores non-validator tools",
    () => isValidatorFile("tools/stamp-build.mjs") === false,
  ],
  [
    "nodeTargets reads a chained command",
    () =>
      nodeTargets("node tools/a.mjs && node tools/b.mjs").join(",") === "tools/a.mjs,tools/b.mjs",
  ],
  [
    "nodeTargets survives node flags",
    () => nodeTargets("node --experimental-vm-modules tools/a.mjs").join(",") === "tools/a.mjs",
  ],
  [
    "reachableFiles follows an npm run chain",
    () => {
      const got = reachableFiles(["top"], {
        top: "npm run mid",
        mid: "node tools/validate-deep.mjs",
      });
      return got.has("tools/validate-deep.mjs");
    },
  ],
  [
    "reachableFiles terminates on a cycle",
    () => reachableFiles(["a"], { a: "npm run b", b: "npm run a" }).size === 0,
  ],
];

for (const [name, fn] of selfTests) {
  let ok = false;
  try {
    ok = fn();
  } catch (e) {
    ok = false;
    fail(`self-test threw — ${name}: ${String(e).slice(0, 120)}`);
  }
  if (!ok) fail(`DETECTOR REGRESSED — self-test failed: ${name}`);
}
if (failures.length) {
  console.error("✗ validate:gate-coverage — detector self-tests failed, findings are unreliable");
  for (const m of failures) console.error(`   - ${m}`);
  process.exit(1);
}

/* ── Resolve the real gate ─────────────────────────────────────────────────── */

const scripts = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts || {};

let listOutput;
try {
  listOutput = execFileSync("node", [join(ROOT, "scripts", "qa-run.mjs"), "--list"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
} catch (e) {
  console.error("✗ validate:gate-coverage");
  console.error(
    `   - could not resolve the gate: qa-run.mjs --list failed (${String(e).slice(0, 160)})`,
  );
  process.exit(1);
}

// `--list` prints a header, then one indented line per check: "  name  (after …)".
const gateChecks = listOutput
  .split("\n")
  .filter((l) => /^ {2}\S/.test(l))
  .map((l) => l.trim().replace(/\s*\(after .*$/, ""))
  .filter(Boolean);

// A gate set that came back tiny means the `--list` reader stopped matching its
// output format, not that the gate shrank. Judging coverage against it would
// report almost every validator as dark; judging against an EMPTY one would
// report them all as dark. Either way the number is discovery failure, not a
// finding, so this fails on the floor rather than sweeping.
assertNonEmpty(
  "checks resolved from qa-run.mjs --list",
  gateChecks,
  "qa-run.mjs --list prints one indented line per check; this reader expects two leading spaces.",
  20,
);

const executed = reachableFiles(gateChecks, scripts);

/* ── Enumerate what is on disk ─────────────────────────────────────────────── */

function walkDir(abs) {
  const out = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const child = join(abs, entry.name);
    if (entry.isDirectory()) out.push(...walkDir(child));
    else out.push(relative(ROOT, child));
  }
  return out;
}

const onDisk = ["tools", "scripts"]
  .filter((d) => existsSync(join(ROOT, d)))
  .flatMap((d) => walkDir(join(ROOT, d)))
  .filter(isValidatorFile)
  .sort();

assertNonEmpty(
  "validator files discovered under tools/ and scripts/",
  onDisk,
  "isValidatorFile() matches validate-/audit-/smoke-/verify- prefixed .mjs and .js files.",
  50,
);

/* ── Exemptions ────────────────────────────────────────────────────────────── */

let exempt = {};
if (existsSync(EXEMPT_FILE)) {
  try {
    const parsed = JSON.parse(readFileSync(EXEMPT_FILE, "utf8"));
    exempt = parsed.exempt || {};
  } catch (e) {
    fail(`qa-exempt.json is not valid JSON (${String(e).slice(0, 120)})`);
  }
}

const MIN_REASON = 25;

for (const [path, reason] of Object.entries(exempt)) {
  if (!existsSync(join(ROOT, path))) {
    fail(
      `qa-exempt.json exempts ${path}, which no longer exists — a stale exemption claims a human ` +
        "considered a file that is gone. Delete the entry.",
    );
    continue;
  }
  if (executed.has(path)) {
    fail(
      `qa-exempt.json exempts ${path}, but the gate now runs it — the exemption is obsolete and ` +
        "hides the fact that this file is covered. Delete the entry.",
    );
    continue;
  }
  if (typeof reason !== "string" || reason.trim().length < MIN_REASON) {
    fail(
      `qa-exempt.json entry for ${path} has no real reason (< ${MIN_REASON} chars). An exemption ` +
        "without a reason is silence with extra steps.",
    );
  }
}

/* ── Exemption reasons that cite CI must be telling the truth ──────────────── */

/* An exemption saying "already run by predeploy-verify.yml" is the reason a
 * reader accepts that a dark validator is fine. If that claim rots, the
 * registry stops being evidence and becomes reassurance.
 *
 * This is not hypothetical: two reasons in this file were WRONG when written.
 * `validate:lesson-visuals` was described as belonging in nightly CI "if it is
 * wanted automatically" while site-health.yml had run it weekly all along, and
 * `audit:a11y` was described as hand-run while production-observability.yml was
 * running it against production. Both errors came from grepping the workflows
 * for the FILE name (validate-lesson-visuals) instead of the SCRIPT name
 * (validate:lesson-visuals) — a mistake a human will make again and a check
 * will not. */
const WORKFLOWS = join(ROOT, ".github", "workflows");
const scriptNameFor = (file) =>
  Object.entries(scripts).find(([, cmd]) => nodeTargets(cmd).includes(file))?.[0] || null;

for (const [path, reason] of Object.entries(exempt)) {
  const cited = [...String(reason).matchAll(/([\w.-]+\.yml)/g)].map((m) => m[1]);
  if (!cited.length) continue;
  const script = scriptNameFor(path);
  for (const wf of cited) {
    const abs = join(WORKFLOWS, wf);
    if (!existsSync(abs)) {
      fail(`qa-exempt.json: ${path} cites ${wf}, which does not exist in .github/workflows/`);
      continue;
    }
    // Judge only the SENTENCE that cites the workflow. Reading the whole reason
    // produced a false positive on the first run: validate-production's reason
    // says "this proves what already shipped" in one sentence and "Belongs in
    // verify-deploy.yml" in the next, and the stray "already" made a
    // recommendation look like a claim.
    //
    // "Belongs in X" is aspirational and must never fail; "already run by X",
    // "X runs it" and "automated" are claims about today and must hold.
    const sentence =
      String(reason)
        .split(/(?<=[.;])\s+/)
        .find((part) => part.includes(wf)) || "";
    const isRecommendation = /\b(belongs?|should|would|could)\b/i.test(sentence);
    const claimsItRuns =
      !isRecommendation && /\b(already|runs? it|runs `|run by|automated)\b/i.test(sentence);
    if (!claimsItRuns || !script) continue;
    if (!readFileSync(abs, "utf8").includes(script)) {
      fail(
        `qa-exempt.json: ${path} claims ${wf} runs it, but that workflow never mentions ` +
          `\`${script}\`. Check the SCRIPT name, not the file name.`,
      );
    }
  }
}

/* ── The rule ──────────────────────────────────────────────────────────────── */

const dark = onDisk.filter((f) => !executed.has(f) && !(f in exempt));

for (const f of dark) {
  const hasScript = Object.entries(scripts).some(([, cmd]) => nodeTargets(cmd).includes(f));
  fail(
    `${f} is never executed by the gate${hasScript ? "" : " and has no npm script at all"} — it ` +
      "protects nothing. Wire it into the gate, or add it to qa-exempt.json with a reason.",
  );
}

/* ── Report ────────────────────────────────────────────────────────────────── */

if (failures.length) {
  console.error("✗ validate:gate-coverage");
  for (const m of failures) console.error(`   - ${m}`);
  console.error(
    `\n   ${onDisk.length} validator file(s) on disk, ${onDisk.length - dark.length} accounted for.`,
  );
  process.exit(1);
}

const exemptCount = Object.keys(exempt).length;
console.log(
  `✓ gate coverage holds — ${onDisk.length} validator file(s) on disk: ` +
    `${onDisk.length - exemptCount} executed by the gate, ${exemptCount} exempt with a stated ` +
    `reason, 0 dark. Gate resolved to ${gateChecks.length} check(s) from qa-run.mjs --list.`,
);
console.log(
  "   Reachability is source-level: it follows `node <file>` and `npm run <script>` through " +
    "package.json. A script path built from a variable reads as unreached, not as covered.",
);
