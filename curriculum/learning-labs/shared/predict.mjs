// Predict-then-test: the student says what the readout will do, changes the model, and the model's own math
// answers. Pure judging here; the page wires it to the live model.
const key = (n) => Number(Number(n).toFixed(6));
export const direction = (before, after) => (key(after) > key(before) ? 'up' : key(after) < key(before) ? 'down' : 'same');
export const WORDS = { up: 'go up', down: 'go down', same: 'stay the same' };

/** Compares a prediction with what happened. Returns { ok, actual, message }. */
export function judge(predicted, before, after, label = 'the readout') {
  const actual = direction(before, after);
  const ok = predicted === actual;
  const move = actual === 'same' ? `stayed at ${key(after)}` : `${actual === 'up' ? 'rose' : 'fell'} from ${key(before)} to ${key(after)}`;
  return {
    ok, actual,
    message: ok
      ? `✓ You predicted ${label} would ${WORDS[predicted]}, and it ${move}.`
      : `✗ You predicted ${label} would ${WORDS[predicted]}, but it ${move}. Look at which quantity you changed and why that moved the result.`,
  };
}
