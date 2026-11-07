// One recommended strategy per fact, from a FIXED vocabulary (the lessons for these ids are authored elsewhere),
// plus a hint built from the fact's own numbers. Pure and deterministic.
import { familyOf, isTrackedKey, parseKey } from "./fact-keys.js";
import { hint68 } from "./fact-keys-68.js";


export const STRATEGY_IDS = Object.freeze([
  "count-on",
  "doubles",
  "near-doubles",
  "make-ten",
  "break-apart",
  "skip-count",
  "array-model",
  "ones-and-zeros",
  "fives-and-tens",
  "nines-pattern",
  "square-facts",
  "fact-family",
  "half-and-double",
  "distributive",
]);
export const STRATEGY_LABELS = Object.freeze({
  "count-on": "Count on",
  doubles: "Doubles",
  "near-doubles": "Near doubles",
  "make-ten": "Make a ten",
  "break-apart": "Break apart",
  "skip-count": "Skip-count",
  "array-model": "Array model",
  "ones-and-zeros": "Ones and zeros",
  "fives-and-tens": "Fives and tens",
  "nines-pattern": "Nines pattern",
  "square-facts": "Square facts",
  "fact-family": "Fact family",
  "half-and-double": "Half and double",
  distributive: "Distributive property",
});

// ONE recommended strategy per fact. Deterministic; the first rule that fits wins.
export function strategyFor(key) {
  const p = parseKey(key);
  if (!p || !isTrackedKey(key)) return null;
  const { op, x, y } = p;
  if (op === "add") {
    const [a, b, sum] = [x, y, x + y];
    if (a === 0) return "ones-and-zeros";
    if (a === 10 || b === 10) return "fives-and-tens";
    if (a === b) return "doubles";
    if (a <= 2) return "count-on";
    if (b === a + 1 && sum <= 13) return "near-doubles"; // 6 + 7 is 6 + 6 and 1 more; 7 + 8 crosses ten, so make-ten
    if (a === 3 && sum <= 10) return "count-on";
    if (b <= 9 && sum >= 10) return "make-ten";
    return "break-apart";
  }
  if (op === "sub") {
    const [s, b, answer] = [x, y, x - y];
    if (b === 0 || b === s) return "ones-and-zeros";
    if (b === 10) return "fives-and-tens";
    if (s > 10 && s % 10 === 0 && b % 10 === 0) return "break-apart";
    if (s === 2 * b) return "doubles";
    if (b <= 2 || answer <= 2) return "count-on";
    if (s > 10 && answer < 10 && b <= 9) return "make-ten";
    return "fact-family";
  }
  if (op === "mul") {
    const [a, b, product] = [x, y, x * y];
    if (a <= 1) return "ones-and-zeros";
    if (a === 2) return "doubles";
    if (a === b) return "square-facts";
    if ([a, b].some((n) => n === 5 || n === 10)) return "fives-and-tens";
    if ([a, b].includes(9)) return "nines-pattern";
    if ([a, b].some((n) => n === 11 || n === 12)) return "distributive";
    if (product <= 12) return "array-model";
    if ([a, b].some((n) => n === 4 || n === 8)) return "half-and-double";
    if (a === 3) return "skip-count";
    return "break-apart";
  }
  const [dividend, divisor, quotient] = [x, y, x / y];
  if (dividend === 0 || divisor === 1 || quotient === 1) return "ones-and-zeros";
  if (divisor === 2) return "half-and-double";
  if (divisor === quotient) return "square-facts";
  if (divisor === 5 || divisor === 10) return "fives-and-tens";
  return "fact-family";
}

// A one-line hint for the recommended strategy, built from the fact's own numbers. It never states the answer.
// English text is the key in ES_MOBY_FACTS; placeholders are filled from `vars`.
export const HINT_TEMPLATES = Object.freeze({
  "add.zero": "Adding 0 changes nothing.",
  "add.ten": "Ten and {small} more. Say ten, then the ones.",
  "add.doubles": "This is a double: {a} and {a}. Say the double you know.",
  "add.count-on": "Start at {big}. Count on {small}.",
  "add.near": "Use the double {small} + {small}. Then add 1 more.",
  "add.make-ten": "Make a ten first. {big} needs {need} more to make 10. Take {need} from {small}.",
  "add.break-apart": "Break a number into parts that are easy to add, like tens and ones.",
  "sub.zero": "Taking away 0, or taking away everything, is quick. Think about what is left.",
  "sub.ten": "Take away one ten. Think in tens and ones.",
  "sub.tens": "Think in tens: {sTens} tens take away {bTens} tens.",
  "sub.doubles": "Think of a double: what number plus itself makes {s}?",
  "sub.count-on": "Start at {b}. Count up to {s}. How many counts did you make?",
  "sub.make-ten": "Go back to 10 first. Take away {down}. Then take away {rest} more.",
  "sub.fact-family": "Think addition: {b} + ? = {s}.",
  "mul.zero": "Zero groups, or zero in each group, makes 0.",
  "mul.one": "One group of a number is that number.",
  "mul.doubles": "Double {big}. Think {big} + {big}.",
  "mul.square": "This is a square fact: {a} rows of {a}. Picture a {a} by {a} array.",
  "mul.five": "Count by 5s, {other} times, or use half of a ten fact.",
  "mul.ten": "Each group is ten. Say how many tens, then add a zero.",
  "mul.nines": "Start with 10 × {other} = {ten}. Then take away one group of {other}.",
  "mul.distributive": "Break {big} into 10 + {rest}. Multiply {small} by each part, then add.",
  "mul.array": "Draw {a} rows of {b}. Count all the dots.",
  "mul.four": "Times 4 is double, then double again. Start with {other}.",
  "mul.eight": "Times 8 is double three times. Start with {other}.",
  "mul.skip-count": "Skip-count by {big}, {small} times.",
  "mul.break-apart": "Use 5 × {other} first. Then add 1 more group of {other}.",
  "div.special":
    "Dividing by 1 keeps the number. A number divided by itself is 1. 0 divided by a number is 0.",
  "div.half": "Think halves: what number plus itself makes {p}?",
  "div.square": "Think multiplication: what number times itself makes {p}?",
  "div.five": "Count by 5s until you reach {p}. How many counts?",
  "div.ten": "Think in tens: how many tens make {p}?",
  "div.fact-family": "Think multiplication: {d} × ? = {p}.",
});

export function strategyHint(key) {
  const strategy = strategyFor(key);
  if (!strategy) return hint68(key); // Grade 6-8 facts name a rule instead (fact-keys-68.js)
  const { x, y } = parseKey(key);
  const op = parseKey(key).op;
  let id;
  let vars = {};
  if (op === "add") {
    const [small, big] = [x, y];
    vars = { a: x, small, big, need: 10 - big };
    id =
      {
        "ones-and-zeros": "add.zero",
        "fives-and-tens": "add.ten",
        doubles: "add.doubles",
        "count-on": "add.count-on",
        "near-doubles": "add.near",
        "make-ten": "add.make-ten",
      }[strategy] || "add.break-apart";
  } else if (op === "sub") {
    vars = { s: x, b: y, sTens: x / 10, bTens: y / 10, down: x - 10, rest: y - (x - 10) };
    id =
      {
        "ones-and-zeros": "sub.zero",
        "fives-and-tens": "sub.ten",
        "break-apart": "sub.tens",
        doubles: "sub.doubles",
        "count-on": "sub.count-on",
        "make-ten": "sub.make-ten",
      }[strategy] || "sub.fact-family";
  } else if (op === "mul") {
    const other = (n) => (x === n ? y : x);
    vars = { a: x, b: y, small: x, big: y, rest: y - 10, other: x === y ? x : other(strategy === "nines-pattern" ? 9 : strategy === "fives-and-tens" ? 5 : [x, y].includes(4) ? 4 : strategy === "half-and-double" ? 8 : 0), ten: 10 * (x === 9 ? y : x), p: x * y };
    id = {
      "ones-and-zeros": x === 0 ? "mul.zero" : "mul.one",
      doubles: "mul.doubles",
      "square-facts": "mul.square",
      "fives-and-tens": [x, y].includes(10) ? "mul.ten" : "mul.five",
      "nines-pattern": "mul.nines",
      distributive: "mul.distributive",
      "array-model": "mul.array",
      "half-and-double": [x, y].includes(4) ? "mul.four" : "mul.eight",
      "skip-count": "mul.skip-count",
      "break-apart": "mul.break-apart",
    }[strategy];
    if (strategy === "break-apart") vars.other = y;
  } else {
    vars = { p: x, d: y };
    id =
      {
        "ones-and-zeros": "div.special",
        "half-and-double": "div.half",
        "square-facts": "div.square",
        "fives-and-tens": y === 10 ? "div.ten" : "div.five",
      }[strategy] || "div.fact-family";
  }
  const template = HINT_TEMPLATES[id];
  vars = Object.fromEntries([...template.matchAll(/\{(\w+)\}/g)].map(([, name]) => [name, vars[name]]));
  return {
    id,
    strategy,
    template,
    vars,
    text: template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name])),
  };
}

// How early a fact tends to be learned: used only to introduce easier facts first. Not a mastery claim.
const STRATEGY_RANK = {
  doubles: 0,
  "count-on": 0,
  "fives-and-tens": 1,
  "near-doubles": 1,
  "ones-and-zeros": 2,
  "array-model": 2,
  "skip-count": 2,
  "half-and-double": 3,
  "make-ten": 3,
  "square-facts": 3,
  "nines-pattern": 4,
  "fact-family": 4,
  "break-apart": 5,
  distributive: 5,
};
export function factRank(key) {
  const family = familyOf(key);
  if (!family) return 99;
  return (STRATEGY_RANK[strategyFor(family.id)] ?? 6) * 1000 + family.total;
}
