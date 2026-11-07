// Grades 6-8 publisher pass, Reading Room lessons, batch 3a: math reasoning and science. Original texts.
const family = (en, es, questions) => ({ en, es, questions });
export default [
  {
    id: "unit-rate-pages-per-day",
    level: "A",
    title: "Pages per Day: Finding a Unit Rate",
    summary:
      "Two friends read different numbers of pages in different numbers of days, and a unit rate shows how their reading compares.",
    genre: "Informational text with math",
    subject: "Math (ratios and rates)",
    topics: ["rates", "unit rates", "division"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how to find a unit rate and what it means.",
    languageFeatures: ["math vocabulary", "sequence words", "the word per"],
    minutes: 12,
    content: "Explain that a unit rate tells how much there is for one unit, found by dividing.",
    language: "Use per, for each and sequence words to explain a rate.",
    essential: "How can one number help us compare two different amounts?",
    background: "Think about how many pages you could read in one day.",
    hook: "Sam read 24 pages and Ana read 30 pages. Who reads more each day?",
    purpose: "Read to find out what a unit rate is and how to find one.",
    vocab: [
      [
        "rate",
        "a comparison of two different kinds of things",
        "Sam's rate compares pages with days.",
        "tasa",
      ],
      [
        "unit rate",
        "a rate that tells how much there is for 1 of something",
        "The unit rate is 6 pages for 1 day.",
        "tasa unitaria",
      ],
      ["per", "for each, or for every one", "Six pages per day means 6 pages for each day.", "por"],
      [
        "divide",
        "to split an amount into equal groups",
        "Divide 24 pages by 4 days to find the unit rate.",
        "dividir",
      ],
    ],
    paras: [
      {
        text: "Sam belongs to a reading club, and on his own he reads 24 pages in 4 days. He wants to figure out how many pages he reads during each single day.",
        q: "What does Sam want to find out?",
      },
      {
        text: "A rate is a comparison of two different kinds of things, and in this story the rate compares pages with days. Sam's rate is 24 pages for 4 days. A unit rate tells how much there is for just 1 of something, and we find it by dividing. When we divide 24 by 4, we get 6, so Sam's unit rate is 6 pages per day.",
        q: "How do you find a unit rate?",
      },
      {
        text: "The word per means for each. Six pages per day means that for each day, Sam reads 6 pages. Knowing the unit rate helps Sam make a plan, because if he keeps reading 6 pages every day, he will finish 12 pages in 2 days and 18 pages in 3 days.",
        q: "What does per mean?",
      },
      {
        text: "Sam's friend Ana reads 30 pages in 5 days. Her unit rate is also 6 pages per day, because 30 divided by 5 is 6. Even though the two friends have different totals, they read the same number of pages during each day.",
        q: "How are Sam and Ana alike?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How many pages does Sam read in 4 days?",
        opts: ["24 pages", "6 pages", "4 pages"],
        why: [
          "Six is how many pages Sam reads in one day, which is the unit rate and not the total for 4 days.",
          "Four is the number of days, not the number of pages he read.",
        ],
        rat: "Paragraph 1 says Sam reads 24 pages in 4 days.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 3, the word “per” is used. What does per mean?",
        opts: ["for each", "added to", "out of all"],
        why: [
          "Adding is a different operation; the text says per tells how much there is for each day.",
          "Out of all describes a whole group, but per describes one single day or one single unit.",
        ],
        rat: "Paragraph 3 says that per means for each, so 6 pages per day means 6 pages for each day.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of steps",
        type: "order",
        prompt: "Put the steps for finding a unit rate in the correct order.",
        items: [
          "Write the two amounts: 24 pages and 4 days.",
          "Divide the pages by the number of days.",
          "Read the answer, which is 6.",
          "Say the unit rate with per: 6 pages per day.",
        ],
        rat: "Paragraph 2 names the two amounts first, then says to divide, and then states the unit rate with per.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the procedure",
        type: "choice",
        prompt: "Mia reads 20 pages in 5 days. What is her unit rate?",
        opts: ["4 pages per day", "25 pages per day", "15 pages per day"],
        why: [
          "That adds the pages and the days, but a unit rate comes from dividing the pages by the days.",
          "That subtracts the days from the pages; the text says the way to find a unit rate is to divide.",
        ],
        rat: "Paragraph 2 says to divide, and 20 divided by 5 is 4, so Mia reads 4 pages per day.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "What does paragraph 4 show about Sam and Ana?",
        opts: [
          "They read the same number of pages each day.",
          "Ana reads more pages each day because her total is bigger.",
          "Sam reads fewer pages each day because he read for fewer days.",
        ],
        why: [
          "A bigger total does not mean a bigger unit rate; Ana also read for more days.",
          "Fewer days does not mean fewer pages each day; Sam's unit rate is the same as Ana's.",
        ],
        rat: "Paragraph 4 says both friends have a unit rate of 6 pages per day, even though their totals are different.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt: "Select the paragraph that tells what a unit rate is.",
        evidence: ["p2"],
        rat: "Paragraph 2 says that a unit rate tells how much there is for just 1 of something.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain in your own words",
        type: "short",
        prompt: "Explain how to find the unit rate when someone reads 30 pages in 5 days.",
        lookFor: [
          "Divides 30 by 5",
          "States the unit rate as 6 pages per day",
          "Uses a sequence word such as first or then",
        ],
        rubric: [
          "Uses the correct operation",
          "Gives the correct unit rate with units",
          "Explains the steps in order",
        ],
        frame: "First, I divide ___ by ___. Then I see that the unit rate is ___ pages per day.",
        model:
          "First, I divide 30 pages by 5 days. Then I see that the unit rate is 6 pages per day, which means the person reads 6 pages for each day.",
      },
    ],
    transfer: {
      prompt:
        "A store sells 3 notebooks for 12 dollars. Explain how to find the cost of 1 notebook and say what the unit rate means.",
      lookFor: [
        "Divides 12 by 3",
        "States 4 dollars per notebook",
        "Says that one notebook costs 4 dollars",
      ],
      frame: "I divide ___ by ___. The unit rate is ___ dollars per notebook, which means ___.",
    },
    guide: {
      mini: "Draw 4 boxes on the board and place 24 counters in them equally. Ask how many are in each box, then connect the picture to dividing 24 by 4 and to the phrase 6 per box.",
      discussion: [
        "How is a unit rate different from a total?",
        "Why did Sam and Ana have the same unit rate when their totals were different?",
        "What other unit rates do you see at home or at school, such as cost per item?",
      ],
      misconception:
        "Students may add or subtract the two numbers instead of dividing; acting out equal groups shows why a unit rate comes from division.",
      answerNotes: [
        "Question 4: 20 divided by 5 is 4, so Mia reads 4 pages per day. Adding gives 25 and subtracting gives 15.",
        "Question 5: Sam and Ana both read 6 pages per day, because 24 divided by 4 and 30 divided by 5 both equal 6.",
      ],
      model:
        "First, I divide 30 pages by 5 days. The unit rate is 6 pages per day, so the person reads 6 pages for each day.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to explain how 24 pages in 4 days becomes 6 pages per day. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que explique cómo 24 páginas en 4 días se convierten en 6 páginas por día. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What does the word per mean?", "How do you find how much there is for one day?"],
    ),
    connections: {
      write: "Write a paragraph that explains how to find a unit rate.",
      speak: "Explain aloud how Sam's 24 pages in 4 days became 6 pages per day.",
      listen: "Listen to a talk about ratios and rates and find the unit rate.",
    },
  },
  {
    id: "below-zero-negative-numbers",
    level: "A",
    title: "Below Zero: Negative Numbers on a Thermometer",
    summary:
      "A class tracks winter temperatures and uses a number line to compare numbers above and below zero.",
    genre: "Informational text with math",
    subject: "Math (integers)",
    topics: ["negative numbers", "integers", "number lines"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how negative numbers are ordered on a number line.",
    languageFeatures: ["comparing", "math vocabulary", "cause and effect"],
    minutes: 12,
    content:
      "Explain that negative numbers are below zero and that farther below zero means smaller.",
    language: "Use colder than, warmer than and below zero to compare numbers.",
    essential: "How can numbers show amounts that are less than zero?",
    background: "Think about a very cold day. How could a number show how cold it is?",
    hook: "A thermometer can show a number with a minus sign. What does it mean?",
    purpose: "Read to find out what negative numbers mean and how to put them in order.",
    vocab: [
      [
        "negative number",
        "a number that is less than zero",
        "Negative four is a negative number.",
        "número negativo",
      ],
      [
        "positive number",
        "a number that is greater than zero",
        "Three degrees is a positive number.",
        "número positivo",
      ],
      [
        "thermometer",
        "a tool that measures temperature",
        "Lena read the thermometer outside her window.",
        "termómetro",
      ],
      [
        "degree",
        "a unit for measuring temperature",
        "Water freezes at zero degrees Celsius.",
        "grado",
      ],
    ],
    paras: [
      {
        text: "On a cold winter morning, Lena looked at the thermometer outside her window. It showed -4 degrees Celsius. The number was below zero, so it has a negative sign. Zero degrees is the point where water freezes.",
        q: "What did Lena's thermometer show?",
      },
      {
        text: "A thermometer is like a vertical number line. Numbers above zero are positive. Numbers below zero are negative. The farther below zero a number is, the colder it is. So -8 degrees is colder than -4 degrees.",
        q: "How is a thermometer like a number line?",
      },
      {
        text: "Lena's class recorded the morning temperature for four days. On Monday it was 3 degrees. On Tuesday it was 0 degrees. On Wednesday it was -2 degrees, and on Thursday it was -5 degrees. The class used the number line to put the numbers in order. The coldest day was Thursday. The warmest day was Monday.",
        q: "How did the class put the temperatures in order?",
      },
      {
        text: "The class also found how much the temperature changed. From Tuesday at 0 to Wednesday at -2, the temperature went down 2 degrees. From Wednesday at -2 to Thursday at -5, it went down 3 degrees.",
        q: "How did the temperature change?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What temperature did Lena's thermometer show in paragraph 1?",
        opts: ["-4 degrees Celsius", "4 degrees Celsius", "-8 degrees Celsius"],
        why: [
          "A plain 4 leaves out the negative sign, so it would mean above zero instead of below zero.",
          "Negative eight is the colder example from paragraph 2, not the number on Lena's thermometer.",
        ],
        rat: "Paragraph 1 says the thermometer showed -4 degrees Celsius.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 2, a thermometer is like a “vertical” number line. What does vertical mean?",
        opts: ["going up and down", "going side to side", "going around in a circle"],
        why: [
          "A thermometer does not lie sideways; its numbers rise and fall along a tall tube.",
          "A number line is straight, so it does not curve around in a circle.",
        ],
        rat: "A thermometer's numbers go up and down, so a vertical number line goes up and down.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Classify numbers",
        type: "sort",
        prompt: "Sort each temperature as positive, negative, or zero.",
        cats: ["Positive", "Negative", "Zero"],
        sortItems: [
          ["3 degrees", 0],
          ["-2 degrees", 1],
          ["0 degrees", 2],
          ["-5 degrees", 1],
          ["7 degrees", 0],
        ],
        rat: "Paragraph 2 says numbers above zero are positive and numbers below zero are negative, so zero, which is neither above nor below zero, goes in its own group.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Order the data",
        type: "order",
        prompt: "Put the temperatures in order from coldest to warmest.",
        items: [
          "-5 degrees on Thursday",
          "-2 degrees on Wednesday",
          "0 degrees on Tuesday",
          "3 degrees on Monday",
        ],
        rat: "Paragraph 3 says Thursday was the coldest day and Monday was the warmest, and the number line puts -5, -2, 0 and 3 in that order.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why is -8 degrees colder than -4 degrees?",
        opts: [
          "It is farther below zero on the number line.",
          "It is closer to zero on the number line, so it is colder.",
          "It has more degrees of heat above the freezing point.",
        ],
        why: [
          "A number that is closer to zero is warmer, not colder, when both numbers are below zero.",
          "Heat above freezing belongs to positive numbers, and both of these numbers are below zero.",
        ],
        rat: "Paragraph 2 says the farther below zero a number is, the colder it is.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Connect paragraphs",
        type: "choice",
        prompt: "How does paragraph 3 use the idea from paragraph 2?",
        opts: [
          "It uses the number line to put four temperatures in order.",
          "It compares thermometers with other kinds of measuring tools.",
          "It explains why water freezes at zero degrees Celsius.",
        ],
        why: [
          "The paragraph is about Lena's class and its temperatures, not about other measuring tools.",
          "The freezing point is mentioned in paragraph 1, and paragraph 3 does not explain it.",
        ],
        rat: "Paragraph 3 says the class used the number line to put the temperatures in order.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "A student says that -2 degrees is warmer than -5 degrees. Is the student right? Explain using the number line.",
        lookFor: [
          "States that the student is right",
          "Says -2 is closer to zero or farther above -5",
          "Uses evidence such as Wednesday and Thursday from the text",
        ],
        rubric: [
          "Makes a clear claim",
          "Uses the number line idea correctly",
          "Connects the idea to the days in the text",
        ],
        frame:
          "The student is ___ because -2 is ___ to zero than -5. On the number line, ___ is farther below zero.",
        model:
          "The student is right because -2 is closer to zero than -5. On the number line, -5 is farther below zero, and Thursday at -5 degrees was colder than Wednesday at -2 degrees.",
      },
    ],
    transfer: {
      prompt:
        "On a mountain, the temperature was 2 degrees in the afternoon and -6 degrees at night. Explain which temperature is colder and how far the temperature went down.",
      lookFor: [
        "States that -6 degrees is colder",
        "Says -6 is farther below zero",
        "Finds a drop of 8 degrees",
      ],
      frame: "The colder temperature is ___ because ___. The temperature went down ___ degrees.",
    },
    guide: {
      mini: "Draw a vertical number line from 8 down to -8 on the board. Mark the four temperatures from paragraph 3 and ask students to read them from top to bottom.",
      discussion: [
        "What does the negative sign tell us about a number?",
        "Why is -5 colder than -2 even though 5 is greater than 2?",
        "Where else do we use numbers below zero, such as money owed or floors below ground?",
      ],
      misconception:
        "Students may think -8 is greater than -4 because 8 is greater than 4; the vertical number line shows that farther below zero means smaller.",
      answerNotes: [
        "Order from coldest to warmest: -5, -2, 0, 3.",
        "The drop from 2 to -6 in the transfer task is 8 degrees: 2 degrees down to zero, then 6 more degrees below zero.",
      ],
      model:
        "Yes, the student is right. Negative two is closer to zero than negative five, so it is warmer. Negative five is farther below zero.",
    },
    family: family(
      "Look at a thermometer with your student, or draw one. Ask your student to explain why -8 degrees is colder than -4 degrees. You can talk in any language, then ask for one sentence in English.",
      "Miren un termómetro con su estudiante, o dibujen uno. Pida a su estudiante que explique por qué -8 grados es más frío que -4 grados. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What does a negative number tell us about the temperature?",
        "Which is colder, -2 degrees or -5 degrees, and how do you know?",
      ],
    ),
    connections: {
      write: "Write sentences that compare two temperatures, using colder than and warmer than.",
      speak: "Explain aloud how to put -5, -2, 0 and 3 in order.",
      listen: "Listen to a weather report and write down any temperatures below zero.",
    },
  },
  {
    id: "why-we-have-seasons",
    level: "A",
    title: "Why Do We Have Seasons?",
    summary:
      "A common idea about the seasons is corrected, and the real cause, the tilt of Earth, is explained step by step.",
    genre: "Explanation text",
    subject: "Science (Earth and space)",
    topics: ["seasons", "Earth's tilt", "Earth and the Sun"],
    keyUse: "Explain",
    eldStandard: "ELD-SC",
    languageFunction: "Explain a cause and its effects.",
    languageFeatures: ["cause and effect", "science vocabulary", "contrast"],
    minutes: 12,
    content: "Explain that Earth's tilt, not its distance from the Sun, causes the seasons.",
    language: "Use because, so and at the same time to explain causes.",
    essential: "What causes the seasons to change?",
    background: "Think about how the weather changes through the year where you live.",
    hook: "When students in Chicago wear winter coats, students in Chile can be at the beach.",
    purpose: "Read to find out what really causes the seasons.",
    vocab: [
      [
        "season",
        "one of the four parts of the year, such as summer or winter",
        "Winter is the coldest season in the north.",
        "estación",
      ],
      [
        "axis",
        "the imaginary line that Earth spins around",
        "Earth's axis goes through the North and South Poles.",
        "eje",
      ],
      ["tilt", "to lean to one side", "Earth's tilt is about 23.5 degrees.", "inclinación"],
      [
        "orbit",
        "to travel in a path around something",
        "Earth takes one year to orbit the Sun.",
        "orbitar",
      ],
    ],
    paras: [
      {
        text: "Many people think summer happens because Earth is closer to the Sun. That idea is not correct. In fact, Earth is a little closer to the Sun in January, when it is winter in the northern half of the world.",
        q: "What wrong idea does the writer correct?",
      },
      {
        text: "Seasons happen because Earth is tilted. Earth's axis is an imaginary line through the North and South Poles. The axis leans about 23.5 degrees. As Earth orbits the Sun, which takes one year, the axis keeps pointing the same way in space.",
        q: "What causes the seasons?",
      },
      {
        text: "When the northern half of Earth leans toward the Sun, sunlight hits it more directly, and the days are longer. This makes the northern half warmer, so it is summer there. At the same time, the southern half leans away from the Sun, so it is winter there.",
        q: "What happens when the north leans toward the Sun?",
      },
      {
        text: "Six months later, Earth is on the other side of the Sun. Now the southern half leans toward the Sun. It has summer, and the north has winter. So when students in Chicago wear winter coats in January, students in Santiago, Chile are enjoying summer.",
        q: "What happens six months later?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find the key idea",
        type: "choice",
        prompt: "According to paragraph 2, what causes the seasons?",
        opts: [
          "Earth is tilted as it moves around the Sun.",
          "Earth moves closer to and farther from the Sun.",
          "The Sun becomes hotter and cooler each year.",
        ],
        why: [
          "Paragraph 1 says this popular idea is not correct, so distance is not the cause.",
          "The text never says the Sun changes; it says the tilt of Earth makes the difference.",
        ],
        rat: "Paragraph 2 begins, “Seasons happen because Earth is tilted.”",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, the axis “leans” about 23.5 degrees. What does leans mean?",
        opts: ["tilts to one side", "spins around and around", "grows longer and longer"],
        why: [
          "Spinning is a different motion; the sentence describes the angle of the axis, not its turning.",
          "An imaginary line does not grow; the number 23.5 describes how far it tilts.",
        ],
        rat: "The axis leans about 23.5 degrees, so leans means it tilts to one side.",
      },
      {
        kind: "summary",
        phase: "second",
        skill: "Complete the explanation",
        type: "cloze",
        prompt: "Choose the best word for each blank to complete the explanation.",
        cloze: [
          "When the northern half leans ",
          ["toward", "away from", "around"],
          " the Sun, it has ",
          ["summer", "winter", "no seasons"],
          ". At the same time, the southern half has ",
          ["winter", "summer", "a shorter year"],
          ".",
        ],
        rat: "Paragraph 3 says that when the north leans toward the Sun it is summer there, and at the same time the south leans away and has winter.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Use evidence",
        type: "choice",
        prompt: "Which fact best shows that distance from the Sun does not cause the seasons?",
        opts: [
          "Earth is closer to the Sun in January, during winter in the north.",
          "Earth takes one full year to travel around the Sun one time.",
          "The axis of Earth leans about 23.5 degrees as it moves.",
        ],
        why: [
          "The time for one orbit is true, but it says nothing about how distance affects the seasons.",
          "The tilt is the real cause, but this fact does not show anything about distance.",
        ],
        rat: "Paragraph 1 says Earth is closest to the Sun in January, yet the northern half has winter then.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Text structure",
        type: "choice",
        prompt: "How is this text organized?",
        opts: [
          "It corrects a wrong idea and then explains the real cause.",
          "It tells a story about students who travel to Chile.",
          "It lists the four seasons and the months of each one.",
        ],
        why: [
          "The students in Chicago and Santiago appear only at the end as an example.",
          "The text never lists the months of the seasons; it explains why they happen.",
        ],
        rat: "Paragraph 1 corrects a wrong idea, and paragraphs 2 to 4 explain the tilt that really causes the seasons.",
      },
      {
        kind: "evidence",
        phase: "second",
        skill: "Select text evidence",
        type: "evidence",
        prompt:
          "Select the paragraph that explains what happens when Earth is on the other side of the Sun.",
        evidence: ["p4"],
        rat: "Paragraph 4 says that six months later the southern half leans toward the Sun and has summer.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain why it can be summer in Chile when it is winter in Chicago. Use the word tilt.",
        lookFor: [
          "Says Earth is tilted",
          "Says the south leans toward the Sun while the north leans away",
          "Connects the tilt to summer and winter at the same time",
        ],
        rubric: [
          "States the cause correctly",
          "Uses the word tilt",
          "Explains that the two halves have opposite seasons",
        ],
        frame:
          "It can be summer in Chile and winter in Chicago because Earth's ___ makes one half lean ___ the Sun while the other half leans ___.",
        model:
          "It can be summer in Chile and winter in Chicago because Earth's tilt makes one half lean toward the Sun while the other half leans away. The half that leans toward the Sun gets more direct light and has summer.",
      },
    ],
    transfer: {
      prompt:
        "A friend says, “It is hot in July because Earth is closest to the Sun.” Explain what is wrong with this idea and what really causes the seasons.",
      lookFor: [
        "Says distance is not the cause",
        "Names the tilt of Earth as the cause",
        "Mentions that the half leaning toward the Sun is warmer",
      ],
      frame: "The idea is wrong because ___. The real cause is ___, which makes ___.",
    },
    guide: {
      mini: "Use a lamp and a tilted globe or ball. Walk the ball around the lamp with the tilt pointing the same way, and ask students to say which half is leaning toward the lamp at each stop.",
      discussion: [
        "Why do many people believe the distance idea?",
        "What would the seasons be like if Earth were not tilted?",
        "Which season is it now where you live, and which half of Earth is leaning toward the Sun?",
      ],
      misconception:
        "Students often believe summer happens when Earth is closest to the Sun; the text shows Earth is closer in January, during northern winter.",
      answerNotes: [
        "Question 3: toward, summer, winter.",
        "Question 4: paragraph 1 gives the best evidence, because Earth is closer to the Sun in January, when it is winter in the north.",
      ],
      model:
        "It can be summer in Chile and winter in Chicago because Earth is tilted. One half leans toward the Sun and has summer while the other half leans away and has winter.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to explain why seasons happen, and to correct the idea that summer is caused by being closer to the Sun. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que explique por qué ocurren las estaciones y que corrija la idea de que el verano ocurre por estar más cerca del Sol. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What really causes the seasons?",
        "What is happening in the southern half of Earth when it is winter in the north?",
      ],
    ),
    connections: {
      write: "Write a paragraph that explains why we have seasons.",
      speak: "Explain aloud why it is summer in Chile when it is winter in Chicago.",
      listen: "Listen to a talk about Earth and the Sun and compare it with this text.",
    },
  },
  {
    id: "favorite-pets-bar-graph",
    level: "A",
    title: "Favorite Pets: Reading a Bar Graph",
    summary:
      "A class votes for a favorite pet, and the bars of a graph help students compare and check the total.",
    genre: "Informational text with a table",
    subject: "Math (data displays)",
    topics: ["bar graphs", "comparing data", "totals"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain how to read and compare the bars of a bar graph.",
    languageFeatures: ["comparing", "math vocabulary", "reading a table"],
    minutes: 12,
    content: "Read a bar graph and its data table to compare amounts and check a total.",
    language: "Use more than, fewer than and the most to compare data.",
    essential: "How can a picture of data help us compare groups?",
    background: "Think about a time your class voted on something.",
    hook: "Twenty-four students voted for a favorite pet. Which pet won?",
    purpose: "Read to find out how a bar graph shows data and how to use it.",
    table: {
      headers: ["Kind of pet", "Votes"],
      rows: [
        ["Dogs", "9"],
        ["Cats", "6"],
        ["Fish", "5"],
        ["Birds", "4"],
      ],
      description:
        "A table of votes from 24 students. Dogs got 9 votes, cats got 6, fish got 5 and birds got 4.",
    },
    vocab: [
      [
        "bar graph",
        "a graph that uses bars to show amounts",
        "The bar graph shows how many students chose each pet.",
        "gráfica de barras",
      ],
      [
        "compare",
        "to look at how things are alike and different",
        "The class used the bars to compare the votes.",
        "comparar",
      ],
      [
        "total",
        "the amount you get when you add everything together",
        "The total number of votes is 24.",
        "total",
      ],
      ["vote", "a choice that a person makes in a group", "Each student made one vote.", "voto"],
    ],
    paras: [
      {
        text: "Mr. Silva's class voted for their favorite kind of pet, and each of the 24 students voted only once. Mr. Silva wrote the votes in the table. Then he drew a bar graph so that the whole class could see the results at the same time.",
        q: "What did Mr. Silva do with the votes?",
      },
      {
        text: "A bar graph uses bars to show amounts, and each bar stands for one kind of pet. The taller the bar, the more votes it shows. The bar for dogs goes up to 9, because 9 students chose dogs, and the bar for fish goes up to 5.",
        q: "How do the bars show the votes?",
      },
      {
        text: "The class used the bars to compare the pets. Dogs got the most votes, and birds got the fewest votes. Dogs got 5 more votes than birds, because 9 minus 4 is 5. Cats got 6 votes, so cats came in second place.",
        q: "What did the class find by comparing the bars?",
      },
      {
        text: "A bar graph also helps us check a total. When we add all of the bars, 9 plus 6 plus 5 plus 4 is 24. That number matches the number of students in the class, so everyone knows that every vote was counted.",
        q: "Why did the class add the bars?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "How many students chose fish?",
        opts: ["5 students", "6 students", "4 students"],
        why: [
          "Six is the number of votes for cats, which is the pet in second place.",
          "Four is the number of votes for birds, which got the fewest votes.",
        ],
        rat: "Paragraph 2 says the bar for fish goes up to 5, and the table also shows 5 votes for fish.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 3, the class used the bars to “compare.” What does compare mean?",
        opts: [
          "see how things are the same or different",
          "put all of the things together in one pile",
          "draw a picture of each one of the things",
        ],
        why: [
          "Putting things together describes adding, but the class used the bars to look for differences.",
          "Drawing was what Mr. Silva did to make the graph, not what the class did with the bars.",
        ],
        rat: "The class looked at the bars to see which pet had more votes and which had fewer, so compare means to see how they are the same or different.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the data",
        type: "choice",
        prompt: "How many more votes did dogs get than birds?",
        opts: ["5 votes", "13 votes", "4 votes"],
        why: [
          "That adds 9 and 4, but the question asks how many more, so you subtract.",
          "Four is the number of votes for birds, not the difference between the two bars.",
        ],
        rat: "Paragraph 3 says dogs got 5 more votes than birds, because 9 minus 4 is 5.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Order the data",
        type: "order",
        prompt: "Put the pets in order from the most votes to the fewest votes.",
        items: ["Dogs, 9 votes", "Cats, 6 votes", "Fish, 5 votes", "Birds, 4 votes"],
        rat: "The table and paragraph 3 show dogs with the most votes, then cats, then fish, and birds with the fewest.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Purpose of a paragraph",
        type: "choice",
        prompt: "What is the main job of paragraph 2?",
        opts: [
          "It explains how to read the bars on a graph.",
          "It tells which students voted for dogs.",
          "It shows how to add up all of the votes.",
        ],
        why: [
          "No student names are given with the votes; the paragraph is about what the bars mean.",
          "Adding all of the votes is explained in paragraph 4, not in paragraph 2.",
        ],
        rat: "Paragraph 2 says each bar stands for one kind of pet and that taller bars show more votes.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt:
          "Suppose the bars of a graph add up to 25 votes, but the class has only 24 students. What can the class infer?",
        opts: [
          "One vote may have been counted by mistake.",
          "The total does not matter when reading a graph.",
          "One student probably did not vote at all.",
        ],
        why: [
          "Paragraph 4 says the total should match the number of students, so a total does matter.",
          "If a student did not vote, the total would be less than 24, not more than 24.",
        ],
        rat: "Paragraph 4 says the total of the bars should match the number of students, so an extra vote suggests a counting mistake.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain how a bar graph helps the class find the favorite pet. Use details from paragraphs 2 and 3.",
        lookFor: [
          "Says taller bars show more votes",
          "Names dogs as the favorite with 9 votes",
          "Compares dogs with another pet using a number",
        ],
        rubric: [
          "Explains what the bars mean",
          "Uses an accurate number from the text",
          "Draws the correct conclusion",
        ],
        frame:
          "A bar graph helps the class because the taller the bar, the ___ votes. The ___ bar is the tallest, so ___ are the favorite.",
        model:
          "A bar graph helps the class because the taller the bar, the more votes it shows. The bar for dogs is the tallest at 9 votes, so dogs are the favorite pet, and they got 5 more votes than birds.",
      },
    ],
    transfer: {
      prompt:
        "A graph shows the favorite fruits of a class: apples 8, bananas 6, grapes 3. Explain how to tell which fruit is the favorite and how many students voted in all.",
      lookFor: [
        "Says apples is the favorite because it has the tallest bar and 8 votes",
        "Adds 8 + 6 + 3",
        "States that 17 students voted",
      ],
      frame:
        "The favorite is ___ because its bar is ___. To find the total, I add ___. The total is ___.",
    },
    guide: {
      mini: "Draw the four bars on the board and have students take turns telling one comparison sentence about the bars, using more than, fewer than and the most.",
      discussion: [
        "What does the height of a bar tell us?",
        "Why is it helpful to check the total after you read a graph?",
        "What question could your class vote on, and how would you show the votes?",
      ],
      misconception:
        "Students may add when the question asks how many more; draw the two bars side by side and show the extra part that sticks out above the shorter bar.",
      answerNotes: [
        "Question 3: 9 minus 4 equals 5, so dogs got 5 more votes than birds.",
        "Question 6: the total should be 24, so a total of 25 suggests one vote was counted twice.",
      ],
      model:
        "A bar graph helps because taller bars show more votes. The bar for dogs is the tallest, with 9 votes, so dogs are the favorite pet.",
    },
    family: family(
      "Look at a bar graph in a newspaper or online with your student. Ask your student to explain which bar is tallest and what that tells us. You can talk in any language, then ask for one sentence in English.",
      "Miren una gráfica de barras en un periódico o en internet con su estudiante. Pida a su estudiante que explique cuál barra es la más alta y qué nos dice. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      ["What does a taller bar mean?", "How can we check that every vote was counted?"],
    ),
    connections: {
      write: "Write three sentences that compare the bars in a bar graph.",
      speak: "Explain aloud which pet won the vote and how you know.",
      listen: "Listen to a talk about a survey and write down the number for each choice.",
    },
  },
  {
    id: "area-of-an-l-shaped-room",
    level: "B",
    title: "Two Ways to Find the Area of an L-Shaped Room",
    summary:
      "Two students find the area of an L-shaped living room by adding rectangles and by subtracting a missing corner.",
    genre: "Informational text with math",
    subject: "Math (area and composite figures)",
    topics: ["area", "composite figures", "rectangles"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain two different methods for solving one problem.",
    languageFeatures: ["sequence words", "math vocabulary", "contrast"],
    minutes: 15,
    content:
      "Explain how to find the area of an L-shaped figure by adding or subtracting rectangles.",
    language: "Use first, next, then and but to compare two methods.",
    essential: "How can we find the area of a shape that is not a rectangle?",
    background: "Think about a room or a table that is not a simple rectangle.",
    hook: "The room is shaped like the letter L, so length times width will not work by itself.",
    purpose: "Read to find out two ways to find the area of an L-shaped room.",
    vocab: [
      [
        "area",
        "the amount of flat space inside a shape",
        "The area of the floor is 52 square meters.",
        "área",
      ],
      [
        "rectangle",
        "a shape with four sides and four square corners",
        "The room can be cut into two rectangles.",
        "rectángulo",
      ],
      [
        "square meter",
        "a unit for area; a square that is 1 meter on each side",
        "The flooring covers 2 square meters in each box.",
        "metro cuadrado",
      ],
      [
        "subtract",
        "to take one amount away from another",
        "Eli will subtract the missing corner from the big square.",
        "restar",
      ],
    ],
    paras: [
      {
        text: "Dani's family is planning to put new flooring in their living room. Because the room is shaped like the letter L, Dani cannot simply multiply one length by one width, so she must find the area in a different way. Area is the amount of flat space inside a shape, and it is measured in square units.",
        q: "Why can Dani not just multiply one length by one width?",
      },
      {
        text: "Dani's first method is to cut the L into two rectangles. The bigger rectangle is 8 meters long and 5 meters wide, so its area is 8 times 5, which is 40 square meters. The smaller rectangle is 4 meters long and 3 meters wide, so its area is 4 times 3, which is 12 square meters. When she adds the two areas, she finds that 40 plus 12 is 52 square meters.",
        q: "What is Dani's first method?",
      },
      {
        text: "Dani's brother, Eli, tries a different method. He imagines the L inside a large square that measures 8 meters on each side, and that square has an area of 8 times 8, or 64 square meters. However, the corner that is missing from the L measures 4 meters by 3 meters, so its area is 12 square meters. Eli subtracts the missing corner from the square, and 64 minus 12 is 52 square meters.",
        q: "How is Eli's method different?",
      },
      {
        text: "Both methods give the same answer, which is a good sign, because Dani and Eli have checked each other's work. The flooring comes in boxes that each cover 2 square meters, so the family divides 52 by 2 and discovers that they need 26 boxes.",
        q: "How many boxes does the family need?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "In Dani's first method, what is the area of the smaller rectangle?",
        opts: ["12 square meters", "40 square meters", "7 square meters"],
        why: [
          "Forty square meters is the area of the bigger rectangle, not the smaller one.",
          "Seven comes from adding 4 and 3, but area comes from multiplying length by width.",
        ],
        rat: "Paragraph 2 says the smaller rectangle is 4 meters by 3 meters, so its area is 12 square meters.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 3, Eli “imagines” the L inside a large square. What does imagines mean?",
        opts: [
          "pictures it in his mind",
          "builds it out of wooden boards",
          "draws it on the living room floor",
        ],
        why: [
          "The text does not say Eli builds anything; he is thinking about a square that is not really there.",
          "Nothing in the paragraph says Eli draws on the floor; the square is only an idea.",
        ],
        rat: "The large square is not part of the room, so Eli imagines it, which means he pictures it in his mind.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of steps",
        type: "order",
        prompt: "Put the steps of the problem in the order the text gives them.",
        items: [
          "Cut the L into two rectangles.",
          "Find the area of each rectangle.",
          "Add the two areas together.",
          "Divide by 2 to find the number of boxes.",
        ],
        rat: "Paragraph 2 cuts the L into rectangles, finds each area and adds, and paragraph 4 divides by 2 to find the boxes.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the method",
        type: "choice",
        prompt:
          "A different L-shaped room fits inside a square that is 10 meters on each side. The missing corner measures 4 meters by 5 meters. Using Eli's method, what is the area of the room?",
        opts: ["80 square meters", "120 square meters", "20 square meters"],
        why: [
          "That adds the area of the missing corner to the square, but Eli's method takes it away.",
          "Twenty is the area of the missing corner alone, not the area of the room.",
        ],
        rat: "Paragraph 3 shows the method: the square is 10 times 10, which is 100, and the corner is 4 times 5, which is 20, so 100 minus 20 is 80.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why is it a good sign that Dani and Eli both get 52 square meters?",
        opts: [
          "It suggests that the area of 52 square meters is correct.",
          "It shows that every L-shaped room has an area of 52.",
          "It proves that adding and subtracting are the same step.",
        ],
        why: [
          "The answer belongs only to this room; other L-shaped rooms can have different measurements.",
          "Adding and subtracting are different operations, and the two methods use them in different places.",
        ],
        rat: "Paragraph 4 says Dani and Eli checked each other's work, because two different methods reached the same area.",
      },
      {
        kind: "craft",
        phase: "second",
        skill: "Author's purpose",
        type: "choice",
        prompt: "Why does the author describe two different methods for the same room?",
        opts: [
          "To show that one problem can be solved in more than one way.",
          "To explain why one method is correct and the other is wrong.",
          "To prove that Eli is better at math than his sister Dani.",
        ],
        why: [
          "Both methods give 52 square meters, so neither one is wrong.",
          "The text does not compare the two students' skill; it treats their work as equal.",
        ],
        rat: "Paragraphs 2 and 3 show two methods that both give 52 square meters, and paragraph 4 says they checked each other.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a procedure",
        type: "short",
        prompt:
          "A room is made of one rectangle that is 6 meters by 4 meters and another that is 2 meters by 3 meters. Explain how to find the total area.",
        lookFor: [
          "Multiplies 6 by 4 to get 24",
          "Multiplies 2 by 3 to get 6",
          "Adds to get 30 square meters",
        ],
        rubric: [
          "Finds the area of each rectangle correctly",
          "Adds the two areas",
          "Gives the answer in square meters",
        ],
        frame:
          "First, I find the area of each rectangle: ___ and ___. Then I add them. The total area is ___ square meters.",
        model:
          "First, I find the area of each rectangle: 6 times 4 is 24 and 2 times 3 is 6. Then I add 24 and 6. The total area is 30 square meters.",
      },
    ],
    transfer: {
      prompt:
        "A garden bed is shaped like an L. It can be cut into a 9-meter by 2-meter rectangle and a 3-meter by 2-meter rectangle. Explain how to find its area and what the answer means.",
      lookFor: [
        "Multiplies 9 by 2 to get 18 and 3 by 2 to get 6",
        "Adds to get 24",
        "Says the garden covers 24 square meters",
      ],
      frame:
        "I find the area of each rectangle: ___ and ___. I add them to get ___ square meters, which means ___.",
    },
    guide: {
      mini: "Draw the L on grid paper. Cut it two ways: into two rectangles, and as a big rectangle with a corner removed. Ask students to find the area both ways and compare.",
      discussion: [
        "Which method, adding or subtracting, seems easier to you for this room? Why?",
        "Why is area measured in square units and not in plain meters?",
        "How could you cut the L a third way?",
      ],
      misconception:
        "Students may add the lengths instead of multiplying, or forget to subtract the missing corner; the grid shows that area counts squares.",
      answerNotes: [
        "Question 4: 10 times 10 is 100, and 4 times 5 is 20. Then 100 minus 20 is 80 square meters.",
        "Question 7: 6 times 4 is 24, 2 times 3 is 6, and 24 plus 6 is 30 square meters.",
      ],
      model:
        "First, I find each area: 6 times 4 is 24 and 2 times 3 is 6. Then I add them to get 30 square meters.",
    },
    family: family(
      "Draw an L-shaped figure together on paper. Ask your student to cut it into two rectangles and explain how to find the area. You can talk in any language, then ask for one sentence in English.",
      "Dibujen juntos una figura en forma de L en papel. Pida a su estudiante que la divida en dos rectángulos y explique cómo hallar el área. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "How can you find the area of a shape that is not a rectangle?",
        "Why is it helpful to find the area in two different ways?",
      ],
    ),
    connections: {
      write: "Write a paragraph that explains one way to find the area of an L-shaped room.",
      speak: "Explain aloud how Dani and Eli both found 52 square meters.",
      listen: "Listen to a talk about area and write down each measurement you hear.",
    },
  },
  {
    id: "solving-equations-balanced-scale",
    level: "B",
    title: "Solving an Equation Like a Balanced Scale",
    summary:
      "A balanced scale with marbles shows why you must do the same thing to both sides of an equation.",
    genre: "Procedural text with math",
    subject: "Math (equations)",
    topics: ["equations", "variables", "inverse operations"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Explain the steps for solving an equation and why they work.",
    languageFeatures: ["sequence words", "math vocabulary", "cause and effect"],
    minutes: 15,
    content:
      "Explain that an equation stays balanced when the same operation is done to both sides.",
    language: "Use first, next, so and because to explain a procedure.",
    essential: "Why must we do the same thing to both sides of an equation?",
    background: "Think about a seesaw or a scale. What happens if one side gets heavier?",
    hook: "A bag of marbles hides a secret number. How can a balanced scale help us find it?",
    purpose: "Read to find out how to solve an equation and how to check the answer.",
    vocab: [
      [
        "equation",
        "a math sentence that says two amounts are equal",
        "The equation x + 3 = 11 describes the scale.",
        "ecuación",
      ],
      [
        "variable",
        "a letter that stands for a number we do not know",
        "The variable x stands for the marbles in the bag.",
        "variable",
      ],
      [
        "balanced",
        "having equal amounts on both sides",
        "The scale is balanced, so both sides are equal.",
        "equilibrado",
      ],
      [
        "check",
        "to test an answer to see if it is correct",
        "We check the answer by putting 8 in place of x.",
        "comprobar",
      ],
    ],
    paras: [
      {
        text: "An equation is a math sentence that says two amounts are equal. You can think of an equation as a balanced scale, because the amount on the left side has the same value as the amount on the right side. Letters called variables stand for numbers that we do not know yet.",
        q: "What is an equation?",
      },
      {
        text: "Imagine a scale with a bag on the left pan. The bag holds an unknown number of marbles, and we call that number x. Next to the bag are 3 loose marbles, and on the right pan are 11 marbles. Because the scale is balanced, we can write the equation x + 3 = 11.",
        q: "What does the scale show?",
      },
      {
        text: "To find x, we need to get the bag by itself, so we remove 3 marbles from the left pan. Now the scale would tip, so we must remove 3 marbles from the right pan too. That leaves x on one side and 8 on the other side. Therefore x = 8, which means the bag holds 8 marbles.",
        q: "How do we find x?",
      },
      {
        text: "This is the key rule: whatever you do to one side of an equation, you must also do to the other side. The rule works for multiplication and division as well. Suppose 3 bags of the same size balance 18 marbles, which we write as 3x = 18. If we divide both sides by 3, then x = 6, so each bag holds 6 marbles.",
        q: "What is the key rule?",
      },
      {
        text: "Finally, we check the answer. In the first equation, we put 8 in place of x and get 8 + 3 = 11. That is true, so the answer is correct.",
        q: "How do we check an answer?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "In paragraph 2, how many marbles are on the right pan?",
        opts: ["11 marbles", "3 marbles", "8 marbles"],
        why: [
          "Three is the number of loose marbles on the left pan, next to the bag.",
          "Eight is the answer for the bag, which is found later in paragraph 3.",
        ],
        rat: "Paragraph 2 says that 11 marbles are on the right pan.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt:
          "In paragraph 1, “variables” stand for numbers “we do not know yet.” What is a variable?",
        opts: [
          "a letter that stands for an unknown number",
          "a number that changes from day to day",
          "a sign that shows two amounts are equal",
        ],
        why: [
          "A variable does not change by the day; it stands for one number we have not found yet.",
          "The equal sign is the symbol that shows equal amounts, and a variable is a letter.",
        ],
        rat: "Paragraph 1 says letters called variables stand for numbers that we do not know yet.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Sequence of steps",
        type: "order",
        prompt: "Put the steps for solving x + 3 = 11 in the order the text gives them.",
        items: [
          "Write an equation that matches the balanced scale.",
          "Take 3 away from both sides.",
          "Read the value of x, which is 8.",
          "Put 8 in place of x to check the answer.",
        ],
        rat: "Paragraph 2 writes the equation, paragraph 3 removes 3 from both sides and reads x, and paragraph 5 checks the answer.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the procedure",
        type: "choice",
        prompt: "A bag and 5 loose marbles balance 12 marbles, so x + 5 = 12. What is x?",
        opts: ["7 marbles", "17 marbles", "60 marbles"],
        why: [
          "That adds 5 to 12, but the text says to remove the loose marbles from both sides.",
          "That multiplies 5 by 12, but nothing in the equation tells you to multiply.",
        ],
        rat: "Paragraph 3 shows how to remove the loose marbles from both sides, and 12 minus 5 is 7.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why must 3 marbles also be removed from the right pan in paragraph 3?",
        opts: [
          "Removing marbles from one side only would make the scale tip.",
          "The right pan is heavier than the left pan at the start.",
          "The rule says to take marbles only from the larger side.",
        ],
        why: [
          "The scale starts out balanced, so neither pan is heavier at the beginning.",
          "Paragraph 4 says to do the same thing to both sides, not to the larger side only.",
        ],
        rat: "Paragraph 3 says that removing 3 from the left alone would tip the scale, so the same amount must come off the right.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Connect paragraphs",
        type: "choice",
        prompt: "How does paragraph 5 fit with the rest of the text?",
        opts: [
          "It shows how to test the answer found in the earlier steps.",
          "It starts a new problem that has a different variable.",
          "It repeats the key rule from paragraph 4 in new words.",
        ],
        why: [
          "Paragraph 5 uses the same equation, x + 3 = 11, and the same variable, x.",
          "The key rule is in paragraph 4, and paragraph 5 does something different with it.",
        ],
        rat: "Paragraph 5 puts 8 in place of x in the first equation to see that 8 + 3 equals 11.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain a procedure",
        type: "short",
        prompt: "Solve 4x = 20. Tell what you do to both sides and how you check your answer.",
        lookFor: [
          "Divides both sides by 4",
          "States that x = 5",
          "Checks by putting 5 in place of x to get 20",
        ],
        rubric: [
          "Uses the correct operation on both sides",
          "Gives the correct value of x",
          "Explains a check",
        ],
        frame:
          "I divide both sides by ___. Then x = ___. To check, I put ___ in place of x and get ___.",
        model:
          "I divide both sides by 4. Then x = 5. To check, I put 5 in place of x, and 4 times 5 is 20, so the answer is correct.",
      },
    ],
    transfer: {
      prompt:
        "A scale shows x + 9 = 14. Explain how to find x and how to check it, using the idea of keeping the scale balanced.",
      lookFor: ["Takes 9 away from both sides", "Finds x = 5", "Checks that 5 + 9 equals 14"],
      frame: "I take ___ away from both sides because ___. Then x = ___. To check, ___.",
    },
    guide: {
      mini: "Use a real balance or draw one on the board. Put an unknown bag and 3 counters on one side and 11 counters on the other, and remove counters from both sides step by step.",
      discussion: [
        "Why does an equation stay true when we do the same thing to both sides?",
        "How is subtracting 3 from both sides different from dividing both sides by 3?",
        "Why is checking the answer a good habit?",
      ],
      misconception:
        "Students may change only one side of the equation; the balance picture shows that the scale tips if the two sides are not treated the same way.",
      answerNotes: [
        "Question 4: 12 minus 5 is 7. Adding gives 17 and multiplying gives 60, both common errors.",
        "Question 7: 20 divided by 4 is 5, and 4 times 5 equals 20.",
      ],
      model:
        "I divide both sides by 4 to get x = 5. I check by putting 5 in place of x: 4 times 5 is 20, so it is correct.",
    },
    family: family(
      "Use a bag and small objects at home to act out the balanced scale. Ask your student to explain why the same number must be taken from both sides. You can talk in any language, then ask for one sentence in English.",
      "Usen una bolsa y objetos pequeños en casa para representar la balanza. Pida a su estudiante que explique por qué se debe quitar el mismo número de ambos lados. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What does the variable x stand for in the story?",
        "How can you check that your answer to an equation is right?",
      ],
    ),
    connections: {
      write: "Write the steps for solving an equation, using first, next and finally.",
      speak: "Explain aloud why you do the same thing to both sides of an equation.",
      listen: "Listen to a math talk and write down each equation you hear.",
    },
  },
  {
    id: "pizza-box-solar-oven",
    level: "B",
    title: "A Solar Oven Made from a Pizza Box",
    summary:
      "Students build and test a solar oven and use temperature data to decide whether a foil flap helps.",
    genre: "Explanation text with data",
    subject: "Science (energy and engineering)",
    topics: ["solar energy", "reflection and absorption", "engineering design"],
    keyUse: "Explain",
    eldStandard: "ELD-SC",
    languageFunction: "Explain how a design works and use data as evidence.",
    languageFeatures: ["cause and effect", "science vocabulary", "using data as evidence"],
    minutes: 15,
    content:
      "Explain how reflecting, absorbing and trapping heat make a solar oven work, and use data as evidence.",
    language: "Use because, so that and compared with to explain a design and its data.",
    essential: "How can sunlight be used to heat food?",
    background: "Think about how hot a car can get when it sits in the sun.",
    hook: "A cardboard box can warm food with no electricity and no fire. How?",
    purpose: "Read to find out how each part of a solar oven works and what the test showed.",
    vocab: [
      [
        "reflect",
        "to bounce light back instead of letting it pass through",
        "Shiny foil reflects sunlight into the box.",
        "reflejar",
      ],
      [
        "absorb",
        "to take in light or heat",
        "Black paper absorbs light and changes it to heat.",
        "absorber",
      ],
      [
        "trap",
        "to keep something from escaping",
        "Plastic wrap traps warm air inside the box.",
        "atrapar",
      ],
      ["solar", "coming from the Sun", "A solar oven uses energy from the Sun.", "solar"],
    ],
    paras: [
      {
        text: "A solar oven cooks food using only energy from the Sun. A group of students built one from a pizza box. Their goal was to warm a snack without using electricity or fire.",
        q: "What was the students' goal?",
      },
      {
        text: "The students cut a flap in the lid and covered the inside of the flap with aluminum foil. Foil is shiny, so it reflects sunlight. They propped the flap open so the foil bounced extra light into the box. Inside the box, they taped a sheet of black paper to the bottom. Dark colors absorb light and change it into heat.",
        q: "What do the foil and the black paper do?",
      },
      {
        text: "Next, the students covered the opening with clear plastic wrap. The wrap lets sunlight in, but it traps warm air inside, like the windows of a car on a sunny day. Without the plastic, the warm air would blow away.",
        q: "What does the plastic wrap do?",
      },
      {
        text: "To test the design, the students set the oven in the sun with a thermometer inside. The air started at 22 degrees Celsius. After one hour, it measured 68 degrees. They also tested a second box that had no foil flap. In the same hour, that box reached only 54 degrees. The foil oven was 14 degrees warmer.",
        q: "What did the test show?",
      },
      {
        text: "The data supported the students' idea that reflecting more light makes the oven hotter. Still, they wondered what else they could change. A bigger flap or a darker bottom might raise the temperature even more, but they would have to test one change at a time.",
        q: "What did the students want to do next?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What was the air temperature inside the foil oven after one hour?",
        opts: ["68 degrees Celsius", "22 degrees Celsius", "54 degrees Celsius"],
        why: [
          "Twenty-two degrees is where the air started, before the oven sat in the sun for an hour.",
          "Fifty-four degrees is the temperature of the box with no foil flap, not the foil oven.",
        ],
        rat: "Paragraph 4 says that after one hour the air in the foil oven measured 68 degrees.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 2, foil “reflects” sunlight. What does reflects mean?",
        opts: [
          "bounces the light back",
          "soaks the light inside itself",
          "turns the light into sound",
        ],
        why: [
          "Soaking light in is what the black paper does, which the text calls absorbing.",
          "Nothing in the text says light becomes sound; the foil sends the light somewhere else.",
        ],
        rat: "The foil is shiny and bounces extra light into the box, so reflects means bounces the light back.",
      },
      {
        kind: "summary",
        phase: "second",
        skill: "Sort by function",
        type: "sort",
        prompt: "Sort each part of the oven by the job it does.",
        cats: ["Reflects light", "Absorbs light", "Traps warm air"],
        sortItems: [
          ["Aluminum foil on the flap", 0],
          ["Black paper on the bottom", 1],
          ["Clear plastic wrap over the opening", 2],
          ["Shiny foil that bounces sunlight into the box", 0],
          ["A dark surface that turns light into heat", 1],
          ["A cover that keeps warm air from blowing away", 2],
        ],
        rat: "Paragraph 2 says foil reflects light and black paper absorbs it, and paragraph 3 says the plastic wrap traps warm air.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the data",
        type: "choice",
        prompt: "How much warmer was the foil oven than the box with no foil flap?",
        opts: ["14 degrees", "46 degrees", "22 degrees"],
        why: [
          "Forty-six is how much the foil oven warmed up from its own starting point, not the difference between the two boxes.",
          "Twenty-two degrees is the starting temperature, which is not a comparison of the two boxes.",
        ],
        rat: "Paragraph 4 says the foil oven reached 68 degrees and the other box reached 54, so it was 14 degrees warmer.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Why did the students test a second box that had no foil flap?",
        opts: [
          "To see whether the foil flap made a difference.",
          "To find a box that would never get warm at all.",
          "To prove that plastic wrap is not needed.",
        ],
        why: [
          "The students wanted to learn about the foil flap, and the text does not say they wanted a cold box.",
          "The text says the second box was tested to compare the foil flap, and it never says the students tested the plastic wrap.",
        ],
        rat: "Paragraph 4 says the second box had no foil flap, so comparing the two boxes shows what the foil does.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Connect paragraphs",
        type: "choice",
        prompt: "How does paragraph 5 connect to paragraph 4?",
        opts: [
          "It tells what the test data suggest and what to try next.",
          "It shows that the test data were wrong and must be repeated.",
          "It describes how the students built the pizza box oven.",
        ],
        why: [
          "Paragraph 5 says the data supported the students' idea, so the data were not wrong.",
          "The building of the oven is described in paragraphs 2 and 3, before the test.",
        ],
        rat: "Paragraph 5 says the data supported the idea about reflecting light and then suggests changes to test next.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Explain with evidence",
        type: "short",
        prompt:
          "Explain how the black paper and the plastic wrap each help the oven get hot. Use details from paragraphs 2 and 3.",
        lookFor: [
          "Says black paper absorbs light and changes it into heat",
          "Says plastic wrap lets light in and traps warm air",
          "Connects both parts to a warmer oven",
        ],
        rubric: [
          "Explains the job of the black paper",
          "Explains the job of the plastic wrap",
          "Uses details from the text",
        ],
        frame:
          "The black paper helps because it ___ light and changes it into ___. The plastic wrap helps because it ___ the warm air.",
        model:
          "The black paper helps because it absorbs light and changes it into heat. The plastic wrap helps because it lets sunlight in but traps the warm air, so the heat cannot blow away.",
      },
    ],
    transfer: {
      prompt:
        "A student wants to make the solar oven hotter by adding a second foil flap. Explain how the student could test this idea fairly and what data to collect.",
      lookFor: [
        "Changes only one thing, the second foil flap",
        "Compares two boxes in the sun for the same amount of time",
        "Records the temperature of each box with a thermometer",
      ],
      frame: "I would change only ___. I would compare ___ boxes in the sun and record ___.",
    },
    guide: {
      mini: "If possible, set a shiny card and a black card in sunlight and have students feel the difference with a thermometer or their hands. Name each as reflecting or absorbing.",
      discussion: [
        "Why is it important to test a second box with no foil?",
        "Which part of the oven is most important, in your opinion? What evidence supports your idea?",
        "What could the students change next, and how could they test it?",
      ],
      misconception:
        "Students may think foil makes heat by itself; the text shows that foil reflects light and that the black paper changes light into heat.",
      answerNotes: [
        "Question 4: 68 minus 54 is 14 degrees. The foil oven warmed by 46 degrees from its start, which answers a different question.",
        "Question 3: foil reflects light, black paper absorbs light, and plastic wrap traps warm air.",
      ],
      model:
        "The black paper absorbs light and changes it into heat. The plastic wrap lets sunlight in but traps warm air, so the oven gets hot.",
    },
    family: family(
      "Read one paragraph at a time. Ask your student to explain what the foil, the black paper and the plastic wrap each do. You can talk in any language, then ask for one sentence in English.",
      "Lean un párrafo a la vez. Pida a su estudiante que explique qué hace el papel aluminio, el papel negro y el envoltorio de plástico. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "Why did the students test a box with no foil?",
        "What did the thermometer show for the two boxes?",
      ],
    ),
    connections: {
      write: "Write a paragraph that explains how a solar oven works.",
      speak: "Explain aloud how the foil, the black paper and the plastic wrap each help.",
      listen: "Listen to a talk about solar energy and write down one way people use it.",
    },
  },
  {
    id: "mean-or-median-two-bike-shops",
    level: "C",
    title: "Mean or Median? Two Bike Shops Compared",
    summary:
      "A shopper compares used-bike prices at two shops and learns when an outlier makes the median a better measure of center than the mean.",
    genre: "Informational text with data",
    subject: "Math (statistics)",
    topics: ["mean", "median", "outliers", "range"],
    keyUse: "Explain",
    eldStandard: "ELD-MA",
    languageFunction: "Compare two measures of center and justify a choice with evidence.",
    languageFeatures: ["comparing and contrasting", "math vocabulary", "justifying a choice"],
    minutes: 18,
    content:
      "Explain how an outlier affects the mean and the median and choose the better measure of center.",
    language: "Use because, however and whereas to justify a choice with data.",
    essential: "How do we choose the best number to describe a whole data set?",
    background: "Think about a time one very high or very low number changed an average.",
    hook: "One expensive bike can change a shop's average price, but does it change the typical price?",
    purpose: "Read to find out how the mean and the median respond to an outlier.",
    table: {
      headers: ["Shop", "Prices of five used bikes", "Mean", "Median", "Range"],
      rows: [
        ["Corner Bikes", "$120, $130, $140, $150, $460", "$200", "$140", "$340"],
        ["Park Cycles", "$160, $170, $180, $190, $200", "$180", "$180", "$40"],
      ],
      description:
        "A table that compares two bike shops. Corner Bikes has a mean of $200, a median of $140 and a range of $340. Park Cycles has a mean of $180, a median of $180 and a range of $40.",
    },
    vocab: [
      [
        "mean",
        "the sum of the values divided by the number of values",
        "The mean price at Corner Bikes is $200.",
        "media",
      ],
      [
        "median",
        "the middle value when the data are in order",
        "The median price at Corner Bikes is $140.",
        "mediana",
      ],
      [
        "outlier",
        "a value that is far away from the other values",
        "The $460 bike is an outlier.",
        "valor atípico",
      ],
      [
        "range",
        "the highest value minus the lowest value",
        "The range at Park Cycles is $40.",
        "rango",
      ],
      [
        "measure of center",
        "one number that describes the middle or typical value of a data set",
        "The mean and the median are measures of center.",
        "medida de tendencia central",
      ],
    ],
    paras: [
      {
        text: "Two bike shops, Corner Bikes and Park Cycles, each have five used bicycles for sale. A shopper named Priya wants to compare their prices, so she calculates two measures of center, the mean and the median. A measure of center is a single number that describes the middle or typical value of a data set.",
        q: "What does Priya want to compare?",
      },
      {
        text: "The mean is the sum of all the values divided by the number of values. At Corner Bikes, the five prices add up to $1,000, and when 1,000 is divided by 5, the mean is $200. The median is the middle value after the data have been arranged in order, and at Corner Bikes the middle price is $140. Although both numbers are supposed to describe the center, they disagree by $60.",
        q: "How are the mean and the median found?",
      },
      {
        text: "To understand the disagreement, Priya examines the data more carefully. One bicycle at Corner Bikes costs $460, which is much higher than every other price in the shop. A value that is far away from the rest of the data is called an outlier. An outlier pulls the mean upward, because the mean depends on every value in the data set, whereas the median depends only on the middle position. For this shop, the median of $140 describes a typical bicycle better than the mean of $200 does, since four of the five bicycles cost $150 or less.",
        q: "Why do the mean and the median differ at Corner Bikes?",
      },
      {
        text: "Park Cycles has no outlier. Its prices are $160, $170, $180, $190 and $200, so the mean and the median are both $180. When the data are spread evenly in this way, either measure describes the center well. Priya also considers the range, which is the highest price minus the lowest price. The range at Park Cycles is only $40, while the range at Corner Bikes is $340, which means the prices at Park Cycles are much closer together.",
        q: "How is Park Cycles different?",
      },
      {
        text: "Priya concludes that a single number never tells the whole story about a data set. She will use the median to describe the typical price, the range to describe how much the prices vary, and the mean only when no outlier is present.",
        q: "What does Priya decide?",
      },
    ],
    qs: [
      {
        kind: "literal",
        phase: "first",
        skill: "Find a detail",
        type: "choice",
        prompt: "What is the median price at Corner Bikes?",
        opts: ["$140", "$200", "$460"],
        why: [
          "Two hundred dollars is the mean price, which is pulled upward by the expensive bike.",
          "Four hundred sixty dollars is the highest price, not the middle price in the list.",
        ],
        rat: "Paragraph 2 says that the middle price at Corner Bikes is $140.",
      },
      {
        kind: "vocab",
        phase: "first",
        skill: "Word meaning in context",
        type: "choice",
        prompt: "In paragraph 3, an outlier “pulls” the mean upward. What does pulls mean here?",
        opts: [
          "moves it toward a higher value",
          "drags it along the ground slowly",
          "makes it harder to calculate",
        ],
        why: [
          "Nothing in the sentence is dragged on the ground; pulls is used for the effect of a high number.",
          "The mean is no harder to calculate with an outlier; the number it produces is simply higher.",
        ],
        rat: "The outlier is a very high price, so it moves the mean toward a higher value, which makes the mean $200 instead of $140.",
      },
      {
        kind: "data",
        phase: "second",
        skill: "Use the data",
        type: "choice",
        prompt:
          "Suppose Corner Bikes sells the $460 bike. The other four prices are $120, $130, $140 and $150. What is the new mean?",
        opts: ["$135", "$200", "$140"],
        why: [
          "Two hundred dollars was the mean when the $460 bike was still in the data set.",
          "One hundred forty dollars was the old median; the new mean needs the sum of four prices divided by four.",
        ],
        rat: "Paragraph 2 gives the method: 120 + 130 + 140 + 150 is 540, and 540 divided by 4 is $135.",
      },
      {
        kind: "summary",
        phase: "second",
        skill: "Sort by concept",
        type: "sort",
        prompt: "Sort each description by the measure it describes.",
        cats: ["Mean", "Median", "Range"],
        sortItems: [
          ["The sum of the prices divided by 5", 0],
          ["The middle price when the prices are in order", 1],
          ["The highest price minus the lowest price", 2],
          ["Gets pulled upward by the $460 bike", 0],
          ["Stays near the typical price of $140 even with the $460 bike", 1],
          ["Equals $340 at Corner Bikes", 2],
        ],
        rat: "Paragraphs 2 to 4 define the mean as a sum divided by the count, the median as the middle value and the range as highest minus lowest.",
      },
      {
        kind: "inference",
        phase: "second",
        skill: "Make an inference",
        type: "choice",
        prompt: "Which statement does paragraph 3 best support?",
        opts: [
          "The median describes a typical Corner Bikes price better than the mean does.",
          "The mean is the best measure of center for every kind of data set.",
          "The median cannot be found when a data set contains an outlier.",
        ],
        why: [
          "Paragraph 3 shows a case where the mean is misleading, so it is not the best choice every time.",
          "The median is still found in the same way; paragraph 3 says an outlier does not move it much.",
        ],
        rat: "Paragraph 3 says four of the five bikes cost $150 or less, so the median of $140 is closer to a typical price than the mean of $200.",
      },
      {
        kind: "structure",
        phase: "second",
        skill: "Compare paragraphs",
        type: "choice",
        prompt: "How does paragraph 4 contrast with paragraph 3?",
        opts: [
          "It gives a case with no outlier, where the mean and the median agree.",
          "It gives a case with a bigger outlier, where the two measures differ more.",
          "It repeats the Corner Bikes data to explain the median once again.",
        ],
        why: [
          "Paragraph 4 says Park Cycles has no outlier, so there is no bigger outlier in its prices.",
          "Paragraph 4 is about a different shop, Park Cycles, and it does not repeat the Corner Bikes prices.",
        ],
        rat: "Paragraph 4 says Park Cycles has no outlier and that the mean and median are both $180.",
      },
      {
        kind: "constructed",
        phase: "third",
        skill: "Justify a choice with evidence",
        type: "short",
        prompt:
          "Which measure of center should Priya use to describe the typical price at Corner Bikes? Explain with two details from the text.",
        lookFor: [
          "Chooses the median",
          "Names the $460 outlier and that it pulls the mean up to $200",
          "Gives a number such as the median of $140 or four of five bikes at $150 or less",
        ],
        rubric: [
          "States a clear choice",
          "Uses at least two accurate details from the text",
          "Explains why the outlier matters",
        ],
        frame:
          "Priya should use the ___ because the ___ bike is an outlier. It pulls the mean up to ___, but the median is ___.",
        model:
          "Priya should use the median because the $460 bike is an outlier. It pulls the mean up to $200, but the median is $140, and four of the five bikes cost $150 or less.",
      },
    ],
    transfer: {
      prompt:
        "A third shop has bike prices of $90, $100, $110, $120 and $330. Find the median and the mean, and explain which one describes the typical price better.",
      lookFor: [
        "Finds the median of $110",
        "Finds the mean of $150 from 750 divided by 5",
        "Says the median is better because $330 is an outlier",
      ],
      frame:
        "The median is ___ and the mean is ___. The ___ describes the typical price better because ___.",
    },
    guide: {
      mini: "Write the five Corner Bikes prices on sticky notes. Order them for the median, then take away the $460 note and recalculate the mean of the other four prices to show what changes and what does not.",
      discussion: [
        "How does an outlier change the mean but not the median?",
        "When would the mean still be a good choice, and why?",
        "What does the range tell you that the mean and median do not?",
      ],
      misconception:
        "Students may think the mean is always the best average; the data show that one outlier can move it far away from the typical value.",
      answerNotes: [
        "Question 3: 120 + 130 + 140 + 150 = 540, and 540 divided by 4 is 135.",
        "Transfer: the median is 110, the sum is 750, and the mean is 150; the $330 outlier pulls the mean above the typical price.",
      ],
      model:
        "Priya should use the median because the $460 bike is an outlier that pulls the mean up to $200. The median of $140 is closer to what most bikes cost.",
    },
    family: family(
      "Write five numbers on paper with one that is much larger than the rest. Ask your student to find the mean and the median and explain why they are different. You can talk in any language, then ask for one sentence in English.",
      "Escriban en un papel cinco números, uno de ellos mucho mayor que los demás. Pida a su estudiante que halle la media y la mediana y explique por qué son diferentes. Pueden conversar en cualquier idioma y luego pedir una oración en inglés.",
      [
        "What is an outlier, and how does it change the mean?",
        "When is the median a better choice than the mean?",
      ],
    ),
    connections: {
      write:
        "Write a paragraph that explains whether the mean or the median is better for a data set with an outlier.",
      speak: "Explain aloud why the mean and the median are different at Corner Bikes.",
      listen: "Listen to a talk about statistics and note any mention of mean, median or range.",
    },
  },
];
