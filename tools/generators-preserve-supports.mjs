#!/usr/bin/env node
/**
 * A generator must not strip the supports its pages have grown.
 *
 * `build-injectors-idempotent.test.mjs` proves the BUILD chain leaves committed
 * source alone. Everything outside that chain was unguarded, and it mattered:
 * `generate-unit0` spent months able to rewrite all 33 Unit 0 pages from
 * templates that had fallen behind them, discarding the interactive vocabulary
 * scaffolding, the plain-language rewrites and the shared kit — on the
 * foundational unit, for the students with the least margin. Nothing failed.
 * `validate:injection` catches the shared-kit half only once the damage is
 * already committed, and says nothing at all about vocabulary.
 *
 * So this runs every generator-shaped npm script that the build does NOT run,
 * on a clean tree, and looks at the DIRECTION of what it changes:
 *
 *   - removing support markup it cannot reproduce  -> failure
 *   - adding it, or rebuilding stale output        -> fine
 *
 * Direction is the whole point. Plenty of these generators legitimately differ
 * from their committed output because that output is simply stale; rebuilding
 * is overdue, not dangerous. Only removal costs a student something.
 *
 * This is slow — it executes dozens of generators — so it must NOT be part of
 * `npm test`. Note the filename: tools/run-tests.mjs discovers every
 * *.test.mjs in the tree and runs it, so calling this a `.test.mjs` silently
 * enrolled it in the suite and hung CI for twenty minutes on the PR that added
 * it. The name is load-bearing. Run it via `npm run validate:generators`.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 28 });
const dirtyTracked = () =>
  git("status", "--porcelain", "--untracked-files=no")
    .split("\n")
    .filter(Boolean)
    .map((l) => l.slice(3));

// Reverting tracked files is not enough to leave the tree as found: several of
// these generators also CREATE files (homework.docx, mcap packet pages). Left
// behind, they are invisible to a `git status --untracked-files=no` check and
// get swept into whatever someone commits next — which is exactly what happened
// while this file was being written, when a `git add -A` picked up 208 of them.
const untracked = () =>
  git("status", "--porcelain", "--untracked-files=all")
    .split("\n")
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(3));

/**
 * A support a student depends on, and every markup shape that provides it.
 *
 * Detection is per FILE and per CAPABILITY, not per line, because counting
 * removed lines cannot tell replacement from loss. generate-readiness looked
 * like the worst offender in the estate — 192 `openVocabModal` lines removed,
 * none added — when what it actually does is retire an ad-hoc runtime
 * linkifier in favour of a curated Vocabulary tab with per-term Level 1
 * definitions from scripts/readiness/data/vocab/. Different markup, same
 * capability, better pedagogy. A line count scores that as a catastrophe and
 * would have sent someone to "fix" an improvement.
 *
 * So the question asked here is only: did a file that HAD this capability come
 * out of the generator without it?
 */
const SUPPORT = [
  [
    "vocabulary support",
    /vocab-word|openVocabModal|vocab-card|ewl-vocab-link|panel-vocab|tab-vocab|class="vterm"/,
  ],
  [
    "shared kit",
    /-injected:(begin|end)|save-resume-|mobile-access\.css|math-workbench-launcher|formula-popup/,
  ],
  ["ESOL / TWR supports", /twr-es-|twr-rehearse|es-support|lang-support|sentence-stem/],
  ["accessibility", /aria-|role="tab"|skip-link|prefers-reduced-motion/],
];

/**
 * Generators that strip a support TODAY, with what each costs, measured on
 * 2026-08-09. Recorded rather than silently tolerated: the test fails if one
 * gets WORSE, or if a generator not on this list starts stripping. Fixing one
 * means dropping its entry — the list should only ever shrink.
 *
 * There is one. An earlier pass that counted removed LINES said thirteen, and
 * was wrong about nine of them: those generators replace support markup rather
 * than remove it, and a line count cannot see the difference. Three of the
 * remaining four were fixed by adopting writeGenerated().
 *
 * The pattern that fixes them is the one applied to generate-unit0: write only
 * what is missing, never overwrite a page that has moved on, and put the
 * support markup in the template so a newly created page starts with it.
 */
const KNOWN = {
  "generate-lesson-shells": {
    lost: 148,
    why:
      "148 files lose @media(prefers-reduced-motion:reduce){.sg-boot{animation:none}}. " +
      "Unlike the others this is NOT an injected block, so writeGenerated() cannot " +
      "preserve it: the rule comes from tools/lib/compact-shell.mjs, a second shell " +
      "builder that also writes these pages. Fixing it means reconciling the two " +
      "builders, not adopting the helper",
  },
};

const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
const expand = (name, seen = new Set()) => {
  if (seen.has(name)) return [];
  seen.add(name);
  return (pkg.scripts[name] || "")
    .split("&&")
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((step) => {
      const nested = step.match(/^npm run ([\w:-]+)$/);
      return nested ? expand(nested[1], seen) : [step];
    });
};
const inBuild = new Set(expand("build"));

const CANDIDATE = /^(generate|gen|build|inject|sync|decorate|refresh|apply|prepare)[:-]?/i;
const EXCLUDE =
  /^(validate|test|lint|format|typecheck|audit|eval|verify|check|deploy|preview|dev|start|serve|e2e|discard|stamp)/i;

const targets = Object.keys(pkg.scripts)
  .filter((k) => CANDIDATE.test(k) && !EXCLUDE.test(k))
  .filter((k) => !inBuild.has(`npm run ${k}`))
  .filter((k) => {
    const body = (pkg.scripts[k] || "").trim();
    return /^node\s+\S+/.test(body) && !inBuild.has(body);
  });

const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const run = only.length ? targets.filter((t) => only.includes(t)) : targets;

console.log("generators preserve the supports their pages carry");

if (dirtyTracked().length) {
  console.log(
    "   ⚠ skipped: tracked files already modified. Commit or stash, then re-run —\n" +
      "     otherwise a generator's output cannot be told from your edits.",
  );
  // SKIP, not PASS: no generator output was compared on this run.
  process.exit(skipExit("the tree already has modified tracked files"));
}

const untrackedBefore = new Set(untracked());
let failures = 0;
const regressed = [];
const fixed = [];

for (const name of run) {
  let errored = false;
  try {
    execFileSync("npm", ["run", name], {
      cwd: ROOT,
      stdio: "pipe",
      timeout: 420000,
      env: { ...process.env, PATH: `${resolve(ROOT, "node_modules/.bin")}:${process.env.PATH}` },
    });
  } catch {
    errored = true; // partial output is still worth measuring
  }

  const files = dirtyTracked();
  // Per file, per capability: did something that HAD this support come out
  // without it? Replacement (different markup, same capability) is not loss,
  // which is the whole reason this is not a line count.
  const tally = {};
  let lost = 0;
  for (const f of files) {
    let before = "";
    try {
      before = git("show", `HEAD:${f}`);
    } catch {
      continue; // newly added file — nothing could be lost from it
    }
    let after = "";
    try {
      after = readFileSync(resolve(ROOT, f), "utf8");
    } catch {
      continue;
    }
    for (const [label, re] of SUPPORT) {
      if (re.test(before) && !re.test(after)) {
        tally[label] = (tally[label] || 0) + 1;
        lost++;
      }
    }
  }
  if (files.length) git("checkout", "--", ...files);
  const created = untracked().filter((f) => !untrackedBefore.has(f));
  for (const f of created) {
    try {
      rmSync(resolve(ROOT, f), { force: true });
    } catch {
      /* best effort — reported below rather than thrown */
    }
  }

  const known = KNOWN[name];
  const detail = Object.entries(tally)
    .map(([k, v]) => `${v} file(s) lost ${k}`)
    .join("; ");

  if (lost === 0) {
    if (known) {
      fixed.push(name);
      console.log(`   ✓ ${name}: no longer strips supports — drop it from KNOWN`);
    }
    continue;
  }
  if (!known) {
    failures++;
    regressed.push(name);
    console.error(
      `   ✗ ${name} leaves ${lost} committed file(s) WITHOUT a support they had:\n` +
        `       ${detail}\n` +
        `     It rewrites pages from templates that no longer match them, so a run\n` +
        `     discards supports it cannot reproduce. Write only what is missing and\n` +
        `     never overwrite a page that has moved on — see scripts/generate-unit0.mjs.`,
    );
  } else if (lost > known.lost) {
    failures++;
    regressed.push(name);
    console.error(
      `   ✗ ${name} got worse: ${lost} file/capability loss(es), was ${known.lost}\n` +
        `       ${detail}`,
    );
  } else {
    console.log(
      `   – ${name}: known, ${lost} file/capability loss(es) (baseline ${known.lost})` +
        `${errored ? " [errored partway]" : ""}\n       ${known.why}`,
    );
  }
}

console.log(
  `\n   ${run.length} generator(s) checked, ${Object.keys(KNOWN).length} known offender(s)`,
);
if (fixed.length) {
  console.log(
    `   ${fixed.length} improved — remove from KNOWN so the list keeps shrinking: ${fixed.join(", ")}`,
  );
}
if (failures) {
  console.error(
    `\n✗ ${failures} generator(s) strip supports that are not accounted for: ${regressed.join(", ")}`,
  );
  process.exit(1);
}
console.log("   ✓ no new or worsened support-stripping");
