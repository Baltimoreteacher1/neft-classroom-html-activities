import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);
const { default: specs } = await import("../access-practice-lab/src/content/listen-for-clue.js");
const find = (node, id) => {
  if (Array.isArray(node)) return node.map((x) => find(x, id)).find(Boolean);
  if (!node || typeof node !== "object") return null;
  if (node.id === id && node.script) return node;
  return (
    Object.values(node)
      .map((x) => find(x, id))
      .find(Boolean) || null
  );
};

test("Listen for the Clue uses three existing, scripted items per band", () => {
  for (const [band, rounds] of Object.entries(specs)) {
    assert.equal(rounds.length, 3, `${band} should have three rounds`);
    const source = JSON.parse(
      readFileSync(new URL(`access-practice-lab/content/${band}/Listening.json`, root), "utf8"),
    );
    for (const round of rounds) {
      const item = find(source, round.id);
      assert.ok(item, `${round.id} is in the Listening catalog`);
      assert.ok(round.question && round.cue && round.focus);
      assert.equal(round.options.length, 3);
      assert.equal(new Set(round.options).size, 3);
      assert.ok(round.answer >= 0 && round.answer < round.options.length);
      assert.ok(round.evidence.length >= 3);
      assert.ok(round.evidence[round.evidenceAnswer]);
      assert.ok(
        item.script.includes(round.evidence[round.evidenceAnswer]),
        `${round.id}: supporting words occur in its exact source script`,
      );
      assert.ok(
        item.script.includes(round.focus),
        `${round.id}: focused replay occurs in its exact source script`,
      );
    }
  }
});
