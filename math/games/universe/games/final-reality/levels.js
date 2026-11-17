// The Final Reality — the arena and the machine's stages. No DOM.
//
// The Unraveling Engine is a boss made of mathematics: five shield rings, each
// a working system from the year. A console on its own platform controls each
// ring, and only a mathematically right setting collapses it:
//
//   structure  set the housing's height so the box holds its volume       (5-5)
//   power      set a conduit a·x + b that matches k(x + c) for every x    (6-14)
//   transport  set the shuttle's unit rate from distance and time          (3-8)
//   barrier    set two dials so exactly the right codes pass               (8-6, 8-7)
//   shutdown   solve a·x + b = c one move at a time, the same to both sides (8-3)
//
// Between stages the Engine sends telegraphed floor pulses; they knock you
// back gently and cost nothing.

import { makeBody } from "../../runtime/physics.js";

export const FLOOR = 520;
const ledge = (x, y, w) => ({ x, y, w, h: 16, kind: "ledge", oneWay: 1 });

export const LEVELS = [
  {
    id: "the-unraveling",
    stages: [
      { kind: "structure", l: 3, w: 4, volume: 36, at: [180, FLOOR] },
      { kind: "power", k: 3, c: 4, at: [330, 400] },
      { kind: "transport", d: 18, t: 6, at: [1250, FLOOR] },
      {
        kind: "barrier",
        want: [
          { sym: "≥", k: 7 },
          { sym: "<", k: 12 },
        ],
        codes: [5, 6, 7, 8, 11, 12, 15],
        at: [1120, 400],
      },
      { kind: "shutdown", a: 4, b: 6, c: 30, at: [720, 290] },
    ],
  },
  {
    id: "encore",
    stages: [
      { kind: "structure", l: 2, w: 5, volume: 40, at: [180, FLOOR] },
      { kind: "power", k: 2, c: 7, at: [330, 400] },
      { kind: "transport", d: 20, t: 4, at: [1250, FLOOR] },
      {
        kind: "barrier",
        want: [
          { sym: ">", k: 3 },
          { sym: "≤", k: 9 },
        ],
        codes: [2, 3, 4, 9, 10, 6, 12],
        at: [1120, 400],
      },
      { kind: "shutdown", a: 5, b: -3, c: 22, at: [720, 290] },
    ],
  },
];

export const ARENA = 1440;

export function createWorld(index, seed) {
  const L = LEVELS[index];
  return {
    rng: seed >>> 0 || 1,
    tick: 0,
    level: index,
    w: ARENA,
    h: 620,
    p: makeBody(80, FLOOR - 40),
    solids: [
      { x: 0, y: FLOOR, w: ARENA, h: 200, kind: "floor" },
      { x: 0, y: 0, w: 20, h: FLOOR, kind: "wall" },
      { x: ARENA - 20, y: 0, w: 20, h: FLOOR, kind: "wall" },
      ledge(250, 400, 170),
      ledge(1040, 400, 170),
      ledge(470, 470, 110),
      ledge(860, 470, 110),
      ledge(640, 290, 160),
      ledge(560, 380, 90),
      ledge(790, 380, 90),
    ],
    stages: L.stages.map((s, i) => ({
      ...JSON.parse(JSON.stringify(s)),
      i,
      done: 0,
      tries: 0,
      eq: s.kind === "shutdown" ? { a: s.a, b: s.b, c: s.c } : null,
    })),
    stage: 0,
    pulse: { t: 0, x: -1, period: 360 },
    stun: 0,
    done: 0,
  };
}
