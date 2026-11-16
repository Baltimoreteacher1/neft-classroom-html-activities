import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compare, journey, minutes, progressAt, SCENARIOS } from './delivery-model.mjs';

test('travel time, arrival ordering and position use distance divided by speed', () => {
  const a = journey(10, 10), b = journey(15, 20);
  assert.equal(a.seconds, 3600);
  assert.equal(b.seconds, 2700);
  assert.equal(compare(a, b), 'b');
  assert.equal(compare(journey(10, 20), journey(15, 30)), 'tie');
  assert.equal(progressAt(b, 1350), 0.5);
  assert.equal(progressAt(b, 3600), 1);
  assert.equal(minutes(2700), '45 min');
  assert.throws(() => journey(10, 0), RangeError);
  assert.equal(SCENARIOS.length, 3);
});
