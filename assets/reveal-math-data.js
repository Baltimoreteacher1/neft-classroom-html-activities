(function () {
  var units = [
    { id: "u1", name: "Unit 1 - Number Sense" },
    { id: "u2", name: "Unit 2 - Fractions" },
    { id: "u3", name: "Unit 3 - Ratios & Proportional Relationships" },
    { id: "u4", name: "Unit 4 - Percents" },
    { id: "u5", name: "Unit 5 - Geometry: Area" },
    { id: "u6", name: "Unit 6 - Expressions" },
    { id: "u7", name: "Unit 7 - Equations" },
    { id: "u8", name: "Unit 8 - Statistics" },
    { id: "u9", name: "Unit 9 - Coordinate Plane" },
    { id: "u10", name: "Unit 10 - Volume & Surface Area" },
  ];

  var lessons = [
    { id: "1.1", title: "Prime Factorization", unit: "Unit 1 - Number Sense", standard: "6.NS.4" },
    { id: "1.2", title: "Greatest Common Factor", unit: "Unit 1 - Number Sense", standard: "6.NS.4" },
    { id: "1.3", title: "Least Common Multiple", unit: "Unit 1 - Number Sense", standard: "6.NS.4" },
    { id: "1.4", title: "Add & Subtract Decimals", unit: "Unit 1 - Number Sense", standard: "6.NS.3" },
    { id: "1.5", title: "Multiply Decimals", unit: "Unit 1 - Number Sense", standard: "6.NS.3" },
    { id: "1.6", title: "Divide Decimals", unit: "Unit 1 - Number Sense", standard: "6.NS.3" },
    { id: "1.7", title: "Divide Multi-Digit Numbers", unit: "Unit 1 - Number Sense", standard: "6.NS.2" },
    { id: "2.1", title: "Interpret Fractions as Division", unit: "Unit 2 - Fractions", standard: "6.NS.1" },
    { id: "2.2", title: "Multiply Fractions", unit: "Unit 2 - Fractions", standard: "6.NS.1" },
    { id: "2.3", title: "Divide Fractions", unit: "Unit 2 - Fractions", standard: "6.NS.1" },
    { id: "2.4", title: "Divide Mixed Numbers", unit: "Unit 2 - Fractions", standard: "6.NS.1" },
    { id: "2.5", title: "Solve Fraction Problems", unit: "Unit 2 - Fractions", standard: "6.NS.1" },
    { id: "3.1", title: "Understand Ratios", unit: "Unit 3 - Ratios & Proportional Relationships", standard: "6.RP.1" },
    { id: "3.2", title: "Ratio Tables", unit: "Unit 3 - Ratios & Proportional Relationships", standard: "6.RP.3a" },
    { id: "3.3", title: "Graph Ratios", unit: "Unit 3 - Ratios & Proportional Relationships", standard: "6.RP.3a" },
    { id: "3.4", title: "Equivalent Ratios", unit: "Unit 3 - Ratios & Proportional Relationships", standard: "6.RP.3" },
    { id: "3.5", title: "Compare Ratios", unit: "Unit 3 - Ratios & Proportional Relationships", standard: "6.RP.3a" },
    { id: "3.6", title: "Unit Rates", unit: "Unit 3 - Ratios & Proportional Relationships", standard: "6.RP.2" },
    { id: "3.7", title: "Convert Measurement Units", unit: "Unit 3 - Ratios & Proportional Relationships", standard: "6.RP.3d" },
    { id: "4.1", title: "Understand Percents", unit: "Unit 4 - Percents", standard: "6.RP.3c" },
    { id: "4.2", title: "Fractions, Decimals & Percents", unit: "Unit 4 - Percents", standard: "6.RP.3c" },
    { id: "4.3", title: "Percent of a Number", unit: "Unit 4 - Percents", standard: "6.RP.3c" },
    { id: "4.4", title: "Find the Whole", unit: "Unit 4 - Percents", standard: "6.RP.3c" },
    { id: "4.5", title: "Financial Literacy", unit: "Unit 4 - Percents", standard: "6.RP.3c" },
    { id: "4.6", title: "Simple Interest", unit: "Unit 4 - Percents", standard: "6.RP.3c" },
    { id: "4.7", title: "Solve Percent Problems", unit: "Unit 4 - Percents", standard: "6.RP.3c" },
    { id: "5.1", title: "Area of Parallelograms", unit: "Unit 5 - Geometry: Area", standard: "6.G.1" },
    { id: "5.2", title: "Area of Triangles", unit: "Unit 5 - Geometry: Area", standard: "6.G.1" },
    { id: "5.3", title: "Area of Trapezoids", unit: "Unit 5 - Geometry: Area", standard: "6.G.1" },
    { id: "5.4", title: "Area of Regular Polygons", unit: "Unit 5 - Geometry: Area", standard: "6.G.1" },
    { id: "5.5", title: "Area of Composite Figures", unit: "Unit 5 - Geometry: Area", standard: "6.G.1" },
    { id: "6.1", title: "Write Numerical Expressions", unit: "Unit 6 - Expressions", standard: "6.EE.1" },
    { id: "6.2", title: "Evaluate Expressions", unit: "Unit 6 - Expressions", standard: "6.EE.2c" },
    { id: "6.3", title: "Properties of Operations", unit: "Unit 6 - Expressions", standard: "6.EE.3" },
    { id: "6.4", title: "Equivalent Expressions", unit: "Unit 6 - Expressions", standard: "6.EE.4" },
    { id: "6.5", title: "Write Algebraic Expressions", unit: "Unit 6 - Expressions", standard: "6.EE.2a" },
    { id: "6.6", title: "Identify Parts of Expressions", unit: "Unit 6 - Expressions", standard: "6.EE.2b" },
    { id: "6.7", title: "Generate Equivalent Expressions", unit: "Unit 6 - Expressions", standard: "6.EE.3" },
    { id: "7.1", title: "Equations and Solutions", unit: "Unit 7 - Equations", standard: "6.EE.5" },
    { id: "7.2", title: "Solve One-Step Equations", unit: "Unit 7 - Equations", standard: "6.EE.7" },
    { id: "7.3", title: "Write & Solve Equations", unit: "Unit 7 - Equations", standard: "6.EE.7" },
    { id: "7.4", title: "Solve Inequalities", unit: "Unit 7 - Equations", standard: "6.EE.8" },
    { id: "7.5", title: "Graph Inequalities", unit: "Unit 7 - Equations", standard: "6.EE.8" },
    { id: "7.6", title: "Dependent & Independent Variables", unit: "Unit 7 - Equations", standard: "6.EE.9" },
    { id: "7.7", title: "Patterns & Relationships", unit: "Unit 7 - Equations", standard: "6.EE.9" },
    { id: "8.1", title: "Statistical Questions", unit: "Unit 8 - Statistics", standard: "6.SP.1" },
    { id: "8.2", title: "Mean, Median, and Mode", unit: "Unit 8 - Statistics", standard: "6.SP.3" },
    { id: "8.3", title: "Mean Absolute Deviation", unit: "Unit 8 - Statistics", standard: "6.SP.5c" },
    { id: "8.4", title: "Display Data", unit: "Unit 8 - Statistics", standard: "6.SP.4" },
    { id: "8.5", title: "Describe Data Distributions", unit: "Unit 8 - Statistics", standard: "6.SP.5" },
    { id: "8.6", title: "Summarize Data", unit: "Unit 8 - Statistics", standard: "6.SP.5d" },
    { id: "8.7", title: "Choose Appropriate Measures", unit: "Unit 8 - Statistics", standard: "6.SP.5d" },
    { id: "9.1", title: "Graph on the Coordinate Plane", unit: "Unit 9 - Coordinate Plane", standard: "6.NS.6" },
    { id: "9.2", title: "Ordered Pairs", unit: "Unit 9 - Coordinate Plane", standard: "6.NS.6b" },
    { id: "9.3", title: "Absolute Value", unit: "Unit 9 - Coordinate Plane", standard: "6.NS.7c" },
    { id: "9.4", title: "Compare & Order Integers", unit: "Unit 9 - Coordinate Plane", standard: "6.NS.7" },
    { id: "9.5", title: "Distance on the Coordinate Plane", unit: "Unit 9 - Coordinate Plane", standard: "6.NS.8" },
    { id: "9.6", title: "Polygons on the Coordinate Plane", unit: "Unit 9 - Coordinate Plane", standard: "6.G.3" },
    { id: "9.7", title: "Problem Solving with Coordinates", unit: "Unit 9 - Coordinate Plane", standard: "6.NS.8" },
    { id: "10.1", title: "Volume of Rectangular Prisms", unit: "Unit 10 - Volume & Surface Area", standard: "6.G.2" },
    { id: "10.2", title: "Volume with Fractions", unit: "Unit 10 - Volume & Surface Area", standard: "6.G.2" },
    { id: "10.3", title: "Surface Area of Prisms", unit: "Unit 10 - Volume & Surface Area", standard: "6.G.4" },
    { id: "10.4", title: "Surface Area of Pyramids", unit: "Unit 10 - Volume & Surface Area", standard: "6.G.4" },
    { id: "10.5", title: "Nets & Surface Area", unit: "Unit 10 - Volume & Surface Area", standard: "6.G.4" },
  ];

  var clusters = [
    {
      "id": "u1-factor-tools",
      "title": "Factor Tools",
      "unit": "Unit 1 - Number Sense",
      "lessonIds": [
        "1.1",
        "1.2",
        "1.3"
      ],
      "bigIdea": "Prime factors, GCF, and LCM are different tools for organizing whole-number relationships.",
      "studentWin": "Choose the right factor tool and justify the choice with a model.",
      "challenge": "A school supply room packs 24 pencils, 36 erasers, and 60 sticky notes into equal kits. Design the largest identical kits possible, then decide when LCM would be the better tool.",
      "modelKind": "factor",
      "scenario": "Supply-kit design team",
      "misconception": "Using LCM when the problem asks for the largest equal group.",
      "repairMove": "Ask whether the answer should be a shared group size or a future shared multiple.",
      "hint": "List prime factors first, then label whether you need common factors or common multiples.",
      "focus": "Prime factorization, GCF, and LCM decisions",
      "materials": "Factor tree, Venn diagram, decision note",
      "roles": [
        "Factor finder",
        "Tool chooser",
        "Evidence speaker"
      ],
      "defenseQuestions": [
        "How do you know GCF is the right tool?",
        "What would the LCM answer mean here?"
      ],
      "exitProduct": "One decision rule with an example and counterexample",
      "wrongSolution": "The smallest shared multiple is 360, so each kit gets 360 items.",
      "prompts": [
        "Build a factor tree for each number and circle the prime factors.",
        "Decide if the question wants the largest equal group (GCF) or a future shared point (LCM).",
        "Use the shared and non-shared factors in the Venn diagram as your evidence.",
        "Check: does your answer divide all the numbers (GCF) or is it a multiple of all of them (LCM)?"
      ],
      "cerItems": [
        {
          "id": "1.1-a",
          "lessonId": "1.1",
          "title": "Is 84 prime or composite?",
          "scenario": "A locker code uses the number 84. Mia says 84 is prime because it is even and large.",
          "question": "Is 84 prime or composite, and what is its complete prime factorization?",
          "evidence": "Build a factor tree: 84 = 2 x 42 = 2 x 2 x 21 = 2 x 2 x 3 x 7. The prime factorization is 2^2 x 3 x 7.",
          "reasoningTarget": "Explain that a composite number has more than two factors, so the multiple prime factors prove 84 is composite, not prime.",
          "level1": {
            "frame": "I claim that 84 is ______ because its prime factorization is ______, which has ______ prime factors.",
            "frameEs": "Afirmo que 84 es ______ porque su factorizacion prima es ______, que tiene ______ factores primos."
          },
          "level2": "Explain why every composite number has exactly one prime factorization, and predict how many factors 84 has in total.",
          "answerKey": "Composite; 84 = 2^2 x 3 x 7."
        },
        {
          "id": "1.2-a",
          "lessonId": "1.2",
          "title": "Largest identical gift bags",
          "scenario": "A volunteer has 24 granola bars and 36 juice boxes to pack into identical gift bags with nothing left over.",
          "question": "What is the greatest number of identical gift bags that can be made, and how many of each item go in one bag?",
          "evidence": "24 = 2^3 x 3 and 36 = 2^2 x 3^2. The common factors are 2^2 x 3 = 12, so GCF(24, 36) = 12.",
          "reasoningTarget": "Explain that the GCF is the right tool because we want the largest equal group that divides BOTH totals evenly.",
          "level1": {
            "frame": "I claim that ______ bags can be made because the GCF of 24 and 36 is ______, so each bag holds ______ granola bars and ______ juice boxes.",
            "frameEs": "Afirmo que se pueden hacer ______ bolsas porque el MCD de 24 y 36 es ______, asi cada bolsa tiene ______ barras y ______ jugos."
          },
          "level2": "If 60 stickers were added to the order, would the number of bags change? Justify using prime factorization.",
          "answerKey": "12 bags; each bag has 2 granola bars and 3 juice boxes."
        },
        {
          "id": "1.3-a",
          "lessonId": "1.3",
          "title": "When do the buses line up?",
          "scenario": "Bus A leaves every 8 minutes and Bus B leaves every 12 minutes. They both just left at 9:00.",
          "question": "At what time will both buses next leave at the same minute?",
          "evidence": "8 = 2^3 and 12 = 2^2 x 3. LCM = 2^3 x 3 = 24, so they align every 24 minutes; 9:00 + 24 min = 9:24.",
          "reasoningTarget": "Explain that LCM is the right tool because we need the first shared MULTIPLE (a future time both reach), not a shared group size.",
          "level1": {
            "frame": "I claim the buses next leave together at ______ because the LCM of 8 and 12 is ______ minutes.",
            "frameEs": "Afirmo que los autobuses saldran juntos a las ______ porque el MCM de 8 y 12 es ______ minutos."
          },
          "level2": "Explain in one sentence the difference between when you use GCF and when you use LCM, using these buses as your example.",
          "answerKey": "9:24 (LCM of 8 and 12 is 24 minutes)."
        }
      ]
    },
    {
      "id": "u1-decimal-ops",
      "title": "Decimal Operations",
      "unit": "Unit 1 - Number Sense",
      "lessonIds": [
        "1.4",
        "1.5",
        "1.6"
      ],
      "bigIdea": "Decimal operations must preserve place value and the meaning of the operation.",
      "studentWin": "Estimate first, compute accurately, and explain whether the answer is reasonable.",
      "challenge": "Plan snack bags using 12.6 pounds of trail mix split into 0.35-pound bags, then price the bags at $1.48 each.",
      "modelKind": "decimal",
      "scenario": "Concession stand planning",
      "misconception": "Lining up decimals for multiplication or division the same way as addition.",
      "repairMove": "Use an estimate and operation meaning before placing the decimal point.",
      "hint": "For addition and subtraction, align place values. For multiplication and division, track the size of the result.",
      "focus": "Decimal adding, subtracting, multiplying, and dividing",
      "materials": "Place-value chart, estimate line, calculation audit",
      "roles": [
        "Estimator",
        "Calculator",
        "Reasonableness checker"
      ],
      "defenseQuestions": [
        "What estimate did you expect?",
        "How does the operation change the size?"
      ],
      "exitProduct": "A corrected decimal solution with an estimate attached",
      "wrongSolution": "12.6 divided by 0.35 is 3.6 because the digits divide evenly.",
      "prompts": [
        "Estimate first by rounding each decimal to a friendly number.",
        "For adding or subtracting, line up the decimal points by place value.",
        "For multiplying or dividing, ask whether the answer should be bigger or smaller than you started.",
        "Compare your exact answer to your estimate to check reasonableness."
      ],
      "cerItems": [
        {
          "id": "1.4-a",
          "lessonId": "1.4",
          "title": "How much change?",
          "scenario": "A student pays for items costing $4.75 and $3.60 with a $10 bill.",
          "question": "How much change should the student receive, and is the cashier's answer of $2.65 correct?",
          "evidence": "4.75 + 3.60 = 8.35; 10.00 - 8.35 = 1.65. Estimate: 5 + 4 = 9, so change is about $1, near $1.65.",
          "reasoningTarget": "Explain that aligning decimal points by place value keeps dollars with dollars and cents with cents, proving the correct change is $1.65.",
          "level1": {
            "frame": "I claim the change is ______ because the total cost is ______ and ______ minus ______ equals ______.",
            "frameEs": "Afirmo que el cambio es ______ porque el costo total es ______ y ______ menos ______ es igual a ______."
          },
          "level2": "The cashier got $2.65. Identify the exact place-value mistake that produced that wrong answer.",
          "answerKey": "$1.65; the $2.65 answer is wrong."
        },
        {
          "id": "1.5-a",
          "lessonId": "1.5",
          "title": "Price of the trail mix bags",
          "scenario": "Each snack bag sells for $1.48 and the stand sells 7 bags during one game.",
          "question": "What is the total amount collected, and how does the number of decimal places confirm your placement?",
          "evidence": "1.48 x 7 = 10.36. The factor 1.48 has two decimal places, so the product has two decimal places: $10.36. Estimate: 1.5 x 7 = 10.5.",
          "reasoningTarget": "Explain that the total number of decimal places in the factors determines the decimal point in the product.",
          "level1": {
            "frame": "I claim the total is ______ because 1.48 times 7 is ______, and the product has ______ decimal places.",
            "frameEs": "Afirmo que el total es ______ porque 1.48 por 7 es ______, y el producto tiene ______ lugares decimales."
          },
          "level2": "If the price rose to $1.485, how many decimal places would the product have, and why might a store round it?",
          "answerKey": "$10.36 (two decimal places)."
        },
        {
          "id": "1.6-a",
          "lessonId": "1.6",
          "title": "How many 0.35-pound bags?",
          "scenario": "There are 12.6 pounds of trail mix, and each bag must hold exactly 0.35 pounds.",
          "question": "How many full 0.35-pound bags can be filled from 12.6 pounds?",
          "evidence": "12.6 / 0.35: multiply both by 100 to get 1260 / 35 = 36. Estimate: 12.6 / 0.35 is about 13 / 0.35, clearly more than 30.",
          "reasoningTarget": "Explain that dividing by a number less than 1 produces a quotient LARGER than the dividend, so 36 (not 3.6) is reasonable.",
          "level1": {
            "frame": "I claim ______ bags can be filled because 12.6 divided by 0.35 equals ______, and dividing by a number less than one makes the answer ______.",
            "frameEs": "Afirmo que se pueden llenar ______ bolsas porque 12.6 dividido entre 0.35 es ______, y dividir entre un numero menor que uno hace la respuesta ______."
          },
          "level2": "A classmate answered 3.6. Explain how an estimate alone proves that answer is unreasonable.",
          "answerKey": "36 bags (dividing by <1 makes the quotient larger)."
        }
      ]
    },
    {
      "id": "u1-long-division",
      "title": "Multi-Digit Division",
      "unit": "Unit 1 - Number Sense",
      "lessonIds": [
        "1.7"
      ],
      "bigIdea": "Long division is repeated place-value reasoning, not just a memorized layout.",
      "studentWin": "Explain each quotient digit using place value and check with multiplication.",
      "challenge": "A field trip has 1,248 tickets to pack evenly into 24 envelopes. Decide the number per envelope and verify the result.",
      "modelKind": "division",
      "scenario": "Field trip ticket team",
      "misconception": "Dropping a zero or skipping a place when a partial quotient is small.",
      "repairMove": "Name the place value of each quotient digit before subtracting.",
      "hint": "After each subtraction, ask what place you are dividing next.",
      "focus": "Whole-number division and checks",
      "materials": "Partial quotient chart, multiplication check",
      "roles": [
        "Quotient tracker",
        "Remainder monitor",
        "Verifier"
      ],
      "defenseQuestions": [
        "What does this quotient digit represent?",
        "How does multiplication prove the answer?"
      ],
      "exitProduct": "A long-division solution with a place-value narration",
      "wrongSolution": "1,248 divided by 24 is 52 with no need to check because 24 goes into 124 five times.",
      "prompts": [
        "Estimate first: about how many groups of the divisor fit into the dividend?",
        "Name the place value of each digit you write in the quotient.",
        "Multiply your quotient by the divisor to check it equals the dividend.",
        "Interpret any remainder in the context of the story."
      ],
      "cerItems": [
        {
          "id": "1.7-a",
          "lessonId": "1.7",
          "title": "Tickets per envelope",
          "scenario": "1,248 field-trip tickets are packed evenly into 24 envelopes.",
          "question": "How many tickets go in each envelope, and how can you prove your answer is exact?",
          "evidence": "1248 / 24 = 52. Check by multiplying: 52 x 24 = 1248. Estimate: 1200 / 24 = 50, so 52 is reasonable.",
          "reasoningTarget": "Explain that multiplying the quotient by the divisor must return the dividend, which verifies the division.",
          "level1": {
            "frame": "I claim each envelope holds ______ tickets because 1,248 divided by 24 is ______, and ______ times 24 equals ______.",
            "frameEs": "Afirmo que cada sobre tiene ______ boletos porque 1,248 entre 24 es ______, y ______ por 24 es igual a ______."
          },
          "level2": "If there were 1,250 tickets instead, how many would be left over, and how would you handle the leftovers fairly?",
          "answerKey": "52 tickets per envelope (52 x 24 = 1248)."
        },
        {
          "id": "1.7-b",
          "lessonId": "1.7",
          "title": "Reading the remainder",
          "scenario": "A teacher divides 250 markers equally among 8 tables.",
          "question": "How many markers does each table get, and what does the remainder mean?",
          "evidence": "250 / 8 = 31 remainder 2, because 31 x 8 = 248 and 250 - 248 = 2.",
          "reasoningTarget": "Explain what the remainder of 2 represents in the real situation (2 markers left over, not enough for another full set).",
          "level1": {
            "frame": "I claim each table gets ______ markers because 250 divided by 8 is ______ remainder ______, which means ______ markers are left over.",
            "frameEs": "Afirmo que cada mesa recibe ______ marcadores porque 250 entre 8 es ______ con residuo ______, lo que significa que sobran ______ marcadores."
          },
          "level2": "Should the answer be rounded up, rounded down, or left as a remainder here? Justify with the context.",
          "answerKey": "31 markers each, remainder 2."
        }
      ]
    },
    {
      "id": "u2-fraction-meaning",
      "title": "Fractions as Division",
      "unit": "Unit 2 - Fractions",
      "lessonIds": [
        "2.1"
      ],
      "bigIdea": "A fraction can represent a division situation, a quotient, or a share.",
      "studentWin": "Connect a story, division expression, fraction, and model.",
      "challenge": "Share 7 granola bars equally among 4 teams and represent the result three ways.",
      "modelKind": "fraction",
      "scenario": "Team snack sharing",
      "misconception": "Treating 7 divided by 4 and 4 divided by 7 as interchangeable.",
      "repairMove": "Identify the total being shared and the number of groups before writing the fraction.",
      "hint": "The dividend becomes the numerator because it is the amount being shared.",
      "focus": "Fractions as quotients",
      "materials": "Bar model, division sentence, explanation frame",
      "roles": [
        "Story reader",
        "Model maker",
        "Fraction explainer"
      ],
      "defenseQuestions": [
        "What is being shared?",
        "How many equal groups are there?"
      ],
      "exitProduct": "One story shown as division, a fraction, and a model",
      "wrongSolution": "7 bars shared by 4 teams means each team gets 4/7 of a bar.",
      "prompts": [
        "Find the total amount being shared and the number of equal groups.",
        "Write the division sentence: total divided by number of groups.",
        "The amount being shared becomes the numerator of the fraction.",
        "Draw a bar model so each group's share is visible."
      ],
      "cerItems": [
        {
          "id": "2.1-a",
          "lessonId": "2.1",
          "title": "Sharing 7 bars among 4 teams",
          "scenario": "Four teams share 7 granola bars equally. Leo writes the answer as 4/7.",
          "question": "How much does each team get, and is 4/7 correct?",
          "evidence": "7 bars / 4 teams = 7/4 = 1 3/4 bars per team. The total being shared (7) is the numerator.",
          "reasoningTarget": "Explain that the amount being shared becomes the numerator, so 7/4 (not 4/7) is correct because each team gets more than one bar.",
          "level1": {
            "frame": "I claim each team gets ______ bars because 7 divided by 4 is ______, and the amount shared, ______, is the numerator.",
            "frameEs": "Afirmo que cada equipo recibe ______ barras porque 7 entre 4 es ______, y la cantidad compartida, ______, es el numerador."
          },
          "level2": "Explain why 4/7 would mean a completely different situation. Describe a story that 4/7 actually fits.",
          "answerKey": "7/4 = 1 3/4 bars per team; 4/7 is incorrect."
        }
      ]
    },
    {
      "id": "u2-fraction-ops",
      "title": "Fraction Operations",
      "unit": "Unit 2 - Fractions",
      "lessonIds": [
        "2.2",
        "2.3",
        "2.4"
      ],
      "bigIdea": "Fraction multiplication and division answer different questions about parts, groups, and sizes.",
      "studentWin": "Represent the operation and explain why the answer is larger, smaller, or reasonable.",
      "challenge": "A recipe uses 2 1/2 cups of oats per batch. You have 7 1/2 cups. How many batches can you make, and what does the quotient mean?",
      "modelKind": "fraction",
      "scenario": "Recipe scaling lab",
      "misconception": "Multiplying or dividing numerators and denominators without interpreting the situation.",
      "repairMove": "Sort the problem as part-of, groups-of, or how-many-groups before calculating.",
      "hint": "Division asks how many groups fit or how large each group is.",
      "focus": "Multiplying fractions, dividing fractions, and mixed numbers",
      "materials": "Area model, number line, operation sort",
      "roles": [
        "Situation sorter",
        "Model builder",
        "Computation checker"
      ],
      "defenseQuestions": [
        "Why did you multiply or divide?",
        "What does the answer count?"
      ],
      "exitProduct": "A model-backed recipe solution",
      "wrongSolution": "7 1/2 divided by 2 1/2 is 7/2 because you divide the whole numbers and fractions separately.",
      "prompts": [
        "Decide if the situation is part-of (multiply) or how-many-groups (divide).",
        "Predict whether the answer should be larger or smaller than you started.",
        "Use an area model for multiplication or a number line for division.",
        "Check: does the size of your answer match your prediction?"
      ],
      "cerItems": [
        {
          "id": "2.2-a",
          "lessonId": "2.2",
          "title": "Two-thirds of a half pan",
          "scenario": "A pan of brownies is 1/2 full. A class eats 2/3 of what is in the pan.",
          "question": "What fraction of a whole pan did the class eat?",
          "evidence": "2/3 x 1/2 = 2/6 = 1/3. An area model splits the half into thirds and shades two of them.",
          "reasoningTarget": "Explain that multiplying two fractions less than 1 gives a smaller result, because you are taking a part of a part.",
          "level1": {
            "frame": "I claim the class ate ______ of a pan because 2/3 times 1/2 is ______, which is ______ than 1/2.",
            "frameEs": "Afirmo que la clase comio ______ de un molde porque 2/3 por 1/2 es ______, que es ______ que 1/2."
          },
          "level2": "Explain why multiplying by a fraction less than 1 always makes a number smaller, using this pan as evidence.",
          "answerKey": "1/3 of a whole pan."
        },
        {
          "id": "2.3-a",
          "lessonId": "2.3",
          "title": "How many 1/4-cup scoops?",
          "scenario": "A container holds 3 cups of rice. Each scoop is 1/4 cup.",
          "question": "How many full 1/4-cup scoops can be filled from 3 cups?",
          "evidence": "3 / (1/4) = 3 x 4 = 12, because dividing by 1/4 asks how many fourths fit in 3.",
          "reasoningTarget": "Explain that dividing by a fraction less than 1 gives a LARGER answer because many small groups fit into the whole.",
          "level1": {
            "frame": "I claim ______ scoops can be filled because 3 divided by 1/4 is ______, and dividing by a fraction less than one makes the answer ______.",
            "frameEs": "Afirmo que se pueden llenar ______ cucharadas porque 3 entre 1/4 es ______, y dividir entre una fraccion menor que uno hace la respuesta ______."
          },
          "level2": "Explain why 3 / (1/4) gives more than 3 but 3 x (1/4) gives less than 3, even though both use the same numbers.",
          "answerKey": "12 scoops."
        },
        {
          "id": "2.4-a",
          "lessonId": "2.4",
          "title": "Batches of oats",
          "scenario": "A recipe needs 2 1/2 cups of oats per batch and you have 7 1/2 cups.",
          "question": "How many full batches can you make, and what is wrong with the answer 7/2?",
          "evidence": "7 1/2 / 2 1/2 = 15/2 / 5/2 = 15/5 = 3. Three full batches use exactly 7 1/2 cups.",
          "reasoningTarget": "Explain that mixed numbers must be rewritten as improper fractions before dividing, which is why splitting the wholes and parts separately fails.",
          "level1": {
            "frame": "I claim you can make ______ batches because 7 1/2 divided by 2 1/2 is ______, using the improper fractions ______ and ______.",
            "frameEs": "Afirmo que puedes hacer ______ tandas porque 7 1/2 entre 2 1/2 es ______, usando las fracciones impropias ______ y ______."
          },
          "level2": "Show with numbers why dividing whole numbers and fractions separately gives the wrong answer here.",
          "answerKey": "3 batches."
        }
      ]
    },
    {
      "id": "u2-fraction-problems",
      "title": "Fraction Problem Solving",
      "unit": "Unit 2 - Fractions",
      "lessonIds": [
        "2.5"
      ],
      "bigIdea": "Fraction word problems become clearer when students identify the unknown and choose a model before computing.",
      "studentWin": "Choose a strategy, solve, and check the answer in context.",
      "challenge": "A garden plan uses 3/5 of the area for vegetables. Half of that vegetable space is tomatoes. What fraction of the whole garden is tomatoes?",
      "modelKind": "fraction",
      "scenario": "Garden design review",
      "misconception": "Adding fractions when the situation asks for a fraction of a fraction.",
      "repairMove": "Underline the word 'of' and sketch nested parts.",
      "hint": "Ask whether the second fraction is part of the whole or part of a part.",
      "focus": "Multi-step fraction reasoning",
      "materials": "Tape diagram, context check",
      "roles": [
        "Unknown finder",
        "Diagrammer",
        "Context checker"
      ],
      "defenseQuestions": [
        "What is the whole?",
        "Does your answer make sense compared with 3/5?"
      ],
      "exitProduct": "A solved fraction story with a context check",
      "wrongSolution": "3/5 plus 1/2 equals 11/10, so tomatoes take more than the whole garden.",
      "prompts": [
        "Underline what you are solving for and name the whole.",
        "Watch for the word 'of' that signals a fraction of a fraction.",
        "Draw a tape diagram showing the part inside the part.",
        "Check that your answer is smaller than the larger fraction in the story."
      ],
      "cerItems": [
        {
          "id": "2.5-a",
          "lessonId": "2.5",
          "title": "What fraction is tomatoes?",
          "scenario": "A garden uses 3/5 of its area for vegetables, and half of the vegetable space is tomatoes.",
          "question": "What fraction of the whole garden is planted with tomatoes?",
          "evidence": "Half OF 3/5 = 1/2 x 3/5 = 3/10 of the whole garden.",
          "reasoningTarget": "Explain that 'half of the vegetable space' means multiply, not add, because tomatoes are a part of a part.",
          "level1": {
            "frame": "I claim that ______ of the garden is tomatoes because half of 3/5 is ______, and the word 'of' means I should ______.",
            "frameEs": "Afirmo que ______ del jardin son tomates porque la mitad de 3/5 es ______, y la palabra 'de' significa que debo ______."
          },
          "level2": "A classmate added 3/5 + 1/2 and got more than a whole garden. Explain why addition cannot be correct here.",
          "answerKey": "3/10 of the garden."
        }
      ]
    },
    {
      "id": "u3-ratio-foundations",
      "title": "Ratio Foundations",
      "unit": "Unit 3 - Ratios & Proportional Relationships",
      "lessonIds": [
        "3.1",
        "3.2",
        "3.3",
        "3.4"
      ],
      "bigIdea": "Equivalent ratios can be represented with language, tables, graphs, and scaling.",
      "studentWin": "Move between a ratio, table, graph, and equivalent ratio explanation.",
      "challenge": "Design a sports drink mix that uses 3 scoops of powder for every 8 cups of water, then scale it for different teams.",
      "modelKind": "ratio",
      "scenario": "Hydration mix design",
      "misconception": "Adding the same amount to both terms instead of multiplying by the same factor.",
      "repairMove": "Use scale factors and check whether the graph stays on one straight line through the origin.",
      "hint": "Equivalent ratios keep the same multiplicative relationship.",
      "focus": "Ratios, ratio tables, graphs, and equivalent ratios",
      "materials": "Ratio table, graph grid, scale-factor labels",
      "roles": [
        "Table builder",
        "Graph checker",
        "Scale-factor speaker"
      ],
      "defenseQuestions": [
        "What scale factor did you use?",
        "How does the graph show equivalence?"
      ],
      "exitProduct": "One scaled ratio table with a graph and explanation",
      "wrongSolution": "3:8 is equivalent to 6:11 because both terms increased by 3.",
      "prompts": [
        "Write the ratio in order and label what each number counts.",
        "Multiply BOTH terms by the same scale factor to find equivalent ratios.",
        "Check a ratio table: each row should use the same multiplier.",
        "On a graph, equivalent ratios fall on one straight line through the origin."
      ],
      "cerItems": [
        {
          "id": "3.1-a",
          "lessonId": "3.1",
          "title": "Reading a ratio in order",
          "scenario": "A fruit punch uses 2 cups of juice for every 5 cups of soda. Ana writes the ratio of juice to soda as 5:2.",
          "question": "What is the correct ratio of juice to soda, and why does order matter?",
          "evidence": "Juice is 2 and soda is 5, so juice to soda is 2:5, not 5:2.",
          "reasoningTarget": "Explain that a ratio must list quantities in the order named, so 2:5 and 5:2 describe different mixes.",
          "level1": {
            "frame": "I claim the ratio of juice to soda is ______ because there are ______ cups of juice for every ______ cups of soda.",
            "frameEs": "Afirmo que la razon de jugo a soda es ______ porque hay ______ tazas de jugo por cada ______ tazas de soda."
          },
          "level2": "Describe how the punch would taste differently if someone used the reversed ratio 5:2.",
          "answerKey": "2:5 (juice to soda)."
        },
        {
          "id": "3.4-a",
          "lessonId": "3.4",
          "title": "Is 6:11 equivalent to 3:8?",
          "scenario": "A drink mix is 3 scoops of powder to 8 cups of water. Sam claims 6:11 is an equivalent mix.",
          "question": "Is 6:11 equivalent to 3:8? What ratio actually doubles the recipe?",
          "evidence": "Doubling means multiplying BOTH terms by 2: 3x2 : 8x2 = 6:16. Sam only added 3 to each term, which is not equivalent.",
          "reasoningTarget": "Explain that equivalent ratios come from multiplying both terms by the same factor, not adding the same amount.",
          "level1": {
            "frame": "I claim 6:11 is ______ equivalent to 3:8 because doubling gives ______, and equivalent ratios come from ______, not adding.",
            "frameEs": "Afirmo que 6:11 ______ es equivalente a 3:8 porque al duplicar se obtiene ______, y las razones equivalentes vienen de ______, no de sumar."
          },
          "level2": "Build a 3-row ratio table for 3:8 and explain how the table proves the same scale factor is used each time.",
          "answerKey": "Not equivalent; doubling gives 6:16."
        },
        {
          "id": "3.2-a",
          "lessonId": "3.2",
          "title": "Filling the ratio table",
          "scenario": "A ratio table shows 3 scoops : 8 cups in the first row. The next row must use 12 scoops.",
          "question": "How many cups of water pair with 12 scoops, and what scale factor did you use?",
          "evidence": "12 / 3 = 4, so multiply 8 by 4: 8 x 4 = 32 cups. Scale factor is 4.",
          "reasoningTarget": "Explain that the same multiplier applied to both terms keeps the ratio equivalent.",
          "level1": {
            "frame": "I claim 12 scoops needs ______ cups because the scale factor is ______, and 8 times ______ equals ______.",
            "frameEs": "Afirmo que 12 cucharadas necesitan ______ tazas porque el factor de escala es ______, y 8 por ______ es igual a ______."
          },
          "level2": "On a graph, where would the point (12, 32) fall relative to (3, 8)? Explain what a straight line through the origin shows.",
          "answerKey": "32 cups (scale factor 4)."
        },
        {
          "id": "3.3-a",
          "lessonId": "3.3",
          "title": "Does the cocoa recipe graph make a straight line?",
          "scenario": "A hot-cocoa recipe uses 2 scoops of mix for every 8 ounces of water. Leo plots (scoops, ounces) from a ratio table: (1,4),(2,8),(3,12).",
          "question": "When you graph the equivalent ratios from the table, what pattern do the points form, and what does it mean?",
          "evidence": "The ratio 2:8 simplifies to 1:4, so the table is (1,4),(2,8),(3,12). Plotted, the points lie on a straight line that passes through the origin (0,0).",
          "claim": "I claim the points form a straight line through the origin because every pair keeps the ratio 1 scoop to 4 ounces.",
          "reasoningTarget": "Explain that equivalent ratios graph as collinear points through the origin because each point is the same multiplicative scaling of 1:4.",
          "level1": {
            "frame": "I claim the graphed points form a ______ that passes through ______ because every pair keeps the ratio ______.",
            "frameEs": "Afirmo que los puntos graficados forman una ______ que pasa por ______ porque cada par mantiene la razon ______."
          },
          "level2": "Predict the ounces of water for 5 scoops without extending the table, and explain how the graph lets you check it.",
          "answerKey": "A straight line through the origin (0,0); the constant ratio is 1 scoop : 4 ounces."
        }
      ]
    },
    {
      "id": "u3-rates-comparison",
      "title": "Rates and Comparisons",
      "unit": "Unit 3 - Ratios & Proportional Relationships",
      "lessonIds": [
        "3.5",
        "3.6"
      ],
      "bigIdea": "Unit rates make different ratios easier to compare.",
      "studentWin": "Find a unit rate and use it to make a defensible comparison.",
      "challenge": "Compare two streaming plans: $18 for 12 movies or $25 for 20 movies. Which has the better price per movie?",
      "modelKind": "ratio",
      "scenario": "Subscription comparison team",
      "misconception": "Comparing only one number, such as the total cost, instead of the rate.",
      "repairMove": "Convert each option to the same 'per 1' unit before deciding.",
      "hint": "A unit rate answers 'how much for one?' or 'how many in one?'",
      "focus": "Comparing ratios and unit rates",
      "materials": "Rate table, per-one labels",
      "roles": [
        "Unit-rate finder",
        "Comparison judge",
        "Evidence writer"
      ],
      "defenseQuestions": [
        "What does one unit represent?",
        "Why is your comparison fair?"
      ],
      "exitProduct": "A recommendation supported by two unit rates",
      "wrongSolution": "$18 is cheaper, so the 12-movie plan is always better.",
      "prompts": [
        "Find the unit rate for each option: cost per one item.",
        "Make sure both rates use the same 'per 1' unit before comparing.",
        "Lower cost per unit means the better deal.",
        "State your recommendation using both unit rates as evidence."
      ],
      "cerItems": [
        {
          "id": "3.6-a",
          "lessonId": "3.6",
          "title": "Better price per movie",
          "scenario": "Plan A is $18 for 12 movies. Plan B is $25 for 20 movies.",
          "question": "Which plan has the lower price per movie?",
          "evidence": "Plan A: 18/12 = $1.50 per movie. Plan B: 25/20 = $1.25 per movie. $1.25 < $1.50.",
          "reasoningTarget": "Explain that comparing per-movie unit rates is fair because it puts both plans on the same 'per 1' basis, unlike comparing totals.",
          "level1": {
            "frame": "I claim Plan ______ is the better deal because it costs ______ per movie, which is less than ______ per movie.",
            "frameEs": "Afirmo que el Plan ______ es la mejor oferta porque cuesta ______ por pelicula, menos que ______ por pelicula."
          },
          "level2": "Explain why choosing Plan A just because $18 is the smaller total could lead to a worse decision.",
          "answerKey": "Plan B ($1.25 per movie vs $1.50)."
        },
        {
          "id": "3.5-a",
          "lessonId": "3.5",
          "title": "Faster reader",
          "scenario": "Jordan reads 90 pages in 3 hours. Taylor reads 120 pages in 5 hours.",
          "question": "Who reads at the faster rate in pages per hour?",
          "evidence": "Jordan: 90/3 = 30 pages/hour. Taylor: 120/5 = 24 pages/hour. 30 > 24.",
          "reasoningTarget": "Explain that the larger unit rate (pages per hour) identifies the faster reader fairly.",
          "level1": {
            "frame": "I claim ______ reads faster because they read ______ pages per hour, more than ______ pages per hour.",
            "frameEs": "Afirmo que ______ lee mas rapido porque lee ______ paginas por hora, mas que ______ paginas por hora."
          },
          "level2": "Taylor read more total pages. Explain why total pages does not decide who is the faster reader.",
          "answerKey": "Jordan (30 pages/hour vs 24)."
        }
      ]
    },
    {
      "id": "u3-measurement",
      "title": "Measurement Conversions",
      "unit": "Unit 3 - Ratios & Proportional Relationships",
      "lessonIds": [
        "3.7"
      ],
      "bigIdea": "Measurement conversions are ratio relationships between units.",
      "studentWin": "Use a conversion factor and track units until the answer is in the target unit.",
      "challenge": "Convert a 2.5-mile charity walk into feet and yards for a route sign.",
      "modelKind": "ratio",
      "scenario": "Route sign crew",
      "misconception": "Multiplying or dividing by a conversion number without checking whether the unit should get larger or smaller.",
      "repairMove": "Write the unit relationship and cancel or track units before calculating.",
      "hint": "Ask whether the new unit is smaller or larger than the original unit.",
      "focus": "Measurement conversion",
      "materials": "Conversion factor cards, unit tracker",
      "roles": [
        "Unit tracker",
        "Calculator",
        "Reasonableness checker"
      ],
      "defenseQuestions": [
        "Why did the number get larger or smaller?",
        "Where did the units go?"
      ],
      "exitProduct": "A conversion chain with units shown",
      "wrongSolution": "2.5 miles divided by 5,280 equals 0.00047 feet.",
      "prompts": [
        "Write the conversion relationship (for example, 1 mile = 5,280 feet).",
        "Decide if the new unit is smaller (number gets bigger) or larger (number gets smaller).",
        "Multiply or divide so the original unit cancels out.",
        "Check that your answer is labeled in the target unit."
      ],
      "cerItems": [
        {
          "id": "3.7-a",
          "lessonId": "3.7",
          "title": "Miles to feet for the sign",
          "scenario": "A charity walk is 2.5 miles. The route sign must show the distance in feet (1 mile = 5,280 feet).",
          "question": "How many feet is the 2.5-mile walk, and should the number be larger or smaller than 2.5?",
          "evidence": "2.5 x 5,280 = 13,200 feet. Feet are smaller than miles, so it takes MORE of them.",
          "reasoningTarget": "Explain that converting to a smaller unit produces a larger number, so multiplying (not dividing) is correct.",
          "level1": {
            "frame": "I claim 2.5 miles equals ______ feet because I multiplied by ______, and since feet are smaller the number gets ______.",
            "frameEs": "Afirmo que 2.5 millas son ______ pies porque multipliqué por ______, y como los pies son mas pequenos el numero se hace ______."
          },
          "level2": "A classmate divided and got 0.00047 feet. Explain how a quick reasonableness check exposes that error.",
          "answerKey": "13,200 feet."
        }
      ]
    },
    {
      "id": "u4-percent-foundations",
      "title": "Percent Foundations",
      "unit": "Unit 4 - Percents",
      "lessonIds": [
        "4.1",
        "4.2"
      ],
      "bigIdea": "Percents, fractions, and decimals are connected ways to describe parts of 100.",
      "studentWin": "Convert among percent, fraction, and decimal forms and explain the meaning.",
      "challenge": "A survey shows 35% of students chose robotics. Show that result as a fraction, decimal, and visual model.",
      "modelKind": "percent",
      "scenario": "Student interest survey",
      "misconception": "Moving the decimal in the wrong direction or treating percent as a whole number.",
      "repairMove": "Anchor every percent to 'out of 100' before converting.",
      "hint": "Percent means per 100.",
      "focus": "Percent meaning and conversions",
      "materials": "Hundred grid, conversion triangle",
      "roles": [
        "Model maker",
        "Converter",
        "Meaning checker"
      ],
      "defenseQuestions": [
        "What is the whole?",
        "How does each form show the same amount?"
      ],
      "exitProduct": "A three-form percent display",
      "wrongSolution": "35% equals 35.0 because percent is already a decimal.",
      "prompts": [
        "Read percent as 'out of 100' before doing anything else.",
        "To make a decimal, divide the percent by 100 (move two places left).",
        "To make a fraction, write the percent over 100 and simplify.",
        "Shade a hundred grid to prove all three forms show the same amount."
      ],
      "cerItems": [
        {
          "id": "4.2-a",
          "lessonId": "4.2",
          "title": "Three forms of 35%",
          "scenario": "A survey reports 35% of students chose robotics. Dev writes 35% as the decimal 35.0.",
          "question": "What are the correct decimal and simplified fraction for 35%, and what is wrong with 35.0?",
          "evidence": "35% = 35/100 = 7/20 = 0.35. On a hundred grid, 35 of 100 squares are shaded.",
          "reasoningTarget": "Explain that percent means per 100, so 35% is 0.35, not 35.0, because you divide by 100.",
          "level1": {
            "frame": "I claim 35% equals the decimal ______ and the fraction ______ because percent means out of ______.",
            "frameEs": "Afirmo que 35% es el decimal ______ y la fraccion ______ porque por ciento significa de cada ______."
          },
          "level2": "Explain why 35.0 would mean 3,500% and how the hundred grid makes that obvious.",
          "answerKey": "0.35 and 7/20."
        },
        {
          "id": "4.1-a",
          "lessonId": "4.1",
          "title": "Which is the bigger part?",
          "scenario": "In Class A, 0.4 of students walk to school. In Class B, 45% of students walk.",
          "question": "Which class has the larger fraction of walkers?",
          "evidence": "0.4 = 40% and Class B is 45%. 45% > 40%.",
          "reasoningTarget": "Explain that converting both to the same form (percent) lets you compare fairly.",
          "level1": {
            "frame": "I claim Class ______ has more walkers because 0.4 equals ______ percent, which is less than ______ percent.",
            "frameEs": "Afirmo que la Clase ______ tiene mas caminantes porque 0.4 es ______ por ciento, menos que ______ por ciento."
          },
          "level2": "Explain why you cannot just compare 0.4 and 45 directly without converting first.",
          "answerKey": "Class B (45% > 40%)."
        }
      ]
    },
    {
      "id": "u4-percent-problems",
      "title": "Percent Problems",
      "unit": "Unit 4 - Percents",
      "lessonIds": [
        "4.3",
        "4.4",
        "4.7"
      ],
      "bigIdea": "Percent problems depend on identifying the part, percent, and whole.",
      "studentWin": "Set up and solve percent-of, find-the-whole, and mixed percent problems.",
      "challenge": "A club sold 45 tickets, which is 75% of its goal. Find the goal, then predict 120% of the goal.",
      "modelKind": "percent",
      "scenario": "Ticket-sales tracker",
      "misconception": "Using the visible number as the whole every time.",
      "repairMove": "Label part, percent, and whole before writing the equation or tape diagram.",
      "hint": "If the problem says 'is 75% of,' the number before 'is' is the part.",
      "focus": "Percent of a number, finding the whole, and mixed percent problems",
      "materials": "Percent tape diagram, part-percent-whole table",
      "roles": [
        "Labeler",
        "Solver",
        "Context checker"
      ],
      "defenseQuestions": [
        "Which number is the whole?",
        "How do you know your answer is reasonable?"
      ],
      "exitProduct": "A percent problem labeled with part, percent, and whole",
      "wrongSolution": "45 tickets is the whole because it is the only number of tickets given.",
      "prompts": [
        "Label the part, the percent, and the whole before computing.",
        "The whole is the amount that represents 100%.",
        "Use a tape diagram split into equal percent sections.",
        "Check: is your answer reasonable compared to 100% of the whole?"
      ],
      "cerItems": [
        {
          "id": "4.3-a",
          "lessonId": "4.3",
          "title": "Percent of a number",
          "scenario": "A jacket costs $80 and is 25% off.",
          "question": "How much money is taken off the price?",
          "evidence": "25% of 80 = 0.25 x 80 = $20. A tape diagram shows 80 split into four equal $20 parts.",
          "reasoningTarget": "Explain that 'percent of a number' means multiply the decimal form of the percent by the whole.",
          "level1": {
            "frame": "I claim the discount is ______ because 25% of 80 is ______, found by multiplying ______ by 80.",
            "frameEs": "Afirmo que el descuento es ______ porque 25% de 80 es ______, multiplicando ______ por 80."
          },
          "level2": "After the discount, what is the new price, and what percent of the original does it represent?",
          "answerKey": "$20 off."
        },
        {
          "id": "4.4-a",
          "lessonId": "4.4",
          "title": "Find the goal",
          "scenario": "A club sold 45 tickets, and that is 75% of its goal. Pat says the goal is 45.",
          "question": "What is the club's full ticket goal (100%)?",
          "evidence": "45 is 75% of the goal. 45 / 0.75 = 60, so the goal is 60 tickets. 75% of 60 = 45 checks out.",
          "reasoningTarget": "Explain that 45 is the PART (75%), not the whole, so the goal must be larger than 45.",
          "level1": {
            "frame": "I claim the goal is ______ tickets because 45 is 75% of the whole, and 45 divided by 0.75 is ______.",
            "frameEs": "Afirmo que la meta es ______ boletos porque 45 es el 75% del total, y 45 entre 0.75 es ______."
          },
          "level2": "Predict how many tickets would be 120% of the goal, and explain what going over 100% means here.",
          "answerKey": "60 tickets (120% would be 72)."
        },
        {
          "id": "4.7-a",
          "lessonId": "4.7",
          "title": "Jacket on sale, then taxed",
          "scenario": "An $80 jacket is marked 25% off. After the discount, an 8% sales tax is added.",
          "question": "What is the final price of the jacket after the discount and the tax?",
          "evidence": "Discount: 25% of $80 = $20, so sale price = $80 - $20 = $60. Tax: 8% of $60 = $4.80, so final price = $60 + $4.80 = $64.80.",
          "claim": "I claim the final price is $64.80 because the discount is taken first and then the tax is applied to the lower sale price.",
          "reasoningTarget": "Explain that tax must be applied to the discounted price, not the original, because you pay tax only on what you are actually charged.",
          "level1": {
            "frame": "I claim the final price is ______ because the sale price is ______ and then ______% tax adds ______.",
            "frameEs": "Afirmo que el precio final es ______ porque el precio de oferta es ______ y luego el ______% de impuesto agrega ______."
          },
          "level2": "Would the final price change if the tax were applied before the discount? Justify your answer with the numbers.",
          "answerKey": "$64.80 (sale price $60, plus 8% tax of $4.80)."
        }
      ]
    },
    {
      "id": "u4-finance-interest",
      "title": "Financial Literacy and Interest",
      "unit": "Unit 4 - Percents",
      "lessonIds": [
        "4.5",
        "4.6"
      ],
      "bigIdea": "Financial decisions use percents to describe change, cost, savings, and interest.",
      "studentWin": "Calculate percent-based money situations and explain the financial meaning.",
      "challenge": "Compare saving $240 at 5% simple interest with buying a $240 item at a 15% discount plus tax.",
      "modelKind": "finance",
      "scenario": "Budget advice desk",
      "misconception": "Applying the percent to the wrong starting amount.",
      "repairMove": "Name the base amount for every percent calculation.",
      "hint": "Simple interest uses principal times rate times time.",
      "focus": "Discounts, tax, tips, and simple interest",
      "materials": "Money table, base-amount labels",
      "roles": [
        "Base finder",
        "Money calculator",
        "Advice writer"
      ],
      "defenseQuestions": [
        "What amount did the percent act on?",
        "What does the final amount mean?"
      ],
      "exitProduct": "A financial recommendation with calculations",
      "wrongSolution": "A 15% discount and 6% tax combine to make a 21% discount.",
      "prompts": [
        "Name the base amount that each percent acts on.",
        "For interest, use principal x rate x time (I = prt).",
        "Apply discount to the price first, then tax to the discounted price.",
        "State what the final dollar amount means for the buyer or saver."
      ],
      "cerItems": [
        {
          "id": "4.6-a",
          "lessonId": "4.6",
          "title": "Simple interest earned",
          "scenario": "A student saves $240 in an account paying 5% simple interest per year for 2 years.",
          "question": "How much interest is earned after 2 years, and what is the total balance?",
          "evidence": "I = prt = 240 x 0.05 x 2 = $24. Total = 240 + 24 = $264.",
          "reasoningTarget": "Explain that simple interest is calculated on the original principal each year, using I = prt.",
          "level1": {
            "frame": "I claim the interest is ______ because principal 240 times rate 0.05 times time ______ equals ______, so the total is ______.",
            "frameEs": "Afirmo que el interes es ______ porque el capital 240 por la tasa 0.05 por el tiempo ______ es ______, asi el total es ______."
          },
          "level2": "Explain how the interest would differ if the time were 3 years, and describe the pattern you notice.",
          "answerKey": "$24 interest; $264 total."
        },
        {
          "id": "4.5-a",
          "lessonId": "4.5",
          "title": "Discount then tax",
          "scenario": "A $240 item has a 15% discount, then 6% tax is added. Robin claims that equals a 21% discount.",
          "question": "What is the final price after the discount and tax, and is Robin right?",
          "evidence": "Discount: 240 x 0.15 = 36, so price = 204. Tax: 204 x 0.06 = 12.24, so final = $216.24. Percents act on different bases, so they do not simply combine.",
          "reasoningTarget": "Explain that the discount and tax act on different base amounts, so you cannot subtract the percents directly.",
          "level1": {
            "frame": "I claim the final price is ______ because the discounted price is ______ and adding 6% tax gives ______; Robin is ______.",
            "frameEs": "Afirmo que el precio final es ______ porque el precio con descuento es ______ y al sumar 6% de impuesto da ______; Robin esta ______."
          },
          "level2": "Explain why a 15% discount and 6% tax do not cancel to a 9% discount, using the two base amounts.",
          "answerKey": "$216.24; Robin is incorrect."
        }
      ]
    },
    {
      "id": "u5-area-basics",
      "title": "Area Building Blocks",
      "unit": "Unit 5 - Geometry: Area",
      "lessonIds": [
        "5.1",
        "5.2",
        "5.3"
      ],
      "bigIdea": "Area formulas for parallelograms, triangles, and trapezoids come from decomposing and rearranging shapes.",
      "studentWin": "Use a formula with a model that explains why the formula works.",
      "challenge": "Choose materials for three garden beds shaped like a parallelogram, triangle, and trapezoid.",
      "modelKind": "area",
      "scenario": "Garden bed estimator",
      "misconception": "Multiplying every side length instead of identifying base and height.",
      "repairMove": "Mark the perpendicular height before using a formula.",
      "hint": "Base and height must meet at a right angle.",
      "focus": "Area of parallelograms, triangles, and trapezoids",
      "materials": "Shape cards, formula match, height marker",
      "roles": [
        "Height finder",
        "Formula chooser",
        "Unit checker"
      ],
      "defenseQuestions": [
        "Where is the perpendicular height?",
        "How does the formula connect to the model?"
      ],
      "exitProduct": "A labeled area estimate for three shapes",
      "wrongSolution": "A triangle with sides 8, 6, and 5 has area 8 x 6 x 5.",
      "prompts": [
        "Find the perpendicular height, which meets the base at a right angle.",
        "Match the shape to its area formula before plugging in numbers.",
        "For triangles, remember to multiply by one half.",
        "Label your answer in square units."
      ],
      "cerItems": [
        {
          "id": "5.1-a",
          "lessonId": "5.1",
          "title": "Area of the parallelogram bed",
          "scenario": "A parallelogram garden bed has a base of 9 ft and a perpendicular height of 4 ft. A slanted side measures 5 ft.",
          "question": "What is the area of the bed, and which measurement should NOT be used?",
          "evidence": "Area = base x height = 9 x 4 = 36 square feet. The 5 ft slanted side is not the height.",
          "reasoningTarget": "Explain that area uses the perpendicular height, not the slanted side length.",
          "level1": {
            "frame": "I claim the area is ______ square feet because base ______ times height ______ equals ______; the ______ ft side is not used.",
            "frameEs": "Afirmo que el area es ______ pies cuadrados porque base ______ por altura ______ es ______; el lado de ______ pies no se usa."
          },
          "level2": "Explain how a parallelogram can be cut and rearranged into a rectangle to show why A = base x height.",
          "answerKey": "36 square feet (slant side 5 ft is unused)."
        },
        {
          "id": "5.2-a",
          "lessonId": "5.2",
          "title": "Triangle bed area",
          "scenario": "A triangular bed has a base of 8 ft and a height of 6 ft. Kim multiplies 8 x 6 x 5 using all three side lengths.",
          "question": "What is the correct area of the triangle?",
          "evidence": "Area = 1/2 x base x height = 1/2 x 8 x 6 = 24 square feet.",
          "reasoningTarget": "Explain that a triangle is half of a parallelogram, so the formula includes the factor of one half.",
          "level1": {
            "frame": "I claim the area is ______ square feet because one half times base ______ times height ______ equals ______.",
            "frameEs": "Afirmo que el area es ______ pies cuadrados porque un medio por base ______ por altura ______ es ______."
          },
          "level2": "Explain why multiplying all three side lengths can never give an area, using units in your reasoning.",
          "answerKey": "24 square feet."
        },
        {
          "id": "5.3-a",
          "lessonId": "5.3",
          "title": "Trapezoid bed area",
          "scenario": "A trapezoid bed has parallel sides of 6 ft and 10 ft and a height of 4 ft.",
          "question": "What is the area of the trapezoid bed?",
          "evidence": "Area = 1/2 x (b1 + b2) x h = 1/2 x (6 + 10) x 4 = 1/2 x 16 x 4 = 32 square feet.",
          "reasoningTarget": "Explain that the trapezoid formula averages the two parallel bases before multiplying by the height.",
          "level1": {
            "frame": "I claim the area is ______ square feet because one half times (6 + 10) times height ______ equals ______.",
            "frameEs": "Afirmo que el area es ______ pies cuadrados porque un medio por (6 + 10) por altura ______ es ______."
          },
          "level2": "Explain why averaging the two bases makes sense by picturing two trapezoids joined into a parallelogram.",
          "answerKey": "32 square feet."
        }
      ]
    },
    {
      "id": "u5-polygons-composites",
      "title": "Polygons and Composite Figures",
      "unit": "Unit 5 - Geometry: Area",
      "lessonIds": [
        "5.4",
        "5.5"
      ],
      "bigIdea": "Complex figures can be decomposed into shapes with known area formulas.",
      "studentWin": "Break a figure into parts, find each area, and recombine accurately.",
      "challenge": "Estimate paint needed for a mural wall made from a rectangle, triangle, and regular polygon section.",
      "modelKind": "area",
      "scenario": "Mural wall planner",
      "misconception": "Using perimeter when the question asks for area.",
      "repairMove": "Shade the space being measured and list the shapes that cover it.",
      "hint": "Area counts square units inside the figure.",
      "focus": "Regular polygons and composite figures",
      "materials": "Decomposition grid, area table",
      "roles": [
        "Shape splitter",
        "Area calculator",
        "Total checker"
      ],
      "defenseQuestions": [
        "Did your parts overlap or leave gaps?",
        "Why is this area, not perimeter?"
      ],
      "exitProduct": "A composite-area plan with labeled parts",
      "wrongSolution": "Add all outside lengths to find how much paint is needed.",
      "prompts": [
        "Decompose the figure into rectangles and triangles you can measure.",
        "Find each part's area, then add the parts together.",
        "Make sure parts do not overlap and leave no gaps.",
        "Remember paint covers area (square units), not perimeter."
      ],
      "cerItems": [
        {
          "id": "5.5-a",
          "lessonId": "5.5",
          "title": "Area of the house shape",
          "scenario": "A mural section is shaped like a house: a 10 ft by 6 ft rectangle with a triangle on top (base 10 ft, height 4 ft). Sam adds the outside lengths to find paint needed.",
          "question": "What is the total area to paint, and why is adding the outside lengths wrong?",
          "evidence": "Rectangle: 10 x 6 = 60. Triangle: 1/2 x 10 x 4 = 20. Total area = 60 + 20 = 80 square feet.",
          "reasoningTarget": "Explain that paint covers the inside region (area), so you must add part areas, not perimeter lengths.",
          "level1": {
            "frame": "I claim the area to paint is ______ square feet because the rectangle is ______ and the triangle is ______, and ______ measures the space inside.",
            "frameEs": "Afirmo que el area a pintar es ______ pies cuadrados porque el rectangulo es ______ y el triangulo es ______, y ______ mide el espacio interior."
          },
          "level2": "Explain the difference between what perimeter and area would tell a painter, using correct units for each.",
          "answerKey": "80 square feet."
        },
        {
          "id": "5.4-a",
          "lessonId": "5.4",
          "title": "Area of a regular hexagon tile",
          "scenario": "A regular hexagon floor tile is split from its center into 6 identical triangles. Each triangle has a base of 6 cm and a height of 5.2 cm.",
          "question": "What is the total area of the hexagonal tile?",
          "evidence": "Area of one triangle = (1/2)(6)(5.2) = 15.6 cm^2. There are 6 congruent triangles, so total area = 6 x 15.6 = 93.6 cm^2.",
          "claim": "I claim the area of the hexagon is 93.6 cm^2 because it is made of 6 congruent triangles of 15.6 cm^2 each.",
          "reasoningTarget": "Explain that a regular polygon can be decomposed into congruent triangles, so its area is the number of triangles times one triangle's area.",
          "level1": {
            "frame": "I claim the hexagon area is ______ because one triangle is ______ cm^2 and there are ______ congruent triangles.",
            "frameEs": "Afirmo que el area del hexagono es ______ porque un triangulo mide ______ cm^2 y hay ______ triangulos congruentes."
          },
          "level2": "If the tile were a regular octagon split into 8 congruent triangles of the same size, how would you find its area?",
          "answerKey": "93.6 cm^2 (6 triangles x 15.6 cm^2)."
        }
      ]
    },
    {
      "id": "u6-expression-language",
      "title": "Expression Language",
      "unit": "Unit 6 - Expressions",
      "lessonIds": [
        "6.1",
        "6.5",
        "6.6"
      ],
      "bigIdea": "Expressions use numbers, variables, operations, and structure to represent quantities.",
      "studentWin": "Translate words into expressions and identify what each part represents.",
      "challenge": "Write an expression for a fundraiser that charges a $12 setup fee plus $4 per bracelet sold.",
      "modelKind": "expression",
      "scenario": "Fundraiser expression desk",
      "misconception": "Writing an equation when no total is given or reversing the variable relationship.",
      "repairMove": "Identify the changing quantity and the fixed quantity before writing symbols.",
      "hint": "An expression does not need an equals sign unless two quantities are being compared.",
      "focus": "Numerical expressions, algebraic expressions, and parts of expressions",
      "materials": "Word bank, expression parts labels",
      "roles": [
        "Quantity finder",
        "Translator",
        "Parts labeler"
      ],
      "defenseQuestions": [
        "What does the variable represent?",
        "Which part is fixed and which part changes?"
      ],
      "exitProduct": "A labeled expression with a context explanation",
      "wrongSolution": "12x + 4 represents a $12 setup fee and $4 per bracelet.",
      "prompts": [
        "Find the fixed quantity and the quantity that changes.",
        "Let a variable stand for the changing quantity and define it.",
        "Attach the per-item rate to the variable as a coefficient.",
        "Identify the terms, coefficient, and constant in your expression."
      ],
      "cerItems": [
        {
          "id": "6.5-a",
          "lessonId": "6.5",
          "title": "Fundraiser expression",
          "scenario": "A fundraiser charges a $12 setup fee plus $4 per bracelet. Lee writes 12x + 4.",
          "question": "What expression represents the total cost for x bracelets, and what is wrong with 12x + 4?",
          "evidence": "The $4 changes with each bracelet, so it is the coefficient: 4x + 12. The $12 is fixed (the constant).",
          "reasoningTarget": "Explain that the per-bracelet rate ($4) multiplies the variable, while the one-time fee ($12) is the constant.",
          "level1": {
            "frame": "I claim the expression is ______ because $4 per bracelet attaches to ______, and the fixed $12 is the ______.",
            "frameEs": "Afirmo que la expresion es ______ porque $4 por pulsera se une a ______, y los $12 fijos son la ______."
          },
          "level2": "Explain what Lee's expression 12x + 4 would actually mean in dollars, and why it does not fit this fundraiser.",
          "answerKey": "4x + 12 (Lee reversed the rate and the fee)."
        },
        {
          "id": "6.6-a",
          "lessonId": "6.6",
          "title": "Name the parts",
          "scenario": "An expression for a game score is 5n + 8.",
          "question": "In 5n + 8, what is the coefficient, the variable, and the constant?",
          "evidence": "Coefficient = 5, variable = n, constant = 8. There are two terms: 5n and 8.",
          "reasoningTarget": "Explain that the coefficient multiplies the variable and the constant stands alone.",
          "level1": {
            "frame": "I claim the coefficient is ______, the variable is ______, and the constant is ______ because ______ multiplies the variable and ______ stands alone.",
            "frameEs": "Afirmo que el coeficiente es ______, la variable es ______ y la constante es ______ porque ______ multiplica la variable y ______ esta solo."
          },
          "level2": "Describe a real game situation that 5n + 8 could represent, and say what n stands for.",
          "answerKey": "Coefficient 5, variable n, constant 8."
        },
        {
          "id": "6.1-a",
          "lessonId": "6.1",
          "title": "Write the expression for the cube's volume",
          "scenario": "A storage cube has an edge length of 5 inches. Dana wants to write the volume using an exponent instead of repeated multiplication.",
          "question": "Write a numerical expression for the cube's volume using an exponent, and state its value.",
          "evidence": "Volume of a cube = edge x edge x edge = 5 x 5 x 5, which is written as 5^3. Evaluating, 5^3 = 125 cubic inches.",
          "claim": "I claim the volume expression is 5^3 because the edge length 5 is used as a factor three times.",
          "reasoningTarget": "Explain that an exponent records repeated multiplication, where the base is the repeated factor and the exponent is how many times it is used.",
          "level1": {
            "frame": "I claim the expression is ______ because the base ______ is multiplied ______ times.",
            "frameEs": "Afirmo que la expresion es ______ porque la base ______ se multiplica ______ veces."
          },
          "level2": "Explain why 5^3 is not the same as 5 x 3, using the meaning of an exponent.",
          "answerKey": "5^3 = 125 cubic inches."
        }
      ]
    },
    {
      "id": "u6-equivalent-expressions",
      "title": "Equivalent Expressions",
      "unit": "Unit 6 - Expressions",
      "lessonIds": [
        "6.2",
        "6.3",
        "6.4",
        "6.7"
      ],
      "bigIdea": "Equivalent expressions have the same value for every allowed value of the variable.",
      "studentWin": "Use properties, evaluation, and reasoning to show expressions are equivalent.",
      "challenge": "Compare two pricing rules: 3(x + 4) and 3x + 12. Prove whether they always match.",
      "modelKind": "expression",
      "scenario": "Pricing-rule audit",
      "misconception": "Checking one value and assuming expressions are always equivalent.",
      "repairMove": "Use properties or multiple test values to support the claim.",
      "hint": "Distributive property connects grouped multiplication and separated terms.",
      "focus": "Evaluating, properties, and generating equivalent expressions",
      "materials": "Input table, property cards, expression audit",
      "roles": [
        "Evaluator",
        "Property spotter",
        "Proof speaker"
      ],
      "defenseQuestions": [
        "Would this work for any value?",
        "Which property supports the change?"
      ],
      "exitProduct": "An equivalence proof using a property and sample values",
      "wrongSolution": "3(x + 4) equals 3x + 4 because the 3 only multiplies x.",
      "prompts": [
        "Use the distributive property: multiply the outside factor by EACH term inside.",
        "Test the expressions with at least two different values of the variable.",
        "Name the property that justifies each step.",
        "Conclude only if the expressions match for every value, not just one."
      ],
      "cerItems": [
        {
          "id": "6.4-a",
          "lessonId": "6.4",
          "title": "Is 3(x+4) the same as 3x+12?",
          "scenario": "Two pricing rules are 3(x + 4) and 3x + 12. Avery says they match because the 3 only multiplies x.",
          "question": "Are 3(x + 4) and 3x + 12 equivalent? What is Avery's error?",
          "evidence": "Distributive property: 3(x + 4) = 3x + 12. Test x = 2: 3(6) = 18 and 3(2) + 12 = 18. They match for all x.",
          "reasoningTarget": "Explain that the distributive property multiplies the 3 by BOTH x and 4, proving the expressions are equivalent.",
          "level1": {
            "frame": "I claim 3(x + 4) ______ equivalent to 3x + 12 because the distributive property gives ______, and testing x = 2 gives ______ for both.",
            "frameEs": "Afirmo que 3(x + 4) ______ equivalente a 3x + 12 porque la propiedad distributiva da ______, y al probar x = 2 da ______ en ambas."
          },
          "level2": "Explain why Avery's version 3x + 4 fails, using one test value as a counterexample.",
          "answerKey": "Equivalent; Avery forgot to multiply the 4."
        },
        {
          "id": "6.2-a",
          "lessonId": "6.2",
          "title": "Evaluate the expression",
          "scenario": "A taxi charges the expression 2.5m + 3 dollars, where m is miles. A ride is 6 miles.",
          "question": "What is the cost of a 6-mile ride, and which operation comes first?",
          "evidence": "2.5(6) + 3 = 15 + 3 = 18. Order of operations: multiply before adding.",
          "reasoningTarget": "Explain that order of operations requires multiplication before addition when evaluating.",
          "level1": {
            "frame": "I claim the cost is ______ because 2.5 times 6 is ______, and adding 3 gives ______; I multiplied ______ adding.",
            "frameEs": "Afirmo que el costo es ______ porque 2.5 por 6 es ______, y sumar 3 da ______; multipliqué ______ de sumar."
          },
          "level2": "Explain how the cost would change for a 10-mile ride and what part of the expression stays the same.",
          "answerKey": "$18."
        },
        {
          "id": "6.3-a",
          "lessonId": "6.3",
          "title": "Distribute to find the team's total cost",
          "scenario": "A coach buys 6 identical kits. Each kit has a $9 jersey and a $4 water bottle. Sam writes 6(9 + 4) and Rosa writes 6(9) + 6(4).",
          "question": "Are 6(9 + 4) and 6(9) + 6(4) equivalent, and which property explains why?",
          "evidence": "6(9 + 4) = 6(13) = 78. 6(9) + 6(4) = 54 + 24 = 78. Both equal 78.",
          "claim": "I claim the two expressions are equivalent because the distributive property lets you multiply 6 by each addend and add the products.",
          "reasoningTarget": "Explain that the distributive property guarantees a(b + c) = ab + ac for all numbers, so both forms must give the same total.",
          "level1": {
            "frame": "I claim the expressions are ______ because the ______ property gives ______ both ways.",
            "frameEs": "Afirmo que las expresiones son ______ porque la propiedad ______ da ______ de las dos formas."
          },
          "level2": "Rewrite 4(x + 7) using the distributive property and explain what each term represents.",
          "answerKey": "Equivalent; both equal 78 by the distributive property."
        },
        {
          "id": "6.7-a",
          "lessonId": "6.7",
          "title": "Factor the expression for fenced gardens",
          "scenario": "A landscaper writes the cost expression 8x + 12 for x gardens. She wants an equivalent factored form.",
          "question": "Write an expression equivalent to 8x + 12 by factoring out the greatest common factor.",
          "evidence": "The GCF of 8x and 12 is 4. Factoring: 8x + 12 = 4(2x + 3). Checking by distributing: 4(2x) + 4(3) = 8x + 12.",
          "claim": "I claim 8x + 12 is equivalent to 4(2x + 3) because 4 is the greatest common factor of both terms.",
          "reasoningTarget": "Explain that factoring out the GCF produces an equivalent expression because distributing the GCF back returns the original terms.",
          "level1": {
            "frame": "I claim 8x + 12 equals ______ because the GCF of the terms is ______.",
            "frameEs": "Afirmo que 8x + 12 es igual a ______ porque el MCD de los terminos es ______."
          },
          "level2": "Explain how you can check that 4(2x + 3) is truly equivalent to 8x + 12 for any value of x.",
          "answerKey": "4(2x + 3); the GCF is 4."
        }
      ]
    },
    {
      "id": "u7-equation-solving",
      "title": "Equation Solving",
      "unit": "Unit 7 - Equations",
      "lessonIds": [
        "7.1",
        "7.2",
        "7.3"
      ],
      "bigIdea": "Equations state equality, and solving means finding values that make the statement true.",
      "studentWin": "Solve one-step equations and verify solutions in context.",
      "challenge": "A team spent $18 after buying notebooks at $3 each. Write and solve an equation for the number of notebooks.",
      "modelKind": "equation",
      "scenario": "Classroom supply receipt",
      "misconception": "Doing an operation to one side only or treating the solution as the operation.",
      "repairMove": "Use balance reasoning and check the solution by substitution.",
      "hint": "Whatever keeps the equation balanced must happen to both sides.",
      "focus": "Solutions, one-step equations, and writing equations",
      "materials": "Balance model, inverse operation cards",
      "roles": [
        "Equation writer",
        "Balance keeper",
        "Substitution checker"
      ],
      "defenseQuestions": [
        "How did you keep both sides equal?",
        "Does your solution make the original statement true?"
      ],
      "exitProduct": "A solved equation with substitution check",
      "wrongSolution": "3n = 18, so n = 21 because addition undoes multiplication.",
      "prompts": [
        "Write the equation from the story before solving.",
        "Use the inverse operation to undo what is done to the variable.",
        "Do the same operation to BOTH sides to keep balance.",
        "Substitute your answer back to check the equation is true."
      ],
      "cerItems": [
        {
          "id": "7.2-a",
          "lessonId": "7.2",
          "title": "How many notebooks?",
          "scenario": "A team spent $18 on notebooks that cost $3 each. Bo writes 3n = 18 and says n = 21.",
          "question": "How many notebooks were bought, and what is Bo's mistake?",
          "evidence": "3n = 18, so n = 18 / 3 = 6. Check: 3(6) = 18. Division (not addition) undoes multiplication.",
          "reasoningTarget": "Explain that you undo multiplication by dividing both sides, so n = 6, and substitution verifies it.",
          "level1": {
            "frame": "I claim n = ______ because 18 divided by 3 is ______, and checking 3 times ______ gives 18.",
            "frameEs": "Afirmo que n = ______ porque 18 entre 3 es ______, y al comprobar 3 por ______ da 18."
          },
          "level2": "Explain why Bo's idea that 'addition undoes multiplication' is wrong, naming the correct inverse operation.",
          "answerKey": "n = 6 notebooks."
        },
        {
          "id": "7.1-a",
          "lessonId": "7.1",
          "title": "Is 5 a solution?",
          "scenario": "For the equation x + 7 = 12, Riley tests x = 5.",
          "question": "Is x = 5 a solution to x + 7 = 12? How do you know?",
          "evidence": "Substitute: 5 + 7 = 12, which is true. So x = 5 makes the equation true.",
          "reasoningTarget": "Explain that a solution is a value that makes both sides equal when substituted.",
          "level1": {
            "frame": "I claim x = 5 ______ a solution because 5 + 7 equals ______, which ______ equal 12.",
            "frameEs": "Afirmo que x = 5 ______ una solucion porque 5 + 7 es ______, que ______ igual a 12."
          },
          "level2": "Explain how you could test whether x = 4 is a solution, and what result would tell you it is not.",
          "answerKey": "Yes, x = 5 is a solution."
        },
        {
          "id": "7.3-a",
          "lessonId": "7.3",
          "title": "Write and solve the savings equation",
          "scenario": "Maya has $18 saved and adds $9 each week. She wants to know how many weeks w it takes to reach $45.",
          "question": "Write an equation for the total savings and solve for the number of weeks w needed to reach $45.",
          "evidence": "Total = starting amount + weekly amount x weeks: 18 + 9w = 45. Subtract 18: 9w = 27. Divide by 9: w = 3.",
          "claim": "I claim Maya needs 3 weeks because the equation 18 + 9w = 45 solves to w = 3.",
          "reasoningTarget": "Explain that inverse operations (subtract 18, then divide by 9) isolate the variable while keeping the equation balanced.",
          "level1": {
            "frame": "I claim w = ______ because the equation ______ solves when I ______ from both sides and then ______.",
            "frameEs": "Afirmo que w = ______ porque la ecuacion ______ se resuelve cuando ______ en ambos lados y luego ______."
          },
          "level2": "Explain how you can check that w = 3 is correct by substituting it back into the equation.",
          "answerKey": "18 + 9w = 45, so w = 3 weeks."
        }
      ]
    },
    {
      "id": "u7-inequality-reasoning",
      "title": "Inequality Reasoning",
      "unit": "Unit 7 - Equations",
      "lessonIds": [
        "7.4",
        "7.5"
      ],
      "bigIdea": "Inequalities describe a range of values, not just one answer.",
      "studentWin": "Solve and graph inequalities, then interpret the solution set.",
      "challenge": "A field day team can spend at most $60 on prizes that cost $5 each plus a $10 banner.",
      "modelKind": "inequality",
      "scenario": "Field day budget limit",
      "misconception": "Solving like an equation and reporting only one value.",
      "repairMove": "Test values on both sides of the boundary and graph the full set.",
      "hint": "Words like at most and no more than point to inclusive boundaries.",
      "focus": "Solving and graphing inequalities",
      "materials": "Number line, boundary test table",
      "roles": [
        "Boundary finder",
        "Graph maker",
        "Context interpreter"
      ],
      "defenseQuestions": [
        "Is the boundary included?",
        "What values actually work in the story?"
      ],
      "exitProduct": "An inequality graph with a context sentence",
      "wrongSolution": "5p + 10 <= 60 means p = 10, so only 10 prizes are possible.",
      "prompts": [
        "Translate phrases like 'at most' into the correct inequality symbol.",
        "Solve for the variable using inverse operations, keeping the symbol.",
        "Graph the solution: closed dot for inclusive, open dot for strict.",
        "State which whole-number values actually work in the story."
      ],
      "cerItems": [
        {
          "id": "7.4-a",
          "lessonId": "7.4",
          "title": "How many prizes can they buy?",
          "scenario": "A team has at most $60. Prizes cost $5 each and a banner costs $10. Quinn solves 5p + 10 <= 60 and says p = 10.",
          "question": "What is the greatest number of prizes the team can buy?",
          "evidence": "5p + 10 <= 60; subtract 10: 5p <= 50; divide by 5: p <= 10. So p can be 0 to 10 prizes.",
          "reasoningTarget": "Explain that an inequality gives a RANGE of values (p <= 10), so the maximum is 10 but fewer also work.",
          "level1": {
            "frame": "I claim the team can buy at most ______ prizes because p <= ______, which means any number from 0 up to ______.",
            "frameEs": "Afirmo que el equipo puede comprar a lo mas ______ premios porque p <= ______, lo que significa cualquier numero de 0 hasta ______."
          },
          "level2": "Explain why the answer is a range and not a single value, and describe how to graph p <= 10.",
          "answerKey": "At most 10 prizes (p <= 10)."
        },
        {
          "id": "7.5-a",
          "lessonId": "7.5",
          "title": "Graph the ride-height rule",
          "scenario": "A ride requires riders to be at least 48 inches tall. Theo writes h >= 48 and graphs it on a number line.",
          "question": "How should the inequality h >= 48 be graphed on a number line, and why?",
          "evidence": "Plot the boundary at 48. Because 'at least' includes 48, use a CLOSED (filled) circle at 48 and shade to the right toward larger heights.",
          "claim": "I claim the graph uses a closed circle at 48 shaded to the right because heights of 48 inches and taller are allowed.",
          "reasoningTarget": "Explain that >= includes the boundary value, so the circle is closed, and shading right shows all values greater than the boundary also work.",
          "level1": {
            "frame": "I claim the graph has a ______ circle at ______ shaded to the ______ because ______ is allowed.",
            "frameEs": "Afirmo que la grafica tiene un circulo ______ en ______ sombreado hacia la ______ porque ______ esta permitido."
          },
          "level2": "How would the graph change if the rule were 'taller than 48 inches' (h > 48)? Explain the difference.",
          "answerKey": "Closed circle at 48, shaded to the right (h >= 48)."
        }
      ]
    },
    {
      "id": "u7-relationships",
      "title": "Patterns and Relationships",
      "unit": "Unit 7 - Equations",
      "lessonIds": [
        "7.6",
        "7.7"
      ],
      "bigIdea": "Relationships connect independent and dependent variables through patterns, tables, and rules.",
      "studentWin": "Identify variables, build a table, and explain the rule connecting them.",
      "challenge": "A reading challenge gives 8 points per book plus 5 bonus points. Model points as books increase.",
      "modelKind": "equation",
      "scenario": "Reading challenge scoreboard",
      "misconception": "Mixing up which variable depends on the other.",
      "repairMove": "Ask which quantity is chosen first and which quantity changes because of it.",
      "hint": "The dependent variable depends on the independent variable.",
      "focus": "Dependent and independent variables, patterns, and relationships",
      "materials": "Input-output table, rule card",
      "roles": [
        "Variable namer",
        "Table builder",
        "Rule explainer"
      ],
      "defenseQuestions": [
        "Which value controls the other?",
        "How does the table show the rule?"
      ],
      "exitProduct": "A table and rule with variables defined",
      "wrongSolution": "Books depend on points because points are the bigger numbers.",
      "prompts": [
        "Decide which quantity is chosen first (independent) and which responds (dependent).",
        "Write a rule: dependent = rate times independent plus any starting value.",
        "Build an input-output table to test the rule.",
        "Explain in words how one variable controls the other."
      ],
      "cerItems": [
        {
          "id": "7.6-a",
          "lessonId": "7.6",
          "title": "Which variable depends?",
          "scenario": "In a reading challenge, points = 8 x books + 5. Casey says books depend on points because points are bigger.",
          "question": "Which is the independent variable and which is dependent, and what is the rule?",
          "evidence": "You choose how many books to read first, then points follow: points depend on books. Rule: p = 8b + 5.",
          "reasoningTarget": "Explain that the dependent variable (points) is determined by the independent variable (books), not by size.",
          "level1": {
            "frame": "I claim ______ is independent and ______ is dependent because you choose ______ first, and the rule is ______.",
            "frameEs": "Afirmo que ______ es independiente y ______ es dependiente porque eliges ______ primero, y la regla es ______."
          },
          "level2": "Make a table for 0, 1, and 2 books and explain how the +5 shows up in the table.",
          "answerKey": "Books independent, points dependent; p = 8b + 5."
        },
        {
          "id": "7.7-a",
          "lessonId": "7.7",
          "title": "Find the rule in the table",
          "scenario": "A table shows hours worked and dollars earned: (1,12), (2,24), (3,36), (4,48).",
          "question": "What equation relates dollars earned (d) to hours worked (h), and how do you know?",
          "evidence": "Each output is 12 times the input: 12x1=12, 12x2=24, 12x3=36. The constant rate is 12 dollars per hour, so d = 12h.",
          "claim": "I claim the rule is d = 12h because every dollar value equals 12 times the matching hour value.",
          "reasoningTarget": "Explain that a constant multiplicative pattern in a table means the dependent variable equals the constant rate times the independent variable.",
          "level1": {
            "frame": "I claim the equation is ______ because each output is ______ times the input.",
            "frameEs": "Afirmo que la ecuacion es ______ porque cada salida es ______ veces la entrada."
          },
          "level2": "Use the equation d = 12h to predict the earnings for 7 hours, and explain which variable is dependent.",
          "answerKey": "d = 12h (constant rate of $12 per hour)."
        }
      ]
    },
    {
      "id": "u8-stat-questions-centers",
      "title": "Statistical Questions and Centers",
      "unit": "Unit 8 - Statistics",
      "lessonIds": [
        "8.1",
        "8.2"
      ],
      "bigIdea": "Statistical questions anticipate variability, and centers summarize typical values.",
      "studentWin": "Decide whether a question is statistical and choose a useful center.",
      "challenge": "Analyze homeroom screen-time data and recommend the most useful typical value.",
      "modelKind": "data",
      "scenario": "Data question clinic",
      "misconception": "Calling any question with a number statistical or using mean for every data set.",
      "repairMove": "Check for variability and inspect the data before choosing a measure.",
      "hint": "A statistical question expects different answers from different people or objects.",
      "focus": "Statistical questions, mean, median, and mode",
      "materials": "Data set, center comparison table",
      "roles": [
        "Question judge",
        "Center calculator",
        "Recommendation writer"
      ],
      "defenseQuestions": [
        "Where is the variability?",
        "Which center best represents the data?"
      ],
      "exitProduct": "A data-center recommendation",
      "wrongSolution": "What is my shoe size? is statistical because it has a number.",
      "prompts": [
        "A statistical question expects different answers from different people.",
        "Add all values and divide by the count to find the mean.",
        "Order the data and find the middle value for the median.",
        "Compare mean and median to decide which is most typical."
      ],
      "cerItems": [
        {
          "id": "8.1-a",
          "lessonId": "8.1",
          "title": "Is it a statistical question?",
          "scenario": "Two questions: (A) 'What is my shoe size?' and (B) 'What are the shoe sizes of students in my class?' Drew says A is statistical because it has a number.",
          "question": "Which question is statistical, and why?",
          "evidence": "Question B has many different answers (variability); A has just one answer.",
          "reasoningTarget": "Explain that a statistical question anticipates variability, so B (not A) is statistical.",
          "level1": {
            "frame": "I claim question ______ is statistical because it expects ______ answers, while question ______ has only ______ answer.",
            "frameEs": "Afirmo que la pregunta ______ es estadistica porque espera ______ respuestas, mientras que la pregunta ______ tiene solo ______ respuesta."
          },
          "level2": "Rewrite question A so that it becomes a statistical question, and explain what makes it statistical now.",
          "answerKey": "Question B is statistical."
        },
        {
          "id": "8.2-a",
          "lessonId": "8.2",
          "title": "Mean and median of screen time",
          "scenario": "Daily screen-time hours for 5 students: 2, 3, 3, 4, 8.",
          "question": "What are the mean and median, and which better describes a typical student?",
          "evidence": "Mean = (2+3+3+4+8)/5 = 20/5 = 4. Median = middle of 2,3,3,4,8 = 3. The 8 pulls the mean up.",
          "reasoningTarget": "Explain that the median (3) is more typical here because the outlier 8 inflates the mean.",
          "level1": {
            "frame": "I claim the mean is ______ and the median is ______, and the ______ better describes a typical student because the value ______ pulls the mean up.",
            "frameEs": "Afirmo que la media es ______ y la mediana es ______, y la ______ describe mejor a un estudiante tipico porque el valor ______ sube la media."
          },
          "level2": "If the 8 were changed to 18, predict how the mean and median each respond and explain why.",
          "answerKey": "Mean 4, median 3; median is more typical."
        }
      ]
    },
    {
      "id": "u8-variability-displays",
      "title": "Variability and Displays",
      "unit": "Unit 8 - Statistics",
      "lessonIds": [
        "8.3",
        "8.4",
        "8.5"
      ],
      "bigIdea": "Data displays and variability measures reveal spread, clusters, gaps, and outliers.",
      "studentWin": "Create or critique a display and describe what the distribution shows.",
      "challenge": "Compare two classes' quiz-score distributions and decide which class was more consistent.",
      "modelKind": "data",
      "scenario": "Quiz-score data team",
      "misconception": "Judging only by the highest score or center without considering spread.",
      "repairMove": "Describe shape, center, variability, and unusual values together.",
      "hint": "Mean absolute deviation describes typical distance from the mean.",
      "focus": "MAD, data displays, and distribution descriptions",
      "materials": "Dot plot, MAD table, distribution sentence frame",
      "roles": [
        "Display builder",
        "Spread calculator",
        "Distribution describer"
      ],
      "defenseQuestions": [
        "What does the spread show?",
        "Which evidence supports consistency?"
      ],
      "exitProduct": "A display critique with variability evidence",
      "wrongSolution": "Class A is better because its highest score is 100.",
      "prompts": [
        "Describe shape, center, spread, and any outliers together.",
        "Find the mean, then the distance of each value from the mean.",
        "Average those distances to find the MAD (typical spread).",
        "Smaller MAD means the data is more consistent."
      ],
      "cerItems": [
        {
          "id": "8.3-a",
          "lessonId": "8.3",
          "title": "Which class is more consistent?",
          "scenario": "Class A scores: 70, 80, 90 (mean 80). Class B scores: 60, 80, 100 (mean 80). Pat says Class B is better because it has a 100.",
          "question": "Which class is more consistent, based on mean absolute deviation (MAD)?",
          "evidence": "Class A distances from 80: 10, 0, 10; MAD = 20/3 = 6.7. Class B distances: 20, 0, 20; MAD = 40/3 = 13.3. A's MAD is smaller.",
          "reasoningTarget": "Explain that the smaller MAD means scores cluster closer to the mean, so Class A is more consistent despite no perfect score.",
          "level1": {
            "frame": "I claim Class ______ is more consistent because its MAD is ______, which is ______ than Class B's MAD of ______.",
            "frameEs": "Afirmo que la Clase ______ es mas consistente porque su DAM es ______, que es ______ que la DAM de la Clase B de ______."
          },
          "level2": "Explain why looking only at the highest score (100) gives a misleading picture of a class's performance.",
          "answerKey": "Class A is more consistent (MAD 6.7 < 13.3)."
        },
        {
          "id": "8.4-a",
          "lessonId": "8.4",
          "title": "Reading the dot plot",
          "scenario": "A dot plot of pets owned shows: 0 pets (4 students), 1 pet (6 students), 2 pets (2 students), 5 pets (1 student).",
          "question": "What is the most common number of pets, and which value is an outlier?",
          "evidence": "The tallest stack is at 1 pet (6 students), so the mode is 1. The lone dot at 5 is an outlier (a gap separates it).",
          "reasoningTarget": "Explain that the tallest column shows the mode and an isolated value far from the cluster is an outlier.",
          "level1": {
            "frame": "I claim the most common value is ______ pets because it has ______ dots, and ______ pets is an outlier because it is far from the cluster.",
            "frameEs": "Afirmo que el valor mas comun es ______ mascotas porque tiene ______ puntos, y ______ mascotas es un valor atipico porque esta lejos del grupo."
          },
          "level2": "Describe the overall shape of this distribution and explain what the gap before 5 tells you.",
          "answerKey": "Mode is 1 pet; 5 is the outlier."
        },
        {
          "id": "8.5-a",
          "lessonId": "8.5",
          "title": "Describe the spelling-score dot plot",
          "scenario": "A dot plot shows spelling-test scores: most dots cluster at 8 and 9, there is a gap at 5 and 6, and a single dot sits at 2.",
          "question": "Describe the distribution of the scores, including center, clusters, gaps, and any outlier.",
          "evidence": "Scores cluster at 8 and 9 (the peak), there is a gap with no scores at 5-6, and one isolated score at 2 sits far from the rest.",
          "claim": "I claim the distribution clusters around 8-9 with a gap at 5-6 and an outlier at 2 because most data sits high while one point is far below.",
          "reasoningTarget": "Explain that an outlier is a value far from the cluster and that describing peaks, clusters, and gaps summarizes the shape of the data.",
          "level1": {
            "frame": "I claim the scores cluster around ______, with a gap at ______, and an outlier at ______ because ______.",
            "frameEs": "Afirmo que los puntajes se agrupan alrededor de ______, con un hueco en ______, y un valor atipico en ______ porque ______."
          },
          "level2": "Explain how the outlier at 2 would affect the mean compared to the median of these scores.",
          "answerKey": "Cluster/peak at 8-9; gap at 5-6; outlier at 2."
        }
      ]
    },
    {
      "id": "u8-summary-measures",
      "title": "Data Summaries and Measures",
      "unit": "Unit 8 - Statistics",
      "lessonIds": [
        "8.6",
        "8.7"
      ],
      "bigIdea": "A strong data summary chooses measures that fit the shape and purpose of the data.",
      "studentWin": "Summarize a data set and justify the measure used.",
      "challenge": "Choose the best measure to summarize donation amounts when one donor gives much more than everyone else.",
      "modelKind": "data",
      "scenario": "Donation report desk",
      "misconception": "Using mean even when an outlier makes it misleading.",
      "repairMove": "Compare mean and median, then connect the choice to the data shape.",
      "hint": "Outliers can pull the mean but do not move the median as much.",
      "focus": "Summarizing data and choosing measures",
      "materials": "Summary table, outlier check",
      "roles": [
        "Shape analyst",
        "Measure chooser",
        "Justification writer"
      ],
      "defenseQuestions": [
        "How does the outlier affect the mean?",
        "Why is your measure fair?"
      ],
      "exitProduct": "A data summary with a justified measure",
      "wrongSolution": "The mean is always the best summary because it uses all numbers.",
      "prompts": [
        "Look for outliers before choosing a measure of center.",
        "Compare the mean and the median for the same data.",
        "Use the median when an outlier makes the mean misleading.",
        "Justify your choice by connecting it to the data shape."
      ],
      "cerItems": [
        {
          "id": "8.7-a",
          "lessonId": "8.7",
          "title": "Best measure for donations",
          "scenario": "Donations: $5, $5, $10, $10, $200. Sky says use the mean because it uses all numbers.",
          "question": "Which measure of center best summarizes a typical donation, the mean or the median?",
          "evidence": "Mean = 230/5 = $46. Median = $10. Only the $200 donation is anywhere near $46.",
          "reasoningTarget": "Explain that the median ($10) better represents a typical donation because the $200 outlier inflates the mean.",
          "level1": {
            "frame": "I claim the ______ best summarizes a typical donation because the mean is ______ but the median is ______, and the value ______ pulls the mean up.",
            "frameEs": "Afirmo que la ______ resume mejor una donacion tipica porque la media es ______ pero la mediana es ______, y el valor ______ sube la media."
          },
          "level2": "Explain a situation where using the mean WOULD be the better choice, and what the data would look like.",
          "answerKey": "Median ($10); the mean is skewed by $200."
        },
        {
          "id": "8.6-a",
          "lessonId": "8.6",
          "title": "Summarize the daily reading minutes",
          "scenario": "A student reads these minutes over 5 days: 20, 25, 30, 25, 20.",
          "question": "Summarize the data by finding the mean, the median, and the range.",
          "evidence": "Ordered: 20, 20, 25, 25, 30. Mean = (20+25+30+25+20)/5 = 120/5 = 24. Median (middle of ordered list) = 25. Range = 30 - 20 = 10.",
          "claim": "I claim the data is centered near 24-25 minutes with a range of 10 because the mean is 24, the median is 25, and the spread is 10.",
          "reasoningTarget": "Explain that mean and median describe the center while range describes the spread, so together they summarize the data set.",
          "level1": {
            "frame": "I claim the mean is ______, the median is ______, and the range is ______ because ______.",
            "frameEs": "Afirmo que la media es ______, la mediana es ______, y el rango es ______ porque ______."
          },
          "level2": "If a sixth day of 60 minutes were added, explain how the mean and the range would change.",
          "answerKey": "Mean 24, median 25, range 10."
        }
      ]
    },
    {
      "id": "u9-coordinate-basics",
      "title": "Coordinate Plane Basics",
      "unit": "Unit 9 - Coordinate Plane",
      "lessonIds": [
        "9.1",
        "9.2",
        "9.3",
        "9.4"
      ],
      "bigIdea": "Coordinates, signs, and absolute value describe location and distance from zero.",
      "studentWin": "Plot and compare points using quadrant, sign, and absolute-value reasoning.",
      "challenge": "Map four classroom stations on a coordinate plane and rank their distances from the origin.",
      "modelKind": "coordinate",
      "scenario": "Classroom map crew",
      "misconception": "Swapping x and y or treating negative numbers as always larger because they have bigger digits.",
      "repairMove": "Use the ordered-pair rule and compare distance from zero separately from value.",
      "hint": "The x-coordinate moves left or right first, then y moves up or down.",
      "focus": "Graphing, ordered pairs, absolute value, and integer comparison",
      "materials": "Coordinate grid, sign chart, absolute-value number line",
      "roles": [
        "Point plotter",
        "Sign checker",
        "Distance interpreter"
      ],
      "defenseQuestions": [
        "Which coordinate did you move first?",
        "Are you comparing value or distance from zero?"
      ],
      "exitProduct": "A plotted map with comparison explanations",
      "wrongSolution": "(-8) is greater than (-3) because 8 is greater than 3.",
      "prompts": [
        "Move along x first (left or right), then y (up or down).",
        "Use the signs of x and y to name the quadrant.",
        "Absolute value is the distance from zero, always positive.",
        "When comparing integers, smaller means farther left on the number line."
      ],
      "cerItems": [
        {
          "id": "9.4-a",
          "lessonId": "9.4",
          "title": "Which integer is greater?",
          "scenario": "A thermometer reads -8 degrees on Monday and -3 degrees on Tuesday. Sam says -8 is greater because 8 is bigger than 3.",
          "question": "Which temperature is greater, -8 or -3?",
          "evidence": "On a number line, -3 is to the right of -8, so -3 > -8. -8 is colder (farther left).",
          "reasoningTarget": "Explain that for integers, the value farther right on the number line is greater, so -3 > -8 even though 8 > 3.",
          "level1": {
            "frame": "I claim ______ is greater because on the number line it is to the ______ of the other, so ______ > ______.",
            "frameEs": "Afirmo que ______ es mayor porque en la recta numerica esta a la ______ del otro, asi ______ > ______."
          },
          "level2": "Explain the difference between which number is greater and which has the larger absolute value, using -8 and -3.",
          "answerKey": "-3 > -8."
        },
        {
          "id": "9.2-a",
          "lessonId": "9.2",
          "title": "Plotting an ordered pair",
          "scenario": "A station is at the point (-4, 3). Jess plots it 4 up and 3 to the left.",
          "question": "Where is the point (-4, 3), and what did Jess do wrong?",
          "evidence": "The first number is x = -4 (4 left), the second is y = 3 (3 up). The point is in Quadrant II.",
          "reasoningTarget": "Explain that the x-coordinate comes first (horizontal) and y second (vertical), so Jess reversed them.",
          "level1": {
            "frame": "I claim (-4, 3) is in Quadrant ______ because x = ______ means ______ and y = ______ means ______.",
            "frameEs": "Afirmo que (-4, 3) esta en el Cuadrante ______ porque x = ______ significa ______ y y = ______ significa ______."
          },
          "level2": "Explain how the point (3, -4) would land in a different quadrant, and name which one.",
          "answerKey": "(-4, 3) is in Quadrant II; Jess swapped x and y."
        },
        {
          "id": "9.3-a",
          "lessonId": "9.3",
          "title": "Distance from zero",
          "scenario": "A submarine is at -120 feet and a diver is at -45 feet relative to sea level.",
          "question": "Which is farther from sea level, and how does absolute value show it?",
          "evidence": "|-120| = 120 and |-45| = 45. 120 > 45, so the submarine is farther from sea level.",
          "reasoningTarget": "Explain that absolute value measures distance from zero, so the larger absolute value is farther from sea level.",
          "level1": {
            "frame": "I claim the ______ is farther from sea level because |-120| = ______ and |-45| = ______, and ______ is greater.",
            "frameEs": "Afirmo que el ______ esta mas lejos del nivel del mar porque |-120| = ______ y |-45| = ______, y ______ es mayor."
          },
          "level2": "Explain why -120 is the smaller number but represents the greater distance from sea level.",
          "answerKey": "The submarine (|-120| = 120 > 45)."
        },
        {
          "id": "9.1-a",
          "lessonId": "9.1",
          "title": "Which quadrant holds the point?",
          "scenario": "A treasure map marks a chest at the point (-4, 3) on the coordinate plane.",
          "question": "In which quadrant is the point (-4, 3) located, and how do the signs tell you?",
          "evidence": "The x-coordinate -4 is negative (left of the origin) and the y-coordinate 3 is positive (above the origin). Left-and-up is Quadrant II.",
          "claim": "I claim (-4, 3) is in Quadrant II because the x-value is negative and the y-value is positive.",
          "reasoningTarget": "Explain that the signs of the coordinates determine the quadrant: (-,+) means left of and above the origin, which is Quadrant II.",
          "level1": {
            "frame": "I claim (-4, 3) is in Quadrant ______ because x is ______ and y is ______.",
            "frameEs": "Afirmo que (-4, 3) esta en el Cuadrante ______ porque x es ______ y y es ______."
          },
          "level2": "Name the quadrant for the reflection of (-4, 3) across the x-axis, and explain how the signs change.",
          "answerKey": "Quadrant II (x negative, y positive)."
        }
      ]
    },
    {
      "id": "u9-coordinate-distance",
      "title": "Coordinate Distance and Polygons",
      "unit": "Unit 9 - Coordinate Plane",
      "lessonIds": [
        "9.5",
        "9.6",
        "9.7"
      ],
      "bigIdea": "Coordinate geometry uses horizontal and vertical distances to solve shape problems.",
      "studentWin": "Use coordinates to find distances, draw polygons, and solve real problems.",
      "challenge": "Design a rectangular park on a coordinate grid and calculate side lengths and perimeter.",
      "modelKind": "coordinate",
      "scenario": "Park map design team",
      "misconception": "Counting diagonal distance when points share x or y coordinates.",
      "repairMove": "Check whether x or y changes, then use absolute difference for that direction.",
      "hint": "For horizontal distance, compare x-values. For vertical distance, compare y-values.",
      "focus": "Distance, polygons, and coordinate problem solving",
      "materials": "Coordinate grid, distance table",
      "roles": [
        "Vertex plotter",
        "Distance finder",
        "Geometry checker"
      ],
      "defenseQuestions": [
        "Which coordinate changed?",
        "How do the distances form the shape?"
      ],
      "exitProduct": "A coordinate polygon with side-length evidence",
      "wrongSolution": "The distance from (-2, 4) to (5, 4) is 3 because -2 + 5 = 3.",
      "prompts": [
        "Check whether the two points share an x-value or a y-value.",
        "For a horizontal segment, subtract the x-values (use absolute value).",
        "For a vertical segment, subtract the y-values (use absolute value).",
        "Add side lengths to find the perimeter of the polygon."
      ],
      "cerItems": [
        {
          "id": "9.5-a",
          "lessonId": "9.5",
          "title": "Length of a park side",
          "scenario": "Two corners of a park are at (-2, 4) and (5, 4). Alex says the distance is 3 because -2 + 5 = 3.",
          "question": "What is the distance between (-2, 4) and (5, 4)?",
          "evidence": "Same y-value, so it is horizontal. Distance = |5 - (-2)| = |7| = 7 units.",
          "reasoningTarget": "Explain that for points with the same y-value, distance is the absolute difference of the x-values, not their sum.",
          "level1": {
            "frame": "I claim the distance is ______ units because the points share the same ______, so I subtract the x-values: |5 - (-2)| = ______.",
            "frameEs": "Afirmo que la distancia es ______ unidades porque los puntos comparten la misma ______, asi resto las x: |5 - (-2)| = ______."
          },
          "level2": "Explain why adding -2 + 5 cannot give a distance, using the idea that distance is always positive.",
          "answerKey": "7 units."
        },
        {
          "id": "9.6-a",
          "lessonId": "9.6",
          "title": "Perimeter of the rectangle",
          "scenario": "A rectangular park has corners at (1, 1), (1, 5), (7, 5), and (7, 1).",
          "question": "What is the perimeter of the park?",
          "evidence": "Vertical side: |5 - 1| = 4. Horizontal side: |7 - 1| = 6. Perimeter = 2(4) + 2(6) = 20 units.",
          "reasoningTarget": "Explain that side lengths come from absolute differences of matching coordinates, then summed around the rectangle.",
          "level1": {
            "frame": "I claim the perimeter is ______ units because the sides are ______ and ______, and 2 times each gives ______.",
            "frameEs": "Afirmo que el perimetro es ______ unidades porque los lados son ______ y ______, y 2 por cada uno da ______."
          },
          "level2": "Find the area of this park as well, and explain how its units differ from the perimeter's units.",
          "answerKey": "Perimeter 20 units."
        },
        {
          "id": "9.7-a",
          "lessonId": "9.7",
          "title": "Map distance between two stops",
          "scenario": "On a city grid, the library is at (3, -2) and the park is at (3, 5). Each unit is one block.",
          "question": "How many blocks apart are the library and the park, and how do you know?",
          "evidence": "The points share the same x-value (3), so the distance is vertical. Distance = |5 - (-2)| = |7| = 7 blocks.",
          "claim": "I claim the two stops are 7 blocks apart because they share an x-coordinate, so I add the absolute values of the y-coordinates across zero.",
          "reasoningTarget": "Explain that when points share a coordinate, the distance is the absolute difference of the other coordinate, which works across the axis.",
          "level1": {
            "frame": "I claim the stops are ______ blocks apart because they share ______ and |5 - (-2)| = ______.",
            "frameEs": "Afirmo que las paradas estan a ______ cuadras porque comparten ______ y |5 - (-2)| = ______."
          },
          "level2": "If a third stop were at (-1, 5), explain how you would find its distance from the park at (3, 5).",
          "answerKey": "7 blocks (|5 - (-2)| = 7)."
        }
      ]
    },
    {
      "id": "u10-volume",
      "title": "Volume",
      "unit": "Unit 10 - Volume & Surface Area",
      "lessonIds": [
        "10.1",
        "10.2"
      ],
      "bigIdea": "Volume counts cubic units that fill a three-dimensional space.",
      "studentWin": "Find volume of rectangular prisms, including fractional edge lengths, and explain the units.",
      "challenge": "Design a storage box with fractional side lengths and calculate how much it can hold.",
      "modelKind": "volume",
      "scenario": "Storage box engineering",
      "misconception": "Adding edge lengths or using square units for volume.",
      "repairMove": "Build or imagine layers of unit cubes and label cubic units.",
      "hint": "Volume uses length times width times height.",
      "focus": "Rectangular prism volume with whole and fractional dimensions",
      "materials": "Prism sketch, layer model, unit labels",
      "roles": [
        "Dimension reader",
        "Layer modeler",
        "Unit checker"
      ],
      "defenseQuestions": [
        "What does each factor represent?",
        "Why are the units cubic?"
      ],
      "exitProduct": "A prism volume solution with units explained",
      "wrongSolution": "A 4 by 3 by 2 box has volume 9 square units because 4 + 3 + 2 = 9.",
      "prompts": [
        "Volume multiplies length, width, and height (three dimensions).",
        "Imagine filling the box with unit cubes, layer by layer.",
        "Multiply, do not add, the three edge lengths.",
        "Label the answer in cubic units."
      ],
      "cerItems": [
        {
          "id": "10.1-a",
          "lessonId": "10.1",
          "title": "Volume of the storage box",
          "scenario": "A box measures 4 ft long, 3 ft wide, and 2 ft tall. Jaden adds 4 + 3 + 2 = 9 and writes 9 square units.",
          "question": "What is the volume of the box, and what two mistakes did Jaden make?",
          "evidence": "Volume = l x w x h = 4 x 3 x 2 = 24 cubic feet. You multiply (not add), and volume uses cubic (not square) units.",
          "reasoningTarget": "Explain that volume multiplies three dimensions and is measured in cubic units because it fills space.",
          "level1": {
            "frame": "I claim the volume is ______ cubic feet because 4 times 3 times 2 equals ______, and volume uses ______ units because it fills space.",
            "frameEs": "Afirmo que el volumen es ______ pies cubicos porque 4 por 3 por 2 es ______, y el volumen usa unidades ______ porque llena espacio."
          },
          "level2": "Explain how many unit cubes are in one layer of this box and how many layers there are.",
          "answerKey": "24 cubic feet."
        },
        {
          "id": "10.2-a",
          "lessonId": "10.2",
          "title": "Volume with a fractional edge",
          "scenario": "A small box is 2 ft by 3 ft by 1/2 ft.",
          "question": "What is the volume of this box with a fractional height?",
          "evidence": "V = 2 x 3 x 1/2 = 6 x 1/2 = 3 cubic feet.",
          "reasoningTarget": "Explain that a fractional edge length less than 1 makes the volume smaller than the base layer alone.",
          "level1": {
            "frame": "I claim the volume is ______ cubic feet because 2 times 3 times 1/2 equals ______, and a height of 1/2 makes it ______ than a full layer.",
            "frameEs": "Afirmo que el volumen es ______ pies cubicos porque 2 por 3 por 1/2 es ______, y una altura de 1/2 lo hace ______ que una capa completa."
          },
          "level2": "Explain how the volume would change if the height were 1 1/2 ft instead, and why.",
          "answerKey": "3 cubic feet."
        }
      ]
    },
    {
      "id": "u10-surface-nets",
      "title": "Surface Area and Nets",
      "unit": "Unit 10 - Volume & Surface Area",
      "lessonIds": [
        "10.3",
        "10.4",
        "10.5"
      ],
      "bigIdea": "Surface area adds the areas of all outside faces, and nets help organize those faces.",
      "studentWin": "Match a solid to a net, calculate face areas, and total the surface area.",
      "challenge": "Create packaging for a prism or pyramid and calculate how much paper is needed.",
      "modelKind": "surface",
      "scenario": "Packaging design studio",
      "misconception": "Finding volume when the question asks for surface area or missing hidden faces.",
      "repairMove": "List every outside face before calculating.",
      "hint": "Surface area is measured in square units because it covers faces.",
      "focus": "Surface area of prisms, pyramids, and nets",
      "materials": "Net template, face-area checklist",
      "roles": [
        "Net matcher",
        "Face-area calculator",
        "Total auditor"
      ],
      "defenseQuestions": [
        "Did you include every outside face?",
        "How does the net match the solid?"
      ],
      "exitProduct": "A labeled net with total surface area",
      "wrongSolution": "A prism's surface area is length times width times height because it is 3D.",
      "prompts": [
        "Unfold the solid into a net so every face is visible.",
        "Find the area of each face (square units).",
        "Add all face areas, including hidden back and bottom faces.",
        "Remember surface area covers the outside, so it uses square units."
      ],
      "cerItems": [
        {
          "id": "10.3-a",
          "lessonId": "10.3",
          "title": "Wrapping paper for the box",
          "scenario": "A gift box is a rectangular prism 5 cm by 4 cm by 2 cm. Robin computes 5 x 4 x 2 = 40 for the paper needed.",
          "question": "What is the surface area (paper needed), and why is 40 wrong?",
          "evidence": "Faces: 2(5x4) + 2(5x2) + 2(4x2) = 40 + 20 + 16 = 76 sq cm. The value 40 is the volume, not surface area.",
          "reasoningTarget": "Explain that paper covers the outside faces, so surface area sums all six face areas, while 40 is the volume.",
          "level1": {
            "frame": "I claim the paper needed is ______ sq cm because the six faces total ______; the value 40 is the ______, not surface area.",
            "frameEs": "Afirmo que el papel necesario es ______ cm cuadrados porque las seis caras suman ______; el valor 40 es el ______, no el area de superficie."
          },
          "level2": "Explain how a net of this box helps make sure no face is forgotten, and how many faces there are.",
          "answerKey": "76 square cm (40 is the volume)."
        },
        {
          "id": "10.5-a",
          "lessonId": "10.5",
          "title": "Surface area from a net",
          "scenario": "A cube net shows 6 identical squares, each 3 cm by 3 cm.",
          "question": "What is the total surface area of the cube?",
          "evidence": "Each face = 3 x 3 = 9 sq cm. Six faces: 6 x 9 = 54 sq cm.",
          "reasoningTarget": "Explain that a net lays out all faces flat, so summing the face areas gives the total surface area.",
          "level1": {
            "frame": "I claim the surface area is ______ sq cm because each of the ______ faces is ______ sq cm, and 6 times 9 equals ______.",
            "frameEs": "Afirmo que el area de superficie es ______ cm cuadrados porque cada una de las ______ caras es ______ cm cuadrados, y 6 por 9 es ______."
          },
          "level2": "Explain why a cube's net must have exactly 6 faces and what would go wrong with only 5.",
          "answerKey": "54 square cm."
        },
        {
          "id": "10.4-a",
          "lessonId": "10.4",
          "title": "Wrap the square pyramid",
          "scenario": "A square pyramid has a base 6 cm on each side. Each of its 4 triangular faces has a base of 6 cm and a slant height of 5 cm.",
          "question": "What is the total surface area of the square pyramid?",
          "evidence": "Base area = 6 x 6 = 36 cm^2. Each triangle = (1/2)(6)(5) = 15 cm^2, and 4 triangles = 60 cm^2. Total surface area = 36 + 60 = 96 cm^2.",
          "claim": "I claim the surface area is 96 cm^2 because it is the square base (36) plus the 4 triangular faces (60).",
          "reasoningTarget": "Explain that surface area of a pyramid sums the base area and all lateral triangular faces, which the net makes visible as flat 2-D regions.",
          "level1": {
            "frame": "I claim the surface area is ______ because the base is ______ cm^2 and the ______ triangles total ______ cm^2.",
            "frameEs": "Afirmo que el area de superficie es ______ porque la base es ______ cm^2 y los ______ triangulos suman ______ cm^2."
          },
          "level2": "Explain why unfolding the pyramid into a net makes the surface area easier to calculate.",
          "answerKey": "96 cm^2 (base 36 + 4 triangles of 15)."
        }
      ]
    }
  ];

  var lessonById = lessons.reduce(function (map, lesson) {
    map[lesson.id] = lesson;
    return map;
  }, {});

  clusters.forEach(function (cluster) {
    var clusterLessons = cluster.lessonIds
      .map(function (id) {
        return lessonById[id];
      })
      .filter(Boolean);
    var standards = clusterLessons
      .map(function (lesson) {
        return lesson.standard;
      })
      .filter(function (standard, index, list) {
        return list.indexOf(standard) === index;
      });

    cluster.lessonRange = cluster.lessonIds.join(", ");
    cluster.lessonTitles = clusterLessons
      .map(function (lesson) {
        return lesson.id + " " + lesson.title;
      })
      .join(", ");
    cluster.lessons = cluster.lessonTitles;
    cluster.standard = standards.join(", ");
    cluster.modelLabel = cluster.modelKind.charAt(0).toUpperCase() + cluster.modelKind.slice(1) + " model";
    if (!Array.isArray(cluster.prompts) || cluster.prompts.length === 0) {
      cluster.prompts = [
        "What is the math goal in this situation?",
        "Which model gives the clearest evidence?",
        "What mistake would be tempting here?",
        "How can the answer be checked in context?",
      ];
    }

    clusterLessons.forEach(function (lesson) {
      lesson.clusterId = cluster.id;
      lesson.modelKind = cluster.modelKind;
      lesson.clusterTitle = cluster.title;
      lesson.cerItems = (cluster.cerItems || []).filter(function (item) {
        return item.lessonId === lesson.id;
      });
    });
  });

  window.REVEAL_MATH_UNITS = units;
  window.REVEAL_MATH_LESSONS = lessons;
  window.REVEAL_MATH_CLUSTERS = clusters;
})();
