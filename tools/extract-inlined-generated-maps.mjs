#!/usr/bin/env node

/* =============================================================================
 * extract-inlined-generated-maps — stage 1 of un-monolithing the curriculum hub.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * curriculum/index.html is 14,359 lines, and 3,900+ of them are a MACHINE-
 * GENERATED lookup table pasted inline between BEGIN_/END_ markers. A second
 * generated table adds ~370 more. Both generators already write standalone
 * files — curriculum/lesson-bonus-activities.js and lesson-family-homework.js —
 * which set the same objects on `window` and which nothing in the hub loads.
 *
 * So the data has two sources of truth: a file the generator owns, and a copy
 * pasted into a document too large to review in a diff. That is precisely the
 * shape that produced this repo's injector-corruption incidents, and it is why
 * routine content edits are risky here.
 *
 * This replaces each inlined block with a reference to the generated file. It
 * is a BEHAVIOUR-PRESERVING refactor, and it is only safe because it is checked
 * three ways:
 *   1. this script refuses to run unless the inlined data and the generated
 *      file parse to deeply-equal objects (verified byte-equivalent today);
 *   2. tests/curriculum-visual.spec.ts must still match its baselines;
 *   3. scripts/perf-curriculum.mjs must stay within budget.
 * Capture 2 and 3 BEFORE running this.
 *
 *   node tools/extract-inlined-generated-maps.mjs           # check only
 *   node tools/extract-inlined-generated-maps.mjs --write   # apply
 * ========================================================================== */

import assert from "node:assert";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const HUB = resolve(ROOT, "curriculum/index.html");
const WRITE = process.argv.includes("--write");

const MAPS = [
  {
    variable: "LESSON_BONUS_ACTIVITIES",
    begin: "BEGIN_LESSON_BONUS_MAP",
    end: "END_LESSON_BONUS_MAP",
    file: "curriculum/lesson-bonus-activities.js",
    src: "/curriculum/lesson-bonus-activities.js",
    regenerate: "npm run generate-lesson-bonus-map",
  },
  {
    variable: "LESSON_FAMILY_HOMEWORK",
    begin: "BEGIN_LESSON_FAMILY_HOMEWORK_MAP",
    end: "END_LESSON_FAMILY_HOMEWORK_MAP",
    file: "curriculum/lesson-family-homework.js",
    src: "/curriculum/lesson-family-homework.js",
    regenerate: "npm run generate-lesson-family-homework-map",
  },
];

/**
 * Parse a JS object literal without eval. These are generator output — plain
 * data, trailing commas, unquoted keys — so a narrow normalisation into JSON is
 * safe and, unlike eval, cannot execute anything if the file is ever tampered
 * with.
 */
function parseObjectLiteral(source) {
  const noTrailingCommas = source.replace(/,(\s*[}\]])/g, "$1");
  const quotedKeys = noTrailingCommas.replace(/([{,]\s*)([A-Za-z_$][\w$-]*)\s*:/g, '$1"$2":');
  return JSON.parse(quotedKeys);
}

function inlinedBlock(html, map) {
  const re = new RegExp(
    `([ \\t]*)// ${map.begin}[^\\n]*\\n\\s*var\\s+${map.variable}\\s*=\\s*(\\{[\\s\\S]*?\\});\\s*\\n\\s*// ${map.end}`,
  );
  const match = html.match(re);
  if (!match) return null;
  return { whole: match[0], indent: match[1], literal: match[2] };
}

function generatedObject(map) {
  const text = readFileSync(resolve(ROOT, map.file), "utf8");
  const match = text.match(new RegExp(`window\\.${map.variable}\\s*=\\s*(\\{[\\s\\S]*\\});\\s*$`));
  if (!match) throw new Error(`${map.file}: no window.${map.variable} assignment found`);
  return parseObjectLiteral(match[1]);
}

let html = readFileSync(HUB, "utf8");
const before = html;
const results = [];

for (const map of MAPS) {
  const block = inlinedBlock(html, map);
  if (!block) {
    results.push(`  –  ${map.variable}: no inlined block found (already extracted?)`);
    continue;
  }

  // GATE: refuse to touch the page unless the two copies are identical. If they
  // have drifted, the inline copy is what production has been serving, and
  // silently swapping in the generated file would change behaviour.
  const inline = parseObjectLiteral(block.literal);
  const generated = generatedObject(map);
  try {
    assert.deepStrictEqual(inline, generated);
  } catch {
    const inlineKeys = Object.keys(inline);
    const genKeys = Object.keys(generated);
    console.error(
      `\n✗ ${map.variable}: the inlined copy and ${map.file} have DRIFTED.\n` +
        `    inline: ${inlineKeys.length} keys, generated: ${genKeys.length} keys.\n` +
        `    The page is serving the inline copy. Re-run \`${map.regenerate}\`\n` +
        `    and diff before extracting — do not assume the generator is right.`,
    );
    process.exit(1);
  }

  // The variable was a closure-local `var`; the generated file assigns to
  // `window`. Bind it back into the closure under the same name so the two
  // consumption sites need no edit at all — the smaller the blast radius, the
  // more convincing the visual-baseline check that follows.
  const replacement =
    `${block.indent}// ${map.variable} is generated — see ${map.file}\n` +
    `${block.indent}// (loaded via <script src="${map.src}">; regenerate with \`${map.regenerate}\`)\n` +
    `${block.indent}var ${map.variable} = window.${map.variable} || {};`;

  html = html.replace(block.whole, replacement);
  results.push(
    `  ✓  ${map.variable}: ${block.whole.split("\n").length} inlined lines -> ${map.src}`,
  );
}

// The generated files must load BEFORE the closure that reads them. They are
// tiny, static and cacheable, so a plain blocking tag in <head> is correct here:
// `defer` would run them after the inline script that consumes the values.
const HEAD_MARK = "<!-- generated lesson maps (tools/extract-inlined-generated-maps.mjs) -->";
if (!html.includes(HEAD_MARK)) {
  const tags =
    `  ${HEAD_MARK}\n` + MAPS.map((m) => `  <script src="${m.src}"></script>`).join("\n") + "\n";
  const headClose = html.indexOf("</head>");
  if (headClose === -1) {
    console.error("✗ no </head> in curriculum/index.html — refusing to guess an insertion point.");
    process.exit(1);
  }
  html = html.slice(0, headClose) + tags + html.slice(headClose);
  results.push(`  ✓  added <script src> tags for ${MAPS.length} generated maps to <head>`);
}

const linesBefore = before.split("\n").length;
const linesAfter = html.split("\n").length;

console.log(`extract-inlined-generated-maps${WRITE ? "" : " (dry run)"}`);
for (const r of results) console.log(r);
console.log(
  `\n  curriculum/index.html: ${linesBefore} -> ${linesAfter} lines ` +
    `(${linesBefore - linesAfter} removed, ${Math.round(((linesBefore - linesAfter) / linesBefore) * 100)}%)`,
);

if (!WRITE) {
  console.log("\n  Re-run with --write to apply, then verify:");
  console.log("    npm run e2e:visual        # baselines must still match");
  console.log("    npm run perf:curriculum -- --live");
  process.exit(0);
}

writeFileSync(HUB, html);
console.log("\n  written. Now verify against the baselines — this refactor is only");
console.log("  trustworthy if the rendered page is unchanged.");
