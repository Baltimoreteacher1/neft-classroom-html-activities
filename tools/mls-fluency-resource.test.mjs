import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { exportKey, exportResource } from "../access-practice-lab/src/mls/export/index.js";
import { fluencyForSkill } from "../access-practice-lab/src/mls/fluency-map.js";
import { buildFluencyResource } from "../access-practice-lab/src/mls/fluency-resource.js";
import { mergeSkill } from "../access-practice-lab/src/mls/merge.js";
import { renderVisual } from "../access-practice-lab/src/mls/visuals.js";
import { generateProblem, getSkill, seededRandom } from "../math/fluency-lab/problem-bank.js";

const read = (path) =>
  JSON.parse(readFileSync(new URL(`../access-practice-lab/content/mls/${path}`, import.meta.url)));
const inventory = read("inventory.json").skills;
const content = new Map(
  Array.from({ length: 8 }, (_, i) => read(`skills/g${i + 1}.json`).skills)
    .flat()
    .map((skill) => [skill.id, skill]),
);
const skills = inventory.map((skill) => mergeSkill(skill, content.get(skill.id)));
const questions = (res) => res.sections.flatMap((s) => s.blocks).filter(({ t }) => t === "problem");

test("mapped worksheets reproduce the shared bank and preserve difficulty across language choices", () => {
  const seed = 913;
  const grades = new Set();
  for (const skill of skills) {
    for (const entry of fluencyForSkill(skill.id)) {
      const r = buildFluencyResource(skill, entry, { seed, count: 8 });
      const other = buildFluencyResource(skill, entry, { seed, count: 8, band: "1-2" });
      const ps = questions(r);
      assert.deepEqual(ps, questions(other), skill.id);
      assert.deepEqual(r.key, other.key, skill.id);
      assert.equal(ps.length, 8);
      const source = generateProblem(
        getSkill(entry.grade, entry.id),
        seededRandom(seed * 1009 + 1),
      );
      assert.equal(ps[0].ask, source.question);
      assert.deepEqual(r.key[0].work, source.steps);
      assert.ok(r.key[0].answer.startsWith(String(source.displayAnswer)), entry.id);
      for (const p of ps) {
        assert.equal(p.answer, undefined);
        assert.equal(p.correct, undefined);
        if (p.visual) assert.match(renderVisual(p.visual).svg, /<svg/);
      }
      grades.add(skill.grade);
    }
  }
  assert.equal(grades.size, 8);
});

test("a question seed override reproduces the replacement and removing keeps the other questions", () => {
  const skill = skills.find((s) => s.id === "g6.ratios");
  const [entry] = fluencyForSkill(skill.id);
  const options = { seed: 42, count: 3, pseed: { "0:2": 98765 } };
  const r = buildFluencyResource(skill, entry, options);
  const ps = questions(r);
  const next = buildFluencyResource(skill, entry, { ...options, hide: [1] });
  assert.notEqual(ps[1].ask, questions(buildFluencyResource(skill, entry, { seed: 42 }))[1].ask);
  assert.deepEqual(
    questions(next).map((p) => p.ask),
    ps.slice(1).map((p) => p.ask),
  );
  assert.deepEqual(
    next.key.map((k) => k.answer),
    r.key.slice(1).map((k) => k.answer),
  );
});

test("student exports omit teacher answers in all four formats", async () => {
  const skill = skills.find((s) => s.id === "g6.ratios");
  const [entry] = fluencyForSkill(skill.id);
  const r = buildFluencyResource(skill, entry, { seed: 25, count: 3 });
  const marker = "unique_teacher_key_marker";
  r.key[0].answer = marker;
  for (const fmt of ["print", "html", "docx", "pptx"]) {
    const student = await exportResource(r, fmt, { renderVisual });
    const teacher = await exportKey(r, fmt, { renderVisual });
    assert.ok(student.blob.length > 0, fmt);
    assert.equal(Buffer.from(student.blob).includes(marker), false, fmt);
    assert.equal(Buffer.from(teacher.blob).includes(marker), true, fmt);
    if (fmt === "html") assert.match(student.text, /id="mls-data">\{\}<\/script>/);
  }
});
