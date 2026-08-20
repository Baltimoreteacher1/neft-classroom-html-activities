/**
 * sweep-guard.mjs — a gate that swept far less than it should did not pass.
 *
 * THE THIRD SHAPE OF THE SAME LIE. `skip-exit.mjs` handles a check that could
 * not RUN. `non-empty.mjs` handles a check that ran and discovered NOTHING.
 * This handles the one in between, which neither catches: a check that ran,
 * discovered four files where it used to discover three thousand, found no
 * problems in those four, and reported PASS.
 *
 * `assertNonEmpty(..., floor)` already accepts a floor, but 6 of the 17 gates
 * left it at the default of 1 and the rest pinned flat constants far below
 * their real sweep — `audit:duplicates` hashes 9,774 tracked files behind a
 * floor of 100, so a collapse to 101 files passes today. A floor that sits two
 * orders of magnitude under the subject is a bare `> 0` check wearing a number.
 *
 * THE RATCHET. Floors live in data/sweep-floors.json, one per gate id, pinned
 * at ~90% of a measured baseline (reports/sweep-baseline.md) so ordinary
 * content churn does not break a build but a broken glob does. The file is the
 * same mechanism as the other ratchets here: the number is committed, so
 * lowering it is a visible act with a reason attached rather than an accident.
 *
 * This module changes only how a shrunken sweep is REPORTED. No gate's subject
 * matter, thresholds or assertions move because of it.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const FLOORS = join(ROOT, "data", "sweep-floors.json");

let cache = null;
function floors() {
  if (cache) return cache;
  cache = existsSync(FLOORS) ? JSON.parse(readFileSync(FLOORS, "utf8")).floors || {} : {};
  return cache;
}

/** The pinned floor for a gate, or null when the gate is not pinned. */
export function floorFor(id) {
  const entry = floors()[id];
  return entry && Number.isFinite(entry.floor) ? entry.floor : null;
}

const count = (subject) =>
  subject == null ? 0 : Number(subject.size ?? subject.length ?? subject) || 0;

/**
 * Assert a gate's discovered subject is at least as large as its pinned floor.
 *
 * @param {string} id       the npm script id, e.g. "audit:duplicates"
 * @param {ArrayLike<unknown>|Map<unknown,unknown>|Set<unknown>|number} subject
 * @param {string} [hint]   where the list comes from, so a shortfall is diagnosable
 * @returns {number} the discovered count, when it clears the floor
 */
export function assertSweptEnough(id, subject, hint) {
  // TEST-ONLY. The negative control for each gate needs the gate to run for
  // real and take the guard's failure path. Copying a script into an empty
  // temp root instead makes it die on a missing import, which is also a
  // non-zero exit and proves nothing about the guard.
  const forced = process.env.SWEEP_GUARD_FORCE_EMPTY;
  const n = forced && (forced === id || forced === "*") ? 0 : count(subject);

  // REPORT MODE. Pinning a floor requires knowing what the gate actually
  // guards, which is not always what its name implies — validate:ccss guards
  // the 37 distinct standards it collected, not the 288 lesson directories it
  // read. This prints the real subject size without judging it, so floors are
  // pinned to measurement rather than to assumption.
  if (process.env.SWEEP_GUARD_REPORT) {
    console.error(`SWEPT\t${id}\t${n}`);
    return n;
  }

  const floor = floorFor(id);
  if (floor == null) {
    console.error(
      `FAIL  ${id}: no sweep floor is pinned for this gate. Add one to data/sweep-floors.json — ` +
        "an unpinned gate can shrink to nothing without anyone noticing.",
    );
    process.exit(1);
  }
  if (n >= floor) return n;

  const entry = floors()[id] || {};
  console.error(
    `FAIL  ${id}: swept ${n} ${entry.subject || "items"} (floor ${floor}, baseline ${entry.baseline ?? "?"}). ` +
      "A sweep this far below its subject verified almost nothing and must not report a pass. " +
      "This is broken discovery, not a clean result.",
  );
  if (hint) console.error(`      ${hint}`);
  process.exit(1);
}
