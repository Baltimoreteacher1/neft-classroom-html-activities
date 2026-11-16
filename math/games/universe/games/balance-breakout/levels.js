// Balance Breakout — level data and world construction. No DOM.
//
// Each level is a row of vault rooms. A room holds one great balance whose two
// pans ARE the two sides of an equation, with a mystery crate (weight x) on
// one of them. The vault door at the end of the room is locked by the beam.
//
//   mode "keypad"   (8-1) make the beam level with blocks from the racks,
//                   then key in the value of x that makes the equation true
//   mode "isolate"  (8-2, 8-3) the door's reader only weighs a crate that
//                   stands ALONE on a level beam: transform the equation with
//                   the room's tools until x is by itself
//
// Tools (machines in the room, each with a console):
//   crane    the Twin Crane: removes a matching block from BOTH pans, or
//            adds a matching pair from the pair bin to both
//   changer  splits one block into two that add up to it (8 -> 5 + 3)
//   divider  splits both pans into k identical groups and keeps one
//   doubler  doubles both pans

import { makeBody } from "../../runtime/physics.js";

export const FLOOR = 520;
const ROOM = 980;
const floor = (x, w) => ({ x, y: FLOOR, w, h: 200, kind: "floor" });
const ledge = (x, y, w) => ({ x, y, w, h: 16, kind: "ledge", oneWay: 1 });
const X = () => ({ k: "x" });
const W = (v) => ({ k: "w", v });
const B = (v) => ({ k: "b", v });
const HALF = () => ({ k: "half" });

/** A room at index i of a level: geometry is relative to its left edge. */
function room(i, o) {
  const x0 = i * ROOM;
  return {
    x0,
    bx: x0 + 470,
    ...o,
    racks: (o.racks || []).map((r) => ({ ...r, x: x0 + r.x })),
    ledges: (o.ledges || []).map((l) => ({ ...l, x: x0 + l.x })),
  };
}

export const LEVELS = [
  {
    id: "counterweight",
    lesson: "8-1",
    rooms: [
      room(0, {
        mode: "keypad",
        x: 6,
        left: [X()],
        right: [],
        racks: [
          { x: 180, y: 435, items: [W(1), W(2)] },
          { x: 780, y: FLOOR, items: [W(3), W(5)] },
        ],
        ledges: [{ x: 110, y: 435, w: 160 }],
        tools: [],
      }),
      room(1, {
        mode: "keypad",
        x: 5,
        left: [X(), W(2)],
        right: [],
        racks: [
          { x: 160, y: 380, items: [W(3), W(4)] },
          { x: 800, y: FLOOR, items: [W(1), W(6)] },
        ],
        ledges: [
          { x: 60, y: 440, w: 120 },
          { x: 120, y: 380, w: 140 },
        ],
        tools: [],
      }),
    ],
  },
  {
    id: "twin-crane",
    lesson: "8-2",
    rooms: [
      room(0, {
        mode: "isolate",
        x: 5,
        left: [X(), W(3)],
        right: [W(8)],
        racks: [],
        tools: ["crane", "changer"],
      }),
      room(1, {
        mode: "isolate",
        x: 9,
        left: [X(), W(4)],
        right: [W(3), W(10)],
        racks: [],
        tools: ["crane", "changer"],
      }),
      room(2, {
        mode: "isolate",
        x: 8,
        left: [X(), B(2)],
        right: [W(6)],
        pairs: [2, 3],
        racks: [],
        tools: ["crane", "changer"],
      }),
    ],
  },
  {
    id: "splitter",
    lesson: "8-3",
    rooms: [
      room(0, {
        mode: "isolate",
        x: 4,
        left: [X(), X(), X()],
        right: [W(12)],
        racks: [],
        tools: ["divider", "changer"],
      }),
      room(1, {
        mode: "isolate",
        x: 10,
        left: [HALF()],
        right: [W(5)],
        racks: [],
        tools: ["doubler", "divider"],
      }),
      room(2, {
        mode: "isolate",
        x: 4,
        left: [X(), X(), W(1)],
        right: [W(9)],
        racks: [],
        tools: ["crane", "changer", "divider"],
      }),
    ],
  },
];

/** Machine positions inside a room, relative to its balance. */
export const TOOL_DX = { crane: 0, changer: -300, divider: 300, doubler: 300 };
export const PAN_DX = 150;
export const DOOR_DX = 470;

export function createWorld(index, seed) {
  const L = LEVELS[index];
  const solids = [];
  const n = L.rooms.length;
  solids.push(floor(0, n * ROOM + 300));
  const rooms = L.rooms.map((r, i) => {
    for (const l of r.ledges) solids.push(ledge(l.x, l.y, l.w));
    const gate = solids.length;
    solids.push({ x: r.bx + DOOR_DX, y: 120, w: 26, h: FLOOR - 120, kind: "gate", open: 0 });
    return {
      i,
      x0: r.x0,
      bx: r.bx,
      mode: r.mode,
      x: r.x,
      left: r.left.map((it) => ({ ...it })),
      right: r.right.map((it) => ({ ...it })),
      pairs: (r.pairs || []).slice(),
      racks: r.racks.map((k) => ({ x: k.x, y: k.y, items: k.items.map((it) => ({ ...it })) })),
      tools: r.tools.slice(),
      gate,
      solved: 0,
      angle: 0,
      av: 0,
    };
  });
  return {
    rng: seed >>> 0 || 1,
    tick: 0,
    level: index,
    w: n * ROOM + 300,
    h: 620,
    p: makeBody(60, FLOOR - 40),
    safe: { x: 60, y: FLOOR - 40 },
    carry: null,
    rooms,
    solids,
    exit: { x: n * ROOM + 120, y: FLOOR - 140, w: 120, h: 140 },
    checkpoints: rooms.map((r) => ({ id: `cp${r.i}`, x: r.x0 + 40, y: FLOOR, hit: 0 })),
    done: 0,
  };
}
