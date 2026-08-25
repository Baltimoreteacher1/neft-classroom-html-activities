#!/usr/bin/env node
/**
 * Author `misconceptionTags` onto multiple-choice practice items.
 *
 * WHY THIS EXISTS
 * ---------------
 * `reports/misconception-coverage.md` measured the problem: 258 of 3,228
 * practice items (8%) could name a specific misconception, and 36 of 64 core
 * lessons could diagnose nothing at all. Everything downstream of a diagnosis —
 * the misconception heatmap, the class pulse, small-group routing, the adaptive
 * step-down in `engine/core/small-group-adaptive.js` — is already built and
 * shipped. It is starved of input, not of features.
 *
 * The audit also identified why the runtime predictor cannot close the gap:
 * it infers an error by re-computing arithmetic it can SEE in the stem, and
 * 1,409 of 1,758 multiple-choice items are prose word problems. That is a
 * structural limit, not a tuning problem. `detectMisconception()` checks an
 * authored `item.misconceptionTags[choiceIndex]` FIRST and trusts it over any
 * prediction, so authored tags are the only path that reaches prose items.
 *
 * WHERE THE TAGS COME FROM (and why this is not invention)
 * -------------------------------------------------------
 * Every one of the 1,758 multiple-choice items already carries `choiceFeedback`
 * — a per-distractor sentence, written by the teacher, that names the error the
 * student just made ("You have the dividend and divisor reversed."). That prose
 * is already shown to students. This script does not decide what a distractor
 * means; it makes the existing, already-shipped statement machine-readable.
 *
 * Two independent signals are computed per distractor:
 *
 *   A. NUMERIC — find the unique (a, op, b) over the numbers written in the
 *      stem that reproduces the correct answer, then hand that expression to
 *      the shipped predictor and see which error it says this distractor is.
 *      Uniqueness is required: if two different expressions both land on the
 *      correct answer, the stem is ambiguous and no claim is made.
 *
 *   B. PROSE — match the authored `choiceFeedback` against a curated pattern
 *      table. Patterns are deliberately narrow; a sentence that does not
 *      clearly name one taxonomy entry yields nothing.
 *
 * When both signals fire and AGREE, the tag is written with high confidence.
 * When only one fires, it is written. When they CONTRADICT, nothing is written
 * and the item is listed in the report — a contradiction means either the
 * feedback was copy-pasted onto the wrong item or the distractor is not what
 * the author thought, and both are content bugs a human should look at rather
 * than something a script should silently pick a winner for.
 *
 * SAFETY
 * ------
 * - Idempotent. An existing non-null tag is never overwritten.
 * - The correct choice is never tagged (a right answer diagnoses nothing).
 * - Only ids that exist in the shipped taxonomy are emitted, so a tag can
 *   never resolve to nothing at runtime.
 * - `--check` writes nothing and exits non-zero if anything is untagged that
 *   this script would tag, so the gate can be wired into `npm run validate`.
 *
 * Usage:
 *   node scripts/author-misconception-tags.mjs           # write tags + report
 *   node scripts/author-misconception-tags.mjs --check   # report only
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MISCONCEPTIONS, predictions } from "../engine/core/misconceptions.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const REPORTS = join(ROOT, "reports");
const TIERS = ["approaching", "onLevel", "extending", "optional"];
const CHECK = process.argv.includes("--check");
/** --sample prints every prose-derived tag next to the sentence it came from,
 *  so the pattern table can be spot-audited by a person rather than trusted. */
const SAMPLE = process.argv.includes("--sample");
/** --unmatched lists authored feedback no pattern reads yet, most common first. */
const UNMATCHED = process.argv.includes("--unmatched");
const unmatched = new Map();
const sampled = [];

/* ------------------------------------------------------------------ numbers */

/** Parse a choice/operand into a value. Accepts "3/4", "-2.5", "$12", "40%". */
function valueOf(text) {
  const s = String(text ?? "").trim();
  const frac = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  if (!/^-?\$?\d[\d,]*(?:\.\d+)?%?$/.test(s)) return null;
  const n = Number(s.replace(/[$,%,]/g, "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Every number written in a stem, fractions kept whole ("3/4", not 3 and 4). */
function stemNumbers(stem) {
  const out = [];
  const re = /(-?\d+)\s*\/\s*(\d+)|(-?\d+(?:\.\d+)?)/g;
  let m;
  while ((m = re.exec(String(stem ?? "")))) {
    if (m[1] != null) {
      const d = Number(m[2]);
      if (d !== 0) out.push({ text: `${m[1]}/${m[2]}`, value: Number(m[1]) / d });
    } else {
      out.push({ text: m[3], value: Number(m[3]) });
    }
  }
  return out;
}

const near = (a, b) => a != null && b != null && Math.abs(a - b) < 1e-9;
const OP_SYMBOL = { "+": "+", "-": "-", "*": "×", "/": "÷" };

function applyOp(a, b, op) {
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "*") return a * b;
  return b === 0 ? null : a / b;
}

/**
 * The one binary expression over the stem's numbers that yields `correct`.
 *
 * Returns null when zero or MORE THAN ONE expression works. The ambiguity
 * guard is the whole point: on a stem carrying many numbers, some pair will
 * hit the answer by coincidence, and a coincidence is not evidence about what
 * the student was asked to do.
 */
function inferExpression(stem, correct) {
  if (correct == null || !Number.isFinite(correct)) return null;
  const ns = stemNumbers(stem);
  // Below 2 there is nothing to combine; above 8 the coincidence rate makes
  // even a "unique" hit untrustworthy.
  if (ns.length < 2 || ns.length > 8) return null;
  const hits = new Map();
  for (let i = 0; i < ns.length; i++) {
    for (let j = 0; j < ns.length; j++) {
      if (i === j) continue;
      for (const op of ["+", "-", "*", "/"]) {
        const v = applyOp(ns[i].value, ns[j].value, op);
        if (near(v, correct))
          hits.set(`${ns[i].text}${op}${ns[j].text}`, { a: ns[i], b: ns[j], op });
      }
    }
  }
  return hits.size === 1 ? [...hits.values()][0] : null;
}

/** Signal A: what the shipped predictor says this distractor is. */
function numericTag(item, choiceIndex, correct) {
  const distractor = valueOf(item.choices[choiceIndex]);
  if (distractor == null || near(distractor, correct)) return null;
  const expr = inferExpression(item.stem || item.title || "", correct);
  if (!expr) return null;
  // Re-express the prose stem as the arithmetic the predictor can read. The
  // predictor is the shipped one, so this path can never disagree with what
  // the runtime would conclude for an equivalent symbolic stem.
  const symbolic = { ...item, stem: `${expr.a.text} ${OP_SYMBOL[expr.op]} ${expr.b.text}` };
  const hits = new Set();
  for (const p of predictions(symbolic, correct)) {
    if (near(p.value, correct)) continue; // proves nothing about their thinking
    if (near(p.value, distractor)) hits.add(p.id);
  }
  return hits.size === 1 ? [...hits][0] : null;
}

/* -------------------------------------------------------------------- prose */

/**
 * Curated feedback-prose → taxonomy patterns.
 *
 * Each pattern must name ONE error unambiguously in the language this
 * curriculum actually uses (drawn from the 1,401 distinct authored feedback
 * strings in the bank). Patterns are tried in order and the first match wins,
 * so more specific errors are listed above the generic operation swaps.
 */
const PROSE_PATTERNS = [
  // --- fractions -----------------------------------------------------------
  [
    /multiply by (?:its |the )?reciprocal|without inverting|flip the (?:divisor|second fraction)/i,
    "fraction-no-reciprocal",
  ],
  [/straight across/i, "fraction-straight-across-division"],
  [
    /add(?:ed)? the denominators|denominators (?:do not|don't) get added/i,
    "fraction-added-denominators",
  ],
  [/divide by the fraction, not by its denominator/i, "fraction-no-reciprocal"],

  // --- geometry / measurement ---------------------------------------------
  [
    /forgot (?:the|to take the) half|without the (?:½|1\/2)|skips the (?:½|half)|not base \+ height|is half of that|multiply by ½/i,
    "geom-triangle-area-no-half",
  ],
  [/add(?:ing|ed)? the dimensions|volume multiplies all edges/i, "geom-volume-added-dimensions"],
  // Surface area vs volume is NOT the area/perimeter swap — different pair of
  // quantities, different repair — so it is matched first and kept separate.
  // "square units, not cubic" is the tell; "square units, not plain units" is
  // the area/perimeter one below.
  // The claim is "you computed VOLUME when SURFACE AREA was asked", so the
  // sentence must contrast the two. Bare "that's the volume" also appears on
  // solve-for-height items ("that's the volume given, not the height"), and
  // bare "six faces" appears on miscounted-faces items ("a cube net has six
  // faces, not four") — neither is this error.
  [
    /square units, not cubic|not cubic units|(?:that'?s|that is) the volume[^.]*surface area|volume calculation[^.]*surface area|surface area needs the sum of all six face/i,
    "geom-surface-area-as-volume",
  ],
  [
    /(?:area|perimeter) (?:and|vs\.?) (?:perimeter|area)|square units, not (?:plain )?units|measures? (?:a )?(?:distance|length)(?:[^.]*)but area/i,
    "measure-area-perimeter-swap",
  ],

  // --- ratio / rate --------------------------------------------------------
  [
    /order (?:matters|got flipped|swapped|has to stay)|flipped the ratio|what is named first should be first/i,
    "ratio-inverted",
  ],
  [
    // ratio-scaled-additively. Anchored on sentences that coach the FACTOR,
    // because that is what the author writes when the distractor stepped both
    // parts up by the same amount instead. A bare "multiply" is not enough —
    // most ratio feedback says that for reasons unrelated to this error.
    /scale both numbers by the same factor|multiply both (?:parts|numbers|terms) by the same|re-?check how many times you need to (?:multiply|scale)|check if that'?s the right scale factor|add(?:ed|ing)? the same (?:number|amount) to both/i,
    "ratio-scaled-additively",
  ],
  [
    // ratio-as-difference. The distractor is one number where a comparison was
    // required — the author states it as "not their sum" / "not the ratio".
    /a ratio compares two amounts, not their (?:sum|difference)|that'?s the difference(?: between them)?,? not the ratio/i,
    "ratio-as-difference",
  ],
  [
    // stat-mean-vs-median. Deliberately narrow: only sentences that name the
    // swap between the two measures of centre. "Did you order them first?" is a
    // median-procedure slip and is left untagged — see the note below.
    // `is median always the lowest` and `median is the middle—with N values`
    // were tried here and REJECTED after reading their distractors. Both sit on
    // choices that are the WRONG POSITION in the ordered list (the smallest
    // value; the 3rd of 7 where the median is the 4th), never the mean — 2-12's
    // set averages 6.86 and the offered choice is 5. Picking the wrong position
    // is a median-procedure slip, and telling that student "you used the mean"
    // would describe an operation they did not perform.
    /don'?t add all values and divide—find the middle|add the numbers first—does \d+ equal the sum divided by|the line is always the middle value, not an average|the line shows center—but mean is a different measure|with an even count, take the average of the two middle|the two middle values are \d+ and \d+|is the MEAN — you added all five values/i,
    "stat-mean-vs-median",
  ],
  [
    // stat-histogram-bin-misread. Bin membership and bar-height/scale reading.
    // Distribution SHAPE (skew, symmetry) matches none of these on purpose.
    /that count sweeps in values from outside the interval|only numbers from \d+ through \d+ belong in this bin|did you count correctly which values fall in|not all values fit in that interval|which bar is tallest|there'?s no zero shown—count from the data given|add all frequencies|that total leaves out part of the data/i,
    "stat-histogram-bin-misread",
  ],
  [
    // Not a new family: these belong to the existing outlier entry. The author
    // states them as a CHOICE between measures ("which resists the outlier"),
    // which the previous pattern — written for "the outlier pulls it" — missed.
    /which measure (?:resists|shows typical performance better)|both measures exist, but which resists|is mode about a typical game when there'?s an outlier|the mean is pulled higher by \d+|mode shows most common—but doesn'?t handle the outlier/i,
    "stat-mean-skewed-by-outlier",
  ],
  // NOTE: a sentence merely MENTIONING "unit rate" is usually coaching toward
  // the method ("Find the unit rate, then use it for 12 minutes"), not a claim
  // that the student answered with a total. Only the diagnosis form counts.
  [
    /(?:that is|that'?s) the total[^.]*not (?:the )?(?:unit rate|one|a single)|for all[^.]*together, not|not the amount in one|cost per ONE|comes from dividing, not adding|earn for \d+ hours, not/i,
    "rate-not-per-one",
  ],

  // --- percent -------------------------------------------------------------
  // "Move the decimal two places" is conversion coaching that fits a correct
  // student as well as a confused one, so it is not a trigger.
  [
    /percent as a (?:plain|whole) number|means \d+\/100|off by a factor of 100/i,
    "percent-used-as-whole-number",
  ],

  // --- decimals ------------------------------------------------------------
  [
    /digits (?:are|here are) right[^.]*decimal|where is the decimal point|line up the decimal point|decimal point (?:moved|landed|still has to move)|count the decimal places|no decimal point placed|factor of 10/i,
    "decimal-place-value",
  ],
  [
    // Column-arithmetic prose. The 4.x lessons carry ~40 distractors whose
    // feedback names a regrouping/borrowing slip by the COLUMN it happened in
    // ("Recheck the tenths column: 5 tenths + 7 tenths + 8 tenths"). That is a
    // place-value error stated in place-value words; the existing pattern only
    // read sentences that used the phrase "decimal point".
    /(?:tenths|hundredths) column|stack the decimal points|regroups?[^.]{0,20}whole ten tenths|digits look swapped[^.]*(?:tenths|hundredths)|subtract each column in its own place/i,
    "decimal-place-value",
  ],
  [
    // Long-division quotient digits landing in the wrong place. "12 × 480 =
    // 5,760. Check where each digit of your quotient lands." A wrong-sized
    // quotient is the same place-value error the decimal items name, stated
    // over whole numbers. Kept separate so the intent stays readable.
    /place value is off|missing a whole place value|quotient needs (?:two|three|four) digits|where each digit of your quotient lands|keep each digit in its correct place|reverses the digits of the quotient/i,
    "decimal-place-value",
  ],

  // --- expressions ---------------------------------------------------------
  [
    /multiplied the base by the exponent|exponent (?:means|tells).*how many times|expand it once/i,
    "exponent-as-multiplication",
  ],
  // "left to right" on its own also describes reading a number line or a
  // commutative-property comparison, so it is not sufficient by itself.
  [
    /order of operations|multiply before adding|evaluate .* first, then add/i,
    "order-of-operations-left-to-right",
  ],
  // 6-14 states this error two ways the original pattern could not read, and
  // both are claims about what the student DID rather than coaching: "the 3 was
  // copied down unchanged" and "Did you only multiply 6 by n?". The bare
  // instruction "Distribute 6 to both terms inside the parentheses" is
  // deliberately NOT here — it fits a correct student as well as a confused one,
  // and would fire on every distributive item in the unit.
  [
    /(?:touches|multiply) BOTH terms|only the first term|copied down unchanged|did you only multiply|only multiplied the first/i,
    "algebra-distributive-partial",
  ],

  // --- statistics ----------------------------------------------------------
  // "Did you forget to divide by the count of numbers?" names the omission that
  // IS this error. Bare "Did you divide by the number of values (4)?" is left
  // out on purpose — it is the method restated as a question, and it appears on
  // items where the student's answer was wrong for other reasons.
  //
  // "Don't add all values and divide — find the middle two values" was tried
  // here and REMOVED: that is a median item, and a student who averaged did not
  // sum-instead-of-average, they averaged when the middle was asked. Tagging it
  // would have told them "that is the total of the data, not its average" —
  // false about what they actually did. Naming the wrong error is worse than
  // naming none, and the taxonomy has no median entry to route it to.
  [
    /added the data|sum(?:med)? (?:the )?(?:data|values) instead|that is the total, not the (?:mean|average)|forget to divide by the (?:count|number)/i,
    "stat-summed-instead-of-averaged",
  ],

  // --- equations -----------------------------------------------------------
  // Claim forms only. "Undo the addition by subtracting it from both sides" is
  // an instruction that fits a correct student too, so the trigger is the
  // sentence that names what the STUDENT's number actually was.
  [
    /is undone by (?:addition|subtraction|multiplication|division)|does not undo a (?:multiplication|division|addition|subtraction)|the operation that undoes it is|the inverse operation is|multiplying (?:by \d+ )?a second time|multiplying again moves you|subtraction undoes addition, but/i,
    "equation-not-inverse-operation",
  ],
  [
    /already showing in the equation|that is the (?:total after|amount being (?:added|subtracted)|number \w+ is divided by|divisor, not the solution)/i,
    "equation-answered-with-given-number",
  ],

  // --- inequalities --------------------------------------------------------
  // Three tags, and the order matters: direction is tested before inclusion,
  // because "leaves 3 out and shades the smaller side" names BOTH and the
  // shading is the more actionable half. Bare "Not quite. Subtract 6 from both
  // sides" is excluded everywhere — that is the method, not a diagnosis.
  [
    /symbol (?:changed direction|turned around|flipped|was reversed)|the symbol points the wrong way|boundary (?:number )?is (?:right|correct), but the (?:inequality )?symbol/i,
    "inequality-direction-flipped",
  ],
  [
    /this shades the (?:values|numbers) (?:below|above)|shaded toward the smaller|shades the (?:smaller|larger) side|fills in \d+ and shades/i,
    "inequality-graph-direction",
  ],
  [
    /does not include \d+, so the circle stays open|includes \d+, so the circle should be filled|lets the \w+ be exactly|leaves \d+ out\b/i,
    "inequality-boundary-inclusion",
  ],

  // --- statistics ----------------------------------------------------------
  // Deliberately narrow, and question forms are excluded throughout. "Both
  // measures exist, but which resists the outlier?" and "Did you divide by the
  // number of values (4)?" are coaching prompts that appear on items whose
  // answers were wrong for other reasons; only the declarative claim counts.
  //
  // Two statistics errors are deliberately NOT tagged here because the taxonomy
  // has no honest home for them: reading the wrong histogram bin ("5 is less
  // than 10—which bar is tallest?") and misreading distribution shape (skew and
  // symmetry). Both are real and repeated; neither is this tag.
  [
    /IQR is Q3 − Q1 only|IQR only uses the quartiles|but IQR is different|the range must be at least as large as the IQR|IQR is a difference, so subtract/i,
    "stat-range-for-iqr",
  ],
  [
    // `says nothing about how many` and `describes only the middle half` were
    // tried here and REJECTED by --sample. Both come from sentences about what
    // the IQR does not tell you ("The IQR says nothing about how many students
    // are in a class"; "…it says nothing about the highest score"). Those are
    // real errors — reading a sample size or a maximum off an IQR — but neither
    // is a student swapping a center for a spread, and the repair is different.
    // Tagging them would have put the wrong sentence in front of those students.
    /is a measure of center, not of spread|also not a measure of spread|is a spread —|median ignores how far apart/i,
    "stat-center-vs-spread",
  ],
  [
    // The 8.x MAD/IQR items state the same swap from the other direction: the
    // student reached for an average when the question asked which data set is
    // more consistent. "Same average doesn't tell you consistency—MAD does."
    // Deliberately anchored on the consistency/variation claim; a bare mention
    // of MAD or IQR is not enough, because most of those sentences are correct
    // coaching about how to compute one.
    /(?:MAD|IQR) (?:tells|is always about|directly measures) consistency|(?:Bigger|Smaller) (?:MAD|IQR) (?:means|doesn'?t mean)|(?:average|mean) doesn'?t tell you consistency|it means more variation/i,
    "stat-center-vs-spread",
  ],
  [
    /outlier pulls it (?:too high|down)|the outlier pulls (?:the mean|it)/i,
    "stat-mean-skewed-by-outlier",
  ],
  [
    /compare the frequencies, not the (?:score )?ranges|that interval holds the highest (?:scores|values), but|count frequencies or find the highest value/i,
    "stat-frequency-vs-value",
  ],

  // --- coordinates ---------------------------------------------------------
  // Every alternative here is a CLAIM that the two numbers were used in the
  // wrong order, AND every one carries coordinate context.
  //
  // The context requirement is not decoration. A bare "traded places" was tried
  // first and --sample caught it firing on two other units: 6-6's commutative
  // property item ("no parentheses moved, but the two numbers traded places" —
  // the student picked the wrong property) and 9-3's expression item ("the 5 and
  // the 2 traded places … the 2 is the coefficient attached to x"). Both are
  // real errors; neither is a coordinate swap, and tagging them would have told
  // those students their x and y were backwards on a question with no plane in
  // it.
  //
  // Deliberately excluded: "Quadrant I is where x is positive and y is positive"
  // (quadrant identification, a different error with no taxonomy home yet) and
  // bare "check the x-coordinate" (method coaching that fits a correct student).
  [
    /swapped the x and y|coordinates traded places|first number is the horizontal|x-coordinate tells you how far horizontal|first number controls horizontal|reflecting never swaps|reversed the coordinates|coordinates (?:are )?(?:reversed|backward)/i,
    "coord-xy-swapped",
  ],

  // --- signs ---------------------------------------------------------------
  // "check the sign" is quadrant-identification coaching far more often than it
  // is a dropped negative, so it is deliberately not a trigger.
  [
    /lost the negative|dropped the (?:negative|minus) sign|forgot the (?:negative|minus)/i,
    "sign-dropped",
  ],
  [
    // Absolute deviation reported as a signed value. "The deviation is
    // negative; absolute deviation is the positive version." The student kept
    // the sign the absolute value was there to remove — the same dropped-sign
    // machinery, one step later in the MAD computation.
    /deviation is negative[;,] absolute deviation|[Aa]bsolute means positive/i,
    "sign-dropped",
  ],

  // --- generic operation swaps (last: the specific errors above win) --------
  [
    /dividend and divisor (?:are )?(?:revers|backward|swapped)|numbers backward|whole (?:goes|should come) first|dividend .* divisor order/i,
    "op-reversed-division",
  ],
  [/subtract(?:ed)? in the wrong order|reversed the subtraction/i, "op-reversed-subtraction"],
  [
    /that'?s multiplication|multiplies .* instead of dividing|multiplied .* instead of dividing|try multiplying instead/i,
    "op-multiplied-instead-of-divided",
  ],
  // The measurement-model phrasings this curriculum uses for the same error.
  // "Division asks 'how many fit', not multiplication" is a direct statement
  // that the student multiplied — it is not the coaching form ("find the unit
  // rate first"), which stays excluded.
  [
    /asks '?how many[^']*'?,? not multiplication|not the right operation\. division|uses the wrong operation\. division|"divided" means division, not multiplication/i,
    "op-multiplied-instead-of-divided",
  ],
  // "That adds 60 + 4 instead of multiplying" is the same claim as "did you add
  // … instead of multiplying", just in the declarative voice this curriculum
  // uses more often. 6-5 states it as a contrast with the word "product", which
  // is what that lesson is actually testing.
  [
    /"times" means multiply, not add|did you add .* instead of multiplying|that adds [^.]*instead of multiplying|adding [^.]*is not the same as [^.]*product|formula multiplies|means multiply, not add/i,
    "op-added-instead-of-multiplied",
  ],
  // "The two numbers got multiplied" appears on BOTH add- and subtract-based
  // equation items, and the taxonomy only has an add variant — so matching it
  // would mislabel every subtraction case. Explicit add language only.
  [/"plus" means add, not multiply|means add, not multiply/i, "op-multiplied-instead-of-added"],
  [
    /divided when .* multipl|means multiply, not divide|that divides [^.]*instead of multiplying/i,
    "op-divided-instead-of-multiplied",
  ],
];

/**
 * Does this tag even make sense for this item?
 *
 * The prose signal trusts `choiceFeedback`, and that trust breaks when the
 * feedback was copy-pasted from a neighbouring item. Real case: 2-3's
 * "What is the reciprocal of 3/5?" carries the division-item feedback
 * ("You have the dividend and divisor backward"), which is meaningless there —
 * and tagging it shipped a diagnosis claiming the student reversed a division
 * they were never asked to perform.
 *
 * An `op-*` tag asserts the student applied the WRONG OPERATION to two
 * operands. That claim is only coherent if the stem actually presents two
 * numbers to combine. A one-number stem ("the reciprocal of 3/5", "what is 40%
 * of it") cannot support it, whatever the feedback says. This is a floor, not a
 * full coherence check: it rejects the class of mismatch that is provably
 * impossible rather than trying to judge whether prose fits a stem.
 */
function tagIsPossible(item, id) {
  if (!id.startsWith("op-")) return true;
  // Two operands written as digits in the stem ("8 quarts … 4/5 of a quart").
  if (stemNumbers(item.stem || item.title || "").length >= 2) return true;
  // …or an operation the student picks between, which is how the equation-
  // writing items work: 7-1 asks "Which equation represents 'Three times a
  // number equals 21'?" and offers `n + 3 = 21` / `n / 3 = 21`. Its operand is
  // the WORD "three", so a digit count alone wrongly called those impossible —
  // and "added when the problem multiplies" is exactly right there.
  // A SPACED operator or an equals sign — never a bare "/", which is the
  // fraction bar in choices like "5/3" and would wave everything through.
  return (item.choices || []).some((c) => /(?:\s[+\-×÷*/]\s)|=/.test(String(c)));
}

/** Signal B: what the authored feedback for this distractor says the error is. */
function proseTag(item, choiceIndex) {
  const fb = Array.isArray(item.choiceFeedback) ? item.choiceFeedback[choiceIndex] : null;
  const text = typeof fb === "string" ? fb.trim() : "";
  if (!text) return null;
  // --unmatched drives authoring: the pattern table is the only lever that
  // reaches prose word problems, so the question that matters is which
  // already-written feedback it still cannot read. Recorded before matching so
  // a string that matches nothing is counted exactly once.
  if (UNMATCHED && !PROSE_PATTERNS.some(([p]) => p.test(text))) {
    unmatched.set(text, (unmatched.get(text) || 0) + 1);
  }
  for (const [pattern, id] of PROSE_PATTERNS) {
    if (!pattern.test(text)) continue;
    if (!MISCONCEPTIONS[id]) return null;
    if (!tagIsPossible(item, id)) {
      incoherent.push({
        lesson: item.__lessonId,
        stem: item.stem || item.title || "",
        choice: item.choices?.[choiceIndex],
        tag: id,
        text,
      });
      return null;
    }
    return id;
  }
  return null;
}

/* --------------------------------------------------------------------- main */

function practiceGroups(config) {
  const p = config.practice || {};
  return TIERS.map((tier) => [tier, p[tier]]).filter(([, list]) => Array.isArray(list));
}

const lessonIds = readdirSync(LESSONS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
  .map((d) => d.name)
  .filter((id) => existsSync(join(LESSONS, id, "config.json")))
  .sort();

const stats = {
  lessonsTouched: 0,
  itemsTagged: 0,
  choicesTagged: 0,
  bySignal: { agree: 0, numericOnly: 0, proseOnly: 0 },
  byTag: new Map(),
};
const conflicts = [];
/* Feedback prose that names an error the item cannot possibly show — the
   copy-pasted-feedback class. Reported so the CONTENT gets fixed. */
const incoherent = [];
/* Impossible tags found already written and removed by the repair pass. */
const repaired = [];

for (const id of lessonIds) {
  const file = join(LESSONS, id, "config.json");
  let config;
  let raw;
  try {
    raw = readFileSync(file, "utf8");
    config = JSON.parse(raw);
  } catch {
    continue;
  }

  let changed = false;
  for (const [, list] of practiceGroups(config)) {
    for (const item of list) {
      if (!item || typeof item !== "object" || !Array.isArray(item.choices)) continue;
      item.__lessonId = id; // transient, stripped before write
      const correct = valueOf(item.choices[item.correctIndex]);
      const existing = Array.isArray(item.misconceptionTags) ? item.misconceptionTags : null;
      const tags = item.choices.map((_, i) => (existing ? (existing[i] ?? null) : null));
      let itemChanged = false;

      for (let i = 0; i < item.choices.length; i++) {
        if (i === item.correctIndex) continue;
        if (tags[i]) continue; // already authored — ground truth, leave it alone

        const a = numericTag(item, i, correct);
        const b = proseTag(item, i);

        // Known aliasing, not a contradiction: on a fraction-division item
        // "multiplied instead of dividing" and "divided without inverting" are
        // the SAME arithmetic (see the long note in engine/core/misconceptions.js),
        // so the two signals routinely name the same wrong answer differently.
        // The engine already resolves this by letting the fraction-specific
        // label win; mirror that here rather than discarding the item.
        const FRACTION_ALIASES = new Set([
          "op-multiplied-instead-of-divided",
          "op-reversed-division",
        ]);
        if (a && b && a !== b && b === "fraction-no-reciprocal" && FRACTION_ALIASES.has(a)) {
          tags[i] = b;
          itemChanged = true;
          stats.choicesTagged += 1;
          stats.bySignal.agree += 1;
          stats.byTag.set(b, (stats.byTag.get(b) || 0) + 1);
          continue;
        }
        if (a && b && a !== b && a === "fraction-no-reciprocal" && FRACTION_ALIASES.has(b)) {
          tags[i] = a;
          itemChanged = true;
          stats.choicesTagged += 1;
          stats.bySignal.agree += 1;
          stats.byTag.set(a, (stats.byTag.get(a) || 0) + 1);
          continue;
        }

        if (a && b && a !== b) {
          conflicts.push({
            lesson: id,
            stem: item.stem || item.title || "",
            choice: item.choices[i],
            numeric: a,
            prose: b,
          });
          continue;
        }
        const tag = a || b;
        if (!tag) continue;

        if (SAMPLE && !a) sampled.push({ tag, text: item.choiceFeedback?.[i], lesson: id });

        tags[i] = tag;
        itemChanged = true;
        stats.choicesTagged += 1;
        stats.bySignal[a && b ? "agree" : a ? "numericOnly" : "proseOnly"] += 1;
        stats.byTag.set(tag, (stats.byTag.get(tag) || 0) + 1);
      }

      // Repair pass. The possibility guard was added AFTER a first run had
      // already written tags, so tags this script can now prove are impossible
      // are still sitting in configs — 2-3's reciprocal item claimed a reversed
      // division. A wrong diagnosis is worse than none: it routes a student to
      // the wrong clinic and pollutes the heatmap. Removing them is not
      // second-guessing an author, because the guard only rejects claims the
      // item structurally cannot support.
      for (let i = 0; i < tags.length; i++) {
        if (!tags[i] || tagIsPossible(item, tags[i])) continue;
        repaired.push({
          lesson: id,
          stem: item.stem || item.title || "",
          choice: item.choices[i],
          tag: tags[i],
        });
        tags[i] = null;
        itemChanged = true;
      }

      delete item.__lessonId; // transient — never serialise it
      if (itemChanged) {
        item.misconceptionTags = tags.some(Boolean) ? tags : undefined;
        if (!tags.some(Boolean)) delete item.misconceptionTags;
        stats.itemsTagged += 1;
        changed = true;
      }
    }
  }

  if (changed) {
    stats.lessonsTouched += 1;
    // Match the repo's existing config formatting (2-space, trailing newline)
    // so the diff is tags only and never a whole-file reflow.
    if (!CHECK) writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
  }
}

/* ------------------------------------------------------------------- report */

const lines = [
  "# Misconception tagging — making authored distractor feedback machine-readable",
  "",
  `Generated by \`scripts/author-misconception-tags.mjs\` · ${lessonIds.length} lessons`,
  "",
  "## What ran",
  "",
  `- **${stats.choicesTagged}** distractors tagged across **${stats.itemsTagged}** items in **${stats.lessonsTouched}** lessons.`,
  `- Both signals agreed: **${stats.bySignal.agree}**`,
  `- Numeric verification only: **${stats.bySignal.numericOnly}**`,
  `- Authored feedback prose only: **${stats.bySignal.proseOnly}**`,
  `- Contradictions (left untagged, listed below): **${conflicts.length}**`,
  "",
  "## Tags written",
  "",
  "| Tag | Distractors |",
  "| --- | ---: |",
  ...[...stats.byTag].sort((a, b) => b[1] - a[1]).map(([t, n]) => `| ${t} | ${n} |`),
  "",
];

if (repaired.length) {
  lines.push(
    "## Removed — the item cannot support this claim",
    "",
    "An `op-*` tag asserts the student applied the wrong OPERATION to two",
    "operands. On a stem with fewer than two numbers that claim is impossible,",
    "whatever the authored feedback says. These were almost certainly caused by",
    "feedback copy-pasted from a neighbouring item — **fix the feedback**, which",
    "students are still being shown.",
    "",
    "| Lesson | Stem | Distractor | Removed tag |",
    "| --- | --- | --- | --- |",
    ...repaired.map(
      (r) =>
        `| ${r.lesson} | ${r.stem.slice(0, 70).replace(/\|/g, "\\|")} | \`${r.choice}\` | ${r.tag} |`,
    ),
    "",
  );
}

if (conflicts.length) {
  lines.push(
    "## Contradictions — a human should look at these",
    "",
    "The distractor's VALUE says one error; the sentence the student is already",
    "shown says a different one. Usually that means the feedback was copy-pasted",
    "from a neighbouring item. Nothing was tagged here.",
    "",
    "| Lesson | Distractor | Value says | Feedback says |",
    "| --- | --- | --- | --- |",
    ...conflicts
      .slice(0, 60)
      .map((c) => `| ${c.lesson} | \`${c.choice}\` | ${c.numeric} | ${c.prose} |`),
    "",
  );
}

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "misconception-tagging.md"), lines.join("\n"));

console.log(
  `misconception tagging: ${stats.choicesTagged} distractors · ${stats.itemsTagged} items · ${stats.lessonsTouched} lessons · ${conflicts.length} contradictions · ${incoherent.length} rejected as impossible · ${repaired.length} repaired`,
);
console.log("→ reports/misconception-tagging.md");

if (UNMATCHED) {
  const rows = [...unmatched].sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((sum, [, n]) => sum + n, 0);
  for (const [text, n] of rows.slice(0, 120)) console.log(`${n}\t${text}`);
  console.log(`\n${rows.length} distinct unmatched strings · ${total} distractors`);
}

if (SAMPLE) {
  const seen = new Set();
  for (const s of sampled) {
    const key = `${s.tag}::${s.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    console.log(`\n[${s.tag}] (${s.lesson})\n  ${s.text}`);
  }
  console.log(`\n${seen.size} distinct prose→tag pairs`);
}

if (CHECK && stats.choicesTagged > 0) {
  console.error(
    `\n${stats.choicesTagged} distractors could be tagged but are not. Run: node scripts/author-misconception-tags.mjs`,
  );
  process.exit(1);
}
