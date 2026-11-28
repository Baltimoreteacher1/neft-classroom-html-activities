// K-2 starter sets (access-practice-lab/src/content/k2-studio): the catalogue a K-2 teacher sees, the picture-first
// and read-aloud promises, and the mathematics, checked independently of the authored explanations.
//   node --test tools/studio-k2-starters.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DOES,
  K2_GRADES,
  K2_STARTERS,
  TOPICS,
} from "../access-practice-lab/src/content/k2-studio/index.js";
import { checkResponse } from "../access-practice-lab/src/studio/core/check.js";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import { spokenText } from "../access-practice-lab/src/studio/player/util.js";
import { renderDiagram } from "../access-practice-lab/src/studio/x/diagram-render.js";

const PICTURE = /\p{Extended_Pictographic}/u;
const questions = (s) => s.activity.blocks.filter((b) => b.type === "question");
const keyOf = (q) =>
  ({
    choice: () => q.answer,
    multi: () => q.answers,
    sort: () => Object.fromEntries(q.items.map((i) => [i.id, i.category])),
    match: () => Object.fromEntries(q.pairs.map((p) => [p.id, p.id])),
    order: () => q.items.map((i) => i.id),
    blank: () => [...q.text.matchAll(/\[\[([^\]|]+)/g)].map((m) => m[1]),
  })[q.format]?.();

test("catalogue: 15 starters, five per grade, every grade has phonics, math and oral language", () => {
  assert.equal(K2_STARTERS.length, 15);
  assert.equal(new Set(K2_STARTERS.map((s) => s.id)).size, 15);
  for (const g of K2_GRADES) {
    const mine = K2_STARTERS.filter((s) => s.grade === g);
    assert.equal(mine.length, 5, `grade ${g}`);
    for (const t of Object.keys(TOPICS))
      assert.ok(
        mine.some((s) => s.topic === t),
        `grade ${g} has no ${t}`,
      );
  }
  for (const s of K2_STARTERS) {
    assert.ok(s.art && PICTURE.test(s.art), `${s.id}: card picture`);
    assert.ok(s.does.length >= 2 && s.does.every((d) => DOES[d]), `${s.id}: what children do`);
    assert.ok(s.minutes >= 5 && s.minutes <= 20, `${s.id}: minutes`);
  }
});

test("every starter normalizes unchanged, validates with no errors and accepts its own keys", () => {
  for (const s of K2_STARTERS) {
    const a = normalizeActivity({ ...s.activity, id: "a1" });
    assert.deepEqual(normalizeActivity(a), a, s.id);
    assert.deepEqual(validateActivity(a).errors, [], s.id);
    assert.equal(a.blocks.length, s.activity.blocks.length, `${s.id}: a block was dropped`);
    for (const q of a.blocks.filter((b) => b.type === "question")) {
      if (q.format === "short") {
        assert.equal(
          checkResponse(q, "one two three four five six").status,
          "review",
          `${s.id}/${q.id}: never auto-graded`,
        );
        assert.ok(
          q.sample && q.rubric.length && q.frame,
          `${s.id}/${q.id}: talk prompt needs a frame, model and look-fors`,
        );
        continue;
      }
      assert.equal(checkResponse(q, keyOf(q)).status, "correct", `${s.id}/${q.id}`);
      assert.ok(q.hint && q.explanation, `${s.id}/${q.id}: hint and explanation`);
    }
  }
});

test("made for pre-readers: read aloud on, a listening model, picture choices in kindergarten, K-2 sizing", () => {
  for (const s of K2_STARTERS) {
    const a = s.activity;
    assert.equal(a.supports.readAloud, true, s.id);
    assert.equal(a.supports.visuals, true, s.id);
    assert.equal(a.look.style, "playful", s.id);
    assert.equal(a.options.timer, false, s.id);
    assert.ok(K2_GRADES.includes(a.context.grade), s.id);
    assert.ok(
      a.blocks.some((b) => b.type === "audio" && b.say.length > 20),
      `${s.id}: no listening model`,
    );
    assert.ok(questions(s).length >= 4 && questions(s).length <= 6, `${s.id}: 4-6 questions`);
    for (const q of questions(s))
      assert.ok(q.prompt.split(/\s+/).length <= 22, `${s.id}/${q.id}: prompt too long for K-2`);
    if (s.grade !== "K") continue;
    // In kindergarten every word a child must choose carries a picture (numerals and short sentences about pictures
    // the prompt shows are the exceptions).
    for (const q of questions(s)) {
      const texts = [
        ...(q.options || []).map((o) => o.text),
        ...(q.items || []).map((i) => i.text),
        ...(q.pairs || []).flatMap((p) => [p.left, p.right]),
      ];
      for (const t of texts)
        if (/^[a-z]+$/i.test(t.trim()))
          assert.fail(`${s.id}/${q.id}: "${t}" is a bare word with no picture`);
    }
  }
});

test("ten frames and arithmetic agree with the keys", () => {
  for (const s of K2_STARTERS) {
    const blocks = s.activity.blocks;
    blocks.forEach((b, i) => {
      if (b.type !== "diagram") return;
      assert.ok(renderDiagram(b).ok, `${s.id}/${b.id}: cannot draw`);
      const q = blocks.slice(i + 1).find((x) => x.type === "question");
      const key = Number(q.options.find((o) => o.id === q.answer).text);
      const total = b.spec.count + (b.spec.add ?? 0);
      if (/How many more counters make 10/.test(q.prompt))
        assert.equal(key, 10 - total, `${s.id}/${q.id}`);
      else assert.equal(key, total, `${s.id}/${q.id}: the frame shows ${total}`);
    });
    for (const q of questions(s)) {
      for (const text of [q.prompt, ...(q.pairs || []).map((p) => `${p.left} = ${p.right}`)]) {
        const m = /^(\d+) ([+−]) (\d+) = (\?|\d+)/.exec(text);
        if (!m) continue;
        const want = m[2] === "+" ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
        const got =
          m[4] === "?" ? Number(q.options.find((o) => o.id === q.answer).text) : Number(m[4]);
        assert.equal(got, want, `${s.id}/${q.id}: ${text}`);
      }
      if (q.format === "sort" && /makes 10/.test(q.prompt))
        for (const it of q.items) {
          const [x, y] = it.text.split(" + ").map(Number);
          assert.equal(it.category === "ten", x + y === 10, `${s.id}: ${it.text}`);
        }
      if (q.format === "order" && q.items.every((i) => /^\d+$/.test(i.text))) {
        const n = q.items.map((i) => Number(i.text));
        assert.deepEqual(
          n,
          [...n].sort((a, b) => a - b),
          `${s.id}/${q.id}: not least to greatest`,
        );
      }
    }
  }
});

test("the voice skips picture characters, so it never reads the count or 'dog face dog'", () => {
  assert.equal(spokenText("🍎🍎🍎🍎 How many apples?"), "How many apples?");
  assert.equal(spokenText("A. 🐶 dog. B. 👨‍👩‍👧 family"), "A. dog. B. family");
  assert.match(spokenText("3️⃣ three"), /^3 three$/, "a keycap digit keeps its digit");
});
