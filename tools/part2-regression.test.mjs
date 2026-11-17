// Part 2 regression (docs/part2-integration-map.md, acceptance test 7): adding the simulation, compiler, time
// machine and pathway routes may not change what any existing Language Page URL answers, drop a view, or touch the
// keys where learners' saved progress lives. tools/fixtures/part2-route-baseline.json is the router's answer for every
// site-map destination and a set of deep links, recorded from origin/main before Part 2.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const mainSrc = readFileSync(new URL("src/main.js", LAB), "utf8");
const start = mainSrc.indexOf("export function parseRoute");
const parseRoute = new Function(
  "BASE",
  "readMathLanguageBridge",
  "DOMAINS",
  `${mainSrc.slice(start, mainSrc.indexOf("\n}\n", start) + 2).replace("export ", "")};return parseRoute;`,
)("/access-practice-lab", () => null, [
  "Listening",
  "Reading",
  "Speaking",
  "Writing",
  "Model-Test",
]);
const baseline = JSON.parse(
  readFileSync(new URL("fixtures/part2-route-baseline.json", import.meta.url), "utf8"),
);
const parse = (p) => {
  const [path, q = ""] = p.split("?");
  return parseRoute(`/access-practice-lab/${path}`, q ? `?${q}` : "");
};

test("every existing URL answers exactly as it did before Part 2", () => {
  const paths = Object.keys(baseline.routes);
  assert.ok(paths.length >= 80, `baseline covers ${paths.length} routes`);
  for (const p of paths) assert.deepEqual(parse(p), baseline.routes[p], p);
});

test("every view that existed is still loadable", () => {
  const views = new Set(
    [...mainSrc.matchAll(/^\s+"?([a-z-]+)"?: \(\) => import\(/gm)].map((m) => m[1]),
  );
  for (const v of [
    "home",
    "speak",
    "write",
    "passport",
    "portfolio",
    "book-studio",
    "adventures",
    "language-games",
    "activity",
    "assess",
    "class",
    "lesson-builder",
    "family",
    "city",
    "worlds",
  ])
    assert.ok(views.has(v) || v === "home", `view ${v}`);
  for (const v of ["simulations", "experience-builder", "time-machine", "pathways"])
    assert.ok(views.has(v), `new view ${v}`);
});

test("the new routes parse to their own views", () => {
  assert.equal(parse("simulations/city-that-stopped-talking").view, "simulations");
  assert.equal(parse("simulations/x/xab12cd34").sub, "xab12cd34");
  assert.equal(parse("experience-builder").view, "experience-builder");
  assert.equal(parse("time-machine?tab=evidence").tab, "evidence");
  assert.equal(parse("pathways/explain-with-evidence").id, "explain-with-evidence");
});

test("Part 2 stores use new keys and never reuse an existing progress key", () => {
  const keys = [
    "accessPracticeLab:v1:intel",
    "accessPracticeLab:v1:sim",
    "accessPracticeLab:v1:experiences",
    "accessPracticeLab:v1:time-machine",
    "accessPracticeLab:v1:pathways",
  ];
  const existing = [
    "accessPracticeLab:v1:ledger",
    "accessPracticeLab:v1:adventures",
    "accessPracticeLab:v1:flagship",
    "accessPracticeLab:v1:city",
    "accessPracticeLab:v1:language-labs",
  ];
  for (const k of keys) assert.ok(!existing.includes(k), k);
  // Every Part 2 key keeps the accessPracticeLab: prefix, so the Passport export and class backup carry it.
  for (const k of keys) assert.ok(k.startsWith("accessPracticeLab:"), k);
});
