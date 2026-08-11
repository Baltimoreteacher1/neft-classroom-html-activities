// The static lesson pages are a SECOND copy of the vocabulary, and they go
// stale silently.
//
// `lessons/<id>/{vocab,notes,notes-teacher,learn,homework}.html` are generated
// from `config.json` by scripts/generate-notes.mjs and
// scripts/generate-homework-html.mjs. They bake the definition text, the
// picture, the read-aloud string, the matching buttons and the cloze sentences
// into HTML at generate time — so editing a lesson's `vocabulary` changes the
// interactive lesson immediately and changes these pages NEVER.
//
// That is not hypothetical: 4.4's "base" definition was corrected on
// 2026-07-29, and /lessons/4-4/vocab.html was still teaching the old wording to
// students nine days later. This test fails the moment a config and its pages
// disagree, and the fix is always the same:
//
//   node scripts/generate-notes.mjs && node scripts/generate-homework-html.mjs
//   node tools/inject-enterprise-head.js && node tools/inject-mobile-access.js
//   node tools/inject-math-workbench.js && node tools/inject-save-resume.js
//
// (then revert whatever the injectors touched outside the lessons you meant to
// regenerate — see npm run validate:injection).

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolveVocabImage } from "../engine/core/vocab-images.js";

const lessonsUrl = new URL("../lessons/", import.meta.url);

function escapeHtml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const ids = readdirSync(lessonsUrl, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

let pages = 0;
let checks = 0;
const stale = [];

for (const id of ids) {
  const configUrl = new URL(`../lessons/${id}/config.json`, import.meta.url);
  if (!existsSync(configUrl)) continue;
  const vocab = (JSON.parse(readFileSync(configUrl, "utf8")).vocabulary ?? []).filter(
    (entry) => entry?.term && entry?.definition,
  );
  if (!vocab.length) continue;

  const pageUrl = new URL(`../lessons/${id}/vocab.html`, import.meta.url);
  if (!existsSync(pageUrl)) continue;
  pages += 1;
  const html = readFileSync(pageUrl, "utf8");

  for (const entry of vocab) {
    checks += 1;
    const image = resolveVocabImage(entry.term, entry.image);
    if (!html.includes(image.replace(/^\//, ""))) {
      stale.push(`${id}: vocab.html does not use ${image} for "${entry.term}"`);
    }
    if (!html.includes(escapeHtml(entry.definition))) {
      stale.push(`${id}: vocab.html has an outdated definition for "${entry.term}"`);
    }
  }
}

assert.ok(pages >= 60, `expected the generated vocab pages to be present, found ${pages}`);
assert.deepEqual(
  stale,
  [],
  `${stale.length} generated page(s) are out of date with their config.json:\n  ${stale
    .slice(0, 20)
    .join("\n  ")}\n\nRegenerate them — see the header of this test.`,
);

console.log(`Lesson static pages fresh: ${checks} vocab entries across ${pages} pages.`);
