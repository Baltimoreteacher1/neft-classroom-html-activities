/**
 * cartridge-files.test.mjs — proves the in-browser Canvas export path produces a
 * real, import-valid Common Cartridge. It runs the EXACT browser pipeline in
 * Node: group library.json items → buildCartridgeFiles → zipStore → write
 * .imscc → unzip → validateCartridgeDir. If this passes, the one-click download
 * a teacher gets from the Studio page is structurally identical to (and as valid
 * as) the package the audited `npm run library-cartridge` tool ships.
 *
 * Plain assertion script; run by `npm run test` (tools/run-tests.mjs).
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCartridgeFiles, buildModulesFromItems, zipStore } from "./cartridge-files.mjs";
import { validateCartridgeFile } from "../../tools/canvas/validate-cartridge.mjs";

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const lib = JSON.parse(readFileSync(here("./library.json"), "utf8"));
assert.ok(Array.isArray(lib.items) && lib.items.length > 0, "library.json has items");
assert.ok(Array.isArray(lib.modules) && lib.modules.length > 0, "library.json has modules");

// Take a representative selection that spans more than one module.
const sample = lib.items.slice(0, 24);
const modules = buildModulesFromItems(sample, lib.modules);

// Grouping preserves every item and produces ordered, non-empty modules.
const grouped = modules.reduce((n, m) => n + m.items.length, 0);
assert.equal(grouped, sample.length, "every sampled item lands in a module");
assert.ok(modules.length >= 1, "at least one module");
for (const m of modules) assert.ok(m.items.length > 0, `module ${m.key} non-empty`);

const tmp = mkdtempSync(join(tmpdir(), "canvas-studio-test-"));
let failed = 0;

for (const mode of ["link", "graded"]) {
  const { files, itemCount } = buildCartridgeFiles({ modules, mode, site: lib.site });
  assert.equal(itemCount, sample.length, `${mode}: itemCount matches selection`);
  assert.ok(
    files.some((f) => f.path === "imsmanifest.xml"),
    `${mode}: manifest present`,
  );

  const bytes = zipStore(files);
  // Real ZIP local-file-header magic so we know zipStore emitted an archive.
  assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04], `${mode}: ZIP signature`);

  const out = join(tmp, `browser-${mode}.imscc`);
  writeFileSync(out, bytes);

  const res = validateCartridgeFile(out);
  if (!res.ok) {
    failed++;
    console.error(`✗ ${mode}: in-browser cartridge FAILED validation`);
    for (const e of res.errors) console.error(`    ${e}`);
  } else {
    console.log(
      `✓ ${mode}: in-browser cartridge valid (${res.stats.files} files, ` +
        `${res.stats.manifestHrefs} hrefs, ${res.stats.moduleItems} module items)`,
    );
  }
}

rmSync(tmp, { recursive: true, force: true });
assert.equal(failed, 0, "in-browser cartridges must validate");
console.log("✓ cartridge-files: browser build → zip → unzip → validate passed");
