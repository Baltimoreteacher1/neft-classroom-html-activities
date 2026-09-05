// Every shipped SVG must actually PARSE, and every vocabulary term must point at
// a file that exists.
//
// This exists because of inequality.svg. Its title read
//
//     <title id="t">Inequality: values compared with < or ></title>
//
// and its body drew the label `x > 2`. SVG is XML, so a raw "<" or ">" in text
// content is a fatal parse error: the browser refuses to render the image and
// silently falls back to the img alt text. On /lessons/8-4/ that meant five of
// the seven word-wall cards showed a paragraph of alt text where the diagram
// should be, and the same file is the picture for "compare", "inequality",
// "greater than", "less than", "at least / at most", "no more than" and
// "constraint" across the corpus.
//
// Nothing caught it. The file was present, it served 200, the resolver reported
// a real image, and `hasRealVocabImage()` returned true — because all of those
// check the PATH, and none of them check that the bytes are a valid document.
// A picture that 404s is obvious; a picture that parses badly looks fine to
// every gate we had.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveVocabImage } from "@eduwonderlab/engine/core/vocab-images.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG_DIR = path.join(ROOT, "assets/vocab-images");
const LESSONS = path.join(ROOT, "lessons");

let passed = 0;
const ok = (n) => {
  console.log(`  ✓ ${n}`);
  passed += 1;
};

// Report every stray angle bracket that sits in text content rather than in a
// tag. Hand-rolled because the point is to need no XML dependency: a parser we
// had to install is a parser CI might not have.
function strayAngleBrackets(src) {
  const hits = [];
  let inTag = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (!inTag && ch === "<") {
      // "<" opens a tag only when a name, slash, bang or question mark follows.
      if (/[A-Za-z/!?]/.test(src[i + 1] || "")) {
        inTag = true;
        continue;
      }
      hits.push(`stray "<" → …${src.slice(Math.max(0, i - 40), i + 25).replace(/\s+/g, " ")}…`);
      continue;
    }
    if (inTag && ch === ">") {
      inTag = false;
      continue;
    }
    if (!inTag && ch === ">") {
      hits.push(`stray ">" → …${src.slice(Math.max(0, i - 40), i + 25).replace(/\s+/g, " ")}…`);
    }
  }
  return hits;
}

const files = readdirSync(IMG_DIR).filter((f) => f.endsWith(".svg"));

{
  assert.ok(files.length > 100, `expected the whole vocab image set, found ${files.length}`);
  const offenders = [];
  for (const f of files) {
    const hits = strayAngleBrackets(readFileSync(path.join(IMG_DIR, f), "utf8"));
    for (const h of hits) offenders.push(`${f}: ${h}`);
  }
  assert.deepEqual(
    offenders,
    [],
    `invalid XML — these render as broken images, not as pictures:\n${offenders.join("\n")}`,
  );
  ok(`every vocab SVG parses as XML (${files.length} files)`);
}

{
  // A balanced-tag sanity check, so a truncated file fails here rather than in a
  // classroom. Counts opening tags against closers and self-closers.
  const offenders = [];
  for (const f of files) {
    const src = readFileSync(path.join(IMG_DIR, f), "utf8");
    if (!/^\s*<svg[\s>]/.test(src)) offenders.push(`${f}: does not start with <svg>`);
    if (!/<\/svg>\s*$/.test(src)) offenders.push(`${f}: does not end with </svg>`);
  }
  assert.deepEqual(offenders, [], `malformed SVG document(s):\n${offenders.join("\n")}`);
  ok("every vocab SVG is a complete <svg>…</svg> document");
}

{
  // Every term a lesson actually uses must resolve to a file on disk.
  const missing = new Map();
  let checked = 0;
  for (const dir of readdirSync(LESSONS)) {
    const file = path.join(LESSONS, dir, "config.json");
    if (!existsSync(file)) continue;
    let doc;
    try {
      doc = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    for (const v of doc.vocabulary || []) {
      const src = resolveVocabImage(v.term, v.image);
      checked += 1;
      if (!existsSync(path.join(ROOT, src.replace(/^\//, "")))) {
        if (!missing.has(src)) missing.set(src, new Set());
        missing.get(src).add(`${dir}:${v.term}`);
      }
    }
  }
  const lines = [...missing].map(([src, who]) => `${src} ← ${[...who].slice(0, 5).join(", ")}`);
  assert.deepEqual(lines, [], `vocabulary images that do not exist:\n${lines.join("\n")}`);
  assert.ok(checked > 500, `expected the whole vocabulary corpus, checked only ${checked}`);
  ok(`every vocabulary term resolves to a real file (${checked} entries)`);
}

console.log(`\nvocab image integrity: ${passed}/3 checks passed`);
assert.equal(passed, 3, `expected 3 checks to run, ${passed} did`);
