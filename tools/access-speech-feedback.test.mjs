#!/usr/bin/env node
/**
 * Speaking Studio "What I said" panel: the pure read-back in src/lang/speech-feedback.js.
 * Pace is an observation only — no target, band, or good/bad field may ever appear in its output.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  linkJobsFor,
  markedSegments,
  paceObservation,
  speechFeedback,
  transcriptFit,
} from "../access-practice-lab/src/lang/speech-feedback.js";

const AUDIO = (over = {}) => ({
  ok: true,
  seconds: 20,
  speechSeconds: 16,
  longestRun: 6.4,
  segments: [
    { start: 1, end: 8 },
    { start: 9, end: 19 },
  ],
  ...over,
});

test("word-bank and order words are counted and marked in the learner's own text", () => {
  const text =
    "First the seedling grew on the windowsill. Then it turned pale. Finally we measured it.";
  const fb = speechFeedback(text, {
    keyUse: "Narrate",
    wordBank: ["seedling", "windowsill", "cabinet", "measured", "chlorophyll"],
  });
  assert.equal(fb.bank.total, 5);
  assert.deepEqual(fb.bank.used, ["seedling", "windowsill", "measured"]);
  assert.deepEqual(fb.bank.unused, ["cabinet", "chlorophyll"]);
  assert.deepEqual(fb.links.words, ["first", "then", "finally"]);
  assert.equal(fb.links.kind, "order");
  assert.equal(
    fb.segments.map((s) => s.text).join(""),
    text,
    "segments rebuild the transcript exactly",
  );
  const marked = fb.segments.filter((s) => s.kind).map((s) => `${s.kind}:${s.text}`);
  assert.deepEqual(marked, [
    "link:First",
    "bank:seedling",
    "bank:windowsill",
    "link:Then",
    "link:Finally",
    "bank:measured",
  ]);
});

test("connectors follow the Key Language Use", () => {
  assert.deepEqual(linkJobsFor("Narrate"), ["sequence"]);
  assert.ok(linkJobsFor("Argue").includes("stance"));
  assert.deepEqual(linkJobsFor("Unknown"), linkJobsFor("Explain"));
  const fb = speechFeedback("I think we should plant trees because shade cools the yard.", {
    keyUse: "Argue",
  });
  assert.equal(fb.links.kind, "linking");
  assert.ok(fb.links.words.includes("because"));
});

test("purpose moves are listed with present/absent, required only", () => {
  const fb = speechFeedback("First we went to the park. Then we played.", { keyUse: "Narrate" });
  assert.equal(fb.keyUse, "Narrate");
  assert.ok(fb.moves.length >= 3);
  assert.equal(fb.moves.find((m) => m.id === "sequence").present, true);
  for (const m of fb.moves) assert.deepEqual(Object.keys(m).sort(), ["id", "label", "present"]);
});

test("overlapping marks never duplicate text; the bank wins a tie", () => {
  const segs = markedSegments("then then", [
    { start: 0, end: 4, kind: "link", rank: 1 },
    { start: 0, end: 4, kind: "bank", rank: 0 },
    { start: 2, end: 9, kind: "link", rank: 1 },
  ]);
  assert.equal(segs.map((s) => s.text).join(""), "then then");
  assert.equal(segs[0].kind, "bank");
});

test("pace is an observation: words a minute and longest run, nothing else", () => {
  const words =
    "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive";
  const p = paceObservation(25, AUDIO());
  assert.deepEqual(Object.keys(p).sort(), ["longestRun", "wpm"]);
  assert.equal(p.wpm, 85); // 25 words over 18 s from first to last sound ≈ 83 → nearest 5
  assert.equal(p.longestRun, 6);
  const fb = speechFeedback(words, { audio: AUDIO() });
  assert.equal(fb.pace.wpm, 85);
  for (const banned of ["target", "band", "good", "score", "level", "ok"])
    assert.ok(!(banned in fb.pace), `pace has no ${banned}`);
});

test("pace is withheld honestly when it cannot be measured", () => {
  assert.equal(paceObservation(20, null).reason, "no-recording");
  assert.equal(paceObservation(20, { ok: false, reason: "too-quiet" }).reason, "too-quiet");
  assert.equal(paceObservation(3, AUDIO()).reason, "too-short");
  assert.equal(paceObservation(200, AUDIO()).reason, "mismatch");
  assert.equal(speechFeedback("typed words only here today", {}).pace.reason, "no-recording");
});

test("transcriptFit keeps the Speaking Studio's old thresholds", () => {
  assert.equal(transcriptFit(0, 10), "");
  assert.equal(transcriptFit(50, 10), "high");
  assert.equal(transcriptFit(5, 10), "low");
  assert.equal(transcriptFit(5, 7), "", "short takes are never called too slow");
  assert.equal(transcriptFit(25, 10), "");
});

test("empty transcript yields nothing to show", () => {
  assert.equal(speechFeedback("", { wordBank: ["a"] }).words, 0);
});

test("the panel copy never scores or judges pace, and is bilingual", () => {
  const src = readFileSync(
    new URL("../access-practice-lab/src/speech-feedback-ui.js", import.meta.url),
    "utf8",
  );
  assert.match(src, /not a score/);
  assert.match(src, /no hay una velocidad correcta/);
  assert.doesNotMatch(
    src,
    /too (fast|slow)|good pace|speak faster|speak slower|demasiado (rápido|lento)/i,
  );
  assert.match(src, /stage !== "independent"/, "independent attempts never list unused bank words");
});
