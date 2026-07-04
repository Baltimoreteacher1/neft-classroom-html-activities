/* ==========================================================================
   Neft Teacher — Intervention Pre/Post Quiz Form generator (Google Apps Script)

   WHAT IT DOES
   Creates, for every intervention topic, FOUR Google Forms:
     • Pre-Quiz (Student)   — clean auto-graded quiz students take BEFORE
     • Pre-Quiz (Teacher)   — same items + visible answer key (master)
     • Post-Quiz (Student)  — auto-graded quiz students take AFTER
     • Post-Quiz (Teacher)  — same items + visible answer key (master)
   Plus, for any topic that defines them in data.mjs, differentiated variants:
     • Level 1 (Student)    — support: fewer / foundational items
     • Level 2 (Student)    — enrichment: multi-step extension items
   All are quizzes (auto-graded, 1 pt/question) and collect the student name.
   Each item shows targeted feedback: the correct-answer explanation on a right
   answer, and the per-distractor "why this is wrong" notes on a wrong answer
   (built from the optional misconceptions map in data.mjs).

   HOW TO RUN
   1. Go to https://script.google.com  →  New project.
   2. Paste this whole file in (replace Code.gs contents).
   3. (Optional) edit FOLDER_NAME below.
   4. Run  ->  createAllInterventionForms  ->  authorize when prompted.
   5. Open  View > Logs (or Executions).  Copy the printed forms-links.js block
      into  math/intervention/assets/forms-links.js , commit, and push.

   This file is GENERATED from scripts/intervention/data.mjs — do not hand-edit;
   re-run  node scripts/intervention/build-forms.mjs  instead.
   ========================================================================== */

var FOLDER_NAME = "Neft Teacher — Math Intervention Quizzes";

var QUIZ_DATA = {
  "number-operations": {
    "title": "Whole-Number Operations & Fluency",
    "pre": [
      {
        "q": "What is 38 × 7?",
        "answer": "266",
        "options": [
          "266",
          "256",
          "276",
          "45"
        ],
        "explain": "7 × 30 = 210 and 7 × 8 = 56, so 210 + 56 = 266."
      },
      {
        "q": "What is 56 × 89?",
        "answer": "4,984",
        "options": [
          "4,984",
          "4,884",
          "4,994",
          "145"
        ],
        "explain": "56 × 89 = 56 × 80 + 56 × 9 = 4,480 + 504 = 4,984."
      },
      {
        "q": "What is 365 ÷ 12 written with a remainder?",
        "answer": "30 R5",
        "options": [
          "30 R5",
          "30 R4",
          "31 R5",
          "30"
        ],
        "explain": "12 × 30 = 360, and 365 − 360 = 5."
      },
      {
        "q": "What is 584 ÷ 9 written with a remainder?",
        "answer": "64 R8",
        "options": [
          "64 R8",
          "64 R7",
          "65 R8",
          "64"
        ],
        "explain": "9 × 64 = 576, and 584 − 576 = 8."
      },
      {
        "q": "Estimate 39 × 21 by rounding each number to the nearest ten.",
        "answer": "800",
        "options": [
          "800",
          "600",
          "819",
          "1,000"
        ],
        "explain": "39 rounds to 40 and 21 rounds to 20, and 40 × 20 = 800."
      },
      {
        "q": "Evaluate 7 + 2 × 5 − 3.",
        "answer": "14",
        "options": [
          "14",
          "42",
          "12",
          "20"
        ],
        "explain": "Multiply first: 2 × 5 = 10, then 7 + 10 − 3 = 14."
      },
      {
        "q": "Evaluate 36 ÷ 4 + 5 × 2.",
        "answer": "19",
        "options": [
          "19",
          "28",
          "13",
          "17"
        ],
        "explain": "Divide and multiply first: 9 + 10 = 19."
      },
      {
        "q": "A store splits 2,476 marbles equally into 8 jars. How many per jar, and how many are left over?",
        "answer": "309 per jar, 4 left",
        "options": [
          "309 per jar, 4 left",
          "309 per jar, 2 left",
          "308 per jar, 4 left",
          "310 per jar, 4 left"
        ],
        "explain": "8 × 309 = 2,472, and 2,476 − 2,472 = 4 left over."
      }
    ],
    "post": [
      {
        "q": "What is 47 × 6?",
        "answer": "282",
        "options": [
          "282",
          "272",
          "288",
          "53"
        ],
        "explain": "6 × 40 = 240 and 6 × 7 = 42, so 240 + 42 = 282."
      },
      {
        "q": "What is 72 × 48?",
        "answer": "3,456",
        "options": [
          "3,456",
          "3,356",
          "3,476",
          "120"
        ],
        "explain": "72 × 48 = 72 × 40 + 72 × 8 = 2,880 + 576 = 3,456."
      },
      {
        "q": "What is 738 ÷ 6?",
        "answer": "123",
        "options": [
          "123",
          "122",
          "133",
          "123 R1"
        ],
        "explain": "6 × 123 = 738 exactly, so there is no remainder."
      },
      {
        "q": "What is 925 ÷ 4 written with a remainder?",
        "answer": "231 R1",
        "options": [
          "231 R1",
          "230 R1",
          "231 R2",
          "231"
        ],
        "explain": "4 × 231 = 924, and 925 − 924 = 1."
      },
      {
        "q": "Estimate 58 × 31 by rounding each number to the nearest ten.",
        "answer": "1,800",
        "options": [
          "1,800",
          "1,500",
          "1,798",
          "2,100"
        ],
        "explain": "58 rounds to 60 and 31 rounds to 30, and 60 × 30 = 1,800."
      },
      {
        "q": "Evaluate 6 + 4 × 5.",
        "answer": "26",
        "options": [
          "26",
          "50",
          "30",
          "20"
        ],
        "explain": "Multiply first: 4 × 5 = 20, then add 6 to get 26."
      },
      {
        "q": "Evaluate (15 − 7) × 3.",
        "answer": "24",
        "options": [
          "24",
          "18",
          "11",
          "36"
        ],
        "explain": "Subtract inside parentheses first: 15 − 7 = 8, then 8 × 3 = 24."
      },
      {
        "q": "A farmer packs 1,500 eggs into cartons of 12. How many full cartons can she fill?",
        "answer": "125",
        "options": [
          "125",
          "124",
          "126",
          "1,488"
        ],
        "explain": "1,500 ÷ 12 = 125 cartons with no eggs left over."
      }
    ]
  },
  "factors-multiples": {
    "title": "Factors, Multiples & Primes",
    "pre": [
      {
        "q": "Which list shows all the factors of 10?",
        "answer": "1, 2, 5, 10",
        "options": [
          "1, 2, 5, 10",
          "1, 2, 10",
          "2, 5",
          "1, 5, 10"
        ],
        "explain": "10 divides evenly by 1, 2, 5, and 10."
      },
      {
        "q": "Which number is a multiple of 6?",
        "answer": "24",
        "options": [
          "24",
          "26",
          "15",
          "34"
        ],
        "explain": "24 = 6 × 4, so it is a multiple of 6."
      },
      {
        "q": "Is the number 11 prime or composite?",
        "answer": "Prime",
        "options": [
          "Prime",
          "Composite",
          "Neither",
          "Both"
        ],
        "explain": "11 has only the factors 1 and 11, so it is prime."
      },
      {
        "q": "What is the GCF of 12 and 18?",
        "answer": "6",
        "options": [
          "6",
          "3",
          "2",
          "36"
        ],
        "explain": "6 is the greatest number that divides both 12 and 18."
      },
      {
        "q": "What is the LCM of 3 and 4?",
        "answer": "12",
        "options": [
          "12",
          "24",
          "7",
          "1"
        ],
        "explain": "12 is the smallest number both 3 and 4 divide into evenly."
      },
      {
        "q": "What is the prime factorization of 12?",
        "answer": "2 × 2 × 3",
        "options": [
          "2 × 2 × 3",
          "2 × 6",
          "3 × 4",
          "2 × 2 × 2"
        ],
        "explain": "12 = 2 × 2 × 3, all prime factors."
      },
      {
        "q": "Using the distributive property, 12 + 18 can be written as which expression?",
        "answer": "6 × (2 + 3)",
        "options": [
          "6 × (2 + 3)",
          "6 × (2 + 6)",
          "3 × (4 + 6)",
          "6 × (12 + 18)"
        ],
        "explain": "The GCF is 6; 12 = 6×2 and 18 = 6×3, so 6 × (2 + 3)."
      },
      {
        "q": "Tennis balls come in cans of 4 and players come in groups of 6. What is the least number you need to have an equal number with none left over?",
        "answer": "12",
        "options": [
          "12",
          "24",
          "10",
          "2"
        ],
        "explain": "The LCM of 4 and 6 is 12."
      }
    ],
    "post": [
      {
        "q": "Which list shows all the factors of 16?",
        "answer": "1, 2, 4, 8, 16",
        "options": [
          "1, 2, 4, 8, 16",
          "1, 2, 4, 16",
          "2, 4, 8",
          "1, 4, 8, 16"
        ],
        "explain": "16 divides evenly by 1, 2, 4, 8, and 16."
      },
      {
        "q": "Which number is a multiple of 7?",
        "answer": "28",
        "options": [
          "28",
          "27",
          "32",
          "17"
        ],
        "explain": "28 = 7 × 4, so it is a multiple of 7."
      },
      {
        "q": "Is the number 13 prime or composite?",
        "answer": "Prime",
        "options": [
          "Prime",
          "Composite",
          "Neither",
          "Both"
        ],
        "explain": "13 has only the factors 1 and 13, so it is prime."
      },
      {
        "q": "What is the GCF of 20 and 30?",
        "answer": "10",
        "options": [
          "10",
          "5",
          "2",
          "60"
        ],
        "explain": "10 is the greatest number that divides both 20 and 30."
      },
      {
        "q": "What is the LCM of 4 and 5?",
        "answer": "20",
        "options": [
          "20",
          "40",
          "9",
          "1"
        ],
        "explain": "20 is the smallest number both 4 and 5 divide into evenly."
      },
      {
        "q": "What is the prime factorization of 40?",
        "answer": "2 × 2 × 2 × 5",
        "options": [
          "2 × 2 × 2 × 5",
          "2 × 2 × 5",
          "4 × 10",
          "2 × 4 × 5"
        ],
        "explain": "40 = 2 × 2 × 2 × 5, all prime factors."
      },
      {
        "q": "Using the distributive property, 15 + 20 can be written as which expression?",
        "answer": "5 × (3 + 4)",
        "options": [
          "5 × (3 + 4)",
          "5 × (3 + 5)",
          "3 × (5 + 7)",
          "5 × (15 + 20)"
        ],
        "explain": "The GCF is 5; 15 = 5×3 and 20 = 5×4, so 5 × (3 + 4)."
      },
      {
        "q": "Pencils come in boxes of 9 and erasers in boxes of 12. What is the least number of each you must buy to have an equal amount with none left over?",
        "answer": "36",
        "options": [
          "36",
          "72",
          "21",
          "108"
        ],
        "explain": "The LCM of 9 and 12 is 36."
      }
    ]
  },
  "fraction-sense": {
    "title": "Fraction Sense",
    "pre": [
      {
        "q": "Which fraction is equivalent to 1/3?",
        "answer": "2/6",
        "options": [
          "2/6",
          "1/6",
          "2/3",
          "3/6"
        ],
        "explain": "Multiply 1/3 top and bottom by 2 to get 2/6."
      },
      {
        "q": "Write 6/9 in simplest form.",
        "answer": "2/3",
        "options": [
          "2/3",
          "3/9",
          "6/9",
          "1/3"
        ],
        "explain": "Divide top and bottom by 3 to get 2/3."
      },
      {
        "q": "Compare: 2/5 ___ 4/5",
        "answer": "<",
        "options": [
          "<",
          ">",
          "=",
          "+"
        ],
        "explain": "With the same denominator, 2 fifths is less than 4 fifths."
      },
      {
        "q": "What is 1/8 + 3/8?",
        "answer": "1/2",
        "options": [
          "1/2",
          "4/16",
          "3/8",
          "4/8 only"
        ],
        "explain": "1/8 + 3/8 = 4/8, which simplifies to 1/2."
      },
      {
        "q": "What is 2/3 - 1/6?",
        "answer": "1/2",
        "options": [
          "1/2",
          "1/3",
          "3/6 wrong reduce",
          "1/6"
        ],
        "explain": "Rename 2/3 as 4/6, then 4/6 - 1/6 = 3/6 = 1/2."
      },
      {
        "q": "What is 3/5 x 2/3?",
        "answer": "2/5",
        "options": [
          "2/5",
          "5/8",
          "6/8",
          "2/3"
        ],
        "explain": "3/5 x 2/3 = 6/15, which simplifies to 2/5."
      },
      {
        "q": "What is 1/2 ÷ 1/6?",
        "answer": "3",
        "options": [
          "3",
          "1/12",
          "1/3",
          "6"
        ],
        "explain": "Multiply by the reciprocal: 1/2 x 6/1 = 6/2 = 3."
      },
      {
        "q": "A recipe needs 3/4 cup of milk. You make half. How much milk do you need?",
        "answer": "3/8 cup",
        "options": [
          "3/8 cup",
          "3/2 cup",
          "1/4 cup",
          "6/4 cup"
        ],
        "explain": "Half of 3/4 is 1/2 x 3/4 = 3/8 cup."
      }
    ],
    "post": [
      {
        "q": "Which fraction is equivalent to 1/4?",
        "answer": "2/8",
        "options": [
          "2/8",
          "1/8",
          "2/4",
          "3/8"
        ],
        "explain": "Multiply 1/4 top and bottom by 2 to get 2/8."
      },
      {
        "q": "Write 8/12 in simplest form.",
        "answer": "2/3",
        "options": [
          "2/3",
          "4/12",
          "8/12",
          "1/3"
        ],
        "explain": "Divide top and bottom by 4 to get 2/3."
      },
      {
        "q": "Compare: 5/8 ___ 3/8",
        "answer": ">",
        "options": [
          ">",
          "<",
          "=",
          "-"
        ],
        "explain": "With the same denominator, 5 eighths is more than 3 eighths."
      },
      {
        "q": "What is 2/9 + 4/9?",
        "answer": "2/3",
        "options": [
          "2/3",
          "6/18",
          "6/9 only",
          "2/9"
        ],
        "explain": "2/9 + 4/9 = 6/9, which simplifies to 2/3."
      },
      {
        "q": "What is 3/4 - 1/8?",
        "answer": "5/8",
        "options": [
          "5/8",
          "2/4",
          "2/8",
          "1/8"
        ],
        "explain": "Rename 3/4 as 6/8, then 6/8 - 1/8 = 5/8."
      },
      {
        "q": "What is 2/5 x 5/6?",
        "answer": "1/3",
        "options": [
          "1/3",
          "7/11",
          "4/6",
          "2/6"
        ],
        "explain": "2/5 x 5/6 = 10/30, which simplifies to 1/3."
      },
      {
        "q": "What is 1/3 ÷ 1/9?",
        "answer": "3",
        "options": [
          "3",
          "1/27",
          "1/3",
          "9"
        ],
        "explain": "Multiply by the reciprocal: 1/3 x 9/1 = 9/3 = 3."
      },
      {
        "q": "A board is 5/6 foot long. You use 1/2 of it. How much do you use?",
        "answer": "5/12 foot",
        "options": [
          "5/12 foot",
          "5/3 foot",
          "1/3 foot",
          "10/6 foot"
        ],
        "explain": "Half of 5/6 is 1/2 x 5/6 = 5/12 foot."
      }
    ]
  },
  "decimals-place-value": {
    "title": "Decimals & Place Value",
    "pre": [
      {
        "q": "What is the value of the 3 in 8.37?",
        "answer": "3 tenths",
        "options": [
          "3 tenths",
          "3 hundredths",
          "3 ones",
          "3 thousandths"
        ],
        "explain": "The first place after the decimal point is tenths."
      },
      {
        "q": "Compare: which is greater, 0.4 or 0.38?",
        "answer": "0.4",
        "options": [
          "0.4",
          "0.38",
          "They are equal",
          "0.038"
        ],
        "explain": "0.40 is greater than 0.38 because 4 tenths beats 3 tenths."
      },
      {
        "q": "Round 7.6 to the nearest whole number.",
        "answer": "8",
        "options": [
          "8",
          "7",
          "7.5",
          "6"
        ],
        "explain": "The tenths digit 6 is 5 or more, so round up to 8."
      },
      {
        "q": "What is 5.3 + 2.75 ?",
        "answer": "8.05",
        "options": [
          "8.05",
          "7.05",
          "8.5",
          "7.78"
        ],
        "explain": "Line up decimals: 5.30 + 2.75 = 8.05."
      },
      {
        "q": "What is 10 - 4.6 ?",
        "answer": "5.4",
        "options": [
          "5.4",
          "6.4",
          "5.6",
          "4.4"
        ],
        "explain": "Write 10 as 10.0, then subtract 4.6 to get 5.4."
      },
      {
        "q": "What is 3.2 x 0.5 ?",
        "answer": "1.6",
        "options": [
          "1.6",
          "16",
          "0.16",
          "1.5"
        ],
        "explain": "32 x 5 = 160, with 2 decimal places gives 1.6."
      },
      {
        "q": "What is 12.6 / 0.6 ?",
        "answer": "21",
        "options": [
          "21",
          "2.1",
          "210",
          "0.21"
        ],
        "explain": "Multiply both by 10: 126 / 6 = 21."
      },
      {
        "q": "A pen costs $1.25. How much do 4 pens cost?",
        "answer": "$5.00",
        "options": [
          "$5.00",
          "$4.00",
          "$5.25",
          "$4.25"
        ],
        "explain": "4 x $1.25 = $5.00."
      }
    ],
    "post": [
      {
        "q": "What is the value of the 9 in 6.94?",
        "answer": "9 tenths",
        "options": [
          "9 tenths",
          "9 hundredths",
          "9 ones",
          "9 thousandths"
        ],
        "explain": "The first place after the decimal point is tenths."
      },
      {
        "q": "Compare: which is greater, 0.7 or 0.65?",
        "answer": "0.7",
        "options": [
          "0.7",
          "0.65",
          "They are equal",
          "0.065"
        ],
        "explain": "0.70 is greater than 0.65 because 7 tenths beats 6 tenths."
      },
      {
        "q": "Round 4.5 to the nearest whole number.",
        "answer": "5",
        "options": [
          "5",
          "4",
          "4.5",
          "6"
        ],
        "explain": "The tenths digit 5 means round up to 5."
      },
      {
        "q": "What is 6.4 + 3.85 ?",
        "answer": "10.25",
        "options": [
          "10.25",
          "9.25",
          "10.5",
          "9.89"
        ],
        "explain": "Line up decimals: 6.40 + 3.85 = 10.25."
      },
      {
        "q": "What is 15 - 7.3 ?",
        "answer": "7.7",
        "options": [
          "7.7",
          "8.7",
          "7.3",
          "8.3"
        ],
        "explain": "Write 15 as 15.0, then subtract 7.3 to get 7.7."
      },
      {
        "q": "What is 4.6 x 0.5 ?",
        "answer": "2.3",
        "options": [
          "2.3",
          "23",
          "0.23",
          "2.5"
        ],
        "explain": "46 x 5 = 230, with 2 decimal places gives 2.3."
      },
      {
        "q": "What is 18.8 / 0.4 ?",
        "answer": "47",
        "options": [
          "47",
          "4.7",
          "470",
          "0.47"
        ],
        "explain": "Multiply both by 10: 188 / 4 = 47."
      },
      {
        "q": "A juice box costs $1.50. How much do 4 juice boxes cost?",
        "answer": "$6.00",
        "options": [
          "$6.00",
          "$5.00",
          "$6.50",
          "$4.50"
        ],
        "explain": "4 x $1.50 = $6.00."
      }
    ]
  },
  "ratios-rates": {
    "title": "Ratios & Rates",
    "pre": [
      {
        "q": "There are 4 cats and 7 dogs. What is the ratio of cats to dogs?",
        "answer": "4 to 7",
        "options": [
          "4 to 7",
          "7 to 4",
          "4 to 11",
          "11 to 4"
        ],
        "explain": "Cats come first, so it is 4 cats to 7 dogs."
      },
      {
        "q": "Simplify the ratio 6 to 9.",
        "answer": "2 to 3",
        "options": [
          "2 to 3",
          "3 to 2",
          "2 to 9",
          "6 to 3"
        ],
        "explain": "Divide both by 3: 6 ÷ 3 = 2 and 9 ÷ 3 = 3."
      },
      {
        "q": "Which ratio is equivalent to 2:5?",
        "answer": "6:15",
        "options": [
          "6:15",
          "5:2",
          "4:8",
          "6:10"
        ],
        "explain": "Multiply both by 3: 2 × 3 = 6 and 5 × 3 = 15."
      },
      {
        "q": "A ratio table shows 3:4. What completes 9:?",
        "answer": "12",
        "options": [
          "12",
          "10",
          "13",
          "16"
        ],
        "explain": "9 is 3 × 3, so 4 × 3 = 12."
      },
      {
        "q": "A car goes 80 miles in 2 hours. What is the unit rate?",
        "answer": "40 miles per hour",
        "options": [
          "40 miles per hour",
          "80 miles per hour",
          "160 miles per hour",
          "20 miles per hour"
        ],
        "explain": "Divide miles by hours: 80 ÷ 2 = 40 miles per hour."
      },
      {
        "q": "6 apples cost $3. What is the cost of one apple?",
        "answer": "$0.50",
        "options": [
          "$0.50",
          "$2.00",
          "$1.50",
          "$3.00"
        ],
        "explain": "Divide cost by apples: $3 ÷ 6 = $0.50 each."
      },
      {
        "q": "A recipe uses 2 cups rice for 3 cups water. How much water for 8 cups of rice?",
        "answer": "12 cups",
        "options": [
          "12 cups",
          "10 cups",
          "6 cups",
          "16 cups"
        ],
        "explain": "8 rice is 2 × 4, so water = 3 × 4 = 12 cups."
      },
      {
        "q": "Which is the better buy: 4 pens for $2.00 or 6 pens for $2.40?",
        "answer": "6 pens for $2.40",
        "options": [
          "6 pens for $2.40",
          "4 pens for $2.00",
          "They are equal",
          "Cannot tell"
        ],
        "explain": "$2.00 ÷ 4 = $0.50; $2.40 ÷ 6 = $0.40, which is lower."
      }
    ],
    "post": [
      {
        "q": "There are 5 pens and 8 markers. What is the ratio of pens to markers?",
        "answer": "5 to 8",
        "options": [
          "5 to 8",
          "8 to 5",
          "5 to 13",
          "13 to 5"
        ],
        "explain": "Pens come first, so it is 5 pens to 8 markers."
      },
      {
        "q": "Simplify the ratio 8 to 12.",
        "answer": "2 to 3",
        "options": [
          "2 to 3",
          "3 to 2",
          "2 to 12",
          "4 to 3"
        ],
        "explain": "Divide both by 4: 8 ÷ 4 = 2 and 12 ÷ 4 = 3."
      },
      {
        "q": "Which ratio is equivalent to 3:4?",
        "answer": "9:12",
        "options": [
          "9:12",
          "4:3",
          "6:10",
          "9:16"
        ],
        "explain": "Multiply both by 3: 3 × 3 = 9 and 4 × 3 = 12."
      },
      {
        "q": "A ratio table shows 2:5. What completes 8:?",
        "answer": "20",
        "options": [
          "20",
          "15",
          "11",
          "18"
        ],
        "explain": "8 is 2 × 4, so 5 × 4 = 20."
      },
      {
        "q": "A train goes 90 miles in 3 hours. What is the unit rate?",
        "answer": "30 miles per hour",
        "options": [
          "30 miles per hour",
          "90 miles per hour",
          "270 miles per hour",
          "3 miles per hour"
        ],
        "explain": "Divide miles by hours: 90 ÷ 3 = 30 miles per hour."
      },
      {
        "q": "8 muffins cost $4. What is the cost of one muffin?",
        "answer": "$0.50",
        "options": [
          "$0.50",
          "$2.00",
          "$4.00",
          "$1.00"
        ],
        "explain": "Divide cost by muffins: $4 ÷ 8 = $0.50 each."
      },
      {
        "q": "A recipe uses 3 cups oats for 4 cups milk. How much milk for 12 cups of oats?",
        "answer": "16 cups",
        "options": [
          "16 cups",
          "14 cups",
          "8 cups",
          "20 cups"
        ],
        "explain": "12 oats is 3 × 4, so milk = 4 × 4 = 16 cups."
      },
      {
        "q": "Which is the better buy: 5 juice boxes for $3.00 or 8 juice boxes for $4.00?",
        "answer": "8 juice boxes for $4.00",
        "options": [
          "8 juice boxes for $4.00",
          "5 juice boxes for $3.00",
          "They are equal",
          "Cannot tell"
        ],
        "explain": "$3.00 ÷ 5 = $0.60; $4.00 ÷ 8 = $0.50, which is lower."
      }
    ]
  },
  "percents": {
    "title": "Percents & Proportions",
    "pre": [
      {
        "q": "What is 10% of 70?",
        "answer": "7",
        "options": [
          "7",
          "10",
          "17",
          "70"
        ],
        "explain": "10% is 0.10, and 0.10 times 70 equals 7."
      },
      {
        "q": "Write 1/2 as a percent.",
        "answer": "50%",
        "options": [
          "50%",
          "12%",
          "21%",
          "25%"
        ],
        "explain": "1 divided by 2 is 0.50, which equals 50%."
      },
      {
        "q": "Write 0.4 as a percent.",
        "answer": "40%",
        "options": [
          "40%",
          "4%",
          "400%",
          "0.4%"
        ],
        "explain": "Move the point two places right: 0.4 = 40%."
      },
      {
        "q": "What is 20% of 50?",
        "answer": "10",
        "options": [
          "10",
          "20",
          "30",
          "5"
        ],
        "explain": "20% is 0.20, and 0.20 times 50 equals 10."
      },
      {
        "q": "Write 25% as a decimal.",
        "answer": "0.25",
        "options": [
          "0.25",
          "2.5",
          "25",
          "0.025"
        ],
        "explain": "Move the point two places left: 25% = 0.25."
      },
      {
        "q": "10 is 25% of what number?",
        "answer": "40",
        "options": [
          "40",
          "2.5",
          "5",
          "250"
        ],
        "explain": "Divide the part by the percent: 10 divided by 0.25 equals 40."
      },
      {
        "q": "A toy is $30 and is 10% off. What is the sale price?",
        "answer": "$27",
        "options": [
          "$27",
          "$3",
          "$33",
          "$20"
        ],
        "explain": "10% of 30 is $3 off, and 30 minus 3 equals $27."
      },
      {
        "q": "A $20 meal has a 15% tip. How much is the tip?",
        "answer": "$3",
        "options": [
          "$3",
          "$15",
          "$2",
          "$23"
        ],
        "explain": "15% of 20 is 0.15 times 20, which equals $3."
      }
    ],
    "post": [
      {
        "q": "What is 10% of 90?",
        "answer": "9",
        "options": [
          "9",
          "10",
          "19",
          "90"
        ],
        "explain": "10% is 0.10, and 0.10 times 90 equals 9."
      },
      {
        "q": "Write 1/4 as a percent.",
        "answer": "25%",
        "options": [
          "25%",
          "14%",
          "41%",
          "20%"
        ],
        "explain": "1 divided by 4 is 0.25, which equals 25%."
      },
      {
        "q": "Write 0.7 as a percent.",
        "answer": "70%",
        "options": [
          "70%",
          "7%",
          "700%",
          "0.7%"
        ],
        "explain": "Move the point two places right: 0.7 = 70%."
      },
      {
        "q": "What is 30% of 90?",
        "answer": "27",
        "options": [
          "27",
          "30",
          "60",
          "9"
        ],
        "explain": "30% is 0.30, and 0.30 times 90 equals 27."
      },
      {
        "q": "Write 35% as a decimal.",
        "answer": "0.35",
        "options": [
          "0.35",
          "3.5",
          "35",
          "0.035"
        ],
        "explain": "Move the point two places left: 35% = 0.35."
      },
      {
        "q": "12 is 20% of what number?",
        "answer": "60",
        "options": [
          "60",
          "2.4",
          "40",
          "240"
        ],
        "explain": "Divide the part by the percent: 12 divided by 0.20 equals 60."
      },
      {
        "q": "A jacket is $80 and is 25% off. What is the sale price?",
        "answer": "$60",
        "options": [
          "$60",
          "$20",
          "$55",
          "$100"
        ],
        "explain": "25% of 80 is $20 off, and 80 minus 20 equals $60."
      },
      {
        "q": "A $60 meal has a 10% tip and 5% tax. What is the total?",
        "answer": "$69",
        "options": [
          "$69",
          "$66",
          "$63",
          "$75"
        ],
        "explain": "10% is $6 tip and 5% is $3 tax, so 60 plus 6 plus 3 equals $69."
      }
    ]
  },
  "integers-number-line": {
    "title": "Integers & the Number Line",
    "pre": [
      {
        "q": "Write the integer for \"5 below zero.\"",
        "answer": "-5",
        "options": [
          "-5",
          "5",
          "0",
          "-0.5"
        ],
        "explain": "Below zero means a negative number, so it is -5."
      },
      {
        "q": "What is the opposite of -12?",
        "answer": "12",
        "options": [
          "12",
          "-12",
          "0",
          "-24"
        ],
        "explain": "The opposite of -12 is 12."
      },
      {
        "q": "What is |-9|?",
        "answer": "9",
        "options": [
          "9",
          "-9",
          "0",
          "18"
        ],
        "explain": "Absolute value is distance from 0, so |-9| = 9."
      },
      {
        "q": "Compare: -8 ___ -3",
        "answer": "<",
        "options": [
          "<",
          ">",
          "=",
          "≥"
        ],
        "explain": "-8 is farther left, so it is less than -3."
      },
      {
        "q": "Order from least to greatest: -2, 3, -6, 0",
        "answer": "-6, -2, 0, 3",
        "options": [
          "-6, -2, 0, 3",
          "0, -2, 3, -6",
          "-2, -6, 0, 3",
          "3, 0, -2, -6"
        ],
        "explain": "Left to right on a number line: -6, -2, 0, 3."
      },
      {
        "q": "Find -7 + 2.",
        "answer": "-5",
        "options": [
          "-5",
          "5",
          "-9",
          "9"
        ],
        "explain": "Start at -7 and move 2 right to reach -5."
      },
      {
        "q": "Find 9 - (-4).",
        "answer": "13",
        "options": [
          "13",
          "5",
          "-13",
          "-5"
        ],
        "explain": "Subtracting a negative adds: 9 + 4 = 13."
      },
      {
        "q": "The temperature is -3°C and drops 6 degrees. What is the new temperature?",
        "answer": "-9°C",
        "options": [
          "-9°C",
          "3°C",
          "-3°C",
          "9°C"
        ],
        "explain": "Dropping subtracts: -3 - 6 = -9°C."
      }
    ],
    "post": [
      {
        "q": "Write the integer for \"8 below zero.\"",
        "answer": "-8",
        "options": [
          "-8",
          "8",
          "0",
          "-0.8"
        ],
        "explain": "Below zero means negative, so it is -8."
      },
      {
        "q": "What is the opposite of -20?",
        "answer": "20",
        "options": [
          "20",
          "-20",
          "0",
          "-40"
        ],
        "explain": "The opposite of -20 is 20."
      },
      {
        "q": "What is |-14|?",
        "answer": "14",
        "options": [
          "14",
          "-14",
          "0",
          "28"
        ],
        "explain": "Absolute value is distance from 0, so |-14| = 14."
      },
      {
        "q": "Compare: -2 ___ -9",
        "answer": ">",
        "options": [
          ">",
          "<",
          "=",
          "≤"
        ],
        "explain": "-2 is closer to zero, so it is greater than -9."
      },
      {
        "q": "Order from least to greatest: -4, 1, -1, 5",
        "answer": "-4, -1, 1, 5",
        "options": [
          "-4, -1, 1, 5",
          "1, -1, 5, -4",
          "-1, -4, 1, 5",
          "5, 1, -1, -4"
        ],
        "explain": "Left to right on a number line: -4, -1, 1, 5."
      },
      {
        "q": "Find -6 + 4.",
        "answer": "-2",
        "options": [
          "-2",
          "2",
          "-10",
          "10"
        ],
        "explain": "Start at -6 and move 4 right to reach -2."
      },
      {
        "q": "Find 11 - (-3).",
        "answer": "14",
        "options": [
          "14",
          "8",
          "-14",
          "-8"
        ],
        "explain": "Subtracting a negative adds: 11 + 3 = 14."
      },
      {
        "q": "A diver is at -60 feet and rises 25 feet. What is the new depth?",
        "answer": "-35 feet",
        "options": [
          "-35 feet",
          "-85 feet",
          "35 feet",
          "-25 feet"
        ],
        "explain": "Rising adds: -60 + 25 = -35 feet."
      }
    ]
  },
  "coordinate-plane": {
    "title": "The Coordinate Plane",
    "pre": [
      {
        "q": "In the ordered pair (8, 1), what is the x-coordinate?",
        "answer": "8",
        "options": [
          "8",
          "1",
          "9",
          "0"
        ],
        "explain": "The first number in (x, y) is the x-coordinate, which is 8."
      },
      {
        "q": "Which quadrant contains the point (5, 6)?",
        "answer": "Quadrant I",
        "options": [
          "Quadrant I",
          "Quadrant II",
          "Quadrant III",
          "Quadrant IV"
        ],
        "explain": "Both coordinates are positive, so the point is in Quadrant I."
      },
      {
        "q": "Which quadrant contains the point (-3, 7)?",
        "answer": "Quadrant II",
        "options": [
          "Quadrant II",
          "Quadrant I",
          "Quadrant III",
          "Quadrant IV"
        ],
        "explain": "Negative x and positive y place the point in Quadrant II."
      },
      {
        "q": "The point (0, 9) lies on which axis?",
        "answer": "y-axis",
        "options": [
          "y-axis",
          "x-axis",
          "Quadrant I",
          "origin"
        ],
        "explain": "When x is 0, the point sits on the vertical y-axis."
      },
      {
        "q": "What is the distance between (3, 2) and (3, 8)?",
        "answer": "6 units",
        "options": [
          "6 units",
          "5 units",
          "11 units",
          "10 units"
        ],
        "explain": "Same x means a vertical line: 8 - 2 = 6 units."
      },
      {
        "q": "What is the distance between (2, 5) and (9, 5)?",
        "answer": "7 units",
        "options": [
          "7 units",
          "4 units",
          "14 units",
          "11 units"
        ],
        "explain": "Same y means a horizontal line: 9 - 2 = 7 units."
      },
      {
        "q": "Reflect (4, 6) across the x-axis. What is the new point?",
        "answer": "(4, -6)",
        "options": [
          "(4, -6)",
          "(-4, 6)",
          "(-4, -6)",
          "(6, 4)"
        ],
        "explain": "Across the x-axis, keep x and flip y, giving (4, -6)."
      },
      {
        "q": "A library is at (-7, 2) and a park at (4, 2), each unit 1 block. How many blocks apart are they?",
        "answer": "11 blocks",
        "options": [
          "11 blocks",
          "3 blocks",
          "9 blocks",
          "5 blocks"
        ],
        "explain": "Same y, so count from -7 to 4 on the x-axis: that is 11 blocks."
      }
    ],
    "post": [
      {
        "q": "In the ordered pair (6, 9), what is the x-coordinate?",
        "answer": "6",
        "options": [
          "6",
          "9",
          "15",
          "0"
        ],
        "explain": "The first number in (x, y) is the x-coordinate, which is 6."
      },
      {
        "q": "Which quadrant contains the point (7, 3)?",
        "answer": "Quadrant I",
        "options": [
          "Quadrant I",
          "Quadrant II",
          "Quadrant III",
          "Quadrant IV"
        ],
        "explain": "Both coordinates are positive, so the point is in Quadrant I."
      },
      {
        "q": "Which quadrant contains the point (-6, 4)?",
        "answer": "Quadrant II",
        "options": [
          "Quadrant II",
          "Quadrant I",
          "Quadrant III",
          "Quadrant IV"
        ],
        "explain": "Negative x and positive y place the point in Quadrant II."
      },
      {
        "q": "The point (0, -4) lies on which axis?",
        "answer": "y-axis",
        "options": [
          "y-axis",
          "x-axis",
          "Quadrant IV",
          "origin"
        ],
        "explain": "When x is 0, the point sits on the vertical y-axis."
      },
      {
        "q": "What is the distance between (5, 1) and (5, 9)?",
        "answer": "8 units",
        "options": [
          "8 units",
          "4 units",
          "14 units",
          "10 units"
        ],
        "explain": "Same x means a vertical line: 9 - 1 = 8 units."
      },
      {
        "q": "What is the distance between (3, 6) and (11, 6)?",
        "answer": "8 units",
        "options": [
          "8 units",
          "5 units",
          "17 units",
          "14 units"
        ],
        "explain": "Same y means a horizontal line: 11 - 3 = 8 units."
      },
      {
        "q": "Reflect (5, 7) across the x-axis. What is the new point?",
        "answer": "(5, -7)",
        "options": [
          "(5, -7)",
          "(-5, 7)",
          "(-5, -7)",
          "(7, 5)"
        ],
        "explain": "Across the x-axis, keep x and flip y, giving (5, -7)."
      },
      {
        "q": "A store is at (-8, 3) and a school at (5, 3), each unit 1 block. How many blocks apart are they?",
        "answer": "13 blocks",
        "options": [
          "13 blocks",
          "3 blocks",
          "11 blocks",
          "6 blocks"
        ],
        "explain": "Same y, so count from -8 to 5 on the x-axis: that is 13 blocks."
      }
    ]
  },
  "expressions": {
    "title": "Expressions & Properties",
    "pre": [
      {
        "q": "Write 2 × 2 × 2 × 2 × 2 using an exponent.",
        "answer": "2^5",
        "options": [
          "2^5",
          "5^2",
          "2^4",
          "2 × 5"
        ],
        "explain": "The base 2 is multiplied 5 times, so it is 2^5."
      },
      {
        "q": "What is the value of 4^2?",
        "answer": "16",
        "options": [
          "16",
          "8",
          "6",
          "42"
        ],
        "explain": "4 × 4 = 16."
      },
      {
        "q": "Evaluate 6x when x = 3.",
        "answer": "18",
        "options": [
          "18",
          "9",
          "63",
          "12"
        ],
        "explain": "6 × 3 = 18."
      },
      {
        "q": "Which expression means '5 more than a number n'?",
        "answer": "n + 5",
        "options": [
          "n + 5",
          "5 - n",
          "5n",
          "n - 5"
        ],
        "explain": "\"More than\" means add, so it is n + 5."
      },
      {
        "q": "Combine like terms: 2x + 7x.",
        "answer": "9x",
        "options": [
          "9x",
          "9",
          "14x",
          "9x^2"
        ],
        "explain": "Add the coefficients: 2 + 7 = 9, so 9x."
      },
      {
        "q": "Use the distributive property: 3(x + 2).",
        "answer": "3x + 6",
        "options": [
          "3x + 6",
          "3x + 2",
          "x + 6",
          "3x + 5"
        ],
        "explain": "Multiply 3 by each term: 3 × x = 3x and 3 × 2 = 6."
      },
      {
        "q": "Evaluate 2x + 1 when x = 4.",
        "answer": "9",
        "options": [
          "9",
          "7",
          "8",
          "24"
        ],
        "explain": "2 × 4 = 8, then 8 + 1 = 9."
      },
      {
        "q": "A book costs b dollars. Write an expression for the cost of 5 books.",
        "answer": "5b",
        "options": [
          "5b",
          "b + 5",
          "b - 5",
          "5 + b"
        ],
        "explain": "5 books each costing b means 5 × b = 5b."
      }
    ],
    "post": [
      {
        "q": "Write 3 × 3 × 3 × 3 using an exponent.",
        "answer": "3^4",
        "options": [
          "3^4",
          "4^3",
          "3^3",
          "3 × 4"
        ],
        "explain": "The base 3 is multiplied 4 times, so it is 3^4."
      },
      {
        "q": "What is the value of 5^2?",
        "answer": "25",
        "options": [
          "25",
          "10",
          "7",
          "52"
        ],
        "explain": "5 × 5 = 25."
      },
      {
        "q": "Evaluate 7x when x = 4.",
        "answer": "28",
        "options": [
          "28",
          "11",
          "74",
          "21"
        ],
        "explain": "7 × 4 = 28."
      },
      {
        "q": "Which expression means '6 less than a number p'?",
        "answer": "p - 6",
        "options": [
          "p - 6",
          "6 - p",
          "p + 6",
          "6p"
        ],
        "explain": "\"Less than\" reverses the order, so it is p - 6."
      },
      {
        "q": "Combine like terms: 4x + 5x.",
        "answer": "9x",
        "options": [
          "9x",
          "9",
          "20x",
          "9x^2"
        ],
        "explain": "Add the coefficients: 4 + 5 = 9, so 9x."
      },
      {
        "q": "Use the distributive property: 4(x + 3).",
        "answer": "4x + 12",
        "options": [
          "4x + 12",
          "4x + 3",
          "x + 12",
          "4x + 7"
        ],
        "explain": "Multiply 4 by each term: 4 × x = 4x and 4 × 3 = 12."
      },
      {
        "q": "Evaluate 3x + 2 when x = 5.",
        "answer": "17",
        "options": [
          "17",
          "15",
          "10",
          "35"
        ],
        "explain": "3 × 5 = 15, then 15 + 2 = 17."
      },
      {
        "q": "A pen costs c dollars. Write an expression for the cost of 8 pens.",
        "answer": "8c",
        "options": [
          "8c",
          "c + 8",
          "c - 8",
          "8 + c"
        ],
        "explain": "8 pens each costing c means 8 × c = 8c."
      }
    ]
  },
  "equations-inequalities": {
    "title": "One-Step Equations & Inequalities",
    "pre": [
      {
        "q": "Solve: x + 5 = 11",
        "answer": "6",
        "options": [
          "6",
          "16",
          "5",
          "55"
        ],
        "explain": "Subtract 5 from both sides: 11 - 5 = 6."
      },
      {
        "q": "Solve: x - 4 = 9",
        "answer": "13",
        "options": [
          "13",
          "5",
          "36",
          "13.5"
        ],
        "explain": "Add 4 to both sides: 9 + 4 = 13."
      },
      {
        "q": "Solve: 6x = 30",
        "answer": "5",
        "options": [
          "5",
          "36",
          "24",
          "180"
        ],
        "explain": "Divide both sides by 6: 30 ÷ 6 = 5."
      },
      {
        "q": "Solve: x ÷ 2 = 7",
        "answer": "14",
        "options": [
          "14",
          "5",
          "9",
          "3.5"
        ],
        "explain": "Multiply both sides by 2: 7 × 2 = 14."
      },
      {
        "q": "Is x = 3 a solution to x + 6 = 9?",
        "answer": "Yes, because 3 + 6 = 9",
        "options": [
          "Yes, because 3 + 6 = 9",
          "No, because 3 + 6 = 18",
          "Yes, because 9 - 3 = 5",
          "No, because x must be 6"
        ],
        "explain": "Substituting 3 gives 3 + 6 = 9, which is true."
      },
      {
        "q": "Which inequality means 'x is at least 5'?",
        "answer": "x ≥ 5",
        "options": [
          "x ≥ 5",
          "x ≤ 5",
          "x > 5",
          "x < 5"
        ],
        "explain": "'At least 5' includes 5, so x ≥ 5."
      },
      {
        "q": "A box holds 8 crayons. The equation 8b = 56 finds the number of boxes b for 56 crayons. Find b.",
        "answer": "7",
        "options": [
          "7",
          "48",
          "64",
          "8"
        ],
        "explain": "Divide both sides by 8: 56 ÷ 8 = 7 boxes."
      },
      {
        "q": "In y = 3x, which is the independent variable?",
        "answer": "x",
        "options": [
          "x",
          "y",
          "3",
          "none"
        ],
        "explain": "The independent variable x is the input; y depends on it."
      }
    ],
    "post": [
      {
        "q": "Solve: x + 8 = 15",
        "answer": "7",
        "options": [
          "7",
          "23",
          "8",
          "58"
        ],
        "explain": "Subtract 8 from both sides: 15 - 8 = 7."
      },
      {
        "q": "Solve: x - 6 = 10",
        "answer": "16",
        "options": [
          "16",
          "4",
          "60",
          "16.5"
        ],
        "explain": "Add 6 to both sides: 10 + 6 = 16."
      },
      {
        "q": "Solve: 7x = 49",
        "answer": "7",
        "options": [
          "7",
          "56",
          "42",
          "343"
        ],
        "explain": "Divide both sides by 7: 49 ÷ 7 = 7."
      },
      {
        "q": "Solve: x ÷ 3 = 8",
        "answer": "24",
        "options": [
          "24",
          "5",
          "11",
          "2.67"
        ],
        "explain": "Multiply both sides by 3: 8 × 3 = 24."
      },
      {
        "q": "Is x = 4 a solution to x + 7 = 11?",
        "answer": "Yes, because 4 + 7 = 11",
        "options": [
          "Yes, because 4 + 7 = 11",
          "No, because 4 + 7 = 28",
          "Yes, because 11 - 4 = 6",
          "No, because x must be 7"
        ],
        "explain": "Substituting 4 gives 4 + 7 = 11, which is true."
      },
      {
        "q": "Which inequality means 'x is at most 9'?",
        "answer": "x ≤ 9",
        "options": [
          "x ≤ 9",
          "x ≥ 9",
          "x < 9",
          "x > 9"
        ],
        "explain": "'At most 9' includes 9, so x ≤ 9."
      },
      {
        "q": "A pack holds 9 stickers. The equation 9p = 63 finds the number of packs p for 63 stickers. Find p.",
        "answer": "7",
        "options": [
          "7",
          "54",
          "72",
          "9"
        ],
        "explain": "Divide both sides by 9: 63 ÷ 9 = 7 packs."
      },
      {
        "q": "In d = 4t, which is the dependent variable?",
        "answer": "d",
        "options": [
          "d",
          "t",
          "4",
          "none"
        ],
        "explain": "The dependent variable d depends on the input t."
      }
    ]
  },
  "geometry-measure": {
    "title": "Area, Surface Area & Volume",
    "pre": [
      {
        "q": "What is the area of a parallelogram with base 5 cm and height 4 cm?",
        "answer": "20 cm²",
        "options": [
          "20 cm²",
          "9 cm²",
          "18 cm²",
          "40 cm²"
        ],
        "explain": "Area is base × height: 5 × 4 = 20."
      },
      {
        "q": "A triangle has base 8 m and height 6 m. What is its area?",
        "answer": "24 m²",
        "options": [
          "24 m²",
          "48 m²",
          "14 m²",
          "28 m²"
        ],
        "explain": "Triangle area is ½ × 8 × 6 = 24."
      },
      {
        "q": "What is the area of a trapezoid with parallel sides 4 cm and 8 cm and height 5 cm?",
        "answer": "30 cm²",
        "options": [
          "30 cm²",
          "60 cm²",
          "20 cm²",
          "40 cm²"
        ],
        "explain": "(4+8)/2 × 5 = 6 × 5 = 30."
      },
      {
        "q": "What is the volume of a box that is 6 cm by 2 cm by 4 cm?",
        "answer": "48 cm³",
        "options": [
          "48 cm³",
          "12 cm³",
          "88 cm³",
          "24 cm³"
        ],
        "explain": "Volume is 6 × 2 × 4 = 48."
      },
      {
        "q": "What is the surface area of a cube with edge length 3 in?",
        "answer": "54 in²",
        "options": [
          "54 in²",
          "27 in²",
          "9 in²",
          "18 in²"
        ],
        "explain": "A cube has 6 equal faces: 6 × (3×3) = 54."
      },
      {
        "q": "A box is ½ ft by 4 ft by 3 ft. What is its volume?",
        "answer": "6 ft³",
        "options": [
          "6 ft³",
          "7½ ft³",
          "12 ft³",
          "2 ft³"
        ],
        "explain": "Volume is ½ × 4 × 3 = 6."
      },
      {
        "q": "A composite figure is a 5 cm by 4 cm rectangle with a triangle on top (base 5 cm, height 2 cm). What is the total area?",
        "answer": "25 cm²",
        "options": [
          "25 cm²",
          "20 cm²",
          "30 cm²",
          "23 cm²"
        ],
        "explain": "Rectangle 5×4 = 20, triangle ½×5×2 = 5, total 20+5 = 25."
      },
      {
        "q": "You wrap a box that is 7 in by 3 in by 2 in. How much paper (surface area) do you need?",
        "answer": "82 in²",
        "options": [
          "82 in²",
          "42 in²",
          "41 in²",
          "164 in²"
        ],
        "explain": "Surface area is 2(7×3 + 7×2 + 3×2) = 2(21+14+6) = 82."
      }
    ],
    "post": [
      {
        "q": "What is the area of a parallelogram with base 7 cm and height 5 cm?",
        "answer": "35 cm²",
        "options": [
          "35 cm²",
          "12 cm²",
          "24 cm²",
          "70 cm²"
        ],
        "explain": "Area is base × height: 7 × 5 = 35."
      },
      {
        "q": "A triangle has base 6 m and height 8 m. What is its area?",
        "answer": "24 m²",
        "options": [
          "24 m²",
          "48 m²",
          "14 m²",
          "28 m²"
        ],
        "explain": "Triangle area is ½ × 6 × 8 = 24."
      },
      {
        "q": "What is the area of a trapezoid with parallel sides 5 cm and 7 cm and height 4 cm?",
        "answer": "24 cm²",
        "options": [
          "24 cm²",
          "48 cm²",
          "16 cm²",
          "35 cm²"
        ],
        "explain": "(5+7)/2 × 4 = 6 × 4 = 24."
      },
      {
        "q": "What is the volume of a box that is 5 cm by 3 cm by 4 cm?",
        "answer": "60 cm³",
        "options": [
          "60 cm³",
          "12 cm³",
          "94 cm³",
          "23 cm³"
        ],
        "explain": "Volume is 5 × 3 × 4 = 60."
      },
      {
        "q": "What is the surface area of a cube with edge length 4 in?",
        "answer": "96 in²",
        "options": [
          "96 in²",
          "64 in²",
          "16 in²",
          "24 in²"
        ],
        "explain": "A cube has 6 equal faces: 6 × (4×4) = 96."
      },
      {
        "q": "A box is ½ ft by 3 ft by 2 ft. What is its volume?",
        "answer": "3 ft³",
        "options": [
          "3 ft³",
          "5½ ft³",
          "6 ft³",
          "1½ ft³"
        ],
        "explain": "Volume is ½ × 3 × 2 = 3."
      },
      {
        "q": "A composite figure is a 6 cm by 4 cm rectangle with a triangle on top (base 6 cm, height 4 cm). What is the total area?",
        "answer": "36 cm²",
        "options": [
          "36 cm²",
          "24 cm²",
          "48 cm²",
          "30 cm²"
        ],
        "explain": "Rectangle 6×4 = 24, triangle ½×6×4 = 12, total 24+12 = 36."
      },
      {
        "q": "You wrap a box that is 8 in by 3 in by 2 in. How much paper (surface area) do you need?",
        "answer": "92 in²",
        "options": [
          "92 in²",
          "48 in²",
          "46 in²",
          "184 in²"
        ],
        "explain": "Surface area is 2(8×3 + 8×2 + 3×2) = 2(24+16+6) = 92."
      }
    ]
  },
  "statistics-data": {
    "title": "Statistics & Data",
    "pre": [
      {
        "q": "Which is a statistical question?",
        "answer": "How many books did each student read this month?",
        "options": [
          "How many books did each student read this month?",
          "How many books did I read this month?",
          "What is my favorite book?",
          "How many pages are in this book?"
        ],
        "explain": "It expects different answers from different students, so it is statistical."
      },
      {
        "q": "What is the mode of 4, 5, 5, 7, 9?",
        "answer": "5",
        "options": [
          "5",
          "7",
          "9",
          "4"
        ],
        "explain": "5 appears most often, so it is the mode."
      },
      {
        "q": "What is the range of 6, 14, 9, 20, 11?",
        "answer": "14",
        "options": [
          "14",
          "20",
          "11",
          "9"
        ],
        "explain": "Range = 20 - 6 = 14."
      },
      {
        "q": "What is the mean of 8, 12, and 10?",
        "answer": "10",
        "options": [
          "10",
          "12",
          "30",
          "9"
        ],
        "explain": "Sum is 30; 30 / 3 = 10."
      },
      {
        "q": "What is the median of 3, 7, 5, 9, 1 (order first)?",
        "answer": "5",
        "options": [
          "5",
          "7",
          "9",
          "3"
        ],
        "explain": "Ordered: 1, 3, 5, 7, 9. The middle value is 5."
      },
      {
        "q": "On a dot plot, 6 dots are stacked above the number 4. What does this mean?",
        "answer": "The value 4 appears 6 times",
        "options": [
          "The value 4 appears 6 times",
          "The value 6 appears 4 times",
          "The total is 24",
          "The mean is 4"
        ],
        "explain": "Each dot is one data point, so 6 dots above 4 means 4 occurred 6 times."
      },
      {
        "q": "What is the mean absolute deviation of 3, 5, 7, 9 (mean is 6)?",
        "answer": "2",
        "options": [
          "2",
          "6",
          "4",
          "3"
        ],
        "explain": "Distances are 3,1,1,3 (sum 8); 8 / 4 = 2."
      },
      {
        "q": "A player scored a mean of 15 points over 4 games. What was the total?",
        "answer": "60",
        "options": [
          "60",
          "19",
          "15",
          "4"
        ],
        "explain": "Total = 15 x 4 = 60 points."
      }
    ],
    "post": [
      {
        "q": "Which is a statistical question?",
        "answer": "How many minutes does each student spend on homework?",
        "options": [
          "How many minutes does each student spend on homework?",
          "How many minutes did I spend on homework?",
          "What is my homework grade?",
          "What time is it now?"
        ],
        "explain": "It expects varying answers from different students, so it is statistical."
      },
      {
        "q": "What is the mode of 2, 6, 6, 8, 10?",
        "answer": "6",
        "options": [
          "6",
          "8",
          "10",
          "2"
        ],
        "explain": "6 appears most often, so it is the mode."
      },
      {
        "q": "What is the range of 5, 13, 8, 19, 10?",
        "answer": "14",
        "options": [
          "14",
          "19",
          "10",
          "8"
        ],
        "explain": "Range = 19 - 5 = 14."
      },
      {
        "q": "What is the mean of 7, 11, and 9?",
        "answer": "9",
        "options": [
          "9",
          "11",
          "27",
          "8"
        ],
        "explain": "Sum is 27; 27 / 3 = 9."
      },
      {
        "q": "What is the median of 2, 8, 4, 10, 6 (order first)?",
        "answer": "6",
        "options": [
          "6",
          "8",
          "10",
          "4"
        ],
        "explain": "Ordered: 2, 4, 6, 8, 10. The middle value is 6."
      },
      {
        "q": "On a dot plot, 5 dots are stacked above the number 3. What does this mean?",
        "answer": "The value 3 appears 5 times",
        "options": [
          "The value 3 appears 5 times",
          "The value 5 appears 3 times",
          "The total is 15",
          "The mean is 3"
        ],
        "explain": "Each dot is one data point, so 5 dots above 3 means 3 occurred 5 times."
      },
      {
        "q": "What is the mean absolute deviation of 4, 6, 8, 10 (mean is 7)?",
        "answer": "2",
        "options": [
          "2",
          "7",
          "4",
          "3"
        ],
        "explain": "Distances are 3,1,1,3 (sum 8); 8 / 4 = 2."
      },
      {
        "q": "A player scored a mean of 12 points over 5 games. What was the total?",
        "answer": "60",
        "options": [
          "60",
          "17",
          "12",
          "5"
        ],
        "explain": "Total = 12 x 5 = 60 points."
      }
    ]
  }
};

function createAllInterventionForms() {
  // Fall back to a default if the top FOLDER_NAME line was missed when pasting.
  var folderName =
    typeof FOLDER_NAME !== "undefined"
      ? FOLDER_NAME
      : "Neft Teacher — Math Intervention Quizzes";
  var folder = getOrCreateFolder_(folderName);
  var out = {};
  Object.keys(QUIZ_DATA).forEach(function (slug) {
    var topic = QUIZ_DATA[slug];
    var links = {
      preStudent: buildForm_(folder, slug, topic.title, "Pre", topic.pre, false),
      preTeacher: buildForm_(folder, slug, topic.title, "Pre", topic.pre, true),
      postStudent: buildForm_(folder, slug, topic.title, "Post", topic.post, false),
      postTeacher: buildForm_(folder, slug, topic.title, "Post", topic.post, true),
    };
    // Differentiated variants only when the topic supplies them in data.mjs.
    if (topic.level1 && topic.level1.length) {
      links.level1Student = buildForm_(folder, slug, topic.title, "Level 1", topic.level1, false);
    }
    if (topic.level2 && topic.level2.length) {
      links.level2Student = buildForm_(folder, slug, topic.title, "Level 2", topic.level2, false);
    }
    out[slug] = links;
  });
  printSnippet_(out);
}

function buildForm_(folder, slug, title, phase, items, isTeacher) {
  var role = isTeacher ? "Teacher" : "Student";
  var name = title + " — " + phase + "-Quiz (" + role + ")";
  var form = FormApp.create(name);
  form.setIsQuiz(true);
  form.setDescription(
    phase +
      "-quiz for the " +
      title +
      " intervention topic." +
      (isTeacher ? " TEACHER MASTER — answer key shown below each item." : ""),
  );
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);

  var nameItem = form.addTextItem();
  nameItem.setTitle("First & last name").setRequired(true);

  items.forEach(function (it) {
    var q = form.addMultipleChoiceItem();
    var choices = it.options.map(function (opt) {
      return q.createChoice(String(opt), String(opt) === String(it.answer));
    });
    q.setTitle(it.q).setChoices(choices).setPoints(1).setRequired(true);
    if (isTeacher) q.setHelpText("✔ Answer: " + it.answer);

    // Correct-answer feedback = the explanation (falls back to the answer).
    var correctText = it.explain ? it.explain : "Answer: " + it.answer;
    q.setFeedbackForCorrect(
      FormApp.createFeedback().setText(correctText).build(),
    );

    // Wrong-answer feedback. The Forms API gives one incorrect-feedback per
    // item (not per choice), so assemble the per-distractor misconception notes
    // into a single targeted message. Falls back to the answer when none given.
    var incorrectText = buildIncorrectFeedback_(it);
    q.setFeedbackForIncorrect(
      FormApp.createFeedback().setText(incorrectText).build(),
    );
  });

  // file the form in the folder
  var file = DriveApp.getFileById(form.getId());
  folder.addFile(file);
  try {
    DriveApp.getRootFolder().removeFile(file);
  } catch (e) {}

  return isTeacher ? form.getEditUrl() : form.getPublishedUrl();
}

function getOrCreateFolder_(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

// Build the wrong-answer feedback for one item. Lists each distractor's
// "why this is wrong" note from it.misconceptions (keyed by option text), then
// states the correct answer + explanation. Falls back gracefully when a item
// has no misconceptions map.
function buildIncorrectFeedback_(it) {
  var lines = [];
  var map = it.misconceptions || {};
  it.options.forEach(function (opt) {
    var key = String(opt);
    if (key === String(it.answer)) return; // skip the correct choice
    if (map[key]) lines.push("• " + key + ": " + map[key]);
  });
  var tail = it.explain
    ? "Correct answer: " + it.answer + ". " + it.explain
    : "Correct answer: " + it.answer + ".";
  return lines.length ? lines.join("\n") + "\n\n" + tail : tail;
}

function printSnippet_(out) {
  var lines = ["window.INTERVENTION_FORMS = {"];
  Object.keys(out).forEach(function (slug) {
    var u = out[slug];
    // Emit every link present (the optional level1/level2 keys only appear when
    // the topic defined tiered variants), keeping the existing key order first.
    var order = [
      "preStudent",
      "preTeacher",
      "postStudent",
      "postTeacher",
      "level1Student",
      "level2Student",
    ];
    var parts = [];
    order.forEach(function (k) {
      if (u[k]) parts.push(k + ': "' + u[k] + '"');
    });
    lines.push('  "' + slug + '": { ' + parts.join(", ") + " },");
  });
  lines.push("};");
  var block = lines.join("\n");
  Logger.log("\n===== PASTE INTO math/intervention/assets/forms-links.js =====\n");
  Logger.log(block);
  Logger.log("\n===== END =====");
}
