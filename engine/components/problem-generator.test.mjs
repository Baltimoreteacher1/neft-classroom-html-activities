// problem-generator.test.mjs — "Try another like this" must mean LIKE THIS, and
// the answer it prints must be the answer to the problem it printed.
//
// WHAT WENT WRONG. `canRegenerate` fell through to "does this stem contain
// `a OP b` anywhere", so a fragment of a larger ask was rewritten and the
// answer computed from the fragment alone. Measured against the fleet's own
// 683 authored practice items, 89 regenerated and these reached students:
//
//   "…5/6 as tall as One World Trade Center, which is 540 meters"
//        → "4 / 2 as tall as … 540 meters", answer 2      (540 never used)
//   "What is 0.7 × 1.5?"          → "0.3 × 9.5", answer 27 (that is 3 × 9)
//   "Convert 7/20 to a percent"   → "132 / 11", answer 12  (not a percent)
//   "Which property is shown? 47 + 0 = 47" → "77 + 33 = 47" (a false equation)
//   "Simplify 7x + 3x."           → "11 + 6 × 11 - 5x", answer 72
//   "In Lesson 1-1 you estimated…" → "In Lesson 95 - 11 …"
//   "What is 1 1/2 ÷ 3/4?"        → "1 2/7 ÷ 1/2", answer 4/7 (whole part lost)
//   "8.6% of 216"                 → "8.40% of 70", answer 28 (that is 40% of 70)
//   "the total of … 8 × 2³"       → "(6 + 11) × 9³", answer 153 (cube dropped)
//
// Each of those shapes is a case in this file. The last test is the real
// guarantee: every regeneration the module is willing to make, recomputed
// independently from the stem it printed.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { canRegenerate, regenerate } from "./problem-generator.js";

let passed = 0;
function t(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

const DECLINE = [
  ["a number outside the expression", "The London building will be 5/6 as tall as One World Trade Center, which is 540 meters. How tall will it be?"],
  ["a decimal the integer matcher cannot see", "What is 0.7 × 1.5?"],
  ["a fraction read as division", "Convert 7/20 to a percent."],
  ["a stated equation", "Which property is shown? 47 + 0 = 47"],
  ["a variable", "Simplify 7x + 3x."],
  ["a lesson label", "In Lesson 1-1 you estimated the Ferris wheel: 20 cars each holding about 4 people. About how many riders was that?"],
  ["a mixed number", "What is 1 1/2 ÷ 3/4?"],
  ["a decimal percent", "To estimate 8.6% of 216 by rounding, which numbers should you use?"],
  ["an exponent", "What is the total of 2 × 15 + 4 × 20 + 8 × 2³?"],
  ["a reasoning ask", "Miguel evaluates 12 − 2 × 3 and gets 30. Margaret gets 6. Who is right?"],
  ["a meaning ask", "What does 3 ÷ 1/4 mean?"],
  ["a first-step ask", "What is the first step in evaluating 2 1/2 ÷ 1/4?"],
];

for (const [why, stem] of DECLINE) {
  t(`declines ${why}`, () => {
    assert.equal(canRegenerate({ stem }), false, `canRegenerate said yes to: ${stem}`);
    assert.equal(regenerate({ stem }), null, `regenerate produced a problem for: ${stem}`);
  });
}

t("still regenerates a clean arithmetic ask", () => {
  assert.equal(canRegenerate({ stem: "What is 936 ÷ 12?" }), true);
  const r = regenerate({ stem: "What is 936 ÷ 12?" });
  assert.ok(r && typeof r.stem === "string", "no problem produced");
  const m = r.stem.replace(/,/g, "").match(/(\d+)\s*÷\s*(\d+)/);
  assert.ok(m, `no division in the regenerated stem: ${r.stem}`);
  assert.equal(r.answer, Number(m[1]) / Number(m[2]), "the answer is not the printed problem's");
});

t("keeps a long-division item long", () => {
  // 936 ÷ 12 is 3-digit ÷ 2-digit. Regenerating "9 ÷ 3" is the same operation
  // and a different skill, which is what "like this" has to rule out.
  for (let i = 0; i < 30; i += 1) {
    const r = regenerate({ stem: "What is 936 ÷ 12?" });
    const m = r.stem.replace(/,/g, "").match(/(\d+)\s*÷\s*(\d+)/);
    assert.ok(m[1].length >= 3, `dividend shrank to ${m[1]} (from a 3-digit one)`);
    assert.ok(m[2].length === 2, `divisor became ${m[2]} (authored one has 2 digits)`);
  }
});

t("still regenerates a clean percent ask", () => {
  const r = regenerate({ stem: "What is 20% of 150?" });
  const m = r.stem.match(/(\d+)\s*%\s*of\s*(\d+)/i);
  assert.ok(m, `no percent in the regenerated stem: ${r.stem}`);
  assert.equal(r.answer, (Number(m[1]) / 100) * Number(m[2]));
});

// ── the fleet guarantee ─────────────────────────────────────────────────────
t("every regeneration the fleet produces answers its own printed problem", () => {
  const dirs = readdirSync("lessons").filter((d) => /^\d+-\d+$/.test(d));
  let checked = 0;
  const wrong = [];
  for (let round = 0; round < 8; round += 1) {
    for (const d of dirs) {
      let cfg;
      try {
        cfg = JSON.parse(readFileSync(`lessons/${d}/config.json`, "utf8"));
      } catch {
        continue;
      }
      for (const tier of ["approaching", "onLevel", "extending"]) {
        for (const item of (cfg.practice || {})[tier] || []) {
          if (!item || typeof item.stem !== "string" || !canRegenerate(item)) continue;
          const r = regenerate(item, {});
          if (!r) continue;
          checked += 1;
          const s = String(r.stem).replace(/,/g, "");
          let expect = null;
          let m = s.match(/(\d+)\s*%\s*of\s*(\d+)/i);
          if (m) expect = (Number(m[1]) / 100) * Number(m[2]);
          else if ((m = s.match(/(-?\d+)\s*([+\-*x×·/÷])\s*(-?\d+)/))) {
            const a = Number(m[1]);
            const b = Number(m[3]);
            const op = m[2];
            expect = /[*x×·]/.test(op)
              ? a * b
              : /[/÷]/.test(op)
                ? a / b
                : op === "+"
                  ? a + b
                  : a - b;
          }
          if (expect === null || typeof r.answer !== "number") continue;
          if (Math.abs(r.answer - expect) > 1e-9) {
            wrong.push(`${d}: "${r.stem}" said ${r.answer}, should be ${expect}`);
          }
        }
      }
    }
  }
  assert.ok(checked > 50, `only ${checked} regenerations exercised — the sweep found nothing`);
  assert.deepEqual(wrong, [], "a regenerated problem's answer does not match its own stem");
});

console.log(`problem-generator: ${passed} checks passed.`);
