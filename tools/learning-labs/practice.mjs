// Original, self-contained tasks supplement the source lesson banks.
// Hints are specific to the task; each mistake is a likely wrong answer with feedback that names the error.
const q = (prompt, answer, explanation, hints, mistakes) => ({
  prompt,
  answer,
  explanation,
  hints,
  // A parameterized slip can coincide with the answer (no fixed units at all); drop it.
  mistakes: mistakes
    .filter(([value]) => Math.abs(value - answer) > 1e-9)
    .map(([value, feedback]) => ({ answer: Number(value.toFixed(6)), feedback })),
});
export function originalPractice(model) {
  switch (model.kind) {
    case "array":
      return model.mode === "estimate"
        ? [
            q(
              "A ride has 16 cars with 4 seats in each. How many riders fit if every seat is filled?",
              64,
              "Sixteen equal groups of four give 16 × 4 = 64. A quick estimate, 15 × 4 = 60, supports the result.",
              [
                "Each car is one equal group of seats.",
                "Multiply the number of cars by the seats in each car.",
              ],
              [[20, "You added cars and seats. Every car is a full group of 4, so multiply."]],
            ),
            q(
              "You need 48 seats arranged in rows of 6. How many rows do you need?",
              8,
              "48 ÷ 6 = 8 rows. Check: 8 × 6 = 48 seats.",
              [
                "Rows of 6 means each row uses 6 seats.",
                "Ask: 6 times what number makes 48? Divide 48 by 6.",
              ],
              [[288, "You multiplied. You are splitting 48 seats into rows, so divide."]],
            ),
          ]
        : [
            q(
              "A rectangular game board has 6 rows and 4 spaces per row. What is its perimeter in space-width units?",
              20,
              "The sides measure 6 and 4 units, so the perimeter is 2(6 + 4) = 20 units.",
              [
                "Perimeter is the distance around the outside of the board.",
                "Add all four sides: two sides of 6 and two sides of 4.",
              ],
              [
                [
                  24,
                  "That is the area (6 × 4). Perimeter adds the side lengths around the outside.",
                ],
                [10, "That is only two sides. A rectangle has four sides, so double it."],
              ],
            ),
            q(
              "Another board has 3 rows and 8 spaces per row. How much greater is its perimeter than the 6-by-4 board?",
              2,
              "The 3-by-8 board has perimeter 22. Both boards have area 24, but 22 − 20 = 2 more units of perimeter.",
              [
                "Find this board's perimeter first: two sides of 3 and two sides of 8.",
                "Subtract the 6-by-4 board's perimeter from it.",
              ],
              [
                [
                  22,
                  "That is the 3-by-8 board's perimeter. The question asks how much greater it is.",
                ],
              ],
            ),
          ];
    case "data": {
      if (model.mode === "histogram")
        return [
          q(
            "Data: 3, 4, 5, 7, 9, 10, 12. In a histogram with intervals 0–4, 5–9, and 10–14, what is the frequency in 5–9?",
            3,
            "The values 5, 7, and 9 belong in 5–9. The 10 starts the next interval.",
            [
              "An interval 5–9 includes 5, 9, and every value between them.",
              "Count the data values from 5 up to 9. Stop before 10.",
            ],
            [[4, "Check the edges: 10 belongs to the next interval, 10–14."]],
          ),
          q(
            "Data: 2, 2, 6, 6, 6, 8. How many observations are in the data set, including repeats?",
            6,
            "Every measurement counts once. There are six observations, even though only three different values appear.",
            [
              "Count every value in the list, even when a value repeats.",
              "Repeated values are separate observations.",
            ],
            [[3, "That is the number of different values. Count repeats too."]],
          ),
        ];
      if (model.mode === "box")
        return [
          q(
            "Find the median: 2, 4, 6, 8, 10, 12.",
            7,
            "There are six values. Average the middle pair, 6 and 8: (6 + 8) ÷ 2 = 7.",
            [
              "The list is already in order. Find the middle position.",
              "With an even number of values, average the two middle values.",
            ],
            [
              [6, "With six values there are two middle values. Average them."],
              [8, "With six values there are two middle values. Average them."],
            ],
          ),
          q(
            "For 2, 4, 6, 8, 10, 12, find Q3 using the median of the upper half.",
            10,
            "The upper half is 8, 10, 12. Its median is 10, so Q3 = 10.",
            [
              "Split the ordered list into a lower half and an upper half.",
              "Q3 is the median of the upper half.",
            ],
            [
              [4, "That is Q1, the median of the lower half. Q3 comes from the upper half."],
              [7, "That is the median of the whole set. Q3 is the median of the upper half."],
            ],
          ),
        ];
      if (model.mode === "spread")
        return [
          q(
            "A team records 3, 4, 5, 7, 8, 9. What is the range?",
            6,
            "Range = maximum − minimum = 9 − 3 = 6.",
            ["Find the greatest and the least values.", "Range = greatest − least."],
            [[9, "That is the greatest value. Subtract the least value from it."]],
          ),
          q(
            "For 3, 4, 5, 7, 8, 9, what is the IQR using medians of halves?",
            4,
            "The lower half 3, 4, 5 has median 4. The upper half 7, 8, 9 has median 8. IQR = 8 − 4 = 4.",
            [
              "Split the data into a lower half (3, 4, 5) and an upper half (7, 8, 9).",
              "Find the median of each half, then subtract: Q3 − Q1.",
            ],
            [[6, "That is the range. The IQR uses only the middle half: Q3 − Q1."]],
          ),
        ];
      if (model.mode === "mean-mad")
        return [
          q(
            "Booths have 2, 4, 6, and 8 supply boxes. What is the mean number of boxes?",
            5,
            "The total is 20. Share among four booths: 20 ÷ 4 = 5.",
            [
              "Add all the boxes to get the total.",
              "Share the total equally: divide by the number of booths.",
            ],
            [[20, "That is the total. Divide it by the 4 booths."]],
          ),
          q(
            "The data are 2, 4, 6, 8 and the mean is 5. What is the mean absolute deviation?",
            2,
            "Distances from 5 are 3, 1, 1, 3. Their mean is (3 + 1 + 1 + 3) ÷ 4 = 2.",
            ["Find how far each value is from the mean of 5.", "Average those four distances."],
            [
              [8, "That is the sum of the distances. Divide by the number of values."],
              [0, "Use distances, which are never negative, so they cannot cancel out."],
            ],
          ),
        ];
      return [
        q(
          "Find the median of 5, 6, 7, 8, 39.",
          7,
          "Seven is the middle ordered value. The unusually large 39 does not move the middle position.",
          ["Make sure the values are in order.", "Find the value in the middle position."],
          [[13, "That is the mean. The median is the middle value of the ordered list."]],
        ),
        q(
          "Find the mean of 5, 6, 7, 8, 39.",
          13,
          "The total is 65, and 65 ÷ 5 = 13. The large value pulls the mean above most observations.",
          ["Add all five values.", "Divide the total by how many values there are."],
          [[7, "That is the median. The mean shares the total equally."]],
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
              [
                "Four items at the same price: multiply.",
                "Break up $3.75 into $3 and $0.75, multiply each by 4, then add.",
              ],
              [[7.75, "You added 3.75 and 4. Four items at the same price means multiply."]],
            ),
            q(
              "You pay for a $15 order with $25. How much change should you receive?",
              10,
              "25 − 15 = 10 dollars. Check: cost plus change equals the amount paid.",
              [
                "Change = amount paid − cost.",
                "Check: cost plus change should equal the amount you paid.",
              ],
              [[40, "You added. Change is what is left over, so subtract."]],
            ),
          ]
        : [
            q(
              "Two design subtotals are $12.30 and $4.05. What is their sum in dollars?",
              16.35,
              "Align decimal place values: 12.30 + 4.05 = 16.35.",
              [
                "Line up the decimal points before you add.",
                "Write 12.30 and 4.05 so tenths line up with tenths and hundredths with hundredths.",
              ],
              [[5.28, "Line up the decimal points, not the last digits."]],
            ),
            q(
              "A design uses 2.5 meters of ribbon costing $1.20 per meter. What is the ribbon cost in dollars?",
              3,
              "2.5 × 1.20 = 3.00. Two meters cost $2.40 and half a meter costs $0.60.",
              [
                "Cost = meters × price per meter.",
                "Split it up: 2 meters cost 2 × 1.20, half a meter costs half of 1.20.",
              ],
              [[3.7, "You added the numbers. The cost is length × price per meter."]],
            ),
          ];
    case "division":
      return [
        q(
          "A shipment contains 14.4 kg divided into bags of 1.2 kg. How many bags are filled?",
          12,
          "Multiply both dividend and divisor by 10: 144 ÷ 12 = 12. Check: 12 × 1.2 = 14.4.",
          [
            "How many 1.2 kg bags fit in 14.4 kg? Divide.",
            "Multiply both numbers by 10 to divide whole numbers instead.",
          ],
          [
            [1.2, "Check the place value: multiply both numbers by 10 before dividing."],
            [17.28, "You multiplied. Splitting into bags means divide."],
          ],
        ),
        q(
          "Split 25.2 liters equally into containers holding 0.6 liter each. How many containers are needed?",
          42,
          "25.2 ÷ 0.6 = 252 ÷ 6 = 42. Check: 42 × 0.6 = 25.2.",
          [
            "How many 0.6-liter containers fit in 25.2 liters? Divide.",
            "Multiply both numbers by 10, then divide.",
          ],
          [
            [
              4.2,
              "Check the place value: 0.6 × 4.2 is not 25.2. Multiply both numbers by 10 before dividing.",
            ],
          ],
        ),
      ];
    case "ratio":
      return model.mode === "compare"
        ? [
            q(
              "Paint A uses color:white = 2:3. How many cups of color go with 15 cups of white?",
              10,
              "Scale both parts by 5: 2:3 = 10:15.",
              [
                "How many groups of 3 cups of white make 15 cups?",
                "Multiply the color part by that same number.",
              ],
              [
                [
                  14,
                  "You added 12 to each part. Equivalent ratios multiply both parts by the same number.",
                ],
              ],
            ),
            q(
              "Paint B uses color:white = 3:5. With 15 cups of white, how many fewer cups of color does B use than A’s 10?",
              1,
              "Scale B by 3: 3:5 = 9:15. It uses 10 − 9 = 1 fewer cup of color.",
              [
                "Scale Paint B's ratio so the white part is 15 cups.",
                "Compare B's cups of color with A's 10 cups and subtract.",
              ],
              [[9, "That is how much color B uses. The question asks how many fewer cups than A."]],
            ),
          ]
        : [
            q(
              "A drink has juice:water = 3:2. How many cups of water go with 9 cups of juice?",
              6,
              "The juice is multiplied by 3, so the water is also multiplied by 3: 2 × 3 = 6.",
              [
                "The juice went from 3 cups to 9 cups. What was it multiplied by?",
                "Multiply the water part by the same number.",
              ],
              [[8, "You added 6 to the water. Multiply both parts by the same number instead."]],
            ),
            q(
              "A 5-cup drink costs $4 in total. What is its cost per cup in dollars?",
              0.8,
              "Cost per cup = 4 ÷ 5 = 0.80 dollars per cup. Keep the cost unit first.",
              [
                "Cost per cup means dollars for one cup.",
                "Divide the total cost by the number of cups.",
              ],
              [[1.25, "You divided cups by dollars. Put the cost first: dollars ÷ cups."]],
            ),
          ];
    case "rate":
      return [
        q(
          "A pack of 8 notebooks costs $12. What is the cost per notebook in dollars?",
          1.5,
          "Divide dollars by notebooks: 12 ÷ 8 = 1.50 dollars per notebook.",
          [
            "Cost per notebook means the price of one.",
            "Divide the dollars by the number of notebooks.",
          ],
          [[0.6667, "You divided notebooks by dollars, which gives notebooks per dollar."]],
        ),
        q(
          "Pack A costs $12 for 8 notebooks. Pack B costs $10 for 5 notebooks. How much less does one notebook cost in A?",
          0.5,
          "A is $1.50 each and B is $2.00 each. The difference is $0.50 per notebook.",
          [
            "Find the cost of one notebook in each pack.",
            "Subtract Pack A's unit cost from Pack B's.",
          ],
          [[2, "That is Pack B's cost per notebook. Subtract Pack A's cost."]],
        ),
      ];
    case "conversion":
      return model.mode === "scale"
        ? [
            q(
              "A mast is 7 feet long. Using 1 foot = 12 inches, how long is it in inches?",
              84,
              "7 × 12 = 84 inches.",
              [
                "Inches are smaller than feet, so expect a bigger number.",
                "Each foot is 12 inches. Multiply.",
              ],
              [[0.5833, "Inches are smaller units, so there are more of them. Multiply by 12."]],
            ),
            q(
              "A model mast is 18 inches long. How many feet is that?",
              1.5,
              "18 ÷ 12 = 1.5 feet. Converting to larger units makes the number smaller.",
              [
                "Feet are larger than inches, so expect a smaller number.",
                "Each 12 inches make 1 foot. Divide by 12.",
              ],
              [[216, "Feet are larger units, so there are fewer of them. Divide by 12."]],
            ),
          ]
        : [
            q(
              "A tool is 10 inches long. Using 1 inch = 2.54 cm, how long is it in centimeters?",
              25.4,
              "10 × 2.54 = 25.4 centimeters.",
              [
                "Centimeters are smaller than inches, so expect a bigger number.",
                "Multiply by 2.54 centimeters per inch.",
              ],
              [
                [
                  3.937,
                  "Centimeters are smaller units, so there are more of them. Multiply by 2.54.",
                ],
              ],
            ),
            q(
              "A trail segment is 3 feet long. Using 1 foot = 12 inches, how long is it in inches?",
              36,
              "3 × 12 = 36 inches. This conversion stays within the customary system.",
              [
                "Inches are smaller than feet, so expect a bigger number.",
                "Multiply by 12 inches per foot.",
              ],
              [[0.25, "Inches are smaller units, so there are more of them. Multiply by 12."]],
            ),
          ];
    case "growth": {
      const [a, b] = model.values;
      return [
        q(
          `A pattern starts with ${b} fixed units and adds ${a} units for every step. How many units are at step 6?`,
          b + 6 * a,
          `Output = ${a} × step + ${b}. At step 6: ${a} × 6 + ${b} = ${b + 6 * a}.`,
          [
            "Start with the fixed units, then add the step amount once for each step.",
            "Output = (units per step × step number) + fixed units.",
          ],
          [[6 * a, "You left out the fixed starting units. Add them after multiplying."]],
        ),
        q(
          `The same pattern follows y = ${a}x + ${b}. At what input x is y = ${b + 9 * a}?`,
          9,
          `Subtract the fixed ${b}, then divide by ${a}: (${b + 9 * a} − ${b}) ÷ ${a} = 9.`,
          [
            "Work backwards from the output.",
            "First subtract the fixed units, then divide by the units added per step.",
          ],
          [[(b + 9 * a) / a, "Subtract the fixed units first, then divide."]],
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
              [
                "30% is part of the whole, so the whole is bigger than 18.",
                "Find 10% first (30% ÷ 3), then multiply to get 100%.",
              ],
              [[5.4, "You found 30% of 18. Here 18 is the 30%, so work back to 100%."]],
            ),
            q(
              "A $12 saving is 20% of an original price. What was the original price in dollars?",
              60,
              "The whole is 12 ÷ 0.20 = 60 dollars. The saving is the part, not the original price.",
              [
                "The $12 saving is the part. The original price is the whole.",
                "Divide the part by the percent as a decimal (0.20).",
              ],
              [[2.4, "You found 20% of 12. The $12 is the 20%, so divide by 0.20."]],
            ),
          ]
        : model.mode === "discount"
          ? [
              q(
                "What is a 25% discount on an $80 item, in dollars?",
                20,
                "25% is one quarter. 80 ÷ 4 = 20 dollars saved.",
                ["25% is the same as one quarter.", "Find one quarter of $80."],
                [
                  [
                    60,
                    "That is the final price. The question asks for the discount, the amount saved.",
                  ],
                ],
              ),
              q(
                "An $80 item has a 25% discount. What is its final price in dollars?",
                60,
                "The discount is $20. Subtract it from the original price: 80 − 20 = 60.",
                [
                  "Find the discount first: 25% of $80.",
                  "Subtract the discount from the original price.",
                ],
                [[20, "That is the discount. Subtract it from $80 to get the final price."]],
              ),
            ]
          : [
              q(
                "A grid has 45 of its 100 equal squares shaded. Write the shaded amount as a decimal.",
                0.45,
                "45 out of 100 is 45/100 = 0.45 = 45%.",
                [
                  "Shaded amount = shaded squares ÷ total squares.",
                  "45 out of 100 is 45 hundredths.",
                ],
                [
                  [
                    45,
                    "That is a percent. As a decimal, 45 hundredths is written with a decimal point.",
                  ],
                ],
              ),
              q(
                "What percent is equivalent to 3/4? Enter the number without the percent sign.",
                75,
                "3 ÷ 4 = 0.75, and 0.75 × 100 = 75%.",
                [
                  "Divide 3 by 4 to get a decimal.",
                  "Multiply the decimal by 100 to write it as a percent.",
                ],
                [[0.75, "That is the decimal. Multiply by 100 to write the percent."]],
              ),
            ];
    case "area":
      return model.mode === "trapezoid"
        ? [
            q(
              "A trapezoid has parallel bases 10 m and 6 m, and perpendicular height 4 m. Find its area in square meters.",
              32,
              "Average the bases: (10 + 6) ÷ 2 = 8. Multiply by height: 8 × 4 = 32.",
              ["Average the two parallel bases.", "Area = average base × perpendicular height."],
              [[64, "You forgot to divide by 2. Average the bases first."]],
            ),
            q(
              "A floor is a 6-by-4 rectangle joined without overlap to a triangle of base 6 and height 3. Find the total area.",
              33,
              "Rectangle: 6 × 4 = 24. Triangle: 6 × 3 ÷ 2 = 9. Total: 24 + 9 = 33 square units.",
              [
                "Split the floor into the rectangle and the triangle.",
                "Find each area (triangle = base × height ÷ 2), then add.",
              ],
              [[42, "Halve the triangle: base × height ÷ 2."]],
            ),
          ]
        : model.mode === "polygon"
          ? [
              q(
                "A square has perimeter 24 units and apothem 3 units. Find its area.",
                36,
                "Area = perimeter × apothem ÷ 2 = 24 × 3 ÷ 2 = 36 square units.",
                [
                  "Area of a regular polygon = perimeter × apothem ÷ 2.",
                  "Multiply the perimeter by the apothem, then halve it.",
                ],
                [[72, "Divide by 2. The polygon is made of triangles: perimeter × apothem ÷ 2."]],
              ),
              q(
                "A rectangular storage box measures 6 by 3 by 2 units. Find its volume.",
                36,
                "Volume = 6 × 3 × 2 = 36 cubic units. The numerical value matches the floor area here, but the units describe different measurements.",
                [
                  "Volume counts the unit cubes that fill the box.",
                  "Multiply length × width × height.",
                ],
                [
                  [11, "You added the dimensions. Volume multiplies them."],
                  [18, "That is one layer. Multiply by the height too."],
                ],
              ),
            ]
          : [
              q(
                "A parallelogram has base 8 cm and perpendicular height 5 cm. Find its area in square centimeters.",
                40,
                "Area = base × perpendicular height = 8 × 5 = 40.",
                [
                  "A parallelogram's area uses base and perpendicular height.",
                  "Multiply base × height.",
                ],
                [
                  [20, "That is a triangle's area. A parallelogram is not halved."],
                  [13, "You added. Area multiplies base × height."],
                ],
              ),
              q(
                "A triangle has the same base 8 cm and height 5 cm. Find its area in square centimeters.",
                20,
                "The triangle has half the matching parallelogram’s area: 8 × 5 ÷ 2 = 20.",
                [
                  "A triangle is half of a parallelogram with the same base and height.",
                  "Area = base × height ÷ 2.",
                ],
                [[40, "That is the parallelogram's area. A triangle is half of it."]],
              ),
            ];
    case "solid":
      return model.mode === "surface"
        ? [
            q(
              "A rectangular prism measures 4 by 3 by 2 units. Find its total surface area.",
              52,
              "Three face pairs give 2(4×3 + 4×2 + 3×2) = 2(12 + 8 + 6) = 52 square units.",
              [
                "A rectangular prism has three pairs of matching faces.",
                "Find the area of one face from each pair, add them, then double.",
              ],
              [
                [26, "That counts only one face of each pair. Double it."],
                [24, "That is the volume. Surface area adds the areas of all six faces."],
              ],
            ),
            q(
              "A right square pyramid has base side 6 units and slant height 5 units. Find its total surface area.",
              96,
              "The base has area 36. Each triangular face has area 6 × 5 ÷ 2 = 15. Four triangles plus the base give 60 + 36 = 96 square units.",
              [
                "The pyramid has one square base and four matching triangles.",
                "Base area + 4 × (6 × 5 ÷ 2).",
              ],
              [
                [60, "Add the square base too."],
                [156, "Each triangle is half of 6 × 5. Divide by 2."],
              ],
            ),
          ]
        : [
            q(
              "A rectangular package measures 4 by 3 by 2 cm. What is its volume in cubic centimeters?",
              24,
              "One layer holds 4 × 3 = 12 unit cubes. Two layers hold 24.",
              [
                "One layer holds 4 × 3 cubes.",
                "Multiply one layer by the number of layers (the height).",
              ],
              [
                [12, "That is one layer. There are two layers."],
                [52, "That is the surface area. Volume counts the cubes inside."],
              ],
            ),
            q(
              "A prism net has four side faces and two rectangular bases. How many faces does the folded prism have?",
              6,
              "Each part of the net becomes one face. Four side faces plus two bases gives six faces.",
              ["Every part of the net becomes one face.", "Add the side faces and the bases."],
              [[4, "Include the two bases."]],
            ),
          ];
    case "fraction": {
      if (model.mode === "ribbon")
        return [
          q(
            "How many 3/4-unit lengths are in 5 1/2 units? Give the exact quotient, as a fraction or mixed number.",
            22 / 3,
            "5 1/2 ÷ 3/4 = 11/2 × 4/3 = 22/3 = 7 1/3.",
            [
              "Write 5 1/2 as an improper fraction.",
              "Divide by 3/4 by multiplying by its reciprocal, 4/3.",
            ],
            [
              [4.125, "You multiplied by 3/4. Dividing by 3/4 means multiplying by 4/3."],
              [
                7,
                "That counts whole pieces only. Give the exact quotient, including the fraction.",
              ],
            ],
          ),
          q(
            "You cut seven complete 3/4-unit pieces from 5 1/2 units. How much ribbon remains?",
            0.25,
            "Seven pieces use 21/4 = 5 1/4 units. 5 1/2 − 5 1/4 = 1/4 unit remains.",
            ["Find how much ribbon seven pieces use: 7 × 3/4.", "Subtract that from 5 1/2."],
            [[5.25, "That is how much the seven pieces use. Subtract it from 5 1/2."]],
          ),
        ];
      if (model.mode === "field")
        return [
          q(
            "How many 2/3-liter portions are in 4 1/2 liters? Give the exact quotient.",
            6.75,
            "9/2 ÷ 2/3 = 9/2 × 3/2 = 27/4 = 6 3/4 portions.",
            [
              "Write 4 1/2 as an improper fraction.",
              "Multiply by the reciprocal of 2/3, which is 3/2.",
            ],
            [
              [3, "You multiplied by 2/3. Dividing by 2/3 means multiplying by 3/2."],
              [6, "That counts whole portions only. Give the exact quotient."],
            ],
          ),
          q(
            "After filling six whole 2/3-liter bottles from 4 1/2 liters, how many liters remain?",
            0.5,
            "Six bottles use 6 × 2/3 = 4 liters. The remainder is 4 1/2 − 4 = 1/2 liter.",
            ["Find how many liters six bottles use: 6 × 2/3.", "Subtract that from 4 1/2."],
            [[4, "That is how much the bottles use. Subtract it from 4 1/2."]],
          ),
        ];
      return [
        q(
          "How many 1/2-cup servings fit into 3 cups?",
          6,
          "Every cup holds two half-cup servings. Three cups hold six. 3 ÷ 1/2 = 6.",
          ["How many half cups are in one cup?", "Multiply that by the number of cups."],
          [[1.5, "You multiplied by 1/2. Ask how many halves fit in 3 instead."]],
        ),
        q(
          "How many 3/4-cup servings fit into 4 1/2 cups?",
          6,
          "9/2 ÷ 3/4 = 9/2 × 4/3 = 6 servings. Check: 6 × 3/4 = 4 1/2 cups.",
          ["Write 4 1/2 as an improper fraction.", "Multiply by the reciprocal of 3/4."],
          [[3.375, "You multiplied by 3/4. Dividing by 3/4 means multiplying by 4/3."]],
        ),
      ];
    }
    case "power":
      return [
        q(
          "Evaluate 2 + 3⁴.",
          83,
          "3⁴ = 3 × 3 × 3 × 3 = 81. Then add 2: 83.",
          [
            "3⁴ means 3 multiplied by itself 4 times, not 3 × 4.",
            "Work out the power first, then add 2.",
          ],
          [
            [14, "An exponent is repeated multiplication: 3⁴ = 3 × 3 × 3 × 3."],
            [625, "Find the power first, then add. Do not add 2 + 3 first."],
          ],
        ),
        q(
          "Evaluate (2 + 3)².",
          25,
          "Parentheses first: 2 + 3 = 5. Then square: 5² = 25. Grouping changes the result.",
          ["Parentheses come first.", "Find 2 + 3, then multiply that number by itself."],
          [
            [10, "Squaring means multiplying a number by itself, not by 2."],
            [11, "The square applies to the whole group (2 + 3). Add first."],
          ],
        ),
      ];
    case "expression":
      return model.mode === "distribute"
        ? [
            q(
              "Evaluate 3(x + 4) when x = 2.",
              18,
              "Substitute: 3(2 + 4) = 18. Distribute to check: 3×2 + 3×4 = 6 + 12 = 18.",
              ["Replace x with 2.", "Work out the parentheses first, then multiply by 3."],
              [[10, "The 3 multiplies everything in the parentheses: 3 × 2 and 3 × 4."]],
            ),
            q(
              "Simplify 3x + 2x + 7. What is the coefficient of x in the simplified expression?",
              5,
              "Combine only like terms: 3x + 2x = 5x. The constant 7 remains separate.",
              [
                "Like terms have the same variable part.",
                "Add the coefficients of 3x and 2x. The 7 has no x.",
              ],
              [
                [12, "The 7 is a constant, not an x-term. Add only the x coefficients."],
                [6, "Combine like terms by adding coefficients, not multiplying them."],
              ],
            ),
          ]
        : [
            q(
              "Evaluate 4x + 3 when x = 5.",
              23,
              "Replace x with 5: 4 × 5 + 3 = 23.",
              ["Replace x with 5.", "Multiply first, then add 3."],
              [[35, "Multiply before adding: 4 × 5 first, then add 3."]],
            ),
            q(
              "Evaluate 4(x + 3) when x = 5.",
              32,
              "The parentheses include both terms: 4 × (5 + 3) = 32. This is different from 4x + 3.",
              [
                "Replace x with 5 inside the parentheses.",
                "Add inside the parentheses first, then multiply by 4.",
              ],
              [
                [23, "The 4 multiplies both terms in the parentheses: (5 + 3) first."],
                [20, "Add the 3 inside the parentheses before multiplying."],
              ],
            ),
          ];
    case "factors":
      return model.mode === "lcm"
        ? [
            q(
              "Signals flash every 12 and 18 seconds, starting together at time zero. After how many seconds do they next flash together?",
              36,
              "12 = 2² × 3 and 18 = 2 × 3². LCM = 2² × 3² = 36 seconds.",
              ["List multiples of 12 and of 18.", "Find the smallest number in both lists."],
              [
                [216, "12 × 18 is a common multiple, but not the least one."],
                [6, "That is the greatest common factor. The question asks for a multiple."],
              ],
            ),
            q(
              "In the prime factorization 72 = 2³ × 3², what is the sum of the exponents?",
              5,
              "72 = 2 × 2 × 2 × 3 × 3, so the exponents are 3 and 2. Their sum is 5.",
              [
                "The exponents are the small raised numbers.",
                "Add the exponent on 2 and the exponent on 3.",
              ],
              [
                [6, "Add the exponents. Do not multiply them."],
                [72, "The question asks for the exponents, not the number itself."],
              ],
            ),
          ]
        : [
            q(
              "What is the greatest common factor of 18 and 24?",
              6,
              "The common factors are 1, 2, 3, 6. The greatest is 6.",
              [
                "List the factors of 18 and the factors of 24.",
                "Pick the largest factor that is in both lists.",
              ],
              [
                [72, "That is the least common multiple. A factor divides both numbers."],
                [3, "3 is a common factor, but there is a greater one."],
              ],
            ),
            q(
              "Fill the missing number: 18 + 24 = 6(3 + __).",
              4,
              "18 = 6×3 and 24 = 6×4, so factoring out 6 gives 6(3 + 4).",
              ["18 = 6 × 3. Write 24 the same way.", "Which number times 6 makes 24?"],
              [[24, "Factor the 6 out of 24 as well."]],
            ),
          ];
    case "line":
      return model.mode === "opposites"
        ? [
            q(
              "What is the opposite of −2.5?",
              2.5,
              "Opposites lie on different sides of zero at equal distances. The opposite is 2.5.",
              ["Opposites are the same distance from zero on opposite sides.", "Change the sign."],
              [[-2.5, "That is the same number. Its opposite is on the other side of zero."]],
            ),
            q(
              "How far is −4 from zero?",
              4,
              "Absolute value measures distance from zero: |−4| = 4 units.",
              ["Distance is never negative.", "Absolute value is the distance from zero."],
              [[-4, "Distance is never negative. Use absolute value."]],
            ),
          ]
        : [
            q(
              "Which is greater: −7 or −3? Enter the greater number.",
              -3,
              "−3 is farther right on the number line, so −3 > −7.",
              [
                "On a number line, the greater number is farther to the right.",
                "Which of the two negatives is closer to zero?",
              ],
              [[-7, "−7 is farther left on the number line, so it is less."]],
            ),
            q(
              "How far apart are −7 and −3 on a number line?",
              4,
              "The distance is |−3 − (−7)| = |4| = 4 units.",
              [
                "Count the units from −7 up to −3.",
                "Both numbers are on the same side of zero, so subtract: −3 − (−7).",
              ],
              [[10, "Both numbers are on the same side of zero. Subtract instead of adding."]],
            ),
          ];
    case "coordinates":
      return model.mode === "rectangle"
        ? [
            q(
              "A rectangle has opposite corners (−4, −2) and (3, 4). What is its area?",
              42,
              "Width = 3 − (−4) = 7; height = 4 − (−2) = 6. Area = 42 square units.",
              [
                "Width = difference of the x-coordinates. Height = difference of the y-coordinates.",
                "Subtracting a negative coordinate adds its distance from zero.",
              ],
              [
                [26, "That is the perimeter. Area = width × height."],
                [
                  2,
                  "Subtracting a negative coordinate adds distance: use the full distance across zero.",
                ],
              ],
            ),
            q(
              "What is the perimeter of that 7-by-6 rectangle?",
              26,
              "Perimeter = 2(7 + 6) = 26 units.",
              ["Perimeter is the distance around.", "Add width and height, then double."],
              [
                [42, "That is the area. Perimeter adds the sides."],
                [13, "That is only two sides. Double it."],
              ],
            ),
          ]
        : ["reflect", "symmetry"].includes(model.mode)
          ? [
              q(
                "Reflect (−3, 4) across the y-axis. What is the image’s x-coordinate?",
                3,
                "Reflection across the y-axis changes the sign of x. The image is (3, 4).",
                [
                  "Reflecting across the y-axis flips left and right.",
                  "The x-coordinate changes sign. The y-coordinate stays.",
                ],
                [
                  [-3, "Across the y-axis, x changes sign."],
                  [4, "That is the y-coordinate. The question asks for x."],
                ],
              ),
              q(
                "Reflect (−3, 4) across the x-axis. What is the image’s y-coordinate?",
                -4,
                "Reflection across the x-axis changes the sign of y. The image is (−3, −4).",
                [
                  "Reflecting across the x-axis flips up and down.",
                  "The y-coordinate changes sign. The x-coordinate stays.",
                ],
                [
                  [4, "Across the x-axis, y changes sign."],
                  [-3, "That is the x-coordinate. The question asks for y."],
                ],
              ),
            ]
          : [
              q(
                "What is the horizontal distance from (−3, 4) to (2, 4)?",
                5,
                "The y-coordinates match, so distance = |2 − (−3)| = 5 units.",
                ["The y-coordinates match, so only x changes.", "Count from −3 to 2 across zero."],
                [[1, "The points are on opposite sides of zero. Add the distances: 3 + 2."]],
              ),
              q(
                "What is the vertical distance from (2, −5) to (2, 3)?",
                8,
                "The x-coordinates match, so distance = |3 − (−5)| = 8 units.",
                [
                  "The x-coordinates match, so only y changes.",
                  "Count from −5 up to 3 across zero.",
                ],
                [[2, "The points are on opposite sides of zero. Add the distances: 5 + 3."]],
              ),
            ];
    case "balance":
      return model.mode === "add"
        ? [
            q(
              "Solve x + 7 = 19. Enter x.",
              12,
              "Subtract 7 from both sides: x = 12. Check: 12 + 7 = 19.",
              ["What number plus 7 makes 19?", "Undo the + 7 by subtracting 7 from both sides."],
              [[26, "You added 7. Undo + 7 by subtracting 7."]],
            ),
            q(
              "Solve x − 5 = 14. Enter x.",
              19,
              "Add 5 to both sides: x = 19. Check: 19 − 5 = 14.",
              ["What number minus 5 leaves 14?", "Undo the − 5 by adding 5 to both sides."],
              [[9, "You subtracted 5. Undo − 5 by adding 5."]],
            ),
          ]
        : [
            q(
              "Solve 4x = 36. Enter x.",
              9,
              "Divide both sides by 4: x = 9. Check: 4 × 9 = 36.",
              ["4 times what number makes 36?", "Undo × 4 by dividing both sides by 4."],
              [
                [144, "You multiplied. Undo × 4 by dividing by 4."],
                [32, "4x means 4 times x. Divide, do not subtract."],
              ],
            ),
            q(
              "Solve x ÷ 4 = 9. Enter x.",
              36,
              "Multiply both sides by 4: x = 36. Check: 36 ÷ 4 = 9.",
              ["What number divided by 4 gives 9?", "Undo ÷ 4 by multiplying both sides by 4."],
              [[2.25, "You divided. Undo ÷ 4 by multiplying by 4."]],
            ),
          ];
    case "inequality":
      return model.mode === "entry"
        ? [
            q(
              "Whole-number ages must satisfy a > 12. What is the youngest allowed whole-number age?",
              13,
              "The boundary 12 is excluded. The next whole number is 13.",
              ["Does a > 12 include 12 itself?", "Find the first whole number after the boundary."],
              [[12, "The > sign excludes 12. Choose the next whole number."]],
            ),
            q(
              "A height rule is h ≥ 120 centimeters. What is the smallest allowed height?",
              120,
              "The ≥ symbol includes equality. Exactly 120 cm qualifies.",
              [
                "Does ≥ include the boundary itself?",
                "The line under the symbol means “or equal to.”",
              ],
              [[121, "≥ includes 120 itself."]],
            ),
          ]
        : [
            q(
              "Tickets cost $3 each and you have $15. What is the greatest whole number of tickets you can buy?",
              5,
              "3t ≤ 15, so t ≤ 5. Five tickets cost exactly $15.",
              ["Write an inequality: 3t ≤ 15.", "Divide both sides by 3 to find the greatest t."],
              [
                [45, "You multiplied. The cost of t tickets is 3t, so divide 15 by 3."],
                [4, "≤ includes equality: 5 tickets cost exactly $15."],
              ],
            ),
            q(
              "You have $20 and must first pay a $5 entry fee. Each ticket then costs $3. What is the greatest whole number of tickets you can buy?",
              5,
              "5 + 3t ≤ 20. Subtract 5, then divide by 3: t ≤ 5.",
              [
                "Pay the entry fee first: how much money is left?",
                "Divide the money left by $3 per ticket.",
              ],
              [[6, "Subtract the $5 fee before dividing by $3."]],
            ),
          ];
    default:
      throw new Error(`Missing original practice for ${model.kind}`);
  }
}
