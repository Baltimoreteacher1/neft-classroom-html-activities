// Original WIDA-aligned speaking practice: explaining the water cycle step by step. Not an official WIDA or ACCESS item.
const cycleNamed = {
  kind: "cycle",
  alt: "A circle of four stages with arrows between them: evaporation with a sun, condensation with a cloud, precipitation with rain, collection with a water drop.",
  longDesc:
    "Four labeled stages in a circle: Evaporation (sun), Condensation (cloud), Precipitation (rain), Collection (drop). Arrows lead clockwise and the last stage points back to the first.",
  stages: [
    { label: "Evaporation", icon: "sun" },
    { label: "Condensation", icon: "cloud" },
    { label: "Precipitation", icon: "rain" },
    { label: "Collection", icon: "drop" },
  ],
};

const puddleFlow = {
  kind: "flow",
  alt: "Three steps in a row: a sun warms a puddle, water vapor rises, the puddle gets smaller.",
  longDesc:
    "Step 1 sun over a puddle. Step 2 water vapor rising. Step 3 a smaller puddle. Arrows lead from step to step.",
  steps: [
    { label: "Sun warms the puddle", icon: "sun" },
    { label: "Water becomes vapor", icon: "cloud" },
    { label: "Puddle is smaller", icon: "drop" },
  ],
};

export default {
  id: "wida-g4-esol-explain-how-things-work-speaking",
  kind: "wida",
  engine: "wida-studio",
  domain: "Speaking",
  title: "Say it: explain how water moves",
  grade: "4",
  band: "3-5",
  cluster: "4-5",
  subject: "esol",
  klus: ["Explain", "Inform"],
  standards: ["ELD-SC", "SL.4.4", "W.4.2c"],
  minutes: 25,
  intro:
    "Plan what you will say, then explain a process out loud to a partner. Use order words and because.",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to WIDA ELD-SC and CCSS speaking standards; the water cycle is the context for language practice, not a mapped science unit.",
  },
  lessonId: "g4-esol-explain-how-things-work",
  vocab: {
    collection: "g4-esol-explain-how-things-work",
    ids: [
      "evaporation",
      "water-vapor",
      "condensation",
      "precipitation",
      "collection",
      "because",
      "so",
      "sequence",
    ],
  },
  tasks: [
    {
      id: "s1",
      type: "speak-describe",
      title: "Describe the picture",
      klu: "Inform",
      prompt: "Look at the water cycle picture. Tell what you see in each stage.",
      visual: cycleNamed,
      planning: {
        prompt: "Write one word for each of two stages you will talk about.",
        organizer: {
          rows: [
            { id: "p1", label: "Stage 1 I will describe", placeholder: "the sun" },
            { id: "p2", label: "Stage 2 I will describe", placeholder: "the cloud" },
          ],
        },
      },
      wordsToUse: ["evaporation", "condensation", "precipitation", "collection"],
      modelResponse: {
        ee: "I see the sun. I see a cloud. I see rain.",
        dev: "The picture shows four stages. The sun is in evaporation and rain is in precipitation.",
        exp: "The picture shows four stages of the water cycle: evaporation with the sun, condensation with a cloud, precipitation with rain, and collection with a drop of water.",
        br: "The diagram shows water moving in a continuous loop. It begins with evaporation, passes through condensation and precipitation, and returns to collection, where the cycle begins again.",
      },
      selfCheck: [
        { id: "c1", text: "I named at least two stages." },
        { id: "c2", text: "I said what is in the picture for each stage." },
      ],
      supports: {
        ee: { frames: ["I see ___.", "This is ___."], wordBank: ["sun", "cloud", "rain", "drop"] },
        dev: { frames: ["The picture shows ___. In ___, I see ___."] },
        exp: { frames: ["The diagram shows ___ stages. First ___, and then ___."] },
        br: {},
      },
    },
    {
      id: "s2",
      type: "speak-explain",
      title: "Explain the water cycle",
      klu: "Explain",
      prompt:
        "Explain how water moves from the ocean to the sky and back. Cover each step in order.",
      steps: [
        { id: "t1", text: "the sun warms the water" },
        { id: "t2", text: "water becomes vapor and rises" },
        { id: "t3", text: "vapor cools and makes clouds" },
        { id: "t4", text: "rain or snow falls" },
        { id: "t5", text: "water collects and the cycle starts again" },
      ],
      planning: {
        prompt:
          "Which order words will you use? Write them next to each step in your head or on paper.",
        organizer: {
          rows: [
            { id: "p1", label: "Beginning", placeholder: "First, ..." },
            { id: "p2", label: "Middle", placeholder: "Next, ... Then, ..." },
            { id: "p3", label: "End", placeholder: "Finally, ..." },
          ],
        },
      },
      wordsToUse: ["first", "next", "then", "finally", "because", "so"],
      modelResponse: {
        ee: "First, the sun warms water. Then the water goes up. Then rain falls.",
        dev: "First, the sun warms the water. Next, the water becomes vapor and rises. Then it makes clouds. Finally, rain falls.",
        exp: "First, the sun warms the water, so some of it becomes water vapor and rises. Next, the vapor cools and makes clouds. Then rain or snow falls, and finally the water collects and the cycle starts again.",
        br: "The cycle begins when the sun warms the ocean, so water evaporates and rises as vapor. Because the air high up is cold, the vapor condenses into clouds. Eventually the drops grow heavy and fall as precipitation, and the water collects in rivers and oceans, ready to begin again.",
      },
      selfCheck: [
        { id: "c1", text: "I told the steps in order." },
        { id: "c2", text: "I used first, next, then or finally." },
        { id: "c3", text: "I used because or so at least once." },
      ],
      supports: {
        ee: { frames: ["First, ___. Then, ___."], wordBank: ["sun", "water", "cloud", "rain"] },
        dev: { frames: ["First, ___. Next, ___. Then, ___. Finally, ___."] },
        exp: { frames: ["First, ___, so ___. Next, ___ because ___."] },
        br: {},
      },
    },
    {
      id: "s3",
      type: "speak-explain",
      title: "Explain a smaller puddle",
      klu: "Explain",
      prompt: "A puddle gets smaller on a sunny day. Explain why. Use because or so.",
      visual: puddleFlow,
      planning: {
        prompt: "Write the cause and the result you will say.",
        organizer: {
          rows: [
            { id: "p1", label: "Cause", placeholder: "the sun warms the puddle" },
            { id: "p2", label: "Result", placeholder: "the puddle gets smaller" },
          ],
        },
      },
      wordsToUse: ["because", "so", "water vapor", "evaporation"],
      modelResponse: {
        ee: "The sun is hot. The puddle is small.",
        dev: "The puddle gets smaller because the sun warms the water.",
        exp: "The sun warms the puddle, so some of the water changes into water vapor and rises. That is why the puddle gets smaller.",
        br: "Because the sun's heat causes evaporation, the liquid water in the puddle changes into water vapor and rises into the air, so less water is left in the puddle.",
      },
      selfCheck: [
        { id: "c1", text: "I said what causes the change." },
        { id: "c2", text: "I said the result of the cause." },
        { id: "c3", text: "I used because or so." },
      ],
      supports: {
        ee: { frames: ["The sun ___. The puddle ___."], wordBank: ["warms", "smaller", "water"] },
        dev: { frames: ["The puddle gets smaller because ___."] },
        exp: { frames: ["The sun ___, so ___."] },
        br: {},
      },
    },
    {
      id: "s4",
      type: "speak-compare",
      title: "Compare two puddles",
      klu: "Inform",
      prompt:
        "Two puddles are the same size at noon. Compare what happens to them after two hours.",
      items: [
        {
          id: "i1",
          label: "Puddle A, in the sun",
          visual: {
            kind: "table",
            alt: "Puddle A sits in a sunny spot. At noon it is full. After two hours it is almost gone.",
            longDesc:
              "Puddle A in the sun: at noon the puddle is full; after two hours the puddle is almost gone.",
            head: ["Puddle A (sun)", "What we see"],
            rows: [
              ["At noon", "Full"],
              ["After 2 hours", "Almost gone"],
            ],
          },
        },
        {
          id: "i2",
          label: "Puddle B, in the shade",
          visual: {
            kind: "table",
            alt: "Puddle B sits in a shady spot. At noon it is full. After two hours it is still half full.",
            longDesc:
              "Puddle B in the shade: at noon the puddle is full; after two hours the puddle is half full.",
            head: ["Puddle B (shade)", "What we see"],
            rows: [
              ["At noon", "Full"],
              ["After 2 hours", "Half full"],
            ],
          },
        },
      ],
      compareOn: ["sun or shade", "water left"],
      wordsToUse: ["both", "but", "because", "evaporation"],
      modelResponse: {
        ee: "Both puddles are full. Puddle A is small. Puddle B is bigger.",
        dev: "Both puddles start full, but Puddle A has less water because it is in the sun.",
        exp: "Both puddles start full at noon, but after two hours Puddle A is almost gone while Puddle B is half full, because the sun makes water evaporate faster.",
        br: "Although both puddles begin full, Puddle A, which sits in the sun, loses water far faster than Puddle B, because the sun's heat speeds up evaporation.",
      },
      selfCheck: [
        { id: "c1", text: "I told one way the puddles are alike." },
        { id: "c2", text: "I told one way they are different." },
        { id: "c3", text: "I gave a reason for the difference." },
      ],
      supports: {
        ee: {
          frames: ["Both puddles are ___.", "Puddle A is ___."],
          wordBank: ["full", "small", "sun", "shade"],
        },
        dev: { frames: ["Both ___, but ___ because ___."] },
        exp: { frames: ["Both puddles ___. However, ___ because ___."] },
        br: {},
      },
    },
  ],
  successCriteria: [
    "I can explain the steps of a process in order.",
    "I can use first, next, then and finally to show the order.",
    "I can use because or so to tell why a change happens.",
  ],
  supports: {
    ee: {
      directions: "Say one short sentence for each step. Use the picture and the word bank.",
      wordBank: ["first", "then", "because", "sun", "water", "cloud", "rain"],
    },
    dev: { directions: "Say two or three connected sentences. Use the frames if you need them." },
    exp: { directions: "Connect your steps with order words and one because or so sentence." },
    br: {},
  },
  teacherGuide: {
    purpose:
      "Students rehearse and deliver a spoken explanation of a process, using sequence connectors and cause-and-effect language, then check their talk against clear criteria.",
    languageFocus: [
      "sequence connectors: first, next, then, finally",
      "cause and result with because and so",
      "science vocabulary: evaporation, water vapor, condensation, precipitation",
      "compare with both, but, however",
    ],
    before: [
      "Model one short explanation of a different process, such as how ice melts, while pointing to a picture for each step.",
      "Have students rehearse with a partner before using the recorder.",
    ],
    during: [
      "Listen for order words and one reason. Use the feedback sheet to note what you hear.",
      "Offer the frames only when a student pauses; do not stop a student who is already connecting steps.",
    ],
    after: [
      "Ask students to replay or repeat their explanation and add one connecting word they did not use the first time.",
      "Record one language move to teach next, such as moving from 'and then' to 'so'.",
    ],
    commonChallenges: [
      {
        challenge: "Students list steps without connecting words.",
        move: "Model the same steps twice, once as a list and once with first, next, then. Ask which one is easier to follow.",
      },
      {
        challenge: "Students say because but state the result before the cause.",
        move: "Use a cause card and a result card. Have students place the cause first, then say the sentence with because.",
      },
    ],
    differentiation: {
      ee: "Picture and word bank visible, one short sentence per step, partner can echo before the student speaks.",
      dev: "Frames visible, two to three connected sentences, one order word per sentence.",
      exp: "Frames on request, one because or so sentence and one comparison word.",
      br: "No frames; ask students to vary connecting language and name the cause behind each change.",
    },
    independentPractice:
      "In independent practice students plan quietly and speak without supports shown. Use the feedback sheet to note which language moves you heard; the sheet is an observation record, not a score.",
    feedbackRubric: {
      title: "Teacher feedback sheet",
      criteria: [
        {
          id: "c1",
          label: "Orders the steps",
          lookFor:
            "Steps follow the real order of the process, with at least one order word such as first or then.",
          nextStep: "Add a new order word each time, such as next or finally.",
        },
        {
          id: "c2",
          label: "Gives a reason or result",
          lookFor: "Uses because or so to connect a cause with its result.",
          nextStep: "Say the cause first, then choose because or so to link it to the result.",
        },
        {
          id: "c3",
          label: "Uses science words",
          lookFor:
            "Uses words like evaporation, water vapor or condensation, not only 'it goes up'.",
          nextStep: "Replace one everyday phrase with a science word from the word bank.",
        },
        {
          id: "c4",
          label: "Speaks so a partner can follow",
          lookFor:
            "Speaks at a pace the partner can follow and finishes each idea before starting the next.",
          nextStep: "Pause after each step and check that your partner is with you.",
        },
      ],
    },
  },
  scoring: { objective: "none", note: "Instructional indicators only; not a WIDA score." },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
