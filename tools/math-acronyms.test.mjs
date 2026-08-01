// Guards the acronym contract: every math acronym a student meets in the
// curriculum must be able to reach a definition, and nothing in the engine may
// print one in a form the matcher cannot see.
//
// WHY THIS EXISTS. Inline vocabulary pop-ups match acronyms CASE-SENSITIVELY on
// purpose, so "mad" in a sentence is never underlined. That is the right rule,
// and it is also silent: `topic.title.toLowerCase()` in the Math Check lab
// rendered "use the mad check" on every Group 2 statistics lesson — wrong copy
// AND an acronym with no definition behind it — and nothing failed. A grep
// found it only because a fleet audit went looking. This test does the looking.

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

const glossary = read("engine/core/math-glossary.js");
const mathCheck = read("engine/core/small-group-math-check.js");
const annotation = read("engine/core/small-group-annotation.js");

/* ── 1 · Every acronym used in lesson content is a registered acronym ────── */

const registered = new Set();
for (const m of glossary.matchAll(/acronym:\s*"([A-Z]+)"/g)) registered.add(m[1]);
for (const m of glossary.matchAll(/\bes:\s*"([A-Z]{2,})"/g)) registered.add(m[1]);
for (const m of glossary.matchAll(/\bes:\s*\[([^\]]+)\]/g)) {
  for (const q of m[1].matchAll(/"([A-Z]{2,})"/g)) registered.add(q[1]);
}
assert.ok(registered.size >= 12, `MATH_ACRONYMS looks empty (found ${registered.size})`);

// Discovery, not enumeration. Trying to list every non-maths capitalised token
// in the corpus by hand is a losing game — the authoring voice SHOUTS words for
// emphasis ("choose the LOWER value"), Spanish prose capitalises for the same
// reason, and stories carry brand and place names. So the not-maths set is a
// checked-in BASELINE of what is already there, and this test fails only on a
// token that is NEW. That is the case worth interrupting someone for: a fresh
// acronym has just entered the curriculum and nothing defines it yet.
//
// This is how KCF was caught. "Then I use KCF: ___ × ___ = ___" shipped in Unit
// 2 with no glossary entry and no pop-up, because the mnemonic was written as
// though already taught.
//
// Regenerate after deliberately adding non-maths caps:
//   node tools/math-acronyms.test.mjs --update
const baselinePath = new URL("math-acronyms.baseline.json", import.meta.url);
const baseline = new Set(JSON.parse(readFileSync(baselinePath, "utf8")).tokens);

const lessonsDir = new URL("lessons/", root);
const found = new Map();
for (const dir of readdirSync(lessonsDir)) {
  const cfg = new URL(`lessons/${dir}/config.json`, root);
  if (!existsSync(cfg)) continue;
  const raw = readFileSync(cfg, "utf8");
  for (const value of raw.match(/"(?:[^"\\]|\\.)*"/g) || []) {
    // Accented letters are word characters to a reader but not to \b, so a bare
    // \b[A-Z]{2,5}\b matches "VAR" inside the Spanish "VARÍAN". Guard on letter
    // classes that include accents instead.
    for (const m of value.matchAll(/(?<![A-Za-zÀ-ÿ])[A-Z]{2,5}(?![A-Za-zÀ-ÿ])/g)) {
      const token = m[0];
      if (registered.has(token)) continue;
      found.set(token, (found.get(token) || 0) + 1);
    }
  }
}

if (process.argv.includes("--update")) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(
    baselinePath,
    `${JSON.stringify(
      {
        note: "Uppercase tokens present in lesson content that are NOT maths acronyms — emphasis words, Spanish caps, standards codes, story/brand names, geometry point labels. Regenerate with: node tools/math-acronyms.test.mjs --update",
        tokens: [...found.keys()].sort(),
      },
      null,
      2,
    )}\n`,
  );
  console.log(`baseline updated: ${found.size} tokens`);
  process.exit(0);
}

const novel = [...found.entries()].filter(([t]) => !baseline.has(t));
assert.deepEqual(
  novel.map(([t]) => t),
  [],
  `New uppercase tokens in lesson content that no acronym defines:\n  ${novel
    .map(([t, n]) => `${t} (${n}×)`)
    .join(
      "\n  ",
    )}\nIf one is a maths acronym, add it to MATH_ACRONYMS in engine/core/math-glossary.js (its full term must also be a glossary entry, or the acronym is never wired). If none are, run: node tools/math-acronyms.test.mjs --update`,
);

/* ── 2 · Every registered acronym expands to a term the glossary defines ─── */

// Split at the MATH_ACRONYMS declaration first. The acronym rows carry a
// `term:` field of their own, so searching the whole file for the expansion
// finds the acronym row itself and the check can never fail — it passed a
// deliberately-broken "surface areaX" during self-test before this split.
const [glossaryEntries, acronymBlock] = glossary.split("export const MATH_ACRONYMS");
assert.ok(acronymBlock, "MATH_ACRONYMS declaration not found");

const definedTerms = new Set(
  [...glossaryEntries.matchAll(/term:\s*"([^"]+)"/g)].map((m) => m[1].toLowerCase()),
);
assert.ok(definedTerms.size > 40, `glossary term list looks wrong (${definedTerms.size})`);

for (const m of acronymBlock.matchAll(/acronym:\s*"([A-Z]+)",\s*term:\s*"([^"]+)"/g)) {
  const [, acronym, term] = m;
  assert.ok(
    definedTerms.has(term.toLowerCase()),
    `${acronym} expands to "${term}", which no glossary entry defines — acronymEntries() skips any acronym whose full term is undefined, so ${acronym} would silently never be wired`,
  );
}

/* ── 3 · The engine never lower-cases an acronym into student copy ───────── */

assert.ok(
  !/topic\.title\.toLowerCase\(\)/.test(mathCheck),
  "small-group-math-check.js lower-cases a check title into student prose. Acronym titles (MAD, GCF, LCM, IQR, SA) become words students were never taught and lose their pop-up. Use spokenTitle().",
);

const spoken = (title) =>
  String(title || "")
    .split(/(\s+)/)
    .map((word) => (/^[A-Z]{2,}$/.test(word) ? word : word.toLowerCase()))
    .join("");

assert.equal(spoken("MAD"), "MAD");
assert.equal(spoken("GCF"), "GCF");
assert.equal(spoken("Prime Factor"), "prime factor");
assert.equal(spoken("Net Surface Area"), "net surface area");
assert.equal(spoken("MAD Spread"), "MAD spread", "mixed titles keep only the acronym");

// Every MATH_CHECKS title, run through spokenTitle, must not have flattened a
// registered acronym.
for (const m of mathCheck.matchAll(/check\(\s*\n\s*"([^"]+)"/g)) {
  const title = m[1];
  for (const word of title.split(/\s+/)) {
    if (!registered.has(word)) continue;
    assert.ok(
      spoken(title).includes(word),
      `MATH_CHECKS title "${title}" would print the acronym ${word} in lower case`,
    );
  }
}

/* ── 4 · Headings stay out of the pop-up pass ────────────────────────────── */

// A trigger is a <button aria-label="MAD: open definition">. Inside an <h2> it
// joins that heading's accessible name, so a screen-reader user navigating by
// heading hears "MAD: open definition Check Lab". Headings are the primary way
// assistive tech moves through a long single-scroll studio.
const exclusions = annotation.match(/const VOCAB_EXCLUSIONS\s*=\s*\n?\s*"([^"]+)"/);
assert.ok(exclusions, "VOCAB_EXCLUSIONS not found in small-group-annotation.js");
for (const tag of ["h1", "h2", "h3"]) {
  assert.ok(
    exclusions[1]
      .split(",")
      .map((s) => s.trim())
      .includes(tag),
    `${tag} must stay in VOCAB_EXCLUSIONS — a pop-up trigger there renames the heading in the accessibility tree`,
  );
}

console.log(
  `math acronyms: ${registered.size} registered, all expansions defined, no lower-cased acronyms in engine copy, headings excluded.`,
);
