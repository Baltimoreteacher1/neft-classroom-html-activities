#!/usr/bin/env node
/**
 * The curriculum hub's extracted assets must be cache-correct.
 *
 * curriculum/index.html used to carry ~168 KB of inline JS and ~88 KB of inline
 * CSS. The three biggest script blocks and the base stylesheet now live in
 * /assets/curriculum-hub*.{js,css}, which makes them lintable and cacheable —
 * but it also re-creates this repo's most repeated deploy bug: editing a
 * stable-named shared asset and forgetting to bump its `?v=` stamp, so browsers
 * and the edge keep serving the old copy and the fix never reaches students.
 *
 * Here the stamp is not a date, it IS the content hash. This test recomputes it
 * and fails with the exact replacement string, so a stale stamp is caught by
 * `npm test` (and therefore by the pre-push QA loop) instead of in a classroom.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HUB_PATH = resolve(ROOT, "curriculum/index.html");

const ASSETS = [
  "curriculum-hub.css",
  "curriculum-hub-pacing.js",
  "curriculum-hub-options.js",
  "curriculum-hub-search.js",
  "curriculum-ready-next.js",
];

const hub = readFileSync(HUB_PATH, "utf8");
let failures = 0;
const fail = (m) => {
  failures++;
  console.error(`   ✗ ${m}`);
};

console.log("curriculum hub extracted assets");

for (const name of ASSETS) {
  const source = readFileSync(resolve(ROOT, "assets", name), "utf8");
  const want = createHash("sha256").update(source).digest("hex").slice(0, 8);
  const ref = new RegExp(`/assets/${name.replace(/[.]/g, "\\.")}\\?v=([a-f0-9]+)`).exec(hub);

  if (!ref) {
    fail(`curriculum/index.html does not reference /assets/${name}?v=<hash>`);
    continue;
  }
  if (ref[1] !== want) {
    fail(
      `assets/${name} changed but its cache stamp did not.\n` +
        `       in curriculum/index.html, replace  ?v=${ref[1]}  with  ?v=${want}`,
    );
  }
}

// Scripts must stay `defer`: they were inline (parse-time) blocks, and defer is
// what preserves their relative order with each other and with the
// /assets/curriculum-*.js bundle further down the page. A plain (blocking)
// script tag would run them BEFORE the page finished parsing, and each one
// reads DOM that sits above it.
for (const name of ASSETS.filter((n) => n.endsWith(".js"))) {
  const tag = new RegExp(`<script([^>]*)src="/assets/${name.replace(/[.]/g, "\\.")}\\?v=`).exec(
    hub,
  );
  if (!tag) {
    fail(`no <script> tag loading /assets/${name}`);
    continue;
  }
  if (!/\bdefer\b/.test(tag[1])) {
    fail(`/assets/${name} must be loaded with defer (found: <script${tag[1]}>)`);
  }
}

// The hub keeps shrinking as blocks move out; make sure the inline residue does
// not silently grow back. This is a ratchet, not a style rule: if you add a new
// inline block to the hub, put it in an asset instead.
const inlineJs = [...hub.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].reduce(
  (n, m) => n + m[1].length,
  0,
);
const INLINE_JS_CEILING = 30000; // ~20 KB today, down from ~168 KB
if (inlineJs > INLINE_JS_CEILING) {
  fail(
    `inline <script> in the hub grew to ${inlineJs} bytes (ceiling ${INLINE_JS_CEILING}). ` +
      `Extract it to /assets/curriculum-hub-*.js instead of inlining.`,
  );
}

if (failures) {
  console.error(`\n✗ curriculum hub assets: ${failures} failure(s)`);
  process.exit(1);
}
console.log(
  `   ✓ ${ASSETS.length} assets stamped by content hash, defer intact, ${inlineJs} B inline JS`,
);
