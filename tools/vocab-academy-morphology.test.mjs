// Vocabulary Academy — Word Study / morphology dataset and engine tests (SPEC §3.4, §10).
// Run: node tools/vocab-academy-morphology.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const ROOT = new URL("../access-practice-lab/", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, ROOT), "utf8"));
const data = read("content/vocab-academy/morphology.json");
const W = await import(new URL("src/vocab-academy/wordstudy/index.js", ROOT));
const M = await import(new URL("src/vocab-academy/wordstudy/model.js", ROOT));
const Items = await import(new URL("src/vocab-academy/wordstudy/items.js", ROOT));
W.setMorphDataset(data);
const idx = W.getIndex();
const partIds = new Set(data.parts.map((p) => p.id));
const isBase = (id) => id.startsWith("base:");
const GRADES = ["K", "1", "2", "3", "4", "5", "6", "7", "8"];

test("dataset has the documented shape and counts", () => {
  assert.equal(data.schema, 1);
  assert.ok(data.idScheme && typeof data.idScheme === "object", "idScheme header");
  for (const k of ["parts", "derivations", "families", "compounds", "inflections", "falseFriends"])
    assert.ok(Array.isArray(data[k]) && data[k].length, k);
  assert.ok(data.parts.length >= 70, `parts ${data.parts.length}`);
  assert.ok(data.derivations.length >= 450, `derivations ${data.derivations.length}`);
  assert.ok(data.families.length >= 40, `families ${data.families.length}`);
  assert.ok(data.compounds.length >= 100, `compounds ${data.compounds.length}`);
  assert.ok(data.falseFriends.length >= 15, `falseFriends ${data.falseFriends.length}`);
  console.log(
    `  counts: parts ${data.parts.length} (${data.parts.filter((p) => !p.variantOf).length} primary), derivations ${data.derivations.length}, families ${data.families.length}, compounds ${data.compounds.length}, inflection rules ${data.inflections.length}, falseFriends ${data.falseFriends.length}`,
  );
});

test("parts: unique ids, valid type, grades, origin_certain=false carries a note, variants resolve", () => {
  assert.equal(partIds.size, data.parts.length, "duplicate part id");
  for (const p of data.parts) {
    assert.match(p.id, /^(pre|suf|root)\.[a-z]+(\.[a-z]+)?$/, p.id);
    assert.ok(["prefix", "suffix", "root", "base"].includes(p.type), p.id);
    assert.ok(p.form && p.meaning && p.origin, p.id);
    assert.equal(typeof p.origin_certain, "boolean", p.id);
    if (!p.origin_certain)
      assert.ok(String(p.notes || "").trim().length > 20, `${p.id}: uncertain origin needs a note`);
    assert.ok(
      Array.isArray(p.grades) && p.grades.length && p.grades.every((g) => GRADES.includes(g)),
      `${p.id} grades`,
    );
    if (p.variantOf) assert.ok(partIds.has(p.variantOf), `${p.id} variantOf`);
    if (p.type === "prefix") assert.ok(p.form.endsWith("-"), p.id);
    if (p.type === "suffix") assert.ok(p.form.startsWith("-"), p.id);
  }
});

test("derivations: parts exist, spelled pieces concatenate to the word, spelling changes are explained, no duplicates", () => {
  const seen = new Set();
  for (const d of data.derivations) {
    assert.match(d.word, /^[a-z]+$/, d.word);
    assert.ok(
      ["n", "v", "adj", "adv", "prep", "conj", "pron", "phr"].includes(d.pos),
      `${d.word} pos`,
    );
    assert.ok(d.gloss && d.gloss.length > 2, `${d.word} gloss`);
    assert.equal(typeof d.transparent, "boolean", d.word);
    const key = `${d.word}|${d.pos}`;
    assert.ok(!seen.has(key), `duplicate derivation ${key}`);
    seen.add(key);
    for (const id of d.parts)
      assert.ok(isBase(id) || partIds.has(id), `${d.word}: unknown part ${id}`);
    const canon = d.parts.map((id) =>
      isBase(id) ? id.slice(5) : data.parts.find((p) => p.id === id).form.replace(/-/g, ""),
    );
    const surf = d.surface || canon;
    assert.equal(surf.length, d.parts.length, `${d.word}: one surface piece per part`);
    assert.equal(surf.join(""), d.word, `${d.word}: ${surf.join("+")}`);
    if (d.surface)
      assert.ok(d.spell, `${d.word}: surface differs from the parts, so spell must say why`);
    else assert.ok(!d.spell, `${d.word}: spell without a spelling change`);
  }
  const words = data.derivations.map((d) => d.word);
  assert.equal(new Set(words).size, words.length, "a word appears twice");
});

test("compounds, inflection rules and false friends are well formed", () => {
  const cw = data.compounds.map((c) => c.word);
  assert.equal(new Set(cw).size, cw.length, "duplicate compound");
  for (const c of data.compounds) {
    assert.equal(c.parts.length, 2, c.word);
    assert.equal(c.parts.join(""), c.word, c.word);
    assert.ok(c.gloss.length > 3, c.word);
  }
  for (const r of data.inflections) {
    assert.ok(r.rule && r.examples.length >= 6, r.id);
    for (const e of r.examples) {
      assert.ok(e.base && e.form && e.base !== e.form, `${r.id} ${e.base}`);
      if (!["plural.irregular", "plural.ves"].includes(r.id) && r.kind !== "compare")
        assert.equal(M.inflectForm(e.base, r.kind), e.form, `${r.id}: ${e.base} -> ${e.form}`);
      if (r.kind === "compare")
        assert.equal(
          M.inflectForm(e.base, "compare", e.form.endsWith("est") ? "est" : "er"),
          e.form,
          `${r.id}: ${e.base}`,
        );
    }
  }
  for (const f of data.falseFriends) {
    assert.equal(f.lookalike.join(""), f.word, f.word);
    assert.ok(f.truth && f.tempting, f.word);
  }
});

test("families: 6 or more real words, each listed derivation contains the family anchor", () => {
  const byWord = new Map(data.derivations.map((d) => [d.word, d]));
  const ids = new Set();
  for (const f of data.families) {
    assert.ok(!ids.has(f.id), `duplicate family ${f.id}`);
    ids.add(f.id);
    assert.ok(f.words.length >= 6, `${f.id} has ${f.words.length}`);
    assert.equal(new Set(f.words).size, f.words.length, `${f.id} repeats a word`);
    for (const a of f.anchors) assert.ok(isBase(a) || partIds.has(a), `${f.id} anchor ${a}`);
    for (const w of f.words) {
      const d = byWord.get(w);
      assert.ok(d, `${f.id}: ${w} is not a derivation`);
      assert.ok(
        d.parts.some((id) => f.anchors.includes(id)),
        `${f.id}: ${w} lacks the anchor`,
      );
    }
  }
});

test("false friends are never segmented, by any entry point", () => {
  const inData = new Set([
    ...data.derivations.map((d) => d.word),
    ...data.compounds.map((c) => c.word),
  ]);
  for (const f of data.falseFriends) {
    assert.ok(!inData.has(f.word), `${f.word} is listed as a real derivation or compound`);
    for (const form of [f.word, f.word.toUpperCase(), `${f.word}s`, ` ${f.word} `]) {
      const a = W.analyzeWord(form);
      assert.equal(a.known, false, `${form} was segmented`);
      assert.equal(a.segments.length, 0, form);
    }
    assert.equal(W.analyzeWord(f.word).kind, "false-friend");
  }
});

test("analyzeWord: segments listed words, explains inflections, is honest about everything else", () => {
  const un = W.analyzeWord("unkind");
  assert.equal(un.known, true);
  assert.deepEqual(
    un.segments.map((s) => s.text),
    ["un", "kind"],
  );
  assert.match(un.gloss, /not kind/);
  const hap = W.analyzeWord("happiness");
  assert.deepEqual(
    hap.segments.map((s) => s.text),
    ["happi", "ness"],
  );
  assert.match(hap.spell, /y to i/);
  const infl = W.analyzeWord("unlocked");
  assert.equal(infl.kind, "inflection");
  assert.deepEqual(
    infl.segments.map((s) => s.text),
    ["un", "lock", "ed"],
  );
  assert.equal(W.analyzeWord("walking").known, true);
  for (const w of ["zzzx", "flibbertigibbet", "", "can't", "123", "sing", "bed"])
    assert.equal(W.analyzeWord(w).known, false, w);
  for (const d of data.derivations) assert.equal(W.analyzeWord(d.word).known, true, d.word);
  assert.equal(W.analyzeWord("kind").known, false, "a bare base word is not split");
  // before a dataset is loaded the API refuses rather than guesses
  W.resetMorphDataset();
  assert.equal(W.analyzeWord("unkind").known, false);
  assert.equal(W.analyzeWord("unkind").reason, "not-loaded");
  assert.deepEqual(W.buildableWords(["pre.un", "base:kind"]), []);
  W.setMorphDataset(data);
});

test("buildableWords and isRealDerivation only ever return listed derivations", () => {
  const listed = new Set(data.derivations.map((d) => d.word));
  const all = [...partIds, ...[...idx.bases].map((b) => `base:${b}`)];
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let n = 0; n < 300; n++) {
    const pick = Array.from(
      { length: 1 + Math.floor(rnd() * 8) },
      () => all[Math.floor(rnd() * all.length)],
    );
    for (const w of W.buildableWords(pick)) {
      assert.ok(listed.has(w), `${w} is not a derivation`);
      const d = data.derivations.find((x) => x.word === w);
      assert.ok(
        d.parts.every((id) => pick.includes(id)),
        `${w} uses a part that was not offered`,
      );
    }
  }
  assert.deepEqual(
    W.buildableWords(["pre.un", "base:kind", "suf.ness"]).sort(),
    ["unkind", "kindness", "unkindness"].sort(),
  );
  assert.deepEqual(W.buildableWords([]), []);
  for (const d of data.derivations) {
    assert.equal(W.isRealDerivation(d.parts), true, d.word);
    assert.ok(W.buildableWords(d.parts).includes(d.word), d.word);
  }
  assert.equal(W.isRealDerivation(["suf.ness", "pre.un", "base:kind"]), false, "order matters");
  assert.equal(W.isRealDerivation(["pre.re", "base:kind"]), false);
  assert.equal(W.isRealDerivation(["pre.un", "base:butt", "suf.er"]), false);
  assert.equal(W.isRealDerivation([]), false);
});

test("grade filtering: K sees only inflections, later parts arrive with their grade, derivations follow", () => {
  const ids = (g) => new Set(M.partsForGrade(idx, g).map((p) => p.id));
  assert.deepEqual([...ids("K")].sort(), ["suf.ed", "suf.ing", "suf.s"].sort());
  assert.ok(ids("1").has("pre.un") && !ids("1").has("pre.re"));
  assert.ok(ids("2").has("pre.re") && ids("2").has("suf.est"));
  assert.ok(ids("4").has("root.ject") && !ids("4").has("root.tele"));
  assert.ok(ids("8").has("root.cred"));
  for (const g of GRADES) {
    for (const d of M.derivationsForGrade(idx, g))
      for (const id of d.parts)
        if (!isBase(id)) assert.ok(ids(g).has(id), `${g}: ${d.word} needs ${id}`);
  }
  assert.ok(M.derivationsForGrade(idx, "K").length >= 5);
});

test("every unit file's affixes and every grade.json morphFocus part is in the dataset", () => {
  const dir = new URL("content/vocab-academy/", ROOT);
  const forms = new Set(
    data.parts.flatMap((p) => [
      p.form.replace(/-/g, ""),
      ...(p.alt || []).map((a) => a.replace(/-/g, "")),
    ]),
  );
  const missing = new Set();
  let units = 0;
  let checked = 0;
  for (const g of readdirSync(dir)) {
    const gdir = new URL(`${g}/`, dir);
    if (!existsSync(gdir) || !/^g/.test(g)) continue;
    const grade = new URL("grade.json", gdir);
    if (existsSync(grade)) {
      for (const u of JSON.parse(readFileSync(grade, "utf8")).units || []) {
        const focus = String(u.morphFocus || "");
        if (!focus || focus === "none") continue;
        for (const clause of focus.split("|")) {
          for (const m of clause.matchAll(/(?<![a-z])(-?[a-z]+-|-[a-z]+)(?![a-z])/g)) {
            checked++;
            if (!forms.has(m[1].replace(/-/g, ""))) missing.add(`${g} ${u.id} part ${m[1]}`);
          }
          const roots = clause.match(/\broots? ([^:;]+)/);
          if (roots)
            for (const t of roots[1]
              .replace(/\([^)]*\)/g, "")
              .split(/[\/\s,]+|\band\b/)
              .filter(Boolean)) {
              checked++;
              if (!forms.has(t)) missing.add(`${g} ${u.id} root ${t}`);
            }
        }
      }
    }
    for (const f of readdirSync(gdir)) {
      if (!/^u\d+\.json$/.test(f)) continue;
      units++;
      const unit = JSON.parse(readFileSync(new URL(f, gdir), "utf8"));
      for (const w of unit.words || [])
        for (const s of w.morph?.segs || [])
          if (s.t === "prefix" || s.t === "suffix") {
            checked++;
            if (!forms.has(String(s.s).replace(/-/g, "")))
              missing.add(`${unit.id} ${w.hw}: ${s.t} ${s.s}`);
          }
    }
  }
  console.log(`  checked ${units} unit files, ${checked} part references`);
  assert.ok(checked > 150, "the scope check must actually look at parts");
  assert.deepEqual(
    [...missing],
    [],
    "parts used by the scope or units but absent from morphology.json",
  );
});

test("practice items: deterministic, one correct answer, distinct choices, never random strings", () => {
  const makers = {
    apart: (g, s) => Items.apartItem(idx, g, s),
    predict: (g, s) => Items.predictItem(idx, g, s),
    origin: (g, s) => Items.originItem(idx, g, s),
    shift: (g, s) => Items.shiftItem(idx, s, g),
    family: (g, s) => Items.familyItem(idx, g, s),
    compound: (_g, s) => Items.compoundItem(idx, s),
    infl: (_g, s) => Items.inflectionItem(idx, s),
  };
  for (const [name, make] of Object.entries(makers)) {
    for (const g of ["2", "5", "8"]) {
      for (let s = 0; s < 60; s++) {
        const a = make(g, s);
        const b = make(g, s);
        assert.deepEqual(a, b, `${name} is not deterministic`);
        if (!a) continue;
        const texts = a.choices.map((c) => c.text);
        assert.equal(new Set(texts).size, texts.length, `${name} ${a.id}: duplicate choices`);
        assert.equal(a.choices.filter((c) => c.id === a.answer).length, 1, `${name} ${a.id}`);
        assert.ok(a.choices.length >= 2 && a.explain && a.hint, `${name} ${a.id}`);
      }
    }
  }
  // the correct answers are the dataset's, not invented
  for (let s = 0; s < 80; s++) {
    const a = Items.apartItem(idx, "8", s);
    const right = a.choices.find((c) => c.id === a.answer).text.replace(/ \+ /g, "");
    assert.equal(right, a.word);
    const p = Items.predictItem(idx, "8", s);
    if (p) assert.equal(p.choices.find((c) => c.id === p.answer).text, p.derivation.gloss);
  }
});

test("Build a Word: a real combination succeeds, the right parts in the wrong order get a kind note, an unknown one never claims a word", () => {
  const kit = Items.buildKit(idx, "5", "base:kind", "t");
  assert.equal(Items.evaluateBuild(idx, kit, ["pre.un", "base:kind"]).ok, true);
  const order = Items.evaluateBuild(idx, kit, ["base:kind", "pre.un"]);
  assert.equal(order.ok, false);
  assert.equal(order.reason, "order");
  const unknown = Items.evaluateBuild(idx, kit, ["pre.un", "base:kind", "suf.ish"]);
  assert.equal(unknown.ok, false);
  assert.ok(
    unknown.nearby && data.derivations.some((d) => d.word === unknown.nearby.word),
    "the nearby suggestion is a real listed word",
  );
  assert.equal(Items.evaluateBuild(idx, kit, ["base:kind"]).reason, "short");
  // every kit offers every part its own words need, so no real word is unbuildable
  for (const grade of ["3", "6", "8"])
    for (const k of M.kitsForGrade(idx, grade)) {
      const built = Items.buildKit(idx, grade, k.anchor);
      for (const d of built.derivs)
        for (const id of d.parts)
          assert.ok(built.tiles.includes(id), `${grade} ${k.anchor}: ${d.word} needs ${id}`);
    }
});
