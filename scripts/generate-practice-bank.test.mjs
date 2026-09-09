// Contract test for the public practice-bank export (consumed by ~/math-ready).
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildBank,
  domainOf,
  FOUNDATIONS,
  isTypableAnswer,
  normalizeCode,
  serializeBank,
} from "./generate-practice-bank.mjs";

const TYPES = [
  "ebsr",
  "multi-select",
  "written-error",
  "multiple-choice",
  "find-error",
  "open-response",
  "fill-table",
];

test("normalizeCode maps crosswalk ids to lesson-config codes", () => {
  assert.equal(normalizeCode("6.AT.A.3.a"), "6.AT.3a");
  assert.equal(normalizeCode("6.NOS.B.7"), "6.NOS.7");
  assert.equal(normalizeCode("MPP.3"), "MPP.3");
  assert.equal(domainOf("6.DS.6c"), "DS");
  assert.equal(domainOf("5.NF.B.4"), FOUNDATIONS);
});

const bank = buildBank();

test("bank is deterministic", () => {
  assert.equal(serializeBank(buildBank()), serializeBank(bank));
});

test("bank exports every renderable type and nothing invented", () => {
  assert.ok(bank.items.length >= 1000, `expected ≥1000 items, got ${bank.items.length}`);
  for (const t of TYPES) assert.ok(bank.counts.byType[t] > 0, `no items of type ${t}`);
  const types = new Set(bank.items.map((i) => i.type));
  assert.deepEqual([...types].sort(), [...TYPES].sort());
  assert.ok(bank.counts.byTier.mstar >= 140, "authored MSTAR items missing");
});

test("every item is well-formed and traceable to a lesson", () => {
  const ids = new Set();
  for (const it of bank.items) {
    assert.ok(!ids.has(it.id), `duplicate id ${it.id}`);
    ids.add(it.id);
    assert.ok(bank.lessons[it.lesson], `${it.id}: unknown lesson`);
    assert.ok(bank.standards[it.standard], `${it.id}: unknown standard ${it.standard}`);
    assert.ok(bank.domains[bank.standards[it.standard].domain], `${it.id}: unknown domain`);
    if (it.type === "multiple-choice") assert.ok(it.choices[it.correctIndex] !== undefined);
    if (it.type === "find-error") assert.ok(it.steps[it.errorStep] !== undefined);
    if (it.type === "multi-select")
      assert.ok(it.correctIndices.every((i) => it.options[i] !== undefined));
    if (it.type === "ebsr")
      assert.ok(it.partA.choices[it.partA.correctIndex] && it.partB.choices[it.partB.correctIndex]);
    if (it.type === "written-error") assert.ok(it.modelAnswer && it.rubric.score2);
    if (it.type === "open-response") assert.ok(it.modelAnswer);
  }
});

test("no Spanish fields or empty strings leak into the bank", () => {
  const walk = (v, path) => {
    if (Array.isArray(v)) return v.forEach((x, i) => walk(x, `${path}[${i}]`));
    if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        assert.ok(!/Es$/.test(k), `Spanish field ${path}.${k}`);
        walk(x, `${path}.${k}`);
      }
    }
  };
  walk(bank.items, "items");
  for (const it of bank.items) {
    const stem = it.type === "ebsr" ? it.partA.stem : it.stem || it.scenario || it.steps?.[0]?.work;
    assert.ok(stem, `${it.id}: empty stem`);
  }
});

/* ── fill-table ──────────────────────────────────────────────────────────── */

const tables = bank.items.filter((i) => i.type === "fill-table");

test("fill-table exports only tables whose blanks the lesson authored", () => {
  assert.ok(tables.length >= 80, `expected ≥80 fill-table items, got ${tables.length}`);
  for (const it of tables) {
    assert.ok(it.stem, `${it.id}: no prompt`);
    assert.ok(it.columns.length >= 2, `${it.id}: needs ≥2 columns`);
    assert.ok(it.rows.length >= 1, `${it.id}: no rows`);
    for (const row of it.rows) {
      assert.equal(row.length, it.columns.length, `${it.id}: row width != columns`);
    }
    assert.ok(it.blanks.length >= 1, `${it.id}: no blanks to fill`);
  }
});

test("every blank is inside the table, empty on the page, and answerable", () => {
  for (const it of tables) {
    for (const b of it.blanks) {
      assert.ok(b.row >= 0 && b.row < it.rows.length, `${it.id}: blank row out of range`);
      assert.ok(b.col >= 0 && b.col < it.columns.length, `${it.id}: blank col out of range`);
      // The answer must not be sitting in the cell the student is asked to fill.
      assert.equal(it.rows[b.row][b.col], "", `${it.id}: blank cell is not empty`);
      assert.ok(isTypableAnswer(b.answer), `${it.id}: answer is not typable: ${b.answer}`);
    }
    const seen = new Set(it.blanks.map((b) => `${b.row},${b.col}`));
    assert.equal(seen.size, it.blanks.length, `${it.id}: duplicate blank coordinates`);
  }
});

test("a prose answer is deferred rather than string-matched against a student", () => {
  assert.ok(isTypableAnswer("4"));
  assert.ok(isTypableAnswer("$0.75 per game"));
  assert.ok(isTypableAnswer("9:15"));
  assert.ok(!isTypableAnswer("Median — the outlier 50 pulls the mean to 19.2, which is higher"));
  assert.ok(!isTypableAnswer("Both work — no outlier, data is symmetric"));
  assert.ok(!isTypableAnswer(""));
});

test("tables sharing a fallback prompt are kept apart by their own table", () => {
  // Eleven tables carry their setup in the first row and share the stem
  // "Complete the table."; keying dedupe on text alone discarded ten of them.
  const fallback = tables.filter((t) => t.stem === "Complete the table.");
  assert.ok(
    fallback.length >= 8,
    `expected the prompt-less tables to survive, got ${fallback.length}`,
  );
  const shapes = new Set(fallback.map((t) => JSON.stringify([t.columns, t.rows])));
  assert.equal(shapes.size, fallback.length, "distinct tables were deduped as one");
});
