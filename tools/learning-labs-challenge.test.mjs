/* Model challenges: every lab gets three readable, distinct, reachable targets. */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { makeChallenges, reached } from "../curriculum/learning-labs/shared/challenge.mjs";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";

const root = "curriculum/learning-labs";
const labs = readdirSync(root).filter((d) => existsSync(`${root}/${d}/content.json`));
assert.equal(labs.length, 46);
let total = 0;
for (const id of labs) {
  const { model } = JSON.parse(readFileSync(`${root}/${id}/content.json`, "utf8"));
  const list = makeChallenges(id, model);
  assert.equal(list.length, 3, `${id}: three challenges`);
  assert.equal(new Set(list.map((c) => c.target)).size, 3, `${id}: distinct targets`);
  assert.deepEqual(
    makeChallenges(id, model).map((c) => c.target),
    list.map((c) => c.target),
    `${id}: deterministic`,
  );
  const start = evaluate(model, model.values).value;
  for (const c of list) {
    assert.ok(!reached(start, c.target), `${id}: target ${c.target} is not where the model starts`);
    assert.ok(
      reached(evaluate(model, c.example).value, c.target),
      `${id}: ${c.target} is reachable at ${c.example}`,
    );
    assert.ok(c.label, `${id}: has a readout label`);
    total++;
  }
}
assert.ok(reached(0.1 + 0.2, 0.3), "float noise does not block a correct answer");
assert.ok(!reached(0.31, 0.3));
console.log(`learning-labs-challenge: ${total} targets across ${labs.length} labs, all reachable.`);
