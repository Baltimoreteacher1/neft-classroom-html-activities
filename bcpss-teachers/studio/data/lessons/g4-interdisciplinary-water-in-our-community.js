// Lesson pack: Water in Our Community (grade 4 interdisciplinary: science, math, reading and writing, and community).
// Original text and pictures. Rates are sample values for practice; every numeric answer carries a calc the validator recomputes.
import {
  COMMUNITY,
  CYCLE,
  GALLON,
  SAVE_BARS,
  TREATMENT_FLOW,
  UNITS_TABLE,
  USE_BARS,
  WASTE_FLOW,
} from "../kits/c8-water.js";

export default {
  id: "g4-interdisciplinary-water-in-our-community",
  kind: "lesson",
  title: "Water in Our Community",
  subtitle:
    "Follow water from its source to a tap and back, measure it in gallons and quarts, and explain how we can save it",
  grade: "4",
  band: "3-5",
  subject: "interdisciplinary",
  duration: 55,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to Common Core grade 4 reading (RI.4.7), writing (W.4.2) and measurement (4.MD.A.2) and to the community's water path in science and social studies; not mapped to a district unit sequence. The passage, pictures and sample numbers are original.",
  },
  standards: ["RI.4.7", "W.4.2", "4.MD.A.2", "SL.4.1"],
  wida: {
    eld: ["ELD-SI", "ELD-SC"],
    klus: ["Inform", "Explain"],
    domains: ["Reading", "Speaking", "Writing"],
    cluster: "4-5",
  },
  contentObjective:
    "I can trace how water gets from a source to a tap and back, solve problems with gallons and quarts, and write an explanation of one way my community can save water.",
  languageObjective:
    "I can explain the path of water using first, next, then and finally, and give a reason for saving water using because.",
  languageDemands: {
    functions: [
      "sequence a process",
      "explain a cause and an effect",
      "compare amounts using data",
    ],
    structures: [
      "First, water ___. Next, ___. Then, ___. Finally, ___.",
      "___ uses more water than ___ because ___.",
      "If we ___, then we will save ___ gallons.",
    ],
    discourse:
      "A partner retell of a process in order, then a short written explanation that uses a fact from a text, a number from a table and a concluding sentence.",
    barriers: [
      "'tap', 'faucet' and 'spigot' name the same thing, and 'plant' here means a factory, not something that grows",
      "'source' names a starting place; 'treatment' also means medical care",
      "'conserve' looks like 'conversation' and 'conserve' is different from 'preserve'",
      "units gallon, quart, pint and cup: students must change a larger unit to a smaller one",
      "passive voice, such as 'is cleaned' and 'is stored', hides who does the action",
    ],
    oralRehearse: [
      "First, water comes from a reservoir. Next, it goes to a treatment plant. Finally, pipes carry it to our homes.",
      "A garden hose uses more water than a sink faucet because it lets out more gallons each minute.",
      "If we turn off the tap while we brush, then we will save 3 gallons.",
    ],
    writeScaffold:
      "Water travels from ___ to ___. One way our community can conserve water is ___ because ___. For example, ___ saves ___ gallons.",
  },
  vocab: {
    collection: "g4-interdisciplinary-water-in-our-community",
    ids: [
      "water-source",
      "reservoir",
      "treatment-plant",
      "filter",
      "wastewater",
      "conserve",
      "gallon",
      "quart",
      "evaporation",
      "condensation",
      "precipitation",
      "community",
    ],
  },
  launch: {
    title: "Notice and Wonder: a town and its water",
    visual: COMMUNITY,
    prompts: [
      "What do you notice about the picture? Who uses water?",
      "How do you think water gets to each place?",
      "What do you wonder about water in our town?",
    ],
    teacherNote:
      "Show the picture and take two noticings (for example 'every place has a drop above it') and one wondering. Ask 'Where does the water come from before the tap?' and record every idea without correcting it. This is the driving question for the lesson: How does water get to our community, and how can we use it wisely? Keep a chart called 'What we think' to revisit at the end. Check your local water utility's website for the real source of your community's water and add it to the chart later; do not assume.",
  },
  teach: {
    model: [
      "Every community needs water, and it comes from a water source. A source can be a river, a lake, a reservoir or a well under the ground. A reservoir is a large lake that stores water for a community. The water cycle keeps filling these sources: the sun's heat causes evaporation, water vapor cools and forms clouds in condensation, water falls as precipitation such as rain and snow, and it collects again in rivers and lakes.",
      "Water from a source is not ready to drink. At a water treatment plant, workers clean it in steps. Screens catch leaves and sticks. A safe material makes tiny bits of dirt clump together so they sink. Then the water is filtered through sand and gravel. Finally, a small amount of disinfectant kills germs. The clean water goes into a storage tank and then through pipes to homes, schools and hospitals.",
      "Water does not stop at the tap. Wastewater, the water that goes down drains and toilets, flows through sewer pipes to a wastewater plant, where it is cleaned again before it goes back to a river or other water body. Every drop travels a long way.",
      "We measure liquid in gallons, quarts, pints and cups in the United States. One gallon is 4 quarts, one quart is 2 pints, and one pint is 2 cups. To change a larger unit into a smaller unit, multiply: 3 gallons is 3 times 4, or 12 quarts. A tap that lets out 2 gallons each minute uses 2 times 5, or 10 gallons, in 5 minutes. The rates in this lesson are sample numbers for practice.",
      "To conserve water means to use less of it so there is enough for everyone. We can compare how much water different tools use each minute and choose smaller amounts. If a tap runs for 2 minutes while we brush, it uses 4 gallons. If we turn it off and use it for half a minute to rinse, it uses 1 gallon. We save 3 gallons each time.",
      "People in a community work together on water. Water workers clean and test it. Scientists check rivers and lakes. City leaders make rules, such as limits on watering lawns during a dry time. Families and schools make choices about how much they use. When we read about water, we use text and pictures together, and when we write about it, we state a fact, add numbers and finish with what we learned.",
    ],
    moves: [
      "Use the treatment flow chart and the water cycle as anchors. Trace each path with your finger while students say the sequence with first, next, then and finally.",
      "Teach 'multiply to change a larger unit to a smaller one' with a real gallon jug and four quart containers if you can, or with the tape picture. Say the unit every time: 3 gallons is 12 quarts.",
      "Have students read the data bar chart aloud as 'the garden hose uses 10 gallons each minute, which is more than the sink faucet, which uses 2 gallons each minute'.",
      "When students use 'conserve', ask 'what could we do?' and 'how many gallons would that save?' so conserve is always tied to a number.",
      "Keep the language of water use neutral and non-blaming. Families have different water situations, so talk about choices a school or community can make.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "numeric",
      prompt:
        "A school sink faucet lets out 2 gallons of water each minute. How many gallons does it use in 5 minutes?",
      answer: 10,
      calc: "2*5",
      hint: "The tap lets out the same amount each minute. How many minutes does it run?",
      supports: {
        ee: {
          frames: ["Each minute the tap uses ___ gallons.", "In ___ minutes it uses ___ gallons."],
          wordBank: ["gallons", "minutes", "each minute", "times"],
          visual: USE_BARS,
          oral: "Count by twos for each minute.",
        },
        dev: {
          frames: ["I multiplied ___ gallons each minute by ___ minutes."],
          wordBank: ["multiply", "rate"],
        },
        exp: {
          frames: [
            "The tap uses ___ gallons because ___ gallons each minute for ___ minutes is ___.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g2",
      type: "numeric",
      prompt: "A class collects 3 gallons of water in a bucket. How many quarts of water is that?",
      answer: 12,
      calc: "3*4",
      hint: "One gallon is 4 quarts. Quarts are smaller, so there will be more quarts than gallons.",
      supports: {
        ee: {
          frames: ["1 gallon is ___ quarts.", "3 gallons is ___ quarts."],
          wordBank: ["gallon", "quart", "times", "more"],
          visual: GALLON,
          oral: "Say 1 gallon is 4 quarts, then count by fours.",
        },
        dev: {
          frames: ["I multiplied ___ gallons by ___ because ___."],
          wordBank: ["multiply", "larger unit", "smaller unit"],
          visual: UNITS_TABLE,
        },
        exp: {
          frames: [
            "Since a quart is smaller than a gallon, I multiplied ___ by ___ to get ___ quarts.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt: "Which step happens right before the clean water is sent through pipes to homes?",
      choices: [
        "Screening out leaves and sticks",
        "Clumping and settling",
        "Filtering through sand and gravel",
        "Adding a disinfectant",
      ],
      answer: 3,
      hint: "Put the steps in order. Which one is last before the pipes?",
      supports: {
        ee: {
          frames: ["The last step is ___."],
          wordBank: ["screen", "filter", "disinfect", "pipes"],
          visual: TREATMENT_FLOW,
          oral: "Point to each step and say first, next, then and finally.",
        },
        dev: {
          frames: ["The steps are ___, ___, ___ and ___."],
          wordBank: ["first", "next", "then", "finally"],
        },
        exp: { frames: ["The water is ___ before it is ___ because ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "short",
      prompt:
        "Explain where used water goes after it goes down a drain. Use the words first and then.",
      answer:
        "First the used water flows into sewer pipes. Then it goes to a wastewater plant that cleans it before it goes back to a river.",
      hint: "Follow the used water step by step, starting from the drain.",
      supports: {
        ee: {
          frames: ["First the water goes to ___.", "Then it goes to ___."],
          wordBank: ["sewer pipes", "wastewater plant", "river", "cleans"],
          visual: WASTE_FLOW,
          oral: "Point to each step and say it out loud.",
        },
        dev: { frames: ["First ___. Then ___. Finally ___."], wordBank: ["wastewater", "clean"] },
        exp: { frames: ["After water is used, it ___ and then ___, which means ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "School water audit",
    task: "Teams of three choose one water tool at school or at home (a sink faucet, a shower or a garden hose) and use the sample rates in the chart. Each team estimates how many minutes the tool runs in one day, finds the gallons used (rate times minutes), changes the gallons to quarts, and makes a small bar chart. Then the team proposes one change that lowers the minutes, finds the gallons saved in one day, and writes a recommendation with because. Roles: Measurer, Calculator and Reporter. Teams share what they found and compare which tool uses the most water each minute and why.",
    visual: USE_BARS,
    roles: ["Measurer", "Calculator", "Reporter"],
    discussionCards: [
      {
        prompt: "Which tool uses the most water each minute? How do you know from the chart?",
        frame: "The ___ uses the most water because it lets out ___ gallons each minute.",
      },
      {
        prompt: "What change did your team choose? How many gallons would it save in one day?",
        frame: "If we ___, then we will save ___ gallons because ___.",
      },
      {
        prompt: "Who in the community could help make this change happen?",
        frame: "___ could help because ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the water cycle and the water path",
      visualOrModel: CYCLE,
      teacherNote:
        "Start with the water cycle. Then add the treatment flow chart and the used-water path next to it so students see a bigger loop: sources fill, plants clean, pipes carry, drains collect, and clean water returns to rivers. Ask where a drop could be in each picture.",
    },
    discuss: {
      title: "Say it: tell the path in order",
      structure:
        "Partner 1 points to the pictures and tells the path of a drop of water using first, next, then and finally. Partner 2 listens and asks one question, such as 'What happens at the plant?' Swap and add one fact about how to conserve water.",
      frames: [
        "First, water ___. Next, ___.",
        "Then, ___. Finally, ___.",
        "What happens at ___?",
        "One way to conserve water is ___ because ___.",
      ],
    },
    apply: {
      title: "Write it: how can our school save water?",
      task: "Write a short explanation (four to six sentences) called 'How Our School Can Save Water.' State your topic in one sentence. Give two facts about where water comes from and where it goes. Use one number from the data chart and say what it shows. Finish with a concluding sentence that uses the word conserve and because.",
      visual: SAVE_BARS,
      successCriteria: [
        "My topic sentence tells what my explanation is about.",
        "I use at least two facts from the lesson in the order they happen.",
        "I use one number from a chart and say what it shows.",
        "My last sentence uses conserve and because.",
      ],
    },
  },
  activities: [
    { engine: "concept-builder", id: "g4-water-faucet-model" },
    { engine: "language-detective", id: "g4-water-journey-passage" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt:
          "A shower lets out 3 gallons of water each minute. How many gallons does it use in 8 minutes?",
        answer: 24,
        calc: "3*8",
        explain: "Multiply the gallons each minute by the minutes: 3 times 8 is 24 gallons.",
      },
      {
        id: "i2",
        type: "numeric",
        prompt:
          "A garden hose lets out 10 gallons of water each minute. How many gallons does it use in 6 minutes?",
        answer: 60,
        calc: "10*6",
        explain: "10 gallons each minute for 6 minutes is 10 times 6, or 60 gallons.",
      },
      {
        id: "i3",
        type: "numeric",
        prompt: "A water cooler jug holds 5 gallons. How many quarts does it hold?",
        answer: 20,
        calc: "5*4",
        explain: "One gallon is 4 quarts, so 5 gallons is 5 times 4, or 20 quarts.",
      },
      {
        id: "i4",
        type: "numeric",
        prompt: "A family waters its garden with 24 quarts of water. How many gallons is that?",
        answer: 6,
        calc: "24/4",
        explain: "Four quarts make a gallon, so 24 quarts is 24 divided by 4, or 6 gallons.",
      },
      {
        id: "i5",
        type: "numeric",
        prompt:
          "Brushing with the tap left running uses 4 gallons. Brushing with the tap turned off uses 1 gallon. How many gallons does one student save in 5 days by turning the tap off?",
        answer: 15,
        calc: "(4-1)*5",
        explain:
          "Each day the student saves 4 minus 1, or 3 gallons. In 5 days that is 3 times 5, or 15 gallons.",
      },
      {
        id: "i6",
        type: "choice",
        prompt: "Which list shows the path of water from its source to a home, in order?",
        choices: [
          "Reservoir, treatment plant, pipes, home",
          "Home, pipes, treatment plant, reservoir",
          "Treatment plant, reservoir, home, pipes",
          "Pipes, reservoir, home, treatment plant",
        ],
        answer: 0,
        explain:
          "Water starts in a source such as a reservoir, is cleaned at a treatment plant, and travels through pipes to a home.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "Write three or four sentences that explain how your community can save water. Use one number from a chart and the words conserve and because.",
        answer:
          "Our community can conserve water in many ways. A garden hose uses 10 gallons each minute, so watering with a bucket instead would save a lot of water. Turning off the tap while we brush saves 3 gallons each time because the tap is not running. If many people conserve water, there is more for everyone.",
        explain:
          "A strong answer states a topic, uses a number from a chart, uses conserve and because, and ends with a conclusion.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt:
          "A sink uses 2 gallons of water each minute. A student runs it for 4 minutes. How many gallons does the student use?",
        answer: 8,
        calc: "2*4",
        explain: "2 gallons each minute for 4 minutes is 2 times 4, or 8 gallons.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which word means to use less of something so it lasts longer?",
        choices: ["Conserve", "Evaporation", "Reservoir", "Filter"],
        answer: 0,
        explain: "To conserve means to use less so there is enough for everyone.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Tell in your own words what happens in condensation.",
        answer:
          "Water vapor cools and turns into tiny drops of liquid water, which come together to form clouds.",
        explain: "Condensation is the cooling of water vapor into drops, as in a cloud.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you know about water in our community.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt: "A jug holds 2 gallons of water. How many quarts does it hold?",
        answer: 8,
        calc: "2*4",
        explain: "One gallon is 4 quarts, so 2 gallons is 2 times 4, or 8 quarts.",
      },
      {
        id: "e2",
        type: "choice",
        prompt: "What happens to used water before it goes back to a river?",
        choices: [
          "It is cleaned at a wastewater plant",
          "It goes back to the reservoir",
          "It is stored in a tank for homes",
          "Nothing happens to it",
        ],
        answer: 0,
        explain:
          "Used water goes through sewer pipes to a wastewater plant, which cleans it before it returns to a river.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "Write one sentence that tells one way to conserve water and why it helps. Use because.",
        answer:
          "We can conserve water by turning off the tap while we brush because the tap uses less water when it is not running.",
        explain: "Any realistic action with a reason that uses because is correct.",
      },
    ],
    successCriteria: [
      "I changed gallons to quarts by multiplying.",
      "I know water is cleaned again after it is used.",
      "I used conserve and because in a sentence.",
    ],
  },
  answerKey: {
    notes:
      "Accept answers with or without units. For the short answers, look for the facts and the structure (topic, facts in order, a number from a chart, a conclusion with conserve and because), not one fixed sentence. The rates in this lesson are sample values for practice; if students bring in real measurements, accept them with the units. Do not ask students to report their family's water use.",
    items: {
      g1: "10 gallons. 2 times 5 is 10.",
      g2: "12 quarts. 3 times 4 is 12.",
      g3: "Adding a disinfectant.",
      g4: "First the used water flows into sewer pipes. Then it goes to a wastewater plant that cleans it before it goes back to a river.",
      i1: "24 gallons. 3 times 8 is 24.",
      i2: "60 gallons. 10 times 6 is 60.",
      i3: "20 quarts. 5 times 4 is 20.",
      i4: "6 gallons. 24 divided by 4 is 6.",
      i5: "15 gallons. Each day saves 3 gallons, and 3 times 5 is 15.",
      i6: "Reservoir, treatment plant, pipes, home.",
      i7: "Sample: Our community can conserve water in many ways. A garden hose uses 10 gallons each minute, so watering with a bucket instead would save a lot of water. Turning off the tap while we brush saves 3 gallons each time because the tap is not running. If many people conserve water, there is more for everyone.",
      f1: "8 gallons.",
      f2: "Conserve.",
      f3: "Water vapor cools and turns into tiny drops of liquid water, which form clouds.",
      e1: "8 quarts.",
      e2: "It is cleaned at a wastewater plant.",
      e3: "Sample: We can conserve water by turning off the tap while we brush because the tap uses less water when it is not running.",
    },
  },
  extension: {
    title: "Rain barrel math",
    task: "A school garden has a rain barrel that holds 40 gallons. A small storm puts 5 gallons into the barrel. How many small storms fill the barrel (40 divided by 5 is 8)? How many quarts does a full barrel hold (40 times 4 is 160)? Each time the garden is watered it uses 8 gallons. How many waterings can a full barrel supply (40 divided by 8 is 5)? Write two sentences that explain how a rain barrel helps a community conserve water.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo explicar el camino del agua desde su fuente hasta mi casa, medir el agua en galones y cuartos de galón y decir cómo ahorrarla.",
      vocab: [
        { en: "water source", es: "fuente de agua", verified: false },
        { en: "reservoir", es: "embalse", verified: false },
        { en: "conserve", es: "conservar", verified: false },
        { en: "gallon", es: "galón", verified: false },
        { en: "quart", es: "cuarto de galón", verified: false },
        { en: "wastewater", es: "aguas residuales", verified: false },
        { en: "evaporation", es: "evaporación", verified: false },
        { en: "precipitation", es: "precipitación", verified: false },
      ],
      familyPrompt:
        "Hablen en casa de dónde viene el agua del grifo y adónde va después de usarla. Piensen en una forma de ahorrar agua y cuenten cuántos galones se ahorrarían.",
    },
  },
  printables: ["vocab-mat", "sequence", "cause-effect", "exit-ticket"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teaching and guided practice 15. School water audit or the two activities 20. Writing task 10. Exit ticket 5. This lesson can be spread over two days: reading and water path on day one, math and writing on day two.",
    misconceptions: [
      "Water disappears: students think used water is gone. Trace used water to a wastewater plant and a river, and trace evaporation to clouds.",
      "Tap water comes straight from a river: students skip the plant. Use the flow chart and have them tell each step in order.",
      "Divide for quarts: students divide gallons by 4 to get quarts. Quarts are smaller, so there are more of them; multiply.",
      "Evaporation equals boiling: students think water must boil to evaporate. Show a puddle drying on a warm day.",
      "Conserve means not using water: students think saving means going without. Say 'use only what we need'.",
    ],
    differentiation:
      "Entering and Emerging learners use the pictures, the word bank and the frames and tell the path with gestures. Developing learners retell the path in order with first, next, then and finally and write one multiplication sentence. Expanding and Bridging learners add a reason, compare two tools with data and write a full paragraph. The tasks and the answers do not change by tier.",
    languageNotes:
      "Teach 'plant' as 'a place where workers do a job' and show a picture. Practice 'gallon' and 'quart' with real containers. Use gestures for first, next, then and finally (counting on fingers). Put 'multiply' next to 'larger to smaller unit' on the word wall.",
    interdisciplinary:
      "Science: the water cycle and the treatment path. Math: liquid volume units and multi-step problems (4.MD.A.2). Reading and writing: reading a text and a chart together and writing an explanation. Social studies: how a community works together on a shared resource. Invite a water utility staff member or a school facilities worker to visit if possible.",
    sensitivity:
      "Do not assume every family has the same water source or the same water bills; some families use wells and some have had shut-offs. Keep the focus on choices a school or community can make, and never ask students to report their family's water use. Use the sample rates in the lesson, or real measurements taken at school with permission.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
