// Original WIDA-aligned listening practice: a spoken explanation of the water cycle. Not an official WIDA or ACCESS item.
const cycleNumbered = {
  kind: "cycle",
  alt: "A circle of four numbered stages with arrows between them: 1 a sun over water, 2 a cloud, 3 rain falling, 4 a drop collecting.",
  longDesc:
    "Four stages in a circle, numbered 1 to 4 clockwise. Stage 1 shows a sun, stage 2 shows a cloud, stage 3 shows rain, stage 4 shows a water drop. Arrows lead from each stage to the next and from stage 4 back to stage 1.",
  stages: [
    { label: "1", icon: "sun" },
    { label: "2", icon: "cloud" },
    { label: "3", icon: "rain" },
    { label: "4", icon: "drop" },
  ],
};

const talkTranscript =
  "Hello, scientists. Today I will explain how water moves around our Earth. This movement is called the water cycle. " +
  "First, the sun warms the water in oceans, lakes and puddles. Because the water gets warm, some of it changes into water vapor. " +
  "Water vapor is a gas, so you cannot see it. Next, the water vapor rises high into the sky. " +
  "The air up there is cold, so the vapor cools and changes back into tiny drops of water. These drops come together and make clouds. " +
  "Then the drops in a cloud join and get heavy. When they are too heavy, they fall as rain or snow. " +
  "Finally, the water runs into rivers, lakes and the ocean, and the cycle starts again.";

const diagramTranscript =
  "Look at the diagram of the water cycle. Number one is evaporation. This is where the sun warms water and some of it becomes water vapor. " +
  "Number two is condensation. This is where water vapor cools and turns into tiny drops that make clouds. " +
  "Number three is precipitation. This is where drops fall from the clouds as rain or snow. " +
  "Number four is collection. This is where water gathers in rivers, lakes and the ocean, or soaks into the ground.";

const coldTranscript =
  "Let me explain one part of the water cycle. After water becomes vapor, the vapor rises high into the sky. " +
  "The air up there is cold, so the vapor cools down. When the vapor cools, it changes back into tiny drops of water. " +
  "Those tiny drops gather together and make clouds. So the cold air is what turns the vapor into drops.";

const puddleTranscript =
  "Here is how a puddle disappears on a sunny day. First, the sun shines on the puddle. " +
  "Because the water gets warm, some of it changes into water vapor. Water vapor is a gas, so you cannot see it. " +
  "Next, the vapor rises up into the air. Finally, the puddle is gone.";

export default {
  id: "wida-g4-esol-explain-how-things-work-listening",
  kind: "wida",
  engine: "wida-studio",
  domain: "Listening",
  title: "Listen to an explanation: how water moves",
  grade: "4",
  band: "3-5",
  cluster: "4-5",
  subject: "esol",
  klus: ["Explain", "Inform"],
  standards: ["ELD-SC", "SL.4.4", "RI.4.3"],
  minutes: 25,
  intro:
    "Listen to a short science talk. Notice the words that show the order of steps and the words that give reasons.",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to WIDA ELD-SC and CCSS speaking and reading standards; the water cycle is the context for language practice, not a mapped science unit.",
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
      "sequence",
    ],
  },
  tasks: [
    {
      id: "l1",
      type: "listen-sequence",
      title: "Order the steps",
      klu: "Explain",
      prompt: "Listen to the talk. Put the steps in the order the speaker tells them.",
      audio: { transcript: talkTranscript, voiceHint: "adult" },
      items: [
        { id: "s1", text: "The sun warms the water." },
        { id: "s2", text: "Some water changes into water vapor." },
        { id: "s3", text: "The vapor cools and makes clouds." },
        { id: "s4", text: "Rain or snow falls." },
        { id: "s5", text: "The water runs into rivers and the ocean." },
      ],
      answer: ["s1", "s2", "s3", "s4", "s5"],
      explain:
        "The speaker uses first, next, then and finally to give the order: the sun warms the water, vapor forms, the vapor cools into clouds, rain or snow falls, and the water collects again.",
      hints: [
        "Listen for the words that tell you the order.",
        "The speaker says first, next, then and finally. Match each step to one of those words.",
        "Ask yourself: which step has to happen before the vapor can cool?",
      ],
      listenFor: ["first", "next", "then", "finally"],
      teacherNote:
        "Replay the audio once after the first attempt and ask students to raise a finger at each order word.",
      supports: {
        ee: {
          wordBank: ["first", "next", "then", "finally"],
          directions: "Listen two times. Say each order word when you hear it.",
        },
        dev: { frames: ["First, ___. Then, ___."] },
        exp: { frames: ["Before ___, ___."] },
        br: {},
      },
    },
    {
      id: "l2",
      type: "listen-select",
      title: "Why do the drops form?",
      klu: "Explain",
      prompt: "Listen. Choose the best answer to the question.",
      audio: { transcript: coldTranscript, voiceHint: "adult" },
      question: "Why does water vapor change into tiny drops high in the sky?",
      options: [
        { id: "a", text: "The air high in the sky is cold." },
        { id: "b", text: "The sun is very hot up there." },
        { id: "c", text: "The rain pushes the vapor down." },
      ],
      answer: "a",
      explain:
        "The speaker says the air up there is cold, so the vapor cools and changes back into tiny drops of water. The cold air is the cause.",
      misconceptions: [
        {
          pick: "b",
          tag: "heat-confusion",
          hint: "The sun warms water near the ground. Listen for what the speaker says about the air high in the sky.",
        },
        {
          pick: "c",
          tag: "reversed-cause",
          hint: "Rain comes later in the cycle. A cause happens before its result.",
        },
      ],
      hints: [
        "Listen for the word so after a sentence about the sky.",
        "The speaker describes the air high up. What is it like?",
        "Find the sentence that begins 'The air up there is'.",
      ],
      listenFor: ["so", "cools", "tiny drops"],
      supports: {
        ee: { frames: ["The air is ___."], wordBank: ["cold", "warm"] },
        dev: { frames: ["The vapor turns into drops because ___."] },
        exp: { frames: ["According to the speaker, ___, so ___."] },
        br: {},
      },
    },
    {
      id: "l3",
      type: "listen-select",
      title: "Words that give a reason",
      klu: "Explain",
      prompt: "Listen. Choose the two words the speaker uses to show a reason or a result.",
      audio: { transcript: puddleTranscript, voiceHint: "adult" },
      question: "Which two words show a reason or a result in the talk?",
      multi: true,
      options: [
        { id: "a", text: "because" },
        { id: "b", text: "so" },
        { id: "c", text: "first" },
        { id: "d", text: "finally" },
      ],
      answers: ["a", "b"],
      explain:
        "Because gives a reason (because the water gets warm) and so gives a result (so you cannot see it). First and finally show order, not a reason.",
      misconceptions: [
        {
          pick: "c",
          tag: "order-vs-reason",
          hint: "First tells when a step happens. Listen for words that tell why something happens.",
        },
        {
          pick: "d",
          tag: "order-vs-reason",
          hint: "Finally tells which step is last. Listen for words that tell why or what happens as a result.",
        },
      ],
      hints: [
        "Some words show order and some words show cause and effect. Today you want cause and effect.",
        "Listen for the sentence about water getting warm and the sentence about a gas you cannot see.",
        "Each correct word sits between a reason and a result.",
      ],
      supports: {
        ee: {
          wordBank: ["because", "so"],
          directions: "One word gives a reason. One word gives a result.",
        },
        dev: { frames: ["___ shows a reason. ___ shows a result."] },
        exp: { frames: ["The speaker uses ___ to explain why ___."] },
        br: {},
      },
    },
    {
      id: "l4",
      type: "listen-label",
      title: "Label the water cycle",
      klu: "Inform",
      prompt: "Listen. Match each number in the diagram to the stage the speaker names.",
      audio: { transcript: diagramTranscript, voiceHint: "adult" },
      visual: cycleNumbered,
      slots: [
        { id: "n1", marker: "1", answer: "evap" },
        { id: "n2", marker: "2", answer: "cond" },
        { id: "n3", marker: "3", answer: "prec" },
        { id: "n4", marker: "4", answer: "coll" },
      ],
      bank: [
        { id: "evap", text: "evaporation" },
        { id: "cond", text: "condensation" },
        { id: "prec", text: "precipitation" },
        { id: "coll", text: "collection" },
        { id: "runoff", text: "freezing" },
      ],
      explain:
        "The speaker names the stages in order: evaporation, condensation, precipitation and collection. Freezing is not one of the four stages named.",
      hints: [
        "The speaker says the number before each stage name.",
        "Match what the speaker says each stage does with the picture: sun, cloud, rain, drop.",
        "Number three is where drops fall from the clouds.",
      ],
      listenFor: ["number one", "number two", "number three", "number four"],
      supports: {
        ee: { wordBank: ["evaporation", "condensation", "precipitation", "collection"] },
        dev: { frames: ["Number ___ is ___."] },
        exp: { frames: ["Number ___ is ___, where ___."] },
        br: {},
      },
    },
    {
      id: "l5",
      type: "listen-notes",
      title: "Take notes on each stage",
      klu: "Inform",
      prompt: "Listen. Write one key word or phrase in each row to finish the note.",
      audio: { transcript: diagramTranscript, voiceHint: "adult" },
      organizer: {
        title: "What happens at each stage",
        rows: [
          {
            id: "r1",
            label: "Evaporation: water becomes ___",
            accept: ["vapor", "water vapor", "gas"],
            placeholder: "a gas",
          },
          {
            id: "r2",
            label: "Condensation: vapor becomes ___",
            accept: ["drops", "clouds", "cloud", "liquid"],
            placeholder: "tiny ___",
          },
          {
            id: "r3",
            label: "Precipitation: water falls as ___",
            accept: ["rain", "snow"],
            placeholder: "rain or ___",
          },
          {
            id: "r4",
            label: "Collection: water gathers in ___",
            accept: ["rivers", "lakes", "ocean", "ground"],
            placeholder: "places",
          },
        ],
      },
      explain:
        "Each stage has one key idea: evaporation makes water vapor, condensation makes drops and clouds, precipitation brings rain or snow, and collection gathers water in rivers, lakes, the ocean or the ground.",
      hints: [
        "Listen to the sentence after each stage name. It tells what happens there.",
        "Write the word that fits the blank, not the whole sentence.",
        "For stage four, the speaker lists places where water gathers.",
      ],
      supports: {
        ee: { wordBank: ["vapor", "drops", "snow", "rivers"] },
        dev: { frames: ["In evaporation, water becomes ___."] },
        exp: { frames: ["During ___, ___."] },
        br: {},
      },
    },
  ],
  successCriteria: [
    "I can put the steps of a process in order after I hear the order words.",
    "I can tell which word gives a reason and which word gives a result.",
    "I can match a spoken description to the right part of a diagram.",
  ],
  supports: {
    ee: {
      directions: "You can listen as many times as you need. Use the word bank and the captions.",
      wordBank: ["first", "next", "then", "finally", "because", "so"],
    },
    dev: {
      directions: "Listen for order words and cause words. Use the frames to help you answer.",
    },
    exp: { directions: "Listen once, then check your answers against the captions." },
    br: {},
  },
  teacherGuide: {
    purpose:
      "Students listen to a spoken explanation of a process and track sequence connectors and cause-and-effect words while building a picture of the water cycle.",
    languageFocus: [
      "sequence connectors: first, next, then, finally",
      "cause and result: because, so, when",
      "science nouns: evaporation, condensation, precipitation, collection",
    ],
    before: [
      "Show the numbered cycle picture and ask students to name anything they already know about water moving around.",
      "Say the four order words aloud and have students echo them with a hand gesture for each.",
    ],
    during: [
      "Let students listen twice. After the first listen, ask for one thing they heard in their own words.",
      "Turn captions on for students who need to see the order words while they hear them.",
    ],
    after: [
      "Ask partners to retell the cycle with a hand moving along the diagram while they say first, next, then, finally.",
      "Point out one because-sentence and one so-sentence from the transcript and have students find another.",
    ],
    commonChallenges: [
      {
        challenge: "Students treat first and because as the same kind of word.",
        move: "Sort the words into two columns on the board: order words and cause words. Add one example sentence for each.",
      },
      {
        challenge: "Students hear water vapor as 'water paper' or lose the word in fast speech.",
        move: "Say the phrase slowly while pointing at the sun picture, then replay the sentence in the audio.",
      },
    ],
    differentiation: {
      ee: "Captions on, word bank visible, replay each sentence, answer by pointing or choosing.",
      dev: "Frames visible for each answer, one replay after the first attempt.",
      exp: "Frames available on request; ask students to say why each answer is right using because.",
      br: "No frames; ask students to restate the speaker's explanation using different connecting words.",
    },
    independentPractice:
      "In independent practice nothing is shown until the student asks. Review the indicators as counts of correct parts, never as a level, and use the missed parts to choose the next oral rehearsal.",
  },
  scoring: { objective: "auto", note: "Instructional indicators only; not a WIDA score." },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
