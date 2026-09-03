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
  // A killed child is a TIMEOUT, and a timeout is a FAILURE — never a skip.
  // `execFile` reports the kill as `err.killed`, and the exit code it carries
  // is the signal's, not the check's, so this must be tested BEFORE the
  // SKIP_EXIT comparison or a check killed mid-run could land on exit 3 and be
  // waved through as "did not run" instead of stopping the push.
  if (err?.killed) return { ok: false, skipped: false, timedOut: true, status: "TIMEOUT" };
  const skipped = err?.code === SKIP_EXIT;
  const ok = !err;
  return { ok, skipped, timedOut: false, status: skipped ? "SKIP" : ok ? "PASS" : "FAIL" };
}

/* How long any one check may run before it is killed and failed.
 *
 * There was no timeout at all until 2026-08-20: `execFile` was called without
 * one, so a check that hung hung `git push` with it, forever, with no output
 * saying which check was stuck. The realistic outcome of that is not a patient
 * wait — it is `--no-verify` becoming muscle memory, which disables the entire
 * gate. A bounded, named, loud failure is strictly better than an unbounded
 * wait.
 *
 * The ceiling is deliberately far above the slowest real check (`test`, ~76s;
 * `validate:production`, ~138s when run): this exists to catch a HANG, not to
 * police slowness, and a timeout tight enough to trip on a loaded laptop is a
 * flake that trains people to bypass it. Override with QA_TIMEOUT_MS. */
const TIMEOUT_MS = Number(process.env.QA_TIMEOUT_MS || 15 * 60 * 1000);

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
  // Boots six representative built pages in a real browser and fails on any
  // page error, non-/api 4xx, or raw JS leaked into body text. It served the
  // SOURCE tree until 2026-08-20, so it failed 6/6 on Vite-resolved specifiers
  // and was never wired; it now serves dist/, which is what Cloudflare serves.
  "smoke:injection",
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

/* Never run more than one of these at a time. `validate:lesson-boot` binds a
 * fixed port; `smoke:injection` launches a second Chromium, and two browser
 * harnesses racing on a loaded machine is how a gate becomes flaky enough to
 * get bypassed.
 *
 * `validate:visibility` joined them on 2026-08-26. It was already a browser
 * harness with its own static server, and it got heavier that day — it now
 * opens five pages instead of three and DRIVES them (answering a warm-up and
 * submitting it) rather than just measuring a first paint. Run alongside the
 * other two it produced exactly the failures this comment describes, and they
 * were the convincing kind: `Failed to resolve module specifier "web-vitals"`
 * and an `ERR_HTTP_RESPONSE_CODE_FAILURE` for a file that was on disk the whole
 * time. Both read as real page defects. Both vanish when the check runs on its
 * own against the same dist/. A third Chromium was the difference. */
const EXCLUSIVE = new Set([
  "validate:lesson-boot",
  "smoke:injection",
  "validate:visibility",
  // `validate:flow-walk` joined them on 2026-08-28. It is the heaviest browser
  // member of the set — it opens two pages per lesson (one to read the taught
  // sequence, one to walk it clean) and drives ~10 navigations on each.
  "validate:flow-walk",
]);

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
  // LESSON FLOW — the forward control, the act step strip and the fixed chrome
  // that floats over them. These three files are where "press Next and see
  // where it lands" is decided, and on 2026-08-28 all three were individually
  // correct while the pill on Act 2's Launch read "Next: Exit Ticket". The
  // browser walk is the only check that can see that, so any edit here pays for
  // it; `test` comes along for act-flow-contract.test.mjs, the source-text twin.
  [
    /^(engine\/core\/(app|lesson-renderer)\.js|engine\/styles\/present-mode\.css|engine\/core\/present-mode\.js|tools\/(validate-lesson-flow-walk|act-flow-contract\.test)\.mjs)$/,
    [
      "validate:flow-walk",
      "test",
      "validate:visibility",
      "validate:js-syntax",
      "typecheck",
      "check",
    ],
  ],

  // PRODUCT DECISIONS — the registry of choices a human made that a gate now
  // enforces, and the provenance test that keeps an agent's own default out of
  // it. Editing either is editing what the gates are ALLOWED to insist on.
  [/^(data\/product-decisions\.json|tools\/product-decisions\.test\.mjs)$/, ["test", "check"]],

  // GATE COVERAGE — the check that decides which validators are allowed not to
  // gate. Its own inputs are the gate definition and the exemption registry, so
  // a change to either must re-run it; `check` comes along because both files
  // are Biome-formatted.
  [
    /^(tools\/validate-gate-coverage\.mjs|qa-exempt\.json|tools\/lib\/non-empty\.mjs)$/,
    ["validate:gate-coverage", "test", "check"],
  ],

  // SLIDE ↔ LEARN IT ALIGNMENT — the projected deck and the Learn It stepper
  // both derive from launch.conceptIntro, and this gate is what proves the
  // committed deck, the runtime config, and the panel's math transformations
  // still present ONE problem. Its first sweep caught two live false
  // equations (0.7v → 7v, 2.5h → 5h) that every other gate was green on.
  [
    /^(tools\/validate-learn-slide-alignment\.mjs|engine\/core\/learn-step-model(\.test)?\.(js|mjs)|scripts\/generate-slides\.mjs|engine\/components\/vocab-learn-panel\.js)$/,
    ["test", "validate:learn-slide-alignment", "validate:js-syntax", "check"],
  ],
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
  // SHARED COMPONENT CLAIMS — a string hardcoded in a component is not lesson
  // data, so every provenance gate is blind to it. Twice now a shared surface
  // has taught one lesson's mathematics to all of them.
  [
    /^(engine\/(components|core)\/.*\.js|shared\/.*\.js|assets\/math-notes\/.*|tools\/validate-shared-component-claims\.mjs|data\/shared-component-claims-review\.json)$/,
    ["validate:shared-claims", "validate:js-syntax", "check"],
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
  //
  // `validate:route-contract` rides along on the same paths and asks the OTHER
  // question. The auth contract asks whether the model is intact; the route
  // contract asks whether any URL changed what it ANSWERS. On 2026-08-25
  // `/curriculum/` was turned from a public 200 into a 302 and shipped with
  // qa:loop 99/99, e2e:auth 32/32 in both engines and smoke:live 34/34 — every
  // gate asked "does this behave as specified?" and none asked "should this
  // URL's answer change at all?". It was reverted within the hour.
  [
    /^(functions\/_middleware\.js|functions\/_lib\/teacher-surface\.js|engine\/core\/teacher-mode\.js|curriculum\/planning\/planning-store\.js|functions\/api\/pacing\/.*|tools\/(validate-auth-contract|validate-route-contract|auth-contract\.test|e2e-auth)\.mjs|data\/(auth-baseline|public-route-contract)\.json|AUTH_CONTRACT\.md)$/,
    [
      "test",
      "validate:auth-contract",
      "validate:route-contract",
      "validate:planning",
      "validate:js-syntax",
      "check",
    ],
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
  [/^lessons\/[^/]+\/worksheet(-2)?(-answer-key)?\.html$/, ["test", "validate:worksheet-audience"]],
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

  /* --- Preflight: the tree must match the lockfile --------------------------
   * Runs before `build`, which is the barrier every other check waits on. A
   * stale node_modules makes build fail with a bundler resolve error naming the
   * missing IMPORT and not the cause, so all 76 checks report FAILED and the
   * branch under test gets blamed for the environment. Cost a full three-stage
   * verification cycle on 2026-08-18. Fails fast, with the command that fixes it.
   */
  try {
    execFileSync("node", [join(ROOT, "tools", "validate-deps-installed.mjs"), "--quiet"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  } catch {
    console.error("\nqa-run: preflight failed — not running the gate against a stale tree.");
    process.exit(2);
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
        { cwd: ROOT, maxBuffer: 64 * 1024 * 1024, timeout: TIMEOUT_MS, killSignal: "SIGKILL" },
        (err, stdout, stderr) => {
          const secs = ((Date.now() - t0) / 1000).toFixed(1);
          // Exit 3 is the repo-wide SKIP code (tools/lib/skip-exit.mjs): the
          // check could not run — no browser, no network, no credential — and
          // verified NOTHING. It is not a pass. `validate:lesson-boot` used to
          // exit 0 in exactly that situation and this table printed
          // `PASS validate:lesson-boot 4.6s`, indistinguishable from 16 pages
          // actually rendering. A gate that reports PASS without running is an
          // active false claim, which is worse than no gate at all.
          const { ok, skipped, timedOut, status } = classifyResult(err);
          results.set(name, { ok, secs, didNotRun: skipped, timedOut });
          logTo(`\n===== ${status} npm run ${name} (${secs}s) =====\n${stdout}\n${stderr}\n`);
          const note = timedOut
            ? `  (KILLED after ${(TIMEOUT_MS / 1000).toFixed(0)}s — hung, not slow)`
            : skipped
              ? "  (did not run)"
              : "";
          console.log(`${status}  ${name.padEnd(32)} ${secs}s${note}`);
          if (!ok) {
            const tail = `${stdout}\n${stderr}`.trim().split("\n").slice(-12);
            for (const l of tail) console.log(`      | ${l}`);
            // EXCLUSIVE serialises the browser checks against each other and
            // against the other ~100 checks in THIS run. It cannot see a
            // browser outside the run -- an editor preview, a Playwright/MCP
            // session, a Chrome window with a heavy tab -- and those cost the
            // same races. The signatures below are the ones that lie: each
            // names a real-looking page defect (an unresolvable module, a 404,
            // a dead socket) for a file that was on disk and correct the whole
            // time. On 2026-09-02 validate:visibility failed with the
            // web-vitals one while an agent's Playwright Chromium was open,
            // then passed 5/5 alone against the same dist/.
            //
            // Say so. An unexplained browser failure on a healthy tree is the
            // reason people reach for --no-verify.
            if (EXCLUSIVE.has(name)) {
              const CONTENTION = [
                /Failed to resolve module specifier/i,
                /ERR_HTTP_RESPONSE_CODE_FAILURE/i,
                /ERR_CONNECTION_(REFUSED|RESET)/i,
                /Timeout .* exceeded/i,
                /net::ERR_/i,
                /http404/i,
              ];
              const blob = `${stdout}\n${stderr}`;
              if (CONTENTION.some((re) => re.test(blob))) {
                console.log(
                  `      ^ ${name} is a browser check, and this failure matches a known ` +
                    "CONTENTION signature, not a known page defect.",
                );
                console.log(
                  "        Close other browsers (including any agent/MCP session) and re-run " +
                    `alone:  npm run qa:fast -- --only ${name}`,
                );
                console.log(
                  "        If it passes alone against the same dist/, the tree is fine and this " +
                    "was the machine. If it fails alone, it is real.",
                );
              }
            }
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
        // EXCLUSIVE means ALONE, not merely "not beside another exclusive".
        // These checks drive a real browser against a static server they start
        // themselves, and they lose races to ordinary CPU load, not just to
        // each other: smoke:injection failed EVERY full run at --jobs 8 with
        // `http404` on /games/3d/unit-2/ — a page that was on disk the whole
        // time and served 200 the moment the check ran by itself. The same run
        // passes 105/105 at --jobs 2. That is the failure the comment above
        // EXCLUSIVE already describes, and it was only half-fixed: serialising
        // the exclusives against one another still left ~100 other checks
        // saturating the machine beside them. A gate that fails on a healthy
        // tree is worse than a slow one — it is the reason people reach for
        // --no-verify. Costs ~11s on a full run.
        if (EXCLUSIVE.has(c)) {
          if (exclusiveBusy || running.size > 0) continue;
          exclusiveBusy = true;
        } else if (exclusiveBusy) {
          continue;
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
  const timedOut = checks.filter((c) => results.get(c)?.timedOut);
  if (timedOut.length) {
    console.log(
      `TIMED OUT (killed, verified nothing): ${timedOut.join(", ")} — a hung check is a failure, ` +
        "not a pass. Re-run it alone to see where it stops, or raise QA_TIMEOUT_MS if it is " +
        "genuinely this slow.",
    );
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
