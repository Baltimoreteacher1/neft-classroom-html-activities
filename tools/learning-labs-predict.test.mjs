import assert from "node:assert/strict";
import { direction, judge } from "../curriculum/learning-labs/shared/predict.mjs";

assert.equal(direction(5, 6), "up");
assert.equal(direction(6, 5), "down");
assert.equal(direction(0.1 + 0.2, 0.3), "same", "float noise is not a change");
const right = judge("up", 35, 70, "Shaded amount");
assert.ok(right.ok);
assert.match(right.message, /rose from 35 to 70/);
const wrong = judge("down", 35, 70, "Shaded amount");
assert.ok(!wrong.ok);
assert.match(wrong.message, /^✗ You predicted Shaded amount would go down, but it rose/);
assert.ok(judge("same", 12, 12).ok);
assert.match(judge("same", 12, 12).message, /stayed at 12/);
console.log("learning-labs-predict: judging OK.");
