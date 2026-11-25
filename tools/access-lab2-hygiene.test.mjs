// ACCESS Practice Lab 2.0: the engine is plain browser-safe ESM with no timers, no randomness other than the seeded
// stream, no Node-only imports, no JSON import attributes, no purple, no developer paths in prose, and <=500 lines per file.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createRng } from "../shared/access-lab2/rng.js";
import { createRng as fixtureRng } from "../shared/fixtures/prng.js";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "shared", "access-lab2");

const RULES = [
  [/\bfrom\s+["']node:/, "Node-only import"],
  [/\brequire\s*\(/, "CommonJS require"],
  [/\bprocess\./, "process access"],
  [/with\s*\{\s*type:\s*["']json["']/, "JSON import attribute"],
  [/^await\s/m, "top-level await"],
  [/\b(setTimeout|setInterval|requestAnimationFrame)\b/, "timer (practice is untimed)"],
  [/\bMath\.random\b|\bDate\.now\b|\bperformance\.now\b/, "unseeded randomness or clock"],
  [/\b(purple|violet|indigo|lavender|magenta|fuchsia)\b/i, "purple-family word"],
  [/\b(shared|functions|tools|scripts|docs)\/[A-Za-z]/, "developer path in a published file"],
  [/https?:\/\//, "external URL"],
];

/** Problems found in one file's text. Exported to the negative control below. */
function scan(name, text) {
  const out = RULES.filter(([re]) => re.test(text)).map(([, why]) => `${name}: ${why}`);
  if (text.split("\n").length > 500) out.push(`${name}: more than 500 lines`);
  return out;
}

const files = readdirSync(DIR);

test("every file under the engine folder is plain .js, and the expected modules exist", () => {
  assert.ok(
    files.every((f) => f.endsWith(".js")),
    `unexpected files: ${files.filter((f) => !f.endsWith(".js"))}`,
  );
  for (const m of [
    "item",
    "builder",
    "diagnostic",
    "road",
    "bank-health",
    "readiness",
    "demo-items",
    "disclaimer",
    "constants",
    "profile",
    "scoring",
    "rng",
    "wording",
    "road-strings",
  ])
    assert.ok(files.includes(`${m}.js`), `${m}.js missing`);
});

test("the engine passes the hygiene rules", () => {
  const problems = files.flatMap((f) => scan(f, readFileSync(join(DIR, f), "utf8")));
  assert.deepEqual(problems, []);
});

test("negative control: the scanner flags a known-bad file", () => {
  const bad = [
    'import fs from "node:fs";',
    "const t = setTimeout(go, 1000);",
    "const n = Math.random();",
    "const x = process.env.KEY;",
    "const color = 'purple';",
    "// see shared/fixtures for the data",
    "fetch('https://example.com/a');",
    'import d from "./a.json" with { type: "json" };',
    "await load();",
    "const r = require('x');",
  ].join("\n");
  const found = scan("bad.js", bad);
  for (const why of [
    "Node-only import",
    "timer",
    "unseeded randomness",
    "process access",
    "purple-family word",
    "developer path",
    "external URL",
    "JSON import attribute",
    "top-level await",
    "CommonJS require",
  ])
    assert.ok(
      found.some((f) => f.includes(why)),
      `scanner missed: ${why}`,
    );
  assert.ok(scan("long.js", "x\n".repeat(501)).some((f) => /more than 500 lines/.test(f)));
  assert.deepEqual(scan("clean.js", "export const a = 1;\n"), []);
});

test("the local seeded stream is identical to the fixture library's, so seeds mean the same thing everywhere", () => {
  for (const seed of ["a", "seed-1", 42, "3-5|mini|Listening"]) {
    const mine = createRng(seed);
    const theirs = fixtureRng(seed);
    for (let i = 0; i < 8; i++) assert.equal(mine.next(), theirs.next(), `${seed} #${i}`);
    assert.deepEqual(
      createRng(seed).shuffle([1, 2, 3, 4, 5, 6, 7, 8]),
      fixtureRng(seed).shuffle([1, 2, 3, 4, 5, 6, 7, 8]),
    );
  }
});

test("demo and engine text has no manipulative wording", () => {
  const re = /\b(manipulatives?|cubes?|counters?|tiles?|base[- ]ten blocks?|abacus)\b/i;
  const hits = files
    .filter((f) => !["item.js", "readiness.js"].includes(f))
    .filter((f) => re.test(readFileSync(join(DIR, f), "utf8")));
  assert.deepEqual(hits, []);
});
