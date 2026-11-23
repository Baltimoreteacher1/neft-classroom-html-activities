// Project: grade 8 ELA, argument and publication. Evaluate sources, build and revise a position paper, publish it and pitch it. Original.
// The starter sources are invented for practice; they describe an imaginary school and are not real data.
const lv = (score, label, descriptor) => ({ score, label, descriptor });
const tiers = (ee, dev, exp, br) => ({ ee, dev, exp, br });

const argumentFlow = {
  kind: "flow",
  w: 480,
  h: 200,
  alt: "Six steps in order: choose an issue, evaluate sources, plan the argument, draft, revise with a partner, publish and present.",
  steps: [
    { label: "Choose an issue" },
    { label: "Evaluate sources" },
    { label: "Plan the argument" },
    { label: "Draft" },
    { label: "Revise" },
    { label: "Publish and present" },
  ],
};

const claimMap = {
  kind: "table",
  w: 480,
  h: 270,
  alt: "Planning table for an argument with rows for the claim, three reasons with evidence, a counterclaim with a rebuttal, and the closing.",
  longDesc:
    "Claim: the position in one sentence. Reason one, reason two and reason three, each with evidence and a source. Counterclaim: the strongest opposing point. Rebuttal: why the claim still holds. Closing: what the reader should do or consider.",
  head: ["Part", "What goes here"],
  rows: [
    ["Claim", "Your position in one sentence"],
    ["Reason 1, 2 and 3", "Each reason with evidence and a source"],
    ["Counterclaim", "The strongest opposing point"],
    ["Rebuttal", "Why your claim still holds"],
    ["Closing", "What the reader should do or think about"],
  ],
};

const evidenceCheck = {
  kind: "table",
  w: 480,
  h: 250,
  alt: "Questions to test a piece of evidence: is it relevant, is it sufficient, is it from a credible source, and does the reasoning connect it to the claim.",
  longDesc:
    "Relevant: does it bear on the claim? Sufficient: is there enough of it, or is it one example? Credible: who produced it and how? Connected: does the reasoning explain how it supports the claim?",
  head: ["Test", "Ask yourself"],
  rows: [
    ["Relevant", "Does this bear on my claim?"],
    ["Sufficient", "Is there enough, or is it one example?"],
    ["Credible", "Who made it and how did they get it?"],
    ["Connected", "Does my reasoning link it to the claim?"],
  ],
};

export default {
  id: "position-paper-community-newsletter",
  kind: "project",
  title: "Letters That Count: A Position Paper for the Community Newsletter",
  subtitle: "Evaluate sources, argue a position, revise with a partner, publish and pitch",
  drivingQuestion:
    "How can a well-built argument change what a real audience decides, and how do we publish it so people will read and weigh it?",
  studentQuestion:
    "What makes evidence strong enough to change someone's mind, and how do I write a position that respects the other side and still holds up?",
  grade: "8",
  grades: ["7", "8"],
  band: "6-8",
  bands: ["6-8"],
  subject: "ela",
  subjects: ["ela"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to CCSS W.8.1, W.8.1a to W.8.1e, W.8.5, W.8.6, RI.8.8 and SL.8.4; not mapped to a district unit sequence. The starter sources describe an imaginary school and are invented for practice.",
  },
  standards: [
    "W.8.1",
    "W.8.1a",
    "W.8.1b",
    "W.8.1c",
    "W.8.1d",
    "W.8.1e",
    "W.8.5",
    "W.8.6",
    "RI.8.8",
    "SL.8.4",
  ],
  wida: {
    eld: ["ELD-LA", "ELD-SI"],
    klus: ["Argue", "Explain"],
    domains: ["Reading", "Writing", "Speaking"],
    cluster: "6-8",
  },
  sessions: 10,
  sessionMinutes: 50,
  duration: 500,
  intro:
    "The community newsletter has asked eighth graders for position papers on an issue that matters at school or nearby. Students choose an issue, gather and evaluate sources, build an argument with a claim, reasons and evidence, deal fairly with an opposing view, draft, revise with a partner, publish a clean final version in a class newsletter and give a short pitch. The project treats an argument as a tool for a real audience: the writing is judged by whether a reader could be reasonably persuaded and could check the evidence.",
  hook: "Read aloud the starter source about the survey (Source A) and ask: does this prove the library should stay open late? What else would you want to know?",
  contentTargets: [
    "I can evaluate whether an argument's reasoning is sound and whether its evidence is relevant and sufficient.",
    "I can write an argument with a clear claim, organized reasons, evidence from credible sources and a response to an opposing claim.",
    "I can use transitions and a formal style so the relationships among claim, reasons and evidence are clear.",
    "I can revise based on a partner's feedback and publish a polished version for a real audience.",
  ],
  languageTargets: [
    {
      function: "Argue a claim and answer a counterclaim",
      structure:
        "Although some argue that ___, ___ because ___. The evidence from ___ shows that ___, which means ___.",
      text: "I can concede a point and rebut it with evidence using although, however and because.",
    },
    {
      function: "Evaluate evidence",
      structure: "This evidence is (not) sufficient because ___. A stronger source would be ___.",
      text: "I can judge a source's evidence and say what would make it stronger.",
    },
  ],
  materials: [
    "The starter source set on this page (three short sources, invented for practice) printed for each student",
    "A choice of real issues at school or in the neighborhood that the class agrees to research",
    "Highlighters in two colors for claims and evidence",
    "Argument planning organizer, draft paper or a shared document",
    "Peer conference sheet",
    "Devices or a printer for formatting the class newsletter",
    "A rubric copy for each student",
  ],
  prep: [
    "Read the three starter sources. They describe an invented school. Source A (a survey) reaches only 120 students on one grade team, so it cannot speak for the whole school: use that as a lesson in sufficiency. Source C contains a transportation fact that complicates the survey result.",
    "Check the arithmetic students will meet: 78 of 120 is 65 percent. 31 of 120 is about 26 percent, a little more than one quarter. Five extra staff hours per week is the amount in Source B.",
    "Agree with students on the real issue they will write about: it should be something the audience can act on, with at least two credible sources and two sides worth considering. Avoid issues that target a person or a student. Provide a list of safe topics, such as lunch period length, recycling at school or a bus stop shelter.",
    "Decide where the newsletter will be published: a class website, a printed school newsletter or a shared document that can be sent to families. Plan to keep student names off the page unless families agree.",
    "Teach or review the terms before session 3: claim, counterclaim, rebuttal, relevant, sufficient and credible.",
  ],
  sources: [
    {
      id: "source-a",
      title: "Source A: Survey summary",
      note: "Invented for practice.",
      text: "A student group asked 120 students on one grade team whether they would use the school library for an extra hour after dismissal at least once a week. Seventy-eight said yes, which is 65 percent. The group also asked what they would do there. Most said homework and quiet reading.",
    },
    {
      id: "source-b",
      title: "Source B: Statement from the librarian",
      note: "Invented for practice.",
      text: "An extra hour each school day would add five hours of staff time each week. The library currently has one staff member, who must stay until the end of the day for other duties. Parent volunteers could cover two afternoons if they are trained and cleared to work in the school.",
    },
    {
      id: "source-c",
      title: "Source C: Front office memo on buses",
      note: "Invented for practice.",
      text: "Buses leave ten minutes after dismissal. In the survey group, 31 of the 120 students ride a bus. Students who ride a bus could not stay for the extra hour unless a late bus is added. The district has not approved a late bus for this school.",
    },
  ],
  facilitation: [
    {
      day: 1,
      title: "What makes an argument worth reading",
      checkpoint: "cp1",
      minutes: 50,
      teacher: [
        "Read Source A and ask what it proves and what it does not. Introduce the idea of an argument as a claim backed by reasons and evidence.",
        "Class brainstorms three real issues and votes on a short list. Each student picks one to explore.",
      ],
      students: [
        "Annotate Source A for claim and evidence.",
        "Write the issue they want to argue.",
      ],
      watchFor: "Treating a popular opinion as proof. Ask, 'How many people, and who were they?'",
    },
    {
      day: 2,
      title: "Evaluate sources with the evidence check",
      checkpoint: "cp1",
      minutes: 50,
      teacher: [
        "Teach the evidence check: relevant, sufficient, credible, connected. Model it with Source B.",
        "Students evaluate Source C and compare it with Source A.",
      ],
      students: [
        "Complete an evidence check for each source.",
        "Write one sentence: this source is (not) sufficient because ___.",
      ],
      watchFor:
        "Judging a source by whether they agree with it. Ask them to separate the quality of evidence from the conclusion.",
    },
    {
      day: 3,
      title: "Research your own issue",
      checkpoint: "cp1",
      minutes: 50,
      teacher: [
        "Students find at least two credible sources about their real issue, using the library, school staff or trusted sites. Teach how to note the author, date and purpose.",
        "Students log evidence in the evidence log with the source named.",
      ],
      students: ["Find two sources.", "Log three pieces of evidence with sources."],
      watchFor: "Quotes with no source. Require a source line on every piece of evidence.",
    },
    {
      day: 4,
      title: "Claim, reasons and counterclaim",
      checkpoint: "cp2",
      minutes: 50,
      teacher: [
        "Model a claim on the starter issue: it should take a position that someone could argue against. Build three reasons and a counterclaim from the three sources together.",
        "Students plan their own claim, reasons and counterclaim in the organizer.",
      ],
      students: [
        "Write a claim.",
        "Plan three reasons with evidence and one counterclaim with a rebuttal.",
      ],
      watchFor: "Claims that are facts ('The library is open until 3'). A claim must be arguable.",
    },
    {
      day: 5,
      title: "Draft the introduction and reasons",
      checkpoint: "cp3",
      minutes: 50,
      teacher: [
        "Model an introduction that hooks the reader, states the claim and previews the reasons. Show how to write a body paragraph with a reason, evidence, a source and a sentence of reasoning.",
        "Students draft the introduction and two body paragraphs.",
      ],
      students: ["Draft the introduction and two paragraphs."],
      watchFor:
        "Evidence dropped into a paragraph without reasoning. Ask, 'So what does this show?'",
    },
    {
      day: 6,
      title: "Counterclaim, rebuttal and conclusion",
      checkpoint: "cp3",
      minutes: 50,
      teacher: [
        "Teach transitions that link claims and counterclaims (however, although, even so). Model a counterclaim paragraph that is fair to the other side and a rebuttal that uses evidence.",
        "Students finish the draft with a concluding statement that follows from the argument.",
      ],
      students: [
        "Draft the counterclaim, rebuttal and conclusion.",
        "Highlight claim and evidence in two colors.",
      ],
      watchFor: "Straw-man counterclaims. Ask whether the other side would recognize its argument.",
    },
    {
      day: 7,
      title: "Peer conference",
      checkpoint: "cp4",
      minutes: 50,
      teacher: [
        "Partners read drafts and use the conference sheet. Introduce three fallacies to look for: hasty generalization, bandwagon and false dilemma.",
        "Partners write one strong point and two suggestions.",
      ],
      students: [
        "Give feedback with the frames.",
        "Highlight a possible fallacy and ask a question.",
      ],
      watchFor: "Feedback about spelling only. Redirect to claim, evidence and reasoning first.",
    },
    {
      day: 8,
      title: "Revise for evidence and style",
      checkpoint: "cp4",
      minutes: 50,
      teacher: [
        "Students revise using the feedback. Review formal style: no slang, no second person, precise words.",
        "Students complete a revision log with at least three changes and the reason for each.",
      ],
      students: ["Revise the draft.", "Fill in the revision log."],
      watchFor: "Revisions that only fix spelling. Point to the rubric on evidence and reasoning.",
    },
    {
      day: 9,
      title: "Edit, format and publish",
      checkpoint: "cp5",
      minutes: 50,
      teacher: [
        "Students edit for conventions and format the final version for the newsletter with a title, a byline (first name or initials if families agree) and a pull quote.",
        "Assemble the class newsletter on a shared document or print.",
      ],
      students: ["Edit and format.", "Add a title and a pull quote."],
      watchFor: "Names and private details. Check bylines against family permission.",
    },
    {
      day: 10,
      title: "Pitch to the audience",
      checkpoint: "cp5",
      minutes: 50,
      teacher: [
        "Students give a two-minute pitch of their claim and strongest evidence to the audience, who respond with a question.",
        "Close with self-assessment and a discussion: did anything change your own view?",
      ],
      students: ["Present.", "Respond to a question with evidence."],
      watchFor: "Reading the paper aloud. Pitch the argument, do not recite it.",
    },
  ],
  studentDirections: [
    "Read the starter sources. Highlight the claim in one color and the evidence in another.",
    "Use the evidence check on every source: relevant, sufficient, credible and connected.",
    "Choose a real issue the audience can act on. Find at least two credible sources.",
    "Plan a claim, three reasons with evidence, a counterclaim and a rebuttal.",
    "Draft your position paper. Use transitions and a formal style.",
    "Trade drafts with a partner. Use the conference sheet to give and get feedback.",
    "Revise your draft and write what you changed and why in the revision log.",
    "Edit, format and publish your paper in the class newsletter.",
    "Pitch your claim and strongest evidence in two minutes and answer a question.",
  ],
  checkpoints: [
    {
      id: "cp1",
      title: "Issue, source evaluation and evidence log",
      days: "Sessions 1 to 3",
      evidence:
        "An evidence check for each starter source, a chosen issue and an evidence log with at least three pieces of evidence from two credible sources.",
      prompt: "Evaluate each source. Choose your issue. Log evidence with the source named.",
      teacherLook: [
        "Source A is judged as limited because it reached one grade team (120 students) and the question was about use, not the whole school.",
        "Each piece of evidence names its source.",
        "The evidence check uses all four tests.",
      ],
      tool: null,
    },
    {
      id: "cp2",
      title: "Argument plan",
      days: "Session 4",
      evidence:
        "A planning organizer with an arguable claim, three reasons with evidence, a counterclaim and a rebuttal.",
      prompt: "Fill in the argument organizer.",
      teacherLook: [
        "The claim takes a position that someone could oppose.",
        "Each reason has evidence with a source.",
        "The counterclaim is fair and the rebuttal uses evidence.",
      ],
      tool: null,
    },
    {
      id: "cp3",
      title: "Draft",
      days: "Sessions 5 and 6",
      evidence:
        "A full draft with an introduction, at least three reasons with evidence, a counterclaim and rebuttal, and a concluding statement.",
      prompt: "Write a full draft of your position paper.",
      teacherLook: [
        "The draft states the claim in the introduction.",
        "Each body paragraph includes reasoning, not only evidence.",
        "The conclusion follows from the argument.",
      ],
      tool: null,
    },
    {
      id: "cp4",
      title: "Peer conference and revision",
      days: "Sessions 7 and 8",
      evidence:
        "A completed peer conference sheet from a partner and a revision log with at least three changes and the reason for each.",
      prompt: "Give your partner feedback. Revise your own draft and fill in the revision log.",
      teacherLook: [
        "Feedback names a strength and two suggestions about claim, evidence or reasoning.",
        "The revision log shows changes beyond spelling.",
        "At least one revision strengthens evidence or reasoning.",
      ],
      tool: null,
    },
    {
      id: "cp5",
      title: "Publication and pitch",
      days: "Sessions 9 and 10",
      evidence:
        "A formatted, edited final paper in the class newsletter and a two-minute pitch with an answer to an audience question.",
      prompt: "Publish your paper. Pitch your claim and your strongest evidence.",
      teacherLook: [
        "The final copy is edited and formatted for readers.",
        "The pitch states the claim and one strong piece of evidence.",
        "The answer to the question uses evidence.",
      ],
      tool: null,
    },
  ],
  visuals: [
    {
      id: "flow",
      title: "From issue to publication",
      caption: "Each step builds on the one before it.",
      visual: argumentFlow,
    },
    {
      id: "evidence",
      title: "The evidence check",
      caption: "Run every piece of evidence through these four tests.",
      visual: evidenceCheck,
    },
    {
      id: "plan",
      title: "The argument plan",
      caption: "Fill in each part before you draft.",
      visual: claimMap,
    },
  ],
  organizers: [
    {
      template: "writing-organizer",
      use: "Plan the argument (checkpoint 2); choose Argue as the purpose.",
    },
    { template: "cer", use: "Claim, evidence and reasoning for a body paragraph (checkpoint 3)." },
    { template: "source-analysis", use: "Evaluate each source (checkpoint 1)." },
    { template: "gallery-walk", use: "Newsletter gallery with reader feedback (checkpoint 5)." },
  ],
  vocab: {
    entries: [
      {
        id: "claim",
        word: "claim",
        def: "A position you argue is true or right.",
        example: "My claim is that the library should open later.",
      },
      {
        id: "counterclaim",
        word: "counterclaim",
        def: "A claim that opposes your own.",
        example: "One counterclaim is that buses leave too early.",
      },
      {
        id: "rebuttal",
        word: "rebuttal",
        def: "A response that shows why a counterclaim does not defeat your claim.",
        example: "My rebuttal adds a late bus.",
      },
      {
        id: "relevant",
        word: "relevant",
        def: "Connected to the claim.",
        example: "The survey result is relevant to use.",
      },
      {
        id: "sufficient",
        word: "sufficient",
        def: "Enough to support the claim.",
        example: "One group of 120 is not sufficient for a whole school.",
      },
      {
        id: "credible",
        word: "credible",
        def: "Trustworthy because of who made it and how.",
        example: "A librarian's statement about staffing is credible.",
      },
      {
        id: "reasoning",
        word: "reasoning",
        def: "The explanation that connects evidence to a claim.",
        example: "My reasoning explains why the number matters.",
      },
      {
        id: "fallacy",
        word: "fallacy",
        def: "A mistake in reasoning that makes an argument weak.",
        example: "Everyone says so is the bandwagon fallacy.",
      },
      {
        id: "formal-style",
        word: "formal style",
        def: "Writing that is precise and serious and avoids slang.",
        example: "A position paper uses formal style.",
      },
    ],
  },
  supports: {
    ee: {
      directions:
        "Work with a partner. Read each source aloud together. Use the word bank and the starters to plan and write short, clear sentences.",
      frames: ["I think ___.", "One reason is ___.", "The source says ___."],
      wordBank: ["claim", "reason", "evidence", "source", "agree", "disagree", "because", "survey"],
      oral: "Partner A states a claim. Partner B asks 'Why?' and Partner A gives a reason. Switch.",
    },
    dev: {
      directions:
        "Use the frames to build each part of your argument. Say each sentence aloud before you write it.",
      frames: [
        "I believe that ___ because ___.",
        "According to ___, ___. This shows that ___.",
        "Some people say ___. However, ___.",
      ],
      wordBank: [
        "claim",
        "counterclaim",
        "evidence",
        "relevant",
        "sufficient",
        "credible",
        "however",
      ],
      oral: "Tell a partner your claim and your strongest reason in two sentences.",
    },
    exp: {
      directions:
        "Write with precise transitions. Use the frames only where you need them and vary your sentence openings.",
      frames: [
        "Although some argue that ___, ___ because ___.",
        "This evidence is (not) sufficient because ___.",
      ],
      wordBank: ["rebuttal", "reasoning", "fallacy", "concede", "in contrast", "furthermore"],
      oral: "Debate your claim with a partner who takes the opposite side and then switch.",
    },
    br: {
      directions:
        "Write in a formal style with sophisticated reasoning. Anticipate the strongest counterclaim and show why the evidence still supports your claim.",
      frames: [],
      wordBank: ["qualify", "premise", "warrant", "concession", "nuance", "implication"],
      oral: "Critique a published editorial for its evidence and reasoning and propose a stronger version.",
    },
  },
  rubric: {
    criteria: [
      {
        id: "claim-reasons",
        label: "Claim and reasons",
        levels: [
          lv(
            4,
            "Extending",
            "An arguable, precise claim with three distinct reasons organized for impact and a qualification where needed.",
          ),
          lv(3, "Meeting", "An arguable claim with three reasons in a logical order."),
          lv(2, "Approaching", "A claim with one or two reasons, or reasons that overlap."),
          lv(1, "Beginning", "A topic or a fact in place of a claim."),
        ],
      },
      {
        id: "evidence-reasoning",
        label: "Evidence and reasoning",
        levels: [
          lv(
            4,
            "Extending",
            "Relevant, sufficient evidence from credible sources, each with reasoning that explains how it supports the claim.",
          ),
          lv(
            3,
            "Meeting",
            "Relevant evidence from two credible sources with reasoning for most reasons.",
          ),
          lv(2, "Approaching", "Evidence is given but reasoning is missing, or evidence is thin."),
          lv(1, "Beginning", "Opinions without evidence or sources."),
        ],
      },
      {
        id: "counterclaim",
        label: "Counterclaim and rebuttal",
        levels: [
          lv(
            4,
            "Extending",
            "Represents the strongest opposing view fairly and rebuts it with evidence.",
          ),
          lv(3, "Meeting", "Acknowledges a real counterclaim and responds with a reason."),
          lv(
            2,
            "Approaching",
            "Mentions an opposing view without a real response, or the view is weak.",
          ),
          lv(1, "Beginning", "No opposing view."),
        ],
      },
      {
        id: "style-cohesion",
        label: "Style, cohesion and conclusion",
        levels: [
          lv(
            4,
            "Extending",
            "Formal style, precise transitions that show relationships and a conclusion that adds a final insight.",
          ),
          lv(
            3,
            "Meeting",
            "Formal style, clear transitions and a conclusion that follows from the argument.",
          ),
          lv(
            2,
            "Approaching",
            "Uneven style or few transitions, or the conclusion repeats the introduction.",
          ),
          lv(1, "Beginning", "Informal style and no conclusion."),
        ],
      },
      {
        id: "revision-publication",
        label: "Revision, publication and pitch",
        levels: [
          lv(
            4,
            "Extending",
            "Revisions change the argument, the published piece is polished and the pitch handles a question with evidence.",
          ),
          lv(
            3,
            "Meeting",
            "The revision log shows at least three substantive changes, the paper is edited and published and the pitch states the claim and evidence.",
          ),
          lv(
            2,
            "Approaching",
            "Revisions are mostly surface edits, or the pitch recites the paper.",
          ),
          lv(1, "Beginning", "Little revision or an unpublished draft."),
        ],
      },
    ],
  },
  selfAssessment: [
    "I can tell whether evidence is relevant, sufficient and credible.",
    "I can write a claim that someone could argue against.",
    "I can answer an opposing view fairly and with evidence.",
    "I can revise for evidence and reasoning, not only for spelling.",
    "I can pitch my argument to a real audience.",
  ],
  peerFeedback: {
    structure: [
      "The reviewer reads the whole draft once without writing.",
      "The reviewer highlights the claim, then each reason and its evidence.",
      "The reviewer gives one strength, two suggestions about evidence or reasoning and one question.",
      "The author answers the question and adds a change to the revision log.",
    ],
    frames: tiers(
      ["Your claim is ___.", "I liked ___.", "I have a question about ___."],
      ["Your strongest reason is ___ because ___.", "One suggestion is ___."],
      [
        "Your evidence for ___ is relevant, but it may not be sufficient because ___. Could you add ___?",
      ],
      [
        "Your rebuttal depends on ___, which a skeptical reader could dispute. A stronger warrant would be ___.",
      ],
    ),
  },
  revision: {
    when: "After the peer conference (session 7) and again after the pitch audience gives questions (session 10).",
    steps: [
      "Read your partner's suggestions and mark the two that most improve the argument.",
      "Strengthen one piece of evidence or add reasoning where a reader would ask 'so what?'.",
      "Check your counterclaim: would a person on the other side recognize their view?",
      "Record each change and the reason in the revision log.",
    ],
    evidence:
      "A revision log with at least three changes, at least one about evidence or reasoning.",
  },
  finalProduct: {
    title: "A published position paper and a two-minute pitch",
    description:
      "A revised position paper of about 400 to 600 words, published in the class newsletter with a title and a pull quote, and a two-minute pitch to an audience.",
    parts: [
      "An evidence log with sources",
      "An argument plan",
      "A revised and edited position paper",
      "A revision log",
      "A newsletter layout with a title and a pull quote",
      "A two-minute pitch",
    ],
    successCriteria: [
      "The claim is arguable and the evidence names its source.",
      "The paper responds to an opposing view.",
      "The published copy is edited and readable.",
    ],
    audience: "Families, staff and neighbors who read the community newsletter",
  },
  tools: [],
  studioTools: [],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
