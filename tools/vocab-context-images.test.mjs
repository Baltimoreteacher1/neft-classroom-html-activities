// Overloaded vocab words must not show a picture that contradicts their own
// definition.
//
// `resolveVocabImage()` maps a slug to ONE file, but "base" means the bottom
// side of a triangle (5.1/5.3), the flat bottom of a pyramid (10.5), the number
// being multiplied (6.1) and the number you take a percent OF (4.4). Four of
// those five lessons used to pop up the triangle. "Part" fell through to the
// 3/4 pie in fraction.svg, and every lesson that teaches equations showed the
// same generic x + 2 = 7.
//
// The repair is a per-lesson `image` override. This test pins it down: the
// override has to exist for the ambiguous cases, has to point at a file that is
// actually on disk, and the generated cards have to match their generator.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { hasRealVocabImage, resolveVocabImage } from "../engine/core/vocab-images.js";

const lessonsDir = new URL("../lessons/", import.meta.url);
const ids = readdirSync(lessonsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const configs = new Map();
for (const id of ids) {
  const file = new URL(`../lessons/${id}/config.json`, import.meta.url);
  if (!existsSync(file)) continue;
  configs.set(id, JSON.parse(readFileSync(file, "utf8")));
}

// ── 1. Every authored override resolves to a file that ships. ──────────────
let overrides = 0;
for (const [id, config] of configs) {
  for (const entry of config.vocabulary ?? []) {
    if (typeof entry.image !== "string") continue;
    overrides += 1;
    assert.match(
      entry.image,
      /^\/assets\/vocab-images\/[a-z0-9-]+\.svg$/,
      `${id}: ${entry.term} image override must be an /assets/vocab-images path`,
    );
    assert.ok(
      existsSync(new URL(`..${entry.image}`, import.meta.url)),
      `${id}: ${entry.term} points at a missing image (${entry.image})`,
    );
    assert.equal(resolveVocabImage(entry.term, entry.image), entry.image);
    assert.equal(hasRealVocabImage(entry.term, entry.image), true);
  }
}
assert.ok(overrides >= 43, `expected the context overrides to be wired, found ${overrides}`);

// ── 2. The ambiguous terms must be pinned, never left to slug resolution. ──
// Keyed by the picture each lesson family needs. A lesson listed here that
// resolves to the shared slug image is showing the wrong math.
const REQUIRED = {
  "percent-base": { term: "base", lessons: ["4-4", "4-4-group1", "4-4-group2", "4-7-catchup"] },
  "percent-part": { term: "part", lessons: ["4-4", "4-4-group1", "4-4-group2"] },
  "exponent-base": {
    term: "base",
    lessons: ["6-1", "6-1-group1", "6-1-group2", "6-3-catchup"],
  },
  "pyramid-base": { term: "base", lessons: ["10-5", "10-5-group1", "10-5-group2"] },
  "percent-of-a-number": {
    term: "percent of a number",
    lessons: ["4-4", "4-4-group1", "4-4-group2", "4-7-catchup"],
  },
};

for (const [slug, { term, lessons }] of Object.entries(REQUIRED)) {
  for (const id of lessons) {
    const config = configs.get(id);
    assert.ok(config, `${id}: lesson config missing`);
    const entry = (config.vocabulary ?? []).find(
      (v) => (v.term ?? "").trim().toLowerCase() === term,
    );
    assert.ok(entry, `${id}: expected a "${term}" vocab entry`);
    assert.equal(
      entry.image,
      `/assets/vocab-images/${slug}.svg`,
      `${id}: "${entry.term}" needs the ${slug} picture, not the shared ${term}.svg`,
    );
  }
}

// ── 3. "Equation" shows THIS lesson's equation, and the example agrees. ────
// Every lesson that teaches equations gets a card built from its own work, and
// the equation drawn on the card has to be the one the `visual` example states
// — otherwise the picture and the words drift apart again.
let equations = 0;
for (const [id, config] of configs) {
  const entry = (config.vocabulary ?? []).find(
    (v) => (v.term ?? "").trim().toLowerCase() === "equation",
  );
  if (!entry) continue;
  equations += 1;
  assert.ok(
    typeof entry.image === "string" && entry.image.startsWith("/assets/vocab-images/equation-"),
    `${id}: "Equation" must point at a lesson-specific equation card, got ${entry.image}`,
  );
  const svg = readFileSync(new URL(`..${entry.image}`, import.meta.url), "utf8");
  const drawn = [...svg.matchAll(/class="row"[^>]*>([^<]*)</g)]
    .map((m) => m[1])
    .join("")
    .replace(/&amp;/g, "&")
    .trim();
  assert.ok(drawn.includes("="), `${id}: ${entry.image} does not draw an equation`);
  assert.ok(
    (entry.visual ?? "").includes(drawn),
    `${id}: the card draws "${drawn}" but the example says "${entry.visual}"`,
  );
  const source = JSON.stringify(config);
  assert.ok(
    source.includes(drawn),
    `${id}: "${drawn}" never appears in the lesson — pick an equation the lesson actually uses`,
  );
}
assert.ok(equations >= 18, `expected the equation lessons to be wired, found ${equations}`);

// ── 4. No vocab word may show a generic category placeholder. ─────────────
// cat-number.svg is a literal "#" tile. 203 entries used to land on one — the
// lesson-title term that opens nearly every word wall ("Divide Decimals",
// "Write Inequalities") has no slug of its own, so it fell through the
// category fallback and the first picture in the lesson meant nothing.
// A new lesson gets the same treatment unless it wires a concept card.
const placeholders = [];
for (const [id, config] of configs) {
  for (const entry of config.vocabulary ?? []) {
    if (!entry?.term) continue;
    const src = resolveVocabImage(entry.term, entry.image);
    if (/\/cat-[a-z]+\.svg$/.test(src)) placeholders.push(`${id}: ${entry.term} → ${src}`);
  }
}
assert.deepEqual(
  placeholders,
  [],
  `${placeholders.length} vocab word(s) show a generic "#" tile. Give the term a\n` +
    "`visual` and run scripts/generate-vocab-context-images.mjs to mint its concept card.\n  " +
    `${placeholders.slice(0, 10).join("\n  ")}`,
);

// ── 5. Concept cards draw their own lesson's example, verbatim. ───────────
let conceptCards = 0;
for (const [id, config] of configs) {
  for (const entry of config.vocabulary ?? []) {
    if (typeof entry.image !== "string" || !entry.image.includes("/concept-")) continue;
    conceptCards += 1;
    const svg = readFileSync(new URL(`..${entry.image}`, import.meta.url), "utf8");
    // Group the runs by baseline: tokens on one line abut, but a wrapped line
    // break stands for the space the wrapper consumed.
    const lines = new Map();
    for (const m of svg.matchAll(/<text[^>]*\by="([\d.]+)"[^>]*class="row"[^>]*>([^<]*)</g)) {
      lines.set(m[1], (lines.get(m[1]) ?? "") + m[2]);
    }
    const drawn = [...lines.values()]
      .join(" ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
    assert.equal(
      drawn,
      (entry.visual ?? "").replace(/\s+/g, " ").trim(),
      `${id}: the concept card for "${entry.term}" no longer draws its own example`,
    );
  }
}
assert.ok(conceptCards >= 200, `expected the concept cards to be wired, found ${conceptCards}`);

// ── 6. The generated cards match their generator. ─────────────────────────
execFileSync(
  process.execPath,
  [
    fileURLToPath(new URL("../scripts/generate-vocab-context-images.mjs", import.meta.url)),
    "--check",
  ],
  { stdio: "pipe" },
);

console.log(
  `Vocab context images passed: ${overrides} overrides, ${equations} equation lessons, ` +
    `${conceptCards} concept cards, 0 placeholders.`,
);
