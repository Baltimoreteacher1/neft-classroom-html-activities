// Moving a point on the coordinate plane and reading its ordered pair after every leg.
// Config: { start: {x, y}, moves: [{dx, dy}, ...up to 4], lang }. Grid -6..6; a move that would leave it is dropped.
import { cap, circle, intIn, label, line, signed } from "./anim-kit.js";
import { createPlayer } from "./player.js";

const C = {
  title: "Moving a point on the coordinate plane and reading its ordered pair",
  start:
    "The point starts at ({x}, {y}). The first number tells how far to go right or left from the origin. The second tells how far to go up or down.",
  right:
    "Move right {n}. The x-coordinate changes from {a} to {b}. The y-coordinate stays {y}. The point is now at ({b}, {y}).",
  left: "Move left {n}. The x-coordinate changes from {a} to {b}. The y-coordinate stays {y}. The point is now at ({b}, {y}).",
  up: "Move up {n}. The y-coordinate changes from {a} to {b}. The x-coordinate stays {x}. The point is now at ({x}, {b}).",
  down: "Move down {n}. The y-coordinate changes from {a} to {b}. The x-coordinate stays {x}. The point is now at ({x}, {b}).",
  done: "The point went from ({x0}, {y0}) to ({x1}, {y1}). In all, x changed by {dx} and y changed by {dy}.",
  pair: "Ordered pair",
  startTag: "Start",
  moveRight: "Right {n}",
  moveLeft: "Left {n}",
  moveUp: "Up {n}",
  moveDown: "Down {n}",
};
export const KEYS = Object.values(C);

export const GRID = { range: 6, cell: 24, ox: 160, oy: 168 };
const toX = (x) => GRID.ox + x * GRID.cell;
const toY = (y) => GRID.oy - y * GRID.cell;
const within = (v) => Math.abs(v) <= GRID.range;

export function normalizeConfig(config = {}) {
  const sx = intIn(config.start?.x, -GRID.range, GRID.range, null);
  const sy = intIn(config.start?.y, -GRID.range, GRID.range, null);
  const start = sx === null || sy === null ? { x: -3, y: -2 } : { x: sx, y: sy };
  const asked = Array.isArray(config.moves) && config.moves.length ? config.moves : null;
  const moves = [];
  let { x, y } = start;
  for (const m of (asked || [{ dx: 5, dy: 0 }, { dx: 0, dy: 4 }, { dx: -3, dy: 2 }]).slice(0, 4)) {
    const dx = intIn(m?.dx, -12, 12, null);
    const dy = intIn(m?.dy, -12, 12, null);
    if (dx === null || dy === null || (dx === 0 && dy === 0)) break;
    if (!within(x + dx) || !within(y + dy)) break;
    moves.push({ dx, dy });
    x += dx;
    y += dy;
  }
  if (!moves.length) moves.push({ dx: start.x > 0 ? -2 : 2, dy: start.y > 0 ? -2 : 2 });
  return { start, moves };
}

function gridItems() {
  const items = [];
  for (let k = -GRID.range; k <= GRID.range; k += 1) {
    const cls = k === 0 ? "an-axis" : "an-grid";
    items.push(line(`gx${k}`, toX(k), toY(GRID.range), toX(k), toY(-GRID.range), cls));
    items.push(line(`gy${k}`, toX(-GRID.range), toY(k), toX(GRID.range), toY(k), cls));
    if (k !== 0 && k % 2 === 0) {
      items.push(label(`tx${k}`, toX(k), GRID.oy + 20, signed(k), "an-tick", { a: { "text-anchor": "middle" } }));
      items.push(label(`ty${k}`, GRID.ox - 8, toY(k) + 6, signed(k), "an-tick", { a: { "text-anchor": "end" } }));
    }
  }
  items.push(
    label("t0", GRID.ox - 8, GRID.oy + 20, "0", "an-tick", { a: { "text-anchor": "end" } }),
    label("axis-x", toX(GRID.range) + 8, GRID.oy + 6, "x", "an-head", { a: { "text-anchor": "start" } }),
    label("axis-y", GRID.ox + 8, toY(GRID.range) - 6, "y", "an-head", { a: { "text-anchor": "start" } }),
  );
  return items;
}

export function buildModel(config = {}) {
  const { start, moves } = normalizeConfig(config);
  // One leg per non-zero component, horizontal first.
  const legs = [];
  let at = { ...start };
  for (const m of moves) {
    if (m.dx) {
      legs.push({ axis: "x", from: { ...at }, to: { x: at.x + m.dx, y: at.y }, d: m.dx });
      at = { x: at.x + m.dx, y: at.y };
    }
    if (m.dy) {
      legs.push({ axis: "y", from: { ...at }, to: { x: at.x, y: at.y + m.dy }, d: m.dy });
      at = { x: at.x, y: at.y + m.dy };
    }
  }
  const finish = at;
  const panel = (p, legText) => [
    label("pair-h", 336, 52, cap(C.pair), "an-note", { a: { "text-anchor": "start" } }),
    label("pair", 336, 96, `(${signed(p.x)}, ${signed(p.y)})`, "an-big", { a: { "text-anchor": "start" } }),
    label("px", 336, 140, `x = ${signed(p.x)}`, "an-num", { a: { "text-anchor": "start" } }),
    label("py", 336, 176, `y = ${signed(p.y)}`, "an-num", { a: { "text-anchor": "start" } }),
    ...(legText ? [label("leg", 336, 226, legText, "an-chip", { a: { "text-anchor": "start" } })] : []),
  ];
  const scene = (upTo, legText) => {
    const items = gridItems();
    const p = upTo < 0 ? start : legs[upTo].to;
    for (let k = 0; k <= upTo; k += 1) {
      const l = legs[k];
      items.push(
        line(`seg${k}`, toX(l.from.x), toY(l.from.y), toX(l.to.x), toY(l.to.y), "an-path", {
          from: { a: { x2: toX(l.from.x), y2: toY(l.from.y) }, o: 1 },
        }),
      );
    }
    items.push(
      line("gdx", toX(p.x), toY(p.y), toX(p.x), GRID.oy, "an-dash", { from: { o: 0 } }),
      line("gdy", toX(p.x), toY(p.y), GRID.ox, toY(p.y), "an-dash", { from: { o: 0 } }),
      circle("startdot", toX(start.x), toY(start.y), 6, "an-start", {}),
      label("starttag", toX(start.x), toY(start.y) + (start.y > -4 ? 26 : -16), cap(C.startTag), "an-note", { a: { "text-anchor": "middle" } }),
      circle("mark", toX(p.x), toY(p.y), 9, "an-mark", { role: "marker" }),
      ...panel(p, legText),
    );
    return items;
  };
  const text = (l) => {
    const n = Math.abs(l.d);
    const key = l.axis === "x" ? (l.d > 0 ? "right" : "left") : l.d > 0 ? "up" : "down";
    const a = l.axis === "x" ? l.from.x : l.from.y;
    const b = l.axis === "x" ? l.to.x : l.to.y;
    return { key, n, a: signed(a), b: signed(b), x: signed(l.from.x), y: signed(l.from.y) };
  };
  const legWord = { right: C.moveRight, left: C.moveLeft, up: C.moveUp, down: C.moveDown };
  const steps = [
    { caption: cap(C.start, { x: signed(start.x), y: signed(start.y) }), scene: scene(-1), state: { x: start.x, y: start.y } },
    ...legs.map((l, k) => {
      const v = text(l);
      return {
        caption: cap(C[v.key], { n: v.n, a: v.a, b: v.b, x: v.x, y: v.y }),
        scene: scene(k, cap(legWord[v.key], { n: v.n })),
        state: { x: l.to.x, y: l.to.y, axis: l.axis, d: l.d },
      };
    }),
  ];
  steps.push({
    caption: cap(C.done, {
      x0: signed(start.x), y0: signed(start.y), x1: signed(finish.x), y1: signed(finish.y),
      dx: signed(finish.x - start.x), dy: signed(finish.y - start.y),
    }),
    scene: scene(legs.length - 1),
    state: { x: finish.x, y: finish.y, final: true },
  });
  return { kind: "coordinate-movement", title: cap(C.title), view: [480, 344], steps, result: { start, finish, moves, legs: legs.length }, grid: GRID };
}

export const play = (container, config = {}) => createPlayer(container, buildModel(config), config);
