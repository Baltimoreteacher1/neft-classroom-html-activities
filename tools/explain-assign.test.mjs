// "Explain it" class assignments (access-practice-lab/src/class/assign-explain.js): a Teach It Back concept or a
// Misconception Detective case can be assigned by link, opens exactly that item, and counts as done on the learner's
// device only when the learner really finished it.
import assert from "node:assert/strict";
import test from "node:test";
import { CASES } from "../access-practice-lab/src/claimcheck/cases.js";
import { KEY as CC_STORE_KEY } from "../access-practice-lab/src/claimcheck/store.js";
import { ID_OK } from "../access-practice-lab/src/class/assign.js";
import {
  CC_KEY,
  explainAssignRows,
  explainDone,
  MAX_ASSIGN_ID,
  TB_KEY,
} from "../access-practice-lab/src/class/assign-explain.js";
import { languageSummary } from "../access-practice-lab/src/class/link.js";
import { CONCEPTS } from "../access-practice-lab/src/teachback/concepts.js";
import { KEY as TB_STORE_KEY } from "../access-practice-lab/src/teachback/store.js";
import { storage } from "../access-practice-lab/src/util.js";

test("the keys read for 'done' are the stores' own keys", () => {
  assert.equal(TB_KEY, TB_STORE_KEY);
  assert.equal(CC_KEY, CC_STORE_KEY);
});

test("every concept and case of a band is assignable, with a valid, unique, decodable id and a link that opens it", async () => {
  for (const band of ["3-5", "6-8"]) {
    const rows = await explainAssignRows(band);
    const want =
      CONCEPTS.filter((c) => c.band === band).length + CASES.filter((c) => c.band === band).length;
    assert.equal(rows.length, want, `${band}: one row per concept and case`);
    assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, "ids are unique");
    for (const r of rows) {
      assert.ok(
        ID_OK.test(r.id) && r.id.length <= MAX_ASSIGN_ID,
        `${r.id} is a valid class assignment id`,
      );
      const [, route, id] =
        /\/(teach-back|claim-check)\/([a-z0-9-]+)\?grades=([\w-]+)$/.exec(r.path) || [];
      assert.ok(route && id, `${r.path} has the expected shape`);
      assert.ok(r.path.endsWith(`?grades=${band}`));
      const bank = route === "teach-back" ? CONCEPTS : CASES;
      assert.ok(
        bank.some((x) => x.id === id && x.band === band),
        `${r.path} opens a real ${route} item of band ${band}`,
      );
      assert.equal(
        r.id,
        `${route === "teach-back" ? "tb" : "cc"}-${id}`,
        "the assignment id decodes back to the item",
      );
    }
  }
  assert.deepEqual(await explainAssignRows("K"), [], "early bands have nothing to assign");
});

test("an item counts as done only when this device finished it", () => {
  const tb = CONCEPTS[0];
  const cc = CASES[0];
  assert.equal(explainDone(`tb-${tb.id}`), false);
  assert.equal(explainDone(`cc-${cc.id}`), false);
  storage.set(
    TB_KEY,
    JSON.stringify({
      v: 1,
      session: { id: tb.id, attempts: [{ conceptId: tb.id, text: "half way" }] },
      explained: {},
    }),
  );
  assert.equal(explainDone(`tb-${tb.id}`), false, "an attempt in progress is not finished");
  storage.set(
    TB_KEY,
    JSON.stringify({ v: 1, session: null, explained: { [tb.id]: { t: 1, independent: false } } }),
  );
  storage.set(CC_KEY, JSON.stringify({ v: 1, open: { [cc.id]: {} }, done: {} }));
  assert.equal(explainDone(`tb-${tb.id}`), true);
  assert.equal(explainDone(`cc-${cc.id}`), false, "an open case is not done");
  storage.set(
    CC_KEY,
    JSON.stringify({ v: 1, open: {}, done: { [cc.id]: { independent: true, t: "2026-11-25" } } }),
  );
  assert.equal(explainDone(`cc-${cc.id}`), true);
  assert.equal(explainDone("tb-not-a-concept"), false);
  assert.equal(
    explainDone("l1-some-activity"),
    false,
    "ids that are not ours are never ours to mark",
  );
  storage.set(TB_KEY, "{not json");
  assert.equal(explainDone(`tb-${tb.id}`), false, "corrupt storage is not done");
});

test("the class summary reports finished explain assignments, ids only", () => {
  const tb = CONCEPTS[1];
  const cc = CASES[1];
  storage.set(
    TB_KEY,
    JSON.stringify({ v: 1, session: null, explained: { [tb.id]: { t: 1, independent: true } } }),
  );
  storage.set(CC_KEY, JSON.stringify({ v: 1, open: {}, done: {} }));
  const sum = languageSummary({ assignmentIds: [`tb-${tb.id}`, `cc-${cc.id}`] });
  assert.deepEqual(sum.assignmentsDone, [`tb-${tb.id}`]);
  assert.doesNotMatch(
    JSON.stringify(sum),
    /sentence|reasoning|text/i,
    "the summary carries no learner words",
  );
});
