// Coordinate Couriers — the mathematics. Pure functions, no DOM.
// Lessons 7-5 (rational numbers on the coordinate plane), 7-6 (distance on the
// coordinate plane), 7-8 (ordered pairs in all four quadrants), 7-9 (reflect
// points across the axes).

/** Quadrant of a point: 1-4, or 0 on an axis. */
export function quadrant(p) {
  if (p.x === 0 || p.y === 0) return 0;
  if (p.x > 0) return p.y > 0 ? 1 : 4;
  return p.y > 0 ? 2 : 3;
}

export const same = (a, b) => a.x === b.x && a.y === b.y;

/**
 * Distance between two points that share an x or a y (the only kind lesson
 * 7-6 measures). Returns null for points on no common line.
 */
export function gridDistance(a, b) {
  if (a.x === b.x) return Math.abs(a.y - b.y);
  if (a.y === b.y) return Math.abs(a.x - b.x);
  return null;
}

/** The slip "subtract the absolute values" across an axis: |5| − |3| instead of 5 + 3. */
export function absDifference(a, b) {
  if (a.x === b.x) return Math.abs(Math.abs(a.y) - Math.abs(b.y));
  if (a.y === b.y) return Math.abs(Math.abs(a.x) - Math.abs(b.x));
  return null;
}

/** Reflection across an axis: "x" flips y, "y" flips x. */
export function reflect(p, axis) {
  return axis === "x" ? { x: p.x, y: -p.y } : { x: -p.x, y: p.y };
}

/** Text for a point, with true minus signs: "(−3, 4)", "(2.5, −1)". */
export function pointText(p) {
  const n = (v) => (v < 0 ? `−${Math.abs(v)}` : String(v));
  return `(${n(p.x)}, ${n(p.y)})`;
}

/**
 * What kind of slip a wrong delivery point is, compared with the address.
 * Uses the site's misconception tags.
 */
export function slipOf(address, at) {
  if (same(address, at)) return null;
  if (at.x === address.y && at.y === address.x) return "coord-xy-swapped";
  if (Math.abs(at.x) === Math.abs(address.x) && Math.abs(at.y) === Math.abs(address.y))
    return "sign-dropped";
  return null;
}
