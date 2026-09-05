import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolveNoticeWonderAcademicWord } from "@eduwonderlab/engine/core/notice-wonder-glossary.js";
import { resolveVocabImage } from "@eduwonderlab/engine/core/vocab-images.js";

const ids = readdirSync(new URL("../lessons/", import.meta.url), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d+-\d+$/.test(entry.name))
  .map((entry) => entry.name)
  .sort();

let occurrences = 0;
for (const id of ids) {
  const config = JSON.parse(
    readFileSync(new URL(`../lessons/${id}/config.json`, import.meta.url), "utf8"),
  );
  for (const label of config.launch?.beCurious?.vocab ?? []) {
    occurrences += 1;
    const entry = resolveNoticeWonderAcademicWord(label, config.vocabulary);
    assert.ok(entry, `${id}: ${label} needs a glossary entry`);
    assert.ok(entry.definition?.trim(), `${id}: ${label} needs a simple definition`);
    assert.ok(entry.definition.length <= 180, `${id}: ${label} definition is too long`);
    assert.match(
      resolveVocabImage(entry.term, entry.image),
      /^\/assets\/vocab-images\/[a-z0-9-]+\.svg$/,
    );
  }
}

assert.equal(ids.length, 84);
assert.equal(occurrences, 459);

const renderer = readFileSync(
  new URL("../engine/core/lesson-renderer.js", import.meta.url),
  "utf8",
);
const css = readFileSync(new URL("../engine/styles/design-system.css", import.meta.url), "utf8");
assert.match(renderer, /resolveNoticeWonderAcademicWord/);
assert.match(renderer, /Open definition and picture for/);
assert.match(renderer, /openObjectiveTermPopup\(entry\)/);
assert.match(css, /\.nw-vocab-word[\s\S]*?min-height:\s*44px/);
assert.match(css, /\.nw-vocab-add[\s\S]*?min-height:\s*44px/);

console.log(`Notice/Wonder glossary coverage passed: ${occurrences} word uses.`);
