// The sequential Learn It panel prints extracted mathematics LARGE on a
// teaching page, so a wrong extraction is worse than none — a student trusts
// the big equation over the sentence. These tests pin the guards (each one is
// a defect that actually shipped in the generator's equivalent extractor)
// and then sweep every core lesson: every decidable equation the model
// extracts from authored conceptIntro lines must be arithmetically TRUE.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { Rat, evaluateExpression } from "../../scripts/lib/rational.mjs";
import {
  extractEquation,
  extractStepMove,
  parseKeyIdea,
  splitGuidedLine,
} from "./learn-step-model.js";

test("parseKeyIdea splits topic / formula / points / example", () => {
  const parsed = parseKeyIdea(
    "Multi-Digit Long Division Algorithm. Formula: Divisor ) Dividend = Quotient R Remainder. " +
      "1. Divide & Multiply: Determine how many times divisor fits; multiply back. " +
      "2. Subtract & Check: Subtract to find difference. " +
      "3. Bring Down: Bring down next digit and repeat. Example: 1,344 ÷ 12 = 112",
  );
  assert.equal(parsed.topic, "Multi-Digit Long Division Algorithm");
  assert.match(parsed.formula, /^Divisor \) Dividend = Quotient R Remainder$/);
  assert.equal(parsed.points.length, 3);
  assert.match(parsed.points[0], /^Divide & Multiply/);
  assert.match(parsed.points[2], /^Bring Down/);
  assert.equal(parsed.example, "1,344 ÷ 12 = 112");
});

test("parseKeyIdea tolerates prose-only key ideas (MPP lessons)", () => {
  const parsed = parseKeyIdea(
    "Mathematical Modeling in Careers & Daily Life. 1. Frame real-world problems mathematically. 2. Collect and analyze data.",
  );
  assert.equal(parsed.formula, "");
  assert.equal(parsed.points.length, 2);
  assert.equal(parsed.topic, "Mathematical Modeling in Careers & Daily Life");
  assert.deepEqual(parseKeyIdea(""), { topic: "", formula: "", points: [], example: "" });
});

test("parseKeyIdea does not read decimals as list markers", () => {
  const parsed = parseKeyIdea("Volume with fractions. Formula: V = l × w × h. 1. Use the 1.5 ft edge. 2. Multiply.");
  assert.equal(parsed.points.length, 2);
  assert.match(parsed.points[0], /1\.5 ft/);
});

test("extractEquation finds the worked-example statement", () => {
  assert.equal(extractEquation("I multiply: 14 × 9 = 126."), "14 × 9 = 126");
  assert.equal(extractEquation("I put in the numbers: A = 14 × 9."), "A = 14 × 9");
  assert.equal(extractEquation("Check: 8 × 48 = 384."), "8 × 48 = 384");
  assert.equal(extractEquation("So 3/4 = 75/100 = 0.75 = 75%. All three name the same score."), "3/4 = 75/100 = 0.75 = 75%");
});

test("extractEquation rejects the false-equation traps", () => {
  // "120 divided by 8 = 15" — the visible run "8 = 15" is FALSE arithmetic.
  assert.equal(extractEquation("So 120 divided by 8 = 15 groups."), null);
  // Prose-operator words before the run mean the run is a sentence tail.
  assert.equal(extractEquation("Multiply the base by 9 = the area."), null);
  // Bare products duplicate prose without stating an equation.
  assert.equal(extractEquation("What is 5 × 4?"), null);
  // All-letter runs with one operator are English, not algebra ("I" is a word).
  assert.equal(extractEquation("The area I = measured."), null);
  assert.equal(extractEquation(""), null);
});

test("extractEquation keeps letters-only formulas with two or more operators", () => {
  assert.equal(extractEquation("I write the formula: V = l × w × h."), "V = l × w × h");
});

test("extractEquation reads space-padded lowercase x as multiplication", () => {
  assert.equal(
    extractEquation("I multiply both numbers by 2: 2 x 2 = 4 cups of mix."),
    "2 × 2 = 4",
  );
  assert.equal(extractEquation("Multiply the cost by 3: $5 x 3 = $15."), "$5 × 3 = $15");
  // No spaces → still a coefficient-variable, not an operator.
  assert.equal(extractEquation("I divide both sides by 3: 3x ÷ 3 = 21 ÷ 3."), "3x ÷ 3 = 21 ÷ 3");
});

test("extractEquation keeps decimal coefficients whole", () => {
  // Both shipped: the run started after the decimal point, so students saw a
  // DIFFERENT (and false) equation than the projected slide problem.
  assert.equal(
    extractEquation("Write the percentage statement as an equation, using the decimal form: 0.7v = 26,600."),
    "0.7v = 26,600",
  );
  assert.equal(extractEquation("The order needs 1,000 cars, so substitute: 2.5h = 1,000."), "2.5h = 1,000");
});

test("splitGuidedLine puts the telling behind the question", () => {
  assert.deepEqual(splitGuidedLine("What do we multiply the denominator 5 by to get 100? (20)"), {
    ask: "What do we multiply the denominator 5 by to get 100?",
    tell: "20",
  });
  assert.deepEqual(splitGuidedLine("What is 5 × 4? Yes, 20, so the area is 20 square centimeters."), {
    ask: "What is 5 × 4?",
    tell: "Yes, 20, so the area is 20 square centimeters.",
  });
  assert.deepEqual(splitGuidedLine("Now a smaller parallelogram: base = 5 cm, height = 4 cm."), {
    ask: "Now a smaller parallelogram: base = 5 cm, height = 4 cm.",
    tell: "",
  });
  assert.deepEqual(splitGuidedLine("True?"), { ask: "True?", tell: "" });
});

// ── Fleet sweep: 0 false equations across every core lesson ────────────────
//
// Evaluate every "a = b [= c…]" the extractor returns from authored iDo/weDo
// lines and key ideas. Sides containing variables/words are undecidable and
// are SKIPPED, never failed — the guard here is that no DECIDABLE extracted
// equation is arithmetically false. This is the same audit standard the
// learn.html math strips were held to (226 strips, 0 false).

test("every decidable equation extracted from the 84 core lessons is true", () => {
  const lessonsDir = new URL("../../lessons/", import.meta.url);
  const ids = readdirSync(lessonsDir).filter((d) => /^\d+-\d+$/.test(d));
  assert.ok(ids.length >= 80, `expected the core fleet, found ${ids.length}`);

  let extracted = 0;
  let decidable = 0;
  const falsehoods = [];

  for (const id of ids) {
    let cfg;
    try {
      cfg = JSON.parse(readFileSync(new URL(`${id}/config.json`, lessonsDir), "utf8"));
    } catch {
      continue;
    }
    const ci = (cfg.launch && cfg.launch.conceptIntro) || cfg.conceptIntro || {};
    const lines = []
      .concat(ci.iDo?.lines || [], ci.weDo?.lines || [], ci.youDo?.lines || [])
      .concat(ci.keyIdea ? [ci.keyIdea] : []);
    for (const line of lines) {
      const eq = extractEquation(line);
      if (!eq) continue;
      extracted++;
      const sides = eq.split("=").map((s) => s.trim());
      if (sides.length < 2) continue;
      // Widen decidability: vulgar fractions → (n/d), implicit coefficient
      // multiplication "3(4)" → "3*(4)". Display keeps the authored form.
      const VULGAR = { "½": "(1/2)", "⅓": "(1/3)", "⅔": "(2/3)", "¼": "(1/4)", "¾": "(3/4)", "⅕": "(1/5)", "⅖": "(2/5)", "⅗": "(3/5)", "⅘": "(4/5)", "⅙": "(1/6)", "⅚": "(5/6)", "⅛": "(1/8)", "⅜": "(3/8)", "⅝": "(5/8)", "⅞": "(7/8)" };
      const values = sides.map((s) =>
        evaluateExpression(
          s
            .replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (c) => VULGAR[c] || c)
            .replace(/\$/g, "")
            .replace(/(\d)\s*\(/g, "$1*(")
            .replace(/\)\s*\(/g, ")*("),
        ),
      );
      if (values.some((v) => v === null)) continue; // variables/words → undecidable
      decidable++;
      const first = Rat.from(values[0]);
      if (!values.every((v) => Rat.from(v).eq(first))) {
        falsehoods.push(`${id}: "${line}" → extracted "${eq}"`);
      }
    }
  }

  assert.ok(extracted > 50, `extractor went quiet — only ${extracted} equations found fleet-wide`);
  assert.ok(decidable > 20, `arithmetic audit went quiet — only ${decidable} decidable equations`);
  assert.deepEqual(falsehoods, [], `FALSE equations would print large on a teaching page:\n${falsehoods.join("\n")}`);
});

/* ── extractStepMove ────────────────────────────────────────────────────────
   A move becomes a WORKSPACE a student manipulates, and the workspace tells
   them whether they are right. So a wrongly-read move is worse than a wrongly
   printed equation: it marks a correct answer wrong, or a wrong one right.
   The guard is arithmetic truth, and these tests pin it. */

test("extractStepMove reads a decimal shift the lesson states", () => {
  const move = extractStepMove(
    "STEP 0 — MOVE THE POINT: I move the decimal point 1 place right in the divisor, so 6.3 becomes 63.",
  );
  assert.equal(move.kind, "decimal-shift");
  assert.equal(move.from, "6.3");
  assert.equal(move.to, "63");
  assert.equal(move.places, 1);
  assert.equal(move.direction, "right");
});

test("extractStepMove does not carry sentence punctuation into a number", () => {
  const move = extractStepMove(
    "I must move the dividend the same 1 place right: 18.9 becomes 189, and the point in the quotient goes straight above its new spot.",
  );
  assert.equal(move.to, "189", 'the trailing comma must not reach the workspace as "189,"');
});

test("extractStepMove REFUSES a shift whose numbers do not agree", () => {
  // "5.5 becomes 12" is not 5.5 moved one place. A workspace built on it would
  // tell a student that 55 is wrong and 12 is right.
  assert.equal(extractStepMove("It moves 1 place right so 5.5 becomes 12."), null);
});

test("extractStepMove reads a chained arithmetic move", () => {
  const move = extractStepMove(
    "Its volume is 8 × 3 × 10 = 240 cubic inches, so three large boxes hold 720.",
  );
  assert.equal(move.kind, "arithmetic");
  assert.deepEqual(move.operands, ["8", "3", "10"]);
  assert.deepEqual(move.ops, ["×", "×"]);
  assert.equal(move.result, "240");
});

test("extractStepMove reads an equation a prose lead-in would hide", () => {
  // extractEquation rejects this one (the word "is" before the run); the move
  // scanner accepts it because 12 × 10 really is 120.
  const move = extractStepMove("12 clusters of about 10 is 12 × 10 = 120, so my estimate is 120.");
  assert.equal(move.equation, "12 × 10 = 120");
});

test("extractStepMove REFUSES a false equation", () => {
  assert.equal(extractStepMove("I worked it out and got 7 × 6 = 41."), null);
});

test("extractStepMove REFUSES the bare-equality trap", () => {
  // The "120 divided by 8 = 15" shape must never yield the move "8 = 15":
  // one operator on the left is required, and 8 = 15 is not true anyway.
  const move = extractStepMove("120 divided by 8 = 15 for each group.");
  assert.ok(!move || move.operands.length > 1, `bare equality became a move: ${JSON.stringify(move)}`);
});

test("extractStepMove returns null for prose with no computation", () => {
  assert.equal(extractStepMove("Everyone uses math every day."), null);
  assert.equal(extractStepMove(""), null);
});

test("every move extracted fleet-wide is arithmetically TRUE and traces to its line", () => {
  const LESSONS = new URL("../../lessons/", import.meta.url).pathname;
  const ids = readdirSync(LESSONS).filter((d) => /^\d+-\d+$/.test(d));
  const bad = [];
  let moves = 0;
  let lessonsCovered = 0;

  for (const id of ids) {
    const config = JSON.parse(readFileSync(`${LESSONS}${id}/config.json`, "utf8"));
    const lines = config.launch?.conceptIntro?.iDo?.lines || [];
    let covered = false;
    for (const line of lines) {
      const move = extractStepMove(line);
      if (!move) continue;
      moves++;
      covered = true;
      const flat = String(line).replace(/\s+/g, " ");
      if (move.kind === "decimal-shift") {
        // Both numbers must appear in the line the workspace sits under.
        for (const token of [move.from, move.to]) {
          if (!flat.includes(token)) bad.push(`${id}: "${token}" is not in its own line: ${flat}`);
        }
        const factor = move.direction === "right" ? 10 ** move.places : 10 ** -move.places;
        const from = Number(move.from.replace(/,/g, ""));
        const to = Number(move.to.replace(/,/g, ""));
        if (Math.abs(from * factor - to) > 1e-9) {
          bad.push(`${id}: shift ${move.from}→${move.to} is not ${move.places} place(s)`);
        }
      } else {
        for (const token of [...move.operands, move.result]) {
          if (!flat.includes(token)) bad.push(`${id}: "${token}" is not in its own line: ${flat}`);
        }
        const values = move.operands.map((o) => Number(String(o).replace(/[$,]/g, "")));
        const ops = move.ops.slice();
        const v = values.slice();
        for (let i = 0; i < ops.length; ) {
          if (ops[i] === "×" || ops[i] === "÷") {
            v.splice(i, 2, ops[i] === "×" ? v[i] * v[i + 1] : v[i] / v[i + 1]);
            ops.splice(i, 1);
          } else i++;
        }
        let acc = v[0];
        for (let i = 0; i < ops.length; i++) acc = ops[i] === "+" ? acc + v[i + 1] : acc - v[i + 1];
        const want = Number(String(move.result).replace(/[$,]/g, ""));
        if (Math.abs(acc - want) > Math.abs(want) * 1e-9 + 1e-9) {
          bad.push(`${id}: FALSE move ${move.equation}`);
        }
      }
    }
    if (covered) lessonsCovered++;
  }

  // A detector that has quietly stopped firing reports a perfectly clean fleet.
  assert.ok(moves > 40, `move detector went quiet — only ${moves} moves fleet-wide`);
  assert.ok(
    lessonsCovered > 30,
    `move coverage collapsed — only ${lessonsCovered} of ${ids.length} lessons`,
  );
  assert.deepEqual(bad, [], `moves that do not belong to their lesson:\n${bad.join("\n")}`);
});
