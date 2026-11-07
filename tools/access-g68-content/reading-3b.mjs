// Grades 6-8 publisher pass, Reading Room lessons, batch 3b: math reasoning and science. Original texts.
const family = (en, es, questions) => ({ en, es, questions });
export default [
  {
    id: "spinner-probability-fair-game",
    level: "B",
    title: "Is the Spinner Fair? Probability and Equal Chances",
    summary:
      "Two friends use probability to find out why their spinner game is unfair and how to change the rules.",
    genre: "Informational text with math",
    subject: "Math (probability)",
    topics: ["probability", "fair games", "experimental and theoretical probability"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain why a game is fair or unfair using probability.",
    languageFeatures: ["math vocabulary", "cause and effect", "comparing"],
    minutes: 15,
    content:
      "Explain that probability compares favorable outcomes with all equally likely outcomes, and that a fair game gives equal chances.",
    language: "Use because, so and out of to explain probability.",
    essential: "How can numbers tell us whether a game is fair?",
    background: "Think about a game of chance, such as a spinner or a number cube.",
    hook: "One player has 3 chances out of 8 and the other has 5 chances out of 8. Is that fair?",
    purpose: "Read to find out how probability shows whether a game is fair.",
    vocab: [
      [
        "probability",
        "a number from 0 to 1 that tells how likely an event is",
        "The probability of landing on red is 3/8.",
        "probabilidad",
      ],
      ["event", "something that may or may not happen", "Landing on blue is an event.", "suceso"],
      [
        "fair",
        "giving every player an equal chance",
        "Noor changed the rules to make the game fair.",
        "justo",
      ],
      [
        "equally likely",
        "having the same chance of happening",
        "Sections of the same size are equally likely.",
        "igualmente probable",
      ],
    ],
    paras: [
      {
        text: "Probability is a number from 0 to 1 that tells how likely an event is to happen. An event that is impossible has a probability of 0, and an event that is certain has a probability of 1. An event that is just as likely to happen as not to happen has a probability of 1/2.",
        q: "What does probability tell us?",
      },
      {
        text: "Noor and Ben are playing a game with a spinner. The spinner has 8 sections that are all the same size. Three sections are red, two are blue, two are green, and one is yellow. Because every section is equally likely, the probability of landing on red is 3/8.",
        q: "What is the probability of landing on red?",
      },
      {
        text: "At first, Noor scores a point when the spinner lands on red, and Ben scores a point when it lands on any other color. Ben has 5 sections out of 8, so his probability is 5/8, while Noor has only 3/8. The game is not fair, because the two players do not have equal chances of winning.",
        q: "Why is the first game not fair?",
      },
      {
        text: "Noor decides to change the rules. Now she scores on red or yellow, which covers 4 sections, and Ben scores on blue or green, which also covers 4 sections. Each player now has a probability of 4/8, or 1/2, so the game is fair.",
        q: "How does Noor make the game fair?",
      },
      {
        text: "To test the new rules, they spin the spinner 40 times. Noor's colors come up 18 times, and Ben's colors come up 22 times. These results are not exactly equal, but that is normal. Experimental results usually come close to the theoretical probability, and the more times they spin, the closer the results tend to get.",
        q: "Why are the results from 40 spins not exactly equal?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How many sections of the spinner are blue or green?",
        opts: ["4 sections", "2 sections", "5 sections"],
        why: [
          "Two is the number of blue sections alone, so it leaves out the green sections.",
          "Five is the number of sections that Ben had in the first game, which are not red.",
        ],
        rat: "Paragraph 2 says two sections are blue and two are green, and paragraph 4 says blue or green covers 4 sections.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 3, the game is “not fair.” What does fair mean in a game?",
        opts: [
          "Each player has an equal chance of winning.",
          "Each player wins the same number of games.",
          "Each player follows all of the rules of the game.",
        ],
        why: [
          "Results can come out even by luck, but the text judges the game by the sections on the spinner, not by the results.",
          "Both players follow the rules in paragraph 3, yet the game is still called not fair.",
        ],
        rat: "Paragraph 3 says the game is not fair because the two players do not have equal chances of winning.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of events",
        type: "order",
        prompt: "Put the events of Noor and Ben's game in the order the text gives them.",
        items: [
          "Noor scores only on red, and Ben scores on every other color.",
          "They notice that Ben's probability, 5/8, is greater than Noor's, 3/8.",
          "Noor changes the rules so that each player covers 4 sections.",
          "They spin the spinner 40 times to test the new rules.",
        ],
        rat: "Paragraph 3 gives the first game and its probabilities, paragraph 4 gives the new rules, and paragraph 5 gives the test with 40 spins.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the data",
        type: "choice",
        prompt: "What is the probability that the spinner lands on blue?",
        opts: ["2/8, or 1/4", "2/6, or 1/3", "6/8, or 3/4"],
        why: [
          "That compares blue with only the sections that are not blue, but the text compares a color's sections with every section on the spinner.",
          "Six out of eight is the probability of not landing on blue, which is the opposite event.",
        ],
        rat: "Paragraph 2 says the spinner has 8 equal sections and two of them are blue, so the probability is 2/8, or 1/4.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why did the 40 spins give 22 and 18 instead of exactly 20 and 20?",
        opts: [
          "Real spins usually differ a little from the expected result.",
          "The new rules must still be unfair to one of the players.",
          "A spinner will always land on one color more than the others.",
        ],
        why: [
          "The new rules give each player 4 sections, so the probabilities are equal even though the results are not.",
          "Paragraph 2 says every section is equally likely, so no color is favored by the spinner itself.",
        ],
        rat: "Paragraph 5 says the results are not exactly equal, but experimental results usually come close to the theoretical probability.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that explains why the first version of the game was unfair.",
        evidence: ["p3"],
        rat: "Paragraph 3 compares Ben's probability of 5/8 with Noor's probability of 3/8 and says the players do not have equal chances.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "A spinner has 10 equal sections: 6 green and 4 purple. Ana scores on green and Luis scores on purple. Explain the probability of green and whether the game is fair.",
        lookFor: [
          "States the probability of green as 6/10 or 3/5",
          "Compares it with the probability of purple, 4/10 or 2/5",
          "Says the game is not fair because the chances are not equal",
        ],
        rubric: [
          "Gives a correct probability",
          "Compares the two players' chances",
          "Reaches the correct conclusion about fairness",
        ],
        frame:
          "The probability of green is ___ out of ___. The probability of purple is ___. The game is ___ because ___.",
        model:
          "The probability of green is 6 out of 10, or 3/5, and the probability of purple is 4 out of 10, or 2/5. The game is not fair because Ana has a greater chance of scoring than Luis.",
      },
    ],
    transfer: {
      prompt:
        "A spinner has 10 equal sections: 3 blue and 7 yellow. Lena scores on blue and Jon scores on yellow. Explain how you know whether the game is fair, and how you could change the rules.",
      lookFor: [
        "Finds 3/10 for blue and 7/10 for yellow",
        "Says the game is not fair because the chances are not equal",
        "Suggests a change that gives each player 5 sections out of 10",
      ],
      frame:
        "Blue has a probability of ___ and yellow has ___. The game is ___. To make it fair, ___.",
    },
    guide: {
      mini: "Draw the spinner on the board with the 8 sections. Have students color the sections for each rule set and count how many sections belong to each player before reading the probability.",
      discussion: [
        "Why do equal sections matter when we find a probability?",
        "Can a fair game still have an uneven result after 40 spins? Why?",
        "How could you design a different fair game with this spinner?",
      ],
      misconception:
        "Students may think a fair game must give exactly equal results; the text shows that fairness is about equal chances, and real results vary a little.",
      answerNotes: [
        "Question 4: 2 out of 8 sections are blue, so the probability is 2/8, which equals 1/4.",
        "Question 7: 6/10 for green is greater than 4/10 for purple, so Ana has the advantage.",
      ],
      model:
        "The probability of green is 6/10 and of purple is 4/10, so the game is not fair because Ana has a greater chance than Luis.",
    },
    family: family(
      "Use a number cube or a coin at home. Ask your student to explain whether a game is fair and how the chances for each player can be counted. You can talk in any language, then ask for one sentence in English.",
      "Usen un dado o una moneda en casa. Pida a su estudiante que explique si un juego es justo y cómo se pueden contar las probabilidades de cada jugador. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What does it mean for a game to be fair?",
        "Why do the real results of a game not always match the probability exactly?",
      ],
    ),
    connections: {
      write: "Write a paragraph that explains why a game is fair or unfair, using probability.",
      speak: "Explain aloud how Noor changed the rules to make the game fair.",
      listen: "Listen to a talk about chance and write down each probability you hear.",
    },
  },
  {
    id: "coordinate-plane-park-map",
    level: "B",
    title: "Finding Points on a Park Map: The Coordinate Plane",
    summary:
      "A park map on a coordinate plane shows how to plot ordered pairs, name quadrants and find distances.",
    genre: "Procedural text with math",
    subject: "Math (the coordinate plane)",
    topics: ["coordinate plane", "ordered pairs", "quadrants"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how to plot a point and name its location.",
    languageFeatures: ["sequence words", "direction words", "math vocabulary"],
    minutes: 15,
    content:
      "Explain how an ordered pair locates a point, which quadrant it is in and how to find a distance between points.",
    language: "Use first, then, left, right, up and down to give directions.",
    essential: "How can two numbers tell us exactly where something is?",
    background: "Think about a map with letters and numbers on the edges.",
    hook: "Two numbers can name any spot in a park. How does that work?",
    purpose: "Read to find out how to plot points on a coordinate plane and name their quadrants.",
    vocab: [
      [
        "coordinate plane",
        "a flat grid made by a horizontal and a vertical number line",
        "The park map is drawn on a coordinate plane.",
        "plano de coordenadas",
      ],
      [
        "origin",
        "the point (0, 0) where the two axes meet",
        "Every plotted point starts from the origin.",
        "origen",
      ],
      [
        "ordered pair",
        "two numbers in order that name a point, such as (3, 2)",
        "The ordered pair (3, 2) names the playground.",
        "par ordenado",
      ],
      [
        "quadrant",
        "one of the four sections of a coordinate plane",
        "The pond is in Quadrant II.",
        "cuadrante",
      ],
      [
        "axis",
        "the horizontal or vertical number line of a coordinate plane",
        "The x-axis is the horizontal axis.",
        "eje",
      ],
    ],
    paras: [
      {
        text: "A coordinate plane is a flat grid formed by two number lines that cross at right angles. The horizontal line is called the x-axis, and the vertical line is called the y-axis. They meet at a point called the origin, which is written (0, 0), and the axes divide the plane into four sections called quadrants.",
        q: "What is a coordinate plane?",
      },
      {
        text: "Every point on the plane has an ordered pair, such as (3, 2), and the order of the two numbers matters. The first number tells how far to move left or right from the origin, and the second number tells how far to move up or down. To plot (3, 2), start at the origin, move 3 units to the right, and then move 2 units up.",
        q: "How do you plot an ordered pair?",
      },
      {
        text: "Negative numbers tell us to move in the opposite direction. A negative x-coordinate means left, and a negative y-coordinate means down. Imagine a park map in which the playground is at (3, 2), the pond is at (-4, 1), the picnic area is at (-2, -3), and the bike rack is at (5, -1).",
        q: "What do negative coordinates mean?",
      },
      {
        text: "The signs of the coordinates tell us which quadrant a point is in. The playground has two positive numbers, so it is in Quadrant I, at the top right. The pond has a negative x and a positive y, so it is in Quadrant II, at the top left. The picnic area has two negative numbers, so it is in Quadrant III, at the bottom left, and the bike rack is in Quadrant IV, at the bottom right.",
        q: "How do the signs tell us the quadrant?",
      },
      {
        text: "Points that share one coordinate are easy to compare. The fountain is at (3, -4), directly below the playground, and both points have an x-coordinate of 3. To find the distance, count the vertical units: 2 units down to the x-axis plus 4 more units gives 6 units. If each unit stands for 50 meters, the fountain is 300 meters from the playground.",
        q: "How far is the fountain from the playground?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "In paragraph 2, what does the first number in an ordered pair tell you?",
        opts: [
          "how far to move left or right",
          "how far to move up or down",
          "which quadrant the point is in",
        ],
        why: [
          "Moving up or down is told by the second number, not by the first number.",
          "The quadrant depends on the signs of both numbers, and the first number alone does not name it.",
        ],
        rat: "Paragraph 2 says the first number tells how far to move left or right from the origin.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 1, the axes cross at “right angles.” What does that mean?",
        opts: [
          "They meet and form square corners.",
          "They meet only at the top of the grid.",
          "They run beside each other and never meet.",
        ],
        why: [
          "The axes meet at the origin, which is in the middle of the grid and not at the top.",
          "Lines that never meet would not cross at the origin, but paragraph 1 says the axes meet there.",
        ],
        rat: "Paragraph 1 says the axes cross and meet at the origin, and a right angle is a square corner.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Classify points",
        type: "sort",
        prompt: "Sort each place on the park map by its quadrant.",
        cats: ["Quadrant I", "Quadrant II", "Quadrant III", "Quadrant IV"],
        sortItems: [
          ["(3, 2) the playground", 0],
          ["(-4, 1) the pond", 1],
          ["(-2, -3) the picnic area", 2],
          ["(5, -1) the bike rack", 3],
          ["(-1, 5) a tall slide", 1],
          ["(2, -6) a water tap", 3],
        ],
        rat: "Paragraph 4 says two positive numbers are in Quadrant I, a negative x and positive y are in Quadrant II, two negatives are in Quadrant III, and a positive x and negative y are in Quadrant IV.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the procedure",
        type: "choice",
        prompt:
          "A point is 5 units to the left of the origin and 2 units down. Which ordered pair names it?",
        opts: ["(-5, -2)", "(-2, -5)", "(5, 2)"],
        why: [
          "That writes the numbers in the wrong order, but the first number tells the left or right move.",
          "That ignores the directions, but paragraph 3 says left and down are shown with negative numbers.",
        ],
        rat: "Paragraphs 2 and 3 say the x-coordinate comes first, and left and down are negative, so the pair is (-5, -2).",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement does paragraph 2 support?",
        opts: [
          "(2, 3) and (3, 2) name two different points.",
          "(2, 3) and (3, 2) name the same point because they share two numbers.",
          "(2, 3) and (3, 2) are always in two different quadrants.",
        ],
        why: [
          "The order of the numbers matters, so a pair with the numbers swapped does not name the same place.",
          "Both pairs have two positive numbers, so both points are in Quadrant I.",
        ],
        rat: "Paragraph 2 says the order of the two numbers matters, so (2, 3) means right 2 and up 3, while (3, 2) means right 3 and up 2.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Text structure",
        type: "choice",
        prompt: "How is this text organized?",
        opts: [
          "It defines the plane first and then explains how to plot and compare points.",
          "It tells a park story first and defines the plane only at the end.",
          "It lists the places in the park in alphabetical order with no steps.",
        ],
        why: [
          "The definition of the coordinate plane comes in paragraph 1, before the park example.",
          "The places in the park are not in alphabetical order, and the text includes steps for plotting points.",
        ],
        rat: "Paragraph 1 defines the plane, paragraph 2 gives the steps for plotting, and paragraphs 3 to 5 use the park map to practice.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a procedure",
        type: "short",
        prompt:
          "Explain how to plot the point (-2, 4). Tell which direction you move first and which quadrant the point is in.",
        lookFor: [
          "Starts at the origin and moves 2 units left first",
          "Then moves 4 units up",
          "Names Quadrant II because x is negative and y is positive",
        ],
        rubric: [
          "Describes both moves in the correct order",
          "Uses the signs to choose the directions",
          "Names the correct quadrant",
        ],
        frame:
          "First, I start at the ___ and move ___ units ___. Then I move ___ units ___. The point is in Quadrant ___.",
        model:
          "First, I start at the origin and move 2 units left. Then I move 4 units up. The point is in Quadrant II, because the x-coordinate is negative and the y-coordinate is positive.",
      },
    ],
    transfer: {
      prompt:
        "A new bench is at (4, -3). Explain how to plot it from the origin and name its quadrant.",
      lookFor: [
        "Moves 4 units right and then 3 units down",
        "Says the first number is the horizontal move",
        "Names Quadrant IV",
      ],
      frame:
        "I start at the origin and move ___ units ___. Then I move ___ units ___. The bench is in Quadrant ___.",
    },
    guide: {
      mini: "Draw a coordinate plane on the board and plot the playground at (3, 2). Have students walk through the two moves aloud, then repeat with (-4, 1) to show what a negative x does.",
      discussion: [
        "Why does the order of the numbers in an ordered pair matter?",
        "How can you tell the quadrant of a point without plotting it?",
        "How would you find the distance between (-4, 1) and (-4, -2)?",
      ],
      misconception:
        "Students may reverse the coordinates and move up before right; the phrase run before you climb, or x before y, helps them remember the order.",
      answerNotes: [
        "Question 4: five units left is -5 and two units down is -2, so the ordered pair is (-5, -2).",
        "Question 7: (-2, 4) is 2 units left and 4 units up, which is in Quadrant II.",
      ],
      model:
        "I start at the origin, move 2 units left, and then move 4 units up. The point is in Quadrant II because x is negative and y is positive.",
    },
    family: family(
      "Draw a coordinate plane on paper. Ask your student to plot a point and explain which way to move first, and which quadrant it is in. You can talk in any language, then ask for one sentence in English.",
      "Dibujen un plano de coordenadas en papel. Pida a su estudiante que ubique un punto y explique hacia dónde se mueve primero y en qué cuadrante está. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What does the first number in an ordered pair tell us?",
        "How do the signs of the numbers tell us the quadrant?",
      ],
    ),
    connections: {
      write: "Write directions for plotting a point on a coordinate plane.",
      speak: "Explain aloud how to find the park's pond at (-4, 1).",
      listen: "Listen to someone read ordered pairs and plot each point.",
    },
  },
  {
    id: "fish-tank-volume",
    level: "B",
    title: "How Much Water Fills the Tank? Volume of a Prism",
    summary:
      "A class finds the volume of a fish tank, changes cubic centimeters to liters and thinks about water height.",
    genre: "Informational text with math",
    subject: "Math (volume)",
    topics: ["volume", "rectangular prisms", "units of measure"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how to find volume and why the units are cubic.",
    languageFeatures: ["sequence words", "math vocabulary", "cause and effect"],
    minutes: 15,
    content:
      "Explain how to find the volume of a rectangular prism by multiplying base area by height and how to convert units.",
    language: "Use first, then, because and so to explain a calculation.",
    essential: "How do we measure the space inside an object?",
    background: "Think about how much water a bucket or a bathtub can hold.",
    hook: "A tank is 50 centimeters long. How can the class know how much water it holds?",
    purpose: "Read to find out how to calculate the volume of a tank and what the units mean.",
    vocab: [
      [
        "volume",
        "the amount of space inside a three-dimensional shape",
        "The volume of the tank is 60,000 cubic centimeters.",
        "volumen",
      ],
      [
        "rectangular prism",
        "a solid shape with six rectangular faces",
        "The fish tank is a rectangular prism.",
        "prisma rectangular",
      ],
      [
        "cubic centimeter",
        "a unit for volume; a cube that is 1 centimeter on every edge",
        "The tank holds 60,000 cubic centimeters.",
        "centímetro cúbico",
      ],
      [
        "liter",
        "a unit for liquids that equals 1,000 cubic centimeters",
        "The tank holds 60 liters of water.",
        "litro",
      ],
    ],
    paras: [
      {
        text: "Volume is the amount of space inside a three-dimensional shape. Ms. Torres's class wants to buy a fish tank shaped like a rectangular prism, and before they buy it, they need to know how much water it can hold.",
        q: "What does the class want to know?",
      },
      {
        text: "The tank is 50 centimeters long, 30 centimeters wide, and 40 centimeters tall. To find the volume of a rectangular prism, multiply the length by the width by the height. First, the class multiplies 50 by 30 to get the area of the base, which is 1,500 square centimeters. Then they multiply 1,500 by the height of 40, and the volume is 60,000 cubic centimeters.",
        q: "How does the class find the volume?",
      },
      {
        text: "Volume is measured in cubic units because it counts cubes. One cubic centimeter is a cube that is 1 centimeter long on every edge, so the tank holds 60,000 of these small cubes. That number is hard to picture, so the class converts it to liters. One liter of water takes up 1,000 cubic centimeters, and 60,000 divided by 1,000 gives 60 liters.",
        q: "Why are the units cubic?",
      },
      {
        text: "However, a fish tank is never filled to the very top. The class decides to fill the water to a height of 30 centimeters, so the water forms a smaller prism. It has the same base of 1,500 square centimeters but a height of only 30 centimeters, so its volume is 1,500 times 30, which is 45,000 cubic centimeters, or 45 liters.",
        q: "How much water will the class use?",
      },
      {
        text: "Ms. Torres reminds the students that the height of the water matters, not just the height of the tank. If the water level were 10 centimeters lower, the volume would drop by 1,500 times 10, or 15,000 cubic centimeters, which is 15 liters.",
        q: "Why does the height of the water matter?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What is the volume of the whole tank?",
        opts: ["60,000 cubic centimeters", "45,000 cubic centimeters", "1,500 cubic centimeters"],
        why: [
          "Forty-five thousand is the volume of the water when it only reaches 30 centimeters, not the whole tank.",
          "Fifteen hundred is the area of the base in square centimeters, so it is not a volume.",
        ],
        rat: "Paragraph 2 says the volume of the tank is 60,000 cubic centimeters.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 3, the class “converts” the volume to liters. What does converts mean?",
        opts: [
          "changes it into a different unit",
          "makes the number much larger",
          "checks it against a second tank",
        ],
        why: [
          "The number becomes smaller, 60 instead of 60,000, so converting is not about making it bigger.",
          "The class does not use a second tank; it writes the same volume in a unit that is easier to picture.",
        ],
        rat: "The class writes 60,000 cubic centimeters as 60 liters, so converts means changes it into a different unit.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of steps",
        type: "order",
        prompt:
          "Put the steps for finding the volume of the tank in the order the text gives them.",
        items: [
          "Multiply the length by the width to get the base area.",
          "Multiply the base area by the height.",
          "Write the answer in cubic units.",
          "Divide by 1,000 to change cubic centimeters to liters.",
        ],
        rat: "Paragraph 2 multiplies length by width and then by height, and paragraph 3 gives cubic units and divides by 1,000 to find liters.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the procedure",
        type: "choice",
        prompt:
          "A different tank has a base that is 40 centimeters by 25 centimeters and is 30 centimeters tall. What is its volume?",
        opts: ["30,000 cubic centimeters", "95 cubic centimeters", "1,000 cubic centimeters"],
        why: [
          "That adds the three measurements, but paragraph 2 says to multiply them.",
          "A thousand is only the area of the base in square units, and the height has not been used yet.",
        ],
        rat: "Paragraph 2 gives the method: 40 times 25 is 1,000, and 1,000 times 30 is 30,000 cubic centimeters.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why does the class use a height of 30 centimeters in paragraph 4 instead of 40?",
        opts: [
          "A tank is not filled to the very top, so the water is lower than the tank.",
          "The tank is only 30 centimeters tall, so the water cannot go higher.",
          "Adding water makes the base of the tank smaller than it was.",
        ],
        why: [
          "Paragraph 2 says the tank is 40 centimeters tall, so 30 centimeters is not the height of the tank.",
          "The base of the tank stays the same, 1,500 square centimeters, no matter how much water is added.",
        ],
        rat: "Paragraph 4 begins by saying a fish tank is never filled to the very top, so the water forms a smaller prism with a height of 30 centimeters.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Signal words",
        type: "choice",
        prompt: "What does the word “However” at the start of paragraph 4 signal?",
        opts: [
          "a shift from a full tank to a more realistic case",
          "a mistake in the first calculation of the class",
          "a switch to a unit that replaces the liter",
        ],
        why: [
          "The calculation in paragraph 2 is not wrong; paragraph 4 explains a different situation.",
          "Liters are still used in paragraph 4, where the answer is 45 liters.",
        ],
        rat: "Paragraph 4 moves from the volume of a full tank in paragraphs 2 and 3 to the volume of the water that really goes in.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a procedure",
        type: "short",
        prompt:
          "A small tank is 40 centimeters long, 20 centimeters wide, and 25 centimeters tall. Explain how to find its volume in cubic centimeters and in liters.",
        lookFor: [
          "Multiplies 40 by 20 to get a base area of 800 and then by 25 to get 20,000",
          "States the volume as 20,000 cubic centimeters",
          "Divides by 1,000 to get 20 liters",
        ],
        rubric: [
          "Multiplies the three measurements correctly",
          "Uses cubic units",
          "Converts to liters correctly",
        ],
        frame:
          "First, I multiply ___ by ___ to get ___. Then I multiply by ___. The volume is ___ cubic centimeters, which is ___ liters.",
        model:
          "First, I multiply 40 by 20 to get 800. Then I multiply by 25. The volume is 20,000 cubic centimeters, and dividing by 1,000 gives 20 liters.",
      },
    ],
    transfer: {
      prompt:
        "A planter is 60 centimeters long, 20 centimeters wide, and 25 centimeters tall. Soil fills it to a height of 20 centimeters. Explain how to find the volume of the soil.",
      lookFor: [
        "Uses the height of the soil, 20 centimeters, and not 25",
        "Multiplies 60 by 20 and then by 20 to get 24,000",
        "States cubic centimeters, or 24 liters",
      ],
      frame:
        "I use a height of ___ because ___. I multiply ___ by ___ by ___ to get ___ cubic centimeters.",
    },
    guide: {
      mini: "Build a 5 by 3 by 2 prism with centimeter cubes, or draw its layers. Count one layer, then count the layers, and connect this to base area times height.",
      discussion: [
        "Why do we multiply the base area by the height to find volume?",
        "How is a square centimeter different from a cubic centimeter?",
        "Why does the height of the water matter more than the height of the tank?",
      ],
      misconception:
        "Students may add the three measurements or write square units for volume; building layers of cubes shows why we multiply and count cubes.",
      answerNotes: [
        "Question 4: 40 times 25 is 1,000, and 1,000 times 30 is 30,000 cubic centimeters, which is 30 liters.",
        "Question 7: 40 times 20 is 800, 800 times 25 is 20,000 cubic centimeters, and 20,000 divided by 1,000 is 20 liters.",
      ],
      model:
        "I multiply 40 by 20 to get 800, and then multiply by 25. The volume is 20,000 cubic centimeters, which is 20 liters.",
    },
    family: family(
      "Find a box or a container at home. Ask your student to measure it and explain how to find the volume. You can talk in any language, then ask for one sentence in English.",
      "Busquen una caja o un recipiente en casa. Pida a su estudiante que lo mida y explique cómo hallar el volumen. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "Why is volume measured in cubic units?",
        "Why does the height of the water matter when we fill a tank?",
      ],
    ),
    connections: {
      write: "Write a paragraph that explains how to find the volume of a rectangular prism.",
      speak: "Explain aloud how the class found 60,000 cubic centimeters and then 60 liters.",
      listen: "Listen to a talk about measuring and write down each unit you hear.",
    },
  },
  {
    id: "riverton-electricity-sources",
    level: "C",
    title: "Where Does Riverton's Electricity Come From?",
    summary:
      "A table of percentages shows how one city's electricity changed over five years, and the text explains shares, percentage points and energy sources.",
    genre: "Infographic-style text with a table",
    subject: "Science and math (energy and percent)",
    topics: ["energy sources", "renewable energy", "percentages", "reading a table"],
    keyUse: "Inform",
    eldStandard: "ELD-SC",
    languageFunction: "Describe change over time using data from a table.",
    languageFeatures: ["comparing data", "numbers and percent", "cause and effect"],
    minutes: 18,
    content:
      "Describe how a city's energy sources changed using percent shares from a table, and explain the difference between a share and an amount.",
    language: "Use increased, decreased and percentage points to describe change.",
    essential: "How can data show a change in the way we make energy?",
    background: "Think about where the electricity at your school comes from.",
    hook: "In five years, one city's coal use dropped from 32 percent to 10 percent. What replaced it?",
    purpose:
      "Read to find out how the sources of Riverton's electricity changed and how to read the data.",
    table: {
      headers: ["Source", "Type", "Five years ago", "This year"],
      rows: [
        ["Natural gas", "Fossil fuel", "40%", "38%"],
        ["Coal", "Fossil fuel", "32%", "10%"],
        ["Solar", "Renewable", "8%", "22%"],
        ["Wind", "Renewable", "12%", "18%"],
        ["Hydropower", "Renewable", "8%", "12%"],
      ],
      description:
        "A table of the share of Riverton's electricity from five sources, five years ago and this year. Natural gas went from 40% to 38%, coal from 32% to 10%, solar from 8% to 22%, wind from 12% to 18% and hydropower from 8% to 12%.",
    },
    vocab: [
      [
        "renewable",
        "able to be supplied again and again by nature",
        "Sunlight and wind are renewable sources of energy.",
        "renovable",
      ],
      [
        "fossil fuel",
        "a fuel such as coal or natural gas that formed from ancient living things",
        "Coal is a fossil fuel.",
        "combustible fósil",
      ],
      [
        "percentage point",
        "one unit of difference between two percents",
        "Coal fell by 22 percentage points.",
        "punto porcentual",
      ],
      [
        "share",
        "the part of a whole that one thing makes up",
        "Solar's share of the electricity was 22 percent.",
        "proporción",
      ],
      [
        "source",
        "the place or thing that something comes from",
        "Wind is a source of electricity.",
        "fuente",
      ],
    ],
    paras: [
      {
        text: "Every light, phone charger and refrigerator in the city of Riverton runs on electricity, but that electricity is made in different ways. The table shows how much of Riverton's electricity came from each source five years ago and this year. Each column adds up to 100 percent.",
        q: "What does the table show?",
      },
      {
        text: "Sources of electricity fall into two groups. Fossil fuels, such as coal and natural gas, are burned to make electricity, and burning them releases carbon dioxide, which traps heat in the atmosphere. Renewable sources, such as sunlight, wind and moving water, are replaced naturally and do not release carbon dioxide while making electricity.",
        q: "What are the two groups of sources?",
      },
      {
        text: "The table shows a big shift. Five years ago, coal and natural gas together supplied 72 percent of Riverton's electricity, but this year they supply 48 percent. Over the same period, renewable sources grew from 28 percent to 52 percent, which is an increase of 24 percentage points. Renewable sources now supply more than half of the city's electricity.",
        q: "How did the two groups change?",
      },
      {
        text: "Coal changed the most, falling from 32 percent to 10 percent, a drop of 22 percentage points. Solar power grew the most, rising from 8 percent to 22 percent, an increase of 14 percentage points. Wind rose by 6 points and hydropower rose by 4 points, while natural gas fell by only 2 points.",
        q: "Which sources changed the most?",
      },
      {
        text: "Percentages describe shares, not amounts. Suppose Riverton used 500 million kilowatt-hours of electricity this year. Solar's share of 22 percent means 0.22 times 500, or 110 million kilowatt-hours. Because a share is a percent of a total, readers should always ask whether the total itself has also changed.",
        q: "What is the difference between a share and an amount?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What share of Riverton's electricity came from coal this year?",
        opts: ["10 percent", "32 percent", "22 percent"],
        why: [
          "Thirty-two percent is coal's share five years ago, before it fell.",
          "Twenty-two percent is solar's share this year, which is a different source.",
        ],
        rat: "Paragraph 4 says coal fell from 32 percent to 10 percent, and the table lists 10% for this year.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 2, renewable sources are “replaced naturally.” What does renewable mean?",
        opts: [
          "supplied again by nature, so it does not run out",
          "burned in a power plant to make electricity",
          "stored in large tanks under the ground",
        ],
        why: [
          "Burning is how paragraph 2 says fossil fuels make electricity, not renewable sources.",
          "Underground storage describes fuels like gas, not sunlight, wind and moving water.",
        ],
        rat: "Paragraph 2 names sunlight, wind and moving water as renewable and says they are replaced naturally.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Complete using the table",
        type: "cloze",
        prompt: "Use the table to choose the best number for each blank.",
        cloze: [
          "This year, fossil fuels supplied ",
          ["48", "72", "52"],
          " percent of Riverton's electricity, and renewable sources supplied ",
          ["52", "28", "48"],
          " percent.",
        ],
        rat: "Paragraph 3 says coal and natural gas together supply 48 percent this year, and renewable sources supply 52 percent.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the data",
        type: "choice",
        prompt: "Which source grew by the greatest number of percentage points?",
        opts: [
          "Solar, which rose by 14 percentage points",
          "Coal, which changed by 22 percentage points",
          "Wind, which rose by 6 percentage points",
        ],
        why: [
          "Coal changed the most, but it fell instead of growing, so growth does not describe it.",
          "Wind did grow, but by fewer points than another source in the table.",
        ],
        rat: "Paragraph 4 says solar power grew the most, from 8 percent to 22 percent, an increase of 14 percentage points.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Draw a conclusion",
        type: "choice",
        prompt: "Which conclusion is best supported by the text?",
        opts: [
          "Riverton relies less on fossil fuels now than it did five years ago.",
          "Riverton uses less total electricity now than it did five years ago.",
          "Solar power is now the largest single source of electricity in Riverton.",
        ],
        why: [
          "The table shows shares of the total, so it cannot show whether the total amount went up or down.",
          "Natural gas supplies 38 percent this year, which is more than solar's 22 percent.",
        ],
        rat: "Paragraph 3 says fossil fuels fell from 72 percent to 48 percent, so Riverton relies on them less.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Purpose of a paragraph",
        type: "choice",
        prompt: "How does paragraph 5 add to the first four paragraphs?",
        opts: [
          "It shows how a percent share is turned into an amount of electricity.",
          "It repeats the numbers from the table in a different order.",
          "It argues that the city should stop using natural gas.",
        ],
        why: [
          "Paragraph 5 gives a new calculation with 500 million kilowatt-hours, so it does more than repeat the table.",
          "The text does not argue for a change in energy use; it describes and explains data.",
        ],
        rat: "Paragraph 5 multiplies 0.22 by 500 million to turn solar's 22 percent share into 110 million kilowatt-hours.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Summarize data",
        type: "short",
        prompt:
          "Explain how Riverton's electricity changed over five years. Use at least two numbers from the table or the text.",
        lookFor: [
          "Says fossil fuels fell and renewable sources grew",
          "Uses two accurate numbers such as 72 to 48 percent or 28 to 52 percent",
          "Names a source such as coal falling or solar rising",
        ],
        rubric: [
          "Describes the main change correctly",
          "Uses at least two accurate numbers",
          "Names a specific source or group",
        ],
        frame:
          "Over five years, fossil fuels ___ from ___ percent to ___ percent, while renewable sources ___ from ___ percent to ___ percent.",
        model:
          "Over five years, fossil fuels fell from 72 percent to 48 percent, while renewable sources grew from 28 percent to 52 percent. Coal dropped the most, from 32 percent to 10 percent, and solar grew the most.",
      },
    ],
    transfer: {
      prompt:
        "Another city's table shows that its renewable share rose from 15 percent to 35 percent. Explain how many percentage points it rose and what that tells you about the city's other sources.",
      lookFor: [
        "Subtracts 35 minus 15 to get 20 percentage points",
        "Says the renewable share increased",
        "Explains that the other sources together fell from 85 percent to 65 percent",
      ],
      frame:
        "The share rose from ___ to ___, which is ___ percentage points. This means the other sources ___.",
    },
    guide: {
      mini: "Have students find each column total in the table and check that it equals 100 percent. Then ask them to find the change for each row by subtracting.",
      discussion: [
        "What is the difference between a percent and a percentage point?",
        "Why can a share grow even if the amount of electricity does not?",
        "How could a city decide whether to use more solar or more wind?",
      ],
      misconception:
        "Students may treat a percent as an amount; paragraph 5 shows that a percent is a share of a total that has to be multiplied.",
      answerNotes: [
        "Question 3: 38 plus 10 is 48 percent for fossil fuels, and 22 plus 18 plus 12 is 52 percent for renewable sources.",
        "Question 4: solar rose 14 points, wind rose 6, hydropower rose 4, and coal fell 22; only solar is the greatest growth.",
      ],
      model:
        "Fossil fuels fell from 72 percent to 48 percent, and renewable sources grew from 28 percent to 52 percent. Coal fell the most and solar grew the most.",
    },
    family: family(
      "Look at the electricity bill or a graph about energy with your student. Ask your student to explain how the sources of electricity changed in the table, using numbers. You can talk in any language, then ask for one sentence in English.",
      "Miren la factura de electricidad o una gráfica sobre energía con su estudiante. Pida a su estudiante que explique cómo cambiaron las fuentes de electricidad en la tabla, usando números. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "Which energy sources are renewable?",
        "How do you find how many percentage points a source changed?",
      ],
    ),
    connections: {
      write: "Write a paragraph that describes how a city's energy sources changed, using numbers.",
      speak: "Explain aloud how the share of renewable sources changed in Riverton.",
      listen: "Listen to a talk about energy and write down each source you hear.",
    },
  },
  {
    id: "wrapping-a-box-surface-area",
    level: "C",
    title: "How Much Paper Wraps the Box? Surface Area",
    summary:
      "A student finds the surface area of a gift box, separates it from volume and uses a net to check her work.",
    genre: "Procedural text with math",
    subject: "Math (surface area)",
    topics: ["surface area", "nets", "volume compared with surface area"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain a multi-step procedure and distinguish two related ideas.",
    languageFeatures: ["sequence words", "contrast", "math vocabulary"],
    minutes: 18,
    content:
      "Explain how to find surface area by adding the areas of all faces and how it differs from volume.",
    language:
      "Use first, next, finally, whereas and in contrast to explain a procedure and compare ideas.",
    essential: "How do we measure the outside of a three-dimensional shape?",
    background: "Think about wrapping a present. How do you know how much paper to use?",
    hook: "A box has six faces. How much paper does it take to cover all of them?",
    purpose: "Read to find out how to find surface area and how it differs from volume.",
    vocab: [
      [
        "surface area",
        "the total area of all the faces of a three-dimensional shape",
        "The surface area of Hana's box is 392 square centimeters.",
        "área de superficie",
      ],
      ["face", "a flat surface of a solid shape", "A rectangular prism has six faces.", "cara"],
      [
        "net",
        "a flat pattern that folds into a three-dimensional shape",
        "Hana drew a net of the box.",
        "red",
      ],
      [
        "volume",
        "the amount of space inside a three-dimensional shape",
        "The volume of the box is 480 cubic centimeters.",
        "volumen",
      ],
      [
        "rectangular prism",
        "a solid shape with six rectangular faces",
        "The gift box is a rectangular prism.",
        "prisma rectangular",
      ],
    ],
    paras: [
      {
        text: "Hana wants to wrap a gift in a box that is 12 centimeters long, 8 centimeters wide, and 5 centimeters tall. Before she cuts the wrapping paper, she needs to know the surface area of the box. Surface area is the total area of all the faces of a three-dimensional shape.",
        q: "What does Hana need to know first?",
      },
      {
        text: "A rectangular prism has six faces, and they come in three pairs of matching rectangles. The top and bottom are each 12 by 8, so each has an area of 96 square centimeters. The front and back are each 12 by 5, so each has an area of 60 square centimeters. The two sides are each 8 by 5, so each has an area of 40 square centimeters.",
        q: "What are the faces of the box?",
      },
      {
        text: "Hana adds the areas of all six faces, and 96 + 96 + 60 + 60 + 40 + 40 equals 392. The surface area is 392 square centimeters. She can also use a shorter way by doubling the area of each pair of faces: 2 times 96 plus 2 times 60 plus 2 times 40 gives 192 plus 120 plus 80, which is also 392.",
        q: "How does Hana find the surface area?",
      },
      {
        text: "Many students confuse surface area with volume. Surface area measures the outside of the box in square units, because it covers flat faces. Volume measures the space inside the box in cubic units. Hana's box has a volume of 12 times 8 times 5, which is 480 cubic centimeters, but the paper she needs depends on the surface area.",
        q: "How is surface area different from volume?",
      },
      {
        text: "A net can help. A net is a flat pattern that folds into a three-dimensional shape. If Hana drew the net of her box, she would see all six rectangles laid out, and she could check that no face was left out or counted twice. In real life, she should cut the paper a little larger than 392 square centimeters, because the edges must overlap and fold.",
        q: "How can a net help Hana?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How many faces does a rectangular prism have?",
        opts: ["six faces", "four faces", "eight faces"],
        why: [
          "Four is the number of side faces on a box, but the top and the bottom are faces too.",
          "Eight is the number of corners of a box, which are not the same as its faces.",
        ],
        rat: "Paragraph 2 says a rectangular prism has six faces that come in three pairs.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 4, many students “confuse” surface area with volume. What does confuse mean?",
        opts: [
          "mix up two different ideas",
          "forget a rule completely",
          "compare two similar numbers",
        ],
        why: [
          "Forgetting a rule is different from mixing up two ideas; the sentence says students treat one as the other.",
          "Comparing numbers is not a mistake, and the sentence is describing a common error.",
        ],
        rat: "The paragraph then explains that the two measures are different, so confuse means to mix up two different ideas.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the procedure",
        type: "choice",
        prompt: "A cube has edges that are each 5 centimeters long. What is its surface area?",
        opts: ["150 square centimeters", "25 square centimeters", "125 square centimeters"],
        why: [
          "Twenty-five is the area of only one face, but a cube has six faces to add.",
          "One hundred twenty-five is 5 times 5 times 5, which measures the space inside in cubic units.",
        ],
        rat: "Paragraph 3 says to add the areas of all faces, and a cube has six faces of 25 square centimeters each, so 6 times 25 is 150.",
      },
      {
        kind: "summary",
        phase: "second",
        skill: "Compare two ideas",
        type: "sort",
        prompt: "Sort each description by whether it describes surface area or volume.",
        cats: ["Surface area", "Volume"],
        sortItems: [
          ["Measured in square centimeters", 0],
          ["Measured in cubic centimeters", 1],
          ["Tells how much paper covers the box", 0],
          ["Tells how much space is inside the box", 1],
          ["Equals 392 for Hana's box", 0],
          ["Equals 480 for Hana's box", 1],
        ],
        rat: "Paragraph 4 says surface area measures the outside in square units, and volume measures the space inside in cubic units.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement is best supported by paragraph 5?",
        opts: [
          "The area of the faces is the least paper Hana needs, and wrapping needs extra.",
          "The surface area of the box changes when the edges of the paper overlap.",
          "The net of the box has fewer faces than the box itself does when folded.",
        ],
        why: [
          "The surface area belongs to the box and does not change with the paper, which is only extra for folding.",
          "A net shows all six faces laid flat, so it has the same number of faces as the box.",
        ],
        rat: "Paragraph 5 says Hana should cut the paper a little larger than 392 square centimeters, because the edges must overlap and fold.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Purpose of a paragraph",
        type: "choice",
        prompt: "What is the purpose of paragraph 4?",
        opts: [
          "To warn readers about a common mix-up between two measures.",
          "To show a second way of adding the areas of all the faces.",
          "To explain how to draw the net of a box before wrapping it.",
        ],
        why: [
          "The second way of adding the areas is in paragraph 3, where Hana doubles each pair.",
          "Nets are introduced in paragraph 5, not in paragraph 4.",
        ],
        rat: "Paragraph 4 begins by saying many students confuse surface area with volume and then explains the difference.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a procedure",
        type: "short",
        prompt:
          "A box is 10 centimeters long, 6 centimeters wide, and 4 centimeters tall. Explain how to find its surface area.",
        lookFor: [
          "Finds the three pairs of faces: 10 by 6, 10 by 4 and 6 by 4",
          "Finds areas of 60, 40 and 24 and doubles each",
          "Adds 120, 80 and 48 to get 248 square centimeters",
        ],
        rubric: [
          "Identifies all six faces in three pairs",
          "Calculates each area and doubles it",
          "States the total with square units",
        ],
        frame:
          "First, I find the area of each pair of faces: ___, ___ and ___. Then I double each area and add. The surface area is ___ square centimeters.",
        model:
          "First, I find the area of each pair of faces: 10 times 6 is 60, 10 times 4 is 40, and 6 times 4 is 24. Then I double each area to get 120, 80 and 48, and I add them. The surface area is 248 square centimeters.",
      },
    ],
    transfer: {
      prompt:
        "A gift box is a cube with edges of 4 centimeters. Explain how to find its surface area and why the answer is in square units.",
      lookFor: [
        "Finds the area of one face, 4 times 4, which is 16",
        "Multiplies by 6 faces to get 96",
        "Says the answer is in square units because it measures flat faces",
      ],
      frame:
        "One face has an area of ___. A cube has ___ faces, so the surface area is ___ square centimeters, because ___.",
    },
    guide: {
      mini: "Give each student a small box. Have them trace each face on paper, label the three pairs, and add the areas, then compare the result with the volume they get by counting cubes.",
      discussion: [
        "How is surface area different from volume?",
        "Why can we double the area of each pair of faces?",
        "When might a real person need surface area, and when would they need volume?",
      ],
      misconception:
        "Students may find only the area of one face, or confuse a cube's surface area with its volume; the box and a net show that surface area covers all six faces.",
      answerNotes: [
        "Question 3: 5 times 5 is 25, and 6 times 25 is 150 square centimeters. The number 125 is the volume of the cube, in cubic centimeters.",
        "Question 7: 2 times 60 plus 2 times 40 plus 2 times 24 equals 120 plus 80 plus 48, which is 248.",
      ],
      model:
        "I find the area of each pair of faces: 60, 40 and 24. I double each one and add to get 248 square centimeters.",
    },
    family: family(
      "Find a small box at home, such as a cereal box. Ask your student to explain how to find its surface area, and how that is different from its volume. You can talk in any language, then ask for one sentence in English.",
      "Busquen en casa una caja pequeña, como una caja de cereal. Pida a su estudiante que explique cómo hallar su área de superficie y en qué se diferencia del volumen. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "How many faces does a box have, and how do you find the area of each pair?",
        "Which unit do we use for surface area, and which for volume?",
      ],
    ),
    connections: {
      write:
        "Write the steps for finding the surface area of a box, using first, next and finally.",
      speak: "Explain aloud how surface area is different from volume.",
      listen: "Listen to a talk about measuring boxes and note each measurement you hear.",
    },
  },
  {
    id: "tickets-and-inequalities",
    level: "C",
    title: "How Many Tickets Can We Buy? Inequalities in Real Life",
    summary:
      "A class with a budget writes and solves an inequality, then reads the solutions on a number line.",
    genre: "Procedural text with math",
    subject: "Math (inequalities)",
    topics: ["inequalities", "solutions", "number lines"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how to write and solve an inequality for a real situation.",
    languageFeatures: ["math vocabulary", "sequence words", "cause and effect"],
    minutes: 18,
    content:
      "Explain how to write, solve and graph an inequality for a real situation with a limit.",
    language: "Use at most, at least, fewer than and more than to describe limits.",
    essential: "How do we show a limit with math?",
    background: "Think about a time you had a budget or a maximum number of something.",
    hook: "A class has 120 dollars. How many tickets can it buy?",
    purpose: "Read to find out how an inequality shows a limit and how to solve one.",
    vocab: [
      [
        "inequality",
        "a math sentence that compares two amounts that may not be equal",
        "The inequality 8t + 24 ≤ 120 shows the budget limit.",
        "desigualdad",
      ],
      [
        "solution",
        "a number that makes an equation or inequality true",
        "The number 12 is a solution of the inequality.",
        "solución",
      ],
      [
        "at most",
        "no more than a given amount",
        "The class can spend at most 120 dollars.",
        "como máximo",
      ],
      ["at least", "no less than a given amount", "At least 15 students must sign up.", "al menos"],
      [
        "fixed",
        "staying the same no matter how many items there are",
        "The bus costs a fixed 24 dollars.",
        "fijo",
      ],
    ],
    paras: [
      {
        text: "An equation says that two amounts are equal, but many real situations have limits instead. When a problem says that something can be at most, at least, fewer than or more than a certain amount, we use an inequality. The symbols are < for less than, > for greater than, ≤ for less than or equal to, and ≥ for greater than or equal to.",
        q: "When do we use an inequality?",
      },
      {
        text: "Ms. Okafor's class has a budget of 120 dollars for a museum trip. The bus costs a fixed 24 dollars, and each ticket costs 8 dollars. The class can spend at most 120 dollars, so the total cost must be less than or equal to 120. If t stands for the number of tickets, the inequality is 8t + 24 ≤ 120.",
        q: "How does the class write the problem?",
      },
      {
        text: "To solve it, the class uses the same steps as for an equation. First, they subtract 24 from both sides to get 8t ≤ 96. Then they divide both sides by 8 to get t ≤ 12. This means the class can buy 12 tickets or fewer. Dividing by a positive number does not change the direction of the inequality sign.",
        q: "How does the class solve the inequality?",
      },
      {
        text: "A solution of an inequality is any number that makes it true. Many numbers work here: 5, 9 and 12 all make 8t + 24 ≤ 120 true, but 13 does not, because 8 times 13 plus 24 is 128, which is more than 120. Since tickets come in whole numbers and cannot be negative, the real solutions are 0, 1, 2 and so on up to 12.",
        q: "What is a solution of an inequality?",
      },
      {
        text: "On a number line, the solutions to t ≤ 12 are drawn with a closed circle at 12 and an arrow pointing left. The closed circle shows that 12 itself is included. If the inequality were t < 12, the circle would be open, because 12 would not be a solution.",
        q: "How do we graph the solutions?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What is the fixed cost of the bus in paragraph 2?",
        opts: ["24 dollars", "8 dollars", "120 dollars"],
        why: [
          "Eight dollars is the cost of one ticket, which changes with the number of tickets.",
          "One hundred twenty dollars is the whole budget for the trip, not the cost of the bus.",
        ],
        rat: "Paragraph 2 says the bus costs a fixed 24 dollars.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, the bus costs a “fixed” 24 dollars. What does fixed mean?",
        opts: [
          "staying the same for any number of tickets",
          "repaired after it has broken down",
          "picked by the students before the trip",
        ],
        why: [
          "Nothing in the text says the bus was broken or repaired; fixed describes a price that does not change.",
          "The text does not say who chose the price; it says the bus cost is 24 dollars in every case.",
        ],
        rat: "The ticket cost changes with t, but the bus cost is 24 dollars for any number of tickets, so fixed means it stays the same.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Test a number",
        type: "choice",
        prompt: "Which number is NOT a solution of 8t + 24 ≤ 120?",
        opts: ["t = 13", "t = 12", "t = 9"],
        why: [
          "The number 12 gives a total of exactly 120 dollars, which is allowed by the sign less than or equal to.",
          "The number 9 gives a total of 96 dollars, which is less than the budget of 120 dollars.",
        ],
        rat: "Paragraph 4 says 13 does not work because 8 times 13 plus 24 is 128, which is more than 120.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Complete the steps",
        type: "cloze",
        prompt: "Choose the best number for each blank to finish the solution steps.",
        cloze: [
          "Subtract ",
          ["24", "8", "120"],
          " from both sides to get 8t ≤ ",
          ["96", "144", "12"],
          ". Then divide both sides by ",
          ["8", "24", "96"],
          " to get t ≤ ",
          ["12", "15", "96"],
          ".",
        ],
        rat: "Paragraph 3 subtracts 24 from both sides to get 8t ≤ 96, and then divides both sides by 8 to get t ≤ 12.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement does paragraph 5 support?",
        opts: [
          "A closed circle at 12 means that 12 is one of the solutions.",
          "An open circle at 12 means that 12 is one of the solutions.",
          "An arrow pointing left means the solutions are greater than 12.",
        ],
        why: [
          "Paragraph 5 says an open circle shows that 12 is not a solution.",
          "An arrow pointing left shows numbers that are less than 12, not greater.",
        ],
        rat: "Paragraph 5 says the closed circle shows that 12 itself is included in the solutions.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Connect paragraphs",
        type: "choice",
        prompt: "How does paragraph 4 build on paragraph 3?",
        opts: [
          "It tests numbers to show which ones are true solutions.",
          "It shows a second way to solve the same inequality.",
          "It explains why the class should spend less money.",
        ],
        why: [
          "Paragraph 4 does not solve the inequality again; it checks numbers against the answer from paragraph 3.",
          "The text does not tell the class to spend less; it only explains the limit of 120 dollars.",
        ],
        rat: "Paragraph 4 tests 5, 9, 12 and 13 in the inequality to show which numbers make it true.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a procedure",
        type: "short",
        prompt:
          "Explain how to find the greatest number of tickets the class can buy with 120 dollars. Include the inequality and what the answer means.",
        lookFor: [
          "Writes the inequality 8t + 24 ≤ 120",
          "Subtracts 24 and divides by 8 to get t ≤ 12",
          "Says the class can buy at most 12 tickets",
        ],
        rubric: [
          "Writes a correct inequality",
          "Shows the solving steps in order",
          "Explains what the answer means in the situation",
        ],
        frame:
          "The inequality is ___. First, I subtract ___. Then I divide by ___ to get t ≤ ___. This means the class can buy ___.",
        model:
          "The inequality is 8t + 24 ≤ 120. First, I subtract 24 to get 8t ≤ 96. Then I divide by 8 to get t ≤ 12. This means the class can buy at most 12 tickets.",
      },
    ],
    transfer: {
      prompt:
        "A club has 60 dollars. The bus costs a fixed 12 dollars, and each ticket costs 6 dollars. Write an inequality for the number of tickets t and solve it.",
      lookFor: [
        "Writes 6t + 12 ≤ 60",
        "Subtracts 12 and divides by 6 to get t ≤ 8",
        "Says the club can buy at most 8 tickets",
      ],
      frame:
        "The inequality is ___. After I subtract ___ and divide by ___, I get t ≤ ___, so the club can buy ___.",
    },
    guide: {
      mini: "Write 8t + 24 ≤ 120 on the board and have students test t = 10, 12 and 13 with a calculator or by hand. Then draw the number line with a closed circle at 12.",
      discussion: [
        "How is solving an inequality like solving an equation, and how is it different?",
        "Why does the number 12 count as a solution but 13 does not?",
        "What would change if the class needed to spend at least 100 dollars?",
      ],
      misconception:
        "Students may think an inequality has only one answer; testing several numbers shows that many numbers are solutions.",
      answerNotes: [
        "Question 3: 8 times 13 plus 24 is 128, which is more than 120, so 13 is not a solution.",
        "Transfer: 6t + 12 ≤ 60 gives 6t ≤ 48 and t ≤ 8.",
      ],
      model:
        "The inequality is 8t + 24 ≤ 120. I subtract 24 and divide by 8 to get t ≤ 12, so the class can buy at most 12 tickets.",
    },
    family: family(
      "Talk about a budget at home, such as spending at most a certain amount at the store. Ask your student to explain how an inequality can describe that limit. You can talk in any language, then ask for one sentence in English.",
      "Hablen de un presupuesto en casa, como gastar como máximo cierta cantidad en la tienda. Pida a su estudiante que explique cómo una desigualdad puede describir ese límite. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What does at most mean, and which symbol shows it?",
        "Why is 12 a solution of the inequality but 13 is not?",
      ],
    ),
    connections: {
      write: "Write a paragraph that explains how to solve an inequality about a budget.",
      speak: "Explain aloud why the class can buy at most 12 tickets.",
      listen: "Listen to a talk about limits and write down words such as at most and at least.",
    },
  },
  {
    id: "bean-plants-fair-test-soil",
    level: "C",
    title: "Which Soil Helps Bean Plants Grow? A Fair Test",
    summary:
      "A science club designs a fair test, uses means to compare plant growth and thinks about the limits of its claim.",
    genre: "Science investigation report with a table",
    subject: "Science (life science and investigation)",
    topics: ["plant growth", "fair tests", "variables", "using data as evidence"],
    keyUse: "Explain",
    eldStandard: "ELD-SC",
    languageFunction: "Explain how an investigation was designed and use data to support a claim.",
    languageFeatures: ["cause and effect", "using data as evidence", "hedging and limits"],
    minutes: 18,
    content:
      "Explain how a fair test controls variables and how mean heights from a table support a claim with limits.",
    language: "Use because, the data show and might to explain evidence and limits.",
    essential: "How can a fair test help us answer a science question?",
    background: "Think about a plant you have seen growing in different places.",
    hook: "Three cups, three kinds of soil, and one question about which plants grow tallest.",
    purpose: "Read to find out how the club made its test fair and what the data show.",
    table: {
      headers: ["Soil type", "Plant heights after 14 days (cm)", "Mean height (cm)"],
      rows: [
        ["Potting soil", "11, 12, 13, 12", "12"],
        ["Garden soil", "8, 9, 10, 9", "9"],
        ["Sand", "2, 3, 4, 3", "3"],
      ],
      description:
        "A table of bean plant heights after 14 days in three kinds of soil. Potting soil plants measured 11, 12, 13 and 12 centimeters, with a mean of 12. Garden soil plants measured 8, 9, 10 and 9, with a mean of 9. Sand plants measured 2, 3, 4 and 3, with a mean of 3.",
    },
    vocab: [
      [
        "variable",
        "something in a test that can change",
        "The type of soil was the variable that the club changed.",
        "variable",
      ],
      [
        "controlled",
        "kept the same on purpose during a test",
        "The amount of water was a controlled variable.",
        "controlado",
      ],
      [
        "nutrient",
        "a substance that living things need to grow",
        "Potting soil contains nutrients that help roots.",
        "nutriente",
      ],
      [
        "mean",
        "the sum of the values divided by the number of values",
        "The mean height for potting soil was 12 centimeters.",
        "media",
      ],
      [
        "investigation",
        "a careful study that is designed to answer a question",
        "The club planned an investigation of soil.",
        "investigación",
      ],
    ],
    paras: [
      {
        text: "Plants need water, light, air and nutrients to grow. A seventh-grade science club wanted to find out whether the type of soil changes how tall bean plants grow. A good scientific investigation changes only one thing at a time, so the club designed a fair test.",
        q: "What question did the club want to answer?",
      },
      {
        text: "The club planted bean seeds in three kinds of soil: potting soil, garden soil and sand. The type of soil was the variable that the club changed on purpose. Everything else stayed the same. Each cup was the same size, held the same amount of soil, received 50 milliliters of water every other day and sat on the same sunny windowsill. Variables that stay the same in a test are called controlled variables.",
        q: "How did the club make the test fair?",
      },
      {
        text: "Each kind of soil had four cups, with one seed in every cup. Using four cups instead of one helped the club avoid being fooled by a single seed that grew badly or unusually well. After 14 days, the club measured the height of every plant in centimeters and found the mean for each kind of soil. The table shows the results.",
        q: "Why did the club use four cups of each soil?",
      },
      {
        text: "The data show a clear pattern. Plants in potting soil had a mean height of 12 centimeters, which is 3 centimeters taller than the mean for garden soil and 9 centimeters taller than the mean for sand. The club's explanation was that potting soil holds water and contains nutrients. Sand drains quickly and holds few nutrients, so roots have less to use.",
        q: "What pattern do the data show?",
      },
      {
        text: "The club was careful about its claim. The results support the idea that potting soil is best for bean plants in this test, but the club tested only one kind of plant for 14 days. To be more certain, they could repeat the test, add more cups or measure the plants for a longer time.",
        q: "Why was the club careful about its claim?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "Which variable did the club change on purpose?",
        opts: ["the type of soil", "the amount of water", "the size of the cup"],
        why: [
          "The amount of water was the same for every cup, so it was a controlled variable.",
          "Each cup was the same size, so the size of the cup was kept the same.",
        ],
        rat: "Paragraph 2 says the type of soil was the variable that the club changed on purpose.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 2, variables that stay the same are called “controlled.” What does controlled mean?",
        opts: [
          "kept the same on purpose",
          "measured at the end of the test",
          "changed by the plants as they grow",
        ],
        why: [
          "Measuring happens after 14 days, but controlled describes what the club kept the same.",
          "The plants did not change the water or the windowsill; the club kept those conditions the same.",
        ],
        rat: "The size of the cup, the amount of soil, the water and the windowsill all stayed the same, which the paragraph calls controlled.",
      },
      {
        kind: "summary",
        phase: "second",
        skill: "Sort by role in the test",
        type: "sort",
        prompt: "Sort each item by its role in the investigation.",
        cats: ["Changed on purpose", "Kept the same", "Measured"],
        sortItems: [
          ["The type of soil", 0],
          ["The amount of water", 1],
          ["The size of the cup", 1],
          ["The height of each plant", 2],
          ["The sunny windowsill", 1],
          ["The mean height for each soil", 2],
        ],
        rat: "Paragraph 2 says the soil was changed and the cup, water and windowsill were kept the same, and paragraph 3 says the club measured the height of every plant.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the table",
        type: "choice",
        prompt: "What is the mean height of the plants in garden soil?",
        opts: ["9 centimeters", "36 centimeters", "10 centimeters"],
        why: [
          "Thirty-six is the sum of the four heights, but the mean divides that sum by the number of plants.",
          "Ten centimeters is the tallest garden soil plant, not the mean of all four plants.",
        ],
        rat: "The table shows garden soil heights of 8, 9, 10 and 9, which add to 36, and 36 divided by 4 is 9.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why did the club use four cups of each soil?",
        opts: [
          "To lower the chance that one unusual plant would change the results.",
          "To make sure that all of the plants grew to the same height.",
          "To use up all of the seeds in the packet before they spoiled.",
        ],
        why: [
          "The table shows plants of different heights in each soil, so the club did not expect equal heights.",
          "The text does not mention how many seeds were in the packet or whether they would spoil.",
        ],
        rat: "Paragraph 3 says using four cups helped the club avoid being fooled by a single seed that grew badly or unusually well.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Purpose of a paragraph",
        type: "choice",
        prompt: "What is the purpose of paragraph 5?",
        opts: [
          "To explain the limits of the test and how to improve it.",
          "To announce a new investigation that uses only sand.",
          "To prove that potting soil is best for every plant.",
        ],
        why: [
          "The paragraph does not describe a new investigation; it suggests ways to repeat or extend the same one.",
          "The club tested only one kind of plant, so the paragraph says the results are limited.",
        ],
        rat: "Paragraph 5 says the club tested only one kind of plant for 14 days and suggests repeating the test with more cups or more time.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain why the club's test was a fair test. Use at least two details from paragraph 2 or paragraph 3.",
        lookFor: [
          "Says the club changed only one variable, the type of soil",
          "Names at least two controlled variables such as the cup size, the water or the windowsill",
          "Mentions that four cups of each soil were used",
        ],
        rubric: [
          "Explains that only one thing was changed",
          "Uses at least two accurate details",
          "Connects the details to a fair test",
        ],
        frame:
          "The test was fair because the club changed only ___. Everything else, such as ___ and ___, stayed the same.",
        model:
          "The test was fair because the club changed only the type of soil. Everything else, such as the size of the cup and the amount of water, stayed the same, and the club used four cups of each soil.",
      },
    ],
    transfer: {
      prompt:
        "A student wants to test whether the amount of sunlight changes how tall bean plants grow. Explain which variable to change, which to keep the same, and what to measure.",
      lookFor: [
        "Changes only the amount of sunlight",
        "Keeps soil, water, cup size and seeds the same",
        "Measures the height of each plant and compares the means",
      ],
      frame:
        "I would change only ___. I would keep ___ and ___ the same. I would measure ___ and compare ___.",
    },
    guide: {
      mini: "Write the three soil names on the board and ask students to name what stays the same in every cup. Then have them find the mean for one row of the table, showing the sum and the division.",
      discussion: [
        "Why is it important to change only one variable in a test?",
        "Would the club's claim be stronger with more cups? Why?",
        "What other question about plant growth could you test with a fair test?",
      ],
      misconception:
        "Students may think a fair test means every plant ends up the same; a fair test means that only one condition was changed on purpose.",
      answerNotes: [
        "Question 4: 8 + 9 + 10 + 9 is 36, and 36 divided by 4 is 9 centimeters.",
        "Paragraph 4 check: 12 minus 9 is 3 centimeters, and 12 minus 3 is 9 centimeters.",
      ],
      model:
        "The test was fair because the club changed only the type of soil and kept the cup, the water and the windowsill the same.",
    },
    family: family(
      "Ask your student to describe how to design a fair test with plants, such as testing how much light helps seeds grow. You can talk in any language, then ask for one sentence in English.",
      "Pida a su estudiante que describa cómo diseñar una prueba justa con plantas, como probar cuánta luz ayuda a crecer las semillas. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What did the club change on purpose, and what did it keep the same?",
        "Why did the club measure four plants for each kind of soil?",
      ],
    ),
    connections: {
      write: "Write a paragraph that explains how to make a science test fair.",
      speak: "Explain aloud how the club's data support its claim about potting soil.",
      listen: "Listen to a talk about an experiment and name the variable that was changed.",
    },
  },
];
