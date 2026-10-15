// Generated studio text: true minus signs, real plurals and superscripts; prism figure labels match mixed-number stems.
//   node tools/studio-typography.test.mjs
import assert from "node:assert/strict";
import { loadStudio } from "./lib/studio-vm.mjs";

const ctx = loadStudio({ gen: true, viz: true });
const G = ctx.StudioGen;
const V = ctx.StudioViz;
const SKIP = new Set([
  "a",
  "v",
  "viz",
  "gen",
  "tag",
  "k",
  "id",
  "model",
  "seed",
  "tol",
  "cells",
  "b",
]);
const strings = (o, out = []) => {
  if (typeof o === "string") out.push(o);
  else if (Array.isArray(o)) o.forEach((x) => strings(x, out));
  else if (o && typeof o === "object")
    for (const [k, v] of Object.entries(o)) if (!SKIP.has(k)) strings(v, out);
  return out;
};
const BAD = {
  "ASCII hyphen as a minus": /(^|[\s(,=<>:|±×÷+−])-(?=\.?\d)/,
  "place(s) / time(s)": /\b(place|time|lugar|cifra)\(s?\)?|lugar\(es\)/,
  "caret exponent": /\^/,
};
let checked = 0;
for (const id of Object.keys(G.registry))
  for (let level = 1; level <= 4; level++)
    for (let seed = 1; seed <= 60; seed++) {
      const it = G.make(id, level, seed);
      for (const s of strings(it))
        for (const [name, re] of Object.entries(BAD))
          assert.ok(!re.test(s), `${id} L${level} #${seed}: ${name} in "${s.slice(0, 100)}"`);
      checked++;
    }
for (const id of ["volumePrism", "surfaceAreaPrism"])
  for (let level = 1; level <= 4; level++)
    for (let seed = 1; seed <= 100; seed++) {
      const it = G.make(id, level, seed);
      if (!it.viz?.t || !/\d \d\/\d/.test(it.q)) continue;
      const labels = [...V.render(it.viz).matchAll(/<text[^>]*>([^<]*)</g)].map((m) => m[1]);
      assert.ok(
        !labels.some((t) => /\d\.\d/.test(t)),
        `${id} L${level} #${seed}: figure prints a decimal where the stem writes a mixed number`,
      );
    }
console.log(
  `studio-typography: ${checked} generated items clean; prism figures match their stems.`,
);
