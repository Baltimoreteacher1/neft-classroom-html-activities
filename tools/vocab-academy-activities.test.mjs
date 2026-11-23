// Vocabulary Academy — activity engine, art and review-session tests (SPEC §6, §10). Pure: no DOM, no network.
// Sweeps every activity type over the reference unit and every real unit file present under content/vocab-academy.
// Run: node tools/vocab-academy-activities.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const LAB = new URL("access-practice-lab/src/vocab-academy/", ROOT);
const act = await import(new URL("activities/index.js", LAB));
const core = await import(new URL("activities/core.js", LAB));
const art = await import(new URL("art.js", LAB));
const session = await import(new URL("session.js", LAB));
const model = await import(new URL("model.js", LAB));
const { makeI18n } = await import(new URL("../i18n.js", LAB));
const { toHtml } = await import(new URL("../util.js", LAB));

const json = (url) => JSON.parse(readFileSync(url, "utf8"));
const reference = json(new URL("docs/vocab-academy/reference-unit.json", ROOT));
const CONTENT = new URL("access-practice-lab/content/vocab-academy/", ROOT);
const real = [];
for (const g of existsSync(CONTENT) ? readdirSync(CONTENT) : [])
  if (/^g(K|\d+)$/.test(g))
    for (const f of readdirSync(new URL(`${g}/`, CONTENT)))
      if (/^u\d+\.json$/.test(f)) {
        try {
          real.push(json(new URL(`${g}/${f}`, CONTENT)));
        } catch {
          /* a unit still being written is the content agents' to fix, not an activity fault */
        }
      }
const units = [reference, ...real.filter((u) => Array.isArray(u.words) && u.words.length)];
const I = makeI18n("en");
const norm = core.norm;
const wordOf = (unit, it) => unit.words.find((w) => w.id === it.wordId);
const answerOf = (it) => core.answerText(it);

// Build everything once; each assertion below walks this table.
const built = [];
for (const unit of units)
  for (const t of act.ACTIVITY_TYPES)
    for (const band of ["early", "upper-elem", "middle"]) {
      const grade = band === "early" ? "1" : band === "upper-elem" ? "4" : "7";
      // The unit's own grade is the real case; the other bands are a "force" sweep so every type is exercised everywhere.
      if (
        band !== core.normCtx({ grade: unit.grade }).band &&
        ["early", "middle"].includes(band) === false
      )
        continue;
      const items = act.buildItems(t.id, unit, { grade, band, force: true });
      built.push({ unit, t, band, items });
    }

test("registry: spec shape and coverage of the required activity families", () => {
  assert.ok(act.ACTIVITY_TYPES.length >= 45, `${act.ACTIVITY_TYPES.length} types`);
  const ids = new Set(act.ACTIVITY_TYPES.map((t) => t.id));
  assert.equal(ids.size, act.ACTIVITY_TYPES.length, "duplicate type id");
  for (const t of act.ACTIVITY_TYPES) {
    assert.ok(
      t.id &&
        t.label &&
        Array.isArray(t.dims) &&
        Array.isArray(t.bands) &&
        t.bands.length &&
        t.domain,
      t.id,
    );
    assert.equal(typeof t.build, "function");
    assert.equal(typeof t.grade, "function");
  }
  for (const need of [
    "meaning-mc",
    "word-for-def",
    "match-def",
    "match-image",
    "identify-example",
    "identify-nonexample",
    "context-mc",
    "word-sort",
    "best-word",
    "detect-misuse",
    "synonym-mc",
    "antonym-mc",
    "shades",
    "multiple-meanings",
    "context-clues",
    "analogy",
    "precise-word",
    "prefix-id",
    "suffix-id",
    "root-analysis",
    "word-family",
    "build-a-word",
    "sentence-complete",
    "sentence-create",
    "sentence-combine",
    "sentence-expand",
    "rewrite-precise",
    "short-response",
    "paragraph-response",
    "discussion-prompt",
    "argument-vocab",
    "passage-comprehension",
    "evidence-select",
    "vocab-literary",
    "vocab-informational",
    "hear-identify",
    "listen-respond",
    "picture-describe",
    "oral-cloze",
    "conversation-use",
    "explain-in-context",
    "oral-explain",
  ])
    assert.ok(ids.has(need), `missing type ${need}`);
  for (const d of ["rec", "mean", "ctx", "morph", "prod"])
    assert.ok(
      act.ACTIVITY_TYPES.some((t) => t.dim === d),
      `no type for ${d}`,
    );
  for (const dom of ["listening", "speaking", "reading", "writing"])
    assert.ok(
      act.ACTIVITY_TYPES.some((t) => t.domain === dom),
      dom,
    );
});

test("units under test", () => {
  assert.ok(units.length >= 1);
  console.log(
    `  swept ${units.length} unit file(s) (${real.length} real + reference), ${built.reduce((n, b) => n + b.items.length, 0)} items`,
  );
});

test("every item has the contract shape, unique ids, in-range answers and distinct choices", () => {
  for (const { unit, t, items } of built) {
    const seen = new Set();
    for (const it of items) {
      const where = `${unit.id} ${t.id} ${it.id}`;
      assert.ok(!seen.has(it.id), `duplicate id ${where}`);
      seen.add(it.id);
      assert.equal(it.type, t.id, where);
      assert.ok(
        core.DIMS_OK ?? ["rec", "mean", "ctx", "morph", "prod", "delay"].includes(it.dim),
        where,
      );
      assert.ok(typeof it.prompt === "string" && it.prompt, `prompt ${where}`);
      assert.ok(typeof it.explain === "string" && it.explain.length > 5, `explain ${where}`);
      assert.ok(typeof it.hint === "string" && it.hint.length > 5, `hint ${where}`);
      assert.ok(it.stem !== undefined, `stem ${where}`);
      if (it.wordId)
        assert.ok(
          unit.words.some((w) => w.id === it.wordId),
          `unknown wordId ${where}`,
        );
      const distinct = (arr) =>
        assert.equal(
          new Set(arr.map(norm)).size,
          arr.length,
          `choices not distinct ${where}: ${arr}`,
        );
      switch (it.mode) {
        case "choice":
          assert.ok(it.choices.length >= 2 && it.choices.length <= 6, where);
          distinct(it.choices);
          assert.ok(
            Number.isInteger(it.answer) && it.answer >= 0 && it.answer < it.choices.length,
            `answer ${where}`,
          );
          break;
        case "steps":
          assert.equal(it.steps.length, 2);
          for (const s of it.steps) {
            distinct(s.choices);
            assert.ok(
              Number.isInteger(s.answer) && s.answer >= 0 && s.answer < s.choices.length,
              where,
            );
          }
          break;
        case "match":
          distinct(it.choices);
          assert.equal(it.answer.length, it.items.length);
          assert.equal(
            new Set(it.answer).size,
            it.answer.length,
            `two words share one meaning ${where}`,
          );
          assert.ok(
            it.answer.every((a) => a >= 0 && a < it.choices.length),
            where,
          );
          break;
        case "sort":
          assert.equal(it.answer.length, it.items.length);
          assert.ok(
            it.answer.every((a) => a >= 0 && a < it.choices.length),
            where,
          );
          assert.ok(new Set(it.answer).size >= 2, `sort uses one group only ${where}`);
          break;
        case "order":
          assert.deepEqual([...it.choices].sort(), [...it.answer].sort(), where);
          assert.notDeepEqual(it.choices, it.answer, `order starts solved ${where}`);
          break;
        case "build":
          for (const a of it.answer) assert.ok(it.choices.includes(a), `tile missing ${where}`);
          assert.notDeepEqual(it.choices, it.answer, `build starts solved ${where}`);
          break;
        case "typed":
          assert.ok(it.answer.length && it.answer.every(Boolean), where);
          assert.ok(it.bank.includes(it.answer[0]), `bank lacks answer ${where}`);
          break;
        case "write":
          assert.ok(it.spec && it.spec.minWords >= 1, where);
          break;
        case "speak":
          assert.ok(it.checklist?.length >= 2, where);
          break;
        default:
          assert.fail(`unknown mode ${it.mode} ${where}`);
      }
    }
  }
});

test("exactly one correct answer: grading accepts the key and rejects every other pick", () => {
  let checked = 0;
  for (const { unit, t, items } of built) {
    for (const it of items) {
      const where = `${unit.id} ${t.id} ${it.id}`;
      if (it.mode === "choice") {
        it.choices.forEach((_, i) =>
          assert.equal(act.gradeItem(it, i).ok, i === it.answer, `${where} pick ${i}`),
        );
        checked++;
      } else if (it.mode === "steps") {
        assert.equal(
          act.gradeItem(
            it,
            it.steps.map((s) => s.answer),
          ).ok,
          true,
          where,
        );
        assert.equal(
          act.gradeItem(
            it,
            it.steps.map((s) => (s.answer + 1) % s.choices.length),
          ).ok,
          false,
          where,
        );
        checked++;
      } else if (it.mode === "typed") {
        assert.equal(act.gradeItem(it, it.answer[0].toUpperCase()).ok, true, where);
        assert.equal(act.gradeItem(it, "zzzzzz").ok, false, where);
        checked++;
      } else if (it.mode === "order" || it.mode === "build") {
        assert.equal(act.gradeItem(it, it.answer).ok, true, where);
        assert.equal(
          act.gradeItem(it, [...it.answer].reverse()).ok,
          it.answer.length < 2 || [...it.answer].reverse().join() === it.answer.join(),
          where,
        );
        checked++;
      } else if (it.mode === "sort" || it.mode === "match") {
        const key = Object.fromEntries(
          (it.mode === "sort" ? it.items.map((x) => x.a) : it.answer).map((a, i) => [i, a]),
        );
        assert.equal(act.gradeItem(it, key).ok, true, where);
        const bad = { ...key, 0: (key[0] + 1) % it.choices.length };
        assert.equal(act.gradeItem(it, bad).ok, false, where);
        checked++;
      }
    }
  }
  assert.ok(checked > 100, `only ${checked} graded`);
});

test("deterministic: same unit, ctx and salt give identical items; a new salt gives a different set", () => {
  for (const unit of units.slice(0, 6))
    for (const t of act.ACTIVITY_TYPES) {
      const a = act.buildItems(t.id, unit, { grade: unit.grade, force: true });
      const b = act.buildItems(t.id, unit, { grade: unit.grade, force: true });
      assert.deepEqual(a, b, `${unit.id} ${t.id}`);
    }
  const u = reference;
  const x = JSON.stringify(act.buildItems("meaning-mc", u, { grade: "6", salt: "a" }));
  const y = JSON.stringify(act.buildItems("meaning-mc", u, { grade: "6", salt: "b" }));
  assert.notEqual(x, y);
});

test("antonym items exist only for words that carry ant, and the key is one of them", () => {
  let n = 0;
  for (const { unit, t, items } of built) {
    if (t.id === "antonym-mc") {
      for (const it of items) {
        const w = wordOf(unit, it);
        assert.ok(w?.ant?.length, `${unit.id} antonym item for ${it.wordId} without ant`);
        assert.ok(w.ant.includes(answerOf(it)), `${unit.id} key ${answerOf(it)} not in ant`);
        n++;
      }
      const withAnt = unit.words.filter((w) => w.ant?.length).length;
      assert.ok(items.length <= withAnt, `${unit.id} more antonym items than words with ant`);
    }
    if (t.id === "word-relationships")
      for (const it of items) {
        const w = wordOf(unit, it);
        if (/opposite/i.test(answerOf(it)))
          assert.ok(w.ant?.length, `${unit.id} opposite relationship without ant`);
        if (/almost the same/i.test(answerOf(it)))
          assert.ok(w.syn?.length, `${unit.id} same relationship without syn`);
      }
    // an opposite word may never be offered as a "same meaning" answer
    if (t.id === "synonym-mc")
      for (const it of items) {
        const w = wordOf(unit, it);
        assert.ok(w.syn.includes(answerOf(it)), "synonym key not in syn");
        assert.ok(!(w.ant || []).includes(answerOf(it)), "antonym keyed as synonym");
      }
  }
  assert.ok(
    n > 0 || units.every((u) => !u.words.some((w) => w.ant)),
    "no antonym items built although words have ant",
  );
});

test("multiple-meanings items exist only for words with senses", () => {
  for (const { unit, t, items } of built)
    if (t.id === "multiple-meanings")
      for (const it of items) assert.ok(wordOf(unit, it)?.senses?.length, `${unit.id} ${it.id}`);
});

test("cloze stems never contain their answer; definition stems never name the word", () => {
  const CLOZE_STEMS = new Set(["context-mc", "best-word", "sentence-complete", "oral-cloze"]);
  const LEAKY = [];
  for (const { unit, t, items } of built) {
    for (const it of items) {
      const w = wordOf(unit, it);
      if (CLOZE_STEMS.has(t.id)) {
        assert.ok(/___/.test(it.stem), `${unit.id} ${it.id}: cloze stem has no blank`);
        assert.equal((it.stem.match(/___/g) || []).length, 1, "one blank");
        if (w)
          assert.ok(
            !core.hasForm(it.stem.replace(/___/g, " "), w),
            `${unit.id} ${it.id}: stem contains the target word: ${it.stem}`,
          );
        const a = answerOf(it);
        if (a)
          assert.ok(
            !new RegExp(`\\b${core.escRe(a)}\\b`, "i").test(it.stem),
            `${unit.id} ${it.id}: stem contains the key`,
          );
      }
      if (["word-for-def", "hear-identify"].includes(t.id) && w)
        assert.ok(!core.hasForm(it.stem, w), `${unit.id} ${it.id}: definition names the word`);
      // generic leak check: a single-word key that appears as a whole word in the stem
      const a = it.mode === "choice" ? answerOf(it) : null;
      if (
        a &&
        /^[a-z]+$/i.test(a) &&
        a.length > 2 &&
        !["synonym-mc", "hear-judge"].includes(t.id) &&
        new RegExp(`\\b${core.escRe(a)}\\b`, "i").test(it.stem)
      )
        LEAKY.push(`${unit.id} ${it.id} key "${a}" in stem "${it.stem}"`);
    }
  }
  assert.deepEqual(LEAKY, [], `stems that leak the answer:\n${LEAKY.slice(0, 12).join("\n")}`);
});

test("choice positions vary: no type puts the key in one slot more than 70% of the time", () => {
  const byType = new Map();
  for (const { t, items, band } of built)
    if (band === "middle")
      for (const it of items)
        if (it.mode === "choice") {
          const m = byType.get(t.id) || { counts: Array(6).fill(0), n: 0 };
          m.counts[it.answer]++;
          m.n++;
          byType.set(t.id, m);
        }
  for (const [id, { counts, n }] of byType) {
    if (n < 12) continue;
    assert.ok(Math.max(...counts) / n <= 0.7, `${id}: key positions ${counts.join(",")} of ${n}`);
  }
});

test("pools are never empty: every unit supports a healthy spread of activity types", () => {
  for (const unit of units) {
    const ctx = { grade: unit.grade };
    const some = act.typesFor(unit, ctx);
    assert.ok(some.length >= 8, `${unit.id} only ${some.length} types: ${some}`);
    for (const id of ["meaning-mc", "word-for-def", "sentence-complete"]) {
      const n = act.buildItems(id, unit, ctx).length;
      assert.equal(n, unit.words.length, `${unit.id} ${id}: ${n} of ${unit.words.length} words`);
    }
  }
});

test("band variants differ: early gets 3 choices and picture-forward items, middle gets 4", () => {
  for (const unit of units.slice(0, 8)) {
    const e = act.buildItems("meaning-mc", unit, { grade: "1", band: "early", force: true });
    const m = act.buildItems("meaning-mc", unit, { grade: "7", band: "middle", force: true });
    assert.ok(e.length && m.length);
    assert.ok(
      e.every((it) => it.choices.length <= 3),
      `${unit.id} early choices`,
    );
    assert.ok(
      m.some((it) => it.choices.length === 4),
      `${unit.id} middle choices`,
    );
    assert.notDeepEqual(
      e.map((x) => x.choices),
      m.map((x) => x.choices),
    );
    assert.ok(
      e.every((it) => it.audio === true),
      "early items are read-aloud ready",
    );
    assert.ok(m.every((it) => !it.audio));
  }
  const ch = act.buildItems("meaning-mc", reference, {
    grade: "7",
    band: "middle",
    supports: { chunked: true },
  });
  assert.ok(
    ch.every((it) => it.choices.length <= 3),
    "chunked support reduces choices",
  );
});

test("grade ranges: types outside their grade range build nothing unless forced", () => {
  assert.equal(act.buildItems("analogy", reference, { grade: "2" }).length, 0);
  assert.ok(act.buildItems("analogy", reference, { grade: "6" }).length > 0);
  assert.equal(act.buildItems("paragraph-response", reference, { grade: "K" }).length, 0);
});

test("writing checks are transparent and never claim to judge meaning", () => {
  const unit = reference;
  const w = unit.words[0];
  const it = act.buildItems("sentence-create", unit, { grade: "6", onlyWords: [w.id] })[0];
  assert.equal(it.mode, "write");
  const short = act.gradeItem(it, "Cautious.");
  assert.equal(short.ok, false);
  assert.ok(short.review, "written responses are flagged for teacher review");
  const good = act.gradeItem(
    it,
    `The ${w.hw} student checked every answer carefully because the quiz was important to her.`,
  );
  assert.equal(good.review, true);
  assert.equal(act.gradeItem(it, "").empty, true);
  const text = JSON.stringify(good.feedback).toLowerCase();
  assert.ok(
    !/\b(correct meaning|good job|perfect|excellent|wrong meaning)\b/.test(text),
    "feedback must not grade meaning",
  );
  const any = act.gradeItem(
    { ...it, spec: { ...it.spec, anyLang: true } },
    "Es una persona que revisa todo con cuidado.",
  );
  assert.equal(any.ok, true, "any-language response skips the English word checks");
});

test("speaking items are self-checked and require the checklist, not a transcript", () => {
  const it = act.buildItems("oral-explain", reference, { grade: "6" })[0];
  assert.equal(it.mode, "speak");
  assert.equal(act.gradeItem(it, { checked: [], said: false }).ok, false);
  const ok = act.gradeItem(it, { checked: [0, 1], said: true });
  assert.equal(ok.ok, true);
  assert.equal(ok.selfReported, true);
  assert.equal(ok.review, true);
});

test("morphology: tolerates a missing dataset and uses morphology.json derivations when present", () => {
  act.setMorphology(null);
  const without = act.buildItems("analyze-unfamiliar", reference, { grade: "6" });
  assert.ok(Array.isArray(without));
  act.setMorphology({
    parts: [
      { id: "suf.ous", type: "suffix", form: "-ous", meaning: "full of" },
      { id: "suf.ful", type: "suffix", form: "-ful", meaning: "having" },
      { id: "suf.al", type: "suffix", form: "-al", meaning: "relating to" },
    ],
    derivations: [
      { word: "joyous", pos: "adj", parts: ["base:joy", "suf.ous"], gloss: "full of joy" },
      {
        word: "helpful",
        pos: "adj",
        parts: ["base:help", "suf.ful"],
        gloss: "having help to give",
      },
      { word: "musical", pos: "adj", parts: ["base:music", "suf.al"], gloss: "relating to music" },
    ],
    families: [],
  });
  const withData = act.buildItems("analyze-unfamiliar", reference, { grade: "6" });
  assert.ok(withData.length >= without.length);
  assert.ok(
    withData.some((x) => /joyous|helpful|musical/.test(x.stem)),
    "derivations were used",
  );
  act.setMorphology(null);
});

test("render: every item renders for every support combination without leaking its key", () => {
  const ALL = Object.fromEntries(
    [
      "picture",
      "audio",
      "glossaryEs",
      "frames",
      "wordBank",
      "model",
      "chunked",
      "rehearsal",
      "starters",
      "organizer",
      "readAloud",
      "anyLanguageResponse",
    ].map((k) => [k, true]),
  );
  let n = 0;
  for (const { unit, t, items, band } of built) {
    for (const it of items.slice(0, 4)) {
      for (const supports of [{}, ALL]) {
        const html = toHtml(act.renderItem(it, { I, band, supports, unit, grade: unit.grade }, {}));
        assert.ok(html.includes("data-vaa-item"), `${t.id} markup`);
        assert.ok(!/<script/i.test(html), "script injected");
        if (it.mode === "choice" || it.mode === "steps")
          assert.ok(/type="radio"/.test(html), `${t.id}: no radio group`);
        // a fresh item never prints its explanation (unless the passage or stem on screen already says the same words)
        const shown = [it.stem, ...(it.passage?.paras || [])].join(" ");
        const esc = (x) =>
          x
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
        if (it.explain.length > 25 && !shown.includes(it.explain))
          assert.ok(!html.includes(esc(it.explain)), `${t.id}: explanation shown before answering`);
        assert.ok(!/vaa-right|vaa-mark-ok/.test(html), `${t.id}: answer marked before checking`);
        n++;
      }
    }
  }
  assert.ok(n > 200);
});

test("feedback: a wrong answer prints neither the key nor the explanation; a right answer prints the explanation", () => {
  const it = act.buildItems("meaning-mc", reference, { grade: "6" })[0];
  const wrong = (it.answer + 1) % it.choices.length;
  const res = act.gradeItem(it, wrong);
  const fb = toHtml(act.feedbackHTML(it, { I }, { result: res, attempt: 1 }));
  assert.ok(/Not quite/.test(fb));
  assert.ok(
    !fb.includes(it.explain.slice(0, 20)) && !fb.includes(it.choices[it.answer].slice(0, 20)),
    "wrong answer revealed the key",
  );
  const okRes = act.gradeItem(it, it.answer);
  const ok = act.feedbackHTML(it, { I }, { result: okRes, attempt: 1, done: true });
  const text = toHtml(ok);
  assert.ok(/Correct/.test(text) && text.includes(it.explain.slice(0, 20)));
  assert.ok(/✓/.test(text), "icon with the text");
});

test("art: scenes and diagrams carry alt text; no-picture words get a calm card", () => {
  const rawOf = (r) => toHtml(r);
  for (const unit of units)
    for (const w of unit.words) {
      const out = rawOf(art.visualHTML(w, { size: "md", I }));
      if (!w.visual || w.visual.kind === "none") assert.ok(/vaa-pic-none/.test(out), w.id);
      else {
        assert.ok(/role="img"/.test(out), `${w.id} role`);
        assert.ok(
          out.includes(
            w.visual.alt.replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/"/g, "&quot;"),
          ) || out.includes("aria-label"),
          `${w.id} alt`,
        );
        assert.ok(!/<script/i.test(out));
        if (w.visual.kind === "scene")
          assert.ok(/aria-hidden="true"/.test(out), "glyphs hidden from screen readers");
      }
      const card = rawOf(
        art.wordCardHTML(w, { I, supports: { glossaryEs: true }, band: "middle", showMorph: true }),
      );
      assert.ok(
        card.includes("vaa-card") &&
          card.includes(
            w.def
              .slice(0, 10)
              .replace(/&/g, "&amp;")
              .replace(/'/g, "&#39;")
              .replace(/"/g, "&quot;"),
          ),
        `${w.id} card`,
      );
    }
  // supports.picture === false hides the picture for older students but never for K-2
  const w = reference.words[0];
  assert.ok(
    !/vaa-pic/.test(
      rawOf(art.wordCardHTML(w, { I, supports: { picture: false }, band: "middle" })),
    ),
  );
  assert.ok(
    /vaa-pic/.test(rawOf(art.wordCardHTML(w, { I, supports: { picture: false }, band: "early" }))),
  );
  // every diagram kind draws
  for (const kind of ["spectrum", "contrast", "cycle", "web", "flow"]) {
    const out = rawOf(
      art.visualHTML(
        { ...w, visual: { kind: "diagram", diagram: kind, glyphs: [], alt: "A diagram." } },
        { I },
      ),
    );
    assert.ok(/<svg/.test(out) && out.includes(w.hw), kind);
  }
});

test("review session: due words first, one item each, mixed types, no repeated stem, review result type", () => {
  const now = new Date("2026-11-21T12:00:00Z");
  const progress = model.blankProgress();
  const entries = reference.words.map((word) => ({ word, unit: reference }));
  const early = new Date("2026-11-01T12:00:00Z");
  for (const w of reference.words.slice(0, 6))
    model.recordResult(progress, {
      wordId: w.id,
      dim: "mean",
      ok: true,
      type: "lesson",
      now: early,
    });
  for (const w of reference.words.slice(6, 8))
    model.recordResult(progress, {
      wordId: w.id,
      dim: "ctx",
      ok: false,
      type: "lesson",
      now: early,
    });
  const items = session.buildReviewItems({ progress, entries, grade: "6", now, limit: 8 });
  assert.ok(items.length >= 6, `${items.length} items`);
  assert.equal(new Set(items.map((i) => i.stem)).size, items.length, "repeated stem");
  assert.equal(new Set(items.map((i) => i.wordId)).size, items.length, "a word twice");
  assert.ok(items.every((i) => i.resultType === "review" && i.wordId));
  assert.ok(new Set(items.map((i) => i.type)).size >= 3, "types are mixed");
  const dueIds = new Set(model.dueWords(progress, { now, limit: 20 }));
  assert.ok(
    items.slice(0, Math.min(dueIds.size, items.length)).every((i) => dueIds.has(i.wordId)),
    "due words come first",
  );
  assert.ok(
    items.filter((i) => ["write", "speak"].includes(i.mode)).length <= 1,
    "at most one free-response item",
  );
  const again = session.buildReviewItems({ progress, entries, grade: "6", now, limit: 8 });
  assert.deepEqual(
    items.map((i) => i.id),
    again.map((i) => i.id),
    "deterministic for a given day",
  );
  assert.deepEqual(
    session.buildReviewItems({ progress: model.blankProgress(), entries, grade: "6", now }),
    [],
  );
});

test("review session loads word records through data.js loaders", async () => {
  const now = new Date("2026-11-21T12:00:00Z");
  const progress = model.blankProgress();
  const w = reference.words[0];
  model.recordResult(progress, {
    wordId: w.id,
    dim: "mean",
    ok: true,
    type: "lesson",
    now: new Date("2026-11-01T12:00:00Z"),
  });
  const items = await session.buildReviewSession(progress, {
    grade: "6",
    now,
    getIndex: async () => ({
      words: Object.fromEntries(
        reference.words.map((x) => [x.id, { grade: "6", unit: reference.id }]),
      ),
    }),
    getWord: async (id) => ({ word: reference.words.find((x) => x.id === id), unit: reference }),
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].wordId, w.id);
});
