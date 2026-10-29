// Unit 4 Test Practice: the answer keys are recomputed here from the stems' own numbers, every
// string has English and Spanish, and the generated pages and hub links are current.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { CHALLENGE, PRACTICE, STRANDS } from "../data/unit4-test-practice.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const near = (a, b) => Math.abs(a - b) < 1e-6;

/** Independent keys: item id -> the value a student should enter, worked out from the stem. */
const KEYS = {
  "p-tape-1": (100 / 5) * 3,
  "p-tape-2": (100 / 4) * 3,
  "p-tape-3": (100 / 8) * 5,
  "p-combine-1": 0.45 * 100 + 100 / 4,
  "p-combine-2": (3 / 5) * 100 + 15,
  "p-part-1": (17 / 20) * 100,
  "p-part-2": (18 / 25) * 100,
  "p-part-3": (12 / 15) * 100,
  "p-of-1": 0.55 * 240,
  "p-of-2": 0.35 * 80,
  "p-of-3": 1.25 * 64,
  "p-of-4": 0.06 * 450,
  "p-whole-1": 96 / 3,
  "p-whole-3": 15 / 0.12,
  "p-combine2-1": ((8 + 17) / (10 + 40)) * 100,
  "p-combine2-2": ((21 + 9) / (30 + 20)) * 100,
  "c-tape-1": (100 / 4) * 9,
  "c-tape-2": 100 / 8,
  "c-tape-3": (100 / 5) * 7,
  "c-combine-1": 85 + 60 + 25,
  "c-combine-2": (1 / 8) * 100 + 0.045 * 100 + (2 / 5) * 100,
  "c-part-1": (3 / 8) * 100,
  "c-part-2": (7 / 40) * 100,
  "c-part-3": (9 / 6) * 100,
  "c-of-1": 0.125 * 360,
  "c-of-2": 1.75 * 48,
  "c-of-3": 0.005 * 800,
  "c-whole-1": 90 / 2.5,
  "c-whole-2": 6 / 0.005,
  "c-whole-3": 64 / 0.8,
  "c-combine2-1": ((11 + 19 + 14) / (20 + 30 + 50)) * 100,
  "c-combine2-2": ((18 + 12) / (24 + 36)) * 100,
};
/** Multiple choice: the option text that must be the single correct one. */
const MC = {
  "p-whole-2": 18 / 0.25,
  "p-whole-4": 84 / 0.7,
  "p-estimate-1": "50%",
  "p-estimate-2": "75%",
  "c-whole-4": 52 / 0.65,
  "c-estimate-1": "25%",
  "c-estimate-2": "$12",
};
/** Choose-all: the exact set of correct option indexes, from checking each pair. */
const MULTI = {
  "p-equiv-1": [0, 2, 4],
  "p-equiv-2": [0, 1, 3],
  "c-equiv-1": [0, 2, 3, 5],
  "c-equiv-2": [0, 2, 3, 5],
};
const CR = {
  "p-cr-1": {
    steps: [0.75 * 200, 0.8 * 180, 0.75 * 200 - 0.8 * 180],
    truth: 0.75 * 200 - 0.8 * 180 >= 20,
  },
  "p-cr-2": { steps: [400, 0.5 * 400], truth: Math.abs(203 - 200) <= 10 },
  "c-cr-1": {
    steps: [1.25 * 140, 0.8 * 360, 0.8 * 360 - 1.25 * 140],
    truth: 0.8 * 360 - 1.25 * 140 >= 100,
  },
  "c-cr-2": { steps: [0.75 * 480, 0.5 * 480], truth: Math.abs(290 - 0.75 * 480) <= 30 },
};

const all = [...PRACTICE, ...CHALLENGE];

test("every item has an independent key and agrees with it", () => {
  for (const it of all) {
    if (it.type === "num" || it.type === "tape") {
      assert.ok(it.id in KEYS, `${it.id} has no independent key`);
      assert.ok(near(it.answer, KEYS[it.id]), `${it.id}: ${it.answer} !== ${KEYS[it.id]}`);
    } else if (it.type === "mc") {
      assert.ok(it.id in MC, `${it.id} has no independent key`);
      const right = it.options.filter((o) => o.ok);
      assert.equal(right.length, 1, `${it.id} needs exactly one correct option`);
      const want = MC[it.id];
      if (typeof want === "number")
        assert.ok(near(Number(right[0].text), want), `${it.id} correct option`);
      else assert.equal(right[0].text, want, `${it.id} correct option`);
    } else if (it.type === "multi") {
      const got = it.options.flatMap((o, i) => (o.ok ? [i] : []));
      assert.deepEqual(got, MULTI[it.id], `${it.id} correct set`);
    } else {
      const k = CR[it.id];
      assert.ok(k, `${it.id} has no independent key`);
      it.steps.forEach((s, i) => assert.ok(near(s.answer, k.steps[i]), `${it.id} step ${i}`));
      assert.equal(it.claim.truth, k.truth, `${it.id} claim`);
    }
  }
});

test("a wrong-answer note never states the right answer as the answer to the trap", () => {
  for (const it of all) {
    for (const t of it.traps ?? []) {
      assert.ok(!near(t.value, it.answer), `${it.id}: a trap equals the answer`);
    }
  }
});

test("ids are unique and every strand is declared", () => {
  assert.equal(new Set(all.map((i) => i.id)).size, all.length);
  for (const it of all) assert.ok(it.strand in STRANDS, `${it.id} strand`);
});

test("every { en, es } pair is written in both languages and Spanish is not a copy", () => {
  const seen = [];
  const walk = (v, path) => {
    if (v && typeof v === "object") {
      if (typeof v.en === "string" && "es" in v) seen.push([path, v]);
      for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
    }
  };
  walk({ PRACTICE, CHALLENGE, STRANDS }, "");
  assert.ok(seen.length > 150, "sweep too small");
  for (const [path, v] of seen) {
    assert.ok(v.en.trim() && v.es.trim(), `${path} missing a language`);
    const numbersOnly = !/[A-Za-z]{3}/.test(v.en) || v.en.length <= 8; // numerals and cognates such as "Club"
    if (!numbersOnly) assert.notEqual(v.en, v.es, `${path} Spanish is a copy`);
  }
});

test("both pages are current and the hub links them", () => {
  execFileSync("node", ["scripts/generate-unit4-test-practice.mjs", "--check"], { cwd: ROOT });
  const hub = readFileSync(join(ROOT, "curriculum/units/index.html"), "utf8");
  assert.ok(hub.includes('href="/curriculum/unit-4-test-practice/"'));
  assert.ok(hub.includes('href="/curriculum/unit-4-test-practice-challenge/"'));
});
