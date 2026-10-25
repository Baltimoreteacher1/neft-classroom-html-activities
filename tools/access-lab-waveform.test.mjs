#!/usr/bin/env node
import assert from "node:assert/strict";
import test from "node:test";
import { peaks, waveformSVG } from "../access-practice-lab/src/waveform.js";

test("peaks keep the loudest sample of each slice so short bursts still show", () => {
  const env = [0, 0, 0.9, 0, 0, 0, 0.2, 0];
  assert.deepEqual(peaks(env, 4), [0, 0.9, 0, 0.2]);
});

test("peaks clamp out-of-range and non-numeric samples", () => {
  assert.deepEqual(peaks([2, -1, "x", NaN], 2), [1, 0]);
});

test("an empty or missing envelope draws a flat baseline, never throws", () => {
  assert.deepEqual(peaks(undefined, 3), [0, 0, 0]);
  const svg = waveformSVG(undefined, { bars: 3 });
  assert.equal((svg.match(/<rect /g) || []).length, 3);
  assert.match(svg, /aria-hidden="true"/);
});

test("waveform bars scale to the height and never fall below one unit", () => {
  const svg = waveformSVG([1, 0], { bars: 2, height: 40 });
  assert.match(svg, /<rect x="0" y="0" width="3" height="40"/);
  assert.match(svg, /<rect x="5" y="19.5" width="3" height="1"/);
});
