// Guided steps for generators that only author a one-line explanation. Each builder reads the problem's
// own question and returns the steps that come BEFORE the worked line; the worked line (which names the
// answer) is always appended last, so "Watch me solve it" never opens on the answer.
const PLACES = [
  "ones",
  "tens",
  "hundreds",
  "thousands",
  "ten-thousands",
  "hundred-thousands",
  "millions",
];
const num = (text) => String(text).replaceAll(",", "");
const sign = (n) => (n < 0 ? "−" : "+");

function comparePlaces(a, b) {
  const [x, y] = [num(a), num(b)];
  const width = Math.max(x.length, y.length);
  const [px, py] = [x.padStart(width, "0"), y.padStart(width, "0")];
  const at = [...px].findIndex((digit, i) => digit !== py[i]);
  if (at < 0) return [`Both numbers have the same digits in every place.`];
  const place = PLACES[width - 1 - at];
  const steps = [`Line up the digits and start at the left, with the biggest place, because it changes the size of a number the most.`];
  if (at > 0) steps.push(`The digits match until the ${place} place, so look there.`);
  steps.push(`Compare the ${place} digits: ${Number(px[at])} and ${Number(py[at])}.`);
  return steps;
}

// [pattern, builder(...captures)] — first match wins.
const BUILDERS = [
  [
    /^([\d, ]+), ___$/,
    (list) => {
      const n = list.split(",").map(Number);
      const jump = n[1] - n[0];
      return [
        `Look at the jump from ${n[0]} to ${n[1]}: ${sign(jump)}${Math.abs(jump)}.`,
        `Check the next jump (${n[1]} to ${n[2]}). It is the same every time.`,
        `Use that jump once more from ${n.at(-1)}.`,
      ];
    },
  ],
  [/^([\d,]+) ___ ([\d,]+)$/, comparePlaces],
  [
    /^What (is the value of the digit|digit is) in the ([a-z-]+) place of ([\d,]+)\?$/,
    (kind, place, n) =>
      [
        `Label the places from the right: ${PLACES.slice(0, Math.max(PLACES.indexOf(place) + 1, 2)).join(", ")}.`,
        `Count over to the ${place} place and point at its digit in ${n}. Each place has its own name and worth.`,
        kind.startsWith("is") ? `Say what that digit is worth in its place.` : "",
      ].filter(Boolean),
  ],
  [
    /^(\d+) \+ □ = (\d+)\. What belongs in the box\?$/,
    (a, t) => [
      `Start at ${a}. You need to reach ${t}.`,
      `Count up from ${a} to ${t}. How many did you add?`,
    ],
  ],
  [
    /^What time is (\d+) minutes after (\d+:\d+)\?$/,
    (m, t) => [
      `Start at ${t}.`,
      Number(m) % 60 === 0
        ? `${m} minutes is ${Number(m) / 60} hour${Number(m) === 60 ? "" : "s"}. Move the hour, keep the minutes.`
        : `${m} minutes is half an hour. Move the minute hand halfway round the clock.`,
    ],
  ],
  [
    /^Is ([\d,]+) even or odd\?$/,
    (n) => [
      `Look only at the ones digit: ${num(n).at(-1)}.`,
      `Even numbers end in 0, 2, 4, 6, or 8. Odd numbers end in 1, 3, 5, 7, or 9.`,
    ],
  ],
  [
    /^\d+ quarters/,
    () => [
      `A quarter is 25¢, a dime is 10¢, a nickel is 5¢, and a penny is 1¢.`,
      `Find what each kind of coin is worth, then add the values together.`,
    ],
  ],
  [
    /^Round ([\d,]+) to the nearest ([a-z-]+)\.$/,
    (n, place) => [
      `Find the ${place} place in ${n}.`,
      `Look at the digit just to its right.`,
      `If that digit is 5 or more, round up. If it is 4 or less, the place stays the same.`,
    ],
  ],
  [
    /^(\d+)\/(\d+) = □\/(\d+)$/,
    (a, b, c) => [
      `The bottom changes from ${b} to ${c}.`,
      `${b} × ${Number(c) / Number(b)} = ${c}, so multiply the top by the same number.`,
      `Whatever you do to the bottom, do to the top (${a}).`,
    ],
  ],
  [
    /^(\d+)\/(\d+) ___ (\d+)\/(\d+)$/,
    (a, b, c, d) => [
      `Cross-multiply: each top times the other fraction's bottom.`,
      `Work out ${a} × ${d} and ${c} × ${b}.`,
      `The bigger product belongs to the bigger fraction.`,
    ],
  ],
  [
    /^Area of a rectangle with length (\d+) and width (\d+)\?$/,
    (l, w) => [
      `Area is the number of square units inside: length × width.`,
      `Multiply ${l} × ${w}.`,
    ],
  ],
  [
    /^Perimeter of a rectangle with length (\d+) and width (\d+)\?$/,
    (l, w) => [
      `Perimeter is the distance all the way around.`,
      `Add one length and one width: ${l} + ${w}.`,
      `Then double it, because the rectangle has two of each.`,
    ],
  ],
  [
    /^Volume of a rectangular prism: (\d+) × (\d+) × (\d+)\?$/,
    (a, b) => [
      `Volume = length × width × height.`,
      `Multiply ${a} × ${b} first to find one layer.`,
      `Then multiply by the height.`,
    ],
  ],
  [
    /^A circle has radius (\d+)\./,
    (r) => [`The area of a circle is π × r × r.`, `Square the radius: ${r} × ${r}.`],
  ],
  [
    /^What digit is in the ([a-z]+) place of ([\d.]+)\?$/,
    (place, n) => [
      `Look to the right of the decimal point in ${n}: tenths, hundredths, thousandths.`,
      `Count to the ${place} place.`,
    ],
  ],
  [
    /^([\d.]+) ([+−]) ([\d.]+) = \?$/,
    (a, op) => [
      `Line up the decimal points.`,
      `Add zeros so both numbers have the same number of decimal places.`,
      `${op === "+" ? "Add" : "Subtract"} each column from right to left, regrouping when needed.`,
    ],
  ],
  [
    /^([\d.]+) × ([\d.]+) = \?$/,
    (a, b) => {
      const places = (a.split(".")[1] || "").length + (b.split(".")[1] || "").length;
      return [
        `Ignore the decimal points and multiply ${a.replace(".", "")} × ${b.replace(".", "")}.`,
        `Count the decimal places in both factors: ${places} in all.`,
        `Give the product ${places} decimal place${places === 1 ? "" : "s"}.`,
      ];
    },
  ],
  [
    /^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = \?$/,
    (a, b, op, c, d) =>
      b === d
        ? [
            `The bottoms are the same, so ${op === "+" ? "add" : "subtract"} the tops.`,
            `Keep the bottom ${b}.`,
          ]
        : [
            `The bottoms are different, so find a common denominator.`,
            `Rename both fractions with it.`,
            `Then ${op === "+" ? "add" : "subtract"} the tops and simplify.`,
          ],
  ],
  [
    /^(\d+)\/(\d+) × (\d+)\/(\d+) = \?$/,
    () => [`Multiply the tops together.`, `Multiply the bottoms together.`, `Simplify if you can.`],
  ],
  [
    /^(\d+)\/(\d+) ÷ (\d+)\/(\d+) = \?$/,
    (a, b, c, d) => [
      `To divide by a fraction, multiply by its reciprocal.`,
      `Flip ${c}/${d} to ${d}/${c}.`,
      `Multiply the tops, multiply the bottoms, and simplify.`,
    ],
  ],
  [
    /^What is (\d+)\/(\d+) of (\d+)\?$/,
    (n, d, w) => [
      `The bottom ${d} says to split ${w} into ${d} equal groups.`,
      `Find the size of one group.`,
      `The top ${n} says to take ${n} of those groups.`,
    ],
  ],
  [
    /^(\d+):(\d+) = (\d+):□$/,
    (a, b, c) => [
      `Find what ${a} was multiplied by to make ${c}.`,
      `Multiply ${b} by the same number.`,
    ],
  ],
  [
    /^(\d+):(\d+) = □:(\d+)$/,
    (a, b, d) => [
      `Find what ${b} was multiplied by to make ${d}.`,
      `Multiply ${a} by the same number.`,
    ],
  ],
  [
    /^([\d.]+) for (\d+) items\. How much for 1 item\?$/,
    (total, n) => [
      `A unit rate is the amount for 1 item.`,
      `Share ${total} equally among ${n} items. That is a division.`,
    ],
  ],
  [
    /^What is (\d+)% of (\d+)\?$/,
    (p, w) => [
      `${p}% means ${p} out of every 100.`,
      `Turn it into ${p}/100 (or a decimal), or use a benchmark like 10% or 50%.`,
      `Multiply that by ${w}.`,
    ],
  ],
  [
    /^(\d+) with a (\d+)% (increase|decrease) equals what\?$/,
    (w, p, kind) => [
      `First find ${p}% of ${w}.`,
      `Then ${kind === "increase" ? "add it to" : "subtract it from"} ${w}.`,
    ],
  ],
  [
    /^Evaluate (.+) when x = (-?\d+)\.$/,
    (expr, x) => [
      `Replace x with ${x}, using parentheses: ${expr.replace("x", `(${x})`)}.`,
      `Multiply first, then add or subtract.`,
    ],
  ],
  [
    /^(?:(\d+))?x ([+−]) (\d+) = (-?\d+)\. Find x\.$/,
    (k, op, c) => [
      `Get x alone. First undo the ${op === "+" ? "adding" : "subtracting"}: ${op === "+" ? "subtract" : "add"} ${c} on both sides.`,
      k
        ? `Then undo the multiplying: divide both sides by ${k}.`
        : `Whatever you do to one side, do to the other.`,
    ],
  ],
  [
    /^\|(-?\d+)\| = \?$/,
    (n) => [
      `Absolute value is the distance from 0 on a number line.`,
      `${n} sits some distance from 0. A distance is never negative.`,
    ],
  ],
  [
    /^(\d+)\/(\d+) = x\/(\d+)\. Find x\.$/,
    (a, b, c) => [
      `Look at the bottoms: ${b} changed to ${c}.`,
      `Find what ${b} was multiplied by.`,
      `Multiply the top, ${a}, by the same number.`,
    ],
  ],
  [
    /^Is (-?\d+) a solution to x (>|<|≥|≤) (-?\d+)\?$/,
    (v, op, c) => [`Replace x with ${v}.`, `Ask: is ${v} ${op} ${c} true or false?`],
  ],
  [
    /^(\d+) of (\d+) equal sections are winning sections/,
    (w, t) => [
      `Probability = favorable outcomes ÷ total outcomes.`,
      `Favorable: ${w} sections. Total: ${t} sections.`,
      `Write it as a fraction: favorable over total.`,
    ],
  ],
  [
    /^(\d+)\^(\d+) = \?$/,
    (b, e) => [
      `The exponent ${e} says to use ${b} as a factor ${e} times.`,
      `Write ${b} ${e} times with × between them, then multiply from left to right.`,
    ],
  ],
  [
    /^([\d.]+) × 10\^(-?\d+) = \?$/,
    (n, e) => [
      `The exponent ${e} tells you how many places to move the decimal point.`,
      Number(e) > 0
        ? `A positive exponent moves it right ${e} place${e === "1" ? "" : "s"}. Add zeros if you run out of digits.`
        : `A negative exponent moves it left ${-e} place${e === "-1" ? "" : "s"}.`,
    ],
  ],
  [
    /^√(\d+) = \?$/,
    (n) => [
      `Ask: what number times itself makes ${n}?`,
      `Use nearby perfect squares to estimate, then test your guess by multiplying.`,
    ],
  ],
  [
    /^Find the slope through/,
    () => [
      `Slope = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁).`,
      `Rise: subtract the two y-values.`,
      `Run: subtract the two x-values in the same order.`,
    ],
  ],
  [
    /^If y = (.+), find y when x = (-?\d+)\.$/,
    (rule, x) => [
      `Replace x with ${x}, using parentheses: y = ${rule.replace("x", `(${x})`)}.`,
      `Multiply first, then add or subtract.`,
    ],
  ],
  [
    /^x \+ y = (-?\d+) and x − y = (-?\d+)\. Find x\.$/,
    () => [
      `Add the two equations. The y terms cancel.`,
      `What is left is an equation with only x. Solve it.`,
    ],
  ],
  [
    /^Reflect \((-?\d+), (-?\d+)\) across the (x-axis|y-axis|origin)\.$/,
    (x, y, line) => [
      {
        "x-axis": `Across the x-axis, the y-value changes sign and x stays the same.`,
        "y-axis": `Across the y-axis, the x-value changes sign and y stays the same.`,
        origin: `Across the origin, both values change sign.`,
      }[line],
      `Apply that rule to (${x}, ${y}).`,
    ],
  ],
  [
    /^A right triangle has legs (\d+) and (\d+)\./,
    (a, b) => [
      `Use a² + b² = c².`,
      `Square each leg (${a} and ${b}) and add the squares.`,
      `Take the square root of the total to find the hypotenuse.`,
    ],
  ],
  [
    /^A data table has x-values/,
    () => [
      `Read the y-values from left to right and see how they change as x goes up.`,
      `Does y mostly rise, mostly fall, or jump around? Match what you see to one of the choices.`,
    ],
  ],
];

// Steps ending on the worked line, or null when no builder matches the question.
export function workedSteps(item) {
  for (const [pattern, build] of BUILDERS) {
    const match = item.question.match(pattern);
    if (match) return [...build(...match.slice(1)), item.explanation];
  }
  return null;
}
