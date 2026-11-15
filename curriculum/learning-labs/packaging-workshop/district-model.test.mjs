import assert from 'node:assert/strict';
import { test } from 'node:test';
import { design, evaluate } from './district-model.mjs';

test('footprint and volume are different quantities and constraints are independent', () => {
  assert.deepEqual(design(3, 4, 2), { length: 3, width: 4, height: 2, footprint: 12, volume: 24 });
  assert.equal(evaluate(0, design(3, 4, 2)), 'met');
  assert.equal(evaluate(1, design(4, 4, 3)), 'footprint');
  assert.equal(evaluate(1, design(3, 4, 5)), 'height');
  assert.equal(evaluate(1, design(3, 4, 2)), 'capacity');
  assert.equal(evaluate(1, design(3, 4, 3)), 'met');
  assert.equal(evaluate(2, design(3, 4, 2)), 'same-footprint');
  assert.equal(evaluate(2, design(2, 3, 4)), 'met');
  assert.throws(() => design(0, 2, 4), RangeError);
});
