#!/usr/bin/env node
/* =============================================================================
 * qa-run.mjs — parallel, de-duplicated, change-scoped QA runner.
 * -----------------------------------------------------------------------------
 *   node scripts/qa-run.mjs              # FULL gate (what pre-push runs)
 *   node scripts/qa-run.mjs --changed    # inner-loop gate, scoped to git diff
 *   node scripts/qa-run.mjs --only a,b   # run named checks only
 *   node scripts/qa-run.mjs --list       # print the resolved check set, run none
 *   node scripts/qa-run.mjs --jobs 4     # override concurrency
 *
 * WHY THIS EXISTS
 * ---------------
 * scripts/qa-loop.sh ran 18 npm scripts strictly serially, and six of them
 * (test, validate:static, validate:reveal-math, validate:save-resume,
 * validate:injection, audit:links) were ALREADY members of `npm run validate`,
 * so they executed twice. Measured on 2026-08-01: 90s wall, ~24s of it pure
 * duplicate work, and 39 of the 45 distinct checks finish in under a second
 * while three long poles (build 15s, validate:js-syntax 21s, test 21s) blocked
 * everything behind them.
 *
 * This runner keeps the check SET identical — nothing is dropped, so the
 * deploy gate is exactly as strict — and only changes the scheduling:
 *
 *   • `validate` is EXPANDED into its members (read out of package.json, never
 *     hard-coded here) so they can run concurrently.
 *   • Every check runs at most once.
 *   • Independent checks run in a worker pool; only declared dependencies wait.
 *
 * CHANGE-SCOPED MODE (--changed) is for the inner dev loop, NOT for the deploy
 * gate. It is DEFAULT-DENY: a changed path that matches no coverage rule
 * escalates to the full set. It can only ever run fewer checks when every
 * changed file is provably covered by a narrower set.
 * ========================================================================== */

import { execFile, execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { cpus } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const SCRIPTS = pkg.scripts || {};

/* --------------------------------------------------------------------------
 * The gate definition. This list is the SUPERSET of what scripts/qa-loop.sh
 * ran; `validate` is expanded below, which pulls in everything it chains.
 * Generators, formatters and anything that deploys stay out — this must remain
 * read-only apart from `build`.
 * ------------------------------------------------------------------------ */
const GATE = [
  "build",
  "lint",
  "validate",
  "validate:homework",
  "validate:practice",
  "validate:lesson-boot",
  "audit",
  "audit:curriculum",
  "audit:homework",
];

/* `build` is a BARRIER, not just a peer. It is the only member of the gate that
 * writes to the working tree — the injectors under tools/inject-*.mjs rewrite
 * curriculum pages, generate-printable-lesson.mjs emits lesson HTML, and vite
 * populates dist/. Every validator reads some of that, so running one
 * concurrently with the build would let it observe a half-written tree. The
 * serial loop got this right by accident (build was simply first); here it is
 * declared. Cost: the build's 15s stays on the critical path. Benefit: the
 * remaining 46 checks then collapse from ~75s of queueing to one ~21s wave.
 *
 * In --changed mode `build` is not in the set at all, and dependencies on
 * checks outside the set are dropped — the inner loop reads source directly. */
const needsOf = (c) => (c === "build" ? [] : ["build"]);

/* Never run more than one of these at a time — they bind the same port. */
const EXCLUSIVE = new Set(["validate:lesson-boot"]);

/* --------------------------------------------------------------------------
 * Change coverage. Each rule is [RegExp, checks[]]. A changed path uses the
 * FIRST matching rule. Unmatched paths force the full gate, so adding a new
 * kind of file is safe by default — it just costs a full run until someone
 * teaches this table about it.
 * ------------------------------------------------------------------------ */
/* Always-on (cheap). `validate:js-syntax` is deliberately NOT here: it sweeps
 * ~1,000 files plus ~3,100 inline blocks and costs 23s, which would be the
 * whole budget of a "fast" lane. It is added below only when a changed path can
 * actually carry a script, and the full gate at push time runs it regardless. */
const UNIVERSAL = ["lint"];
const CARRIES_SCRIPT = /\.(js|mjs|cjs|html?)$/i;
const COVERAGE = [
  [
    /^lessons\/[^/]+\/config\.json$/,
    [
      "validate:math",
      "validate:ccss",
      "validate:connect",
      "validate:homework",
      "validate:practice",
      "validate:scope",
      "audit:homework",
    ],
  ],
  [
    /^lessons\//,
    ["validate:static", "validate:save-resume", "validate:lesson-boot", "audit:links"],
  ],
  [/^curriculum\/ai-hub\//, ["validate:ai-hub", "validate:hub", "audit:links"]],
  [/^curriculum\/forge\//, ["validate:forge"]],
  [/^curriculum\/showcase\//, ["validate:showcase"]],
  [/^curriculum\/class-boss\//, ["validate:class-boss"]],
  [/^curriculum\/teach-the-machine\//, ["validate:teach-machine"]],
  [/^curriculum\/family-connections\//, ["validate:family-broadcast"]],
  [
    /^curriculum\/projects\//,
    [
      "validate:projects-publication",
      "validate:projects-award",
      "validate:solve-along",
      "validate:injection",
    ],
  ],
  [
    /^curriculum\/index\.html$/,
    [
      "validate:hub",
      "validate:curriculum-top1",
      "validate:teacher-workflow",
      "validate:guided-path",
      "validate:curriculum-product",
      "audit:links",
    ],
  ],
  [
    /^curriculum\//,
    ["validate:hub", "validate:runtime", "validate:static", "audit:links", "audit:curriculum"],
  ],
  [/^\.github\/workflows\//, ["validate:workflow-yaml"]],
  [/^data\/ccss-standards\.json$/, ["validate:ccss", "validate:scope"]],
  [/^data\/routes\.json$/, ["validate:static", "audit:links"]],
  [/^data\//, ["validate:data-contracts", "validate:nervous-system"]],
  [/^tools\/inject-/, ["validate:injection", "validate:supports"]],
  [/^(tools|scripts)\/lib\/small-group/, ["validate:small-groups", "eval:small-groups"]],
  [/^functions\//, ["validate:data-contracts"]],
  [/^docs\/|\.md$/, []],
];

/* -------------------------------------------------------------------------- */

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const optVal = (n) => {
  const i = args.indexOf(n);
  return i === -1 ? null : args[i + 1];
};
const MODE_CHANGED = flag("--changed");
const LIST_ONLY = flag("--list");
const ONLY = optVal("--only");
const JOBS = Number(optVal("--jobs")) || Math.max(2, Math.min(8, cpus().length - 1));

/** Expand `npm run a && npm run b` chains into their members, recursively.
 *  Only pure chains expand; anything with a bare command stays atomic so we
 *  never reorder a script whose steps depend on each other. */
function expand(name, seen = new Set()) {
  if (seen.has(name)) return [];
  seen.add(name);
  const body = SCRIPTS[name];
  if (!body) return [];
  const parts = body.split("&&").map((s) => s.trim());
  if (!parts.every((p) => /^npm run [\w:@.-]+$/.test(p))) return [name];
  return parts.flatMap((p) => expand(p.replace(/^npm run /, ""), seen));
}

function resolveSet(names) {
  const out = [];
  const seen = new Set();
  for (const n of names) {
    for (const leaf of expand(n)) {
      if (!seen.has(leaf) && SCRIPTS[leaf]) {
        seen.add(leaf);
        out.push(leaf);
      }
    }
  }
  return out;
}

function changedPaths() {
  const run = (a) => {
    try {
      return execFileSync("git", a, { cwd: ROOT, encoding: "utf8" });
    } catch {
      return "";
    }
  };
  const override = optVal("--paths");
  if (override)
    return override
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const merged = `${run(["diff", "--name-only", "HEAD"])}\n${run(["ls-files", "--others", "--exclude-standard"])}`;
  return [
    ...new Set(
      merged
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
}

function scopeFor(paths) {
  if (paths.length === 0) return null; // nothing changed → caller decides
  const picked = new Set(UNIVERSAL);
  if (paths.some((p) => CARRIES_SCRIPT.test(p))) picked.add("validate:js-syntax");
  for (const p of paths) {
    const rule = COVERAGE.find(([re]) => re.test(p));
    if (!rule) return null; // default-deny → full gate
    for (const c of rule[1]) picked.add(c);
  }
  return [...picked];
}

/* --------------------------------------------------------------------------
 * Everything above is pure and exported for tools/qa-run.test.mjs, which pins
 * the safety property that matters: the FULL set must remain a superset of the
 * checks the old serial loop ran. A scheduler that quietly stops running a
 * gate is worse than a slow one.
 * ------------------------------------------------------------------------ */
export { CARRIES_SCRIPT, COVERAGE, expand, GATE, needsOf, resolveSet, scopeFor, UNIVERSAL };

async function main() {
  /* --- Decide the check set ------------------------------------------------- */
  let checks;
  let label;
  if (ONLY) {
    checks = resolveSet(ONLY.split(",").map((s) => s.trim()));
    label = "explicit --only set";
  } else if (MODE_CHANGED) {
    const paths = changedPaths();
    const scoped = scopeFor(paths);
    if (scoped) {
      checks = resolveSet(scoped);
      label = `change-scoped (${paths.length} changed file(s))`;
    } else {
      checks = resolveSet(GATE);
      label =
        paths.length === 0
          ? "FULL (no changes detected)"
          : "FULL (a changed path has no coverage rule)";
    }
  } else {
    checks = resolveSet(GATE);
    label = "FULL gate";
  }

  const missing = checks.filter((c) => !SCRIPTS[c]);
  if (missing.length) {
    console.error(`qa-run: unknown script(s): ${missing.join(", ")}`);
    process.exit(2);
  }

  console.log("===============================================================");
  console.log(`EduWonderLab QA — ${label}`);
  console.log(`Checks: ${checks.length}   Concurrency: ${JOBS}`);
  console.log("===============================================================");

  if (LIST_ONLY) {
    for (const c of checks) {
      const after = needsOf(c).filter((d) => checks.includes(d));
      console.log(`  ${c}${after.length ? `  (after ${after.join(", ")})` : ""}`);
    }
    process.exit(0);
  }

  /* --- Run ------------------------------------------------------------------ */
  const LOG_DIR = join(ROOT, ".qa-logs");
  mkdirSync(LOG_DIR, { recursive: true });
  const LOG = join(LOG_DIR, `qa-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
  const logTo = (s) => appendFileSync(LOG, s);
  logTo(`${label}\n`);

  const results = new Map();
  const pending = new Set(checks);
  const running = new Set();
  let exclusiveBusy = false;
  const started = Date.now();

  const ready = (c) => needsOf(c).every((d) => !checks.includes(d) || results.get(d)?.ok);
  const blocked = (c) =>
    needsOf(c).some((d) => checks.includes(d) && results.get(d) && !results.get(d).ok);

  function runOne(name) {
    return new Promise((resolve) => {
      const t0 = Date.now();
      execFile(
        "npm",
        ["run", name],
        { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 },
        (err, stdout, stderr) => {
          const secs = ((Date.now() - t0) / 1000).toFixed(1);
          const ok = !err;
          results.set(name, { ok, secs });
          logTo(
            `\n===== ${ok ? "PASS" : "FAIL"} npm run ${name} (${secs}s) =====\n${stdout}\n${stderr}\n`,
          );
          console.log(`${ok ? "PASS" : "FAIL"}  ${name.padEnd(32)} ${secs}s`);
          if (!ok) {
            const tail = `${stdout}\n${stderr}`.trim().split("\n").slice(-12);
            for (const l of tail) console.log(`      | ${l}`);
          }
          resolve();
        },
      );
    });
  }

  async function pump() {
    while (pending.size || running.size) {
      let launched = false;
      for (const c of [...pending]) {
        if (running.size >= JOBS) break;
        if (blocked(c)) {
          pending.delete(c);
          results.set(c, { ok: false, secs: "0.0", skipped: true });
          console.log(`SKIP  ${c.padEnd(32)} (dependency failed)`);
          continue;
        }
        if (!ready(c)) continue;
        if (EXCLUSIVE.has(c)) {
          if (exclusiveBusy) continue;
          exclusiveBusy = true;
        }
        pending.delete(c);
        running.add(c);
        launched = true;
        runOne(c).then(() => {
          running.delete(c);
          if (EXCLUSIVE.has(c)) exclusiveBusy = false;
        });
      }
      if (!launched && running.size === 0 && pending.size) {
        for (const c of pending) {
          results.set(c, { ok: false, secs: "0.0", skipped: true });
          console.log(`SKIP  ${c.padEnd(32)} (unsatisfiable dependency)`);
        }
        pending.clear();
        break;
      }
      await new Promise((r) => setTimeout(r, 60));
    }
  }

  await pump();

  const failed = checks.filter((c) => !results.get(c)?.ok);
  const wall = ((Date.now() - started) / 1000).toFixed(1);
  console.log("---------------------------------------------------------------");
  console.log(
    `PASS ${checks.length - failed.length}/${checks.length}   wall ${wall}s   log ${LOG}`,
  );
  if (failed.length) {
    console.log(`FAILED: ${failed.join(", ")}`);
    console.log("Re-run one check with:  npm run qa:fast -- --only <name>");
    process.exit(1);
  }
  console.log("STATUS: PASS — no deploy, commit, or push performed.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
