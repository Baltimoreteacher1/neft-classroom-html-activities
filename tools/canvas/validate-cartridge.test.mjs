/**
 * validate-cartridge.test.mjs — proves the cartridge validator actually catches
 * the defects it claims to. Builds a tiny real package, asserts it passes, then
 * corrupts a staged copy and asserts each corruption is caught.
 *
 * Picked up by `npm test` (tools/run-tests.mjs).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, cpSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { validateCartridgeDir } from "./validate-cartridge.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
let passed = 0;
const ok = (l) => (console.log("  ✓ " + l), passed++);

/** Build a tiny real cartridge into canvas-packages/ and stage its contents. */
function stageRealPackage() {
  execFileSync("node", ["tools/canvas/build-library-cartridge.mjs", "--limit=5"], {
    cwd: repoRoot,
    stdio: "pipe",
  });
  // unzip the built package into a temp dir we can mutate
  const pkg = resolve(repoRoot, "canvas-packages/neft-library.imscc");
  const dir = mkdtempSync(join(tmpdir(), "cart-"));
  execFileSync("unzip", ["-q", "-o", pkg, "-d", dir]);
  return dir;
}

/* ---- 1. a freshly built package validates clean ---- */
const good = stageRealPackage();
{
  const res = validateCartridgeDir(good);
  assert.equal(res.ok, true, "real package should pass: " + JSON.stringify(res.errors));
  assert.ok(res.stats.manifestHrefs > 0 && res.stats.moduleItems > 0, "stats populated");
  ok(`clean package passes (${res.stats.htmlPages} pages, ${res.stats.manifestHrefs} hrefs)`);
}

/* ---- 2. a missing referenced file is caught ---- */
{
  const dir = mkdtempSync(join(tmpdir(), "cart-"));
  cpSync(good, dir, { recursive: true });
  // delete one wiki page that the manifest references
  const page = readdirSync(join(dir, "wiki_content"))[0];
  rmSync(join(dir, "wiki_content", page));
  const res = validateCartridgeDir(dir);
  assert.equal(res.ok, false, "missing file should fail");
  assert.ok(res.errors.some((e) => e.includes("no file on disk")), "reports the missing href");
  ok("missing referenced file → FAIL");
}

/* ---- 3. an unfilled template token is caught ---- */
{
  const dir = mkdtempSync(join(tmpdir(), "cart-"));
  cpSync(good, dir, { recursive: true });
  writeFileSync(join(dir, "course_settings/module_meta.xml"),
    '<?xml version="1.0"?>\n<modules><module>{{LESSON_ID}}</module></modules>\n');
  const res = validateCartridgeDir(dir);
  assert.equal(res.ok, false, "template token should fail");
  assert.ok(res.errors.some((e) => e.includes("template token")), "reports the token");
  ok("unfilled {{TOKEN}} → FAIL");
}

/* ---- 4. unescaped ampersand in XML is caught ---- */
{
  const dir = mkdtempSync(join(tmpdir(), "cart-"));
  cpSync(good, dir, { recursive: true });
  writeFileSync(join(dir, "course_settings/canvas_export.txt.xml"),
    '<?xml version="1.0"?>\n<x>Tom & Jerry</x>\n');
  const res = validateCartridgeDir(dir);
  assert.equal(res.ok, false, "unescaped & should fail");
  assert.ok(res.errors.some((e) => e.includes("unescaped")), "reports the bad ampersand");
  ok("unescaped '&' in XML → FAIL");
}

console.log(`\n✅ validate-cartridge: ${passed}/4 checks passed`);
