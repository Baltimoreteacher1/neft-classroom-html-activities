#!/usr/bin/env node
/**
 * scorm-bundle.test.mjs — the bulk "Canvas / SCORM Pack" download must be an
 * archive OF archives, not a merge.
 *
 * Canvas imports SCORM one package per assignment, so the inner .zips have to
 * survive the outer one intact: one imsmanifest.xml each, independently
 * importable. The failure this pins is quiet and expensive — a teacher unzips a
 * unit pack, uploads what looks like a full set, and finds out a lesson is
 * missing when a student cannot open it.
 *
 * Two collapse modes are checked:
 *   1. manifests merged / packages flattened into the outer zip;
 *   2. two activities slugging to the same package name, where assigning over
 *      an existing key silently drops one and the archive still looks complete.
 */
import assert from "node:assert/strict";
import { deflateRawSync } from "node:zlib";
import { zipStore } from "../../assets/lib/zip-store.js";
import { buildScormFiles, packageFileName } from "../../functions/_lib/scorm.js";
import { readZip } from "./zip-read.mjs";

function crc32Of(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

const IDS = ["3-1", "3-2", "3-3", "3-4"];
const BUNDLE = "Unit-3";
let passed = 0;
const failures = [];
const check = (name, fn) => {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}: ${e.message}`);
  }
};

/** Mirror of the endpoint's assembly, minus the network existence probe. */
function buildBundle(ids) {
  const entries = {};
  for (const id of ids) {
    const pkg = buildScormFiles({ target: id, title: `Lesson ${id}` });
    const path = `${BUNDLE}/${packageFileName(pkg.id, pkg.codes)}`;
    if (path in entries) throw new Error(`package name collision: ${path}`);
    entries[path] = zipStore(pkg.files);
  }
  entries[`${BUNDLE}/README.txt`] = "one package per assignment\n";
  return zipStore(entries);
}

check("the outer zip holds one nested package per lesson, plus a README", () => {
  const outer = readZip(buildBundle(IDS));
  const zips = outer.filter((e) => e.name.endsWith(".zip"));
  assert.equal(zips.length, IDS.length, `expected ${IDS.length} packages, got ${zips.length}`);
  assert.ok(
    outer.some((e) => e.name.endsWith("README.txt")),
    "no README travelled with the archive",
  );
  assert.ok(
    outer.every((e) => e.name.startsWith(`${BUNDLE}/`)),
    "packages are loose, not in one clearly-named folder",
  );
});

check("manifests are NOT merged into the outer archive", () => {
  const outer = readZip(buildBundle(IDS));
  assert.equal(
    outer.filter((e) => e.name.endsWith("imsmanifest.xml")).length,
    0,
    "an imsmanifest.xml leaked into the outer zip — the packages were flattened",
  );
});

check("every inner package opens and validates on its own", () => {
  const outer = readZip(buildBundle(IDS));
  const ids = new Set();
  for (const e of outer.filter((x) => x.name.endsWith(".zip"))) {
    const inner = readZip(e.data);
    const names = inner.map((x) => x.name);
    assert.ok(names.includes("imsmanifest.xml"), `${e.name}: no manifest`);
    assert.ok(names.includes("index.html"), `${e.name}: no launch file`);
    const xml = inner.find((x) => x.name === "imsmanifest.xml").text();
    assert.match(xml, /<schemaversion>1\.2<\/schemaversion>/, `${e.name}: not SCORM 1.2`);
    const id = /<manifest\s+identifier="([^"]+)"/.exec(xml)[1];
    assert.ok(!ids.has(id), `${e.name}: identifier ${id} repeats inside one bundle`);
    ids.add(id);
  }
});

check("a package-name collision fails the bundle instead of dropping a lesson", () => {
  assert.throws(
    () => buildBundle(["3-1", "3-1"]),
    /collision/,
    "a repeated package silently overwrote its twin — the pack ships short",
  );
});

check("bundle names are teacher-readable and filesystem-safe", () => {
  for (const e of readZip(buildBundle(IDS)).filter((x) => x.name.endsWith(".zip"))) {
    const base = e.name.split("/").pop();
    // Runtime v2 naming: EduWonderLab_<id>_<Short_Title>_SCORM.zip. The point
    // of the check is unchanged — a teacher must be able to tell the files
    // apart in a Downloads folder without opening them — so the title fragment
    // is REQUIRED, not optional, and the name must stay cross-platform safe.
    assert.match(
      base,
      /^EduWonderLab_\d+-\d+_[A-Za-z0-9]+[A-Za-z0-9_]*_SCORM\.zip$/,
      `opaque name: ${base}`,
    );
    assert.doesNotMatch(base, /[\\/:*?"<>|\s]/, `not filesystem-safe: ${base}`);
  }
});

console.log("SCORM bulk pack (archive of independently valid archives)");

// --- deflate ---------------------------------------------------------------
// readZip used to slice the UNCOMPRESSED size out of the archive and CRC that.
// Stored entries hide the bug (both sizes are equal) and this repo's builder
// stores, so the reader passed every test while being unable to read a deflated
// package at all — it reported "data runs past end of file", which reads as
// corruption. 309 healthy neft-lesson-*.zip archives failed that way while
// `unzip -t` called them intact. A validator that calls a good package corrupt
// blocks a release for nothing; one that cannot open a format cannot judge it.
check("readZip reads a DEFLATE entry, not just a stored one", () => {
  const body = Buffer.from(`<html><body>${"resume ".repeat(400)}</body></html>`, "utf8");
  const comp = deflateRawSync(body);
  assert.ok(comp.length < body.length, "fixture must actually compress");
  const name = Buffer.from("index.html", "utf8");
  const crc = crc32Of(body);

  const local = Buffer.alloc(30 + name.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(8, 8); // method: deflate
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(comp.length, 18);
  local.writeUInt32LE(body.length, 22);
  local.writeUInt16LE(name.length, 26);
  name.copy(local, 30);

  const central = Buffer.alloc(46 + name.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(comp.length, 20);
  central.writeUInt32LE(body.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(0, 42);
  name.copy(central, 46);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length, 12);
  eocd.writeUInt32LE(local.length + comp.length, 16);

  const zip = Buffer.concat([local, comp, central, eocd]);
  const entries = readZip(zip);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].name, "index.html");
  assert.equal(entries[0].text(), body.toString("utf8"));
});


console.log(`  checks passed: ${passed}`);
if (failures.length) {
  console.log(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.log("  ✗ " + f);
  process.exit(1);
}
console.log("RESULT: PASS ✅");
