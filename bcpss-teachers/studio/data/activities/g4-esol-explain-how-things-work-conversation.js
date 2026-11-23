// Conversation Studio: a partner talk where one student explains the water cycle. Original content.
const move = (id, label, fn, frames, example, extra = {}) => ({
  id,
  label,
  function: fn,
  frames,
  example,
  ...extra,
});

export default {
  id: "g4-esol-explain-how-things-work-conversation",
  engine: "conversation-studio",
  title: "Explain the water cycle to a partner",
  grade: "4",
  band: "3-5",
  subject: "esol",
  lessonId: "g4-esol-explain-how-things-work",
  standards: ["ELD-SC", "SL.4.1", "SL.4.4"],
  vocabIds: ["g4-esol-explain-how-things-work:sequence", "g4-esol-explain-how-things-work:because"],
  minutes: 20,
  intro:
    "A classmate missed the science talk and asks you to explain how water moves. Plan your explanation, put your moves in order, and rehearse the talk.",
  topic: {
    title: "How water moves around the Earth",
    context:
      "The water cycle has four stages: evaporation, condensation, precipitation and collection. Your partner has not heard the explanation yet, so your job is to make the steps and the reasons clear.",
    claim:
      "Water moves in a cycle because the sun heats it, the sky cools it and gravity brings it back down.",
    visual: {
      kind: "cycle",
      alt: "A circle of four stages with arrows: evaporation with a sun, condensation with a cloud, precipitation with rain, collection with a drop.",
      longDesc:
        "Evaporation, condensation, precipitation and collection in a circle, each with a small picture and an arrow to the next stage.",
      stages: [
        { label: "Evaporation", icon: "sun" },
        { label: "Condensation", icon: "cloud" },
        { label: "Precipitation", icon: "rain" },
        { label: "Collection", icon: "drop" },
      ],
    },
  },
  roles: [
    { id: "explainer", label: "Explainer", job: "Explain how water moves, step by step." },
    { id: "listener", label: "Listener", job: "Ask questions and say what is clear." },
  ],
  moves: [
    move(
      "introduce",
      "Say what you will explain",
      "Tell your partner the topic so they know what to listen for.",
      {
        ee: ["I will explain ___."],
        dev: ["I will explain how ___ moves."],
        exp: ["Today I am going to explain how ___ and why."],
        br: ["Let me explain the process by which ___."],
      },
      "I will explain the water cycle. It is how water moves from the Earth to the sky and back.",
      { listenFor: "A clear topic sentence naming the process." },
    ),
    move(
      "first",
      "Tell the first step",
      "Begin the sequence with an order word and the first thing that happens.",
      {
        ee: ["First, ___."],
        dev: ["First, ___ and ___."],
        exp: ["First, the ___ ___, so ___."],
        br: ["The process begins when ___."],
      },
      "First, the sun warms the water in the ocean, and some of it changes into water vapor.",
      {
        wordBank: { ee: ["sun", "water", "warms"], dev: [], exp: [], br: [] },
        listenFor: "An order word and a real first step.",
      },
    ),
    move(
      "next",
      "Tell the next steps",
      "Keep the sequence going with next, then and the steps that follow.",
      {
        ee: ["Next, ___. Then, ___."],
        dev: ["Next, ___. Then, ___ and ___."],
        exp: ["Next, ___. After that, ___."],
        br: ["Once ___, ___ follows."],
      },
      "Next, the vapor rises and cools. Then the tiny drops come together and make clouds.",
      { wordBank: { ee: ["vapor", "cloud", "rises"], dev: [], exp: [], br: [] } },
    ),
    move(
      "cause",
      "Tell why a step happens",
      "Use because or so to connect a cause with its result.",
      {
        ee: ["___ because ___."],
        dev: ["The ___ ___ because ___."],
        exp: ["___ happens because ___, so ___."],
        br: ["Because ___, ___; as a result, ___."],
      },
      "The vapor turns into drops because the air high in the sky is cold.",
      { listenFor: "Because or so joining a cause to its result." },
    ),
    move(
      "finish",
      "Tell the last step",
      "End the sequence with finally and say that the cycle starts again.",
      {
        ee: ["Finally, ___."],
        dev: ["Finally, ___. Then it starts again."],
        exp: ["Finally, ___, and the cycle starts again."],
        br: ["The cycle closes when ___, and then ___."],
      },
      "Finally, the water runs into rivers and the ocean, and the cycle starts again.",
    ),
    move(
      "check",
      "Check that your partner follows",
      "Ask your partner to say what is clear or what needs repeating.",
      {
        ee: ["Do you understand?"],
        dev: ["Does that make sense? Which step should I say again?"],
        exp: ["Which part was clear, and which part should I explain again?"],
        br: ["Which step would you like me to explain in more detail?"],
      },
      "Does that make sense? Which step should I say again?",
    ),
    move(
      "opinion",
      "Say what you think about rain",
      "Give a personal opinion about weather.",
      {
        ee: ["I like ___."],
        dev: ["I like rain because ___."],
        exp: ["Personally, I prefer ___ because ___."],
        br: ["In my view, ___."],
      },
      "I like rainy days because I can stay inside and read.",
      {
        notFit:
          "This move shares a personal opinion. Your purpose today is to explain how a process works.",
      },
    ),
    move(
      "story",
      "Tell about a rainy day you remember",
      "Tell a story about one time it rained.",
      {
        ee: ["One day, it ___."],
        dev: ["Last week, it ___ and I ___."],
        exp: ["I remember a day when ___ and then ___."],
        br: ["I recall a day on which ___."],
      },
      "Last week it rained during recess, so we played inside.",
      {
        notFit:
          "A story about one day is fun, but your partner asked for the steps of the process. Keep the steps in focus.",
      },
    ),
  ],
  purposes: [
    {
      id: "explain",
      label: "Explain a process",
      description: "Tell the steps in order and say why the steps happen.",
      moveIds: ["introduce", "first", "next", "cause", "finish", "check", "opinion", "story"],
      plan: {
        prompt:
          "Choose the moves that fit an explanation of a process, then put them in the order you would use them.",
        expected: ["introduce", "first", "next", "cause", "finish", "check"],
        hints: [
          "A good explanation tells the listener what is coming before it gives the steps.",
          "Two of the moves are about you, not about the process. Leave them out.",
          "The reasons for the steps come after the steps are on the table.",
        ],
        model:
          "Start by naming the topic, then tell the steps in order, add the reason that connects them, end with the last step, and check that your partner understood.",
        why: [
          "Naming the topic first tells your partner what to listen for.",
          "The first step starts the sequence.",
          "The next steps keep the order clear.",
          "The reason connects the steps so they make sense.",
          "The last step shows the cycle closes.",
          "Checking makes sure your explanation worked for your partner.",
        ],
      },
      rehearsal: {
        intro:
          "Your partner is a classmate who missed the science talk and wants to understand the water cycle.",
        turns: [
          {
            id: "t1",
            speaker: "partner",
            say: "Hi! I missed the science talk. Can you explain how water moves around the Earth?",
            note: "Partner asks for the explanation and listens.",
          },
          {
            id: "t2",
            speaker: "you",
            prompt: "Begin by telling your partner what you will explain.",
            moveId: "introduce",
            options: [
              {
                id: "a",
                text: "I will explain the water cycle. It is how water moves from the Earth to the sky and back.",
                fit: "strong",
                note: "Names the process and tells the listener what is coming.",
              },
              {
                id: "b",
                text: "Water is wet and it is in the sea.",
                fit: "off",
                note: "That is true, but it does not tell your partner what you will explain.",
              },
              {
                id: "c",
                text: "It is about water.",
                fit: "partial",
                note: "Close, but name the process: the water cycle and how water moves.",
              },
            ],
          },
          {
            id: "t3",
            speaker: "partner",
            say: "Okay. Where does it start?",
            note: "Partner asks for the first step.",
          },
          {
            id: "t4",
            speaker: "you",
            prompt: "Tell the first step. Use an order word.",
            moveId: "first",
            options: [
              {
                id: "a",
                text: "First, the sun warms the water in the ocean, and some of it changes into water vapor.",
                fit: "strong",
                note: "Uses an order word and gives a clear first step with the science word.",
              },
              {
                id: "b",
                text: "The water is in the ocean.",
                fit: "partial",
                note: "True, but there is no order word and the step does not say what changes.",
              },
              {
                id: "c",
                text: "Then rain falls on the ground.",
                fit: "off",
                note: "Rain is a later step. The first step is what makes the water rise.",
              },
            ],
          },
          {
            id: "t5",
            speaker: "partner",
            say: "What happens to the vapor?",
            note: "Partner asks for the next steps.",
          },
          {
            id: "t6",
            speaker: "you",
            prompt: "Tell the next steps and say why the vapor changes.",
            moveId: "next",
            options: [
              {
                id: "a",
                text: "Next, the vapor rises and cools. Then the tiny drops come together and make clouds.",
                fit: "strong",
                note: "Two order words and the steps are in the right order.",
              },
              {
                id: "b",
                text: "The vapor goes up and it is a cloud.",
                fit: "partial",
                note: "The idea is right, but add order words and say that the vapor cools first.",
              },
              {
                id: "c",
                text: "The vapor falls as snow.",
                fit: "off",
                note: "Vapor does not fall. Clouds form first, and then precipitation falls.",
              },
            ],
          },
          {
            id: "t7",
            speaker: "partner",
            say: "Why does the vapor turn into drops?",
            note: "Partner asks for a reason.",
          },
          {
            id: "t8",
            speaker: "you",
            prompt: "Give the reason with because or so.",
            moveId: "cause",
            options: [
              {
                id: "a",
                text: "The vapor turns into drops because the air high in the sky is cold.",
                fit: "strong",
                note: "Uses because and states the real cause.",
              },
              {
                id: "b",
                text: "The air is cold, so it rains on the ocean.",
                fit: "partial",
                note: "The cold air is the cause, but the result is that the vapor forms drops, not that it rains right then.",
              },
              {
                id: "c",
                text: "The vapor is hot because the sun is hot.",
                fit: "off",
                note: "The sun warms the water near the ground. The change to drops happens in cold air.",
              },
            ],
          },
          {
            id: "t9",
            speaker: "partner",
            say: "Okay. And then what?",
            note: "Partner asks for the ending.",
          },
          {
            id: "t10",
            speaker: "you",
            prompt: "Tell the last steps. Say what happens to the cycle.",
            moveId: "finish",
            options: [
              {
                id: "a",
                text: "Finally, the drops fall as rain or snow, the water runs into rivers and the ocean, and the cycle starts again.",
                fit: "strong",
                note: "Ends with an order word, covers precipitation and collection, and closes the cycle.",
              },
              {
                id: "b",
                text: "Finally, it stops.",
                fit: "off",
                note: "The water cycle does not stop. The last step leads back to the first.",
              },
              {
                id: "c",
                text: "It rains and then it is over.",
                fit: "partial",
                note: "Rain is part of it, but name where the water goes and say that the cycle starts again.",
              },
            ],
          },
          {
            id: "t11",
            speaker: "partner",
            say: "I think I understand the order. Do you want to check anything?",
            note: "Partner leaves space for a check.",
          },
          {
            id: "t12",
            speaker: "you",
            prompt: "Check that your partner follows.",
            moveId: "check",
            options: [
              {
                id: "a",
                text: "Does that make sense? Which step should I say again?",
                fit: "strong",
                note: "Invites the partner to say what is unclear.",
              },
              {
                id: "b",
                text: "You should know it now.",
                fit: "off",
                note: "That does not check understanding. Ask your partner what is clear.",
              },
              {
                id: "c",
                text: "Did you hear me?",
                fit: "partial",
                note: "Close, but ask about the meaning, not about hearing.",
              },
            ],
          },
        ],
      },
    },
  ],
  successCriteria: [
    { id: "s1", label: "I told the steps of the water cycle in the right order." },
    { id: "s2", label: "I used at least two order words such as first, next, then or finally." },
    { id: "s3", label: "I used because or so to connect a cause with its result." },
    {
      id: "s4",
      label: "I used at least two science words, such as evaporation, water vapor or condensation.",
    },
    { id: "s5", label: "I checked that my partner understood." },
  ],
  rubric: {
    criteria: [
      {
        id: "r1",
        label: "Order of steps",
        levels: [
          { score: 1, descriptor: "Names some steps but not in order." },
          { score: 2, descriptor: "Tells most steps in order with one order word." },
          { score: 3, descriptor: "Tells all steps in order with several order words." },
        ],
      },
      {
        id: "r2",
        label: "Reasons and results",
        levels: [
          { score: 1, descriptor: "Lists steps with no reasons." },
          { score: 2, descriptor: "Gives one reason with because or so." },
          { score: 3, descriptor: "Gives reasons that connect several steps." },
        ],
      },
      {
        id: "r3",
        label: "Science words",
        levels: [
          { score: 1, descriptor: "Uses everyday words such as 'goes up'." },
          { score: 2, descriptor: "Uses one or two science words." },
          { score: 3, descriptor: "Uses science words accurately throughout." },
        ],
      },
      {
        id: "r4",
        label: "Checking with a partner",
        levels: [
          { score: 1, descriptor: "Does not check with the partner." },
          { score: 2, descriptor: "Asks if the partner understands." },
          { score: 3, descriptor: "Asks which part to explain again and responds." },
        ],
      },
    ],
  },
  reflection: {
    prompt: "What language move helped your explanation the most, and what will you try next time?",
    frames: {
      ee: ["I used ___.", "Next time I will say ___."],
      dev: ["The word ___ helped me because ___.", "Next time I will try ___."],
      exp: ["Using ___ made my explanation clearer because ___.", "Next time I want to add ___."],
      br: ["My explanation improved when I ___; next I will vary ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
