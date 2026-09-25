// Original, self-contained tasks supplement the source lesson banks.
const q = (prompt, answer, explanation) => ({ prompt, answer, explanation });
export function originalPractice(model) {
  switch (model.kind) {
    case "array":
      return model.mode === "estimate"
        ? [
            q(
              "A ride has 16 cars with 4 seats in each. How many riders fit if every seat is filled?",
              64,
              "Sixteen equal groups of four give 16 × 4 = 64. A quick estimate, 15 × 4 = 60, supports the result.",
            ),
            q(
              "You need 48 seats arranged in rows of 6. How many rows do you need?",
              8,
              "48 ÷ 6 = 8 rows. Check: 8 × 6 = 48 seats.",
            ),
          ]
        : [
            q(
              "A rectangular game board has 6 rows and 4 spaces per row. What is its perimeter in space-width units?",
              20,
              "The sides measure 6 and 4 units, so the perimeter is 2(6 + 4) = 20 units.",
            ),
            q(
              "Another board has 3 rows and 8 spaces per row. How much greater is its perimeter than the 6-by-4 board?",
              2,
              "The 3-by-8 board has perimeter 22. Both boards have area 24, but 22 − 20 = 2 more units of perimeter.",
            ),
          ];
    case "data": {
      if (model.mode === "histogram")
        return [
          q(
            "Data: 3, 4, 5, 7, 9, 10, 12. In a histogram with intervals 0–4, 5–9, and 10–14, what is the frequency in 5–9?",
            3,
            "The values 5, 7, and 9 belong in 5–9. The 10 starts the next interval.",
          ),
          q(
            "Data: 2, 2, 6, 6, 6, 8. How many observations are in the data set, including repeats?",
            6,
            "Every measurement counts once. There are six observations, even though only three different values appear.",
          ),
        ];
      if (model.mode === "box")
        return [
          q(
            "Find the median: 2, 4, 6, 8, 10, 12.",
            7,
            "There are six values. Average the middle pair, 6 and 8: (6 + 8) ÷ 2 = 7.",
          ),
          q(
            "For 2, 4, 6, 8, 10, 12, find Q3 using the median of the upper half.",
            10,
            "The upper half is 8, 10, 12. Its median is 10, so Q3 = 10.",
          ),
        ];
      if (model.mode === "spread")
        return [
          q(
            "A team records 3, 4, 5, 7, 8, 9. What is the range?",
            6,
            "Range = maximum − minimum = 9 − 3 = 6.",
          ),
          q(
            "For 3, 4, 5, 7, 8, 9, what is the IQR using medians of halves?",
            4,
            "The lower half 3, 4, 5 has median 4. The upper half 7, 8, 9 has median 8. IQR = 8 − 4 = 4.",
          ),
        ];
      if (model.mode === "mean-mad")
        return [
          q(
            "Booths have 2, 4, 6, and 8 supply boxes. What is the mean number of boxes?",
            5,
            "The total is 20. Share among four booths: 20 ÷ 4 = 5.",
          ),
          q(
            "The data are 2, 4, 6, 8 and the mean is 5. What is the mean absolute deviation?",
            2,
            "Distances from 5 are 3, 1, 1, 3. Their mean is (3 + 1 + 1 + 3) ÷ 4 = 2.",
          ),
        ];
      return [
        q(
          "Find the median of 5, 6, 7, 8, 39.",
          7,
          "Seven is the middle ordered value. The unusually large 39 does not move the middle position.",
        ),
        q(
          "Find the mean of 5, 6, 7, 8, 39.",
          13,
          "The total is 65, and 65 ÷ 5 = 13. The large value pulls the mean above most observations.",
        ),
      ];
    }
    case "decimal":
      return model.mode === "budget"
        ? [
            q(
              "Four supplies cost $3.75 each. What is the total cost in dollars?",
              15,
              "3.75 × 4 = 15.00. Four lots of $0.75 make $3, and four lots of $3 make $12.",
            ),
            q(
              "You pay for a $15 order with $25. How much change should you receive?",
              10,
              "25 − 15 = 10 dollars. Check: cost plus change equals the amount paid.",
            ),
          ]
        : [
            q(
              "Two design subtotals are $12.30 and $4.05. What is their sum in dollars?",
              16.35,
              "Align decimal place values: 12.30 + 4.05 = 16.35.",
            ),
            q(
              "A design uses 2.5 meters of ribbon costing $1.20 per meter. What is the ribbon cost in dollars?",
              3,
              "2.5 × 1.20 = 3.00. Two meters cost $2.40 and half a meter costs $0.60.",
            ),
          ];
    case "division":
      return [
        q(
          "A shipment contains 14.4 kg divided into bags of 1.2 kg. How many bags are filled?",
          12,
          "Multiply both dividend and divisor by 10: 144 ÷ 12 = 12. Check: 12 × 1.2 = 14.4.",
        ),
        q(
          "Split 25.2 liters equally into containers holding 0.6 liter each. How many containers are needed?",
          42,
          "25.2 ÷ 0.6 = 252 ÷ 6 = 42. Check: 42 × 0.6 = 25.2.",
        ),
      ];
    case "ratio":
      return model.mode === "compare"
        ? [
            q(
              "Paint A uses color:white = 2:3. How many cups of color go with 15 cups of white?",
              10,
              "Scale both parts by 5: 2:3 = 10:15.",
            ),
            q(
              "Paint B uses color:white = 3:5. With 15 cups of white, how many fewer cups of color does B use than A’s 10?",
              1,
              "Scale B by 3: 3:5 = 9:15. It uses 10 − 9 = 1 fewer cup of color.",
            ),
          ]
        : [
            q(
              "A drink has juice:water = 3:2. How many cups of water go with 9 cups of juice?",
              6,
              "The juice is multiplied by 3, so the water is also multiplied by 3: 2 × 3 = 6.",
            ),
            q(
              "A 5-cup drink costs $4 in total. What is its cost per cup in dollars?",
              0.8,
              "Cost per cup = 4 ÷ 5 = 0.80 dollars per cup. Keep the cost unit first.",
            ),
          ];
    case "rate":
      return [
        q(
          "A pack of 8 notebooks costs $12. What is the cost per notebook in dollars?",
          1.5,
          "Divide dollars by notebooks: 12 ÷ 8 = 1.50 dollars per notebook.",
        ),
        q(
          "Pack A costs $12 for 8 notebooks. Pack B costs $10 for 5 notebooks. How much less does one notebook cost in A?",
          0.5,
          "A is $1.50 each and B is $2.00 each. The difference is $0.50 per notebook.",
        ),
      ];
    case "conversion":
      return model.mode === "scale"
        ? [
            q(
              "A mast is 7 feet long. Using 1 foot = 12 inches, how long is it in inches?",
              84,
              "7 × 12 = 84 inches.",
            ),
            q(
              "A model mast is 18 inches long. How many feet is that?",
              1.5,
              "18 ÷ 12 = 1.5 feet. Converting to larger units makes the number smaller.",
            ),
          ]
        : [
            q(
              "A tool is 10 inches long. Using 1 inch = 2.54 cm, how long is it in centimeters?",
              25.4,
              "10 × 2.54 = 25.4 centimeters.",
            ),
            q(
              "A trail segment is 3 feet long. Using 1 foot = 12 inches, how long is it in inches?",
              36,
              "3 × 12 = 36 inches. This conversion stays within the customary system.",
            ),
          ];
    case "growth": {
      const [a, b] = model.values;
      return [
        q(
          `A pattern starts with ${b} fixed units and adds ${a} units for every step. How many units are at step 6?`,
          b + 6 * a,
          `Output = ${a} × step + ${b}. At step 6: ${a} × 6 + ${b} = ${b + 6 * a}.`,
        ),
        q(
          `The same pattern follows y = ${a}x + ${b}. At what input x is y = ${b + 9 * a}?`,
          9,
          `Subtract the fixed ${b}, then divide by ${a}: (${b + 9 * a} − ${b}) ÷ ${a} = 9.`,
        ),
      ];
    }
    case "percent":
      return model.mode === "whole"
        ? [
            q(
              "Eighteen tickets are 30% of all tickets. How many tickets are there in all?",
              60,
              "10% is 18 ÷ 3 = 6. Therefore 100% is 6 × 10 = 60. Check: 0.30 × 60 = 18.",
            ),
            q(
              "A $12 saving is 20% of an original price. What was the original price in dollars?",
              60,
              "The whole is 12 ÷ 0.20 = 60 dollars. The saving is the part, not the original price.",
            ),
          ]
        : model.mode === "discount"
          ? [
              q(
                "What is a 25% discount on an $80 item, in dollars?",
                20,
                "25% is one quarter. 80 ÷ 4 = 20 dollars saved.",
              ),
              q(
                "An $80 item has a 25% discount. What is its final price in dollars?",
                60,
                "The discount is $20. Subtract it from the original price: 80 − 20 = 60.",
              ),
            ]
          : [
              q(
                "A grid has 45 of its 100 equal squares shaded. Write the shaded amount as a decimal.",
                0.45,
                "45 out of 100 is 45/100 = 0.45 = 45%.",
              ),
              q(
                "What percent is equivalent to 3/4? Enter the number without the percent sign.",
                75,
                "3 ÷ 4 = 0.75, and 0.75 × 100 = 75%.",
              ),
            ];
    case "area":
      return model.mode === "trapezoid"
        ? [
            q(
              "A trapezoid has parallel bases 10 m and 6 m, and perpendicular height 4 m. Find its area in square meters.",
              32,
              "Average the bases: (10 + 6) ÷ 2 = 8. Multiply by height: 8 × 4 = 32.",
            ),
            q(
              "A floor is a 6-by-4 rectangle joined without overlap to a triangle of base 6 and height 3. Find the total area.",
              33,
              "Rectangle: 6 × 4 = 24. Triangle: 6 × 3 ÷ 2 = 9. Total: 24 + 9 = 33 square units.",
            ),
          ]
        : model.mode === "polygon"
          ? [
              q(
                "A square has perimeter 24 units and apothem 3 units. Find its area.",
                36,
                "Area = perimeter × apothem ÷ 2 = 24 × 3 ÷ 2 = 36 square units.",
              ),
              q(
                "A rectangular storage box measures 6 by 3 by 2 units. Find its volume.",
                36,
                "Volume = 6 × 3 × 2 = 36 cubic units. The numerical value matches the floor area here, but the units describe different measurements.",
              ),
            ]
          : [
              q(
                "A parallelogram has base 8 cm and perpendicular height 5 cm. Find its area in square centimeters.",
                40,
                "Area = base × perpendicular height = 8 × 5 = 40.",
              ),
              q(
                "A triangle has the same base 8 cm and height 5 cm. Find its area in square centimeters.",
                20,
                "The triangle has half the matching parallelogram’s area: 8 × 5 ÷ 2 = 20.",
              ),
            ];
    case "solid":
      return model.mode === "surface"
        ? [
            q(
              "A rectangular prism measures 4 by 3 by 2 units. Find its total surface area.",
              52,
              "Three face pairs give 2(4×3 + 4×2 + 3×2) = 2(12 + 8 + 6) = 52 square units.",
            ),
            q(
              "A right square pyramid has base side 6 units and slant height 5 units. Find its total surface area.",
              96,
              "The base has area 36. Each triangular face has area 6 × 5 ÷ 2 = 15. Four triangles plus the base give 60 + 36 = 96 square units.",
            ),
          ]
        : [
            q(
              "A rectangular package measures 4 by 3 by 2 cm. What is its volume in cubic centimeters?",
              24,
              "One layer holds 4 × 3 = 12 unit cubes. Two layers hold 24.",
            ),
            q(
              "A prism net has four side faces and two rectangular bases. How many faces does the folded prism have?",
              6,
              "Each part of the net becomes one face. Four side faces plus two bases gives six faces.",
            ),
          ];
    case "fraction": {
      if (model.mode === "ribbon")
        return [
          q(
            "How many 3/4-unit lengths are in 5 1/2 units? Give the exact quotient, as a fraction or mixed number.",
            22 / 3,
            "5 1/2 ÷ 3/4 = 11/2 × 4/3 = 22/3 = 7 1/3.",
          ),
          q(
            "You cut seven complete 3/4-unit pieces from 5 1/2 units. How much ribbon remains?",
            0.25,
            "Seven pieces use 21/4 = 5 1/4 units. 5 1/2 − 5 1/4 = 1/4 unit remains.",
          ),
        ];
      if (model.mode === "field")
        return [
          q(
            "How many 2/3-liter portions are in 4 1/2 liters? Give the exact quotient.",
            6.75,
            "9/2 ÷ 2/3 = 9/2 × 3/2 = 27/4 = 6 3/4 portions.",
          ),
          q(
            "After filling six whole 2/3-liter bottles from 4 1/2 liters, how many liters remain?",
            0.5,
            "Six bottles use 6 × 2/3 = 4 liters. The remainder is 4 1/2 − 4 = 1/2 liter.",
          ),
        ];
      return [
        q(
          "How many 1/2-cup servings fit into 3 cups?",
          6,
          "Every cup holds two half-cup servings. Three cups hold six. 3 ÷ 1/2 = 6.",
        ),
        q(
          "How many 3/4-cup servings fit into 4 1/2 cups?",
          6,
          "9/2 ÷ 3/4 = 9/2 × 4/3 = 6 servings. Check: 6 × 3/4 = 4 1/2 cups.",
        ),
      ];
    }
    case "power":
      return [
        q("Evaluate 2 + 3⁴.", 83, "3⁴ = 3 × 3 × 3 × 3 = 81. Then add 2: 83."),
        q(
          "Evaluate (2 + 3)².",
          25,
          "Parentheses first: 2 + 3 = 5. Then square: 5² = 25. Grouping changes the result.",
        ),
      ];
    case "expression":
      return model.mode === "distribute"
        ? [
            q(
              "Evaluate 3(x + 4) when x = 2.",
              18,
              "Substitute: 3(2 + 4) = 18. Distribute to check: 3×2 + 3×4 = 6 + 12 = 18.",
            ),
            q(
              "Simplify 3x + 2x + 7. What is the coefficient of x in the simplified expression?",
              5,
              "Combine only like terms: 3x + 2x = 5x. The constant 7 remains separate.",
            ),
          ]
        : [
            q("Evaluate 4x + 3 when x = 5.", 23, "Replace x with 5: 4 × 5 + 3 = 23."),
            q(
              "Evaluate 4(x + 3) when x = 5.",
              32,
              "The parentheses include both terms: 4 × (5 + 3) = 32. This is different from 4x + 3.",
            ),
          ];
    case "factors":
      return model.mode === "lcm"
        ? [
            q(
              "Signals flash every 12 and 18 seconds, starting together at time zero. After how many seconds do they next flash together?",
              36,
              "12 = 2² × 3 and 18 = 2 × 3². LCM = 2² × 3² = 36 seconds.",
            ),
            q(
              "In the prime factorization 72 = 2³ × 3², what is the sum of the exponents?",
              5,
              "72 = 2 × 2 × 2 × 3 × 3, so the exponents are 3 and 2. Their sum is 5.",
            ),
          ]
        : [
            q(
              "What is the greatest common factor of 18 and 24?",
              6,
              "The common factors are 1, 2, 3, 6. The greatest is 6.",
            ),
            q(
              "Fill the missing number: 18 + 24 = 6(3 + __).",
              4,
              "18 = 6×3 and 24 = 6×4, so factoring out 6 gives 6(3 + 4).",
            ),
          ];
    case "line":
      return model.mode === "opposites"
        ? [
            q(
              "What is the opposite of −2.5?",
              2.5,
              "Opposites lie on different sides of zero at equal distances. The opposite is 2.5.",
            ),
            q(
              "How far is −4 from zero?",
              4,
              "Absolute value measures distance from zero: |−4| = 4 units.",
            ),
          ]
        : [
            q(
              "Which is greater: −7 or −3? Enter the greater number.",
              -3,
              "−3 is farther right on the number line, so −3 > −7.",
            ),
            q(
              "How far apart are −7 and −3 on a number line?",
              4,
              "The distance is |−3 − (−7)| = |4| = 4 units.",
            ),
          ];
    case "coordinates":
      return model.mode === "rectangle"
        ? [
            q(
              "A rectangle has opposite corners (−4, −2) and (3, 4). What is its area?",
              42,
              "Width = 3 − (−4) = 7; height = 4 − (−2) = 6. Area = 42 square units.",
            ),
            q(
              "What is the perimeter of that 7-by-6 rectangle?",
              26,
              "Perimeter = 2(7 + 6) = 26 units.",
            ),
          ]
        : ["reflect", "symmetry"].includes(model.mode)
          ? [
              q(
                "Reflect (−3, 4) across the y-axis. What is the image’s x-coordinate?",
                3,
                "Reflection across the y-axis changes the sign of x. The image is (3, 4).",
              ),
              q(
                "Reflect (−3, 4) across the x-axis. What is the image’s y-coordinate?",
                -4,
                "Reflection across the x-axis changes the sign of y. The image is (−3, −4).",
              ),
            ]
          : [
              q(
                "What is the horizontal distance from (−3, 4) to (2, 4)?",
                5,
                "The y-coordinates match, so distance = |2 − (−3)| = 5 units.",
              ),
              q(
                "What is the vertical distance from (2, −5) to (2, 3)?",
                8,
                "The x-coordinates match, so distance = |3 − (−5)| = 8 units.",
              ),
            ];
    case "balance":
      return model.mode === "add"
        ? [
            q(
              "Solve x + 7 = 19. Enter x.",
              12,
              "Subtract 7 from both sides: x = 12. Check: 12 + 7 = 19.",
            ),
            q("Solve x − 5 = 14. Enter x.", 19, "Add 5 to both sides: x = 19. Check: 19 − 5 = 14."),
          ]
        : [
            q("Solve 4x = 36. Enter x.", 9, "Divide both sides by 4: x = 9. Check: 4 × 9 = 36."),
            q(
              "Solve x ÷ 4 = 9. Enter x.",
              36,
              "Multiply both sides by 4: x = 36. Check: 36 ÷ 4 = 9.",
            ),
          ];
    case "inequality":
      return model.mode === "entry"
        ? [
            q(
              "Whole-number ages must satisfy a > 12. What is the youngest allowed whole-number age?",
              13,
              "The boundary 12 is excluded. The next whole number is 13.",
            ),
            q(
              "A height rule is h ≥ 120 centimeters. What is the smallest allowed height?",
              120,
              "The ≥ symbol includes equality. Exactly 120 cm qualifies.",
            ),
          ]
        : [
            q(
              "Tickets cost $3 each and you have $15. What is the greatest whole number of tickets you can buy?",
              5,
              "3t ≤ 15, so t ≤ 5. Five tickets cost exactly $15.",
            ),
            q(
              "You have $20 and must first pay a $5 entry fee. Each ticket then costs $3. What is the greatest whole number of tickets you can buy?",
              5,
              "5 + 3t ≤ 20. Subtract 5, then divide by 3: t ≤ 5.",
            ),
          ];
    default:
      throw new Error(`Missing original practice for ${model.kind}`);
  }
}
