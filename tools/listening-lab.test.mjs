// Listening Lab derivation: pure, deterministic, additive, and every unit reaches the floor.
// Run: node --test tools/listening-lab.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { STUDIO_LOADERS } from "../db/seeds/bcpss/v2/index.mjs";
import {
  deriveListeningLab,
  LAB_GENERATOR,
  LAB_MIN_LISTENING,
  spokenMath,
  withListeningLab,
} from "../db/seeds/bcpss/v2/listening-lab.mjs";
import { loadStudio } from "../functions/_lib/bcpss/studio.js";

test("spokenMath reads simple notation as words and refuses what it cannot read", () => {
  const ok = {
    "3 + 3": "3 plus 3",
    "12 − 5 = 7": "12 minus 5 equals 7",
    "3 × 6 = 6 × 3": "3 times 6 equals 6 times 3",
    "1/3": "1 third",
    "2/3": "2 thirds",
    "7/10": "7 tenths",
    "√49": "the square root of 49",
    "4²": "4 squared",
    "−6": "negative 6",
    "−3 < 2": "negative 3 is less than 2",
    0.75: "zero point seven five",
    "change the order": "change the order",
    "x + 2 = 9 is one of me.": "x plus 2 equals 9 is one of me.",
  };
  for (const [text, spoken] of Object.entries(ok)) assert.equal(spokenMath(text), spoken, text);
  for (const text of ["(2 × 3) × 5", "x + 7 = 19", "0.121212…", "5x", "🟡🟡🟡", "", "2/0"])
    assert.equal(spokenMath(text), null, `refuses ${text}`);
});

test("a hyphen between words is never read as minus", () => {
  assert.equal(spokenMath("a well - known idea"), "a well - known idea");
});

test("every unit reaches the listening floor with draft-labelled, pointer-carrying items", async () => {
  for (const id of Object.keys(STUDIO_LOADERS)) {
    const raw = (await STUDIO_LOADERS[id]()).default;
    const studio = await loadStudio(id);
    const authoredListening = raw.activities.filter((a) => a.domain === "Listening").length;
    const lab = studio.activities.filter((a) => a.derived);
    assert.ok(authoredListening + lab.length >= LAB_MIN_LISTENING, `${id}: listening floor`);
    assert.deepEqual(
      studio.activities.slice(0, raw.activities.length).map((a) => a.title),
      raw.activities.map((a) => a.title),
      `${id}: authored activities keep their numbers`,
    );
    for (const a of lab) {
      assert.equal(a.derived.generator, LAB_GENERATOR);
      assert.equal(a.derived.status, "draft");
      assert.ok(a.payload.items.every((it) => it.from && it.options.length >= 2));
    }
  }
});

test("deriving does not mutate the authored unit, and is deterministic and idempotent", async () => {
  const raw = (await STUDIO_LOADERS["g6-math-u2"]()).default;
  const before = JSON.stringify(raw);
  const a = deriveListeningLab("g6-math-u2", raw);
  const b = deriveListeningLab("g6-math-u2", raw);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.equal(JSON.stringify(raw), before);
  const once = withListeningLab("g6-math-u2", raw);
  assert.equal(withListeningLab("g6-math-u2", once), once, "second pass is a no-op");
  assert.equal(raw.activities.length + a.length, once.activities.length);
});

test("a unit with nothing to derive from gets nothing invented", () => {
  const bare = { vocab: [], activities: [{ kind: "match", domain: "Vocabulary", payload: {} }] };
  assert.deepEqual(deriveListeningLab("x-bare", bare), []);
});
