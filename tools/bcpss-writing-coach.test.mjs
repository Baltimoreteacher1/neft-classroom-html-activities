// Writing Lab coach engine (bcpss-teachers/writing-lab/wl-coach.js): sentence roles, TWR move detection,
// outline coverage, nudges and the first-draft diff. Plain node assertions (tools/run-tests.mjs).
import assert from "node:assert/strict";
import {
  analyzeParagraph,
  diffWords,
  hasAppositive,
  noteCovered,
  segments,
  splitSentences,
  startsWithTransition,
  transitionList,
} from "../bcpss-teachers/writing-lab/wl-coach.js";

const T = transitionList(["First,", "Next,", "As a result,", "For example,"]);

// Sentences: end marks, line breaks, quotes; empty input.
assert.deepEqual(splitSentences("A ship waits. The light flashes!\nIt is dark"), [
  "A ship waits.",
  "The light flashes!",
  "It is dark",
]);
assert.deepEqual(splitSentences("   "), []);
assert.equal(splitSentences('She said "Stop." Then we left.').length, 2);

// Transitions: phrase must end at a word boundary; longest phrase wins.
assert.equal(startsWithTransition("As a result, sailors stay safe.", T), "as a result");
assert.equal(startsWithTransition("Nextdoor neighbors wave.", T), "");
assert.equal(startsWithTransition("After that, the ship turns.", T), "after that");

// Appositives: real ones fire; a transition or clue-word opener does not.
assert.ok(hasAppositive("The lighthouse, a tall tower by the bay, flashes at night.", T));
assert.ok(hasAppositive("Sailors watch Fort McHenry, a star-shaped fort.", T));
assert.ok(!hasAppositive("First, the light flashes, and the ship turns.", T));
assert.ok(!hasAppositive("When fog rolls in, the horn blasts.", T));
assert.ok(!hasAppositive("The waves are big, and the boat rocks.", T));

// Outline coverage: half the key words (stem match) are enough; symbol-only notes are skipped.
assert.equal(
  noteCovered("light flashes = code for sailors", "The light flashed a code to the sailors."),
  true,
);
assert.equal(noteCovered("fog horn → sound waves", "The ship sailed home."), false);
assert.equal(noteCovered("→ + =", "anything"), null);

// Segments cover the sentence exactly, in order, and tag the moves.
const sent = "As a result, sailors stay safe because the signal travels far.";
const seg = segments(sent, { transitions: T, vocab: ["signal", "travel"] });
assert.equal(seg.map((s) => s.text).join(""), sent);
assert.deepEqual(
  seg.filter((s) => s.kind).map((s) => [s.kind, s.text]),
  [
    ["transition", "As a result"],
    ["conj", "because"],
    ["vocab", "signal"],
    ["vocab", "travels"],
  ],
);
const subSeg = segments("Although fog hides the light, the horn still works.", { transitions: T });
assert.deepEqual(
  subSeg.find((s) => s.kind === "sub"),
  { text: "Although", kind: "sub" },
);

// Full analysis: roles, moves, coverage, nudges.
const para =
  "A lighthouse sends messages to sailors with patterns of light. First, the light flashes in a code. " +
  "The pattern tells sailors where the rocks are, so they steer away. As a result, ships stay safe at night.";
const a = analyzeParagraph(para, {
  level: "l3_4",
  vocab: ["pattern", "signal"],
  transitions: ["First,", "As a result,"],
  notes: ["light flashes in code", "fog horn = sound waves"],
});
assert.deepEqual(
  a.sentences.map((s) => s.role),
  ["topic", "detail", "detail", "conclusion"],
);
assert.equal(a.moves.transition, 2);
assert.equal(a.moves.bbs, 1);
assert.equal(a.moves.appos, 0, "“First, the light flashes …” is not an appositive");
assert.deepEqual(
  a.coverage.map((c) => c.covered),
  [true, false],
);
assert.equal(a.nudges[0].k, "note", "a missing outline note is the first nudge here");
assert.deepEqual(a.stats.vocab, ["pattern"]);

// Mechanics come first; the last sentence may still be in progress.
const m = analyzeParagraph("the ship waits. It is dark", { level: "l3_4" });
assert.equal(m.nudges[0].k, "capital");
assert.ok(!m.nudges.some((n) => n.k === "end"), "an unfinished last sentence is not nagged yet");
assert.equal(analyzeParagraph("", {}).nudges[0].k, "start");

// Stretch asks for an appositive and a clue-word start; Starter never asks for because/but/so.
const s5 = analyzeParagraph("Ships need light. The light flashes. Ships stay safe.", {
  level: "l5_6",
});
assert.ok(s5.nudges.some((n) => n.k === "appos") && s5.nudges.some((n) => n.k === "sub"));
const s1 = analyzeParagraph("Ships need light. The light flashes. Ships stay safe.", {
  level: "l1_2",
});
assert.ok(!s1.nudges.some((n) => n.k === "bbs" || n.k === "appos"));

// Repeated openers.
const rep = analyzeParagraph(
  "The ship sails. The light flashes. The sailors see it. The end is near.",
  {
    level: "l3_4",
  },
);
assert.ok(rep.nudges.some((n) => n.k === "variety"));

// Diff: adds and removes words, rebuilds both texts.
const d = diffWords("The light flashes.", "The bright light flashes a code.");
assert.equal(d.added, 4, "bright + flashes a code. (punctuation stays with its word)");
assert.equal(d.removed, 1);
const rebuild = (ops, keep) =>
  ops
    .filter((o) => o.op === "same" || o.op === keep)
    .map((o) => o.text)
    .join(" ");
assert.equal(rebuild(d.ops, "add"), "The bright light flashes a code.");
assert.equal(rebuild(d.ops, "del"), "The light flashes.");
assert.deepEqual(diffWords("", ""), { ops: [], added: 0, removed: 0 });

console.log("bcpss-writing-coach: all assertions passed");
