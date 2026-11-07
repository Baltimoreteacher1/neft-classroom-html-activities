// Every strand skill (Grades 3-8 and K-2 bands added in 2026-11) as data, concatenated from the band files. The
// registries read this one list: problem-bank.js (the skill), kid-learn.js (idea + watch-out), language-terms.js
// (word cards), lesson-4/skill-visuals.js, problem-types/fam-strands.js, response-items.js and mistake-bank.js.
// The eight Grade 6 strand skills were registered by hand in those files before this list existed.
import { STRAND_SKILLS_78 } from "./strand-skills-78.js";
import { STRAND_SKILLS_K2 } from "./strand-skills-k2.js";
import { STRAND_SKILLS_345 } from "./strand-skills-345.js";

export const STRAND_SKILLS = [...STRAND_SKILLS_K2, ...STRAND_SKILLS_345, ...STRAND_SKILLS_78];
export const strandKey = (skill) => `${skill.grade}:${skill.id}`;
