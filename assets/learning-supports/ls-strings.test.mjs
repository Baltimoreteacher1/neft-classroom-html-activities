// Every word a student sees in the Learning Supports has a Spanish sibling that
// was written, not copied.
import assert from "node:assert/strict";
import test from "node:test";
import { line, STRINGS } from "./ls-strings.js";

const slots = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("every string has English and Spanish", () => {
  for (const [key, { en, es }] of Object.entries(STRINGS)) {
    assert.ok(en.trim(), `${key}: English is empty`);
    assert.ok(es.trim(), `${key}: Spanish is empty`);
  }
});

test("Spanish is not the English copied over", () => {
  // These are the same word in both languages on purpose.
  const same = new Set(["speedNormal"]);
  for (const [key, { en, es }] of Object.entries(STRINGS)) {
    if (!same.has(key)) assert.notEqual(es, en, `${key}: Spanish equals English`);
  }
});

test("both languages fill in the same blanks", () => {
  for (const [key, { en, es }] of Object.entries(STRINGS)) {
    assert.deepEqual(slots(en), slots(es), `${key}: blanks differ between languages`);
  }
});

test("line() fills the blanks in both languages", () => {
  assert.deepEqual(line("focusBar", { n: 2, total: 5 }), {
    en: "Problem 2 of 5",
    es: "Problema 2 de 5",
  });
  assert.throws(() => line("nope"), /Unknown learning-support string/);
});

test("nothing tells a student to hurry or scores them", () => {
  for (const { en, es } of Object.values(STRINGS)) {
    for (const text of [en, es]) assert.doesNotMatch(text, /\b(timer|countdown|score|fast!|hurry|rápido!)\b/i);
  }
});
