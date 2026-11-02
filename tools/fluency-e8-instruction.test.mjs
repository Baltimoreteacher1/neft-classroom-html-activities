// Phase 6C/6D: explanations, discussion prompts, language supports, misconception diagnosis and intervention, checked
// against EVERY authored item. Layers must exist in both languages, models must be real, a diagnosis must only point at
// a misconception the author tagged, and a correct answer must never create evidence of a misconception.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { emptyE8 } from "../math/fluency-lab/e8/e8-store.js";
import {
  buildExplanation,
  diagnoseResponse,
  discoursePrompts,
  interventionPlan,
  interventionSummary,
  LAYERS,
  languageSupports,
  MODEL_FOR_REPRESENTATION,
  recordItemEvidence,
} from "../math/fluency-lab/e8/instruction-engine.js";
import { checkResponse } from "../math/fluency-lab/e8/item-engine.js";
import { misconceptionById } from "../math/fluency-lab/e8/misconception-library.js";
import { getModel } from "../math/fluency-lab/e8/models.js";

const dir = new URL("../math/fluency-lab/content/items/", import.meta.url);
const bank = [];
for (let g = 0; g <= 8; g += 1) {
  const f = new URL(`grade-${g}.json`, dir);
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
const hasBoth = (o) =>
  o && typeof o.en === "string" && o.en.trim() && typeof o.es === "string" && o.es.trim();

for (const model of new Set(Object.values(MODEL_FOR_REPRESENTATION)))
  ok(getModel(model), `representation model ${model} exists`);

for (const item of bank) {
  const ex = buildExplanation(item);
  eq(
    ex.layers.map((l) => l.id),
    [...LAYERS],
    `${item.id}: the five layers, in order`,
  );
  for (const layer of ex.layers) {
    ok(hasBoth(layer.title), `${item.id}/${layer.id}: bilingual title`);
    ok(hasBoth(layer.body), `${item.id}/${layer.id}: bilingual body`);
  }
  const picture = ex.layers.find((l) => l.id === "picture");
  if (picture.model)
    ok(getModel(picture.model), `${item.id}: picture model ${picture.model} is real`);
  const prompts = discoursePrompts(item);
  ok(prompts.length >= 2 && prompts.every(hasBoth), `${item.id}: discussion prompts`);
  ok(
    prompts.every((p) => !/\d/.test(p.en)),
    `${item.id}: prompts never contain numbers that could be the answer`,
  );
  const lang = languageSupports(item);
  ok(lang.frames.every(hasBoth) && hasBoth(lang.note), `${item.id}: language supports`);
  ok(lang.chunks.length >= 1, `${item.id}: stem chunks for read-aloud`);
  if (item.dok === 3) ok(prompts.length >= 3, `${item.id}: DOK 3 asks for more than recall`);
}

// Diagnosis: only wrong answers, only unambiguous, only from authored feedback.
let diagnosed = 0;
let tagged = 0;
for (const item of bank) {
  if (item.type === "mc") {
    const key = item.answer.correct;
    const right = checkResponse(item, key);
    eq(diagnoseResponse(item, key, right), null, `${item.id}: a right answer is never diagnosed`);
    const e8 = emptyE8();
    eq(recordItemEvidence(e8, item, key, right).recorded, false);
    eq(
      Object.keys(e8.misconceptions.items).length,
      0,
      `${item.id}: a right answer records nothing`,
    );
    for (const c of item.choices.filter((x) => x.id !== key)) {
      const bad = checkResponse(item, c.id);
      const dx = diagnoseResponse(item, c.id, bad);
      const ids = (item.misconceptions || []).filter((id) => misconceptionById(id));
      if (dx) {
        diagnosed += 1;
        ok(
          c.why && ids.length === 1 && dx.id === ids[0],
          `${item.id}: a diagnosis points at the single tagged misconception`,
        );
        eq(dx.confidence, "possible", "one miss is only a possibility");
      } else if (ids.length) tagged += 1;
    }
  }
}
ok(diagnosed > 0 || bank.length < 50, "some wrong choices carry a diagnosis");
console.log(
  `  ${diagnosed} wrong choices point at a tagged misconception; ${tagged} are left undiagnosed because the evidence is ambiguous`,
);

// Evidence accumulation and intervention using a real tagged item.
{
  const pool = bank.filter(
    (i) =>
      i.type === "mc" &&
      (i.misconceptions || []).filter(misconceptionById).length === 1 &&
      i.choices.some((c) => c.id !== i.answer.correct && c.why),
  );
  if (pool.length >= 3) {
    const byId = Map.groupBy(pool, (i) => i.misconceptions.find(misconceptionById));
    const [id, items] = [...byId.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    const e8 = emptyE8();
    const NOW = Date.parse("2026-11-02T15:00:00Z");
    const DAY = 86400000;
    items.slice(0, 4).forEach((item, i) => {
      const pick = item.choices.find((c) => c.id !== item.answer.correct && c.why).id;
      const r = recordItemEvidence(e8, item, pick, checkResponse(item, pick), NOW - (4 - i) * DAY);
      ok(r.recorded, "a wrong, explained choice records evidence");
    });
    const plan = interventionPlan(e8, { bank, grade: items[0].grade, now: NOW });
    if (items.length >= 3) {
      ok(
        plan.some((p) => p.id === id),
        "a repeated pattern appears in the intervention plan",
      );
      const entry = plan.find((p) => p.id === id);
      eq(
        entry.steps.map((s) => s.id),
        ["notice", "see", "idea", "practice", "recheck"],
      );
      ok(
        entry.steps.every((s) => hasBoth(s.text)),
        "plan steps are bilingual",
      );
      ok(
        entry.steps
          .find((s) => s.id === "practice")
          .items.every((iid) => bank.find((b) => b.id === iid)?.misconceptions.includes(id)),
        "practice items are tagged for this very slip",
      );
      ok(entry.recheckAfter > NOW);
    }
    const summary = interventionSummary(e8);
    ok(summary.seen >= 1 && hasBoth(summary.note));
    ok(!/caus(ed|es) by (the|our)/i.test(summary.note.en), "the summary makes no causal claim");
  }
  eq(interventionPlan(emptyE8(), { bank }), [], "no evidence, no plan");
}

console.log(`fluency-e8-instruction: ${checks} checks passed on ${bank.length} authored items`);
