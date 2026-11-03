#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { WIDA_LANGUAGE_EXPECTATIONS } from "../access-practice-lab/src/acc/wida/catalog.js";
import {
  coverageOf,
  evidenceChain,
  mapItem,
} from "../access-practice-lab/src/acc/wida/framework.js";

test("every catalog id follows the framework pattern and no code is invented", () => {
  const seen = new Set();
  for (const e of WIDA_LANGUAGE_EXPECTATIONS) {
    assert.match(
      e.id,
      /^ELD-(SI|LA|MA|SC|SS)\.(K-3|4-12|2-3|4-5|6-8)\.(Narrate|Inform|Explain|Argue)(\.(Interpretive|Expressive))?$/,
      e.id,
    );
    assert.ok(!seen.has(e.id), `duplicate ${e.id}`);
    seen.add(e.id);
    assert.equal(e.source, "https://wida.wisc.edu/teach/standards/eld");
  }
});

test("framework combinations: Science is Explain/Argue, Language Arts adds Narrate/Inform, grade 6-8 Language Arts includes Argue", () => {
  assert.ok(mapItem({ domain: "Reading", klu: "Explain", context: "Science" }, "6-8").explicit);
  assert.ok(
    !mapItem({ domain: "Reading", klu: "Narrate", context: "Science" }, "6-8").explicit,
    "Narrate is not an explicit Science combination",
  );
  assert.ok(mapItem({ domain: "Writing", klu: "Argue", context: "Language Arts" }, "6-8").explicit);
  // Grades 3-5 span two clusters: Language Arts Argue is represented from cluster 4-5, not 2-3.
  const la = mapItem({ domain: "Writing", klu: "Argue", context: "Language Arts" }, "3-5");
  assert.ok(la.explicit && la.ids.every((id) => id.includes(".4-5.")), la.ids.join());
});

test("interpretive and expressive modes follow the domain, and grade 3-5 maps to both of its WIDA clusters", () => {
  const read = mapItem({ domain: "Reading", klu: "Explain", context: "Science" }, "3-5");
  const speak = mapItem({ domain: "Speaking", klu: "Explain", context: "Science" }, "3-5");
  assert.equal(read.mode, "Interpretive");
  assert.equal(speak.mode, "Expressive");
  assert.deepEqual(read.clusters, ["2-3", "4-5"]);
  assert.deepEqual(read.ids, [
    "ELD-SC.2-3.Explain.Interpretive",
    "ELD-SC.4-5.Explain.Interpretive",
  ]);
  assert.ok(speak.ids.every((id) => id.endsWith("Expressive")));
});

test("the evidence chain states what was observed without claiming a level", () => {
  const row = {
    itemId: "i1",
    domain: "Reading",
    klu: "Explain",
    context: "Science",
    grade: "6-8",
    mode: "formative",
    status: "correct",
    correct: true,
    independent: false,
    supportTier: 2,
    attempts: 2,
  };
  const chain = evidenceChain(row, { stem: "Why?" });
  assert.deepEqual(
    chain.map((c) => c[0]),
    [
      "Task",
      "Domain",
      "Key Language Use",
      "Academic context",
      "Language Expectation family",
      "Observable evidence",
      "Feedback",
      "Revision",
      "New attempt",
    ],
  );
  assert.match(chain[5][1], /with support or revision/);
  assert.match(chain[6][1], /language support/);
  assert.equal(chain[7][1], "1 revision");
  assert.ok(!chain.some(([, v]) => /proficien|level \d|scale score/i.test(v)));
  const review = evidenceChain({ ...row, status: "needs-review", correct: null }, {});
  assert.match(review[5][1], /not scored by the lab/);
});

test("the starter sets map their items and report which combinations are only supplementary", () => {
  for (const [file, grade] of [
    ["starter-3-5", "3-5"],
    ["starter-6-8", "6-8"],
  ]) {
    const set = JSON.parse(
      readFileSync(
        new URL(`../access-practice-lab/content/assess/${file}.json`, import.meta.url),
        "utf8",
      ),
    );
    const cov = coverageOf(set.items, grade);
    assert.ok(cov.length >= 5);
    assert.ok(cov.every((c) => c.items > 0));
    for (const c of cov) assert.equal(c.explicit, c.ids.length > 0);
  }
});
