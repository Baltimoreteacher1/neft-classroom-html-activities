// Browser driver for Coordinate Couriers: level 1 "Four Quadrants". The bot
// steers the scooter through the streets with real input ticks, corner by
// corner (x first, then y), and delivers with the real Use action. It swaps
// the coordinates on the first parcel, then delivers all six.

const DRIVE = `(path) => {
  const g = window.__universe;
  const U = 110, N = 6;
  const here = () => ({ x: (g.world.p.x + 11) / U - N - 0.5, y: N + 0.5 - (g.world.p.y + 11) / U });
  for (const t of path) {
    for (let i = 0; i < 900 && g.mode === "play"; i++) {
      const h = here();
      const dx = t.x - h.x, dy = t.y - h.y;
      if (Math.abs(dx) < 0.08 && Math.abs(dy) < 0.08) break;
      let m = 0;
      if (dx > 0.06) m |= 2; if (dx < -0.06) m |= 1;
      if (dy > 0.06) m |= 4; if (dy < -0.06) m |= 8;
      g.stepFrames(1, m);
    }
  }
  g.stepFrames(30, 0);
  return here();
}`;

/** A street route from a to b: along a's row to b's column, then along the column. */
function route(a, b) {
  const pts = [];
  const step = (from, to) => (from < to ? 1 : -1);
  let x = Math.round(a.x);
  let y = Math.round(a.y);
  // Leave a half-block address along its street first.
  pts.push({ x, y });
  while (x !== Math.round(b.x)) {
    x += step(x, Math.round(b.x));
    pts.push({ x, y });
  }
  while (y !== Math.round(b.y)) {
    y += step(y, Math.round(b.y));
    pts.push({ x, y });
  }
  if (b.x !== x || b.y !== y) pts.push(b);
  return pts;
}

export async function drive({ host, u, fail, axe }) {
  await u(`window.driveRoute = ${DRIVE}`);
  let at = { x: 0, y: 0 };
  const go = async (p) => {
    // A row avoids the cars' avenue (y = −1) where possible: go via y first when starting on it.
    const path = route(at, p);
    await u(`window.driveRoute(${JSON.stringify(path)})`);
    at = p;
  };
  const deliver = async () => {
    const t = await u(() => window.__universe.interactable(window.__universe.world));
    if (t?.type !== "deliver") return fail(`no "Deliver here" at the corner (got ${t?.type})`);
    await u(() => window.__universe.tryInteract());
  };
  await go({ x: 2, y: 3 });
  await deliver();
  const tag = await u(
    () => window.__universe.evidence.events.filter((e) => e.misconception).at(-1)?.misconception,
  );
  if (tag !== "coord-xy-swapped") fail(`delivering at (2, 3) for (3, 2) was tagged "${tag}"`);
  const parcels = [
    { x: 3, y: 2 },
    { x: -4, y: 1 },
    { x: -2, y: -3 },
    { x: 5, y: -4 },
    { x: -1.5, y: 3 },
    { x: 0, y: -5 },
  ];
  for (const p of parcels) {
    await go(p);
    const s = await u(() => {
      const g = window.__universe;
      return g.interactable(g.world)?.at;
    });
    if (!s || s.x !== p.x || s.y !== p.y)
      return fail(`the scooter did not reach (${p.x}, ${p.y}): at ${JSON.stringify(s)}`);
    await deliver();
    if (p.x === 3) await axe("city");
  }
}
