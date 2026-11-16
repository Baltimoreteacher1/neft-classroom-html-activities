// Math Gaming Runtime — deterministic simulation core. No DOM.
//
// A game's whole world is ONE plain JSON object (numbers, strings, arrays,
// plain objects). That single rule is what makes the Time Machine and the
// Counterfactual Universe honest: a snapshot is the world itself, a rewind is
// a restore, and a replay from a snapshot with the same recorded inputs lands
// on the same hash. Nothing a game simulates may live outside `world`
// (no closures, no Math.random, no wall-clock time).
//
// Subject contract (what Timeline drives; Simulation and Multiverse implement it):
//   step(mask)        advance one fixed tick with this tick's input bitmask
//   apply(action)     apply a discrete PlayerAction (a mathematical decision)
//   snapshot()        -> string
//   restore(string)
//   hash()            -> uint32
//   tick              ticks simulated since the level started

export const STEP = 1 / 60;

// Input bitmask. Digital on purpose: a recorded tick is one small integer, and
// keyboard, touch and gamepad all reduce to the same bits.
export const IN = {
  LEFT: 1,
  RIGHT: 2,
  UP: 4,
  DOWN: 8,
  JUMP: 16,
  DASH: 32,
  ACT: 64,
};

/** Advance the world's own PRNG (mulberry32 state kept IN the world). */
export function rand(world) {
  world.rng = (world.rng + 0x6d2b79f5) >>> 0;
  let t = world.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randInt(world, lo, hi) {
  return lo + Math.floor(rand(world) * (hi - lo + 1));
}

/** FNV-1a over a string: cheap, stable identity for a world state. */
export function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Snap a simulated value to 1e-6 so chained float math cannot drift apart on replay. */
export function q(x) {
  return Math.round(x * 1e6) / 1e6;
}

/**
 * @typedef {Object} SimRules
 * @property {(world: any, mask: number, prevMask: number, events: any[]) => void} step
 *   one fixed tick; push SimulationEvents ({type, ...}) to `events`
 * @property {(world: any, action: {type: string}, events: any[]) => void} apply
 *   a discrete mathematical decision; must recompute everything it affects
 */

export class Simulation {
  /**
   * @param {SimRules} rules
   * @param {any} world initial world; must carry numeric `rng`
   */
  constructor(rules, world) {
    if (typeof world.rng !== "number") throw new Error("Simulation: world.rng (seed) is required");
    this.rules = rules;
    this.world = world;
    this.world.tick = world.tick | 0;
    this.world.prevMask = world.prevMask | 0;
    /** Events raised since the last drain; presentation reads these, never the reverse. */
    this.events = [];
  }

  get tick() {
    return this.world.tick;
  }

  step(mask) {
    const w = this.world;
    this.rules.step(w, mask | 0, w.prevMask, this.events);
    w.prevMask = mask | 0;
    w.tick++;
  }

  apply(action) {
    this.rules.apply(this.world, action, this.events);
  }

  snapshot() {
    return JSON.stringify(this.world);
  }

  restore(s) {
    this.world = JSON.parse(s);
    this.events.length = 0;
  }

  hash() {
    return hashString(this.snapshot());
  }

  /** Hand the queued events to the presentation layer and clear the queue. */
  drain(into) {
    for (let i = 0; i < this.events.length; i++) into.push(this.events[i]);
    this.events.length = 0;
  }
}

/** Run-length encoder for a tick-by-tick input mask stream: [mask, count, mask, count, ...]. */
export function rlePush(rle, mask) {
  const n = rle.length;
  if (n >= 2 && rle[n - 2] === mask) rle[n - 1]++;
  else rle.push(mask, 1);
}

export function rleLength(rle) {
  let n = 0;
  for (let i = 1; i < rle.length; i += 2) n += rle[i];
  return n;
}
