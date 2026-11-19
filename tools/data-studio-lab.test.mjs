#!/usr/bin/env node
// Data Studio "Deeper tools" (access-teacher/predictive/lab-*.js, view-lab.js): the statistics against known answers,
// the six plain-language models on the synthetic sample class, and the view rendered in JSDOM (empty, too little data,
// full). Pins: results are seeded and repeatable, every tool ends in the four plain lines, and a class too small for a
// tool gets a reason and a next step instead of a number.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><body></body>", {
  url: "https://lab.test/access-teacher/predictive/",
});
for (const k of ["window", "document", "Node", "localStorage", "sessionStorage"])
  globalThis[k] = dom.window[k];

const S = await import("../access-teacher/predictive/lab-stats.js");
const M = await import("../access-teacher/predictive/lab-model.js");
const { demoClass } = await import("../access-teacher/predictive/demo.js");
const { classSummary } = await import("../access-teacher/predictive/interpret.js");
const { adjacentYearPairs } = await import("../access-teacher/predictive/analysis.js");
const { renderLab } = await import("../access-teacher/predictive/view-lab.js");

const approx = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} vs ${b}`);

test("stats: ranks, Spearman and robust z against known answers", () => {
  assert.deepEqual(S.ranks([10, 20, 20, 30]), [1, 2.5, 2.5, 4]);
  approx(S.spearman([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]), 1);
  approx(S.spearman([1, 2, 3, 4, 5], [9, 7, 5, 3, 1]), -1);
  assert.equal(S.spearman([1, 1, 1, 1], [1, 2, 3, 4]), null, "no spread, no answer");
  assert.equal(S.spearman([1, 2, 3], [1, 2, 3]), null, "fewer than 4 students");
  const { z } = S.robustZ([3, 3.1, 2.9, 3, 3.2, 2.8, 6]);
  assert.ok(
    z.at(-1) > 5 && z.slice(0, -1).every((v) => Math.abs(v) < 2),
    "one planted outlier stands out alone",
  );
  assert.deepEqual(S.robustZ([2, 2, 2, 2]).z, [0, 0, 0, 0]);
  assert.equal(S.median([3, 1, 2]), 2);
  assert.equal(S.median([1, 2, 3, 4]), 2.5);
});

test("stats: results are seeded and repeatable", () => {
  const x = [1, 2, 3, 4, 5, 6, 7, 8];
  const y = [2, 1, 4, 3, 6, 5, 8, 7];
  assert.deepEqual(S.spearmanInterval(x, y), S.spearmanInterval(x, y));
  const ci = S.spearmanInterval(x, y);
  assert.ok(ci.lo < S.spearman(x, y) && S.spearman(x, y) < ci.hi + 1e-9);
});

test("stats: k-means recovers two planted groups and the silhouette says they are clear", () => {
  const a = [
    [1, 1, 1, 1],
    [1.2, 1, 1.1, 1],
    [1, 1.2, 1, 1.1],
    [1.1, 1.1, 1.2, 1],
  ];
  const b = [
    [5, 5, 5, 5],
    [5.2, 5, 5.1, 5],
    [5, 5.2, 5, 5.1],
    [5.1, 5.1, 5.2, 5],
  ];
  const fit = S.bestGrouping([...a, ...b]);
  assert.equal(fit.k, 2);
  assert.equal(new Set(fit.assign.slice(0, 4)).size, 1);
  assert.equal(new Set(fit.assign.slice(4)).size, 1);
  assert.notEqual(fit.assign[0], fit.assign[4]);
  assert.ok(fit.silhouette > 0.8);
  assert.deepEqual(S.bestGrouping([...a, ...b]).assign, fit.assign, "same answer twice");
});

test("stats: permutation test is exact for a small class (3 vs 3 -> 2 of 20 shuffles)", () => {
  const t = S.permutationTest([3, 3, 3], [0, 0, 0]);
  assert.equal(t.exact, true);
  approx(t.p, 0.1);
  approx(t.diff, 3);
  assert.equal(t.delta, 1);
  const none = S.permutationTest([1, 2, 3], [1, 2, 3]);
  assert.ok(none.p > 0.9);
});

test("stats: projection line recovers a planted line and sizes its range from leave-one-out misses", () => {
  const xs = [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 2.2, 3.1];
  const ys = xs.map((x, i) => x + 0.5 + (i % 2 ? 0.1 : -0.1));
  const line = S.projectionLine(xs, ys);
  approx(line.slope, 1, 0.1);
  assert.ok(line.half < 0.5, `range ${line.half}`);
  assert.ok(line.typicalMiss < line.naiveMiss, "beats 'no change' when growth is steady");
  assert.equal(S.projectionLine([1, 2, 3], [1, 2, 3]), null, "too few students for a range");
});

const students = demoClass();
const cohort = classSummary(students).groups.find((g) => g.records.length >= 8);
const pair = adjacentYearPairs(students)[0];

test("models: each tool gives a headline and the plain lines on the sample class", () => {
  const rows = M.cohortRows(cohort);
  const all = {
    groups: M.groupsModel(rows),
    together: M.togetherModel(rows),
    unusual: M.unusualModel(rows),
    speed: M.speedModel(pair, "Reading"),
    project: M.projectionModel(students, "Reading"),
    compare: M.compareModel(
      pair,
      "Reading",
      pair.rows.slice(0, 4).map(({ student }) => M.nameOf(student)),
    ),
  };
  for (const [id, m] of Object.entries(all)) {
    assert.equal(m.ok, true, `${id}: ${m.why}`);
    for (const k of ["headline", "plain", "act", "sure"]) {
      assert.ok(m[k]?.length > 10, `${id}.${k}`);
      assert.ok(!/NaN|undefined|Infinity|null/.test(m[k]), `${id}.${k}: ${m[k]}`);
    }
  }
  assert.equal(
    all.project.rows.every(
      (r) => r.lo <= r.predicted && r.predicted <= r.hi && r.lo >= 1 && r.hi <= 6,
    ),
    true,
  );
  assert.ok(all.speed.rows.length >= 8);
  assert.deepEqual(M.groupsModel(rows), all.groups, "repeatable");
});

test("models: a class too small for a tool gets a reason, never a number", () => {
  const tiny = M.cohortRows({ records: cohort.records.slice(0, 3) });
  for (const m of [M.groupsModel(tiny), M.togetherModel(tiny), M.unusualModel(tiny)]) {
    assert.equal(m.ok, false);
    assert.match(m.why, /at least \d+ students/);
  }
  const lone = M.compareModel(pair, "Reading", [M.nameOf(pair.rows[0].student)]);
  assert.equal(lone.ok, false);
  assert.match(lone.why, /at least 2 students/);
});

test("models: a planted unusual profile is the one that gets flagged", () => {
  const rows = Array.from({ length: 8 }, (_, i) => ({
    id: `s${i}`,
    name: `S${i}`,
    v: [3 + (i % 3) * 0.1, 3, 3.1, 3],
  }));
  rows.push({ id: "odd", name: "Odd", v: [3, 3, 1.2, 3] });
  const m = M.unusualModel(rows);
  assert.deepEqual(
    m.flags.map((f) => [f.name, f.domain]),
    [["Odd", "Reading"]],
  );
});

const tick = () => new Promise((r) => setTimeout(r, 5));
function mountLab(ws) {
  const root = document.createElement("div");
  document.body.append(root);
  const draw = () => root.replaceChildren(renderLab(ws));
  ws.rerender = draw;
  draw();
  return root;
}

test("view: empty state, then every tool opens with the plain lines and no broken numbers", async () => {
  const empty = mountLab({ students: [], sub: {}, mode: "real" });
  assert.match(empty.textContent, /No students yet/);

  const ws = { students, sub: {}, mode: "demo" };
  const root = mountLab(ws);
  assert.equal(root.querySelectorAll(".pi-lab-card").length, 6);
  for (const id of ["groups", "together", "unusual", "speed", "project", "compare"]) {
    ws.sub.lab = id;
    ws.rerender();
    await tick();
    const text = root.textContent;
    if (id === "compare") continue; // needs ticked students; covered below
    for (const label of ["What this means", "What to try", "How sure to be"])
      assert.ok(text.includes(label), `${id}: ${label}`);
    assert.ok(text.includes("How this works, in plain words"), id);
    assert.ok(!/NaN|undefined|Infinity/.test(text), `${id}: ${text.slice(0, 300)}`);
  }
});

test("view: picking students for the group comparison updates the answer; too little data explains itself", async () => {
  const ws = { students, sub: { lab: "compare" }, mode: "demo" };
  const root = mountLab(ws);
  assert.match(root.textContent, /Tick at least 2 students to begin/);
  assert.ok(root.querySelectorAll('input[type="checkbox"]').length >= 8);
  for (let i = 0; i < 4; i++) {
    const b = root.querySelectorAll('input[type="checkbox"]')[i];
    b.checked = true;
    b.dispatchEvent(new window.Event("change", { bubbles: true }));
  }
  assert.match(root.textContent, /The group grew/);
  assert.equal(root.querySelectorAll('input[type="checkbox"]:checked').length, 4);

  const few = mountLab({ students: students.slice(0, 2), sub: { lab: "groups" }, mode: "demo" });
  assert.match(few.textContent, /Not enough data for this yet/);
  assert.match(few.textContent, /Sample class/);
});
