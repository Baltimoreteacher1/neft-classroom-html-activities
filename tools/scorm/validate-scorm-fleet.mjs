#!/usr/bin/env node
/**
 * validate-scorm-fleet.mjs — build EVERY SCORM-capable package and prove each
 * one is a structurally valid, safe, importable SCORM 1.2 archive.
 *
 * `validate:scorm` (validate-sco.mjs) pins the SCO's runtime hardening by
 * reading the source. That check cannot see anything about the ARCHIVE — it
 * never opens one. This gate does the other half: it generates the fleet, reads
 * the bytes back out through a real ZIP parser, and checks the package-level
 * invariants that only show up once an LMS tries to import the file.
 *
 * Per package:
 *   - the ZIP opens: local headers, central directory and EOCD agree
 *   - every entry's CRC-32 matches its data (a truncated write is caught here,
 *     not by a teacher whose Canvas import fails with "invalid package")
 *   - imsmanifest.xml is well-formed XML with the SCORM 1.2 schema declaration
 *   - the launch resource (`href`) exists as an entry in the archive
 *   - every <file href> in the manifest exists as an entry
 *   - identifiers are well-formed XML NMTOKENs and unique ACROSS the fleet
 *   - no entry path can escape extraction (`../`, absolute, encoded traversal)
 *   - no teacher-only material is packaged
 *   - the download name is filesystem-safe and unique across the fleet
 *   - building the same input twice yields byte-identical output
 *
 * Every detector self-tests against a known-bad fixture BEFORE the sweep. A
 * gate that has quietly stopped firing reports a perfectly clean fleet, which
 * is worse than no gate.
 *
 * Run:  npm run validate:scorm:fleet
 * Exit: 0 = every package valid, 1 = one or more failures (each printed).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { zipStore } from "../../assets/lib/zip-store.js";
import { buildScormFiles, packageFileName } from "../../functions/_lib/scorm.js";
import { readZip } from "./zip-read.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const LIMIT = argv.includes("--limit") ? Number(argv[argv.indexOf("--limit") + 1]) : Infinity;

// ---------------------------------------------------------------------------
// Detectors. Each takes a built package and returns an array of problem strings.
// ---------------------------------------------------------------------------

const UNSAFE_PATH = /(^\/)|(^[A-Za-z]:)|(\\)|(^|\/)\.\.(\/|$)|(%2e%2e)|(%2f)|(%5c)/i;

/** Minimal well-formedness pass: balanced tags, no stray markup characters. */
function parseXml(xml) {
  if (!/^<\?xml\s+version="1\.0"\s+encoding="UTF-8"\?>/.test(xml.trimStart()))
    throw new Error("missing or non-UTF-8 XML declaration");
  const stack = [];
  const tag = /<\/?([A-Za-z_][\w.:-]*)((?:[^>"']|"[^"]*"|'[^']*')*?)(\/?)>/g;
  let m;
  const body = xml.replace(/<\?[\s\S]*?\?>/g, "").replace(/<!--[\s\S]*?-->/g, "");
  while ((m = tag.exec(body))) {
    const closing = m[0].startsWith("</");
    const selfClosing = m[3] === "/";
    if (closing) {
      if (stack.pop() !== m[1]) throw new Error(`mismatched closing tag </${m[1]}>`);
    } else if (!selfClosing) {
      stack.push(m[1]);
    }
  }
  if (stack.length) throw new Error(`unclosed tag <${stack[stack.length - 1]}>`);
  // Any '<' that the tag scanner did not consume is unescaped markup.
  const stray = body.replace(tag, "").indexOf("<");
  if (stray !== -1) throw new Error("unescaped '<' in character data");
  return body;
}

const NMTOKEN = /^[A-Za-z_][\w.-]*$/;

/**
 * Strings that must never reach a student package. Checked against every entry
 * of every archive — a teacher-only asset in a student SCORM upload is not a
 * style problem, it is an answer key in a 12-year-old's hands.
 */
const TEACHER_LEAKS = [
  ["teacher PIN", /TeacherNeft/],
  ["teacher key", /TEACHER_KEY|neft\.teacher\.key/],
  ["teacher-only route", /\/teacher-tools\/|teacher-notes|answer-key|answerKey/i],
  ["teacher mode flag", /nt-teacher-mode/],
  ["api secret", /(api[_-]?secret|bearer\s+[A-Za-z0-9._-]{16,})/i],
  ["test scaffolding", /mock-lms/],
];

function checkPackage(pkg, name, bytes, seenIds, seenNames) {
  const problems = [];
  const P = (msg) => problems.push(`${name}: ${msg}`);

  // --- ZIP integrity ---
  let entries;
  try {
    entries = readZip(bytes);
  } catch (e) {
    P(`zip does not open — ${e.message}`);
    return problems;
  }
  if (!entries.length) {
    P("zip is empty");
    return problems;
  }

  const byName = new Map();
  for (const e of entries) {
    if (UNSAFE_PATH.test(e.name)) P(`unsafe entry path "${e.name}"`);
    if (byName.has(e.name)) P(`duplicate entry "${e.name}"`);
    byName.set(e.name, e);
  }

  // --- manifest ---
  const mf = byName.get("imsmanifest.xml");
  if (!mf) {
    P("no imsmanifest.xml at the archive root — no LMS can import this");
    return problems;
  }
  const xml = mf.text();
  try {
    parseXml(xml);
  } catch (e) {
    P(`imsmanifest.xml is not well-formed XML — ${e.message}`);
    return problems;
  }
  if (!/<schemaversion>\s*1\.2\s*<\/schemaversion>/.test(xml))
    P("manifest does not declare SCORM 1.2");
  if (!/xmlns="http:\/\/www\.imsproject\.org\/xsd\/imscp_rootv1p1p2"/.test(xml))
    P("manifest is missing the IMS content-packaging namespace");
  if (!/xmlns:adlcp="http:\/\/www\.adlnet\.org\/xsd\/adlcp_rootv1p2"/.test(xml))
    P("manifest is missing the ADL SCORM 1.2 namespace");

  // identifiers
  const ids = [...xml.matchAll(/\bidentifier="([^"]*)"/g)].map((m) => m[1]);
  for (const id of ids) if (!NMTOKEN.test(id)) P(`identifier "${id}" is not a valid XML NMTOKEN`);
  const local = new Set();
  for (const id of ids) {
    if (local.has(id)) P(`duplicate identifier "${id}" within the manifest`);
    local.add(id);
  }
  const manifestId = /<manifest\s+identifier="([^"]+)"/.exec(xml)?.[1];
  if (!manifestId) P("manifest has no identifier");
  else if (seenIds.has(manifestId))
    P(`manifest identifier "${manifestId}" collides with ${seenIds.get(manifestId)}`);
  else seenIds.set(manifestId, name);

  // organization ↔ item ↔ resource wiring
  const orgDefault = /<organizations\s+default="([^"]+)"/.exec(xml)?.[1];
  if (!orgDefault) P("<organizations> has no default organization");
  else if (!new RegExp(`<organization\\s+identifier="${orgDefault}"`).test(xml))
    P(`default organization "${orgDefault}" does not exist`);
  const ref = /identifierref="([^"]+)"/.exec(xml)?.[1];
  if (!ref) P("no <item> references a resource — nothing would launch");
  else if (!new RegExp(`<resource\\s+identifier="${ref}"`).test(xml))
    P(`item references resource "${ref}", which is not declared`);

  // --- launch + referenced files exist in the archive ---
  const href = /<resource\b[^>]*\bhref="([^"]+)"/.exec(xml)?.[1];
  if (!href) P("launch resource has no href");
  else if (!byName.has(href)) P(`launch file "${href}" is not in the archive`);
  for (const m of xml.matchAll(/<file\s+href="([^"]+)"\s*\/?>/g)) {
    if (!byName.has(m[1])) P(`manifest references "${m[1]}", which is not in the archive`);
    if (UNSAFE_PATH.test(m[1])) P(`manifest file href "${m[1]}" is an unsafe path`);
  }
  if (!/adlcp:scormtype="sco"/.test(xml))
    P("launch resource is not declared as a SCO — the LMS will not run its API calls");

  // --- content safety ---
  for (const e of entries) {
    const text = e.text();
    for (const [label, re] of TEACHER_LEAKS)
      if (re.test(text)) P(`packaged ${label} in "${e.name}"`);
  }

  // --- encoding ---
  for (const e of entries) {
    if (e.text().includes("�")) P(`"${e.name}" contains replacement characters (not UTF-8)`);
  }

  // --- download name ---
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*\.zip$/.test(name))
    P("download name is not filesystem-safe on every platform");
  if (seenNames.has(name)) P(`download name collides with ${seenNames.get(name)}`);
  else seenNames.set(name, pkg.id);

  return problems;
}

// ---------------------------------------------------------------------------
// Self-test: every detector must actually fire on a known-bad package.
// ---------------------------------------------------------------------------
function selfTest() {
  const fails = [];
  const expect = (label, files, name, pattern) => {
    const problems = checkPackage({ id: "probe" }, name, zipStore(files), new Map(), new Map());
    if (!problems.some((p) => pattern.test(p)))
      fails.push(`detector "${label}" did not fire (got: ${problems.join(" | ") || "nothing"})`);
  };

  const good = buildScormFiles({ target: "1-3", title: "Probe" }).files;

  expect("missing manifest", { "index.html": "<html></html>" }, "a.zip", /no imsmanifest/);
  expect(
    "malformed xml",
    { ...good, "imsmanifest.xml": '<?xml version="1.0" encoding="UTF-8"?><a><b></a>' },
    "a.zip",
    /not well-formed/,
  );
  expect(
    "missing launch file",
    { "imsmanifest.xml": good["imsmanifest.xml"] },
    "a.zip",
    /launch file .* is not in the archive/,
  );
  expect(
    "manifest references a missing file",
    {
      ...good,
      "imsmanifest.xml": good["imsmanifest.xml"].replace(
        '<file href="index.html"/>',
        '<file href="index.html"/><file href="ghost.js"/>',
      ),
    },
    "a.zip",
    /references "ghost\.js"/,
  );
  expect(
    "teacher leak",
    { ...good, "notes.html": "<p>PIN TeacherNeft</p>" },
    "a.zip",
    /teacher PIN/,
  );
  expect("bad download name", good, "..\\evil.zip", /filesystem-safe/);
  expect(
    "not declared a SCO",
    { ...good, "imsmanifest.xml": good["imsmanifest.xml"].replace('adlcp:scormtype="sco"', "") },
    "a.zip",
    /not declared as a SCO/,
  );
  expect(
    "dangling resource reference",
    {
      ...good,
      "imsmanifest.xml": good["imsmanifest.xml"].replace(
        /identifierref="[^"]+"/,
        'identifierref="NOPE"',
      ),
    },
    "a.zip",
    /is not declared/,
  );

  // CRC corruption must be caught by the reader, not slip through.
  const bytes = zipStore(good);
  const corrupt = Uint8Array.from(bytes);
  corrupt[corrupt.length - 400] ^= 0xff;
  try {
    readZip(corrupt);
    fails.push('detector "crc" did not fire on a corrupted archive');
  } catch (e) {
    if (!/CRC|signature|past end/.test(e.message))
      fails.push(`detector "crc" threw the wrong error: ${e.message}`);
  }

  // Path safety must be refused at write time.
  for (const bad of ["../escape.html", "/abs.html", "a/../../b.html", "%2e%2e/x.html"]) {
    let threw = false;
    try {
      zipStore({ [bad]: "x" });
    } catch {
      threw = true;
    }
    if (!threw) fails.push(`zipStore accepted the unsafe path "${bad}"`);
  }

  return fails;
}

// ---------------------------------------------------------------------------
// The fleet. Same inventory validate-coverage.mjs uses — there is one list of
// SCORM-capable surfaces and this file does not get to invent a second one.
// ---------------------------------------------------------------------------
function fleet() {
  const catalog = JSON.parse(readFileSync(join(ROOT, "tools/scorm/activity-catalog.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(join(ROOT, "data/curriculum-manifest.json"), "utf8"));
  const lessons = (
    Array.isArray(manifest.lessons) ? manifest.lessons : Object.values(manifest.lessons)
  ).filter((l) => l?.id);

  const targets = [];
  for (const l of lessons) {
    targets.push({ target: l.id, title: l.title || `Lesson ${l.id}`, kind: "lesson" });
    const hw = join(ROOT, "lessons", String(l.id), "homework.html");
    if (existsSync(hw))
      targets.push({
        target: `/lessons/${l.id}/homework.html`,
        title: `${l.title || l.id} — Homework`,
        kind: "homework",
      });
  }
  const items = Array.isArray(catalog) ? catalog : catalog.activities || [];
  for (const a of items) {
    if (!a?.path) continue;
    // The catalog stores the launch query separately, and it is load-bearing:
    // ten Practice Arcade entries share one path and differ only by ?unit=N.
    // Dropping it collapses them onto a single identifier.
    targets.push({
      target: `${a.path}${a.query || ""}`,
      title: a.title || a.id || a.path,
      kind: "activity",
    });
  }
  return targets;
}

// ---------------------------------------------------------------------------
console.log("SCORM fleet validation (SCORM 1.2)\n");

const selfFails = selfTest();
if (selfFails.length) {
  console.log("FAIL — the gate's own detectors are broken:");
  for (const f of selfFails) console.log("  ✗ " + f);
  console.log("\nA detector that does not fire reports a clean fleet. Fix the gate first.");
  process.exit(1);
}
console.log(`  self-test: all detectors fire ✅`);

const targets = fleet().slice(0, LIMIT);
const seenIds = new Map();
const seenNames = new Map();
const problems = [];
const sizes = [];
let built = 0;

for (const t of targets) {
  let pkg;
  try {
    pkg = buildScormFiles({ target: t.target, title: t.title });
  } catch (e) {
    problems.push(`${t.target}: package build threw — ${e.message}`);
    continue;
  }
  const name = packageFileName(pkg.id, pkg.codes);
  let bytes;
  try {
    bytes = zipStore(pkg.files);
  } catch (e) {
    problems.push(`${name}: zip write refused — ${e.message}`);
    continue;
  }
  built++;
  sizes.push({ name, bytes: bytes.length });
  problems.push(...checkPackage(pkg, name, bytes, seenIds, seenNames));

  // Determinism: identical input must produce identical bytes, or a diff
  // between two "same" packages is unreadable and regressions hide in noise.
  const again = zipStore(buildScormFiles({ target: t.target, title: t.title }).files);
  if (again.length !== bytes.length || !again.every((b, i) => b === bytes[i]))
    problems.push(`${name}: package is not deterministic (two builds differ)`);
}

sizes.sort((a, b) => b.bytes - a.bytes);
const median = sizes.length ? sizes[Math.floor(sizes.length / 2)].bytes : 0;

console.log(`  packages built        : ${built} / ${targets.length}`);
console.log(`  unique manifest ids   : ${seenIds.size}`);
console.log(`  unique download names : ${seenNames.size}`);
if (sizes.length) {
  console.log(`  zip size median/max   : ${median} B / ${sizes[0].bytes} B (${sizes[0].name})`);
}

if (problems.length) {
  console.log(`\nFAIL — ${problems.length} problem(s):`);
  for (const p of problems.slice(0, 60)) console.log("  ✗ " + p);
  if (problems.length > 60) console.log(`  … and ${problems.length - 60} more`);
  process.exit(1);
}
console.log("\nRESULT: PASS ✅ (every package opens, validates and is safe to import)");
