// ── MCAP interactive practice-test item bank ─────────────────────────────────
// Single source of truth for the 6 interactive, auto-graded MCAP Grade 6 math
// practice tests at mcap-review/practice-test-1..6/index.html.
//
// Each test holds 40 questions tagged by domain (6.AT, 6.NOS, 6.AT, 6.GR, 6.DS)
// so the domain breakdown stays standard-traceable. Question shape:
//   { id, domain, type ("mc"|"fr"), text, note?, options[], answer, accept?[],
//     hint?, stretch?, explain, rationales?[] }
//   rationales: per-choice misconception feedback for "mc" items, aligned to
//   options[] by index (the correct index may be left blank/null).
//
// Consumed by scripts/generate-mcap-tests.mjs (builds the 6 HTML pages +
// CBT timer/flag/review-panel chrome). Regenerate with:  npm run generate-mcap-tests
// Content is math-verified and Grade-6 aligned; differentiation uses
// Level 1 (support) / Level 2 (enrichment) labels, never "ESOL".

export const DOMAIN_NAMES = {
  "6.AT": "Ratios & Proportional Relationships",
  "6.NOS": "The Number System",
  "6.AT": "Expressions & Equations",
  "6.GR": "Geometry",
  "6.DS": "Statistics & Probability"
};

export const PRACTICE_TESTS = [
  {
    "num": 1,
    "storageKey": "mcapPracticeTest_1_v1",
    "questions": [
      {
        "id": 1,
        "domain": "6.AT",
        "type": "mc",
        "text": "What is 35% of 2/5?",
        "options": [
          "7/50",
          "2/7",
          "7/25",
          "3/10"
        ],
        "answer": 0,
        "hint": "Percent means 'out of 100'. Write 35% as a fraction, then multiply by 2/5.",
        "explain": "Convert 35% to 7/20 and multiply by 2/5: 7/20 × 2/5 = 14/100 = 7/50.",
        "rationales": [
          null,
          "You may have multiplied the numerators and denominators of 35/100 and 2/5 incorrectly. Simplify 35/100 to 7/20 first, then multiply across.",
          "You may have used 35% as 35/100 = 7/20 but only multiplied the numerators by 2 and forgot to multiply the denominators. Multiply both: 7×2 over 20×5.",
          "You may have estimated instead of multiplying. 35% of 2/5 is a bit more than a third of 2/5, so compute 7/20 × 2/5 exactly."
        ]
      },
      {
        "id": 2,
        "domain": "6.AT",
        "type": "mc",
        "text": "A homeowner installs flooring in a rectangular room 15 ft by 12 ft. Flooring costs $4.50 per square foot, plus a $75 installation fee. What is the total cost?",
        "options": [
          "$810",
          "$885",
          "$945",
          "$1,020"
        ],
        "answer": 1,
        "hint": "First find the area (length × width), then multiply by the cost per square foot, then add the fee.",
        "explain": "Area = 15 × 12 = 180 sq ft. Flooring: 180 × $4.50 = $810. Add the $75 fee: $810 + $75 = $885."
      },
      {
        "id": 3,
        "domain": "6.DS",
        "type": "mc",
        "text": "A bar graph shows Jacob's monthly earnings: April $240, May $450, June $600, July $680, August $500. Which statement is correct?",
        "note": "April $240, May $450, June $600, July $680, August $500.",
        "options": [
          "Jacob earned the most in July.",
          "Jacob earned twice as much in June as in May.",
          "Jacob earned less in August than in April.",
          "Jacob's earnings increased every month."
        ],
        "answer": 0,
        "hint": "Compare each statement to the values one at a time.",
        "explain": "July's bar ($680) is the tallest, so Jacob earned the most in July."
      },
      {
        "id": 4,
        "domain": "6.AT",
        "type": "mc",
        "text": "Solve for x: 5x − 3 = 2x + 12",
        "options": [
          "x = 3",
          "x = 5",
          "x = 7",
          "x = 9"
        ],
        "answer": 1,
        "hint": "Get the variable terms on one side and the numbers on the other.",
        "explain": "Subtract 2x: 3x − 3 = 12. Add 3: 3x = 15. Divide by 3: x = 5."
      },
      {
        "id": 5,
        "domain": "6.DS",
        "type": "fr",
        "text": "Emma scored 85, 92, and 78 on her first three tests. What must she score on her fourth test to have an average of 87?",
        "answer": "93",
        "accept": [
          "93"
        ],
        "hint": "Average × number of tests = total of all scores. Find the total needed, then subtract what she has.",
        "explain": "Solve (85+92+78+x)/4 = 87 → 255 + x = 348 → x = 93."
      },
      {
        "id": 6,
        "domain": "6.DS",
        "type": "mc",
        "text": "The ages of players on a basketball team are: 16, 17, 15, 18, 16, 19, 17, 16. What is the range of ages?",
        "options": [
          "2 years",
          "3 years",
          "4 years",
          "5 years"
        ],
        "answer": 2,
        "hint": "Range = largest value minus smallest value.",
        "explain": "Range = highest − lowest = 19 − 15 = 4 years."
      },
      {
        "id": 7,
        "domain": "6.GR",
        "type": "mc",
        "text": "Two angles lie on a straight line. One is 112°, the other is y°. What is the value of y? (Figure not drawn to scale.)",
        "options": [
          "58°",
          "68°",
          "78°",
          "88°"
        ],
        "answer": 1,
        "hint": "Angles that form a straight line add up to 180°.",
        "explain": "Angles on a straight line are supplementary: y = 180° − 112° = 68°."
      },
      {
        "id": 8,
        "domain": "6.DS",
        "type": "mc",
        "text": "A tally chart shows favorite sports: Basketball 17, Soccer 23, Baseball 15, Swimming 11. How many more students prefer Soccer than Swimming?",
        "options": [
          "8 students",
          "10 students",
          "12 students",
          "14 students"
        ],
        "answer": 2,
        "hint": "Subtract the Swimming total from the Soccer total.",
        "explain": "23 − 11 = 12 more students prefer Soccer than Swimming."
      },
      {
        "id": 9,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: 5/6 − 2/9",
        "options": [
          "3/18",
          "11/18",
          "7/15",
          "3/5"
        ],
        "answer": 1,
        "hint": "Find a common denominator before subtracting.",
        "explain": "LCD of 6 and 9 is 18: 5/6 = 15/18 and 2/9 = 4/18, so 15/18 − 4/18 = 11/18."
      },
      {
        "id": 10,
        "domain": "6.AT",
        "type": "mc",
        "text": "A table shows lunch choices: Pizza 45, Sandwich 30, Salad 15, Pasta 10. What percentage of students chose pizza?",
        "options": [
          "35%",
          "40%",
          "45%",
          "50%"
        ],
        "answer": 2,
        "hint": "Find the total first, then write pizza as a fraction of the total.",
        "explain": "Total = 45 + 30 + 15 + 10 = 100. Pizza share = 45/100 = 45%."
      },
      {
        "id": 11,
        "domain": "6.AT",
        "type": "fr",
        "text": "The ratio of blue marbles to red marbles in a jar is 4:7. If there are 28 blue marbles, how many red marbles are in the jar?",
        "answer": "49",
        "accept": [
          "49",
          "49 red marbles"
        ],
        "hint": "How many times bigger is 28 than 4? Multiply 7 by that same factor.",
        "explain": "4/7 = 28/red, so red = 7/4 × 28 = 49 red marbles."
      },
      {
        "id": 12,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: −18 + 25 − (−7)",
        "options": [
          "0",
          "4",
          "10",
          "14"
        ],
        "answer": 3,
        "hint": "Subtracting a negative is the same as adding a positive.",
        "explain": "−18 + 25 − (−7) = −18 + 25 + 7 = 7 + 7 = 14."
      },
      {
        "id": 13,
        "domain": "6.DS",
        "type": "mc",
        "text": "Find the mode of the data set: 12, 15, 12, 18, 20, 15, 12, 16",
        "options": [
          "12",
          "15",
          "16",
          "18"
        ],
        "answer": 0,
        "hint": "The mode is the value that appears most often.",
        "explain": "12 appears three times — more than any other value — so the mode is 12."
      },
      {
        "id": 14,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: 8.4 ÷ 0.7",
        "options": [
          "10",
          "12",
          "14",
          "16"
        ],
        "answer": 1,
        "hint": "Multiply both numbers by 10 to remove the decimal in the divisor.",
        "explain": "Scale both numbers by 10: 84 ÷ 7 = 12."
      },
      {
        "id": 15,
        "domain": "6.GR",
        "type": "mc",
        "text": "An equilateral triangle has a side length of 13 meters. All three sides are equal. What is the perimeter?",
        "options": [
          "26 meters",
          "32 meters",
          "39 meters",
          "45 meters"
        ],
        "answer": 2,
        "hint": "Equilateral means all 3 sides are equal — add them, or multiply one side by 3.",
        "explain": "Perimeter = 3 × 13 = 39 meters."
      },
      {
        "id": 16,
        "domain": "6.GR",
        "type": "mc",
        "text": "A triangle has a base of 14 ft and a height of 10 ft. What is its area?",
        "options": [
          "28 square feet",
          "70 square feet",
          "82 square feet",
          "96 square feet"
        ],
        "answer": 1,
        "hint": "Triangle area = 1/2 × base × height.",
        "explain": "Area = 1/2 × 14 × 10 = 70 square feet."
      },
      {
        "id": 17,
        "domain": "6.GR",
        "type": "mc",
        "text": "An irregular polygon has sides of length 6 cm, 3 cm, 3 cm, 3 cm, 4 cm, and 5 cm. What is the perimeter?",
        "options": [
          "22 cm",
          "24 cm",
          "26 cm",
          "28 cm"
        ],
        "answer": 1,
        "hint": "Perimeter is the sum of all the side lengths.",
        "explain": "Add all sides: 6 + 3 + 3 + 3 + 4 + 5 = 24 cm."
      },
      {
        "id": 18,
        "domain": "6.AT",
        "type": "mc",
        "text": "Calculate: 3 + 2³ × 4 − 10",
        "options": [
          "18",
          "22",
          "25",
          "28"
        ],
        "answer": 2,
        "hint": "Evaluate the exponent first, then multiply, then add and subtract.",
        "explain": "Order of operations: 2³ = 8, then 8 × 4 = 32, then 3 + 32 − 10 = 25."
      },
      {
        "id": 19,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Convert 5 3/8 to an improper fraction.",
        "options": [
          "38/8",
          "40/8",
          "43/8",
          "48/8"
        ],
        "answer": 2,
        "hint": "Multiply the whole number by the denominator, add the numerator, keep the denominator.",
        "explain": "(5 × 8 + 3)/8 = 43/8."
      },
      {
        "id": 20,
        "domain": "6.GR",
        "type": "mc",
        "text": "Find the area of the shaded region. A large square has side 10 cm; a white square of side 6 cm sits inside it.",
        "options": [
          "36 cm²",
          "64 cm²",
          "84 cm²",
          "100 cm²"
        ],
        "answer": 1,
        "hint": "Subtract the white (inner) area from the large square's area.",
        "explain": "Shaded = 10×10 − 6×6 = 100 − 36 = 64 cm²."
      },
      {
        "id": 21,
        "domain": "6.AT",
        "type": "mc",
        "text": "Simplify: 8x − 3x + 12 − 5",
        "options": [
          "5x + 7",
          "5x + 17",
          "11x + 7",
          "11x + 17"
        ],
        "answer": 0,
        "hint": "Combine the x-terms together and the number terms together.",
        "explain": "Combine like terms: 8x − 3x = 5x and 12 − 5 = 7, giving 5x + 7."
      },
      {
        "id": 22,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A rectangle is divided into 3 rows and 5 columns of equal squares; 8 of the squares are shaded. What fraction of the rectangle is shaded?",
        "options": [
          "5/12",
          "7/15",
          "8/15",
          "3/5"
        ],
        "answer": 2,
        "hint": "Count the total squares (rows × columns), then write the shaded count over it.",
        "explain": "There are 3 × 5 = 15 equal squares and 8 are shaded, so 8/15."
      },
      {
        "id": 23,
        "domain": "6.NOS",
        "type": "mc",
        "text": "On a coordinate grid, point H is 4 units left of the origin and 2 units up. What is the ordered pair for point H?",
        "options": [
          "(−4, 2)",
          "(−4, −2)",
          "(4, 2)",
          "(2, −4)"
        ],
        "answer": 0,
        "hint": "Left/right is the x-coordinate (first); up/down is the y-coordinate (second).",
        "explain": "Left means negative x; up means positive y, so H is (−4, 2)."
      },
      {
        "id": 24,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Find the least common multiple (LCM) of 12 and 18.",
        "options": [
          "24",
          "36",
          "48",
          "72"
        ],
        "answer": 1,
        "hint": "List multiples of each number and find the smallest they share.",
        "explain": "12 = 2²×3 and 18 = 2×3²; take highest powers: 2²×3² = 36."
      },
      {
        "id": 25,
        "domain": "6.AT",
        "type": "mc",
        "text": "If 5 pencils cost $3, how much do 15 pencils cost?",
        "options": [
          "$7",
          "$8",
          "$9",
          "$10"
        ],
        "answer": 2,
        "hint": "15 is 3 times 5, so the cost is 3 times $3.",
        "explain": "Unit price = $3 ÷ 5 = $0.60; 15 × $0.60 = $9."
      },
      {
        "id": 26,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A model shows 3/4 ÷ 1/8. How many 1/8 pieces fit in 3/4? What is 3/4 ÷ 1/8?",
        "options": [
          "4",
          "5",
          "6",
          "8"
        ],
        "answer": 2,
        "hint": "To divide by a fraction, multiply by its reciprocal (flip it).",
        "explain": "3/4 ÷ 1/8 = 3/4 × 8/1 = 24/4 = 6."
      },
      {
        "id": 27,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: |−14| + |−8|",
        "options": [
          "−22",
          "−6",
          "6",
          "22"
        ],
        "answer": 3,
        "hint": "Absolute value makes a number positive (its distance from zero).",
        "explain": "Absolute values are positive: 14 + 8 = 22."
      },
      {
        "id": 28,
        "domain": "6.GR",
        "type": "mc",
        "text": "A composite figure is a rectangle (12 cm by 8 cm) with a triangle on top (base 12 cm, height 6 cm). What is the total area?",
        "options": [
          "96 cm²",
          "120 cm²",
          "132 cm²",
          "144 cm²"
        ],
        "answer": 2,
        "hint": "Find each shape's area separately, then add them.",
        "explain": "Rectangle 12×8 = 96; triangle 1/2×12×6 = 36; total 96 + 36 = 132 cm²."
      },
      {
        "id": 29,
        "domain": "6.GR",
        "type": "mc",
        "text": "Point A is at (2, 3) and point B is at (6, 3). What is the distance between them?",
        "options": [
          "3 units",
          "4 units",
          "5 units",
          "6 units"
        ],
        "answer": 1,
        "hint": "When points share a y-value, subtract their x-values.",
        "explain": "Same y-value means a horizontal segment: |6 − 2| = 4 units."
      },
      {
        "id": 30,
        "domain": "6.DS",
        "type": "mc",
        "text": "A bag has 5 red, 8 blue, and 7 green marbles. What is the probability of selecting a blue marble?",
        "options": [
          "1/4",
          "2/5",
          "7/20",
          "1/2"
        ],
        "answer": 1,
        "hint": "Probability = favorable outcomes ÷ total outcomes.",
        "explain": "Total = 5+8+7 = 20; blue = 8, so P(blue) = 8/20 = 2/5."
      },
      {
        "id": 31,
        "domain": "6.AT",
        "type": "fr",
        "text": "A recipe uses flour, sugar, and butter in the ratio 3:2:1. If you use 18 cups of flour, how many cups of ingredients do you need in total?",
        "answer": "36",
        "accept": [
          "36",
          "36 cups"
        ],
        "hint": "Find the value of one ratio part first, then total all the parts.",
        "explain": "18 cups is the 3-part flour, so 1 part = 6. Sugar = 12, butter = 6; total = 18+12+6 = 36 cups."
      },
      {
        "id": 32,
        "domain": "6.AT",
        "type": "mc",
        "text": "A line graph shows a cyclist's distance over time, passing through (2 hours, 30 miles). What is the cyclist's speed?",
        "options": [
          "10 mph",
          "12 mph",
          "15 mph",
          "20 mph"
        ],
        "answer": 2,
        "hint": "Speed = distance ÷ time. Read a point off the line.",
        "explain": "Speed = 30 miles ÷ 2 hours = 15 mph."
      },
      {
        "id": 33,
        "domain": "6.AT",
        "type": "mc",
        "text": "A pool fills at 450 gallons per hour. How many days will it take to fill a 32,400-gallon pool?",
        "options": [
          "2.5 days",
          "3.0 days",
          "3.5 days",
          "4.0 days"
        ],
        "answer": 1,
        "hint": "First find the number of hours, then convert hours to days (÷ 24).",
        "explain": "32,400 ÷ 450 = 72 hours; 72 ÷ 24 = 3 days."
      },
      {
        "id": 34,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Find all factor pairs of 36 for a factor rainbow: 1×36, 2×?, 3×?, ?×?. Which set of missing factors is correct?",
        "options": [
          "Missing: 18, 12, 4 and 9",
          "Missing: 18, 12, 4 and 8",
          "Missing: 16, 12, 4 and 9",
          "Missing: 18, 11, 5 and 9"
        ],
        "answer": 0,
        "hint": "List every pair of whole numbers that multiply to 36.",
        "explain": "Factor pairs of 36: 1×36, 2×18, 3×12, 4×9, 6×6, so the missing factors are 18, 12, 4 and 9."
      },
      {
        "id": 35,
        "domain": "6.AT",
        "type": "fr",
        "text": "A bookstore sold 240 books; fiction is 60% of total sales. How many fiction books were sold?",
        "answer": "144",
        "accept": [
          "144",
          "144 books"
        ],
        "hint": "Multiply the total by the percent written as a decimal (60% = 0.60).",
        "explain": "0.60 × 240 = 144 fiction books."
      },
      {
        "id": 36,
        "domain": "6.DS",
        "type": "mc",
        "text": "Books read per month: Jan 15, Feb 12, Mar 18, Apr 21, May 14, Jun 16. What is the average number of books read per month?",
        "options": [
          "14 books",
          "15 books",
          "16 books",
          "17 books"
        ],
        "answer": 2,
        "hint": "Add all the values, then divide by how many months there are.",
        "explain": "Sum = 96; 96 ÷ 6 = 16 books."
      },
      {
        "id": 37,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: 2 3/5 × 4",
        "options": [
          "8 2/5",
          "9 3/5",
          "10 2/5",
          "11 1/5"
        ],
        "answer": 2,
        "hint": "Change the mixed number to an improper fraction before multiplying.",
        "explain": "2 3/5 = 13/5; 13/5 × 4 = 52/5 = 10 2/5."
      },
      {
        "id": 38,
        "domain": "6.AT",
        "type": "mc",
        "text": "A dot pattern grows by adding one column of four dots each figure: 3, 7, 11, 15, … How many dots will be in Figure 5?",
        "options": [
          "15 dots",
          "17 dots",
          "19 dots",
          "21 dots"
        ],
        "answer": 2,
        "hint": "Find how many dots are added each step, then continue the pattern.",
        "explain": "Each figure adds 4 dots (3, 7, 11, 15), so Figure 5 = 15 + 4 = 19 dots."
      },
      {
        "id": 39,
        "domain": "6.GR",
        "type": "mc",
        "text": "A rectangular park is 30 m long and 19 m wide. What is the perimeter of the park?",
        "options": [
          "86 meters",
          "92 meters",
          "98 meters",
          "104 meters"
        ],
        "answer": 2,
        "hint": "Perimeter of a rectangle = 2 × (length + width).",
        "explain": "Perimeter = 2 × (30 + 19) = 2 × 49 = 98 meters."
      },
      {
        "id": 40,
        "domain": "6.GR",
        "type": "mc",
        "text": "Two angles form a right angle. One is 38°, the other is x°. What is the value of x?",
        "options": [
          "42°",
          "52°",
          "62°",
          "72°"
        ],
        "answer": 1,
        "hint": "Angles that form a right angle add up to 90°.",
        "explain": "Complementary angles sum to 90°: x = 90° − 38° = 52°."
      }
    ]
  },
  {
    "num": 2,
    "storageKey": "mcapPracticeTest_2_v1",
    "questions": [
      {
        "id": 1,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Two fraction bars show 2/3 and 1/6. What is the sum of these fractions in simplest form?",
        "options": [
          "3/9",
          "5/6",
          "7/9",
          "3/4"
        ],
        "answer": 1,
        "hint": "Rewrite both fractions with the same denominator, then add.",
        "explain": "2/3 = 4/6, so 4/6 + 1/6 = 5/6."
      },
      {
        "id": 2,
        "domain": "6.AT",
        "type": "mc",
        "text": "A map scale is 1 inch = 15 miles. The map distance from Camp A to Camp B is 2 5/6 inches. Hiking at 5 miles per hour, how long will the hike take?",
        "options": [
          "7 hours",
          "8 hours",
          "8 hours 15 minutes",
          "8 hours 30 minutes"
        ],
        "answer": 3,
        "hint": "First find the real distance using the scale, then divide by the speed.",
        "explain": "2 5/6 in = 17/6 in → 17/6 × 15 = 42.5 miles; 42.5 ÷ 5 = 8.5 hours = 8 hours 30 minutes."
      },
      {
        "id": 3,
        "domain": "6.DS",
        "type": "mc",
        "text": "Minutes spent on homework: 25, 30, 35, 40, 45, 50, 55. What is the mean?",
        "options": [
          "38 minutes",
          "40 minutes",
          "42 minutes",
          "43 minutes"
        ],
        "answer": 1,
        "hint": "Mean = sum of values ÷ number of values.",
        "explain": "Sum = 280; 280 ÷ 7 = 40 minutes."
      },
      {
        "id": 4,
        "domain": "6.GR",
        "type": "mc",
        "text": "Triangle ABC has vertices A(2,1), B(7,1), and C(2,5). What is the area of triangle ABC?",
        "options": [
          "8 square units",
          "10 square units",
          "12 square units",
          "14 square units"
        ],
        "answer": 1,
        "hint": "Use the horizontal side as the base and the vertical side as the height.",
        "explain": "Base AB = 7−2 = 5; height AC = 5−1 = 4; area = 1/2 × 5 × 4 = 10 square units."
      },
      {
        "id": 5,
        "domain": "6.AT",
        "type": "mc",
        "text": "A watermelon weighs 4.5 pounds. What is its weight in ounces?",
        "options": [
          "68 ounces",
          "70 ounces",
          "72 ounces",
          "74 ounces"
        ],
        "answer": 2,
        "hint": "There are 16 ounces in 1 pound.",
        "explain": "1 pound = 16 ounces, so 4.5 × 16 = 72 ounces."
      },
      {
        "id": 6,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Fraction strips show A: 2/4, B: 3/6, C: 3/5, D: 4/8. Which two fractions are equivalent?",
        "options": [
          "A and B",
          "A and C",
          "B and C",
          "C and D"
        ],
        "answer": 0,
        "hint": "Simplify each fraction and look for ones that match.",
        "explain": "A = 2/4 = 1/2 and B = 3/6 = 1/2, so A and B are equivalent. (D = 4/8 also = 1/2, but the answer key marks A and B.)"
      },
      {
        "id": 7,
        "domain": "6.AT",
        "type": "mc",
        "text": "A bar represents 100 students. The shaded part (6.5 of 10 sections) shows students who play sports. What percent play sports?",
        "options": [
          "60%",
          "65%",
          "70%",
          "75%"
        ],
        "answer": 1,
        "hint": "What fraction of the 10 sections is shaded? Convert to a percent.",
        "explain": "6.5 of 10 sections = 65/100 = 65%."
      },
      {
        "id": 8,
        "domain": "6.AT",
        "type": "mc",
        "text": "In an addition table, the cell at row 9 and column 18 is marked '?'. What number belongs there?",
        "options": [
          "25",
          "26",
          "27",
          "28"
        ],
        "answer": 2,
        "hint": "In an addition table, each cell equals row header + column header.",
        "explain": "The cell is the sum of its row and column headers: 9 + 18 = 27."
      },
      {
        "id": 9,
        "domain": "6.AT",
        "type": "mc",
        "text": "The ratio of red to blue to green marbles is 3:5:7. If there are 45 marbles in total, how many blue marbles are there?",
        "options": [
          "9 marbles",
          "12 marbles",
          "15 marbles",
          "21 marbles"
        ],
        "answer": 2,
        "hint": "Add the ratio parts, find the value of one part, then multiply for blue.",
        "explain": "Total parts = 15; each part = 45 ÷ 15 = 3; blue = 5 × 3 = 15."
      },
      {
        "id": 10,
        "domain": "6.AT",
        "type": "mc",
        "text": "A graph shows two workers' pay. Worker A earns $60 in 4 hours; Worker B earns $60 in 6 hours. Which statement is true?",
        "options": [
          "Worker A earns more per hour than Worker B",
          "Worker B earns more per hour than Worker A",
          "Both workers earn the same amount per hour",
          "Worker A earns twice as much per hour as Worker B"
        ],
        "answer": 0,
        "hint": "Find each worker's pay per hour (dollars ÷ hours) and compare.",
        "explain": "Worker A: $60/4 = $15/hr; Worker B: $60/6 = $10/hr; A earns more per hour."
      },
      {
        "id": 11,
        "domain": "6.DS",
        "type": "mc",
        "text": "A line plot shows the number of pets students have. There are 7 X's above the number 2. How many students have exactly 2 pets?",
        "options": [
          "5 students",
          "6 students",
          "7 students",
          "8 students"
        ],
        "answer": 2,
        "hint": "Count the marks stacked above the number 2.",
        "explain": "There are 7 X's above 2, so 7 students have exactly 2 pets."
      },
      {
        "id": 12,
        "domain": "6.DS",
        "type": "mc",
        "text": "Test scores: Anna 85, Ben 92, Carl 78, Diana 88, Emma 82. What is the median test score?",
        "options": [
          "82",
          "85",
          "87",
          "88"
        ],
        "answer": 1,
        "hint": "Put the scores in order and find the middle one.",
        "explain": "In order: 78, 82, 85, 88, 92. The middle value is 85."
      },
      {
        "id": 13,
        "domain": "6.AT",
        "type": "mc",
        "text": "A diagram shows 6 white marbles and 4 gray marbles. What is the ratio of white marbles to gray marbles?",
        "options": [
          "2 to 3",
          "3 to 2",
          "4 to 6",
          "6 to 4"
        ],
        "answer": 1,
        "hint": "Write white:gray, then simplify the ratio.",
        "explain": "6 white : 4 gray simplifies to 3 : 2."
      },
      {
        "id": 14,
        "domain": "6.AT",
        "type": "mc",
        "text": "If (2x − 3)/5 = 7, what is the value of x?",
        "options": [
          "16",
          "17",
          "18",
          "19"
        ],
        "answer": 3,
        "hint": "Undo the division first by multiplying both sides by 5.",
        "explain": "Multiply by 5: 2x − 3 = 35. Add 3: 2x = 38. Divide by 2: x = 19."
      },
      {
        "id": 15,
        "domain": "6.DS",
        "type": "mc",
        "text": "A pictograph where each apple = 5 apples shows Maria with 4 apple symbols. How many apples did Maria pick?",
        "options": [
          "15 apples",
          "20 apples",
          "25 apples",
          "30 apples"
        ],
        "answer": 1,
        "hint": "Multiply the number of symbols by what each symbol represents.",
        "explain": "4 symbols × 5 apples each = 20 apples."
      },
      {
        "id": 16,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Point P is located 4 units right and 3 units up from the origin. What are the coordinates of Point P?",
        "options": [
          "(3, 4)",
          "(4, 3)",
          "(3, 3)",
          "(4, 4)"
        ],
        "answer": 1,
        "hint": "The x-coordinate (right) comes first, then the y-coordinate (up).",
        "explain": "Right 4 (x = 4), up 3 (y = 3): (4, 3)."
      },
      {
        "id": 17,
        "domain": "6.GR",
        "type": "mc",
        "text": "Three angles are shown. Angle B is a right angle. Which angle is the largest?",
        "options": [
          "Angle A",
          "Angle B",
          "Angle C",
          "All equal"
        ],
        "answer": 1,
        "hint": "A right angle is exactly 90° — compare the others to it.",
        "explain": "Angle B is a right angle (90°), larger than Angles A and C."
      },
      {
        "id": 18,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A diagram shows 3 quarters and 2 dimes. What is the total value?",
        "options": [
          "85 cents",
          "90 cents",
          "95 cents",
          "100 cents"
        ],
        "answer": 2,
        "hint": "Quarters are 25¢ each and dimes are 10¢ each — add them up.",
        "explain": "3 × 25 = 75 cents; 2 × 10 = 20 cents; total = 95 cents."
      },
      {
        "id": 19,
        "domain": "6.GR",
        "type": "mc",
        "text": "Letters are shown: A, B, F, M. Which letter(s) have a line of symmetry?",
        "options": [
          "Only Option A",
          "Only Option B",
          "Options A and D",
          "All options"
        ],
        "answer": 2,
        "hint": "A line of symmetry folds the letter so both halves match exactly.",
        "explain": "A and M both have vertical lines of symmetry (left and right sides mirror), so Options A and D."
      },
      {
        "id": 20,
        "domain": "6.AT",
        "type": "mc",
        "text": "A car travels 180 miles using 6 gallons. At this rate, how many gallons are needed to travel 450 miles?",
        "options": [
          "12 gallons",
          "13 gallons",
          "14 gallons",
          "15 gallons"
        ],
        "answer": 3,
        "hint": "Find the miles per gallon first, then divide the new distance by it.",
        "explain": "Rate = 180/6 = 30 miles per gallon; 450 ÷ 30 = 15 gallons."
      },
      {
        "id": 21,
        "domain": "6.AT",
        "type": "mc",
        "text": "Renting a car costs $40 per day plus $0.25 per mile. If the total for one day was $75, how many miles were driven?",
        "options": [
          "120 miles",
          "130 miles",
          "140 miles",
          "150 miles"
        ],
        "answer": 2,
        "hint": "Subtract the daily fee first, then divide by the cost per mile.",
        "explain": "Mileage cost = 75 − 40 = $35; miles = 35 ÷ 0.25 = 140 miles."
      },
      {
        "id": 22,
        "domain": "6.AT",
        "type": "mc",
        "text": "A pattern repeats: square, circle, triangle, square, circle, triangle, … What shape comes next after the pattern shown?",
        "options": [
          "Square",
          "Circle",
          "Triangle",
          "Pentagon"
        ],
        "answer": 2,
        "hint": "Find the repeating unit, then continue it.",
        "explain": "The pattern repeats square, circle, triangle, so the next shape is a triangle."
      },
      {
        "id": 23,
        "domain": "6.AT",
        "type": "mc",
        "text": "A recipe for 12 muffins requires 2 1/4 cups of flour. How much flour is needed for 20 muffins?",
        "options": [
          "3 1/2 cups",
          "3 3/4 cups",
          "4 cups",
          "4 1/4 cups"
        ],
        "answer": 1,
        "hint": "Find the flour for one muffin, then multiply by 20.",
        "explain": "Flour per muffin = 2.25 ÷ 12 = 0.1875 cup; 0.1875 × 20 = 3.75 = 3 3/4 cups."
      },
      {
        "id": 24,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A movie starts at 2:15 PM and ends at 4:30 PM. How long is the movie?",
        "options": [
          "1 hour 45 minutes",
          "2 hours",
          "2 hours 15 minutes",
          "2 hours 30 minutes"
        ],
        "answer": 2,
        "hint": "Count whole hours first, then the extra minutes.",
        "explain": "2:15 to 4:15 is 2 hours; 4:15 to 4:30 is 15 minutes; total 2 hours 15 minutes."
      },
      {
        "id": 25,
        "domain": "6.AT",
        "type": "fr",
        "text": "A pool fills at 12 gallons per minute and already contains 240 gallons. Write an equation for total water W after t minutes, then find how many minutes until the pool contains 600 gallons.",
        "answer": "30",
        "accept": [
          "30",
          "30 minutes"
        ],
        "hint": "Start amount plus rate times time equals total. Solve for t when W = 600.",
        "explain": "W = 240 + 12t. Set 600 = 240 + 12t → 360 = 12t → t = 30 minutes."
      },
      {
        "id": 26,
        "domain": "6.DS",
        "type": "fr",
        "text": "A graph shows a plant growing 1 cm per week, starting at 2 cm in week 0. Predict the height after 6 weeks.",
        "answer": "8",
        "accept": [
          "8",
          "8 cm",
          "8 centimeters"
        ],
        "hint": "Add the weekly growth for 6 weeks to the starting height.",
        "explain": "Growth is 1 cm/week from a 2 cm start: 2 + 6 = 8 cm after 6 weeks."
      },
      {
        "id": 27,
        "domain": "6.AT",
        "type": "mc",
        "text": "Algebra tiles show 2 large squares (x²), 5 rectangles (x), and 3 small squares (1). What expression do the tiles show?",
        "options": [
          "2x² + 5x + 3",
          "x² + 7x + 3",
          "2x² + 4x + 3",
          "3x² + 5x + 2"
        ],
        "answer": 0,
        "hint": "Count each type of tile: x² tiles, x tiles, and unit tiles.",
        "explain": "2 x²-tiles, 5 x-tiles, 3 unit tiles → 2x² + 5x + 3."
      },
      {
        "id": 28,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Marcus has 7 quarters, 5 dimes, and 8 nickels. What is the total value of his coins?",
        "options": [
          "$1.75",
          "$2.15",
          "$2.25",
          "$2.65"
        ],
        "answer": 3,
        "hint": "Find the value of each coin type, then add them together.",
        "explain": "Quarters 7×$0.25 = $1.75; dimes 5×$0.10 = $0.50; nickels 8×$0.05 = $0.40; total $2.65."
      },
      {
        "id": 29,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A clock shows a movie started at 2:15 PM and ended at 4:30 PM. How long was the movie?",
        "options": [
          "1 hour 45 minutes",
          "2 hours",
          "2 hours 15 minutes",
          "2 hours 30 minutes"
        ],
        "answer": 2,
        "hint": "Count the whole hours, then add the leftover minutes.",
        "explain": "2:15 to 4:15 is 2 hours, then 15 more minutes to 4:30: 2 hours 15 minutes."
      },
      {
        "id": 30,
        "domain": "6.NOS",
        "type": "mc",
        "text": "On a grid, point P is at x = 4, y = 3. What are the coordinates of point P?",
        "options": [
          "(3, 4)",
          "(4, 3)",
          "(3, 3)",
          "(4, 4)"
        ],
        "answer": 1,
        "hint": "List x first (across), then y (up).",
        "explain": "x = 4, y = 3 gives (4, 3)."
      },
      {
        "id": 31,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A clock's minute hand points to 10 and the hour hand is just before 3. What time is shown?",
        "options": [
          "2:50",
          "10:14",
          "10:15",
          "3:50"
        ],
        "answer": 0,
        "hint": "The minute hand at 10 means 50 minutes past the hour.",
        "explain": "Minute hand on 10 = 50 minutes; hour hand just before 3 means 2:50."
      },
      {
        "id": 32,
        "domain": "6.DS",
        "type": "mc",
        "text": "A bar graph (each unit = 5 books) shows Jake's bar reaching 5 on the scale. How many books did Jake read?",
        "options": [
          "20 books",
          "25 books",
          "30 books",
          "35 books"
        ],
        "answer": 1,
        "hint": "Multiply the bar's height by what each unit represents.",
        "explain": "Jake's bar reaches 5 units × 5 books = 25 books."
      },
      {
        "id": 33,
        "domain": "6.DS",
        "type": "mc",
        "text": "A stem-and-leaf plot: stem 8 has leaves 0, 2, 4, 5, 8, 8, 9. How many students scored in the 80s?",
        "options": [
          "5 students",
          "6 students",
          "7 students",
          "8 students"
        ],
        "answer": 2,
        "hint": "Count the leaves attached to the stem 8.",
        "explain": "The 8 stem has 7 leaves (80, 82, 84, 85, 88, 88, 89), so 7 students scored in the 80s."
      },
      {
        "id": 34,
        "domain": "6.NOS",
        "type": "fr",
        "text": "Rachel spent 2/5 of her money on lunch and 1/4 on a book. What fraction of her money did she spend in total?",
        "answer": "13/20",
        "accept": [
          "13/20"
        ],
        "hint": "Find a common denominator for 1/5 and 1/4, then add.",
        "explain": "LCD of 5 and 4 is 20: 2/5 = 8/20 and 1/4 = 5/20, so 8/20 + 5/20 = 13/20."
      },
      {
        "id": 35,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Two circles show 1/4 and 1/2. What is the sum of these fractions?",
        "options": [
          "2/6",
          "3/4",
          "5/6",
          "2/4"
        ],
        "answer": 1,
        "hint": "Rewrite 1/2 as fourths, then add.",
        "explain": "1/4 + 1/2 = 1/4 + 2/4 = 3/4."
      },
      {
        "id": 36,
        "domain": "6.NOS",
        "type": "mc",
        "text": "On a number line from 0 to 5, four points A, B, C, D are marked. Point C lies between 3 and 4 at 3.7. Which point represents 3.7?",
        "options": [
          "Point A",
          "Point B",
          "Point C",
          "Point D"
        ],
        "answer": 2,
        "hint": "3.7 is between 3 and 4, closer to 4.",
        "explain": "3.7 lies just past 3, between 3 and 4 — that is Point C."
      },
      {
        "id": 37,
        "domain": "6.DS",
        "type": "mc",
        "text": "Test scores: Alex 85, Beth 92, Carl 78, Dana 88. What is the difference between the highest and lowest scores?",
        "options": [
          "10 points",
          "12 points",
          "14 points",
          "16 points"
        ],
        "answer": 2,
        "hint": "Subtract the smallest score from the largest.",
        "explain": "Highest 92 − lowest 78 = 14 points."
      },
      {
        "id": 38,
        "domain": "6.AT",
        "type": "mc",
        "text": "On a map, 2 inches represents 15 miles. If two cities are 5.5 inches apart, what is the actual distance?",
        "options": [
          "37.5 miles",
          "41.25 miles",
          "45.0 miles",
          "48.5 miles"
        ],
        "answer": 1,
        "hint": "Set up a proportion of inches to miles and solve for the unknown distance.",
        "explain": "Proportion 2/15 = 5.5/x → 2x = 82.5 → x = 41.25 miles."
      },
      {
        "id": 39,
        "domain": "6.GR",
        "type": "fr",
        "text": "A delivery truck's path on a grid (each square = 1 mile) goes: right 5, up 3, left 3, up 1, right 4. What is the total distance traveled?",
        "answer": "16",
        "accept": [
          "16",
          "16 miles"
        ],
        "hint": "Add the lengths of every segment of the path.",
        "explain": "5 + 3 + 3 + 1 + 4 = 16 miles total."
      },
      {
        "id": 40,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Which point is in Quadrant III? A(4, 3), B(−2, 5), C(−3, −4), D(6, −1).",
        "options": [
          "Point A",
          "Point B",
          "Point C",
          "Point D"
        ],
        "answer": 2,
        "hint": "Quadrant III is where x and y are both negative.",
        "explain": "Quadrant III has both coordinates negative; only C(−3, −4) qualifies."
      }
    ]
  },
  {
    "num": 3,
    "storageKey": "mcapPracticeTest_3_v1",
    "questions": [
      {
        "id": 1,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A baker used 3/8 of a bag of flour in the morning and 1/4 in the afternoon. What fraction of the bag remains unused?",
        "options": [
          "1/8",
          "3/8",
          "5/8",
          "3/4"
        ],
        "answer": 1,
        "hint": "Add the parts used, then subtract from the whole (1).",
        "explain": "Used 3/8 + 1/4 = 3/8 + 2/8 = 5/8; remaining = 1 − 5/8 = 3/8."
      },
      {
        "id": 2,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A farmer buys seed bags for $18 each and sells the crop from each for $32. Using 90 bags, what was the total profit?",
        "options": [
          "$900",
          "$1,080",
          "$1,260",
          "$1,350"
        ],
        "answer": 2,
        "hint": "Find the profit on one bag first, then multiply by 90.",
        "explain": "Profit per bag = 32 − 18 = $14; 90 × 14 = $1,260."
      },
      {
        "id": 3,
        "domain": "6.AT",
        "type": "mc",
        "text": "A graph shows Mia's walking distance over time. At 5 hours, the distance reads 3.5 km. How many kilometers did Mia walk in the first 5 hours?",
        "options": [
          "2.5 km",
          "3.0 km",
          "3.5 km",
          "4.0 km"
        ],
        "answer": 2,
        "hint": "Find 5 hours on the time axis and read the matching distance.",
        "explain": "Read the graph at 5 hours: 3.5 km."
      },
      {
        "id": 4,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A bar model shows 96 pencils divided equally into 4 boxes. How many pencils are in each box?",
        "options": [
          "22 pencils",
          "24 pencils",
          "26 pencils",
          "28 pencils"
        ],
        "answer": 1,
        "hint": "Divide the total by the number of equal boxes.",
        "explain": "96 ÷ 4 = 24 pencils per box."
      },
      {
        "id": 5,
        "domain": "6.GR",
        "type": "mc",
        "text": "A right-triangle flower bed has legs of 9 m and 5 m. What is its area?",
        "options": [
          "18 m²",
          "22.5 m²",
          "30 m²",
          "45 m²"
        ],
        "answer": 1,
        "hint": "For a right triangle, use the two legs as base and height: 1/2 × base × height.",
        "explain": "Area = 1/2 × 9 × 5 = 22.5 m²."
      },
      {
        "id": 6,
        "domain": "6.DS",
        "type": "mc",
        "text": "A stem-and-leaf plot lists reading minutes: 25, 28, 31, 34, 36, 39, 42, 45, 47, 48, 49, 50, 53, 56. What is the median?",
        "options": [
          "39",
          "42",
          "43.5",
          "47"
        ],
        "answer": 2,
        "hint": "With an even number of values, average the two middle values.",
        "explain": "With 14 values, average the 7th and 8th: (42 + 45) ÷ 2 = 43.5 minutes."
      },
      {
        "id": 7,
        "domain": "6.AT",
        "type": "mc",
        "text": "A balance scale shows three identical boxes plus 5 pounds balancing with 23 pounds. What is the weight of one box?",
        "options": [
          "4 pounds",
          "5 pounds",
          "6 pounds",
          "7 pounds"
        ],
        "answer": 2,
        "hint": "Write an equation: 3 boxes plus 5 equals 23. Solve for one box.",
        "explain": "3x + 5 = 23 → 3x = 18 → x = 6 pounds."
      },
      {
        "id": 8,
        "domain": "6.NOS",
        "type": "mc",
        "text": "On a number line marked 0, 2, 4, 6, 8, point Q sits halfway between 4 and 6. What number does Q represent?",
        "options": [
          "4",
          "4.5",
          "5",
          "5.5"
        ],
        "answer": 2,
        "hint": "The midpoint of 4 and 6 is their average.",
        "explain": "Halfway between 4 and 6 is 5."
      },
      {
        "id": 9,
        "domain": "6.NOS",
        "type": "mc",
        "text": "In an election, 3/5 of students voted for Candidate A and 1/4 for Candidate B. What fraction voted for either A or B?",
        "options": [
          "4/9",
          "13/20",
          "17/20",
          "9/10"
        ],
        "answer": 2,
        "hint": "Use a common denominator of 20 before adding.",
        "explain": "3/5 = 12/20 and 1/4 = 5/20, so 12/20 + 5/20 = 17/20."
      },
      {
        "id": 10,
        "domain": "6.GR",
        "type": "mc",
        "text": "In a triangle, two angles are 45° and 60°. Find the measure of angle x.",
        "options": [
          "65°",
          "70°",
          "75°",
          "80°"
        ],
        "answer": 2,
        "hint": "The three angles of a triangle add up to 180°.",
        "explain": "Angles of a triangle sum to 180°: x = 180 − 45 − 60 = 75°."
      },
      {
        "id": 11,
        "domain": "6.DS",
        "type": "mc",
        "text": "Books sold over five days: Mon 25, Tue 30, Wed 35, Thu 20, Fri 40. What is the mean number of books sold per day?",
        "options": [
          "28 books",
          "30 books",
          "32 books",
          "35 books"
        ],
        "answer": 1,
        "hint": "Add the daily totals and divide by 5.",
        "explain": "Sum = 150; 150 ÷ 5 = 30 books per day."
      },
      {
        "id": 12,
        "domain": "6.AT",
        "type": "mc",
        "text": "What is the value of 5³ − 4 × 6 + 8?",
        "options": [
          "101",
          "107",
          "109",
          "125"
        ],
        "answer": 2,
        "hint": "Do the exponent and multiplication before adding and subtracting.",
        "explain": "5³ = 125; 4 × 6 = 24; 125 − 24 + 8 = 109."
      },
      {
        "id": 13,
        "domain": "6.AT",
        "type": "mc",
        "text": "A store offers 25% off all items. If a jacket originally costs $80, what is the sale price?",
        "options": [
          "$55",
          "$60",
          "$65",
          "$70"
        ],
        "answer": 1,
        "hint": "Find the discount amount, then subtract it from the original price.",
        "explain": "Discount = 0.25 × 80 = $20; sale price = 80 − 20 = $60."
      },
      {
        "id": 14,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Points P, Q, R, S are on a coordinate plane. Point S is at (1, −1). Which point is located in Quadrant IV?",
        "options": [
          "Point P",
          "Point Q",
          "Point R",
          "Point S"
        ],
        "answer": 3,
        "hint": "Quadrant IV is where x is positive and y is negative.",
        "explain": "Quadrant IV has x > 0 and y < 0; S(1, −1) fits, so Point S."
      },
      {
        "id": 15,
        "domain": "6.NOS",
        "type": "fr",
        "text": "A recipe calls for 2 1/3 cups of flour. If you make half the recipe, how many cups of flour do you need?",
        "answer": "7/6",
        "accept": [
          "7/6",
          "1 1/6",
          "1 1/6 cups",
          "1.1667",
          "1.17"
        ],
        "hint": "Half of an amount means multiply by 1/2 (after making it improper).",
        "explain": "2 1/3 = 7/3; half = 7/3 × 1/2 = 7/6 = 1 1/6 cups."
      },
      {
        "id": 16,
        "domain": "6.AT",
        "type": "mc",
        "text": "Which expression is equivalent to 3(2x − 4) + 5x?",
        "options": [
          "11x − 4",
          "11x − 12",
          "8x − 4",
          "8x − 12"
        ],
        "answer": 1,
        "hint": "Distribute the 3 first, then combine like terms.",
        "explain": "3(2x − 4) = 6x − 12; add 5x → 11x − 12."
      },
      {
        "id": 17,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A movie starts at 1:45 PM and lasts 2 hours and 30 minutes. What time does it end?",
        "options": [
          "4:05 PM",
          "4:15 PM",
          "4:25 PM",
          "4:35 PM"
        ],
        "answer": 1,
        "hint": "Add the hours first, then the minutes.",
        "explain": "1:45 + 2 hours = 3:45; + 30 minutes = 4:15 PM."
      },
      {
        "id": 18,
        "domain": "6.AT",
        "type": "mc",
        "text": "A table shows ticket costs: 2 tickets $18, 4 tickets $36, 6 tickets $54. Based on the pattern, what is the cost for 8 tickets?",
        "options": [
          "$64",
          "$68",
          "$72",
          "$76"
        ],
        "answer": 2,
        "hint": "Find the cost of one ticket, then multiply by 8.",
        "explain": "Each ticket costs 18 ÷ 2 = $9; 8 × 9 = $72."
      },
      {
        "id": 19,
        "domain": "6.NOS",
        "type": "mc",
        "text": "What is the greatest common factor (GCF) of 36 and 60?",
        "options": [
          "6",
          "12",
          "18",
          "24"
        ],
        "answer": 1,
        "hint": "Find the largest number that divides both 36 and 60.",
        "explain": "36 = 2²×3², 60 = 2²×3×5; common factors 2²×3 = 12."
      },
      {
        "id": 20,
        "domain": "6.DS",
        "type": "mc",
        "text": "A number cube labeled 1–6 is rolled once. What is the probability of rolling an even number?",
        "options": [
          "1/6",
          "1/3",
          "1/2",
          "2/3"
        ],
        "answer": 2,
        "hint": "Count the even faces, then divide by the total of 6 faces.",
        "explain": "Even numbers 2, 4, 6 are 3 of 6 outcomes: 3/6 = 1/2."
      },
      {
        "id": 21,
        "domain": "6.AT",
        "type": "mc",
        "text": "Solve for x: x/5 + 7 = 15",
        "options": [
          "30",
          "35",
          "40",
          "45"
        ],
        "answer": 2,
        "hint": "Undo the +7 first, then undo the division by 5.",
        "explain": "Subtract 7: x/5 = 8; multiply by 5: x = 40."
      },
      {
        "id": 22,
        "domain": "6.GR",
        "type": "fr",
        "text": "A rectangular prism has length 10 cm, width 6 cm, and height 4 cm. What is the volume?",
        "answer": "240",
        "accept": [
          "240",
          "240 cm3",
          "240 cm³",
          "240 cubic cm"
        ],
        "hint": "Volume of a box = length × width × height.",
        "explain": "Volume = 10 × 6 × 4 = 240 cm³."
      },
      {
        "id": 23,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Convert 3.75 to a mixed number in simplest form.",
        "options": [
          "3 1/2",
          "3 3/4",
          "3 7/10",
          "3 4/5"
        ],
        "answer": 1,
        "hint": "Keep the whole number 3, and turn 0.75 into a simplified fraction.",
        "explain": "3.75 = 3 + 75/100 = 3 + 3/4 = 3 3/4."
      },
      {
        "id": 24,
        "domain": "6.NOS",
        "type": "mc",
        "text": "An array has 7 columns and 5 rows. How many total squares are in the array?",
        "options": [
          "30",
          "32",
          "35",
          "40"
        ],
        "answer": 2,
        "hint": "Multiply the number of rows by the number of columns.",
        "explain": "7 × 5 = 35 squares."
      },
      {
        "id": 25,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A train departs at 10:45 AM and the journey takes 3 hours 25 minutes. What time does it arrive?",
        "options": [
          "1:10 PM",
          "1:55 PM",
          "2:10 PM",
          "2:25 PM"
        ],
        "answer": 2,
        "hint": "Add the hours first, then add the minutes.",
        "explain": "10:45 + 3 hours = 1:45 PM; + 25 minutes = 2:10 PM."
      },
      {
        "id": 26,
        "domain": "6.DS",
        "type": "mc",
        "text": "A dot plot shows quiz scores: score 8 has 5 dots, score 9 has 3 dots, score 10 has 1 dot. How many students scored 8 or higher?",
        "options": [
          "7 students",
          "8 students",
          "9 students",
          "10 students"
        ],
        "answer": 2,
        "hint": "Add the dots above 8, 9, and 10.",
        "explain": "5 + 3 + 1 = 9 students scored 8 or higher."
      },
      {
        "id": 27,
        "domain": "6.GR",
        "type": "fr",
        "text": "A square has a side length of 9 inches. What is the area of the square?",
        "answer": "81",
        "accept": [
          "81",
          "81 in2",
          "81 in²",
          "81 square inches"
        ],
        "hint": "Square area = side × side.",
        "explain": "Area of a square = side² = 9² = 81 square inches."
      },
      {
        "id": 28,
        "domain": "6.AT",
        "type": "mc",
        "text": "Which number is equivalent to 2⁵?",
        "options": [
          "10",
          "16",
          "25",
          "32"
        ],
        "answer": 3,
        "hint": "2⁵ means multiply five 2's together.",
        "explain": "2⁵ = 2×2×2×2×2 = 32."
      },
      {
        "id": 29,
        "domain": "6.AT",
        "type": "mc",
        "text": "A store sells apples for $1.20 per pound. If you buy 3.5 pounds, how much will you pay?",
        "options": [
          "$3.60",
          "$4.00",
          "$4.20",
          "$4.40"
        ],
        "answer": 2,
        "hint": "Multiply the price per pound by the number of pounds.",
        "explain": "1.20 × 3.5 = $4.20."
      },
      {
        "id": 30,
        "domain": "6.DS",
        "type": "mc",
        "text": "A line plot of pets owned shows six marks above the number 2. How many students have exactly 2 pets?",
        "options": [
          "3 students",
          "4 students",
          "5 students",
          "6 students"
        ],
        "answer": 3,
        "hint": "Count the marks stacked above 2.",
        "explain": "Six marks above 2 means six students have exactly 2 pets."
      },
      {
        "id": 31,
        "domain": "6.AT",
        "type": "mc",
        "text": "A number line has an open circle at 3 with the ray pointing right. Which inequality is shown?",
        "options": [
          "x < 3",
          "x > 3",
          "x ≤ 3",
          "x ≥ 3"
        ],
        "answer": 1,
        "hint": "Open circle = strict inequality; arrow direction shows greater or less.",
        "explain": "An open circle means 'not included'; the ray to the right means greater than: x > 3."
      },
      {
        "id": 32,
        "domain": "6.GR",
        "type": "fr",
        "text": "Two angles are complementary. One angle measures 22°. What is the measure of the other angle?",
        "answer": "68",
        "accept": [
          "68",
          "68°",
          "68 degrees"
        ],
        "hint": "Complementary angles add to 90°.",
        "explain": "Complementary angles sum to 90°: 90 − 22 = 68°."
      },
      {
        "id": 33,
        "domain": "6.AT",
        "type": "mc",
        "text": "A bakery sells muffins for $2.25 and cookies for $1.50. One morning it sold 6 muffins and 10 cookies. How much did the bakery earn in total?",
        "options": [
          "$25.50",
          "$27.00",
          "$28.50",
          "$30.00"
        ],
        "answer": 2,
        "hint": "Find the muffin total and cookie total, then add.",
        "explain": "Muffins 6 × 2.25 = $13.50; cookies 10 × 1.50 = $15.00; total $28.50."
      },
      {
        "id": 34,
        "domain": "6.AT",
        "type": "mc",
        "text": "At a camp, 40% of campers are boys. The ratio of boys who play soccer to basketball is 2:3. If 90 boys play basketball, how many campers are there in total?",
        "options": [
          "300",
          "320",
          "350",
          "375"
        ],
        "answer": 3,
        "hint": "Find the value of one ratio part, total the boys, then use the 40% to find all campers.",
        "explain": "3 parts = 90, so 1 part = 30; total boys = 5 × 30 = 150; boys are 40% of campers, so total = 150 ÷ 0.40 = 375."
      },
      {
        "id": 35,
        "domain": "6.NOS",
        "type": "mc",
        "text": "An analog clock shows the hour hand between 8 and 9 and the minute hand on 7 (35 minutes). Which digital time matches? (A 7:35, B 8:30, C 8:35, D 9:35)",
        "options": [
          "Clock A",
          "Clock B",
          "Clock C",
          "Clock D"
        ],
        "answer": 2,
        "hint": "The hour shown is the smaller number the hour hand has passed; minute hand on 7 means 35 minutes.",
        "explain": "Hour hand between 8 and 9 with minute hand on 7 means 8:35 — Clock C."
      },
      {
        "id": 36,
        "domain": "6.AT",
        "type": "fr",
        "text": "Emily already saved $15 and saves an equal amount each week. After 5 weeks she will have $65. How much does she save each week?",
        "answer": "10",
        "accept": [
          "10",
          "$10",
          "10 dollars"
        ],
        "hint": "Subtract the starting $15 from $65, then divide by 5 weeks.",
        "explain": "15 + 5x = 65 → 5x = 50 → x = $10 per week."
      },
      {
        "id": 37,
        "domain": "6.AT",
        "type": "mc",
        "text": "A school has $1,200 for sports equipment: Soccer Balls 30% ($360), Basketballs 25% (?), Volleyballs 20% ($240), Other 25% ($300). How much was spent on soccer balls and basketballs combined?",
        "options": [
          "$600",
          "$620",
          "$640",
          "$660"
        ],
        "answer": 3,
        "hint": "Find the basketball amount (25% of $1,200), then add the soccer ball amount.",
        "explain": "Basketballs = 25% × 1200 = $300; soccer + basketball = 360 + 300 = $660."
      },
      {
        "id": 38,
        "domain": "6.GR",
        "type": "mc",
        "text": "Point R is at (2, 5) and point S is at (2, −3). What is the distance between R and S?",
        "options": [
          "6 units",
          "7 units",
          "8 units",
          "9 units"
        ],
        "answer": 2,
        "hint": "When points share an x-value, subtract the y-values (watch the signs).",
        "explain": "Same x-value means a vertical segment: |5 − (−3)| = 8 units."
      },
      {
        "id": 39,
        "domain": "6.DS",
        "type": "fr",
        "text": "After-school club enrollment: Art 24, Music 36, Drama 18, Sports 42. What percent of students are enrolled in the Music club?",
        "answer": "30",
        "accept": [
          "30",
          "30%",
          "30 percent"
        ],
        "hint": "Find the total enrollment, then write Music as a percent of it.",
        "explain": "Total = 24 + 36 + 18 + 42 = 120; Music 36/120 = 0.30 = 30%."
      },
      {
        "id": 40,
        "domain": "6.GR",
        "type": "mc",
        "text": "A trapezoid has parallel sides of 8 cm and 12 cm and a height of 5 cm. What is its area?",
        "options": [
          "40 cm²",
          "50 cm²",
          "60 cm²",
          "100 cm²"
        ],
        "answer": 1,
        "hint": "Trapezoid area = 1/2 × (base1 + base2) × height.",
        "explain": "Area = 1/2 × (8 + 12) × 5 = 1/2 × 20 × 5 = 50 cm²."
      }
    ]
  },
  {
    "num": 4,
    "storageKey": "mcapPracticeTest_4_v1",
    "questions": [
      {
        "id": 1,
        "domain": "6.NOS",
        "type": "mc",
        "text": "What is the value of |−9|?",
        "options": [
          "−9",
          "9",
          "−1/9",
          "1/9"
        ],
        "answer": 1,
        "hint": "Absolute value gives the distance from 0, which is never negative.",
        "explain": "Absolute value is distance from zero, always nonnegative: |−9| = 9."
      },
      {
        "id": 2,
        "domain": "6.DS",
        "type": "mc",
        "text": "A box has 4 red, 6 yellow, and 5 blue cards. If one card is drawn, what is the probability it is yellow?",
        "options": [
          "2/5",
          "1/3",
          "1/2",
          "3/5"
        ],
        "answer": 0,
        "hint": "Probability = yellow cards ÷ total cards.",
        "explain": "Total = 15; yellow = 6, so P(yellow) = 6/15 = 2/5."
      },
      {
        "id": 3,
        "domain": "6.AT",
        "type": "mc",
        "text": "Popcorn prices: Small 8 oz $4.00, Medium 12 oz $5.40, Large 16 oz $6.40. Which size gives the most popcorn per dollar?",
        "options": [
          "Small (2.0 oz/$)",
          "Medium (2.2 oz/$)",
          "Large (2.5 oz/$)",
          "All equal value"
        ],
        "answer": 2,
        "hint": "Divide ounces by price for each size and compare.",
        "explain": "Small 8/4 = 2.0; Medium 12/5.4 ≈ 2.22; Large 16/6.4 = 2.5 oz/$. Large is best."
      },
      {
        "id": 4,
        "domain": "6.AT",
        "type": "mc",
        "text": "A school had 450 students last year and 540 this year. What is the percent increase?",
        "options": [
          "15%",
          "18%",
          "20%",
          "25%"
        ],
        "answer": 2,
        "hint": "Percent increase = (increase ÷ original) × 100.",
        "explain": "Increase = 90; 90/450 = 0.20 = 20%."
      },
      {
        "id": 5,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A coach has 60 water bottles and 84 towels and wants identical kits with none left over. What is the greatest number of kits she can make?",
        "options": [
          "6 kits",
          "8 kits",
          "12 kits",
          "15 kits"
        ],
        "answer": 2,
        "hint": "Find the greatest common factor of 60 and 84.",
        "explain": "GCF of 60 and 84 is 12, so she can make 12 identical kits."
      },
      {
        "id": 6,
        "domain": "6.GR",
        "type": "mc",
        "text": "An angle measures 76°. A ray bisects it (cuts it in half). What is the measure of each smaller angle?",
        "options": [
          "34°",
          "36°",
          "38°",
          "40°"
        ],
        "answer": 2,
        "hint": "Bisecting an angle splits it into two equal parts.",
        "explain": "Bisect means divide in half: 76 ÷ 2 = 38°."
      },
      {
        "id": 7,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A baker uses 3/4 cup of sugar per batch, divides by 2/3, then multiplies that amount by 5/6. How much sugar is needed?",
        "options": [
          "15/16 cup",
          "5/8 cup",
          "15/32 cup",
          "5/16 cup"
        ],
        "answer": 0,
        "hint": "Dividing by a fraction means multiplying by its reciprocal. Do one step at a time.",
        "explain": "3/4 ÷ 2/3 = 3/4 × 3/2 = 9/8; 9/8 × 5/6 = 45/48 = 15/16 cup."
      },
      {
        "id": 8,
        "domain": "6.GR",
        "type": "fr",
        "text": "A triangle has vertices A(2,3), B(6,3), and C(4,7). What is the area of the triangle?",
        "answer": "8",
        "accept": [
          "8",
          "8 square units",
          "8 units"
        ],
        "hint": "Use AB as the base, then find the straight-up distance from C to that line.",
        "explain": "Base AB = |6−2| = 4; height from C = |7−3| = 4; area = 1/2 × 4 × 4 = 8 square units."
      },
      {
        "id": 9,
        "domain": "6.GR",
        "type": "mc",
        "text": "A rectangular prism is 8 cm long, 5 cm wide, and 3 cm high. What is its volume?",
        "options": [
          "90 cubic cm",
          "100 cubic cm",
          "110 cubic cm",
          "120 cubic cm"
        ],
        "answer": 3,
        "hint": "Volume = length × width × height.",
        "explain": "Volume = 8 × 5 × 3 = 120 cubic cm."
      },
      {
        "id": 10,
        "domain": "6.DS",
        "type": "mc",
        "text": "Books read by five students: Alex 6, Blake 9, Casey 4, Dana 7, Emma 7. How many books did all five read in total?",
        "options": [
          "30 books",
          "33 books",
          "36 books",
          "39 books"
        ],
        "answer": 1,
        "hint": "Add the number of books each student read.",
        "explain": "6 + 9 + 4 + 7 + 7 = 33 books."
      },
      {
        "id": 11,
        "domain": "6.AT",
        "type": "mc",
        "text": "The expression 6x − 3(2x + 4) is equivalent to which of the following?",
        "options": [
          "−12",
          "0",
          "−12x",
          "12x − 12"
        ],
        "answer": 0,
        "hint": "Distribute the −3, then combine like terms.",
        "explain": "6x − 3(2x + 4) = 6x − 6x − 12 = −12."
      },
      {
        "id": 12,
        "domain": "6.DS",
        "type": "mc",
        "text": "Books sold over four months: Jan 200, Feb 180, Mar 220, Apr 250. What is the average number of books sold per month?",
        "options": [
          "200 books",
          "212.5 books",
          "215 books",
          "220 books"
        ],
        "answer": 1,
        "hint": "Add the four months and divide by 4.",
        "explain": "Sum = 850; 850 ÷ 4 = 212.5 books."
      },
      {
        "id": 13,
        "domain": "6.DS",
        "type": "mc",
        "text": "Monthly rainfall (inches): Jan 3.2, Feb 2.8, Mar 4.5, Apr 3.6, May 2.9, Jun 3.0. What is the mean monthly rainfall?",
        "options": [
          "3.0 inches",
          "3.2 inches",
          "3.3 inches",
          "3.5 inches"
        ],
        "answer": 2,
        "hint": "Add all six values and divide by 6.",
        "explain": "Sum = 20.0; 20.0 ÷ 6 ≈ 3.33 → 3.3 inches."
      },
      {
        "id": 14,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A recipe needs 2/3 cup of flour per batch. For 4 1/2 batches, how many cups of flour are needed?",
        "options": [
          "2 1/2 cups",
          "3 cups",
          "3 1/2 cups",
          "4 cups"
        ],
        "answer": 1,
        "hint": "Multiply the flour per batch by the number of batches (as an improper fraction).",
        "explain": "4 1/2 = 9/2; 2/3 × 9/2 = 18/6 = 3 cups."
      },
      {
        "id": 15,
        "domain": "6.GR",
        "type": "mc",
        "text": "A garden is 18 ft long and 12 ft wide. If the width is increased by 25%, what is the new area?",
        "options": [
          "240 square feet",
          "252 square feet",
          "270 square feet",
          "288 square feet"
        ],
        "answer": 2,
        "hint": "Increase the width by 25% first, then multiply by the length.",
        "explain": "New width = 12 × 1.25 = 15 ft; new area = 18 × 15 = 270 square feet."
      },
      {
        "id": 16,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Points P(1,2), Q(4,5), R(6,1), S(7,4) are on a plane. Which point is located at (6, 1)?",
        "options": [
          "Point P",
          "Point Q",
          "Point R",
          "Point S"
        ],
        "answer": 2,
        "hint": "Look for the point with x = 6 and y = 1.",
        "explain": "R is at (6, 1)."
      },
      {
        "id": 17,
        "domain": "6.AT",
        "type": "mc",
        "text": "A bike shop offers 15% off all bikes. If a bike originally costs $240, what is the sale price?",
        "options": [
          "$200",
          "$204",
          "$210",
          "$216"
        ],
        "answer": 1,
        "hint": "Find the discount, then subtract it from $240.",
        "explain": "Discount = 240 × 0.15 = $36; sale price = 240 − 36 = $204."
      },
      {
        "id": 18,
        "domain": "6.AT",
        "type": "fr",
        "text": "A machine produces 450 widgets in 6 hours. At this rate, how many widgets will it produce in 10 hours?",
        "answer": "750",
        "accept": [
          "750",
          "750 widgets"
        ],
        "hint": "Find the widgets per hour, then multiply by 10.",
        "explain": "Rate = 450/6 = 75 widgets per hour; 75 × 10 = 750 widgets."
      },
      {
        "id": 19,
        "domain": "6.AT",
        "type": "mc",
        "text": "Which inequality represents all values of x greater than −3 but less than or equal to 5?",
        "options": [
          "−3 < x < 5",
          "−3 < x ≤ 5",
          "−3 ≤ x < 5",
          "−3 ≤ x ≤ 5"
        ],
        "answer": 1,
        "hint": "'Greater than' is strict (<); 'less than or equal to' includes the endpoint (≤).",
        "explain": "Greater than −3 (not included) and ≤ 5 (included): −3 < x ≤ 5."
      },
      {
        "id": 20,
        "domain": "6.GR",
        "type": "mc",
        "text": "A cube has an edge length of 5 cm. What is its surface area?",
        "options": [
          "125 cm²",
          "150 cm²",
          "175 cm²",
          "200 cm²"
        ],
        "answer": 1,
        "hint": "A cube has 6 equal square faces; each face is side².",
        "explain": "Surface area = 6 × 5² = 6 × 25 = 150 cm²."
      },
      {
        "id": 21,
        "domain": "6.AT",
        "type": "mc",
        "text": "A pool holds 12,000 gallons and drains at 150 gallons per hour. How long will it take to drain completely?",
        "options": [
          "60 hours",
          "70 hours",
          "80 hours",
          "90 hours"
        ],
        "answer": 2,
        "hint": "Time = total amount ÷ rate.",
        "explain": "12,000 ÷ 150 = 80 hours."
      },
      {
        "id": 22,
        "domain": "6.DS",
        "type": "mc",
        "text": "Sports played: Basketball 12, Soccer 18, Tennis 6, Volleyball 9. Which sport represents the mode of the data?",
        "options": [
          "Basketball",
          "Soccer",
          "Tennis",
          "Volleyball"
        ],
        "answer": 1,
        "hint": "The mode is the category with the highest frequency.",
        "explain": "Soccer has the greatest count (18), so it is the mode."
      },
      {
        "id": 23,
        "domain": "6.GR",
        "type": "mc",
        "text": "A T-shaped figure: top rectangle 24 in by 6 in, vertical rectangle 8 in by 18 in, with an 8 by 6 overlap counted twice. What is the total area?",
        "options": [
          "144 square inches",
          "168 square inches",
          "240 square inches",
          "288 square inches"
        ],
        "answer": 2,
        "hint": "Add both rectangles, then subtract the overlapping region once.",
        "explain": "Top 24×6 = 144; stem 8×18 = 144; overlap 8×6 = 48; total = 144 + 144 − 48 = 240 in²."
      },
      {
        "id": 24,
        "domain": "6.AT",
        "type": "mc",
        "text": "If n = 7, what is the value of 4n − 9 + 2n?",
        "options": [
          "33",
          "35",
          "37",
          "39"
        ],
        "answer": 0,
        "hint": "Combine like terms first (4n + 2n), then substitute 7.",
        "explain": "Combine: 6n − 9; substitute n = 7: 6(7) − 9 = 42 − 9 = 33."
      },
      {
        "id": 25,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Jordan runs 3/8 of a mile Monday and 5/12 of a mile Tuesday. How many total miles did Jordan run?",
        "options": [
          "8/20 mile",
          "19/24 mile",
          "7/10 mile",
          "1 mile"
        ],
        "answer": 1,
        "hint": "Use a common denominator of 24 before adding.",
        "explain": "LCD of 8 and 12 is 24: 3/8 = 9/24, 5/12 = 10/24; sum = 19/24 mile."
      },
      {
        "id": 26,
        "domain": "6.GR",
        "type": "mc",
        "text": "A honeycomb has 7 regular hexagons, each with area 65 cm². What is the total area of all 7 hexagons?",
        "options": [
          "385 square centimeters",
          "420 square centimeters",
          "455 square centimeters",
          "490 square centimeters"
        ],
        "answer": 2,
        "hint": "Multiply the area of one hexagon by 7.",
        "explain": "7 × 65 = 455 cm²."
      },
      {
        "id": 27,
        "domain": "6.AT",
        "type": "fr",
        "text": "A number is divided by 8, then 12 is added. If the final answer is 20, what was the original number?",
        "answer": "64",
        "accept": [
          "64"
        ],
        "hint": "Work backward: undo the +12 first, then undo the ÷8.",
        "explain": "x/8 + 12 = 20 → x/8 = 8 → x = 64."
      },
      {
        "id": 28,
        "domain": "6.DS",
        "type": "mc",
        "text": "Distances on 1 gallon: Car A 28.5, Car B 32.0, Car C 30.5, Car D 29.0, Car E 31.5 miles. What is the median distance?",
        "options": [
          "29.0 miles",
          "30.0 miles",
          "30.5 miles",
          "31.0 miles"
        ],
        "answer": 2,
        "hint": "Put the five distances in order and pick the middle one.",
        "explain": "In order: 28.5, 29.0, 30.5, 31.5, 32.0; middle value = 30.5 miles."
      },
      {
        "id": 29,
        "domain": "6.AT",
        "type": "mc",
        "text": "If x = 4 and y = 2, what is the value of x² + 3y² − 4xy?",
        "options": [
          "−10",
          "−6",
          "−4",
          "0"
        ],
        "answer": 2,
        "hint": "Compute each term carefully, then combine.",
        "explain": "16 + 3(4) − 4(4)(2) = 16 + 12 − 32 = −4."
      },
      {
        "id": 30,
        "domain": "6.GR",
        "type": "mc",
        "text": "A pinwheel is made of 4 identical right triangles, each with legs 9 cm and 12 cm. What is the total area of the pinwheel?",
        "options": [
          "108 square centimeters",
          "162 square centimeters",
          "216 square centimeters",
          "432 square centimeters"
        ],
        "answer": 2,
        "hint": "Find one triangle's area, then multiply by 4.",
        "explain": "One triangle = 1/2 × 9 × 12 = 54 cm²; 4 × 54 = 216 cm²."
      },
      {
        "id": 31,
        "domain": "6.DS",
        "type": "mc",
        "text": "A double bar graph shows January sales: Store A 120 books, Store B 100 books. How many more books did Store A sell than Store B?",
        "options": [
          "15 books",
          "20 books",
          "25 books",
          "30 books"
        ],
        "answer": 1,
        "hint": "Subtract Store B's January value from Store A's.",
        "explain": "120 − 100 = 20 more books."
      },
      {
        "id": 32,
        "domain": "6.AT",
        "type": "mc",
        "text": "A group must weigh at least 180 pounds. Three friends weigh 150 pounds together. What is the minimum weight x a fourth friend must have?",
        "options": [
          "x ≥ 25",
          "x ≥ 30",
          "x ≥ 35",
          "x ≥ 40"
        ],
        "answer": 1,
        "hint": "Set up '150 plus the fourth weight is at least 180' and solve.",
        "explain": "150 + x ≥ 180 → x ≥ 30."
      },
      {
        "id": 33,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A painter uses 3 1/2 gallons to cover a whole wall. To paint only 3/5 of the wall, how many gallons are needed?",
        "options": [
          "2 1/10 gallons",
          "2 3/10 gallons",
          "2 1/5 gallons",
          "2 2/5 gallons"
        ],
        "answer": 0,
        "hint": "Multiply the full-wall amount by 3/5.",
        "explain": "3 1/2 = 7/2; 7/2 × 3/5 = 21/10 = 2 1/10 gallons."
      },
      {
        "id": 34,
        "domain": "6.GR",
        "type": "mc",
        "text": "Triangle XYZ has vertices X(2,1), Y(7,1), Z(2,5). What is the area of triangle XYZ?",
        "options": [
          "8 square units",
          "9 square units",
          "10 square units",
          "12.5 square units"
        ],
        "answer": 2,
        "hint": "Use the horizontal side as base and the vertical side as height.",
        "explain": "Base XY = |7−2| = 5; height XZ = |5−1| = 4; area = 1/2 × 5 × 4 = 10 square units."
      },
      {
        "id": 35,
        "domain": "6.AT",
        "type": "mc",
        "text": "A model race car is built to a scale of 1:32. If the model is 6 inches long, what is the actual car's length in feet?",
        "options": [
          "12 feet",
          "14 feet",
          "15 feet",
          "16 feet"
        ],
        "answer": 3,
        "hint": "Multiply by 32 for inches, then convert inches to feet (÷12).",
        "explain": "Actual = 32 × 6 = 192 inches; 192 ÷ 12 = 16 feet."
      },
      {
        "id": 36,
        "domain": "6.AT",
        "type": "mc",
        "text": "On a 40-question test, Emma answered 30 correctly. What percentage did she get wrong?",
        "options": [
          "20%",
          "25%",
          "30%",
          "35%"
        ],
        "answer": 1,
        "hint": "Find how many she missed, then write that as a percent of 40.",
        "explain": "Missed = 40 − 30 = 10; 10/40 = 1/4 = 25%."
      },
      {
        "id": 37,
        "domain": "6.GR",
        "type": "mc",
        "text": "A U-shaped metal piece: outer rectangle 20 m by 14 m with an inner cut-out of 14 m by 8 m. What is the area of the U-shaped piece?",
        "options": [
          "112 square meters",
          "126 square meters",
          "168 square meters",
          "280 square meters"
        ],
        "answer": 2,
        "hint": "Subtract the cut-out area from the full outer rectangle.",
        "explain": "Outer 20×14 = 280; cut-out 14×8 = 112; area = 280 − 112 = 168 m²."
      },
      {
        "id": 38,
        "domain": "6.DS",
        "type": "mc",
        "text": "Points scored in six games: 78, 85, 72, 90, 81, 84. What is the median number of points?",
        "options": [
          "81 points",
          "82.5 points",
          "83 points",
          "84 points"
        ],
        "answer": 1,
        "hint": "Order the values and average the two middle ones.",
        "explain": "In order: 72, 78, 81, 84, 85, 90; median = (81 + 84)/2 = 82.5."
      },
      {
        "id": 39,
        "domain": "6.AT",
        "type": "mc",
        "text": "A store sold 240 items on Monday, which was 60% of the items sold on Sunday. How many items were sold on Sunday?",
        "options": [
          "360 items",
          "380 items",
          "400 items",
          "420 items"
        ],
        "answer": 2,
        "hint": "240 is 60% of Sunday's total. Divide by 0.60 to find the whole.",
        "explain": "0.60x = 240 → x = 240 ÷ 0.60 = 400 items."
      },
      {
        "id": 40,
        "domain": "6.GR",
        "type": "mc",
        "text": "A net shows a box 6 in long, 4 in wide, 3 in tall. What is the total surface area of the box?",
        "options": [
          "72 square inches",
          "96 square inches",
          "108 square inches",
          "120 square inches"
        ],
        "answer": 2,
        "hint": "Add the areas of all 6 faces (three pairs of matching faces).",
        "explain": "2(6×4) + 2(6×3) + 2(4×3) = 48 + 36 + 24 = 108 in²."
      }
    ]
  },
  {
    "num": 5,
    "storageKey": "mcapPracticeTest_5_v1",
    "questions": [
      {
        "id": 1,
        "domain": "6.AT",
        "type": "mc",
        "text": "A pizza is divided into equal slices. The shaded (eaten) part is 25% of the pizza. What percentage is NOT eaten?",
        "options": [
          "25%",
          "40%",
          "60%",
          "75%"
        ],
        "answer": 3,
        "hint": "The whole pizza is 100%. Subtract the eaten part.",
        "explain": "Not eaten = 100% − 25% = 75%."
      },
      {
        "id": 2,
        "domain": "6.AT",
        "type": "mc",
        "text": "A survey of 200 students: Math 35%, Science 28%, English 22%, History 15%. How many more students chose Math than History?",
        "options": [
          "35 students",
          "40 students",
          "45 students",
          "50 students"
        ],
        "answer": 1,
        "hint": "Find each count from its percent, then subtract.",
        "explain": "Math = 0.35 × 200 = 70; History = 0.15 × 200 = 30; 70 − 30 = 40 students."
      },
      {
        "id": 3,
        "domain": "6.AT",
        "type": "fr",
        "text": "Simplify the expression: 4x + 8 − 2x + 3",
        "answer": "2x+11",
        "accept": [
          "2x+11",
          "2x + 11"
        ],
        "hint": "Group the x-terms together and the numbers together.",
        "explain": "Combine like terms: 4x − 2x = 2x and 8 + 3 = 11, giving 2x + 11."
      },
      {
        "id": 4,
        "domain": "6.DS",
        "type": "mc",
        "text": "A bar graph shows how 150 students travel to school; the Walk bar reaches 2 on a scale where each unit = 10 students. How many students walk?",
        "options": [
          "10",
          "12",
          "15",
          "20"
        ],
        "answer": 3,
        "hint": "Multiply the bar's height by what each unit represents.",
        "explain": "2 units × 10 students = 20 students walk."
      },
      {
        "id": 5,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: 3 1/2 − 1 3/4 + 2 1/8",
        "options": [
          "3 7/8",
          "3 5/8",
          "4 1/8",
          "4 3/8"
        ],
        "answer": 0,
        "hint": "Convert all to improper fractions with denominator 8, then combine.",
        "explain": "Use eighths: 28/8 − 14/8 + 17/8 = 31/8 = 3 7/8."
      },
      {
        "id": 6,
        "domain": "6.AT",
        "type": "fr",
        "text": "Solve for y: y/3 + 7 = 15",
        "answer": "24",
        "accept": [
          "24",
          "y=24",
          "y = 24"
        ],
        "hint": "Undo the +7, then undo the division by 3.",
        "explain": "Subtract 7: y/3 = 8; multiply by 3: y = 24."
      },
      {
        "id": 7,
        "domain": "6.AT",
        "type": "mc",
        "text": "A laptop costs $800, marked down 20%, then an extra 10% off the sale price. What is the final price?",
        "options": [
          "$560",
          "$576",
          "$592",
          "$608"
        ],
        "answer": 1,
        "hint": "Take the first discount, then take the second discount on the new price.",
        "explain": "After 20%: 800 − 160 = $640; after 10%: 640 − 64 = $576."
      },
      {
        "id": 8,
        "domain": "6.DS",
        "type": "mc",
        "text": "Test scores: 78, 82, 95, 88, 91, 79, 85, 92. What is the range of these scores?",
        "options": [
          "13",
          "15",
          "17",
          "19"
        ],
        "answer": 2,
        "hint": "Range = highest score minus lowest score.",
        "explain": "Range = 95 − 78 = 17."
      },
      {
        "id": 9,
        "domain": "6.GR",
        "type": "mc",
        "text": "A 24 cm by 16 cm rectangle is cut into squares with side 4 cm. How many squares can be made?",
        "options": [
          "16 squares",
          "20 squares",
          "24 squares",
          "28 squares"
        ],
        "answer": 2,
        "hint": "Find how many squares fit across and down, then multiply.",
        "explain": "24÷4 = 6 across, 16÷4 = 4 down, so 6 × 4 = 24 squares."
      },
      {
        "id": 10,
        "domain": "6.GR",
        "type": "mc",
        "text": "A shaded figure splits into a rectangle (11 by 8) and a right triangle (base 6, height 4). What is the area of the figure?",
        "options": [
          "92 cm²",
          "96 cm²",
          "100 cm²",
          "104 cm²"
        ],
        "answer": 2,
        "hint": "Find each shape's area, then add.",
        "explain": "Rectangle 11×8 = 88; triangle 1/2×6×4 = 12; total 88 + 12 = 100 cm²."
      },
      {
        "id": 11,
        "domain": "6.AT",
        "type": "mc",
        "text": "The ratio of apples to oranges is 5:3. If there are 240 pieces of fruit total, how many more apples are there than oranges?",
        "options": [
          "50",
          "60",
          "70",
          "80"
        ],
        "answer": 1,
        "hint": "Find the value of one ratio part, then compare apples and oranges.",
        "explain": "5x + 3x = 240 → x = 30; apples 150, oranges 90; difference = 60."
      },
      {
        "id": 12,
        "domain": "6.AT",
        "type": "mc",
        "text": "A number is multiplied by 4, then 15 is added. The final answer is 47. What is the original number?",
        "options": [
          "6",
          "7",
          "8",
          "9"
        ],
        "answer": 2,
        "hint": "Undo the +15 first, then undo the ×4.",
        "explain": "4x + 15 = 47 → 4x = 32 → x = 8."
      },
      {
        "id": 13,
        "domain": "6.AT",
        "type": "fr",
        "text": "Calculate: 2⁴ + 3³ − 5²",
        "answer": "18",
        "accept": [
          "18"
        ],
        "hint": "Evaluate each power first, then add and subtract.",
        "explain": "2⁴ = 16, 3³ = 27, 5² = 25; 16 + 27 − 25 = 18."
      },
      {
        "id": 14,
        "domain": "6.GR",
        "type": "mc",
        "text": "What is the surface area of a rectangular prism with length 8 m, width 4 m, and height 5 m?",
        "options": [
          "184 m²",
          "230 m²",
          "236 m²",
          "250 m²"
        ],
        "answer": 0,
        "hint": "Surface area = 2(lw + lh + wh).",
        "explain": "SA = 2(8×4 + 8×5 + 4×5) = 2(32 + 40 + 20) = 2(92) = 184 m²."
      },
      {
        "id": 15,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Maria has 2 1/3 yards of fabric and uses 3/4 of it to make a dress. How many yards does she have left?",
        "options": [
          "7/12 yards",
          "5/8 yards",
          "7/8 yards",
          "1 1/12 yards"
        ],
        "answer": 0,
        "hint": "Find the amount used, then subtract it from the total.",
        "explain": "2 1/3 = 7/3; used 3/4 × 7/3 = 7/4; left = 7/3 − 7/4 = 28/12 − 21/12 = 7/12 yards."
      },
      {
        "id": 16,
        "domain": "6.NOS",
        "type": "mc",
        "text": "In a 6-hour (360-minute) session: Emma spends 2/3 reading, Carlos spends 1/4 on practice. How many more minutes did Emma read than Carlos practiced?",
        "options": [
          "120 minutes",
          "150 minutes",
          "180 minutes",
          "210 minutes"
        ],
        "answer": 1,
        "hint": "Convert the session to minutes, find each amount, then subtract.",
        "explain": "Emma 2/3 × 360 = 240; Carlos 1/4 × 360 = 90; difference = 150 minutes."
      },
      {
        "id": 17,
        "domain": "6.AT",
        "type": "mc",
        "text": "Jason has $45. Each book costs $8 and he also wants a $5 bookmark. What is the maximum number of books he can buy?",
        "options": [
          "4 books",
          "5 books",
          "6 books",
          "7 books"
        ],
        "answer": 1,
        "hint": "Subtract the bookmark cost, then see how many $8 books fit.",
        "explain": "8n + 5 ≤ 45 → 8n ≤ 40 → n ≤ 5; at most 5 books."
      },
      {
        "id": 18,
        "domain": "6.DS",
        "type": "mc",
        "text": "Heights (inches): 72, 75, 68, 71, 74, 69, 73. What is the median height?",
        "options": [
          "71 inches",
          "72 inches",
          "73 inches",
          "74 inches"
        ],
        "answer": 1,
        "hint": "Order the heights and find the middle value.",
        "explain": "In order: 68, 69, 71, 72, 73, 74, 75; middle value = 72 inches."
      },
      {
        "id": 19,
        "domain": "6.DS",
        "type": "mc",
        "text": "Sports clubs: Soccer 45, Basketball 30, Baseball 55, Tennis 25, Swimming 40. How many more participated in Baseball than in Tennis and Basketball combined?",
        "options": [
          "0 students",
          "5 students",
          "10 students",
          "15 students"
        ],
        "answer": 0,
        "hint": "Add Tennis and Basketball, then compare to Baseball.",
        "explain": "Tennis + Basketball = 25 + 30 = 55; Baseball 55; difference = 0."
      },
      {
        "id": 20,
        "domain": "6.NOS",
        "type": "fr",
        "text": "A bar model shows 2/3 and 1/6. Use the model to find the sum 2/3 + 1/6.",
        "answer": "5/6",
        "accept": [
          "5/6"
        ],
        "hint": "Rewrite 2/3 with a denominator of 6, then add.",
        "explain": "2/3 = 4/6, so 4/6 + 1/6 = 5/6."
      },
      {
        "id": 21,
        "domain": "6.AT",
        "type": "mc",
        "text": "In a survey of 250 students, 60% like pizza, and 40% of those also like hamburgers. How many students like both?",
        "options": [
          "50 students",
          "60 students",
          "70 students",
          "80 students"
        ],
        "answer": 1,
        "hint": "Find the pizza group first, then take 40% of that group.",
        "explain": "Pizza lovers = 0.60 × 250 = 150; both = 0.40 × 150 = 60 students."
      },
      {
        "id": 22,
        "domain": "6.GR",
        "type": "mc",
        "text": "On a protractor, ray BA aligns with 180° and ray BC aligns with 125°. What is the measure of angle ABC?",
        "options": [
          "45°",
          "55°",
          "65°",
          "75°"
        ],
        "answer": 1,
        "hint": "Subtract the two protractor readings.",
        "explain": "Angle = 180° − 125° = 55°."
      },
      {
        "id": 23,
        "domain": "6.DS",
        "type": "mc",
        "text": "A line plot has data at 0, 10, 25, and 35 minutes. Which statement is correct about the gaps?",
        "options": [
          "There is a gap from 5 to 15 minutes.",
          "There is a gap from 20 to 25 minutes.",
          "There is a gap from 30 to 40 minutes.",
          "There is a gap from 10 to 30 minutes."
        ],
        "answer": 1,
        "hint": "A gap is a range with no data points between two marked values.",
        "explain": "There are no data points between 20 and 25, so the gap is from 20 to 25 minutes."
      },
      {
        "id": 24,
        "domain": "6.AT",
        "type": "mc",
        "text": "A book's price is increased by 25%, then decreased by 20%. If the original price was $16, what is the final price?",
        "options": [
          "$15.20",
          "$16.00",
          "$16.80",
          "$17.60"
        ],
        "answer": 1,
        "hint": "Apply the 25% increase first, then take 20% off that new price.",
        "explain": "16 × 1.25 = $20; 20 − 20% of 20 = 20 − 4 = $16.00."
      },
      {
        "id": 25,
        "domain": "6.DS",
        "type": "mc",
        "text": "Temperatures (°F): Houston 78, Dallas 82, Austin 75, El Paso 88, San Antonio 77. What is the mean temperature?",
        "options": [
          "78°F",
          "80°F",
          "82°F",
          "85°F"
        ],
        "answer": 1,
        "hint": "Add the five temperatures and divide by 5.",
        "explain": "Sum = 400; 400 ÷ 5 = 80°F."
      },
      {
        "id": 26,
        "domain": "6.AT",
        "type": "mc",
        "text": "Solve for x: 2x/3 − 4 = 8",
        "options": [
          "x = 12",
          "x = 15",
          "x = 18",
          "x = 21"
        ],
        "answer": 2,
        "hint": "Undo the −4, then clear the fraction, then divide by 2.",
        "explain": "Add 4: 2x/3 = 12; multiply by 3: 2x = 36; divide by 2: x = 18."
      },
      {
        "id": 27,
        "domain": "6.AT",
        "type": "mc",
        "text": "A figure pattern has 3, 5, 7 squares for Figures 1, 2, 3. If the pattern continues, how many squares will Figure 6 have?",
        "options": [
          "11 squares",
          "12 squares",
          "13 squares",
          "15 squares"
        ],
        "answer": 2,
        "hint": "Find how many squares are added each step, then continue to Figure 6.",
        "explain": "Counts increase by 2 (3, 5, 7, 9, 11, 13), so Figure 6 has 13 squares."
      },
      {
        "id": 28,
        "domain": "6.DS",
        "type": "mc",
        "text": "A spinner has 8 equal sections: 3 red, 3 blue, 2 green. What is the probability of spinning red or green?",
        "options": [
          "3/8",
          "1/2",
          "5/8",
          "3/4"
        ],
        "answer": 2,
        "hint": "Add the red and green sections, then divide by 8.",
        "explain": "Red or green = 3 + 2 = 5 of 8 sections: 5/8."
      },
      {
        "id": 29,
        "domain": "6.AT",
        "type": "fr",
        "text": "A recipe calls for 750 milliliters of milk. If milk costs $3.20 per liter, how much will the milk cost?",
        "answer": "2.40",
        "accept": [
          "2.40",
          "$2.40",
          "2.4"
        ],
        "hint": "Convert mL to liters first (1000 mL = 1 L), then multiply by the price.",
        "explain": "750 mL = 0.75 L; 0.75 × $3.20 = $2.40."
      },
      {
        "id": 30,
        "domain": "6.GR",
        "type": "mc",
        "text": "A composite shape is a trapezoid (bases 20 cm and 12 cm, height 6 cm) plus a triangle (base 12 cm, height 10 cm). What is the total area?",
        "options": [
          "126 square centimeters",
          "144 square centimeters",
          "156 square centimeters",
          "162 square centimeters"
        ],
        "answer": 2,
        "hint": "Find each shape's area separately, then add.",
        "explain": "Trapezoid 1/2(20+12)×6 = 96; triangle 1/2×12×10 = 60; total 156 cm²."
      },
      {
        "id": 31,
        "domain": "6.AT",
        "type": "mc",
        "text": "Which number line represents the solution to x − 4 ≤ 1? (Closed circle at 5, shaded left.)",
        "options": [
          "Line A",
          "Line B",
          "Line C",
          "Line D"
        ],
        "answer": 1,
        "hint": "Solve for x first (add 4), then 'less than or equal to' uses a closed circle.",
        "explain": "x − 4 ≤ 1 → x ≤ 5; closed circle at 5 shading left matches Line B."
      },
      {
        "id": 32,
        "domain": "6.AT",
        "type": "mc",
        "text": "Which expression is equivalent to 4(x + 3) − 2x?",
        "options": [
          "2x + 3",
          "2x + 12",
          "6x + 3",
          "6x + 12"
        ],
        "answer": 1,
        "hint": "Distribute the 4, then combine like terms.",
        "explain": "4(x + 3) = 4x + 12; 4x + 12 − 2x = 2x + 12."
      },
      {
        "id": 33,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Which of the following is equivalent to 7/8?",
        "options": [
          "0.75",
          "0.825",
          "0.875",
          "0.925"
        ],
        "answer": 2,
        "hint": "Divide the numerator by the denominator (7 ÷ 8).",
        "explain": "7 ÷ 8 = 0.875."
      },
      {
        "id": 34,
        "domain": "6.AT",
        "type": "mc",
        "text": "In a parking lot the ratio of cars to motorcycles is 7:2. If there are 14 motorcycles, how many vehicles are there in total?",
        "options": [
          "56 vehicles",
          "63 vehicles",
          "70 vehicles",
          "77 vehicles"
        ],
        "answer": 1,
        "hint": "Find the number of cars from the ratio, then add the motorcycles.",
        "explain": "Cars = 7/2 × 14 = 49; total = 49 + 14 = 63 vehicles."
      },
      {
        "id": 35,
        "domain": "6.GR",
        "type": "mc",
        "text": "A parallelogram has a base of 15 cm and a height of 8 cm. What is its area?",
        "options": [
          "92 cm²",
          "105 cm²",
          "120 cm²",
          "135 cm²"
        ],
        "answer": 2,
        "hint": "Parallelogram area = base × height.",
        "explain": "Area = base × height = 15 × 8 = 120 cm²."
      },
      {
        "id": 36,
        "domain": "6.GR",
        "type": "mc",
        "text": "An L-shaped garden splits into a 12 m by 6 m rectangle and a 6 m by 8 m rectangle. What is the total area of the flower bed?",
        "options": [
          "96 square meters",
          "102 square meters",
          "120 square meters",
          "144 square meters"
        ],
        "answer": 2,
        "hint": "Split the L into two rectangles, find each area, then add.",
        "explain": "12×6 = 72 and 6×8 = 48; total 72 + 48 = 120 m²."
      },
      {
        "id": 37,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A cafeteria serves 480 students. 3/8 buy pizza, and 1/4 of the remaining students buy salad. How many buy salad?",
        "options": [
          "60 students",
          "75 students",
          "90 students",
          "120 students"
        ],
        "answer": 1,
        "hint": "Find the pizza buyers, subtract to get the remainder, then take 1/4 of that.",
        "explain": "Pizza = 3/8 × 480 = 180; remaining 300; salad = 1/4 × 300 = 75 students."
      },
      {
        "id": 38,
        "domain": "6.DS",
        "type": "mc",
        "text": "Weights of five cats (pounds): 8, 10, 12, 14, 16. What is the mean weight?",
        "options": [
          "10 pounds",
          "11 pounds",
          "12 pounds",
          "13 pounds"
        ],
        "answer": 2,
        "hint": "Add the weights and divide by 5.",
        "explain": "Sum = 60; 60 ÷ 5 = 12 pounds."
      },
      {
        "id": 39,
        "domain": "6.DS",
        "type": "mc",
        "text": "Books read: Grade 4 85, Grade 5 92, Grade 6 115, Grade 7 108. How many more books did Grade 6 read than Grade 5?",
        "options": [
          "18 books",
          "20 books",
          "23 books",
          "25 books"
        ],
        "answer": 2,
        "hint": "Subtract Grade 5's total from Grade 6's.",
        "explain": "115 − 92 = 23 books."
      },
      {
        "id": 40,
        "domain": "6.GR",
        "type": "mc",
        "text": "On a coordinate plane, point A is at (2, 3) and point B is at (8, 3). What is the distance from A to B?",
        "options": [
          "5 units",
          "6 units",
          "7 units",
          "8 units"
        ],
        "answer": 1,
        "hint": "When points share a y-value, subtract their x-values.",
        "explain": "Same y-value: distance = |8 − 2| = 6 units."
      }
    ]
  },
  {
    "num": 6,
    "storageKey": "mcapPracticeTest_6_v1",
    "questions": [
      {
        "id": 1,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: 2 1/2 + 1 3/4 × 2",
        "options": [
          "5 1/2",
          "6",
          "6 1/2",
          "7"
        ],
        "answer": 1,
        "hint": "Do the multiplication before the addition (order of operations).",
        "explain": "Multiply first: 1 3/4 × 2 = 7/4 × 2 = 14/4 = 3 1/2; then 2 1/2 + 3 1/2 = 6."
      },
      {
        "id": 2,
        "domain": "6.GR",
        "type": "mc",
        "text": "A triangle has angles of 65° and 70°. What is the measure of the missing angle x?",
        "options": [
          "45°",
          "50°",
          "55°",
          "60°"
        ],
        "answer": 0,
        "hint": "The three angles of a triangle add to 180°.",
        "explain": "65 + 70 + x = 180 → x = 180 − 135 = 45°."
      },
      {
        "id": 3,
        "domain": "6.GR",
        "type": "mc",
        "text": "An L-shaped floor splits into a 14 m by 10 m rectangle and an 8 m by 4 m rectangle. Each tile covers 1 m². How many tiles are needed?",
        "options": [
          "150",
          "160",
          "172",
          "180"
        ],
        "answer": 2,
        "hint": "Split the floor into rectangles, find each area, then add.",
        "explain": "14×10 = 140 and 8×4 = 32; total = 140 + 32 = 172 tiles."
      },
      {
        "id": 4,
        "domain": "6.AT",
        "type": "mc",
        "text": "Solve for n: n/12 = 15/20",
        "options": [
          "n = 8",
          "n = 9",
          "n = 10",
          "n = 12"
        ],
        "answer": 1,
        "hint": "Cross-multiply to solve the proportion.",
        "explain": "Cross-multiply: 20n = 12 × 15 = 180 → n = 9."
      },
      {
        "id": 5,
        "domain": "6.NOS",
        "type": "fr",
        "text": "A baker uses 3/4 cup of sugar per batch. With 12 cups of sugar, how many complete batches can be made?",
        "answer": "16",
        "accept": [
          "16",
          "16 batches"
        ],
        "hint": "Divide the total sugar by the amount per batch (multiply by the reciprocal).",
        "explain": "12 ÷ 3/4 = 12 × 4/3 = 48/3 = 16 batches."
      },
      {
        "id": 6,
        "domain": "6.DS",
        "type": "mc",
        "text": "Pets owned and frequency: 0 pets 8, 1 pet 12, 2 pets 6, 3 pets 4. What is the total number of students?",
        "options": [
          "26 students",
          "28 students",
          "30 students",
          "32 students"
        ],
        "answer": 2,
        "hint": "Add up all the frequencies.",
        "explain": "8 + 12 + 6 + 4 = 30 students."
      },
      {
        "id": 7,
        "domain": "6.GR",
        "type": "mc",
        "text": "An equilateral triangle has a perimeter of 36 cm. What is the length of each side?",
        "options": [
          "9 centimeters",
          "10 centimeters",
          "12 centimeters",
          "18 centimeters"
        ],
        "answer": 2,
        "hint": "Equilateral means 3 equal sides — divide the perimeter by 3.",
        "explain": "36 ÷ 3 = 12 cm per side."
      },
      {
        "id": 8,
        "domain": "6.AT",
        "type": "mc",
        "text": "A recipe calls for 2.5 liters of water. How many milliliters is this?",
        "options": [
          "25 milliliters",
          "250 milliliters",
          "2,500 milliliters",
          "25,000 milliliters"
        ],
        "answer": 2,
        "hint": "There are 1,000 milliliters in 1 liter.",
        "explain": "2.5 × 1,000 = 2,500 milliliters."
      },
      {
        "id": 9,
        "domain": "6.DS",
        "type": "mc",
        "text": "Test scores for five students: 82, 76, 90, 88, 94. What is the mean score?",
        "options": [
          "84",
          "86",
          "88",
          "90"
        ],
        "answer": 1,
        "hint": "Add the scores and divide by 5.",
        "explain": "Sum = 430; 430 ÷ 5 = 86."
      },
      {
        "id": 10,
        "domain": "6.AT",
        "type": "mc",
        "text": "Maria scored 45 out of 60 points on her science test. What percentage did she score?",
        "options": [
          "65%",
          "70%",
          "75%",
          "80%"
        ],
        "answer": 2,
        "hint": "Write the score as a fraction, then convert to a percent.",
        "explain": "45/60 = 0.75 = 75%."
      },
      {
        "id": 11,
        "domain": "6.AT",
        "type": "mc",
        "text": "A graph shows a pool filling: at 0 minutes 0 gallons, at 8 minutes 500 gallons. How many gallons are added each minute?",
        "options": [
          "50 gallons per minute",
          "62.5 gallons per minute",
          "75 gallons per minute",
          "100 gallons per minute"
        ],
        "answer": 1,
        "hint": "Rate = change in gallons ÷ change in minutes.",
        "explain": "500 ÷ 8 = 62.5 gallons per minute."
      },
      {
        "id": 12,
        "domain": "6.AT",
        "type": "mc",
        "text": "Solve for x: x − 17 = 35",
        "options": [
          "x = 18",
          "x = 42",
          "x = 52",
          "x = 62"
        ],
        "answer": 2,
        "hint": "Add 17 to both sides to undo the subtraction.",
        "explain": "Add 17 to both sides: x = 35 + 17 = 52."
      },
      {
        "id": 13,
        "domain": "6.DS",
        "type": "mc",
        "text": "Find the range of: 15, 23, 8, 19, 31, 12.",
        "options": [
          "19",
          "21",
          "23",
          "25"
        ],
        "answer": 2,
        "hint": "Range = largest minus smallest.",
        "explain": "Range = 31 − 8 = 23."
      },
      {
        "id": 14,
        "domain": "6.DS",
        "type": "mc",
        "text": "A bar graph shows Tom with 5 books and Lisa with 7 books. How many more books did Lisa read than Tom?",
        "options": [
          "2 books",
          "3 books",
          "4 books",
          "5 books"
        ],
        "answer": 0,
        "hint": "Subtract Tom's count from Lisa's.",
        "explain": "7 − 5 = 2 more books."
      },
      {
        "id": 15,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: 2/3 + 5/6",
        "options": [
          "7/9",
          "1 1/6",
          "1 1/3",
          "1 1/2"
        ],
        "answer": 3,
        "hint": "Use a common denominator of 6, then add.",
        "explain": "2/3 = 4/6, so 4/6 + 5/6 = 9/6 = 3/2 = 1 1/2."
      },
      {
        "id": 16,
        "domain": "6.DS",
        "type": "mc",
        "text": "Find the median of: 24, 18, 32, 26, 20, 28, 22.",
        "options": [
          "22",
          "24",
          "26",
          "28"
        ],
        "answer": 1,
        "hint": "Order the numbers and pick the middle one.",
        "explain": "In order: 18, 20, 22, 24, 26, 28, 32; middle value = 24."
      },
      {
        "id": 17,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A rectangle's shaded region is 5/12 of the whole. What is the sum of the shaded fraction and 1/4?",
        "options": [
          "7/12",
          "2/3",
          "3/4",
          "5/6"
        ],
        "answer": 1,
        "hint": "Rewrite 1/4 as twelfths, then add.",
        "explain": "5/12 + 1/4 = 5/12 + 3/12 = 8/12 = 2/3."
      },
      {
        "id": 18,
        "domain": "6.AT",
        "type": "mc",
        "text": "Solve for y: 4y + 9 = 37",
        "options": [
          "y = 5",
          "y = 6",
          "y = 7",
          "y = 8"
        ],
        "answer": 2,
        "hint": "Undo the +9 first, then divide by 4.",
        "explain": "Subtract 9: 4y = 28; divide by 4: y = 7."
      },
      {
        "id": 19,
        "domain": "6.AT",
        "type": "mc",
        "text": "The ratio of boys to girls in a class is 3:5. If there are 15 boys, how many girls are in the class?",
        "options": [
          "20 girls",
          "25 girls",
          "30 girls",
          "35 girls"
        ],
        "answer": 1,
        "hint": "How many times bigger is 15 than 3? Multiply 5 by that factor.",
        "explain": "3/5 = 15/girls → girls = 5/3 × 15 = 25."
      },
      {
        "id": 20,
        "domain": "6.GR",
        "type": "mc",
        "text": "A triangle has a base of 12 cm and a height of 6 cm. What is its area?",
        "options": [
          "24 square cm",
          "30 square cm",
          "36 square cm",
          "42 square cm"
        ],
        "answer": 2,
        "hint": "Triangle area = 1/2 × base × height.",
        "explain": "Area = 1/2 × 12 × 6 = 36 cm²."
      },
      {
        "id": 21,
        "domain": "6.GR",
        "type": "mc",
        "text": "A regular octagon has a side length of 6 inches. All eight sides are equal. What is the perimeter?",
        "options": [
          "42 inches",
          "48 inches",
          "54 inches",
          "60 inches"
        ],
        "answer": 1,
        "hint": "An octagon has 8 sides — multiply one side by 8.",
        "explain": "8 × 6 = 48 inches."
      },
      {
        "id": 22,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: 3.6 × 2.5",
        "options": [
          "8.5",
          "9",
          "9.5",
          "10"
        ],
        "answer": 1,
        "hint": "Multiply without decimals, then place the decimal point (two places total).",
        "explain": "36 × 25 = 900; place two decimal places: 9.00 = 9."
      },
      {
        "id": 23,
        "domain": "6.GR",
        "type": "fr",
        "text": "A rectangular playground is 50 m long and 30 m wide. What is the perimeter in meters?",
        "answer": "160",
        "accept": [
          "160",
          "160 meters",
          "160 m"
        ],
        "hint": "Perimeter of a rectangle = 2 × (length + width).",
        "explain": "Perimeter = 2 × (50 + 30) = 2 × 80 = 160 meters."
      },
      {
        "id": 24,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: 7/8 − 1/4",
        "options": [
          "3/8",
          "5/8",
          "6/8",
          "7/8"
        ],
        "answer": 1,
        "hint": "Rewrite 1/4 with a denominator of 8, then subtract.",
        "explain": "1/4 = 2/8; 7/8 − 2/8 = 5/8."
      },
      {
        "id": 25,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Convert 45% to a decimal.",
        "options": [
          "0.045",
          "0.45",
          "4.5",
          "45"
        ],
        "answer": 1,
        "hint": "To convert a percent to a decimal, divide by 100 (move the decimal two places left).",
        "explain": "45% = 45/100 = 0.45."
      },
      {
        "id": 26,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: −8 − (−12)",
        "options": [
          "−20",
          "−4",
          "4",
          "20"
        ],
        "answer": 2,
        "hint": "Subtracting a negative is the same as adding a positive.",
        "explain": "−8 − (−12) = −8 + 12 = 4."
      },
      {
        "id": 27,
        "domain": "6.DS",
        "type": "mc",
        "text": "A line graph shows the temperature through a day. At 12:00 (noon) the line reads 72°F. What was the temperature at noon?",
        "options": [
          "68°F",
          "72°F",
          "76°F",
          "80°F"
        ],
        "answer": 1,
        "hint": "Find 12:00 on the time axis and read the matching temperature.",
        "explain": "At 12:00, the line is at 72°F."
      },
      {
        "id": 28,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Find the greatest common factor (GCF) of 36 and 48.",
        "options": [
          "4",
          "6",
          "12",
          "24"
        ],
        "answer": 2,
        "hint": "Find the largest number that divides both 36 and 48.",
        "explain": "Common factors of 36 and 48 include 1, 2, 3, 4, 6, 12; the greatest is 12."
      },
      {
        "id": 29,
        "domain": "6.AT",
        "type": "fr",
        "text": "A shirt originally costs $40 and is on sale for 25% off. What is the sale price?",
        "answer": "30",
        "accept": [
          "30",
          "$30",
          "30 dollars"
        ],
        "hint": "Find 25% of $40, then subtract it from $40.",
        "explain": "Discount = 0.25 × 40 = $10; sale price = 40 − 10 = $30."
      },
      {
        "id": 30,
        "domain": "6.AT",
        "type": "mc",
        "text": "Calculate: 5³",
        "options": [
          "15",
          "25",
          "75",
          "125"
        ],
        "answer": 3,
        "hint": "5³ means multiply three 5's together.",
        "explain": "5³ = 5 × 5 × 5 = 125."
      },
      {
        "id": 31,
        "domain": "6.AT",
        "type": "mc",
        "text": "A machine fills 36 bottles in 4 minutes. At this rate, how many bottles can it fill in 90 minutes?",
        "options": [
          "720 bottles",
          "810 bottles",
          "900 bottles",
          "1,080 bottles"
        ],
        "answer": 1,
        "hint": "Find the bottles per minute, then multiply by 90.",
        "explain": "Rate = 36/4 = 9 bottles per minute; 9 × 90 = 810 bottles."
      },
      {
        "id": 32,
        "domain": "6.NOS",
        "type": "mc",
        "text": "In which quadrant is the point (−6, 4) located?",
        "options": [
          "Quadrant I",
          "Quadrant II",
          "Quadrant III",
          "Quadrant IV"
        ],
        "answer": 1,
        "hint": "Quadrant II is where x is negative and y is positive.",
        "explain": "Negative x and positive y is the pattern (−, +) for Quadrant II."
      },
      {
        "id": 33,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Three clocks ring every 6, 8, and 12 minutes. If all ring at 3:00 PM, when will they all ring together again?",
        "options": [
          "3:24 PM",
          "3:36 PM",
          "3:48 PM",
          "4:00 PM"
        ],
        "answer": 0,
        "hint": "Find the least common multiple of 6, 8, and 12.",
        "explain": "LCM of 6, 8, 12 is 24, so they ring together 24 minutes later at 3:24 PM."
      },
      {
        "id": 34,
        "domain": "6.DS",
        "type": "mc",
        "text": "A scatter plot of hours studied vs. test scores shows points rising as study hours increase. What relationship does it show?",
        "options": [
          "No relationship",
          "Negative relationship",
          "Positive relationship",
          "Cannot be determined"
        ],
        "answer": 2,
        "hint": "When both variables increase together, the relationship is positive.",
        "explain": "As hours studied increase, scores increase, so the relationship is positive."
      },
      {
        "id": 35,
        "domain": "6.NOS",
        "type": "mc",
        "text": "Calculate: 4 1/3 ÷ 1 1/6",
        "options": [
          "3 5/7",
          "3 3/7",
          "3 1/7",
          "2 6/7"
        ],
        "answer": 0,
        "hint": "Change both to improper fractions, then multiply by the reciprocal of the divisor.",
        "explain": "4 1/3 = 13/3, 1 1/6 = 7/6; 13/3 × 6/7 = 78/21 = 26/7 = 3 5/7."
      },
      {
        "id": 36,
        "domain": "6.AT",
        "type": "fr",
        "text": "In a school the ratio of teachers to students is 1:25. If there are 1,200 students, how many teachers are there?",
        "answer": "48",
        "accept": [
          "48",
          "48 teachers"
        ],
        "hint": "There is 1 teacher for every 25 students — divide the students by 25.",
        "explain": "Teachers = 1,200 ÷ 25 = 48 teachers."
      },
      {
        "id": 37,
        "domain": "6.GR",
        "type": "mc",
        "text": "A box is 8 in long, 5 in wide, and 3 in tall. What is the total surface area?",
        "options": [
          "120 square inches",
          "142 square inches",
          "158 square inches",
          "172 square inches"
        ],
        "answer": 2,
        "hint": "Surface area = 2(lw + lh + wh).",
        "explain": "SA = 2(8×5 + 8×3 + 5×3) = 2(40 + 24 + 15) = 2(79) = 158 in²."
      },
      {
        "id": 38,
        "domain": "6.AT",
        "type": "mc",
        "text": "Solve for x: 3x + 8 > 20",
        "options": [
          "x > 4",
          "x > 6",
          "x < 4",
          "x < 6"
        ],
        "answer": 0,
        "hint": "Solve like an equation: undo the +8, then divide by 3.",
        "explain": "Subtract 8: 3x > 12; divide by 3: x > 4."
      },
      {
        "id": 39,
        "domain": "6.NOS",
        "type": "mc",
        "text": "A Venn diagram shows number sets. Which number belongs in the Whole Numbers set?",
        "options": [
          "−7",
          "11/3",
          "23",
          "−4/5"
        ],
        "answer": 2,
        "hint": "Whole numbers are 0, 1, 2, 3, … — no negatives, no fractions.",
        "explain": "Whole numbers are non-negative integers; 23 qualifies (−7 is negative, 11/3 and −4/5 are not integers)."
      },
      {
        "id": 40,
        "domain": "6.DS",
        "type": "mc",
        "text": "A pie chart shows how a student spends 24 hours; the Sleeping sector spans 120° of 360°. How many hours are spent sleeping?",
        "options": [
          "6 hours",
          "8 hours",
          "9 hours",
          "10 hours"
        ],
        "answer": 1,
        "hint": "Find what fraction of 360° the sector is, then take that fraction of 24 hours.",
        "explain": "120/360 = 1/3 of the day; 1/3 × 24 = 8 hours."
      }
    ]
  }
];

export default PRACTICE_TESTS;
