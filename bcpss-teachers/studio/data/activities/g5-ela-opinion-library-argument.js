// Argument Builder (ELA): build an opinion with reasons and evidence from four short original sources. All sources are invented for practice.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });
const BY = "Written for this activity";

export default {
  id: "g5-ela-opinion-library-argument",
  engine: "argument-builder",
  title: "Build an Opinion: Late Library Hours",
  grade: "5",
  band: "3-5",
  subject: "ela",
  lessonId: "g5-ela-opinion-writing-reasons-evidence",
  standards: ["W.5.1", "W.5.1b", "W.5.1c"],
  minutes: 25,
  intro:
    "A school is deciding whether to keep its library open after dismissal. Read the sources, choose an opinion you can prove, pick the best evidence, and explain how the evidence supports your opinion.",
  format: "ela",
  question:
    "Should the school library stay open for 30 minutes after dismissal on two days each week?",
  sources: [
    {
      id: "s1",
      title: "Library desk log",
      byline: BY,
      text: "For eight weeks in the fall, the library closed at dismissal. During that time, the front desk wrote down every student who asked to borrow a book after closing. The list had 46 requests. Then the librarian tested later hours on two Wednesdays by staying open 30 minutes after dismissal. During those extra 30 minutes, 31 students checked out books. In the whole last hour of a normal Wednesday, only 12 students checked out books.",
    },
    {
      id: "s2",
      title: "Transportation office notice",
      byline: BY,
      text: "Buses 4, 9 and 12 leave 10 minutes after dismissal. The other nine buses leave 35 minutes after dismissal, so riders on those buses already wait in the building. Students who walk home or ride Buses 4, 9 or 12 would need a family member to pick them up if they stayed later. This schedule is the same every day of the week. No extra buses are planned this year.",
    },
    {
      id: "s3",
      title: "Student comment cards",
      byline: BY,
      text: 'Card A: "I wish the library was open longer." Card B: "I do not like to read, so I never go to the library." Card C: "The cafeteria makes the best pizza on Fridays." Card D: "My cousin says libraries are cool." The cards were collected in a box outside the front office. Students could write anything they wanted on them, and about forty cards were collected in all. These four were picked at random.',
    },
    {
      id: "s4",
      title: "Note from the librarian",
      byline: BY,
      text: "The library has one full-time librarian and one part-time assistant. The assistant leaves at dismissal. School rules say that two adults must be in the room whenever students are in the library. The library holds about 6,000 books. The librarian says the library could not stay open after dismissal without a second adult in the room.",
    },
  ],
  claims: [
    {
      id: "c1",
      text: "The library should stay open for 30 minutes after dismissal on two days each week.",
      strong: true,
      why: "This claim answers the question, you can argue for it, and the sources give facts that support it.",
    },
    {
      id: "c2",
      text: "The library should stay closed after dismissal for now.",
      strong: true,
      why: "This claim answers the question with the other opinion, and the sources contain facts that support it.",
    },
    {
      id: "c3",
      text: "Libraries are the best place in the whole school.",
      strong: false,
      why: "This is a big opinion that does not answer the question, and these sources cannot prove it.",
    },
    {
      id: "c4",
      text: "The library closes at dismissal right now.",
      strong: false,
      why: "This is a fact, not an opinion. It describes what happens now but does not say what should happen.",
    },
  ],
  evidence: [
    {
      id: "e1",
      sourceId: "s1",
      text: "During the eight-week count, 46 students asked to borrow a book after the library had closed.",
      supports: "c1",
      quality: "strong",
      feedback:
        "Strong: a counted result from a school record that shows students want to use the library later.",
    },
    {
      id: "e2",
      sourceId: "s1",
      text: "In the extra 30 minutes on two Wednesdays, 31 students checked out books, but only 12 did in the whole last hour of a normal Wednesday.",
      supports: "c1",
      quality: "strong",
      feedback: "Strong: it compares numbers from a real test of the idea.",
    },
    {
      id: "e3",
      sourceId: "s2",
      text: "Nine of the twelve buses leave 35 minutes after dismissal, so those riders are already waiting.",
      supports: "c1",
      quality: "strong",
      feedback: "Strong: a schedule fact that shows many students are at school anyway.",
    },
    {
      id: "e4",
      sourceId: "s2",
      text: "Buses 4, 9 and 12 leave 10 minutes after dismissal, so those riders could not stay for a 30-minute session.",
      supports: "c2",
      quality: "strong",
      feedback: "Strong: a schedule fact that shows some students could not take part.",
    },
    {
      id: "e5",
      sourceId: "s4",
      text: "School rules require two adults in the library, and the assistant leaves at dismissal, so the librarian says it could not stay open without a second adult.",
      supports: "c2",
      quality: "strong",
      feedback: "Strong: a rule and a statement from the person who runs the library.",
    },
    {
      id: "e6",
      sourceId: "s3",
      text: 'One comment card says, "I wish the library was open longer."',
      supports: "c1",
      quality: "weak",
      feedback:
        "Weak: it matches the claim, but it is one person's feeling with no facts or numbers.",
    },
    {
      id: "e7",
      sourceId: "s3",
      text: 'One comment card says, "I do not like to read, so I never go to the library."',
      supports: "c2",
      quality: "weak",
      feedback: "Weak: it is one person's opinion and does not tell us about the whole school.",
    },
    {
      id: "e8",
      sourceId: "s3",
      text: "One comment card says the cafeteria makes the best pizza on Fridays.",
      supports: null,
      quality: "irrelevant",
      feedback: "Not relevant: it may be true, but it is not about library hours.",
    },
    {
      id: "e9",
      sourceId: "s4",
      text: "The library holds about 6,000 books.",
      supports: null,
      quality: "irrelevant",
      feedback:
        "Not relevant: it is true, but the number of books does not help answer whether to stay open later.",
    },
  ],
  minEvidence: 2,
  counterclaims: {
    c1: "Some people say the library should stay closed after dismissal because it would need a second adult in the room and some students have to leave quickly for their buses.",
    c2: "Other people say the library should open later because many students are asking for it and are already waiting for their buses anyway.",
  },
  counter: {
    frames: {
      acknowledge: fr(
        ["Some people think ___ ."],
        ["Some people think ___ because ___ ."],
        ["Some people may argue that ___ , and that is a fair point because ___ ."],
        ["It is true that ___ ; however, ___ ."],
      ),
      rebut: fr(
        ["But ___ ."],
        ["But I still think ___ because ___ ."],
        ["However, my evidence shows that ___ , so ___ ."],
        [],
      ),
    },
  },
  reasoningFrames: fr(
    ["This shows ___ because ___ .", "This is important because ___ ."],
    ["This evidence supports my claim because ___ .", "This shows that ___ , so ___ ."],
    ["This evidence supports my claim because ___ , which means ___ ."],
    [],
  ),
  linkWords: ["for example", "for this reason", "in addition"],
  hints: {
    claim: [
      "A strong claim answers the question with a clear opinion.",
      "Check each claim: could you prove it using these sources?",
      "Some claims are facts or are too big for these sources to prove.",
    ],
    evidence: [
      "Look for cards that give a number, a schedule or a rule.",
      "A strong card backs the claim you chose and comes from a source, not just a feeling.",
      "Try to choose cards from more than one source, and skip cards about something else.",
    ],
    reasoning: [
      "Say what the evidence shows in your own words.",
      "Use because or so to link the evidence to your claim.",
      "Ask yourself why this fact makes your opinion easier to believe.",
    ],
  },
  model: {
    question: "Should the garden club add a rain barrel next to the greenhouse?",
    claim: "The garden club should add a rain barrel.",
    strong: {
      text: "The garden club should add a rain barrel because the club's own water bill rose each month in spring and a barrel could cover some of the plants' needs.",
      why: "It gives an opinion, a fact from a record and a reason that connects them.",
    },
    weak: {
      text: "The garden club should add a rain barrel because barrels are cool and plants are nice.",
      why: "It gives only feelings and no fact or reason that connects to the question.",
    },
    tip: "Check every piece of evidence: does it come from a source, and does it really help your claim?",
  },
  revision: {
    checks: [
      { id: "claim-clear", label: "My claim answers the question with a clear opinion." },
      { id: "evidence-source", label: "My evidence comes from the sources and backs my claim." },
      { id: "evidence-variety", label: "My evidence comes from more than one source." },
      { id: "reasoning-why", label: "I explained why each piece of evidence supports my claim." },
      {
        id: "counterclaim",
        label: "I answered a different opinion with respect and a reason.",
        tiers: ["dev", "exp", "br"],
      },
      {
        id: "order",
        label:
          "I put my strongest reason first and linked my reasons with words such as for example or in addition.",
      },
    ],
  },
  supports: {
    ee: {
      directions:
        "Read one source at a time. Say what each source is about before you choose evidence. Use the frames to build each sentence.",
      frames: ["My opinion is ___ .", "One reason is ___ ."],
      wordBank: ["opinion", "reason", "evidence", "because", "so"],
      oral: "Tell a partner your opinion and one reason before you write.",
    },
    dev: {
      frames: ["I think ___ because ___ .", "One piece of evidence is ___ ."],
      wordBank: ["claim", "evidence", "support"],
    },
    exp: { frames: ["My evidence supports my claim because ___ ."] },
    br: {},
  },
  reflection: {
    prompt:
      "Which piece of evidence was strongest, and how do you know it was stronger than the others?",
    frames: fr(
      ["The best evidence was ___ .", "It shows ___ ."],
      ["The strongest evidence was ___ because ___ ."],
      ["I chose ___ as the strongest evidence because it ___ , while ___ only ___ ."],
      [
        "The evidence that carried the most weight was ___ because ___ ; the others were weaker because ___ .",
      ],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
