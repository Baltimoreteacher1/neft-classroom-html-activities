// Adaptive mission feedback (src/views/missions-feedback.js): feedback names the learner's choice, retries are
// scaffolded before anything is revealed, and every mission in the lab carries the fields the feedback relies on.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import {
  COACH,
  EVIDENCE_REVEAL_AT,
  evidenceFeedback,
  questionFeedback,
} from "../access-practice-lab/src/views/missions-feedback.js";

const I = { S: (en) => en, T: (en) => en, mode: "en" };
const IES = { S: (_en, es) => es, T: (_en, es) => es, mode: "es" };
const dir = new URL("../access-practice-lab/content/missions/", import.meta.url);
const missions = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(new URL(f, dir), "utf8")));
const tasks = (kind) =>
  missions.flatMap((m) => m.phases.flatMap((p) => (p.tasks || []).filter((t) => t.kind === kind)));

const question = {
  id: "q",
  q: "Why does the team compare the water-test numbers?",
  options: [
    { id: "a", text: "The team wants to see which cover keeps more water." },
    { id: "b", text: "To decide who carries the cans.", distractor: "true-not-asked" },
    { id: "c", text: "To prove every bed is dry.", distractor: "overgeneralized" },
  ],
  answer: "a",
  explain: "Mateo says the team tested two covers and should compare the numbers before choosing.",
};

test("a correct answer teaches with the authored explanation", () => {
  const fb = questionFeedback(question, "a", 1, I);
  assert.deepEqual([fb.ok, fb.done, fb.msg], [true, true, question.explain]);
});

test("a first miss names the chosen option and coaches by distractor type, without revealing the key", () => {
  const fb = questionFeedback(question, "c", 1, I);
  assert.equal(fb.done, false);
  assert.match(fb.msg, /You chose “To prove every bed is dry\.”/);
  assert.ok(fb.msg.includes(COACH.overgeneralized[0]));
  assert.ok(!fb.msg.includes("keeps more water"));
  assert.match(questionFeedback(question, "c", 1, IES).msg, /^Elegiste /);
});

test("a second miss shows the answer and why", () => {
  const fb = questionFeedback(question, "b", 2, I);
  assert.equal(fb.done, true);
  assert.equal(fb.ok, false);
  assert.ok(fb.msg.includes("keeps more water") && fb.msg.includes(question.explain));
});

test("an option with no distractor type still gets a specific retry prompt, never a bare 'Not yet'", () => {
  const q = {
    ...question,
    options: question.options.map((o) => ({ ...o, distractor: undefined })),
  };
  const fb = questionFeedback(q, "b", 1, I);
  assert.match(fb.msg, /You chose .+ Reread it/);
});

const ev = {
  id: "e",
  q: "Choose the details that support trying a soil cover.",
  boardLabel: "Notes",
  explain: "A cover can be tried now when the team has one and a bed is drying out.",
  pool: [
    { id: "s1", text: "tray with dry leaves", supports: true },
    { id: "s2", text: "sunny bed is dry by Wednesday", supports: true },
    { id: "n1", text: "Monday and Thursday", supports: false },
    { id: "n2", text: "straw next month", supports: false },
  ],
};

test("evidence: the right set finishes and explains why", () => {
  const fb = evidenceFeedback(ev, ["s1", "s2"], 1, I);
  assert.deepEqual([fb.ok, fb.done, fb.revealed], [true, true, false]);
  assert.ok(fb.msg.includes(ev.explain));
});

test("evidence: a wrong pick is named, a missing one is counted, and nothing is revealed early", () => {
  const fb = evidenceFeedback(ev, ["s1", "n1"], 1, I);
  assert.equal(fb.done, false);
  assert.ok(fb.msg.includes("“Monday and Thursday”"));
  assert.match(fb.msg, /missing 1 supporting statement\./);
  assert.ok(!fb.msg.includes("sunny bed"), "must not reveal the statement the learner left out");
  assert.ok(!/Check once more/.test(fb.msg));
});

test("evidence: the last retry says what happens next, then the supporting statements are shown", () => {
  const warn = evidenceFeedback(ev, ["n1", "n2"], EVIDENCE_REVEAL_AT - 1, I);
  assert.match(warn.msg, /Check once more/);
  assert.match(warn.msg, /and 1 more/);
  const shown = evidenceFeedback(ev, ["n1", "n2"], EVIDENCE_REVEAL_AT, I);
  assert.deepEqual([shown.done, shown.revealed], [true, true]);
  assert.ok(shown.msg.includes("tray with dry leaves") && shown.msg.includes("sunny bed"));
  assert.ok(shown.msg.includes(ev.explain));
});

test("evidence: Spanish copy is complete", () => {
  const fb = evidenceFeedback(ev, ["n1"], 2, IES);
  assert.match(fb.msg, /Mira otra vez/);
  assert.match(fb.msg, /Te faltan 2 afirmaciones de apoyo/);
  assert.match(evidenceFeedback(ev, ["s1", "n1"], 1, IES).msg, /Te falta 1 afirmación de apoyo/);
});

test("every shipped mission question and evidence task carries what the feedback needs", () => {
  assert.ok(tasks("question").length >= 50 && tasks("evidence").length >= 10);
  for (const t of tasks("question")) {
    assert.ok(t.explain.length >= 60, `${t.id}: explain`);
    for (const o of t.options)
      if (o.id !== t.answer) assert.ok(COACH[o.distractor], `${t.id}/${o.id}: distractor type`);
  }
  for (const t of tasks("evidence")) {
    assert.ok(t.explain.length >= 60, `${t.id}: explain`);
    assert.ok(t.boardLabel, `${t.id}: boardLabel`);
    // Every pool statement the reveal would print is supported and distinct.
    const shown = t.pool.filter((x) => x.supports).map((x) => x.text);
    assert.equal(new Set(shown).size, shown.length, `${t.id}: duplicate statements`);
  }
});
