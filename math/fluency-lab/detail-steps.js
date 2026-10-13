// Number-specific guided steps that say WHAT to do and WHY, in plain words. They cover skills whose authored
// steps were generic ("Find the scale factor.") or borrowed decimal wording for whole numbers. Each builder reads
// the problem's own numbers and returns the steps that come BEFORE the worked line, which is appended last
// (at most 3 + 1 steps). A step may name a product to compute, but never states the answer itself.
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
    if (x < 10) return ending([`Start at the bigger number, ${x}. Counting on from the bigger number is fewer counts.`, `Count on ${y} more: ${x} + ${y} = ${x + y}`]);
    if (!ones) return [`${fmt(x)} is whole tens with no ones, so the ${y} ones just join it in the ones place.`];
    return ending([`${ones} + ${y} = ${ones + y}`, `${fmt(x - ones)} + ${ones + y} = ${fmt(x + y)}`]);
  }
  if (!(y % 10)) return [`${fmt(x)} has ${Math.floor(x / 10)} tens and ${fmt(y)} is ${y / 10} tens. Only the tens change, so add the tens digits.`, `Add the tens: ${Math.floor(x / 10)} + ${y / 10} = ${Math.floor(x / 10) + y / 10}`];
  return ending([`${fmt(x)} + ${fmt(tens)} = ${fmt(x + tens)}`, `${fmt(x + tens)} + ${y % 10} = ${fmt(x + y)}`]);
}

function wholeSub(a, b) {
  const ones = a % 10;
  if (b < 10 && b > ones && ones > 0) return ending([`${a} − ${ones} = ${a - ones}`, `${a - ones} − ${b - ones} = ${a - b}`]);
  const tens = Math.floor(b / 10) * 10;
  if (!tens) {
    if (!ones) return [`${fmt(a)} has no ones, so trade 1 ten for 10 ones. Now there are enough ones to take ${b} away.`];
    return ending([`${ones} − ${b} = ${ones - b}`, `${fmt(a - ones)} + ${ones - b} = ${fmt(a - b)}`]);
  }
  if (!(b % 10)) return [`${fmt(a)} has ${Math.floor(a / 10)} tens and ${fmt(b)} is ${b / 10} tens. Only the tens change, so take away the tens digits.`, `Take away the tens: ${Math.floor(a / 10)} − ${b / 10} = ${Math.floor(a / 10) - b / 10}`];
  return ending([`${fmt(a)} − ${fmt(tens)} = ${fmt(a - tens)}`, `${fmt(a - tens)} − ${b % 10} = ${fmt(a - b)}`]);
}

function decimalStep(textA, op, textB) {
  const width = Math.max(places(textA), places(textB));
  const [a, b] = [n(textA).toFixed(width), n(textB).toFixed(width)];
  return [`Write both numbers with ${width} decimal place${width === 1 ? "" : "s"}: ${a} ${op} ${b}. Extra zeros do not change the value, and matching places lets the digits line up.`, `${op === "+" ? "Add" : "Subtract"} one column at a time from the right, starting with the ${DECIMAL_NAMES[width] || "last place"}. Each column is the same kind of unit, so they can be combined.`, `Put the decimal point in the answer straight below the points above, so every digit keeps its place value.`];
}

function fractionAddSub(a, b, op, c, d) {
  const common = lcm(b, d);
  const verb = op === "+" ? "Add" : "Subtract";
  if (b === d) return [`The bottoms are both ${b}, so the pieces are the same size and can be counted together.`, `${verb} the tops: ${a} ${op} ${c}. Keep ${b} on the bottom, because the size of the pieces does not change.`, `Simplify by dividing the top and bottom by a number they share, so the fraction is in lowest terms.`];
  return [`The bottoms are ${b} and ${d}. Pieces of different sizes cannot be combined, so find a size both fit: ${common}.`, `Rename ${a}/${b} as ${(a * common) / b}/${common} and ${c}/${d} as ${(c * common) / d}/${common}. Multiplying the top and bottom by the same number keeps each value equal.`, `${verb} the new tops: ${(a * common) / b} ${op} ${(c * common) / d}. Keep ${common} on the bottom, then simplify.`];
}

const fractionOfWhole = (a, b, w) => [`The bottom ${b} says to split ${w} into ${b} equal groups: ${w} ÷ ${b}.`, `That quotient is the size of 1 group, which is 1/${b} of ${w}.`, `The top ${a} says to take ${a} of those groups, so multiply ${a} × the size of 1 group.`];

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
    if (y % 10 === 0) return [`${fmt(y)} is ${fmt(y / 10)} tens, so multiply by ${fmt(y / 10)} first and then by 10.`, `Work out ${fmt(x)} × ${fmt(y / 10)} = ${fmt(x * (y / 10))}.`, `Multiply that by 10 by shifting every digit one place left, because each ten is worth 10 ones.`];
    return [`Break ${fmt(y)} into ${fmt(tens)} and ${y % 10}. Multiplying by smaller pieces is easier, and the pieces add back to ${fmt(y)}.`, `Multiply ${fmt(x)} × ${fmt(tens)}, then ${fmt(x)} × ${y % 10}. These are the two partial products.`, `Add the partial products, because together they make ${fmt(x)} groups of ${fmt(y)}.`];
  }],
  [/^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = \?$/, (a, b, op, c, d) => fractionAddSub(n(a), n(b), op, n(c), n(d))],
  [/^(\d+)\/(\d+) × (\d+)\/(\d+) = \?$/, (a, b, c, d) => [`Taking a fraction of a fraction makes pieces of pieces. Multiply the tops to count the pieces: ${a} × ${c}.`, `Multiply the bottoms to find the new piece size: ${b} × ${d}.`, `Write the first product over the second, then simplify by dividing both by a shared factor.`]],
  [/^(\d+)\/(\d+) ÷ (\d+)\/(\d+) = \?$/, (a, b, c, d) => [`Dividing asks how many ${c}/${d}s fit into ${a}/${b}. Keep the first fraction as it is: ${a}/${b}.`, `Change ÷ to × and flip ${c}/${d} to ${d}/${c}. Multiplying by the flip does the same job as dividing.`, `Multiply the tops (${a} × ${d}) and the bottoms (${b} × ${c}), then simplify.`]],
  [/^What is (\d+)\/(\d+) of (\d+)\?$/, (a, b, w) => fractionOfWhole(a, b, w)],
  [/^(\d+)\/(\d+) ___ (\d+)\/(\d+)$/, (a, b, c, d) => [`The pieces have different sizes, so compare by cross-multiplying: top of one times bottom of the other. This is the same as renaming both with a common bottom.`, `Work out ${a} × ${d} and ${c} × ${b}.`, `The bigger product belongs to the bigger fraction, so choose the symbol that matches.`]],
  [/^(\d+)\/(\d+) = (\d+)\/□$/, (a, b, c) => (n(c) % n(a) === 0 ? [`Look at the tops: ${a} became ${c}. Ask what times ${a} makes ${c}.`, `The top was multiplied by ${n(c) / n(a)}.`, `To keep the fraction equal, multiply the bottom by the same number: ${b} × ${n(c) / n(a)}.`] : null)],
  [/^Area of a rectangle with length (\d+) and width (\d+)\?$/, (l, w) => [`Length is ${l} and width is ${w}.`, `Area counts the square units that cover the inside. There are ${w} rows of ${l} squares, so multiply ${l} × ${w}.`]],
  [/^Perimeter of a rectangle with length (\d+) and width (\d+)\?$/, (l, w) => [`Perimeter is the distance all the way around. Length is ${l} and width is ${w}.`, `Add one length and one width: ${l} + ${w}.`, `A rectangle has two of each side, so double that sum to go all the way around.`]],
  [/^Volume of a rectangular prism: (\d+) × (\d+) × (\d+)\?$/, (l, w, h) => [`Volume counts the cubes that fill the box. Length ${l}, width ${w}, height ${h}.`, `One flat layer holds ${l} × ${w} cubes.`, `There are ${h} layers stacked up, so multiply the layer by ${h}.`]],
  [/^Round ([\d,]+) to the nearest ([a-z-]+)\.$/, (value, place) => {
    const size = PLACE_SIZES[place];
    if (!size) return null;
    const digits = String(n(value));
    const keep = digits.length - String(size).length;
    const [here, next] = [digits[keep], digits[keep + 1]];
    if (here === undefined || next === undefined) return null;
    return [`The ${place}s place of ${value} holds the digit ${here}. That is the place we are rounding to.`, `Look at the digit to its right, ${next}. It tells us whether the number is closer to the lower or the higher ${place}.`, Number(next) >= 5 ? `${next} is 5 or more, so the number is at least halfway up: round up. Every digit after the ${place}s place becomes 0.` : `${next} is 4 or less, so the number is less than halfway: round down. Every digit after the ${place}s place becomes 0.`];
  }],
  [/^(\d+) quarters \+ (\d+) dimes \+ (\d+) nickels \+ (\d+) pennies/, (q, d, k, p) => [`Each kind of coin has its own value: quarter 25¢, dime 10¢, nickel 5¢, penny 1¢.`, `Find the value of each group: ${q} × 25¢, ${d} × 10¢, ${k} × 5¢, ${p} × 1¢. Groups of the same coin are repeated adding.`, `Add the four amounts together, because the total is all the coins combined.`]],
  [/^Evaluate (\d*)x ([+−]) (\d+) when x = (-?\d+)\.$/, (c, op, k, v) => [`Replace x with ${v}, using parentheses: ${c || 1}(${v}) ${op} ${k}. The parentheses show that ${v} is multiplied.`, `Multiply first: ${c || 1} × (${v}). Multiplication comes before ${op === "+" ? "adding" : "subtracting"} in the order of operations.`, `Then ${op === "+" ? "add" : "subtract"} ${k}.`]],
  [/^If y = (-?\d*)x ([+−]) (\d+), find y when x = (-?\d+)\.$/, (c, op, k, v) => [`The rule says what to do to x. Replace x with ${v}: y = ${c || 1}(${v}) ${op} ${k}.`, `Multiply first: ${c || 1} × (${v}), because multiplication comes before ${op === "+" ? "adding" : "subtracting"}.`, `Then ${op === "+" ? "add" : "subtract"} ${k} to get y.`]],
  [/^x ([+−]) (\d+) = (-?\d+)\. Find x\.$/, (op, k, r) => [`The goal is to get x alone. Right now ${k} is being ${op === "+" ? "added to" : "taken from"} x.`, `Undo it with the opposite: ${op === "+" ? "subtract" : "add"} ${k} on both sides. Doing the same to both sides keeps the equation balanced.`, `Work out ${r} ${op === "+" ? "−" : "+"} ${k} to find x.`]],
  [/^(\d+)x ([+−]) (\d+) = (-?\d+)\. Find x\.$/, (c, op, k, r) => [`The goal is to get x alone. Undo the ${op === "+" ? "adding" : "subtracting"} first: ${op === "+" ? "subtract" : "add"} ${k} on both sides to keep the equation balanced.`, `Work out ${r} ${op === "+" ? "−" : "+"} ${k}. Now only ${c}x is left on one side.`, `${c}x means ${c} times x, so divide both sides by ${c} to undo the multiplying.`]],
  [/^(-?\d+) × \((-?\d+)\) = \?$|^(-?\d+) × (-?\d+) = \?$/, (...m) => {
    const [a, b] = m[0] !== undefined ? [n(m[0]), n(m[1])] : [n(m[2]), n(m[3])];
    const same = (a < 0) === (b < 0);
    if (a === 0 || b === 0) return [`Look for a zero first: ${a} × ${b < 0 ? `(${b})` : b} has a zero factor.`, "Zero times any number is 0, so there is no sign to decide."];
    return [`Size first: multiply ${Math.abs(a)} × ${Math.abs(b)} without the signs. The signs only decide positive or negative.`, `Sign next: ${signWord(a)} × ${signWord(b)}. ${same ? "Same signs make a positive answer." : "Different signs make a negative answer."}`];
  }],
  [/^√(\d+) = \?$/, (value) => {
    const target = n(value);
    const low = SQUARES.filter((s) => s <= target).at(-1);
    const high = SQUARES.find((s) => s >= target);
    if (low === undefined || high === undefined) return null;
    return [`A square root is the number that multiplies by itself to make ${value}.`, low === high ? `${value} is a perfect square you may know from your times tables, so look for the matching pair.` : `${value} sits between the perfect squares ${low} and ${high}, so the root is between their roots.`, `Try a whole number: multiply it by itself and compare with ${value}. Adjust up or down until it matches.`];
  }],
  [/^x \+ y = (-?\d+) and x − y = (-?\d+)\. Find x\.$/, (s, d) => [`Add the two equations, left sides together and right sides together: (x + y) + (x − y) and ${s} + (${d}). Adding equal amounts to equal amounts keeps them equal.`, `The y and −y cancel, so only 2x is left on the left side. That is why adding was a good choice.`, `Divide the right side by 2 to find x, because 2x means 2 times x.`]],
  [/^Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)\.$/, (x1, y1, x2, y2) => [`Slope tells how steep the line is: rise ÷ run, how far it goes up for each step across.`, `Rise is the change in y: ${y2} − (${y1}). Run is the change in x: ${x2} − (${x1}). Subtract in the same order for both.`, `Divide the rise by the run to get the slope.`]],
  [/^What is (\d+)% of (\d+)\?$/, (p, w) => [`Percent means "out of 100", so ${p}% is ${p}/100.`, `"Of" means multiply: we want ${p}/100 of ${w}, so work out ${p}/100 × ${w}.`, n(p) === 10 ? `Shortcut: 10% is one tenth, so 10% of ${w} is ${w} ÷ 10.` : n(p) % 10 === 0 ? `Shortcut: 10% of ${w} is ${w} ÷ 10. Build ${p}% from that, because ${p}% is made of several 10% pieces.` : `Shortcut: find 1% by dividing ${w} by 100, then multiply by ${p}.`]],
  [/^(\d[\d,.]*) for (\d+) items\. How much for 1 item\?$/, (total, items) => [`A unit rate is the amount for exactly 1 item.`, `Split ${total} into ${items} equal shares: ${total} ÷ ${items}. Dividing shares the total fairly.`, `One share is the amount for 1 item.`]],
  [/^(\d+) of (\d+) equal sections are winning sections\./, (a, b) => [`Probability compares the outcomes you want to all the possible outcomes.`, `Wanted: ${a} winning sections. All possible: ${b} sections.`, `Write wanted over all as a fraction. If top and bottom share a factor, divide both by it to simplify.`]],
  [/^A right triangle has legs (\d+) and (\d+)\./, (a, b) => [`In a right triangle, leg² + leg² = hypotenuse². This rule works only for right triangles.`, `Square each leg: ${a} × ${a} and ${b} × ${b}. Squaring gives the area of the square on each leg.`, `Add the two squares to get the hypotenuse squared, then take the square root to undo the squaring.`]],
  [/^(\d+)\^(\d+) = \?$/, (base, exp) => [`The exponent ${exp} tells how many times ${base} is used as a factor.`, `Write it out: ${Array(Math.min(n(exp), 6)).fill(base).join(" × ")}${n(exp) > 6 ? " …" : ""}.`, `Multiply from left to right, one pair at a time, so each step is a small multiplication.`]],
  [/^A circle has radius (\d+)\./, (r) => [`The area of a circle is π × r × r: π times the radius squared.`, `The radius is ${r}, so r × r = ${r} × ${r}.`, `The question asks only for the number that multiplies π, so stop at that product.`]],
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
