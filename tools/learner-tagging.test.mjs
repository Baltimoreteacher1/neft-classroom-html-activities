// G-29: skill graph and activity tagging over all 162 units (2,011 activities).
// Negative controls: an unknown kind, an unknown domain and an orphan node must be flagged.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BCPSS_UNITS, UNIT_CONNECTIONS } from "../data/bcpss-curriculum-seed.mjs";
import { DOMAINS, KINDS } from "../db/seeds/bcpss/v2/schema.mjs";
import { loadStudio } from "../functions/_lib/bcpss/studio.js";
import {
  ACTIVITY_DOMAINS,
  ACTIVITY_KINDS,
  buildSkillGraph,
  coverageFindings,
  describeUnit,
  exercisesFor,
  itemsExercises,
  KIND_DOMAINS,
  KIND_TIER,
  parseNodeId,
  tagUnit,
  topologicalOrder,
  vocabNodeId,
} from "../shared/learner/index.js";

const connections = new Map(UNIT_CONNECTIONS.map((c) => [c.unit_id, c]));
const loaded = [];
for (const row of BCPSS_UNITS) {
  const studio = await loadStudio(row.id);
  loaded.push({ row, studio, unit: describeUnit(row, connections.get(row.id), studio) });
}
const graph = buildSkillGraph(loaded.map((l) => l.unit));
const tagged = loaded.flatMap((l) => tagUnit(l.unit, l.studio));

test("constants match the content schema (single source of truth)", () => {
  assert.deepEqual([...ACTIVITY_KINDS], KINDS);
  assert.deepEqual([...ACTIVITY_DOMAINS], DOMAINS);
  assert.deepEqual(Object.keys(KIND_DOMAINS).sort(), [...KINDS].sort());
  assert.deepEqual(Object.keys(KIND_TIER).sort(), [...KINDS].sort());
});

test("G-29 sweep: 162 units, 2,011 activities, every activity has >= 1 node, no orphans", () => {
  assert.equal(loaded.length, 162);
  assert.equal(tagged.length, 2011);
  const findings = coverageFindings(graph, tagged);
  assert.deepEqual(findings.slice(0, 10), []);
  assert.equal(new Set(tagged.map((t) => t.id)).size, tagged.length, "activity ids are unique");
});

test("graph: 48 language nodes, unique ids, edges reference nodes, acyclic", () => {
  const ids = graph.nodes.map((n) => n.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(graph.nodes.filter((n) => n.type === "language").length, 48);
  const known = new Set(ids);
  for (const e of graph.edges) assert.ok(known.has(e.from) && known.has(e.to), `${e.from}>${e.to}`);
  assert.ok(topologicalOrder(graph), "graph has a cycle");
  for (const id of ids) parseNodeId(id);
});

test("every unit's klu is derived from real data and every klu appears", () => {
  const seen = new Set(loaded.map((l) => l.unit.klu));
  assert.deepEqual([...seen].sort(), ["Argue", "Explain", "Inform", "Narrate"]);
});

test("tagging is deterministic", () => {
  const again = loaded.flatMap((l) => tagUnit(l.unit, l.studio));
  assert.deepEqual(again, tagged);
});

test("vocabulary activities exercise every unit term; items narrow to their own term", () => {
  const l = loaded.find((x) => x.studio.activities.some((a) => a.kind === "match"));
  const index = l.studio.activities.findIndex((a) => a.kind === "match");
  const activity = l.studio.activities[index];
  const nodes = exercisesFor(activity, l.unit);
  for (const term of l.unit.vocab) assert.ok(nodes.includes(vocabNodeId(l.unit.id, term)));
  const items = itemsExercises(activity, l.unit, index);
  assert.ok(items.length >= 6);
  for (const item of items) {
    assert.ok(item.exercises.length >= 1);
    assert.ok(item.exercises.filter((id) => id.startsWith("vocab.")).length <= 1);
  }
});

test("every item of every activity declares >= 1 node", () => {
  for (const l of loaded) {
    l.studio.activities.forEach((a, i) => {
      for (const item of itemsExercises(a, l.unit, i))
        assert.ok(item.exercises.length > 0, item.itemId);
    });
  }
});

test("negative control: unknown kind fails loudly", () => {
  const { unit, studio } = loaded[0];
  assert.throws(
    () => exercisesFor({ ...studio.activities[0], kind: "karaoke" }, unit),
    /unknown activity kind/,
  );
  assert.throws(
    () => exercisesFor({ ...studio.activities[0], domain: "Dance" }, unit),
    /unknown activity domain/,
  );
  assert.throws(
    () => exercisesFor(studio.activities[0], { ...unit, klu: "Sing" }),
    /key language use/,
  );
});

test("negative control: an orphan node and an untagged activity are flagged", () => {
  const extra = {
    ...graph,
    nodes: [...graph.nodes, { id: "std.ZZ.9.9", type: "standard", code: "ZZ.9.9" }],
  };
  assert.ok(
    coverageFindings(extra, tagged).some(
      (f) => f.code === "orphan-node" && f.node === "std.ZZ.9.9",
    ),
  );
  const bad = [
    ...tagged,
    { id: "x:a01", exercises: [] },
    { id: "x:a02", exercises: ["lang.nope.x.y"] },
  ];
  const codes = coverageFindings(graph, bad).map((f) => f.code);
  assert.ok(codes.includes("no-nodes") && codes.includes("unknown-node"));
});
