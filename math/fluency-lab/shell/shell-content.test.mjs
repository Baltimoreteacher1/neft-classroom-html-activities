// Every skill gets a concept, a worked example, a guided attempt and a help ladder, and no help rung shown
// BEFORE an answer may print that answer (as a standalone number in the notation or the words).
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { GRADES, generateProblem, seededRandom } from "../problem-bank.js";
import { lessonFor } from "../studio/engines.js";
import { adaptiveProblem } from "../tutor-engine.js";
import { AUTHORED } from "./authored/index.js";
import { anotherWay, helpLadder, teach } from "./content.js";
import { missingSpanish } from "./words.js";

const pick = (v) => (v && typeof v === "object" ? v.en : v || "");
const standalone = (text, answer) => {
  const a = String(answer).replaceAll(",", "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(a) || Math.abs(Number(a)) < 10) return false; // small numbers appear as givens
  return new RegExp(`(^|[^\\d.])${a.replace(".", "\\.")}(?!\\d|\\.\\d)`).test(String(text).replaceAll(",", "").replaceAll("−", "-"));
};
let skills = 0, modeled = 0, leaks = [];
for (const g of GRADES) for (const raw of g.skills) {
  const skill = { ...raw, grade: g.grade };
  skills += 1;
  const c = teach(skill);
  assert.ok(pick(c.concept).length > 10, `${g.grade}:${skill.id} concept`);
  assert.ok(c.example.item.question, `${g.grade}:${skill.id} example`);
  assert.ok(c.example.frames.length || c.guideModel || c.guided.length, `${g.grade}:${skill.id} nothing to show`);
  if (c.example.modeled) modeled += 1;
  // Practice draws from adaptiveProblem at every level (0 smaller numbers, 1 the skill, 2 stretch), so all three
  // are checked, plus the plain generator the worked example uses.
  for (let s = 0; s < 32; s += 1) {
    const rng = seededRandom(s * 131 + g.grade);
    const item = s % 4 === 3 ? generateProblem(skill, rng) : adaptiveProblem(skill, rng, s % 4);
    const given = String(item.question).replaceAll(",", "").replaceAll("−", "-");
    for (const rung of helpLadder(skill, item)) {
      const texts = rung.kind === "hint" ? [rung.text] : rung.kind === "steps" ? rung.steps : rung.frames.flatMap((f) => [f.eq, pick(f.cap)]);
      for (const text of texts) for (const ans of item.answers || [])
        if (standalone(text, ans) && !standalone(given, ans)) leaks.push(`${g.grade}:${skill.id} [${rung.kind}] "${item.question}" → ${ans} in "${String(text).slice(0, 80)}"`);
    }
    // "Another way" is help too: neither the other representation nor the similar worked example may print it.
    const way = anotherWay(item, c);
    if (way) {
      const texts = way.kind === "text" ? [pick(way.text)] : way.frames.flatMap((f) => [f.eq, pick(f.cap)]);
      for (const text of texts) for (const ans of item.answers || [])
        if (standalone(text, ans) && !standalone(given, ans)) leaks.push(`${g.grade}:${skill.id} [another:${way.kind}] "${item.question}" → ${ans} in "${String(text).slice(0, 80)}"`);
    }
  }
}
console.log(`skills ${skills}, modeled worked examples ${modeled}, help-rung leaks ${leaks.length}`);
if (leaks.length) console.log(leaks.filter((l, i, a) => a.findIndex((x) => x.split(" \"")[0] === l.split(" \"")[0]) === i).join("\n"));
assert.equal(leaks.length, 0, "a help rung prints the answer");

// Authored entries carry Spanish for every text field and a transfer problem whose own answer checks.
for (const [key, entry] of Object.entries(AUTHORED)) {
  for (const field of ["concept", "misconception"]) assert.ok(entry[field]?.es && entry[field].es !== entry[field].en, `${key} ${field} has Spanish`);
  for (const m of entry.misconceptions || []) assert.ok(m.feedback?.es && typeof m.detect === "function", `${key} misconception ${m.id}`);
  if (entry.transfer) assert.ok(entry.transfer.prompt?.es && entry.transfer.answers?.length && entry.transfer.explanation?.es, `${key} transfer`);
}
// The Grade 6 ratio exemplar names the additive slip in the student's numbers, and only that slip.
const ratio = AUTHORED["6:ratios"].misconceptions.find((m) => m.id === "additive");
assert.ok(ratio.detect({ question: "6:10 = □:90" }, "86"), "6:10 = □:90 → 86 is the additive slip");
assert.ok(!ratio.detect({ question: "6:10 = □:90" }, "1"), "an answer of 1 is not the additive slip");
assert.ok(!ratio.detect({ question: "6:10 = □:90" }, "54"), "the right answer is not a slip");
assert.ok(ratio.detect({ question: "2:3 = 8:□" }, "9"), "2:3 = 8:□ → 9 is the additive slip");
// The ratio engine's predict names the term that actually changed (it said "first" for the second term).
for (const [q, which] of [["6:10 = □:90", "second"], ["2:3 = 8:□", "first"]]) {
  const lesson = lessonFor({ question: q, answers: ["0"] });
  const text = lesson.engine.predicts(lesson.spec)[0].q.en;
  assert.ok(text.startsWith(`The ${which} number`), `${q}: predict names the ${which} number — "${text}"`);
}
// Every interface string the app passes to tr() has a Spanish entry.
const keys = new Set();
for (const file of readdirSync(new URL(".", import.meta.url)).filter((f) => f.endsWith(".js")))
  for (const m of readFileSync(new URL(file, import.meta.url), "utf8").matchAll(/\btr\("((?:[^"\\]|\\.)+)"/g)) keys.add(m[1]);
const missing = missingSpanish([...keys]);
assert.deepEqual(missing, [], `interface strings without Spanish: ${missing.join(" | ")}`);
console.log(`authored ${Object.keys(AUTHORED).length}, interface strings ${keys.size}, all with Spanish`);
// Every skill title and strand the app shows has a Spanish name (titles-es.js), so Spanish mode has no English
// headings in the library, on home, or in progress.
{
  const { TITLES_ES } = await import("./titles-es.js");
  const { topicsFor } = await import("../skill-path.js");
  const names = new Set();
  for (const g of GRADES) {
    for (const s of g.skills) names.add(s.title);
    for (const t of topicsFor(g.grade)) names.add(t.name);
  }
  const untitled = [...names].filter((n) => !TITLES_ES[n] || TITLES_ES[n] === n);
  assert.deepEqual(untitled, [], `titles/strands without Spanish: ${untitled.join(" | ")}`);
}
