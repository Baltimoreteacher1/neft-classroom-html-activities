/**
 * Book Studio grade-band programs (access-practice-lab/src/book/programs.js, rubrics.js, template-bands.js):
 *   - every program has five stages and four craft moves, each in English and Spanish (Spanish not a copy)
 *   - every featured template exists; every band resolves to a program, every 6-8 layer to a shared template
 *   - every band x key language use has a four-item self-check with unique ids
 */
import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

const BOOK = join(REPO_ROOT, "access-practice-lab/src/book");
const { PROGRAMS, programFor, bookBand, clusterForBand, EDITOR_STAGE_MAP } = await import(
  join(BOOK, "programs.js")
);
const { rubricFor } = await import(join(BOOK, "rubrics.js"));
const { templateForBand, BAND_LAYER_IDS } = await import(join(BOOK, "template-bands.js"));
const { templateById } = await import(join(BOOK, "templates.js"));

const bilingual = (v, where) => {
  assert.ok(v?.en?.trim() && v?.es?.trim(), `${where}: needs en and es`);
  assert.notEqual(v.en, v.es, `${where}: Spanish is a copy of the English`);
};

test("each program is complete and bilingual", () => {
  for (const [id, p] of Object.entries(PROGRAMS)) {
    assert.equal(p.stages.length, 5, `${id} stages`);
    assert.equal(p.craft.length, 4, `${id} craft`);
    for (const k of ["name", "grades", "eyebrow", "lead"]) bilingual(p[k], `${id}.${k}`);
    p.stages.forEach((s, i) => {
      bilingual(s, `${id}.stage${i}`);
      bilingual(s.do, `${id}.stage${i}.do`);
      bilingual(s.frame, `${id}.stage${i}.frame`);
    });
    p.craft.forEach((c, i) => {
      bilingual(c.tip, `${id}.craft${i}.tip`);
      bilingual(c.mentor, `${id}.craft${i}.mentor`);
    });
    for (const t of p.featured) assert.ok(templateById(t), `${id} features unknown template ${t}`);
  }
});

test("bands resolve to programs, clusters and stage guides", () => {
  assert.equal(programFor("6-8").band, "6-8");
  assert.equal(programFor("3-5").band, "3-5");
  for (const b of ["K", "1", "2-3"]) assert.equal(programFor(b).band, "K-2");
  assert.equal(bookBand({ gradeCluster: "4-5" }, "6-8"), "3-5");
  assert.equal(bookBand({ gradeCluster: "" }, "6-8"), "6-8");
  assert.equal(clusterForBand("3-5"), "4-5");
  for (const idx of Object.values(EDITOR_STAGE_MAP))
    for (const i of idx) assert.ok(i >= 0 && i < 5);
});

test("every band and key language use has a four-item self-check", () => {
  for (const band of ["K", "3-5", "6-8"])
    for (const use of ["Narrate", "Inform", "Explain", "Argue", ""]) {
      const r = rubricFor(band, use);
      assert.equal(r.length, 4, `${band}/${use}`);
      assert.equal(new Set(r.map((x) => x.id)).size, 4, `${band}/${use} ids`);
      r.forEach((x) => bilingual(x, `${band}/${use}/${x.id}`));
    }
});

test("the 6-8 template layer covers shared templates and stays bilingual", () => {
  assert.ok(BAND_LAYER_IDS.length >= 19);
  for (const id of BAND_LAYER_IDS) {
    const t = templateById(id);
    assert.ok(t, `unknown template ${id}`);
    assert.ok(t.grades.includes("3-5") && t.grades.includes("6-8"), `${id} is not shared`);
    const g = templateForBand(t, "6-8");
    bilingual(g.finished, `${id}.finished`);
    assert.ok(g.targets.length >= 3);
    g.targets.forEach((x, i) => bilingual(x, `${id}.target${i}`));
    assert.ok(g.wordBank.length >= 8);
    assert.notDeepEqual(g.wordBank, t.wordBank, `${id} 6-8 word bank equals 3-5`);
    assert.equal(templateForBand(t, "3-5"), t, "3-5 keeps the template as written");
  }
});
