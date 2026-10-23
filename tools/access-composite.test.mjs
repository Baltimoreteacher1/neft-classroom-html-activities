#!/usr/bin/env node
// The Practice Composite (src/lang/composite.js): weighted like the ACCESS Overall, never filled in,
// never a WIDA score or level. These tests pin the rules that keep it honest.
import assert from "node:assert/strict";
import test from "node:test";
import * as composite from "../access-practice-lab/src/lang/composite.js";
import {
  DOMAINS,
  domainMeasure,
  MIN_ITEMS,
  practiceComposite,
  SMALL_SAMPLE,
  WEIGHTS,
} from "../access-practice-lab/src/lang/composite.js";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const sec = (domain, correct, total, extra = {}) => ({
  domain,
  correct,
  total,
  attempted: total,
  open: 0,
  openDone: 0,
  ...extra,
});
const open = (domain, done = 1) => ({
  domain,
  correct: 0,
  total: 0,
  attempted: 0,
  open: done,
  openDone: done,
});
const full = () => [
  sec("Listening", 9, 12),
  sec("Reading", 6, 12),
  open("Speaking"),
  open("Writing"),
];
const strongAll = { lc: "strong", vu: "strong", lctl: "strong" };
const earlyAll = { lc: "early", vu: "early", lctl: "early" };

test("weights are WIDA's published Overall weighting and sum to one", () => {
  assert.deepEqual(WEIGHTS, { Listening: 0.15, Speaking: 0.15, Reading: 0.35, Writing: 0.35 });
  assert.ok(Math.abs(DOMAINS.reduce((s, d) => s + WEIGHTS[d], 0) - 1) < 1e-9);
});

test("overall is the weighted mean of four domain measures", () => {
  // L 75, R 50, S 100 (strong x3), W 33.3 (early x3): .15*75 + .35*50 + .15*100 + .35*33.33 = 55.4
  const c = practiceComposite(full(), { Speaking: strongAll, Writing: earlyAll });
  assert.equal(c.overall.value, 55);
  assert.equal(c.withheld, null);
});

test("comprehension weights Listening and Reading 15:35 and needs no rating", () => {
  const c = practiceComposite(full());
  assert.equal(c.comprehension.value, Math.round((75 * 0.15 + 50 * 0.35) / 0.5));
  assert.equal(c.overall, null);
  assert.match(c.withheld, /Speaking.*Writing|Writing.*Speaking/);
});

test("a missing or unrated skill is withheld, never filled in or reweighted", () => {
  const onlySpeaking = practiceComposite(full(), { Speaking: strongAll });
  assert.equal(onlySpeaking.overall, null);
  assert.match(onlySpeaking.withheld, /Writing/);
  const noWriting = practiceComposite(
    [sec("Listening", 12, 12), sec("Reading", 12, 12), open("Speaking")],
    { Speaking: strongAll },
  );
  assert.equal(noWriting.overall, null);
  assert.ok(noWriting.comprehension);
});

test("a skill with too few answered questions does not count", () => {
  const m = domainMeasure("Listening", [sec("Listening", 3, 12, { attempted: MIN_ITEMS - 1 })]);
  assert.equal(m.status, "thin");
  assert.equal(m.value, null);
  assert.equal(
    practiceComposite([sec("Listening", 3, 12, { attempted: 2 }), sec("Reading", 6, 12)])
      .comprehension,
    null,
  );
});

test("unanswered questions count as not right once the minimum is met", () => {
  const m = domainMeasure("Reading", [sec("Reading", 6, 12, { attempted: 8 })]);
  assert.equal(m.value, 50);
});

test("small samples are flagged, large ones are not", () => {
  assert.equal(
    practiceComposite([sec("Listening", 3, SMALL_SAMPLE - 1), sec("Reading", 3, SMALL_SAMPLE - 1)])
      .comprehension.small,
    true,
  );
  assert.equal(
    practiceComposite([sec("Listening", 3, SMALL_SAMPLE), sec("Reading", 3, SMALL_SAMPLE)])
      .comprehension.small,
    false,
  );
});

test("a rubric rating needs all three criteria and a finished response", () => {
  assert.equal(
    domainMeasure("Writing", [open("Writing")], { Writing: { lc: "strong", vu: "strong" } }).status,
    "unrated",
  );
  assert.equal(
    domainMeasure("Writing", [open("Writing", 0)], { Writing: strongAll }).status,
    "unrated",
  );
  assert.equal(domainMeasure("Writing", [open("Writing")], { Writing: strongAll }).value, 100);
  assert.equal(
    Math.round(domainMeasure("Writing", [open("Writing")], { Writing: earlyAll }).value),
    33,
  );
});

test("the report says who rated Speaking and Writing", () => {
  const c = practiceComposite(full(), {
    Speaking: { ...strongAll, by: "teacher" },
    Writing: strongAll,
  });
  assert.deepEqual([...c.overall.raters].sort(), ["me", "teacher"]);
});

test("the composite never produces a level, a scale score, or an exit prediction", () => {
  const c = practiceComposite(full(), { Speaking: strongAll, Writing: strongAll });
  assert.doesNotMatch(JSON.stringify(c), /\bexit\b|\blevel\b|scale/i);
  assert.doesNotMatch(composite.METHOD, /\bexit\b|predict/i);
  assert.equal(SCORE_CLAIM.test(composite.METHOD), false);
  assert.equal(SCORE_CLAIM.test(composite.LIMITS), false);
  assert.match(composite.LIMITS, /not a WIDA ACCESS scale score, proficiency level, or placement/);
  assert.equal(c.level, undefined);
  assert.equal(c.scaleScore, undefined);
});

test("only the practice-test results screen shows a composite", async () => {
  const { readdirSync, readFileSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const root = new URL("../access-practice-lab/src/", import.meta.url).pathname;
  const walk = (dir) =>
    readdirSync(dir).flatMap((f) =>
      statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)],
    );
  const files = walk(root).filter((f) => f.endsWith(".js"));
  const users = files.filter((f) => /lang\/composite\.js/.test(readFileSync(f, "utf8")));
  assert.deepEqual(
    users.map((f) => f.slice(root.length)),
    ["views/test.js"],
  );
  for (const f of files)
    assert.doesNotMatch(readFileSync(f, "utf8"), /%\s*developed|composite score/i, f);
});
