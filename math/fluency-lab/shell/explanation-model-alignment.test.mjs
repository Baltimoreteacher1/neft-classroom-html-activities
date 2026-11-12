// The written explanation of a problem (item.steps: "Step by step" help, the solution after a second miss, the
// full lab's steps) must state the SAME numbers as the picture/interactive model the student app shows for that
// problem (studio engine frames: chips and regrouping, area model parts, division work). For every skill, 50
// generated items at every practice level: each number of 10 or more that a step states must appear in the
// model (its equations, captions, labels or frame data) or in the problem itself. Single digits are place-value
// talk ("1 ten as 10 ones") and are compared by the per-operation checks below instead.
// A negative control plants the exact mismatch Joel reported (borrowing steps that split the subtrahend while
// the chips regroup a ten) and proves the detector catches it.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GRADES, generateProblem, seededRandom } from "../problem-bank.js";
import { framesOf, lessonFor, repsOf } from "../studio/engines.js";
import { adaptiveProblem } from "../tutor-engine.js";
import { expectations, columnSpec } from "../vertical-columns.js";
import { parseColumns, regroupPlan, planSteps } from "../regroup-plan.js";

const numbersIn = (text) =>
  [...String(text).replaceAll("−", "-").matchAll(/(?<![\d.])\d[\d,]*(?:\.\d+)?/g)].map((m) => Number(m[0].replaceAll(",", "")));
const textOf = (v) => (v && typeof v === "object" ? `${v.en || ""} ${v.es || ""}` : String(v ?? ""));
function modelNumbers(item, lesson) {
  const seen = new Set([...numbersIn(item.question), ...(item.answers || []).flatMap(numbersIn)]);
  const add = (v) => {
    if (typeof v === "number") seen.add(v);
    else if (typeof v === "string") numbersIn(v).forEach((n) => seen.add(n));
    else if (Array.isArray(v)) v.forEach(add);
    else if (v && typeof v === "object") Object.values(v).forEach(add);
  };
  for (const rep of repsOf(lesson))
    for (const f of framesOf(lesson, rep)) {
      add(f.eq);
      add(textOf(f.cap));
      add(f.meta);
      add([...String(f.svg).matchAll(/>([^<]+)</g)].map((m) => m[1]));
    }
  return seen;
}
// Numbers a step states that the model never shows. Returns [] when they agree.
export function strayNumbers(item, lesson, steps = item.steps || []) {
  const model = modelNumbers(item, lesson);
  const close = (n) => [...model].some((m) => Math.abs(m - n) < 1e-9);
  const scale = (n) => [10, 100, 1000].includes(n); // "multiply by 10", "regroup 10 ones": place-value words
  return steps.flatMap((s) => numbersIn(s).filter((n) => n >= 10 && !scale(n) && !close(n)).map((n) => `${n} in "${s}"`));
}

// --- negative control: the reported mismatch is caught, the aligned steps are not ---
{
  const item = { question: "53 − 16 = ?", answers: ["37"] };
  const lesson = lessonFor(item);
  const old = ["Split 16 into 10 and 6.", "53 − 10 = 43", "43 − 6 = 37"];
  assert.ok(strayNumbers(item, lesson, old).length > 0, "the old borrowing steps (53 − 10 = 43) are caught");
  assert.deepEqual(strayNumbers(item, lesson, planSteps(parseColumns(item.question))), [], "plan steps agree with the chips");
  const planted = planSteps(parseColumns(item.question)).map((s) => s.replace("13 − 6", "14 − 6"));
  assert.ok(strayNumbers(item, lesson, planted).length > 0, "a planted wrong regrouped digit is caught");
}

// --- per-operation: steps, chips and column boxes come from one regrouping plan ---
let columnChecks = 0;
for (let s = 0; s < 4000; s += 1) {
  const rng = seededRandom(s + 1);
  const big = 10 ** (1 + Math.floor(rng() * 5));
  const a = Math.floor(rng() * big);
  const b = Math.floor(rng() * big);
  const op = rng() < 0.5 ? "+" : "−";
  const [x, y] = op === "−" && a < b ? [b, a] : [a, b];
  const spec = parseColumns(`${x} ${op} ${y} = ?`);
  if (!spec) continue;
  const plan = regroupPlan(spec);
  // The stacked boxes the student fills hold exactly the plan's regrouped digits and answer digits.
  const w = expectations(columnSpec(op, [String(x), String(y)]));
  for (let c = 0; c < w.width; c += 1) {
    const i = w.width - 1 - c;
    if (op === "−") {
      const top = Number(String(x).padStart(w.width, "0")[c]);
      assert.equal(w.regroup[c], plan.before[i] !== top ? String(plan.before[i]) : "", `${x} − ${y} regroup box ${c}`);
    } else if (c > 0) assert.equal(w.carryInto[c - 1], plan.events.some((e) => e.from === i) ? 1 : 0, `${x} + ${y} carry box ${c}`);
    assert.equal(w.result[c], plan.result[i], `${x} ${op} ${y} answer box ${c}`);
  }
  // Each regrouping the steps name is one the chips show, in the same order.
  const lesson = lessonFor({ question: `${x} ${op} ${y} = ?`, answers: [String(op === "+" ? x + y : x - y)] });
  if (lesson?.engine.id === "place") {
    const ids = framesOf(lesson, "main").map((f) => f.id).filter((id) => /^(trade|break)/.test(id));
    assert.equal(ids.length, plan.events.length, `${x} ${op} ${y}: one picture per regrouping`);
    const named = planSteps(spec, plan).join(" ").match(/\b[Tt]rade \d/g) || [];
    assert.equal(named.length, plan.events.length, `${x} ${op} ${y}: the steps name every trade the chips show`);
  }
  columnChecks += 1;
}

// --- every skill: 50 items, the explanation's numbers against the model's ---
let items = 0;
let compared = 0;
let factItems = 0;
const stray = [];
for (const g of GRADES)
  for (const raw of g.skills) {
    const skill = { ...raw, grade: g.grade };
    for (let n = 0; n < 50; n += 1) {
      const rng = seededRandom(n * 977 + g.grade * 31 + 7);
      const item = n % 4 === 3 ? generateProblem(skill, rng) : adaptiveProblem(skill, rng, n % 4);
      items += 1;
      const lesson = lessonFor(item);
      if (!lesson?.modeled || !(item.steps || []).length) continue;
      // A one-digit fact (9 + 6, 13 − 6 is not one) keeps its fact strategy (make a ten, count on, count back):
      // the K–2 fact lessons teach those strategies by name. Counted, not compared.
      if (lesson.engine.id === "place" && lesson.spec.A < 10 && lesson.spec.B < 10 && !lesson.spec.d) {
        factItems += 1;
        continue;
      }
      compared += 1;
      for (const s of strayNumbers(item, lesson)) stray.push(`${g.grade}:${raw.id} [${lesson.engine.id}] ${item.question} → ${s}`);
    }
  }
// Known, reviewed gaps (non-arithmetic-algorithm skills whose engine picture uses a different route than the
// bank's steps). Each needs a written reason; an entry that no longer fires FAILS, so the list can only shrink.
const REVIEW = JSON.parse(readFileSync(new URL("./alignment-review.json", import.meta.url), "utf8"));
for (const [key, reason] of Object.entries(REVIEW)) assert.ok(String(reason).length >= 40, `${key}: review reason under 40 characters`);
const bySkill = [...new Set(stray.map((s) => s.split(" ")[0]))];
const open = bySkill.filter((k) => !REVIEW[k]);
const stale = Object.keys(REVIEW).filter((k) => !bySkill.includes(k));
console.log(`alignment: ${items} items, ${compared} with steps and a model compared (${factItems} one-digit fact-strategy items not compared), ${stray.length} mismatches in ${bySkill.length} skills (${bySkill.length - open.length} reviewed, ${open.length} open); column plan checks ${columnChecks}`);
if (open.length) console.log(open.map((k) => stray.find((s) => s.startsWith(`${k} `))).join("\n"));
assert.deepEqual(open, [], "an explanation step states a number its model does not show");
assert.deepEqual(stale, [], "a reviewed skill no longer mismatches: delete its entry");
// The add, subtract, multiply and divide algorithms are never on the review list.
for (const k of Object.keys(REVIEW)) assert.ok(!/^(add|sub|mul|div|multiply|division|multi-digit|facts|decimal-add|decimal-sub)/.test(k.split(":")[1]), `${k}: an arithmetic algorithm may not be excused`);
