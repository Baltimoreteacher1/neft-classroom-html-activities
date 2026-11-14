#!/usr/bin/env node
/**
 * "Rehearsal that adapts": routing in src/lang/rehearsal-route.js, checked against the real practice forms and the
 * lab's own level A / level C Speaking and Writing content. Also pins the honesty rules: no tier, level, score or
 * placement on a learner surface, and the fixed modes stay the default.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { findModelStudent } from "../access-practice-lab/src/lang/model-student.js";
import {
  adaptiveEligible,
  buildRoute,
  chooseRoute,
  modelLine,
  pickPromptIds,
  ROUTE_MIN_ITEMS,
  routedTest,
  routeTeacherText,
} from "../access-practice-lab/src/lang/rehearsal-route.js";

const lab = (p) => new URL(`../access-practice-lab/${p}`, import.meta.url);
const json = (p) => JSON.parse(readFileSync(lab(p), "utf8"));
const poolsFor = (band) => {
  const pick = (d) => {
    const data = json(`content/g${band}/${d}.json`);
    return { A: data.levels.A.activities, C: data.levels.C.activities };
  };
  return { Speaking: pick("Speaking"), Writing: pick("Writing") };
};
const lr = (right, total) =>
  Array.from({ length: total }, (_, i) => ({
    domain: i % 2 ? "Reading" : "Listening",
    scored: true,
    right: i < right,
  }));
const FULL = ["g35-form-a", "g35-form-b", "model-form-a", "model-form-b", "model-form-c"];

test("routing uses Listening and Reading only, and needs enough answers", () => {
  assert.equal(chooseRoute(lr(10, 12)).set, "demanding");
  assert.equal(chooseRoute(lr(3, 12)).set, "supported");
  assert.equal(
    chooseRoute(lr(ROUTE_MIN_ITEMS - 1, ROUTE_MIN_ITEMS - 1)).set,
    "supported",
    "too few answers → more support",
  );
  const extra = [
    ...lr(2, 6),
    ...Array.from({ length: 6 }, () => ({ domain: "Speaking", scored: true, right: true })),
  ];
  assert.deepEqual(chooseRoute(extra), { set: "supported", right: 2, total: 6 });
  assert.equal(chooseRoute([]).set, "supported");
});

test("only the four-domain forms can adapt", () => {
  for (const id of FULL) assert.ok(adaptiveEligible(json(`content/tests/${id}.json`)), id);
  for (const id of ["wida-speaking-mini", "wida-reading-mini", "g35-writing-mini"])
    assert.ok(!adaptiveEligible(json(`content/tests/${id}.json`)), id);
});

test("every full form routes to real prompts from both sets, keeping section sizes", () => {
  for (const id of FULL) {
    const form = json(`content/tests/${id}.json`);
    const pools = poolsFor(form.band);
    for (const [right, set] of [
      [12, "demanding"],
      [0, "supported"],
    ]) {
      const route = buildRoute(form, lr(right, 12), pools);
      assert.equal(route.set, set);
      const routed = routedTest(form, route, pools);
      form.sections.forEach((s, si) => {
        assert.equal(routed.sections[si].items.length, s.items.length, `${id} ${s.domain} size`);
        const changed = s.domain === "Speaking" || s.domain === "Writing";
        assert.equal(routed.sections[si] !== s, changed, `${id} ${s.domain} routed=${changed}`);
      });
      const ids = routed.sections.flatMap((s) => s.items.map((it) => it.id));
      assert.equal(new Set(ids).size, ids.length, `${id}: no prompt repeats`);
      const level = set === "demanding" ? "C" : "A";
      for (const s of routed.sections.filter(
        (x) => x.domain === "Speaking" || x.domain === "Writing",
      ))
        for (const it of s.items) {
          assert.equal(it.type, "constructed");
          assert.ok(
            pools[s.domain][level].some((a) => a.id === it.id),
            `${it.id} comes from level ${level}`,
          );
        }
    }
  }
});

test("routed Speaking uses the model-student-then-respond routine", () => {
  for (const id of FULL) {
    const form = json(`content/tests/${id}.json`);
    const pools = poolsFor(form.band);
    for (const right of [12, 0]) {
      const routed = routedTest(form, buildRoute(form, lr(right, 12), pools), pools);
      for (const it of routed.sections.find((s) => s.domain === "Speaking").items) {
        const m = findModelStudent(it);
        assert.ok(m?.name && m.line.length > 10, `${id} ${it.id} has a model student`);
      }
    }
  }
});

test("the same form always draws the same prompts; different forms vary", () => {
  const a = json("content/tests/model-form-a.json");
  const b = json("content/tests/model-form-b.json");
  const pools = poolsFor("6-8");
  assert.deepEqual(buildRoute(a, lr(9, 12), pools).items, buildRoute(a, lr(9, 12), pools).items);
  assert.notDeepEqual(buildRoute(a, lr(9, 12), pools).items, buildRoute(b, lr(9, 12), pools).items);
});

test("missing prompt sets leave the fixed form untouched", () => {
  const form = json("content/tests/model-form-a.json");
  const route = buildRoute(form, lr(12, 12), {});
  assert.deepEqual(route.items, {});
  assert.equal(routedTest(form, route, {}).sections[3], form.sections[3]);
  assert.equal(routedTest(form, null, {}), form);
});

test("helpers", () => {
  assert.equal(modelLine({ model: "Hi there." }, "supported"), "Hi there.");
  assert.equal(modelLine({ models: { A: "a", B: "b", C: "c" } }, "demanding"), "c");
  assert.equal(modelLine({ models: { A: "a", B: "b", C: "c" } }, "supported"), "b");
  assert.equal(modelLine({}, "supported"), null);
  assert.deepEqual(pickPromptIds([{ id: "x" }, { id: "y" }, { id: "z" }], 2, 4, ["y"]), ["x", "z"]);
  assert.deepEqual(routeTeacherText({ set: "demanding" })[0], "harder prompt set");
  assert.deepEqual(routeTeacherText({ set: "supported" })[0], "easier prompt set");
});

test("learner-facing copy never names a tier, level, score or placement for the route", () => {
  const src = readFileSync(lab("src/views/test-adaptive.js"), "utf8");
  const notice = src.slice(
    src.indexOf("export function routeNoticeHTML"),
    src.indexOf("/** Results page"),
  );
  assert.match(notice, /chosen from your answers, like the real test does/);
  assert.doesNotMatch(notice, /tier|level|harder|easier|demanding|supported|placement|predict/i);
  const option = src.slice(
    src.indexOf("export function adaptiveOptionHTML"),
    src.indexOf("export function routeNoticeHTML"),
  );
  assert.doesNotMatch(option, /tier|harder|easier|placement/i);
  const teacher = src.slice(src.indexOf("export function teacherRouteHTML"));
  assert.match(teacher, /teacherView\(\)/, "the set is shown only in the teacher view");
});

test("fixed modes stay the default", () => {
  const src = readFileSync(lab("src/views/test.js"), "utf8");
  assert.match(
    src,
    /if \(!T\.rec\.adaptive \|\| T\.rec\.route/,
    "routing only runs when the learner opted in",
  );
  assert.doesNotMatch(src, /adaptive:\s*true/);
});
