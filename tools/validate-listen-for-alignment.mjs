#!/usr/bin/env node
/* =============================================================================
 * validate-listen-for-alignment — a teacher's "listen for" must answer ITS question.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * Every Turn-and-Talk carries a `question` the class discusses and a teacher-only
 * `listenFor` describing a strong answer. When a lesson's launch was re-sourced
 * to the Reveal Math problem, the questions were rewritten and five listen-fors
 * were not, so the teacher was told to listen for an answer to a DIFFERENT
 * problem (found by the 2026-10-08 audit):
 *
 *   3-3  clay recipe (2 baking soda : 1 cornstarch)  → "2:3 becomes 8:12"
 *   3-4  bags of soccer balls                         → "sundaes and ounces of sauce"
 *   3-5  red and blue paint cans                      → "3:5 and 4:7 … milk … cocoa"
 *   2-7  $394.50 for 75 workbooks                     → "6.3 to 63 … 18.9"
 *   2-9  a week of temperatures, mean 79°F            → "Player A is more consistent"
 *
 * Every other gate passed them: the text is well-formed English, teacher-only,
 * and present. Only comparing the listen-for against its own question sees it.
 *
 * THE DETECTOR (narrow on purpose)
 * A listen-for is flagged only when BOTH hold:
 *   1. it makes a SPECIFIC claim its question does not support —
 *        NUMBERS  it cites numbers and the question cites numbers, and none of
 *                 the listen-for's numbers is in the question or one operation
 *                 away from it (a+b, a−b, a×b, a÷b, a reciprocal, or — for a data
 *                 set of 3+ — its sum, count, mean, or a product of three). A
 *                 ratio is the strongest evidence of a scenario, so a single
 *                 ratio ("2:3") whose terms are not in the question is a mismatch
 *                 on its own. Standard codes (6.AT.3a) are not numbers.
 *        NAMES    it names a capitalised person/thing ("Player A") the question
 *                 never mentions;
 *   2. it shares NO context word with the question (stopwords and generic
 *      mathematics vocabulary — ratio, mean, decimal… — excluded, since those
 *      are shared by every question in a lesson and prove nothing).
 * An abstract listen-for ("Listen for a named strategy, not just 'I multiplied'")
 * makes no specific claim and is never flagged: there is nothing in it that can
 * belong to a different problem. Measured on the fixed fleet: 0 findings across
 * every base lesson's Turn-and-Talks; the unfixed fleet reports exactly the five
 * above. All five shipped strings are replayed as self-tests BEFORE the sweep,
 * alongside positive controls that once false-positived during tuning.
 *
 * THE RATCHET is data/listen-for-alignment-review.json: a finding a human has
 * read and judged correct goes there with a reason of 40+ characters; an entry
 * whose finding no longer fires FAILS and must be deleted.
 *
 *   node tools/validate-listen-for-alignment.mjs
 * ========================================================================== */

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LESSONS_DIR } from "./lib/curriculum-source.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REVIEW_PATH = join(ROOT, "data", "listen-for-alignment-review.json");
const BASE_LESSON = /^\d+-\d+$/;

/* ---------- numbers ---------- */

// "one" is excluded: it is a pronoun far more often than a quantity ("one bag").
const WORD_NUMBERS = {
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  twice: 2,
  double: 2,
  doubles: 2,
  triple: 3,
  half: 0.5,
};

function numberTokens(text) {
  const s = String(text ?? "")
    .normalize("NFKC")
    .replace(/\b\d+\.[A-Z]{2,3}\.\d+[a-z]?\b/g, " ") // standard codes: 6.AT.3a
    .replace(/(\d),(\d{3})\b/g, "$1$2")
    .replace(/[−–]/g, "-");
  return (s.match(/\d+(?:\.\d+)?(?:\s*[:/]\s*\d+(?:\.\d+)?)?/g) || []).map((t) =>
    t.replace(/\s+/g, ""),
  );
}

const wordNumbers = (text) =>
  (
    String(text ?? "")
      .toLowerCase()
      .match(/[a-z]+/g) || []
  )
    .filter((w) => w in WORD_NUMBERS)
    .map((w) => String(WORD_NUMBERS[w]));

const tokenValue = (t) => {
  if (t.includes(":")) return null;
  if (t.includes("/")) {
    const [a, b] = t.split("/").map(Number);
    return b ? a / b : null;
  }
  return Number(t);
};
const near = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(a));
const parts = (t) => t.split(/[:/]/);

function oneStepAway(values) {
  const out = new Set(values);
  for (let i = 0; i < values.length; i++) {
    if (values[i]) out.add(1 / values[i]);
    for (let j = 0; j < values.length; j++) {
      if (i === j) continue;
      const a = values[i];
      const b = values[j];
      for (const x of [a + b, a - b, a * b, b ? a / b : Number.NaN])
        if (Number.isFinite(x)) out.add(x);
    }
  }
  if (values.length >= 3) {
    const sum = values.reduce((a, b) => a + b, 0);
    out.add(sum);
    out.add(values.length);
    out.add(sum / values.length);
    for (let i = 0; i < values.length; i++)
      for (let j = i + 1; j < values.length; j++)
        for (let k = j + 1; k < values.length; k++) out.add(values[i] * values[j] * values[k]);
  }
  return [...out];
}

/** true = shared, false = the listen-for's numbers belong elsewhere, null = undecidable. */
export function numbersShared(question, listenFor) {
  const q = [...numberTokens(question), ...wordNumbers(question)];
  const l = numberTokens(listenFor);
  if (!q.length || !l.length) return null;
  const qParts = new Set(q.flatMap(parts));
  const derived = oneStepAway(
    q
      .flatMap((t) => [tokenValue(t), ...parts(t).map(Number)])
      .filter((x) => x != null && Number.isFinite(x)),
  );
  const supported = (t) => {
    if (q.includes(t)) return true;
    if (t.includes(":")) return parts(t).every((p) => qParts.has(p));
    const x = tokenValue(t);
    return x != null && derived.some((d) => near(d, x));
  };
  if (l.some((t) => t.includes(":") && !supported(t))) return false;
  return l.some(supported);
}

/* ---------- words ---------- */

const STOP = new Set(
  "a an the and or but if of to in on at by for with from into than then that this these those it its is are was were be been being do does did can could will would should may might must have has had not no so as about what which who whose when where why how all any both each every few more most other some such only own same too very just also there their they them you your he she his her we our us i me my one two three four five six seven eight nine ten first second third student students strong weak answer answers say says said explain explains recognize recognizes notice notices listen look looks use uses using used find finds name names naming choose chooses think thinks idea ideas way ways make makes made get gets see sees know knows tell tells mean means meaning predict predicts justify because over under after before while again need needs keep keeps keeping stay stays different difference number numbers amount amounts value values total part parts whole per new equal less greater fewer many much question problem work strategy reasoning reason connect compare comparing describe help mention words clear true false right wrong correct happen happens change changes rather instead step steps identify identifies point points rule rules show shows give gives".split(
    " ",
  ),
);
const MATH_WORDS =
  "ratio rate unit table equivalent scale factor multiply multiplied multiplication divide divided division add added addition subtract subtraction sum product quotient fraction decimal percent data mean median mode range spread center centre variability consistent graph plot line equation expression variable pattern relationship quantity quantities measure value set".split(
    " ",
  );
const stem = (w) =>
  w
    .replace(/ies$/, "y")
    .replace(/(es|s)$/, "")
    .slice(0, 6);
const MATH_STEMS = new Set(MATH_WORDS.map(stem));

export function contextWords(text) {
  return new Set(
    (
      String(text ?? "")
        .toLowerCase()
        .normalize("NFKC")
        .replace(/-/g, "")
        .match(/[a-z]+/g) || []
    )
      .filter((w) => w.length >= 3 && !STOP.has(w))
      .map(stem)
      .filter((w) => !MATH_STEMS.has(w)),
  );
}

const NOT_NAMES = new Set([
  "I",
  "A",
  "Student",
  "Students",
  "Listen",
  "Both",
  "Each",
  "When",
  "If",
  "The",
  "They",
  "This",
  "That",
]);

/** Capitalised words that are not sentence-initial: names of people and things. */
export function namedThings(text) {
  const out = [];
  for (const sentence of String(text ?? "").split(/(?<=[.!?:;—])\s+|[()'"“”]/)) {
    for (const word of sentence.trim().split(/\s+/).slice(1)) {
      const w = word.replace(/[^A-Za-z]/g, "");
      if (/^[A-Z][a-z]+$/.test(w) && !NOT_NAMES.has(w)) out.push(w);
    }
  }
  return out;
}

/** The finding for one Turn-and-Talk, or null when its listen-for fits its question. */
export function listenForMismatch(question, listenFor) {
  if (!question || !listenFor) return null;
  const numbers = numbersShared(question, listenFor);
  const flatQuestion = question.toLowerCase().replace(/[^a-z]/g, "");
  const names = namedThings(listenFor).filter((n) => !flatQuestion.includes(n.toLowerCase()));
  if (numbers !== false && !names.length) return null;
  const q = contextWords(question);
  const shared = [...contextWords(listenFor)].filter((w) => q.has(w));
  if (shared.length) return null;
  const why = [];
  if (numbers === false)
    why.push(`numbers ${numberTokens(listenFor).join(", ")} are not in the question`);
  if (names.length) why.push(`names ${names.join(", ")} the question never mentions`);
  return `${why.join("; ")}, and it shares no context word with the question`;
}

/* ---------- self-tests ---------- */

const SHIPPED = [
  [
    "The clay recipe uses 2 cups of baking soda for every 1 cup of cornstarch. If Brian doubles the batch, what happens to each ingredient — and what stays the same?",
    "A strong answer says BOTH quantities are multiplied by the same number (4), so 2:3 becomes 8:12, keeping the ratio equivalent.",
  ],
  [
    "Each bag holds the same number of soccer balls, and the picture shows one bag with 6 balls. How can you use that one bag to find what 6 bags hold?",
    "A strong answer chooses sundaes (x) and ounces of sauce (y), and predicts a straight line because each sundae always needs 2 more ounces.",
  ],
  [
    "Reginald used 3 red and 3 blue cans; Anwar used 2 red and 3 blue. Why is 'who used more blue cans' a different question from 'whose paint is more blue'?",
    "Students recognize that 3:5 and 4:7 have different milk amounts, so a fair comparison needs equal milk (a common amount) or a unit rate (cocoa per 1 oz).",
  ],
  [
    "The order form shows the school paid $394.50 in total for 75 workbooks. What division would tell you the cost of one workbook, and why is it division and not multiplication?",
    "Students explain you slide the decimal point right in the divisor to make it whole (6.3 to 63) and slide the dividend's point right the same number of places, naming 18.9 as the dividend and 6.3 as the divisor.",
  ],
  [
    "The forecast shows seven high temperatures and their mean is 79°F. Which day is farthest from the mean, and what does that tell you about the week?",
    "Students choose Player A as more consistent and recognize that equal means hide different spreads.",
  ],
];

// Correct listen-fors that an earlier version of this detector flagged.
const CONTROLS = [
  // product of the question's numbers
  [
    "When you multiplied 4.5 × 12.60, how did you decide where to put the decimal point in the product?",
    "Students count the decimal places, multiply the digits, then place the point to get $56.70, and use the estimate to confirm placement.",
  ],
  // ratio stated in words in the question
  [
    "The cafeteria wants 3 main dishes for every 2 side dishes. How is this the same kind of thinking as Chef Reyes's ratio?",
    "A strong answer identifies the 3:2 part-to-part ratio and explains that the cafeteria keeps that comparison the same.",
  ],
  // number words
  [
    "Yuzuki can buy three large boxes (240 cubic inches each) or two jumbo boxes (400 cubic inches each). Which option gives more cereal?",
    "A strong answer calculates both totals (720 and 800) and compares them to recommend the jumbo boxes.",
  ],
  // data set: sum and count
  [
    "For the data set 8, 12, 10, 14, talk through how you find the mean.",
    "Students add to 44, divide by 4, and report a mean of 11 while naming why the divisor is 4.",
  ],
  // a general fact, but the context words are shared
  [
    "The triangular garden bed has a base of 12 feet and a height of 8 feet. Which measurement is the height?",
    "Students identify the height as the perpendicular (straight-up, 90-degree) distance from the base to the opposite vertex.",
  ],
  // abstract: no specific claim
  [
    "During practice on Ratio Tables, what strategy did you use when a problem felt tricky?",
    'Listen for students naming a specific strategy tied to 6.AT.3a — not just "I multiplied." They should connect steps to the key idea.',
  ],
  // reciprocal
  [
    "How does 'Keep, Change, Flip' turn 6 ÷ 1/3 into a multiplication problem?",
    "Students correctly flip the divisor to its reciprocal (3) and explain multiplying by the reciprocal gives the same result as dividing.",
  ],
];

function selfTest() {
  for (const [q, lf] of SHIPPED)
    assert.ok(listenForMismatch(q, lf), `shipped mismatch must be caught: ${lf.slice(0, 60)}`);
  for (const [q, lf] of CONTROLS)
    assert.equal(listenForMismatch(q, lf), null, `control must stay quiet: ${lf.slice(0, 60)}`);
  assert.equal(
    numbersShared("no numbers here", "8:12"),
    null,
    "no numbers in the question is undecidable",
  );
  assert.deepEqual(
    numberTokens("tied to 6.AT.3a and 6.DS.4"),
    [],
    "standard codes are not numbers",
  );
}

/* ---------- sweep + ratchet ---------- */

function loadReview() {
  if (!existsSync(REVIEW_PATH)) return [];
  const data = JSON.parse(readFileSync(REVIEW_PATH, "utf8"));
  return Array.isArray(data.reviewed) ? data.reviewed : [];
}

function main() {
  selfTest();
  console.log("validate:listen-for-alignment — self-tests passed");
  const ids = readdirSync(LESSONS_DIR)
    .filter((d) => BASE_LESSON.test(d) && existsSync(join(LESSONS_DIR, d, "config.json")))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const findings = [];
  let checked = 0;
  for (const id of ids) {
    const cfg = JSON.parse(readFileSync(join(LESSONS_DIR, id, "config.json"), "utf8"));
    (cfg.turnAndTalk || []).forEach((t, index) => {
      if (!t?.listenFor || !t?.question) return;
      checked++;
      const why = listenForMismatch(t.question, t.listenFor);
      if (why) findings.push({ lessonId: id, index, phase: t.phase, why, listenFor: t.listenFor });
    });
  }
  const review = loadReview();
  const errors = [];
  for (const r of review) {
    if (typeof r.reason !== "string" || r.reason.trim().length < 40)
      errors.push(`review entry ${r.lessonId} [${r.index}]: reason must be 40+ characters`);
    if (!findings.some((f) => f.lessonId === r.lessonId && f.index === r.index))
      errors.push(
        `review entry ${r.lessonId} [${r.index}] no longer fires — delete it from ${REVIEW_PATH}`,
      );
  }
  for (const f of findings) {
    if (review.some((r) => r.lessonId === f.lessonId && r.index === f.index)) continue;
    errors.push(
      `lessons/${f.lessonId}/config.json turnAndTalk[${f.index}] (${f.phase}): ${f.why}\n      listenFor: ${f.listenFor}`,
    );
  }
  if (!checked) errors.push("swept 0 Turn-and-Talk listen-fors — the sweep verified nothing");
  if (errors.length) {
    console.error(`FAIL: ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  ${e}`);
    console.error(
      "\nFix: rewrite the listen-for (and its Spanish sibling) so it describes a strong answer to ITS question;\n" +
        "if a finding is correct as written, record why in data/listen-for-alignment-review.json.",
    );
    process.exit(1);
  }
  console.log(
    `PASS: ${checked} Turn-and-Talk listen-fors across ${ids.length} lessons answer their own question.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
