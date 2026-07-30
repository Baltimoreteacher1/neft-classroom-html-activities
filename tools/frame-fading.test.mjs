#!/usr/bin/env node
/* ==========================================================================
 * frame-fading.test.mjs
 *
 * The assertions that matter here are the EQUITY ones, not the ladder ones.
 *
 * Fading scaffolds is only defensible because the faded material stays one tap
 * away. If a later edit drops the "Show sentence starters" control, or lets the
 * ladder overrule an explicit Level 1 choice, the feature stops being scaffold
 * withdrawal and becomes access removal — for exactly the students the support
 * exists for. Neither failure would look like a bug in a browser; the card just
 * renders with less on it. So both are pinned in source here.
 * ========================================================================== */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://eduwonderlab.com/lessons/3-1/",
});
globalThis.window = dom.window;
globalThis.localStorage = dom.window.localStorage;

const {
  FRAME_LEVELS,
  completedInUnit,
  fadeNoteFor,
  framePartsFor,
  recordTurnAndTalk,
  resolveFrameLevel,
} = await import("../engine/core/frame-fading.js");

let checks = 0;

// ── The ladder ─────────────────────────────────────────────────────────────
checks += 1;
assert.equal(resolveFrameLevel({ unit: 3 }), FRAME_LEVELS.full, "a new unit starts at full support");

for (let i = 0; i < 3; i++) recordTurnAndTalk(3);
checks += 1;
assert.equal(completedInUnit(3), 3, "completions accumulate");
checks += 1;
assert.equal(resolveFrameLevel({ unit: 3 }), FRAME_LEVELS.partial, "3 talks -> one starter");

for (let i = 0; i < 3; i++) recordTurnAndTalk(3);
checks += 1;
assert.equal(resolveFrameLevel({ unit: 3 }), FRAME_LEVELS.light, "6 talks -> word bank only");

for (let i = 0; i < 4; i++) recordTurnAndTalk(3);
checks += 1;
assert.equal(resolveFrameLevel({ unit: 3 }), FRAME_LEVELS.none, "10 talks -> their own words");

// A different unit is a different language. The ladder must reset.
checks += 1;
assert.equal(
  resolveFrameLevel({ unit: 8 }),
  FRAME_LEVELS.full,
  "a new unit resets the ladder — statistics talk is not ratio talk",
);
checks += 1;
assert.equal(completedInUnit(8), 0, "units are counted separately");

// ── Level 1 is never overruled ─────────────────────────────────────────────
checks += 1;
assert.equal(
  resolveFrameLevel({ unit: 3, chosenLevel: "level1" }),
  FRAME_LEVELS.full,
  "an explicit Level 1 choice keeps FULL support no matter how far the ladder ran",
);
checks += 1;
assert.notEqual(
  resolveFrameLevel({ unit: 3, chosenLevel: "level2" }),
  FRAME_LEVELS.none,
  "even Level 2 keeps the word bank — vocabulary is not a crutch",
);

// ── Parts ──────────────────────────────────────────────────────────────────
checks += 1;
assert.deepEqual(
  framePartsFor(FRAME_LEVELS.partial),
  { kernel: true, stems: 1, wordBank: true },
  "partial shows exactly one starter",
);
checks += 1;
assert.equal(framePartsFor(FRAME_LEVELS.full).stems, Number.POSITIVE_INFINITY, "full shows all");
checks += 1;
assert.deepEqual(
  framePartsFor(FRAME_LEVELS.none),
  { kernel: false, stems: 0, wordBank: false },
  "none shows nothing by default",
);
checks += 1;
assert.equal(fadeNoteFor(FRAME_LEVELS.full), "", "full support needs no explanation");
checks += 1;
assert.ok(fadeNoteFor(FRAME_LEVELS.none), "a faded level explains itself");
for (const level of Object.values(FRAME_LEVELS)) {
  checks += 1;
  assert.equal(
    /\b(you (?:cannot|can't|don't need)|no longer|too easy|beginner)\b/i.test(fadeNoteFor(level)),
    false,
    `the ${level} note must not frame withdrawal as a deficit`,
  );
}

// ── Blocked storage degrades to full support, never to an error ────────────
{
  const original = dom.window.localStorage.setItem;
  dom.window.localStorage.setItem = () => {
    throw new Error("quota");
  };
  checks += 1;
  assert.doesNotThrow(() => recordTurnAndTalk(9), "a blocked write must not throw");
  checks += 1;
  assert.equal(
    resolveFrameLevel({ unit: 9 }),
    FRAME_LEVELS.full,
    "without storage the student keeps full support — fail toward MORE help",
  );
  dom.window.localStorage.setItem = original;
}

// ── The escape hatch exists in the renderer ────────────────────────────────
{
  const renderer = readFileSync(
    new URL("../engine/core/lesson-renderer.js", import.meta.url),
    "utf8",
  );
  checks += 1;
  assert.ok(
    renderer.includes("Show sentence starters"),
    "faded frames MUST stay one tap away — the restore control is what makes fading legitimate",
  );
  checks += 1;
  assert.ok(
    renderer.includes("tt-show-frames"),
    "the restore control keeps a stable hook so it can be found and tested",
  );
  // Restoring must not be recorded anywhere: a student who asks for the frames
  // is not generating a signal about themselves.
  const start = renderer.indexOf("tt-show-frames");
  const region = renderer.slice(start, start + 900);
  checks += 1;
  assert.equal(
    /saveResponse|NTtelemetry|NTSignal|recordTurnAndTalk/.test(region),
    false,
    "asking for the sentence starters back must not be logged as a deficit signal",
  );
  // The ladder only advances on a genuinely new completion.
  checks += 1;
  assert.ok(
    renderer.includes("markDone({ fresh: true })"),
    "only a fresh completion advances the ladder",
  );
  checks += 1;
  assert.ok(
    renderer.includes("if (fresh) recordTurnAndTalk"),
    "re-opening a finished lesson must not fast-forward the scaffolding",
  );
}

console.log(`sentence-frame fading: ${checks} checks passed.`);
