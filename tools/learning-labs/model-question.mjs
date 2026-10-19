// The "lab model" number question for each practice level: a plain question about the
// model's settings, hints for that model, and likely wrong answers derived from the same
// settings (so feedback names the error a student most likely made).
import { evaluate, fmt, statistics } from "../../curriculum/learning-labs/shared/math.mjs";

const DATA = {
  range: {
    ask: "What is the range of the observations?",
    hints: ["Find the greatest and the least observations.", "Range = greatest − least."],
    mistakes: (s) => [[s.max, "That is the greatest value. Subtract the least value from it."]],
  },
  median: {
    ask: "What is the median of the observations?",
    hints: [
      "Put the observations in order first.",
      "With an even number of observations, the median is halfway between the two middle values.",
    ],
    mistakes: (s) => [[s.mean, "That is the mean. The median is the middle of the ordered list."]],
  },
  iqr: {
    ask: "What is the interquartile range (IQR) of the observations?",
    hints: [
      "Split the ordered data into a lower half and an upper half.",
      "Find the median of each half (Q1 and Q3), then subtract: Q3 − Q1.",
    ],
    mistakes: (s) => [
      [s.range, "That is the range. The IQR uses only the middle half: Q3 − Q1."],
      [s.q3, "That is Q3. Subtract Q1 from it."],
    ],
  },
  mad: {
    ask: "What is the mean absolute deviation (MAD) of the observations?",
    hints: [
      "Find the mean first.",
      "Find how far each observation is from the mean, then average those distances.",
    ],
    mistakes: (s) => [
      [s.mean, "That is the mean. The MAD is the average distance from the mean."],
      [
        s.mad * s.sorted.length,
        "That is the total distance. Divide by the number of observations.",
      ],
    ],
  },
};

const DATA_KEY = {
  histogram: "range",
  box: "median",
  spread: "iqr",
  "mean-mad": "mad",
  outlier: "median",
};

// Returns { ask, hints, mistakes: [[value, feedback]], answer?, explanation?, keep? }.
function spec(model, v, r) {
  const [a, b, c] = v;
  switch (model.kind) {
    case "array":
      return {
        ask: "How many spaces are there in all?",
        hints: [
          "Each row is one equal group.",
          "Multiply the rows by the seats or tiles in each row.",
        ],
        mistakes: [
          [a + b, "You added. Each row is a full group, so multiply."],
          [
            2 * (a + b),
            "That is the perimeter, the distance around. The question asks for the total spaces.",
          ],
        ],
      };
    case "data": {
      const d = DATA[DATA_KEY[model.mode]];
      return { ask: d.ask, hints: d.hints, mistakes: d.mistakes(statistics(v)) };
    }
    case "decimal":
      return {
        ask: "What is the order total in dollars?",
        hints: [
          "Every item costs the same, so multiply the price by the number of items.",
          "Estimate first: round the price to a whole dollar and check your answer is close.",
        ],
        mistakes: [[a + b, "You added. Items at the same price means multiply."]],
      };
    case "division":
      return {
        ask: "How many equal shipments does the total supply make?",
        hints: [
          "Divide the total supply by the amount in each shipment.",
          "Multiply both numbers by 10 so you divide by a whole number.",
        ],
        mistakes: [
          [a * b, "You multiplied. Splitting the supply into shipments means divide."],
          [b / a, "You divided the wrong way. Divide the total by the amount in each shipment."],
        ],
      };
    case "ratio": {
      const [first, second] =
        model.mode === "compare" ? ["color paint", "white paint"] : ["juice", "water"];
      return {
        ask: `How many cups of ${first} are there for each cup of ${second}?`,
        hints: [
          `Write the ratio ${first} : ${second}.`,
          `Divide the cups of ${first} by the cups of ${second}.`,
        ],
        mistakes: [[b / a, `You divided the wrong way. Put ${first} first: ${first} ÷ ${second}.`]],
      };
    }
    case "rate":
      return {
        ask: "What is the unit price, in dollars per item?",
        hints: [
          "Unit price means the cost of one item.",
          "Divide the pack price by the number of items.",
        ],
        mistakes: [[b / a, "You divided items by dollars, which gives items per dollar."]],
      };
    case "conversion": {
      const [small, large, factor] =
        model.mode === "scale"
          ? ["inches", "feet", "12 inches per foot"]
          : ["centimeters", "inches", "2.54 centimeters per inch"];
      return {
        ask: `How long is it in ${small}?`,
        hints: [
          `${small[0].toUpperCase()}${small.slice(1)} are smaller than ${large}, so expect a bigger number.`,
          `Multiply by ${factor}.`,
        ],
        mistakes: [
          [
            a / b,
            `${small[0].toUpperCase()}${small.slice(1)} are smaller units, so there are more of them. Multiply.`,
          ],
        ],
      };
    }
    case "growth":
      return model.mode === "ratio-graph"
        ? {
            ask: "How many passengers ride in that many carriages?",
            hints: [
              "Every carriage holds the same number of passengers.",
              "Multiply passengers per carriage by the number of carriages.",
            ],
            mistakes: [[a + c, "You added. Equal groups in every carriage means multiply."]],
          }
        : {
            ask: "What is the output y for this input?",
            hints: [
              "Start with the starting amount, then add the increase once for every step.",
              "y = (increase per step × input) + starting amount.",
            ],
            mistakes: [
              [a * c, "You left out the starting amount. Add it after multiplying."],
              [
                (a + b) * c,
                "Multiply the increase by the input first, then add the starting amount once.",
              ],
            ],
          };
    case "percent":
      if (model.mode === "whole")
        return {
          ask: "What is the whole amount?",
          hints: [
            "The known part is only some percent of the whole, so the whole is bigger.",
            "Divide the known part by the percent written as a decimal.",
          ],
          mistakes: [
            [
              (a / 100) * b,
              "You found that percent of the part. The part is the percent of the whole, so divide.",
            ],
          ],
        };
      if (model.mode === "discount")
        return {
          ask: "How many dollars is the discount?",
          hints: [
            "The discount is a percent of the original price.",
            "Write the percent as a decimal and multiply by the original price.",
          ],
          mistakes: [
            [
              b - r.value,
              "That is the final price. The question asks for the discount, the amount saved.",
            ],
          ],
        };
      return {
        ask: "What amount of the whole does the percent stand for?",
        hints: [
          "A percent is a number out of 100.",
          "Write the percent as a decimal, then multiply by the whole amount.",
        ],
        mistakes: [[a * b, "Divide the percent by 100 before you multiply."]],
      };
    case "area":
      if (model.mode === "trapezoid")
        return {
          ask: "What is the area of the trapezoid?",
          hints: [
            "Average the two parallel bases.",
            "Area = (first base + second base) ÷ 2 × height.",
          ],
          mistakes: [[(a + b) * c, "You forgot to divide by 2. Average the bases first."]],
        };
      if (model.mode === "polygon")
        return {
          ask: "What is the area of the regular polygon? Round to the nearest hundredth.",
          extraParameters: [`Apothem: ${fmt(r.apothem)}`],
          tolerance: 0.01,
          hints: ["Perimeter = number of sides × side length.", "Area = perimeter × apothem ÷ 2."],
          mistakes: [
            [
              2 * r.value,
              "Divide by 2. The polygon is made of triangles: perimeter × apothem ÷ 2.",
            ],
          ],
        };
      return {
        ask: "What is the area of the triangle?",
        hints: [
          "A triangle is half of a parallelogram with the same base and height.",
          "Area = base × height ÷ 2.",
        ],
        mistakes: [[a * b, "That is the parallelogram's area. A triangle is half of it."]],
      };
    case "solid":
      return model.mode === "surface"
        ? {
            ask: "What is the total surface area of the prism?",
            hints: [
              "A rectangular prism has three pairs of matching faces.",
              "Find the area of one face from each pair, add them, then double.",
            ],
            mistakes: [
              [a * b + a * c + b * c, "That counts only one face of each pair. Double it."],
              [a * b * c, "That is the volume. Surface area adds the areas of all six faces."],
            ],
          }
        : {
            ask: "What is the volume of the prism?",
            hints: [
              "One layer holds length × width unit cubes.",
              "Multiply one layer by the number of layers (the height).",
            ],
            mistakes: [
              [a * b, "That is one layer. Multiply by the height too."],
              [r.prismArea, "That is the surface area. Volume counts the cubes inside."],
            ],
          };
    case "fraction":
      return {
        ask: "How many servings of that size fit in the supply? Give the exact quotient, as a fraction, mixed number, or decimal.",
        hints: [
          "Ask: how many of this serving size fit into the supply?",
          "Dividing by a fraction is the same as multiplying by its reciprocal.",
        ],
        mistakes: [
          [
            (a * b) / c,
            "You multiplied by the serving size. Divide by it: multiply by the reciprocal.",
          ],
          [
            Math.floor(r.value + 1e-10),
            "That counts whole servings only. Give the exact quotient, including the fraction.",
          ],
        ],
      };
    case "power":
      return {
        ask: `Evaluate ${c} + ${a}^${b}.`,
        hints: [
          `${a}^${b} means ${a} multiplied by itself ${b} times, not ${a} × ${b}.`,
          `Work out the power first, then add ${c}.`,
        ],
        mistakes: [
          [a * b + c, "An exponent means repeated multiplication, not base × exponent."],
          [(a + c) ** b, "Work out the power first, then add."],
        ],
      };
    case "expression":
      return {
        ask: "a(x + b) and ax + ab give the same value. What is that value?",
        hints: [
          "Replace x with its value, then work out a(x + b).",
          "Check by distributing: a × x + a × b should match.",
        ],
        mistakes: [
          [a * c + b, "The factor a multiplies every term in the parentheses, including b."],
        ],
      };
    case "factors":
      return model.mode === "lcm"
        ? {
            ask: "What is the least common multiple of the two numbers?",
            hints: ["List multiples of each number.", "Find the smallest number in both lists."],
            mistakes: [
              [a * b, "That is a common multiple, but not the least one."],
              [r.gcf, "That is the greatest common factor. The question asks for a multiple."],
            ],
          }
        : {
            ask: "What is the greatest common factor of the two numbers?",
            hints: [
              "List the factors of each number.",
              "Pick the largest factor that is in both lists.",
            ],
            mistakes: [
              [r.lcm, "That is the least common multiple. A common factor divides both numbers."],
              [1, "1 is always a common factor. Look for a greater one."],
            ],
          };
    case "line":
      return model.mode === "opposites"
        ? {
            ask: "How far is the first location from zero?",
            hints: [
              "Distance is never negative.",
              "The absolute value of a number is its distance from zero.",
            ],
            mistakes: [],
          }
        : {
            ask: "How far apart are the two locations?",
            hints: [
              "Are the two locations on the same side of zero or on opposite sides?",
              "Same side: subtract their distances from zero. Opposite sides: add them.",
            ],
            mistakes: [
              [
                Math.sign(a) === Math.sign(b)
                  ? Math.abs(a) + Math.abs(b)
                  : Math.abs(Math.abs(a) - Math.abs(b)),
                "Check which side of zero each location is on before you add or subtract.",
              ],
            ],
          };
    case "coordinates":
      return model.mode === "rectangle"
        ? {
            ask: "What is the area of the rectangle with opposite corners A and B?",
            hints: [
              "Width = difference of the x-coordinates. Height = difference of the y-coordinates.",
              "Subtracting a negative coordinate adds its distance from zero.",
            ],
            mistakes: [[2 * (r.width + r.height), "That is the perimeter. Area = width × height."]],
          }
        : {
            ask: "Moving only along horizontal and vertical streets, how far is it from A to B?",
            hints: [
              "Find the horizontal distance from the x-coordinates.",
              "Find the vertical distance from the y-coordinates, then add the two distances.",
            ],
            mistakes: [
              // Only when the route turns a corner; on a shared row or column one leg is 0.
              ...(r.width && r.height
                ? [
                    [
                      r.width,
                      "That is only the horizontal distance. Add the vertical distance too.",
                    ],
                    [
                      r.height,
                      "That is only the vertical distance. Add the horizontal distance too.",
                    ],
                  ]
                : []),
            ],
          };
    case "balance":
      return model.mode === "add"
        ? {
            ask: `Solve x + ${a} = ${b}. What is x?`,
            answer: b - a,
            explanation: `Subtract ${a} from both sides: x = ${fmt(b - a)}. Check: ${fmt(b - a)} + ${a} = ${b}.`,
            keep: 2,
            hints: [
              `What number plus ${a} makes ${b}?`,
              `Undo + ${a} by subtracting ${a} from both sides.`,
            ],
            mistakes: [[a + b, `You added. Undo + ${a} by subtracting ${a}.`]],
          }
        : {
            ask: `Solve ${a}x = ${b}. What is x?`,
            answer: b / a,
            explanation: `Divide both sides by ${a}: x = ${fmt(b / a)}. Check: ${a} × ${fmt(b / a)} = ${b}.`,
            keep: 2,
            hints: [
              `${a} times what number makes ${b}?`,
              `Undo × ${a} by dividing both sides by ${a}.`,
            ],
            mistakes: [
              [a * b, `You multiplied. Undo × ${a} by dividing by ${a}.`],
              [b - a, `${a}x means ${a} times x. Divide, do not subtract.`],
            ],
          };
    case "inequality":
      return model.mode === "entry"
        ? {
            ask: `The rule is x ≥ ${a}. What is the smallest whole number that follows the rule?`,
            answer: a,
            explanation: `≥ includes the boundary, so ${a} itself follows the rule. Closed circle at ${a}.`,
            keep: 1,
            hints: [
              "Does ≥ include the boundary itself?",
              "The line under the symbol means “or equal to.”",
            ],
            mistakes: [[a + 1, `≥ includes ${a} itself.`]],
          }
        : {
            ask: `The rule is x ≤ ${a}. What is the greatest whole number that follows the rule?`,
            answer: a,
            explanation: `≤ includes the boundary, so ${a} itself follows the rule. Closed circle at ${a}.`,
            keep: 1,
            hints: [
              "Does ≤ include the boundary itself?",
              "The line under the symbol means “or equal to.”",
            ],
            mistakes: [[a - 1, `≤ includes ${a} itself.`]],
          };
    default:
      throw new Error(`No lab-model question for ${model.kind}`);
  }
}

export function modelQuestion(model, values, fields, tolerance) {
  const r = evaluate(model, values);
  const s = spec(model, values, r);
  const answer = Number((s.answer ?? r.value).toFixed(10));
  const tol = s.tolerance ?? tolerance;
  const decimals = !Number.isInteger(answer) && !s.tolerance && model.kind !== "fraction";
  // Name the unit only when the question does not already say it ("in dollars", "servings").
  const unitWord = r.unit.split(" ").at(-1);
  const sayUnit = r.unit && !s.answer && model.kind !== "fraction" && !s.ask.includes(unitWord);
  const mistakes = [];
  for (const [value, feedback] of s.mistakes)
    if (
      Number.isFinite(value) &&
      Math.abs(value - answer) > tol &&
      !mistakes.some((m) => Math.abs(m.answer - value) <= tol)
    )
      mistakes.push({ answer: Number(value.toFixed(6)), feedback });
  return {
    prompt: `Set the lab model to these values. ${s.ask}${sayUnit ? ` Give the answer in ${r.unit}.` : ""}${decimals ? " Round to four decimal places if needed." : ""}`,
    parameters: [
      ...fields
        .map((f, i) => (f.label === "Unused" ? null : `${f.label}: ${values[i]}`))
        .filter(Boolean)
        .slice(0, s.keep ?? fields.length),
      ...(s.extraParameters || []),
    ],
    answer,
    tolerance: tol,
    explanation: s.explanation ?? `${r.equation}. ${r.note}`,
    hints: s.hints,
    mistakes,
  };
}
