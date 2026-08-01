/* =============================================================================
 * The Forge — on-demand lesson generation (Cloudflare Pages Function)
 * -----------------------------------------------------------------------------
 * A teacher sees on the curriculum map that the class is failing a standard with
 * a named misconception tag, presses "Build the fix", and ~40 seconds later a
 * REAL, RUNNING lesson exists at a shareable URL. That works because this repo's
 * lesson engine is entirely config-driven: engine/core/lesson-renderer.js boots
 * from a JSON config, so generating a valid config IS generating a lesson.
 *
 * Routes:
 *   POST /api/forge                 (teacher key required)
 *     body { standard, tag?, focus?, difficulty?: support|core|stretch, section? }
 *     -> { ok, id, config, meta:{ standard, tag, model, generatedAt, attempts } }
 *     -> 400 bad-request / unknown-standard / unknown-tag
 *     -> 401 unauthorized · 422 invalid-config (with errors[]) · 503 not-configured
 *   GET  /api/forge?id=<id>         (NO auth — students open the shared link)
 *     -> { ok, id, config, meta } · 404 { ok:false, error:"not-found" }
 *   GET  /api/forge?list=1          (teacher key required)
 *     -> { ok, count, lessons:[{ id, standard, tag, title, created_at }] }  (50)
 *   OPTIONS -> 204
 *
 * Conventions are copied deliberately, not reinvented:
 *   - Anthropic Messages API call shape, CLAUDE_URL/version constants and the
 *     "never surface the upstream body" error mapping come from
 *     functions/api/tutor/[[path]].js.
 *   - Teacher auth (env.TEACHER_KEY, ?key= or x-teacher-key, 503 when unset /
 *     401 when wrong), the D1 `env.DB` binding, the idempotent CREATE TABLE and
 *     the JSON envelope come from functions/api/misconception-heatmap.js.
 *
 * QUALITY GATE: every generated config is validated hard before it is stored.
 * A config that leaks the answer in a hint, ships vague distractor feedback, or
 * fakes the Spanish is REJECTED — retried once with the errors fed back, then
 * returned as a 422. An invalid config is never stored and never served.
 * `validateForgeConfig` is exported so tools/validate-forge.mjs can prove it.
 *
 * Pages Functions cannot read repo files at runtime, so the slice of
 * data/curriculum-nervous-system.json the prompt needs (standard label +
 * fullText, prerequisite chain with its `why` sentences, misconception label +
 * watchFor) is inlined below. Regenerate it from that file if the graph changes.
 * ========================================================================== */

import {
  collectStrings,
  containsTerm,
  escapeRe,
  isStr,
  validateForgeConfig,
} from "../_lib/forge-validate.js";

// Re-exported so tools/validate-forge.mjs and any future caller can keep
// importing the gate from the endpoint that enforces it.
export { validateForgeConfig };

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-teacher-key",
  "Cache-Control": "no-store",
};

// Anthropic Messages API (same constants as the tutor proxy).
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_VERSION = "2023-06-01";
const PRIMARY_MODEL = "claude-opus-5";
const FALLBACK_MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 16000;

const DIFFICULTIES = new Set(["support", "core", "stretch"]);
// The gate's own constants (practice count, allowed explore types, the vague- and
// answer-leak patterns) live with the gate in functions/_lib/forge-validate.js.
// Keeping a second copy here is how the rules and their enforcement drift apart.

/* ── Inlined nervous-system slice ─────────────────────────────────────────── */
// GENERATED from data/curriculum-nervous-system.json (nodes, edges, misconceptions,
// strengths). Pages Functions cannot read repo files at runtime, so the slice the
// prompt needs — every standard id + label + full text, the prerequisite chain with
// its `why` sentences, and every misconception label + watch-for — is inlined here.
//
// It is a JSON string, not an object literal, for one reason: a code formatter would
// explode 109 compact entries into ~650 lines and re-explode them on every edit
// (biome-ignore comments are not honoured by every formatter in this toolchain).
// Inside a template literal the shape survives, one entry per line, still diffable.
// Short keys: l = label, f = full standard text, d = domain, m = misconception tags,
// s = strength / standards, w = watch-for. Re-inline this block if the graph changes.
const GRAPH = JSON.parse(`{
  "standards": {
    "6.AT.1": {"l":"Understand the concept of a ratio; describe a ratio relationship.","f":"Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities.","d":"Algebraic Thinking","m":["ratio-inverted"]},
    "6.AT.11": {"l":"Represent relationships between dependent and independent variables.","d":"Algebraic Thinking","m":[]},
    "6.AT.2": {"l":"Solve unit rate problems including unit pricing and constant speed.","f":"Understand the concept of a unit rate a/b associated with a ratio a:b with b ≠ 0, and use rate language in the context of a ratio relationship.","d":"Algebraic Thinking","m":["op-multiplied-instead-of-divided","op-reversed-division","rate-not-per-one"]},
    "6.AT.3": {"l":"Use ratio and rate reasoning to solve real-world problems.","f":"Use ratio and rate reasoning to solve real-world and mathematical problems.","d":"Algebraic Thinking","m":["op-divided-instead-of-multiplied"]},
    "6.AT.3a": {"l":"Make tables of equivalent ratios; plot on the coordinate plane.","f":"Make tables of equivalent ratios relating quantities with whole-number measurements, find missing values in the tables, and plot the pairs of values on the coordinate plane.","d":"Algebraic Thinking","m":[]},
    "6.AT.3c": {"l":"Use ratio reasoning to convert measurement units.","f":"Use ratio reasoning to convert measurement units; manipulate and transform units appropriately when multiplying or dividing quantities.","d":"Algebraic Thinking","m":[]},
    "6.AT.4": {"l":"Find a percent of a quantity; solve percent problems.","f":"Find a percent of a quantity as a rate per 100; solve problems involving finding the whole, given a part and the percent.","d":"Algebraic Thinking","m":["percent-scale-off-by-100","percent-used-as-whole-number"]},
    "6.AT.5": {"l":"Write and evaluate numerical expressions with whole-number exponents.","f":"Write and evaluate numerical expressions involving whole-number exponents.","d":"Algebraic Thinking","m":["exponent-as-multiplication","order-of-operations-left-to-right"]},
    "6.AT.6": {"l":"Write, read, and evaluate expressions with letters for numbers.","d":"Algebraic Thinking","m":[]},
    "6.AT.6a": {"l":"Write expressions for verbal descriptions.","f":"Write expressions that record operations with numbers and with letters standing for numbers.","d":"Algebraic Thinking","m":["op-added-instead-of-multiplied","op-multiplied-instead-of-added","op-reversed-subtraction"]},
    "6.AT.6b": {"l":"Identify parts of an expression (terms, factors, coefficients).","d":"Algebraic Thinking","m":[]},
    "6.AT.6c": {"l":"Evaluate expressions at specific values; use formulas.","f":"Evaluate expressions at specific values of their variables, including expressions that arise from formulas used in real-world problems.","d":"Algebraic Thinking","m":["order-of-operations-left-to-right"]},
    "6.AT.7": {"l":"Apply properties to generate equivalent expressions.","f":"Apply the properties of operations to generate equivalent expressions.","d":"Algebraic Thinking","m":[]},
    "6.AT.8": {"l":"Use variables to represent numbers; write expressions for problems.","f":"Understand solving an equation or inequality as a process of answering which values make it true; use substitution to determine whether a given number makes an equation or inequality true.","d":"Algebraic Thinking","m":[]},
    "6.AT.9": {"l":"Write inequalities of the form x>c or x<c; represent on number line.","f":"Write an inequality of the form x > c or x < c to represent a constraint or condition; recognize that such inequalities have infinitely many solutions; represent solutions on number line diagrams.","d":"Algebraic Thinking","m":[]},
    "6.DS.1": {"l":"Recognize a statistical question as one that anticipates variability.","f":"Recognize a statistical question as one that anticipates variability in the data related to the question and accounts for it in the answers.","d":"Reasoning with Data & Statistics","m":[]},
    "6.DS.3": {"l":"Understand a data distribution: center, spread, and shape.","f":"Understand that a set of data collected to answer a statistical question has a distribution which can be described by its center, spread, and overall shape.","d":"Reasoning with Data & Statistics","m":[]},
    "6.DS.4": {"l":"Measures of center summarize with one number; variation with one number.","f":"Recognize that a measure of center for a numerical data set summarizes all of its values with a single number, while a measure of variation describes how its values vary with a single number.","d":"Reasoning with Data & Statistics","m":["stat-summed-instead-of-averaged"]},
    "6.DS.5": {"l":"Display data on number lines: dot plots, histograms, box plots.","f":"Display numerical data in plots on a number line, including dot plots, histograms, and box plots.","d":"Reasoning with Data & Statistics","m":[]},
    "6.DS.6": {"l":"Summarize numerical data sets in relation to their context.","d":"Reasoning with Data & Statistics","m":[]},
    "6.DS.6a": {"l":"Report the number of observations.","d":"Reasoning with Data & Statistics","m":[]},
    "6.DS.6b": {"l":"Describe the nature of the attribute and units of measurement.","d":"Reasoning with Data & Statistics","m":[]},
    "6.DS.6c": {"l":"Give measures of center and variability (IQR, MAD); describe pattern.","f":"Summarize numerical data sets by giving quantitative measures of center (median and/or mean) and variability (interquartile range and/or mean absolute deviation).","d":"Reasoning with Data & Statistics","m":[]},
    "6.DS.6d": {"l":"Relate choice of center/variability measure to data shape and context.","f":"Relate the choice of measures of center and variability to the shape of the data distribution and the context in which the data were gathered.","d":"Reasoning with Data & Statistics","m":[]},
    "6.GR.1": {"l":"Area of triangles, quadrilaterals, and polygons by composing/decomposing.","f":"Find the area of right triangles, other triangles, special quadrilaterals, and polygons by composing into rectangles or decomposing into triangles and other shapes.","d":"Geometric Reasoning & Measurement","m":["measure-area-perimeter-swap"]},
    "6.GR.2": {"l":"Volume of right rectangular prisms with fractional edge lengths.","f":"Find the volume of a right rectangular prism with fractional edge lengths; apply the formulas V = l·w·h and V = b·h to find volumes of right rectangular prisms.","d":"Geometric Reasoning & Measurement","m":[]},
    "6.GR.3": {"l":"Draw polygons in the coordinate plane; find side lengths.","d":"Geometric Reasoning & Measurement","m":[]},
    "6.GR.4": {"l":"Represent 3-D figures with nets; find surface area.","f":"Represent three-dimensional figures using nets made up of rectangles and triangles, and use the nets to find the surface area of these figures.","d":"Geometric Reasoning & Measurement","m":[]},
    "6.NOS.1": {"l":"Divide fractions by fractions; interpret quotients.","f":"Interpret and compute quotients of fractions, and solve word problems involving division of fractions by fractions.","d":"Number & Operation Sense","m":["fraction-added-denominators","fraction-no-reciprocal","fraction-straight-across-division"]},
    "6.NOS.2": {"l":"Fluently divide multi-digit numbers (standard algorithm).","f":"Fluently divide multi-digit numbers using the standard algorithm.","d":"Number & Operation Sense","m":["op-reversed-division"]},
    "6.NOS.3": {"l":"Fluently add, subtract, multiply, divide multi-digit decimals.","f":"Fluently add, subtract, multiply, and divide multi-digit decimals using the standard algorithm for each operation.","d":"Number & Operation Sense","m":["decimal-place-value"]},
    "6.NOS.4": {"l":"GCF, LCM, and distributive property factoring.","f":"Find the greatest common factor of two whole numbers ≤ 100 and the least common multiple of two whole numbers ≤ 12. Use the distributive property to express a sum of two whole numbers with a common factor.","d":"Number & Operation Sense","m":["fraction-added-denominators"]},
    "6.NOS.5": {"l":"Understand positive and negative numbers in real-world contexts.","d":"Number & Operation Sense","m":["sign-dropped"]},
    "6.NOS.6": {"l":"Understand a rational number as a point on the number line.","f":"Understand a rational number as a point on the number line; extend number line diagrams and coordinate axes to represent points with negative number coordinates.","d":"Number & Operation Sense","m":[]},
    "6.NOS.6b": {"l":"Position integers and rationals on number line and coordinate plane.","d":"Number & Operation Sense","m":[]},
    "6.NOS.6c": {"l":"Opposite signs of numbers; opposite of the opposite.","d":"Number & Operation Sense","m":["sign-dropped"]},
    "6.NOS.7": {"l":"Signs of ordered pairs; reflections across axes.","f":"Understand signs of numbers in ordered pairs as indicating locations in quadrants of the coordinate plane; recognize that ordered pairs differing only by signs are reflections across one or both axes.","d":"Number & Operation Sense","m":[]},
    "6.NOS.8": {"l":"Understand ordering and absolute value of rational numbers.","f":"Understand ordering and absolute value of rational numbers.","d":"Number & Operation Sense","m":[]},
    "6.NOS.8a": {"l":"Interpret inequality statements about relative position.","d":"Number & Operation Sense","m":[]},
    "6.NOS.8b": {"l":"Write, interpret, and explain ordering statements in context.","d":"Number & Operation Sense","m":[]},
    "6.NOS.8c": {"l":"Distinguish comparisons of absolute value from order statements.","d":"Number & Operation Sense","m":[]},
    "6.NOS.9": {"l":"Solve problems by graphing points in all four quadrants; distance.","f":"Solve real-world and mathematical problems by graphing points in all four quadrants of the coordinate plane; use coordinates and absolute value to find distances.","d":"Number & Operation Sense","m":[]}
  },
  "prereqs": {
    "6.AT.2": [{"from":"6.AT.1","s":"core","why":"A unit rate is a ratio re-expressed per one. Without a stable ratio concept, 'per one' is just an unmotivated division."},{"from":"6.NOS.2","s":"fluency","why":"Finding a unit rate is a division. Shaky multi-digit division shows up as wrong unit rates that are reasoned correctly."}],
    "6.AT.3": [{"from":"6.AT.2","s":"core","why":"Rate reasoning in context is unit-rate thinking applied to a situation."}],
    "6.AT.3a": [{"from":"6.AT.3","s":"core","why":"Equivalent-ratio tables are the organized form of the rate reasoning students do informally first."},{"from":"6.NOS.6b","s":"supporting","why":"Plotting the table on the coordinate plane requires placing ordered pairs."}],
    "6.AT.3c": [{"from":"6.AT.3","s":"core","why":"Unit conversion is a rate applied as a multiplier."}],
    "6.AT.4": [{"from":"6.AT.3","s":"core","why":"Percent is a rate per 100. Students who cannot reason with rates cannot reason with percents."},{"from":"6.NOS.3","s":"fluency","why":"Percent work is decimal work. Place-value slips here read as percent misconceptions but are not."}],
    "6.NOS.3": [{"from":"6.NOS.2","s":"core","why":"The decimal algorithms are the whole-number algorithms with place value tracked."}],
    "6.NOS.1": [{"from":"6.NOS.4","s":"supporting","why":"Common factors are what make a fraction quotient simplifiable and interpretable."}],
    "6.AT.7": [{"from":"6.NOS.4","s":"core","why":"Generating equivalent expressions by factoring IS the distributive property over a common factor."},{"from":"6.AT.6b","s":"core","why":"Equivalence is argued over terms and factors; you cannot rewrite structure you cannot name."},{"from":"6.AT.6c","s":"supporting","why":"Checking equivalence by substitution is the students' first proof of equivalence."}],
    "6.GR.2": [{"from":"6.NOS.1","s":"core","why":"Volume with fractional edge lengths is fraction multiplication in three dimensions."}],
    "6.GR.1": [{"from":"6.NOS.3","s":"fluency","why":"Area of triangles and composed figures requires confident decimal and fraction arithmetic."}],
    "6.GR.4": [{"from":"6.GR.1","s":"core","why":"Surface area from a net is the sum of the face areas; the area work has to be automatic first."}],
    "6.GR.3": [{"from":"6.GR.1","s":"core","why":"Polygons drawn in the plane are still polygons: the area and side-length reasoning transfers."},{"from":"6.NOS.9","s":"core","why":"Drawing polygons in the coordinate plane depends on four-quadrant plotting and distance."}],
    "6.NOS.6": [{"from":"6.NOS.5","s":"core","why":"Negative numbers have to mean something in context before they can be located on a line."}],
    "6.NOS.6b": [{"from":"6.NOS.6","s":"core","why":"Placement on the plane generalizes placement on the line."}],
    "6.NOS.6c": [{"from":"6.NOS.6","s":"core","why":"Opposites are a statement about symmetric position on the number line."}],
    "6.NOS.7": [{"from":"6.NOS.6b","s":"core","why":"Reflections across axes are sign changes on an already-understood ordered pair."}],
    "6.NOS.8": [{"from":"6.NOS.6","s":"core","why":"Ordering rational numbers is reading position on the number line."}],
    "6.NOS.8a": [{"from":"6.NOS.8","s":"core","why":"Interpreting an inequality statement presumes the ordering it asserts."}],
    "6.NOS.8b": [{"from":"6.NOS.8a","s":"core","why":"Explaining an ordering in context is interpretation plus justification."}],
    "6.NOS.8c": [{"from":"6.NOS.8","s":"core","why":"Absolute value is distance from zero on the line students have just learned to order."}],
    "6.NOS.9": [{"from":"6.NOS.7","s":"core","why":"Four-quadrant problem solving needs signed ordered pairs to be secure."},{"from":"6.NOS.8c","s":"supporting","why":"Distance between points on a shared line is an absolute-value idea."}],
    "6.AT.6c": [{"from":"6.AT.5","s":"core","why":"Evaluating expressions requires exponent notation to already be readable."},{"from":"6.AT.6","s":"core","why":"Substituting a value presumes the letter-for-number idea."}],
    "6.AT.6a": [{"from":"6.AT.6","s":"core","why":"Writing an expression from words presumes knowing what an expression is."}],
    "6.AT.6b": [{"from":"6.AT.6","s":"core","why":"Naming terms, factors and coefficients is structural reading of an expression."}],
    "6.AT.8": [{"from":"6.AT.7","s":"core","why":"Solving is finding the value that makes two expressions equivalent."}],
    "6.AT.9": [{"from":"6.AT.8","s":"core","why":"An inequality is the same truth question with a range of answers instead of one."}],
    "6.AT.11": [{"from":"6.AT.8","s":"core","why":"Dependent/independent relationships are equations read as a rule."},{"from":"6.AT.3a","s":"supporting","why":"The ratio table is the first table of a dependent relationship students ever build."},{"from":"6.NOS.6b","s":"supporting","why":"Graphing the relationship requires the coordinate plane."}],
    "6.DS.3": [{"from":"6.DS.1","s":"core","why":"You cannot talk about a distribution until you accept that the question anticipates variability."}],
    "6.DS.4": [{"from":"6.DS.3","s":"core","why":"Center and spread only mean something against the shape of a distribution."},{"from":"6.NOS.3","s":"fluency","why":"The mean is a decimal division. Averaging errors are often arithmetic errors."}],
    "6.DS.5": [{"from":"6.DS.3","s":"core","why":"A dot plot, histogram or box plot is a picture of the distribution."},{"from":"6.NOS.6","s":"supporting","why":"Every one of these displays is built on a number line."}],
    "6.DS.6": [{"from":"6.DS.4","s":"core","why":"Summarizing a data set in context requires the summary measures to exist first."},{"from":"6.DS.5","s":"core","why":"Summary claims are read off the display."}],
    "6.DS.6a": [{"from":"6.DS.6","s":"core","why":"Reporting n is the first move of a full summary."}],
    "6.DS.6b": [{"from":"6.DS.6","s":"core","why":"Naming the attribute and its units is the second move of a full summary."}],
    "6.DS.6c": [{"from":"6.DS.6","s":"core","why":"Reporting center and variability is the third move of a full summary."}],
    "6.DS.6d": [{"from":"6.DS.6c","s":"core","why":"Choosing WHICH measure fits the shape is the judgement that comes after computing both."}]
  },
  "misconceptions": {
    "decimal-place-value": {"l":"Right digits, wrong magnitude","w":"Estimate to the nearest whole first, then count decimal places out loud.","s":["6.NOS.3"]},
    "exponent-as-multiplication": {"l":"Multiplied the base by the exponent","w":"Expand it once — write out every factor before evaluating.","s":["6.AT.5"]},
    "fraction-added-denominators": {"l":"Added the denominators","w":"Return to a bar model — thirds plus fifths cannot become eighths.","s":["6.NOS.1","6.NOS.4"]},
    "fraction-no-reciprocal": {"l":"Divided fractions without inverting","w":"Ask them to check with a whole-number case they already trust.","s":["6.NOS.1"]},
    "fraction-straight-across-division": {"l":"Divided numerators and denominators straight across","w":"Reground division as “how many of these fit into that?”","s":["6.NOS.1"]},
    "measure-area-perimeter-swap": {"l":"Swapped area and perimeter","w":"Ask what the unit should be — units or square units?","s":["6.GR.1"]},
    "op-added-instead-of-multiplied": {"l":"Added when the problem multiplies","w":"Ask what the operation *does* to the quantity before they compute.","s":["6.AT.6a"]},
    "op-divided-instead-of-multiplied": {"l":"Divided when the problem multiplies","w":"Estimate first — should the answer be bigger or smaller than you started?","s":["6.AT.3"]},
    "op-multiplied-instead-of-added": {"l":"Multiplied when the problem adds","w":"Have them restate the problem as a story, then name the operation.","s":["6.AT.6a"]},
    "op-multiplied-instead-of-divided": {"l":"Multiplied when the problem divides","w":"Estimate first — should the answer be bigger or smaller than you started?","s":["6.AT.2"]},
    "op-reversed-division": {"l":"Divided in the wrong order","w":"Ask “what is being split, and into how many?” before they write it.","s":["6.AT.2","6.NOS.2"]},
    "op-reversed-subtraction": {"l":"Subtracted in the wrong order","w":"Anchor both numbers on a number line before subtracting.","s":["6.AT.6a"]},
    "order-of-operations-left-to-right": {"l":"Worked left to right instead of by operation order","w":"Have them circle the operation that must go first, then compute.","s":["6.AT.5","6.AT.6c"]},
    "percent-scale-off-by-100": {"l":"Percent answer off by a factor of 100","w":"Benchmark against 50% and 10% before trusting the number.","s":["6.AT.4"]},
    "percent-used-as-whole-number": {"l":"Used the percent as a plain number","w":"Make them say the percent as “per hundred” out loud.","s":["6.AT.4"]},
    "rate-not-per-one": {"l":"Gave the total instead of the unit rate","w":"Ask “per ONE what?” and make them finish the sentence.","s":["6.AT.2"]},
    "ratio-inverted": {"l":"Flipped the ratio","w":"Have them label both quantities with units before writing the ratio.","s":["6.AT.1"]},
    "sign-dropped": {"l":"Right magnitude, lost the negative sign","w":"Place the answer on a number line — which side of zero?","s":["6.NOS.5","6.NOS.6c"]},
    "stat-summed-instead-of-averaged": {"l":"Added the data set instead of averaging it","w":"Ask whether the answer could be a realistic single value in that set.","s":["6.DS.4"]}
  },
  "strengths": {"core":"The dependent standard is not learnable without this one. Trace here first.","supporting":"Makes the dependent standard much easier; a gap here shows up as slowness and hint use, not as total failure.","fluency":"A computational prerequisite. A gap here looks like careless arithmetic inside otherwise-correct reasoning."}
}`);

const STANDARDS = GRAPH.standards;
// Prerequisite edges: target id -> [{ from, s: strength, why }].
const PREREQS = GRAPH.prereqs;
const MISCONCEPTIONS = GRAPH.misconceptions;
const STRENGTHS = GRAPH.strengths;

/* ── Small helpers ─────────────────────────────────────────────────────────── */

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

function clampStr(v, n) {
  return typeof v === "string" ? v.slice(0, n).trim() : "";
}

function teacherAuthorized(env, request, url) {
  if (!env.TEACHER_KEY) return "not-configured";
  const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
  return key === env.TEACHER_KEY ? "ok" : "unauthorized";
}

// Short, url-safe, unambiguous id (no 0/O/1/l). 10 chars ≈ 51 bits.
function shortId() {
  const alphabet = "23456789abcdefghijkmnpqrstuvwxyz";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

/* ── Prompting ─────────────────────────────────────────────────────────────── */

const SYSTEM_PROMPT = [
  "You are a veteran Grade 6 mathematics curriculum author writing for a LIVE classroom that",
  "will run this lesson tomorrow morning. Real 11-year-olds, many of them multilingual, will",
  "read every word you write. Nothing you produce is a draft or a placeholder.",
  "",
  "You output ONE JSON object and nothing else. No prose before it, no prose after it, no",
  "markdown code fences. The object must parse with JSON.parse on the first try.",
  "",
  "NON-NEGOTIABLE CONTENT RULES:",
  '1. choiceFeedback[correctIndex] is the empty string "". The other three entries must NAME',
  '   THE SPECIFIC ERROR the student made — e.g. "You added the denominators instead of finding',
  '   a common one" — in at least 25 characters. They must NEVER state or hint at the correct',
  '   answer, and must NEVER be vague ("Try again", "Not quite", "Incorrect", "Nope").',
  "2. hints is a 3-step ladder that scaffolds WITHOUT giving the answer: (1) point at what to",
  "   notice, (2) name the operation or model and why it helps, (3) walk the first step only.",
  '   No hint may contain the text of the correct choice or the phrase "the answer is".',
  "3. noticeAndWonder is a curiosity hook ONLY. It must not contain the answer and must not",
  "   contain ANY of the vocabulary terms you list — students meet those words later.",
  "4. Spanish fields (stemEs, explanationEs, hintsEs, termEs, definitionEs) must be real,",
  "   natural Spanish written for a Grade 6 reader. Never copy the English. Never leave blank.",
  "5. Grade 6 reading level. Short sentences. Concrete, real-world, age-appropriate contexts",
  "   with named people, places and prices that a 6th grader recognises.",
  '6. Never use the word "ESOL" anywhere.',
  "7. Every number you write must be arithmetically correct. Check each answer before emitting.",
].join("\n");

function schemaBlock() {
  return `Return EXACTLY this shape (all fields required):

{
  "lessonId": "forge-<short-slug>",          // MUST start with "forge-"
  "standard": "<the exact standard id given above>",
  "title": "<student-facing lesson title>",
  "theme": "<kebab-case theme slug, e.g. sneaker-lab>",
  "themeEmoji": "<one emoji>",
  "contentObjective": "I can ...",
  "languageObjective": "I can explain ... using the words ...",
  "noticeAndWonder": {
    "context": "<2-3 sentence scene, no vocabulary terms, no answer>",
    "noticeStarters": ["I notice ...", "I notice ...", "I notice ..."],
    "wonderStarters": ["I wonder ...", "I wonder ...", "I wonder ..."]
  },
  "vocabulary": [ { "term": "", "termEs": "", "definition": "", "definitionEs": "" } ],  // 3-5
  "launch": {
    "narrative": "<3-5 sentences setting up the theme>",
    "conceptIntro": {
      "heading": "", "intro": "", "keyIdea": "",
      "iDo":  { "title": "Watch me",          "lines": ["", "", ""] },
      "weDo": { "title": "Let's try together","lines": ["", "", ""] },
      "youDo":{ "title": "Now it's your turn","lines": ["", ""] }
    }
  },
  "explore": {
    "type": "drag-sort",
    "instructions": "<what to sort and why>",
    "categories": [ { "id": "kebab-id", "label": "" }, { "id": "kebab-id", "label": "" } ],
    "items": [ { "text": "", "category": "<one of the category ids>" } ],   // 6 cards
    "discourse": { "prompt": "", "sentenceFrame": "___ ... ___", "keywords": ["","",""] }
  },
  "practice": { "optional": [ /* EXACTLY 6 items, ORDERED EASIEST TO HARDEST, each: */
    {
      "type": "multiple-choice",
      "stem": "", "stemEs": "",
      "choices": ["","","",""],              // 4 distinct choices
      "correctIndex": 0,
      "explanation": "", "explanationEs": "",
      "choiceFeedback": ["","","",""],       // index correctIndex is ""
      "hints": ["","",""], "hintsEs": ["","",""],
      "misconceptionTag": "<tag or omit>"
    }
  ] },
  "connect": {
    "scenario": "<a real-world situation that uses this standard>",
    "prompt": "This is like our work because ___ and ___",
    "keywords": ["","",""],
    "check": [ { "stem": "", "choices": ["","","",""], "answer": 0, "explanation": "" } ]
  },
  "reflect": { "exitTicket": {
    "stem": "", "choices": ["","","",""], "correctIndex": 0, "explanation": "",
    "choiceFeedback": ["","","",""], "hints": ["","",""]
  } },
  "timeEstimate": "~45 min"
}`;
}

// The standard's own card: id, label, full standard text, prerequisite chain
// with the `why` sentence for each edge, and the misconceptions it attracts.
function standardBrief(standardId) {
  const node = STANDARDS[standardId];
  const lines = [`STANDARD ${standardId} (${node.d})`, `Short label: ${node.l}`];
  if (node.f) lines.push(`Full text: ${node.f}`);
  const prereqs = PREREQS[standardId] || [];
  if (prereqs.length) {
    lines.push("", "Prerequisite chain (what has to be solid underneath this):");
    for (const p of prereqs) {
      const from = STANDARDS[p.from];
      lines.push(
        `  · ${p.from} — ${from ? from.l : ""} [${p.s}: ${STRENGTHS[p.s] || ""}]`,
        `      why: ${p.why}`,
      );
    }
  }
  const tags = (node.m || []).filter((t) => MISCONCEPTIONS[t]);
  if (tags.length) {
    lines.push("", "Misconceptions this standard attracts:");
    for (const t of tags) {
      lines.push(`  · ${t} — "${MISCONCEPTIONS[t].l}" (watch for: ${MISCONCEPTIONS[t].w})`);
    }
  }
  return lines.join("\n");
}

const DIFFICULTY_NOTE = {
  support:
    "DIFFICULTY: support. Smaller numbers, one step at a time, more concrete objects, heavier " +
    "sentence frames. Every practice item should be reachable by a student who is a year behind.",
  core: "DIFFICULTY: core. On grade level. A mix of one-step and two-step reasoning.",
  stretch:
    "DIFFICULTY: stretch. Multi-step reasoning, less scaffolding in the stems, at least two items " +
    "that require justifying or comparing two strategies. Still Grade 6 content, never Grade 7.",
};

function buildUserPrompt(req, priorErrors) {
  const parts = [standardBrief(req.standard), ""];

  if (req.tag) {
    const m = MISCONCEPTIONS[req.tag];
    parts.push(
      `TARGET MISCONCEPTION: ${req.tag} — "${m.l}"`,
      `What the teacher should watch for: ${m.w}`,
      `The class is failing ${req.standard} in exactly this way. AT LEAST 2 of the 6 practice ` +
        `items must set "misconceptionTag": "${req.tag}", and their distractors must be the ` +
        `answer a student makes when they make THIS error — not random wrong numbers.`,
      "",
    );
  }

  parts.push(DIFFICULTY_NOTE[req.difficulty] || DIFFICULTY_NOTE.core, "");
  if (req.focus) parts.push(`TEACHER'S FOCUS NOTE: ${req.focus}`, "");
  if (req.section) parts.push(`CLASS: ${req.section}`, "");

  parts.push(
    "Write one complete, ready-to-teach re-teach lesson for this standard.",
    schemaBlock(),
    "",
    "Output the JSON object only.",
  );

  if (priorErrors && priorErrors.length) {
    parts.push(
      "",
      "YOUR PREVIOUS ATTEMPT WAS REJECTED BY THE QUALITY GATE. Fix every one of these and",
      "return the whole corrected object:",
      ...priorErrors.map((e) => `  - ${e}`),
    );
  }
  return parts.join("\n");
}

/* ── Model call ────────────────────────────────────────────────────────────── */

// Pull a JSON object out of a model reply that may be fenced or prefaced.
function extractJson(text) {
  let s = String(text || "").trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(s);
  if (fence) s = fence[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch (_e) {
    return null;
  }
}

async function callClaude(env, model, userText) {
  const resp = await fetch(CLAUDE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": CLAUDE_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userText }],
    }),
  });
  if (!resp.ok) {
    // Never surface the upstream body — it can carry account detail.
    return { ok: false, status: resp.status === 429 ? 429 : 502 };
  }
  const data = await resp.json().catch(() => null);
  const text = Array.isArray(data?.content)
    ? data.content
        .filter((b) => b && b.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("")
    : "";
  if (!text.trim()) return { ok: false, status: 502 };
  return { ok: true, text };
}

// One generation attempt against `model`; returns the parsed config + errors.
async function attempt(env, model, req, priorErrors) {
  const out = await callClaude(env, model, buildUserPrompt(req, priorErrors));
  if (!out.ok) return { ok: false, status: out.status };
  const config = extractJson(out.text);
  if (!config)
    return { ok: true, config: null, errors: ["the model did not return parsable JSON"] };
  return {
    ok: true,
    config,
    errors: validateForgeConfig(config, { standard: req.standard, tag: req.tag }),
  };
}

/* ── Storage ───────────────────────────────────────────────────────────────── */

// The engine's graded practice queue reads practice.approaching / onLevel /
// extending (engine/core/adaptive.js createAdaptiveSequence); practice.optional
// only feeds the ungraded "Extra Practice" opt-in at the END of the phase. A
// config carrying just `optional` therefore renders a Practice phase whose only
// content is a "Bonus Activity · Ungraded — Try it / Skip" card, and a student
// who taps Skip practises nothing at all.
//
// So spread the six validated items — which the prompt asks for easiest-first —
// across the three tiers, giving the forged lesson the same adaptive practice,
// tier badges and Level 1/2 selector that an authored lesson has.
// `practice.optional` is left in place: it is part of the documented config
// contract and also powers the end-of-lesson Extra Practice tile.
function withAdaptiveTiers(config) {
  const practice = config.practice;
  const items = practice.optional;
  if (practice.approaching || practice.onLevel || practice.extending) return config;
  return {
    ...config,
    practice: {
      ...practice,
      approaching: items.slice(0, 2),
      onLevel: items.slice(2, 4),
      extending: items.slice(4),
    },
  };
}

async function ensureForgeSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS forged_lessons (
        id          TEXT PRIMARY KEY,
        standard    TEXT,
        tag         TEXT,
        title       TEXT,
        config_json TEXT,
        created_at  TEXT
      )`,
    )
    .run();
}

/* ── Request handling ──────────────────────────────────────────────────────── */

function parseForgeBody(body) {
  if (!body || typeof body !== "object") return { ok: false, error: "bad-payload" };
  const standard = clampStr(body.standard, 24);
  if (!standard) return { ok: false, error: "missing-standard" };
  if (!STANDARDS[standard]) return { ok: false, error: "unknown-standard" };

  const tag = clampStr(body.tag, 60);
  if (tag && !MISCONCEPTIONS[tag]) return { ok: false, error: "unknown-tag" };

  const rawDifficulty = clampStr(body.difficulty, 16) || "core";
  const difficulty = DIFFICULTIES.has(rawDifficulty) ? rawDifficulty : "core";

  return {
    ok: true,
    value: {
      standard,
      tag,
      difficulty,
      focus: clampStr(body.focus, 400),
      section: clampStr(body.section, 40),
    },
  };
}

async function handleGet(context, url) {
  const { request, env } = context;

  if (url.searchParams.get("list")) {
    const auth = teacherAuthorized(env, request, url);
    if (auth === "not-configured") {
      return json(
        {
          ok: false,
          error: "not-configured",
          message: "Set the TEACHER_KEY env var on the Pages project to list forged lessons.",
        },
        503,
      );
    }
    if (auth === "unauthorized") return json({ ok: false, error: "unauthorized" }, 401);
    if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);
    await ensureForgeSchema(env.DB);
    const rows = await env.DB.prepare(
      `SELECT id, standard, tag, title, created_at
         FROM forged_lessons ORDER BY created_at DESC LIMIT 50`,
    ).all();
    const lessons = rows.results || [];
    return json({ ok: true, count: lessons.length, lessons });
  }

  // Student path: the shared link. Deliberately unauthenticated.
  const id = clampStr(url.searchParams.get("id"), 40);
  if (!id) return json({ ok: false, error: "missing-id" }, 400);
  if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);
  await ensureForgeSchema(env.DB);
  const row = await env.DB.prepare(
    `SELECT id, standard, tag, title, config_json, created_at
       FROM forged_lessons WHERE id = ? LIMIT 1`,
  )
    .bind(id)
    .first();
  if (!row) return json({ ok: false, error: "not-found" }, 404);

  let config = null;
  try {
    config = JSON.parse(row.config_json);
  } catch (_e) {
    // A row that will not parse is a corrupt row, not a missing one — but it is
    // useless to a student either way, and we never serve a broken lesson.
    return json({ ok: false, error: "corrupt-config" }, 500);
  }
  return json({
    ok: true,
    id: row.id,
    config,
    meta: {
      standard: row.standard || "",
      tag: row.tag || "",
      title: row.title || "",
      generatedAt: row.created_at || "",
    },
  });
}

async function handlePost(context, url) {
  const { request, env } = context;

  const auth = teacherAuthorized(env, request, url);
  if (auth === "not-configured") {
    return json(
      {
        ok: false,
        error: "not-configured",
        message: "Set the TEACHER_KEY env var on the Pages project to enable the Forge.",
      },
      503,
    );
  }
  if (auth === "unauthorized") return json({ ok: false, error: "unauthorized" }, 401);

  if (!env.ANTHROPIC_API_KEY) {
    return json(
      {
        ok: false,
        error: "ai-not-configured",
        message: "AI generation is not configured on this deployment (ANTHROPIC_API_KEY missing).",
      },
      503,
    );
  }
  if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);

  const parsed = parseForgeBody(await request.json().catch(() => null));
  if (!parsed.ok) {
    const body = { ok: false, error: parsed.error };
    if (parsed.error === "unknown-standard") body.standards = Object.keys(STANDARDS);
    if (parsed.error === "unknown-tag") body.tags = Object.keys(MISCONCEPTIONS);
    return json(body, 400);
  }
  const req = parsed.value;

  let attempts = 0;
  let model = PRIMARY_MODEL;
  let result = null;
  try {
    result = await attempt(env, model, req, null);
    attempts += 1;
    if (!result.ok) {
      // Primary model unavailable/erroring -> fall back, still attempt #1's work.
      model = FALLBACK_MODEL;
      result = await attempt(env, model, req, null);
      attempts += 1;
    }
    if (result.ok && result.errors.length) {
      // Exactly one repair pass, with the gate's complaints fed back verbatim.
      const retry = await attempt(env, model, req, result.errors);
      attempts += 1;
      if (retry.ok) result = retry;
    }
  } catch (_err) {
    return json({ ok: false, error: "server-error" }, 502);
  }

  if (!result || !result.ok) {
    return json({ ok: false, error: "generation-unavailable" }, result?.status === 429 ? 429 : 502);
  }
  if (result.errors.length) {
    return json(
      {
        ok: false,
        error: "invalid-config",
        message: "The generated lesson failed the quality gate and was not saved.",
        errors: result.errors,
        meta: { standard: req.standard, tag: req.tag, model, attempts },
      },
      422,
    );
  }

  const config = withAdaptiveTiers(result.config);
  const id = shortId();
  const createdAt = new Date().toISOString();
  await ensureForgeSchema(env.DB);
  await env.DB.prepare(
    `INSERT INTO forged_lessons (id, standard, tag, title, config_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      req.standard,
      req.tag || "",
      String(config.title || ""),
      JSON.stringify(config),
      createdAt,
    )
    .run();

  return json({
    ok: true,
    id,
    config,
    meta: { standard: req.standard, tag: req.tag, model, generatedAt: createdAt, attempts },
  });
}

export async function onRequest(context) {
  const { request } = context;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });

  try {
    if (method === "GET") return await handleGet(context, url);
    if (method === "POST") return await handlePost(context, url);
  } catch (err) {
    return json({ ok: false, error: "server-error", message: String(err) }, 500);
  }
  return json({ ok: false, error: "method-not-allowed" }, 405);
}
