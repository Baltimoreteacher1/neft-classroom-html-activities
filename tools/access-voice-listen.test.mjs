// Listening source card + listening content contract (Voice Lab retells, Speaking Studio recordings).
// Pure and render-level checks; the browser behaviour is covered by tools/access-voice-listen-e2e.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const listen = await import("../access-practice-lab/src/views/voice-listen.js");
const { RETELLS } = await import("../access-practice-lab/src/content/voice-lab.js");
const speaking = JSON.parse(
  readFileSync("access-practice-lab/content/studio/speaking.json", "utf8"),
).tasks;
const { toHtml } = await import("../access-practice-lab/src/util.js");
const I = makeI18n("en");

const heardSources = [
  ...RETELLS.filter((r) => r.mode === "listen").map((r) => ({ id: r.id, src: r })),
  ...speaking
    .filter((t) => t.stimulus?.kind === "audio")
    .map((t) => ({ id: t.id, src: t.stimulus })),
];

test("every heard source has a purpose, enough parts and 2-3 well-formed check questions", () => {
  assert.ok(heardSources.length >= 14);
  for (const { id, src } of heardSources) {
    const parts = listen.listenParts(src);
    assert.ok(parts.length >= 2, `${id}: at least two parts`);
    assert.ok((src.listenFor || []).length >= 2, `${id}: listenFor`);
    assert.ok(src.check.length >= 2 && src.check.length <= 3, `${id}: 2-3 questions`);
    const kinds = new Set(src.check.map((q) => q.kind));
    assert.ok(kinds.size >= 2, `${id}: more than one question kind`);
    for (const q of src.check) {
      assert.ok(
        ["main-idea", "detail", "sequence", "inference"].includes(q.kind),
        `${id}: kind ${q.kind}`,
      );
      assert.ok(q.options.length >= 3, `${id}: 3+ options`);
      assert.equal(
        new Set(q.options.map((o) => o.toLowerCase())).size,
        q.options.length,
        `${id}: duplicate option`,
      );
      assert.ok(Number.isInteger(q.answer) && q.options[q.answer], `${id}: answer in range`);
      assert.ok(Number.isInteger(q.part) && parts[q.part], `${id}: part exists`);
      assert.ok(q.hint.length > 20 && q.why.length > 20, `${id}: hint and reason teach`);
      assert.doesNotMatch(
        q.hint,
        new RegExp(q.options[q.answer].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${id}: hint must not state the answer`,
      );
    }
  }
});

test("the correct option is not always in the same place", () => {
  const places = heardSources.flatMap(({ src }) => src.check.map((q) => q.answer));
  for (let i = 0; i < 3; i++)
    assert.ok(
      places.filter((p) => p === i).length >= places.length * 0.15,
      `position ${i} is used`,
    );
});

test("retells carry vocabulary, fading frames, success criteria and a model", () => {
  for (const r of RETELLS) {
    assert.ok(
      r.vocab.length >= 3 && r.vocab.every(([w, d, es]) => w && d && es),
      `${r.id}: vocab with Spanish`,
    );
    assert.equal(
      r.frames.full.length,
      r.frames.light.length,
      `${r.id}: frames fade at the same count`,
    );
    const len = (a) => a.join(" ").length;
    assert.ok(len(r.frames.light) < len(r.frames.full), `${r.id}: light frames are lighter`);
    assert.ok(r.criteria.length >= 4, `${r.id}: criteria`);
    assert.ok(r.listenFor?.length >= 2 || r.mode === "read");
    assert.equal(r.plan.length, r.frames.full.length, `${r.id}: one frame per plan slot`);
  }
  assert.ok(RETELLS.some((r) => r.genre === "School announcement"));
  assert.ok(RETELLS.some((r) => r.genre === "Interview"));
  assert.ok(RETELLS.some((r) => r.genre === "Directions"));
});

test("checkOutcome: retry once with a hint, then reveal; a repeat pick changes nothing", () => {
  const q = { answer: 1, options: ["a", "b", "c"] };
  let s = listen.checkOutcome(q, undefined, 0);
  assert.deepEqual(s, { tried: [0], done: false, correct: false });
  assert.deepEqual(listen.checkOutcome(q, s, 0), s);
  const second = listen.checkOutcome(q, s, 2);
  assert.deepEqual(second, { tried: [0, 2], done: true, correct: false });
  const right = listen.checkOutcome(q, s, 1);
  assert.deepEqual(right, { tried: [0, 1], done: true, correct: true });
  assert.equal(
    listen.checkOutcome(q, right, 2).correct,
    true,
    "a finished question stays finished",
  );
});

test("without read-aloud the words are shown, open, with an honest note and no dead play button", () => {
  delete globalThis.window;
  listen.resetListening();
  const { src } = heardSources.find((h) => h.id === "interview-crosswalk");
  const out = toHtml(listen.listenCardHTML(I, src, { key: "t" }));
  assert.match(out, /<details\s+class="lc-transcript"[^>]*\sopen\b/);
  assert.match(out, /audio is not available/i);
  assert.doesNotMatch(out, /data-lc-speed|data-lc-play=/);
  assert.match(out, /Ms\. Patel:/);
});

test("with read-aloud: play, per-part replay, slower speed, transcript closed but present, check buttons", () => {
  globalThis.window = { speechSynthesis: {} };
  listen.resetListening();
  const { src } = heardSources.find((h) => h.id === "interview-crosswalk");
  const out = toHtml(listen.listenCardHTML(I, src, { key: "t" }));
  delete globalThis.window;
  assert.match(out, /data-lc-play="t:0:5"/);
  assert.equal((out.match(/data-lc-part-btn=/g) || []).length, 6);
  assert.match(out, /data-lc-speed="slow"/);
  assert.match(out, /<details\s+class="lc-transcript"\s+data-lc-transcript="t"\s*>/);
  assert.match(out, /Reading is a different skill from listening/);
  assert.equal(
    (out.match(/data-lc-pick=/g) || []).length,
    src.check.reduce((n, q) => n + q.options.length, 0),
  );
  assert.match(out, /Listen for:/);
});
