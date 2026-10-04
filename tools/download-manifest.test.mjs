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
import { existsSync, readFileSync } from "node:fs";
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
    "Unit-10_Math Is...",
    "trailing dot.",
    "x".repeat(200),
  ];
  for (const value of fixtures) {
    assert.equal(browser(value), safeName(value), `safeName diverged on ${JSON.stringify(value)}`);
  }
});

test("the shipped downloader assets are plain text", () => {
  // A literal control-character range inside safeName's regex put a raw NUL
  // byte in the bundle. It ran fine, which is the problem: ripgrep saw a binary
  // file, and any tool that normalises encodings could have silently mangled it.
  for (const file of ["assets/curriculum-download.js", "assets/lib/zip-store.js"]) {
    const source = readFileSync(resolve(ROOT, file), "utf8");
    const at = source.search(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/);
    assert.equal(at, -1, `${file} carries a raw control character at offset ${at}; escape it`);
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

/* ------------------------------------------------- one-click lesson work */

/* "📝 Download All Work (Word)" on /curriculum/ is a preset plus one rule the
 * preset cannot express: guided notes and homework each exist twice, as the
 * HTML page the site serves and as a real .docx beside it, and the pack takes
 * the .docx. The rule lives in the browser module and the pairs live in the
 * taxonomy, so nothing but a test holds the two together — drop "homework-docx"
 * from the preset and the button starts shipping the same assignment twice. */
const workPreset = () => PRESETS.find((p) => p.id === "lesson-work");
const workSiblings = () => {
  const source = readFileSync(resolve(ROOT, "assets/curriculum-download.js"), "utf8");
  const literal = /const WORK_DOCX_SIBLING = (\{[^}]*\});/.exec(source);
  assert.ok(literal, "assets/curriculum-download.js no longer declares WORK_DOCX_SIBLING");
  const pairs = runInContext(`(${literal[1]})`, createContext({}));
  // An empty literal would make the pairing test pass by having nothing to
  // check, which is the one result it must never report.
  assert.ok(Object.keys(pairs).length, "WORK_DOCX_SIBLING is empty");
  return pairs;
};

test("the lesson-work preset packages the sheets students write on", () => {
  const preset = workPreset();
  assert.ok(preset, "the lesson-work preset is gone — the hub button has nothing to package");
  // A PDF is not work a teacher can edit, and a SCORM package is the other
  // button. Either one in here means the pack silently changed meaning.
  for (const type of preset.types) {
    assert.ok(!/-pdf$/.test(type), `${type} is a PDF; the work pack is editable files`);
    assert.notEqual(type, "scorm", "SCORM belongs to the button next door");
  }
  assert.ok(
    preset.types.includes("practice-workbook-docx"),
    "the practice workbook is the one sheet that is born editable; it must be in the pack",
  );
});

test("every HTML sheet with a DOCX twin is paired in the work preset", () => {
  const preset = workPreset();
  for (const [html, docx] of Object.entries(workSiblings())) {
    assert.ok(TYPE_BY_ID.has(html), `WORK_DOCX_SIBLING names unknown type ${html}`);
    assert.ok(TYPE_BY_ID.has(docx), `WORK_DOCX_SIBLING names unknown type ${docx}`);
    // Both halves must be in the preset. With only the HTML half the pack ships
    // a converted copy where an editable original exists; with only the DOCX
    // half the lessons that have no .docx lose the sheet entirely.
    assert.ok(preset.types.includes(html), `lesson-work is missing ${html}`);
    assert.ok(preset.types.includes(docx), `lesson-work is missing its DOCX twin ${docx}`);
  }
});

test("the practice workbooks on disk are all in the manifest", () => {
  // Mirrors tools/validate-practice-workbooks.mjs: a workbook exists for every
  // lesson folder that has an authored worksheet.html. They are linked into the
  // units page at RUNTIME (assets/practice-workbook-links.js), so the manifest
  // generator finds them on disk or not at all.
  const manifest = JSON.parse(
    readFileSync(resolve(ROOT, "data/curriculum-download-manifest.json"), "utf8"),
  );
  const lessons = manifest.units.flatMap((u) => u.lessons);
  const packaged = new Set(lessons.flatMap((l) => l.resources.map((r) => r.url)));
  const orphans = [];
  for (const lesson of lessons) {
    for (const id of [lesson.id, `${lesson.id}-part2`, `${lesson.id}-part3`]) {
      const url = `/lessons/${id}/downloads/${id}-practice-workbook.docx`;
      if (existsSync(resolve(ROOT, url.slice(1))) && !packaged.has(url)) orphans.push(id);
    }
  }
  assert.deepEqual(
    orphans,
    [],
    `practice workbooks exist on disk but are in no download package: ${orphans.join(", ")}`,
  );
});

/* ---------------------------------------------------------- determinism */

/* The committed manifest still matches what the generator would produce.
 *
 * `--stdout`, NOT a re-run that overwrites the file. This test used to invoke
 * the generator normally and compare the file to itself afterwards, which made
 * it a ratchet that repaired the thing it measured: the first run failed and
 * left the fresh manifest on disk, so every run after it passed regardless.
 * That is how a stale manifest reaches main — someone sees one red run, runs
 * the suite again, and it is green.
 *
 * It also made `npm test` a WRITER. scripts/qa-run.mjs states that the gate is
 * "read-only apart from build" and schedules its members concurrently, so this
 * test was rewriting data/curriculum-download-manifest.json while
 * validate:downloads was reading it.
 *
 * The failure it caught for real: regenerating the print packets changed 372
 * recorded file sizes (84 notes + 84 handouts + 204 worksheets), because the
 * manifest stores `bytes` per file. That was a true staleness report, not a
 * flake. */
/* Compare against the INDEX, not the working tree. `npm run build` runs the
 * generator and is the first member of every gate (qa-run schedules it as a
 * barrier ahead of `test`), so by the time this test ran, the working-tree file
 * had already been regenerated and the comparison was fresh-vs-fresh. That let
 * a manifest go stale on main from 2026-10-02 (ee3eb4ff42 rewrote every
 * homework.html, 85 recorded sizes drifted) through four green gates. The index
 * is what a commit records and what a push sends: in pre-commit it holds the
 * staged file, in the ship worktree it equals HEAD. Outside a git checkout the
 * working tree is the only copy there is. */
function committedManifest() {
  const path = "data/curriculum-download-manifest.json";
  try {
    return execFileSync("git", ["show", `:${path}`], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return readFileSync(resolve(ROOT, path), "utf8");
  }
}

test("the committed manifest is what the generator would write", () => {
  const committed = committedManifest();
  const fresh = execFileSync(
    process.execPath,
    ["scripts/generate-download-manifest.mjs", "--stdout"],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  assert.equal(
    fresh,
    committed,
    "data/curriculum-download-manifest.json is stale in the index — run `npm run generate-download-manifest` and stage the result",
  );
});

if (failures) {
  console.error(`\nFAIL: ${failures} test${failures === 1 ? "" : "s"}`);
  process.exit(1);
}
