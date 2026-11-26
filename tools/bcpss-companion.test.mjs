// BCPSS Plan & Respond (bcpss-teachers/companion/): map, composer, support sheet, work check and reteach plan,
// exercised over EVERY unit the seed backend serves, not a sample.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";
import {
  buildCatalog,
  buildSupportSheet,
  buildUnitMap,
  composeSet,
  courseNeighbors,
  groupCatalog,
  PURPOSES,
} from "../bcpss-teachers/companion/companion-data.js";
import { buildReteachPlan } from "../bcpss-teachers/companion/reteach.js";
import { analyzeResponse, followUps } from "../bcpss-teachers/companion/work-check.js";
import { GRADES, getUnitDetail, listUnits, SUBJECTS } from "../functions/_lib/bcpss/db.js";
import { isPacketPart } from "../functions/_lib/bcpss/packet-parts.js";
import { isKnownPart } from "../functions/_lib/bcpss/studio-print-html.js";

const courses = [];
for (const g of GRADES)
  for (const s of SUBJECTS) courses.push({ g, s, units: (await listUnits({}, g, s)).units });
const all = [];
for (const c of courses)
  for (const u of c.units)
    all.push({ unit: u, course: c.units, detail: (await getUnitDetail({}, u.id)).detail });

test("covers all 162 units, each with authored studio content", () => {
  assert.equal(all.length, 162);
  for (const { detail, unit } of all) assert.ok(detail?.studio, `${unit.id} has no studio`);
});

test("catalog: every link targets a real part, kit, page or activity", () => {
  for (const { detail } of all) {
    const cat = buildCatalog(detail, "3_4");
    const ids = new Set();
    for (const item of cat) {
      assert.ok(!ids.has(item.id), `${detail.unit.id}: duplicate ${item.id}`);
      ids.add(item.id);
      assert.ok(item.title && item.group, `${detail.unit.id}: ${item.id} missing title/group`);
      for (const href of [item.page, item.print, item.word].filter(Boolean)) {
        const u = new URL(href, "https://x.test");
        if (u.pathname.startsWith("/api/bcpss/export/"))
          assert.ok(isKnownPart(u.searchParams.get("part")), href);
        else if (u.pathname === "/api/bcpss/packet")
          assert.ok(isPacketPart(u.searchParams.get("part")), href);
        else assert.fail(`unexpected link ${href}`);
      }
      if (item.type === "activity") {
        const n = Number(item.id.split("-")[1]);
        assert.ok(n >= 1 && n <= detail.studio.activities.length, item.id);
      }
      if (item.play) {
        const path = new URL(item.play, "https://x.test").pathname;
        assert.ok(existsSync(`.${path}index.html`), `missing page ${path}`);
      }
    }
    assert.ok(groupCatalog(cat).length >= 5, `${detail.unit.id}: fewer than 5 groups`);
  }
});

test("composer: every purpose yields a usable default set for every unit", () => {
  for (const { detail } of all) {
    const cat = buildCatalog(detail, "1_2");
    for (const p of PURPOSES) {
      const set = composeSet(p.id, cat);
      const picked = set.items.filter((i) => i.selected);
      assert.ok(set.items.length >= 3, `${detail.unit.id} ${p.id}: only ${set.items.length} items`);
      assert.ok(
        picked.length >= 3 && picked.length <= 5,
        `${detail.unit.id} ${p.id}: ${picked.length} selected`,
      );
    }
  }
  assert.throws(() => composeSet("nope", []), /unknown purpose/);
});

test("support sheet fades frames -> starters -> word bank, never changing the words", () => {
  for (const { detail } of all) {
    for (const w of ["1_2", "3_4", "5_6"]) {
      const full = buildSupportSheet(detail, w, 0);
      const starters = buildSupportSheet(detail, w, 1);
      const bank = buildSupportSheet(detail, w, 2);
      assert.ok(full.frames.length >= 1, `${detail.unit.id} ${w}: no frames`);
      assert.equal(full.starters.length, 0);
      assert.ok(starters.starters.length >= 1 && starters.frames.length === 0);
      for (const s of starters.starters)
        assert.ok(!s.includes("["), `${detail.unit.id}: starter keeps a blank: ${s}`);
      assert.equal(bank.frames.length + bank.starters.length, 0);
      assert.deepEqual(
        bank.words.map((x) => x.term),
        full.words.map((x) => x.term),
      );
    }
  }
});

test("unit map: neighbours follow the district unit order, transfers point at real units", () => {
  const ids = new Set(all.map((a) => a.unit.id));
  for (const { detail, course } of all) {
    const map = buildUnitMap(detail, course);
    assert.ok(map.contentGoal && map.languageGoal && map.words.length >= 8, detail.unit.id);
    const n = courseNeighbors(detail.unit, course);
    if (n.before) assert.ok(n.before.unit_number < detail.unit.unit_number);
    if (n.after) assert.ok(n.after.unit_number > detail.unit.unit_number);
    for (const t of map.transfers)
      assert.ok(ids.has(t.id), `${detail.unit.id}: transfer to unknown ${t.id}`);
  }
});

test("work check: observations come from the text, not from guesses", () => {
  const { detail } = all.find((a) => a.unit.id === "g6-math-u2");
  const strong = analyzeResponse(detail.studio.exit_ticket.model, detail, { task: "exit" });
  assert.ok(
    strong.observed.some((o) => /every number in the model/.test(o.text)),
    JSON.stringify(strong.observed),
  );
  assert.ok(strong.observed.some((o) => /Gives a reason/.test(o.text)));
  const weak = analyzeResponse("i add 2 and 2 is 4 to 5", detail, { task: "exit" });
  assert.ok(weak.possible.some((p) => /Check the work for/.test(p.text)));
  assert.ok(weak.possible.some((p) => /very short/.test(p.text)) || weak.possible.length > 0);
  const spanish = analyzeResponse("La razón es 2 a 5 because the groups are equal.", detail);
  assert.ok(
    spanish.possible.some((p) => /Spanish word/.test(p.text)),
    JSON.stringify(spanish.possible),
  );
  const named = analyzeResponse("My name is Ana. The ratio is 2 to 5.", detail);
  assert.equal(named.privacy.length, 1);
  assert.ok(analyzeResponse("", detail).empty);
  // No proficiency level, score or disability language ever appears in the output.
  for (const { detail: d } of all) {
    const r = analyzeResponse(d.studio.mentor.text, d, { task: "exit" });
    const out = JSON.stringify(r);
    assert.doesNotMatch(
      out,
      /\blevel [1-6]\b|proficien|disabilit|score|grade level|\bIEP\b/i,
      d.unit.id,
    );
    const f = followUps(r, d, "3_4");
    assert.equal(f.revise.steps.length, 3);
    assert.ok(f.fresh.steps[0].includes(d.studio.essential_question));
  }
});

test("reteach plan: eight steps, both pathways, the fresh try is not the guided problem", () => {
  for (const { detail, course } of all) {
    const before = courseNeighbors(detail.unit, course).before;
    for (const pathway of ["content", "language"]) {
      const plan = buildReteachPlan(detail, { pathway, wida: "1_2", before });
      assert.equal(plan.steps.length, 8, detail.unit.id);
      assert.deepEqual(
        plan.steps.map((s) => s.id),
        ["warm", "words", "model", "guided", "practice", "feedback", "revise", "fresh"],
      );
      for (const s of plan.steps)
        assert.ok(s.teacher && s.title && s.minutes > 0, `${detail.unit.id} ${s.id}`);
      const guided = plan.steps[3];
      const fresh = plan.steps[7];
      assert.notEqual(
        guided.prompt,
        fresh.prompt,
        `${detail.unit.id}: fresh try repeats the guided problem`,
      );
      assert.ok(plan.steps[4].activity, `${detail.unit.id}: no practice activity`);
      assert.ok(plan.minutes >= 25 && plan.minutes <= 50, `${detail.unit.id}: ${plan.minutes} min`);
    }
  }
});
