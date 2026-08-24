import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { linkifyDeck, linkifyVocab, VOCAB_TERMS } from "./vocab-linkify.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let failures = 0;
function t(name, fn) {
  try {
    fn();
  } catch (e) {
    failures++;
    console.error(`FAIL ${name}: ${e.message}`);
  }
}

// ---------------------------------------------------------------------------
// The whole point: only link terms the modal has a REAL definition for.
// `openVocabModal` has a fallback branch that invents a generic definition, so
// a missing key fails silently in the classroom instead of loudly here.
// ---------------------------------------------------------------------------
t("every linkable term exists in VOCAB_DB", () => {
  const src = fs.readFileSync(path.join(root, "assets/formula-popup.js"), "utf8");
  const start = src.indexOf("const VOCAB_DB");
  assert.ok(start > -1, "VOCAB_DB not found in assets/formula-popup.js");
  const body = src.slice(start, src.indexOf("\n  };", start));
  const keys = new Set(
    [...body.matchAll(/^ {4}["']?([a-z][a-z0-9 '-]*)["']?\s*:\s*\{/gim)].map((m) =>
      m[1].toLowerCase(),
    ),
  );
  assert.ok(keys.size > 20, `only parsed ${keys.size} VOCAB_DB keys — parser drifted`);
  const missing = VOCAB_TERMS.filter((term) => !keys.has(term));
  assert.deepEqual(missing, [], `terms with no VOCAB_DB entry: ${missing.join(", ")}`);
});

// ---------------------------------------------------------------------------
// The corruption class the deleted `fix_vocab_attributes.py` was written to clean
// up: the old regex pass rewrote text INSIDE attributes.
// ---------------------------------------------------------------------------
t("never rewrites inside an attribute value", () => {
  const input = `<img src="area-height.png" alt="the area of a rectangle" title="base">`;
  assert.equal(linkifyVocab(input), input);
});

t("never rewrites inside svg geometry attributes", () => {
  const input = `<svg width="400" height="300"><text>area</text></svg>`;
  assert.equal(linkifyVocab(input), input);
});

t("never rewrites inside script or style", () => {
  const input = `<script>var area = 5; // height\n</script><style>.area{height:2px}</style>`;
  assert.equal(linkifyVocab(input), input);
});

t("never rewrites inside button, option, label, textarea", () => {
  for (const tag of ["button", "option", "label", "textarea"]) {
    const input = `<${tag}>Find the area</${tag}>`;
    assert.equal(linkifyVocab(input), input, tag);
  }
});

t("never double-wraps an already-linked term", () => {
  const once = linkifyVocab("<p>The area matters.</p>");
  assert.equal((once.match(/vocab-word/g) || []).length, 1);
  assert.equal(linkifyVocab(once), once);
  assert.equal(
    linkifyDeck(linkifyDeck("<p>The area matters.</p>")),
    linkifyDeck("<p>The area matters.</p>"),
  );
});

t("never wraps a term inside another term's link text", () => {
  const out = linkifyVocab("<p>Use the unit rate today.</p>");
  assert.equal((out.match(/vocab-word/g) || []).length, 1);
  assert.match(out, /data-vocab="unit rate"/);
});

t("matches whole words only", () => {
  const input = "<p>areas basement heights subtracted</p>";
  assert.equal(linkifyVocab(input), input);
});

t("emits the exact historical markup", () => {
  assert.equal(
    linkifyVocab("<p>factor</p>"),
    '<p><span class="vocab-word" data-vocab="factor" style="border-bottom:2px dotted #0284C7; ' +
      'color:#0284C7; font-weight:800; cursor:pointer;" onclick="openVocabModal(\'factor\')">factor</span></p>',
  );
});

t("preserves the author's capitalisation in the visible text", () => {
  const out = linkifyVocab("<p>Area rules.</p>");
  assert.match(out, />Area<\/span>/);
  assert.match(out, /data-vocab="area"/);
});

t("links a term once per deck, then at most one link per slide", () => {
  const slide = (n, text) => `<div class="slide-body" id="slide-${n}"><p>${text}</p></div>`;
  const out = linkifyDeck(
    slide(1, "The area of the area of the area.") +
      slide(2, "The area again and the height too.") +
      slide(3, "The area again."),
  );
  const blocks = out.split('<div class="slide-body').slice(1);
  assert.equal((blocks[0].match(/vocab-word/g) || []).length, 1);
  assert.equal((blocks[1].match(/vocab-word/g) || []).length, 1);
  assert.equal((blocks[2].match(/vocab-word/g) || []).length, 1);
  assert.match(blocks[1], /data-vocab="height"/); // pass 1 already spent "area"
});

t("leaves markup structurally intact", () => {
  const input = '<div class="slide-body"><p>The area <em>and</em> height.</p></div>';
  const out = linkifyDeck(input);
  const strip = (s) => s.replace(/<span class="vocab-word"[^>]*>(.*?)<\/span>/g, "$1");
  assert.equal(strip(out), input);
});

if (failures) {
  console.error(`vocab-linkify: ${failures} failing assertion(s)`);
  process.exit(1);
}
console.log("vocab-linkify: all checks passed");
