import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluate } from './factory-model.mjs';

const base = { grouping: 'grouped', a: 2, b: 3, base: 2, exponent: 2, x: 4, multiplier: 2, bonus: 3 };
test('factory follows grouping and powers, and proves equivalence with coefficients', () => {
  const grouped = evaluate(base);
  assert.equal(grouped.first, 18); assert.equal(grouped.second, 15); assert.equal(grouped.equivalent, false);
  assert.equal(evaluate({ ...base, grouping: 'ungrouped' }).first, 15);
  assert.equal(evaluate({ ...base, bonus: 6 }).equivalent, true);
  const trap = evaluate({ ...base, multiplier: 3, bonus: 2 });
  assert.equal(trap.first, trap.second); assert.equal(trap.equivalent, false); assert.notEqual(trap.otherA, trap.otherB);
  assert.equal(evaluate({ ...base, exponent: 3 }).first, 22);
  assert.throws(() => evaluate({ ...base, x: 0 }), RangeError);
});
