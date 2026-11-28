// Math Literacy Studio: model, language, search and store invariants (node:test; runs in `npm test`).
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lab = (p) => pathToFileURL(path.join(ROOT, "access-practice-lab/src/mls", p)).href;
const C = path.join(ROOT, "access-practice-lab/content/mls");
const inv = JSON.parse(fs.readFileSync(path.join(C, "inventory.json"), "utf8"));
const { mergeSkill } = await import(lab("merge.js"));
const M = await import(lab("model.js"));
const S = await import(lab("search.js"));
const L = await import(lab("lang.js"));
const R = await import(lab("roles.js"));
const content = new Map();
for (let g = 1; g <= 8; g++)
  for (const s of JSON.parse(fs.readFileSync(path.join(C, `skills/g${g}.json`), "utf8")).skills)
    content.set(s.id, s);
const skills = inv.skills.map((s) => mergeSkill(s, content.get(s.id)));
M.registerSkills(skills);
const sk = (id) => skills.find((s) => s.id === id);

test("inventory is the locked denominator and every skill has authored content", () => {
  assert.equal(inv.skills.length, 85);
  assert.equal(inv.roles.length, 30);
  assert.equal(content.size, 85);
  for (const s of skills) assert.ok(s.vocab.length >= 4, s.id);
});

test("merged skill keeps the generator id apart from the caregiver text", () => {
  const s = sk("g6.ratios");
  assert.equal(s.familyId, "ratio");
  assert.equal(typeof s.family.en.learning, "string");
});

test("every role has a real builder or launch, and builds for a sample skill", () => {
  for (const r of inv.roles) assert.ok(R.ROLE_MAP[r.id], `role ${r.id} is mapped`);
  const rows = R.roleCoverage(sk("g3.fractions"), inv.roles, M.buildResource);
  assert.deepEqual(
    rows.filter((x) => !x.ok),
    [],
  );
});

test("language band never changes the mathematics", () => {
  for (const id of ["g1.addsub", "g4.fracops", "g6.ratios", "g8.slope"]) {
    const ans = (b) =>
      M.buildResource(sk(id), "worksheet", { math: 2, band: b, seed: 5, count: 8 })
        .sections.flatMap((s) => s.blocks)
        .filter((x) => x.t === "problem" && x.answer != null)
        .map((x) => x.answer);
    assert.deepEqual(ans("1-2"), ans("5-6"), id);
    assert.deepEqual(ans("1-2"), ans("3-4"), id);
  }
});

test("the three bands change the words, and presets change only the dials", () => {
  const a = M.buildResource(sk("g6.ratios"), "worksheet", { support: "more" });
  const b = M.buildResource(sk("g6.ratios"), "worksheet", { support: "extension" });
  assert.equal(a.meta.mathLevel, 2);
  assert.equal(b.meta.mathLevel, 3);
  assert.equal(a.meta.langBand, "1-2");
  assert.equal(b.meta.langBand, "5-6");
  assert.ok(M.diffResources(a, b).length > 2);
  // "More support" must not drop the mathematics to an earlier grade: the family and params are the same
  assert.equal(a.meta.family, b.meta.family);
  const custom = M.buildResource(sk("g6.ratios"), "worksheet", { support: "more", math: 3 });
  assert.equal(
    custom.meta.mathLevel,
    3,
    "math level can be set independently of the support preset",
  );
});

test("builds are deterministic, edits and regeneration address the right problem", () => {
  const a = M.buildResource(sk("g3.muldiv"), "worksheet", { seed: 4 });
  const b = M.buildResource(sk("g3.muldiv"), "worksheet", { seed: 4 });
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  const first = a.sections.flatMap((s) => s.blocks).find((x) => x.t === "problem" && x.n > 0);
  const regen = M.buildResource(sk("g3.muldiv"), "worksheet", {
    seed: 4,
    pseed: { [`${first.tag}:${first.idx}`]: 777 },
  });
  const after = regen.sections.flatMap((s) => s.blocks).find((x) => x.t === "problem" && x.n > 0);
  assert.notEqual(after.ask + after.stem, first.ask + first.stem);
  const hidden = M.buildResource(sk("g3.muldiv"), "worksheet", { seed: 4, hide: [1] });
  const count = (r) =>
    r.sections.flatMap((s) => s.blocks).filter((x) => x.t === "problem" && x.n > 0).length;
  assert.equal(count(hidden), count(a) - 1);
  const edited = M.applyEdits(a, {
    title: "My title",
    problems: { [`${first.tag}:${first.idx}`]: { ask: "Custom?", answer: "99" } },
  });
  assert.equal(edited.title, "My title");
  assert.equal(edited.key.find((k) => k.ref === "Problem 1").answer, "99");
  const withDir = M.applyEdits(a, { directions: "Work with a partner." });
  assert.equal(withDir.sections[0].heading, "Directions from your teacher");
  assert.match(JSON.stringify(withDir.sections[0]), /Work with a partner/);
  assert.equal(
    M.applyEdits(withDir, { directions: "Again." }).sections.filter(
      (x) => x.heading === "Directions from your teacher",
    ).length,
    1,
  );
});

test("every resource type builds for every grade with sections, a key where there are problems, and no broken text", () => {
  for (const id of [
    "g1.count",
    "g2.money",
    "g3.areaperim",
    "g4.angles",
    "g5.volume",
    "g6.percents",
    "g7.probability",
    "g8.pythagorean",
  ]) {
    for (const type of M.RESOURCE_TYPES) {
      const r = M.buildResource(sk(id), type, { support: "standard" });
      assert.ok(r.sections.length > 0, `${id} ${type}`);
      assert.ok(!/undefined|NaN|\[object/.test(JSON.stringify(r)), `${id} ${type} has broken text`);
      const probs = r.sections
        .flatMap((s) => s.blocks)
        .filter((x) => x.t === "problem" && x.n > 0 && x.answer != null);
      if (probs.length) assert.ok(r.key.length >= probs.length, `${id} ${type} key`);
    }
  }
});

test("student pages never carry answers or teacher notes", () => {
  const r = M.buildResource(sk("g6.ratios"), "mini-assessment", {});
  const studentText = JSON.stringify(
    r.sections.map((s) => s.blocks.filter((b) => b.t !== "problem")),
  );
  assert.ok(!/Teacher notes|Answer key/i.test(studentText));
  assert.ok(r.notes.length > 0);
});

test("sequences cover the seven lengths and a full lesson has the twelve required steps", () => {
  for (const q of inv.sequences)
    assert.ok(M.sequenceSteps(sk("g5.fracops"), q.id).length > 0, q.id);
  assert.equal(M.sequenceSteps(sk("g5.fracops"), "lesson").length, 12);
  assert.equal(
    M.sequenceSteps(sk("g5.fracops"), "warmup5").reduce((a, s) => a + s.minutes, 0),
    5,
  );
});

test("packets join resources with keys and page breaks", () => {
  const a = M.buildResource(sk("g2.addsub"), "worksheet", {});
  const b = M.buildResource(sk("g2.addsub"), "exit-ticket", {});
  const p = M.packetResource([a, b], "Packet");
  assert.equal(p.key.length, a.key.length + b.key.length);
  assert.ok(p.sections.some((s) => s.blocks.some((x) => x.t === "pagebreak")));
});

test("search understands ordinary teacher language", () => {
  const idx = JSON.parse(fs.readFileSync(path.join(C, "index.json"), "utf8")).skills;
  const p = S.parseQuery("Sixth-grade ratio word problems for English learners");
  assert.equal(p.grade, 6);
  assert.deepEqual(p.types, ["word-problems"]);
  assert.equal(p.support, "more-language");
  const r = S.searchResources(idx, "Sixth-grade ratio word problems for English learners");
  assert.equal(r.results[0].skill.id, "g6.ratios");
  assert.equal(r.results[0].type, "word-problems");
  assert.equal(S.parseQuery("Five-minute math literacy warm-up").minutes, 5);
  assert.equal(S.parseQuery("grade 3 multiplication intervention").grade, 3);
  assert.equal(S.parseQuery("4th grade fractions").grade, 4);
  const g = S.searchResources(idx, "Eighth-grade slope writing task").results.slice(0, 5);
  assert.ok(g.every((x) => x.skill.grade === 8) && g.some((x) => x.type === "writing-task"));
  const none = S.searchResources(idx, "zzzz qqqq");
  assert.ok(
    none.results.length > 0 && none.note,
    "no exact match still returns recommendations with an explanation",
  );
});

test("sentence checks look at shape only", () => {
  const ok = L.checkSentence(
    "The ratios are equivalent because both quantities were multiplied by three.",
    { kind: "because", targets: ["equivalent ratios"] },
  );
  assert.equal(ok.ok, true);
  const bad = L.checkSentence("They are same", { kind: "because", targets: ["equivalent ratios"] });
  assert.equal(bad.ok, false);
  assert.ok(bad.notes.length >= 2);
});

test("the workspace stores recipes, not student data, and never throws without storage", async () => {
  globalThis.localStorage = undefined;
  const Store = await import(lab("store.js"));
  Store.reset();
  const r = Store.recipe("g6.ratios", "worksheet", { support: "more" });
  Store.remember(r);
  const item = Store.saveResource(r, "A saved sheet");
  assert.equal(Store.load().saved.length, 1);
  const copy = Store.duplicateResource(item.id);
  assert.match(copy.name, /copy/);
  const col = Store.newCollection("Week 1");
  Store.addToCollection(col.id, item.id);
  assert.deepEqual(Store.load().collections[0].items, [item.id]);
  Store.removeSaved(item.id);
  assert.deepEqual(Store.load().collections[0].items, []);
  assert.ok(!JSON.stringify(Store.load()).match(/student|name":"[A-Z][a-z]+ [A-Z]/i));
});
