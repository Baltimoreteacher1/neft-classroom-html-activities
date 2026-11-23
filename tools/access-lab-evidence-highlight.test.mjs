// Text-evidence highlighting (src/lab/evidence-highlight.js): chunking, selection, evidence, popover state,
// markup and the authored Reading-game content that feeds it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as H from "../access-practice-lab/src/lab/evidence-highlight.js";
import { toHtml } from "../access-practice-lab/src/util.js";

const root = new URL("../access-practice-lab/", import.meta.url).pathname;
const json = (f) => JSON.parse(readFileSync(`${root}content/games/${f}.json`, "utf8"));
const I = { T: (en) => en, S: (en) => en };
const PASSAGE =
  "When a bee visits a flower, it carries pollen that helps the plant make fruit. Mr. Lee keeps bees. A bee has five eyes on its head.";

test("chunking is deterministic, ordered and has stable ids", () => {
  const a = H.chunkPassage(PASSAGE);
  const b = H.chunkPassage(PASSAGE);
  assert.deepEqual(a, b);
  assert.deepEqual(
    a.map((c) => c.id),
    ["s0c0", "s0c1", "s1c0", "s2c0"],
  );
  assert.equal(a[0].text, "When a bee visits a flower,");
  assert.equal(a[1].text, "it carries pollen that helps the plant make fruit.");
  assert.equal(a[2].text, "Mr. Lee keeps bees.", "an abbreviation does not end a sentence");
  assert.equal(new Set(a.map((c) => c.id)).size, a.length);
});

test("sentence level gives one chunk per sentence; arrays are taken as already split", () => {
  const s = H.chunkPassage(PASSAGE, { level: "sentence" });
  assert.deepEqual(
    s.map((c) => c.id),
    ["s0", "s1", "s2"],
  );
  const arr = H.chunkPassage([
    "Sam's eyes got big. “Oh no!” he said.",
    "Lena felt bad because she let go.",
  ]);
  assert.deepEqual([...new Set(arr.map((c) => c.sentence))], [0, 1]);
  assert.ok(arr.every((c) => c.text.trim().split(/\s+/).length >= 2));
});

test("short pieces fold in and one long clause is cut once at a linking word", () => {
  const folded = H.chunkPassage(["Instead, she quietly slid the card back to him."]);
  assert.equal(folded.length, 1);
  const long = H.chunkPassage([
    "A helmet has a hard shell and soft foam inside that take the force of a fall instead of your head.",
  ]);
  assert.equal(long.length, 2);
  assert.equal(
    long.map((c) => c.text).join(" "),
    "A helmet has a hard shell and soft foam inside that take the force of a fall instead of your head.",
  );
});

test("toggle marks, unmarks, caps the marks and ignores unknown ids; it never mutates", () => {
  const st0 = H.newHighlight();
  const st1 = H.toggle(st0, "s0c0");
  assert.deepEqual(st0.ids, []);
  assert.deepEqual(H.selectedIds(st1), ["s0c0"]);
  assert.deepEqual(H.selectedIds(H.toggle(st1, "s0c0")), []);
  const three = ["a", "b", "c"].reduce((st, id) => H.toggle(st, id), st0);
  assert.deepEqual(H.selectedIds(three), ["b", "c"], "oldest mark makes room");
  assert.deepEqual(H.selectedIds(H.toggle(H.toggle(st0, "a", { max: 1 }), "b", { max: 1 })), ["b"]);
  assert.deepEqual(H.selectedIds(H.toggle(st0, "zzz", { valid: ["a"] })), []);
  assert.equal(H.hasSelection(st1), true);
  assert.deepEqual(JSON.parse(JSON.stringify(st1)), st1, "state survives a save and reload");
});

test("acceptedIds uses authored phrases, else the fallback; evidenceOk checks the marks", () => {
  const chunks = H.chunkPassage(PASSAGE);
  assert.deepEqual(H.acceptedIds(chunks, ["it carries pollen that helps the plant"]), ["s0c1"]);
  assert.deepEqual(H.acceptedIds(chunks, ["not in the text"], ["s2c0"]), ["s2c0"]);
  assert.deepEqual(H.acceptedIds(chunks, undefined, H.idsOfSentence(chunks, 1)), ["s1c0"]);
  const accepted = ["s0c1"];
  assert.equal(H.evidenceOk(H.toggle(H.newHighlight(), "s0c1"), accepted), true);
  assert.equal(H.evidenceOk(H.toggle(H.newHighlight(), "s2c0"), accepted), false);
  assert.equal(H.evidenceOk(H.newHighlight(), accepted), false);
  const two = H.toggle(H.toggle(H.newHighlight(), "s2c0"), "s0c1");
  assert.equal(H.evidenceOk(two, accepted), true, "any accepted phrase among the marks counts");
  assert.equal(
    H.supportText(chunks, accepted),
    "it carries pollen that helps the plant make fruit.",
  );
  assert.equal(H.supportText(chunks, accepted, ["carries pollen"]), "carries pollen");
});

test("popover state toggles, closes and survives serialization", () => {
  let st = H.newHighlight();
  st = H.togglePopover(st, "pollen");
  assert.equal(H.popoverOpen(st), "pollen");
  st = H.togglePopover(st, "dam");
  assert.equal(H.popoverOpen(st), "dam", "opening another word replaces the open one");
  assert.equal(H.popoverOpen(H.togglePopover(st, "dam")), null);
  assert.equal(H.popoverOpen(H.closePopover(st)), null);
  assert.equal(H.popoverOpen(JSON.parse(JSON.stringify(st))), "dam");
  assert.deepEqual(
    H.selectedIds(H.toggle(st, "s0c0")),
    ["s0c0"],
    "marking keeps the popover state",
  );
});

test("clickHighlight handles phrase, word-help and close controls and records opened help", () => {
  const used = [];
  const env = { use: (k) => used.push(k) };
  const btn = (attr, v) => ({
    dataset: v === undefined ? {} : { [attr]: v },
    hasAttribute: (n) => n === "data-g-vclose" && v === undefined,
  });
  const chunks = H.chunkPassage(PASSAGE);
  let r = H.clickHighlight(btn("gHl", "s0c1"), H.newHighlight(), { chunks, env });
  assert.deepEqual(H.selectedIds(r.st), ["s0c1"]);
  assert.equal(
    H.clickHighlight(btn("gHl", "s0c1"), r.st, { chunks, env, locked: true }).changed,
    false,
  );
  assert.equal(
    H.clickHighlight(btn("gHl", "nope"), H.newHighlight(), { chunks, env }).changed,
    false,
  );
  r = H.clickHighlight(btn("gVocab", "pollen"), r.st, { chunks, env });
  assert.equal(H.popoverOpen(r.st), "pollen");
  assert.deepEqual(used, ["gloss"]);
  r = H.clickHighlight({ dataset: { gOpt: "1" }, hasAttribute: () => false }, r.st, {
    chunks,
    env,
  });
  assert.equal(r, null, "not a highlight control");
  const close = H.clickHighlight(
    { dataset: {}, hasAttribute: (n) => n === "data-g-vclose" },
    H.togglePopover(H.newHighlight(), "a"),
    { env },
  );
  assert.equal(H.popoverOpen(close.st), null);
});

test("vocabFor finds item vocab and glossary terms once each, in reading order", () => {
  const vocab = [
    { word: "dam", def: { en: "a wall across a stream", es: "una barrera" } },
    { word: "pond", def: { en: "still water", es: "agua quieta" } },
    { word: "absent", def: { en: "x", es: "y" } },
  ];
  const text = [
    "When beavers build a dam across a stream, the water backs up and makes a new pond.",
    "The dam holds.",
  ];
  assert.deepEqual(
    H.vocabFor(text, vocab).map((e) => e.word),
    ["dam", "pond"],
  );
  const glossary = { terms: [{ term: "stream", def: "A small river.", es: "arroyo" }] };
  assert.deepEqual(
    H.vocabFor(text, vocab, glossary).map((e) => e.word),
    ["dam", "stream", "pond"],
  );
  assert.deepEqual(
    H.vocabFor("Pollen is yellow.", [{ word: "pollen", def: { en: "powder", es: "polvo" } }]).map(
      (e) => e.word,
    ),
    ["pollen"],
  );
});

test("content checks accept good rows and flag bad ones", () => {
  const good = [{ word: "dam", def: { en: "a wall", es: "una barrera" } }];
  assert.deepEqual(H.vocabProblems(good, "a dam"), []);
  assert.deepEqual(H.vocabProblems(undefined, "a dam"), []);
  assert.equal(
    H.vocabProblems([{ word: "dam", def: { en: "a wall", es: "a wall" } }], "a dam", "x").length,
    1,
  );
  assert.equal(H.vocabProblems(good, "no such word", "x").length, 1);
  assert.equal(H.vocabProblems([], "a dam", "x").length, 1);
  assert.deepEqual(H.evidenceProblems(["a wall"], "Build a wall now."), []);
  assert.equal(H.evidenceProblems(["a moat"], "Build a wall now.", "x").length, 1);
  assert.equal(H.evidenceProblems([], "Build a wall now.", "x").length, 1);
});

test("markup: real aria-pressed buttons, no nested buttons, English text kept, word help wired", () => {
  const chunks = H.chunkPassage(PASSAGE);
  const vocab = H.vocabFor(PASSAGE, [
    { word: "pollen", def: { en: "a yellow powder", es: "un polvo amarillo" } },
  ]);
  let st = H.toggle(H.newHighlight(), "s0c1");
  const out = toHtml(H.highlightHTML(chunks, { st, I, vocab }));
  assert.equal((out.match(/<button /g) || []).length, chunks.length);
  assert.match(out, /data-g-hl="s0c1" aria-pressed="true"/);
  assert.match(out, /data-g-hl="s0c0" aria-pressed="false"/);
  assert.match(out, /type="button"/);
  assert.match(out, /<span class="lab-ev-vw">pollen<\/span>/);
  assert.match(out, /<\/button> <button/, "phrases are separated by a space");
  assert.doesNotMatch(
    out,
    /<button[^>]*>(?:(?!<\/button>)[\s\S])*<button/,
    "no button inside a button",
  );
  const locked = toHtml(H.highlightHTML(chunks, { st, I, locked: true, keyIds: ["s0c0"] }));
  assert.match(locked, /disabled/);
  assert.match(locked, /is-key/);
  assert.match(locked, /is-miss/);
  const help = toHtml(H.vocabHTML(vocab, H.togglePopover(st, "pollen"), { I, name: "t" }));
  assert.match(help, /aria-expanded="true"/);
  assert.match(help, /aria-controls="lab-ev-pop-t-0"/);
  assert.match(help, /id="lab-ev-pop-t-0" role="note"\s*>/);
  assert.doesNotMatch(toHtml(H.vocabHTML(vocab, st, { I, name: "t" })), /aria-expanded="true"/);
  assert.match(
    toHtml(H.vocabHTML(vocab, st, { I, name: "t" })),
    /id="lab-ev-pop-t-0" role="note" hidden/,
  );
  assert.equal(toHtml(H.vocabHTML([], st, { I })), "");
  assert.match(toHtml(H.markedHTML(chunks, H.newHighlight(), { I })), /is-empty/);
  assert.match(toHtml(H.markedHTML(chunks, st, { I })), /it carries pollen/);
  assert.equal(toHtml(H.evidenceNote(chunks, ["s0c1"], true, { I })), "");
  assert.equal(toHtml(H.evidenceNote(chunks, ["s0c1"], null, { I })), "");
  assert.match(
    toHtml(H.evidenceNote(chunks, ["s0c1"], false, { I })),
    /it carries pollen that helps/,
  );
});

test("ES and EN+ES keep the English definition and add the Spanish gloss (I.TARGET)", () => {
  const TARGET = (en, es) => `${en} | ${es}`;
  const vocab = [{ word: "dam", en: "a wall across a stream", es: "una barrera", gloss: "" }];
  const out = toHtml(H.vocabHTML(vocab, H.newHighlight(), { I: { ...I, TARGET }, name: "t" }));
  assert.match(out, /a wall across a stream \| una barrera/);
  assert.match(out, /<strong lang="en">dam<\/strong>/);
});

test("authored Reading-game evidence and vocab are valid and resolve to real phrases", () => {
  const eh = Object.values(json("evidence-hunt").bands).flatMap((b) => b.passages);
  const sd = Object.values(json("story-detective").bands).flatMap((b) => b.cases);
  const rat = Object.values(json("read-along-theater").bands).flatMap((b) => b.plays);
  assert.ok(eh.length >= 16 && sd.length >= 12 && rat.length >= 6);
  for (const p of eh) {
    const chunks = H.chunkPassage(p.sentences.map((s) => s.en));
    const proof = p.sentences.findIndex((s) => s.kind === "proof");
    const acc = H.acceptedIds(chunks, p.evidence);
    assert.ok(p.evidence?.length, `${p.id}: evidence authored`);
    assert.ok(
      acc.length && acc.every((id) => chunks.find((c) => c.id === id).sentence === proof),
      `${p.id}: evidence sits in the proof sentence`,
    );
    assert.ok(
      H.vocabFor(
        p.sentences.map((s) => s.en),
        p.vocab,
      ).length === p.vocab.length,
      `${p.id}: every vocab word is in the text`,
    );
  }
  for (const k of sd) {
    const chunks = H.chunkPassage(k.sentences.map((s) => s.en));
    const acc = H.acceptedIds(chunks, k.evidence);
    assert.ok(
      acc.length && acc.every((id) => chunks.find((c) => c.id === id).sentence === k.strongest),
      `${k.id}: evidence sits in the strongest clue`,
    );
    assert.equal(
      H.vocabFor(
        k.sentences.map((s) => s.en),
        k.vocab,
      ).length,
      k.vocab.length,
      `${k.id}: vocab in the text`,
    );
  }
  for (const pl of rat) {
    const pg = pl.pages.find((g) => g.task.type === "line");
    const chunks = H.chunkPassage(pg.lines.map((l) => l.en));
    const acc = H.acceptedIds(chunks, pg.task.evidence);
    assert.ok(
      acc.length && acc.every((id) => chunks.find((c) => c.id === id).sentence === pg.task.answer),
      `${pl.id}: evidence sits in the answer line`,
    );
    assert.equal(
      H.vocabFor(
        pg.lines.map((l) => l.en),
        pg.task.vocab,
      ).length,
      pg.task.vocab.length,
      `${pl.id}: vocab in the line`,
    );
  }
});

test("the lab-reading stylesheet honours reduced motion and has no timers or purple", () => {
  const css = readFileSync(`${root}lab-reading.css`, "utf8");
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /\b(?:purple|violet|indigo)\b|setInterval|countdown|timeLimit/i);
  for (const [, ms] of css.matchAll(/(?:transition|animation)[^;{]*?\b(0?\.\d+)s\b/g))
    assert.ok(Number(ms) >= 0.15 && Number(ms) <= 0.2, `duration ${ms}s`);
});
