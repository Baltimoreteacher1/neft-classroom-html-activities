// BCPSS Year Pathways and Family Bridge: the derived views must agree with the canonical seed, never with themselves.
// Run: node functions/bcpss-pathways.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as seed from "../data/bcpss-curriculum-seed.mjs";
import { onRequest as familyGuideApi } from "./api/bcpss/family-guide/[unitId].js";
import { onRequest as pathwaysApi } from "./api/bcpss/pathways.js";
import { buildFamilyGuide, FAMILY_LABS } from "./_lib/bcpss/family-guide.js";
import { buildGradePathway, buildMoveAtlas, buildPathwayIndex, normalizeGrade, unitRoute } from "./_lib/bcpss/pathways.js";

let failed = 0;
const t = async (name, fn) => {
  try {
    await fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL  ${name}\n      ${err.message}`);
  }
};

const UNITS = seed.BCPSS_UNITS;
const UNIT = new Map(UNITS.map((u) => [u.id, u]));
const CONN = new Map(seed.UNIT_CONNECTIONS.map((c) => [c.unit_id, c]));
const get = async (handler, path, params = {}) => handler({ request: new Request(`https://x${path}`), env: {}, params });

await t("grade tokens are normalised and anything else is rejected", () => {
  assert.equal(normalizeGrade(" k "), "K");
  assert.equal(normalizeGrade("8"), "8");
  for (const bad of ["9", "0", "", null, undefined, "six", "6; DROP"]) assert.equal(normalizeGrade(bad), null, String(bad));
  assert.equal(buildGradePathway("9"), null);
});

await t("every grade's year map holds exactly the seed's units, ordered by content area then unit number", () => {
  let total = 0;
  for (const grade of seed.GRADES) {
    const g = buildGradePathway(grade);
    const ids = g.lanes.flatMap((l) => l.units.map((u) => u.id));
    const expected = UNITS.filter((u) => u.grade === grade).map((u) => u.id);
    assert.deepEqual([...ids].sort(), [...expected].sort(), `grade ${grade}`);
    assert.equal(g.stats.units, expected.length);
    assert.deepEqual(g.lanes.map((l) => l.subject), seed.SUBJECTS);
    for (const lane of g.lanes) {
      assert.deepEqual(lane.units.map((u) => u.unit_number), lane.units.map((u) => u.unit_number).sort((a, b) => a - b));
      for (const u of lane.units) assert.equal(UNIT.get(u.id).subject, lane.subject);
    }
    total += ids.length;
  }
  assert.equal(total, UNITS.length);
});

await t("each unit row carries its own blueprint, frame, vocabulary and a route that names the unit", () => {
  for (const u of UNITS) {
    const row = buildGradePathway(u.grade).lanes.flatMap((l) => l.units).find((r) => r.id === u.id);
    const conn = CONN.get(u.id);
    assert.equal(row.blueprint_id, conn.blueprint_id);
    assert.equal(row.frame, conn.unit_example_frame);
    assert.deepEqual(row.terms.map((x) => x.term), conn.tier2_tier3_vocab.map((v) => v.term));
    const url = new URL(row.route, "https://x");
    assert.equal(url.pathname, "/bcpss-teachers");
    assert.equal(url.searchParams.get("unitId"), u.id);
    assert.equal(url.searchParams.get("grade"), u.grade);
    assert.equal(url.searchParams.get("subject"), u.subject);
  }
  assert.ok(unitRoute(UNITS[0], "activities").includes("tab=activities"));
});

await t("a shared move is only claimed where 2+ content areas really use that blueprint", () => {
  let moves = 0;
  for (const grade of seed.GRADES) {
    const g = buildGradePathway(grade);
    for (const m of g.shared_moves) {
      moves += 1;
      assert.ok(m.subjects.length >= 2, `${grade} ${m.blueprint_id}`);
      assert.deepEqual([...new Set(m.units.map((u) => u.subject))].sort(), [...m.subjects].sort());
      for (const u of m.units) {
        assert.equal(UNIT.get(u.unit_id).grade, grade);
        assert.equal(CONN.get(u.unit_id).blueprint_id, m.blueprint_id);
      }
      // ...and no genuinely shared move was left out.
      const users = UNITS.filter((x) => x.grade === grade && CONN.get(x.id).blueprint_id === m.blueprint_id);
      assert.equal(users.length, m.units.length);
    }
    const grouped = new Map();
    for (const u of UNITS.filter((x) => x.grade === grade)) {
      const id = CONN.get(u.id).blueprint_id;
      grouped.set(id, (grouped.get(id) || new Set()).add(u.subject));
    }
    assert.equal(g.shared_moves.length, [...grouped.values()].filter((s) => s.size > 1).length, `grade ${grade} count`);
  }
  assert.ok(moves > 0);
});

await t("sentence puzzles are the unit's own mentor sentence: chunks rejoin it in order, with roles intact", () => {
  let puzzles = 0;
  for (const grade of seed.GRADES) {
    for (const p of buildGradePathway(grade).puzzles) {
      puzzles += 1;
      const dive = CONN.get(p.unit_id).mentor_sentence_unpacking;
      assert.equal(p.sentence, dive.mentor_sentence);
      assert.equal(p.chunks.map((c) => c.text).join(" ").replace(/\s+/g, " "), dive.mentor_sentence.replace(/\s+/g, " "));
      assert.deepEqual(p.chunks.map((c) => c.role), dive.chunks.map((c) => c.role));
      assert.ok(p.chunks.every((c) => c.text && c.role && c.question));
    }
  }
  assert.equal(puzzles, UNITS.length);
});

await t("the word wall never invents a cognate: Spanish appears only where the seed has one", () => {
  for (const grade of seed.GRADES) {
    for (const w of buildGradePathway(grade).word_wall) {
      const v = CONN.get(w.unit_id).tier2_tier3_vocab.find((x) => x.term === w.term);
      assert.ok(v, `${w.term} exists in ${w.unit_id}`);
      assert.equal(w.es, v.cognate_es || null);
    }
  }
});

await t("the move atlas places every unit exactly once, under its own move and grade", () => {
  const atlas = buildMoveAtlas();
  const seen = new Map();
  for (const m of atlas.moves) {
    for (const step of m.journey) {
      for (const e of step.entries) {
        assert.equal(CONN.get(e.unit_id).blueprint_id, m.blueprint_id);
        assert.equal(UNIT.get(e.unit_id).grade, step.grade);
        seen.set(e.unit_id, (seen.get(e.unit_id) || 0) + 1);
      }
    }
    assert.equal(m.unit_count, m.journey.reduce((n, s) => n + s.entries.length, 0));
  }
  assert.equal(seen.size, UNITS.length);
  assert.ok([...seen.values()].every((n) => n === 1));
  assert.deepEqual(atlas.spiral.map((s) => s.subject), seed.SUBJECTS);
  for (const s of atlas.spiral) {
    assert.deepEqual(s.grades.map((g) => g.grade), seed.GRADES);
    for (const g of s.grades) assert.equal(g.units, UNITS.filter((u) => u.grade === g.grade && u.subject === s.subject).length);
  }
});

await t("the pathways API serves index, grade and atlas, rejects bad input, and is edge-cacheable", async () => {
  const index = await get(pathwaysApi, "/api/bcpss/pathways");
  assert.equal(index.status, 200);
  assert.equal((await index.json()).grades.length, seed.GRADES.length);
  const grade = await get(pathwaysApi, "/api/bcpss/pathways?grade=k");
  assert.equal(grade.status, 200);
  assert.match(grade.headers.get("cache-control"), /s-maxage/);
  assert.equal((await grade.json()).grade, "K");
  assert.equal((await get(pathwaysApi, "/api/bcpss/pathways?view=atlas")).status, 200);
  assert.equal((await get(pathwaysApi, "/api/bcpss/pathways?grade=9")).status, 400);
  assert.equal((await get(pathwaysApi, "/api/bcpss/pathways?view=zzz")).status, 400);
  assert.equal((await pathwaysApi({ request: new Request("https://x/api/bcpss/pathways", { method: "POST" }), env: {} })).status, 405);
  assert.equal(buildPathwayIndex().grades.reduce((n, g) => n + g.units, 0), UNITS.length);
});

await t("every unit has a family guide: its own starter, cognate words, the four practice labs and consistent neighbours", () => {
  for (const u of UNITS) {
    const g = buildFamilyGuide(u.id);
    assert.equal(g.unit.id, u.id);
    assert.equal(g.starter, CONN.get(u.id).unit_example_frame);
    assert.ok(g.starter.length > 10);
    assert.deepEqual(g.words.map((w) => w.term), CONN.get(u.id).tier2_tier3_vocab.map((v) => v.term));
    assert.deepEqual(g.labs.map((l) => l.key), FAMILY_LABS.map((l) => l.key));
    for (const lab of g.labs) assert.ok(lab.url.startsWith("/access-practice-lab/") && lab.url.includes(`bcpssUnit=${u.id}`));
    if (g.neighbours.next) {
      assert.equal(buildFamilyGuide(g.neighbours.next.id).neighbours.prev.id, u.id);
      assert.equal(UNIT.get(g.neighbours.next.id).subject, u.subject);
      assert.equal(UNIT.get(g.neighbours.next.id).grade, u.grade);
    }
  }
  assert.equal(buildFamilyGuide("nope"), null);
});

await t("every family card has real English and Spanish text (the page reads family_card.translations_json)", () => {
  for (const c of seed.FAMILY_CARDS) {
    for (const lang of ["en", "es"]) {
      const e = c.translations_json[lang];
      assert.ok(e.title && e.summary && e.dinner_question && e.key_words.length, `${c.unit_id} ${lang}`);
    }
  }
});

await t("the family-guide API validates ids and returns 404 for unknown units", async () => {
  assert.equal((await get(familyGuideApi, "/x", { unitId: "g6-math-u1" })).status, 200);
  assert.equal((await get(familyGuideApi, "/x", { unitId: "nope-nope" })).status, 404);
  assert.equal((await get(familyGuideApi, "/x", { unitId: "../etc/passwd" })).status, 400);
  assert.equal((await get(familyGuideApi, "/x", { unitId: "" })).status, 400);
});

await t("the hub and the activity viewer no longer preselect Grade 6 Math", () => {
  const hub = readFileSync(new URL("../bcpss-teachers/bcpss-teachers.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../bcpss-teachers/index.html", import.meta.url), "utf8");
  const viewer = readFileSync(new URL("../bcpss-teachers/activity/activity-view.js", import.meta.url), "utf8");
  assert.match(hub, /const state = \{[^}]*grade: "",\s*subject: "",/s);
  assert.doesNotMatch(html, /data-grade="6" aria-pressed="true"|data-subject="Math" aria-pressed="true"|<option value="6" selected>|<option value="Math" selected>/);
  assert.doesNotMatch(viewer, /g6-math-u2|DEFAULT_UNIT_ID/);
  const units = readFileSync(new URL("./api/bcpss/units.js", import.meta.url), "utf8");
  assert.doesNotMatch(units, /\|\| "6"|\|\| "Math"/);
});

if (failed) {
  console.error(`\nbcpss-pathways: ${failed} check(s) failed.`);
  process.exit(1);
}
console.log("\nbcpss-pathways: all checks passed.");
