// Wrong-answer notes (src/grade.js missNotes): `distractorFeedback` (whole wrong choices) and `itemFeedback` (a
// misplaced sort card, a wrong blank word, an out-of-place step). Every note must point at a real wrong part, and
// none may hand over the answer.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { missNotes } from "../access-practice-lab/src/grade.js";

const LAB = new URL("../access-practice-lab/content/", import.meta.url);
const activities = [];
for (const band of ["gK", "g1", "g2-3", "g3-5", "g6-8"])
  for (const f of readdirSync(new URL(`${band}/`, LAB)).filter((x) => x.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(new URL(`${band}/${f}`, LAB), "utf8"));
    for (const L of Object.values(d.levels || {})) for (const a of L.activities || []) activities.push(a);
  }
const word = (s) => new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");

test("distractorFeedback keys are wrong choices, and no note quotes the right choice", () => {
  const bad = [];
  for (const a of activities) {
    if (!a.distractorFeedback) continue;
    const ids = new Set((a.options || a.sentences || []).map((o) => o.id));
    const right = new Set(a.type === "multipleChoice" ? [a.answer] : a.answers || []);
    const rightText = (a.options || []).filter((o) => right.has(o.id)).map((o) => o.text);
    for (const [id, note] of Object.entries(a.distractorFeedback)) {
      if (!ids.has(id) || right.has(id)) bad.push(`${a.id}: key ${id}`);
      if (rightText.some((t) => t.split(/\s+/).length >= 3 && note.toLowerCase().includes(t.toLowerCase()))) bad.push(`${a.id}: ${id} quotes the answer`);
    }
  }
  assert.deepEqual(bad, []);
});

test("itemFeedback keys are real cards, blanks or steps, and no note names the answer", () => {
  const bad = [];
  for (const a of activities) {
    if (!a.itemFeedback) continue;
    if (!["sort", "cloze", "order"].includes(a.type)) bad.push(`${a.id}: itemFeedback on ${a.type}`);
    const parts =
      a.type === "cloze"
        ? new Map((a.segments || []).filter((s) => s.blank).map((s) => [s.blank.id, s.blank.answer]))
        : new Map((a.items || []).map((it) => [it.id, a.type === "sort" ? it.answer : null]));
    for (const [id, note] of Object.entries(a.itemFeedback)) {
      if (!parts.has(id)) bad.push(`${a.id}: key ${id}`);
      else if (typeof note !== "string" || note.split(/\s+/).length > 30) bad.push(`${a.id}: ${id} note shape`);
      else if (parts.get(id) && word(parts.get(id)).test(note)) bad.push(`${a.id}: ${id} names "${parts.get(id)}"`);
    }
  }
  assert.deepEqual(bad, []);
});

test("missNotes returns notes only for the parts that miss", () => {
  const sort = {
    type: "sort",
    items: [
      { id: "a", text: "newspaper", answer: "Paper" },
      { id: "b", text: "soup can", answer: "Metal" },
    ],
    itemFeedback: { a: "Think about what it is made of.", b: "It is hard and shiny." },
  };
  assert.deepEqual(missNotes(sort, { a: "Metal", b: "Metal" }), [{ label: "newspaper", note: "Think about what it is made of." }]);
  assert.deepEqual(missNotes(sort, { a: "Paper", b: "Metal" }), []);
  const cloze = { type: "cloze", segments: [{ text: "I " }, { blank: { id: "x", options: ["run", "ran"], answer: "ran" } }], itemFeedback: { x: "Yesterday tells you the time." } };
  assert.deepEqual(missNotes(cloze, { x: "run" }), [{ label: "run", note: "Yesterday tells you the time." }]);
  const order = { type: "order", items: [{ id: "1", text: "First" }, { id: "2", text: "Then" }], answer: ["1", "2"], itemFeedback: { 2: "Then comes after." } };
  assert.deepEqual(missNotes(order, ["2", "1"]), [{ label: "Then", note: "Then comes after." }]);
  const mc = { type: "multipleChoice", answer: "a", distractorFeedback: { b: "Not that one." } };
  assert.deepEqual(missNotes(mc, "b"), [{ label: "", note: "Not that one." }]);
  assert.deepEqual(missNotes(mc, "a"), []);
});
