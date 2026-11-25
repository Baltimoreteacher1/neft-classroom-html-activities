// Scaffold Studio: ask-the-passage, writing feedback and the optional AI adapter.
import assert from "node:assert/strict";
import { test } from "node:test";

const L = new URL("../access-practice-lab/src/scaffold/", import.meta.url);
const { askPassage, splitSentences } = await import(new URL("ask.js", L));
const { writingFeedback } = await import(new URL("writing.js", L));
const { createAdapter, isReachable, strip } = await import(new URL("ai/adapter.js", L));

const PASSAGE =
  "Roots grow down into the soil. The roots take in water and nutrients. A stem grows up toward the light.";

test("ask-the-passage points at the matching sentence and never invents an answer", () => {
  assert.equal(splitSentences(PASSAGE).length, 3);
  const a = askPassage(PASSAGE, "What do roots take in?");
  assert.equal(a.refused, false);
  assert.equal(a.evidence, "The roots take in water and nutrients.");
  assert.equal(askPassage(PASSAGE, "Which way does the stem grow?").index, 2);
  for (const q of ["Who won the soccer game?", "What is the capital of France?", "", "the a of"])
    assert.equal(askPassage(PASSAGE, q).refused, true, q);
});

test("writing feedback is ordered working / next / why, states its limit, and has no score", () => {
  const f = writingFeedback("first plant a seed. then water it", { keyWords: ["roots", "seed"] });
  assert.ok(f.working.length && f.next.length === 1 && f.why.length === 1);
  assert.match(f.limit.en, /cannot tell if your ideas are good/);
  assert.ok(
    !/score|grade|level|points|%/i.test(JSON.stringify({ w: f.working, n: f.next, y: f.why })),
  );
  assert.equal(writingFeedback("   ").empty, true);
  assert.match(writingFeedback("This is done", { minSentences: 1 }).next[0].en, /end/i);
  assert.ok(f.next[0].es && f.why[0].es);
});

test("AI layer is unreachable unless explicitly enabled on a non-production host", () => {
  assert.equal(isReachable({}), false);
  assert.equal(
    isReachable({ release: { aiEnabled: true }, hostname: "thelanguagepage.com" }),
    false,
  );
  assert.equal(isReachable({ release: { aiEnabled: true }, hostname: "eduwonderlab.com" }), false);
  assert.equal(isReachable({ release: { aiEnabled: true }, hostname: "localhost" }), true);
});

test("adapter falls back on off, error, timeout, and a provider that returns a score; strips identifiers", async () => {
  const p = { passage: PASSAGE, question: "What do roots take in?", id: "s-123", name: "Ana" };
  assert.deepEqual(Object.keys(strip(p)).sort(), ["passage", "question"]);
  const off = await createAdapter({}).run("ask", p);
  assert.equal(off.source, "fallback");
  assert.equal(off.result.evidence, "The roots take in water and nutrients.");
  const cfg = { release: { aiEnabled: true }, hostname: "localhost" };
  const seen = [];
  const ok = await createAdapter({
    ...cfg,
    provider: async (_t, payload) => (seen.push(payload), { fine: true }),
  }).run("ask", p);
  assert.equal(ok.source, "ai");
  assert.ok(!("id" in seen[0]) && !("name" in seen[0]));
  assert.equal(
    (
      await createAdapter({
        ...cfg,
        provider: async () => {
          throw new Error("x");
        },
      }).run("ask", p)
    ).source,
    "fallback",
  );
  assert.equal(
    (
      await createAdapter({ ...cfg, timeoutMs: 20, provider: () => new Promise(() => {}) }).run(
        "ask",
        p,
      )
    ).source,
    "fallback",
  );
  assert.equal(
    (
      await createAdapter({ ...cfg, provider: async () => ({ score: 4 }) }).run("write", {
        text: "hi",
      })
    ).source,
    "fallback",
  );
  await assert.rejects(createAdapter(cfg).run("nope", {}), RangeError);
});
