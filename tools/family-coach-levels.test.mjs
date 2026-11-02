// Family Coach contract: every practice problem has three levels (Ask, Show, Explain),
// each in English and Spanish, written for that problem. Ask and Show never introduce
// the correct choice (a value the question itself does not already contain), and no
// two problems in one lesson share an Ask line.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { familyCoachLevels } from "../scripts/lib/homework-problems.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const dir = join(REPO_ROOT, "data/family-homework-notes");
const lessons = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f) => ({ id: f.slice(0, -5), data: JSON.parse(readFileSync(join(dir, f), "utf8")) }));

// The correct answer, as a visible string, for a multiple-choice item.
const correctText = (it) => String(it.choices?.[it.correctIndex] ?? "").trim();
const mentions = (text, answer) => {
  if (!answer) return false;
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^0-9.])${escaped}($|[^0-9])`).test(text);
};

test("every practice problem has Ask, Show and Explain in both languages", () => {
  for (const { id, data } of lessons) {
    for (const it of data.basicPractice || []) {
      const levels = familyCoachLevels(it, "");
      for (const level of ["ask", "show", "explain"]) {
        assert.ok(levels[level].en.trim(), `${id}: ${level} EN is empty`);
        assert.ok(levels[level].es.trim(), `${id}: ${level} ES is empty`);
      }
    }
  }
});

test("Ask and Show never introduce the correct choice", () => {
  const leaks = [];
  for (const { id, data } of lessons) {
    for (const [index, it] of (data.basicPractice || []).entries()) {
      const answer = correctText(it);
      const stem = `${it.stem || ""} ${it.stemEs || ""}`;
      if (!answer || mentions(stem, answer)) continue;
      const levels = familyCoachLevels(it, "");
      for (const level of ["ask", "show"]) {
        if (mentions(levels[level].en, answer) || mentions(levels[level].es, answer)) {
          leaks.push(`${id} #${index + 1} ${level}: "${answer}"`);
        }
      }
    }
  }
  assert.deepEqual(leaks, [], `answer leaks at Ask or Show:\n${leaks.join("\n")}`);
});

test("Ask lines differ from one problem to the next within a lesson", () => {
  const repeats = [];
  for (const { id, data } of lessons) {
    const seen = new Map();
    for (const [index, it] of (data.basicPractice || []).entries()) {
      const ask = familyCoachLevels(it, "").ask.en;
      if (seen.has(ask)) repeats.push(`${id} #${index + 1} repeats #${seen.get(ask)}`);
      else seen.set(ask, index + 1);
    }
  }
  assert.deepEqual(repeats, [], `generic Ask lines:\n${repeats.join("\n")}`);
});
