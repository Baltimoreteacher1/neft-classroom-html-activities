// Student path (/path) and the three scaffold tools (/scaffold/*): content contract and evidence flow.
// Every item is valid for its tool, both grade bands and all four Key Language Uses are covered, every
// authored answer passes its own checker, and no feedback, hint or frame ever states the answer. A scaffold
// attempt reaches the skill graph and the constellation, and an opened support is never recorded as independent.
import assert from "node:assert/strict";
import test from "node:test";
import {
  ALL_ITEMS,
  EVIDENCE_CONNECTORS,
  EVIDENCE_ITEMS,
  MODELS,
  SENTENCE_CONNECTORS,
  SENTENCE_ITEMS,
  TOOLS,
  UPGRADE_ITEMS,
} from "../access-practice-lab/src/content/scaffold-items.js";
import { analyzeResponse } from "../access-practice-lab/src/lang/analyze.js";
import { buildConstellation } from "../access-practice-lab/src/lang/constellation.js";
import { makeEntry } from "../access-practice-lab/src/lang/ledger.js";
import { TASK_KINDS } from "../access-practice-lab/src/lang/readiness.js";
import {
  checkEvidence,
  checkSentence,
  checkUpgrade,
  sentenceText,
} from "../access-practice-lab/src/lang/scaffold-check.js";
import { buildSkillGraph } from "../access-practice-lab/src/lang/skill-graph.js";
import { entryHref, pathTasks, readPath } from "../access-practice-lab/src/views/path-data.js";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const USES = ["Narrate", "Inform", "Explain", "Argue"];
const lower = (x) => String(x).toLowerCase();
const placedFrom = (item, ids) => Object.fromEntries(item.slots.map((s, i) => [s.id, ids[i]]));
const answerSentence = (item) => sentenceText(item, placedFrom(item, item.answer));
/** Text a learner must produce themselves: the correct tiles (connector words are one-word choices, not answers). */
const answerTiles = (item) =>
  item.tiles.filter((t) => t.role !== "off-topic").map((t) => lower(t.text));

test("every tool has at least six items, both bands, and all four Key Language Uses", () => {
  for (const tool of Object.keys(TOOLS)) {
    assert.ok(
      TASK_KINDS[tool],
      `${tool} is a readiness task kind, so a recommendation links to it`,
    );
    const items = ALL_ITEMS.filter((i) => i.tool === tool);
    assert.ok(items.length >= 6, `${tool}: ${items.length} items`);
    for (const band of ["3-5", "6-8"]) {
      const inBand = items.filter((i) => i.band === band);
      assert.ok(inBand.length >= 3, `${tool} ${band}`);
      assert.deepEqual(
        [...new Set(inBand.map((i) => i.use))].sort(),
        [...USES].sort(),
        `${tool} ${band} covers every use`,
      );
    }
    assert.ok(MODELS[tool]?.text && MODELS[tool].steps.length >= 3, `${tool} has a worked model`);
  }
  assert.equal(new Set(ALL_ITEMS.map((i) => i.id)).size, ALL_ITEMS.length, "item ids are unique");
});

test("every item states a target, a prompt and a hint, and makes no score or level claim", () => {
  for (const item of ALL_ITEMS) {
    for (const k of ["target", "prompt", "hint", "topic"])
      assert.ok(String(item[k] || "").length > 8 || k === "topic", `${item.id} ${k}`);
    const all = JSON.stringify(item);
    assert.ok(!SCORE_CLAIM.test(all), `${item.id} makes a score claim`);
    assert.ok(
      !/%|\bpercent\b|\blevel [1-6]/i.test(all),
      `${item.id} mentions a percentage or a level`,
    );
  }
});

test("Sentence Architecture: the answer passes, every mistake names a part, and no message gives the answer", () => {
  for (const item of SENTENCE_ITEMS) {
    assert.equal(item.slots.length, item.answer.length, item.id);
    assert.ok(
      item.tiles.some((t) => t.role === "off-topic" && t.why),
      `${item.id} has an off-topic distractor with a reason`,
    );
    assert.ok(
      item.connectors.every((c) => Object.hasOwn(SENTENCE_CONNECTORS, c)),
      item.id,
    );
    const good = checkSentence(item, placedFrom(item, item.answer));
    assert.ok(good.ok, `${item.id}: ${good.message}`);
    const full = lower(answerSentence(item));
    const secrets = [full, ...answerTiles(item)];
    const wrongConnector = Object.keys(SENTENCE_CONNECTORS).find(
      (c) => !item.connectors.includes(c),
    );
    const distractor = item.tiles.find((t) => t.role === "off-topic").id;
    const attempts = [
      {},
      placedFrom(item, item.answer.slice(0, -1)),
      placedFrom(item, [...item.answer].reverse()),
      placedFrom(
        item,
        item.answer.map((id) => (id === item.connectors[0] ? wrongConnector : id)),
      ),
      placedFrom(
        item,
        item.answer.map((id, i) => (i === item.answer.length - 1 ? distractor : id)),
      ),
    ];
    for (const placed of attempts) {
      const r = checkSentence(item, placed);
      assert.equal(r.ok, false, `${item.id} accepts a wrong build`);
      assert.ok(r.message.length > 10);
      for (const secret of secrets)
        assert.ok(!lower(r.message).includes(secret), `${item.id} feedback reveals "${secret}"`);
    }
    for (const secret of secrets)
      assert.ok(!lower(item.hint).includes(secret), `${item.id} hint reveals "${secret}"`);
    assert.match(
      checkSentence(
        item,
        placedFrom(
          item,
          item.answer.map((id) => (id === item.connectors[0] ? wrongConnector : id)),
        ),
      ).message,
      /connector/,
    );
  }
});

test("Evidence Builder: the answer passes, irrelevant cards are named, supporting cards are never revealed", () => {
  for (const item of EVIDENCE_ITEMS) {
    const supports = item.cards.filter((c) => c.supports);
    const misses = item.cards.filter((c) => !c.supports);
    assert.ok(
      supports.length >= item.need && misses.length >= 1 && misses.every((c) => c.why),
      item.id,
    );
    assert.ok(
      item.connectors.every((c) => Object.hasOwn(EVIDENCE_CONNECTORS, c)),
      item.id,
    );
    assert.ok(
      checkEvidence(item, { selected: item.answer.cards, connector: item.answer.connector }).ok,
      item.id,
    );
    const wrong = checkEvidence(item, { selected: [misses[0].id], connector: "However," });
    assert.equal(wrong.ok, false);
    assert.ok(
      wrong.messages.some((m) => m.includes(misses[0].text)),
      `${item.id} names the card that does not support`,
    );
    const secrets = [
      ...supports.map((c) => lower(c.text)),
      lower(item.claim) + " " + lower(item.answer.connector),
    ];
    for (const msg of [...wrong.messages, ...checkEvidence(item, {}).messages, item.hint])
      for (const secret of secrets)
        assert.ok(!lower(msg).includes(secret), `${item.id} reveals "${secret.slice(0, 40)}"`);
    if (item.ordered) {
      const reversed = checkEvidence(item, {
        selected: [...item.answer.cards].reverse(),
        connector: item.answer.connector,
      });
      assert.equal(reversed.orderOk, false, `${item.id} checks event order`);
    }
  }
});

test("Language Upgrade Lab: the sample revision passes, the original fails, and no message gives the revision", () => {
  for (const item of UPGRADE_ITEMS) {
    const good = checkUpgrade(item, item.answer);
    assert.ok(good.ok, `${item.id}: ${good.messages.join(" ")}`);
    const same = checkUpgrade(item, item.informal);
    assert.equal(same.ok, false);
    const lazy = checkUpgrade(item, `${item.informal} and more`);
    assert.equal(lazy.ok, false, `${item.id} accepts a revision that keeps the general word`);
    for (const msg of [
      ...same.messages,
      ...lazy.messages,
      item.hint,
      item.frame,
      ...checkUpgrade(item, "").messages,
    ])
      assert.ok(!lower(msg).includes(lower(item.answer)), `${item.id} reveals the sample revision`);
    assert.ok(!item.frame.toLowerCase().includes(item.answer.toLowerCase().slice(0, 30)), item.id);
  }
});

/** The entry the scaffold view writes for one check (src/views/scaffold.js `check`). */
function scaffoldEntry(item, { stage, supports = {}, t }) {
  const text = answerSentence(item);
  const a = analyzeResponse(text, { keyUse: item.use, stage });
  const moves = Object.fromEntries(item.slots.map((s) => [s.id, 1]));
  return makeEntry({
    t,
    src: "scaffold",
    task: item.id,
    band: item.band,
    domain: "Writing",
    use: item.use,
    stage,
    kind: "first",
    supports,
    m: { ...a.ledger, moves, ok: 1 },
  });
}

test("a scaffold attempt becomes Writing evidence that the constellation reads; an opened support is supported", () => {
  const item = SENTENCE_ITEMS.find((i) => i.band === "6-8");
  const t = new Date().toISOString();
  const independent = scaffoldEntry(item, { stage: "independent", t });
  assert.equal(independent.stage, "independent");
  const graph = buildSkillGraph([independent], {});
  const writing = graph.filter((s) => s.domain === "Writing" && s.evidenceCount > 0);
  assert.ok(writing.length >= 5, "the attempt reaches the Writing skills");
  assert.ok(writing.every((s) => s.independentEvidenceCount === 1));
  const nodes = buildConstellation([independent], {}, { graph }).nodes;
  assert.notEqual(nodes.find((n) => n.id === "elaborate").state, "not-started");
  const helped = scaffoldEntry(item, {
    stage: "independent",
    supports: { frames: true, bank: true },
    t,
  });
  assert.equal(helped.stage, "supported", "an opened frame or bank makes the attempt supported");
  assert.ok(buildSkillGraph([helped], {}).every((s) => s.independentEvidenceCount === 0));
});

test("the path always has a mission with a task, and every entry links somewhere real", () => {
  for (const band of ["3-5", "6-8"]) {
    const tasks = pathTasks(band);
    assert.deepEqual([...new Set(tasks.map((x) => x.domain))].sort(), [
      "Listening",
      "Reading",
      "Speaking",
      "Writing",
    ]);
    const d = readPath(band);
    assert.ok(d.mission.taskId, `${band}: empty state still has a mission`);
    assert.ok(d.missionTask?.href.startsWith("/access-practice-lab/"));
    assert.equal(d.readiness.recommendations.length, 0, "no evidence, no recommendation");
  }
  assert.match(
    entryHref({ src: "scaffold", task: SENTENCE_ITEMS[0].id }, "3-5"),
    /\/scaffold\/sentence-architecture\?grades=3-5&item=/,
  );
  assert.match(entryHref({ src: "writing", task: "w1", domain: "Writing" }, "6-8"), /\/write\/w1/);
  assert.match(entryHref({ src: "item", task: "x", domain: "Reading" }, "6-8"), /\/Reading\?/);
});
