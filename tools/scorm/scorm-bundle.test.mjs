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
import { zipStore } from "../../assets/lib/zip-store.js";
import { buildScormFiles, packageFileName } from "../../functions/_lib/scorm.js";
import { readZip } from "./zip-read.mjs";

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
    assert.match(base, /^Unit-\d+_Lesson-\d+-\d+_Interactive_SCORM\.zip$/, `opaque name: ${base}`);
  }
});

console.log("SCORM bulk pack (archive of independently valid archives)");
console.log(`  checks passed: ${passed}`);
if (failures.length) {
  console.log(`\nFAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.log("  ✗ " + f);
  process.exit(1);
}
console.log("RESULT: PASS ✅");
