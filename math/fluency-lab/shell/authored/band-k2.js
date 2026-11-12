// Authored explanations for Kindergarten–Grade 2, keyed "grade:skillId". Schema: see ../SCHEMA.md.
// One session owns this file; other bands live in their own files so parallel work never collides.
// Content lives in one module per grade (k5-g0/1/2.js); living models in lm-k2.js; shared helpers in k5-kit.js.
import { G0 } from "./k5-g0.js";
import { G1 } from "./k5-g1.js";
import { G2 } from "./k5-g2.js";

import { withAnother } from "./k5-another.js";

export const BAND = withAnother({ ...G0, ...G1, ...G2 });
