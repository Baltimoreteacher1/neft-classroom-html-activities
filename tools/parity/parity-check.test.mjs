// Unit tests for the byte-parity harness (engine extraction, phase 1).
// Plain node script per repo test convention: top-level assertions, exit code.

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildManifest, diffManifests, normalizeContent } from "./parity-check.mjs";

const a = mkdtempSync(join(tmpdir(), "parity-a-"));
mkdirSync(join(a, "sub"));
writeFileSync(join(a, "x.html"), "<html>same</html>");
writeFileSync(join(a, "sub", "y.js"), "const n = 1;\n");

const b = mkdtempSync(join(tmpdir(), "parity-b-"));
mkdirSync(join(b, "sub"));
writeFileSync(join(b, "x.html"), "<html>same</html>");
writeFileSync(join(b, "sub", "y.js"), "const n = 2;\n");

const ma = buildManifest(a);
const mb = buildManifest(b);
assert.equal(Object.keys(ma).length, 2, "manifest lists every file");
assert.deepEqual(diffManifests(ma, ma), [], "identical trees diff empty");
const diff = diffManifests(ma, mb);
assert.equal(diff.length, 1, "one changed file detected");
assert.equal(diff[0].path, "sub/y.js");
assert.equal(diff[0].kind, "changed");

// Normalization: the access-lab build stamp must not count as a diff.
const stampA = JSON.stringify({ builtAt: "2026-09-05T01:00:00Z", commit: "abc", files: 3 });
const stampB = JSON.stringify({ builtAt: "2026-09-06T02:00:00Z", commit: "def", files: 3 });
assert.equal(
  normalizeContent("access-practice-lab/config.json", stampA),
  normalizeContent("access-practice-lab/config.json", stampB),
  "build stamp fields are normalized away",
);

// HTML build stamps are normalized away too.
assert.equal(
  normalizeContent("curriculum/index.html", '<body data-build-stamp="2026-09-05T01:00Z">'),
  normalizeContent("curriculum/index.html", '<body data-build-stamp="2026-09-06T02:00Z">'),
  "html data-build-stamp normalized",
);

// Service-worker per-build cache epoch normalized (any nested sw.js).
assert.equal(
  normalizeContent("lessons/sw.js", 'const CACHE = "nt-cache-1788604263222";'),
  normalizeContent("lessons/sw.js", 'const CACHE = "nt-cache-1788699999999";'),
  "nt-cache epoch normalized",
);

// Asset cache-buster query stamps normalized in HTML.
assert.equal(
  normalizeContent("curriculum/index.html", '<link href="/assets/a.css?v=mto8sq74" />'),
  normalizeContent("curriculum/index.html", '<link href="/assets/a.css?v=mto8twyg" />'),
  "?v= cache-buster normalized",
);
assert.notEqual(
  normalizeContent("curriculum/index.html", '<link href="/assets/a.css?v=x1" />'),
  normalizeContent("curriculum/index.html", '<link href="/assets/b.css?v=x1" />'),
  "real URL differences still detected",
);

// Missing/extra files are reported, not ignored.
writeFileSync(join(b, "extra.txt"), "hi");
const diff2 = diffManifests(ma, buildManifest(b));
assert.ok(
  diff2.some((d) => d.path === "extra.txt" && d.kind === "added"),
  "added file reported",
);
assert.ok(
  diffManifests(buildManifest(b), ma).some((d) => d.path === "extra.txt" && d.kind === "removed"),
  "removed file reported",
);

// Ignored local-only artifacts never enter the manifest.
mkdirSync(join(b, "canvas-packages"));
writeFileSync(join(b, "canvas-packages", "neft-library.imscc"), "test residue");
assert.ok(
  !("canvas-packages/neft-library.imscc" in buildManifest(b)),
  "neft-library test residue excluded from the manifest",
);

console.log("parity-check tests passed");
