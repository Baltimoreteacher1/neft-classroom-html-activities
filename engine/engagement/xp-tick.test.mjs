// The phase-complete XP counts UP, and never lies about the total.
//
// The animation is decoration; the NUMBER is information. So the invariant
// worth pinning is not "it animates" but "every path ends on the real total":
// reduced motion, a browser with no requestAnimationFrame, and a tab that gets
// throttled mid-count all have to leave the student looking at the XP they
// actually earned — not a zero frozen partway through a count that never ran.
//
// Driven with fake frames rather than a real clock, so this is deterministic
// and stays in `npm test` instead of needing the browser gate.

import assert from "node:assert/strict";
import test from "node:test";

import { tickXP } from "./engagement.js";

/** Minimal stand-in for the one DOM node tickXP touches. */
const fakeEl = () => ({ textContent: "" });

/**
 * Install fake globals and return a driver that plays frames on demand.
 * @param {{reduced?: boolean, raf?: boolean}} opts
 */
function withFakeFrames({ reduced = false, raf = true } = {}) {
  const queue = [];
  const prevWindow = globalThis.window;
  const prevRaf = globalThis.requestAnimationFrame;

  globalThis.window = {
    matchMedia: () => ({ matches: reduced }),
  };
  if (raf) {
    globalThis.requestAnimationFrame = (cb) => queue.push(cb);
    globalThis.window.requestAnimationFrame = globalThis.requestAnimationFrame;
  } else {
    globalThis.requestAnimationFrame = undefined;
  }

  return {
    /** Run the queued callback with a timestamp; returns how many ran. */
    frame(ts) {
      const pending = queue.splice(0, queue.length);
      for (const cb of pending) cb(ts);
      return pending.length;
    },
    pending: () => queue.length,
    restore() {
      globalThis.window = prevWindow;
      globalThis.requestAnimationFrame = prevRaf;
    },
  };
}

test("counts up from 0 and lands exactly on the total", () => {
  const frames = withFakeFrames();
  try {
    const el = fakeEl();
    tickXP(el, 120);

    // Before any frame runs, the count has been rewound to zero.
    assert.equal(el.textContent, "+0 XP");

    const seen = [];
    for (const ts of [0, 100, 250, 400, 550, 700]) {
      frames.frame(ts);
      seen.push(Number(el.textContent.match(/\d+/)[0]));
    }

    // Monotonic, never overshooting the total.
    for (let i = 1; i < seen.length; i++) {
      assert.ok(seen[i] >= seen[i - 1], `frame ${i} went backwards: ${seen}`);
      assert.ok(seen[i] <= 120, `frame ${i} overshot the total: ${seen}`);
    }
    // It actually moved — a function that wrote 0 forever would pass a
    // monotonic check on its own.
    assert.ok(seen.at(-2) > 0, `never left zero: ${seen}`);
    assert.equal(el.textContent, "+120 XP");
    assert.equal(frames.pending(), 0, "animation should stop at the end");
  } finally {
    frames.restore();
  }
});

test("reduced motion: final number immediately, no frames scheduled", () => {
  const frames = withFakeFrames({ reduced: true });
  try {
    const el = fakeEl();
    tickXP(el, 75);
    assert.equal(el.textContent, "+75 XP");
    assert.equal(frames.pending(), 0);
  } finally {
    frames.restore();
  }
});

test("no requestAnimationFrame: still shows the real total", () => {
  const frames = withFakeFrames({ raf: false });
  try {
    const el = fakeEl();
    tickXP(el, 40);
    assert.equal(el.textContent, "+40 XP");
  } finally {
    frames.restore();
  }
});

test("a count that never finishes still never shows a stale zero", () => {
  // A throttled/backgrounded tab can stop delivering frames partway. The
  // student must not be left staring at a number lower than they earned —
  // which is why the total is written BEFORE the rewind to zero.
  const frames = withFakeFrames();
  try {
    const el = fakeEl();
    tickXP(el, 200);
    frames.frame(0);
    frames.frame(350); // halfway, then frames stop arriving
    const stalled = Number(el.textContent.match(/\d+/)[0]);
    assert.ok(stalled > 0 && stalled < 200, `expected a mid-count value, got ${stalled}`);
    // …and if it resumes, it converges on the truth rather than drifting.
    frames.frame(700);
    assert.equal(el.textContent, "+200 XP");
  } finally {
    frames.restore();
  }
});

test("zero XP is not animated, and no element is not a crash", () => {
  const frames = withFakeFrames();
  try {
    const el = fakeEl();
    tickXP(el, 0);
    assert.equal(el.textContent, "+0 XP");
    assert.equal(frames.pending(), 0);
    assert.doesNotThrow(() => tickXP(null, 50));
  } finally {
    frames.restore();
  }
});
