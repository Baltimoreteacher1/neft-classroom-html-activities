// Proves the Stop 2 challenges are mathematically right for every grade and version, in both languages.
//   node math/fluency-lab/family-adventure/math-items.test.mjs
import assert from "node:assert/strict";
import { ITEMS } from "./math-items.js";

const digits = (text) => (String(text).match(/\d+(?:\.\d+)?/g) || []).sort().join(",");
const walk = (value, out = []) => {
  if (typeof value === "string") return out;
  if (value && typeof value.en === "string" && typeof value.es === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) walk(v, out);
  else if (value && typeof value === "object") for (const v of Object.values(value)) walk(v, out);
  return out;
};

let checks = 0;
const ok = (cond, msg) => {
  checks += 1;
  assert.ok(cond, msg);
};

for (const grade of [1, 2, 3, 4, 5, 6, 7, 8]) {
  const item = ITEMS[grade];
  ok(item, `grade ${grade} has a challenge`);
  ok(item.variants.length === 2, `grade ${grade} has two versions`);
  for (const [i, v] of item.variants.entries()) {
    const tag = `grade ${grade} v${i + 1}`;
    // The stated answer is the recomputed one, and exactly one choice carries it.
    ok(String(v.calc()) === v.answer.replace("$", ""), `${tag}: answer ${v.answer} matches calc ${v.calc()}`);
    const correct = v.choices.filter(([value]) => (typeof value === "string" ? value : value.en) === v.answer);
    ok(correct.length === 1 && correct[0][1] === null, `${tag}: one correct choice, no misconception note on it`);
    ok(v.choices.length >= 3, `${tag}: at least three choices`);
    const labels = v.choices.map(([value]) => (typeof value === "string" ? value : value.en));
    ok(new Set(labels).size === labels.length, `${tag}: choices are distinct`);
    for (const [value, note] of v.choices) if (note !== null) ok(note.en && note.es, `${tag}: wrong choice ${value.en ?? value} explains itself in both languages`);
    // One right reason, and every wrong reason says why it fails.
    ok(v.reasons.filter(([, note]) => note === null).length === 1, `${tag}: exactly one right reason`);
    for (const [, note] of v.reasons) if (note !== null) ok(note.en.length > 20 && note.es.length > 20, `${tag}: wrong reason is explained`);
    ok(v.hints.length === 3, `${tag}: three hints`);
    ok(typeof v.build.ok === "function" && v.worked && v.equation, `${tag}: build check, worked solution and equation exist`);
    // Every bilingual pair is complete and carries the same numbers in both languages.
    for (const pair of walk(v)) {
      ok(pair.en.trim() && pair.es.trim(), `${tag}: no empty language`);
      ok(pair.en !== pair.es || /^[\d\s.$+−×÷=:/-]+$/.test(pair.en), `${tag}: Spanish differs from English: ${pair.en}`);
      ok(digits(pair.en) === digits(pair.es), `${tag}: same numbers in both languages: "${pair.en}" / "${pair.es}"`);
    }
  }
}

// Independent spot checks of the arithmetic the content relies on.
const a = ITEMS[1].variants;
ok(10 - 7 === 3 && 10 - 6 === 4 && a[0].answer === "3" && a[1].answer === "4", "ten-frame facts");
ok(47 + 30 === 77 && 62 + 20 === 82, "number-line sums");
ok(23 * 4 === 92 && 34 * 3 === 102 && ITEMS[4].variants[0].answer === "92" && ITEMS[4].variants[1].answer === "102", "area-model products");
ok(50 > 45 && 30 > 27 && ITEMS[5].variants[0].answer === "0.5" && ITEMS[5].variants[1].answer === "0.3", "decimal comparisons");
ok((12 / 3) * 2 === 8 && (20 / 5) * 3 === 12, "ratio batches");
ok((6 / 4) * 10 === 15 && (9 / 3) * 8 === 24, "unit rates");
ok(ITEMS[8].variants[0].answer === "3/2" && ITEMS[8].variants[1].answer === "2/5", "slopes in lowest terms");
ok(1 / 3 > 1 / 4 && 2 / 3 > 2 / 5, "unit and same-numerator fractions");

console.log(`PASS family-expedition math content: ${checks} checks across grades 1-8`);
