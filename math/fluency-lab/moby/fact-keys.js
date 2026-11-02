// Fact keys for the Moby fact model: parsing, the tracked fact universe, and fact families.
// add:3:8, sub:11:3, mul:6:7, div:42:6. Pure; no storage, no clock.
export const SYMBOL = { add: "+", sub: "−", mul: "×", div: "÷" };


const KEY_RE = /^(add|sub|mul|div):(\d{1,3}):(\d{1,3})$/;
export function parseKey(key) {
  const match = KEY_RE.exec(String(key ?? ""));
  return match ? { op: match[1], x: Number(match[2]), y: Number(match[3]) } : null;
}
export const makeKey = (op, x, y) => `${op}:${x}:${y}`;
const tens = (n) => n >= 10 && n % 10 === 0;

// The facts this model tracks: within-20 add/subtract, multiples of ten within 100, and times/division to 12 x 12.
// add/mul keys are commutative (smaller factor first); sub is minuend:subtrahend; div is dividend:divisor.
export function isTrackedKey(key) {
  const p = parseKey(key);
  if (!p) return false;
  const { op, x, y } = p;
  if (op === "add") return x <= y && (x + y <= 20 || (tens(x) && tens(y) && x + y <= 100));
  if (op === "sub") return y <= x && (x <= 20 || (tens(x) && tens(y) && y <= x - 10 && x <= 100));
  if (op === "mul") return x <= y && y <= 12;
  return y >= 1 && y <= 12 && x % y === 0 && x / y <= 12;
}

// The fact behind a question like "8 + 7 = ?" (the format every existing item uses), or null if it is not a
// tracked basic fact (multi-digit work, word problems, anything with an answer that does not agree).
export function keyFromItem(item) {
  const match = String(item?.question ?? "")
    .replaceAll(",", "")
    .match(/^(\d+) ([+−×÷]) (\d+) = \?$/);
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[3]);
  const op = { "+": "add", "−": "sub", "×": "mul", "÷": "div" }[match[2]];
  const key =
    op === "add" || op === "mul" ? makeKey(op, Math.min(a, b), Math.max(a, b)) : makeKey(op, a, b);
  if (!isTrackedKey(key)) return null;
  const answer = Number(item.answers?.[0]);
  return Number.isFinite(answer) && answer !== factParts(key).answer ? null : key;
}

export function factParts(key) {
  const p = parseKey(key);
  if (!p) return null;
  const { op, x, y } = p;
  const answer =
    op === "add" ? x + y : op === "sub" ? x - y : op === "mul" ? x * y : y ? x / y : NaN;
  return { op, a: x, b: y, answer, symbol: SYMBOL[op] };
}

// The fact family a key belongs to: the add (or mul) fact plus its subtraction (or division) partners, with all
// of their equations. sub and div keep their own records; this only links them.
export function familyOf(key) {
  const p = parseKey(key);
  if (!p || !isTrackedKey(key)) return null;
  const kind = p.op === "add" || p.op === "sub" ? "add" : "mul";
  let a;
  let b;
  let total;
  if (p.op === "add" || p.op === "mul")
    [a, b, total] = [p.x, p.y, kind === "add" ? p.x + p.y : p.x * p.y];
  else if (p.op === "sub")
    [a, b, total] = [Math.min(p.y, p.x - p.y), Math.max(p.y, p.x - p.y), p.x];
  else [a, b, total] = [Math.min(p.y, p.x / p.y), Math.max(p.y, p.x / p.y), p.x];
  const inverse = kind === "add" ? "sub" : "div";
  const forward = SYMBOL[kind];
  const back = SYMBOL[inverse];
  const keys = [makeKey(kind, a, b)];
  const equations = [`${a} ${forward} ${b} = ${total}`];
  if (a !== b) equations.push(`${b} ${forward} ${a} = ${total}`);
  for (const part of a === b ? [a] : [a, b]) {
    if (kind === "mul" && part === 0) continue;
    const other = kind === "add" ? total - part : total / part;
    const partner = makeKey(inverse, total, part);
    if (isTrackedKey(partner)) keys.push(partner);
    equations.push(`${total} ${back} ${part} = ${other}`);
  }
  return { id: keys[0], kind, a, b, total, keys, equations };
}
