// Every Spanish field a lesson authors must have something that can DRAW it.
//
// This gate exists because the curriculum shipped 4,355 `*Es` strings across
// the 64 core lessons and, for most of them, no renderer. `explanationEs`
// (1,308 uses), `hintsEs` (860), `choicesEs` (162), `instructionsEs` (170) and
// `promptEs` (54) had zero reachable consumers: authored, committed, served to
// browsers inside config.json, and never once shown to a student. `choicesEs`
// was referenced nowhere in the repository at all.
//
// Nothing caught it, and nothing could have. Every per-file check passed —
// the configs were valid, the components parsed, the pages rendered, the links
// resolved. The defect only exists in the JOIN between what content authors
// write and what the engines read, which is precisely what this file checks.
//
// It also made the gap look smaller than it was: vocabulary IS fully bilingual
// (11-13 modules consume `termEs`/`definitionEs`), so a reviewer spot-checking
// the site in Spanish sees Spanish and moves on. The practice lane was the part
// nobody clicked into.
//
// Method: walk the import graph from BOTH renderer entry points, then require
// each authored key to be named somewhere inside it. Naming a key is a weak
// signal — a module could mention it and still not draw it — so this is a
// floor, not a proof. It catches the class that actually happened: a field with
// no reader anywhere.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();
const ENTRIES = ["engine/core/lesson-renderer.js", "engine/core/small-group-renderer.js"];

function moduleGraph(entries) {
  const seen = new Set();
  const stack = [...entries];
  while (stack.length) {
    const file = stack.pop();
    if (seen.has(file) || !fs.existsSync(file)) continue;
    seen.add(file);
    const src = fs.readFileSync(file, "utf8");
    const re = /(?:from|import)\s+["']([^"']+)["']/g;
    let m;
    while ((m = re.exec(src))) {
      const spec = m[1];
      if (!spec.startsWith(".")) continue;
      stack.push(path.normalize(path.join(path.dirname(file), spec)));
    }
  }
  return [...seen];
}

function authoredEsKeys() {
  const dir = path.join(ROOT, "lessons");
  if (!fs.existsSync(dir)) return new Map();
  const counts = new Map();
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      if (/[a-z]Es$/.test(key)) counts.set(key, (counts.get(key) || 0) + 1);
      walk(value);
    }
  };
  for (const slug of fs.readdirSync(dir)) {
    const config = path.join(dir, slug, "config.json");
    if (!fs.existsSync(config)) continue;
    walk(JSON.parse(fs.readFileSync(config, "utf8")));
  }
  return counts;
}

test("the scanner actually finds authored Spanish — a silent zero would pass everything", () => {
  const keys = authoredEsKeys();
  assert.ok(keys.size >= 5, `expected the bilingual corpus, found ${keys.size} distinct *Es keys`);
  const total = [...keys.values()].reduce((a, b) => a + b, 0);
  assert.ok(total > 1000, `expected thousands of authored Spanish strings, found ${total}`);
});

test("the module graph reaches the real engines", () => {
  const graph = moduleGraph(ENTRIES);
  assert.ok(graph.length > 50, `graph looks truncated: ${graph.length} modules`);
  assert.ok(
    graph.some((f) => f.includes("multiple-choice")),
    "expected the practice components to be reachable",
  );
});

test("the orphan detector fires — negative control", () => {
  // A gate that cannot fail reports a clean corpus forever. This runs the same
  // matcher against a key nothing could possibly consume, and requires a hit.
  const graph = moduleGraph(ENTRIES);
  const sources = graph.map((f) => fs.readFileSync(f, "utf8"));
  const fake = "definitelyNotARealFieldEs";
  const re = new RegExp(`\\b${fake}\\b`);
  assert.equal(
    sources.some((src) => re.test(src)),
    false,
    "the detector matched a field that does not exist — it is not discriminating",
  );
});

test("every authored *Es field has a consumer in one of the renderers", () => {
  const keys = authoredEsKeys();
  const graph = moduleGraph(ENTRIES);
  const sources = graph.map((f) => fs.readFileSync(f, "utf8"));

  const orphans = [];
  for (const [key, count] of keys) {
    const re = new RegExp(`\\b${key}\\b`);
    if (!sources.some((src) => re.test(src))) orphans.push(`${key} (${count} uses)`);
  }

  assert.deepEqual(
    orphans.sort(),
    [],
    `authored Spanish that no renderer can display — either wire it or stop authoring it:\n  ${orphans.join("\n  ")}`,
  );
});
