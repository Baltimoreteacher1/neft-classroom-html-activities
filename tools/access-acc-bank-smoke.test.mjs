#!/usr/bin/env node
/**
 * The delivered bank, driven by the real engine: every item renders, every objective answer key scores correct and a changed
 * answer scores incorrect, every set validates, and the inventory is the one the brief asked for. Counts come from the files.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { renderQuestion } from "../access-practice-lab/src/acc/engine/renderers.js";
import { scoreItem } from "../access-practice-lab/src/acc/engine/scoring.js";
import { AssessmentSession } from "../access-practice-lab/src/acc/engine/session.js";
import { checkSet, loadBank } from "./validate-access-bank.mjs";

const sets = loadBank();
const dom = new JSDOM("<!doctype html><body></body>").window.document;
const keyFor = (item) => {
  switch (item.type) {
    case "multiple-choice":
    case "listening-response":
      return item.answer;
    case "multiple-select":
      return [...item.answer];
    case "dropdown":
      return Object.fromEntries(
        Object.entries(item.dropdown.blanks).map(([k, b]) => [k, b.answer]),
      );
    case "ordering":
      return [...item.ordering.answer];
    case "matching":
      return { ...item.matching.answer };
    case "drag-drop":
      return { ...item.dragDrop.answer };
    default:
      return null;
  }
};
const wrongFor = (item) => {
  switch (item.type) {
    case "multiple-choice":
    case "listening-response":
      return item.options.find((o) => o.id !== item.answer).id;
    case "multiple-select":
      return [item.options.find((o) => !item.answer.includes(o.id)).id];
    case "dropdown": {
      const [k, b] = Object.entries(item.dropdown.blanks)[0];
      return { ...keyFor(item), [k]: b.options.find((o) => o !== b.answer) };
    }
    case "ordering":
      return [...item.ordering.answer].reverse();
    case "matching": {
      const ids = Object.keys(item.matching.answer);
      const t = Object.values(item.matching.answer);
      return Object.fromEntries(ids.map((id, i) => [id, t[(i + 1) % t.length]]));
    }
    case "drag-drop": {
      const zones = item.dragDrop.zones.map((z) => z.id);
      return Object.fromEntries(
        Object.entries(item.dragDrop.answer).map(([t, z]) => [t, zones.find((x) => x !== z)]),
      );
    }
    default:
      return null;
  }
};

test("the bank holds at least 320 items: 40 per domain in each grade band, all from files that pass every check", () => {
  const per = {};
  for (const { file, set } of sets) {
    const r = checkSet(set, file);
    assert.deepEqual(r.errors, [], file);
    per[`${set.grade} ${set.domain}`] = (per[`${set.grade} ${set.domain}`] || 0) + set.items.length;
  }
  for (const g of ["3-5", "6-8"])
    for (const d of ["Listening", "Reading", "Speaking", "Writing"])
      assert.ok(per[`${g} ${d}`] >= 40, `${g} ${d}: ${per[`${g} ${d}`]}`);
  assert.ok(sets.reduce((n, s) => n + s.set.items.length, 0) >= 320);
});

test("every item renders through the real renderers, and every objective key scores correct while a changed answer does not", () => {
  let objective = 0;
  let reviewed = 0;
  for (const { set } of sets) {
    const session = new AssessmentSession(set, { mode: "formative" }).start();
    for (const item of set.items) {
      const ctx = {
        doc: dom,
        prefix: `q-${item.id}`,
        response: undefined,
        readOnly: false,
        announce() {},
        onChange() {},
        mode: "summative",
        session,
      };
      if (item.type === "speaking-response") {
        reviewed++;
        assert.equal(
          scoreItem(item, { submitted: true, recordingId: "r" }).status,
          "needs-review",
          item.id,
        );
        continue; // the recorder UI is exercised in the audio end-to-end run
      }
      const handle = renderQuestion(item, ctx);
      assert.ok(handle.el, `${item.id} rendered`);
      if (item.type === "constructed-response") {
        reviewed++;
        assert.equal(scoreItem(item, "words ".repeat(40)).status, "needs-review", item.id);
        continue;
      }
      objective++;
      const key = keyFor(item);
      assert.equal(scoreItem(item, key).status, "correct", `${item.id} key`);
      assert.equal(scoreItem(item, wrongFor(item)).status, "incorrect", `${item.id} wrong answer`);
    }
  }
  assert.ok(objective >= 160, `objective items ${objective}`);
  assert.ok(reviewed >= 160, `review items ${reviewed}`);
});

test("a full simulated sitting of every set submits, counts every objective key as independent, and leaves speaking and writing for review", () => {
  for (const { set } of sets) {
    const s = new AssessmentSession(set, { mode: "summative" }).start();
    let obj = 0;
    for (const item of set.items) {
      const key = keyFor(item);
      if (key !== null) {
        s.setResponse(item.id, key);
        obj++;
      }
    }
    const r = s.submit();
    assert.equal(r.correct, obj, set.id);
    assert.equal(r.independentCorrect, obj, set.id);
    assert.equal(
      r.needsReview,
      0,
      "unanswered review items are not 'needs review' until something is submitted",
    );
    assert.equal(s.submit(), r);
  }
});

test("no set leaks teacher-only guidance into what a student sees", () => {
  for (const { set } of sets)
    for (const item of set.items) {
      const learner = item.speaking?.checklist || item.constructed?.checklist || [];
      const teacher = item.speaking?.exemplar || item.constructed?.exemplar || [];
      // the exemplar is teacher guidance; none of its lines may be the learner's own checklist
      for (const line of teacher)
        assert.ok(!learner.includes(line), `${item.id}: exemplar line shown to learners`);
      assert.ok(
        !/exemplar/.test(JSON.stringify([item.stem, item.options, item.support, item.distractors])),
        item.id,
      );
    }
});
