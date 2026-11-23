// language-detective: evaluate an editorial's evidence and reasoning, then decide how convincing it is (RI.7.8, RI.7.1).
const V = "g7-ela-evaluate-an-argument";
const S = (ee, dev, exp) => ({ ee, dev, exp, br: {} });
const sent = (id, text, para) => ({ id, text, para });

// The engine shows options in authored order, so move the right option to a varied position (ids stay the same).
const POS = [1, 2, 0, 2, 0, 1];
const place = (options, answer, pos) => {
  const hit = options.find((o) => o.id === answer);
  const rest = options.filter((o) => o.id !== answer);
  rest.splice(Math.min(pos, rest.length), 0, hit);
  return rest;
};
const spread = (a) => {
  a.questions.forEach((q, i) => {
    if (q.options) q.options = place(q.options, q.answer, POS[i % POS.length]);
    if (q.transfer) q.transfer.options = place(q.transfer.options, q.transfer.answer, POS[(i + 3) % POS.length]);
  });
  return a;
};

const DATA = {
  id: "g7-ela-recess-editorial-detective",
  engine: "language-detective",
  title: "Case file: how strong is the recess editorial?",
  grade: "7",
  band: "6-8",
  subject: "ela",
  lessonId: "g7-ela-evaluate-an-argument",
  standards: ["RI.7.8", "RI.7.1"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.7.8 and RI.7.1; not mapped to a district unit sequence. The editorial and the school it mentions are imagined for practice.",
  },
  vocabIds: [
    `${V}:evidence`,
    `${V}:relevant`,
    `${V}:sufficient`,
    `${V}:anecdote`,
    `${V}:rebuttal`,
    `${V}:evaluate`,
  ],
  minutes: 22,
  intro:
    "Read a student editorial like a detective. Find the claim, tap the evidence that is strong and the evidence that is weak or off topic, and then decide how convincing the whole argument is.",
  scene: {
    kind: "passage",
    title: "A Real Recess for Middle School",
    source: "Original - The Language Page",
    caption:
      "An original student editorial written for this activity. The school and its figures are imagined.",
    sentences: [
      sent(
        "s1",
        "Middle school students spend most of the day seated indoors, and many of them never get a real break from sitting.",
        0,
      ),
      sent(
        "s2",
        "That needs to change, and our school should add a twenty-minute recess every day.",
        0,
      ),
      sent("s3", "First, a break helps students concentrate.", 1),
      sent(
        "s4",
        "In a trial at Maple Grove Middle School, teachers recorded that students needed fewer reminders to stay on task in the hour after recess.",
        1,
      ),
      sent("s5", "Second, movement supports health.", 1),
      sent(
        "s6",
        "A survey of 200 students at the same school found that 140 of them felt more alert after a break with movement.",
        1,
      ),
      sent("s7", "My cousin's school added recess last year, and his grades went up.", 2),
      sent("s8", "Everybody knows kids focus better after they play.", 2),
      sent("s9", "Besides, the cafeteria food at our school is terrible.", 2),
      sent("s10", "Some people worry that recess takes time away from classes.", 3),
      sent(
        "s11",
        "That concern is fair, but in the Maple Grove trial the teachers reported covering the same lessons as before, because students worked more efficiently after the break.",
        3,
      ),
      sent(
        "s12",
        "Our school could make room by shortening the announcements and the two longest passing periods by a few minutes each.",
        3,
      ),
      sent("s13", "A daily recess is a small change with clear benefits.", 4),
      sent("s14", "Our school should add it next semester.", 4),
    ],
  },
  questions: [
    {
      id: "q1",
      type: "detail",
      prompt: "What does the writer want the school to do?",
      options: [
        { id: "a", text: "Add a twenty-minute recess every day." },
        { id: "b", text: "Shorten the school day by twenty minutes." },
        { id: "c", text: "Replace the cafeteria menu." },
      ],
      answer: "a",
      evidence: [
        {
          id: "s2",
          why: "It states the claim directly with the words our school should add.",
          optional: false,
        },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "mixed-details",
          hint: "The twenty minutes in the text belongs to something the writer wants to add. Check what that something is.",
        },
        {
          pick: "c",
          tag: "off-topic-detail",
          hint: "The cafeteria is mentioned, but not as the thing the writer wants to change. Look for the sentence with the recommendation.",
        },
        {
          pick: "s1",
          tag: "background-not-claim",
          hint: "That sentence describes a problem. It does not say what the writer wants done about it.",
        },
      ],
      hints: [
        "Look near the start of the editorial for the sentence that says what should change.",
        "The writer uses a word that signals a recommendation.",
        "The sentence also names how often and for how long.",
      ],
      model:
        "Think-aloud: the editorial opens with a problem, then the second sentence says our school should add something. A recommendation like that is the claim.",
      explain: "Right: the second sentence states the claim, a daily twenty-minute recess.",
      transfer: {
        prompt:
          "A different editorial begins: Our town pool closes too early. The council should keep it open until 9 p.m. in summer. What does the writer want?",
        options: [
          { id: "a", text: "The pool open until 9 p.m. in summer" },
          { id: "b", text: "A new pool built" },
          { id: "c", text: "The pool closed in summer" },
        ],
        answer: "a",
        explain: "The word should signals the recommendation, which is the claim.",
      },
      supports: S(
        {
          frames: ["The writer wants the school to ___."],
          wordBank: ["claim", "should", "recess"],
        },
        { frames: ["The claim is that ___ should ___."] },
        { frames: ["The writer's recommendation, stated in ___, is that ___."] },
      ),
    },
    {
      id: "q2",
      type: "evidence",
      prompt: "Tap the two sentences that give measured evidence for the writer's reasons.",
      answer: ["s4", "s6"],
      evidence: [
        { id: "s4", why: "It reports what teachers recorded in a trial.", optional: false },
        { id: "s6", why: "It reports a survey count that can be checked.", optional: false },
      ],
      misconceptions: [
        {
          pick: "s7",
          tag: "anecdote-as-evidence",
          hint: "That sentence tells one personal story. Ask whether one case could stand for a whole school.",
        },
        {
          pick: "s8",
          tag: "appeal-to-everybody",
          hint: "That sentence says everyone agrees but gives nothing a reader could check.",
        },
        {
          pick: "s3",
          tag: "reason-not-evidence",
          hint: "That sentence states a reason. Evidence is what shows the reason is true.",
        },
      ],
      hints: [
        "Evidence can be checked. Look for sentences that name who counted or recorded something.",
        "One reports a trial and one reports a survey.",
        "Both sentences mention the same school and include a specific result.",
      ],
      model:
        "Think-aloud: a measured result names who recorded it and what they found. The trial sentence and the survey sentence each do that, so they are the evidence.",
      explain:
        "Right: the trial record and the survey count are specific results a reader could check.",
      transfer: {
        prompt:
          "A passage says: A librarian counted 40 visitors on Monday. My neighbor says the library is always busy. Which sentence is measured evidence?",
        options: [
          { id: "a", text: "A librarian counted 40 visitors on Monday." },
          { id: "b", text: "My neighbor says the library is always busy." },
          { id: "c", text: "The library is a great place." },
        ],
        answer: "a",
        explain:
          "The count names who measured and what the number was. The other sentences are reports or opinions.",
      },
      supports: S(
        {
          frames: ["The evidence tells who ___ and what they ___."],
          wordBank: ["survey", "trial", "recorded", "checked"],
        },
        { frames: ["These sentences are evidence because a reader could ___."] },
        { frames: ["Both sentences provide verifiable ___, which makes them strong evidence."] },
      ),
    },
    {
      id: "q3",
      type: "inference",
      prompt: "Why is the story about the writer's cousin weaker evidence than the survey?",
      options: [
        {
          id: "a",
          text: "It describes one person's experience, which cannot show a pattern for a whole school.",
        },
        { id: "b", text: "Stories are never allowed as evidence in an argument." },
        {
          id: "c",
          text: "It is about a different school, and evidence must come from the writer's school.",
        },
      ],
      answer: "a",
      evidence: [
        { id: "s7", why: "It is a single case from one student.", optional: false },
        {
          id: "s6",
          why: "The survey reports on 200 students, so it shows a pattern.",
          optional: false,
        },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "absolute-rule",
          hint: "A story can illustrate a point. The question is about what it can prove on its own.",
        },
        {
          pick: "c",
          tag: "wrong-criterion",
          hint: "Check where the trial and the survey took place. Does the writer's own school appear in them?",
        },
      ],
      hints: [
        "Compare how many people each sentence describes.",
        "Ask whether one case can tell you what is true for everyone.",
        "Think about what a survey of many students can show that a single story cannot.",
      ],
      model:
        "Think-aloud: the cousin sentence describes one person, and the survey sentence describes 200. A pattern needs many cases, so the survey carries more weight.",
      explain:
        "Right: one story shows one case, while a survey of many students can show a pattern.",
      transfer: {
        prompt:
          "Which is stronger evidence that a new bike lane helped? A neighbor says traffic seems calmer, or a city count shows 30 percent more riders after the lane opened.",
        options: [
          { id: "a", text: "The city count, because it measures many riders." },
          { id: "b", text: "The neighbor, because people know their street best." },
          { id: "c", text: "Both are equally strong." },
        ],
        answer: "a",
        explain:
          "A count of many riders can show a pattern. One neighbor's impression is a single case.",
      },
      supports: S(
        {
          frames: ["The story is about ___ person. The survey is about ___ students."],
          wordBank: ["one", "many", "pattern", "case"],
        },
        {
          frames: ["One case cannot show ___, but a survey can show ___."],
          wordBank: ["pattern", "sample"],
        },
        { frames: ["An anecdote is insufficient because ___."] },
      ),
    },
    {
      id: "q4",
      type: "evidence",
      prompt: "Tap the one sentence that changes the subject and is not about the claim at all.",
      answer: ["s9"],
      evidence: [
        {
          id: "s9",
          why: "It complains about the cafeteria, which has nothing to do with recess.",
          optional: false,
        },
      ],
      misconceptions: [
        {
          pick: "s8",
          tag: "weak-not-irrelevant",
          hint: "That sentence is weak, but it is at least about recess and focus. Look for one about a different subject.",
        },
        {
          pick: "s7",
          tag: "anecdote-is-on-topic",
          hint: "That story is about recess, so it is on topic even though it is weak.",
        },
        {
          pick: "s1",
          tag: "background-is-on-topic",
          hint: "That sentence sets up the problem that recess would address. It belongs to the argument.",
        },
      ],
      hints: [
        "Look for a sentence that would sound strange if you removed the word recess from the paragraph around it.",
        "It is in the paragraph that mostly contains weaker supports.",
        "It begins with a word that adds a new topic instead of building on the last one.",
      ],
      model:
        "Think-aloud: each sentence in the paragraph is about recess and learning except one that starts with Besides and moves to food. That one does not connect to the claim.",
      explain:
        "Right: the cafeteria sentence may be true but it is irrelevant to a claim about recess.",
      transfer: {
        prompt:
          "In an editorial arguing that the school should add a bike rack, which sentence is irrelevant?",
        options: [
          { id: "a", text: "The gym floor was refinished last spring." },
          { id: "b", text: "Ten students already bike to school." },
          { id: "c", text: "Bikes take up less room than cars." },
        ],
        answer: "a",
        explain: "The gym floor has nothing to do with bike racks. The others connect to biking.",
      },
      supports: S(
        {
          frames: ["This sentence is about ___. The claim is about ___."],
          wordBank: ["off topic", "irrelevant", "connected"],
        },
        { frames: ["The sentence is not relevant because it ___."] },
        { frames: ["Although the statement may be true, it does not bear on ___."] },
      ),
    },
    {
      id: "q5",
      type: "inference",
      prompt: "How does the writer answer the worry that recess takes time away from classes?",
      options: [
        {
          id: "a",
          text: "By admitting the concern is fair, citing trial results and suggesting where to find the time.",
        },
        { id: "b", text: "By ignoring the worry and repeating the claim." },
        { id: "c", text: "By saying people who worry do not care about students." },
      ],
      answer: "a",
      evidence: [
        { id: "s10", why: "It states the opposing view fairly.", optional: false },
        { id: "s11", why: "It answers with trial evidence.", optional: false },
        { id: "s12", why: "It suggests a practical way to make room.", optional: true },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "ignores-counterclaim",
          hint: "Look at the last paragraph again. Does the writer mention the worry at all?",
        },
        {
          pick: "c",
          tag: "attacks-person",
          hint: "Check for any sentence that criticizes the people who worry. Does the writer attack them or answer them?",
        },
      ],
      hints: [
        "Find the paragraph that begins with someone else's opinion.",
        "Notice how the second sentence of that paragraph begins and what it admits before it answers.",
        "Look for the sentence that gives a result from the trial and the one that offers a way to find time.",
      ],
      model:
        "Think-aloud: the paragraph names the opposing worry, calls it fair, answers it with trial results and then offers a plan. Naming and answering the other side is a rebuttal.",
      explain:
        "Right: the writer states the opposing view fairly, answers it with evidence and offers a practical plan.",
      transfer: {
        prompt:
          "A writer says: Some say uniforms limit self-expression. That is true, but a school survey found students spent less time on clothing worries. How does the writer respond?",
        options: [
          { id: "a", text: "By acknowledging the objection and answering it with evidence." },
          { id: "b", text: "By ignoring the objection." },
          { id: "c", text: "By insulting people who disagree." },
        ],
        answer: "a",
        explain: "The writer names the objection fairly and then responds with a survey result.",
      },
      supports: S(
        {
          frames: ["The writer says the worry is ___. Then the writer gives ___."],
          wordBank: ["worry", "fair", "answer"],
        },
        {
          frames: ["The writer answers the opposing view by ___ and then ___."],
          wordBank: ["acknowledge", "rebuttal"],
        },
        { frames: ["By conceding ___ before offering ___, the writer strengthens the argument."] },
      ),
    },
    {
      id: "q6",
      type: "inference",
      prompt: "What is a limitation of the writer's measured evidence?",
      options: [
        {
          id: "a",
          text: "Both the trial and the survey come from one school, so the results may not hold for every school.",
        },
        { id: "b", text: "Surveys can never be used in an argument." },
        { id: "c", text: "The writer has an opinion, so every piece of evidence is useless." },
      ],
      answer: "a",
      evidence: [
        { id: "s4", why: "It names one school as the place of the trial.", optional: false },
        { id: "s6", why: "It says the survey was at the same school.", optional: false },
      ],
      misconceptions: [
        {
          pick: "b",
          tag: "absolute-rule",
          hint: "A survey can be strong evidence. The question is about what this particular evidence leaves open.",
        },
        {
          pick: "c",
          tag: "opinion-dismissal",
          hint: "Every argument has a position. Judge the evidence itself, not whether the writer has a view.",
        },
      ],
      hints: [
        "Look at where the measured results come from.",
        "Compare the place named in the trial sentence with the place in the survey sentence.",
        "Ask whether results from one place always apply to all places.",
      ],
      model:
        "Think-aloud: the trial and the survey are both at one school. A pattern at one school might not hold elsewhere, so the evidence has a limit.",
      explain:
        "Right: evidence from a single school may not apply to every school, which limits how far the argument can reach.",
      supports: S(
        {
          frames: ["Both the trial and the survey are at ___ school."],
          wordBank: ["one school", "limit", "every"],
        },
        { frames: ["A limitation is that the evidence comes from ___, so it may not ___."] },
        { frames: ["Because the evidence is drawn from ___, its reach is limited to ___."] },
      ),
    },
  ],
  claimPrompt:
    "How convincing is the whole editorial? Choose the evaluation your case notes support.",
  claim: {
    options: [
      {
        id: "c1",
        text: "The argument is partly convincing: its measured evidence and fair answer to an opposing view are strong, but an anecdote, an appeal to what everybody knows and an off-topic complaint weaken it.",
        strong: true,
      },
      {
        id: "c2",
        text: "The argument is completely convincing because it has many sentences and a clear opinion.",
        strong: false,
        tag: "length-as-strength",
        hint: "Strength comes from the quality of the evidence and reasoning, not from how long a text is or how sure it sounds.",
      },
      {
        id: "c3",
        text: "The argument is not convincing at all because the writer has an opinion.",
        strong: false,
        tag: "opinion-dismissal",
        hint: "Every argument has a position. The question is whether the evidence and reasoning support it, and your notes show some do.",
      },
      {
        id: "c4",
        text: "The argument cannot be evaluated because we do not know who the writer is.",
        strong: false,
        tag: "unknowable-excuse",
        hint: "You can still judge the evidence and reasoning that appear in the text.",
      },
    ],
    evidenceIds: ["s4", "s6", "s7", "s9", "s11"],
    evidenceMin: 3,
    why: "Your notes show measured evidence and a fair rebuttal, which are strengths, along with an anecdote and an off-topic sentence, which are weaknesses. An evaluation that names both is the one your notes support.",
    hints: [
      "An evaluation can say that an argument has strengths and weaknesses at the same time.",
      "Review your notes. Which choice would your strong evidence and your weak evidence both support?",
      "Eliminate any choice that judges the text by its length or by the fact that it has a position.",
    ],
    explainPrompt:
      "Evaluate the editorial: name one strength and one weakness and explain why each matters to how convincing it is.",
    revisionChecks: [
      {
        id: "because",
        label: "I used because, so or this shows to explain why each point matters.",
        test: { type: "contains-any", words: ["because", "so ", "this shows", "which means"] },
      },
      {
        id: "evidence",
        label: "I used words from my evidence.",
        test: { type: "contains-evidence" },
      },
      {
        id: "length",
        label: "My evaluation has at least 22 words.",
        test: { type: "min-words", n: 22 },
      },
      { id: "both", label: "I named both a strength and a weakness.", self: true },
    ],
  },
  explainFrames: {
    ee: ["One strength is ___.", "One weakness is ___."],
    dev: ["A strength is ___ because ___.", "A weakness is ___ because ___."],
    exp: ["The argument is strongest where ___, but weakest where ___, since ___."],
    br: [
      "Although the argument is persuasive in its use of ___, it is undermined by ___ because ___, so overall it is ___.",
    ],
  },
  reflection: {
    prompt: "How did you decide which evidence to trust and which to question?",
    frames: {
      ee: ["I trusted ___.", "I did not trust ___."],
      dev: ["I trusted ___ because ___.", "I questioned ___ because ___."],
      exp: ["I used ___ as a test, and ___ failed it because ___."],
      br: [
        "I applied tests of relevance, sufficiency and credibility, and the evidence that failed was ___ because ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

export default spread(DATA);
