import {
  buildCoordinatePractice,
  buildDataPractice,
} from "./small-group-parallel-practice-data.mjs";

const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
};

const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
const tidy = (value) => Number(Number(value).toFixed(4));
const factors = (value) =>
  Array.from({ length: value }, (_, index) => index + 1).filter(
    (candidate) => value % candidate === 0,
  );

function primeFactors(value) {
  const result = [];
  let remaining = value;
  for (let divisor = 2; divisor * divisor <= remaining; divisor++) {
    while (remaining % divisor === 0) {
      result.push(divisor);
      remaining /= divisor;
    }
  }
  if (remaining > 1) result.push(remaining);
  return result;
}

function fraction(numerator, denominator) {
  const sign = denominator < 0 ? -1 : 1;
  const divisor = gcd(numerator, denominator);
  return { n: (sign * numerator) / divisor, d: Math.abs(denominator) / divisor };
}

const fractionText = ({ n, d }) => (d === 1 ? String(n) : `${n}/${d}`);
const divideFractions = (left, right) => fraction(left.n * right.d, left.d * right.n);

function makeItem(context, index, { stem, answer, visual, steps, hint, explanation }) {
  return {
    id: `${context.lessonId}-parallel-${String(index + 1).padStart(2, "0")}`,
    type: "guided-fill",
    stem,
    answer: String(answer),
    visual,
    steps: steps.map(([prompt, stepAnswer]) => ({ prompt, answer: String(stepAnswer) })),
    hints: [hint || "Use the visual model, then complete one step at a time."],
    explanation:
      explanation || steps.map(([prompt, value]) => prompt.replace("___", value)).join(" "),
  };
}

function unit1(context) {
  const lesson = context.lesson;
  const shift = context.group === 2 ? 12 : 0;
  if (lesson === 1) {
    const values = [42, 54, 66, 70, 75, 84, 88, 96, 99, 105, 110, 126];
    return values.map((base, index) => {
      const value = base + shift * 2;
      const primes = primeFactors(value);
      const first = primes[0];
      return makeItem(context, index, {
        stem: `Build a new factor tree for ${value}. Write the prime factorization.`,
        answer: primes.join(" × "),
        visual: { kind: "factor-tree", value },
        steps: [
          [`The smallest prime factor of ${value} is ___.`, first],
          [`${value} ÷ ${first} = ___.`, value / first],
          ["Continue until every leaf is prime: ___.", primes.join(" × ")],
        ],
        hint: "Start by testing divisibility by 2, then 3, then 5.",
      });
    });
  }
  if (lesson === 2 || lesson === 3) {
    const pairs = [
      [18, 30],
      [24, 36],
      [28, 42],
      [32, 48],
      [35, 50],
      [40, 60],
      [45, 75],
      [54, 72],
      [56, 84],
      [63, 90],
      [70, 105],
      [72, 108],
    ];
    return pairs.map(([left, right], index) => {
      const a = left + (context.group === 2 ? 6 : 0);
      const b = right + (context.group === 2 ? 12 : 0);
      const answer = lesson === 2 ? gcd(a, b) : lcm(a, b);
      const label = lesson === 2 ? "greatest common factor" : "least common multiple";
      return makeItem(context, index, {
        stem: `Find the ${label} of ${a} and ${b}.`,
        answer,
        visual: { kind: lesson === 2 ? "factor-table" : "multiple-lanes", values: [a, b] },
        steps:
          lesson === 2
            ? [
                [`List the factors of ${a}: ___.`, factors(a).join(", ")],
                [`List the factors of ${b}: ___.`, factors(b).join(", ")],
                ["Choose the greatest factor in both lists: ___.", answer],
              ]
            : [
                [`Write multiples of ${a} until the first match: ___.`, answer],
                [`Check: ${answer} ÷ ${a} is a whole number: ___.`, answer / a],
                [`Check: ${answer} ÷ ${b} is a whole number: ___.`, answer / b],
              ],
      });
    });
  }
  if (lesson === 4) {
    return Array.from({ length: 12 }, (_, index) => {
      const divisor = 6 + (index % 7);
      const quotient = 42 + index * 3 + shift;
      const remainder = index % divisor;
      const dividend = divisor * quotient + remainder;
      return makeItem(context, index, {
        stem: `Divide ${dividend} by ${divisor}. Give the quotient and remainder.`,
        answer: `${quotient} R${remainder}`,
        visual: { kind: "division-box", values: [dividend, divisor] },
        steps: [
          [`${divisor} fits into ${dividend} about ___ times.`, quotient],
          [`Multiply back: ${divisor} × ${quotient} = ___.`, divisor * quotient],
          ["The amount left is ___.", remainder],
        ],
      });
    });
  }
  const decimals = Array.from({ length: 12 }, (_, index) => ({
    a: tidy(4.25 + index * 0.7 + context.group * 0.13),
    b: tidy(1.2 + (index % 5) * 0.25),
  }));
  return decimals.map(({ a, b }, index) => {
    const operation = lesson === 5 ? (index % 2 ? "−" : "+") : lesson === 6 ? "×" : "÷";
    const answer =
      operation === "+"
        ? tidy(a + b)
        : operation === "−"
          ? tidy(a - b)
          : operation === "×"
            ? tidy(a * b)
            : tidy(a / b);
    return makeItem(context, index, {
      stem: `Solve the new decimal problem: ${a} ${operation} ${b}.`,
      answer,
      visual: { kind: "place-value", values: [a, b], operation },
      steps: [
        [
          "Line up or rewrite the place values: ___ decimal places in the first number.",
          String(a).split(".")[1]?.length || 0,
        ],
        [`Estimate the answer before calculating: about ___.`, Math.round(answer)],
        ["Calculate and place the decimal: ___.", answer],
      ],
    });
  });
}

function unit2(context) {
  const lesson = context.lesson;
  return Array.from({ length: 12 }, (_, index) => {
    const a = 2 + (index % 5);
    const b = 3 + (index % 4);
    const c = 2 + ((index + 1) % 5);
    const d = 3 + ((index + 2) % 5);
    let left = fraction(a, b);
    let right = fraction(c, d);
    let stem;
    if (lesson === 1) {
      left = fraction(2 + (index % 4), 3 + (index % 3));
      right = fraction(1, 4 + (index % 4));
      stem = `How many groups of ${fractionText(right)} fit in ${fractionText(left)}?`;
    } else if (lesson === 2) {
      left = fraction(3 + index + context.group, 1);
      right = fraction(1 + (index % 3), 2 + (index % 4));
      stem = `Divide the whole number by the fraction: ${fractionText(left)} ÷ ${fractionText(right)}.`;
    } else if (lesson === 4) {
      left = fraction((2 + (index % 4)) * 2 + 1, 2);
      right = fraction((1 + (index % 3)) * 3 + 1, 3);
      stem = `Divide the mixed-number amounts: ${fractionText(left)} ÷ ${fractionText(right)}.`;
    } else {
      stem =
        lesson === 5
          ? `A ribbon is ${fractionText(left)} meter long. Each piece is ${fractionText(right)} meter. How many pieces can be cut?`
          : `Solve the new fraction quotient: ${fractionText(left)} ÷ ${fractionText(right)}.`;
    }
    const answer = divideFractions(left, right);
    const reciprocal = fraction(right.d, right.n);
    return makeItem(context, index, {
      stem,
      answer: fractionText(answer),
      visual: { kind: "fraction-bars", left, right },
      steps: [
        [`Keep the first number: ___.`, fractionText(left)],
        [`Use the reciprocal of ${fractionText(right)}: ___.`, fractionText(reciprocal)],
        ["Multiply and simplify: ___.", fractionText(answer)],
      ],
      hint: "Keep the first fraction, change division to multiplication, and flip the second fraction.",
    });
  });
}

function unit3(context) {
  const lesson = context.lesson;
  return Array.from({ length: 12 }, (_, index) => {
    const left = 2 + (index % 6);
    const right = 3 + ((index * 2) % 7);
    const scale = 2 + (index % 5) + (context.group === 2 ? 2 : 0);
    const unitRate = tidy(right / left);
    let stem = `A new model has ${left} blue tiles for every ${right} gold tiles. Write the ratio blue:gold.`;
    let answer = `${left}:${right}`;
    let steps = [
      ["Blue tiles: ___.", left],
      ["Gold tiles: ___.", right],
      ["Write blue first, then gold: ___.", answer],
    ];
    let visual = { kind: "ratio-dots", values: [left, right] };
    if ([2, 3, 4].includes(lesson)) {
      answer = `${left * scale}:${right * scale}`;
      stem = `Complete a new equivalent ratio: ${left}:${right} = ___:___. Use a scale factor of ${scale}.`;
      steps = [
        [`Multiply ${left} × ${scale}: ___.`, left * scale],
        [`Multiply ${right} × ${scale}: ___.`, right * scale],
        ["Write the equivalent ratio: ___.", answer],
      ];
      visual = {
        kind: lesson === 3 ? "coordinate-ratio" : "ratio-table",
        values: [left, right, scale],
      };
    } else if ([5, 7].includes(lesson)) {
      const otherLeft = left + 1;
      const otherRight = right + 2;
      const otherRate = tidy(otherRight / otherLeft);
      answer = unitRate < otherRate ? "first ratio" : "second ratio";
      stem = `Compare the new ratios ${left}:${right} and ${otherLeft}:${otherRight}. Which has the smaller unit rate?`;
      steps = [
        [`First unit rate: ${right} ÷ ${left} = ___.`, unitRate],
        [`Second unit rate: ${otherRight} ÷ ${otherLeft} = ___.`, otherRate],
        ["The smaller unit rate belongs to the ___.", answer],
      ];
      visual = { kind: "double-rate-bars", values: [left, right, otherLeft, otherRight] };
    } else if (lesson === 6) {
      answer = left * scale;
      stem = `A drawing uses a scale of 1:${scale}. A side is ${left} cm in the drawing. Find the actual length.`;
      steps = [
        [`Scale factor: ___.`, scale],
        [`Multiply ${left} × ${scale}: ___.`, answer],
      ];
      visual = { kind: "scale-bars", values: [left, answer] };
    }
    return makeItem(context, index, { stem, answer, visual, steps });
  });
}

function unit4(context) {
  const lesson = context.lesson;
  return Array.from({ length: 12 }, (_, index) => {
    const n = index + 2 + context.group;
    if (lesson === 2) {
      const [numerator, denominator] = [
        [1, 2],
        [1, 4],
        [3, 4],
        [1, 5],
        [2, 5],
        [3, 5],
        [4, 5],
        [1, 8],
        [3, 8],
        [5, 8],
        [7, 8],
        [9, 10],
      ][index];
      const decimal = tidy(numerator / denominator);
      const percent = tidy(decimal * 100);
      return makeItem(context, index, {
        stem: `Complete the new equivalence: ${numerator}/${denominator} = ___ decimal = ___%.`,
        answer: `${decimal} = ${percent}%`,
        visual: { kind: "percent-grid", percent },
        steps: [
          [`Divide ${numerator} ÷ ${denominator}: ___.`, decimal],
          [`Multiply the decimal by 100: ___.`, percent],
          ["Write the percent with its symbol: ___.", `${percent}%`],
        ],
      });
    }
    if (lesson === 3) {
      const percent = index % 2 ? tidy(125 + n * 7.5) : tidy((n + 1) / 100);
      const decimal = tidy(percent / 100);
      return makeItem(context, index, {
        stem: `Rewrite the new percent ${percent}% as a decimal.`,
        answer: decimal,
        visual: { kind: "percent-grid", percent },
        steps: [
          ["Percent means divide by ___.", 100],
          [`${percent} ÷ 100 = ___.`, decimal],
        ],
      });
    }
    const base = 40 + n * 10;
    const percent = [5, 10, 15, 20, 25, 30, 40, 50][index % 8];
    const amount = tidy((base * percent) / 100);
    if ([4, 5].includes(lesson)) {
      const answer = lesson === 5 ? tidy(base - amount) : amount;
      const stem =
        lesson === 5
          ? `A new item costs $${base} and is ${percent}% off. Find the sale price.`
          : `Find ${percent}% of ${base} using a model or equation.`;
      return makeItem(context, index, {
        stem,
        answer,
        visual: { kind: "percent-bar", whole: base, percent },
        steps: [
          [`Write ${percent}% as a decimal: ___.`, percent / 100],
          [`Find the percent amount: ${base} × ${percent / 100} = ___.`, amount],
          ...(lesson === 5 ? [[`Subtract the discount: ${base} − ${amount} = ___.`, answer]] : []),
        ],
      });
    }
    if (lesson === 6) {
      const factor = [12, 3, 16, 100, 1000][index % 5];
      const answer = n * factor;
      return makeItem(context, index, {
        stem: `Use the conversion factor ${factor}. Convert ${n} larger units to smaller units.`,
        answer,
        visual: { kind: "conversion-table", values: [n, factor] },
        steps: [
          ["Choose multiply because the target units are ___.", "smaller"],
          [`${n} × ${factor} = ___.`, answer],
        ],
      });
    }
    const quantity = 3 + (index % 7);
    const cost = tidy(quantity * (2.25 + (index % 5) * 0.4));
    const answer = tidy(cost / quantity);
    return makeItem(context, index, {
      stem: `${quantity} items cost $${cost}. Find the new unit rate per item.`,
      answer,
      visual: { kind: "unit-rate-table", values: [quantity, cost] },
      steps: [
        [`Divide cost by quantity: ${cost} ÷ ${quantity} = ___.`, answer],
        ["Write the rate for 1 item: $___.", answer],
      ],
    });
  });
}

function unit5or10(context) {
  const { unit, lesson } = context;
  return Array.from({ length: 12 }, (_, index) => {
    const a = 4 + (index % 7) + context.group;
    const b = 3 + ((index * 2) % 6);
    const c = 2 + ((index * 3) % 5);
    if (unit === 10) {
      if (lesson <= 2) {
        const answer = a * b * c;
        return makeItem(context, index, {
          stem: `Find the volume of a new prism with dimensions ${a} by ${b} by ${c}.`,
          answer,
          visual: { kind: "volume-prism", values: [a, b, c] },
          steps: [
            [`Base area: ${a} × ${b} = ___.`, a * b],
            [`Volume: ${a * b} × ${c} = ___.`, answer],
            ["Label the answer in ___ units.", "cubic"],
          ],
        });
      }
      if (lesson === 3) {
        const answer = 2 * (a * b + a * c + b * c);
        return makeItem(context, index, {
          stem: `A rectangular prism net has length ${a}, width ${b}, and height ${c}. Find its total surface area.`,
          answer,
          visual: { kind: "prism-net", values: [a, b, c] },
          steps: [
            [`Find the top and bottom together: 2(${a} × ${b}) = ___.`, 2 * a * b],
            [`Find the front and back together: 2(${a} × ${c}) = ___.`, 2 * a * c],
            [`Find the two side faces: 2(${b} × ${c}) = ___.`, 2 * b * c],
            ["Add all six faces: ___.", answer],
          ],
        });
      }
      if (lesson === 4 && index % 2) {
        const [leg1, leg2, hypotenuse] = [
          [3, 4, 5],
          [5, 12, 13],
          [6, 8, 10],
          [8, 15, 17],
          [7, 24, 25],
          [9, 12, 15],
        ][Math.floor(index / 2)];
        const length = c + context.group + Math.floor(index / 4);
        const trianglePair = leg1 * leg2;
        const perimeter = leg1 + leg2 + hypotenuse;
        const lateralArea = perimeter * length;
        const answer = trianglePair + lateralArea;
        return makeItem(context, index, {
          stem: `A triangular prism is ${length} units long. Its right-triangle base has side lengths ${leg1}, ${leg2}, and ${hypotenuse}. Find the total surface area.`,
          answer,
          visual: {
            kind: "triangular-prism-surface",
            values: [leg1, leg2, hypotenuse, length],
          },
          steps: [
            [`Find both triangular ends: 2(1/2 × ${leg1} × ${leg2}) = ___.`, trianglePair],
            [`Add the triangle side lengths: ${leg1} + ${leg2} + ${hypotenuse} = ___.`, perimeter],
            [`Find the three rectangles together: ${perimeter} × ${length} = ___.`, lateralArea],
            ["Add the ends and rectangles: ___.", answer],
          ],
        });
      }
      if (lesson === 4) {
        const threeFaceSum = a * b + a * c + b * c;
        const answer = 2 * threeFaceSum;
        return makeItem(context, index, {
          stem: `Find the surface area of a rectangular prism measuring ${a} by ${b} by ${c}.`,
          answer,
          visual: { kind: "surface-prism", values: [a, b, c] },
          steps: [
            [`Add one of each face pair: ${a * b} + ${a * c} + ${b * c} = ___.`, threeFaceSum],
            ["Double the three-face sum: ___.", answer],
            ["Label the answer in ___ units.", "square"],
          ],
        });
      }
      const baseArea = a * a;
      const oneTriangle = tidy((a * c) / 2);
      const lateralArea = 4 * oneTriangle;
      const answer = baseArea + lateralArea;
      return makeItem(context, index, {
        stem: `A square pyramid has base edge ${a} and slant height ${c}. Find its total surface area.`,
        answer,
        visual: { kind: "pyramid-net", values: [a, c] },
        steps: [
          [`Find the square base: ${a} × ${a} = ___.`, baseArea],
          [`Find one triangular face: 1/2 × ${a} × ${c} = ___.`, oneTriangle],
          [`Find all 4 triangular faces: 4 × ${oneTriangle} = ___.`, lateralArea],
          ["Add the base and all side faces: ___.", answer],
        ],
      });
    }
    let answer;
    let visual;
    let stem;
    let steps;
    if (lesson === 1) {
      answer = a * b;
      stem = `Find the area of a new parallelogram with base ${a} and perpendicular height ${b}.`;
      visual = { kind: "parallelogram-area", values: [a, b] };
      steps = [
        ["Use the perpendicular height: ___.", b],
        [`Area = ${a} × ${b} = ___.`, answer],
      ];
    } else if (lesson === 2) {
      answer = tidy(((a + b) * c) / 2);
      stem = `Find the area of a new trapezoid with bases ${a} and ${b} and height ${c}.`;
      visual = { kind: "trapezoid-area", values: [a, b, c] };
      steps = [
        [`Add the bases: ${a} + ${b} = ___.`, a + b],
        [`Multiply by height, then halve: ___.`, answer],
      ];
    } else if (lesson === 3) {
      answer = tidy((a * b) / 2);
      stem = `Find the area of a new triangle with base ${a} and height ${b}.`;
      visual = { kind: "triangle-area", values: [a, b] };
      steps = [
        [`Base × height: ${a} × ${b} = ___.`, a * b],
        ["Take one half: ___.", answer],
      ];
    } else {
      answer = lesson === 4 ? tidy((6 * a * b) / 2) : a * b + c * b;
      stem =
        lesson === 4
          ? `A regular hexagon splits into 6 triangles with base ${a} and height ${b}. Find its area.`
          : `A composite figure has rectangles ${a}×${b} and ${c}×${b}. Find the total area.`;
      visual = { kind: lesson === 4 ? "polygon-triangles" : "composite-area", values: [a, b, c] };
      steps =
        lesson === 4
          ? [
              ["Area of one triangle: ___.", tidy((a * b) / 2)],
              ["Multiply by 6 triangles: ___.", answer],
            ]
          : [
              [`First rectangle: ${a} × ${b} = ___.`, a * b],
              [`Second rectangle: ${c} × ${b} = ___.`, c * b],
              ["Add both areas: ___.", answer],
            ];
    }
    return makeItem(context, index, { stem, answer, visual, steps });
  });
}

function unit6or7(context) {
  const { unit, lesson } = context;
  return Array.from({ length: 12 }, (_, index) => {
    const x = 2 + index + context.group;
    const a = 2 + (index % 5);
    const b = 4 + ((index * 2) % 9);
    if (unit === 6) {
      if (lesson === 1) {
        const exponent = 2 + (index % 3);
        const answer = x ** exponent;
        return makeItem(context, index, {
          stem: `Evaluate the new power ${x}^${exponent}.`,
          answer,
          visual: { kind: "power-array", values: [x, exponent] },
          steps: [
            ["Write the base as repeated factors: ___.", Array(exponent).fill(x).join(" × ")],
            ["Multiply the factors: ___.", answer],
          ],
        });
      }
      if (lesson === 2) {
        const answer = a * x + b;
        return makeItem(context, index, {
          stem: `Evaluate ${a}x + ${b} when x = ${x}.`,
          answer,
          visual: { kind: "substitution-box", values: [a, x, b] },
          steps: [
            [`Substitute ${x} for x: ${a}(${x}) + ${b}. First multiply: ___.`, a * x],
            [`Add ${b}: ___.`, answer],
          ],
        });
      }
      if (lesson === 3) {
        const answer = `${a}x + ${b}`;
        return makeItem(context, index, {
          stem: `Write an expression for ${b} more than ${a} times a number x.`,
          answer,
          visual: { kind: "expression-tiles", values: [a, b] },
          steps: [
            [`“${a} times x” becomes ___.`, `${a}x`],
            [`“${b} more” means add ___.`, b],
            ["Write the full expression: ___.", answer],
          ],
        });
      }
      if (lesson === 4) {
        const answer = `${b} + ${a}`;
        return makeItem(context, index, {
          stem: `Use the commutative property to rewrite ${a} + ${b}.`,
          answer,
          visual: { kind: "operation-tiles", values: [a, b] },
          steps: [
            ["Keep the same operation: ___.", "+"],
            ["Switch the addends: ___.", answer],
          ],
        });
      }
      const coefficient = a + 2;
      const constant = b + 1;
      const answer =
        lesson === 5
          ? `${coefficient}x + ${coefficient * constant}`
          : `${coefficient + a}x + ${constant}`;
      const stem =
        lesson === 5
          ? `Expand ${coefficient}(x + ${constant}).`
          : `Simplify ${coefficient}x + ${a}x + ${constant}.`;
      return makeItem(context, index, {
        stem,
        answer,
        visual: { kind: "algebra-tiles", values: [coefficient, a, constant] },
        steps:
          lesson === 5
            ? [
                [`Multiply ${coefficient} × x: ___.`, `${coefficient}x`],
                [`Multiply ${coefficient} × ${constant}: ___.`, coefficient * constant],
                ["Write the expanded expression: ___.", answer],
              ]
            : [
                [`Add the x-coefficients: ${coefficient} + ${a} = ___.`, coefficient + a],
                ["Keep the constant term and write: ___.", answer],
              ],
      });
    }
    if (lesson === 1) {
      const answer = `x + ${a} = ${b}`;
      return makeItem(context, index, {
        stem: `Write an equation: a number x plus ${a} equals ${b}.`,
        answer,
        visual: { kind: "balance-scale", values: [a, b] },
        steps: [
          ["Use x for the unknown: ___.", "x"],
          [`“plus ${a}” becomes ___.`, `+ ${a}`],
          ["Write the equation: ___.", answer],
        ],
      });
    }
    if ([2, 3].includes(lesson)) {
      const mult = lesson === 3;
      const result = mult ? a * x : x + a;
      const stem = mult
        ? `Solve the new equation ${a}x = ${result}.`
        : `Solve the new equation x + ${a} = ${result}.`;
      return makeItem(context, index, {
        stem,
        answer: x,
        visual: {
          kind: "balance-scale",
          values: [a, result],
          operation: mult ? "divide" : "subtract",
        },
        steps: mult
          ? [
              [`Divide both sides by ___.`, a],
              [`${result} ÷ ${a} = ___.`, x],
            ]
          : [
              [`Subtract ${a} from both sides: ${result} − ${a} = ___.`, x],
              ["Check by substituting x: ___.", result],
            ],
      });
    }
    const boundary = 4 + index + context.group;
    const symbol = index % 2 ? "≤" : ">";
    const answer = `x ${symbol} ${boundary}`;
    return makeItem(context, index, {
      stem:
        lesson === 4
          ? `Write an inequality: x is ${symbol === "≤" ? "at most" : "greater than"} ${boundary}.`
          : `Solve and graph the new inequality ${answer}.`,
      answer,
      visual: { kind: "inequality-line", boundary, symbol },
      steps: [
        [`The boundary value is ___.`, boundary],
        [`Use the symbol ___.`, symbol],
        ["Write the inequality: ___.", answer],
      ],
    });
  });
}

export function buildParallelPractice(base, lessonId, group) {
  const parentId = lessonId.replace(/-group[12]$/, "");
  const [unit, lesson] = parentId.split("-").map(Number);
  const context = { base, lessonId, parentId, unit, lesson, group };
  let items;
  if (unit === 1) items = unit1(context);
  else if (unit === 2) items = unit2(context);
  else if (unit === 3) items = unit3(context);
  else if (unit === 4) items = unit4(context);
  else if (unit === 5 || unit === 10) items = unit5or10(context);
  else if (unit === 6 || unit === 7) items = unit6or7(context);
  else if (unit === 8) items = buildDataPractice(context);
  else if (unit === 9) items = buildCoordinatePractice(context);
  else throw new Error(`${lessonId}: no parallel-practice builder for unit ${unit}`);
  if (items.length !== 12) throw new Error(`${lessonId}: expected 12 parallel items`);
  return items;
}

export default buildParallelPractice;
