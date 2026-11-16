// Counterfactual Universe. No DOM.
//
// A Reality Shift forks the world at the current tick and changes exactly ONE
// mathematical condition in the fork. From then on both realities are stepped
// by the SAME rules with the SAME inputs, so every difference a student sees
// between them is a consequence of that one changed condition and nothing
// else. Nothing here draws: a reality is just another world object.
//
// Multiverse implements the Timeline subject contract (step / apply / snapshot
// / restore / hash / tick), so a game can put a multiverse on a timeline and
// rewind across a shift.

import { hashString } from "./sim.js";

/**
 * @typedef {Object} Change
 * @property {string} variable   the model variable that was changed ("rate", "height", ...)
 * @property {any} from
 * @property {any} to
 *
 * @typedef {Object} ShiftRules
 * @property {(world: any, mask: number, prevMask: number, events: any[]) => void} step
 * @property {(world: any, action: any, events: any[]) => void} apply
 * @property {(world: any, change: Change) => void} applyChange
 *   write the new condition AND recompute everything derived from it
 * @property {(world: any) => Record<string, number | string>} measure
 *   the quantities the investigation view compares (and tests for invariance)
 * @property {(from: any, to: any) => void} [carry]
 *   on switch, move the player's state across where it is valid in `to`
 */

export const PRIME = 0;
export const SHIFTED = 1;

export class Multiverse {
  /** @param {ShiftRules} rules @param {any} world initial (prime) world */
  constructor(rules, world) {
    if (typeof world.rng !== "number") throw new Error("Multiverse: world.rng (seed) is required");
    this.rules = rules;
    world.tick = world.tick | 0;
    world.prevMask = world.prevMask | 0;
    /** One world per reality; index PRIME always exists. */
    this.worlds = [world];
    /** Which reality the player is in. */
    this.active = PRIME;
    /** Every shift made, in order: the branch history the student can read back. */
    this.history = [];
    /** The change that defines the shifted reality, or null. */
    this.change = null;
    this.events = [];
  }

  get world() {
    return this.worlds[this.active];
  }

  get tick() {
    return this.worlds[PRIME].tick;
  }

  get shifted() {
    return this.worlds.length > 1;
  }

  /**
   * Open the alternate reality: clone the active world now and change one condition.
   * A second shift replaces the alternate (the prime timeline is never overwritten).
   * @param {Change} change
   */
  shift(change) {
    const base = this.worlds[PRIME];
    const fork = JSON.parse(JSON.stringify(base));
    this.rules.applyChange(fork, change);
    this.worlds[SHIFTED] = fork;
    this.change = change;
    this.history.push({ tick: base.tick, ...change });
    this.events.push({ type: "shift", change });
  }

  /** Step into the other reality. The player's valid state comes along. */
  switchTo(index) {
    if (index === this.active || !this.worlds[index]) return;
    if (this.rules.carry) this.rules.carry(this.worlds[this.active], this.worlds[index]);
    this.active = index;
    this.events.push({ type: "switch", reality: index });
  }

  /** Close the alternate reality and return to the original timeline. */
  collapse() {
    if (!this.shifted) return;
    this.active = PRIME;
    this.worlds.length = 1;
    this.change = null;
    this.events.push({ type: "collapse" });
  }

  step(mask) {
    for (let i = 0; i < this.worlds.length; i++) {
      const w = this.worlds[i];
      const tagged = this.events.length;
      this.rules.step(w, mask | 0, w.prevMask, this.events);
      for (let e = tagged; e < this.events.length; e++) this.events[e].reality = i;
      w.prevMask = mask | 0;
      w.tick++;
    }
  }

  /** Discrete decisions land in every open reality: same player, different mathematics. */
  apply(action) {
    if (action.type === "shift") return this.shift(action.change);
    if (action.type === "switch") return this.switchTo(action.reality);
    if (action.type === "collapse") return this.collapse();
    for (let i = 0; i < this.worlds.length; i++) {
      const tagged = this.events.length;
      this.rules.apply(this.worlds[i], action, this.events);
      for (let e = tagged; e < this.events.length; e++) this.events[e].reality = i;
    }
  }

  /**
   * Side-by-side investigation: every measured quantity in both realities,
   * split into what the shift changed and what stayed invariant.
   */
  investigate() {
    const a = this.rules.measure(this.worlds[PRIME]);
    const b = this.shifted ? this.rules.measure(this.worlds[SHIFTED]) : a;
    const changed = [];
    const invariant = [];
    for (const key of Object.keys(a)) {
      const same =
        typeof a[key] === "number" ? Math.abs(a[key] - b[key]) < 1e-9 : a[key] === b[key];
      (same ? invariant : changed).push({ key, prime: a[key], shifted: b[key] });
    }
    return { change: this.change, changed, invariant };
  }

  snapshot() {
    return JSON.stringify({
      worlds: this.worlds,
      active: this.active,
      change: this.change,
      history: this.history,
    });
  }

  restore(s) {
    const d = JSON.parse(s);
    this.worlds = d.worlds;
    this.active = d.active;
    this.change = d.change;
    this.history = d.history;
    this.events.length = 0;
  }

  hash() {
    return hashString(this.snapshot());
  }

  drain(into) {
    for (let i = 0; i < this.events.length; i++) into.push(this.events[i]);
    this.events.length = 0;
  }
}
