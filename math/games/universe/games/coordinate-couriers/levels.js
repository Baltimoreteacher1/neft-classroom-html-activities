// Coordinate Couriers — the city and its levels. No DOM.
//
// Meridia is a city laid out on the coordinate plane: every street runs along a
// grid line, the two avenues through the plaza ARE the axes, and their numbers
// are painted on the asphalt. One unit is UNIT pixels; the map runs from −N to
// N on both axes. Buildings fill the blocks between streets.
//
//   deliver  drive to the address (an intersection, or halfway along a block
//            for a decimal coordinate) and press Use
//   cable    (7-6) a cable car between two stations on the same street line;
//            set its cable to the distance between them, across the river
//            (5 + 3) or along one side (5 − 3)
//   mirror   (7-9) a mirror pad sends you to its reflection across an axis;
//            fenced districts are reachable only by reflection

export const UNIT = 110;
export const N = 6;
export const ROAD = 38;
const HALF = (UNIT - ROAD) / 2;
export const SIZE = (2 * N + 1) * UNIT;

/** Map coordinates to world pixels (y up in maths, down on screen). */
export const toPx = (p) => ({ X: (p.x + N + 0.5) * UNIT, Y: (N + 0.5 - p.y) * UNIT });
export const fromPx = (X, Y) => ({ x: X / UNIT - N - 0.5, y: N + 0.5 - Y / UNIT });

const P = (x, y) => ({ x, y });

export const LEVELS = [
  {
    id: "four-quadrants",
    lessons: ["7-5", "7-8"],
    start: P(0, 0),
    deliveries: [P(3, 2), P(-4, 1), P(-2, -3), P(5, -4), P(-1.5, 3), P(0, -5)],
    cars: [
      { from: P(-6, -1), to: P(6, -1), speed: 1.2 },
      { from: P(2, 6), to: P(2, -6), speed: 1 },
    ],
    water: [],
    cables: [],
    pads: [],
    fences: [],
  },
  {
    id: "cable-cars",
    lesson: "7-6",
    start: P(-5, 4),
    // The river runs along the x-axis; south of it, a canal runs down the y-axis.
    water: [
      { x0: -N - 0.5, x1: N + 0.5, y0: -0.34, y1: 0.34 },
      { x0: -0.34, x1: 0.34, y0: -N - 0.5, y1: -0.34 },
    ],
    cables: [
      { id: "c1", a: P(-3, 2), b: P(-3, -4) },
      { id: "c2", a: P(-2, -5), b: P(3, -5) },
      { id: "c3", a: P(4, -3), b: P(4, 2) },
    ],
    deliveries: [P(1, -5), P(5, 4)],
    cars: [{ from: P(-6, 3), to: P(6, 3), speed: 1 }],
    pads: [],
    fences: [],
  },
  {
    id: "mirror-district",
    lesson: "7-9",
    start: P(3, -1),
    water: [],
    cables: [],
    // Each fenced district holds one address and one pad; its way in is a reflection.
    fences: [P(-4, -3), P(2, 5), P(5, 2), P(-5, 2)],
    pads: [P(4, -3), P(-4, -3), P(2, -5), P(2, 5), P(-2, 5), P(5, -2), P(5, 2), P(-5, 2)],
    deliveries: [P(-4, -3), P(2, 5), P(-5, 2)],
    cars: [{ from: P(-6, -1), to: P(6, -1), speed: 1.1 }],
  },
];

/** True when map point p lies in water. */
export function wet(water, p) {
  return water.some((w) => p.x > w.x0 && p.x < w.x1 && p.y > w.y0 && p.y < w.y1);
}

/** The solids: buildings in every block, water bands, and the fences of walled districts. */
function solidsFor(L) {
  const out = [];
  for (let i = -N - 1; i <= N; i++)
    for (let j = -N - 1; j <= N; j++) {
      // Block whose lower-left street corner is (i, j): building inset from the streets.
      const c = toPx(P(i, j + 1));
      const park = (i * 7 + j * 13 + 40) % 9 === 0;
      if (park) continue;
      out.push({
        x: c.X + ROAD / 2,
        y: c.Y + ROAD / 2,
        w: UNIT - ROAD,
        h: UNIT - ROAD,
        kind: "building",
        hue: (i * 5 + j * 3 + 60) % 4,
      });
    }
  for (const w of L.water) {
    const a = toPx(P(w.x0, w.y1));
    const b = toPx(P(w.x1, w.y0));
    out.push({ x: a.X, y: a.Y, w: b.X - a.X, h: b.Y - a.Y, kind: "water" });
  }
  for (const f of L.fences) {
    const c = toPx(f);
    const r = UNIT / 2 - 6;
    const t = 8;
    out.push({ x: c.X - r, y: c.Y - r, w: 2 * r, h: t, kind: "fence" });
    out.push({ x: c.X - r, y: c.Y + r - t, w: 2 * r, h: t, kind: "fence" });
    out.push({ x: c.X - r, y: c.Y - r, w: t, h: 2 * r, kind: "fence" });
    out.push({ x: c.X + r - t, y: c.Y - r, w: t, h: 2 * r, kind: "fence" });
  }
  return out;
}

export function createWorld(index, seed) {
  const L = LEVELS[index];
  const s = toPx(L.start);
  return {
    rng: seed >>> 0 || 1,
    tick: 0,
    level: index,
    p: { x: s.X - 11, y: s.Y - 11, w: 22, h: 22, vx: 0, vy: 0, heading: 0, bump: 0 },
    solids: solidsFor(L),
    water: L.water.map((w) => ({ ...w })),
    deliveries: L.deliveries.map((d) => ({ ...d, done: 0 })),
    cables: L.cables.map((c) => ({ ...c, done: 0, tries: 0 })),
    pads: L.pads.map((p) => ({ ...p })),
    fences: L.fences.map((f) => ({ ...f })),
    cars: L.cars.map((c) => ({ ...c, t: 0, dir: 1 })),
    ride: null,
    warp: null,
    done: 0,
  };
}

export { HALF };
