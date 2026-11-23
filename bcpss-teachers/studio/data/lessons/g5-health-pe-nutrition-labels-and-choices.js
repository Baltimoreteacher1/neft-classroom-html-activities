// Lesson pack: Nutrition Labels and Choices (grade 5 health). Original snack labels; every number is computed or recomputed by calc.
import {
  SNACK_A,
  SNACK_B,
  calloutLabel,
  labelVisual,
  miniCard,
  twoLabels,
} from "../kits/c8-nutrition-labels.js";

const snackTable = {
  kind: "table",
  alt: "A table comparing three invented snacks. Snack C: 190 calories, fiber 11 percent, added sugars 0 percent, sodium 5 percent. Snack D: 150 calories, fiber 4 percent, added sugars 2 percent, sodium 12 percent. Snack E: 140 calories, fiber 0 percent, added sugars 48 percent, sodium 1 percent.",
  head: ["Snack (one serving)", "Calories", "Fiber % DV", "Added sugars % DV", "Sodium % DV"],
  rows: [
    ["C: apple slices and peanut butter", "190", "11%", "0%", "5%"],
    ["D: salty cheese crackers", "150", "4%", "2%", "12%"],
    ["E: fruit candy chews", "140", "0%", "48%", "1%"],
  ],
};

export default {
  id: "g5-health-pe-nutrition-labels-and-choices",
  kind: "lesson",
  title: "Nutrition Labels and Choices",
  subtitle: "Read a Nutrition Facts label, compare two snacks and make a choice you can explain",
  grade: "5",
  band: "3-5",
  subject: "health-pe",
  duration: 45,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the National Health Education Standards on health information (NHES 3), health concepts (NHES 1) and decision-making (NHES 5); not mapped to a district unit sequence. The snacks and their labels are invented for this lesson.",
  },
  standards: ["NHES.1", "NHES.3", "NHES.5"],
  wida: {
    eld: ["ELD-SI"],
    klus: ["Inform", "Explain"],
    domains: ["Reading", "Speaking", "Writing"],
    cluster: "4-5",
  },
  contentObjective:
    "I can read a Nutrition Facts label to find the serving size, the calories and the % Daily Value, and compare two snacks to make a choice I can explain.",
  languageObjective:
    "I can compare two labels by saying 'Snack A has more ___ than Snack B per serving' and explain my choice with 'I would choose ___ because ___'.",
  languageDemands: {
    functions: ["describe information on a label", "compare two products", "justify a choice"],
    structures: [
      "One serving has ___ calories.",
      "Snack A has more ___ than Snack B per serving.",
      "I would choose ___ because ___, but I would also check ___.",
    ],
    discourse:
      "A two-turn partner comparison (claim, then evidence from the label), then a short written justification that names the numbers used.",
    barriers: [
      "'serving' (the amount on the label) and 'portion' (the amount you eat) sound like the same thing",
      "'per serving' and 'per container' use 'per' to mean 'for each'",
      "'added' sugars and 'total' sugars are close in meaning but are different lines",
      "'low' and 'high' name a % Daily Value, not how good a food is",
      "abbreviations and units (g, mg, %, DV) and the symbol * are not read the way they are spelled",
    ],
    oralRehearse: [
      "One serving of Snack B has 140 calories, and there are 4 servings in the package.",
      "Snack A has more fiber than Snack B per serving because 4 grams is more than 1 gram.",
    ],
    writeScaffold:
      "I would choose Snack ___ because per serving it has ___ and ___. I would also check ___.",
  },
  vocab: {
    collection: "g5-health-pe-nutrition-labels-and-choices",
    ids: [
      "nutrition-label",
      "serving-size",
      "servings-per-container",
      "calorie",
      "percent-daily-value",
      "nutrient",
      "sodium",
      "saturated-fat",
      "dietary-fiber",
      "added-sugars",
      "ingredient",
      "portion",
    ],
  },
  launch: {
    title: "Notice and Wonder: one label, many numbers",
    visual: labelVisual(SNACK_A),
    prompts: [
      "What do you notice about this label?",
      "What numbers or words do you recognize? What are you not sure about?",
      "What do you wonder about this snack?",
    ],
    teacherNote:
      "Project the label with no name on the front of the package. Take two noticings (for example 'there are percents on the right') and one wondering. Record the words students use. Do not explain yet; ask 'what is this number about?' for the big number beside Calories so students say 'one serving' in their own words. Keep the framing neutral: you are reading facts, not sorting foods into good and bad.",
  },
  teach: {
    model: [
      "A Nutrition Facts label gives facts about the food in a package. Start at the top. 'Servings per container' tells how many servings are in the whole package. 'Serving size' tells how much food one serving is. Every number below is for one serving, not for the whole package.",
      "Calories measure the energy in one serving. Everyone needs energy, so calories are not good or bad. They help you compare foods. If you eat two servings, you get twice the calories: 2 times 150 is 300. To find a whole package, multiply the calories in one serving by the servings per container.",
      "The right-hand column is the % Daily Value. It shows how much of a day's need for a nutrient one serving gives. The label uses a 2,000 calorie day for general advice. A good rule: 5% or less is low, and 20% or more is high.",
      "A high % Daily Value means different things for different nutrients. Health guidelines say to get less saturated fat, sodium and added sugars, so low numbers there are the goal. They say to get more dietary fiber, so a higher number there is helpful. 'Added sugars' are sugars the maker put in; 'total sugars' also include sugar already in foods like fruit and milk.",
      "To make a choice, use a decision process. 1. Name the choice you are making. 2. List your options. 3. Check the facts for each option, using the same serving size. 4. Decide and say why. 5. Look back: did the choice fit what you needed? A label gives facts. You also think about cost, taste, allergies and what is available to you, and these can change what you choose.",
    ],
    moves: [
      "Project the label and trace one number at a time with your finger, always saying 'one serving'.",
      "Model a two-step thought aloud: 'The calories are for one serving. The package has 4 servings, so I multiply.' Write the multiplication next to the label.",
      "Use the callout picture to name each part, then take the callouts away and ask students to point and name each part from memory.",
      "Ask 'low or high?' for each percent on the label and require the number in the answer: 'It is 34%, which is high.'",
      "Name the neutral framing early: 'We are reading facts to make choices. No food is bad. How much and how often matter.'",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "numeric",
      prompt:
        "A package of Berry Pop Bites has 4 servings, and each serving has 140 calories. How many calories are in the whole package?",
      answer: 560,
      calc: "4*140",
      hint: "The calories are for one serving. How many servings are in the package?",
      supports: {
        ee: {
          frames: ["There are ___ servings. Each has ___ calories."],
          wordBank: ["servings", "calories", "times"],
          visual: miniCard(
            "Nutrition Facts",
            [
              ["4 servings per container", "", true],
              ["Calories", "140", false],
            ],
            0,
            "A piece of a label that shows 4 servings per container and Calories 140.",
          ),
          oral: "Point to servings per container, then to calories. Say both numbers.",
        },
        dev: {
          frames: ["I multiplied ___ by ___ because ___."],
          wordBank: ["multiply", "per serving"],
        },
        exp: {
          frames: ["The whole package has ___ calories because each of the ___ servings has ___."],
        },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt:
        "Crunchy Oat Rounds list Added Sugars 5g with a % Daily Value of 10%. Which description fits 10%?",
      choices: ["Low (5% or less)", "In between", "High (20% or more)"],
      answer: 1,
      hint: "Compare 10% with the two cutoffs: 5% and 20%.",
      supports: {
        ee: {
          frames: ["10% is ___ than 5%.", "10% is ___ than 20%."],
          wordBank: ["more", "less", "low", "high"],
          oral: "Say the two cutoff numbers, then say where 10 fits.",
        },
        dev: {
          frames: ["10% is between ___ and ___, so it is ___."],
          wordBank: ["between", "low", "high"],
        },
        exp: {
          frames: ["Because 10% is more than ___ but less than ___, it is neither low nor high."],
        },
        br: {},
      },
    },
    {
      id: "g3",
      type: "numeric",
      prompt:
        "Jada eats 2 servings of Crunchy Oat Rounds. One serving has 4 grams of dietary fiber. How many grams of fiber does she get?",
      answer: 8,
      calc: "2*4",
      hint: "Each serving has the same amount of fiber. How many servings does she eat?",
      supports: {
        ee: {
          frames: ["One serving has ___ grams. Two servings have ___ grams."],
          wordBank: ["fiber", "grams", "two servings"],
          visual: miniCard(
            "Nutrition Facts",
            [["Dietary Fiber 4g", "14%", true]],
            0,
            "A piece of a label that shows Dietary Fiber 4g, 14 percent.",
          ),
        },
        dev: {
          frames: ["I multiplied ___ by 2 because she ate ___ servings."],
          wordBank: ["double", "serving"],
        },
        exp: { frames: ["She gets ___ grams of fiber because ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt: "Which line on the label tells you how much sugar the maker put in?",
      choices: ["Total Sugars", "Includes Added Sugars", "Dietary Fiber", "Protein"],
      answer: 1,
      hint: "Look for the word that means put in by the maker.",
      supports: {
        ee: {
          frames: ["The line is ___."],
          wordBank: ["added", "total", "sugars"],
          visual: miniCard(
            "Nutrition Facts",
            [
              ["Total Sugars 6g", "", false],
              ["Includes 5g Added Sugars", "10%", false],
            ],
            -1,
            "A piece of a label with a Total Sugars line and an Includes Added Sugars line.",
          ),
        },
        dev: { frames: ["Added sugars are sugars that ___."], wordBank: ["maker", "put in"] },
        exp: { frames: ["The added sugars line is different from total sugars because ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Snack detectives: choose for a goal",
    task: "Give each pair the three snacks in the table. Each pair gets a different goal card: 'a snack with more fiber', 'a snack low in sodium', or 'a snack low in added sugars'. Partners find the line on the table that matches their goal, rank the three snacks for that line, and then check one other line before they decide. They state their choice with evidence and say one thing they would still want to know before they decide, for example the price, whether they like it or if anyone is allergic to an ingredient.",
    visual: snackTable,
    roles: ["Label reader", "Recorder"],
    discussionCards: [
      {
        prompt: "Which line did you use first, and which snack had the best number for your goal?",
        frame: "For our goal we checked ___. Snack ___ has ___, which is ___.",
      },
      {
        prompt: "Which other line did you check? Did it change your mind?",
        frame: "We also checked ___. It shows ___, so ___.",
      },
      {
        prompt: "What is something the label cannot tell you about a snack?",
        frame: "The label does not tell ___, so I would also ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the parts of a label",
      visualOrModel: calloutLabel(),
      teacherNote:
        "Use the callouts to name the six parts, then cover the callouts and ask students to point to each part and say what it tells. Place the Berry Pop Bites label next to this one and ask which numbers are different.",
    },
    discuss: {
      title: "Say it: compare and explain",
      structure:
        "Turn and talk. Partner 1 reads one line from each label out loud and says which snack has more. Partner 2 asks 'Per serving or per container?' and restates the comparison. Swap and use a different line.",
      frames: [
        "Snack ___ has more ___ than Snack ___.",
        "Per serving or per container?",
        "Per serving, because the label's numbers are for one ___.",
        "So you are saying that ___.",
      ],
    },
    apply: {
      title: "Use it: a snack for a game day",
      visual: snackTable,
      task: "Your class is choosing a snack for a game day. Use the table of snacks C, D and E and a goal of your own (for example more fiber and less added sugar). Pick a snack and write two sentences: say what you chose and why, using numbers from the table. Name one thing the label cannot tell you.",
      successCriteria: [
        "I use per serving when I compare.",
        "I name at least two numbers from the table to support my choice.",
        "I use because to connect the numbers to my choice.",
        "I name one thing the label cannot tell me.",
      ],
    },
  },
  activities: [
    { engine: "concept-builder", id: "g5-health-label-diagram" },
    { engine: "language-detective", id: "g5-health-compare-labels" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt:
          "A cereal has 8 servings per container and 120 calories in each serving. How many calories are in the whole container?",
        answer: 960,
        calc: "8*120",
        explain:
          "The calories are for one serving. Multiply by the 8 servings: 8 times 120 is 960.",
      },
      {
        id: "i2",
        type: "numeric",
        prompt:
          "One serving of Crunchy Oat Rounds has 190 milligrams of sodium. How many milligrams of sodium are in 3 servings?",
        answer: 570,
        calc: "3*190",
        explain: "Three servings have 3 times the sodium of one serving: 3 times 190 is 570.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "Which % Daily Value for added sugars counts as HIGH?",
        choices: ["3%", "8%", "20%", "4%"],
        answer: 2,
        explain: "20% or more is high. The other numbers are all lower than 20%.",
      },
      {
        id: "i4",
        type: "numeric",
        prompt:
          "One serving of Berry Pop Bites has 34% of the Daily Value for added sugars. What percent of the Daily Value for added sugars is in 2 servings?",
        answer: 68,
        calc: "2*34",
        explain: "Two servings give twice the percent: 2 times 34 is 68%.",
      },
      {
        id: "i5",
        type: "choice",
        prompt:
          "Marcus wants a snack with more fiber. Snack C has 3 grams of fiber and Snack D has 1 gram. What should he do?",
        choices: [
          "Pick Snack C, then check the added sugars and sodium too",
          "Pick Snack D because it has less fiber",
          "Pick Snack C because it has more calories",
          "Pick neither, because fiber does not matter",
        ],
        answer: 0,
        explain:
          "Snack C has more fiber, which is his goal, and checking other lines is part of a good decision.",
      },
      {
        id: "i6",
        type: "choice",
        prompt: "What is the best first step when you compare two snack labels?",
        choices: [
          "Pick the one with the nicest package",
          "Check that you are comparing the same serving size or adjust the numbers",
          "Pick the one that costs less",
          "Pick the one a friend likes",
        ],
        answer: 1,
        explain:
          "Labels are written per serving, so you compare fairly only when the serving sizes match or are adjusted.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "Snack C: 190 calories, fiber 11% DV, added sugars 0% DV, sodium 5% DV. Snack D: 150 calories, fiber 4% DV, added sugars 2% DV, sodium 12% DV. Snack E: 140 calories, fiber 0% DV, added sugars 48% DV, sodium 1% DV. Choose one snack to eat after school. Write two sentences that say what you chose and why. Use per serving and because.",
        answer:
          "I would choose Snack C because per serving it has the most fiber (11%) and no added sugars (0%). I would also check that nobody is allergic to peanut butter.",
        explain:
          "Any choice is correct if it uses numbers from the table and a because sentence that connects them. A choice of Snack E should explain why 48% added sugars fits the goal.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt:
          "A box of Crunchy Oat Rounds has 6 servings, and each serving has 150 calories. How many calories are in the whole box?",
        answer: 900,
        calc: "6*150",
        explain:
          "Multiply the calories in one serving by the servings in the box: 6 times 150 is 900.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "A label says 20% Daily Value for sodium. What does that tell you?",
        choices: [
          "One serving gives a high share of the sodium a person should have in a day",
          "The food is 20% sodium",
          "You should eat 20 servings",
          "The food has 20 grams of sodium",
        ],
        answer: 0,
        explain:
          "The % Daily Value compares one serving with a whole day, and 20% or more is high.",
      },
      {
        id: "f3",
        type: "short",
        prompt:
          "Explain why you must look at the serving size before you compare calories on two labels.",
        answer:
          "Calories are for one serving, so if the servings are different sizes the numbers are not a fair comparison.",
        explain: "Labels give numbers for one serving, and serving sizes can be different.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you can do with a Nutrition Facts label.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt:
          "A label says 2 servings per container and 90 calories per serving. How many calories are in the whole container?",
        answer: 180,
        calc: "2*90",
        explain: "Multiply the calories in one serving by 2 servings: 2 times 90 is 180.",
      },
      {
        id: "e2",
        type: "choice",
        prompt: "A % Daily Value of 5% or less is called",
        choices: ["low", "high", "medium", "unsafe"],
        answer: 0,
        explain: "5% or less is low and 20% or more is high.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "Name one nutrient health guidelines say to get less of and one they say to get more of.",
        answer: "Less: added sugars, sodium or saturated fat. More: dietary fiber.",
        explain:
          "Added sugars, sodium and saturated fat are the ones to limit. Dietary fiber (and vitamin D, calcium, iron and potassium) are the ones to get more of.",
      },
    ],
    successCriteria: [
      "I used the servings per container to find a whole package.",
      "I used the cutoffs 5% and 20% to say low or high.",
      "I named nutrients to get less of and more of.",
    ],
  },
  answerKey: {
    notes:
      "Accept answers with units or without. For i7, look for a choice backed by at least two numbers from the table and a because sentence; any snack is acceptable with sound reasoning. For f3 and e3, look for the idea (numbers are per serving; added sugars, sodium and saturated fat to limit; fiber to get more), not one fixed sentence. Do not push students toward calorie counting or toward labeling foods good or bad.",
    items: {
      g1: "560 calories. The calories are for one serving, and 4 servings times 140 is 560.",
      g2: "In between. 10% is more than 5% and less than 20%.",
      g3: "8 grams. 2 servings times 4 grams is 8 grams.",
      g4: "Includes Added Sugars.",
      i1: "960 calories. 8 times 120 is 960.",
      i2: "570 mg. 3 times 190 is 570.",
      i3: "20%.",
      i4: "68%. 2 times 34 is 68.",
      i5: "Pick Snack C, then check the added sugars and sodium too.",
      i6: "Check that you are comparing the same serving size or adjust the numbers.",
      i7: "Sample: I would choose Snack C because per serving it has the most fiber (11%) and no added sugars (0%). I would also check that nobody is allergic to peanut butter.",
      f1: "900 calories. 6 times 150 is 900.",
      f2: "One serving gives a high share of the sodium a person should have in a day.",
      f3: "Calories are for one serving, so labels with different serving sizes need adjusting before comparing.",
      e1: "180 calories. 2 times 90 is 180.",
      e2: "low.",
      e3: "Less: added sugars, sodium or saturated fat. More: dietary fiber.",
    },
  },
  extension: {
    title: "Two ways to find the whole package",
    task: "Berry Pop Bites have 4 servings with 140 calories in each. Find the calories in the whole package in two ways: by adding 140 four times and by multiplying 4 times 140. Then find the grams of added sugars in the whole package (17 grams per serving) and say what the % Daily Value would be if one person ate the whole package in a day (4 servings times 34% is 136%). Write one sentence about what that number tells you.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo leer una etiqueta de información nutricional y comparar dos alimentos usando la porción.",
      vocab: [
        { en: "serving size", es: "tamaño de la porción", verified: false },
        { en: "calories", es: "calorías", verified: false },
        { en: "% Daily Value", es: "% del valor diario", verified: false },
        { en: "dietary fiber", es: "fibra dietética", verified: false },
        { en: "added sugars", es: "azúcares añadidos", verified: false },
        { en: "sodium", es: "sodio", verified: false },
      ],
      familyPrompt:
        "Busquen la etiqueta de un alimento en casa. Digan el tamaño de la porción y las calorías por porción. Comparen con otro alimento y digan cuál tiene más fibra por porción.",
    },
  },
  printables: ["vocab-mat", "compare-contrast", "task-cards", "exit-ticket"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach and guided practice 15. Snack detectives or the two activities 18. Exit ticket 5. Closing language share 2. If time is short, do the label diagram activity as a class and move the label detective to the next day.",
    misconceptions: [
      "Whole package: students read the numbers as if they were for the whole container. Ask 'for how much?' every time and have students circle the serving size first.",
      "Calories as a score: students treat the lowest calories as the best choice. Compare fiber, added sugars and sodium too, and say that growing bodies need energy.",
      "Percent of the food: students read 34% as 'the food is 34% sugar'. Say 'a % Daily Value compares one serving with a whole day.'",
      "High is bad: students think any high % is bad. High is helpful for fiber and a reason to pause for added sugars, sodium and saturated fat.",
      "Added versus total sugars: students use total sugars. Show a plain apple label (total sugars, 0 added) to separate the two.",
    ],
    differentiation:
      "Entering and Emerging learners use the callout picture, the word bank and the frames and point to the lines while speaking. Developing learners write the whole-package multiplication with units. Expanding and Bridging learners justify with two lines and name what the label cannot tell. The tasks and the answers do not change by tier.",
    languageNotes:
      "Teach 'per' with 'for each' on a chart ('per serving = for each serving'). Pair 'serving' with a spoon and bowl gesture and 'portion' with 'what I put on my plate'. Read units aloud as words: 'g' is grams, 'mg' is milligrams. Explain the star: it points to a note at the bottom.",
    sensitivity:
      "Treat food and bodies with care. Do not ask students to track what they eat, count calories for themselves, or comment on anyone's body or lunch. Some families have limited choices at home, so keep the language about 'when you have a choice'. Check allergy plans before any food tasting, and use invented labels rather than real brand packages. This lesson teaches reading labels, not dieting.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
