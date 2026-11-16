// NetFold Engineer — the workshop benches. No DOM.
//
// Each room is a workbench under a 3D display. A choice made at the bench is
// carried out in 3D by the simulation, tick by tick (so the Time Machine can
// rewind a fold halfway):
//
//   net     (5-6) pick the net that folds into the crate; it folds on its own
//           hinges and closes, or collides, or leaves a gap
//   wrap    (5-7, 5-8) cut wrapping paper of a given area; the box is wrapped:
//           too little leaves a face bare, too much leaves a flap
//   fill    (5-5, 5-10) say the volume; that many unit (or half-unit) cubes
//           are packed: too few leave holes, too many pile over the top
//   design  (5-5, 5-7) choose box dimensions that hold the cubes with the
//           least cardboard

import { makeBody } from "../../runtime/physics.js";

export const FLOOR = 520;
const ROOM = 1000;

const C = (...cells) => cells;

export const LEVELS = [
  {
    id: "net-lab",
    lesson: "5-6",
    // The closing net sits in a different position on each bench (2, 1, 3).
    rooms: [
      {
        kind: "net",
        choices: [
          C([0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]),
          C([1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]),
          C([0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]),
        ],
      },
      {
        kind: "net",
        choices: [
          C([0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]),
          C([0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [0, 2]),
          C([0, 0], [1, 0], [2, 0], [3, 0], [1, 1], [2, 1]),
        ],
      },
      {
        kind: "net",
        choices: [
          C([1, 0], [1, 1], [0, 1], [2, 1], [1, 2], [2, 2]),
          C([0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 1]),
          C([0, 0], [1, 0], [2, 0], [1, 1], [1, 2], [1, 3]),
        ],
      },
    ],
  },
  {
    id: "wrap-lab",
    lessons: ["5-7", "5-8"],
    lesson: "5-7",
    rooms: [
      { kind: "wrap", solid: "prism", l: 4, w: 3, h: 2 },
      { kind: "wrap", solid: "prism", l: 5, w: 5, h: 2 },
      { kind: "wrap", solid: "pyramid", b: 6, s: 5, h: 4 },
    ],
  },
  {
    id: "packing",
    lessons: ["5-5", "5-10"],
    lesson: "5-5",
    rooms: [
      { kind: "fill", l: 4, w: 3, h: 2, cube: 1 },
      { kind: "fill", l: 1.5, w: 2, h: 3, cube: 0.5 },
      {
        kind: "design",
        cubes: 24,
        options: [
          [1, 4, 6],
          [2, 2, 6],
          [2, 3, 4],
          [1, 2, 12],
        ],
      },
    ],
  },
];

export function createWorld(index, seed) {
  const L = LEVELS[index];
  const solids = [{ x: 0, y: FLOOR, w: L.rooms.length * ROOM + 400, h: 200, kind: "floor" }];
  const rooms = L.rooms.map((r, i) => {
    const x0 = i * ROOM;
    const gate = solids.length;
    solids.push({ x: x0 + 960, y: 120, w: 26, h: FLOOR - 120, kind: "gate", open: 0 });
    return {
      ...JSON.parse(JSON.stringify(r)),
      i,
      x0,
      bench: x0 + 300,
      gate,
      job: null,
      done: 0,
      tries: 0,
    };
  });
  return {
    rng: seed >>> 0 || 1,
    tick: 0,
    level: index,
    w: L.rooms.length * ROOM + 400,
    h: 620,
    p: makeBody(70, FLOOR - 40),
    rooms,
    solids,
    exit: { x: L.rooms.length * ROOM + 160, y: FLOOR - 140, w: 120, h: 140 },
    checkpoints: rooms.map((r) => ({ id: `cp${r.i}`, x: r.x0 + 40, y: FLOOR, hit: 0 })),
    done: 0,
  };
}
