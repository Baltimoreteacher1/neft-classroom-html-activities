// Word Architect content and model (access-practice-lab/src/vocab-academy/wordstudy/architect-*.js).
// Every combination a learner can build is classified exactly once; every word is the join of its parts; every entry
// carries English and Spanish; parts of speech are valid; the data agrees with morphology.json where they overlap.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const BASE = new URL("../access-practice-lab/src/vocab-academy/wordstudy/", import.meta.url);
const { AFFIXES, FRAMES, POS, ROOTS, SLOT_ADJ, SLOT_NOUN, VERB_CUE } = await import(
  new URL("architect-data.js", BASE)
);
const M = await import(new URL("architect-model.js", BASE));
const morph = JSON.parse(
  readFileSync(
    new URL("../access-practice-lab/content/vocab-academy/morphology.json", import.meta.url),
    "utf8",
  ),
);

const bi = (o, label) => {
  assert.ok(o && typeof o.en === "string" && o.en.trim(), `${label}: English missing`);
  assert.ok(typeof o.es === "string" && o.es.trim(), `${label}: Spanish missing`);
};
const MORPH_POS = { n: "noun", v: "verb", adj: "adjective" };

test("at least 4 roots, each with 4 or more real words", () => {
  assert.ok(ROOTS.length >= 4);
  for (const r of ROOTS) assert.ok(r.words.length >= 4, `${r.id} has ${r.words.length} words`);
  assert.equal(new Set(ROOTS.map((r) => r.id)).size, ROOTS.length);
});

test("every tile combination is classified exactly once, never left to a guess", () => {
  for (const r of ROOTS) {
    for (const [p, s] of M.combos(r)) {
      const hits = [...r.words, ...r.rare, ...r.nonwords].filter((e) => e.p === p && e.s === s);
      const bare = !p && !s && r.rootAlone ? 1 : 0;
      assert.equal(
        hits.length + bare,
        1,
        `${r.id}: ${p || "-"}+${r.form}+${s || "-"} classified ${hits.length + bare} times`,
      );
      assert.notEqual(M.classify(r, p, s).kind, "unlisted");
    }
    for (const e of [...r.words, ...r.rare, ...r.nonwords]) {
      assert.ok(
        e.p === "" || r.prefixes.includes(e.p),
        `${e.word}: prefix ${e.p} is not a tile of ${r.id}`,
      );
      assert.ok(
        e.s === "" || r.suffixes.includes(e.s),
        `${e.word}: suffix ${e.s} is not a tile of ${r.id}`,
      );
    }
  }
});

test("every word, rare word and non-word is the plain join of its parts", () => {
  for (const r of ROOTS)
    for (const e of [...r.words, ...r.rare, ...r.nonwords]) {
      const pieces = M.pieces(r, e.p, e.s).map((x) => x.text);
      assert.equal(pieces.join(""), e.word, `${pieces.join(" + ")} should spell ${e.word}`);
    }
});

test("the ex + s spelling rule is applied and stated", () => {
  const spect = M.rootById("spect");
  assert.equal(M.joined(spect, "ex", ""), "expect");
  assert.ok(M.spellingRule(spect, "ex"));
  assert.equal(M.spellingRule(spect, "in"), null);
  assert.equal(M.joined(M.rootById("port"), "ex", ""), "export");
});

test("tiles: forms, meanings and the part of speech a suffix makes", () => {
  for (const [id, a] of Object.entries(AFFIXES)) {
    assert.ok(["prefix", "suffix"].includes(a.type), id);
    assert.equal(M.partText(id), id, `${a.form} spells ${id}`);
    assert.match(a.form, a.type === "prefix" ? /^[a-z]+-$/ : /^-[a-z]+$/);
    bi(a.mean, a.form);
    if (a.type === "suffix") assert.ok(POS[a.makes], `${a.form} makes a known part of speech`);
  }
  for (const r of ROOTS)
    for (const id of [...r.prefixes, ...r.suffixes])
      assert.ok(AFFIXES[id], `${r.id}: unknown tile ${id}`);
});

test("every word has a valid part of speech and complete English + Spanish fields", () => {
  for (const r of ROOTS) {
    bi(r.mean, `${r.id} meaning`);
    bi(r.verbSlot, `${r.id} verb slot`);
    assert.ok(r.verbSlot.en.includes("to ___"), `${r.id}: the verb slot follows "to"`);
    if (r.rootAlone) bi(r.rootAlone, `${r.id} rootAlone`);
    for (const e of r.words) {
      assert.ok(POS[e.pos], `${e.word}: pos ${e.pos}`);
      for (const p of e.also || []) assert.ok(POS[p] && p !== e.pos, `${e.word}: also ${p}`);
      for (const f of ["def", "how", "ex"]) {
        bi(e[f], `${e.word}.${f}`);
        assert.notEqual(e[f].en, e[f].es, `${e.word}.${f}: Spanish is a copy of the English`);
      }
      assert.ok(e.ex.en.toLowerCase().includes(e.word), `${e.word}: the example uses the word`);
      assert.ok(
        !e.def.en.toLowerCase().split(/\W+/).includes(e.word),
        `${e.word}: the definition does not use the word itself`,
      );
      assert.ok(typeof e.es.word === "string" && e.es.word.trim(), `${e.word}: Spanish word`);
      assert.equal(typeof e.es.cognate, "boolean", `${e.word}: cognate flag`);
      if (e.es.note) bi(e.es.note, `${e.word} Spanish note`);
      if (e.s && AFFIXES[e.s].makes)
        assert.equal(
          e.pos,
          AFFIXES[e.s].makes,
          `${e.word}: ${AFFIXES[e.s].form} makes a ${AFFIXES[e.s].makes}`,
        );
    }
    for (const e of [...r.rare, ...r.nonwords]) bi(e.why, `${e.word} why`);
  }
  for (const k of Object.keys(POS)) bi(FRAMES[k], `frame ${k}`);
  for (const s of [SLOT_NOUN, SLOT_ADJ]) {
    bi(s, "slot");
    bi(s.cue, "slot cue");
  }
  bi(VERB_CUE, "verb cue");
});

test("each root's grammar slots can each be filled by at least one of its words, or say why", () => {
  for (const r of ROOTS) {
    const filled = new Set(r.words.flatMap(M.posList));
    assert.ok(
      filled.has("verb") && filled.has("noun"),
      `${r.id}: needs a verb and a noun so the slots teach the shift`,
    );
  }
});

test("meaning-from-parts items: parts spell the word, one answer, bilingual choices", () => {
  for (const r of ROOTS) {
    const t = r.transfer;
    assert.equal(
      t.parts.map((p) => p.form.replace(/-/g, "")).join(""),
      t.word,
      `${r.id}: transfer parts spell ${t.word}`,
    );
    assert.ok(
      !r.words.some((w) => w.word === t.word),
      `${t.word} must be unfamiliar, not a word built on the bench`,
    );
    assert.ok(
      t.parts.some((p) => p.type === "root" && p.form === r.form),
      `${t.word} reuses the root ${r.form}`,
    );
    for (const p of t.parts) bi(p.mean, `${t.word} part ${p.form}`);
    assert.equal(t.choices.filter((c) => c.id === t.answer).length, 1);
    assert.equal(new Set(t.choices.map((c) => c.id)).size, t.choices.length);
    for (const c of t.choices) bi(c, `${t.word} choice ${c.id}`);
    assert.ok(t.es);
  }
  const positions = ROOTS.map((r) =>
    r.transfer.choices.findIndex((c) => c.id === r.transfer.answer),
  );
  assert.ok(new Set(positions).size >= 3, "the right answer does not sit in one position");
});

test("agrees with morphology.json wherever both list a word", () => {
  const partIds = new Set(morph.parts.map((p) => p.id));
  for (const a of Object.values(AFFIXES))
    assert.ok(partIds.has(a.morph), `${a.form}: ${a.morph} is in morphology.json`);
  const nonwords = new Set(ROOTS.flatMap((r) => r.nonwords.map((n) => n.word)));
  let compared = 0;
  for (const r of ROOTS) {
    assert.ok(partIds.has(r.morph), `${r.morph} is in morphology.json`);
    for (const e of r.words) {
      const d = morph.derivations.find((x) => x.word === e.word && x.parts.includes(r.morph));
      if (!d) continue;
      compared += 1;
      const ours = [e.p && AFFIXES[e.p].morph, r.morph, e.s && AFFIXES[e.s].morph].filter(Boolean);
      assert.deepEqual(d.parts, ours, `${e.word}: parts agree with morphology.json`);
      assert.equal(
        MORPH_POS[d.pos],
        e.pos,
        `${e.word}: part of speech agrees with morphology.json`,
      );
      if (d.surface)
        assert.deepEqual(
          M.pieces(r, e.p, e.s).map((x) => x.text),
          d.surface,
          `${e.word}: spelled pieces agree with morphology.json`,
        );
    }
  }
  assert.ok(compared >= 20, `compared ${compared} words with morphology.json`);
  for (const d of morph.derivations)
    assert.ok(!nonwords.has(d.word), `${d.word} is listed as a real word in morphology.json`);
});

test("progress normalizes whatever was stored", () => {
  const clean = M.normalizeProgress(null);
  assert.equal(clean.v, 1);
  assert.equal(clean.root, ROOTS[0].id);
  const odd = M.normalizeProgress({
    root: "nope",
    built: { port: ["transport", "transport", 4], fake: ["x"] },
    sentences: { transport: "Trucks transport food.", "<b>": "x" },
    transfer: { port: true, zzz: true },
  });
  assert.deepEqual(odd.built, { port: ["transport"] });
  assert.deepEqual(Object.keys(odd.sentences), ["transport"]);
  assert.deepEqual(odd.transfer, { port: true });
  assert.equal(M.normalizeProgress([1, 2]).root, ROOTS[0].id);
  assert.equal(M.ARCH_KEY, "accessPracticeLab:v1:wordArchitect");
});
