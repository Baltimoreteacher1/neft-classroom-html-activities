#!/usr/bin/env node
/**
 * `npm run build` must not modify committed source.
 *
 * The build chain runs eleven tools/inject-projects-*.mjs steps that splice
 * markup into tracked HTML files IN PLACE, before vite ever runs. That design
 * has produced real incidents here: a script spliced before the FIRST
 * </body> and landed inside an example block, and a bulk rewrite shipped
 * assets/game-fx.js truncated mid-function, dead across ~114 games.
 *
 * The property that makes in-place injection survivable is idempotency: with
 * the layers already committed, a build is a no-op on source. That is true
 * today — and completely untested, so it could stop being true silently, with
 * the damage landing as a mystery diff in whatever commit the next agent makes
 * (this repo auto-commits, so a build-time mutation gets committed by someone
 * who never ran the build).
 *
 * This test runs each build-chain injector and asserts the working tree is
 * unchanged afterwards. A non-idempotent injector fails here with the file it
 * touched, instead of quietly rewriting the site.
 *
 * tools/stamp-build.mjs is covered too, for a different reason: it is not an
 * injector but a STAMPER, and its output is a build id, so it can never be
 * idempotent on anything it writes. The rule for it is therefore absolute —
 * write dist/ only. It used to also rewrite the tracked public/sw.js and two
 * curriculum/*.html copies that nothing serves (Cloudflare rebuilds dist/ from
 * a clean checkout), which dirtied three files on every local build.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The steps are DERIVED from package.json's `build` script rather than listed
 * here, because a hand-list silently under-covers the chain. This test used to
 * name eleven `tools/inject-projects-*` steps out of the ~20 the build runs, so
 * everything else — every generator, and `vite build` itself — was unguarded.
 * `vite build` splices the save/resume layer into tracked HTML through a plugin,
 * which is exactly the class of defect this file exists to catch, and it went
 * unnoticed until a build left it as a mystery diff in someone else's commit.
 *
 * Deriving means a step ADDED to the build is covered automatically, and a step
 * that cannot be run here has to be classified out loud (see SKIP below) rather
 * than just omitted.
 */
function buildChain() {
  const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf8"));
  const expand = (name, seen = new Set()) => {
    if (seen.has(name)) return []; // a script that calls itself would never settle
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
  return expand("build");
}

/**
 * Steps deliberately not executed here, each with the reason. A step matching
 * none of these and not runnable is a FAILURE, not a silent skip — that is the
 * property that keeps this list honest as the build changes.
 */
const SKIP = [
  // Nothing in the chain today. Add entries as { match, why } and the reason
  // prints in the run summary, so an exclusion cannot become invisible.
];

const skipReason = (step) => SKIP.find((s) => step.includes(s.match))?.why || null;

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
const dirtyTracked = () =>
  git("status", "--porcelain", "--untracked-files=no")
    .split("\n")
    .filter(Boolean)
    .map((l) => l.slice(3));

console.log("build steps do not modify committed source");

const before = dirtyTracked();
if (before.length) {
  // Running the injectors would mix their output with the user's edits, and the
  // repair path below would discard those edits. Refuse rather than risk it.
  console.log(
    `   ⚠ skipped: ${before.length} tracked file(s) already modified. ` +
      `Commit or stash, then re-run to check idempotency.`,
  );
  // SKIP, not PASS: nothing about idempotency was verified on this run.
  process.exit(skipExit("the tree already has modified tracked files"));
}

let failures = 0;
const chain = buildChain();
let ran = 0;

for (const step of chain) {
  const why = skipReason(step);
  if (why) {
    console.log(`   – skipped: ${step}  (${why})`);
    continue;
  }

  try {
    // npm puts node_modules/.bin on PATH for its scripts; a bare shell does not,
    // so `vite build` would fail here as "command not found" and read like a
    // broken build rather than a missing PATH entry.
    execFileSync(step, {
      cwd: ROOT,
      stdio: "pipe",
      encoding: "utf8",
      shell: true,
      env: { ...process.env, PATH: `${resolve(ROOT, "node_modules/.bin")}:${process.env.PATH}` },
    });
    ran++;
  } catch (err) {
    failures++;
    console.error(`   ✗ ${step} exited non-zero: ${String(err.stderr || err).slice(0, 200)}`);
    continue;
  }

  let changed = dirtyTracked();
  if (changed.length) {
    // Before accusing this step, prove it. Other agents run builds in sibling
    // worktrees against the same repo, and a concurrent writer's changes land
    // in the tree while this loop is between steps — the loop would then blame
    // whichever step happened to finish next. That mis-attribution is the exact
    // failure this file exists to prevent, so a one-shot observation is not
    // enough: revert, run the step ALONE, and only fail if it reproduces.
    git("checkout", "--", ...changed);
    try {
      execFileSync(step, {
        cwd: ROOT,
        stdio: "pipe",
        encoding: "utf8",
        shell: true,
        env: { ...process.env, PATH: `${resolve(ROOT, "node_modules/.bin")}:${process.env.PATH}` },
      });
    } catch {
      // Non-zero on the retry is reported by the next dirty check or not at all;
      // the first run already succeeded, so a flake here is not this step's bug.
    }
    const confirmed = dirtyTracked();
    if (!confirmed.length) {
      console.log(
        `   – ${step}: ${changed.length} file(s) changed during the run but did NOT\n` +
          `     reproduce in isolation — a concurrent writer (another worktree or\n` +
          `     agent), not this step. Not counted as a failure.`,
      );
      continue;
    }
    changed = confirmed;
    failures++;
    const isStamper = step.includes("stamp-build");
    console.error(
      `   ✗ ${step} modified ${changed.length} committed file(s) on a clean tree:\n` +
        changed
          .slice(0, 8)
          .map((f) => `       ${f}`)
          .join("\n") +
        (isStamper
          ? `\n     A stamper writes a fresh build id, so it can never be idempotent:\n` +
            `     it must write dist/ ONLY. Cloudflare rebuilds dist/ from a clean\n` +
            `     checkout, so a stamp committed to source is dead text that dirties\n` +
            `     the tree on every local build. Drop the tracked path from its list.`
          : `\n     It is not idempotent. Every build — including Cloudflare's — will\n` +
            `     rewrite these, and this repo auto-commits, so the change lands in\n` +
            `     someone else's commit. Fix the guard/sentinel so a second run is a no-op.\n` +
            `     To clean up generator churn safely: npm run discard:generated`),
    );
    // Put the tree back so one bad step does not leave the repo dirty.
    git("checkout", "--", ...changed);
  }
}

if (!ran) {
  console.error("\n✗ build chain: ran ZERO steps — the derivation matched nothing.");
  process.exit(1);
}
console.log(`   ${ran}/${chain.length} build step(s) executed, tree clean after each`);

if (failures) {
  console.error(`\n✗ build chain: ${failures} step(s) modified committed source`);
  process.exit(1);
}
console.log(`   ✓ all ${ran} build steps left the working tree unchanged`);
