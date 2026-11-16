// Balance Breakout — the mathematics. Pure functions, no DOM, no game state.
// Lessons 8-1 (equations and their solutions), 8-2 (solve with addition and
// subtraction), 8-3 (solve with multiplication and division).
//
// A pan holds items:
//   { k: "x" }            one mystery crate (weight x)
//   { k: "half" }         a mystery crate in a half-frame (weight x / 2)
//   { k: "w", v }         a known block of weight v
//   { k: "b", v }         a lift balloon pulling up v (weight −v)
// A side's value is a linear expression a·x + c, kept as exact integers in
// halves: { a2, c } means (a2 / 2)·x + c.

/** The side as { a2, c }: twice the coefficient of x, and the constant. */
export function side(items) {
  let a2 = 0;
  let c = 0;
  for (const it of items) {
    if (it.k === "x") a2 += 2;
    else if (it.k === "half") a2 += 1;
    else if (it.k === "w") c += it.v;
    else if (it.k === "b") c -= it.v;
  }
  return { a2, c };
}

/** Weight of a side for a given x (what the beam actually feels). */
export function weight(items, x) {
  const s = side(items);
  return (s.a2 * x) / 2 + s.c;
}

/** True when the two sides weigh the same for this x (the beam is level). */
export function balanced(left, right, x) {
  return weight(left, x) * 2 === weight(right, x) * 2;
}

/** Text for one side: "3x + 2", "x/2", "x − 2", "12". */
export function sideText(items) {
  const { a2, c } = side(items);
  const parts = [];
  if (a2) {
    if (a2 % 2) parts.push(a2 === 1 ? "x/2" : `${a2}x/2`);
    else parts.push(a2 === 2 ? "x" : `${a2 / 2}x`);
  }
  if (c > 0) parts.push(parts.length ? `+ ${c}` : String(c));
  if (c < 0) parts.push(parts.length ? `− ${-c}` : `−${-c}`);
  return parts.length ? parts.join(" ") : "0";
}

export function equationText(left, right) {
  return `${sideText(left)} = ${sideText(right)}`;
}

/** x is isolated: one side is exactly one crate, the other has no crate. */
export function isolated(left, right) {
  const l = side(left);
  const r = side(right);
  return (
    (l.a2 === 2 && l.c === 0 && left.length === 1 && r.a2 === 0) ||
    (r.a2 === 2 && r.c === 0 && right.length === 1 && l.a2 === 0)
  );
}

/** The value an isolated equation shows for x. */
export function isolatedValue(left, right) {
  return side(left).a2 ? side(right).c : side(left).c;
}

/** Solve a·x + c = d·x + e exactly (as a number), or null when it has no single solution. */
export function solve(left, right) {
  const l = side(left);
  const r = side(right);
  const da = l.a2 - r.a2;
  if (!da) return null;
  return ((r.c - l.c) * 2) / da;
}

/** Can a side be split into k identical groups? (Same items k times over.) */
export function splittable(items, k) {
  if (k < 2) return false;
  const count = new Map();
  for (const it of items) {
    const key = `${it.k}:${it.v ?? ""}`;
    count.set(key, (count.get(key) || 0) + 1);
  }
  for (const n of count.values()) if (n % k) return false;
  return true;
}

/** One of k identical groups of a side (assumes splittable). */
export function oneGroup(items, k) {
  const count = new Map();
  const out = [];
  for (const it of items) {
    const key = `${it.k}:${it.v ?? ""}`;
    const seen = (count.get(key) || 0) + 1;
    count.set(key, seen);
    if (seen % k === 1 || k === 1) out.push(it);
  }
  return out;
}

/** Double a side: every item twice; a half-crate pair becomes one crate. */
export function doubled(items) {
  const out = [];
  for (const it of items) {
    if (it.k === "half") out.push({ k: "x" });
    else out.push({ ...it }, { ...it });
  }
  return out;
}

/** A known block and a balloon of the same size cancel (a zero pair). */
export function cancelPairs(items) {
  const out = items.slice();
  for (let i = 0; i < out.length; i++) {
    if (out[i]?.k !== "b") continue;
    const j = out.findIndex((it) => it.k === "w" && it.v === out[i].v);
    if (j >= 0) {
      const a = Math.max(i, j);
      const b = Math.min(i, j);
      out.splice(a, 1);
      out.splice(b, 1);
      i = -1;
    }
  }
  return out;
}
