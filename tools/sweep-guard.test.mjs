#!/usr/bin/env node
/**
 * sweep-guard.test.mjs — every guarded gate must actually FAIL on an empty sweep.
 *
 * A guard nobody proves is a guard nobody has. This runs all 17 gates for real,
 * with their discovery forced to zero, and asserts each one exits non-zero AND
 * says why. Both halves matter: a script that dies on a missing import also
 * exits non-zero and proves nothing, which is exactly the trap a "copy it into
 * an empty temp root" control falls into — the copy loses the script's imports
 * and the control passes for the wrong reason. Forcing the count through the
 * guard keeps the real script, its real imports and its real discovery path.
 *
 * It also holds the wiring: every id in data/sweep-floors.json must be called
 * by a shipped script, and every gate in the scope list must be pinned. A floor
 * for a gate nobody calls is a number that protects nothing.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const floors = JSON.parse(readFileSync(join(ROOT, "data", "sweep-floors.json"), "utf8")).floors;
const IDS = Object.keys(floors);

const scriptFor = (id) => {
  const scripts = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")).scripts;
  const cmd = scripts[id];
  assert.ok(cmd, `${id} is pinned in data/sweep-floors.json but is not an npm script`);
  const m = cmd.match(/node\s+(\S+\.(?:mjs|js))/);
  assert.ok(m, `${id} does not run a node script directly: ${cmd}`);
  return m[1];
};

test("every pinned gate runs a script that calls the guard", () => {
  for (const id of IDS) {
    const file = join(ROOT, scriptFor(id));
    assert.ok(existsSync(file), `${id}: ${file} does not exist`);
    const src = readFileSync(file, "utf8");
    assert.match(
      src,
      /assertSweptEnough\(/,
      `${id}: ${scriptFor(id)} does not call assertSweptEnough — its floor protects nothing`,
    );
    assert.ok(
      src.includes(`"${id}"`),
      `${id}: ${scriptFor(id)} calls the guard under a different id, so its pinned floor is never read`,
    );
  }
});

/* Two negative controls dominate the cost, because proving a guard fires means
 * RUNNING its gate a second time: `audit:duplicates` hashes every tracked file
 * (13s standalone) and `audit` sweeps the whole curriculum (3s). Under the
 * parallel gate they are far worse — adding all 17 took the `test` step from
 * 82s to 177s and the whole pre-push gate from 85s to 209s.
 *
 * A pre-push gate that doubles is how `--no-verify` becomes muscle memory,
 * which disables everything rather than just this. So the fifteen cheap
 * controls run every push, and the two heavy ones run on demand:
 *
 *   QA_SWEEP_SLOW=1 npm test
 *
 * The GUARDS themselves are unaffected — every one of the 17 still runs inside
 * its own gate on every push. What is deferred is only the proof that they can
 * fail, for the two gates where that proof costs more than it returns. */
const SLOW = new Set(["audit:duplicates", "audit"]);

for (const id of IDS) {
  if (SLOW.has(id) && !process.env.QA_SWEEP_SLOW) continue;
  test(`${id} fails when its sweep discovers nothing`, () => {
    const rel = scriptFor(id);
    const args = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"))
      .scripts[id].replace(/^node\s+\S+\s*/, "")
      .split(/\s+/)
      .filter(Boolean);
    let out = "";
    let code = 0;
    try {
      out = execFileSync(process.execPath, [join(ROOT, rel), ...args], {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, SWEEP_GUARD_FORCE_EMPTY: id, CI: "" },
      });
    } catch (e) {
      code = e.status ?? 1;
      out = `${e.stdout || ""}${e.stderr || ""}`;
    }
    assert.notEqual(code, 0, `${id} reported success on an empty sweep`);
    assert.match(
      out,
      new RegExp(`FAIL\\s+${id.replace(/[:]/g, "[:]")}: swept 0`),
      `${id} exited non-zero but not because of the sweep guard — that is a different failure and proves nothing:\n${out.slice(0, 400)}`,
    );
  });
}

test("the scope list is fully pinned", () => {
  const SCOPE = [
    "validate:ccss",
    "validate:secrets",
    "validate:js-syntax",
    "validate:static",
    "validate:uifr",
    "audit",
    "audit:homework",
    "validate:scope",
    "validate:css-integrity",
    "validate:save-resume",
    "validate:determinism",
    "validate:preunit-project",
    "validate:projects-publication",
    "audit:depth",
    "audit:interaction",
    "audit:dead-code",
    "audit:duplicates",
  ];
  for (const id of SCOPE) {
    assert.ok(floors[id], `${id} is in scope but has no pinned floor`);
  }
});
