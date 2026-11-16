import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allocate, feedback, fraction } from './grid-model.mjs';

test('allocation, equivalence, shortage and challenge rules use exact whole units', () => {
  assert.deepEqual(allocate(40, 35, 30), { clinic: 40, school: 35, park: 30, total: 105, surplus: 0, shortage: 5 });
  assert.match(feedback(1, allocate(40, 35, 30)), /exceeds supply by 5/);
  assert.match(feedback(1, allocate(40, 35, 25)), /shortage is resolved/);
  assert.match(feedback(0, allocate(50, 25, 25)), /meets all/);
  assert.match(feedback(2, allocate(40, 40, 20)), /twice/);
  assert.match(feedback(2, allocate(40, 35, 25)), /twice/);
  assert.equal(fraction(0), '0/1');
  assert.equal(fraction(25), '1/4');
  assert.equal(fraction(40), '2/5');
  assert.throws(() => allocate(43, 35, 22), RangeError);
});
