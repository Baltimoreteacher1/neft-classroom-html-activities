// Guided steps for Kindergarten to Grade 3, in the words a young child uses: short sentences, no vocabulary words
// (addend, digit, place value, quotient, interval, regroup), one idea per step, and number sentences wherever a
// picture can be drawn from them (step pictures read "6 + 3 = 9", "Count on 3: 7, 8, 9", "Picture 10 boxes. 4 are
// full."). A builder returns null when a question has a shape it does not know, and the skill's own steps stay.
// Every builder keeps the rules the other step writers keep: at most four steps, the answer only on the last step
// (a list of counting numbers is a search, not a result), and a step that ends "= number" is a "Your turn" box.
const fmt = (value) => Number(value).toLocaleString("en-US");
const n = (text) => Number(String(text).replaceAll(",", ""));
const ending = (steps) => Object.assign(steps, { final: true });
const range = (from, to) => {
  const out = [];
  for (let value = from; value <= to; value += 1) out.push(fmt(value));
  return out;
};
const answerOf = (item) => String(item.displayAnswer ?? item.answers?.[0] ?? "");
const PLACES = ["ones", "tens", "hundreds", "thousands"];

// "9, 10, 11, 12, ___" and the like: say the numbers, name the rule, take one more step.
function countOn(item) {
  const match = item.question.match(/^((?:-?\d+,\s*){3,}-?\d+),\s*___$/);
  if (!match) return null;
  const list = match[1].split(/,\s*/).map(Number);
  const jump = list[1] - list[0];
  if (!jump || list.some((value, i) => i && value - list[i - 1] !== jump)) return null;
  const last = list.at(-1);
  const up = jump > 0;
  const size = Math.abs(jump);
  return ending([
    `Say the numbers: ${list.map(fmt).join(", ")}.`,
    `Each number is ${size} ${up ? "more" : "less"} than the one before.`,
    `${fmt(last)} ${up ? "+" : "−"} ${size} = ${fmt(last + jump)}`,
  ]);
}

function compare(item) {
  const match = item.question.match(/^(\d+) ___ (\d+)$/);
  if (!match) return null;
  const [a, b] = [Number(match[1]), Number(match[2])];
  if (a === b) return null;
  const sa = String(a);
  const sb = String(b);
  const width = Math.max(sa.length, sb.length);
  const pa = sa.padStart(width, "0");
  const pb = sb.padStart(width, "0");
  const at = [...pa].findIndex((digit, i) => digit !== pb[i]);
  const place = PLACES[width - 1 - at];
  const [da, db] = [Number(pa[at]), Number(pb[at])];
  const unit = place === "ones" ? "ones" : place;
  const word = (count) => `${count} ${count === 1 ? unit.replace(/s$/, "") : unit}`;
  const symbol = a > b ? ">" : "<";
  const lines = [];
  if (place !== "ones") lines.push(`${a} has ${word(da)}. ${b} has ${word(db)}.`);
  else lines.push(`Look at the ones. ${a} has ${word(da)}. ${b} has ${word(db)}.`);
  lines.push(`${a > b ? a : b} has more ${unit}, so it is the bigger number.`);
  lines.push(`${a} ${symbol} ${b}`);
  return ending(lines);
}

// Missing part: "5 + ? = 10", "1 + □ = 8", "3 + ? = 10".
function missingPart(item, tenFrame) {
  const match = item.question.match(/^(\d+) \+ (?:\?|□) = (\d+)/);
  if (!match) return null;
  const [a, total] = [Number(match[1]), Number(match[2])];
  const gap = total - a;
  if (gap < 0 || (gap === 0 && !(tenFrame && total === 10))) return null;
  if (tenFrame && total === 10)
    return ending([
      `Picture 10 boxes. ${a} are full.`,
      "Count the empty boxes.",
      `${a} + ${gap} = 10`,
    ]);
  if (gap <= 10)
    return ending([
      `Start at ${a}. You want to get to ${total}.`,
      `Count up: ${range(a + 1, total).join(", ")}`,
      `${a} + ${gap} = ${total}`,
    ]);
  const ten = Math.ceil((a + 1) / 10) * 10;
  return ending([
    `Go to the next ten first. ${a} + ${ten - a} = ${ten}`,
    `${ten} + ${total - ten} = ${total}`,
    `${a} + ${gap} = ${total}`,
  ]);
}

// Take away: count back for a small take, otherwise think "what do I add?".
function takeAway(item) {
  const match = item.question.match(/^(\d+) − (\d+) = \?$/);
  if (!match) return null;
  const [a, b] = [Number(match[1]), Number(match[2])];
  const c = a - b;
  if (b <= 3)
    return ending([
      `Start at ${a}.`,
      `Count back ${b}: ${range(c, a - 1)
        .reverse()
        .join(", ")}`,
      `${a} − ${b} = ${c}`,
    ]);
  if (a > 10 && b > a - 10 && a - 10 < b)
    return ending([
      `Take away to get to 10 first. ${a} − ${a - 10} = 10`,
      `Take away the rest. 10 − ${b - (a - 10)} = ${c}`,
      `${a} − ${b} = ${c}`,
    ]);
  if (c <= 10)
    return ending([
      `Think: ${b} + ? = ${a}.`,
      `Count up from ${b} to ${a}: ${range(b + 1, a).join(", ")}`,
      `You counted ${c}. So ${a} − ${b} = ${c}`,
    ]);
  return null;
}

function add(item) {
  const match = item.question.match(/^(\d+) \+ (\d+) = \?$/);
  if (!match) return null;
  const [p, q] = [Number(match[1]), Number(match[2])];
  const [big, small] = [Math.max(p, q), Math.min(p, q)];
  const sum = p + q;
  if (sum > 20 || small < 1) return null;
  if (small <= 3 || sum <= 10)
    return ending([`Start at the bigger number, ${big}.`, `Count on ${small}: ${range(big + 1, big + small).join(", ")}`, `${big} + ${small} = ${sum}`]);
  const need = 10 - big;
  if (need > 0 && need < small)
    return ending([
      `Make a ten first. ${big} needs ${need} more.`,
      `${big} + ${need} = 10`,
      `10 + ${small - need} = ${sum}`,
    ]);
  return null;
}

function splitAddSub(item) {
  const match = item.question.match(/^(\d+) ([+−]) (\d+) = \?$/);
  if (!match || item.steps.length !== 2) return null;
  const [a, op, b] = [Number(match[1]), match[2], Number(match[3])];
  const first = Number(item.steps[0].match(/[+−] (\d+) =/)?.[1]);
  const second = Number(item.steps[1].match(/[+−] (\d+) =/)?.[1]);
  if (!first || !second || first + second !== b) return null;
  return ending([
    `Split ${fmt(b)} into ${fmt(first)} and ${fmt(second)}.`,
    ...item.steps.map((step) => step.replace(/\.$/, "")),
  ]);
}

function placeValue(item) {
  const match = item.question.match(/the (ones|tens|hundreds|thousands) place of ([\d,]+)/);
  if (!match) return null;
  const value = n(match[2]);
  const digits = String(value);
  const spot = PLACES.indexOf(match[1]);
  const digit = Number(digits.at(-1 - spot));
  const asks = /value/i.test(item.question);
  const last = asks ? `The ${digit} is in the ${match[1]} place. It is worth ${fmt(digit * 10 ** spot)}.` : `The ${match[1]} place has a ${digit}.`;
  // Showing "4 tens" would give away a question that asks for the digit (or a ones place worth its own digit).
  if (!asks || spot === 0)
    return ending([`Name the places from the right: ${PLACES.slice(0, digits.length).join(", ")}.`, `Find the ${match[1]} place in ${fmt(value)}.`, last]);
  const parts = [...digits].map((d, i) => `${d} ${PLACES[digits.length - 1 - i]}`).join(", ");
  return ending([`Take ${fmt(value)} apart: ${parts}.`, `Find the ${match[1]} place. Which number is in it?`, last]);
}

function rounding(item) {
  const match = item.question.match(/^Round (\d+) to the nearest (ten|hundred)\.$/);
  if (!match) return null;
  const value = Number(match[1]);
  const size = match[2] === "ten" ? 10 : 100;
  const low = Math.floor(value / size) * size;
  const look = Math.floor((value % size) / (size / 10));
  const where = match[2] === "ten" ? "ones" : "tens";
  return ending([
    `Look at the ${where} in ${fmt(value)}: ${look}.`,
    look >= 5 ? "5 or more: round up." : "Less than 5: round down.",
    `${fmt(value)} rounds to ${fmt(look >= 5 ? low + size : low)}.`,
  ]);
}

function groups(item, skill) {
  const match = item.question.match(/^(\d+) × (\d+) = \?$/);
  if (!match) return null;
  const [a, b] = [Number(match[1]), Number(match[2])];
  const c = a * b;
  if (a < 2 || b < 2) return null;
  if (skill.id === "mul-0-5" && Math.min(a, b) <= 5 && c <= 60) {
    const list = Array.from({ length: a }, (_, i) => b * (i + 1));
    return ending([`${a} groups of ${b}.`, `Count by ${b}s: ${list.join(", ")}`, `${a} × ${b} = ${c}`]);
  }
  if (skill.id === "mul-6-9" && (a === 9 || b === 9)) {
    const other = a === 9 ? b : a;
    return ending([`10 groups of ${other} is easy. Take one group away.`, `10 × ${other} = ${10 * other}`, `${10 * other} − ${other} = ${c}`]);
  }
  if (skill.id === "mul-6-9") {
    const [big, other] = a >= 6 && a <= 8 ? [a, b] : [b, a];
    if (big < 6 || big > 8) return null;
    return ending([`Split ${big} into 5 and ${big - 5}.`, `5 × ${other} = ${5 * other}`, `${big - 5} × ${other} = ${(big - 5) * other}`, `${5 * other} + ${(big - 5) * other} = ${c}`]);
  }
  if (skill.id === "mul-10-12") {
    const [tens, plain] = a % 10 === 0 ? [a, b] : [b, a];
    if (tens % 10 || tens < 10 || plain > 12) return null;
    const count = tens / 10;
    return ending([
      `${tens} is ${count} ${count === 1 ? "ten" : "tens"}.`,
      `${plain} × ${count} = ${plain * count}`,
      "Each one is a ten. Slide the numbers one place left.",
      `${plain * count} tens is ${c}. So ${a} × ${b} = ${c}`,
    ]);
  }
  return null;
}

function division(item) {
  const match = item.question.match(/^(\d+) ÷ (\d+) = \?$/);
  if (!match) return null;
  const [total, size] = [Number(match[1]), Number(match[2])];
  const count = total / size;
  if (!Number.isInteger(count) || count > 10) return null;
  const list = Array.from({ length: count }, (_, i) => size * (i + 1));
  return ending([
    `Think: ${size} × ? = ${total}`,
    `Count by ${size}s: ${list.join(", ")}`,
    `You said ${count} numbers. So ${total} ÷ ${size} = ${count}`,
  ]);
}

function evenOdd(item) {
  const match = item.question.match(/^Is ([\d,]+) even or odd\?$/);
  if (!match) return null;
  const last = match[1].at(-1);
  return ending(["Look at the last number only.", `The last number of ${match[1]} is ${last}.`, "Even: ends in 0, 2, 4, 6, 8. Odd: ends in 1, 3, 5, 7, 9.", `${match[1]} is ${Number(last) % 2 ? "odd" : "even"}.`]);
}

function coins(item) {
  const match = item.question.match(
    /^(\d+) quarters? \+ (\d+) dimes? \+ (\d+) nickels? \+ (\d+) pennies? =/,
  );
  if (!match) return null;
  const [q, d, k, p] = match.slice(1).map(Number);
  const top = q * 25 + d * 10;
  const bottom = k * 5 + p;
  return ending([
    "Quarter 25¢, dime 10¢, nickel 5¢, penny 1¢.",
    `${q} × 25 + ${d} × 10 = ${top}`,
    `${k} × 5 + ${p} × 1 = ${bottom}`,
    `${top} + ${bottom} = ${top + bottom} cents.`,
  ]);
}

function time(item) {
  const match = item.question.match(/^What time is (\d+) minutes after (\d+):(\d\d)\?$/);
  if (!match) return null;
  const minutes = Number(match[1]);
  const answer = answerOf(item);
  const help =
    minutes === 60
      ? "60 minutes is 1 hour. Add 1 hour."
      : minutes === 30
        ? "30 minutes is half an hour."
        : `Move the minute hand ${minutes} minutes.`;
  return ending([
    `Start at ${match[2]}:${match[3]}.`,
    help,
    `${minutes} minutes after ${match[2]}:${match[3]} is ${answer}.`,
  ]);
}

function ruler(item) {
  const match = item.question.match(/starts at (\d+) (\w+) and ends at (\d+)/);
  if (!match) return null;
  const [a, b] = [Number(match[1]), Number(match[3])];
  if (b <= a || b - a > 12) return null;
  return ending([
    `The strip starts at ${a}. It ends at ${b}.`,
    `Count up from ${a} to ${b}: ${range(a + 1, b).join(", ")}`,
    `${b} − ${a} = ${b - a} ${match[2]}`,
  ]);
}

function data(item) {
  const pairs = [...item.question.matchAll(/(\w+): (\d+)/g)].map((m) => [m[1], Number(m[2])]);
  const ask = item.question.match(/Which \w+ got the (most|fewest|least) votes\?/);
  if (pairs.length < 3 || !ask) return null;
  const most = ask[1] === "most";
  const best = pairs.reduce((win, pair) =>
    (most ? pair[1] > win[1] : pair[1] < win[1]) ? pair : win,
  );
  return ending([
    `Read each number: ${pairs.map(([name, count]) => `${name} ${count}`).join(", ")}.`,
    `Find the ${most ? "biggest" : "smallest"} number: ${best[1]}.`,
    `${best[0]} got the ${most ? "most" : "fewest"} votes.`,
  ]);
}

function sameFraction(item) {
  const top = item.question.match(/^(\d+)\/(\d+) = (\d+)\/□$/);
  if (top) {
    const [a, b, c] = top.slice(1).map(Number);
    if (c % a) return null;
    const f = c / a;
    return ending([`The top changed from ${a} to ${c}.`, `${a} × ${f} = ${c}`, `Do the same to the bottom: ${b} × ${f} = ${b * f}, so ${a}/${b} = ${c}/${b * f}`]);
  }
  const bottom = item.question.match(/^(\d+)\/(\d+) = □\/(\d+)$/);
  if (!bottom) return null;
  const [a, b, d] = bottom.slice(1).map(Number);
  if (d % b) return null;
  const f = d / b;
  return ending([`The bottom changed from ${b} to ${d}.`, `${b} × ${f} = ${d}`, `Do the same to the top: ${a} × ${f} = ${a * f}, so ${a}/${b} = ${a * f}/${d}`]);
}

function area(item) {
  const match = item.question.match(/^Area of a rectangle with length (\d+) and width (\d+)\?$/);
  if (!match) return null;
  const [l, w] = [Number(match[1]), Number(match[2])];
  return ending([
    "Area is how many squares cover the inside.",
    `Picture ${w} rows. Each row has ${l} squares.`,
    `${l} × ${w} = ${l * w} square units.`,
  ]);
}

function perimeter(item) {
  const match = item.question.match(/^Perimeter of a rectangle with length (\d+) and width (\d+)\?$/);
  if (!match) return null;
  const [l, w] = [Number(match[1]), Number(match[2])];
  return ending(["Perimeter is the way around the outside.", `Add two sides that meet: ${l} + ${w} = ${l + w}`, `A rectangle has two of each: ${l + w} + ${l + w} = ${2 * (l + w)} units.`]);
}

function subtractWithin100(item) {
  const match = item.question.match(/^(\d+) − (\d+) = \?$/);
  if (!match) return null;
  const [a, b] = [Number(match[1]), Number(match[2])];
  const c = a - b;
  const ones = a % 10;
  if (b >= 10) {
    const tens = Math.floor(b / 10) * 10;
    const rest = b - tens;
    if (!rest) return null;
    return ending([`Split ${b} into ${tens} and ${rest}.`, `${a} − ${tens} = ${a - tens}`, `${a - tens} − ${rest} = ${c}`]);
  }
  if (b <= ones) return ending(["Only the ones change.", `${ones} − ${b} = ${ones - b}`, `${a} − ${b} = ${c}`]);
  return ending([`Take away to the ten first. ${a} − ${ones} = ${a - ones}`, `Take away the rest. ${a - ones} − ${b - ones} = ${c}`, `${a} − ${b} = ${c}`]);
}

function counting(item) {
  return ending(["Touch one counter at a time.", "Say one number for each counter.", "The last number you say tells how many.", `There are ${answerOf(item)}.`]);
}

function groupsOfTwoOrThree(item) {
  return ending(["Look for small groups. Try groups of 2 or 3.", "Put the groups together.", `That makes ${answerOf(item)}.`]);
}

function shapePattern(item) {
  const tokens = item.question.replace(/\s*___\s*$/, "").trim().split(/\s+/);
  const period = [...Array(tokens.length).keys()].slice(1).find((p) => tokens.every((token, i) => token === tokens[i % p]));
  if (!period || period > 4) return null;
  return ending(["Find the part that repeats.", `It repeats: ${tokens.slice(0, period).join(" ")}`, `The next one is ${answerOf(item)}.`]);
}

function comparePieces(item) {
  const match = item.question.match(/^(\d+)\/(\d+) ___ (\d+)\/(\d+)$/);
  if (!match) return null;
  const [a, b, c, d] = match.slice(1).map(Number);
  const symbol = a * d > c * b ? ">" : a * d < c * b ? "<" : "=";
  const sentence = `${a}/${b} ${symbol} ${c}/${d}`;
  if (b === d) return ending([`The bottoms are the same: ${b}. The pieces are the same size.`, `Compare the tops: ${a} and ${c}.`, sentence]);
  if (a === c) return ending([`The tops are the same: ${a}. Look at the bottoms: ${b} and ${d}.`, "More pieces in the whole means each piece is smaller.", sentence]);
  return null;
}

const BY_SKILL = {
  "count-cardinality": counting,
  subitize: groupsOfTwoOrThree,
  patterns: shapePattern,
  "fraction-compare": comparePieces,
  "count-forward": countOn,
  "count-patterns": countOn,
  "skip-count": countOn,
  "compare-20": compare,
  "compare-100": compare,
  "compare-1000": compare,
  "compose-10": (item) => missingPart(item, true),
  "make-10": (item) => missingPart(item, true),
  "missing-addend": (item) => missingPart(item, false),
  "story-add-sub-10": (item) => missingPart(item, false),
  "add-sub-5": takeAway,
  "subtract-10": takeAway,
  "subtract-20": takeAway,
  "sub-facts-20": takeAway,
  "add-10": add,
  "add-20": add,
  "facts-20": add,
  "add-100": splitAddSub,
  "subtract-100": subtractWithin100,
  "add-1000": splitAddSub,
  "add-sub-1000": splitAddSub,
  "tens-ones": placeValue,
  "place-1000": placeValue,
  round: rounding,
  "mul-0-5": groups,
  "mul-6-9": groups,
  "mul-10-12": groups,
  "division-facts": division,
  "even-odd": evenOdd,
  coins,
  time,
  "elapsed-time": time,
  "measure-length": ruler,
  "interpret-data": data,
  "fraction-equivalence": sameFraction,
  area,
  perimeter,
};

// Steps in a young learner's words, or null to keep the skill's own steps (older grades, unfamiliar shapes).
export function kidSteps(item, skill) {
  if (!skill || skill.grade > 3) return null;
  const steps = BY_SKILL[skill.id]?.(item, skill) ?? null;
  return steps && steps.length >= 2 && steps.length <= 4 ? steps : null;
}
