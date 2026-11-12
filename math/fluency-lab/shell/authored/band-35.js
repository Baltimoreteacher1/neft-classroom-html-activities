// Authored explanations for Grades 3–5, keyed "grade:skillId". Schema: see ../SCHEMA.md.
// One session owns this file; other bands live in their own files so parallel work never collides.
// Content lives in one module per grade (k5-g3/4/5.js); living models in lm-35.js; shared helpers in k5-kit.js.
import { G3 } from "./k5-g3.js";
import { G4 } from "./k5-g4.js";
import { G5 } from "./k5-g5.js";

import { withAnother } from "./k5-another.js";

export const BAND = withAnother({ ...G3, ...G4, ...G5 });
