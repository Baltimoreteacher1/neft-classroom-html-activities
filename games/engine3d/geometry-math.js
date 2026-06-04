/**
 * Exact area/volume helpers — pure functions, no Three.js, unit-testable.
 *
 * Spatial games MUST use these for any reported/checked measurement rather than
 * approximating area by counting grid cells. Values are mathematically exact
 * (floating-point arithmetic only; no sampling or rounding).
 */

/** Area of a rectangle. */
export function rectArea(w, h) {
  return w * h;
}

/** Area of a triangle from base and height. */
export function triangleArea(base, height) {
  return (base * height) / 2;
}

/**
 * Area of a simple polygon via the shoelace formula.
 * points: array of { x, y } (or { x, z }); winding-independent (returns |area|).
 */
export function polygonArea(points) {
  if (!Array.isArray(points) || points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const ay = a.y !== undefined ? a.y : a.z;
    const by = b.y !== undefined ? b.y : b.z;
    sum += a.x * by - b.x * ay;
  }
  return Math.abs(sum) / 2;
}

/**
 * Total area of a composite figure built from labeled parts. Each part is one
 * of:
 *   { type: "rect", w, h }
 *   { type: "triangle", base, height }
 *   { type: "polygon", points: [...] }
 * Parts may carry { sign: -1 } to subtract (e.g. a cut-out hole). Default +1.
 */
export function compositeArea(parts) {
  if (!Array.isArray(parts)) return 0;
  let total = 0;
  for (const part of parts) {
    const sign = part.sign === -1 ? -1 : 1;
    total += sign * partArea(part);
  }
  return total;
}

function partArea(part) {
  switch (part.type) {
    case "rect":
      return rectArea(part.w, part.h);
    case "triangle":
      return triangleArea(part.base, part.height);
    case "polygon":
      return polygonArea(part.points);
    default:
      return 0;
  }
}

/** Volume of a rectangular prism. */
export function prismVolume(l, w, h) {
  return l * w * h;
}

/**
 * Decompose a composite figure into its constituent parts with each part's
 * exact area, and the signed total. Useful for showing "4×3 + 2×2 = 16" style
 * breakdowns. Returns:
 *   { parts: [{ ...part, area, signedArea }], total }
 */
export function decompose(parts) {
  const out = (Array.isArray(parts) ? parts : []).map((part) => {
    const area = partArea(part);
    const sign = part.sign === -1 ? -1 : 1;
    return { ...part, area, signedArea: sign * area };
  });
  const total = out.reduce((acc, p) => acc + p.signedArea, 0);
  return { parts: out, total };
}
