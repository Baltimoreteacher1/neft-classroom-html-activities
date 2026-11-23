// Lesson pack: Argue With Evidence From Text (grade 7 ESOL). Language-function lesson: build and defend a claim from sources. Original content.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const twoStudents = {
  kind: "table",
  w: 480,
  h: 240,
  alt: "A table with two students' statements about the same library question. Student A gives only a feeling. Student B gives a number from a survey.",
  longDesc:
    "Two rows. Student A says the library should stay open because they like it. Student B says the library should stay open because 78 of 120 students surveyed said they would use it.",
  head: ["Student", "What they said"],
  rows: [
    ["A", "Stay open: I like it."],
    ["B", "Stay open: 78 of 120 students would use it."],
  ],
  highlight: [[1, 1]],
};

const cer = {
  kind: "flow",
  w: 480,
  h: 220,
  alt: "Three boxes in a row with arrows: claim, evidence from the text, reasoning that links them.",
  longDesc:
    "Box one says Claim: my position. Box two says Evidence: a fact or quote from the text with its location. Box three says Reasoning: why the evidence proves the claim.",
  steps: [
    { label: "Claim: my position" },
    { label: "Evidence: fact or quote, with where" },
    { label: "Reasoning: why it proves it" },
  ],
};

const testCard = {
  kind: "table",
  w: 480,
  h: 260,
  alt: "A table of three checks for a piece of evidence: is it from the text, does it fit the question, and is there enough of it.",
  longDesc:
    "Three rows. Source: can I point to where it is in the text? Relevant: does it help answer the question? Sufficient: do I have several pieces, from more than one source?",
  head: ["Check", "Ask yourself"],
  rows: [
    ["From the text", "Can I point to where it is?"],
    ["Connected", "Does it help answer the question?"],
    ["Enough", "Do I have more than one piece?"],
  ],
};

export default {
  id: "g7-esol-argue-with-evidence-from-text",
  kind: "lesson",
  title: "Argue With Evidence From Text",
  subtitle: "Choose a claim, test the evidence, explain the reasoning and answer an opposing view",
  grade: "7",
  band: "6-8",
  subject: "esol",
  duration: 50,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to WIDA ELD-LA and CCSS grade 7 reading and writing standards. Not mapped to a district unit sequence.",
  },
  standards: ["ELD-LA", "RI.7.1", "RI.7.8", "W.7.1", "W.7.1b", "SL.7.1"],
  wida: {
    eld: ["ELD-LA"],
    klus: ["Argue"],
    domains: ["Reading", "Writing", "Speaking"],
    cluster: "6-8",
  },
  contentObjective:
    "I can choose a strong claim, test pieces of evidence from a text, and explain how the evidence supports the claim.",
  languageObjective:
    "I can argue a claim by writing 'The text states ___, which shows ___' and by answering an opposing view with 'However, ___'.",
  languageDemands: {
    functions: [
      "state a claim and defend it",
      "cite and evaluate evidence",
      "acknowledge and rebut an opposing view",
    ],
    structures: [
      "I claim that ___ because ___.",
      'The text states, "___" (paragraph ___), which shows that ___.',
      "Some people argue that ___. However, ___.",
    ],
    discourse:
      "A four-move written argument paragraph (claim, cited evidence, reasoning, rebuttal), rehearsed orally in a two-turn partner challenge first.",
    barriers: [
      "'claim' and 'evidence' are used in ordinary talk with looser meanings",
      "'however' and 'therefore' are connectors that students overuse or place incorrectly",
      "long noun phrases in sources, such as 'the extra hour of staff time after the last bell'",
      "hedging language such as 'may', 'could' and 'it seems' that changes how strong a claim sounds",
      "'credible' and 'relevant' have no close cognate in some home languages, although both exist in Spanish",
    ],
    oralRehearse: [
      "I claim that the library should stay open because many students would use it.",
      "The survey states that 78 of 120 students would use it, which shows that there is real demand.",
      "Some people argue that it costs too much. However, the cost is a small part of the budget.",
    ],
    writeScaffold:
      'I claim that ___. The text states, "___" (paragraph ___), which shows that ___. Some people argue that ___. However, ___. Therefore, ___.',
  },
  vocab: {
    collection: "g7-esol-argue-with-evidence-from-text",
    ids: [
      "claim",
      "evidence",
      "reasoning",
      "source",
      "credible",
      "relevant",
      "sufficient",
      "counterclaim",
      "rebut",
      "however",
      "therefore",
      "cite",
    ],
  },
  launch: {
    title: "Notice and Wonder: two students, one question",
    visual: twoStudents,
    prompts: [
      "What do you notice about how Student A and Student B support their position?",
      "Which student is more convincing? What makes the difference?",
      "What could Student A add to make the argument stronger?",
    ],
    teacherNote:
      "Give students time to talk in pairs before sharing. The key noticing is that B gives a number from a source and A gives only a feeling. Record the words students use ('proof', 'facts', 'numbers') on the board; they become the first entries of the evidence chart. Do not define 'evidence' yet. Ask 'What would count as proof?' and let the class build the definition. Students at Entering and Emerging levels can answer by pointing to the words or numbers that convinced them.",
  },
  teach: {
    model: [
      "An argument has three jobs. The claim says what you believe. The evidence gives facts or quotes from the text that prove it. The reasoning explains why the evidence proves the claim. Many weak arguments skip the third job.",
      "A claim is a position you must prove, not a fact. 'The library has 12 computers' is a fact. 'The library should add computers' is a claim. A strong claim answers the question and can be supported by the sources.",
      "Test every piece of evidence with three questions. Is it from the text, so I can point to where? Is it relevant, so it helps answer the question? Is there enough of it, with more than one piece and, if possible, more than one source? A true fact that fails the relevance test does not belong in the argument.",
      "Cite the evidence. Quote or paraphrase the exact fact and name where it is: 'The survey states that 78 of 120 students would use the library (paragraph 2).' Then add the reasoning: 'This shows that most students want the service, because 78 is more than half of 120.'",
      "A strong writer also answers the other side. Name a counterclaim fairly, with 'Some people argue that ___'. Then rebut it with a fact: 'However, the cost is only 3 percent of the budget.' Finish with 'Therefore' and the conclusion the evidence supports.",
    ],
    moves: [
      "Model one full paragraph with a think-aloud: choose the claim, reject one fact as not relevant, cite two pieces, and write the reasoning sentence.",
      "Color-code the paragraph: claim blue, evidence green, reasoning orange, rebuttal red. Have students color a second paragraph.",
      "Teach the three evidence checks as a hand routine: 'From the text? Connected? Enough?' Students count on three fingers.",
      "Practice 'however' with a rule: it points to the other side. Have students say two sentences that disagree, then join them with 'However,' and a comma.",
      "Rehearse orally in a challenge pair: Partner A states a claim, Partner B asks 'What is your evidence?', Partner A answers, and Partner B asks 'Why does that prove it?'. Swap.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt: "Which statement is a claim, a position that needs proof?",
      choices: [
        "The library has twelve computers.",
        "The library should stay open one more hour.",
        "The survey asked 120 students.",
      ],
      answer: 1,
      hint: "A claim is a position. Ask whether a person could reasonably disagree with the statement.",
      supports: {
        ee: {
          frames: ["A claim says what we ___."],
          wordBank: ["claim", "fact", "should", "proof"],
          oral: "Read each statement aloud. Ask: Can I check it, or must I prove it?",
        },
        dev: { frames: ["This is a claim because ___."], wordBank: ["position", "argue", "prove"] },
        exp: { frames: ["The statement is arguable because ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt:
        "A writer claims that the school should build a bike rack. Which piece of evidence is most relevant?",
      choices: [
        "46 of 310 students said they would ride a bike if their bikes were safe.",
        "The writer's friend likes the color red.",
        "Bikes were invented a long time ago.",
      ],
      answer: 0,
      hint: "Ask which fact connects directly to students using a rack.",
      supports: {
        ee: {
          frames: ["The fact is about ___."],
          wordBank: ["rack", "students", "survey", "relevant"],
          visual: testCard,
        },
        dev: {
          frames: ["The fact is relevant because it shows ___."],
          wordBank: ["relevant", "connected"],
        },
        exp: { frames: ["This evidence fits the claim because ___, whereas the others ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "short",
      prompt:
        "The survey says 78 of 120 students would use the library after school. Complete the reasoning: 'This shows that ___ because ___.'",
      answer:
        "This shows that many students want the extra hour because more than half of the students surveyed would use it.",
      hint: "Compare 78 with half of 120. Then say what that tells you about what students want.",
      supports: {
        ee: {
          frames: ["This shows that students ___ because ___."],
          wordBank: ["want", "more than half", "survey"],
          visual: cer,
        },
        dev: {
          frames: ["This shows that ___ because 78 is ___ than ___."],
          wordBank: ["more", "half", "demand"],
        },
        exp: { frames: ["The number 78 shows that ___, because ___, so ___."] },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt: "Which sentence best rebuts a counterclaim?",
      choices: [
        "Some people say it costs too much. However, the parent group will pay half of the 1,800 dollars.",
        "Some people say it costs too much. They are wrong.",
        "It costs money. It costs money.",
      ],
      answer: 0,
      hint: "A good rebuttal acknowledges the other side fairly and then answers it with a fact.",
      supports: {
        ee: {
          frames: ["Some people say ___. But ___."],
          wordBank: ["cost", "parent group", "pay", "but"],
        },
        dev: { frames: ["Some people say ___. However, ___."], wordBank: ["however", "answer"] },
        exp: { frames: ["Although some argue that ___, the evidence shows ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Challenge pairs: defend it with the text",
    task: "Give each pair a one-page packet of two or three short original sources on a school question, such as whether students should have a longer lunch. Partner A chooses a claim and finds two pieces of evidence, each with its location. Partner B plays the challenger: 'Where does it say that?', 'Is it relevant?', 'Why does that prove it?', and finally states a counterclaim. Partner A answers each challenge with the text and rebuts the counterclaim with 'However'. Then they swap packets and roles.",
    roles: ["Defender", "Challenger"],
    discussionCards: [
      {
        prompt: "Where in the text does your evidence appear?",
        frame: 'The text states, "___" in paragraph ___.',
      },
      {
        prompt: "Why does that evidence prove your claim?",
        frame: "This shows that ___ because ___.",
      },
      {
        prompt: "What would someone who disagrees say?",
        frame: "Some people argue that ___. However, ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: claim, evidence, reasoning",
      visualOrModel: cer,
      teacherNote:
        "Show the three-box flow beside a color-coded model paragraph. Point to each sentence and match it to a box. Then show the three evidence checks and ask students to apply them to one weak card and one strong card.",
    },
    discuss: {
      title: "Say it: the challenge routine",
      structure:
        "Partner 1 states a claim with one piece of evidence. Partner 2 asks 'How do you know?' and 'Why does that prove it?'. Partner 1 answers using the frames. Swap after one round.",
      frames: [
        "I claim that ___.",
        "How do you know? Where does it say that?",
        "The text states ___, which shows that ___.",
        "I agree that ___, but I wonder whether ___.",
      ],
    },
    apply: {
      title: "Use it: write one argument paragraph",
      task: "Choose a school question that interests you and the packet your teacher provides. Write one paragraph with a claim, two cited pieces of evidence from different sources, a reasoning sentence for each, one counterclaim and a rebuttal. Use 'however' and 'therefore' at least once each.",
      successCriteria: [
        "My claim answers the question.",
        "My evidence comes from the text and I told where.",
        "I explained why each piece of evidence proves my claim.",
        "I answered an opposing view with a fact.",
      ],
    },
  },
  activities: [
    { engine: "argument-builder", id: "g7-esol-library-hour-argument" },
    { engine: "language-detective", id: "g7-esol-bike-rack-detective" },
    { engine: "vocab-quest", id: "g7-esol-argument-words-quest" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt:
          "Claim: The school should add recycling bins in the cafeteria. Which is the strongest evidence?",
        choices: [
          "A weekly log shows the cafeteria threw away 220 pounds of recyclable paper and plastic last month.",
          "I think recycling is good.",
          "The cafeteria is the biggest room in the school.",
        ],
        answer: 0,
        explain:
          "It is a measured fact from a record, and it bears directly on the claim. The others are an opinion and a fact that is not relevant.",
      },
      {
        id: "i2",
        type: "choice",
        prompt:
          "Which source is the most credible for facts about how much trash the cafeteria makes?",
        choices: [
          "The custodian's weekly weight log",
          "A rumor passed around the hallway",
          "A post with no author and no facts",
        ],
        answer: 0,
        explain:
          "A log kept by the person who handles the trash names its facts and can be checked. The others cannot be checked.",
      },
      {
        id: "i3",
        type: "choice",
        prompt:
          "Which fact is NOT relevant to the question 'Should the school add recycling bins?'",
        choices: [
          "The cafeteria menu has five lunch choices.",
          "The cafeteria threw away 220 pounds of recyclable paper last month.",
          "Each recycling bin costs 60 dollars.",
        ],
        answer: 0,
        explain:
          "The menu does not help answer a question about recycling. The amount thrown away and the cost both bear on the decision.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "Which is sufficient evidence for the claim that students want recycling bins?",
        choices: [
          "One student told a teacher she wanted them.",
          "A survey where 96 of 120 students asked for them, plus a petition signed by 40 students.",
          "The writer's own opinion that bins are a good idea.",
        ],
        answer: 1,
        explain:
          "Two pieces of evidence from different sources show wide support. One student or one opinion is not enough.",
      },
      {
        id: "i5",
        type: "short",
        prompt:
          "Write a rebuttal for this counterclaim: 'Some people say recycling bins would be too much work for the custodians.' Use the word however and this fact: the custodian said emptying the bins takes ten minutes a day.",
        answer:
          "Some people say recycling bins would be too much work for the custodians. However, the custodian said emptying the bins takes only ten minutes a day, so the extra work is small.",
        explain:
          "Look for a fair acknowledgment, 'however', the ten-minute fact and a conclusion about the work.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "Write a short argument paragraph with a claim, this cited evidence and a reasoning sentence. Evidence: 'The log shows 220 pounds of recyclable paper and plastic in the trash last month (paragraph 2).'",
        answer:
          "I claim that the school should add recycling bins in the cafeteria. The log states that 220 pounds of recyclable paper and plastic went into the trash last month (paragraph 2), which shows that a large amount of material could be recycled. Therefore, bins would reduce waste.",
        explain:
          "Look for a claim, the evidence with its location, a sentence explaining why it supports the claim and a concluding link word.",
      },
      {
        id: "i7",
        type: "numeric",
        prompt:
          "The cafeteria threw away 220 pounds of recyclable paper in 4 weeks. At a steady rate, how many pounds is that per week?",
        answer: 55,
        calc: "220/4",
        explain: "220 divided by 4 is 55 pounds per week.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: "Which statement is a fact, not a claim?",
        choices: [
          "The school should add more buses.",
          "The school has 14 buses.",
          "Buses are better than cars.",
        ],
        answer: 1,
        explain: "A fact can be checked. The other two are positions that need proof.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which connector shows a contrast?",
        choices: ["However", "Therefore", "Also"],
        answer: 0,
        explain:
          "'However' points to an idea that pulls the other way. 'Therefore' shows a result.",
      },
      {
        id: "f3",
        type: "short",
        prompt:
          "Write one reasoning sentence that explains why this evidence supports the claim 'the school should add a bike rack': '46 of 310 students said they would ride a bike if it were safe.'",
        answer:
          "This shows that some students would ride to school, because they said a safe place for bikes would change what they do.",
        explain:
          "Look for the word 'because' or 'so' and an explanation that links the survey to the rack.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show how you can argue from a text.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt:
          "Which piece of evidence is relevant to the claim 'Our school should have a longer lunch'?",
        choices: [
          "In the survey, students said they spent 14 of their 25 lunch minutes waiting in line.",
          "The cafeteria floor was cleaned last week.",
          "Lunch is a meal that people eat in the middle of the day.",
        ],
        answer: 0,
        explain:
          "It shows how much lunch time is lost in line. The other two do not connect to the length of lunch.",
      },
      {
        id: "e2",
        type: "short",
        prompt:
          "Write two sentences: one that states an opposing idea fairly and one that rebuts it with 'however'. Choose any school question.",
        answer:
          "Some people argue that a later start would make the buses late. However, the district says the buses can run on the new schedule.",
        explain: "Look for a fair acknowledgment, the word however and a fact in the answer.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Name the three questions you ask to test a piece of evidence.",
        answer: "Is it from the text? Does it connect to the question? Is there enough of it?",
        explain: "Accept any wording that covers source, relevance and sufficiency.",
      },
    ],
    successCriteria: [
      "I tested evidence for source, relevance and enough.",
      "I explained why evidence supports a claim.",
      "I used however correctly to answer another view.",
    ],
  },
  answerKey: {
    notes:
      "Accept responses that follow the structure rather than one exact wording. For short items look for: a claim that is a position, evidence from the text with its location, a reasoning sentence that explains why (not a repeat of the evidence), and an opposing view stated fairly before it is answered. Do not penalize grammar errors that do not hide the meaning. For writing items record which of the three moves (claim, cited evidence, reasoning) is missing.",
    items: {
      g1: "The library should stay open one more hour. It is a position a person could argue against.",
      g2: "46 of 310 students said they would ride a bike if their bikes were safe. It connects to students using a rack.",
      g3: "This shows that many students want the extra hour because more than half of the students surveyed would use it. 78 is more than 60, which is half of 120.",
      g4: "Some people say it costs too much. However, the parent group will pay half of the 1,800 dollars.",
      i1: "A weekly log shows the cafeteria threw away 220 pounds of recyclable paper and plastic last month.",
      i2: "The custodian's weekly weight log.",
      i3: "The cafeteria menu has five lunch choices.",
      i4: "A survey where 96 of 120 students asked for them, plus a petition signed by 40 students.",
      i5: "Some people say recycling bins would be too much work for the custodians. However, the custodian said emptying the bins takes only ten minutes a day, so the extra work is small.",
      i6: "I claim that the school should add recycling bins in the cafeteria. The log states that 220 pounds of recyclable paper and plastic went into the trash last month (paragraph 2), which shows that a large amount of material could be recycled. Therefore, bins would reduce waste.",
      i7: "55 pounds per week. 220 divided by 4 is 55.",
      f1: "The school has 14 buses.",
      f2: "However.",
      f3: "This shows that some students would ride to school, because they said a safe place for bikes would change what they do.",
      e1: "In the survey, students said they spent 14 of their 25 lunch minutes waiting in line.",
      e2: "Some people argue that a later start would make the buses late. However, the district says the buses can run on the new schedule.",
      e3: "Is it from the text? Does it connect to the question? Is there enough of it?",
    },
  },
  extension: {
    title: "Rate the argument",
    task: "Choose a short editorial or a classmate's argument paragraph. Mark each sentence as claim, evidence, reasoning or rebuttal. Rate the evidence on the three tests (from the text, connected, enough). Write two sentences that say what the writer did well and one thing that would make the argument stronger. Use 'credible' and 'sufficient' correctly in your feedback.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo defender una afirmación con evidencia de un texto y responder a otra opinión con hechos.",
      vocab: [
        { en: "claim", es: "afirmación", verified: true },
        { en: "evidence", es: "evidencia", verified: true },
        { en: "reasoning", es: "razonamiento", verified: true },
        { en: "source", es: "fuente", verified: true },
        { en: "credible", es: "creíble", verified: true },
        { en: "relevant", es: "relevante", verified: true },
        { en: "however", es: "sin embargo", verified: true },
        { en: "therefore", es: "por lo tanto", verified: true },
      ],
      familyPrompt:
        "Hablen en casa sobre una decisión familiar, por ejemplo qué cenar el viernes. Pida a su hijo o hija que diga lo que piensa y dos razones con datos, en el idioma que prefiera.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach with the model paragraph 12. Guided items 8. Challenge pairs or the Argument Builder 15. Exit ticket 7. Close with one pair demonstrating the challenge routine, 3. If short on time, run the guided items orally and use the Language Detective activity as the next-day warm-up.",
    misconceptions: [
      "'Any true fact is evidence.' Students list facts that do not connect to the claim. Use the relevance question every time: 'Does it help answer the question?'",
      "'Evidence is the same as reasoning.' Students copy the fact and stop. Require a sentence that begins 'This shows' or 'This proves'.",
      "'A claim is a fact.' Students state something nobody would argue. Ask 'Could a reasonable person disagree?'",
      "'However' as a joiner. Students write 'The rack is good however it costs money.' Teach a full stop or semicolon before it and a comma after it.",
      "'More evidence is always better.' Students pile up weak cards. Teach 'enough' as several strong pieces from more than one source.",
    ],
    differentiation:
      "Entering and Emerging learners work with the highlighted source text, color-code claim and evidence cards, rehearse the challenge routine orally with the frames and write one cited sentence. Developing learners write a claim, one piece of evidence and a reasoning sentence. Expanding learners add a counterclaim and a rebuttal. Bridging learners also evaluate the credibility of each source and vary hedging language. The sources, the question and the quality bar for evidence are the same in every tier.",
    languageNotes:
      "Teach 'however' and 'therefore' as signals with a gesture: a hand sliding back for however, a hand moving forward for therefore. Contrast 'because' (reason first inside a sentence) with 'therefore' (result after a reason). Spanish cognates help for evidence (evidencia), relevant (relevante) and source (fuente); invite students to use them for planning. Watch the false friend 'actually', which does not mean 'actualmente'.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
