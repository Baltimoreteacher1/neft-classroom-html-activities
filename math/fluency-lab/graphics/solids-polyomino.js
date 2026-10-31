// Does a set of grid squares fold into a cube? A cube is rolled across the squares: moving to a neighbouring square
// rolls it over the shared edge, and whichever face lands on the floor is that square's face. The net is valid when
// 6 squares are connected, every neighbouring pair agrees on the cube's full orientation (this is what rules out a
// 2 x 2 block), and the 6 floor faces are all different.
const MOVES = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };

// orientation = { top, bottom, north, south, east, west } with face ids 0..5
const START = { top: 0, bottom: 1, north: 2, south: 3, east: 4, west: 5 };
export function roll(o, dir) {
  switch (dir) {
    case "E":
      return { ...o, bottom: o.east, east: o.top, top: o.west, west: o.bottom };
    case "W":
      return { ...o, bottom: o.west, west: o.top, top: o.east, east: o.bottom };
    case "N":
      return { ...o, bottom: o.north, north: o.top, top: o.south, south: o.bottom };
    default:
      return { ...o, bottom: o.south, south: o.top, top: o.north, north: o.bottom };
  }
}
const same = (a, b) => Object.keys(a).every((k) => a[k] === b[k]);

export function isCubeNet(cells) {
  if (cells.length !== 6) return { valid: false, reason: "count" };
  const key = ([r, c]) => `${r},${c}`;
  const set = new Set(cells.map(key));
  const orient = new Map([[key(cells[0]), START]]);
  const queue = [cells[0]];
  while (queue.length) {
    const cell = queue.shift();
    for (const [dir, [dr, dc]] of Object.entries(MOVES)) {
      const next = [cell[0] + dr, cell[1] + dc];
      const id = key(next);
      if (!set.has(id)) continue;
      const rolled = roll(orient.get(key(cell)), dir);
      if (!orient.has(id)) {
        orient.set(id, rolled);
        queue.push(next);
      } else if (!same(orient.get(id), rolled)) return { valid: false, reason: "overlap" };
    }
  }
  if (orient.size !== 6) return { valid: false, reason: "connected" };
  const floors = new Set([...orient.values()].map((o) => o.bottom));
  return floors.size === 6 ? { valid: true, reason: null } : { valid: false, reason: "overlap" };
}
