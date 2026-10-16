import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { bridgeProblems, bridgeRequired } from "../scripts/lib/homework-bridge.mjs";
import { lessonPath } from "./lib/curriculum-source.mjs";
import {
  checkBridges,
  lessonCorpus,
  readSidecar,
  requiredIds,
} from "./lib/family-bridge-check.mjs";

test("every Unit 4 and Unit 6 sidecar (Part 1 and Part 2) carries a sound Then-vs-now card", () => {
  const ids = requiredIds();
  for (const want of ["4-1", "4-5-part2", "6-1", "6-15-part2", "6-1-6-2-practice"])
    assert.ok(ids.includes(want), `${want} is a required bridge page`);
  assert.ok(ids.length >= 42, `expected >= 42 required pages, got ${ids.length}`);
  assert.deepEqual(checkBridges(), []);
});

test("the detectors bite: each defect class is reported", () => {
  const good = readSidecar("6-1").bridge;
  const corpus = lessonCorpus("6-1");
  assert.deepEqual(bridgeProblems("6-1", good, corpus), []);
  const clone = () => structuredClone(good);
  const cases = {
    "missing bridge": [undefined, /missing/],
    "missing Spanish": [
      (() => {
        const b = clone();
        b.why.es = "";
        return b;
      })(),
      /needs non-empty/,
    ],
    "English copied over": [
      (() => {
        const b = clone();
        b.before.es = b.before.en;
        return b;
      })(),
      /copied over/,
    ],
    "invented number": [
      (() => {
        const b = clone();
        b.class.en = "In class we find 7919 pieces by counting how many fourths fit.";
        return b;
      })(),
      /7919/,
    ],
    "too long": [
      (() => {
        const b = clone();
        b.why.en = "word ".repeat(60);
        return b;
      })(),
      /words/,
    ],
    "vague opener": [
      (() => {
        const b = clone();
        b.class.en = "Solve it by counting how many fourths fit in the whole.";
        return b;
      })(),
      /vague/,
    ],
  };
  for (const [name, [bridge, re]] of Object.entries(cases))
    assert.match(bridgeProblems("6-1", bridge, corpus).join("\n"), re, name);
});

test("repeated card text between lessons is rejected", () => {
  const a = readSidecar("4-1").bridge;
  const seen = new Map();
  for (const id of requiredIds()) {
    const key = readSidecar(id).bridge.class.en.trim().toLowerCase();
    assert.ok(!seen.has(key), `${id} repeats ${seen.get(key)}`);
    seen.set(key, id);
  }
  assert.ok(a);
});

test("generated pages show the card in the grown-up panel, only where authored", () => {
  for (const id of requiredIds()) {
    const html = readFileSync(lessonPath(id, "homework.html"), "utf8");
    assert.match(html, /data-bridge-card/, `${id} homework.html renders the bridge card`);
    assert.match(html, /How you may have learned it/);
    assert.match(html, /Cómo pudiste haberlo aprendido/);
  }
  assert.equal(bridgeRequired("3-2"), false);
  assert.doesNotMatch(readFileSync(lessonPath("3-2", "homework.html"), "utf8"), /data-bridge-card/);
});
