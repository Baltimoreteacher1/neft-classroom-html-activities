// Lesson pack: Evaluate an Argument (grade 7 ELA). Original arguments, items and answers; every school, survey and figure is imagined for practice.
const rect = (x, y, w, h, fill = "paper", stroke = "navy") => ({
  t: "rect",
  x,
  y,
  w,
  h,
  rx: 10,
  fill,
  stroke,
  sw: 2.5,
});
const txt = (x, y, text, size = 13) => ({
  t: "text",
  x,
  y,
  text,
  size,
  fill: "ink",
  weight: 700,
  anchor: "middle",
});
const wrap = (s, w, size) => {
  if (s.includes("\n")) return s;
  const max = Math.max(6, Math.floor((w - 14) / (size * 0.6)));
  const out = [];
  let cur = "";
  for (const word of s.split(" ")) {
    if (cur && `${cur} ${word}`.length > max) {
      out.push(cur);
      cur = word;
    } else cur = cur ? `${cur} ${word}` : word;
  }
  out.push(cur);
  return out.join("\n");
};
const box = (x, y, w, h, text, fill = "paper", size = 13) => [
  rect(x, y, w, h, fill),
  txt(x + w / 2, y + h / 2, wrap(text, w, size), size),
];
const line = (x1, y1, x2, y2) => ({ t: "line", x1, y1, x2, y2, stroke: "ink", strokeWidth: 2.5 });
const right = (x, y) => ({
  t: "poly",
  fill: "ink",
  points: [
    [x, y],
    [x - 12, y - 7],
    [x - 12, y + 7],
  ],
});

const GARDEN =
  "Argument: Our school should add a student garden. Last spring, a garden at Riverside Middle School grew enough vegetables to supply its cafeteria for a month. My aunt says gardening is relaxing. The school already has a large empty lot behind the gym. Some people say a garden would be too much work, but a club of 15 volunteers has signed up to share the tasks.";
const BIKE =
  "Argument: Our school should install more bike racks. Right now 18 students bike to school each day, and the only rack holds 6 bikes. A city report says that schools with bike racks see more students riding. My cousin loves biking. Some people worry that racks would use up parking spaces, but they would fit in the unused strip beside the gym.";
const DRINK =
  "Argument: Everyone should drink FizzUp. Everybody at my school drinks it. A famous athlete drinks it every day. It comes in six flavors. People who do not like it just have not tried it.";

const launchVisual = {
  kind: "table",
  alt: "A table comparing two arguments for the same claim, that the school should add a quiet study room. Argument A says everybody knows a quiet room would help and my friend wants one. Argument B says a survey of 120 students found 78 would use it weekly and the librarian reports that students ask for quiet space.",
  w: 480,
  h: 220,
  head: ["Argument A", "Argument B"],
  rows: [
    [
      "Everybody knows a quiet room would help.",
      "In a survey of 120 students, 78 said they would use it weekly.",
    ],
    [
      "My friend really wants one.",
      "The librarian reports that students ask for a quiet place to work.",
    ],
  ],
};

const evalFlow = {
  kind: "shapes",
  alt: "A four-step flow for evaluating an argument: find the claim, check the evidence for relevance, sufficiency and credibility, check the reasoning that connects them, then decide how convincing the argument is.",
  w: 480,
  h: 220,
  items: [
    ...box(8, 60, 104, 100, "1. Find the claim", "sky"),
    ...box(126, 60, 104, 100, "2. Check evidence: relevant? enough? credible?", "copper-soft", 11),
    ...box(244, 60, 104, 100, "3. Check the reasoning", "copper-soft"),
    ...box(362, 60, 110, 100, "4. Decide how convincing", "teal-soft"),
    line(112, 110, 122, 110),
    right(126, 110),
    line(230, 110, 240, 110),
    right(244, 110),
    line(348, 110, 358, 110),
    right(362, 110),
  ],
};

// Move each right choice to a varied position so the answer is not always first (answer index is updated).
const POS = [1, 2, 0, 3, 2, 1, 0];
const spreadItems = (items, offset = 0) =>
  items.forEach((it, i) => {
    if (!it.choices) return;
    const right = it.choices[it.answer];
    const rest = it.choices.filter((_, j) => j !== it.answer);
    const pos = POS[(i + offset) % POS.length] % (rest.length + 1);
    rest.splice(pos, 0, right);
    it.choices = rest;
    it.answer = pos;
  });
const spread = (d) => {
  spreadItems(d.guided, 0);
  spreadItems(d.independent.items, 1);
  spreadItems(d.formative.items, 2);
  spreadItems(d.exitTicket.items, 4);
  return d;
};

const DATA = {
  id: "g7-ela-evaluate-an-argument",
  kind: "lesson",
  title: "Evaluate an Argument",
  subtitle: "Judge whether a writer's reasons and evidence are relevant, sufficient and credible",
  grade: "7",
  band: "6-8",
  subject: "ela",
  duration: 55,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.7.8, RI.7.1, W.7.1 and SL.7.1; not mapped to a district unit sequence. All arguments, schools, surveys and figures are original and imagined for practice.",
  },
  standards: ["RI.7.8", "RI.7.1", "W.7.1", "SL.7.1"],
  wida: {
    eld: ["ELD-LA"],
    klus: ["Argue", "Explain"],
    domains: ["Reading", "Speaking", "Writing"],
    cluster: "6-8",
  },
  contentObjective:
    "I can evaluate an argument in a text by judging whether its reasons and evidence are relevant, sufficient and credible.",
  languageObjective:
    "I can evaluate an argument by saying 'This evidence is relevant (or not sufficient) because ___' and balance my judgment with 'Although ___, ___'.",
  languageDemands: {
    functions: [
      "identify a claim and its support",
      "judge the quality of evidence",
      "acknowledge a strength and a weakness in one statement",
    ],
    structures: [
      "The claim is that ___. The writer supports it with ___.",
      "This evidence is relevant / not sufficient / credible because ___.",
      "Although ___, ___ weakens the argument because ___.",
    ],
    discourse:
      "Partner critique with a restate, a strength, a question, a weakness and a suggested fix, followed by a written evaluation paragraph.",
    barriers: [
      "'claim' also means 'to say something belongs to you' and 'evidence' is uncountable ('a piece of evidence')",
      "'relevant' and 'sufficient' are Latin-based adjectives with no everyday synonym of the same precision",
      "'argue' means to give reasons in class but to quarrel in everyday talk",
      "concession structures such as 'Although ___, ___' and 'Even so, ___' reverse the direction of a sentence",
      "'biased', 'weak' and 'wrong' are easy to confuse when judging evidence",
    ],
    oralRehearse: [
      "The claim is that the school should add a garden, and the writer supports it with a result from another school.",
      "Although the story about the aunt is true, it is not sufficient because it describes one person.",
    ],
    writeScaffold:
      "The writer claims ___. The strongest evidence is ___ because ___. Although ___, ___ is weak because ___. Overall the argument is ___.",
  },
  vocab: {
    collection: "g7-ela-evaluate-an-argument",
    ids: [
      "claim",
      "reason",
      "evidence",
      "relevant",
      "sufficient",
      "credible",
      "anecdote",
      "counterclaim",
      "rebuttal",
      "bias",
      "hasty-generalization",
      "evaluate",
    ],
  },
  launch: {
    title: "Notice and Wonder: two arguments, one claim",
    visual: launchVisual,
    prompts: [
      "What do you notice about the two arguments?",
      "What do you wonder about how each writer knows what they say?",
      "Which argument would you trust more if you had to decide, and what is your reason?",
    ],
    teacherNote:
      "Show the table without telling students which is stronger. Take two noticings and one wondering. Ask students to give a reason for trusting one argument, and record every reason on the board. Group the reasons afterward: reasons that point to what the writer provides (counts, a named source) are criteria; reasons that point to how students feel (I like the first one) are preferences. Name the criteria and use them for the rest of the lesson.",
  },
  teach: {
    model: [
      "An argument has a claim, reasons that explain why the claim is true, and evidence that shows the reasons are true. To evaluate an argument is to judge how well the reasons and evidence support the claim. You do not judge whether you agree with it.",
      "Test each piece of evidence with three questions. Is it relevant, meaning directly connected to the claim? Is it sufficient, meaning enough of it, from enough sources, to support the claim? Is it credible, meaning does the source know the topic, state how it knows and give something a reader can check?",
      "Some evidence looks strong but is not. An anecdote is a story about one case, so it cannot show a pattern. A hasty generalization draws a conclusion about a whole group from too few examples. Appeals to what 'everybody knows' give nothing to check. A true sentence about a different subject, like cafeteria food in an argument about recess, is irrelevant.",
      "A strong argument also faces the other side. A counterclaim is a fair opposing view. A rebuttal acknowledges it and answers it with evidence. A writer who ignores the counterclaim, or who attacks the people who hold it, weakens the argument.",
      "Finish an evaluation by balancing strengths and weaknesses. 'Although the survey is strong, the writer relies on one story, so the argument is partly convincing.' That judgment names the criteria and the evidence behind them.",
    ],
    moves: [
      "Annotate one argument together in three colors: claim, evidence and reasoning. Make students state the claim in their own words before they judge anything.",
      "Teach the three tests (relevant, sufficient, credible) as a stamp students write beside each piece of evidence.",
      "Show a true but irrelevant sentence and a relevant but weak sentence side by side so students see that 'true' and 'strong' are different.",
      "Require students to name the criterion in every judgment: 'weak because only one case' is acceptable; 'weak' alone is not.",
      "Model a balanced sentence with 'although' and have students produce two before they write a paragraph.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt: `${GARDEN}\n\nWhich sentence states the claim?`,
      choices: [
        "Our school should add a student garden.",
        "My aunt says gardening is relaxing.",
        "The school already has a large empty lot behind the gym.",
        "A club of 15 volunteers has signed up to share the tasks.",
      ],
      answer: 0,
      hint: "The claim is the position the writer wants readers to accept. Look for the sentence that says what should happen.",
      supports: {
        ee: {
          frames: ["The claim is that ___ should ___."],
          wordBank: ["claim", "should", "position"],
          oral: "Say what the writer wants the school to do.",
        },
        dev: {
          frames: ["The writer's position is that ___, and this is the claim because ___."],
          wordBank: ["position", "recommend"],
        },
        exp: { frames: ["The claim is stated in the ___ sentence, and every other sentence ___."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "choice",
      prompt: "Which sentence is the strongest evidence for the claim?",
      choices: [
        "My aunt says gardening is relaxing.",
        "Last spring, a garden at Riverside Middle School grew enough vegetables to supply its cafeteria for a month.",
        "The school already has a large empty lot behind the gym.",
        "Some people say a garden would be too much work.",
      ],
      answer: 1,
      hint: "Strong evidence is specific, checkable and connected to a reason for the claim.",
      supports: {
        ee: {
          frames: ["The strongest sentence tells what ___ grew."],
          wordBank: ["specific", "result", "checkable"],
        },
        dev: {
          frames: ["This evidence is strong because it is ___ and ___."],
          wordBank: ["specific", "relevant"],
        },
        exp: { frames: ["The other choices are weaker because ___ does not show ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "short",
      prompt:
        "Explain why 'My aunt says gardening is relaxing' is weak evidence. Use the word relevant or sufficient.",
      answer:
        "It is one person's opinion, so it is not sufficient, and relaxation is not relevant to whether the school should add a garden.",
      hint: "Ask how many people the sentence describes and whether the claim is about how people feel.",
      supports: {
        ee: {
          frames: ["It is weak because it is only ___ person."],
          wordBank: ["one", "opinion", "not enough"],
        },
        dev: {
          frames: ["It is not sufficient because ___, and it is not relevant because ___."],
          wordBank: ["sufficient", "relevant"],
        },
        exp: {
          frames: ["Although the statement may be true, it fails the test of ___ because ___."],
        },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt: "Which sentence answers a counterclaim?",
      choices: [
        "Last spring, a garden at Riverside Middle School grew enough vegetables to supply its cafeteria for a month.",
        "Our school should add a student garden.",
        "Some people say a garden would be too much work, but a club of 15 volunteers has signed up to share the tasks.",
        "My aunt says gardening is relaxing.",
      ],
      answer: 2,
      hint: "A rebuttal names the other side and then answers it with a reason or a fact.",
      supports: {
        ee: {
          frames: ["Some people say ___. But ___."],
          wordBank: ["but", "some people", "answer"],
        },
        dev: {
          frames: ["The writer acknowledges ___ and then answers with ___."],
          wordBank: ["acknowledge", "rebuttal"],
        },
        exp: { frames: ["The rebuttal works because it ___ before it ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Evidence court: rank the proof",
    task: "Claim: Our school should start thirty minutes later. Partners receive three evidence cards. Card 1: 'My friend Dani falls asleep in first period.' Card 2: 'A survey of 90 students in our grade found that 61 sleep less than eight hours on school nights.' Card 3: 'The cafeteria pizza is the best lunch on the menu.' Partners rank the cards from strongest to weakest, then write one sentence for each card that names a test (relevant, sufficient or credible) and says whether the card passes or fails. Then they write one 'although' sentence that balances a strength and a weakness.",
    roles: ["Judge", "Recorder"],
    discussionCards: [
      {
        prompt: "Which card is not relevant, and how do you know?",
        frame: "Card ___ is not relevant because the claim is about ___ and the card is about ___.",
      },
      {
        prompt: "Why is the story card not sufficient even if it is true?",
        frame: "It is not sufficient because it shows ___, not a ___.",
      },
      {
        prompt: "What other evidence would make the strongest card stronger?",
        frame: "The survey would be stronger if ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the four steps of an evaluation",
      visualOrModel: evalFlow,
      teacherNote:
        "Project the flow and annotate the bike rack argument with it live. Stop at step two and ask three students to name the test each piece of evidence passes or fails. At step four, model the 'although' sentence aloud.",
    },
    discuss: {
      title: "Say it: a fair critique",
      structure:
        "Turn and talk. Partner 1 restates the claim and names one strength. Partner 2 asks one question about the evidence. Partner 1 names one weakness with a test. Partner 2 suggests a fix. Swap.",
      frames: [
        "So the claim is that ___.",
        "One strength is ___ because ___.",
        "When you say ___, what is your evidence?",
        "Although ___, ___ is weak because it is not ___.",
      ],
    },
    apply: {
      title: "Use it: evaluate an advertisement",
      task: `${DRINK}\n\nWrite a short evaluation paragraph: state the claim, name one piece of evidence that fails a test and say which test it fails and why, say whether the argument faces a counterclaim, and give an overall judgment using 'although'.`,
      successCriteria: [
        "I stated the claim in my own words.",
        "I named at least one piece of evidence and the test it fails (relevant, sufficient or credible).",
        "I used because to explain each judgment.",
        "I used although to balance a strength and a weakness, or explained why there is no strength.",
      ],
    },
  },
  activities: [
    { engine: "argument-builder", id: "g7-ela-library-lunch-argument" },
    { engine: "language-detective", id: "g7-ela-recess-editorial-detective" },
    { engine: "conversation-studio", id: "g7-ela-argument-feedback-conversation" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "choice",
        prompt: `${BIKE}\n\nWhich sentence states the claim?`,
        choices: [
          "Our school should install more bike racks.",
          "Right now 18 students bike to school each day.",
          "My cousin loves biking.",
          "The racks would fit in the unused strip beside the gym.",
        ],
        answer: 0,
        explain:
          "The claim says what the writer wants. The other sentences are evidence, an anecdote or part of the rebuttal.",
      },
      {
        id: "i2",
        type: "choice",
        prompt: "Which piece of evidence is the most specific and checkable?",
        choices: [
          "Right now 18 students bike to school each day, and the only rack holds 6 bikes.",
          "Biking is good for people.",
          "My cousin loves biking.",
          "Everybody wants more racks.",
        ],
        answer: 0,
        explain:
          "It gives numbers a reader could check against the school's own count. The others are general or personal.",
      },
      {
        id: "i3",
        type: "choice",
        prompt: "Which sentence is not relevant to the claim?",
        choices: [
          "A city report says that schools with bike racks see more students riding.",
          "My cousin loves biking.",
          "The only rack holds 6 bikes.",
          "The racks would fit beside the gym.",
        ],
        answer: 1,
        explain:
          "How much the writer's cousin likes biking does not show that the school needs more racks.",
      },
      {
        id: "i4",
        type: "choice",
        prompt: "Which sentence is the writer's rebuttal to a counterclaim?",
        choices: [
          "Some people worry that racks would use up parking spaces, but they would fit in the unused strip beside the gym.",
          "A city report says that schools with bike racks see more students riding.",
          "Our school should install more bike racks.",
          "My cousin loves biking.",
        ],
        answer: 0,
        explain:
          "It states the worry and then answers it with a fact about where the racks would go.",
      },
      {
        id: "i5",
        type: "choice",
        prompt:
          "A student asks three friends about a later bell and writes: 'All students want a later bell.' What is wrong with the reasoning?",
        choices: [
          "Three friends are too few to say what all students want.",
          "The friends were not polite.",
          "Surveys are never allowed in arguments.",
          "A later bell is not an important topic.",
        ],
        answer: 0,
        explain:
          "A conclusion about all students needs a much larger and more varied sample. This is a hasty generalization.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "Is the evidence in the bike rack argument sufficient to support the claim? Answer in two sentences and name the strongest and weakest piece of evidence.",
        answer:
          "The evidence is partly sufficient. The strongest piece is the count of 18 bikes and one rack that holds 6, and the weakest is that the writer's cousin loves biking, which is a single personal statement.",
        explain:
          "Accept any judgment that names a strongest and weakest piece and gives a reason tied to a test.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "A writer says 'Everybody knows this is true.' Explain why this is not evidence and what you would ask for instead.",
        answer:
          "It gives nothing a reader can check. I would ask for a specific fact, count or source that shows it is true.",
        explain: "Look for the idea that evidence must be specific and checkable.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "choice",
        prompt: `${DRINK}\n\nWhich sentence is a hasty generalization?`,
        choices: [
          "Everybody at my school drinks it.",
          "It comes in six flavors.",
          "A famous athlete drinks it every day.",
          "Everyone should drink FizzUp.",
        ],
        answer: 0,
        explain:
          "The writer claims everybody drinks it without any count, which draws a broad conclusion from no real sample.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which sentence explains why 'It comes in six flavors' is weak evidence for the claim that everyone should drink FizzUp?",
        choices: [
          "It is not relevant, because the number of flavors does not show the drink is good for people.",
          "It is not credible, because the writer made up the flavors.",
          "It is not sufficient, because six is too small a number.",
          "It is strong, because it is a specific number.",
        ],
        answer: 0,
        explain: "A specific number is not enough. The fact has to connect to the claim, and flavors say nothing about whether people should drink it.",
      },
      {
        id: "f3",
        type: "short",
        prompt:
          "The writer says people who do not like FizzUp just have not tried it. Explain how this handles the other side.",
        answer:
          "It dismisses the other side instead of answering it, so it is not a real rebuttal.",
        explain:
          "A rebuttal answers an opposing view with a reason or evidence. This sentence only insults it.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show that you can evaluate evidence and balance your judgment.",
    items: [
      {
        id: "e1",
        type: "choice",
        prompt:
          "A writer argues that the library should open on Saturdays. Which evidence is the strongest?",
        choices: [
          "A log shows an average of 42 visitors on the four Saturdays the library was open during a trial.",
          "My neighbor thinks Saturdays are boring.",
          "Libraries are wonderful places.",
          "Everybody knows Saturday is the best day.",
        ],
        answer: 0,
        explain: "It is specific, measured and directly about library use on Saturdays.",
      },
      {
        id: "e2",
        type: "short",
        prompt:
          "Write one sentence that uses 'although' to balance a strength and a weakness of an argument that has a good survey but relies on one anecdote.",
        answer:
          "Although the survey gives strong evidence, the writer also relies on one story, which is not enough to prove a pattern.",
        explain: "Look for a strength, a weakness and a reason, joined by although.",
      },
      {
        id: "e3",
        type: "choice",
        prompt: "Which response is evaluating the argument, not just reacting to it?",
        choices: [
          "I disagree because I do not like the topic.",
          "The claim is clear, but the only evidence is one friend's story, so it is not sufficient.",
          "It is boring.",
          "I agree with everything the writer says.",
        ],
        answer: 1,
        explain:
          "It names the claim, the evidence and the test it fails. The others judge by feeling or agreement.",
      },
    ],
    successCriteria: [
      "I judged evidence with a named test (relevant, sufficient or credible).",
      "I gave a reason with because for each judgment.",
      "I balanced a strength and a weakness with although.",
    ],
  },
  answerKey: {
    notes:
      "For short responses accept any wording that names the test (relevant, sufficient or credible), gives a reason with because, and refers to the evidence in the text. Do not mark down a student for agreeing or disagreeing with the claim; mark the quality of the evaluation.",
    items: {
      g1: "Our school should add a student garden.",
      g2: "Last spring, a garden at Riverside Middle School grew enough vegetables to supply its cafeteria for a month.",
      g3: "It is one person's opinion, so it is not sufficient, and relaxation is not relevant to whether the school should add a garden.",
      g4: "Some people say a garden would be too much work, but a club of 15 volunteers has signed up to share the tasks.",
      i1: "Our school should install more bike racks.",
      i2: "Right now 18 students bike to school each day, and the only rack holds 6 bikes.",
      i3: "My cousin loves biking.",
      i4: "Some people worry that racks would use up parking spaces, but they would fit in the unused strip beside the gym.",
      i5: "Three friends are too few to say what all students want.",
      i6: "Sample: The evidence is partly sufficient. The count of 18 bikes and one rack for 6 is strongest. The cousin statement is weakest because it is one personal statement.",
      i7: "It gives nothing to check. Ask for a specific fact, count or source.",
      f1: "Everybody at my school drinks it.",
      f2: "Relevant. The number of flavors does not show the drink is good for people.",
      f3: "It dismisses the other side instead of answering it, so it is not a real rebuttal.",
      e1: "A log shows an average of 42 visitors on the four Saturdays the library was open during a trial.",
      e2: "Sample: Although the survey gives strong evidence, the writer also relies on one story, which is not enough to prove a pattern.",
      e3: "The claim is clear, but the only evidence is one friend's story, so it is not sufficient.",
    },
  },
  extension: {
    title: "Find the argument behind the ad",
    task: "Choose an advertisement or product review you have seen. Write its claim, list each piece of evidence it uses, and mark each as relevant or not, sufficient or not, and credible or not. Write a final judgment using 'although' and recommend one change that would make the argument fairer to its audience.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo evaluar un argumento juzgando si sus razones y su evidencia son relevantes, suficientes y creíbles.",
      vocab: [
        { en: "claim", es: "afirmación", verified: false },
        { en: "evidence", es: "evidencia", verified: false },
        { en: "relevant", es: "relevante", verified: false },
        { en: "counterclaim", es: "contraargumento", verified: false },
        { en: "evaluate", es: "evaluar", verified: false },
      ],
      familyPrompt:
        "Escuchen un anuncio o una opinión en casa. Digan cuál es la afirmación y busquen una prueba que se pueda comprobar y otra que no.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 6 minutes. Teach and guided practice 16. Partner task or activities 22 (run the argument builder first, then the language detective; the feedback conversation is best as a second session). Exit ticket 7. Closing share 4. If time is short, use the detective activity alone and assign the argument builder next day.",
    misconceptions: [
      "Agreeing equals strong: students rate an argument by whether they agree. Have them evaluate a claim they like and one they dislike with the same three tests.",
      "True equals relevant: students accept any true fact. Show a true sentence about a different subject and ask what it proves about the claim.",
      "Anecdote as the best proof: vivid stories feel convincing. Ask 'how many people does this describe?'",
      "More equals better: students count sentences instead of weighing quality. Ask which single piece of evidence they would keep if they could keep only one.",
      "Any opinion is bias: students call every argument biased. Separate having a position from leaving out or twisting facts.",
    ],
    differentiation:
      "Entering and Emerging learners use the frames, word banks and oral rehearsal in each item and evaluate the same arguments with the same criteria as every other tier. Expanding and Bridging learners write the balanced 'although' judgment and suggest a revision. Do not shorten the arguments or remove the criteria; reduce only the language load.",
    languageNotes:
      "Teach 'relevant', 'sufficient' and 'credible' with a gesture and a stamp for each. Contrast 'argue' in class (give reasons) with 'argue' at home (quarrel). Practice concession sentences orally with 'although' and 'even so' before students write them.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

export default spread(DATA);
