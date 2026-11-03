#!/usr/bin/env node
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  assembleSet,
  DEFAULT_THRESHOLDS,
  fadeAdvice,
  nextStep,
  normalizeThresholds,
  skillStatus,
} from "../access-practice-lab/src/acc/adapt/mastery.js";
import { validateSet } from "../access-practice-lab/src/acc/engine/schema.js";

const D = 86400000;
const t0 = Date.UTC(2026, 10, 2);
const row = (o) => ({
  learner: "L",
  domain: "Reading",
  klu: "Explain",
  context: "Science",
  status: "scored",
  correct: true,
  independent: true,
  supportTier: 0,
  attempts: 1,
  t: t0,
  itemId: "x",
  ...o,
});

test("thresholds are clamped and keep low below strong", () => {
  assert.deepEqual(normalizeThresholds(), DEFAULT_THRESHOLDS);
  const t = normalizeThresholds({ minItems: 99, minDays: 0, strongPct: 60, lowPct: 95 });
  assert.equal(t.minItems, 10);
  assert.equal(t.minDays, 1);
  assert.ok(t.lowPct < t.strongPct);
  assert.deepEqual(normalizeThresholds({ minItems: "abc" }).minItems, 3);
});

test("secure needs independent first-try wins on different items AND different days", () => {
  const th = DEFAULT_THRESHOLDS;
  const sameDay = [1, 2, 3].map((i) => row({ itemId: `i${i}` }));
  assert.equal(skillStatus(sameDay, th).status, "building", "three wins on one day is not secure");
  const repeatItem = [
    row({ itemId: "a" }),
    row({ itemId: "a", t: t0 + D }),
    row({ itemId: "a", t: t0 + 2 * D }),
  ];
  assert.equal(
    skillStatus(repeatItem, th).status,
    "building",
    "one item repeated is not three items",
  );
  const good = [
    row({ itemId: "a" }),
    row({ itemId: "b", t: t0 + D }),
    row({ itemId: "c", t: t0 + D }),
  ];
  assert.equal(skillStatus(good, th).status, "secure");
  const supported = good.map((r) => ({ ...r, independent: false, supportTier: 2 }));
  assert.notEqual(
    skillStatus(supported, th).status,
    "secure",
    "supported success never counts as mastery",
  );
});

test("needs-support appears only after enough attempts and below the low line; speaking rows (correct null) are ignored", () => {
  const misses = [1, 2, 3].map((i) => row({ itemId: `m${i}`, correct: false, independent: false }));
  assert.equal(skillStatus(misses).status, "needs-support");
  assert.equal(skillStatus(misses.slice(0, 2)).status, "building");
  assert.equal(skillStatus([row({ correct: null, status: "needs-review" })]).status, "not-started");
});

test("fade advice follows recent independence", () => {
  assert.equal(fadeAdvice([row({ itemId: "a" }), row({ itemId: "b", t: t0 + 1 })]).advice, "fade");
  assert.equal(
    fadeAdvice([
      row({ independent: false, supportTier: 1 }),
      row({ independent: false, supportTier: 2, t: t0 + 1 }),
    ]).advice,
    "try-independent",
  );
  assert.equal(
    fadeAdvice([row({ correct: false }), row({ correct: false, t: t0 + 1 })]).advice,
    "return-supports",
  );
  assert.equal(fadeAdvice([row()]).advice, "keep");
});

test("nextStep picks the weakest skill and offers unseen items, preferring unseen parallel groups", () => {
  const rows = [1, 2, 3].map((i) =>
    row({ itemId: `s${i}`, correct: false, independent: false, parallel: "pg1" }),
  );
  const bank = [
    {
      id: "s1",
      setId: "A",
      domain: "Reading",
      klu: "Explain",
      context: "Science",
      parallel: "pg1",
    },
    {
      id: "n1",
      setId: "A",
      domain: "Reading",
      klu: "Explain",
      context: "Science",
      parallel: "pg1",
    },
    {
      id: "n2",
      setId: "B",
      domain: "Reading",
      klu: "Explain",
      context: "Science",
      parallel: "pg2",
    },
    { id: "z", setId: "B", domain: "Writing", klu: "Argue", context: "Science" },
  ];
  const s = nextStep(rows, bank);
  assert.equal(s.kind, "reteach");
  assert.deepEqual(
    s.items.map((i) => i.itemId),
    ["n2"],
    "an unseen parallel group is preferred over a repeat of the seen group",
  );
  assert.match(s.reason, /Reading · Explain · Science/);
  assert.equal(nextStep([], bank).kind, "explore");
});

test("assembleSet namespaces stimuli, keeps items intact and produces a valid set from real bank files", () => {
  const dir = new URL("../access-practice-lab/content/bank/", import.meta.url);
  const files = readdirSync(dir).filter((f) => /^b\d+-/.test(f));
  const sets = ["b35-read-01", "b35-read-02"].map((id) =>
    JSON.parse(readFileSync(new URL(`${id}.json`, dir), "utf8")),
  );
  assert.ok(files.length >= 40);
  const picks = [
    { setId: sets[0].id, itemId: sets[0].items[0].id },
    { setId: sets[1].id, itemId: sets[1].items[0].id },
    { setId: "nope", itemId: "x" },
  ];
  const custom = assembleSet(sets, picks, { id: "custom-test", title: "Mine" });
  assert.equal(custom.items.length, 2);
  assert.ok(custom.items.every((i) => custom.stimuli.some((s) => s.id === i.stimulus)));
  assert.equal(new Set(custom.stimuli.map((s) => s.id)).size, custom.stimuli.length);
  assert.deepEqual(custom.items[0].meta, sets[0].items[0].meta);
  assert.equal(validateSet(custom).ok, true, JSON.stringify(validateSet(custom).errors));
  assert.equal(assembleSet(sets, [{ setId: "nope", itemId: "x" }]), null);
});
