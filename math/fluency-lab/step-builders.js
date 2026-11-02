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
  const steps = [`Line up the digits. Start at the left, the biggest place.`];
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
        `Count over to the ${place} place. Point at its digit in ${n}.`,
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
        : `${m} minutes is half an hour. Move the minute hand halfway round.`,
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
      `Find what each kind of coin is worth. Then add the values.`,
    ],
  ],
  [
    /^Round ([\d,]+) to the nearest ([a-z-]+)\.$/,
    (n, place) => [
      `Find the ${place} place in ${n}.`,
      `Look at the digit just to its right.`,
      `5 or more: round up. 4 or less: the place stays the same.`,
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
      `The bottoms are different, so the pieces are different sizes.`,
      `Multiply each top by the other bottom: ${a} × ${d} and ${c} × ${b}.`,
      `The bigger product goes with the bigger fraction.`,
    ],
  ],
  [
    /^Area of a rectangle with length (\d+) and width (\d+)\?$/,
    (l, w) => [
      `Area is the number of squares inside: length × width.`,
      `Multiply ${l} × ${w}.`,
    ],
  ],
  [
    /^Perimeter of a rectangle with length (\d+) and width (\d+)\?$/,
    (l, w) => [
      `Perimeter is the distance all the way around.`,
      `Add one length and one width: ${l} + ${w}.`,
      `A rectangle has 2 lengths and 2 widths. Double the sum.`,
    ],
  ],
  [
    /^Volume of a rectangular prism: (\d+) × (\d+) × (\d+)\?$/,
    (a, b) => [
      `Volume = length × width × height.`,
      `Multiply ${a} × ${b} first. That is one layer of cubes.`,
      `Then multiply by the height.`,
    ],
  ],
  [
    /^A circle has radius (\d+)\./,
    (r) => [`Circle area = π × r × r. The radius (r) is the distance from center to edge.`, `Square the radius: ${r} × ${r}.`],
  ],
  [
    /^What digit is in the ([a-z]+) place of ([\d.]+)\?$/,
    (place, n) => [
      `Look right of the decimal point in ${n}. The places are tenths, hundredths, thousandths.`,
      `Count to the ${place} place.`,
    ],
  ],
  [
    /^([\d.]+) ([+−]) ([\d.]+) = \?$/,
    (a, op) => [
      `Line up the decimal points.`,
      `Add zeros so both numbers have the same number of decimal places.`,
      `${op === "+" ? "Add" : "Subtract"} each column, from right to left.`,
    ],
  ],
  [
    /^([\d.]+) × ([\d.]+) = \?$/,
    (a, b) => {
      const places = (a.split(".")[1] || "").length + (b.split(".")[1] || "").length;
      return [
        `Ignore the decimal points and multiply ${a.replace(".", "")} × ${b.replace(".", "")}.`,
        `Count the decimal places in both numbers: ${places} in all.`,
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
            `Keep ${b} on the bottom.`,
          ]
        : [
            `The bottoms are different. Find a common denominator, a bottom both share.`,
            `Change both fractions to that bottom.`,
            `Then ${op === "+" ? "add" : "subtract"} the tops. Simplify if you can.`,
          ],
  ],
  [
    /^(\d+)\/(\d+) × (\d+)\/(\d+) = \?$/,
    () => [`Multiply the tops together.`, `Multiply the bottoms together.`, `Simplify if you can.`],
  ],
  [
    /^(\d+)\/(\d+) ÷ (\d+)\/(\d+) = \?$/,
    (a, b, c, d) => [
      `To divide by a fraction, flip it and multiply.`,
      `Flip ${c}/${d} to ${d}/${c}. That is the reciprocal.`,
      `Multiply the tops. Multiply the bottoms. Then simplify.`,
    ],
  ],
  [
    /^What is (\d+)\/(\d+) of (\d+)\?$/,
    (n, d, w) => [
      `The bottom number ${d} says: split ${w} into ${d} equal groups.`,
      `Find the size of one group.`,
      `The top number ${n} says: take ${n} of those groups.`,
    ],
  ],
  [
    /^(\d+):(\d+) = (\d+):□$/,
    (a, b, c) => [
      `What times ${a} makes ${c}?`,
      `Multiply ${b} by that same number.`,
    ],
  ],
  [
    /^(\d+):(\d+) = □:(\d+)$/,
    (a, b, d) => [
      `What times ${b} makes ${d}?`,
      `Multiply ${a} by that same number.`,
    ],
  ],
  [
    /^([\d.]+) for (\d+) items\. How much for 1 item\?$/,
    (total, n) => [
      `A unit rate is the amount for 1 item.`,
      `Share ${total} equally among ${n} items: ${total} ÷ ${n}.`,
    ],
  ],
  [
    /^What is (\d+)% of (\d+)\?$/,
    (p, w) => [
      `${p}% means ${p} out of every 100.`,
      `Write it as ${p}/100. Or use 10% or 50% as a shortcut.`,
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
      `Write ${x} where x is: ${expr.replace("x", `(${x})`)}.`,
      `Multiply first. Then add or subtract.`,
    ],
  ],
  [
    /^(?:(\d+))?x ([+−]) (\d+) = (-?\d+)\. Find x\.$/,
    (k, op, c) => [
      `Get x alone. First undo the ${op === "+" ? "adding" : "subtracting"}: ${op === "+" ? "subtract" : "add"} ${c} on both sides.`,
      k
        ? `Then undo the multiplying: divide both sides by ${k}.`
        : `Do the same thing to both sides.`,
    ],
  ],
  [
    /^\|(-?\d+)\| = \?$/,
    (n) => [
      `Absolute value is the distance from 0 on a number line.`,
      `Count how many steps ${n} is from 0. A distance is never negative.`,
    ],
  ],
  [
    /^(\d+)\/(\d+) = x\/(\d+)\. Find x\.$/,
    (a, b, c) => [
      `Look at the bottoms: ${b} became ${c}.`,
      `What times ${b} makes ${c}?`,
      `Multiply the top, ${a}, by that same number.`,
    ],
  ],
  [
    /^Is (-?\d+) a solution to x (>|<|≥|≤) (-?\d+)\?$/,
    (v, op, c) => [`Replace x with ${v}.`, `Ask: is ${v} ${op} ${c} true or false?`],
  ],
  [
    /^(\d+) of (\d+) equal sections are winning sections/,
    (w, t) => [
      `Probability = wanted outcomes out of all outcomes.`,
      `Wanted: ${w} sections. All: ${t} sections.`,
      `Write it as a fraction: wanted over all.`,
    ],
  ],
  [
    /^(\d+)\^(\d+) = \?$/,
    (b, e) => [
      `The exponent ${e} says to write ${b} ${e} times, with × between.`,
      `Multiply two at a time, from left to right.`,
    ],
  ],
  [
    /^([\d.]+) × 10\^(-?\d+) = \?$/,
    (n, e) => [
      `The exponent ${e} tells how many places to move the decimal point.`,
      Number(e) > 0
        ? `A positive exponent moves it right ${e} place${e === "1" ? "" : "s"}. Add zeros if you need them.`
        : `A negative exponent moves it left ${-e} place${e === "-1" ? "" : "s"}.`,
    ],
  ],
  [
    /^√(\d+) = \?$/,
    (n) => [
      `√${n} asks: what number times itself makes ${n}?`,
      `Guess a number. Multiply it by itself. Try higher or lower.`,
    ],
  ],
  [
    /^Find the slope through/,
    () => [
      `Slope = rise ÷ run. Rise is up or down. Run is across.`,
      `Rise: subtract the two y-values.`,
      `Run: subtract the two x-values, in the same order.`,
    ],
  ],
  [
    /^If y = (.+), find y when x = (-?\d+)\.$/,
    (rule, x) => [
      `Write ${x} where x is: y = ${rule.replace("x", `(${x})`)}.`,
      `Multiply first. Then add or subtract.`,
    ],
  ],
  [
    /^x \+ y = (-?\d+) and x − y = (-?\d+)\. Find x\.$/,
    () => [
      `Add the two equations. The y parts cancel each other out.`,
      `Only x is left. Solve for x.`,
    ],
  ],
  [
    /^Reflect \((-?\d+), (-?\d+)\) across the (x-axis|y-axis|origin)\.$/,
    (x, y, line) => [
      {
        "x-axis": `Across the x-axis: keep x. Change y to its opposite.`,
        "y-axis": `Across the y-axis: keep y. Change x to its opposite.`,
        origin: `Across the origin: change both x and y to their opposites.`,
      }[line],
      `Now use that rule on (${x}, ${y}).`,
    ],
  ],
  [
    /^A right triangle has legs (\d+) and (\d+)\./,
    (a, b) => [
      `a² + b² = c². The legs are a and b. The hypotenuse c is the longest side.`,
      `Square each leg (${a} and ${b}). Then add the squares.`,
      `Take the square root of the total. That is c.`,
    ],
  ],
  [
    /^A jug holds (\d+) liters\. How many 1\/(\d+)-liter servings can it fill\?$/,
    (whole, d) => [
      `One serving is 1/${d} liter. How many servings fit in 1 liter?`,
      `1 liter holds ${d} servings. You have ${whole} liters.`,
      `Multiply: ${whole} × ${d}.`,
    ],
  ],
  [
    /^A ribbon that is 1\/(\d+) meter long is shared equally by (\d+) students/,
    (d, whole) => [
      `Share 1/${d} meter equally among ${whole} students. That means divide: 1/${d} ÷ ${whole}.`,
      `Dividing by ${whole} is the same as multiplying by 1/${whole}.`,
      `Multiply the bottoms: ${d} × ${whole}. The top stays 1.`,
    ],
  ],
  [
    /^Area of a triangle with base (\d+) and height (\d+)\?$/,
    (b, h) => [
      `A triangle is half of a rectangle. It has the same base and height.`,
      `Multiply base × height: ${b} × ${h}.`,
      `Then take half of that product.`,
    ],
  ],
  [
    /^A scale drawing uses 1 cm to represent (\d+) m\. A wall is (\d+) cm long/,
    (scale, drawing) => [
      `The scale says 1 cm on paper is ${scale} m in real life.`,
      `The wall is ${drawing} cm on paper. That is ${drawing} groups of 1 cm.`,
      `Each group is ${scale} m. Multiply ${drawing} × ${scale}.`,
    ],
  ],
  [
    /^Two (complementary|supplementary) angles include one angle that measures (\d+)°/,
    (kind, known) => {
      const total = kind === "complementary" ? 90 : 180;
      return [
        `${kind[0].toUpperCase()}${kind.slice(1)} angles add up to ${total}°.`,
        `You know one angle: ${known}°. The other angle is the missing part.`,
        `Subtract to find the missing part: ${total}° − ${known}°.`,
      ];
    },
  ],
  [
    /^One of two vertical angles measures (\d+)°/,
    () => [
      `Vertical angles sit across from each other where two lines cross.`,
      `Vertical angles are equal. So the other angle matches the one you know.`,
    ],
  ],
  [
    /^Two angles total (\d+)°\. One angle is (\d+)°/,
    (total, known) => [`The two angles add up to ${total}°.`, `One angle is ${known}°. Subtract to find the missing part: ${total}° − ${known}°.`],
  ],
  [
    /^\((\d+) \+ (\d+)\) × (\d+) = \?$/,
    (a, b, c) => [`Do the parentheses first: ${a} + ${b}.`, `Then multiply that sum by ${c}.`],
  ],
  [
    /^(\d+) \+ (\d+) × (\d+) = \?$/,
    (a, b, c) => [`Multiply before you add: ${b} × ${c}.`, `Then add ${a}.`],
  ],
  [
    /^A data table has x-values/,
    () => [
      `Read the y-values from left to right. x goes up each time.`,
      `Does y go up, go down, or jump around? Pick the matching choice.`,
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
