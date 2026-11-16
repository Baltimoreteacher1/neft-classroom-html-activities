// Fraction Food Truck — the kitchens and their orders. No DOM.
//
// One kitchen per level, a ticket rail of orders. Each order is portioned at
// the serving station and the result is physical: bowls fill one portion at a
// time from the batch, so a wrong count leaves bowls short or soup in the pot.
//
//   count  how many servings of size p does a batch t make?   (t ÷ p)
//   share  t shared equally on n plates: how much on each?    (t ÷ n)
//   full   how many FULL servings, and what is left over?     (6-11)

import { makeBody } from "../../runtime/physics.js";
import { F } from "./math.js";

export const FLOOR = 520;

export const LEVELS = [
  {
    id: "soup-station",
    lessons: ["6-1", "6-9"],
    lesson: "6-1",
    food: "soup",
    orders: [
      { kind: "count", total: F(3), portion: F(3, 4) },
      { kind: "count", total: F(2), portion: F(1, 3) },
      { kind: "share", total: F(3, 4), plates: 3 },
      { kind: "count", total: F(4), portion: F(2, 3) },
    ],
  },
  {
    id: "pizza-line",
    lessons: ["6-2", "6-10"],
    lesson: "6-2",
    food: "pizza",
    orders: [
      { kind: "count", total: F(9, 4), portion: F(3, 4) },
      { kind: "count", total: F(7, 2), portion: F(1, 2) },
      { kind: "share", total: F(3, 2), plates: 3 },
      { kind: "count", total: F(10, 3), portion: F(5, 6) },
    ],
  },
  {
    id: "catering",
    lesson: "6-11",
    food: "cake",
    orders: [
      { kind: "full", total: F(5), portion: F(2, 3) },
      { kind: "full", total: F(7, 2), portion: F(3, 4) },
      { kind: "share", total: F(5, 2), plates: 5 },
    ],
  },
];

export const STATIONS = { ticket: 160, pantry: 360, serve: 640, counter: 860 };

export function createWorld(index, seed) {
  const L = LEVELS[index];
  return {
    rng: seed >>> 0 || 1,
    tick: 0,
    level: index,
    food: L.food,
    w: 1200,
    h: 620,
    p: makeBody(240, FLOOR - 40),
    solids: [
      { x: 0, y: FLOOR, w: 1200, h: 200, kind: "floor" },
      { x: 0, y: 0, w: 20, h: FLOOR, kind: "wall" },
      { x: 1180, y: 0, w: 20, h: FLOOR, kind: "wall" },
    ],
    orders: L.orders.map((o) => JSON.parse(JSON.stringify(o))),
    current: 0,
    serving: null,
    served: [],
    done: 0,
  };
}
