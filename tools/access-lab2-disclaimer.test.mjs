// ACCESS Practice Lab 2.0: the mandatory honesty statement. A generated output WITHOUT it must fail, and every output
// the engine generates must carry it ("inspired by WIDA ACCESS, not official, not a score, not a placement tool").
import assert from "node:assert/strict";
import { test } from "node:test";
import { bankHealth } from "../shared/access-lab2/bank-health.js";
import { buildPracticeTest, scorePracticeTest } from "../shared/access-lab2/builder.js";
import { DEMO_ITEMS } from "../shared/access-lab2/demo-items.js";
import {
  answerDiagnosticItem,
  finishDiagnostic,
  nextDiagnosticItem,
  startDiagnostic,
} from "../shared/access-lab2/diagnostic.js";
import {
  assertDisclaimer,
  DISCLAIMER,
  DISCLAIMER_ES,
  disclaimerOk,
  findMissingDisclaimers,
  hasDisclaimer,
  withDisclaimer,
} from "../shared/access-lab2/disclaimer.js";
import { familyPrintData, generateRoad } from "../shared/access-lab2/road.js";
import { bestAnswer, clone, reviewedDemo } from "./access-lab2-helpers.mjs";

const REVIEWED = reviewedDemo();

function everyOutput() {
  const test = buildPracticeTest({
    items: REVIEWED,
    gradeBand: "3-5",
    length: "mini",
    seed: "dd",
    viewer: "student",
  });
  const answers = Object.fromEntries(
    test.itemIds.map((id) => [id, bestAnswer(REVIEWED.find((i) => i.id === id))]),
  );
  const results = scorePracticeTest({ test, items: REVIEWED, answers, alias: "Star 1" });
  let state = startDiagnostic({ gradeBand: "3-5", seed: "dd", viewer: "teacher" });
  for (;;) {
    const next = nextDiagnosticItem(state, DEMO_ITEMS);
    state = next.state;
    if (!next.item) break;
    state = answerDiagnosticItem(state, DEMO_ITEMS, bestAnswer(next.item));
  }
  const diagnostic = finishDiagnostic({ state, alias: "Star 1" });
  const plan = generateRoad({
    profile: diagnostic.profile,
    startDate: "2026-10-05",
    today: "2026-11-02",
    completed: [],
  });
  return {
    test,
    results,
    diagnostic,
    plan,
    family: familyPrintData(plan),
    health: bankHealth({ items: DEMO_ITEMS, gradeBands: ["3-5"] }),
  };
}

test("every generated output, and every output nested inside one, carries the disclaimer", () => {
  const outputs = everyOutput();
  for (const [name, out] of Object.entries(outputs)) {
    assert.ok(hasDisclaimer(out), `${name} is missing the disclaimer`);
    assert.deepEqual(
      findMissingDisclaimers(out),
      [],
      `${name} has a nested output without the disclaimer`,
    );
  }
  assert.equal(outputs.results.disclaimer, DISCLAIMER);
  assert.ok(disclaimerOk(outputs.family.disclaimer));
  assert.match(outputs.family.disclaimer.es, /Traducción en borrador/);
});

test("negative control: a results object missing the disclaimer fails", () => {
  const { results, test: t, diagnostic, plan } = everyOutput();
  const stripped = clone(results);
  delete stripped.disclaimer;
  assert.equal(hasDisclaimer(stripped), false);
  assert.throws(() => assertDisclaimer(stripped), /missing the mandatory disclaimer/);
  assert.deepEqual(findMissingDisclaimers(stripped), ["$"]);
  const nested = clone(results);
  delete nested.profile.disclaimer;
  assert.deepEqual(findMissingDisclaimers(nested), ["$.profile"]);
  const nestedView = clone(results);
  nestedView.studentView.disclaimer = "";
  assert.deepEqual(findMissingDisclaimers(nestedView), ["$.studentView"]);
  for (const out of [t, diagnostic, diagnostic.teacherSummary, diagnostic.studentView, plan]) {
    const bare = clone(out);
    delete bare.disclaimer;
    assert.equal(hasDisclaimer(bare), false, bare.kind);
    assert.ok(findMissingDisclaimers(bare).length > 0, bare.kind);
  }
});

test("negative control: a weakened or altered statement is not accepted", () => {
  for (const text of [
    "",
    "Inspired by WIDA ACCESS.",
    "Inspired by WIDA ACCESS, not official.",
    "Inspired by WIDA ACCESS, not official, not a score.",
    "This is an official ACCESS practice score.",
    "Not official, not a score, not a placement tool.",
    undefined,
    null,
    42,
    { es: DISCLAIMER_ES },
  ])
    assert.equal(disclaimerOk(text), false, String(JSON.stringify(text)));
  assert.equal(disclaimerOk(DISCLAIMER), true);
  assert.equal(disclaimerOk(DISCLAIMER.toUpperCase()), true, "case does not matter");
  assert.equal(disclaimerOk({ en: DISCLAIMER, es: DISCLAIMER_ES }), true);
  assert.equal(hasDisclaimer(null), false);
  assert.equal(hasDisclaimer(withDisclaimer({ kind: "x" })), true);
});

test("the statement says what it must", () => {
  for (const phrase of [
    "inspired by WIDA ACCESS",
    "not official",
    "not a score",
    "not a placement tool",
  ])
    assert.ok(DISCLAIMER.toLowerCase().includes(phrase.toLowerCase()), phrase);
});
