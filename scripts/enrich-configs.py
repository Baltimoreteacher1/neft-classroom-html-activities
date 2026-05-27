#!/usr/bin/env python3
"""Batch-enrich lesson configs with additional practice problems and vocabulary."""

import json
import os
from pathlib import Path

LESSONS_DIR = Path(__file__).parent.parent / "lessons"

# Additional approaching MC problems by unit topic
APPROACHING_MC = {
    "1": [  # Number Sense
        {
            "stem": "Which number is a factor of 30?",
            "choices": ["6", "8", "9", "11"],
            "correctIndex": 0,
            "explanation": "30 ÷ 6 = 5 with no remainder, so 6 is a factor of 30.",
        },
        {
            "stem": "What is 4.7 + 3.85?",
            "choices": ["8.55", "8.45", "7.55", "8.65"],
            "correctIndex": 0,
            "explanation": "Line up decimal points: 4.70 + 3.85 = 8.55.",
        },
        {
            "stem": "What is 12.6 × 0.5?",
            "choices": ["6.3", "6.03", "63", "0.63"],
            "correctIndex": 0,
            "explanation": "12.6 × 0.5 = 12.6 ÷ 2 = 6.3.",
        },
        {
            "stem": "What is the LCM of 4 and 6?",
            "choices": ["12", "24", "2", "6"],
            "correctIndex": 0,
            "explanation": "Multiples of 4: 4, 8, 12... Multiples of 6: 6, 12... The smallest common multiple is 12.",
        },
        {
            "stem": "What is 144 ÷ 12?",
            "choices": ["12", "11", "13", "14"],
            "correctIndex": 0,
            "explanation": "12 × 12 = 144, so 144 ÷ 12 = 12.",
        },
        {
            "stem": "Which is the prime factorization of 36?",
            "choices": ["2² × 3²", "4 × 9", "6 × 6", "2 × 18"],
            "correctIndex": 0,
            "explanation": "36 = 4 × 9 = 2² × 3². Prime factors are only primes.",
        },
        {
            "stem": "What is 8.4 ÷ 0.7?",
            "choices": ["12", "1.2", "120", "0.12"],
            "correctIndex": 0,
            "explanation": "8.4 ÷ 0.7 = 84 ÷ 7 = 12.",
        },
    ],
    "2": [  # Fractions
        {
            "stem": "What is 3/4 × 2/5?",
            "choices": ["6/20", "5/9", "3/10", "6/9"],
            "correctIndex": 0,
            "explanation": "Multiply numerators: 3 × 2 = 6. Multiply denominators: 4 × 5 = 20. So 6/20 = 3/10.",
        },
        {
            "stem": "What is 2/3 ÷ 1/4?",
            "choices": ["8/3", "2/12", "1/6", "3/8"],
            "correctIndex": 0,
            "explanation": "Divide by flipping: 2/3 × 4/1 = 8/3.",
        },
        {
            "stem": "What is 1 2/3 × 3?",
            "choices": ["5", "4 2/3", "3 2/3", "6"],
            "correctIndex": 0,
            "explanation": "1 2/3 = 5/3. Then 5/3 × 3 = 15/3 = 5.",
        },
        {
            "stem": "What is 5/6 − 1/3?",
            "choices": ["1/2", "4/3", "2/3", "1/6"],
            "correctIndex": 0,
            "explanation": "1/3 = 2/6. So 5/6 − 2/6 = 3/6 = 1/2.",
        },
        {
            "stem": "What is 7/8 ÷ 7/8?",
            "choices": ["1", "7/8", "49/64", "0"],
            "correctIndex": 0,
            "explanation": "Any number divided by itself equals 1.",
        },
    ],
    "3": [  # Ratios
        {
            "stem": "If the ratio of cats to dogs is 3:5 and there are 15 dogs, how many cats are there?",
            "choices": ["9", "25", "5", "12"],
            "correctIndex": 0,
            "explanation": "3/5 = x/15. Cross multiply: 5x = 45, so x = 9 cats.",
        },
        {
            "stem": "What is the unit rate if 6 apples cost $4.50?",
            "choices": ["$0.75", "$1.50", "$0.50", "$4.50"],
            "correctIndex": 0,
            "explanation": "$4.50 ÷ 6 = $0.75 per apple.",
        },
        {
            "stem": "Which ratio is equivalent to 4:6?",
            "choices": ["2:3", "3:4", "6:4", "8:10"],
            "correctIndex": 0,
            "explanation": "4:6 simplified by dividing both by 2 = 2:3.",
        },
        {
            "stem": "Convert 3 feet to inches.",
            "choices": ["36 inches", "12 inches", "30 inches", "24 inches"],
            "correctIndex": 0,
            "explanation": "1 foot = 12 inches. 3 × 12 = 36 inches.",
        },
    ],
    "4": [  # Percents
        {
            "stem": "What is 25% of 80?",
            "choices": ["20", "25", "40", "16"],
            "correctIndex": 0,
            "explanation": "25% = 1/4. 80 × 1/4 = 20.",
        },
        {
            "stem": "Convert 3/5 to a percent.",
            "choices": ["60%", "35%", "53%", "65%"],
            "correctIndex": 0,
            "explanation": "3 ÷ 5 = 0.6 = 60%.",
        },
        {
            "stem": "A shirt costs $40. It is 15% off. What is the discount?",
            "choices": ["$6", "$34", "$8", "$5"],
            "correctIndex": 0,
            "explanation": "15% of $40 = 0.15 × 40 = $6.",
        },
        {
            "stem": "What is 0.45 as a percent?",
            "choices": ["45%", "4.5%", "0.45%", "450%"],
            "correctIndex": 0,
            "explanation": "Move the decimal point 2 places right: 0.45 = 45%.",
        },
        {
            "stem": "If 30% of a number is 12, what is the number?",
            "choices": ["40", "36", "30", "48"],
            "correctIndex": 0,
            "explanation": "30% × n = 12. n = 12 ÷ 0.30 = 40.",
        },
        {
            "stem": "You deposit $200 at 5% simple interest for 2 years. How much interest do you earn?",
            "choices": ["$20", "$10", "$50", "$25"],
            "correctIndex": 0,
            "explanation": "I = P × r × t = 200 × 0.05 × 2 = $20.",
        },
        {
            "stem": "What is 150% of 20?",
            "choices": ["30", "15", "35", "25"],
            "correctIndex": 0,
            "explanation": "150% = 1.5. 1.5 × 20 = 30.",
        },
    ],
    "5": [  # Area
        {
            "stem": "What is the area of a parallelogram with base 9 cm and height 5 cm?",
            "choices": ["45 sq cm", "14 sq cm", "22.5 sq cm", "90 sq cm"],
            "correctIndex": 0,
            "explanation": "A = b × h = 9 × 5 = 45 square centimeters.",
        },
        {
            "stem": "A triangle has base 16 ft and height 10 ft. What is its area?",
            "choices": ["80 sq ft", "160 sq ft", "26 sq ft", "80 ft"],
            "correctIndex": 0,
            "explanation": "A = 1/2 × b × h = 1/2 × 16 × 10 = 80 sq ft.",
        },
        {
            "stem": "A trapezoid has bases 6 m and 10 m with height 4 m. What is its area?",
            "choices": ["32 sq m", "40 sq m", "24 sq m", "64 sq m"],
            "correctIndex": 0,
            "explanation": "A = 1/2 × (b₁ + b₂) × h = 1/2 × (6 + 10) × 4 = 32 sq m.",
        },
        {
            "stem": "A regular hexagon is split into 6 triangles, each with base 4 cm and height 3.5 cm. What is the total area?",
            "choices": ["42 sq cm", "21 sq cm", "84 sq cm", "14 sq cm"],
            "correctIndex": 0,
            "explanation": "Each triangle: 1/2 × 4 × 3.5 = 7 sq cm. Total: 6 × 7 = 42 sq cm.",
        },
        {
            "stem": "Find the area of an L-shape made of a 5×3 rectangle and a 2×4 rectangle.",
            "choices": ["23 sq units", "15 sq units", "8 sq units", "20 sq units"],
            "correctIndex": 0,
            "explanation": "5 × 3 = 15. 2 × 4 = 8. Total = 15 + 8 = 23 sq units.",
        },
    ],
    "6": [  # Expressions
        {
            "stem": "Evaluate: 3 × (4 + 2)²",
            "choices": ["108", "54", "36", "144"],
            "correctIndex": 0,
            "explanation": "4 + 2 = 6. 6² = 36. 3 × 36 = 108.",
        },
        {
            "stem": "Which expression means '5 less than twice a number n'?",
            "choices": ["2n − 5", "5 − 2n", "2(n − 5)", "2 − 5n"],
            "correctIndex": 0,
            "explanation": "Twice n is 2n. Five less than that is 2n − 5.",
        },
        {
            "stem": "Simplify: 4x + 3 + 2x − 1",
            "choices": ["6x + 2", "6x + 4", "4x + 2", "9x"],
            "correctIndex": 0,
            "explanation": "Combine like terms: 4x + 2x = 6x. 3 + (−1) = 2. Result: 6x + 2.",
        },
        {
            "stem": "What is the value of 2³ + 4²?",
            "choices": ["24", "14", "32", "20"],
            "correctIndex": 0,
            "explanation": "2³ = 8. 4² = 16. 8 + 16 = 24.",
        },
        {
            "stem": "Evaluate 5m − 3 when m = 4.",
            "choices": ["17", "20", "7", "23"],
            "correctIndex": 0,
            "explanation": "5(4) − 3 = 20 − 3 = 17.",
        },
        {
            "stem": "Which property is shown: 3(x + 7) = 3x + 21?",
            "choices": ["Distributive", "Commutative", "Associative", "Identity"],
            "correctIndex": 0,
            "explanation": "Multiplying 3 by each term inside the parentheses is the distributive property.",
        },
        {
            "stem": "Are 2(x + 4) and 2x + 8 equivalent?",
            "choices": ["Yes", "No", "Only when x = 0", "Only when x = 4"],
            "correctIndex": 0,
            "explanation": "Distribute: 2(x + 4) = 2x + 8. They are equivalent for all values of x.",
        },
    ],
    "7": [  # Equations
        {
            "stem": "Solve: x + 7 = 15",
            "choices": ["x = 8", "x = 22", "x = 7", "x = 15"],
            "correctIndex": 0,
            "explanation": "Subtract 7 from both sides: x = 15 − 7 = 8.",
        },
        {
            "stem": "Solve: 3x = 24",
            "choices": ["x = 8", "x = 21", "x = 72", "x = 27"],
            "correctIndex": 0,
            "explanation": "Divide both sides by 3: x = 24 ÷ 3 = 8.",
        },
        {
            "stem": "Which inequality shows 'a number is at least 5'?",
            "choices": ["x ≥ 5", "x > 5", "x ≤ 5", "x = 5"],
            "correctIndex": 0,
            "explanation": "'At least 5' means 5 or more, which is x ≥ 5.",
        },
        {
            "stem": "Solve: n/4 = 9",
            "choices": ["n = 36", "n = 13", "n = 5", "n = 2.25"],
            "correctIndex": 0,
            "explanation": "Multiply both sides by 4: n = 9 × 4 = 36.",
        },
        {
            "stem": "In y = 2x + 1, which is the independent variable?",
            "choices": ["x", "y", "2", "1"],
            "correctIndex": 0,
            "explanation": "x is the independent variable — its value determines y.",
        },
        {
            "stem": "Solve: x − 12 = 30",
            "choices": ["x = 42", "x = 18", "x = 30", "x = 360"],
            "correctIndex": 0,
            "explanation": "Add 12 to both sides: x = 30 + 12 = 42.",
        },
        {
            "stem": "Write an equation: 'A number divided by 6 equals 7'",
            "choices": ["n/6 = 7", "6n = 7", "n − 6 = 7", "n + 6 = 7"],
            "correctIndex": 0,
            "explanation": "Divided by 6 is n/6. Equals 7 means = 7. So n/6 = 7.",
        },
    ],
    "8": [  # Statistics
        {
            "stem": "Find the mean of: 4, 7, 10, 3, 6",
            "choices": ["6", "7", "5", "30"],
            "correctIndex": 0,
            "explanation": "Sum = 4 + 7 + 10 + 3 + 6 = 30. Mean = 30 ÷ 5 = 6.",
        },
        {
            "stem": "Find the median of: 2, 8, 5, 1, 9",
            "choices": ["5", "2", "8", "9"],
            "correctIndex": 0,
            "explanation": "Ordered: 1, 2, 5, 8, 9. Middle value is 5.",
        },
        {
            "stem": "Which is a statistical question?",
            "choices": [
                "How old are students in our class?",
                "How old is the teacher?",
                "What is 5 + 3?",
                "What day is it?",
            ],
            "correctIndex": 0,
            "explanation": "Statistical questions expect variability in the answers — students have different ages.",
        },
        {
            "stem": "The mean of 5 numbers is 12. What is their sum?",
            "choices": ["60", "12", "5", "17"],
            "correctIndex": 0,
            "explanation": "Mean = Sum ÷ Count. 12 = Sum ÷ 5. Sum = 12 × 5 = 60.",
        },
        {
            "stem": "Find the range of: 14, 22, 8, 31, 17",
            "choices": ["23", "31", "8", "18"],
            "correctIndex": 0,
            "explanation": "Range = max − min = 31 − 8 = 23.",
        },
        {
            "stem": "A data set has MAD of 2.5. What does this tell you?",
            "choices": [
                "Values are about 2.5 from the mean on average",
                "The mean is 2.5",
                "The range is 2.5",
                "There are 2.5 data points",
            ],
            "correctIndex": 0,
            "explanation": "MAD (Mean Absolute Deviation) measures average distance from the mean.",
        },
        {
            "stem": "Which display shows the shape of data best?",
            "choices": ["Dot plot", "Table", "Tally chart", "Pie chart"],
            "correctIndex": 0,
            "explanation": "Dot plots show each data point and reveal the shape/distribution clearly.",
        },
    ],
    "9": [  # Coordinate Plane
        {
            "stem": "What are the coordinates of the origin?",
            "choices": ["(0, 0)", "(1, 1)", "(0, 1)", "(1, 0)"],
            "correctIndex": 0,
            "explanation": "The origin is where the x-axis and y-axis cross, at (0, 0).",
        },
        {
            "stem": "Point A is at (−3, 4). In which quadrant is it?",
            "choices": ["Quadrant II", "Quadrant I", "Quadrant III", "Quadrant IV"],
            "correctIndex": 0,
            "explanation": "Negative x, positive y = Quadrant II (top-left).",
        },
        {
            "stem": "What is |−8|?",
            "choices": ["8", "−8", "0", "−16"],
            "correctIndex": 0,
            "explanation": "Absolute value is distance from 0, always positive. |−8| = 8.",
        },
        {
            "stem": "What is the distance between (2, 5) and (2, −3)?",
            "choices": ["8", "2", "5", "3"],
            "correctIndex": 0,
            "explanation": "Same x-coordinate, so distance = |5 − (−3)| = |5 + 3| = 8.",
        },
        {
            "stem": "Order from least to greatest: −5, 3, −1, 0, 7",
            "choices": [
                "−5, −1, 0, 3, 7",
                "0, −1, 3, −5, 7",
                "7, 3, 0, −1, −5",
                "−1, −5, 0, 3, 7",
            ],
            "correctIndex": 0,
            "explanation": "On a number line, −5 is farthest left, 7 is farthest right.",
        },
        {
            "stem": "A rectangle has vertices at (1,1), (5,1), (5,4), (1,4). What is its perimeter?",
            "choices": ["14 units", "12 units", "20 units", "8 units"],
            "correctIndex": 0,
            "explanation": "Width = 5 − 1 = 4. Height = 4 − 1 = 3. Perimeter = 2(4 + 3) = 14.",
        },
        {
            "stem": "Which point is on the y-axis?",
            "choices": ["(0, 5)", "(5, 0)", "(3, 3)", "(−2, 4)"],
            "correctIndex": 0,
            "explanation": "Points on the y-axis have x-coordinate = 0.",
        },
    ],
    "10": [  # Volume & Surface Area
        {
            "stem": "What is the volume of a rectangular prism with l=5, w=3, h=4?",
            "choices": [
                "60 cubic units",
                "12 cubic units",
                "20 cubic units",
                "15 cubic units",
            ],
            "correctIndex": 0,
            "explanation": "V = l × w × h = 5 × 3 × 4 = 60 cubic units.",
        },
        {
            "stem": "A cube has side length 3 cm. What is its surface area?",
            "choices": ["54 sq cm", "27 sq cm", "18 sq cm", "9 sq cm"],
            "correctIndex": 0,
            "explanation": "SA = 6s² = 6 × 3² = 6 × 9 = 54 sq cm.",
        },
        {
            "stem": "A prism has volume 120 cm³ and base area 20 cm². What is its height?",
            "choices": ["6 cm", "100 cm", "2400 cm", "140 cm"],
            "correctIndex": 0,
            "explanation": "V = B × h. 120 = 20 × h. h = 120 ÷ 20 = 6 cm.",
        },
        {
            "stem": "How many faces does a rectangular prism have?",
            "choices": ["6", "4", "8", "12"],
            "correctIndex": 0,
            "explanation": "A rectangular prism has 6 faces: top, bottom, front, back, left, right.",
        },
        {
            "stem": "A pyramid has a square base with side 4 m and 4 triangular faces each with area 10 sq m. What is the total surface area?",
            "choices": ["56 sq m", "40 sq m", "16 sq m", "160 sq m"],
            "correctIndex": 0,
            "explanation": "Base = 4² = 16 sq m. Triangles = 4 × 10 = 40 sq m. Total = 16 + 40 = 56 sq m.",
        },
    ],
}

# Additional on-level activities (matching games for variety)
ON_LEVEL_MATCHING = {
    "1": {
        "pairs": [
            {"term": "LCM(3, 4)", "match": "12"},
            {"term": "GCF(12, 18)", "match": "6"},
            {"term": "LCM(5, 6)", "match": "30"},
            {"term": "GCF(20, 30)", "match": "10"},
            {"term": "LCM(8, 12)", "match": "24"},
            {"term": "GCF(16, 24)", "match": "8"},
        ],
        "label": "Match each problem to its answer.",
        "columns": 4,
    },
    "4": {
        "pairs": [
            {"term": "1/4", "match": "25%"},
            {"term": "0.5", "match": "50%"},
            {"term": "3/4", "match": "75%"},
            {"term": "0.1", "match": "10%"},
            {"term": "1/5", "match": "20%"},
            {"term": "0.8", "match": "80%"},
        ],
        "label": "Match each fraction or decimal to its percent.",
        "columns": 4,
    },
    "5": {
        "pairs": [
            {"term": "Triangle 8×6", "match": "24 sq units"},
            {"term": "Parallelogram 5×4", "match": "20 sq units"},
            {"term": "Rectangle 7×3", "match": "21 sq units"},
            {"term": "Triangle 10×8", "match": "40 sq units"},
            {"term": "Square side 6", "match": "36 sq units"},
            {"term": "Parallelogram 9×2", "match": "18 sq units"},
        ],
        "label": "Match each shape to its area.",
        "columns": 4,
    },
    "6": {
        "pairs": [
            {"term": "3x when x=4", "match": "12"},
            {"term": "x² when x=5", "match": "25"},
            {"term": "2x+1 when x=3", "match": "7"},
            {"term": "x/2 when x=10", "match": "5"},
            {"term": "4x−3 when x=2", "match": "5"},
            {"term": "x²+1 when x=3", "match": "10"},
        ],
        "label": "Match each expression to its value.",
        "columns": 4,
    },
    "8": {
        "pairs": [
            {"term": "Mean", "match": "Sum ÷ Count"},
            {"term": "Median", "match": "Middle value"},
            {"term": "Mode", "match": "Most frequent"},
            {"term": "Range", "match": "Max − Min"},
            {"term": "MAD", "match": "Avg distance from mean"},
            {"term": "Outlier", "match": "Far from other values"},
        ],
        "label": "Match each term to its definition.",
        "columns": 4,
    },
    "9": {
        "pairs": [
            {"term": "(3, 2)", "match": "Quadrant I"},
            {"term": "(−4, 5)", "match": "Quadrant II"},
            {"term": "(−2, −6)", "match": "Quadrant III"},
            {"term": "(7, −1)", "match": "Quadrant IV"},
            {"term": "(0, 3)", "match": "y-axis"},
            {"term": "(5, 0)", "match": "x-axis"},
        ],
        "label": "Match each point to its location.",
        "columns": 4,
    },
}

# Additional extending open-response problems
EXTENDING_OPEN = {
    "1": {
        "type": "open-response",
        "prompt": "Create your own GCF or LCM word problem using two numbers of your choice. Show the solution and explain your reasoning.",
        "sentenceFrame": "I chose the numbers ___ and ___ because ___. The GCF/LCM is ___ because ___.",
        "keywords": ["factor", "multiple", "common", "greatest", "least", "divide"],
        "minLength": 30,
    },
    "2": {
        "type": "open-response",
        "prompt": "Explain why dividing by a fraction is the same as multiplying by its reciprocal. Use an example.",
        "sentenceFrame": "Dividing by ___ is the same as multiplying by ___ because ___.",
        "keywords": ["reciprocal", "flip", "multiply", "divide", "inverse"],
        "minLength": 30,
    },
    "3": {
        "type": "open-response",
        "prompt": "A recipe needs 3 cups of flour for 12 cookies. Explain how to find how much flour you need for 20 cookies.",
        "sentenceFrame": "First I would find the unit rate: ___ cups per cookie. Then I would ___.",
        "keywords": ["unit rate", "proportion", "equivalent", "multiply", "ratio"],
        "minLength": 30,
    },
    "4": {
        "type": "open-response",
        "prompt": "A store has a 20% off sale, then takes an additional 10% off the sale price. Is this the same as 30% off? Explain.",
        "sentenceFrame": "This is NOT the same as 30% off because ___. The actual discount is ___.",
        "keywords": ["percent", "original", "sale price", "less than", "discount"],
        "minLength": 30,
    },
    "5": {
        "type": "open-response",
        "prompt": "Draw and describe a composite figure made of exactly 2 shapes. Calculate its total area and explain your method.",
        "sentenceFrame": "My figure is made of a ___ and a ___. The total area is ___ because ___.",
        "keywords": ["area", "add", "subtract", "base", "height", "composite"],
        "minLength": 30,
    },
    "6": {
        "type": "open-response",
        "prompt": "Write two different expressions that both equal 20 when x = 4. Prove they are not equivalent for all values.",
        "sentenceFrame": "Expression 1: ___. Expression 2: ___. When x = 4 both equal ___. When x = ___, they give different values: ___ and ___.",
        "keywords": ["equivalent", "evaluate", "substitute", "expression", "variable"],
        "minLength": 30,
    },
    "7": {
        "type": "open-response",
        "prompt": "Write a real-world situation that can be modeled by the equation 3x + 5 = 20. Solve it and explain what x represents.",
        "sentenceFrame": "Situation: ___. In this problem, x represents ___. Solving: ___ so x = ___.",
        "keywords": ["equation", "solve", "variable", "represents", "both sides"],
        "minLength": 30,
    },
    "8": {
        "type": "open-response",
        "prompt": "Two students measured their height every month for 5 months. Student A's MAD is 0.5 inches. Student B's MAD is 2.3 inches. What does this tell you?",
        "sentenceFrame": "Student A's measurements are more ___ because ___. Student B's measurements ___ because ___.",
        "keywords": [
            "consistent",
            "spread",
            "variability",
            "MAD",
            "mean",
            "average distance",
        ],
        "minLength": 30,
    },
    "9": {
        "type": "open-response",
        "prompt": "Explain how to find the distance between two points that share the same x-coordinate, like (3, −2) and (3, 5). What if they share the same y-coordinate instead?",
        "sentenceFrame": "When points share the same x-coordinate, the distance is ___. I find it by ___.",
        "keywords": [
            "absolute value",
            "subtract",
            "distance",
            "horizontal",
            "vertical",
            "coordinate",
        ],
        "minLength": 30,
    },
    "10": {
        "type": "open-response",
        "prompt": "A box needs to hold exactly 60 cubic inches. Give three different sets of whole-number dimensions that work. Which would use the least cardboard?",
        "sentenceFrame": "Option 1: ___ × ___ × ___. Option 2: ___ × ___ × ___. Option 3: ___ × ___ × ___. The ___ option uses the least cardboard because ___.",
        "keywords": [
            "volume",
            "surface area",
            "dimensions",
            "length",
            "width",
            "height",
        ],
        "minLength": 30,
    },
}

# Extra vocab terms by unit
EXTRA_VOCAB = {
    "1": [
        {
            "term": "Multiple",
            "definition": "The product of a number and any whole number",
            "visual": "Multiples of 5: 5, 10, 15, 20, 25...",
        },
        {
            "term": "Prime number",
            "definition": "A number with exactly two factors: 1 and itself",
            "visual": "2, 3, 5, 7, 11, 13...",
        },
    ],
    "4": [
        {
            "term": "Percent",
            "definition": "A ratio that compares a number to 100",
            "visual": "50% means 50 out of 100",
        },
        {
            "term": "Discount",
            "definition": "The amount subtracted from the original price",
            "visual": "$40 shirt at 25% off: discount = $10",
        },
    ],
    "5": [
        {
            "term": "Composite figure",
            "definition": "A shape made of two or more basic shapes combined",
            "visual": "An L-shape = two rectangles",
        },
        {
            "term": "Formula",
            "definition": "A mathematical rule written with symbols",
            "visual": "A = 1/2 × b × h",
        },
    ],
    "6": [
        {
            "term": "Coefficient",
            "definition": "The number multiplied by a variable",
            "visual": "In 3x, the coefficient is 3",
        },
        {
            "term": "Like terms",
            "definition": "Terms with the same variable raised to the same power",
            "visual": "4x and 2x are like terms",
        },
    ],
    "8": [
        {
            "term": "Data distribution",
            "definition": "The shape and spread of a data set",
            "visual": "Symmetric, skewed left, or skewed right",
        },
        {
            "term": "Variability",
            "definition": "How spread out the values in a data set are",
            "visual": "Low variability = values close together",
        },
    ],
    "9": [
        {
            "term": "Reflection",
            "definition": "A mirror image across an axis",
            "visual": "(3, 2) reflected over x-axis = (3, −2)",
        },
        {
            "term": "Integer",
            "definition": "Whole numbers and their opposites, including zero",
            "visual": "..., −3, −2, −1, 0, 1, 2, 3, ...",
        },
    ],
    "10": [
        {
            "term": "Net",
            "definition": "A 2D pattern that folds into a 3D solid",
            "visual": "A cross shape folds into a cube",
        },
        {
            "term": "Edge",
            "definition": "A line segment where two faces of a solid meet",
            "visual": "A cube has 12 edges",
        },
    ],
}


def enrich_lesson(config_path):
    with open(config_path) as f:
        config = json.load(f)

    unit = str(config.get("unit", "1"))
    lesson = config.get("lesson", 1)
    changed = False

    # Add approaching MC problem if less than 3
    approaching = config.get("practice", {}).get("approaching", [])
    if len(approaching) < 3 and unit in APPROACHING_MC:
        pool = APPROACHING_MC[unit]
        idx = (lesson - 1) % len(pool)
        new_prob = {"type": "multiple-choice", **pool[idx]}
        config["practice"]["approaching"].append(new_prob)
        changed = True

    # Add on-level activity if less than 2
    on_level = config.get("practice", {}).get("onLevel", [])
    if len(on_level) < 2 and unit in ON_LEVEL_MATCHING:
        matching = ON_LEVEL_MATCHING[unit]
        config["practice"]["onLevel"].append({"type": "matching-game", **matching})
        changed = True

    # Add extending activity if less than 2
    extending = config.get("practice", {}).get("extending", [])
    if len(extending) < 2 and unit in EXTENDING_OPEN:
        config["practice"]["extending"].append(EXTENDING_OPEN[unit])
        changed = True

    # Add extra vocab if less than 5
    vocab = config.get("vocabulary", [])
    existing_terms = {v["term"].lower() for v in vocab}
    if len(vocab) < 5 and unit in EXTRA_VOCAB:
        for extra in EXTRA_VOCAB[unit]:
            if (
                extra["term"].lower() not in existing_terms
                and len(config["vocabulary"]) < 6
            ):
                config["vocabulary"].append(extra)
                changed = True

    if changed:
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
            f.write("\n")
        return True
    return False


def main():
    total = 0
    enriched = 0
    for lesson_dir in sorted(LESSONS_DIR.iterdir()):
        if not lesson_dir.is_dir() or lesson_dir.name.startswith("_"):
            continue
        config_path = lesson_dir / "config.json"
        if not config_path.exists():
            continue
        total += 1
        if enrich_lesson(config_path):
            enriched += 1
            print(f"  Enriched: {lesson_dir.name}")
        else:
            print(f"  Skipped (already complete): {lesson_dir.name}")

    print(f"\nDone: {enriched}/{total} lessons enriched.")


if __name__ == "__main__":
    main()
