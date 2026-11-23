// Lesson pack: Plants Need Light (grade 1 science). Original investigation, pictures and questions.
// Observations described here are the typical results of a bean seedling grown in light and in the dark; students record their own.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

function potPlant(cx, base, { color, stemH, leaf }) {
  const top = base - stemH;
  return [
    { t: "rect", x: cx - 32, y: base, w: 64, h: 46, rx: 6, fill: "ochre", stroke: "ink", sw: 3 },
    { t: "rect", x: cx - 5, y: top, w: 10, h: stemH, fill: color, stroke: "ink", sw: 2 },
    {
      t: "path",
      d: `M${cx} ${top + 24} C${cx - 28} ${top + 4} ${cx - 60} ${top + 10} ${cx - 66} ${top + 28} C${cx - 40} ${top + 44} ${cx - 10} ${top + 40} ${cx} ${top + 24} Z`,
      fill: leaf,
      stroke: "ink",
      sw: 2,
    },
    {
      t: "path",
      d: `M${cx} ${top + 36} C${cx + 28} ${top + 16} ${cx + 60} ${top + 22} ${cx + 66} ${top + 40} C${cx + 40} ${top + 56} ${cx + 10} ${top + 52} ${cx} ${top + 36} Z`,
      fill: leaf,
      stroke: "ink",
      sw: 2,
    },
  ];
}
const twoPlants = {
  kind: "scene",
  bg: "plain",
  alt: "Two bean plants in matching pots. On the left, a tall green plant by a bright window with the sun outside. On the right, a pale yellow thin plant inside a dark closed box.",
  w: 480,
  h: 280,
  items: [
    { t: "rect", x: 20, y: 20, w: 200, h: 240, rx: 12, fill: "sky", stroke: "ink", sw: 3 },
    { icon: "sun", x: 140, y: 26, s: 64 },
    ...potPlant(110, 206, { color: "sage", stemH: 110, leaf: "sage" }),
    { t: "rect", x: 260, y: 20, w: 200, h: 240, rx: 12, fill: "ink", stroke: "ink", sw: 3 },
    ...potPlant(360, 206, { color: "copper-soft", stemH: 130, leaf: "copper-soft" }),
  ],
};
const setup = {
  kind: "scene",
  bg: "plain",
  alt: "Two identical pots with a bean seed in each. A bucket of water is between them. One pot is on a sunny windowsill and the other is inside a closed cupboard.",
  w: 480,
  h: 260,
  items: [
    { icon: "sun", x: 40, y: 10, s: 70 },
    { t: "rect", x: 20, y: 90, w: 190, h: 150, rx: 10, fill: "sky", stroke: "ink", sw: 3 },
    { t: "rect", x: 80, y: 190, w: 64, h: 46, rx: 6, fill: "ochre", stroke: "ink", sw: 3 },
    { icon: "seed", x: 94, y: 160, s: 36 },
    { icon: "bucket", x: 214, y: 150, s: 52 },
    { t: "rect", x: 270, y: 90, w: 190, h: 150, rx: 10, fill: "ink", stroke: "ink", sw: 3 },
    { t: "rect", x: 330, y: 190, w: 64, h: 46, rx: 6, fill: "ochre", stroke: "ink", sw: 3 },
    { icon: "seed", x: 344, y: 160, s: 36 },
  ],
};
const leafPic = {
  kind: "scene",
  bg: "sky",
  alt: "The sun shining down on a small green plant with two leaves.",
  w: 480,
  h: 260,
  items: [
    { icon: "sun", x: 320, y: 10, s: 120 },
    { icon: "sprout", x: 110, y: 100, s: 140 },
  ],
};
const dryPlant = {
  kind: "scene",
  bg: "plain",
  alt: "A plant with drooping leaves that hang down beside the stem, in a pot with dry, cracked soil. A bright sun shines beside it.",
  w: 480,
  h: 240,
  items: [
    { icon: "sun", x: 340, y: 24, s: 100 },
    { t: "rect", x: 158, y: 150, w: 64, h: 46, rx: 6, fill: "ochre", stroke: "ink", sw: 3 },
    { t: "line", x1: 168, y1: 158, x2: 180, y2: 170, sw: 2 },
    { t: "line", x1: 196, y1: 156, x2: 192, y2: 172, sw: 2 },
    { t: "line", x1: 204, y1: 160, x2: 214, y2: 172, sw: 2 },
    { t: "rect", x: 185, y: 54, w: 10, h: 96, fill: "sage-soft", stroke: "ink", sw: 2 },
    { t: "path", d: "M185 66 C160 62 128 84 124 146 C154 130 176 108 185 66 Z", fill: "sage-soft", stroke: "ink", sw: 2 },
    { t: "path", d: "M195 66 C220 62 252 84 256 146 C226 130 204 108 195 66 Z", fill: "sage-soft", stroke: "ink", sw: 2 },
  ],
};

export default {
  id: "g1-science-plants-need-light",
  kind: "lesson",
  title: "Plants Need Light",
  subtitle:
    "Find out what a bean plant looks like with light and without light, then use evidence to explain",
  grade: "1",
  band: "k-2",
  subject: "science",
  duration: 40,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to NGSS K-LS1-1 (what plants need) and 2-LS2-1 (investigating whether plants need sunlight and water). NGSS has no grade 1 performance expectation on what plants need, so this lesson supports the plant-and-animal survival work of grade 1 with the earlier and later expectations on either side of it. It is not mapped to a district unit sequence.",
  },
  standards: ["K-LS1-1", "2-LS2-1"],
  wida: {
    eld: ["ELD-SC"],
    klus: ["Explain", "Inform"],
    domains: ["Listening", "Speaking", "Writing"],
    cluster: "1",
  },
  contentObjective:
    "I can observe two plants and use what I see to explain that a plant needs light, as well as water, to grow and stay healthy.",
  languageObjective:
    "I can explain what happened to a plant by saying 'The plant in the ___ is ___ because it got ___.'",
  languageDemands: {
    functions: [
      "describe what you observe",
      "explain cause and effect",
      "give evidence for a claim",
    ],
    structures: [
      "The plant in the ___ is ___.",
      "The plant is ___ because it got ___.",
      "I know because I saw ___.",
    ],
    discourse:
      "Partner talk with the two plants in view: one partner says what they observe, the other asks 'How do you know?' and the first points to the evidence.",
    barriers: [
      "'light' means both 'not heavy' and 'brightness'; 'light' also names a color (light green)",
      "'plant' is both a noun (a plant) and a verb (to plant a seed)",
      "'need' and 'want' are close in meaning; a need is something living things must have",
      "'fair' means just in everyday talk but 'fair test' means only one thing is different",
      "'shade' and 'shadow' sound alike and are often confused",
    ],
    oralRehearse: [
      "The plant by the window is green.",
      "The plant in the dark box is pale because it did not get light.",
      "I know because I saw the leaves turn yellow.",
    ],
    writeScaffold:
      "The plant in the ___ is ___ because ___. I know because I saw ___. Drawing with labels is acceptable at every tier.",
  },
  vocab: {
    collection: "g1-science-plants-need-light",
    ids: [
      "plant",
      "seed",
      "sprout",
      "root",
      "stem",
      "leaf",
      "sunlight",
      "shade",
      "water",
      "grow",
      "need",
      "observe",
    ],
  },
  launch: {
    title: "Notice and Wonder: two bean plants",
    visual: twoPlants,
    prompts: [
      "What do you notice about the two plants?",
      "What do you wonder about the two plants?",
      "What could be different about where each plant lived?",
    ],
    teacherNote:
      "Show only the picture first, then cover the window and box labels and ask students to describe each plant with color words (green, pale, yellow) and shape words (tall, thin, thick). Take two noticings and one wondering. Then reveal the question for the investigation: do plants need light? Do not tell students why the plants differ. Note that the picture is a drawing of typical results, and that the class will plant its own two beans and record what really happens.",
  },
  teach: {
    model: [
      "A plant is a living thing. Living things need certain things to live and grow. Our question is: does a plant need light? To find out, we can run a test with two bean plants.",
      "A test is fair when only one thing is different. We plant two bean seeds in the same kind of soil, in the same kind of pot, and give each the same amount of water. We change only one thing: one pot sits by a sunny window, and the other sits in a dark closed cupboard.",
      "Before we look, we predict. 'I think the plant in the cupboard will look like ___ because ___.' Then we observe every few days. We look closely and draw what we see. We tell the color of the leaves, how tall the plant is and whether the stem looks strong or weak.",
      "A seed has a little food stored inside, so it can sprout even in the dark. Plants in light make their own food in their leaves. After the food inside the seed is gone, a plant kept in the dark cannot make more. It turns pale and weak. The plant in the light stays green and strong.",
      "Evidence is what we saw. We use evidence to explain: 'The plant in the cupboard is pale because it did not get light. I know because I saw its leaves turn yellow.' We also learn that light alone is not enough. A plant with light and no water droops, so plants need both.",
    ],
    moves: [
      "Show the two empty pots and ask students what is the same and what is different before planting. Write 'same' and 'different' on a T chart.",
      "Plant the seeds together. Use the same amount of water for both, measured with a small cup, and say 'the same water' aloud each time.",
      "Observe on days 1, 3, 5, 7 and 10. Have students draw and label before they talk. Keep an observation wall with the drawings in order.",
      "Use the sentence 'I saw ___, so I think ___' to separate observation from explanation. Praise the 'I saw' part first.",
      "Bring a plant out of the cupboard on the last day and put it in the light. Ask what students predict will happen next, and keep watching it for a week.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt:
        "Two bean plants have the same soil and the same water. One sits by a sunny window. The other sits in a dark closet. After two weeks, what will the plant in the closet most likely look like?",
      choices: ["Pale and weak", "Dark green and strong", "Exactly like the window plant"],
      answer: 0,
      hint: "Think about what leaves catch to make food. Does the closet plant get any?",
      visual: twoPlants,
      supports: {
        ee: {
          frames: ["The plant in the closet is ___.", "It has no ___."],
          wordBank: ["pale", "weak", "light", "closet"],
          visual: twoPlants,
          oral: "Point to the plant in the dark box. What color is it?",
        },
        dev: {
          frames: ["I think the plant in the closet will be ___ because it gets no ___."],
          wordBank: ["pale", "weak", "light"],
          visual: twoPlants,
        },
        exp: {
          frames: ["I predict the closet plant will be ___ because without light it cannot ___."],
        },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt:
        "We want to test if plants need light. Which two things must stay the SAME in both pots?",
      choices: [
        "The amount of water and the kind of seed",
        "Where the pots sit",
        "The amount of light",
      ],
      answer: 0,
      hint: "In a fair test only one thing is different. Which thing are we changing on purpose?",
      visual: setup,
      supports: {
        ee: {
          frames: ["The ___ is the same.", "Only the ___ is different."],
          wordBank: ["same", "different", "water", "light"],
          visual: setup,
          oral: "Point to the pots. What is the same? What is different?",
        },
        dev: {
          frames: ["The ___ and the ___ stay the same.", "We change only the ___."],
          wordBank: ["fair test", "same", "different"],
          visual: setup,
        },
        exp: {
          frames: [
            "For a fair test, the ___ and ___ must stay the same because we change only ___.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt: "Which part of a plant catches light to help it make food?",
      choices: ["The roots", "The leaves", "The seed"],
      answer: 1,
      hint: "It is the flat green part that grows out to the side.",
      visual: leafPic,
      supports: {
        ee: {
          frames: ["The ___ catches light.", "It is flat and green."],
          wordBank: ["leaf", "leaves", "light", "food"],
          visual: leafPic,
          oral: "Point to the flat green parts of the plant.",
        },
        dev: {
          frames: ["The ___ catch light to help the plant make ___."],
          wordBank: ["leaves", "food", "light"],
          visual: leafPic,
        },
        exp: { frames: ["The leaves catch ___ and use it to help the plant make ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt:
        "A plant sits in bright light, but its soil has been dry for many days and its leaves droop. What does the plant need?",
      choices: ["Water", "More light", "A bigger pot"],
      answer: 0,
      hint: "The plant already has light. Look at the soil in the picture.",
      visual: dryPlant,
      supports: {
        ee: {
          frames: ["The soil is ___.", "The plant needs ___."],
          wordBank: ["dry", "droop", "water"],
          visual: dryPlant,
          oral: "Look at the leaves and the soil. What does the plant need?",
        },
        dev: {
          frames: ["The plant needs ___ because the soil is ___."],
          wordBank: ["water", "droop", "dry"],
          visual: dryPlant,
        },
        exp: { frames: ["Even though the plant has light, it needs ___ because ___."] },
        br: {},
      },
    },
    {
      id: "g5",
      type: "choice",
      prompt: "Which one is the best evidence that the plant in the dark needs light?",
      choices: [
        "It is pale and weak, but the plant by the window is green and strong.",
        "It lives in a closet.",
        "It has a pot.",
      ],
      answer: 0,
      hint: "Evidence is something you saw. Which choice compares what you saw in both plants?",
      supports: {
        ee: {
          frames: ["I saw ___.", "The window plant is ___."],
          wordBank: ["pale", "green", "evidence", "saw"],
          visual: twoPlants,
          oral: "Say what you see in each plant.",
        },
        dev: {
          frames: ["The evidence is that the dark plant is ___ and the window plant is ___."],
          wordBank: ["evidence", "compare"],
        },
        exp: { frames: ["My evidence is ___. This shows that the plant needs ___."] },
        br: {},
      },
    },
    {
      id: "g6",
      type: "short",
      prompt: "Finish the sentence: The plant in the dark is pale because ___.",
      answer: "it did not get light, so it could not make its own food",
      hint: "Say what the plant in the dark did not get. Then say what leaves do with it.",
      supports: {
        ee: {
          frames: ["The plant is pale because it did not get ___."],
          wordBank: ["light", "pale", "food"],
          visual: twoPlants,
          oral: "Say it out loud with a friend before you write.",
        },
        dev: {
          frames: ["The plant is pale because it did not get ___ to make ___."],
          wordBank: ["light", "make food"],
        },
        exp: { frames: ["The plant is pale because without ___ its leaves cannot make ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Plant detectives",
    task: "Partners are plant detectives for the class bean plants. On each observation day, Partner A observes the window plant and Partner B observes the cupboard plant. Each partner draws their plant with at least three labels (leaf, stem, soil) and colors it with the colors they really see. Partners then compare their drawings side by side. They fill in the sentence 'The plant in the ___ is ___ and the plant in the ___ is ___.' and agree on one question to ask the class. Swap plants on the next observation day so each partner sees both.",
    roles: ["Window observer", "Cupboard observer"],
    discussionCards: [
      {
        prompt: "What color are the leaves? How tall is the plant? Is the stem strong or weak?",
        frame: "The leaves are ___. The stem is ___.",
      },
      {
        prompt: "What is the same about the two pots? What is different?",
        frame: "The ___ is the same. The ___ is different.",
      },
      {
        prompt: "What do you think will happen next? What makes you think so?",
        frame: "I think ___ because I saw ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the same plants, different light",
      visualOrModel: twoPlants,
      teacherNote:
        "Hold up the class plants beside this drawing. Ask students to find three differences using color and size words, then say what is the same (pot, soil, water, kind of seed). Point out that the one thing that is different is light.",
    },
    discuss: {
      title: "Say it: claim, evidence, reason",
      structure:
        "Turn and talk. Partner 1 makes a claim ('Plants need light'). Partner 2 asks 'How do you know?' Partner 1 gives evidence ('I saw the plant in the dark turn pale') and a reason ('Leaves use light to make food'). Swap.",
      frames: [
        "I think plants need ___.",
        "How do you know?",
        "I saw ___.",
        "That shows that ___ because ___.",
      ],
    },
    apply: {
      title: "Use it: do plants need water?",
      task: "Plan a fair test to find out whether plants need water. Say what you will change (water), what you will keep the same (kind of seed, soil, pot, light), and what you predict. Draw your two pots with labels. Say what you would look for after a week and what it would mean.",
      successCriteria: [
        "I say what I change and what stays the same.",
        "I make a prediction with 'because'.",
        "I say what I would look at to know the answer.",
        "I use the words light, water or plant correctly.",
      ],
    },
  },
  activities: [
    { engine: "early-sort", id: "g1-science-plant-needs-sort" },
    { engine: "visual-match", id: "g1-science-plant-parts-match" },
    { engine: "concept-builder", id: "g1-science-plant-light-model" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt: "Which part of a plant takes in water from the soil?",
        choices: ["The roots", "The leaves", "The flower"],
        answer: 0,
        explain: "Roots grow under the ground and take in water. Leaves catch light.",
      },
      {
        id: "i2",
        type: "choice",
        prompt:
          "A bean plant is kept in a closet for two weeks. It gets enough water but no light. What will it look like?",
        choices: ["Pale and weak", "Dark green and strong", "The same as a plant in the sun"],
        answer: 0,
        explain:
          "Without light, the plant cannot make its own food, so its leaves turn pale and the plant is weak.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "Which is a fair way to test whether plants need light?",
        choices: [
          "Put one plant in the sun and one in the dark and give both the same water.",
          "Put one plant in the sun with lots of water and one in the dark with no water.",
          "Use a bean seed for one plant and a sunflower seed for the other.",
        ],
        answer: 0,
        explain:
          "Only the light is different. In the other choices, more than one thing is different.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "Which sentence is evidence about plants and light?",
        choices: [
          "The plant in the dark was pale and thin.",
          "I like green plants.",
          "Plants are fun to grow.",
        ],
        answer: 0,
        explain: "Evidence is something we observed. Only the first sentence tells what was seen.",
      },
      {
        id: "i5",
        type: "choice",
        prompt:
          "A plant sits in bright light. Its soil has been dry for many days and its leaves droop. What does the plant need?",
        choices: ["Water", "More light", "A bigger pot"],
        answer: 0,
        explain:
          "The plant already has light. The dry soil and drooping leaves show it needs water.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "Write or draw one thing a plant needs. Tell what happens to the plant if it does not get it.",
        answer:
          "Light or water. Without light the plant turns pale and weak. Without water the plant droops and dries out.",
        explain:
          "Accept drawings with labels and oral answers. Look for a need and a result that matches it.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "Which part of a plant catches light?",
        choices: ["The leaves", "The roots", "The seed"],
        answer: 0,
        explain: "Leaves are flat and green and catch light to help the plant make food.",
      },
      {
        id: "f2",
        type: "choice",
        prompt:
          "Two plants get the same water. One gets light and one does not. Which plant will be green and strong?",
        choices: [
          "The plant that gets light",
          "The plant that does not get light",
          "They will look the same",
        ],
        answer: 0,
        explain: "Plants make their food with light. The plant with light stays green and strong.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Tell what you observed about the two plants. Use the words pale and green.",
        answer: "The plant in the light is green. The plant in the dark is pale.",
        explain:
          "Accept oral answers, drawings with labels, or a written sentence that compares both plants.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you know about plants and light.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt: "What do plants need to grow? Choose the best answer.",
        choices: ["Light and water", "Toys and light", "Only soil"],
        answer: 0,
        explain: "Plants need light and water, as well as air and space.",
      },
      {
        id: "e2",
        type: "choice",
        prompt: "Why is a plant in the dark pale?",
        choices: [
          "It cannot make its own food without light.",
          "It has too many leaves.",
          "It has too much light.",
        ],
        answer: 0,
        explain: "Without light the plant cannot make its own food, so it turns pale and weak.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Say or draw one thing you saw that shows a plant needs light.",
        answer:
          "The plant in the dark was pale or weak, and the plant in the light was green and strong.",
        explain: "Accept oral answers and labeled drawings that compare the two plants.",
      },
    ],
    successCriteria: [
      "I tell what I observed.",
      "I say what a plant needs.",
      "I use 'because' to give a reason.",
    ],
  },
  answerKey: {
    notes:
      "Accept answers said aloud, drawn with labels or written. For the short items look for an observation (what was seen) joined to a reason (what the plant needs), not a specific sentence. If your class plants look different from the typical results described here, use what students really saw as the evidence.",
    items: {
      g1: "Pale and weak. Without light the plant cannot make its own food.",
      g2: "The amount of water and the kind of seed. Only the light changes in a fair test.",
      g3: "The leaves. They are flat and green and catch light.",
      g4: "Water. The plant already has light, and the dry soil and drooping leaves show it needs water.",
      g5: "It is pale and weak, but the plant by the window is green and strong. This compares what we saw in both plants.",
      g6: "It did not get light, so it could not make its own food.",
      i1: "The roots.",
      i2: "Pale and weak.",
      i3: "Put one plant in the sun and one in the dark and give both the same water.",
      i4: "The plant in the dark was pale and thin.",
      i5: "Water.",
      i6: "Light (without it the plant is pale and weak) or water (without it the plant droops).",
      f1: "The leaves.",
      f2: "The plant that gets light.",
      f3: "The plant in the light is green. The plant in the dark is pale.",
      e1: "Light and water.",
      e2: "It cannot make its own food without light.",
      e3: "The plant in the dark was pale or weak, and the plant in the light was green and strong.",
    },
  },
  extension: {
    title: "Which way does the plant lean?",
    task: "Put a small plant on a windowsill with the window on one side. Watch it for a week. Draw which way the stem and leaves lean each day. Then turn the pot around and watch for another few days. What do you notice? Tell a friend why you think the plant leans toward the window.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo observar dos plantas y usar lo que veo para explicar que una planta necesita luz y agua para crecer.",
      vocab: [
        { en: "plant", es: "planta", verified: true },
        { en: "seed", es: "semilla", verified: true },
        { en: "sprout", es: "brote", verified: true },
        { en: "root", es: "raíz", verified: true },
        { en: "stem", es: "tallo", verified: true },
        { en: "leaf", es: "hoja", verified: true },
        { en: "sunlight", es: "luz del sol", verified: true },
        { en: "shade", es: "sombra", verified: true },
        { en: "water", es: "agua", verified: true },
      ],
      familyPrompt:
        "Busquen una planta en casa o en el vecindario. Digan de qué color son las hojas y si la planta recibe luz y agua. Pregunten: ¿qué necesita esta planta para crecer?",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "This lesson has two parts. Day 1 (40 minutes): launch 5, teach 10, set up the two pots 10, guided practice 10, exit ticket 5. Days 3, 5, 7 and 10 (10 minutes each): observe, draw and talk. The activities fit on any day after Day 1, and the model works best after students have seen real results. If time is short, run the plant needs sort on Day 1 and the model on Day 5.",
    misconceptions: [
      "Plants eat soil: students think soil is the plant's food. Soil holds the plant and gives water; the plant makes its own food in its leaves using light.",
      "Only water matters: students think a plant in the dark is fine if it gets water. The investigation shows the dark plant becomes pale and weak.",
      "Light means heat: students think a warm place is the same as a bright place. A bright lamp can give a plant light too.",
      "A pale plant is dead: students think the plant in the dark died right away. It is alive but weak; put it in the light and watch it recover.",
      "The test is not fair: students change more than one thing (more water for one plant, a different pot). Return to the T chart of same and different.",
    ],
    differentiation:
      "Entering and Emerging learners observe and draw, point to the plants, use the frames and answer with a word or a labeled drawing. Developing learners say a full sentence with 'because'. Expanding and Bridging learners compare both plants and explain the cause and effect. The investigation and the questions are the same at every tier: only the language support changes. Grouping students in mixed-language pairs for observations works well.",
    languageNotes:
      "Teach 'light' with objects (a flashlight, a lamp, a window) and with color words (light green) so students separate the meanings. Use real plants for every word. Keep a word wall with a picture beside each word. Let students say observations in the home language first, then say the English sentence together.",
    safety:
      "Use bean seeds meant for planting and check for food allergies in the class before handling any seeds. Seed packets may be coated, so students do not taste seeds. Students wash their hands after touching soil. Keep the cupboard door closed during the test; open it only to observe, and keep the observation short so the dark plant stays in the dark.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
