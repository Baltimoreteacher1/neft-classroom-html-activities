import { test } from 'node:test';
import assert from 'node:assert/strict';
import { power } from './power-machine.mjs';
test('models the exponent as the number of equal factors', () => {
  assert.deepEqual(power(3, 4), { value: 81, steps: [1, 3, 9, 27, 81], expanded: '3 × 3 × 3 × 3' });
  assert.equal(power(4, 2).value, 16);
  assert.equal(power(2, 4).value, 16);
  assert.equal(power(5, 1).value, 5);
  assert.throws(() => power(2, 0), RangeError);
  assert.throws(() => power(2.5, 3), RangeError);
});
