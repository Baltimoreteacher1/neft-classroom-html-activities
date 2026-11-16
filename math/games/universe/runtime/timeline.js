// Mathematical Time Machine. No DOM.
//
// Not an undo stack. The timeline is a TREE of mathematical turning points:
// every meaningful decision (changed an expression, set a ratio, made a
// prediction, repaired a strategy) becomes a node holding
//   - `lead`:   the run-length-encoded input ticks simulated between the
//               parent's decision and this one,
//   - `before`: the snapshot of the subject taken just BEFORE the decision,
//   - `action`: the decision itself (a PlayerAction),
//   - `outcome`: what the world did with it,
//   - `tail` / `endHash`: for a leaf, the ticks played after the decision and
//               the state hash where that branch was left.
//
// Rewinding to a node restores its `before` and moves the head to the node's
// parent, so the next decision becomes a SIBLING: the original branch stays
// whole and can be compared against or replayed. Replay restores a snapshot and
// feeds the recorded decisions and input ticks back through the same
// deterministic step; every `before` it passes must hash to the recorded one.

import { hashString, rleLength, rlePush } from "./sim.js";

/**
 * @typedef {Object} TimelineNode
 * @property {number} id
 * @property {number} parent          -1 for the root
 * @property {number} tick            subject tick when the decision was made
 * @property {string} kind            "start" | "expression" | "ratio" | "prediction" | ...
 * @property {{en: string, es: string}} label   what the student reads on the timeline
 * @property {any} action             the PlayerAction applied (null for the root)
 * @property {number[]} lead          RLE inputs from the parent's decision to this one
 * @property {string} before          snapshot before the action
 * @property {{ok: boolean, key: string, vars?: any} | null} outcome
 * @property {number[]} tail          RLE inputs after the action (leaves only)
 * @property {number} endHash         subject hash at the end of `tail` (0 = not left yet)
 * @property {number[]} children
 */

export class Timeline {
  /** @param {{step: Function, apply: Function, snapshot: Function, restore: Function, hash: Function, tick: number}} subject */
  constructor(subject) {
    this.subject = subject;
    /** @type {TimelineNode[]} */
    this.nodes = [];
    this.head = -1;
    /** Inputs simulated since the head's decision (or since the rewind point). */
    this.pending = [];
    this.replaying = false;
    this.mark("start", { en: "Start", es: "Inicio" }, null);
  }

  /** Advance the subject one tick and record the input. */
  step(mask) {
    this.subject.step(mask);
    if (!this.replaying) rlePush(this.pending, mask | 0);
  }

  /**
   * Record a mathematical turning point and apply it.
   * @returns {number} the new node id
   */
  mark(kind, label, action) {
    const node = {
      id: this.nodes.length,
      parent: this.head,
      tick: this.subject.tick,
      kind,
      label,
      action,
      lead: this.pending,
      before: this.subject.snapshot(),
      outcome: null,
      tail: [],
      endHash: 0,
      children: [],
    };
    this.nodes.push(node);
    if (this.head >= 0) this.nodes[this.head].children.push(node.id);
    this.head = node.id;
    this.pending = [];
    if (action) this.subject.apply(action);
    return node.id;
  }

  /** Attach what the world did with the decision at `id` (default: the head). */
  resolve(outcome, id = this.head) {
    this.nodes[id].outcome = outcome;
  }

  /** Freeze the current position as the end of the head's branch (leaves only). */
  close() {
    const node = this.nodes[this.head];
    if (node.children.length) return;
    node.tail = this.pending.slice();
    node.endHash = this.subject.hash();
  }

  /** Root-to-node path of ids. */
  path(id = this.head) {
    const out = [];
    for (let n = id; n >= 0; n = this.nodes[n].parent) out.push(n);
    return out.reverse();
  }

  /** Every leaf: one per branch the student has explored. */
  leaves() {
    return this.nodes.filter((n) => n.children.length === 0).map((n) => n.id);
  }

  /**
   * Rewind to just BEFORE the decision at `id`. That decision and everything
   * after it stay in the tree as the original branch.
   */
  rewindTo(id) {
    const node = this.nodes[id];
    if (!node || node.parent < 0)
      throw new Error("Timeline.rewindTo: cannot rewind past the start");
    this.close();
    this.subject.restore(node.before);
    this.head = node.parent;
    // A sibling decided from here was reached by the same ticks as `node`.
    this.pending = node.lead.slice();
  }

  /** First decision on the path to `leaf` whose outcome failed, or -1. */
  firstFailure(leaf = this.head) {
    for (const id of this.path(leaf)) {
      const o = this.nodes[id].outcome;
      if (o && !o.ok) return id;
    }
    return -1;
  }

  /**
   * Compare two branches decision by decision.
   * @returns {{shared: number[], forkAt: number, a: number[], b: number[]}}
   *   shared = common prefix, forkAt = last shared node, a/b = the differing tails
   */
  compare(leafA, leafB) {
    const pa = this.path(leafA);
    const pb = this.path(leafB);
    let i = 0;
    while (i < pa.length && i < pb.length && pa[i] === pb[i]) i++;
    return {
      shared: pa.slice(0, i),
      forkAt: i > 0 ? pa[i - 1] : -1,
      a: pa.slice(i),
      b: pb.slice(i),
    };
  }

  /**
   * Deterministic replay of the branch ending at `leaf`, starting at the
   * decision `from` (default: the first decision after the root). Returns a
   * stepper the presentation layer pumps once per tick. `verify()` is false if
   * any snapshot the replay passed did not reproduce its recorded hash.
   */
  replay(leaf = this.head, from = -1) {
    this.close();
    const path = this.path(leaf);
    let start = from < 0 ? 1 : path.indexOf(from);
    if (start < 0) start = 1;
    start = Math.min(start, path.length - 1);
    const resume = { snapshot: this.subject.snapshot(), head: this.head, pending: this.pending };
    const nodes = this.nodes;
    const subject = this.subject;
    subject.restore(nodes[path[start]].before);
    this.replaying = true;
    const tl = this;
    // Segment i: apply path[i].action, then play the ticks that followed it.
    const ticksAfter = (i) => (i + 1 < path.length ? nodes[path[i + 1]].lead : nodes[path[i]].tail);
    let pi = start;
    let ri = 0;
    let left = 0;
    let applied = false;
    let verified = true;
    let total = 0;
    for (let i = start; i < path.length; i++) total += rleLength(ticksAfter(i));
    return {
      total,
      /** The decision currently being replayed. */
      node: () => path[Math.min(pi, path.length - 1)],
      /** @returns {boolean} true while a tick was played; false when the branch is done */
      pump() {
        for (;;) {
          if (pi >= path.length) return false;
          const node = nodes[path[pi]];
          const ticks = ticksAfter(pi);
          if (!applied) {
            if (node.action) subject.apply(node.action);
            applied = true;
            ri = 0;
            left = ticks.length ? ticks[1] : 0;
          }
          if (ri < ticks.length) {
            subject.step(ticks[ri]);
            if (--left === 0) {
              ri += 2;
              left = ri < ticks.length ? ticks[ri + 1] : 0;
            }
            return true;
          }
          const expected =
            pi + 1 < path.length ? hashString(nodes[path[pi + 1]].before) : node.endHash;
          if (expected && subject.hash() !== expected) verified = false;
          pi++;
          applied = false;
        }
      },
      verify: () => verified,
      /** Leave replay and put the subject back where the student was. */
      end() {
        tl.replaying = false;
        subject.restore(resume.snapshot);
        tl.head = resume.head;
        tl.pending = resume.pending;
      },
    };
  }

  /** Versioned, storage-safe form: the newest nodes plus the whole current path. */
  serialize(maxNodes = 60) {
    const ids = new Set(this.nodes.slice(-maxNodes).map((n) => n.id));
    for (const id of this.path()) ids.add(id);
    return {
      v: 1,
      head: this.head,
      pending: this.pending,
      nodes: this.nodes
        .filter((n) => ids.has(n.id))
        .map((n) => ({ ...n, children: n.children.filter((c) => ids.has(c)) })),
    };
  }

  /** Rebuild from serialize(); ids are remapped so the array stays dense. */
  static revive(subject, data) {
    const tl = Object.create(Timeline.prototype);
    tl.subject = subject;
    tl.replaying = false;
    const map = new Map(data.nodes.map((n, i) => [n.id, i]));
    const re = (id) => (map.has(id) ? map.get(id) : -1);
    tl.nodes = data.nodes.map((n, i) => ({
      ...n,
      id: i,
      parent: re(n.parent),
      children: n.children.map(re).filter((c) => c >= 0),
    }));
    tl.head = re(data.head);
    tl.pending = data.pending || [];
    return tl;
  }
}
