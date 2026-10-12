// The pre-test QTI quiz pack must build WITHOUT a system `zip` binary.
//
// Cloudflare's build image has no `zip`. build-pretest-qti.mjs shelled out to it,
// so on every deploy the build log said `zip: not found`, the Canvas SCORM page
// was generated with "0 quiz pack", and the 10 native Canvas pre-test quizzes
// never shipped — non-fatally, so nothing went red. Locally `zip` exists, which
// is why every local gate passed. This runs the real builder with an EMPTY PATH,
// so a reintroduced `zip`/`unzip` call fails here instead of in production.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readZip } from "./scorm/zip-read.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = mkdtempSync(join(tmpdir(), "pretest-qti-"));

function build(outDir) {
  // Bare environment: no PATH, so no zip, no unzip, no git — and nothing inherited.
  const run = spawnSync(
    process.execPath,
    [join(ROOT, "tools/canvas/build-pretest-qti.mjs"), outDir],
    {
      cwd: ROOT,
      encoding: "utf8",
      env: { PATH: "" },
    },
  );
  assert.equal(run.status, 0, `builder failed without a system zip:\n${run.stdout}\n${run.stderr}`);
  return readFileSync(join(outDir, "neft-pretest-quizzes.zip"));
}

try {
  const first = build(join(dir, "a"));
  const entries = readZip(new Uint8Array(first));
  const names = entries.map((e) => e.name);

  assert.ok(names.includes("imsmanifest.xml"), "the package needs its IMS manifest");
  assert.ok(names.includes("course_settings/canvas_export.txt"));
  assert.ok(names.includes("course_settings/assignment_groups.xml"));
  const quizzes = names.filter((n) => /^quiz_pretest_unit\d+\/quiz_pretest_unit\d+\.xml$/.test(n));
  assert.equal(quizzes.length, 10, "one native quiz per unit");
  for (let unit = 1; unit <= 10; unit++) {
    assert.ok(names.includes(`quiz_pretest_unit${unit}/assessment_meta.xml`), `unit ${unit} meta`);
  }
  assert.ok(
    names.every((n) => !n.startsWith(".")),
    "dotfiles stay out, as with `zip -x '.*'`",
  );
  assert.ok(
    names.every((n) => !n.endsWith("/")),
    "no bare directory entries",
  );
  assert.ok(
    entries.every((e) => e.size > 0 || e.name.endsWith(".txt")),
    "no empty XML entries",
  );

  // Byte-stable: the same sources must yield the same package (the old one embedded timestamps).
  const second = build(join(dir, "b"));
  assert.equal(
    createHash("sha256").update(second).digest("hex"),
    createHash("sha256").update(first).digest("hex"),
    "two builds of the same sources must be byte-identical",
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(
  "pretest QTI: builds with no system zip — 10 quizzes + manifest, valid and byte-stable",
);
