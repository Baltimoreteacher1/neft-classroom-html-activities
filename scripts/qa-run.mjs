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
import { SKIP_EXIT } from "../tools/lib/skip-exit.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const SCRIPTS = pkg.scripts || {};

/* --------------------------------------------------------------------------
 * The gate definition. This list is the SUPERSET of what scripts/qa-loop.sh
 * ran; `validate` is expanded below, which pulls in everything it chains.
 * Generators, formatters and anything that deploys stay out — this must remain
 * read-only apart from `build`.
 * ------------------------------------------------------------------------ */
/**
 * Turn a child process error into one of three outcomes.
 *
 * PASS / FAIL / SKIP, never two of them wearing the same face. Exit 3 is the
 * repo-wide SKIP code (tools/lib/skip-exit.mjs): the check could not run and
 * verified nothing. Exported so tools/skip-honesty.test.mjs can pin the mapping
 * — the whole point is that this classification cannot quietly regress to
 * "non-zero means fail, zero means pass".
 */
function classifyResult(err) {
  const skipped = err?.code === SKIP_EXIT;
  const ok = !err;
  return { ok, skipped, status: skipped ? "SKIP" : ok ? "PASS" : "FAIL" };
}

const GATE = [
  "build",
  // `check` (biome check), NOT `lint` (biome lint). Both are read-only, but
  // `lint` ignores formatting, and `biome check` -- the thing the PR-only
  // Pre-Deploy Gate actually runs -- does not. Because every deploy here goes
  // straight to `main` via `npm run ship`, which opens no PR, nothing ran
  // `biome check` for weeks and 32 format errors banked up unseen on `main`.
  // `check` is a strict superset of `lint`, so this only ever catches more.
  "check",
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
const UNIVERSAL = ["check"];
const CARRIES_SCRIPT = /\.(js|mjs|cjs|html?)$/i;
const COVERAGE = [
  // NOTEBOOK CHECKPOINTS — the three "write it in your notebook" gates every
  // core lesson declares. The validator is the only thing that can see a
  // checkpoint pointing at a phase the lesson does not have (it renders nowhere
  // and gates nothing while looking authored), and it is the only place the
  // default classroom copy is counted — a silent 100%-default forever is the
  // state this reporting exists to expose.
  [
    /^(engine\/core\/notebook-checkpoint\.js|engine\/styles\/notebook-checkpoint\.css|assets\/math-notes\/.*|curriculum\/student-supports\/math-notes\/.*|tools\/(validate-notebook-checkpoints|attach-notebook-checkpoints|validate-copy-panel-provenance)\.mjs|scripts\/generate-notebook-copy-panels\.mjs)$/,
    [
      "test",
      "validate:notebook",
      "validate:copy-panels",
      "validate:js-syntax",
      "validate:css-integrity",
      "check",
    ],
  ],
  // AUTHENTICATION — frozen at 4c2e13dab, documented in AUTH_CONTRACT.md.
  // Nothing here may change as a side effect of unrelated work: on 2026-08-16 a
  // teacher sign-in rewrite left teachers locked out for eleven hours while
  // every gate in this repo stayed green, because each one asked whether the
  // code was well-formed and none asked whether the auth MODEL was still the one
  // that works. `validate:auth-contract` holds the invariants AND a content pin
  // over these files, so touching one is a blocking event rather than an
  // invisible one. The browser half (`e2e:auth`, both engines) needs a server and
  // is not in the gate — run it before shipping any change to these paths.
  [
    /^(functions\/_middleware\.js|functions\/_lib\/teacher-surface\.js|engine\/core\/teacher-mode\.js|curriculum\/planning\/planning-store\.js|functions\/api\/pacing\/.*|tools\/(validate-auth-contract|auth-contract\.test|e2e-auth)\.mjs|data\/auth-baseline\.json|AUTH_CONTRACT\.md)$/,
    ["test", "validate:auth-contract", "validate:planning", "validate:js-syntax", "check"],
  ],
  // Shared interactive components + anything that ships CSS. `validate:css-integrity`
  // is the only check that can see the three ways malformed style reaches a
  // browser and is silently recovered from: a committed conflict marker, a file
  // losing a third of its rules to a parse error, and a <style> block inside a
  // JS template literal that a stray backtick in a COMMENT truncated — which
  // parses clean, throws at runtime, and renders the component unstyled.
  [
    /^(engine\/components\/(tool-tokens|long-division-[a-z]+)\.js|tools\/validate-css-integrity\.mjs)$/,
    ["test", "validate:css-integrity", "validate:js-syntax", "check"],
  ],
  // The small-group visual shell. Styled centrally for all 204 variants, so a
  // token change here is a change to every one of them. The browser sweep that
  // proves it (`sweep:small-group`) needs a preview server and is not in the
  // gate; what IS checkable without one is that the sheets still parse and the
  // shell's own tests still hold.
  [
    /^(assets\/small-group-[a-z]+\.css|engine\/core\/small-group-ui\.js|tools\/sweep-small-group-shell\.mjs)$/,
    ["test", "validate:js-syntax", "validate:small-groups", "eval:small-groups", "check"],
  ],
  // The lesson ADAPTATION layer: the shared catalogue, the in-lesson layer that
  // consumes it, the manifest generator that supplies variant/intrinsic data,
  // and the teacher surface that writes the profile. `validate:lesson-supports`
  // is the only check that can see the failure that matters here — a support
  // naming a capability the engine does not implement, which lints clean, types
  // clean, renders a correct-looking toggle, and does nothing.
  [
    /^(shared\/supports\/.*|assets\/learning-supports\/(learning-supports|supports-schema|supports-adaptations)\.js|curriculum\/student-supports\/.*|teacher-tools\/support-audit\/.*|scripts\/(generate-learning-supports-manifest|generate-support-overrides|generate-printable-lesson|generate-worksheets|generate-handout-html|generate-notes)\.mjs|engine\/core\/export\.js|tools\/(validate-lesson-supports|validate-support-equivalence|validate-learning-supports|validate-student-supports|lesson-supports\.test|learning-supports\.test|support-print\.test)\.mjs|data\/(lesson-support-overrides|lesson-support-applicability-review)\.json)$/,
    [
      "test",
      "validate:lesson-supports",
      "validate:support-equivalence",
      "validate:supports",
      "validate:student-supports",
      "validate:js-syntax",
      "typecheck",
      "validate:worksheet-audience",
    ],
  ],
  // The SCORM pipeline: the SCO builder, the ZIP writer, the two endpoints, the
  // CLI builders and the lesson-side bridge. `validate:scorm` greps the source
  // for the hardening guards, `validate:scorm:fleet` opens every generated
  // archive, and `test` runs the jsdom lifecycle suite against a mock LMS —
  // three different failure classes, none of which subsumes the others.
  [
    /^(functions\/(_lib\/scorm\.js|api\/scorm(-bundle)?\.js)|assets\/(lib\/zip-store\.js|canvas-bridge\.js)|tools\/scorm\/.*)$/,
    [
      "test",
      "validate:scorm",
      "validate:scorm:fleet",
      "validate:scorm-self-contained",
      "validate:canvas-coverage",
      "validate:js-syntax",
    ],
  ],
  // The bulk downloader is a generator + a gate + two front-end assets. The gate
  // re-derives the inventory's invariants and also re-checks the ?v= cache stamps
  // on both hub pages, which is the half of this feature a lint pass cannot see.
  [
    /^(scripts\/(generate-download-manifest\.mjs|lib\/download-taxonomy\.mjs)|data\/curriculum-download-manifest\.json|assets\/(curriculum-download\.(js|css)|lib\/zip-store\.js)|tools\/(validate-download-manifest|download-manifest\.test)\.mjs)$/,
    ["test", "validate:downloads", "validate:js-syntax", "validate:scorm"],
  ],
  // Unit identity metadata is keyed by the CURRENT unit number; an edit here or
  // to the units page must re-run the identity + placement pins.
  [
    /^(data\/curriculum-unit-identities\.json|tools\/unit-identities\.test\.mjs|scripts\/generate-lesson-platform-config\.mjs)$/,
    ["test", "validate:downloads", "validate:curriculum-top1"],
  ],
  // The units page is the authority on which unit an End-of-Unit resource belongs
  // to, so an edit there must re-run the placement gate.
  [
    /^(curriculum\/units\/index\.html|tools\/(validate-unit-resource-placement|unit-placement\.test|validate-curriculum-links)\.mjs|scripts\/lib\/download-taxonomy\.mjs)$/,
    [
      "validate:unit-placement",
      "validate:curriculum-links",
      "test",
      "validate:downloads",
      "validate:hub",
      "validate:static",
    ],
  ],
  // The three catalogues that decide what the unit hub offers on each lesson
  // row. Their keys are lesson ids and the hub looks them up with the CURRENT
  // id, so a stale key serves a different lesson's worksheet with a 200.
  [
    /^(curriculum\/lesson-(bonus-activities|family-homework)\.js|assets\/curriculum-hub-search\.js|tools\/validate-lesson-catalogues\.mjs|scripts\/generate-lesson-(bonus-map|family-homework-map)\.mjs)$/,
    ["validate:lesson-catalogues", "validate:js-syntax", "validate:hub", "test"],
  ],
  // Routing: data/routes.json is the source of truth for BOTH _redirects and
  // functions/_lib/redirect-map.js, and the middleware replays the map on a 404.
  // validate:routes catches a half-applied edit (the map generated but the
  // static file not, or vice versa); the test run pins the fallback behaviour.
  [
    /^(data\/routes\.json|_redirects|functions\/_lib\/redirect-map\.js|functions\/_middleware\.js|tools\/generate-route-files\.mjs|scripts\/lib\/live-lesson-shadows\.mjs)$/,
    ["test", "validate:static", "validate:js-syntax", "audit:links"],
  ],
  // The Pacing Planner spans a page, a shared engine, an API route, the seeded
  // baseline and a surface gate. The gate cross-checks the day-type vocabulary
  // across all three places it appears, and the test run covers the engine's
  // cascade rules, the D1 round-trip and the workbook export — so an edit here
  // stays on the fast lane instead of escalating to the full gate.
  [
    /^(curriculum\/planning\/|shared\/pacing\/|functions\/api\/pacing\/|data\/pacing-(baseline-2026-27|unit-ranges)\.json|docs\/pacing-sources\/|assets\/(curriculum-district-pacing|pacing-unit-dates\.generated)\.js|tools\/(validate-planning|validate-pacing-unit-order|import-pacing-baseline|lib\/pacing-dates|pacing-date-parity\.test|pacing-baseline-fresh\.test)\.mjs)/,
    [
      "test",
      "validate:planning",
      "validate:pacing-unit-order",
      "validate:static",
      "validate:js-syntax",
      "typecheck",
    ],
  ],
  // Plan Notes owns a page, an API route, a generated vocabulary and a write
  // gate. All four are covered by the one surface validator plus the test run,
  // which is what makes an edit here cheap instead of a full-gate escalation.
  [
    /^(curriculum\/plan-notes\/|functions\/_lib\/plan-(notes-validate|vocab)\.js|functions\/api\/plan-notes\/|scripts\/generate-plan-vocab\.mjs|tools\/validate-plan-notes\.mjs)/,
    ["test", "validate:plan-notes", "validate:static", "validate:js-syntax"],
  ],
  [
    /^(scripts\/sync-curriculum-to-drive\.mjs|scripts\/sync-lesson-html-to-documents\.sh|tools\/validate-drive-sync\.mjs|scripts\/lib\/drive-sync-classify\.mjs)$/,
    ["test", "validate:drive-sync", "validate:js-syntax"],
  ],
  [
    /^(tools\/validate-secrets\.mjs|scripts\/validate-production\.mjs|tools\/validate-production\.test\.mjs)$/,
    ["test", "validate:secrets", "validate:js-syntax"],
  ],
  [
    /^(scripts\/diagnose-(student|production)-access\.mjs|scripts\/lib\/cloudflare-access\.mjs|tools\/smoke-live-access\.test\.mjs)$/,
    ["test"],
  ],
  [/^scripts\/generate-warmups\.mjs$/, ["test"]],
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
      // a config edit is how an image stops being referenced
      "validate:reveal-assets",
      // vocabulary, the objective and the worked example all live here, and
      // scope drift is a change to one of them without the others
      "validate:interactive-alignment",
      "validate:learn-it-scope",
    ],
  ],
  // the generators and the two libraries that keep them contained
  [
    /^(tools\/(generate-small-group-lessons|generate-catchup-lessons|validate-generator-safety)\.mjs|tools\/lib\/(authored-overlay|write-set)\.mjs|scripts\/generate-editable-slides-page\.mjs)$/,
    ["test", "validate:generator-safety", "check"],
  ],
  // the two scope audits and the artifacts they read
  [
    /^(tools\/(lib\/)?(interactive-alignment|learn-it-scope)[.a-z-]*\.mjs|data\/(interactive-alignment|learn-it-scope)-review\.json)$/,
    ["test", "validate:interactive-alignment", "validate:learn-it-scope", "check"],
  ],
  // must precede the generic /^lessons\// rule below — first match wins
  [/^lessons\/[^/]+\/reveal-assets\//, ["validate:reveal-assets"]],
  // the retention manifest is part of the same contract as the files it records
  [/^data\/reveal-assets-retained\.json$/, ["validate:reveal-assets"]],
  [/^lessons\/[^/]+\/worksheet(-answer-key)?\.html$/, ["test", "validate:worksheet-audience"]],
  [/^tools\/validate-worksheet-audience\.mjs$/, ["test", "validate:worksheet-audience"]],
  // the deploy graph maps artifacts, mirrors and hook commands to real files;
  // editing any of those three is how the map starts lying
  [/^tools\/graph\//, ["validate:graph"]],
  [/^\.claude\/(settings\.json|hooks\/)/, ["validate:graph"]],
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
      "validate:projects-check",
      "validate:injection",
    ],
  ],
  /* The culminating-project PAGES live under math/, not curriculum/. A page
     edited there used to run no project validator at all — the projects rule
     above matches only the hub. */
  [
    /^math\/(?:pre-unit|unit-\d+|statistics)\/projects\//,
    [
      "validate:projects-publication",
      "validate:projects-award",
      "validate:solve-along",
      "validate:projects-check",
      "validate:preunit-project",
      "validate:injection",
    ],
  ],
  [/^tools\/lib\/project-units\.mjs$/, ["validate:preunit-project", "validate:projects-check"]],
  [
    /^shared\/projects\//,
    ["validate:projects-check", "validate:projects-award", "validate:preunit-project"],
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
  [/^\.github\/workflows\//, ["validate:workflow-yaml", "test"]],
  [/^data\/ccss-standards\.json$/, ["validate:ccss", "validate:scope"]],
  [/^data\/routes\.json$/, ["test", "validate:static", "audit:links"]],
  [/^data\//, ["validate:data-contracts", "validate:nervous-system"]],
  [/^tools\/inject-/, ["validate:injection", "validate:supports"]],
  [/^(tools|scripts)\/lib\/small-group/, ["validate:small-groups", "eval:small-groups"]],
  [/^functions\//, ["test", "validate:data-contracts"]],
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
export {
  CARRIES_SCRIPT,
  COVERAGE,
  classifyResult,
  expand,
  GATE,
  needsOf,
  resolveSet,
  scopeFor,
  UNIVERSAL,
};

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
          // Exit 3 is the repo-wide SKIP code (tools/lib/skip-exit.mjs): the
          // check could not run — no browser, no network, no credential — and
          // verified NOTHING. It is not a pass. `validate:lesson-boot` used to
          // exit 0 in exactly that situation and this table printed
          // `PASS validate:lesson-boot 4.6s`, indistinguishable from 16 pages
          // actually rendering. A gate that reports PASS without running is an
          // active false claim, which is worse than no gate at all.
          const { ok, skipped, status } = classifyResult(err);
          results.set(name, { ok, secs, didNotRun: skipped });
          logTo(`\n===== ${status} npm run ${name} (${secs}s) =====\n${stdout}\n${stderr}\n`);
          console.log(`${status}  ${name.padEnd(32)} ${secs}s${skipped ? "  (did not run)" : ""}`);
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

  const didNotRun = checks.filter((c) => results.get(c)?.didNotRun);
  const failed = checks.filter((c) => !results.get(c)?.ok && !results.get(c)?.didNotRun);
  const passed = checks.length - failed.length - didNotRun.length;
  const wall = ((Date.now() - started) / 1000).toFixed(1);
  console.log("---------------------------------------------------------------");
  console.log(
    `PASS ${passed}/${checks.length}${didNotRun.length ? `   SKIPPED ${didNotRun.length}` : ""}   wall ${wall}s   log ${LOG}`,
  );
  // Every skipped check is NAMED. "What did this run actually verify?" must
  // have a visible answer, not one implied by a green summary line.
  if (didNotRun.length) {
    console.log(`SKIPPED (verified NOTHING): ${didNotRun.join(", ")}`);
  }
  if (failed.length) {
    console.log(`FAILED: ${failed.join(", ")}`);
    console.log("Re-run one check with:  npm run qa:fast -- --only <name>");
    process.exit(1);
  }
  if (didNotRun.length && process.env.CI) {
    // In CI the missing browser/network/credential IS the defect. Locally a
    // skip warns and lets the push through, because a gate that blocks every
    // push over a missing browser is a gate that gets deleted.
    console.log("STATUS: FAIL — checks were skipped in CI, which must not report as a pass.");
    process.exit(1);
  }
  console.log(
    didNotRun.length
      ? `STATUS: PASS WITH ${didNotRun.length} SKIPPED — those checks verified nothing. No deploy, commit, or push performed.`
      : "STATUS: PASS — no deploy, commit, or push performed.",
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
