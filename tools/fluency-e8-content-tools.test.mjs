// Phase 6A/6E/6F tools over the authored bank: coverage matrix, printable assessments, data-to-instruction plans and the
// family curriculum. The student paper copy must never carry hints, solutions, rubric samples or feedback; the key must.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { NOT_PRINTABLE, renderAssessment } from "../math/fluency-lab/e8/assessment-print.js";
import { buildClassModel, gradeSkills } from "../math/fluency-lab/e8/class-model.js";
import { coverageMatrix, summarizeBank } from "../math/fluency-lab/e8/coverage.js";
import { planFromClass } from "../math/fluency-lab/e8/data-to-instruction.js";
import { familyCurriculum } from "../math/fluency-lab/e8/family-curriculum.js";
import { buildAssessment } from "../math/fluency-lab/e8/item-engine.js";
import { emptyTutor, findSkill, recordAnswer } from "../math/fluency-lab/tutor-engine.js";

const root = new URL("../math/fluency-lab/content/", import.meta.url);
const standards = JSON.parse(readFileSync(new URL("ccss-k8.json", root), "utf8")).standards;
const bank = [];
for (let g = 0; g <= 8; g += 1) {
  const f = new URL(`items/grade-${g}.json`, root);
  if (existsSync(f)) bank.push(...JSON.parse(readFileSync(f, "utf8")));
}
let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};
const eq = (a, b, m) => {
  assert.deepEqual(a, b, m);
  checks += 1;
};

// ---------------------------------------------------------------- coverage
{
  const cov = coverageMatrix(bank, standards);
  eq(cov.length, standards.length);
  eq(
    cov.reduce((n, r) => n + r.count, 0),
    bank.length,
    "every item is counted under exactly one standard",
  );
  for (const r of cov) {
    ok(r.bare === (r.count === 0));
    ok(!(r.bare && r.thin));
  }
  const sum = summarizeBank(bank, standards);
  eq(sum.items, bank.length);
  eq(
    Object.values(sum.byGrade).reduce((n, g) => n + g.items, 0),
    bank.length,
  );
  eq(sum.reviewed, 0, "nothing is claimed as expert-reviewed");
  ok(sum.conceptual / Math.max(1, sum.items) <= 0.3);
  for (const g of Object.values(sum.byGrade)) eq(g.standardsWithItems + g.bare.length, g.standards);
}

// ---------------------------------------------------------------- printable assessments
{
  let printed = 0;
  for (const [grade, mode] of [
    [1, "quiz"],
    [3, "unit"],
    [5, "quiz"],
    [6, "unit"],
    [8, "unit"],
  ]) {
    const asm = buildAssessment(bank, { mode, grade, seed: 11 });
    if (!asm.items.length) continue;
    const student = renderAssessment(asm, { audience: "student", language: "both" });
    const key = renderAssessment(asm, { audience: "key", language: "en" });
    for (const it of asm.items) {
      if (NOT_PRINTABLE.has(it.type)) continue;
      printed += 1;
      for (const secret of [
        ...it.hints.map((h) => h.en),
        ...(it.solution?.steps || []),
        it.rubric?.sample?.en,
      ].filter(Boolean)) {
        ok(
          !student.includes(secret.replace(/&/g, "&amp;")) || it.stem.en.includes(secret),
          `${it.id}: hint/solution/sample must not be on the student copy`,
        );
      }
      for (const c of it.choices || [])
        if (c.why)
          ok(
            !student.includes(c.why.replace(/&/g, "&amp;")),
            `${it.id}: feedback is not on the student copy`,
          );
      ok(key.includes(it.id), `${it.id}: on the key`);
    }
    // Item stems may be about seconds (a rate problem); the page's own words may not mention a clock.
    const chrome = renderAssessment(
      { ...asm, items: [] },
      { audience: "student", language: "both" },
    );
    ok(
      !/timer|timed|seconds|speed|race/i.test(
        chrome.replace("There is no timer", "").replace("No hay cronómetro", ""),
      ),
      "no timer language in the page's own text",
    );
    ok(student.includes("There is no timer"));
    ok(
      renderAssessment(asm, { audience: "student", language: "es" }).includes("No hay cronómetro"),
    );
    ok(!/<script/i.test(student) && !/url\(/.test(student), "no scripts or images");
  }
  ok(printed > 0 || bank.length < 50);
}

// ---------------------------------------------------------------- data to instruction
{
  const g = 5;
  const skills = gradeSkills(g);
  const k = skills[0].key;
  const learners = ["a", "b", "c", "d"].map((id) => {
    const tutor = emptyTutor();
    for (let i = 0; i < 7; i += 1)
      recordAnswer(
        tutor,
        findSkill(k),
        { correct: i % 3 === 0, independent: true, level: 1, sig: `${id}${i}` },
        Date.now() - (7 - i) * 86400000,
      );
    return { id, label: id.toUpperCase(), tutor };
  });
  const model = buildClassModel(learners, { grade: g });
  const plan = planFromClass(model, bank);
  eq(plan.grade, g);
  eq(plan.reteach.length, model.reteach.length);
  for (const r of plan.reteach) {
    const ids = [...r.launch, ...r.guided, ...r.exit];
    eq(new Set(ids).size, ids.length, "no item is used twice in one plan");
    for (const id of ids)
      ok(bank.find((i) => i.id === id)?.grade === g, "plan items are from the right grade");
    ok(ids.length > 0 || r.note, "a plan with no items says so");
  }
  eq(planFromClass(null, bank).reteach, [], "no class, no plan");
}

// ---------------------------------------------------------------- family curriculum
{
  for (let g = 1; g <= 8; g += 1) {
    const weeks = familyCurriculum(g, standards, bank);
    ok(weeks.length >= 3, `grade ${g}: several routines`);
    for (const w of weeks) {
      ok(
        w.home.en && w.home.es && w.ask.every((q) => q.en && q.es),
        `grade ${g} week ${w.week}: bilingual routine`,
      );
      ok(w.standards.every((s) => s.startsWith(`${g}.`)));
      for (const t of w.talkProblems)
        ok(
          bank.find((i) => i.id === t.id)?.dok <= 2,
          "talk problems are accessible to a family (DOK 1-2)",
        );
    }
    eq(new Set(weeks.map((w) => w.week)).size, weeks.length);
  }
}

console.log(`fluency-e8-content-tools: ${checks} checks passed on ${bank.length} authored items`);
