// Expression Factory — the factory floor and its orders. No DOM.
//
// Each room is one production line: a conveyor with machine slots under it, a
// start lever, and a truck at the end. Crates come down the belt carrying a
// value of x; every machine they pass does one operation to that value; the
// truck takes a crate only if it carries what the order asks for at that x.
//
//   quiz      (6-5) Word Crates: words to symbols, substitute, evaluate
//   build     (6-5) build the order's expression from machines
//   identify  (6-5) a line is already built; pick the expression it makes
//   match     (6-5) the order is an expression; pick the line that makes it
//   twin      (6-6, 6-8) a reference line already runs above yours; build a
//             DIFFERENT line that matches it on every crate
//   streamline (6-14, 6-15) the old line has too many machines; rebuild it
//             with fewer slots so every crate still matches

import { makeBody } from "../../runtime/physics.js";
import { WORD_ROOMS } from "./quiz.js";

/** Word Crates belt: the stamping station, the queue behind it, and the truck. */
export const STATION_X = 480;
export const QUEUE_X = 370;
export const CRATE_GAP = 74;
export const TRUCK_X = 995;

/** Rooms where the student picks from cards instead of building the line. */
export const isPick = (r) => r.kind === "identify" || r.kind === "match" || r.kind === "quiz";

export const FLOOR = 520;
export const BELT_Y = 400;
export const REF_Y = 250;
const ROOM = 1100;
export const BELT_X0 = 170;
export const BELT_X1 = 930;

const M = (op, k) => (k === undefined ? { op } : { op, k });
// Every box takes one of these with a number or x: "+" with x is the "+x" machine.
const OPS = ["+", "-", "*"];

export const LEVELS = [
  {
    id: "word-crates",
    lesson: "6-5",
    rooms: WORD_ROOMS.map((items) => ({ kind: "quiz", items })),
  },
  {
    id: "assembly-line",
    lesson: "6-5",
    // Easy first: one box, then two. Build, read, and match lines in turn.
    rooms: [
      { kind: "build", target: [M("+", 4)], slots: 1, ops: OPS, xs: [1, 2, 3, 4], predict: 3 },
      { kind: "identify", target: [M("*", 3)], options: [[M("+", 3)], [M("*", 3)], [M("-", 3)]], slots: 1, ops: OPS, xs: [1, 2, 3, 4] },
      { kind: "build", target: [M("*", 2)], slots: 1, ops: OPS, xs: [1, 2, 3, 4], predict: 5 },
      { kind: "match", target: [M("-", 2)], options: [[M("+", 2)], [M("*", 2)], [M("-", 2)]], slots: 1, ops: OPS, xs: [3, 4, 5, 6] },
      { kind: "build", target: [M("*", 3), M("+", 2)], slots: 2, ops: OPS, xs: [1, 2, 3, 4], predict: 3 },
      { kind: "identify", target: [M("*", 2), M("+", 5)], options: [[M("*", 5), M("+", 2)], [M("*", 2), M("+", 5)], [M("*", 2), M("-", 5)]], slots: 2, ops: OPS, xs: [1, 2, 3, 4] },
      { kind: "build", target: [M("*", 2), M("-", 1)], slots: 2, ops: OPS, xs: [2, 3, 5, 6], predict: 5 },
      { kind: "match", target: [M("*", 4), M("-", 3)], options: [[M("*", 3), M("-", 4)], [M("*", 4), M("+", 3)], [M("*", 4), M("-", 3)]], slots: 2, ops: OPS, xs: [2, 3, 4, 5] },
    ],
  },
  {
    id: "twin-lines",
    lessons: ["6-6", "6-8"],
    lesson: "6-6",
    rooms: [
      {
        kind: "twin",
        target: [M("+", 3), M("*", 2)],
        slots: 2,
        ops: OPS,
        xs: [0, 1, 2, 3, 4],
      },
      {
        kind: "twin",
        target: [M("*", 4), M("+", 8)],
        slots: 2,
        ops: OPS,
        xs: [0, 1, 2, 3, 4],
      },
      {
        kind: "twin",
        target: [M("-", 1), M("*", 5)],
        slots: 2,
        ops: OPS,
        xs: [1, 2, 3, 4, 5],
      },
    ],
  },
  {
    id: "streamline",
    lessons: ["6-14", "6-15"],
    lesson: "6-14",
    rooms: [
      {
        kind: "streamline",
        target: [M("+x"), M("+", 2), M("+x"), M("+", 3)],
        slots: 2,
        ops: OPS,
        xs: [0, 1, 2, 3, 4],
      },
      {
        kind: "streamline",
        target: [M("*", 2), M("+", 6), M("+x")],
        slots: 2,
        ops: OPS,
        xs: [0, 1, 2, 3, 4],
      },
      {
        kind: "streamline",
        target: [M("+", 3), M("*", 4), M("-x")],
        slots: 2,
        ops: OPS,
        xs: [0, 1, 2, 3, 4],
      },
    ],
  },
];

/** Slot positions along a belt, evenly spaced. */
export function slotX(room, i, n) {
  const span = BELT_X1 - BELT_X0;
  return room.x0 + BELT_X0 + (span * (i + 1)) / (n + 1);
}

export function createWorld(index, seed) {
  const L = LEVELS[index];
  const solids = [{ x: 0, y: FLOOR, w: L.rooms.length * ROOM + 400, h: 200, kind: "floor" }];
  const rooms = L.rooms.map((r, i) => {
    const x0 = i * ROOM;
    const gate = solids.length;
    solids.push({ x: x0 + 1060, y: 120, w: 26, h: FLOOR - 120, kind: "gate", open: 0 });
    if (r.kind === "quiz")
      return {
        i,
        x0,
        kind: "quiz",
        items: r.items,
        // Where the student is: crate `at`, step `step`; misses on this crate; crates right first try.
        at: 0,
        step: 0,
        miss: 0,
        firstTry: 0,
        streak: 0,
        best: 0,
        // Each crate's place on the belt, eased toward its slot every tick.
        pos: r.items.map((_, k) => QUEUE_X - k * CRATE_GAP),
        target: [],
        line: [],
        xs: [],
        gate,
        run: null,
        done: 0,
        runs: 0,
      };
    return {
      i,
      x0,
      kind: r.kind,
      target: r.target.map((m) => ({ ...m })),
      // An identify room's line is already built; every other room starts empty.
      line: Array.from({ length: r.slots }, (_, k) => (r.kind === "identify" ? { ...r.target[k] } : null)),
      options: r.options?.map((o) => o.map((m) => ({ ...m }))),
      ops: r.ops.slice(),
      xs: r.xs.slice(),
      predict: r.predict ?? null,
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
    safe: { x: 70, y: FLOOR - 40 },
    rooms,
    solids,
    exit: { x: L.rooms.length * ROOM + 160, y: FLOOR - 140, w: 120, h: 140 },
    checkpoints: rooms.map((r) => ({ id: `cp${r.i}`, x: r.x0 + 40, y: FLOOR, hit: 0 })),
    done: 0,
  };
}
