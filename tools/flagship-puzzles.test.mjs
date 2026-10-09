import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const context = vm.createContext({ window: {} });
vm.runInContext(
  readFileSync(new URL("../math/games/shared/flagship-puzzles.js", import.meta.url), "utf8"),
  context,
);
const create = context.window.FlagshipPuzzles.create;
for (const id of [
  "kitchen",
  "foundry",
  "ratio",
  "discount",
  "area",
  "expression",
  "equation",
  "variable",
  "volume",
  "stats",
]) {
  test(`${id}: both routes and all twelve chapter variants are solvable within control ranges`, () => {
    for (let seed = 0; seed < 12; seed++)
      for (let route = 0; route < 2; route++) {
        const puzzle = create(id, seed, route);
        let solution = null;
        function search(values) {
          if (solution) return;
          const field = puzzle.fields[values.length];
          if (!field) {
            if (puzzle.check(values)) solution = values;
            return;
          }
          for (
            let value = field.min ?? 0;
            value <= (field.max ?? field.options.length - 1);
            value++
          )
            search([...values, value]);
        }
        search([]);
        assert.ok(solution, `${id} seed=${seed}, route=${route} has no valid construction`);
        assert.match(puzzle.draw(solution), /^<svg /);
        assert.ok(!puzzle.draw(solution).includes("NaN"));
        assert.ok(puzzle.explain(solution).length > 15);
      }
  });
}
test("bay geometry and equal changes remain part of the math, not just final numeric answers", () => {
  const volume = create("volume", 0, 0);
  assert.equal(volume.check([3, 2, 2]), false);
  assert.equal(volume.check([2, 2, 3]), true);
  const balance = create("equation", 0, 0);
  assert.equal(balance.check([2, 3, 4]), false);
  assert.equal(balance.check([3, 3, 4]), true);
});
