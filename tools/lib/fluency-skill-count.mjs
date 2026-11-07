// The Fluency Lab's skill count per grade, pinned in ONE place for every test that checks the lab still has all of
// its skills. Adding or retiring a skill is a deliberate edit here (and in math/fluency-lab/problem-bank.js).
// 2026-11: Grade 6 gained nine strands (statistics, expressions, inequalities, rational order, percent of a whole,
// surface area from nets, fractional volume, multi-digit division).
export const SKILLS_PER_GRADE = { 0: 9, 1: 13, 2: 15, 3: 13, 4: 15, 5: 13, 6: 20, 7: 15, 8: 15 };
export const TOTAL_SKILLS = Object.values(SKILLS_PER_GRADE).reduce((a, b) => a + b, 0);
