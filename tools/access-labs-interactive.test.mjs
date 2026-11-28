// Pure logic behind the interactive Language Labs (src/labs/): verb morphing and Break it, connector relationships,
// punctuation and weigh-the-evidence, paragraph layers, skeleton and rebuild. Browser journey: access-labs-interactive-e2e.mjs.
import assert from "node:assert/strict";
import test from "node:test";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const C = await import(new URL("src/content/language-labs.js", LAB));
const K = await import(new URL("src/lang/labs-check.js", LAB));
const V = await import(new URL("src/labs/verb-model.js", LAB));
const B = await import(new URL("src/labs/bridge-model.js", LAB));
const X = await import(new URL("src/labs/xray-model.js", LAB));

const ALL_TENSES = Object.keys(V.ASPECT);

test("verb morphing: every stop of both bands builds a form for every action", () => {
  assert.equal(V.composeVerb("Maya", "build", "past-perfect"), "had built");
  assert.equal(V.composeVerb("Maya", "build", "present-perfect"), "has built");
  assert.equal(V.composeVerb("we", "plant", "present-perfect"), "have planted");
  assert.equal(V.composeVerb("my brother", "write", "present"), "writes");
  assert.equal(V.composeVerb("the scientists", "study", "past-progressive"), "were studying");
  assert.equal(V.composeVerb("Leo", "run", "present-progressive"), "is running");
  for (const band of ["3-5", "6-8"])
    for (const tense of C.VERB_STOPS[band])
      for (const v of C.VERB_EXPLORE) {
        assert.ok(V.composeVerb(v.subject, v.base, tense), `${band} ${tense} ${v.base}`);
        const s = V.sentenceFor(C.STOP_CUES[tense][0], v, tense);
        assert.ok(s.text.startsWith(C.STOP_CUES[tense][0]) && s.text.endsWith("."), s.text);
        assert.equal(`${s.helper} ${s.main}`.trim(), s.form);
      }
});

test("every stop has a picture position, an aspect and a clock hour", () => {
  for (const t of ALL_TENSES) {
    assert.ok(V.POSITION[t] && V.POSITION[t].at >= 0 && V.POSITION[t].at <= 1, t);
    assert.ok(["past", "now", "future"].includes(V.phaseOf(t)));
  }
  for (const band of ["3-5", "6-8"]) for (const t of C.VERB_STOPS[band]) assert.ok(V.ASPECT[t], t);
  assert.equal(V.phaseOf("past"), "past");
  assert.equal(V.phaseOf("present"), "now");
  assert.equal(V.phaseOf("future"), "future");
});

test("Break it: the mix-up is never the correct form and always explains itself in both languages", () => {
  for (const tense of ALL_TENSES)
    for (const v of C.VERB_EXPLORE) {
      const right = V.composeVerb(v.subject, v.base, tense);
      const b = V.breakIt(tense, v);
      assert.notEqual(b.form, right, `${tense} ${v.base}`);
      assert.ok(b.says?.[0] && b.says?.[1] && b.means?.[0] && b.means?.[1], `${tense} explains`);
    }
  assert.equal(V.breakIt("present", { subject: "Maya", base: "build" }).kind, "base-no-s");
  assert.equal(
    V.breakIt("present-progressive", { subject: "Maya", base: "build" }).form,
    "building",
  );
});

test("scrubber helpers keep a stop in range and remember what was visited", () => {
  const stops = C.VERB_STOPS["6-8"];
  assert.equal(V.clampStop(99, stops), stops.indexOf("present"));
  assert.equal(V.clampStop(3, stops), 3);
  assert.deepEqual(V.visit([4, 1], 1), [4, 1]);
  assert.deepEqual(V.visit([4], 1), [1, 4]);
});

test("verb hints never state the answer", () => {
  for (const it of C.VERB_ITEMS)
    for (const level of [0, 1]) {
      const h = K.verbHint(it, level);
      assert.ok(h.en && h.es);
      for (const a of it.accept)
        if (a.length > 3 && a !== it.base)
          assert.ok(!new RegExp(`\\b${a}\\b`, "i").test(h.en), `${it.id} hint ${level}`);
    }
});

test("connector punctuation is part of the bridge", () => {
  assert.equal(
    B.joinIdeas("The park was crowded", "we found a quiet bench", "so"),
    "The park was crowded, so we found a quiet bench.",
  );
  assert.equal(
    B.joinIdeas("It rained", "we went inside", "however"),
    "It rained; however, we went inside.",
  );
  assert.equal(
    B.joinIdeas("Mia studied", "she did well", "because"),
    "Mia studied because she did well.",
  );
  assert.equal(
    B.joinIdeas("Mia studied", "she did well", "then"),
    "Mia studied; then she did well.",
  );
  assert.equal(B.joinIdeas("A", "b", ""), "A. b.");
  assert.deepEqual(
    B.deckTiles("however").map((t) => t.text),
    [";", "however", ","],
  );
  assert.deepEqual(
    B.deckTiles("so").map((t) => t.text),
    [",", "so"],
  );
  assert.deepEqual(
    B.deckTiles("because").map((t) => t.text),
    ["because"],
  );
  for (const w of [...C.BRIDGE_PALETTE, ...B.EXTRA_68]) {
    const p = B.punctuation(w);
    assert.ok(p.kind !== "plain" && p.rule.en && p.rule.es, `${w} has a punctuation rule`);
  }
});

test("band palettes: every connector has a job, a Spanish gloss and a place in the six relationships", () => {
  assert.deepEqual(B.paletteFor(C.BRIDGE_PALETTE, "3-5"), C.BRIDGE_PALETTE);
  const p68 = B.paletteFor(C.BRIDGE_PALETTE, "6-8");
  assert.ok(p68.length > C.BRIDGE_PALETTE.length);
  for (const w of p68) {
    assert.ok(B.JOB_ORDER.includes(K.jobOf(w)), `${w} job`);
    assert.ok(B.GLOSS[w], `${w} gloss`);
  }
  for (const j of B.JOB_ORDER)
    assert.ok(B.JOB_NAMES[j] && B.JOB_QUESTION[j] && K.JOB_MEANING[j], j);
  assert.ok(B.fits("so", ["cause"]) && !B.fits("but", ["cause"]));
});

test("weigh the evidence: the heavier idea follows the bridge, and only the right combination backs the claim", () => {
  for (const sc of B.WEIGH) {
    const a = B.weigh(sc, "support", "however");
    assert.equal(a.heavier, "counter");
    assert.equal(a.backsClaim, false);
    assert.ok(a.sentence.includes("; however,"));
    const b = B.weigh(sc, "counter", "however");
    assert.equal(b.heavier, "support");
    assert.equal(b.backsClaim, true);
    const c = B.weigh(sc, "counter", "although-front");
    assert.ok(c.sentence.startsWith("Although "));
    assert.equal(c.heavier, "support");
    const d = B.weigh(sc, "support", "although-mid");
    assert.equal(d.heavier, "support");
    assert.ok(d.sentence.includes(", although "));
    for (const w of [a, b, c, d]) {
      assert.ok(
        w.sentence.toLowerCase().includes(sc.support) &&
          w.sentence.toLowerCase().includes(sc.counter),
      );
      assert.equal(B.tilt(w), w.backsClaim ? 1 : -1);
      assert.ok(B.weighNote(w).en && B.weighNote(w).es);
    }
  }
  assert.equal(B.weigh(B.WEIGH[0], "support", "nope"), null);
});

test("paragraph layers: lenses light the right bands and the skeleton follows the job order", () => {
  assert.equal(X.lensState("plain", "topic"), "plain");
  assert.equal(X.lensState("all", "explain"), "lit");
  assert.equal(X.lensState("links", "detail"), "lit");
  assert.equal(X.lensState("topic", "topic"), "lit");
  assert.equal(X.lensState("topic", "detail"), "dim");
  for (const l of X.LENSES) assert.ok(l.name[0] && l.name[1], l.id);
  for (const band of ["3-5", "6-8"]) {
    const sk = X.skeleton(C.XRAY_PRACTICE[band].sentences);
    assert.deepEqual(
      sk.map((s) => s.job),
      ["topic", "detail", "detail", "explain", "conclude"],
    );
    assert.deepEqual(
      sk.filter((s) => s.job === "detail").map((s) => s.n),
      [1, 2],
    );
    assert.equal(
      X.slotLabel(sk[1], (en) => en),
      "Detail 1",
    );
    assert.equal(
      X.slotLabel(sk[0], (en) => en),
      "Topic sentence",
    );
  }
});

test("reordering helpers", () => {
  assert.deepEqual(X.moveItem([0, 1, 2, 3], 0, 2), [1, 2, 0, 3]);
  assert.deepEqual(X.moveItem([0, 1, 2], 2, 0), [2, 0, 1]);
  assert.deepEqual(X.moveItem([0, 1, 2], 1, 9), [0, 1, 2]);
  assert.equal(
    X.slotAt(50, [
      [0, 40],
      [40, 80],
      [80, 120],
    ]),
    1,
  );
  assert.equal(
    X.slotAt(-30, [
      [0, 40],
      [40, 80],
    ]),
    0,
  );
});

test("rebuild the paragraph: a bank with one card that does not belong, checked slot by slot", () => {
  for (const band of ["3-5", "6-8"]) {
    const pr = C.XRAY_PRACTICE[band];
    const n = pr.sentences.length;
    const bank = X.rebuildBank(n);
    assert.deepEqual([...bank].sort(), [...Array(n + 1).keys()]);
    assert.notDeepEqual(bank.slice(0, n), [...Array(n).keys()], "the bank is not already in order");
    assert.ok(X.DISTRACTOR[band].text && X.DISTRACTOR[band].why.en && X.DISTRACTOR[band].why.es);
    assert.ok(!pr.sentences.some((s) => s.text === X.DISTRACTOR[band].text));
    assert.ok(X.checkRebuild(pr, [...Array(n).keys()]).ok);
    const swapped = X.checkRebuild(pr, [1, 0, 2, 3, 4]);
    assert.equal(swapped.ok, false);
    assert.deepEqual(
      swapped.results.map((r) => r.ok),
      [false, false, true, true, true],
    );
    const withBad = X.checkRebuild(pr, [0, 1, 2, 3, n]);
    assert.equal(withBad.results[4].distractor, true);
    assert.equal(withBad.ok, false);
    const partial = X.checkRebuild(pr, [0, null, null, null, null]);
    assert.equal(partial.full, false);
    assert.equal(partial.results[1].empty, true);
  }
  assert.deepEqual(X.place([null, 2, null], 2, 0), [2, null, null], "a placed card moves");
  assert.deepEqual(
    X.place([0, null], 1, 0),
    [1, null],
    "the card that was there leaves with no duplicate",
  );
  assert.deepEqual(X.unplace([0, 1, 2], 1), [0, null, 2]);
});
