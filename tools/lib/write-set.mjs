/**
 * write-set.mjs — a targeted generator run must have a targeted write set.
 *
 * WHY. `--only 5-10` is a promise, and a flag whose name implies containment
 * while the code writes elsewhere is worse than no flag: it invites exactly the
 * targeted repair work it cannot safely do. This repo has already paid for that
 * twice — a scoped run republished a fleet aggregate with two entries and
 * destroyed facilitation for the other 166 lessons, and a scoped run erased the
 * Spanish overlay from the variants it touched.
 *
 * The containment check is not a review habit, it is an assertion the generator
 * makes about itself. Every write goes through `recordWrite()`, and at the end
 * the run compares what it wrote against what its scope allows. A path outside
 * that set FAILS the run rather than landing in a diff for someone to notice.
 *
 * Dependent artifacts are allowed, but only by NAME. "The facilitation module
 * must change when a lesson changes" is a real dependency and is declared as
 * one; "some file under data/ probably needed updating" is the hidden global
 * write set this exists to prevent.
 */

import { relative, resolve } from "node:path";

const written = new Set();
let root = process.cwd();

/** Point relative paths at the repo root, so messages read the same anywhere. */
export function setWriteSetRoot(dir) {
  root = dir;
}

/** Record a path this run is about to write. Call before writing, always. */
export function recordWrite(path) {
  written.add(resolve(path));
  return path;
}

/** Everything recorded so far, repo-relative and sorted. */
export function writtenPaths() {
  return [...written].map((p) => relative(root, p)).sort();
}

export function resetWriteSet() {
  written.clear();
}

/**
 * Fail unless every recorded write is allowed by the run's scope.
 *
 * @param {object} opts
 * @param {(relPath: string) => boolean} opts.allow  is this path in scope?
 * @param {string} opts.scope   human description, e.g. `--only 5-10`
 * @param {(msg: string) => void} [opts.fail]  defaults to throwing
 */
export function assertWriteSetContained({ allow, scope, fail }) {
  const strays = writtenPaths().filter((p) => !allow(p));
  if (!strays.length) return writtenPaths();
  const message =
    `${scope}: this run wrote ${strays.length} file(s) outside its scope.\n` +
    strays.map((p) => `  ${p}`).join("\n") +
    `\n\nA targeted run must write only its targets and the dependent artifacts it ` +
    `declares. If one of these is a genuine dependency, declare it by name; if it ` +
    `is not, the scope flag is not doing what its name says.`;
  if (fail) {
    fail(message);
    return writtenPaths();
  }
  throw new Error(message);
}
