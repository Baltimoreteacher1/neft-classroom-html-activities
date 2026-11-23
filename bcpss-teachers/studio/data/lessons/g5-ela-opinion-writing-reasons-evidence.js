// Lesson pack: Opinion Writing with Reasons and Evidence (grade 5 ELA). Original model text, items and examples.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const letters = {
  kind: "table",
  alt: "Two short letters to the principal about recess. Letter A says recess should be longer because the writer likes recess. Letter B says recess should be 10 minutes longer and gives a survey result.",
  longDesc:
    "A table with two rows. Letter A: Recess should be longer. I like recess a lot. Letter B: Recess should be 10 minutes longer. In our class survey, 20 of 24 students said they focus better after playing outside.",
  w: 560,
  h: 260,
  head: ["Letter", "What it says"],
  rows: [
    ["A", "Recess should be longer. I like recess a lot."],
    [
      "B",
      "Recess should be 10 minutes longer. In our class survey, 20 of 24 students said they focus better after playing outside.",
    ],
  ],
};

const planner = {
  kind: "flow",
  alt: "The parts of an opinion paragraph in order: state the opinion, give the strongest reason with evidence, give a second reason with evidence, answer another view, restate the opinion.",
  w: 640,
  h: 220,
  steps: [
    { label: "State your opinion", icon: "flag" },
    { label: "Reason 1 + evidence", icon: "trophy" },
    { label: "Reason 2 + evidence", icon: "book" },
    { label: "Answer another view", icon: "speech-bubble" },
    { label: "Restate your opinion", icon: "check" },
  ],
};

const strength = {
  kind: "bars",
  alt: "A bar chart ranking kinds of support from 1 to 5. Repeats the opinion 1, a feeling 2, a story about one person 3, a fact with a number 4, a fact with a number and its source 5.",
  longDesc:
    "Five bars from short to tall. Repeats the opinion: 1. A feeling: 2. A story about one person: 3. A fact with a number: 4. A fact with a number and its source: 5.",
  xLabel: "Kind of support",
  yLabel: "Strength",
  unit: "strength",
  data: [
    { label: "Repeats it", value: 1 },
    { label: "A feeling", value: 2 },
    { label: "A story", value: 3 },
    { label: "A fact + number", value: 4 },
    { label: "Number + source", value: 5 },
  ],
};

export default {
  id: "g5-ela-opinion-writing-reasons-evidence",
  kind: "lesson",
  title: "Opinion Writing with Reasons and Evidence",
  subtitle:
    "State an opinion, support it with reasons backed by facts and details, link the ideas, and answer another view",
  grade: "5",
  band: "3-5",
  subject: "ela",
  duration: 50,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to CCSS W.5.1, W.5.1b and W.5.1c; not mapped to a district unit sequence. The model paragraph, sources and items are original.",
  },
  standards: ["W.5.1", "W.5.1b", "W.5.1c", "SL.5.1"],
  wida: {
    eld: ["ELD-LA"],
    klus: ["Argue", "Explain"],
    domains: ["Speaking", "Reading", "Writing"],
    cluster: "4-5",
  },
  contentObjective:
    "I can write an opinion paragraph that states my opinion, gives reasons in a logical order, backs each reason with facts and details, and ends with a conclusion.",
  languageObjective:
    "I can link my reasons and evidence with 'for example', 'because' and 'in addition', and answer another view with 'however'.",
  languageDemands: {
    functions: [
      "state and support an opinion",
      "connect a reason to evidence",
      "acknowledge and answer a different view",
    ],
    structures: [
      "I think ___ because ___.",
      "For example, ___ .",
      "In addition, ___ .",
      "Some people think ___ ; however, ___ .",
      "For these reasons, ___ .",
    ],
    discourse:
      "A three-part spoken opinion (opinion, reason with evidence, answer to another view), then the same argument as one written paragraph with linking words.",
    barriers: [
      "'opinion' and 'fact' are easy to confuse when a statement sounds certain",
      "'support' means to hold up, to help and to back up an idea; students may know only one meaning",
      "'argue' sounds like quarrel in everyday talk, but in school it means to give reasons for an idea",
      "'however' and 'for example' change position and punctuation in a sentence",
      "'conclusion' can mean a decision as well as the ending of a piece of writing",
      "'should' signals an opinion and must be paired with a clear verb",
    ],
    oralRehearse: [
      "I think our school should start a garden club because students would learn science by doing.",
      "For example, students could measure the bean plants every week.",
      "Some people think a club takes too much time; however, it meets only once a week.",
    ],
    writeScaffold:
      "I think ___ because ___. For example, ___. In addition, ___. Some people think ___; however, ___. For these reasons, ___.",
  },
  vocab: {
    collection: "g5-ela-opinion-writing-reasons-evidence",
    ids: [
      "opinion",
      "reason",
      "fact",
      "detail",
      "evidence",
      "support",
      "linking-word",
      "introduce",
      "organize",
      "conclusion",
      "persuade",
      "audience",
    ],
  },
  launch: {
    title: "Notice and Wonder: two letters to the principal",
    visual: letters,
    prompts: [
      "What do you notice about Letter A and Letter B?",
      "Which letter would make the principal think about changing recess? What makes you say that?",
      "What does Letter B have that Letter A does not?",
    ],
    teacherNote:
      "Show both letters without a title. Take two noticings, then ask 'Which one would you act on if you were the principal?' Most students choose B and say 'it has numbers.' Record the words students use ('proof', 'facts', 'real') on a chart called What makes a reader believe you. Do not use the words opinion or evidence yet. Students will give those names in the model.",
  },
  teach: {
    text: {
      title: "Model opinion paragraph: a school garden club",
      note: "Original model. Read it aloud, then reread and label each part with colored pencils: opinion, reasons, evidence, linking words, other view, conclusion.",
      paragraphs: [
        "Our school should start a garden club. First, a garden club would help students learn science by doing. For example, students could measure how tall the bean plants grow each week and record the numbers in a chart. In addition, a garden club would help the whole school, because fresh vegetables could be shared at lunch. Some people worry that a garden takes too much time. However, a club that meets once a week for thirty minutes would not take time from class. For these reasons, our school should start a garden club.",
      ],
    },
    model: [
      "An opinion is what a writer thinks about a topic. A reader cannot check an opinion the way they can check a fact, so the writer has to back it up. In the model, the opinion is that the school should start a garden club. It is stated in the first sentence, so the reader knows the point right away.",
      "A reason tells why the writer thinks so. The model gives two reasons: students would learn science by doing, and the club would help the whole school. A reason is not new opinion. It answers the question why.",
      "Evidence proves a reason. Evidence can be a fact, a number, a detail or an example. Measuring the bean plants each week and recording the numbers is a specific example. Facts and details with numbers are stronger than a feeling or a story about one person, and a fact that tells where it came from is stronger still.",
      "Linking words connect the ideas so the reader can follow. 'First' orders the reasons. 'For example' introduces evidence. 'In addition' adds a second reason. 'Because' connects a result to its cause. 'However' turns to another view. 'For these reasons' signals the conclusion.",
      "Good writers put their strongest reason first and think about their audience. They also show that they have heard another view: 'Some people worry that a garden takes too much time.' Then they answer it with a reason: 'However, a club that meets once a week would not take time from class.' The conclusion restates the opinion in a final sentence.",
    ],
    moves: [
      "Read the model aloud once, then give students colored pencils: underline the opinion in one color, the reasons in a second color and the evidence in a third. Circle the linking words. Students compare with a partner before you share.",
      "Show the strength scale on the board (repeats the opinion, a feeling, a story, a fact with a number, a fact with a number and its source). Ask students to place two sentences from the model on the scale.",
      "Cover the linking words in the model and read it aloud. Ask students what is missing. This shows that the words are what make separate sentences into one argument.",
      "Model the planner out loud with a new topic, such as longer lunch. Say the opinion, then pause and ask 'What is my reason? What proves it?' Write one reason with evidence before you ask students to try.",
      "Name the other view before you answer it. Say 'Some people think ___' to the class and let students finish the thought. Then model 'However, ___' with a reason, not just a repeat of your opinion.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt: "Which sentence is an opinion?",
      choices: [
        "The school garden has six beds.",
        "The school garden is the best place at our school.",
        "Bean plants need water to grow.",
      ],
      answer: 1,
      hint: "Ask: could you check this with a ruler, a count or a book? If not, it is probably what someone thinks.",
      supports: {
        ee: {
          frames: ["An opinion tells what someone ___ .", "I can check a ___ ."],
          wordBank: ["think", "fact", "check", "best"],
          oral: "Say each sentence. Which one could you count or measure?",
        },
        dev: {
          frames: ["This is an opinion because I cannot ___ it."],
          wordBank: ["opinion", "fact", "prove"],
        },
        exp: {
          frames: [
            "The sentence ___ is an opinion because it tells what the writer ___ , not something you can check.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt:
        "The opinion is: Our school should start a garden club. Which sentence is the strongest evidence?",
      choices: [
        "Gardens are nice.",
        "My friend has a garden at home.",
        "In our class survey, 19 of 25 students said they would join a garden club.",
      ],
      answer: 2,
      hint: "Look for the sentence that gives a number and tells where the number came from.",
      supports: {
        ee: {
          frames: ["The strongest has a ___ .", "It says ___ of ___ students."],
          wordBank: ["number", "survey", "students", "strong"],
          visual: strength,
        },
        dev: {
          frames: ["The survey sentence is stronger because it gives ___ ."],
          wordBank: ["evidence", "number", "source"],
        },
        exp: {
          frames: [
            "That sentence is stronger than the others because a reader can ___ the number and ___ .",
          ],
        },
        br: {},
      },
    },
    {
      id: "g3",
      type: "short",
      prompt:
        "Join the reason to the evidence with the words for example. Reason: Students would learn science by doing. Evidence: They could measure how tall the plants grow each week.",
      answer:
        "Students would learn science by doing. For example, they could measure how tall the plants grow each week.",
      hint: "Keep the reason as the first sentence. Start the evidence sentence with the linking words and a comma.",
      supports: {
        ee: {
          frames: ["Students would ___ . For example, they could ___ ."],
          wordBank: ["learn", "measure", "plants", "for example"],
        },
        dev: {
          frames: ["___ . For example, ___ ."],
          wordBank: ["linking word", "reason", "evidence"],
        },
        exp: { frames: ["___ . For example, ___ , which shows ___ ."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt:
        "Put these sentences in the best order for an opinion paragraph. (A) For these reasons, the school should start a garden club. (B) Our school should start a garden club. (C) First, a garden club would help students learn science by doing.",
      choices: ["A, B, C", "B, C, A", "C, B, A"],
      answer: 1,
      hint: "A reader needs to know the opinion before the reasons. The last sentence sums everything up.",
      supports: {
        ee: {
          frames: ["First, the ___ . Then, the ___ . Last, the ___ ."],
          wordBank: ["opinion", "reason", "conclusion"],
          visual: planner,
        },
        dev: {
          frames: ["The paragraph begins with ___ because ___ ."],
          wordBank: ["introduce", "organize", "conclusion"],
        },
        exp: {
          frames: [
            "The order works because the opinion comes ___ , the reason comes ___ and the conclusion comes ___ .",
          ],
        },
        br: {},
      },
    },
    {
      id: "g5",
      type: "short",
      prompt:
        "Opinion: Recess should be longer. Someone says: 'Longer recess means less learning time.' Write one sentence that answers this view. Start with However and give a reason.",
      answer:
        "However, students who play outside focus better afterward, so they learn more in the time that is left.",
      hint: "Do not just repeat your opinion. Give a reason that answers the worry about learning time.",
      supports: {
        ee: {
          frames: ["However, students ___ .", "They ___ better."],
          wordBank: ["focus", "learn", "outside", "however"],
        },
        dev: {
          frames: ["However, ___ because ___ ."],
          wordBank: ["however", "reason", "other view"],
        },
        exp: { frames: ["However, ___ , so ___ ."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Opinion planner workshop",
    task: "Partners choose a school issue from a short list (for example a longer lunch, a quiet reading corner, a walking club). Each partner fills in the planner: opinion, strongest reason with evidence, second reason with evidence, another view and an answer to it, and a closing sentence. Partners then swap planners and place each piece of evidence on the strength scale, giving one sentence of feedback: 'Your strongest evidence is ___ because ___. To make ___ stronger, add ___.' Each writer revises one piece of evidence before writing the paragraph.",
    roles: ["Planner", "Evidence checker"],
    discussionCards: [
      {
        prompt: "What is your opinion? Which reason will you put first and why?",
        frame: "My strongest reason is ___ because ___ .",
      },
      {
        prompt: "Where is the evidence for that reason? Where did it come from?",
        frame: "The evidence is ___ and it comes from ___ .",
      },
      {
        prompt: "What might someone who disagrees say? How can you answer it?",
        frame: "Some people think ___ ; however, ___ .",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the parts of an opinion paragraph",
      visualOrModel: planner,
      teacherNote:
        "Place the planner next to the colored model paragraph. Ask students to point to the part of the model that matches each box. Then ask which box has the most room to get stronger with better evidence.",
    },
    discuss: {
      title: "Say it: opinion, reason, evidence",
      structure:
        "Turn and talk. Partner 1 states an opinion and a reason. Partner 2 asks 'What is your evidence?' and Partner 1 answers with 'For example, ___.' Partner 2 then says 'Some people think ___' and Partner 1 answers with 'However, ___.' Switch roles with a new topic.",
      frames: [
        "I think ___ because ___ .",
        "What is your evidence?",
        "For example, ___ .",
        "Some people think ___ ; however, ___ .",
      ],
    },
    apply: {
      title: "Use it: write your opinion paragraph",
      task: "Choose one of the topics from the workshop. Write one opinion paragraph of six to eight sentences with a clear opinion, two reasons in a logical order, a fact or detail for each reason, at least three linking words, another view with an answer, and a concluding sentence.",
      successCriteria: [
        "My first sentence tells the topic and my opinion.",
        "I gave two reasons and put the strongest one first.",
        "Each reason has a fact, a number or a detail as evidence.",
        "I used linking words such as for example, in addition and however.",
        "I answered another view and ended with a conclusion.",
      ],
    },
  },
  activities: [
    { engine: "argument-builder", id: "g5-ela-opinion-library-argument" },
    { engine: "concept-builder", id: "g5-ela-opinion-strength-scale" },
    { engine: "conversation-studio", id: "g5-ela-opinion-conversation" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt: "Which statement is a fact?",
        choices: [
          "Winter is the best season.",
          "Water freezes at 32 degrees Fahrenheit.",
          "Snow days are fun.",
        ],
        answer: 1,
        explain:
          "You can test and check the freezing point. The other two statements tell what someone likes or thinks.",
      },
      {
        id: "i2",
        type: "choice",
        prompt:
          "The opinion is: Our class should read aloud every day. Which reason connects best to the opinion?",
        choices: [
          "Reading aloud helps students hear how words sound and understand the story.",
          "Our class has a rug.",
          "I read a book about space last week.",
        ],
        answer: 0,
        explain:
          "The first choice says why reading aloud is good. The others are true or interesting but do not explain why.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "Which sentence gives evidence?",
        choices: [
          "Everybody likes pizza.",
          "In the cafeteria vote, 120 of 150 students chose pizza for Friday lunch.",
          "Pizza is delicious.",
        ],
        answer: 1,
        explain:
          "It gives a number from a vote and says where the number came from. The others are general or feelings.",
      },
      {
        id: "i4",
        type: "choice",
        prompt:
          "Choose the linking words that fit. Bike racks would help students get exercise. ___, a student who bikes 15 minutes each way gets 30 minutes of exercise a day.",
        choices: ["For example", "However", "In conclusion"],
        answer: 0,
        explain:
          "The second sentence gives an example that proves the first. However turns to a different view, and in conclusion ends the paragraph.",
      },
      {
        id: "i5",
        type: "short",
        prompt:
          "Write an opinion sentence about whether students should help choose the school lunch menu. Then add one reason using because.",
        answer:
          "Any clear opinion with should, followed by a connected reason joined with because, such as: Students should help choose the lunch menu because they will eat more of the food they pick.",
        explain: "Look for an opinion that answers the question, and a reason that explains why.",
      },
      {
        id: "i6",
        type: "choice",
        prompt: "Which sentence works best as a conclusion?",
        choices: [
          "For these reasons, our school should add bike racks.",
          "Also, bike racks cost 200 dollars each.",
          "I like bikes.",
        ],
        answer: 0,
        explain:
          "A conclusion restates the opinion and signals the end. The second sentence adds a new point and the third is a feeling.",
      },
      {
        id: "i7",
        type: "choice",
        prompt:
          "Opinion: Our school should have a longer lunch. Which sentence gives the weakest support? (A) Students would have time to finish eating. (B) Also, lunch is my favorite part of the day. (C) In the October lunch count, 40 students threw away half a sandwich because they ran out of time.",
        choices: ["A", "B", "C"],
        answer: 1,
        explain: "B tells only what the writer likes. A is a reason and C is a fact with a number.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "Which pair is an opinion followed by a reason?",
        choices: [
          "Our class should recycle paper. Paper bins are blue.",
          "Our class should recycle paper because it keeps trash out of landfills.",
          "Recycling is a word. Paper is a thing.",
        ],
        answer: 1,
        explain:
          "The second choice states what should happen and why. The other two do not connect a reason to the opinion.",
      },
      {
        id: "f2",
        type: "short",
        prompt:
          "Write one piece of evidence that could back up the reason: Students would read more if the library were open longer.",
        answer:
          "Any specific fact, number or detail that backs the reason, such as a count of library requests or checkouts.",
        explain: "Look for a fact, number or example, not a feeling.",
      },
      {
        id: "f3",
        type: "choice",
        prompt: "Which linking word joins the opinion to its reason?",
        choices: ["because", "however", "finally"],
        answer: 0,
        explain:
          "Because connects a reason to the opinion. However turns to another view and finally ends a list.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show how you support an opinion.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt:
          "Which statement is the strongest evidence for the opinion that students need a longer lunch?",
        choices: [
          "Lunch is fun.",
          "A teacher timed the line and found students have 8 minutes to eat after waiting 17 minutes.",
          "Some of my friends say lunch is too short.",
        ],
        answer: 1,
        explain:
          "It gives a measured fact with numbers. The other two are a feeling and a report about a few friends.",
      },
      {
        id: "e2",
        type: "short",
        prompt:
          "Write one reason and one piece of evidence for the opinion: Students should have more time to read at school. Use for example.",
        answer:
          "A reason connected to reading time and a specific example or fact joined with for example.",
        explain: "The reason says why. The evidence is a fact, number or example that proves it.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Write a concluding sentence for an opinion paragraph about a longer lunch.",
        answer:
          "A sentence that restates the opinion in new words, such as: For these reasons, our school should give students a longer lunch.",
        explain: "A conclusion restates the opinion and does not add a new reason.",
      },
    ],
    successCriteria: [
      "My reason explains why I hold my opinion.",
      "My evidence is a fact, number or detail, not a feeling.",
      "I used a linking word such as for example or because.",
    ],
  },
  answerKey: {
    notes:
      "For short items, accept any response that has a clear opinion, a reason that answers why, and evidence that is a fact, number or specific detail. Do not require the exact words in the model answers. Common errors: writing a second opinion in place of a reason, using a feeling as evidence, and restating the opinion in the middle of the paragraph instead of the end. For the other-view sentence require a reason after however, not only a repeated opinion.",
    items: {
      g1: "The school garden is the best place at our school. It tells what someone thinks and cannot be checked.",
      g2: "In our class survey, 19 of 25 students said they would join a garden club. It has a number and a source.",
      g3: "Students would learn science by doing. For example, they could measure how tall the plants grow each week.",
      g4: "B, C, A. The opinion comes first, then a reason, then the conclusion.",
      g5: "However, students who play outside focus better afterward, so they learn more in the time that is left.",
      i1: "Water freezes at 32 degrees Fahrenheit. It can be checked.",
      i2: "Reading aloud helps students hear how words sound and understand the story.",
      i3: "In the cafeteria vote, 120 of 150 students chose pizza for Friday lunch.",
      i4: "For example. The second sentence gives an example that proves the first.",
      i5: "Any clear opinion with a connected reason, for example: Students should help choose the lunch menu because they will eat more of the food they pick.",
      i6: "For these reasons, our school should add bike racks.",
      i7: "B. Lunch is my favorite part of the day tells a feeling, not proof.",
      f1: "Our class should recycle paper because it keeps trash out of landfills.",
      f2: "Any specific fact or number, such as the number of students who asked to borrow books after closing.",
      f3: "because.",
      e1: "A teacher timed the line and found students have 8 minutes to eat after waiting 17 minutes.",
      e2: "A reason connected to reading time and an example or fact joined with for example.",
      e3: "A sentence that restates the opinion, such as: For these reasons, our school should give students a longer lunch.",
    },
  },
  extension: {
    title: "Write to the real audience",
    task: "Choose a real decision-maker, such as the principal, the lunchroom manager or a family group. Think about what that audience cares about. Rewrite your opinion paragraph as a short letter. Add one piece of evidence that speaks to the audience, for example a cost, a time or a safety fact. Underline the sentence that you think is most persuasive and explain to a partner why it will work for this reader.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo escribir una opinión con razones y evidencia, y usar palabras de enlace como porque y por ejemplo.",
      vocab: [
        { en: "opinion", es: "opinión", verified: false },
        { en: "reason", es: "razón", verified: false },
        { en: "evidence", es: "evidencia", verified: false },
        { en: "linking word", es: "palabra de enlace", verified: false },
        { en: "conclusion", es: "conclusión", verified: false },
      ],
      familyPrompt:
        "Pregunten a su hijo o hija cuál es su opinión sobre algo de la escuela. Pídanle una razón y un hecho que la pruebe. Usen las palabras porque y por ejemplo.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Model paragraph and teaching 12. Guided practice 8. Planner workshop 10. Activity time 10 (choose one of the three; the argument builder is the longest). Exit ticket 5. If time is short, run the strength scale before the writing day and keep the argument builder and the conversation for a second session.",
    misconceptions: [
      "A second opinion in place of a reason: students write 'I also think we need a pool' as Reason 2. Ask 'Does this say why?' and have them add because.",
      "Feeling as evidence: 'Everyone loves it' or 'it is fun' is offered as proof. Use the strength scale to show the difference between a feeling and a fact with a number.",
      "Evidence that does not match the reason: a true fact that is about a different point (for example, the number of books in a library for an argument about hours). Ask 'Does this help my reader believe this reason?'",
      "Linking words used as decoration: 'For example' followed by a new opinion, or 'however' with no other view. Check that each linking word does the job its name says.",
      "The conclusion adds a new reason: students end with 'Also, ...'. Teach that the ending restates the opinion and the main reason, and does not open a new argument.",
    ],
    differentiation:
      "Entering and Emerging learners work with the Opinion, Reason, Evidence frames and the word bank, rehearse each sentence out loud first, and sort evidence before they write. Developing and Expanding learners write full sentences with at least two linking words and revise evidence after peer feedback. Bridging learners answer a different view with a reason and choose language for a particular audience. Every tier writes an opinion with reasons and evidence; only the language supports change.",
    languageNotes:
      "Teach 'support' with three quick examples: a table with legs, a friend who stands by you, and a fact that holds up a reason. Teach 'argue' as 'give reasons', not 'quarrel'. Keep a classroom chart of linking words grouped by job: order (first, next), add (in addition), prove (for example, because), turn (however), end (for these reasons).",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
