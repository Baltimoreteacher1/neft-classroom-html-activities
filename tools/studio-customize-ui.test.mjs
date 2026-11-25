// Pure logic behind the Customize screens: review of a suggestion, My Activities grouping, chooser filtering.
import assert from "node:assert/strict";
import test from "node:test";
import { STUDIO_FAMILY as CORE_STUDIO_FAMILY } from "../access-practice-lab/src/studio/core/differentiate.js";
import {
  amountOf,
  applyChosen,
  diffWords,
  distinct,
  filterSources,
  groupVariants,
  isPlatform,
  LEVELS,
  levelOf,
  originOf,
  passesOrigin,
  proposalChanges,
  STUDIO_FAMILY,
  SUPPORT_AMOUNTS,
} from "../access-practice-lab/src/studio/editor/customize-logic.js";

const q = (id, prompt, correct = 0) => ({
  id,
  type: "question",
  format: "choice",
  prompt,
  choices: [
    { id: "a", text: "Yes" },
    { id: "b", text: "No" },
  ],
  correct,
});
const base = () => ({
  title: "Water cycle",
  description: "",
  blocks: [
    { id: "t1", type: "text", text: "Read the passage." },
    q("q1", "What is evaporation?"),
    q("q2", "What is rain?"),
  ],
});

test("diffWords marks removed and added words and keeps the rest", () => {
  const d = diffWords("Read the long passage", "Read the short passage");
  assert.deepEqual(
    d.map((s) => s.op),
    ["same", "del", "add", "same"],
  );
  assert.equal(d.find((s) => s.op === "del").text, "long");
  assert.equal(d.find((s) => s.op === "add").text, "short");
  assert.equal(diffWords("a b", "a b").length, 1);
});

test("proposalChanges lists changed, added and removed blocks and flags a changed answer key", () => {
  const b = base();
  const p = base();
  p.title = "The water cycle";
  p.blocks[1].prompt = "What is evaporation, in your own words?";
  p.blocks[2].correct = 1;
  p.blocks.splice(1, 0, q("q9", "New question"));
  p.blocks = p.blocks.filter((x) => x.id !== "t1");
  const changes = proposalChanges(b, p);
  const byId = Object.fromEntries(changes.map((c) => [c.id, c]));
  assert.equal(byId["@title"].kind, "title");
  assert.equal(byId.q1.kind, "changed");
  assert.equal(byId.q1.keyChanged, false);
  assert.equal(byId.q2.keyChanged, true);
  assert.equal(byId.q9.kind, "added");
  assert.equal(byId.t1.kind, "removed");
  assert.equal(proposalChanges(b, base()).length, 0, "identical content has no changes");
});

test("applyChosen applies only the selected changes and never mutates its inputs", () => {
  const b = base();
  const p = base();
  p.blocks[1].prompt = "Changed one";
  p.blocks[2].prompt = "Changed two";
  p.blocks.splice(2, 0, q("q9", "Added"));
  const snapshot = JSON.stringify(b);
  const next = applyChosen(b, p, new Set(["q1", "q9"]));
  assert.equal(JSON.stringify(b), snapshot);
  assert.equal(next.blocks.find((x) => x.id === "q1").prompt, "Changed one");
  assert.equal(
    next.blocks.find((x) => x.id === "q2").prompt,
    "What is rain?",
    "unselected change is not applied",
  );
  assert.deepEqual(
    next.blocks.map((x) => x.id),
    ["t1", "q1", "q9", "q2"],
    "an added block lands after its predecessor",
  );
  assert.deepEqual(applyChosen(b, p, new Set()), b, "nothing selected changes nothing");
  const removed = base();
  removed.blocks = removed.blocks.filter((x) => x.id !== "q2");
  assert.equal(applyChosen(b, removed, new Set(["q2"])).blocks.length, 2);
  assert.equal(applyChosen(b, removed, new Set()).blocks.length, 3);
});

test("originOf, passesOrigin and groupVariants", () => {
  const scratch = { id: "s1", lineage: null };
  const studio = { id: "s9", lineage: { family: "studio", ref: "s1", added: ["b1"] } };
  assert.equal(originOf(studio), "created", "a Studio-family lineage is not a platform original");
  assert.equal(isPlatform(studio.lineage), false);
  const custom = { id: "s2", lineage: { family: "access-bank", ref: "r" } };
  const version = {
    id: "s3",
    lineage: { family: "access-bank", ref: "r", variantOf: "s2", tier: "emerging" },
  };
  assert.equal(originOf(scratch), "created");
  assert.equal(originOf(custom), "customized");
  assert.equal(originOf(version), "version");
  assert.equal(originOf(null), "");
  const items = [scratch, custom, version].map((activity) => ({ id: activity.id, activity }));
  assert.deepEqual(
    items.filter((i) => passesOrigin(i, "version")).map((i) => i.id),
    ["s3"],
  );
  assert.equal(items.filter((i) => passesOrigin(i, "all")).length, 3);
  assert.equal(
    passesOrigin({ id: "x", activity: null }, "created"),
    false,
    "remote-only items show under All only",
  );
  const { top, versionsOf } = groupVariants(items);
  assert.deepEqual(
    top.map((i) => i.id),
    ["s1", "s2"],
  );
  assert.deepEqual(
    versionsOf.get("s2").map((i) => i.id),
    ["s3"],
  );
  assert.deepEqual(
    groupVariants([items[2]]).top.map((i) => i.id),
    ["s3"],
    "an orphan version stays visible",
  );
});

test("filterSources and distinct", () => {
  const items = [
    { id: "1", title: "Water cycle", grade: "6", domain: "Science", description: "Reading" },
    { id: "2", title: "Ratios", grade: "7", subject: "Math" },
    { id: "3", title: "Fractions" },
  ];
  assert.equal(filterSources(items, {}).length, 3);
  assert.deepEqual(
    filterSources(items, { grade: "6" }).map((i) => i.id),
    ["1"],
  );
  assert.deepEqual(
    filterSources(items, { domain: "math" }).map((i) => i.id),
    ["2"],
  );
  assert.deepEqual(
    filterSources(items, { text: "READING" }).map((i) => i.id),
    ["1"],
  );
  assert.deepEqual(
    distinct(items, (i) => i.grade),
    ["6", "7"],
  );
});

test("language level and amount of support are separate, and round-trip", () => {
  assert.deepEqual(
    LEVELS.map((l) => l.id),
    ["emerging", "developing", "expanding", "extension"],
  );
  for (const l of LEVELS) assert.equal(levelOf({ wida: l.wida }), l.id);
  assert.equal(levelOf({ wida: 0 }), "");
  assert.equal(levelOf({ wida: 1 }), "emerging");
  assert.equal(levelOf({ wida: 6 }), "extension");
  for (const [k, flags] of Object.entries(SUPPORT_AMOUNTS)) assert.equal(amountOf(flags), k);
  assert.equal(amountOf({ hints: false, frames: true }), "");
  for (const flags of Object.values(SUPPORT_AMOUNTS))
    assert.ok(!("spanish" in flags) && !("wida" in flags));
});

test("the editor's Studio family string is the one the core uses, and levels match the tiers", async () => {
  assert.equal(STUDIO_FAMILY, CORE_STUDIO_FAMILY);
  const { TIERS } = await import("../access-practice-lab/src/studio/core/schema.js");
  assert.deepEqual(
    LEVELS.map((l) => l.id),
    [...TIERS],
  );
});
