// Language Arcade maze geometry. A maze is authored as rows of characters:
//   #  wall      .  floor      S  start      X  exit      *  bonus item      A-J  a gate (its challenge is gates[letter])
// Layouts are deterministic content, so the validator can prove every gate lies on the only way to the exit.
export const DIRS = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] };
export const DIR_KEYS = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};
export const DIR_NAMES = {
  up: ["up", "arriba"],
  down: ["down", "abajo"],
  left: ["left", "a la izquierda"],
  right: ["right", "a la derecha"],
};
export const isGate = (c) => /^[A-J]$/.test(c);

export const cellAt = (map, y, x) =>
  y < 0 || x < 0 || y >= map.length || x >= map[0].length ? "#" : map[y][x];
export function find(map, ch) {
  for (let y = 0; y < map.length; y += 1) {
    const x = map[y].indexOf(ch);
    if (x >= 0) return [y, x];
  }
  return null;
}
export const gatesOf = (map) => map.join("").split("").filter(isGate);
export const step = ([y, x], dir) => [y + DIRS[dir][0], x + DIRS[dir][1]];

/** Shortest path of directions from `from` to the cell holding `to`; `blocked(c)` says which cells stop movement. */
export function route(map, from, to, blocked = (c) => c === "#") {
  const goal = find(map, to);
  if (!from || !goal) return null;
  const key = (p) => p.join(",");
  const prev = new Map([[key(from), null]]);
  const queue = [from];
  while (queue.length) {
    const p = queue.shift();
    if (p[0] === goal[0] && p[1] === goal[1]) {
      const out = [];
      let k = key(p);
      while (prev.get(k)) {
        const [dir, back] = prev.get(k);
        out.unshift(dir);
        k = back;
      }
      return out;
    }
    for (const dir of Object.keys(DIRS)) {
      const n = step(p, dir);
      if (prev.has(key(n)) || blocked(cellAt(map, n[0], n[1]))) continue;
      prev.set(key(n), [dir, key(p)]);
      queue.push(n);
    }
  }
  return null;
}

/** Geometry problems for one authored maze (empty when sound). */
export function mazeProblems(map, at) {
  const errors = [];
  if (!Array.isArray(map) || map.length < 5) return [`${at}: map needs at least 5 rows`];
  if (map.some((r) => typeof r !== "string" || r.length !== map[0].length))
    errors.push(`${at}: map rows must be equal length`);
  if (map[0].length > 9) errors.push(`${at}: keep mazes 9 columns or fewer so they fit a phone`);
  if (/[^#.SX*A-J]/.test(map.join(""))) errors.push(`${at}: unknown map character`);
  const count = (ch) => map.join("").split(ch).length - 1;
  if (count("S") !== 1 || count("X") !== 1) errors.push(`${at}: needs exactly one S and one X`);
  const gates = gatesOf(map);
  if (new Set(gates).size !== gates.length) errors.push(`${at}: each gate letter is used once`);
  const start = find(map, "S");
  if (!route(map, start, "X")) errors.push(`${at}: the exit cannot be reached`);
  gates.forEach((g) => {
    if (route(map, start, "X", (c) => c === "#" || c === g))
      errors.push(`${at}: gate ${g} can be walked around`);
  });
  map.forEach((r, y) =>
    [...r].forEach((c, x) => {
      if (c !== "*") return;
      const reach = route(
        map.map((row, yy) => (yy === y ? `${row.slice(0, x)}@${row.slice(x + 1)}` : row)),
        start,
        "@",
      );
      if (!reach) errors.push(`${at}: bonus item at ${y},${x} cannot be reached`);
    }),
  );
  return errors;
}
