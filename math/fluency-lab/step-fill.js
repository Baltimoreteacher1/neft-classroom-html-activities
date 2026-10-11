// "Your turn" steps: a guided step that ends in a partial result ("34 + 50 = 84") asks the learner to type that
// number before it is shown. The result is kept here, never in the page, and a step opens by itself after
// two wrong tries so nobody is stuck.
const FILL = /^(.*\d.*\S) = (-?[\d,]*\.?\d+)$/;
const solved = new Set();
const pending = new Map();
const wrong = new Map();

export const fillKey = (id, index, line) => `${id}|${index}|${line}`;

// { left, result } when this step can be a fill-in, else null. The last step names the answer and never is.
export function splitFill(line, index, steps) {
  if (index >= steps.length - 1) return null;
  const match = String(line).match(FILL);
  return match ? { left: match[1], result: match[2] } : null;
}

export const isSolved = (key) => solved.has(key);
export const register = (key, result) => pending.set(key, result);
export const normalize = (value) => String(value).replace(/[,\s]/g, "").replace("−", "-");

const matches = (value, expected) =>
  normalize(value) === normalize(expected) || (value.trim() !== "" && Number(normalize(value)) === Number(normalize(expected)));

// True when the typed value is already right (no state change), so a correct entry can open the step at once.
export const peekFill = (key, value) => pending.has(key) && matches(value, pending.get(key));

export function tryFill(key, value) {
  const expected = pending.get(key);
  if (expected === undefined) return "gone";
  if (matches(value, expected)) {
    solved.add(key);
    return "right";
  }
  const count = (wrong.get(key) || 0) + 1;
  wrong.set(key, count);
  if (count >= 2) {
    solved.add(key);
    return "shown";
  }
  return "wrong";
}
