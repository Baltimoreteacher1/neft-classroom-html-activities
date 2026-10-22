// Worked solutions with one believable flaw, one template per misconception pattern. A template returns
//   { start, mode, steps, bad, slip, decoys, fix, near, answer, meta? }
// start   the problem as math text; every step is meant to equal the step before it (the first equals start)
// steps   what "a student" wrote; steps[bad] carries the slip and the steps after it follow from the slip
// fix     the step that belongs at steps[bad]; near holds two wrong repairs (equal in value to neither)
// answer  the right final result as text, so the bank can keep it off the screen
// mode    "expr" (steps are expressions, shown as "= ...") or "eq" (steps are whole equations or inequalities)
// Numbers use the lab's own symbols (− × ÷). mistake-bank.js assembles items; tools/fluency-mistakes.test.mjs
// re-derives every claim above with exact arithmetic.

import { ALGEBRA } from "./mistake-templates-algebra.js";
import { FRACTIONS } from "./mistake-templates-fractions.js";
import { RATIO } from "./mistake-templates-ratio.js";
import { WHOLE } from "./mistake-templates-whole.js";

export const TEMPLATES = { ...WHOLE, ...FRACTIONS, ...RATIO, ...ALGEBRA };
