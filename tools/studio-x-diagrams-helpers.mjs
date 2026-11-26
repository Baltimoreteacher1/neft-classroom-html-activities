// Shared helpers for the Studio X diagram tests.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { DiagramError } from "../access-practice-lab/src/studio/x/diagrams.js";

export const doc = (svg) => new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;
export const all = (svg, sel) => [...doc(svg).querySelectorAll(sel)];
export const num = (el, a) => Number(el.getAttribute(a));
export const near = (a, b, eps = 0.06) =>
  assert.ok(Math.abs(a - b) <= eps, `${a} is not within ${eps} of ${b}`);
export const throwsCode = (fn, code) =>
  assert.throws(
    fn,
    (e) => e instanceof DiagramError && e.code === code && e.message.length > 10,
    code,
  );
export const BAD = `<img onerror=x>&"'`;
