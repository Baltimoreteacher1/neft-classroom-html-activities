// Analyze, then build: the Demand Analyzer result carried into Activity Studio (src/demand/handoff.js). Runs the REAL
// chain (analyzeDemand -> createActivity -> applyHandoff -> normalizeActivity -> validateActivity) so a handoff that
// builds an invalid or reworded activity fails here, not in a teacher's browser.
import assert from "node:assert/strict";
import test from "node:test";
import { analyzeDemand } from "../access-practice-lab/src/demand/analyze.js";
import {
  applyHandoff,
  buildHandoff,
  HANDOFF_KEY,
  saveHandoff,
  takeHandoff,
} from "../access-practice-lab/src/demand/handoff.js";
import { SAMPLES } from "../access-practice-lab/src/demand/sample.js";
import { tokenize } from "../access-practice-lab/src/lang/text.js";
import { createActivity } from "../access-practice-lab/src/studio/core/build.js";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";

const memory = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    m,
  };
};

async function chain(band) {
  const { text, subject } = SAMPLES[band];
  const result = analyzeDemand(text, { band, subject });
  const handoff = buildHandoff(result, text);
  const built = await createActivity({
    mode: "content",
    kind: "worksheet",
    text: handoff.text,
    context: { subject: handoff.subject },
  });
  assert.ok(built.activity, `${band}: an activity was built (${built.needs.join(" | ")})`);
  const activity = normalizeActivity(applyHandoff(built.activity, handoff));
  return { text, result, handoff, activity };
}

test("each example task becomes a valid activity with the task, its steps, its word help and its frames", async () => {
  for (const band of ["K-2", "3-5", "6-8"]) {
    const { text, handoff, activity } = await chain(band);
    const v = validateActivity(activity);
    assert.equal(v.ok, true, `${band}: ${JSON.stringify(v.errors)}`);
    const types = activity.blocks.map((b) => `${b.type}${b.role ? `:${b.role}` : ""}`);
    assert.equal(
      types[0] === "text:directions",
      handoff.steps.length > 0,
      `${band}: steps lead when the task has stacked directions`,
    );
    assert.ok(
      activity.blocks.some((b) => b.type === "passage" && b.text.includes(text.slice(0, 40))),
      `${band}: the teacher's task is the reading block`,
    );
    assert.ok(
      activity.blocks.some((b) => b.type === "vocab"),
      `${band}: pre-teach words became a vocabulary block`,
    );
    assert.ok(
      activity.blocks.some((b) => b.type === "text" && /Sentence starters/.test(b.text)),
      `${band}: frames are present`,
    );
  }
});

test("the task is never reworded: every step uses only the teacher's own words, in order", async () => {
  const { text, handoff } = await chain("6-8");
  assert.ok(handoff.steps.length >= 3);
  const original = tokenize(text).map((t) => t.lower);
  let at = 0;
  for (const w of handoff.steps.flatMap((s) => tokenize(s).map((t) => t.lower))) {
    const i = original.indexOf(w, at);
    assert.ok(i >= 0, `"${w}" is not in the original, in order`);
    at = i;
  }
});

test("a word with no Word Lab meaning is left out, never given an invented one", async () => {
  const result = analyzeDemand("Analyze the quasar's luminosity and compare the claim.", {
    band: "6-8",
  });
  const handoff = buildHandoff(result, "Analyze the quasar's luminosity and compare the claim.");
  const lines = handoff.text.split("\n");
  for (const w of handoff.droppedWords)
    assert.ok(!lines.some((l) => l.startsWith(`${w} - `)), `${w} must not be defined by invention`);
  for (const l of lines.filter((x) => / - /.test(x)))
    assert.ok(
      result.vocabulary.some((v) => l === `${v.word} - ${v.gloss}`),
      l,
    );
});

test("an empty analysis gives no handoff, and applying none changes nothing", () => {
  assert.equal(buildHandoff(analyzeDemand(""), ""), null);
  const a = { blocks: [{ type: "text", role: "body", text: "x" }] };
  assert.equal(applyHandoff(a, null), a);
});

test("the handoff is used once, only in this tab's session storage, and never carries a student field", () => {
  const store = memory();
  const h = buildHandoff(analyzeDemand(SAMPLES["6-8"].text, { band: "6-8" }), SAMPLES["6-8"].text);
  assert.equal(saveHandoff(h, store), true);
  assert.deepEqual([...store.m.keys()], [HANDOFF_KEY]);
  assert.equal(takeHandoff(store)?.text, h.text);
  assert.equal(takeHandoff(store), null, "a second read finds nothing");
  store.setItem(HANDOFF_KEY, "{not json");
  assert.equal(takeHandoff(store), null, "corrupt data is ignored");
  assert.equal(
    saveHandoff(h, {
      setItem() {
        throw new Error("blocked");
      },
    }),
    false,
    "blocked storage does not throw",
  );
});
