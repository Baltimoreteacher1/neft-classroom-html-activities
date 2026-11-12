// Living Mathematics Studio home (math/fluency-lab/atelier/): the hero sculptures must state true mathematics for
// every reachable setting, the mastery landscape must place every grade's skills on screen without collisions and
// report honest states, and switching grade must give quests for the grade on screen without replacing earned work.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "sessionStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });

const lab = new URL("../math/fluency-lab/", import.meta.url);
const load = (path) => import(new URL(path, lab));
const S = await load("atelier/sculpture.js");
const { landscapeLayout, landscapeState } = await load("atelier/home.js");
const { emptyTutor, findSkill, recordAnswer } = await load("tutor-engine.js");
const Q = await load("moby/quests.js");
const { GRADE_SYSTEM } = await load("e8/grade-system.js");

let passed = 0;
const check = (name, fn) => {
  try {
    fn();
    passed += 1;
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
};

check("grade bands cover K-8 once each", () => {
  const seen = Object.values(S.BANDS)
    .flat()
    .sort((a, b) => a - b);
  assert.deepEqual(seen, [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(S.bandFor(1), "early");
  assert.equal(S.bandFor(4), "discover");
  assert.equal(S.bandFor(6), "design");
  assert.equal(S.bandFor(8), "analyze");
});

check("make ten: counters are conserved and the first frame fills to exactly ten", () => {
  for (let a = 1; a <= 9; a += 1)
    for (let b = 1; b <= 9; b += 1) {
      const r = S.makeTen(a, b);
      assert.equal(r.sum, a + b);
      assert.equal(r.fill + r.rest, b);
      if (r.crosses) assert.equal(a + r.fill, 10);
      else assert.equal(r.rest, 0);
    }
});

check("equivalent fractions are exact and include the fraction itself", () => {
  const dens = [2, 3, 4, 5, 6, 8, 10, 12];
  for (const q of dens)
    for (let p = 1; p <= q; p += 1) {
      const list = S.equivalents(p, q, dens);
      assert.ok(
        list.some((e) => e.n === p && e.d === q),
        `${p}/${q} missing itself`,
      );
      for (const e of list) assert.equal(e.n * q, p * e.d, `${e.n}/${e.d} != ${p}/${q}`);
      for (const d of dens)
        if ((p * d) % q === 0)
          assert.ok(
            list.some((e) => e.d === d),
            `${p}/${q} misses /${d}`,
          );
    }
});

check("ratio points are equal ratios inside the grid", () => {
  for (let a = 1; a <= 6; a += 1)
    for (let b = 1; b <= 6; b += 1) {
      const pts = S.ratioPoints(a, b, 12);
      assert.deepEqual(pts[0], { k: 0, x: 0, y: 0 });
      assert.ok(pts.length >= 3);
      for (const p of pts) {
        assert.equal(p.x * b, p.y * a);
        assert.ok(p.x <= 12 && p.y <= 12);
      }
    }
});

check("line lattice points lie on the line and slopes are reduced", () => {
  for (const [n, d] of [
    [-2, 1],
    [-3, 2],
    [-1, 2],
    [0, 1],
    [1, 2],
    [3, 2],
    [2, 1],
    [4, 6],
  ]) {
    const { rise, run } = S.slopeParts(n, d);
    assert.equal(rise * d, n * run);
    assert.ok(run > 0);
    for (let b = -4; b <= 4; b += 1)
      for (const p of S.lineLattice(rise, run, b, 6)) assert.equal(p.y * run, rise * p.x + b * run);
  }
});

check("notation: true minus sign, unambiguous coefficients", () => {
  assert.equal(S.fractionText(-1, 1), "−1");
  assert.equal(S.fractionText(3, 2), "3/2");
  assert.equal(S.xTerm(1, 1), "x");
  assert.equal(S.xTerm(-1, 1), "−x");
  assert.equal(S.xTerm(2, 1), "2x");
  assert.equal(S.xTerm(3, 2), "(3/2)x");
  assert.equal(S.xTerm(-1, 2), "(−1/2)x");
});

check("landscape state words are honest", () => {
  assert.equal(landscapeState({ attempted: false, lessonCompleted: false, state: "new" }), "new");
  assert.equal(
    landscapeState({ attempted: false, lessonCompleted: true, state: "new" }),
    "developing",
  );
  assert.equal(landscapeState({ attempted: true, due: false, state: "learning" }), "developing");
  assert.equal(landscapeState({ attempted: true, due: false, state: "mastered" }), "secure");
  assert.equal(landscapeState({ attempted: true, due: true, state: "mastered" }), "revisiting");
});

check("every grade's landscape places each skill once, on screen, with neighbours apart", () => {
  for (let grade = 0; grade <= 8; grade += 1) {
    const { nodes, edges } = landscapeLayout(grade, emptyTutor(), 0);
    assert.ok(nodes.length > 0, `grade ${grade} has no skills`);
    assert.equal(new Set(nodes.map((n) => n.key)).size, nodes.length);
    for (const n of nodes) {
      assert.ok(n.x >= 0 && n.x <= 1 && n.y >= 0 && n.y <= 1, `grade ${grade} ${n.key} off screen`);
      assert.equal(n.state, "new", "an empty record must read as not started");
    }
    const spots = new Set(nodes.map((n) => `${n.x.toFixed(3)}|${n.y}`));
    assert.equal(spots.size, nodes.length, `grade ${grade} has two skills on one spot`);
    // Skills on one terrain row sit at least four trail steps apart, so labels cannot touch.
    for (let i = 1; i < nodes.length; i += 1)
      for (let j = Math.max(0, i - 3); j < i; j += 1) assert.notEqual(nodes[i].y, nodes[j].y);
    const keys = new Set(nodes.map((n) => n.key));
    for (const e of edges) assert.ok(keys.has(e.from) && keys.has(e.to));
  }
});

check("landscape reflects saved evidence", () => {
  const tutor = emptyTutor();
  const skill = findSkill("4:place-value") || landscapeLayout(4, tutor, 0).nodes[0].skill;
  recordAnswer(tutor, skill, { correct: true, independent: true, level: 1 }, 1_000);
  const node = landscapeLayout(4, tutor, 2_000).nodes.find((n) => n.skill === skill);
  assert.equal(node.state, "developing");
});

check("switching grade before any quest progress gives quests for the new grade", () => {
  const now = Date.UTC(2026, 10, 3, 15);
  const first = Q.dayQuests(Q.emptyQuests(), emptyTutor(), 1, now);
  const g1 = first.state.days[Object.keys(first.state.days)[0]].quests.filter((q) => q.skillKey);
  assert.ok(g1.length && g1.every((q) => findSkill(q.skillKey)?.grade === 1));
  const second = Q.dayQuests(first.state, emptyTutor(), 4, now);
  const g4 = second.state.days[Object.keys(second.state.days)[0]].quests.filter((q) => q.skillKey);
  assert.ok(
    g4.length && g4.every((q) => findSkill(q.skillKey)?.grade === 4),
    "quests stayed on grade 1",
  );
});

check("quests that carry progress are never replaced by a grade switch", () => {
  const now = Date.UTC(2026, 10, 3, 15);
  const first = Q.dayQuests(Q.emptyQuests(), emptyTutor(), 1, now);
  const day = Object.keys(first.state.days)[0];
  const quest = first.state.days[day].quests[0];
  const step = Object.keys(quest.progress)[0];
  quest.progress[step].have = 1;
  const after = Q.dayQuests(first.state, emptyTutor(), 4, now);
  assert.equal(after.state.days[day].quests[0].id, quest.id);
  assert.equal(after.state.days[day].quests[0].progress[step].have, 1);
});

check("the early type-scale script mirrors the grade system", () => {
  const html = readFileSync(new URL("lab.html", lab), "utf8");
  const table = html.match(/var scale = (\{[^}]+\})/)?.[1];
  assert.ok(table, "lab.html lost the early scale script");
  const early = JSON.parse(table.replace(/(\d+):/g, '"$1":'));
  const fromSystem = Object.fromEntries(
    Object.entries(GRADE_SYSTEM).map(([grade, p]) => [grade, p.scaleRem]),
  );
  assert.deepEqual(early, fromSystem);
});

console.log(`fluency-atelier: ${passed} checks passed`);
