# Fluency Lab content bank: authoring brief (Phase 6B)

You are authoring ORIGINAL assessment items for the EduWonderLab Math Fluency Lab (a classroom math site, Grades 1-8, English and Spanish).
Working directory: /Users/joelneft/wt-fl8-p2. Do not touch any other path. Each grade has its own author; write only your grade's files.

## Goal
At least 200 distinct, complete, mathematically correct core items for ONE grade. Quality over quantity: an item that fails validation does not count.
Count only items that pass `node tools/validate-fluency-content.mjs --grade N --allow-rejects`. The validator proves answers with EXACT arithmetic.
Do not copy or closely paraphrase any publisher's problems (Illustrative Mathematics, Reveal Math, IXL, Khan Academy, state tests, etc.). Invent your own contexts and numbers.
No expert review has happened: every item says `provenance: {source: "original", author: "ai-draft", reviewed: false}`.

## Workflow
1. Read `math/fluency-lab/content/ccss-k8.json` (the standards of your grade) and the exemplar files
   `math/fluency-lab/content/items/sample.json` and `sample-more.json` (14 validated items covering mc, numeric, fraction, equation, expression, numberline, graph, match, sort, multi, error, model, application, explain, constructed).
2. Write items in PART FILES of 20-30 items: `math/fluency-lab/content/items/parts/grade-N-partK.json` (a JSON array). Use zero-padded K (part01, part02 ...).
3. After each part: `node tools/merge-fluency-content.mjs N && node tools/validate-fluency-content.mjs --grade N --allow-rejects`. Fix every rejected item (the message says exactly why) by editing the part file, and re-run. Never delete a hard item just to pass; repair it.
4. Keep going until the validator reports >= 200 counted for your grade, with 0 rejected. Then stop and report: counted total, counts by domain, counts by type, counts by DOK, number of conceptual (human-review) items.

## Item schema (all fields required unless marked optional)
{
 "id": "g{N}-{topic-kebab}-{nn}-v1",            // unique; topic 3-40 chars [a-z0-9-]
 "grade": N, "standard": "N.DOM.C.n",             // a real CCSS code of YOUR grade from ccss-k8.json (a/b/c sub-letter suffix allowed)
 "domain": "DOM", "cluster": "C",                  // must match the standard
 "skill": "5:fraction-add" | null,                 // a library skill key from the list below when it clearly matches, else null
 "objective": "...", "concept": "short-kebab-concept",
 "dok": 1|2|3, "difficulty": 1|2|3,               // DOK 4 only for a genuine multi-part investigation with "investigation": true (use at most 2 per grade, or none)
 "representation": one of number, picture, array, number-line, base-ten, fraction-model, tape, double-number-line, ratio-table, balance, tiles, graph, coordinate-plane, table, equation, area-model, geometric-figure, data-display, words, spatial,
 "vocabulary": ["term", ...],
 "type": mc | multi | numeric | fraction | equation | expression | match | sort | numberline | graph | model | error | constructed | explain | application,
 "stem": {"en": "...", "es": "..."},               // Spanish is a real translation, with the same numbers
 "hints": [{"en":"..."},{"en":"..."},{"en":"..."}],   // exactly 3; rung 1 and 2 must NOT state the answer
 "solution": {"steps": ["...","..."], "es": "one-sentence Spanish summary"},
 "scoring": {"method": "exact"|"partial"|"rubric", "points": n},
 "misconceptions": ["id", ...],                    // ids from math/fluency-lab/e8/misconception-library.js when one fits, else []
 "provenance": {"source":"original","author":"ai-draft","reviewed":false},
 "verify": {...}                                    // THE PROOF: see below
 + type-specific fields (see exemplars)
}
Type-specific fields and the proof each needs:
- mc: choices[{id:"A".., text:"12" or {en,es}, value:"12" (numeric choices), why:"targeted feedback for a WRONG choice"}], answer:{correct:"B"}; verify:{key:"expr"}; exactly ONE choice's value equals the key. Every wrong choice needs a `why` naming the likely misconception. 3-5 choices. For a non-computational concept question use verify:{kind:"conceptual", note:"..."} (counts as human-review).
- multi: choices as mc (4-6), answer:{correct:["A","C"]}; verify:{key:"expr"}; the choices whose value equals the key are exactly the keyed ones.
- numeric: answer:{value:"60", unit?:"cm"}; verify:{expr:"80-25%*80"}  (expr must evaluate exactly to answer.value).
- fraction: answer:{value:"7/12", form:"simplified"|"any"}; verify:{expr:"1/3+1/4"}.
- equation: answer:{value:"n = 8"}; verify:{solve:{equation:"7*n=56", var:"n", value:"8"}}.
- expression: answer:{value:"3x + 12"}; verify:{identity:{a:"3*(x+4)", b:"3*x+12", vars:{x:[0,1,2,5,9]}}} (>= 4 sample values).
- numberline: line:{min,max,step} and answer:{point:"3/4"}; the point must lie on a tick; verify:{expr:"3*(1/4)"}.
- graph: grid:{xmin,xmax,ymin,ymax}, answer:{points:[[3,4]]}; verify:{checks:[{expr,equals},...]} proving the coordinates.
- match: pairs:[{left,right}] (>= 3); verify:{checks:[{expr:"3/10", equals:"0.3"}, ...]}.
- sort: bins:[{name:{en,es}, items:[{en,es},...]}] (>= 2 bins, >= 4 items); verify:{checks:[...]} proving membership.
- model: visual:{model:"<id>", params:{...}} using a MathVisualEngine model (see the model list below and math/fluency-lab/e8/models-*.js for each model's params and actions);
  verify:{solution:[actions...], goalFacts:{factName: value}} - the validator RUNS the solution on the real model and compares derive().facts. Only use models that fit the standard.
- error: steps:["...","..."] (a student's work shown in the stem), answer:{errorStep:2} (1-based); verify:{checks:[...]} proving the wrong step is wrong and the right value.
- constructed / explain: rubric:{criteria:[{en,es,points}], sample:{en,es}}; verify:{checks:[...]} for any numbers in the sample answer, or verify:{kind:"conceptual", note:"..."} for pure explanation.
- application: realistic context; answer:{value}; rubric as above; verify:{expr}.
Expression syntax for verify: + - * / ^ (integer power), parentheses, decimals, % postfix (25% = 0.25), functions sqrt (perfect squares only), abs, floor, ceil, min, max, gcd, lcm, round(x,places), mean(a,b,...), variables via "env" or vars. Use * for multiplication, / for division. Use the Unicode minus in stems if you like, but ASCII in verify.

## Distribution targets for your 200 items
- Cover EVERY standard of your grade at least 3 times (major-work standards 6+), spread across all its domains in proportion to the standards.
- Types (approx.): mc 25%, numeric 15%, fraction/equation/expression (where the grade uses them) 10-15%, application 10%, error 6%, model 4% (only where a model fits), match 4%, sort 4%, numberline 4%, graph 3% (grades 3+; in earlier grades use mc with picture-like descriptions), multi 4%, constructed 4%, explain 4%.
- DOK: about 40% DOK 1, 40% DOK 2, 20% DOK 3. Label DOK honestly: simple calculation is DOK 1. DOK 3 needs strategic reasoning (justify, critique, compare methods, non-routine).
- At most 30% of items may be conceptual (verify.kind "conceptual"). Computational types can never be conceptual.
- Contexts: vary widely (measurement, money, time, sports data, geometry, science, design, recipes, transportation, statistics, financial reasoning, coordinates). Keep reading load low enough that language does not hide the math; Grades 1-2 stems <= 25 words; plain words; no idioms.
- Difficulty 1/2/3 spread about 30/45/25.
- No two items may share nearly identical wording: the validator rejects near-duplicates (same words and structure, only numbers changed). Vary the question form, the context, and the mathematical move. Do NOT write template families.
- Misconception-aware distractors: wrong choices should come from real student errors (e.g. adding denominators, additive ratio reasoning, sign errors) with a `why` that coaches.
- Never use purple/violet in any visual description. Kid-safe, neutral contexts only. No brand names.

## Library skills (use as `skill` when it clearly matches, else null) and MathVisualEngine models by grade
Grade 1 skills: 1:count-patterns (Count by 1s, 2s, 5s, and 10s); 1:tens-ones (Tens and ones); 1:compare-100 (Compare numbers within 100); 1:add-10 (Addition facts: sums of 10 or less); 1:subtract-10 (Subtraction facts within 10); 1:make-10 (Make 10); 1:add-20 (Addition facts within 20); 1:missing-addend (Find the missing addend); 1:subtract-20 (Subtraction facts within 20); 1:time (Tell time and find later times); 1:measure-length (Measure length with equal units)
Grade 1 models: tenFrame, numberBond, numberLine, baseTen, hundredsChart, countingCollection, factFamily
Grade 2 skills: 2:facts-20 (Addition facts within 20); 2:sub-facts-20 (Subtraction facts within 20); 2:place-1000 (Place value to 1,000); 2:compare-1000 (Compare three-digit numbers); 2:skip-count (Skip-count patterns); 2:add-100 (Add within 100); 2:subtract-100 (Subtract within 100); 2:add-1000 (Add within 1,000); 2:even-odd (Even and odd numbers); 2:coins (Count mixed coins); 2:interpret-data (Read and compare a data display)
Grade 2 models: tenFrame, numberBond, numberLine, baseTen, hundredsChart, countingCollection, factFamily, array
Grade 3 skills: 3:mul-0-5 (Multiplication facts ×0–5); 3:mul-6-9 (Multiplication facts ×6–9); 3:mul-10-12 (Multiply by multiples of 10); 3:division-facts (Division facts); 3:add-sub-1000 (Add and subtract within 1,000); 3:round (Round to tens and hundreds); 3:fraction-equivalence (Equivalent fractions); 3:fraction-compare (Compare fractions); 3:area (Rectangle area); 3:perimeter (Rectangle perimeter); 3:elapsed-time (Solve time intervals in minutes)
Grade 3 models: numberLine, baseTen, hundredsChart, factFamily, array, areaMultiply, fractionBar, fractionCircle, fractionWall, areaPerimeter, areaDecomp, dotPlot
Grade 4 skills: 4:place-million (Place value to 1,000,000); 4:round-large (Round multi-digit numbers); 4:add-large (Multi-digit addition); 4:subtract-large (Multi-digit subtraction); 4:multiply-1digit (Multiply a three-digit number by a one-digit number); 4:multiply-2digit (Multiply two-digit numbers); 4:division (Whole-number division); 4:factors (Factors and multiples); 4:fraction-equiv (Generate equivalent fractions); 4:fraction-compare (Compare fractions); 4:unit-conversion (Convert within a measurement system)
Grade 4 models: numberLine, baseTen, factFamily, array, areaMultiply, longDivision, fractionBar, fractionCircle, fractionWall, fractionOps, decimalGrid, areaPerimeter, areaDecomp, angleTool
Grade 5 skills: 5:multiply-whole (Multi-digit multiplication); 5:divide-whole (Whole-number division); 5:decimal-place (Decimal place value); 5:decimal-add (Add decimals); 5:decimal-sub (Subtract decimals); 5:decimal-mul (Multiply decimals); 5:fraction-add (Add and subtract fractions); 5:fraction-mul (Multiply fractions); 5:fraction-of (Find a fraction of a whole); 5:unit-fraction-division (Divide unit fractions and whole numbers); 5:volume (Rectangular prism volume)
Grade 5 models: numberLine, areaMultiply, longDivision, fractionBar, fractionCircle, fractionWall, fractionOps, decimalGrid, decimalProduct, functionMachine, areaDecomp, coordinatePlane, prismVolume, dotPlot
Grade 6 skills: 6:gcf (Greatest common factor); 6:lcm (Least common multiple); 6:divide-fractions (Divide fractions); 6:decimal-ops (Multiply and divide decimals); 6:ratios (Equivalent ratios); 6:unit-rates (Unit rates and unit conversions); 6:percent (Percent of a number); 6:evaluate (Evaluate expressions); 6:one-step (Solve one-step equations); 6:integers (Absolute value and the coordinate plane); 6:triangle-area (Find area of triangles and polygons)
Grade 6 models: numberLine, longDivision, fractionBar, fractionOps, decimalGrid, decimalProduct, percentBar, tapeRatio, linearGraph, functionMachine, balanceScale, algebraTiles, integerChips, areaDecomp, triangleArea, coordinatePlane, prismVolume, netSurface, dotPlot, histogram, boxPlot
Grade 7 skills: 7:integer-add (Add and subtract integers); 7:integer-mul (Multiply and divide integers); 7:fraction-ops (Operations with rational numbers); 7:unit-rate (Unit rates with decimals); 7:proportions (Solve proportions); 7:percent-change (Discounts and percent change); 7:scale-drawing (Use scale drawings); 7:equations (Two-step equations); 7:inequalities (Test inequality solutions); 7:circle-area (Circle area fluency); 7:probability (Probability and measures of center)
Grade 7 models: numberLine, fractionOps, percentBar, tapeRatio, linearGraph, functionMachine, balanceScale, algebraTiles, integerChips, angleTool, coordinatePlane, dotPlot, histogram, boxPlot
Grade 8 skills: 8:exponents (Evaluate integer exponents); 8:powers-ten (Powers of ten); 8:square-roots (Perfect square roots); 8:linear-equations (Solve linear equations); 8:slope (Find slope from two points); 8:functions (Evaluate linear functions); 8:systems (Solve simple systems); 8:angle-relations (Solve angle relationship problems); 8:pythagorean (Pythagorean theorem); 8:association (Identify bivariate association); 8:transformations (Coordinate reflections (extension))
Grade 8 models: linearGraph, functionMachine, balanceScale, algebraTiles, angleTool, coordinatePlane, transformation, histogram, boxPlot, scatterPlot


## Validator messages
Run `node tools/validate-fluency-content.mjs --grade N --allow-rejects` to see the first 25 rejected ids with exact reasons. "near-duplicate of X" means rewrite the item with a different context, structure and mathematical move.

## Report (final message)
Your grade, counted total, rejected total (must be 0), counts by domain / type / DOK, number of conceptual items, and anything you could not do.
