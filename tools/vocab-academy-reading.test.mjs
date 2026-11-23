// Vocabulary Academy — the interactive reader's pure logic, swept over every real lesson passage (157, K-8), the grade 4
// companion exemplar, and companion readings synthesised in memory from the exemplar's shape.
// Pure: no DOM, no network. Run: node tools/vocab-academy-reading.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const VA = new URL("access-practice-lab/src/vocab-academy/", ROOT);
const load = (f) => import(new URL(f, VA));
const T = await load("reading/text.js");
const C = await load("reading/clues.js");
const M = await load("reading/marks.js");
const F = await load("reading/flow.js");
const I = await load("reading/ids.js");
const MODEL = await load("model.js");

const CONTENT = new URL("access-practice-lab/content/vocab-academy/", ROOT);
const lessons = [];
for (const g of readdirSync(CONTENT).filter((d) => /^g(K|[1-8])$/.test(d)))
  for (const f of readdirSync(new URL(`${g}/`, CONTENT)).filter((x) => /^u\d+\.json$/.test(x)))
    lessons.push(JSON.parse(readFileSync(new URL(`${g}/${f}`, CONTENT), "utf8")));
assert.ok(lessons.length >= 157, `expected 157 lessons, found ${lessons.length}`);
const exemplarFile = JSON.parse(readFileSync(new URL("g4/readings/u01.json", CONTENT), "utf8"));
const exemplar = I.normalizeReading(exemplarFile.reading, { kind: "companion" });
const g4u01 = lessons.find((l) => l.id === "g4-u01");

/** A companion built in memory from the exemplar's shape, for any lesson: the passage text re-used, clues and evidence made up. */
function synth(unit) {
  const p = unit.passage;
  const paras = p.paras;
  const spans = paras.map((x) => T.sentenceSpans(x));
  const clues = [];
  paras.forEach((para, pi) => {
    for (const w of T.wordSpans(para, unit.words)) {
      if (clues.length >= 3) break;
      const rest = para.slice(w.end).match(/^[,;:]?\s*([^.!?;,]{8,60})/);
      if (rest && !clues.some((c) => c.word === w.id) && !new RegExp(w.text, "i").test(rest[1]))
        clues.push({ word: w.id, para: pi, type: "definition", text: rest[1].trim() });
    }
  });
  const evSent = spans[0][0];
  return {
    id: `${unit.id}-r1`,
    genre: "informational",
    title: "Synth",
    purpose: "x",
    paras,
    words: p.words,
    qs: [
      ...(p.qs || []),
      {
        id: `${unit.id}-r1-ev`,
        skill: "evidence",
        para: 0,
        q: "Which sentence?",
        choices: [evSent.text.trim(), "Nothing here."],
        a: 0,
        why: "It is there.",
        ev: { para: 0, text: evSent.text.trim() },
      },
    ],
    clues,
    retellFrame: "I learned ___.",
  };
}

test("sentence spans partition every paragraph of every passage and the exemplar", () => {
  let paras = 0;
  for (const r of [...lessons.map((l) => l.passage), exemplar]) {
    for (const para of r.paras) {
      paras += 1;
      const spans = T.sentenceSpans(para);
      assert.ok(spans.length >= 1);
      let pos = 0;
      for (const s of spans) {
        assert.equal(s.start, pos, "no gap or overlap");
        assert.equal(s.text, para.slice(s.start, s.end));
        pos = s.end;
      }
      assert.equal(pos, para.length, "every character belongs to a sentence");
      assert.equal(spans.map((s) => s.text).join(""), para);
    }
  }
  assert.ok(paras > 500);
  assert.equal(T.sentenceSpans("").length, 0);
  assert.equal(
    T.sentenceSpans("Dr. Lee met Mr. Cho. They ran.").length,
    2,
    "abbreviations do not end a sentence",
  );
});

test("paragraph pieces cover every character exactly once, in order, and lesson words are whole tokens", () => {
  let found = 0;
  let expected = 0;
  for (const unit of lessons) {
    for (const para of unit.passage.paras) {
      const pieces = T.paraPieces(para, unit.words);
      let pos = 0;
      for (const p of pieces) {
        assert.equal(p.start, pos);
        assert.equal(para.slice(p.start, p.end), p.text);
        pos = p.end;
      }
      assert.equal(pos, para.length);
      assert.equal(pieces.map((p) => p.text).join(""), para);
    }
    const met = T.wordsMet(unit.passage.paras, unit.words);
    for (const id of unit.passage.words || []) {
      expected += 1;
      if (met.includes(id)) found += 1;
    }
  }
  assert.ok(
    found / expected > 0.97,
    `passage words recognised in their own text: ${found}/${expected}`,
  );
});

test("karaoke: every boundary character maps onto the token spoken, across every plan segment", () => {
  for (const unit of lessons) {
    const paras = unit.passage.paras;
    const tokens = paras.map((p) => T.tokenSpans(p));
    const plan = T.readAlongPlan(paras);
    assert.ok(plan.length >= paras.length);
    // The plan visits every paragraph and sentence once, in order.
    const keys = plan.map((s) => `${s.para}:${s.sentence}`);
    assert.equal(new Set(keys).size, keys.length);
    for (const seg of plan) {
      const toks = tokens[seg.para].filter(
        (t) => t.start >= seg.start + seg.lead && t.end <= seg.start + seg.lead + seg.text.length,
      );
      for (const t of toks) {
        const charIndex = t.start - (seg.start + seg.lead); // what the speech engine reports inside the trimmed segment
        const hit = T.locateBoundary(seg, tokens[seg.para], charIndex);
        assert.equal(hit.token, t.index);
        assert.equal(
          paras[seg.para].slice(tokens[seg.para][hit.token].start, tokens[seg.para][hit.token].end),
          t.text,
        );
      }
    }
  }
  const toks = T.tokenSpans("Go on, now");
  assert.equal(T.tokenAt(toks, 2), 1, "a boundary on the space points at the next word");
  assert.equal(T.tokenAt(toks, 4), 1, "a boundary inside a word points at that word");
  assert.equal(T.tokenAt(toks, 99), -1);
  const mid = T.readAlongPlan(["One. Two. Three.", "Four."], { para: 0, sentence: 1 });
  assert.deepEqual(
    mid.map((s) => s.text),
    ["Two.", "Three.", "Four."],
    "click a sentence to hear from there",
  );
});

test("clue check accepts only a tap on a word of the clue span, and a miss reveals nothing", () => {
  assert.equal(exemplar.clues.length, 4);
  for (const [ci, clue] of exemplar.clues.entries()) {
    const span = C.clueSpan(exemplar.paras, clue);
    assert.ok(span, `clue ${ci} text is in its paragraph`);
    for (let pi = 0; pi < exemplar.paras.length; pi++) {
      for (const t of T.tokenSpans(exemplar.paras[pi])) {
        const inside = pi === clue.para && t.start >= span.start && t.start < span.end;
        const got = C.findClueAt(exemplar.paras, exemplar.clues, clue.word, {
          para: pi,
          charIndex: t.start,
        });
        assert.equal(got === ci, inside, `word "${t.text}" in paragraph ${pi}`);
      }
    }
    // Another word's phrase is a miss for this word.
    const other = exemplar.clues.find((c) => c.word !== clue.word);
    const o = C.clueSpan(exemplar.paras, other);
    assert.equal(
      C.findClueAt(exemplar.paras, exemplar.clues, clue.word, {
        para: other.para,
        charIndex: o.start,
      }),
      -1,
    );
  }
  // The blank between two words is not a tap on the phrase.
  const c0 = exemplar.clues[0];
  const s0 = C.clueSpan(exemplar.paras, c0);
  const blank = exemplar.paras[c0.para].indexOf(" ", s0.start);
  assert.equal(
    C.findClueAt(exemplar.paras, exemplar.clues, c0.word, { para: c0.para, charIndex: blank }),
    -1,
  );

  // The game: pick a word, then a phrase.
  let st = C.blankClueState();
  let r = C.clueStep(st, exemplar.paras, exemplar.clues, { tap: { para: 0, charIndex: 0 } });
  assert.equal(r.event, "pick-word-first");
  r = C.clueStep(st, exemplar.paras, exemplar.clues, { select: "va.capable.adj" });
  assert.equal(r.event, "no-clue-for-word");
  r = C.clueStep(st, exemplar.paras, exemplar.clues, { select: c0.word });
  assert.equal(r.event, "selected");
  st = r.state;
  const miss = C.clueStep(st, exemplar.paras, exemplar.clues, { tap: { para: 0, charIndex: 0 } });
  assert.equal(miss.event, "miss");
  assert.deepEqual(miss.state, st, "a miss changes nothing and costs nothing");
  const blob = JSON.stringify(miss) + JSON.stringify(C.MISS_TEXT);
  assert.ok(
    !blob.includes(c0.text) && !blob.includes(String(s0.start)) && !/"clue"/.test(blob),
    "a miss carries nothing about the phrase",
  );
  const win = C.clueStep(st, exemplar.paras, exemplar.clues, {
    tap: { para: c0.para, charIndex: s0.start + 2 },
  });
  assert.equal(win.event, "found");
  assert.deepEqual(win.state.found, [0]);
  assert.equal(win.state.target, "");
  const ranges = C.foundRanges(exemplar.paras, exemplar.clues, win.state.found);
  assert.deepEqual(ranges[c0.para][0], {
    start: s0.start,
    end: s0.end,
    type: "definition",
    clue: 0,
  });
  for (const type of C.CLUE_TYPES) {
    const [en, es, glyph] = C.clueLabel(type);
    assert.ok(en && es && glyph, `${type} has words and a shape, not colour alone`);
  }
});

test("exemplar clues never contain the word they explain and are playable", () => {
  assert.equal(C.playableClues(exemplar.paras, exemplar.clues).length, exemplar.clues.length);
  const byId = new Map(g4u01.words.map((w) => [w.id, w]));
  for (const c of exemplar.clues)
    assert.ok(!new RegExp(byId.get(c.word).hw.slice(0, 6), "i").test(c.text));
});

test("evidence tap: the right sentence is accepted and no other, across every sentence of every passage", () => {
  const ev = exemplar.qs.find((q) => q.ev);
  assert.ok(F.isTapEvidence(ev, exemplar.paras));
  for (let p = 0; p < exemplar.paras.length; p++)
    for (const s of T.sentenceSpans(exemplar.paras[p])) {
      const right = F.checkEvidenceTap(ev, exemplar.paras, { para: p, sentence: s.index });
      const isEv =
        p === ev.ev.para &&
        exemplar.paras[p].includes(ev.ev.text) &&
        s.start <= exemplar.paras[p].indexOf(ev.ev.text) &&
        exemplar.paras[p].indexOf(ev.ev.text) < s.end;
      assert.equal(right, isEv, `paragraph ${p} sentence ${s.index}`);
    }
  let swept = 0;
  for (const unit of lessons) {
    const paras = unit.passage.paras;
    const pick = [0, paras.length - 1];
    for (const p of pick)
      for (const target of T.sentenceSpans(paras[p])) {
        const q = {
          id: "x",
          skill: "evidence",
          ev: { para: p, text: target.text.trim() },
          choices: ["a", "b"],
          a: 0,
          why: "w",
        };
        for (let pp = 0; pp < paras.length; pp++)
          for (const s of T.sentenceSpans(paras[pp])) {
            swept += 1;
            assert.equal(
              F.checkEvidenceTap(q, paras, { para: pp, sentence: s.index }),
              pp === p && s.index === target.index,
            );
          }
      }
  }
  assert.ok(swept > 5000);
  assert.equal(F.checkEvidenceTap({ ev: null }, exemplar.paras, { para: 0, sentence: 0 }), false);
  assert.equal(
    F.isTapEvidence({ ev: { para: 0, text: "Not in the text." } }, exemplar.paras),
    false,
  );
});

test("a miss never shows the reason or the right answer; a right answer earns the reason", () => {
  const all = [
    ...lessons.map((l) => I.normalizeReading(l.passage, { unit: l })),
    exemplar,
    ...lessons.map((l) => I.normalizeReading(synth(l), { unit: l, kind: "companion" })),
  ];
  let misses = 0;
  for (const r of all)
    for (const q of r.qs) {
      for (let i = 0; i < q.choices.length; i++) {
        const out = F.checkChoice(q, i);
        if (i === q.a) assert.deepEqual([out.ok, out.kind, out.why], [true, "right", q.why]);
        else {
          misses += 1;
          assert.equal(out.ok, false);
          assert.equal(out.why, undefined);
          const blob = JSON.stringify(out);
          assert.ok(
            !blob.includes(q.choices[q.a]) || q.choices[q.a].length < 4,
            "the right choice is not echoed",
          );
          assert.ok(!q.why || !blob.includes(q.why));
        }
      }
      if (q.ev) {
        const bad = F.checkEvidence(q, r.paras, { para: q.ev.para, sentence: 999 });
        assert.deepEqual([bad.ok, bad.why], [false, undefined]);
      }
    }
  assert.ok(misses > 1500);
});

test("passage questions get a paragraph for 'show me where', never the answer", () => {
  let n = 0;
  for (const l of lessons) {
    const r = I.normalizeReading(l.passage, { unit: l });
    assert.equal(r.qs.length, (l.passage.qs || []).length, "no playable question is dropped");
    for (const q of r.qs) {
      n += 1;
      assert.ok(Number.isInteger(q.para) && q.para >= 0 && q.para < r.paras.length);
    }
  }
  assert.ok(n > 400);
  assert.equal(I.inferPara(["a", "b", "c"], { q: 'In paragraph 2, the word "x" means' }), 1);
  assert.equal(I.normalizeReading({ paras: [] }), null);
  const bad = I.normalizeReading({
    id: "x",
    paras: ["A."],
    qs: [
      { q: "q", choices: ["a", "a"], a: 0 },
      { q: "q", choices: ["a", "b"], a: 5 },
      { q: "q", choices: ["a", "b"], a: 1 },
    ],
  });
  assert.equal(bad.qs.length, 1);
});

test("finishing records only first-try word-meaning and context results for a single named lesson word", () => {
  const words = g4u01.words;
  const ans = {
    "g4-u01-r1-q1": { first: true, right: true, tries: 1 },
    "g4-u01-r1-q2": { first: false, right: true, tries: 3 },
    "g4-u01-r1-q3": { first: true, right: true, tries: 1 },
    "g4-u01-r1-q4": { first: false, right: true, tries: 2 },
  };
  const plan = F.planResults(exemplar, words, ans);
  assert.deepEqual(plan, [{ wordId: "va.industrious.adj", dim: "mean", ok: true }]);
  const q4 = {
    ...exemplar,
    qs: [
      {
        ...exemplar.qs[3],
        q: "Which word from the reading describes a person who works hard? Industrious or outgoing?",
      },
    ],
  };
  assert.deepEqual(
    F.planResults(q4, words, { "g4-u01-r1-q4": { first: true } }),
    [],
    "two named words: nothing is guessed",
  );
  // The records are accepted by the learning model.
  const p = MODEL.blankProgress();
  for (const r of plan)
    MODEL.recordResult(p, { ...r, sup: [], type: "reading", unit: "g4-u01", grade: "4" });
  assert.equal(p.words["va.industrious.adj"].ev.mean.c, 1);
  const spot = F.spotSummary(["a", "b", "c"], ["a", "c", "z"]);
  assert.deepEqual(spot, { hit: 2, total: 3, extra: 1, missed: 1 });
});

test("reading state: bounded, cleaned, and a clean round-trips; the model keeps and merges it", () => {
  let s = M.blankReadingState();
  s = M.setMark(s, 0, 1, "imp");
  s = M.setMark(s, 0, 1, "q");
  assert.equal(M.markOf(s, 0, 1), "q", "one mark per sentence");
  s = M.setNote(s, 0, 1, "  I wonder why  ");
  assert.equal(M.noteOf(s, 0, 1), "I wonder why");
  s = M.setMark(s, 0, 1, "");
  assert.equal(M.markOf(s, 0, 1), "");
  assert.equal(M.noteOf(s, 0, 1), "I wonder why", "clearing a mark keeps the note");
  s = M.setNote(s, 0, 1, "");
  assert.equal(M.noteOf(s, 0, 1), "");
  s = M.noteAnswer(M.noteAnswer(s, "q1", false), "q1", true);
  assert.deepEqual(s.ans.q1, { first: false, right: true, tries: 2 });
  s = M.setRetell(M.setMark(s, 2, 0, "sur"), "x".repeat(5000));
  s = M.finishReading(s, "2026-11-23T10:00:00.000Z");
  const once = M.cleanReadingState(s);
  assert.deepEqual(
    M.cleanReadingState(JSON.parse(JSON.stringify(once))),
    once,
    "round-trip is stable",
  );
  assert.equal(once.retell.length, M.LIMITS.retellChars);
  assert.ok(once.done && once.at);

  const hostile = M.cleanReadingState({
    done: "yes",
    hl: [{ p: -1, s: 0, k: "imp" }, { p: 1, s: 1, k: "<b>" }, { p: 1, s: 1, k: "sur" }, 7, null],
    notes: [
      { p: 0, s: 0, t: "<img src=x onerror=1>".repeat(50) },
      { p: 0, s: 0, t: "dup" },
    ],
    spot: ["va.x.adj", "../bad", 5],
    ans: { __proto__: { first: true }, ok: { first: true, tries: 999 } },
    extra: 1,
  });
  assert.equal(hostile.done, false);
  assert.deepEqual(hostile.hl, [{ p: 1, s: 1, k: "sur" }]);
  assert.equal(hostile.notes.length, 1);
  assert.ok(hostile.notes[0].t.length <= M.LIMITS.noteChars);
  assert.deepEqual(hostile.spot, ["va.x.adj"]);
  assert.equal(hostile.ans.ok.tries, 20);
  assert.equal(hostile.extra, undefined);
  assert.equal(
    M.cleanReadingMap({ "g4-u01-p1": once, __proto__: once, "bad id!": once })["bad id!"],
    undefined,
  );

  const progress = { ...MODEL.blankProgress(), reading: { "g4-u01-r1": once } };
  const cleaned = MODEL.cleanProgress(JSON.parse(JSON.stringify(progress)));
  assert.deepEqual(
    cleaned.reading["g4-u01-r1"],
    once,
    "model.cleanProgress keeps the reader's state",
  );
  assert.equal(
    MODEL.cleanProgress(MODEL.blankProgress()).reading,
    undefined,
    "a blank record gains no reading key",
  );

  const other = {
    ...MODEL.blankProgress(),
    reading: {
      "g4-u01-r1": M.setMark(M.blankReadingState(), 3, 0, "imp"),
      "g4-u02-p1": M.finishReading(M.blankReadingState()),
    },
  };
  const merged = MODEL.mergeProgress(progress, other);
  assert.ok(merged.reading["g4-u01-r1"].done, "finished on either device stays finished");
  assert.ok(
    merged.reading["g4-u01-r1"].hl.some((h) => h.p === 3) &&
      merged.reading["g4-u01-r1"].hl.some((h) => h.p === 2),
    "marks from both devices stay",
  );
  assert.ok(merged.reading["g4-u02-p1"].done);
  assert.deepEqual(
    MODEL.mergeProgress(merged, other).reading,
    merged.reading,
    "importing twice changes nothing",
  );
});

test("reading ids and the library list model", () => {
  assert.deepEqual(I.parseReadingId("g4-u01-p1"), {
    id: "g4-u01-p1",
    grade: "4",
    n: 1,
    kind: "passage",
    num: 1,
    unitId: "g4-u01",
    label: ["Reading 1", "Lectura 1"],
  });
  assert.equal(I.parseReadingId("g4-u01-r1").kind, "companion");
  assert.equal(I.parseReadingId("g4-u01-r1").label[0], "Reading 2");
  assert.equal(I.parseReadingId("gK-u12-p1").grade, "K");
  for (const bad of ["g9-u01-p1", "g4-u00-p1", "g4-u01-x1", "g4-u01", "", null, "../g4-u01-p1"])
    assert.equal(I.parseReadingId(bad), null, String(bad));
  assert.equal(I.readingId("K", 3, "companion"), "gK-u03-r1");
  assert.equal(I.siblingId("g4-u01-p1"), "g4-u01-r1");
  for (const l of lessons) assert.ok(I.parseReadingId(I.readingId(l.grade, l.n, "passage")), l.id);

  const units = [
    {
      u: 1,
      lessons: [
        { id: "g4-u01", n: 1, title: "Traits", published: true, words: [{ hw: "ambitious" }] },
        { id: "g4-u02", n: 2, title: "Later", published: false, words: [] },
      ],
    },
  ];
  const rows = I.lessonRows({
    grade: "4",
    units,
    passages: { "g4-u01": { genre: "narrative", title: "Garden", words: [] } },
    companions: { "g4-u01": { genre: "informational", title: "Teams", words: [] } },
  });
  assert.equal(rows.length, 1, "unpublished lessons are not listed");
  assert.deepEqual(
    rows[0].readings.map((r) => r.id),
    ["g4-u01-p1", "g4-u01-r1"],
  );
  const onlyPass = I.lessonRows({
    grade: "4",
    units,
    passages: { "g4-u01": { genre: "narrative", title: "Garden" } },
    companions: {},
  });
  assert.deepEqual(
    onlyPass[0].readings.map((r) => r.id),
    ["g4-u01-p1"],
    "a missing companion is simply not listed",
  );
  assert.equal(I.filterRows(rows, { genre: "informational" })[0].readings.length, 1);
  assert.equal(I.filterRows(rows, { query: "ambitious" })[0].readings.length, 2);
  assert.equal(I.filterRows(rows, { query: "zzz" }).length, 0);
  assert.equal(
    I.filterRows(rows, { onlyUnfinished: true, done: { "g4-u01-p1": true } })[0].readings[0].id,
    "g4-u01-r1",
  );
  const groups = I.groupRows([...rows, { ...rows[0], grade: "2", u: 1, n: 1 }]);
  assert.deepEqual(
    groups.map((g) => g.grade),
    ["2", "4"],
  );
  assert.deepEqual(I.genresOf(rows), ["informational", "narrative"]);
});

test("every synthesised companion is playable and its clues pass the clue check", () => {
  let clues = 0;
  for (const l of lessons) {
    const r = I.normalizeReading(synth(l), { unit: l, kind: "companion" });
    assert.ok(r && r.qs.length >= 1);
    for (const [i, c] of r.clues.entries()) {
      clues += 1;
      const span = C.clueSpan(r.paras, c);
      assert.ok(span, `${l.id} clue ${i}`);
      const first = T.tokenSpans(r.paras[c.para]).find((t) => t.start >= span.start);
      assert.equal(
        C.findClueAt(r.paras, r.clues, c.word, { para: c.para, charIndex: first.start }),
        i,
      );
    }
  }
  assert.ok(clues > 100);
});

test("no timer, no countdown and no score language anywhere in the reader's code", () => {
  const dir = new URL("reading/", VA);
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".js"))) {
    const code = readFileSync(new URL(f, dir), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\s\/\/ .*$/gm, "");
    assert.ok(
      !/setInterval|requestAnimationFrame|countdown|timeLeft|secondsLeft|beat the clock|\bscore\b/i.test(
        code,
      ),
      `${f} has no timer or score`,
    );
    assert.ok(!/\bDate\.now\(\)\s*-/.test(code), `${f} measures no elapsed time`);
  }
  assert.ok(existsSync(new URL("reading/text.js", VA)));
});
