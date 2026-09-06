// prune-stale.test.mjs — the prune that keeps scorm-packages/ unambiguous
// deletes ONLY what it can prove is superseded, and never a live package.
//
// Why this is pinned: scorm-packages/ twice accumulated old package
// generations reusing current manifest identifiers (2026-09-01: 744 zips /
// 519 ids; 2026-09-06: 992 files / 479 duplicate ids). The prune exists to
// stop that — but a prune that over-deletes is worse than the mess it
// prevents, so every survival rule is asserted alongside every deletion.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { zipStore } from "../../assets/lib/zip-store.js";
import {
  manifestIdOf,
  pruneOutsideExpectedSet,
  pruneSupersededByIdentifier,
} from "./lib/prune-stale.mjs";

const manifest = (id) =>
  `<?xml version="1.0"?>\n<manifest identifier="${id}" version="1.0"></manifest>`;
const pkg = (dir, name, id) =>
  writeFileSync(join(dir, name), zipStore({ "imsmanifest.xml": manifest(id), "index.html": "x" }));

let failures = 0;
const check = (label, fn) => {
  try {
    fn();
    console.log(`  ok  ${label}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${label}: ${e.message}`);
  }
};
const scratch = mkdtempSync(join(tmpdir(), "prune-stale-"));
const fresh = (label) => join(scratch, label.replace(/\W+/g, "-"));

check("manifestIdOf reads a real identifier and nulls on garbage", () => {
  const d = fresh("idof");
  mkdirSync(d);
  pkg(d, "a.zip", "NEFT-1-1");
  writeFileSync(join(d, "junk.zip"), "not a zip at all");
  assert.equal(manifestIdOf(join(d, "a.zip")), "NEFT-1-1");
  assert.equal(manifestIdOf(join(d, "junk.zip")), null);
  assert.equal(manifestIdOf(join(d, "absent.zip")), null);
});

check("superseded generation (same id, old name) is removed; the written file survives", () => {
  const d = fresh("superseded");
  mkdirSync(d);
  pkg(d, "EduWonderLab_1-1_SCORM.zip", "NEFT-1-1"); // this run's output
  pkg(d, "neft-lesson-1-1.zip", "NEFT-1-1"); // the 2026-09-01 stale shape
  const removed = pruneSupersededByIdentifier(d, ["EduWonderLab_1-1_SCORM.zip"]);
  assert.deepEqual(
    removed.map((r) => r.file),
    ["neft-lesson-1-1.zip"],
  );
  assert.ok(existsSync(join(d, "EduWonderLab_1-1_SCORM.zip")), "written file was deleted");
  assert.ok(!existsSync(join(d, "neft-lesson-1-1.zip")), "stale duplicate survived");
});

check("a zip with a DIFFERENT identifier survives an id-prune", () => {
  const d = fresh("other-family");
  mkdirSync(d);
  pkg(d, "EduWonderLab_1-1_SCORM.zip", "NEFT-1-1");
  pkg(d, "Some_Activity_SCORM.zip", "NEFT-activity-ratio-city"); // another builder's package
  const removed = pruneSupersededByIdentifier(d, ["EduWonderLab_1-1_SCORM.zip"]);
  assert.equal(removed.length, 0);
  assert.ok(existsSync(join(d, "Some_Activity_SCORM.zip")), "another family's package deleted");
});

check("an unreadable zip and a manifest-less zip are never deleted by id-prune", () => {
  const d = fresh("unreadable");
  mkdirSync(d);
  pkg(d, "current.zip", "NEFT-2-2");
  writeFileSync(join(d, "corrupt.zip"), "garbage bytes");
  writeFileSync(join(d, "no-manifest.zip"), zipStore({ "index.html": "x" }));
  const removed = pruneSupersededByIdentifier(d, ["current.zip"]);
  assert.equal(removed.length, 0);
  assert.ok(existsSync(join(d, "corrupt.zip")), "deleted a zip it could not identify");
  assert.ok(existsSync(join(d, "no-manifest.zip")), "deleted a zip with no manifest");
});

check(
  "full sweep removes zips outside the expected set, keeps expected zips and checklists",
  () => {
    const d = fresh("sweep");
    mkdirSync(d);
    pkg(d, "expected.zip", "NEFT-3-3");
    pkg(d, "removed-from-catalog.zip", "NEFT-gone");
    writeFileSync(join(d, "UPLOAD-CHECKLIST.md"), "# checklist");
    const removed = pruneOutsideExpectedSet(d, ["expected.zip", "failed-this-run.zip"]);
    assert.deepEqual(removed, ["removed-from-catalog.zip"]);
    assert.ok(existsSync(join(d, "expected.zip")));
    assert.ok(existsSync(join(d, "UPLOAD-CHECKLIST.md")), "sweep ate a checklist");
  },
);

check("full sweep REFUSES an empty expected set", () => {
  const d = fresh("empty-sweep");
  mkdirSync(d);
  pkg(d, "only.zip", "NEFT-4-4");
  assert.throws(() => pruneOutsideExpectedSet(d, []), /empty expected set/);
  assert.ok(existsSync(join(d, "only.zip")), "refusal still deleted the folder");
});

rmSync(scratch, { recursive: true, force: true });
if (failures) {
  console.error(`FAIL prune-stale.test — ${failures} case(s)`);
  process.exit(1);
}
console.log("PASS prune-stale.test — 6/6");
