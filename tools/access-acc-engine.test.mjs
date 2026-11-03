#!/usr/bin/env node
/**
 * Phase 2 contract: the assessment engine's logic (schema, scoring, session, toolbar state, highlighter DOM).
 * Pure logic runs in node; the highlighter and renderers run in jsdom. Browser behaviour is covered by
 * tools/access-acc-assess-e2e.mjs.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  applyHighlights,
  offsetsInScope,
  safeSelection,
  unwrapMarks,
} from "../access-practice-lab/src/acc/engine/highlight-dom.js";
import { renderQuestion } from "../access-practice-lab/src/acc/engine/renderers.js";
import {
  QUESTION_TYPES,
  validateItem,
  validateSet,
} from "../access-practice-lab/src/acc/engine/schema.js";
import { scoreItem, wordCount } from "../access-practice-lab/src/acc/engine/scoring.js";
import { AssessmentSession } from "../access-practice-lab/src/acc/engine/session.js";
import {
  addHighlight,
  canEliminate,
  emptyToolState,
  normalizeToolState,
  removeIntersecting,
  toggleEliminated,
} from "../access-practice-lab/src/acc/engine/tool-state.js";

const DIR = new URL("../access-practice-lab/content/assess/", import.meta.url).pathname;
const SETS = readdirSync(DIR)
  .filter((f) => f.startsWith("starter-"))
  .map((f) => JSON.parse(readFileSync(join(DIR, f), "utf8")));

test("both starter sets pass schema validation and together cover every question type", () => {
  const seen = new Set();
  for (const set of SETS) {
    const v = validateSet(set);
    assert.deepEqual(v.errors, [], set.id);
    for (const i of set.items) seen.add(i.type);
  }
  assert.deepEqual([...seen].sort(), [...QUESTION_TYPES].sort());
});

test("the validator rejects each way an item can be unanswerable", () => {
  const base = {
    id: "x",
    type: "multiple-choice",
    stem: "Q?",
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
    ],
    answer: "a",
  };
  assert.ok(validateItem(base).ok);
  assert.ok(!validateItem({ ...base, answer: "z" }).ok, "answer must exist");
  assert.ok(
    !validateItem({
      ...base,
      options: [
        { id: "a", text: "Same" },
        { id: "b", text: "same" },
      ],
    }).ok,
    "duplicate text",
  );
  assert.ok(!validateItem({ ...base, options: [base.options[0]] }).ok, "needs two choices");
  assert.ok(
    !validateItem({
      id: "o",
      type: "ordering",
      stem: "s",
      ordering: {
        items: [
          { id: "1", text: "a" },
          { id: "2", text: "b" },
          { id: "3", text: "c" },
        ],
        answer: ["1", "2", "3"],
      },
    }).ok,
    "ordering shown already solved",
  );
  assert.ok(
    !validateItem({
      id: "m",
      type: "matching",
      stem: "s",
      matching: {
        left: [
          { id: "l1", text: "a" },
          { id: "l2", text: "b" },
        ],
        right: [
          { id: "r1", text: "x" },
          { id: "r2", text: "y" },
        ],
        answer: { l1: "r9", l2: "r2" },
      },
    }).ok,
    "match target missing",
  );
  assert.ok(!validateItem({ ...base, domain: "Math" }).ok, "domain enum");
  assert.ok(
    !validateItem({
      id: "s",
      type: "speaking-response",
      stem: "s",
      speaking: { prepSeconds: 10, recordSeconds: 5 },
    }).ok,
    "record seconds too short",
  );
});

test("objective answer keys score correct for the key and incorrect for a changed response", () => {
  for (const set of SETS)
    for (const item of set.items) {
      let right;
      let wrong;
      switch (item.type) {
        case "multiple-choice":
        case "listening-response":
          right = item.answer;
          wrong = item.options.find((o) => o.id !== item.answer).id;
          break;
        case "multiple-select":
          right = [...item.answer];
          wrong = [item.options.find((o) => !item.answer.includes(o.id)).id];
          break;
        case "dropdown":
          right = Object.fromEntries(
            Object.entries(item.dropdown.blanks).map(([k, b]) => [k, b.answer]),
          );
          wrong = { ...right, 1: item.dropdown.blanks[1].options.find((o) => o !== right[1]) };
          break;
        case "ordering":
          right = [...item.ordering.answer];
          wrong = [...right].reverse();
          break;
        case "matching":
          right = { ...item.matching.answer };
          wrong = Object.fromEntries(
            Object.entries(right).map(([k], i, a) => [k, a[(i + 1) % a.length][1]]),
          );
          break;
        case "drag-drop":
          right = { ...item.dragDrop.answer };
          wrong = Object.fromEntries(
            Object.entries(right).map(([k, z]) => [
              k,
              item.dragDrop.zones.find((x) => x.id !== z).id,
            ]),
          );
          break;
        default:
          assert.equal(
            scoreItem(
              item,
              item.type === "speaking-response"
                ? { submitted: true, recordingId: "r1" }
                : "text here now",
            ).status,
            "needs-review",
            `${item.id} is never auto-scored`,
          );
          continue;
      }
      assert.equal(scoreItem(item, right).status, "correct", `${item.id} key`);
      assert.equal(scoreItem(item, wrong).status, "incorrect", `${item.id} wrong`);
      assert.equal(scoreItem(item, undefined).status, "unanswered");
    }
});

test("correct answers are not parked at one position (answer-key position balance)", () => {
  for (const set of SETS) {
    const positions = set.items
      .filter((i) => i.options)
      .flatMap((i) =>
        (Array.isArray(i.answer) ? i.answer : [i.answer]).map((a) =>
          i.options.findIndex((o) => o.id === a),
        ),
      );
    assert.ok(new Set(positions).size >= 3, `${set.id} positions ${positions}`);
  }
});

const clock = () => {
  const c = { t: 1_000_000, now: () => c.t, advance: (ms) => (c.t += ms) };
  return c;
};
const set = SETS[0];

test("summative sessions give no support, no checking, and submit exactly once", () => {
  const c = clock();
  const s = new AssessmentSession(set, { mode: "summative", now: c.now }).start();
  const item = set.items[0];
  assert.equal(s.requestSupport(item.id, 1), null, "no hints in a simulation");
  s.setResponse(item.id, "b");
  assert.equal(s.check(item.id), null, "no feedback in a simulation");
  const r1 = s.submit();
  const events = s.events.length;
  assert.equal(s.submit(), r1, "idempotent");
  assert.equal(s.events.length, events, "a second submit records nothing");
  assert.equal(s.setResponse(item.id, "a"), false, "locked after submit");
  assert.equal(r1.correct, 1);
  assert.equal(r1.independentCorrect, 1);
  assert.equal(r1.needsReview, 0);
  assert.equal(r1.unanswered, r1.total - 1);
});

test("the timer counts only active time, survives pause and resume, and expires once", () => {
  const c = clock();
  const s = new AssessmentSession(set, { mode: "summative", minutes: 10, now: c.now }).start();
  c.advance(4 * 60000);
  assert.equal(s.remainingMs(), 6 * 60000);
  s.pause();
  c.advance(30 * 60000); // time away does not count
  assert.equal(s.remainingMs(), 6 * 60000);
  const saved = s.serialize();
  assert.equal(saved.status, "paused");
  const back = AssessmentSession.restore(set, JSON.parse(JSON.stringify(saved)), {
    now: c.now,
  }).start();
  assert.equal(back.remainingMs(), 6 * 60000, "resume keeps the remaining time");
  c.advance(7 * 60000);
  assert.equal(back.tick(), true);
  assert.equal(back.status, "expired");
  assert.equal(back.locked, true);
  assert.equal(back.tick(), true);
  assert.equal(back.events.filter((e) => e.type === "expired").length, 1);
});

test("forward-only navigation blocks going back; free navigation does not", () => {
  const fwd = new AssessmentSession(set, { navigation: "forward-only" }).start();
  assert.ok(fwd.next());
  assert.equal(fwd.prev(), false);
  const free = new AssessmentSession(set).start();
  free.next();
  assert.ok(free.prev());
  assert.equal(free.goto(99), false);
});

test("formative cycle logs scaffolds honestly: support after a miss is never independent", () => {
  const c = clock();
  const s = new AssessmentSession(set, { mode: "formative", now: c.now }).start();
  const item = set.items[0];
  const wrong = item.options.find((o) => o.id !== item.answer).id;
  s.setResponse(item.id, wrong);
  const a1 = s.check(item.id);
  assert.equal(a1.correct, false);
  assert.equal(s.check(item.id), a1, "checking twice does not log twice");
  assert.equal(s.setResponse(item.id, item.answer), false, "must start a fresh attempt first");
  assert.equal(s.requestSupport(item.id, 2), null, "tiers unlock in order");
  assert.equal(s.requestSupport(item.id, 1).tier, 1);
  assert.equal(s.requestSupport(item.id, 2).tier, 2);
  assert.ok(s.newAttempt(item.id));
  assert.equal(s.responses[item.id], undefined, "the fresh attempt starts clear");
  s.setResponse(item.id, item.answer);
  const a2 = s.check(item.id);
  assert.equal(a2.correct, true);
  assert.equal(a2.tier, 2);
  const r = s.submit();
  const row = r.rows.find((x) => x.id === item.id);
  assert.equal(row.correct, true);
  assert.equal(row.independent, false, "a success after support is supported, not independent");
  assert.equal(row.supportTier, 2);
  assert.equal(row.firstAttempt.correct, false);
  assert.equal(r.supportedCorrect, 1);
  assert.equal(r.independentCorrect, 0);
});

test("a correct first attempt with no support counts as independent in learning mode", () => {
  const s = new AssessmentSession(set, { mode: "formative" }).start();
  const item = set.items[0];
  s.setResponse(item.id, item.answer);
  s.check(item.id);
  const row = s.submit().rows.find((x) => x.id === item.id);
  assert.equal(row.independent, true);
});

test("max attempts stops the cycle", () => {
  const s = new AssessmentSession(set, { mode: "formative", maxAttempts: 2 }).start();
  const item = set.items[0];
  const wrong = item.options.find((o) => o.id !== item.answer).id;
  for (let n = 0; n < 2; n++) {
    s.setResponse(item.id, wrong);
    s.check(item.id);
    if (n === 0) assert.ok(s.newAttempt(item.id));
  }
  assert.equal(s.newAttempt(item.id), false);
});

test("a saved session restores responses, marks, scaffolds, attempts and tool state exactly", () => {
  const s = new AssessmentSession(set, { mode: "formative" }).start();
  const item = set.items[2];
  s.setResponse(item.id, { 1: "warms", 2: "stays", 3: "gather" });
  s.check(item.id);
  s.requestSupport(item.id, 1);
  s.mark(item.id, true);
  s.goto(2);
  s.tools = {
    highlights: { rain: [{ id: "h", scope: "rain:p1", start: 0, end: 4, color: "yellow" }] },
    eliminated: { [item.id]: ["a"] },
    marks: [],
  };
  const copy = AssessmentSession.restore(set, JSON.parse(JSON.stringify(s.serialize())));
  assert.equal(copy.index, 2);
  assert.deepEqual(copy.responses, s.responses);
  assert.deepEqual([...copy.marked], [item.id]);
  assert.equal(copy.tierEver(item.id), 1);
  assert.equal(copy.awaitingRevision(item.id), true);
  assert.deepEqual(copy.tools, s.tools);
  assert.throws(() => AssessmentSession.restore(SETS[1], s.serialize()), /does not match/);
});

test("summary reports unanswered and marked questions for the review screen", () => {
  const s = new AssessmentSession(set).start();
  s.setResponse(set.items[0].id, "a");
  s.mark(set.items[3].id);
  const sum = s.summary();
  assert.equal(sum.answered, 1);
  assert.deepEqual(sum.marked, [4]);
  assert.equal(sum.unanswered.length, set.items.length - 1);
});

test("toolbar state: highlights replace what they cover, clear by selection, never hide the last choice", () => {
  let list = addHighlight([], { scope: "p1", start: 0, end: 10, color: "yellow" });
  list = addHighlight(list, { scope: "p1", start: 4, end: 7, color: "blue" });
  assert.deepEqual(
    list.map((h) => [h.start, h.end, h.color]),
    [
      [0, 4, "yellow"],
      [4, 7, "blue"],
      [7, 10, "yellow"],
    ],
  );
  assert.equal(
    addHighlight(list, { scope: "p1", start: 3, end: 3, color: "yellow" }).length,
    3,
    "empty range ignored",
  );
  assert.equal(removeIntersecting(list, { scope: "p1", start: 5, end: 6 }).length, 2);
  assert.equal(removeIntersecting(list, { scope: "other", start: 0, end: 99 }).length, 3);
  const st = emptyToolState();
  const item = { id: "q", options: [{ id: "a" }, { id: "b" }, { id: "c" }] };
  assert.equal(toggleEliminated(st, "q", "a"), true);
  assert.equal(toggleEliminated(st, "q", "b"), true);
  assert.equal(canEliminate(st, item, "c"), false, "the last remaining choice stays");
  assert.equal(canEliminate(st, item, "a"), true, "an eliminated choice can be restored");
  assert.deepEqual(
    normalizeToolState({
      highlights: {
        x: [
          { scope: "s", start: 5, end: 2, color: "yellow" },
          { scope: "s", start: 1, end: 3, color: "pink" },
          { scope: "s", start: 1, end: 3, color: "blue" },
        ],
      },
    }).highlights.x.length,
    1,
  );
});

const dom = () =>
  new JSDOM(
    '<!doctype html><body><p id="a">The quick brown fox jumps over the lazy dog.</p><p id="b">Second <em>nested</em> paragraph here.</p><button>x</button></body>',
  ).window.document;

test("highlighter wraps text without losing or changing any text, and unwraps cleanly", () => {
  const d = dom();
  const a = d.getElementById("a");
  const before = a.textContent;
  applyHighlights({ a }, [
    { id: "1", scope: "a", start: 4, end: 9, color: "yellow" },
    { id: "2", scope: "a", start: 16, end: 19, color: "green" },
  ]);
  assert.equal(a.textContent, before, "text unchanged");
  assert.deepEqual(
    [...a.querySelectorAll("mark")].map((m) => [m.textContent, m.dataset.color]),
    [
      ["quick", "yellow"],
      ["fox", "green"],
    ],
  );
  applyHighlights({ a }, [{ id: "1", scope: "a", start: 4, end: 9, color: "yellow" }]);
  assert.equal(a.querySelectorAll("mark").length, 1, "re-applying rebuilds, it does not stack");
  unwrapMarks(a);
  assert.equal(a.innerHTML, before);
});

test("highlighter handles ranges that cross inline elements", () => {
  const d = dom();
  const b = d.getElementById("b");
  applyHighlights({ b }, [{ id: "1", scope: "b", start: 3, end: 17, color: "blue" }]);
  assert.equal(
    [...b.querySelectorAll("mark")].map((m) => m.textContent).join(""),
    b.textContent.slice(3, 17),
  );
  assert.equal(b.textContent, "Second nested paragraph here.");
});

test("selection to offsets is exact, and unsafe selections are refused", () => {
  const d = dom();
  const a = d.getElementById("a");
  const range = d.createRange();
  range.setStart(a.firstChild, 10);
  range.setEnd(a.firstChild, 19);
  assert.deepEqual(offsetsInScope(a, range), { start: 10, end: 19 });
  assert.deepEqual(safeSelection(range, { a }), { scope: "a", start: 10, end: 19 });
  const across = d.createRange();
  across.setStart(a.firstChild, 2);
  across.setEnd(d.getElementById("b").firstChild, 3);
  assert.equal(
    safeSelection(across, { a, b: d.getElementById("b") }),
    null,
    "spanning two paragraphs is refused",
  );
  const collapsed = d.createRange();
  collapsed.setStart(a.firstChild, 2);
  assert.equal(safeSelection(collapsed, { a }), null);
});

const ctxFor = (d, extra = {}) => ({
  doc: d,
  prefix: "q",
  response: undefined,
  readOnly: false,
  announce() {},
  onChange() {},
  ...extra,
});

test("ordering renderer: Up/Down buttons reorder, announce, and report the new order", () => {
  const d = new JSDOM("<!doctype html><body></body>").window.document;
  const item = set.items.find((i) => i.type === "ordering");
  const seen = [];
  const h = renderQuestion(item, ctxFor(d, { onChange: (v) => seen.push(v) }));
  d.body.append(h.el);
  assert.deepEqual(h.get(), [], "untouched means unanswered");
  const rows = () => [...h.el.querySelectorAll("li")].map((li) => li.dataset.id);
  const first = rows()[0];
  h.el.querySelector("li button:nth-of-type(2)").click();
  assert.equal(rows()[1], first);
  assert.equal(seen.length, 1);
  assert.match(h.el.querySelector("[role=status]").textContent, /now number 2 of 4/);
  assert.equal(
    h.el.querySelector("li:first-child button").disabled,
    true,
    "first row cannot move up",
  );
});

test("click-to-place renderer: select a token, place it, replace it, undo it, all without a pointer", () => {
  const d = new JSDOM("<!doctype html><body></body>").window.document;
  const item = set.items.find((i) => i.type === "drag-drop");
  const said = [];
  const h = renderQuestion(item, ctxFor(d, { announce: (m) => said.push(m) }));
  d.body.append(h.el);
  const token = (id) => h.el.querySelector(`.acc-pool [data-token="${id}"]`);
  token("t1").click();
  assert.equal(h.el.querySelector(".acc-pool [aria-pressed=true]").dataset.token, "t1");
  h.el.querySelector('[data-zone="cause"]').click();
  assert.deepEqual(h.get(), { t1: "cause" });
  assert.ok(said.some((m) => /placed in Cause/.test(m)));
  token("t3").click();
  h.el.querySelector('[data-zone="cause"]').click(); // a group holds several items
  assert.deepEqual(h.get(), { t1: "cause", t3: "cause" });
  [...h.el.querySelectorAll("button")].find((b) => /Undo/.test(b.textContent)).click();
  assert.deepEqual(h.get(), { t1: "cause" }, "undo reverses the last placement");
  h.el.querySelector(".acc-zone .acc-token").click(); // click a placed token to return it
  assert.deepEqual(h.get(), {});
  assert.ok(token("t1"), "a returned item is back in the list");
  // matching is one-to-one: placing onto a taken spot sends the earlier item back to the list
  const m = renderQuestion(
    set.items.find((i) => i.type === "matching"),
    ctxFor(d),
  );
  d.body.append(m.el);
  m.el.querySelector('.acc-pool [data-token="evap"]').click();
  m.el.querySelector('[data-zone="m2"]').click();
  m.el.querySelector('.acc-pool [data-token="cond"]').click();
  m.el.querySelector('[data-zone="m2"]').click();
  assert.deepEqual(m.get(), { cond: "m2" }, "the displaced item returns to the list");
  assert.ok(m.el.querySelector('.acc-pool [data-token="evap"]'));
});

test("choice renderer: eliminator keeps every choice selectable and only reports state", () => {
  const d = new JSDOM("<!doctype html><body></body>").window.document;
  const item = set.items.find((i) => i.type === "multiple-choice");
  const state = emptyToolState();
  const toolbar = {
    isEliminated: (id, o) => (state.eliminated[id] || []).includes(o),
    toggleChoice: (it, o) => ({ eliminated: toggleEliminated(state, it.id, o), allowed: true }),
  };
  const h = renderQuestion(item, ctxFor(d, { toolbar }));
  d.body.append(h.el);
  const strike = h.el.querySelector(".acc-strike");
  strike.click();
  assert.equal(strike.getAttribute("aria-pressed"), "true");
  assert.match(strike.getAttribute("aria-label"), /Restore choice A/);
  const row = h.el.querySelector(".acc-choice");
  assert.ok(row.classList.contains("is-eliminated"));
  assert.equal(
    row.querySelector("input").disabled,
    false,
    "a crossed-out choice is still a real, enabled control",
  );
  strike.click();
  assert.equal(row.classList.contains("is-eliminated"), false);
});

test("constructed response counts words in English and with apostrophes", () => {
  assert.equal(wordCount("It's a bright-green day."), 4);
  assert.equal(wordCount("   "), 0);
});
