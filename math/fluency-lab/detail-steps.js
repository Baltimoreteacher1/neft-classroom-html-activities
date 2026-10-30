// Number-specific guided steps that say WHAT to do and WHY, in plain words. They cover skills whose authored
// steps were generic ("Find the scale factor.") or borrowed decimal wording for whole numbers. Each builder reads
// the problem's own numbers and returns the steps that come BEFORE the worked line, which is appended last
// (at most 3 + 1 steps, 4 in all). A step may name a product to compute, but never states the answer itself.
const n = (text) => Number(String(text).replaceAll(",", "").replace("−", "-"));
const fmt = (value) => value.toLocaleString("en-US");
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a / gcd(a, b)) * b;
const PLACE_SIZES = { ten: 10, hundred: 100, thousand: 1000, "ten-thousand": 10000, "hundred-thousand": 100000 };
const DECIMAL_NAMES = ["", "tenths", "hundredths", "thousandths"];
const places = (text) => (String(text).split(".")[1] || "").length;

// Number-sentence steps that end on the answer line; the learner types each partial result ("Your turn").
const ending = (steps) => Object.assign(steps, { final: true });

function wholeAdd(p, q) {
  const [x, y] = [Math.max(p, q), Math.min(p, q)];
  const need = 10 - x;
  if (x < 10 && y > need && y <= 10) return ending([`${x} + ${need} = 10`, `10 + ${y - need} = ${x + y}`]);
  const tens = Math.floor(y / 10) * 10;
  const ones = x % 10;
  if (!tens) {
    if (x < 10) return ending([`Start at the bigger number, ${x}.`, `Count on ${y} more: ${x} + ${y} = ${x + y}`]);
    if (!ones) return [`${fmt(x)} has no ones. Put the ${y} ones in the ones place.`];
    return ending([`${ones} + ${y} = ${ones + y}`, `${fmt(x - ones)} + ${ones + y} = ${fmt(x + y)}`]);
  }
  if (!(y % 10)) return [`${fmt(x)} has ${Math.floor(x / 10)} tens. ${fmt(y)} has ${y / 10} tens.`, `Add the tens: ${Math.floor(x / 10)} + ${y / 10} = ${Math.floor(x / 10) + y / 10}`];
  return ending([`${fmt(x)} + ${fmt(tens)} = ${fmt(x + tens)}`, `${fmt(x + tens)} + ${y % 10} = ${fmt(x + y)}`]);
}

function wholeSub(a, b) {
  const ones = a % 10;
  if (b < 10 && b > ones && ones > 0) return ending([`${a} − ${ones} = ${a - ones}`, `${a - ones} − ${b - ones} = ${a - b}`]);
  const tens = Math.floor(b / 10) * 10;
  if (!tens) {
    if (!ones) return [`${fmt(a)} has no ones. Trade 1 ten for 10 ones, then take away ${b}.`];
    return ending([`${ones} − ${b} = ${ones - b}`, `${fmt(a - ones)} + ${ones - b} = ${fmt(a - b)}`]);
  }
  if (!(b % 10)) return [`${fmt(a)} has ${Math.floor(a / 10)} tens. ${fmt(b)} has ${b / 10} tens.`, `Take away the tens: ${Math.floor(a / 10)} − ${b / 10} = ${Math.floor(a / 10) - b / 10}`];
  return ending([`${fmt(a)} − ${fmt(tens)} = ${fmt(a - tens)}`, `${fmt(a - tens)} − ${b % 10} = ${fmt(a - b)}`]);
}

function decimalStep(textA, op, textB) {
  const width = Math.max(places(textA), places(textB));
  const [a, b] = [n(textA).toFixed(width), n(textB).toFixed(width)];
  return [`Write both with ${width} decimal place${width === 1 ? "" : "s"}: ${a} ${op} ${b}. Extra zeros do not change the value.`, `${op === "+" ? "Add" : "Subtract"} one column at a time. Start with the ${DECIMAL_NAMES[width] || "last place"}.`, `Put the decimal point straight down in the answer.`];
}

function fractionAddSub(a, b, op, c, d) {
  const common = lcm(b, d);
  const verb = op === "+" ? "Add" : "Subtract";
  if (b === d) return [`The bottoms are both ${b}. The pieces are the same size.`, `${verb} the tops: ${a} ${op} ${c}. Keep ${b} on the bottom.`, `Simplify: divide the top and bottom by a shared factor.`];
  return [`The bottoms are ${b} and ${d}. Use a common denominator: ${common}.`, `Rename ${a}/${b} as ${(a * common) / b}/${common} and ${c}/${d} as ${(c * common) / d}/${common}. Multiply top and bottom by the same number.`, `${verb} the new tops: ${(a * common) / b} ${op} ${(c * common) / d}. Keep ${common} on the bottom, then simplify.`];
}

const fractionOfWhole = (a, b, w) => [`Split ${w} into ${b} equal groups: ${w} ÷ ${b}.`, `One group is 1/${b} of ${w}.`, `Take ${a} groups: multiply ${a} × the size of 1 group.`];

const SQUARES = Array.from({ length: 21 }, (_, i) => i * i);
const signWord = (value) => (value < 0 ? "negative" : "positive");

// [pattern, builder(...captures)] — first match wins. Add/subtract keep clear authored
// place-value steps; multiplication uses the number-specific tens/partial-product explanation below.
const DETAIL = [
  [/^(\d[\d,]*) \+ (\d[\d,]*) = \?$/, (a, b) => wholeAdd(n(a), n(b))],
  [/^(\d[\d,]*) − (\d[\d,]*) = \?$/, (a, b) => wholeSub(n(a), n(b))],
  [/^(\d[\d,]*\.\d+|\d+\.\d*|\.\d+) ([+−]) (\d[\d,]*\.?\d*) = \?$/, decimalStep],
  [/^(\d[\d,]*) ([+−]) (\d[\d,]*\.\d+) = \?$/, decimalStep],
  [/^(\d[\d,]*) × (\d[\d,]*) = \?$/, (a, b) => {
    const [x, y] = [n(a), n(b)];
    const tens = Math.floor(y / 10) * 10;
    if (y < 10) return null;
    if (y % 10 === 0) return [`${fmt(y)} is ${fmt(y / 10)} ${y === 10 ? "ten" : "tens"}. Multiply by ${fmt(y / 10)}, then by 10.`, `${fmt(x)} × ${fmt(y / 10)} = ${fmt(x * (y / 10))}`, `Now multiply by 10. Ones become tens: each digit moves one place left.`];
    // Two-digit by two-digit: split the first factor, as the area model beside the problem does.
    if (x >= 10 && x < 100 && x % 10 !== 0) {
      const xTens = Math.floor(x / 10) * 10;
      return ending([`Split ${fmt(x)} into ${fmt(xTens)} + ${x % 10}.`, `${fmt(xTens)} × ${fmt(y)} = ${fmt(xTens * y)}`, `${x % 10} × ${fmt(y)} = ${fmt((x % 10) * y)}`, `Add the two parts: ${fmt(xTens * y)} + ${fmt((x % 10) * y)} = ${fmt(x * y)}`]);
    }
    return ending([`Split ${fmt(y)} into ${fmt(tens)} + ${y % 10}.`, `${fmt(tens)} × ${fmt(x)} = ${fmt(tens * x)}`, `${y % 10} × ${fmt(x)} = ${fmt((y % 10) * x)}`, `Add the two parts: ${fmt(tens * x)} + ${fmt((y % 10) * x)} = ${fmt(x * y)}`]);
  }],
  [/^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = \?$/, (a, b, op, c, d) => fractionAddSub(n(a), n(b), op, n(c), n(d))],
  [/^(\d+)\/(\d+) × (\d+)\/(\d+) = \?$/, (a, b, c, d) => [`Multiply the tops (numerators): ${a} × ${c}.`, `Multiply the bottoms (denominators): ${b} × ${d}.`, `Write the first product over the second. Simplify with a shared factor.`]],
  [/^(\d+)\/(\d+) ÷ (\d+)\/(\d+) = \?$/, (a, b, c, d) => [`Keep the first fraction: ${a}/${b}.`, `Change ÷ to × and flip ${c}/${d} to ${d}/${c}. The flip undoes dividing.`, `Multiply the tops (${a} × ${d}) and the bottoms (${b} × ${c}). Then simplify.`]],
  [/^What is (\d+)\/(\d+) of (\d+)\?$/, (a, b, w) => fractionOfWhole(a, b, w)],
  [/^(\d+)\/(\d+) ___ (\d+)\/(\d+)$/, (a, b, c, d) => [`Cross-multiply: top of one times bottom of the other. The pieces are different sizes.`, `Find ${a} × ${d} and ${c} × ${b}.`, `The bigger product goes with the bigger fraction. Choose the symbol.`]],
  [/^(\d+)\/(\d+) = (\d+)\/□$/, (a, b, c) => (n(c) % n(a) === 0 ? [`Look at the tops: ${a} became ${c}. What times ${a} makes ${c}?`, `The top was multiplied by ${n(c) / n(a)}.`, `Multiply the bottom by ${n(c) / n(a)} too: ${b} × ${n(c) / n(a)}. This keeps the fraction equal.`] : null)],
  [/^Area of a rectangle with length (\d+) and width (\d+)\?$/, (l, w) => [`Length is ${l}. Width is ${w}. Area counts the squares inside.`, `There are ${w} rows of ${l} squares. Multiply ${l} × ${w}.`]],
  [/^Perimeter of a rectangle with length (\d+) and width (\d+)\?$/, (l, w) => [`Perimeter is the distance around. Length is ${l}. Width is ${w}.`, `Add one length and one width: ${l} + ${w}.`, `A rectangle has two of each side. Double the sum.`]],
  [/^Volume of a rectangular prism: (\d+) × (\d+) × (\d+)\?$/, (l, w, h) => [`Volume counts the cubes inside. Length ${l}, width ${w}, height ${h}.`, `One flat layer holds ${l} × ${w} cubes.`, `There are ${h} layers. Multiply the layer by ${h}.`]],
  [/^Round ([\d,]+) to the nearest ([a-z-]+)\.$/, (value, place) => {
    const size = PLACE_SIZES[place];
    if (!size) return null;
    const digits = String(n(value));
    const keep = digits.length - String(size).length;
    const [here, next] = [digits[keep], digits[keep + 1]];
    if (here === undefined || next === undefined) return null;
    return [`The ${place}s digit of ${value} is ${here}. Round to this place.`, `Look at the digit to its right: ${next}. It decides up or down.`, Number(next) >= 5 ? `${next} is 5 or more, so round up. Digits after the ${place}s place become 0.` : `${next} is 4 or less, so round down. Digits after the ${place}s place become 0.`];
  }],
  [/^(\d+) quarters \+ (\d+) dimes \+ (\d+) nickels \+ (\d+) pennies/, (q, d, k, p) => [`Coin values: quarter 25¢, dime 10¢, nickel 5¢, penny 1¢.`, `Find each group: ${q} × 25¢, ${d} × 10¢, ${k} × 5¢, ${p} × 1¢.`, `Add the four amounts.`]],
  [/^Evaluate (\d*)x ([+−]) (\d+) when x = (-?\d+)\.$/, (c, op, k, v) => [`Replace x with ${v}: ${c || 1}(${v}) ${op} ${k}. Parentheses mean multiply.`, `Multiply first: ${c || 1} × (${v}). Multiplication comes before ${op === "+" ? "adding" : "subtracting"}.`, `Then ${op === "+" ? "add" : "subtract"} ${k}.`]],
  [/^If y = (-?\d*)x ([+−]) (\d+), find y when x = (-?\d+)\.$/, (c, op, k, v) => [`Replace x with ${v}: y = ${c || 1}(${v}) ${op} ${k}.`, `Multiply first: ${c || 1} × (${v}). Multiplication comes before ${op === "+" ? "adding" : "subtracting"}.`, `Then ${op === "+" ? "add" : "subtract"} ${k} to get y.`]],
  [/^x ([+−]) (\d+) = (-?\d+)\. Find x\.$/, (op, k, r) => [`Get x alone. Right now ${k} is being ${op === "+" ? "added to" : "taken from"} x.`, `Undo it: ${op === "+" ? "subtract" : "add"} ${k} on both sides. This keeps the equation balanced.`, `Work out ${r} ${op === "+" ? "−" : "+"} ${k} to find x.`]],
  [/^(\d+)x ([+−]) (\d+) = (-?\d+)\. Find x\.$/, (c, op, k, r) => [`Get x alone. Undo the ${op === "+" ? "adding" : "subtracting"} first: ${op === "+" ? "subtract" : "add"} ${k} on both sides.`, `Work out ${r} ${op === "+" ? "−" : "+"} ${k}. Now only ${c}x is left.`, `${c}x means ${c} times x. Divide both sides by ${c}.`]],
  [/^(-?\d+) × \((-?\d+)\) = \?$|^(-?\d+) × (-?\d+) = \?$/, (...m) => {
    const [a, b] = m[0] !== undefined ? [n(m[0]), n(m[1])] : [n(m[2]), n(m[3])];
    const same = (a < 0) === (b < 0);
    if (a === 0 || b === 0) return [`Look for a zero first: ${a} × ${b < 0 ? `(${b})` : b} has a zero factor.`, "Zero times any number is 0. There is no sign to decide."];
    return [`Size first: multiply ${Math.abs(a)} × ${Math.abs(b)}, ignoring the signs.`, `Sign next: ${signWord(a)} × ${signWord(b)}. ${same ? "Same signs make a positive answer." : "Different signs make a negative answer."}`];
  }],
  [/^√(\d+) = \?$/, (value) => {
    const target = n(value);
    const low = SQUARES.filter((s) => s <= target).at(-1);
    const high = SQUARES.find((s) => s >= target);
    if (low === undefined || high === undefined) return null;
    return [`A square root is the number that multiplies by itself to make ${value}.`, low === high ? `${value} is a perfect square. Think of your times tables.` : `${value} is between the perfect squares ${low} and ${high}. The root is between their roots.`, `Try a whole number times itself. Adjust up or down until it makes ${value}.`];
  }],
  [/^x \+ y = (-?\d+) and x − y = (-?\d+)\. Find x\.$/, (s, d) => [`Add the two equations: (x + y) + (x − y) and ${s} + (${d}). Equal amounts added keep both sides equal.`, `The y and −y cancel. Only 2x is left on the left side.`, `Divide the right side by 2 to find x. 2x means 2 times x.`]],
  [/^Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.$/, (x1, y1, x2, y2) => [`Slope tells how steep a line is: rise ÷ run.`, `Rise is the change in y: ${y2} − (${y1}). Run is the change in x: ${x2} − (${x1}). Subtract in the same order.`, `Divide the rise by the run to get the slope.`]],
  [/^What is (\d+)% of (\d+)\?$/, (p, w) => [`Percent means "out of 100", so ${p}% is ${p}/100.`, `"Of" means multiply: ${p}/100 × ${w}.`, n(p) === 10 ? `Shortcut: 10% is one tenth, so 10% of ${w} is ${w} ÷ 10.` : n(p) % 10 === 0 ? `Shortcut: 10% of ${w} is ${w} ÷ 10. Build ${p}% from 10% pieces.` : `Shortcut: 1% is ${w} ÷ 100. Multiply that by ${p}.`]],
  [/^(\d[\d,.]*) for (\d+) items\. How much for 1 item\?$/, (total, items) => [`A unit rate is the amount for 1 item.`, `Split ${total} into ${items} equal shares: ${total} ÷ ${items}.`, `One share is the amount for 1 item.`]],
  [/^(\d+) of (\d+) equal sections are winning sections\./, (a, b) => [`Probability compares wanted outcomes to all possible outcomes.`, `Wanted: ${a} winning sections. All possible: ${b} sections.`, `Write wanted over all as a fraction. Simplify with a shared factor.`]],
  [/^A right triangle has legs (\d+) and (\d+)\./, (a, b) => [`In a right triangle, leg² + leg² = hypotenuse². This works only for right triangles.`, `Square each leg: ${a} × ${a} and ${b} × ${b}.`, `Add the two squares to get the hypotenuse squared. Then take the square root.`]],
  [/^(\d+)\^(\d+) = \?$/, (base, exp) => [`The exponent ${exp} tells how many times ${base} is a factor.`, `Write it out: ${Array(Math.min(n(exp), 6)).fill(base).join(" × ")}${n(exp) > 6 ? " …" : ""}.`, `Multiply from left to right, one pair at a time.`]],
  [/^A circle has radius (\d+)\./, (r) => [`The area of a circle is π × r × r: π times the radius squared.`, `The radius is ${r}, so r × r = ${r} × ${r}.`, `Stop at that product. The answer is the number that multiplies π.`]],
];

// Steps ending on the worked line, or null when no detail builder matches.
export function detailSteps(item) {
  // Whole-number add/subtract/multiply keep a generator's own place-value steps; only the borrowed decimal
  // wording and one-line fallbacks are replaced.
  const authoredFine = item.steps.length >= 2 && !/decimal/i.test(item.steps.join(" "));
  for (const [index, [pattern, build]] of DETAIL.entries()) {
    const match = item.question.match(pattern);
    if (!match) continue;
    if (index < 2 && authoredFine) return null;
    const steps = build(...match.slice(1));
    return steps ? (steps.final ? [...steps] : [...steps, item.explanation]) : null;
  }
  return null;
}
