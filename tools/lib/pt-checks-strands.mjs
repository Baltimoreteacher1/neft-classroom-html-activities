// Independent checks for the strand skills: the answer is recomputed from the question text alone.
//   { kind: "stem", stem, role: "answer" }       stem solved by tools/lib/strand-solver.mjs
//   { kind: "equivalent", a, b, role: "answer" } two expressions have the same value everywhere (exact-math.mjs)
import assert from "node:assert/strict";
import { equivalent } from "./exact-math.mjs";
import { solveStrand } from "./strand-solver.mjs";

const plain = (text) => String(text).replace(/\s+/g, "").replace(/[−–]/g, "-");

export const CHECKS = {
  stem(entry) {
    const found = solveStrand(entry.stem);
    assert.ok(
      found !== null && found !== undefined,
      `the strand solver does not cover: ${entry.stem}`,
    );
    if (typeof found === "string") return { text: found };
    return { value: found };
  },
  equivalent(entry) {
    assert.ok(equivalent(plain(entry.a), plain(entry.b)), `${entry.a} and ${entry.b} differ`);
    return { text: entry.b };
  },
};
