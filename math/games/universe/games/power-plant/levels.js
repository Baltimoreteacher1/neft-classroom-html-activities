// Power Plant — level data and world construction. No DOM.
//
// A level is authored as plain rectangles and machines; createWorld() turns it
// into the single JSON world the simulation owns. Geometry is in pixels on a
// 620-px-tall section: G is the lower deck, U the upper deck.
//
// Machines:
//   power   a reactor: output = base^exp, shown as `exp` coils each multiplying by `base`
//   ops     a sequencer: a fixed expression plus one optional grouping clamp
//   combo   the Helix Core combiner: A + B × C from three reactors
// Devices turn a machine's output into something physical:
//   lift    rises `unit` px per unit of power; docks only at exactly `need`
//   bridge  extends `unit` px per unit of power; spans the gap only at exactly `need`
//   gate    opens when its feeds deliver exactly `need`
//   core    takes a sequence of loads

import { makeBody } from "../../runtime/physics.js";

export const G = 520;
export const U = 340;
const DEEP = 100;

const floor = (x, w, y = G) => ({ x, y, w, h: 620 - y + DEEP, kind: "floor" });
const block = (x, y, w, h) => ({ x, y, w, h, kind: "block" });
const ledge = (x, y, w) => ({ x, y, w, h: 14, kind: "ledge", oneWay: 1 });
const gate = (id, x, y, h) => ({ x, y, w: 24, h, kind: "gate", id, open: 0 });

export const LEVELS = [
  {
    id: "cold-start",
    lesson: "6-3",
    w: 2760,
    spawn: [90, G],
    solids: [
      floor(0, 560),
      floor(640, 260),
      block(330, G - 40, 70, 40),
      floor(1020, 560, U),
      gate("g1", 1020, 90, U - 90),
      floor(1850, 910, U),
      gate("g2", 2420, 90, U - 90),
    ],
    machines: [
      {
        id: "r1",
        kind: "power",
        x: 800,
        y: G,
        bases: [2],
        base: 2,
        exp: 1,
        maxExp: 5,
        target: 8,
        drives: "lift1",
        by: "wren",
      },
      {
        id: "r2",
        kind: "power",
        x: 1500,
        y: 210,
        bases: [3],
        base: 3,
        exp: 1,
        maxExp: 5,
        target: 9,
        drives: "bridge1",
        by: "ori",
        concept: "exp-repeat",
      },
      {
        id: "r3",
        kind: "power",
        x: 2110,
        y: U,
        bases: [2, 4],
        base: 2,
        exp: 1,
        maxExp: 5,
        target: 16,
        drives: "door2",
        by: "wren",
      },
      {
        id: "r4",
        kind: "power",
        x: 2250,
        y: 210,
        bases: [2, 4],
        base: 4,
        exp: 1,
        maxExp: 5,
        target: 16,
        drives: "door2",
        by: "twin",
      },
    ],
    devices: [
      { id: "lift1", kind: "lift", x: 900, y: G, w: 120, need: 8, unit: 22.5, gate: "g1" },
      { id: "bridge1", kind: "bridge", x: 1580, y: U, span: 270, need: 9 },
      { id: "door2", kind: "gate", need: 32, feeds: ["r3", "r4"], gate: "g2" },
    ],
    benches: [{ id: "coil", kind: "coil", x: 1240, y: U }],
    calls: [{ id: "call1", machine: "r2", x: 1535, y: U }],
    checkpoints: [
      { id: "cp1", x: 1090, y: U },
      { id: "cp2", x: 1910, y: U },
    ],
    triggers: [
      { id: "hello", x: 150, say: "l1Hello", who: "ori", mood: "curious" },
      { id: "jump", x: 250, say: "l1Jump", who: "ori", mood: "curious" },
      { id: "reactor", x: 700, say: "l1Reactor", who: "ori", mood: "focused" },
      { id: "oriGoes", x: 1400, ori: "r2" },
      { id: "twin", x: 2000, say: "l1Twin", who: "ori", mood: "curious" },
    ],
    exit: { x: 2600, y: U - 120, w: 120, h: 120 },
    vents: [],
    bots: [],
    movers: [],
    coils: -1,
  },
  {
    id: "coil-budget",
    lesson: "6-3",
    w: 3080,
    spawn: [90, G],
    solids: [
      floor(0, 760),
      floor(880, 300, U),
      gate("g1", 880, 90, U - 90),
      floor(1500, 420, U),
      floor(1920, 500, G),
      floor(2540, 540, U),
      gate("g3", 2540, 90, U - 90),
    ],
    machines: [
      {
        id: "r1",
        kind: "power",
        x: 650,
        y: G,
        bases: [2, 4, 8],
        base: 2,
        exp: 1,
        maxExp: 6,
        target: 64,
        drives: "lift1",
        by: "wren",
      },
      {
        id: "r2",
        kind: "power",
        x: 1100,
        y: U,
        bases: [3, 9],
        base: 3,
        exp: 1,
        maxExp: 4,
        target: 81,
        drives: "bridge1",
        by: "wren",
      },
      {
        id: "r3",
        kind: "power",
        x: 2330,
        y: G,
        bases: [2],
        base: 2,
        exp: 1,
        maxExp: 6,
        target: 32,
        drives: "lift3",
        by: "wren",
      },
    ],
    devices: [
      { id: "lift1", kind: "lift", x: 760, y: G, w: 120, need: 64, unit: 2.8125, gate: "g1" },
      { id: "bridge1", kind: "bridge", x: 1180, y: U, span: 320, need: 81 },
      { id: "lift3", kind: "lift", x: 2420, y: G, w: 120, need: 32, unit: 5.625, gate: "g3" },
    ],
    benches: [{ id: "coil", kind: "coil", x: 980, y: U }],
    calls: [],
    checkpoints: [
      { id: "cp1", x: 930, y: U },
      { id: "cp2", x: 1560, y: U },
      { id: "cp3", x: 2600, y: U },
    ],
    triggers: [
      { id: "budget", x: 420, say: "l2Budget", who: "ori", mood: "focused" },
      { id: "vents", x: 1540, say: "l2Vents", who: "ori", mood: "worried" },
      { id: "last", x: 2100, say: "l2Last", who: "ori", mood: "thinking" },
    ],
    exit: { x: 2940, y: U - 120, w: 120, h: 120 },
    vents: [
      { x: 1640, y: U, w: 44, period: 210, phase: 0 },
      { x: 1790, y: U, w: 44, period: 210, phase: 105 },
    ],
    bots: [{ x: 2020, y: G, x0: 1960, x1: 2260, dir: 1 }],
    movers: [],
    coils: 9,
  },
  {
    id: "sequencer-hall",
    lesson: "6-4",
    w: 2900,
    spawn: [90, G],
    solids: [
      floor(0, 760),
      floor(880, 520, U),
      gate("g1", 880, 90, U - 90),
      floor(1680, 500, U),
      floor(2180, 220, G),
      floor(2520, 380, U),
      gate("g3", 2520, 90, U - 90),
    ],
    machines: [
      {
        id: "s1",
        kind: "ops",
        x: 650,
        y: G,
        tokens: [2, "+", 3, "×", 4],
        target: 20,
        drives: "lift1",
        by: "wren",
      },
      {
        id: "s2",
        kind: "ops",
        x: 1320,
        y: 210,
        tokens: [3, "×", 2, "^", 2],
        target: 36,
        drives: "bridge1",
        by: "ori",
        concept: "ops-order",
      },
      {
        id: "s3",
        kind: "ops",
        x: 2290,
        y: G,
        tokens: [2, "+", 3, "×", 4, "^", 2],
        target: 80,
        drives: "lift3",
        by: "wren",
      },
    ],
    devices: [
      { id: "lift1", kind: "lift", x: 760, y: G, w: 120, need: 20, unit: 9, gate: "g1" },
      { id: "bridge1", kind: "bridge", x: 1400, y: U, span: 280, need: 36 },
      { id: "lift3", kind: "lift", x: 2400, y: G, w: 120, need: 80, unit: 2.25, gate: "g3" },
    ],
    benches: [{ id: "order", kind: "order", x: 1060, y: U }],
    calls: [{ id: "call1", machine: "s2", x: 1350, y: U }],
    checkpoints: [
      { id: "cp1", x: 930, y: U },
      { id: "cp2", x: 1740, y: U },
    ],
    triggers: [
      { id: "hall", x: 380, say: "l3Hall", who: "ori", mood: "curious" },
      { id: "oriGoes", x: 1220, ori: "s2" },
      { id: "big", x: 2200, say: "l3Big", who: "ori", mood: "focused" },
    ],
    exit: { x: 2760, y: U - 120, w: 120, h: 120 },
    vents: [{ x: 1860, y: U, w: 44, period: 240, phase: 0 }],
    bots: [{ x: 1980, y: U, x0: 1930, x1: 2140, dir: 1 }],
    movers: [],
    coils: -1,
  },
  {
    id: "helix-core",
    lesson: "6-4",
    w: 1500,
    spawn: [120, G],
    solids: [
      floor(0, 1500),
      ledge(180, 400, 190),
      ledge(1130, 400, 190),
      ledge(560, 300, 380),
      gate("g9", 1380, 90, G - 90),
    ],
    machines: [
      {
        id: "a",
        kind: "power",
        x: 275,
        y: 400,
        bases: [2, 3],
        base: 2,
        exp: 0,
        maxExp: 5,
        target: 0,
        drives: "core",
        by: "wren",
        minExp: 0,
        tag: "A",
      },
      {
        id: "b",
        kind: "power",
        x: 750,
        y: 300,
        bases: [2, 5],
        base: 2,
        exp: 0,
        maxExp: 5,
        target: 0,
        drives: "core",
        by: "wren",
        minExp: 0,
        tag: "B",
      },
      {
        id: "c",
        kind: "power",
        x: 1225,
        y: 400,
        bases: [2, 3, 4],
        base: 2,
        exp: 0,
        maxExp: 5,
        target: 0,
        drives: "core",
        by: "wren",
        minExp: 0,
        tag: "C",
      },
      {
        id: "core",
        kind: "combo",
        x: 750,
        y: G,
        parts: ["a", "b", "c"],
        loads: [40, 100, 31],
        drives: "core",
        by: "wren",
      },
    ],
    devices: [{ id: "core", kind: "core", x: 750, y: 150, gate: "g9" }],
    benches: [],
    calls: [],
    checkpoints: [{ id: "cp1", x: 120, y: G }],
    triggers: [{ id: "core", x: 200, say: "l4Core", who: "ori", mood: "worried" }],
    exit: { x: 1410, y: G - 120, w: 90, h: 120 },
    vents: [],
    bots: [],
    movers: [],
    pulse: { period: 300, speed: 4.5 },
    coils: 8,
  },
];

/**
 * Build the world for a level.
 * @param {number} index @param {number} seed
 * @param {{exp: boolean, ops: boolean, twin: boolean}} know what Ori already holds (from the save)
 */
export function createWorld(index, seed, know) {
  const L = LEVELS[index];
  const solids = L.solids.map((s) => ({ dx: 0, dy: 0, ...s }));
  const devices = L.devices.map((d) => {
    const dev = { value: 0, goal: 0, phase: "idle", out: 0, solid: -1, gateSolid: -1, ...d };
    if (d.kind === "lift") {
      dev.solid = solids.length;
      solids.push({ x: d.x, y: d.y, w: d.w, h: 16, kind: "lift", dx: 0, dy: 0 });
    } else if (d.kind === "bridge") {
      dev.unit = d.span / d.need;
      dev.solid = solids.length;
      solids.push({ x: d.x, y: d.y, w: 0, h: 14, kind: "bridge", dx: 0, dy: 0, open: 1 });
    } else if (d.kind === "core") {
      dev.phaseIndex = 0;
      dev.load = 0;
    }
    if (d.gate) dev.gateSolid = solids.findIndex((s) => s.id === d.gate);
    return dev;
  });
  return {
    rng: seed >>> 0 || 1,
    tick: 0,
    level: index,
    w: L.w,
    h: 620,
    p: makeBody(L.spawn[0], L.spawn[1] - 40),
    safe: { x: L.spawn[0], y: L.spawn[1] - 40 },
    stun: 0,
    ori: { x: L.spawn[0] - 40, y: L.spawn[1] - 90, mode: "follow", at: "", busy: 0 },
    know: { exp: !!know.exp, ops: !!know.ops, twin: !!know.twin },
    solids,
    devices,
    machines: L.machines.map((m) => ({
      state: "idle",
      t: 0,
      out: 0,
      held: 0,
      group: null,
      tries: 0,
      ...m,
    })),
    benches: L.benches,
    calls: L.calls,
    checkpoints: L.checkpoints.map((c) => ({ ...c, hit: 0 })),
    triggers: L.triggers.map((t) => ({ ...t, done: 0 })),
    exit: L.exit,
    vents: L.vents.map((v) => ({ ...v })),
    bots: L.bots.map((b) => ({ ...b, w: 34, h: 30 })),
    pulse: L.pulse ? { ...L.pulse, x: -1, dir: 1, t: 0 } : null,
    coils: L.coils,
    done: 0,
  };
}
