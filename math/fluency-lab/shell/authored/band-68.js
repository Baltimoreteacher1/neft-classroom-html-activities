// Authored explanations for Grades 6–8, keyed "grade:skillId". Schema: ../SCHEMA.md.
// One session owns this file; the content lives in g68-grade*.js (text and misconception detectors) and
// living-68-*.js (living models), so no single file grows past the repo's size limits.
// 6:ratios stays in ratios-6.js as the exemplar.
import { G6A } from "./g68-grade6a.js";
import { G6B } from "./g68-grade6b.js";
import { G6C } from "./g68-grade6c.js";
import { G7A } from "./g68-grade7a.js";
import { G7B } from "./g68-grade7b.js";
import { G8A } from "./g68-grade8a.js";
import { G8B } from "./g68-grade8b.js";
import { G8C } from "./g68-grade8c.js";
import { ANOTHER_68 } from "./g68-another.js";

const TEXT = { ...G6A, ...G6B, ...G6C, ...G7A, ...G7B, ...G8A, ...G8B, ...G8C };
// Every skill also gets its bilingual "Another way" (g68-another.js).
export const BAND = Object.fromEntries(Object.entries(TEXT).map(([key, entry]) => [key, { ...entry, another: ANOTHER_68[key] }]));
