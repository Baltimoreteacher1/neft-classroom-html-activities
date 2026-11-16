// Inequality Invasion — the valley and its missions. No DOM.
//
// Glimmers (gentle light creatures, each carrying a number) drift along a path
// toward a lantern garden. Each room's gate (or gates) holds a rule the student
// sets; a glimmer the rule accepts flows into the garden, any other is
// guided down the side stream. A mission is won when EVERY glimmer goes the
// right way: the boundary values (k itself, k ± 1) are always in the wave.
//
//   words   (8-4) the mission is said in words ("at most 8"): write the rule
//   solve   (8-6) the mission is a two-step inequality (3x + 2 ≤ 20): the gate
//           dial only takes x ? k, so solve it first
//   between (8-5, 8-7) two gates in a row: only glimmers that satisfy BOTH

import { makeBody } from "../../runtime/physics.js";

export const FLOOR = 520;
export const PATH_Y = 430;
const ROOM = 1100;

export const LEVELS = [
  {
    id: "first-light",
    lesson: "8-4",
    rooms: [
      { kind: "words", say: "atMost", k: 8, want: [{ sym: "≤", k: 8 }], wave: [3, 7, 8, 9, 12, 5] },
      {
        kind: "words",
        say: "moreThan",
        k: 4,
        want: [{ sym: ">", k: 4 }],
        wave: [2, 4, 5, 9, 4, 6],
      },
      {
        kind: "words",
        say: "atLeast",
        k: 10,
        want: [{ sym: "≥", k: 10 }],
        wave: [10, 9, 11, 14, 6, 10],
      },
    ],
  },
  {
    id: "deep-valley",
    lesson: "8-6",
    rooms: [
      {
        kind: "solve",
        p: { a: 3, b: 2, sym: "≤", c: 20 },
        want: [{ sym: "≤", k: 6 }],
        wave: [5, 6, 7, 2, 9, 6],
      },
      {
        kind: "solve",
        p: { a: 1, b: -4, sym: ">", c: 3 },
        want: [{ sym: ">", k: 7 }],
        wave: [6, 7, 8, 12, 3, 7],
      },
      {
        kind: "solve",
        p: { a: 4, b: 0, sym: "<", c: 28 },
        want: [{ sym: "<", k: 7 }],
        wave: [6, 7, 8, 1, 7, 10],
      },
    ],
  },
  {
    id: "twin-gates",
    lessons: ["8-5", "8-7"],
    lesson: "8-7",
    rooms: [
      {
        kind: "between",
        say: "between",
        lo: 5,
        hi: 9,
        want: [
          { sym: "≥", k: 5 },
          { sym: "≤", k: 9 },
        ],
        wave: [4, 5, 7, 9, 10, 12, 5],
      },
      {
        kind: "between",
        say: "lanterns",
        lo: 3,
        hi: 7,
        want: [
          { sym: ">", k: 2 },
          { sym: "<", k: 8 },
        ],
        wave: [2, 3, 6, 7, 8, 11, 3],
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
    solids.push({ x: x0 + 1060, y: 120, w: 26, h: FLOOR - 120, kind: "gate", open: 0 });
    return {
      ...JSON.parse(JSON.stringify(r)),
      i,
      x0,
      // the student's rules, one per gate; start at an obviously unset dial
      rules: r.want.map(() => ({ sym: "<", k: 0 })),
      gatesX: r.want.map((_, g) => x0 + 520 + g * 170),
      gate,
      run: null,
      done: 0,
      runs: 0,
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
