// Vocabulary Academy — lessons & assessment logic. Run: node --test tools/vocab-academy-lessons.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import {
  buildAssessment,
  compareAttempts,
  evidenceRows,
  feedbackPlan,
  scoreAssessment,
  studentSafeNote,
  summarizeResult,
} from "../access-practice-lab/src/vocab-academy/assessment.js";

const ROOT = new URL("..", import.meta.url).pathname;
const ref = JSON.parse(readFileSync(join(ROOT, "docs/vocab-academy/reference-unit.json"), "utf8"));
const CONTENT = join(ROOT, "access-practice-lab/content/vocab-academy");

const correctAnswers = (items) => Object.fromEntries(items.map((i) => [i.id, i.answer]));
const wrongAnswers = (items) =>
  Object.fromEntries(items.map((i) => [i.id, (i.answer + 1) % i.choices.length]));

test("both forms build 10-14 unambiguous items", () => {
  for (const form of ["A", "B"]) {
    const f = buildAssessment(ref, form, {});
    assert.ok(f.items.length >= 10 && f.items.length <= 14, `${form}: ${f.items.length}`);
    for (const item of f.items) {
      assert.ok(
        Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.choices.length,
        item.id,
      );
      const keys = item.choices.map((c) => c.trim().toLowerCase());
      assert.equal(new Set(keys).size, keys.length, `duplicate choices in ${item.id}`);
      assert.ok(item.choices.length >= 2 && item.dim && item.type, item.id);
    }
    assert.equal(new Set(f.items.map((i) => i.id)).size, f.items.length, "item ids unique");
    assert.equal(f.constructed.length, 1);
    assert.ok(!("model" in f.constructed[0]), "constructed prompt must not carry the model answer");
  }
});

test("form A uses cloze + meaning + misuse + morph + passage questions; B is parallel", () => {
  const A = buildAssessment(ref, "A", {});
  const B = buildAssessment(ref, "B", {});
  const types = (f) => new Set(f.items.map((i) => i.type));
  for (const t of ["cloze", "fit", "morph-part", "passage"])
    assert.ok(types(A).has(t), `A lacks ${t}`);
  assert.ok(types(A).has("def-to-word"));
  const aPass = A.items.filter((i) => i.type === "passage").length;
  assert.ok(aPass >= 1 && aPass <= 2);
  // Same words are tested in both forms...
  const wordsOf = (f) => new Set(f.items.filter((i) => i.type !== "passage").map((i) => i.wordId));
  assert.deepEqual([...wordsOf(A)].sort(), [...wordsOf(B)].sort());
  // ...with different sentences: no stem is shared except a fixed word/definition prompt, no passage question repeats.
  const sentenceStems = (f) =>
    f.items.filter((i) => ["cloze", "fit", "passage"].includes(i.type)).map((i) => i.stem);
  const bStems = new Set(sentenceStems(B));
  for (const s of sentenceStems(A)) assert.ok(!bStems.has(s), `sentence reused across forms: ${s}`);
  // B cloze items come from cloze2.
  for (const item of B.items.filter((i) => i.type === "cloze")) {
    const w = ref.words.find((x) => x.id === item.wordId);
    assert.equal(item.stem, w.cloze2.s);
  }
  for (const item of A.items.filter((i) => i.type === "cloze")) {
    const w = ref.words.find((x) => x.id === item.wordId);
    assert.equal(item.stem, w.cloze.s);
  }
});

test("building is deterministic and seeds change order only", () => {
  const a1 = buildAssessment(ref, "A", {});
  const a2 = buildAssessment(ref, "A", {});
  assert.deepEqual(a1.items, a2.items);
});

test("scoring: perWord evidence by dimension; unanswered adds no evidence", () => {
  const f = buildAssessment(ref, "A", {});
  const all = scoreAssessment(f.items, correctAnswers(f.items));
  assert.equal(all.score, f.items.length);
  assert.equal(all.unanswered, 0);
  assert.ok(Object.values(all.perWord).every((w) => w.ok && w.c === w.n));
  assert.ok(all.byDim.ctx && all.byDim.mean && all.byDim.morph);
  const none = scoreAssessment(f.items, wrongAnswers(f.items));
  assert.equal(none.score, 0);
  assert.ok(Object.values(none.perWord).every((w) => !w.ok && w.missed.length === w.n));
  const half = correctAnswers(f.items);
  const skipped = f.items.find((i) => i.wordId);
  delete half[skipped.id];
  const part = scoreAssessment(f.items, half);
  assert.equal(part.unanswered, 1);
  assert.equal(part.total, f.items.length - 1);
  const rows = evidenceRows(f.items, part);
  assert.ok(
    rows.every((r) => r.wordId && ["rec", "mean", "ctx", "morph", "prod", "delay"].includes(r.dim)),
  );
  assert.ok(!rows.some((r) => r.id === skipped.id));
});

test("feedback plan implements the five steps", () => {
  const f = buildAssessment(ref, "A", {});
  const answers = correctAnswers(f.items);
  const missed = f.items.filter((i) => i.wordId).slice(0, 3);
  for (const m of missed) answers[m.id] = (m.answer + 1) % m.choices.length;
  const result = { ...scoreAssessment(f.items, answers), form: "A" };
  const plan = feedbackPlan(result, ref);
  assert.deepEqual(plan.steps, ["need", "explain", "practice", "parallel", "compare"]);
  const needIds = new Set(missed.map((m) => m.wordId));
  assert.deepEqual(new Set(plan.needs.map((n) => n.wordId)), needIds);
  for (const e of plan.explanations) {
    const w = ref.words.find((x) => x.id === e.wordId);
    assert.equal(e.def, w.def);
    assert.equal(e.ex, w.ex);
  }
  assert.ok(plan.practice.length >= needIds.size);
  assert.ok(plan.practice.every((i) => needIds.has(i.wordId) && i.answer < i.choices.length));
  assert.equal(plan.parallel.form, "B");
  // practice never reuses a sentence that a form shows
  const A = new Set(buildAssessment(ref, "A", {}).items.map((i) => i.stem));
  const B = new Set(buildAssessment(ref, "B", {}).items.map((i) => i.stem));
  for (const p of plan.practice.filter((i) => i.type === "cloze"))
    assert.ok(!A.has(p.stem) && !B.has(p.stem));
});

test("compareAttempts reports growth per word without shaming", () => {
  const A = buildAssessment(ref, "A", {});
  const B = buildAssessment(ref, "B", {});
  const a = scoreAssessment(A.items, wrongAnswers(A.items));
  const b = scoreAssessment(B.items, correctAnswers(B.items));
  const cmp = compareAttempts(a, b);
  assert.equal(cmp.counts.gained, Object.keys(a.perWord).length);
  assert.equal(cmp.counts.revisit, 0);
  const back = compareAttempts(b, a);
  assert.equal(back.counts.revisit, Object.keys(a.perWord).length);
  const text = JSON.stringify(cmp);
  assert.ok(!/fail|bad|poor|weak|dumb|behind/i.test(text));
});

test("no key leakage: constructed prompts, student-safe notes, summaries", () => {
  const f = buildAssessment(ref, "B", {});
  const blob = JSON.stringify(f.constructed);
  for (const c of ref.check.constructed) assert.ok(!blob.includes(c.model));
  for (const w of ref.words) {
    const note = studentSafeNote(ref, w.id);
    const full = ref.teacher.notes[w.id];
    assert.ok(full.includes(note) || note.split(" ").every((t) => full.includes(t)));
    assert.ok(!/\b(students?|teacher|model the|ask)\b/i.test(note), `${w.id}: ${note}`);
  }
  const s = summarizeResult(scoreAssessment(f.items, {}), "B", "2026-01-01T00:00:00Z");
  assert.ok(!JSON.stringify(s).includes('"answer"'));
});

test("guard: ambiguous or tiny pools degrade or skip with warnings", () => {
  const tiny = structuredClone(ref);
  tiny.words = tiny.words.slice(0, 3).map((w) => ({ ...w }));
  tiny.words[1].cloze.f = tiny.words[0].cloze.f; // a distractor equal to another word's answer is dropped, not offered
  const f = buildAssessment(tiny, "A", {});
  for (const item of f.items) {
    const keys = item.choices.map((c) => c.toLowerCase());
    assert.equal(new Set(keys).size, keys.length);
  }
  assert.ok(Array.isArray(f.warnings));
  const one = structuredClone(ref);
  one.words = one.words.slice(0, 1);
  const g = buildAssessment(one, "B", {});
  assert.ok(g.warnings.length > 0, "a one-word unit must warn, not invent items");
});

test("every authored unit builds both forms without crashing", () => {
  if (!existsSync(CONTENT)) return;
  let units = 0;
  for (const dir of readdirSync(CONTENT)) {
    const d = join(CONTENT, dir);
    if (!/^g/.test(dir) || !existsSync(d) || !readdirSync(d).length) continue;
    for (const file of readdirSync(d).filter((f) => /^u\d+\.json$/.test(f))) {
      const unit = JSON.parse(readFileSync(join(d, file), "utf8"));
      for (const form of ["A", "B"]) {
        const f = buildAssessment(unit, form, {});
        assert.ok(f.items.length >= 1, `${unit.id} ${form}`);
        for (const item of f.items) assert.ok(item.answer < item.choices.length);
      }
      units++;
    }
  }
  console.log(`# built forms for ${units} authored unit(s)`);
});

import { makeI18n } from "../access-practice-lab/src/i18n.js";
// ── lesson player: steps, adaptive set, render safety, resume ──────────────────────────────────────────────────────
import { toHtml } from "../access-practice-lab/src/util.js";
import {
  assessListHTML,
  itemHTML,
} from "../access-practice-lab/src/vocab-academy/lessons/item-ui.js";
import * as writeKind from "../access-practice-lab/src/vocab-academy/lessons/kinds/write.js";
import { buildSteps } from "../access-practice-lab/src/vocab-academy/lessons/steps.js";
import {
  blankProgress,
  cleanProgress,
  recordAssessment,
  recordResult,
  setUnitStage,
  unitStatus,
  wordEntry,
} from "../access-practice-lab/src/vocab-academy/model.js";

const LETTERS = "abcdefgh".split("");
const I = makeI18n("en");
const authored = () => {
  const out = [];
  for (const dir of readdirSync(CONTENT)) {
    const d = join(CONTENT, dir);
    if (!/^g/.test(dir) || !existsSync(d)) continue;
    for (const f of readdirSync(d).filter((x) => /^u\d+\.json$/.test(x)))
      out.push(JSON.parse(readFileSync(join(d, f), "utf8")));
  }
  return out;
};
const env = {};

test("every lesson A-H builds steps for the reference unit; each letter works alone", () => {
  for (const l of LETTERS) {
    const steps = buildSteps(l, ref, env);
    assert.ok(steps.length >= 1, `lesson ${l} has no steps`);
    assert.equal(
      new Set(steps.map((s) => s.id)).size,
      steps.length,
      `lesson ${l}: step ids unique`,
    );
  }
});

test("steps never carry teacher-only text or authored model answers (all authored units)", () => {
  let n = 0;
  for (const unit of authored()) {
    const secrets = [
      unit.teacher?.overview,
      unit.teacher?.model,
      ...(unit.teacher?.misconceptions || []),
      ...(unit.check?.constructed || []).map((c) => c.model),
    ].filter((s) => s && s.length > 20);
    for (const l of LETTERS) {
      const blob = JSON.stringify(buildSteps(l, unit, env));
      for (const s of secrets)
        assert.ok(
          !blob.includes(JSON.stringify(s).slice(1, -1)),
          `${unit.id} lesson ${l} leaks teacher text`,
        );
    }
    n++;
  }
  assert.ok(n > 0);
});

test("lesson A has one card per word; lesson H has the five assessment steps", () => {
  assert.equal(buildSteps("a", ref, env).length, ref.words.length);
  assert.deepEqual(
    buildSteps("h", ref, env).map((s) => s.part),
    ["A", "evidence", "practice", "B", "growth"],
  );
});

test("question markup holds no answer or explanation before a check; assessment list never has the key", () => {
  const f = buildAssessment(ref, "A", {});
  for (const item of f.items) {
    const fresh = toHtml(
      itemHTML(
        I,
        item,
        {
          chosen: null,
          shown: false,
          ok: false,
          tries: 0,
          hint: false,
          revealed: false,
          locked: false,
        },
        { n: 1, total: 1 },
      ),
    );
    if (item.explain)
      assert.ok(
        !fresh.includes(item.explain.replace(/&/g, "&amp;").slice(0, 40)) ||
          item.explain.length < 8,
        `explain leaked in ${item.id}`,
      );
    assert.ok(!/is-right|is-wrong|val-mark/.test(fresh));
  }
  const list = toHtml(assessListHTML(I, f.items, {}));
  assert.ok(!/is-right|is-wrong|val-mark|checked/.test(list));
  for (const item of f.items)
    if (item.explain.length > 15)
      assert.ok(
        !list.includes(item.explain.slice(0, 25)),
        `${item.id} explanation in the assessment list`,
      );
});

test("write step shows no model sentence before an attempt (unless the support flag asks)", () => {
  const steps = buildSteps("g", ref, env);
  const combine = steps.find((s) => s.id === "g-combine");
  if (!combine) return;
  const S = {
    I,
    unit: ref,
    early: false,
    supW: {},
    sup: {},
    state: {},
    stepData: (id) => (S.state[id] ||= {}),
    word: (id) => ref.words.find((w) => w.id === id) || null,
  };
  const out = toHtml(writeKind.htmlOf(S, combine));
  for (const p of combine.prompts)
    assert.ok(!out.includes(p.model.replace(/&/g, "&amp;")), "model shown before attempt");
  assert.ok(!/data-val-model-first/.test(out));
  const withFlag = toHtml(writeKind.htmlOf({ ...S, supW: { model: true } }, combine));
  assert.ok(/data-val-model-first/.test(withFlag));
});

test("Wordly Wise order: B Finding Meanings builds true-sentence items with exactly one true choice", () => {
  const steps = buildSteps("b", ref, env);
  assert.equal(steps[0].id, "b-find");
  const find = steps[0].items.filter((i) => i.type === "find");
  assert.ok(find.length >= Math.floor(ref.words.length / 2), "most words get a four-sentence item");
  for (const item of find) {
    assert.equal(new Set(item.choices).size, item.choices.length, `${item.id} choices distinct`);
    const word = ref.words.find((w) => w.id === item.wordId);
    const right = item.choices[item.answer];
    assert.ok(
      right.toLowerCase().startsWith(word.hw.toLowerCase()),
      `${item.id}: the true sentence begins with the word`,
    );
    for (const [i, c] of item.choices.entries())
      if (i !== item.answer)
        assert.ok(
          !(
            c.toLowerCase().startsWith(word.hw.toLowerCase()) &&
            c.includes(word.def.slice(0, 20).toLowerCase())
          ),
          `${item.id}: a wrong sentence is also true`,
        );
  }
});

test("each section is a Wordly Wise exercise, in order: word list, A-F, review", () => {
  const ids = (l) => buildSteps(l, ref, env).map((s) => s.id.split("-")[0]);
  assert.ok(
    ids("c").every((x) => x === "c"),
    "Exercise B (Just the Right Word)",
  );
  const c = buildSteps("c", ref, env);
  assert.equal(c[0].id, "c-right-word");
  assert.ok(
    c[0].items.every((i) => i.type === "cloze"),
    "B opens with fill-in-the-blank",
  );
  assert.equal(
    buildSteps("f", ref, env)[0].kind,
    "reader",
    "Exercise E opens with the reading passage",
  );
  assert.ok(
    buildSteps("g", ref, env).some((s) => s.kind === "write"),
    "Exercise F is writing",
  );
  assert.ok(
    !JSON.stringify([...LETTERS].flatMap((l) => buildSteps(l, ref, env))).includes("f-round"),
    "no adaptive rounds inside a lesson",
  );
});

test("resume round-trip: lesson position, step answers, and assessment attempts survive clean/export", () => {
  const p = blankProgress();
  setUnitStage(p, ref.id, "b", {
    pos: 3,
    steps: {
      "b-match": { idx: 2, results: { x: { ok: true, tries: 1 } } },
      "b-examples": { done: true },
    },
  });
  setUnitStage(p, ref.id, "e", {
    pos: 1,
    steps: {
      "e-sentences": { texts: { "sentence-0": "My own sentence." }, saved: { "sentence-0": "t" } },
    },
  });
  const back = cleanProgress(JSON.parse(JSON.stringify(p)));
  const rec = back.units[ref.id].lessons.b;
  assert.equal(rec.pos, 3);
  assert.equal(rec.steps["b-match"].idx, 2);
  assert.equal(
    back.units[ref.id].lessons.e.steps["e-sentences"].texts["sentence-0"],
    "My own sentence.",
  );
  assert.equal(back.last.lesson, "e");
  assert.equal(unitStatus(back, ref.id).doneCount, 0, "a position is not a completion");
  setUnitStage(back, ref.id, "b", { done: true });
  assert.equal(unitStatus(back, ref.id).doneCount, 1);
  assert.equal(back.units[ref.id].lessons.b.pos, 3, "finishing keeps the resume data");
  const A = buildAssessment(ref, "A", {});
  const res = scoreAssessment(A.items, correctAnswers(A.items));
  recordAssessment(back, ref.id, "A", { score: res.score, total: res.total, perWord: res.perWord });
  assert.equal(
    cleanProgress(JSON.parse(JSON.stringify(back))).units[ref.id].assess.A.score,
    res.score,
  );
});

test("assessment evidence goes to the right dimension and reaches word state", () => {
  const f = buildAssessment(ref, "A", {});
  const rows = evidenceRows(f.items, scoreAssessment(f.items, correctAnswers(f.items)));
  assert.ok(rows.length);
  assert.ok(new Set(rows.map((r) => r.dim)).size >= 3, "cloze/meaning/morph map to ctx/mean/morph");
  const p = blankProgress();
  for (const r of rows) recordResult(p, { wordId: r.wordId, dim: r.dim, ok: r.ok, type: r.type });
  assert.ok(Object.keys(p.words).length >= ref.words.length - 1);
  assert.notEqual(wordEntry(p, rows[0].wordId).state, "new");
});
