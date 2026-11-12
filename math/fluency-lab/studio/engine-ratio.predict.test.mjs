// The ratio engine's Predict point must name the term that actually moved. It used to say "The first number goes
// from 2 by × 5" when the second term was the one scaled (6:10 = □:90 scales 10 → 90). For every ratio and
// proportion item the generators produce, the term is decided here from the QUESTION TEXT (independently of the
// engine's spec), and the sentence must name that term, start from its value, and land where the first step
// takes it; the full chain of steps must reach the known target value.
import assert from "node:assert/strict";
import { GRADES, generateProblem, seededRandom } from "../problem-bank.js";
import { adaptiveProblem } from "../tutor-engine.js";
import { lessonFor } from "./engines.js";

const clean = (s) => String(s).replaceAll("−", "-").replaceAll("×", "x");
// "a:b = c:□" → first term known (c); "a:b = □:d" → second term known (d); "a/b = x/c" → second term known.
function known(question) {
  const q = clean(question);
  let m = q.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?|□)\s*:\s*(\d+(?:\.\d+)?|□)/);
  if (m) return m[3] === "□" ? { which: "second", from: Number(m[2]), to: Number(m[4]) } : { which: "first", from: Number(m[1]), to: Number(m[3]) };
  m = q.match(/(\d+)\/(\d+) = x\/(\d+)/);
  if (m) return { which: "second", from: Number(m[2]), to: Number(m[3]) };
  return null;
}
const fmtNum = (n) => String(Math.round(n * 1e6) / 1e6);

let checked = 0;
const skills = GRADES.flatMap((g) => g.skills.map((s) => ({ ...s, grade: g.grade }))).filter((s) => ["ratios", "proportions"].includes(s.id));
const items = [{ question: "6:10 = □:90", answers: ["54"] }, { question: "2:3 = 8:□", answers: ["12"] }];
for (const skill of skills)
  for (let i = 0; i < 300; i += 1) {
    const rng = seededRandom(i * 7 + skill.grade);
    items.push(i % 4 === 3 ? generateProblem(skill, rng) : adaptiveProblem(skill, rng, i % 4));
  }
for (const item of items) {
  const lesson = lessonFor(item);
  if (!lesson?.modeled || lesson.spec.engine !== "ratio") continue;
  const want = known(item.question);
  if (!want) continue;
  const p = lesson.engine.predicts(lesson.spec)[0];
  if (!p) continue;
  const step = lesson.spec.steps[0];
  const after = step.k === "mul" ? want.from * step.n : want.from / step.n;
  const op = step.k === "mul" ? "×" : "÷";
  assert.ok(p.q.en.startsWith(`The ${want.which} number goes from ${fmtNum(want.from)} to ${fmtNum(after)}: that is ${op} `), `"${item.question}" → "${p.q.en}"`);
  assert.ok(p.q.es.startsWith(`El ${want.which === "first" ? "primer" : "segundo"} número pasa de`), `"${item.question}" (es) → "${p.q.es}"`);
  const end = lesson.spec.steps.reduce((v, s) => (s.k === "mul" ? v * s.n : v / s.n), want.from);
  assert.ok(Math.abs(end - want.to) < 1e-9, `"${item.question}": the steps take ${want.from} to ${want.to}`);
  checked += 1;
}
assert.ok(checked > 300, `predict wording checked on ${checked} items`);
console.log(`ratio predict wording: ${checked} items name the term that moved`);
