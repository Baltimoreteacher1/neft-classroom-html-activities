/* GENERATED from the year-long content workflow — do not hand-edit.
   12 units · regenerate via the workflow + scripts/intervention integration. */
export const META = {
  "title": "6th-Grade Math Intervention",
  "tagline": "Diagnose the gap, close it with TPT-quality practice, games, worked examples, and worksheets, then prove growth with a post-quiz."
};

export const TOPICS = [
  {
    "slug": "number-operations",
    "title": "Whole-Number Operations & Fluency",
    "icon": "🔢",
    "accent": "#205fa6",
    "standard": "Builds 6.NS.B.2–3",
    "domain": "Number & Operations",
    "blurb": "Rebuild fast, accurate multi-digit multiplication and long division — the engine behind every Grade 6 unit.",
    "skills": [
      "Multiply",
      "Divide",
      "Estimate",
      "Order of operations"
    ],
    "lessons": 4,
    "objective": "I can multiply and divide multi-digit whole numbers, estimate to check my work, and use the order of operations to solve real-world problems.",
    "estMin": 30,
    "vocab": [
      {
        "term": "Product",
        "def": "The answer when you multiply two numbers."
      },
      {
        "term": "Quotient",
        "def": "The answer when you divide one number by another."
      },
      {
        "term": "Remainder",
        "def": "The amount left over after dividing evenly."
      },
      {
        "term": "Estimate",
        "def": "A close guess made by rounding numbers first."
      },
      {
        "term": "Order of operations",
        "def": "The rules for which step to do first."
      },
      {
        "term": "Partial product",
        "def": "A piece of a multiplication you add up later."
      }
    ],
    "materials": [
      "Pencil and lined paper",
      "Place-value grid or graph paper",
      "Multiplication facts chart"
    ],
    "workedExamples": [
      {
        "problem": "Multiply 34 × 6.",
        "steps": [
          "Break 34 into 30 + 4.",
          "Multiply each part: 6 × 30 = 180 and 6 × 4 = 24.",
          "Add the partial products: 180 + 24 = 204."
        ],
        "answer": "204"
      },
      {
        "problem": "Divide 487 ÷ 6 and write the remainder.",
        "steps": [
          "6 goes into 48 eight times: 6 × 8 = 48, leaving 7.",
          "Bring down the 7 to make 07.",
          "6 goes into 7 one time: 6 × 1 = 6, leaving a remainder of 1.",
          "The quotient is 81 with remainder 1."
        ],
        "answer": "81 R1"
      },
      {
        "problem": "Evaluate 4 + 3 × (10 − 6)² using order of operations.",
        "steps": [
          "Do parentheses first: 10 − 6 = 4.",
          "Apply the exponent: 4² = 16.",
          "Multiply: 3 × 16 = 48.",
          "Add last: 4 + 48 = 52."
        ],
        "answer": "52"
      }
    ],
    "bank": [
      {
        "prompt": "What is 6 × 7?",
        "answer": "42",
        "options": [
          "42",
          "36",
          "48",
          "13"
        ],
        "distractors": [
          "36",
          "48",
          "13"
        ],
        "explain": "6 groups of 7 equals 42."
      },
      {
        "prompt": "What is 23 × 4?",
        "answer": "92",
        "options": [
          "92",
          "82",
          "86",
          "27"
        ],
        "distractors": [
          "82",
          "86",
          "27"
        ],
        "explain": "4 × 20 = 80 and 4 × 3 = 12, so 80 + 12 = 92."
      },
      {
        "prompt": "What is 84 ÷ 6?",
        "answer": "14",
        "options": [
          "14",
          "12",
          "16",
          "13"
        ],
        "distractors": [
          "12",
          "16",
          "13"
        ],
        "explain": "6 × 14 = 84, so the quotient is 14."
      },
      {
        "prompt": "Estimate 39 × 21 by rounding each number to the nearest ten.",
        "answer": "800",
        "options": [
          "800",
          "600",
          "819",
          "900"
        ],
        "distractors": [
          "600",
          "819",
          "900"
        ],
        "explain": "39 rounds to 40 and 21 rounds to 20, and 40 × 20 = 800."
      },
      {
        "prompt": "What is 34 × 27?",
        "answer": "918",
        "options": [
          "918",
          "908",
          "888",
          "61"
        ],
        "distractors": [
          "908",
          "888",
          "61"
        ],
        "explain": "34 × 27 = 34 × 20 + 34 × 7 = 680 + 238 = 918."
      },
      {
        "prompt": "Which equals the remainder of 847 ÷ 5?",
        "answer": "2",
        "options": [
          "2",
          "3",
          "4",
          "5"
        ],
        "distractors": [
          "3",
          "4",
          "5"
        ],
        "explain": "5 × 169 = 845, and 847 − 845 = 2."
      },
      {
        "prompt": "What is 48 × 36?",
        "answer": "1,728",
        "options": [
          "1,728",
          "1,628",
          "1,748",
          "84"
        ],
        "distractors": [
          "1,628",
          "1,748",
          "84"
        ],
        "explain": "48 × 36 = 48 × 30 + 48 × 6 = 1,440 + 288 = 1,728."
      },
      {
        "prompt": "Evaluate 5 + 3 × 4 using order of operations.",
        "answer": "17",
        "options": [
          "17",
          "32",
          "23",
          "12"
        ],
        "distractors": [
          "32",
          "23",
          "12"
        ],
        "explain": "Multiply first: 3 × 4 = 12, then add 5 to get 17."
      },
      {
        "prompt": "What is 925 ÷ 4 written with a remainder?",
        "answer": "231 R1",
        "options": [
          "231 R1",
          "231 R2",
          "230 R1",
          "231"
        ],
        "distractors": [
          "231 R2",
          "230 R1",
          "231"
        ],
        "explain": "4 × 231 = 924, and 925 − 924 = 1."
      },
      {
        "prompt": "Evaluate (8 + 2) × 3.",
        "answer": "30",
        "options": [
          "30",
          "14",
          "24",
          "13"
        ],
        "distractors": [
          "14",
          "24",
          "13"
        ],
        "explain": "Do the parentheses first: 8 + 2 = 10, then 10 × 3 = 30."
      },
      {
        "prompt": "What is 1,000 ÷ 7 written with a remainder?",
        "answer": "142 R6",
        "options": [
          "142 R6",
          "142 R4",
          "143 R6",
          "142"
        ],
        "distractors": [
          "142 R4",
          "143 R6",
          "142"
        ],
        "explain": "7 × 142 = 994, and 1,000 − 994 = 6."
      },
      {
        "prompt": "What is 213 × 45?",
        "answer": "9,585",
        "options": [
          "9,585",
          "9,535",
          "9,495",
          "258"
        ],
        "distractors": [
          "9,535",
          "9,495",
          "258"
        ],
        "explain": "213 × 45 = 213 × 40 + 213 × 5 = 8,520 + 1,065 = 9,585."
      },
      {
        "prompt": "Evaluate 20 − 2 × 3².",
        "answer": "2",
        "options": [
          "2",
          "18",
          "162",
          "36"
        ],
        "distractors": [
          "18",
          "162",
          "36"
        ],
        "explain": "Exponent first: 3² = 9, then 2 × 9 = 18, then 20 − 18 = 2."
      },
      {
        "prompt": "Evaluate 24 ÷ (6 − 2).",
        "answer": "6",
        "options": [
          "6",
          "2",
          "8",
          "4"
        ],
        "distractors": [
          "2",
          "8",
          "4"
        ],
        "explain": "Subtract inside parentheses first: 6 − 2 = 4, then 24 ÷ 4 = 6."
      },
      {
        "prompt": "What is 738 ÷ 6?",
        "answer": "123",
        "options": [
          "123",
          "122",
          "133",
          "123 R2"
        ],
        "distractors": [
          "122",
          "133",
          "123 R2"
        ],
        "explain": "6 × 123 = 738 exactly, so there is no remainder."
      },
      {
        "prompt": "A box holds 24 crayons. How many crayons are in 15 boxes?",
        "answer": "360",
        "options": [
          "360",
          "350",
          "390",
          "39"
        ],
        "distractors": [
          "350",
          "390",
          "39"
        ],
        "explain": "24 × 15 = 360 crayons in all."
      },
      {
        "prompt": "A baker has 156 muffins packed 12 to a tray. How many full trays?",
        "answer": "13",
        "options": [
          "13",
          "12",
          "14",
          "144"
        ],
        "distractors": [
          "12",
          "14",
          "144"
        ],
        "explain": "156 ÷ 12 = 13 trays with no muffins left over."
      },
      {
        "prompt": "Tickets cost $8 each. Maria buys 45 tickets and pays a $30 fee. What is the total cost?",
        "answer": "$390",
        "options": [
          "$390",
          "$360",
          "$83",
          "$330"
        ],
        "distractors": [
          "$360",
          "$83",
          "$330"
        ],
        "explain": "8 × 45 = 360, then add the $30 fee to get $390."
      },
      {
        "prompt": "A school orders 500 pencils packed 7 to a pouch. How many full pouches, and how many pencils are left over?",
        "answer": "71 pouches, 3 left",
        "options": [
          "71 pouches, 3 left",
          "70 pouches, 3 left",
          "71 pouches, 4 left",
          "72 pouches, 1 left"
        ],
        "distractors": [
          "70 pouches, 3 left",
          "71 pouches, 4 left",
          "72 pouches, 1 left"
        ],
        "explain": "7 × 71 = 497, and 500 − 497 = 3 left over."
      },
      {
        "prompt": "Estimate the cost of 28 shirts that sell for $412 each by rounding to the nearest ten and hundred.",
        "answer": "$12,000",
        "options": [
          "$12,000",
          "$8,000",
          "$1,200",
          "$11,536"
        ],
        "distractors": [
          "$8,000",
          "$1,200",
          "$11,536"
        ],
        "explain": "28 rounds to 30, 412 rounds to 400, and 30 × 400 = 12,000."
      },
      {
        "prompt": "A class read 36 books each month for 24 months. How many books in all?",
        "answer": "864",
        "options": [
          "864",
          "854",
          "60",
          "884"
        ],
        "distractors": [
          "854",
          "60",
          "884"
        ],
        "explain": "36 × 24 = 864 books read in total."
      },
      {
        "prompt": "A field trip has 720 students riding buses that hold 15 each. How many buses are needed?",
        "answer": "48",
        "options": [
          "48",
          "47",
          "49",
          "705"
        ],
        "distractors": [
          "47",
          "49",
          "705"
        ],
        "explain": "720 ÷ 15 = 48 buses with no students left over."
      },
      {
        "prompt": "Evaluate 3 × (2 + 8) − 5 to find points scored in a game.",
        "answer": "25",
        "options": [
          "25",
          "30",
          "21",
          "5"
        ],
        "distractors": [
          "30",
          "21",
          "5"
        ],
        "explain": "Parentheses first: 2 + 8 = 10, then 3 × 10 = 30, then 30 − 5 = 25."
      },
      {
        "prompt": "A store splits 1,456 stickers equally into 12 prize bags. How many per bag, and how many are left over?",
        "answer": "121 per bag, 4 left",
        "options": [
          "121 per bag, 4 left",
          "120 per bag, 4 left",
          "121 per bag, 6 left",
          "122 per bag, 2 left"
        ],
        "distractors": [
          "120 per bag, 4 left",
          "121 per bag, 6 left",
          "122 per bag, 2 left"
        ],
        "explain": "12 × 121 = 1,452, and 1,456 − 1,452 = 4 left over."
      }
    ],
    "worksheetA": [
      {
        "q": "Multiply: 27 × 8",
        "a": "216"
      },
      {
        "q": "Multiply: 45 × 13",
        "a": "585"
      },
      {
        "q": "Multiply: 34 × 27",
        "a": "918"
      },
      {
        "q": "Multiply: 125 × 8",
        "a": "1,000"
      },
      {
        "q": "Multiply: 213 × 45",
        "a": "9,585"
      },
      {
        "q": "Divide and give remainder: 847 ÷ 5",
        "a": "169 R2"
      },
      {
        "q": "Divide and give remainder: 1,000 ÷ 7",
        "a": "142 R6"
      },
      {
        "q": "Divide: 738 ÷ 6",
        "a": "123"
      },
      {
        "q": "Divide and give remainder: 1,456 ÷ 12",
        "a": "121 R4"
      },
      {
        "q": "Estimate by rounding to the nearest ten: 39 × 21",
        "a": "800"
      },
      {
        "q": "Evaluate: 5 + 3 × 4",
        "a": "17"
      },
      {
        "q": "Evaluate: 3 × (2 + 8) − 5",
        "a": "25"
      }
    ],
    "worksheetB": [
      {
        "q": "A box holds 24 crayons. How many crayons are in 15 boxes?",
        "a": "360 crayons"
      },
      {
        "q": "A baker has 156 muffins packed 12 to a tray. How many full trays does she fill?",
        "a": "13 trays"
      },
      {
        "q": "Tickets cost $8 each. Maria buys 45 tickets and pays a $30 service fee. What is her total cost?",
        "a": "$390"
      },
      {
        "q": "A school orders 500 pencils packed 7 to a pouch. How many full pouches, and how many pencils are left over?",
        "a": "71 pouches, 3 left over"
      },
      {
        "q": "A class reads 36 books each month for 24 months. How many books did they read in all?",
        "a": "864 books"
      },
      {
        "q": "A field trip has 720 students riding buses that hold 15 each. How many buses are needed?",
        "a": "48 buses"
      },
      {
        "q": "A store splits 2,476 marbles equally into 8 jars. How many marbles per jar, and how many are left over?",
        "a": "309 per jar, 4 left over"
      },
      {
        "q": "Estimate the cost of 28 shirts that sell for $412 each by rounding to the nearest ten and hundred.",
        "a": "about $12,000"
      },
      {
        "q": "A pizza shop sold 19 pizzas at a fair. Each pizza was cut into 64 small bites. How many bites in all?",
        "a": "1,216 bites"
      },
      {
        "q": "A team scored points using 4 + 18 ÷ 3 × 2. How many points did they score?",
        "a": "16 points"
      },
      {
        "q": "A library has 1,250 books to place on shelves that hold 25 books each. How many shelves are filled?",
        "a": "50 shelves"
      },
      {
        "q": "★ A vending machine collected $738 in quarters. It then split that money equally into 6 cash bags. Using a quarter = $0.25, how many quarters were collected, and how much money is in each bag?",
        "a": "2,952 quarters; $123 per bag"
      }
    ],
    "preQuiz": [
      {
        "prompt": "What is 38 × 7?",
        "answer": "266",
        "options": [
          "266",
          "256",
          "276",
          "45"
        ],
        "distractors": [
          "256",
          "276",
          "45"
        ],
        "explain": "7 × 30 = 210 and 7 × 8 = 56, so 210 + 56 = 266."
      },
      {
        "prompt": "What is 56 × 89?",
        "answer": "4,984",
        "options": [
          "4,984",
          "4,884",
          "4,994",
          "145"
        ],
        "distractors": [
          "4,884",
          "4,994",
          "145"
        ],
        "explain": "56 × 89 = 56 × 80 + 56 × 9 = 4,480 + 504 = 4,984."
      },
      {
        "prompt": "What is 365 ÷ 12 written with a remainder?",
        "answer": "30 R5",
        "options": [
          "30 R5",
          "30 R4",
          "31 R5",
          "30"
        ],
        "distractors": [
          "30 R4",
          "31 R5",
          "30"
        ],
        "explain": "12 × 30 = 360, and 365 − 360 = 5."
      },
      {
        "prompt": "What is 584 ÷ 9 written with a remainder?",
        "answer": "64 R8",
        "options": [
          "64 R8",
          "64 R7",
          "65 R8",
          "64"
        ],
        "distractors": [
          "64 R7",
          "65 R8",
          "64"
        ],
        "explain": "9 × 64 = 576, and 584 − 576 = 8."
      },
      {
        "prompt": "Estimate 39 × 21 by rounding each number to the nearest ten.",
        "answer": "800",
        "options": [
          "800",
          "600",
          "819",
          "1,000"
        ],
        "distractors": [
          "600",
          "819",
          "1,000"
        ],
        "explain": "39 rounds to 40 and 21 rounds to 20, and 40 × 20 = 800."
      },
      {
        "prompt": "Evaluate 7 + 2 × 5 − 3.",
        "answer": "14",
        "options": [
          "14",
          "42",
          "12",
          "20"
        ],
        "distractors": [
          "42",
          "12",
          "20"
        ],
        "explain": "Multiply first: 2 × 5 = 10, then 7 + 10 − 3 = 14."
      },
      {
        "prompt": "Evaluate 36 ÷ 4 + 5 × 2.",
        "answer": "19",
        "options": [
          "19",
          "28",
          "13",
          "17"
        ],
        "distractors": [
          "28",
          "13",
          "17"
        ],
        "explain": "Divide and multiply first: 9 + 10 = 19."
      },
      {
        "prompt": "A store splits 2,476 marbles equally into 8 jars. How many per jar, and how many are left over?",
        "answer": "309 per jar, 4 left",
        "options": [
          "309 per jar, 4 left",
          "309 per jar, 2 left",
          "308 per jar, 4 left",
          "310 per jar, 4 left"
        ],
        "distractors": [
          "309 per jar, 2 left",
          "308 per jar, 4 left",
          "310 per jar, 4 left"
        ],
        "explain": "8 × 309 = 2,472, and 2,476 − 2,472 = 4 left over."
      }
    ],
    "postQuiz": [
      {
        "prompt": "What is 47 × 6?",
        "answer": "282",
        "options": [
          "282",
          "272",
          "288",
          "53"
        ],
        "distractors": [
          "272",
          "288",
          "53"
        ],
        "explain": "6 × 40 = 240 and 6 × 7 = 42, so 240 + 42 = 282."
      },
      {
        "prompt": "What is 72 × 48?",
        "answer": "3,456",
        "options": [
          "3,456",
          "3,356",
          "3,476",
          "120"
        ],
        "distractors": [
          "3,356",
          "3,476",
          "120"
        ],
        "explain": "72 × 48 = 72 × 40 + 72 × 8 = 2,880 + 576 = 3,456."
      },
      {
        "prompt": "What is 738 ÷ 6?",
        "answer": "123",
        "options": [
          "123",
          "122",
          "133",
          "123 R1"
        ],
        "distractors": [
          "122",
          "133",
          "123 R1"
        ],
        "explain": "6 × 123 = 738 exactly, so there is no remainder."
      },
      {
        "prompt": "What is 925 ÷ 4 written with a remainder?",
        "answer": "231 R1",
        "options": [
          "231 R1",
          "230 R1",
          "231 R2",
          "231"
        ],
        "distractors": [
          "230 R1",
          "231 R2",
          "231"
        ],
        "explain": "4 × 231 = 924, and 925 − 924 = 1."
      },
      {
        "prompt": "Estimate 58 × 31 by rounding each number to the nearest ten.",
        "answer": "1,800",
        "options": [
          "1,800",
          "1,500",
          "1,798",
          "2,100"
        ],
        "distractors": [
          "1,500",
          "1,798",
          "2,100"
        ],
        "explain": "58 rounds to 60 and 31 rounds to 30, and 60 × 30 = 1,800."
      },
      {
        "prompt": "Evaluate 6 + 4 × 5.",
        "answer": "26",
        "options": [
          "26",
          "50",
          "30",
          "20"
        ],
        "distractors": [
          "50",
          "30",
          "20"
        ],
        "explain": "Multiply first: 4 × 5 = 20, then add 6 to get 26."
      },
      {
        "prompt": "Evaluate (15 − 7) × 3.",
        "answer": "24",
        "options": [
          "24",
          "18",
          "11",
          "36"
        ],
        "distractors": [
          "18",
          "11",
          "36"
        ],
        "explain": "Subtract inside parentheses first: 15 − 7 = 8, then 8 × 3 = 24."
      },
      {
        "prompt": "A farmer packs 1,500 eggs into cartons of 12. How many full cartons can she fill?",
        "answer": "125",
        "options": [
          "125",
          "124",
          "126",
          "1,488"
        ],
        "distractors": [
          "124",
          "126",
          "1,488"
        ],
        "explain": "1,500 ÷ 12 = 125 cartons with no eggs left over."
      }
    ]
  },
  {
    "slug": "factors-multiples",
    "title": "Factors, Multiples & Primes",
    "icon": "🧱",
    "accent": "#0891b2",
    "standard": "Builds 6.NS.B.4",
    "domain": "Number & Operations",
    "blurb": "Find factors, multiples, GCF and LCM — the toolkit for simplifying fractions and solving ratio problems.",
    "skills": [
      "GCF & LCM",
      "Primes",
      "Factor trees",
      "Distributive"
    ],
    "lessons": 4,
    "objective": "I can find factors, multiples, GCF, LCM, and prime factorizations, and use the GCF with the distributive property.",
    "estMin": 30,
    "vocab": [
      {
        "term": "Factor",
        "def": "A whole number that divides another number evenly."
      },
      {
        "term": "Multiple",
        "def": "The product of a number and any whole number."
      },
      {
        "term": "Prime number",
        "def": "A number with exactly two factors: 1 and itself."
      },
      {
        "term": "Composite number",
        "def": "A number with more than two factors."
      },
      {
        "term": "Greatest Common Factor (GCF)",
        "def": "The largest factor two numbers share."
      },
      {
        "term": "Least Common Multiple (LCM)",
        "def": "The smallest multiple two numbers share."
      }
    ],
    "materials": [
      "100s chart or number grid",
      "Colored counters or tiles",
      "Factor rainbow / T-chart worksheet",
      "Pencil and scratch paper"
    ],
    "workedExamples": [
      {
        "problem": "List all the factors of 18 and tell whether 18 is prime or composite.",
        "steps": [
          "Find pairs of numbers that multiply to 18: 1 × 18, 2 × 9, 3 × 6.",
          "Write each factor once, in order: 1, 2, 3, 6, 9, 18.",
          "Count the factors: there are 6 factors, which is more than two.",
          "Since 18 has more than two factors, it is composite."
        ],
        "answer": "Factors: 1, 2, 3, 6, 9, 18; 18 is composite."
      },
      {
        "problem": "Find the GCF and the LCM of 8 and 12.",
        "steps": [
          "List factors of 8: 1, 2, 4, 8. List factors of 12: 1, 2, 3, 4, 6, 12.",
          "The common factors are 1, 2, 4; the greatest is 4, so GCF = 4.",
          "List multiples of 8: 8, 16, 24, 32. List multiples of 12: 12, 24, 36.",
          "The smallest multiple they share is 24, so LCM = 24."
        ],
        "answer": "GCF = 4 and LCM = 24."
      },
      {
        "problem": "Find the prime factorization of 60, then use the GCF to rewrite 24 + 36 with the distributive property.",
        "steps": [
          "Make a factor tree for 60: 60 = 6 × 10 = (2 × 3) × (2 × 5).",
          "Write the prime factors smallest to largest: 60 = 2 × 2 × 3 × 5.",
          "For 24 + 36, find the GCF: 24 = 12 × 2 and 36 = 12 × 3, so GCF = 12.",
          "Factor out 12: 24 + 36 = 12 × (2 + 3)."
        ],
        "answer": "60 = 2 × 2 × 3 × 5; and 24 + 36 = 12 × (2 + 3)."
      }
    ],
    "bank": [
      {
        "prompt": "Which list shows the factors of 12?",
        "answer": "1, 2, 3, 4, 6, 12",
        "options": [
          "1, 2, 3, 4, 6, 12",
          "1, 2, 3, 4, 12",
          "2, 3, 4, 6",
          "1, 2, 6, 12"
        ],
        "distractors": [
          "1, 2, 3, 4, 12",
          "2, 3, 4, 6",
          "1, 2, 6, 12"
        ],
        "explain": "The factors of 12 are all whole numbers that divide 12 evenly: 1, 2, 3, 4, 6, 12."
      },
      {
        "prompt": "Which number is a multiple of 5?",
        "answer": "35",
        "options": [
          "35",
          "52",
          "24",
          "41"
        ],
        "distractors": [
          "52",
          "24",
          "41"
        ],
        "explain": "35 = 5 × 7, so it is a multiple of 5; multiples of 5 end in 0 or 5."
      },
      {
        "prompt": "Is the number 7 prime or composite?",
        "answer": "Prime",
        "options": [
          "Prime",
          "Composite",
          "Neither",
          "Both"
        ],
        "distractors": [
          "Composite",
          "Neither",
          "Both"
        ],
        "explain": "7 has only two factors, 1 and 7, so it is prime."
      },
      {
        "prompt": "Is the number 9 prime or composite?",
        "answer": "Composite",
        "options": [
          "Composite",
          "Prime",
          "Neither",
          "Both"
        ],
        "distractors": [
          "Prime",
          "Neither",
          "Both"
        ],
        "explain": "9 has factors 1, 3, and 9, so it is composite."
      },
      {
        "prompt": "What is the GCF of 8 and 12?",
        "answer": "4",
        "options": [
          "4",
          "2",
          "8",
          "24"
        ],
        "distractors": [
          "2",
          "8",
          "24"
        ],
        "explain": "The greatest factor shared by 8 and 12 is 4."
      },
      {
        "prompt": "What is the GCF of 16 and 24?",
        "answer": "8",
        "options": [
          "8",
          "4",
          "2",
          "48"
        ],
        "distractors": [
          "4",
          "2",
          "48"
        ],
        "explain": "8 is the largest number that divides both 16 and 24."
      },
      {
        "prompt": "What is the LCM of 3 and 5?",
        "answer": "15",
        "options": [
          "15",
          "8",
          "30",
          "1"
        ],
        "distractors": [
          "8",
          "30",
          "1"
        ],
        "explain": "15 is the smallest number that both 3 and 5 divide into evenly."
      },
      {
        "prompt": "What is the LCM of 4 and 6?",
        "answer": "12",
        "options": [
          "12",
          "24",
          "10",
          "2"
        ],
        "distractors": [
          "24",
          "10",
          "2"
        ],
        "explain": "12 is the smallest multiple shared by 4 and 6."
      },
      {
        "prompt": "Which number is NOT a factor of 24?",
        "answer": "5",
        "options": [
          "5",
          "6",
          "8",
          "12"
        ],
        "distractors": [
          "6",
          "8",
          "12"
        ],
        "explain": "24 ÷ 5 does not divide evenly, so 5 is not a factor of 24."
      },
      {
        "prompt": "What is the GCF of 15 and 20?",
        "answer": "5",
        "options": [
          "5",
          "10",
          "1",
          "60"
        ],
        "distractors": [
          "10",
          "1",
          "60"
        ],
        "explain": "5 is the greatest number that divides both 15 and 20."
      },
      {
        "prompt": "What is the LCM of 6 and 8?",
        "answer": "24",
        "options": [
          "24",
          "48",
          "12",
          "2"
        ],
        "distractors": [
          "48",
          "12",
          "2"
        ],
        "explain": "24 is the smallest number both 6 and 8 divide into evenly."
      },
      {
        "prompt": "Which list shows the prime factorization of 18?",
        "answer": "2 × 3 × 3",
        "options": [
          "2 × 3 × 3",
          "2 × 9",
          "3 × 6",
          "2 × 2 × 3"
        ],
        "distractors": [
          "2 × 9",
          "3 × 6",
          "2 × 2 × 3"
        ],
        "explain": "18 = 2 × 9 = 2 × 3 × 3, all prime factors."
      },
      {
        "prompt": "What is the prime factorization of 24?",
        "answer": "2 × 2 × 2 × 3",
        "options": [
          "2 × 2 × 2 × 3",
          "2 × 2 × 3",
          "4 × 6",
          "2 × 3 × 4"
        ],
        "distractors": [
          "2 × 2 × 3",
          "4 × 6",
          "2 × 3 × 4"
        ],
        "explain": "24 = 2 × 2 × 2 × 3, which multiplies back to 24."
      },
      {
        "prompt": "What is the GCF of 18 and 30?",
        "answer": "6",
        "options": [
          "6",
          "3",
          "9",
          "90"
        ],
        "distractors": [
          "3",
          "9",
          "90"
        ],
        "explain": "6 is the greatest number that divides both 18 and 30."
      },
      {
        "prompt": "What is the LCM of 8 and 12?",
        "answer": "24",
        "options": [
          "24",
          "48",
          "96",
          "4"
        ],
        "distractors": [
          "48",
          "96",
          "4"
        ],
        "explain": "24 is the smallest number both 8 and 12 divide into evenly."
      },
      {
        "prompt": "What is the prime factorization of 36?",
        "answer": "2 × 2 × 3 × 3",
        "options": [
          "2 × 2 × 3 × 3",
          "2 × 2 × 9",
          "6 × 6",
          "2 × 3 × 6"
        ],
        "distractors": [
          "2 × 2 × 9",
          "6 × 6",
          "2 × 3 × 6"
        ],
        "explain": "36 = 2 × 2 × 3 × 3, all prime factors that multiply to 36."
      },
      {
        "prompt": "Using the distributive property, 12 + 18 can be written as which expression?",
        "answer": "6 × (2 + 3)",
        "options": [
          "6 × (2 + 3)",
          "6 × (2 + 6)",
          "3 × (4 + 6)",
          "6 × (12 + 18)"
        ],
        "distractors": [
          "6 × (2 + 6)",
          "3 × (4 + 6)",
          "6 × (12 + 18)"
        ],
        "explain": "The GCF of 12 and 18 is 6, and 12 = 6×2 and 18 = 6×3, so 6 × (2 + 3)."
      },
      {
        "prompt": "Using the distributive property, 16 + 24 can be written as which expression?",
        "answer": "8 × (2 + 3)",
        "options": [
          "8 × (2 + 3)",
          "8 × (2 + 4)",
          "4 × (4 + 6)",
          "8 × (16 + 24)"
        ],
        "distractors": [
          "8 × (2 + 4)",
          "4 × (4 + 6)",
          "8 × (16 + 24)"
        ],
        "explain": "The GCF is 8; 16 = 8×2 and 24 = 8×3, so 8 × (2 + 3)."
      },
      {
        "prompt": "A baker has 24 muffins and 36 cookies. She wants the largest equal-size gift boxes using all the treats, with each box having only muffins or only cookies. How many boxes can she make?",
        "answer": "12",
        "options": [
          "12",
          "6",
          "2",
          "60"
        ],
        "distractors": [
          "6",
          "2",
          "60"
        ],
        "explain": "The GCF of 24 and 36 is 12, the largest box count that divides both evenly."
      },
      {
        "prompt": "Hot dogs come in packs of 10 and buns come in packs of 8. What is the least number of each Maria must buy to have an equal number with none left over?",
        "answer": "40",
        "options": [
          "40",
          "80",
          "18",
          "20"
        ],
        "distractors": [
          "80",
          "18",
          "20"
        ],
        "explain": "The LCM of 10 and 8 is 40, the smallest number both pack sizes reach."
      },
      {
        "prompt": "Two friends jog around a track. One finishes a lap every 6 minutes, the other every 9 minutes. After how many minutes will they both be at the start together again?",
        "answer": "18",
        "options": [
          "18",
          "54",
          "3",
          "15"
        ],
        "distractors": [
          "54",
          "3",
          "15"
        ],
        "explain": "The LCM of 6 and 9 is 18 minutes, the first shared lap time."
      },
      {
        "prompt": "A teacher has 30 pencils and 45 erasers to split into identical kits with no leftovers. What is the greatest number of kits she can make?",
        "answer": "15",
        "options": [
          "15",
          "5",
          "3",
          "90"
        ],
        "distractors": [
          "5",
          "3",
          "90"
        ],
        "explain": "The GCF of 30 and 45 is 15, the largest equal number of kits."
      },
      {
        "prompt": "A lighthouse blinks every 12 seconds and a buoy blinks every 18 seconds. They blink together now. How many seconds until they next blink together?",
        "answer": "36",
        "options": [
          "36",
          "72",
          "6",
          "30"
        ],
        "distractors": [
          "72",
          "6",
          "30"
        ],
        "explain": "The LCM of 12 and 18 is 36 seconds."
      },
      {
        "prompt": "A florist has 42 roses and 56 tulips. She makes identical bouquets using all flowers with the greatest number of bouquets possible. How many roses are in each bouquet?",
        "answer": "3",
        "options": [
          "3",
          "14",
          "4",
          "6"
        ],
        "distractors": [
          "14",
          "4",
          "6"
        ],
        "explain": "GCF of 42 and 56 is 14 bouquets; 42 ÷ 14 = 3 roses per bouquet."
      }
    ],
    "worksheetA": [
      {
        "q": "List all the factors of 20.",
        "a": "1, 2, 4, 5, 10, 20"
      },
      {
        "q": "List the first five multiples of 6.",
        "a": "6, 12, 18, 24, 30"
      },
      {
        "q": "Is 17 prime or composite?",
        "a": "Prime"
      },
      {
        "q": "Is 21 prime or composite?",
        "a": "Composite"
      },
      {
        "q": "Find the GCF of 12 and 18.",
        "a": "6"
      },
      {
        "q": "Find the GCF of 24 and 36.",
        "a": "12"
      },
      {
        "q": "Find the LCM of 4 and 6.",
        "a": "12"
      },
      {
        "q": "Find the LCM of 6 and 9.",
        "a": "18"
      },
      {
        "q": "Write the prime factorization of 24.",
        "a": "2 × 2 × 2 × 3"
      },
      {
        "q": "Write the prime factorization of 45.",
        "a": "3 × 3 × 5"
      },
      {
        "q": "Use the distributive property to rewrite 18 + 30 using the GCF.",
        "a": "6 × (3 + 5)"
      },
      {
        "q": "Use the distributive property to rewrite 16 + 24 using the GCF.",
        "a": "8 × (2 + 3)"
      }
    ],
    "worksheetB": [
      {
        "q": "A class has 28 boys and 21 girls. What is the greatest number of equal teams that can be made if each team has only boys or only girls?",
        "a": "7 teams"
      },
      {
        "q": "Plates come in packs of 12 and cups in packs of 8. What is the least number of each you must buy to have an equal number with none left over?",
        "a": "24"
      },
      {
        "q": "One bell rings every 5 minutes and another every 6 minutes. They ring together now. In how many minutes will they ring together again?",
        "a": "30 minutes"
      },
      {
        "q": "A gardener has 36 tulips and 48 daisies. She plants identical rows with the greatest number of flowers per row and no leftovers. How many rows of each can she make?",
        "a": "12 rows"
      },
      {
        "q": "Red lights flash every 8 seconds and blue lights every 12 seconds. After how many seconds will they flash together?",
        "a": "24 seconds"
      },
      {
        "q": "A coach splits 30 soccer balls and 45 cones into identical kits with no leftovers. What is the greatest number of kits?",
        "a": "15 kits"
      },
      {
        "q": "Granola bars come in boxes of 9 and juice boxes come in packs of 6. What is the least number of each to have an equal amount?",
        "a": "18"
      },
      {
        "q": "A librarian has 40 fiction books and 56 nonfiction books to put on shelves with the greatest equal number of books per shelf, kept separate. How many books are on each shelf?",
        "a": "8 books"
      },
      {
        "q": "Two ferris wheels start together. One takes 10 minutes per spin, the other 15 minutes. After how many minutes do they both finish a spin at the same time?",
        "a": "30 minutes"
      },
      {
        "q": "A baker uses the distributive property to combine 24 plain cookies and 36 chocolate cookies into equal-size trays. Write the expression that shows the greatest tray size.",
        "a": "12 × (2 + 3)"
      },
      {
        "q": "A number is prime, is greater than 10, and is less than 14. What is the number?",
        "a": "11 or 13"
      },
      {
        "q": "★ A music teacher has 42 trumpets and 56 flutes. She wants the greatest number of identical instrument sets with none left over, and each set holds only one kind of instrument. How many sets can she make, and how many of each instrument are in one set?",
        "a": "14 sets; 3 trumpets and 4 flutes per set"
      }
    ],
    "preQuiz": [
      {
        "prompt": "Which list shows all the factors of 10?",
        "answer": "1, 2, 5, 10",
        "options": [
          "1, 2, 5, 10",
          "1, 2, 10",
          "2, 5",
          "1, 5, 10"
        ],
        "distractors": [
          "1, 2, 10",
          "2, 5",
          "1, 5, 10"
        ],
        "explain": "10 divides evenly by 1, 2, 5, and 10."
      },
      {
        "prompt": "Which number is a multiple of 6?",
        "answer": "24",
        "options": [
          "24",
          "26",
          "15",
          "34"
        ],
        "distractors": [
          "26",
          "15",
          "34"
        ],
        "explain": "24 = 6 × 4, so it is a multiple of 6."
      },
      {
        "prompt": "Is the number 11 prime or composite?",
        "answer": "Prime",
        "options": [
          "Prime",
          "Composite",
          "Neither",
          "Both"
        ],
        "distractors": [
          "Composite",
          "Neither",
          "Both"
        ],
        "explain": "11 has only the factors 1 and 11, so it is prime."
      },
      {
        "prompt": "What is the GCF of 12 and 18?",
        "answer": "6",
        "options": [
          "6",
          "3",
          "2",
          "36"
        ],
        "distractors": [
          "3",
          "2",
          "36"
        ],
        "explain": "6 is the greatest number that divides both 12 and 18."
      },
      {
        "prompt": "What is the LCM of 3 and 4?",
        "answer": "12",
        "options": [
          "12",
          "24",
          "7",
          "1"
        ],
        "distractors": [
          "24",
          "7",
          "1"
        ],
        "explain": "12 is the smallest number both 3 and 4 divide into evenly."
      },
      {
        "prompt": "What is the prime factorization of 12?",
        "answer": "2 × 2 × 3",
        "options": [
          "2 × 2 × 3",
          "2 × 6",
          "3 × 4",
          "2 × 2 × 2"
        ],
        "distractors": [
          "2 × 6",
          "3 × 4",
          "2 × 2 × 2"
        ],
        "explain": "12 = 2 × 2 × 3, all prime factors."
      },
      {
        "prompt": "Using the distributive property, 12 + 18 can be written as which expression?",
        "answer": "6 × (2 + 3)",
        "options": [
          "6 × (2 + 3)",
          "6 × (2 + 6)",
          "3 × (4 + 6)",
          "6 × (12 + 18)"
        ],
        "distractors": [
          "6 × (2 + 6)",
          "3 × (4 + 6)",
          "6 × (12 + 18)"
        ],
        "explain": "The GCF is 6; 12 = 6×2 and 18 = 6×3, so 6 × (2 + 3)."
      },
      {
        "prompt": "Tennis balls come in cans of 4 and players come in groups of 6. What is the least number you need to have an equal number with none left over?",
        "answer": "12",
        "options": [
          "12",
          "24",
          "10",
          "2"
        ],
        "distractors": [
          "24",
          "10",
          "2"
        ],
        "explain": "The LCM of 4 and 6 is 12."
      }
    ],
    "postQuiz": [
      {
        "prompt": "Which list shows all the factors of 16?",
        "answer": "1, 2, 4, 8, 16",
        "options": [
          "1, 2, 4, 8, 16",
          "1, 2, 4, 16",
          "2, 4, 8",
          "1, 4, 8, 16"
        ],
        "distractors": [
          "1, 2, 4, 16",
          "2, 4, 8",
          "1, 4, 8, 16"
        ],
        "explain": "16 divides evenly by 1, 2, 4, 8, and 16."
      },
      {
        "prompt": "Which number is a multiple of 7?",
        "answer": "28",
        "options": [
          "28",
          "27",
          "32",
          "17"
        ],
        "distractors": [
          "27",
          "32",
          "17"
        ],
        "explain": "28 = 7 × 4, so it is a multiple of 7."
      },
      {
        "prompt": "Is the number 13 prime or composite?",
        "answer": "Prime",
        "options": [
          "Prime",
          "Composite",
          "Neither",
          "Both"
        ],
        "distractors": [
          "Composite",
          "Neither",
          "Both"
        ],
        "explain": "13 has only the factors 1 and 13, so it is prime."
      },
      {
        "prompt": "What is the GCF of 20 and 30?",
        "answer": "10",
        "options": [
          "10",
          "5",
          "2",
          "60"
        ],
        "distractors": [
          "5",
          "2",
          "60"
        ],
        "explain": "10 is the greatest number that divides both 20 and 30."
      },
      {
        "prompt": "What is the LCM of 4 and 5?",
        "answer": "20",
        "options": [
          "20",
          "40",
          "9",
          "1"
        ],
        "distractors": [
          "40",
          "9",
          "1"
        ],
        "explain": "20 is the smallest number both 4 and 5 divide into evenly."
      },
      {
        "prompt": "What is the prime factorization of 40?",
        "answer": "2 × 2 × 2 × 5",
        "options": [
          "2 × 2 × 2 × 5",
          "2 × 2 × 5",
          "4 × 10",
          "2 × 4 × 5"
        ],
        "distractors": [
          "2 × 2 × 5",
          "4 × 10",
          "2 × 4 × 5"
        ],
        "explain": "40 = 2 × 2 × 2 × 5, all prime factors."
      },
      {
        "prompt": "Using the distributive property, 15 + 20 can be written as which expression?",
        "answer": "5 × (3 + 4)",
        "options": [
          "5 × (3 + 4)",
          "5 × (3 + 5)",
          "3 × (5 + 7)",
          "5 × (15 + 20)"
        ],
        "distractors": [
          "5 × (3 + 5)",
          "3 × (5 + 7)",
          "5 × (15 + 20)"
        ],
        "explain": "The GCF is 5; 15 = 5×3 and 20 = 5×4, so 5 × (3 + 4)."
      },
      {
        "prompt": "Pencils come in boxes of 9 and erasers in boxes of 12. What is the least number of each you must buy to have an equal amount with none left over?",
        "answer": "36",
        "options": [
          "36",
          "72",
          "21",
          "108"
        ],
        "distractors": [
          "72",
          "21",
          "108"
        ],
        "explain": "The LCM of 9 and 12 is 36."
      }
    ]
  },
  {
    "slug": "fraction-sense",
    "title": "Fraction Sense",
    "icon": "🍕",
    "accent": "#c2410c",
    "standard": "Builds 6.NS.A.1",
    "domain": "Fractions & Decimals",
    "blurb": "Compare and compute with fractions with real understanding — the make-or-break skill for ratios and rates.",
    "skills": [
      "Equivalence",
      "Add / subtract",
      "Multiply / divide",
      "Simplify"
    ],
    "lessons": 4,
    "objective": "I can find equivalent fractions, write fractions in simplest form, compare fractions, add and subtract fractions with unlike denominators, and multiply and divide fractions.",
    "estMin": 30,
    "vocab": [
      {
        "term": "Numerator",
        "def": "The top number; how many parts you have."
      },
      {
        "term": "Denominator",
        "def": "The bottom number; how many equal parts in all."
      },
      {
        "term": "Equivalent fractions",
        "def": "Different fractions that name the same amount."
      },
      {
        "term": "Simplest form",
        "def": "A fraction with no common factor left but 1."
      },
      {
        "term": "Common denominator",
        "def": "The same bottom number shared by two fractions."
      },
      {
        "term": "Reciprocal",
        "def": "A fraction flipped upside down."
      }
    ],
    "materials": [
      "Fraction strips or fraction tiles",
      "Whiteboard and dry-erase markers",
      "Pencil and lined paper",
      "Colored pencils for shading models"
    ],
    "workedExamples": [
      {
        "problem": "Write 6/8 in simplest form.",
        "steps": [
          "Find a number that divides both 6 and 8. Both share the factor 2.",
          "Divide the top: 6 divided by 2 equals 3.",
          "Divide the bottom: 8 divided by 2 equals 4.",
          "Check 3/4: the only common factor of 3 and 4 is 1, so it is done."
        ],
        "answer": "3/4"
      },
      {
        "problem": "Add 1/3 + 2/5.",
        "steps": [
          "The denominators 3 and 5 are different, so find a common denominator. Multiply 3 x 5 = 15.",
          "Rename 1/3: multiply top and bottom by 5 to get 5/15.",
          "Rename 2/5: multiply top and bottom by 3 to get 6/15.",
          "Add the numerators: 5/15 + 6/15 = 11/15. It is already in simplest form."
        ],
        "answer": "11/15"
      },
      {
        "problem": "Divide 3/4 ÷ 2/3.",
        "steps": [
          "Keep the first fraction the same: 3/4.",
          "Change divide to multiply and flip the second fraction (its reciprocal): 2/3 becomes 3/2.",
          "Multiply across: 3 x 3 = 9 on top and 4 x 2 = 8 on the bottom, giving 9/8.",
          "Write 9/8 as a mixed number: 9 divided by 8 is 1 with remainder 1, so 1 1/8."
        ],
        "answer": "1 1/8"
      }
    ],
    "bank": [
      {
        "prompt": "Which fraction is equivalent to 1/2?",
        "answer": "2/4",
        "options": [
          "2/4",
          "1/4",
          "2/3",
          "3/4"
        ],
        "distractors": [
          "1/4",
          "2/3",
          "3/4"
        ],
        "explain": "Multiply 1/2 top and bottom by 2 to get 2/4."
      },
      {
        "prompt": "What is the numerator in the fraction 3/7?",
        "answer": "3",
        "options": [
          "3",
          "7",
          "10",
          "4"
        ],
        "distractors": [
          "7",
          "10",
          "4"
        ],
        "explain": "The numerator is the top number, which is 3."
      },
      {
        "prompt": "Write 4/8 in simplest form.",
        "answer": "1/2",
        "options": [
          "1/2",
          "2/4",
          "4/8",
          "1/4"
        ],
        "distractors": [
          "2/4",
          "4/8",
          "1/4"
        ],
        "explain": "Divide top and bottom by 4 to get 1/2."
      },
      {
        "prompt": "Which fraction is equivalent to 2/3?",
        "answer": "4/6",
        "options": [
          "4/6",
          "3/4",
          "2/6",
          "4/3"
        ],
        "distractors": [
          "3/4",
          "2/6",
          "4/3"
        ],
        "explain": "Multiply 2/3 top and bottom by 2 to get 4/6."
      },
      {
        "prompt": "Which symbol makes this true: 3/5 ___ 2/5?",
        "answer": ">",
        "options": [
          ">",
          "<",
          "=",
          "+"
        ],
        "distractors": [
          "<",
          "=",
          "+"
        ],
        "explain": "With the same denominator, 3 fifths is more than 2 fifths."
      },
      {
        "prompt": "Write 10/15 in simplest form.",
        "answer": "2/3",
        "options": [
          "2/3",
          "5/15",
          "10/15",
          "3/5"
        ],
        "distractors": [
          "5/15",
          "10/15",
          "3/5"
        ],
        "explain": "Divide top and bottom by 5 to get 2/3."
      },
      {
        "prompt": "What is 1/5 + 2/5?",
        "answer": "3/5",
        "options": [
          "3/5",
          "3/10",
          "2/5",
          "3/25"
        ],
        "distractors": [
          "3/10",
          "2/5",
          "3/25"
        ],
        "explain": "Same denominator: add the tops, 1 + 2 = 3, to get 3/5."
      },
      {
        "prompt": "What is 5/6 - 1/6?",
        "answer": "2/3",
        "options": [
          "2/3",
          "4/6",
          "1/6",
          "4/12"
        ],
        "distractors": [
          "4/6",
          "1/6",
          "4/12"
        ],
        "explain": "5/6 - 1/6 = 4/6, which simplifies to 2/3."
      },
      {
        "prompt": "Which fraction is greater, 3/4 or 2/3?",
        "answer": "3/4",
        "options": [
          "3/4",
          "2/3",
          "they are equal",
          "4/3"
        ],
        "distractors": [
          "2/3",
          "they are equal",
          "4/3"
        ],
        "explain": "Using twelfths, 3/4 = 9/12 and 2/3 = 8/12, so 3/4 is greater."
      },
      {
        "prompt": "What is 1/2 of 1/3 (1/2 x 1/3)?",
        "answer": "1/6",
        "options": [
          "1/6",
          "2/5",
          "1/5",
          "2/6"
        ],
        "distractors": [
          "2/5",
          "1/5",
          "2/6"
        ],
        "explain": "Multiply tops 1x1=1 and bottoms 2x3=6 to get 1/6."
      },
      {
        "prompt": "What is 2/3 x 3/4?",
        "answer": "1/2",
        "options": [
          "1/2",
          "5/7",
          "6/7",
          "2/4"
        ],
        "distractors": [
          "5/7",
          "6/7",
          "2/4"
        ],
        "explain": "2/3 x 3/4 = 6/12, which simplifies to 1/2."
      },
      {
        "prompt": "What is 1/2 + 1/4?",
        "answer": "3/4",
        "options": [
          "3/4",
          "2/6",
          "1/3",
          "2/8"
        ],
        "distractors": [
          "2/6",
          "1/3",
          "2/8"
        ],
        "explain": "Rename 1/2 as 2/4, then 2/4 + 1/4 = 3/4."
      },
      {
        "prompt": "What is the reciprocal of 3/5?",
        "answer": "5/3",
        "options": [
          "5/3",
          "3/5",
          "1/5",
          "5/5"
        ],
        "distractors": [
          "3/5",
          "1/5",
          "5/5"
        ],
        "explain": "Flip the fraction upside down to get 5/3."
      },
      {
        "prompt": "What is 2/3 + 1/6?",
        "answer": "5/6",
        "options": [
          "5/6",
          "3/9",
          "3/6",
          "5/9"
        ],
        "distractors": [
          "3/9",
          "3/6",
          "5/9"
        ],
        "explain": "Rename 2/3 as 4/6, then 4/6 + 1/6 = 5/6."
      },
      {
        "prompt": "What is 3/4 - 1/3?",
        "answer": "5/12",
        "options": [
          "5/12",
          "2/1",
          "2/12",
          "1/12"
        ],
        "distractors": [
          "2/1",
          "2/12",
          "1/12"
        ],
        "explain": "Rename to twelfths: 9/12 - 4/12 = 5/12."
      },
      {
        "prompt": "What is 4/5 x 10?",
        "answer": "8",
        "options": [
          "8",
          "40/5",
          "4/50",
          "14/5"
        ],
        "distractors": [
          "40/5",
          "4/50",
          "14/5"
        ],
        "explain": "4/5 x 10 = 40/5 = 8."
      },
      {
        "prompt": "What is 1/2 ÷ 1/4?",
        "answer": "2",
        "options": [
          "2",
          "1/8",
          "1/2",
          "8"
        ],
        "distractors": [
          "1/8",
          "1/2",
          "8"
        ],
        "explain": "Multiply by the reciprocal: 1/2 x 4/1 = 4/2 = 2."
      },
      {
        "prompt": "What is 3/8 ÷ 1/2?",
        "answer": "3/4",
        "options": [
          "3/4",
          "3/16",
          "6/8",
          "4/3"
        ],
        "distractors": [
          "3/16",
          "6/8",
          "4/3"
        ],
        "explain": "3/8 x 2/1 = 6/8, which simplifies to 3/4."
      },
      {
        "prompt": "A recipe needs 2/3 cup of sugar. You make half the recipe. How much sugar do you need?",
        "answer": "1/3 cup",
        "options": [
          "1/3 cup",
          "1/6 cup",
          "2/6 cup",
          "4/3 cup"
        ],
        "distractors": [
          "1/6 cup",
          "2/6 cup",
          "4/3 cup"
        ],
        "explain": "Half of 2/3 is 1/2 x 2/3 = 2/6 = 1/3 cup."
      },
      {
        "prompt": "Maria ran 3/4 mile and Sam ran 5/8 mile. How much farther did Maria run?",
        "answer": "1/8 mile",
        "options": [
          "1/8 mile",
          "2/4 mile",
          "2/8 mile",
          "1/4 mile"
        ],
        "distractors": [
          "2/4 mile",
          "2/8 mile",
          "1/4 mile"
        ],
        "explain": "Rename 3/4 as 6/8, then 6/8 - 5/8 = 1/8 mile."
      },
      {
        "prompt": "A pizza is cut into 8 slices. Ben eats 1/4 of the pizza. How many slices is that?",
        "answer": "2 slices",
        "options": [
          "2 slices",
          "4 slices",
          "1 slice",
          "3 slices"
        ],
        "distractors": [
          "4 slices",
          "1 slice",
          "3 slices"
        ],
        "explain": "1/4 of 8 is 1/4 x 8 = 8/4 = 2 slices."
      },
      {
        "prompt": "You have 3/4 of a yard of ribbon and cut it into pieces 1/8 yard long. How many pieces do you get?",
        "answer": "6 pieces",
        "options": [
          "6 pieces",
          "3 pieces",
          "4 pieces",
          "8 pieces"
        ],
        "distractors": [
          "3 pieces",
          "4 pieces",
          "8 pieces"
        ],
        "explain": "3/4 ÷ 1/8 = 3/4 x 8/1 = 24/4 = 6 pieces."
      },
      {
        "prompt": "A water tank is 5/6 full. After use it is 1/3 full. What fraction of the tank was used?",
        "answer": "1/2",
        "options": [
          "1/2",
          "4/3",
          "2/3",
          "4/6"
        ],
        "distractors": [
          "4/3",
          "2/3",
          "4/6"
        ],
        "explain": "Rename 1/3 as 2/6, then 5/6 - 2/6 = 3/6 = 1/2."
      },
      {
        "prompt": "A board is 2 1/2 feet long. You need pieces that are 1/2 foot each. How many pieces can you cut?",
        "answer": "5 pieces",
        "options": [
          "5 pieces",
          "2 pieces",
          "4 pieces",
          "10 pieces"
        ],
        "distractors": [
          "2 pieces",
          "4 pieces",
          "10 pieces"
        ],
        "explain": "2 1/2 = 5/2, and 5/2 ÷ 1/2 = 5/2 x 2/1 = 10/2 = 5 pieces."
      }
    ],
    "worksheetA": [
      {
        "q": "Write 2/4 in simplest form.",
        "a": "1/2"
      },
      {
        "q": "Fill in the blank: 1/3 = ?/9",
        "a": "3"
      },
      {
        "q": "Write 9/12 in simplest form.",
        "a": "3/4"
      },
      {
        "q": "Compare using <, >, or =: 3/8 ___ 5/8",
        "a": "<"
      },
      {
        "q": "Add: 2/7 + 3/7",
        "a": "5/7"
      },
      {
        "q": "Subtract: 7/10 - 3/10",
        "a": "4/10 = 2/5"
      },
      {
        "q": "Add: 1/2 + 1/3",
        "a": "5/6"
      },
      {
        "q": "Subtract: 5/6 - 1/4",
        "a": "7/12"
      },
      {
        "q": "Multiply: 2/5 x 3/4",
        "a": "6/20 = 3/10"
      },
      {
        "q": "Multiply: 3/8 x 4",
        "a": "12/8 = 3/2 = 1 1/2"
      },
      {
        "q": "Divide: 2/3 ÷ 1/6",
        "a": "4"
      },
      {
        "q": "Divide: 4/5 ÷ 2/3",
        "a": "12/10 = 6/5 = 1 1/5"
      }
    ],
    "worksheetB": [
      {
        "q": "A cake recipe uses 3/4 cup of flour. You triple the recipe. How much flour do you need?",
        "a": "9/4 = 2 1/4 cups"
      },
      {
        "q": "Jenna walked 2/3 mile to school and 1/4 mile to the library. How far did she walk in all?",
        "a": "11/12 mile"
      },
      {
        "q": "A ribbon is 7/8 yard long. You use 1/2 yard. How much ribbon is left?",
        "a": "3/8 yard"
      },
      {
        "q": "There are 12 cookies. Tom takes 1/3 of them. How many cookies does Tom take?",
        "a": "4 cookies"
      },
      {
        "q": "A juice jug holds 3/4 gallon. You pour it into cups that hold 1/8 gallon. How many cups can you fill?",
        "a": "6 cups"
      },
      {
        "q": "Half of a garden is planted. Of that planted part, 1/3 is tomatoes. What fraction of the whole garden is tomatoes?",
        "a": "1/6"
      },
      {
        "q": "Liam read 2/5 of a book on Monday and 1/4 on Tuesday. What fraction did he read in all?",
        "a": "13/20"
      },
      {
        "q": "A board is 5/6 foot long. You cut off 1/3 foot. How long is the remaining piece?",
        "a": "1/2 foot"
      },
      {
        "q": "A bottle has 2/3 liter of water. You drink 1/2 of what is in the bottle. How much did you drink?",
        "a": "1/3 liter"
      },
      {
        "q": "A wall needs 4/5 gallon of paint per coat. How much paint is needed for 3 coats?",
        "a": "12/5 = 2 2/5 gallons"
      },
      {
        "q": "A trail is 9/10 mile. Rest stops are every 3/10 mile. How many 3/10-mile sections are in the trail?",
        "a": "3 sections"
      },
      {
        "q": "★ A pitcher holds 3 1/2 cups of lemonade. Each glass holds 1/4 cup. How many full glasses can you pour, and how much lemonade is left over?",
        "a": "14 glasses, 0 left over"
      }
    ],
    "preQuiz": [
      {
        "prompt": "Which fraction is equivalent to 1/3?",
        "answer": "2/6",
        "options": [
          "2/6",
          "1/6",
          "2/3",
          "3/6"
        ],
        "distractors": [
          "1/6",
          "2/3",
          "3/6"
        ],
        "explain": "Multiply 1/3 top and bottom by 2 to get 2/6."
      },
      {
        "prompt": "Write 6/9 in simplest form.",
        "answer": "2/3",
        "options": [
          "2/3",
          "3/9",
          "6/9",
          "1/3"
        ],
        "distractors": [
          "3/9",
          "6/9",
          "1/3"
        ],
        "explain": "Divide top and bottom by 3 to get 2/3."
      },
      {
        "prompt": "Compare: 2/5 ___ 4/5",
        "answer": "<",
        "options": [
          "<",
          ">",
          "=",
          "+"
        ],
        "distractors": [
          ">",
          "=",
          "+"
        ],
        "explain": "With the same denominator, 2 fifths is less than 4 fifths."
      },
      {
        "prompt": "What is 1/8 + 3/8?",
        "answer": "1/2",
        "options": [
          "1/2",
          "4/16",
          "3/8",
          "4/8 only"
        ],
        "distractors": [
          "4/16",
          "3/8",
          "4/8 only"
        ],
        "explain": "1/8 + 3/8 = 4/8, which simplifies to 1/2."
      },
      {
        "prompt": "What is 2/3 - 1/6?",
        "answer": "1/2",
        "options": [
          "1/2",
          "1/3",
          "3/6 wrong reduce",
          "1/6"
        ],
        "distractors": [
          "1/3",
          "3/6 wrong reduce",
          "1/6"
        ],
        "explain": "Rename 2/3 as 4/6, then 4/6 - 1/6 = 3/6 = 1/2."
      },
      {
        "prompt": "What is 3/5 x 2/3?",
        "answer": "2/5",
        "options": [
          "2/5",
          "5/8",
          "6/8",
          "2/3"
        ],
        "distractors": [
          "5/8",
          "6/8",
          "2/3"
        ],
        "explain": "3/5 x 2/3 = 6/15, which simplifies to 2/5."
      },
      {
        "prompt": "What is 1/2 ÷ 1/6?",
        "answer": "3",
        "options": [
          "3",
          "1/12",
          "1/3",
          "6"
        ],
        "distractors": [
          "1/12",
          "1/3",
          "6"
        ],
        "explain": "Multiply by the reciprocal: 1/2 x 6/1 = 6/2 = 3."
      },
      {
        "prompt": "A recipe needs 3/4 cup of milk. You make half. How much milk do you need?",
        "answer": "3/8 cup",
        "options": [
          "3/8 cup",
          "3/2 cup",
          "1/4 cup",
          "6/4 cup"
        ],
        "distractors": [
          "3/2 cup",
          "1/4 cup",
          "6/4 cup"
        ],
        "explain": "Half of 3/4 is 1/2 x 3/4 = 3/8 cup."
      }
    ],
    "postQuiz": [
      {
        "prompt": "Which fraction is equivalent to 1/4?",
        "answer": "2/8",
        "options": [
          "2/8",
          "1/8",
          "2/4",
          "3/8"
        ],
        "distractors": [
          "1/8",
          "2/4",
          "3/8"
        ],
        "explain": "Multiply 1/4 top and bottom by 2 to get 2/8."
      },
      {
        "prompt": "Write 8/12 in simplest form.",
        "answer": "2/3",
        "options": [
          "2/3",
          "4/12",
          "8/12",
          "1/3"
        ],
        "distractors": [
          "4/12",
          "8/12",
          "1/3"
        ],
        "explain": "Divide top and bottom by 4 to get 2/3."
      },
      {
        "prompt": "Compare: 5/8 ___ 3/8",
        "answer": ">",
        "options": [
          ">",
          "<",
          "=",
          "-"
        ],
        "distractors": [
          "<",
          "=",
          "-"
        ],
        "explain": "With the same denominator, 5 eighths is more than 3 eighths."
      },
      {
        "prompt": "What is 2/9 + 4/9?",
        "answer": "2/3",
        "options": [
          "2/3",
          "6/18",
          "6/9 only",
          "2/9"
        ],
        "distractors": [
          "6/18",
          "6/9 only",
          "2/9"
        ],
        "explain": "2/9 + 4/9 = 6/9, which simplifies to 2/3."
      },
      {
        "prompt": "What is 3/4 - 1/8?",
        "answer": "5/8",
        "options": [
          "5/8",
          "2/4",
          "2/8",
          "1/8"
        ],
        "distractors": [
          "2/4",
          "2/8",
          "1/8"
        ],
        "explain": "Rename 3/4 as 6/8, then 6/8 - 1/8 = 5/8."
      },
      {
        "prompt": "What is 2/5 x 5/6?",
        "answer": "1/3",
        "options": [
          "1/3",
          "7/11",
          "4/6",
          "2/6"
        ],
        "distractors": [
          "7/11",
          "4/6",
          "2/6"
        ],
        "explain": "2/5 x 5/6 = 10/30, which simplifies to 1/3."
      },
      {
        "prompt": "What is 1/3 ÷ 1/9?",
        "answer": "3",
        "options": [
          "3",
          "1/27",
          "1/3",
          "9"
        ],
        "distractors": [
          "1/27",
          "1/3",
          "9"
        ],
        "explain": "Multiply by the reciprocal: 1/3 x 9/1 = 9/3 = 3."
      },
      {
        "prompt": "A board is 5/6 foot long. You use 1/2 of it. How much do you use?",
        "answer": "5/12 foot",
        "options": [
          "5/12 foot",
          "5/3 foot",
          "1/3 foot",
          "10/6 foot"
        ],
        "distractors": [
          "5/3 foot",
          "1/3 foot",
          "10/6 foot"
        ],
        "explain": "Half of 5/6 is 1/2 x 5/6 = 5/12 foot."
      }
    ]
  },
  {
    "slug": "decimals-place-value",
    "title": "Decimals & Place Value",
    "icon": "💯",
    "accent": "#2c7d6b",
    "standard": "Builds 6.NS.B.3",
    "domain": "Fractions & Decimals",
    "blurb": "Read, compare, round, and compute with decimals — the foundation for money, measurement, and percents.",
    "skills": [
      "Place value",
      "Compare & round",
      "Operate",
      "Money"
    ],
    "lessons": 4,
    "objective": "I can read, compare, and round decimals and add, subtract, multiply, and divide decimals to solve money and measurement problems.",
    "estMin": 30,
    "vocab": [
      {
        "term": "decimal",
        "def": "A number with a dot showing parts smaller than one."
      },
      {
        "term": "place value",
        "def": "The value a digit has from its position."
      },
      {
        "term": "tenths",
        "def": "The first place right after the decimal point."
      },
      {
        "term": "hundredths",
        "def": "The second place right after the decimal point."
      },
      {
        "term": "round",
        "def": "To make a number simpler but close in value."
      },
      {
        "term": "product",
        "def": "The answer when you multiply two numbers."
      }
    ],
    "materials": [
      "Place value chart",
      "Base-ten blocks or decimal grids",
      "Pencil and grid paper",
      "Play money (coins and bills)"
    ],
    "workedExamples": [
      {
        "problem": "Compare 0.6 and 0.58. Which is greater?",
        "steps": [
          "Write both with the same number of places: 0.60 and 0.58.",
          "Compare the tenths: 6 tenths versus 5 tenths.",
          "Since 6 is greater than 5, 0.60 is greater.",
          "So 0.6 > 0.58."
        ],
        "answer": "0.6 is greater"
      },
      {
        "problem": "Add 7.45 + 12.8.",
        "steps": [
          "Line up the decimal points and add a zero: 12.80.",
          "Add hundredths: 5 + 0 = 5.",
          "Add tenths: 4 + 8 = 12, write 2 and carry 1.",
          "Add ones: 7 + 2 + 1 = 10, write 0 carry 1; then 1 + 1 = 2.",
          "The sum is 20.25."
        ],
        "answer": "20.25"
      },
      {
        "problem": "A car travels 48.6 miles on 6 gallons of gas. Find the miles per gallon.",
        "steps": [
          "Set up the division: 48.6 / 6.",
          "Place the decimal point in the answer straight above its spot.",
          "Divide: 48 / 6 = 8, then bring down the 6 tenths.",
          "6 tenths / 6 = 1 tenth, giving 8.1.",
          "The car gets 8.1 miles per gallon."
        ],
        "answer": "8.1 miles per gallon"
      }
    ],
    "bank": [
      {
        "prompt": "What is the value of the 7 in 4.73?",
        "answer": "7 tenths",
        "options": [
          "7 tenths",
          "7 ones",
          "7 hundredths",
          "7 thousandths"
        ],
        "distractors": [
          "7 ones",
          "7 hundredths",
          "7 thousandths"
        ],
        "explain": "The first digit after the decimal point is the tenths place."
      },
      {
        "prompt": "How do you read the decimal 0.6?",
        "answer": "six tenths",
        "options": [
          "six tenths",
          "six hundredths",
          "sixty",
          "six ones"
        ],
        "distractors": [
          "six hundredths",
          "sixty",
          "six ones"
        ],
        "explain": "One digit after the decimal point names the tenths place."
      },
      {
        "prompt": "Which decimal is the largest?",
        "answer": "0.5",
        "options": [
          "0.5",
          "0.45",
          "0.05",
          "0.49"
        ],
        "distractors": [
          "0.45",
          "0.05",
          "0.49"
        ],
        "explain": "0.50 is bigger than 0.49, 0.45, and 0.05 when you compare tenths first."
      },
      {
        "prompt": "Round 3.7 to the nearest whole number.",
        "answer": "4",
        "options": [
          "4",
          "3",
          "3.5",
          "5"
        ],
        "distractors": [
          "3",
          "3.5",
          "5"
        ],
        "explain": "Since the tenths digit 7 is 5 or more, round up to 4."
      },
      {
        "prompt": "Which symbol makes this true: 0.3 ___ 0.30 ?",
        "answer": "=",
        "options": [
          "=",
          "<",
          ">",
          "+"
        ],
        "distractors": [
          "<",
          ">",
          "+"
        ],
        "explain": "0.30 is the same value as 0.3 because the extra zero adds nothing."
      },
      {
        "prompt": "Round 5.48 to the nearest tenth.",
        "answer": "5.5",
        "options": [
          "5.5",
          "5.4",
          "5.0",
          "6.0"
        ],
        "distractors": [
          "5.4",
          "5.0",
          "6.0"
        ],
        "explain": "The hundredths digit 8 is 5 or more, so the tenths digit rounds up."
      },
      {
        "prompt": "What is 0.9 - 0.45 ?",
        "answer": "0.45",
        "options": [
          "0.45",
          "0.55",
          "0.35",
          "0.5"
        ],
        "distractors": [
          "0.55",
          "0.35",
          "0.5"
        ],
        "explain": "Line up 0.90 and 0.45, then subtract to get 0.45."
      },
      {
        "prompt": "What is 7.45 + 12.8 ?",
        "answer": "20.25",
        "options": [
          "20.25",
          "19.53",
          "20.5",
          "8.73"
        ],
        "distractors": [
          "19.53",
          "20.5",
          "8.73"
        ],
        "explain": "Line up the decimal points: 7.45 + 12.80 = 20.25."
      },
      {
        "prompt": "What is 20 - 13.6 ?",
        "answer": "6.4",
        "options": [
          "6.4",
          "7.4",
          "6.6",
          "13.4"
        ],
        "distractors": [
          "7.4",
          "6.6",
          "13.4"
        ],
        "explain": "Write 20 as 20.0, then subtract 13.6 to get 6.4."
      },
      {
        "prompt": "What is 5.6 x 0.4 ?",
        "answer": "2.24",
        "options": [
          "2.24",
          "22.4",
          "0.224",
          "2.4"
        ],
        "distractors": [
          "22.4",
          "0.224",
          "2.4"
        ],
        "explain": "Multiply 56 x 4 = 224, then place 2 decimal digits: 2.24."
      },
      {
        "prompt": "What is 0.45 x 0.3 ?",
        "answer": "0.135",
        "options": [
          "0.135",
          "1.35",
          "0.15",
          "13.5"
        ],
        "distractors": [
          "1.35",
          "0.15",
          "13.5"
        ],
        "explain": "45 x 3 = 135, and 3 decimal places gives 0.135."
      },
      {
        "prompt": "What is 9.6 / 0.4 ?",
        "answer": "24",
        "options": [
          "24",
          "2.4",
          "240",
          "0.24"
        ],
        "distractors": [
          "2.4",
          "240",
          "0.24"
        ],
        "explain": "Multiply both numbers by 10: 96 / 4 = 24."
      },
      {
        "prompt": "What is 14.4 / 1.2 ?",
        "answer": "12",
        "options": [
          "12",
          "1.2",
          "120",
          "2.4"
        ],
        "distractors": [
          "1.2",
          "120",
          "2.4"
        ],
        "explain": "Move both decimals one place: 144 / 12 = 12."
      },
      {
        "prompt": "What is 48.6 / 6 ?",
        "answer": "8.1",
        "options": [
          "8.1",
          "8.0",
          "9.1",
          "0.81"
        ],
        "distractors": [
          "8.0",
          "9.1",
          "0.81"
        ],
        "explain": "48.6 divided by 6 is 8.1, keeping the decimal point in line."
      },
      {
        "prompt": "A pencil costs $0.99. How much do 3 pencils cost?",
        "answer": "$2.97",
        "options": [
          "$2.97",
          "$3.00",
          "$2.70",
          "$2.99"
        ],
        "distractors": [
          "$3.00",
          "$2.70",
          "$2.99"
        ],
        "explain": "3 x $0.99 = $2.97."
      },
      {
        "prompt": "You buy items for $5.75, $2.50, and $0.80. What is the total?",
        "answer": "$9.05",
        "options": [
          "$9.05",
          "$8.05",
          "$9.50",
          "$8.95"
        ],
        "distractors": [
          "$8.05",
          "$9.50",
          "$8.95"
        ],
        "explain": "$5.75 + $2.50 + $0.80 = $9.05."
      },
      {
        "prompt": "You pay for a $37.89 item with $100. How much change do you get?",
        "answer": "$62.11",
        "options": [
          "$62.11",
          "$62.21",
          "$73.11",
          "$63.11"
        ],
        "distractors": [
          "$62.21",
          "$73.11",
          "$63.11"
        ],
        "explain": "$100.00 - $37.89 = $62.11."
      },
      {
        "prompt": "A ribbon is 2.4 meters long. You use 1.5 times that for a project. How many meters do you use?",
        "answer": "3.6 m",
        "options": [
          "3.6 m",
          "3.9 m",
          "0.9 m",
          "36 m"
        ],
        "distractors": [
          "3.9 m",
          "0.9 m",
          "36 m"
        ],
        "explain": "2.4 x 1.5 = 3.6 meters."
      },
      {
        "prompt": "A car goes 48.6 miles on 6 gallons of gas. How many miles per gallon is that?",
        "answer": "8.1 miles",
        "options": [
          "8.1 miles",
          "8.0 miles",
          "9.1 miles",
          "42.6 miles"
        ],
        "distractors": [
          "8.0 miles",
          "9.1 miles",
          "42.6 miles"
        ],
        "explain": "48.6 / 6 = 8.1 miles per gallon."
      },
      {
        "prompt": "Rope that is 7.8 meters long is cut into 4 equal pieces. How long is each piece?",
        "answer": "1.95 m",
        "options": [
          "1.95 m",
          "1.9 m",
          "2.0 m",
          "3.8 m"
        ],
        "distractors": [
          "1.9 m",
          "2.0 m",
          "3.8 m"
        ],
        "explain": "7.8 / 4 = 1.95 meters."
      },
      {
        "prompt": "A bottle holds 1.25 liters. How many liters do 8 bottles hold?",
        "answer": "10 liters",
        "options": [
          "10 liters",
          "9 liters",
          "12.5 liters",
          "1 liter"
        ],
        "distractors": [
          "9 liters",
          "12.5 liters",
          "1 liter"
        ],
        "explain": "1.25 x 8 = 10 liters."
      },
      {
        "prompt": "Maya saves $2.50, $3.75, and $1.20 in three weeks. How much has she saved?",
        "answer": "$7.45",
        "options": [
          "$7.45",
          "$6.45",
          "$7.55",
          "$8.45"
        ],
        "distractors": [
          "$6.45",
          "$7.55",
          "$8.45"
        ],
        "explain": "$2.50 + $3.75 + $1.20 = $7.45."
      },
      {
        "prompt": "Apples cost $3.25 per bag. With a $25 bill, how much change do you get after buying 4 bags?",
        "answer": "$12.00",
        "options": [
          "$12.00",
          "$13.00",
          "$11.00",
          "$8.00"
        ],
        "distractors": [
          "$13.00",
          "$11.00",
          "$8.00"
        ],
        "explain": "4 x $3.25 = $13.00, and $25 - $13 = $12."
      },
      {
        "prompt": "A board is 18.75 inches long. How many 2.5-inch pieces can you cut from it?",
        "answer": "7.5 pieces",
        "options": [
          "7.5 pieces",
          "7 pieces",
          "8 pieces",
          "6.5 pieces"
        ],
        "distractors": [
          "7 pieces",
          "8 pieces",
          "6.5 pieces"
        ],
        "explain": "18.75 / 2.5 = 7.5 pieces."
      }
    ],
    "worksheetA": [
      {
        "q": "Write the value of the 4 in 5.42.",
        "a": "4 tenths"
      },
      {
        "q": "Compare using <, >, or =: 0.7 ___ 0.70",
        "a": "="
      },
      {
        "q": "Round 6.83 to the nearest tenth.",
        "a": "6.8"
      },
      {
        "q": "Round 12.5 to the nearest whole number.",
        "a": "13"
      },
      {
        "q": "Add: 3.6 + 4.75",
        "a": "8.35"
      },
      {
        "q": "Subtract: 9 - 2.45",
        "a": "6.55"
      },
      {
        "q": "Add: 15.8 + 6.9",
        "a": "22.7"
      },
      {
        "q": "Multiply: 4.2 x 3",
        "a": "12.6"
      },
      {
        "q": "Multiply: 0.6 x 0.7",
        "a": "0.42"
      },
      {
        "q": "Multiply: 5.6 x 0.4",
        "a": "2.24"
      },
      {
        "q": "Divide: 14.4 / 1.2",
        "a": "12"
      },
      {
        "q": "Divide: 7.8 / 4",
        "a": "1.95"
      }
    ],
    "worksheetB": [
      {
        "q": "A snack costs $1.45. How much do 2 snacks cost?",
        "a": "$2.90"
      },
      {
        "q": "You buy items for $4.25 and $3.60. What is the total?",
        "a": "$7.85"
      },
      {
        "q": "You pay for a $6.40 lunch with a $10 bill. How much change do you get?",
        "a": "$3.60"
      },
      {
        "q": "A ribbon is 3.5 meters long. You cut it into 5 equal pieces. How long is each piece?",
        "a": "0.7 m"
      },
      {
        "q": "A water bottle holds 0.75 liters. How much do 4 bottles hold?",
        "a": "3 liters"
      },
      {
        "q": "Three friends share a $12.60 bill equally. How much does each pay?",
        "a": "$4.20"
      },
      {
        "q": "A board is 9.6 feet long. How many 1.2-foot pieces can you cut?",
        "a": "8 pieces"
      },
      {
        "q": "Sam runs 2.5 km each day for 4 days. How far does he run in all?",
        "a": "10 km"
      },
      {
        "q": "A recipe needs 0.25 kg of sugar. How much sugar is needed for 6 batches?",
        "a": "1.5 kg"
      },
      {
        "q": "A phone case costs $8.99. With a $20 bill, how much change do you get?",
        "a": "$11.01"
      },
      {
        "q": "A car uses 38.4 miles of fuel over 6 gallons. What is the miles per gallon?",
        "a": "6.4 miles per gallon"
      },
      {
        "q": "★ You have $20. You buy 3 notebooks at $2.75 each and 2 pens at $1.40 each. How much money do you have left?",
        "a": "$8.95"
      }
    ],
    "preQuiz": [
      {
        "prompt": "What is the value of the 3 in 8.37?",
        "answer": "3 tenths",
        "options": [
          "3 tenths",
          "3 hundredths",
          "3 ones",
          "3 thousandths"
        ],
        "distractors": [
          "3 hundredths",
          "3 ones",
          "3 thousandths"
        ],
        "explain": "The first place after the decimal point is tenths."
      },
      {
        "prompt": "Compare: which is greater, 0.4 or 0.38?",
        "answer": "0.4",
        "options": [
          "0.4",
          "0.38",
          "They are equal",
          "0.038"
        ],
        "distractors": [
          "0.38",
          "They are equal",
          "0.038"
        ],
        "explain": "0.40 is greater than 0.38 because 4 tenths beats 3 tenths."
      },
      {
        "prompt": "Round 7.6 to the nearest whole number.",
        "answer": "8",
        "options": [
          "8",
          "7",
          "7.5",
          "6"
        ],
        "distractors": [
          "7",
          "7.5",
          "6"
        ],
        "explain": "The tenths digit 6 is 5 or more, so round up to 8."
      },
      {
        "prompt": "What is 5.3 + 2.75 ?",
        "answer": "8.05",
        "options": [
          "8.05",
          "7.05",
          "8.5",
          "7.78"
        ],
        "distractors": [
          "7.05",
          "8.5",
          "7.78"
        ],
        "explain": "Line up decimals: 5.30 + 2.75 = 8.05."
      },
      {
        "prompt": "What is 10 - 4.6 ?",
        "answer": "5.4",
        "options": [
          "5.4",
          "6.4",
          "5.6",
          "4.4"
        ],
        "distractors": [
          "6.4",
          "5.6",
          "4.4"
        ],
        "explain": "Write 10 as 10.0, then subtract 4.6 to get 5.4."
      },
      {
        "prompt": "What is 3.2 x 0.5 ?",
        "answer": "1.6",
        "options": [
          "1.6",
          "16",
          "0.16",
          "1.5"
        ],
        "distractors": [
          "16",
          "0.16",
          "1.5"
        ],
        "explain": "32 x 5 = 160, with 2 decimal places gives 1.6."
      },
      {
        "prompt": "What is 12.6 / 0.6 ?",
        "answer": "21",
        "options": [
          "21",
          "2.1",
          "210",
          "0.21"
        ],
        "distractors": [
          "2.1",
          "210",
          "0.21"
        ],
        "explain": "Multiply both by 10: 126 / 6 = 21."
      },
      {
        "prompt": "A pen costs $1.25. How much do 4 pens cost?",
        "answer": "$5.00",
        "options": [
          "$5.00",
          "$4.00",
          "$5.25",
          "$4.25"
        ],
        "distractors": [
          "$4.00",
          "$5.25",
          "$4.25"
        ],
        "explain": "4 x $1.25 = $5.00."
      }
    ],
    "postQuiz": [
      {
        "prompt": "What is the value of the 9 in 6.94?",
        "answer": "9 tenths",
        "options": [
          "9 tenths",
          "9 hundredths",
          "9 ones",
          "9 thousandths"
        ],
        "distractors": [
          "9 hundredths",
          "9 ones",
          "9 thousandths"
        ],
        "explain": "The first place after the decimal point is tenths."
      },
      {
        "prompt": "Compare: which is greater, 0.7 or 0.65?",
        "answer": "0.7",
        "options": [
          "0.7",
          "0.65",
          "They are equal",
          "0.065"
        ],
        "distractors": [
          "0.65",
          "They are equal",
          "0.065"
        ],
        "explain": "0.70 is greater than 0.65 because 7 tenths beats 6 tenths."
      },
      {
        "prompt": "Round 4.5 to the nearest whole number.",
        "answer": "5",
        "options": [
          "5",
          "4",
          "4.5",
          "6"
        ],
        "distractors": [
          "4",
          "4.5",
          "6"
        ],
        "explain": "The tenths digit 5 means round up to 5."
      },
      {
        "prompt": "What is 6.4 + 3.85 ?",
        "answer": "10.25",
        "options": [
          "10.25",
          "9.25",
          "10.5",
          "9.89"
        ],
        "distractors": [
          "9.25",
          "10.5",
          "9.89"
        ],
        "explain": "Line up decimals: 6.40 + 3.85 = 10.25."
      },
      {
        "prompt": "What is 15 - 7.3 ?",
        "answer": "7.7",
        "options": [
          "7.7",
          "8.7",
          "7.3",
          "8.3"
        ],
        "distractors": [
          "8.7",
          "7.3",
          "8.3"
        ],
        "explain": "Write 15 as 15.0, then subtract 7.3 to get 7.7."
      },
      {
        "prompt": "What is 4.6 x 0.5 ?",
        "answer": "2.3",
        "options": [
          "2.3",
          "23",
          "0.23",
          "2.5"
        ],
        "distractors": [
          "23",
          "0.23",
          "2.5"
        ],
        "explain": "46 x 5 = 230, with 2 decimal places gives 2.3."
      },
      {
        "prompt": "What is 18.8 / 0.4 ?",
        "answer": "47",
        "options": [
          "47",
          "4.7",
          "470",
          "0.47"
        ],
        "distractors": [
          "4.7",
          "470",
          "0.47"
        ],
        "explain": "Multiply both by 10: 188 / 4 = 47."
      },
      {
        "prompt": "A juice box costs $1.50. How much do 4 juice boxes cost?",
        "answer": "$6.00",
        "options": [
          "$6.00",
          "$5.00",
          "$6.50",
          "$4.50"
        ],
        "distractors": [
          "$5.00",
          "$6.50",
          "$4.50"
        ],
        "explain": "4 x $1.50 = $6.00."
      }
    ]
  },
  {
    "slug": "ratios-rates",
    "title": "Ratios & Rates",
    "icon": "⚖️",
    "accent": "#7c3aed",
    "standard": "Builds 6.RP.A.1–2",
    "domain": "Ratios & Percents",
    "blurb": "Make sense of ratios and unit rates with tables and bar models — the heart of Grade 6 math.",
    "skills": [
      "Ratios",
      "Equivalent ratios",
      "Unit rate",
      "Better buy"
    ],
    "lessons": 4,
    "objective": "I can describe ratios using ratio language, make equivalent ratios with tables, find unit rates, and compare prices to find the better buy.",
    "estMin": 30,
    "vocab": [
      {
        "term": "ratio",
        "def": "A way to compare two amounts, like 3 cats to 2 dogs."
      },
      {
        "term": "rate",
        "def": "A ratio that compares two different kinds of units."
      },
      {
        "term": "unit rate",
        "def": "A rate telling how much for just one unit."
      },
      {
        "term": "equivalent ratios",
        "def": "Different ratios that show the same comparison."
      },
      {
        "term": "ratio table",
        "def": "A table of equivalent ratios made by scaling both numbers."
      },
      {
        "term": "better buy",
        "def": "The choice that costs less for each single unit."
      }
    ],
    "materials": [
      "Color tiles or two-color counters",
      "Printed ratio tables",
      "Grocery price tags or ads"
    ],
    "workedExamples": [
      {
        "problem": "A fruit bowl has 4 apples and 6 oranges. Write the ratio of apples to oranges in simplest form.",
        "steps": [
          "Write the ratio in the order asked: apples to oranges = 4 to 6.",
          "Find a number that divides both 4 and 6. Both share the factor 2.",
          "Divide each part by 2: 4 ÷ 2 = 2 and 6 ÷ 2 = 3.",
          "The simplest form is 2 to 3, written 2:3."
        ],
        "answer": "2:3"
      },
      {
        "problem": "A recipe uses 2 cups of flour for every 3 eggs. Use a ratio table to find how much flour is needed for 12 eggs.",
        "steps": [
          "Start the table with flour 2 and eggs 3.",
          "Ask: 3 times what equals 12? Since 3 × 4 = 12, the scale factor is 4.",
          "Multiply BOTH parts by 4 to keep the ratio equal: flour 2 × 4 = 8, eggs 3 × 4 = 12.",
          "So 8 cups of flour are needed for 12 eggs."
        ],
        "answer": "8 cups"
      },
      {
        "problem": "A 6-pack of juice costs $4.50 and a 10-pack costs $7.00. Which is the better buy?",
        "steps": [
          "Find the unit price (cost for one) of each by dividing total cost by number of items.",
          "6-pack: $4.50 ÷ 6 = $0.75 per juice.",
          "10-pack: $7.00 ÷ 10 = $0.70 per juice.",
          "Compare the unit prices: $0.70 is less than $0.75, so the 10-pack is the better buy."
        ],
        "answer": "The 10-pack ($0.70 each)"
      }
    ],
    "bank": [
      {
        "prompt": "There are 5 red marbles and 3 blue marbles. What is the ratio of red to blue marbles?",
        "answer": "5 to 3",
        "options": [
          "5 to 3",
          "3 to 5",
          "5 to 8",
          "8 to 3"
        ],
        "distractors": [
          "3 to 5",
          "5 to 8",
          "8 to 3"
        ],
        "explain": "Red comes first, so it is 5 red to 3 blue."
      },
      {
        "prompt": "A class has 7 boys and 9 girls. What is the ratio of girls to boys?",
        "answer": "9 to 7",
        "options": [
          "9 to 7",
          "7 to 9",
          "9 to 16",
          "16 to 9"
        ],
        "distractors": [
          "7 to 9",
          "9 to 16",
          "16 to 9"
        ],
        "explain": "Girls come first, so it is 9 girls to 7 boys."
      },
      {
        "prompt": "Which words describe the ratio 4:5?",
        "answer": "4 to 5",
        "options": [
          "4 to 5",
          "4 plus 5",
          "4 times 5",
          "5 to 4"
        ],
        "distractors": [
          "4 plus 5",
          "4 times 5",
          "5 to 4"
        ],
        "explain": "The symbol : means 'to', so 4:5 reads '4 to 5'."
      },
      {
        "prompt": "There are 6 dogs and 6 cats. What is the ratio of dogs to cats?",
        "answer": "6 to 6",
        "options": [
          "6 to 6",
          "6 to 12",
          "0 to 6",
          "12 to 6"
        ],
        "distractors": [
          "6 to 12",
          "0 to 6",
          "12 to 6"
        ],
        "explain": "There are 6 of each, so the ratio is 6 to 6."
      },
      {
        "prompt": "A bag has 2 stars for every 5 hearts. How many hearts go with 4 stars?",
        "answer": "10",
        "options": [
          "10",
          "8",
          "7",
          "20"
        ],
        "distractors": [
          "8",
          "7",
          "20"
        ],
        "explain": "4 stars is 2 × 2, so multiply hearts by 2: 5 × 2 = 10."
      },
      {
        "prompt": "Write the ratio 8 to 12 in simplest form.",
        "answer": "2 to 3",
        "options": [
          "2 to 3",
          "4 to 6",
          "8 to 12",
          "3 to 2"
        ],
        "distractors": [
          "4 to 6",
          "8 to 12",
          "3 to 2"
        ],
        "explain": "Divide both by 4: 8 ÷ 4 = 2 and 12 ÷ 4 = 3."
      },
      {
        "prompt": "Simplify the ratio 10:15.",
        "answer": "2:3",
        "options": [
          "2:3",
          "5:3",
          "2:5",
          "3:2"
        ],
        "distractors": [
          "5:3",
          "2:5",
          "3:2"
        ],
        "explain": "Divide both by 5: 10 ÷ 5 = 2 and 15 ÷ 5 = 3."
      },
      {
        "prompt": "A ratio table shows 3 and 12. The next column has 6. What number completes it?",
        "answer": "24",
        "options": [
          "24",
          "15",
          "18",
          "9"
        ],
        "distractors": [
          "15",
          "18",
          "9"
        ],
        "explain": "6 is 3 × 2, so 12 × 2 = 24."
      },
      {
        "prompt": "Which ratio is equivalent to 1 to 4?",
        "answer": "3 to 12",
        "options": [
          "3 to 12",
          "4 to 1",
          "2 to 6",
          "3 to 8"
        ],
        "distractors": [
          "4 to 1",
          "2 to 6",
          "3 to 8"
        ],
        "explain": "Multiply both by 3: 1 × 3 = 3 and 4 × 3 = 12."
      },
      {
        "prompt": "A car goes 60 miles in 2 hours. What is the unit rate in miles per hour?",
        "answer": "30 miles per hour",
        "options": [
          "30 miles per hour",
          "60 miles per hour",
          "120 miles per hour",
          "2 miles per hour"
        ],
        "distractors": [
          "60 miles per hour",
          "120 miles per hour",
          "2 miles per hour"
        ],
        "explain": "Divide miles by hours: 60 ÷ 2 = 30 miles per hour."
      },
      {
        "prompt": "8 pencils cost $4. What is the cost for one pencil?",
        "answer": "$0.50",
        "options": [
          "$0.50",
          "$2.00",
          "$4.00",
          "$1.00"
        ],
        "distractors": [
          "$2.00",
          "$4.00",
          "$1.00"
        ],
        "explain": "Divide cost by pencils: $4 ÷ 8 = $0.50 each."
      },
      {
        "prompt": "A printer makes 24 pages in 4 minutes. How many pages per minute?",
        "answer": "6 pages per minute",
        "options": [
          "6 pages per minute",
          "4 pages per minute",
          "8 pages per minute",
          "20 pages per minute"
        ],
        "distractors": [
          "4 pages per minute",
          "8 pages per minute",
          "20 pages per minute"
        ],
        "explain": "Divide pages by minutes: 24 ÷ 4 = 6 pages per minute."
      },
      {
        "prompt": "Which ratio is equivalent to 6:9?",
        "answer": "2:3",
        "options": [
          "2:3",
          "3:2",
          "6:3",
          "9:6"
        ],
        "distractors": [
          "3:2",
          "6:3",
          "9:6"
        ],
        "explain": "Divide both by 3: 6 ÷ 3 = 2 and 9 ÷ 3 = 3."
      },
      {
        "prompt": "A snack mix uses 3 cups of nuts for every 2 cups of raisins. How many cups of raisins go with 9 cups of nuts?",
        "answer": "6 cups",
        "options": [
          "6 cups",
          "4 cups",
          "5 cups",
          "8 cups"
        ],
        "distractors": [
          "4 cups",
          "5 cups",
          "8 cups"
        ],
        "explain": "9 nuts is 3 × 3, so raisins = 2 × 3 = 6 cups."
      },
      {
        "prompt": "A store sells 5 oranges for $2. At that rate, what do 15 oranges cost?",
        "answer": "$6",
        "options": [
          "$6",
          "$5",
          "$10",
          "$7"
        ],
        "distractors": [
          "$5",
          "$10",
          "$7"
        ],
        "explain": "15 is 5 × 3, so cost = $2 × 3 = $6."
      },
      {
        "prompt": "Which has the lower unit price: 4 apples for $2.00 or 6 apples for $2.40?",
        "answer": "6 apples for $2.40",
        "options": [
          "6 apples for $2.40",
          "4 apples for $2.00",
          "They are equal",
          "Cannot tell"
        ],
        "distractors": [
          "4 apples for $2.00",
          "They are equal",
          "Cannot tell"
        ],
        "explain": "$2.00 ÷ 4 = $0.50; $2.40 ÷ 6 = $0.40, which is lower."
      },
      {
        "prompt": "A faucet leaks 9 liters in 3 hours. How many liters leak in 7 hours at the same rate?",
        "answer": "21 liters",
        "options": [
          "21 liters",
          "18 liters",
          "27 liters",
          "12 liters"
        ],
        "distractors": [
          "18 liters",
          "27 liters",
          "12 liters"
        ],
        "explain": "Unit rate is 9 ÷ 3 = 3 liters per hour; 3 × 7 = 21."
      },
      {
        "prompt": "A 12-ounce bottle costs $1.80. What is the price per ounce?",
        "answer": "$0.15",
        "options": [
          "$0.15",
          "$0.18",
          "$0.12",
          "$1.50"
        ],
        "distractors": [
          "$0.18",
          "$0.12",
          "$1.50"
        ],
        "explain": "Divide cost by ounces: $1.80 ÷ 12 = $0.15 per ounce."
      },
      {
        "prompt": "Maria types 180 words in 5 minutes. How many words can she type in 8 minutes at the same rate?",
        "answer": "288 words",
        "options": [
          "288 words",
          "225 words",
          "240 words",
          "360 words"
        ],
        "distractors": [
          "225 words",
          "240 words",
          "360 words"
        ],
        "explain": "Unit rate is 180 ÷ 5 = 36 words per minute; 36 × 8 = 288."
      },
      {
        "prompt": "A recipe uses 2 cups sugar to 5 cups flour. To use 20 cups of flour, how much sugar is needed?",
        "answer": "8 cups",
        "options": [
          "8 cups",
          "10 cups",
          "4 cups",
          "17 cups"
        ],
        "distractors": [
          "10 cups",
          "4 cups",
          "17 cups"
        ],
        "explain": "20 flour is 5 × 4, so sugar = 2 × 4 = 8 cups."
      },
      {
        "prompt": "Brand A: 16 oz for $3.20. Brand B: 24 oz for $4.32. Which is the better buy per ounce?",
        "answer": "Brand B ($0.18 per oz)",
        "options": [
          "Brand B ($0.18 per oz)",
          "Brand A ($0.20 per oz)",
          "They cost the same per ounce",
          "Brand A ($0.18 per oz)"
        ],
        "distractors": [
          "Brand A ($0.20 per oz)",
          "They cost the same per ounce",
          "Brand A ($0.18 per oz)"
        ],
        "explain": "A is $3.20 ÷ 16 = $0.20; B is $4.32 ÷ 24 = $0.18, which is lower."
      },
      {
        "prompt": "Two trains travel at steady speeds. Train X goes 150 miles in 3 hours; Train Y goes 280 miles in 4 hours. Which is faster?",
        "answer": "Train Y (70 mph)",
        "options": [
          "Train Y (70 mph)",
          "Train X (50 mph)",
          "They are the same speed",
          "Train X (70 mph)"
        ],
        "distractors": [
          "Train X (50 mph)",
          "They are the same speed",
          "Train X (70 mph)"
        ],
        "explain": "X: 150 ÷ 3 = 50 mph; Y: 280 ÷ 4 = 70 mph, which is faster."
      },
      {
        "prompt": "A paint mix needs blue and yellow in a 3:4 ratio. To make 28 cups of mix, how many cups are yellow?",
        "answer": "16 cups",
        "options": [
          "16 cups",
          "12 cups",
          "14 cups",
          "21 cups"
        ],
        "distractors": [
          "12 cups",
          "14 cups",
          "21 cups"
        ],
        "explain": "Parts total 3 + 4 = 7; 28 ÷ 7 = 4 per part, so yellow = 4 × 4 = 16."
      },
      {
        "prompt": "A 5-pound bag of rice costs $6.25, and a 8-pound bag costs $9.60. How much money is saved per pound by buying the cheaper unit price?",
        "answer": "$0.05 per pound",
        "options": [
          "$0.05 per pound",
          "$0.10 per pound",
          "$0.25 per pound",
          "$0.15 per pound"
        ],
        "distractors": [
          "$0.10 per pound",
          "$0.25 per pound",
          "$0.15 per pound"
        ],
        "explain": "5-lb: $1.25/lb; 8-lb: $1.20/lb; difference is $1.25 − $1.20 = $0.05."
      }
    ],
    "worksheetA": [
      {
        "q": "Write the ratio of 7 to 4 using a colon.",
        "a": "7:4"
      },
      {
        "q": "There are 9 cars and 5 trucks. Write the ratio of cars to trucks.",
        "a": "9 to 5"
      },
      {
        "q": "Simplify the ratio 6 to 8.",
        "a": "3 to 4"
      },
      {
        "q": "Simplify the ratio 12:18.",
        "a": "2:3"
      },
      {
        "q": "Simplify the ratio 20 to 25.",
        "a": "4 to 5"
      },
      {
        "q": "Complete the equivalent ratio: 2:3 = 8:?",
        "a": "12"
      },
      {
        "q": "Complete the equivalent ratio: 5:2 = ?:10.",
        "a": "25"
      },
      {
        "q": "Find the unit rate: 45 miles in 5 hours.",
        "a": "9 miles per hour"
      },
      {
        "q": "Find the unit rate: 6 books cost $18. Cost per book?",
        "a": "$3 per book"
      },
      {
        "q": "Find the unit rate: 36 pages in 6 minutes.",
        "a": "6 pages per minute"
      },
      {
        "q": "A ratio table starts at 4:7. Fill the column where the first number is 12.",
        "a": "12:21"
      },
      {
        "q": "Which has the lower unit price: 3 for $1.50 or 5 for $2.00?",
        "a": "5 for $2.00 ($0.40 each)"
      }
    ],
    "worksheetB": [
      {
        "q": "A team won 8 games and lost 5. Write the ratio of wins to losses.",
        "a": "8 to 5"
      },
      {
        "q": "A smoothie uses 3 bananas for every 2 cups of milk. How many bananas are needed for 8 cups of milk?",
        "a": "12 bananas"
      },
      {
        "q": "A bike travels 24 miles in 2 hours. What is its speed in miles per hour?",
        "a": "12 miles per hour"
      },
      {
        "q": "10 stickers cost $2.50. What is the cost of one sticker?",
        "a": "$0.25"
      },
      {
        "q": "A garden has 4 roses for every 6 tulips. Write this ratio in simplest form.",
        "a": "2 to 3"
      },
      {
        "q": "A factory makes 150 toys in 5 hours. How many toys does it make in 9 hours at the same rate?",
        "a": "270 toys"
      },
      {
        "q": "Cereal Box A: 12 oz for $3.00. Box B: 18 oz for $4.05. Which is the better buy per ounce?",
        "a": "Box B ($0.225 per oz)"
      },
      {
        "q": "A recipe mixes water and juice in a 5:3 ratio. For 15 cups of water, how much juice is needed?",
        "a": "9 cups"
      },
      {
        "q": "A car uses 4 gallons of gas to go 96 miles. How many miles per gallon is that?",
        "a": "24 miles per gallon"
      },
      {
        "q": "At a sale, 6 notebooks cost $9. How much would 10 notebooks cost at the same rate?",
        "a": "$15"
      },
      {
        "q": "A lemonade recipe needs lemons and sugar in a 7:2 ratio. To make a batch using 21 lemons, how much sugar is needed?",
        "a": "6 cups of sugar"
      },
      {
        "q": "★ A 2-liter bottle of soda costs $1.60 and a 3-liter bottle costs $2.10. Find the unit price of each, decide the better buy, and tell how much you save per liter by choosing it.",
        "a": "2-L: $0.80/L; 3-L: $0.70/L; the 3-liter bottle is better and saves $0.10 per liter."
      }
    ],
    "preQuiz": [
      {
        "prompt": "There are 4 cats and 7 dogs. What is the ratio of cats to dogs?",
        "answer": "4 to 7",
        "options": [
          "4 to 7",
          "7 to 4",
          "4 to 11",
          "11 to 4"
        ],
        "distractors": [
          "7 to 4",
          "4 to 11",
          "11 to 4"
        ],
        "explain": "Cats come first, so it is 4 cats to 7 dogs."
      },
      {
        "prompt": "Simplify the ratio 6 to 9.",
        "answer": "2 to 3",
        "options": [
          "2 to 3",
          "3 to 2",
          "2 to 9",
          "6 to 3"
        ],
        "distractors": [
          "3 to 2",
          "2 to 9",
          "6 to 3"
        ],
        "explain": "Divide both by 3: 6 ÷ 3 = 2 and 9 ÷ 3 = 3."
      },
      {
        "prompt": "Which ratio is equivalent to 2:5?",
        "answer": "6:15",
        "options": [
          "6:15",
          "5:2",
          "4:8",
          "6:10"
        ],
        "distractors": [
          "5:2",
          "4:8",
          "6:10"
        ],
        "explain": "Multiply both by 3: 2 × 3 = 6 and 5 × 3 = 15."
      },
      {
        "prompt": "A ratio table shows 3:4. What completes 9:?",
        "answer": "12",
        "options": [
          "12",
          "10",
          "13",
          "16"
        ],
        "distractors": [
          "10",
          "13",
          "16"
        ],
        "explain": "9 is 3 × 3, so 4 × 3 = 12."
      },
      {
        "prompt": "A car goes 80 miles in 2 hours. What is the unit rate?",
        "answer": "40 miles per hour",
        "options": [
          "40 miles per hour",
          "80 miles per hour",
          "160 miles per hour",
          "20 miles per hour"
        ],
        "distractors": [
          "80 miles per hour",
          "160 miles per hour",
          "20 miles per hour"
        ],
        "explain": "Divide miles by hours: 80 ÷ 2 = 40 miles per hour."
      },
      {
        "prompt": "6 apples cost $3. What is the cost of one apple?",
        "answer": "$0.50",
        "options": [
          "$0.50",
          "$2.00",
          "$1.50",
          "$3.00"
        ],
        "distractors": [
          "$2.00",
          "$1.50",
          "$3.00"
        ],
        "explain": "Divide cost by apples: $3 ÷ 6 = $0.50 each."
      },
      {
        "prompt": "A recipe uses 2 cups rice for 3 cups water. How much water for 8 cups of rice?",
        "answer": "12 cups",
        "options": [
          "12 cups",
          "10 cups",
          "6 cups",
          "16 cups"
        ],
        "distractors": [
          "10 cups",
          "6 cups",
          "16 cups"
        ],
        "explain": "8 rice is 2 × 4, so water = 3 × 4 = 12 cups."
      },
      {
        "prompt": "Which is the better buy: 4 pens for $2.00 or 6 pens for $2.40?",
        "answer": "6 pens for $2.40",
        "options": [
          "6 pens for $2.40",
          "4 pens for $2.00",
          "They are equal",
          "Cannot tell"
        ],
        "distractors": [
          "4 pens for $2.00",
          "They are equal",
          "Cannot tell"
        ],
        "explain": "$2.00 ÷ 4 = $0.50; $2.40 ÷ 6 = $0.40, which is lower."
      }
    ],
    "postQuiz": [
      {
        "prompt": "There are 5 pens and 8 markers. What is the ratio of pens to markers?",
        "answer": "5 to 8",
        "options": [
          "5 to 8",
          "8 to 5",
          "5 to 13",
          "13 to 5"
        ],
        "distractors": [
          "8 to 5",
          "5 to 13",
          "13 to 5"
        ],
        "explain": "Pens come first, so it is 5 pens to 8 markers."
      },
      {
        "prompt": "Simplify the ratio 8 to 12.",
        "answer": "2 to 3",
        "options": [
          "2 to 3",
          "3 to 2",
          "2 to 12",
          "4 to 3"
        ],
        "distractors": [
          "3 to 2",
          "2 to 12",
          "4 to 3"
        ],
        "explain": "Divide both by 4: 8 ÷ 4 = 2 and 12 ÷ 4 = 3."
      },
      {
        "prompt": "Which ratio is equivalent to 3:4?",
        "answer": "9:12",
        "options": [
          "9:12",
          "4:3",
          "6:10",
          "9:16"
        ],
        "distractors": [
          "4:3",
          "6:10",
          "9:16"
        ],
        "explain": "Multiply both by 3: 3 × 3 = 9 and 4 × 3 = 12."
      },
      {
        "prompt": "A ratio table shows 2:5. What completes 8:?",
        "answer": "20",
        "options": [
          "20",
          "15",
          "11",
          "18"
        ],
        "distractors": [
          "15",
          "11",
          "18"
        ],
        "explain": "8 is 2 × 4, so 5 × 4 = 20."
      },
      {
        "prompt": "A train goes 90 miles in 3 hours. What is the unit rate?",
        "answer": "30 miles per hour",
        "options": [
          "30 miles per hour",
          "90 miles per hour",
          "270 miles per hour",
          "3 miles per hour"
        ],
        "distractors": [
          "90 miles per hour",
          "270 miles per hour",
          "3 miles per hour"
        ],
        "explain": "Divide miles by hours: 90 ÷ 3 = 30 miles per hour."
      },
      {
        "prompt": "8 muffins cost $4. What is the cost of one muffin?",
        "answer": "$0.50",
        "options": [
          "$0.50",
          "$2.00",
          "$4.00",
          "$1.00"
        ],
        "distractors": [
          "$2.00",
          "$4.00",
          "$1.00"
        ],
        "explain": "Divide cost by muffins: $4 ÷ 8 = $0.50 each."
      },
      {
        "prompt": "A recipe uses 3 cups oats for 4 cups milk. How much milk for 12 cups of oats?",
        "answer": "16 cups",
        "options": [
          "16 cups",
          "14 cups",
          "8 cups",
          "20 cups"
        ],
        "distractors": [
          "14 cups",
          "8 cups",
          "20 cups"
        ],
        "explain": "12 oats is 3 × 4, so milk = 4 × 4 = 16 cups."
      },
      {
        "prompt": "Which is the better buy: 5 juice boxes for $3.00 or 8 juice boxes for $4.00?",
        "answer": "8 juice boxes for $4.00",
        "options": [
          "8 juice boxes for $4.00",
          "5 juice boxes for $3.00",
          "They are equal",
          "Cannot tell"
        ],
        "distractors": [
          "5 juice boxes for $3.00",
          "They are equal",
          "Cannot tell"
        ],
        "explain": "$3.00 ÷ 5 = $0.60; $4.00 ÷ 8 = $0.50, which is lower."
      }
    ]
  },
  {
    "slug": "percents",
    "title": "Percents & Proportions",
    "icon": "📊",
    "accent": "#9333ea",
    "standard": "Builds 6.RP.A.3c",
    "domain": "Ratios & Percents",
    "blurb": "Convert fractions, decimals, and percents and solve real percent problems — discounts, tax, and tips.",
    "skills": [
      "% of a number",
      "Conversions",
      "Find the whole",
      "Discounts"
    ],
    "lessons": 4,
    "objective": "I can find the percent of a number, change between fractions, decimals, and percents, find the whole, and solve discount, tax, and tip problems.",
    "estMin": 30,
    "vocab": [
      {
        "term": "Percent",
        "def": "A part out of 100; the symbol is %."
      },
      {
        "term": "Percent of a number",
        "def": "Multiplying a percent by a number to find a part."
      },
      {
        "term": "Discount",
        "def": "An amount taken off the regular price."
      },
      {
        "term": "Sales tax",
        "def": "Extra money added to a price, set by the government."
      },
      {
        "term": "Tip",
        "def": "Extra money you give for good service."
      },
      {
        "term": "The whole",
        "def": "The total amount that a part comes from."
      }
    ],
    "materials": [
      "Calculator",
      "Pencil and scratch paper",
      "Hundredths grid (10 by 10) printout",
      "Percent-fraction-decimal anchor chart"
    ],
    "workedExamples": [
      {
        "problem": "Find 20% of 45.",
        "steps": [
          "Change the percent to a decimal: 20% = 0.20.",
          "Multiply the decimal by the number: 0.20 times 45.",
          "0.20 times 45 equals 9."
        ],
        "answer": "9"
      },
      {
        "problem": "A $50 game is 20% off. What is the sale price?",
        "steps": [
          "Find the discount: 20% of 50 = 0.20 times 50 = $10.",
          "Subtract the discount from the regular price: 50 minus 10.",
          "The sale price is $40."
        ],
        "answer": "$40"
      },
      {
        "problem": "A $40 dinner has a 15% tip and 6% tax added. What is the total cost?",
        "steps": [
          "Find the tip: 15% of 40 = 0.15 times 40 = $6.",
          "Find the tax: 6% of 40 = 0.06 times 40 = $2.40.",
          "Add everything together: 40 + 6 + 2.40 = $48.40."
        ],
        "answer": "$48.40"
      }
    ],
    "bank": [
      {
        "prompt": "What is 10% of 80?",
        "answer": "8",
        "options": [
          "8",
          "10",
          "18",
          "80"
        ],
        "distractors": [
          "10",
          "18",
          "80"
        ],
        "explain": "10% means 0.10, and 0.10 times 80 equals 8."
      },
      {
        "prompt": "What is 50% of 48?",
        "answer": "24",
        "options": [
          "24",
          "48",
          "12",
          "96"
        ],
        "distractors": [
          "48",
          "12",
          "96"
        ],
        "explain": "50% is one half, and half of 48 is 24."
      },
      {
        "prompt": "Write 3/4 as a percent.",
        "answer": "75%",
        "options": [
          "75%",
          "34%",
          "43%",
          "30%"
        ],
        "distractors": [
          "34%",
          "43%",
          "30%"
        ],
        "explain": "3 divided by 4 is 0.75, which equals 75%."
      },
      {
        "prompt": "Write 0.35 as a percent.",
        "answer": "35%",
        "options": [
          "35%",
          "3.5%",
          "350%",
          "0.35%"
        ],
        "distractors": [
          "3.5%",
          "350%",
          "0.35%"
        ],
        "explain": "To turn a decimal into a percent, move the point two places right: 0.35 = 35%."
      },
      {
        "prompt": "Write 45% as a decimal.",
        "answer": "0.45",
        "options": [
          "0.45",
          "4.5",
          "45",
          "0.045"
        ],
        "distractors": [
          "4.5",
          "45",
          "0.045"
        ],
        "explain": "Move the percent's point two places left: 45% = 0.45."
      },
      {
        "prompt": "What is 25% of 60?",
        "answer": "15",
        "options": [
          "15",
          "25",
          "30",
          "12"
        ],
        "distractors": [
          "25",
          "30",
          "12"
        ],
        "explain": "25% is one fourth, and 60 divided by 4 is 15."
      },
      {
        "prompt": "Write 1/5 as a percent.",
        "answer": "20%",
        "options": [
          "20%",
          "15%",
          "5%",
          "25%"
        ],
        "distractors": [
          "15%",
          "5%",
          "25%"
        ],
        "explain": "1 divided by 5 is 0.20, which equals 20%."
      },
      {
        "prompt": "What is 20% of 45?",
        "answer": "9",
        "options": [
          "9",
          "20",
          "90",
          "4.5"
        ],
        "distractors": [
          "20",
          "90",
          "4.5"
        ],
        "explain": "20% is 0.20, and 0.20 times 45 equals 9."
      },
      {
        "prompt": "Write 0.6 as a percent.",
        "answer": "60%",
        "options": [
          "60%",
          "6%",
          "600%",
          "0.6%"
        ],
        "distractors": [
          "6%",
          "600%",
          "0.6%"
        ],
        "explain": "Move the point two places right: 0.6 = 0.60 = 60%."
      },
      {
        "prompt": "What is 15% of 200?",
        "answer": "30",
        "options": [
          "30",
          "15",
          "300",
          "45"
        ],
        "distractors": [
          "15",
          "300",
          "45"
        ],
        "explain": "15% is 0.15, and 0.15 times 200 equals 30."
      },
      {
        "prompt": "What is 75% of 40?",
        "answer": "30",
        "options": [
          "30",
          "75",
          "10",
          "3"
        ],
        "distractors": [
          "75",
          "10",
          "3"
        ],
        "explain": "75% is three fourths, and three fourths of 40 is 30."
      },
      {
        "prompt": "Write 5/8 as a percent.",
        "answer": "62.5%",
        "options": [
          "62.5%",
          "58%",
          "85%",
          "50%"
        ],
        "distractors": [
          "58%",
          "85%",
          "50%"
        ],
        "explain": "5 divided by 8 is 0.625, which equals 62.5%."
      },
      {
        "prompt": "15 is 25% of what number?",
        "answer": "60",
        "options": [
          "60",
          "3.75",
          "40",
          "375"
        ],
        "distractors": [
          "3.75",
          "40",
          "375"
        ],
        "explain": "Divide the part by the percent: 15 divided by 0.25 equals 60."
      },
      {
        "prompt": "What is 40% of 35?",
        "answer": "14",
        "options": [
          "14",
          "40",
          "35",
          "1.4"
        ],
        "distractors": [
          "40",
          "35",
          "1.4"
        ],
        "explain": "40% is 0.40, and 0.40 times 35 equals 14."
      },
      {
        "prompt": "9 is 30% of what number?",
        "answer": "30",
        "options": [
          "30",
          "2.7",
          "27",
          "3"
        ],
        "distractors": [
          "2.7",
          "27",
          "3"
        ],
        "explain": "Divide the part by the percent: 9 divided by 0.30 equals 30."
      },
      {
        "prompt": "A shirt costs $50. It is 20% off. How much do you save?",
        "answer": "$10",
        "options": [
          "$10",
          "$20",
          "$40",
          "$30"
        ],
        "distractors": [
          "$20",
          "$40",
          "$30"
        ],
        "explain": "20% of 50 is 0.20 times 50, which equals $10 saved."
      },
      {
        "prompt": "A meal costs $40. You leave a 15% tip. How much is the tip?",
        "answer": "$6",
        "options": [
          "$6",
          "$15",
          "$4",
          "$46"
        ],
        "distractors": [
          "$15",
          "$4",
          "$46"
        ],
        "explain": "15% of 40 is 0.15 times 40, which equals $6."
      },
      {
        "prompt": "A backpack is $25. Tax is 6%. How much tax do you pay?",
        "answer": "$1.50",
        "options": [
          "$1.50",
          "$6",
          "$2.50",
          "$15"
        ],
        "distractors": [
          "$6",
          "$2.50",
          "$15"
        ],
        "explain": "6% of 25 is 0.06 times 25, which equals $1.50."
      },
      {
        "prompt": "Maria got 45 of 60 questions right. What percent did she get right?",
        "answer": "75%",
        "options": [
          "75%",
          "45%",
          "60%",
          "15%"
        ],
        "distractors": [
          "45%",
          "60%",
          "15%"
        ],
        "explain": "45 divided by 60 is 0.75, which equals 75%."
      },
      {
        "prompt": "A phone costs $200 and is 30% off. What is the sale price?",
        "answer": "$140",
        "options": [
          "$140",
          "$60",
          "$170",
          "$340"
        ],
        "distractors": [
          "$60",
          "$170",
          "$340"
        ],
        "explain": "30% of 200 is $60 off, and 200 minus 60 equals $140."
      },
      {
        "prompt": "A book is $18 with 20% off. What is the sale price?",
        "answer": "$14.40",
        "options": [
          "$14.40",
          "$3.60",
          "$16.20",
          "$21.60"
        ],
        "distractors": [
          "$3.60",
          "$16.20",
          "$21.60"
        ],
        "explain": "20% of 18 is $3.60 off, and 18 minus 3.60 equals $14.40."
      },
      {
        "prompt": "21 is 70% of what number?",
        "answer": "30",
        "options": [
          "30",
          "14.7",
          "147",
          "15"
        ],
        "distractors": [
          "14.7",
          "147",
          "15"
        ],
        "explain": "Divide the part by the percent: 21 divided by 0.70 equals 30."
      },
      {
        "prompt": "A $50 dinner has a 18% tip and 6% tax added. What is the total?",
        "answer": "$62",
        "options": [
          "$62",
          "$59",
          "$56",
          "$68"
        ],
        "distractors": [
          "$59",
          "$56",
          "$68"
        ],
        "explain": "18% is $9 tip and 6% is $3 tax, so 50 plus 9 plus 3 equals $62."
      },
      {
        "prompt": "A $40 shirt is 25% off, then 10% tax is added to the sale price. What is the final cost?",
        "answer": "$33",
        "options": [
          "$33",
          "$30",
          "$34.50",
          "$46"
        ],
        "distractors": [
          "$30",
          "$34.50",
          "$46"
        ],
        "explain": "25% off makes it $30, then 10% tax of $3 gives a total of $33."
      }
    ],
    "worksheetA": [
      {
        "q": "Find 10% of 60.",
        "a": "6"
      },
      {
        "q": "Find 50% of 24.",
        "a": "12"
      },
      {
        "q": "Find 25% of 80.",
        "a": "20"
      },
      {
        "q": "Find 20% of 35.",
        "a": "7"
      },
      {
        "q": "Write 3/5 as a percent.",
        "a": "60%"
      },
      {
        "q": "Write 7/10 as a percent.",
        "a": "70%"
      },
      {
        "q": "Write 0.85 as a percent.",
        "a": "85%"
      },
      {
        "q": "Write 60% as a decimal.",
        "a": "0.6"
      },
      {
        "q": "Find 15% of 80.",
        "a": "12"
      },
      {
        "q": "Find 75% of 32.",
        "a": "24"
      },
      {
        "q": "12 is 25% of what number?",
        "a": "48"
      },
      {
        "q": "18 is 60% of what number?",
        "a": "30"
      }
    ],
    "worksheetB": [
      {
        "q": "A sweater costs $30. It is 20% off. How much money do you save?",
        "a": "$6"
      },
      {
        "q": "A bike costs $120 and is 25% off. What is the sale price?",
        "a": "$90"
      },
      {
        "q": "A meal costs $40. You leave a 15% tip. How much is the tip?",
        "a": "$6"
      },
      {
        "q": "A shirt costs $25. Sales tax is 8%. How much tax do you pay?",
        "a": "$2"
      },
      {
        "q": "Out of 50 students, 40% walk to school. How many students walk?",
        "a": "20"
      },
      {
        "q": "A $60 pair of shoes is 30% off. What is the sale price?",
        "a": "$42"
      },
      {
        "q": "Jake answered 18 of 24 questions correctly. What percent did he get right?",
        "a": "75%"
      },
      {
        "q": "A $50 backpack has 6% sales tax added. What is the total cost?",
        "a": "$53"
      },
      {
        "q": "A class has 25 students and 60% bring lunch. How many bring lunch?",
        "a": "15"
      },
      {
        "q": "A $20 haircut gets a 20% tip. What is the total you pay?",
        "a": "$24"
      },
      {
        "q": "A jacket is $80 with 25% off, then 10% tax is added to the sale price. What is the final cost?",
        "a": "$66"
      },
      {
        "q": "★ A $90 game console is 30% off. Then a coupon takes an extra 10% off the sale price. What is the final price?",
        "a": "$56.70"
      }
    ],
    "preQuiz": [
      {
        "prompt": "What is 10% of 70?",
        "answer": "7",
        "options": [
          "7",
          "10",
          "17",
          "70"
        ],
        "distractors": [
          "10",
          "17",
          "70"
        ],
        "explain": "10% is 0.10, and 0.10 times 70 equals 7."
      },
      {
        "prompt": "Write 1/2 as a percent.",
        "answer": "50%",
        "options": [
          "50%",
          "12%",
          "21%",
          "25%"
        ],
        "distractors": [
          "12%",
          "21%",
          "25%"
        ],
        "explain": "1 divided by 2 is 0.50, which equals 50%."
      },
      {
        "prompt": "Write 0.4 as a percent.",
        "answer": "40%",
        "options": [
          "40%",
          "4%",
          "400%",
          "0.4%"
        ],
        "distractors": [
          "4%",
          "400%",
          "0.4%"
        ],
        "explain": "Move the point two places right: 0.4 = 40%."
      },
      {
        "prompt": "What is 20% of 50?",
        "answer": "10",
        "options": [
          "10",
          "20",
          "30",
          "5"
        ],
        "distractors": [
          "20",
          "30",
          "5"
        ],
        "explain": "20% is 0.20, and 0.20 times 50 equals 10."
      },
      {
        "prompt": "Write 25% as a decimal.",
        "answer": "0.25",
        "options": [
          "0.25",
          "2.5",
          "25",
          "0.025"
        ],
        "distractors": [
          "2.5",
          "25",
          "0.025"
        ],
        "explain": "Move the point two places left: 25% = 0.25."
      },
      {
        "prompt": "10 is 25% of what number?",
        "answer": "40",
        "options": [
          "40",
          "2.5",
          "5",
          "250"
        ],
        "distractors": [
          "2.5",
          "5",
          "250"
        ],
        "explain": "Divide the part by the percent: 10 divided by 0.25 equals 40."
      },
      {
        "prompt": "A toy is $30 and is 10% off. What is the sale price?",
        "answer": "$27",
        "options": [
          "$27",
          "$3",
          "$33",
          "$20"
        ],
        "distractors": [
          "$3",
          "$33",
          "$20"
        ],
        "explain": "10% of 30 is $3 off, and 30 minus 3 equals $27."
      },
      {
        "prompt": "A $20 meal has a 15% tip. How much is the tip?",
        "answer": "$3",
        "options": [
          "$3",
          "$15",
          "$2",
          "$23"
        ],
        "distractors": [
          "$15",
          "$2",
          "$23"
        ],
        "explain": "15% of 20 is 0.15 times 20, which equals $3."
      }
    ],
    "postQuiz": [
      {
        "prompt": "What is 10% of 90?",
        "answer": "9",
        "options": [
          "9",
          "10",
          "19",
          "90"
        ],
        "distractors": [
          "10",
          "19",
          "90"
        ],
        "explain": "10% is 0.10, and 0.10 times 90 equals 9."
      },
      {
        "prompt": "Write 1/4 as a percent.",
        "answer": "25%",
        "options": [
          "25%",
          "14%",
          "41%",
          "20%"
        ],
        "distractors": [
          "14%",
          "41%",
          "20%"
        ],
        "explain": "1 divided by 4 is 0.25, which equals 25%."
      },
      {
        "prompt": "Write 0.7 as a percent.",
        "answer": "70%",
        "options": [
          "70%",
          "7%",
          "700%",
          "0.7%"
        ],
        "distractors": [
          "7%",
          "700%",
          "0.7%"
        ],
        "explain": "Move the point two places right: 0.7 = 70%."
      },
      {
        "prompt": "What is 30% of 90?",
        "answer": "27",
        "options": [
          "27",
          "30",
          "60",
          "9"
        ],
        "distractors": [
          "30",
          "60",
          "9"
        ],
        "explain": "30% is 0.30, and 0.30 times 90 equals 27."
      },
      {
        "prompt": "Write 35% as a decimal.",
        "answer": "0.35",
        "options": [
          "0.35",
          "3.5",
          "35",
          "0.035"
        ],
        "distractors": [
          "3.5",
          "35",
          "0.035"
        ],
        "explain": "Move the point two places left: 35% = 0.35."
      },
      {
        "prompt": "12 is 20% of what number?",
        "answer": "60",
        "options": [
          "60",
          "2.4",
          "40",
          "240"
        ],
        "distractors": [
          "2.4",
          "40",
          "240"
        ],
        "explain": "Divide the part by the percent: 12 divided by 0.20 equals 60."
      },
      {
        "prompt": "A jacket is $80 and is 25% off. What is the sale price?",
        "answer": "$60",
        "options": [
          "$60",
          "$20",
          "$55",
          "$100"
        ],
        "distractors": [
          "$20",
          "$55",
          "$100"
        ],
        "explain": "25% of 80 is $20 off, and 80 minus 20 equals $60."
      },
      {
        "prompt": "A $60 meal has a 10% tip and 5% tax. What is the total?",
        "answer": "$69",
        "options": [
          "$69",
          "$66",
          "$63",
          "$75"
        ],
        "distractors": [
          "$66",
          "$63",
          "$75"
        ],
        "explain": "10% is $6 tip and 5% is $3 tax, so 60 plus 6 plus 3 equals $69."
      }
    ]
  },
  {
    "slug": "integers-number-line",
    "title": "Integers & the Number Line",
    "icon": "🌡️",
    "accent": "#0e7490",
    "standard": "Builds 6.NS.C.5–7",
    "domain": "Integers & Coordinate Plane",
    "blurb": "Order negatives, find absolute value, and add and subtract integers — essential for algebra and data.",
    "skills": [
      "Negatives",
      "Absolute value",
      "Opposites",
      "Add / subtract"
    ],
    "lessons": 4,
    "objective": "I can use, compare, order, and add and subtract integers, and find absolute value and opposites, to solve real-world problems.",
    "estMin": 30,
    "vocab": [
      {
        "term": "Integer",
        "def": "A whole number that can be positive, negative, or zero."
      },
      {
        "term": "Negative number",
        "def": "A number less than zero, written with a minus sign."
      },
      {
        "term": "Opposite",
        "def": "A number the same distance from zero, but other sign."
      },
      {
        "term": "Absolute value",
        "def": "A number's distance from zero; always zero or positive."
      },
      {
        "term": "Number line",
        "def": "A line where numbers grow left to right."
      },
      {
        "term": "Integer",
        "def": "A positive or negative whole number, or zero."
      }
    ],
    "materials": [
      "Number line (0 to ±20) printed or laminated",
      "Two-color counters (red = negative, yellow = positive)",
      "Dry-erase markers",
      "Thermometer model or picture"
    ],
    "workedExamples": [
      {
        "problem": "Compare -4 and -9 using < or >.",
        "steps": [
          "Draw a number line and mark both numbers.",
          "-9 is farther left than -4, so it is smaller.",
          "The number farther right is greater, so -4 is greater than -9."
        ],
        "answer": "-4 > -9"
      },
      {
        "problem": "Find -7 + 4.",
        "steps": [
          "Start at -7 on the number line.",
          "Adding 4 means move 4 spaces to the RIGHT.",
          "Count: -7, -6, -5, -4, -3.",
          "You land on -3."
        ],
        "answer": "-3"
      },
      {
        "problem": "A diver is at -120 feet. He goes down 35 more feet, then rises 50 feet. Where is he now?",
        "steps": [
          "Going down means subtract: -120 - 35 = -155 feet.",
          "Rising means add: -155 + 50.",
          "Move 50 right from -155 to get -105.",
          "The diver is at -105 feet."
        ],
        "answer": "-105 feet"
      }
    ],
    "bank": [
      {
        "prompt": "Which number means \"7 below zero\"?",
        "answer": "-7",
        "options": [
          "-7",
          "7",
          "0",
          "-0.7"
        ],
        "distractors": [
          "7",
          "0",
          "-0.7"
        ],
        "explain": "Below zero means negative, so 7 below zero is -7."
      },
      {
        "prompt": "On a number line, which way are negative numbers from zero?",
        "answer": "To the left",
        "options": [
          "To the left",
          "To the right",
          "Above zero",
          "They are not on the line"
        ],
        "distractors": [
          "To the right",
          "Above zero",
          "They are not on the line"
        ],
        "explain": "Negative numbers sit to the left of zero on a number line."
      },
      {
        "prompt": "What is the opposite of 9?",
        "answer": "-9",
        "options": [
          "-9",
          "9",
          "0",
          "1/9"
        ],
        "distractors": [
          "9",
          "0",
          "1/9"
        ],
        "explain": "The opposite of a number has the same distance from 0 but the other sign."
      },
      {
        "prompt": "What is the opposite of -25?",
        "answer": "25",
        "options": [
          "25",
          "-25",
          "0",
          "-50"
        ],
        "distractors": [
          "-25",
          "0",
          "-50"
        ],
        "explain": "The opposite of -25 is the positive number 25."
      },
      {
        "prompt": "What is |-13| (the absolute value of -13)?",
        "answer": "13",
        "options": [
          "13",
          "-13",
          "0",
          "26"
        ],
        "distractors": [
          "-13",
          "0",
          "26"
        ],
        "explain": "Absolute value is the distance from 0, which is always positive: 13."
      },
      {
        "prompt": "Which symbol makes this true: -6 ___ -2 ?",
        "answer": "<",
        "options": [
          "<",
          ">",
          "=",
          "≥"
        ],
        "distractors": [
          ">",
          "=",
          "≥"
        ],
        "explain": "-6 is farther left than -2, so -6 is less than -2."
      },
      {
        "prompt": "Order from least to greatest: -7, -3, 0, 2",
        "answer": "-7, -3, 0, 2",
        "options": [
          "-7, -3, 0, 2",
          "0, 2, -3, -7",
          "-3, -7, 0, 2",
          "2, 0, -3, -7"
        ],
        "distractors": [
          "0, 2, -3, -7",
          "-3, -7, 0, 2",
          "2, 0, -3, -7"
        ],
        "explain": "On a number line they go -7, -3, 0, 2 from left to right."
      },
      {
        "prompt": "Which number is the greatest: -5, -1, -9, -3 ?",
        "answer": "-1",
        "options": [
          "-1",
          "-9",
          "-5",
          "-3"
        ],
        "distractors": [
          "-9",
          "-5",
          "-3"
        ],
        "explain": "-1 is closest to zero, so it is the greatest of these negatives."
      },
      {
        "prompt": "What is -8 + 3?",
        "answer": "-5",
        "options": [
          "-5",
          "5",
          "-11",
          "11"
        ],
        "distractors": [
          "5",
          "-11",
          "11"
        ],
        "explain": "Start at -8 and move 3 right to land on -5."
      },
      {
        "prompt": "What is -9 + (-6)?",
        "answer": "-15",
        "options": [
          "-15",
          "-3",
          "15",
          "3"
        ],
        "distractors": [
          "-3",
          "15",
          "3"
        ],
        "explain": "Two negatives add to a bigger negative: -15."
      },
      {
        "prompt": "What is 12 - (-5)?",
        "answer": "17",
        "options": [
          "17",
          "7",
          "-17",
          "-7"
        ],
        "distractors": [
          "7",
          "-17",
          "-7"
        ],
        "explain": "Subtracting a negative is the same as adding: 12 + 5 = 17."
      },
      {
        "prompt": "What is -6 - (-10)?",
        "answer": "4",
        "options": [
          "4",
          "-16",
          "-4",
          "16"
        ],
        "distractors": [
          "-16",
          "-4",
          "16"
        ],
        "explain": "-6 - (-10) becomes -6 + 10 = 4."
      },
      {
        "prompt": "What is -7 - 4?",
        "answer": "-11",
        "options": [
          "-11",
          "-3",
          "11",
          "3"
        ],
        "distractors": [
          "-3",
          "11",
          "3"
        ],
        "explain": "Going more negative: -7 - 4 = -11."
      },
      {
        "prompt": "Which value of x makes |x| = 6 true (besides 6)?",
        "answer": "-6",
        "options": [
          "-6",
          "0",
          "6",
          "-36"
        ],
        "distractors": [
          "0",
          "6",
          "-36"
        ],
        "explain": "Both 6 and -6 are 6 units from zero, so x can be -6."
      },
      {
        "prompt": "What is -15 + 15?",
        "answer": "0",
        "options": [
          "0",
          "30",
          "-30",
          "15"
        ],
        "distractors": [
          "30",
          "-30",
          "15"
        ],
        "explain": "A number plus its opposite always equals 0."
      },
      {
        "prompt": "The temperature is -5°F. It drops 8 degrees. What is the new temperature?",
        "answer": "-13°F",
        "options": [
          "-13°F",
          "3°F",
          "-3°F",
          "13°F"
        ],
        "distractors": [
          "3°F",
          "-3°F",
          "13°F"
        ],
        "explain": "Dropping means subtract: -5 - 8 = -13°F."
      },
      {
        "prompt": "A diver is at -150 feet. She rises 40 feet. What is her new depth?",
        "answer": "-110 feet",
        "options": [
          "-110 feet",
          "-190 feet",
          "110 feet",
          "-40 feet"
        ],
        "distractors": [
          "-190 feet",
          "110 feet",
          "-40 feet"
        ],
        "explain": "Rising adds: -150 + 40 = -110 feet."
      },
      {
        "prompt": "Mia's bank account is -$45 (overdrawn). She deposits $60. What is her balance?",
        "answer": "$15",
        "options": [
          "$15",
          "-$15",
          "-$105",
          "$105"
        ],
        "distractors": [
          "-$15",
          "-$105",
          "$105"
        ],
        "explain": "-45 + 60 = 15, so she now has $15."
      },
      {
        "prompt": "A submarine is 8 m below sea level, shown as -8. A bird is 13 m above where the submarine is. What is the bird's elevation?",
        "answer": "5 m",
        "options": [
          "5 m",
          "-5 m",
          "21 m",
          "-21 m"
        ],
        "distractors": [
          "-5 m",
          "21 m",
          "-21 m"
        ],
        "explain": "-8 + 13 = 5, so the bird is 5 m above sea level."
      },
      {
        "prompt": "Which list is ordered from coldest to warmest: -3°, -12°, -7° ?",
        "answer": "-12°, -7°, -3°",
        "options": [
          "-12°, -7°, -3°",
          "-3°, -7°, -12°",
          "-12°, -3°, -7°",
          "-7°, -12°, -3°"
        ],
        "distractors": [
          "-3°, -7°, -12°",
          "-12°, -3°, -7°",
          "-7°, -12°, -3°"
        ],
        "explain": "Coldest is the smallest number: -12°, then -7°, then -3°."
      },
      {
        "prompt": "In a game, Ravi loses 3 points then loses 6 more. His score change is -3 + (-6). What is it?",
        "answer": "-9",
        "options": [
          "-9",
          "-3",
          "9",
          "3"
        ],
        "distractors": [
          "-3",
          "9",
          "3"
        ],
        "explain": "Losing both: -3 + (-6) = -9 points."
      },
      {
        "prompt": "A football team gains 5 yards, then loses 12 yards. What is the total yardage?",
        "answer": "-7 yards",
        "options": [
          "-7 yards",
          "7 yards",
          "17 yards",
          "-17 yards"
        ],
        "distractors": [
          "7 yards",
          "17 yards",
          "-17 yards"
        ],
        "explain": "5 + (-12) = -7, a net loss of 7 yards."
      },
      {
        "prompt": "Death Valley is at -86 m and a nearby hill is at 14 m. How much higher is the hill than Death Valley?",
        "answer": "100 m",
        "options": [
          "100 m",
          "72 m",
          "-72 m",
          "-100 m"
        ],
        "distractors": [
          "72 m",
          "-72 m",
          "-100 m"
        ],
        "explain": "Distance is 14 - (-86) = 14 + 86 = 100 m."
      },
      {
        "prompt": "At dawn it was -4°C. By noon the temperature was 9°C. By how many degrees did it rise?",
        "answer": "13 degrees",
        "options": [
          "13 degrees",
          "5 degrees",
          "-13 degrees",
          "-5 degrees"
        ],
        "distractors": [
          "5 degrees",
          "-13 degrees",
          "-5 degrees"
        ],
        "explain": "9 - (-4) = 9 + 4 = 13 degrees of warming."
      }
    ],
    "worksheetA": [
      {
        "q": "Write the integer for \"12 below zero.\"",
        "a": "-12"
      },
      {
        "q": "What is the opposite of -8?",
        "a": "8"
      },
      {
        "q": "What is the opposite of 15?",
        "a": "-15"
      },
      {
        "q": "Find |-20|.",
        "a": "20"
      },
      {
        "q": "Find |17|.",
        "a": "17"
      },
      {
        "q": "Compare using < or >: -3 ___ -7",
        "a": "-3 > -7"
      },
      {
        "q": "Order from least to greatest: 4, -2, -6, 1",
        "a": "-6, -2, 1, 4"
      },
      {
        "q": "Find -5 + (-7).",
        "a": "-12"
      },
      {
        "q": "Find -10 + 6.",
        "a": "-4"
      },
      {
        "q": "Find 8 - 13.",
        "a": "-5"
      },
      {
        "q": "Find -4 - (-9).",
        "a": "5"
      },
      {
        "q": "Find 3 + (-11).",
        "a": "-8"
      }
    ],
    "worksheetB": [
      {
        "q": "The temperature is -2°C and falls 9 degrees. What is the new temperature?",
        "a": "-11°C"
      },
      {
        "q": "A cave explorer is at -75 feet. She climbs up 30 feet. What is her new depth?",
        "a": "-45 feet"
      },
      {
        "q": "Leo's account balance is -$30. He deposits $50. What is his new balance?",
        "a": "$20"
      },
      {
        "q": "A submarine sits at -90 m and a fish swims 25 m above it. What is the fish's depth?",
        "a": "-65 m"
      },
      {
        "q": "At midnight it was -6°F. By noon it rose to 8°F. How many degrees did it rise?",
        "a": "14 degrees"
      },
      {
        "q": "A diver descends from the surface to -40 ft, then descends 18 ft more. Where is the diver?",
        "a": "-58 feet"
      },
      {
        "q": "List from coldest to warmest: -1°, -9°, 4°, -5°",
        "a": "-9°, -5°, -1°, 4°"
      },
      {
        "q": "A hiker climbs from -15 m (below sea level) to 22 m. How far did she climb?",
        "a": "37 m"
      },
      {
        "q": "In a board game, Sam loses 7 points, then gains 4 points. What is his total change?",
        "a": "-3 points"
      },
      {
        "q": "A parking garage labels floors -3, -1, and -2 below ground. Which floor is the lowest?",
        "a": "-3"
      },
      {
        "q": "The elevator starts at floor -2, goes up 5 floors, then down 9 floors. What floor is it on?",
        "a": "-6"
      },
      {
        "q": "★ A weather balloon at 1,200 m drops a sensor that falls to -50 m (below sea level). What is the total distance the sensor traveled down?",
        "a": "1,250 m"
      }
    ],
    "preQuiz": [
      {
        "prompt": "Write the integer for \"5 below zero.\"",
        "answer": "-5",
        "options": [
          "-5",
          "5",
          "0",
          "-0.5"
        ],
        "distractors": [
          "5",
          "0",
          "-0.5"
        ],
        "explain": "Below zero means a negative number, so it is -5."
      },
      {
        "prompt": "What is the opposite of -12?",
        "answer": "12",
        "options": [
          "12",
          "-12",
          "0",
          "-24"
        ],
        "distractors": [
          "-12",
          "0",
          "-24"
        ],
        "explain": "The opposite of -12 is 12."
      },
      {
        "prompt": "What is |-9|?",
        "answer": "9",
        "options": [
          "9",
          "-9",
          "0",
          "18"
        ],
        "distractors": [
          "-9",
          "0",
          "18"
        ],
        "explain": "Absolute value is distance from 0, so |-9| = 9."
      },
      {
        "prompt": "Compare: -8 ___ -3",
        "answer": "<",
        "options": [
          "<",
          ">",
          "=",
          "≥"
        ],
        "distractors": [
          ">",
          "=",
          "≥"
        ],
        "explain": "-8 is farther left, so it is less than -3."
      },
      {
        "prompt": "Order from least to greatest: -2, 3, -6, 0",
        "answer": "-6, -2, 0, 3",
        "options": [
          "-6, -2, 0, 3",
          "0, -2, 3, -6",
          "-2, -6, 0, 3",
          "3, 0, -2, -6"
        ],
        "distractors": [
          "0, -2, 3, -6",
          "-2, -6, 0, 3",
          "3, 0, -2, -6"
        ],
        "explain": "Left to right on a number line: -6, -2, 0, 3."
      },
      {
        "prompt": "Find -7 + 2.",
        "answer": "-5",
        "options": [
          "-5",
          "5",
          "-9",
          "9"
        ],
        "distractors": [
          "5",
          "-9",
          "9"
        ],
        "explain": "Start at -7 and move 2 right to reach -5."
      },
      {
        "prompt": "Find 9 - (-4).",
        "answer": "13",
        "options": [
          "13",
          "5",
          "-13",
          "-5"
        ],
        "distractors": [
          "5",
          "-13",
          "-5"
        ],
        "explain": "Subtracting a negative adds: 9 + 4 = 13."
      },
      {
        "prompt": "The temperature is -3°C and drops 6 degrees. What is the new temperature?",
        "answer": "-9°C",
        "options": [
          "-9°C",
          "3°C",
          "-3°C",
          "9°C"
        ],
        "distractors": [
          "3°C",
          "-3°C",
          "9°C"
        ],
        "explain": "Dropping subtracts: -3 - 6 = -9°C."
      }
    ],
    "postQuiz": [
      {
        "prompt": "Write the integer for \"8 below zero.\"",
        "answer": "-8",
        "options": [
          "-8",
          "8",
          "0",
          "-0.8"
        ],
        "distractors": [
          "8",
          "0",
          "-0.8"
        ],
        "explain": "Below zero means negative, so it is -8."
      },
      {
        "prompt": "What is the opposite of -20?",
        "answer": "20",
        "options": [
          "20",
          "-20",
          "0",
          "-40"
        ],
        "distractors": [
          "-20",
          "0",
          "-40"
        ],
        "explain": "The opposite of -20 is 20."
      },
      {
        "prompt": "What is |-14|?",
        "answer": "14",
        "options": [
          "14",
          "-14",
          "0",
          "28"
        ],
        "distractors": [
          "-14",
          "0",
          "28"
        ],
        "explain": "Absolute value is distance from 0, so |-14| = 14."
      },
      {
        "prompt": "Compare: -2 ___ -9",
        "answer": ">",
        "options": [
          ">",
          "<",
          "=",
          "≤"
        ],
        "distractors": [
          "<",
          "=",
          "≤"
        ],
        "explain": "-2 is closer to zero, so it is greater than -9."
      },
      {
        "prompt": "Order from least to greatest: -4, 1, -1, 5",
        "answer": "-4, -1, 1, 5",
        "options": [
          "-4, -1, 1, 5",
          "1, -1, 5, -4",
          "-1, -4, 1, 5",
          "5, 1, -1, -4"
        ],
        "distractors": [
          "1, -1, 5, -4",
          "-1, -4, 1, 5",
          "5, 1, -1, -4"
        ],
        "explain": "Left to right on a number line: -4, -1, 1, 5."
      },
      {
        "prompt": "Find -6 + 4.",
        "answer": "-2",
        "options": [
          "-2",
          "2",
          "-10",
          "10"
        ],
        "distractors": [
          "2",
          "-10",
          "10"
        ],
        "explain": "Start at -6 and move 4 right to reach -2."
      },
      {
        "prompt": "Find 11 - (-3).",
        "answer": "14",
        "options": [
          "14",
          "8",
          "-14",
          "-8"
        ],
        "distractors": [
          "8",
          "-14",
          "-8"
        ],
        "explain": "Subtracting a negative adds: 11 + 3 = 14."
      },
      {
        "prompt": "A diver is at -60 feet and rises 25 feet. What is the new depth?",
        "answer": "-35 feet",
        "options": [
          "-35 feet",
          "-85 feet",
          "35 feet",
          "-25 feet"
        ],
        "distractors": [
          "-85 feet",
          "35 feet",
          "-25 feet"
        ],
        "explain": "Rising adds: -60 + 25 = -35 feet."
      }
    ]
  },
  {
    "slug": "coordinate-plane",
    "title": "The Coordinate Plane",
    "icon": "🧭",
    "accent": "#0d9488",
    "standard": "Builds 6.NS.C.6,8",
    "domain": "Integers & Coordinate Plane",
    "blurb": "Plot and read points in all four quadrants and measure distance — the bridge to graphing and geometry.",
    "skills": [
      "Plot points",
      "Quadrants",
      "Distance",
      "Reflections"
    ],
    "lessons": 4,
    "objective": "I can plot ordered pairs in all four quadrants, name quadrants and axes, find the distance between two points, and reflect points across the axes.",
    "estMin": 30,
    "vocab": [
      {
        "term": "Ordered pair",
        "def": "Two numbers (x, y) that name one point."
      },
      {
        "term": "x-axis",
        "def": "The horizontal number line on the grid."
      },
      {
        "term": "y-axis",
        "def": "The vertical number line on the grid."
      },
      {
        "term": "Quadrant",
        "def": "One of four sections the axes make on the plane."
      },
      {
        "term": "Origin",
        "def": "The center point (0, 0) where axes cross."
      },
      {
        "term": "Reflection",
        "def": "A flip of a point across an axis line."
      }
    ],
    "materials": [
      "Graph paper with four quadrants",
      "Pencil and colored markers",
      "Coordinate plane reference card"
    ],
    "workedExamples": [
      {
        "problem": "Name the quadrant for the point (4, 3).",
        "steps": [
          "Step 1: Look at the x-value, 4. It is positive, so go right.",
          "Step 2: Look at the y-value, 3. It is positive, so go up.",
          "Step 3: Right and up lands in the top-right section, which is Quadrant I."
        ],
        "answer": "Quadrant I"
      },
      {
        "problem": "Find the distance between (2, 1) and (2, 6).",
        "steps": [
          "Step 1: The x-values are the same (2 and 2), so this is a vertical line.",
          "Step 2: Subtract the y-values: 6 - 1 = 5.",
          "Step 3: The points are 5 units apart."
        ],
        "answer": "5 units"
      },
      {
        "problem": "Reflect the point (-3, 5) across the x-axis. What are the new coordinates?",
        "steps": [
          "Step 1: Reflecting across the x-axis flips the point up-down, so keep x the same.",
          "Step 2: Change the sign of the y-value: 5 becomes -5.",
          "Step 3: The x-value stays -3, so the new point is (-3, -5)."
        ],
        "answer": "(-3, -5)"
      }
    ],
    "bank": [
      {
        "prompt": "What is the name of the point (0, 0) where the axes cross?",
        "answer": "The origin",
        "options": [
          "The origin",
          "The center axis",
          "Quadrant I",
          "The y-intercept"
        ],
        "distractors": [
          "The center axis",
          "Quadrant I",
          "The y-intercept"
        ],
        "explain": "The point (0, 0) where the x-axis and y-axis meet is called the origin."
      },
      {
        "prompt": "In the ordered pair (5, 2), which number is the x-coordinate?",
        "answer": "5",
        "options": [
          "5",
          "2",
          "7",
          "0"
        ],
        "distractors": [
          "2",
          "7",
          "0"
        ],
        "explain": "In (x, y), the first number is always the x-coordinate, so it is 5."
      },
      {
        "prompt": "Which axis is the horizontal number line?",
        "answer": "x-axis",
        "options": [
          "x-axis",
          "y-axis",
          "z-axis",
          "origin"
        ],
        "distractors": [
          "y-axis",
          "z-axis",
          "origin"
        ],
        "explain": "The x-axis runs left and right, so it is the horizontal axis."
      },
      {
        "prompt": "To plot (3, 4), you first move right 3 and then move which way?",
        "answer": "Up 4",
        "options": [
          "Up 4",
          "Down 4",
          "Left 4",
          "Right 4"
        ],
        "distractors": [
          "Down 4",
          "Left 4",
          "Right 4"
        ],
        "explain": "A positive y-value of 4 means move up 4 from the x-axis."
      },
      {
        "prompt": "Which quadrant contains the point (6, 7)?",
        "answer": "Quadrant I",
        "options": [
          "Quadrant I",
          "Quadrant II",
          "Quadrant III",
          "Quadrant IV"
        ],
        "distractors": [
          "Quadrant II",
          "Quadrant III",
          "Quadrant IV"
        ],
        "explain": "Both coordinates are positive, so the point is in Quadrant I."
      },
      {
        "prompt": "Which quadrant contains the point (-4, 2)?",
        "answer": "Quadrant II",
        "options": [
          "Quadrant II",
          "Quadrant I",
          "Quadrant III",
          "Quadrant IV"
        ],
        "distractors": [
          "Quadrant I",
          "Quadrant III",
          "Quadrant IV"
        ],
        "explain": "A negative x and positive y place the point in the top-left, Quadrant II."
      },
      {
        "prompt": "Which quadrant contains the point (-3, -5)?",
        "answer": "Quadrant III",
        "options": [
          "Quadrant III",
          "Quadrant I",
          "Quadrant II",
          "Quadrant IV"
        ],
        "distractors": [
          "Quadrant I",
          "Quadrant II",
          "Quadrant IV"
        ],
        "explain": "Both coordinates are negative, so the point is in the bottom-left, Quadrant III."
      },
      {
        "prompt": "Which quadrant contains the point (8, -1)?",
        "answer": "Quadrant IV",
        "options": [
          "Quadrant IV",
          "Quadrant I",
          "Quadrant II",
          "Quadrant III"
        ],
        "distractors": [
          "Quadrant I",
          "Quadrant II",
          "Quadrant III"
        ],
        "explain": "A positive x and negative y place the point in the bottom-right, Quadrant IV."
      },
      {
        "prompt": "The point (0, 5) lies on which axis?",
        "answer": "y-axis",
        "options": [
          "y-axis",
          "x-axis",
          "Quadrant I",
          "Quadrant II"
        ],
        "distractors": [
          "x-axis",
          "Quadrant I",
          "Quadrant II"
        ],
        "explain": "When the x-coordinate is 0, the point sits on the vertical y-axis."
      },
      {
        "prompt": "The point (-7, 0) lies on which axis?",
        "answer": "x-axis",
        "options": [
          "x-axis",
          "y-axis",
          "Quadrant III",
          "origin"
        ],
        "distractors": [
          "y-axis",
          "Quadrant III",
          "origin"
        ],
        "explain": "When the y-coordinate is 0, the point sits on the horizontal x-axis."
      },
      {
        "prompt": "What is the distance between (1, 2) and (1, 9)?",
        "answer": "7 units",
        "options": [
          "7 units",
          "8 units",
          "11 units",
          "10 units"
        ],
        "distractors": [
          "8 units",
          "11 units",
          "10 units"
        ],
        "explain": "Same x means a vertical line, so subtract the y-values: 9 - 2 = 7."
      },
      {
        "prompt": "What is the distance between (3, 4) and (10, 4)?",
        "answer": "7 units",
        "options": [
          "7 units",
          "6 units",
          "14 units",
          "13 units"
        ],
        "distractors": [
          "6 units",
          "14 units",
          "13 units"
        ],
        "explain": "Same y means a horizontal line, so subtract the x-values: 10 - 3 = 7."
      },
      {
        "prompt": "Reflect (5, 2) across the x-axis. What is the new point?",
        "answer": "(5, -2)",
        "options": [
          "(5, -2)",
          "(-5, 2)",
          "(-5, -2)",
          "(2, 5)"
        ],
        "distractors": [
          "(-5, 2)",
          "(-5, -2)",
          "(2, 5)"
        ],
        "explain": "Across the x-axis, keep x and flip the sign of y, giving (5, -2)."
      },
      {
        "prompt": "Reflect (4, 3) across the y-axis. What is the new point?",
        "answer": "(-4, 3)",
        "options": [
          "(-4, 3)",
          "(4, -3)",
          "(-4, -3)",
          "(3, 4)"
        ],
        "distractors": [
          "(4, -3)",
          "(-4, -3)",
          "(3, 4)"
        ],
        "explain": "Across the y-axis, flip the sign of x and keep y, giving (-4, 3)."
      },
      {
        "prompt": "What is the distance between (-2, 5) and (6, 5)?",
        "answer": "8 units",
        "options": [
          "8 units",
          "4 units",
          "11 units",
          "7 units"
        ],
        "distractors": [
          "4 units",
          "11 units",
          "7 units"
        ],
        "explain": "Same y, so find the gap on the x-axis: from -2 to 6 is 8 units."
      },
      {
        "prompt": "What is the distance between (-3, -1) and (-3, 4)?",
        "answer": "5 units",
        "options": [
          "5 units",
          "3 units",
          "7 units",
          "4 units"
        ],
        "distractors": [
          "3 units",
          "7 units",
          "4 units"
        ],
        "explain": "Same x, so the gap on the y-axis from -1 to 4 is 5 units."
      },
      {
        "prompt": "Reflect (-6, -2) across the x-axis. What is the new point?",
        "answer": "(-6, 2)",
        "options": [
          "(-6, 2)",
          "(6, -2)",
          "(6, 2)",
          "(-2, -6)"
        ],
        "distractors": [
          "(6, -2)",
          "(6, 2)",
          "(-2, -6)"
        ],
        "explain": "Across the x-axis, keep x and flip y: -2 becomes 2, giving (-6, 2)."
      },
      {
        "prompt": "Maria walks her dog from the gate at (2, 3) to the bench at (2, 11) on a park map where each unit is 1 meter. How far does she walk?",
        "answer": "8 meters",
        "options": [
          "8 meters",
          "9 meters",
          "14 meters",
          "13 meters"
        ],
        "distractors": [
          "9 meters",
          "14 meters",
          "13 meters"
        ],
        "explain": "Same x means a vertical path: 11 - 3 = 8 meters."
      },
      {
        "prompt": "On a map, a school is at (-5, 4) and a library is at (3, 4), where each unit is 1 block. How many blocks apart are they?",
        "answer": "8 blocks",
        "options": [
          "8 blocks",
          "2 blocks",
          "7 blocks",
          "12 blocks"
        ],
        "distractors": [
          "2 blocks",
          "7 blocks",
          "12 blocks"
        ],
        "explain": "Same y, so count from -5 to 3 along the x-axis: that is 8 blocks."
      },
      {
        "prompt": "A treasure chest is at (-4, -6). On the map, treasures in Quadrant III are buried. Is the chest in the buried zone?",
        "answer": "Yes, it is in Quadrant III",
        "options": [
          "Yes, it is in Quadrant III",
          "No, it is in Quadrant I",
          "No, it is in Quadrant II",
          "No, it is in Quadrant IV"
        ],
        "distractors": [
          "No, it is in Quadrant I",
          "No, it is in Quadrant II",
          "No, it is in Quadrant IV"
        ],
        "explain": "Both coordinates are negative, so the point is in Quadrant III, the buried zone."
      },
      {
        "prompt": "A drone starts at (7, -3). It flies to its mirror spot reflected across the x-axis. Where does it land?",
        "answer": "(7, 3)",
        "options": [
          "(7, 3)",
          "(-7, -3)",
          "(-7, 3)",
          "(-3, 7)"
        ],
        "distractors": [
          "(-7, -3)",
          "(-7, 3)",
          "(-3, 7)"
        ],
        "explain": "Across the x-axis, keep x and flip y: -3 becomes 3, giving (7, 3)."
      },
      {
        "prompt": "Two friends sit at (-6, 2) and (-6, -7) on a seating grid where each unit is 1 seat. How many seats apart are they?",
        "answer": "9 seats",
        "options": [
          "9 seats",
          "5 seats",
          "8 seats",
          "13 seats"
        ],
        "distractors": [
          "5 seats",
          "8 seats",
          "13 seats"
        ],
        "explain": "Same x, so find the y-gap: from 2 down to -7 is 9 seats."
      },
      {
        "prompt": "A rectangle has corners at (1, 2), (8, 2), (8, 6), and (1, 6). What is the length of its bottom side from (1, 2) to (8, 2)?",
        "answer": "7 units",
        "options": [
          "7 units",
          "4 units",
          "9 units",
          "6 units"
        ],
        "distractors": [
          "4 units",
          "9 units",
          "6 units"
        ],
        "explain": "The bottom side is horizontal, so subtract x-values: 8 - 1 = 7 units."
      },
      {
        "prompt": "A hiker at (-5, 8) reflects her position across the y-axis to mark a return point, then walks straight down to the x-axis. How many total units does she travel for both moves?",
        "answer": "18 units",
        "options": [
          "18 units",
          "16 units",
          "13 units",
          "10 units"
        ],
        "distractors": [
          "16 units",
          "13 units",
          "10 units"
        ],
        "explain": "Reflection across the y-axis moves from -5 to 5, a 10-unit horizontal trip; then down 8 units to the x-axis; 10 + 8 = 18."
      }
    ],
    "worksheetA": [
      {
        "q": "In the ordered pair (7, 4), what is the y-coordinate?",
        "a": "4"
      },
      {
        "q": "Name the quadrant for the point (3, 9).",
        "a": "Quadrant I"
      },
      {
        "q": "Name the quadrant for the point (-2, 6).",
        "a": "Quadrant II"
      },
      {
        "q": "Name the quadrant for the point (-5, -3).",
        "a": "Quadrant III"
      },
      {
        "q": "Name the quadrant for the point (4, -8).",
        "a": "Quadrant IV"
      },
      {
        "q": "On which axis does the point (0, -6) lie?",
        "a": "y-axis"
      },
      {
        "q": "Find the distance between (2, 3) and (2, 10).",
        "a": "7 units"
      },
      {
        "q": "Find the distance between (1, 5) and (9, 5).",
        "a": "8 units"
      },
      {
        "q": "Find the distance between (-4, 2) and (5, 2).",
        "a": "9 units"
      },
      {
        "q": "Reflect (6, 3) across the x-axis.",
        "a": "(6, -3)"
      },
      {
        "q": "Reflect (-7, 2) across the y-axis.",
        "a": "(7, 2)"
      },
      {
        "q": "Reflect (-3, -5) across the x-axis.",
        "a": "(-3, 5)"
      }
    ],
    "worksheetB": [
      {
        "q": "On a park map, the swings are at (-3, 5) in which quadrant?",
        "a": "Quadrant II"
      },
      {
        "q": "A pin on a map is at (0, 0). What is this point called?",
        "a": "The origin"
      },
      {
        "q": "Sam plots his house at (4, 4) by moving right 4. Which direction does he move next, and how far?",
        "a": "Up 4"
      },
      {
        "q": "A cat sits at (5, 2) and a mouse at (5, 9) on a grid where each unit is 1 foot. How far apart are they?",
        "a": "7 feet"
      },
      {
        "q": "A store is at (-6, 3) and a bank is at (2, 3), each unit 1 block. How many blocks apart are they?",
        "a": "8 blocks"
      },
      {
        "q": "A boat at (4, -5) moves to its reflection across the x-axis. Where does it land?",
        "a": "(4, 5)"
      },
      {
        "q": "A flag at (-2, 7) is reflected across the y-axis to mark a twin flag. Where is the twin flag?",
        "a": "(2, 7)"
      },
      {
        "q": "On a map, gold is buried only in Quadrant IV. Is the point (6, -4) in the gold zone?",
        "a": "Yes, it is in Quadrant IV"
      },
      {
        "q": "Two seats are at (-3, 6) and (-3, -2), each unit 1 seat. How many seats apart are they?",
        "a": "8 seats"
      },
      {
        "q": "A rectangle has corners (2, 1), (2, 7), (9, 7), and (9, 1). How long is the left side from (2, 1) to (2, 7)?",
        "a": "6 units"
      },
      {
        "q": "A delivery starts at (-8, 3), moves to (-8, -4) where each unit is 1 mile, then turns. How far was the first part of the trip?",
        "a": "7 miles"
      },
      {
        "q": "★ A robot at (-5, 6) is reflected across the y-axis, then that new point is reflected across the x-axis. What are the final coordinates?",
        "a": "(5, -6)"
      }
    ],
    "preQuiz": [
      {
        "prompt": "In the ordered pair (8, 1), what is the x-coordinate?",
        "answer": "8",
        "options": [
          "8",
          "1",
          "9",
          "0"
        ],
        "distractors": [
          "1",
          "9",
          "0"
        ],
        "explain": "The first number in (x, y) is the x-coordinate, which is 8."
      },
      {
        "prompt": "Which quadrant contains the point (5, 6)?",
        "answer": "Quadrant I",
        "options": [
          "Quadrant I",
          "Quadrant II",
          "Quadrant III",
          "Quadrant IV"
        ],
        "distractors": [
          "Quadrant II",
          "Quadrant III",
          "Quadrant IV"
        ],
        "explain": "Both coordinates are positive, so the point is in Quadrant I."
      },
      {
        "prompt": "Which quadrant contains the point (-3, 7)?",
        "answer": "Quadrant II",
        "options": [
          "Quadrant II",
          "Quadrant I",
          "Quadrant III",
          "Quadrant IV"
        ],
        "distractors": [
          "Quadrant I",
          "Quadrant III",
          "Quadrant IV"
        ],
        "explain": "Negative x and positive y place the point in Quadrant II."
      },
      {
        "prompt": "The point (0, 9) lies on which axis?",
        "answer": "y-axis",
        "options": [
          "y-axis",
          "x-axis",
          "Quadrant I",
          "origin"
        ],
        "distractors": [
          "x-axis",
          "Quadrant I",
          "origin"
        ],
        "explain": "When x is 0, the point sits on the vertical y-axis."
      },
      {
        "prompt": "What is the distance between (3, 2) and (3, 8)?",
        "answer": "6 units",
        "options": [
          "6 units",
          "5 units",
          "11 units",
          "10 units"
        ],
        "distractors": [
          "5 units",
          "11 units",
          "10 units"
        ],
        "explain": "Same x means a vertical line: 8 - 2 = 6 units."
      },
      {
        "prompt": "What is the distance between (2, 5) and (9, 5)?",
        "answer": "7 units",
        "options": [
          "7 units",
          "4 units",
          "14 units",
          "11 units"
        ],
        "distractors": [
          "4 units",
          "14 units",
          "11 units"
        ],
        "explain": "Same y means a horizontal line: 9 - 2 = 7 units."
      },
      {
        "prompt": "Reflect (4, 6) across the x-axis. What is the new point?",
        "answer": "(4, -6)",
        "options": [
          "(4, -6)",
          "(-4, 6)",
          "(-4, -6)",
          "(6, 4)"
        ],
        "distractors": [
          "(-4, 6)",
          "(-4, -6)",
          "(6, 4)"
        ],
        "explain": "Across the x-axis, keep x and flip y, giving (4, -6)."
      },
      {
        "prompt": "A library is at (-7, 2) and a park at (4, 2), each unit 1 block. How many blocks apart are they?",
        "answer": "11 blocks",
        "options": [
          "11 blocks",
          "3 blocks",
          "9 blocks",
          "5 blocks"
        ],
        "distractors": [
          "3 blocks",
          "9 blocks",
          "5 blocks"
        ],
        "explain": "Same y, so count from -7 to 4 on the x-axis: that is 11 blocks."
      }
    ],
    "postQuiz": [
      {
        "prompt": "In the ordered pair (6, 9), what is the x-coordinate?",
        "answer": "6",
        "options": [
          "6",
          "9",
          "15",
          "0"
        ],
        "distractors": [
          "9",
          "15",
          "0"
        ],
        "explain": "The first number in (x, y) is the x-coordinate, which is 6."
      },
      {
        "prompt": "Which quadrant contains the point (7, 3)?",
        "answer": "Quadrant I",
        "options": [
          "Quadrant I",
          "Quadrant II",
          "Quadrant III",
          "Quadrant IV"
        ],
        "distractors": [
          "Quadrant II",
          "Quadrant III",
          "Quadrant IV"
        ],
        "explain": "Both coordinates are positive, so the point is in Quadrant I."
      },
      {
        "prompt": "Which quadrant contains the point (-6, 4)?",
        "answer": "Quadrant II",
        "options": [
          "Quadrant II",
          "Quadrant I",
          "Quadrant III",
          "Quadrant IV"
        ],
        "distractors": [
          "Quadrant I",
          "Quadrant III",
          "Quadrant IV"
        ],
        "explain": "Negative x and positive y place the point in Quadrant II."
      },
      {
        "prompt": "The point (0, -4) lies on which axis?",
        "answer": "y-axis",
        "options": [
          "y-axis",
          "x-axis",
          "Quadrant IV",
          "origin"
        ],
        "distractors": [
          "x-axis",
          "Quadrant IV",
          "origin"
        ],
        "explain": "When x is 0, the point sits on the vertical y-axis."
      },
      {
        "prompt": "What is the distance between (5, 1) and (5, 9)?",
        "answer": "8 units",
        "options": [
          "8 units",
          "4 units",
          "14 units",
          "10 units"
        ],
        "distractors": [
          "4 units",
          "14 units",
          "10 units"
        ],
        "explain": "Same x means a vertical line: 9 - 1 = 8 units."
      },
      {
        "prompt": "What is the distance between (3, 6) and (11, 6)?",
        "answer": "8 units",
        "options": [
          "8 units",
          "5 units",
          "17 units",
          "14 units"
        ],
        "distractors": [
          "5 units",
          "17 units",
          "14 units"
        ],
        "explain": "Same y means a horizontal line: 11 - 3 = 8 units."
      },
      {
        "prompt": "Reflect (5, 7) across the x-axis. What is the new point?",
        "answer": "(5, -7)",
        "options": [
          "(5, -7)",
          "(-5, 7)",
          "(-5, -7)",
          "(7, 5)"
        ],
        "distractors": [
          "(-5, 7)",
          "(-5, -7)",
          "(7, 5)"
        ],
        "explain": "Across the x-axis, keep x and flip y, giving (5, -7)."
      },
      {
        "prompt": "A store is at (-8, 3) and a school at (5, 3), each unit 1 block. How many blocks apart are they?",
        "answer": "13 blocks",
        "options": [
          "13 blocks",
          "3 blocks",
          "11 blocks",
          "6 blocks"
        ],
        "distractors": [
          "3 blocks",
          "11 blocks",
          "6 blocks"
        ],
        "explain": "Same y, so count from -8 to 5 on the x-axis: that is 13 blocks."
      }
    ]
  },
  {
    "slug": "expressions",
    "title": "Expressions & Properties",
    "icon": "🧮",
    "accent": "#be123c",
    "standard": "Builds 6.EE.A.1–4",
    "domain": "Expressions & Equations",
    "blurb": "Read, write, and evaluate expressions with exponents and properties — the gateway to algebra.",
    "skills": [
      "Exponents",
      "Evaluate",
      "Write expressions",
      "Like terms"
    ],
    "lessons": 4,
    "objective": "I can use exponents, evaluate expressions, write expressions from words, combine like terms, and use the distributive property.",
    "estMin": 30,
    "vocab": [
      {
        "term": "Exponent",
        "def": "A small number that tells how many times to multiply the base."
      },
      {
        "term": "Base",
        "def": "The number being multiplied by itself in a power."
      },
      {
        "term": "Variable",
        "def": "A letter that stands for an unknown number."
      },
      {
        "term": "Coefficient",
        "def": "The number multiplied by a variable, like 5 in 5x."
      },
      {
        "term": "Like terms",
        "def": "Terms with the same variable raised to the same power."
      },
      {
        "term": "Distributive property",
        "def": "Multiply a number by each term inside the parentheses."
      }
    ],
    "materials": [
      "Pencil and scratch paper",
      "Whiteboard and dry-erase marker",
      "Algebra tiles or counters",
      "Set of printed task cards"
    ],
    "workedExamples": [
      {
        "problem": "Write 3 × 3 × 3 × 3 using an exponent, then find its value.",
        "steps": [
          "Count how many times the base 3 is multiplied: it appears 4 times.",
          "Write the base 3 with the exponent 4: this is 3^4.",
          "Multiply step by step: 3 × 3 = 9, then 9 × 3 = 27, then 27 × 3 = 81.",
          "So the power 3^4 equals 81."
        ],
        "answer": "3^4 = 81"
      },
      {
        "problem": "Evaluate the expression 2x + 5 when x = 4.",
        "steps": [
          "Replace the variable x with 4: the expression becomes 2(4) + 5.",
          "Do multiplication first (order of operations): 2 × 4 = 8.",
          "Now add: 8 + 5 = 13.",
          "The value of the expression is 13."
        ],
        "answer": "13"
      },
      {
        "problem": "Simplify the expression 4(x + 3) + 2x by using the distributive property and combining like terms.",
        "steps": [
          "Distribute the 4 to each term inside the parentheses: 4 × x = 4x and 4 × 3 = 12.",
          "Rewrite the expression: 4x + 12 + 2x.",
          "Combine the like terms 4x and 2x: 4x + 2x = 6x.",
          "Write the simplified expression: 6x + 12."
        ],
        "answer": "6x + 12"
      }
    ],
    "bank": [
      {
        "prompt": "Which expression shows 5 × 5 × 5 using an exponent?",
        "answer": "5^3",
        "options": [
          "5^3",
          "5^5",
          "3^5",
          "5 × 3"
        ],
        "distractors": [
          "5^5",
          "3^5",
          "5 × 3"
        ],
        "explain": "The base 5 is multiplied 3 times, so it is 5^3."
      },
      {
        "prompt": "What is the base in the power 7^2?",
        "answer": "7",
        "options": [
          "7",
          "2",
          "9",
          "14"
        ],
        "distractors": [
          "2",
          "9",
          "14"
        ],
        "explain": "The base is the number being multiplied, which is 7."
      },
      {
        "prompt": "What is the value of 2^3?",
        "answer": "8",
        "options": [
          "8",
          "6",
          "9",
          "23"
        ],
        "distractors": [
          "6",
          "9",
          "23"
        ],
        "explain": "2 × 2 × 2 = 8."
      },
      {
        "prompt": "What is the value of 10^2?",
        "answer": "100",
        "options": [
          "100",
          "20",
          "12",
          "1000"
        ],
        "distractors": [
          "20",
          "12",
          "1000"
        ],
        "explain": "10 × 10 = 100."
      },
      {
        "prompt": "What is the coefficient in the term 6y?",
        "answer": "6",
        "options": [
          "6",
          "y",
          "1",
          "6y"
        ],
        "distractors": [
          "y",
          "1",
          "6y"
        ],
        "explain": "The coefficient is the number multiplied by the variable, which is 6."
      },
      {
        "prompt": "Which expression means 'a number n increased by 8'?",
        "answer": "n + 8",
        "options": [
          "n + 8",
          "8 - n",
          "8n",
          "n - 8"
        ],
        "distractors": [
          "8 - n",
          "8n",
          "n - 8"
        ],
        "explain": "\"Increased by\" means add, so it is n + 8."
      },
      {
        "prompt": "Which expression means '4 times a number x'?",
        "answer": "4x",
        "options": [
          "4x",
          "x + 4",
          "4 + x",
          "x - 4"
        ],
        "distractors": [
          "x + 4",
          "4 + x",
          "x - 4"
        ],
        "explain": "\"Times\" means multiply, so 4 times x is 4x."
      },
      {
        "prompt": "What is the value of 5^2?",
        "answer": "25",
        "options": [
          "25",
          "10",
          "7",
          "52"
        ],
        "distractors": [
          "10",
          "7",
          "52"
        ],
        "explain": "5 × 5 = 25."
      },
      {
        "prompt": "Evaluate 3x when x = 5.",
        "answer": "15",
        "options": [
          "15",
          "8",
          "35",
          "53"
        ],
        "distractors": [
          "8",
          "35",
          "53"
        ],
        "explain": "3 × 5 = 15."
      },
      {
        "prompt": "Which expression means '12 less than a number p'?",
        "answer": "p - 12",
        "options": [
          "p - 12",
          "12 - p",
          "p + 12",
          "12p"
        ],
        "distractors": [
          "12 - p",
          "p + 12",
          "12p"
        ],
        "explain": "\"Less than\" reverses the order, so it is p - 12."
      },
      {
        "prompt": "Combine like terms: 3x + 5x.",
        "answer": "8x",
        "options": [
          "8x",
          "8",
          "15x",
          "8x^2"
        ],
        "distractors": [
          "8",
          "15x",
          "8x^2"
        ],
        "explain": "Add the coefficients: 3 + 5 = 8, so 3x + 5x = 8x."
      },
      {
        "prompt": "Evaluate x + 7 when x = 9.",
        "answer": "16",
        "options": [
          "16",
          "2",
          "79",
          "63"
        ],
        "distractors": [
          "2",
          "79",
          "63"
        ],
        "explain": "9 + 7 = 16."
      },
      {
        "prompt": "Use the distributive property: 2(x + 4).",
        "answer": "2x + 8",
        "options": [
          "2x + 8",
          "2x + 4",
          "x + 8",
          "2x + 6"
        ],
        "distractors": [
          "2x + 4",
          "x + 8",
          "2x + 6"
        ],
        "explain": "Multiply 2 by each term: 2 × x = 2x and 2 × 4 = 8."
      },
      {
        "prompt": "Evaluate 4x - 3 when x = 5.",
        "answer": "17",
        "options": [
          "17",
          "12",
          "20",
          "2"
        ],
        "distractors": [
          "12",
          "20",
          "2"
        ],
        "explain": "4 × 5 = 20, then 20 - 3 = 17."
      },
      {
        "prompt": "Combine like terms: 7y + 2 + 3y.",
        "answer": "10y + 2",
        "options": [
          "10y + 2",
          "12y",
          "10y",
          "9y + 3"
        ],
        "distractors": [
          "12y",
          "10y",
          "9y + 3"
        ],
        "explain": "7y + 3y = 10y, and the 2 stays separate, so 10y + 2."
      },
      {
        "prompt": "What is the value of 3^2 + 4?",
        "answer": "13",
        "options": [
          "13",
          "10",
          "49",
          "11"
        ],
        "distractors": [
          "10",
          "49",
          "11"
        ],
        "explain": "3^2 = 9, then 9 + 4 = 13."
      },
      {
        "prompt": "Use the distributive property: 5(x - 2).",
        "answer": "5x - 10",
        "options": [
          "5x - 10",
          "5x - 2",
          "x - 10",
          "5x + 10"
        ],
        "distractors": [
          "5x - 2",
          "x - 10",
          "5x + 10"
        ],
        "explain": "Multiply 5 by each term: 5 × x = 5x and 5 × 2 = 10."
      },
      {
        "prompt": "Evaluate 2x^2 when x = 3.",
        "answer": "18",
        "options": [
          "18",
          "12",
          "36",
          "6"
        ],
        "distractors": [
          "12",
          "36",
          "6"
        ],
        "explain": "x^2 = 3 × 3 = 9, then 2 × 9 = 18."
      },
      {
        "prompt": "A movie ticket costs t dollars. Write an expression for the cost of 6 tickets.",
        "answer": "6t",
        "options": [
          "6t",
          "t + 6",
          "t - 6",
          "6 + t"
        ],
        "distractors": [
          "t + 6",
          "t - 6",
          "6 + t"
        ],
        "explain": "6 tickets each costing t means 6 × t = 6t."
      },
      {
        "prompt": "Maria has b books. Her friend has 5 more than twice as many. Which expression shows the friend's books?",
        "answer": "2b + 5",
        "options": [
          "2b + 5",
          "2b - 5",
          "b + 5",
          "5b + 2"
        ],
        "distractors": [
          "2b - 5",
          "b + 5",
          "5b + 2"
        ],
        "explain": "Twice as many is 2b, and 5 more means add 5, so 2b + 5."
      },
      {
        "prompt": "A square garden has sides of length s. Write an expression for its area.",
        "answer": "s^2",
        "options": [
          "s^2",
          "4s",
          "2s",
          "s × 4"
        ],
        "distractors": [
          "4s",
          "2s",
          "s × 4"
        ],
        "explain": "Area of a square is side times side, which is s × s = s^2."
      },
      {
        "prompt": "Simplify: 3(x + 2) + 4x.",
        "answer": "7x + 6",
        "options": [
          "7x + 6",
          "7x + 2",
          "3x + 6",
          "7x + 8"
        ],
        "distractors": [
          "7x + 2",
          "3x + 6",
          "7x + 8"
        ],
        "explain": "Distribute to get 3x + 6, then add 4x: 3x + 4x = 7x, so 7x + 6."
      },
      {
        "prompt": "A bag holds 8 marbles. You buy x more bags. Write an expression for the total marbles, then evaluate when x = 3.",
        "answer": "8x = 24",
        "options": [
          "8x = 24",
          "8 + x = 11",
          "8x = 11",
          "x + 3 = 11"
        ],
        "distractors": [
          "8 + x = 11",
          "8x = 11",
          "x + 3 = 11"
        ],
        "explain": "x bags of 8 is 8x; when x = 3, 8 × 3 = 24."
      },
      {
        "prompt": "A taxi charges $4 to start plus $2 for each mile m. Simplify the total cost for 2 trips: 2(4 + 2m).",
        "answer": "8 + 4m",
        "options": [
          "8 + 4m",
          "8 + 2m",
          "6 + 2m",
          "4 + 4m"
        ],
        "distractors": [
          "8 + 2m",
          "6 + 2m",
          "4 + 4m"
        ],
        "explain": "Distribute the 2: 2 × 4 = 8 and 2 × 2m = 4m, so 8 + 4m."
      }
    ],
    "worksheetA": [
      {
        "q": "Write 4 × 4 × 4 using an exponent.",
        "a": "4^3"
      },
      {
        "q": "Find the value of 6^2.",
        "a": "36"
      },
      {
        "q": "Find the value of 2^4.",
        "a": "16"
      },
      {
        "q": "Find the value of 10^3.",
        "a": "1000"
      },
      {
        "q": "Evaluate 5x when x = 6.",
        "a": "30"
      },
      {
        "q": "Evaluate x + 9 when x = 8.",
        "a": "17"
      },
      {
        "q": "Evaluate 3x + 4 when x = 5.",
        "a": "19"
      },
      {
        "q": "Evaluate 2x^2 when x = 4.",
        "a": "32"
      },
      {
        "q": "Combine like terms: 4x + 6x.",
        "a": "10x"
      },
      {
        "q": "Combine like terms: 9y + 3 + 2y.",
        "a": "11y + 3"
      },
      {
        "q": "Use the distributive property: 3(x + 5).",
        "a": "3x + 15"
      },
      {
        "q": "Simplify: 2(x + 3) + 5x.",
        "a": "7x + 6"
      }
    ],
    "worksheetB": [
      {
        "q": "A pizza costs p dollars. Write an expression for the cost of 4 pizzas.",
        "a": "4p"
      },
      {
        "q": "Sam has n stickers. Write an expression for 7 fewer than his number of stickers.",
        "a": "n - 7"
      },
      {
        "q": "A number k is multiplied by 3, then 5 is added. Write the expression.",
        "a": "3k + 5"
      },
      {
        "q": "A cube has edges of length e. Write an expression for the volume of the cube.",
        "a": "e^3"
      },
      {
        "q": "Tickets cost $9 each. Write an expression for the cost of x tickets, then find the cost of 5 tickets.",
        "a": "9x; 45"
      },
      {
        "q": "A class has 5 rows of d desks plus 3 extra desks. Write an expression for the total desks.",
        "a": "5d + 3"
      },
      {
        "q": "A water tank gains 6 liters each hour h. Write an expression for the liters added, then find the amount after 7 hours.",
        "a": "6h; 42"
      },
      {
        "q": "Each gift bag has 8 candies. Write an expression for g bags, then find the candies in 4 bags.",
        "a": "8g; 32"
      },
      {
        "q": "A store sells x shirts at $12 each and 1 hat for $7. Write an expression for the total cost.",
        "a": "12x + 7"
      },
      {
        "q": "Combine like terms to simplify the perimeter of a shape: 3x + 2 + 3x + 2.",
        "a": "6x + 4"
      },
      {
        "q": "A theater has 3 sections, each with (x + 4) seats. Use the distributive property to write the total seats.",
        "a": "3x + 12"
      },
      {
        "q": "★ A bakery sells boxes that each hold (2c + 3) cookies. Write a simplified expression for the cookies in 5 boxes, then find the total when c = 4.",
        "a": "10c + 15; 55"
      }
    ],
    "preQuiz": [
      {
        "prompt": "Write 2 × 2 × 2 × 2 × 2 using an exponent.",
        "answer": "2^5",
        "options": [
          "2^5",
          "5^2",
          "2^4",
          "2 × 5"
        ],
        "distractors": [
          "5^2",
          "2^4",
          "2 × 5"
        ],
        "explain": "The base 2 is multiplied 5 times, so it is 2^5."
      },
      {
        "prompt": "What is the value of 4^2?",
        "answer": "16",
        "options": [
          "16",
          "8",
          "6",
          "42"
        ],
        "distractors": [
          "8",
          "6",
          "42"
        ],
        "explain": "4 × 4 = 16."
      },
      {
        "prompt": "Evaluate 6x when x = 3.",
        "answer": "18",
        "options": [
          "18",
          "9",
          "63",
          "12"
        ],
        "distractors": [
          "9",
          "63",
          "12"
        ],
        "explain": "6 × 3 = 18."
      },
      {
        "prompt": "Which expression means '5 more than a number n'?",
        "answer": "n + 5",
        "options": [
          "n + 5",
          "5 - n",
          "5n",
          "n - 5"
        ],
        "distractors": [
          "5 - n",
          "5n",
          "n - 5"
        ],
        "explain": "\"More than\" means add, so it is n + 5."
      },
      {
        "prompt": "Combine like terms: 2x + 7x.",
        "answer": "9x",
        "options": [
          "9x",
          "9",
          "14x",
          "9x^2"
        ],
        "distractors": [
          "9",
          "14x",
          "9x^2"
        ],
        "explain": "Add the coefficients: 2 + 7 = 9, so 9x."
      },
      {
        "prompt": "Use the distributive property: 3(x + 2).",
        "answer": "3x + 6",
        "options": [
          "3x + 6",
          "3x + 2",
          "x + 6",
          "3x + 5"
        ],
        "distractors": [
          "3x + 2",
          "x + 6",
          "3x + 5"
        ],
        "explain": "Multiply 3 by each term: 3 × x = 3x and 3 × 2 = 6."
      },
      {
        "prompt": "Evaluate 2x + 1 when x = 4.",
        "answer": "9",
        "options": [
          "9",
          "7",
          "8",
          "24"
        ],
        "distractors": [
          "7",
          "8",
          "24"
        ],
        "explain": "2 × 4 = 8, then 8 + 1 = 9."
      },
      {
        "prompt": "A book costs b dollars. Write an expression for the cost of 5 books.",
        "answer": "5b",
        "options": [
          "5b",
          "b + 5",
          "b - 5",
          "5 + b"
        ],
        "distractors": [
          "b + 5",
          "b - 5",
          "5 + b"
        ],
        "explain": "5 books each costing b means 5 × b = 5b."
      }
    ],
    "postQuiz": [
      {
        "prompt": "Write 3 × 3 × 3 × 3 using an exponent.",
        "answer": "3^4",
        "options": [
          "3^4",
          "4^3",
          "3^3",
          "3 × 4"
        ],
        "distractors": [
          "4^3",
          "3^3",
          "3 × 4"
        ],
        "explain": "The base 3 is multiplied 4 times, so it is 3^4."
      },
      {
        "prompt": "What is the value of 5^2?",
        "answer": "25",
        "options": [
          "25",
          "10",
          "7",
          "52"
        ],
        "distractors": [
          "10",
          "7",
          "52"
        ],
        "explain": "5 × 5 = 25."
      },
      {
        "prompt": "Evaluate 7x when x = 4.",
        "answer": "28",
        "options": [
          "28",
          "11",
          "74",
          "21"
        ],
        "distractors": [
          "11",
          "74",
          "21"
        ],
        "explain": "7 × 4 = 28."
      },
      {
        "prompt": "Which expression means '6 less than a number p'?",
        "answer": "p - 6",
        "options": [
          "p - 6",
          "6 - p",
          "p + 6",
          "6p"
        ],
        "distractors": [
          "6 - p",
          "p + 6",
          "6p"
        ],
        "explain": "\"Less than\" reverses the order, so it is p - 6."
      },
      {
        "prompt": "Combine like terms: 4x + 5x.",
        "answer": "9x",
        "options": [
          "9x",
          "9",
          "20x",
          "9x^2"
        ],
        "distractors": [
          "9",
          "20x",
          "9x^2"
        ],
        "explain": "Add the coefficients: 4 + 5 = 9, so 9x."
      },
      {
        "prompt": "Use the distributive property: 4(x + 3).",
        "answer": "4x + 12",
        "options": [
          "4x + 12",
          "4x + 3",
          "x + 12",
          "4x + 7"
        ],
        "distractors": [
          "4x + 3",
          "x + 12",
          "4x + 7"
        ],
        "explain": "Multiply 4 by each term: 4 × x = 4x and 4 × 3 = 12."
      },
      {
        "prompt": "Evaluate 3x + 2 when x = 5.",
        "answer": "17",
        "options": [
          "17",
          "15",
          "10",
          "35"
        ],
        "distractors": [
          "15",
          "10",
          "35"
        ],
        "explain": "3 × 5 = 15, then 15 + 2 = 17."
      },
      {
        "prompt": "A pen costs c dollars. Write an expression for the cost of 8 pens.",
        "answer": "8c",
        "options": [
          "8c",
          "c + 8",
          "c - 8",
          "8 + c"
        ],
        "distractors": [
          "c + 8",
          "c - 8",
          "8 + c"
        ],
        "explain": "8 pens each costing c means 8 × c = 8c."
      }
    ]
  },
  {
    "slug": "equations-inequalities",
    "title": "One-Step Equations & Inequalities",
    "icon": "➗",
    "accent": "#db2777",
    "standard": "Builds 6.EE.B.5–8",
    "domain": "Expressions & Equations",
    "blurb": "Solve one-step equations and graph simple inequalities — turning word problems into algebra.",
    "skills": [
      "Solve 1-step",
      "Check",
      "Inequalities",
      "Variables"
    ],
    "lessons": 4,
    "objective": "I can solve one-step equations using all four operations, check my solutions, write and graph simple inequalities, and tell apart dependent and independent variables.",
    "estMin": 30,
    "vocab": [
      {
        "term": "equation",
        "def": "A math sentence saying two amounts are equal, with an = sign."
      },
      {
        "term": "variable",
        "def": "A letter that stands for an unknown number."
      },
      {
        "term": "solution",
        "def": "The value of the variable that makes the equation true."
      },
      {
        "term": "inverse operation",
        "def": "An operation that undoes another, like subtract undoes add."
      },
      {
        "term": "inequality",
        "def": "A sentence using <, >, ≤, or ≥ instead of equals."
      },
      {
        "term": "independent variable",
        "def": "The input you choose; it does not depend on others."
      }
    ],
    "materials": [
      "Whiteboard and dry-erase markers",
      "Number line strips (-10 to 10)",
      "Two-color counters or chips",
      "Pencil and worksheets"
    ],
    "workedExamples": [
      {
        "problem": "Solve x + 7 = 12.",
        "steps": [
          "The variable x has 7 added to it.",
          "Use the inverse: subtract 7 from both sides.",
          "x + 7 - 7 = 12 - 7",
          "x = 5"
        ],
        "answer": "x = 5"
      },
      {
        "problem": "Solve 6n = 42, then check your answer.",
        "steps": [
          "The variable n is multiplied by 6.",
          "Use the inverse: divide both sides by 6.",
          "6n ÷ 6 = 42 ÷ 6, so n = 7.",
          "Check: 6 × 7 = 42. True, so n = 7 is correct."
        ],
        "answer": "n = 7"
      },
      {
        "problem": "A water tank loses 4 liters each hour. Write the equation if it lost 28 liters total, solve for hours h, and graph h ≤ 9 on a number line.",
        "steps": [
          "Each hour loses 4 liters, so 4h = 28 models the total.",
          "Divide both sides by 4: h = 28 ÷ 4 = 7 hours.",
          "For h ≤ 9, draw a closed (filled) dot on 9.",
          "Shade the number line to the left, toward smaller numbers."
        ],
        "answer": "h = 7; closed dot at 9 shaded left"
      }
    ],
    "bank": [
      {
        "prompt": "Which sentence is an equation?",
        "answer": "x + 3 = 9",
        "options": [
          "x + 3 = 9",
          "x + 3",
          "2x > 9",
          "add 3 to x"
        ],
        "distractors": [
          "x + 3",
          "2x > 9",
          "add 3 to x"
        ],
        "explain": "An equation has an equals sign showing two amounts are equal."
      },
      {
        "prompt": "In the equation y = 5, what is the variable?",
        "answer": "y",
        "options": [
          "y",
          "5",
          "=",
          "none"
        ],
        "distractors": [
          "5",
          "=",
          "none"
        ],
        "explain": "A variable is the letter standing for an unknown number, here y."
      },
      {
        "prompt": "Solve: x + 4 = 10",
        "answer": "6",
        "options": [
          "6",
          "14",
          "4",
          "40"
        ],
        "distractors": [
          "14",
          "4",
          "40"
        ],
        "explain": "Subtract 4 from both sides: 10 - 4 = 6."
      },
      {
        "prompt": "Solve: m - 5 = 8",
        "answer": "13",
        "options": [
          "13",
          "3",
          "40",
          "13.5"
        ],
        "distractors": [
          "3",
          "40",
          "13.5"
        ],
        "explain": "Add 5 to both sides: 8 + 5 = 13."
      },
      {
        "prompt": "Solve: 3x = 15",
        "answer": "5",
        "options": [
          "5",
          "45",
          "12",
          "18"
        ],
        "distractors": [
          "45",
          "12",
          "18"
        ],
        "explain": "Divide both sides by 3: 15 ÷ 3 = 5."
      },
      {
        "prompt": "Solve: x ÷ 4 = 2",
        "answer": "8",
        "options": [
          "8",
          "2",
          "6",
          "0.5"
        ],
        "distractors": [
          "2",
          "6",
          "0.5"
        ],
        "explain": "Multiply both sides by 4: 2 × 4 = 8."
      },
      {
        "prompt": "Which operation undoes adding 6?",
        "answer": "subtracting 6",
        "options": [
          "subtracting 6",
          "adding 6",
          "multiplying by 6",
          "dividing by 6"
        ],
        "distractors": [
          "adding 6",
          "multiplying by 6",
          "dividing by 6"
        ],
        "explain": "Subtraction is the inverse operation of addition."
      },
      {
        "prompt": "Is x = 4 a solution to x + 2 = 6?",
        "answer": "Yes, because 4 + 2 = 6",
        "options": [
          "Yes, because 4 + 2 = 6",
          "No, because 4 + 2 = 8",
          "Yes, because 6 - 4 = 1",
          "No, because x must be 8"
        ],
        "distractors": [
          "No, because 4 + 2 = 8",
          "Yes, because 6 - 4 = 1",
          "No, because x must be 8"
        ],
        "explain": "Substituting 4 gives 4 + 2 = 6, a true statement."
      },
      {
        "prompt": "Solve: 7 + x = 20",
        "answer": "13",
        "options": [
          "13",
          "27",
          "7",
          "3"
        ],
        "distractors": [
          "27",
          "7",
          "3"
        ],
        "explain": "Subtract 7 from both sides: 20 - 7 = 13."
      },
      {
        "prompt": "Solve: x - 9 = 0",
        "answer": "9",
        "options": [
          "9",
          "0",
          "-9",
          "18"
        ],
        "distractors": [
          "0",
          "-9",
          "18"
        ],
        "explain": "Add 9 to both sides: 0 + 9 = 9."
      },
      {
        "prompt": "Solve: 8x = 56",
        "answer": "7",
        "options": [
          "7",
          "8",
          "48",
          "64"
        ],
        "distractors": [
          "8",
          "48",
          "64"
        ],
        "explain": "Divide both sides by 8: 56 ÷ 8 = 7."
      },
      {
        "prompt": "Which symbol means 'less than or equal to'?",
        "answer": "≤",
        "options": [
          "≤",
          "≥",
          "<",
          ">"
        ],
        "distractors": [
          "≥",
          "<",
          ">"
        ],
        "explain": "The ≤ symbol means a value is less than or equal to another."
      },
      {
        "prompt": "Solve: x ÷ 6 = 5",
        "answer": "30",
        "options": [
          "30",
          "11",
          "1",
          "35"
        ],
        "distractors": [
          "11",
          "1",
          "35"
        ],
        "explain": "Multiply both sides by 6: 5 × 6 = 30."
      },
      {
        "prompt": "On a graph of x > 3, what kind of dot is used at 3?",
        "answer": "An open (empty) dot",
        "options": [
          "An open (empty) dot",
          "A closed (filled) dot",
          "No dot at all",
          "Two dots"
        ],
        "distractors": [
          "A closed (filled) dot",
          "No dot at all",
          "Two dots"
        ],
        "explain": "Open dots show 3 is not included because > does not include equal."
      },
      {
        "prompt": "Which inequality means 'a number is at least 10'?",
        "answer": "x ≥ 10",
        "options": [
          "x ≥ 10",
          "x ≤ 10",
          "x > 10",
          "x < 10"
        ],
        "distractors": [
          "x ≤ 10",
          "x > 10",
          "x < 10"
        ],
        "explain": "'At least 10' means 10 or more, written as x ≥ 10."
      },
      {
        "prompt": "Solve: 12 = x - 4",
        "answer": "16",
        "options": [
          "16",
          "8",
          "48",
          "3"
        ],
        "distractors": [
          "8",
          "48",
          "3"
        ],
        "explain": "Add 4 to both sides: 12 + 4 = 16."
      },
      {
        "prompt": "In y = 2t, which is the independent variable?",
        "answer": "t",
        "options": [
          "t",
          "y",
          "2",
          "none"
        ],
        "distractors": [
          "y",
          "2",
          "none"
        ],
        "explain": "The independent variable t is the input you choose; y depends on it."
      },
      {
        "prompt": "Maria saved $15 and now has $40. The equation 15 + x = 40 finds extra money saved. How much is x?",
        "answer": "$25",
        "options": [
          "$25",
          "$55",
          "$15",
          "$2.67"
        ],
        "distractors": [
          "$55",
          "$15",
          "$2.67"
        ],
        "explain": "Subtract 15 from both sides: 40 - 15 = 25."
      },
      {
        "prompt": "A pizza is cut into equal slices. If 5 friends each get 3 slices, the equation s ÷ 5 = 3 finds total slices s. Find s.",
        "answer": "15",
        "options": [
          "15",
          "8",
          "2",
          "20"
        ],
        "distractors": [
          "8",
          "2",
          "20"
        ],
        "explain": "Multiply both sides by 5: 3 × 5 = 15 slices."
      },
      {
        "prompt": "A movie ticket costs $9. Total cost for n tickets is 9n = 63. How many tickets were bought?",
        "answer": "7",
        "options": [
          "7",
          "54",
          "72",
          "9"
        ],
        "distractors": [
          "54",
          "72",
          "9"
        ],
        "explain": "Divide both sides by 9: 63 ÷ 9 = 7 tickets."
      },
      {
        "prompt": "To ride a roller coaster you must be at least 48 inches tall. Which inequality shows allowed height h?",
        "answer": "h ≥ 48",
        "options": [
          "h ≥ 48",
          "h ≤ 48",
          "h > 48",
          "h < 48"
        ],
        "distractors": [
          "h ≤ 48",
          "h > 48",
          "h < 48"
        ],
        "explain": "'At least 48' includes 48, so h ≥ 48."
      },
      {
        "prompt": "A class has fewer than 30 students. Which inequality shows the number of students s?",
        "answer": "s < 30",
        "options": [
          "s < 30",
          "s > 30",
          "s ≤ 30",
          "s ≥ 30"
        ],
        "distractors": [
          "s > 30",
          "s ≤ 30",
          "s ≥ 30"
        ],
        "explain": "'Fewer than 30' does not include 30, so s < 30."
      },
      {
        "prompt": "Is x = 6 a solution to 4x = 28?",
        "answer": "No, because 4 × 6 = 24, not 28",
        "options": [
          "No, because 4 × 6 = 24, not 28",
          "Yes, because 4 × 6 = 28",
          "No, because x should be 32",
          "Yes, because 28 - 4 = 24"
        ],
        "distractors": [
          "Yes, because 4 × 6 = 28",
          "No, because x should be 32",
          "Yes, because 28 - 4 = 24"
        ],
        "explain": "4 × 6 = 24, which does not equal 28, so 6 is not the solution."
      },
      {
        "prompt": "Devon walks d miles each day. After 6 days he walked 18 miles, shown by 6d = 18. He wants to walk more than 3 miles per day going forward. Which is true now and what should the new goal look like?",
        "answer": "d = 3 now, and the goal is d > 3",
        "options": [
          "d = 3 now, and the goal is d > 3",
          "d = 12 now, and the goal is d > 3",
          "d = 3 now, and the goal is d < 3",
          "d = 24 now, and the goal is d ≥ 3"
        ],
        "distractors": [
          "d = 12 now, and the goal is d > 3",
          "d = 3 now, and the goal is d < 3",
          "d = 24 now, and the goal is d ≥ 3"
        ],
        "explain": "Divide 18 by 6 to get d = 3; 'more than 3' is written d > 3."
      }
    ],
    "worksheetA": [
      {
        "q": "Solve: x + 6 = 14",
        "a": "x = 8"
      },
      {
        "q": "Solve: x - 3 = 10",
        "a": "x = 13"
      },
      {
        "q": "Solve: 5x = 35",
        "a": "x = 7"
      },
      {
        "q": "Solve: x ÷ 3 = 9",
        "a": "x = 27"
      },
      {
        "q": "Solve: x + 12 = 12",
        "a": "x = 0"
      },
      {
        "q": "Solve: m - 7 = 15",
        "a": "m = 22"
      },
      {
        "q": "Solve: 9n = 72",
        "a": "n = 8"
      },
      {
        "q": "Solve: x ÷ 5 = 6",
        "a": "x = 30"
      },
      {
        "q": "Solve and check: 4x = 24",
        "a": "x = 6 (check: 4 × 6 = 24)"
      },
      {
        "q": "Solve: 18 + x = 25",
        "a": "x = 7"
      },
      {
        "q": "Graph the inequality x ≥ 2 on a number line.",
        "a": "Closed dot at 2, shaded to the right"
      },
      {
        "q": "Write an inequality for 'x is less than 5'.",
        "a": "x < 5"
      }
    ],
    "worksheetB": [
      {
        "q": "Sam had some marbles and got 8 more, giving him 20. Write and solve an equation for his starting marbles m.",
        "a": "m + 8 = 20; m = 12"
      },
      {
        "q": "A book costs $13. After buying it, Lena has $7 left from her money x, shown by x - 13 = 7. How much did she start with?",
        "a": "x = 20 dollars"
      },
      {
        "q": "Four equal teams have 32 players total. Write and solve p × 4 = 32 to find players per team p.",
        "a": "4p = 32; p = 8"
      },
      {
        "q": "A bag of apples is split equally among 6 people, each getting 4 apples. Write and solve a ÷ 6 = 4 for total apples a.",
        "a": "a = 24 apples"
      },
      {
        "q": "Tickets cost $7 each. The total bill was $49. Write and solve 7t = 49 for the number of tickets t.",
        "a": "t = 7 tickets"
      },
      {
        "q": "A plant was 9 cm tall and grew to 21 cm. Write and solve 9 + g = 21 for the growth g.",
        "a": "g = 12 cm"
      },
      {
        "q": "To enter the contest you must be older than 12. Write an inequality for the allowed age a.",
        "a": "a > 12"
      },
      {
        "q": "A bus can hold at most 40 riders. Write an inequality for the number of riders r.",
        "a": "r ≤ 40"
      },
      {
        "q": "Jada earns $8 per hour. Her pay p depends on hours h worked, so p = 8h. Which variable is independent?",
        "a": "h (hours) is independent; p depends on it"
      },
      {
        "q": "A pool drains 5 gallons per minute and lost 45 gallons. Write and solve 5m = 45 for minutes m.",
        "a": "m = 9 minutes"
      },
      {
        "q": "A recipe needs at least 3 cups of flour. Write an inequality for cups c and tell what dot to use when graphing.",
        "a": "c ≥ 3; closed (filled) dot at 3"
      },
      {
        "q": "★ A gym charges a $10 sign-up fee. After paying it, Mr. Lee has $35 left from the money he brought, m. He also wants to keep more than $20 in his wallet next time. Write and solve an equation for m, then write an inequality for his future leftover goal.",
        "a": "m - 10 = 35, so m = 45; future goal: leftover > 20"
      }
    ],
    "preQuiz": [
      {
        "prompt": "Solve: x + 5 = 11",
        "answer": "6",
        "options": [
          "6",
          "16",
          "5",
          "55"
        ],
        "distractors": [
          "16",
          "5",
          "55"
        ],
        "explain": "Subtract 5 from both sides: 11 - 5 = 6."
      },
      {
        "prompt": "Solve: x - 4 = 9",
        "answer": "13",
        "options": [
          "13",
          "5",
          "36",
          "13.5"
        ],
        "distractors": [
          "5",
          "36",
          "13.5"
        ],
        "explain": "Add 4 to both sides: 9 + 4 = 13."
      },
      {
        "prompt": "Solve: 6x = 30",
        "answer": "5",
        "options": [
          "5",
          "36",
          "24",
          "180"
        ],
        "distractors": [
          "36",
          "24",
          "180"
        ],
        "explain": "Divide both sides by 6: 30 ÷ 6 = 5."
      },
      {
        "prompt": "Solve: x ÷ 2 = 7",
        "answer": "14",
        "options": [
          "14",
          "5",
          "9",
          "3.5"
        ],
        "distractors": [
          "5",
          "9",
          "3.5"
        ],
        "explain": "Multiply both sides by 2: 7 × 2 = 14."
      },
      {
        "prompt": "Is x = 3 a solution to x + 6 = 9?",
        "answer": "Yes, because 3 + 6 = 9",
        "options": [
          "Yes, because 3 + 6 = 9",
          "No, because 3 + 6 = 18",
          "Yes, because 9 - 3 = 5",
          "No, because x must be 6"
        ],
        "distractors": [
          "No, because 3 + 6 = 18",
          "Yes, because 9 - 3 = 5",
          "No, because x must be 6"
        ],
        "explain": "Substituting 3 gives 3 + 6 = 9, which is true."
      },
      {
        "prompt": "Which inequality means 'x is at least 5'?",
        "answer": "x ≥ 5",
        "options": [
          "x ≥ 5",
          "x ≤ 5",
          "x > 5",
          "x < 5"
        ],
        "distractors": [
          "x ≤ 5",
          "x > 5",
          "x < 5"
        ],
        "explain": "'At least 5' includes 5, so x ≥ 5."
      },
      {
        "prompt": "A box holds 8 crayons. The equation 8b = 56 finds the number of boxes b for 56 crayons. Find b.",
        "answer": "7",
        "options": [
          "7",
          "48",
          "64",
          "8"
        ],
        "distractors": [
          "48",
          "64",
          "8"
        ],
        "explain": "Divide both sides by 8: 56 ÷ 8 = 7 boxes."
      },
      {
        "prompt": "In y = 3x, which is the independent variable?",
        "answer": "x",
        "options": [
          "x",
          "y",
          "3",
          "none"
        ],
        "distractors": [
          "y",
          "3",
          "none"
        ],
        "explain": "The independent variable x is the input; y depends on it."
      }
    ],
    "postQuiz": [
      {
        "prompt": "Solve: x + 8 = 15",
        "answer": "7",
        "options": [
          "7",
          "23",
          "8",
          "58"
        ],
        "distractors": [
          "23",
          "8",
          "58"
        ],
        "explain": "Subtract 8 from both sides: 15 - 8 = 7."
      },
      {
        "prompt": "Solve: x - 6 = 10",
        "answer": "16",
        "options": [
          "16",
          "4",
          "60",
          "16.5"
        ],
        "distractors": [
          "4",
          "60",
          "16.5"
        ],
        "explain": "Add 6 to both sides: 10 + 6 = 16."
      },
      {
        "prompt": "Solve: 7x = 49",
        "answer": "7",
        "options": [
          "7",
          "56",
          "42",
          "343"
        ],
        "distractors": [
          "56",
          "42",
          "343"
        ],
        "explain": "Divide both sides by 7: 49 ÷ 7 = 7."
      },
      {
        "prompt": "Solve: x ÷ 3 = 8",
        "answer": "24",
        "options": [
          "24",
          "5",
          "11",
          "2.67"
        ],
        "distractors": [
          "5",
          "11",
          "2.67"
        ],
        "explain": "Multiply both sides by 3: 8 × 3 = 24."
      },
      {
        "prompt": "Is x = 4 a solution to x + 7 = 11?",
        "answer": "Yes, because 4 + 7 = 11",
        "options": [
          "Yes, because 4 + 7 = 11",
          "No, because 4 + 7 = 28",
          "Yes, because 11 - 4 = 6",
          "No, because x must be 7"
        ],
        "distractors": [
          "No, because 4 + 7 = 28",
          "Yes, because 11 - 4 = 6",
          "No, because x must be 7"
        ],
        "explain": "Substituting 4 gives 4 + 7 = 11, which is true."
      },
      {
        "prompt": "Which inequality means 'x is at most 9'?",
        "answer": "x ≤ 9",
        "options": [
          "x ≤ 9",
          "x ≥ 9",
          "x < 9",
          "x > 9"
        ],
        "distractors": [
          "x ≥ 9",
          "x < 9",
          "x > 9"
        ],
        "explain": "'At most 9' includes 9, so x ≤ 9."
      },
      {
        "prompt": "A pack holds 9 stickers. The equation 9p = 63 finds the number of packs p for 63 stickers. Find p.",
        "answer": "7",
        "options": [
          "7",
          "54",
          "72",
          "9"
        ],
        "distractors": [
          "54",
          "72",
          "9"
        ],
        "explain": "Divide both sides by 9: 63 ÷ 9 = 7 packs."
      },
      {
        "prompt": "In d = 4t, which is the dependent variable?",
        "answer": "d",
        "options": [
          "d",
          "t",
          "4",
          "none"
        ],
        "distractors": [
          "t",
          "4",
          "none"
        ],
        "explain": "The dependent variable d depends on the input t."
      }
    ]
  },
  {
    "slug": "geometry-measure",
    "title": "Area, Surface Area & Volume",
    "icon": "📐",
    "accent": "#ca8a04",
    "standard": "Builds 6.G.A.1–4",
    "domain": "Geometry & Data",
    "blurb": "Find area, surface area, and volume of real shapes — triangles, prisms, and composite figures.",
    "skills": [
      "Area",
      "Composite area",
      "Volume",
      "Surface area"
    ],
    "lessons": 4,
    "objective": "I can find the area of triangles, parallelograms, trapezoids, and composite figures, and the surface area and volume of rectangular prisms.",
    "estMin": 30,
    "vocab": [
      {
        "term": "Area",
        "def": "The amount of flat space a shape covers."
      },
      {
        "term": "Base and height",
        "def": "A chosen side and the straight-up distance to the opposite point."
      },
      {
        "term": "Parallelogram",
        "def": "A four-sided shape with two pairs of parallel sides."
      },
      {
        "term": "Trapezoid",
        "def": "A four-sided shape with exactly one pair of parallel sides."
      },
      {
        "term": "Volume",
        "def": "The amount of space inside a solid, in cubic units."
      },
      {
        "term": "Surface area",
        "def": "The total area of all the faces of a solid."
      }
    ],
    "materials": [
      "1-inch grid paper",
      "Centimeter cubes (or sugar cubes)",
      "Scissors and tape for building nets",
      "Rulers"
    ],
    "workedExamples": [
      {
        "problem": "Find the area of a triangle with base 8 cm and height 5 cm.",
        "steps": [
          "Write the triangle area formula: A = ½ × base × height.",
          "Put in the numbers: A = ½ × 8 × 5.",
          "Multiply the base and height: 8 × 5 = 40.",
          "Take half: ½ × 40 = 20."
        ],
        "answer": "20 cm²"
      },
      {
        "problem": "Find the area of a trapezoid with parallel sides 6 m and 10 m and a height of 4 m.",
        "steps": [
          "Write the trapezoid formula: A = (base₁ + base₂) ÷ 2 × height.",
          "Add the two parallel sides: 6 + 10 = 16.",
          "Divide by 2 to get the average width: 16 ÷ 2 = 8.",
          "Multiply by the height: 8 × 4 = 32."
        ],
        "answer": "32 m²"
      },
      {
        "problem": "A gift box is 5 in by 4 in by 3 in. Find its surface area, then its volume.",
        "steps": [
          "For surface area, find the area of the three different faces: 5×4 = 20, 5×3 = 15, and 4×3 = 12.",
          "Add those three faces: 20 + 15 + 12 = 47.",
          "Double it because each face has a matching opposite face: 2 × 47 = 94 in².",
          "For volume, multiply all three edges: 5 × 4 × 3 = 60 in³."
        ],
        "answer": "Surface area = 94 in², Volume = 60 in³"
      }
    ],
    "bank": [
      {
        "prompt": "What is the area of a parallelogram with base 6 cm and height 4 cm?",
        "answer": "24 cm²",
        "options": [
          "24 cm²",
          "10 cm²",
          "20 cm²",
          "48 cm²"
        ],
        "distractors": [
          "10 cm²",
          "20 cm²",
          "48 cm²"
        ],
        "explain": "Area of a parallelogram is base times height: 6 × 4 = 24."
      },
      {
        "prompt": "What is the area of a rectangle that is 7 in long and 5 in wide?",
        "answer": "35 in²",
        "options": [
          "35 in²",
          "24 in²",
          "12 in²",
          "70 in²"
        ],
        "distractors": [
          "24 in²",
          "12 in²",
          "70 in²"
        ],
        "explain": "Area of a rectangle is length times width: 7 × 5 = 35."
      },
      {
        "prompt": "A triangle has a base of 8 cm and a height of 5 cm. What is its area?",
        "answer": "20 cm²",
        "options": [
          "20 cm²",
          "40 cm²",
          "13 cm²",
          "26 cm²"
        ],
        "distractors": [
          "40 cm²",
          "13 cm²",
          "26 cm²"
        ],
        "explain": "Triangle area is half the base times height: ½ × 8 × 5 = 20."
      },
      {
        "prompt": "What is the area of a parallelogram with base 9 m and height 5 m?",
        "answer": "45 m²",
        "options": [
          "45 m²",
          "28 m²",
          "14 m²",
          "90 m²"
        ],
        "distractors": [
          "28 m²",
          "14 m²",
          "90 m²"
        ],
        "explain": "Area equals base times height: 9 × 5 = 45."
      },
      {
        "prompt": "A triangle has base 10 ft and height 6 ft. What is its area?",
        "answer": "30 ft²",
        "options": [
          "30 ft²",
          "60 ft²",
          "16 ft²",
          "32 ft²"
        ],
        "distractors": [
          "60 ft²",
          "16 ft²",
          "32 ft²"
        ],
        "explain": "Triangle area is ½ × base × height: ½ × 10 × 6 = 30."
      },
      {
        "prompt": "What is the area of a trapezoid with parallel sides 4 cm and 6 cm and height 3 cm?",
        "answer": "15 cm²",
        "options": [
          "15 cm²",
          "30 cm²",
          "13 cm²",
          "72 cm²"
        ],
        "distractors": [
          "30 cm²",
          "13 cm²",
          "72 cm²"
        ],
        "explain": "Add the two parallel sides, divide by 2, then multiply by height: (4+6)/2 × 3 = 15."
      },
      {
        "prompt": "What is the area of a triangle with base 7 m and height 4 m?",
        "answer": "14 m²",
        "options": [
          "14 m²",
          "28 m²",
          "11 m²",
          "22 m²"
        ],
        "distractors": [
          "28 m²",
          "11 m²",
          "22 m²"
        ],
        "explain": "Triangle area is ½ × 7 × 4 = 14."
      },
      {
        "prompt": "What is the volume of a box that is 4 cm by 3 cm by 2 cm?",
        "answer": "24 cm³",
        "options": [
          "24 cm³",
          "9 cm³",
          "26 cm³",
          "52 cm³"
        ],
        "distractors": [
          "9 cm³",
          "26 cm³",
          "52 cm³"
        ],
        "explain": "Volume is length × width × height: 4 × 3 × 2 = 24."
      },
      {
        "prompt": "A trapezoid has parallel sides 6 in and 10 in and a height of 4 in. What is its area?",
        "answer": "32 in²",
        "options": [
          "32 in²",
          "64 in²",
          "40 in²",
          "20 in²"
        ],
        "distractors": [
          "64 in²",
          "40 in²",
          "20 in²"
        ],
        "explain": "(6+10)/2 × 4 = 8 × 4 = 32."
      },
      {
        "prompt": "What is the surface area of a cube with edge length 5 cm?",
        "answer": "150 cm²",
        "options": [
          "150 cm²",
          "125 cm²",
          "25 cm²",
          "30 cm²"
        ],
        "distractors": [
          "125 cm²",
          "25 cm²",
          "30 cm²"
        ],
        "explain": "A cube has 6 equal square faces: 6 × (5×5) = 150."
      },
      {
        "prompt": "What is the volume of a rectangular prism that is 5 m by 4 m by 3 m?",
        "answer": "60 m³",
        "options": [
          "60 m³",
          "12 m³",
          "94 m³",
          "20 m³"
        ],
        "distractors": [
          "12 m³",
          "94 m³",
          "20 m³"
        ],
        "explain": "Volume is 5 × 4 × 3 = 60."
      },
      {
        "prompt": "A triangle has base 9 cm and height 6 cm. What is its area?",
        "answer": "27 cm²",
        "options": [
          "27 cm²",
          "54 cm²",
          "15 cm²",
          "30 cm²"
        ],
        "distractors": [
          "54 cm²",
          "15 cm²",
          "30 cm²"
        ],
        "explain": "Triangle area is ½ × 9 × 6 = 27."
      },
      {
        "prompt": "What is the volume of a box that is 2½ ft by 4 ft by 3 ft?",
        "answer": "30 ft³",
        "options": [
          "30 ft³",
          "9½ ft³",
          "24 ft³",
          "15 ft³"
        ],
        "distractors": [
          "9½ ft³",
          "24 ft³",
          "15 ft³"
        ],
        "explain": "Volume is 2½ × 4 × 3 = 30."
      },
      {
        "prompt": "A composite figure is a 8 cm by 5 cm rectangle with a triangle on top (base 8 cm, height 3 cm). What is the total area?",
        "answer": "52 cm²",
        "options": [
          "52 cm²",
          "40 cm²",
          "64 cm²",
          "46 cm²"
        ],
        "distractors": [
          "40 cm²",
          "64 cm²",
          "46 cm²"
        ],
        "explain": "Rectangle 8×5 = 40, triangle ½×8×3 = 12, total 40+12 = 52."
      },
      {
        "prompt": "What is the surface area of a rectangular prism that is 5 in by 4 in by 3 in?",
        "answer": "94 in²",
        "options": [
          "94 in²",
          "60 in²",
          "47 in²",
          "120 in²"
        ],
        "distractors": [
          "60 in²",
          "47 in²",
          "120 in²"
        ],
        "explain": "Surface area is 2(lw+lh+wh) = 2(20+15+12) = 94."
      },
      {
        "prompt": "What is the area of a trapezoid with parallel sides 8 m and 12 m and height 5 m?",
        "answer": "50 m²",
        "options": [
          "50 m²",
          "100 m²",
          "60 m²",
          "25 m²"
        ],
        "distractors": [
          "100 m²",
          "60 m²",
          "25 m²"
        ],
        "explain": "(8+12)/2 × 5 = 10 × 5 = 50."
      },
      {
        "prompt": "A flower bed is shaped like a triangle with base 12 ft and height 5 ft. How much area does it cover?",
        "answer": "30 ft²",
        "options": [
          "30 ft²",
          "60 ft²",
          "17 ft²",
          "34 ft²"
        ],
        "distractors": [
          "60 ft²",
          "17 ft²",
          "34 ft²"
        ],
        "explain": "Triangle area is ½ × 12 × 5 = 30."
      },
      {
        "prompt": "A fish tank is 5 dm long, 3 dm wide, and 2.5 dm tall. What is its volume?",
        "answer": "37.5 dm³",
        "options": [
          "37.5 dm³",
          "10.5 dm³",
          "30 dm³",
          "75 dm³"
        ],
        "distractors": [
          "10.5 dm³",
          "30 dm³",
          "75 dm³"
        ],
        "explain": "Volume is 5 × 3 × 2.5 = 37.5."
      },
      {
        "prompt": "A small box is ¾ ft by ½ ft by 2 ft. What is its volume?",
        "answer": "¾ ft³",
        "options": [
          "¾ ft³",
          "3¼ ft³",
          "1½ ft³",
          "1 ft³"
        ],
        "distractors": [
          "3¼ ft³",
          "1½ ft³",
          "1 ft³"
        ],
        "explain": "Volume is ¾ × ½ × 2 = ¾."
      },
      {
        "prompt": "How many unit cubes with ⅓-ft edges fill a box that is 2 ft by 1 ft by ⅔ ft?",
        "answer": "36 cubes",
        "options": [
          "36 cubes",
          "12 cubes",
          "4 cubes",
          "27 cubes"
        ],
        "distractors": [
          "12 cubes",
          "4 cubes",
          "27 cubes"
        ],
        "explain": "Box volume is 2×1×⅔ = 4/3 ft³; each cube is 1/27 ft³, so (4/3)÷(1/27) = 36."
      },
      {
        "prompt": "You wrap a gift box that is 6 in by 2 in by 3 in. How much wrapping paper (surface area) do you need at minimum?",
        "answer": "72 in²",
        "options": [
          "72 in²",
          "36 in²",
          "52 in²",
          "144 in²"
        ],
        "distractors": [
          "36 in²",
          "52 in²",
          "144 in²"
        ],
        "explain": "Surface area is 2(6×2 + 6×3 + 2×3) = 2(12+18+6) = 72."
      },
      {
        "prompt": "A garden is a rectangle 10 m by 6 m with a triangular section removed (base 6 m, height 4 m). What area is left?",
        "answer": "48 m²",
        "options": [
          "48 m²",
          "60 m²",
          "36 m²",
          "12 m²"
        ],
        "distractors": [
          "60 m²",
          "36 m²",
          "12 m²"
        ],
        "explain": "Rectangle 10×6 = 60, triangle ½×6×4 = 12, remaining 60−12 = 48."
      },
      {
        "prompt": "A net shows a rectangular prism 10 cm by 4 cm by 5 cm. What is the total surface area?",
        "answer": "220 cm²",
        "options": [
          "220 cm²",
          "200 cm²",
          "110 cm²",
          "240 cm²"
        ],
        "distractors": [
          "200 cm²",
          "110 cm²",
          "240 cm²"
        ],
        "explain": "Surface area is 2(10×4 + 10×5 + 4×5) = 2(40+50+20) = 220."
      },
      {
        "prompt": "A trough is a rectangular prism 1½ ft by 2 ft by 2½ ft. What is its volume?",
        "answer": "7½ ft³",
        "options": [
          "7½ ft³",
          "6 ft³",
          "5 ft³",
          "9 ft³"
        ],
        "distractors": [
          "6 ft³",
          "5 ft³",
          "9 ft³"
        ],
        "explain": "Volume is 1½ × 2 × 2½ = 7½."
      }
    ],
    "worksheetA": [
      {
        "q": "Find the area of a parallelogram with base 6 cm and height 4 cm.",
        "a": "24 cm²"
      },
      {
        "q": "Find the area of a parallelogram with base 12 cm and height 7 cm.",
        "a": "84 cm²"
      },
      {
        "q": "Find the area of a triangle with base 10 cm and height 6 cm.",
        "a": "30 cm²"
      },
      {
        "q": "Find the area of a triangle with base 7 cm and height 4 cm.",
        "a": "14 cm²"
      },
      {
        "q": "Find the area of a triangle with base 9 cm and height 6 cm.",
        "a": "27 cm²"
      },
      {
        "q": "Find the area of a trapezoid with parallel sides 4 cm and 6 cm and height 3 cm.",
        "a": "15 cm²"
      },
      {
        "q": "Find the area of a trapezoid with parallel sides 5 cm and 9 cm and height 6 cm.",
        "a": "42 cm²"
      },
      {
        "q": "Find the volume of a box that is 4 cm by 3 cm by 2 cm.",
        "a": "24 cm³"
      },
      {
        "q": "Find the volume of a box that is 2½ cm by 4 cm by 3 cm.",
        "a": "30 cm³"
      },
      {
        "q": "Find the volume of a box that is ¾ cm by ½ cm by 2 cm.",
        "a": "¾ cm³"
      },
      {
        "q": "Find the surface area of a cube with edge length 5 cm.",
        "a": "150 cm²"
      },
      {
        "q": "Find the surface area of a rectangular prism that is 5 cm by 4 cm by 3 cm.",
        "a": "94 cm²"
      }
    ],
    "worksheetB": [
      {
        "q": "A classroom poster is a parallelogram with base 9 in and height 5 in. What is its area?",
        "a": "45 in²"
      },
      {
        "q": "A triangular sail has a base of 12 ft and a height of 5 ft. How much fabric covers the sail?",
        "a": "30 ft²"
      },
      {
        "q": "A garden shaped like a trapezoid has parallel sides 8 m and 12 m and a height of 5 m. What is its area?",
        "a": "50 m²"
      },
      {
        "q": "A sign is a rectangle 8 cm by 5 cm with a triangle on top (base 8 cm, height 3 cm). What is the total area?",
        "a": "52 cm²"
      },
      {
        "q": "A rectangular field is 10 m by 6 m. A triangular pond (base 6 m, height 4 m) is dug out. How much grass area is left?",
        "a": "48 m²"
      },
      {
        "q": "A fish tank is 5 dm long, 3 dm wide, and 2.5 dm tall. What is its volume?",
        "a": "37.5 dm³"
      },
      {
        "q": "A jewelry box is ¾ ft by ½ ft by 2 ft. What is its volume?",
        "a": "¾ ft³"
      },
      {
        "q": "A storage bin is 2½ ft by 4 ft by 3 ft. What is its volume?",
        "a": "30 ft³"
      },
      {
        "q": "You wrap a gift box that is 6 in by 2 in by 3 in. How much wrapping paper do you need at minimum?",
        "a": "72 in²"
      },
      {
        "q": "A net shows a prism 10 cm by 4 cm by 5 cm. What is the total surface area?",
        "a": "220 cm²"
      },
      {
        "q": "A water trough is a prism 1½ ft by 2 ft by 2½ ft. What is its volume?",
        "a": "7½ ft³"
      },
      {
        "q": "★ A box measures 2 ft by 1 ft by ⅔ ft. How many small cubes with ⅓-ft edges are needed to fill it completely?",
        "a": "36 cubes"
      }
    ],
    "preQuiz": [
      {
        "prompt": "What is the area of a parallelogram with base 5 cm and height 4 cm?",
        "answer": "20 cm²",
        "options": [
          "20 cm²",
          "9 cm²",
          "18 cm²",
          "40 cm²"
        ],
        "distractors": [
          "9 cm²",
          "18 cm²",
          "40 cm²"
        ],
        "explain": "Area is base × height: 5 × 4 = 20."
      },
      {
        "prompt": "A triangle has base 8 m and height 6 m. What is its area?",
        "answer": "24 m²",
        "options": [
          "24 m²",
          "48 m²",
          "14 m²",
          "28 m²"
        ],
        "distractors": [
          "48 m²",
          "14 m²",
          "28 m²"
        ],
        "explain": "Triangle area is ½ × 8 × 6 = 24."
      },
      {
        "prompt": "What is the area of a trapezoid with parallel sides 4 cm and 8 cm and height 5 cm?",
        "answer": "30 cm²",
        "options": [
          "30 cm²",
          "60 cm²",
          "20 cm²",
          "40 cm²"
        ],
        "distractors": [
          "60 cm²",
          "20 cm²",
          "40 cm²"
        ],
        "explain": "(4+8)/2 × 5 = 6 × 5 = 30."
      },
      {
        "prompt": "What is the volume of a box that is 6 cm by 2 cm by 4 cm?",
        "answer": "48 cm³",
        "options": [
          "48 cm³",
          "12 cm³",
          "88 cm³",
          "24 cm³"
        ],
        "distractors": [
          "12 cm³",
          "88 cm³",
          "24 cm³"
        ],
        "explain": "Volume is 6 × 2 × 4 = 48."
      },
      {
        "prompt": "What is the surface area of a cube with edge length 3 in?",
        "answer": "54 in²",
        "options": [
          "54 in²",
          "27 in²",
          "9 in²",
          "18 in²"
        ],
        "distractors": [
          "27 in²",
          "9 in²",
          "18 in²"
        ],
        "explain": "A cube has 6 equal faces: 6 × (3×3) = 54."
      },
      {
        "prompt": "A box is ½ ft by 4 ft by 3 ft. What is its volume?",
        "answer": "6 ft³",
        "options": [
          "6 ft³",
          "7½ ft³",
          "12 ft³",
          "2 ft³"
        ],
        "distractors": [
          "7½ ft³",
          "12 ft³",
          "2 ft³"
        ],
        "explain": "Volume is ½ × 4 × 3 = 6."
      },
      {
        "prompt": "A composite figure is a 5 cm by 4 cm rectangle with a triangle on top (base 5 cm, height 2 cm). What is the total area?",
        "answer": "25 cm²",
        "options": [
          "25 cm²",
          "20 cm²",
          "30 cm²",
          "23 cm²"
        ],
        "distractors": [
          "20 cm²",
          "30 cm²",
          "23 cm²"
        ],
        "explain": "Rectangle 5×4 = 20, triangle ½×5×2 = 5, total 20+5 = 25."
      },
      {
        "prompt": "You wrap a box that is 7 in by 3 in by 2 in. How much paper (surface area) do you need?",
        "answer": "82 in²",
        "options": [
          "82 in²",
          "42 in²",
          "41 in²",
          "164 in²"
        ],
        "distractors": [
          "42 in²",
          "41 in²",
          "164 in²"
        ],
        "explain": "Surface area is 2(7×3 + 7×2 + 3×2) = 2(21+14+6) = 82."
      }
    ],
    "postQuiz": [
      {
        "prompt": "What is the area of a parallelogram with base 7 cm and height 5 cm?",
        "answer": "35 cm²",
        "options": [
          "35 cm²",
          "12 cm²",
          "24 cm²",
          "70 cm²"
        ],
        "distractors": [
          "12 cm²",
          "24 cm²",
          "70 cm²"
        ],
        "explain": "Area is base × height: 7 × 5 = 35."
      },
      {
        "prompt": "A triangle has base 6 m and height 8 m. What is its area?",
        "answer": "24 m²",
        "options": [
          "24 m²",
          "48 m²",
          "14 m²",
          "28 m²"
        ],
        "distractors": [
          "48 m²",
          "14 m²",
          "28 m²"
        ],
        "explain": "Triangle area is ½ × 6 × 8 = 24."
      },
      {
        "prompt": "What is the area of a trapezoid with parallel sides 5 cm and 7 cm and height 4 cm?",
        "answer": "24 cm²",
        "options": [
          "24 cm²",
          "48 cm²",
          "16 cm²",
          "35 cm²"
        ],
        "distractors": [
          "48 cm²",
          "16 cm²",
          "35 cm²"
        ],
        "explain": "(5+7)/2 × 4 = 6 × 4 = 24."
      },
      {
        "prompt": "What is the volume of a box that is 5 cm by 3 cm by 4 cm?",
        "answer": "60 cm³",
        "options": [
          "60 cm³",
          "12 cm³",
          "94 cm³",
          "23 cm³"
        ],
        "distractors": [
          "12 cm³",
          "94 cm³",
          "23 cm³"
        ],
        "explain": "Volume is 5 × 3 × 4 = 60."
      },
      {
        "prompt": "What is the surface area of a cube with edge length 4 in?",
        "answer": "96 in²",
        "options": [
          "96 in²",
          "64 in²",
          "16 in²",
          "24 in²"
        ],
        "distractors": [
          "64 in²",
          "16 in²",
          "24 in²"
        ],
        "explain": "A cube has 6 equal faces: 6 × (4×4) = 96."
      },
      {
        "prompt": "A box is ½ ft by 3 ft by 2 ft. What is its volume?",
        "answer": "3 ft³",
        "options": [
          "3 ft³",
          "5½ ft³",
          "6 ft³",
          "1½ ft³"
        ],
        "distractors": [
          "5½ ft³",
          "6 ft³",
          "1½ ft³"
        ],
        "explain": "Volume is ½ × 3 × 2 = 3."
      },
      {
        "prompt": "A composite figure is a 6 cm by 4 cm rectangle with a triangle on top (base 6 cm, height 4 cm). What is the total area?",
        "answer": "36 cm²",
        "options": [
          "36 cm²",
          "24 cm²",
          "48 cm²",
          "30 cm²"
        ],
        "distractors": [
          "24 cm²",
          "48 cm²",
          "30 cm²"
        ],
        "explain": "Rectangle 6×4 = 24, triangle ½×6×4 = 12, total 24+12 = 36."
      },
      {
        "prompt": "You wrap a box that is 8 in by 3 in by 2 in. How much paper (surface area) do you need?",
        "answer": "92 in²",
        "options": [
          "92 in²",
          "48 in²",
          "46 in²",
          "184 in²"
        ],
        "distractors": [
          "48 in²",
          "46 in²",
          "184 in²"
        ],
        "explain": "Surface area is 2(8×3 + 8×2 + 3×2) = 2(24+16+6) = 92."
      }
    ]
  },
  {
    "slug": "statistics-data",
    "title": "Statistics & Data",
    "icon": "📈",
    "accent": "#65a30d",
    "standard": "Builds 6.SP.A–B",
    "domain": "Geometry & Data",
    "blurb": "Ask statistical questions and summarize data with center, spread, and graphs — making sense of numbers.",
    "skills": [
      "Mean / median",
      "Range & MAD",
      "Dot plots",
      "Histograms"
    ],
    "lessons": 4,
    "objective": "I can write statistical questions and find and compare the mean, median, mode, range, and mean absolute deviation of a data set, and read dot plots, histograms, and box plots.",
    "estMin": 30,
    "vocab": [
      {
        "term": "Statistical question",
        "def": "A question with answers that vary, not just one answer."
      },
      {
        "term": "Mean",
        "def": "The average; add all values, then divide by how many."
      },
      {
        "term": "Median",
        "def": "The middle value when data is put in order."
      },
      {
        "term": "Mode",
        "def": "The value that shows up most often."
      },
      {
        "term": "Range",
        "def": "The largest value minus the smallest value."
      },
      {
        "term": "Mean absolute deviation",
        "def": "The average distance each value is from the mean."
      }
    ],
    "materials": [
      "Blank dot plot and number-line grids",
      "Counters or sticky dots",
      "Index cards with data sets",
      "Calculator (for checking)"
    ],
    "workedExamples": [
      {
        "problem": "Find the mean of 4, 8, 6, 2, and 5.",
        "steps": [
          "Add all the values: 4 + 8 + 6 + 2 + 5 = 25.",
          "Count how many values there are: 5.",
          "Divide the sum by the count: 25 / 5 = 5."
        ],
        "answer": "Mean = 5"
      },
      {
        "problem": "Find the median of 7, 3, 9, 5, 3, and 11.",
        "steps": [
          "Put the numbers in order: 3, 3, 5, 7, 9, 11.",
          "There are 6 numbers (even), so find the two middle ones: 5 and 7.",
          "Average the two middle numbers: (5 + 7) / 2 = 6."
        ],
        "answer": "Median = 6"
      },
      {
        "problem": "Find the mean absolute deviation (MAD) of 5, 8, 8, 11, and 13.",
        "steps": [
          "Find the mean: (5 + 8 + 8 + 11 + 13) / 5 = 45 / 5 = 9.",
          "Find each value's distance from 9: 4, 1, 1, 2, 4.",
          "Add the distances: 4 + 1 + 1 + 2 + 4 = 12.",
          "Divide by the number of values: 12 / 5 = 2.4."
        ],
        "answer": "MAD = 2.4"
      }
    ],
    "bank": [
      {
        "prompt": "Which question is a statistical question (it has answers that vary)?",
        "answer": "How tall are the students in my class?",
        "options": [
          "How tall are the students in my class?",
          "How tall am I?",
          "What is my shoe size?",
          "How old is the teacher?"
        ],
        "distractors": [
          "How tall am I?",
          "What is my shoe size?",
          "How old is the teacher?"
        ],
        "explain": "A statistical question expects many different answers, like the varying heights of students."
      },
      {
        "prompt": "What is the mode of this data set: 2, 3, 3, 5, 7?",
        "answer": "3",
        "options": [
          "3",
          "5",
          "7",
          "2"
        ],
        "distractors": [
          "5",
          "7",
          "2"
        ],
        "explain": "The mode is the value that appears most often, and 3 appears twice."
      },
      {
        "prompt": "What is the range of this data set: 3, 8, 5, 15, 7?",
        "answer": "12",
        "options": [
          "12",
          "15",
          "8",
          "10"
        ],
        "distractors": [
          "15",
          "8",
          "10"
        ],
        "explain": "Range is the largest value minus the smallest: 15 - 3 = 12."
      },
      {
        "prompt": "What is the mean (average) of 10, 20, and 30?",
        "answer": "20",
        "options": [
          "20",
          "30",
          "60",
          "15"
        ],
        "distractors": [
          "30",
          "60",
          "15"
        ],
        "explain": "Add them (60) and divide by 3 to get 20."
      },
      {
        "prompt": "What is the median of the data set 2, 4, 6, 8?",
        "answer": "5",
        "options": [
          "5",
          "4",
          "6",
          "8"
        ],
        "distractors": [
          "4",
          "6",
          "8"
        ],
        "explain": "With four numbers, average the two middle ones: (4 + 6) / 2 = 5."
      },
      {
        "prompt": "On a dot plot, what does a stack of 4 dots above the number 6 mean?",
        "answer": "The value 6 appears 4 times",
        "options": [
          "The value 6 appears 4 times",
          "The value 6 appears 1 time",
          "The total is 24",
          "The value 4 appears 6 times"
        ],
        "distractors": [
          "The value 6 appears 1 time",
          "The total is 24",
          "The value 4 appears 6 times"
        ],
        "explain": "Each dot stands for one data point, so 4 dots above 6 means 6 occurred 4 times."
      },
      {
        "prompt": "What is the mean of 6, 6, 6, and 6?",
        "answer": "6",
        "options": [
          "6",
          "24",
          "0",
          "12"
        ],
        "distractors": [
          "24",
          "0",
          "12"
        ],
        "explain": "When all values are the same, the mean equals that value: 6."
      },
      {
        "prompt": "What is the median of 7, 2, 9, 4, 5 (put in order first)?",
        "answer": "5",
        "options": [
          "5",
          "9",
          "4",
          "7"
        ],
        "distractors": [
          "9",
          "4",
          "7"
        ],
        "explain": "Ordered: 2, 4, 5, 7, 9. The middle value is 5."
      },
      {
        "prompt": "A histogram bar covers ages 10-14 and has a height of 8. What does this show?",
        "answer": "8 people are ages 10 to 14",
        "options": [
          "8 people are ages 10 to 14",
          "8 people are exactly age 10",
          "The mean age is 8",
          "There are 8 age groups"
        ],
        "distractors": [
          "8 people are exactly age 10",
          "The mean age is 8",
          "There are 8 age groups"
        ],
        "explain": "A histogram bar's height is the frequency, so 8 people fall in the 10-14 group."
      },
      {
        "prompt": "What is the mean of 12, 15, 9, 12, and 17?",
        "answer": "13",
        "options": [
          "13",
          "12",
          "15",
          "14"
        ],
        "distractors": [
          "12",
          "15",
          "14"
        ],
        "explain": "Sum is 65; 65 / 5 = 13."
      },
      {
        "prompt": "What is the range of test scores 85, 90, 95, 80, 100?",
        "answer": "20",
        "options": [
          "20",
          "15",
          "100",
          "90"
        ],
        "distractors": [
          "15",
          "100",
          "90"
        ],
        "explain": "Range = highest - lowest = 100 - 80 = 20."
      },
      {
        "prompt": "In a box plot, what does the line inside the box represent?",
        "answer": "The median",
        "options": [
          "The median",
          "The mean",
          "The range",
          "The mode"
        ],
        "distractors": [
          "The mean",
          "The range",
          "The mode"
        ],
        "explain": "The line inside a box plot marks the median, the middle of the data."
      },
      {
        "prompt": "What is the median of 14, 8, 22, 5, 17?",
        "answer": "14",
        "options": [
          "14",
          "8",
          "17",
          "13"
        ],
        "distractors": [
          "8",
          "17",
          "13"
        ],
        "explain": "Ordered: 5, 8, 14, 17, 22. The middle value is 14."
      },
      {
        "prompt": "A box plot has minimum 4 and maximum 24. What is the range?",
        "answer": "20",
        "options": [
          "20",
          "24",
          "28",
          "12"
        ],
        "distractors": [
          "24",
          "28",
          "12"
        ],
        "explain": "Range = max - min = 24 - 4 = 20."
      },
      {
        "prompt": "What is the mean absolute deviation (MAD) of 2, 4, 6, 8?",
        "answer": "2",
        "options": [
          "2",
          "5",
          "6",
          "4"
        ],
        "distractors": [
          "5",
          "6",
          "4"
        ],
        "explain": "Mean is 5; distances are 3,1,1,3; average distance = 8/4 = 2."
      },
      {
        "prompt": "Five friends scored 7, 9, 9, 11, 14 points. What is the mean number of points?",
        "answer": "10",
        "options": [
          "10",
          "9",
          "11",
          "50"
        ],
        "distractors": [
          "9",
          "11",
          "50"
        ],
        "explain": "Sum is 50; 50 / 5 = 10 points."
      },
      {
        "prompt": "A store sold these many shirts over 6 days: 3, 7, 7, 9, 12, 14. What is the median?",
        "answer": "8",
        "options": [
          "8",
          "7",
          "9",
          "7.5"
        ],
        "distractors": [
          "7",
          "9",
          "7.5"
        ],
        "explain": "The two middle values are 7 and 9; (7 + 9) / 2 = 8."
      },
      {
        "prompt": "Maria's quiz scores are 88, 92, 76, and 84. What is her mean score?",
        "answer": "85",
        "options": [
          "85",
          "84",
          "88",
          "80"
        ],
        "distractors": [
          "84",
          "88",
          "80"
        ],
        "explain": "Sum is 340; 340 / 4 = 85."
      },
      {
        "prompt": "Which measure is most affected by one very large outlier value?",
        "answer": "Mean",
        "options": [
          "Mean",
          "Median",
          "Mode",
          "Range of the middle half"
        ],
        "distractors": [
          "Median",
          "Mode",
          "Range of the middle half"
        ],
        "explain": "The mean uses every value, so one extreme number pulls it up or down a lot."
      },
      {
        "prompt": "Daily temperatures were 60, 64, 64, 68, 74 degrees. What is the mode?",
        "answer": "64",
        "options": [
          "64",
          "68",
          "66",
          "74"
        ],
        "distractors": [
          "68",
          "66",
          "74"
        ],
        "explain": "64 appears twice, more than any other value, so it is the mode."
      },
      {
        "prompt": "A basketball player scored a mean of 20 points over 4 games. What was her total points?",
        "answer": "80",
        "options": [
          "80",
          "24",
          "20",
          "5"
        ],
        "distractors": [
          "24",
          "20",
          "5"
        ],
        "explain": "Total = mean x number of games = 20 x 4 = 80 points."
      },
      {
        "prompt": "Three test scores are 75, 85, and 90. What score is needed on a 4th test to average 80?",
        "answer": "70",
        "options": [
          "70",
          "80",
          "75",
          "85"
        ],
        "distractors": [
          "80",
          "75",
          "85"
        ],
        "explain": "Needed total is 80 x 4 = 320; 320 - (75+85+90) = 70."
      },
      {
        "prompt": "Data set: 5, 8, 8, 11, 13. The mean is 9. What is the mean absolute deviation (MAD)?",
        "answer": "2.4",
        "options": [
          "2.4",
          "8",
          "9",
          "2"
        ],
        "distractors": [
          "8",
          "9",
          "2"
        ],
        "explain": "Distances from 9 are 4,1,1,2,4 (sum 12); 12 / 5 = 2.4."
      },
      {
        "prompt": "Two classes have the same mean test score, but Class A has MAD 2 and Class B has MAD 9. What does this tell you?",
        "answer": "Class A's scores are more clustered together",
        "options": [
          "Class A's scores are more clustered together",
          "Class B's scores are more clustered together",
          "Class A has a higher average",
          "Class B has fewer students"
        ],
        "distractors": [
          "Class B's scores are more clustered together",
          "Class A has a higher average",
          "Class B has fewer students"
        ],
        "explain": "A smaller MAD means the data is closer to the mean, so Class A is more clustered."
      }
    ],
    "worksheetA": [
      {
        "q": "Find the mean of 4, 6, and 8.",
        "a": "6"
      },
      {
        "q": "Find the mean of 10, 14, 12, 16, and 13.",
        "a": "13"
      },
      {
        "q": "Find the median of 3, 9, 5, 7, and 1.",
        "a": "5"
      },
      {
        "q": "Find the median of 6, 2, 8, 4 (order first).",
        "a": "5"
      },
      {
        "q": "Find the mode of 4, 7, 7, 9, 11.",
        "a": "7"
      },
      {
        "q": "Find the mode of 2, 2, 5, 8, 8, 8, 10.",
        "a": "8"
      },
      {
        "q": "Find the range of 12, 5, 20, 8, 15.",
        "a": "15"
      },
      {
        "q": "Find the range of 30, 45, 22, 50.",
        "a": "28"
      },
      {
        "q": "Find the mean of 21, 19, 23, 17.",
        "a": "20"
      },
      {
        "q": "Find the median of 11, 4, 9, 6, 15, 8 (order first).",
        "a": "8.5"
      },
      {
        "q": "The mean of 3, 5, 7, 9, 11 is 7. Find the MAD.",
        "a": "2.4"
      },
      {
        "q": "Find the MAD of 2, 4, 6, 8 (mean is 5).",
        "a": "2"
      }
    ],
    "worksheetB": [
      {
        "q": "A class took a survey. Which is a statistical question: 'What is my age?' or 'What are the ages of students in this school?' Explain by naming the better one.",
        "a": "What are the ages of students in this school?"
      },
      {
        "q": "Liam's five quiz scores are 8, 6, 10, 9, and 7. What is his mean score?",
        "a": "8"
      },
      {
        "q": "A bakery sold 12, 15, 9, 12, and 17 muffins over five days. What is the median number sold?",
        "a": "12"
      },
      {
        "q": "Daily high temperatures were 70, 72, 72, 75, and 81 degrees. What is the mode?",
        "a": "72"
      },
      {
        "q": "The fastest runner finished in 52 seconds and the slowest in 78 seconds. What is the range of times?",
        "a": "26 seconds"
      },
      {
        "q": "A dot plot shows pets owned: 0 (3 dots), 1 (5 dots), 2 (2 dots). How many students were surveyed?",
        "a": "10 students"
      },
      {
        "q": "A histogram shows hours of sleep: 6-7 hrs (4 people), 7-8 hrs (9 people), 8-9 hrs (5 people). How many people slept at least 7 hours?",
        "a": "14 people"
      },
      {
        "q": "A box plot of game scores has minimum 8 and maximum 32. What is the range?",
        "a": "24"
      },
      {
        "q": "Ben scored 18, 22, 20, and 20 points in four games. What was his mean points per game?",
        "a": "20"
      },
      {
        "q": "Five plants grew 5, 7, 7, 9, and 12 cm. The mean is 8 cm. What is the mean absolute deviation?",
        "a": "2"
      },
      {
        "q": "A team's mean score over 5 games was 14. What was the team's total score?",
        "a": "70"
      },
      {
        "q": "★ Three of Ava's test scores are 78, 85, and 92. What must she score on the fourth test to have a mean of 85?",
        "a": "85"
      }
    ],
    "preQuiz": [
      {
        "prompt": "Which is a statistical question?",
        "answer": "How many books did each student read this month?",
        "options": [
          "How many books did each student read this month?",
          "How many books did I read this month?",
          "What is my favorite book?",
          "How many pages are in this book?"
        ],
        "distractors": [
          "How many books did I read this month?",
          "What is my favorite book?",
          "How many pages are in this book?"
        ],
        "explain": "It expects different answers from different students, so it is statistical."
      },
      {
        "prompt": "What is the mode of 4, 5, 5, 7, 9?",
        "answer": "5",
        "options": [
          "5",
          "7",
          "9",
          "4"
        ],
        "distractors": [
          "7",
          "9",
          "4"
        ],
        "explain": "5 appears most often, so it is the mode."
      },
      {
        "prompt": "What is the range of 6, 14, 9, 20, 11?",
        "answer": "14",
        "options": [
          "14",
          "20",
          "11",
          "9"
        ],
        "distractors": [
          "20",
          "11",
          "9"
        ],
        "explain": "Range = 20 - 6 = 14."
      },
      {
        "prompt": "What is the mean of 8, 12, and 10?",
        "answer": "10",
        "options": [
          "10",
          "12",
          "30",
          "9"
        ],
        "distractors": [
          "12",
          "30",
          "9"
        ],
        "explain": "Sum is 30; 30 / 3 = 10."
      },
      {
        "prompt": "What is the median of 3, 7, 5, 9, 1 (order first)?",
        "answer": "5",
        "options": [
          "5",
          "7",
          "9",
          "3"
        ],
        "distractors": [
          "7",
          "9",
          "3"
        ],
        "explain": "Ordered: 1, 3, 5, 7, 9. The middle value is 5."
      },
      {
        "prompt": "On a dot plot, 6 dots are stacked above the number 4. What does this mean?",
        "answer": "The value 4 appears 6 times",
        "options": [
          "The value 4 appears 6 times",
          "The value 6 appears 4 times",
          "The total is 24",
          "The mean is 4"
        ],
        "distractors": [
          "The value 6 appears 4 times",
          "The total is 24",
          "The mean is 4"
        ],
        "explain": "Each dot is one data point, so 6 dots above 4 means 4 occurred 6 times."
      },
      {
        "prompt": "What is the mean absolute deviation of 3, 5, 7, 9 (mean is 6)?",
        "answer": "2",
        "options": [
          "2",
          "6",
          "4",
          "3"
        ],
        "distractors": [
          "6",
          "4",
          "3"
        ],
        "explain": "Distances are 3,1,1,3 (sum 8); 8 / 4 = 2."
      },
      {
        "prompt": "A player scored a mean of 15 points over 4 games. What was the total?",
        "answer": "60",
        "options": [
          "60",
          "19",
          "15",
          "4"
        ],
        "distractors": [
          "19",
          "15",
          "4"
        ],
        "explain": "Total = 15 x 4 = 60 points."
      }
    ],
    "postQuiz": [
      {
        "prompt": "Which is a statistical question?",
        "answer": "How many minutes does each student spend on homework?",
        "options": [
          "How many minutes does each student spend on homework?",
          "How many minutes did I spend on homework?",
          "What is my homework grade?",
          "What time is it now?"
        ],
        "distractors": [
          "How many minutes did I spend on homework?",
          "What is my homework grade?",
          "What time is it now?"
        ],
        "explain": "It expects varying answers from different students, so it is statistical."
      },
      {
        "prompt": "What is the mode of 2, 6, 6, 8, 10?",
        "answer": "6",
        "options": [
          "6",
          "8",
          "10",
          "2"
        ],
        "distractors": [
          "8",
          "10",
          "2"
        ],
        "explain": "6 appears most often, so it is the mode."
      },
      {
        "prompt": "What is the range of 5, 13, 8, 19, 10?",
        "answer": "14",
        "options": [
          "14",
          "19",
          "10",
          "8"
        ],
        "distractors": [
          "19",
          "10",
          "8"
        ],
        "explain": "Range = 19 - 5 = 14."
      },
      {
        "prompt": "What is the mean of 7, 11, and 9?",
        "answer": "9",
        "options": [
          "9",
          "11",
          "27",
          "8"
        ],
        "distractors": [
          "11",
          "27",
          "8"
        ],
        "explain": "Sum is 27; 27 / 3 = 9."
      },
      {
        "prompt": "What is the median of 2, 8, 4, 10, 6 (order first)?",
        "answer": "6",
        "options": [
          "6",
          "8",
          "10",
          "4"
        ],
        "distractors": [
          "8",
          "10",
          "4"
        ],
        "explain": "Ordered: 2, 4, 6, 8, 10. The middle value is 6."
      },
      {
        "prompt": "On a dot plot, 5 dots are stacked above the number 3. What does this mean?",
        "answer": "The value 3 appears 5 times",
        "options": [
          "The value 3 appears 5 times",
          "The value 5 appears 3 times",
          "The total is 15",
          "The mean is 3"
        ],
        "distractors": [
          "The value 5 appears 3 times",
          "The total is 15",
          "The mean is 3"
        ],
        "explain": "Each dot is one data point, so 5 dots above 3 means 3 occurred 5 times."
      },
      {
        "prompt": "What is the mean absolute deviation of 4, 6, 8, 10 (mean is 7)?",
        "answer": "2",
        "options": [
          "2",
          "7",
          "4",
          "3"
        ],
        "distractors": [
          "7",
          "4",
          "3"
        ],
        "explain": "Distances are 3,1,1,3 (sum 8); 8 / 4 = 2."
      },
      {
        "prompt": "A player scored a mean of 12 points over 5 games. What was the total?",
        "answer": "60",
        "options": [
          "60",
          "17",
          "12",
          "5"
        ],
        "distractors": [
          "17",
          "12",
          "5"
        ],
        "explain": "Total = 12 x 5 = 60 points."
      }
    ]
  }
];
