#!/usr/bin/env node
/**
 * Unit tests for the bulk downloader's shared pieces.
 *
 * The gate (tools/validate-download-manifest.mjs) checks the generated
 * inventory. These check the two things underneath it that no inventory can
 * reveal: that the zip writer emits a structurally valid archive, and that the
 * browser's copy of safeName() still agrees with the generator's — they name the
 * two halves of the same path, and a silent divergence would produce a package
 * whose folder name does not match the entries inside it.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { zipStore } from "../assets/lib/zip-store.js";
import { PRESETS, safeName, TYPE_BY_ID } from "../scripts/lib/download-taxonomy.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const test = (name, fn) => {
  try {
    fn();
    console.log(`   ✓ ${name}`);
  } catch (error) {
    failures++;
    console.error(`   ✗ ${name}\n     ${error.message}`);
  }
};

console.log("bulk downloader");

/* ------------------------------------------------------------ zip writer */

const u32 = (bytes, at) => new DataView(bytes.buffer, bytes.byteOffset).getUint32(at, true);
const u16 = (bytes, at) => new DataView(bytes.buffer, bytes.byteOffset).getUint16(at, true);

test("zipStore emits a valid empty archive", () => {
  const zip = zipStore({});
  assert.equal(zip.length, 22, "an empty archive is just the end-of-central-directory record");
  assert.equal(u32(zip, 0), 0x06054b50);
});

test("zipStore writes one local header and one central entry per file", () => {
  const zip = zipStore({ "a/b.txt": "hello", "c.bin": new Uint8Array([1, 2, 3]) });
  assert.equal(u32(zip, 0), 0x04034b50, "starts with a local file header");
  const eocd = zip.length - 22;
  assert.equal(u32(zip, eocd), 0x06054b50);
  assert.equal(u16(zip, eocd + 10), 2, "two entries in the central directory");
});

test("zipStore preserves nested archives byte for byte", () => {
  // This is what makes a unit SCORM pack work: each entry is itself a .zip and
  // must survive unchanged, so Canvas can import it directly.
  const inner = zipStore({ "imsmanifest.xml": "<manifest/>" });
  const outer = zipStore({ "pack/inner.zip": inner });
  const at = outer.indexOf(inner[0]);
  const start = 30 + "pack/inner.zip".length;
  assert.deepEqual([...outer.slice(start, start + inner.length)], [...inner]);
  assert.ok(at >= 0);
});

test("zipStore stores, never deflates", () => {
  const zip = zipStore({ "x.txt": "y".repeat(500) });
  assert.equal(u16(zip, 8), 0, "compression method 0 = stored");
  assert.equal(u32(zip, 18), 500, "compressed size equals uncompressed size");
  assert.equal(u32(zip, 22), 500);
});

/* ------------------------------------------------------- safeName parity */

test("the browser's safeName matches the generator's", () => {
  const source = readFileSync(resolve(ROOT, "assets/curriculum-download.js"), "utf8");
  const start = source.indexOf("function safeName(");
  assert.ok(start > 0, "assets/curriculum-download.js still defines safeName()");
  // Take the function through its closing brace at column 0.
  const end = source.indexOf("\n}\n", start) + 3;
  const context = createContext({});
  runInContext(`${source.slice(start, end)}; globalThis.__safeName = safeName;`, context);
  const browser = context.__safeName;

  const fixtures = [
    "Unit 3 — Ratios & Rates",
    "3-1 Notes.pdf",
    'a<b>c:"d/e\\f|g?h*i',
    "  ...  ",
    "🏗️ Architect Challenge: GreenLine Transit",
    "SCORM · Pre-Test",
    "EduWonderLab_Unit-10_Math Is...",
    "trailing dot.",
    "x".repeat(200),
  ];
  for (const value of fixtures) {
    assert.equal(browser(value), safeName(value), `safeName diverged on ${JSON.stringify(value)}`);
  }
});

/* ------------------------------------------------------------- taxonomy */

test("every preset names only known resource types", () => {
  for (const preset of PRESETS) {
    for (const type of preset.types) {
      assert.ok(TYPE_BY_ID.has(type), `preset ${preset.id} names unknown type ${type}`);
    }
  }
});

test("the Complete Unit preset covers every type except SCORM", () => {
  const complete = PRESETS.find((p) => p.id === "complete");
  const missing = [...TYPE_BY_ID.keys()].filter(
    (id) => id !== "scorm" && !complete.types.includes(id),
  );
  assert.deepEqual(missing, [], "Complete Unit must not quietly omit a resource type");
  assert.ok(!complete.types.includes("scorm"), "SCORM is its own pack, not part of Complete Unit");
});

test("the SCORM preset selects nothing but SCORM", () => {
  assert.deepEqual(PRESETS.find((p) => p.id === "scorm").types, ["scorm"]);
});

/* ---------------------------------------------------------- determinism */

test("the generator is deterministic", () => {
  const before = readFileSync(resolve(ROOT, "data/curriculum-download-manifest.json"), "utf8");
  execFileSync(process.execPath, ["scripts/generate-download-manifest.mjs"], {
    cwd: ROOT,
    stdio: "pipe",
  });
  const after = readFileSync(resolve(ROOT, "data/curriculum-download-manifest.json"), "utf8");
  assert.equal(after, before, "re-running the generator changed the committed manifest");
});

if (failures) {
  console.error(`\nFAIL: ${failures} test${failures === 1 ? "" : "s"}`);
  process.exit(1);
}
