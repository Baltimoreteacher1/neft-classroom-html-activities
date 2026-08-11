// The correct-answer lead must stay varied and bilingual.
//
// It used to be a single constant, so a student clearing an 18-item set read
// "✅ Your reasoning landed." eighteen times in fifteen minutes — praise that
// never varies stops reading as a response and starts reading as machinery.
// These pins keep the fix from quietly collapsing back to one string, and keep
// every entry a real EN/ES pair rather than English pasted into both lanes.

import assert from "node:assert/strict";
import test from "node:test";

import { CORRECT_LEADS } from "./small-group-practice.js";

test("enough leads to feel varied across a practice set", () => {
  assert.ok(CORRECT_LEADS.length >= 4, `only ${CORRECT_LEADS.length} leads`);
});

test("every lead is a distinct bilingual pair", () => {
  const ens = new Set();
  for (const pair of CORRECT_LEADS) {
    assert.equal(pair.length, 2, "each lead is [en, es]");
    const [en, es] = pair;
    assert.ok(en.trim().length > 4 && es.trim().length > 4, "no blank lanes");
    assert.notEqual(en, es, `Spanish lane is a copy of the English: "${en}"`);
    assert.ok(!ens.has(en), `duplicate English lead: "${en}"`);
    ens.add(en);
  }
});

test("leads keep the voice rule: method, not verdicts about the student", () => {
  // "Smart", "genius", "good girl/boy" style person-praise is what this
  // surface deliberately avoids; the lead names what the WORK did.
  const banned = /\b(smart|genius|brilliant|gifted|good (girl|boy))\b/i;
  for (const [en] of CORRECT_LEADS) {
    assert.ok(!banned.test(en), `person-praise slipped in: "${en}"`);
  }
});
