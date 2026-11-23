// Lesson pack: Explain How Water Moves (grade 4 ESOL). Language-function lesson: explain a process with sequence and cause. Original content.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const cycle = {
  kind: "cycle",
  alt: "A circle of four stages with arrows: evaporation with a sun, condensation with a cloud, precipitation with rain, collection with a water drop.",
  longDesc:
    "Evaporation, condensation, precipitation and collection in a circle. Each stage has a small picture and an arrow to the next stage; the last arrow returns to the first.",
  stages: [
    { label: "Evaporation", icon: "sun" },
    { label: "Condensation", icon: "cloud" },
    { label: "Precipitation", icon: "rain" },
    { label: "Collection", icon: "drop" },
  ],
};

const puddle = {
  kind: "flow",
  alt: "Three pictures in a row: a puddle on the ground, the sun shining on it, and a much smaller puddle.",
  longDesc:
    "Left to right: a full puddle, the sun's heat, and a small puddle. Arrows connect the pictures. The question is where the water went.",
  steps: [
    { label: "Big puddle in the morning", icon: "drop" },
    { label: "Sun shines all day", icon: "sun" },
    { label: "Small puddle at night", icon: "drop" },
  ],
};

const orderWords = {
  kind: "table",
  alt: "A table of order words for explaining a process: first and to begin start the steps, next and then continue them, finally ends them.",
  longDesc:
    "Two columns. Column one lists the job: start, continue, end. Column two lists the words: First or To begin; Next, Then or After that; Finally or Last.",
  head: ["Job in the explanation", "Order words"],
  rows: [
    ["Start the steps", "First, To begin"],
    ["Continue the steps", "Next, Then, After that"],
    ["End the steps", "Finally, Last"],
  ],
};

export default {
  id: "g4-esol-explain-how-things-work",
  kind: "lesson",
  title: "Explain How Water Moves",
  subtitle: "Use order words and because to explain the stages of the water cycle",
  grade: "4",
  band: "3-5",
  subject: "esol",
  duration: 45,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to WIDA ELD-SC and CCSS speaking and informational-text standards; the water cycle is the context for language practice, not a mapped science unit. Not mapped to a district unit sequence.",
  },
  standards: ["ELD-SC", "SL.4.1", "SL.4.4", "RI.4.3", "W.4.2c"],
  wida: {
    eld: ["ELD-SC"],
    klus: ["Explain", "Inform"],
    domains: ["Listening", "Speaking"],
    cluster: "4-5",
  },
  contentObjective:
    "I can name the four stages of the water cycle and say what makes the water change at each stage.",
  languageObjective:
    "I can explain the water cycle in order by using 'first, next, then, finally' and 'because'.",
  languageDemands: {
    functions: [
      "explain a process step by step",
      "give a cause and its result",
      "check that a listener understands",
    ],
    structures: [
      "First, ___. Next, ___. Then, ___. Finally, ___.",
      "The ___ turns into ___ because ___.",
      "Does that make sense? Which step should I say again?",
    ],
    discourse:
      "A four-part partner explanation: topic sentence, ordered steps, one reason, closing check. The listener asks one question.",
    barriers: [
      "'cycle' names a loop with no end, but students expect a story with an ending",
      "'vapor' and 'cloud' are often treated as the same thing, but a cloud is made of tiny liquid drops",
      "'condense' and 'condensation' sound like 'condensed milk' to some learners",
      "'because' and 'so' join a cause and a result in opposite directions",
      "long noun phrases such as 'the tiny drops of liquid water' hide the subject of the sentence",
    ],
    oralRehearse: [
      "First, the sun warms the water in the ocean.",
      "The vapor turns into drops because the air high in the sky is cold.",
      "Finally, the water runs into rivers and the ocean, and the cycle starts again.",
    ],
    writeScaffold:
      "First, ___. Next, ___. Then, ___ because ___. Finally, ___, and the cycle starts again.",
  },
  vocab: {
    collection: "g4-esol-explain-how-things-work",
    ids: [
      "evaporation",
      "water-vapor",
      "condensation",
      "precipitation",
      "collection",
      "cloud",
      "cycle",
      "liquid",
      "sequence",
      "because",
      "so",
    ],
  },
  launch: {
    title: "Notice and Wonder: the shrinking puddle",
    visual: puddle,
    prompts: [
      "What do you notice about the puddle in each picture?",
      "What do you wonder about where the water went?",
      "How could you explain to a friend what happened to the water?",
    ],
    teacherNote:
      "Show the three pictures with the words covered. Take two noticings and two wonderings. Students will say 'it disappeared' or 'it went away'. Write those phrases on the board and leave them there; the lesson replaces them with the science word evaporation. Ask 'Went where?' so students must name a place. Accept home-language talk with a partner before an English sentence.",
  },
  teach: {
    model: [
      "Water moves in a cycle. A cycle is a set of steps that repeat, so the last step leads back to the first step. We can start the explanation anywhere. Today we start with the sun.",
      "First, evaporation. The sun's heat warms liquid water in an ocean, a lake or a puddle. Some of the water changes into water vapor, which is a gas. You cannot see water vapor, and it rises into the air.",
      "Next, condensation. High in the sky the air is cold. The water vapor cools and changes back into tiny drops of liquid water. These drops gather together and make clouds. A cloud is made of drops, not of vapor.",
      "Then, precipitation. When the drops in a cloud join and become heavy, they fall to the ground as rain, snow, sleet or hail.",
      "Finally, collection. The water runs into rivers, lakes and the ocean, or soaks into the ground. The sun warms it again, and the cycle starts over. To explain this well, name the process, tell the steps in order and give a reason with 'because' or 'so'.",
    ],
    moves: [
      "Model the whole explanation once with the cycle picture, pointing at each stage. Then say it again and have students echo each sentence with a hand motion for the order word.",
      "Chart the order words in the table: start, continue, end. Have students stand when they hear a start word and sit for an end word.",
      "Teach cause with two colors. Write the cause in blue and the result in green: 'The air is cold (cause), so the vapor becomes drops (result).' Then flip the sentence with 'because'.",
      "Ask 'What changes into what?' at every stage so students say both the starting form and the ending form of the water.",
      "Rehearse in pairs before anyone speaks to the class. The listener has a job: say which step was clear and ask one question.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt:
        "Your partner asks, 'How does water move around the Earth?' Which sentence is the best way to begin your explanation?",
      choices: [
        "I will explain how water moves through the water cycle.",
        "Water is very important to me.",
        "It rained on Tuesday.",
      ],
      answer: 0,
      hint: "A good start tells the listener what process you will explain.",
      supports: {
        ee: {
          frames: ["I will explain ___."],
          wordBank: ["explain", "water cycle", "water"],
          visual: cycle,
          oral: "Point to the picture, then say the topic out loud.",
        },
        dev: { frames: ["I will explain how ___ moves."], wordBank: ["process", "explain"] },
        exp: { frames: ["Today I am going to explain how ___ and why."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt: "Which list shows the four stages in order, starting when the sun heats the water?",
      choices: [
        "evaporation, condensation, precipitation, collection",
        "condensation, evaporation, collection, precipitation",
        "precipitation, evaporation, collection, condensation",
      ],
      answer: 0,
      hint: "Ask what happens to the water first when it gets warm. Then ask what happens when the vapor reaches cold air.",
      supports: {
        ee: {
          frames: ["First, ___. Next, ___."],
          wordBank: ["sun", "vapor", "cloud", "rain"],
          visual: cycle,
        },
        dev: {
          frames: ["First, ___. Next, ___. Then, ___. Finally, ___."],
          wordBank: ["sequence", "order"],
        },
        exp: { frames: ["The stages happen in this order: ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "choice",
      prompt: "Which sentence uses 'because' to give the real cause?",
      choices: [
        "The vapor turns into drops because the air high in the sky is cold.",
        "The air high in the sky is cold because the vapor turns into drops.",
        "Because the clouds and the rain and the sky.",
      ],
      answer: 0,
      hint: "Find the thing that happens first. The word 'because' comes right before the cause.",
      supports: {
        ee: {
          frames: ["___ because ___."],
          wordBank: ["cold", "drops", "vapor"],
          oral: "Say the cause first, then the result. Then say the sentence with because.",
        },
        dev: { frames: ["The ___ turns into ___ because ___."], wordBank: ["cause", "result"] },
        exp: { frames: ["___ happens because ___, so ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "short",
      prompt:
        "A puddle gets smaller on a sunny day. Write one sentence that explains why. Use 'because' and the word 'evaporates' or 'evaporation'.",
      answer:
        "The puddle gets smaller because the sun's heat evaporates the water and turns it into water vapor.",
      hint: "Say what warms the water and what the liquid water becomes. Put 'because' between the result and the cause.",
      supports: {
        ee: {
          frames: ["The puddle gets smaller because the sun ___."],
          wordBank: ["sun", "warms", "water vapor", "evaporates"],
          visual: puddle,
        },
        dev: {
          frames: ["The puddle gets smaller because ___ turns the water into ___."],
          wordBank: ["heat", "gas"],
        },
        exp: { frames: ["The puddle shrinks because ___, which changes ___ into ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Teach a partner: the four-part explanation",
    task: "Partner A is the explainer and Partner B is the listener. Partner A explains the water cycle with the picture: topic sentence, steps with order words, one reason with because, closing check. Partner B listens for two things: Did the steps come in order? Did the reason connect a cause to a result? Partner B names one clear step and asks one question. Then swap roles and explain a second process, such as how a puddle dries.",
    roles: ["Explainer", "Listener"],
    discussionCards: [
      {
        prompt: "Which order word helped you follow the steps?",
        frame: "The word ___ helped me because it showed ___.",
      },
      {
        prompt: "What question do you still have about one of the steps?",
        frame: "Can you explain again what happens when ___?",
      },
      {
        prompt: "What changes into what at the stage you explained?",
        frame: "At ___, ___ changes into ___ because ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the cycle and its order words",
      visualOrModel: orderWords,
      teacherNote:
        "Hang the cycle picture beside the order-word table. Trace the circle with a finger while saying the order words. Ask students to point to the stage that matches each order word. The picture does not need words to be understood; the table gives the language.",
    },
    discuss: {
      title: "Say it: explain and check",
      structure:
        "Turn and talk. Partner 1 explains one stage with an order word and because. Partner 2 says what is clear and asks which step to repeat. Swap.",
      frames: [
        "First, ___ because ___.",
        "Does that make sense?",
        "I understand ___. Can you say ___ again?",
        "So you are saying that ___.",
      ],
    },
    apply: {
      title: "Use it: a new process",
      task: "Choose a process you know well, such as how ice melts in a cup or how clothes dry on a line. Draw three or four pictures in order. Explain the process to a partner and then write it with first, next, then and finally. Include one sentence with because.",
      successCriteria: [
        "My pictures are in the order the steps happen.",
        "I used at least three order words.",
        "I used because or so to connect a cause to a result.",
        "I used at least two science words.",
      ],
    },
  },
  activities: [
    { engine: "conversation-studio", id: "g4-esol-explain-how-things-work-conversation" },
    { engine: "language-detective", id: "g4-esol-explain-puddle-detective" },
    { engine: "vocab-quest", id: "g4-esol-explain-water-words-quest" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt: "What happens during condensation?",
        choices: [
          "Water vapor cools and changes into tiny drops of liquid water.",
          "Liquid water is heated and changes into a gas.",
          "Rain falls from the clouds to the ground.",
        ],
        answer: 0,
        explain:
          "Condensation is the change from gas to liquid. It happens when the vapor cools high in the sky.",
      },
      {
        id: "i2",
        type: "choice",
        prompt:
          "Choose the connector. The air high in the sky is cold, ___ the water vapor turns into drops.",
        choices: ["because", "so", "but"],
        answer: 1,
        explain:
          "The cold air is the cause and the drops are the result. 'So' points forward to the result.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "Which sentence should come right after 'Next, the vapor rises and cools'?",
        choices: [
          "Then the tiny drops gather and make clouds.",
          "First, the sun warms the ocean.",
          "The water cycle is interesting.",
        ],
        answer: 0,
        explain:
          "After the vapor cools, drops form and make clouds. 'First' belongs at the start, and an opinion does not give the next step.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "Which statement about water vapor is true?",
        choices: [
          "It is a gas that you cannot see.",
          "It is the white part of a cloud.",
          "It is water frozen in the air.",
        ],
        answer: 0,
        explain: "Water vapor is invisible. A cloud is made of tiny liquid drops that you can see.",
      },
      {
        id: "i5",
        type: "short",
        prompt:
          "Explain what happens during precipitation. Use one science word and one sentence with 'because' or 'so'.",
        answer:
          "During precipitation, water falls from the clouds as rain, snow, sleet or hail, because the drops have become too heavy to stay in the air.",
        explain:
          "Look for the stage word, a form of falling water, and a reason connected with because or so.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "Write three sentences that explain the water cycle. Use first, next and finally, and name three stages.",
        answer:
          "First, the sun heats water and evaporation makes water vapor. Next, the vapor cools and condensation makes clouds. Finally, precipitation brings the water back to the ground and collection starts the cycle again.",
        explain:
          "Check the order words, three stage names in the right order and a real change at each stage.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "Which word names the stage when liquid water becomes water vapor?",
        choices: ["Evaporation", "Condensation", "Collection"],
        answer: 0,
        explain: "Evaporation is when heat changes liquid water into a gas.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which order word belongs at the end of an explanation?",
        choices: ["Finally", "First", "Next"],
        answer: 0,
        explain: "'Finally' tells the listener this is the last step.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Say why clouds form. Write one sentence with 'because'.",
        answer: "Clouds form because water vapor cools in the cold air and turns into tiny drops.",
        explain: "The cause is cooling in cold air. The result is tiny drops that make a cloud.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show how you can explain a process.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt: "Which list of stages is in the right order, starting with the sun's heat?",
        choices: [
          "evaporation, condensation, precipitation, collection",
          "collection, condensation, evaporation, precipitation",
          "precipitation, collection, condensation, evaporation",
        ],
        answer: 0,
        explain:
          "Heat makes vapor first, the vapor cools to make clouds, the drops fall, and the water collects.",
      },
      {
        id: "e2",
        type: "short",
        prompt: "Write two sentences about the water cycle. Use one order word and one 'because'.",
        answer:
          "First, the sun warms the ocean and some water becomes vapor. The vapor turns into drops because the air high in the sky is cold.",
        explain: "Look for an order word, a real change and a cause connected by because.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "What can you say to check that your partner understood your explanation?",
        answer: "Does that make sense? Which step should I say again?",
        explain:
          "Any question that asks the partner what is clear or what to repeat is acceptable.",
      },
    ],
    successCriteria: [
      "I told the steps in order.",
      "I used because or so to give a reason.",
      "I used at least one science word correctly.",
    ],
  },
  answerKey: {
    notes:
      "Accept any complete sentence that names the stage or change correctly, uses the order word or connector asked for, and keeps the cause before 'because'. Do not penalize spelling or articles in the written items; look at the science idea, the order and the connector. Accept home-language support during rehearsal.",
    items: {
      g1: "I will explain how water moves through the water cycle. It names the process and tells the listener what is coming.",
      g2: "Evaporation, condensation, precipitation, collection. Heat comes first, then the cooling of vapor, then falling water, then the water gathers.",
      g3: "The vapor turns into drops because the air high in the sky is cold. The cause (cold air) follows 'because'.",
      g4: "The puddle gets smaller because the sun's heat evaporates the water and turns it into water vapor.",
      i1: "Water vapor cools and changes into tiny drops of liquid water.",
      i2: "so",
      i3: "Then the tiny drops gather and make clouds.",
      i4: "It is a gas that you cannot see.",
      i5: "During precipitation, water falls from the clouds as rain, snow, sleet or hail, because the drops have become too heavy to stay in the air.",
      i6: "First, the sun heats water and evaporation makes water vapor. Next, the vapor cools and condensation makes clouds. Finally, precipitation brings the water back to the ground and collection starts the cycle again.",
      f1: "Evaporation.",
      f2: "Finally.",
      f3: "Clouds form because water vapor cools in the cold air and turns into tiny drops.",
      e1: "Evaporation, condensation, precipitation, collection.",
      e2: "First, the sun warms the ocean and some water becomes vapor. The vapor turns into drops because the air high in the sky is cold.",
      e3: "Does that make sense? Which step should I say again?",
    },
  },
  extension: {
    title: "Explain a cycle from your own life",
    task: "Many things in life repeat in a cycle: a day, a week at school, a plant growing seeds that grow new plants. Pick one cycle. Draw it as a circle with at least four stages. Explain it to a partner and write a paragraph that uses order words, one because sentence and at least two vocabulary words from today.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo explicar el ciclo del agua en orden usando primero, luego, después y finalmente.",
      vocab: [
        { en: "evaporation", es: "evaporación", verified: true },
        { en: "condensation", es: "condensación", verified: true },
        { en: "precipitation", es: "precipitación", verified: true },
        { en: "water vapor", es: "vapor de agua", verified: true },
        { en: "cycle", es: "ciclo", verified: true },
      ],
      familyPrompt:
        "Miren una taza de agua caliente o una olla con tapa. Pidan a su hijo o hija que explique en el idioma que prefiera, o en inglés, qué le pasa al agua y por qué aparecen gotas en la tapa.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach with the cycle picture 10. Guided items 8. Partner explanation with the conversation activity 15. Exit ticket 5. Close with two students explaining one stage each, 2. If short on time, run the guided items orally and move the Language Detective activity to the next day.",
    misconceptions: [
      "'The water disappears.' Students think a puddle just goes away. Ask 'Went where?' and point to water vapor as an invisible gas in the air.",
      "'Clouds are made of water vapor.' Clouds are tiny drops of liquid water. Vapor is invisible, and a cloud can be seen.",
      "'The cycle has an end.' Students say 'finally it stops'. Use the circle, and finish with 'and the cycle starts again'.",
      "Cause and result reversed. Students write 'The air is cold because the vapor turns into drops.' Mark cause and result with two colors before writing the sentence.",
      "A list of facts instead of an explanation. Students name the stages with no order words and no reason. Require one order word per step and one because.",
    ],
    differentiation:
      "Entering and Emerging learners use the cycle picture, point to each stage while speaking and complete the sentence frames. Developing learners add a second sentence to each step. Expanding and Bridging learners vary the connectors (as a result, once, which means) and explain why each stage needs the one before it. The science content, the order of stages and the cause-and-result target are the same in every tier.",
    languageNotes:
      "Teach 'evaporation' with the gesture of hands rising. Teach 'condensation' by showing drops on the outside of a cold cup if possible. Contrast the words evaporate (verb) and evaporation (noun) in two sentences. Home-language talk before English writing is welcome; the target is the explanation, not the vocabulary test.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
