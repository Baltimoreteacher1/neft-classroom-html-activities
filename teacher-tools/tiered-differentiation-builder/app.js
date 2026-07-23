/**
 * Tiered Differentiation Builder — Neft Teacher Tools
 * Grade 6 Math 3-Tier Workstation & Small-Group Generator
 */

(function () {
  "use strict";

  // Curriculum Data Repository: Grade 6 Math Units & Lessons
  const CURRICULUM_DATA = {
    "1": {
      title: "Unit 1: Ratios & Unit Rates",
      standard: "6.RP.A.1, 6.RP.A.2, 6.RP.A.3",
      lessons: [
        {
          id: "1-1",
          name: "Lesson 1-1: Concept of Ratios & Comparisons",
          objective: "Students will model and express ratio relationships using visual tape diagrams, colon notation, and fractional comparisons.",
          t1: {
            strategy: "Use tape diagrams to count equal parts. Compare blue blocks to yellow blocks.",
            visualType: "tape",
            params: { a: 3, b: 5, labelA: "Blue Paint (cups)", labelB: "Yellow Paint (cups)" },
            sentenceFrames: [
              "• The ratio of blue cups to yellow cups is [3] to [5].",
              "• For every 3 cups of blue paint, there are 5 cups of yellow paint.",
              "• The total number of equal parts is 3 + 5 = 8 parts."
            ],
            problems: [
              { num: 1, prompt: "A recipe mixes 3 cups of flour with 2 cups of sugar. Draw a tape diagram and write the ratio of flour to sugar in 3 different ways." },
              { num: 2, prompt: "In a class of 24 students, 15 wear sneakers and 9 wear boots. What is the ratio of sneaker-wearers to total students?" },
              { num: 3, prompt: "A sports bag has 4 soccer balls and 6 basketballs. Fill in the blank: For every 2 soccer balls, there are ___ basketballs." }
            ]
          },
          t2: {
            problems: [
              { num: 1, prompt: "An art teacher mixes 12 ounces of red paint with 18 ounces of white paint to make pink. Write the ratio of red to white paint in simplest form." },
              { num: 2, prompt: "In a fruit basket, the ratio of apples to oranges is 4 : 7. If there are 28 oranges, how many apples are in the basket?" },
              { num: 3, prompt: "A runner completes 6 laps in 15 minutes. At this same rate, how many laps can they run in 40 minutes?" },
              { num: 4, prompt: "Compare Ratio A (5 : 8) and Ratio B (15 : 24). Are these ratios equivalent? Explain your mathematical reasoning." }
            ],
            mistake: {
              studentWork: "Marcus says: 'The ratio of boys to girls in our club is 4 to 5, so 4/5 of the club members are boys.'",
              question: "What error did Marcus make? How would you explain the correct part-to-whole ratio to him?"
            }
          },
          t3: {
            scenario: "A juice manufacturing plant creates 'Tropical Spark' by mixing pineapple, mango, and orange juice in a 3 : 2 : 5 ratio. The main mixing tank holds 500 gallons.",
            problems: [
              { num: 1, prompt: "Calculate exact gallon amounts for each flavor required to fill the 500-gallon tank. Show your step-by-step ratio scaling." },
              { num: 2, prompt: "If the cost of pineapple juice is $2.50/gal, mango is $4.00/gal, and orange is $1.80/gal, determine the total production cost for one full tank." }
            ],
            defense: "A distributor claims that increasing mango content by 20% won't significantly change the flavor ratio or cost. Construct a mathematical argument agreeing or disagreeing with evidence."
          }
        },
        {
          id: "1-2",
          name: "Lesson 1-2: Equivalent Ratios & Ratio Tables",
          objective: "Students will construct and analyze ratio tables to find equivalent ratios and solve multiplicative problems.",
          t1: {
            strategy: "Multiply or divide both rows by the same number to scale ratio tables.",
            visualType: "double_line",
            params: { labelA: "Miles Traveled", valA: 45, labelB: "Hours Driven", valB: 1 },
            sentenceFrames: [
              "• To get the next ratio in the table, I multiply both numbers by [2].",
              "• The multiplier across rows must stay the same to keep ratios equivalent."
            ],
            problems: [
              { num: 1, prompt: "Complete the ratio table: Miles (45, 90, ___, 180) vs. Hours (1, 2, 3, ___)." },
              { num: 2, prompt: "A baker uses 2 cups of sugar for every 5 cups of flour. How much flour is needed for 6 cups of sugar?" }
            ]
          },
          t2: {
            problems: [
              { num: 1, prompt: "Create a ratio table to determine if a store selling 3 t-shirts for $24 is offering the same unit deal as 7 t-shirts for $56." },
              { num: 2, prompt: "A car travels 180 miles on 6 gallons of gas. Use a ratio table to find how far it can travel on 14 gallons." }
            ],
            mistake: {
              studentWork: "Elena created a ratio table adding 3 to the top row and adding 3 to the bottom row (Ratio 2:5 became 5:8).",
              question: "Why does adding the same amount to both terms fail to create equivalent ratios?"
            }
          },
          t3: {
            scenario: "Two competing delivery services charge rates based on distance and package weight. Service A charges $12 for 15 miles. Service B charges $18 for 24 miles.",
            problems: [
              { num: 1, prompt: "Model both pricing structures across distances up to 120 miles. Determine the break-even point." }
            ],
            defense: "Which service should a business choose if 80% of their deliveries are under 20 miles? Justify your choice."
          }
        }
      ]
    },
    "2": {
      title: "Unit 2: Fractions & Decimals",
      standard: "6.NS.A.1, 6.NS.B.3",
      lessons: [
        {
          id: "2-1",
          name: "Lesson 2-1: Dividing Fractions by Fractions",
          objective: "Students will compute quotients of fractions using visual fraction models and reciprocal algorithm explanations.",
          t1: {
            strategy: "Use fraction area models to see how many groups fit inside the dividend.",
            visualType: "fraction_bar",
            params: { num: 3, den: 4 },
            sentenceFrames: [
              "• We are asking: 'How many [1/4] pieces fit inside [3/4]?'",
              "• To divide by a fraction, we multiply by its reciprocal (flip the fraction)."
            ],
            problems: [
              { num: 1, prompt: "Shade a fraction bar showing 3/4. How many 1/8 pieces fit inside 3/4?" },
              { num: 2, prompt: "Calculate (2/3) ÷ (1/6) using the reciprocal method." }
            ]
          },
          t2: {
            problems: [
              { num: 1, prompt: "A container has 5/6 gallons of water. If each glass holds 5/12 gallons, how many glasses can be filled completely?" },
              { num: 2, prompt: "Solve (4/5) ÷ (2/3) and simplify your answer to a mixed number." }
            ],
            mistake: {
              studentWork: "Sam calculated (3/5) ÷ (1/2) = (3/5) × (1/2) = 3/10.",
              question: "What mistake did Sam make when setting up the reciprocal?"
            }
          },
          t3: {
            scenario: "A construction company has a wooden beam 8 3/4 feet long. Workers need to cut it into equal fence posts that are 1 1/4 feet each.",
            problems: [
              { num: 1, prompt: "Calculate how many complete posts can be made and determine the exact length of the remaining leftover wood." }
            ],
            defense: "Defend whether it is more efficient to convert mixed numbers to improper fractions or decimals when working with jobsite measurements."
          }
        }
      ]
    },
    "3": {
      title: "Unit 3: Integers & Rational Numbers",
      standard: "6.NS.C.5, 6.NS.C.6, 6.NS.C.7",
      lessons: [
        {
          id: "3-1",
          name: "Lesson 3-1: Positive & Negative Numbers on Number Line",
          objective: "Students will plot integers on a horizontal number line and understand opposite quantities and absolute value.",
          t1: {
            strategy: "Zero is the origin. Positive moves right; negative moves left.",
            visualType: "integer_line",
            params: { min: -10, max: 10, highlight: -4 },
            sentenceFrames: [
              "• -4 is [4 units to the left] of zero.",
              "• The absolute value |-4| is 4 because distance is always positive."
            ],
            problems: [
              { num: 1, prompt: "Plot -6, 3, and -2 on the number line. Which integer has the greatest value?" },
              { num: 2, prompt: "A submarine is 50 feet below sea level (-50). A bird is 30 feet above sea level (+30). Draw a vertical number line." }
            ]
          },
          t2: {
            problems: [
              { num: 1, prompt: "Order the following rational numbers from least to greatest: -3.5, 2, -4, 0, 1.25, -1/2." },
              { num: 2, prompt: "Evaluate: |-15| + |8| - |-3|." }
            ],
            mistake: {
              studentWork: "Jordan states: '-8 is greater than -2 because 8 is bigger than 2.'",
              question: "Explain why Jordan is incorrect using a horizontal number line explanation."
            }
          },
          t3: {
            scenario: "A meteorologist tracks winter temperatures in Anchorage, Alaska. At midnight it was -12°F. By 6:00 AM it dropped 5°F. By noon it rose 14°F.",
            problems: [
              { num: 1, prompt: "Calculate the noon temperature and write an integer expression to model the total temperature shift." }
            ],
            defense: "Construct a real-world financial balance sheet scenario showing how absolute value represents total debt regardless of signs."
          }
        }
      ]
    },
    "4": {
      title: "Unit 4: Expressions & Equations",
      standard: "6.EE.A.2, 6.EE.B.6, 6.EE.B.7",
      lessons: [
        {
          id: "4-1",
          name: "Lesson 4-1: Solving One-Step Addition & Subtraction Equations",
          objective: "Students will solve one-step equations using inverse operations and balance scale properties of equality.",
          t1: {
            strategy: "Whatever operation you perform on one side of the equal sign, you must do to the other side.",
            visualType: "balance_scale",
            params: { left: "x + 4", right: "12" },
            sentenceFrames: [
              "• The variable x represents the unknown quantity.",
              "• To undo adding 4, I subtract 4 from both sides."
            ],
            problems: [
              { num: 1, prompt: "Solve x + 7 = 15 using a balance scale model." },
              { num: 2, prompt: "Solve y - 5 = 11. Check your solution by substitution." }
            ]
          },
          t2: {
            problems: [
              { num: 1, prompt: "Solve 4.5 + m = 12.2. Show all algebraic steps." },
              { num: 2, prompt: "A store clerk sells a shirt for $18 after a $6 discount. Write and solve an equation (p - 6 = 18) to find original price p." }
            ],
            mistake: {
              studentWork: "Tyler solved x + 9 = 21 by adding 9 to both sides: x = 30.",
              question: "What inverse operation error occurred? Show the correct algebraic solution."
            }
          },
          t3: {
            scenario: "A school fundraiser earns money by selling tickets t for $8 each with an upfront equipment rental fee of $45.",
            problems: [
              { num: 1, prompt: "Write an algebraic expression for net profit and determine how many tickets must be sold to profit $355." }
            ],
            defense: "Defend why using inverse operations preserves equality mathematically compared to trial-and-error guessing."
          }
        }
      ]
    },
    "5": {
      title: "Unit 5: Area & Geometry",
      standard: "6.G.A.1",
      lessons: [
        {
          id: "5-1",
          name: "Lesson 5-1: Area of Parallelograms & Triangles",
          objective: "Students will decompose polygons into rectangles and triangles to derive and apply area formulas.",
          t1: {
            strategy: "Area of Triangle = (Base × Height) ÷ 2. Height must be perpendicular to base.",
            visualType: "coord_grid",
            params: {},
            sentenceFrames: [
              "• The base is [6 units] and the height is [4 units].",
              "• Area = (6 × 4) / 2 = 12 square units."
            ],
            problems: [
              { num: 1, prompt: "A triangle has base 8 cm and perpendicular height 5 cm. Calculate its area." },
              { num: 2, prompt: "Find the area of a parallelogram with base 10 in and height 4 in." }
            ]
          },
          t2: {
            problems: [
              { num: 1, prompt: "Calculate the area of a composite shape made of a rectangle (6m × 4m) and a right triangle (base 3m, height 4m)." },
              { num: 2, prompt: "A trapezoid has parallel bases 8 cm and 12 cm with height 6 cm. Find its area by splitting it into two triangles." }
            ],
            mistake: {
              studentWork: "Chloe multiplied the base by the slant side length instead of perpendicular height to find parallelogram area.",
              question: "Why must height be perpendicular (90°) to the base when finding area?"
            }
          },
          t3: {
            scenario: "An architect designs a park lawn shaped as an irregular polygon. The park is split into 3 triangular sectors on a coordinate grid.",
            problems: [
              { num: 1, prompt: "Calculate total square footage and estimate sod cost at $0.85 per square foot." }
            ],
            defense: "Construct a proof showing why any triangle has exactly half the area of a bounding parallelogram with identical base and height."
          }
        }
      ]
    },
    "6": {
      title: "Unit 6: Volume & Surface Area",
      standard: "6.G.A.2, 6.G.A.4",
      lessons: [
        {
          id: "6-1",
          name: "Lesson 6-1: Volume with Fractional Edge Lengths",
          objective: "Students will calculate volume of rectangular prisms with fractional edges using V = l × w × h and unit cube packing.",
          t1: {
            strategy: "Volume = Length × Width × Height. Count unit cubes with fractional dimensions.",
            visualType: "fraction_bar",
            params: { num: 1, den: 2 },
            sentenceFrames: [
              "• The prism is [2 1/2] inches long, [1 1/2] inches wide, and [3] inches high.",
              "• V = (5/2) × (3/2) × 3 = 45/4 = 11 1/4 cubic inches."
            ],
            problems: [
              { num: 1, prompt: "Find volume of a box: L = 4 cm, W = 2 1/2 cm, H = 3 cm." },
              { num: 2, prompt: "How many 1/2-cm unit cubes fill a prism with dimensions 2 cm × 1 1/2 cm × 3 cm?" }
            ]
          },
          t2: {
            problems: [
              { num: 1, prompt: "A shipping crate has dimensions 3 1/3 ft × 2 1/4 ft × 4 ft. Calculate total volume in cubic feet." }
            ],
            mistake: {
              studentWork: "Leo added the edge lengths together (3 1/2 + 2 + 4 = 9 1/2) to find volume.",
              question: "Explain the difference between perimeter/distance and 3D volume units."
            }
          },
          t3: {
            scenario: "A warehouse needs to store 1,200 small cubic boxes (1/2 ft each side) into larger shipping containers.",
            problems: [
              { num: 1, prompt: "Design container dimensions that minimize surface area while holding all 1,200 boxes." }
            ],
            defense: "Explain mathematically why a cube shape minimizes surface area for a given volume."
          }
        }
      ]
    },
    "7": {
      title: "Unit 7: Percents & Proportions",
      standard: "6.RP.A.3.C",
      lessons: [
        {
          id: "7-1",
          name: "Lesson 7-1: Finding Percent of a Quantity",
          objective: "Students will find percentages of whole numbers using double number lines and benchmark fractions.",
          t1: {
            strategy: "10% is dividing by 10. 25% is 1/4. 50% is half.",
            visualType: "double_line",
            params: { labelA: "Percent (%)", valA: 100, labelB: "Total Amount ($)", valB: 80 },
            sentenceFrames: [
              "• 10% of $80 is $8.",
              "• 30% of $80 is 3 × $8 = $24."
            ],
            problems: [
              { num: 1, prompt: "Find 25% of 60 using benchmark fractions." },
              { num: 2, prompt: "A shirt originally costs $40. It is on sale for 20% off. What is the discount amount?" }
            ]
          },
          t2: {
            problems: [
              { num: 1, prompt: "Calculate 35% of 240 students who prefer chocolate milk." },
              { num: 2, prompt: "A restaurant bill is $65. Calculate a 18% tip and total bill amount." }
            ],
            mistake: {
              studentWork: "To find 15% of $80, a student multiplied 80 × 15 = 1200.",
              question: "Where did the student forget to place the decimal point or percent fraction?"
            }
          },
          t3: {
            scenario: "A retail store marks up wholesale items by 40%, then offers a 20% clearance coupon at checkout.",
            problems: [
              { num: 1, prompt: "Does marking up 40% then discounting 20% result in a net 20% profit? Calculate exact numbers for a $50 item." }
            ],
            defense: "Prove mathematically why consecutive percentages cannot be simply added or subtracted."
          }
        }
      ]
    },
    "8": {
      title: "Unit 8: Statistics & Data Distributions",
      standard: "6.SP.A.2, 6.SP.B.5",
      lessons: [
        {
          id: "8-1",
          name: "Lesson 8-1: Mean, Median, Mode & Range",
          objective: "Students will summarize numerical data sets using measures of center and variability.",
          t1: {
            strategy: "Mean = sum divided by count. Median = middle number when ordered.",
            visualType: "box_plot",
            params: {},
            sentenceFrames: [
              "• To find the median, first order numbers from smallest to largest.",
              "• The middle number is [median]."
            ],
            problems: [
              { num: 1, prompt: "Find the median of test scores: 80, 85, 90, 95, 100." },
              { num: 2, prompt: "Calculate the mean score for: 4, 8, 6, 10, 2." }
            ]
          },
          t2: {
            problems: [
              { num: 1, prompt: "Given data set: 12, 15, 18, 22, 22, 30, 45. Calculate Mean, Median, Mode, and Range." }
            ],
            mistake: {
              studentWork: "Student found median of {15, 8, 22, 10, 12} as 22 by picking the middle number in the unordered list.",
              question: "What essential first step did the student skip?"
            }
          },
          t3: {
            scenario: "A salary survey at a company lists 9 workers earning $40,000 and 1 CEO earning $1,000,000.",
            problems: [
              { num: 1, prompt: "Calculate both Mean and Median salary. Explain which measure accurately represents typical employee pay." }
            ],
            defense: "Write a statistical recommendation on when median is superior to mean for skewed distributions."
          }
        }
      ]
    },
    "9": {
      title: "Unit 9: Coordinate Plane & Geometry",
      standard: "6.NS.C.8, 6.G.A.3",
      lessons: [
        {
          id: "9-1",
          name: "Lesson 9-1: Distance on Coordinate Plane",
          objective: "Students will plot points in all 4 quadrants and find vertical/horizontal distances using absolute values.",
          t1: {
            strategy: "If x-coordinates or y-coordinates are the same, subtract absolute values to find distance.",
            visualType: "coord_grid",
            params: {},
            sentenceFrames: [
              "• Point A is at (-3, 4) in Quadrant II.",
              "• Point B is at (-3, -5) in Quadrant III.",
              "• Distance = |4| + |-5| = 9 units."
            ],
            problems: [
              { num: 1, prompt: "Plot points A(2, 5) and B(2, -3). What is the distance between them?" }
            ]
          },
          t2: {
            problems: [
              { num: 1, prompt: "Vertices of a rectangle are (-4, 3), (2, 3), (2, -2), and (-4, -2). Calculate perimeter and area." }
            ],
            mistake: {
              studentWork: "To find distance between (-5, 2) and (3, 2), student calculated |-5| - |3| = 2.",
              question: "Why do we add absolute values when points lie in different quadrants?"
            }
          },
          t3: {
            scenario: "A city map is graphed on a coordinate plane with key landmarks at various grid coordinates.",
            problems: [
              { num: 1, prompt: "Determine shortest path along grid lines connecting 4 locations and calculate total walking distance." }
            ],
            defense: "Explain how absolute value guarantees distance is always positive regardless of negative coordinate signs."
          }
        }
      ]
    },
    "10": {
      title: "Unit 10: Cumulative EOY Review",
      standard: "Grade 6 CCSS All Standards",
      lessons: [
        {
          id: "10-1",
          name: "Lesson 10-1: Grade 6 Standards Benchmark Review",
          objective: "Students will solve comprehensive multi-domain Grade 6 math tasks.",
          t1: {
            strategy: "Break complex multi-step problems into smaller key steps.",
            visualType: "tape",
            params: { a: 2, b: 3, labelA: "Ratio A", labelB: "Ratio B" },
            sentenceFrames: ["• Step 1: Identify standard operations.", "• Step 2: Use visual model to verify."],
            problems: [
              { num: 1, prompt: "Solve 3/4 ÷ 1/2, then convert your answer to a decimal." }
            ]
          },
          t2: {
            problems: [
              { num: 1, prompt: "A car travels at 60 mph. Write an equation y = 60x and plot on coordinate plane." }
            ],
            mistake: {
              studentWork: "Confused surface area formula with volume formula.",
              question: "Clarify 2D surface area vs 3D volume."
            }
          },
          t3: {
            scenario: "Design a full scale city budget plan incorporating ratios, area, volume, and statistics.",
            problems: [
              { num: 1, prompt: "Complete comprehensive budget and spatial analysis report." }
            ],
            defense: "Defend mathematical choices in urban planning presentation."
          }
        }
      ]
    }
  };

  // State Management
  let currentState = {
    unitId: "1",
    lessonIndex: 0,
    customTopic: "",
    visualType: "auto",
    esolLevel: "wida3",
    theme: "light",
    savedPackages: []
  };

  // SVG Visual Rendering Engines (Rule 3: inline SVG, style="background:white", explicit width/height)
  function generateTapeDiagramSvg(params) {
    const a = params.a || 3;
    const b = params.b || 5;
    const labelA = params.labelA || "Part A";
    const labelB = params.labelB || "Part B";

    const boxW = 40;
    const boxH = 32;
    const startX = 140;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="120" viewBox="0 0 540 120" style="background:white; font-family:sans-serif;">`;
    
    // Part A Row
    svg += `<text x="10" y="32" font-size="13" font-weight="bold" fill="#15487f">${labelA} (${a}):</text>`;
    for (let i = 0; i < a; i++) {
      svg += `<rect x="${startX + i * (boxW + 4)}" y="12" width="${boxW}" height="${boxH}" rx="4" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>`;
    }

    // Part B Row
    svg += `<text x="10" y="82" font-size="13" font-weight="bold" fill="#256b5b">${labelB} (${b}):</text>`;
    for (let i = 0; i < b; i++) {
      svg += `<rect x="${startX + i * (boxW + 4)}" y="62" width="${boxW}" height="${boxH}" rx="4" fill="#10b981" stroke="#047857" stroke-width="2"/>`;
    }

    svg += `</svg>`;
    return svg;
  }

  function generateDoubleNumberLineSvg(params) {
    const labelA = params.labelA || "Quantity A";
    const valA = params.valA || 45;
    const labelB = params.labelB || "Quantity B";
    const valB = params.valB || 1;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="130" viewBox="0 0 540 130" style="background:white; font-family:sans-serif;">`;
    
    // Top Line
    svg += `<text x="10" y="25" font-size="12" font-weight="bold" fill="#15487f">${labelA}</text>`;
    svg += `<line x1="120" y1="35" x2="500" y2="35" stroke="#15487f" stroke-width="3"/>`;
    
    // Bottom Line
    svg += `<text x="10" y="85" font-size="12" font-weight="bold" fill="#256b5b">${labelB}</text>`;
    svg += `<line x1="120" y1="95" x2="500" y2="95" stroke="#256b5b" stroke-width="3"/>`;

    // Ticks
    for (let i = 0; i <= 4; i++) {
      const x = 120 + i * 90;
      const numA = i * valA;
      const numB = i * valB;

      // Top Tick
      svg += `<line x1="${x}" y1="28" x2="${x}" y2="42" stroke="#15487f" stroke-width="2"/>`;
      svg += `<text x="${x}" y="20" font-size="11" text-anchor="middle" fill="#14223a">${numA}</text>`;

      // Bottom Tick
      svg += `<line x1="${x}" y1="88" x2="${x}" y2="102" stroke="#256b5b" stroke-width="2"/>`;
      svg += `<text x="${x}" y="118" font-size="11" text-anchor="middle" fill="#14223a">${numB}</text>`;

      // Connecting guide line
      svg += `<line x1="${x}" y1="42" x2="${x}" y2="88" stroke="#cbd5e1" stroke-dasharray="3 3" stroke-width="1"/>`;
    }

    svg += `</svg>`;
    return svg;
  }

  function generateIntegerNumberLineSvg(params) {
    const min = params.min || -10;
    const max = params.max || 10;
    const highlight = params.highlight !== undefined ? params.highlight : -4;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="540" height="90" viewBox="0 0 540 90" style="background:white; font-family:sans-serif;">`;
    
    // Main Axis Line
    svg += `<line x1="30" y1="45" x2="510" y2="45" stroke="#1e293b" stroke-width="3"/>`;
    svg += `<polygon points="510,40 525,45 510,50" fill="#1e293b"/>`;
    svg += `<polygon points="30,40 15,45 30,50" fill="#1e293b"/>`;

    const totalSteps = max - min;
    const stepPx = 480 / totalSteps;

    for (let val = min; val <= max; val += 2) {
      const x = 30 + (val - min) * stepPx;
      const isZero = val === 0;
      const isHL = val === highlight;

      svg += `<line x1="${x}" y1="35" x2="${x}" y2="55" stroke="${isZero ? '#dc2626' : '#64748b'}" stroke-width="${isZero ? 3 : 1.5}"/>`;
      svg += `<text x="${x}" y="72" font-size="11" text-anchor="middle" font-weight="${isZero || isHL ? 'bold' : 'normal'}" fill="${isZero ? '#dc2626' : '#1e293b'}">${val}</text>`;

      if (isHL) {
        svg += `<circle cx="${x}" cy="45" r="7" fill="#256b5b" stroke="#047857" stroke-width="2"/>`;
        svg += `<text x="${x}" y="22" font-size="11" font-weight="bold" text-anchor="middle" fill="#256b5b">Value (${val})</text>`;
      }
    }

    svg += `</svg>`;
    return svg;
  }

  function generateFractionBarSvg(params) {
    const num = params.num || 3;
    const den = params.den || 4;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="90" viewBox="0 0 500 90" style="background:white; font-family:sans-serif;">`;
    
    const barW = 440;
    const barH = 40;
    const cellW = barW / den;

    svg += `<rect x="30" y="25" width="${barW}" height="${barH}" rx="6" fill="#f1f5f9" stroke="#334155" stroke-width="2"/>`;

    for (let i = 0; i < den; i++) {
      const x = 30 + i * cellW;
      const isShaded = i < num;
      svg += `<rect x="${x}" y="25" width="${cellW}" height="${barH}" fill="${isShaded ? '#3b82f6' : 'transparent'}" stroke="#334155" stroke-width="1.5"/>`;
      svg += `<text x="${x + cellW / 2}" y="50" font-size="12" font-weight="bold" text-anchor="middle" fill="${isShaded ? '#ffffff' : '#64748b'}">1/${den}</text>`;
    }

    svg += `<text x="250" y="80" font-size="12" font-weight="bold" text-anchor="middle" fill="#1e40af">Shaded Fraction: ${num}/${den}</text>`;
    svg += `</svg>`;
    return svg;
  }

  function generateBalanceScaleSvg(params) {
    const left = params.left || "x + 4";
    const right = params.right || "12";

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="110" viewBox="0 0 500 110" style="background:white; font-family:sans-serif;">`;
    
    // Base Fulcrum
    svg += `<polygon points="250,60 230,100 270,100" fill="#475569"/>`;
    svg += `<line x1="100" y1="60" x2="400" y2="60" stroke="#334155" stroke-width="5"/>`;

    // Left Pan
    svg += `<line x1="120" y1="60" x2="120" y2="85" stroke="#64748b" stroke-width="2"/>`;
    svg += `<rect x="70" y="85" width="100" height="18" rx="4" fill="#3b82f6"/>`;
    svg += `<text x="120" y="98" font-size="12" font-weight="bold" text-anchor="middle" fill="#ffffff">${left}</text>`;

    // Right Pan
    svg += `<line x1="380" y1="60" x2="380" y2="85" stroke="#64748b" stroke-width="2"/>`;
    svg += `<rect x="330" y="85" width="100" height="18" rx="4" fill="#10b981"/>`;
    svg += `<text x="380" y="98" font-size="12" font-weight="bold" text-anchor="middle" fill="#ffffff">${right}</text>`;

    svg += `<text x="250" y="30" font-size="13" font-weight="bold" text-anchor="middle" fill="#15487f">Balanced Equation: ${left} = ${right}</text>`;
    svg += `</svg>`;
    return svg;
  }

  function generateCoordinateGridSvg() {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="240" viewBox="0 0 300 240" style="background:white; font-family:sans-serif;">`;
    
    // Grid Lines
    for (let x = 30; x <= 270; x += 30) {
      svg += `<line x1="${x}" y1="20" x2="${x}" y2="220" stroke="#e2e8f0" stroke-width="1"/>`;
    }
    for (let y = 20; y <= 220; y += 25) {
      svg += `<line x1="30" y1="${y}" x2="270" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
    }

    // Axes
    svg += `<line x1="150" y1="20" x2="150" y2="220" stroke="#0f172a" stroke-width="2"/>`; // Y axis
    svg += `<line x1="30" y1="120" x2="270" y2="120" stroke="#0f172a" stroke-width="2"/>`; // X axis

    // Labels
    svg += `<text x="260" y="115" font-size="10" font-weight="bold" fill="#0f172a">x</text>`;
    svg += `<text x="155" y="30" font-size="10" font-weight="bold" fill="#0f172a">y</text>`;
    svg += `<circle cx="210" cy="70" r="5" fill="#ef4444"/>`;
    svg += `<text x="220" y="65" font-size="10" font-weight="bold" fill="#ef4444">Point A (2, 2)</text>`;

    svg += `</svg>`;
    return svg;
  }

  function generateBoxPlotSvg() {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="90" viewBox="0 0 500 90" style="background:white; font-family:sans-serif;">`;
    
    svg += `<line x1="40" y1="70" x2="460" y2="70" stroke="#334155" stroke-width="2"/>`;
    
    // Box
    svg += `<rect x="140" y="25" width="200" height="30" fill="#dbeafe" stroke="#1d4ed8" stroke-width="2"/>`;
    svg += `<line x1="220" y1="25" x2="220" y2="55" stroke="#1d4ed8" stroke-width="3"/>`; // Median

    // Whiskers
    svg += `<line x1="70" y1="40" x2="140" y2="40" stroke="#1d4ed8" stroke-width="2"/>`;
    svg += `<line x1="70" y1="30" x2="70" y2="50" stroke="#1d4ed8" stroke-width="2"/>`; // Min

    svg += `<line x1="340" y1="40" x2="410" y2="40" stroke="#1d4ed8" stroke-width="2"/>`;
    svg += `<line x1="410" y1="30" x2="410" y2="50" stroke="#1d4ed8" stroke-width="2"/>`; // Max

    svg += `<text x="220" y="18" font-size="11" font-weight="bold" text-anchor="middle" fill="#1e40af">Median = 22</text>`;
    svg += `</svg>`;
    return svg;
  }

  function getVisualSvg(type, params) {
    switch (type) {
      case "tape":
        return generateTapeDiagramSvg(params || {});
      case "double_line":
        return generateDoubleNumberLineSvg(params || {});
      case "integer_line":
        return generateIntegerNumberLineSvg(params || {});
      case "fraction_bar":
        return generateFractionBarSvg(params || {});
      case "balance_scale":
        return generateBalanceScaleSvg(params || {});
      case "coord_grid":
        return generateCoordinateGridSvg();
      case "box_plot":
        return generateBoxPlotSvg();
      default:
        return generateTapeDiagramSvg(params || {});
    }
  }

  // DOM Elements
  const unitSelect = document.getElementById("unitSelect");
  const lessonSelect = document.getElementById("lessonSelect");
  const customTopicWrap = document.getElementById("customTopicWrap");
  const customTopicInput = document.getElementById("customTopicInput");
  const visualModelSelect = document.getElementById("visualModelSelect");
  const esolLevelSelect = document.getElementById("esolLevelSelect");
  const generateBtn = document.getElementById("generateBtn");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const historyList = document.getElementById("historyList");

  const tabOverview = document.getElementById("tab-overview");
  const tabTier1 = document.getElementById("tab-tier1");
  const tabTier2 = document.getElementById("tab-tier2");
  const tabTier3 = document.getElementById("tab-tier3");

  const panelOverview = document.getElementById("panel-overview");
  const panelTier1 = document.getElementById("panel-tier1");
  const panelTier2 = document.getElementById("panel-tier2");
  const panelTier3 = document.getElementById("panel-tier3");

  const printBtn = document.getElementById("printBtn");
  const copyDocBtn = document.getElementById("copyDocBtn");
  const savePkgBtn = document.getElementById("savePkgBtn");

  // Populate Lessons Dropdown
  function populateLessons(unitKey) {
    lessonSelect.innerHTML = "";
    if (unitKey === "custom") {
      customTopicWrap.hidden = false;
      const opt = document.createElement("option");
      opt.value = "0";
      opt.textContent = "Custom Workstation";
      lessonSelect.appendChild(opt);
      return;
    }

    customTopicWrap.hidden = true;
    const unit = CURRICULUM_DATA[unitKey];
    if (!unit) return;

    unit.lessons.forEach((l, idx) => {
      const opt = document.createElement("option");
      opt.value = idx.toString();
      opt.textContent = l.name;
      lessonSelect.appendChild(opt);
    });
  }

  // Render Current Package into Output UI
  function renderWorkstationPackage(pkgData) {
    // Overview Panel
    document.getElementById("metaStandardBadge").textContent = pkgData.standard;
    document.getElementById("metaTitle").textContent = pkgData.lessonName;
    document.getElementById("metaObjective").textContent = "Objective: " + pkgData.objective;

    // Tier 1
    document.getElementById("t1-title").textContent = "Tier 1 Workstation: " + pkgData.lessonName;
    const t1SvgBox = document.getElementById("t1-svg-container");
    t1SvgBox.innerHTML = getVisualSvg(pkgData.t1.visualType, pkgData.t1.params);

    const sentenceFramesEl = document.getElementById("t1-sentence-frames");
    sentenceFramesEl.innerHTML = pkgData.t1.sentenceFrames.join("<br/>");

    const t1ProbsEl = document.getElementById("t1-problems");
    t1ProbsEl.innerHTML = pkgData.t1.problems
      .map(
        p => `
      <div class="problem-card">
        <div class="problem-header"><span class="problem-num">Problem ${p.num}</span></div>
        <p class="problem-prompt">${p.prompt}</p>
        <div class="work-space">✍️ Show step-by-step visual work here:</div>
      </div>`
      )
      .join("");

    // Tier 2
    document.getElementById("t2-title").textContent = "Tier 2 Workstation: " + pkgData.lessonName;
    const t2ProbsEl = document.getElementById("t2-problems");
    t2ProbsEl.innerHTML = pkgData.t2.problems
      .map(
        p => `
      <div class="problem-card">
        <div class="problem-header"><span class="problem-num">Problem ${p.num}</span></div>
        <p class="problem-prompt">${p.prompt}</p>
        <div class="work-space">✍️ Show calculation work and final answer:</div>
      </div>`
      )
      .join("");

    const t2MistakeEl = document.getElementById("t2-error-analysis");
    t2MistakeEl.innerHTML = `
      <p><strong>Student Statement:</strong> <em>"${pkgData.t2.mistake.studentWork}"</em></p>
      <p><strong>Your Task:</strong> ${pkgData.t2.mistake.question}</p>
    `;

    // Tier 3
    document.getElementById("t3-title").textContent = "Tier 3 Workstation: " + pkgData.lessonName;
    document.getElementById("t3-scenario").innerHTML = `<p>${pkgData.t3.scenario}</p>`;

    const t3ProbsEl = document.getElementById("t3-problems");
    t3ProbsEl.innerHTML = pkgData.t3.problems
      .map(
        p => `
      <div class="problem-card">
        <div class="problem-header"><span class="problem-num">Challenge ${p.num}</span></div>
        <p class="problem-prompt">${p.prompt}</p>
        <div class="work-space">✍️ Show advanced multi-step proof and model:</div>
      </div>`
      )
      .join("");

    document.getElementById("t3-defense-prompt").innerHTML = `<p>${pkgData.t3.defense}</p>`;
  }

  // Get Active Package Data from Selections or Custom Input
  function getActivePackage() {
    const unitKey = unitSelect.value;
    const lessonIdx = parseInt(lessonSelect.value, 10);

    if (unitKey === "custom") {
      const topicText = customTopicInput.value.trim() || "Custom Math Topic";
      const chosenVisual = visualModelSelect.value === "auto" ? "tape" : visualModelSelect.value;

      return {
        unitId: "Custom",
        standard: "Grade 6 Focus Standard",
        lessonName: topicText,
        objective: `Students will master ${topicText} using scaffolded visual models and multi-tiered practice.`,
        t1: {
          strategy: "Use visual modeling and sentence frames to break down steps.",
          visualType: chosenVisual,
          params: { a: 2, b: 5, labelA: "Group A", labelB: "Group B" },
          sentenceFrames: [
            "• First, I identify the given quantities in the problem.",
            "• Second, I use the visual model to compare the relationships."
          ],
          problems: [
            { num: 1, prompt: `Model and solve a basic problem on ${topicText}.` },
            { num: 2, prompt: `Fill in the missing step for ${topicText}.` }
          ]
        },
        t2: {
          problems: [
            { num: 1, prompt: `Solve a standard grade-level problem involving ${topicText}.` },
            { num: 2, prompt: `Compare two different solution approaches for ${topicText}.` }
          ],
          mistake: {
            studentWork: "A student forgot to apply inverse operations.",
            question: "Identify the mistake and write the corrected solution steps."
          }
        },
        t3: {
          scenario: `A real-world engineering team needs to apply ${topicText} to optimize project resources.`,
          problems: [{ num: 1, prompt: `Calculate the optimal parameters and justify your solution.` }],
          defense: `Construct a mathematical argument defending your strategy against alternative methods.`
        }
      };
    }

    const unit = CURRICULUM_DATA[unitKey];
    const lesson = unit.lessons[lessonIdx] || unit.lessons[0];
    const chosenVisual = visualModelSelect.value === "auto" ? lesson.t1.visualType : visualModelSelect.value;

    return {
      unitId: unitKey,
      standard: unit.standard,
      lessonName: lesson.name,
      objective: lesson.objective,
      t1: {
        ...lesson.t1,
        visualType: chosenVisual
      },
      t2: lesson.t2,
      t3: lesson.t3
    };
  }

  // Tab Switcher
  function switchTab(targetTab, targetPanel) {
    [tabOverview, tabTier1, tabTier2, tabTier3].forEach(t => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    [panelOverview, panelTier1, panelTier2, panelTier3].forEach(p => p.classList.remove("active"));

    targetTab.classList.add("active");
    targetTab.setAttribute("aria-selected", "true");
    targetPanel.classList.add("active");
  }

  // Event Listeners Initialization
  function initEventListeners() {
    unitSelect.addEventListener("change", e => populateLessons(e.target.value));

    generateBtn.addEventListener("click", () => {
      const pkg = getActivePackage();
      renderWorkstationPackage(pkg);
    });

    tabOverview.addEventListener("click", () => switchTab(tabOverview, panelOverview));
    tabTier1.addEventListener("click", () => switchTab(tabTier1, panelTier1));
    tabTier2.addEventListener("click", () => switchTab(tabTier2, panelTier2));
    tabTier3.addEventListener("click", () => switchTab(tabTier3, panelTier3));

    themeToggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      currentState.theme = document.body.classList.contains("dark-theme") ? "dark" : "light";
    });

    printBtn.addEventListener("click", () => window.print());

    copyDocBtn.addEventListener("click", () => {
      const pkg = getActivePackage();
      const textSummary = `
=========================================
NEFT TEACHER TIERED WORKSTATION
${pkg.lessonName} (${pkg.standard})
=========================================
Objective: ${pkg.objective}

--- TIER 1 (SUPPORT) ---
Sentence Frames:
${pkg.t1.sentenceFrames.join("\n")}

Problems:
${pkg.t1.problems.map(p => `${p.num}. ${p.prompt}`).join("\n")}

--- TIER 2 (CORE) ---
Problems:
${pkg.t2.problems.map(p => `${p.num}. ${p.prompt}`).join("\n")}

Error Analysis:
"${pkg.t2.mistake.studentWork}"
${pkg.t2.mistake.question}

--- TIER 3 (EXTENSION) ---
Scenario: ${pkg.t3.scenario}
Problems:
${pkg.t3.problems.map(p => `${p.num}. ${p.prompt}`).join("\n")}
Defense: ${pkg.t3.defense}
      `.trim();

      navigator.clipboard.writeText(textSummary).then(() => {
        alert("Workstation text copied to clipboard! Ready to paste into Google Docs.");
      });
    });

    savePkgBtn.addEventListener("click", () => {
      const pkg = getActivePackage();
      currentState.savedPackages.unshift(pkg);
      renderHistory();
      alert(`Saved "${pkg.lessonName}" to your local library!`);
    });
  }

  function renderHistory() {
    if (currentState.savedPackages.length === 0) {
      historyList.innerHTML = `<p class="history-empty">No saved packages yet.</p>`;
      return;
    }

    historyList.innerHTML = currentState.savedPackages
      .slice(0, 5)
      .map(
        (pkg, idx) => `
      <div class="history-item" data-idx="${idx}">
        <strong>${pkg.lessonName}</strong><br/>
        <small>${pkg.standard}</small>
      </div>`
      )
      .join("");

    document.querySelectorAll(".history-item").forEach(item => {
      item.addEventListener("click", e => {
        const idx = parseInt(item.getAttribute("data-idx"), 10);
        const pkg = currentState.savedPackages[idx];
        if (pkg) renderWorkstationPackage(pkg);
      });
    });
  }

  // Initial Boot
  populateLessons("1");
  renderWorkstationPackage(getActivePackage());
  initEventListeners();
})();
