// Immersive Reader engine (access-practice-lab/src/lang/reader.js): parsing offsets, boundary mapping, chunking,
// read-aloud alignment, the lab word lookup, and saved texts and words with the review ladder.
import assert from "node:assert/strict";
import test from "node:test";
import { READER_SAMPLES } from "../access-practice-lab/src/content/reader-samples.js";
import { WORDS } from "../access-practice-lab/src/content/wordlab-words.js";
import * as R from "../access-practice-lab/src/lang/reader.js";

const TEXT =
  "The lighthouse stands on a tall rock. Every night, its bright light guides the boats safely home.\n\nSailors trust it, because it never fails.";

test("parseText: offsets point at the real characters, paragraphs and sentences nest", () => {
  const p = R.parseText(TEXT);
  assert.equal(p.paragraphs.length, 2);
  assert.equal(p.sentences.length, 3);
  for (const w of p.words) assert.equal(p.text.slice(w.start, w.end), w.text);
  for (const s of p.sentences) assert.equal(p.text.slice(s.start, s.end), s.text);
  assert.equal(p.words[0].norm, "the");
  assert.equal(p.sentences[2].p, 1, "third sentence is in the second paragraph");
  assert.equal(p.words.find((w) => w.text === "Sailors").s, 2);
  for (const s of p.sentences) assert.ok(s.to > s.from);
});

test("parseText: cap, clean-up and empty input", () => {
  assert.equal(R.parseText("").words.length, 0);
  assert.equal(R.parseText("   \n\n  ").sentences.length, 0);
  const long = "word ".repeat(3000);
  const p = R.parseText(long);
  assert.ok(p.text.length <= R.LIMITS.chars);
  assert.ok(!p.text.endsWith(" "));
  assert.equal(R.cleanText("a\r\n\r\n\r\n\r\nb"), "a\n\nb");
});

test("every sample parses and is short enough for one screen", () => {
  for (const s of READER_SAMPLES) {
    const p = R.parseText(s.body);
    assert.ok(p.words.length > 40 && p.words.length < 140, s.id);
    assert.equal(s.title.length, 2, `${s.id} has an English and a Spanish title`);
  }
});

test("wordAtChar follows a boundary to the word being spoken", () => {
  const p = R.parseText(TEXT);
  const s0 = p.sentences[0];
  assert.equal(p.words[R.wordAtChar(p, 0, 0)].text, "The");
  const idx = s0.text.indexOf("lighthouse") + 3;
  assert.equal(p.words[R.wordAtChar(p, 0, idx)].text, "lighthouse");
  assert.equal(p.words[R.wordAtChar(p, 0, s0.text.indexOf("rock"))].text, "rock");
  assert.equal(R.wordAtChar(p, 99, 0), -1);
});

test("schedule gives every word an increasing start time", () => {
  const p = R.parseText(TEXT);
  const t = R.schedule(p, 1, 0.9);
  assert.equal(t.length, p.sentences[1].to - p.sentences[1].from);
  for (let i = 1; i < t.length; i++) assert.ok(t[i].at > t[i - 1].at);
  const slow = R.schedule(p, 1, 0.7).at(-1).at;
  assert.ok(slow > t.at(-1).at, "slower speech takes longer");
});

test("chunkStarts breaks only long sentences, never into pieces shorter than four words", () => {
  const short = R.parseText("It is a small cat.");
  assert.equal(R.chunkStarts(short).size, 0);
  const long = R.parseText(
    "When the long summer finally ended, the children walked back to school with new shoes, and they were happy because they missed their friends.",
  );
  const starts = [...R.chunkStarts(long)];
  assert.ok(starts.length >= 1);
  const all = [long.sentences[0].from, ...starts, long.sentences[0].to].sort((a, b) => a - b);
  for (let i = 1; i < all.length; i++) assert.ok(all[i] - all[i - 1] >= 3);
});

test("align: a clean read marks every word read", () => {
  const p = R.parseText("The cat sat on the warm mat.");
  const r = R.align(p.words, "the cat sat on the warm mat");
  assert.equal(r.read, 7);
  assert.equal(r.retry, 0);
  assert.equal(r.reached, 6);
});

test("align: a skipped content word is flagged, a dropped small word is not", () => {
  const p = R.parseText("The brave captain sailed across the wide ocean.");
  const r = R.align(p.words, "brave captain sailed the wide ocean");
  const flagged = r.practice.map((i) => p.words[i].text);
  assert.deepEqual(flagged, ["across"], "only across is flagged as a skipped content word");
});

test("align: a misheard content word becomes a word to try again; later words stay matched", () => {
  const p = R.parseText("The captain sailed across the enormous ocean today.");
  const r = R.align(p.words, "the captain sailed across the ocean today");
  assert.deepEqual(
    r.practice.map((i) => p.words[i].text),
    ["enormous"],
  );
  assert.equal(r.states[p.words.length - 1], "read");
});

test("align: unread words stay pending, and similar spellings and numbers match", () => {
  const p = R.parseText("We saw 5 big dogs running home quickly.");
  const r = R.align(p.words, "we saw five big dog");
  assert.equal(r.states[2], "read", "5 = five");
  assert.equal(r.states[4], "read", "dogs ~ dog");
  assert.equal(r.states[5], "pending");
  assert.equal(r.reached, 4);
  assert.ok(R.similar("running", "runing"));
  assert.ok(!R.similar("cat", "car"));
});

test("align: a reader who jumps far ahead is re-anchored by a long word", () => {
  const words =
    "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split(
      " ",
    );
  const p = R.parseText(`${words.join(" ")}.`);
  const r = R.align(p.words, "one two umm umm uhh seventeen eighteen");
  assert.equal(r.states[16], "read");
  assert.equal(r.states[17], "read");
});

test("lookupWord finds the lab's entry through common endings", () => {
  assert.equal(R.lookupWord(WORDS, "analyze")?.w, "analyze");
  assert.equal(R.lookupWord(WORDS, "Analyzed")?.w, "analyze");
  assert.equal(R.lookupWord(WORDS, "ancestors")?.w, "ancestor");
  assert.equal(R.lookupWord(WORDS, "the"), null);
  assert.equal(R.lookupWord(WORDS, ""), null);
  const e = R.lookupWord(WORDS, "ancient");
  assert.ok(e.d && e.de, "meaning in English and Spanish");
});

test("saved texts: newest first, no duplicates, capped", () => {
  let st = R.emptyState();
  const a = R.saveText(st, { title: "One", body: "First text here." }, 1000);
  st = a.state;
  const b = R.saveText(st, { body: "Second text here." }, 2000);
  st = b.state;
  assert.deepEqual(
    st.texts.map((t) => t.title),
    ["Second text here", "One"],
  );
  const again = R.saveText(st, { title: "x", body: "First text here." }, 3000);
  assert.equal(again.id, a.id);
  assert.equal(again.state.texts.length, 2);
  assert.equal(again.state.texts[0].id, a.id);
  for (let i = 0; i < 20; i++) st = R.saveText(st, { body: `Text number ${i}.` }, 4000 + i).state;
  assert.equal(st.texts.length, R.LIMITS.texts);
  assert.equal(R.saveText(st, { body: "  " }).id, "");
  assert.equal(R.removeText(st, st.texts[0].id).texts.length, R.LIMITS.texts - 1);
});

test("saved words: review follows the 1, 3, 7, 14 day ladder; a miss returns tomorrow", () => {
  let st = R.emptyState();
  st = R.addWord(
    st,
    {
      word: "Harbor",
      ctx: "Mara walks to the harbor.",
      def: "a safe place for boats",
      es: "puerto",
    },
    100,
  );
  assert.ok(R.isSaved(st, "harbor"));
  assert.equal(R.dueWords(st, 100).length, 1);
  st = R.reviewWord(st, "harbor", true, 100);
  assert.equal(st.bank.harbor.box, 0);
  assert.equal(st.bank.harbor.due, 101);
  assert.equal(R.dueWords(st, 100).length, 0);
  assert.equal(R.daysUntilNext(st, 100), 1);
  st = R.reviewWord(st, "harbor", true, 101);
  assert.equal(st.bank.harbor.due, 104);
  st = R.reviewWord(st, "harbor", false, 104);
  assert.equal(st.bank.harbor.box, 0);
  assert.equal(st.bank.harbor.due, 105);
  const again = R.addWord(st, { word: "HARBOR", ctx: "other" }, 200);
  assert.equal(again.bank.harbor.box, 0, "saving again keeps progress");
  assert.equal(again.bank.harbor.ctx, "Mara walks to the harbor.", "and keeps the first sentence");
  assert.equal(Object.keys(R.removeWord(again, "Harbor").bank).length, 0);
});

test("cleanState drops malformed data and keeps valid data", () => {
  assert.deepEqual(R.cleanState(null), R.emptyState());
  const st = R.cleanState({
    texts: [{ id: "a", body: "ok" }, { id: 5 }, null],
    bank: { Good: { word: "Good", box: 99, due: "x" }, "": {}, bad: 3 },
    prefs: { rate: 5, chunks: true },
  });
  assert.equal(st.texts.length, 1);
  assert.deepEqual(Object.keys(st.bank), ["good"]);
  assert.equal(st.bank.good.box, 3);
  assert.equal(st.bank.good.due, 0);
  assert.equal(st.prefs.rate, 0.9);
  assert.equal(st.prefs.chunks, true);
});

test("textFacts reports counts only", () => {
  const f = R.textFacts(R.parseText("An extraordinary caterpillar landed. It stayed."));
  assert.deepEqual(Object.keys(f).sort(), [
    "chunkable",
    "longWords",
    "longest",
    "longestSentence",
    "sentences",
    "words",
  ]);
  assert.equal(f.sentences, 2);
  assert.ok(f.longWords >= 2);
});
