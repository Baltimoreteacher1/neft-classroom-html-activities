import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

const path = resolve("access-practice-lab/content/packs/survival-vocabulary.json");
const pack = JSON.parse(await readFile(path, "utf8"));

test("T2 survival vocabulary has 12 bilingual topics and exactly 144 illustrated words", async () => {
  assert.equal(pack.reviewStatus, "automated-checks-only");
  assert.equal(pack.topics.length, 12);
  assert.ok(pack.topics.every((t) => t.words.length === 12 && t.title.en && t.title.es));
  const words = pack.topics.flatMap((t) => t.words);
  assert.equal(words.length, 144);
  assert.equal(new Set(words.map((w) => w.id)).size, 144);
  for (const word of words) {
    assert.ok(word.en && word.es && word.picture);
    const file = resolve("access-practice-lab", word.picture.split("/access-practice-lab/")[1]);
    assert.ok((await stat(file)).size <= 24 * 1024, `${word.id} picture exceeds 24 KB`);
  }
});

test("T2 pack exports the required print and practice formats", () => {
  assert.deepEqual(pack.outputs, [
    "flashcards-6-up",
    "word-wall",
    "labels-en-es",
    "matching-game",
    "bingo",
  ]);
});
