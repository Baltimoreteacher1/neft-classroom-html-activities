#!/usr/bin/env node
// tools/curriculum-find.test.mjs — the Find engine (curriculum/find/find-engine.js) against the real index.
//
// Each case is a request a teacher, family or student would type. The assertions are about what must be TRUE
// of the answer (every printable result is printable, every exact-standard result teaches that standard), not
// about one ranking, so re-ordering for a better reason does not break the test but a wrong answer does.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  companions,
  languagePageLink,
  parseQuery,
  search,
} from "../curriculum/find/find-engine.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const index = JSON.parse(readFileSync(join(root, "data/curriculum-find-index.json"), "utf8"));
let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`✗ ${name}\n  ${e.message}`);
    process.exitCode = 1;
  }
};
const top = (q, n = 10) => search(index, q, { limit: n }).results;

/* ---------- index shape ---------- */
test("index carries documents, standards and units", () => {
  assert.ok(index.docs.length > 1500, `only ${index.docs.length} documents`);
  assert.ok(Object.keys(index.standards).length >= 40);
  for (const d of index.docs) {
    assert.ok(d.t && d.p, `document without title or path: ${JSON.stringify(d)}`);
    assert.ok(d.p.startsWith("/") || /^https:\/\//.test(d.p), `relative path ${d.p}`);
    if (d.s) assert.ok(index.standards[d.s], `${d.p} cites unknown standard ${d.s}`);
    if (d.pr) assert.ok(d.f?.length, `${d.p} is printable with no format`);
  }
});
test("no document title carries a stringified object", () => {
  const bad = index.docs.filter((d) => /\[object Object\]/.test(d.t + d.d));
  assert.equal(bad.length, 0, bad.slice(0, 3).map((d) => d.p).join(", "));
});

/* ---------- parsing ---------- */
test("parse: topic, kind, audience, printable, time, lesson", () => {
  const q = parseQuery("Show me a 10-minute family activity");
  assert.equal(q.audience, "f");
  assert.equal(q.minutes, 10);
  assert.equal(q.short, true);
  const p = parseQuery("Find a printable activity about percentages");
  assert.deepEqual(p.topics, ["percent"]);
  assert.ok(p.standards.includes("6.AT.4"));
  assert.equal(p.printable, true);
  const e = parseQuery("Practice equivalent expressions");
  assert.deepEqual(e.topics, ["equivalent-expressions"], "narrow topic only");
  assert.equal(e.kind, "practice");
  assert.equal(parseQuery("lesson 3.4 game").lesson, "3-4");
  assert.equal(parseQuery("ratios for beginning English learners").ell, true);
  assert.deepEqual(parseQuery("ratios for beginning English learners").rest, []);
  assert.equal(parseQuery("surface area nets").topics[0], "surface-area");
});

/* ---------- the directive's example requests ---------- */
test("practice equivalent expressions → 6.AT.7 practice first", () => {
  const r = top("Practice equivalent expressions");
  assert.ok(r.length >= 5);
  for (const x of r.slice(0, 5)) assert.equal(x.doc.s, "6.AT.7", x.doc.p);
  assert.ok(r.slice(0, 5).some((x) => x.doc.k === "practice"));
});
test("a printable about percentages → only printables, all percent", () => {
  const r = top("Find a printable activity about percentages", 30);
  assert.ok(r.length >= 10);
  for (const x of r) {
    assert.equal(x.doc.pr, 1, `${x.doc.p} is not printable`);
    assert.equal(x.doc.s, "6.AT.4", `${x.doc.p} is ${x.doc.s}`);
  }
});
test("a 10-minute family activity → family resources, honest about time", () => {
  const r = top("Show me a 10-minute family activity");
  assert.ok(r.length >= 5);
  for (const x of r.slice(0, 5)) assert.ok(x.doc.a.includes("f"), `${x.doc.p} is not for families`);
  assert.ok(!r.some((x) => x.why.some((w) => /\d+\s*min/.test(w))), "invented a duration");
});
test("ratios for beginning English learners → ratio resources with supports, plus The Language Page", () => {
  const { results, query } = search(index, "Find activities about ratios for beginning English learners", { limit: 10 });
  assert.ok(results.length >= 5);
  for (const x of results) assert.equal(index.standards[x.doc.s]?.[0], "ratios", x.doc.p);
  assert.ok(results.some((x) => x.doc.v === "support" || x.doc.es), "no support-level or Spanish resource");
  assert.match(languagePageLink(query), /^https:\/\/thelanguagepage\.com\/access-practice-lab\/search\?/);
});
test("projects involving area and volume → projects first", () => {
  const r = top("Find projects involving area and volume");
  assert.equal(r[0].doc.k, "project");
});
test("language-only requests go to The Language Page, not to unrelated math", () => {
  for (const q of ["Find science speaking activities for Grades 6-8", "Find listening activities with visual support", "Find visual vocabulary about ecosystems"]) {
    const res = search(index, q);
    assert.equal(res.results.length, 0, `${q} listed math resources`);
    assert.ok(languagePageLink(res.query), `${q} has no Language Page link`);
  }
  assert.match(languagePageLink(parseQuery("speaking activities grades 6-8")), /grades=6-8/);
});
test("a lesson number narrows to that lesson", () => {
  const r = top("6-6", 30);
  assert.ok(r.length > 0);
  for (const x of r) assert.equal(x.doc.l, "6-6");
});
test("nonsense finds nothing rather than everything", () => {
  assert.equal(top("zzqx flibber").length, 0);
});
test("results are diverse: no lesson repeats one kind more than twice", () => {
  const r = top("ratios", 40);
  const n = new Map();
  for (const x of r) {
    const k = `${x.doc.l || x.doc.p}|${x.doc.k}`;
    n.set(k, (n.get(k) || 0) + 1);
  }
  assert.ok([...n.values()].every((c) => c <= 2));
});

/* ---------- companions ---------- */
test("companions share the lesson or standard, differ in kind, never repeat the resource", () => {
  const doc = index.docs.find((d) => d.p === "/lessons/6-6/");
  assert.ok(doc, "lesson 6-6 is in the index");
  const pals = companions(index, doc);
  assert.ok(pals.length >= 2);
  const kinds = new Set(pals.map((d) => d.k));
  assert.equal(kinds.size, pals.length);
  for (const d of pals) {
    assert.notEqual(d.p, doc.p);
    assert.ok(d.l === doc.l || d.s === doc.s, `${d.p} is unrelated`);
  }
});


/* ---------- The Language Page -> EduWonderLab bridge ---------- */
const { mathBridge } = await import("../access-practice-lab/src/finder/math-bridge.js");
test("Language Page bridge: math queries link to Find, language queries do not", () => {
  for (const q of ["ratio vocabulary", "porcentajes", "equivalent expressions sentence frames", "math word problems"]) {
    const m = mathBridge(q);
    assert.ok(m, `${q} has no bridge`);
    assert.equal(new URL(m.href).origin, "https://eduwonderlab.com");
    assert.equal(new URL(m.href).searchParams.get("q"), q);
  }
  for (const q of ["listening", "speaking grade 3", "a table of contents", "the area near school", "", null]) {
    assert.equal(mathBridge(q), null, `${q} should not bridge`);
  }
});

console.log(process.exitCode ? `curriculum-find: FAILED (${passed} passed)` : `✓ curriculum-find: ${passed} checks passed`);

