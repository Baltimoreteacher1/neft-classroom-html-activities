/**
 * Flagship Lesson Configurations (6-5, 5-1, 2-3)
 * Grounded in Reveal Math Grade 6 lesson configs with interactive theater,
 * living guided notes, reasoning defense, small-group composer, partner
 * collaboration, and family publishing data.
 */

export const FLAGSHIP_DATA = {
  "6-5": {
    id: "6-5",
    domain: "Algebraic Expressions",
    theater: {
      title: "Algebraic Expression Builder",
      subtitle: "Predict → Manipulate → Observe → Explain → Apply",
      scenario: "A movie ticket costs $8. Write an expression for the cost of x tickets.",
      scenarioEs: "Una entrada al cine cuesta $8. Escribe una expresión para el costo de x entradas.",
      predictPrompt: "Before building: if x increases by 1 ticket, how does the total cost change?",
      predictOptions: [
        { id: "add8", label: "It increases by $8 each time (repeated addition = 8x)", correct: true },
        { id: "add1", label: "It increases by $1 each time (x + 8)", correct: false },
        { id: "exp", label: "It multiplies by itself each time (8^x)", correct: false },
      ],
      variableName: "x",
      coefficient: 8,
      constant: 0,
      minX: 1,
      maxX: 8,
      defaultX: 3,
      explainPrompt: "In 8x, what does 8 represent and what does x represent?",
      applyPrompt: "Tickets to a school concert cost $12 each, plus a flat $50 venue fee. Write an expression for t tickets and check its value at t = 4.",
      applyExpected: "12t+50",
      applyAltExpected: ["50+12t", "12*t+50"],
      applyEvalExpected: "98",
    },
    guidedNotes: {
      title: "Living Guided Notes · Lesson 6-5",
      steps: [
        {
          id: "step-1",
          prompt: "1. Identify the unknown quantity and choose a variable.",
          studentHint: "What quantity changes depending on how many people attend?",
          teacherReveal: "Let t = the number of tickets sold. A variable represents a quantity that can change.",
          commonMistake: "Students sometimes try to assign a variable to $12, even though $12 is already known.",
        },
        {
          id: "step-2",
          prompt: "2. Distinguish the rate (coefficient) from the one-time fee (constant).",
          studentHint: "Which number repeats for every ticket, and which number happens only once?",
          teacherReveal: "$12 per ticket → 12t (coefficient 12, variable t). Flat $50 venue fee → + 50 (constant term).",
          commonMistake: "Writing 50t + 12 swaps the repeating rate with the one-time constant.",
        },
        {
          id: "step-3",
          prompt: "3. Substitute and evaluate when t = 4.",
          studentHint: "Replace t with 4, multiply first, then add the constant.",
          teacherReveal: "12(4) + 50 = 48 + 50 = $98.",
          commonMistake: "Adding 12 + 50 first to get 62 × 4 = 248 violates order of operations.",
        },
      ],
    },
    reasoning: {
      spotFlaw: {
        title: "Spot the Flaw",
        studentWork: "Maya wrote: '5 less than a number n is 5 - n. When n = 12, the value is 5 - 12.'",
        question: "Where did Maya's reasoning fail, and how would you fix it?",
        choices: [
          { id: "a", label: "'5 less than n' means start with n and subtract 5: n - 5 (value 7 when n = 12).", correct: true },
          { id: "b", label: "She should have multiplied 5 and n to get 5n.", correct: false },
          { id: "c", label: "She wrote the right expression, just evaluated it wrong.", correct: false },
        ],
      },
      teachMachine: {
        title: "Teach the Machine",
        botName: "Bot-6B",
        botClaim: "I evaluated 12t + 50 for t = 4 by doing 12 + 4 + 50 = 66!",
        prompt: "Explain to Bot-6B what 12t means and show the correct evaluation.",
        expectedKeyIdea: "12t means 12 times t (multiplication), so 12 × 4 = 48, then 48 + 50 = 98.",
      },
    },
    collaboration: {
      title: "Partner Info-Gap: Situation ↔ Expression Match",
      teacherLaunch: "Partner A reads the situation without showing the numbers; Partner B selects and justifies the matching expression.",
      successCriterion: "Both partners name the coefficient, variable, and constant and verify with one test value.",
      partnerA: "A bike rental costs $7 per hour plus a $10 helmet deposit. How much for h hours?",
      partnerBOptions: ["7h + 10", "10h + 7", "7 + h + 10"],
      correctMatch: "7h + 10",
    },
    smallGroup: {
      target: "Write and evaluate one- and two-step algebraic expressions from real situations (6.AT.6a).",
      entryTask: "If 1 ticket is $8, how much are 2 tickets? 5 tickets? How do you write 'x tickets'?",
      diagnostic: "Listen for students adding 8 + x instead of multiplying 8x.",
      visualModel: "Use the Algebra Tile strips: one x-bar paired with 8 unit tiles per copy.",
      prompts: [
        "Which amount happens once, and which happens every time?",
        "If we double x, which part of 12x + 50 doubles?",
      ],
      transferCheck: "Write an expression for $6 per notebook plus $3 shipping, then evaluate for 5 notebooks.",
    },
    family: {
      goalPlain: "This week we are writing math expressions with letters (variables) to represent real-world costs and patterns, then plugging in numbers to find the total.",
      goalPlainEs: "Esta semana escribimos expresiones matemáticas con letras (variables) para representar situaciones reales y luego sustituimos números para hallar el total.",
      workedExample: "Example: Movie tickets cost $8 each. For x tickets, the cost is 8x. If x = 4 tickets, 8 × 4 = $32.",
      homePrompt: "At the grocery store, ask your child: 'If apples are $2 per pound plus a $1 reusable bag, what expression shows the cost for p pounds?'",
    },
  },

  "5-1": {
    id: "5-1",
    domain: "Geometry · Area",
    theater: {
      title: "Geometry Construction Studio",
      subtitle: "Predict → Manipulate → Observe → Explain → Apply",
      scenario: "A parallelogram has base b = 14 ft, perpendicular height h = 9 ft, and slanted side 11 ft.",
      scenarioEs: "Un paralelogramo tiene base b = 14 pies, altura perpendicular h = 9 pies y lado inclinado de 11 pies.",
      predictPrompt: "If you slice the right triangle off one end of the parallelogram and slide it to the other end, what shape forms?",
      predictOptions: [
        { id: "rect", label: "A rectangle with the same base (14) and height (9), so Area = 14 × 9", correct: true },
        { id: "tri", label: "A triangle with half the area", correct: false },
        { id: "slant", label: "A rectangle using the slanted side 11 as its height", correct: false },
      ],
      defaultBase: 14,
      defaultHeight: 9,
      defaultSlant: 11,
      explainPrompt: "Why does Area = base × height use 9 ft instead of the slanted 11 ft side?",
      applyPrompt: "A parallelogram tile has base 12 cm, perpendicular height 7 cm, and slanted side 9 cm. Find its area in sq cm.",
      applyExpected: "84",
      applyAltExpected: ["84cm2", "84sqcm"],
    },
    guidedNotes: {
      title: "Living Guided Notes · Lesson 5-1",
      steps: [
        {
          id: "step-1",
          prompt: "1. Identify the base and the perpendicular height.",
          studentHint: "Look for the right-angle (90°) square between the base and height.",
          teacherReveal: "Base b = 14 ft; perpendicular height h = 9 ft. The 11 ft slanted side is NOT the height.",
          commonMistake: "Multiplying base × slanted side (14 × 11 = 154) overestimates the area.",
        },
        {
          id: "step-2",
          prompt: "2. Connect the parallelogram to a rectangle.",
          studentHint: "Imagine cutting the overhanging triangle and sliding it across.",
          teacherReveal: "Moving the triangle does not add or remove any area, forming a 14 × 9 rectangle.",
          commonMistake: "Dividing by 2 (½ × 14 × 9 = 63) confuses parallelograms with triangles.",
        },
        {
          id: "step-3",
          prompt: "3. Compute and label square units.",
          studentHint: "Area is measured in square units (ft²).",
          teacherReveal: "A = b × h = 14 × 9 = 126 ft².",
          commonMistake: "Adding 14 + 9 + 14 + 9 computes perimeter instead of area.",
        },
      ],
    },
    reasoning: {
      spotFlaw: {
        title: "Spot the Flaw",
        studentWork: "Devon calculated the area of a parallelogram (base = 14 ft, height = 9 ft, slant = 11 ft) as 14 × 11 = 154 ft².",
        question: "What mistake did Devon make?",
        choices: [
          { id: "a", label: "He used the slanted side (11 ft) instead of the perpendicular height (9 ft).", correct: true },
          { id: "b", label: "He forgot to divide by 2.", correct: false },
          { id: "c", label: "He should have added 14 + 11.", correct: false },
        ],
      },
      teachMachine: {
        title: "Teach the Machine",
        botName: "GeoBot-5",
        botClaim: "A parallelogram leans sideways, so its area must be smaller than a rectangle with the same base and height!",
        prompt: "Explain to GeoBot-5 using the slice-and-slide model why the areas are equal.",
        expectedKeyIdea: "Slicing the triangle off one side and sliding it to the other forms a rectangle with the exact same area (base × height).",
      },
    },
    collaboration: {
      title: "Partner Info-Gap: Parallelogram Dimensions",
      teacherLaunch: "Partner A describes the rectangle formed after slicing; Partner B identifies the matching base and perpendicular height.",
      successCriterion: "Both partners verify the 90° height and compute area in square units.",
      partnerA: "My parallelogram rearranges into a rectangle that is 15 inches wide and 6 inches tall.",
      partnerBOptions: ["b = 15 in., h = 6 in. → 90 in²", "b = 15 in., slant = 8 in. → 120 in²", "b = 15 in., h = 6 in. → 45 in²"],
      correctMatch: "b = 15 in., h = 6 in. → 90 in²",
    },
    smallGroup: {
      target: "Find the area of parallelograms and rhombuses using perpendicular base and height (6.GR.1).",
      entryTask: "Trace the 90° right-angle symbol on the diagram. Which two segments touch it?",
      diagnostic: "Check whether students confuse slanted side length with perpendicular height.",
      visualModel: "Use the Slice-and-Slide SVG slider to transform the parallelogram into a rectangle.",
      prompts: [
        "Does sliding the triangle change how much space is inside?",
        "Why doesn't the slanted side appear in A = b × h?",
      ],
      transferCheck: "A rhombus has base 11 m and height 6 m (slant 11 m). What is its area?",
    },
    family: {
      goalPlain: "This week we are finding the area of parallelograms by seeing how they rearrange into rectangles using base × height.",
      goalPlainEs: "Esta semana hallamos el área de paralelogramos viendo cómo se reorganizan en rectángulos usando base × altura.",
      workedExample: "Example: Base = 14 ft, straight-up height = 9 ft. Area = 14 × 9 = 126 square feet.",
      homePrompt: "Ask your child: 'Why do we measure height straight up at a 90° corner instead of along the slanted edge?'",
    },
  },

  "2-3": {
    id: "2-3",
    domain: "Statistics & Data",
    theater: {
      title: "Data Investigation Studio",
      subtitle: "Predict → Manipulate → Observe → Explain → Apply",
      scenario: "Data set: 2, 4, 4, 6, 9. Explore how ordering and outliers affect the median vs. the mean.",
      scenarioEs: "Conjunto de datos: 2, 4, 4, 6, 9. Explora cómo el orden y los valores atípicos afectan la mediana frente a la media.",
      predictPrompt: "If the largest value (9) changes to an extreme outlier (39), what happens to the median?",
      predictOptions: [
        { id: "stay", label: "The median stays 4 because the middle position does not change", correct: true },
        { id: "jump", label: "The median jumps up a lot just like the mean does", correct: false },
        { id: "zero", label: "The median becomes 0", correct: false },
      ],
      defaultValues: [2, 4, 4, 6, 9],
      explainPrompt: "Why is the median often better than the mean for describing 'typical' data when an outlier exists?",
      applyPrompt: "Find the median of this unordered set: 14, 3, 8, 10, 5.",
      applyExpected: "8",
      applyAltExpected: [],
    },
    guidedNotes: {
      title: "Living Guided Notes · Lesson 2-3",
      steps: [
        {
          id: "step-1",
          prompt: "1. Always order the data from least to greatest first.",
          studentHint: "Without sorting, the 'middle' number is just a random position.",
          teacherReveal: "Ordered set: 2, 4, 4, 6, 9. Ordering makes the middle value meaningful.",
          commonMistake: "Picking the middle number of an unsorted list gives a wrong median.",
        },
        {
          id: "step-2",
          prompt: "2. Find the middle value (odd vs. even count).",
          studentHint: "Cross off pairs from the outside in, or average the two middle numbers when even.",
          teacherReveal: "With 5 values, the 3rd value is 4. With an even count like 2, 4, 6, 9, average 4 and 6 → 5.",
          commonMistake: "Listing two numbers as the median instead of finding the halfway point between them.",
        },
        {
          id: "step-3",
          prompt: "3. Compare median vs. mean when an outlier is present.",
          studentHint: "Watch how the outlier pulls the mean, while the median resists.",
          teacherReveal: "In 2, 4, 4, 6, 39: median is still 4, while mean jumps from 5 to 11.",
          commonMistake: "Confusing median (middle) with mean (balance/average).",
        },
      ],
    },
    reasoning: {
      spotFlaw: {
        title: "Spot the Flaw",
        studentWork: "Elena looked at the list [15, 2, 9, 20, 4] and said: 'The middle number is 9, wait—actually it's 9 by luck, let me check [15, 20, 2, 4, 9]: the median is 2!'",
        question: "Why was Elena's method flawed?",
        choices: [
          { id: "a", label: "She didn't sort the numbers from least to greatest before finding the middle.", correct: true },
          { id: "b", label: "She should have picked the largest number, 20.", correct: false },
          { id: "c", label: "She forgot to multiply by 5.", correct: false },
        ],
      },
      teachMachine: {
        title: "Teach the Machine",
        botName: "DataBot-2",
        botClaim: "For 4, 6, 10, 12, there are two middle numbers (6 and 10), so the median doesn't exist!",
        prompt: "Teach DataBot-2 how to find the exact median when a data set has an even number of values.",
        expectedKeyIdea: "Add the two middle values (6 + 10 = 16) and divide by 2 to find the halfway point: 8.",
      },
    },
    collaboration: {
      title: "Partner Info-Gap: Mystery Data Set",
      teacherLaunch: "Partner A knows the 5 ordered values except one; Partner B knows the median is 7.",
      successCriterion: "Partners test candidate values and justify why the median stays 7.",
      partnerA: "Ordered values: 3, 5, [?], 10, 14. What must the missing middle value be if the median is 7?",
      partnerBOptions: ["7", "8", "6"],
      correctMatch: "7",
    },
    smallGroup: {
      target: "Find the median of a data set (odd and even counts) and interpret it as a measure of center (6.DS.4).",
      entryTask: "Line up 5 number cards from smallest to largest. Which card is in the middle?",
      diagnostic: "Check whether students sort first and whether they average the middle two on even counts.",
      visualModel: "Use the Data Investigation dot plot to drag the outlier and watch Median vs. Mean.",
      prompts: [
        "Why must we order the values before crossing off from the ends?",
        "What happens to the median if the biggest number triples?",
      ],
      transferCheck: "Find the median of 6, 1, 9, 4.",
    },
    family: {
      goalPlain: "This week we are finding the median (the middle number when data is put in order) to describe what is typical in a data set.",
      goalPlainEs: "Esta semana hallamos la mediana (el número del medio cuando los datos están en orden) para describir lo típico en un conjunto de datos.",
      workedExample: "Example: For 2, 4, 4, 6, 9, the middle number is 4. Even if 9 changes to 39, the median stays 4!",
      homePrompt: "Ask your child to line up 5 family ages from youngest to oldest and find the median age.",
    },
  },
};
