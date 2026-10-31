#!/usr/bin/env node
import { strict as assert } from "node:assert";
// Publisher journey gate: content contract, WIDA ids against the lab's own alignment index, honest claims,
// inventory proof files exist, and the supported/independent evidence logic.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lab = join(root, "access-practice-lab");
const read = (p) => JSON.parse(readFileSync(join(lab, p), "utf8"));
const J = read("content/publisher/journey.json");
const E = read("content/publisher/demo-evidence.json");
const A = read("content/alignment-index.json");
const ev = await import(join(lab, "src/publisher/evidence.js"));
const errors = [];
const fail = (m) => errors.push(m);

// WIDA ids exist in the lab's alignment index.
const ids = new Set(A.expectationCatalog.map((e) => e.id));
for (const d of ["listening", "reading", "speaking", "writing"])
  for (const id of J[d].wida) if (!ids.has(id)) fail(`${d}: unknown expectation ${id}`);
for (const m of E.matrix) if (!ids.has(m.eld)) fail(`matrix: unknown expectation ${m.eld}`);

// Listening: the heard text must not appear in anything the learner reads before answering.
const visible = JSON.stringify([
  J.listening.context,
  J.listening.purpose,
  ...J.listening.tasks.flatMap((t) => [
    t.prompt,
    ...(t.options || []).map((o) => o.text),
    ...(t.items || []).map((i) => i.text),
  ]),
]);
for (const line of J.listening.script)
  for (const sentence of line.split(/(?<=\.)\s+/))
    if (sentence.length > 40 && visible.includes(sentence))
      fail(`listening: script sentence visible before answering: ${sentence.slice(0, 50)}`);

// Items: answers exist, options are 3+ with one key, answer positions vary, no duplicate options.
const mc = [...J.listening.tasks, ...J.reading.tasks].filter((t) => t.type === "multipleChoice");
for (const t of mc) {
  const texts = t.options.map((o) => o.text);
  if (new Set(texts).size !== texts.length) fail(`${t.id}: duplicate options`);
  if (!t.options.some((o) => o.id === t.answer)) fail(`${t.id}: answer not in options`);
  if (t.options.length < 4) fail(`${t.id}: needs 4 options`);
  for (const o of t.options)
    if (o.id !== t.answer && !t.distractors?.[o.id])
      fail(`${t.id}: no distractor rationale for ${o.id}`);
}
const longestIsKey = (x) =>
  [...x.options].sort((a, b) => b.text.length - a.text.length)[0].id === x.answer;
if (mc.filter(longestIsKey).length > Math.ceil(mc.length / 2))
  fail(`key is the longest option in ${mc.filter(longestIsKey).length} of ${mc.length} items`);
if (new Set(mc.map((t) => t.answer)).size < 2) fail("answer positions do not vary");
const ord = J.listening.tasks.find((t) => t.type === "order");
if (ev.defaultOrder(ord).join() === ord.answer.join())
  fail("order task starts in the answer order");
if (!ord.answer.every((a) => ord.items.some((i) => i.id === a))) fail("order answer ids missing");

// Speaking has no selection step and no model before speaking; claims are honest.
if (J.speaking.type || J.speaking.options) fail("speaking must not have options");
const claims =
  /\b(wida (level|score)|proficien\w+ level|placement|predict|official score|% (developed|proficient))\b/i;
const negated =
  /not (a |an )?(wida|official|placement)|never become|independent practice|not made|nothing here is an official|no wida/i;
for (const [where, text] of [
  ["journey", JSON.stringify(J)],
  ["evidence", JSON.stringify(E)],
])
  for (const sentence of text.split(/(?<=[.!?"])\s+/))
    if (claims.test(sentence) && !negated.test(sentence))
      fail(`${where}: unqualified claim: ${sentence.slice(0, 90)}`);
if (!/not an official/i.test(J.unofficial) || !/not made, scored, endorsed/i.test(E.disclaimer))
  fail("missing unofficial disclaimer");
if (/emoji|\p{Extended_Pictographic}/u.test(JSON.stringify(J) + JSON.stringify(E)))
  fail("emoji in journey content");

// Inventory proof exists; roadmap never says verified.
for (const r of E.inventory)
  for (const f of r.proof) if (!existsSync(join(root, f))) fail(`inventory proof missing: ${f}`);
for (const r of E.roadmap)
  if (/verified|shipped|done/i.test(r.status)) fail(`roadmap item marked ${r.status}`);

// Visual: diagram has title/desc and the journey alt text is substantive.
const svg = readFileSync(join(lab, "pictures/publisher/rain-garden.svg"), "utf8");
if (!/<title/.test(svg) || !/<desc/.test(svg)) fail("diagram missing title/desc");
if (J.reading.visual.alt.length < 80) fail("alt text too short for an instructional diagram");

// Evidence logic: supported never reads as independent; first attempt stays first.
const s = ev.freshState();
const t0 = J.reading.tasks[0];
ev.recordResult(s.read.results, t0, false, "independent");
ev.recordResult(s.read.results, t0, true, "supported");
assert.equal(s.read.results[t0.id].firstOk, false);
assert.equal(s.read.results[t0.id].stage, "independent");
assert.equal(s.read.results[t0.id].attempts, 2);
s.read.support = true;
assert.equal(ev.stageOf(s.read), "supported");
assert.equal(
  ev.isCorrect(
    J.reading.tasks.find((t) => t.id === "evidence"),
    "Pavement covers much of the ground, and pavement cannot absorb water.",
  ),
  true,
);
assert.equal(
  ev.isCorrect(
    J.reading.tasks.find((t) => t.id === "evidence"),
    "Water that soaks in can also be filtered.",
  ),
  false,
);
assert.equal(ev.nextStep(ev.freshState(), J), null);
const missed = ev.freshState();
ev.recordResult(
  missed.read.results,
  J.reading.tasks.find((t) => t.id === "data"),
  false,
  "independent",
);
assert.equal(ev.nextStep(missed, J).skill, "Comparing rows in a table");
const w = ev.freshState();
w.write.draft1 = J.writing.firstDraftExample;
assert.ok(ev.nextStep(w, J), "a weak first draft yields a next step");
w.write.draft1 = J.writing.modelDraft;
assert.equal(ev.groupByNeed(E.synthetic.class)[0].aliases.length, 2);

if (errors.length) {
  console.error(`validate-publisher-journey FAIL\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log(
  `validate-publisher-journey PASS · ${mc.length} multiple-choice + 2 constructed tasks · ${E.matrix.length} alignment rows · ${E.inventory.length} inventory items`,
);
