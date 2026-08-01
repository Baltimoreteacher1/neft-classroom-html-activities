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
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Steps `npm run build` invokes that write into the repo. The injectors splice
 * markup in place and must be no-ops on committed source; stamp-build writes a
 * fresh build id and must therefore not touch tracked files at all.
 */
const INJECTORS = [
  "inject-projects-visuals.mjs",
  "inject-projects-solve.mjs",
  "inject-projects-3d.mjs",
  "inject-projects-award.mjs",
  "inject-projects-twist.mjs",
  "inject-projects-complete.mjs",
  "inject-projects-check.mjs",
  "inject-projects-discourse.mjs",
  "inject-projects-answerkey-link.mjs",
  "inject-projects-partner.mjs",
  "stamp-build.mjs",
];

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
  process.exit(0);
}

let failures = 0;

for (const injector of INJECTORS) {
  try {
    execFileSync("node", [resolve(ROOT, "tools", injector)], {
      cwd: ROOT,
      stdio: "pipe",
      encoding: "utf8",
    });
  } catch (err) {
    failures++;
    console.error(`   ✗ ${injector} exited non-zero: ${String(err.stderr || err).slice(0, 200)}`);
    continue;
  }

  const changed = dirtyTracked();
  if (changed.length) {
    failures++;
    console.error(
      `   ✗ ${injector} modified ${changed.length} committed file(s) on a clean tree:\n` +
        changed
          .slice(0, 8)
          .map((f) => `       ${f}`)
          .join("\n") +
        (injector === "stamp-build.mjs"
          ? `\n     A stamper writes a fresh build id, so it can never be idempotent:\n` +
            `     it must write dist/ ONLY. Cloudflare rebuilds dist/ from a clean\n` +
            `     checkout, so a stamp committed to source is dead text that dirties\n` +
            `     the tree on every local build. Drop the tracked path from its list.`
          : `\n     It is not idempotent. Every build — including Cloudflare's — will\n` +
            `     rewrite these, and this repo auto-commits, so the change lands in\n` +
            `     someone else's commit. Fix the guard/sentinel so a second run is a no-op.`),
    );
    // Put the tree back so one bad injector does not leave the repo dirty.
    git("checkout", "--", ...changed);
  }
}

if (failures) {
  console.error(`\n✗ build injectors: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`   ✓ all ${INJECTORS.length} build steps left the working tree unchanged`);
