// argument-builder: build a claim, text evidence and reasoning from three sources about an imagined school trial (RI.7.8, W.7.1, RI.7.1).
const V = "g7-ela-evaluate-an-argument";
const BY = "Written for this activity; the school and its numbers are imagined for practice.";

export default {
  id: "g7-ela-library-lunch-argument",
  engine: "argument-builder",
  title: "Build the argument: a library open at lunch",
  grade: "7",
  band: "6-8",
  subject: "ela",
  lessonId: "g7-ela-evaluate-an-argument",
  standards: ["RI.7.8", "RI.7.1", "W.7.1"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.7.8, RI.7.1 and W.7.1; not mapped to a district unit sequence. The sources describe an imagined school.",
  },
  vocabIds: [
    `${V}:claim`,
    `${V}:evidence`,
    `${V}:relevant`,
    `${V}:sufficient`,
    `${V}:counterclaim`,
    `${V}:rebuttal`,
  ],
  minutes: 25,
  intro:
    "Three short sources describe a trial at an imagined school. Choose a claim the sources can support, select strong evidence from more than one source, explain your reasoning and answer the other side.",
  format: "ela",
  question:
    "Should Cedar Hill Middle School keep its library open during lunch after the four-week trial, and if so, under what conditions?",
  sources: [
    {
      id: "s1",
      title: "Library lunch trial log",
      byline: BY,
      text: "Cedar Hill Middle School opened its library during lunch for four weeks as a trial. Staff counted visitors each day. An average of 64 students visited during each lunch period, out of about 480 enrolled. Visits were highest on Mondays and on days when projects were due. About one in four visitors borrowed a book, and most of the others worked on computers or studied quietly. Only one adult, the school librarian, supervised the library during the trial.",
    },
    {
      id: "s2",
      title: "Librarian's memo",
      byline: BY,
      text: "I support keeping the library open at lunch, but the trial showed a staffing problem. I supervised alone from 11:15 until 1:00 and could not help students find books or repair damaged ones. Several times a line formed at the checkout desk while I answered computer questions. I did not take a break on any trial day, and I was exhausted by the end of the second week. The fiction shelves were replaced two years ago and look good. If the library stays open at lunch, a second adult should be assigned to it.",
    },
    {
      id: "s3",
      title: "Student council survey summary",
      byline: BY,
      text: "The student council surveyed 120 seventh graders in homeroom. Students were asked what they would do at lunch if the library were open. Seventy-eight said they would visit at least once a week. Thirty said they would still prefer to spend lunch outside or in the cafeteria. Twelve were not sure. Many written comments said students want a quiet place to finish homework and use computers.",
    },
  ],
  claims: [
    {
      id: "c1",
      text: "Cedar Hill should keep the library open during lunch, because many students use it and say they want it.",
      strong: true,
      why: "This claim answers the question, can be argued against, and the sources give counts that bear on student use and interest.",
    },
    {
      id: "c2",
      text: "Cedar Hill should keep the library open at lunch only if it assigns a second adult, because one supervisor could not run it well during the trial.",
      strong: true,
      why: "This claim answers the question with a condition, and two sources describe what happened when one adult supervised.",
    },
    {
      id: "c3",
      text: "The library was open at lunch for four weeks.",
      strong: false,
      why: "This is a fact stated in the first source. It does not answer whether the library should stay open, so nobody could argue against it.",
    },
    {
      id: "c4",
      text: "Libraries matter more than any other room in a school.",
      strong: false,
      why: "This claim is too broad for these sources. They say nothing about other rooms, so no card could support it.",
    },
  ],
  minEvidence: 2,
  maxEvidence: 4,
  evidence: [
    {
      id: "e1",
      sourceId: "s1",
      text: "An average of 64 students visited the library during each lunch period of the trial.",
      supports: "c1",
      quality: "strong",
      feedback:
        "Strong: a measured count from the trial log that speaks directly to how many students use the library.",
    },
    {
      id: "e2",
      sourceId: "s3",
      text: "In the council survey, 78 of 120 seventh graders said they would visit at least once a week.",
      supports: "c1",
      quality: "strong",
      feedback:
        "Strong: a specific survey result from a different source that shows student interest.",
    },
    {
      id: "e3",
      sourceId: "s1",
      text: "Visits were highest on Mondays and on days when projects were due.",
      supports: "c1",
      quality: "weak",
      feedback:
        "Weak: it tells when students came, not how many came or whether the library should stay open, so it only loosely supports the claim.",
    },
    {
      id: "e4",
      sourceId: "s2",
      text: "The librarian supervised alone from 11:15 until 1:00 and could not help students find books or repair damaged ones.",
      supports: "c2",
      quality: "strong",
      feedback:
        "Strong: a specific account from the person who supervised, naming what could not be done.",
    },
    {
      id: "e5",
      sourceId: "s1",
      text: "Only one adult, the librarian, supervised the library during the trial.",
      supports: "c2",
      quality: "strong",
      feedback: "Strong: the trial log confirms the staffing level independently of the memo.",
    },
    {
      id: "e6",
      sourceId: "s2",
      text: "The librarian said she was exhausted by the end of the second week.",
      supports: "c2",
      quality: "weak",
      feedback:
        "Weak: it describes one person's feeling. It does not show that the library could not run well.",
    },
    {
      id: "e7",
      sourceId: "s2",
      text: "The fiction shelves were replaced two years ago.",
      supports: null,
      quality: "irrelevant",
      feedback:
        "Irrelevant: the detail is true but has nothing to do with whether the library should stay open at lunch.",
    },
    {
      id: "e8",
      sourceId: "s1",
      text: "About one in four visitors borrowed a book.",
      supports: "c1",
      quality: "weak",
      feedback:
        "Weak: it shows what some visitors did, but it does not show how many students want the library open.",
    },
  ],
  counterclaims: {
    c1: "Some people argue that lunch is the only break students have to rest and spend time with friends, and that a library with rules would take that away.",
    c2: "Others argue that the library should stay open exactly as it was, because even with one adult it reached dozens of students every day.",
  },
  counter: {
    requiredTiers: ["exp", "br"],
    optionalTiers: ["dev"],
    frames: {
      acknowledge: {
        ee: ["Some people think ___."],
        dev: ["Some people argue that ___, and that is a fair concern."],
        exp: ["I understand why some people argue that ___."],
        br: [],
      },
      rebut: {
        ee: ["But ___."],
        dev: ["However, the sources show that ___, so ___."],
        exp: ["Even so, the evidence suggests ___, which means ___."],
        br: [],
      },
    },
  },
  reasoningFrames: {
    ee: ["This shows ___ because ___."],
    dev: ["This evidence supports my claim because ___."],
    exp: ["This evidence shows that ___, which supports my claim because ___."],
    br: ["Because ___, this evidence demonstrates that ___, so ___."],
  },
  hints: {
    claim: [
      "A strong claim answers the question and is something a reasonable person could argue against.",
      "Check which choices only report a fact from a source, and which are too broad for what these three sources describe.",
      "Pick the claim that the sources could back up with counts or accounts from the trial.",
    ],
    evidence: [
      "Look for cards you could point to in a source, such as a count, a survey result or an account from someone who was there.",
      "Make sure each card supports the claim you chose, not the opposing choice.",
      "Choose cards from more than one source, and skip any card that is true but about something else.",
    ],
    reasoning: [
      "A reasoning sentence explains why the card helps your claim, not just what the card says.",
      "Use a connecting word such as because, so or this shows to join the card to your claim.",
      "Name an idea from your claim and an idea from the card in the same sentence.",
    ],
  },
  model: {
    question: "Should our class keep a weekly device-free reading hour?",
    claim: "Our class should keep a weekly device-free reading hour.",
    strong: {
      text: "In a log kept for six weeks, students finished more pages during device-free hours than during other reading times, which shows the hour helps students read more.",
      why: "It cites a measured result from a specific source and says how the result connects to the claim.",
    },
    weak: {
      text: "Reading is fun and I like it when the room is quiet.",
      why: "It gives a personal feeling instead of evidence, so a reader has nothing to check.",
    },
    tip: "Before you use a piece of evidence, ask whether a reader could check it in the source.",
  },
  revision: {
    checks: [
      { id: "claim-clear", label: "My claim answers the question and could be argued against." },
      {
        id: "evidence-source",
        label: "My strong evidence comes from the sources and supports my claim.",
      },
      {
        id: "evidence-variety",
        label: "My strong evidence comes from at least two different sources.",
      },
      {
        id: "reasoning-why",
        label: "Each piece of evidence has a reason that explains how it supports my claim.",
      },
      {
        id: "counterclaim",
        label: "I acknowledged the other side and answered it with a reason.",
        tiers: ["dev", "exp", "br"],
      },
      { id: "read-aloud", label: "I read my argument aloud and it makes sense to a listener." },
    ],
  },
  supports: {
    ee: {
      directions:
        "Read each source once, then listen to it. Pick one claim, then pick the cards that match it.",
      wordBank: ["claim", "evidence", "source", "because", "shows"],
      frames: ["I think ___ because ___."],
      oral: "Say your claim to a partner before you choose cards.",
    },
    dev: {
      directions: "Choose cards from at least two sources. Then explain each one with because.",
      wordBank: ["relevant", "enough", "supports", "opposing view"],
    },
    exp: { directions: "Weigh the cards. Say why you left out the weaker ones." },
    br: {},
  },
  reflection: {
    prompt:
      "Which piece of evidence was hardest to judge, and how did you decide whether to use it?",
    frames: {
      ee: ["The hardest card was ___.", "I used it because ___."],
      dev: ["I decided about ___ by asking whether it was ___.", "I left out ___ because ___."],
      exp: ["I weighed ___ against ___ and kept the one that ___."],
      br: ["I judged each card for relevance, sufficiency and credibility; ___ failed on ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
