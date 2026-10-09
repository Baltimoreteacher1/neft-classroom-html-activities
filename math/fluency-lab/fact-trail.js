// Fact Trail: one short, ordered fluency path per grade, built on that grade's fluency standard.
// Each station teaches one strategy (one sentence + one picture), then a 10-problem round.
import { generateProblem } from "./problem-bank.js";
import { profileKey, profiles, readLocal, writeLocal } from "./school-tools.js";

const range = (from, to, step = 1) =>
  Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step);
const pool = (config) => ({ generator: "factPool", config });
const gen = (generator, config) => ({ generator, config });
const station = (id, label, name, idea, source) => ({ id, label, name, idea, source });
const mix = (id, label, name, idea, ids) => ({ id, label, name, idea, mix: ids });

export const BANDS = {
  early: {
    trail: "My fact trail",
    start: "Let's go!",
    next: "Next stop",
    again: "Play again",
    check: "Check",
    read: "Read to me",
    keypad: true,
    right: ["Yes!", "You got it!", "Great job!", "Super!"],
    miss: "Almost! Look at the picture.",
    retype: "Type the answer to keep going.",
  },
  middle: {
    trail: "Fact trail",
    start: "Start round",
    next: "Next stop",
    again: "Play again",
    check: "Check",
    read: "Read to me",
    keypad: true,
    right: ["Correct!", "Nice work!", "That's it!", "Right on!"],
    miss: "Not quite. Here is how it works.",
    retype: "Type the answer to keep going.",
  },
  upper: {
    trail: "Fluency trail",
    start: "Start set",
    next: "Next station",
    again: "Try again",
    check: "Check",
    read: "Read aloud",
    keypad: false,
    right: ["Correct.", "Right.", "Good.", "Yes."],
    miss: "Not yet. Look at the model.",
    retype: "Type the answer to continue.",
  },
};

export const bandFor = (grade) => (grade <= 2 ? "early" : grade <= 5 ? "middle" : "upper");

export const TRAILS = {
  1: {
    focus: "Add and subtract within 10",
    standard: "1.OA.C.6",
    chart: { op: "add", max: 10, sumMax: 10 },
    stations: [
      station(
        "count-on",
        "+1 +2",
        "Count on",
        "Start with the bigger number. Count on the small one.",
        pool({
          op: "add",
          left: range(1, 8),
          right: [1, 2],
          swap: true,
          maxResult: 10,
          strategy: "countOn",
        }),
      ),
      station(
        "doubles",
        "2 + 2",
        "Doubles",
        "A double adds a number to itself, like 3 + 3.",
        pool({ op: "add", left: range(0, 5), pair: "double", strategy: "doubles" }),
      ),
      station(
        "make-10",
        "□ + 7",
        "Make 10",
        "Fill the ten-frame. The empty spaces show what is missing.",
        gen("makeTarget", { target: 10 }),
      ),
      station(
        "add-10",
        "+ to 10",
        "Add within 10",
        "Put the two groups together and count them all.",
        pool({
          op: "add",
          left: range(0, 10),
          right: range(0, 10),
          maxResult: 10,
          strategy: "countOn",
        }),
      ),
      station(
        "count-back",
        "−1 −2",
        "Count back",
        "Start at the bigger number. Count back.",
        pool({ op: "sub", right: [1, 2], result: range(0, 8), strategy: "countBack" }),
      ),
      station(
        "sub-10",
        "− to 10",
        "Subtract within 10",
        "Think: what plus the small number makes the big number?",
        pool({
          op: "sub",
          right: range(1, 9),
          result: range(0, 9),
          maxResult: 10,
          strategy: "thinkAdd",
        }),
      ),
      mix("mix", "+ −", "Mix it up", "Look at the sign first: + or −.", ["add-10", "sub-10"]),
    ],
  },
  2: {
    focus: "Add and subtract within 20",
    standard: "2.OA.B.2",
    chart: { op: "add", max: 10 },
    stations: [
      station(
        "doubles",
        "6 + 6",
        "Doubles",
        "A double adds a number to itself, like 6 + 6.",
        pool({ op: "add", left: range(1, 10), pair: "double", strategy: "doubles" }),
      ),
      station(
        "near-doubles",
        "6 + 7",
        "Near doubles",
        "Use a double, then add 1 more.",
        pool({ op: "add", left: range(1, 9), pair: "near", strategy: "near" }),
      ),
      station(
        "make-ten",
        "9 + 5",
        "Make a ten",
        "Move some to fill a ten. Then add the rest.",
        pool({ op: "add", left: [7, 8, 9], right: range(3, 9), swap: true, strategy: "makeTen" }),
      ),
      station(
        "add-20",
        "+ to 20",
        "Add within 20",
        "Use a double or make a ten.",
        pool({ op: "add", left: range(2, 10), right: range(2, 10), strategy: "addAny" }),
      ),
      station(
        "teens",
        "15 − 7",
        "Subtract from teens",
        "Think addition: 7 plus what makes 15?",
        pool({ op: "sub", right: range(3, 9), result: range(3, 9), strategy: "thinkAdd" }),
      ),
      station(
        "sub-20",
        "− to 20",
        "Subtract within 20",
        "Think of the matching addition fact.",
        pool({ op: "sub", right: range(1, 10), result: range(0, 10), strategy: "thinkAdd" }),
      ),
      mix("mix", "+ −", "Mix it up", "Look at the sign first: + or −.", ["add-20", "sub-20"]),
    ],
  },
  3: {
    focus: "Multiplication and division facts",
    standard: "3.OA.C.7",
    chart: { op: "mul", max: 10 },
    stations: [
      station(
        "x2-5-10",
        "×2 ×5 ×10",
        "Skip-count facts",
        "Skip-count. 3 × 5 means 5, 10, 15.",
        pool({ op: "mul", left: [2, 5, 10], right: range(0, 10), strategy: "skipCount" }),
      ),
      station(
        "x3-4",
        "×3 ×4",
        "Threes and fours",
        "Count the rows of dots, or skip-count.",
        pool({ op: "mul", left: [3, 4], right: range(0, 10), strategy: "skipCount" }),
      ),
      station(
        "x0-1",
        "×0 ×1",
        "Zero and one",
        "Times 0 is always 0. Times 1 stays the same.",
        pool({ op: "mul", left: [0, 1], right: range(0, 10), strategy: "skipCount" }),
      ),
      station(
        "x6-7",
        "×6 ×7",
        "Sixes and sevens",
        "Use a 5 fact, then add the extra rows.",
        pool({ op: "mul", left: [6, 7], right: range(2, 10), strategy: "breakApart" }),
      ),
      station(
        "x8-9",
        "×8 ×9",
        "Eights and nines",
        "For 9s, use the 10 fact and take one row away.",
        pool({ op: "mul", left: [8, 9], right: range(2, 10), strategy: "breakApart" }),
      ),
      station(
        "div-2-5-10",
        "÷2 ÷5 ÷10",
        "Easy division",
        "Division is a times fact backward. 15 ÷ 5: 5 times what is 15?",
        pool({ op: "div", right: [2, 5, 10], result: range(1, 10), strategy: "thinkMul" }),
      ),
      station(
        "div-all",
        "÷ all",
        "All division facts",
        "Find the missing times fact.",
        pool({ op: "div", right: range(2, 9), result: range(1, 10), strategy: "thinkMul" }),
      ),
      mix("mix", "× ÷", "Mix it up", "Look at the sign first: × or ÷.", [
        "x6-7",
        "x8-9",
        "div-all",
      ]),
    ],
  },
  4: {
    focus: "Multi-digit adding and subtracting",
    standard: "4.NBT.B.4",
    chart: null,
    stations: [
      mix("facts", "× ÷", "Fact warm-up", "Quick times and division facts from Grade 3.", [
        [3, "x6-7"],
        [3, "x8-9"],
        [3, "div-all"],
      ]),
      station(
        "tens",
        "6 × 300",
        "Times 10, 100, 1,000",
        "Multiply the basic fact. Then add the zeros.",
        pool({
          op: "mul",
          left: range(2, 9),
          right: [...range(20, 90, 10), ...range(200, 900, 100), ...range(2000, 9000, 1000)],
          strategy: "zeros",
        }),
      ),
      station(
        "add-3",
        "+ 3 digits",
        "Add 3-digit numbers",
        "Add ones, then tens, then hundreds.",
        gen("fact", { op: "add", min: 100, max: 499, maxResult: 999 }),
      ),
      station(
        "sub-3",
        "− 3 digits",
        "Subtract 3-digit numbers",
        "Subtract ones, then tens, then hundreds. Trade a ten when you need one.",
        gen("fact", { op: "sub", min: 100, max: 450 }),
      ),
      station(
        "add-4",
        "+ 4 digits",
        "Add 4-digit numbers",
        "Line up the places. Add from right to left.",
        gen("fact", { op: "add", min: 1000, max: 4999, maxResult: 9999 }),
      ),
      station(
        "sub-4",
        "− 4 digits",
        "Subtract 4-digit numbers",
        "Line up the places. Trade from the next place when you need to.",
        gen("fact", { op: "sub", min: 1000, max: 4500 }),
      ),
      mix("mix", "+ −", "Mix it up", "Look at the sign first: + or −.", ["add-4", "sub-4"]),
    ],
  },
  5: {
    focus: "Multi-digit multiplication",
    standard: "5.NBT.B.5",
    chart: null,
    stations: [
      mix("facts", "× ÷", "Fact warm-up", "Quick times and division facts.", [
        [3, "x6-7"],
        [3, "x8-9"],
        [3, "div-all"],
      ]),
      station(
        "tens",
        "40 × 30",
        "Tens times tens",
        "Multiply the basic fact. Then add all the zeros.",
        pool({
          op: "mul",
          left: range(20, 90, 10),
          right: [...range(2, 9), ...range(20, 90, 10)],
          strategy: "zeros",
        }),
      ),
      station(
        "2x1",
        "34 × 6",
        "2-digit × 1-digit",
        "Split the big number into tens and ones. Multiply each part.",
        gen("fact", { op: "mul", minA: 12, maxA: 99, minB: 2, maxB: 9 }),
      ),
      station(
        "3x1",
        "248 × 7",
        "3-digit × 1-digit",
        "Split into hundreds, tens, and ones. Add the parts.",
        gen("fact", { op: "mul", minA: 100, maxA: 999, minB: 2, maxB: 9 }),
      ),
      station(
        "2x2",
        "36 × 24",
        "2-digit × 2-digit",
        "Split one number into tens and ones. Add the two products.",
        gen("fact", { op: "mul", minA: 11, maxA: 99, minB: 11, maxB: 99 }),
      ),
      station(
        "div",
        "84 ÷ 4",
        "Divide by 1 digit",
        "Ask: how many times does it fit? Check by multiplying.",
        gen("fact", { op: "div", minDivisor: 2, maxDivisor: 9, minQuotient: 11, maxQuotient: 99 }),
      ),
      mix("mix", "× ÷", "Mix it up", "Look at the sign first: × or ÷.", ["2x1", "2x2", "div"]),
    ],
  },
  6: {
    focus: "Dividing and working with decimals",
    standard: "6.NS.B.2–4",
    chart: null,
    stations: [
      station(
        "div-1",
        "732 ÷ 6",
        "Divide by 1 digit",
        "Divide each place, left to right. Check by multiplying.",
        gen("fact", {
          op: "div",
          minDivisor: 2,
          maxDivisor: 9,
          minQuotient: 100,
          maxQuotient: 999,
        }),
      ),
      station(
        "div-2",
        "736 ÷ 23",
        "Divide by 2 digits",
        "Estimate with friendly numbers first, then adjust.",
        gen("fact", {
          op: "div",
          minDivisor: 11,
          maxDivisor: 30,
          minQuotient: 11,
          maxQuotient: 99,
        }),
      ),
      station(
        "dec-add",
        "4.5 + 2.37",
        "Add and subtract decimals",
        "Line up the decimal points. Then add or subtract.",
        gen("decimalOp", { op: "add", places: 2 }),
      ),
      station(
        "dec-mul",
        "1.2 × 3.4",
        "Multiply decimals",
        "Multiply like whole numbers. Then place the decimal point.",
        gen("decimalOp", { op: "mul" }),
      ),
      station(
        "dec-div",
        "7.2 ÷ 4",
        "Divide decimals",
        "Divide like whole numbers. Keep the decimal point in line.",
        gen("decimalOp", { op: "div", decimalQuotient: true, maxDivisor: 9 }),
      ),
      station(
        "gcf",
        "GCF",
        "Greatest common factor",
        "List the factors of each number. Pick the biggest one they share.",
        gen("gcfLcm", { find: "gcf", max: 60 }),
      ),
      mix("mix", "÷ .", "Mix it up", "Read each problem carefully before you start.", [
        "div-2",
        "dec-mul",
        "dec-div",
      ]),
    ],
  },
  7: {
    focus: "Positive and negative numbers",
    standard: "7.NS.A.1–2",
    chart: null,
    stations: [
      station(
        "int-add",
        "−3 + 5",
        "Add integers",
        "Adding a positive moves right. Adding a negative moves left.",
        gen("integerOp", { op: "add", min: -15, max: 15 }),
      ),
      station(
        "int-sub",
        "4 − (−2)",
        "Subtract integers",
        "Subtracting is adding the opposite.",
        gen("integerOp", { op: "sub", min: -15, max: 15 }),
      ),
      station(
        "int-mul",
        "−4 × 6",
        "Multiply integers",
        "Same signs: positive. Different signs: negative.",
        gen("integerOp", { op: "mul", min: -12, max: 12 }),
      ),
      station(
        "int-div",
        "−24 ÷ 6",
        "Divide integers",
        "Same signs: positive. Different signs: negative.",
        gen("integerOp", { op: "div" }),
      ),
      station(
        "one-step",
        "x + 5 = 2",
        "One-step equations",
        "Do the opposite operation to both sides.",
        gen("solve", { oneStep: true, minX: -10, maxX: 10 }),
      ),
      station(
        "two-step",
        "2x + 3 = 11",
        "Two-step equations",
        "Undo adding or subtracting first. Then undo multiplying.",
        gen("solve", { minX: -8, maxX: 8, maxCoefficient: 6 }),
      ),
      mix("mix", "± ×", "Mix it up", "Find the sign first, then the size.", [
        "int-add",
        "int-sub",
        "int-mul",
        "int-div",
      ]),
    ],
  },
  8: {
    focus: "Exponents, roots, and equations",
    standard: "8.EE.A, 8.EE.C.7",
    chart: null,
    stations: [
      station(
        "powers",
        "4³",
        "Squares and cubes",
        "The exponent says how many times to multiply the base.",
        gen("exponent", { maxBase: 10, maxExponent: 3 }),
      ),
      station(
        "roots",
        "√49",
        "Square roots",
        "Find the number that times itself makes the number inside.",
        gen("squareRoot", { maxRoot: 15 }),
      ),
      station(
        "ten-powers",
        "3.2 × 10²",
        "Powers of ten",
        "Each power of ten moves the decimal point one place.",
        gen("powerTen", { minPower: 0, maxPower: 4 }),
      ),
      station(
        "int-review",
        "−6 × −3",
        "Integer review",
        "Find the sign first, then the size.",
        gen("integerOp", { min: -12, max: 12 }),
      ),
      station(
        "two-step",
        "3x − 4 = 11",
        "Two-step equations",
        "Undo adding or subtracting first. Then undo multiplying.",
        gen("solve", { minX: -10, maxX: 12, maxCoefficient: 9 }),
      ),
      mix("mix", "x² =", "Mix it up", "Read each problem carefully before you start.", [
        "powers",
        "roots",
        "two-step",
      ]),
    ],
  },
};

export function getStation(grade, id) {
  return TRAILS[grade]?.stations.find((entry) => entry.id === id) || null;
}

// A mix entry is a station id in the same grade, or [grade, id] for a warm-up from an earlier grade.
function sourceStation(grade, ref) {
  return Array.isArray(ref) ? getStation(ref[0], ref[1]) : getStation(grade, ref);
}

export function makeProblem(grade, stationEntry, rng = Math.random) {
  const target = stationEntry.mix
    ? sourceStation(grade, stationEntry.mix[Math.floor(rng() * stationEntry.mix.length)])
    : stationEntry;
  return generateProblem(target.source, rng);
}

// Fact-family key for the chart: a subtraction or division fact credits its matching + or × fact.
export function chartKey(item) {
  const match = item.question.replaceAll(",", "").match(/^(\d+) ([+−×÷]) (\d+) = \?$/);
  if (!match) return null;
  const [a, op, b] = [Number(match[1]), match[2], Number(match[3])];
  const answer = Number(item.answers[0]);
  const [x, y, kind] =
    op === "+"
      ? [a, b, "add"]
      : op === "−"
        ? [b, answer, "add"]
        : op === "×"
          ? [a, b, "mul"]
          : [b, answer, "mul"];
  return `${kind}:${Math.min(x, y)}:${Math.max(x, y)}`;
}

const TRAIL_KEY = "ewl-fluency-trail-v1";
const storageKey = () => profileKey(TRAIL_KEY, profiles().active);

export function loadTrail() {
  const saved = readLocal(storageKey(), null);
  return {
    stations: saved?.stations && typeof saved.stations === "object" ? saved.stations : {},
    facts: saved?.facts && typeof saved.facts === "object" ? saved.facts : {},
  };
}

export function saveTrail(data) {
  writeLocal(storageKey(), data);
}

export const starsFor = (firstTry, total) =>
  firstTry >= total - 1 ? 3 : firstTry >= total - 3 ? 2 : 1;

export function recordRound(data, grade, stationId, firstTry, total) {
  const key = `${grade}:${stationId}`;
  const previous = data.stations[key] || { stars: 0, best: 0, rounds: 0 };
  const stars = starsFor(firstTry, total);
  data.stations[key] = {
    stars: Math.max(previous.stars, stars),
    best: Math.max(previous.best, firstTry),
    rounds: previous.rounds + 1,
  };
  return stars;
}

export function recordFact(data, item, firstTry) {
  const key = chartKey(item);
  if (!key) return;
  const entry = data.facts[key] || { right: 0, missed: 0 };
  if (firstTry) entry.right += 1;
  else entry.missed += 1;
  entry.last = firstTry;
  data.facts[key] = entry;
}

// A fact is "known" after two first-try answers with the most recent one correct.
export function factStatus(data, key) {
  const entry = data.facts[key];
  if (!entry) return "new";
  if (entry.right >= 2 && entry.last) return "known";
  return entry.last ? "growing" : "practice";
}

export function nextStation(data, grade) {
  const trail = TRAILS[grade];
  return (
    trail.stations.find((entry) => (data.stations[`${grade}:${entry.id}`]?.stars || 0) < 2) ||
    trail.stations.at(-1)
  );
}
