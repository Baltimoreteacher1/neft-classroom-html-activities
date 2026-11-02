// Error diagnosis: why was this answer wrong? Every wrong answer gets exactly one of four labels.
//   conceptual   the learner chose another operation, structure or representation (added denominators, subtracted
//                where the problem divides, a decimal point a place off)
//   calculation  the method fits but the arithmetic slipped (a carried ten, one off, two digits swapped)
//   fluency      a skill the learner knows, missed on a basic fact, or answered much slower than their own usual
//   unsure       not enough evidence. This is the DEFAULT: a label is only given when a deterministic rule fires, and
//                two rules that disagree give "unsure", never a coin flip.
// Pure and explainable: no DOM, no clock (callers pass `now`), no randomness. Every label carries `evidence` (counted
// facts) and a plain-language `reason` built from the numbers in the item. `confidence` is "high" when the numbers
// leave one explanation and "check" when others remain possible; a teacher should read "check" as a prompt to ask.
import { t } from "../i18n.js";
import { itemSignature } from "../mastery-model.js";
import { classifyMistake, mistakeCategoryLabel } from "../mistake-notes.js";
import { skillKey } from "../tutor-engine.js";

export const CATEGORIES = Object.freeze(["conceptual", "calculation", "fluency", "unsure"]);
export const DIAGNOSIS = Object.freeze({
  window: 10, // wrong attempts read for a skill roll-up
  minLabelled: 3, // labelled attempts before a roll-up may name a dominant category
  dominantShare: 0.6, // share of labelled attempts one category needs to be dominant
  slowFactor: 1.5, // answer time over the learner's own median that counts as "slower than usual"
  minPaceSamples: 5, // calm timed answers needed before a median means anything
  knownIndependent: 4, // independent answers before a skill counts as known
  knownAccuracy: 0.6, // share right among them
  nearMissMinimum: 10, // below this, "one off" is not evidence of anything
  rapidMsFact: 700, // a typed answer faster than this to a basic fact is not a considered answer
  rapidMsOther: 2000, // the same for any other problem
  absurdFactor: 20, // an answer this many times too large or small is a typing error, not a method
});

const TEXT = Object.freeze({
  conceptual: "Idea or method",
  calculation: "Calculation slip",
  fluency: "Recall and speed",
  unsure: "Not sure yet",
  reasonConceptual: "Answer {submitted} fits an idea mix-up: {label}. Check: {facts}.",
  reasonCalculation:
    "Answer {submitted} fits the right method with a slip: {label}. Check: {facts}.",
  reasonRecall:
    "You answered this exact basic fact correctly {count} time(s) before, so {submitted} looks like a recall slip.",
  reasonKnown:
    "This is a basic fact and {correct} of {total} independent answers on this skill were right, so {submitted} looks like a recall slip, not a missing idea.",
  reasonSlow:
    "You usually answer in about {median} seconds and this one took {seconds} seconds, on a skill you mostly get right.",
  reasonNone: "There is not enough evidence to say why. No common slip matches {submitted}.",
  reasonConflict: "Two different explanations fit {submitted}, so we do not guess.",
  reasonBlank: "No usable answer was entered, so there is nothing to diagnose.",
  reasonRapid: "Very fast answers are often guesses, so we do not label this one.",
  reasonAbsurd:
    "{submitted} is far from the size of the answer, which looks like a typing slip rather than a method.",
  dominantNone: "Not enough labelled mistakes yet to name a main cause.",
  dominantMixed: "The mistakes have different causes, so there is no single main cause yet.",
  dominantFound: "{count} of {labelled} labelled mistakes look like: {name}.",
  hintConceptual:
    "Name the operation first. What is the problem asking you to do with the numbers?",
  hintCalculation: "Your method looks right. Estimate first, then check each step.",
  hintFluency: "Use a strategy you know for this fact, then check it another way.",
  hintUnsure: "Try the first step again and say out loud what each number means.",
});
export const DIAGNOSIS_TEXT = TEXT;
const say = (id, vars) => t(TEXT[id], vars);
export const categoryName = (category) => (TEXT[category] ? say(category) : say("unsure"));
export const categoryHint = (category) =>
  say(
    { conceptual: "hintConceptual", calculation: "hintCalculation", fluency: "hintFluency" }[
      category
    ] || "hintUnsure",
  );

// ---- Numbers ------------------------------------------------------------------------------------------------
const NUM = "-?\\d[\\d,]*(?:\\.\\d+)?";
const num = (text) => Number(String(text).replaceAll(",", "").replace("−", "-"));
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => Math.abs(a * b) / (gcd(a, b) || 1);
const same = (x, y, tolerance = 1e-9) =>
  Number.isFinite(x) &&
  Number.isFinite(y) &&
  Math.abs(x - y) <= tolerance * Math.max(1, Math.abs(x), Math.abs(y));
const fmt = (value) => String(Number(Number(value).toFixed(6))).replace("-", "−");
const frac = (n, d) => `${fmt(n)}/${fmt(d)}`;

// A typed answer as a number: "−4", "1,200", "3/4", "1 3/4", "25%". NaN when it is not one.
export function toValue(raw) {
  const text = String(raw ?? "")
    .trim()
    .replaceAll("−", "-")
    .replaceAll(",", "")
    .replace(/%$/, "");
  if (!text) return Number.NaN;
  const mixed = text.match(/^(-?)(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed)
    return Number(mixed[4])
      ? (mixed[1] ? -1 : 1) * (Number(mixed[2]) + Number(mixed[3]) / Number(mixed[4]))
      : Number.NaN;
  const fraction = text.replace(/\s+/g, "").match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (fraction) return Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : Number.NaN;
  return /^-?\d+(?:\.\d+)?$/.test(text) ? Number(text) : Number.NaN;
}

const DECIMAL_LIKE = new Set([
  "decimalOp",
  "decimalPlace",
  "powerTen",
  "percent",
  "percentChange",
  "rateConversion",
  "unitRate",
  "conversion",
]);
const SIGNED = new Set([
  "integerOp",
  "expression",
  "solve",
  "slope",
  "functionRule",
  "system",
  "transform",
  "inequality",
]);
const ARITH = new RegExp(`^(${NUM}) ([+−×÷]) \\(?(${NUM})\\)? = \\?$`);
const FRACTION = /^(-?\d+)\/(\d+) ([+−×÷]) \(?(-?\d+)\/(\d+)\)? = \?$/;
const MISSING = /^(\d+) \+ (?:□|\?) = (\d+)/;

// Prediction helpers: each returns the answers a learner holding this misconception would type.
const pick = (list) => list.filter((entry) => entry && Number.isFinite(entry.value));
const guess = (value, facts) => ({ value, facts });

// ---- The slip catalogue -------------------------------------------------------------------------------------
// predict(c) -> [{ value | text, facts, confidence? }]. The same table answers two questions: "which slip does this
// wrong answer match?" (diagnosis) and "which slips could this item expose?" (misconception-targeted selection).
const SLIPS = [];
const slip = (id, category, confidence, hint, predict, label = null) =>
  SLIPS.push({ id, category, confidence, hint, predict, label });

// Named slips already detected by mistake-notes.js. They keep that module's labels and are matched by it first; the
// predictions here only exist so selection can ask "could this item expose it?".
slip(
  "subtractInsteadOfAdding",
  "conceptual",
  "high",
  "This problem puts the numbers together. Join the two amounts.",
  (c) => (c.op === "+" ? [guess(Math.abs(c.a - c.b), `${fmt(c.a)} − ${fmt(c.b)}`)] : []),
);
slip(
  "omittedAddend",
  "conceptual",
  "check",
  "Check that every number in the problem was used.",
  (c) =>
    c.op === "+"
      ? [
          guess(c.a, `${fmt(c.a)} is one of the numbers`),
          guess(c.b, `${fmt(c.b)} is one of the numbers`),
        ]
      : [],
);
slip(
  "addedInsteadOfSubtracting",
  "conceptual",
  "high",
  "This problem asks how much is left or how far apart. Start with the whole and take a part away.",
  (c) => (c.op === "−" ? [guess(c.a + c.b, `${fmt(c.a)} + ${fmt(c.b)}`)] : []),
);
slip(
  "reversedSubtraction",
  "conceptual",
  "high",
  "The whole goes first. Start with the larger amount and take the smaller one away.",
  (c) => (c.op === "−" ? [guess(c.b - c.a, `${fmt(c.b)} − ${fmt(c.a)}`)] : []),
);
slip(
  "addedFactors",
  "conceptual",
  "high",
  "Multiplying counts equal groups. Say how many groups and how many in each group.",
  (c) => (c.op === "×" ? [guess(c.a + c.b, `${fmt(c.a)} + ${fmt(c.b)}`)] : []),
);
slip(
  "oneGroupOff",
  "calculation",
  "check",
  "You are one group away. Check how many groups there are and how many are in each.",
  (c) =>
    c.op === "×" && Number.isFinite(c.ans)
      ? [c.ans + c.a, c.ans - c.a, c.ans + c.b, c.ans - c.b].map((value) =>
          guess(value, "one group more or fewer"),
        )
      : [],
);
slip(
  "subtractedInsteadOfDividing",
  "conceptual",
  "high",
  "Division asks how many equal groups fit, not what is left after taking one away.",
  (c) => (c.op === "÷" ? [guess(c.a - c.b, `${fmt(c.a)} − ${fmt(c.b)}`)] : []),
);
slip(
  "multipliedInsteadOfDividing",
  "conceptual",
  "high",
  "Division splits a total into equal groups. The answer is smaller than the total.",
  (c) => (c.op === "÷" ? [guess(c.a * c.b, `${fmt(c.a)} × ${fmt(c.b)}`)] : []),
);
slip(
  "addedInsteadOfDividing",
  "conceptual",
  "high",
  "Division splits a total into equal groups. Do not join the numbers.",
  (c) => (c.op === "÷" ? [guess(c.a + c.b, `${fmt(c.a)} + ${fmt(c.b)}`)] : []),
);
slip(
  "addedDenominators",
  "conceptual",
  "high",
  "The bottom number names the size of the pieces. Make equal-size pieces before you count them.",
  (c) =>
    c.fr && c.fr.op === "+"
      ? [
          guess(
            (c.fr.n1 + c.fr.n2) / (c.fr.d1 + c.fr.d2),
            `(${c.fr.n1} + ${c.fr.n2}) / (${c.fr.d1} + ${c.fr.d2}) = ${frac(c.fr.n1 + c.fr.n2, c.fr.d1 + c.fr.d2)}`,
          ),
        ]
      : [],
);
slip(
  "confusedGcfLcm",
  "conceptual",
  "high",
  "A factor divides into both numbers. A multiple is something both numbers divide into. Which does the question ask for?",
  (c) => {
    const found = c.q.match(
      /\b(GCF|LCM|greatest common factor|least common multiple)\b[^\d-]*(-?\d+)[^\d-]+(-?\d+)/i,
    );
    if (!found) return [];
    const [x, y] = [Number(found[2]), Number(found[3])];
    const isGcf = /gcf|greatest/i.test(found[1]);
    return [guess(isGcf ? lcm(x, y) : gcd(x, y), `${isGcf ? "LCM" : "GCF"}(${x}, ${y})`)];
  },
);
slip(
  "swappedCoordinates",
  "conceptual",
  "high",
  "Move along the x-axis first, then up or down for y.",
  (c) => {
    const pair = c.q.match(/(?:point\s*)?\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*\)?/i);
    return pair && ["coordinate", "tuple", "text"].includes(c.item.kind)
      ? [
          {
            text: `(${pair[2]},${pair[1]})`,
            facts: `(${pair[1]}, ${pair[2]}) → (${pair[2]}, ${pair[1]})`,
          },
        ]
      : [];
  },
);

// New conceptual slips: operation choice, sign, place value, inverse operations, fractions, units, geometry.
slip(
  "multipliedInsteadOfAdding",
  "conceptual",
  "high",
  "This problem joins the numbers. Add them; do not multiply.",
  (c) =>
    c.op === "+" && c.a >= 2 && c.b >= 2 ? [guess(c.a * c.b, `${fmt(c.a)} × ${fmt(c.b)}`)] : [],
  "Multiplied instead of adding",
);
slip(
  "multipliedInsteadOfSubtracting",
  "conceptual",
  "high",
  "This problem takes an amount away. Subtract; do not multiply.",
  (c) =>
    c.op === "−" && c.a >= 2 && c.b >= 2 ? [guess(c.a * c.b, `${fmt(c.a)} × ${fmt(c.b)}`)] : [],
  "Multiplied instead of subtracting",
);
slip(
  "subtractedInsteadOfMultiplying",
  "conceptual",
  "high",
  "Multiplying counts equal groups. Do not take the numbers apart.",
  (c) =>
    c.op === "×" && c.a >= 2 && c.b >= 2
      ? [guess(Math.abs(c.a - c.b), `${fmt(c.a)} − ${fmt(c.b)}`)]
      : [],
  "Subtracted instead of multiplying",
);
slip(
  "dividedInsteadOfMultiplying",
  "conceptual",
  "high",
  "Multiplying makes equal groups bigger. Count the total in all the groups.",
  (c) =>
    c.op === "×" && c.b > 1 && Number.isInteger(c.a / c.b)
      ? [guess(c.a / c.b, `${fmt(c.a)} ÷ ${fmt(c.b)}`)]
      : [],
  "Divided instead of multiplying",
);
slip(
  "signSlip",
  "conceptual",
  "check",
  "Check the sign. Which direction does each step move on the number line?",
  (c) =>
    Number.isFinite(c.ans) && c.ans !== 0
      ? [
          {
            value: -c.ans,
            facts: `${fmt(-c.ans)} is the opposite of ${fmt(c.ans)}`,
            confidence:
              /(^|[\s(])-\d|[−-] \(/.test(c.q) || SIGNED.has(c.item.generator) ? "high" : "check",
          },
        ]
      : [],
  "Right size, wrong sign",
);
slip(
  "placeValueShift",
  "conceptual",
  "check",
  "Estimate the size first. Check that every digit is in the right place.",
  (c) =>
    Number.isFinite(c.ans) && c.ans !== 0
      ? [10, 100, 1000, 0.1, 0.01, 0.001].map((scale) => ({
          value: c.ans * scale,
          facts: `${fmt(c.ans * scale)} is the answer × ${fmt(scale)}`,
          confidence: DECIMAL_LIKE.has(c.item.generator) ? "high" : "check",
        }))
      : [],
  "Place value shifted by a ten, a hundred or more",
);
slip(
  "addedForMissing",
  "conceptual",
  "high",
  "The box is the missing part. Take the part you know away from the total.",
  (c) =>
    c.missing ? [guess(c.missing.a + c.missing.total, `${c.missing.a} + ${c.missing.total}`)] : [],
  "Added where the missing number needs subtracting",
);
slip(
  "copiedTotal",
  "conceptual",
  "high",
  "The total is the whole. The box holds the missing part, which is smaller.",
  (c) =>
    c.missing ? [guess(c.missing.total, `${c.missing.total} is the total in the problem`)] : [],
  "Wrote the total in the box",
);
slip(
  "wrongInverseOperation",
  "conceptual",
  "high",
  "Undo each step with its opposite: add with subtract, multiply with divide.",
  (c) => {
    const e = c.eq;
    if (!e) return [];
    const out = [];
    if (e.kind === "ax=c")
      out.push(guess(e.c - e.a, `${e.c} − ${e.a}`), guess(e.c * e.a, `${e.c} × ${e.a}`));
    if (e.kind === "x÷b=c")
      out.push(guess(e.c - e.b, `${e.c} − ${e.b}`), guess(e.c / e.b, `${e.c} ÷ ${e.b}`));
    if (e.kind === "x±b=c")
      out.push(
        guess(e.sign > 0 ? e.c + e.b : e.c - e.b, `${e.c} ${e.sign > 0 ? "+" : "−"} ${e.b}`),
      );
    if (e.kind === "ax±b=c")
      out.push(
        guess(
          (e.sign > 0 ? e.c + e.b : e.c - e.b) / e.a,
          `(${e.c} ${e.sign > 0 ? "+" : "−"} ${e.b}) ÷ ${e.a}`,
        ),
      );
    return out;
  },
  "Undid the step with the wrong operation",
);
slip(
  "forgotToDivide",
  "conceptual",
  "high",
  "After you undo the add or subtract, the variable is still multiplied. Divide both sides.",
  (c) =>
    c.eq?.kind === "ax±b=c"
      ? [
          guess(
            c.eq.sign > 0 ? c.eq.c - c.eq.b : c.eq.c + c.eq.b,
            `${c.eq.c} ${c.eq.sign > 0 ? "−" : "+"} ${c.eq.b}`,
          ),
        ]
      : [],
  "Stopped before dividing by the coefficient",
);
slip(
  "exponentAsMultiplier",
  "conceptual",
  "high",
  "The exponent counts how many times the base is a factor.",
  (c) => {
    const found = c.q.match(/^(-?\d+)\^(\d+) = \?$/);
    return found
      ? [
          guess(Number(found[1]) * Number(found[2]), `${found[1]} × ${found[2]}`),
          ...(found[1] !== found[2]
            ? [guess(Number(found[2]) ** Number(found[1]), `${found[2]}^${found[1]}`)]
            : []),
        ]
      : [];
  },
  "Multiplied the base by the exponent",
);
slip(
  "confusedRoot",
  "conceptual",
  "high",
  "A square root is the number that multiplies by itself to make the given number.",
  (c) => {
    const found = c.q.match(/^√(\d+) = \?$/);
    return found
      ? [
          guess(Number(found[1]) / 2, `${found[1]} ÷ 2`),
          guess(Number(found[1]) ** 2, `${found[1]} × ${found[1]}`),
        ]
      : [];
  },
  "Halved or squared instead of finding the square root",
);
slip(
  "subtractedDenominators",
  "conceptual",
  "high",
  "The bottom number names the piece size. Make equal-size pieces first; do not subtract them.",
  (c) =>
    c.fr && c.fr.op === "−" && c.fr.d1 !== c.fr.d2
      ? [
          guess(
            (c.fr.n1 - c.fr.n2) / (c.fr.d1 - c.fr.d2),
            `(${c.fr.n1} − ${c.fr.n2}) / (${c.fr.d1} − ${c.fr.d2})`,
          ),
        ]
      : [],
  "Subtracted the denominators",
);
slip(
  "noScaleTops",
  "conceptual",
  "high",
  "When the pieces change size, the tops change by the same factor as the bottoms.",
  (c) =>
    c.fr && "+−".includes(c.fr.op) && c.fr.d1 !== c.fr.d2
      ? [
          guess(
            (c.fr.op === "+" ? c.fr.n1 + c.fr.n2 : c.fr.n1 - c.fr.n2) / lcm(c.fr.d1, c.fr.d2),
            `${c.fr.n1} ${c.fr.op} ${c.fr.n2} over ${lcm(c.fr.d1, c.fr.d2)}`,
          ),
        ]
      : [],
  "Found a common denominator but kept the old tops",
);
slip(
  "addedFractionParts",
  "conceptual",
  "high",
  "To multiply fractions, multiply the tops together and the bottoms together.",
  (c) =>
    c.fr && c.fr.op === "×"
      ? [
          guess(
            (c.fr.n1 + c.fr.n2) / (c.fr.d1 + c.fr.d2),
            `(${c.fr.n1} + ${c.fr.n2}) / (${c.fr.d1} + ${c.fr.d2})`,
          ),
        ]
      : [],
  "Added the tops and the bottoms when multiplying",
);
slip(
  "forgotFlip",
  "conceptual",
  "high",
  "Dividing by a fraction means multiplying by its flip.",
  (c) =>
    c.fr && c.fr.op === "÷"
      ? [
          guess(
            (c.fr.n1 * c.fr.n2) / (c.fr.d1 * c.fr.d2),
            `${c.fr.n1}×${c.fr.n2} over ${c.fr.d1}×${c.fr.d2}`,
          ),
        ]
      : [],
  "Did not flip the second fraction",
);
slip(
  "flippedFirst",
  "conceptual",
  "high",
  "Only the fraction you divide by gets flipped.",
  (c) =>
    c.fr && c.fr.op === "÷" && c.fr.n1 !== 0
      ? [
          guess(
            (c.fr.d1 * c.fr.n2) / (c.fr.n1 * c.fr.d2),
            `${c.fr.d1}×${c.fr.n2} over ${c.fr.n1}×${c.fr.d2}`,
          ),
        ]
      : [],
  "Flipped the first fraction",
);
slip(
  "convertedWrongWay",
  "conceptual",
  "high",
  "Smaller units mean more of them; bigger units mean fewer. Decide which way you are going.",
  (c) => {
    const found = c.q.match(new RegExp(`^(${NUM}) [A-Za-z ]+ = how many`));
    const start = found ? num(found[1]) : Number.NaN;
    return Number.isFinite(start) && start !== 0 && Number.isFinite(c.ans) && c.ans !== 0
      ? [
          {
            ...guess(
              (start * start) / c.ans,
              `${fmt(start)} divided by the unit size instead of multiplied`,
            ),
            tolerance: 0.005,
          },
        ]
      : [];
  },
  "Converted in the wrong direction",
);
slip(
  "flippedRate",
  "conceptual",
  "high",
  "A unit rate is the amount for ONE item: divide the amount by the number of items.",
  (c) => {
    const found = c.q.match(/^(\d+) for (\d+) items?\./);
    return found ? [guess(Number(found[2]) / Number(found[1]), `${found[2]} ÷ ${found[1]}`)] : [];
  },
  "Flipped the rate",
);
slip(
  "additiveRatio",
  "conceptual",
  "high",
  "Equal ratios multiply or divide both parts by the same number. Adding changes the ratio.",
  (c) => {
    const found = c.q.match(/^(\d+):(\d+) = (\d+):□/);
    return found && found[1] !== found[2]
      ? [
          guess(
            Number(found[3]) + Number(found[2]) - Number(found[1]),
            `${found[3]} + (${found[2]} − ${found[1]})`,
          ),
        ]
      : [];
  },
  "Added or subtracted instead of scaling",
);
slip(
  "additiveEquivalent",
  "conceptual",
  "high",
  "To keep a fraction the same size, multiply the top and bottom by the same number.",
  (c) => {
    const found = c.q.match(/^(\d+)\/(\d+) = □\/(\d+)/);
    return found && found[2] !== found[3]
      ? [
          guess(
            Number(found[1]) + Number(found[3]) - Number(found[2]),
            `${found[1]} + (${found[3]} − ${found[2]})`,
          ),
        ]
      : [];
  },
  "Added to the top instead of multiplying",
);
slip(
  "flippedSlope",
  "conceptual",
  "high",
  "Slope is rise over run: the change in y goes on top.",
  (c) => {
    const found = c.q.match(
      /^Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\./,
    );
    if (!found) return [];
    const [x1, y1, x2, y2] = found.slice(1).map(Number);
    return y2 !== y1 ? [guess((x2 - x1) / (y2 - y1), `run ${x2 - x1} over rise ${y2 - y1}`)] : [];
  },
  "Flipped the slope: run over rise",
);
slip(
  "areaPerimeterMix",
  "conceptual",
  "high",
  "Area counts the squares inside. Perimeter is the distance around the edge.",
  (c) => {
    const area = c.q.match(/^Area of a rectangle with length (\d+) and width (\d+)\?/);
    if (area)
      return [guess(2 * (Number(area[1]) + Number(area[2])), `2 × (${area[1]} + ${area[2]})`)];
    const perimeter = c.q.match(/^Perimeter of a rectangle with length (\d+) and width (\d+)\?/);
    return perimeter
      ? [guess(Number(perimeter[1]) * Number(perimeter[2]), `${perimeter[1]} × ${perimeter[2]}`)]
      : [];
  },
  "Used the area idea for perimeter, or the reverse",
);
slip(
  "forgotHalf",
  "conceptual",
  "high",
  "A triangle is half of a rectangle with the same base and height.",
  (c) => {
    const found = c.q.match(/^Area of a triangle with base (\d+) and height (\d+)\?/);
    return found ? [guess(Number(found[1]) * Number(found[2]), `${found[1]} × ${found[2]}`)] : [];
  },
  "Forgot to take half",
);
slip(
  "doubledRadius",
  "conceptual",
  "high",
  "A radius squared means radius times radius.",
  (c) => {
    const found = c.q.match(/^A circle has radius (\d+)\. What number multiplies π/);
    return found ? [guess(2 * Number(found[1]), `2 × ${found[1]}`)] : [];
  },
  "Doubled the radius instead of squaring it",
);
slip(
  "leftoverPercent",
  "conceptual",
  "check",
  "Check what the question asks: the percent itself, not what remains.",
  (c) => {
    const found = c.q.match(/^What is (\d+)% of (\d+)\?/);
    return found && Number(found[1]) !== 50
      ? [
          guess(
            ((100 - Number(found[1])) * Number(found[2])) / 100,
            `${100 - Number(found[1])}% of ${found[2]}`,
          ),
        ]
      : [];
  },
  "Found the part left over instead of the percent",
);

// Calculation slips: the method is right, the arithmetic is not.
slip(
  "carryBorrow",
  "calculation",
  "high",
  "Check each place from right to left. Did a ten move to the next place?",
  (c) => {
    if (
      !(c.op === "+" || c.op === "−") ||
      !Number.isInteger(c.a) ||
      !Number.isInteger(c.b) ||
      !Number.isFinite(c.ans) ||
      c.a < 0 ||
      c.b < 0 ||
      c.ans < 0
    )
      return [];
    return [10, 100, 1000]
      .flatMap((step) => [c.ans + step, c.ans - step])
      .map((value) =>
        guess(
          value,
          `${fmt(value)} differs from the correct total by exactly ${fmt(Math.abs(value - c.ans))}, so every other place matches`,
        ),
      );
  },
  "A ten (or hundred) was carried or borrowed wrongly",
);
slip(
  "nearMiss",
  "calculation",
  "check",
  "You are very close. Check your last step.",
  (c) =>
    Number.isInteger(c.ans) && Math.abs(c.ans) >= DIAGNOSIS.nearMissMinimum
      ? [
          guess(c.ans + 1, "one more than a correct total"),
          guess(c.ans - 1, "one fewer than a correct total"),
        ]
      : [],
  "Off by one",
);
slip(
  "transposed",
  "calculation",
  "check",
  "Read your answer back, digit by digit, against your work.",
  (c) => {
    if (!Number.isInteger(c.ans) || Math.abs(c.ans) < 10) return [];
    const digits = String(Math.abs(c.ans)).split("");
    const out = [];
    for (let i = 0; i < digits.length - 1; i += 1) {
      if (digits[i] === digits[i + 1]) continue;
      const swapped = [...digits];
      [swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]];
      if (swapped[0] !== "0")
        out.push(
          guess(
            Math.sign(c.ans) * Number(swapped.join("")),
            `${Math.abs(c.ans)} with two neighbouring digits swapped`,
          ),
        );
    }
    return out;
  },
  "Two neighbouring digits swapped",
);

const BY_ID = new Map(SLIPS.map((entry) => [entry.id, entry]));
export const SLIP_CATALOG = Object.freeze(
  SLIPS.map(({ id, category, label }) => Object.freeze({ id, category, named: label === null })),
);
export const isDiagnosisId = (id) => BY_ID.has(id);
export const detectorLabel = (id) => {
  const entry = BY_ID.get(id);
  return entry ? (entry.label ? t(entry.label) : mistakeCategoryLabel(id)) : "";
};
export const detectorHint = (id) => (BY_ID.has(id) ? t(BY_ID.get(id).hint) : "");
export const detectorCategory = (id) => BY_ID.get(id)?.category || "unsure";
// English keys this module passes to t(), for Spanish coverage checks.
export const diagnosisStrings = () => [
  ...new Set([
    ...Object.values(TEXT),
    ...SLIPS.map((entry) => entry.hint),
    ...SLIPS.filter((entry) => entry.label).map((entry) => entry.label),
  ]),
];

// ---- Reading an item ----------------------------------------------------------------------------------------
function context(item, raw) {
  const q = String(item?.expr || item?.question || "")
    .replaceAll(",", "")
    .trim();
  const c = { item, q, raw, sub: toValue(raw), ans: toValue(item?.answers?.[0]) };
  const arithmetic = q.match(ARITH);
  if (arithmetic)
    Object.assign(c, { a: num(arithmetic[1]), op: arithmetic[2], b: num(arithmetic[3]) });
  const fraction = q.match(FRACTION);
  if (fraction)
    c.fr = {
      n1: Number(fraction[1]),
      d1: Number(fraction[2]),
      op: fraction[3],
      n2: Number(fraction[4]),
      d2: Number(fraction[5]),
    };
  const missing = q.match(MISSING);
  if (missing) c.missing = { a: Number(missing[1]), total: Number(missing[2]) };
  c.eq = readEquation(q);
  return c;
}

function readEquation(q) {
  let m = q.match(/^(\d+)([a-z]) = (-?\d+)\. Find/);
  if (m) return { kind: "ax=c", a: Number(m[1]), c: Number(m[3]) };
  m = q.match(/^([a-z]) ÷ (\d+) = (-?\d+)\./);
  if (m) return { kind: "x÷b=c", b: Number(m[2]), c: Number(m[3]) };
  m = q.match(/^([a-z]) ([+−]) (\d+) = (-?\d+)\./);
  if (m) return { kind: "x±b=c", sign: m[2] === "+" ? 1 : -1, b: Number(m[3]), c: Number(m[4]) };
  m = q.match(/^(\d+)([a-z]) ([+−]) (\d+) = (-?\d+)\./);
  if (m)
    return {
      kind: "ax±b=c",
      a: Number(m[1]),
      sign: m[3] === "+" ? 1 : -1,
      b: Number(m[4]),
      c: Number(m[5]),
    };
  return null;
}

// Basic facts: a table fact or a two-operand sum or difference to 20.
export function isBasicFact(item) {
  const fact = String(item?.question || "")
    .replaceAll(",", "")
    .match(/^(\d+) ([+−×÷]) (\d+) = \?$/);
  if (!fact || !["fact", "factPool"].includes(item.generator)) return false;
  const [a, b] = [Number(fact[1]), Number(fact[3])];
  return "×÷".includes(fact[2]) ? a <= 12 && b <= 12 : a <= 20 && b <= 20;
}
const isRapid = (item, responseMs) =>
  Number.isFinite(responseMs) &&
  responseMs < (isBasicFact(item) ? DIAGNOSIS.rapidMsFact : DIAGNOSIS.rapidMsOther);

// Slips an item could expose, as the wrong answers each would produce. Used to choose practice that tests a
// misconception the learner showed, and to check a repair actually changes the item the misconception would break.
export function vulnerabilities(item) {
  const c = context(item, "");
  if (!Number.isFinite(c.ans) && !c.fr && !c.missing && !c.eq) return [];
  const out = [];
  for (const entry of SLIPS) {
    const values = entry
      .predict(c)
      .filter((guessed) =>
        guessed.text !== undefined
          ? guessed.text !== String(item.answers?.[0]).replace(/\s+/g, "")
          : Number.isFinite(guessed.value) && !same(guessed.value, c.ans),
      );
    if (values.length)
      out.push({
        id: entry.id,
        category: entry.category,
        values: values.map((guessed) => guessed.text ?? guessed.value),
      });
  }
  return out;
}
export const isVulnerableTo = (item, id) => vulnerabilities(item).some((entry) => entry.id === id);

function matches(c) {
  const found = [];
  const seen = new Set();
  const add = (entry, guessed) => {
    if (seen.has(entry.id)) return;
    seen.add(entry.id);
    found.push({
      id: entry.id,
      category: entry.category,
      confidence: guessed.confidence || entry.confidence,
      facts: guessed.facts,
    });
  };
  // mistake-notes.js is authoritative for the slips it names.
  const named = classifyMistake(c.item, c.raw);
  if (named && BY_ID.has(named.id))
    add(BY_ID.get(named.id), { facts: BY_ID.get(named.id).predict(c)[0]?.facts || named.label });
  const rawText = String(c.raw).trim().replaceAll("−", "-").replace(/\s+/g, "");
  for (const entry of SLIPS) {
    for (const guessed of entry.predict(c)) {
      const hit =
        guessed.text !== undefined
          ? guessed.text === rawText
          : Number.isFinite(guessed.value) &&
            same(guessed.value, c.sub, guessed.tolerance) &&
            !same(guessed.value, c.ans);
      if (hit) {
        add(entry, guessed);
        break;
      }
    }
  }
  return found;
}

const BASIC_FACT_DEMOTED = new Set(["nearMiss", "transposed", "oneGroupOff"]);
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
};

// What the learner's own record says about this skill and this exact problem.
function history(item, ctx) {
  const recent = Array.isArray(ctx.record?.recent) ? ctx.record.recent : [];
  const sig = itemSignature(item.question);
  const independent = recent.filter((entry) => entry.independent);
  const correct = independent.filter((entry) => entry.correct).length;
  const known =
    independent.length >= DIAGNOSIS.knownIndependent &&
    correct / independent.length >= DIAGNOSIS.knownAccuracy;
  const samples = recent
    .filter((entry) => entry.paceEligible && Number.isFinite(entry.responseMs))
    .map((entry) => entry.responseMs);
  const medianMs = Number.isFinite(ctx.medianMs)
    ? ctx.medianMs
    : samples.length >= DIAGNOSIS.minPaceSamples
      ? median(samples)
      : null;
  return {
    priorCorrect: recent.filter((entry) => entry.sig === sig && entry.correct).length,
    known,
    independent: independent.length,
    correct,
    medianMs,
  };
}

const result = (category, confidence, reason, evidence, extra = {}) => ({
  category,
  confidence,
  reason,
  evidence,
  detector: null,
  misconception: null,
  label: categoryName(category),
  ...extra,
});

// ctx: { record (the skill's tutor record), responseMs, medianMs }. Returns null for a correct answer.
export function diagnosisFor(item, submittedRaw, ctx = {}) {
  if (!item || !Array.isArray(item.answers) || !item.answers.length)
    return result("unsure", "check", say("reasonBlank"), []);
  const submitted = String(submittedRaw ?? "").trim();
  const c = context(item, submitted);
  const answerKey = (value) =>
    String(value).trim().replaceAll("−", "-").replace(/\s+/g, "").toLowerCase();
  if (
    item.answers.some((answer) => answerKey(answer) === answerKey(submitted)) ||
    (Number.isFinite(c.sub) && item.answers.some((answer) => same(toValue(answer), c.sub)))
  )
    return null;
  if (!submitted)
    return result("unsure", "check", say("reasonBlank"), [{ fact: "answer", submitted: "" }]);

  const rapid = isRapid(item, ctx.responseMs);
  const evidence = [{ fact: "answer", submitted, expected: String(item.answers[0]) }];
  if (
    Number.isFinite(c.sub) &&
    Number.isFinite(c.ans) &&
    c.ans !== 0 &&
    Math.abs(c.sub / c.ans) > DIAGNOSIS.absurdFactor &&
    Math.abs(c.sub) > 100
  )
    return result("unsure", "check", say("reasonAbsurd", { submitted }), evidence);

  let found = matches(c);
  const dropped = found.length && rapid ? found.filter((entry) => entry.confidence !== "high") : [];
  if (rapid) found = found.filter((entry) => entry.confidence === "high");
  const hist = history(item, ctx);
  const basic = isBasicFact(item);
  if (basic) {
    // A near miss on a basic fact is a recall question, not an arithmetic one.
    const demoted = found.filter((entry) => BASIC_FACT_DEMOTED.has(entry.id));
    found = found.filter((entry) => !BASIC_FACT_DEMOTED.has(entry.id));
    if (demoted.length && !found.length && !hist.priorCorrect && !hist.known)
      return result("unsure", "check", say("reasonNone", { submitted }), [
        ...evidence,
        { fact: "pattern", id: demoted[0].id },
      ]);
  }
  if (found.length) {
    const high = found.filter((entry) => entry.confidence === "high");
    const pool = high.length ? high : found;
    if (new Set(pool.map((entry) => entry.category)).size > 1)
      return result("unsure", "check", say("reasonConflict", { submitted }), [
        ...evidence,
        ...pool.map((entry) => ({ fact: "pattern", id: entry.id })),
      ]);
    const top = pool[0];
    const label = detectorLabel(top.id);
    const reason = say(top.category === "conceptual" ? "reasonConceptual" : "reasonCalculation", {
      submitted,
      label,
      facts: top.facts,
    });
    return result(
      top.category,
      top.confidence,
      reason,
      [...evidence, { fact: "pattern", id: top.id, text: top.facts }],
      { detector: top.id, misconception: top.id, label },
    );
  }
  if (rapid)
    return result("unsure", "check", say("reasonRapid"), [
      ...evidence,
      {
        fact: "timing",
        responseMs: ctx.responseMs,
        rapid: true,
        ...(dropped.length ? { skipped: dropped.map((entry) => entry.id) } : {}),
      },
    ]);

  if (basic && hist.priorCorrect > 0)
    return result("fluency", "high", say("reasonRecall", { count: hist.priorCorrect, submitted }), [
      ...evidence,
      { fact: "history", priorCorrect: hist.priorCorrect },
    ]);
  if (basic && hist.known)
    return result(
      "fluency",
      "check",
      say("reasonKnown", { correct: hist.correct, total: hist.independent, submitted }),
      [...evidence, { fact: "history", independent: hist.independent, correct: hist.correct }],
    );
  if (
    hist.known &&
    Number.isFinite(ctx.responseMs) &&
    Number.isFinite(hist.medianMs) &&
    ctx.responseMs > DIAGNOSIS.slowFactor * hist.medianMs
  )
    return result(
      "fluency",
      "check",
      say("reasonSlow", {
        median: Math.round(hist.medianMs / 100) / 10,
        seconds: Math.round(ctx.responseMs / 100) / 10,
      }),
      [
        ...evidence,
        {
          fact: "timing",
          responseMs: ctx.responseMs,
          medianMs: hist.medianMs,
          independent: hist.independent,
          correct: hist.correct,
        },
      ],
    );
  return result("unsure", "check", say("reasonNone", { submitted }), evidence);
}

// ---- Per-skill roll-up --------------------------------------------------------------------------------------
// Reads the learner's notebook of wrong answers for one skill (the only place the typed wrong answer is kept) and
// counts the labels. A dominant cause needs several labelled mistakes and a clear majority; otherwise it says so.
export function diagnoseSkill(tutor, skill, now = Date.now(), { last = DIAGNOSIS.window } = {}) {
  const key = skillKey(skill);
  const record = tutor?.records?.[key] || {};
  const entries = (tutor?.mistakes || [])
    .filter((entry) => entry.key === key && (entry.original?.question || entry.question))
    .sort((x, y) => (y.at || 0) - (x.at || 0))
    .slice(0, last);
  const counts = { conceptual: 0, calculation: 0, fluency: 0, unsure: 0 };
  const byId = new Map();
  let high = 0;
  for (const entry of entries) {
    const original = entry.original?.answers?.length
      ? entry.original
      : {
          question: entry.question,
          answers: [entry.expectedAnswer || ""].filter(Boolean),
          kind: "number",
        };
    const item = { ...original, generator: skill.generator };
    const diagnosis = diagnosisFor(item, entry.studentInput || entry.submitted || "", {
      record,
      now,
    });
    if (!diagnosis) continue;
    counts[diagnosis.category] += 1;
    if (diagnosis.category !== "unsure" && diagnosis.confidence === "high") high += 1;
    if (diagnosis.misconception)
      byId.set(diagnosis.misconception, {
        id: diagnosis.misconception,
        category: diagnosis.category,
        count: (byId.get(diagnosis.misconception)?.count || 0) + 1,
      });
  }
  const considered = counts.conceptual + counts.calculation + counts.fluency + counts.unsure;
  const labelled = considered - counts.unsure;
  const top = ["conceptual", "calculation", "fluency"].sort((x, y) => counts[y] - counts[x])[0];
  const share = labelled ? counts[top] / labelled : 0;
  const dominant =
    labelled < DIAGNOSIS.minLabelled
      ? "not-enough-evidence"
      : share >= DIAGNOSIS.dominantShare
        ? top
        : "mixed";
  const misconceptions = [...byId.values()]
    .sort((x, y) => y.count - x.count || x.id.localeCompare(y.id))
    .map((entry) => ({ ...entry, label: detectorLabel(entry.id) }));
  const topSlip =
    dominant !== "not-enough-evidence" && dominant !== "mixed"
      ? misconceptions.find((entry) => entry.category === dominant) || null
      : null;
  const reason =
    dominant === "not-enough-evidence"
      ? say("dominantNone")
      : dominant === "mixed"
        ? say("dominantMixed")
        : say("dominantFound", { count: counts[dominant], labelled, name: categoryName(dominant) });
  return {
    key,
    window: last,
    considered,
    counts,
    labelled,
    dominant,
    share: Math.round(share * 100) / 100,
    top: topSlip,
    misconceptions,
    reason,
    confidence: ["conceptual", "calculation", "fluency"].includes(dominant)
      ? high * 2 >= labelled
        ? "high"
        : "check"
      : null,
    evidence: {
      kind: "observed",
      wrongAnswersRead: considered,
      labelled,
      unsure: counts.unsure,
      highConfidence: high,
    },
  };
}
